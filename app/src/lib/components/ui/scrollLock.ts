// Round 10 (ios-scroll-audit H2): the page behind an open sheet / overlay must not scroll. showModal() makes the
// page inert to clicks, not to touch scrolling, so every modal surface (Sheet, HarvestOverlay) takes a lock while
// it is open; `:root.sheet-open { overflow: hidden }` (styles/theme.css) holds while any lock is held. Ref-counted,
// so closing one of two stacked sheets keeps the page locked.
let held = 0;

/** Take the lock; call the returned function once to release it. */
export function lockScroll(): () => void {
  if (held++ === 0) document.documentElement.classList.add('sheet-open');
  let done = false;
  return () => {
    if (done) return;
    done = true;
    if (--held === 0) document.documentElement.classList.remove('sheet-open');
  };
}
