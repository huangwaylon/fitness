// The art gallery's exhibits (museum/art.ts, artIds.ts) and the sea creatures' tanks (seaTanks.ts): only NH's genuine
// artworks, what's on show (anyone's first find: a present's), where each hangs or stands; every sea creature's place.
import { describe, expect, test } from 'vitest';
import { findKey, type FirstFind } from '#lib/model/finds.ts';
import { ART, ART_IDS, ART_SPOTS, DAIS, PANEL_H, artIn, artOnShow, artPack, isArt, plinthOf } from './art.ts';
import { SEA_MUSEUM_MODEL, SEA_SPOTS, SEA_TANKS } from './seaTanks.ts';
import { SEA } from '../island/sea.ts';
import { onShow } from './species.ts';
import { ENTRANCE, FISH_WING, inRect, navOf, rectsOf, walkPath, walkable, type Rect } from './plan.ts';
import { allBlocks, spot } from './spots.ts';
import { waterOf, type Tank } from './tanks.ts';
import { PANELS } from './gallery.ts';
import M from './models.json' with { type: 'json' };

const models = M.models as Record<string, { pack?: string; min: number[]; max: number[] } | undefined>;
const at = (person: 'A' | 'B' | 'G'): FirstFind => ({ date: '2026-11-04', at: Date.parse('2026-11-04T09:00:00+09:00'), person });

describe('the art', () => {
  test('NH’s 43 genuine artworks, never a forgery: 30 paintings (the wild one in two halves) and 13 statues', () => {
    expect(ART.length).toBe(43);
    expect(new Set(ART_IDS).size).toBe(43);
    expect(ART.filter((a) => /Fake/.test(a.model))).toEqual([]);
    expect(ART.filter((a) => a.kind === 'painting' || a.kind === 'screen').length).toBe(30);
    expect(ART.filter((a) => a.kind === 'statue' || a.kind === 'bust').length).toBe(13);
    for (const a of ART) expect(models[a.id]?.pack, a.id).toBe(artPack(a.id));
    expect(isArt('famous-painting')).toBe(true);
    expect(isArt('froggy-chair')).toBe(false);
  });
  test('on show: each artwork anyone has had (a present’s find of kind item), the guest’s too; nothing else', () => {
    const f = new Map([[findKey('item', 'famous-painting'), at('A')], [findKey('item', 'gallant-statue'), at('G')], [findKey('item', 'froggy-chair'), at('B')], [findKey('fossil', 'amber'), at('A')]]);
    expect(artOnShow(f).map((a) => [a.id, a.found.person])).toEqual([['famous-painting', 'A'], ['gallant-statue', 'G']]);
  });
  test('each has its place in the gallery: paintings on its walls and panels, never over each other, statues on plinths apart', () => {
    expect(ART_IDS.filter((id) => !ART_SPOTS.has(id))).toEqual([]);
    for (const id of ART_IDS) {
      const s = ART_SPOTS.get(id)!;
      expect(inRect(rectsOf(s.room)[0], s.x, s.z), id).toBe(true);
    }
    // the paintings on one face: their spans along it apart
    const flat = ART.filter((a) => a.kind === 'painting');
    const span = (id: string) => {
      const s = ART_SPOTS.get(id)!, w = (models[id]!.max[0] - models[id]!.min[0]) * s.s / 2, along = s.yaw ? s.z : s.x;
      return { face: `${s.yaw}:${s.yaw ? s.x : s.z}`, a: along - w, b: along + w, top: s.y + ((models[id]!.max[1] - models[id]!.min[1]) * s.s) / 2 };
    };
    for (let i = 0; i < flat.length; i++)
      for (let k = i + 1; k < flat.length; k++) {
        const p = span(flat[i].id), q = span(flat[k].id);
        if (p.face === q.face) expect(Math.max(p.a, q.a) >= Math.min(p.b, q.b), `${flat[i].id} × ${flat[k].id}`).toBe(true);
      }
    // under the ceiling, and a panel's under its top
    for (const a of flat) expect(span(a.id).top, a.id).toBeLessThan(48);
    const feet: [string, Rect][] = ART_IDS.flatMap((id) => (plinthOf(id) ? [[id, plinthOf(id)!] as [string, Rect]] : []));
    expect(feet.length).toBe(13);
    for (const [id, r] of feet) for (const p of [...PANELS, DAIS]) expect(r.x1 <= p.x0 || r.x0 >= p.x1 || r.z1 <= p.z0 || r.z0 >= p.z1, id).toBe(true);
    for (let i = 0; i < feet.length; i++) for (let k = i + 1; k < feet.length; k++) {
      const [ia, a] = feet[i], [ib, b] = feet[k];
      expect(a.x1 <= b.x0 || b.x1 <= a.x0 || a.z1 <= b.z0 || b.z1 <= a.z0, `${ia} × ${ib}`).toBe(true);
    }
    expect(PANELS.length).toBe(12);
    // (G1 the screen and 13 paintings, 7 statues; G2 15 paintings, 6 statues; every painting faces +z)
    expect([artIn('G1').length, artIn('G2').length]).toEqual([2 + 13 + 7, 15 + 6]);
    for (const a of flat) expect(ART_SPOTS.get(a.id)!.yaw, a.id).toBe(0);
  });
  test('with everything in, a walk from the door reaches the front of each artwork (its named spot), a body clear of the panels and plinths', () => {
    const g = navOf(allBlocks());
    for (const id of ART_IDS) {
      const to = spot(`art:${id}`), p = walkPath(g, ENTRANCE, to);
      expect(walkable(g, ...to), id).toBe(true);
      expect(p.length, id).toBeGreaterThan(0);
    }
  });
  test('the panels: three low rows a room, 3 tiles between the rows, each row a panel from either wall with a 3-tile aisle between (the hero up it from the door), no painting past a panel’s ends or over its top; the statues in front of the rows', () => {
    for (const room of ['G1', 'G2'] as const) {
      const ps = PANELS.filter((p) => p.room === room), r = rectsOf(room)[0];
      const rows = [...new Set(ps.map((p) => p.z0))].sort((a, b) => a - b);
      expect(rows.length).toBe(3);
      rows.forEach((z, i) => {
        if (i) expect(z - rows[i - 1] - 3, `${room} ${i}`).toBeGreaterThanOrEqual(29.9);
        const [a, b] = ps.filter((p) => p.z0 === z).sort((p, q) => p.x0 - q.x0);
        expect(b.x0 - a.x1, `${room} ${i}`).toBeGreaterThanOrEqual(28);
        expect(b.x0 - r.x0 > 60 && a.x1 - r.x0 < 60, `${room} ${i}: the aisle up the middle`).toBe(true);
        expect([a.x0 - r.x0, r.x1 - b.x1].every((m) => m < 2), `${room} ${i}`).toBe(true);
      });
      for (const id of artIn(room).filter((id) => plinthOf(id))) expect(plinthOf(id)!.z0, id).toBeGreaterThan(Math.max(...rows) + 3);
    }
    for (const id of ART_IDS) {
      const s = ART_SPOTS.get(id)!, p = PANELS.find((q) => q.room === s.room && Math.abs(s.z - q.z1) < 1);
      if (p) expect(s.y + ((models[id]!.max[1] - models[id]!.min[1]) * s.s) / 2, id).toBeLessThanOrEqual(PANEL_H);
    }
    const on = (r: Rect & { room: string }, id: string) => {
      const s = ART_SPOTS.get(id)!, w = ((models[id]!.max[0] - models[id]!.min[0]) * s.s) / 2;
      return s.room === r.room && Math.abs(s.z - r.z1) < 1 && s.x - w >= r.x0 - 1e-6 && s.x + w <= r.x1 + 1e-6;
    };
    for (const a of ART.filter((x) => x.kind === 'painting')) {
      const s = ART_SPOTS.get(a.id)!;
      expect(PANELS.some((p) => on(p, a.id)) || Math.abs(s.z - rectsOf(s.room)[0].z0) < 2, a.id).toBe(true);
    }
  });
});

describe('the sea creatures', () => {
  test('all 40 have a place in one of the two tanks, inside its water; NH’s museum-tank models where NH has one', () => {
    expect([...SEA_SPOTS.keys()].sort()).toEqual(Object.keys(SEA).sort());
    for (const [id, s] of SEA_SPOTS) {
      const t = SEA_TANKS.find((x) => x.id === s.tank)!, w = waterOf(t as unknown as Tank);
      expect(s.x > w.x0 + s.fit / 2 - 1 && s.x < w.x1 - s.fit / 2 + 1 && s.z > w.z0 && s.z < w.z1 && s.y >= w.y0 - 1 && s.y < w.y1, id).toBe(true);
      expect(inRect(FISH_WING, s.x, s.z), id).toBe(true);
    }
    expect(Object.keys(SEA_MUSEUM_MODEL).length).toBe(12);
    for (const id of Object.keys(SEA_MUSEUM_MODEL)) expect(models[id]?.pack, id).toBe('sea-museum');
  });
  test('on show with the fish and bugs: each caught one, its tank (no hour’s pick)', () => {
    const f = new Map([[findKey('sea', 'octopus'), at('A')], [findKey('sea', 'sea-star'), at('G')], [findKey('fish', 'koi'), at('B')]]);
    expect(onShow(f).map((s) => [s.id, s.kind, s.tank])).toEqual([['koi', 'fish', 'river'], ['sea-star', 'sea', 'pool'], ['octopus', 'sea', 'reef']]);
  });
});
