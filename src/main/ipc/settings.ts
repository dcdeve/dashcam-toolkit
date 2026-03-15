import { ipcMain } from 'electron';
import { eq } from 'drizzle-orm';
import { IPC } from '../../shared/ipc.js';
import { getDb } from '../../core/modules/db/index.js';
import { settings } from '../../core/modules/db/schema.js';

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC.SETTINGS.GET_ALL, () => {
    const drizzle = getDb();
    const rows = drizzle.select().from(settings).all();
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  });

  ipcMain.handle(IPC.SETTINGS.GET, (_event, key: string) => {
    const drizzle = getDb();
    const row = drizzle.select().from(settings).where(eq(settings.key, key)).get();
    return row?.value ?? null;
  });

  ipcMain.handle(IPC.SETTINGS.SET, (_event, key: string, value: string) => {
    const drizzle = getDb();
    const existing = drizzle.select().from(settings).where(eq(settings.key, key)).get();
    if (existing) {
      drizzle.update(settings).set({ value }).where(eq(settings.key, key)).run();
    } else {
      drizzle.insert(settings).values({ key, value }).run();
    }
  });
}
