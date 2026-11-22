// トレイル's tracks (docs/hiking.md "Data"): a GPX → one track file a trail, simplified (Douglas–Peucker, ~5 m) with its
// elevation smoothed (lib/contract/hikeTrack.ts toTrack), into static/hiking/tracks/<slug>.json (lib/hiking/load.ts).
//   node scripts/hiking-tracks.ts <the hiking-trails repo's gpx/ dir> [--out <dir under app/>]   the ten (AllTrails GPX)
//   node scripts/hiking-tracks.ts --yamap [--save <dir>] [--out …]                             YAMAP's public activities, live
//   node scripts/hiking-tracks.ts --yamap --from <dir> [--out …]                               the same, offline from the vendored envelopes
//   node scripts/hiking-tracks.ts --yamap-plan <saved page .html> <slug> [--save <dir>] [--out …]  a YAMAP plan
//   node scripts/hiking-tracks.ts --yamap-plan --from <dir> <slug> [--out …]                     the same, offline
// The YAMAP sources are vendored (lib/hiking/yamapData.ts): --save writes each trail's trimmed envelope as
// <dir>/<slug>.json (canonically app/scripts/data/yamap, committed), --from rebuilds from it without the network;
// --save always writes the rebuilt track too, so one run vendors and rebuilds. The activities' ids are the YAMAP
// identity, never in the repo: a live run reads them from app/.env.local (YAMAP_ACTIVITY_<SLUG_IN_CAPS>) or the
// environment, and never prints them. A plan's page is saved by hand (its link is a private value): its trimmed
// envelope keeps the legs and summits only, the page itself never committed. The envelopes' points feed the same
// converter as a GPX (a summit's English name the waypoint: WPT_JA translates).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toTrack } from '../src/lib/contract/hikeTrack.ts';
import { activityGpx, parseYamapEnv, planGpx, trimActivity, trimPlan, type YamapEnv } from '../src/lib/hiking/yamapData.ts';

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

/** The trails from YAMAP activities (yamap.com/activities/<id>): the slug → its id's env var (app/.env.local). */
const YAMAP: Record<string, string> = {
  'akagi-kurobi': 'YAMAP_ACTIVITY_AKAGI_KUROBI',
  utsukushigahara: 'YAMAP_ACTIVITY_UTSUKUSHIGAHARA'
};

const app = join(import.meta.dirname, '..');

/** app/.env.local's KEY=VALUE lines (gitignored; the YAMAP ids live here), under the process environment. Never printed. */
function envLocal(): Record<string, string> {
  const file = join(app, '.env.local');
  const out: Record<string, string> = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*\S)?\s*$/.exec(line);
    if (m && !line.trimStart().startsWith('#')) out[m[1]] = m[2] ?? '';
  }
  return out;
}

/** A slug's activity id from the environment or app/.env.local; the error names the variable, never the value. */
function activityId(slug: string, vars: Record<string, string>): string {
  const name = YAMAP[slug];
  const id = process.env[name] ?? vars[name];
  if (!id || !/^[1-9][0-9]{0,11}$/.test(id)) throw new Error(`${slug}: set ${name} in app/.env.local (the activity's id, never committed)`);
  return id;
}

/** A live activity as its vendored envelope (both API answers, trimmed). */
async function fetchActivity(id: string, saved: string): Promise<YamapEnv> {
  const get = async (path: string): Promise<unknown> => {
    const res = await fetch(`https://api.yamap.com/v3/activities/${id}${path}`);
    if (!res.ok) throw new Error(`YAMAP activity${path || ' meta'}: ${res.status}`);
    return res.json();
  };
  const env = trimActivity(await get(''), await get('/tracks'), saved);
  if (!env) throw new Error('YAMAP activity: an answer not the API’s shape');
  return env;
}

const args = process.argv.slice(2);
const yamap = args.includes('--yamap');
const pi = args.indexOf('--yamap-plan');
const opt = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const from = opt('--from'), save = opt('--save'), out = opt('--out');
if (from && save) {
  console.error('--save and --from are exclusive (a vendored copy refreshes with --save)');
  process.exit(1);
}
const pos = args.filter((a, i) => !a.startsWith('--') && !['--from', '--save', '--out'].includes(args[i - 1]) && i !== pi);
const outDir = join(app, out ?? 'static/hiking/tracks');
if ((!pos.length && !yamap && pi < 0) || (pi >= 0 && (from ? !pos[0] : pos.length < 2))) {
  console.error('usage: node scripts/hiking-tracks.ts <gpx dir> | --yamap | --yamap-plan <saved page .html> <slug> [--save <dir> | --from <dir>] [--out <dir under app/>]');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
if (save) mkdirSync(save, { recursive: true });
const saved = new Date().toISOString().slice(0, 10);
const vars = envLocal();

/** A vendored envelope for a slug, or the error hiking-net gives. */
function readEnv(dir: string, slug: string): YamapEnv {
  const file = join(dir, `${slug}.json`);
  if (!existsSync(file)) throw new Error(`${file}: no saved answer`);
  const env = parseYamapEnv(JSON.parse(readFileSync(file, 'utf8')));
  if (!env) throw new Error(`${file}: not a vendored envelope`);
  return env;
}

type Src = readonly [string, () => Promise<{ gpx?: string; env?: YamapEnv }>];
let sources: Src[];
if (pi >= 0) {
  sources = from
    ? [[pos[0], async () => ({ env: readEnv(from, pos[0]) })]]
    : [[pos[1], async () => ({ env: trimPlan(readFileSync(pos[0], 'utf8'), saved) })]];
} else if (yamap) {
  sources = Object.keys(YAMAP).map((slug): Src => [slug, async () => (from ? { env: readEnv(from, slug) } : { env: await fetchActivity(activityId(slug, vars), saved) })]);
} else {
  sources = Object.entries(FILES).map(([slug, file]): Src => [slug, async () => ({ gpx: readFileSync(join(pos[0], file), 'utf8') })]);
}

for (const [slug, read] of sources) {
  const { env, gpx: file } = await read();
  const gpx = env ? (env.kind === 'activity' ? activityGpx(env) : planGpx(env)) : file!;
  if (env && save) writeFileSync(join(save, `${slug}.json`), JSON.stringify(env) + '\n');
  const t = toTrack(gpx);
  const json = JSON.stringify(t);
  writeFileSync(join(outDir, `${slug}.json`), json + '\n');
  const raw = (gpx.match(/<trkpt\b/g) ?? []).length;
  console.log(`${slug}: ${raw} → ${t.pts.length} points, ${t.wpts.length} waypoints, ${(json.length / 1024).toFixed(1)} KB${env ? (save ? ' (vendored)' : ' (from the envelope)') : ''}`);
}
