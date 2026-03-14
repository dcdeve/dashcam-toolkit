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
