// The on-screen keyboard (design.md §R): `{@attach keyboardInset}` sets `--kb` on the element to the keyboard's height
// (innerHeight − visualViewport.height − offsetTop) so a sticky action can ride above it, and scrolls a focused
// field to the centre once the keyboard is up. Used by Sheet and the pair page (round 8: one copy).
import type { Attachment } from 'svelte/attachments';
import { reducedMotion } from '../../time/clock.ts';

export const keyboardInset: Attachment<HTMLElement> = (node) => {
  const vv = window.visualViewport;
  const update = () => node.style.setProperty('--kb', `${vv ? Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)) : 0}px`);
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const focusin = (e: FocusEvent) => {
    const el = e.target as HTMLElement;
    if (!el.matches('input, textarea, select')) return;
    const t = setTimeout(() => {
      timers.delete(t);
      el.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
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
