// The probe for npm run unused (docs/cleanup-2d.md): opens the built 3D island in a run of scenes (the seasons, the
// times of day, the weather, the events, the visitors, a critter, a find), scrolls and taps about, and writes every
// static path it drew (a visible DOM image or background) or that the engine loaded (a card's texture, the ground:
// fetched, never an attached image), one a line, for `npm run unused -- --seen=<file>`. Downloaded but hidden (the
// DOM's own art under the canvas, opacity 0) is neither.
// Each 404 under art/, room/ or terrain/ is listed (and the run exits 1): what a deletion must never cause.
// Usage (from app/, with the build served: node scripts/serve-build.ts 4396):
//   node scripts/unused-probe.ts 4396 [/tmp/seen.txt]
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const port = Number(args[0] ?? 4396), out = args[1] ?? '/tmp/seen.txt';
const base = `http://127.0.0.1:${port}/fitness/`;
const scenes = [
  'date=2026-11-04T12:00', 'date=2026-11-04T21:00', 'date=2026-11-04T18:00&weather=rain',
  'date=2026-04-05T10:00', 'date=2026-07-12T13:00&visitor=gulliver', 'date=2026-10-31T19:00',
  'date=2027-01-10T12:00&weather=snow', 'date=2026-11-21T10:00', 'date=2026-08-02T20:00',
  'date=2026-06-07T11:00', 'date=2026-11-04T12:00&critter=fish', 'date=2026-11-04T22:00&critter=tarantula',
  'date=2026-11-04T12:00&find=bottle', 'date=2026-11-07T20:00&visitor=kk', 'date=2026-11-04T12:00&visitor=wisp',
  'date=2026-12-24T19:00', 'date=2026-10-06T12:00'
];
const fetched = new Set<string>(), drawn = new Set<string>(), inDom = new Set<string>(), missing = new Set<string>();
let requests = 0;
const browser = await chromium.launch({ channel: 'chrome' });
for (const q of scenes) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p.on('request', (r) => {
    const u = new URL(r.url());
    if (/\/(art|terrain)\//.test(u.pathname)) (fetched.add(u.pathname.replace(/^\/fitness\//, '')), requests++);
  });
  p.on('response', (r) => {
    const u = new URL(r.url());
    if (r.status() === 404 && /\/(art|room|terrain)\//.test(u.pathname)) missing.add(`${u.pathname.replace(/^\/fitness\//, '')} (${q})`);
  });
  await p.goto(`${base}?demo&${q}`);
  await p.waitForTimeout(6000);
  for (let i = 0; i < 6; i++) {
    await p.mouse.move(196, 600);
    await p.mouse.down();
    await p.mouse.move(196, 200, { steps: 8 });
    await p.mouse.up();
    await p.waitForTimeout(700);
  }
  for (const [x, y] of [[100, 500], [300, 450], [196, 650], [60, 700]]) {
    await p.mouse.click(x, y);
    await p.waitForTimeout(600);
  }
  const got = await p.evaluate(() => {
    const res = { vis: [] as string[], dom: [] as string[] };
    const shown = (el: Element) => {
      for (let e: Element | null = el; e; e = e.parentElement) {
        const c = getComputedStyle(e);
        if (c.display === 'none' || c.visibility === 'hidden' || Number(c.opacity) === 0) return false;
      }
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
    };
    for (const el of document.querySelectorAll('img, [style*="url("]')) {
      const src = el instanceof HTMLImageElement ? el.currentSrc || el.src : /url\("?([^")]+)/.exec(getComputedStyle(el).backgroundImage)?.[1];
      if (!src) continue;
      const path = new URL(src, location.href).pathname.replace(/^\/fitness\//, '');
      if (!/^(art|terrain)\//.test(path)) continue;
      res.dom.push(path);
      if (shown(el)) res.vis.push(path);
    }
    return res;
  });
  got.vis.forEach((x) => drawn.add(x));
  got.dom.forEach((x) => inDom.add(x));
  const r3 = await p.evaluate(() => !!document.querySelector('.scene[data-r3]'));
  console.error(`${q}: ${r3 ? '3D' : 'no 3D (WebGL?)'}, ${fetched.size} fetched so far`);
  await ctx.close();
}
await browser.close();
const engine = [...fetched].filter((x) => !inDom.has(x));
writeFileSync(out, [...new Set([...drawn, ...engine])].sort().join('\n') + '\n');
// (beside it: what was downloaded into the DOM and never seen drawn, the hidden art's wasted downloads)
const wasted = [...fetched].filter((x) => inDom.has(x) && !drawn.has(x)).sort();
writeFileSync(`${out}.wasted`, wasted.join('\n') + '\n');
console.error(`3d: ${fetched.size} fetched (${requests} requests in ${scenes.length} scenes); ${drawn.size} drawn by the DOM, ${engine.length} loaded by the engine, ${wasted.length} downloaded into the DOM but never seen drawn → ${out}`);
console.error(`404s under art/, room/, terrain/: ${missing.size}`);
for (const m of [...missing].sort()) console.error(`  ${m}`);
if (missing.size) process.exitCode = 1;
