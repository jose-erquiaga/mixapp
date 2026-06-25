# Biblioteca local persistente con bloques ligados a la canción

## Por qué
Hoy cada importación genera identificadores al azar, así que reimportar el mismo
archivo se trata como una canción nueva y el trabajo de marcar bloques (intro,
estribillo, outro…) se pierde. Además, cada sesión obliga a re-importar los
archivos uno a uno desde el disco.

Queremos que la app **recuerde** las canciones y su trabajo: que los bloques
queden ligados a la canción y reaparezcan al volver a cargarla, y que exista una
**biblioteca local** navegable con todo lo ya importado.

## Qué cambia
- **Identidad estable de canción por contenido** (hash SHA-256 del archivo): dos
  importaciones del mismo audio se reconocen como la misma canción.
- **Catálogo local en IndexedDB** (guardado manual) con las canciones (audio +
  metadatos + BPM) y sus bloques.
- **Vista de biblioteca local**: listar, cargar y eliminar canciones guardadas.
- **Re-vinculación de bloques**: al cargar (o re-importar) una canción, sus
  bloques guardados vuelven a estar disponibles.

## Impacto
- Absorbe el problema de "bloques huérfanos" (issue #7): los bloques viven
  ligados a la canción, no a un id de sesión.
- Unifica `Track.id`/`Track.fileRef` en el hash, eliminando la clase de bug del
  cruce trackId/fileRef.
- Reajusta la persistencia de proyecto (change `add-mix-builder-mvp`, #6) para
  que el proyecto guarde la secuencia por referencia y no duplique los audios.

## Fuera de alcance
- Export MP3, multi-proyecto con nombres y modo "dos decks" (Fase 2 aparte).
