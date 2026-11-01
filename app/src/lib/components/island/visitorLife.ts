// The visitors' life on the island (docs/design.md "Visitors: life"), the pure part. Every visitor breathes and shifts
// its weight (CSS, Visitor.svelte); on idle life's beat (motion/idleLife.svelte.ts, the villagers' scheduler) one small
// thing: its NH signature (K.K. strums on, Jack twirls, Zipper hops, Pavé dances, Celeste looks up at the stars, …), an
// emote of its own, a look toward the nearest villager, a stroll for the ones who roam in NH (Daisy Mae, Franklin,
// Zipper, Celeste, within a small radius of centre stage) or, now and then, a villager comes over to say hello
// (island/avatar.ts meetVisitor). Gulliver sleeps face down until he's been nudged five times (NH). They arrive (walk
// up from the shore, float or fly down from the sky, or appear) when their visit starts and leave the same way when
// it's over. The director (motion/director.svelte.ts, actor 'visitor') moves them; Visitor.svelte draws them.
import type { EmoteIcon } from '#lib/art.ts';
import { pickOne, shuffle } from '#lib/random.ts';
import type { FxKind, Motion } from '../motion/reactions.ts';
import type { VisitorId } from './visitors.ts';
import type { Pt } from './walkGraph.ts';

/** How a visitor comes and goes: up from the shore on foot (or hopping), floating or flying down from the sky (and back
 *  up), appearing where they stand (K.K. on his stool, Gulliver already washed up), or Jack's spooky puff. */
export type Way = 'walk' | 'hop' | 'float' | 'fly' | 'appear' | 'spook';

export interface Behaviour {
  /** How far from their spot they stroll (u); 0: they stay put (NH: K.K. on his stool, Gulliver, Jack, Pavé…). */
  roam: number;
  arrive: Way;
  leave: Way;
  /** One breath (ms): 2.4–3.2 s, each their own so two figures never breathe together. */
  breath: number;
  /** Their own emotes, now and then (villagers' set: colour glyphs and marks). */
  emotes: readonly EmoteIcon[];
  /** Their NH signature on a beat. */
  signature: { motion?: Motion; fx?: FxKind; emote?: EmoteIcon };
  /** Which way the render looks as drawn ('l' | 'r'), or null when it faces the camera: only a side-on render turns by
   *  mirroring; one that faces us leans toward what it looks at (K.K.'s guitar, Reese and Cyrus never mirror). */
  drawn: 'l' | 'r' | null;
  /** The emote they answer a villager's hello with. */
  hello: EmoteIcon;
}

export const BEHAVIOUR: Record<VisitorId, Behaviour> = {
  // K.K. on his stool: strums (CSS), a nod to the beat now and then, notes floating off the guitar
  'kk-slider': { roam: 0, arrive: 'appear', leave: 'appear', breath: 2800, emotes: ['mark-note', 'glee'], signature: { motion: 'nod', fx: 'notes' }, drawn: null, hello: 'mark-note' },
  // Daisy Mae: shifts the turnip bundle on her head and hums; strolls about selling (NH: she walks around the island)
  'daisy-mae': { roam: 30, arrive: 'walk', leave: 'walk', breath: 2600, emotes: ['mark-note', 'glee', 'mark-sweat'], signature: { motion: 'wiggle', fx: 'notes' }, drawn: 'r', hello: 'glee' },
  // Wisp: floats and drifts with a flicker (CSS); a shy little wobble
  wisp: { roam: 0, arrive: 'float', leave: 'float', breath: 3200, emotes: ['mark-sweat', 'mark-question', 'mark-note'], signature: { motion: 'wiggle', fx: 'glint' }, drawn: null, hello: 'mark-sweat' },
  // Gulliver: asleep face down (NH); awake, he looks about, lost
  gulliver: { roam: 0, arrive: 'appear', leave: 'fly', breath: 3000, emotes: ['mark-question', 'thought', 'surprise'], signature: { motion: 'turn' }, drawn: 'l', hello: 'mark-question' },
  // Jack: a theatrical sway (CSS), a twirl, a spooky glint
  jack: { roam: 0, arrive: 'spook', leave: 'spook', breath: 2700, emotes: ['mark-question', 'glee', 'mark-sparkle'], signature: { motion: 'twirl', fx: 'sparkles' }, drawn: null, hello: 'glee' },
  // Celeste: looks up at the sky (and points when a star falls: Visitor.svelte), strolls under it
  celeste: { roam: 26, arrive: 'fly', leave: 'fly', breath: 2900, emotes: ['inspiration', 'mark-sparkle', 'glee'], signature: { motion: 'lookup', emote: 'mark-sparkle' }, drawn: null, hello: 'inspiration' },
  // Franklin: a flap and a bob, looks around for something to cook, waddles about
  franklin: { roam: 28, arrive: 'walk', leave: 'walk', breath: 2500, emotes: ['curiosity', 'thought', 'mark-question'], signature: { motion: 'flap', emote: 'curiosity' }, drawn: null, hello: 'glee' },
  // Jingle: bounces (CSS) with a jingle of sparkle
  jingle: { roam: 0, arrive: 'walk', leave: 'walk', breath: 2400, emotes: ['glee', 'mark-sparkle', 'mark-note'], signature: { motion: 'hop', fx: 'glint' }, drawn: null, hello: 'glee' },
  // Pavé: dance steps all day (Festivale, CSS) and a bigger samba with confetti
  pave: { roam: 0, arrive: 'walk', leave: 'walk', breath: 2400, emotes: ['glee', 'mark-note', 'mark-sparkle'], signature: { motion: 'samba', fx: 'confetti' }, drawn: null, hello: 'mark-note' },
  // Zipper: hops on the spot (CSS) and hops about
  zipper: { roam: 30, arrive: 'hop', leave: 'hop', breath: 2500, emotes: ['glee', 'mark-heart', 'mark-note'], signature: { motion: 'hop2', fx: 'sparkles' }, drawn: null, hello: 'glee' },
  // Reese and Cyrus: lean toward each other (CSS), a nuzzle with hearts
  reese: { roam: 0, arrive: 'walk', leave: 'walk', breath: 3000, emotes: ['mark-heart', 'love', 'mark-note'], signature: { motion: 'nuzzle', fx: 'hearts' }, drawn: null, hello: 'mark-heart' }
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
  /** K.K. is playing a song: the beat is the music's. */
  playing?: boolean;
}

/** A villager comes over at most once per this long (ms). */
export const MEET_GAP = 45_000;
/** The beat's weights. */
const W: Record<VisitorAct, number> = { signature: 4, emote: 3, look: 3, wander: 3, home: 2, meet: 1.5 };

/** One beat: what the visitor does now (null: nothing, it's speaking or walking). */
export function pickAct(id: VisitorId, s: BeatState, rnd: () => number): VisitorAct | null {
  if (s.speaking || s.walking) return null;
  if (s.asleep || s.playing) return 'signature';
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

/** Where a stroll may end: around their spot within their radius, in front of it or level with it (never back toward
 *  the trees' canopies), shuffled; the caller keeps the ones that are walkable and clear of the UI. */
export function strollSpots(home: Pt, roam: number, rnd: () => number): Pt[] {
  if (!roam) return [];
  const out: Pt[] = [];
  for (const [fx, fy] of [[1, 0], [-1, 0], [0.7, 0.45], [-0.7, 0.45], [0.45, 0.2], [-0.45, 0.2], [0, 0.5]] as const)
    out.push([Math.round(home[0] + fx * roam), Math.round(home[1] + fy * roam * 0.5)]);
  shuffle(out, rnd);
  return out;
}

/** The little move before a line (a hop; K.K. nods from his stool, Wisp wobbles, Gulliver starts). */
export const tapMotion = (id: VisitorId): Motion => (id === 'kk-slider' ? 'nod' : id === 'wisp' ? 'wiggle' : id === 'gulliver' ? 'surprise' : 'hop');

/** Strolling speed (u/s): slower than a villager's wander (NH's visitors amble); arriving from the shore a little
 *  quicker; back to their spot before a line, briskly. */
export const VISITOR_SPEED = { stroll: 48, arrive: 80, back: 160 } as const;

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
/** The fade at the end of a walk off (and the start of one on) at the water's edge (ms). */
export const EDGE_FADE_MS = 500;

/** An arrival or departure's length (ms): a walk by its route's length, else the way's own. */
export function wayMs(way: Way, routeLen = 0): number {
  if (way === 'walk' || way === 'hop') return Math.round((routeLen / VISITOR_SPEED.arrive) * 1000) + EDGE_FADE_MS;
  return WAY_MS[way];
}

/** Where a walk on starts (and a walk off ends): the water's edge in front of their spot. */
export const shoreFor = (home: Pt, shoreY: number): Pt => [Math.round(home[0]), Math.round(shoreY)];
