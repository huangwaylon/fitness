// The on-screen keyboard (design.md "Small screens"), from `visualViewport`: what's left of the screen above it.
//
// iOS Safari never resizes the layout viewport for the keyboard (`100vh`, `dvh` and `position: fixed; bottom: 0` stay
// behind it; `interactive-widget` isn't supported), and what it does change misleads: measured in the iOS 26 simulator
// (WebKit, a 402 × 714 viewport, a textarea at the bottom of a fixed overlay focused):
//   innerHeight 714 → 377 (it follows the visual viewport), documentElement.clientHeight 714 (the layout viewport),
//   visualViewport.height 377, offsetTop 337 and scrollY 337 (iOS scrolls the page up to the field even under
//   `overflow: hidden`), the fixed overlay's rect top −337 (scrolled up out of sight with the page).
// So `innerHeight − vv.height − vv.offsetTop` (what this used to read) is −337 → 0 on iOS: "no keyboard". Instead:
//   - `top`, `height`: where a `position: fixed` box goes to fill exactly the visible part (style top / height).
//   - `bottom`: the layout viewport below it (a fixed box's `bottom`; 0 when iOS scrolled the page instead).
//   - `clientTop`: the visible part's top in getBoundingClientRect's px (pageTop − scrollY: 0 on iOS above, offsetTop
//     where the browser leaves the page alone), its foot `clientTop + height`.
//   - `keyboard`: the keyboard's height, its suggestions bar included (0 when none; a pinch zoom is not a keyboard).
// `keyboardInset.current` is reactive (one listener for everyone); `readKeyboardInset()` reads it once,
// `onKeyboardInset(fn)` calls back on each change (the keyboard coming and going, iOS's scroll, a rotation).
// `{@attach withKeyboardInset}` sets `--kb` (= bottom) on a node and scrolls a focused field above the keyboard (Sheet,
// the pair page): fields get `scroll-margin-bottom: --kb` (styles/theme.css); a `[data-kb-scroll]` ancestor (the pair
// form: field + button) is scrolled into view as a whole, its bottom just above the keyboard.
import { createSubscriber } from 'svelte/reactivity';
import type { Attachment } from 'svelte/attachments';

interface KeyboardInset {
  top: number;
  height: number;
  bottom: number;
  clientTop: number;
  keyboard: number;
  /** A keyboard is up (taller than an accessory bar alone). */
  open: boolean;
}

/** Below this, a shrunk visual viewport is Safari's toolbars or a hardware keyboard's bar, not a keyboard. */
const OPEN_PX = 120;

export function readKeyboardInset(): KeyboardInset {
  if (typeof window === 'undefined') return { top: 0, height: 0, bottom: 0, clientTop: 0, keyboard: 0, open: false };
  const vv = window.visualViewport, layout = document.documentElement.clientHeight || innerHeight;
  if (!vv) return { top: 0, height: layout, bottom: 0, clientTop: 0, keyboard: 0, open: false };
  const top = Math.max(0, vv.offsetTop), height = vv.height;
  const keyboard = Math.max(0, Math.round(layout - height * (vv.scale || 1)));
  return {
    top, height, bottom: Math.max(0, Math.round(layout - top - height)), clientTop: (vv.pageTop ?? top) - (window.scrollY || 0),
    keyboard, open: keyboard >= OPEN_PX
  };
}

const fns = new Set<() => void>();
let bound = false;
function changed() {
  for (const fn of [...fns]) fn();
}
/** Calls `fn` on each change of the visible part; returns the unsubscribe. */
export function onKeyboardInset(fn: () => void): () => void {
  fns.add(fn);
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  if (!bound && typeof window !== 'undefined') {
    bound = true;
    vv?.addEventListener('resize', changed);
    vv?.addEventListener('scroll', changed);
    window.addEventListener('resize', changed);
    window.addEventListener('scroll', changed, { passive: true });
  }
  return () => {
    fns.delete(fn);
    if (fns.size || !bound) return;
    bound = false;
    vv?.removeEventListener('resize', changed);
    vv?.removeEventListener('scroll', changed);
    window.removeEventListener('resize', changed);
    window.removeEventListener('scroll', changed);
  };
}

const subscribe = createSubscriber((update) => onKeyboardInset(update));
/** The visible part of the screen above the keyboard, reactive (in an effect, a $derived or the markup). */
export const keyboardInset = {
  get current(): KeyboardInset {
    subscribe();
    return readKeyboardInset();
  }
};

/** `--kb` on the node (the keyboard's cover of the layout viewport), and a focused field scrolled above it. */
export const withKeyboardInset: Attachment<HTMLElement> = (node) => {
  const update = () => node.style.setProperty('--kb', `${readKeyboardInset().bottom}px`);
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const focusin = (e: FocusEvent) => {
    const el = e.target as HTMLElement;
    if (!el.matches('input, textarea, select')) return;
    const box = el.closest<HTMLElement>('[data-kb-scroll]');
    const t = setTimeout(() => {
      timers.delete(t);
      // (only while it's still the one focused: a row tapped meanwhile, the field blurred, keeps its own scroll)
      if (document.activeElement === el) (box ?? el).scrollIntoView({ block: box ? 'end' : 'center', behavior: 'smooth' });
    }, 300);
    timers.add(t);
  };
  update();
  const off = onKeyboardInset(update);
  node.addEventListener('focusin', focusin);
  return () => {
    off();
    node.removeEventListener('focusin', focusin);
    for (const t of timers) clearTimeout(t);
    node.style.removeProperty('--kb');
  };
};
