// たちぎき as a GameDef (docs/kikimimi-engine.md "たちぎき"): two conversations overheard, three speakers each, from the
// `listened` tachi files at the lobby's place (content/listen/s*-tachi*.yaml, pool.ts listenOf). Each conversation is
// three rounds: opinions (whose claim is whose: three faces to three claims), changed (who changed their mind: a face)
// and plan (what happens next: 3-4 English choices). Its clip plays before the opinions round only (the lines in turn,
// each its `at` after the one before, overlaps on the audio clock: clips.ts sequenceStarts); the other two have none.
// Pure.
//
// Answers: opinions an array of 3 (each claim's speaker, 0-2 by first line; EMPTY none), the others a choice. Tiers per
// player (GameDef.tier), the same audio: each player's `ear` (0 はまべ … 3 やま, taikai's tierOf) below the deck's place
// is easy, the third speaker's claim placed for them.
//
// Co-op 「たんとう」 (two roles): each player follows one speaker, role 0 the first, role 1 the second, and the third is
// shared. In the opinions round each places their own face and the shared one (the partner's is theirs): right when
// those are; the team has it when both are (the session's `team.all`). The other rounds everyone answers.
import { mulberry32, shuffle } from '#lib/random.ts';
import type { ListenRow } from '../../../contract/listen.ts';
import type { RosterId } from '../../../villagers/roster.ts';
import type { Item, Level, Line, Tags } from '../../bank.ts';
import { PLACES } from '../../catalog.ts';
import type { ListenItem, ListenPart } from '../../listen.ts';
import type { AnswerValue, GameDef, Round } from '../../round/types.ts';
import { PLAY_UNKNOWN } from '../quiz/kinds.ts';
import { EMPTY, ROLES, listenGame, listenRecord, tierAt, type ListenOpts, type ListenRules, type ListenSource } from '../listened.ts';

/** A game's conversations, and its rounds (3 each). */
const TACHI_CONVS = 2;
export const TACHI_QS = TACHI_CONVS * 3;
/** The opinions round's extra answer time (ms): three faces to place. */
const MATCH_MS = 10_000;
/** The shared speaker (by first line). */
export const SHARED = 2;

type TachiYaml = Extract<ListenItem, { kind: 'tachi' }>;
type TachiType = TachiYaml['rounds'][number]['type'];
/** Each round's suffix on its row's id (the item's id and this: an SRS card of its own). */
const SUFFIX: Readonly<Record<TachiType, string>> = { opinions: 'op', changed: 'ch', plan: 'pl' };


/** A dealt round, as the sheet's game holds it: an Item whose id is the conversation's (its lines' clips, `<id>-<n>`),
 *  its lines with their offsets, the round's help (`ctx`, `why`; the plan's `ja` and `cja`), the bed it plays over,
 *  and the round. */
export interface TachiCard extends Item {
  lines: readonly (Line & { at?: number })[];
  /** The party bed under the whole conversation (a file tagged `party`: clipPlayer.svelte.ts). */
  bed?: 'party';
  /** No replay at its reveals (clipPlayer.svelte.ts): its lines replay one at a time. */
  quietReveal: true;
  tachi: {
    /** The row's id (the item's and the round's suffix). */
    row: string;
    type: TachiType;
    /** Its round in the conversation (0 opinions, 1 changed, 2 plan) and its conversation in the game. */
    k: number;
    conv: number;
    /** The speakers, by first line (a face's index). */
    who: readonly RosterId[];
    /** Opinions: the claims (UI copy) and each one's speaker; changed: the speaker; plan: the right choice. */
    claims?: readonly string[];
    answer: readonly number[] | number;
    /** The plan's question (UI copy). */
    ask?: string;
  };
}

/** The speakers of a conversation, by first line. */
const speakers = (it: Pick<TachiYaml, 'lines'>): RosterId[] => [...new Set(it.lines.map((l) => l.who as RosterId))];

/** A conversation's three rounds as dealt (its `conv` in the game). */
function cardsOf(it: TachiYaml, stage: number, conv: number): TachiCard[] {
  const who = speakers(it), lv = PLACES[stage - 1]?.lvs[0] as Level;
  const lines = it.lines.map((l) => ({ who: l.who as RosterId, cast: 'us-f1', en: l.en, ja: l.ja, ...(l.at !== undefined && { at: l.at }) }) as Line & { at?: number });
  const party = it.tags.conditions?.includes('party');
  return it.rounds.map((r, k): TachiCard => {
    const base = {
      id: it.id, lv, type: 'gist' as const, en: lines.map((l) => l.en).join(' '), ja: r.type === 'plan' ? r.ja : '', speaker: who[0], voice: 'us' as const, note: it.note,
      tags: it.tags as Tags, lines, quietReveal: true as const, ...(party && { bed: 'party' as const }), ...(r.ctx && { ctx: r.ctx }), ...(r.why && { why: r.why }),
      ...(it.scene && { scene: it.scene }), ...(it.channel && { channel: it.channel }), ...(it.ask && { ask: it.ask })
    };
    const tachi = { row: `${it.id}-${SUFFIX[r.type]}`, type: r.type, k, conv, who };
    if (r.type === 'opinions') return { ...base, choices: r.claims, answer: 0, tachi: { ...tachi, claims: r.claims, answer: r.answer.map((w) => who.indexOf(w)) } };
    if (r.type === 'changed') return { ...base, choices: who, answer: who.indexOf(r.answer), tachi: { ...tachi, answer: who.indexOf(r.answer) } };
    return { ...base, choices: r.choices, answer: r.answer, ...(r.cja && { cja: r.cja }), tachi: { ...tachi, answer: r.answer, ask: r.ask } };
  });
}

/** A deck's rounds from its files' parts: two conversations by the seed, each its three rounds in turn. */
export function tachiDeal(seed: number, parts: readonly ListenPart[]): TachiCard[] {
  const pool = parts.flatMap((p) => p.items.flatMap((it) => (it.kind === 'tachi' ? [{ it, stage: p.stage }] : [])));
  return shuffle(pool, mulberry32((seed ^ 0x7ac1) >>> 0)).slice(0, TACHI_CONVS).flatMap(({ it, stage }, conv) => cardsOf(it, stage, conv));
}

// ---------- rounds and grading ----------

/** A round: its row's id, type, answer, whether the third speaker's claim is placed (easy), its clip's length (ms). */
export interface TachiRound extends Round {
  kind: 'tachi';
  type: TachiType;
  answer: readonly number[] | number;
  given: boolean;
  play: number;
  /** The choices it takes (opinions: the speakers; else its choices). */
  n: number;
}

/** A deck's rounds at an ear (`playMs`: a conversation's length, unknown: PLAY_UNKNOWN). */
export const tachiRounds = (cards: readonly TachiCard[], o: Pick<ListenOpts, 'lv' | 'ear'>, playMs: (c: TachiCard) => number | undefined): TachiRound[] => {
  const given = tierAt(o.ear, o.lv) === 'easy';
  return cards.map((c) => ({
    kind: 'tachi', id: c.tachi.row, type: c.tachi.type, answer: c.tachi.answer, given: given && c.tachi.type === 'opinions',
    play: c.tachi.k === 0 ? (playMs(c) ?? PLAY_UNKNOWN) : 0, n: c.tachi.type === 'opinions' ? c.tachi.who.length : c.choices.length
  }));
};

/** The speakers a player places in the opinions round: solo all three; co-op their own and the shared one. */
export const facesOf = (role: number | null): number[] => (role === null ? [0, 1, 2] : [role % ROLES, SHARED]);

/** The claim the third speaker holds (easy: placed for you). */
export const givenClaim = (answer: readonly number[]): number => answer.indexOf(SHARED);

export function tachiValid(r: Pick<TachiRound, 'type' | 'n'>, a: AnswerValue): boolean {
  if (r.type !== 'opinions') return typeof a === 'number' && Number.isInteger(a) && a >= 0 && a < r.n;
  if (!Array.isArray(a) || a.length !== 3) return false;
  const used = (a as readonly number[]).filter((x) => x !== EMPTY);
  return used.length > 0 && a.every((x) => x === EMPTY || (Number.isInteger(x) && x >= 0 && x < r.n)) && new Set(used).size === used.length;
}

/** Right: a choice the right one; opinions every face placed at its claim, and they're all three or one role's two. */
export function tachiOk(r: Pick<TachiRound, 'type' | 'answer'>, a: AnswerValue): boolean {
  if (r.type !== 'opinions') return a === r.answer;
  const want = r.answer as readonly number[], got = a as readonly number[];
  const placed = got.filter((x) => x !== EMPTY).sort().join();
  return [facesOf(null), facesOf(0), facesOf(1)].some((f) => [...f].sort().join() === placed) && got.every((x, j) => x === EMPTY || x === want[j]);
}

/** たちぎき's rules (games/listened.ts): the opinions round (the one that plays) its extra time to place three faces,
 *  the others no lead and no play; the answer as `pick`. */
export const TACHI: ListenRules<TachiCard, TachiRound> = {
  id: 'tachi',
  rounds: (cards, _seed, o, playMs) => tachiRounds(cards, o, playMs),
  timing: (r, answer, w) => (r?.play ? { lead: w.lead, play: r.play, answer: answer + MATCH_MS } : { lead: 0, play: 0, answer }),
  valid: tachiValid,
  ok: tachiOk,
  pick: (r, a) => pickOf(r, a)
};

export const tachiGame = (src: ListenSource<TachiCard>): GameDef<ListenOpts> => listenGame(TACHI, src);

/** An answer as a row's `pick` (0-63): a choice itself; opinions each claim's speaker in base 4 (3: none). */
export const pickOf = (r: Pick<TachiRound, 'type'>, a: AnswerValue): number =>
  r.type === 'opinions' ? (a as readonly number[]).reduce((s, x, j) => s + (x === EMPTY ? 3 : x) * 4 ** j, 0) : (a as number);

/** A row's opinions pick read back (a test; きろく later): each claim's speaker (EMPTY none). */
export const opinionsOf = (pick: number): number[] => [0, 1, 2].map((j) => Math.floor(pick / 4 ** j) % 4).map((x) => (x === 3 ? EMPTY : x));

/** My answers of a game as its `listen` row's: my answer as `pick`. */
export const tachiRecord = (rounds: readonly TachiRound[], answers: readonly (AnswerValue | null)[], had: readonly boolean[], rp: readonly number[], done: boolean): ListenRow['r'] =>
  listenRecord(TACHI, rounds, answers, had, rp, done);
