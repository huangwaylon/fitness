// A mini-game's clock (docs/sugoroku.md "みんなで！"), by start-at, never by tick: online, it opens with the lander's
// `mg` (its `t`, the room's stamp: wire.ts Move), counts down COUNTDOWN_MS (3-2-1: a phone 300 ms behind still sees the
// whole countdown) and runs the game's length; passed round, from when the phone opened it. Every phone draws its bar
// from the same times. The fold never reads them: the end is a move (`mc`), sent by any phone once `close` has
// passed (GRACE_MS for the plays in flight); the first in the log closes it, a later one is nothing.
export const COUNTDOWN_MS = 3000;
export const GRACE_MS = 1000;

export interface MiniTimes {
  /** The countdown's end: play from here. */
  start: number;
  /** The bar empty: no more plays. */
  end: number;
  /** Send the close (`mc`) from here. */
  close: number;
}
export const miniTimes = (opened: number, ms: number): MiniTimes => {
  const start = opened + COUNTDOWN_MS;
  return { start, end: start + ms, close: start + ms + GRACE_MS };
};
/** Whether a play now still counts on the clock (the fold takes any till the close: this is the sheet's gate). */
export const playing = (t: MiniTimes, now: number): boolean => now >= t.start && now < t.end;
export const mayClose = (t: MiniTimes, now: number): boolean => now >= t.close;

/** When the mini-game on opened, for this phone (online): its pick's stamp `t`, or when this phone first saw it if
 *  that's earlier (a clock behind the room's: never later than seen). `seen` counts only for this mini-game (`key`:
 *  the game's and how many it has closed): an earlier one's time made the next one over as it opened, every phone
 *  sending its count and the close at once (2026-11-19, なかま分け played second). */
export const openedAt = (t: number, seen: { key: string; at: number } | null, key: string): number => (seen?.key === key ? Math.min(t, seen.at) : t);
