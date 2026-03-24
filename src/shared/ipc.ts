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
  CLIPS: {
    LIST: 'clips:list',
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
  SETTINGS: {
    GET_ALL: 'settings:getAll',
    GET: 'settings:get',
    SET: 'settings:set',
  },
  EXPORTER: {
    EXPORT: 'exporter:export',
    CANCEL: 'exporter:cancel',
    PROGRESS: 'exporter:progress',
    OPEN_FOLDER: 'exporter:openFolder',
  },
  THUMBNAILS: {
    GENERATE: 'thumbnails:generate',
    GENERATE_SCRUB: 'thumbnails:generateScrub',
    GET: 'thumbnails:get',
    GET_SCRUB: 'thumbnails:getScrub',
    CLEAR_CACHE: 'thumbnails:clearCache',
  },
  FOLDERS: {
    LIST: 'folders:list',
    HEALTH_CHECK: 'folders:healthCheck',
    REMOVE: 'folders:remove',
  },
} as const;
