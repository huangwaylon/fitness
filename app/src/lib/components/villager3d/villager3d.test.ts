import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import MANIFEST from './villagers.json' with { type: 'json' };
import MAP from '../../../../scripts/villagers3d-map.json' with { type: 'json' };
import { ROSTER_IDS } from '#lib/villagers/roster.ts';
import { ACTION_MS, FADE_MS, STRIDE, action, base, idle, mix, over, sit, walk, type Body } from './poses.ts';
import { BLINK, FACES, cellTransform, eyeAt, mouthAt } from './faces.ts';
import { has3d, url3d } from './manifest.ts';

const DIR = join(import.meta.dirname, '..', '..', '..', '..', 'static', 'room', 'villagers3d');
const M = MANIFEST as { villagers: Record<string, { kb: number; tris: number; h: number; v: string }>; none: Record<string, string> };
/** A villager's GLB at most (KB): a phone loads only its two or three. */
const BUDGET_KB = 100;

describe('the villagers’ 3D models (villagers.json)', () => {
  it('has a glTF binary within budget for every villager it lists', () => {
    for (const [id, e] of Object.entries(M.villagers)) {
      const f = join(DIR, `${id}.glb`);
      expect(existsSync(f), id).toBe(true);
      expect(readFileSync(f).subarray(0, 4).toString(), id).toBe('glTF');
      expect(statSync(f).size / 1024, id).toBeLessThanOrEqual(BUDGET_KB);
      expect(e.kb, id).toBeCloseTo(statSync(f).size / 1024, 0);
      expect(e.h, id).toBeGreaterThan(8);
    }
  });

  it('accounts for every villager the picker offers: a model, or why not', () => {
    for (const id of ROSTER_IDS) expect(id in M.villagers || id in M.none, id).toBe(true);
    for (const id of Object.keys(M.villagers)) expect((ROSTER_IDS as readonly string[]).includes(id), id).toBe(true);
    // (the map the converter read: a model where it found a body)
    for (const [id, row] of Object.entries(MAP as Record<string, (string | null)[]>)) expect(!!row[0], id).toBe(id in M.villagers);
    expect(Object.keys(M.villagers).length).toBeGreaterThan(400);
    // the defaults (A, B, the guest) have one
    for (const id of ['goldie', 'anchovy', 'judy']) expect(has3d(id), id).toBe(true);
  });

  it('keeps the files out of the way: no stray GLB, its hash in its address', () => {
    for (const f of readdirSync(DIR)) expect(f.replace(/\.glb$/, '') in M.villagers, f).toBe(true);
    expect(url3d('goldie', '/fitness/room/villagers3d')).toBe(`/fitness/room/villagers3d/goldie.glb?v=${M.villagers.goldie.v}`);
    expect(url3d('no-such-villager', '/')).toBeNull();
  });
});

const BODY: Body = { thigh: 2, shin: 0.8, hip: 3.2 };

describe('the villagers’ motion (poses.ts)', () => {
  it('walks in a cycle of two steps, legs and arms opposite, bouncing at each step', () => {
    const a = walk(0, 0.25, 200), b = walk(0, 0.75, 200), c = walk(0, 1.25, 200);
    expect(a.j.Leg_1_L![0]).toBeCloseTo(-a.j.Leg_1_R![0]);
    expect(a.j.Leg_1_L![0]).toBeCloseTo(-b.j.Leg_1_L![0]);
    expect(c.j.Leg_1_L![0]).toBeCloseTo(a.j.Leg_1_L![0]);
    // the left arm swings against the left leg
    expect(Math.sign(a.j.Arm_1_L![0])).toBe(-Math.sign(a.j.Leg_1_L![0]));
    // a bounce at mid-step, none as the feet pass
    expect(a.y).toBeGreaterThan(walk(0, 0, 200).y);
    // a wander swings less than a run
    expect(Math.abs(walk(0, 0.25, 90).j.Leg_1_L![0])).toBeLessThan(Math.abs(a.j.Leg_1_L![0]));
    expect(STRIDE).toBeGreaterThan(0);
  });

  it('sits with its hips down by its thigh, thighs level and shins down', () => {
    const p = sit(0, BODY);
    expect(p.y).toBeCloseTo(-BODY.thigh);
    expect(p.j.Leg_1_L![0]).toBeLessThan(-1.3);
    expect(p.j.Leg_2_L![0]).toBeGreaterThan(1.1);
  });

  it('breathes and looks about while idle, never twice the same frame a second apart', () => {
    const a = idle(0), b = idle(1000);
    expect(a.sq).not.toBeCloseTo(b.sq, 4);
    expect(JSON.stringify(idle(1234, 2))).toBe(JSON.stringify(idle(1234, 2)));
  });

  it('crossfades: mix is the first pose at 0, the second at 1, between in between', () => {
    const a = base('idle', 500, { phase: 0, speed: 0, body: BODY, seed: 0 }), b = base('sit', 500, { phase: 0, speed: 0, body: BODY, seed: 0 });
    expect(mix(a, b, 0)).toBe(a);
    expect(mix(a, b, 1)).toBe(b);
    const m = mix(a, b, 0.5);
    expect(m.y).toBeCloseTo((a.y + b.y) / 2);
    expect(m.j.Leg_1_L![0]).toBeCloseTo(((a.j.Leg_1_L?.[0] ?? 0) + b.j.Leg_1_L![0]) / 2);
  });

  it('plays an action once over the state, fading in and out', () => {
    for (const a of Object.keys(ACTION_MS) as (keyof typeof ACTION_MS)[]) {
      const T = ACTION_MS[a];
      expect(T, a).toBeGreaterThan(2 * FADE_MS);
      const mid = action(a, T / 2);
      expect(mid.w, a).toBeGreaterThan(0.9);
      if (a !== 'hop') expect(action(a, T).w, a).toBeCloseTo(0);
    }
    const b = idle(0);
    expect(over(b, action('wave', 800).p, 0)).toBe(b);
    // the wave raises the right arm (from by its side to out and up)
    const w = over(b, action('wave', 800).p, 1);
    expect(w.j.Arm_1_R![2]).toBeLessThan(0);
    // the hop leaves the ground
    expect(action('hop', ACTION_MS.hop * 0.4).p.y).toBeGreaterThan(2);
  });
});

describe('the villagers’ faces (faces.ts)', () => {
  it('blinks every few seconds, briefly, each villager on its own rhythm', () => {
    const closed = (seed: number) => Array.from({ length: 12000 }, (_, t) => eyeAt('neutral', t, seed) === BLINK.eye).filter(Boolean).length;
    // two or more blinks in 12 s, each about BLINK.ms
    expect(closed(0)).toBeGreaterThanOrEqual(2 * BLINK.ms * 0.9);
    expect(closed(0)).toBeLessThan(12000 * 0.1);
    const at = (seed: number) => Array.from({ length: 12000 }, (_, t) => t).find((t) => eyeAt('neutral', t, seed) === BLINK.eye);
    expect(at(0)).not.toBe(at(1.7));
  });

  it('keeps closed faces closed, and asleep, snores now and then', () => {
    for (let t = 0; t < 8000; t += 37) {
      expect(eyeAt('sleepy', t)).toBe(FACES.sleepy[0]);
      expect(eyeAt('happy', t)).toBe(FACES.happy[0]);
    }
    const mouths = new Set(Array.from({ length: 100 }, (_, i) => mouthAt('sleepy', i * 100)));
    expect(mouths.size).toBe(2);
    expect(mouthAt('surprised', 0)).toBe(FACES.surprised[1]);
  });

  it('shows cell i of the atlas over the texture’s own (dequantising) transform', () => {
    const id = { ox: 0, oy: 0, sx: 1, sy: 1 };
    expect(cellTransform(0, 4, 4, id)).toEqual({ ox: 0, oy: 0, sx: 0.25, sy: 0.25 });
    expect(cellTransform(6, 4, 4, id)).toEqual({ ox: 0.5, oy: 0.25, sx: 0.25, sy: 0.25 });
    const q = cellTransform(4, 3, 3, { ox: 0.03, oy: 0.06, sx: 15, sy: 15 });
    expect(q.ox).toBeCloseTo(0.01 + 1 / 3);
    expect(q.sx).toBeCloseTo(5);
  });
});
