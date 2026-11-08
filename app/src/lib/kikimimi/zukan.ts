// ききみみ's ずかん (docs/kikimimi.md "ずかん"; docs/curriculum.md "A unit"): what the four sections fold from my
// answers and this phone's story progress, never stored. ことば: each key phrase seen or caught (srs.ts phrasesOf: right on
// the first listen in 3 clips on ≥ 2 days) with its ★ (caught; +1 for first listens in 2 accents; +1 for one under a
// condition: a phone, a PA, a noise bed), and a bedtime chapter's phrases collected by hearing the chapter (a story has
// no answers: seen once begun, caught once finished, never starred). こえ: the cast's voices, caught after 10 different
// items understood from that voice. スタンプ: the unit stamps (stamps.ts), the いっぱつ count and its badges, the chapters
// finished. Pure: an item's voices, speakers and conditions come from a lookup over the loaded chunks.
import { firstListenRight } from '../contract/listen.ts';
import type { LocalDate } from '../types.ts';
import type { RosterId } from '#lib/villagers/roster.ts';
import { channelOf, isDialogue, type Accent, type CastId, type Item } from './bank.ts';
import { CAST, EXPOSURE } from './cast.ts';
import { castOf } from './speech.ts';
import { phrasesOf, type PhraseState } from './srs.ts';
import type { Answer } from './progress.ts';
import type { StoryProgress } from './bedtime.ts';
import type { UnitState } from './stamps.ts';

/** What ずかん reads of an item: its accent, whether it's heard under a condition, its voices and its speakers (a
 *  dialogue's every line). */
export interface Heard {
  accent: Accent;
  hard: boolean;
  casts: readonly CastId[];
  who: readonly RosterId[];
}

/** An item's Heard: a dialogue's lines' voices and speakers (each once), else its own (speech.ts castOf). */
export function heardOf(it: Item): Heard {
  const hard = channelOf(it) !== 'live' || !!it.cond || (it.lines?.some((l) => !!l.cond) ?? false);
  if (isDialogue(it)) return { accent: it.voice, hard, casts: [...new Set(it.lines.map((l) => l.cast))], who: [...new Set(it.lines.map((l) => l.who))] };
  return { accent: it.voice, hard, casts: [castOf(it)], who: [it.speaker] };
}

export type Lookup = (id: string) => Heard | undefined;

// ---- ことば ------------------------------------------------------------------------------------------------------------

/** The most ★ a phrase has. */
export const STAR_MAX = 3;

export interface PhraseBookEntry extends PhraseState {
  /** 0 (not caught) … 3. */
  stars: number;
  /** The times it was heard (answers on its items) and the last day (null: never). */
  times: number;
  last: LocalDate | null;
  /** The villagers it was heard from (in the order first heard). */
  who: RosterId[];
}

/** Each phrase's state with its ★ and where it was heard: caught 1, first-listen rights in 2 or more accents +1, one
 *  under a condition +1 (only items the lookup knows count for the extras). */
export function phraseBook(phrases: readonly { id: string; in: readonly string[] }[], answers: readonly Answer[], info: Lookup): Map<string, PhraseBookEntry> {
  const states = phrasesOf(phrases, answers);
  const out = new Map<string, PhraseBookEntry>();
  for (const ph of phrases) {
    const st = states.get(ph.id)!;
    const ids = new Set(ph.in);
    const accents = new Set<Accent>(), who: RosterId[] = [];
    let hard = false, last = '', times = 0;
    for (const a of answers) {
      if (!ids.has(a.id)) continue;
      times++;
      if (a.d > last) last = a.d;
      const h = info(a.id);
      if (!h) continue;
      for (const w of h.who) if (!who.includes(w)) who.push(w);
      if (!firstListenRight(a)) continue;
      accents.add(h.accent);
      hard ||= h.hard;
    }
    const stars = st.caught ? 1 + Number(accents.size >= 2) + Number(hard) : 0;
    out.set(ph.id, { ...st, stars, times, last: last || null, who });
  }
  return out;
}

/** A bedtime chapter's phrases (heard in its chapter): seen once the chapter's begun (its place past the start, or it
 *  or a later one finished), caught once it's finished. */
export function storyPhrases(chapters: readonly { unit: string; chapter: number; ph: readonly { id: string }[] }[], progress: StoryProgress): Map<string, { heard: boolean; caught: boolean }> {
  const out = new Map<string, { heard: boolean; caught: boolean }>();
  for (const c of chapters) {
    const p = progress[c.unit];
    const caught = !!p?.done[c.chapter];
    const heard = caught || (!!p?.at && (p.at.ch > c.chapter || (p.at.ch === c.chapter && p.at.seg > 0))) || Object.keys(p?.done ?? {}).some((k) => +k > c.chapter);
    for (const ph of c.ph) {
      const was = out.get(ph.id);
      out.set(ph.id, { heard: heard || !!was?.heard, caught: caught || !!was?.caught });
    }
  }
  return out;
}

export type PhraseFilter = 'all' | 'caught' | 'notyet';
export const PHRASE_FILTERS: readonly PhraseFilter[] = ['all', 'caught', 'notyet'];
export const passes = (f: PhraseFilter, caught: boolean): boolean => f === 'all' || (f === 'caught') === caught;

// ---- こえ --------------------------------------------------------------------------------------------------------------

/** A voice is caught once this many different items spoken by it were understood. */
export const VOICE_CAUGHT = 10;

export interface VoiceState {
  /** Different items heard in this voice. */
  heard: number;
  /** Different items understood (right, at any listen). */
  understood: number;
  caught: boolean;
}

/** Each voice I've heard: its items heard and understood (a dialogue counts for each of its voices). */
export function voicesOf(answers: readonly Answer[], info: Lookup): Map<CastId, VoiceState> {
  const heard = new Map<CastId, Set<string>>(), got = new Map<CastId, Set<string>>();
  const add = (m: Map<CastId, Set<string>>, c: CastId, id: string) => (m.get(c) ?? m.set(c, new Set()).get(c)!).add(id);
  for (const a of answers) {
    const h = info(a.id);
    if (!h) continue;
    for (const c of h.casts) {
      add(heard, c, a.id);
      if (a.ok) add(got, c, a.id);
    }
  }
  return new Map([...heard].map(([c, s]) => {
    const understood = got.get(c)?.size ?? 0;
    return [c, { heard: s.size, understood, caught: understood >= VOICE_CAUGHT }];
  }));
}

/** The villagers who speak with a voice: theirs for good (CAST) first, then those who use it on an accent-exposure item
 *  (EXPOSURE), each in the cast list's order. */
export function voiceVillagers(cast: CastId): { home: RosterId[]; exposure: RosterId[] } {
  const of = (m: Readonly<Partial<Record<RosterId, CastId>>>) => (Object.keys(m) as RosterId[]).filter((w) => m[w] === cast);
  return { home: of(CAST), exposure: of(EXPOSURE) };
}

/** A clip of `cast`'s among these items to hear it by: one I've heard first (`heard`), else any; a dialogue's line in
 *  that voice. Null: none loaded. */
export function sampleClip(cast: CastId, items: Iterable<Item>, heard: ReadonlySet<string> = new Set()): string | null {
  let any: string | null = null;
  for (const it of items) {
    if (it.rung) continue;
    const k = isDialogue(it) ? it.lines.findIndex((l) => l.cast === cast) : castOf(it) === cast ? 0 : -1;
    if (k < 0) continue;
    const clip = isDialogue(it) ? `${it.id}-${k + 1}` : it.id;
    if (heard.has(it.id)) return clip;
    any ??= clip;
  }
  return any;
}

/** The clip to hear a phrase in, among its items (loaded ones only): one I've heard first, else the first; a dialogue's
 *  line that says it (else its first line). */
export function phraseClip(en: string, ids: readonly string[], item: (id: string) => Item | undefined, heard: ReadonlySet<string> = new Set()): string | null {
  const said = en.toLowerCase().replace(/[^a-z' ]/g, '').trim();
  const clipOf = (it: Item) => {
    if (!isDialogue(it)) return it.id;
    const k = it.lines.findIndex((l) => l.en.toLowerCase().includes(said));
    return `${it.id}-${Math.max(0, k) + 1}`;
  };
  const items = ids.map(item).filter((it): it is Item => !!it && !it.rung);
  const pick = items.find((it) => heard.has(it.id)) ?? items[0];
  return pick ? clipOf(pick) : null;
}

// ---- スタンプ ----------------------------------------------------------------------------------------------------------

/** The いっぱつ badges: right on the first listen this many times. */
export const IPPATSU_BADGES = [10, 50, 100, 300, 1000] as const;

/** My first-listen rights (いっぱつ) and the badges they've reached. */
export function ippatsuOf(answers: readonly Answer[]): { n: number; badges: number[]; next: number | null } {
  const n = answers.filter(firstListenRight).length;
  return { n, badges: IPPATSU_BADGES.filter((b) => n >= b), next: IPPATSU_BADGES.find((b) => n < b) ?? null };
}

export interface UnitStamp {
  id: string;
  /** My stamp's day (null: not mine yet). */
  d: LocalDate | null;
  partner: boolean;
  double: boolean;
}

/** The units' stamps in the path's order: every unit, mine or the partner's or neither (a blank stamp). */
export const unitStamps = (ids: readonly string[], states: ReadonlyMap<string, UnitState>): UnitStamp[] =>
  ids.map((id) => {
    const s = states.get(id);
    return { id, d: s?.stamped ?? null, partner: !!s?.partner, double: !!s?.double };
  });

/** The bedtime chapters finished, each serial's in order: [serial, chapter, the day]. */
export const chaptersDone = (progress: StoryProgress, serials: readonly string[]): [string, number, LocalDate][] =>
  serials.flatMap((u) => Object.entries(progress[u]?.done ?? {}).map(([ch, d]) => [u, +ch, d] as [string, number, LocalDate]).sort((a, b) => a[1] - b[1]));
