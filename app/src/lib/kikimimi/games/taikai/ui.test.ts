// しずえの しゅうまつ たいかい as the sheet plays it (docs/kikimimi-framework.md "G-たいかい logic as built"; the UI in
// components/kikimimi/taikai/): source.ts's helpers over this build's content (my offer, the host's pick from its lobby's
// view, the outcome on any phone), the quiz family's lobby opening and answering it (games/quiz/session.ts, view.ts), and
// its row kept in my games for the trophy shelf (progress.ts gamesOf, def.ts trophiesOf).
import { describe, expect, it } from 'vitest';
import type { EventRow } from '../../../contract/api.ts';
import { loadAll } from '../../pool.ts';
import { gamesOf } from '../../progress.ts';
import { QuizRounds } from '../quiz/session.ts';
import { WINDOWS } from '../../round/session.ts';
import { registry } from '../../round/registry.ts';
import { EV_MISS, offerEvents, OFFER_MAX } from './pick.ts';
import { chipsAfter, taikaiGame, taikaiTarget, tierLevel, trophiesOf, trophyOf, wagerAnswer } from './def.ts';
import { TAIKAI_IDS, taikaiOffer, taikaiOutcome, taikaiPickFor, taikaiPool, taikaiSource } from './source.ts';

await loadAll();
/** Saturday 2026-11-07 20:00 Tokyo: the weekend of Friday 2026-11-06, its misses from Monday 2026-11-02. */
const SAT = Date.UTC(2026, 10, 7, 11);
const pool = taikaiPool();
const idOf = (n: number) => TAIKAI_IDS.entry(n)!.id;

describe('たいかい for the UI: offers, the pick, the outcome', () => {
  it('my offer: this week’s misses numbered, at most 4; last week’s or put right since left out', () => {
    const [a, b, c, d, e, f] = pool.slice(0, 6).map(idOf);
    const miss = (id: string, day: string) => ({ id, ok: false, rp: 0, d: day });
    const answers = [
      miss(a, '2026-11-03'), miss(b, '2026-11-04'), miss(b, '2026-11-05'), miss(c, '2026-10-30'), miss(d, '2026-11-06'), miss(e, '2026-11-07'), miss(f, '2026-11-07'),
      { id: d, ok: true, rp: 0, d: '2026-11-07' }
    ];
    const offer = taikaiOffer(answers, SAT);
    expect(offer.length).toBe(OFFER_MAX);
    expect(offer[0]).toBe(TAIKAI_IDS.num(b)); // missed twice: first
    expect(offer.map(idOf)).not.toContain(c); // the week before
    expect(offer.map(idOf)).not.toContain(d); // right on the first listen since
    expect(taikaiOffer([], SAT)).toEqual([]);
  });

  it('the host’s pick from its lobby: its own offer and the offers heard first, filled to 8 at the players’ levels; deterministic', () => {
    const mine = pool.slice(0, 2), hers = pool.slice(40, 44);
    const evs = offerEvents(hers).map((v) => ({ who: 'B' as const, ...v }));
    const pick = taikaiPickFor({ seed: 7, me: 'A', mine, evs, tiers: { A: 1, B: 3 } });
    expect(pick).toHaveLength(8);
    for (const n of [...mine, ...hers]) expect(pick).toContain(n);
    expect(taikaiPickFor({ seed: 7, me: 'A', mine, evs, tiers: { A: 1, B: 3 } })).toEqual(pick);
    // alone with no misses: 8 fresh ones at my tier's level, my recent games' last
    const solo = taikaiPickFor({ seed: 3, me: 'A', mine: [], evs: [], tiers: { A: 1 } });
    expect(solo).toHaveLength(8);
    expect(solo.filter((n) => TAIKAI_IDS.entry(n)!.lv === tierLevel(1)).length).toBeGreaterThan(4);
    const again = taikaiPickFor({ seed: 3, me: 'A', mine: [], evs: [], tiers: { A: 1 }, recent: [solo.map(idOf)] });
    expect(again.filter((n) => solo.includes(n)).length).toBeLessThan(8);
  });

  it('the outcome: しずえ’s target from the rounds and everyone’s tiers, the trophy for the team’s rounds right', () => {
    const ids = taikaiPickFor({ seed: 5, me: 'A', mine: [], evs: [], tiers: { A: 1 } });
    const target = taikaiTarget(taikaiSource.rounds(5, ids), [1, 2]);
    expect(taikaiOutcome(5, ids, { A: 1, B: 2 }, target.silver)).toEqual({ target, trophy: 'silver' });
    expect(taikaiOutcome(5, ids, { A: 1, B: 2 }, 0).trophy).toBe('bronze');
    expect(taikaiOutcome(5, ids, { A: 1, B: 2 }, 8).trophy).toBe(trophyOf(8, target));
  });
});

describe('たいかい in the quiz family’s lobby', () => {
  it('opens at my tier with my offer’s count in its options, picks its ids, keeps both as the host changes こたえる じかん; the wager answered with its bet', () => {
    const s = new QuizRounds({ me: 'A', defs: registry([taikaiGame(taikaiSource)]), random: () => 0.5 });
    s.taikai({ tier: 2, timer: 30, offered: 3 }, SAT);
    let v = s.view(SAT);
    expect(v).toMatchObject({ phase: 'lobby', gm: 'taikai', o: [2, 0, 3], ids: [], n: 0, timer: 30 });
    const ids = taikaiPickFor({ seed: v.seed, me: 'A', mine: [], evs: [], tiers: v.tiers });
    s.pick(ids, SAT);
    s.configure({ timer: 20, vs: true }, SAT);
    v = s.view(SAT);
    expect(v).toMatchObject({ ids, n: 8, o: [2, 1, 3], timer: 20, vs: true, tiers: { A: 2 } });
    s.event(0, EV_MISS, 5, SAT); // (the host's own: none sent, but kept)
    s.go(SAT);
    // through to the wager, my answers as given
    let t = SAT + WINDOWS.countdown;
    const rounds = taikaiSource.rounds(v.seed, ids);
    for (let i = 0; i < 8; i++) {
      const at = t + WINDOWS.lead + rounds[i].play + 10, r = rounds[i];
      s.answer(i === 7 ? wagerAnswer(r.answer, 70) : r.answer, false, at);
      s.next(at + 1);
      t = at + 1;
    }
    v = s.view(t + 1);
    expect(v.phase).toBe('results');
    expect(v.answers[7]).toMatchObject({ k: rounds[7].answer, bet: 70 });
    expect(v.answers[0]!.bet).toBeUndefined();
    expect(v.team.right).toBe(8);
    expect(v.scores.A).toBeGreaterThan(chipsAfter({ bet: 70, ok: true }));
  });

  it('its row kept in my games (gm and the trophy), the trophy shelf the best per weekend', () => {
    const id = idOf(pool[0]);
    const row = (g: string, d: string, u: string): EventRow => [`${d}T11:00:00.000Z`, 'A', `e-${g}`, 'listen', JSON.stringify({ d, g, gm: 'taikai', u, lv: 3, n: 1, ms: 300_000, r: [[id, 1, 0, 0]] })];
    const { mine } = gamesOf([row('aa11', '2026-11-07', 'bronze'), row('bb22', '2026-11-08', 'silver'), row('cc33', '2026-10-31', 'gold')], 'A');
    expect(mine.map((g) => [g.gm, g.u])).toEqual([['taikai', 'gold'], ['taikai', 'bronze'], ['taikai', 'silver']]);
    expect(trophiesOf(mine)).toEqual(new Map([['2026-11-06', 'silver'], ['2026-10-30', 'gold']]));
  });
});
