import type { Trip } from '../../interfaces/trips.js';
import { TripCard } from './TripCard';

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: '10px',
};

const emptyStyle: React.CSSProperties = {
  color: '#3b4559',
  fontSize: '0.8rem',
  textAlign: 'center',
  padding: '3rem 0',
};

interface TripGridProps {
  trips: Trip[];
  onPlay?: (trip: Trip) => void;
}

export function TripGrid({ trips, onPlay }: TripGridProps): React.ReactElement {
  if (trips.length === 0) {
    return <p style={emptyStyle}>No trips found. Import a dashcam folder first.</p>;
  }

  return (
    <div style={gridStyle}>
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} onClick={() => onPlay?.(trip)} />
      ))}
    </div>
  );
}
