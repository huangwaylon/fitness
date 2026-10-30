// Every tap's sound (docs/design/sound.md §13 "Every tap"), from one delegated listener instead of a cue() in each
// handler. A control names its sound in `data-sfx`:
//   <button data-sfx="open">     a cue from TAP_SFX, played on the click: a commit, so never on a scroll or a drag
//   data-sfx="self"              the handler plays the outcome's own cue (buy → purchase,
//                                the phone's open tune), so the tap adds nothing: no double sounds
//   data-sfx="none"              deliberately silent (a text field: the system keyboard has its own clicks)
// A control that can't act right now carries aria-disabled="true" instead of `disabled` (it stays focusable and
// still receives the tap): the click is swallowed before the page sees it, and the gentle "can't" boop plays (NH
// when you can't afford something). Every tappable in components/routes has a data-sfx (taps.test.ts).
import { CUES, cue, type Cue } from './cues.ts';

/** The cues a control may name. */
export const TAP_SFX = [
  'tick', 'open', 'confirm', 'back', 'toggle-on', 'toggle-off', 'page', 'sync', 'remove', 'undo', 'choice-pick'
] as const satisfies readonly Cue[];
type TapCue = (typeof TAP_SFX)[number];

const isTap = (s: string | null): s is TapCue => !!s && (TAP_SFX as readonly string[]).includes(s) && s in CUES;

function onClick(e: MouseEvent): void {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const off = target.closest('[aria-disabled="true"]');
  if (off && off.matches('button, a, [role]')) {
    e.preventDefault(); // no form submit, no link
    e.stopPropagation(); // the page's handlers never see it (capture on the document runs first)
    cue('boop');
    return;
  }
  const s = target.closest('[data-sfx]')?.getAttribute('data-sfx') ?? null;
  if (isTap(s)) cue(s);
}

/** Once, in the root layout, after startSound (its unlock listener must run first, so the tap can sound). */
export function startTaps(): () => void {
  document.addEventListener('click', onClick, { capture: true });
  return () => document.removeEventListener('click', onClick, { capture: true });
}
