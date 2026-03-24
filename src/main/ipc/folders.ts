import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc.js';
import { folders } from '../../core/modules/folders/index.js';

export function registerFoldersHandlers(): void {
  ipcMain.handle(IPC.FOLDERS.LIST, () => {
    return folders.list();
  });

  ipcMain.handle(IPC.FOLDERS.HEALTH_CHECK, (_event, folderId: string) => {
    return folders.healthCheck(folderId);
  });

  ipcMain.handle(IPC.FOLDERS.REMOVE, (_event, folderId: string) => {
    folders.remove(folderId);
    return { ok: true };
  });
}
