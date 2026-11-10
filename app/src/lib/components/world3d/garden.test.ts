// The garden's models (world3d/garden.ts, garden.json): every piece a garden kind can draw is in a pack that exists, and
// the island loads none of it unless it has a fence, a crop, a garden flower or its cedars' lights (the first load
// unchanged).
import { beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import G from './garden.json' with { type: 'json' };
import { cedarLit, gardenReady, loadGarden, wantsGarden } from './garden.ts';
import { MODELS } from './models3d.ts';
import { ASSET_MODELS } from './assets.ts';
import { CROPS, CROP_STAGES, FENCES, FENCE_PARTS, FENCE_SNOW, PLANTS, PUMPKINS, VINES, isGarden } from '#lib/layout/garden.ts';
import { KIND_LIST } from '#lib/layout/catalog.ts';
import { defaultLayout, withChanges } from '#lib/layout/model.ts';

const DIR = join(import.meta.dirname, '..', '..', '..', '..', 'static', 'room', 'world3d');
const GM = G.models as Record<string, { v: string; pack: string; kb: number }>;

describe('the garden’s models (garden.json)', () => {
  it('each in a pack that exists, a node named for it, the file’s hash, the pack under 250 KB', () => {
    const packs = new Map<string, string[]>();
    for (const [m, a] of Object.entries(GM)) packs.set(a.pack, [...(packs.get(a.pack) ?? []), m]);
    for (const [pack, ms] of packs) {
      const f = join(DIR, `${pack}.glb`);
      expect(existsSync(f), pack).toBe(true);
      const b = readFileSync(f), json = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString()) as { scenes: { nodes: number[] }[]; nodes: { name?: string }[] };
      expect(json.scenes[0].nodes.map((i) => json.nodes[i].name).sort(), pack).toEqual(ms.map((m) => m.slice(m.lastIndexOf('/') + 1)).sort());
      expect(new Set(ms.map((m) => GM[m].v)).size, pack).toBe(1);
      expect(b.length / 1024, pack).toBeLessThan(250);
    }
  });
  it('has every piece a garden kind draws: each fence’s six (the hedge’s snowy six), each crop’s stages and soil, the pumpkins’ colours, the flowers, the vines’ looks, the cedar’s lights', () => {
    const want = [
      ...FENCES.flatMap(([id]) => [id, ...(FENCE_SNOW[id] ? [`${id}-snow`] : [])].flatMap((f) => FENCE_PARTS.map((p) => `fence-${f}-${p}`))),
      'crop-soil',
      ...CROPS.flatMap(([id]) => Array.from({ length: CROP_STAGES }, (_, n) => (id === 'pumpkin' && n >= 3 ? PUMPKINS.map((c) => `crop-pumpkin-${c}-${n}`) : [`crop-${id}-${n}`])).flat()),
      ...PLANTS.filter(([k]) => k !== 'vine').map(([k]) => k),
      ...VINES.flatMap((v) => [`vine-${v}`, `vine-${v}-snow`]),
      'cedar-deco', 'cedar-deco-snow'
    ].map((id) => `garden/${id}`);
    expect(Object.keys(GM).sort()).toEqual(want.sort());
    expect(KIND_LIST.filter((d) => isGarden(d.k)).length).toBe(FENCES.length + CROPS.length + PLANTS.length);
  });
  it('none of them in assets.json (the island’s first load)', () => {
    expect(Object.keys(ASSET_MODELS).filter((m) => m.startsWith('garden/'))).toEqual([]);
  });
});

describe('loading them', () => {
  it('the default island never wants them (but in its cedars’ festive weeks); a fence or a crop does', () => {
    const l = defaultLayout();
    expect(wantsGarden(l, '2026-11-10')).toBe(false);
    expect(wantsGarden(l)).toBe(false);
    expect(wantsGarden(l, '2026-12-20')).toBe([...l.objects.values()].some((o) => o.k === 'cedar'));
    for (const k of ['fence-stone', 'crop-wheat', 'gold-roses', 'vine']) expect(wantsGarden(withChanges(l, { set: [{ id: 'x', k, x: 5, z: 12, f: 0 }] }), '2026-11-10'), k).toBe(true);
  });
  it('the cedars’ lights: Dec 15 – Jan 6 (the illuminated tree’s weeks)', () => {
    expect(['2026-12-14', '2026-12-15', '2027-01-06', '2027-01-07', '2026-07-01'].map(cedarLit)).toEqual([false, true, true, false, false]);
  });
  beforeAll(() => loadGarden());
  it('once loaded, MODELS has every one', () => {
    expect(gardenReady()).toBe(true);
    for (const m of Object.keys(GM)) expect(MODELS[m]?.pack, m).toBe(GM[m].pack);
  });
});
