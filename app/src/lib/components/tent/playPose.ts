// A villager playing a room's instrument (docs/design.md "The tent": Things that do something), pure: a pose a moment
// `u` ms into a play of `ms`, by the instrument's family, as poses.ts draws its own (the same joints and turns, its
// header has the axes), over the idle (its joints replaced), faded in and out. The engine holds it on the 3D model (villager3d hold): the
// states' and actions' poses aside while it plays, put back after. Here, not in poses.ts: the rooms' alone.
import { clamp01, smooth01 } from '#lib/math.ts';
import { idle, over, poseBuf, type Pose } from '../villager3d/poses.ts';
import type { Instrument } from './toggles.ts';

/** The arms lowered from NH's T (poses.ts ARMS). */
const ARMS = 1.22;
const TAU = Math.PI * 2;
/** Fading in and out of the play (ms). */
const IN_MS = 220, OUT_MS = 280;
/** Each family's beat (ms a beat). */
const BEAT_MS: Record<Instrument, number> = { keys: 300, strings: 380, drums: 250, gong: 1500, mallet: 260, winds: 600, theremin: 900, sing: 600, dj: 420 };

/** The play's pose at `u` ms of `ms` (a pose of its own: `out`, reused). */
export function playPose(fam: Instrument, u: number, ms: number, seed = 0, out: Pose = poseBuf()): Pose {
  const rest = idle(u, seed), p = poseBuf();
  const B = BEAT_MS[fam], beat = (u % B) / B, n = Math.floor(u / B), s = Math.sin(beat * TAU), hit = Math.max(0, Math.sin(beat * Math.PI)) ** 3;
  // the body to the beat: a nod and a little bounce
  const nod = 0.08 * Math.abs(Math.sin((u / (B * 2)) * TAU));
  p.j.Head = [0.04 + nod, 0, 0];
  p.y = 0.08 * Math.abs(s);
  switch (fam) {
    case 'keys': {
      // hands forward over the keys, pressing one and then the other, the body swaying along the keyboard
      const l = n % 2 ? hit : 0, r = n % 2 ? 0 : hit, sway = Math.sin((u / (B * 8)) * TAU);
      p.j.Arm_1_L = [-0.95 + 0.14 * l, 0.1 * sway, -(ARMS - 0.12)];
      p.j.Arm_1_R = [-0.95 + 0.14 * r, 0.1 * sway, ARMS - 0.12];
      p.j.Arm_2_L = [0, -0.55, 0];
      p.j.Arm_2_R = [0, 0.55, 0];
      p.j.Hand_L = [0.3 * l, 0, 0];
      p.j.Hand_R = [0.3 * r, 0, 0];
      p.j.Spine_1 = [0.12, 0.12 * sway, 0];
      break;
    }
    case 'strings': {
      // the left hand up on the neck, the right strumming down and up
      p.j.Arm_1_L = [-0.85, 0.45, -(ARMS - 0.55)];
      p.j.Arm_2_L = [0, -1.0, 0];
      p.j.Arm_1_R = [-0.55 + 0.12 * s, 0, ARMS - 0.25];
      p.j.Arm_2_R = [0, 1.15 + 0.35 * s, 0];
      p.j.Hand_R = [0.25 * s, 0, 0];
      p.j.Spine_1 = [0.06, 0.1, 0.04 * s];
      break;
    }
    case 'drums':
    case 'mallet': {
      // sticks (mallets) down one hand then the other; a marimba's along its bars, side to side
      const l = n % 2 ? hit : 0, r = n % 2 ? 0 : hit, side = fam === 'mallet' ? Math.sin((u / (B * 6)) * TAU) : 0;
      p.j.Arm_1_L = [-1.15 + 0.5 * l, 0.15 * side, -(ARMS - 0.3)];
      p.j.Arm_1_R = [-1.15 + 0.5 * r, 0.15 * side, ARMS - 0.3];
      p.j.Arm_2_L = [0, -(1.15 - 0.6 * l), 0];
      p.j.Arm_2_R = [0, 1.15 - 0.6 * r, 0];
      p.j.Spine_1 = [0.14, 0.15 * side, 0];
      p.y = 0.12 * Math.max(l, r);
      break;
    }
    case 'gong': {
      // the mallet swung back, then the strike, held while it rings
      const back = beat < 0.45 ? smooth01(beat / 0.45) : 0, strike = beat >= 0.45 ? Math.exp(-(((beat - 0.5) / 0.08) ** 2)) : 0;
      p.j.Arm_1_R = [-0.6 + 0.9 * back - 0.6 * strike, 0.4 * back, ARMS - 0.5];
      p.j.Arm_2_R = [0, 0.9 - 0.5 * strike, 0];
      p.j.Spine_1 = [0.05 - 0.1 * back + 0.12 * strike, 0.25 * back - 0.15 * strike, 0];
      p.j.Arm_1_L = [-0.2, 0, -(ARMS - 0.3)];
      break;
    }
    case 'winds': {
      // both hands up at the mouth, the horn's bell up on the long notes, leaning back with it
      const long = 0.5 - 0.5 * Math.cos((u / (B * 4)) * TAU);
      p.j.Arm_1_L = [-1.25 - 0.15 * long, 0, -(ARMS - 0.55)];
      p.j.Arm_1_R = [-1.25 - 0.15 * long, 0, ARMS - 0.55];
      p.j.Arm_2_L = [0, -1.45, 0];
      p.j.Arm_2_R = [0, 1.45, 0];
      p.j.Hand_L = [0.15 * Math.max(0, s), 0, 0];
      p.j.Spine_1 = [-0.12 * long, 0, 0];
      p.j.Head = [-0.1 * long, 0, 0];
      break;
    }
    case 'theremin': {
      // no touching: the right hand near the antenna wavering the pitch, the left lifting and lowering the volume
      const w = Math.sin((u / B) * TAU), v = Math.sin((u / (B * 1.7)) * TAU);
      p.j.Arm_1_R = [-1.05 + 0.12 * w, 0.25 * w, ARMS - 0.35];
      p.j.Arm_2_R = [0, 0.7, 0];
      p.j.Hand_R = [0, 0, 0.4 * Math.sin((u / 140) * TAU)];
      p.j.Arm_1_L = [-0.5, 0, -(ARMS - 0.7 - 0.25 * v)];
      p.j.Arm_2_L = [0, -0.6, 0];
      p.j.Spine_1 = [0.04, 0, 0.05 * w];
      break;
    }
    case 'sing': {
      // the mic at the mouth, the other arm out with the tune, swaying
      const out1 = 0.5 + 0.5 * Math.sin((u / (B * 4)) * TAU);
      p.j.Arm_1_R = [-1.2, 0, ARMS - 0.5];
      p.j.Arm_2_R = [0, 1.6, 0];
      p.j.Arm_1_L = [-0.4 * out1, 0, -(ARMS - 0.9 * out1)];
      p.j.Arm_2_L = [0, -0.3, 0];
      p.j.Spine_1 = [-0.04, 0, 0.08 * Math.sin((u / (B * 2)) * TAU)];
      p.j.Head = [-0.08, 0, 0.06 * Math.sin((u / (B * 2)) * TAU)];
      break;
    }
    case 'dj': {
      // a hand on the record scratching it back and forth, the other holding the headphones to an ear, nodding
      const scr = Math.sin((u / 210) * TAU);
      p.j.Arm_1_R = [-0.9, 0.22 * scr, ARMS - 0.2];
      p.j.Arm_2_R = [0, 0.7, 0];
      p.j.Arm_1_L = [-0.35, 0, -(ARMS - 1.5)];
      p.j.Arm_2_L = [0, -1.7, 0];
      p.j.Head = [0.06 + 2 * nod, 0, 0.12];
      break;
    }
  }
  const w = Math.min(smooth01(clamp01(u / IN_MS)), smooth01(clamp01((ms - u) / OUT_MS)));
  return over(rest, p, w, out);
}
