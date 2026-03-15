import { useState, useEffect, useCallback } from 'react';
import type { Clip } from '../../interfaces/trips.js';
import { ClipTable, type SortField, type SortDir } from '../components/ClipTable';
import { ClipGrid } from '../components/ClipGrid';

type ViewMode = 'list' | 'grid';

function getStoredViewMode(): ViewMode {
  const stored = localStorage.getItem('library-view-mode');
  return stored === 'grid' ? 'grid' : 'list';
}

function sortClips(clips: Clip[], field: SortField, dir: SortDir): Clip[] {
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

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '1rem',
};

const toggleStyle = (active: boolean): React.CSSProperties => ({
  padding: '0.25rem 0.75rem',
  border: '1px solid #d1d5db',
  background: active ? '#e5e7eb' : 'transparent',
  cursor: 'pointer',
  fontSize: '0.85rem',
});

export function Library(): React.ReactElement {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [sortField, setSortField] = useState<SortField>('timestampSource');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    (async () => {
      try {
        const result = await window.api.clips.list();
        // Dates come serialized from IPC — rehydrate
        const hydrated = result.map((c: Clip) => ({
          ...c,
          timestampSource: new Date(c.timestampSource),
          createdAt: new Date(c.createdAt),
        }));
        setClips(hydrated);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('library-view-mode', mode);
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField],
  );

  const sorted = sortClips(clips, sortField, sortDir);

  if (loading) return <div style={{ padding: '2rem' }}>Loading clips...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#dc2626' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={toolbarStyle}>
        <h2 style={{ margin: 0 }}>
          Clips{' '}
          <span style={{ fontWeight: 'normal', fontSize: '0.9rem', color: '#6b7280' }}>
            ({clips.length})
          </span>
        </h2>
        <div>
          <button
            type="button"
            style={{ ...toggleStyle(viewMode === 'list'), borderRadius: '4px 0 0 4px' }}
            onClick={() => handleViewMode('list')}
          >
            List
          </button>
          <button
            type="button"
            style={{
              ...toggleStyle(viewMode === 'grid'),
              borderRadius: '0 4px 4px 0',
              borderLeft: 'none',
            }}
            onClick={() => handleViewMode('grid')}
          >
            Grid
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <ClipTable clips={sorted} sortField={sortField} sortDir={sortDir} onSort={handleSort} />
      ) : (
        <ClipGrid clips={sorted} />
      )}
    </div>
  );
}
