// ようじ でんわ as a GameDef (docs/curriculum-wave2.md §2.3): 3 calls from the `listened` call files at the lobby's place
// (content/listen/s*-call*.yaml, pool.ts listenOf), each 2 rounds of a memo of chip rows (what, how many, when, where):
// the call plays in round 1 (its memo filled while it plays), round 2 has no play (the rest of the memo, remembered).
// A call with two memo rounds plays them as authored; one memo is split, its first half in round 1. The answer is the
// chip picked per row (≤ 12 ints; EMPTY a row not filled). Pure.
//
// Tiers per player on the same audio (GameDef.tier): each player's `ear` against the deck's place (ことば タイル's
// tierAt): easy 2 rows, as authored 3, hard 4 and an extra sound-trap chip on a number's row (fourteen / forty, a
// digit swapped).
//
// Co-op 「わけて メモ」 (two roles): both hear the whole call; a round's rows split, role 0 the 1st, 3rd…, role 1 the
// others (a round of one row: both). Each player is right when all of theirs are; the team's memo is the union (the
// session's `team.all`: both right).
import { mulberry32, shuffle } from '#lib/random.ts';
import type { ListenRow } from '../../../contract/listen.ts';
import type { RosterId } from '#lib/villagers/roster.ts';
import type { CastId, Item, Level, Tags } from '../../bank.ts';
import { PLACES } from '../../catalog.ts';
import type { ListenEntry, ListenItem, ListenPart } from '../../listen.ts';
import { RIGHT } from '../../score.ts';
import { TIMERS } from '../../seed.ts';
import type { Tier } from '../../lesson.ts';
import type { AnswerValue, GameDef, Graded, Round, RoundDeck, RoundWindows } from '../../round/types.ts';
import { PLAY_UNKNOWN } from '../quiz/kinds.ts';
import { tierAt, tileOpts, type TileOpts } from '../tile/def.ts';

/** A game's calls (2 rounds each: 6, within the row's 12). */
export const CALL_QS = 3;
/** A row not filled (the wire's ints are 0-63). */
export const EMPTY = 63;
/** The answer window's extra per memo row (ms). */
const PER_ROW = 2500;
/** The roles of a co-op memo. */
const ROLES = 2;
/** How many rows a call's memo has at a tier (both rounds). */
const ROWS: Record<Tier | 'as', number> = { easy: 2, as: 3, hard: 4 };

/** A call's lobby options: as ことば タイル's (its level, こたえる じかん, the host's ear). */
export type CallOpts = TileOpts;
export const callOpts = tileOpts;

type CallYaml = Extract<ListenItem, { kind: 'call' }>;

/** A memo row as authored: its question, chips and answer, their Japanese; `n` its place in the call's memo (the row's
 *  wrong-rows mask). */
export interface MemoRow {
  n: number;
  ask: string;
  options: readonly string[];
  answer: number;
  cja?: readonly string[];
}
/** A call's line as shown: mine or the caller's, its Japanese, a mid-call change (`repair`), a line breaking up
 *  (`drop`: a `signal` call's line with "...", docs/kikimimi.md "Conditions"). */
interface CallLine {
  me: boolean;
  en: string;
  ja: string;
  repair?: true;
  drop?: true;
}
/** A call: its id (the row's), caller, lines and memo rounds (each with its 解説). */
export interface CallInfo {
  id: string;
  caller: RosterId;
  lines: readonly CallLine[];
  memo: readonly { rows: readonly MemoRow[]; why?: string }[];
}
/** A dealt round, as the sheet's game holds it (an Item): round 1 the call itself (its `lines`: its clips, played on
 *  the relay's clock), round 2 the same call with no clip of its own (`<id>-memo`: nothing plays). */
export interface CallCard extends Item {
  call: { info: CallInfo; part: 0 | 1 };
  /** No replay at its reveals (clipPlayer's hint: a 20-40 s call; 🔁 plays it on a tap). */
  quietReveal: true;
}

/** A level's place (0 はまべ … 4 ほし; -1 none). */
const placeOf = (lv: number): number => PLACES.findIndex((p) => p.lvs.includes(lv));

/** The call files a level's deck deals from: the `listened` ones at its place, by name. */
export function callFiles(lv: number, listen: Readonly<Record<string, ListenEntry>>): string[] {
  const stage = placeOf(lv) + 1;
  return Object.entries(listen).filter(([, [g, st, s]]) => g === 'call' && st === stage && s === 'listened').map(([u]) => u).sort();
}

/** A call as shown, from its YAML. */
export function infoOf(it: CallYaml): CallInfo {
  const signal = !!it.tags.conditions?.includes('signal');
  let n = 0;
  return {
    id: it.id,
    caller: (it.lines.find((l) => l.who !== 'me')?.who ?? 'isabelle') as RosterId,
    lines: it.lines.map((l) => ({ me: l.who === 'me', en: l.en, ja: l.ja, ...(l.repair && { repair: true as const }), ...(signal && l.en.includes('...') && { drop: true as const }) })),
    memo: it.memo.map((m) => ({ rows: m.slots.map((s) => ({ n: n++, ask: s.ask, options: s.options, answer: s.answer, ...(s.cja && { cja: s.cja }) })), ...(m.why && { why: m.why }) }))
  };
}

/** A call's two rounds as dealt. */
function cardsOf(it: CallYaml, stage: number): CallCard[] {
  const info = infoOf(it), caller = info.caller;
  const base = {
    lv: PLACES[stage - 1]?.lvs[0] as Level, type: 'gist' as const, en: it.lines.map((l) => l.en).join(' '), ja: '', speaker: caller, voice: 'us' as const,
    choices: [], answer: 0, quietReveal: true as const, note: it.note, tags: it.tags as Tags, ...(it.ctx && { ctx: it.ctx }), ...(it.scene && { scene: it.scene }), ...(it.channel && { channel: it.channel })
  };
  // (round 1's lines: each its clip `<id>-<n>`; who speaks is the caller's head on the phone, mine included)
  const lines = it.lines.map((l) => ({ who: caller, cast: 'us-m3' as CastId, en: l.en, ja: l.ja }));
  return [{ ...base, id: it.id, lines, call: { info, part: 0 } }, { ...base, id: `${it.id}-memo`, call: { info, part: 1 } }];
}

/** A deck's rounds from its files' parts: 3 calls by the seed (each with 2 memo rows at least), 2 rounds each. */
export function callDeal(seed: number, parts: readonly ListenPart[]): CallCard[] {
  const pool = parts.flatMap((p) => p.items.flatMap((it) => (it.kind === 'call' && it.memo.flatMap((m) => m.slots).length >= 2 ? [{ it, stage: p.stage }] : [])));
  return shuffle(pool, mulberry32((seed ^ 0xca11) >>> 0)).slice(0, CALL_QS).flatMap((c) => cardsOf(c.it, c.stage));
}

// ---------- tiers and rows ----------

/** A call's rows in its two rounds at a tier: two memo rounds, each its first rows (round 1 at most half); one, its
 *  first rows split in two, the first half in round 1. */
export function roundRows(info: CallInfo, tier: Tier | undefined): [MemoRow[], MemoRow[]] {
  const k = ROWS[tier ?? 'as'];
  if (info.memo.length > 1) {
    const [a, b] = info.memo, ka = Math.min(a.rows.length, Math.ceil(k / 2));
    return [a.rows.slice(0, ka), b.rows.slice(0, Math.max(1, k - ka))];
  }
  const all = info.memo[0].rows.slice(0, k), h = Math.ceil(all.length / 2);
  return [all.slice(0, h), all.slice(h)];
}

/** The first number in a chip (commas dropped), or NaN. */
const numOf = (s: string): number => Number(/\d[\d,]*/.exec(s)?.[0].replace(/,/g, '') ?? NaN);

/** A sound trap for a number's row (hard's extra chip): the answer's teen as its -ty or back (14 ↔ 40), else two of
 *  its digits swapped (2816 → 2861); none that's already a chip, none for a row with no number. */
export function trapOf(row: Pick<MemoRow, 'options' | 'answer'>): string | null {
  const ans = row.options[row.answer], has = new Set(row.options);
  const runs = [...ans.matchAll(/\d+/g)];
  for (const m of runs) {
    const d = Number(m[0]);
    const swap = d >= 13 && d <= 19 ? (d - 10) * 10 : d >= 30 && d <= 90 && d % 10 === 0 ? d / 10 + 10 : null;
    const s = swap === null ? null : ans.slice(0, m.index) + swap + ans.slice(m.index! + m[0].length);
    if (s && !has.has(s)) return s;
  }
  for (const m of runs) {
    for (let j = 0; j + 1 < m[0].length; j++) {
      const ds = [...m[0]];
      if (ds[j] === ds[j + 1] || (j === 0 && ds[1] === '0')) continue;
      [ds[j], ds[j + 1]] = [ds[j + 1], ds[j]];
      const s = ans.slice(0, m.index) + ds.join('') + ans.slice(m.index! + m[0].length);
      if (!has.has(s)) return s;
    }
  }
  return null;
}

/** A row's chips at a tier: as authored; hard, its sound trap among them (in order when they read as ascending
 *  numbers, else last). The right chip's index with it. */
export function chipsOf(row: MemoRow, tier: Tier | undefined): { chips: string[]; answer: number } {
  const trap = tier === 'hard' ? trapOf(row) : null;
  if (!trap) return { chips: [...row.options], answer: row.answer };
  const ns = row.options.map(numOf), up = ns.every((x, j) => Number.isFinite(x) && (j === 0 || x > ns[j - 1]));
  const at = up ? ns.filter((x) => x < numOf(trap)).length : row.options.length;
  return { chips: [...row.options.slice(0, at), trap, ...row.options.slice(at)], answer: row.answer + (at <= row.answer ? 1 : 0) };
}

// ---------- rounds and grading ----------

/** A memo row as a round asks it: its place in the call's memo, question and chips at the player's tier. */
export interface AskedRow {
  n: number;
  ask: string;
  chips: readonly string[];
  answer: number;
}
/** A round: the call's id (the row's), which of its two, its rows at the player's tier, the call's length (ms; round 2:
 *  0). */
export interface CallRound extends Round {
  kind: 'call';
  part: 0 | 1;
  rows: readonly AskedRow[];
  play: number;
}

/** A deck's rounds at an ear (`playMs`: a call's length, unknown: undefined). */
export function callRounds(cards: readonly CallCard[], o: Pick<CallOpts, 'lv' | 'ear'>, playMs: (it: Item) => number | undefined): CallRound[] {
  const tier = tierAt(o.ear, o.lv);
  return cards.map((c) => {
    const { info, part } = c.call;
    const rows = roundRows(info, tier)[part].map((r) => ({ n: r.n, ask: r.ask, ...chipsOf(r, tier) }));
    return { kind: 'call', id: info.id, part, rows, play: part ? 0 : (playMs(c) ?? PLAY_UNKNOWN * info.lines.length) };
  });
}

/** A role's rows of a round of n (solo: every one; a round of one row: both roles'). */
export const rowsOf = (n: number, role: number | null): number[] => Array.from({ length: n }, (_, j) => j).filter((j) => role === null || n === 1 || j % ROLES === role % ROLES);

/** An answer's filled rows. */
const filled = (a: readonly number[]): number[] => a.flatMap((x, j) => (x === EMPTY ? [] : [j]));

/** Whether row j holds its right chip. */
export const rowOk = (r: Pick<CallRound, 'rows'>, a: readonly number[], j: number): boolean => a[j] !== EMPTY && a[j] === r.rows[j]?.answer;

export function callValid(r: Pick<CallRound, 'rows'>, a: AnswerValue): a is readonly number[] {
  if (!Array.isArray(a) || a.length !== r.rows.length) return false;
  return filled(a).length > 0 && a.every((x, j) => Number.isInteger(x) && x >= 0 && (x === EMPTY || x < r.rows[j].chips.length));
}

/** Right: every row filled holds its chip, and they're the whole memo or one role's share. */
export function callOk(r: Pick<CallRound, 'rows'>, a: readonly number[]): boolean {
  const f = filled(a), n = r.rows.length;
  const whole = f.length === n || Array.from({ length: ROLES }, (_, k) => rowsOf(n, k)).some((s) => s.join() === f.join());
  return whole && f.every((j) => rowOk(r, a, j));
}

/** The rows an answer got wrong, as a bitmask over the call's memo (the row's `pick`, 0-4095): those filled with
 *  another chip. */
export const wrongMask = (r: Pick<CallRound, 'rows'>, a: readonly number[]): number => filled(a).reduce((m, j) => (rowOk(r, a, j) ? m : m | (1 << r.rows[j].n)), 0);

/** The team's memo: each of the call's memo rows (by `n`) from whoever filled it, its chip and whether it's right; a
 *  row both filled (a round of one row) a wrong chip over a right one, so it's the team's only when both got it, as the
 *  session's `team.all` says. A row no one filled is absent. */
export function unionOf(answers: readonly { round: Pick<CallRound, 'rows'>; a: readonly number[] }[]): Map<number, { chip: string; ok: boolean }> {
  const out = new Map<number, { chip: string; ok: boolean }>();
  for (const { round, a } of answers)
    round.rows.forEach((row, j) => {
      if (a[j] === undefined || a[j] === EMPTY) return;
      const ok = a[j] === row.answer, was = out.get(row.n);
      if (!was || (was.ok && !ok)) out.set(row.n, { chip: row.chips[a[j]] ?? '', ok });
    });
  return out;
}

/** A player's deck at their ear. */
function callDeck(rounds: () => readonly CallRound[], o: CallOpts, w: RoundWindows): RoundDeck {
  const base = w.answers[Math.max(0, TIMERS.indexOf(o.timer))];
  const none: Graded = { ok: false, pts: 0 };
  return {
    get count() {
      return rounds().length;
    },
    round: (i) => rounds()[i],
    timing: (i) => {
      const r = rounds()[i];
      return { lead: w.lead, play: r?.play ?? 0, answer: base + PER_ROW * (r?.rows.length ?? 0) };
    },
    valid: (i, a) => {
      const r = rounds()[i];
      return !!r && callValid(r, a);
    },
    grade: (i, a) => {
      const r = rounds()[i];
      if (!r || !callValid(r, a)) return none;
      const ok = callOk(r, a);
      return { ok, pts: ok ? RIGHT : 0 };
    },
    get maxScore() {
      return RIGHT * rounds().length;
    }
  };
}

/** Where a game's rounds come from (the phone's decks: lane.ts; a test's): its cards for a seed and options, a call's
 *  length, and its content version (its files'). */
export interface CallSource {
  cards(seed: number, o: CallOpts): readonly CallCard[];
  playMs(it: Item): number | undefined;
  cv?(o: CallOpts): string | undefined;
}

/** A deck's rounds kept per its cards and ear (the session reads them at every call). */
const ROUNDS = new WeakMap<readonly CallCard[], Map<string, readonly CallRound[]>>();
function roundsOf(cards: readonly CallCard[], o: CallOpts, playMs: CallSource['playMs']): readonly CallRound[] {
  let by = ROUNDS.get(cards);
  if (!by) ROUNDS.set(cards, (by = new Map()));
  const k = `${o.lv}:${o.ear}`;
  let rs = by.get(k);
  if (!rs) by.set(k, (rs = callRounds(cards, o, playMs)));
  return rs;
}

export function callGame(src: CallSource): GameDef<CallOpts> {
  return {
    id: 'call',
    modes: { solo: true, coop: true, vs: false, same: true },
    opts: callOpts,
    deck: (seed, o, ctx) => callDeck(() => roundsOf(src.cards(seed, o), o, src.playMs), o, ctx.w),
    cv: (o) => src.cv?.(o),
    tier: { of: (o) => o.ear, with: (o, tr) => ({ ...o, ear: Math.max(0, Math.min(3, tr)) }) },
    roles: ROLES
  };
}

/** My answers of a game as its `listen` row's (contract/listen.ts): each round I had, by its call, right or not, the
 *  wrong rows' mask over the call's memo as `pick` (-1: no answer), my replays. */
export function callRecord(rounds: readonly CallRound[], answers: readonly (AnswerValue | null)[], had: readonly boolean[], rp: readonly number[], done: boolean): ListenRow['r'] {
  return rounds.flatMap((r, i): ListenRow['r'] => {
    const a = answers[i];
    if (!had[i] || (!a && !done)) return [];
    const valid = !!a && callValid(r, a);
    return [[r.id, valid && callOk(r, a) ? 1 : 0, valid ? wrongMask(r, a) : -1, Math.min(99, rp[i] ?? 0)]];
  }).slice(0, 12);
}

/** A row's answer read back (きろく, a test): the memo rows its mask says were wrong. */
export const wrongRows = (info: CallInfo, pick: number): MemoRow[] => (pick < 0 ? [] : info.memo.flatMap((m) => m.rows).filter((r) => pick & (1 << r.n)));
