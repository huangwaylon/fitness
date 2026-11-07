// たちぎき (games/tachi/): the deal from the tachi files, the rounds and their timing, the opinions round's grading solo
// and by halves, the answers' bounds, the row and its round trip, the lines' offsets on the audio clock (clips.ts),
// the bed's samples, and a whole co-op game over two phones on the `play` wire (round/session.ts), each at their tier.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Who } from '../../../types.ts';
import { ITEM_ID_RE } from '../../../contract/listen.ts';
import { BED_LEAD, bedSamples, itemDur, lineGaps, sequenceStarts, LINE_GAP } from '../../clips.ts';
import { INDEX, listenOf, load, type Unit } from '../../pool.ts';
import type { ListenEntry, ListenPart } from '../../listen.ts';
import { RoundSession, WINDOWS } from '../../round/session.ts';
import { registry } from '../../round/registry.ts';
import { playIn, playOut, type PlayIn, type RoundOut } from '../../round/wire.ts';
import { EMPTY, filesOf, listenOpts, rawOf } from '../listened.ts';
import {
  SHARED, TACHI_QS, facesOf, givenClaim, opinionsOf, pickOf, tachiDeal, tachiGame, tachiOk, tachiRecord, tachiRounds, tachiValid, type TachiCard
} from './def.ts';

const FILES = Object.keys(INDEX.listen).filter((u) => INDEX.listen[u][0] === 'tachi');
const parts = (us: readonly string[]): ListenPart[] => us.map((u) => listenOf(u)!);
/** もり's files (as if listened). */
const MORI = ['s2-tachi-a', 's2-tachi-b'];
beforeAll(() => load(...(FILES as Unit[])));

/** The right answer of a round (opinions: `faces` only, the rest EMPTY). */
const answerFor = (c: TachiCard, faces = [0, 1, 2]): number | number[] =>
  Array.isArray(c.tachi.answer) ? (c.tachi.answer as number[]).map((f) => (faces.includes(f) ? f : EMPTY)) : (c.tachi.answer as number);

describe('たちぎき: the deal', () => {
  it('deals the listened files at the lobby’s place only', () => {
    const listen: Record<string, ListenEntry> = { 's2-tachi-a': ['tachi', 3, 'listened'], 's2-tachi-b': ['tachi', 3, 'draft'], 's3-tachi-a': ['tachi', 4, 'listened'], 's2-tile': ['tile', 3, 'listened'] };
    expect(filesOf('tachi', 4, listen)).toEqual(['s2-tachi-a']);
    expect(filesOf('tachi', 6, listen)).toEqual(['s3-tachi-a']);
    expect(filesOf('tachi', 3, listen)).toEqual([]);
    expect([4, 6].map((lv) => filesOf('tachi', lv, INDEX.listen))).toEqual([['s2-tachi-a', 's2-tachi-b', 's2-tachi-c'], ['s3-tachi-a', 's3-tachi-b', 's3-tachi-c']]); // (this build: all listened, B4's -c since A4)
  });

  it('is the same for a seed: two conversations, three rounds each in order, another seed another deal', () => {
    const a = tachiDeal(7, parts(MORI)), b = tachiDeal(7, parts(MORI));
    expect(a.map((c) => c.tachi.row)).toEqual(b.map((c) => c.tachi.row));
    expect(a).toHaveLength(TACHI_QS);
    expect(a.map((c) => [c.tachi.conv, c.tachi.k, c.tachi.type])).toEqual([[0, 0, 'opinions'], [0, 1, 'changed'], [0, 2, 'plan'], [1, 0, 'opinions'], [1, 1, 'changed'], [1, 2, 'plan']]);
    expect(new Set(a.map((c) => c.id)).size).toBe(2);
    expect(a[0].tachi.row).toBe(`${a[0].id}-op`);
    const deals = new Set(Array.from({ length: 10 }, (_, s) => tachiDeal(s, parts(MORI)).map((c) => c.id).join()));
    expect(deals.size).toBeGreaterThan(4);
  });

  it('every file’s rounds fit: three speakers, row ids within the row’s, each round’s help, the party file’s bed', () => {
    const cards = parts(FILES).flatMap((p) => p.items.flatMap((it) => (it.kind === 'tachi' ? tachiDeal(0, [{ ...p, items: [it] }]) : [])));
    expect(cards.length).toBe(FILES.length * 5 * 3);
    for (const c of cards) {
      expect(c.tachi.who).toHaveLength(3);
      expect(c.tachi.row).toMatch(ITEM_ID_RE);
      expect(c.ctx && c.why, c.tachi.row).toBeTruthy();
      expect(c.quietReveal).toBe(true);
      expect(c.lines.map((l) => l.who)).toEqual(c.lines.map((l) => l.who).filter((w) => c.tachi.who.includes(w)));
      if (c.tachi.type === 'opinions') expect([...(c.tachi.answer as number[])].sort()).toEqual([0, 1, 2]);
      else expect(c.tachi.answer).toBe(c.answer);
    }
    const party = cards.filter((c) => c.bed === 'party').map((c) => c.id);
    expect(new Set(party)).toEqual(new Set(cards.filter((c) => (c.tags?.conditions as readonly string[] | undefined)?.includes('party')).map((c) => c.id)));
    expect(party.length).toBeGreaterThan(0);
  });
});

describe('たちぎき: rounds and grading', () => {
  const cards = () => tachiDeal(3, parts(MORI));

  it('the clip plays before a conversation’s first round only; easy has the third speaker’s claim placed', () => {
    const rs = tachiRounds(cards(), { lv: 4, ear: 2 }, () => 31_000);
    expect(rs.map((r) => r.play)).toEqual([31_000, 0, 0, 31_000, 0, 0]);
    expect(rs.some((r) => r.given)).toBe(false);
    const easy = tachiRounds(cards(), { lv: 4, ear: 1 }, () => undefined);
    expect(easy.map((r) => r.given)).toEqual([true, false, false, true, false, false]);
    expect(easy[0].play).toBe(2000); // (no clip yet: PLAY_UNKNOWN)
    const deck = tachiGame({ cards: () => cards(), playMs: () => 31_000 }).deck(3, { lv: 4, timer: 30, ear: 2 }, { w: WINDOWS, enc: [] });
    expect([deck.timing(0), deck.timing(1)]).toEqual([{ lead: WINDOWS.lead, play: 31_000, answer: WINDOWS.answers[0] + 10_000 }, { lead: 0, play: 0, answer: WINDOWS.answers[0] }]);
  });

  it('opinions: right with every face at its claim, or one role’s two; never a face twice', () => {
    const r = { type: 'opinions' as const, answer: [2, 0, 1], n: 3 };
    expect(tachiOk(r, [2, 0, 1])).toBe(true);
    expect(tachiOk(r, [2, 1, 0])).toBe(false);
    expect(tachiOk(r, [2, 0, EMPTY])).toBe(true); // role 0's: its face and the shared one
    expect(tachiOk(r, [2, EMPTY, 1])).toBe(true); // role 1's
    expect(tachiOk(r, [EMPTY, 0, 1])).toBe(false); // the shared one missing
    expect(tachiOk(r, [EMPTY, 0, EMPTY])).toBe(false);
    expect([[2, 0, 1], [2, 2, EMPTY], [EMPTY, EMPTY, EMPTY], [0, 1], [3, 0, 1], 1].map((a) => tachiValid(r, a))).toEqual([true, false, false, false, false, false]);
    expect([facesOf(null), facesOf(0), facesOf(1), facesOf(2)]).toEqual([[0, 1, 2], [0, SHARED], [1, SHARED], [0, SHARED]]);
    expect(givenClaim([2, 0, 1])).toBe(0);
  });

  it('changed and plan: a choice in range, right the authored one', () => {
    const c = { type: 'changed' as const, answer: 1, n: 3 }, p = { type: 'plan' as const, answer: 2, n: 4 };
    expect([0, 1, 2, 3, -1, 1.5, [1]].map((a) => tachiValid(c, a))).toEqual([true, true, true, false, false, false, false]);
    expect([tachiOk(c, 1), tachiOk(c, 0), tachiOk(p, 2), tachiValid(p, 3)]).toEqual([true, false, true, true]);
  });

  it('my row: each round I had, my answer as the pick (opinions in base 4), read back', () => {
    const rs = tachiRounds(cards(), { lv: 4, ear: 2 }, () => 31_000);
    const answers = cards().map((c, i) => (i === 3 ? null : i === 1 ? ((c.tachi.answer as number) + 1) % 3 : answerFor(c)));
    const row = tachiRecord(rs, answers, [true, true, true, true, true, false], [0, 2, 0, 0, 0, 0], true);
    expect(row.map(([id, ok, , rp]) => [id, ok, rp])).toEqual([[rs[0].id, 1, 0], [rs[1].id, 0, 2], [rs[2].id, 1, 0], [rs[3].id, 0, 0], [rs[4].id, 1, 0]]);
    expect(opinionsOf(row[0][2])).toEqual(answers[0]);
    expect(row[3][2]).toBe(-1);
    expect(pickOf(rs[0], [EMPTY, 1, EMPTY])).toBe(3 + 4 + 48);
    expect(opinionsOf(55)).toEqual([EMPTY, 1, EMPTY]);
    expect([rawOf({ k: 2 }), rawOf({ k: 1, a: [1, 0, 2] }), rawOf(null)]).toEqual([2, [1, 0, 2], null]);
  });
});

describe('たちぎき: the lines on the audio clock (clips.ts)', () => {
  it('each line its `at` after the end of the one before, an overlap negative; others LINE_GAP', () => {
    const tachi = { id: 'tachi-x', lines: [{ at: 0 }, { at: -0.4 }, { at: 0.5 }] } as never;
    expect(lineGaps(tachi)).toEqual([-0.4, 0.5]);
    expect(sequenceStarts([2, 1, 1.5], 10_000, 0, lineGaps(tachi))).toEqual([10_000, 11_600, 13_100]);
    const clips = { 'tachi-x-1': { dur: 2 }, 'tachi-x-2': { dur: 1 }, 'tachi-x-3': { dur: 1.5 } };
    expect(itemDur(tachi, clips)).toBeCloseTo(4.6);
    // a long line overlapped by a short one: the sequence ends with the long one
    expect(itemDur({ id: 'tachi-x', lines: [{ at: 0 }, { at: -2 }] } as never, { 'tachi-x-1': { dur: 3 }, 'tachi-x-2': { dur: 0.5 } })).toBeCloseTo(3);
    expect(lineGaps({ lines: [{}, {}] } as never)).toEqual([LINE_GAP]);
    // heard late: the lines over skipped, the one under way from now, the rest moved on by as much
    expect(sequenceStarts([2, 1, 1.5], 10_000, 12_000, lineGaps(tachi))).toEqual([-1, 12_000, 13_500]);
  });

  it('a bed: from its offset round the loop, at its gain, faded in and out', () => {
    const loop = Float32Array.from({ length: 1000 }, (_, k) => (k % 10) / 10);
    const s = bedSamples(loop, 3000, 1000, 0.5, 1995);
    expect(s).toHaveLength(3000);
    expect([s[0], s[2999]]).toEqual([0, 0]);
    expect(s[1000]).toBeCloseTo(((1995 + 1000) % 1000 % 10) / 10 * 0.5);
    expect(s[250]).toBeCloseTo(((1995 + 250) % 1000 % 10) / 10 * 0.5);
    expect(s[125]).toBeCloseTo((((1995 + 125) % 1000 % 10) / 10) * 0.5 * 0.5);
    expect(BED_LEAD).toBeGreaterThan(0);
  });
});

// ---------- two phones ----------

const T0 = Date.UTC(2026, 10, 7, 3);
const src = { cards: (seed: number) => tachiDeal(seed, parts(MORI)), playMs: () => 2000, cv: () => 'abc123' };

function pair() {
  let n = 0;
  const random = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  const make = (me: Who) => new RoundSession({ me, defs: registry([tachiGame(src)]), random });
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

describe('たちぎき: a co-op game over two phones', () => {
  it('each places their own face and the shared one; the team has a round when both are right, the same on both phones', () => {
    const r = pair();
    // A (ear かわ) opens もり: easy for A (the shared claim placed); B (ear もり) joins: as authored
    r.act('A', (x) => x.open({ gm: 'tachi', o: listenOpts.encode({ lv: 4, timer: 30, ear: 1 }) }, T0));
    r.act('A', (x) => x.invite(T0));
    r.act('B', (x) => x.join(T0, undefined, 2));
    expect(r.s.B.view(T0)).toMatchObject({ phase: 'lobby', gm: 'tachi', tiers: { A: 1, B: 2 } });
    r.act('A', (x) => x.go(T0));
    const cards = src.cards(r.s.A.view(T0).seed);
    let t = T0 + WINDOWS.countdown;
    for (let i = 0; i < TACHI_QS; i++) {
      const c = cards[i], lead = c.tachi.k ? 0 : WINDOWS.lead + 2000;
      const at = t + lead + 10;
      expect(r.s.A.view(at)).toMatchObject({ phase: 'answer', i, roles: { A: 0, B: 1 } });
      // A always right; B wrong on the second conversation's opinions (the shared face on A's claim)
      let b = answerFor(c, facesOf(1));
      if (i === 3) {
        const want = c.tachi.answer as number[];
        b = [EMPTY, EMPTY, EMPTY];
        b[want.indexOf(1)] = SHARED;
        b[want.indexOf(SHARED)] = 1;
      }
      r.act('A', (x) => x.answer(answerFor(c, facesOf(0)), 0, at), at);
      r.act('B', (x) => x.answer(b, 0, at), at);
      expect(r.s.A.view(at).phase).toBe('reveal');
      r.act('A', (x) => x.next(at + 1), at + 1);
      t = at + 1;
    }
    const A = r.s.A.view(t + 1), B = r.s.B.view(t + 1);
    expect([A.phase, B.phase]).toEqual(['results', 'results']);
    expect(A.team).toEqual(B.team);
    expect(A.team).toMatchObject({ right: TACHI_QS, all: TACHI_QS - 1 });
    expect(A.scores).toEqual(B.scores);
  });
});
