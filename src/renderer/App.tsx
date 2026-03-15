import { useState } from 'react';

export function App(): React.ReactElement {
  const [patterns, setPatterns] = useState<string[]>([]);
  const [status, setStatus] = useState('Click to test IPC');

  async function testIpc(): Promise<void> {
    try {
      const result = await window.api.patterns.list();
      setPatterns(result.map((p: { name: string }) => p.name));
      setStatus(`IPC OK — ${result.length} patterns loaded`);
    } catch (err) {
      setStatus(`IPC Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Dashcam Toolkit</h1>
      <p>Platform: {window.api.platform}</p>
      <button onClick={testIpc} type="button">
        Test IPC: patterns.list()
      </button>
      <p>{status}</p>
      {patterns.length > 0 && (
        <ul>
          {patterns.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
