// ききみみ's audio packs (docs/kikimimi.md "Audio", docs/kikimimi-framework.md §6; src/lib/kikimimi/packing.ts): every
// clip in clips.json (and its slow take) into static/audio/listen/<pack>.<hash>.pak, a pack per home (a level, the
// ladders, a unit; the slow takes their home's `-slow` pack), split past 1.2 MB (slow 0.8 MB) as stably as can be (a
// pack whose clips didn't change keeps its bytes, name and hash: packing.ts planHome), packs.json written (each pack's
// hash, its clips' offsets and lengths: compile.ts puts them into the chunks), and the pack files no longer named
// removed. A clip's bytes come from the work folder (.cache/tts/clips/, where the audio script makes them), else
// the pack it's in now, checked against its hash in clips.json (a clip whose bytes can't be found stops it). Then the
// levels are compiled again. Silent: no sound.
//   node scripts/kikimimi-packs.ts          (npm run kikimimi:packs; the audio script runs it at its end)
//   node scripts/kikimimi-packs.ts --unpack (every clip into the work folder: --listen, the words, the beds)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { clipIds } from '../src/lib/kikimimi/bank.ts';
import type { Clip } from '../src/lib/kikimimi/clips.ts';
import { readUnits } from '../src/lib/kikimimi/compile.ts';
import { LADDERS } from '../src/lib/kikimimi/ladders.ts';
import { PACK_MAX, SLOW_PACK_MAX, packFile, planHome, type PackEntry, type Packs } from '../src/lib/kikimimi/packing.ts';
import { joined } from '../src/lib/kikimimi/source.ts';
import { writeLevels } from './kikimimi-levels.ts';
import { writeAtomic } from './tts/tools.ts';

const APP = join(import.meta.dirname, '..');
const KIKI = join(APP, 'src/lib/kikimimi');
/** Where the packs ship. */
export const LISTEN = join(APP, 'static/audio/listen');
export const PACKS_JSON = join(KIKI, 'packs.json');
/** The work folder: the clips as loose m4a files (the audio script makes them here; --unpack fills it). */
export const WORK = join(resolve(process.env.KIKIMIMI_TTS_CACHE ?? join(APP, '.cache/tts')), 'clips');

const sha8 = (b: Buffer): string => createHash('sha256').update(b).digest('hex').slice(0, 8);
const readJson = <T,>(f: string, def: T): T => (existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')) as T) : def);
const fileName = (id: string, slow: boolean) => `${id}${slow ? '-slow' : ''}.m4a`;

/** Each clip's home, in order (the bank's items by level in the bank's order, the ladders' rungs, each unit's own
 *  items in file order): home → ids. */
function homes(clips: Readonly<Record<string, Clip>>): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const add = (home: string, id: string) => {
    if (!clips[id]) return;
    if (!out.has(home)) out.set(home, []);
    out.get(home)!.push(id);
  };
  // the bank for these clips, not the module's BANK (clips.json at import): the audio script packs a waiting set's
  // items in the run that voices them
  const bank = joined(clips);
  for (const lv of [...new Set(bank.map((it) => it.lv))].sort((a, b) => a - b)) for (const it of bank.filter((x) => x.lv === lv)) for (const id of clipIds(it)) add(`lv${lv}`, id);
  for (const l of LADDERS) for (const r of l.rungs) add('ladder', r.id);
  for (const { raw } of readUnits()) {
    const u = raw as { unit: string; items?: { id: string; lines?: unknown[] }[] };
    for (const it of u.items ?? []) for (const id of clipIds(it as never)) add(`u-${u.unit}`, id);
  }
  const homed = new Set([...out.values()].flat());
  const lost = Object.keys(clips).filter((id) => !homed.has(id));
  if (lost.length) throw new Error(`kikimimi-packs: clips with no home (no item, rung or unit): ${lost.join(' ')}`);
  return out;
}

/** The clips' bytes as they are now: the work folder's file where it's this hash, else the slice of its pack. */
function source(packs: Readonly<Packs>) {
  const at = new Map<string, [file: string, offset: number, bytes: number]>();
  for (const [name, e] of Object.entries(packs)) for (const [id, offset, bytes] of e.clips) at.set(fileName(id, !!e.slow), [packFile(name, e), offset, bytes]);
  const open = new Map<string, Buffer>();
  return (id: string, slow: boolean, hash: string): Buffer | null => {
    const f = fileName(id, slow), loose = join(WORK, f);
    if (existsSync(loose)) {
      const b = readFileSync(loose);
      if (sha8(b) === hash) return b;
    }
    const p = at.get(f);
    if (!p || !existsSync(join(LISTEN, p[0]))) return null;
    if (!open.has(p[0])) open.set(p[0], readFileSync(join(LISTEN, p[0])));
    const b = open.get(p[0])!.subarray(p[1], p[1] + p[2]);
    return sha8(b) === hash ? Buffer.from(b) : null;
  };
}

/** The packs written from clips.json (only those whose bytes changed), packs.json, the stale pack files removed. */
export function writePacks(quiet = false): { packs: Packs; written: string[]; removed: string[] } {
  const clips = readJson<Record<string, Clip>>(join(KIKI, 'clips.json'), {});
  const prev = readJson<Packs>(PACKS_JSON, {});
  const bytesOf = source(prev);
  const prevParts = Object.fromEntries(Object.entries(prev).map(([name, e]) => [name, e.clips.map(([id]) => id)]));
  const packs: Packs = {}, bufs = new Map<string, Buffer>();
  const missing: string[] = [];
  for (const slow of [false, true]) {
    for (const [home, all] of homes(clips)) {
      const ids = slow ? all.filter((id) => clips[id].slow) : all;
      if (!ids.length) continue;
      const got = new Map<string, Buffer>();
      for (const id of ids) {
        const b = bytesOf(id, slow, slow ? clips[id].slow! : clips[id].hash);
        if (b) got.set(id, b);
        else missing.push(fileName(id, slow));
      }
      const name = slow ? `${home}-slow` : home;
      const plan = planHome(name, ids.filter((id) => got.has(id)).map((id) => ({ id, bytes: got.get(id)!.length })), slow ? SLOW_PACK_MAX : PACK_MAX, prevParts);
      for (const [part, pids] of plan) {
        if (packs[part]) throw new Error(`kikimimi-packs: two packs named ${part}`);
        const entry: PackEntry = { hash: '', ...(slow && { slow: true as const }), clips: [] };
        let offset = 0;
        for (const id of pids) {
          entry.clips.push([id, offset, got.get(id)!.length]);
          offset += got.get(id)!.length;
        }
        const buf = Buffer.concat(pids.map((id) => got.get(id)!));
        entry.hash = sha8(buf);
        packs[part] = entry;
        bufs.set(part, buf);
      }
    }
  }
  if (missing.length) throw new Error(`kikimimi-packs: no bytes for ${missing.length} clips (neither in ${WORK} at their clips.json hash nor in a pack): ${missing.slice(0, 20).join(' ')}`);
  mkdirSync(LISTEN, { recursive: true });
  const want = new Set(Object.entries(packs).map(([name, e]) => packFile(name, e)));
  const written: string[] = [];
  for (const [name, e] of Object.entries(packs)) {
    const f = packFile(name, e);
    if (existsSync(join(LISTEN, f)) && prev[name]?.hash === e.hash) continue;
    writeAtomic(join(LISTEN, f), bufs.get(name)!);
    written.push(f);
  }
  const removed = readdirSync(LISTEN).filter((f) => !want.has(f));
  for (const f of removed) rmSync(join(LISTEN, f));
  writeAtomic(PACKS_JSON, `{\n${Object.entries(packs).map(([name, e]) => `${JSON.stringify(name)}:${JSON.stringify(e)}`).join(',\n')}\n}\n`);
  if (!quiet) {
    const total = [...bufs.values()].reduce((s, b) => s + b.length, 0);
    console.log(`${Object.keys(packs).length} packs, ${(total / 1e6).toFixed(1)} MB in ${LISTEN}; written ${written.length}${written.length ? `: ${written.join(' ')}` : ''}; removed ${removed.length}`);
  }
  return { packs, written, removed };
}

/** Every clip of clips.json (and its slow take) as a loose file in the work folder (`dir`), from its pack where it's
 *  missing or another hash; returns how many were written. */
export function unpackClips(dir = WORK): number {
  const clips = readJson<Record<string, Clip>>(join(KIKI, 'clips.json'), {});
  const bytesOf = source(readJson<Packs>(PACKS_JSON, {}));
  mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const [id, c] of Object.entries(clips)) {
    for (const [slow, hash] of [[false, c.hash], [true, c.slow]] as const) {
      if (!hash) continue;
      const f = join(dir, fileName(id, slow));
      if (existsSync(f) && sha8(readFileSync(f)) === hash) continue;
      const b = bytesOf(id, slow, hash);
      if (!b) throw new Error(`kikimimi-packs: ${fileName(id, slow)} is in no pack at its hash`);
      writeAtomic(f, b);
      n++;
    }
  }
  return n;
}

if (import.meta.main) {
  if (process.argv.includes('--unpack')) console.log(`${unpackClips()} clips unpacked into ${WORK}`);
  else {
    writePacks();
    writeLevels();
  }
}
