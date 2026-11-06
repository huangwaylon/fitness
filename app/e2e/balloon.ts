// A speech balloon through a camera move (docs/design.md "Dialogue"): mid-pinch or mid-scroll the balloon stays whole
// (its cream box and tail drawn, not only its text: the user's bug, "the speech bubble disappears, leaving only the text,
// until we let go") and by its speaker. Shared by bubbles.spec.ts, say.spec.ts and museum.spec.ts.
import { expect, type Page } from './fixtures.ts';

type Pt = [number, number];
/** Touch fingers on the island (synthetic touch pointers: its gestures never capture them): each frame the fingers'
 *  points, 16 ms apart; the first frame puts them down unless they already are; they stay down (`liftFingers`). */
export const fingers = (page: Page, frames: Pt[][]) =>
  page.evaluate(async (frames) => {
    const W = window as unknown as { __fingers?: { el: Element; at: Pt[] } };
    const ev = (type: string, el: Element, id: number, [x, y]: Pt) =>
      el.dispatchEvent(new PointerEvent(type, { pointerId: 30 + id, pointerType: 'touch', isPrimary: id === 0, clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true, composed: true }));
    let rest = frames;
    if (!W.__fingers) {
      const el = document.elementFromPoint(...frames[0][0])!;
      frames[0].forEach((p, i) => ev('pointerdown', el, i, p));
      W.__fingers = { el, at: frames[0] };
      rest = frames.slice(1);
    }
    const f = W.__fingers;
    for (const fr of rest) {
      await new Promise((r) => setTimeout(r, 16));
      fr.forEach((p, i) => ev('pointermove', f.el, i, p));
      f.at = fr;
    }
  }, frames);
export const liftFingers = (page: Page) =>
  page.evaluate(() => {
    const W = window as unknown as { __fingers?: { el: Element; at: Pt[] } }, f = W.__fingers;
    if (!f) return;
    f.at.forEach(([x, y], i) => f.el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 30 + i, pointerType: 'touch', isPrimary: i === 0, clientX: x, clientY: y, bubbles: true, cancelable: true, composed: true })));
    W.__fingers = undefined;
  });
/** `n` frames of two fingers moving apart about (x, y), `d` px each a frame. */
export const spreading = (x: number, y: number, d: number, n: number, from = 0): Pt[][] =>
  Array.from({ length: n + 1 }, (_, i) => [[x - 45 - (from + i) * d, y], [x + 45 + (from + i) * d, y + 10]]);

/** The balloon `sel` as drawn: its box (the cream background, the tail with it) seen, not only its page's text, and how
 *  far its tail's tip is from the speaker's box (client px). */
export const balloonState = (page: Page, sel: string, speaker: string | { x: number; y: number }) =>
  page.evaluate(([sel, speaker]) => {
    const b = document.querySelector<HTMLElement>(sel);
    if (!b) return null;
    const cs = getComputedStyle(b), r = b.getBoundingClientRect();
    const text = b.querySelector('.pg.now, .text');
    const alpha = Number(/rgba?\(([^)]+)\)/.exec(cs.backgroundColor)?.[1].split(',')[3] ?? 1);
    const tail = parseFloat(cs.getPropertyValue('--tail')) || 0, side = b.getAttribute('data-side');
    const mx = r.left + r.width / 2, my = r.top + r.height / 2;
    const tip = side === 'bottom' ? [mx + tail, r.top - 9] : side === 'left' ? [r.right + 9, my + tail] : side === 'right' ? [r.left - 9, my + tail] : [mx + tail, r.bottom + 9];
    const s = typeof speaker === 'string' ? document.querySelector(speaker)!.getBoundingClientRect() : new DOMRect(speaker.x, speaker.y, 0, 0);
    const dist = Math.hypot(Math.max(s.left - tip[0], 0, tip[0] - s.right), Math.max(s.top - tip[1], 0, tip[1] - s.bottom));
    return {
      // the box itself: seen (visibility and opacity, every ancestor's too), a size, an opaque background
      box: b.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && r.width > 40 && r.height > 30 && alpha > 0.9,
      text: !!text && text.checkVisibility({ visibilityProperty: true, opacityProperty: true }),
      dist: Math.round(dist)
    };
  }, [sel, speaker] as const);

/** Mid-gesture: the balloon whole and its tail still at its speaker (within `near` px). */
export async function expectWhole(page: Page, sel: string, speaker: string | { x: number; y: number }, near: number) {
  const s = await balloonState(page, sel, speaker);
  expect(s, 'the balloon').not.toBeNull();
  expect(s!.box, 'its box drawn, not only its text').toBe(true);
  expect(s!.text, 'its text').toBe(true);
  expect(s!.dist, 'its tail by the speaker').toBeLessThanOrEqual(near);
}
