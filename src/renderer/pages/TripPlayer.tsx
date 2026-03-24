import { useRef, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Expand,
  Film,
  Folder,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppStore, formatTime, formatDuration } from '@/store';
import type { UIClip } from '@/store';
import type { Clip } from '../../interfaces/trips.js';

export function TripPlayer(): React.ReactElement {
  const {
    selectedTrip,
    currentClipIndex,
    setCurrentClipIndex,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    volume,
    setVolume,
    setCurrentPage,
    setIsExportOpen,
  } = useAppStore();

  const [clips, setClips] = useState<UIClip[]>([]);
  const [mediaPort, setMediaPort] = useState<number>(0);
  const [activeBuffer, setActiveBuffer] = useState<'a' | 'b'>('a');

  const [controlsVisible, setControlsVisible] = useState(true);
  const progressRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);

  // Refs for use inside event handlers (avoid stale closures)
  const activeBufferRef = useRef<'a' | 'b'>('a');
  const clipsRef = useRef<UIClip[]>([]);
  const currentClipIndexRef = useRef(0);
  const isAutoAdvanceRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);

  // Keep refs in sync
  useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);
  useEffect(() => {
    currentClipIndexRef.current = currentClipIndex;
  }, [currentClipIndex]);

  const getVideo = (buf: 'a' | 'b') => (buf === 'a' ? videoRefA.current : videoRefB.current);
  const getActiveVideo = () => getVideo(activeBufferRef.current);
  const getInactiveVideo = () => getVideo(activeBufferRef.current === 'a' ? 'b' : 'a');

  // Get media server port once on mount
  useEffect(() => {
    window.api.media.getPort().then(setMediaPort).catch(console.error);
  }, []);

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

  // Sync buffers when clip index or media port changes
  useEffect(() => {
    if (!mediaPort || clips.length === 0) return;

    const currentClip = clips[currentClipIndex];
    const nextClip = clips[currentClipIndex + 1];
    const activeVideo = getActiveVideo();
    const inactiveVideo = getInactiveVideo();

    // Load current clip into active buffer (skip if auto-advancing — already playing)
    if (!isAutoAdvanceRef.current && activeVideo && currentClip) {
      const src = `http://127.0.0.1:${mediaPort}/media?path=${encodeURIComponent(currentClip.path)}`;
      console.log(`[TripPlayer] loading clip ${currentClipIndex} into active buffer`);
      activeVideo.src = src;
      activeVideo.load();

      if (pendingSeekRef.current !== null) {
        const seekTo = pendingSeekRef.current;
        pendingSeekRef.current = null;
        activeVideo.addEventListener(
          'loadedmetadata',
          () => {
            activeVideo.currentTime = seekTo;
          },
          { once: true },
        );
      }

      if (isPlaying)
        activeVideo.play().catch((err) => console.error('[TripPlayer] play failed:', err));
    }
    isAutoAdvanceRef.current = false;

    // Preload next clip into inactive buffer
    if (inactiveVideo && nextClip) {
      const src = `http://127.0.0.1:${mediaPort}/media?path=${encodeURIComponent(nextClip.path)}`;
      if (inactiveVideo.src !== src) {
        console.log(`[TripPlayer] preloading clip ${currentClipIndex + 1} into inactive buffer`);
        inactiveVideo.src = src;
        inactiveVideo.load();
      }
    }
  }, [currentClipIndex, clips, mediaPort]);

  // Sync volume to both buffers
  useEffect(() => {
    if (videoRefA.current) videoRefA.current.volume = volume;
    if (videoRefB.current) videoRefB.current.volume = volume;
  }, [volume]);

  if (!selectedTrip) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No trip selected</p>
      </div>
    );
  }

  const totalDuration = selectedTrip.duration;
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const findClipAtTime = (time: number): { clipIndex: number; timeWithinClip: number } => {
    let accumulated = 0;
    for (let i = 0; i < clips.length; i++) {
      if (i === clips.length - 1 || accumulated + clips[i].duration > time) {
        return { clipIndex: i, timeWithinClip: Math.max(0, time - accumulated) };
      }
      accumulated += clips[i].duration;
    }
    return { clipIndex: 0, timeWithinClip: 0 };
  };

  const handlePlayPause = (): void => {
    const video = getActiveVideo();
    if (!video) {
      setIsPlaying(!isPlaying);
      return;
    }
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((err) => console.error('[TripPlayer] play failed:', err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!progressRef.current || clips.length === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(Math.floor(position * totalDuration), totalDuration));

    const { clipIndex, timeWithinClip } = findClipAtTime(newTime);
    setCurrentTime(newTime);

    if (clipIndex === currentClipIndexRef.current) {
      const video = getActiveVideo();
      if (video) video.currentTime = timeWithinClip;
    } else {
      pendingSeekRef.current = timeWithinClip;
      setCurrentClipIndex(clipIndex);
    }
  };

  const handleClipClick = (index: number): void => {
    setCurrentClipIndex(index);
    const offset = clips.slice(0, index).reduce((sum, c) => sum + c.duration, 0);
    setCurrentTime(offset);
  };

  // Event handlers per buffer — ignore events from the inactive buffer
  const handleVideoTimeUpdate = (buf: 'a' | 'b') => (): void => {
    if (buf !== activeBufferRef.current) return;
    const video = getVideo(buf);
    if (!video) return;
    const idx = currentClipIndexRef.current;
    const offset = clipsRef.current.slice(0, idx).reduce((sum, c) => sum + c.duration, 0);
    setCurrentTime(Math.floor(offset + video.currentTime));
  };

  const handleVideoPlay = (buf: 'a' | 'b') => (): void => {
    if (buf !== activeBufferRef.current) return;
    setIsPlaying(true);
  };

  const handleVideoPause = (buf: 'a' | 'b') => (): void => {
    if (buf !== activeBufferRef.current) return;
    setIsPlaying(false);
  };

  const handleVideoEnded = (buf: 'a' | 'b') => (): void => {
    if (buf !== activeBufferRef.current) return;

    const idx = currentClipIndexRef.current;
    const allClips = clipsRef.current;

    if (idx >= allClips.length - 1) {
      setIsPlaying(false);
      return;
    }

    // Swap buffers — the inactive one is already preloaded
    const nextBuffer = activeBufferRef.current === 'a' ? 'b' : 'a';
    activeBufferRef.current = nextBuffer;
    setActiveBuffer(nextBuffer);
    isAutoAdvanceRef.current = true;

    getVideo(nextBuffer)
      ?.play()
      .catch((err) => console.error('[TripPlayer] autoplay failed:', err));

    setCurrentClipIndex(idx + 1);
    setIsPlaying(true);
  };

  const handleMouseMove = (): void => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  };

  const handleMouseLeave = (): void => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) setControlsVisible(false);
  };

  const renderVideoBuffer = (buf: 'a' | 'b') => (
    <video
      key={buf}
      ref={buf === 'a' ? videoRefA : videoRefB}
      className={cn(
        'absolute inset-0 h-full w-full object-contain',
        activeBuffer !== buf && 'hidden',
      )}
      onTimeUpdate={handleVideoTimeUpdate(buf)}
      onEnded={handleVideoEnded(buf)}
      onPlay={handleVideoPlay(buf)}
      onPause={handleVideoPause(buf)}
      onError={(e) => {
        if (buf === activeBufferRef.current)
          console.error('[TripPlayer] video error:', e.currentTarget.error);
      }}
    />
  );

  // Compute separator positions as % of total duration
  const separators: number[] = [];
  if (clips.length > 1 && totalDuration > 0) {
    let accumulated = 0;
    for (let i = 0; i < clips.length - 1; i++) {
      accumulated += clips[i].duration;
      separators.push((accumulated / totalDuration) * 100);
    }
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

        {/* Video area */}
        <div className="flex min-h-0 flex-1 flex-col bg-background">
          <div
            ref={videoContainerRef}
            className={cn(
              'relative min-h-0 flex-1 bg-muted/50',
              !controlsVisible && isPlaying && 'cursor-none',
            )}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {clips.length === 0 ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: selectedTrip.thumbnails[0]
                    ? `url(${selectedTrip.thumbnails[0]})`
                    : undefined,
                  backgroundColor: 'oklch(0.15 0.005 250)',
                }}
              />
            ) : (
              <>
                {renderVideoBuffer('a')}
                {renderVideoBuffer('b')}
              </>
            )}

            {/* Play/pause click area */}
            <button
              type="button"
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center transition-opacity hover:bg-background/20"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/80 text-foreground transition-transform hover:scale-110">
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              </div>
            </button>

            {/* Floating controls overlay */}
            <div
              className={cn(
                'absolute bottom-0 left-0 right-0 transition-opacity duration-300',
                controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none',
              )}
            >
              {/* Gradient backdrop */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />

              {/* Progress bar */}
              <div
                ref={progressRef}
                onClick={handleSeek}
                className="relative h-1.5 w-full cursor-pointer bg-white/20 z-10"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-primary pointer-events-none"
                  style={{ width: `${progress}%` }}
                />
                {separators.map((pos, i) => (
                  <div
                    key={i}
                    className="absolute inset-y-0 w-px bg-background pointer-events-none z-10"
                    style={{ left: `${pos}%` }}
                  />
                ))}
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-primary shadow pointer-events-none"
                  style={{ left: `${progress}%` }}
                />
              </div>

              {/* Controls */}
              <div className="relative z-10 flex items-center gap-4 px-3 py-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlayPause}
                  className="h-8 w-8 text-foreground hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </Button>
                <span className="font-mono text-sm text-foreground/80">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </span>
                <Badge variant="secondary" className="font-mono">
                  Clip {currentClipIndex + 1} / {selectedTrip.clipCount}
                </Badge>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setVolume(volume === 0 ? 1 : 0)}
                    className="h-8 w-8 text-foreground hover:bg-white/20"
                  >
                    {volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Slider
                    value={[volume * 100]}
                    onValueChange={(v) => setVolume(v[0] / 100)}
                    max={100}
                    className="w-20"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-foreground hover:bg-white/20"
                  onClick={() =>
                    videoContainerRef.current?.requestFullscreen().catch(console.error)
                  }
                >
                  <Expand className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

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
                        index === currentClipIndex
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
