import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc.js';
import type { DatabaseConfig } from '../interfaces/db.js';
import type { ScanOptions } from '../interfaces/scanner.js';
import type { ExportOptions } from '../interfaces/exporter.js';

const api = {
  platform: process.platform,

  db: {
    connect: (config: DatabaseConfig) => ipcRenderer.invoke(IPC.DB.CONNECT, config),
    migrate: () => ipcRenderer.invoke(IPC.DB.MIGRATE),
    close: () => ipcRenderer.invoke(IPC.DB.CLOSE),
  },

  scanner: {
    scan: (options: ScanOptions) => ipcRenderer.invoke(IPC.SCANNER.SCAN, options),
    listClips: (dir: string) => ipcRenderer.invoke(IPC.SCANNER.LIST_CLIPS, dir),
  },

  trips: {
    list: () => ipcRenderer.invoke(IPC.TRIPS.LIST),
    get: (tripId: string) => ipcRenderer.invoke(IPC.TRIPS.GET, tripId),
    getClips: (tripId: string) => ipcRenderer.invoke(IPC.TRIPS.GET_CLIPS, tripId),
    remove: (tripId: string) => ipcRenderer.invoke(IPC.TRIPS.REMOVE, tripId),
  },

  patterns: {
    list: () => ipcRenderer.invoke(IPC.PATTERNS.LIST),
    detect: (filename: string) => ipcRenderer.invoke(IPC.PATTERNS.DETECT, filename),
  },

  exporter: {
    export: (options: ExportOptions) => ipcRenderer.invoke(IPC.EXPORTER.EXPORT, options),
    cancel: () => ipcRenderer.invoke(IPC.EXPORTER.CANCEL),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type ElectronAPI = typeof api;
