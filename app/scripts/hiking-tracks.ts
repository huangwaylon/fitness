// トレイル's tracks (docs/hiking.md "Data"): a GPX → one track file a trail, simplified (Douglas–Peucker, ~5 m) with its
// elevation smoothed (lib/hiking/track.ts toTrack), into static/hiking/tracks/<slug>.json (lib/hiking/load.ts). Two
// sources, each run once (the files are the source now):
//   node scripts/hiking-tracks.ts <the hiking-trails repo's gpx/ dir> [--out <dir under app/>]   the ten (AllTrails GPX)
//   node scripts/hiking-tracks.ts --yamap [--out <dir under app/>]                               YAMAP's public activities
//   node scripts/hiking-tracks.ts --yamap-plan <saved plan page .html> <slug> [--out …]         a YAMAP plan
// A YAMAP activity's track and checkpoints come from its public API (no login: api.yamap.com/v3/activities/<id>/tracks,
// the points' DEM-corrected altitude), turned into a GPX here, its summits the waypoints (their English names: WPT_JA).
// A plan's page is saved by hand (its link is a private value, never in the repo): its __NEXT_DATA__ holds the plan, each
// checkpoint the leg to it (coords and altitudes), its summits the waypoints the same way.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toTrack } from '../src/lib/hiking/track.ts';

/** Each trail's GPX (the old app's trails.js `gpx`). */
const FILES: Record<string, string> = {
  'lake-22': 'Lake_22_Trail.gpx',
  'snow-lake': 'Snow_Lake_Trail.gpx',
  'lake-valhalla': 'Lake_Valhalla_Trail.gpx',
  'talapus-lake': 'Talapus_Lake_Trail.gpx',
  'mount-pilchuck': 'Mount_Pilchuck_Trail.gpx',
  'bridal-veil': 'Bridal_Veil_Falls_and_Lunch_Rock_via_Lake_Serene_Trail.gpx',
  'skyline-loop': 'Skyline_Loop.gpx',
  enchantments: 'The_Enchantments_Traverse.gpx',
  'fuji-yoshida': 'Mt_Fuji_Yoshida.gpx',
  'kinpu-odarumi': 'Mount_Kinpu_Odarumi.gpx'
};

/** The trails from YAMAP activities (yamap.com/activities/<id>). */
const YAMAP: Record<string, number> = {
  'akagi-kurobi': 52529137,
  utsukushigahara: 50325306
};

interface YamapPoint { coord: [number, number]; corrected_altitude: number | null; altitude: number }
interface YamapCheckpoint { landmark: { name_en: string; coord: [number, number]; is_summit: boolean } }

async function yamapGpx(id: number): Promise<string> {
  const get = async <T>(path: string): Promise<T> => {
    const res = await fetch(`https://api.yamap.com/v3/activities/${id}${path}`);
    if (!res.ok) throw new Error(`YAMAP ${id}${path}: ${res.status}`);
    return (await res.json()) as T;
  };
  const { tracks } = await get<{ tracks: { point: YamapPoint }[] }>('/tracks');
  const { activity } = await get<{ activity: { checkpoints: YamapCheckpoint[] } }>('');
  const seen = new Set<string>();
  const wpts = activity.checkpoints
    .map((c) => c.landmark)
    .filter((l) => l.is_summit && !seen.has(l.name_en) && seen.add(l.name_en))
    .map((l) => `<wpt lat="${l.coord[1]}" lon="${l.coord[0]}"><name>${l.name_en}</name></wpt>`);
  const pts = tracks.map(({ point: p }) => `<trkpt lat="${p.coord[1]}" lon="${p.coord[0]}"><ele>${p.corrected_altitude ?? p.altitude}</ele></trkpt>`);
  return `<gpx>${wpts.join('')}<trk><trkseg>${pts.join('')}</trkseg></trk></gpx>`;
}

interface PlanCheckpoint { coords: [number, number][]; altitudes: number[]; landmark: { nameEn: string; coord: [number, number]; isSummit: boolean } | null }

function planGpx(html: string): string {
  const data = /<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s.exec(html)?.[1];
  if (!data) throw new Error('no __NEXT_DATA__ in the saved plan page');
  const { checkpoints } = (JSON.parse(data) as { props: { pageProps: { plan: { checkpoints: PlanCheckpoint[] } } } }).props.pageProps.plan;
  const seen = new Set<string>();
  const wpts = checkpoints
    .map((c) => c.landmark)
    .filter((l) => l?.isSummit && !seen.has(l.nameEn) && seen.add(l.nameEn))
    .map((l) => `<wpt lat="${l!.coord[1]}" lon="${l!.coord[0]}"><name>${l!.nameEn}</name></wpt>`);
  const pts: string[] = [];
  let last = '';
  for (const c of checkpoints)
    c.coords.forEach(([lon, lat], i) => {
      const key = `${lon},${lat}`;
      if (key !== last) pts.push(`<trkpt lat="${lat}" lon="${lon}"><ele>${c.altitudes[i]}</ele></trkpt>`);
      last = key;
    });
  return `<gpx>${wpts.join('')}<trk><trkseg>${pts.join('')}</trkseg></trk></gpx>`;
}

const args = process.argv.slice(2);
const yamap = args.includes('--yamap');
const pi = args.indexOf('--yamap-plan');
const oi = args.indexOf('--out');
const src = args.find((a, i) => !a.startsWith('--') && i !== oi + 1);
const out = join(import.meta.dirname, '..', oi >= 0 ? args[oi + 1] : 'static/hiking/tracks');
if (!src && !yamap) {
  console.error('usage: node scripts/hiking-tracks.ts <gpx dir> | --yamap | --yamap-plan <saved page .html> <slug> [--out <dir under app/>]');
  process.exit(1);
}
mkdirSync(out, { recursive: true });
const sources =
  pi >= 0 ? [[args[pi + 2], async () => planGpx(readFileSync(args[pi + 1], 'utf8'))] as const]
  : yamap ? Object.entries(YAMAP).map(([slug, id]) => [slug, () => yamapGpx(id)] as const)
  : Object.entries(FILES).map(([slug, file]) => [slug, async () => readFileSync(join(src!, file), 'utf8')] as const);
for (const [slug, read] of sources) {
  const gpx = await read();
  const t = toTrack(gpx);
  const json = JSON.stringify(t);
  writeFileSync(join(out, `${slug}.json`), json + '\n');
  const raw = (gpx.match(/<trkpt\b/g) ?? []).length;
  console.log(`${slug}: ${raw} → ${t.pts.length} points, ${t.wpts.length} waypoints, ${(json.length / 1024).toFixed(1)} KB`);
}
