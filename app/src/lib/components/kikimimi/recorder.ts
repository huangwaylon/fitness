// A ききみみ game's record on this phone (game.svelte.ts): my replays per question, when the game began, its items into
// this phone's history (recent.ts) and my answers as a `listen` row (contract/listen.ts), once.
import type { Level } from '#lib/kikimimi/bank.ts';
import type { QuizView } from '#lib/kikimimi/session.ts';
import { localDateAt } from '#lib/contract/tokyo.ts';
import type { ListenRow } from '#lib/contract/listen.ts';
import { listenAnswers } from '#lib/kikimimi/progress.ts';
import { lessonL, stageLevel, type Lesson, type UnitPlay } from '#lib/kikimimi/lesson.ts';
import { itemsOf } from './decks.ts';
import { rememberGame } from './progress.svelte.ts';

export class GameRecorder {
  /** My replays per question before answering (the row's `rp`), when the game began, the game recorded. */
  #rp: number[] = [];
  #began = 0;
  #recordedG = '';
  /** The game whose items went into this phone's history. */
  #remembered = '';

  /** A new game: its replays and start from nothing. */
  reset(): void {
    this.#rp = [];
    this.#began = 0;
  }

  /** A replay of question i before my answer. */
  replayed(i: number): void {
    this.#rp[i] = (this.#rp[i] ?? 0) + 1;
  }

  /** The view at each refresh: a game begun has its start, and its items first in this phone's history. */
  seen(v: QuizView, now: number): void {
    if (!v.g || v.phase === 'lobby' || v.phase === 'idle') return;
    if (!this.#began) this.#began = now;
    if (this.#remembered !== v.g) {
      this.#remembered = v.g;
      rememberGame(itemsOf(v.seed, v.lv as Level).map((it) => it.id));
    }
  }

  /** My answers of this game as a `listen` row, once: at the results (an unanswered question timed out) or when I
   *  leave mid-way (only those answered). Only the questions I had (the view's `had`): those before a mid-game join or
   *  slept through aren't in it. Joined again after leaving, the game's second row has the same `g`; the stats fold
   *  them into one game (progress.ts gamesOf). Null: already recorded, or nothing to. */
  keep(v: QuizView, now: number, done: boolean, o: { lesson: { unit: UnitPlay; lesson: Lesson } | null; practicing: boolean }): ListenRow | null {
    if (!v.g || this.#recordedG === v.g) return null;
    const r = listenAnswers(itemsOf(v.seed, v.lv as Level), v.answers, v.had, this.#rp, done);
    if (!r.length) return null;
    this.#recordedG = v.g;
    // a unit's lesson: its unit and lesson (the stamps, stamps.ts), the stage's level; co-op, the team's first listens (§10)
    const ls = o.lesson, n = Math.max(1, Math.min(3, v.players.length));
    const unit = ls ? { u: ls.unit.id, l: lessonL(ls.lesson), ...(n > 1 && !v.vs && { tm: Math.min(6, v.teamFirst) }) } : null;
    return {
      d: localDateAt(now), g: v.g, ...unit, lv: ls ? stageLevel(ls.unit.stage) : v.lv, n,
      ms: Math.max(0, Math.min(3_600_000, Math.round(now - (this.#began || now)))), ...(o.practicing && { p: 1 as const }), r
    };
  }
}
