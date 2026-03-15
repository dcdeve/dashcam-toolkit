// Trips module interface

export type ClipStatus = 'available' | 'disconnected';
export type TripStatus = 'complete' | 'partial' | 'disconnected';
export type CodecCompatibility = 'compatible' | 'incompatible' | 'unknown';

export interface Clip {
  id: number;
  path: string;
  filename: string;
  size: number;
  duration: number;
  codec: string;
  width: number;
  height: number;
  fps: number;
  patternId: string | null;
  timestampSource: Date;
  tripId: number | null;
  status: ClipStatus;
  createdAt: Date;
}

export interface Trip {
  id: number;
  name: string;
  startedAt: Date;
  endedAt: Date;
  clipCount: number;
  totalDuration: number;
  codecCompat: CodecCompatibility;
  status: TripStatus;
  createdAt: Date;
}

export interface GroupOptions {
  /** Gap in minutes between clips to split trips (default: 5) */
  gapMinutes?: number;
}

export type TripError = 'TRIP_NOT_FOUND' | 'TRIP_NO_CLIPS' | 'TRIP_CODEC_INCOMPATIBLE';

export interface TripsModule {
  groupClips(clipIds: number[], options?: GroupOptions): Promise<Trip[]>;
  getTrip(tripId: number): Promise<Trip>;
  getClips(tripId: number): Promise<Clip[]>;
  list(): Promise<Trip[]>;
  remove(tripId: number): Promise<void>;
}
