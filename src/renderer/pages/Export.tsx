import { useState, useEffect, useCallback } from 'react';
import type { ExportProgress, ExportPreset, ExportSpeed } from '../../interfaces/exporter.js';
import type { Trip, Clip } from '../../interfaces/trips.js';

type ExportState = 'options' | 'exporting' | 'done' | 'error';

interface ExportTarget {
  tripIds?: string[];
  clipPaths?: string[];
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

const phaseLabels: Record<ExportProgress['phase'], string> = {
  preparing: 'Preparing...',
  concatenating: 'Concatenating (lossless)...',
  encoding: 'Encoding...',
  finalizing: 'Finalizing...',
};

// --- Styles ---

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 41px)',
  backgroundColor: '#0c0e12',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 16px',
  backgroundColor: '#13161c',
  borderBottom: '1px solid #1e2330',
};

const backBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  border: '1px solid #1e2330',
  borderRadius: '4px',
  background: 'transparent',
  color: '#5a6175',
  cursor: 'pointer',
  fontSize: '0.7rem',
  fontFamily: 'inherit',
  fontWeight: 500,
  letterSpacing: '0.05em',
};

const titleStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#e2e5eb',
  fontWeight: 500,
  flex: 1,
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '24px',
  padding: '24px',
};

const panelStyle: React.CSSProperties = {
  backgroundColor: '#13161c',
  border: '1px solid #1e2330',
  borderRadius: '6px',
  padding: '20px 24px',
  width: '100%',
  maxWidth: '480px',
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: '#e2e5eb',
  fontWeight: 500,
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
  marginBottom: '12px',
};

const summaryRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 0',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#5a6175',
};

const valueStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#c9cdd4',
  fontVariantNumeric: 'tabular-nums',
};

const compatBadgeStyle = (compatible: boolean): React.CSSProperties => ({
  fontSize: '0.65rem',
  padding: '2px 8px',
  borderRadius: '3px',
  backgroundColor: compatible ? '#16331d' : '#331616',
  color: compatible ? '#4ade80' : '#f87171',
  fontWeight: 500,
});

const optionGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0',
  border: '1px solid #1e2330',
  borderRadius: '4px',
  overflow: 'hidden',
};

const optionBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  border: 'none',
  background: active ? '#1e2330' : 'transparent',
  color: active ? '#e2e5eb' : '#5a6175',
  cursor: 'pointer',
  fontSize: '0.68rem',
  fontFamily: 'inherit',
  fontWeight: 500,
  letterSpacing: '0.04em',
  transition: 'color 0.15s, background 0.15s',
});

const presetGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0',
  border: '1px solid #1e2330',
  borderRadius: '4px',
  overflow: 'hidden',
  marginTop: '8px',
};

const exportBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '8px 24px',
  border: 'none',
  borderRadius: '4px',
  background: disabled ? '#1e2330' : '#3b82f6',
  color: disabled ? '#5a6175' : '#fff',
  cursor: disabled ? 'default' : 'pointer',
  fontSize: '0.72rem',
  fontFamily: 'inherit',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
  transition: 'background 0.15s',
});

const cancelBtnStyle: React.CSSProperties = {
  padding: '6px 16px',
  border: '1px solid #1e2330',
  borderRadius: '4px',
  background: 'transparent',
  color: '#f87171',
  cursor: 'pointer',
  fontSize: '0.68rem',
  fontFamily: 'inherit',
  fontWeight: 500,
  letterSpacing: '0.05em',
};

const progressBarContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '6px',
  backgroundColor: '#1e2330',
  borderRadius: '3px',
  overflow: 'hidden',
  marginTop: '8px',
};

const progressBarFillStyle = (percent: number): React.CSSProperties => ({
  height: '100%',
  width: `${percent}%`,
  backgroundColor: '#3b82f6',
  borderRadius: '3px',
  transition: 'width 0.3s ease',
});

const progressTextStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '6px',
};

const phaseStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  color: '#8b93a5',
};

const percentStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  color: '#c9cdd4',
  fontVariantNumeric: 'tabular-nums',
};

const speedStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#5a6175',
  fontVariantNumeric: 'tabular-nums',
};

const doneBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  border: 'none',
  borderRadius: '4px',
  background: '#16a34a',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '0.72rem',
  fontFamily: 'inherit',
  fontWeight: 600,
  letterSpacing: '0.05em',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '6px 16px',
  border: '1px solid #1e2330',
  borderRadius: '4px',
  background: 'transparent',
  color: '#c9cdd4',
  cursor: 'pointer',
  fontSize: '0.68rem',
  fontFamily: 'inherit',
  fontWeight: 500,
  letterSpacing: '0.05em',
};

const doneRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  justifyContent: 'center',
};

const errorTextStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#f87171',
  textAlign: 'center',
};

const outputPathStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#5a6175',
  wordBreak: 'break-all',
  textAlign: 'center',
  marginTop: '4px',
};

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#3b4559',
  fontSize: '0.8rem',
};

interface ExportProps {
  target: ExportTarget;
  onBack: () => void;
}

export function Export({ target, onBack }: ExportProps): React.ReactElement {
  const [state, setState] = useState<ExportState>('options');
  const [loading, setLoading] = useState(true);

  // Summary info
  const [clips, setClips] = useState<Clip[]>([]);
  const [tripNames, setTripNames] = useState<string[]>([]);
  const [losslessOk, setLosslessOk] = useState(true);

  // Options
  const [reencode, setReencode] = useState(false);
  const [preset, setPreset] = useState<ExportPreset>('medium');
  const [speed, setSpeed] = useState<ExportSpeed>('balanced');

  // Progress
  const [progress, setProgress] = useState<ExportProgress | null>(null);

  // Result
  const [outputPath, setOutputPath] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Load clip info for summary
  useEffect(() => {
    (async () => {
      try {
        const allClips: Clip[] = [];
        const names: string[] = [];

        if (target.tripIds) {
          for (const tripId of target.tripIds) {
            const trip: Trip = await window.api.trips.get(tripId);
            names.push(trip.name);
            const tripClips = await window.api.trips.getClips(tripId);
            allClips.push(
              ...tripClips.map((c: Clip) => ({
                ...c,
                timestampSource: new Date(c.timestampSource),
                createdAt: new Date(c.createdAt),
              })),
            );
          }
        }

        if (target.clipPaths) {
          for (const path of target.clipPaths) {
            // For direct clips, we use minimal info
            allClips.push({
              id: '',
              path,
              filename: path.split('/').pop() ?? path,
              size: 0,
              duration: 0,
              codec: '',
              width: 0,
              height: 0,
              fps: 0,
              patternId: null,
              timestampSource: new Date(),
              tripId: null,
              status: 'available',
              createdAt: new Date(),
            });
          }
        }

        // Check codec compatibility
        if (allClips.length > 1) {
          const first = allClips[0];
          const compatible = allClips.every(
            (c) => c.codec === first.codec && c.width === first.width && c.height === first.height,
          );
          setLosslessOk(compatible);
          if (!compatible) setReencode(true);
        }

        setClips(allClips);
        setTripNames(names);
      } finally {
        setLoading(false);
      }
    })();
  }, [target]);

  // Listen for progress
  useEffect(() => {
    if (state !== 'exporting') return;
    const cleanup = window.api.exporter.onProgress((p) => {
      setProgress(p);
    });
    return cleanup;
  }, [state]);

  const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0);
  const totalSize = clips.reduce((sum, c) => sum + c.size, 0);

  const handleExport = useCallback(async () => {
    setState('exporting');
    setProgress(null);

    try {
      const result = await window.api.exporter.export({
        tripIds: target.tripIds,
        filePaths: target.clipPaths,
        reencode,
        preset: reencode ? preset : undefined,
        speed: reencode ? speed : undefined,
      });
      setOutputPath(result);
      setState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('cancelled') || msg.includes('CANCELLED')) {
        setState('options');
      } else {
        setErrorMsg(msg);
        setState('error');
      }
    }
  }, [target, reencode, preset, speed]);

  const handleCancel = useCallback(() => {
    window.api.exporter.cancel();
  }, []);

  const handleOpenFolder = useCallback(() => {
    if (outputPath) {
      window.api.exporter.openFolder(outputPath);
    }
  }, [outputPath]);

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button type="button" style={backBtnStyle} onClick={onBack}>
            Back
          </button>
          <span style={titleStyle}>Export</span>
        </div>
        <div style={loadingStyle}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <button
          type="button"
          style={backBtnStyle}
          onClick={onBack}
          disabled={state === 'exporting'}
        >
          Back
        </button>
        <span style={titleStyle}>Export</span>
      </div>

      <div style={contentStyle}>
        {/* Summary panel */}
        <div style={panelStyle}>
          <div style={panelTitleStyle}>Summary</div>
          {tripNames.length > 0 && (
            <div style={summaryRowStyle}>
              <span style={labelStyle}>{tripNames.length === 1 ? 'Trip' : 'Trips'}</span>
              <span style={valueStyle}>{tripNames.join(', ')}</span>
            </div>
          )}
          <div style={summaryRowStyle}>
            <span style={labelStyle}>Clips</span>
            <span style={valueStyle}>{clips.length}</span>
          </div>
          {totalDuration > 0 && (
            <div style={summaryRowStyle}>
              <span style={labelStyle}>Duration</span>
              <span style={valueStyle}>{formatDuration(totalDuration)}</span>
            </div>
          )}
          {totalSize > 0 && (
            <div style={summaryRowStyle}>
              <span style={labelStyle}>Size</span>
              <span style={valueStyle}>{formatSize(totalSize)}</span>
            </div>
          )}
          <div style={summaryRowStyle}>
            <span style={labelStyle}>Lossless</span>
            <span style={compatBadgeStyle(losslessOk)}>
              {losslessOk ? 'Compatible' : 'Incompatible'}
            </span>
          </div>
        </div>

        {/* Options panel — shown only in options state */}
        {state === 'options' && (
          <div style={panelStyle}>
            <div style={panelTitleStyle}>Options</div>
            <div style={summaryRowStyle}>
              <span style={labelStyle}>Mode</span>
              <div style={optionGroupStyle}>
                <button
                  type="button"
                  style={optionBtnStyle(!reencode)}
                  onClick={() => setReencode(false)}
                  disabled={!losslessOk}
                >
                  Lossless
                </button>
                <button
                  type="button"
                  style={optionBtnStyle(reencode)}
                  onClick={() => setReencode(true)}
                >
                  Re-encode
                </button>
              </div>
            </div>
            {reencode && (
              <>
                <div style={summaryRowStyle}>
                  <span style={labelStyle}>Quality</span>
                  <div style={presetGroupStyle}>
                    {(['high', 'medium', 'low'] as ExportPreset[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        style={optionBtnStyle(preset === p)}
                        onClick={() => setPreset(p)}
                      >
                        {p === 'high' ? 'High' : p === 'medium' ? 'Medium' : 'Low'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={summaryRowStyle}>
                  <span style={labelStyle}>Speed</span>
                  <div style={presetGroupStyle}>
                    {(['fast', 'balanced', 'max'] as ExportSpeed[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        style={optionBtnStyle(speed === s)}
                        onClick={() => setSpeed(s)}
                      >
                        {s === 'fast' ? 'Fast' : s === 'balanced' ? 'Balanced' : 'Max quality'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button type="button" style={exportBtnStyle(false)} onClick={handleExport}>
                Export
              </button>
            </div>
          </div>
        )}

        {/* Progress panel */}
        {state === 'exporting' && (
          <div style={panelStyle}>
            <div style={panelTitleStyle}>Exporting</div>
            <div style={progressBarContainerStyle}>
              <div style={progressBarFillStyle(progress?.percent ?? 0)} />
            </div>
            <div style={progressTextStyle}>
              <span style={phaseStyle}>{phaseLabels[progress?.phase ?? 'preparing']}</span>
              <span style={percentStyle}>{Math.round(progress?.percent ?? 0)}%</span>
            </div>
            {progress?.speed ? (
              <div style={{ textAlign: 'right' }}>
                <span style={speedStyle}>{progress.speed.toFixed(1)}x</span>
              </div>
            ) : null}
            {progress?.currentFile && (
              <div style={{ marginTop: '4px' }}>
                <span style={{ ...labelStyle, fontSize: '0.62rem' }}>{progress.currentFile}</span>
              </div>
            )}
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <button type="button" style={cancelBtnStyle} onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Done panel */}
        {state === 'done' && (
          <div style={panelStyle}>
            <div style={{ ...panelTitleStyle, color: '#4ade80' }}>Export Complete</div>
            <div style={outputPathStyle}>{outputPath}</div>
            <div style={{ ...doneRowStyle, marginTop: '16px' }}>
              <button type="button" style={doneBtnStyle} onClick={handleOpenFolder}>
                Open Folder
              </button>
              <button type="button" style={secondaryBtnStyle} onClick={onBack}>
                Back to Library
              </button>
            </div>
          </div>
        )}

        {/* Error panel */}
        {state === 'error' && (
          <div style={panelStyle}>
            <div style={{ ...panelTitleStyle, color: '#f87171' }}>Export Failed</div>
            <div style={errorTextStyle}>{errorMsg}</div>
            <div style={{ ...doneRowStyle, marginTop: '16px' }}>
              <button
                type="button"
                style={exportBtnStyle(false)}
                onClick={() => {
                  setErrorMsg('');
                  setState('options');
                }}
              >
                Retry
              </button>
              <button type="button" style={secondaryBtnStyle} onClick={onBack}>
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
