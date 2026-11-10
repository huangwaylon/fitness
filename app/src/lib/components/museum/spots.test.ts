// The museum's named spots and its visitors' places (museum/spots.ts): every one on open floor with everything on
// show, a walk from the door to each; the visitors' in their own rooms, 4-8 a room, clear of the doorways and the
// carpets, a chatting pair face to face.
import { describe, expect, test } from 'vitest';
import { CARPETS, ENTRANCE, OPENINGS, ROOM_IDS, inRect, navOf, roomIdAt, walkPath, walkable } from './plan.ts';
import { LINGER, SPOTS, allBlocks, spot } from './spots.ts';
import { BENCHES } from './seats.ts';

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
