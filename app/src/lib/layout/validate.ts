// What's wrong with a layout (docs/island-layout.md "Derived, never hand-made"), pure: the editor's live check (each
// issue with its tiles, so the plan can mark them) and the default's test (none). Nothing here refuses a layout: the
// record keeps whatever the members save; the phones walk what nav.ts derives from it.
import { GRID, isWater, kindOf, tierOf, idx, onGrid, type Kind } from './grid.ts';
import { doorOf, footOf, objMid, objTiles, originOf, type Layout, type Obj } from './model.ts';
import { isMarker, kindDef } from './catalog.ts';
import { markerSpot, spotWhy, type SpotWhy } from './spots.ts';
import { HOME_IDS } from './homes.ts';
import { archTiles, blockBox, navOf, reachable, type Box, type LayoutNav } from './nav.ts';

type IssueCode =
  | 'off-land' | 'on-water' | 'overlap' | 'not-grass' | 'split' | 'stairs' | 'bridge' | 'door' | 'goal' | 'home' | 'unreachable' | 'pocket' | 'water-diagonal' | 'water-edge' | 'visitor-spot';
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

/** The tiles an object stands on: an arch's posts (a torii, a gate, a gazebo: its way through may span water, the
 *  user's 2026-11-25), else its whole footprint. */
const groundTiles = (l: Layout, o: Obj): [number, number][] => archTiles(l, o)?.posts ?? objTiles(l, o);

/** A tile box (u), a hair in. */
const tileBox = (c: number, r: number, w = 1, d = 1): Box => {
  const x0 = GRID.x0 + c * 30, y0 = GRID.z0 + r * 30;
  return { x0: x0 + 1, x1: x0 + w * 30 - 1, y0: y0 + 1, y1: y0 + d * 30 - 1 };
};
/** The boxes an object stands in for an overlap with `by` (u): a default one's (it stands off the grid) its block box
 *  or a small box round its middle; an arch's by what doesn't block (a bridge's deck, a path's flower: under it) its
 *  posts' tiles; else its whole footprint (a hair in). */
function standBoxes(l: Layout, o: Obj, by: Obj): Box[] {
  if (o.n) {
    const b = blockBox(l, o);
    if (b) return [b];
    const [x, z] = objMid(l, o);
    return [{ x0: x - 6, x1: x + 6, y0: z - 4, y1: z + 4 }];
  }
  const a = !kindDef(by.k)?.block && archTiles(l, o);
  if (a) return a.posts.map(([c, r]) => tileBox(c, r));
  const [w, d] = footOf(l, o), [ox, oz] = originOf(l, o);
  return [tileBox(ox, oz, w, d)];
}
const solid = (o: Obj) => {
  const d = kindDef(o.k);
  return !!d && (d.block || o.k === 'bridge' || o.k === 'stairs');
};

/** Whether two objects overlap as validate's `overlap` has it: solid things never share ground, a flower never stands
 *  in a solid thing, nothing stands on stairs or a bridge's deck (it'd be buried in the ramp, the deck), an arch takes
 *  only its posts' ground but from a blocking thing; the spots, the markers and the things on a table's top with nothing. */
export function overlap(layout: Layout, a: Obj, b: Obj): boolean {
  if (a.k === 'spot' || isMarker(a.k) || b.k === 'spot' || isMarker(b.k) || (!solid(a) && !solid(b))) return false;
  // (a thing on a table's top shares its table's ground: tops.ts)
  if (a.on || b.on) return false;
  const ba = standBoxes(layout, a, b), bb = standBoxes(layout, b, a);
  return ba.some((p) => bb.some((q) => p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1));
}

/** What's wrong with one object where it stands, on its own (its ground: the grid, the land, one tier, a bridge's span,
 *  the stairs' cliff); the overlaps, the doors and the walks are the island's (validate). The editor's ghost asks it
 *  too (edits.ts ghostAt), so a green ghost is a piece validate passes. */
export function objIssues(layout: Layout, o: Obj): Issue[] {
  const def = kindDef(o.k);
  if (!def) return [];
  const out: Issue[] = [];
  const tiles = objTiles(layout, o), ground = groundTiles(layout, o);
  const add = (code: IssueCode, level: Issue['level'], t: [number, number][], ja: string, en: string) => out.push({ code, level, tiles: t, ids: [o.id], ja, en });
  const kinds = ground.map(([c, r]) => kindAt(layout, c, r));
  // (an arch's way through may span the sea or a river, but never off the grid)
  if (tiles.some(([c, r]) => !onGrid(c, r)) || kinds.some((k) => k === 'sea')) add('off-land', 'error', tiles, `${def.ja}が海の上`, `${def.en} is off the land`);
  if (o.k === 'bridge') {
    const [w, d] = footOf(layout, o);
    const ends = o.f % 2 ? [[o.x, o.z], [o.x + w - 1, o.z]] : [[o.x, o.z], [o.x, o.z + d - 1]];
    const mid = tiles.filter(([c, r]) => !ends.some(([ec, er]) => ec === c && er === r));
    if (!mid.some(([c, r]) => isWater(kindAt(layout, c, r))) || ends.some(([c, r]) => isWater(kindAt(layout, c, r))) || tierAt(layout, ends[0][0], ends[0][1]) !== tierAt(layout, ends[1][0], ends[1][1]))
      add('bridge', 'error', tiles, '橋は水の上に、両端を同じ高さの陸に', 'A bridge spans water, both ends on land of one tier');
    return out;
  }
  if (kinds.some((k) => k === 'river' || k === 'pond')) add('on-water', 'error', tiles, `${def.ja}が水の上`, `${def.en} stands in water`);
  const tiers = new Set(ground.map(([c, r]) => tierAt(layout, c, r)));
  if (tiers.size > 1 && o.k !== 'stairs') add('split', 'error', tiles, `${def.ja}が崖をまたいでいる`, `${def.en} straddles a cliff`);
  if (def.on === 'grass' && kinds.some((k) => k !== 'grass')) add('not-grass', 'warn', tiles, `${def.ja}は草の上に`, `${def.en} belongs on grass`);
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
      add('stairs', 'error', [...tiles, ...top], '坂が崖につながっていない', 'The stairs join no cliff (their top one tier up, their foot level)');
  }
  return out;
}

/** The overlap issue of two objects. */
const overlapIssue = (l: Layout, a: Obj, b: Obj): Issue => ({
  code: 'overlap', level: 'error', tiles: [...objTiles(l, a), ...objTiles(l, b)], ids: [a.id, b.id],
  ja: `${kindDef(a.k)?.ja}と${kindDef(b.k)?.ja}が重なっている`, en: `${kindDef(a.k)?.en} and ${kindDef(b.k)?.en} overlap`
});

/** A piece's own errors where it stands on `l` (objIssues, and an overlap with anything else there but `skip`'s): the
 *  editor's ghost (edits.ts ghostAt), a copy's spot (duplicate, paste). */
export function placeErrors(l: Layout, o: Obj, skip: ReadonlySet<string> = new Set()): Issue[] {
  const out = objIssues(l, o).filter((i) => i.level === 'error');
  for (const b of l.objects.values()) if (b.id !== o.id && !skip.has(b.id) && overlap(l, o, b)) out.push(overlapIssue(l, o, b));
  return out;
}

/** A visitors' spot's reason in words (the editor's sheets: kanji; and English). */
function whyText(w: SpotWhy): { ja: string; en: string } {
  const d = w.k ? kindDef(w.k) : undefined, ja = w.k === 'spot' ? '住民' : d?.ja ?? '物', en = w.k === 'spot' ? 'villager' : (d?.en ?? 'thing').toLowerCase();
  switch (w.why) {
    case 'water': return { ja: '水の上です', en: 'on water' };
    case 'ground': return { ja: '草地か道ではありません', en: 'not on grass or a path' };
    case 'sand': return { ja: '砂浜ではありません', en: 'not on the sand' };
    case 'tier': return { ja: '段差があります', en: 'a step in the ground' };
    case 'unreachable': return { ja: '歩いて行けません', en: "can't be walked to" };
    case 'door': return d?.front ? { ja: `${ja}の前です`, en: `in front of the ${en}` } : { ja: '入口の前です', en: 'in front of a door' };
    case 'on': return { ja: `${ja}の上です`, en: `on the ${en}` };
    case 'beside': return { ja: `横に${ja}があります`, en: `a ${en} beside it` };
    case 'behind': return { ja: `後ろに${ja}があります`, en: `a ${en} behind it` };
    case 'front': return { ja: `前に${ja}があります`, en: `a ${en} in front of it` };
    case 'hidden': return { ja: `${ja}に隠れます`, en: `hidden by the ${en}` };
    case 'covers': return { ja: `${ja}を隠します`, en: `covers the ${en}` };
  }
}

export function validate(layout: Layout, nav: LayoutNav = navOf(layout)): Issue[] {
  const out: Issue[] = [];
  const add = (code: IssueCode, level: Issue['level'], tiles: [number, number][], ids: string[], ja: string, en: string) => out.push({ code, level, tiles, ids, ja, en });
  const objs = [...layout.objects.values()];
  for (const o of objs) out.push(...objIssues(layout, o));
  // overlaps (overlap's rule)
  for (let i = 0; i < objs.length; i++) {
    const a = objs[i];
    for (let k = i + 1; k < objs.length; k++) {
      const b = objs[k];
      if (overlap(layout, a, b)) out.push(overlapIssue(layout, a, b));
    }
  }
  // the homes: all three, each with a clear door
  for (const id of Object.values(HOME_IDS)) {
    const o = layout.objects.get(id);
    if (!o) {
      add('home', 'error', [], [id], '家がない', 'A home is missing');
      continue;
    }
    const d = doorOf(layout, o);
    const at = nav.doors[id]?.at;
    const [hx, hz] = originOf(layout, o);
    if (d.tiles.some(([c, r]) => isWater(kindAt(layout, c, r)) || tierAt(layout, c, r) !== tierAt(layout, hx, hz)) || !at || !reachable(nav, at[0], at[1]))
      add('door', 'error', [...d.tiles, ...objTiles(layout, o)], [id], '家の扉まで行けない', "A home's door can't be reached");
  }
  // the island's buildings (the museum): a clear door, as a home's
  for (const o of objs) {
    const def = kindDef(o.k);
    if (!def?.door) continue;
    const d = doorOf(layout, o);
    const at = nav.doors[o.id]?.at;
    if (d.tiles.some(([c, r]) => isWater(kindAt(layout, c, r)) || tierAt(layout, c, r) !== tierAt(layout, o.x, o.z)) || !at || !reachable(nav, at[0], at[1]))
      add('door', 'error', [...d.tiles, ...objTiles(layout, o)], [o.id], `${def.ja}の扉まで行けない`, `The ${def.en.toLowerCase()}'s door can't be reached`);
  }
  // what a villager uses from in front of it (the bulletin board): its front tiles clear and reachable
  for (const o of objs) {
    if (!kindDef(o.k)?.front) continue;
    const d = doorOf(layout, o);
    const at = nav.named[`front-${o.id}`];
    if (d.tiles.some(([c, r]) => isWater(kindAt(layout, c, r)) || tierAt(layout, c, r) !== tierAt(layout, o.x, o.z)) || !at || !reachable(nav, at[0], at[1]))
      add('door', 'error', [...d.tiles, ...objTiles(layout, o)], [o.id], `${kindDef(o.k)!.ja}の前に立てない`, `Nobody can stand in front of the ${kindDef(o.k)!.en.toLowerCase()}`);
  }
  // the goal trees: one each
  for (const s of ['a', 'b'] as const) {
    const g = objs.filter((o) => o.k === 'goal-tree' && (o.s ?? 'a') === s);
    if (g.length !== 1) add('goal', 'error', g.flatMap((o) => objTiles(layout, o)), g.map((o) => o.id), g.length ? `${s === 'a' ? 'ウェイ' : 'うめ'}の目標の木が2本` : `${s === 'a' ? 'ウェイ' : 'うめ'}の目標の木がない`, g.length ? `A second goal tree (${s.toUpperCase()})` : `The goal tree (${s.toUpperCase()}) is missing`);
  }
  // the named spots: reachable
  for (const o of objs) {
    if (o.k !== 'spot') continue;
    const [x, z] = objMid(layout, o);
    if (!reachable(nav, x, z)) add('unreachable', 'error', objTiles(layout, o), [o.id], '場所まで行けない', `The spot (${o.s}) can't be reached`);
  }
  // the visitors' spots: where they can stand now (else the island's own spot: a warning, nothing breaks), each reason
  // with what blocks marked (spots.ts spotWhy)
  for (const k of ['plaza', 'beach-spot'] as const) {
    const m = markerSpot(layout, k), o = m && layout.objects.get(m.id);
    if (!o || m.at) continue;
    const def = kindDef(k)!, whys = spotWhy(layout, k, o.x, o.z), said = whys.map(whyText);
    const ja = [...new Set(said.map((w) => w.ja))].join('、'), en = [...new Set(said.map((w) => w.en))].join('; ');
    const tiles = [...objTiles(layout, o), ...whys.flatMap((w) => w.tiles)].filter(([c, r], i, a) => a.findIndex(([x, y]) => x === c && y === r) === i);
    add('visitor-spot', 'warn', tiles, [o.id, ...new Set(whys.flatMap((w) => w.ids))], `${def.ja}に立てない：${ja}（いつもの場所に立ちます）`, `Nobody can stand at the ${def.en.toLowerCase()}: ${en} (the usual spot instead)`);
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
  if (pocket.length) add('pocket', 'warn', pocket, [], `行けない場所が${pocket.length}マス`, `${pocket.length} tiles nobody can walk to`);
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
  if (diag.length) add('water-diagonal', 'warn', diag, [], '水が斜めにしかつながっていない', 'Water joined only at a corner');
  if (edge.length) add('water-edge', 'warn', edge, [], '水が崖からこぼれる（滝は川だけ）', 'Water spills over a cliff (only a river falls)');
  return out;
}
