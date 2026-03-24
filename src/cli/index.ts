#!/usr/bin/env node

import { Command } from 'commander';
import { VERSION } from '../core/index.js';
import { scanAction } from './commands/scan.js';
import { exportAction } from './commands/export.js';
import { infoAction } from './commands/info.js';
import { patternsAction } from './commands/patterns.js';
import { tripsAction } from './commands/trips.js';
import { configAction } from './commands/config.js';
import { foldersListAction, foldersHealthAction } from './commands/folders.js';

const program = new Command();

program.name('dashcam').description('Cross-platform dashcam video processor').version(VERSION);

program
  .command('scan')
  .description('Scan directory for dashcam clips, detect patterns, and group into trips')
  .argument('<dir>', 'Directory to scan')
  .option('--rescan', 'Re-scan (update new/removed clips)')
  .option('--pattern <name>', 'Force pattern (skip auto-detect)')
  .option('--gap <minutes>', 'Override trip gap in minutes', '5')
  .action(scanAction);

program
  .command('export')
  .description('Export trips or clips (lossless by default)')
  .argument('[targets...]', 'Trip IDs or file paths')
  .option('--dir <dir>', 'Export all scanned from directory')
  .option('--range <range>', 'Time range (HH:MM:SS-HH:MM:SS)')
  .option('--output <path>', 'Output destination')
  .option('--reencode', 'Force re-encode instead of lossless')
  .option('--preset <name>', 'Quality preset (alta/media/baja)')
  .action(exportAction);

program
  .command('info')
  .description('Probe file(s) for codec, resolution, duration, and detected pattern')
  .argument('<files...>', 'Files to probe')
  .action(infoAction);

program
  .command('patterns')
  .description('List and manage naming patterns')
  .option('--add <name>', 'Add custom pattern')
  .option('--format <format>', 'Pattern format (used with --add)')
  .action(patternsAction);

program
  .command('trips')
  .description('List and inspect trips')
  .argument('[trip-id]', 'Trip ID to show details')
  .action(tripsAction);

program
  .command('config')
  .description('View or update settings')
  .argument('[key]', 'Setting key')
  .argument('[value]', 'Setting value')
  .action(configAction);

const foldersCmd = program.command('folders').description('List and inspect scanned folders');

foldersCmd.command('list').description('List all scanned folders').action(foldersListAction);

foldersCmd
  .command('health <path-or-id>')
  .description('Run health check for a folder (by path or ID)')
  .action(foldersHealthAction);

program.parse();
