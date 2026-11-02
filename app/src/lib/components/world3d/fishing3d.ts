// My cast on the 3D island (docs/design.md "Fishing"): what the line is doing now, for my 3D villager's rod
// (world3d/villagers.ts: it faces the float, casts, tugs at the bite, reels in). Critters.svelte, which runs the
// fishing, says each step; plain module state, read in the island's frames (nothing reactive: the frames poll it).
//   cast   the line flies out (the cast's swing)        wait   the float is on the water
//   bite   the float went under (the rod's tip yanked)   reel   reeled in (a catch or nothing): the rod comes up
export type Phase = 'cast' | 'wait' | 'bite' | 'reel';

export const angling: { phase: Phase | null; x: number; z: number; n: number } = { phase: null, x: 0, z: 0, n: 0 };

/** The line's step now, and where its float is (world x, z); null: no line out (it got away, or nobody's fishing). */
export function angle(phase: Phase | null, at?: { x: number; z: number }): void {
  if (at) {
    angling.x = at.x;
    angling.z = at.z;
  }
  if (phase === angling.phase) return;
  angling.phase = phase;
  angling.n++;
}
