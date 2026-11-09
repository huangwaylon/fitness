// The players' parts into packs (components/player3d/packing.ts; docs/world3d-assets.md "Players"): every file the
// whole part table names (static/room/player/parts.json) and the KTX2 beside each texture the bundled table lists
// (world3d/texHash.ts looseTextures) into static/room/player/<home>.<hash>.pak, a pack per home split past its bound
// (packing.ts homeMax) as stably as can be; each file's place written into both tables (`at`, a KTX2's `k`; `packs`,
// `everyday`), the bundled one's `full.v` with them; the packs no longer named removed. A file's bytes come from
// `--from <dir>` (loose, as scripts/players3d-models.ts writes them), else the packs as they are now (a pack's head
// names its files): run alone it packs again what's there (nothing changes when nothing did). The packs are the parts'
// only copy in the repo; --unpack writes every file loose into .cache/player/ (or a dir given), the tree
// players3d-models.ts writes.
//   node scripts/player-packs.ts [--from <dir>]       (npm run player:packs; players3d-models.ts and world3d-ktx2.ts
//   node scripts/player-packs.ts --unpack [<dir>]      run it at their end)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entries, pack } from '../src/lib/components/world3d/ktx2Pack.ts';
import { looseTextures } from '../src/lib/components/world3d/texHash.ts';
import { homeMax, homes, packFile, placeTable, tableFiles } from '../src/lib/components/player3d/packing.ts';
import type { PartTable } from '../src/lib/components/player3d/parts.ts';
import { planHome } from '../src/lib/packPlan.ts';

const APP = join(import.meta.dirname, '..');
/** Where the packs ship, and the whole table beside them. */
export const PLAYER = join(APP, 'static', 'room', 'player');
export const TABLE = join(APP, 'src', 'lib', 'components', 'player3d', 'parts.json');
/** The loose files' work folder (gitignored): --unpack's, players3d-models.ts's. */
export const WORK = join(APP, '.cache', 'player');

const sha8 = (b: Uint8Array): string => createHash('sha256').update(b).digest('hex').slice(0, 8);
const readJson = <T,>(f: string): T => JSON.parse(readFileSync(f, 'utf8')) as T;

/** A part table as players3d-models.ts writes it (one entry a line: a diff shows what changed). */
export function writeTable(f: string, t: Record<string, unknown>): void {
  const block = (v: unknown) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length > 3
    ? `{\n${Object.entries(v).map(([k, x]) => `  ${JSON.stringify(k)}: ${JSON.stringify(x)}`).join(',\n')}\n }` : JSON.stringify(v);
  writeFileSync(f, `{\n${Object.entries(t).map(([k, v]) => ` ${JSON.stringify(k)}: ${block(v)}`).join(',\n')}\n}\n`);
}

/** The packs in `dir`: stem → its files (path → bytes, in pack order). */
function readPacks(dir: string): Map<string, Map<string, Uint8Array>> {
  const out = new Map<string, Map<string, Uint8Array>>();
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.pak')).sort()) {
    const b = new Uint8Array(readFileSync(join(dir, f)));
    const es = entries(b);
    if (!es) throw new Error(`player-packs: ${f} isn't a pack`);
    out.set(f.slice(0, -4), new Map([...es].map(([id, [o, l]]) => [id, b.subarray(o, o + l)])));
  }
  return out;
}

/** Every packed file now (path → bytes). */
export function playerFiles(dir = PLAYER): Map<string, Uint8Array> {
  return new Map([...readPacks(dir).values()].flatMap((m) => [...m]));
}

const walk = (d: string, base = d): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f), base) : [join(d, f).slice(base.length + 1)]));

/** Packs the parts (see the head): `from` a folder of loose files, `extra` files over everything (world3d-ktx2.ts's
 *  KTX2s). Returns what it wrote. */
export function packPlayer(o: { from?: string; extra?: ReadonlyMap<string, Uint8Array> } = {}): { packs: number; bytes: number; written: number; removed: number } {
  const now = readPacks(PLAYER);
  const source = new Map<string, Uint8Array>([...now.values()].flatMap((m) => [...m]));
  if (o.from) for (const p of walk(o.from)) if (/\.(glb|webp|ktx2)$/.test(p)) source.set(p, new Uint8Array(readFileSync(join(o.from, p))));
  for (const [p, b] of o.extra ?? []) source.set(p, b);
  const fullPath = o.from && existsSync(join(o.from, 'parts.json')) ? join(o.from, 'parts.json') : join(PLAYER, 'parts.json');
  const whole = readJson<PartTable & Record<string, unknown>>(fullPath), bundled = readJson<PartTable & Record<string, unknown>>(TABLE);
  // the KTX2s wanted: the bundled table's textures' (world3d-ktx2.ts encodes them)
  const homesJson = readJson<Parameters<typeof looseTextures>[0]>(join(APP, 'src', 'lib', 'layout', 'homes.json'));
  const structures = readJson<Parameters<typeof looseTextures>[1]>(join(APP, 'src', 'lib', 'layout', 'structures.json'));
  const ktx2 = new Set(looseTextures(homesJson, structures, bundled as never).filter((l) => l.path.startsWith('player/')).map((l) => l.out.slice(7)));
  const missing = tableFiles(whole).map((f) => f.path).filter((p) => !source.has(p));
  if (missing.length) throw new Error(`player-packs: ${missing.length} files the table names aren't there: ${missing.slice(0, 8).join(' ')}…`);
  const has = (p: string) => source.has(p) && (!p.endsWith('.ktx2') || ktx2.has(p));

  // the last plan: each pack's name (its stem less its hash) → its files
  const prev: Record<string, string[]> = {};
  for (const [stem, m] of now) prev[stem.replace(/\.[0-9a-f]{8}$/, '')] = [...m.keys()];
  const places = new Map<string, readonly [string, number, number]>(), want = new Set<string>();
  let bytes = 0, written = 0;
  mkdirSync(PLAYER, { recursive: true });
  for (const [home, paths] of homes(whole, new Set(Object.keys(bundled.items)), has)) {
    const plan = planHome(home, paths.map((id) => ({ id, bytes: source.get(id)!.length })), homeMax(home), prev);
    for (const [name, ids] of plan) {
      const b = pack(ids.map((id) => [id, source.get(id)!]));
      const stem = `${name}.${sha8(b)}`, f = join(PLAYER, packFile(stem));
      want.add(packFile(stem));
      bytes += b.length;
      if (!existsSync(f)) writeFileSync(f, b), written++;
      for (const [id, [off, len]] of entries(b)!) places.set(id, [stem, off, len]);
    }
  }
  let removed = 0;
  for (const f of readdirSync(PLAYER)) if (f.endsWith('.pak') && !want.has(f)) rmSync(join(PLAYER, f)), removed++;

  const W = placeTable(whole, places) as PartTable & Record<string, unknown>;
  const FULL = join(PLAYER, 'parts.json');
  writeTable(FULL, W);
  const B = placeTable(bundled, places) as PartTable & Record<string, unknown>;
  B.full = { v: sha8(readFileSync(FULL)), items: Object.keys(W.items).length };
  // (the bundled table's keys in their order, `packs` and `everyday` after `full`)
  writeTable(TABLE, B);
  return { packs: want.size, bytes, written, removed };
}

/** Every packed file loose into `dir`, and the whole table beside them. */
export function unpackPlayer(dir = WORK): number {
  const files = playerFiles();
  for (const [p, b] of files) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), b);
  }
  writeFileSync(join(dir, 'parts.json'), readFileSync(join(PLAYER, 'parts.json')));
  return files.size;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args[0] === '--unpack') {
    const dir = resolve(args[1] ?? WORK);
    console.log(`${unpackPlayer(dir)} files into ${dir}`);
  } else {
    const i = args.indexOf('--from');
    const r = packPlayer(i >= 0 ? { from: resolve(args[i + 1]) } : {});
    console.log(`${r.packs} packs, ${(r.bytes / 1e6).toFixed(2)} MB (${r.written} written, ${r.removed} removed)`);
  }
}
