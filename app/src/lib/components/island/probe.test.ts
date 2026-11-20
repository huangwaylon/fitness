import { describe, expect, it } from 'vitest';
import { areaOf, boxOf, CONTROLS, controlsOf, fxLog, pickOf } from './probe.ts';

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
const tapArea = (n: Fake) => /^(BUTTON|A)$/.test(n.tagName) || n.getAttribute('role') === 'button' || n.getAttribute('data-fx') === 'talk';
const underTapArea = (n: Fake | null): boolean => !!n && (tapArea(n) || underTapArea(n.parentElement as Fake | null));

// a stage like the island's: the talk balloon, the HUD's link and buttons, bare nodes (the island's things, the
// villagers too, have no nodes: their tap areas are the 3D island's, world3d/pick3d.ts)
const who = el('span', { class: 'who' });
const stage = el('div', { class: 'stage' }, [
  el('button', { class: 'say', 'data-fx': 'talk' }, [who]),
  el('a', { href: '/x' }), el('div', { role: 'button', 'aria-label': '設定' }), el('button', { class: 'ribbon x', 'aria-label': 'メニュー' }),
  el('div', { class: 'ground' }, [el('span')])
]);

describe('pick: what a tap goes to', () => {
  it('names each thing by kind and id, a node inside its tap area the same', () => {
    expect(pickOf(who)).toEqual({ kind: 'talk', id: '', also: [] });
    const kinds = stage.kids.map((n) => pickOf(each(n).at(-1)!)).map((p) => p && `${p.kind}:${p.id}`);
    expect(kinds).toEqual(['talk:', 'ui:a', 'ui:設定', 'ui:メニュー', null]);
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
      else throw new Error(`${p.kind}:${p.id} outside a control`);
    }
  });
});

describe('box: where a thing is', () => {
  it("gives the speech balloon's box; null when not there; an island thing has no DOM", () => {
    const root = el('div', {}, [], { '[data-fx="talk"]': el('button', {}, [], {}, [100, 200, 48, 64]) });
    expect(boxOf(root, 'talk')).toEqual({ left: 100, top: 200, width: 48, height: 64, foot: null });
    expect(boxOf(el('div'), 'talk')).toBeNull();
    expect(areaOf('villager').area).toEqual([]);
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
    const talk = el('button', { 'data-fx': 'talk' }, [], {}, [10, 20, 30, 40]), menu = el('button', { class: 'ribbon', 'aria-label': 'メニュー' }, [], {}, [1, 2, 3, 4]);
    const root = { querySelectorAll: (s: string) => (s === 'button, a, [role="button"]' ? [talk, menu, el('button')] : []) } as unknown as ParentNode;
    expect(controlsOf(root)).toEqual([
      { kind: 'talk', id: '', box: { left: 10, top: 20, width: 30, height: 40 } },
      { kind: 'ui', id: 'メニュー', box: { left: 1, top: 2, width: 3, height: 4 } }
    ]);
  });
});
