// Group stretching's choreography (island/stretching.ts): both villagers (home first: a stroll is cut short and they
// walk back) and the visitor do the same stretches on the same beat. The villagers run through the director (one motion
// per pose, busy for the whole routine so idle life keeps out); the visitor isn't a director actor, so it reads
// `stretch.pose` (Visitor.svelte plays the same keyframes).
import { actors, addFx, cancel, holdEvents, later, setAsleep, setEmote, setMotion } from './director.svelte.ts';
import type { Motion } from './reactions.ts';

/** The pose everyone is doing now (null between routines), bumped `n` on each. */
export const stretch = $state<{ pose: Motion | null; n: number }>({ pose: null, n: 0 });

/** Walk leg (= --dur-walk): how long a villager out on a stroll takes to get home. */
const HOME_MS = 1600;

/** Run the routine: `poses` of `ms` each. Returns the ms until it starts (0, or the walk home). */
export function groupStretch(poses: readonly Motion[], ms: number, done?: () => void): number {
  const ids = ['mine', 'partner'] as const;
  const out = ids.filter((id) => actors[id].walkX !== 0);
  const away = out.length > 0;
  const slept = ids.filter((id) => actors[id].asleep);
  for (const id of ids) {
    cancel(id); // a stroll cut short: walkX back to 0, the CSS transition walks them home
    actors[id].asleep = false;
    actors[id].fx = actors[id].fx.filter((f) => f.kind !== 'zzz');
    if (actors[id].emoteHold) setEmote(id, null);
    actors[id].walking = out.includes(id);
  }
  const start = away ? HOME_MS : 0;
  const total = start + poses.length * ms;
  holdEvents(total + 400); // a reaction (the partner's data, a beat) waits until the routine is over
  for (const id of ids) {
    actors[id].busyUntil = Date.now() + total + 400;
    if (away) later(id, HOME_MS, () => (actors[id].walking = false));
    actors[id].face = 'home';
    poses.forEach((pose, i) => later(id, start + i * ms, () => setMotion(id, pose, ms)));
    later(id, total, () => {
      setEmote(id, 'mark-note');
      addFx(id, 'sparkles');
      if (slept.includes(id)) later(id, 2400, () => setAsleep(id, true));
    });
  }
  // the visitor follows the villagers' beat (the first actor's timers, so a reset drops them too)
  poses.forEach((pose, i) =>
    later('mine', start + i * ms, () => {
      stretch.pose = pose;
      stretch.n++;
    })
  );
  later('mine', total, () => {
    stretch.pose = null;
    done?.();
  }, () => (stretch.pose = null));
  return start;
}
