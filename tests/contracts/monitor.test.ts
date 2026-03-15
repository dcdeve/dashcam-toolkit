import { describe, it, expect } from 'vitest';
import type {
  WatchOptions,
  MonitorEvent,
  MonitorError,
  MonitorModule,
} from '../../src/interfaces/monitor.js';

describe('[monitor] - Contract', () => {
  const stub: MonitorModule = {
    watch(_options: WatchOptions, _onEvent: (event: MonitorEvent) => void) {},
    stop() {},
    isWatching() {
      return false;
    },
  };

  it('implements all required methods', () => {
    expect(typeof stub.watch).toBe('function');
    expect(typeof stub.stop).toBe('function');
    expect(typeof stub.isWatching).toBe('function');
  });

  it('isWatching returns boolean', () => {
    expect(typeof stub.isWatching()).toBe('boolean');
  });

  it('MonitorEvent shape is valid', () => {
    const event: MonitorEvent = { type: 'inserted', path: '/mnt/sd', timestamp: new Date() };
    expect(event).toHaveProperty('type');
    expect(event).toHaveProperty('path');
    expect(event).toHaveProperty('timestamp');
  });

  it('event types are valid', () => {
    const types: MonitorEvent['type'][] = ['inserted', 'removed'];
    expect(types).toHaveLength(2);
  });

  it('error types cover expected cases', () => {
    const errors: MonitorError[] = [
      'MONITOR_PATH_NOT_FOUND',
      'MONITOR_ALREADY_WATCHING',
      'MONITOR_PERMISSION_DENIED',
    ];
    expect(errors).toHaveLength(3);
  });
});
