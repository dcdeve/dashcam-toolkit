import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

export function getDbPath(): string {
  const dir = join(homedir(), '.dashcam-toolkit');
  mkdirSync(dir, { recursive: true });
  return join(dir, 'dashcam.db');
}
