import { registerDialogHandlers } from './dialog.js';
import { registerDbHandlers } from './db.js';
import { registerScannerHandlers } from './scanner.js';
import { registerClipsHandlers } from './clips.js';
import { registerTripsHandlers } from './trips.js';
import { registerPatternsHandlers } from './patterns.js';
import { registerExporterHandlers } from './exporter.js';
import { registerThumbnailsHandlers } from './thumbnails.js';

export function registerAllHandlers(): void {
  registerDialogHandlers();
  registerDbHandlers();
  registerScannerHandlers();
  registerClipsHandlers();
  registerTripsHandlers();
  registerPatternsHandlers();
  registerExporterHandlers();
  registerThumbnailsHandlers();
}
