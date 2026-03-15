import type { Clip } from '../../interfaces/trips.js';

export type SortField = 'filename' | 'timestampSource' | 'duration' | 'resolution' | 'size';
export type SortDir = 'asc' | 'desc';

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

function formatDate(date: Date): string {
  return date.toLocaleString();
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.85rem',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem 0.75rem',
  borderBottom: '2px solid #e5e7eb',
  cursor: 'pointer',
  userSelect: 'none',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid #f3f4f6',
};

const columns: { field: SortField; label: string }[] = [
  { field: 'filename', label: 'Name' },
  { field: 'timestampSource', label: 'Date' },
  { field: 'duration', label: 'Duration' },
  { field: 'resolution', label: 'Resolution' },
  { field: 'size', label: 'Size' },
];

function sortIndicator(field: SortField, sortField: SortField, sortDir: SortDir): string {
  if (field !== sortField) return '';
  return sortDir === 'asc' ? ' ▲' : ' ▼';
}

interface ClipTableProps {
  clips: Clip[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
}

export function ClipTable({
  clips,
  sortField,
  sortDir,
  onSort,
}: ClipTableProps): React.ReactElement {
  if (clips.length === 0) {
    return <p style={{ color: '#6b7280' }}>No clips found. Import a dashcam folder first.</p>;
  }

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.field} style={thStyle} onClick={() => onSort(col.field)}>
              {col.label}
              {sortIndicator(col.field, sortField, sortDir)}
            </th>
          ))}
          <th style={{ ...thStyle, cursor: 'default' }}>Codec</th>
        </tr>
      </thead>
      <tbody>
        {clips.map((clip) => (
          <tr key={clip.id} style={{ cursor: 'pointer' }}>
            <td
              style={{
                ...tdStyle,
                maxWidth: '300px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={clip.filename}
            >
              {clip.filename}
            </td>
            <td style={tdStyle}>{formatDate(clip.timestampSource)}</td>
            <td style={tdStyle}>{formatDuration(clip.duration)}</td>
            <td style={tdStyle}>
              {clip.width}x{clip.height}
            </td>
            <td style={tdStyle}>{formatSize(clip.size)}</td>
            <td style={tdStyle}>{clip.codec}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
