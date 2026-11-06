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
import { INDEX, gameCvOf, ladders, loadAll, unitPart } from './pool.ts';
import { LESSONS } from './stages.ts';
import { BUILD_V } from './games/versions.ts';

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

  it('every game the phone deals has one: each level’s quiz, スピード はしご, each unit’s lessons (pool.ts gameCvOf)', () => {
    const levels = Object.keys(INDEX.units).filter((u) => /^\d+$/.test(u));
    const units = INDEX.paths.map((p) => p[0]);
    expect(Object.keys(INDEX.games).sort()).toEqual([...levels.map((l) => `quiz:${l}`), 'ladder:ladder', ...units.map((u) => `lesson:${u}`)].sort());
    for (const [key, cv] of Object.entries(INDEX.games)) {
      const [gm, unit] = key.split(':');
      expect(cv).toMatch(/^[0-9a-f]{6}$/);
      expect(gameCvOf(gm, (/^\d+$/.test(unit) ? Number(unit) : unit) as Level)).toBe(cv);
      expect(cv).toBe(gameCv(gm, INDEX.units[unit].cv));
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
