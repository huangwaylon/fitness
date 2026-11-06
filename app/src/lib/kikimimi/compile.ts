// ききみみ クイズ's compiler (docs/kikimimi.md "Loading"): source.ts's items, ladders.ts's ladders, clips.json and
// words.json into levels/, which the sheet loads a level at a time (pool.ts): a chunk per level (its items in the bank's
// order, their clips and word timings; a level past the budget split, in order, into parts), the ladders' chunk, and
// the index the sheet opens with (each level's parts, count and content version; the gates; the sound check's clip;
// every item's id, level, type, accent and tags for きろく; the rungs' ids). `npm run kikimimi:levels` writes them (the
// audio scripts too, at their end); levels.test fails while the committed files differ. Node and tests only.
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { clipIds, isDialogue, type Item, type Level } from './bank.ts';
import type { Clip, Words } from './clips.ts';
import { voiced } from './clips.ts';
import type { Ladder } from './ladder.ts';
import { LADDERS, ladderReady } from './ladders.ts';
import { drawn, mixFor, type Mixes } from './mix.ts';
import type { Index } from './pool.ts';
import { BANK } from './source.ts';
import { tagsOf } from './tags.ts';

/** A chunk's budget (gzipped, as built: scripts/kikimimi-budget.ts checks the build's). */
export const PART_MAX = 60 * 1024;
/** A level is split into parts of at most this (gzipped JSON: the chunk Vite makes of it is a little bigger). */
const PART_AIM = 54 * 1024;

const gz = (s: string): number => gzipSync(s).length;

/** Whether every level-4 dialogue is voiced (each line's clip). */
const dialoguesVoiced = (clips: Readonly<Record<string, unknown>>, bank: readonly Item[]): boolean =>
  bank.filter((it) => it.lv === 4 && isDialogue(it)).every((it) => voiced(it, clips));

/** The mixes for a set of clips: level 4 takes dialogues only once every level-4 dialogue is voiced. */
export const mixes = (clips: Readonly<Record<string, unknown>>, bank: readonly Item[] = BANK): Mixes => mixFor(dialoguesVoiced(clips, bank));

/** The levels a phone offers (the lobby's): those with a mix and every clip of the items it draws, so a level whose
 *  audio isn't made yet stays hidden and main stays shippable. */
export function playable(clips: Readonly<Record<string, unknown>>, bank: readonly Item[] = BANK): Level[] {
  const mix = mixes(clips, bank);
  return ([1, 2, 3, 4, 5, 6, 7, 8] as const).filter((lv) => {
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

/** A part's file: its items (or ladders), their clips and their word timings. */
function partFile(of: { items?: readonly Item[]; ladders?: readonly Ladder[] }, clips: Readonly<Record<string, Clip>>, words: Readonly<Record<string, Words>>): string {
  const ids = [...(of.items ?? []).flatMap((it) => clipIds(it)), ...(of.ladders ?? []).flatMap((l) => l.rungs.map((r) => r.id))];
  const pick = <T,>(src: Readonly<Record<string, T>>) => Object.fromEntries(ids.filter((id) => id in src).map((id) => [id, src[id]]));
  const body = of.items ? `"items":${list(of.items)}` : `"ladders":${list(of.ladders ?? [])}`;
  return `{${body},\n"clips":${dict(pick(clips))},\n"words":${dict(pick(words))}}\n`;
}

/** A unit's content version (docs/kikimimi-framework.md §4.2): what shapes its decks and schedule (ids, order, choice
 *  counts, answers, the clips' lengths to 10 ms, the mix), 6 hex. */
function cv(items: readonly Item[], mix: unknown, clips: Readonly<Record<string, Clip>>): string {
  const shape = items.map((it) => [it.id, it.type, it.choices.length, it.answer, clipIds(it).map((id) => Math.round((clips[id]?.dur ?? 0) * 100))]);
  return createHash('sha256').update(JSON.stringify([mix, shape])).digest('hex').slice(0, 6);
}

/** A level's items in contiguous parts, each under PART_AIM gzipped (one part when it fits). */
function split(items: readonly Item[], file: (items: readonly Item[]) => string): Item[][] {
  for (let n = 1; n <= items.length; n++) {
    const sizes = items.map((it) => JSON.stringify(it).length), total = sizes.reduce((a, b) => a + b, 0);
    const parts: Item[][] = Array.from({ length: n }, () => []);
    let run = 0;
    items.forEach((it, i) => {
      parts[Math.min(n - 1, Math.floor((run / total) * n))].push(it);
      run += sizes[i];
    });
    if (parts.every((p) => p.length && gz(file(p)) <= PART_AIM)) return parts;
  }
  throw new Error('kikimimi: a level that no split fits');
}

/** levels/'s files (paths under it → contents) for these clips and word timings. */
export function compile(clips: Readonly<Record<string, Clip>>, words: Readonly<Record<string, Words>>): Map<string, string> {
  const out = new Map<string, string>();
  const dialogues = dialoguesVoiced(clips, BANK), mix = mixFor(dialogues);
  const units: Index['units'] = {};
  const levels = [...new Set(BANK.map((it) => it.lv))].sort((a, b) => a - b);
  for (const lv of levels) {
    const items = BANK.filter((it) => it.lv === lv);
    const parts = split(items, (p) => partFile({ items: p }, clips, words));
    const names = parts.length === 1 ? [`lv${lv}`] : parts.map((_, i) => `lv${lv}-${i + 1}`);
    parts.forEach((p, i) => out.set(`parts/${names[i]}.json`, partFile({ items: p }, clips, words)));
    units[lv] = { parts: names, n: items.length, cv: cv(items, mix[lv] ?? null, clips) };
  }
  const ladders = partFile({ ladders: LADDERS }, clips, words);
  if (gz(ladders) > PART_AIM) throw new Error('kikimimi: the ladders are past a chunk’s budget: split them as the levels are');
  out.set('parts/ladder.json', ladders);
  const rungs = LADDERS.flatMap((l) => l.rungs);
  units.ladder = { parts: ['ladder'], n: LADDERS.length, cv: cv(rungs, null, clips) };
  const first = BANK.find((it) => it.lv === 1)!;
  const index: Index = {
    units, offered: playable(clips), dialogues, ladder: ladderReady(clips), test: [first.id, clips[first.id]],
    items: BANK.map((it) => {
      const t = tagsOf(it);
      return [it.id, it.lv, it.type, it.voice, t.pragmatic, [...t.features]];
    }),
    rungs: rungs.map((it) => it.id)
  };
  const { items, rungs: rungIds, ...head } = index;
  out.set('index.json', `${JSON.stringify(head).slice(0, -1)},\n"items":${list(items)},\n"rungs":${JSON.stringify(rungIds)}}\n`);
  return out;
}
