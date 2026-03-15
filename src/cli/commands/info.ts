import { resolve } from 'node:path';
import { ffmpeg } from '../../core/modules/ffmpeg/index.js';
import { patterns as patternsModule } from '../../core/modules/patterns/index.js';

export async function infoAction(files: string[]): Promise<void> {
  try {
    await ffmpeg.detect();
  } catch {
    console.error('Error: FFmpeg not found. Install ffmpeg or ensure ffmpeg-static is available.');
    process.exitCode = 1;
    return;
  }

  for (const file of files) {
    const absPath = resolve(file);
    try {
      const probe = await ffmpeg.probe(absPath);
      const filename = absPath.split('/').pop() ?? absPath;
      const detected = patternsModule.detect(filename);

      console.log(`${filename}`);
      console.log(`  Path:       ${probe.path}`);
      console.log(`  Format:     ${probe.format}`);
      console.log(`  Duration:   ${probe.duration.toFixed(1)}s`);
      console.log(`  Size:       ${(probe.size / 1024 / 1024).toFixed(1)} MB`);
      if (probe.video) {
        console.log(
          `  Video:      ${probe.video.codec} ${probe.video.width}x${probe.video.height} ${probe.video.fps.toFixed(0)}fps`,
        );
      }
      if (probe.audio) {
        console.log(
          `  Audio:      ${probe.audio.codec} ${probe.audio.channels}ch ${probe.audio.sampleRate}Hz`,
        );
      }
      console.log(`  Pattern:    ${detected ? `${detected.name} (${detected.id})` : 'none'}`);
      if (files.length > 1) console.log('');
    } catch (err) {
      console.error(
        `  Error probing ${absPath}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
