// Group stretching's choreography (island/stretching.ts): both villagers (home first: a walk is cut short and they
// walk back) and the visitor do the same stretches on the same beat. The villagers run through the director (one motion
// per pose, busy for the whole routine so idle life keeps out); the visitor isn't a director actor, so it reads
// `stretch.pose` (Visitor.svelte plays the same keyframes).
import { actors, addFx, awayFromHome, cancel, holdEvents, later, routeHome, setAsleep, setEmote, setMotion, walkTo } from './director.svelte.ts';
import type { Motion } from './reactions.ts';
import { memberActors } from '#lib/ui-state/cast.ts';

/** The pose everyone is doing now (null between routines), bumped `n` on each. */
export const stretch = $state<{ pose: Motion | null; n: number }>({ pose: null, n: 0 });

/** How long a villager who is out (a wander, a walk to something) takes to get home. */
const HOME_MS = 1600;

/** Run the routine: `poses` of `ms` each; `done` at its end, `aborted` if it's cut short (the actors reset). Returns the
 *  ms until it starts (0, or the walk home). */
export function groupStretch(poses: readonly Motion[], ms: number, done?: () => void, aborted?: () => void): number {
  // the two members' villagers (the guest's moves only by its own taps: on the guest's phone, A and B stretch)
  const ids = memberActors();
  const out = ids.filter((id) => actors[id].walking || awayFromHome(id));
  const away = out.length > 0;
  const slept = ids.filter((id) => actors[id].asleep);
  for (const id of ids) {
    cancel(id); // a walk cut short: they head home (around what's in the way)
    actors[id].asleep = false;
    actors[id].fx = actors[id].fx.filter((f) => f.kind !== 'zzz');
    if (actors[id].emoteHold) setEmote(id, null);
    if (out.includes(id)) walkTo(id, routeHome(id), { ms: HOME_MS });
  }
  const start = away ? HOME_MS : 0;
  const total = start + poses.length * ms;
  holdEvents(total + 400); // a reaction (the partner's data, a beat) waits until the routine is over
  for (const id of ids) {
    actors[id].busyUntil = Date.now() + total + 400;
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
  }, () => {
    stretch.pose = null;
    aborted?.();
  });
  return start;
}
