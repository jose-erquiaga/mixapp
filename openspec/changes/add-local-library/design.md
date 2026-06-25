# Design — Biblioteca local persistente

## Identidad de canción por hash de contenido
- Al importar, se calcula `SHA-256` de los bytes del archivo con
  `crypto.subtle.digest('SHA-256', bytes)` y se usa su representación hex como
  **songId** estable.
- `Track.id` y `Track.fileRef` pasan a ser ese mismo valor (el hash). Así los
  `Block.trackId` quedan ligados a una identidad estable entre sesiones.
- Efecto colateral: al unificar `id === fileRef === hash` desaparece la clase de
  bug del cruce `trackId`/`fileRef` (la del fix de reproducción del MVP).
- **Dedupe**: si el hash ya existe en el workspace o en la biblioteca, no se
  duplica; se reutiliza la entrada y se adjuntan sus bloques guardados.
- Coste: el hash de un archivo de pocos MB es de unos milisegundos; se hace una
  sola vez al importar.
- **Contexto inseguro (móvil por LAN/http)**: `crypto.subtle` solo existe en
  contexto seguro (https/localhost). Como en el móvil se accede por LAN sobre
  http, `hashArchivo` usa Web Crypto cuando está disponible y, si no, una
  implementación SHA-256 en JS puro que da el MISMO hash (ver `audio/hash.ts`),
  para que la identidad sea idéntica en cualquier dispositivo/contexto.

## Catálogo en IndexedDB (guardado manual)
- BD separada `mixapp-biblioteca` (no interfiere con la BD de proyecto `mixapp`).
  Almacén `canciones` con `keyPath: 'id'`, indexado por songId(hash). Registro:
  `{ id, nombre, bpm, sampleRate, duracionSeg, file: File, bloques: Block[], guardadoEn }`.
- La acción "Guardar en biblioteca" persiste las canciones del workspace y sus
  bloques. No hay autoguardado (decisión del usuario).
- El audio se guarda una sola vez por canción (no duplicado por proyecto).
- Implementado en `src/features/local-library/libraryStore.ts` (CRUD) y
  `useLocalLibrary.ts` (hook de orquestación).

## Re-vinculación de bloques
- **Cargar desde la biblioteca**: decodificar el `File` guardado → `trackStore`,
  añadir el `Track` a la biblioteca en memoria y mergear sus `bloques` en el
  estado de bloques.
- **Re-importar desde disco**: si el hash del archivo ya está en el catálogo, se
  adjuntan automáticamente sus bloques guardados (mismo efecto, vía disco).
  Implementado con `onImportado` callback en `useLibrary` que consulta
  `obtenerCancion` y llama a `mergeBloques`.
- El merge respeta los bloques ya presentes en memoria (no duplica por id).
  `useBlocks.mergeBloques` filtra por `Block.id` antes de añadir.

## UI (móvil-first)
- Botón "📚 Guardar en biblioteca" y "📖 Biblioteca" en la cabecera.
- Modal a pantalla completa (`LocalLibraryModal`) con lista de canciones
  guardadas: nombre, BPM, duración y nº de bloques.
- Cada fila ofrece "Cargar" (trae canción + bloques al workspace) y "Eliminar de
  biblioteca".
- `useLibrary.anadirPista` y `useBlocks.mergeBloques` añadidos para cargar
  desde la biblioteca sin reemplazar el workspace.

## Relación con la persistencia de proyecto (#6)
- El catálogo de canciones+bloques es la fuente persistente de audio y bloques.
- El "proyecto" pasa a guardar solo la **secuencia** del lienzo, referenciando
  canciones por songId, sin volver a almacenar los audios. Se ajustarán
  `projectStore`/`usePersistence` para no duplicar los `File`.

## Issue absorbida
- **#7 (bloques huérfanos)**: deja de aplicar. Con bloques ligados a la canción
  en la biblioteca, quitar una canción del workspace no huérfana nada y al
  recargarla se re-vinculan. Se cerrará enlazando a esta capability.

## Open questions
- ¿Límite de tamaño/cuota de IndexedDB y aviso al usuario cuando la biblioteca
  crezca mucho? (los audios pueden ocupar). MVP: sin límite explícito.
- ¿Permitir editar el nombre de la canción en la biblioteca? MVP: nombre del
  archivo, sin edición.
