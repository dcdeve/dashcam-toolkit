import { useReducer, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAppStore } from '@/store';
import { importReducer } from './importReducer.js';

// ─── Component ────────────────────────────────────────────────────────────────

export function ImportDrawer(): React.ReactElement | null {
  const { isImportOpen, importInitialDir, closeImportDrawer, refresh } = useAppStore();
  const [state, dispatch] = useReducer(importReducer, { step: 'idle' });

  // Seed reducer when drawer opens with a selected directory
  useEffect(() => {
    if (isImportOpen && importInitialDir) {
      dispatch({ type: 'SELECT_DIR', dir: importInitialDir });
    }
  }, [isImportOpen, importInitialDir]);

  // Auto-detect pattern when in detecting step
  useEffect(() => {
    if (state.step !== 'detecting') return;
    const dir = state.dir;
    let cancelled = false;

    (async () => {
      try {
        const clips = await window.api.scanner.listClips(dir);
        if (cancelled) return;
        const fileCount = clips.length;
        const firstClip = clips[0] as { filename: string } | undefined;
        const pattern = firstClip ? await window.api.patterns.detect(firstClip.filename) : null;
        if (cancelled) return;
        dispatch({ type: 'DETECTED', pattern, fileCount });
      } catch (err) {
        if (!cancelled) {
          dispatch({ type: 'ERROR', message: err instanceof Error ? err.message : String(err) });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.step, state.step === 'detecting' ? state.dir : null]);

  // Subscribe to scanner progress events
  useEffect(() => {
    if (state.step !== 'scanning') return;
    return window.api.scanner.onProgress((progress) => {
      dispatch({ type: 'PROGRESS', progress });
    });
  }, [state.step]);

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

  function handleClose(): void {
    closeImportDrawer();
  }

  function handleDone(): void {
    refresh();
    closeImportDrawer();
  }

  const progressPercent =
    state.step === 'scanning' && state.progress && state.progress.total > 0
      ? Math.round((state.progress.current / state.progress.total) * 100)
      : 0;

  return (
    <Sheet
      open={isImportOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <SheetContent className="w-[400px] bg-card border-border sm:max-w-[400px]">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="text-foreground">Import Footage</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-6">
          {/* detecting / idle — show spinner while detecting files */}
          {(state.step === 'idle' || state.step === 'detecting') && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Detecting files…</p>
              {state.step === 'detecting' && (
                <p className="text-xs text-muted-foreground truncate max-w-full px-4 text-center">
                  {state.dir}
                </p>
              )}
            </div>
          )}

          {/* confirm — show detected info before scan starts */}
          {state.step === 'confirm' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg bg-secondary p-4">
                <p className="text-sm font-medium text-foreground">
                  {state.fileCount} video{state.fileCount !== 1 ? 's' : ''} found
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">{state.dir}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Pattern detected</p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {state.pattern ? state.pattern.name : 'Unknown (will import without pattern)'}
                </p>
              </div>
            </div>
          )}

          {/* scanning — progress bar */}
          {state.step === 'scanning' && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground truncate">{state.dir}</p>
              {state.progress ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground capitalize">
                      {state.progress.phase}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {state.progress.current}/{state.progress.total}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Starting scan…</span>
                </div>
              )}
            </div>
          )}

          {/* done — summary */}
          {state.step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Import complete</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {state.result.clipsNew} new clip{state.result.clipsNew !== 1 ? 's' : ''} ·{' '}
                  {state.result.tripsGrouped} trip{state.result.tripsGrouped !== 1 ? 's' : ''}
                </p>
                {state.result.errors.length > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {state.result.errors.length} error{state.result.errors.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* error — message with retry/cancel */}
          {state.step === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm text-center text-muted-foreground px-4">{state.message}</p>
            </div>
          )}
        </div>

        {/* Actions — pinned to bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card p-4">
          {(state.step === 'idle' || state.step === 'detecting') && (
            <Button variant="secondary" className="w-full" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {state.step === 'confirm' && (
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={() => dispatch({ type: 'CONFIRM_SCAN' })}>
                Start scan
              </Button>
            </div>
          )}

          {state.step === 'scanning' && (
            <Button variant="secondary" className="w-full" onClick={handleClose}>
              Cancel
            </Button>
          )}

          {state.step === 'done' && (
            <Button className="w-full" onClick={handleDone}>
              Done
            </Button>
          )}

          {state.step === 'error' && (
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Pick another folder
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
