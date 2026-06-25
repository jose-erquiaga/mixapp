# local-library

## ADDED Requirements

### Requirement: Identidad estable de canción por contenido
El sistema SHALL identificar cada canción por un hash del contenido de su archivo
de audio, de modo que dos importaciones del mismo audio se reconozcan como la
misma canción.

#### Scenario: Reimportar el mismo archivo
- **GIVEN** una canción ya importada previamente
- **WHEN** el usuario importa de nuevo el mismo archivo de audio
- **THEN** el sistema lo reconoce como la misma canción (mismo identificador)
- **AND** no crea una entrada duplicada

#### Scenario: Archivo renombrado
- **GIVEN** una canción ya conocida
- **WHEN** el usuario importa el mismo audio con el archivo renombrado
- **THEN** el sistema lo reconoce como la misma canción

### Requirement: Catálogo local persistente con guardado manual
El sistema SHALL permitir guardar en almacenamiento local (IndexedDB) las
canciones importadas —su audio, metadatos y BPM— junto con sus bloques, mediante
una acción explícita de guardado.

#### Scenario: Guardar la biblioteca
- **WHEN** el usuario pulsa "Guardar en biblioteca"
- **THEN** las canciones del espacio de trabajo y sus bloques quedan persistidos
  localmente
- **AND** el audio de cada canción se almacena una sola vez

### Requirement: Vista de biblioteca local
El sistema SHALL ofrecer una vista que liste las canciones guardadas y SHALL
permitir cargar o eliminar cada una.

#### Scenario: Listar canciones guardadas
- **WHEN** el usuario abre la biblioteca local
- **THEN** ve las canciones guardadas con su nombre, BPM, duración y número de
  bloques

#### Scenario: Cargar una canción guardada
- **GIVEN** una canción en la biblioteca local
- **WHEN** el usuario la carga
- **THEN** la canción queda disponible en el espacio de trabajo lista para usar

#### Scenario: Eliminar una canción de la biblioteca
- **WHEN** el usuario elimina una canción de la biblioteca
- **THEN** la canción y sus datos asociados desaparecen del catálogo local

### Requirement: Bloques ligados a la canción
El sistema SHALL asociar los bloques a la canción de la que proceden, de modo que
al cargar (o re-importar) esa canción sus bloques vuelvan a estar disponibles.

#### Scenario: Recuperar bloques al cargar una canción
- **GIVEN** una canción guardada con bloques marcados
- **WHEN** el usuario carga esa canción desde la biblioteca
- **THEN** sus bloques aparecen disponibles sin volver a marcarlos

#### Scenario: Recuperar bloques al re-importar
- **GIVEN** una canción conocida con bloques guardados
- **WHEN** el usuario re-importa su archivo desde el disco
- **THEN** sus bloques guardados se adjuntan automáticamente

#### Scenario: Ver y usar los bloques desde la tarjeta de la canción
- **GIVEN** una pista en la biblioteca con bloques disponibles
- **THEN** sus bloques se muestran como chips dentro de la tarjeta de esa pista
- **AND** al tocar un chip el bloque se añade a la secuencia del lienzo

#### Scenario: Añadir la pista entera a la secuencia
- **GIVEN** una pista en la biblioteca
- **WHEN** el usuario pulsa "Pista entera" en su tarjeta
- **THEN** se añade a la secuencia un bloque que cubre la canción completa
  (de 0 a su duración total)
- **AND** se reproduce y exporta como cualquier otro bloque de la secuencia
