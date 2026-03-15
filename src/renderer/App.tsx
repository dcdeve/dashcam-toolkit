import { useState } from 'react';
import { ImportFlow } from './pages/ImportFlow';
import { Library } from './pages/Library';

type Page = 'home' | 'library' | 'import';

export function App(): React.ReactElement {
  const [page, setPage] = useState<Page>('home');

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ padding: '1rem 2rem', borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={() => setPage('home')}
          type="button"
          style={{ marginRight: '1rem', fontWeight: page === 'home' ? 'bold' : 'normal' }}
        >
          Home
        </button>
        <button
          onClick={() => setPage('library')}
          type="button"
          style={{ marginRight: '1rem', fontWeight: page === 'library' ? 'bold' : 'normal' }}
        >
          Library
        </button>
        <button
          onClick={() => setPage('import')}
          type="button"
          style={{ fontWeight: page === 'import' ? 'bold' : 'normal' }}
        >
          Import
        </button>
      </nav>

      {page === 'home' && (
        <div style={{ padding: '2rem' }}>
          <h1>Dashcam Toolkit</h1>
          <p>Platform: {window.api.platform}</p>
        </div>
      )}

      {page === 'library' && <Library />}

      {page === 'import' && <ImportFlow onDone={() => setPage('library')} />}
    </div>
  );
}
