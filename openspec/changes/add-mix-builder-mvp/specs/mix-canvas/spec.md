# mix-canvas

## ADDED Requirements

### Requirement: Secuenciar bloques por arrastre
El sistema SHALL permitir arrastrar bloques a una secuencia ordenada en una sola
línea, así como reordenarlos y quitarlos.

#### Scenario: Añadir y ordenar bloques
- **WHEN** el usuario arrastra bloques al lienzo
- **THEN** los bloques forman una secuencia ordenada de izquierda a derecha

#### Scenario: Reordenar o quitar un bloque
- **WHEN** el usuario arrastra un bloque a otra posición o lo elimina del lienzo
- **THEN** la secuencia se actualiza reflejando el nuevo orden

### Requirement: Transiciones entre bloques
El sistema SHALL permitir elegir, para cada unión entre dos bloques, una
transición: corte seco, crossfade con duración ajustable, o ajuste de BPM
(time-stretch). La transición por defecto SHALL ser un crossfade.

#### Scenario: Crossfade por defecto
- **WHEN** se colocan dos bloques consecutivos sin configurar la unión
- **THEN** la unión usa un crossfade por defecto

#### Scenario: Cambiar el tipo de transición
- **WHEN** el usuario selecciona una unión y elige "corte", "crossfade" o "ajuste de BPM"
- **THEN** la unión adopta esa transición con sus parámetros

#### Scenario: Aviso en ajuste de BPM extremo
- **WHEN** el usuario aplica ajuste de BPM con una diferencia grande entre bloques
- **THEN** el sistema avisa de posible pérdida de calidad pero permite continuar

### Requirement: Identidad visual por canción
El sistema SHALL colorear cada bloque según su canción de origen.

#### Scenario: Color consistente por canción
- **WHEN** se muestran varios bloques de distintas canciones
- **THEN** todos los bloques de una misma canción comparten color y se distinguen de los de otras
