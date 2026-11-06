// What the ききみみ sheet's buttons start (docs/kikimimi.md "UI"), over the sheet's game: もういっかい, a lesson again or
// the next one, おわる, はまべ's quick quiz, the ずかん's phrase review, the misses again, にがて れんしゅう, a
// recommendation's start, a unit's lesson, a lobby of my own. The sheet keeps its own state (open, its pages, the
// lobby's tab) and hands it in as `ui`; what's solo (a lesson, a practice deck) only in my own lobby kept alone.
import type { QuizGame } from './game.svelte.ts';
import type { Item, Level } from '#lib/kikimimi/bank.ts';
import { LEVELS } from '#lib/kikimimi/deck.ts';
import { tierFor, type Lesson } from '#lib/kikimimi/lesson.ts';
import { practiceFor } from '#lib/kikimimi/report.ts';
import type { Focus } from '#lib/kikimimi/srs.ts';
import type { Rec } from '#lib/kikimimi/advice.ts';
import { currentReport, recentGames } from './progress.svelte.ts';
import { keepLv, lastLv, lastTimer } from './prefs.ts';

/** The sheet's side: close it, its pages over my lobby, the lobby's tab back to あそぶ. */
export interface SheetUi {
  close(): void;
  /** How many pages are pushed over my lobby (a lesson's おわる goes back to them). */
  pages(): number;
  clearPages(): void;
  toPlay(): void;
}

export class KikiActions {
  readonly #game: () => QuizGame | null;
  readonly #ui: SheetUi;
  constructor(game: () => QuizGame | null, ui: SheetUi) {
    this.#game = game;
    this.#ui = ui;
  }

  /** The game, in my own lobby kept alone (a lesson's or a practice deck's place), else null. */
  #solo(): QuizGame | null {
    const g = this.#game();
    return g?.view?.amHost && g.view.local ? g : null;
  }
  /** A unit's lesson into my lobby, at my tier (my comfortable level against the unit's stage). */
  #lesson(g: QuizGame, unit: string, l: Lesson, recheck: boolean): void {
    const level = currentReport()?.stats.level ?? null;
    g.playLesson(unit, l, { tier: (stage) => tierFor(level, stage), recheck });
  }

  /** Play again: the host opens a new lobby at the same level (the others invited again if they were); another goes
   *  back to the invite (the host's next). A lesson: again at once (a チェック retried as often as wanted; never
   *  locks), a new deal. */
  again = (): void => {
    const g = this.#game(), v = g?.view;
    if (!g || !v) return;
    const ls = g.lesson;
    if (ls && v.local) {
      this.relesson(ls.unit.id, ls.lesson, ls.recheck, true);
      return;
    }
    const host = v.amHost, lv = v.lv as Level, shared = !v.local, practicing = g.practicing;
    const o = { same: v.same, vs: v.vs, ladder: v.ladder, timer: v.timer };
    g.close();
    if (host || !g.view.invite) {
      g.open(lv, o);
      if (host && shared) g.invite();
      else if (practicing === 'weak') this.practice();
    }
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
  /** おわる: a lesson's goes back to the page it came from (the unit's, the path's), a game's closes the sheet. */
  done = (): void => {
    const g = this.#game(), v = g?.view;
    if (g?.lesson && v?.local && this.#ui.pages()) {
      g.close();
      g.open(lastLv(), { timer: v.timer });
    } else this.#ui.close();
  };
  /** はまべ's stop on the path: the quick quiz at はまべ, back in the lobby. */
  quickQuiz = (): void => {
    this.#ui.clearPages();
    const g = this.#game(), v = g?.view;
    if (!g || !v) return;
    const lv: Level = v.lv === 2 ? 2 : 1;
    g.configure({ lv, ladder: false });
    keepLv(lv);
  };
  /** The ずかん's phrase review: those items as a solo deck at once (recorded as practice). */
  reviewPhrases = (items: Item[]): void => {
    const g = this.#solo();
    if (!g) return;
    if (g.view.ladder) g.configure({ ladder: false });
    g.practice(items, 'weak');
  };
  /** まちがえた もんだいを もういちど: the last game's misses as a solo deck (a lobby of mine kept alone: nothing on the
   *  wire), its reveals untimed as every reveal, recorded as practice. */
  replayMissed = (): void => {
    const g = this.#game(), v = g?.view;
    if (!g || !v) return;
    const missed = g.items.filter((it, i) => v.answers[i]?.k !== it.answer);
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
  /** A recommendation's start: a level's game, or にがて れんしゅう narrowed to its skill or accent. */
  startRec = (r: Rec): void => {
    const g = this.#solo();
    if (!g) return;
    this.#ui.toPlay();
    if (r.kind === 'level') {
      g.configure({ lv: r.lv, ladder: false });
      keepLv(r.lv);
      g.go();
    } else if (r.kind === 'speed') {
      g.configure({ ladder: true });
      g.go();
    } else this.practice(r.kind === 'skill' || r.kind === 'try' ? { skill: r.skill } : r.kind === 'accent' ? { accent: r.accent } : null);
  };
  /** A unit's lesson from the path or its page: my lobby (a quiz's) takes its deck at my tier and shows its intro card. */
  startLesson = (unit: string, l: Lesson, recheck = false): void => {
    const g = this.#solo();
    if (!g) return;
    if (g.view.ladder) g.configure({ ladder: false });
    this.#lesson(g, unit, l, recheck);
  };
  /** 「じぶんで ひらく」 from an invite: a lobby of my own, as last set on this phone. */
  startOwn = (): void => {
    this.#game()?.open(lastLv(), { timer: lastTimer() });
  };
}
