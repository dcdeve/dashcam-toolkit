// Exporter module interface

export type ExportPreset = 'high' | 'medium' | 'low';
export type ExportSpeed = 'fast' | 'balanced' | 'max';

export interface TimeRange {
  startMs: number;
  endMs: number;
}

export interface ExportOptions {
  /** Trip IDs to export */
  tripIds?: string[];
  /** Direct file paths to export */
  filePaths?: string[];
  /** Time range within the trip */
  range?: TimeRange;
  /** Output file path */
  output?: string;
  /** Force re-encode (default: lossless concat) */
  reencode?: boolean;
  /** Re-encode quality preset */
  preset?: ExportPreset;
  /** Re-encode speed (affects file size and encoding time) */
  speed?: ExportSpeed;
}

export interface ExportProgress {
  phase: 'preparing' | 'concatenating' | 'encoding' | 'finalizing';
  percent: number;
  currentFile: string;
  speed: number;
}

export interface ExportTemplate {
  name: string;
  /** Template string with tokens: {date}, {trip}, {seq} */
  pattern: string;
}

export type ExporterError =
  | 'EXPORTER_NO_INPUT'
  | 'EXPORTER_OUTPUT_EXISTS'
  | 'EXPORTER_CODEC_INCOMPATIBLE'
  | 'EXPORTER_FFMPEG_FAILED'
  | 'EXPORTER_CANCELLED';

export interface ExporterModule {
  export(options: ExportOptions, onProgress?: (progress: ExportProgress) => void): Promise<string>;
  cancel(): void;
  listTemplates(): ExportTemplate[];
}
