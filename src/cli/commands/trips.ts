import { db } from '../../core/modules/db/index.js';
import { trips as tripsModule } from '../../core/modules/trips/index.js';
import { getDbPath } from '../utils.js';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export async function tripsAction(tripId?: string): Promise<void> {
  const dbPath = getDbPath();
  db.connect({ path: dbPath });
  db.migrate();

  try {
    if (tripId) {
      const trip = await tripsModule.getTrip(tripId);
      const clips = await tripsModule.getClips(tripId);

      console.log(`Trip: ${trip.name}`);
      console.log(`  ID:         ${trip.id}`);
      console.log(`  Started:    ${trip.startedAt.toISOString()}`);
      console.log(`  Ended:      ${trip.endedAt.toISOString()}`);
      console.log(`  Duration:   ${formatDuration(trip.totalDuration)}`);
      console.log(`  Clips:      ${trip.clipCount}`);
      console.log(`  Codec:      ${trip.codecCompat}`);
      console.log(`  Status:     ${trip.status}`);
      console.log('');
      console.log('Clips:');
      for (const clip of clips) {
        console.log(
          `  ${clip.filename.padEnd(35)} ${clip.codec.padEnd(8)} ${clip.width}x${clip.height} ${formatDuration(clip.duration)}`,
        );
      }
    } else {
      const all = await tripsModule.list();
      if (all.length === 0) {
        console.log('No trips found. Run "dashcam scan <dir>" first.');
        return;
      }

      console.log('Trips:');
      for (const t of all) {
        console.log(
          `  ${t.id}  ${t.name.padEnd(25)} ${String(t.clipCount).padStart(3)} clips  ${formatDuration(t.totalDuration).padStart(10)}  ${t.codecCompat}`,
        );
      }
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}
