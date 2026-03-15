import { useState, useEffect, useCallback } from 'react';
import type { Clip, Trip } from '../../interfaces/trips.js';
import { ClipTable, type SortField as ClipSortField, type SortDir } from '../components/ClipTable';
import { ClipGrid } from '../components/ClipGrid';
import { TripTable, type TripSortField } from '../components/TripTable';
import { TripGrid } from '../components/TripGrid';

type ViewMode = 'list' | 'grid';
type LibraryTab = 'clips' | 'trips';

function getStored<T extends string>(key: string, fallback: T): T {
  return (localStorage.getItem(key) as T) ?? fallback;
}

function sortClips(clips: Clip[], field: ClipSortField, dir: SortDir): Clip[] {
  const sorted = [...clips];
  const mul = dir === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    switch (field) {
      case 'filename':
        return mul * a.filename.localeCompare(b.filename);
      case 'timestampSource':
        return mul * (a.timestampSource.getTime() - b.timestampSource.getTime());
      case 'duration':
        return mul * (a.duration - b.duration);
      case 'resolution':
        return mul * (a.width * a.height - b.width * b.height);
      case 'size':
        return mul * (a.size - b.size);
    }
  });

  return sorted;
}

function sortTrips(trips: Trip[], field: TripSortField, dir: SortDir): Trip[] {
  const sorted = [...trips];
  const mul = dir === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    switch (field) {
      case 'name':
        return mul * a.name.localeCompare(b.name);
      case 'startedAt':
        return mul * (a.startedAt.getTime() - b.startedAt.getTime());
      case 'clipCount':
        return mul * (a.clipCount - b.clipCount);
      case 'totalDuration':
        return mul * (a.totalDuration - b.totalDuration);
      case 'codecCompat':
        return mul * a.codecCompat.localeCompare(b.codecCompat);
    }
  });

  return sorted;
}

const containerStyle: React.CSSProperties = {
  padding: '20px 24px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '16px',
};

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0',
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 16px',
  border: 'none',
  background: active ? '#1e2330' : 'transparent',
  color: active ? '#e2e5eb' : '#5a6175',
  cursor: 'pointer',
  fontSize: '0.72rem',
  fontFamily: 'inherit',
  fontWeight: 500,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  borderRadius: '4px',
  transition: 'color 0.15s, background 0.15s',
});

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const countStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#3b4559',
  fontVariantNumeric: 'tabular-nums',
};

const toggleGroupStyle: React.CSSProperties = {
  display: 'flex',
  border: '1px solid #1e2330',
  borderRadius: '4px',
  overflow: 'hidden',
};

const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '4px 10px',
  border: 'none',
  background: active ? '#1e2330' : 'transparent',
  color: active ? '#c9cdd4' : '#3b4559',
  cursor: 'pointer',
  fontSize: '0.65rem',
  fontFamily: 'inherit',
  fontWeight: 500,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  transition: 'color 0.15s, background 0.15s',
});

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '200px',
  color: '#3b4559',
  fontSize: '0.8rem',
  letterSpacing: '0.05em',
};

const errorStyle: React.CSSProperties = {
  padding: '2rem',
  color: '#f87171',
  fontSize: '0.8rem',
};

export function Library(): React.ReactElement {
  const [tab, setTab] = useState<LibraryTab>(() => getStored('library-tab', 'clips'));
  const [viewMode, setViewMode] = useState<ViewMode>(() => getStored('library-view-mode', 'list'));

  const [clips, setClips] = useState<Clip[]>([]);
  const [clipsLoading, setClipsLoading] = useState(true);
  const [clipSortField, setClipSortField] = useState<ClipSortField>('timestampSource');
  const [clipSortDir, setClipSortDir] = useState<SortDir>('desc');

  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripSortField, setTripSortField] = useState<TripSortField>('startedAt');
  const [tripSortDir, setTripSortDir] = useState<SortDir>('desc');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.api.clips.list();
        const hydrated = result.map((c: Clip) => ({
          ...c,
          timestampSource: new Date(c.timestampSource),
          createdAt: new Date(c.createdAt),
        }));
        setClips(hydrated);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setClipsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const result = await window.api.trips.list();
        const hydrated = result.map((t: Trip) => ({
          ...t,
          startedAt: new Date(t.startedAt),
          endedAt: new Date(t.endedAt),
          createdAt: new Date(t.createdAt),
        }));
        setTrips(hydrated);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setTripsLoading(false);
      }
    })();
  }, []);

  const handleTab = useCallback((t: LibraryTab) => {
    setTab(t);
    localStorage.setItem('library-tab', t);
  }, []);

  const handleViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('library-view-mode', mode);
  }, []);

  const handleClipSort = useCallback(
    (field: ClipSortField) => {
      if (field === clipSortField) {
        setClipSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setClipSortField(field);
        setClipSortDir('asc');
      }
    },
    [clipSortField],
  );

  const handleTripSort = useCallback(
    (field: TripSortField) => {
      if (field === tripSortField) {
        setTripSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setTripSortField(field);
        setTripSortDir('asc');
      }
    },
    [tripSortField],
  );

  const loading = tab === 'clips' ? clipsLoading : tripsLoading;

  if (loading) return <div style={loadingStyle}>Loading...</div>;
  if (error) return <div style={errorStyle}>Error: {error}</div>;

  const sortedClips = sortClips(clips, clipSortField, clipSortDir);
  const sortedTrips = sortTrips(trips, tripSortField, tripSortDir);
  const count = tab === 'clips' ? clips.length : trips.length;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={tabBarStyle}>
          <button
            type="button"
            style={tabStyle(tab === 'clips')}
            onClick={() => handleTab('clips')}
          >
            Clips
          </button>
          <button
            type="button"
            style={tabStyle(tab === 'trips')}
            onClick={() => handleTab('trips')}
          >
            Trips
          </button>
        </div>

        <div style={controlsStyle}>
          <span style={countStyle}>{count}</span>
          <div style={toggleGroupStyle}>
            <button
              type="button"
              style={toggleBtnStyle(viewMode === 'list')}
              onClick={() => handleViewMode('list')}
            >
              List
            </button>
            <button
              type="button"
              style={toggleBtnStyle(viewMode === 'grid')}
              onClick={() => handleViewMode('grid')}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {tab === 'clips' &&
        (viewMode === 'list' ? (
          <ClipTable
            clips={sortedClips}
            sortField={clipSortField}
            sortDir={clipSortDir}
            onSort={handleClipSort}
          />
        ) : (
          <ClipGrid clips={sortedClips} />
        ))}

      {tab === 'trips' &&
        (viewMode === 'list' ? (
          <TripTable
            trips={sortedTrips}
            sortField={tripSortField}
            sortDir={tripSortDir}
            onSort={handleTripSort}
          />
        ) : (
          <TripGrid trips={sortedTrips} />
        ))}
    </div>
  );
}
