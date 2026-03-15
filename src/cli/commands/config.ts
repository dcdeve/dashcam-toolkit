import { db } from '../../core/modules/db/index.js';
import { getDb } from '../../core/modules/db/index.js';
import { schema } from '../../core/modules/db/index.js';
import { eq } from 'drizzle-orm';
import { getDbPath } from '../utils.js';

export function configAction(key?: string, value?: string): void {
  const dbPath = getDbPath();
  db.connect({ path: dbPath });
  db.migrate();

  try {
    const drizzle = getDb();

    if (key && value) {
      // Set
      const existing = drizzle
        .select()
        .from(schema.settings)
        .where(eq(schema.settings.key, key))
        .get();

      if (existing) {
        drizzle.update(schema.settings).set({ value }).where(eq(schema.settings.key, key)).run();
      } else {
        drizzle.insert(schema.settings).values({ key, value }).run();
      }
      console.log(`${key} = ${value}`);
    } else if (key) {
      // Get
      const row = drizzle.select().from(schema.settings).where(eq(schema.settings.key, key)).get();

      if (row) {
        console.log(`${key} = ${row.value}`);
      } else {
        console.log(`${key}: not set`);
      }
    } else {
      // List all
      const rows = drizzle.select().from(schema.settings).all();
      if (rows.length === 0) {
        console.log('No settings configured.');
        return;
      }
      console.log('Settings:');
      for (const row of rows) {
        console.log(`  ${row.key} = ${row.value}`);
      }
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}
