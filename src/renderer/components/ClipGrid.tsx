import type { Clip } from '../../interfaces/trips.js';
import { ClipCard } from './ClipCard';

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '1rem',
};

export function ClipGrid({ clips }: { clips: Clip[] }): React.ReactElement {
  if (clips.length === 0) {
    return <p style={{ color: '#6b7280' }}>No clips found. Import a dashcam folder first.</p>;
  }

  return (
    <div style={gridStyle}>
      {clips.map((clip) => (
        <ClipCard key={clip.id} clip={clip} />
      ))}
    </div>
  );
}
