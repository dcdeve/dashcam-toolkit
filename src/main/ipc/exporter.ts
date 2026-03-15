import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc.js';
import { exporter } from '../../core/modules/exporter/index.js';
import type { ExportOptions } from '../../interfaces/exporter.js';

export function registerExporterHandlers(): void {
  ipcMain.handle(IPC.EXPORTER.EXPORT, (_event, options: ExportOptions) => {
    return exporter.export(options);
  });

  ipcMain.handle(IPC.EXPORTER.CANCEL, () => {
    exporter.cancel();
  });
}
