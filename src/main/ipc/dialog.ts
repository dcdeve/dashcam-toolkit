import { ipcMain, dialog, BrowserWindow } from 'electron';
import { IPC } from '../../shared/ipc.js';

export function registerDialogHandlers(): void {
  ipcMain.handle(IPC.DIALOG.OPEN_DIRECTORY, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: 'Select dashcam folder',
    });

    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });
}
