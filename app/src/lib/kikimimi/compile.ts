// ききみみ クイズ's compiler (docs/kikimimi.md "Loading"): source.ts's items, ladders.ts's ladders, clips.json and
// words.json into levels/, which the sheet loads a level at a time (pool.ts): a chunk per level (its items in the bank's
// order, their clips and word timings; a level past the budget split, in order, into parts), the ladders' chunk, and
// the index the sheet opens with (each level's parts, count and content version; the gates; the sound check's clip;
// every item's id, level, type, accent and tags for きろく; the rungs' ids). `npm run kikimimi:levels` writes them (the
// audio scripts too, at their end); levels.test fails while the committed files differ. Node and tests only.
//   The units (docs/curriculum-units.md §8, units.ts) extend it, with no second loader: each manifest in
// app/content/units/ is checked against the bank and becomes a chunk of its own (`parts/u-<id>.json`: the unit, its
// lessons' items as authored, their clips and timings) and an entry in the index (`units[<id>]` beside the levels',
// and a line in `paths`, the island path's). The levels' chunks and decks don't change for any unit (units.test).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { parse } from 'yaml';
import { QUIZ_LVS } from '../contract/live-protocol.ts';
import { clipIds, isDialogue, type Item, type Level } from './bank.ts';
import type { ChunkClip, Clip, Words } from './clips.ts';
import { voiced } from './clips.ts';
import type { Ladder } from './ladder.ts';
import type { UnitPlay } from './lesson.ts';
import { LADDERS, ladderReady } from './ladders.ts';
import { drawn, mixFor, type Mixes } from './mix.ts';
import { clipPlaces, type PackRef, type Packs } from './packing.ts';
import type { Index, PathEntry } from './pool.ts';
import { joined } from './source.ts';
import { tagsOf } from './tags.ts';
import { LESSONS, candoText, checkUnits, lessonIds, manifestOf, type UnitManifest, type UnitsCheck } from './units.ts';

/** A unit's chunk's budget (gzipped; plan §8). */
export const UNIT_MAX = 20 * 1024;

/** A unit's manifest as read: its file's name and its parsed YAML. */
export interface UnitSource {
  file: string;
  raw: unknown;
}

const UNITS_DIR = new URL('../../../content/units/', import.meta.url);

/** app/content/units/*.yaml, parsed, by file name (no directory: an empty list). */
export function readUnits(dir: URL = UNITS_DIR): UnitSource[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort().map((file) => ({ file, raw: parse(readFileSync(new URL(file, dir), 'utf8')) }));
}

/** The units' own items (inline in their manifests, as authored), in file order: the audio scripts voice them beside
 *  the bank's (their ids are checked against the bank's and each other's: checkUnits). */
export function unitItems(sources: readonly UnitSource[] = readUnits()): Item[] {
  return sources.flatMap(({ raw }) => ((raw as { items?: unknown }).items as Item[] | undefined) ?? []);
}

/** The units read and checked (units.ts: each manifest, then all of them against the bank, the ladders and the
 *  clips): the manifests that read, and the problems (errors stop the compiler; warnings are printed). */
export function checkUnitSources(sources: readonly UnitSource[], clips: Readonly<Record<string, unknown>>, bank: readonly Item[] = joined(clips)): UnitsCheck & { units: UnitManifest[] } {
  const units: UnitManifest[] = [], errors: string[] = [];
  for (const { file, raw } of sources) {
    const m = manifestOf(raw, file);
    errors.push(...m.errors);
    if (m.unit) units.push(m.unit);
  }
  const all = checkUnits(units, bank, LADDERS, clips);
  return { ...all, errors: [...errors, ...all.errors], units };
}

const PACKS_JSON = new URL('./packs.json', import.meta.url);

/** packs.json (scripts/kikimimi-packs.ts): each audio pack's hash and its clips' offsets and lengths. */
export function readPacks(file: URL = PACKS_JSON): Packs {
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Packs) : {};
}

/** Where each clip is: its pack and its slow pack (packing.ts clipPlaces). */
type Places = ReturnType<typeof clipPlaces>;

/** These clips as a chunk carries them (clips.ts ChunkClip): the packs they're in (stems, in first use) and each
 *  clip's length (cs), hash, and pack, offset and bytes (then its slow take's). A clip with no pack stops it. */
function chunkClips(ids: readonly string[], clips: Readonly<Record<string, Clip>>, places: Places): { packs: string[]; clips: Record<string, ChunkClip> } {
  const packs: string[] = [];
  const ix = (r: PackRef) => {
    let k = packs.indexOf(r[0]);
    if (k < 0) k = packs.push(r[0]) - 1;
    return [k, r[1], r[2]] as const;
  };
  const out: Record<string, ChunkClip> = {};
  for (const id of ids) {
    const c = clips[id];
    if (!c) continue;
    const at = places.normal.get(id), slow = c.slow ? places.slow.get(id) : undefined;
    if (!at || (c.slow && !slow)) throw new Error(`kikimimi: clip ${id}${at ? "'s slow take" : ''} is in no pack (npm run kikimimi:packs)`);
    out[id] = [Math.round(c.dur * 100), c.hash, ...ix(at), ...(slow ? ix(slow) : [])] as ChunkClip;
  }
  return { packs, clips: out };
}

/** A chunk's budget (gzipped, as built: scripts/kikimimi-budget.ts checks the build's). */
export const PART_MAX = 60 * 1024;
/** A level is split into parts of at most this (gzipped JSON: the chunk Vite makes of it is a little bigger). */
const PART_AIM = 54 * 1024;

const gz = (s: string): number => gzipSync(s).length;

/** Whether every level-4 dialogue is voiced (each line's clip). */
const dialoguesVoiced = (clips: Readonly<Record<string, unknown>>, bank: readonly Item[]): boolean =>
  bank.filter((it) => it.lv === 4 && isDialogue(it)).every((it) => voiced(it, clips));

/** The mixes for a set of clips: level 4 takes dialogues only once every level-4 dialogue is voiced. */
export const mixes = (clips: Readonly<Record<string, unknown>>, bank: readonly Item[] = joined(clips)): Mixes => mixFor(dialoguesVoiced(clips, bank));

/** The levels a phone offers (the lobby's): those with a mix and every clip of the items it draws, so a level whose
 *  audio isn't made yet stays hidden and main stays shippable. */
export function playable(clips: Readonly<Record<string, unknown>>, bank: readonly Item[] = joined(clips)): Level[] {
  const mix = mixes(clips, bank);
  return QUIZ_LVS.filter((lv) => {
    const items = bank.filter((it) => it.lv === lv && drawn(it, mix));
    return !!mix[lv] && items.length > 0 && items.every((it) => voiced(it, clips));
  });
}

/** One entry a line (the files diff by item). */
const list = (xs: readonly unknown[]): string => (xs.length ? `[\n${xs.map((x) => JSON.stringify(x)).join(',\n')}\n]` : '[]');
const dict = (o: Readonly<Record<string, unknown>>): string => {
  const ks = Object.keys(o);
  return ks.length ? `{\n${ks.map((k) => `${JSON.stringify(k)}:${JSON.stringify(o[k])}`).join(',\n')}\n}` : '{}';
};

/** A part's file: its items (or ladders; a unit's: the unit, then both), their clips (the packs they're in, and where)
 *  and their word timings. */
function partFile(of: { unit?: unknown; items?: readonly Item[]; ladders?: readonly Ladder[] }, clips: Readonly<Record<string, Clip>>, words: Readonly<Record<string, Words>>, places: Places): string {
  const ids = [...(of.items ?? []).flatMap((it) => clipIds(it)), ...(of.ladders ?? []).flatMap((l) => l.rungs.map((r) => r.id))];
  const pick = <T,>(src: Readonly<Record<string, T>>) => Object.fromEntries(ids.filter((id) => id in src).map((id) => [id, src[id]]));
  const body = of.unit
    ? `"unit":${JSON.stringify(of.unit)},\n"items":${list(of.items ?? [])},\n"ladders":${list(of.ladders ?? [])}`
    : of.items ? `"items":${list(of.items)}` : `"ladders":${list(of.ladders ?? [])}`;
  const c = chunkClips(ids, clips, places);
  return `{${body},\n"packs":${JSON.stringify(c.packs)},\n"clips":${dict(c.clips)},\n"words":${dict(pick(words))}}\n`;
}

/** A unit's chunk: what its lessons need (the unit as played: its can-do, phrases with the items they're heard in, the
 *  lessons, the tiers, its homes), its lessons' items as authored (its own and the bank's, each once, in lesson order)
 *  and the ladders its じっせん names; and its index entries. */
function unitChunk(u: UnitManifest, check: UnitsCheck, bank: ReadonlyMap<string, Item>, clips: Readonly<Record<string, Clip>>, words: Readonly<Record<string, Words>>, places: Places) {
  const own = new Map((u.items ?? []).map((it) => [it.id, it]));
  const ids = lessonIds(u);
  const items = ids.map((id) => own.get(id) ?? bank.get(id)).filter((it): it is Item => !!it);
  const ladders = LADDERS.filter((l) => ids.includes(l.id));
  const unit = {
    id: u.unit, name: u.name, stage: u.stage, domain: u.domain, ...(u.also && { also: u.also }), host: u.host, scene: u.scene, sound: u.sound, status: u.status,
    cando: { ja: candoText(u.cando), ...(u.cando.short && { short: u.cando.short.trim() }), en: u.cando.en }, lessons: u.lessons, home: ids.filter((id) => check.home.get(id) === u.unit), ...(u.tiers && { tiers: u.tiers }),
    ph: u.ph.map((p) => ({ ...p, in: check.phraseIn.get(p.id)?.items ?? [] }))
  } satisfies UnitPlay;
  const file = partFile({ unit, items, ladders }, clips, words, places);
  if (gz(file) > UNIT_MAX) throw new Error(`kikimimi: unit ${u.unit}'s chunk is ${gz(file)} B gzipped, over ${UNIT_MAX}`);
  const lessons = LESSONS.reduce((m, l, i) => (u.lessons[l] ? m | (1 << i) : m), 0);
  const path: PathEntry = [u.unit, u.name, u.stage, u.domain, u.host, u.status, lessons];
  if (u.cando.short) path.push(u.cando.short.trim());
  return { file, path, entry: { parts: [`u-${u.unit}`], n: items.length, cv: cv([...items, ...ladders.flatMap((l) => l.rungs)], [u.lessons, u.tiers ?? null], clips) } };
}

/** A unit's content version (docs/kikimimi-framework.md §4.2): what shapes its decks and schedule (ids, order, choice
 *  counts, answers, the clips' lengths to 10 ms, the mix), 6 hex. */
function cv(items: readonly Item[], mix: unknown, clips: Readonly<Record<string, Clip>>): string {
  const shape = items.map((it) => [it.id, it.type, it.choices.length, it.answer, clipIds(it).map((id) => Math.round((clips[id]?.dur ?? 0) * 100))]);
  return createHash('sha256').update(JSON.stringify([mix, shape])).digest('hex').slice(0, 6);
}

/** A level's items in contiguous parts, each under PART_AIM gzipped (one part when it fits), as their files. */
function split(items: readonly Item[], file: (items: readonly Item[]) => string): string[] {
  for (let n = 1; n <= items.length; n++) {
    const sizes = items.map((it) => JSON.stringify(it).length), total = sizes.reduce((a, b) => a + b, 0);
    const parts: Item[][] = Array.from({ length: n }, () => []);
    let run = 0;
    items.forEach((it, i) => {
      parts[Math.min(n - 1, Math.floor((run / total) * n))].push(it);
      run += sizes[i];
    });
    const files: string[] = [];
    for (const p of parts) {
      const f = p.length ? file(p) : '';
      if (!f || gz(f) > PART_AIM) break;
      files.push(f);
    }
    if (files.length === n) return files;
  }
  throw new Error('kikimimi: a level that no split fits');
}

/** levels/'s files (paths under it → contents) for these clips and word timings, these units (app/content/units/:
 *  a unit that fails its checks stops it; its warnings go to `warn`) and these packs (packs.json: a clip in none stops it). */
export function compile(clips: Readonly<Record<string, Clip>>, words: Readonly<Record<string, Words>>, sources: readonly UnitSource[] = readUnits(), packs: Readonly<Packs> = readPacks(), warn?: (w: string) => void): Map<string, string> {
  const out = new Map<string, string>();
  const places = clipPlaces(packs);
  const BANK = joined(clips), check = checkUnitSources(sources, clips, BANK);
  if (check.errors.length) throw new Error(`kikimimi: the units don't check:\n${check.errors.join('\n')}`);
  if (warn) for (const w of check.warnings) warn(w);
  const dialogues = dialoguesVoiced(clips, BANK), mix = mixFor(dialogues);
  const units: Index['units'] = {};
  const levels = [...new Set(BANK.map((it) => it.lv))].sort((a, b) => a - b);
  for (const lv of levels) {
    const items = BANK.filter((it) => it.lv === lv);
    const parts = split(items, (p) => partFile({ items: p }, clips, words, places));
    const names = parts.length === 1 ? [`lv${lv}`] : parts.map((_, i) => `lv${lv}-${i + 1}`);
    parts.forEach((file, i) => out.set(`parts/${names[i]}.json`, file));
    units[lv] = { parts: names, n: items.length, cv: cv(items, mix[lv] ?? null, clips) };
  }
  const ladders = partFile({ ladders: LADDERS }, clips, words, places);
  if (gz(ladders) > PART_AIM) throw new Error('kikimimi: the ladders are past a chunk’s budget: split them as the levels are');
  out.set('parts/ladder.json', ladders);
  const rungs = LADDERS.flatMap((l) => l.rungs);
  units.ladder = { parts: ['ladder'], n: LADDERS.length, cv: cv(rungs, null, clips) };
  const byId = new Map(BANK.map((it) => [it.id, it]));
  const paths: PathEntry[] = [];
  for (const u of check.units) {
    const c = unitChunk(u, check, byId, clips, words, places);
    out.set(`parts/u-${u.unit}.json`, c.file);
    units[u.unit] = c.entry;
    paths.push(c.path);
  }
  const first = BANK.find((it) => it.lv === 1)!;
  const test = chunkClips([first.id], clips, places);
  const index: Index = {
    units, offered: playable(clips, BANK), dialogues, ladder: ladderReady(clips), test: [first.id, test.clips[first.id], test.packs], paths,
    items: BANK.map((it) => {
      const t = tagsOf(it);
      return [it.id, it.lv, it.type, it.voice, t.pragmatic, [...t.features]];
    }),
    rungs: rungs.map((it) => it.id)
  };
  const { items, rungs: rungIds, paths: pathList, ...head } = index;
  out.set('index.json', `${JSON.stringify(head).slice(0, -1)},\n"paths":${list(pathList)},\n"items":${list(items)},\n"rungs":${JSON.stringify(rungIds)}}\n`);
  return out;
}
