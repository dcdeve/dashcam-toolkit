import { useState, useEffect, useRef, useCallback } from 'react';
import type { Clip } from '../../interfaces/trips.js';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatTimestamp(date: Date): string {
  return date.toLocaleString();
}

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

const clipIndicatorStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#5a6175',
  fontVariantNumeric: 'tabular-nums',
};

const videoContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#000',
  minHeight: 0,
  position: 'relative',
};

const videoStyle: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: '100%',
};

const hiddenVideoStyle: React.CSSProperties = {
  ...videoStyle,
  position: 'absolute',
  opacity: 0,
  pointerEvents: 'none',
};

const controlsBarStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#13161c',
  borderTop: '1px solid #1e2330',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const seekBarContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const seekBarStyle: React.CSSProperties = {
  flex: 1,
  height: '4px',
  cursor: 'pointer',
  position: 'relative',
  backgroundColor: '#1e2330',
  borderRadius: '2px',
};

const seekFillStyle = (percent: number): React.CSSProperties => ({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  width: `${percent}%`,
  backgroundColor: '#3b82f6',
  borderRadius: '2px',
  pointerEvents: 'none',
});

const timeStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#5a6175',
  fontVariantNumeric: 'tabular-nums',
  minWidth: '50px',
};

const controlsBtnRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const playBtnStyle: React.CSSProperties = {
  padding: '4px 12px',
  border: '1px solid #1e2330',
  borderRadius: '4px',
  background: 'transparent',
  color: '#c9cdd4',
  cursor: 'pointer',
  fontSize: '0.7rem',
  fontFamily: 'inherit',
  fontWeight: 500,
};

const metaStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#5a6175',
  letterSpacing: '0.05em',
};

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#3b4559',
  fontSize: '0.8rem',
};

const exportBtnStyle: React.CSSProperties = {
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

interface TripPlayerProps {
  tripId: string;
  tripName: string;
  onBack: () => void;
  onExport?: () => void;
}

export function TripPlayer({
  tripId,
  tripName,
  onBack,
  onExport,
}: TripPlayerProps): React.ReactElement {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState<'A' | 'B'>('A');

  // Load clips
  useEffect(() => {
    (async () => {
      try {
        const result = await window.api.trips.getClips(tripId);
        const hydrated = result.map((c: Clip) => ({
          ...c,
          timestampSource: new Date(c.timestampSource),
          createdAt: new Date(c.createdAt),
        }));
        setClips(hydrated);
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0);

  // Calculate global time offset for current clip
  const clipOffsets = clips.reduce<number[]>((acc, c, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + clips[i - 1].duration);
    return acc;
  }, []);

  const globalTime = (clipOffsets[currentIndex] ?? 0) + currentTime;
  const globalPercent = totalDuration > 0 ? (globalTime / totalDuration) * 100 : 0;

  const getActiveRef = useCallback(() => {
    return activeVideo === 'A' ? videoARef : videoBRef;
  }, [activeVideo]);

  const getPreloadRef = useCallback(() => {
    return activeVideo === 'A' ? videoBRef : videoARef;
  }, [activeVideo]);

  // Preload next clip
  useEffect(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < clips.length) {
      const preloadEl = getPreloadRef().current;
      if (preloadEl) {
        preloadEl.src = `dashcam-file://${clips[nextIndex].path}`;
        preloadEl.load();
      }
    }
  }, [currentIndex, clips, getPreloadRef]);

  // Handle clip ended — swap to next
  const handleEnded = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= clips.length) {
      setPlaying(false);
      return;
    }

    // Swap videos
    const preloadEl = getPreloadRef().current;
    if (preloadEl) {
      preloadEl.play();
    }

    setActiveVideo((v) => (v === 'A' ? 'B' : 'A'));
    setCurrentIndex(nextIndex);
    setCurrentTime(0);
  }, [currentIndex, clips.length, getPreloadRef]);

  // Time update
  const handleTimeUpdate = useCallback(() => {
    const el = getActiveRef().current;
    if (el) {
      setCurrentTime(el.currentTime);
    }
  }, [getActiveRef]);

  // Play/pause
  const togglePlay = useCallback(() => {
    const el = getActiveRef().current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play();
    }
    setPlaying(!playing);
  }, [playing, getActiveRef]);

  // Global seek
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (clips.length === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const targetTime = percent * totalDuration;

      // Find which clip this falls into
      let accumulated = 0;
      for (let i = 0; i < clips.length; i++) {
        if (accumulated + clips[i].duration > targetTime || i === clips.length - 1) {
          const clipTime = targetTime - accumulated;

          if (i === currentIndex) {
            // Same clip — just seek
            const el = getActiveRef().current;
            if (el) {
              el.currentTime = clipTime;
            }
          } else {
            // Different clip — load it
            const el = getActiveRef().current;
            if (el) {
              el.src = `dashcam-file://${clips[i].path}`;
              el.currentTime = clipTime;
              if (playing) el.play();
            }
            setCurrentIndex(i);
          }
          setCurrentTime(clipTime);
          break;
        }
        accumulated += clips[i].duration;
      }
    },
    [clips, totalDuration, currentIndex, playing, getActiveRef],
  );

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button type="button" style={backBtnStyle} onClick={onBack}>
            Back
          </button>
          <span style={titleStyle}>{tripName}</span>
        </div>
        <div style={loadingStyle}>Loading clips...</div>
      </div>
    );
  }

  const currentClip = clips[currentIndex];
  const videoSrc = currentClip ? `dashcam-file://${currentClip.path}` : '';

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <button type="button" style={backBtnStyle} onClick={onBack}>
          Back
        </button>
        <span style={titleStyle}>{tripName}</span>
        <span style={clipIndicatorStyle}>
          Clip {currentIndex + 1}/{clips.length}
        </span>
        {onExport && (
          <button type="button" style={exportBtnStyle} onClick={onExport}>
            Export
          </button>
        )}
      </div>

      <div style={videoContainerStyle}>
        <video
          ref={videoARef}
          style={activeVideo === 'A' ? videoStyle : hiddenVideoStyle}
          src={activeVideo === 'A' ? videoSrc : undefined}
          autoPlay={activeVideo === 'A'}
          onEnded={activeVideo === 'A' ? handleEnded : undefined}
          onTimeUpdate={activeVideo === 'A' ? handleTimeUpdate : undefined}
          onPause={activeVideo === 'A' ? () => setPlaying(false) : undefined}
          onPlay={activeVideo === 'A' ? () => setPlaying(true) : undefined}
        >
          <track kind="captions" />
        </video>
        <video
          ref={videoBRef}
          style={activeVideo === 'B' ? videoStyle : hiddenVideoStyle}
          src={activeVideo === 'B' ? videoSrc : undefined}
          autoPlay={activeVideo === 'B'}
          onEnded={activeVideo === 'B' ? handleEnded : undefined}
          onTimeUpdate={activeVideo === 'B' ? handleTimeUpdate : undefined}
          onPause={activeVideo === 'B' ? () => setPlaying(false) : undefined}
          onPlay={activeVideo === 'B' ? () => setPlaying(true) : undefined}
        >
          <track kind="captions" />
        </video>
      </div>

      <div style={controlsBarStyle}>
        <div style={seekBarContainerStyle}>
          <span style={timeStyle}>{formatTime(globalTime)}</span>
          <div style={seekBarStyle} onClick={handleSeek}>
            <div style={seekFillStyle(globalPercent)} />
          </div>
          <span style={{ ...timeStyle, textAlign: 'right' }}>{formatTime(totalDuration)}</span>
        </div>

        <div style={controlsBtnRowStyle}>
          <button type="button" style={playBtnStyle} onClick={togglePlay}>
            {playing ? 'Pause' : 'Play'}
          </button>
          {currentClip && (
            <span style={metaStyle}>
              {currentClip.filename} &middot; {currentClip.width}x{currentClip.height} &middot;{' '}
              {formatTimestamp(currentClip.timestampSource)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
