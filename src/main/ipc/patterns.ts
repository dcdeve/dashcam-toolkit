import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc.js';
import { patterns } from '../../core/modules/patterns/index.js';

export function registerPatternsHandlers(): void {
  ipcMain.handle(IPC.PATTERNS.LIST, () => {
    return patterns.list();
  });

  ipcMain.handle(IPC.PATTERNS.DETECT, (_event, filename: string) => {
    return patterns.detect(filename);
  });
}
