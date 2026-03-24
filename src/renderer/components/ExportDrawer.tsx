import { useState, useEffect } from 'react';
import { Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useAppStore, formatDuration } from '@/store';
import type { ExportPreset } from '../../interfaces/exporter.js';

type OutputMode = 'lossless' | 'reencode';

export function ExportDrawer(): React.ReactElement | null {
  const {
    selectedTrip,
    isExportOpen,
    setIsExportOpen,
    exportProgress,
    setExportProgress,
    exportPhase,
    setExportPhase,
    isExporting,
    setIsExporting,
    settings,
  } = useAppStore();

  const [outputMode, setOutputMode] = useState<OutputMode>('lossless');
  const [preset, setPreset] = useState<ExportPreset>('high');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [outputDirectory, setOutputDirectory] = useState(settings.defaultOutputDirectory);

  useEffect(() => {
    if (selectedTrip?.codec === 'reencode') {
      setOutputMode('reencode');
    } else {
      setOutputMode('lossless');
    }
  }, [selectedTrip]);

  useEffect(() => {
    setOutputDirectory(settings.defaultOutputDirectory);
  }, [settings.defaultOutputDirectory]);

  if (!selectedTrip) return null;

  const handleBrowse = async (): Promise<void> => {
    const dir = await window.api.dialog.openDirectory();
    if (dir) setOutputDirectory(dir);
  };

  const parseTimeToMs = (t: string): number => {
    const parts = t.split(':').map(Number);
    if (parts.length === 3) {
      const [h, m, s] = parts;
      return (h * 3600 + m * 60 + s) * 1000;
    }
    return 0;
  };

  const handleExport = async (): Promise<void> => {
    setIsExporting(true);
    setExportProgress(0);
    setExportPhase('Preparing...');

    const removeListener = window.api.exporter.onProgress((progress) => {
      const phaseLabel: Record<string, string> = {
        preparing: 'Preparing...',
        concatenating: 'Concatenating...',
        encoding: 'Encoding...',
        finalizing: 'Finalizing...',
      };
      setExportPhase(phaseLabel[progress.phase] ?? progress.phase);
      setExportProgress(Math.round(progress.percent));
    });

    try {
      await window.api.exporter.export({
        tripIds: [selectedTrip.id],
        output: outputDirectory || undefined,
        reencode: outputMode === 'reencode',
        preset: outputMode === 'reencode' ? preset : undefined,
        range:
          startTime && endTime
            ? { startMs: parseTimeToMs(startTime), endMs: parseTimeToMs(endTime) }
            : undefined,
      });
      setExportProgress(100);
      setExportPhase('Done!');
      setTimeout(() => {
        setIsExportOpen(false);
        setIsExporting(false);
        setExportProgress(0);
        setExportPhase('');
      }, 1500);
    } catch {
      setIsExporting(false);
      setExportProgress(0);
      setExportPhase('');
    } finally {
      removeListener();
    }
  };

  const handleCancel = async (): Promise<void> => {
    await window.api.exporter.cancel();
    setIsExporting(false);
    setExportProgress(0);
    setExportPhase('');
  };

  const estimatedTime =
    isExporting && exportProgress < 100
      ? `~${Math.ceil((100 - exportProgress) / 10)}s remaining`
      : exportProgress === 100
        ? 'Complete!'
        : null;

  return (
    <Sheet open={isExportOpen} onOpenChange={setIsExportOpen}>
      <SheetContent className="w-[400px] bg-card border-border sm:max-w-[400px]">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="text-foreground">Export Trip</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-6">
          {/* Trip summary */}
          <div className="rounded-lg bg-secondary p-4">
            <h3 className="font-medium text-foreground">{selectedTrip.name}</h3>
            <p className="text-sm text-muted-foreground">
              {selectedTrip.clipCount} clips · {formatDuration(selectedTrip.duration)}
            </p>
          </div>

          {!isExporting ? (
            <>
              {/* Output mode */}
              <div className="flex flex-col gap-3">
                <Label className="text-foreground">Output Mode</Label>
                <RadioGroup
                  value={outputMode}
                  onValueChange={(v) => setOutputMode(v as OutputMode)}
                  className="gap-3"
                >
                  <div className="flex items-center space-x-3 rounded-lg border border-border p-3">
                    <RadioGroupItem
                      value="lossless"
                      id="lossless"
                      disabled={selectedTrip.codec === 'reencode'}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="lossless"
                        className={
                          selectedTrip.codec === 'reencode'
                            ? 'text-muted-foreground'
                            : 'text-foreground'
                        }
                      >
                        Lossless (recommended)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        No quality loss, fastest export
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 rounded-lg border border-border p-3">
                    <RadioGroupItem value="reencode" id="reencode" />
                    <div className="flex-1">
                      <Label htmlFor="reencode" className="text-foreground">
                        Re-encode
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Compress video, smaller file size
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Quality preset */}
              {outputMode === 'reencode' && (
                <div className="flex flex-col gap-2">
                  <Label className="text-foreground">Quality Preset</Label>
                  <Select value={preset} onValueChange={(v) => setPreset(v as ExportPreset)}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High Quality</SelectItem>
                      <SelectItem value="medium">Medium Quality</SelectItem>
                      <SelectItem value="low">Low Quality (smaller file)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* Time range */}
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">Time Range (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="00:00:00"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-secondary border-border font-mono"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    placeholder="00:00:00"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-secondary border-border font-mono"
                  />
                </div>
              </div>

              {/* Output directory */}
              <div className="flex flex-col gap-2">
                <Label className="text-foreground">Output Directory</Label>
                <div className="flex gap-2">
                  <Input
                    value={outputDirectory}
                    onChange={(e) => setOutputDirectory(e.target.value)}
                    className="flex-1 bg-secondary border-border font-mono text-sm"
                  />
                  <Button variant="secondary" size="icon" onClick={handleBrowse}>
                    <Folder className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Progress view */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{exportPhase}</span>
                  <span className="text-sm text-muted-foreground">{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="h-2" />
                {estimatedTime && (
                  <span className="text-xs text-muted-foreground">{estimatedTime}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card p-4">
          {!isExporting ? (
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setIsExportOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleExport}>
                Export
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleCancel}
              disabled={exportProgress === 100}
            >
              {exportProgress === 100 ? 'Closing...' : 'Cancel Export'}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
