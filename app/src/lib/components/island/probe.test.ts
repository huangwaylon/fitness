import { describe, expect, it } from 'vitest';
import { actorOf, areaOf, boxOf, CONTROLS, fxLog, pickOf, type BoxKind } from './probe.ts';

/** A stand-in element: its tag, attributes and children (parentElement, previousElementSibling wired), and what its
 *  querySelector answers (`q`: selector → element). */
type Fake = Element & { kids: Fake[] };
function el(tag: string, attrs: Record<string, string> = {}, kids: Fake[] = [], q: Record<string, Fake> = {}, box = [0, 0, 0, 0]): Fake {
  const n = {
    tagName: tag.toUpperCase(), kids, parentElement: null as Fake | null, previousElementSibling: null as Fake | null,
    getAttribute: (k: string) => attrs[k] ?? null, hasAttribute: (k: string) => k in attrs,
    querySelector: (s: string) => q[s] ?? null,
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

// a stage like the island's: a villager, a door, the decor, a goal tree, the talk balloon, the board, a balloon, a tree
// shake's swarm and pick-up, scenery (a cedar, a bench that seats, a bush), the HUD's link and buttons, bare nodes
const body = el('span', { class: 'body', 'data-act': 'hop' });
const vil = el('button', { class: 'vil' }, [el('span', {}, [body])]);
const actor = el('div', { class: 'actor walking', 'data-actor': 'mine', 'data-seat': 'bench-1', 'data-who': 'B', 'data-v3': '' }, [vil], { '.vil .body': body, '[data-hat]': el('span') });
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
      'villager:mine', 'building:museum', 'decor:d3', 'goal:A', 'goal:A', 'talk:', 'board:', 'balloon:', 'swarm:mine', 'drop:c7',
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
    const kinds: BoxKind[] = ['villager', 'building', 'decor', 'goal', 'talk', 'board', 'balloon', 'swarm', 'drop', 'tree', 'bush', 'campfire', 'sit', 'fixture', 'flower', 'visitor', 'kk', 'cake', 'arch', 'toy', 'critter', 'find'];
    for (const k of kinds) expect(areaOf(k, 'x').area.length, k).toBeGreaterThan(0);
    expect(areaOf('sit', 'a"b').area).toEqual(['[data-sit="a\\"b"]']);
  });
});

describe('actor: a villager as shown', () => {
  it("reads its node's motion, walk, seat and marks", () => {
    const root = el('div', {}, [], { '[data-actor="mine"]': actor });
    expect(actorOf(root, 'mine')).toEqual({ act: 'hop', walking: true, inside: false, hat: true, stung: null, swollen: false, tricked: false, seat: 'bench-1', gym: null, who: 'B', v3: true });
    expect(actorOf(root, 'third')).toBeNull();
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
