// スピード はしご (ladder.ts, ladders.ts): the 30 ladders' content, the deck from a seed, the climb and its points, the
// mode's seed bit, and every rung's clip.
import { describe, expect, it } from 'vitest';
import { ROSTER } from '#lib/villagers/roster.ts';
import { BANK } from './source.ts';
import type { Clip } from './clips.ts';
import clipsJson from './clips.json';
import { placeMark, findWords } from './marks.ts';
import { spokenText } from './speech.ts';
import { LADDER_SRC, LADDERS, RUNG_ITEMS, ladderReady } from './ladders.ts';
import { PER_GAME, RUNG_POINTS, SPEEDS, climb, climbs, ladderDeck, ladderPoints, laddersIn, rungState, speedAt } from './ladder.ts';
import { isRungId } from './pool.ts';
import { isLadder, versus, withLadder } from './seed.ts';
import { QUIZ_MAX_S, QUIZ_QS } from '../contract/live-protocol.ts';

const CLIPS: Readonly<Record<string, Clip>> = clipsJson;

describe('スピード はしご: the ladders', () => {
  it('30 ladders, unique ids that fit a listen row, never a bank id; 4 rungs each at rising speeds', () => {
    expect(LADDERS).toHaveLength(30);
    const ids = new Set(BANK.map((it) => it.id));
    for (const l of LADDERS) {
      expect(l.id).toMatch(/^sp-[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(l.rungs.map((r) => r.rung)).toEqual(SPEEDS.map((speed, k) => ({ ladder: l.id, n: k + 1, speed })));
      for (const r of l.rungs) {
        expect(r.id).toMatch(/^[a-z0-9][a-z0-9-]{0,31}$/); // contract/listen.ts ITEM_RE
        expect(ids.has(r.id), r.id).toBe(false);
      }
    }
    expect(new Set(RUNG_ITEMS.map((r) => r.id)).size).toBe(RUNG_ITEMS.length);
    expect([...SPEEDS]).toEqual([...SPEEDS].sort((a, b) => a - b));
  });

  it('ten climb level 4’s own lines (their take, Japanese and staging), twenty are new; all American, in at least 10 of the 12 US voices', () => {
    const reused = LADDER_SRC.filter((s) => typeof s.line === 'string');
    expect(reused).toHaveLength(10);
    for (const s of reused) {
      const it = BANK.find((x) => x.id === s.line)!;
      const l = LADDERS.find((x) => x.id === s.id)!.line;
      expect([l.en, l.tts, l.speaker, l.cast, l.scene, l.marks]).toEqual([it.en, it.tts, it.speaker, it.cast, it.scene, it.marks]);
      expect(l.ja).not.toContain('→');
    }
    expect(LADDERS.filter((l) => l.line.voice !== 'us').map((l) => l.id)).toEqual([]);
    expect(new Set(LADDERS.map((l) => l.line.cast)).size).toBeGreaterThanOrEqual(10);
  });

  it('each line: a roster speaker with a cast voice, its note ≤ 40 字, its tts spoken with no digit, its marks on whole words', () => {
    for (const { line: it } of LADDERS) {
      expect(ROSTER[it.speaker], it.id).toBeDefined();
      expect(it.cast?.slice(0, 2), it.id).toBe(it.voice);
      expect([...(it.note ?? '')].length, it.id).toBeGreaterThan(0);
      expect([...it.note!].length, it.id).toBeLessThanOrEqual(40);
      expect(() => spokenText(it), it.id).not.toThrow();
      expect(spokenText(it), it.id).not.toMatch(/\d/);
      expect(it.ja, it.id).toMatch(/[ぁ-んァ-ン一-龯]/);
      expect(it.tags?.seed, it.id).toBeGreaterThan(0);
      for (const m of it.marks ?? []) expect(placeMark(it.en, m), `${it.id} ${m.join(' ')}`).not.toBeNull();
      // B1+ → B2: a line long enough for four questions
      expect(it.en.split(/\s+/).length, it.id).toBeGreaterThanOrEqual(9);
    }
  });

  it('rungs 1-3 ask different things in Japanese; rung 4 is the line’s chunk, 3 near-sound forms, the right one in the line', () => {
    for (const l of LADDERS) {
      const asks = l.rungs.slice(0, 3);
      expect(new Set(asks.map((r) => r.ask)).size, l.id).toBe(3);
      for (const r of asks) {
        expect(['gist', 'num'], r.id).toContain(r.type);
        expect(r.choices, r.id).toHaveLength(3);
        expect(new Set(r.choices).size, r.id).toBe(3);
        expect(r.ask, r.id).toMatch(/[ぁ-んァ-ン一-龯]/);
        // the choices in Japanese (or a number): nothing English to read before the next, faster rung
        for (const c of r.choices) expect(c, r.id).not.toMatch(/[a-z]{3,}/);
      }
      const top = l.rungs[3];
      expect(top.type, top.id).toBe('word');
      expect(top.choices, top.id).toHaveLength(3);
      expect(new Set(top.choices).size, top.id).toBe(3);
      expect(top.focus, top.id).toBe(top.choices[0]);
      expect(findWords(top.en, top.focus!), top.id).not.toBeNull();
      // the other forms are near: they share a word with the right one
      const w = (s: string) => new Set(s.toLowerCase().split(/[\s']+/));
      for (const c of top.choices.slice(1)) expect([...w(c)].some((x) => w(top.focus!).has(x)), `${top.id} ${c}`).toBe(true);
    }
  });

  it('every rung has its clip, each faster than the one before (the gate is open)', () => {
    expect(ladderReady(CLIPS)).toBe(true);
    for (const l of LADDERS) {
      const d = l.rungs.map((r) => CLIPS[r.id]?.dur);
      for (let k = 1; k < d.length; k++) expect(d[k]!, `${l.id} rung ${k + 1}`).toBeLessThan(d[k - 1]!);
    }
    expect(ladderReady({})).toBe(false);
  });
});

describe('スピード はしご: the deck and the mode', () => {
  it('the mode rides on the seed’s bit 1, apart from たいせん’s bit 0', () => {
    for (const s of [0, 1, 2, 3, 0xfffffffc, 0xffffffff]) {
      expect(isLadder(withLadder(s, true))).toBe(true);
      expect(isLadder(withLadder(s, false))).toBe(false);
      expect(versus(withLadder(s, true))).toBe(versus(s));
      expect(withLadder(s, true)).toBeGreaterThanOrEqual(0);
    }
  });

  it('a game: 2 ladders × 4 rungs in order (8, the quiz’s questions), two speakers, the same deck on every phone', () => {
    for (let seed = 2; seed < 400; seed += 4) {
      const d = ladderDeck(seed, LADDERS);
      expect(d).toHaveLength(QUIZ_QS);
      expect(PER_GAME * SPEEDS.length).toBe(QUIZ_QS);
      const ls = laddersIn(d);
      expect(ls.map((l) => [l.from, l.n])).toEqual([[0, 4], [4, 4]]);
      expect(new Set(ls.map((l) => LADDERS.find((x) => x.id === l.ladder)!.line.speaker)).size).toBe(2);
      for (const [i, it] of d.entries()) {
        expect(it.rung!.n).toBe((i % 4) + 1);
        expect(it.choices[it.answer]).toBe(RUNG_ITEMS.find((r) => r.id === it.id)!.choices[0]);
      }
      expect(ladderDeck(seed, LADDERS)).toEqual(d);
    }
    // most pairs are two voices, and every ladder comes up
    const seen = new Set<string>();
    let mixed = 0;
    for (let seed = 0; seed < 600; seed++) {
      const d = ladderDeck(seed, LADDERS);
      for (const it of d) seen.add(it.rung!.ladder);
      if (d[0].cast !== d[4].cast) mixed++;
    }
    expect(seen.size).toBe(30);
    expect(mixed).toBeGreaterThan(540);
  });

  it('rung ids are known (a listen row’s answers mark a ladder game)', () => {
    expect(isRungId('sp-platform-3')).toBe(true);
    expect(isRungId('n4-platform')).toBe(false);
  });
});

describe('スピード はしご: climbing and scoring', () => {
  const ok = { ok: true, first: true }, replayed = { ok: true, first: false }, miss = { ok: false, first: true };
  it('a climb counts the rungs right on the first listen, in order, and stops at the first that isn’t', () => {
    expect(climb([ok, ok, ok, ok])).toBe(4);
    expect(climb([ok, ok, miss, ok])).toBe(2);
    expect(climb([ok, replayed, ok, ok])).toBe(1);
    expect(climb([null, ok, ok, ok])).toBe(0);
    expect(climb([miss, ok, ok, ok])).toBe(0);
    expect(climb([])).toBe(0);
  });

  it('points: a flat 100 a rung climbed (a lucky top rung pays nothing), at most the protocol’s total', () => {
    const d = ladderDeck(6, LADDERS);
    const a = (pairs: [number, number, boolean][]) => new Map(pairs.map(([i, k, rp]) => [i, { k, rp }]));
    const right = (i: number) => d[i].answer, wrong = (i: number) => (d[i].answer + 1) % 3;
    const all = a(d.map((_, i) => [i, right(i), false]));
    expect(climbs(d, all)).toEqual([4, 4]);
    expect(ladderPoints(d, all)).toBe(8 * RUNG_POINTS);
    expect(8 * RUNG_POINTS).toBeLessThanOrEqual(QUIZ_MAX_S);
    // ladder 1: a miss on rung 2, then the top right (no credit); ladder 2: rung 1 replayed, nothing climbed
    const some = a([[0, right(0), false], [1, wrong(1), false], [2, right(2), false], [3, right(3), false], [4, right(4), true], [5, right(5), false]]);
    expect(climbs(d, some)).toEqual([1, 0]);
    expect(ladderPoints(d, some)).toBe(RUNG_POINTS);
  });

  it('rungState: the rung, how high the ladder was climbed before it, and whether it can still be climbed', () => {
    const d = ladderDeck(10, LADDERS);
    const ans = d.map((it, i) => (i === 1 ? { k: (it.answer + 1) % 3, rp: false } : { k: it.answer, rp: false }));
    expect(rungState(d, ans, 0)).toEqual({ n: 1, of: 4, below: 0, open: true });
    expect(rungState(d, ans, 1)).toEqual({ n: 2, of: 4, below: 1, open: true });
    expect(rungState(d, ans, 2)).toEqual({ n: 3, of: 4, below: 1, open: false });
    expect(rungState(d, ans, 5)).toEqual({ n: 2, of: 4, below: 1, open: true });
    expect(rungState(BANK.slice(0, 8), ans, 0)).toBeNull();
    expect([speedAt(0), speedAt(1), speedAt(4)]).toEqual([null, 0.8, 1.4]);
  });
});
