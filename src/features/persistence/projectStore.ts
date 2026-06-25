/**
 * Persistencia del proyecto en IndexedDB (tarea 6.1).
 *
 * Guarda un único proyecto "actual" en dos almacenes:
 *  - `proyecto`: el snapshot serializable (pistas, bloques, secuencia, meta).
 *  - `archivos`: los `File` de audio originales, indexados por `fileRef`, para
 *    que el proyecto sea autocontenido y portable sin re-importar (ver design.md).
 *
 * Sin dependencias: envoltorio fino de promesas sobre la API de IndexedDB.
 */

import { Track, Block, SequencedBlock } from '@/types/model';

const DB_NOMBRE = 'mixapp';
const DB_VERSION = 1;
const STORE_PROYECTO = 'proyecto';
const STORE_ARCHIVOS = 'archivos';
const CLAVE_ACTUAL = 'actual';

/** Snapshot serializable del proyecto. Todo son datos planos (clonables). */
export interface ProjectSnapshot {
  id: string;
  nombre: string;
  version: number;
  guardadoEn: number;
  tracks: Track[];
  /** Todos los bloques disponibles (estén o no en la secuencia). */
  bloques: Block[];
  /** Secuencia del lienzo, con sus transiciones. */
  secuencia: SequencedBlock[];
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NOMBRE, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PROYECTO)) db.createObjectStore(STORE_PROYECTO);
      if (!db.objectStoreNames.contains(STORE_ARCHIVOS)) db.createObjectStore(STORE_ARCHIVOS);
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
 * Guarda el proyecto y sus archivos de audio. Reemplaza por completo lo
 * anterior (limpia los archivos huérfanos de un guardado previo).
 */
export async function guardarProyecto(
  snapshot: ProjectSnapshot,
  archivos: Record<string, File>,
): Promise<void> {
  const db = abrir();
  const conn = await db;
  try {
    const tx = conn.transaction([STORE_PROYECTO, STORE_ARCHIVOS], 'readwrite');
    const proyectos = tx.objectStore(STORE_PROYECTO);
    const fAlmacen = tx.objectStore(STORE_ARCHIVOS);
    proyectos.put(snapshot, CLAVE_ACTUAL);
    fAlmacen.clear();
    for (const [fileRef, file] of Object.entries(archivos)) fAlmacen.put(file, fileRef);
    await esperar(tx);
  } finally {
    conn.close();
  }
}

/**
 * Carga el proyecto "actual" si existe, junto con sus archivos. Devuelve `null`
 * si no hay nada guardado.
 */
export async function cargarProyecto(): Promise<{
  snapshot: ProjectSnapshot;
  archivos: Record<string, File>;
} | null> {
  const conn = await abrir();
  try {
    const tx = conn.transaction([STORE_PROYECTO, STORE_ARCHIVOS], 'readonly');
    const snapshot = await pedir<ProjectSnapshot | undefined>(
      tx.objectStore(STORE_PROYECTO).get(CLAVE_ACTUAL),
    );
    if (!snapshot) return null;

    const archivosStore = tx.objectStore(STORE_ARCHIVOS);
    const claves = await pedir<IDBValidKey[]>(archivosStore.getAllKeys());
    const valores = await pedir<File[]>(archivosStore.getAll());
    const archivos: Record<string, File> = {};
    claves.forEach((k, i) => {
      archivos[String(k)] = valores[i];
    });
    return { snapshot, archivos };
  } finally {
    conn.close();
  }
}

/** Indica si hay un proyecto guardado (para habilitar el botón "Cargar"). */
export async function hayProyectoGuardado(): Promise<boolean> {
  const conn = await abrir();
  try {
    const tx = conn.transaction(STORE_PROYECTO, 'readonly');
    const clave = await pedir<IDBValidKey | undefined>(
      tx.objectStore(STORE_PROYECTO).getKey(CLAVE_ACTUAL),
    );
    return clave !== undefined;
  } finally {
    conn.close();
  }
}
