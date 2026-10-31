// Shaking a tree (docs/design.md "Trees", "Shaking a tree"): NH's shake, made to live beside the tree's popup. A single
// tap on the canopy still opens (or closes) the popup; a quick run of taps, the third within SHAKE_WINDOW_MS and every
// quick tap after it, is a shake. A shake may drop something: now and then a tree branch to pick up (cosmetic), and
// rarely a wasp nest, at most one per tree per NEST_GAP_MS; out of it the wasps charge the villager standing nearest,
// and a tap on them within SWARM_MS nets one (the ずかん's wasp), else they sting (a puffy eye for a while). No ベル ever
// (scenery never pays); the last nest's time per tree is this phone's own (`tree-nest` in localStorage).
import type { PersonId } from '#lib/types.ts';
import { localKV, readJson, SCENE, writeJson } from '#lib/sync/storage.ts';

/** Taps in a run that make a shake, and the window they fall in. */
const SHAKE_TAPS = 3;
export const SHAKE_WINDOW_MS = 1200;

/** A canopy tap at `t` (ms) after the earlier `taps` (their times): the run kept, and whether this tap shakes the tree. */
export function shakeTap(taps: readonly number[], t: number): { taps: number[]; shake: boolean } {
  const run = [...taps.filter((x) => t - x < SHAKE_WINDOW_MS), t];
  return { taps: run.slice(-SHAKE_TAPS), shake: run.length >= SHAKE_TAPS };
}

/** 1 in NEST_ODDS shakes drops a nest (when the tree has none due), else 1 in BRANCH_ODDS a branch. */
export const NEST_ODDS = 8;
const BRANCH_ODDS = 5;
/** At most one nest per tree per hour. */
export const NEST_GAP_MS = 60 * 60 * 1000;

export type ShakeDrop = 'nest' | 'branch' | null;

/** What a shake at `now` drops: `r` a uniform [0, 1) source, `lastNest` this tree's last nest (ms) if any. `force`
 *  (the dev hook) makes it that drop. */
export function shakeDrop(r: () => number, now: number, lastNest: number | undefined, force?: ShakeDrop): ShakeDrop {
  if (force !== undefined) return force;
  const due = lastNest === undefined || now - lastNest >= NEST_GAP_MS;
  if (due && r() * NEST_ODDS < 1) return 'nest';
  return r() * BRANCH_ODDS < 1 ? 'branch' : null;
}

/** The wasps come out this long after the nest lands, and reach the villager SWARM_MS after that. */
export const SWARM_DELAY_MS = 600;
export const SWARM_MS = 1500;

/** A tap on the swarm `ms` after it came out: netted while it is still on its way, else too late (it has stung). */
export const netsSwarm = (ms: number): boolean => ms >= 0 && ms <= SWARM_MS;

/** How long a sting leaves its puffy eye. */
export const PUFFY_MS = 60 * 1000;

type NestRecord = Partial<Record<PersonId, number>>;

/** This phone's last nest per tree (by its person). */
export function lastNest(p: PersonId): number | undefined {
  const d = readJson<NestRecord>(localKV(), SCENE.nest);
  const t = d && typeof d === 'object' ? d[p] : undefined;
  return typeof t === 'number' && Number.isFinite(t) ? t : undefined;
}

export function markNest(p: PersonId, t: number): void {
  const d = readJson<NestRecord>(localKV(), SCENE.nest);
  writeJson(localKV(), SCENE.nest, { ...(d && typeof d === 'object' ? d : {}), [p]: t });
}
