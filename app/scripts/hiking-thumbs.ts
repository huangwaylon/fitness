// トレイル's list images (docs/hiking.md "Data"), from each trail's photo (static/hiking/photos/<slug>.webp, 1080 × 720):
// a row's thumb (static/hiking/thumbs/: the middle square at 168 px, the row's 56 px at 3×) and a 予定 card's band
// (static/hiking/bands/: the middle 3:1 strip at 1080 × 360, the card's 120 px band at 3×), webp q70 / q50: ~5 KB and
// ~55 KB instead of the photo's ~150 KB, so the list on a slow link doesn't hold the trail map's chunk back (track C's
// map-perf: a trail's canvas at 52 s at 400 kbit/s with the photos). Run on the Mac after a photo changes
// (`npm run hiking:thumbs`; needs cwebp: brew install webp); the output is committed (src/lib/hiking/thumbs.test.ts
// checks each photo has both).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const APP = join(import.meta.dirname, '..');
const SRC = join(APP, 'static/hiking/photos');
const OUT: { dir: string; w: number; h: number; q: number }[] = [
  { dir: 'thumbs', w: 168, h: 168, q: 70 },
  { dir: 'bands', w: 1080, h: 360, q: 50 }
];
for (const o of OUT) mkdirSync(join(APP, 'static/hiking', o.dir), { recursive: true });
for (const f of readdirSync(SRC).filter((x) => x.endsWith('.webp'))) {
  const dims = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', join(SRC, f)], { encoding: 'utf8' });
  const W = Number(/pixelWidth: (\d+)/.exec(dims)![1]), H = Number(/pixelHeight: (\d+)/.exec(dims)![1]);
  for (const o of OUT) {
    // (the largest box of the output's ratio, in the middle)
    const cw = Math.min(W, Math.round((H * o.w) / o.h)), ch = Math.min(H, Math.round((W * o.h) / o.w));
    const crop = [(W - cw) >> 1, (H - ch) >> 1, cw, ch].map(String);
    execFileSync('cwebp', ['-quiet', '-q', String(o.q), '-metadata', 'none', '-crop', ...crop, '-resize', String(o.w), String(o.h), join(SRC, f), '-o', join(APP, 'static/hiking', o.dir, f)]);
  }
}
