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

### Requirement: Reproducción integrada en el editor para marcar por oído
El sistema SHALL reproducir la pista completa y la región marcada (en loop),
permitiendo al usuario marcar inicio y fin escuchando el audio.

#### Scenario: Reproducir pista completa
- **WHEN** el usuario pulsa ▶ Pista
- **THEN** la pista comienza a reproducirse desde la posición actual del cabezal
- **AND** se actualiza el cabezal en tiempo real mostrando la posición

#### Scenario: Reproducir región en loop
- **WHEN** el usuario pulsa 🔁 Loop selección
- **THEN** la reproducción comienza desde el inicio de la región marcada
- **AND** cuando alcanza el fin de la región, reinicia automáticamente desde el inicio

#### Scenario: Marcar inicio escuchando (por oído)
- **GIVEN** la pista en reproducción
- **WHEN** el usuario pulsa ⇤ Inicio aquí en el punto exacto deseado
- **THEN** el inicio de la región se fija en la posición actual del cabezal
- **AND** si el imán al beat está activo, el inicio se imanta al beat más cercano

#### Scenario: Marcar fin escuchando (por oído)
- **GIVEN** la pista en reproducción
- **WHEN** el usuario pulsa Fin aquí ⇥ en el punto exacto deseado
- **THEN** el fin de la región se fija en la posición actual del cabezal
- **AND** si el imán al beat está activo, el fin se imanta al beat más cercano

### Requirement: Ajuste fino con flechas sin que el imán lo pise
El sistema SHALL permitir ajustar inicio y fin con botones de nudge (±beat / ±fino)
sin que el imán al beat interfiera.

#### Scenario: Ajustar con flechas
- **WHEN** el usuario pulsa una flecha de nudge (±beat o ±fino) en inicio o fin
- **THEN** la marca se mueve en esa dirección sin ser rechazada por el imán
- **AND** el ajuste se aplica de forma programática (no se dispara el imán)

#### Scenario: El imán no rechaza cambios de nudge
- **GIVEN** el imán al beat activo
- **WHEN** el usuario hace un ajuste con las flechas
- **THEN** el imán no rehace el ajuste; queda en la posición elegida por las flechas
