// The saved areas' plans (src/lib/offline/plan.ts) and, with --sample, their tiles' real sizes: up to N tiles a zoom
// per area (or all, --full) fetched politely (OpenFreeMap 4 at a time; USGS and GSI 2, a pause between), never in CI.
// The means it prints (per source and zoom, over every area's tiles) are plan.ts MEAN_BYTES; the totals'
// measured / estimated its DENSITY (the means first, then a second run).
//   node scripts/offline-measure.ts            the plans (tiles per zoom, the estimate)
//   node scripts/offline-measure.ts --sample 40   up to 40 tiles a zoom an area
//   node scripts/offline-measure.ts --full        every tile once (as a save would: ~2,400 tiles, ~5 minutes)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DENSITY, planTrail, planTrip, mb, type Plan } from '../src/lib/offline/plan.ts';
import { TRAILS } from '../src/lib/hiking/trails.ts';
import { nz } from '../src/lib/travel/trips/nz.ts';
import { okinawa } from '../src/lib/travel/trips/okinawa.ts';

const full = process.argv.includes('--full');
const N = full ? Infinity : process.argv.includes('--sample') ? Number(process.argv[process.argv.indexOf('--sample') + 1] ?? 40) : 0;
const areas: { id: string; plan: Plan }[] = [
  { id: 'trip-nz', plan: planTrip(nz) },
  { id: 'trip-okinawa', plan: planTrip(okinawa) },
  ...TRAILS.map((t) => ({ id: `trail-${t.slug}`, plan: planTrail(t.slug, t.tiles, (JSON.parse(readFileSync(join(import.meta.dirname, '..', 'static', 'hiking', 'tracks', `${t.slug}.json`), 'utf8')) as { pts: number[][] }).pts) }))
];

let ofmTemplate = '';
const url = (src: Plan['source'], k: string) => {
  const [z, x, y] = k.split('/');
  if (src === 'usgs') return `https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/${z}/${y}/${x}`;
  if (src === 'gsi') return `https://cyberjapandata.gsi.go.jp/xyz/std/${z}/${x}/${y}.png`;
  return ofmTemplate.replace('{z}', z).replace('{x}', x).replace('{y}', y);
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function sizes(src: Plan['source'], keys: string[]): Promise<number[]> {
  const out: number[] = [];
  const par = src === 'ofm' ? 4 : 2;
  let i = 0;
  await Promise.all(Array.from({ length: par }, async () => {
    while (i < keys.length) {
      const k = keys[i++];
      const res = await fetch(url(src, k), { headers: { referer: 'https://island-fund.pages.dev/' } });
      out.push(res.ok ? (await res.arrayBuffer()).byteLength : 0);
      if (src !== 'ofm') await sleep(150);
    }
  }));
  return out;
}
/** `n` keys spread evenly through `keys`. */
const spread = (keys: string[], n: number) => (keys.length <= n ? keys : Array.from({ length: n }, (_, j) => keys[Math.floor(((j + 0.5) * keys.length) / n)]));

if (N) ofmTemplate = ((await (await fetch('https://tiles.openfreemap.org/planet')).json()) as { tiles: string[] }).tiles[0];
const pooled: Record<string, Record<number, number[]>> = {};
const totals: Record<string, [tiles: number, bytes: number, density: number]> = {};
for (const { id, plan } of areas) {
  let measured = 0;
  const zs = Object.keys(plan.byZoom).map(Number);
  const line: string[] = [];
  for (const z of zs) {
    const keys = plan.tiles.filter((k) => k.startsWith(`${z}/`));
    if (N) {
      const s = await sizes(plan.source, spread(keys, N));
      ((pooled[plan.source] ??= {})[z] ??= []).push(...s);
      const mean = s.reduce((a, b) => a + b, 0) / s.length;
      measured += mean * keys.length;
      line.push(`z${z} ${keys.length}×${Math.round(mean / 100) / 10}KB`);
    } else line.push(`z${z} ${keys.length}`);
  }
  totals[id] = [plan.tiles.length, Math.round(measured), Number((measured / (plan.bytes / (DENSITY[id] ?? 1))).toFixed(3))];
  console.log(`${id.padEnd(22)} ${String(plan.tiles.length).padStart(5)} tiles  est ${mb(plan.bytes).padStart(5)} MB${N ? `  measured ${mb(measured).padStart(5)} MB` : ''}  ${line.join(' ')}`);
}
if (N) console.log(JSON.stringify(totals));
if (N) for (const [src, zs] of Object.entries(pooled)) console.log(src, Object.fromEntries(Object.entries(zs).map(([z, s]) => [z, Math.round(s.reduce((a, b) => a + b, 0) / s.length)])));
