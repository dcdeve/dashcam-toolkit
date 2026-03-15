import { useReducer, useEffect } from 'react';
import type { ScanProgress, ScanResult } from '../../interfaces/scanner.js';
import type { Pattern } from '../../interfaces/patterns.js';

// -- State machine --

type ImportState =
  | { step: 'idle' }
  | { step: 'detecting'; dir: string }
  | { step: 'confirm'; dir: string; pattern: Pattern | null; fileCount: number }
  | { step: 'scanning'; dir: string; progress: ScanProgress | null }
  | { step: 'done'; result: ScanResult }
  | { step: 'error'; message: string };

type ImportAction =
  | { type: 'SELECT_DIR'; dir: string }
  | { type: 'DETECTED'; pattern: Pattern | null; fileCount: number }
  | { type: 'CONFIRM_SCAN' }
  | { type: 'PROGRESS'; progress: ScanProgress }
  | { type: 'SCAN_DONE'; result: ScanResult }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' };

function reducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case 'SELECT_DIR':
      return { step: 'detecting', dir: action.dir };
    case 'DETECTED':
      if (state.step !== 'detecting') return state;
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
    case 'RESET':
      return { step: 'idle' };
  }
}

// -- Component --

export function ImportFlow({ onDone }: { onDone?: () => void }): React.ReactElement {
  const [state, dispatch] = useReducer(reducer, { step: 'idle' });

  // Subscribe to scanner progress
  useEffect(() => {
    if (state.step !== 'scanning') return;
    const cleanup = window.api.scanner.onProgress((progress) => {
      dispatch({ type: 'PROGRESS', progress });
    });
    return cleanup;
  }, [state.step]);

  // Auto-detect pattern when dir is selected
  useEffect(() => {
    if (state.step !== 'detecting') return;
    const dir = state.dir;

    (async () => {
      try {
        const clips = await window.api.scanner.listClips(dir);
        const fileCount = clips.length;
        if (fileCount === 0) {
          dispatch({ type: 'ERROR', message: 'No video files found in this folder.' });
          return;
        }
        // Detect pattern from first file
        const firstClip = clips[0] as { filename: string };
        const pattern = await window.api.patterns.detect(firstClip.filename);
        dispatch({ type: 'DETECTED', pattern, fileCount });
      } catch (err) {
        dispatch({ type: 'ERROR', message: err instanceof Error ? err.message : String(err) });
      }
    })();
  }, [state.step, state.step === 'detecting' ? state.dir : null]);

  // Start scan when confirmed
  useEffect(() => {
    if (state.step !== 'scanning') return;
    const dir = state.dir;

    (async () => {
      try {
        const result = await window.api.scanner.scan({ dir });
        dispatch({ type: 'SCAN_DONE', result });
      } catch (err) {
        dispatch({ type: 'ERROR', message: err instanceof Error ? err.message : String(err) });
      }
    })();
  }, [state.step, state.step === 'scanning' ? state.dir : null]);

  async function handleSelectFolder(): Promise<void> {
    const dir = await window.api.dialog.openDirectory();
    if (dir) {
      dispatch({ type: 'SELECT_DIR', dir });
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Import</h2>

      {state.step === 'idle' && (
        <button onClick={handleSelectFolder} type="button">
          Select dashcam folder...
        </button>
      )}

      {state.step === 'detecting' && <p>Detecting pattern in {state.dir}...</p>}

      {state.step === 'confirm' && (
        <div>
          <p>
            Folder: <strong>{state.dir}</strong>
          </p>
          <p>Files found: {state.fileCount}</p>
          <p>
            Pattern detected:{' '}
            {state.pattern ? (
              <strong>{state.pattern.name}</strong>
            ) : (
              <em>Unknown (will import without pattern)</em>
            )}
          </p>
          <button onClick={() => dispatch({ type: 'CONFIRM_SCAN' })} type="button">
            Start import
          </button>
          <button
            onClick={() => dispatch({ type: 'RESET' })}
            type="button"
            style={{ marginLeft: '0.5rem' }}
          >
            Cancel
          </button>
        </div>
      )}

      {state.step === 'scanning' && (
        <div>
          <p>Scanning {state.dir}...</p>
          {state.progress && (
            <div>
              <p>
                {state.progress.phase}: {state.progress.current}/{state.progress.total}
              </p>
              <progress
                value={state.progress.current}
                max={state.progress.total}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>
      )}

      {state.step === 'done' && (
        <div>
          <h3>Import complete</h3>
          <p>
            Clips found: {state.result.clipsFound} ({state.result.clipsNew} new)
          </p>
          <p>Trips grouped: {state.result.tripsGrouped}</p>
          {state.result.errors.length > 0 && <p>Errors: {state.result.errors.length}</p>}
          <button
            onClick={() => {
              dispatch({ type: 'RESET' });
              onDone?.();
            }}
            type="button"
          >
            Done
          </button>
        </div>
      )}

      {state.step === 'error' && (
        <div>
          <p style={{ color: '#dc2626' }}>Error: {state.message}</p>
          <button onClick={() => dispatch({ type: 'RESET' })} type="button">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
