import { format } from 'date-fns';
import { getDb } from '../db/index.js';
import { schema } from '../db/index.js';
import { eq, inArray } from 'drizzle-orm';
import type {
  Trip,
  Clip,
  GroupOptions,
  TripError,
  TripsModule,
  CodecCompatibility,
  TripStatus,
} from '../../../interfaces/trips.js';

export class TripsModuleError extends Error {
  constructor(
    public readonly code: TripError,
    message: string,
  ) {
    super(message);
    this.name = 'TripsModuleError';
  }
}

const DEFAULT_GAP_MINUTES = 5;

export interface DbClipRow {
  id: string;
  path: string;
  durationMs: number | null;
  codecVideo: string | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  patternId: string | null;
  tsSource: number | null;
  tripId: string | null;
  fileSize: number | null;
  createdAt: number;
}

export function dbClipToClip(row: DbClipRow): Clip {
  return {
    id: row.id,
    path: row.path,
    filename: row.path.split('/').pop() ?? row.path,
    size: row.fileSize ?? 0,
    duration: (row.durationMs ?? 0) / 1000,
    codec: row.codecVideo ?? 'unknown',
    width: row.width ?? 0,
    height: row.height ?? 0,
    fps: row.fps ?? 0,
    patternId: row.patternId,
    timestampSource: new Date(row.tsSource ?? row.createdAt),
    tripId: row.tripId,
    status: 'available',
    createdAt: new Date(row.createdAt),
  };
}

interface DbTripRow {
  id: string;
  name: string;
  tsStart: number;
  tsEnd: number;
  clipCount: number;
  codecCompatible: boolean;
  status: string;
  createdAt: number;
}

function dbTripToTrip(row: DbTripRow): Trip {
  return {
    id: row.id,
    name: row.name,
    startedAt: new Date(row.tsStart),
    endedAt: new Date(row.tsEnd),
    clipCount: row.clipCount,
    totalDuration: 0,
    codecCompat: row.codecCompatible ? 'compatible' : 'incompatible',
    status: row.status as TripStatus,
    createdAt: new Date(row.createdAt),
  };
}

function checkCodecCompatibility(clips: Clip[]): CodecCompatibility {
  if (clips.length === 0) return 'unknown';
  const first = clips[0];
  if (first.codec === 'unknown') return 'unknown';

  for (let i = 1; i < clips.length; i++) {
    const c = clips[i];
    if (c.codec !== first.codec || c.width !== first.width || c.height !== first.height) {
      return 'incompatible';
    }
  }
  return 'compatible';
}

function groupByGap(clips: Clip[], gapMinutes: number): Clip[][] {
  if (clips.length === 0) return [];

  const sorted = [...clips].sort(
    (a, b) => a.timestampSource.getTime() - b.timestampSource.getTime(),
  );
  const gapMs = gapMinutes * 60 * 1000;
  const groups: Clip[][] = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevEnd = prev.timestampSource.getTime() + prev.duration * 1000;
    const gap = curr.timestampSource.getTime() - prevEnd;

    if (gap > gapMs) {
      groups.push([curr]);
    } else {
      groups[groups.length - 1].push(curr);
    }
  }

  return groups;
}

export const trips: TripsModule = {
  async groupClips(clipIds: string[], options?: GroupOptions): Promise<Trip[]> {
    if (clipIds.length === 0) {
      throw new TripsModuleError('TRIP_NO_CLIPS', 'No clip IDs provided');
    }

    const db = getDb();
    const rows = db.select().from(schema.clips).where(inArray(schema.clips.id, clipIds)).all();

    if (rows.length === 0) {
      throw new TripsModuleError('TRIP_NO_CLIPS', 'No clips found for the given IDs');
    }

    const clips = rows.map(dbClipToClip);
    const gapMinutes = options?.gapMinutes ?? DEFAULT_GAP_MINUTES;
    const groups = groupByGap(clips, gapMinutes);
    const result: Trip[] = [];

    for (const group of groups) {
      const tripId = crypto.randomUUID();
      const firstClip = group[0];
      const lastClip = group[group.length - 1];
      const tsStart = firstClip.timestampSource.getTime();
      const tsEnd = lastClip.timestampSource.getTime() + lastClip.duration * 1000;
      const totalDuration = group.reduce((sum, c) => sum + c.duration, 0);
      const codecCompat = checkCodecCompatibility(group);
      const name = `Trip ${format(new Date(tsStart), 'yyyy-MM-dd HH:mm')}`;

      db.insert(schema.trips)
        .values({
          id: tripId,
          name,
          tsStart,
          tsEnd: Math.round(tsEnd),
          clipCount: group.length,
          codecCompatible: codecCompat === 'compatible',
          status: 'pending',
        })
        .run();

      for (const clip of group) {
        db.update(schema.clips).set({ tripId }).where(eq(schema.clips.id, clip.id)).run();
      }

      result.push({
        id: tripId,
        name,
        startedAt: new Date(tsStart),
        endedAt: new Date(tsEnd),
        clipCount: group.length,
        totalDuration,
        codecCompat,
        status: 'complete',
        createdAt: new Date(),
      });
    }

    return result;
  },

  async getTrip(tripId: string): Promise<Trip> {
    const db = getDb();
    const row = db.select().from(schema.trips).where(eq(schema.trips.id, tripId)).get();

    if (!row) {
      throw new TripsModuleError('TRIP_NOT_FOUND', `Trip not found: ${tripId}`);
    }

    const clipRows = db.select().from(schema.clips).where(eq(schema.clips.tripId, tripId)).all();
    const totalDuration = clipRows.reduce((sum, c) => sum + (c.durationMs ?? 0) / 1000, 0);

    const trip = dbTripToTrip(row);
    trip.totalDuration = totalDuration;
    return trip;
  },

  async getClips(tripId: string): Promise<Clip[]> {
    const db = getDb();

    const tripRow = db.select().from(schema.trips).where(eq(schema.trips.id, tripId)).get();
    if (!tripRow) {
      throw new TripsModuleError('TRIP_NOT_FOUND', `Trip not found: ${tripId}`);
    }

    const rows = db.select().from(schema.clips).where(eq(schema.clips.tripId, tripId)).all();
    return rows
      .map(dbClipToClip)
      .sort((a, b) => a.timestampSource.getTime() - b.timestampSource.getTime());
  },

  async list(): Promise<Trip[]> {
    const db = getDb();
    const rows = db.select().from(schema.trips).all();

    return Promise.all(
      rows.map(async (row) => {
        const clipRows = db
          .select()
          .from(schema.clips)
          .where(eq(schema.clips.tripId, row.id))
          .all();
        const totalDuration = clipRows.reduce((sum, c) => sum + (c.durationMs ?? 0) / 1000, 0);
        const trip = dbTripToTrip(row);
        trip.totalDuration = totalDuration;
        return trip;
      }),
    );
  },

  async remove(tripId: string): Promise<void> {
    const db = getDb();

    const row = db.select().from(schema.trips).where(eq(schema.trips.id, tripId)).get();
    if (!row) {
      throw new TripsModuleError('TRIP_NOT_FOUND', `Trip not found: ${tripId}`);
    }

    db.update(schema.clips).set({ tripId: null }).where(eq(schema.clips.tripId, tripId)).run();
    db.delete(schema.trips).where(eq(schema.trips.id, tripId)).run();
  },
};
