// トレイル's reference trails (docs/hiking.md "Reference trails"): OpenStreetMap's paths around each Japan trail, from
// Overpass, into static/hiking/net/<slug>.json (lib/hiking/netBuild.ts; ODbL: static/hiking/net/LICENSE). Run by hand
// to refresh (the files are what ships; a trail's track rebuilt since makes its forks stale: net.ts trk):
//   npm run hiking:net [slug …]          every Japan trail, or those named
//   npm run hiking:net -- --save <dir>   also keep each Overpass answer as <dir>/<slug>.json
//   npm run hiking:net -- --from <dir>   read those (a saved answer) in place of the network
// One query a trail: the track's box + 1 km, its paths (path, footway, track, steps, bridleway) and the roads within
// 150 m of the track (the valley approaches), guideposts, peaks, saddles, huts, shelters, and the hiking routes' names.
// overpass-api.de first, overpass.kumi.systems if it fails; each tried 3 times with a wait.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { TRAILS } from '../src/lib/hiking/trails.ts';
import { buildNet, OTHER_KINDS, ROAD_KINDS, ROAD_KEEP_M, simplify, TRAIL_KINDS, type Overpass } from '../src/lib/hiking/netBuild.ts';
import type { TrackFile } from '../src/lib/hiking/types.ts';

const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const WAITS = [0, 10_000, 30_000];
const PAD_M = 1000;

const app = join(import.meta.dirname, '..');
const args = process.argv.slice(2);
const opt = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const from = opt('--from'), save = opt('--save');
const named = args.filter((a, i) => !a.startsWith('--') && !['--from', '--save'].includes(args[i - 1]));
const japan = TRAILS.filter((t) => t.tiles === 'jp' && !t.user).map((t) => t.slug);
const slugs = named.length ? named : japan;
for (const s of slugs) if (!japan.includes(s)) throw new Error(`${s}: not one of the Japan trails (${japan.join(', ')})`);

/** The query: the box of the track + PAD_M, the roads within ROAD_KEEP_M of the track (a ~30 m simplified line). */
function query(t: TrackFile): string {
  const lats = t.pts.map((p) => p[1]), lons = t.pts.map((p) => p[0]);
  const dLat = PAD_M / 111_320, dLon = dLat / Math.cos((lats[0] * Math.PI) / 180);
  const bbox = [Math.min(...lats) - dLat, Math.min(...lons) - dLon, Math.max(...lats) + dLat, Math.max(...lons) + dLon].map((x) => x.toFixed(5)).join(',');
  const k = 111_320 * Math.cos((lats[0] * Math.PI) / 180);
  const line = simplify(t.pts.map((p): [number, number] => [p[0] * k, p[1] * 111_320]), 30).map(([x, y]) => `${(y / 111_320).toFixed(5)},${(x / k).toFixed(5)}`).join(',');
  const re = (ks: readonly string[]) => `"^(${ks.join('|')})$"`;
  return `[out:json][timeout:120];
(
  way[highway~${re([...TRAIL_KINDS, ...OTHER_KINDS])}](${bbox});
  way[highway~${re(ROAD_KINDS)}](around:${ROAD_KEEP_M},${line});
)->.w;
.w out geom;
rel(bw.w)[route=hiking];
out body;
(
  node[information=guidepost](${bbox});
  node[natural~"^(peak|saddle)$"](${bbox});
  nwr[tourism=alpine_hut](${bbox});
  nwr[amenity=shelter](${bbox});
);
out center;`;
}

async function overpass(q: string): Promise<Overpass> {
  let last: unknown;
  for (const url of ENDPOINTS) {
    for (const wait of WAITS) {
      if (wait) await new Promise((r) => setTimeout(r, wait));
      try {
        const res = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: q }), headers: { 'user-agent': 'island-fund hiking-net (by hand, a few queries a year)' } });
        if (res.ok) return (await res.json()) as Overpass;
        last = new Error(`${url}: ${res.status} ${(await res.text()).slice(0, 200)}`);
        if (res.status === 400) throw last;
      } catch (e) {
        last = e;
        if (e instanceof Error && e.message.includes(': 400 ')) throw e;
      }
      console.warn(`  ${String(last)}`);
    }
  }
  throw last;
}

const out = join(app, 'static/hiking/net');
mkdirSync(out, { recursive: true });
for (const slug of slugs) {
  const track = JSON.parse(readFileSync(join(app, 'static/hiking/tracks', `${slug}.json`), 'utf8')) as TrackFile;
  const src = from && join(from, `${slug}.json`);
  if (src && !existsSync(src)) throw new Error(`${src}: no saved answer`);
  const osm = src ? (JSON.parse(readFileSync(src, 'utf8')) as Overpass) : await overpass(query(track));
  if (save && !src) (mkdirSync(save, { recursive: true }), writeFileSync(join(save, `${slug}.json`), JSON.stringify(osm)));
  const day = (osm.osm3s?.timestamp_osm_base ?? new Date().toISOString()).slice(0, 10);
  // the trail's ends by name: the plan's first and last stops, else the name's （A〜B）
  const t = TRAILS.find((x) => x.slug === slug)!, stops = t.plan?.itinerary, ab = /（(.+)〜(.+)）/.exec(t.name.ja ?? '');
  const [start, goal] = stops?.length ? [stops[0].name.ja, stops.at(-1)!.name.ja] : ab ? [ab[1], ab[2]] : [];
  const net = buildNet(osm, track, day, { ...(start ? { start } : {}), ...(goal ? { goal } : {}) });
  const json = JSON.stringify(net) + '\n';
  writeFileSync(join(out, `${slug}.json`), json);
  const gz = gzipSync(json).length;
  console.log(`${slug}: ${osm.elements.length} elements → ${net.lines.length} lines, ${net.lines.reduce((s, l) => s + l.c.length, 0)} points, ${net.forks.length} forks, ${net.pois?.length ?? 0} POIs; ${(json.length / 1024).toFixed(1)} KB, ${(gz / 1024).toFixed(1)} KB gz`);
  for (const f of net.forks) console.log(`  ${f.pass.map((p) => `${(p.at / 1000).toFixed(2)} km`).join(' + ')}: ${f.br.map((b, i) => `${b.deg}° ${b.n ?? '—'}${b.line < 0 ? ' (route)' : ''}${f.pass.some((p) => p.take === i) ? ' ←' : ''}`).join(' | ')}`);
}
