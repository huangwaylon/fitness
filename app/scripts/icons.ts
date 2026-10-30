// Renders the app icons from design/icon/icon-source.svg (Anchovy lifting, official art embedded) with Playwright +
// the installed Chrome, at exact pixel sizes. Usage (from app/): npm run icons:build  → static/icons/*.png (commit them).
// - apple-touch-icon-180, icon-192, icon-512: the full-bleed square (purpose "any"; iOS rounds the corners itself).
// - icon-maskable-512: the #art group scaled into the 80% safe circle over the full #bg (the island is widened so the
//   ground still reaches both edges).
// - favicon-32: a head-and-Bells crop, since the whole figure is mush at 32 px (and the SVG is ~240 KB).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

// The source lives outside static/ so the ~240 KB SVG is never deployed or precached by the service worker.
const APP = join(import.meta.dirname, '..');
const ICONS = join(APP, 'static', 'icons');
const source = readFileSync(join(APP, 'design', 'icon', 'icon-source.svg'), 'utf8');

const MASK_SCALE = 0.77; // the farthest Bell sits ~528 units from centre; the safe circle is 410
const maskable = source
  .replace('cy="1060" rx="560" ry="120"', 'cy="1260" rx="1200" ry="320"')
  .replace('<g id="art">', `<g id="art" transform="translate(512 512) scale(${MASK_SCALE}) translate(-512 -512)">`);
const favicon = source.replace('viewBox="0 0 1024 1024"', 'viewBox="190 40 650 650"');

const jobs: [svg: string, px: number, file: string][] = [
  [source, 180, 'apple-touch-icon-180.png'],
  [source, 192, 'icon-192.png'],
  [source, 512, 'icon-512.png'],
  [maskable, 512, 'icon-maskable-512.png'],
  [favicon, 32, 'favicon-32.png'],
];

const browser = await chromium.launch({ channel: 'chrome' });
for (const [svg, px, file] of jobs) {
  const page = await browser.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
  const src = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  await page.setContent(`<html><body style="margin:0"><img src="${src}" width="${px}" height="${px}" style="display:block"></body></html>`);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  await page.screenshot({ path: join(ICONS, file), omitBackground: false }); // opaque: iOS fills transparency with black
  await page.close();
  console.log(file);
}
await browser.close();
