// A popover's way shut (a bubble, a fold-out menu): while attached, a tap outside it or Esc calls `close`. The tap is
// seen in the capture phase, so it folds the popover whatever it lands on and still goes where it was aimed.
// `inside`: what counts as inside (a selector, for a popover whose parts aren't in one element: Shop's ⓘ and its
// bubble); by default the element it's attached to. `stopEsc`: Esc folds this only, not the sheet it sits in.
// `onesc`: after an Esc (the menu's leaf takes the focus back). Use: {@attach open && dismiss(() => (open = false))}.
import type { Attachment } from 'svelte/attachments';

export interface DismissOptions {
  inside?: string;
  stopEsc?: boolean;
  onesc?: () => void;
}

export const dismiss = (close: () => void, { inside, stopEsc = false, onesc }: DismissOptions = {}): Attachment<Element> => (el) => {
  const down = (e: PointerEvent) => {
    const t = e.target;
    const within = inside ? t instanceof Element && !!t.closest(inside) : t instanceof Node && el.contains(t);
    if (!within) close();
  };
  const key = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    if (stopEsc) {
      e.stopPropagation();
      e.preventDefault();
    }
    close();
    onesc?.();
  };
  document.addEventListener('pointerdown', down, true);
  document.addEventListener('keydown', key, stopEsc);
  return () => {
    document.removeEventListener('pointerdown', down, true);
    document.removeEventListener('keydown', key, stopEsc);
  };
};
