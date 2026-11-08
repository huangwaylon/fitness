// A lesson's recipe-2 card on its listening game's page (LessonPlay; docs/curriculum.md "Recipe 2"): the pages read a
// game's view as theirs (options `[lv, timer, ear]`, each player's ear: games/listened.ts), so the lesson's game is
// shown to them through a view at the card's place, my tier as my ear and each player's join tier as theirs. Everything
// else is the game itself (its taps, clips and clock).
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import { lessonOpts, tierAtIndex } from '#lib/kikimimi/games/lesson/def.ts';
import { listenAt } from '#lib/kikimimi/games/lesson/recipe.ts';
import { listenOpts } from '#lib/kikimimi/games/listened.ts';
import type { QuizGame } from '../game.svelte.ts';

/** The view as a listening game's page reads it for a card of level `lv` (its place's). */
export function cardView(v: QuizView, lv: number): QuizView {
  const tier = lessonOpts.decode(v.o)?.tier;
  return {
    ...v,
    o: listenOpts.encode(listenAt(lv, tier, v.timer)),
    tiers: Object.fromEntries(Object.entries(v.tiers).map(([who, tr]) => [who, listenAt(lv, tierAtIndex(tr), v.timer).ear]))
  };
}

/** The game as a listening game's page takes it: its view at the current card's place (each read: reactive as the
 *  game's), the rest the game's own. */
export function cardGame(game: QuizGame): QuizGame {
  return new Proxy(game, {
    get(t, k) {
      if (k === 'view') return cardView(t.view, t.items[t.view.i]?.lv ?? 1);
      const x = Reflect.get(t, k, t);
      return typeof x === 'function' ? x.bind(t) : x;
    }
  });
}
