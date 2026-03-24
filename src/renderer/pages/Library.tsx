import { useMemo, useState } from 'react';
import { FolderSearch, Grid, List, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { TopBar } from '@/components/TopBar';
import { TripCard } from '@/components/TripCard';
import { useAppStore, type SortOption, type LibraryTab } from '@/store';
import { ClipTable } from '@/components/ClipTable';
import { ClipGrid } from '@/components/ClipGrid';
import { ClipPlayerModal } from '@/components/ClipPlayerModal';
import type { Clip } from '../../interfaces/trips.js';
import type { UIClip } from '@/store';

export function Library(): React.ReactElement {
  const {
    trips,
    clips,
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    sortOption,
    setSortOption,
    searchQuery,
    isLoading,
    error,
    isImportOpen,
    openImportDrawer,
  } = useAppStore();

  const [selectedClip, setSelectedClip] = useState<UIClip | null>(null);
  const [isClipModalOpen, setIsClipModalOpen] = useState(false);

  const handlePlayClip = (clip: Clip) => {
    setSelectedClip(clip as unknown as UIClip);
    setIsClipModalOpen(true);
  };

  async function handleScanFolder(): Promise<void> {
    const dir = await window.api.dialog.openDirectory();
    if (dir) openImportDrawer(dir);
  }

  const filteredTrips = useMemo(() => {
    let result = [...trips];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.date.includes(q) ||
          t.folderPath.toLowerCase().includes(q),
      );
    }
    switch (sortOption) {
      case 'date-desc':
        result.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case 'date-asc':
        result.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case 'duration':
        result.sort((a, b) => b.duration - a.duration);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return result;
  }, [trips, searchQuery, sortOption]);

  const filteredClips = useMemo(() => {
    if (!searchQuery) return clips;
    const q = searchQuery.toLowerCase();
    return clips.filter((c) => c.filename.toLowerCase().includes(q));
  }, [clips, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading library...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <span className="text-sm text-destructive">Error: {error}</span>
      </div>
    );
  }

  const isEmpty = trips.length === 0 && clips.length === 0;

  return (
    <div className="flex h-full flex-col w-full">
      <TopBar />

      {/* Tab bar */}
      <div className="flex border-b border-border bg-card px-4">
        {(['trips', 'clips'] as LibraryTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2">
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={handleScanFolder}
          disabled={isImportOpen}
        >
          <FolderSearch className="h-4 w-4" />
          Scan folder
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => v && setViewMode(v as 'grid' | 'list')}
          className="gap-0"
        >
          <ToggleGroupItem
            value="grid"
            size="sm"
            className="rounded-r-none border border-border data-[state=on]:bg-secondary"
          >
            <Grid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            size="sm"
            className="rounded-l-none border border-l-0 border-border data-[state=on]:bg-secondary"
          >
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        {activeTab === 'trips' && (
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="w-40 h-8 bg-secondary border-border">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date (newest)</SelectItem>
              <SelectItem value="date-asc">Date (oldest)</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        )}
        <span className="ml-auto text-sm text-muted-foreground">
          {activeTab === 'trips' ? filteredTrips.length : filteredClips.length} {activeTab}
        </span>
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-medium text-foreground">No trips yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Scan a folder to import your dashcam footage
            </p>
          </div>
          <Button className="mt-2 gap-2" onClick={handleScanFolder} disabled={isImportOpen}>
            <FolderSearch className="h-4 w-4" />
            Scan folder
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'trips' &&
            (viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} viewMode="grid" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredTrips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} viewMode="list" />
                ))}
              </div>
            ))}

          {activeTab === 'clips' &&
            (viewMode === 'list' ? (
              <ClipTable
                clips={filteredClips as unknown as Clip[]}
                sortField="timestampSource"
                sortDir="desc"
                onSort={() => {}}
              />
            ) : (
              <ClipGrid clips={filteredClips as unknown as Clip[]} onPlay={handlePlayClip} />
            ))}
        </div>
      )}

      <ClipPlayerModal
        clip={selectedClip}
        open={isClipModalOpen}
        onClose={() => setIsClipModalOpen(false)}
      />
    </div>
  );
}
