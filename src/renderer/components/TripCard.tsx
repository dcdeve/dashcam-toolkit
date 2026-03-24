import { useState } from 'react';
import { Film, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type UITrip, formatDuration, useAppStore } from '@/store';

interface TripCardProps {
  trip: UITrip;
  viewMode: 'grid' | 'list';
}

export function TripCard({ trip, viewMode }: TripCardProps): React.ReactElement {
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const { setSelectedTrip, setCurrentPage } = useAppStore();

  const handleClick = (): void => {
    if (trip.connected) {
      setSelectedTrip(trip);
      setCurrentPage('player');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!trip.connected || trip.thumbnails.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    setHoverPosition(Math.max(0, Math.min(1, position)));
  };

  const handleMouseLeave = (): void => {
    setHoverPosition(null);
  };

  const thumbnailIndex =
    hoverPosition !== null && trip.thumbnails.length > 0
      ? Math.min(Math.floor(hoverPosition * trip.thumbnails.length), trip.thumbnails.length - 1)
      : 0;

  const thumbnailUrl = trip.thumbnails[thumbnailIndex] ?? '';

  const CodecIcon =
    trip.codec === 'lossless' ? (
      <CheckCircle className="h-4 w-4 text-success" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-warning" />
    );
  const codecLabel =
    trip.codec === 'lossless' ? 'Lossless export available' : 'Re-encoding required';

  if (viewMode === 'list') {
    return (
      <TooltipProvider>
        <Card
          onClick={handleClick}
          className={cn(
            'flex items-center gap-4 p-3 transition-colors cursor-pointer bg-card border-border',
            trip.connected ? 'hover:bg-secondary' : 'opacity-60 cursor-not-allowed',
          )}
        >
          <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            {thumbnailUrl ? (
              <div
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${thumbnailUrl})` }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Film className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            {!trip.connected && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                <span className="text-xs text-muted-foreground">Offline</span>
              </div>
            )}
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">{trip.name}</span>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(trip.duration)}
                </span>
                <span className="flex items-center gap-1">
                  <Film className="h-3.5 w-3.5" />
                  {trip.clipCount} clips
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {trip.resolution}
              </Badge>
              <Tooltip>
                <TooltipTrigger>{CodecIcon}</TooltipTrigger>
                <TooltipContent>{codecLabel}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </Card>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn(
              'group relative overflow-hidden transition-all cursor-pointer bg-card border-border',
              trip.connected
                ? 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'
                : 'opacity-60 cursor-not-allowed',
            )}
          >
            <div className="relative aspect-video overflow-hidden bg-muted">
              {thumbnailUrl ? (
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-200 group-hover:scale-105"
                  style={{ backgroundImage: `url(${thumbnailUrl})` }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Film className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {!trip.connected && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <span className="text-sm font-medium text-muted-foreground">
                    Device not connected
                  </span>
                </div>
              )}
              {hoverPosition !== null && trip.connected && trip.thumbnails.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 flex h-1 gap-0.5 bg-background/50 px-1 pb-1">
                  {trip.thumbnails.map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex-1 rounded-sm transition-colors',
                        idx === thumbnailIndex ? 'bg-primary' : 'bg-foreground/30',
                      )}
                    />
                  ))}
                </div>
              )}
              <Badge className="absolute bottom-2 right-2 bg-background/80 text-foreground border-0">
                {formatDuration(trip.duration)}
              </Badge>
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground leading-tight">{trip.name}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Film className="h-3 w-3" />
                      {trip.clipCount} clips
                    </span>
                    <span>·</span>
                    <span>{trip.resolution}</span>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger>{CodecIcon}</TooltipTrigger>
                  <TooltipContent>{codecLabel}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </Card>
        </TooltipTrigger>
        {!trip.connected && <TooltipContent>Device not connected</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}
