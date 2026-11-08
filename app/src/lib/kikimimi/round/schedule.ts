// A round game's schedule (docs/kikimimi-engine.md "Sync", "The host is the clock"): pure, from what every phone has alike.
// Round 0 starts at `go`'s `at`; within a round every phone computes the lead-in, the clip and the answer window from
// the round's timing (RoundDeck.timing); the reveal is untimed, so a later round's start is only ever known from the
// host's つぎへ (its skip) unless the round's reveal moves on by itself (RoundTiming.auto).
import type { Game, RoundPhase, RoundWindows } from './types.ts';

/** What the schedule reads of a game. */
type Sched = Pick<Game, 'goAt' | 'starts' | 'n' | 'allIn' | 'deck' | 'opened' | 'inAt'>;

/** Where a game is at a moment: its phase, round, the phase's span, the round's clip and limit, and whether this phone
 *  sits it out. */
export interface Where {
  phase: RoundPhase;
  i: number;
  from: number;
  until: number;
  playAt: number;
  playEnd: number;
  limit: number;
  out: boolean;
}

/** Every round's start here, 0 to n (n: the results), never decreasing. Round 0 at `go`'s `at`; the others only once
 *  fixed (the host's skip, its つぎへ; a player's with the host gone): the reveal before is untimed, so unfixed they're
 *  Infinity. A start fixed cuts the rounds before it short (none shown once it has come). */
export function schedule(gm: Sched, w: RoundWindows): number[] {
  const s: number[] = [gm.starts.get(0) ?? gm.goAt ?? Infinity];
  for (let j = 1; j <= gm.n; j++) s.push(gm.starts.get(j) ?? Infinity);
  const down = () => {
    for (let j = gm.n - 1; j >= 0; j--) s[j] = Math.min(s[j], s[j + 1]);
  };
  down();
  // a reveal that moves on by itself (スピード はしご's lower rungs): the next start `auto` after it, on every phone (the
  // host's beacon still has the last word)
  for (let j = 0; j < gm.n; j++) {
    if (s[j + 1] !== Infinity || !gm.deck.timing(j).auto) continue;
    const r = times(gm, j, s).reveal;
    if (Number.isFinite(r)) s[j + 1] = r + w.auto;
  }
  down();
  return s;
}

/** Round i's clip, limit (Infinity: none) and reveal: at the limit, once everyone in it has answered, or as the next
 *  round starts (its skip heard before this phone revealed). It lasts till the next starts. `answer`: its window. */
export function times(gm: Pick<Game, 'deck' | 'allIn'>, i: number, s: readonly number[]) {
  const t = gm.deck.timing(i);
  const playAt = s[i] + t.lead;
  const playEnd = playAt + Math.max(0, t.play);
  const limit = playEnd + t.answer;
  const reveal = Math.max(playEnd, Math.min(limit, gm.allIn.get(i) ?? Infinity, s[i + 1]));
  return { playAt, playEnd, limit, reveal, answer: t.answer };
}

/** Where the game is at `now`: in the last round started (the end of the schedule started: the results). */
export function where(gm: Sched, now: number, w: RoundWindows): Where {
  const base = { i: -1, from: gm.opened, until: Infinity, playAt: 0, playEnd: 0, limit: 0, out: false };
  if (gm.goAt === undefined || gm.n === 0) return { ...base, phase: gm.n === 0 && gm.goAt !== undefined ? 'results' : 'lobby' };
  const s = schedule(gm, w);
  if (now < s[0]) return { ...base, phase: 'countdown', from: s[0] - w.countdown, until: s[0] };
  let i = gm.n;
  while (i > 0 && s[i] > now) i--;
  if (i === gm.n) return { ...base, phase: 'results', i, from: s[i] };
  const t = times(gm, i, s);
  // (untimed, a round begun before I came isn't sat out: no hurry, its clip plays from my 🔁)
  const q = { i, playAt: t.playAt, playEnd: t.playEnd, limit: t.limit, out: t.playAt < gm.inAt && Number.isFinite(t.answer) };
  if (now < t.playAt) return { ...q, phase: 'lead', from: s[i], until: t.playAt };
  if (now < t.playEnd) return { ...q, phase: 'play', from: t.playAt, until: t.playEnd };
  if (now < t.reveal) return { ...q, phase: 'answer', from: t.playEnd, until: t.reveal };
  return { ...q, phase: 'reveal', from: t.reveal, until: s[i + 1] };
}

/** Round i (n: the results) starts at `at` here; the later ones follow from it. */
export function fix(gm: Pick<Game, 'starts'>, i: number, at: number): void {
  gm.starts.set(i, at);
  for (const j of [...gm.starts.keys()]) if (j > i) gm.starts.delete(j);
}
