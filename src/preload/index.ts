import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc.js';
import type { DatabaseConfig } from '../interfaces/db.js';
import type { ScanOptions, ScanProgress } from '../interfaces/scanner.js';
import type { ExportOptions, ExportProgress } from '../interfaces/exporter.js';

const api = {
  platform: process.platform,

  dialog: {
    openDirectory: (): Promise<string | null> => ipcRenderer.invoke(IPC.DIALOG.OPEN_DIRECTORY),
  },

  db: {
    connect: (config: DatabaseConfig) => ipcRenderer.invoke(IPC.DB.CONNECT, config),
    migrate: () => ipcRenderer.invoke(IPC.DB.MIGRATE),
    close: () => ipcRenderer.invoke(IPC.DB.CLOSE),
  },

  scanner: {
    scan: (options: ScanOptions) => ipcRenderer.invoke(IPC.SCANNER.SCAN, options),
    listClips: (dir: string) => ipcRenderer.invoke(IPC.SCANNER.LIST_CLIPS, dir),
    onProgress: (callback: (progress: ScanProgress) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: ScanProgress): void => {
        callback(data);
      };
      ipcRenderer.on(IPC.SCANNER.PROGRESS, handler);
      return () => {
        ipcRenderer.removeListener(IPC.SCANNER.PROGRESS, handler);
      };
    },
  },

  clips: {
    list: () => ipcRenderer.invoke(IPC.CLIPS.LIST),
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
    onProgress: (callback: (progress: ExportProgress) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: ExportProgress): void => {
        callback(data);
      };
      ipcRenderer.on(IPC.EXPORTER.PROGRESS, handler);
      return () => {
        ipcRenderer.removeListener(IPC.EXPORTER.PROGRESS, handler);
      };
    },
    openFolder: (filePath: string) => ipcRenderer.invoke(IPC.EXPORTER.OPEN_FOLDER, filePath),
  },

  media: {
    getPort: (): Promise<number> => ipcRenderer.invoke('media:port'),
  },

  settings: {
    getAll: (): Promise<Record<string, string>> =>
      ipcRenderer.invoke(IPC.SETTINGS.GET_ALL) as Promise<Record<string, string>>,
    get: (key: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC.SETTINGS.GET, key) as Promise<string | null>,
    set: (key: string, value: string): Promise<void> =>
      ipcRenderer.invoke(IPC.SETTINGS.SET, key, value) as Promise<void>,
  },

  thumbnails: {
    generate: (clipId: string) => ipcRenderer.invoke(IPC.THUMBNAILS.GENERATE, clipId),
    generateScrub: (tripId: string) => ipcRenderer.invoke(IPC.THUMBNAILS.GENERATE_SCRUB, tripId),
    get: (clipId: string) => ipcRenderer.invoke(IPC.THUMBNAILS.GET, clipId),
    getScrub: (tripId: string) => ipcRenderer.invoke(IPC.THUMBNAILS.GET_SCRUB, tripId),
    clearCache: () => ipcRenderer.invoke(IPC.THUMBNAILS.CLEAR_CACHE),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type ElectronAPI = typeof api;
