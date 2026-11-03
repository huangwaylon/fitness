// A simulated on-screen keyboard (ui/keyboardInset.svelte.ts): Playwright can't show iOS's, so `visualViewport` is
// stubbed as iOS changes it. `fakeKeyboard(page)` before the page loads; `keyboard(page, px)` shows one (px: an iPhone
// 15's keyboard with its suggestions bar, KEYBOARD_PX), `keyboard(page, 0)` hides it. As on iOS the layout viewport
// stays (documentElement.clientHeight, a fixed box's inset 0) while visualViewport.height and innerHeight shrink, so a
// view that reads `innerHeight − vv.height` sees no keyboard, as it did on the phones.
import type { Page } from '@playwright/test';

/** An iPhone 15's keyboard (Japanese or English) with its suggestions bar, in CSS px. */
export const KEYBOARD_PX = 336;

export async function fakeKeyboard(page: Page) {
  await page.addInitScript(() => {
    const W = window as unknown as { __kb?: (px: number, offsetTop?: number) => void };
    const ih = Object.getOwnPropertyDescriptor(window, 'innerHeight') ?? Object.getOwnPropertyDescriptor(Window.prototype, 'innerHeight');
    const realIH = () => (ih?.get ? (ih.get.call(window) as number) : document.documentElement.clientHeight);
    const et = new EventTarget();
    let kb = 0, off = 0;
    const layout = () => document.documentElement.clientHeight || realIH();
    const vv = {
      get width() { return document.documentElement.clientWidth; },
      get height() { return layout() - kb; },
      get offsetTop() { return off; },
      get offsetLeft() { return 0; },
      get pageTop() { return window.scrollY + off; },
      get pageLeft() { return window.scrollX; },
      get scale() { return 1; },
      onresize: null, onscroll: null,
      addEventListener: et.addEventListener.bind(et),
      removeEventListener: et.removeEventListener.bind(et),
      dispatchEvent: et.dispatchEvent.bind(et)
    };
    Object.defineProperty(window, 'visualViewport', { configurable: true, get: () => vv });
    Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => realIH() - kb });
    W.__kb = (px, offsetTop = 0) => {
      kb = px;
      off = offsetTop;
      // drawn where iOS's would be (screenshots), never in the way of a tap
      let el = document.getElementById('fake-keyboard');
      if (!el) {
        el = document.createElement('div');
        el.id = 'fake-keyboard';
        el.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;pointer-events:none;background:repeating-linear-gradient(#D1D5DB 0 52px,#C3C7CF 52px 56px);box-shadow:0 -1px 0 #A9ADB5';
        document.documentElement.appendChild(el);
      }
      el.style.height = `${px}px`;
      el.style.display = px ? 'block' : 'none';
      et.dispatchEvent(new Event('resize'));
      et.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('resize'));
    };
  });
}

/** Shows (px > 0) or hides (0) the simulated keyboard. */
export async function keyboard(page: Page, px: number) {
  await page.evaluate((px) => (window as unknown as { __kb(px: number): void }).__kb(px), px);
}

/** A box's client rect within the visible part above the simulated keyboard (and the screen's sides). */
export async function aboveKeyboard(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const r = document.querySelector(sel)!.getBoundingClientRect(), vv = window.visualViewport!;
    const top = vv.pageTop - window.scrollY, foot = top + vv.height;
    return { top: r.top, bottom: r.bottom, foot, ok: r.height > 0 && r.top >= top - 0.5 && r.bottom <= foot + 0.5 && r.left >= -0.5 && r.right <= vv.width + 0.5 };
  }, selector);
}
