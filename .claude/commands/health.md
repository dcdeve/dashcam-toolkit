---
description: "Health check del proyecto -- verificar y opcionalmente reparar estado inconsistente"
---

Verificar si el proyecto esta en estado consistente. Se puede correr en cualquier momento.

## 1. DIAGNOSTICO
Delegar al agente session-recovery en modo CHECK.
Esperar reporte completo.

## 2. EVALUAR

### Si LIMPIO:
Reportar: "Proyecto en estado consistente. Continua con /next-step."

### Si RECUPERABLE:
Mostrar el reporte al usuario. Preguntar:
"Hay correcciones auto-reparables. Queres que las arregle automaticamente?"

- Si dice si: re-invocar session-recovery con REPAIR=true. Mostrar resultado.
- Si dice no: mostrar la lista de acciones manuales sugeridas.

Despues de reparar, re-correr el diagnostico para confirmar estado LIMPIO.

### Si INCONSISTENTE:
Mostrar diagnostico completo. Listar opciones concretas para cada problema.
NO auto-reparar nada. Esperar decision del usuario para cada punto.

## 3. Auditoria de contexto

Despues de los checks de estado, verificar salud del contexto:

### Validacion de archivos de contexto
- Leer "Contexto necesario" de STATUS.md
- Verificar que cada archivo listado existe y no esta vacio
- Si un archivo esta listado pero no existe: reportar y sugerir removerlo

### Frescura del contexto
- Si `plans/phase-N-context.md` existe para la fase actual pero NO esta en "Contexto necesario": sugerir agregarlo
- Si docs referenciados en el sub-plan fueron modificados desde que empezo la fase: marcar como potencialmente desactualizados

### Estimacion de tamano del contexto
- Contar lineas totales de todos los archivos en "Contexto necesario"
- Si total > 500 lineas: avisar que el contexto puede ser pesado, sugerir revisar que se carga
- Si total > 1000 lineas: recomendar partir el sub-plan o remover archivos de contexto innecesarios

## 4. Consistencia de interfaces

Verificar src/interfaces/ y docs/interfaces.md:
- Todas las interfaces tienen tipos estrictos (no any/unknown sin justificacion)
- No hay dependencias circulares entre interfaces
- Cada interfaz define tipos de error
- docs/interfaces.md matchea src/interfaces/
- tests/contracts/ existen para cada interfaz

Reportar inconsistencias como parte del diagnostico.
