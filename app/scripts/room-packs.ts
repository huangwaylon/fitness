// The rooms' packed pieces (docs/world3d-assets.md "Room packs"): every piece, wallpaper and floor past the tent's first
// set (tent/more.json, scripts/room-models.ts) is packed, not a loose file, so static/ stays well under Pages' cap
// (lib/static-budget.ts): the models by their group (more.json's `g`: housewares, misc, model, wall, ceiling, rug,
// gyroid, critter; a group's series together, as rooms are decorated), the wallpapers' and floors' textures and glows,
// and the icons of the tabs browsed a tab at a time (the rugs', the critters', the wallpapers', the floors'), into
// static/room/pack/<group>[-k].<hash>.pak, each at most MAX bytes, split as stably as can be (lib/packPlan.ts: a pack
// whose files didn't change keeps its name and its bytes, so the phones' caches keep it). A pack is ktx2Pack.ts's
// container (its files' paths in its head): the packs are these files' only copy in the repo. Each file's place,
// [pack, offset, bytes], into more.json (`pk`, `tex`, `icons`). Files come from the work folder (.cache/room/, where
// room-models.ts converts them) over the packs as they are; run alone, it packs again what's there.
//   node scripts/room-packs.ts            (room-models.ts runs it at its end)
//   node scripts/room-packs.ts --unpack   (every packed file loose into .cache/room/, as room-models.ts left them)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entries, pack } from '../src/lib/components/world3d/ktx2Pack.ts';
import { planHome } from '../src/lib/packPlan.ts';

const APP = join(import.meta.dirname, '..');
export const PACKS = join(APP, 'static', 'room', 'pack');
const MORE = join(APP, 'src', 'lib', 'components', 'tent', 'more.json');
const HHA = join(APP, 'src', 'lib', 'components', 'tent', 'hha.json');
const WORK = join(APP, '.cache', 'room');
/** A pack's bound (bytes): a room's first piece of a group costs its pack, ~3-4 models' worth (the shop's day of 24 pieces from ~10 groups: 320 KB packs cost it ~3 MB). */
const MAX = 64_000;
/** The icons' packs: a tab's screenful or two. */
const ICON_MAX = 160_000;

type Ref = [string, number, number];
interface More { walls: string[]; floors: string[]; tex: Record<string, Ref>; icons: Record<string, Ref>; items: Record<string, { g?: string; pk?: Ref; rug?: 1; cr?: string }>; [k: string]: unknown }

const sha8 = (b: Uint8Array): string => createHash('sha256').update(b).digest('hex').slice(0, 8);

/** The packs now: stem → its files (path → bytes). */
function readPacks(): Map<string, Map<string, Uint8Array>> {
  const out = new Map<string, Map<string, Uint8Array>>();
  if (!existsSync(PACKS)) return out;
  for (const f of readdirSync(PACKS).filter((f) => f.endsWith('.pak')).sort()) {
    const b = new Uint8Array(readFileSync(join(PACKS, f)));
    const es = entries(b);
    if (!es) throw new Error(`room-packs: ${f} isn't a pack`);
    out.set(f.slice(0, -4), new Map([...es].map(([id, [o, l]]) => [id, b.subarray(o, o + l)])));
  }
  return out;
}

/** Every packed file now (path → bytes). */
function roomFiles(): Map<string, Uint8Array> {
  return new Map([...readPacks().values()].flatMap((m) => [...m]));
}

/** A table as the room's JSON files are written (scripts/room-models.ts writeJson): one entry a line. */
function writeMore(m: More): void {
  const block = (k: string, v: unknown) => ['items', 'tex', 'icons'].includes(k) && v && typeof v === 'object'
    ? `  ${JSON.stringify(k)}: {\n${Object.entries(v as Record<string, unknown>).map(([c, x]) => `    ${JSON.stringify(c)}: ${JSON.stringify(x)}`).join(',\n')}\n  }`
    : `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`;
  writeFileSync(MORE, `{\n${Object.entries(m).map(([k, v]) => block(k, v)).join(',\n')}\n}\n`);
}

export function packRoom(): { packs: number; bytes: number; written: number; removed: number; missing: string[] } {
  const now = readPacks();
  const source = new Map<string, Uint8Array>([...now.values()].flatMap((m) => [...m]));
  for (const d of ['models', 'wall', 'floor', 'icons']) {
    const dir = join(WORK, d);
    if (existsSync(dir)) for (const f of readdirSync(dir)) if (/^[a-z]\d+(\.e)?\.(glb|webp)$/.test(f)) source.set(`${d}/${f}`, new Uint8Array(readFileSync(join(dir, f))));
  }
  const more = JSON.parse(readFileSync(MORE, 'utf8')) as More;
  const series = JSON.parse(readFileSync(HHA, 'utf8')) as Record<string, { s?: string }>;
  const missing: string[] = [];
  const want = (p: string) => (source.has(p) ? true : (missing.push(p), false));

  // the homes: each one's files in its order
  const homes = new Map<string, string[]>();
  const add = (home: string, p: string) => homes.set(home, [...(homes.get(home) ?? []), p]);
  const byGroup = Object.entries(more.items).filter(([, m]) => m.g)
    .sort(([a, x], [b, y]) => (x.g! < y.g! ? -1 : x.g! > y.g! ? 1 : 0) || (series[a]?.s ?? '~').localeCompare(series[b]?.s ?? '~') || Number(a.slice(1)) - Number(b.slice(1)));
  for (const [code, m] of byGroup) {
    if (want(`models/${code}.glb`)) add(`m-${m.g}`, `models/${code}.glb`);
    // (the rugs' and the critters' icons: their tabs'; the rest are loose, static/room/icons)
    if ((m.rug || m.cr) && want(`icons/${code}.webp`)) add(`i-${m.rug ? 'rug' : 'critter'}`, `icons/${code}.webp`);
  }
  for (const [list, kind] of [[more.walls, 'wall'], [more.floors, 'floor']] as const)
    for (const code of list) {
      if (want(`${kind}/${code}.webp`)) add(kind, `${kind}/${code}.webp`);
      if (source.has(`${kind}/${code}.e.webp`)) add(kind, `${kind}/${code}.e.webp`);
      if (want(`icons/${code}.webp`)) add(`i-${kind}`, `icons/${code}.webp`);
    }

  const prev: Record<string, string[]> = {};
  for (const [stem, m] of now) prev[stem.replace(/\.[0-9a-f]{8}$/, '')] = [...m.keys()];
  const places = new Map<string, Ref>(), wanted = new Set<string>();
  let bytes = 0, written = 0;
  mkdirSync(PACKS, { recursive: true });
  for (const [home, paths] of homes) {
    const plan = planHome(home, paths.map((id) => ({ id, bytes: source.get(id)!.length })), home.startsWith('i-') ? ICON_MAX : MAX, prev);
    for (const [name, ids] of plan) {
      const b = pack(ids.map((id) => [id, source.get(id)!]));
      const stem = `${name}.${sha8(b)}`, f = join(PACKS, `${stem}.pak`);
      wanted.add(`${stem}.pak`);
      bytes += b.length;
      if (!existsSync(f)) writeFileSync(f, b), written++;
      for (const [id, [off, len]] of entries(b)!) places.set(id, [stem, off, len]);
    }
  }
  let removed = 0;
  for (const f of readdirSync(PACKS)) if (f.endsWith('.pak') && !wanted.has(f)) rmSync(join(PACKS, f)), removed++;

  // the places into more.json
  for (const [code, m] of Object.entries(more.items)) {
    const at = places.get(`models/${code}.glb`);
    if (at) m.pk = at;
    else delete m.pk;
  }
  // (a wallpaper or floor not converted yet isn't offered)
  more.walls = more.walls.filter((c) => places.has(`wall/${c}.webp`));
  more.floors = more.floors.filter((c) => places.has(`floor/${c}.webp`));
  more.tex = {};
  more.icons = {};
  for (const [p, at] of places) {
    const t = /^(wall|floor)\/([a-z]\d+(?:\.e)?)\.webp$/.exec(p), i = /^icons\/([a-z]\d+)\.webp$/.exec(p);
    if (t) more.tex[t[2]] = at;
    if (i) more.icons[i[1]] = at;
  }
  writeMore(more);
  return { packs: wanted.size, bytes, written, removed, missing };
}

/** Every packed file loose into the work folder. */
function unpackRoom(dir = WORK): number {
  const files = roomFiles();
  for (const [p, b] of files) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), b);
  }
  return files.size;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--unpack')) console.log(`${unpackRoom()} files into ${WORK}`);
  else {
    const r = packRoom();
    console.log(`${r.packs} packs, ${(r.bytes / 1e6).toFixed(2)} MB (${r.written} written, ${r.removed} removed)`);
    if (r.missing.length) console.log(`not converted yet (npm run room-models): ${r.missing.length}: ${r.missing.slice(0, 12).join(' ')}…`);
  }
}
