import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Film, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppStore, formatDuration } from '@/store';
import type { UIClip } from '@/store';
import type { Clip } from '../../interfaces/trips.js';
import { ClipPlayer } from '@/components/ClipPlayer';

export function TripPlayer(): React.ReactElement {
  const { selectedTrip, setCurrentTime, volume, setCurrentPage, setIsExportOpen } = useAppStore();

  const [clips, setClips] = useState<UIClip[]>([]);
  const [activeClipIndex, setActiveClipIndex] = useState(0);

  // Bridge callbacks
  const handleTimeChange = (t: number) => setCurrentTime(t);
  const handleClipChange = (i: number) => setActiveClipIndex(i);

  // Load clips for the selected trip
  useEffect(() => {
    if (!selectedTrip) return;
    window.api.trips
      .getClips(selectedTrip.id)
      .then((rawClips) => {
        const uiClips = (rawClips as Clip[]).map((c) => ({
          id: c.id,
          filename: c.filename,
          path: c.path,
          duration: c.duration,
          width: c.width,
          height: c.height,
          size: c.size,
          timestampSource: new Date(c.timestampSource),
          tripId: c.tripId,
          thumbnail: null,
        })) as UIClip[];
        console.log(`[TripPlayer] loaded ${uiClips.length} clips for trip ${selectedTrip.id}`);
        setClips(uiClips);
      })
      .catch((err) => console.error('[TripPlayer] getClips failed:', err));
  }, [selectedTrip]);

  const handleClipClick = (index: number): void => {
    setActiveClipIndex(index);
  };

  if (!selectedTrip) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No trip selected</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      {/* Main content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setCurrentPage('library')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-medium text-foreground">{selectedTrip.name}</h1>
              <p className="text-xs text-muted-foreground">
                {selectedTrip.clipCount} clips · {formatDuration(selectedTrip.duration)}
              </p>
            </div>
          </div>
          <Button onClick={() => setIsExportOpen(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Export this trip
          </Button>
        </header>

        {/* Video area + filmstrip */}
        <div className="flex min-h-0 flex-1 flex-col bg-background">
          <ClipPlayer
            clips={clips}
            activeClipIndex={activeClipIndex}
            volume={volume}
            onTimeChange={handleTimeChange}
            onClipChange={handleClipChange}
          />

          {/* Filmstrip */}
          <div className="flex-shrink-0 overflow-hidden border-b border-border bg-card">
            <div className="flex gap-1 overflow-x-auto p-3 pb-2">
              {(clips.length > 0 ? clips : Array.from({ length: selectedTrip.clipCount })).map(
                (clip, index) => {
                  const thumb =
                    selectedTrip.thumbnails[index % Math.max(selectedTrip.thumbnails.length, 1)];
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleClipClick(index)}
                      className={cn(
                        'relative h-12 w-20 flex-shrink-0 overflow-hidden rounded border-2 transition-all',
                        index === activeClipIndex
                          ? 'border-primary shadow-lg shadow-primary/20'
                          : 'border-transparent hover:border-muted-foreground/50',
                      )}
                    >
                      {thumb ? (
                        <div
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${thumb})` }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-muted">
                          <Film className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 bg-background/80 px-1 text-[10px] font-mono text-foreground">
                        {index + 1}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata sidebar */}
      <aside className="flex w-64 flex-col border-l border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="font-medium text-foreground">Trip Details</h2>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Date</span>
              <p className="font-medium text-foreground">{selectedTrip.date}</p>
            </div>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground">Start Time</span>
              <p className="font-medium text-foreground">{selectedTrip.time}</p>
            </div>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground">Total Duration</span>
              <p className="font-medium text-foreground">{formatDuration(selectedTrip.duration)}</p>
            </div>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground">Clips</span>
              <p className="font-medium text-foreground">{selectedTrip.clipCount}</p>
            </div>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground">Resolution</span>
              <p className="font-medium text-foreground">{selectedTrip.resolution}</p>
            </div>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground">Codec</span>
              <Badge
                variant="secondary"
                className={cn(
                  'mt-1',
                  selectedTrip.codec === 'lossless'
                    ? 'bg-success text-success-foreground'
                    : 'bg-warning text-warning-foreground',
                )}
              >
                {selectedTrip.codec === 'lossless' ? 'Lossless OK' : 'Re-encode needed'}
              </Badge>
            </div>
            <Separator />
            <div>
              <span className="text-xs text-muted-foreground">Folder Path</span>
              <div className="mt-1 flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <p className="break-all font-mono text-xs text-foreground">
                  {selectedTrip.folderPath}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
