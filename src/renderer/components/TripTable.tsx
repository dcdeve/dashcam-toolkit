import type { Trip } from '../../interfaces/trips.js';

export type TripSortField = 'name' | 'startedAt' | 'clipCount' | 'totalDuration' | 'codecCompat';
export type SortDir = 'asc' | 'desc';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

function formatDate(date: Date): string {
  return date.toLocaleString();
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.75rem',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  borderBottom: '1px solid #1e2330',
  cursor: 'pointer',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  color: '#5a6175',
  fontWeight: 500,
  fontSize: '0.65rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '7px 12px',
  borderBottom: '1px solid rgba(30, 35, 48, 0.5)',
  color: '#8b92a5',
  fontVariantNumeric: 'tabular-nums',
};

const trStyle = (even: boolean): React.CSSProperties => ({
  cursor: 'pointer',
  backgroundColor: even ? 'rgba(19, 22, 28, 0.5)' : 'transparent',
  transition: 'background-color 0.1s',
});

const columns: { field: TripSortField; label: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'startedAt', label: 'Date' },
  { field: 'clipCount', label: 'Clips' },
  { field: 'totalDuration', label: 'Duration' },
  { field: 'codecCompat', label: 'Codec' },
];

function sortIndicator(field: TripSortField, sortField: TripSortField, sortDir: SortDir): string {
  if (field !== sortField) return '';
  return sortDir === 'asc' ? ' \u25B4' : ' \u25BE';
}

const compatBadgeStyle = (compat: string): React.CSSProperties => ({
  display: 'inline-block',
  fontSize: '0.6rem',
  padding: '1px 6px',
  borderRadius: '3px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  fontWeight: 500,
  backgroundColor:
    compat === 'compatible'
      ? 'rgba(34, 197, 94, 0.1)'
      : compat === 'incompatible'
        ? 'rgba(239, 68, 68, 0.1)'
        : 'rgba(90, 97, 117, 0.1)',
  color: compat === 'compatible' ? '#4ade80' : compat === 'incompatible' ? '#f87171' : '#5a6175',
});

const statusStyle = (status: string): React.CSSProperties => ({
  fontSize: '0.6rem',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: status === 'complete' ? '#4a5268' : '#f59e0b',
});

const emptyStyle: React.CSSProperties = {
  color: '#3b4559',
  fontSize: '0.8rem',
  textAlign: 'center',
  padding: '3rem 0',
};

interface TripTableProps {
  trips: Trip[];
  sortField: TripSortField;
  sortDir: SortDir;
  onSort: (field: TripSortField) => void;
}

export function TripTable({
  trips,
  sortField,
  sortDir,
  onSort,
}: TripTableProps): React.ReactElement {
  if (trips.length === 0) {
    return <p style={emptyStyle}>No trips found. Import a dashcam folder first.</p>;
  }

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.field}
              style={{
                ...thStyle,
                color: col.field === sortField ? '#c9cdd4' : thStyle.color,
              }}
              onClick={() => onSort(col.field)}
            >
              {col.label}
              {sortIndicator(col.field, sortField, sortDir)}
            </th>
          ))}
          <th style={{ ...thStyle, cursor: 'default' }}>Status</th>
        </tr>
      </thead>
      <tbody>
        {trips.map((trip, i) => (
          <tr key={trip.id} style={trStyle(i % 2 === 0)}>
            <td style={{ ...tdStyle, color: '#c9cdd4', fontWeight: 500 }}>{trip.name}</td>
            <td style={tdStyle}>{formatDate(trip.startedAt)}</td>
            <td style={tdStyle}>{trip.clipCount}</td>
            <td style={tdStyle}>{formatDuration(trip.totalDuration)}</td>
            <td style={tdStyle}>
              <span style={compatBadgeStyle(trip.codecCompat)}>{trip.codecCompat}</span>
            </td>
            <td style={tdStyle}>
              <span style={statusStyle(trip.status)}>{trip.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
