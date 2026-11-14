// A bot page's status (docs/design.md "Bots"), one hook for the three: the last known status at once (lastKnown.ts,
// `fresh` false: 更新中), then the poll (poll.svelte.ts: a read as the page mounts, then the driver's pollMs while
// shown); each good read sets the bot's dot (summary.svelte.ts accept), a failed one keeps the status shown under the
// page's LoadError (`failed`: its code, `offline`, `http 500`, a Worker's). `take(s)`: an answer that came otherwise
// (保養所's 保存, 開始). No first read when the bot was read well in the last WARM_MS (the menu unfolding, the
// sheet's background read): that status shown as fresh. Call from a component's script (statusPoll owns an $effect).
import type { BotDriver } from '#lib/bots/types.ts';
import { statusPoll, type Poll } from './poll.svelte.ts';
import { recall } from './lastKnown.ts';
import { accept, fail, pageRead, takeWarm } from './summary.svelte.ts';
import type { BotId } from './registry.ts';

const WARM_MS = 10_000;

export interface BotState<S> {
  readonly data: S | null;
  /** This page has read it (not only the kept one). */
  readonly fresh: boolean;
  /** The last read's failure code, or null. */
  readonly failed: string | null;
  /** The status shown is the kept one, a read on its way or failed (VerdictCard's 更新中). */
  readonly stale: boolean;
  readonly poll: Poll;
  take(s: S): void;
}

/** `onStatus`: a read's status goes there instead of `take` (保養所: an answer older than the shown one dropped, its
 *  draft weighed). */
export function useBot<S>(id: BotId, driver: BotDriver<S>, o: { skip?: () => boolean; onRead?: () => void; onStatus?: (s: S) => void } = {}): BotState<S> {
  const d = driver as BotDriver<unknown>;
  const st = $state({ data: recall(id, driver.parse), fresh: false, failed: null as string | null });

  function take(s: S) {
    st.data = s;
    st.fresh = true;
    st.failed = null;
    accept(id, s, d);
  }

  const poll = statusPoll(async (signal) => {
    o.onRead?.();
    pageRead(id, true, d);
    const r = await driver.fetch(signal).finally(() => pageRead(id, false));
    if (signal.aborted) return;
    if (r.ok) return void ((st.failed = null), (o.onStatus ?? take)(r.status));
    st.failed = [r.err, r.http].filter((x) => x !== null).join(' ');
    fail(id, r.err);
  }, () => driver.pollMs(st.data as S | null), o.skip, () => {
    const warm = takeWarm(id, WARM_MS) && st.data !== null;
    if (warm) (st.fresh = true), o.onRead?.();
    return warm;
  });

  return {
    get data() { return st.data as S | null; },
    get fresh() { return st.fresh; },
    get failed() { return st.failed; },
    get stale() { return !st.fresh && (poll.loading || !!st.failed); },
    poll,
    take
  };
}
