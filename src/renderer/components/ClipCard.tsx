import { useState } from 'react';
import type { Clip } from '../../interfaces/trips.js';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
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

const thumbStyle: React.CSSProperties = {
  width: '100%',
  height: '110px',
  backgroundColor: '#0c0e12',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
};

const playIconStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: 'rgba(59, 130, 246, 0.15)',
  border: '1px solid rgba(59, 130, 246, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#3b82f6',
  fontSize: '0.7rem',
};

const durationBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '6px',
  right: '6px',
  backgroundColor: 'rgba(0,0,0,0.75)',
  color: '#c9cdd4',
  fontSize: '0.65rem',
  padding: '1px 5px',
  borderRadius: '3px',
  fontVariantNumeric: 'tabular-nums',
};

const infoStyle: React.CSSProperties = {
  padding: '8px 10px',
};

const filenameStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#c9cdd4',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const metaStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#4a5268',
  marginTop: '3px',
  fontVariantNumeric: 'tabular-nums',
};

export function ClipCard({ clip }: { clip: Clip }): React.ReactElement {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={cardStyle(hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={thumbStyle}>
        <div style={playIconStyle}>&#9654;</div>
        <span style={durationBadgeStyle}>{formatDuration(clip.duration)}</span>
      </div>
      <div style={infoStyle}>
        <div style={filenameStyle} title={clip.filename}>
          {clip.filename}
        </div>
        <div style={metaStyle}>
          {clip.width}&times;{clip.height} &middot; {formatSize(clip.size)} &middot; {clip.codec}
        </div>
      </div>
    </div>
  );
}
