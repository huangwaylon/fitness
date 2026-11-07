// ようじ でんわ (games/call/): the deal from the call files (3 calls, 2 rounds each: the call plays in round 1, round 2
// has no play), the memo rows at each tier and hard's sound trap, the grading of a whole memo and of a co-op share, the
// answers' bounds, the team's memo, the row and its round trip through the files' parts, and a whole co-op game over two
// phones on the `play` wire (round/session.ts), each at their own tier.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Who } from '../../../types.ts';
import { INDEX, listenOf, load, type Unit } from '../../pool.ts';
import type { ListenEntry, ListenPart } from '../../listen.ts';
import { RoundSession, WINDOWS } from '../../round/session.ts';
import { registry } from '../../round/registry.ts';
import { playIn, playOut, type PlayIn, type RoundOut } from '../../round/wire.ts';
import { EMPTY, filesOf, listenOpts } from '../listened.ts';
import {
  CALL_QS, callDeal, callGame, callOk, callRecord, callRounds, callValid, chipsOf, infoOf, roundRows, rowsOf, trapOf, unionOf, wrongMask, wrongRows, type CallRound
} from './def.ts';

const FILES = Object.keys(INDEX.listen).filter((u) => INDEX.listen[u][0] === 'call');
const parts = (us: readonly string[]): ListenPart[] => us.map((u) => listenOf(u)!);
/** もり's files (as if listened). */
const MORI = ['s2-call-a', 's2-call-b'];
beforeAll(() => load(...(FILES as Unit[])));

/** The right answer for a round's rows (`only`: those, the rest EMPTY). */
const answerFor = (r: Pick<CallRound, 'rows'>, only?: readonly number[]): number[] => r.rows.map((x, j) => (only && !only.includes(j) ? EMPTY : x.answer));
const callsOf = (us: readonly string[]) => parts(us).flatMap((p) => p.items.flatMap((it) => (it.kind === 'call' ? [it] : [])));

describe('ようじ でんわ: the deal', () => {
  it('deals the listened files at the lobby’s place only', () => {
    const listen: Record<string, ListenEntry> = { 's1-call': ['call', 2, 'listened'], 's2-call-a': ['call', 3, 'listened'], 's2-call-b': ['call', 3, 'draft'], 's2-tile': ['tile', 3, 'listened'] };
    expect(filesOf('call', 4, listen)).toEqual(['s2-call-a']);
    expect(filesOf('call', 3, listen)).toEqual(['s1-call']);
    expect(filesOf('call', 6, listen)).toEqual([]);
    expect(filesOf('call', 4, INDEX.listen)).toEqual(['s2-call-a', 's2-call-b']); // (this build: A1's listened, wave 2's s2-call-c a draft)
  });

  it('is the same for a seed: 3 calls, each its call (its lines’ clips) then its memo’s second round (no clip of its own)', () => {
    const a = callDeal(7, parts(MORI)), b = callDeal(7, parts(MORI));
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
    expect(a).toHaveLength(CALL_QS * 2);
    for (let i = 0; i < a.length; i += 2) {
      const [one, two] = [a[i], a[i + 1]];
      expect([one.call.part, two.call.part]).toEqual([0, 1]);
      expect(two.id).toBe(`${one.id}-memo`);
      expect(one.lines!.length).toBe(one.call.info.lines.length);
      expect(two.lines).toBeUndefined();
      expect([one.lv, one.voice, one.speaker]).toEqual([4, 'us', one.call.info.caller]);
    }
    const deals = new Set(Array.from({ length: 10 }, (_, s) => callDeal(s, parts(MORI)).map((c) => c.id).join()));
    expect(deals.size).toBeGreaterThan(5);
  });

  it('a call’s lines: mine, the caller’s, the change mid-call, and a `signal` call’s lines with "..." breaking up', () => {
    const info = infoOf(callsOf(['s2-call-a']).find((c) => c.id === 'call-installer-signal')!);
    expect(info.caller).toBe('stitches');
    expect(info.lines.map((l) => l.me)).toEqual([false, true, false, true, false, true, false]);
    expect(info.lines.flatMap((l, k) => (l.drop ? [k] : []))).toEqual([0]);
    expect(info.lines.flatMap((l, k) => (l.repair ? [k] : []))).toEqual([4]);
    // no "..." breaks up on a call that isn't a bad line
    const clean = infoOf(callsOf(['s2-call-a']).find((c) => c.id === 'call-gp-callback')!);
    expect(clean.lines.some((l) => l.drop)).toBe(false);
  });

  it('every file’s calls fit the wire at every tier: 1-4 rows a round, both rounds asked, at most 7 chips a row, ≤ 12 rows in the mask', () => {
    for (const it of callsOf(FILES)) {
      const info = infoOf(it);
      expect(info.memo.flatMap((m) => m.rows).length).toBeLessThanOrEqual(12);
      for (const tier of [undefined, 'easy', 'hard'] as const) {
        const [a, b] = roundRows(info, tier);
        expect(a.length).toBeGreaterThanOrEqual(1);
        expect(b.length).toBeGreaterThanOrEqual(1);
        expect(a.length + b.length).toBeLessThanOrEqual(4);
        for (const r of [...a, ...b]) expect(chipsOf(r, tier).chips.length).toBeLessThanOrEqual(7);
      }
    }
  });
});

describe('ようじ でんわ: tiers', () => {
  it('easy 2 rows, as authored 3, hard 4: one memo split, its first half in round 1; two memos, each its own', () => {
    const info = infoOf(callsOf(['s2-call-a']).find((c) => c.id === 'call-leak-again')!); // one memo of 5 rows
    const two = infoOf(callsOf(['s3-call']).find((c) => c.id === 'call-missed-connection')!); // two memo rounds of 2
    const ns = (t: Parameters<typeof roundRows>[1], i = info) => roundRows(i, t).map((rs) => rs.map((r) => r.n));
    expect(ns('easy')).toEqual([[0], [1]]);
    expect(ns(undefined)).toEqual([[0, 1], [2]]);
    expect(ns('hard')).toEqual([[0, 1], [2, 3]]);
    expect(ns('easy', two)).toEqual([[0], [2]]);
    expect(ns(undefined, two)).toEqual([[0, 1], [2]]);
    expect(ns('hard', two)).toEqual([[0, 1], [2, 3]]);
  });

  it('hard’s extra chip is a number’s sound trap (teen / -ty, two digits swapped), in order, never one already there', () => {
    expect(trapOf({ options: ['14番', '40番', '41番'], answer: 1 })).toBeNull(); // (both traps are chips already; no leading 0)
    expect(trapOf({ options: ['13日', '14日', '15日'], answer: 1 })).toBe('40日');
    expect(trapOf({ options: ['2816', '2861', '5390'], answer: 0 })).toBe('8216');
    expect(trapOf({ options: ['9,000円', '11,000円', '14,000円'], answer: 2 })).toBe('40,000円');
    expect(trapOf({ options: ['北口', '東口'], answer: 1 })).toBeNull();
    expect(chipsOf({ n: 0, ask: '', options: ['13日', '14日', '15日'], answer: 1 }, 'hard')).toEqual({ chips: ['13日', '14日', '15日', '40日'], answer: 1 });
    expect(chipsOf({ n: 0, ask: '', options: ['18,000円', '20,000円', '22,000円'], answer: 2 }, 'hard').chips).toHaveLength(3); // (22,000: no trap)
    expect(chipsOf({ n: 0, ask: '', options: ['3B', '3C', '4C'], answer: 1 }, 'hard').chips).toEqual(['3B', '3C', '4C']);
    expect(chipsOf({ n: 0, ask: '', options: ['13日', '14日', '15日'], answer: 1 }, undefined).chips).toEqual(['13日', '14日', '15日']);
    // a trap placed among ascending numbers moves the answer with it
    expect(chipsOf({ n: 0, ask: '', options: ['40番', '50番'], answer: 1 }, 'hard')).toEqual({ chips: ['15番', '40番', '50番'], answer: 2 });
  });

  it('options carry the level, こたえる じかん and the ear', () => {
    const o = { lv: 4 as const, timer: 20 as const, ear: 3 };
    expect(listenOpts.decode(listenOpts.encode(o))).toEqual(o);
  });
});

describe('ようじ でんわ: answers', () => {
  const r = { rows: [{ n: 0, ask: '', chips: ['a', 'b', 'c'], answer: 1 }, { n: 1, ask: '', chips: ['x', 'y'], answer: 0 }, { n: 4, ask: '', chips: ['p', 'q', 'r'], answer: 2 }] };
  it('takes a chip a row (EMPTY one not filled), within the row’s chips', () => {
    expect(callValid(r, [1, 0, 2])).toBe(true);
    expect(callValid(r, [1, EMPTY, EMPTY])).toBe(true);
    for (const bad of [1, [1, 0], [1, 0, 2, 0], [1, 2, 2], [3, 0, 2], [-1, 0, 2], [1.5, 0, 2], [EMPTY, EMPTY, EMPTY]]) expect(callValid(r, bad as never)).toBe(false);
  });

  it('grades a whole memo right by its rows, the wrong rows as a mask over the call’s memo', () => {
    expect(callOk(r, [1, 0, 2])).toBe(true);
    expect(callOk(r, [1, 0, 0])).toBe(false);
    expect(wrongMask(r, [1, 0, 0])).toBe(1 << 4);
    expect(wrongMask(r, [0, 1, 0])).toBe(0b10011);
  });

  it('co-op: a role’s share right is right (role 0 the 1st, 3rd…), a round of one row both’s, never a scattered part', () => {
    expect(rowsOf(3, 0)).toEqual([0, 2]);
    expect(rowsOf(3, 1)).toEqual([1]);
    expect(rowsOf(1, 1)).toEqual([0]);
    expect(rowsOf(2, null)).toEqual([0, 1]);
    expect(callOk(r, [1, EMPTY, 2])).toBe(true);
    expect(callOk(r, [EMPTY, 0, EMPTY])).toBe(true);
    expect(callOk(r, [1, 0, EMPTY])).toBe(false);
    expect(callOk({ rows: [r.rows[0]] }, [1])).toBe(true);
  });

  it('the team’s memo is each row from whoever filled it, by its place in the call; a row both filled, wrong over right', () => {
    const team = unionOf([{ round: r, a: [1, EMPTY, 0] }, { round: { rows: [r.rows[1], r.rows[0]] }, a: [1, 0] }]);
    expect([...team.entries()]).toEqual([[0, { chip: 'a', ok: false }], [4, { chip: 'p', ok: false }], [1, { chip: 'y', ok: false }]]);
    expect([...unionOf([{ round: r, a: [1, EMPTY, EMPTY] }, { round: { rows: [r.rows[0]] }, a: [1] }]).entries()]).toEqual([[0, { chip: 'b', ok: true }]]);
  });
});

describe('ようじ でんわ: rounds and the row', () => {
  it('round 1 plays the call (its lines’ length), round 2 nothing', () => {
    const cards = callDeal(3, parts(MORI));
    const rounds = callRounds(cards, { lv: 4, ear: 2 }, (it) => (it.lines ? 30_000 : undefined));
    expect(rounds.map((x) => x.play)).toEqual([30_000, 0, 30_000, 0, 30_000, 0]);
    expect(rounds.map((x) => x.id)).toEqual(cards.map((c) => c.call.info.id));
    // unknown lengths (no clips yet): 2 s a line
    expect(callRounds(cards, { lv: 4, ear: 2 }, () => undefined)[0].play).toBe(2000 * cards[0].call.info.lines.length);
  });

  it('keeps each round I had (by its call, right, the wrong rows, replays) and reads back through the files’ parts', () => {
    const cards = callDeal(3, parts(MORI)), rounds = callRounds(cards, { lv: 4, ear: 2 }, () => 2000);
    const answers = rounds.map((x, i) => (i === 1 ? answerFor(x).map((k, j) => (j === 0 ? (k + 1) % x.rows[0].chips.length : k)) : i === 2 ? null : answerFor(x)));
    const had = rounds.map((_, i) => i !== 5);
    const row = callRecord(rounds, answers, had, [0, 2, 0, 0, 0, 0], true);
    expect(row.map(([id, ok, pick, rp]) => [id, ok, pick, rp])).toEqual([
      [rounds[0].id, 1, 0, 0], [rounds[1].id, 0, 1 << rounds[1].rows[0].n, 2], [rounds[2].id, 0, -1, 0], [rounds[3].id, 1, 0, 0], [rounds[4].id, 1, 0, 0]
    ]);
    expect(callRecord(rounds, answers, had, [], false)).toHaveLength(4);
    const missed = wrongRows(cards[1].call.info, row[1][2]);
    expect(missed.map((m) => m.n)).toEqual([rounds[1].rows[0].n]);
    expect(missed[0].ask).toBe(rounds[1].rows[0].ask);
  });
});

// ---------- two phones ----------

const T0 = Date.UTC(2026, 10, 7, 3);
const src = { cards: (seed: number) => callDeal(seed, parts(MORI)), playMs: () => 20_000, cv: () => 'abc123' };

function pair() {
  let n = 0;
  const random = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  const make = (me: Who) => new RoundSession({ me, defs: registry([callGame(src)]), random });
  const s = { A: make('A'), B: make('B') };
  type P = keyof typeof s;
  const deliver = (from: P, out: RoundOut[], now: number) => {
    for (const m of out) {
      const p = playOut(m);
      expect(p, `${m.op} goes out on play`).not.toBeNull();
      const to: P = from === 'A' ? 'B' : 'A';
      deliver(to, s[to].receive(playIn({ ...p!, v: 3, who: from, t: now } as PlayIn)!, now), now);
    }
  };
  s.A.presence(['B'], T0);
  s.B.presence(['A'], T0);
  return { s, act: (w: P, f: (x: RoundSession) => RoundOut[], now = T0) => deliver(w, f(s[w]), now) };
}

describe('ようじ でんわ: a co-op game over two phones', () => {
  it('each fills their share of the memo at their own tier; the team has a round when both shares are right, the same on both phones', () => {
    const r = pair();
    // A (ear かわ) opens もり: easy for A; B (ear やま) joins: hard
    r.act('A', (x) => x.open({ gm: 'call', o: listenOpts.encode({ lv: 4, timer: 30, ear: 1 }) }, T0));
    r.act('A', (x) => x.invite(T0));
    r.act('B', (x) => x.join(T0, undefined, 3));
    expect(r.s.B.view(T0)).toMatchObject({ phase: 'lobby', gm: 'call', tiers: { A: 1, B: 3 } });
    r.act('A', (x) => x.go(T0));
    const seed = r.s.A.view(T0).seed, cards = src.cards(seed);
    const ra = callRounds(cards, { lv: 4, ear: 1 }, src.playMs), rb = callRounds(cards, { lv: 4, ear: 3 }, src.playMs);
    expect(ra.map((x) => x.id)).toEqual(rb.map((x) => x.id));
    expect(rb.reduce((k, x) => k + x.rows.length, 0)).toBeGreaterThan(ra.reduce((k, x) => k + x.rows.length, 0));
    let t = T0 + WINDOWS.countdown;
    for (let i = 0; i < CALL_QS * 2; i++) {
      // round 1 waits out the call; round 2 opens its answers at once
      const at = t + WINDOWS.lead + ra[i].play + 10;
      expect(r.s.A.view(at).phase).toBe('answer');
      expect(r.s.A.view(at).roles).toEqual({ A: 0, B: 1 });
      const b = answerFor(rb[i], rowsOf(rb[i].rows.length, 1));
      if (i === 2) {
        const j = rowsOf(rb[i].rows.length, 1)[0];
        b[j] = (b[j] + 1) % rb[i].rows[j].chips.length;
      }
      r.act('A', (x) => x.answer(answerFor(ra[i], rowsOf(ra[i].rows.length, 0)), 0, at), at);
      r.act('B', (x) => x.answer(b, 0, at), at);
      expect(r.s.A.view(at).phase).toBe('reveal');
      r.act('A', (x) => x.next(at + 1), at + 1);
      t = at + 1;
    }
    const A = r.s.A.view(t + 1), B = r.s.B.view(t + 1);
    expect([A.phase, B.phase]).toEqual(['results', 'results']);
    expect(A.team).toEqual(B.team);
    expect(A.team).toMatchObject({ right: CALL_QS * 2, all: CALL_QS * 2 - 1 });
    const rowB = callRecord(rb, B.answers.map((a) => a?.a ?? null), B.had, [], true);
    expect(rowB.map(([, ok]) => ok)).toEqual([1, 1, 0, 1, 1, 1]);
  });
});
