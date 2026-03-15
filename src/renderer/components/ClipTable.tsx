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

const columns: { field: SortField; label: string }[] = [
  { field: 'filename', label: 'Name' },
  { field: 'timestampSource', label: 'Date' },
  { field: 'duration', label: 'Duration' },
  { field: 'resolution', label: 'Resolution' },
  { field: 'size', label: 'Size' },
];

function sortIndicator(field: SortField, sortField: SortField, sortDir: SortDir): string {
  if (field !== sortField) return '';
  return sortDir === 'asc' ? ' \u25B4' : ' \u25BE';
}

const emptyStyle: React.CSSProperties = {
  color: '#3b4559',
  fontSize: '0.8rem',
  textAlign: 'center',
  padding: '3rem 0',
};

const filenameTdStyle: React.CSSProperties = {
  ...tdStyle,
  maxWidth: '300px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: '#c9cdd4',
  fontWeight: 500,
};

const codecStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '0.6rem',
  padding: '1px 6px',
  borderRadius: '3px',
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  color: '#5a8dd6',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

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
    return <p style={emptyStyle}>No clips found. Import a dashcam folder first.</p>;
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
          <th style={{ ...thStyle, cursor: 'default' }}>Codec</th>
        </tr>
      </thead>
      <tbody>
        {clips.map((clip, i) => (
          <tr key={clip.id} style={trStyle(i % 2 === 0)}>
            <td style={filenameTdStyle} title={clip.filename}>
              {clip.filename}
            </td>
            <td style={tdStyle}>{formatDate(clip.timestampSource)}</td>
            <td style={tdStyle}>{formatDuration(clip.duration)}</td>
            <td style={tdStyle}>
              {clip.width}&times;{clip.height}
            </td>
            <td style={tdStyle}>{formatSize(clip.size)}</td>
            <td style={tdStyle}>
              <span style={codecStyle}>{clip.codec}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
