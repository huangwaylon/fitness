// トレイル's tracks (docs/hiking.md "Data"): the hiking-trails app's GPX files (AllTrails exports) → one track file a
// trail, simplified (Douglas–Peucker, ~5 m) with its elevation smoothed (lib/hiking/track.ts toTrack). They go to the
// gitignored app/hiking-local/ (loaded in dev: lib/hiking/load.ts) until the user decides they may be committed; then
// `--out static/travel/hiking/tracks` writes them where the app looks in production.
//   node scripts/hiking-tracks.ts <the hiking-trails repo's gpx/ dir> [--out hiking-local]
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

const args = process.argv.slice(2);
const src = args.find((a) => !a.startsWith('--'));
const oi = args.indexOf('--out');
const out = join(import.meta.dirname, '..', oi >= 0 ? args[oi + 1] : 'hiking-local');
if (!src) {
  console.error('usage: node scripts/hiking-tracks.ts <gpx dir> [--out <dir under app/>]');
  process.exit(1);
}
mkdirSync(out, { recursive: true });
for (const [slug, file] of Object.entries(FILES)) {
  const gpx = readFileSync(join(src, file), 'utf8');
  const t = toTrack(gpx);
  const json = JSON.stringify(t);
  writeFileSync(join(out, `${slug}.json`), json + '\n');
  const raw = (gpx.match(/<trkpt\b/g) ?? []).length;
  console.log(`${slug}: ${raw} → ${t.pts.length} points, ${t.wpts.length} waypoints, ${(json.length / 1024).toFixed(1)} KB`);
}
