// けっこんしき's メモ being written, held by the sheet's chunk rather than the note's view (Notes.svelte): the draft
// outlives a level change, a tab and the sheet closing (✕ keeps it on this phone; the next opening is back in the
// editor), and a pick between crossed versions waits out its とりけす banner before it's saved.
//   pad.editing / draft          the editor and its text
//   write() / merge() / save() / cancel() / pick()
import { tick } from 'svelte';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { t } from '#lib/i18n/index.ts';
import { board } from './board.svelte.ts';

/** How long a pick can still be taken back (its banner's life). */
const PICK_MS = 5000;
const HOLD_MS = 60_000;

export const pad = $state({
  editing: false,
  draft: '',
  /** The held note's `at` the edit began from (null: there was none). */
  base: null as number | null,
  /** The text the edit began from (null: a merge, always saved). */
  start: null as string | null,
  /** A version picked, not yet saved (its banner's とりけす takes it back). */
  picked: null as string | null
});

function begin(draft: string, base: number | null, start: string | null) {
  Object.assign(pad, { editing: true, draft, base, start });
}

/** ✎ かく: the held note in the field. */
export const write = (): void => begin(board.note?.md ?? '', board.note?.at ?? null, board.note?.md ?? '');

/** ふたつ あわせる: both crossed versions in the field, saved from the held one. */
export function merge(): void {
  const c = board.conflict;
  if (c) begin([c.other.md, c.current.md].filter((m) => m.trim()).join('\n\n'), c.current.at, null);
}

export const cancel = (): void => void (pad.editing = false);

/** ほぞん: nothing sent when the text is the one the edit began from (the other phone's save since is no conflict of
 *  mine); the banner only when it was kept with no crossing. */
export async function save(): Promise<void> {
  if (pad.draft === pad.start) return cancel();
  // refused (too big for the record, links and marks counted): the draft stays, said why
  if (!board.saveNote(pad.draft, pad.base)) return toasts.show(t('wed.note.tooBig'), 3200, { low: true });
  pad.editing = false;
  await tick();
  if (!board.conflict) toasts.show(t('wed.note.saved'), 2000, { low: true });
}

let timer: ReturnType<typeof setTimeout> | null = null;
function settle() {
  const md = pad.picked, at = board.conflict?.current.at;
  undo();
  if (md !== null && at !== undefined) board.saveNote(md, at);
}
function undo() {
  if (timer) clearTimeout(timer);
  timer = null;
  pad.picked = null;
}
const arm = (ms: number) => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(settle, ms);
};

/** これに する: shown at once, saved when its banner goes (とりけす: both versions again). */
export function pick(md: string): void {
  if (pad.picked !== null) settle();
  pad.picked = md;
  arm(PICK_MS);
  toasts.show(t('wed.note.picked'), PICK_MS, {
    action: { label: t('common.undo'), run: undo },
    // the banner held while it's touched (a minute at most) and let go: the save waits with it; dismissed: saved now
    hold: (ms) => {
      if (ms === 0) settle();
      else arm(ms ?? HOLD_MS);
      return ms ?? HOLD_MS;
    }
  });
}

/** The sheet closing: a pick waiting on its banner is saved now. */
export const flush = (): void => void (pad.picked !== null && settle());
