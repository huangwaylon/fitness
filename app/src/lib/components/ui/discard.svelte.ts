// A sheet's half-filled forms (docs/design.md "Navigation"): every way a sheet closes (✕, the backdrop, Esc) asks
// first while a form in it holds input not saved: 「入力した内容を破棄しますか？」 [破棄する] [編集を続ける] (ui/Sheet).
// A form inside the sheet registers how it knows (`guardForm`); a level that throws its draft away on ‹ asks through
// `askDiscard` (the sheet's own question). A form that is its own sheet passes Sheet's `dirty` instead.
import { getContext, setContext } from 'svelte';

interface Discard {
  /** Register a form's "anything unsaved?" (the returned function unregisters it). */
  form(dirty: () => boolean): () => void;
  /** Ask, then `run` on 破棄する. */
  ask(run: () => void): void;
}
const KEY = Symbol('discard');

/** In Sheet's setup: its forms and question, for what's inside it. */
export const provideDiscard = (d: Discard): Discard => setContext(KEY, d);

/** In a form's setup (inside a Sheet): `dirty` is read on every close of that sheet, while the form is mounted. */
export function guardForm(dirty: () => boolean): void {
  const d = getContext<Discard | undefined>(KEY);
  if (d) $effect(() => d.form(dirty));
}

/** In a component's setup (inside a Sheet): ask before `run` (no sheet around it: `run` at once). */
export function askDiscard(): (run: () => void) => void {
  const d = getContext<Discard | undefined>(KEY);
  return (run) => (d ? d.ask(run) : run());
}
