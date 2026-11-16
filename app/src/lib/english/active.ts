// English Study's active study time (docs/english.md "Progress"): the video playing with the page visible, plus the
// time on a question card with input (a tap, a key) in the last 60 s, at most 90 s a question. Pure: the lesson ticks
// it with the time and what's on screen; what it counts goes into the `listen` rows' `ms`.

/** Input older than this and a question card's time stops counting. */
const IDLE_MS = 60_000;
/** A question's time counts up to this, all visits together. */
const PER_Q_MS = 90_000;
/** One tick adds at most this (a timer held back while the phone slept never counts the gap). */
const MAX_STEP_MS = 5_000;

export interface Active {
  /** Counted and not yet sent in a row. */
  unsent: number;
  /** Each question's counted time (its index → ms), against PER_Q_MS. */
  perQ: Record<number, number>;
  /** The last tick's time (null: none yet, or the page was hidden). */
  last: number | null;
  /** The last input's time. */
  input: number | null;
}

export const newActive = (unsent = 0, perQ: Record<number, number> = {}): Active => ({ unsent, perQ, last: null, input: null });

/** What's going on at a tick: the video playing, the page visible, the question card shown (its index) or none. */
export interface Now {
  playing: boolean;
  visible: boolean;
  q: number | null;
}

/** The clock at `t`: the time since the last tick counted if the page is visible and the video plays or the card had
 *  input lately (the card's share capped a question). A new value; `a` untouched. */
export function tick(a: Active, t: number, now: Now): Active {
  if (!now.visible) return { ...a, last: null };
  const dt = a.last === null ? 0 : Math.max(0, Math.min(MAX_STEP_MS, t - a.last));
  const next = { ...a, last: t };
  if (!dt) return next;
  if (now.playing) return { ...next, unsent: a.unsent + dt };
  if (now.q === null || a.input === null || t - a.input > IDLE_MS) return next;
  const had = a.perQ[now.q] ?? 0;
  const add = Math.max(0, Math.min(dt, PER_Q_MS - had));
  return add ? { ...next, unsent: a.unsent + add, perQ: { ...a.perQ, [now.q]: had + add } } : next;
}

/** A tap or a key at `t`. */
export const touched = (a: Active, t: number): Active => ({ ...a, input: t });

/** Sent: what was counted is in a row now. */
export const sent = (a: Active): Active => ({ ...a, unsent: 0 });
