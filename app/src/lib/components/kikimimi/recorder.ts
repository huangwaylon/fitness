// A ききみみ game's record on this phone (game.svelte.ts): my replays per question, when the game began, its items into
// this phone's history (recent.ts) and my answers as a `listen` row (contract/listen.ts), once.
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import { localDateAt } from '#lib/contract/tokyo.ts';
import type { ListenRow } from '#lib/contract/listen.ts';
import { listenAnswers } from '#lib/kikimimi/progress.ts';
import { lessonL, stageLevel, type Lesson, type UnitPlay } from '#lib/kikimimi/lesson.ts';
import { taikaiRow, tierLevel, type Trophy } from '#lib/kikimimi/games/taikai/def.ts';
import { checkRow, placementOf, type Placement } from '#lib/kikimimi/games/check/def.ts';
import { checkItemOf } from '#lib/kikimimi/games/check/source.ts';
import { itemsOf } from './decks.ts';
import { rememberGame } from './progress.svelte.ts';

export class GameRecorder {
  /** My replays per question before answering (the row's `rp`), when the game began, the game recorded. */
  #rp: number[] = [];
  #began = 0;
  #recordedG = '';
  /** The game whose items went into this phone's history. */
  #remembered = '';

  /** How long the game has taken (ms, ≤ 1 h). */
  #ms(now: number): number {
    return Math.max(0, Math.min(3_600_000, Math.round(now - (this.#began || now))));
  }

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
      rememberGame(itemsOf(v).map((it) => it.id));
    }
  }

  /** My answers of this game as a `listen` row, once: at the results (an unanswered question timed out) or when I
   *  leave mid-way (only those answered). Only the questions I had (the view's `had`): those before a mid-game join or
   *  slept through aren't in it. Joined again after leaving, the game's second row has the same `g`; the stats fold
   *  them into one game (progress.ts gamesOf). The tournament's: its game, the team's trophy and my tier's level
   *  (taikaiRow; left mid-way, no trophy). みみ チェック's: its placement (checkRow: the placed level, the profile as
   *  `u`), only when finished. Null: already recorded, or nothing to. */
  keep(
    v: QuizView, now: number, done: boolean, o: { lesson: { unit: UnitPlay; lesson: Lesson } | null; practicing: boolean; taikai?: { trophy: Trophy | null; tier: number } | null }
  ): ListenRow | null {
    if (!v.g || this.#recordedG === v.g || (v.gm === 'check' && !done)) return null;
    const r = listenAnswers(itemsOf(v), v.answers, v.had, this.#rp, done);
    if (!r.length) return null;
    this.#recordedG = v.g;
    if (v.gm === 'check') return { d: localDateAt(now), g: v.g, n: 1, ms: this.#ms(now), r, ...checkRow(checkPlacement(r)) };
    // a unit's lesson: its unit and lesson (the stamps, stamps.ts), the stage's level; co-op, the team's first listens (§10)
    const ls = o.lesson, n = Math.max(1, Math.min(3, v.players.length));
    const unit = ls ? { u: ls.unit.id, l: lessonL(ls.lesson), ...(n > 1 && !v.vs && { tm: Math.min(6, v.teamFirst) }) } : null;
    return {
      d: localDateAt(now), g: v.g, ...unit, lv: ls ? stageLevel(ls.unit.stage) : v.lv, n,
      ms: this.#ms(now), ...(o.practicing && { p: 1 as const }), ...(o.taikai && (o.taikai.trophy ? taikaiRow(o.taikai.trophy, o.taikai.tier) : { gm: 'taikai', lv: tierLevel(o.taikai.tier) })), r
    };
  }
}

/** A check's answers (a row's) as its placement (each item's level and skill: games/check/source.ts). */
export const checkPlacement = (r: ListenRow['r']): Placement =>
  placementOf(r.flatMap(([id, ok]) => {
    const it = checkItemOf(id);
    return it ? [{ lv: it.lv, skill: it.skill, ok: ok === 1 }] : [];
  }));
