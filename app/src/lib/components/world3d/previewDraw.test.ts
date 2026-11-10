// Everything the layout can hold has a drawing in the editor's 3D preview (the user: "the 3d editor preview is
// missing a lot of things in general like pond"): every catalog kind is an instance of a real model (placeObjects, the
// preview's day), a group the island's own builders build (built.ts: the homes, bridges, stairs and ponds), K.K. on his
// stool, or one of the marks that are never drawn in 3D. A new kind with none of these fails here. (The built groups
// both scenes keep: built.test.ts; the preview's own groups in the browser: e2e/editor-preview.spec.ts.)
import { beforeAll, describe, expect, test } from 'vitest';
import { KIND_LIST } from '#lib/layout/catalog.ts';
import { defaultLayout, layoutOf, type Layout } from '#lib/layout/model.ts';
import type { LayoutEntry } from '#lib/contract/layout.ts';
import { kkSpot } from '../island/kkSlider.ts';
import { placeObjects } from './objects.ts';
import { builtWants } from './built.ts';
import { modelBounds } from './models3d.ts';
import { previewDay } from './drawCheck.ts';
import { loadGarden } from './garden.ts';

// (the garden's models, lazy on the phones: known here as an island with a fence has them)
beforeAll(() => loadGarden());

/** The visitors' and villagers' spots: marks on the ground in the もようがえ, never a thing in the world. */
const MARKS = new Set(['spot', 'plaza', 'beach-spot', 'guest-spot']);
/** A day of each season as the preview has it (its pieces at noon). */
const DAYS = [
  { season: 'spring', foliage: 'blossom', month: 4, date: '2026-04-05' },
  { season: 'summer', foliage: 'green', month: 7, date: '2026-07-15' },
  { season: 'autumn', foliage: 'fall', month: 11, date: '2026-11-10' },
  { season: 'winter', foliage: 'green', month: 1, date: '2027-01-15' }
] as const;

/** The default island with one of the kind: its own where it has one (a fixed decor's spot has its pieces by id),
 *  else one put down on the front lawn. */
function withKind(k: string): { l: Layout; id: string } {
  const d = defaultLayout(), own = [...d.objects.values()].find((o) => o.k === k);
  if (own) return { l: d, id: own.id };
  const def = KIND_LIST.find((x) => x.k === k)!;
  const op = { who: 'A', sc: 'o', id: `t-${k}`, at: 1.9e12, k, x: 11, z: 12, f: 0, ...(def.variants ? { s: def.variants[0] } : {}) } as LayoutEntry;
  return { l: layoutOf([op]), id: `t-${k}` };
}

/** How the preview draws an object on a day: its instances' models, its built group, K.K. */
function drawnAs(l: Layout, id: string, day: (typeof DAYS)[number]): string[] {
  const out: string[] = [];
  const { insts } = placeObjects(l, previewDay(l, { ...day, hour: 12 }));
  for (const i of insts) if ((i.id === id || i.id.startsWith(`${id}:`)) && modelBounds(i.model)) out.push(`model:${i.model}`);
  for (const key of builtWants(l, () => 0).keys()) if (key.endsWith(`:${id}`)) out.push(key);
  if (kkSpot(l)?.id === id) out.push('kk');
  return out;
}

describe("the editor's 3D preview", () => {
  test.each(KIND_LIST.map((d) => d.k))('draws a %s', (k) => {
    const { l, id } = withKind(k);
    const seen = DAYS.map((day) => drawnAs(l, id, day));
    if (MARKS.has(k)) return expect(seen.flat()).toEqual([]);
    // (a seasonal piece only in its season: drawn on one day of the four at least)
    expect(seen.some((s) => s.length), `${k} (${id}) has no drawing in the preview`).toBe(true);
  });

  test('a pond is its water, bed and stones (the island\'s group) and its lilies; K.K.\'s stool is the stool and him', () => {
    const p = withKind('pond'), kk = withKind('kk-stool');
    expect(drawnAs(p.l, p.id, DAYS[1])).toEqual(expect.arrayContaining([`pond:${p.id}`, 'model:proc/lily-flower']));
    expect(drawnAs(kk.l, kk.id, DAYS[1])).toEqual(['model:log-stool', 'kk']);
    // the bulletin board, the island's DOM node's model, an instance here (its winter look in winter)
    const b = withKind('board');
    expect(drawnAs(b.l, b.id, DAYS[1])).toEqual(['model:deco/bulletin-board']);
    expect(drawnAs(b.l, b.id, DAYS[3])).toEqual(['model:deco/bulletin-board-winter']);
  });
});
