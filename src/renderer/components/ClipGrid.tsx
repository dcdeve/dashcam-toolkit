import type { Clip } from '../../interfaces/trips.js';
import { ClipCard } from './ClipCard';

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
  gap: '10px',
};

const emptyStyle: React.CSSProperties = {
  color: '#3b4559',
  fontSize: '0.8rem',
  textAlign: 'center',
  padding: '3rem 0',
};

interface ClipGridProps {
  clips: Clip[];
  onPlay?: (clip: Clip) => void;
}

export function ClipGrid({ clips, onPlay }: ClipGridProps): React.ReactElement {
  if (clips.length === 0) {
    return <p style={emptyStyle}>No clips found. Import a dashcam folder first.</p>;
  }

  return (
    <div style={gridStyle}>
      {clips.map((clip) => (
        <ClipCard key={clip.id} clip={clip} onClick={() => onPlay?.(clip)} />
      ))}
    </div>
  );
}
