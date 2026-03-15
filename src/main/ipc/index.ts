import { registerDbHandlers } from './db.js';
import { registerScannerHandlers } from './scanner.js';
import { registerTripsHandlers } from './trips.js';
import { registerPatternsHandlers } from './patterns.js';
import { registerExporterHandlers } from './exporter.js';

export function registerAllHandlers(): void {
  registerDbHandlers();
  registerScannerHandlers();
  registerTripsHandlers();
  registerPatternsHandlers();
  registerExporterHandlers();
}
