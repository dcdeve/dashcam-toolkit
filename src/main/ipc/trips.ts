import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc.js';
import { trips } from '../../core/modules/trips/index.js';

export function registerTripsHandlers(): void {
  ipcMain.handle(IPC.TRIPS.LIST, () => {
    return trips.list();
  });

  ipcMain.handle(IPC.TRIPS.GET, (_event, tripId: string) => {
    return trips.getTrip(tripId);
  });

  ipcMain.handle(IPC.TRIPS.GET_CLIPS, (_event, tripId: string) => {
    return trips.getClips(tripId);
  });

  ipcMain.handle(IPC.TRIPS.REMOVE, (_event, tripId: string) => {
    return trips.remove(tripId);
  });
}
