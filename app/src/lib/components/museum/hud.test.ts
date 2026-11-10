// The museum's HUD helpers (hud.ts): the room chip's name (the room's plaque, word for word), what's on show in the room
// of how many it holds, the finds of the last day (NEW), and the card's dock edge.
import { describe, expect, test } from 'vitest';
import {
  DOCK_LOW, HALL_NAME, NEW_MS, TAG_MAX, cardDock, chipName, drawnIn, fingerQuad, freshFinds, freshIn, freshWings, inPoly, plaqueInView, roomOfFind, roomTally,
  roomTotal, segDist, tagsOf, unitOf, type Px
} from './hud.ts';
import { OPENINGS, PLAQUE, PLAQUE_H, PLAQUE_W, ROOM_IDS, roomIdAt } from './plan.ts';
import { BUG_IDS, FISH_IDS, PER_TANK, habitatOf, hourOf, onDisplay, tankOf, type Specimen } from './species.ts';
import { BUGS_SHOWN } from './bugShow.ts';
import { PORTRAIT, enter, framingOf, project } from './camera.ts';
import { SPOTS } from './spots.ts';
import { SPOTS as FOSSIL_SPOTS, ROW, fossilsIn } from './fossils.ts';
import { ART_SPOTS, artIn } from './art.ts';

const T = Date.UTC(2026, 10, 10, 3);
const F = (at = 0) => ({ found: { at } });
/** A fish, bug or sea creature on show (its tank or place the real one's). */
const S = (kind: 'fish' | 'bug' | 'sea', id: string, at = 0) => ({ id, kind, tank: kind === 'fish' ? tankOf(id) : kind === 'bug' ? habitatOf(id) : 'reef', size: 0, ...F(at) }) as const;

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
    const on = { specimens: [S('fish', 'koi'), S('sea', 'octopus'), S('bug', 'tarantula')],
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
  const on = { specimens: [S('fish', 'koi', T - 3_600_000), S('bug', 'tarantula', T - NEW_MS - 1)], fossils: [{ id: fossil, ...F(T - NEW_MS + 1) }], artworks: [] };
  const ids = (f: { id: string }[]) => f.map((x) => x.id);
  test('within 24 h of its first find, each with its room; older ones not; one stamped a little ahead of the clock too', () => {
    expect(freshFinds(on, T).map(({ id, room }) => ({ id, room }))).toEqual([{ id: 'koi', room: 'fish' }, { id: fossil, room: 'F2' }]);
    expect(freshFinds(on, T + NEW_MS)).toEqual([]);
    expect(ids(freshFinds(on, T - 3_600_000 - 5000))).toContain('koi');
  });
  test('only what is drawn this hour: a fish or bug off the hour’s pick isn’t counted; sea creatures, fossils, art always', () => {
    const hour = hourOf(T), fish = FISH_IDS.filter((id) => tankOf(id) === 'sea').slice(0, PER_TANK + 4).map((id) => S('fish', id, T - 60_000));
    const bugs = BUG_IDS.slice(0, BUGS_SHOWN + 8).map((id) => S('bug', id, T - 60_000));
    const all = { specimens: [...fish, ...bugs, S('sea', 'octopus', T - 60_000)], fossils: [{ id: fossil, ...F(T - 60_000) }], artworks: [] };
    const shown = new Set([...onDisplay(fish as unknown as Specimen[], hour).values()].flat().map((s) => s.id)), drawn = drawnIn(all, hour);
    const f = ids(freshFinds(all, T, { hour }));
    expect(f.filter((id) => fish.some((x) => x.id === id)).sort()).toEqual([...shown].sort());
    expect(f.filter((id) => bugs.some((x) => x.id === id)).length).toBeLessThanOrEqual(BUGS_SHOWN);
    expect(f.filter((id) => bugs.some((x) => x.id === id)).every((id) => drawn.has(id))).toBe(true);
    expect(f).toContain('octopus');
    expect(f).toContain(fossil);
  });
  test('one looked at on this phone (its card opened) is no longer new', () => {
    expect(ids(freshFinds(on, T, { seen: { koi: T - 3_600_000 } }))).toEqual([fossil]);
    expect(ids(freshFinds(on, T, { seen: { tarantula: T } }))).toEqual(['koi', fossil]);
  });
  test('a tank with more than three new: one tag on the tank with them all; three or fewer, a tag each', () => {
    const sea = FISH_IDS.filter((id) => tankOf(id) === 'sea'), at = T - 60_000;
    const many = freshFinds({ specimens: sea.slice(0, TAG_MAX + 1).map((id) => S('fish', id, at)), fossils: [{ id: fossil, ...F(at) }], artworks: [] }, T);
    expect(tagsOf(many)).toEqual([{ key: 'case:sea', room: 'fish', ids: sea.slice(0, TAG_MAX + 1), tank: 'sea' }, { key: unitOf(many.find((x) => x.id === fossil)!), room: 'F2', ids: [fossil] }]);
    const few = freshFinds({ specimens: sea.slice(0, TAG_MAX).map((id) => S('fish', id, at)), fossils: [], artworks: [] }, T);
    expect(tagsOf(few).map((t) => t.key)).toEqual(sea.slice(0, TAG_MAX));
  });
  test('the chip’s count: the room’s, the hall the museum’s; the wings with one for the hall’s plaques', () => {
    const f = freshFinds(on, T);
    expect(freshIn('fish', f)).toBe(1);
    expect(freshIn('bug', f)).toBe(0);
    expect(freshIn('F2', f)).toBe(1);
    expect(freshIn('hall', f)).toBe(2);
    expect([...freshWings(f)].sort()).toEqual(['fish', 'fossil']);
  });
  test('a skeleton’s new pieces: one tag over the set and one on the chip; a standalone fossil its own', () => {
    const at = T - 60_000, pieces = ROW['t-rex'], lone = [...FOSSIL_SPOTS.keys()].find((id) => !Object.values(ROW).flat().includes(id))!;
    const f = freshFinds({ specimens: [], fossils: [...pieces, lone].map((id) => ({ id, ...F(at) })), artworks: [] }, T);
    const room = FOSSIL_SPOTS.get(pieces[0])!.room;
    expect(tagsOf(f).filter((t) => t.key.startsWith('set:'))).toEqual([{ key: 'set:t-rex', room, ids: [...pieces] }]);
    expect(tagsOf(f).map((t) => t.key)).toContain(lone);
    expect(tagsOf(f)).toHaveLength(2);
    expect(freshIn('hall', f)).toBe(2);
    expect(freshIn(room, f)).toBe(tagsOf(f).filter((t) => t.room === room).length);
    expect(new Set(f.filter((x) => pieces.includes(x.id)).map(unitOf))).toEqual(new Set(['set:t-rex']));
  });
});

describe('the doorways: their plaques and taps', () => {
  test('a plaque naming the hall (the chip’s word) over every way back to it, whole on the screen from the way in', () => {
    const exits = OPENINGS.filter((o) => o.room === 'hall');
    expect(exits.length).toBeGreaterThanOrEqual(4);
    for (const o of exits) {
      const at = SPOTS.get(`in:${o.next}:hall`)!, room = roomIdAt(...at)!, f = framingOf(room), t = enter(f, at);
      const c = { x: t[0], z: t[1], pitch: f.pitch, d: f.d, s: PORTRAIT }, q = plaqueInView(o, 'next');
      expect(room).toBe(o.next);
      const dx = (PLAQUE_W / 2) * Math.cos(q.yaw), dz = (PLAQUE_W / 2) * Math.sin(q.yaw);
      for (const [x, z] of [[q.x - dx, q.z + dz], [q.x + dx, q.z - dz]])
        for (const y of [q.y - PLAQUE_H / 2, q.y + PLAQUE_H / 2]) {
          const p = project(c, x, y, z)!;
          expect(p[0] >= 8 && p[0] <= PORTRAIT.W - 8 && p[1] >= 60 && p[1] <= PORTRAIT.H - 120, `${o.next} → hall at ${p.map((v) => v.toFixed(0))}`).toBe(true);
        }
    }
  });
  test('a point in a quad (any order round, even-odd), its distance to a floor line, a small plaque grown to a finger', () => {
    const q: Px[] = [[0, 0], [100, 10], [90, 60], [10, 50]];
    expect(inPoly(q, 50, 30)).toBe(true);
    expect(inPoly(q, 50, 2)).toBe(false);
    expect(inPoly(q, 95, 55)).toBe(false);
    expect(segDist(50, 30, [0, 0], [100, 0])).toBe(30);
    expect(segDist(-30, 40, [0, 0], [100, 0])).toBe(50);
    const g = fingerQuad([[10, 10], [30, 10], [30, 18], [10, 18]], 44);
    expect(Math.max(...g.map((p) => p[0])) - Math.min(...g.map((p) => p[0]))).toBe(44);
    expect(Math.max(...g.map((p) => p[1])) - Math.min(...g.map((p) => p[1]))).toBe(44);
    expect(fingerQuad(q, 44)).toEqual(q);
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
