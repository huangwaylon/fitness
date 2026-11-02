// Night readability (the user: "I can't spot the finds or the fish at night"): at night NH keeps what you can pick up
// readable on the dark ground. The finds (a dig spot's crack, the shells, the bottle, the mushrooms, the weeds) and the
// critters glow a little with their own colours (an emissive lift of their own map, on top of things.ts's soft
// self-light), and a fish's shadow is a little denser on the night water. All of it scales with the time of day's
// lamp level (0 by day: the day's look is untouched).
import type { MeshLambertMaterial } from 'three';

/** A model's night lift: its own colour's extra glow at full night, or a shadow's extra opacity. */
const LIFT: [RegExp, { glow?: number; shade?: number }][] = [
  [/^critters\/shadows\//, { shade: 0.2 }],
  [/^finds\//, { glow: 0.4 }],
  [/^critters\//, { glow: 0.4 }]
];

/** A night lift for a model's material, if its model takes one; true the first time (its own material). */
export function nightTag(m: MeshLambertMaterial, model: string): boolean {
  if (m.userData.night) return false;
  const l = LIFT.find(([re]) => re.test(model))?.[1];
  if (!l) return false;
  m.userData.night = { glow: l.glow ?? 0, shade: l.shade ?? 0, opacity: m.opacity };
  return true;
}

/** The time of day on a tagged material (`night`: the lamp level, 0 day … 1 night): its extra emissive intensity
 *  (0 when untagged); a shadow's opacity is set here. */
export function nightLift(m: MeshLambertMaterial, night: number): number {
  const n = m.userData.night as { glow: number; shade: number; opacity: number } | undefined;
  if (!n) return 0;
  if (n.shade) m.opacity = Math.min(1, n.opacity + n.shade * night);
  return n.glow * night;
}
