// What the ききみみ sheet's buttons start (docs/kikimimi.md "UI details"), over the sheet's game: もういっかい, a lesson again,
// 終わる and a game's ‹ (back to the page it was started from), the misses again, おさらい, a lobby of my own. The sheet
// keeps its own state (open, its stack of pages: nav.ts) and hands it in as `ui`.
import type { QuizGame } from './game.svelte.ts';
import { cardKind } from '#lib/kikimimi/games/lesson/recipe.ts';
import type { Level } from '#lib/kikimimi/bank.ts';
import { LEVELS } from '#lib/kikimimi/deck.ts';
import { tierFor, type Lesson } from '#lib/kikimimi/lesson.ts';
import { practiceFor } from '#lib/kikimimi/report.ts';
import type { Focus } from '#lib/kikimimi/srs.ts';
import { currentReport, recentGames } from './progress.svelte.ts';
import { lastLv, lastTimer, sameDefault } from './prefs.ts';
import type { Page } from './nav.ts';

/** The sheet's side: close it, and its stack of pages over the hub (nav.ts). */
interface SheetUi {
  close(): void;
  /** How many pages are pushed over the hub (終わる goes back to them). */
  pages(): number;
  setPages(p: Page[]): void;
}

export class KikiActions {
  readonly #game: () => QuizGame | null;
  readonly #ui: SheetUi;
  constructor(game: () => QuizGame | null, ui: SheetUi) {
    this.#game = game;
    this.#ui = ui;
  }

  /** A unit's lesson into my lobby, at my tier (my comfortable level against the unit's stage). */
  #lesson(g: QuizGame, unit: string, l: Lesson, recheck: boolean): void {
    const level = currentReport()?.stats.level ?? null;
    g.playLesson(unit, l, { tier: (stage) => tierFor(level, stage), recheck });
  }

  /** Play again: a new lobby of mine at the same level. A lesson: again at once (a チェック retried as often as wanted;
   *  never locks), a new deal. */
  again = (): void => {
    const g = this.#game(), v = g?.view;
    if (!g || !v) return;
    const ls = g.lesson;
    if (ls) {
      this.relesson(ls.unit.id, ls.lesson, ls.recheck, true);
      return;
    }
    const lv = v.lv as Level, practicing = g.practicing;
    const o = { same: v.same, vs: v.vs, ladder: v.ladder, timer: v.timer };
    g.close();
    g.open(lv, o);
    if (practicing === 'weak') this.practice();
  };
  /** A lesson after a lesson's results (もういっかい, the strip's つぎは): a new lobby of mine with that lesson's deck at
   *  my tier; `now`: straight into it (もういっかい), else its intro card. */
  relesson = (unit: string, l: Lesson, recheck = false, now = false): void => {
    const g = this.#game(), v = g?.view;
    if (!g || !v) return;
    const timer = v.timer;
    g.close();
    g.open(lastLv(), { timer });
    this.#lesson(g, unit, l, recheck);
    if (now) g.go();
  };
  /** 終わる, and a game's ‹ (mid-game: my answers so far kept): back to the page the game was started from, the stack
   *  under it as it was, with a fresh lobby of my own at the game's settings (a mode's page sets its game again:
   *  ModeDetail). From the hub: the hub. */
  done = (): void => {
    const g = this.#game(), v = g?.view;
    if (!g || !v) return;
    if (!v.amHost || !this.#ui.pages()) return this.toHub();
    const { timer, same, vs, ladder } = v;
    g.leave();
    g.open(lastLv(), { timer, same, vs, ladder });
  };
  /** Back to the hub: a lobby of my own, kept alone (leaving the game I was in: a lobby I'd shared is cancelled). */
  toHub = (): void => {
    const g = this.#game();
    if (!g) return;
    g.leave();
    g.open(lastLv(), { timer: lastTimer(), same: sameDefault() });
    this.#ui.setPages([]);
  };
  /** まちがえた もんだいを もういちど: the last game's misses as a solo deck (a lobby of mine kept alone: nothing on the
   *  wire), its reveals untimed as every reveal, recorded as practice. */
  replayMissed = (): void => {
    const g = this.#game(), v = g?.view;
    if (!g || !v) return;
    // (a recipe-2 lesson's cards play in their own games: its quiz items only)
    const missed = g.items.filter((it, i) => !cardKind(it) && v.answers[i]?.k !== it.answer);
    if (!missed.length) return;
    const lv = v.lv as Level, timer = v.timer;
    g.close();
    g.open(lv, { timer });
    g.practice(missed, 'missed');
  };
  /** にがて れんしゅう: my lobby kept alone starts with a deck of my weak spots (`focus`: a recommendation's). */
  practice = (focus: Focus = null): void => {
    const g = this.#game(), r = currentReport();
    if (!g || !r) return;
    if (g.view.ladder) g.configure({ ladder: false }); // (a quiz's: from a recommendation in スピード はしご's lobby)
    void practiceFor(r, LEVELS, g.view.seed, focus, recentGames()).then((items) => g.practice(items, 'weak'), () => {});
  };
  /** A lobby of my own, as last set on this phone. */
  startOwn = (): void => {
    this.#game()?.open(lastLv(), { timer: lastTimer(), same: sameDefault() });
  };
}
