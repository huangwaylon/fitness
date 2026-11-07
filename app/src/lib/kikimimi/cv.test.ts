// The games' content versions (docs/kikimimi-framework.md §4.2): `play`'s `cv`, compiled per game into levels/index.json
// (compile.ts gameCv) from what shapes a deck and its schedule, never its text. cv.golden.json keeps, per game and
// content, the cv and a digest of its decks (seeds 0-19; a lesson's every lesson and tier): decks that change while the
// cv doesn't fail with a reminder to bump the game's BUILD_V (games/versions.ts); a cv that changes with the same decks
// (new clip lengths: a re-voicing) passes. A deliberate change: `vitest -u`.
import { createHash } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Level } from './bank.ts';
import { gameCv } from './compile.ts';
import { deck } from './deck.ts';
import { ladderDeck } from './ladder.ts';
import { lessonDeck, type Tier } from './lesson.ts';
import { ENTRIES, INDEX, gameCvOf, ladders, listenOf, loadAll, unitPart } from './pool.ts';
import { LESSONS } from './stages.ts';
import { BUILD_V } from './games/versions.ts';
import { taikaiDeck } from './games/taikai/source.ts';
import { tierAt } from './games/listened.ts';
import { boardOf, tileDeal } from './games/tile/def.ts';
import { tachiDeal } from './games/tachi/def.ts';
import { callDeal, callRounds } from './games/call/def.ts';
import { rushDeal, rushRounds } from './games/rush/def.ts';
import { newsDeal } from './games/news/def.ts';

const SEEDS = Array.from({ length: 20 }, (_, s) => s);
const TIERS: readonly (Tier | undefined)[] = [undefined, 'easy', 'hard'];
/** A deck's shape: each item's id, how many choices and which is right (never their text). */
const shape = (items: readonly { id: string; choices: readonly string[]; answer: number }[]) => items.map((it) => [it.id, it.choices.length, it.answer]);
const digest = (x: unknown) => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16);

/** A game's decks for its content key (`<gm>:<unit>`). */
function decksOf(key: string): unknown {
  const [gm, unit] = key.split(':');
  if (gm === 'quiz') return SEEDS.map((s) => shape(deck(s, Number(unit) as Level)));
  if (gm === 'ladder') return SEEDS.map((s) => shape(ladderDeck(s, ladders())));
  // the tournament's: 8 ids a seed, spread over every level's items
  if (gm === 'taikai') return SEEDS.map((s) => shape(taikaiDeck(s, Array.from({ length: 8 }, (_, k) => (s * 37 + k * 101) % ENTRIES.length))));
  // ことば タイル's: a file's sentences a seed, each one's board at every ear
  // たちぎき's: a file's two conversations a seed, each round's row, answer and choices, the lines' offsets, the bed
  if (gm === 'tachi') return SEEDS.map((s) => tachiDeal(s, [listenOf(unit)!]).map((c) => [c.tachi.row, c.tachi.answer, c.choices.length, c.bed ?? '', c.lines.map((l) => l.at ?? null)]));
  if (gm === 'tile') return SEEDS.map((s) => tileDeal(s, [listenOf(unit)!]).map((c) => [c.tile.id, [0, 1, 2, 3].map((ear) => boardOf(c.tile, s, tierAt(ear, c.lv)))]));
  // ようじ でんわ's: a file's calls a seed, each round's memo rows at every ear
  if (gm === 'call') return SEEDS.map((s) => { const cs = callDeal(s, [listenOf(unit)!]); return [0, 1, 2, 3].map((ear) => callRounds(cs, { lv: cs[0].lv, ear }, () => 0).map((r) => [r.id, r.part, r.rows.map((x) => [x.n, x.chips.length, x.answer])])); });
  // すうじ ラッシュ's: a file's customers a seed, each one's chips at every ear
  if (gm === 'rush') return SEEDS.map((s) => { const cs = rushDeal(s, [listenOf(unit)!]); return [0, 1, 2, 3].map((ear) => rushRounds(cs, { lv: cs[0].lv, ear }, () => 0).map((r) => [r.id, r.map, r.answer])); });
  // しずえの ニュース's: the bulletin of a day a seed (spread over the year), each card's answer, trap and clips, on a rainy 23 °C day
  if (gm === 'news') return SEEDS.map((s) => newsDeal(20_400 + s * 19, [listenOf(unit)!], { sky: 'rain', fog: false, hi: 23 }).map((c) => [c.id, c.answer, c.news.trap, c.choices.length, c.lines?.map((l) => l.clip) ?? []]));
  const part = unitPart(unit)!;
  return LESSONS.filter((l) => part.unit.lessons[l]).map((l) => TIERS.map((t) => SEEDS.map((s) => shape(lessonDeck(part, l, s, t)))));
}

describe('ききみみ content versions', () => {
  beforeAll(loadAll);

  it('a game’s cv is its content’s, its id and its BUILD_V (any of them changed: another cv)', () => {
    const a = gameCv('quiz', 'abcdef');
    expect(a).toMatch(/^[0-9a-f]{6}$/);
    expect(gameCv('quiz', 'abcdef')).toBe(a);
    expect(gameCv('quiz', 'abcdeg')).not.toBe(a);
    expect(gameCv('ladder', 'abcdef')).not.toBe(a);
    const v = BUILD_V.quiz;
    (BUILD_V as Record<string, number>).quiz = v + 1;
    try {
      expect(gameCv('quiz', 'abcdef')).not.toBe(a);
    } finally {
      (BUILD_V as Record<string, number>).quiz = v;
    }
    expect(() => gameCv('nope', 'abcdef')).toThrow();
  });

  it('every game the phone deals has one: each level’s quiz, スピード はしご, each unit’s lessons, the tournament over every level (pool.ts gameCvOf)', () => {
    const levels = Object.keys(INDEX.units).filter((u) => /^\d+$/.test(u));
    const units = INDEX.paths.map((p) => p[0]);
    const files = (gm: string) => Object.keys(INDEX.listen).filter((u) => INDEX.listen[u][0] === gm);
    expect(Object.keys(INDEX.games).sort()).toEqual([...levels.map((l) => `quiz:${l}`), 'ladder:ladder', ...units.map((u) => `lesson:${u}`), 'taikai:all',
      ...files('tile').map((u) => `tile:${u}`), ...files('tachi').map((u) => `tachi:${u}`), ...files('call').map((u) => `call:${u}`), ...files('rush').map((u) => `rush:${u}`), ...files('news').map((u) => `news:${u}`)].sort());
    for (const [key, cv] of Object.entries(INDEX.games)) {
      const [gm, unit] = key.split(':');
      expect(cv).toMatch(/^[0-9a-f]{6}$/);
      expect(gameCvOf(gm, (/^\d+$/.test(unit) ? Number(unit) : unit) as Level)).toBe(cv);
      expect(cv).toBe(gameCv(gm, unit === 'all' ? levels.map((l) => INDEX.units[l].cv).join(',') : INDEX.units[unit].cv));
    }
    expect(gameCvOf('lesson', 'zz-none')).toBeUndefined();
  });

  it('golden: decks that change keep no cv (bump BUILD_V); a deliberate change: vitest -u', async () => {
    const golden = (await import('./cv.golden.json').then((m) => m.default as Record<string, { cv: string; decks: string }>).catch(() => ({}))) as Record<string, { cv: string; decks: string }>;
    const now: Record<string, { cv: string; decks: string }> = {};
    const unbumped: string[] = [];
    for (const key of Object.keys(INDEX.games).sort()) {
      const cv = INDEX.games[key], decks = digest(decksOf(key)), was = golden[key];
      if (was && was.decks !== decks && was.cv === cv) unbumped.push(key);
      // (the same decks with another cv, new clip lengths: kept as it was, so a re-voicing needs no update here)
      now[key] = was && was.decks === decks ? was : { cv, decks };
    }
    expect(unbumped, 'these games deal other decks from the same cv: bump their BUILD_V in games/versions.ts').toEqual([]);
    await expect(`${JSON.stringify(now, null, 1)}\n`).toMatchFileSnapshot('./cv.golden.json');
  });
});
