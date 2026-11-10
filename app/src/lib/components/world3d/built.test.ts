// The built groups (built.ts createBuilt): what the 3D island and the editor's 3D preview both keep their homes,
// bridges, stairs and ponds with, so the two draw the same. A group per id, placed where the layout has it; built
// again only when its place changes; taken away when it's gone. (The models' loads stubbed: a home's or a bridge's
// group is the loader's; a pond's water, bed and stones are built here for real.)
import { describe, expect, test, vi } from 'vitest';
import { Group, type Object3D } from 'three';
import { defaultLayout, layoutOf } from '#lib/layout/model.ts';
import type { LayoutEntry } from '#lib/contract/layout.ts';
import { builtWants, createBuilt, type BuiltAt } from './built.ts';
import { homePlaces } from './objects.ts';
import { FAMILIES } from '#lib/layout/homes.ts';

const released = vi.hoisted(() => [] as unknown[]);
vi.mock('./home.ts', () => ({ buildHome: async () => new Group(), releaseHome: (g: unknown) => void (g && released.push(g)) }));
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

  test('a home’s parts let go of as its group goes: replaced, taken away or the scene stopped (home.ts releaseHome)', async () => {
    const placed = new Map<string, Object3D | null>();
    const built = createBuilt((id, g) => placed.set(id, g));
    built.sync(defaultLayout(), flat);
    await settle();
    const homes = [...placed].filter(([id]) => id.startsWith('home:'));
    expect(homes.length).toBeGreaterThan(0);
    released.length = 0;
    // (a smaller room: うめ's house rebuilt, the old one let go of once the new one's in)
    const [id, old] = homes.find(([id]) => id === 'home:home-B')!;
    built.sync(defaultLayout(), flat, (w) => (w === 'B' ? 4 : 8));
    await settle();
    expect(placed.get(id)).not.toBe(old);
    expect(released).toEqual([old]);
    // (every group placed: a bridge's or a pond's holds nothing, so lets go of nothing)
    built.stop();
    const groups = [...placed.values()].filter(Boolean);
    expect(released.length).toBe(1 + groups.length);
    expect(groups.every((g) => released.includes(g))).toBe(true);
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

describe('a home’s outside follows its room’s size (homes.ts exteriorOf)', () => {
  const style = (l: ReturnType<typeof defaultLayout>, room: number, who: 'B' | 'G') => homePlaces(l, () => room).find((p) => p.id === `home-${who}`)!.style;
  test('うめ’s player house: NH’s first house (PA00) for the tent’s and the first house’s rooms, its own look for the largest', () => {
    const l = defaultLayout();
    expect(style(l, 8, 'B')).toEqual(l.homes.B);
    for (const room of [4, 6]) {
      const s = style(l, room, 'B');
      expect(s.w).toBe('PA00Standard.A');
      // (its roof's colour letter, NH's first house's in the same letter)
      expect(s.r).toBe(`PA00Standard.${l.homes.B.r!.slice(-1)}`);
      expect(s.d).toBe(l.homes.B.d);
      expect(FAMILIES['wall-pa00-standard'] && FAMILIES['roof-pa00-standard']).toBeTruthy();
    }
  });
  test('a villager’s house (the guest’s) has no levels in NH: as it is at every size; the place never moves', () => {
    const l = defaultLayout();
    expect(style(l, 4, 'G')).toEqual(l.homes.G);
    const at = (room: number) => homePlaces(l, () => room).map(({ id, x, z, yaw }) => [id, x, z, yaw]);
    expect(at(4)).toEqual(at(8));
  });
  test('a smaller room rebuilds the house', async () => {
    const placed: string[] = [];
    const built = createBuilt((id) => placed.push(id));
    const l = defaultLayout();
    built.sync(l, flat, () => 8);
    await settle();
    placed.length = 0;
    built.sync(l, flat, (w) => (w === 'B' ? 6 : 8));
    await settle();
    expect(placed).toEqual(['home:home-B']);
  });
});
