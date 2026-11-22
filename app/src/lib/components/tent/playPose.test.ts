// A villager playing a room's instrument (playPose.ts): every family's pose is finite, moves with its beat, fades in from
// the idle and back to it; a look in a mirror (a hand to the hair, a twirl: one whole turn) and a toss into a bin.
import { describe, expect, it } from 'vitest';
import { idle } from '../villager3d/poses.ts';
import { playPose, playSpin } from './playPose.ts';
import { INSTRUMENTS, MIRROR_MS, PLAY_MS, TOSS_MS, actMs } from './toggles.ts';
import { HELD_PLAY, type HoldHow } from './heldPlay.ts';
import { poseBuf } from '../villager3d/poses.ts';

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

  it('an instrument in the hands, held its own way: the guitar\'s neck hand out left, the violin up at the chin, the sax\'s left hand over its right, a mic at the mouth', () => {
    const at = (how: HoldHow, u = 1200) => playPose('strings', u, PLAY_MS, 0, poseBuf(), how);
    for (const how of ['guitar', 'violin', 'sax', 'horn', 'mic'] as const) {
      const p = at(how);
      for (const v of Object.values(p.j)) for (const x of v!) expect(Number.isFinite(x), how).toBe(true);
      // (moving with the beat)
      expect(JSON.stringify(at(how, 1200)), how).not.toBe(JSON.stringify(at(how, 1390)));
    }
    // the guitar: the left arm raised out further than the strumming right, which hangs by the hip
    expect(-at('guitar').j.Arm_1_L![2]).toBeLessThan(at('guitar').j.Arm_1_R![2]);
    // the violin: both arms up forward, the head tipped to the left shoulder
    expect(at('violin').j.Arm_1_L![0]).toBeLessThan(-1);
    expect(at('violin').j.Head![1]).toBeGreaterThan(0.2);
    // the sax: the left forearm folded up further than the right
    expect(-at('sax').j.Arm_2_L![1]).toBeGreaterThan(at('sax').j.Arm_2_R![1]);
    // the mic: the right forearm folded to the mouth
    expect(at('mic').j.Arm_2_R![1]).toBeGreaterThan(1.7);
    // every held instrument says how; the guitars and the winds turned in the hands, a mic in one hand
    for (const [code, h] of Object.entries(HELD_PLAY)) {
      expect(['guitar', 'violin', 'sax', 'horn', 'mic'], code).toContain(h.how);
      expect(!!h.one, code).toBe(h.how === 'mic');
      if (h.how !== 'mic') expect(h.turn, code).toBeDefined();
    }
  });
});
