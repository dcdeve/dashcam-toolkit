import { app, BrowserWindow, protocol, session, ipcMain } from 'electron';
import { join, extname } from 'path';
import { homedir } from 'os';
import { mkdirSync, createReadStream, statSync } from 'fs';
import http from 'http';
import type { AddressInfo } from 'net';

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

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

// Keep dashcam-file:// registered so existing thumbnail code keeps working
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'dashcam-file',
    privileges: {
      standard: false,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

// Local HTTP media server — same approach as the working test server.
// protocol.handle() has a known bug with video streaming (electron#38749).
// A plain http.createServer + createReadStream().pipe(res) works reliably.
function startMediaServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      const filePath = url.searchParams.get('path') ?? '';

      if (!filePath) {
        res.writeHead(400);
        res.end('Missing path');
        return;
      }

      const ext = extname(filePath).toLowerCase();
      const mime = ext === '.mp4' ? 'video/mp4' : ext === '.mov' ? 'video/quicktime' : 'video/mp4';

      let size: number;
      try {
        size = statSync(filePath).size;
      } catch {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const range = req.headers['range'];
      const headers: Record<string, string> = { 'Content-Type': mime, 'Accept-Ranges': 'bytes' };

      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        const start = m?.[1] ? parseInt(m[1], 10) : 0;
        const end = m?.[2] ? parseInt(m[2], 10) : size - 1;
        if (start >= size || end >= size) {
          res.writeHead(416, headers);
          res.end();
          return;
        }
        headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
        headers['Content-Length'] = String(end - start + 1);
        res.writeHead(206, headers);
        createReadStream(filePath, { start, end }).pipe(res);
      } else {
        headers['Content-Length'] = String(size);
        res.writeHead(200, headers);
        createReadStream(filePath).pipe(res);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;
      console.log(`Media server ready on http://127.0.0.1:${port}`);
      resolve(port);
    });
    server.on('error', reject);
    app.on('will-quit', () => server.close());
  });
}

app.whenReady().then(async () => {
  // Handle dashcam-file:// for thumbnails (images, not video)
  const { net } = await import('electron');
  const { pathToFileURL } = await import('url');
  protocol.handle('dashcam-file', (request) => {
    const filePath = decodeURIComponent(request.url.replace('dashcam-file://', ''));
    return net.fetch(pathToFileURL(filePath).href);
  });

  console.log(`Dashcam Toolkit v${VERSION}`);

  if (!app.isPackaged) {
    const REACT_DEVTOOLS_ID = 'fmkadmapgofadopljbjfkapdkoienihi';
    await session.defaultSession.extensions
      .loadExtension(
        join(
          homedir(),
          `Library/Application Support/Google/Chrome/Default/Extensions/${REACT_DEVTOOLS_ID}`,
        ),
        { allowFileAccess: true },
      )
      .catch(() => {});
  }

  const dbPath = getDbPath();
  db.connect({ path: dbPath });
  db.migrate();
  console.log(`Database ready: ${dbPath}`);

  const thumbDir = join(homedir(), '.dashcam-toolkit', 'thumbnails');
  configureThumbnails({ cacheDir: thumbDir, scrubCount: 3 });

  // Start media server and expose port to renderer via IPC
  const mediaPort = await startMediaServer();
  ipcMain.handle('media:port', () => mediaPort);

  registerAllHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  db.close();
});
