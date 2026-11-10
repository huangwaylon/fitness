// The museum's named spots and its visitors' places (museum/spots.ts): every one on open floor with everything on
// show, a walk from the door to each; the visitors' in their own rooms, 4-8 a room, clear of the doorways and the
// carpets, a chatting pair face to face.
import { describe, expect, test } from 'vitest';
import { CARPETS, ENTRANCE, OPENINGS, ROOM_IDS, inRect, navOf, roomIdAt, walkPath, walkable } from './plan.ts';
import { PITCH, PORTRAIT, enter, framingOf, project } from './camera.ts';
import { TANKS } from './tanks.ts';
import { SEA_TANKS } from './seaTanks.ts';
import { LINGER, SPOTS, VISITOR_POINTS, VISITOR_ROOMS, allBlocks, spot } from './spots.ts';
import { MAX_IN, MAX_ROOM, crowdOf, usablePoints } from './visitors.ts';
import { BENCHES, benchSeats } from './seats.ts';

const g = navOf(allBlocks());

describe('the named spots', () => {
  test('each on open floor with everything on show, a walk from the door to it (a bench’s seat aside: on the bench)', () => {
    const bad = [...SPOTS].filter(([k, p]) => !k.startsWith('bench:') && (!walkable(g, ...p) || (p !== ENTRANCE && !walkPath(g, ENTRANCE, p).length))).map(([k, p]) => `${k} ${p}`);
    expect(bad).toEqual([]);
  });
  test('every room’s middle and way in, every bench’s seats, every tank', () => {
    for (const r of ROOM_IDS) expect(roomIdAt(...spot(`room:${r}`)), r).toBe(r);
    for (const o of OPENINGS) expect(roomIdAt(...spot(`in:${o.next}`)), o.next).toBe(o.next);
    for (const b of BENCHES) for (const n of [0, 1]) expect(SPOTS.has(`bench:${b.id}:${n}`)).toBe(true);
    for (const t of ['sea', 'deep', 'river', 'reef', 'pool']) expect(roomIdAt(...spot(`tank:${t}`)), t).toBe('fish');
    expect(() => spot('nowhere')).toThrow();
  });
});

describe('the ways in', () => {
  const ways = () => [['entrance', ENTRANCE] as const, ...[...SPOTS].filter(([k]) => /^in:[^:]+:/.test(k))];
  test('each clear of the tanks: 1.5 tiles from any glass, and never behind a tall one from the camera (its height’s fall on the floor toward the back)', () => {
    const fall = 1 / Math.tan((PITCH * Math.PI) / 180);
    for (const [k, [x, z]] of ways().filter(([, p]) => roomIdAt(...p) === 'fish'))
      for (const b of [...TANKS, ...SEA_TANKS].map((t) => t.box)) {
        expect(Math.max(b.x0 - x, x - b.x1, b.z0 - z, z - b.z1), `${k} by ${JSON.stringify(b)}`).toBeGreaterThanOrEqual(15);
        expect(inRect({ x0: b.x0 - 5, x1: b.x1 + 5, z0: b.z0 - b.y1 * fall - 5, z1: b.z1 + 5 }, x, z), `${k} behind ${JSON.stringify(b)}`).toBe(false);
      }
  });
  test('every bench on the screen from each way into its room; a room’s nearest 6 tiles from its first way in', () => {
    for (const b of BENCHES) {
      const f = framingOf(b.room);
      for (const [k, at] of ways().filter(([, p]) => roomIdAt(...p) === b.room)) {
        const t = enter(f, at), p = project({ x: t[0], z: t[1], pitch: PITCH, d: f.d, s: PORTRAIT }, b.x, 6, b.z)!;
        expect(p[0] > 20 && p[0] < PORTRAIT.W - 20 && p[1] > PORTRAIT.top && p[1] < PORTRAIT.H - PORTRAIT.bottom, `${b.id} from ${k}`).toBe(true);
      }
    }
    for (const room of new Set(BENCHES.map((b) => b.room).filter((r) => r !== 'hall'))) {
      const [x, z] = spot(`in:${room}`);
      expect(Math.min(...BENCHES.filter((b) => b.room === room).map((b) => Math.hypot(b.x - x, b.z - z))), room).toBeLessThanOrEqual(60);
    }
  });
});

describe('the visitors’ places', () => {
  test('4-8 a room, each in its room on open floor (a seat aside: on its bench), reached from the door', () => {
    for (const r of ROOM_IDS) {
      const n = LINGER.filter((l) => l.room === r).length;
      expect(n >= 4 && n <= 8, `${r}: ${n}`).toBe(true);
    }
    const bad = LINGER.filter((l) => l.kind !== 'sit' && (roomIdAt(l.x, l.z) !== l.room || !walkable(g, l.x, l.z) || !walkPath(g, ENTRANCE, [l.x, l.z]).length)).map((l) => `${l.room} ${l.x},${l.z}`);
    expect(bad).toEqual([]);
  });
  test('clear of the doorways (2.5 tiles) and the carpets; a pair chatting face to face, a step or so apart', () => {
    for (const l of LINGER) {
      for (const o of OPENINGS) {
        const m = (o.from + o.to) / 2, [ox, oz] = o.axis === 'x' ? [o.at, m] : [m, o.at];
        expect(Math.hypot(l.x - ox, l.z - oz), `${l.room} ${l.x},${l.z}`).toBeGreaterThan(25);
      }
      for (const c of CARPETS) for (const r of c.rects) expect(inRect(r, l.x, l.z, -4), `${l.room} ${l.x},${l.z} on a carpet`).toBe(false);
    }
    const chats = LINGER.filter((l) => l.kind === 'chat');
    for (let i = 0; i < chats.length; i += 2) {
      const [a, b] = [chats[i], chats[i + 1]];
      expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeLessThan(16);
      expect(Math.abs(Math.abs(a.faceYaw - b.faceYaw) - Math.PI)).toBeLessThan(1e-9);
    }
  });
});

describe('the visitors on the real plan', () => {
  test('every place kept (none in a doorway), its id its own, a pair each other’s, a seat its bench’s', () => {
    expect(usablePoints(VISITOR_POINTS, VISITOR_ROOMS).length).toBe(VISITOR_POINTS.length);
    expect(new Set(VISITOR_POINTS.map((p) => p.id)).size).toBe(VISITOR_POINTS.length);
    const byId = new Map(VISITOR_POINTS.map((p) => [p.id, p]));
    for (const p of VISITOR_POINTS) {
      if (p.kind === 'chat') expect(byId.get(p.pair!)?.pair, p.id).toBe(p.id);
      if (p.kind === 'sit') {
        const [id, n] = p.id.split(':');
        expect(benchSeats(id)[Number(n)]?.from, p.id).toEqual(p.from);
      }
    }
    for (const r of VISITOR_ROOMS) expect(roomIdAt(...r.door), r.id).toBe(r.id);
  });
  test(`a day on the real plan: ${MAX_IN} in the museum and ${MAX_ROOM} a room at most, somebody in most rooms`, () => {
    const c = crowdOf({ rooms: VISITOR_ROOMS, points: VISITOR_POINTS, path: () => [], name: () => null });
    const seen = new Set<string>();
    for (let t = Date.UTC(2026, 10, 10, 0); t < Date.UTC(2026, 10, 10, 15); t += 30_000) {
      let all = 0;
      for (const r of ROOM_IDS) {
        const n = c.step(t, r).poses.length;
        expect(n).toBeLessThanOrEqual(MAX_ROOM);
        if (n) seen.add(r);
        all += n;
      }
      expect(all).toBeLessThanOrEqual(MAX_IN);
    }
    expect(seen.size).toBeGreaterThanOrEqual(6);
  });
});
