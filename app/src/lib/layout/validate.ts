// What's wrong with a layout (docs/island-layout.md "Derived, never hand-made"), pure: the editor's live check (each
// issue with its tiles, so the plan can mark them) and the default's test (none). Nothing here refuses a layout: the
// record keeps whatever the members save; the phones walk what nav.ts derives from it.
import { GRID, isWater, kindOf, tierOf, idx, onGrid, type Kind } from './grid.ts';
import { doorOf, footOf, objMid, objTiles, type Layout, type Obj } from './model.ts';
import { kindDef } from './catalog.ts';
import { HOME_IDS } from './homes.ts';
import { blockBox, navOf, reachable, type LayoutNav } from './nav.ts';

type IssueCode =
  | 'off-land' | 'on-water' | 'overlap' | 'not-grass' | 'split' | 'stairs' | 'bridge' | 'door' | 'goal' | 'home' | 'unreachable' | 'pocket' | 'water-diagonal' | 'water-edge';
export interface Issue {
  code: IssueCode;
  /** An error breaks something (a walk, a door, a goal); a warning only looks wrong. */
  level: 'error' | 'warn';
  tiles: [number, number][];
  ids: string[];
  ja: string;
  en: string;
}

const kindAt = (l: Layout, c: number, r: number): Kind => (onGrid(c, r) ? kindOf(l.codes[idx(c, r)]) : 'sea');
const tierAt = (l: Layout, c: number, r: number): number => (onGrid(c, r) ? tierOf(l.codes[idx(c, r)]) : 0);

/** The box an object stands in for an overlap (u): a default one's (it stands off the grid) its block box or a small
 *  box round its middle, else its whole footprint (a hair in). */
function standBox(l: Layout, o: Obj): { x0: number; x1: number; y0: number; y1: number } {
  if (o.n) {
    const b = blockBox(l, o);
    if (b) return b;
    const [x, z] = objMid(l, o);
    return { x0: x - 6, x1: x + 6, y0: z - 4, y1: z + 4 };
  }
  const [w, d] = footOf(l, o);
  const x0 = GRID.x0 + o.x * 30, y0 = GRID.z0 + o.z * 30;
  return { x0: x0 + 1, x1: x0 + w * 30 - 1, y0: y0 + 1, y1: y0 + d * 30 - 1 };
}
const solid = (o: Obj) => {
  const d = kindDef(o.k);
  return !!d && (d.block || o.k === 'bridge' || o.k === 'stairs');
};

export function validate(layout: Layout, nav: LayoutNav = navOf(layout)): Issue[] {
  const out: Issue[] = [];
  const add = (code: IssueCode, level: Issue['level'], tiles: [number, number][], ids: string[], ja: string, en: string) => out.push({ code, level, tiles, ids, ja, en });
  const objs = [...layout.objects.values()];
  for (const o of objs) {
    const def = kindDef(o.k);
    if (!def) continue;
    const tiles = objTiles(layout, o);
    const kinds = tiles.map(([c, r]) => kindAt(layout, c, r));
    if (tiles.some(([c, r]) => !onGrid(c, r)) || kinds.some((k) => k === 'sea')) {
      if (o.k !== 'bridge') add('off-land', 'error', tiles, [o.id], `${def.ja}がうみのうえ`, `${def.en} is off the land`);
      continue;
    }
    if (o.k === 'bridge') {
      const [w, d] = footOf(layout, o);
      const ends = o.f % 2 ? [[o.x, o.z], [o.x + w - 1, o.z]] : [[o.x, o.z], [o.x, o.z + d - 1]];
      const mid = tiles.filter(([c, r]) => !ends.some(([ec, er]) => ec === c && er === r));
      if (!mid.some(([c, r]) => isWater(kindAt(layout, c, r))) || ends.some(([c, r]) => isWater(kindAt(layout, c, r))) || tierAt(layout, ends[0][0], ends[0][1]) !== tierAt(layout, ends[1][0], ends[1][1]))
        add('bridge', 'error', tiles, [o.id], 'はしは みずのうえ、りょうはしが おなじたかさの りく', 'A bridge spans water, both ends on land of one tier');
      continue;
    }
    if (kinds.some((k) => isWater(k))) add('on-water', 'error', tiles, [o.id], `${def.ja}が みずのうえ`, `${def.en} stands in water`);
    const tiers = new Set(tiles.map(([c, r]) => tierAt(layout, c, r)));
    if (tiers.size > 1 && o.k !== 'stairs') add('split', 'error', tiles, [o.id], `${def.ja}が がけを またいでいる`, `${def.en} straddles a cliff`);
    if (def.on === 'grass' && kinds.some((k) => k !== 'grass')) add('not-grass', 'warn', tiles, [o.id], `${def.ja}は くさのうえに`, `${def.en} belongs on grass`);
    if (o.k === 'stairs') {
      const [w, d] = footOf(layout, o);
      const t = tierAt(layout, o.x, o.z);
      // the tiles beyond its top (f 0: behind it) one tier up, before its foot the same tier
      const top: [number, number][] = [], foot: [number, number][] = [];
      if (o.f % 2 === 0) for (let i = 0; i < w; i++) {
        top.push(o.f === 0 ? [o.x + i, o.z + d] : [o.x + i, o.z - 1]);
        foot.push(o.f === 0 ? [o.x + i, o.z - 1] : [o.x + i, o.z + d]);
      }
      else for (let j = 0; j < d; j++) {
        top.push(o.f === 1 ? [o.x - 1, o.z + j] : [o.x + w, o.z + j]);
        foot.push(o.f === 1 ? [o.x + w, o.z + j] : [o.x - 1, o.z + j]);
      }
      const land = (p: [number, number]) => !isWater(kindAt(layout, p[0], p[1]));
      if (tiers.size > 1 || !top.every((p) => land(p) && tierAt(layout, p[0], p[1]) === t + 1) || !foot.every((p) => land(p) && tierAt(layout, p[0], p[1]) === t))
        add('stairs', 'error', [...tiles, ...top], [o.id], 'さかが がけに つながっていない', 'The stairs join no cliff (their top one tier up, their foot level)');
    }
  }
  // overlaps: solid things never share ground; a flower never stands in a solid thing
  for (let i = 0; i < objs.length; i++) {
    const a = objs[i];
    if (a.k === 'spot') continue;
    const ba = standBox(layout, a);
    for (let k = i + 1; k < objs.length; k++) {
      const b = objs[k];
      if (b.k === 'spot' || (!solid(a) && !solid(b))) continue;
      // a flower may grow by stairs or a bridge's end: a structure clashes only with what blocks, or another structure
      const sa = a.k === 'bridge' || a.k === 'stairs', sb = b.k === 'bridge' || b.k === 'stairs';
      if ((sa && !sb && !kindDef(b.k)?.block) || (sb && !sa && !kindDef(a.k)?.block)) continue;
      const bb = standBox(layout, b);
      if (ba.x0 < bb.x1 && bb.x0 < ba.x1 && ba.y0 < bb.y1 && bb.y0 < ba.y1)
        add('overlap', 'error', [...objTiles(layout, a), ...objTiles(layout, b)], [a.id, b.id], `${kindDef(a.k)?.ja}と${kindDef(b.k)?.ja}が かさなっている`, `${kindDef(a.k)?.en} and ${kindDef(b.k)?.en} overlap`);
    }
  }
  // the homes: all three, each with a clear door
  for (const id of Object.values(HOME_IDS)) {
    const o = layout.objects.get(id);
    if (!o) {
      add('home', 'error', [], [id], 'いえが ない', 'A home is missing');
      continue;
    }
    const d = doorOf(layout, o);
    const at = nav.doors[id]?.at;
    if (d.tiles.some(([c, r]) => isWater(kindAt(layout, c, r)) || tierAt(layout, c, r) !== tierAt(layout, o.x, o.z)) || !at || !reachable(nav, at[0], at[1]))
      add('door', 'error', [...d.tiles, ...objTiles(layout, o)], [id], 'いえの とびらまで いけない', "A home's door can't be reached");
  }
  // what a villager uses from in front of it (the bulletin board): its front tiles clear and reachable
  for (const o of objs) {
    if (!kindDef(o.k)?.front) continue;
    const d = doorOf(layout, o);
    const at = nav.named[`front-${o.id}`];
    if (d.tiles.some(([c, r]) => isWater(kindAt(layout, c, r)) || tierAt(layout, c, r) !== tierAt(layout, o.x, o.z)) || !at || !reachable(nav, at[0], at[1]))
      add('door', 'error', [...d.tiles, ...objTiles(layout, o)], [o.id], `${kindDef(o.k)!.ja}の まえに たてない`, `Nobody can stand in front of the ${kindDef(o.k)!.en.toLowerCase()}`);
  }
  // the goal trees: one each
  for (const s of ['a', 'b'] as const) {
    const g = objs.filter((o) => o.k === 'goal-tree' && (o.s ?? 'a') === s);
    if (g.length !== 1) add('goal', 'error', g.flatMap((o) => objTiles(layout, o)), g.map((o) => o.id), g.length ? `${s === 'a' ? 'ウェイ' : 'うめ'}の もくひょうのきが ふたつ` : `${s === 'a' ? 'ウェイ' : 'うめ'}の もくひょうのきが ない`, g.length ? `A second goal tree (${s.toUpperCase()})` : `The goal tree (${s.toUpperCase()}) is missing`);
  }
  // the named spots: reachable
  for (const o of objs) {
    if (o.k !== 'spot') continue;
    const [x, z] = objMid(layout, o);
    if (!reachable(nav, x, z)) add('unreachable', 'error', objTiles(layout, o), [o.id], 'ばしょまで いけない', `The spot (${o.s}) can't be reached`);
  }
  // pockets: land nobody can walk to (a tile whose every walkable cell is off the main region)
  const pocket: [number, number][] = [];
  for (let r = 0; r < GRID.rows; r++)
    for (let c = 0; c < GRID.cols; c++) {
      if (isWater(kindAt(layout, c, r))) continue;
      let any = false, main = false;
      for (let j = 0; j < 2; j++)
        for (let i = 0; i < 2; i++) {
          const k = (r * 2 + j) * GRID.cols * 2 + c * 2 + i;
          if (nav.open[k]) {
            any = true;
            if (nav.comp[k] === nav.main) main = true;
          }
        }
      if (any && !main) pocket.push([c, r]);
    }
  if (pocket.length) add('pocket', 'warn', pocket, [], `いけない ばしょが ${pocket.length}マス`, `${pocket.length} tiles nobody can walk to`);
  // the water's shape: no diagonal-only joins, no water spilling over a cliff (a river stepping down is a fall)
  const diag: [number, number][] = [], edge: [number, number][] = [];
  for (let r = 0; r < GRID.rows; r++)
    for (let c = 0; c < GRID.cols; c++) {
      const k = kindAt(layout, c, r);
      if (k !== 'river' && k !== 'pond') continue;
      const wet = (cc: number, rr: number) => {
        const x = kindAt(layout, cc, rr);
        return x === 'river' || x === 'pond' || x === 'sea';
      };
      for (const [dc, dr] of [[1, 1], [1, -1]] as const) if (wet(c + dc, r + dr) && kindAt(layout, c + dc, r + dr) !== 'sea' && !wet(c + dc, r) && !wet(c, r + dr)) diag.push([c, r], [c + dc, r + dr]);
      const t = tierAt(layout, c, r);
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nk = kindAt(layout, c + dc, r + dr), nt = tierAt(layout, c + dc, r + dr);
        if (nt < t && !(nk === 'river' || nk === 'pond' || nk === 'sea')) edge.push([c, r]);
        if (nt < t && k === 'pond' && nk !== 'river' && nk !== 'pond') edge.push([c, r]);
      }
    }
  if (diag.length) add('water-diagonal', 'warn', diag, [], 'みずが ななめにしか つながっていない', 'Water joined only at a corner');
  if (edge.length) add('water-edge', 'warn', edge, [], 'みずが がけから こぼれる（たきは かわだけ）', 'Water spills over a cliff (only a river falls)');
  return out;
}
