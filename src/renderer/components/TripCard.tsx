import { useState, useCallback, useEffect } from 'react';
import type { Trip } from '../../interfaces/trips.js';
import type { ThumbnailEntry } from '../../interfaces/thumbnails.js';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const cardStyle = (hovered: boolean): React.CSSProperties => ({
  backgroundColor: hovered ? '#181c25' : '#13161c',
  border: '1px solid',
  borderColor: hovered ? '#2a3040' : '#1e2330',
  borderRadius: '6px',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
  boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
});

const scrubAreaStyle: React.CSSProperties = {
  width: '100%',
  height: '120px',
  backgroundColor: '#0c0e12',
  position: 'relative',
  overflow: 'hidden',
  userSelect: 'none',
};

const scrubIndicatorStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '100%',
  height: '3px',
  backgroundColor: '#1e2330',
};

const scrubProgressStyle = (position: number): React.CSSProperties => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: `${position * 100}%`,
  height: '3px',
  backgroundColor: '#3b82f6',
  transition: 'none',
});

const scrubLabelStyle = (active: boolean): React.CSSProperties => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: active ? '#5a6175' : '#2a3040',
  fontSize: '0.65rem',
  pointerEvents: 'none',
  letterSpacing: '0.04em',
  fontVariantNumeric: 'tabular-nums',
  transition: 'color 0.15s',
});

const clipCountBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  backgroundColor: 'rgba(0,0,0,0.6)',
  color: '#8b92a5',
  fontSize: '0.6rem',
  padding: '2px 6px',
  borderRadius: '3px',
  letterSpacing: '0.03em',
};

const infoStyle: React.CSSProperties = {
  padding: '8px 10px',
};

const nameStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 500,
  color: '#c9cdd4',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginTop: '4px',
  fontSize: '0.65rem',
  color: '#4a5268',
  fontVariantNumeric: 'tabular-nums',
};

const compatBadgeStyle = (compat: string): React.CSSProperties => ({
  fontSize: '0.55rem',
  padding: '1px 5px',
  borderRadius: '3px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  fontWeight: 500,
  backgroundColor:
    compat === 'compatible'
      ? 'rgba(34, 197, 94, 0.1)'
      : compat === 'incompatible'
        ? 'rgba(239, 68, 68, 0.1)'
        : 'rgba(90, 97, 117, 0.1)',
  color: compat === 'compatible' ? '#4ade80' : compat === 'incompatible' ? '#f87171' : '#5a6175',
});

interface TripCardProps {
  trip: Trip;
  onClick?: () => void;
}

export function TripCard({ trip, onClick }: TripCardProps): React.ReactElement {
  const [scrubPos, setScrubPos] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [scrubThumbs, setScrubThumbs] = useState<ThumbnailEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    window.api.thumbnails.getScrub(trip.id).then((entries) => {
      if (!cancelled) setScrubThumbs(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [trip.id]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setScrubPos(pos);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setScrubPos(null);
    setHovered(false);
  }, []);

  const frameIndex =
    scrubPos !== null
      ? Math.min(Math.floor(scrubPos * scrubThumbs.length), scrubThumbs.length - 1)
      : null;
  const scrubThumb = frameIndex !== null && frameIndex >= 0 ? scrubThumbs[frameIndex] : null;

  return (
    <div
      style={cardStyle(hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <div style={scrubAreaStyle} onMouseMove={handleMouseMove}>
        {scrubThumb && (
          <img
            src={`dashcam-file://${scrubThumb.path}`}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
            }}
          />
        )}
        <span style={clipCountBadgeStyle}>{trip.clipCount} clips</span>
        {!scrubThumb && (
          <span style={scrubLabelStyle(scrubPos !== null)}>
            {formatDuration(trip.totalDuration)}
          </span>
        )}
        {scrubPos !== null && (
          <>
            <div style={scrubIndicatorStyle} />
            <div style={scrubProgressStyle(scrubPos)} />
          </>
        )}
      </div>
      <div style={infoStyle}>
        <div style={nameStyle} title={trip.name}>
          {trip.name}
        </div>
        <div style={metaRowStyle}>
          <span>{formatDate(trip.startedAt)}</span>
          <span style={{ color: '#2a3040' }}>&middot;</span>
          <span>{formatDuration(trip.totalDuration)}</span>
          <span style={compatBadgeStyle(trip.codecCompat)}>{trip.codecCompat}</span>
        </div>
      </div>
    </div>
  );
}
