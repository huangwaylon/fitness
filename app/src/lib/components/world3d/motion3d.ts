// A villager card's pose in 3D (cards.ts): the director's motions (reactions.ts, the 2D island's CSS keyframes) as a
// lift, a squash and a tilt over the motion's time, plus the walk's trot, the idle bob and a sleeper's breathing. Pure.
import { MOTION_MS, type Motion } from '../motion/reactions.ts';

export interface Pose {
  lift: number;
  squash: number;
  tilt: number;
}

const S = Math.sin, PI = Math.PI;

/** A motion `ms` after it started (null once it's over). */
export function motionPose(m: Motion, ms: number): Pose | null {
  const k = ms / (MOTION_MS[m] ?? 600);
  if (k < 0 || k >= 1) return null;
  const e = 1 - k, half = S(PI * k);
  switch (m) {
    case 'hop': return { lift: half * 16, squash: -0.05 * half, tilt: 0 };
    case 'hop2': case 'leap': return { lift: Math.abs(S(2 * PI * k)) * (m === 'leap' ? 22 : 14), squash: 0, tilt: 0 };
    case 'squish': case 'twitch': return { lift: 0, squash: 0.12 * half, tilt: 0 };
    case 'wiggle': case 'shake': case 'headshake': return { lift: 0, squash: 0, tilt: S(k * 6 * PI) * 0.09 * e };
    case 'nod': case 'bow': return { lift: 0, squash: 0.07 * Math.abs(S(2 * PI * k)), tilt: 0 };
    case 'laugh': case 'flap': return { lift: Math.abs(S(3 * PI * k)) * 5, squash: 0, tilt: 0 };
    case 'surprise': return { lift: half * 10, squash: -0.08 * half, tilt: 0 };
    case 'shy': case 'nuzzle': return { lift: 0, squash: 0, tilt: 0.08 * half };
    case 'stretch': case 'proud': case 'lookup': return { lift: 0, squash: -0.08 * half, tilt: 0 };
    case 'dance': case 'samba': return { lift: Math.abs(S(4 * PI * k)) * 6, squash: 0, tilt: S(4 * PI * k) * 0.14 };
    case 'hum': case 'warmup': return { lift: 0, squash: 0.04 * S(4 * PI * k), tilt: S(4 * PI * k) * 0.04 };
    case 'sidebend': return { lift: 0, squash: 0, tilt: S(2 * PI * k) * 0.2 };
    case 'twirl': return { lift: half * 6, squash: 0.1 * S(4 * PI * k), tilt: 0 };
    default: return { lift: 0, squash: 0, tilt: 0 };
  }
}

/** Walking (a trot of two steps a `stepMs` cycle), idle (a slow bob) or asleep (a slow breath), at time `t` (ms). */
export function idlePose(t: number, walking: boolean, asleep: boolean, stepMs: number, seed: number): Pose {
  if (walking) {
    const ph = (t / stepMs) * 2 * PI;
    return { lift: Math.abs(S(ph)) * 4, squash: Math.max(0, Math.cos(ph * 2)) * 0.035, tilt: S(ph) * 0.03 };
  }
  if (asleep) return { lift: 0, squash: 0.025 * S(t / 1400 + seed), tilt: 0 };
  return { lift: 0, squash: 0.014 * S(t / 650 + seed), tilt: 0 };
}
