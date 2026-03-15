# Research: Electron Import Flow — IPC, Progress y Wizard State

Date: 2026-03-15
Context: Diseño del paso 3.3 — Import flow (seleccionar carpeta → pattern → progress → resultado)
Type: architecture

---

## Findings

### 1. dialog.showOpenDialog via IPC

**Regla fundamental:** `dialog` es una API de main process. El renderer no puede llamarla directamente. El patrón correcto es invoke/handle.

**Flujo:**

```
renderer → ipcRenderer.invoke('dialog:openDirectory')
              ↓
main → ipcMain.handle('dialog:openDirectory', async () => {
         const { canceled, filePaths } = await dialog.showOpenDialog(win, {
           properties: ['openDirectory']
         })
         return canceled ? null : filePaths[0]
       })
              ↓
renderer recibe el path como Promise resolve
```

**Opciones clave de showOpenDialog para directorios:**

| Propiedad | Efecto |
|-----------|--------|
| `openDirectory` | Muestra selector de directorios |
| `openFile` | Muestra selector de archivos |
| `multiSelections` | Permite selección múltiple |
| `showHiddenFiles` | Incluye archivos/dirs ocultos |
| `createDirectory` | macOS: botón "Nueva carpeta" |

**Restricción de plataforma:** En Windows y Linux no se pueden combinar `openFile` y `openDirectory` simultáneamente. Para este flow, usar solo `openDirectory`.

**Exposición en preload via contextBridge:**

```ts
// preload/index.ts
contextBridge.exposeInMainWorld('electronAPI', {
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
})
```

El renderer llama `window.electronAPI.openDirectory()` y obtiene un `Promise<string | null>`.

---

### 2. Progress desde main → renderer (webContents.send + ipcRenderer.on)

**Dirección:** No existe `ipcMain.send`. El canal main→renderer usa `win.webContents.send(channel, data)`.

**Patrón completo:**

```
scanner emite progress callback
  ↓
main process: mainWindow.webContents.send('scan:progress', { pct, current, total })
  ↓
preload expone: ipcRenderer.on('scan:progress', callback)
  ↓
renderer: useEffect con suscripción y cleanup
```

**Exposición en preload (segura):**

```ts
contextBridge.exposeInMainWorld('electronAPI', {
  onScanProgress: (callback: (data: ScanProgress) => void) => {
    const handler = (_event: IpcRendererEvent, data: ScanProgress) => callback(data)
    ipcRenderer.on('scan:progress', handler)
    return () => ipcRenderer.off('scan:progress', handler)  // retorna cleanup fn
  }
})
```

El preload retorna una función de unsubscribe para que el renderer haga cleanup en `useEffect` return.

**Punto crítico:** No exponer `event` al renderer (riesgo de seguridad). El wrapper en preload lo absorbe y pasa solo `data`.

**Serialización:** Solo datos primitivos y objetos planos. No funciones, Promises, Symbols.

**Cleanup obligatorio:** Sin cleanup, los listeners acumulan en cada montaje del componente. Usar `ipcRenderer.off(channel, listener)` o `removeAllListeners(channel)`.

---

### 3. React wizard/stepper sin librerías — patrón useReducer

**Patrón base:** Estado mínimo con `step` (discriminant) + datos acumulados por paso. `useReducer` es preferible a múltiples `useState` cuando hay transiciones explícitas.

**Shape recomendado para este flow:**

```ts
type ImportStep =
  | { step: 'idle' }
  | { step: 'folder-selected'; folderPath: string }
  | { step: 'pattern-confirm'; folderPath: string; detectedPattern: string }
  | { step: 'scanning'; folderPath: string; pattern: string; progress: ScanProgress }
  | { step: 'done'; result: ScanResult }
  | { step: 'error'; message: string }

type ImportAction =
  | { type: 'SELECT_FOLDER'; path: string }
  | { type: 'CONFIRM_PATTERN'; pattern: string }
  | { type: 'SCAN_PROGRESS'; progress: ScanProgress }
  | { type: 'SCAN_DONE'; result: ScanResult }
  | { type: 'SCAN_ERROR'; message: string }
  | { type: 'RESET' }
```

**Ventajas de union discriminada vs. `currentStep: number`:**
- TypeScript estrecha el tipo en cada rama del render.
- Imposible renderizar un paso con datos incompletos (el tipo no lo permite).
- Las transiciones inválidas quedan sin manejar en el reducer (fácil de detectar).
- Reset trivial: dispatch `{ type: 'RESET' }` vuelve a `idle`.

**Render por paso:**

```ts
function ImportFlow() {
  const [state, dispatch] = useReducer(importReducer, { step: 'idle' })
  // ...
  if (state.step === 'idle') return <SelectFolderStep onSelect={...} />
  if (state.step === 'folder-selected') return <PatternConfirmStep ... />
  if (state.step === 'scanning') return <ProgressStep progress={state.progress} />
  if (state.step === 'done') return <ResultStep result={state.result} />
}
```

**Alternativa más simple (useState + número):** Válida para flujos lineales sin datos compartidos entre pasos. El union discriminado es superior aquí porque cada paso necesita datos del anterior (folderPath, pattern, etc.).

---

## Options

| Enfoque | Pros | Contras | Recomendación |
|---------|------|---------|---------------|
| `useState` + step number | Mínimo boilerplate | No tipado estricto por paso, datos como estado separado | No para este caso |
| `useReducer` + union discriminada | Transiciones explícitas, TypeScript estrecha tipos por paso, datos co-ubicados | Un poco más de boilerplate inicial | Recomendado |
| Librería (react-use-wizard, etc.) | Menos código | Dependencia extra, poco control sobre tipos | No necesario |
| XState / máquina de estados | Máxima robustez | Overkill para 5 pasos lineales | No necesario |

---

## Recommendation

**Para dialog:** `ipcMain.handle` + `dialog.showOpenDialog({ properties: ['openDirectory'] })`. El renderer lo llama con `invoke`. Simple y tipado.

**Para progress:** `webContents.send` desde main, `ipcRenderer.on` expuesto en preload via contextBridge retornando la función de cleanup. El renderer hace cleanup en el return del `useEffect`.

**Para el wizard:** `useReducer` con union discriminada de pasos. Encaja con el stack TypeScript estricto del proyecto y hace imposible renderizar estados inválidos. Sin librerías externas.

---

## Sources

- [Inter-Process Communication | Electron](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [dialog API | Electron](https://www.electronjs.org/docs/latest/api/dialog)
- [ipcRenderer API | Electron](https://www.electronjs.org/docs/latest/api/ipc-renderer)
- [webContents API | Electron](https://www.electronjs.org/docs/latest/api/web-contents)
- [Electron IPC — Nick Olinger](https://www.nickolinger.com/blog/electron-interprocess-communication/)
