import { describe, it, expect } from 'vitest';
import { importReducer } from '../../src/renderer/components/importReducer.js';
import type { ScanResult } from '../../src/interfaces/scanner.js';
import type { Pattern } from '../../src/interfaces/patterns.js';

const mockPattern: Pattern = {
  id: 'viofo',
  name: 'Viofo',
  format: '\\d{8}_\\d{6}',
  builtin: true,
};

const mockResult: ScanResult = {
  clipsFound: 10,
  clipsNew: 8,
  clipsRemoved: 0,
  tripsGrouped: 2,
  errors: [],
};

describe('importReducer', () => {
  describe('SELECT_DIR', () => {
    it('transitions idle → detecting', () => {
      const next = importReducer({ step: 'idle' }, { type: 'SELECT_DIR', dir: '/footage' });
      expect(next).toEqual({ step: 'detecting', dir: '/footage' });
    });

    it('resets from any step back to detecting', () => {
      const from = { step: 'error' as const, message: 'oops' };
      const next = importReducer(from, { type: 'SELECT_DIR', dir: '/new-footage' });
      expect(next).toEqual({ step: 'detecting', dir: '/new-footage' });
    });
  });

  describe('DETECTED', () => {
    it('transitions detecting → confirm when files are found', () => {
      const state = { step: 'detecting' as const, dir: '/footage' };
      const next = importReducer(state, {
        type: 'DETECTED',
        pattern: mockPattern,
        fileCount: 5,
      });
      expect(next).toEqual({
        step: 'confirm',
        dir: '/footage',
        pattern: mockPattern,
        fileCount: 5,
      });
    });

    it('transitions detecting → error when fileCount is 0', () => {
      const state = { step: 'detecting' as const, dir: '/empty-folder' };
      const next = importReducer(state, { type: 'DETECTED', pattern: null, fileCount: 0 });
      expect(next.step).toBe('error');
      expect((next as { step: 'error'; message: string }).message).toMatch(/no videos/i);
    });

    it('accepts null pattern (unknown format)', () => {
      const state = { step: 'detecting' as const, dir: '/footage' };
      const next = importReducer(state, { type: 'DETECTED', pattern: null, fileCount: 3 });
      expect(next).toEqual({ step: 'confirm', dir: '/footage', pattern: null, fileCount: 3 });
    });

    it('is ignored when not in detecting step', () => {
      const state = { step: 'idle' as const };
      const next = importReducer(state, { type: 'DETECTED', pattern: null, fileCount: 5 });
      expect(next).toBe(state);
    });
  });

  describe('CONFIRM_SCAN', () => {
    it('transitions confirm → scanning', () => {
      const state = {
        step: 'confirm' as const,
        dir: '/footage',
        pattern: mockPattern,
        fileCount: 5,
      };
      const next = importReducer(state, { type: 'CONFIRM_SCAN' });
      expect(next).toEqual({ step: 'scanning', dir: '/footage', progress: null });
    });

    it('is ignored when not in confirm step', () => {
      const state = { step: 'idle' as const };
      const next = importReducer(state, { type: 'CONFIRM_SCAN' });
      expect(next).toBe(state);
    });
  });

  describe('PROGRESS', () => {
    it('updates progress while scanning', () => {
      const state = { step: 'scanning' as const, dir: '/footage', progress: null };
      const progress = { phase: 'probing' as const, current: 3, total: 10 };
      const next = importReducer(state, { type: 'PROGRESS', progress });
      expect(next).toEqual({ step: 'scanning', dir: '/footage', progress });
    });

    it('is ignored when not in scanning step', () => {
      const state = { step: 'idle' as const };
      const next = importReducer(state, {
        type: 'PROGRESS',
        progress: { phase: 'probing', current: 1, total: 5 },
      });
      expect(next).toBe(state);
    });
  });

  describe('SCAN_DONE', () => {
    it('transitions scanning → done', () => {
      const state = { step: 'scanning' as const, dir: '/footage', progress: null };
      const next = importReducer(state, { type: 'SCAN_DONE', result: mockResult });
      expect(next).toEqual({ step: 'done', result: mockResult });
    });
  });

  describe('ERROR', () => {
    it('transitions any step → error', () => {
      const state = { step: 'scanning' as const, dir: '/footage', progress: null };
      const next = importReducer(state, { type: 'ERROR', message: 'Disk full' });
      expect(next).toEqual({ step: 'error', message: 'Disk full' });
    });

    it('transitions from detecting → error', () => {
      const state = { step: 'detecting' as const, dir: '/footage' };
      const next = importReducer(state, { type: 'ERROR', message: 'Permission denied' });
      expect(next).toEqual({ step: 'error', message: 'Permission denied' });
    });
  });
});
