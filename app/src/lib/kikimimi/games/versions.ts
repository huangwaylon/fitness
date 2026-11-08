// Each game's deck-building code version (docs/kikimimi-engine.md "cv, the content version"): part of the game's content version (`cv`,
// compile.ts gameCv), so two phones only play together when they'd deal the same deck. Bump a game's by hand when its
// build changes what it deals from the same content (deck.ts's draw, lesson.ts's order, a shuffle); cv.test fails, with
// this reminder, when the decks change and the cv doesn't. Text, notes and marks never count (a copy fix blocks no one).
// A later game (round/registry.ts) adds its line here with its deal (its `games` entries follow: npm run
// kikimimi:levels, and cv.test's decks learn its deal), one line a game so lanes landing together don't collide.
export const BUILD_V: Readonly<Record<string, number>> = {
  quiz: 1,
  ladder: 1,
  lesson: 1,
  taikai: 1,
  tile: 1,
  tachi: 1,
  call: 1,
  rush: 1,
  news: 1,
  role: 1,
  pair: 1,
};
