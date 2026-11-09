// The seats' and beds' anchors (villager3d/seats3d.ts; docs/world3d-assets.md "Seats and beds"): where a villager
// sits or lies on each piece NH lets one use, from the converted models' own geometry (the rays down of
// scripts/room-surfaces-page.js, the rules in scripts/room-surfaces.ts seatOf / bedOf), plus OVERRIDES for the odd
// ones. The tent's and the homes' furniture (tent/items.json: `u` s or l, by n) and the island's seats (the park bench,
// the log bench, the log stools, the hammock, the iron garden chair, the beach chair: world3d/assets.json). Writes
// src/lib/components/villager3d/seats3d.json.
//   npm run seat-anchors [-- --only=f4039,park-bench]
// Needs Google Chrome (Playwright's channel 'chrome'); reads only the repo's own converted GLBs (static/room/).
import { chromium } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { createRequire } from 'node:module';
import { bedOf, seatOf, type BedShape, type Sample, type SeatShape } from './room-surfaces.ts';

const APP = join(import.meta.dirname, '..');
const ROOM = join(APP, 'static', 'room');
const OUT = join(APP, 'src', 'lib', 'components', 'villager3d', 'seats3d.json');
const ITEMS = JSON.parse(readFileSync(join(APP, 'src', 'lib', 'components', 'tent', 'items.json'), 'utf8')).items as Record<string, { w: number; d: number; h: number; u?: 's' | 'l'; n?: number }>;
const ASSETS = JSON.parse(readFileSync(join(APP, 'src', 'lib', 'components', 'world3d', 'assets.json'), 'utf8')) as { keys: Record<string, { m: string; foot?: [number, number] }>; models: Record<string, { max: number[] }> };
const only = (process.argv.find((a) => a.startsWith('--only='))?.slice(7) ?? '').split(',').filter(Boolean);

type Use = 'press' | 'pedal' | 'run' | 'punch' | 'bounce' | 'pullup';
type Shape = ((SeatShape | BedShape) & { sway?: 1; use?: Use }) | { k: 'u'; use: Use; x: number; y: number; z: number; yaw: number; fx: number; fz: number };
/** The island's seats: its model, how many sit on it, sat or lain on. */
const ISLAND: Record<string, { key: string; n: number; u: 's' | 'l' }> = {
  'park-bench': { key: 'deco/park-bench', n: 2, u: 's' },
  'log-bench': { key: 'deco/log-bench', n: 2, u: 's' },
  'log-stool': { key: 'deco/log-stool', n: 1, u: 's' },
  hammock: { key: 'deco/hammock', n: 1, u: 'l' },
  'iron-chair': { key: 'decor/iron-chair-0', n: 1, u: 's' },
  'beach-chair': { key: 'deco/beach-chair', n: 1, u: 'l' },
  // the gym's weight bench: lain on (its presses: OVERRIDES' use)
  'weight-bench': { key: 'decor/weight-bench-0', n: 1, u: 'l' }
};
/** The gym's pieces used in place (seats3d.ts's `u`: no seat or bed the rays could find), by hand from their models
 *  (model units, +z their front, the bounds in world3d/assets.json): where the feet (standing) or the hips (seated) go,
 *  which way it faces, and where one gets on from. The bike's saddle (its top 9 up, at +x; the console at −x: it rides
 *  facing −x), the ball's top, the treadmill's belt (1.2 up, the console at −x: it runs facing −x), beside the bag
 *  (hung at x −0.5, z +2: a punch from its left, side on to the camera), behind the pull-up bar (its bar 14 up at z
 *  −1.5: under it, facing us, world.ts PULLUP_AT's 15u behind the stand's middle). */
type UseShape = Extract<Shape, { k: 'u' }>;
const USE: Record<string, UseShape> = {
  'exercise-bike': { k: 'u', use: 'pedal', x: 3.3, y: 9, z: 0, yaw: -Math.PI / 2, fx: 3, fz: 8 },
  'exercise-ball': { k: 'u', use: 'bounce', x: 0, y: 7.6, z: 0, yaw: 0, fx: 0, fz: 8 },
  treadmill: { k: 'u', use: 'run', x: 1.5, y: 1.2, z: 0, yaw: -Math.PI / 2, fx: 1.5, fz: 8 },
  'punching-bag': { k: 'u', use: 'punch', x: -8, y: 0, z: 2, yaw: Math.PI / 2, fx: -8, fz: 2 },
  pullup: { k: 'u', use: 'pullup', x: 0, y: 0, z: -5, yaw: 0, fx: 0, fz: -5 }
};
/** What the rays get wrong or can't tell, by hand (each bed's head checked by eye, 2026-11-09: NH's at −x but these):
 *  merged over what they found. A hammock sways (its cloth sags in the middle; the lying height is the sag's, a little
 *  under the rim the rays see first); the inflatable sofa's head is at its tall closed end (+x), not its low tip. */
const OVERRIDES: Record<string, Partial<Shape>> = {
  hammock: { sway: 1 },
  'weight-bench': { use: 'press' },
  f1620: { sway: 1 },
  f3962: { head: 1 }
};

const three = join(dirname(createRequire(import.meta.url).resolve('three')), '..');
const PAGE = join(import.meta.dirname, 'room-surfaces-page.js');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('[page]', e.message));
await page.route('http://room.local/**', (route) => {
  const u = decodeURIComponent(new URL(route.request().url()).pathname);
  const within = (root: string, rel: string) => {
    const f = resolve(root, rel);
    return f.startsWith(root + sep) ? f : null;
  };
  if (u === '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><script type="module" src="/page.js"></script>' });
  const f = u === '/page.js' ? PAGE : u.startsWith('/three/') ? within(three, u.slice(7)) : u.startsWith('/m/') ? within(ROOM, u.slice(3)) : null;
  if (!f || !existsSync(f)) return route.fulfill({ status: 404, body: '' });
  return route.fulfill({ body: readFileSync(f), contentType: extname(f) === '.js' ? 'text/javascript' : 'application/octet-stream' });
});
await page.goto('http://room.local/');
await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready);

/** Seats and beds found on their lowest level: the bunk bed's bottom bunk (no ladder climbing), under a canopy, a
 *  parasol, a pod's lid or the bus stop's roof (the rays' first hits are those). */
const LOW = new Set(['f8298', 'f3624', 'f13294', 'f13508', 'f13512']);

const STEP = 0.5;
async function shape(url: string, w: number, d: number, h: number, u: 's' | 'l', n: number, low = false): Promise<Shape | null> {
  const s = (await page.evaluate((o) => (window as unknown as { sample: (o: unknown) => Promise<Sample> }).sample(o), { url, W: w * 10, D: d * 10, step: STEP })) as Sample;
  return u === 's' ? seatOf(s, w, d, STEP, n, low) : bedOf(s, w, d, STEP, n, h, low);
}

const prev = existsSync(OUT) ? (JSON.parse(readFileSync(OUT, 'utf8')) as { tent: Record<string, Shape>; island: Record<string, Shape> }) : { tent: {}, island: {} };
const out = { tent: { ...prev.tent }, island: { ...prev.island } };
const want = (k: string) => !only.length || only.includes(k);
for (const [code, m] of Object.entries(ITEMS)) {
  if (!m.u || !want(code)) continue;
  const sh = await shape(`/m/models/${code}.glb`, m.w, m.d, m.h, m.u, Math.max(1, m.n ?? 1), LOW.has(code));
  if (sh) out.tent[code] = { ...sh, ...OVERRIDES[code] } as Shape;
  else delete out.tent[code];
  console.log(code, JSON.stringify(out.tent[code] ?? 'none'));
}
for (const [model, it] of Object.entries(ISLAND)) {
  if (!want(model)) continue;
  const a = ASSETS.keys[it.key], [w, d] = a.foot ?? [1, 1], h = ASSETS.models[a.m].max[1];
  const sh = await shape(`/m/world3d/${a.m}.glb`, w, d, h, it.u, it.n);
  if (sh) out.island[model] = { ...sh, ...OVERRIDES[model] } as Shape;
  console.log(model, JSON.stringify(out.island[model] ?? 'none'));
}
for (const [model, sh] of Object.entries(USE)) if (want(model)) out.island[model] = { ...sh, yaw: Math.round(sh.yaw * 1e4) / 1e4 } as Shape;
await browser.close();
const sorted = (o: Record<string, Shape>) => Object.keys(o).sort().map((k) => `    ${JSON.stringify(k)}: ${JSON.stringify(o[k])}`).join(',\n');
writeFileSync(OUT, `{\n  "_": "scripts/seat-anchors.ts (npm run seat-anchors): each seat's and bed's shape in its model's own frame (model units, +z its front)",\n  "tent": {\n${sorted(out.tent)}\n  },\n  "island": {\n${sorted(out.island)}\n  }\n}\n`);
