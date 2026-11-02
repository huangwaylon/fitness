import { describe, expect, it } from 'vitest';
import { DOOR_TILES, HALF, ROOM, TILE, isWallItem, wallSnap, wallSpot, wallSteps, wallWhy, blocked, centreOf, clampIn, isSmall, isSurface, nearestFree, placeWhy, resolve, slotTaken, slotToTile, snapTo, surfaceAt, tileToSlot, tilesOf, walkPath, type Spot } from './grid.ts';
import { ITEMS, STARTER, footprint } from './items.ts';

const furniture = STARTER.filter((c) => !ITEMS[c].rug);
const rugs = STARTER.filter((c) => ITEMS[c].rug);
/** A starter piece of footprint w × d. */
const sized = (w: number, d: number) => furniture.find((c) => ITEMS[c].w === w && ITEMS[c].d === d)!;
const bed = sized(2, 2), one = sized(1, 1), long = sized(2, 1);

describe('the room', () => {
  it('is NH’s largest: the main room fully expanded, 8 × 8 tiles of 10 model units, the door in the front’s middle', () => {
    expect(ROOM).toBe(8);
    expect(TILE).toBe(10);
    expect(HALF).toBe(40);
    expect(DOOR_TILES).toEqual([[3, 7], [4, 7]]);
  });

  it('a piece covers its footprint’s tiles, turned a quarter at a time', () => {
    expect(tilesOf({ item: long, x: 2, z: 3, f: 0 })).toEqual([[2, 3], [3, 3]]);
    expect(tilesOf({ item: long, x: 2, z: 3, f: 1 })).toEqual([[2, 3], [2, 4]]);
    expect(footprint(long, 3)).toEqual([1, 2]);
    expect(centreOf({ item: bed, x: 0, z: 0, f: 0 })).toEqual([-30, -30]);
  });

  it('snaps a point to the footprint that centres there, inside the room', () => {
    expect(snapTo(one, 0, 0.1, 0.1)).toEqual([4, 4]);
    expect(snapTo(bed, 0, 0, 0)).toEqual([3, 3]);
    expect(snapTo(bed, 0, 100, -100)).toEqual([6, 0]);
  });
});

describe('placing', () => {
  const room: Spot[] = [{ id: 'a', item: bed, x: 0, z: 0, f: 0 }, { id: 'r', item: rugs[0], x: 1, z: 1, f: 0 }];

  it('inside the room, off the door’s tiles, not over another piece', () => {
    expect(placeWhy(room, { item: one, x: 7, z: 7, f: 0 })).toBeNull();
    expect(placeWhy(room, { item: long, x: 7, z: 0, f: 0 })).toBe('out');
    expect(placeWhy(room, { item: one, x: 3, z: 7, f: 0 })).toBe('door');
    expect(placeWhy(room, { item: one, x: 1, z: 1, f: 0 })).toBe('taken');
    // a piece moved is measured without itself
    expect(placeWhy(room, { id: 'a', item: bed, x: 1, z: 0, f: 0 })).toBeNull();
  });

  it('a rug lies under the furniture (and over the door’s tiles), never over another rug', () => {
    expect(placeWhy(room, { item: one, x: 2, z: 2, f: 0 })).toBeNull();
    const [w, d] = footprint(rugs[1], 0);
    expect(placeWhy(room, { item: rugs[1], x: 1, z: 1, f: 0 })).toBe('rug');
    expect(placeWhy([], { item: rugs[1], x: Math.max(0, 4 - Math.floor(w / 2)), z: ROOM - d, f: 0 })).toBeNull();
  });

  it('finds the free spot nearest a point, none in a full room', () => {
    expect(nearestFree(room, one, 0, -22, -35)).toEqual([2, 0]);
    const full: Spot[] = [];
    for (let x = 0; x < ROOM; x++) for (let z = 0; z < ROOM; z++) if (!DOOR_TILES.some(([a, b]) => a === x && b === z)) full.push({ id: `p${x}${z}`, item: one, x, z, f: 0 });
    expect(nearestFree(full, one, 0, 0, 0)).toBeNull();
  });
});

describe('walking', () => {
  it('blocks the furniture’s half-tile cells, never a rug’s', () => {
    const b = blocked([{ item: bed, x: 0, z: 0, f: 0 }, { item: rugs[0], x: 3, z: 3, f: 0 }]);
    expect(b.reduce((s, v) => s + v, 0)).toBe(16);
  });

  it('keeps off the walls', () => {
    expect(clampIn([-50, 60])).toEqual([-37, 37]);
  });

  it('goes straight across an empty room, round a piece in the way, and stops short of one tapped under', () => {
    expect(walkPath([], [-30, 30], [30, 30])).toEqual([[30, 30]]);
    const wall: Spot[] = [0, 1, 2, 3, 4, 5].map((x) => ({ item: one, x, z: 4, f: 0 as const }));
    const way = walkPath(wall, [-30, 30], [-30, -30]);
    expect(way.at(-1)).toEqual([-30, -30]);
    expect(way.length).toBeGreaterThan(1);
    // every leg clear of the row of pieces (z 0…10 from x −40 to 20)
    let a: readonly [number, number] = [-30, 30];
    for (const p of way) {
      for (let k = 0; k <= 20; k++) {
        const x = a[0] + ((p[0] - a[0]) * k) / 20, z = a[1] + ((p[1] - a[1]) * k) / 20;
        expect(x > 20 || z < 0 || z > 10, `${x},${z}`).toBe(true);
      }
      a = p;
    }
    const under = walkPath([{ item: bed, x: 3, z: 3, f: 0 }], [-30, 30], [0, 0]);
    const end = under.at(-1)!;
    expect(Math.max(Math.abs(end[0]), Math.abs(end[1]))).toBeGreaterThanOrEqual(10);
  });

  it('is already there: no way at all', () => {
    expect(walkPath([], [0, 0], [0.2, 0.1])).toEqual([]);
  });
});

describe('surfaces (NH\'s table tops)', () => {
  const table = 'f4054'; // the rattan low table, 2 × 1
  const lamp = 'f4050'; // the rattan table lamp: small
  it('the starter set has tables to put things on and small things to put there', () => {
    expect(isSurface(table) && isSmall(lamp)).toBe(true);
    expect(isSmall(table) || isSurface(lamp)).toBe(false);
  });

  it('a slot is a tile of the piece’s own footprint, turned with it', () => {
    const t: Spot = { id: 't', item: table, x: 2, z: 3, f: 0 };
    expect([slotToTile(t, 0, 0), slotToTile(t, 1, 0)]).toEqual([[2, 3], [3, 3]]);
    const turned: Spot = { ...t, f: 1 };
    // turned a quarter it covers (2, 3) and (2, 4): its two slots land there, in some order, and map back
    const tiles = [slotToTile(turned, 0, 0), slotToTile(turned, 1, 0)].sort();
    expect(tiles).toEqual([[2, 3], [2, 4]]);
    for (const [sx, sz] of [[0, 0], [1, 0]] as const) expect(tileToSlot(turned, ...slotToTile(turned, sx, sz))).toEqual([sx, sz]);
    expect(tileToSlot(turned, 5, 5)).toBeNull();
  });

  it('the room: a lamp on the table goes where the table goes, on its top; its table gone, it stands on the floor', () => {
    const room = [{ id: 't', item: table, x: 2, z: 3, f: 0 as const }, { id: 'l', item: lamp, x: 1, z: 0, f: 0 as const, on: 't' }];
    const [, l] = resolve(room);
    expect(l).toMatchObject({ x: 3, z: 3, y: ITEMS[table].h, on: 't' });
    const moved = resolve([{ ...room[0], x: 5, z: 6, f: 2 }, room[1]]);
    expect(moved[1]).toMatchObject({ x: 5, z: 6, f: 2 });
    expect(resolve([room[1]])[0]).toMatchObject({ x: 1, z: 0, y: 0, on: undefined });
  });

  it('a thing on a surface blocks neither the floor nor a walk; a slot holds one', () => {
    const room: Spot[] = [{ id: 't', item: table, x: 2, z: 3, f: 0 }, { id: 'l', item: lamp, x: 1, z: 0, f: 0, on: 't' }];
    expect(placeWhy(room, { item: lamp, x: 1, z: 0, f: 0 })).toBeNull();
    expect(blocked(room).reduce((a, b) => a + b, 0)).toBe(8);
    expect(surfaceAt(room, 3, 3)?.id).toBe('t');
    expect(surfaceAt(room, 3, 3, 't')).toBeNull();
    expect(slotTaken(room, 't', 1, 0)).toBe(true);
    expect(slotTaken(room, 't', 1, 0, 'l')).toBe(false);
    expect(slotTaken(room, 't', 0, 0)).toBe(false);
  });
});

describe('on the walls (NH\'s wall-mounted things)', () => {
  const clock = 'f4037'; // the log wall-mounted clock
  it('hang on a wall\'s grid: a tile across, a step up; never over the door, off the wall or over another', () => {
    expect(isWallItem(clock)).toBe(true);
    const [u, y] = wallSpot({ item: clock, x: 2, z: 3 });
    expect(wallSnap(clock, u, y)).toEqual([2, 3]);
    expect(wallSnap(clock, -50, 999)).toEqual([0, wallSteps(clock)]);
    expect(wallWhy([], { item: clock, x: 2, z: 3, f: 0 })).toBeNull();
    expect(wallWhy([], { item: clock, x: 8, z: 0, f: 0 })).toBe('out');
    expect(wallWhy([], { item: clock, x: 3, z: 0, f: 3 })).toBe('door');
    expect(wallWhy([], { item: clock, x: 3, z: wallSteps(clock), f: 3 })).toBeNull();
    const there: Spot[] = [{ id: 'c', item: clock, x: 2, z: 3, f: 0 }];
    expect(wallWhy(there, { item: clock, x: 2, z: 3, f: 0 })).toBe('taken');
    expect(wallWhy(there, { item: clock, x: 2, z: 3, f: 1 })).toBeNull();
    expect(wallWhy(there, { id: 'c', item: clock, x: 2, z: 3, f: 0 })).toBeNull();
    // never a floor thing: no tiles blocked, no floor placement in the way
    expect(blocked(there).reduce((a, b) => a + b, 0)).toBe(0);
    expect(placeWhy(there, { item: 'f4039', x: 2, z: 3, f: 0 })).toBeNull();
  });
});
