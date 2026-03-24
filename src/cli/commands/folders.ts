import { db } from '../../core/modules/db/index.js';
import { folders as foldersModule } from '../../core/modules/folders/index.js';
import { getDbPath } from '../utils.js';

export async function foldersListAction(): Promise<void> {
  const dbPath = getDbPath();
  db.connect({ path: dbPath });
  db.migrate();

  try {
    const all = foldersModule.list();
    if (all.length === 0) {
      console.log('No scanned folders found. Run "dashcam scan <dir>" first.');
      return;
    }

    console.log('Scanned folders:');
    console.log(
      '  ' + 'ID'.padEnd(38) + 'Name'.padEnd(30) + 'Clips'.padStart(6) + '  Last scanned',
    );
    console.log('  ' + '-'.repeat(90));
    for (const f of all) {
      console.log(
        `  ${f.id.padEnd(38)}${f.displayName.padEnd(30)}${String(f.clipCountAtScan).padStart(6)}  ${f.lastScanAt.toISOString().slice(0, 16).replace('T', ' ')}`,
      );
    }
  } finally {
    db.close();
  }
}

export async function foldersHealthAction(pathOrId: string): Promise<void> {
  const dbPath = getDbPath();
  db.connect({ path: dbPath });
  db.migrate();

  try {
    const all = foldersModule.list();
    const folder = all.find((f) => f.id === pathOrId || f.path === pathOrId);

    if (!folder) {
      console.error(`Folder not found: ${pathOrId}`);
      process.exitCode = 1;
      return;
    }

    console.log(`Checking health of: ${folder.displayName} (${folder.path})`);
    const result = await foldersModule.healthCheck(folder.id);

    const statusLabel: Record<string, string> = {
      ok: '✓ OK',
      stale: '⚠ STALE',
      unknown: '? UNKNOWN',
    };

    console.log(`Status: ${statusLabel[result.status] ?? result.status}`);

    if (result.status === 'stale') {
      console.log(
        '  Files on disk have changed since the last scan. Run "dashcam scan" to update.',
      );
    } else if (result.status === 'unknown') {
      console.log('  Folder path is not accessible on disk.');
    }
  } finally {
    db.close();
  }
}
