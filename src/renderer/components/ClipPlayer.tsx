import { useRef, useEffect, useState } from 'react';
import { Expand, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatTime } from '@/store';
import type { UIClip } from '@/store';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ClipPlayerProps {
  /** Ordered list of clips to play. One clip = single-clip mode (modal). */
  clips: UIClip[];

  /**
   * External clip index override. When this value changes and differs from the
   * internal currentClipIndex, ClipPlayer seeks to that clip.
   * Used by TripPlayer's filmstrip. Ignored by ClipPlayerModal (single clip).
   */
  activeClipIndex?: number;

  /** Volume level 0–1. Parent reads from global store and passes down. */
  volume?: number;

  /**
   * Called on every timeupdate with the cumulative trip time (seconds).
   * TripPlayer uses this to sync global store for Export.
   */
  onTimeChange?: (time: number) => void;

  /**
   * Called when the active clip changes — either via auto-advance or filmstrip.
   * TripPlayer uses this to keep its filmstrip highlight in sync.
   */
  onClipChange?: (index: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ClipPlayer({
  clips,
  activeClipIndex,
  volume = 1,
  onTimeChange,
  onClipChange,
}: ClipPlayerProps): React.ReactElement {
  // ── State ──────────────────────────────────────────────────────────────────
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeBuffer, setActiveBuffer] = useState<'a' | 'b'>('a');
  const [controlsVisible, setControlsVisible] = useState(true);
  const [mediaPort, setMediaPort] = useState<number>(0);
  const [localVolume, setLocalVolume] = useState(volume);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const activeBufferRef = useRef<'a' | 'b'>('a');
  const clipsRef = useRef<UIClip[]>([]);
  const currentClipIndexRef = useRef(0);
  const isAutoAdvanceRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getVideo = (buf: 'a' | 'b') => (buf === 'a' ? videoRefA.current : videoRefB.current);
  const getActiveVideo = () => getVideo(activeBufferRef.current);
  const getInactiveVideo = () => getVideo(activeBufferRef.current === 'a' ? 'b' : 'a');

  // ── Keep refs in sync ──────────────────────────────────────────────────────
  useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);

  useEffect(() => {
    currentClipIndexRef.current = currentClipIndex;
  }, [currentClipIndex]);

  // ── Fetch mediaPort once on mount ──────────────────────────────────────────
  useEffect(() => {
    window.api.media.getPort().then(setMediaPort).catch(console.error);
  }, []);

  // ── Buffer sync effect ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mediaPort || clips.length === 0) return;

    const currentClip = clips[currentClipIndex];
    const nextClip = clips[currentClipIndex + 1];
    const activeVideo = getActiveVideo();
    const inactiveVideo = getInactiveVideo();

    // Load current clip into active buffer (skip if auto-advancing — already playing)
    if (!isAutoAdvanceRef.current && activeVideo && currentClip) {
      const src = `http://127.0.0.1:${mediaPort}/media?path=${encodeURIComponent(currentClip.path)}`;
      if (activeVideo.src !== src) {
        console.log(`[ClipPlayer] loading clip ${currentClipIndex} into active buffer`);
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
      }

      if (isPlaying) {
        activeVideo.play().catch((err) => console.error('[ClipPlayer] play failed:', err));
      }
    }
    isAutoAdvanceRef.current = false;

    // Preload next clip into inactive buffer
    if (inactiveVideo && nextClip) {
      const src = `http://127.0.0.1:${mediaPort}/media?path=${encodeURIComponent(nextClip.path)}`;
      if (inactiveVideo.src !== src) {
        console.log(`[ClipPlayer] preloading clip ${currentClipIndex + 1} into inactive buffer`);
        inactiveVideo.src = src;
        inactiveVideo.load();
      }
    }
  }, [currentClipIndex, clips, mediaPort]);

  // ── Volume sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    setLocalVolume(volume);
    if (videoRefA.current) videoRefA.current.volume = volume;
    if (videoRefB.current) videoRefB.current.volume = volume;
  }, [volume]);

  // ── activeClipIndex prop sync ──────────────────────────────────────────────
  useEffect(() => {
    if (activeClipIndex === undefined) return;
    if (activeClipIndex === currentClipIndexRef.current) return;
    setCurrentClipIndex(activeClipIndex);
  }, [activeClipIndex]);

  // ── Unmount cleanup ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      videoRefA.current?.pause();
      videoRefB.current?.pause();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // ── Computed ───────────────────────────────────────────────────────────────
  const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0);
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const separators: number[] = [];
  if (clips.length > 1 && totalDuration > 0) {
    let accumulated = 0;
    for (let i = 0; i < clips.length - 1; i++) {
      accumulated += clips[i].duration;
      separators.push((accumulated / totalDuration) * 100);
    }
  }

  // ── Seek helper ────────────────────────────────────────────────────────────
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

  // ── Event handlers ─────────────────────────────────────────────────────────
  const handleVideoTimeUpdate = (buf: 'a' | 'b') => (): void => {
    if (buf !== activeBufferRef.current) return;
    const video = getVideo(buf);
    if (!video) return;
    const idx = currentClipIndexRef.current;
    const offset = clipsRef.current.slice(0, idx).reduce((sum, c) => sum + c.duration, 0);
    const t = Math.floor(offset + video.currentTime);
    setCurrentTime(t);
    onTimeChange?.(t);
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
      .catch((err) => console.error('[ClipPlayer] autoplay failed:', err));

    const newIdx = idx + 1;
    setCurrentClipIndex(newIdx);
    setIsPlaying(true);
    onClipChange?.(newIdx);
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
      video.play().catch((err) => console.error('[ClipPlayer] play failed:', err));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!progressRef.current || clips.length === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(Math.floor(position * totalDuration), totalDuration));

    const { clipIndex, timeWithinClip } = findClipAtTime(newTime);
    setCurrentTime(newTime);
    onTimeChange?.(newTime);

    if (clipIndex === currentClipIndexRef.current) {
      const video = getActiveVideo();
      if (video) video.currentTime = timeWithinClip;
    } else {
      pendingSeekRef.current = timeWithinClip;
      setCurrentClipIndex(clipIndex);
      onClipChange?.(clipIndex);
    }
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

  // ── Render helpers ─────────────────────────────────────────────────────────
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
          console.error('[ClipPlayer] video error:', e.currentTarget.error);
      }}
    />
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={videoContainerRef}
      className={cn(
        'relative min-h-0 flex-1 bg-muted/50',
        !controlsVisible && isPlaying && 'cursor-none',
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {renderVideoBuffer('a')}
      {renderVideoBuffer('b')}

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

        {/* Controls bar */}
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
          {clips.length > 1 && (
            <Badge variant="secondary" className="font-mono">
              Clip {currentClipIndex + 1} / {clips.length}
            </Badge>
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newVol = localVolume === 0 ? 1 : 0;
                setLocalVolume(newVol);
                if (videoRefA.current) videoRefA.current.volume = newVol;
                if (videoRefB.current) videoRefB.current.volume = newVol;
              }}
              className="h-8 w-8 text-foreground hover:bg-white/20"
            >
              {localVolume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[localVolume * 100]}
              onValueChange={(v) => {
                const newVol = v[0] / 100;
                setLocalVolume(newVol);
                if (videoRefA.current) videoRefA.current.volume = newVol;
                if (videoRefB.current) videoRefB.current.volume = newVol;
              }}
              max={100}
              className="w-20"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground hover:bg-white/20"
            onClick={() => videoContainerRef.current?.requestFullscreen().catch(console.error)}
          >
            <Expand className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
