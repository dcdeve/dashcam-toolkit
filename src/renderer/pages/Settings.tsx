import { useState, useEffect, useCallback, useRef } from 'react';

const SETTING_KEYS = {
  EXPORT_DIR: 'export_dir',
  GAP_MINUTES: 'gap_minutes',
  EXPORT_TEMPLATE: 'export_template',
} as const;

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.GAP_MINUTES]: '5',
  [SETTING_KEYS.EXPORT_TEMPLATE]: '{date}_{trip}_{seq}',
};

// --- Styles ---

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: 'calc(100vh - 41px)',
  backgroundColor: '#0c0e12',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: '24px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '20px',
};

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#13161c',
  border: '1px solid #1e2330',
  borderRadius: '6px',
  padding: '20px 24px',
  width: '100%',
  maxWidth: '520px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: '#e2e5eb',
  fontWeight: 500,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  marginBottom: '16px',
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '14px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  color: '#5a6175',
  letterSpacing: '0.04em',
};

const inputRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 10px',
  border: '1px solid #1e2330',
  borderRadius: '4px',
  background: '#0c0e12',
  color: '#c9cdd4',
  fontSize: '0.72rem',
  fontFamily: 'inherit',
  outline: 'none',
};

const smallInputStyle: React.CSSProperties = {
  ...inputStyle,
  width: '80px',
  flex: 'none',
  textAlign: 'right',
};

const browseBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  border: '1px solid #1e2330',
  borderRadius: '4px',
  background: 'transparent',
  color: '#5a6175',
  cursor: 'pointer',
  fontSize: '0.68rem',
  fontFamily: 'inherit',
  fontWeight: 500,
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
};

const hintStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  color: '#3b4559',
  letterSpacing: '0.03em',
};

const savedStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  color: '#4ade80',
  letterSpacing: '0.04em',
  marginLeft: '8px',
  transition: 'opacity 0.3s',
};

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#3b4559',
  fontSize: '0.8rem',
};

const unitStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  color: '#5a6175',
};

export function Settings(): React.ReactElement {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    (async () => {
      try {
        const all = await window.api.settings.getAll();
        setValues(all);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = useCallback(async (key: string, value: string) => {
    await window.api.settings.set(key, value);
    setValues((prev) => ({ ...prev, [key]: value }));
    setSavedKey(key);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedKey(null), 1500);
  }, []);

  const getValue = (key: string): string => values[key] ?? DEFAULTS[key] ?? '';

  const handleBrowseExportDir = useCallback(async () => {
    const dir = await window.api.dialog.openDirectory();
    if (dir) {
      await save(SETTING_KEYS.EXPORT_DIR, dir);
    }
  }, [save]);

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Export section */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Export</div>

          <div style={fieldStyle}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={labelStyle}>Export directory</span>
              {savedKey === SETTING_KEYS.EXPORT_DIR && <span style={savedStyle}>Saved</span>}
            </div>
            <div style={inputRowStyle}>
              <input
                type="text"
                style={inputStyle}
                value={getValue(SETTING_KEYS.EXPORT_DIR)}
                placeholder="Default: Downloads folder"
                readOnly
              />
              <button type="button" style={browseBtnStyle} onClick={handleBrowseExportDir}>
                Browse
              </button>
            </div>
          </div>

          <div style={fieldStyle}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={labelStyle}>Export filename template</span>
              {savedKey === SETTING_KEYS.EXPORT_TEMPLATE && <span style={savedStyle}>Saved</span>}
            </div>
            <input
              type="text"
              style={inputStyle}
              value={getValue(SETTING_KEYS.EXPORT_TEMPLATE)}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val && val !== getValue(SETTING_KEYS.EXPORT_TEMPLATE)) {
                  save(SETTING_KEYS.EXPORT_TEMPLATE, val);
                }
              }}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [SETTING_KEYS.EXPORT_TEMPLATE]: e.target.value }))
              }
            />
            <span style={hintStyle}>
              Tokens: {'{date}'}, {'{trip}'}, {'{seq}'}
            </span>
          </div>
        </div>

        {/* Import section */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>Import</div>

          <div style={fieldStyle}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={labelStyle}>Trip gap</span>
              {savedKey === SETTING_KEYS.GAP_MINUTES && <span style={savedStyle}>Saved</span>}
            </div>
            <div style={inputRowStyle}>
              <input
                type="number"
                style={smallInputStyle}
                min="1"
                max="120"
                value={getValue(SETTING_KEYS.GAP_MINUTES)}
                onBlur={(e) => {
                  const num = parseInt(e.target.value, 10);
                  if (num > 0 && String(num) !== getValue(SETTING_KEYS.GAP_MINUTES)) {
                    save(SETTING_KEYS.GAP_MINUTES, String(num));
                  }
                }}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [SETTING_KEYS.GAP_MINUTES]: e.target.value,
                  }))
                }
              />
              <span style={unitStyle}>minutes</span>
            </div>
            <span style={hintStyle}>
              Clips separated by more than this gap are grouped into different trips
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
