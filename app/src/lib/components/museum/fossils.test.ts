// The fossil wing's exhibits (museum/fossils.ts): what's on show (the donation: anyone's first find), the skeletons'
// assembly, and where everything stands (inside the room, apart, a walk to each).
import { describe, expect, test } from 'vitest';
import { FOSSILS, FOSSIL_SETS } from '../island/fossilIds.ts';
import { findKey, type FirstFind } from '#lib/model/finds.ts';
import { FOSSIL_MODEL, PIECE_W, ROW, SPOTS, footOf, fossilsIn, fossilsOnShow, packOf, setOf, skeletons } from './fossils.ts';
import { ENTRANCE, inRect, navOf, rectsOf, walkPath, walkable, type Pt } from './plan.ts';
import M from './models.json' with { type: 'json' };

const at = (person: 'A' | 'B' | 'G', day = 4): FirstFind => ({ date: `2026-11-0${day}`, at: Date.parse(`2026-11-0${day}T09:00:00+09:00`), person });
const finds = (ids: string[], person: 'A' | 'B' | 'G' = 'A') => new Map(ids.map((id) => [findKey('fossil', id), at(person)]));

describe('what’s on show', () => {
  test('exactly the fossils anyone has found (the guest’s too), in the game’s order, each with its skeleton', () => {
    const f = new Map([...finds(['t-rex-tail', 'amber']), ...finds(['trilobite'], 'G'), [findKey('fish', 'koi'), at('B')], [findKey('item', 'famous-painting'), at('A')]]);
    const on = fossilsOnShow(f);
    expect(on.map((x) => [x.id, x.set, x.found.person])).toEqual([['amber', null, 'A'], ['trilobite', null, 'G'], ['t-rex-tail', 't-rex', 'A']]);
  });
  test('a skeleton: its pieces found in its row’s order, complete only once every piece is in', () => {
    const some = skeletons(fossilsOnShow(finds(['t-rex-tail', 't-rex-skull', 'right-ptera-wing', 'ptera-body'])));
    expect(some).toEqual([
      { set: 't-rex', pieces: ['t-rex-skull', 't-rex-tail'], complete: false },
      { set: 'ptera', pieces: ['ptera-body', 'right-ptera-wing'], complete: false }
    ]);
    const whole = skeletons(fossilsOnShow(finds([...FOSSIL_SETS['t-rex'], ...FOSSIL_SETS.diplo])));
    expect(whole.map((s) => [s.set, s.complete])).toEqual([['t-rex', true], ['diplo', true]]);
    expect(whole[1].pieces).toEqual(['diplo-skull', 'diplo-neck', 'diplo-chest', 'diplo-pelvis', 'diplo-tail', 'diplo-tail-tip']);
    expect(skeletons(fossilsOnShow(finds(['amber'])))).toEqual([]);
  });
  test('every piece of a skeleton is in its row once, the pterosaurs’ wings either side of the body', () => {
    for (const [set, ids] of Object.entries(FOSSIL_SETS)) expect([...ROW[set as keyof typeof ROW]].sort(), set).toEqual([...ids].sort());
    expect(ROW.ptera).toEqual(['left-ptera-wing', 'ptera-body', 'right-ptera-wing']);
    expect(ROW.quetzal).toEqual(['left-quetzal-wing', 'quetzal-torso', 'right-quetzal-wing']);
    expect(setOf('diplo-neck')).toBe('diplo');
    expect(setOf('amber')).toBeNull();
  });
});

describe('the models', () => {
  test('every fossil has its NH model in a pack (a skeleton’s own, the standalone ones’ one), bounds and a hash', () => {
    const models = M.models as Record<string, { pack?: string; v: string; max: number[] }>;
    expect(Object.keys(FOSSIL_MODEL).sort()).toEqual([...FOSSILS].sort());
    for (const id of FOSSILS) {
      expect(models[id]?.pack, id).toBe(packOf(id));
      expect(models[id].v).toMatch(/^[0-9a-f]{8}$/);
    }
    expect(packOf('t-rex-tail')).toBe('fossil-t-rex');
    expect(packOf('amber')).toBe('fossils');
    expect(new Set(FOSSILS.map(packOf)).size).toBe(Object.keys(FOSSIL_SETS).length + 1);
  });
});

describe('where they stand', () => {
  const ids = [...FOSSILS];
  test('every fossil has a place inside its room, a body clear of its walls; the rooms F1, F2, F3 share them out', () => {
    expect(ids.filter((id) => !SPOTS.has(id))).toEqual([]);
    for (const id of ids) {
      const r = footOf(id);
      const room = rectsOf(SPOTS.get(id)!.room)[0];
      expect(inRect(room, r.x0, r.z0, 3) && inRect(room, r.x1, r.z1, 3), id).toBe(true);
    }
  });
  test('a skeleton’s pieces side by side on one line, a base’s width apart (NH’s pieces join there)', () => {
    for (const [set, row] of Object.entries(ROW)) {
      const s = row.map((id) => SPOTS.get(id)!);
      expect(new Set(s.map((p) => p.z)).size, set).toBe(1);
      for (let i = 1; i < s.length; i++) expect(s[i].x - s[i - 1].x, set).toBeCloseTo(PIECE_W);
    }
  });
  test('no two exhibits’ floors overlap, nor touch but a skeleton’s own pieces', () => {
    for (let i = 0; i < ids.length; i++)
      for (let k = i + 1; k < ids.length; k++) {
        const a = footOf(ids[i]), b = footOf(ids[k]);
        const gap = Math.max(a.x0 - b.x1, b.x0 - a.x1, a.z0 - b.z1, b.z0 - a.z1);
        const same = setOf(ids[i]) && setOf(ids[i]) === setOf(ids[k]);
        const stands = SPOTS.get(ids[i])!.stand > 0 && SPOTS.get(ids[k])!.stand > 0;
        expect(gap, `${ids[i]} × ${ids[k]}`).toBeGreaterThanOrEqual(same ? -1e-6 : stands ? 4 : 8);
      }
  });
  test('each room’s rows 2 tiles apart, each island an aisle of 2 tiles past it to a wall (the back wall’s cases aside), the doorways’ bands clear', () => {
    for (const room of ['F1', 'F2', 'F3'] as const) {
      const r = rectsOf(room)[0], feet = fossilsIn(room).map(footOf);
      expect(feet.length, room).toBeGreaterThan(10);
      // (a row: the feet on one line)
      const rows = [...new Set(feet.map((f) => (f.z0 + f.z1) / 2))].sort((a, b) => a - b).map((z) => feet.filter((f) => Math.abs((f.z0 + f.z1) / 2 - z) < 0.01));
      const box = (fs: typeof feet) => ({ x0: Math.min(...fs.map((f) => f.x0)), x1: Math.max(...fs.map((f) => f.x1)), z0: Math.min(...fs.map((f) => f.z0)), z1: Math.max(...fs.map((f) => f.z1)) });
      rows.forEach((row, i) => {
        const b = box(row);
        if (i) expect(b.z0 - box(rows[i - 1]).z1, `${room} row ${i}`).toBeGreaterThanOrEqual(19.9);
        if (b.z0 - r.z0 > 10) expect(Math.max(b.x0 - r.x0, r.x1 - b.x1), `${room} row ${i}`).toBeGreaterThanOrEqual(20);
      });
    }
  });
  test('with every fossil in, a walk from the door reaches each one (its front, or its back by the front wall)', () => {
    const g = navOf(ids.map(footOf));
    for (const id of ids) {
      const r = footOf(id), mid = (r.x0 + r.x1) / 2, front: Pt = walkable(g, mid, r.z1 + 8) ? [mid, r.z1 + 8] : [mid, r.z0 - 8];
      expect(walkable(g, ...front), id).toBe(true);
      const p = walkPath(g, ENTRANCE, front);
      expect(p.length, id).toBeGreaterThan(0);
      expect(Math.hypot(p[p.length - 1][0] - front[0], p[p.length - 1][1] - front[1]), id).toBeLessThan(1);
    }
  });
});
