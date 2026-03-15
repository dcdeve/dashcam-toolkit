import { useState } from 'react';
import { ImportFlow } from './pages/ImportFlow';
import { Library } from './pages/Library';
import { Player } from './pages/Player';
import { TripPlayer } from './pages/TripPlayer';
import { Export } from './pages/Export';
import type { Clip, Trip } from '../interfaces/trips.js';

type Page = 'home' | 'library' | 'import' | 'player' | 'trip-player' | 'export';

interface ExportTarget {
  tripIds?: string[];
  clipPaths?: string[];
}

const shellStyle: React.CSSProperties = {
  fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace",
  backgroundColor: '#0c0e12',
  color: '#c9cdd4',
  minHeight: '100vh',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0',
  padding: '0 1px',
  backgroundColor: '#13161c',
  borderBottom: '1px solid #1e2330',
  height: '40px',
  WebkitAppRegion: 'drag' as unknown as string,
};

const navBtnStyle = (active: boolean): React.CSSProperties => ({
  height: '100%',
  padding: '0 1.25rem',
  border: 'none',
  background: active ? '#0c0e12' : 'transparent',
  color: active ? '#e2e5eb' : '#5a6175',
  cursor: 'pointer',
  fontSize: '0.75rem',
  fontFamily: 'inherit',
  fontWeight: 500,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  borderTop: active ? '2px solid #3b82f6' : '2px solid transparent',
  transition: 'color 0.15s, background 0.15s',
  WebkitAppRegion: 'no-drag' as unknown as string,
});

const homeStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: 'calc(100vh - 41px)',
  gap: '0.75rem',
};

const logoStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#e2e5eb',
};

const platformStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#3b4559',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

export function App(): React.ReactElement {
  const [page, setPage] = useState<Page>('home');
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [exportTarget, setExportTarget] = useState<ExportTarget>({});

  const handlePlayClip = (clip: Clip): void => {
    setSelectedClip(clip);
    setPage('player');
  };

  const handlePlayTrip = (trip: Trip): void => {
    setSelectedTrip(trip);
    setPage('trip-player');
  };

  const handleExportTrip = (tripId: string): void => {
    setExportTarget({ tripIds: [tripId] });
    setPage('export');
  };

  const handleExportClip = (clip: Clip): void => {
    setExportTarget({ clipPaths: [clip.path] });
    setPage('export');
  };

  return (
    <div style={shellStyle}>
      <nav style={navStyle}>
        <button onClick={() => setPage('home')} type="button" style={navBtnStyle(page === 'home')}>
          Home
        </button>
        <button
          onClick={() => setPage('library')}
          type="button"
          style={navBtnStyle(page === 'library')}
        >
          Library
        </button>
        <button
          onClick={() => setPage('import')}
          type="button"
          style={navBtnStyle(page === 'import')}
        >
          Import
        </button>
      </nav>

      {page === 'home' && (
        <div style={homeStyle}>
          <span style={logoStyle}>Dashcam Toolkit</span>
          <span style={platformStyle}>{window.api.platform}</span>
        </div>
      )}

      {page === 'library' && (
        <Library
          onPlayClip={handlePlayClip}
          onPlayTrip={handlePlayTrip}
          onExportTrip={handleExportTrip}
          onExportClip={handleExportClip}
        />
      )}

      {page === 'import' && <ImportFlow onDone={() => setPage('library')} />}

      {page === 'player' && selectedClip && (
        <Player
          clip={selectedClip}
          onBack={() => setPage('library')}
          onExport={() => handleExportClip(selectedClip)}
        />
      )}

      {page === 'trip-player' && selectedTrip && (
        <TripPlayer
          tripId={selectedTrip.id}
          tripName={selectedTrip.name}
          onBack={() => setPage('library')}
          onExport={() => handleExportTrip(selectedTrip.id)}
        />
      )}

      {page === 'export' && <Export target={exportTarget} onBack={() => setPage('library')} />}
    </div>
  );
}
