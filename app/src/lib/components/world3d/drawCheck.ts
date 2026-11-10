// What the 3D island leaves undrawn of the layout, and why (docs/island-layout.md "The editor": `/editor/?check`):
// placeObjects as the phones run it (the island's scenery looks and the day's swaps passed in, layoutWorld.ts and
// fixedDecor.ts, as IslandScene does), each object checked for a model that exists. What's drawn elsewhere isn't
// listed: a home of NH's parts (home.ts), the bridges and stairs (structure.ts), the bulletin board (its DOM node's
// model), a named spot (never drawn), a seasonal spot out of its season.
import { art } from '#lib/art.ts';
import { isMarker, kindDef } from '#lib/layout/catalog.ts';
import type { Layout } from '#lib/layout/model.ts';
import { WHO_OF_HOME } from '#lib/layout/homes.ts';
import { worldOf } from '../island/layoutWorld.ts';
import { piecesOn, swapsOn } from '../island/fixedDecor.ts';
import { placeObjects, type Day } from './objects.ts';
import { modelBounds } from './models3d.ts';
import type { Season } from '#lib/ui-state/theme.svelte.ts';

export interface Undrawn {
  id: string;
  k: string;
  /** Its tile. */
  x: number;
  z: number;
  /** `unknown-kind` (no such kind in catalog.ts), `card` (a billboard of 2D art, not a model: drawn over what stands
   *  in front of it, and nothing once the 2D art is gone), `no-model` (nothing at all), `model-missing` (a model
   *  name with no file). */
  why: 'unknown-kind' | 'card' | 'no-model' | 'model-missing';
  /** The card's art key or the missing model's name. */
  detail?: string;
  /** The seasons it happens in. */
  seasons: Season[];
}

/** A day of each season, as a phone's: the island's scenery looks with that day's swaps. */
export function phoneDays(layout: Layout, year = 2026): (Day & { date: string })[] {
  const scenery = worldOf(layout).SCENERY;
  const days: [Season, string, string][] = [['spring', 'blossom', '04-05'], ['summer', 'summer', '07-15'], ['autumn', 'fall', '11-10'], ['winter', 'winter', '01-15']];
  return days.map(([season, foliage, md]) => {
    const date = `${year}-${md}`, sw = swapsOn(date);
    const swaps = Object.fromEntries(scenery.map((s) => [s.id, sw[s.id] ?? { key: s.key, h: s.h }]));
    return { date, season, foliage, month: Number(md.slice(0, 2)), swaps, structures: true };
  });
}

/** A day as the phones' 3D island draws it (IslandScene's scenery3 and pieces3): the island's scenery looks with the
 *  date's swaps, the fixed decor's pieces at that hour (a seasonal spot empty out of its season). The editor's
 *  preview draws the island today with it. */
export function islandDay(layout: Layout, d: { season: Season; foliage: string; month: number; date: string; hour: number; seed?: string }): Day {
  const w = worldOf(layout), sw = swapsOn(d.date);
  const swaps = Object.fromEntries(w.SCENERY.map((s) => [s.id, sw[s.id] ?? { key: s.key, h: s.h }]));
  return { season: d.season, foliage: d.foliage, month: d.month, date: d.date, swaps, pieces: piecesOn(d.date, d.hour, d.seed, w.ARCH), structures: true };
}

/** The editor's preview's day (editor/Preview3D.svelte): the island's, with what the island draws by other means as
 *  instances here (the goal trees' fruit, the bulletin board: their DOM nodes' models on the island). */
export const previewDay = (layout: Layout, d: Parameters<typeof islandDay>[1]): Day => ({ ...islandDay(layout, d), fruit: true, board: true });

/** Drawn by something else than placeObjects' instances, or never drawn. */
function elsewhere(layout: Layout, id: string, k: string, day: Day): boolean {
  if (k === 'spot' || k === 'stairs' || k === 'board' || isMarker(k)) return true;
  if (k === 'bridge') return !!day.structures;
  if (k === 'home') return layout.homes[WHO_OF_HOME[id] ?? 'A'].m !== 'campsite';
  if (k === 'beach-chair' || k === 'sandcastle' || k === 'snowboy') return !day.pieces?.some((p) => p.id === id);
  return false;
}

/** The layout's objects the 3D island doesn't draw as a model on these days (each season's, by default). */
export function undrawn(layout: Layout, days: readonly Day[] = phoneDays(layout)): Undrawn[] {
  const out = new Map<string, Undrawn>();
  const note = (u: Omit<Undrawn, 'seasons'>, s: Season) => {
    const key = `${u.id}|${u.why}|${u.detail ?? ''}`, was = out.get(key);
    if (was) {
      if (!was.seasons.includes(s)) was.seasons.push(s);
    } else out.set(key, { ...u, seasons: [s] });
  };
  for (const day of days) {
    const { insts, standins } = placeObjects(layout, day);
    const models = new Map<string, string[]>();
    for (const i of insts) (models.get(i.id) ?? models.set(i.id, []).get(i.id)!).push(i.model);
    const cards = new Map(standins.map((s) => [s.id, s.key]));
    for (const o of layout.objects.values()) {
      const at = { id: o.id, k: o.k, x: o.x, z: o.z };
      if (!kindDef(o.k)) note({ ...at, why: 'unknown-kind' }, day.season);
      else if (models.has(o.id)) {
        for (const m of models.get(o.id)!) if (!modelBounds(m)) note({ ...at, why: 'model-missing', detail: m }, day.season);
      } else if (elsewhere(layout, o.id, o.k, day)) continue;
      else if (cards.has(o.id)) {
        // (a card of art that isn't there is nothing at all: Island3D's artCard draws none)
        const key = cards.get(o.id)!;
        note(art(key) ? { ...at, why: 'card', detail: key } : { ...at, why: 'no-model', detail: `${key} (no art)` }, day.season);
      }
      else note({ ...at, why: 'no-model' }, day.season);
    }
  }
  return [...out.values()];
}

