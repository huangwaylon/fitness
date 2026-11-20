import { describe, expect, it } from 'vitest';
import { actorOf, areaOf, boxOf, CONTROLS, controlsOf, fruitOf, fxLog, goalOf, pickOf, propsOf, type BoxKind } from './probe.ts';

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
const ATTRS = ['data-actor'];
const tapArea = (n: Fake) => /^(BUTTON|A)$/.test(n.tagName) || n.getAttribute('role') === 'button' || ATTRS.some((a) => n.hasAttribute(a)) || n.getAttribute('data-fx') === 'talk';
const underTapArea = (n: Fake | null): boolean => !!n && (tapArea(n) || underTapArea(n.parentElement as Fake | null));

// a stage like the island's: a villager, a goal tree and its fruit row, the talk balloon, a visitor, the HUD's link
// and buttons, bare nodes (the scenery, the decor, the buildings, a tree shake's swarm and pick-ups, the board and the
// balloon have no nodes: their tap areas are the 3D island's, world3d/pick3d.ts)
const body = el('span', { class: 'body', 'data-act': 'hop' });
const vil = el('button', { class: 'vil' }, [el('span', {}, [body])]);
const actor = el('div', { class: 'actor walking', 'data-actor': 'mine', 'data-seat': 'bench-1', 'data-who': 'B', 'data-v3': '' }, [vil], { '.vil .body': body, '[data-hat]': el('span'), '.vil .fxa': el('span', { class: 'fxa sparkles' }) });
const trunk = el('button', { class: 'trunk-btn' }), canopy = el('button', { class: 'canopy' });
const stage = el('div', { class: 'stage' }, [
  actor,
  el('div', { class: 'node', 'data-tree-node': 'A' }, [el('div', { class: 'tree' }), trunk]),
  el('div', { class: 'node' }, [el('div', { class: 'tree' }), canopy]),
  el('div', { class: 'node' }, [el('button', { class: 'row-btn', 'data-tree-row': 'A' })]),
  el('button', { class: 'say', 'data-fx': 'talk' }, [el('span', { class: 'who' })]),
  el('a', { href: '/x' }), el('div', { role: 'button', 'aria-label': '設定' }), el('button', { class: 'ribbon x', 'aria-label': 'メニュー' }),
  el('div', { class: 'ground' }, [el('span')])
]);

describe('pick: what a tap goes to', () => {
  it('names each thing by kind and id, a node inside its tap area the same', () => {
    expect(pickOf(body)).toEqual({ kind: 'villager', id: 'mine', also: [] });
    expect(pickOf(trunk)).toMatchObject({ kind: 'goal', id: 'A' });
    expect(pickOf(canopy)).toMatchObject({ kind: 'goal', id: 'A' });
    const kinds = stage.kids.map((n) => pickOf(each(n).at(-1)!)).map((p) => p && `${p.kind}:${p.id}`);
    expect(kinds).toEqual([
      'villager:mine', 'goal:A', 'goal:A', 'row:A', 'talk:', 'ui:a', 'ui:設定', 'ui:メニュー', null
    ]);
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
      // (a node in a villager's or a visitor's holder: none hit-tests on the island)
      else expect(['villager', 'visitor'], `${p.kind}:${p.id}`).toContain(p.kind);
    }
  });
});

describe('box: where a thing is', () => {
  it('unites a goal tree\'s canopy and trunk; gives a node\'s foot; null when not there', () => {
    const root = el('div', {}, [], {
      '[data-tree-node="A"] + .node .canopy': el('button', {}, [], {}, [10, 20, 40, 30]),
      '[data-tree-node="A"] .trunk-btn': el('button', {}, [], {}, [20, 45, 20, 25]),
      '[data-tree-node="A"]': el('div', {}, [], {}, [30, 70, 0, 0]),
      '[data-actor="mine"] .vil': el('button', {}, [], {}, [100, 200, 48, 64]),
      '[data-actor="mine"]': el('div', {}, [], {}, [124, 264, 0, 0])
    });
    expect(boxOf(root, 'goal', 'A')).toEqual({ left: 10, top: 20, width: 40, height: 50, foot: [30, 70] });
    expect(boxOf(root, 'villager', 'mine')).toEqual({ left: 100, top: 200, width: 48, height: 64, foot: [124, 264] });
    expect(boxOf(root, 'villager', 'partner')).toBeNull();
  });

  it('every kind has a tap area; ids are quoted', () => {
    const kinds: BoxKind[] = ['villager', 'goal', 'row', 'talk', 'arch', 'toy', 'fruit', 'trunk'];
    for (const k of kinds) expect(areaOf(k, 'x').area.length, k).toBeGreaterThan(0);
    expect(areaOf('villager', 'a"b').area).toEqual(['[data-actor="a\\"b"] .vil']);
    expect(areaOf('fruit', 'B:apple').area).toEqual(['.fruit[data-tree="B"][data-fruit="apple"]']);
  });
});

describe('goal: a goal tree as shown', () => {
  it('its popup open (the canopy expanded); null for no such tree', () => {
    const open = el('button', { class: 'canopy', 'aria-expanded': 'true' }), shut = el('button', { class: 'canopy', 'aria-expanded': 'false' });
    const root = el('div', {}, [], { '[data-tree-node="A"] + .node .canopy': open, '[data-tree-node="B"] + .node .canopy': shut });
    expect(goalOf(root, 'A')).toEqual({ open: true });
    expect(goalOf(root, 'B')).toEqual({ open: false });
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

describe('props: the day\'s things out', () => {
  const vis = (n: Fake, on: boolean) => Object.assign(n, { checkVisibility: () => on });
  it('reads the DOM\'s props: the arch, the toys, Halloween and its pumpkins (lit); none out: empty', () => {
    const pic = (box = [1, 2, 3, 4]) => el('img', {}, [], {}, box);
    const lantern = el('span', { 'data-pumpkin': '' }, [], { '.art': pic(), '.glow': el('span') }), pumpkin = el('span', { 'data-pumpkin': '' }, [], { '.art': vis(pic(), false) });
    const q: Record<string, Fake> = {
      '[data-arch]': el('span', { 'data-arch': '' }, [], { '.official': pic() }), '[data-halloween]': el('div', { 'data-halloween': 'night' })
    };
    const lists: Record<string, Fake[]> = { '[data-toy]': [el('span', { 'data-toy': '' }, [], { '.art': pic() })], '[data-pumpkin]': [lantern, pumpkin] };
    const root = { querySelector: (s: string) => q[s] ?? null, querySelectorAll: (s: string) => lists[s] ?? [] } as unknown as ParentNode;
    const at = { shown: true, box: { left: 1, top: 2, width: 3, height: 4 } };
    expect(propsOf(root)).toEqual({
      arch: at, toys: [at], halloween: 'night',
      pumpkins: [{ lit: true, ...at }, { lit: false, ...at, shown: false }]
    });
    expect(propsOf(el('div'))).toEqual({ arch: null, toys: [], halloween: null, pumpkins: [] });
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
    const root = { querySelectorAll: (s: string) => (s === 'button, a, [role="button"]' ? [mineBtn, menu, el('button')] : []) } as unknown as ParentNode;
    expect(controlsOf(root)).toEqual([
      { kind: 'villager', id: 'mine', box: { left: 10, top: 20, width: 30, height: 40 } },
      { kind: 'ui', id: 'メニュー', box: { left: 1, top: 2, width: 3, height: 4 } }
    ]);
  });
});
