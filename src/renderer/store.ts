import { create } from 'zustand';
import { format } from 'date-fns';
import type { Trip, Clip } from '../interfaces/trips.js';
import type { Pattern } from '../interfaces/patterns.js';
import type { ThumbnailEntry } from '../interfaces/thumbnails.js';

// ─── UI View-Models ─────────────────────────────────────────────────────────

export interface UITrip {
  id: string;
  name: string;
  date: string;
  time: string;
  duration: number;
  clipCount: number;
  codec: 'lossless' | 'reencode';
  resolution: string;
  folderPath: string;
  thumbnails: string[];
  connected: boolean;
}

export interface UIClip {
  id: string;
  filename: string;
  path: string;
  duration: number;
  width: number;
  height: number;
  size: number;
  timestampSource: Date;
  tripId: string | null;
  thumbnail: string | null;
}

export interface UIPattern {
  id: string;
  name: string;
  pattern: string;
  builtin: boolean;
}

export type ViewMode = 'grid' | 'list';
export type LibraryTab = 'trips' | 'clips';
export type SortOption = 'date-desc' | 'date-asc' | 'duration' | 'name';
export type Page = 'library' | 'player' | 'settings';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolutionLabel(width: number): string {
  if (width >= 3840) return '4K';
  if (width >= 1920) return '1080p';
  if (width >= 1280) return '720p';
  return `${width}p`;
}

function tripToUI(trip: Trip, thumbnails: string[], firstClip?: Clip): UITrip {
  const startedAt = trip.startedAt instanceof Date ? trip.startedAt : new Date(trip.startedAt);
  return {
    id: trip.id,
    name: `${format(startedAt, 'yyyy-MM-dd')} · ${format(startedAt, 'HH:mm')}`,
    date: format(startedAt, 'yyyy-MM-dd'),
    time: format(startedAt, 'HH:mm'),
    duration: trip.totalDuration,
    clipCount: trip.clipCount,
    codec: trip.codecCompat === 'compatible' ? 'lossless' : 'reencode',
    resolution: firstClip ? resolutionLabel(firstClip.width) : '—',
    folderPath: firstClip ? firstClip.path.replace(/[/\\][^/\\]+$/, '') : '—',
    thumbnails,
    connected: trip.status !== 'disconnected',
  };
}

function clipToUI(clip: Clip, thumbnail: string | null): UIClip {
  return {
    id: clip.id,
    filename: clip.filename,
    path: clip.path,
    duration: clip.duration,
    width: clip.width,
    height: clip.height,
    size: clip.size,
    timestampSource:
      clip.timestampSource instanceof Date ? clip.timestampSource : new Date(clip.timestampSource),
    tripId: clip.tripId,
    thumbnail,
  };
}

function patternToUI(p: Pattern): UIPattern {
  return { id: p.id, name: p.name, pattern: p.format, builtin: p.builtin };
}

// ─── Store State ─────────────────────────────────────────────────────────────

interface AppSettings {
  defaultScanDirectory: string;
  gapDetectionMinutes: number;
  defaultViewMode: ViewMode;
  defaultOutputDirectory: string;
  filenameTemplate: string;
  patterns: UIPattern[];
}

interface AppState {
  // Navigation
  currentPage: Page;
  selectedTrip: UITrip | null;
  setCurrentPage: (page: Page) => void;
  setSelectedTrip: (trip: UITrip | null) => void;

  // Library
  trips: UITrip[];
  clips: UIClip[];
  viewMode: ViewMode;
  activeTab: LibraryTab;
  sortOption: SortOption;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  setViewMode: (mode: ViewMode) => void;
  setActiveTab: (tab: LibraryTab) => void;
  setSortOption: (option: SortOption) => void;
  setSearchQuery: (query: string) => void;

  // Player
  currentClipIndex: number;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  setCurrentClipIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;

  // Export
  isExportOpen: boolean;
  exportProgress: number;
  exportPhase: string;
  isExporting: boolean;
  setIsExportOpen: (open: boolean) => void;
  setExportProgress: (progress: number) => void;
  setExportPhase: (phase: string) => void;
  setIsExporting: (exporting: boolean) => void;

  // Import
  isImportOpen: boolean;
  importInitialDir: string | null;
  openImportDrawer: (dir: string) => void;
  closeImportDrawer: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;

  // Lifecycle
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ─── Store ───────────────────────────────────────────────────────────────────

const defaultSettings: AppSettings = {
  defaultScanDirectory: '',
  gapDetectionMinutes: 5,
  defaultViewMode: 'grid',
  defaultOutputDirectory: '',
  filenameTemplate: '{date}_{seq}',
  patterns: [],
};

async function loadData(): Promise<{
  trips: UITrip[];
  clips: UIClip[];
  settings: AppSettings;
}> {
  const [rawTrips, rawClips, rawPatterns, rawSettings] = await Promise.all([
    window.api.trips.list(),
    window.api.clips.list(),
    window.api.patterns.list(),
    window.api.settings.getAll(),
  ]);

  // Hydrate dates
  const hydratedTrips = (rawTrips as Trip[]).map((t) => ({
    ...t,
    startedAt: new Date(t.startedAt),
    endedAt: new Date(t.endedAt),
    createdAt: new Date(t.createdAt),
  }));
  const hydratedClips = (rawClips as Clip[]).map((c) => ({
    ...c,
    timestampSource: new Date(c.timestampSource),
    createdAt: new Date(c.createdAt),
  }));

  // Build clip map keyed by tripId for quick first-clip lookup
  const clipsByTrip = new Map<string, Clip[]>();
  for (const clip of hydratedClips) {
    if (clip.tripId) {
      if (!clipsByTrip.has(clip.tripId)) clipsByTrip.set(clip.tripId, []);
      const bucket = clipsByTrip.get(clip.tripId);
      if (bucket) bucket.push(clip);
    }
  }

  // Build trips and clips without thumbnails — loaded lazily in background
  const tripUIs = hydratedTrips.map((trip) => {
    const firstClip = clipsByTrip.get(trip.id)?.[0];
    return tripToUI(trip, [], firstClip);
  });

  const clipUIs = hydratedClips.map((clip) => clipToUI(clip, null));

  const settings: AppSettings = {
    defaultScanDirectory: rawSettings['scan_directory'] ?? '',
    gapDetectionMinutes: Number(rawSettings['gap_minutes'] ?? 5),
    defaultViewMode: (rawSettings['view_mode'] as ViewMode) ?? 'grid',
    defaultOutputDirectory: rawSettings['export_dir'] ?? '',
    filenameTemplate: rawSettings['export_template'] ?? '{date}_{seq}',
    patterns: (rawPatterns as Pattern[]).map(patternToUI),
  };

  return { trips: tripUIs, clips: clipUIs, settings };
}

const toUrl = (path: string) => `dashcam-file://${path}`;

async function loadThumbnailsBackground(
  trips: UITrip[],
  set: (fn: (state: AppState) => Partial<AppState>) => void,
): Promise<void> {
  for (const trip of trips) {
    try {
      let entries = (await window.api.thumbnails.getScrub(trip.id)) as ThumbnailEntry[];
      if (!entries || entries.length === 0) {
        entries =
          ((await window.api.thumbnails.generateScrub(trip.id).catch(() => null)) as
            | ThumbnailEntry[]
            | null) ?? [];
      }
      if (entries.length === 0) continue;
      const thumbnails = entries.map((e) => toUrl(e.path));
      set((state) => ({
        trips: state.trips.map((t) => (t.id === trip.id ? { ...t, thumbnails } : t)),
      }));
    } catch {
      // skip failed trips silently
    }
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentPage: 'library',
  selectedTrip: null,
  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedTrip: (trip) =>
    set({ selectedTrip: trip, currentClipIndex: 0, currentTime: 0, isPlaying: false }),

  // Library
  trips: [],
  clips: [],
  viewMode: (localStorage.getItem('viewMode') as ViewMode) ?? 'grid',
  activeTab: (localStorage.getItem('activeTab') as LibraryTab) ?? 'trips',
  sortOption: 'date-desc',
  searchQuery: '',
  isLoading: true,
  error: null,
  setViewMode: (mode) => {
    localStorage.setItem('viewMode', mode);
    set({ viewMode: mode });
  },
  setActiveTab: (tab) => {
    localStorage.setItem('activeTab', tab);
    set({ activeTab: tab });
  },
  setSortOption: (option) => set({ sortOption: option }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Player
  currentClipIndex: 0,
  isPlaying: false,
  currentTime: 0,
  volume: 1,
  setCurrentClipIndex: (index) => set({ currentClipIndex: index }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setVolume: (volume) => set({ volume }),

  // Export
  isExportOpen: false,
  exportProgress: 0,
  exportPhase: '',
  isExporting: false,
  setIsExportOpen: (open) => set({ isExportOpen: open }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setExportPhase: (phase) => set({ exportPhase: phase }),
  setIsExporting: (exporting) => set({ isExporting: exporting }),

  // Import
  isImportOpen: false,
  importInitialDir: null,
  openImportDrawer: (dir) => set({ isImportOpen: true, importInitialDir: dir }),
  closeImportDrawer: () => set({ isImportOpen: false, importInitialDir: null }),

  // Settings
  settings: defaultSettings,
  updateSettings: async (patch) => {
    const current = get().settings;
    const next = { ...current, ...patch };
    set({ settings: next });
    // Persist changed keys
    const keyMap: Record<keyof AppSettings, string> = {
      defaultScanDirectory: 'scan_directory',
      gapDetectionMinutes: 'gap_minutes',
      defaultViewMode: 'view_mode',
      defaultOutputDirectory: 'export_dir',
      filenameTemplate: 'export_template',
      patterns: '',
    };
    for (const [k, ipcKey] of Object.entries(keyMap) as [keyof AppSettings, string][]) {
      if (ipcKey && patch[k] !== undefined) {
        await window.api.settings.set(ipcKey, String(next[k]));
      }
    }
  },

  // Lifecycle
  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const { trips, clips, settings } = await loadData();
      set({ trips, clips, settings, isLoading: false });
      // Load thumbnails in background — UI is already visible
      loadThumbnailsBackground(trips, set).catch(console.error);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isLoading: false });
    }
  },

  refresh: async () => {
    try {
      const { trips, clips, settings } = await loadData();
      set({ trips, clips, settings });
      loadThumbnailsBackground(trips, set).catch(console.error);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },
}));

// ─── Formatters ──────────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
