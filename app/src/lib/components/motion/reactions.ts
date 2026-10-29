// The motion and reaction catalogues (style guide §M.2, §M.5, §M.6, §M.7) as data.
// A "step" is one motion + one emote + optional fx on one actor; reactions are short step lists.
import type { EmoteIcon } from '../art.ts';

/** CSS keyframe primitives (tokens.css Builder A block), prefix `if-`. */
export type Motion =
  | 'squish' | 'hop' | 'hop2' | 'wiggle' | 'turn' | 'nod' | 'laugh' | 'surprise' | 'shy' | 'stretch'
  | 'proud' | 'dance' | 'shake' | 'bow' | 'headshake' | 'hum';

/** Durations in ms (must match the keyframes). */
export const MOTION_MS: Record<Motion, number> = {
  squish: 220, hop: 600, hop2: 900, wiggle: 700, turn: 1400, nod: 520, laugh: 620, surprise: 420, shy: 1000,
  stretch: 1400, proud: 900, dance: 1600, shake: 480, bow: 1100, headshake: 600, hum: 2400
};

export type FxKind = 'sparkles' | 'hearts' | 'notes' | 'sweat' | 'zzz' | 'confetti' | 'puff' | 'glint';

export type ActorId = 'mine' | 'partner' | 'host';

export interface Step {
  actor: ActorId | 'both';
  /** Delay from the start of the reaction. */
  at?: number;
  motion?: Motion;
  emote?: EmoteIcon;
  fx?: FxKind;
  /** Turn to face: the other villager, the jar, or back to as drawn. */
  face?: 'other' | 'jar' | 'home';
  /** しずえ pose for the duration (wave / stand / bow). */
  pose?: 'wave' | 'stand' | 'bow';
}

export type ReactionId =
  | 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8' | 'R9' | 'R10' | 'R11' | 'R12' | 'R13' | 'R14'
  | 'R15' | 'R16' | 'R17' | 'R18' | 'R19';

export interface Reaction {
  name: string;
  steps: Step[];
  /** Total length; the actors are busy (no idle life) until then. */
  ms: number;
}

/** §M.5 villager reactions (+ the matching しずえ beat where §M.6 has one). */
export const REACTIONS: Record<ReactionId, Reaction> = {
  R1: { name: 'first open', ms: 2200, steps: [
    { actor: 'mine', motion: 'wiggle', emote: 'greetings' },
    { actor: 'partner', at: 400, motion: 'wiggle', emote: 'greetings' },
    { actor: 'host', at: 200, motion: 'hop', emote: 'greetings', pose: 'wave' }
  ] },
  R2: { name: 'check-in saved', ms: 2200, steps: [
    { actor: 'mine', motion: 'hop2', emote: 'joy', fx: 'notes' },
    { actor: 'mine', at: 120, fx: 'sparkles' },
    { actor: 'host', at: 300, motion: 'hop', emote: 'joy', fx: 'notes', pose: 'wave' }
  ] },
  R3: { name: 'partner data', ms: 2600, steps: [
    { actor: 'partner', motion: 'surprise', emote: 'surprise' },
    { actor: 'partner', at: 900, motion: 'hop', emote: 'happiness' },
    { actor: 'mine', at: 600, motion: 'nod' }
  ] },
  R4: { name: 'high-five sent', ms: 2200, steps: [
    { actor: 'mine', motion: 'hop', emote: 'encouraging', fx: 'sparkles', face: 'other' },
    { actor: 'mine', at: 1600, face: 'home' }
  ] },
  R5: { name: 'high-five received', ms: 2400, steps: [{ actor: 'mine', motion: 'hop2', emote: 'love', fx: 'hearts' }] },
  R6: { name: 'fruit ripe', ms: 2200, steps: [{ actor: 'mine', motion: 'proud', emote: 'pride', fx: 'sparkles' }] },
  R7: { name: 'fruit stage up', ms: 2200, steps: [{ actor: 'mine', motion: 'nod', emote: 'pleased' }] },
  R8: { name: 'all ripe', ms: 2400, steps: [{ actor: 'mine', motion: 'dance', emote: 'delight', fx: 'confetti' }] },
  R9: { name: 'tap mine', ms: 2200, steps: [{ actor: 'mine', motion: 'squish', emote: 'greetings' }] },
  R10: { name: 'tap partner', ms: 2200, steps: [{ actor: 'partner', motion: 'squish', emote: 'happiness' }] },
  R11: { name: 'morning stretch', ms: 2200, steps: [
    { actor: 'mine', motion: 'stretch', emote: 'pose-stretch' },
    { actor: 'partner', at: 500, motion: 'stretch', emote: 'pose-stretch' }
  ] },
  R12: { name: 'evening nudge', ms: 2400, steps: [
    { actor: 'partner', motion: 'turn', face: 'other' },
    { actor: 'partner', at: 1400, motion: 'nod', emote: 'encouraging' },
    { actor: 'partner', at: 2300, face: 'home' }
  ] },
  R13: { name: 'fall asleep', ms: 2200, steps: [{ actor: 'both', emote: 'dozing', fx: 'zzz' }] },
  R14: { name: 'woken up', ms: 2200, steps: [{ actor: 'mine', motion: 'surprise', emote: 'shocked', fx: 'sweat' }] },
  R15: { name: 'low week', ms: 2200, steps: [{ actor: 'mine', motion: 'shy', emote: 'thought' }] },
  R16: { name: 'dance together', ms: 1600, steps: [{ actor: 'both', motion: 'dance', emote: 'glee', fx: 'notes' }] },
  R17: { name: 'sync problem', ms: 2200, steps: [
    { actor: 'mine', motion: 'shy', emote: 'sheepishness', fx: 'sweat' },
    { actor: 'host', at: 200, motion: 'headshake', emote: 'sheepishness', fx: 'sweat', pose: 'bow' }
  ] },
  R18: { name: 'jar tapped', ms: 1200, steps: [
    { actor: 'both', motion: 'turn', face: 'jar', emote: 'curiosity' },
    { actor: 'both', at: 1200, face: 'home' }
  ] },
  R19: { name: 'harvest', ms: 2400, steps: [
    { actor: 'both', motion: 'dance', emote: 'pose-viva', fx: 'confetti' },
    { actor: 'both', at: 1600, emote: 'joy' },
    { actor: 'host', at: 300, motion: 'bow', emote: 'happiness', fx: 'sparkles', pose: 'bow' }
  ] }
};

/** Idle-life actions (§M.7). */
export type IdleAction =
  | 'look' | 'wiggle' | 'hum' | 'hop' | 'stroll' | 'daydream' | 'treeshake' | 'chat' | 'dance' | 'stretch' | 'doze';

export interface IdleEntry {
  action: IdleAction;
  weight: number;
  /** Day only (06–19, not asleep). */
  day?: boolean;
  /** Hours [from, to) the action is allowed in. */
  hours?: [number, number];
  /** Minimum gap between two of these, per actor (ms). */
  every?: number;
  /** Involves both villagers. */
  pair?: boolean;
}

export const IDLE_POOL: IdleEntry[] = [
  { action: 'look', weight: 20, day: true },
  { action: 'wiggle', weight: 15, day: true },
  { action: 'hum', weight: 12, day: true },
  { action: 'hop', weight: 10, day: true },
  { action: 'stroll', weight: 10, day: true, every: 60_000 },
  { action: 'daydream', weight: 10 },
  { action: 'treeshake', weight: 7, day: true },
  { action: 'chat', weight: 8, day: true, every: 90_000, pair: true },
  { action: 'dance', weight: 5, pair: true },
  { action: 'stretch', weight: 8, hours: [5, 10] }
];

/** しずえ's idle moves (every 20–30 s at most). */
export const HOST_IDLE = ['swap', 'wiggle', 'hop'] as const;
/** Random emote when しずえ is tapped with nothing left to read. */
export const HOST_TAP: EmoteIcon[] = ['joy', 'laughter', 'happiness', 'flourish'];

/** Isolated so tests / the gallery can list them. */
export const REACTION_IDS = Object.keys(REACTIONS) as ReactionId[];
