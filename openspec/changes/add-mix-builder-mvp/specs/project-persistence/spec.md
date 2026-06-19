# project-persistence

## ADDED Requirements

### Requirement: Guardar y cargar el proyecto
El sistema SHALL guardar el proyecto (pistas, bloques, orden, transiciones, BPM y
etiquetas) en almacenamiento local y SHALL permitir volver a cargarlo más tarde.

#### Scenario: Guardar el proyecto
- **WHEN** el usuario guarda el proyecto
- **THEN** el estado completo queda persistido localmente

#### Scenario: Cargar un proyecto guardado
- **GIVEN** un proyecto previamente guardado
- **WHEN** el usuario lo abre
- **THEN** se restauran sus pistas, bloques, orden y transiciones tal como estaban

### Requirement: Exportar la mezcla a audio
El sistema SHALL renderizar la mezcla completa de forma offline y SHALL permitir
descargarla como archivo WAV.

#### Scenario: Exportar a WAV
- **WHEN** el usuario pulsa exportar
- **THEN** el sistema renderiza la secuencia con sus transiciones
- **AND** ofrece la descarga de un archivo WAV con la mezcla resultante
