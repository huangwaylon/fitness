// ききみみ クイズ's compiler (docs/kikimimi-engine.md "Loading"): source.ts's items, ladders.ts's ladders, clips.json and
// words.json into levels/, which the sheet loads a level at a time (pool.ts): a chunk per level (its items in the bank's
// order, their clips and word timings; a level past the budget split, in order, into parts), the ladders' chunk, and
// the index the sheet opens with (each level's parts, count and content version; the gates; the sound check's clip;
// every item's id, level, type, accent and tags for きろく; the rungs' ids). `npm run kikimimi:levels` writes them (the
// audio scripts too, at their end); levels.test fails while the committed files differ. Node and tests only.
//   The units (docs/curriculum.md "The unit file", units.ts) extend it, with no second loader: each manifest in
// app/content/units/ is checked against the bank and becomes a chunk of its own (`parts/u-<id>.json`: the unit, its
// lessons' items as authored, their clips and timings) and an entry in the index (`units[<id>]` beside the levels',
// and a line in `paths`, the island path's). The levels' chunks and decks don't change for any unit (units.test).
//   The bedtime serials (app/content/listen/story/*.yaml, story.ts) compile too: each chapter a chunk of its own
// (`parts/<unit>-<chapter>.json`: the chapter, its segments' clips and word timings) and a line in the index's `stories`.
//   The units' villager letters (U7, letters.ts) are one small chunk, `parts/letters.json`, loaded when one is shown.
//   The listening kinds (app/content/listen/*.yaml, listen.ts: tiles, calls, たちぎき) are checked (a problem stops it)
// and each file becomes a chunk of its own (`parts/<unit>.json`: the file as played, its clips and timings), an entry in
// `units` and `listen`, and its game's line in `games` (`tile:s1-tile-a`) once games/versions.ts has the game.
//   はつおん's pairs (app/content/mic/pairs.yaml, games/pair/pairs.ts) are checked too and, past draft, become the chunk
// `parts/mic-pairs.json` (the cards, their words' clips), `units['mic-pairs']` and `games['pair:mic-pairs']`.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { parse } from 'yaml';
import { QUIZ_LVS } from '../contract/live-protocol.ts';
import { HENSHIN_LV, clipIds, isDialogue, takeIds, type Item, type Level } from './bank.ts';
import type { ChunkClip, Clip, Words } from './clips.ts';
import { voiced } from './clips.ts';
import type { Ladder } from './ladder.ts';
import type { UnitPlay } from './lesson.ts';
import { LADDERS, ladderReady } from './ladders.ts';
import { drawn, mixFor, type Mixes } from './mix.ts';
import { clipPlaces, type PackRef, type Packs } from './packing.ts';
import type { Index, PathEntry } from './pool.ts';
import { AUTHORED, joined } from './source.ts';
import { TELL_TYPES, type ChoiceSet } from './tells.ts';
import { tagsOf } from './tags.ts';
import { LESSONS, candoText, checkUnits, kindFiles, lessonIds, listenRefs, manifestOf, type UnitManifest, type UnitsCheck } from './units.ts';
import { BUILD_V } from './games/versions.ts';
import { chapterPart, chapters, type ChapterEntry, type StoryEntry, type StorySource } from './story.ts';
import { PAIR_UNIT, pairsFile } from './games/pair/pairs.ts';
import { checkListenAll, listenClipIds, listenPart, listenShape, listenUnit, longEntries, longQId, usProblems, type ListenSource } from './listen.ts';

/** A unit's chunk's budget (gzipped; plan §8: 20 KB, raised to 32 for the Japanese help, cja, why and ctx, ~0.3 KB an item). */
export const UNIT_MAX = 32 * 1024;

/** A unit's manifest as read: its file's name and its parsed YAML. */
export interface UnitSource {
  file: string;
  raw: unknown;
}

const UNITS_DIR = new URL('../../../content/units/', import.meta.url);

/** The content readers' results, once a process per path: each re-parsed its YAML on every call (readListen ~210 ms,
 *  two thirds of a compile; units.test's U7 timed out under load, 2026-11-13). Frozen, so no caller edits the shared
 *  copy (a test edits a clone). */
const read = new Map<string, unknown>();
const deepFreeze = <T>(x: T): T => {
  if (x && typeof x === 'object' && !Object.isFrozen(x)) Object.values(Object.freeze(x)).forEach(deepFreeze);
  return x;
};
const once = <T>(url: URL, load: () => T): T => (read.has(url.href) ? read.get(url.href) : read.set(url.href, deepFreeze(load())).get(url.href)) as T;

/** app/content/units/*.yaml, parsed, by file name (no directory: an empty list). */
export function readUnits(dir: URL = UNITS_DIR): UnitSource[] {
  if (!existsSync(dir)) return [];
  return once(dir, () => readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort().map((file) => ({ file, raw: parse(readFileSync(new URL(file, dir), 'utf8')) })));
}

const STORIES_DIR = new URL('../../../content/listen/story/', import.meta.url);

/** app/content/listen/story/*.yaml (the bedtime serials), parsed, in file order. */
export function readStories(dir: URL = STORIES_DIR): StorySource[] {
  if (!existsSync(dir)) return [];
  return once(dir, () => readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort().map((f) => parse(readFileSync(new URL(f, dir), 'utf8')) as StorySource));
}

const LISTEN_DIR = new URL('../../../content/listen/', import.meta.url);

/** app/content/listen/*.yaml (the listening kinds' files; not story/), parsed, by file name. */
export function readListen(dir: URL = LISTEN_DIR): ListenSource[] {
  if (!existsSync(dir)) return [];
  return once(dir, () => readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort().map((file) => ({ file, raw: parse(readFileSync(new URL(file, dir), 'utf8')) })));
}

const PAIRS_FILE = new URL('../../../content/mic/pairs.yaml', import.meta.url);

/** app/content/mic/pairs.yaml (はつおん's pairs), parsed; none: null. */
export const readPairs = (file: URL = PAIRS_FILE): unknown => (existsSync(file) ? once(file, () => parse(readFileSync(file, 'utf8'))) : null);

/** The units' own items (inline in their manifests, as authored), in file order: the audio scripts voice them beside
 *  the bank's (their ids are checked against the bank's and each other's: checkUnits). */
export function unitItems(sources: readonly UnitSource[] = readUnits()): Item[] {
  return sources.flatMap(({ raw }) => ((raw as { items?: unknown }).items as Item[] | undefined) ?? []);
}

/** Every 3-choice set a player could weigh without the audio (tells.ts TELL_TYPES), by group: the banks' items by level
 *  (`L4`), the units' items and their tiers (`units`, a tier's id `<item>:<tier>`, its unit's file), まるごと 聞く's
 *  questions against their piece's whole transcript (`long`, a question's row id). tells.test holds them to the limits;
 *  scripts/kikimimi-tells.ts lists them. */
export function choiceSets(sources: readonly UnitSource[] = readUnits(), listen: readonly ListenSource[] = readListen()): (ChoiceSet & { group: string; id: string; type: string; file?: string })[] {
  const out: (ChoiceSet & { group: string; id: string; type: string; file?: string })[] = [];
  const add = (group: string, id: string, type: string, s: ChoiceSet, file?: string) =>
    s.choices.length === 3 && TELL_TYPES.has(type) && out.push({ group, id, type, choices: s.choices, answer: s.answer, en: s.en, ...(file && { file }) });
  for (const it of AUTHORED) add(`L${it.lv}`, it.id, it.type, it);
  for (const { file, raw } of sources) {
    const items = unitItems([{ file, raw }]), byId = new Map(items.map((it) => [it.id, it]));
    for (const it of items) add('units', it.id, it.type, it, file);
    const tiers = (raw as { tiers?: Record<string, Record<string, Pick<Item, 'choices' | 'answer'>>> }).tiers ?? {};
    for (const [id, t] of Object.entries(tiers)) {
      const it = byId.get(id);
      if (it) for (const [k, set] of Object.entries(t)) add('units', `${id}:${k}`, it.type, { ...set, en: it.en }, file);
    }
  }
  // (a long question's angle as the quiz's type: the implied meaning and the attitude `mean`, the gist and the next `gist`)
  for (const { file, raw } of listen)
    for (const it of listenUnit(raw).items)
      if (it.kind === 'long') it.questions.forEach((q, k) => add('long', longQId(it.id, k), 'gist', { ...q, en: it.lines.map((l) => l.en).join(' ') }, file));
  return out;
}

/** The units read and checked (units.ts: each manifest, then all of them against the bank, the ladders, the clips and
 *  the listening files recipe 2 names): the manifests that read, and the problems (errors stop the compiler; warnings
 *  are printed). */
export function checkUnitSources(
  sources: readonly UnitSource[], clips: Readonly<Record<string, unknown>>, bank: readonly Item[] = joined(clips), listen: readonly ListenSource[] = readListen()
): UnitsCheck & { units: UnitManifest[] } {
  const units: UnitManifest[] = [], errors: string[] = [];
  for (const { file, raw } of sources) {
    const m = manifestOf(raw, file);
    errors.push(...m.errors);
    if (m.unit) units.push(m.unit);
  }
  const all = checkUnits(units, bank, LADDERS, clips, listenRefs(listen));
  const us = units.flatMap((u) => (u.items ?? []).flatMap((it) => usProblems(it).map((p) => `${u.unit} ${it.id}: ${p}`)));
  return { ...all, errors: [...errors, ...all.errors, ...us], units };
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
  const ids = [...(of.items ?? []).flatMap((it) => takeIds(it)), ...(of.ladders ?? []).flatMap((l) => l.rungs.map((r) => r.id))];
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

/** A serial's chapters as chunks (story.ts Chapter, with their segments' clips and word timings) and its index entry:
 *  each chapter's chunk name, id, title, caption, segments, length (its clips', 0 while one is missing) and cv. */
function storyChunks(s: StorySource, clips: Readonly<Record<string, Clip>>, words: Readonly<Record<string, Words>>, places: Places) {
  const files = new Map<string, string>(), entry: StoryEntry = { name: s.name, host: s.host, status: s.status, chapters: [] };
  for (const ch of chapters(s)) {
    const ids = ch.segments.map((seg) => seg.clip), part = chapterPart(s.unit, ch.chapter);
    const c = chunkClips(ids, clips, places);
    const file = `{"story":${JSON.stringify(ch)},\n"packs":${JSON.stringify(c.packs)},\n"clips":${dict(c.clips)},\n"words":${dict(Object.fromEntries(ids.filter((id) => id in words).map((id) => [id, words[id]])))}}\n`;
    if (gz(file) > PART_AIM) throw new Error(`kikimimi: story chapter ${part}'s chunk is ${gz(file)} B gzipped, over ${PART_AIM}`);
    files.set(`parts/${part}.json`, file);
    const durs = ids.map((id) => clips[id]?.dur);
    const cs = durs.every((d) => d !== undefined) ? Math.round((durs as number[]).reduce((a, b) => a + b, 0) * 100) : 0;
    const shape = createHash('sha256').update(JSON.stringify(ch.segments.map((seg) => [seg.clip, Math.round((clips[seg.clip]?.dur ?? 0) * 100)]))).digest('hex').slice(0, 6);
    entry.chapters.push([part, ch.id, ch.title, ch.line, ids.length, cs, shape] satisfies ChapterEntry);
  }
  return { files, entry };
}

/** A listening file's chunk (listen.ts ListenPart, its clips and word timings) and its index entries. A file past
 *  draft has every clip. */
function listenChunk({ file, raw }: ListenSource, bank: ReadonlyMap<string, Item>, clips: Readonly<Record<string, Clip>>, words: Readonly<Record<string, Words>>, places: Places) {
  const part = listenPart(raw, bank);
  const ids = part.items.flatMap(listenClipIds);
  const missing = ids.filter((id) => !clips[id]);
  if (part.status !== 'draft' && missing.length) throw new Error(`kikimimi: ${file} is ${part.status} but has no clip ${missing.join(' ')}`);
  const { items, ...head } = part;
  const c = chunkClips(ids, clips, places);
  const text = `{"listen":${JSON.stringify(head).slice(0, -1)},"items":${list(items)}},\n"packs":${JSON.stringify(c.packs)},\n"clips":${dict(c.clips)},\n"words":${dict(Object.fromEntries(ids.filter((id) => id in words).map((id) => [id, words[id]])))}}\n`;
  if (gz(text) > UNIT_MAX) throw new Error(`kikimimi: ${file}'s chunk is ${gz(text)} B gzipped, over ${UNIT_MAX}`);
  const shape = items.map((it) => [listenShape(it), listenClipIds(it).map((id) => Math.round((clips[id]?.dur ?? 0) * 100))]);
  return { head, text, n: items.length, cv: createHash('sha256').update(JSON.stringify(shape)).digest('hex').slice(0, 6) };
}

/** A unit's content version (docs/kikimimi-engine.md "cv, the content version"): what shapes its decks and schedule (ids, order, choice
 *  counts, answers, the clips' lengths to 10 ms, the mix), 6 hex. */
function cv(items: readonly Item[], mix: unknown, clips: Readonly<Record<string, Clip>>): string {
  const shape = items.map((it) => [it.id, it.type, it.choices.length, it.answer, clipIds(it).map((id) => Math.round((clips[id]?.dur ?? 0) * 100))]);
  return createHash('sha256').update(JSON.stringify([mix, shape])).digest('hex').slice(0, 6);
}

/** A game's content version (docs/kikimimi-engine.md "cv, the content version"), `play`'s `cv`: its deck's content's (cv above), the game
 *  and its build's version (games/versions.ts BUILD_V), 6 hex. */
export function gameCv(gm: string, content: string): string {
  const v = BUILD_V[gm];
  if (v === undefined) throw new Error(`kikimimi: no BUILD_V for the game ${gm}`);
  return createHash('sha256').update(JSON.stringify([gm, v, content])).digest('hex').slice(0, 6);
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

/** The bank items a derived tile may name (listen.ts `clip`): voiced, one clip each. */
export const oneClipBank = (clips: Readonly<Record<string, unknown>>, bank: readonly Item[] = joined(clips)): Map<string, Item> =>
  new Map(bank.filter((it) => !isDialogue(it) && voiced(it, clips)).map((it) => [it.id, it]));

/** levels/'s files (paths under it → contents) for these clips and word timings, these units (app/content/units/:
 *  a unit that fails its checks stops it; its warnings go to `warn`), these packs (packs.json: a clip in none stops it)
 *  these bedtime serials (content/listen/story/) and these listening files (content/listen/: a problem stops it). So
 *  does a US-lint hit in the bank (curriculum.md "Authoring pipeline"; B7 cleared the last). */
export function compile(clips: Readonly<Record<string, Clip>>, words: Readonly<Record<string, Words>>, sources: readonly UnitSource[] = readUnits(), packs: Readonly<Packs> = readPacks(), warn?: (w: string) => void, stories: readonly StorySource[] = readStories(), listen: readonly ListenSource[] = readListen(), pairs: unknown = readPairs()): Map<string, string> {
  const out = new Map<string, string>();
  const places = clipPlaces(packs);
  const BANK = joined(clips), check = checkUnitSources(sources, clips, BANK, listen);
  if (check.errors.length) throw new Error(`kikimimi: the units don't check:\n${check.errors.join('\n')}`);
  const us = BANK.flatMap((it) => usProblems(it).map((p) => `${it.id}: ${p}`));
  if (us.length) throw new Error(`kikimimi: the bank isn't US English:\n${us.join('\n')}`);
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
  const letters = Object.fromEntries(check.units.flatMap((u) => (u.letter ? [[u.unit, { en: u.letter.en.trim(), ja: u.letter.ja.trim() }]] : [])));
  out.set('parts/letters.json', `{"letters":${dict(letters)},"packs":[],"clips":{},"words":{}}\n`);
  const storyIndex: Index['stories'] = {};
  for (const s of stories) {
    const c = storyChunks(s, clips, words, places);
    for (const [path, file] of c.files) out.set(path, file);
    storyIndex[s.unit] = c.entry;
  }
  // the listening files: derived tiles may name a voiced one-clip bank item; ids never a bank, unit or rung clip's
  const oneClip = oneClipBank(clips, BANK);
  const taken = new Set([...BANK, ...check.units.flatMap((u) => u.items ?? [])].flatMap((it) => clipIds(it)).concat(rungs.map((r) => r.id)));
  const bad = checkListenAll(listen, oneClip, taken);
  if (bad.length) throw new Error(`kikimimi: the listening files don't check:\n${bad.join('\n')}`);
  const listenIndex: Index['listen'] = {}, listenCv = new Map<string, string>();
  for (const src of listen) {
    const c = listenChunk(src, oneClip, clips, words, places);
    out.set(`parts/${c.head.unit}.json`, c.text);
    units[c.head.unit] = { parts: [c.head.unit], n: c.n, cv: c.cv };
    listenIndex[c.head.unit] = [c.head.game, c.head.stage, c.head.status];
    listenCv.set(c.head.unit, c.cv);
  }
  // はつおん's pairs, past draft: every word's clip (a draft is checked only)
  const pf = pairs === null ? null : pairsFile(pairs);
  if (pf && pf.status !== 'draft') {
    const missing = pf.cards.flatMap((c) => clipIds(c)).filter((id) => !clips[id]);
    if (missing.length) throw new Error(`kikimimi: content/mic/pairs.yaml is ${pf.status} but has no clip ${missing.join(' ')}`);
    out.set(`parts/${PAIR_UNIT}.json`, partFile({ items: pf.cards }, clips, words, places));
    units[PAIR_UNIT] = { parts: [PAIR_UNIT], n: pf.cards.length, cv: cv(pf.cards, null, clips) };
  }
  // each game's cv by its deck's content (pool.ts gameCvOf): the quiz at a level, スピード はしご, a unit's lesson, the
  // tournament
  const games: Index['games'] = {};
  // (level 8, 音の へんしん's phrases, is no quiz's nor the tournament's: its own game's below)
  const quizLevels = levels.filter((lv) => lv !== HENSHIN_LV);
  for (const lv of quizLevels) games[`quiz:${lv}`] = gameCv('quiz', units[lv].cv);
  games['ladder:ladder'] = gameCv('ladder', units.ladder.cv);
  // (a recipe-2 unit's lesson cv takes in its kinds' files that are listened: those its lessons play)
  const refs = listenRefs(listen);
  for (const u of check.units) {
    const kinds = kindFiles(u, refs), files = [...new Set(Object.values(kinds).flat())].filter((f) => listenIndex[f]?.[2] === 'listened').sort();
    if (Object.keys(kinds).length) units[u.unit].kinds = kinds;
    games[`lesson:${u.unit}`] = gameCv('lesson', [units[u.unit].cv, ...files.map((f) => `${f}:${listenCv.get(f)}`)].join(','));
  }
  // the weekend tournament deals from every level by the items' places in them (games/taikai/pick.ts numbering)
  games['taikai:all'] = gameCv('taikai', quizLevels.map((lv) => units[lv].cv).join(','));
  // a listening file's game (`tile:s1-tile-a`), once the registry has the game (games/versions.ts BUILD_V)
  for (const [u, [gm]] of Object.entries(listenIndex)) if (BUILD_V[gm] !== undefined) games[`${gm}:${u}`] = gameCv(gm, listenCv.get(u)!);
  if (units[PAIR_UNIT] && BUILD_V.pair !== undefined) games[`pair:${PAIR_UNIT}`] = gameCv('pair', units[PAIR_UNIT].cv);
  // 音の へんしん deals from level 8, its phrases (content/henshin.ts)
  if (units[HENSHIN_LV] && BUILD_V.henshin !== undefined) games[`henshin:${HENSHIN_LV}`] = gameCv('henshin', units[HENSHIN_LV].cv);
  const first = BANK.find((it) => it.lv === 1)!;
  const test = chunkClips([first.id], clips, places);
  const index: Index = {
    units, games, offered: playable(clips, BANK), dialogues, ladder: ladderReady(clips), test: [first.id, test.clips[first.id], test.packs], stories: storyIndex, listen: listenIndex, paths,
    items: BANK.map((it) => {
      const t = tagsOf(it);
      return [it.id, it.lv, it.type, it.voice, t.pragmatic, [...t.features]];
    }),
    long: listen.flatMap(({ raw }) => longEntries(raw)),
    rungs: rungs.map((it) => it.id)
  };
  const { items, long, rungs: rungIds, paths: pathList, ...head } = index;
  out.set('index.json', `${JSON.stringify(head).slice(0, -1)},\n"paths":${list(pathList)},\n"items":${list(items)},\n"long":${list(long)},\n"rungs":${JSON.stringify(rungIds)}}\n`);
  return out;
}
