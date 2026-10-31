// Renders the app icons from design/icon/icon-source.png (the couple on a bench on the island, the user's art) with
// Playwright + the installed Chrome, at exact pixel sizes. Usage (from app/): npm run icons:build → static/icons/*
// (commit them). The source is a full-bleed square (iOS and Android round or mask it themselves).
// - apple-touch-icon-180 and icon-192 (PNG), icon-512 and icon-maskable-512 (WebP via cwebp: ~30 KB instead of ~370 KB
//   of photographic PNG, since they're in the install precache): the full square (both faces sit well inside the
//   maskable 80% safe circle).
// - favicon-32: a crop of the two faces, since the whole scene is mush at 32 px.
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

// The source lives outside static/ so the ~1.9 MB PNG is never deployed or precached by the service worker.
const APP = join(import.meta.dirname, '..');
const ICONS = join(APP, 'static', 'icons');
const src = 'data:image/png;base64,' + readFileSync(join(APP, 'design', 'icon', 'icon-source.png')).toString('base64');

const SIZE = 1254; // the source's side
type Crop = { x: number; y: number; side: number };
const FULL: Crop = { x: 0, y: 0, side: SIZE };
const FACES: Crop = { x: 157, y: 20, side: 940 };

const jobs: [crop: Crop, px: number, file: string][] = [
  [FULL, 180, 'apple-touch-icon-180.png'],
  [FULL, 192, 'icon-192.png'],
  [FULL, 512, 'icon-512.webp'],
  [FULL, 512, 'icon-maskable-512.webp'],
  [FACES, 32, 'favicon-32.png'],
];

const browser = await chromium.launch({ channel: 'chrome' });
for (const [c, px, file] of jobs) {
  const page = await browser.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
  const k = px / c.side;
  await page.setContent(`<html><body style="margin:0;overflow:hidden"><img src="${src}" style="display:block;position:absolute;
    width:${SIZE * k}px;height:${SIZE * k}px;left:${-c.x * k}px;top:${-c.y * k}px"></body></html>`);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  const webp = file.endsWith('.webp');
  const png = join(ICONS, webp ? file.replace(/\.webp$/, '.png') : file);
  await page.screenshot({ path: png, omitBackground: false }); // opaque: iOS fills transparency with black
  await page.close();
  if (webp) {
    execFileSync('cwebp', ['-quiet', '-q', '82', png, '-o', join(ICONS, file)]);
    rmSync(png);
  }
  console.log(file);
}
await browser.close();
