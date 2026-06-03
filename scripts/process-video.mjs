// Transcode the Veo hero clip into web-optimized, audio-free mp4 + webm.
// One-shot; safe to delete.
import { execFileSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

const SRC = 'public/hero/hero.mp4';

// Re-encode mp4: H.264, no audio, capped to 1280w, faststart for streaming.
execFileSync(ffmpeg, [
  '-y', '-i', SRC,
  '-an',
  '-vf', 'scale=1280:-2',
  '-c:v', 'libx264', '-profile:v', 'high', '-crf', '26', '-preset', 'slow',
  '-movflags', '+faststart',
  'public/hero/hero-opt.mp4',
], { stdio: 'ignore' });

// VP9 webm: smaller, modern browsers.
execFileSync(ffmpeg, [
  '-y', '-i', SRC,
  '-an',
  '-vf', 'scale=1280:-2',
  '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-row-mt', '1',
  'public/hero/hero.webm',
], { stdio: 'ignore' });

console.log('done');
