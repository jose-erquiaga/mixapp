# waveform-editor

## ADDED Requirements

### Requirement: Visualización de onda con rejilla de beats
El sistema SHALL mostrar la forma de onda de la pista seleccionada con una
rejilla de beats derivada de su BPM.

#### Scenario: Ver onda y beats
- **WHEN** el usuario selecciona una pista de la biblioteca
- **THEN** el editor muestra su onda con marcas de beat superpuestas según el BPM

### Requirement: Marcado de secciones con imán al beat
El sistema SHALL permitir fijar marcas de inicio y fin sobre la onda que se
imanten al beat más cercano, con la opción de desactivar el imán para ajuste libre.

#### Scenario: La marca se imanta al beat
- **GIVEN** el imán al beat activado
- **WHEN** el usuario coloca una marca cerca de un beat
- **THEN** la marca se ajusta exactamente a ese beat

#### Scenario: Ajuste libre con imán desactivado
- **GIVEN** el imán al beat desactivado
- **WHEN** el usuario coloca una marca
- **THEN** la marca queda en la posición exacta elegida sin ajustarse al beat

### Requirement: Creación de bloques etiquetados
El sistema SHALL permitir crear un "bloque" a partir de una región marcada,
asignándole una etiqueta (p. ej. intro, estribillo, outro), y SHALL permitir
editarlo o eliminarlo.

#### Scenario: Crear un bloque
- **GIVEN** una región marcada con inicio y fin
- **WHEN** el usuario confirma la creación y escribe una etiqueta
- **THEN** se crea un bloque asociado a esa pista con esa región y etiqueta

#### Scenario: Editar o eliminar un bloque
- **WHEN** el usuario modifica los límites o la etiqueta de un bloque, o lo elimina
- **THEN** el bloque refleja el cambio o desaparece

### Requirement: Previsualización de un bloque
El sistema SHALL permitir reproducir de forma aislada la región de un bloque.

#### Scenario: Reproducir la región del bloque
- **WHEN** el usuario pulsa previsualizar sobre un bloque
- **THEN** se reproduce solo el audio comprendido entre su inicio y su fin
