// FFmpeg module interface

export interface VideoStream {
  codec: string;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
}

export interface AudioStream {
  codec: string;
  channels: number;
  sampleRate: number;
  bitrate: number;
}

export interface ProbeResult {
  path: string;
  duration: number;
  size: number;
  video: VideoStream | null;
  audio: AudioStream | null;
  format: string;
  createdAt: Date | null;
}

export interface SpawnOptions {
  args: string[];
  onProgress?: (progress: FfmpegProgress) => void;
  /** Timeout in milliseconds */
  timeout?: number;
}

export interface FfmpegProgress {
  percent: number;
  timeMs: number;
  speed: number;
}

export type FfmpegError =
  | 'FFMPEG_NOT_FOUND'
  | 'FFMPEG_PROBE_FAILED'
  | 'FFMPEG_SPAWN_FAILED'
  | 'FFMPEG_TIMEOUT'
  | 'FFMPEG_EXIT_ERROR';

export interface FfmpegModule {
  detect(): Promise<string>;
  probe(filePath: string): Promise<ProbeResult>;
  spawn(options: SpawnOptions): Promise<void>;
}
