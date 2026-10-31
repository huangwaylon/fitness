// The on-screen keyboard (design.md "Small screens"): `{@attach keyboardInset}` sets `--kb` on the element to the keyboard's height
// (innerHeight − visualViewport.height − offsetTop) so a sticky action can ride above it, and scrolls a focused
// field to the centre once the keyboard is up. Used by Sheet and the pair page.
// iOS does not shrink the layout viewport, so "centre" is taken in the part above the keyboard: fields get
// `scroll-margin-bottom: --kb` (styles/theme.css). A `[data-kb-scroll]` ancestor (the pair form: field + button)
// is scrolled into view as a whole, its bottom just above the keyboard.
import type { Attachment } from 'svelte/attachments';
import { reducedMotion } from '#lib/time/clock.ts';

export const keyboardInset: Attachment<HTMLElement> = (node) => {
  const vv = window.visualViewport;
  const update = () => node.style.setProperty('--kb', `${vv ? Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)) : 0}px`);
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const focusin = (e: FocusEvent) => {
    const el = e.target as HTMLElement;
    if (!el.matches('input, textarea, select')) return;
    const box = el.closest<HTMLElement>('[data-kb-scroll]');
    const t = setTimeout(() => {
      timers.delete(t);
      (box ?? el).scrollIntoView({ block: box ? 'end' : 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
    }, 300);
    timers.add(t);
  };
  update();
  vv?.addEventListener('resize', update);
  vv?.addEventListener('scroll', update);
  node.addEventListener('focusin', focusin);
  return () => {
    vv?.removeEventListener('resize', update);
    vv?.removeEventListener('scroll', update);
    node.removeEventListener('focusin', focusin);
    for (const t of timers) clearTimeout(t);
    node.style.removeProperty('--kb');
  };
};
