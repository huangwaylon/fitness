// Roving tabindex for a role=radiogroup (WAI-ARIA APG): only the checked radio is in the tab order (the template
// sets tabindex 0 / -1); the arrow keys, Home and End move to a sibling radio and select it.
import type { Attachment } from 'svelte/attachments';

const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

export const roving: Attachment<HTMLElement> = (group) => {
  function keydown(e: KeyboardEvent) {
    const items = [...group.querySelectorAll<HTMLElement>('[role=radio]')];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const n = items.length;
    const j = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : e.key in STEP ? (i + STEP[e.key] + n) % n : -1;
    if (j < 0) return;
    e.preventDefault();
    items[j].focus();
    items[j].click();
  }
  group.addEventListener('keydown', keydown);
  return () => group.removeEventListener('keydown', keydown);
};
