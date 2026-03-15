# Fase 1: Interfaces y Modulos

## Objetivo
Definir modulos, interfaces publicas, y contratos antes de implementar.
Orientado a robustez: tipos estrictos, error types, y tests de contrato.

## Contexto requerido
- docs/architecture.md
- PLAN.md

## Pasos

### Paso 1.1: Identificacion de modulos
- **Input:** Requerimientos + architecture.md
- **Output:** Lista en docs/interfaces.md
- **Criterio de done:** Modulos con nombre, responsabilidad, boundaries
- **Estado:** [x]

### Paso 1.2: Interfaces publicas
- **Requiere:** 1.1
- **Input:** Lista de modulos
- **Output:** src/interfaces/ (uno por modulo)
- **Criterio de done:** Compila, tipos estrictos, error types definidos
- **Estado:** [x]

### Paso 1.3: Contratos entre modulos
- **Requiere:** 1.2
- **Input:** Interfaces
- **Output:** Diagrama de dependencias en docs/
- **Criterio de done:** Sin deps circulares
- **Estado:** [ ]

### Paso 1.4: Tests de contrato
- **Requiere:** 1.3
- **Input:** Interfaces
- **Output:** tests/contracts/ con stubs
- **Criterio de done:** `make test-contracts` pasa
- **Estado:** [ ]

### Paso 1.5: Lock de interfaces
- **Requiere:** 1.4
- **Input:** Todo
- **Output:** Interfaces en main, RFC activo
- **Criterio de done:** Mergeado
- **Estado:** [ ]

## Gate
- [ ] Interfaces compilan
- [ ] Tests de contrato pasan
- [ ] docs/interfaces.md completo
- [ ] Sin dependencias circulares
