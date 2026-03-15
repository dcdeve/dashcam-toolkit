import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc.js';
import { getDb, schema } from '../../core/modules/db/index.js';
import { dbClipToClip } from '../../core/modules/trips/index.js';
import { desc } from 'drizzle-orm';

export function registerClipsHandlers(): void {
  ipcMain.handle(IPC.CLIPS.LIST, () => {
    const db = getDb();
    const rows = db.select().from(schema.clips).orderBy(desc(schema.clips.tsSource)).all();
    return rows.map(dbClipToClip);
  });
}
