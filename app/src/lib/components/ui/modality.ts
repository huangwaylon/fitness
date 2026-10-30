// The last input modality on <html data-input="pointer|keyboard"> (round 19, user: "the しまフォン icons get a weird
// outline if I tap them and then go back"). Focus is still restored after ‹ back, after an edit and when a sheet
// opens, for keyboard and VoiceOver users; but WebKit shows :focus-visible on a programmatic focus that follows a
// touch, so theme.css hides the ring while the last input was a pointer. Text fields keep their own focus styles.
const KEYS = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'Escape', 'Home', 'End']);

export function startModality(): () => void {
  const root = document.documentElement;
  const set = (m: 'pointer' | 'keyboard') => {
    if (root.dataset.input !== m) root.dataset.input = m;
  };
  const onPointer = () => set('pointer');
  const onKey = (e: KeyboardEvent) => {
    if (KEYS.has(e.key) && !e.metaKey && !e.ctrlKey) set('keyboard');
  };
  document.addEventListener('pointerdown', onPointer, true);
  document.addEventListener('keydown', onKey, true);
  return () => {
    document.removeEventListener('pointerdown', onPointer, true);
    document.removeEventListener('keydown', onKey, true);
  };
}
