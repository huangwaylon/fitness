// A photo that can't load (offline and never seen, docs/backend.md "Service worker" › Offline) shows the paper with a
// small picture icon in its box, not WebKit's "?" (docs/design.md "Unified kit"). An attachment on the <img>:
//   <img {src} alt="" {@attach photoFallback} />
// It keeps the box the width and height attributes give it, and lets go once a new src loads.
const ICON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A88B68" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m4 17.5 5-5 4 4 2.5-2.5 4.5 4.5"/></svg>'
)}`;

export function photoFallback(img: HTMLImageElement): () => void {
  let kept: string | null = null;
  const swap = () => {
    if (kept !== null || img.currentSrc === ICON) return;
    kept = img.style.cssText;
    const w = img.getAttribute('width'), h = img.getAttribute('height');
    if (w && h) img.style.aspectRatio = `${w} / ${h}`;
    img.style.objectFit = 'none';
    img.style.objectPosition = 'center';
    img.style.background = 'var(--c-paper)';
    img.dataset.missing = '';
    img.removeAttribute('srcset');
    img.src = ICON;
  };
  // a new photo in (the src changed): its own look back
  const loaded = () => {
    if (kept === null || img.currentSrc === ICON) return;
    img.style.cssText = kept;
    kept = null;
    delete img.dataset.missing;
  };
  if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) swap();
  img.addEventListener('error', swap);
  img.addEventListener('load', loaded);
  return () => {
    img.removeEventListener('error', swap);
    img.removeEventListener('load', loaded);
  };
}
