import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc.js';
import { db } from '../../core/modules/db/index.js';
import type { DatabaseConfig } from '../../interfaces/db.js';

export function registerDbHandlers(): void {
  ipcMain.handle(IPC.DB.CONNECT, (_event, config: DatabaseConfig) => {
    db.connect(config);
  });

  ipcMain.handle(IPC.DB.MIGRATE, () => {
    return db.migrate();
  });

  ipcMain.handle(IPC.DB.CLOSE, () => {
    db.close();
  });
}
