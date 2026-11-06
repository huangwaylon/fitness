// Each game's deck-building code version (docs/kikimimi-framework.md §4.2): part of the game's content version (`cv`,
// compile.ts gameCv), so two phones only play together when they'd deal the same deck. Bump a game's by hand when its
// build changes what it deals from the same content (deck.ts's draw, lesson.ts's order, a shuffle); cv.test fails, with
// this reminder, when the decks change and the cv doesn't. Text, notes and marks never count (a copy fix blocks no one).
export const BUILD_V: Readonly<Record<string, number>> = { quiz: 1, ladder: 1, lesson: 1, taikai: 1 };
