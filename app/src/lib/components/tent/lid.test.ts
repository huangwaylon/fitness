import { describe, expect, it } from 'vitest';
import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial } from 'three';
import { LIDS, LID_MS, PARTS, SETTLE_MS, lidK, lidMoving, lidOpen, lidOpenIn, lidWant, splitLid, splitPart } from './lid.ts';
import { doorK } from './uses.ts';
import { STALL_DOOR, STALL_HIDE_MS } from '../villager3d/seats3d.ts';
import { ITEMS } from './items.ts';

describe('a lid over who lies in it: shuts once they have lain down, opens before they get up', () => {
  it('shuts after the lie-down settles, eased, then holds', () => {
    let l = lidWant(lidOpen(), true, 1000);
    expect(lidK(l, 1000)).toBe(0);
    expect(lidK(l, 1000 + SETTLE_MS)).toBe(0);
    const mid = lidK(l, 1000 + SETTLE_MS + LID_MS / 2);
    expect(mid).toBeCloseTo(0.5, 5);
    // ease in and out: slow at either end
    expect(lidK(l, 1000 + SETTLE_MS + LID_MS * 0.1)).toBeLessThan(0.1);
    expect(lidK(l, 1000 + SETTLE_MS + LID_MS * 0.9)).toBeGreaterThan(0.9);
    expect(lidK(l, 1000 + SETTLE_MS + LID_MS)).toBe(1);
    expect(lidMoving(l, 1000 + SETTLE_MS + LID_MS / 2)).toBe(true);
    expect(lidMoving(l, 1000 + SETTLE_MS + LID_MS)).toBe(false);
    // told again: the same motion (not restarted)
    expect(lidWant(l, true, 1200)).toBe(l);
    l = lidWant(l, true, 5000);
    expect(lidK(l, 5000)).toBe(1);
  });

  it('opens at once when told, the get-up waiting the whole way; from half shut, half the way', () => {
    const shut = lidWant(lidOpen(), true, 0), t = SETTLE_MS + LID_MS + 100;
    const o = lidWant(shut, false, t);
    expect(lidOpenIn(o, t)).toBe(LID_MS);
    expect(lidK(o, t + LID_MS / 2)).toBeCloseTo(0.5, 5);
    expect(lidK(o, t + LID_MS)).toBe(0);
    expect(lidOpenIn(o, t + LID_MS)).toBe(0);
    // turned back halfway through shutting
    const half = SETTLE_MS + LID_MS / 2, back = lidWant(shut, false, half);
    expect(lidK(back, half)).toBeCloseTo(0.5, 5);
    expect(lidOpenIn(back, half)).toBeCloseTo(LID_MS / 2, 5);
    // getting up before it began to shut: nothing to wait for
    const early = lidWant(shut, false, SETTLE_MS / 2);
    expect(lidOpenIn(early, SETTLE_MS / 2)).toBe(0);
    expect(lidMoving(early, SETTLE_MS / 2)).toBe(false);
  });

  it('splitLid cuts the high loose part out of the body, and puts it and the glass under the hinge', () => {
    // two loose triangles in one body mesh: the trough (low) and the hood (high), and a glass mesh
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 15, 0, 1, 16, 0, 0, 17, 1], 3));
    g.setIndex([0, 1, 2, 3, 4, 5]);
    const body = new Mesh(g, new MeshBasicMaterial({ name: 'mReBody' }));
    const glass = new Mesh(new BufferGeometry().setAttribute('position', new Float32BufferAttribute([0, 15, 0, 1, 15, 0, 0, 16, 0], 3)), new MeshBasicMaterial({ name: 'mGlass' }));
    const root = new Group().add(body, glass);
    const lid = splitLid(root, { hinge: [-9, 9], shut: -0.5, over: 14, mats: ['mGlass'], sink: 0 })!;
    expect(lid.name).toBe('lid');
    expect(lid.position.toArray()).toEqual([-9, 9, 0]);
    expect([...body.geometry.index!.array]).toEqual([0, 1, 2]);
    const cut = lid.children.find((c) => c !== glass) as Mesh;
    expect([...cut.geometry.index!.array]).toEqual([3, 4, 5]);
    expect(lid.children).toContain(glass);
    // where they were: the hinge's offset taken back
    expect(cut.position.toArray()).toEqual([9, -9, 0]);
    // nothing over the line: no lid
    expect(splitLid(new Group().add(new Mesh(new BufferGeometry().setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3)).setIndex([0, 1, 2]))), LIDS.f13508)).toBeNull();
  });

  it('every lid is on a bed in the tent, shutting down toward the trough', () => {
    for (const [code, s] of Object.entries(LIDS)) {
      expect(ITEMS[code]?.u, code).toBe('l');
      expect(s.shut).toBeLessThan(0);
      expect(s.over).toBeLessThan(ITEMS[code].h);
    }
  });
});

describe('a piece\'s parts cut out for its use (PARTS: the bench\'s bar, the stall\'s door, a canopy)', () => {
  const tri = (pts: number[]) => {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pts, 3));
    g.setIndex([...Array(pts.length / 3).keys()]);
    return g;
  };
  it('the loose parts wholly inside its box go under its group at its spot; the rest stay', () => {
    // a post up from the floor (not wholly inside), a plate inside the box
    const body = new Mesh(tri([0, 0, 0, 0.2, 0, 0, 0, 16, 0, -6, 13, -1, -6, 15, 1, -7, 14, 0]), new MeshBasicMaterial());
    const root = new Group().add(body);
    const g = splitPart(root, PARTS.f1452)!;
    expect(g.name).toBe('bar');
    expect(g.position.toArray()).toEqual([-6.276, 14.294, 0]);
    expect((g.children[0] as Mesh).geometry.index!.count).toBe(3);
    expect(body.geometry.index!.count).toBe(3);
    expect(splitPart(new Group().add(new Mesh(tri([0, 0, 0, 1, 0, 0, 0, 1, 0]), new MeshBasicMaterial())), PARTS.f1452)).toBeNull();
  });
  it('a door welded to its frame: its triangles inside, one by one, under its hinge', () => {
    // one welded mesh: the panel's triangle across the front, the frame's post on the hinge's side going over the box
    const body = new Mesh(tri([-4, 1, 4.8, 4, 1, 4.8, 0, 18, 4.8, 4, 18, 4.8, 5, 19, 4.8, 5, 0, 4.8]), new MeshBasicMaterial());
    const g = splitPart(new Group().add(body), PARTS.f1235)!;
    expect(g.name).toBe('door');
    expect((g.children[0] as Mesh).geometry.index!.count).toBe(3);
    expect(PARTS.f1235.tri).toBe(true);
  });
  it('the stall\'s door: open as one goes in, held, shut behind; the one in it hidden from then', () => {
    expect(doorK(0)).toBe(0);
    expect(doorK(STALL_DOOR.open + 10)).toBe(1);
    expect(doorK(STALL_HIDE_MS - 1)).toBeGreaterThan(0);
    expect(doorK(STALL_HIDE_MS)).toBe(0);
  });
});
