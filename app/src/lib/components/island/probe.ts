// The island's test probe (window.__world3d's pick, box, actor and the state hooks; docs/ops/testing.md "The test
// API"): what a tap at a client point goes to, where a thing's tap area is, and what the island shows, as plain data,
// so the specs ask by kind and id, never by the DOM island's selectors. For now it reads the DOM island (its tap areas'
// nodes and data-* attributes): the oracle the 3D pick and the models' registry take over from (the R4 plan,
// /tmp/review-1118/r4-dom-island-plan.md), the specs' contract unchanged. Test hooks only (testMode.ts testHooks).

/** What a tap goes to: a control (a villager, a door, the decor, a goal tree, its fruit row, a balloon, the board, a
 *  tree shake's pick or swarm, any other button: `ui`), else a scenery thing (SceneTaps' order: tree, bush, campfire, sit,
 *  fixture, flower). */
export type PickKind =
  | 'villager' | 'building' | 'decor' | 'goal' | 'row' | 'talk' | 'board' | 'balloon' | 'swarm' | 'drop' | 'ui'
  | 'tree' | 'bush' | 'campfire' | 'sit' | 'fixture' | 'flower' | 'visitor';
type Ref = { kind: PickKind; id: string };
/** A pick: the thing a tap goes to, and the other things the same tap area is (a bench is a seat and a fixture). */
export type Picked = Ref & { also: Ref[] };
/** What `box` finds: a tap area (PickKind), or a figure the scene hit-tests itself (a visitor's, K.K.'s, the cake,
 *  the arch, a toy, the tape deck) or a critter (`id` its species, or `fish` / `pond`: a shadow) or a find (`id` its kind or uid; the foot the
 *  point it lies on) or a care thing (a weed's uid, or `rock`), my float
 *  (`bobber`), the dive spot's bubbles, the shadow a dive chases (`chase`), or a goal tree's fruit (id `tree:fruit`, `A:apple`), or a
 *  tree's trunk (a goal tree's, `A`, or the scenery's, `oak-m1`: its own tap area, ≥ 45 px wide, a part of the tree's). */
export type BoxKind = Exclude<PickKind, 'ui'> | 'kk' | 'cake' | 'arch' | 'toy' | 'deck' | 'critter' | 'find' | 'care' | 'fruit' | 'trunk' | 'bobber' | 'bubbles' | 'chase';
/** A tap area's box (client px) and its node's foot (the world point it stands on, on screen), if it has one. */
export type Box = { left: number; top: number; width: number; height: number; foot: [number, number] | null };

/** The kinds a tap's button is (a tap under one is the control's, SceneTaps' first rule). */
export const CONTROLS: readonly PickKind[] = ['villager', 'building', 'decor', 'goal', 'row', 'talk', 'board', 'balloon', 'swarm', 'drop', 'ui'];

const SCENERY: readonly (readonly [PickKind, string])[] = [
  ['tree', 'data-tree'], ['bush', 'data-bush'], ['campfire', 'data-campfire'], ['sit', 'data-sit'], ['fixture', 'data-fixture']
];
/** A tap area inside none of the above (none hit-tests today: the oracle's completeness). */
const HOLDERS: readonly (readonly [PickKind, string])[] = [['villager', 'data-actor'], ['building', 'data-building'], ['visitor', 'data-visitor']];
/** A tree shake's pick-up: its button's attribute naming it. */
const DROPS = ['data-coconut', 'data-wood-id', 'data-branch', 'data-dangler'];

function* up(el: Element | null): Generator<Element> {
  for (let n = el; n; n = n.parentElement) yield n;
}
const closest = (el: Element, attr: string): Element | null => {
  for (const n of up(el)) if (n.hasAttribute(attr)) return n;
  return null;
};
const hasClass = (n: Element, c: string) => ` ${n.getAttribute('class') ?? ''} `.includes(` ${c} `);
const isControl = (n: Element) => /^(button|a)$/i.test(n.tagName) || n.getAttribute('role') === 'button';

/** The button `b`'s thing. */
function controlOf(b: Element): Ref {
  for (const [kind, attr] of [['villager', 'data-actor'], ['building', 'data-building'], ['swarm', 'data-swarm']] as const) {
    const n = closest(b, attr);
    if (n) return { kind, id: n.getAttribute(attr) ?? '' };
  }
  if (b.getAttribute('data-fx') === 'talk') return { kind: 'talk', id: '' };
  if (b.hasAttribute('data-board')) return { kind: 'board', id: '' };
  if (hasClass(b, 'balloon')) return { kind: 'balloon', id: '' };
  const drop = DROPS.find((a) => b.hasAttribute(a));
  if (drop) return { kind: 'drop', id: b.getAttribute(drop) ?? '' };
  // a goal tree (FruitTree): the trunk's button in the tree's node, the canopy's in the node after it
  const p = b.parentElement, tree = p?.getAttribute('data-tree-node') ?? p?.previousElementSibling?.getAttribute('data-tree-node');
  if (tree && (hasClass(b, 'trunk-btn') || hasClass(b, 'canopy'))) return { kind: 'goal', id: tree };
  // its fruit row (a tap picks up what's met, else opens its popup as the tree does)
  if (b.hasAttribute('data-tree-row')) return { kind: 'row', id: b.getAttribute('data-tree-row') ?? '' };
  return { kind: 'ui', id: b.getAttribute('aria-label') ?? b.getAttribute('class')?.split(' ')[0] ?? b.tagName.toLowerCase() };
}

/** What a tap on `el` (the topmost node at the point) goes to, or null (the ground, the sky: `ground`). Non-null
 *  exactly where `el.closest(TAP_AREAS)` is (e2e/pick.spec.ts holds it to that). */
export function pickOf(el: Element | null): Picked | null {
  if (!el) return null;
  for (const n of up(el)) if (isControl(n)) return { ...controlOf(n), also: [] };
  for (const [kind, attr] of SCENERY) {
    const n = closest(el, attr);
    if (n) return { kind, id: n.getAttribute(attr) ?? '', also: SCENERY.filter(([k, a]) => k !== kind && n.hasAttribute(a)).map(([k, a]) => ({ kind: k, id: n.getAttribute(a) ?? '' })) };
  }
  for (const [kind, attr] of HOLDERS) {
    const n = closest(el, attr);
    if (n) return { kind, id: n.getAttribute(attr) ?? '', also: [] };
  }
  return null;
}

/** What a tap at client (x, y) goes to (`pickOf` the topmost node there). */
export const pickAt = (doc: Pick<Document, 'elementFromPoint'>, x: number, y: number): Picked | null => pickOf(doc.elementFromPoint(x, y));

const q = (id: string) => id.replace(/["\\]/g, '\\$&');
/** Each kind's tap area (the selectors whose boxes it unites: a tree's canopy and trunk) and its node (the foot). A
 *  flower and the decor have no node (flowers.svelte.ts, decor.svelte.ts: things3 tap areas). */
export function areaOf(kind: BoxKind, id = ''): { area: string[]; node: string | null } {
  const v = q(id);
  switch (kind) {
    case 'villager': return { area: [`[data-actor="${v}"] .vil`], node: `[data-actor="${v}"]` };
    case 'building': return { area: [`[data-building="${v}"] .door`], node: null };
    case 'goal': return { area: [`[data-tree-node="${v}"] + .node .canopy`, `[data-tree-node="${v}"] .trunk-btn`], node: `[data-tree-node="${v}"]` };
    case 'trunk': return { area: [`[data-tree-node="${v}"] .trunk-btn`, `.hit-trunk[data-tree="${v}"]`], node: null };
    case 'row': return { area: [`[data-tree-row="${v}"]`], node: null };
    case 'fruit': {
      const [t, f] = id.split(':').map(q);
      return { area: [`.fruit[data-tree="${t}"][data-fruit="${f}"]`], node: null };
    }
    case 'tree': return { area: [`.hit[data-tree="${v}"]`, `.hit-trunk[data-tree="${v}"]`], node: null };
    case 'talk': return { area: ['[data-fx="talk"]'], node: null };
    case 'board': return { area: ['[data-board]'], node: null };
    case 'balloon': return { area: ['.if-scene .balloon'], node: null };
    case 'swarm': return { area: [`[data-swarm="${v}"]`], node: null };
    case 'drop': return { area: [DROPS.map((a) => `[${a}="${v}"]`).join(', ')], node: null };
    case 'visitor': return { area: [`[data-visitor="${v}"] .art`], node: `[data-visitor="${v}"]` };
    case 'kk': return { area: ['[data-kk] .art'], node: '[data-kk]' };
    case 'cake': return { area: ['[data-cake] .official'], node: '[data-cake]' };
    case 'arch': return { area: ['[data-arch] .official'], node: '[data-arch]' };
    case 'toy': return { area: ['[data-toy] .art'], node: '[data-toy]' };
    case 'deck': return { area: ['[data-stretch] .radio'], node: '[data-stretch]' };
    case 'critter': return { area: [`[data-critter="${v}"]`], node: null };
    case 'bobber': return { area: ['[data-bobber]'], node: null };
    case 'bubbles': return { area: ['[data-bubbles]'], node: null };
    case 'chase': return { area: ['[data-dive="chase"]'], node: null };
    // (a find's or a care thing's node is a 0 × 0 anchor, its foot; its pictures the box: not a bottle's foam nor a weed's shade)
    case 'find': return { area: [`:is([data-find="${v}"], [data-find][data-uid="${v}"]) .official`, `:is([data-find="${v}"], [data-find][data-uid="${v}"]) svg`], node: `:is([data-find="${v}"], [data-find][data-uid="${v}"])` };
    case 'care': return { area: [`:is([data-care="${v}"], [data-care][data-uid="${v}"]) .official`, `:is([data-care="${v}"], [data-care][data-uid="${v}"]) svg`], node: `:is([data-care="${v}"], [data-care][data-uid="${v}"])` };
    default: {
      const attr = SCENERY.find(([k]) => k === kind)?.[1];
      return { area: attr ? [`[${attr}="${v}"]`] : [], node: null };
    }
  }
}

/** Where thing (`kind`, `id`) is on screen (the first one: a critter's id is its species), or null (not there). A box
 *  may be 0 × 0 (an anchor: its point). */
export function boxOf(root: Pick<ParentNode, 'querySelector'>, kind: BoxKind, id = ''): Box | null {
  const { area, node } = areaOf(kind, id);
  const rs = area.map((s) => root.querySelector(s)?.getBoundingClientRect()).filter((r): r is DOMRect => !!r);
  if (!rs.length) return null;
  const left = Math.min(...rs.map((r) => r.left)), top = Math.min(...rs.map((r) => r.top));
  const width = Math.max(...rs.map((r) => r.left + r.width)) - left, height = Math.max(...rs.map((r) => r.top + r.height)) - top;
  const n = node ? root.querySelector(node)?.getBoundingClientRect() : null;
  return { left, top, width, height, foot: n ? [n.left, n.top] : null };
}

/** What thing (`kind`, `id`) draws on screen (its art's pictures united, not its tap area: a bush's leaves), or null (not there, or hidden). A tree's is its leaves (an oak's canopy), its `trunk`'s the trunk. */
export function drawnOf(root: Pick<ParentNode, 'querySelector'>, kind: BoxKind, id = ''): Omit<Box, 'foot'> | null {
  const v = q(id), spr = (part: string) => `.spr[data-scenery-id="${v}"][data-part="${part}"] .art`;
  const sel = kind === 'tree' ? `${spr('canopy')}, ${spr('body')}` : kind === 'trunk' ? `${spr('trunk')}, ${spr('body')}` : areaOf(kind, id).area.join(', ');
  const el = sel ? root.querySelector(sel) : null;
  if (!el || !((el as HTMLElement).checkVisibility?.({ visibilityProperty: true }) ?? true)) return null;
  const pics = [...el.querySelectorAll('img, svg')];
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  for (const e of pics.length ? pics : [el]) {
    const x = e.getBoundingClientRect();
    if (!x.width || !x.height) continue;
    [l, t, r, b] = [Math.min(l, x.left), Math.min(t, x.top), Math.max(r, x.left + x.width), Math.max(b, x.top + x.height)];
  }
  return l < r ? { left: l, top: t, width: r - l, height: b - t } : null;
}

/** A piece of the scenery as shown (a tree, a bush, a rock, a fixed decor piece, the decor, a building, a flower). */
export type Piece = {
  id: string;
  /** Scenery's kind (oak, palm, bush, rock, …), or `fixture` (fixedDecor), `decor`, `building`, `flower`. */
  kind: string;
  /** Its art's key (`deco/picnic-set`, `flowers/black-cosmos`; the decor's item). */
  look: string | null;
  /** The seat it is (its sit id: a tap walks up and sits on it), or null. */
  sit: string | null;
  /** The fixed decor piece a tap answers as (its id), or null. */
  fixture: string | null;
  /** The shishi-odoshi tipped; a campfire lit (its flames); a flower watered today (its glint). */
  tipped: boolean; lit: boolean; watered: boolean;
};
const PIECES = '[data-building], .spr[data-scenery-id]';
function pieceOf(root: Pick<ParentNode, 'querySelector'>, n: Element): Piece {
  const building = n.getAttribute('data-building');
  const id = building ?? n.getAttribute('data-scenery-id') ?? '';
  const art = n.querySelector('[data-look]');
  return {
    id,
    kind: building !== null ? 'building' : art?.hasAttribute('data-fixture') ? 'fixture' : (n.getAttribute('data-kind') ?? ''),
    look: art?.getAttribute('data-look') ?? null,
    sit: art?.getAttribute('data-sit') ?? null, fixture: art?.getAttribute('data-fixture') ?? null, tipped: !!art?.hasAttribute('data-tipped'),
    lit: !!root.querySelector(`[data-lit="${q(id)}"]`), watered: false
  };
}
/** Scenery piece `id` (its scenery, fixed decor, decor or building id) as shown, or null (not there; a flower's is
 *  flowers.svelte.ts': things3 pieces). */
export function sceneryOf(root: Pick<ParentNode, 'querySelector'>, id: string): Piece | null {
  const v = q(id), n = root.querySelector(`[data-building="${v}"], .spr[data-scenery-id="${v}"]`);
  return n ? pieceOf(root, n) : null;
}
/** Every scenery piece shown (an oak's two parts: one piece). */
export function sceneryAll(root: Pick<ParentNode, 'querySelector' | 'querySelectorAll'>): Piece[] {
  const seen = new Map<string, Piece>();
  for (const n of root.querySelectorAll(PIECES)) {
    const p = pieceOf(root, n);
    if (!seen.has(p.id)) seen.set(p.id, p);
  }
  return [...seen.values()];
}

/** A villager as the island shows it (`slot`: mine, partner, third). */
export type Actor = {
  /** Its motion now (Villager's data-act: hop, squish, …), or null. */
  act: string | null;
  walking: boolean; inside: boolean; hat: boolean; stung: string | null; swollen: boolean; tricked: boolean;
  seat: string | null; gym: string | null; who: string | null;
  /** Its flourishes showing (the director's fx on it: sparkles, hearts, notes, …). */
  fx: string[];
  /** Drawn by the 3D island (its tap area its model's core). */
  v3: boolean;
};
export function actorOf(root: Pick<ParentNode, 'querySelector'>, slot: string): Actor | null {
  const n = root.querySelector(`[data-actor="${q(slot)}"]`);
  if (!n) return null;
  const has = (s: string) => !!n.querySelector(s);
  return {
    act: n.querySelector('.vil .body')?.getAttribute('data-act') ?? null,
    walking: hasClass(n, 'walking'), inside: n.hasAttribute('data-inside'), hat: has('[data-hat]'), stung: n.getAttribute('data-stung'),
    swollen: has('[data-swollen]'), tricked: has('[data-tricked]'), seat: n.getAttribute('data-seat'), gym: n.getAttribute('data-gym'),
    who: n.getAttribute('data-who'), fx: [...n.querySelectorAll('.vil .fxa')].map((f) => (f.getAttribute('class') ?? '').split(' ').find((c) => c && c !== 'fxa') ?? ''),
    v3: n.hasAttribute('data-v3')
  };
}

type Root = Pick<ParentNode, 'querySelectorAll'>;
const all = (root: Root, sel: string) => [...root.querySelectorAll(sel)];
const rect = (n: Element): Omit<Box, 'foot'> => {
  const r = n.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

/** Every control shown (a villager, a door, the decor, a goal tree, the HUD's buttons: `ui`, …) and its tap area's box,
 *  stacked or not: what a figure may overlap (a pick finds only the topmost). */
export const controlsOf = (root: Root) =>
  all(root, 'button, a, [role="button"]')
    .filter((n) => (n as HTMLElement).checkVisibility?.({ visibilityProperty: true }) ?? true)
    .map((n) => ({ ...controlOf(n), box: rect(n) }))
    .filter((c) => c.box.width && c.box.height);

/** The critters out: a bug (`id` its species) or a fish's shadow (`id` fish or pond, its water and pool). A bug's
 *  `place` (a flower, a trunk, the water's air…), `flight` (drift, dart, stalk…), a stalker's `stalk` (rear, settled);
 *  a shadow's `shape` (`fin`: a shark's), or null. `gone`/`fled`: on its way out; `sat`: landed. */
export const crittersOf = (root: Root, box3?: (n: Element, id: string) => Box | null) =>
  all(root, '[data-critter]').map((n) => ({
    id: n.getAttribute('data-critter') ?? '', place: n.getAttribute('data-place'), water: n.getAttribute('data-water'), pool: n.getAttribute('data-pool'),
    flight: n.getAttribute('data-flight'), stalk: n.getAttribute('data-stalk'), shape: n.getAttribute('data-shape') || null,
    gone: hasClass(n, 'gone'), fled: hasClass(n, 'fled'), sat: hasClass(n, 'sat'), box: box3?.(n, n.getAttribute('data-critter') ?? '') ?? rect(n)
  }));

export type Critter = ReturnType<typeof crittersOf>[number];

/** The dive spot out (its bubbles: the item under them, or null) and a dive on (the splash, or the shadow it chases). */
export const diveOf = (root: Pick<ParentNode, 'querySelector'>) => ({
  bubbles: root.querySelector('[data-bubbles]')?.getAttribute('data-bubbles') ?? null,
  dive: (root.querySelector('[data-dive]')?.getAttribute('data-dive') ?? null) as 'splash' | 'chase' | null
});

const shown = (n: Element) => (n as HTMLElement).checkVisibility?.({ visibilityProperty: true }) ?? true;
const footOf = (n: Element): [number, number] => ((r) => [r.left, r.top] as [number, number])(n.getBoundingClientRect());
/** What a 0 × 0 anchor's thing draws: its pictures (its official art, not a crop's whole image; svg) united, or its own box
 *  if none has a size. */
function artOf(n: Element): Omit<Box, 'foot'> {
  const rs = [...n.querySelectorAll('.official, svg')].map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height);
  if (!rs.length) return rect(n);
  const left = Math.min(...rs.map((r) => r.left)), top = Math.min(...rs.map((r) => r.top));
  return { left, top, width: Math.max(...rs.map((r) => r.left + r.width)) - left, height: Math.max(...rs.map((r) => r.top + r.height)) - top };
}

/** The day's finds lying out (a dig spot `fossil`, a mushroom, a present, a shell, a fragment, the bottle): `id` its
 *  item, `tree` a present's tree, `fall` a present falling out of it, `shown` drawn now (one out of view or under a
 *  control isn't), `foot` the point it lies on (client px), `box` its art's. */
export const findsOf = (root: Root) =>
  all(root, '[data-find]').map((n) => ({
    kind: n.getAttribute('data-find') ?? '', id: n.getAttribute('data-id'), uid: n.getAttribute('data-uid') ?? '', tree: n.getAttribute('data-tree-gift'),
    fall: hasClass(n, 'fall'), shown: shown(n), foot: footOf(n), box: artOf(n)
  }));
export type Find = ReturnType<typeof findsOf>[number];

/** The island care things out: the day's weeds (`uid`; `sprout`: just popped up) and the rock (uid `rock`), `shown`,
 *  `foot` and `box` (its art's: a weed's tuft) as the finds'. */
export const careOf = (root: Root) =>
  all(root, '[data-care]').map((n) => ({
    kind: n.getAttribute('data-care') ?? '', uid: n.getAttribute('data-uid') ?? n.getAttribute('data-care') ?? '', sprout: hasClass(n, 'sprout'),
    shown: shown(n), foot: footOf(n), box: artOf(n)
  }));
export type Care = ReturnType<typeof careOf>[number];

/** The day's dig spots and weeds wherever they are (world x, z: on the layout they lie all over the long island), shown
 *  or not: `digs.length` the spots left to dig, `weeds.length` the weeds left to pull. */
export function spotsOf(root: Pick<ParentNode, 'querySelector'>): { digs: [number, number][]; weeds: [number, number][] } {
  const at = (sel: string) => (root.querySelector(sel)?.getAttribute('data-at') ?? '').split(' ').filter(Boolean).map((p) => p.split(',').map(Number) as [number, number]);
  return { digs: at('[data-digs]'), weeds: at('[data-weeds]') };
}

/** Drawn now: shown (not out of view, not hidden) and of some size. */
const seen = (n: Element | null) => !!n && shown(n) && ((r) => r.width > 0 && r.height > 0)(n.getBoundingClientRect());
/** What shows on a visitor's or K.K.'s figure: its art `shown`, a 2D `card` (a picture as its art, not its 3D model),
 *  an emote, its flourishes (`fx`: zzz, …), a treat popping up (Jack's candy, a thank-you's), the pair's heart float. */
const looks = (n: Element) => ({
  shown: seen(n.querySelector('.art')), card: !!n.querySelector('.art .official'), emote: !!n.querySelector('.emote'),
  fx: [...n.querySelectorAll('.over .fxa')].map((f) => (f.getAttribute('class') ?? '').split(' ').find((c) => c && c !== 'fxa') ?? ''),
  treat: !!n.querySelector('[data-treat]'), heart: !!n.querySelector('[data-heart-float]')
});
/** The visitors out (the day's in slot `visitor`, the day's guest in `guest`; K.K. as `kk`): its visit's `phase`
 *  (arrive, here, leave) and the `way` it comes by, `stage` (the wedding pair on the centre stage), `asleep` (lie,
 *  stand), its director `motion`, the vegetable it asks for (`vegAsk`), walking; K.K.'s `mode` (day, show: his
 *  Saturday night, asleep) and `playing` (a song on); and what shows on it (`looks`). */
export const visitorsOf = (root: Root) => [
  ...all(root, '[data-visitor]').map((n) => ({
    id: n.getAttribute('data-visitor') ?? '', slot: n.getAttribute('data-slot'), stage: n.getAttribute('data-stage'), phase: n.getAttribute('data-phase'),
    way: n.getAttribute('data-way'), asleep: n.getAttribute('data-asleep'), motion: n.getAttribute('data-motion'), vegAsk: n.getAttribute('data-veg-ask'),
    walking: hasClass(n, 'walking'), mode: null as string | null, playing: false, ...looks(n)
  })),
  ...all(root, '[data-kk]').map((n) => ({
    id: 'kk', slot: null, stage: null, phase: null, way: null, asleep: null, motion: n.getAttribute('data-motion'), vegAsk: null,
    walking: false, mode: n.getAttribute('data-kk'), playing: hasClass(n, 'show'), ...looks(n)
  }))
];
export type Visitor = ReturnType<typeof visitorsOf>[number];

const prop = (n: Element, art: string) => {
  const a = n.querySelector(art);
  return { shown: seen(a), box: a ? rect(a) : null };
};
/** The day's props out: the birthday cake (`out`: its candles blown out), the wedding arch, Toy Day's presents,
 *  Halloween (`day`, `night`) and its pumpkins (`lit`: a night's lantern), the tape deck (`state`: on (playing), ready
 *  (its day), idle; `hint`: its ♪ asking for a tap). Each `shown` (drawn now) and its art's `box`. */
export function propsOf(root: Pick<ParentNode, 'querySelector' | 'querySelectorAll'>) {
  const cake = root.querySelector('[data-cake]'), arch = root.querySelector('[data-arch]'), deck = root.querySelector('.deck[data-stretch]');
  return {
    cake: cake ? { out: cake.getAttribute('data-cake') === 'out', ...prop(cake, '.official') } : null,
    arch: arch ? prop(arch, '.official') : null,
    toys: all(root, '[data-toy]').map((n) => prop(n, '.art')),
    halloween: (root.querySelector('[data-halloween]')?.getAttribute('data-halloween') ?? null) as 'day' | 'night' | null,
    pumpkins: all(root, '[data-pumpkin]').map((n) => ({ lit: !!n.querySelector('.glow'), ...prop(n, '.art') })),
    deck: deck ? { state: deck.getAttribute('data-stretch') as 'on' | 'ready' | 'idle', hint: !!deck.querySelector('.hint'), ...prop(deck, '.radio') } : null
  };
}
export type Props = ReturnType<typeof propsOf>;

/** A tree shake's leavings: what fell to pick up (`what`: branch (`id` its tree), coconut, wood (`item` its kind:
 *  softwood, …), dangler (`id` the bug: its net's tap area, there while it dangles)), the nests, the swarms (`side`: the
 *  villager they charge), the bug dangling on its thread (`up`: climbing back into the tree). */
export const shakesOf = (root: Root) => ({
  drops: all(root, DROPS.map((a) => `[${a}]`).join(', ')).map((n) => {
    const a = DROPS.find((a) => n.hasAttribute(a))!;
    return { what: a.replace(/^data-|-id$/g, ''), id: n.getAttribute(a) ?? '', item: n.getAttribute('data-wood'), box: rect(n) };
  }),
  nests: all(root, '[data-nest]').map((n) => ({ tree: n.getAttribute('data-nest') ?? '', fading: hasClass(n, 'fading') })),
  swarms: all(root, '[data-swarm]').map((n) => ({ side: n.getAttribute('data-swarm') ?? '', stung: hasClass(n, 'stung') })),
  dangles: all(root, '[data-dangle]').map((n) => ({ bug: n.getAttribute('data-dangle') ?? '', up: hasClass(n, 'up') }))
});
export type Shakes = ReturnType<typeof shakesOf>;

/** The bulletin board as shown (Board.svelte): `unseen`, its 「！」 up (a note I haven't read), or null (not out). */
export function boardOf(root: Pick<ParentNode, 'querySelector'>): { unseen: boolean } | null {
  const b = root.querySelector('[data-board]');
  return b ? { unseen: b.hasAttribute('data-unseen') } : null;
}

/** A goal tree's fruit (`tree`: its person): each fruit's id, its stage (tree, fall, ground), up in the canopy or
 *  down, its drop playing, its grey (fruitDay.ts greyAt: 1 at 0 %, 0 once met); `box('fruit', 'tree:f')` where. */
export const fruitOf = (root: Root, tree: string) =>
  all(root, `.fruit[data-tree="${q(tree)}"]`).map((n) => ({
    f: n.getAttribute('data-fruit') ?? '', stage: n.getAttribute('data-stage'), up: hasClass(n, 'up'), dropping: hasClass(n, 'drop'),
    grey: Number(/grayscale\(([\d.]+)\)/.exec((n.querySelector('.f') as HTMLElement | null)?.style.filter ?? '')?.[1] ?? 0)
  }));

/** Goal tree `tree` (its person) as shown: its popup open (FruitTree's `open`), its glints (all four met), or null
 *  (no such tree). The popup itself (`.detail`) is an overlay that stays. */
export function goalOf(root: Pick<ParentNode, 'querySelector'>, tree: string): { open: boolean; glints: boolean } | null {
  const v = q(tree), canopy = root.querySelector(`[data-tree-node="${v}"] + .node .canopy`);
  return canopy ? { open: canopy.getAttribute('aria-expanded') === 'true', glints: !!root.querySelector(`.glints[data-tree="${v}"]`) } : null;
}

/** The 3D island's effects as they fired (fx3d.ts: a tap's ring, the high five's zap, a splash, …), oldest first, the
 *  last `max`: what a spec waits for, however briefly it showed. `at`: the page's clock (ms). */
export type FxSeen = { kind: string; x: number; z: number; v: string | null; at: number };
export function fxLog(max = 200) {
  const seen: FxSeen[] = [];
  return {
    add: (kind: string, x: number, z: number, v: string | null | undefined, at: number) => {
      seen.push({ kind, x, z, v: v ?? null, at });
      if (seen.length > max) seen.shift();
    },
    list: (): FxSeen[] => seen.slice()
  };
}
