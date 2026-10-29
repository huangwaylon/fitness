// Roving tabindex for a role=radiogroup (WAI-ARIA APG): only the checked radio is in the tab order (the template
// sets tabindex 0 / -1); the arrow keys, Home and End move to a sibling radio and select it. In a wrapping grid
// (the villager picker) Up / Down move a whole row, i.e. by the number of radios on the first line.
import type { Attachment } from 'svelte/attachments';

const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export const roving: Attachment<HTMLElement> = (group) => {
  function keydown(e: KeyboardEvent) {
    const items = [...group.querySelectorAll<HTMLElement>('[role=radio]')];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const n = items.length;
    const top = items[0].offsetTop;
    const cols = items.findIndex((el) => el.offsetTop !== top);
    const vertical = (e.key === 'ArrowUp' || e.key === 'ArrowDown') && cols > 0;
    const j =
      e.key === 'Home' ? 0
      : e.key === 'End' ? n - 1
      : vertical ? Math.min(n - 1, Math.max(0, i + STEP[e.key] * cols))
      : e.key in STEP ? (i + STEP[e.key] + n) % n
      : -1;
    if (j === i) return e.preventDefault();
    if (j < 0) return;
    e.preventDefault();
    items[j].focus();
    items[j].click();
  }
  group.addEventListener('keydown', keydown);
  return () => group.removeEventListener('keydown', keydown);
};
