// The built groups (built.ts createBuilt): what the 3D island and the editor's 3D preview both keep their homes,
// bridges, stairs and ponds with, so the two draw the same. A group per id, placed where the layout has it; built
// again only when its place changes; taken away when it's gone. (The models' loads stubbed: a home's or a bridge's
// group is the loader's; a pond's water, bed and stones are built here for real.)
import { describe, expect, test, vi } from 'vitest';
import { Group, type Object3D } from 'three';
import { defaultLayout, layoutOf } from '#lib/layout/model.ts';
import type { LayoutEntry } from '#lib/contract/layout.ts';
import { builtWants, createBuilt, type BuiltAt } from './built.ts';

vi.mock('./home.ts', () => ({ buildHome: async () => new Group() }));
vi.mock('./structure.ts', async (actual) => ({ ...(await actual<typeof import('./structure.ts')>()), buildStructure: async () => new Group() }));

const flat = () => 2;
const pondAt = (x: number, at: number) => ({ who: 'A', sc: 'o', id: 't-pond', at, k: 'pond', x, z: 12, f: 0 }) as LayoutEntry;
const settle = () => new Promise((r) => setTimeout(r, 0));

describe('the built groups', () => {
  test('every home, bridge, stair and pond placed once, a pond where the layout has it; a move rebuilds only it; gone, taken away', async () => {
    const placed: [string, Object3D | null, BuiltAt | undefined][] = [];
    const built = createBuilt((id, g, at) => placed.push([id, g, at]));
    const withPond = layoutOf([pondAt(11, 1.9e12)]);
    built.sync(withPond, flat);
    await settle();
    const want = [...builtWants(withPond, flat).keys()].sort();
    expect(want).toContain('pond:t-pond');
    expect(placed.map(([id]) => id).sort()).toEqual(want);
    const ids: string[] = [];
    built.each((id) => ids.push(id));
    expect(ids.sort()).toEqual(want);
    const [, pond, at] = placed.find(([id]) => id === 'pond:t-pond')!;
    expect(pond!.children.length).toBeGreaterThan(0);
    expect(at).toMatchObject({ y: 2, yaw: 0 });

    placed.length = 0;
    built.sync(withPond, flat);
    await settle();
    expect(placed).toEqual([]);

    built.sync(layoutOf([pondAt(11, 1.9e12), pondAt(17, 1.9e12 + 1)]), flat);
    await settle();
    expect(placed.map(([id, , a]) => [id, a!.x > at!.x])).toEqual([['pond:t-pond', true]]);

    placed.length = 0;
    built.sync(defaultLayout(), flat);
    await settle();
    expect(placed).toEqual([['pond:t-pond', null, undefined]]);
  });

  test('stopped (the scene going), nothing more is placed', async () => {
    const placed: string[] = [];
    const built = createBuilt((id) => placed.push(id));
    built.sync(defaultLayout(), flat);
    built.stop();
    await settle();
    expect(placed).toEqual([]);
  });
});
