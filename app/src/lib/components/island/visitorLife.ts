// The visitors' life on the island (docs/design.md "Visitors: life"), the pure part. Every visitor breathes and looks
// about (its 3D model's idle pose, as the villagers'); on idle life's beat (motion/idleLife.svelte.ts, the villagers' scheduler) one small
// thing: its NH signature (Jack twirls, Zipper hops, Celeste looks up at the stars, …), an
// emote of its own, a look toward the nearest villager, a stroll for the ones who roam in NH (Daisy Mae, Franklin,
// Zipper, Celeste, within a small radius of their spot) or, now and then, a villager comes over to say hello
// (island/avatar.ts meetVisitor). Gulliver sleeps face down until he's been nudged five times (NH). They arrive (walk
// from the campsite along the paths, float or fly down from the sky, or appear) when their visit starts and leave the same way when
// it's over. The director (motion/director.svelte.ts, actor 'visitor') moves them; Visitor.svelte draws them.
import type { EmoteIcon } from '#lib/art.ts';
import { pickOne, shuffle } from '#lib/random.ts';
import type { FxKind, Motion } from '../motion/reactions.ts';
import type { VisitorId } from '../../world/visitors.ts';
import type { Pt } from '../../world/walkGraph.ts';

/** How a visitor comes and goes: from the campsite on foot (or hopping), floating or flying down from the sky (and back
 *  up), appearing where they stand (Gulliver already washed up), or Jack's spooky puff. */
export type Way = 'walk' | 'hop' | 'float' | 'fly' | 'appear' | 'spook';

interface Behaviour {
  /** How far from their spot they stroll (u); 0: they stay put (NH: Gulliver, Jack…). */
  roam: number;
  arrive: Way;
  leave: Way;
  /** Their own emotes, now and then (villagers' set: colour glyphs and marks). */
  emotes: readonly EmoteIcon[];
  /** Their NH signature on a beat. */
  signature: { motion?: Motion; fx?: FxKind; emote?: EmoteIcon };
  /** The emote they answer a villager's hello with. */
  hello: EmoteIcon;
}

export const BEHAVIOUR: Record<VisitorId, Behaviour> = {
  // Daisy Mae: shifts the turnip bundle on her head and hums; strolls about selling (NH: she walks around the island)
  'daisy-mae': { roam: 64, arrive: 'walk', leave: 'walk', emotes: ['mark-note', 'glee', 'mark-sweat'], signature: { motion: 'wiggle', fx: 'notes' }, hello: 'glee' },
  // Wisp: floats and drifts with a flicker (CSS); a shy little wobble
  wisp: { roam: 0, arrive: 'float', leave: 'float', emotes: ['mark-sweat', 'mark-question', 'mark-note'], signature: { motion: 'wiggle', fx: 'glint' }, hello: 'mark-sweat' },
  // Gulliver: asleep face down (NH); awake, he looks about, lost
  gulliver: { roam: 0, arrive: 'appear', leave: 'fly', emotes: ['mark-question', 'thought', 'surprise'], signature: { motion: 'turn' }, hello: 'mark-question' },
  // NH's plaza visitors (the weekday rotation): Kicks taps his foot (a nod), shoe-proud
  kicks: { roam: 0, arrive: 'walk', leave: 'walk', emotes: ['mark-note', 'glee', 'mark-sparkle'], signature: { motion: 'nod', fx: 'glint' }, hello: 'glee' },
  // Label: shows off the season's look (a proud pose), sketching ideas
  label: { roam: 0, arrive: 'walk', leave: 'walk', emotes: ['inspiration', 'mark-sparkle', 'glee'], signature: { motion: 'proud', fx: 'sparkles' }, hello: 'inspiration' },
  // Saharah: sways to a desert tune, mysterious
  saharah: { roam: 0, arrive: 'walk', leave: 'walk', emotes: ['mark-note', 'thought', 'mark-sparkle'], signature: { motion: 'hum', fx: 'notes' }, hello: 'mark-note' },
  // Leif: a slow, sleepy sway with his seedling; ambles about the flowers
  leif: { roam: 40, arrive: 'walk', leave: 'walk', emotes: ['glee', 'mark-heart', 'thought'], signature: { motion: 'wiggle', fx: 'sparkles' }, hello: 'glee' },
  // Redd: shifty, looks this way and that
  redd: { roam: 0, arrive: 'walk', leave: 'walk', emotes: ['mark-sweat', 'mark-question', 'glee'], signature: { motion: 'turn' }, hello: 'glee' },
  // C.J.: a fist-pump, wanders about looking for fishing spots
  cj: { roam: 48, arrive: 'walk', leave: 'walk', emotes: ['glee', 'mark-sparkle', 'surprise'], signature: { motion: 'hop', fx: 'sparkles' }, hello: 'glee' },
  // Flick: cool, a slow nod; wanders about looking for bugs
  flick: { roam: 48, arrive: 'walk', leave: 'walk', emotes: ['thought', 'mark-sparkle', 'curiosity'], signature: { motion: 'nod', emote: 'curiosity' }, hello: 'thought' },
  // Jack: a theatrical sway (CSS), a twirl, a spooky glint
  jack: { roam: 0, arrive: 'spook', leave: 'spook', emotes: ['mark-question', 'glee', 'mark-sparkle'], signature: { motion: 'twirl', fx: 'sparkles' }, hello: 'glee' },
  // Celeste: looks up at the sky (and points when a star falls: Visitor.svelte), strolls under it
  celeste: { roam: 40, arrive: 'fly', leave: 'fly', emotes: ['inspiration', 'mark-sparkle', 'glee'], signature: { motion: 'lookup', emote: 'mark-sparkle' }, hello: 'inspiration' },
  // Franklin: a flap and a bob, looks around for something to cook, waddles about
  franklin: { roam: 48, arrive: 'walk', leave: 'walk', emotes: ['curiosity', 'thought', 'mark-question'], signature: { motion: 'flap', emote: 'curiosity' }, hello: 'glee' },
  // Jingle: bounces (CSS) with a jingle of sparkle
  jingle: { roam: 0, arrive: 'walk', leave: 'walk', emotes: ['glee', 'mark-sparkle', 'mark-note'], signature: { motion: 'hop', fx: 'glint' }, hello: 'glee' },
  // Zipper: hops on the spot (CSS) and hops about
  zipper: { roam: 48, arrive: 'hop', leave: 'hop', emotes: ['glee', 'mark-heart', 'mark-note'], signature: { motion: 'hop2', fx: 'sparkles' }, hello: 'glee' },
  // Reese and Cyrus: lean toward each other (CSS), a nuzzle with hearts
  reese: { roam: 0, arrive: 'walk', leave: 'walk', emotes: ['mark-heart', 'love', 'mark-note'], signature: { motion: 'nuzzle', fx: 'hearts' }, hello: 'mark-heart' },
  // the guests (visitorRoles.ts): Gracie poses, chic; Wardell shows off a piece of furniture, a proud nod
  gracie: { roam: 0, arrive: 'walk', leave: 'walk', emotes: ['mark-sparkle', 'inspiration', 'glee'], signature: { motion: 'proud', fx: 'sparkles' }, hello: 'mark-sparkle' },
  wardell: { roam: 0, arrive: 'walk', leave: 'walk', emotes: ['glee', 'inspiration', 'mark-note'], signature: { motion: 'nod', fx: 'glint' }, hello: 'glee' },
  // Katrina: still, her crystal ball's glint, mysterious
  katrina: { roam: 0, arrive: 'walk', leave: 'walk', emotes: ['thought', 'mark-sparkle', 'mark-question'], signature: { motion: 'hum', fx: 'glint' }, hello: 'thought' },
  // Wendell, hungry on the beach: looks about for food, a sigh; Gullivarrr looks out to sea for his ship
  wendell: { roam: 0, arrive: 'appear', leave: 'walk', emotes: ['mark-sweat', 'thought', 'mark-question'], signature: { motion: 'turn' }, hello: 'mark-sweat' },
  gullivarrr: { roam: 0, arrive: 'appear', leave: 'fly', emotes: ['surprise', 'glee', 'mark-question'], signature: { motion: 'lookup' }, hello: 'glee' },
  // Pete with his mailbag, Leilani with her gifts, Lottie with her notebook: cheerful, about the plaza
  pete: { roam: 40, arrive: 'fly', leave: 'fly', emotes: ['glee', 'mark-note', 'mark-sweat'], signature: { motion: 'flap' }, hello: 'glee' },
  leilani: { roam: 0, arrive: 'walk', leave: 'walk', emotes: ['glee', 'mark-heart', 'mark-note'], signature: { motion: 'wiggle', fx: 'notes' }, hello: 'glee' },
  lottie: { roam: 40, arrive: 'walk', leave: 'walk', emotes: ['inspiration', 'glee', 'mark-sparkle'], signature: { motion: 'hop', fx: 'sparkles' }, hello: 'inspiration' },
  // Chip and Nat watch for catches, a hop at each
  chip: { roam: 48, arrive: 'walk', leave: 'walk', emotes: ['glee', 'surprise', 'mark-sparkle'], signature: { motion: 'hop' }, hello: 'glee' },
  nat: { roam: 48, arrive: 'walk', leave: 'walk', emotes: ['curiosity', 'glee', 'surprise'], signature: { motion: 'nod', emote: 'curiosity' }, hello: 'curiosity' },
  // Rover, the traveller; Shrunk does a little bit; Tortimer, old and slow; Phineas, bowing with his badges
  rover: { roam: 0, arrive: 'walk', leave: 'walk', emotes: ['glee', 'mark-question', 'thought'], signature: { motion: 'turn' }, hello: 'glee' },
  shrunk: { roam: 0, arrive: 'walk', leave: 'walk', emotes: ['glee', 'mark-note', 'surprise'], signature: { motion: 'wiggle', fx: 'notes' }, hello: 'glee' },
  tortimer: { roam: 0, arrive: 'walk', leave: 'walk', emotes: ['thought', 'glee', 'mark-sweat'], signature: { motion: 'nod' }, hello: 'glee' },
  phineas: { roam: 0, arrive: 'walk', leave: 'walk', emotes: ['mark-sparkle', 'glee', 'inspiration'], signature: { motion: 'proud', fx: 'sparkles' }, hello: 'mark-sparkle' },
  // Pavé dances for Festivale
  pave: { roam: 40, arrive: 'walk', leave: 'walk', emotes: ['glee', 'mark-note', 'mark-sparkle'], signature: { motion: 'twirl', fx: 'sparkles' }, hello: 'glee' }
};

/** What a visitor does on a beat. */
export type VisitorAct = 'signature' | 'emote' | 'look' | 'wander' | 'home' | 'meet';

export interface BeatState {
  /** A line of theirs is in the balloon: they stand still and face the speaker. */
  speaking: boolean;
  /** Gulliver, asleep: he only twitches and snores. */
  asleep: boolean;
  /** Mid-stroll, or arriving / leaving. */
  walking: boolean;
  /** Standing away from their spot. */
  away: boolean;
  /** ms since a villager last came over (Infinity: never this visit). */
  sinceMeet: number;
  /** A villager is free to come over (home, awake, not busy, nobody walking). */
  villagerFree: boolean;
}

/** A villager comes over at most once per this long (ms). */
export const MEET_GAP = 45_000;
/** The beat's weights. */
const W: Record<VisitorAct, number> = { signature: 4, emote: 3, look: 3, wander: 3, home: 2, meet: 1.5 };

/** One beat: what the visitor does now (null: nothing, it's speaking or walking). */
export function pickAct(id: VisitorId, s: BeatState, rnd: () => number): VisitorAct | null {
  if (s.speaking || s.walking) return null;
  if (s.asleep) return 'signature';
  const b = BEHAVIOUR[id];
  const pool: [VisitorAct, number][] = [['signature', W.signature], ['emote', W.emote], ['look', W.look]];
  if (b.roam && !s.away) pool.push(['wander', W.wander]);
  if (s.away) pool.push(['home', W.home]);
  if (!s.away && s.villagerFree && s.sinceMeet >= MEET_GAP) pool.push(['meet', W.meet]);
  const total = pool.reduce((t, [, w]) => t + w, 0);
  let r = rnd() * total;
  for (const [a, w] of pool) if ((r -= w) < 0) return a;
  return pool[pool.length - 1][0];
}

/** One of their emotes, never the last one again. */
export function pickEmote(id: VisitorId, rnd: () => number, last?: EmoteIcon | null): EmoteIcon {
  const list = BEHAVIOUR[id].emotes.filter((e) => e !== last);
  return pickOne(list, rnd);
}

/** Where a stroll may end (world x, z): around their spot within their radius, in front of it (toward the camera,
 *  smaller z) or level with it, so they stay in sight; shuffled; the caller keeps the ones that are walkable and clear
 *  of the UI. */
export function strollSpots(home: Pt, roam: number, rnd: () => number): Pt[] {
  if (!roam) return [];
  const out: Pt[] = [];
  for (const [fx, fz] of [[1, 0], [-1, 0], [0.7, 0.45], [-0.7, 0.45], [0.45, 0.2], [-0.45, 0.2], [0, 0.5]] as const)
    out.push([Math.round(home[0] + fx * roam), Math.round(home[1] - fz * roam * 0.5)]);
  shuffle(out, rnd);
  return out;
}

/** The little move before a line (a hop; Wisp wobbles, Gulliver starts). */
export const tapMotion = (id: VisitorId): Motion => (id === 'wisp' ? 'wiggle' : id === 'gulliver' ? 'surprise' : 'hop');

/** Strolling speed (u/s): slower than a villager's wander (NH's visitors amble); arriving from the campsite at the
 *  world's stroll (spec §4: 90 u/s); back to their spot before a line, briskly. */
export const VISITOR_SPEED = { stroll: 48, arrive: 90, back: 160 } as const;

/** Gulliver wakes on the fifth nudge (NH: talk to him five times). */
export const GULLIVER_WAKE = 5;
/** A nudge on sleeping Gulliver: the nudges so far, and whether this one woke him. */
export function nudge(taps: number): { taps: number; woke: boolean } {
  const n = Math.min(GULLIVER_WAKE, taps + 1);
  return { taps: n, woke: n >= GULLIVER_WAKE };
}
/** His sleep talk while he's nudged (i18n visitor.gulliver.zzz.<n>). */
export const MUMBLES = 3;

/** How long an arrival or a departure that doesn't walk takes (ms). A walk takes its route's length at
 *  VISITOR_SPEED.arrive. On a page's first paint a visitor is simply there (a short pop in place, `POP_MS`). */
export const WAY_MS: Record<Exclude<Way, 'walk' | 'hop'>, number> = { float: 2200, fly: 1600, appear: 900, spook: 1200 };
export const POP_MS = 700;
/** The fade at the end of a walk off (and the start of one on) at the campsite's door (ms). */
export const EDGE_FADE_MS = 500;

/** An arrival or departure's length (ms): a walk by its route's length, else the way's own. */
export function wayMs(way: Way, routeLen = 0): number {
  if (way === 'walk' || way === 'hop') return Math.round((routeLen / VISITOR_SPEED.arrive) * 1000) + EDGE_FADE_MS;
  return WAY_MS[way];
}

