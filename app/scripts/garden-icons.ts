// The editor's sheet of the garden's icons (layout/garden.ts GARDEN_ICONS: NH's own fence item icons and gardening icons,
// `Layout_<name>` folders of the export): one WebP, ICON_PX a cell, ICON_COLS across, in GARDEN_ICONS' order, into
// static/room/editor/garden-icons.webp (under /room/: never in the install's precache, fetched by the editor alone).
// One file for 39 icons (static/ stays under Pages' file cap: lib/static-budget.ts).
//
// Usage (from app/): NH_MODELS=~/Downloads/acnh-2.0.0-models/Model node scripts/garden-icons.ts
// The export is untrusted input: only each named folder's PNG is copied out and drawn on a canvas (nothing in it is run).
// Needs Google Chrome (Playwright's channel 'chrome') and cwebp.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GARDEN_ICONS, ICON_COLS, ICON_PX } from '../src/lib/layout/garden.ts';
import { nhFolders } from './nh-folders.ts';

const APP = join(import.meta.dirname, '..');
const OUT = join(APP, 'static', 'room', 'editor', 'garden-icons.webp');
const ROOT = process.env.NH_MODELS?.replace(/^~(?=\/)/, process.env.HOME ?? '~');
if (!ROOT) {
  console.error('Set NH_MODELS to the folder of NH model folders (<Model>.Nin_NX_NVN)');
  process.exit(1);
}
const folders = nhFolders(ROOT);
const pngs = GARDEN_ICONS.map((name) => {
  const folder = `Layout_${name}`;
  if (!/^[A-Za-z0-9_]+$/.test(folder) || !folders.has(folder)) throw new Error(`no icon ${folder}`);
  const dir = join(ROOT, `${folder}.Nin_NX_NVN`), png = readdirSync(dir).find((f) => /^[A-Za-z0-9_]+\.png$/.test(f) && statSync(join(dir, f)).isFile());
  if (!png) throw new Error(`no PNG in ${folder}`);
  return `data:image/png;base64,${readFileSync(join(dir, png)).toString('base64')}`;
});
folders.assertExact('garden-icons');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const url = await page.evaluate(async ({ pngs, px, cols }) => {
  const rows = Math.ceil(pngs.length / cols), c = new OffscreenCanvas(cols * px, rows * px), g = c.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  for (const [i, src] of pngs.entries()) {
    const im = await createImageBitmap(await (await fetch(src)).blob());
    // (each icon fitted to its cell, its aspect kept)
    const s = px / Math.max(im.width, im.height), w = im.width * s, h = im.height * s;
    g.drawImage(im, (i % cols) * px + (px - w) / 2, Math.floor(i / cols) * px + (px - h) / 2, w, h);
  }
  const b = await c.convertToBlob({ type: 'image/png' });
  return await new Promise<string>((ok) => {
    const r = new FileReader();
    r.onload = () => ok(r.result as string);
    r.readAsDataURL(b);
  });
}, { pngs, px: ICON_PX, cols: ICON_COLS });
await browser.close();
const tmp = mkdtempSync(join(tmpdir(), 'garden-icons-'));
try {
  writeFileSync(join(tmp, 'sheet.png'), Buffer.from(url.split(',')[1], 'base64'));
  mkdirSync(join(OUT, '..'), { recursive: true });
  execFileSync('cwebp', ['-quiet', '-q', '82', '-alpha_q', '90', '-m', '6', join(tmp, 'sheet.png'), '-o', OUT]);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log(`${OUT}: ${GARDEN_ICONS.length} icons, ${(statSync(OUT).size / 1024).toFixed(1)} KB`);
