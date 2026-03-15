import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc.js';
import { scanner } from '../../core/modules/scanner/index.js';
import type { ScanOptions } from '../../interfaces/scanner.js';

export function registerScannerHandlers(): void {
  ipcMain.handle(IPC.SCANNER.SCAN, (_event, options: ScanOptions) => {
    return scanner.scan(options);
  });

  ipcMain.handle(IPC.SCANNER.LIST_CLIPS, (_event, dir: string) => {
    return scanner.listClips(dir);
  });
}
