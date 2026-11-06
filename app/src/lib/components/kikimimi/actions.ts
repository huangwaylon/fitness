// What the ききみみ sheet's buttons start (docs/kikimimi.md "UI"), over the sheet's game: もういっかい, a lesson again or
// the next one, おわる (back to the hub), はまべ's quick quiz, the hub's today card, the ずかん's phrase review, the
// misses again, おさらい, a recommendation's start, a unit's lesson, a lobby of my own. The sheet keeps its own state
// (open, its stack of pages: nav.ts) and hands it in as `ui`; what's solo (a practice deck, the recheck) only in my own lobby kept alone, a
// unit's lesson in any lobby I host (shared: a co-op lesson, docs/curriculum-units.md §4).
import type { QuizGame } from './game.svelte.ts';
import type { Item, Level } from '#lib/kikimimi/bank.ts';
import { LEVELS } from '#lib/kikimimi/deck.ts';
import { tierFor, type Lesson } from '#lib/kikimimi/lesson.ts';
import { practiceFor } from '#lib/kikimimi/report.ts';
import type { Focus } from '#lib/kikimimi/srs.ts';
import type { Rec } from '#lib/kikimimi/advice.ts';
import { currentReport, recentGames } from './progress.svelte.ts';
import { keepLv, lastLv, lastTimer } from './prefs.ts';
import { modeStack, type Page } from './nav.ts';

/** The sheet's side: close it, and its stack of pages over the hub (nav.ts). */
export interface SheetUi {
  close(): void;
  /** How many pages are pushed over the hub (a lesson's おわる goes back to them). */
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

  /** The game, in my own lobby kept alone (a practice deck's place), else null. */
  #solo(): QuizGame | null {
    const g = this.#game();
    return g?.view?.amHost && g.view.local ? g : null;
  }
  /** The game, in a lobby I host (kept alone or shared: a lesson's place), else null. */
  #hosting(): QuizGame | null {
    const g = this.#game();
    return g?.view?.amHost && g.view.phase === 'lobby' ? g : null;
  }
  /** A unit's lesson into my lobby, at my tier (my comfortable level against the unit's stage). */
  #lesson(g: QuizGame, unit: string, l: Lesson, recheck: boolean): void {
    const level = currentReport()?.stats.level ?? null;
    g.playLesson(unit, l, { tier: (stage) => tierFor(level, stage), recheck });
  }

  /** Play again: the host opens a new lobby at the same level (the others invited again if they were); another goes
   *  back to the invite (the host's next). A lesson: again at once (a チェック retried as often as wanted; never
   *  locks), a new deal; a co-op one's host: a new lobby with that lesson, the others invited again. */
  again = (): void => {
    const g = this.#game(), v = g?.view;
    if (!g || !v) return;
    const ls = g.lesson;
    if (ls && v.local) {
      this.relesson(ls.unit.id, ls.lesson, ls.recheck, true);
      return;
    }
    if (ls && v.amHost) {
      const timer = v.timer;
      g.close();
      g.open(lastLv(), { timer });
      g.invite();
      this.#lesson(g, ls.unit.id, ls.lesson, false);
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
  /** おわる: a lesson's goes back to the page it came from (the unit's, the path's), a game's to the hub. */
  done = (): void => {
    const g = this.#game(), v = g?.view;
    if (g?.lesson && v?.local && this.#ui.pages()) {
      g.close();
      g.open(lastLv(), { timer: v.timer });
    } else this.toHub();
  };
  /** Back to the hub: a lobby of my own, kept alone (leaving the game I was in: a lobby I'd shared is cancelled). */
  toHub = (): void => {
    const g = this.#game();
    if (!g) return;
    g.close();
    g.open(lastLv(), { timer: lastTimer() });
    this.#ui.setPages([]);
  };
  /** はまべ's stop on the path: ひとこと クイズ's page at はまべ. */
  quickQuiz = (): void => {
    const g = this.#game(), v = g?.view;
    if (!g || !v) return;
    const lv: Level = v.lv === 2 ? 2 : 1;
    g.configure({ lv, ladder: false });
    keepLv(lv);
    this.#ui.setPages(modeStack('quiz'));
  };
  /** The hub's today card: ひとこと クイズ at my place, at once. */
  quiz = (lv: Level): void => {
    const g = this.#game();
    if (!g) return;
    if (this.#solo()) g.configure({ lv, ladder: false });
    else g.open(lv, { timer: lastTimer() }); // (from an invite's idle hub: my own lobby first)
    keepLv(lv);
    g.go();
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
    this.#ui.setPages([]);
    if (r.kind === 'level') {
      g.configure({ lv: r.lv, ladder: false });
      keepLv(r.lv);
      g.go();
    } else if (r.kind === 'speed') {
      g.configure({ ladder: true });
      g.go();
    } else this.practice(r.kind === 'skill' || r.kind === 'try' ? { skill: r.skill } : r.kind === 'accent' ? { accent: r.accent } : null);
  };
  /** A unit's lesson from the path or its page: my lobby (a quiz's) takes its deck at my tier and shows its intro card;
   *  shared, everyone's (a co-op lesson). The 30-day recheck is solo. */
  startLesson = (unit: string, l: Lesson, recheck = false): void => {
    const g = recheck ? this.#solo() : this.#hosting();
    if (!g) return;
    if (g.view.ladder) g.configure({ ladder: false });
    this.#lesson(g, unit, l, recheck);
  };
  /** 「じぶんで ひらく」 from an invite: a lobby of my own, as last set on this phone. */
  startOwn = (): void => {
    this.#game()?.open(lastLv(), { timer: lastTimer() });
  };
}
