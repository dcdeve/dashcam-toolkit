// IPC channel definitions — single source of truth for main + preload + renderer

export const IPC = {
  DIALOG: {
    OPEN_DIRECTORY: 'dialog:openDirectory',
  },
  DB: {
    CONNECT: 'db:connect',
    MIGRATE: 'db:migrate',
    CLOSE: 'db:close',
  },
  SCANNER: {
    SCAN: 'scanner:scan',
    LIST_CLIPS: 'scanner:listClips',
    PROGRESS: 'scanner:progress',
  },
  TRIPS: {
    LIST: 'trips:list',
    GET: 'trips:get',
    GET_CLIPS: 'trips:getClips',
    REMOVE: 'trips:remove',
  },
  PATTERNS: {
    LIST: 'patterns:list',
    DETECT: 'patterns:detect',
  },
  EXPORTER: {
    EXPORT: 'exporter:export',
    CANCEL: 'exporter:cancel',
  },
} as const;
