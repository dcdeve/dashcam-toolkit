import type { FfmpegProgress } from '../../../interfaces/ffmpeg.js';

const TIME_RE = /time=(\d{2}):(\d{2}):(\d{2})\.(\d{2,3})/;
const SPEED_RE = /speed=\s*([\d.]+)x/;

/**
 * Parse a line of ffmpeg stderr output into progress info.
 * Returns null if the line doesn't contain progress data.
 */
export function parseProgressLine(line: string, totalDurationMs?: number): FfmpegProgress | null {
  const timeMatch = TIME_RE.exec(line);
  if (!timeMatch) return null;

  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const seconds = parseInt(timeMatch[3], 10);
  const centis = timeMatch[4].padEnd(3, '0');
  const millis = parseInt(centis, 10);

  const timeMs = hours * 3600000 + minutes * 60000 + seconds * 1000 + millis;

  const speedMatch = SPEED_RE.exec(line);
  const speed = speedMatch ? parseFloat(speedMatch[1]) : 0;

  const percent =
    totalDurationMs && totalDurationMs > 0 ? Math.min(100, (timeMs / totalDurationMs) * 100) : 0;

  return { percent, timeMs, speed };
}
