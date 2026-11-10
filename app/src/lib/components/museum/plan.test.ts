// The museum's plan (museum/plan.ts): its rooms, its doorways, its walls, its carpets and its walk, as invariants (no
// coordinate pinned but the hall's, which the engine's decor stands on): each room inside the relay's reach, none over
// another, each closed but for its doorways, a walk from the door to every room and every exhibit short enough to send.
import { describe, expect, test } from 'vitest';
import {
  CARPETS, DESK, ENTRANCE, HALL, HALL_H, OPENINGS, ROOMS, ROOM_IDS, WALLS, boundsOf, inOpening, inRect, nearRooms, navOf, rectsOf,
  roomHeld, roomIdAt, roomOf, walkPath, walkable, wallEnds, wingOfRoom, type Pt, type Rect, type RoomId
} from './plan.ts';
import { SPOTS, allBlocks, spot } from './spots.ts';
import { PACE } from '../rooms/view.ts';
import { LIVE_V, parseClient } from '#lib/contract/live-protocol.ts';

const len = (from: Pt, pts: Pt[]) => pts.reduce((a, p, i) => a + Math.hypot(p[0] - (i ? pts[i - 1][0] : from[0]), p[1] - (i ? pts[i - 1][1] : from[1])), 0);
const overlap = (a: Rect, b: Rect) => Math.min(a.x1, b.x1) > Math.max(a.x0, b.x0) && Math.min(a.z1, b.z1) > Math.max(a.z0, b.z0);
/** The doorway one comes into a room by (the hall: the front door). */
const doorOf = (r: RoomId) => OPENINGS.find((o) => o.next === r)!;

describe('the rooms', () => {
  test('the hall as the engine builds it, every room a portrait room 12 across (the camera shows it whole), all within ±300 (the relay keeps ±320), none over another', () => {
    expect(HALL).toEqual({ x0: -60, x1: 60, z0: -50, z1: 110 });
    const size = (id: RoomId) => ((b) => [(b.x1 - b.x0) / 10, (b.z1 - b.z0) / 10])(rectsOf(id)[0]);
    expect(Object.fromEntries(ROOM_IDS.map((id) => [id, size(id)]))).toEqual({ hall: [12, 16], bug: [12, 20], fish: [12, 20], F1: [12, 22], F2: [12, 25], F3: [12, 22], G1: [12, 20], G2: [12, 20] });
    for (const id of ROOM_IDS) expect(boundsOf(id).x1 - boundsOf(id).x0, id).toBe(120);
    for (const { r } of ROOMS) for (const v of [r.x0, r.x1, r.z0, r.z1]) expect(Math.abs(v)).toBeLessThanOrEqual(300);
    for (let i = 0; i < ROOMS.length; i++) for (let k = i + 1; k < ROOMS.length; k++) expect(overlap(ROOMS[i].r, ROOMS[k].r), `${ROOMS[i].id} ${ROOMS[k].id}`).toBe(false);
    // (one rect a room: no way in beside another room, nothing round a corner)
    expect(new Set(ROOMS.map((r) => r.id)).size).toBe(ROOMS.length);
    for (const id of ROOM_IDS) expect(roomIdAt(...spot(`room:${id}`))).toBe(id);
    // (the relay's own check: every room's corners a museum walk's point, contract/live-protocol.ts MUSEUM_U)
    for (const { id, r } of ROOMS) for (const to of [[r.x0, r.z0], [r.x1, r.z1]]) expect(parseClient(JSON.stringify({ v: LIVE_V, kind: 'tent', in: true, to, sc: 'm' })), `${id} ${to}`).not.toBeNull();
  });
  test('each doorway in the wall its two rooms share, a step wide or more, none on in a front wall; any room two doorways from the hall at most (F3 off the bug garden)', () => {
    for (const o of OPENINGS) {
      expect(o.to - o.from, `${o.room}>${o.next}`).toBeGreaterThanOrEqual(24);
      for (const id of [o.room, o.next]) {
        const touches = rectsOf(id).some((r) => (o.axis === 'x' ? (r.x0 === o.at || r.x1 === o.at) && r.z0 <= o.from && r.z1 >= o.to : (r.z0 === o.at || r.z1 === o.at) && r.x0 <= o.from && r.x1 >= o.to));
        expect(touches, `${o.room}>${o.next} on ${id}'s wall`).toBe(true);
      }
    }
    // (no doorway on in the front wall of the room one goes on from: the screen's foot, under the HUD)
    for (const o of OPENINGS) expect(o.axis === 'z' && rectsOf(o.room).some((r) => r.z1 === o.at), `${o.room}>${o.next}`).toBe(false);
    // (doorways from the hall, either way through: each room's count)
    const depth: Partial<Record<RoomId, number>> = { hall: 0 };
    for (let k = 0; k < 5; k++)
      for (const o of OPENINGS)
        for (const [a, b] of [[o.room, o.next], [o.next, o.room]] as const) if (depth[a] !== undefined && (depth[b] === undefined || depth[b]! > depth[a]! + 1)) depth[b] = depth[a]! + 1;
    expect(depth).toEqual({ hall: 0, bug: 1, fish: 1, F1: 1, G1: 1, F2: 2, G2: 2, F3: 2 });
  });
  test('every room closed but for its doorways (and the front door): along each rect’s edge between two rooms, or a room and outside, a wall', () => {
    const covered = (x: number, z: number) => WALLS.some((w) => (w.a[0] === w.b[0] ? x === w.a[0] && z >= Math.min(w.a[1], w.b[1]) && z <= Math.max(w.a[1], w.b[1]) : z === w.a[1] && x >= Math.min(w.a[0], w.b[0]) && x <= Math.max(w.a[0], w.b[0])));
    const gap = (x: number, z: number) => OPENINGS.some((o) => inOpening(o, x, z, 0)) || (z === HALL.z1 && Math.abs(x) < 12);
    const inside = (x: number, z: number) => ROOMS.find(({ r }) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1)?.id ?? null;
    for (const { r } of ROOMS) {
      const pts: [number, number, number, number][] = [];
      for (let t = r.x0 + 2.5; t < r.x1; t += 5) pts.push([t, r.z0, 0, 1], [t, r.z1, 0, 1]);
      for (let t = r.z0 + 2.5; t < r.z1; t += 5) pts.push([r.x0, t, 1, 0], [r.x1, t, 1, 0]);
      for (const [x, z, nx, nz] of pts) {
        const a = inside(x - nx, z - nz), b = inside(x + nx, z + nz);
        if (a !== b && !gap(x, z)) expect(covered(x, z), `${x},${z}`).toBe(true);
        if (a === b) expect(covered(x, z), `${x},${z} (no wall inside a room)`).toBe(false);
      }
    }
    for (const w of WALLS) expect(w.h).toBeGreaterThan(40);
    // the hall's own walls its height (the cornice), the rest the wings'
    for (const w of WALLS) expect(w.h === HALL_H, `${w.a} ${w.b}`).toBe(roomIdAt((w.a[0] + w.b[0]) / 2 + 1, (w.a[1] + w.b[1]) / 2 + 1) === 'hall' || roomIdAt((w.a[0] + w.b[0]) / 2 - 1, (w.a[1] + w.b[1]) / 2 - 1) === 'hall');
  });
  test('no two wall slabs overlap (their faces would share a plane and fight): each joint’s square is one slab’s', () => {
    const T = 3;
    const slab = (i: number) => {
      const w = WALLS[i], [e0, e1] = wallEnds(WALLS, i), ux = Math.sign(w.b[0] - w.a[0]), uz = Math.sign(w.b[1] - w.a[1]);
      const a = [w.a[0] - ux * e0 * (T / 2), w.a[1] - uz * e0 * (T / 2)], b = [w.b[0] + ux * e1 * (T / 2), w.b[1] + uz * e1 * (T / 2)];
      return { x0: Math.min(a[0], b[0]) - (uz ? T / 2 : 0), x1: Math.max(a[0], b[0]) + (uz ? T / 2 : 0), z0: Math.min(a[1], b[1]) - (ux ? T / 2 : 0), z1: Math.max(a[1], b[1]) + (ux ? T / 2 : 0) };
    };
    const slabs = WALLS.map((_, i) => slab(i));
    for (let i = 0; i < slabs.length; i++) for (let k = i + 1; k < slabs.length; k++) expect(overlap(slabs[i], slabs[k]), `walls ${i} and ${k}`).toBe(false);
    // a doorway's jambs free ends
    for (const o of OPENINGS) {
      const ends = o.axis === 'x' ? [[o.at, o.from], [o.at, o.to]] : [[o.from, o.at], [o.to, o.at]];
      for (const p of ends) {
        const i = WALLS.findIndex((w) => (w.a[0] === p[0] && w.a[1] === p[1]) || (w.b[0] === p[0] && w.b[1] === p[1]));
        const at = WALLS[i].a[0] === p[0] && WALLS[i].a[1] === p[1] ? 0 : 1;
        expect(wallEnds(WALLS, i)[at], `${o.room}>${o.next} ${p}`).toBe(0);
      }
    }
  });
  test('the carpets: inside their rooms, strips edge to edge (none over another), one joined run, flush to a doorway (the hall’s to its front door)', () => {
    for (const { room, rects } of CARPETS) {
      for (const r of rects) expect(rectsOf(room).some((q) => inRect(q, r.x0, r.z0) && inRect(q, r.x1, r.z1)), `${room} ${JSON.stringify(r)}`).toBe(true);
      for (let i = 0; i < rects.length; i++) for (let k = i + 1; k < rects.length; k++) expect(overlap(rects[i], rects[k]), room).toBe(false);
      const meet = (a: Rect, b: Rect) => ((a.x1 === b.x0 || b.x1 === a.x0) && Math.min(a.z1, b.z1) > Math.max(a.z0, b.z0)) || ((a.z1 === b.z0 || b.z1 === a.z0) && Math.min(a.x1, b.x1) > Math.max(a.x0, b.x0));
      const joined = new Set([0]);
      for (let k = 0; k < rects.length; k++) rects.forEach((r, i) => [...joined].some((j) => meet(rects[j], r)) && joined.add(i));
      expect(joined.size, room).toBe(rects.length);
      const flush = OPENINGS.some((o) => (o.room === room || o.next === room) && rects.some((r) => (o.axis === 'x' ? (r.x0 === o.at || r.x1 === o.at) && r.z1 > o.from && r.z0 < o.to : (r.z0 === o.at || r.z1 === o.at) && r.x1 > o.from && r.x0 < o.to)));
      expect(flush || (room === 'hall' && rects.some((r) => r.z1 === HALL.z1 && r.x0 < 0 && r.x1 > 0)), room).toBe(true);
    }
  });
});

describe('the room held (the one drawn, its music: the wing’s)', () => {
  test('at each doorway the room one came from until well through (±10), the next once past; along the doorway’s wall no flip', () => {
    for (const o of OPENINGS) {
      const m = (o.from + o.to) / 2, at = (d: number): Pt => (o.axis === 'x' ? [o.at + d, m] : [m, o.at + d]);
      const s = (o.axis === 'x' ? roomIdAt(o.at + 5, m) : roomIdAt(m, o.at + 5)) === o.next ? 1 : -1;
      for (const d of [0, 3, 6, 9]) {
        expect(roomHeld(o.room, ...at(s * d)), `${o.room}>${o.next} ${d}`).toBe(o.room);
        expect(roomHeld(o.next, ...at(s * d)), `${o.next} back ${d}`).toBe(o.next);
      }
      expect(roomHeld(o.room, ...at(s * 15))).toBe(o.next);
      expect(roomHeld(o.next, ...at(-s * 15))).toBe(o.room);
      expect(roomOf(...at(0))).toBe(o.room);
    }
    expect(wingOfRoom('F2')).toBe('fossil');
  });
  test('the rooms woken near a doorway: at the front door only the hall; by each doorway both its rooms', () => {
    expect(nearRooms(...ENTRANCE)).toEqual(['hall']);
    for (const o of OPENINGS) {
      const m = (o.from + o.to) / 2, p: Pt = o.axis === 'x' ? [o.at, m] : [m, o.at];
      expect(nearRooms(...p)).toEqual(expect.arrayContaining([o.room, o.next]));
    }
    expect(nearRooms(...spot('room:F3'))).not.toContain('F1');
    expect(nearRooms(...spot('room:F2'))).not.toContain('bug');
  });
});

describe('the walk (everything on show)', () => {
  const g = navOf([...allBlocks()]);
  test('from the door into every room, every leg on open floor, round the walls; ten points at most (the live walk sends ten: MuseumRoom)', () => {
    for (const id of ROOM_IDS) {
      const to = spot(`room:${id}`), p = walkPath(g, ENTRANCE, to);
      expect(p.length, id).toBeGreaterThan(0);
      expect(Math.hypot(p.at(-1)![0] - to[0], p.at(-1)![1] - to[1]), id).toBeLessThan(1);
      for (let i = 0; i < p.length; i++) {
        const a = i ? p[i - 1] : ENTRANCE, b = p[i];
        // (sampled off the grid's corners: a leg may pass a closed cell's corner exactly)
        for (let t = 0.013; t <= 1; t += 0.031) expect(walkable(g, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t), `${id} ${a} → ${b} at ${t.toFixed(2)}`).toBe(true);
      }
    }
    // (any walk the screen may send: a tap in my room, or on a doorway to the next (a hidden room's floor walks to its
    // doorway: engine.ts), from anywhere in the room (its spots) to any spot in it or the next one's way in; `via` its
    // points but the last)
    const spots = [...SPOTS].filter(([k]) => !k.startsWith('bench:'));
    let most = 0, worst = '';
    for (const id of ROOM_IDS) {
      const mine = spots.filter(([, p]) => roomIdAt(...p) === id);
      const goals = [...mine, ...OPENINGS.filter((o) => o.room === id).map((o) => [`in:${o.next}:${o.room}`, spot(`in:${o.next}:${o.room}`)] as const)];
      for (const [, from] of mine) for (const [k, to] of goals) {
        const n = walkPath(g, from, to).length - 1;
        if (n > most) (most = n), (worst = `${from} → ${k}`);
      }
    }
    expect(most, worst).toBeLessThanOrEqual(10);
  });
  test('in each room, from its nearest doorway to the front of three exhibits in four within 4 seconds’ walk, any within 6 (a room 22 deep from its one door; the hall’s from the front door)', () => {
    const slow: string[] = [];
    let n = 0, four = 0;
    for (const [k, to] of SPOTS) {
      if (k.startsWith('bench:') || k.startsWith('room:') || k === 'entrance') continue;
      const room = roomIdAt(...to)!, ways = room === 'hall' ? [ENTRANCE] : OPENINGS.filter((o) => o.next === room || o.room === room).map((o) => spot(`in:${room}:${o.next === room ? o.room : o.next}`));
      const s = Math.min(...ways.map((from) => len(from, walkPath(g, from, to)))) / PACE;
      n++;
      if (s <= 4) four++;
      if (s > 6) slow.push(`${k} ${s.toFixed(1)} s`);
    }
    expect(slow).toEqual([]);
    expect(four / n).toBeGreaterThan(0.75);
  });
  test('walls and what stands on the floor keep a walker off; a tap there goes to the nearest open point', () => {
    expect(walkable(g, HALL.x1, -30)).toBe(false);
    expect(walkable(g, 0, HALL.z1 - 1)).toBe(false);
    expect(walkable(g, 0, (DESK.z0 + DESK.z1) / 2)).toBe(false);
    // (the grid round every room: the far corners walkable)
    for (const id of ROOM_IDS) for (const r of rectsOf(id)) expect(walkable(navOf(), r.x0 + 8, r.z1 - 8), id).toBe(true);
    expect(walkPath(g, ENTRANCE, ENTRANCE)).toEqual([]);
    expect(doorOf('F3').room).toBe('bug');
  });
});
