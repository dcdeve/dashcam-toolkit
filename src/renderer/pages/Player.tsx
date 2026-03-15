import type { Clip } from '../../interfaces/trips.js';

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

const filenameStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#e2e5eb',
  fontWeight: 500,
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const videoContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#000',
  minHeight: 0,
};

const videoStyle: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: '100%',
};

const metaBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
  padding: '8px 16px',
  backgroundColor: '#13161c',
  borderTop: '1px solid #1e2330',
};

const metaItemStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#5a6175',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const metaValueStyle: React.CSSProperties = {
  color: '#8b93a5',
  marginLeft: '6px',
};

interface PlayerProps {
  clip: Clip;
  onBack: () => void;
}

export function Player({ clip, onBack }: PlayerProps): React.ReactElement {
  const videoSrc = `dashcam-file://${clip.path}`;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <button type="button" style={backBtnStyle} onClick={onBack}>
          Back
        </button>
        <span style={filenameStyle}>{clip.filename}</span>
      </div>

      <div style={videoContainerStyle}>
        <video style={videoStyle} src={videoSrc} controls autoPlay>
          <track kind="captions" />
        </video>
      </div>

      <div style={metaBarStyle}>
        <span style={metaItemStyle}>
          Duration<span style={metaValueStyle}>{formatDuration(clip.duration)}</span>
        </span>
        <span style={metaItemStyle}>
          Resolution
          <span style={metaValueStyle}>
            {clip.width}x{clip.height}
          </span>
        </span>
        <span style={metaItemStyle}>
          Codec<span style={metaValueStyle}>{clip.codec}</span>
        </span>
        <span style={metaItemStyle}>
          Size<span style={metaValueStyle}>{formatSize(clip.size)}</span>
        </span>
        <span style={metaItemStyle}>
          Timestamp
          <span style={metaValueStyle}>{formatTimestamp(clip.timestampSource)}</span>
        </span>
      </div>
    </div>
  );
}
