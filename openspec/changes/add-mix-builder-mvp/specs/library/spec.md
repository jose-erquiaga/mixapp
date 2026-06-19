# library

## ADDED Requirements

### Requirement: Importación de archivos de audio locales
El sistema SHALL permitir importar archivos de audio del dispositivo del usuario
mediante arrastrar-y-soltar y un selector de archivos, decodificándolos con la
Web Audio API.

#### Scenario: Importar por arrastre
- **WHEN** el usuario arrastra uno o más archivos de audio soportados al área de biblioteca
- **THEN** cada archivo se decodifica y aparece como una pista en la biblioteca
- **AND** se muestra su nombre y duración

#### Scenario: Formato no soportado
- **WHEN** el usuario importa un archivo que el navegador no puede decodificar
- **THEN** el sistema muestra un aviso claro indicando el formato no soportado
- **AND** no añade la pista a la biblioteca

### Requirement: Detección automática de BPM
Al importar una pista, el sistema SHALL estimar y mostrar su BPM, y SHALL permitir
corregirlo manualmente.

#### Scenario: BPM estimado al importar
- **WHEN** una pista termina de importarse
- **THEN** el sistema muestra el BPM estimado junto a la pista

#### Scenario: Corrección manual del BPM
- **GIVEN** una pista con un BPM estimado incorrecto
- **WHEN** el usuario edita el valor de BPM
- **THEN** el sistema usa el BPM corregido para la rejilla de beats y las transiciones

### Requirement: Procesamiento exclusivamente local
El sistema SHALL procesar todo el audio en el cliente y NO SHALL subir los
archivos de audio a ningún servidor en la Fase 1.

#### Scenario: Funciona sin red
- **GIVEN** el navegador sin conexión tras cargar la app
- **WHEN** el usuario importa y trabaja con sus archivos
- **THEN** la importación, el análisis y la edición funcionan con normalidad
