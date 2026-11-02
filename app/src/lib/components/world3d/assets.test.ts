import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ASSET_BUDGET_KB, ASSET_KEYS, ASSET_MODELS, assetFor } from './assets.ts';

const DIR = join(import.meta.dirname, '..', '..', '..', '..', 'static', 'room', 'world3d');
const file = (m: string) => join(DIR, `${m}.glb`);

describe('the island’s NH models (assets.json)', () => {
  it('has a file for every model, a glTF binary within its kind’s budget', () => {
    const cat = new Map(Object.values(ASSET_KEYS).map((k) => [k.m, k.cat]));
    for (const m of Object.keys(ASSET_MODELS)) {
      expect(existsSync(file(m)), m).toBe(true);
      expect(readFileSync(file(m)).subarray(0, 4).toString(), m).toBe('glTF');
      expect(statSync(file(m)).size / 1024, m).toBeLessThanOrEqual(ASSET_BUDGET_KB[cat.get(m)!]);
    }
  });

  it('stays within ~15 MB in all', () => {
    const bytes = Object.keys(ASSET_MODELS).reduce((n, m) => n + statSync(file(m)).size, 0);
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
