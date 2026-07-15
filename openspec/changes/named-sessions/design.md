# Design — Sesiones de proyecto nombradas

## ID y ciclo de vida de una sesion
- Un proyecto nuevo no tiene ID hasta que el usuario pulsa "Guardar" por primera
  vez. En ese momento se genera un ID corto (`Date.now().toString(36) +
  random.slice(2,7)`) y se pide nombre mediante `ProjectNameModal`.
- El ID y el nombre quedan en el estado interno de `usePersistence`
  (`proyectoActualId`, `nombreProyectoActual`). Guardados posteriores de la
  misma sesion son un overwrite silencioso (igual que Ctrl+S en cualquier editor).
- Al cargar una sesion desde la lista, el hook actualiza `proyectoActualId` y
  `nombreProyectoActual` con los del snapshot cargado.

## Esquema IndexedDB (version 2)
- **DB**: `mixapp` — version 2 (version 1 usaba clave fija `"actual"`; la
  migracion descarta los datos anteriores, aceptable en MVP).
- **Store `proyecto`**: clave = `snapshot.id` (string). Multiples entradas, una
  por sesion guardada.
- **Store `archivos`**: clave = `${projectId}/${fileRef}`. El prefijo aisla los
  archivos de cada sesion sin requerir un store adicional. Al guardar se borran
  los archivos previos del proyecto con un rango
  `IDBKeyRange.bound('${id}/', '${id}/￿')` y se escriben los nuevos.
  Al cargar se filtra el mismo rango y se stripea el prefijo al devolver el
  `Record<string, File>`. Al eliminar se borra el snapshot + todos los archivos
  del rango.
- Compatibilidad con biblioteca local (#12-#13): si la pista ya esta en el
  catalogo `mixapp-biblioteca`, su `File` no se duplica en `archivos`; se
  resuelve desde la biblioteca al cargar (igual que antes).

## UI (movil-first)
- **`ProjectNameModal`**: dialogo compacto centrado (no pantalla completa) con
  un `<input>` autofocus, placeholder "Ej: Set del viernes", maximo 60 chars.
  Confirma con Enter o el boton "Guardar"; cancela con Escape o el boton
  "Cancelar". Si el input queda vacio, se usa "Mi mezcla" como fallback.
- **`ProjectListModal`**: pantalla completa (mismo patron que
  `LocalLibraryModal`). Lista ordenada por fecha descendente: nombre en grande,
  fecha formateada (dd/mm/aa hh:mm), numero de pistas. Botones "Cargar"
  (acento azul) y "Eliminar" (acento rojo) en cada fila. Estado vacio explicito.
- **Etiqueta de sesion activa**: `PersistencePanel` muestra `"📌 <nombre>"` en
  texto pequeno junto a los botones cuando hay sesion activa.
- **Nombre en el WAV exportado**: el archivo descargado se llama
  `<nombreProyectoActual>.wav` (o `mezcla.wav` si no hay nombre).

## Relacion con persistencia anterior (change add-mix-builder-mvp, #6)
El design original de persistencia indicaba "multi-proyecto con nombres queda
para Fase 2". Este change adelanta esa funcionalidad como mejora de UX directa.
La interfaz publica de `projectStore` cambia (firma de `cargarProyecto`, nuevas
funciones `listarProyectos`/`eliminarProyecto`/`hayAlgunProyecto`), pero el
contrato del hook `usePersistence` hacia `App.tsx` es retrocompatible excepto
por los nuevos modales.
