// Monitor module interface

export type MonitorEventType = 'inserted' | 'removed';

export interface MonitorEvent {
  type: MonitorEventType;
  path: string;
  timestamp: Date;
}

export interface WatchOptions {
  /** Paths to watch for SD/USB insertion */
  paths: string[];
  /** Poll interval in milliseconds (default: 5000) */
  pollIntervalMs?: number;
}

export type MonitorError =
  | 'MONITOR_PATH_NOT_FOUND'
  | 'MONITOR_ALREADY_WATCHING'
  | 'MONITOR_PERMISSION_DENIED';

export interface MonitorModule {
  watch(options: WatchOptions, onEvent: (event: MonitorEvent) => void): void;
  stop(): void;
  isWatching(): boolean;
}
