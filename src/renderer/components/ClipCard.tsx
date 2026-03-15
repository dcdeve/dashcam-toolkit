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

const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'box-shadow 0.15s',
};

const thumbStyle: React.CSSProperties = {
  width: '100%',
  height: '120px',
  backgroundColor: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9ca3af',
  fontSize: '2rem',
};

const infoStyle: React.CSSProperties = {
  padding: '0.5rem',
};

const filenameStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const metaStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#6b7280',
  marginTop: '0.25rem',
};

export function ClipCard({ clip }: { clip: Clip }): React.ReactElement {
  return (
    <div style={cardStyle}>
      <div style={thumbStyle}>&#9654;</div>
      <div style={infoStyle}>
        <div style={filenameStyle} title={clip.filename}>
          {clip.filename}
        </div>
        <div style={metaStyle}>
          {formatDuration(clip.duration)} &middot; {clip.width}x{clip.height} &middot;{' '}
          {formatSize(clip.size)}
        </div>
      </div>
    </div>
  );
}
