import { Library, Play, Settings, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, type Page } from '@/store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems: Array<{ id: Page; label: string; icon: React.ElementType }> = [
  { id: 'library', label: 'Library', icon: Library },
  { id: 'player', label: 'Player', icon: Play },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar(): React.ReactElement {
  const { currentPage, setCurrentPage, selectedTrip } = useAppStore();

  return (
    <aside className="flex h-full w-16 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center justify-center border-b border-border">
        <Video className="h-6 w-6 text-primary" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2">
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => {
            const isDisabled = item.id === 'player' && !selectedTrip;
            const isActive = currentPage === item.id;

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => !isDisabled && setCurrentPage(item.id)}
                    disabled={isDisabled}
                    className={cn(
                      'flex h-10 w-full items-center justify-center rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                      isDisabled && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <p>
                    {item.label}
                    {isDisabled && ' (no trip selected)'}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>
    </aside>
  );
}
