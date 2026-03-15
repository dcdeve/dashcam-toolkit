---
description: "Capturar ideas para despues o revisar todos pendientes"
---

Si el usuario incluyo una descripcion (ej: `/todos Agregar rate limiting`):
→ Ir a **modo CAPTURA**

Si no incluyo descripcion:
→ Ir a **modo REVISION**

---

## Modo CAPTURA

### 1. Extraer descripcion
Tomar el todo del mensaje del usuario. Mantenerlo conciso.

### 2. Inferir area
Basado en paths o keywords, clasificar en un area:
- `api` — endpoints, rutas, controllers, middleware
- `ui` — componentes, layouts, estilos, responsive
- `data` — modelos, schemas, migraciones, queries
- `auth` — autenticacion, autorizacion, sesiones
- `testing` — tests, coverage, fixtures, mocks
- `docs` — documentacion, README, guias
- `tooling` — build, CI/CD, scripts, config
- `general` — cualquier otra cosa

### 3. Verificar duplicados
Leer `.planning/quick/log.md`. Si hay una entrada similar, avisar.

### 4. Agregar al log
Agregar nueva fila a `.planning/quick/log.md`:
```
| [fecha] | [descripcion concisa] | [area] | - |
```

### 5. Confirmar y continuar
Reportar: "Capturado: [descripcion]. Continua con tu trabajo actual."
NO cambiar contexto ni empezar a trabajar en el todo.

---

## Modo REVISION

### 1. Cargar todos
Leer `.planning/quick/log.md`. Si no hay entradas: "No hay todos pendientes."

### 2. Mostrar lista
```
Todos pendientes (N):
  1. [api] Agregar rate limiting a endpoints publicos (hace 3 dias)
  2. [ui] Estado vacio para dashboard sin datos (hace 1 semana)
  3. [testing] Agregar contract tests para auth (hace 2 semanas)
```

### 3. Usuario selecciona
Preguntar: "Cual todo? (numero, o 'listo' para salir)"

### 4. Ofrecer acciones
```
Acciones:
  a) Trabajar ahora — iniciar /quick con este contexto
  b) Agregar al plan — sugerir en que fase/paso encaja
  c) Descartar — marcar como descartado con razon
  d) Volver a la lista
```

### Accion a: Trabajar ahora
- Iniciar /quick con la descripcion del todo como contexto

### Accion b: Agregar al plan
- Leer STATUS.md para determinar fase actual
- Leer sub-plan de la fase
- Sugerir donde encaja (que paso, o como paso nuevo)

### Accion c: Descartar
- Pedir razon breve
- Eliminar de la lista

### Accion d: Volver a la lista
- Volver al paso 2
