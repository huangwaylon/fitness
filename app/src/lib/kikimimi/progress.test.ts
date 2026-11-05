// kikimimi/progress.ts, srs.ts, advice.ts: きろく's stats, the cards and にがて れんしゅう, and the advice
// (docs/kikimimi.md "Progress & feedback"). Pure, over made-up games.
import { describe, expect, it } from 'vitest';
import type { EventRow } from '../contract/api.ts';
import { BANK, type Level } from './bank.ts';
import { DECK_SIZE } from './deck.ts';
import { answersOf, dayNum, daysPlayed, gamesOf, recentOf, scoreOf, stageOf, statsOf, together, trendOf, weekDays, type Answer, type Game } from './progress.ts';
import { cardsOf, dueOf, gradeOf, practiceDeck, step } from './srs.ts';
import { feedback, recommend, tripsOf } from './advice.ts';
import { skillsOf } from './tags.ts';

const TODAY = '2026-11-05'; // a Thursday
let seq = 0;
/** A game of `ids` (right unless listed in `miss`; `rp` replays for those in `replayed`). */
function game(ids: string[], o: { d?: string; miss?: string[]; replayed?: string[]; lv?: number; p?: boolean; g?: string; ms?: number } = {}): Game {
  const d = o.d ?? TODAY, g = o.g ?? `g${String(++seq).padStart(3, '0')}`, lv = o.lv ?? 2;
  const r: Answer[] = ids.map((id) => ({ id, ok: !o.miss?.includes(id), pick: o.miss?.includes(id) ? 1 : 0, rp: o.replayed?.includes(id) ? 1 : 0, d, g, lv, p: !!o.p }));
  return { d, g, lv, n: 1, ms: o.ms ?? 180_000, p: !!o.p, r, at: seq };
}
const ids = (prefix: string, n = 8) => BANK.filter((it) => it.id.startsWith(prefix)).slice(0, n).map((it) => it.id);
const LV: Level[] = [1, 2, 3];

describe('gamesOf', () => {
  it('reads my rows whole and the others’ as summaries, skipping bad rows', () => {
    const mine = { d: TODAY, g: 'ab12', lv: 2, n: 2, ms: 120_000, r: [['w2-read', 1, 0, 0], ['n2-price-1', 0, 2, 1]] };
    const rows: EventRow[] = [
      ['2026-11-05T03:00:01.000Z', 'A', 'e1', 'listen', JSON.stringify(mine)],
      ['2026-11-05T03:00:02.000Z', 'B', 'e2', 'listen', JSON.stringify({ d: TODAY, g: 'ab12', n: 2, ms: 130_000 })],
      ['2026-11-05T03:00:03.000Z', 'A', 'e3', 'listen', '{"bad":1}'],
      ['2026-11-05T03:00:04.000Z', 'A', 'e4', 'listen', '{']
    ];
    const { mine: m, others } = gamesOf(rows, 'A');
    expect(m).toHaveLength(1);
    expect(m[0].r).toEqual([
      { id: 'w2-read', ok: true, pick: 0, rp: 0, d: TODAY, g: 'ab12', lv: 2, p: false },
      { id: 'n2-price-1', ok: false, pick: 2, rp: 1, d: TODAY, g: 'ab12', lv: 2, p: false }
    ]);
    expect(others).toEqual([{ who: 'B', d: TODAY, g: 'ab12', n: 2, ms: 130_000 }]);
  });
});

describe('statsOf', () => {
  it('scores first listen 1, after a replay 0.6, wrong 0', () => {
    expect([scoreOf({ ok: true, rp: 0 }), scoreOf({ ok: true, rp: 2 }), scoreOf({ ok: false, rp: 0 })]).toEqual([1, 0.6, 0]);
  });
  it('measures each skill from its items, hiding it below 3 answers', () => {
    const lr = ids('w1-').filter((id) => skillsOf(BANK.find((it) => it.id === id)!).primary === 'lr');
    const s = statsOf(answersOf([game(lr, { miss: lr.slice(0, 2) })]), TODAY);
    expect(s.skills.lr.n).toBe(lr.length);
    expect(s.skills.lr.m).toBeCloseTo((0.7 * 2 + lr.length - 2) / (2 + lr.length));
    expect(s.skills.num.m).toBeNull();
    expect(s.skills.num.raw).toBe(0.7);
    expect(s.features['l-r']!.n).toBe(lr.length);
  });
  it('weighs old answers less', () => {
    const old = statsOf(answersOf([game(['w1-right', 'w1-rock', 'w1-grass'], { d: '2026-08-01', miss: ['w1-right', 'w1-rock', 'w1-grass'] }), game(['w1-play', 'w1-fly', 'w1-collect'])]), TODAY);
    const fresh = statsOf(answersOf([game(['w1-play', 'w1-fly', 'w1-collect']), game(['w1-right', 'w1-rock', 'w1-grass'], { miss: ['w1-right', 'w1-rock', 'w1-grass'] })]), TODAY);
    expect(old.skills.lr.m!).toBeGreaterThan(fresh.skills.lr.m!);
  });
  it('counts per type, accent and level', () => {
    const s = statsOf(answersOf([game(['w2-cats', 'w2-live', 'r2-up-to'], { miss: ['w2-cats'], replayed: ['w2-live'] })]), TODAY);
    expect(s.byType.word).toEqual({ n: 2, right: 0.5, first: 0 });
    expect(s.byType.reply).toEqual({ n: 1, right: 1, first: 1 });
    expect(s.byAccent.uk).toEqual({ n: 1, right: 0, first: 0 });
    expect(s.byLevel[2]!.n).toBe(3);
  });
  it('raises the comfortable level with right answers and caps it by the levels played', () => {
    const l3 = BANK.filter((it) => it.lv === 3).map((it) => it.id);
    const strong = statsOf(answersOf([game(l3.slice(0, 24), { lv: 3 })]), TODAY);
    const weak = statsOf(answersOf([game(l3.slice(0, 24), { lv: 3, miss: l3.slice(0, 18) })]), TODAY);
    expect(strong.level!).toBeGreaterThan(weak.level!);
    expect(strong.level!).toBeLessThanOrEqual(3.5);
    expect(strong.measuring).toBe(false);
    expect(statsOf([], TODAY).level).toBeNull();
    expect(stageOf(3.2).stage.id).toBe('s1');
    expect(stageOf(3.0).into).toBeCloseTo(0.5);
    expect(stageOf(9).stage.id).toBe('s3');
  });
});

describe('trend, week, together', () => {
  it('trends first-listen accuracy per game and compares the last 5 with the 5 before', () => {
    const gs = Array.from({ length: 10 }, (_, i) => game(ids('w1-', 4), { miss: i < 5 ? ids('w1-', 2) : [] }));
    expect(trendOf(gs)).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 1, 1, 1, 1, 1]);
    expect(recentOf(gs)).toEqual({ now: 1, delta: 0.5 });
    expect(recentOf(gs.slice(0, 3))).toEqual({ now: 0.5, delta: null });
  });
  it('shows this week’s days played, Monday first, with no streak', () => {
    expect(weekDays(TODAY)).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08']);
    expect(weekDays('2026-11-02')[0]).toBe('2026-11-02');
    expect(weekDays('2026-11-08')[0]).toBe('2026-11-02');
    expect(daysPlayed([game(['w1-hat'], { d: '2026-11-02' }), game(['w1-hat'], { d: '2026-10-30' }), game(['w1-hat'])], TODAY)).toEqual([true, false, false, true, false, false, false]);
    expect(dayNum('1970-01-02')).toBe(1);
  });
  it('counts games played together and both people’s minutes this week, the guest never', () => {
    const mine = [game(['w1-hat'], { g: 'tog1', ms: 240_000 }), game(['w1-hat'], { g: 'solo1', ms: 120_000 }), game(['w1-hat'], { g: 'old1', d: '2026-10-20' })];
    const others = [
      { who: 'B' as const, d: TODAY, g: 'tog1', n: 2, ms: 240_000 },
      { who: 'B' as const, d: '2026-10-20', g: 'old1', n: 2, ms: 60_000 },
      { who: 'G' as const, d: TODAY, g: 'solo1', n: 1, ms: 600_000 }
    ];
    expect(together(mine, others, TODAY)).toEqual({ games: 1, minutes: 10, partner: true });
    expect(together(mine, [], TODAY)).toEqual({ games: 0, minutes: 6, partner: false });
  });
});

describe('the cards', () => {
  it('grades and steps through the boxes', () => {
    expect([gradeOf({ ok: true, rp: 0 }), gradeOf({ ok: true, rp: 1 }), gradeOf({ ok: false, rp: 0 })]).toEqual(['good', 'hard', 'again']);
    let c = step(undefined, 'again', 100);
    expect(c).toEqual({ box: 0, due: 100, last: 100 });
    c = step(c, 'hard', 100);
    expect(c).toEqual({ box: 1, due: 101, last: 100 });
    c = step(c, 'good', 101);
    expect(c).toEqual({ box: 2, due: 104, last: 101 });
    for (let i = 0; i < 9; i++) c = step(c, 'good', 200);
    expect(c.box).toBe(6);
    expect(c.due).toBe(290);
    expect(step(c, 'again', 300).box).toBe(0);
  });
  it('makes an item card from a miss or a replay only, a feature card from every answer', () => {
    const c = cardsOf(answersOf([game(['w1-right', 'w1-hat', 'n1-reps-1'], { miss: ['w1-right'], replayed: ['n1-reps-1'] })]));
    expect([...c.items.keys()].sort()).toEqual(['n1-reps-1', 'w1-right']);
    expect([...c.features.keys()].sort()).toEqual(['l-r', 'teen-ty', 'vowel']);
    const due = dueOf(c, TODAY);
    expect(due.items).toEqual(['w1-right']);
    expect(due.features).toEqual(['l-r']);
    expect(dueOf(c, '2026-11-06').items.sort()).toEqual(['n1-reps-1', 'w1-right']);
  });
});

describe('practiceDeck', () => {
  const history = [game(ids('w1-', 15), { miss: ['w1-right', 'w1-rock', 'w1-play', 'w1-fly'], d: '2026-11-03' }), game(ids('n1-', 15), { miss: ['n1-reps-1'], d: '2026-11-03' })];
  const answers = answersOf(history);
  const stats = statsOf(answers, TODAY);
  it('is 8 distinct items of the offered levels, deterministic by the seed', () => {
    const a = practiceDeck({ answers, stats, today: TODAY, seed: 7, levels: LV });
    expect(a).toHaveLength(DECK_SIZE);
    expect(new Set(a.map((it) => it.id)).size).toBe(DECK_SIZE);
    expect(a.every((it) => LV.includes(it.lv))).toBe(true);
    expect(practiceDeck({ answers, stats, today: TODAY, seed: 7, levels: LV })).toEqual(a);
    for (const it of a) expect(it.choices[it.answer]).toBe(BANK.find((b) => b.id === it.id)!.choices[BANK.find((b) => b.id === it.id)!.answer]);
  });
  it('brings back the items I missed and the features I miss', () => {
    const a = practiceDeck({ answers, stats, today: TODAY, seed: 1, levels: LV }).map((it) => it.id);
    const missed = ['w1-right', 'w1-rock', 'w1-play', 'w1-fly', 'n1-reps-1'];
    expect(a.filter((id) => missed.includes(id))).toHaveLength(4); // at most 4 due items
    const lr = a.filter((id) => skillsOf(BANK.find((b) => b.id === id)!).primary === 'lr');
    expect(lr.length).toBeGreaterThanOrEqual(4);
  });
  it('narrows to a focus', () => {
    const num = practiceDeck({ answers, stats, today: TODAY, seed: 3, levels: LV, focus: { skill: 'num' } });
    expect(num.every((it) => it.type === 'num')).toBe(true);
    const uk = practiceDeck({ answers, stats, today: TODAY, seed: 3, levels: LV, focus: { accent: 'uk' } });
    expect(uk.every((it) => it.voice === 'uk')).toBe(true);
  });
  it('works with no history at all', () => {
    const a = practiceDeck({ answers: [], stats: statsOf([], TODAY), today: TODAY, seed: 9, levels: [1] });
    expect(a).toHaveLength(DECK_SIZE);
  });
});

describe('the advice', () => {
  const bank = BANK;
  it('says nothing before a game', () => {
    expect(recommend({ stats: statsOf([], TODAY), games: [], dueItems: 0, levels: LV, bank })).toEqual([]);
  });
  it('puts due reviews first, then the weakest skills', () => {
    const lr = ['w1-right', 'w1-rock', 'w1-grass', 'w1-play', 'w1-fly', 'w1-collect'];
    const gs = [game([...lr, 'w1-hat', 'w1-cup'], { miss: lr, lv: 1 })];
    const stats = statsOf(answersOf(gs), TODAY);
    const recs = recommend({ stats, games: gs, dueItems: 6, levels: LV, bank });
    expect(recs[0]).toEqual({ kind: 'review', due: 6 });
    expect(recs[1]).toMatchObject({ kind: 'skill', skill: 'lr' });
    expect(recs).toHaveLength(3);
  });
  it('nudges a level up after 3 easy games, and steady after 3 hard ones', () => {
    const l1 = ids('w1-', 8);
    const easy = [game(l1, { lv: 1 }), game(l1, { lv: 1 }), game(l1, { lv: 1 })];
    expect(recommend({ stats: statsOf(answersOf(easy), TODAY), games: easy, dueItems: 0, levels: LV, bank })).toContainEqual({ kind: 'level', lv: 2 });
    const hard = [game(l1, { lv: 1, miss: l1.slice(0, 5) }), game(l1, { lv: 1, miss: l1.slice(0, 5) }), game(l1, { lv: 1, miss: l1.slice(0, 5) })];
    expect(recommend({ stats: statsOf(answersOf(hard), TODAY), games: hard, dueItems: 0, levels: LV, bank }).map((r) => r.kind)).toContain('steady');
  });
  it('names an accent well below the others', () => {
    const uk = BANK.filter((it) => it.voice === 'uk' && it.lv === 2).map((it) => it.id).slice(0, 6);
    const us = BANK.filter((it) => it.voice === 'us' && it.lv === 2 && it.type === 'pic').map((it) => it.id).slice(0, 6);
    const gs = [game([...uk, ...us], { miss: uk.slice(0, 3) })];
    const recs = recommend({ stats: statsOf(answersOf(gs), TODAY), games: gs, dueItems: 0, levels: [2], bank });
    expect(recs.some((r) => r.kind === 'accent' && r.accent === 'uk') || recs.length === 3).toBe(true);
  });
  it('feeds back the skill that rose, a perfect game, or encouragement', () => {
    const before = [game(['n1-reps-1', 'n1-reps-2', 'n1-reps-3', 'n1-turnips-1'], { miss: ['n1-reps-1', 'n1-reps-2', 'n1-reps-3'] })];
    const g = game(['n1-turnips-2', 'n1-turnips-3', 'n1-meet-1', 'n1-meet-2', 'w1-hat'], { miss: ['w1-hat'] });
    const b = statsOf(answersOf(before), TODAY), a = statsOf(answersOf([...before, g]), TODAY);
    expect(feedback({ game: g, before: b, after: a, recs: [] })).toEqual({ kind: 'up', skill: 'num', next: null });
    const perfect = game(['w1-cup']);
    expect(feedback({ game: perfect, before: a, after: statsOf(answersOf([...before, g, perfect]), TODAY), recs: [{ kind: 'review', due: 4 }] }).kind).toBe('perfect');
    const flat = game(['w1-cup'], { miss: ['w1-cup'] });
    expect(feedback({ game: flat, before: a, after: a, recs: [] }).kind).toBe('keep');
  });
  it('lists what tripped me, most first', () => {
    expect(tripsOf(game(['w1-right', 'w1-rock', 'n1-reps-1', 'w3-kitchen', 'w1-hat'], { miss: ['w1-right', 'w1-rock', 'n1-reps-1', 'w3-kitchen'] }))).toEqual([
      { key: 'f:l-r', skill: 'lr', n: 2 }, { key: 'f:teen-ty', skill: 'num', n: 1 }, { key: 's:cons', skill: 'cons', n: 1 }
    ]);
  });
});

describe('the demo', () => {
  it('has valid games of bank items, the partner’s as summaries', async () => {
    const { demoCache } = await import('#lib/store/demo/rows.ts');
    const rows = demoCache(Date.parse('2026-11-05T12:00:00+09:00')).rows.events.filter((r) => r[3] === 'listen');
    const { mine, others } = gamesOf(rows, 'A');
    expect(mine).toHaveLength(5);
    expect(others).toHaveLength(2);
    for (const a of answersOf(mine)) {
      const it = BANK.find((b) => b.id === a.id);
      expect(it, a.id).toBeTruthy();
      expect(a.pick).toBeLessThan(it!.choices.length);
      expect(a.ok).toBe(a.pick === it!.answer);
    }
  });
});
