import { describe, expect, it } from 'vitest';
import { Bone, Group, Quaternion, Vector3 } from 'three';
import { DEFAULT_LOOKS } from '#lib/contract/look.ts';
import { BLINK, FACES } from '../villager3d/faces.ts';
import { idle } from '../villager3d/poses.ts';
import { rigOf } from '../villager3d/rig.ts';
import { PARTS } from './parts.ts';
import { PLAYER_EYE, PLAYER_MOUTH, playerCell } from './tune.ts';
import { partFiles } from './player3d.ts';


describe('the player faces (tune.ts)', () => {
  it("maps every villager face's cells onto the player's frames", () => {
    for (const [face, [eye, mouth]] of Object.entries(FACES)) {
      const e = playerCell('eye', eye, face as keyof typeof FACES), m = playerCell('mouth', mouth, face as keyof typeof FACES);
      expect(e, face).toBeGreaterThanOrEqual(0);
      expect(e, face).toBeLessThan(16);
      expect(m, face).toBeLessThan(9);
    }
    // the blink is the player's soft shut (2); happy ^ ^ (5) with a big grin (2)
    expect(playerCell('eye', BLINK.eye, 'neutral')).toBe(2);
    expect([playerCell('eye', FACES.happy[0], 'happy'), playerCell('mouth', FACES.happy[1], 'happy')]).toEqual([5, 2]);
    expect(Object.keys(PLAYER_EYE).length).toBeGreaterThan(5);
    expect(Object.keys(PLAYER_MOUTH).length).toBeGreaterThan(5);
  });
  it("rests on the look's own mouth, but asleep a closed smile", () => {
    expect(playerCell('mouth', 0, 'neutral', 1)).toBe(1);
    expect(playerCell('mouth', 0, 'sleepy', 1)).toBe(0);
  });
});

describe('the rig for a player (rig.ts RigOpts)', () => {
  it("turns an alias's bone and calls the kind's own after each pose", () => {
    const root = new Group(), arm = new Bone(), wrist = new Bone(), hand = new Bone(), extra = new Bone();
    arm.name = 'Arm_2_L';
    wrist.name = 'Wrist_L';
    hand.name = 'Hand_L';
    extra.name = 'Skirt_1_LF';
    root.add(arm);
    arm.add(wrist);
    wrist.add(hand);
    root.add(extra);
    let seen = 0;
    const rig = rigOf(root, { alias: { Hand_L: 'Wrist_L' }, after: (_p, turn) => { seen++; turn('Hand_L', [0, 0, 0.5]); } });
    rig.apply({ ...idle(0), j: { Hand_L: [0.3, 0, 0] } });
    expect(seen).toBe(1);
    // Hand_L's pose turned Wrist_L (then the after hook's turn), and bone() still finds the tool's socket by name
    expect(wrist.quaternion.angleTo(new Quaternion())).toBeCloseTo(0.5, 3);
    expect(hand.quaternion.angleTo(new Quaternion())).toBe(0);
    expect(rig.bone('Hand_L')).toBe(hand);
    void new Vector3();
  });
});

describe('a look\'s parts (player3d.ts partFiles)', () => {
  const keys = (look: typeof DEFAULT_LOOKS.A) => Object.values(partFiles(look)).flatMap((fs) => (fs ?? []).map((f) => f.key));
  it('names files that are there, within the budget, for both いつもの looks', () => {
    for (const look of Object.values(DEFAULT_LOOKS)) {
      const fs = Object.values(partFiles(look));
      expect(fs.every(Boolean)).toBe(true);
      const kb = fs.flat().reduce((n, f) => n + f!.at![2] / 1024, 0);
      // the body (~56 KB, once a page) and the outfit (~60 KB)
      expect(kb).toBeLessThan(170);
      expect(keys(look).some((u) => u.startsWith(`mesh/${PARTS.hair[look.hair].mesh}.glb?v=`))).toBe(true);
    }
  });
  it('wears a hat over NH\'s cut-down hair where the style has one', () => {
    const look = { ...DEFAULT_LOOKS.A, hat: 'CapHatKnitcap0' };
    expect(keys(look).some((u) => u.includes('mesh/PlayerHairCap24.glb'))).toBe(true);
  });
  it('draws a one-piece without the bottoms', () => {
    const look = { ...DEFAULT_LOOKS.B, top: 'TopsTexOnepieceAlineHLinen0' };
    expect(keys(look).some((u) => u.includes('PlayerBottomsSkirtLong'))).toBe(false);
  });
});
