import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync } from 'fs';

import { VERSION } from '../core/index.js';
import { db } from '../core/modules/db/index.js';
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

app.whenReady().then(() => {
  console.log(`Dashcam Toolkit v${VERSION}`);

  // Auto-initialize database
  const dbPath = getDbPath();
  db.connect({ path: dbPath });
  db.migrate();
  console.log(`Database ready: ${dbPath}`);

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
