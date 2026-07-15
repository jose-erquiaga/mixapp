# project-persistence

## MODIFIED Requirements

### Requirement: Guardar el proyecto con nombre
El sistema SHALL permitir al usuario asignar un nombre a cada sesion guardada.

#### Scenario: Nombrar la sesion en el primer guardado
- **GIVEN** el usuario tiene pistas en el workspace y no ha guardado todavia
- **WHEN** pulsa "Guardar"
- **THEN** aparece un dialogo solicitando el nombre de la sesion
- **AND** al confirmar, la sesion queda guardada con ese nombre

#### Scenario: Overwrite silencioso de sesion existente
- **GIVEN** el usuario ha guardado previamente una sesion con nombre
- **WHEN** pulsa "Guardar" de nuevo
- **THEN** la sesion se actualiza sin pedir nombre otra vez

### Requirement: Multiples sesiones guardadas
El sistema SHALL soportar varias sesiones de proyecto guardadas simultaneamente,
cada una identificada de forma independiente.

#### Scenario: Ver la lista de sesiones guardadas
- **WHEN** el usuario pulsa "Cargar"
- **THEN** se muestra una lista con todas las sesiones guardadas, cada una con
  su nombre, fecha de guardado y numero de pistas

#### Scenario: Cargar una sesion concreta
- **GIVEN** varias sesiones guardadas
- **WHEN** el usuario selecciona una de la lista
- **THEN** el workspace se restaura con el estado de esa sesion

#### Scenario: Eliminar una sesion guardada
- **WHEN** el usuario pulsa "Eliminar" en una sesion de la lista
- **THEN** esa sesion y sus archivos de audio desaparecen del almacenamiento local
- **AND** el resto de sesiones no se ven afectadas

### Requirement: Identificacion de la sesion activa
El sistema SHALL mostrar el nombre de la sesion que esta actualmente cargada o
recien guardada.

#### Scenario: Nombre visible en cabecera
- **GIVEN** una sesion guardada o cargada con nombre
- **THEN** el nombre aparece como etiqueta en la barra de persistencia

### Requirement: Exportar WAV con nombre de sesion
El archivo WAV exportado SHALL llevar el nombre de la sesion activa.

#### Scenario: Nombre en el archivo descargado
- **GIVEN** una sesion activa con nombre "Set del viernes"
- **WHEN** el usuario exporta a WAV
- **THEN** el archivo descargado se llama "Set del viernes.wav"
