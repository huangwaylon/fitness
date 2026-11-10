// The museum's HUD helpers (hud.ts): the room chip's name (the room's plaque, word for word), what's on show in the room
// of how many it holds, the finds of the last day (NEW), and the card's dock edge.
import { describe, expect, test } from 'vitest';
import { DOCK_LOW, HALL_NAME, NEW_MS, cardDock, chipName, freshFinds, freshIn, freshWings, roomOfFind, roomTally, roomTotal } from './hud.ts';
import { PLAQUE, ROOM_IDS } from './plan.ts';
import { SPOTS as FOSSIL_SPOTS, fossilsIn } from './fossils.ts';
import { ART_SPOTS, artIn } from './art.ts';

const T = Date.UTC(2026, 10, 10, 3);
const F = (at = 0) => ({ found: { at } });

describe("the room chip's name", () => {
  test('each room its doorway plaque’s, word for word (one term a room); the hall the museum’s', () => {
    expect(chipName('hall')).toBe(HALL_NAME);
    for (const r of ROOM_IDS) if (r !== 'hall') expect(chipName(r), r).toBe(PLAQUE[r]);
    expect(chipName('bug')).toBe('む し');
    expect(chipName('fish')).toBe('さ か な');
    expect(chipName('F1')).toBe('か せ き');
    expect(chipName('F2')).toBe('か せ き 2');
    expect(chipName('G1')).toBe('び じゅ つ');
  });
});

describe("the chip's count: what's on show in this room", () => {
  test('the room each exhibit is in (the sea creatures in the aquarium; a fossil or artwork by its spot)', () => {
    expect(roomOfFind('sea', 'octopus')).toBe('fish');
    expect(roomOfFind('bug', 'tarantula')).toBe('bug');
    const [fid, fs] = [...FOSSIL_SPOTS][0], [aid, as] = [...ART_SPOTS][0];
    expect(roomOfFind('fossil', fid)).toBe(fs.room);
    expect(roomOfFind('art', aid)).toBe(as.room);
    expect(roomOfFind('fossil', 'nothing')).toBeNull();
  });
  test('a room holds its own: the aquarium 120 (fish and sea creatures), the garden 80, a fossil or gallery room its spots; together NH’s whole', () => {
    expect(roomTotal('fish')).toBe(120);
    expect(roomTotal('bug')).toBe(80);
    expect(roomTotal('hall')).toBe(0);
    for (const r of ['F1', 'F2', 'F3'] as const) expect(roomTotal(r)).toBe(fossilsIn(r).length);
    expect(['F1', 'F2', 'F3'].reduce((n, r) => n + roomTotal(r as 'F1'), 0)).toBe(73);
    expect(['G1', 'G2'].reduce((n, r) => n + roomTotal(r as 'G1'), 0)).toBe(artIn('G1').length + artIn('G2').length);
  });
  test('the room’s finds of its whole, never the wing’s; the hall none', () => {
    const fossil = (room: string) => [...FOSSIL_SPOTS].find(([, s]) => s.room === room)![0];
    const on = { specimens: [{ id: 'koi', kind: 'fish', ...F() }, { id: 'octopus', kind: 'sea', ...F() }, { id: 'tarantula', kind: 'bug', ...F() }] as const,
      fossils: [{ id: fossil('F1'), ...F() }, { id: fossil('F2'), ...F() }], artworks: [] };
    expect(roomTally('fish', on)).toEqual({ found: 2, total: 120 });
    expect(roomTally('bug', on)).toEqual({ found: 1, total: 80 });
    expect(roomTally('F1', on)).toEqual({ found: 1, total: roomTotal('F1') });
    expect(roomTally('F3', on)).toEqual({ found: 0, total: roomTotal('F3') });
    expect(roomTally('hall', on)).toBeNull();
  });
});

describe('NEW: the finds of the last day', () => {
  const fossil = [...FOSSIL_SPOTS].find(([, s]) => s.room === 'F2')![0];
  const on = { specimens: [{ id: 'koi', kind: 'fish', ...F(T - 3_600_000) }, { id: 'tarantula', kind: 'bug', ...F(T - NEW_MS - 1) }] as const,
    fossils: [{ id: fossil, ...F(T - NEW_MS + 1) }], artworks: [] };
  test('within 24 h of its first find, each with its room; older ones not', () => {
    expect(freshFinds(on, T)).toEqual([{ id: 'koi', room: 'fish' }, { id: fossil, room: 'F2' }]);
    expect(freshFinds(on, T + NEW_MS)).toEqual([]);
  });
  test('the chip’s count: the room’s, the hall the museum’s; the wings with one for the hall’s plaques', () => {
    const f = freshFinds(on, T);
    expect(freshIn('fish', f)).toBe(1);
    expect(freshIn('bug', f)).toBe(0);
    expect(freshIn('F2', f)).toBe(1);
    expect(freshIn('hall', f)).toBe(2);
    expect([...freshWings(f)].sort()).toEqual(['fish', 'fossil']);
  });
});

describe("the card's dock", () => {
  const H = 852;
  test('the bottom, unless the exhibit is drawn in the lower 45 %', () => {
    expect(cardDock(100, H)).toBe('bottom');
    expect(cardDock(H * (1 - DOCK_LOW), H)).toBe('bottom');
    expect(cardDock(H * (1 - DOCK_LOW) + 1, H)).toBe('top');
    expect(cardDock(800, H)).toBe('top');
  });
  test('off screen above: bottom; no viewport yet: bottom', () => {
    expect(cardDock(-40, H)).toBe('bottom');
    expect(cardDock(500, 0)).toBe('bottom');
  });
});
