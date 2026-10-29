// The motion and reaction catalogues (style guide §M.2, §M.5, §M.6, §M.7) as data.
// A "step" is one motion + one emote + optional fx on one actor; reactions are short step lists.
import type { EmoteIcon } from '#lib/art.ts';

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

/** §M.5 villager reactions (+ the matching しずえ beat where §M.6 has one). Villagers get floating marks
 *  (`mark-*`, ours) and the official colour glyphs (love, surprise, glee, inspiration, curiosity,
 *  thought, daydreaming), never the player's cat faces (A1; Villager also maps any stray one).
 *  しずえ keeps the accent-heavy cat faces (joy, laughter, pride, flourish, shocked, sleepy). */
export const REACTIONS: Record<ReactionId, Reaction> = {
  R1: { name: 'first open', ms: 2200, steps: [
    { actor: 'mine', motion: 'wiggle', emote: 'mark-note' },
    { actor: 'partner', at: 400, motion: 'wiggle', emote: 'glee' },
    { actor: 'host', at: 200, motion: 'hop', emote: 'joy', pose: 'wave' }
  ] },
  R2: { name: 'check-in saved', ms: 2200, steps: [
    { actor: 'mine', motion: 'hop2', emote: 'mark-heart', fx: 'notes' },
    { actor: 'mine', at: 120, fx: 'sparkles' },
    { actor: 'host', at: 300, motion: 'hop', emote: 'joy', fx: 'notes', pose: 'wave' }
  ] },
  R3: { name: 'partner data', ms: 2600, steps: [
    { actor: 'partner', motion: 'surprise', emote: 'surprise' },
    { actor: 'partner', at: 900, motion: 'hop', emote: 'mark-note' },
    { actor: 'mine', at: 600, motion: 'nod' }
  ] },
  R4: { name: 'high-five sent', ms: 2200, steps: [
    { actor: 'mine', motion: 'hop', emote: 'mark-sparkle', fx: 'sparkles', face: 'other' },
    { actor: 'mine', at: 1600, face: 'home' }
  ] },
  R5: { name: 'high-five received', ms: 2400, steps: [{ actor: 'mine', motion: 'hop2', emote: 'love', fx: 'hearts' }] },
  R6: { name: 'fruit ripe', ms: 2200, steps: [{ actor: 'mine', motion: 'proud', emote: 'mark-sparkle', fx: 'sparkles' }] },
  R7: { name: 'fruit stage up', ms: 2200, steps: [{ actor: 'mine', motion: 'nod', emote: 'inspiration' }] },
  R8: { name: 'all ripe', ms: 2400, steps: [{ actor: 'mine', motion: 'dance', emote: 'glee', fx: 'confetti' }] },
  R9: { name: 'tap mine', ms: 2200, steps: [{ actor: 'mine', motion: 'squish', emote: 'mark-note' }] },
  R10: { name: 'tap partner', ms: 2200, steps: [{ actor: 'partner', motion: 'squish', emote: 'mark-heart' }] },
  R11: { name: 'morning stretch', ms: 2200, steps: [
    { actor: 'mine', motion: 'stretch', emote: 'mark-sparkle' },
    { actor: 'partner', at: 500, motion: 'stretch', emote: 'mark-note' }
  ] },
  R12: { name: 'evening nudge', ms: 2400, steps: [
    { actor: 'partner', motion: 'turn', face: 'other' },
    { actor: 'partner', at: 1400, motion: 'nod', emote: 'mark-bang' },
    { actor: 'partner', at: 2300, face: 'home' }
  ] },
  R13: { name: 'fall asleep', ms: 2200, steps: [{ actor: 'both', emote: 'mark-zzz', fx: 'zzz' }] },
  R14: { name: 'woken up', ms: 2200, steps: [{ actor: 'mine', motion: 'surprise', emote: 'surprise', fx: 'sweat' }] },
  R15: { name: 'low week', ms: 2200, steps: [{ actor: 'mine', motion: 'shy', emote: 'thought' }] },
  R16: { name: 'dance together', ms: 1600, steps: [{ actor: 'both', motion: 'dance', emote: 'glee', fx: 'notes' }] },
  R17: { name: 'sync problem', ms: 2200, steps: [
    { actor: 'mine', motion: 'shy', emote: 'mark-sweat' },
    { actor: 'host', at: 200, motion: 'headshake', emote: 'sheepishness', fx: 'sweat', pose: 'bow' }
  ] },
  R18: { name: 'jar tapped', ms: 1200, steps: [
    { actor: 'both', motion: 'turn', face: 'jar', emote: 'curiosity' },
    { actor: 'both', at: 1200, face: 'home' }
  ] },
  R19: { name: 'harvest', ms: 2400, steps: [
    { actor: 'both', motion: 'dance', emote: 'pose-viva', fx: 'confetti' },
    { actor: 'both', at: 1600, emote: 'glee' },
    { actor: 'host', at: 300, motion: 'bow', emote: 'pride', fx: 'sparkles', pose: 'bow' }
  ] }
};

/** Idle-life actions (§M.7). */
export type IdleAction =
  | 'look' | 'wiggle' | 'hum' | 'hop' | 'stroll' | 'peek' | 'daydream' | 'treeshake' | 'chat' | 'dance' | 'stretch' | 'doze';

export interface IdleEntry {
  action: IdleAction;
  weight: number;
  /** Day only: skipped in the evening (tod night, 19–22, before the villagers fall asleep). */
  day?: boolean;
  /** Hours [from, to) the action is allowed in. */
  hours?: [number, number];
  /** Minimum gap between two of these, per actor (ms). */
  every?: number;
  /** Involves both villagers. */
  pair?: boolean;
}

/** v5 §6: idle life stays in the background. Small body motions only (no emote bubbles, no notes:
 *  emotes are for events), mostly the quiet ones. */
export const IDLE_POOL: IdleEntry[] = [
  { action: 'look', weight: 14 },
  { action: 'wiggle', weight: 8 },
  { action: 'hop', weight: 6, day: true },
  { action: 'stroll', weight: 6, day: true, every: 90_000 },
  { action: 'peek', weight: 6, day: true, every: 120_000 },
  { action: 'treeshake', weight: 5, day: true, every: 60_000 },
  { action: 'chat', weight: 8, every: 60_000, pair: true },
  { action: 'dance', weight: 3, pair: true },
  { action: 'stretch', weight: 6, hours: [5, 10] }
];

/** Idle cadence (ms): 9–15 s while someone is around, 25–40 s after 3 min without input. */
export const IDLE_GAP: [number, number] = [9_000, 15_000];
export const IDLE_GAP_SLOW: [number, number] = [25_000, 40_000];

/** しずえ's idle moves (every 20–30 s at most). */
export const HOST_IDLE = ['swap', 'wiggle', 'hop'] as const;
/** Random emote when しずえ is tapped with nothing left to read. */
export const HOST_TAP: EmoteIcon[] = ['joy', 'laughter', 'pride', 'flourish'];

/** Isolated so tests / the gallery can list them. */
export const REACTION_IDS = Object.keys(REACTIONS) as ReactionId[];
