// まるごと 聞く as a GameDef (docs/kikimimi.md "まるごと 聞く", kikimimi-engine.md "まるごと 聞く"): one 2-4 minute
// conversation from the `listened` long files at the lobby's place (content/listen/s4-long-*.yaml: generated scenes and
// real recordings, pool.ts listenOf), the piece the host's (its options' `piece`: the sheet's pick, pieceFor), played
// whole before the first question; then 4-5 questions with no clip: the gist, the implied meaning, the attitude, the next
// step (3 English choices). The transcript and a dictation of a line or two near my misses come after, on the results
// page (dictFor; its answers a row of their own). Pure.
//
// Tiers per player on the same audio (GameDef.tier, the listening games' ear: 0 はまべ … 3 やま): at かわ or below, two
// choices (the answer and its first wrong one) and one decoy tile; else as authored. Co-op: everyone answers every
// question, the team has a question when anyone does (the session's `team.all`).
import { fnv1a, mulberry32, shuffle } from '#lib/random.ts';
import type { RosterId } from '../../../villagers/roster.ts';
import type { CastId, Item, Level, Line, Tags } from '../../bank.ts';
import { longDictId, longLevel, longQId, type ListenItem, type ListenPart, type LongDict, type LongQ } from '../../listen.ts';
import type { Tier } from '../../lesson.ts';
import type { GameDef, Round } from '../../round/types.ts';
import { PLAY_UNKNOWN } from '../quiz/kinds.ts';
import { swapsOf } from '../henshin/def.ts';
import { EARS, listenGame, listenOpts, type ListenOpts, type ListenRules, type ListenSource } from '../listened.ts';

export type LongYaml = Extract<ListenItem, { kind: 'long' }>;
/** The answer window's extra for a question (ms): three English sentences to read. */
const READ_MS = 8000;
/** At this ear or below (かわ), the easy tier. */
const EASY_EAR = 1;
/** A miss's dictation lines, at most; with no miss, one. */
export const DICT_MAX = 2;

/** Its options: a listening game's (the place's level, こたえる じかん, the host's ear) and the piece (its place among the
 *  place's pieces by id: piecesAt). */
export interface LongOpts extends ListenOpts {
  piece: number;
}
export const longOpts = {
  encode: (o: LongOpts): number[] => [...listenOpts.encode(o), o.piece],
  decode: (a: readonly number[]): LongOpts | null => {
    const base = listenOpts.decode(a), piece = a[3] ?? 0;
    return base && Number.isInteger(piece) && piece >= 0 && piece < 64 ? { ...base, piece } : null;
  }
};

/** A piece's speaker as the stage and the transcript show them: a villager (a generated piece) or a real speaker (their
 *  name in English and Japanese). */
export interface LongSpeaker {
  key: string;
  villager?: RosterId;
  name?: string;
  ja?: string;
  g?: 'f' | 'm';
}
/** A dealt question, as the sheet's game holds it: the first's Item plays the piece (its lines, each with its clip and
 *  gap: a real piece's end to end), the others have no clip. */
export interface LongCard extends Item {
  quietReveal: true;
  long: {
    q: LongQ['type'];
    /** The piece's id, its title, whether it's a real recording, its speakers (by first line), its credit. */
    of: string;
    name: string;
    real: boolean;
    speakers: readonly LongSpeaker[];
    credit?: LongYaml['credit'];
    /** The question (UI copy) and the line that answers it. */
    ask: string;
    line: number;
    /** The piece's dictation lines (dictFor picks from them). */
    dict: readonly LongDict[];
  };
}

/** The pieces at a place, by id: what `piece` counts in. */
export const piecesAt = (parts: readonly ListenPart[]): LongYaml[] =>
  parts.flatMap((p) => p.items.flatMap((it) => (it.kind === 'long' ? [it] : []))).sort((a, b) => (a.id < b.id ? -1 : 1));

/** A piece's speakers, by first line. */
export function speakersOf(it: LongYaml): LongSpeaker[] {
  const keys = [...new Set(it.lines.map((l) => l.who))];
  return keys.map((key) => {
    const s = it.speakers?.[key];
    return s ? { key, name: s.name, ja: s.ja, g: s.g } : { key, villager: key as RosterId };
  });
}

/** A deck's cards from its files' parts: the options' piece (none at that place: the first), its questions in order. */
export function longDeal(parts: readonly ListenPart[], o: Pick<LongOpts, 'piece'> | null): LongCard[] {
  const all = piecesAt(parts);
  if (!all.length) return [];
  const it = all[(o?.piece ?? 0) < all.length ? (o?.piece ?? 0) : 0];
  const stage = parts.find((p) => p.items.includes(it))!.stage;
  const speakers = speakersOf(it), real = it.source === 'real';
  // (a real line's speaker isn't a villager: the cast a stand-in, the stage and transcript show its name)
  const lines = it.lines.map((l): Line & { at: number } => ({
    who: l.who as RosterId, cast: (real ? (it.speakers?.[l.who]?.g === 'm' ? 'us-m1' : 'us-f1') : 'us-f1') as CastId, en: l.en, ja: l.ja, clip: l.clip,
    at: real ? 0 : (l.at ?? 0)
  }));
  const head = speakers[0];
  const base = {
    lv: longLevel(stage) as Level, ja: '', speaker: (head.villager ?? 'isabelle') as RosterId, voice: 'us' as const, note: it.note, tags: it.tags as Tags,
    quietReveal: true as const, ...(it.ctx && { ctx: it.ctx }), ...(it.scene && { scene: it.scene })
  };
  const meta = { of: it.id, name: it.name, real, speakers, ...(it.credit && { credit: it.credit }), dict: it.dict };
  return it.questions.map((q, k): LongCard => ({
    ...base, id: longQId(it.id, k), type: q.type === 'next' ? 'gist' : q.type === 'gist' ? 'gist' : 'mean', en: it.lines.map((l) => l.en).join(' '),
    choices: q.choices, answer: q.answer, ...(q.cja && { cja: q.cja }), ...(q.why && { why: q.why }),
    ...(k === 0 && { lines }),
    long: { ...meta, q: q.type, ask: q.ask, line: q.line }
  }));
}

// ---------- the piece of the day ----------

/** A piece as I've heard it: the last day (dayNum) and the questions right of those answered. */
export interface Heard {
  last: number;
  right: number;
  of: number;
}
/** A piece heard with less than this share right comes back once this many days have passed. */
const AGAIN_BELOW = 0.75;
const AGAIN_AFTER = 7;

/** The piece to play (its place in `ids`, the place's pieces by id): the first not heard; else one heard with misses at
 *  least a week ago (the longest ago first: hearing it again is the review); else the least recently heard. */
export function pieceFor(ids: readonly string[], heard: ReadonlyMap<string, Heard>, today: number): number {
  if (!ids.length) return 0;
  const fresh = ids.findIndex((id) => !heard.has(id));
  if (fresh >= 0) return fresh;
  const at = (id: string) => heard.get(id)!;
  const again = ids.filter((id) => at(id).right < AGAIN_BELOW * at(id).of && today - at(id).last >= AGAIN_AFTER).sort((a, b) => at(a).last - at(b).last)[0];
  const pick = again ?? [...ids].sort((a, b) => at(a).last - at(b).last)[0];
  return ids.indexOf(pick);
}

/** The pieces heard in my answers (a question's id is `<piece>-q<n>`): each one's last day and its questions right. */
export function heardOf(answers: readonly { id: string; ok: boolean; day: number }[]): Map<string, Heard> {
  const out = new Map<string, Heard>();
  for (const a of answers) {
    const m = /^(.*)-q\d+$/.exec(a.id);
    if (!m) continue;
    const id = m[1], h = out.get(id);
    // (only the last day's answers count: a piece heard again is judged on that hearing)
    if (!h || a.day > h.last) out.set(id, { last: a.day, right: a.ok ? 1 : 0, of: 1 });
    else if (a.day === h.last) out.set(id, { ...h, right: h.right + (a.ok ? 1 : 0), of: h.of + 1 });
  }
  return out;
}

// ---------- rounds and grading ----------

/** A round: its question's id (the row's), angle, the choices shown (their authored places), the right one, its play
 *  (the first's: the piece's length, ms; the others 0). */
export interface LongRound extends Round {
  kind: 'long';
  q: LongQ['type'];
  shown: readonly number[];
  answer: number;
  play: number;
}

/** A player's tier at an ear: easy at かわ or below, else as authored. */
export const longTier = (ear: number): Tier | undefined => (ear <= EASY_EAR ? 'easy' : undefined);

/** The choices a card shows at a tier: easy the answer and the first wrong one (in their order), else all three. */
export const shownOf = (c: Pick<LongCard, 'choices' | 'answer'>, tier: Tier | undefined): number[] => {
  const wrong = c.choices.findIndex((_, k) => k !== c.answer);
  return c.choices.map((_, k) => k).filter((k) => tier !== 'easy' || k === c.answer || k === wrong);
};

/** A deck's rounds at an ear (`playMs`: the piece's length, unknown: undefined). */
export const longRounds = (cards: readonly LongCard[], o: Pick<ListenOpts, 'ear'>, playMs: (c: LongCard) => number | undefined): LongRound[] => {
  const tier = longTier(o.ear);
  return cards.map((c, k) => ({
    kind: 'long', id: c.id, q: c.long.q, shown: shownOf(c, tier), answer: c.answer,
    play: k === 0 ? (playMs(c) ?? PLAY_UNKNOWN * (c.lines?.length ?? 1)) : 0
  }));
};

/** まるごと 聞く's rules (games/listened.ts): the piece plays before the first question, the others have no play; the
 *  answer a choice shown, its authored place the row's `pick`. */
export const LONG: ListenRules<LongCard, LongRound> = {
  id: 'long',
  rounds: (cards, _seed, o, playMs) => longRounds(cards, o, playMs),
  timing: (r, answer, w) => (r?.play ? { lead: w.lead, play: r.play, answer: answer + READ_MS } : { lead: 0, play: 0, answer: answer + READ_MS }),
  valid: (r, a) => typeof a === 'number' && r.shown.includes(a),
  ok: (r, a) => a === r.answer,
  pick: (_r, a) => a as number
};

/** The game: a listening game's, the piece in its options (kept when a player's tier is set). */
export function longGame(src: ListenSource<LongCard>): GameDef<LongOpts> {
  const g = listenGame(LONG, src);
  return { ...g, opts: longOpts, tier: { of: (o) => o.ear, with: (o, tr) => ({ ...o, ear: Math.max(0, Math.min(EARS - 1, tr)) }) } };
}

// ---------- the dictation (the results page's: on this phone) ----------

/** The piece's dictation lines for my answers (the cards' and mine, as the view keeps them: a choice, or none): for
 *  each question I missed, in order, the dictation line nearest its answering line not yet taken, at most DICT_MAX;
 *  with no miss, the one nearest the last question's line. */
export function dictFor(cards: readonly Pick<LongCard, 'answer' | 'long'>[], answers: readonly (number | null)[]): LongDict[] {
  const pool = cards[0]?.long.dict ?? [];
  const missed = cards.filter((c, i) => answers[i] !== c.answer).map((c) => c.long.line);
  const want = missed.length ? missed : cards.length ? [cards.at(-1)!.long.line] : [];
  const out: LongDict[] = [];
  for (const line of want) {
    const near = pool.filter((d) => !out.includes(d)).sort((a, b) => Math.abs(a.line - line) - Math.abs(b.line - line) || a.line - b.line)[0];
    if (near) out.push(near);
    if (out.length >= (missed.length ? DICT_MAX : 1)) break;
  }
  return out;
}

/** A dictation line's words. */
export const dictWords = (d: Pick<LongDict, 'words'>): string[] => d.words.split(/\s+/).filter(Boolean);

/** A dictation's tiles at a tier: its words and decoys (each word's near sounds: 音の へんしん's swaps; easy one, else
 *  three), shuffled by the piece and the line (never in order). */
export function dictBoard(piece: string, d: LongDict, tier: Tier | undefined): string[] {
  const words = dictWords(d), taken = new Set(words.map((w) => w.toLowerCase())), decoys: string[] = [];
  for (const w of words) for (const s of swapsOf(w)) if (!taken.has(s.toLowerCase())) (taken.add(s.toLowerCase()), decoys.push(s));
  const all = [...words, ...decoys.slice(0, tier === 'easy' ? 1 : 3)], r = mulberry32(fnv1a(`${piece}:${d.line}`) >>> 0);
  for (let k = 0; k < 8; k++) {
    const b = shuffle([...all], r);
    if (words.length < 2 || b.filter((w) => words.includes(w)).join(' ') !== words.join(' ')) return b;
  }
  return [...all.slice(1), all[0]];
}

/** A dictation's answer as its row's: the line's id (longDictId), right when every word is, the wrong words as a mask. */
export function dictRow(piece: string, d: LongDict, ok: readonly boolean[], replays: number): [string, 0 | 1, number, number] {
  const mask = ok.reduce((m, x, j) => (x ? m : m | (1 << j)), 0);
  return [longDictId(piece, d.line), mask === 0 ? 1 : 0, mask, Math.min(99, replays)];
}
