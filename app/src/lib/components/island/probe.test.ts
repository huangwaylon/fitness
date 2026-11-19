import { describe, expect, it } from 'vitest';
import { actorOf, areaOf, boxOf, CONTROLS, controlsOf, crittersOf, diveOf, drawnOf, fruitOf, fxLog, goalOf, pickOf, sceneryAll, sceneryOf, type BoxKind } from './probe.ts';

/** A stand-in element: its tag, attributes and children (parentElement, previousElementSibling wired), and what its
 *  querySelector answers (`q`: selector → element). */
type Fake = Element & { kids: Fake[] };
function el(tag: string, attrs: Record<string, string> = {}, kids: Fake[] = [], q: Record<string, Fake> = {}, box = [0, 0, 0, 0]): Fake {
  const n = {
    tagName: tag.toUpperCase(), kids, parentElement: null as Fake | null, previousElementSibling: null as Fake | null,
    getAttribute: (k: string) => attrs[k] ?? null, hasAttribute: (k: string) => k in attrs,
    querySelector: (s: string) => q[s] ?? null, querySelectorAll: (s: string) => (q[s] ? [q[s]] : []),
    getBoundingClientRect: () => ({ left: box[0], top: box[1], width: box[2], height: box[3] })
  } as unknown as Fake;
  kids.forEach((k, i) => Object.assign(k, { parentElement: n, previousElementSibling: kids[i - 1] ?? null }));
  return n;
}
const each = (n: Fake): Fake[] => [n, ...n.kids.flatMap(each)];

/** e2e/island.ts's TAP_AREAS (what the specs' taps kept clear of) as a match on a stand-in. */
const ATTRS = ['data-bush', 'data-tree', 'data-flower', 'data-sit', 'data-fixture', 'data-campfire', 'data-building', 'data-decor', 'data-actor', 'data-visitor'];
const tapArea = (n: Fake) => /^(BUTTON|A)$/.test(n.tagName) || n.getAttribute('role') === 'button' || ATTRS.some((a) => n.hasAttribute(a)) || n.getAttribute('data-fx') === 'talk';
const underTapArea = (n: Fake | null): boolean => !!n && (tapArea(n) || underTapArea(n.parentElement as Fake | null));

// a stage like the island's: a villager, a door, the decor, a goal tree and its fruit row, the talk balloon, the board, a balloon, a tree
// shake's swarm and pick-up, scenery (a cedar, a bench that seats, a bush), the HUD's link and buttons, bare nodes
const body = el('span', { class: 'body', 'data-act': 'hop' });
const vil = el('button', { class: 'vil' }, [el('span', {}, [body])]);
const actor = el('div', { class: 'actor walking', 'data-actor': 'mine', 'data-seat': 'bench-1', 'data-who': 'B', 'data-v3': '' }, [vil], { '.vil .body': body, '[data-hat]': el('span'), '.vil .fxa': el('span', { class: 'fxa sparkles' }) });
const door = el('button', { class: 'door' });
const trunk = el('button', { class: 'trunk-btn' }), canopy = el('button', { class: 'canopy' });
const cedar = el('i', { class: 'hit cedar', 'data-tree': 'cedar-2' });
const bench = el('span', { class: 'art fixture', 'data-fixture': 'bench-mae', 'data-sit': 'bench-mae-1' }, [el('img')]);
const stage = el('div', { class: 'stage' }, [
  actor,
  el('div', { class: 'building', 'data-building': 'museum' }, [door]),
  el('button', { class: 'deco', 'data-decor': 'd3' }, [el('img')]),
  el('div', { class: 'node', 'data-tree-node': 'A' }, [el('div', { class: 'tree' }), trunk]),
  el('div', { class: 'node' }, [el('div', { class: 'tree' }), canopy]),
  el('div', { class: 'node' }, [el('button', { class: 'row-btn', 'data-tree-row': 'A' })]),
  el('button', { class: 'say', 'data-fx': 'talk' }, [el('span', { class: 'who' })]),
  el('button', { class: 'board', 'data-board': '' }),
  el('button', { class: 'balloon' }),
  el('button', { class: 'swarm', 'data-swarm': 'mine' }, [el('svg')]),
  el('button', { class: 'pick', 'data-coconut': 'c7' }),
  el('div', { class: 'spr' }, [el('span', { class: 'art' }, [cedar])]),
  el('div', { class: 'spr' }, [bench]),
  el('span', { class: 'art bush', 'data-bush': 'b1' }),
  el('span', { class: 'fl', 'data-flower': 'f2' }),
  el('span', { class: 'visitor', 'data-visitor': 'redd' }, [el('span', { class: 'art' })]),
  el('a', { href: '/x' }), el('div', { role: 'button', 'aria-label': '設定' }), el('button', { class: 'ribbon x', 'aria-label': 'メニュー' }),
  el('div', { class: 'ground' }, [el('span')])
]);

describe('pick: what a tap goes to', () => {
  it('names each thing by kind and id, a node inside its tap area the same', () => {
    expect(pickOf(body)).toEqual({ kind: 'villager', id: 'mine', also: [] });
    expect(pickOf(door)).toMatchObject({ kind: 'building', id: 'museum' });
    expect(pickOf(trunk)).toMatchObject({ kind: 'goal', id: 'A' });
    expect(pickOf(canopy)).toMatchObject({ kind: 'goal', id: 'A' });
    expect(pickOf(cedar)).toMatchObject({ kind: 'tree', id: 'cedar-2' });
    const kinds = stage.kids.map((n) => pickOf(each(n).at(-1)!)).map((p) => p && `${p.kind}:${p.id}`);
    expect(kinds).toEqual([
      'villager:mine', 'building:museum', 'decor:d3', 'goal:A', 'goal:A', 'row:A', 'talk:', 'board:', 'balloon:', 'swarm:mine', 'drop:c7',
      'tree:cedar-2', 'sit:bench-mae-1', 'bush:b1', 'flower:f2', 'visitor:redd', 'ui:a', 'ui:設定', 'ui:メニュー', null
    ]);
  });

  it("a seat that's a fixture too: the seat's (SceneTaps' order), the fixture also", () => {
    expect(pickOf(bench.kids[0])).toEqual({ kind: 'sit', id: 'bench-mae-1', also: [{ kind: 'fixture', id: 'bench-mae' }] });
  });

  it("is something exactly where the specs' TAP_AREAS were (every node of the stage)", () => {
    for (const n of each(stage)) expect(!!pickOf(n), n.getAttribute('class') ?? n.tagName).toBe(underTapArea(n));
    expect(pickOf(null)).toBeNull();
  });

  it("a control's kind is one of CONTROLS", () => {
    const inControl = (n: Fake | null): boolean => !!n && (/^(BUTTON|A)$/.test(n.tagName) || n.getAttribute('role') === 'button' || inControl(n.parentElement as Fake | null));
    for (const n of each(stage)) {
      const p = pickOf(n);
      if (!p) continue;
      if (inControl(n)) expect(CONTROLS, `${p.kind}:${p.id}`).toContain(p.kind);
      // (scenery; or a node in a villager's, a building's or a visitor's holder: none hit-tests on the island)
      else expect(['tree', 'bush', 'campfire', 'sit', 'fixture', 'flower', 'villager', 'building', 'visitor', 'decor'], `${p.kind}:${p.id}`).toContain(p.kind);
    }
  });
});

describe('box: where a thing is', () => {
  it('unites a tree\'s canopy and trunk; gives a node\'s foot; null when not there', () => {
    const root = el('div', {}, [], {
      '.hit[data-tree="oak-1"]': el('i', {}, [], {}, [10, 20, 40, 30]),
      '.hit-trunk[data-tree="oak-1"]': el('i', {}, [], {}, [20, 45, 20, 25]),
      '[data-actor="mine"] .vil': el('button', {}, [], {}, [100, 200, 48, 64]),
      '[data-actor="mine"]': el('div', {}, [], {}, [124, 264, 0, 0])
    });
    expect(boxOf(root, 'tree', 'oak-1')).toEqual({ left: 10, top: 20, width: 40, height: 50, foot: null });
    expect(boxOf(root, 'villager', 'mine')).toEqual({ left: 100, top: 200, width: 48, height: 64, foot: [124, 264] });
    expect(boxOf(root, 'villager', 'partner')).toBeNull();
  });

  it("a flower's and the decor's least tap target (44 px round its middle; 45 up from its foot)", () => {
    const root = el('div', {}, [], {
      '[data-flower="f1"]': el('span', {}, [], {}, [100, 100, 20, 16]),
      '[data-decor="d1"]': el('button', {}, [], {}, [200, 100, 30, 60])
    });
    expect(boxOf(root, 'flower', 'f1')).toEqual({ left: 88, top: 86, width: 44, height: 44, foot: null });
    expect(boxOf(root, 'decor', 'd1')).toEqual({ left: 192.5, top: 100, width: 45, height: 60, foot: null });
  });

  it('every kind has a tap area; ids are quoted', () => {
    const kinds: BoxKind[] = ['villager', 'building', 'decor', 'goal', 'row', 'talk', 'board', 'balloon', 'swarm', 'drop', 'tree', 'bush', 'campfire', 'sit', 'fixture', 'flower', 'visitor', 'kk', 'cake', 'arch', 'toy', 'deck', 'critter', 'find', 'fruit', 'trunk', 'bobber', 'bubbles', 'chase'];
    for (const k of kinds) expect(areaOf(k, 'x').area.length, k).toBeGreaterThan(0);
    expect(areaOf('sit', 'a"b').area).toEqual(['[data-sit="a\\"b"]']);
    expect(areaOf('fruit', 'B:apple').area).toEqual(['.fruit[data-tree="B"][data-fruit="apple"]']);
  });
});

describe('scenery: a piece as shown', () => {
  const look = (attrs: Record<string, string>) => el('span', { class: 'art', ...attrs });
  const oakTrunk = el('div', { class: 'spr', 'data-scenery-id': 'oak-m1', 'data-kind': 'oak', 'data-part': 'trunk' }, [], { '[data-look]': look({ 'data-look': 'trees/oak-trunk' }) });
  const oakLeaves = el('div', { class: 'spr', 'data-scenery-id': 'oak-m1', 'data-kind': 'oak', 'data-part': 'canopy' }, [], { '[data-look]': look({ 'data-look': 'trees/oak-canopy' }) });
  const shishi = el('div', { class: 'spr', 'data-scenery-id': 'shishi', 'data-kind': 'decor' }, [], { '[data-look]': look({ 'data-look': 'deco/shishi', 'data-fixture': 'shishi', 'data-tipped': '' }) });
  const bench = el('div', { class: 'spr', 'data-scenery-id': 'bench-mae', 'data-kind': 'decor' }, [], { '[data-look]': look({ 'data-look': 'deco/bench', 'data-fixture': 'bench-mae', 'data-sit': 'bench-mae' }) });
  const decor = el('div', { class: 'spr', 'data-scenery-id': 'd1', 'data-decor-node': 'd1' }, [], { '[data-decor]': el('button', { 'data-item': 'deco/lantern' }) });
  const camp = el('div', { class: 'building', 'data-building': 'campsite' }, [], { '[data-look]': el('button', { class: 'door', 'data-look': 'deco/campsite-winter' }) });
  const fire = el('div', { class: 'spr', 'data-scenery-id': 'campfire', 'data-kind': 'prop' }, [], { '[data-look]': look({ 'data-look': 'deco/campfire' }) });
  const flower = el('span', { class: 'fl', 'data-flower': 'fl:3', 'data-look': 'flowers/black-cosmos' }, [], { '[data-watered]': el('svg') });
  const nodes = [oakTrunk, oakLeaves, shishi, bench, decor, camp, fire, flower];
  const byId = (s: string) => nodes.find((n) => [`[data-flower="${n.getAttribute('data-flower')}"]`, `[data-building="${n.getAttribute('data-building')}"]`, `.spr[data-scenery-id="${n.getAttribute('data-scenery-id')}"]`].some((x) => s.split(', ').includes(x)));
  const root = { querySelector: (s: string) => (s === '[data-lit="campfire"]' ? el('div') : (byId(s) ?? null)), querySelectorAll: () => nodes } as unknown as ParentNode;
  const off = { sit: null, fixture: null, tipped: false, lit: false, watered: false };

  it('reads its look, seat, fixture and marks by id; null when not there', () => {
    expect(sceneryOf(root, 'shishi')).toEqual({ ...off, id: 'shishi', kind: 'fixture', look: 'deco/shishi', fixture: 'shishi', tipped: true });
    expect(sceneryOf(root, 'bench-mae')).toMatchObject({ kind: 'fixture', sit: 'bench-mae', fixture: 'bench-mae', tipped: false });
    expect(sceneryOf(root, 'd1')).toEqual({ ...off, id: 'd1', kind: 'decor', look: 'deco/lantern' });
    expect(sceneryOf(root, 'campsite')).toEqual({ ...off, id: 'campsite', kind: 'building', look: 'deco/campsite-winter' });
    expect(sceneryOf(root, 'campfire')).toMatchObject({ kind: 'prop', lit: true });
    expect(sceneryOf(root, 'fl:3')).toEqual({ ...off, id: 'fl:3', kind: 'flower', look: 'flowers/black-cosmos', watered: true });
    expect(sceneryOf(root, 'nope')).toBeNull();
  });

  it('lists every piece once (an oak\'s two parts: one)', () => {
    expect(sceneryAll(root).map((p) => `${p.kind}:${p.id}`)).toEqual(['oak:oak-m1', 'fixture:shishi', 'fixture:bench-mae', 'decor:d1', 'building:campsite', 'prop:campfire', 'flower:fl:3']);
  });

  it("drawn: its pictures' box, not its tap area; a tree's leaves, its trunk's own; null when not there", () => {
    const img = (box: number[]) => el('img', {}, [], {}, box);
    const art = (box: number[], pics: Fake[]) => Object.assign(el('span', {}, [], {}, box), { querySelectorAll: () => pics });
    const r = el('div', {}, [], {
      '.spr[data-scenery-id="oak-m1"][data-part="canopy"] .art, .spr[data-scenery-id="oak-m1"][data-part="body"] .art': art([0, 0, 200, 200], [img([10, 20, 80, 60])]),
      '.spr[data-scenery-id="oak-m1"][data-part="trunk"] .art, .spr[data-scenery-id="oak-m1"][data-part="body"] .art': art([0, 0, 200, 200], [img([40, 70, 20, 40])]),
      '[data-flower="f1"]': art([100, 100, 20, 16], [img([102, 100, 16, 16]), img([0, 0, 0, 0])])
    });
    expect(drawnOf(r, 'tree', 'oak-m1')).toEqual({ left: 10, top: 20, width: 80, height: 60 });
    expect(drawnOf(r, 'trunk', 'oak-m1')).toEqual({ left: 40, top: 70, width: 20, height: 40 });
    expect(drawnOf(r, 'flower', 'f1')).toEqual({ left: 102, top: 100, width: 16, height: 16 });
    expect(drawnOf(r, 'bush', 'b9')).toBeNull();
  });
});

describe('goal: a goal tree as shown', () => {
  it('its popup open (the canopy expanded) and its glints; null for no such tree', () => {
    const open = el('button', { class: 'canopy', 'aria-expanded': 'true' }), shut = el('button', { class: 'canopy', 'aria-expanded': 'false' });
    const root = el('div', {}, [], { '[data-tree-node="A"] + .node .canopy': open, '[data-tree-node="B"] + .node .canopy': shut, '.glints[data-tree="B"]': el('span') });
    expect(goalOf(root, 'A')).toEqual({ open: true, glints: false });
    expect(goalOf(root, 'B')).toEqual({ open: false, glints: true });
    expect(goalOf(root, 'G')).toBeNull();
  });

  it("its fruit: stage, up or down, the drop, the grey off FruitTree's filter", () => {
    const f = (attrs: Record<string, string>, filter: string) => el('span', attrs, [], { '.f': Object.assign(el('span'), { style: { filter } }) });
    const up = f({ class: 'fruit up', 'data-fruit': 'apple', 'data-stage': 'tree' }, 'grayscale(0.45) brightness(1.18) contrast(0.87)');
    const down = f({ class: 'fruit drop', 'data-fruit': 'gold', 'data-stage': 'ground' }, 'none');
    const root = { querySelectorAll: (s: string) => (s === '.fruit[data-tree="A"]' ? [up, down] : []) } as unknown as ParentNode;
    expect(fruitOf(root, 'A')).toEqual([
      { f: 'apple', stage: 'tree', up: true, dropping: false, grey: 0.45 },
      { f: 'gold', stage: 'ground', up: false, dropping: true, grey: 0 }
    ]);
  });
});

describe('actor: a villager as shown', () => {
  it("reads its node's motion, walk, seat and marks", () => {
    const root = el('div', {}, [], { '[data-actor="mine"]': actor });
    expect(actorOf(root, 'mine')).toEqual({ act: 'hop', walking: true, inside: false, hat: true, stung: null, swollen: false, tricked: false, seat: 'bench-1', gym: null, who: 'B', fx: ['sparkles'], v3: true });
    expect(actorOf(root, 'third')).toBeNull();
  });
});

describe('critters: the bugs and shadows out, the dive spot', () => {
  it("reads a bug's place, flight, stalk and landing, a shadow's water, pool and shape", () => {
    const stalker = el('span', { class: 'mover bug stalk tarantula sat', 'data-critter': 'tarantula', 'data-place': 'grass', 'data-flight': 'stalk' }, [], { '[data-stalk]': el('span', { 'data-stalk': 'rear' }) }, [10, 20, 8, 6]);
    const shark = el('span', { class: 'mover shadow is-fin sea gone', 'data-critter': 'fish', 'data-water': 'sea', 'data-pool': 'sea', 'data-shape': 'fin' });
    const carp = el('span', { class: 'mover shadow pond', 'data-critter': 'pond', 'data-water': 'pond', 'data-pool': 'pond', 'data-shape': '' });
    const root = { querySelectorAll: (s: string) => (s === '[data-critter]' ? [stalker, shark, carp] : []) } as unknown as ParentNode;
    const off = { place: null, water: null, pool: null, flight: null, stalk: null, shape: null, gone: false, fled: false, sat: false, box: { left: 0, top: 0, width: 0, height: 0 } };
    expect(crittersOf(root)).toEqual([
      { ...off, id: 'tarantula', place: 'grass', flight: 'stalk', stalk: 'rear', sat: true, box: { left: 10, top: 20, width: 8, height: 6 } },
      { ...off, id: 'fish', water: 'sea', pool: 'sea', shape: 'fin', gone: true },
      { ...off, id: 'pond', water: 'pond', pool: 'pond' }
    ]);
  });

  it('the bubbles (their item) and a dive on; nothing out: nulls', () => {
    expect(diveOf(el('div', {}, [], { '[data-bubbles]': el('span', { 'data-bubbles': 'pearl' }), '[data-dive]': el('span', { 'data-dive': 'chase' }) }))).toEqual({ bubbles: 'pearl', dive: 'chase' });
    expect(diveOf(el('div'))).toEqual({ bubbles: null, dive: null });
  });
});

describe('fxLog', () => {
  it('keeps the last `max` effects, oldest first', () => {
    const log = fxLog(2);
    log.add('ring', 1, 2, undefined, 10);
    log.add('zap', 3, 4, '#fff', 20);
    log.add('ring', 5, 6, '#ddefff', 30);
    expect(log.list()).toEqual([{ kind: 'zap', x: 3, z: 4, v: '#fff', at: 20 }, { kind: 'ring', x: 5, z: 6, v: '#ddefff', at: 30 }]);
  });
});

describe('controls', () => {
  it('lists every shown control by kind and id with its box, stacked or not; no zero-size ones', () => {
    const mineBtn = el('button', { class: 'vil' }, [], {}, [10, 20, 30, 40]), menu = el('button', { class: 'ribbon', 'aria-label': 'メニュー' }, [], {}, [1, 2, 3, 4]);
    Object.assign(mineBtn, { parentElement: actor });
    const doorAt = Object.assign(Object.create(door), { getBoundingClientRect: () => ({ left: 5, top: 6, width: 7, height: 8 }) });
    const root = { querySelectorAll: (s: string) => (s === 'button, a, [role="button"]' ? [mineBtn, doorAt, menu, el('button')] : []) } as unknown as ParentNode;
    expect(controlsOf(root)).toEqual([
      { kind: 'villager', id: 'mine', box: { left: 10, top: 20, width: 30, height: 40 } },
      { kind: 'building', id: 'museum', box: { left: 5, top: 6, width: 7, height: 8 } },
      { kind: 'ui', id: 'メニュー', box: { left: 1, top: 2, width: 3, height: 4 } }
    ]);
  });
});
