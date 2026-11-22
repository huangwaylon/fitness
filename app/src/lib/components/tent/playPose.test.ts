// A villager playing a room's instrument (playPose.ts): every family's pose is finite, moves with its beat, fades in from
// the idle and back to it; a look in a mirror (a hand to the hair, a twirl: one whole turn) and a toss into a bin.
import { describe, expect, it } from 'vitest';
import { idle } from '../villager3d/poses.ts';
import { playPose, playSpin } from './playPose.ts';
import { INSTRUMENTS, MIRROR_MS, PLAY_MS, TOSS_MS, actMs } from './toggles.ts';

const arm = (u: number, f: Parameters<typeof playPose>[0]) => playPose(f, u, f === 'mirror' || f === 'toss' ? actMs(f) : PLAY_MS).j.Arm_1_R!;

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
  it('a look in a mirror: the hand up at the hair early, one whole turn by its end, at rest before and after', () => {
    const early = playPose('mirror', 0.2 * MIRROR_MS, MIRROR_MS).j.Arm_1_R!;
    expect(early[0]).toBeLessThan(-0.8);
    expect(playSpin('mirror', 0, MIRROR_MS)).toBe(0);
    expect(playSpin('mirror', 0.4 * MIRROR_MS, MIRROR_MS)).toBe(0);
    expect(playSpin('mirror', 0.75 * MIRROR_MS, MIRROR_MS)).toBeGreaterThan(0);
    expect(playSpin('mirror', MIRROR_MS, MIRROR_MS)).toBeCloseTo(Math.PI * 2);
    expect(playSpin('keys', 1000, PLAY_MS)).toBe(0);
    for (const f of ['mirror', 'toss'] as const) {
      expect(arm(0, f)).toEqual(idle(0).j.Arm_1_R);
      for (let u = 0; u <= actMs(f); u += 50) for (const v of Object.values(playPose(f, u, actMs(f)).j)) for (const x of v!) expect(Number.isFinite(x), f).toBe(true);
    }
  });
  it('a toss: the arm back, then forward past the hanging arm as it lets go', () => {
    const back = playPose('toss', 0.3 * TOSS_MS, TOSS_MS).j.Arm_1_R!, fwd = playPose('toss', 0.46 * TOSS_MS, TOSS_MS).j.Arm_1_R!;
    expect(back[0]).toBeGreaterThan(0.4);
    expect(fwd[0]).toBeLessThan(-0.8);
  });
});
