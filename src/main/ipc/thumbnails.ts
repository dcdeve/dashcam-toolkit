import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc.js';
import { thumbnails } from '../../core/modules/thumbnails/index.js';

export function registerThumbnailsHandlers(): void {
  ipcMain.handle(IPC.THUMBNAILS.GENERATE, (_event, clipId: string) => {
    return thumbnails.generate(clipId);
  });

  ipcMain.handle(IPC.THUMBNAILS.GENERATE_SCRUB, (_event, tripId: string) => {
    return thumbnails.generateScrub(tripId);
  });

  ipcMain.handle(IPC.THUMBNAILS.GET, (_event, clipId: string) => {
    return thumbnails.get(clipId);
  });

  ipcMain.handle(IPC.THUMBNAILS.GET_SCRUB, (_event, tripId: string) => {
    return thumbnails.getScrub(tripId);
  });

  ipcMain.handle(IPC.THUMBNAILS.CLEAR_CACHE, () => {
    return thumbnails.clearCache();
  });
}
