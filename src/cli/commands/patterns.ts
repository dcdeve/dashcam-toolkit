import { patterns as patternsModule } from '../../core/modules/patterns/index.js';

interface PatternsCommandOptions {
  add?: string;
  format?: string;
}

export function patternsAction(opts: PatternsCommandOptions): void {
  if (opts.add) {
    if (!opts.format) {
      console.error('Error: --format is required when using --add');
      process.exitCode = 1;
      return;
    }
    try {
      const pattern = patternsModule.add({
        name: opts.add,
        format: opts.format,
        regex: '',
        priority: 0,
      });
      console.log(`Added pattern: ${pattern.name} (${pattern.id})`);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      process.exitCode = 1;
    }
    return;
  }

  const all = patternsModule.list();
  if (all.length === 0) {
    console.log('No patterns configured.');
    return;
  }

  console.log('Patterns:');
  for (const p of all) {
    const tag = p.builtin ? 'builtin' : 'custom';
    console.log(`  ${p.id.padEnd(20)} ${p.name.padEnd(25)} ${p.format.padEnd(30)} [${tag}]`);
  }
}
