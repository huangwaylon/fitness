// しずえの しゅうまつ たいかい (games/taikai/): its window, the week's misses and who offers what, the host's pick, the
// deck every phone deals from the open alone, the tiers' points, the wager, しずえ's target and the trophies; and a whole
// tournament over two phones on the `play` wire (round/session.ts, round/wire.ts), the joiner's misses offered as events.
import { describe, expect, it } from 'vitest';
import type { Item, Level } from '../../bank.ts';
import type { LocalDate, Who } from '../../../types.ts';
import { ENTRIES, INDEX, loadAll } from '../../pool.ts';
import { RoundSession, WINDOWS } from '../../round/session.ts';
import { registry } from '../../round/registry.ts';
import { playIn, playOut, type RoundOut } from '../../round/wire.ts';
import type { PlayIn } from '../../round/wire.ts';
import { taikaiAt, taikaiDays, taikaiOfDay, taikaiOpen } from './window.ts';
import { EV_MISS, OFFER_MAX, TAIKAI_ROUNDS, interleave, numbering, offerEvents, offerOf, offersOf, taikaiPick, weekMisses } from './pick.ts';
import {
  BETS, CHIPS, CONFIDENT, chipsAfter, choiceOf, expected, questionPoints, taikaiDeck, taikaiGame, taikaiItems, taikaiOpts, taikaiRounds, taikaiRow, taikaiTarget,
  tierLevel, tierOf, trophiesOf, trophyOf, wagerAnswer, wagerOf, wagerReveal, type TaikaiRound
} from './def.ts';
import { TAIKAI_IDS, taikaiDeals, taikaiDeck as dealtDeck, taikaiLevels, taikaiPool, taikaiSource } from './source.ts';

const HOUR = 3_600_000;
/** 2026-11-06 is a Friday; 18:00 Tokyo is 09:00 UTC. */
const FRI = Date.UTC(2026, 10, 6, 9);

describe('たいかい: the window (Fri 18:00 – Mon 05:00 Tokyo)', () => {
  it('opens Friday at 18:00 and closes Monday at 05:00, Tokyo time', () => {
    expect(taikaiOpen(FRI - 1)).toBe(false);
    expect(taikaiOpen(FRI)).toBe(true);
    expect(taikaiOpen(FRI + 24 * HOUR)).toBe(true); // Saturday 18:00
    expect(taikaiOpen(FRI + 59 * HOUR - 1)).toBe(true); // Monday 04:59:59
    expect(taikaiOpen(FRI + 59 * HOUR)).toBe(false); // Monday 05:00
    expect(taikaiOpen(FRI - 3 * 24 * HOUR)).toBe(false); // Tuesday
  });

  it('names the weekend by its Friday; under way, its span; closed, the next one', () => {
    expect(taikaiAt(FRI + HOUR)).toEqual({ open: true, from: FRI, until: FRI + 59 * HOUR, fri: '2026-11-06' });
    expect(taikaiAt(FRI + 58 * HOUR)).toMatchObject({ open: true, fri: '2026-11-06' }); // Monday 04:00: still that Friday's
    expect(taikaiAt(FRI + 59 * HOUR)).toEqual({ open: false, from: FRI + 7 * 24 * HOUR, until: FRI + 7 * 24 * HOUR + 59 * HOUR, fri: '2026-11-13' });
    expect(taikaiAt(FRI - 2 * 24 * HOUR)).toEqual({ open: false, from: FRI, until: FRI + 59 * HOUR, fri: '2026-11-06' }); // Wednesday
    // across a year's end: Friday 2027-01-01
    expect(taikaiAt(Date.UTC(2027, 0, 2, 3))).toMatchObject({ open: true, fri: '2027-01-01' });
  });

  it('a row’s day files under its weekend (Monday the one before; Tuesday to Thursday none); the misses come from its week, Monday on', () => {
    expect(['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'].map((d) => taikaiOfDay(d as LocalDate))).toEqual(Array(4).fill('2026-11-06'));
    expect(['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-10'].map((d) => taikaiOfDay(d as LocalDate))).toEqual([null, null, null, null]);
    expect(taikaiDays('2026-11-06')).toEqual({ from: '2026-11-02', to: '2026-11-09' });
  });
});

// ---------- fixtures ----------

const TYPES = ['word', 'num', 'reply', 'mean', 'pic'] as const;
/** 40 test items: 8 at each of levels 1-4 and 6, types in turn, 3 choices (the right one as authored: index i % 3). */
const ITEMS: Item[] = [1, 2, 3, 4, 6].flatMap((lv) =>
  Array.from({ length: 8 }, (_, k): Item => ({
    id: `t${lv}-${k}`, lv: lv as Level, type: TYPES[k % TYPES.length], en: 'x', ja: 'x', speaker: 'isabelle', voice: 'us', choices: ['a', 'b', 'c'], answer: k % 3
  }) as unknown as Item)
);
const NUMS = numbering(ITEMS);
const lookup = (n: number) => {
  const e = NUMS.entry(n);
  return e && ITEMS.find((it) => it.id === e.id);
};
const testSource = { rounds: (seed: number, ids: readonly number[]) => taikaiRounds(taikaiItems(seed, ids, lookup), () => 2000), cv: () => 'abc123' };
const ids = (...xs: string[]) => xs.map((x) => NUMS.num(x)!);

describe('たいかい: the week’s misses and the host’s pick', () => {
  const day = (d: string) => d as LocalDate;
  const a = (id: string, ok: boolean, d: string, rp = 0) => ({ id, ok, rp, d: day(d) });

  it('my misses this week: most missed first, then the latest; one since right on the first listen, before the week or unknown left out', () => {
    const answers = [
      a('t3-1', false, '2026-11-01'), // Sunday: last week's
      a('t3-2', false, '2026-11-02'),
      a('t3-3', false, '2026-11-03'),
      a('t3-3', false, '2026-11-05'),
      a('t3-4', false, '2026-11-06'),
      a('t3-5', false, '2026-11-04'),
      a('t3-5', true, '2026-11-05'), // fixed
      a('t3-6', false, '2026-11-04'),
      a('t3-6', true, '2026-11-05', 2), // right after a replay: still a miss
      a('zz-gone', false, '2026-11-04')
    ];
    expect(weekMisses(answers, '2026-11-06', (id) => !!NUMS.num(id))).toEqual(['t3-3', 't3-4', 't3-6', 't3-2']);
    const offer = offerOf(['t3-3', 'zz', 't3-4', 't3-6', 't3-2', 't3-7'], NUMS);
    expect(offer).toEqual(ids('t3-3', 't3-4', 't3-6', 't3-2'));
    expect(offer.length).toBe(OFFER_MAX);
    // as events, and heard back by player in slot order (another kind ignored)
    const evs = offerEvents(offer).map((v) => ({ ...v, who: 'B' as Who }));
    expect(evs[0]).toEqual({ i: 0, e: EV_MISS, x: offer[0], who: 'B' });
    expect(offersOf([...evs].reverse().concat({ who: 'A', i: 0, e: 9, x: 1 }))).toEqual({ B: offer });
  });

  it('the pick: the offers round-robin (A B G, each one’s best first, no item twice), the hardest last as the wager, the rest interleaved; deterministic', () => {
    const offers = { A: ids('t3-0', 't3-1', 't3-2', 't3-3'), B: ids('t6-0', 't3-1', 't6-2', 't6-3', 't6-4') };
    const pick = taikaiPick({ seed: 7, offers, levels: [3, 6], pool: [], ids: NUMS });
    expect(pick).toEqual(taikaiPick({ seed: 7, offers, levels: [3, 6], pool: [], ids: NUMS }));
    expect(new Set(pick)).toEqual(new Set(ids('t3-0', 't6-0', 't3-1', 't6-2', 't3-2', 't6-3', 't3-3')));
    expect(NUMS.entry(pick.at(-1)!)).toMatchObject({ lv: 6, type: 'mean' }); // the hardest: やま's mean (t6-3)
    const qs = pick.slice(0, -1).map((n) => NUMS.entry(n)!);
    for (let k = 1; k < qs.length; k++) expect(qs[k].type === qs[k - 1].type && qs[k].lv === qs[k - 1].lv).toBe(false);
  });

  it('interleaving keeps types (and levels, where it can) apart', () => {
    const ns = ids('t1-0', 't1-5', 't2-0', 't2-1', 't3-1', 't3-6'); // words at levels 1, 1, 2; nums at 2, 3, 3
    const out = interleave(ns, NUMS).map((n) => NUMS.entry(n)!);
    expect(out.map((e) => e.id).sort()).toEqual([...ns].map((n) => NUMS.entry(n)!.id).sort());
    for (let k = 1; k < out.length; k++) expect(out[k].type).not.toBe(out[k - 1].type);
  });

  it('few misses: fresh items fill to 8 at each player’s level in turn (the host’s recent games last), by the seed', () => {
    const pool = ITEMS.map((it) => NUMS.num(it.id)!);
    const avoid = new Set(ids('t3-1', 't3-2', 't3-3', 't3-4', 't3-5', 't3-6', 't3-7'));
    const pick = taikaiPick({ seed: 3, offers: { A: ids('t3-0') }, levels: [3, 6], pool, avoid, ids: NUMS });
    expect(pick).toHaveLength(TAIKAI_ROUNDS);
    expect(pick).toContain(NUMS.num('t3-0'));
    const lvs = pick.map((n) => NUMS.entry(n)!.lv);
    expect(lvs.filter((l) => l === 3).length).toBeGreaterThanOrEqual(3);
    expect(lvs.filter((l) => l === 6).length).toBeGreaterThanOrEqual(3);
    // level 3 has 8 items, 7 avoided: one fresh before any avoided one, then the avoided as needed
    expect(pick.filter((n) => NUMS.entry(n)!.lv === 3 && !avoid.has(n))).toHaveLength(1);
    expect(taikaiPick({ seed: 4, offers: {}, levels: [3, 6], pool, ids: NUMS })).not.toEqual(taikaiPick({ seed: 5, offers: {}, levels: [3, 6], pool, ids: NUMS }));
    expect(taikaiPick({ seed: 4, offers: {}, levels: [], pool: [], ids: NUMS })).toEqual([]);
  });
});

describe('たいかい: the deck every phone deals', () => {
  it('the same seed and ids deal the same rounds on any phone, whatever else it has dealt; the choices shuffled by the seed; the last the wager', () => {
    const pick = ids('t1-0', 't2-1', 't3-2', 't4-3', 't6-4', 't3-5', 't2-6', 't6-3');
    const a = testSource.rounds(11, pick);
    testSource.rounds(12, pick.slice(2));
    expect(testSource.rounds(11, [...pick])).toEqual(a);
    expect(a.map((r) => r.id)).toEqual(pick.map((n) => NUMS.entry(n)!.id));
    expect(a.map((r) => r.kind)).toEqual([...Array(7).fill('taikai.q'), 'taikai.wager']);
    const seeds = Array.from({ length: 12 }, (_, s) => testSource.rounds(s, pick).map((r) => r.answer).join(''));
    expect(new Set(seeds).size).toBeGreaterThan(1);
    expect(taikaiRounds(taikaiItems(1, pick.slice(0, 1), lookup), () => undefined)).toMatchObject([{ kind: 'taikai.q', play: 2000 }]);
  });

  it('over this build’s content: every item numbered once, level by level; the deck dealt from the index alone, the same twice', async () => {
    await loadAll();
    expect(new Set(ENTRIES.map((e) => TAIKAI_IDS.num(e.id))).size).toBe(ENTRIES.length);
    expect(TAIKAI_IDS.entry(0)!.lv).toBe(Math.min(...ENTRIES.map((e) => e.lv)));
    const pool = taikaiPool();
    expect(pool.length).toBe(ENTRIES.filter((e) => INDEX.offered.includes(e.lv)).length);
    expect(pool.every((n) => taikaiDeals(TAIKAI_IDS.entry(n)!.id))).toBe(true);
    expect(taikaiDeals('sp-platform-1')).toBe(false);
    const pick = taikaiPick({ seed: 99, offers: {}, levels: [3, 4], pool, ids: TAIKAI_IDS });
    expect(pick).toHaveLength(TAIKAI_ROUNDS);
    expect(taikaiLevels(pick).every((lv) => INDEX.offered.includes(lv))).toBe(true);
    const rs = taikaiSource.rounds(99, pick);
    expect(rs).toHaveLength(TAIKAI_ROUNDS);
    expect(rs).toEqual(taikaiRounds(dealtDeck(99, pick), () => undefined).map((r, i) => ({ ...r, play: rs[i].play })));
    expect(rs.every((r) => r.play > 0)).toBe(true);
    expect(taikaiSource.cv!()).toMatch(/^[0-9a-f]{6}$/);
  });
});

describe('たいかい: tiers, points and the wager', () => {
  it('a tier is the comfortable level’s place (unmeasured: かわ); a tier’s own level is where it expects 80 %; a stretch pays more', () => {
    expect([null, 1, 2, 2.6, 3.4, 4, 5.2, 6.5].map(tierOf)).toEqual([1, 0, 0, 1, 1, 2, 3, 3]);
    expect([0, 1, 2, 3].map(tierLevel)).toEqual([2, 3, 4, 6]);
    expect(expected(1, 1)).toBeCloseTo(0.8);
    expect(questionPoints(1, 1)).toBe(70);
    expect(questionPoints(0, 3)).toBeGreaterThan(questionPoints(3, 3)); // the same item pays the lower tier more
    expect(questionPoints(0, 10)).toBeLessThanOrEqual(150);
    expect(questionPoints(3, -5)).toBeGreaterThanOrEqual(50);
  });

  it('the wager: 10-100 of the round’s 100 chips as [choice, bet / 10]; right pays ×2, wrong loses it; a confident miss is the big reveal', () => {
    expect(BETS).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(wagerAnswer(2, 70)).toEqual([2, 7]);
    expect(wagerOf([2, 7])).toEqual({ choice: 2, bet: 70 });
    for (const bad of [2, [2], [2, 0], [2, 11], [-1, 3], [1, 2, 3], [1.5, 2]]) expect(wagerOf(bad)).toBeNull();
    expect(choiceOf([2, 7])).toBe(2);
    expect(choiceOf(1)).toBe(1);
    expect(chipsAfter({ bet: 70, ok: true })).toBe(170);
    expect(chipsAfter({ bet: 70, ok: false })).toBe(30);
    expect(chipsAfter(null)).toBe(CHIPS);
    expect([wagerReveal(CONFIDENT, false), wagerReveal(100, true), wagerReveal(60, false), wagerReveal(10, true)]).toEqual(['confident-miss', 'confident-right', 'miss', 'right']);
  });

  it('a deck at a tier: questions take a choice, the wager [choice, bet]; points by the tier; the score the points and the chips after (しょうぶ)', () => {
    const rounds: TaikaiRound[] = [
      { kind: 'taikai.q', id: 'q0', answer: 1, choices: 3, play: 2000, b: 1 },
      { kind: 'taikai.q', id: 'q1', answer: 0, choices: 4, play: 3000, b: 3 },
      { kind: 'taikai.wager', id: 'q2', answer: 2, choices: 3, play: 2500, b: 2 }
    ];
    const d0 = taikaiDeck(() => rounds, { tier: 0, timer: 30 }, WINDOWS), d2 = taikaiDeck(() => rounds, { tier: 2, timer: 30 }, WINDOWS);
    expect(d0.count).toBe(3);
    expect([d0.valid(0, 2), d0.valid(0, 3), d0.valid(1, 3), d0.valid(0, [1, 2]), d0.valid(2, 2), d0.valid(2, [2, 10]), d0.valid(2, [3, 1])]).toEqual([true, false, true, false, false, true, false]);
    expect(d0.timing(0)).toEqual({ lead: WINDOWS.lead, play: 2000, answer: 30_000 });
    expect(d0.timing(2).answer).toBe(45_000);
    expect(taikaiDeck(() => rounds, { tier: 0, timer: 0 }, WINDOWS).timing(2).answer).toBe(Infinity);
    expect(d0.grade(1, 0, 3)).toEqual({ ok: true, pts: questionPoints(0, 3) });
    expect(d2.grade(1, 0, 0).pts).toBeLessThan(d0.grade(1, 0, 0).pts);
    expect(d0.grade(1, 1, 0)).toEqual({ ok: false, pts: 0 });
    expect(d0.grade(2, [2, 5], 0)).toEqual({ ok: true, pts: 50 });
    const answers = new Map([[0, { a: 1, rp: 0, t: 0 }], [1, { a: 0, rp: 1, t: 0 }], [2, { a: [0, 8] as number[], rp: 0, t: 0 }]]);
    expect(d0.score!(answers)).toBe(questionPoints(0, 1) + questionPoints(0, 3) + 20);
    expect(d0.score!(new Map())).toBe(CHIPS);
    expect(d0.maxScore).toBe(2 * 150 + 200);
  });

  it('options [tier, こたえる じかん]; the def: co-op, しょうぶ and solo, tiers per player', () => {
    expect(taikaiOpts.encode({ tier: 2, timer: 60 })).toEqual([2, 2]);
    expect(taikaiOpts.decode([2, 2])).toEqual({ tier: 2, timer: 60 });
    for (const bad of [[4, 0], [-1, 0], [1, 9], []]) expect(taikaiOpts.decode(bad)).toBeNull();
    const g = taikaiGame(testSource);
    expect(g).toMatchObject({ id: 'taikai', modes: { solo: true, coop: true, vs: true } });
    expect(g.tier!.with({ tier: 0, timer: 30 }, 3)).toEqual({ tier: 3, timer: 30 });
    expect(g.cv!({ tier: 0, timer: 30 })).toBe('abc123');
  });
});

describe('たいかい: しずえ’s target and the trophies', () => {
  it('the target is the rounds the team should get (someone at their tier), rounded, short of all; gold two more; a stronger team gets a higher bar', () => {
    const rs = Array.from({ length: 8 }, (_, k) => ({ b: k % 2 ? 2 : 1 }));
    const solo = taikaiTarget(rs, [1]), pair = taikaiTarget(rs, [1, 2]);
    expect(solo.expected).toBeCloseTo(4 * expected(1, 1) + 4 * expected(1, 2));
    expect(solo).toMatchObject({ silver: Math.round(solo.expected), gold: Math.round(solo.expected) + 2 });
    expect(pair.expected).toBeGreaterThan(solo.expected);
    expect(taikaiTarget(rs, [3, 3]).silver).toBe(7);
    expect(taikaiTarget(rs, [3, 3]).gold).toBe(8);
    expect(taikaiTarget([{ b: 9 }, { b: 9 }], [0]).silver).toBe(1);
  });

  it('the trophy by the team’s rounds: gold at its line, silver at the target, bronze for taking part; on the row as gm taikai and u; the best per weekend', () => {
    const t = { silver: 5, gold: 7 };
    expect([8, 7, 6, 5, 4, 0].map((n) => trophyOf(n, t))).toEqual(['gold', 'gold', 'silver', 'silver', 'bronze', 'bronze']);
    expect(taikaiRow('silver', 1)).toEqual({ gm: 'taikai', u: 'silver', lv: 3 });
    const rows = [
      { d: '2026-11-06' as LocalDate, gm: 'taikai', u: 'bronze' },
      { d: '2026-11-08' as LocalDate, gm: 'taikai', u: 'gold' },
      { d: '2026-11-09' as LocalDate, gm: 'taikai', u: 'silver' },
      { d: '2026-11-13' as LocalDate, gm: 'taikai', u: 'silver' },
      { d: '2026-11-13' as LocalDate, gm: 'lesson', u: 'gold' },
      { d: '2026-11-11' as LocalDate, gm: 'taikai', u: 'gold' }
    ];
    expect(trophiesOf(rows)).toEqual(new Map([['2026-11-06', 'gold'], ['2026-11-13', 'silver']]));
  });
});

// ---------- two phones ----------

const T0 = Date.UTC(2026, 10, 7, 11); // Saturday 20:00 Tokyo

/** Two phones on a fake relay, the `play` wire both ways (every op out through playOut, in through playIn). */
function pair() {
  let n = 0;
  const random = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  const make = (me: Who) => new RoundSession({ me, defs: registry([taikaiGame(testSource)]), random });
  const s = { A: make('A'), B: make('B') };
  type P = keyof typeof s;
  const sent: { from: P; m: ReturnType<typeof playOut> }[] = [];
  const deliver = (from: P, out: RoundOut[], now: number) => {
    for (const m of out) {
      const p = playOut(m);
      expect(p, `${m.op} goes out on play`).not.toBeNull();
      sent.push({ from, m: p });
      const to: P = from === 'A' ? 'B' : 'A';
      deliver(to, s[to].receive(playIn({ ...p!, v: 3, who: from, t: now } as PlayIn)!, now), now);
    }
  };
  s.A.presence(['B'], T0);
  s.B.presence(['A'], T0);
  return { s, sent, act: (w: P, f: (x: RoundSession) => RoundOut[], now = T0) => deliver(w, f(s[w]), now) };
}

describe('たいかい: a tournament over two phones', () => {
  it('B’s misses offered as events, A’s pick sent again as the open’s ids; both phones deal the same deck; each graded at their own tier; the team’s trophy the same on both', () => {
    const r = pair();
    const mine = ids('t3-0', 't3-1', 't3-2', 't3-3'), hers = ids('t6-0', 't6-1', 't6-2', 't6-3');
    const levels = (t: Partial<Record<Who, number>>) => Object.values(t).map((x) => tierLevel(x!));
    // A (tier 1) opens with its own misses and invites; B (tier 3) joins and offers its misses
    const first = taikaiPick({ seed: 1, offers: { A: mine }, levels: [3], pool: [], ids: NUMS });
    r.act('A', (x) => x.open({ gm: 'taikai', o: taikaiOpts.encode({ tier: 1, timer: 30 }), ids: first }, T0));
    r.act('A', (x) => x.invite(T0));
    expect(r.sent.at(-1)!.m).toMatchObject({ kind: 'play', gm: 'taikai', op: 'open', ids: first, cv: 'abc123' });
    r.act('B', (x) => x.join(T0, undefined, 3));
    expect(r.sent.at(-1)!.m).toMatchObject({ op: 'join', tr: 3 });
    for (const v of offerEvents(hers)) r.act('B', (x) => x.event(v.i, v.e, v.x, T0));
    expect(r.s.B.event(0, EV_MISS, hers[0], T0)).toEqual([]); // (the same again: nothing)
    // A hears the offers, picks again and sends the open again with the new ids
    const va = r.s.A.view(T0);
    expect(va.tiers).toEqual({ A: 1, B: 3 });
    expect(offersOf(va.evs)).toEqual({ B: hers });
    const pick = taikaiPick({ seed: va.seed, offers: { A: mine, ...offersOf(va.evs) }, levels: levels(va.tiers), pool: [], ids: NUMS });
    expect(pick).toHaveLength(TAIKAI_ROUNDS);
    r.act('A', (x) => x.configure({ ids: pick }, T0));
    expect(r.sent.at(-1)!.m).toMatchObject({ op: 'open', ids: pick, seed: va.seed });
    const vb = r.s.B.view(T0);
    expect(vb).toMatchObject({ phase: 'lobby', gm: 'taikai', ids: pick, seed: va.seed, o: [3, 0], tiers: { A: 1, B: 3 } });
    // both deal the same 8 rounds
    expect(testSource.rounds(vb.seed, vb.ids)).toEqual(testSource.rounds(va.seed, r.s.A.view(T0).ids));
    const rounds = testSource.rounds(va.seed, pick);
    expect(rounds.at(-1)!.kind).toBe('taikai.wager');

    // play: A right on even rounds, B on rounds 0-5; the wager: A bets 80 and misses (a confident miss), B 30 and is right
    r.act('A', (x) => x.go(T0));
    let t = T0 + WINDOWS.countdown;
    for (let i = 0; i < rounds.length; i++) {
      const at = t + WINDOWS.lead + rounds[i].play + 10;
      const right = rounds[i].answer, wrong = (right + 1) % rounds[i].choices;
      const last = i === rounds.length - 1;
      r.act('A', (x) => x.answer(last ? wagerAnswer(wrong, 80) : i % 2 ? wrong : right, 0, at), at);
      r.act('B', (x) => x.answer(last ? wagerAnswer(right, 30) : i < 6 ? right : wrong, 0, at), at);
      expect(r.s.A.view(at).phase).toBe('reveal');
      r.act('A', (x) => x.next(at + 1), at + 1);
      t = at + 1;
    }
    const end = t + 1, A = r.s.A.view(end), B = r.s.B.view(end);
    expect([A.phase, B.phase]).toEqual(['results', 'results']);
    // the team: rounds 0-5 (B), 6 (A), the wager (B): 8 of 8, on both phones
    expect(A.team).toEqual(B.team);
    expect(A.team.right).toBe(8);
    expect(A.scores).toEqual(B.scores);
    const qs = rounds.slice(0, -1);
    expect(A.scores.A).toBe(qs.reduce((s, q, i) => s + (i % 2 ? 0 : questionPoints(1, q.b)), 0) + 20);
    expect(A.scores.B).toBe(qs.reduce((s, q, i) => s + (i < 6 ? questionPoints(3, q.b) : 0), 0) + 130);
    expect(wagerReveal(80, false)).toBe('confident-miss');
    // the trophy, from the same rounds and tiers on both phones
    const target = taikaiTarget(rounds, Object.values(A.tiers) as number[]);
    expect(taikaiTarget(rounds, Object.values(B.tiers) as number[])).toEqual(target);
    expect(trophyOf(A.team.right, target)).toBe('gold');
    // the answers as the row keeps them: the wager's choice
    expect(A.answers.map((a) => choiceOf(a!.a))).toHaveLength(8);
  });

  it('a phone back from a lock gets the joiner’s offers again with its join', () => {
    const r = pair();
    r.act('A', (x) => x.open({ gm: 'taikai', o: [1, 0], ids: ids('t3-0') }, T0));
    r.act('A', (x) => x.invite(T0));
    r.act('B', (x) => x.join(T0, undefined, 2));
    r.act('B', (x) => x.event(0, EV_MISS, 5, T0));
    const back = r.s.B.presence([], T0 + 1).concat(r.s.B.presence(['A'], T0 + 2));
    expect(back).toEqual([{ g: r.s.B.view(T0).g, gm: 'taikai', op: 'join', tr: 2 }, { g: r.s.B.view(T0).g, gm: 'taikai', op: 'ev', i: 0, e: EV_MISS, x: 5 }]);
  });
});
