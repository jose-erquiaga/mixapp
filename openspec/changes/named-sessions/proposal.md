# Sesiones de proyecto nombradas (multi-proyecto)

## Por qué
Hasta ahora la persistencia solo soporta un único slot de proyecto (clave fija
`"actual"`), con el nombre hardcoded `"Mi mezcla"`. Cada vez que el usuario
guarda, sobreescribe la sesión anterior sin posibilidad de mantener varias
mezclas en paralelo ni de identificarlas con un nombre propio.

El usuario quiere poder **nombrar cada sesión** al guardarla y **elegir entre
varias** al cargar, igual que guardar ficheros en una carpeta.

## Qué cambia
- Al guardar por primera vez, la app pide un nombre para la sesión mediante
  un pequeño modal.
- Guardados posteriores de la misma sesión son un overwrite silencioso (sin
  volver a pedir nombre), igual que Ctrl+S.
- El botón "Cargar" abre una lista de todas las sesiones guardadas (nombre,
  fecha, nº de pistas) desde la que se puede cargar o eliminar cada una.
- El nombre de la sesión activa se muestra en la cabecera junto a los botones.
- El archivo WAV exportado lleva el nombre de la sesión.

## Impacto
- Specs modificadas (MODIFIED): `project-persistence`.
- `projectStore.ts` sube a versión 2 de la BD de IndexedDB; los datos del slot
  único anterior (`"actual"`) no se migran (aceptable en MVP).
- Nuevos componentes: `ProjectNameModal`, `ProjectListModal`.
- Fuera de alcance: editar el nombre de una sesión ya guardada, exportar /
  importar sesiones entre dispositivos.
