export type FolderHealthStatus = 'ok' | 'stale' | 'unknown' | 'checking';

export interface ScannedFolder {
  id: string;
  path: string;
  displayName: string;
  lastScanAt: Date;
  clipCountAtScan: number;
  filesHashAtScan: string;
  createdAt: Date;
}

export interface FolderHealthResult {
  folderId: string;
  status: Exclude<FolderHealthStatus, 'checking'>;
}

export interface FoldersModule {
  list(): ScannedFolder[];
  upsertAfterScan(dir: string, files: Array<{ name: string; size: number }>): ScannedFolder;
  healthCheck(folderId: string): Promise<FolderHealthResult>;
  remove(folderId: string): void;
}

export type FoldersError = 'FOLDERS_NOT_FOUND' | 'FOLDERS_REMOVE_FAILED' | 'FOLDERS_DB_ERROR';
