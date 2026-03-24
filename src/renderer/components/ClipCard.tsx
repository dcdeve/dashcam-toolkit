import { Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Clip } from '../../interfaces/trips.js';

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

interface ClipCardProps {
  clip: Clip;
  onClick?: () => void;
}

export function ClipCard({ clip, onClick }: ClipCardProps): React.ReactElement {
  return (
    <div
      onClick={onClick}
      className={cn(
        'overflow-hidden rounded-md border border-border bg-card cursor-pointer',
        'transition-all hover:border-muted-foreground/50 hover:bg-card/80 hover:shadow-lg',
      )}
    >
      {/* Thumbnail area */}
      <div className="relative h-28 bg-muted flex items-center justify-center">
        <Film className="h-8 w-8 text-muted-foreground/40" />
        <Badge
          variant="secondary"
          className="absolute bottom-1.5 right-1.5 font-mono text-[10px] px-1 py-0"
        >
          {formatDuration(clip.duration)}
        </Badge>
      </div>

      {/* Info area */}
      <div className="p-2">
        <p className="truncate text-xs font-medium text-foreground" title={clip.filename}>
          {clip.filename}
        </p>
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground tabular-nums">
          {clip.width}&times;{clip.height} &middot; {formatSize(clip.size)}
          {clip.codec ? ` · ${clip.codec}` : ''}
        </p>
      </div>
    </div>
  );
}
