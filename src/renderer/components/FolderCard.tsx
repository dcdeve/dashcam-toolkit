import { format } from 'date-fns';
import { MoreHorizontal, Folder, RefreshCw, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAppStore, type UIFolder } from '@/store';

interface FolderCardProps {
  folder: UIFolder;
  onClick: () => void;
}

function HealthBadge({ health }: { health: UIFolder['health'] }) {
  if (health === 'checking') {
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking
      </Badge>
    );
  }
  if (health === 'ok') {
    return <Badge className="bg-green-600 text-white hover:bg-green-600 text-xs">OK</Badge>;
  }
  if (health === 'stale') {
    return <Badge className="bg-amber-500 text-white hover:bg-amber-500 text-xs">Stale</Badge>;
  }
  return (
    <Badge variant="secondary" className="text-xs text-muted-foreground">
      Unknown
    </Badge>
  );
}

export function FolderCard({ folder, onClick }: FolderCardProps): React.ReactElement {
  const { loadFolders } = useAppStore();

  async function handleDelete(): Promise<void> {
    await window.api.folders.remove(folder.id);
    await loadFolders();
  }

  return (
    <div
      className="relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Folder className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground truncate">{folder.displayName}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <HealthBadge health={folder.health} />
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    Delete folder
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete folder?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove <strong>{folder.displayName}</strong> and all its trips and clips
                  from the library. Files on disk will not be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>
          {folder.tripCount} trip{folder.tripCount !== 1 ? 's' : ''}
        </span>
        <span>
          {folder.clipCount} clip{folder.clipCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Last scan */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3" />
        <span>Scanned {format(folder.lastScanAt, 'yyyy-MM-dd HH:mm')}</span>
      </div>
    </div>
  );
}
