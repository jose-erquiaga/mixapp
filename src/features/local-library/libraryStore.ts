/**
 * Catálogo persistente de canciones en IndexedDB (issue #10).
 *
 * BD separada (`mixapp-biblioteca`) para no interferir con la persistencia de
 * proyecto existente. Almacén único `canciones`, indexado por songId (hash
 * SHA-256 del contenido del archivo).
 *
 * Cada registro guarda el audio (File), metadatos y los bloques marcados por
 * el usuario. El guardado es manual (botón "Guardar en biblioteca").
 */

import { Block } from '@/types/model';

const DB_NOMBRE = 'mixapp-biblioteca';
const DB_VERSION = 1;
const STORE_CANCIONES = 'canciones';

export interface CancionGuardada {
  /** Hash SHA-256 del archivo (= Track.id = Track.fileRef). */
  id: string;
  nombre: string;
  bpm: number;
  sampleRate: number;
  duracionSeg: number;
  /** Archivo de audio original. */
  file: File;
  /** Bloques marcados sobre esta canción. */
  bloques: Block[];
  /** Timestamp del último guardado. */
  guardadoEn: number;
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOMBRE, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_CANCIONES)) {
        db.createObjectStore(STORE_CANCIONES, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function esperar(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function pedir<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Guarda una o varias canciones en la biblioteca. Si ya existe una con el
 * mismo id (hash), la sobreescribe (actualiza bloques, etc.).
 */
export async function guardarCanciones(canciones: CancionGuardada[]): Promise<void> {
  if (canciones.length === 0) return;
  const conn = await abrir();
  try {
    const tx = conn.transaction(STORE_CANCIONES, 'readwrite');
    const store = tx.objectStore(STORE_CANCIONES);
    for (const c of canciones) store.put(c);
    await esperar(tx);
  } finally {
    conn.close();
  }
}

/** Devuelve todas las canciones guardadas en la biblioteca. */
export async function cargarBiblioteca(): Promise<CancionGuardada[]> {
  const conn = await abrir();
  try {
    const tx = conn.transaction(STORE_CANCIONES, 'readonly');
    return await pedir<CancionGuardada[]>(tx.objectStore(STORE_CANCIONES).getAll());
  } finally {
    conn.close();
  }
}

/** Devuelve una canción por su id (hash), o `undefined` si no existe. */
export async function obtenerCancion(id: string): Promise<CancionGuardada | undefined> {
  const conn = await abrir();
  try {
    const tx = conn.transaction(STORE_CANCIONES, 'readonly');
    return await pedir<CancionGuardada | undefined>(tx.objectStore(STORE_CANCIONES).get(id));
  } finally {
    conn.close();
  }
}

/** Elimina una canción de la biblioteca. */
export async function eliminarCancion(id: string): Promise<void> {
  const conn = await abrir();
  try {
    const tx = conn.transaction(STORE_CANCIONES, 'readwrite');
    tx.objectStore(STORE_CANCIONES).delete(id);
    await esperar(tx);
  } finally {
    conn.close();
  }
}

/** Indica si la biblioteca tiene al menos una canción guardada. */
export async function hayCancionesGuardadas(): Promise<boolean> {
  const conn = await abrir();
  try {
    const tx = conn.transaction(STORE_CANCIONES, 'readonly');
    const count = await pedir<number>(tx.objectStore(STORE_CANCIONES).count());
    return count > 0;
  } finally {
    conn.close();
  }
}
