# playback

## ADDED Requirements

### Requirement: Reproducción encadenada de la mezcla
El sistema SHALL reproducir la secuencia completa aplicando las transiciones
definidas, con un cabezal que avanza y la posibilidad de pausar y saltar a un bloque.

#### Scenario: Reproducir la mezcla completa
- **WHEN** el usuario pulsa play
- **THEN** la secuencia suena de principio a fin aplicando cada transición
- **AND** un cabezal indica la posición actual

#### Scenario: Pausar y saltar
- **WHEN** el usuario pausa o pulsa sobre un bloque concreto
- **THEN** la reproducción se detiene, o salta al inicio de ese bloque

### Requirement: Mezcla sin cortes
El sistema SHALL programar la reproducción con Web Audio de forma que los empalmes
entre bloques sean precisos y sin silencios indeseados.

#### Scenario: Empalme sin silencios
- **GIVEN** dos bloques consecutivos con transición de corte o crossfade
- **WHEN** la reproducción pasa de uno al siguiente
- **THEN** no se percibe silencio ni clic en el empalme
