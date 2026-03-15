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

export function TripGrid({ trips }: { trips: Trip[] }): React.ReactElement {
  if (trips.length === 0) {
    return <p style={emptyStyle}>No trips found. Import a dashcam folder first.</p>;
  }

  return (
    <div style={gridStyle}>
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}
