// ジム's acts (docs/design.md "Bots"), outliving the page: the settings last answered (`confirmed`), the acts not yet
// answered (`queue`, the first on its way) and how many have answered. An act goes out after the ones before it, each
// with its days' bases as the last answer left them, with config.ts's timeout only: closing ボット or picking another tab
// never aborts one nor drops the rest (a 取り消す tapped after a close is sent, and its answer counted). The shown page
// attaches (`attach`) to hear each answer (its banner, its note, a flash); with none attached a failure is a toast and
// the dot is read again (summary.svelte.ts refresh).
import { t } from '#lib/i18n/index.ts';
import { toasts } from '#lib/ui-state/toast.svelte.ts';
import { postAct, type ActReply, type GymConfig } from '#lib/gym/config.ts';
import { predictAll, withBase } from '#lib/gym/calendar.ts';
import type { ActInput } from '#lib/gym/contract.ts';
import { refresh } from './summary.svelte.ts';

interface Act { input: ActInput; undoable: boolean }
/** What the page does with an answer (it took the config already: `acts.confirmed`). */
export type OnAnswer = (q: Act, r: ActReply, was: GymConfig) => void;

/** (raw: a config is replaced whole, never deep-proxied) */
class Acts {
  confirmed = $state.raw<GymConfig | null>(null);
  queue = $state.raw<Act[]>([]);
  answered = $state(0);
}
export const acts = new Acts();
const done: ((ok: boolean) => void)[] = [];
let hear: OnAnswer | null = null;

/** The shown page hears the answers while mounted; the returned function lets go. */
export function attach(f: OnAnswer): () => void {
  hear = f;
  return () => void (hear === f && (hear = null));
}

/** A config with an act predicted on it (the page shows it at once; the answer replaces it). */
const predicted = (c: GymConfig, input: ActInput): GymConfig => ({
  ...c, rows: predictAll(c.rows, input, c.defaultDays),
  ...(input.a === 'pause' || input.a === 'resume' ? { paused: input.a === 'pause' } : input.a === 'interval' ? { intervalMin: input.m } : {})
});

/** The settings to show: the last answer with the acts still queued predicted on it. */
export const shownConfig = (): GymConfig | null => acts.confirmed && acts.queue.reduce((c, q) => predicted(c, q.input), acts.confirmed);

/** One change: queued (shown at once), then sent after the ones before it. Resolves when answered: true when applied. */
export function send(input: ActInput, undoable = true): Promise<boolean> {
  if (!acts.confirmed) return Promise.resolve(false);
  return new Promise((resolve) => {
    acts.queue = [...acts.queue, { input, undoable }];
    done.push(resolve);
    if (acts.queue.length === 1) void drain();
  });
}

/** The queue's acts, in turn: each with the bases and the rows of the latest config when it goes out. */
async function drain() {
  while (acts.queue.length && acts.confirmed) {
    const q = acts.queue[0];
    const was = acts.confirmed;
    const r = await postAct(withBase(q.input, was.rows));
    acts.answered++;
    acts.queue = acts.queue.slice(1);
    const resolve = done.shift();
    acts.confirmed = r.config ?? was;
    if (hear) hear(q, r, was);
    else {
      if (!r.ok) toasts.show(t('gym.err.failed'));
      void refresh('gym', 'focus');
    }
    resolve?.(r.ok);
  }
}
