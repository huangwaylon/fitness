import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ASSET_BUDGET_KB, ASSET_KEYS, ASSET_MODELS, assetFor } from './assets.ts';

const DIR = join(import.meta.dirname, '..', '..', '..', '..', 'static', 'room', 'world3d');
/** A model's file: its own, or its pack's (assets.json `pack`: several models a GLB, a node each). */
const file = (m: string) => join(DIR, `${ASSET_MODELS[m]?.pack ?? m}.glb`);
/** A pack's members (its models), by its file. */
const PACKS = new Map<string, string[]>();
for (const [m, a] of Object.entries(ASSET_MODELS)) if (a.pack) PACKS.set(a.pack, [...(PACKS.get(a.pack) ?? []), m]);

describe('the island’s NH models (assets.json)', () => {
  it('has a file for every model, a glTF binary within its kind’s budget', () => {
    const cat = new Map(Object.values(ASSET_KEYS).map((k) => [k.m, k.cat]));
    for (const m of Object.keys(ASSET_MODELS)) {
      expect(existsSync(file(m)), m).toBe(true);
      expect(readFileSync(file(m)).subarray(0, 4).toString(), m).toBe('glTF');
      // (a pack's file shared by its members: each its share)
      const n = ASSET_MODELS[m].pack ? PACKS.get(ASSET_MODELS[m].pack!)!.length : 1;
      expect(statSync(file(m)).size / 1024 / n, m).toBeLessThanOrEqual(ASSET_BUDGET_KB[cat.get(m)!]);
    }
  });

  it('a pack holds each of its members as a node named for it, its hash the file\'s, under 400 KB', () => {
    expect([...PACKS.keys()].sort()).toEqual(['decor/camp', 'decor/camp2', 'decor/food', 'decor/gym2']);
    for (const [pack, ms] of PACKS) {
      const b = readFileSync(join(DIR, `${pack}.glb`)), json = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString()) as { scenes: { nodes: number[] }[]; nodes: { name?: string }[] };
      const names = json.scenes[0].nodes.map((i) => json.nodes[i].name);
      expect(names.sort(), pack).toEqual(ms.map((m) => m.slice(m.lastIndexOf('/') + 1)).sort());
      expect(new Set(ms.map((m) => ASSET_MODELS[m].v)).size, pack).toBe(1);
      expect(b.length / 1024, pack).toBeLessThan(400);
    }
  });

  it('stays within ~15 MB in all', () => {
    const bytes = [...new Set(Object.keys(ASSET_MODELS).map(file))].reduce((n, f) => n + statSync(f).size, 0);
    expect(bytes / 1024 / 1024).toBeLessThan(15);
  });

  it('points every key at a model, its winter look at another key', () => {
    for (const [key, k] of Object.entries(ASSET_KEYS)) {
      expect(ASSET_MODELS[k.m], key).toBeDefined();
      expect(k.s, key).toBeGreaterThan(0);
      if (k.winter) expect(ASSET_KEYS[k.winter], key).toBeDefined();
    }
    expect(assetFor('bushes/holly', true)?.m).toBe('bushes/holly-winter');
    expect(assetFor('villagers/raymond')).toBeNull();
  });
});
