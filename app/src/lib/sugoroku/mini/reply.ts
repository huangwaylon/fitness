// 10 返事はどれ？ — Reply Match (docs/sugoroku.md "みんなで！"): 4 everyday exchanges in 60 s (data/replies.json: a line, the
// one reply that fits, three that don't, each with its Japanese). Each round one seat asks (the lander, then the next
// seat): their phone shows the line (said aloud at a table). The others each hold replies (two each at 3 seats, three
// at 2 seats; alone, the asker holds three), the fitting one in one hand: whoever has it taps it (`k`, the hand's index),
// and it slides onto every phone's chat; one that doesn't fit is 「おしい！」 (and can't be tapped again). The round's
// timer (REPLY_TURN_MS, the sheet's): a stage's `next` from anyone shows the reply and moves on (its holder gone, or
// stuck). Lines at the table's lowest level (やさしい A1 ones; else A1–A2); the closest wrong reply (`x[0]`: "Me
// neither" for "Me too") to the strongest replier, the plainly wrong ones to やさしい (the Japanese under each: the
// sheet's). Stars to everyone present: 2 a reply found, +2 when all four were found with no おしい.
import { seeded, shuffle } from '#lib/random.ts';
import type { Who } from '#lib/types.ts';
import { isStage } from './hands.ts';
import { capStars } from './stars.ts';
import type { Deal, Hand, MiniGame, MiniMade, Play, Result } from './types.ts';

/** An exchange: a line, the reply that fits, three that don't (the closest first), each [English, Japanese]; its
 *  level (1 A1, 2 A2), topic, and the フレーズ card it came from (`clip/qid`), when it did. */
export interface Exchange { id: string; t: string; lv: 1 | 2; q: [string, string]; a: [string, string]; x: [string, string][]; src?: string }

export const REPLY_ROUNDS = 4;
export const REPLY_TURN_MS = 15_000;
const FOUND = 2, CLEAN = 2;

interface ReplyRound {
  asker: Who;
  /** Its exchange (data.ts: the deal's). */
  ex: Exchange;
  /** Each replier's cards: 0 the reply that fits, 1–3 the exchange's `x` (1 the closest). */
  hands: Partial<Record<Who, number[]>>;
}
export interface ReplyState {
  seats: Hand[];
  rounds: ReplyRound[];
  r: number;
  stage: number;
  /** The round's cards tapped that didn't fit: each seat's hand indices. */
  tried: Partial<Record<Who, number[]>>;
  /** The rounds played: who found it (null: shown on the timer), the おしい on the way. */
  results: { by: Who | null; misses: number }[];
}

/** A card's line [English, Japanese]. */
export const cardLine = (ex: Exchange, card: number): [string, string] => (card === 0 ? ex.a : ex.x[card - 1]);

function dealRounds(d: Deal, EXCHANGES: readonly Exchange[]): ReplyRound[] {
  const r = seeded(`${d.seed}:reply`), n = d.seats.length;
  const from = Math.max(0, d.seats.findIndex((s) => s.who === d.lander));
  const low = Math.min(...d.seats.map((s) => s.level));
  const fresh = EXCHANGES.map((_, i) => i).filter((i) => !d.used.lines.has(EXCHANGES[i].q[0]));
  const ok = fresh.filter((i) => EXCHANGES[i].lv === 1 || low >= 2);
  const picks = shuffle(ok.length >= REPLY_ROUNDS ? ok : EXCHANGES.map((_, i) => i), r).slice(0, REPLY_ROUNDS);
  return picks.map((ex, k) => {
    const asker = d.seats[(from + k) % n];
    const repliers = n === 1 ? [asker] : d.seats.filter((s) => s.who !== asker.who);
    // the cards: two each at 3 seats, three for one replier; the fitting one to a seeded replier
    const size = repliers.length >= 2 ? 2 : 3;
    const holder = repliers[Math.floor(r() * repliers.length)];
    // the wrong ones closest first to the strongest (ties: seat order), the plainest to やさしい
    const order = [...repliers].sort((a, b) => b.level - a.level || d.seats.indexOf(a) - d.seats.indexOf(b));
    const wrong = [1, 2, 3], hands: ReplyRound['hands'] = {};
    for (const s of order) hands[s.who] = s.who === holder.who ? [0] : [];
    for (const s of order) {
      const h = hands[s.who]!;
      while (h.length < size && wrong.length) h.push(s.level === 1 ? wrong.pop()! : wrong.shift()!);
    }
    for (const s of order) hands[s.who] = shuffle(hands[s.who]!, r);
    return { asker: asker.who, ex: EXCHANGES[ex], hands };
  });
}

/** The round's exchange, or null when all are played. */
export const replyOn = (s: ReplyState): Exchange | null => s.rounds[s.r]?.ex ?? null;

function nextRound(s: ReplyState, by: Who | null): ReplyState {
  const misses = Object.values(s.tried).reduce((n, t) => n + (t?.length ?? 0), 0);
  return { ...s, r: s.r + 1, stage: s.stage + 1, tried: {}, results: [...s.results, { by, misses }] };
}

export const reply: MiniGame<ReplyState> = {
  deal: (d, ctx) => ({ seats: [...d.seats], rounds: dealRounds(d, ctx.mini.replies), r: 0, stage: 0, tried: {}, results: [] }),
  play(s, who, p: Play) {
    const round = s.rounds[s.r];
    if (!round) return s;
    if (p.op !== undefined) return p.op === 'next' && isStage(p, s.stage) ? nextRound(s, null) : s;
    const hand = round.hands[who], tried = s.tried[who] ?? [];
    if (!hand || p.k === undefined || p.k >= hand.length || tried.includes(p.k)) return s;
    if (hand[p.k] === 0) return nextRound(s, who);
    return { ...s, tried: { ...s.tried, [who]: [...tried, p.k] } };
  },
  done: (s) => s.r >= s.rounds.length,
  close(s): Result {
    const found = s.results.filter((x) => x.by !== null);
    const clean = s.results.length === REPLY_ROUNDS && s.results.every((x) => x.by !== null && x.misses === 0);
    const each = FOUND * found.length + (clean ? CLEAN : 0);
    const made: MiniMade[] = s.results.flatMap((res, k) => {
      const ex = s.rounds[k].ex;
      return res.by ? [{ who: res.by, kind: 'sentence' as const, text: `${ex.q[0]} — ${ex.a[0]}`, ja: `${ex.q[1]}—${ex.a[1]}`, stars: FOUND }] : [];
    });
    return { stars: capStars(Object.fromEntries(s.seats.map((x) => [x.who, each])), s.seats), made };
  }
};
