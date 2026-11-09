// Fishing, as NH plays it (docs/design.md "Fishing"): my line as one explicit state machine, pure. Its clock (ms), the
// shadows near the float, the day and the dice are the caller's, so every step and every
// edge is a unit test (fishing.test.ts). Critters.svelte steps it with performance.now() and plays what each step says: the float,
// the rod, the shadow's swim, the sounds, the 「！」, the catch plate and the others' phones.
//
//   a tap on water, any water (the user: "I want to be able to fish from anywhere"): cast from where my villager stands
//                       ──→ flying ─land→ waiting ─a shadow notices it→ approach ─arrives→ nibble (1–4) ─→ bite
//                                         ↑                                                                │
//                                         └──────────── it got away (no tap in BITE_WINDOW_MS) ────────────┘
//   a tap while the line is out (NH's A button): flying, waiting → reel (nothing on it); approach, nibble → scare (it
//   darts off: NH's early pull); bite → catch. Off by itself: the island hidden or left, the day over (the line just
//   goes: `off`). No reach: the float may be anywhere on the island's water, the line as long as it
//   takes; a tap on the ground with the line out reels it in (NH: you reel in to move), the next one walks.
//
// The bite's window starts when the bite is shown (the step that enters it), not when it was planned: a late timer
// (a busy main thread, a throttled tab) never shortens it.
import type { Water } from './critters.ts';

/** A shadow this near a float on its water (u) notices it, there being open water between them. */
export const NOTICE_U = 180;
/** The float's flight out (ms). */
export const FLY_MS = 300;
/** The bite's window (ms, from the bite shown): NH's is short (~0.5 s with a controller); a tap on glass, reacting to the
 *  plunge and the 「！」, gets a fair second. */
export const BITE_WINDOW_MS = 1000;

type Phase = 'flying' | 'waiting' | 'approach' | 'nibble' | 'bite';

/** A shadow's story at a float, ms from when it noticed it: it reaches the float, nibbles 1–4 times, then bites. */
export interface Plan {
  arrive: number;
  nibbles: readonly number[];
  bite: number;
}

export interface Line {
  readonly phase: Phase;
  /** The float (world) and the water it's on. */
  readonly x: number;
  readonly z: number;
  readonly water: Water;
  /** When it went out, and when this phase began (shown: the step that entered it). */
  readonly at: number;
  readonly since: number;
  /** The shadow at it (the caller's key), its plan and when it noticed (the plan's zero); the nibbles shown. */
  readonly fish: string | null;
  readonly plan: Plan | null;
  readonly noticed: number;
  readonly nibbles: number;
  /** The day it went out on (the island's: a new day ends it). */
  readonly day: string;
}

/** Why a line ended on its own. */
type OffWhy = 'day';
/** What a step did, in order, for the caller to play. */
export type Step =
  | { ev: 'land' }
  | { ev: 'notice'; fish: string; plan: Plan }
  | { ev: 'arrive'; fish: string }
  | { ev: 'nibble'; fish: string; n: number }
  | { ev: 'bite'; fish: string }
  /** No tap in the bite's window: it got away; the float stays out. */
  | { ev: 'escape'; fish: string }
  /** The shadow went before it bit (caught by another, or gone): the float waits on. */
  | { ev: 'lost'; fish: string }
  | { ev: 'off'; why: OffWhy };
/** A tap on the line. */
export type Pull = { ev: 'reel' } | { ev: 'scare'; fish: string } | { ev: 'catch'; fish: string };

/** What a step asks of the island. */
export interface Around {
  /** The island's day now. */
  day: string;
  /** The free shadow nearest a float at (x, z) on `water` within NOTICE_U that can swim to it, and how far (u). */
  notice(x: number, z: number, water: Water): { fish: string; d: number } | null;
  /** Whether that shadow is still about (not gone, not taken). */
  here(fish: string): boolean;
  /** The dice (a uniform [0, 1) source). */
  rand(): number;
}

/** The line goes out to (x, z) on `water` at `now` (critters.ts landing: the water tapped, drawn in from its edge),
 *  however far that is from my villager. */
export const cast = (to: { x: number; z: number; water: Water }, now: number, day: string): Line => ({
  phase: 'flying', x: to.x, z: to.z, water: to.water, at: now, since: now, fish: null, plan: null, noticed: 0, nibbles: 0, day
});

/** A shadow `d` u off: it swims up (NH: a slow, curious approach, longer from further), nibbles 1–4 times at NH's
 *  uneven beat, then bites. */
export function plan(d: number, r: () => number): Plan {
  const arrive = Math.round(600 + Math.min(d, NOTICE_U) * 7 + r() * 500);
  const n = 1 + Math.min(3, Math.floor(r() * 4));
  const nibbles: number[] = [];
  let t = arrive + 400 + r() * 500;
  for (let i = 0; i < n; i++) {
    nibbles.push(Math.round(t));
    t += 600 + r() * 700;
  }
  return { arrive, nibbles, bite: Math.round(t) };
}

const with_ = (l: Line, o: Partial<Line>): Line => ({ ...l, ...o });

/** The line at `now`: every transition due by then, in order (a late step catches up, and what it enters starts now).
 *  Null once it ended on its own (the last step says why). */
export function step(line: Line, now: number, w: Around): { line: Line | null; steps: Step[] } {
  const steps: Step[] = [];
  let l: Line = line;
  // ended on its own: a new day
  const off = (why: OffWhy) => (steps.push({ ev: 'off', why }), { line: null, steps });
  if (w.day !== l.day) return off('day');
  for (let guard = 0; guard < 16; guard++) {
    // the shadow gone before it bit (another caught it, it left): the float waits on
    if (l.fish && l.phase !== 'waiting' && !w.here(l.fish)) {
      steps.push({ ev: 'lost', fish: l.fish });
      l = with_(l, { phase: 'waiting', since: now, fish: null, plan: null, nibbles: 0 });
      break; // (another shadow looks at the next step: this one's going is played first)
    }
    if (l.phase === 'flying') {
      if (now < l.at + FLY_MS) break;
      steps.push({ ev: 'land' });
      l = with_(l, { phase: 'waiting', since: now });
      continue;
    }
    if (l.phase === 'waiting') {
      const seen = w.notice(l.x, l.z, l.water);
      if (!seen) break;
      const p = plan(seen.d, w.rand);
      steps.push({ ev: 'notice', fish: seen.fish, plan: p });
      l = with_(l, { phase: 'approach', since: now, fish: seen.fish, plan: p, noticed: now, nibbles: 0 });
      continue;
    }
    const p = l.plan!, fish = l.fish!, t = now - l.noticed;
    if (l.phase === 'approach') {
      if (t < p.arrive) break;
      steps.push({ ev: 'arrive', fish });
      l = with_(l, { phase: 'nibble', since: now });
      continue;
    }
    if (l.phase === 'nibble') {
      if (l.nibbles < p.nibbles.length) {
        if (t < p.nibbles[l.nibbles]) break;
        steps.push({ ev: 'nibble', fish, n: l.nibbles + 1 });
        l = with_(l, { nibbles: l.nibbles + 1 });
        continue;
      }
      if (t < p.bite) break;
      steps.push({ ev: 'bite', fish });
      l = with_(l, { phase: 'bite', since: now });
      continue;
    }
    // the bite: its window from when it was shown
    if (now < l.since + BITE_WINDOW_MS) break;
    steps.push({ ev: 'escape', fish });
    l = with_(l, { phase: 'waiting', since: now, fish: null, plan: null, nibbles: 0 });
    break;
  }
  return { line: l, steps };
}

/** When the line next has something due (ms; a waiting float is looked at by the caller's own beat). */
export function due(l: Line): number {
  switch (l.phase) {
    case 'flying': return l.at + FLY_MS;
    case 'waiting': return Infinity;
    case 'approach': return l.noticed + l.plan!.arrive;
    case 'nibble': return l.noticed + (l.nibbles < l.plan!.nibbles.length ? l.plan!.nibbles[l.nibbles] : l.plan!.bite);
    case 'bite': return l.since + BITE_WINDOW_MS;
  }
}

/** A tap while the line is out, judged on the line as it's shown (no step first: what the player saw is what they
 *  answered): the line comes in either way. */
export function pull(l: Line): Pull {
  if (l.phase === 'bite') return { ev: 'catch', fish: l.fish! };
  if ((l.phase === 'approach' || l.phase === 'nibble') && l.fish) return { ev: 'scare', fish: l.fish };
  return { ev: 'reel' };
}
