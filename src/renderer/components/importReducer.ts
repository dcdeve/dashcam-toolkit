import type { ScanProgress, ScanResult } from '../../interfaces/scanner.js';
import type { Pattern } from '../../interfaces/patterns.js';

// ─── State Machine ────────────────────────────────────────────────────────────

export type ImportState =
  | { step: 'idle' }
  | { step: 'detecting'; dir: string }
  | { step: 'confirm'; dir: string; pattern: Pattern | null; fileCount: number }
  | { step: 'scanning'; dir: string; progress: ScanProgress | null }
  | { step: 'done'; result: ScanResult }
  | { step: 'error'; message: string };

export type ImportAction =
  | { type: 'SELECT_DIR'; dir: string }
  | { type: 'RESCAN_DIR'; dir: string }
  | { type: 'DETECTED'; pattern: Pattern | null; fileCount: number }
  | { type: 'CONFIRM_SCAN' }
  | { type: 'PROGRESS'; progress: ScanProgress }
  | { type: 'SCAN_DONE'; result: ScanResult }
  | { type: 'ERROR'; message: string };

export function importReducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case 'SELECT_DIR':
      return { step: 'detecting', dir: action.dir };
    case 'RESCAN_DIR':
      return { step: 'confirm', dir: action.dir, pattern: null, fileCount: 0 };
    case 'DETECTED':
      if (state.step !== 'detecting') return state;
      if (action.fileCount === 0) {
        return {
          step: 'error',
          message: 'No videos found in this folder. Please pick a different folder.',
        };
      }
      return {
        step: 'confirm',
        dir: state.dir,
        pattern: action.pattern,
        fileCount: action.fileCount,
      };
    case 'CONFIRM_SCAN':
      if (state.step !== 'confirm') return state;
      return { step: 'scanning', dir: state.dir, progress: null };
    case 'PROGRESS':
      if (state.step !== 'scanning') return state;
      return { ...state, progress: action.progress };
    case 'SCAN_DONE':
      return { step: 'done', result: action.result };
    case 'ERROR':
      return { step: 'error', message: action.message };
  }
}
