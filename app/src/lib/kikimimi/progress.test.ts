// kikimimi/progress.ts, srs.ts, advice.ts: きろく's stats, the cards and にがて れんしゅう, and the advice
// (docs/kikimimi.md "Progress & feedback"). Pure, over made-up games.
import { describe, expect, it } from 'vitest';
import type { EventRow } from '../contract/api.ts';
import { levelAt, levelRank, type Level } from './bank.ts';
import { BANK } from './source.ts';
import { DECK_SIZE } from './deck.ts';
import { dayNum } from '../contract/tokyo.ts';
import { AIM, answersOf, chanceOf, daysPlayed, difficulty, difficultyOf, gamesOf, offAim, isLadderGame, listenAnswers, recentOf, scoreOf, speedOf, statsOf, together, trendOf, weekDays, type Answer, type Game } from './progress.ts';
import { ladderDeck } from './ladder.ts';
import { LADDERS } from './ladders.ts';
import { loadAll } from './pool.ts';
import { cardsOf, dueOf, gradeOf, isSibling, practiceDeck, practicePicks, step } from './srs.ts';
import { entryOf } from './pool.ts';
import { feedback, recommend, tripsOf } from './advice.ts';
import { skillsOf } from './tags.ts';
import { stageAt } from './stages.ts';

// (the compiled levels' chunks: decks and clips read the loaded ones, pool.ts)
await loadAll();

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

  it('one game for a game id written twice (left and joined again: two rows of one `g`): its answers once each, its minutes summed', () => {
    const first = { d: TODAY, g: 'cd34', lv: 2, n: 2, ms: 60_000, r: [['w2-read', 1, 0, 0], ['n2-price-1', 0, 2, 1]] };
    const again = { d: TODAY, g: 'cd34', lv: 2, n: 3, ms: 90_000, r: [['n2-price-1', 1, 0, 0], ['w2-cats', 0, -1, 0]] };
    const rows: EventRow[] = [
      ['2026-11-05T03:00:01.000Z', 'A', 'e1', 'listen', JSON.stringify(first)],
      ['2026-11-05T03:00:02.000Z', 'B', 'e2', 'listen', JSON.stringify({ d: TODAY, g: 'cd34', n: 2, ms: 70_000 })],
      ['2026-11-05T03:05:00.000Z', 'A', 'e3', 'listen', JSON.stringify(again)],
      ['2026-11-05T03:05:01.000Z', 'B', 'e4', 'listen', JSON.stringify({ d: TODAY, g: 'cd34', n: 3, ms: 20_000 })]
    ];
    const { mine: m, others } = gamesOf(rows, 'A');
    expect(m).toHaveLength(1);
    expect(m[0]).toMatchObject({ g: 'cd34', n: 3, ms: 150_000, at: Date.parse('2026-11-05T03:00:01.000Z') });
    expect(m[0].r.map((a) => [a.id, a.ok])).toEqual([['w2-read', true], ['n2-price-1', false], ['w2-cats', false]]);
    expect(others).toEqual([{ who: 'B', d: TODAY, g: 'cd34', n: 3, ms: 90_000 }]);
  });
});

describe('gamesOf: the partner’s stamps', () => {
  it('a stamped unit in the partner’s summary is kept, a second row of the game never takes it away', () => {
    const rows: EventRow[] = [
      ['2026-11-05T03:00:01.000Z', 'B', 'e1', 'listen', JSON.stringify({ d: TODAY, g: 'ef56', n: 2, ms: 60_000 })],
      ['2026-11-05T03:00:02.000Z', 'B', 'e2', 'listen', JSON.stringify({ d: TODAY, g: 'ef56', n: 2, ms: 30_000, u: 'tr-hotel', stamped: 1 })],
      ['2026-11-05T03:00:03.000Z', 'B', 'e3', 'listen', JSON.stringify({ d: TODAY, g: 'ef56', n: 2, ms: 10_000 })]
    ];
    expect(gamesOf(rows, 'A').others).toEqual([{ who: 'B', d: TODAY, g: 'ef56', n: 2, ms: 100_000, u: 'tr-hotel', stamped: 1 }]);
  });
});

describe('gamesOf: bedtime stories', () => {
  it('a story row (no answers) is a story of mine, not a game: its minutes summed by game id; the partner’s a summary as any', () => {
    const ev = (id: string, who: 'A' | 'B', data: object, s = 1): EventRow => [`2026-11-05T13:00:0${s}.000Z`, who, id, 'listen', JSON.stringify(data)];
    const story = { d: TODAY, g: 'st01ab', gm: 'story', u: 'st-johnny', lv: 4, n: 1, ms: 240_000, r: [] };
    const { mine, others, stories } = gamesOf([ev('e1', 'A', story), ev('e2', 'A', { ...story, ms: 60_000 }, 2), ev('e3', 'B', { d: TODAY, g: 'st02cd', n: 1, ms: 300_000 }, 3)], 'A');
    expect(mine).toEqual([]);
    expect(stories).toEqual([{ d: TODAY, g: 'st01ab', u: 'st-johnny', ms: 300_000, at: Date.parse('2026-11-05T13:00:01.000Z') }]);
    expect(others).toEqual([{ who: 'B', d: TODAY, g: 'st02cd', n: 1, ms: 300_000 }]);
  });
});

describe('gamesOf: the mic’s games', () => {
  it('a mic game’s row (minutes only) is a koe game, its minutes summed by game id; never a game of the stats', () => {
    const ev = (id: string, data: object, s = 1): EventRow => [`2026-11-05T13:00:0${s}.000Z`, 'A', id, 'listen', JSON.stringify(data)];
    const mane = { d: TODAY, g: 'ma01ab', gm: 'mane', lv: 2, n: 1, ms: 90_000, r: [] };
    const { mine, koe } = gamesOf([ev('e1', mane), ev('e2', { ...mane, ms: 30_000 }, 2)], 'A');
    expect(mine).toEqual([]);
    expect(koe).toEqual([{ d: TODAY, g: 'ma01ab', gm: 'mane', ms: 120_000 }]);
  });
});

describe('gamesOf: a newer build’s rows', () => {
  it('skips answers whose ids this build doesn’t know: a row from a newer game leaves the games and the stats unchanged', () => {
    const quiz = { d: TODAY, g: 'ab12', lv: 2, n: 1, ms: 120_000, r: [['w2-read', 1, 0, 0], ['n2-price-1', 0, 2, 1]] };
    const tile = { d: TODAY, g: 'ef56', gm: 'tile', u: 'u03-kawa', lv: 3, n: 2, ms: 90_000, r: [['zz-new-tile-1', 0, 4095, 0], ['zz-new-tile-2', 1, 0, 0]] };
    const mixed = { d: TODAY, g: 'gh78', gm: 'review', lv: 2, n: 1, ms: 60_000, r: [['zz-new-1', 1, 7, 0], ['w2-cats', 0, -1, 2]] };
    const ev = (id: string, data: object, s = 1): EventRow => [`2026-11-05T03:00:0${s}.000Z`, 'A', id, 'listen', JSON.stringify(data)];
    const before = gamesOf([ev('e1', quiz)], 'A');
    const after = gamesOf([ev('e1', quiz), ev('e2', tile, 2)], 'A');
    expect(after).toEqual(before);
    expect(statsOf(answersOf(after.mine), TODAY)).toEqual(statsOf(answersOf(before.mine), TODAY));
    // a row of known and unknown items: the known ones only
    const m = gamesOf([ev('e1', quiz), ev('e3', mixed, 3)], 'A').mine;
    expect(m.map((x) => [x.g, x.r.map((a) => a.id)])).toEqual([['ab12', ['w2-read', 'n2-price-1']], ['gh78', ['w2-cats']]]);
  });
});

describe('listenAnswers: a game’s answers as a row', () => {
  const items = BANK.filter((it) => it.lv === 2).slice(0, 4);
  const pick = (n: number) => ({ k: items[n].answer });
  it('only the questions I had (a mid-game join, a lock: not misses); at the results the rest had time out, left mid-way only those answered', () => {
    const answers = [null, pick(1), null, { k: (items[3].answer + 1) % items[3].choices.length }];
    const had = [false, true, true, true];
    expect(listenAnswers(items, answers, had, [0, 2, 0, 0], true)).toEqual([
      [items[1].id, 1, items[1].answer, 2],
      [items[2].id, 0, -1, 0],
      [items[3].id, 0, (items[3].answer + 1) % items[3].choices.length, 0]
    ]);
    expect(listenAnswers(items, answers, had, [], false).map((r) => r[0])).toEqual([items[1].id, items[3].id]);
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
    expect(s.byAccent.us).toEqual({ n: 3, right: 2 / 3, first: 1 / 3 });
    expect(s.byAccent.uk).toBeUndefined();
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
    expect(stageAt(3.2).id).toBe('kawa');
    expect(stageAt(3.0).into).toBeCloseTo(0.5);
    expect(stageAt(1.75)).toEqual({ id: 'hama', stars: 1, cefr: 'A2–B1', into: 0.5 });
    expect(stageAt(5).id).toBe('yama');
    expect(stageAt(6).id).toBe('hoshi');
    expect(stageAt(9).id).toBe('hoshi');
  });
  it('learns each item’s difficulty from my answers, seeded from where it’s filed', () => {
    const l3 = BANK.filter((it) => it.lv === 3 && it.type === 'reply').map((it) => it.id);
    const [hard, easy] = l3;
    const e = (id: string) => entryOf(id)!;
    expect(difficultyOf(e(hard))).toBe(difficulty(e(hard))); // none answered: as filed
    const missed = statsOf(answersOf([game(l3.slice(0, 12), { lv: 3, miss: [hard] }), game([hard], { lv: 3, miss: [hard] })]), TODAY);
    expect(missed.items.get(hard)).toMatchObject({ n: 2 });
    expect(missed.items.get(hard)!.d).toBeGreaterThan(0.1); // a miss, twice: harder
    expect(missed.items.get(easy)!.d).toBeLessThan(0); // right: easier
    expect(difficultyOf(e(hard), missed)).toBeGreaterThan(difficultyOf(e(easy), missed) + 0.2);
    expect(chanceOf(e(hard), missed)).toBeLessThan(chanceOf(e(easy), missed));
    // the shelf (level 3's replies) learns from all of them: an unanswered reply at level 3 moves too, a level 2 one doesn't
    const unseen = l3.find((id) => !missed.items.has(id))!;
    expect(difficultyOf(e(unseen), missed)).not.toBe(difficulty(e(unseen)));
    const l2 = BANK.find((it) => it.lv === 2 && it.type === 'reply')!.id;
    expect(difficultyOf(e(l2), missed)).toBe(difficulty(e(l2)));
    // a long run of luck stays on the scale (an item ± 1.5, a shelf ± 1)
    const lucky = statsOf(answersOf(Array.from({ length: 40 }, () => game([easy], { lv: 3 }))), TODAY);
    expect(difficultyOf(e(easy), lucky)).toBeGreaterThanOrEqual(difficulty(e(easy)) - 2.5);
    expect([offAim(0.8), offAim(AIM.lo), offAim(0.6), offAim(0.95)].map((x) => +x.toFixed(2))).toEqual([0, 0, 0.15, 0.1]);
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
  it('counts games played together and everyone’s minutes this week, the guest’s too', () => {
    const mine = [game(['w1-hat'], { g: 'tog1', ms: 240_000 }), game(['w1-hat'], { g: 'solo1', ms: 120_000 }), game(['w1-hat'], { g: 'old1', d: '2026-10-20' })];
    const others = [
      { who: 'B' as const, d: TODAY, g: 'tog1', n: 2, ms: 240_000 },
      { who: 'B' as const, d: '2026-10-20', g: 'old1', n: 2, ms: 60_000 },
      { who: 'G' as const, d: TODAY, g: 'gsolo', n: 1, ms: 600_000 }
    ];
    expect(together(mine, others, TODAY)).toEqual({ games: 1, minutes: 20, partner: true });
    // the guest's phone: the members' games, with it or not, alike
    expect(together(mine, [{ who: 'A' as const, d: TODAY, g: 'solo1', n: 2, ms: 120_000 }], TODAY)).toEqual({ games: 1, minutes: 8, partner: true });
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
  it('brings back the items I missed, through another clip that tests the same where there is one, and the features I miss', () => {
    const a = practiceDeck({ answers, stats, today: TODAY, seed: 1, levels: LV }).map((it) => it.id);
    const missed = ['w1-right', 'w1-rock', 'w1-play', 'w1-fly', 'n1-reps-1'];
    // the 4 due first (at most 4): each itself or a sibling (the same level, type and first feature, another clip)
    const due = ['n1-reps-1', 'w1-right', 'w1-rock', 'w1-play', 'w1-fly'].filter((id) => a.includes(id) || a.some((y) => isSibling(entryOf(id)!, entryOf(y)!)));
    expect(due.length).toBeGreaterThanOrEqual(4);
    expect(a.filter((id) => missed.includes(id)).length).toBeLessThan(4); // siblings stand in for some
    const lr = a.filter((id) => skillsOf(BANK.find((b) => b.id === id)!).primary === 'lr');
    expect(lr.length).toBeGreaterThanOrEqual(4);
  });
  it('steps a due card from its sibling’s practice answer, and turns a lone item’s choices each time it comes back', () => {
    const day = '2026-11-06';
    const card = () => cardsOf(answers).items.get('w1-right')!;
    expect(card().due).toBeLessThanOrEqual(dayNum(day));
    const sib = BANK.find((it) => isSibling(entryOf('w1-right')!, entryOf(it.id)!) && !answers.some((a) => a.id === it.id))
      ?? BANK.find((it) => isSibling(entryOf('w1-right')!, entryOf(it.id)!) && !['w1-rock', 'w1-play', 'w1-fly'].includes(it.id))!;
    const practice = game([sib.id], { d: day, p: true, lv: 1 });
    const after = cardsOf([...answers, ...practice.r]).items.get('w1-right')!;
    expect(after).toMatchObject({ box: 1, last: dayNum(day) });
    // not in practice (a game's own answer), or the card answered that day: the card waits
    expect(cardsOf([...answers, ...game([sib.id], { d: day, lv: 1 }).r]).items.get('w1-right')).toEqual(card());
    // a due item with no sibling in the pool (a focus on it alone): itself, the right choice moved on each time
    const solo = (extra: Answer[]) => practicePicks({ answers: [...answers, ...extra], stats: statsOf([...answers, ...extra], TODAY), today: '2026-11-20', seed: 5, levels: [2] });
    const lone = BANK.find((it) => it.lv === 2 && it.type === 'reply' && !BANK.some((y) => isSibling(entryOf(it.id)!, entryOf(y.id)!)))!;
    const miss = (d: string) => game([lone.id], { d, lv: 2, miss: [lone.id] }).r;
    const first = solo(miss('2026-11-10')), second = solo([...miss('2026-11-10'), ...miss('2026-11-12')]);
    const deal = (p: ReturnType<typeof practicePicks>) => p.deal((id) => BANK.find((b) => b.id === id)).find((it) => it.id === lone.id)!;
    expect(first.ids).toContain(lone.id);
    expect(deal(first).answer).not.toBe(deal(second).answer);
    expect(deal(second).choices[deal(second).answer]).toBe(lone.choices[lone.answer]);
  });
  it('a stand-in never double-steps a card, and an item with a card of its own stands in for none', () => {
    const x1 = 'w1-right', [x2, y] = BANK.filter((it) => isSibling(entryOf(x1)!, entryOf(it.id)!)).map((i) => i.id);
    expect(isSibling(entryOf(x2)!, entryOf(y)!)).toBe(true);
    const a = (id: string, ok: boolean, d: string, p = false): Answer => ({ id, ok, pick: ok ? 0 : 1, rp: 0, d, g: `g${d}${p}`, lv: 1, p });
    // x1 missed and then right (box 1), x2 missed once (box 0): both due by the 3rd
    const base = [a(x1, false, '2026-10-20'), a(x1, true, '2026-10-21'), a(x2, false, '2026-11-01')];
    // y (no card) stands in for x2, then x2 itself is asked: one step, not two
    expect(cardsOf([...base, a(y, true, '2026-11-03', true), a(x2, true, '2026-11-03', true)]).items.get(x2)!.box).toBe(1);
    // x2 right on the 2nd (box 1, due the 3rd), practised again that day: it steps x1 not at all
    const held = [...base, a(x2, true, '2026-11-02')];
    expect(cardsOf([...held, a(x2, true, '2026-11-02', true)]).items.get(x1)).toEqual(cardsOf(held).items.get(x1));
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
  it('the next stage up from level 4 is やま (6), past the アナウンス pack beside it; from やま ほし (7); none past ほし', () => {
    const all: Level[] = [1, 2, 3, 4, 5, 6, 7];
    const easy = (lv: Level) => {
      const l = BANK.filter((it) => it.lv === lv).map((it) => it.id).slice(0, 8);
      return [game(l, { lv }), game(l, { lv }), game(l, { lv })];
    };
    const up = (lv: Level) => recommend({ stats: statsOf(answersOf(easy(lv)), TODAY), games: easy(lv), dueItems: 0, levels: all, bank }).find((r) => r.kind === 'level');
    expect(up(4)).toEqual({ kind: 'level', lv: 6 });
    expect(up(5)).toEqual({ kind: 'level', lv: 6 });
    expect(up(6)).toEqual({ kind: 'level', lv: 7 });
    expect(up(7)).toBeUndefined();
    // the ladder's places: the pack beside 4, やま and ほし the next two (their marks: components/kikimimi/look.test.ts)
    expect([1, 2, 3, 4, 5, 6, 7].map(levelRank)).toEqual([1, 2, 3, 4, 4, 5, 6]);
    expect([1, 2, 3, 4, 5, 6].map(levelAt)).toEqual([1, 2, 3, 4, 6, 7]);
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

describe('スピード はしご: the fastest comfortable speed', () => {
  /** A ladder game: two ladders' rungs, `miss` / `replayed` by rung id. */
  const ladderGame = (a: string, b: string, o: { miss?: string[]; replayed?: string[] } = {}) =>
    game([1, 2, 3, 4].flatMap((n) => [`${a}-${n}`]).concat([1, 2, 3, 4].map((n) => `${b}-${n}`)), { lv: 4, ...o });
  it('reads each ladder’s climb (in order, first listen, stopping at a miss or a replay); comfortable is the fastest ≥ 75 % of the last 8 climbed', () => {
    // 4 ladders: climbs 4, 2 (miss at 3), 3 (replay at 4), 4
    const gs = [
      ladderGame('sp-platform', 'sp-gate', { miss: ['sp-gate-3'] }),
      ladderGame('sp-water', 'sp-yen', { replayed: ['sp-water-4'] })
    ];
    const sp = speedOf(gs);
    expect(sp).toMatchObject({ ladders: 4, recent: 4, measuring: false, best: 1.4 });
    expect(sp.reach).toEqual([1, 1, 0.75, 0.5]);
    expect(sp.comfort).toBe(1.2);
    expect(isLadderGame(gs[0])).toBe(true);
  });
  it('measures from 4 ladders; a ladder whose first rung I didn’t have isn’t counted; none at 0.8× is null', () => {
    const one = speedOf([ladderGame('sp-platform', 'sp-gate', { miss: ['sp-platform-1', 'sp-gate-1'] })]);
    expect(one).toMatchObject({ ladders: 2, measuring: true, comfort: null, best: null, reach: [0, 0, 0, 0] });
    const late = game(['sp-cat-2', 'sp-cat-3', 'sp-cat-4'], { lv: 4 });
    expect(speedOf([late]).ladders).toBe(0);
    expect(speedOf([game(ids('w1-'), { lv: 1 })]).ladders).toBe(0);
  });
  it('leaves ladder games out of the quiz trend and the level nudge', () => {
    const l1 = ids('w1-', 8);
    const quiz = [game(l1, { lv: 1 }), game(l1, { lv: 1 }), game(l1, { lv: 1 })];
    const all = [...quiz, ladderGame('sp-platform', 'sp-gate', { miss: ['sp-platform-1', 'sp-gate-1'] })];
    expect(trendOf(all)).toEqual(trendOf(quiz));
    expect(recommend({ stats: statsOf(answersOf(all), TODAY), games: all, dueItems: 0, levels: LV, bank: BANK })).toContainEqual({ kind: 'level', lv: 2 });
  });
  it('recommends the ladder: to try (after 3 quiz games, when offered), or while comfortable below 1.2×; never once at 1.2×', () => {
    const l1 = ids('w1-', 8);
    const quiz = [game(l1, { lv: 1, miss: [l1[0]] }), game(l1, { lv: 1, miss: [l1[0]] }), game(l1, { lv: 1, miss: [l1[0]] })];
    const rec = (gs: Game[], ladder = true) => recommend({ stats: statsOf(answersOf(gs), TODAY), games: gs, dueItems: 0, levels: [1], bank: BANK, speed: speedOf(gs), ladder });
    expect(rec(quiz)).toContainEqual({ kind: 'speed', at: null, tried: false });
    expect(rec(quiz, false).map((r) => r.kind)).not.toContain('speed');
    const slow = [...quiz, ladderGame('sp-platform', 'sp-gate', { miss: ['sp-platform-2', 'sp-gate-2'] }), ladderGame('sp-water', 'sp-yen', { miss: ['sp-water-2', 'sp-yen-2'] })];
    expect(rec(slow)).toContainEqual({ kind: 'speed', at: 0.8, tried: true });
    const quick = [...quiz, ladderGame('sp-platform', 'sp-gate', { miss: ['sp-platform-4'] }), ladderGame('sp-water', 'sp-yen', { miss: ['sp-water-4'] })];
    expect(rec(quick).map((r) => r.kind)).not.toContain('speed');
  });
  it('gamesOf keeps a ladder game’s rung answers (a known item, not a newer game’s)', () => {
    const row = { d: TODAY, g: 'lad1', lv: 4, n: 1, ms: 90_000, r: [['sp-platform-1', 1, 0, 0], ['sp-platform-2', 0, 1, 0]] };
    const { mine } = gamesOf([['2026-11-05T03:00:01.000Z', 'A', 'e1', 'listen', JSON.stringify(row)]], 'A');
    expect(mine.map((g) => g.r.map((a) => a.id))).toEqual([['sp-platform-1', 'sp-platform-2']]);
    expect(speedOf(mine)).toMatchObject({ ladders: 1, best: 0.8 });
  });
  it('a ladder game’s row keeps each pick as authored', () => {
    const items = ladderDeck(8, LADDERS).slice(0, 4);
    const r = listenAnswers(items, items.map((it) => ({ k: it.answer })), items.map(() => true), [0, 0, 0, 0], true);
    expect(r.map(([, ok, pick]) => [ok, pick])).toEqual([[1, 0], [1, 0], [1, 0], [1, 0]]);
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
