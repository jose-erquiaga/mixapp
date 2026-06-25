# Tasks

## 1. Identidad de canción por contenido
- [x] 1.1 `hashArchivo(file)` con SHA-256 (Web Crypto + fallback JS para http/LAN)
- [x] 1.2 Usar el hash como `Track.id` y `Track.fileRef` (unificados)
- [x] 1.3 Dedupe al importar (mismo hash → reutilizar, no duplicar)

## 2. Catálogo en IndexedDB (guardado manual)
- [ ] 2.1 Almacén `canciones` (audio + metadatos + bloques) indexado por hash
- [ ] 2.2 Acción "Guardar en biblioteca" (persistir canciones + bloques)
- [ ] 2.3 Eliminar canción de la biblioteca

## 3. Vista de biblioteca local
- [ ] 3.1 Listar canciones guardadas (nombre, BPM, duración, nº de bloques)
- [ ] 3.2 Cargar una canción al workspace (decodificar + añadir Track)
- [ ] 3.3 Hoja/modal a pantalla completa (móvil-first)

## 4. Re-vinculación de bloques
- [ ] 4.1 Al cargar desde biblioteca, mergear los bloques guardados
- [ ] 4.2 Al re-importar un archivo ya conocido, adjuntar sus bloques

## 5. Reajuste de persistencia de proyecto (#6)
- [ ] 5.1 Proyecto guarda la secuencia por referencia (songId), sin duplicar audios
- [ ] 5.2 Cargar proyecto resuelve las canciones desde el catálogo
