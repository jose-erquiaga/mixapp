# Tasks

## 1. Almacen multi-proyecto en IndexedDB
- [x] 1.1 `generarIdProyecto()`: ID corto basado en timestamp + random
- [x] 1.2 `guardarProyecto(snapshot, archivos)`: clave = `snapshot.id`; archivos
  con prefijo `${id}/${fileRef}` para aislarlos por proyecto
- [x] 1.3 `cargarProyecto(id)`: carga por ID, stripea el prefijo al devolver
  los archivos
- [x] 1.4 `listarProyectos()`: devuelve todos los snapshots ordenados por fecha
- [x] 1.5 `eliminarProyecto(id)`: borra snapshot + archivos del rango del proyecto
- [x] 1.6 `hayAlgunProyecto()`: reemplaza `hayProyectoGuardado()` (cualquier clave)
- [x] 1.7 `DB_VERSION` 2 (limpia el esquema de clave unica `"actual"` de v1)

## 2. Hook usePersistence
- [x] 2.1 Estado `proyectoActualId` y `nombreProyectoActual`
- [x] 2.2 `guardar()`: si no hay ID aun, abre modal de nombre; si ya existe,
  overwrite silencioso
- [x] 2.3 `confirmarNombre(nombre)`: genera ID si es sesion nueva, llama a
  `_guardarConId`
- [x] 2.4 `cargar()`: lista proyectos y abre modal de lista
- [x] 2.5 `seleccionarProyecto(id)`: carga el proyecto elegido, actualiza el
  estado de sesion activa
- [x] 2.6 `eliminarProyectoGuardado(id)`: elimina y refresca la lista; limpia
  `proyectoActualId` si era el activo
- [x] 2.7 WAV exportado usa el nombre de la sesion activa

## 3. UI
- [x] 3.1 `ProjectNameModal`: dialogo compacto (input + Guardar/Cancelar);
  confirma con Enter, cancela con Escape
- [x] 3.2 `ProjectListModal`: pantalla completa con lista de sesiones (nombre,
  fecha, pistas) y botones Cargar / Eliminar
- [x] 3.3 `PersistencePanel`: nueva prop `nombreProyectoActual` mostrada como
  etiqueta `"📌 <nombre>"` en la cabecera
- [x] 3.4 `App.tsx`: renderizar los dos nuevos modales con sus handlers
