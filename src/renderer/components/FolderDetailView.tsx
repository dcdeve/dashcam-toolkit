import { useMemo } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TripCard } from '@/components/TripCard';
import { useAppStore, type UIFolder } from '@/store';

interface FolderDetailViewProps {
  folder: UIFolder;
}

export function FolderDetailView({ folder }: FolderDetailViewProps): React.ReactElement {
  const { trips, setSelectedFolder, openRescanDrawer, viewMode } = useAppStore();

  const folderTrips = useMemo(
    () => trips.filter((t) => t.folderPath.startsWith(folder.path)),
    [trips, folder.path],
  );

  function handleBack(): void {
    setSelectedFolder(null);
  }

  function handleRescan(): void {
    openRescanDrawer(folder.path);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground truncate max-w-xs">
            {folder.displayName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{folderTrips.length} trips</span>
          <Button variant="secondary" size="sm" className="gap-2 h-8" onClick={handleRescan}>
            <RefreshCw className="h-4 w-4" />
            Rescan
          </Button>
        </div>
      </div>

      {/* Trip list */}
      <div className="flex-1 overflow-auto p-4">
        {folderTrips.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-muted-foreground">No trips in this folder</span>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {folderTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} viewMode="grid" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {folderTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} viewMode="list" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
