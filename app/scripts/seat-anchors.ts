// The seats' and beds' anchors (villager3d/seats3d.ts; docs/world3d-assets.md "Seats and beds"): where a villager
// sits or lies on each piece NH lets one use, from the converted models' own geometry (the rays down of
// scripts/room-surfaces-page.js, the rules in scripts/room-surfaces.ts seatOf / bedOf), plus OVERRIDES for the odd
// ones. The tent's and the homes' furniture (tent/items.json: `u` s or l, by n) and the island's seats (the park bench,
// the log bench, the log stools, the hammock, the iron garden chair, the beach chair: world3d/assets.json). Writes
// src/lib/components/villager3d/seats3d.json, and the packed pieces' (tent/more.json) into tent/seats-more.json (the
// room's chunk alone loads that: seats3d.json is in the first load).
//   npm run seat-anchors [-- --only=f4039,park-bench]
// Needs Google Chrome (Playwright's channel 'chrome'); reads only the repo's own converted GLBs (static/room/; a packed
// piece's from .cache/room/models: npm run room-packs -- --unpack puts them there).
import { chromium } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { createRequire } from 'node:module';
import { withWebps } from './glb-webp.ts';
import { FIT, bedOf, seatOf, type BedShape, type Fit, type Sample, type SeatShape } from './room-surfaces.ts';
import { innerFloorOf } from './inner-floor.ts';
import { STAND_ISLAND, STAND_ROOM } from './uses-stand.ts';
import { RIDE_ISLAND, RIDE_ROOM } from './uses-ride.ts';
import type { GymUse } from '../src/lib/components/villager3d/poses.ts';

const APP = join(import.meta.dirname, '..');
const ROOM = join(APP, 'static', 'room');
const OUT = join(APP, 'src', 'lib', 'components', 'villager3d', 'seats3d.json');
const OUT_MORE = join(APP, 'src', 'lib', 'components', 'tent', 'seats-more.json');
const WORK = join(APP, '.cache', 'room');
type Item = { w: number; d: number; h: number; u?: 's' | 'l'; n?: number; pk?: unknown };
const table = (f: string) => JSON.parse(readFileSync(join(APP, 'src', 'lib', 'components', 'tent', f), 'utf8')).items as Record<string, Item>;
const ITEMS: Record<string, Item> = { ...table('items.json'), ...table('more.json') };
const ASSETS = JSON.parse(readFileSync(join(APP, 'src', 'lib', 'components', 'world3d', 'assets.json'), 'utf8')) as { keys: Record<string, { m: string; foot?: [number, number] }>; models: Record<string, { max: number[] }> };
const only = (process.argv.find((a) => a.startsWith('--only='))?.slice(7) ?? '').split(',').filter(Boolean);

type Use = GymUse;
type Shape = ((SeatShape | BedShape) & { sway?: 1; use?: Use }) | { k: 'u'; use: Use; x: number; y: number; z: number; yaw: number; fx: number; fz: number; top?: number; rim?: number; upright?: 1; grip?: number };
/** The island's seats: its model, how many sit on it, sat or lain on; `room`: found on the tent's model of the same NH
 *  piece (static/room/models/<code>.glb: the same frame and units), a pack's member being one node of its GLB. */
const ISLAND: Record<string, { key: string; n: number; u: 's' | 'l'; room?: string }> = {
  'park-bench': { key: 'deco/park-bench', n: 2, u: 's' },
  'log-bench': { key: 'deco/log-bench', n: 2, u: 's' },
  'log-stool': { key: 'deco/log-stool', n: 1, u: 's' },
  hammock: { key: 'deco/hammock', n: 1, u: 'l' },
  'iron-chair': { key: 'decor/iron-chair-0', n: 1, u: 's' },
  'beach-chair': { key: 'deco/beach-chair', n: 1, u: 'l' },
  // the gym's weight bench: lain on (its presses: OVERRIDES' use)
  'weight-bench': { key: 'decor/weight-bench-0', n: 1, u: 'l' },
  // the camp goods (キャンプ), the gym's mats and massage chair (the Nook Inc. mat NH's plain one's size: its shape)
  'folding-chair': { key: 'decor/folding-chair-0', n: 1, u: 's', room: 'f13637' },
  'directors-chair': { key: 'decor/directors-chair-0', n: 1, u: 's', room: 'f2020' },
  'outdoor-bench': { key: 'decor/outdoor-bench-0', n: 2, u: 's', room: 'f3947' },
  'camping-cot': { key: 'decor/camping-cot-0', n: 1, u: 'l', room: 'f4081' },
  'sleeping-bag': { key: 'decor/sleeping-bag-0', n: 1, u: 'l', room: 'f1434' },
  'massage-chair': { key: 'decor/massage-chair-0', n: 1, u: 's', room: 'f12339' },
  'lawn-chair': { key: 'decor/lawn-chair-0', n: 1, u: 's', room: 'f1621' }
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
  // (its bar's grip 14 up: each avatar's hands fitted to it, villager3d/poses.ts pullup; got onto from a step behind)
  pullup: { k: 'u', use: 'pullup', x: 0, y: 0, z: -5, yaw: 0, fx: 0, fz: -6, grip: 14 },
  // the speed bag (its bag hung at x 0 out front of its board, z +3.5): punched from in front, facing it
  'speed-bag': { k: 'u', use: 'punch', x: 0, y: 0, z: 8, yaw: Math.PI, fx: 0, fz: 8 },
  // ours (docs/design.md "The gym"): behind the barbell, the kettlebell, the dumbbell (each lying at the middle), facing
  // us, lifted into the hands (benchBar.ts HELD_PROPS), got onto from 6 behind (18u: clear of their footprints on the
  // island's walk grid, layout/seatSpots.test.ts); on the yoga mat's middle, toward its −x end (the flows lie along its
  // length: villager3d/yoga.ts); at the climbing wall's foot, facing its holds (its face at z +1.45, the feet 6.5 out:
  // the island's big heads clear of it; 30 tall, the feet up to `top`: the island's villager stands 27 model units)
  barbell: { k: 'u', use: 'curl', x: 0, y: 0, z: -4.5, yaw: 0, fx: 0, fz: -6 },
  kettlebell: { k: 'u', use: 'swing', x: 0, y: 0, z: -3.6, yaw: 0, fx: 0, fz: -6 },
  dumbbell: { k: 'u', use: 'curl', x: 0, y: 0, z: -3.2, yaw: 0, fx: 0, fz: -6 },
  'yoga-mat': { k: 'u', use: 'yoga', x: -3, y: 0.45, z: 0, yaw: 0, fx: 0, fz: 8 },
  'nook-yoga-mat': { k: 'u', use: 'yoga', x: -3, y: 0.45, z: 0, yaw: 0, fx: 0, fz: 8 },
  'climbing-wall': { k: 'u', use: 'climb', x: 0, y: 0, z: 6.5, yaw: Math.PI, fx: 0, fz: 8, top: 10 },
  ...STAND_ISLAND,
  ...RIDE_ISLAND
};
/** The rooms' pieces used in place (by item code: seats3d.json's tent): the island's gym pieces' own models (the same NH
 *  model, frame and units: USE's spot), ours, the toilet stalls (sat on the bowl, hidden once the door's shut: tent/lid.ts
 *  DOORS) and the exercise mats (a yoga mat's flows). The pull-up stand's bar is 23.8 up, its hook out front at z +2.5:
 *  hung under it facing us, lifted to reach it (a room's villager stands 16, a model unit to a unit). */
const ROOM_USE: Record<string, UseShape> = {
  f290: USE.treadmill,
  f287: USE['exercise-bike'],
  f1598: USE['exercise-ball'],
  f4013: USE['punching-bag'],
  f7653: USE['speed-bag'],
  f7845: { k: 'u', use: 'pullup', x: 0, y: 5.5, z: 2.6, yaw: 0, fx: 0, fz: 8 },
  f4078: { ...USE.barbell, fz: -4.5 },
  f7535: { ...USE.kettlebell, fz: -3.6 },
  f13293: { k: 'u', use: 'ring', x: 0, y: 0, z: -4, yaw: 0, fx: 0, fz: -4 },
  // (a room's villager stands 16: its own foot and reach)
  f4006: { ...USE['climbing-wall'], z: 4, top: 11 },
  f13683: USE['yoga-mat'],
  f14577: USE['nook-yoga-mat'],
  ...Object.fromEntries(['f12386', 'f12387', 'f12388', 'f12389'].map((c) => [c, { k: 'u', use: 'yoga', x: -5, y: 0.1, z: 0, yaw: 0, fx: 0, fz: 14 } as UseShape])),
  // the bathroom stall's bowl (its seat ring's top 3.8 off the rays), no chair of its own: sat on, hidden once its door's shut
  f1235: { k: 'u', use: 'stall', x: 0, y: 3.8, z: -0.8, yaw: 0, fx: 0, fz: 11 },
  ...STAND_ROOM,
  ...RIDE_ROOM
};
/** The baths soaked in (each its inner floor from its own rays: inner-floor.ts), by item code; the island's own kind of
 *  one by its room piece's model. */
const BATHS = ['f1757', 'f4080', 'f7153', 'f13203', 'f14483', 'f4008', 'f3819', 'f5961', 'f14554', 'f1840', 'f1111', 'f4393'];
const ISLAND_BATHS: Record<string, string> = { 'oil-barrel-bathtub': 'f3819' };
/** What the rays get wrong or can't tell, by hand (each bed's head checked by eye, 2026-11-09: NH's at −x but these):
 *  merged over what they found. A hammock sways (its cloth sags in the middle; the lying height is the sag's, a little
 *  under the rim the rays see first); the inflatable sofa's head is at its tall closed end (+x), not its low tip. */
const OVERRIDES: Record<string, Partial<Shape>> = {
  hammock: { sway: 1 },
  'weight-bench': { use: 'press' },
  f1452: { use: 'press' },
  // the portable toilet's seat (room-surfaces.ts FIT: a closed booth, none drawn) is the stall's sit, hidden inside
  f1234: { use: 'stall' },
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
  const room = (rel: string) => [within(ROOM, rel), within(WORK, rel)].find((x) => x && existsSync(x)) ?? null;
  const f = u === '/page.js' ? PAGE : u.startsWith('/three/') ? within(three, u.slice(7)) : u.startsWith('/m/') ? room(u.slice(3)) : null;
  if (!f || !existsSync(f)) return route.fulfill({ status: 404, body: '' });
  // (an island model with its WebPs back in: three's own loader reads them)
  const body = f.endsWith('.glb') ? Buffer.from(withWebps(new Uint8Array(readFileSync(f)), join(ROOM, 'tex'))) : readFileSync(f);
  return route.fulfill({ body, contentType: extname(f) === '.js' ? 'text/javascript' : 'application/octet-stream' });
});
await page.goto('http://room.local/');
await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready);

/** Seats and beds found on their lowest level: the bunk bed's bottom bunk (no ladder climbing), under a canopy, a
 *  parasol, a pod's lid or the bus stop's roof (the rays' first hits are those). */
const LOW = new Set(['f8298', 'f3624', 'f13294', 'f13508', 'f13512']);

const STEP = 0.5;
async function shape(url: string, w: number, d: number, h: number, u: 's' | 'l', n: number, low = false, fit?: Fit): Promise<Shape | null> {
  const s = (await page.evaluate((o) => (window as unknown as { sample: (o: unknown) => Promise<Sample> }).sample(o), { url, W: w * 10, D: d * 10, step: STEP })) as Sample;
  return u === 's' ? seatOf(s, w, d, STEP, n, low, fit) : bedOf(s, w, d, STEP, n, h, low, fit);
}

const prev = existsSync(OUT) ? (JSON.parse(readFileSync(OUT, 'utf8')) as { tent: Record<string, Shape>; island: Record<string, Shape> }) : { tent: {}, island: {} };
const prevMore = existsSync(OUT_MORE) ? (JSON.parse(readFileSync(OUT_MORE, 'utf8')) as { tent: Record<string, Shape> }).tent : {};
const out = { tent: { ...prev.tent, ...prevMore }, island: { ...prev.island } };
const want = (k: string) => !only.length || only.includes(k);
for (const [code, m] of Object.entries(ITEMS)) {
  if (!m.u || !want(code)) continue;
  const sh = await shape(`/m/models/${code}.glb`, m.w, m.d, m.h, m.u, Math.max(1, m.n ?? 1), LOW.has(code), FIT[code]);
  if (sh) out.tent[code] = { ...sh, ...OVERRIDES[code] } as Shape;
  else delete out.tent[code];
  console.log(code, JSON.stringify(out.tent[code] ?? 'none'));
}
for (const [model, it] of Object.entries(ISLAND)) {
  if (!want(model)) continue;
  // (a pack's member has no key in assets.json, made at load: its tent piece's footprint and height)
  const r = it.room ? ITEMS[it.room] : null, a = ASSETS.keys[it.key];
  const [w, d] = r ? [r.w, r.d] : (a.foot ?? [1, 1]), h = r ? r.h : ASSETS.models[a.m].max[1];
  const sh = await shape(r ? `/m/models/${it.room}.glb` : `/m/world3d/${a.m}.glb`, w, d, h, it.u, it.n);
  if (sh) out.island[model] = { ...sh, ...OVERRIDES[model] } as Shape;
  console.log(model, JSON.stringify(out.island[model] ?? 'none'));
}
for (const [model, sh] of Object.entries(USE)) if (want(model)) out.island[model] = { ...sh, yaw: Math.round(sh.yaw * 1e4) / 1e4 } as Shape;
for (const [code, sh] of Object.entries(ROOM_USE)) if (want(code)) out.tent[code] = { ...sh, yaw: Math.round(sh.yaw * 1e4) / 1e4 } as Shape;
/** A bath's soak from its model's rays (the same grid as the seats'), or null: no basin found. */
async function soakOf(code: string): Promise<UseShape | null> {
  const m = ITEMS[code], url = `/m/models/${code}.glb`;
  const s = (await page.evaluate((o) => (window as unknown as { sample: (o: unknown) => Promise<Sample> }).sample(o), { url, W: m.w * 10, D: m.d * 10, step: STEP })) as Sample;
  const f = innerFloorOf(s, m.w, m.d, STEP);
  return f ? { k: 'u', use: 'soak', ...f, yaw: Math.round(f.yaw * 1e4) / 1e4 } : null;
}
for (const code of BATHS) if (want(code)) {
  const sh = await soakOf(code);
  if (sh) out.tent[code] = sh;
  console.log(code, JSON.stringify(sh ?? 'none'));
}
for (const [model, code] of Object.entries(ISLAND_BATHS)) if (want(model)) {
  const sh = await soakOf(code);
  if (sh) out.island[model] = sh;
}
await browser.close();
const sorted = (o: Record<string, Shape>) => Object.keys(o).sort().map((k) => `    ${JSON.stringify(k)}: ${JSON.stringify(o[k])}`).join(',\n');
// (a piece used in place stays in the first file, packed or not: the island's outdoor pieces and the rooms read it there)
const pick = (packed: boolean) => Object.fromEntries(Object.entries(out.tent).filter(([c, sh]) => ITEMS[c] && (sh.k === 'u' ? !packed : !!ITEMS[c].pk === packed)));
writeFileSync(OUT, `{\n  "_": "scripts/seat-anchors.ts (npm run seat-anchors): each seat's and bed's shape in its model's own frame (model units, +z its front)",\n  "tent": {\n${sorted(pick(false))}\n  },\n  "island": {\n${sorted(out.island)}\n  }\n}\n`);
writeFileSync(OUT_MORE, `{\n  "_": "scripts/seat-anchors.ts: the packed pieces' seats and beds (tent/more.json), as villager3d/seats3d.json's tent",\n  "tent": {\n${sorted(pick(true))}\n  }\n}\n`);
