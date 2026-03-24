import { Search, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';

export function TopBar(): React.ReactElement {
  const { searchQuery, setSearchQuery, setCurrentPage } = useAppStore();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <h1 className="text-lg font-semibold text-foreground">DashCam Library</h1>
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search trips..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-secondary border-border"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCurrentPage('settings')}
        className="text-muted-foreground hover:text-foreground"
      >
        <Settings className="h-5 w-5" />
      </Button>
    </header>
  );
}
