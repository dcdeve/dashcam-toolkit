import { registerDialogHandlers } from './dialog.js';
import { registerDbHandlers } from './db.js';
import { registerScannerHandlers } from './scanner.js';
import { registerTripsHandlers } from './trips.js';
import { registerPatternsHandlers } from './patterns.js';
import { registerExporterHandlers } from './exporter.js';

export function registerAllHandlers(): void {
  registerDialogHandlers();
  registerDbHandlers();
  registerScannerHandlers();
  registerTripsHandlers();
  registerPatternsHandlers();
  registerExporterHandlers();
}
