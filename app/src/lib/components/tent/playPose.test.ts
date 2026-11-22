// A villager playing a room's instrument (playPose.ts): every family's pose is finite, moves with its beat, fades in from
// the idle and back to it.
import { describe, expect, it } from 'vitest';
import { idle } from '../villager3d/poses.ts';
import { playPose } from './playPose.ts';
import { INSTRUMENTS, PLAY_MS } from './toggles.ts';

const arm = (u: number, f: (typeof INSTRUMENTS)[number]) => playPose(f, u, PLAY_MS).j.Arm_1_R!;

describe('playPose', () => {
  it('every family: finite joints, the arms off the idle mid-play, moving over a beat', () => {
    for (const f of INSTRUMENTS) {
      const p = playPose(f, 1200, PLAY_MS);
      for (const v of Object.values(p.j)) for (const x of v!) expect(Number.isFinite(x), f).toBe(true);
      const rest = idle(1200).j.Arm_1_R!;
      expect(Math.abs(p.j.Arm_1_R![0] - rest[0]) + Math.abs(p.j.Arm_1_R![1] - rest[1]) + Math.abs(p.j.Arm_1_R![2] - rest[2]), f).toBeGreaterThan(0.2);
      const seen = new Set([400, 520, 650, 780, 900, 1030, 1160, 1290, 1420, 1550, 1700, 1850].map((u) => JSON.stringify(playPose(f, u, PLAY_MS).j)));
      expect(seen.size, f).toBeGreaterThan(1);
    }
  });
  it('fades in from the idle and back out to it at the end', () => {
    for (const f of INSTRUMENTS) {
      expect(arm(0, f)).toEqual(idle(0).j.Arm_1_R);
      expect(arm(PLAY_MS, f)).toEqual(idle(PLAY_MS).j.Arm_1_R);
    }
  });
});
