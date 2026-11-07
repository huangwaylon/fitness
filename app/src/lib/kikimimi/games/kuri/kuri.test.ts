// くりかえし チャレンジ (games/kuri/): the sentences a run can draw, the ladder's climb (≥ 80% climbs, a replay never,
// two misses in a row end it, a skip is neither), the next sentence nearest its rung, the answers' bounds and grading,
// each level's pool over this build's content, and a whole solo run through the session (round/session.ts: the next
// sentence from my answers and replays, nothing on the wire).
import { beforeAll, describe, expect, it } from 'vitest';
import type { Item, Level } from '../../bank.ts';
import { levelItems, load } from '../../pool.ts';
import { RoundSession } from '../../round/session.ts';
import { registry, type Phone } from '../../round/registry.ts';
import { quizOpts } from '../quiz/def.ts';
import { TAIKAI_IDS } from '../taikai/source.ts';
import { KURI_MAX, RUNGS, answerOf, climbOf, eligible, kuriAnswer, kuriGame, kuriNext, reached, saidOk, skipAnswer, syllables, type KuriSource } from './def.ts';
import { lane } from './lane.ts';

const LEVELS: Level[] = [1, 2, 3, 4, 6, 7];
beforeAll(() => load(...LEVELS));

const ok = { ok: true, rp: 0, skipped: false }, miss = { ok: false, rp: 0, skipped: false };

describe('くりかえし: the sentences', () => {
  it('counts syllables roughly, longer sentences more', () => {
    expect(syllables('I like cake.')).toBe(3);
    expect(syllables('Could you bring me another coffee, please?')).toBeGreaterThan(syllables('See you later.'));
    expect(syllables('It costs 25 dollars.')).toBeGreaterThan(syllables('It costs dollars.'));
  });

  it('takes one American voice, 5–16 words, a clean clip (light conditions from もり up, heavy never)', () => {
    const base = { voice: 'us', en: 'Can you pass me the salt?', lv: 3 } as Item;
    expect(eligible(base)).toBe(true);
    expect(eligible({ ...base, voice: 'uk' } as Item)).toBe(false);
    expect(eligible({ ...base, en: 'Hi there.' })).toBe(false);
    expect(eligible({ ...base, lines: [{ who: 'bunnie', en: 'a', ja: 'b' }] } as unknown as Item)).toBe(false);
    expect(eligible({ ...base, cond: { kind: 'cafe', level: 'light' } })).toBe(false);
    expect(eligible({ ...base, lv: 4, cond: { kind: 'cafe', level: 'light' } })).toBe(true);
    expect(eligible({ ...base, lv: 6, cond: { kind: 'cafe', level: 'heavy' } })).toBe(false);
  });

  it('has a pool at every level the mode page can pick, spanning the ladder', () => {
    for (const lv of LEVELS) {
      const pool = levelItems(lv).filter(eligible);
      expect(pool.length, String(lv)).toBeGreaterThanOrEqual(KURI_MAX * 3);
      const syl = pool.map((it) => syllables(it.en));
      expect(Math.max(...syl), String(lv)).toBeGreaterThan(Math.min(...syl) + 6);
    }
  });
});

describe('くりかえし: the climb', () => {
  it('climbs a rung for ≥ 80% on the first listen, never on a replay, stops at the top', () => {
    expect(climbOf([]).rung).toBe(0);
    expect(climbOf([ok, ok]).rung).toBe(2);
    expect(climbOf([ok, { ...ok, rp: 1 }]).rung).toBe(1);
    expect(climbOf(Array(KURI_MAX).fill(ok)).rung).toBe(RUNGS.length - 1);
  });

  it('ends on two misses in a row or the 8th sentence; a skip neither climbs nor counts', () => {
    expect(climbOf([miss]).stop).toBe(false);
    expect(climbOf([miss, ok, miss]).stop).toBe(false);
    expect(climbOf([ok, miss, miss])).toEqual({ rung: 1, misses: 2, stop: true });
    expect(climbOf([miss, { ok: false, rp: 0, skipped: true }, ok])).toMatchObject({ rung: 1, misses: 0, stop: false });
    expect(climbOf(Array(KURI_MAX).fill(miss).map((x, k) => (k % 2 ? ok : x))).stop).toBe(true);
  });

  it('picks the unused sentence nearest its rung, the same for a seed', () => {
    const pool = [8, 9, 10, 12, 12, 15, 22, 30].map((syl, n) => ({ n, syl }));
    expect(kuriNext(1, [], pool)).toBe(0);
    expect(kuriNext(1, [{ ...ok, n: 0 }], pool)).toBe(2); // rung 1: 10
    expect(kuriNext(1, [{ ...miss, n: 0 }], pool)).toBe(1); // still rung 0: 8 is used, 9 is next
    const two = [{ ...ok, n: 0 }, { ...ok, n: 2 }]; // rung 2: 12, twice
    expect([3, 4]).toContain(kuriNext(5, two, pool));
    expect(kuriNext(5, two, pool)).toBe(kuriNext(5, two, pool));
    expect(kuriNext(1, [{ ...ok, n: 0 }, { ...miss, n: 1 }, { ...miss, n: 2 }], pool)).toBeNull();
    expect(kuriNext(1, pool.map((x) => ({ ...ok, n: x.n })).slice(0, 7), pool.slice(0, 7))).toBeNull();
  });
});

describe('くりかえし: answers', () => {
  it('takes [hit, of, heard] only (a pair would read as the wager)', () => {
    expect(answerOf(kuriAnswer(4, 5))).toEqual({ hit: 4, of: 5, heard: true });
    expect(answerOf(skipAnswer(5))).toEqual({ hit: 0, of: 5, heard: false });
    for (const bad of [[4, 5], [6, 5, 1], [1, 0, 1], [1, 5, 0], [1, 5, 2], [1.5, 5, 1], 3, null]) expect(answerOf(bad as never), JSON.stringify(bad)).toBeNull();
  });

  it('says 4 of 5 is said, 3 of 5 not, a skip never', () => {
    expect([kuriAnswer(4, 5), kuriAnswer(3, 5), kuriAnswer(1, 1), skipAnswer(1)].map((a) => saidOk(answerOf(a)))).toEqual([true, false, true, false]);
  });

  it('reaches the longest sentence said', () => {
    const items = [{ en: 'one two three four five' }, { en: 'one two three four five six seven' }, { en: 'a b c d e f g h i' }];
    expect(reached(items, [kuriAnswer(3, 3), kuriAnswer(4, 4), kuriAnswer(1, 4)])).toBe(7);
    expect(reached(items, [skipAnswer(3), null, kuriAnswer(0, 4)])).toBe(0);
  });
});

describe('くりかえし: a run', () => {
  it('deals each level’s first sentence from its pool, on the lowest rung', () => {
    const def = lane.def({} as Phone);
    for (const lv of LEVELS) {
      const n = def.next!(3, { lv: lv as never, timer: 30 }, []);
      const it = levelItems(lv).find((x) => x.id === TAIKAI_IDS.entry(n!)?.id)!;
      expect(eligible(it), String(lv)).toBe(true);
      const nearest = Math.min(...levelItems(lv).filter(eligible).map((x) => Math.abs(syllables(x.en) - RUNGS[0])));
      expect(Math.abs(syllables(it.en) - RUNGS[0])).toBe(nearest);
    }
  });

  it('plays solo through the session: each next sentence from my answers and replays, done after two misses', () => {
    const src: KuriSource = {
      rounds: (_s, _o, ids) => ids.map((n) => ({ kind: 'kuri', id: `s${n}`, play: 2000 })),
      next: (seed, _o, done) => kuriNext(seed, done.map((d) => ({ ...d, n: Number(d.id.slice(1)) })), Array.from({ length: 20 }, (_, n) => ({ n, syl: 8 + 2 * n })))
    };
    const s = new RoundSession({ me: 'A', defs: registry([kuriGame(src)]) });
    let now = 1000;
    expect(s.open({ gm: 'kuri', o: quizOpts.encode({ lv: 3, timer: 30 }) }, now)).toEqual([]);
    expect(s.go(now)).toEqual([]);
    const plan = [{ a: kuriAnswer(5, 5), rp: 0 }, { a: kuriAnswer(5, 5), rp: 1 }, { a: skipAnswer(4), rp: 0 }, { a: kuriAnswer(1, 5), rp: 0 }, { a: kuriAnswer(2, 5), rp: 0 }];
    let k = 0;
    for (let step = 0; step < 100; step++) {
      const v = s.view(now);
      if (v.phase === 'results') break;
      if (v.phase === 'answer' && !v.answers[v.i]) {
        expect(s.answer(plan[k].a, plan[k].rp, now)).toEqual([]);
        k++;
      } else if (v.phase === 'reveal') s.next(now);
      else now = Number.isFinite(v.until) ? v.until : now + 1000;
    }
    const v = s.view(now);
    expect(v.phase).toBe('results');
    // s0 (rung 0: 8 syllables), climbed to s1 (10); replayed, so still 10: s2 (12, the nearest left); the skip stays
    // too (s3), then two misses
    expect(v.ids).toEqual([0, 1, 2, 3, 4]);
    expect(k).toBe(5);
  });
});
