// Where a `pop` sheet grows from (Sheet's variant="pop": the health popup, the ずかん, せってい): the middle of the HUD
// control's art, as --pop-x / --pop-y on the root (the sheet's zoom origin), set by the button just before it opens.
export function popFrom(el: Element | undefined | null): void {
  const r = el?.getBoundingClientRect();
  if (!r?.width) return;
  const root = document.documentElement;
  root.style.setProperty('--pop-x', `${Math.round(r.left + r.width / 2)}px`);
  root.style.setProperty('--pop-y', `${Math.round(r.top + r.height / 2)}px`);
}
