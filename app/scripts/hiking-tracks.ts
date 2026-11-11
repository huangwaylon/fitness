// トレイル's tracks (docs/hiking.md "Data"): a GPX → one track file a trail, simplified (Douglas–Peucker, ~5 m) with its
// elevation smoothed (lib/hiking/track.ts toTrack), into static/hiking/tracks/<slug>.json (lib/hiking/load.ts). Two
// sources, each run once (the files are the source now):
//   node scripts/hiking-tracks.ts <the hiking-trails repo's gpx/ dir> [--out <dir under app/>]   the ten (AllTrails GPX)
//   node scripts/hiking-tracks.ts --yamap [--out <dir under app/>]                               YAMAP's public activities
// A YAMAP activity's track and checkpoints come from its public API (no login: api.yamap.com/v3/activities/<id>/tracks,
// the points' DEM-corrected altitude), turned into a GPX here, its summits the waypoints (their English names: WPT_JA).
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

const args = process.argv.slice(2);
const yamap = args.includes('--yamap');
const oi = args.indexOf('--out');
const src = args.find((a, i) => !a.startsWith('--') && i !== oi + 1);
const out = join(import.meta.dirname, '..', oi >= 0 ? args[oi + 1] : 'static/hiking/tracks');
if (!src && !yamap) {
  console.error('usage: node scripts/hiking-tracks.ts <gpx dir> | --yamap [--out <dir under app/>]');
  process.exit(1);
}
mkdirSync(out, { recursive: true });
const sources = yamap ? Object.entries(YAMAP).map(([slug, id]) => [slug, () => yamapGpx(id)] as const) : Object.entries(FILES).map(([slug, file]) => [slug, async () => readFileSync(join(src!, file), 'utf8')] as const);
for (const [slug, read] of sources) {
  const gpx = await read();
  const t = toTrack(gpx);
  const json = JSON.stringify(t);
  writeFileSync(join(out, `${slug}.json`), json + '\n');
  const raw = (gpx.match(/<trkpt\b/g) ?? []).length;
  console.log(`${slug}: ${raw} → ${t.pts.length} points, ${t.wpts.length} waypoints, ${(json.length / 1024).toFixed(1)} KB`);
}
