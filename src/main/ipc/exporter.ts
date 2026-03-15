import { ipcMain, shell } from 'electron';
import { IPC } from '../../shared/ipc.js';
import { exporter } from '../../core/modules/exporter/index.js';
import type { ExportOptions } from '../../interfaces/exporter.js';

export function registerExporterHandlers(): void {
  ipcMain.handle(IPC.EXPORTER.EXPORT, (event, options: ExportOptions) => {
    return exporter.export(options, (progress) => {
      event.sender.send(IPC.EXPORTER.PROGRESS, progress);
    });
  });

  ipcMain.handle(IPC.EXPORTER.CANCEL, () => {
    exporter.cancel();
  });

  ipcMain.handle(IPC.EXPORTER.OPEN_FOLDER, (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });
}
