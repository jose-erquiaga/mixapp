import { Track, Block, SequencedBlock } from '@/types/model';

const DB_NOMBRE = 'mixapp';
const DB_VERSION = 2;
const STORE_PROYECTO = 'proyecto';
const STORE_ARCHIVOS = 'archivos';

export interface ProjectSnapshot {
  id: string;
  nombre: string;
  version: number;
  guardadoEn: number;
  tracks: Track[];
  bloques: Block[];
  secuencia: SequencedBlock[];
}

export function generarIdProyecto(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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

function rangoArchivos(id: string): IDBKeyRange {
  return IDBKeyRange.bound(`${id}/`, `${id}/￿`);
}

export async function guardarProyecto(
  snapshot: ProjectSnapshot,
  archivos: Record<string, File>,
): Promise<void> {
  const conn = await abrir();
  try {
    const tx = conn.transaction([STORE_PROYECTO, STORE_ARCHIVOS], 'readwrite');
    const proyectos = tx.objectStore(STORE_PROYECTO);
    const fAlmacen = tx.objectStore(STORE_ARCHIVOS);
    proyectos.put(snapshot, snapshot.id);
    fAlmacen.delete(rangoArchivos(snapshot.id));
    for (const [fileRef, file] of Object.entries(archivos)) {
      fAlmacen.put(file, `${snapshot.id}/${fileRef}`);
    }
    await esperar(tx);
  } finally {
    conn.close();
  }
}

export async function cargarProyecto(id: string): Promise<{
  snapshot: ProjectSnapshot;
  archivos: Record<string, File>;
} | null> {
  const conn = await abrir();
  try {
    const tx = conn.transaction([STORE_PROYECTO, STORE_ARCHIVOS], 'readonly');
    const snapshot = await pedir<ProjectSnapshot | undefined>(
      tx.objectStore(STORE_PROYECTO).get(id),
    );
    if (!snapshot) return null;
    const fAlmacen = tx.objectStore(STORE_ARCHIVOS);
    const rango = rangoArchivos(id);
    const claves = await pedir<IDBValidKey[]>(fAlmacen.getAllKeys(rango));
    const valores = await pedir<File[]>(fAlmacen.getAll(rango));
    const prefijo = `${id}/`;
    const archivos: Record<string, File> = {};
    claves.forEach((k, i) => {
      archivos[String(k).slice(prefijo.length)] = valores[i];
    });
    return { snapshot, archivos };
  } finally {
    conn.close();
  }
}

export async function listarProyectos(): Promise<ProjectSnapshot[]> {
  const conn = await abrir();
  try {
    const tx = conn.transaction(STORE_PROYECTO, 'readonly');
    const todos = await pedir<ProjectSnapshot[]>(tx.objectStore(STORE_PROYECTO).getAll());
    return todos.sort((a, b) => b.guardadoEn - a.guardadoEn);
  } finally {
    conn.close();
  }
}

export async function eliminarProyecto(id: string): Promise<void> {
  const conn = await abrir();
  try {
    const tx = conn.transaction([STORE_PROYECTO, STORE_ARCHIVOS], 'readwrite');
    tx.objectStore(STORE_PROYECTO).delete(id);
    tx.objectStore(STORE_ARCHIVOS).delete(rangoArchivos(id));
    await esperar(tx);
  } finally {
    conn.close();
  }
}

export async function hayAlgunProyecto(): Promise<boolean> {
  const conn = await abrir();
  try {
    const tx = conn.transaction(STORE_PROYECTO, 'readonly');
    const count = await pedir<number>(tx.objectStore(STORE_PROYECTO).count());
    return count > 0;
  } finally {
    conn.close();
  }
}
