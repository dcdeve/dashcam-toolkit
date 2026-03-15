import { describe, it, expect } from 'vitest';
import type { Trip, Clip, GroupOptions, TripError, TripsModule } from '../../src/interfaces/trips.js';

describe('[trips] - Contract', () => {
  const sampleTrip: Trip = {
    id: 'trip-001',
    name: 'Trip 2026-03-15',
    startedAt: new Date(),
    endedAt: new Date(),
    clipCount: 5,
    totalDuration: 600,
    codecCompat: 'compatible',
    status: 'complete',
    createdAt: new Date(),
  };

  const sampleClip: Clip = {
    id: 'clip-001',
    path: '/mnt/sd/DCIM/clip001.mp4',
    filename: 'clip001.mp4',
    size: 512000,
    duration: 120,
    codec: 'h264',
    width: 1920,
    height: 1080,
    fps: 30,
    patternId: 'garmin',
    timestampSource: new Date(),
    tripId: 'trip-001',
    status: 'available',
    createdAt: new Date(),
  };

  const stub: TripsModule = {
    async groupClips(_clipIds: string[], _options?: GroupOptions) {
      return [sampleTrip];
    },
    async getTrip(_tripId: string) {
      return sampleTrip;
    },
    async getClips(_tripId: string) {
      return [sampleClip];
    },
    async list() {
      return [sampleTrip];
    },
    async remove(_tripId: string) {},
  };

  it('implements all required methods', () => {
    expect(typeof stub.groupClips).toBe('function');
    expect(typeof stub.getTrip).toBe('function');
    expect(typeof stub.getClips).toBe('function');
    expect(typeof stub.list).toBe('function');
    expect(typeof stub.remove).toBe('function');
  });

  it('Trip has all required fields', () => {
    expect(sampleTrip).toHaveProperty('id');
    expect(sampleTrip).toHaveProperty('name');
    expect(sampleTrip).toHaveProperty('startedAt');
    expect(sampleTrip).toHaveProperty('endedAt');
    expect(sampleTrip).toHaveProperty('clipCount');
    expect(sampleTrip).toHaveProperty('totalDuration');
    expect(sampleTrip).toHaveProperty('codecCompat');
    expect(sampleTrip).toHaveProperty('status');
  });

  it('Clip has all required fields', () => {
    expect(sampleClip).toHaveProperty('id');
    expect(sampleClip).toHaveProperty('path');
    expect(sampleClip).toHaveProperty('filename');
    expect(sampleClip).toHaveProperty('duration');
    expect(sampleClip).toHaveProperty('codec');
    expect(sampleClip).toHaveProperty('tripId');
    expect(sampleClip).toHaveProperty('status');
  });

  it('status enums are valid', () => {
    const clipStatuses: Clip['status'][] = ['available', 'disconnected'];
    const tripStatuses: Trip['status'][] = ['complete', 'partial', 'disconnected'];
    const codecCompats: Trip['codecCompat'][] = ['compatible', 'incompatible', 'unknown'];
    expect(clipStatuses).toHaveLength(2);
    expect(tripStatuses).toHaveLength(3);
    expect(codecCompats).toHaveLength(3);
  });

  it('error types cover expected cases', () => {
    const errors: TripError[] = ['TRIP_NOT_FOUND', 'TRIP_NO_CLIPS', 'TRIP_CODEC_INCOMPATIBLE'];
    expect(errors).toHaveLength(3);
  });
});
