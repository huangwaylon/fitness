// A tap lands where the finger was (docs/design.md "Tap targets"; the user: "tapping the river sometimes opens the shop").
// WebKit (and Blink) adjust a touch's click: when the point under the finger isn't itself something that answers a
// click (the 3D island's stage, the tent's or the museum's canvas), they move the click onto the nearest element that
// does (a button, an element with a click listener, `cursor: pointer` or a :hover / :active rule) within the finger's
// radius, its point moved onto it too. Over the island that's a door a few px off the sea by the horizon, or a back
// button beside the room's floor. The touch's own pointer events are never adjusted, so in the places marked
// `data-exact-taps` a touch's click is taken from its pointerup's point: the native click, when it was moved (another
// element, or the same one a px or more off), is dropped before anything sees it (a window capture listener, the
// first there is) and the click goes to what's under the finger, at its point, from inside the native click's dispatch
// (the tap's user activation, the sound's unlock, as before). The click as it was otherwise: a mouse's, a keyboard's or
// VoiceOver's (no tap just before it), a drag's (the gestures' own rule), a click outside those places. The island's
// buttons stay buttons for VoiceOver and the keyboard; touch just never snaps onto them.

/** Where the touch lifted: client px, when (performance.now()), whether it moved off its pointerdown. */
export interface Lift { x: number; y: number; t: number; moved: boolean }

/** Movement (px) before a touch is no tap (gestures.ts SLOP's). */
const SLOP = 8;
/** A click this long after its pointerup is no tap's (iOS clicks at once once a page can't double-tap zoom). */
const CLICK_MS = 1000;
/** What a click is re-aimed for: inside one of these, or moved onto one from outside. */
export const ROOT = '[data-exact-taps]';

/** What a trusted click does, given the last tap's lift and what's under its point now (`under`): `keep` it as it
 *  came, or `move` it there (none: under nothing, dropped). Pure: exactTaps.test. */
export function aim(click: { target: Element | null; x: number; y: number; t: number }, lift: Lift | null, under: Element | null): 'keep' | 'move' {
  if (!lift || lift.moved || click.t - lift.t > CLICK_MS || click.t < lift.t) return 'keep';
  if (!click.target?.closest(ROOT) && !under?.closest(ROOT)) return 'keep';
  if (click.target === under && Math.abs(click.x - lift.x) < 1 && Math.abs(click.y - lift.y) < 1) return 'keep';
  return 'move';
}

/** Once, in the root layout (before anything else listens for clicks on the window). Returns the cleanup. */
export function startExactTaps(): () => void {
  let down: { id: number; x: number; y: number; moved: boolean } | null = null;
  let lift: Lift | null = null;
  const onDown = (e: PointerEvent) => {
    lift = null;
    // a second finger: a pinch, no tap
    down = e.isPrimary ? { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false } : null;
  };
  const onMove = (e: PointerEvent) => {
    if (down && e.pointerId === down.id && Math.hypot(e.clientX - down.x, e.clientY - down.y) >= SLOP) down.moved = true;
  };
  const onUp = (e: PointerEvent) => {
    if (!down || e.pointerId !== down.id) return;
    lift = { x: e.clientX, y: e.clientY, t: performance.now(), moved: down.moved || Math.hypot(e.clientX - down.x, e.clientY - down.y) >= SLOP };
    down = null;
  };
  const onCancel = () => ((down = null), (lift = null));
  const onClick = (e: MouseEvent) => {
    if (!e.isTrusted) return;
    const l = lift;
    lift = null;
    if (!l) return;
    const under = document.elementFromPoint(l.x, l.y);
    if (aim({ target: e.target instanceof Element ? e.target : null, x: e.clientX, y: e.clientY, t: performance.now() }, l, under) === 'keep') return;
    e.stopImmediatePropagation();
    e.preventDefault();
    under?.dispatchEvent(new MouseEvent('click', {
      bubbles: true, cancelable: true, composed: true, view: window, detail: e.detail, button: e.button, buttons: e.buttons,
      clientX: l.x, clientY: l.y, screenX: e.screenX + (l.x - e.clientX), screenY: e.screenY + (l.y - e.clientY),
      ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey, metaKey: e.metaKey
    }));
  };
  const opt = { capture: true, passive: true } as const;
  window.addEventListener('pointerdown', onDown, opt);
  window.addEventListener('pointermove', onMove, opt);
  window.addEventListener('pointerup', onUp, opt);
  window.addEventListener('pointercancel', onCancel, opt);
  window.addEventListener('click', onClick, true);
  return () => {
    window.removeEventListener('pointerdown', onDown, opt);
    window.removeEventListener('pointermove', onMove, opt);
    window.removeEventListener('pointerup', onUp, opt);
    window.removeEventListener('pointercancel', onCancel, opt);
    window.removeEventListener('click', onClick, true);
  };
}
