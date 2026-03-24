import { useState } from 'react';
import { ArrowLeft, Folder, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppStore, type ViewMode } from '@/store';

export function Settings(): React.ReactElement {
  const { settings, updateSettings, setCurrentPage } = useAppStore();
  const [gapInput, setGapInput] = useState(String(settings.gapDetectionMinutes));

  const handleBrowseScan = async (): Promise<void> => {
    const dir = await window.api.dialog.openDirectory();
    if (dir) updateSettings({ defaultScanDirectory: dir });
  };

  const handleBrowseOutput = async (): Promise<void> => {
    const dir = await window.api.dialog.openDirectory();
    if (dir) updateSettings({ defaultOutputDirectory: dir });
  };

  const handleGapBlur = (): void => {
    const n = parseInt(gapInput, 10);
    if (!isNaN(n) && n >= 1) updateSettings({ gapDetectionMinutes: n });
    else setGapInput(String(settings.gapDetectionMinutes));
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage('library')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl p-6">
          {/* General */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              General
            </h2>
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-foreground">Default Scan Directory</Label>
                  <p className="text-xs text-muted-foreground">Where to look for dashcam footage</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={settings.defaultScanDirectory}
                    onChange={(e) => updateSettings({ defaultScanDirectory: e.target.value })}
                    className="w-64 bg-secondary border-border font-mono text-sm"
                    placeholder="/media/dashcam"
                  />
                  <Button variant="secondary" size="icon" onClick={handleBrowseScan}>
                    <Folder className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-foreground">Gap Detection (minutes)</Label>
                  <p className="text-xs text-muted-foreground">Time gap to separate trips</p>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={gapInput}
                  onChange={(e) => setGapInput(e.target.value)}
                  onBlur={handleGapBlur}
                  className="w-24 bg-secondary border-border"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-foreground">Default View Mode</Label>
                  <p className="text-xs text-muted-foreground">How to display trips in library</p>
                </div>
                <Select
                  value={settings.defaultViewMode}
                  onValueChange={(v) => updateSettings({ defaultViewMode: v as ViewMode })}
                >
                  <SelectTrigger className="w-32 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Export */}
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Export
            </h2>
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-foreground">Default Output Directory</Label>
                  <p className="text-xs text-muted-foreground">Where to save exported videos</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={settings.defaultOutputDirectory}
                    onChange={(e) => updateSettings({ defaultOutputDirectory: e.target.value })}
                    className="w-64 bg-secondary border-border font-mono text-sm"
                    placeholder="~/Videos/DashCam"
                  />
                  <Button variant="secondary" size="icon" onClick={handleBrowseOutput}>
                    <Folder className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-foreground">Filename Template</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="mb-2 font-medium">Available tokens:</p>
                          <ul className="text-xs space-y-1">
                            <li>
                              <code className="text-primary">{'{date}'}</code> — Trip date
                              (YYYY-MM-DD)
                            </li>
                            <li>
                              <code className="text-primary">{'{time}'}</code> — Trip start time
                            </li>
                            <li>
                              <code className="text-primary">{'{seq}'}</code> — Sequence number
                            </li>
                            <li>
                              <code className="text-primary">{'{duration}'}</code> — Total duration
                            </li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use tokens like {'{date}'}, {'{seq}'}
                  </p>
                </div>
                <Input
                  value={settings.filenameTemplate}
                  onChange={(e) => updateSettings({ filenameTemplate: e.target.value })}
                  className="w-64 bg-secondary border-border font-mono text-sm"
                  placeholder="{date}_{seq}"
                />
              </div>
            </div>
          </section>

          {/* Naming Patterns */}
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Naming Patterns
            </h2>
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Format</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settings.patterns.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground text-sm py-6"
                      >
                        No patterns loaded
                      </TableCell>
                    </TableRow>
                  ) : (
                    settings.patterns.map((pattern) => (
                      <TableRow
                        key={pattern.id}
                        className={`border-border ${pattern.builtin ? 'text-muted-foreground' : ''}`}
                      >
                        <TableCell className="font-medium">{pattern.name}</TableCell>
                        <TableCell className="font-mono text-sm">{pattern.pattern}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {pattern.builtin ? 'builtin' : 'custom'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
