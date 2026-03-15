#!/usr/bin/env node

import { Command } from 'commander';
import { VERSION } from '../core/index.js';

const program = new Command();

program.name('dashcam').description('Cross-platform dashcam video processor').version(VERSION);

program
  .command('scan')
  .description('Scan directory for dashcam clips, detect patterns, and group into trips')
  .argument('<dir>', 'Directory to scan')
  .option('--rescan', 'Re-scan (update new/removed clips)')
  .option('--pattern <name>', 'Force pattern (skip auto-detect)')
  .option('--gap <minutes>', 'Override trip gap in minutes', '5')
  .action((_dir, _opts) => {
    console.log('scan: not implemented yet');
  });

program
  .command('export')
  .description('Export trips or clips (lossless by default)')
  .argument('[targets...]', 'Trip IDs or file paths')
  .option('--dir <dir>', 'Export all scanned from directory')
  .option('--range <range>', 'Time range (HH:MM:SS-HH:MM:SS)')
  .option('--output <path>', 'Output destination')
  .option('--reencode', 'Force re-encode instead of lossless')
  .option('--preset <name>', 'Quality preset (alta/media/baja)')
  .action((_targets, _opts) => {
    console.log('export: not implemented yet');
  });

program
  .command('info')
  .description('Probe file(s) for codec, resolution, duration, and detected pattern')
  .argument('<files...>', 'Files to probe')
  .action((_files) => {
    console.log('info: not implemented yet');
  });

program
  .command('patterns')
  .description('List and manage naming patterns')
  .option('--add <name>', 'Add custom pattern')
  .option('--format <format>', 'Pattern format (used with --add)')
  .action((_opts) => {
    console.log('patterns: not implemented yet');
  });

program
  .command('trips')
  .description('List and inspect trips')
  .argument('[trip-id]', 'Trip ID to show details')
  .action((_tripId) => {
    console.log('trips: not implemented yet');
  });

program
  .command('config')
  .description('View or update settings')
  .argument('[key]', 'Setting key')
  .argument('[value]', 'Setting value')
  .action((_key, _value) => {
    console.log('config: not implemented yet');
  });

program.parse();
