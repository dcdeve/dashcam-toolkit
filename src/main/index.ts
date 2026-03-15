import { app, BrowserWindow, protocol, net } from 'electron';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync } from 'fs';
import { pathToFileURL } from 'url';

import { VERSION } from '../core/index.js';
import { db } from '../core/modules/db/index.js';
import { configureThumbnails } from '../core/modules/thumbnails/index.js';
import { registerAllHandlers } from './ipc/index.js';

function getDbPath(): string {
  const dir = join(homedir(), '.dashcam-toolkit');
  mkdirSync(dir, { recursive: true });
  return join(dir, 'dashcam.db');
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
    },
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // Open DevTools in dev mode
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

// Register custom protocol for serving local video/image files
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'dashcam-file',
    privileges: { standard: false, secure: true, supportFetchAPI: true, stream: true },
  },
]);

app.whenReady().then(async () => {
  // Handle dashcam-file:// protocol — serves local files securely
  protocol.handle('dashcam-file', (request) => {
    const filePath = decodeURIComponent(request.url.replace('dashcam-file://', ''));
    return net.fetch(pathToFileURL(filePath).href);
  });
  console.log(`Dashcam Toolkit v${VERSION}`);

  // Install React DevTools in dev mode
  if (!app.isPackaged) {
    const { default: installExtension, REACT_DEVELOPER_TOOLS } =
      await import('electron-devtools-installer');
    await installExtension(REACT_DEVELOPER_TOOLS).catch((err: unknown) =>
      console.warn('React DevTools install failed:', err),
    );
  }

  // Auto-initialize database
  const dbPath = getDbPath();
  db.connect({ path: dbPath });
  db.migrate();
  console.log(`Database ready: ${dbPath}`);

  // Configure thumbnails cache
  const thumbDir = join(homedir(), '.dashcam-toolkit', 'thumbnails');
  configureThumbnails({ cacheDir: thumbDir });

  registerAllHandlers();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  db.close();
});
