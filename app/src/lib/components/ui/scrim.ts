// A modal <dialog>'s scrim tap (Sheet, ui/ActionSheet): the click's target is the dialog
// and its point outside the dialog's box. A tap whose control moved from under it mid-press (a field's blur re-laying
// the sheet out) lands on the dialog itself, inside its box: not a dismiss.
export function onScrim(e: MouseEvent, dlg: HTMLDialogElement | undefined): boolean {
  if (!dlg || e.target !== dlg) return false;
  const r = dlg.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
}
