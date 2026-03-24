import { useEffect } from 'react';
import { useAppStore } from './store';
import { Sidebar } from './components/Sidebar';
import { ExportDrawer } from './components/ExportDrawer';
import { ImportDrawer } from './components/ImportDrawer';
import { Library } from './pages/Library';
import { TripPlayer } from './pages/TripPlayer';
import { Settings } from './pages/Settings';

export function App(): React.ReactElement {
  const { currentPage, initialize } = useAppStore();

  useEffect(() => {
    initialize();
    // Apply dark class to root for Tailwind dark variant
    document.documentElement.classList.add('dark');
  }, [initialize]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex flex-1 overflow-hidden">
        {currentPage === 'library' && <Library />}
        {currentPage === 'player' && <TripPlayer />}
        {currentPage === 'settings' && <Settings />}
      </main>
      <ExportDrawer />
      <ImportDrawer />
    </div>
  );
}
