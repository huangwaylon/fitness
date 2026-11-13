// The sea creatures (docs/design.md "Scene interactions"): NH's 40, caught by diving. Now and then a spot of bubbles
// rises in the sea off the beach (Critters.svelte: the sea holds a fish shadow or a bubble spot, one at a time); a tap
// there is a dive, and what's under it is caught, or (a quick one) darts off as a shadow to be tapped again in time.
// Pure, like critters.ts: months and hours only weight the odds; nothing here counts for anything (no ベル). Loaded with
// the first bubble spot of a session (and with the ずかん), out of the island's first load.
import { ALL_DAY, ALL_YEAR, pick, span, type Seasonal } from './critters.ts';

export type SeaId =
  | 'seaweed' | 'sea-grapes' | 'sea-cucumber' | 'sea-pig' | 'sea-star' | 'sea-urchin' | 'slate-pencil-urchin' | 'sea-anemone' | 'moon-jellyfish' | 'sea-slug' | 'pearl-oyster' | 'mussel' | 'oyster' | 'scallop' | 'whelk' | 'turban-shell' | 'abalone' | 'gigas-giant-clam' | 'chambered-nautilus' | 'octopus' | 'umbrella-octopus' | 'vampire-squid' | 'firefly-squid' | 'gazami-crab' | 'dungeness-crab' | 'snow-crab' | 'red-king-crab' | 'acorn-barnacle' | 'spider-crab' | 'tiger-prawn' | 'sweet-shrimp' | 'mantis-shrimp' | 'spiny-lobster' | 'lobster' | 'giant-isopod' | 'horseshoe-crab' | 'sea-pineapple' | 'spotted-garden-eel' | 'flatworm' | 'venus-flower-basket';

/** How a sea creature moves when you dive at it (NH's speeds): still or slow ones are simply caught; a quicker one
 *  darts off and must be tapped again in time; the quickest sometimes get clean away. */
export type Speed = 'still' | 'very-slow' | 'slow' | 'medium' | 'fast' | 'very-fast';

interface Creature extends Seasonal {
  /** NH's shadow, 1 (x-small) – 5 (x-large). */
  size: number;
  speed: Speed;
  /** A second span of hours (the giant isopod). */
  also?: readonly [number, number];
}

/** NH's sea creatures (northern hemisphere; months and hours as NH's, weighting the odds only), their shadows and
 *  speeds; the weight follows NH's spawn rates (rare = low: the gigas giant clam, the sea pig, the vampire squid, the
 *  giant isopod). In the game's order. */
export const SEA: Record<SeaId, Creature> = {
seaweed: { months: span(10, 7), hours: ALL_DAY, size: 4, speed: 'still', weight: 2.8 },
  'sea-grapes': { months: span(6, 9), hours: ALL_DAY, size: 2, speed: 'still', weight: 2.7 },
  'sea-cucumber': { months: span(11, 4), hours: ALL_DAY, size: 3, speed: 'very-slow', weight: 2.7 },
  'sea-pig': { months: span(11, 2), hours: [16, 9], size: 2, speed: 'very-fast', weight: 0.3 },
  'sea-star': { months: ALL_YEAR, hours: ALL_DAY, size: 2, speed: 'very-slow', weight: 2.3 },
  'sea-urchin': { months: span(5, 9), hours: ALL_DAY, size: 2, speed: 'slow', weight: 1.5 },
  'slate-pencil-urchin': { months: span(5, 9), hours: [16, 9], size: 3, speed: 'medium', weight: 1.2 },
  'sea-anemone': { months: ALL_YEAR, hours: ALL_DAY, size: 4, speed: 'still', weight: 2.8 },
  'moon-jellyfish': { months: span(7, 9), hours: ALL_DAY, size: 2, speed: 'very-slow', weight: 2.7 },
  'sea-slug': { months: ALL_YEAR, hours: ALL_DAY, size: 1, speed: 'very-slow', weight: 2.2 },
  'pearl-oyster': { months: ALL_YEAR, hours: ALL_DAY, size: 2, speed: 'medium', weight: 1 },
  mussel: { months: span(6, 12), hours: ALL_DAY, size: 2, speed: 'slow', weight: 1.8 },
  oyster: { months: span(9, 2), hours: ALL_DAY, size: 2, speed: 'slow', weight: 2.8 },
  scallop: { months: ALL_YEAR, hours: ALL_DAY, size: 3, speed: 'slow', weight: 2.3 },
  whelk: { months: ALL_YEAR, hours: ALL_DAY, size: 2, speed: 'slow', weight: 1.5 },
  'turban-shell': { months: [3, 4, 5, 9, 10, 11, 12], hours: ALL_DAY, size: 2, speed: 'slow', weight: 2 },
  abalone: { months: span(6, 1), hours: [16, 9], size: 3, speed: 'medium', weight: 1.2 },
  'gigas-giant-clam': { months: span(5, 9), hours: ALL_DAY, size: 5, speed: 'very-fast', weight: 0.3 },
  'chambered-nautilus': { months: [3, 4, 5, 6, 9, 10, 11], hours: [16, 9], size: 3, speed: 'medium', weight: 1.3 },
  octopus: { months: ALL_YEAR, hours: ALL_DAY, size: 3, speed: 'slow', weight: 1.7 },
  'umbrella-octopus': { months: [3, 4, 5, 9, 10, 11], hours: ALL_DAY, size: 2, speed: 'fast', weight: 0.7 },
  'vampire-squid': { months: span(5, 8), hours: [16, 9], size: 3, speed: 'very-fast', weight: 0.3 },
  'firefly-squid': { months: span(3, 6), hours: [21, 4], size: 1, speed: 'slow', weight: 2 },
  'gazami-crab': { months: span(6, 11), hours: ALL_DAY, size: 3, speed: 'medium', weight: 1.2 },
  'dungeness-crab': { months: span(11, 5), hours: ALL_DAY, size: 3, speed: 'medium', weight: 1.3 },
  'snow-crab': { months: span(11, 4), hours: ALL_DAY, size: 4, speed: 'fast', weight: 0.7 },
  'red-king-crab': { months: span(11, 3), hours: ALL_DAY, size: 4, speed: 'very-fast', weight: 0.5 },
  'acorn-barnacle': { months: ALL_YEAR, hours: ALL_DAY, size: 1, speed: 'still', weight: 2.8 },
  'spider-crab': { months: span(3, 4), hours: ALL_DAY, size: 5, speed: 'very-fast', weight: 0.5 },
  'tiger-prawn': { months: span(6, 9), hours: [16, 9], size: 2, speed: 'medium', weight: 0.8 },
  'sweet-shrimp': { months: span(9, 2), hours: [16, 9], size: 2, speed: 'slow', weight: 2.5 },
  'mantis-shrimp': { months: ALL_YEAR, hours: [16, 9], size: 2, speed: 'medium', weight: 1.7 },
  'spiny-lobster': { months: span(10, 12), hours: [21, 4], size: 4, speed: 'fast', weight: 1.7 },
  lobster: { months: [1, 4, 5, 6, 12], hours: ALL_DAY, size: 4, speed: 'fast', weight: 0.5 },
  'giant-isopod': { months: span(7, 10), hours: [9, 16], also: [21, 4], size: 3, speed: 'very-fast', weight: 0.3 },
  'horseshoe-crab': { months: span(7, 9), hours: [21, 4], size: 3, speed: 'medium', weight: 1.3 },
  'sea-pineapple': { months: span(4, 8), hours: ALL_DAY, size: 2, speed: 'slow', weight: 1.3 },
  'spotted-garden-eel': { months: span(5, 10), hours: [4, 21], size: 2, speed: 'slow', weight: 2.3 },
  flatworm: { months: span(8, 9), hours: [16, 9], size: 1, speed: 'very-slow', weight: 2.2 },
  'venus-flower-basket': { months: span(10, 2), hours: ALL_DAY, size: 3, speed: 'fast', weight: 0.7 }
};

/** The diving pearl (NH: now and then a pearl lies in the open sea, a small quick shadow): 1 in PEARL_ODDS bubble spots. */
export const PEARL_ODDS = 25;
export const PEARL = 'pearl';
export type DiveItem = SeaId | typeof PEARL;

/** What lies under a new bubble spot at (month, hour): a sea creature (the seaweed never takes a day off), or now and
 *  then the pearl. */
export function pickDive(month: number, hour: number, r: () => number): DiveItem {
  if (r() * PEARL_ODDS < 1) return PEARL;
  return pick(SEA, month, hour, r) ?? 'seaweed';
}

/** A dive's speed (the pearl is a quick one, like NH's). */
export const speedOf = (item: DiveItem): Speed => (item === PEARL ? 'fast' : SEA[item].speed);

/** How long a darting shadow can still be caught with a second tap (ms), by speed. */
export const CHASE_MS: Record<Speed, number> = { still: 0, 'very-slow': 0, slow: 0, medium: 1600, fast: 1300, 'very-fast': 1000 };

/** The dive at a bubble spot: the slow ones are caught at once; a medium one half the time, else it darts; a fast one
 *  always darts; a very fast one darts, or 1 time in 3 is clean away (NH's escapes). */
export function dive(speed: Speed, r: () => number): 'catch' | 'chase' | 'escape' {
  if (!CHASE_MS[speed]) return 'catch';
  if (speed === 'medium') return r() < 0.5 ? 'catch' : 'chase';
  if (speed === 'very-fast' && r() < 1 / 3) return 'escape';
  return 'chase';
}

/** How long a bubble spot stays if nobody dives (ms). */
export const BUBBLE_STAY_MS = 30_000;
/** A tap this close to the bubbles (stage units) dives there; a second tap this close to a darting shadow catches it. */
export const DIVE_U = 30;
