// The art NH has no file for and we draw: a lamp's glow (docs/design.md "World"). The snowy and lit looks it used to
// derive from Nookipedia's renders come from NH's own models now (scripts/models.ts). Usage (from app/):
//   npm run assets:derive [-- --force --out=/tmp/x]
// Writes static/art/<key>.webp and its entry in static/art/manifest.json (fetch-assets.ts's shape; the source says
// "derived", so fetch-assets keeps it). Needs cwebp (brew install webp).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const APP = join(import.meta.dirname, '..');
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const OUT = arg('out') ? join(process.cwd(), arg('out')!) : join(APP, 'static', 'art');
const force = process.argv.includes('--force');
const TMP = join(tmpdir(), `derive-art-${process.pid}`);
mkdirSync(TMP, { recursive: true });

interface Img { w: number; h: number; d: Uint8ClampedArray }
function writeImg(img: Img, dest: string, q = 86): number {
  const pam = join(TMP, 'w.pam');
  writeFileSync(pam, Buffer.concat([Buffer.from(`P7\nWIDTH ${img.w}\nHEIGHT ${img.h}\nDEPTH 4\nMAXVAL 255\nTUPLTYPE RGB_ALPHA\nENDHDR\n`, 'latin1'), Buffer.from(img.d.buffer, img.d.byteOffset, img.d.byteLength)]));
  mkdirSync(dirname(dest), { recursive: true });
  execFileSync('cwebp', ['-quiet', '-q', String(q), '-alpha_q', '100', '-m', '6', '-exact', pam, '-o', dest]);
  return readFileSync(dest).length;
}
const smooth = (e0: number, e1: number, x: number) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

/** A lamp's soft glow (drawn by us: a warm radial light with a hot core), for streetlamps and lanterns at night. */
function lampGlow(size: number): Img {
  const d = new Uint8ClampedArray(size * size * 4), c = (size - 1) / 2;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const r = Math.hypot(x - c, y - c) / c, i = (y * size + x) * 4;
    const a = Math.max(0, 1 - r) ** 2.2 * 0.75 + smooth(0.25, 0.0, r) * 0.25;
    d[i] = 255; d[i + 1] = 214 + 30 * smooth(0.4, 0.0, r); d[i + 2] = 130 + 90 * smooth(0.3, 0.0, r); d[i + 3] = Math.min(255, a * 255);
  }
  return { w: size, h: size, d };
}

interface Entry { path: string; w: number; h: number; source: string }
const manifestFile = join(OUT, 'manifest.json');
const man: { version: number; files: Record<string, Entry> } = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : { version: 1, files: {} };
const key = 'deco/lamp-glow';
if (force || !man.files[key] || !existsSync(join(OUT, man.files[key].path))) {
  const img = lampGlow(64);
  const n = writeImg(img, join(OUT, `${key}.webp`), 80);
  man.files[key] = { path: `${key}.webp`, w: img.w, h: img.h, source: 'derived (drawn: scripts/derive-art.ts)' };
  console.log(`  ✓ ${key} ${img.w}×${img.h} ${(n / 1024).toFixed(1)} KB`);
}
man.files = Object.fromEntries(Object.entries(man.files).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(manifestFile, JSON.stringify(man, null, 2) + '\n');
rmSync(TMP, { recursive: true, force: true });
