// The 3D island's things registry (things3.ts): registered by id, read beside the DOM's m3 nodes, in view by the
// projector's own rule.
import { describe, expect, it, vi } from 'vitest';
import { World, type Proj3 } from '../island/camera.svelte.ts';
import { checkTwins, eachV3, figure, has3, inShot, model3, models3, thing, twinFrame, twins } from './things3.ts';
import type { At } from './engine.ts';

/** A flat camera: a world point (x, z) at (x, z) px, `lift` up the screen, a unit a px; behind it past z 2000. */
const flat = (): Proj3 => ({
  at: (x, z, lift, out) => Object.assign(out ?? ({} as At), { sx: x, sy: z - lift, k: 1, up: 1, ground: 1, depth: z < 2000 ? 100 : -1, visible: z < 2000 }),
  ground: () => null,
  horizon: () => 0,
  rev: () => 0,
  kick: vi.fn(),
  idle: () => true
});
/** A DOM node's stand-in, as much of one as World.at writes. */
const el = () => {
  const style: Record<string, string> & { setProperty(k: string, v: string | null): void } = { setProperty() {} } as never;
  const attrs = new Set<string>();
  return { style, classList: { toggle() {} }, toggleAttribute: (a: string, on: boolean) => void (on ? attrs.add(a) : attrs.delete(a)), attrs } as unknown as HTMLElement & { attrs: Set<string> };
};
const world = () => {
  const w = new World();
  w.fit(390, 844);
  w.useThree(flat());
  w.step(0);
  return w;
};

describe('things3', () => {
  it('a thing is in by its id till taken off; a later one of the id replaces it, the earlier one\'s taking off then does nothing', () => {
    const w = world();
    const off1 = thing(w, 'a', { m3: { key: 'k1' }, x: 1, z: 2 })();
    expect(has3(w, 'a')).toBe(true);
    const off2 = thing(w, 'a', { m3: { key: 'k2' }, x: 1, z: 2 })();
    off1();
    expect(models3(w).map((s) => model3(w, s).m3.key)).toEqual(['k2']);
    off2();
    expect(has3(w, 'a')).toBe(false);
    expect(models3(w)).toEqual([]);
  });

  it('read beside the old nodes: a node whose id a thing has is drawn from the thing, once', () => {
    const w = world();
    w.at({ x: 10, z: 20, m3: { key: 'old', id: 'n1' } })(el());
    w.at({ x: 30, z: 40, m3: { key: 'both', id: 'n2' } })(el());
    thing(w, 'n2', { m3: { key: 'both', id: 'n2' }, x: 30, z: 40 })();
    const ids = models3(w).map((s) => model3(w, s).id);
    expect(ids.sort()).toEqual(['n1', 'n2']);
    // (the list kept while nothing changes)
    expect(models3(w)).toBe(models3(w));
  });

  it("a thing's record: its live position when it moves, its lift, the element it was attached to (its art then hidden)", () => {
    const w = world(), node = el();
    let x = 5;
    thing(w, 'm', { m3: { key: 'k' }, x: 0, z: 100, lift: 3, live: () => [x, 120] })(node);
    const r = model3(w, models3(w)[0]);
    expect([r.x, r.z, r.lift, r.el]).toEqual([5, 120, 3, node]);
    expect(node.attrs.has('data-m3')).toBe(true);
    x = 9;
    expect(model3(w, models3(w)[0]).x).toBe(9);
  });

  it('in view by the projector\'s rule: the same as a node placed there, in and past the z window and the screen', () => {
    const w = world();
    const pts: [number, number, number, boolean][] = [];
    for (const x of [-500, -390, 0, 200, 780, 900]) for (const z of [-100, -50, 0, 400, 880, 900, 1990, 2100]) for (const free of [false, true]) pts.push([x, z, 0, free]);
    const nodes = pts.map(([x, z, lift, free]) => {
      const e = el();
      w.at({ x, z, lift, h: 10, always: free, m3: { key: 'k', id: `${x},${z},${free}` } })(e);
      return e;
    });
    w.invalidate();
    w.step(1);
    expect(nodes.length).toBe(pts.length);
    for (const s of models3(w)) {
      const r = model3(w, s), [x, z] = r.id.split(',').map(Number), free = r.id.endsWith('true');
      expect(inShot(w, x, z, 0, 10, free), r.id).toBe(r.shown);
    }
  });

  it('the twin check: off till asked; then each node and thing of one id compared, a difference named', () => {
    const w = world();
    w.at({ x: 10, z: 20, m3: { key: 'k', id: 't', yaw: 1 } })(el());
    thing(w, 't', { m3: { key: 'k', id: 't', yaw: 1 }, x: 10, z: 20 })();
    // (after the World's step, as Island3D's frame reads it)
    w.step(1);
    twinFrame(w);
    expect(twins(w)).toBeNull();
    checkTwins(w);
    twinFrame(w);
    expect(twins(w)).toEqual({ n: 1, diffs: [] });
    thing(w, 't', { m3: { key: 'k', id: 't', yaw: 2 }, x: 11, z: 20 })();
    twinFrame(w);
    expect(twins(w)!.diffs).toEqual(['t: x 10≠11, m3.yaw 1≠2']);
  });

  it("a figure by its actor: drawn instead of an old v3 node of that actor, where it is now, in view by the projector's rule", () => {
    const w = world(), v3 = (id: string, actor?: 'kk') => ({ id, actor, lift: () => 0, prone: () => false, away: () => false });
    w.at({ x: 10, z: 20, v3: v3('jack') })(el());
    w.at({ x: 30, z: 40, v3: v3('kk-slider', 'kk') })(el());
    w.step(1);
    let x = 50;
    const off = figure(w, { v3: v3('celeste'), x: 0, z: 60, live: () => [x, 70], always: true })();
    const seen = () => {
      const out: string[] = [];
      eachV3(w, (v, x, z, shown) => out.push(`${v.id}@${x},${z}${shown ? '' : ' hidden'}`));
      return out.sort();
    };
    expect(seen()).toEqual(['celeste@50,70', 'kk-slider@30,40']);
    x = 3000;
    expect(seen()).toEqual(['celeste@3000,70 hidden', 'kk-slider@30,40']);
    off();
    expect(seen()).toEqual(['jack@10,20', 'kk-slider@30,40']);
  });
});
