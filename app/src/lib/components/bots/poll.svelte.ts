// ボット's status reads (docs/design.md "Bots"), one loop for both tabs: a read as the page mounts, then the next
// `every()` ms after each (保養所 15 s or 60 s, ジム 60 s), only while the page is shown: none while the phone is put
// away (the next one as it comes back), and leaving the page (the other tab, the sheet closed: it unmounts) aborts the
// read in flight and stops the loop. `read` gets a signal aborted by a newer read, `hold()` or the page's end, and
// applies its answer only while it isn't. `skip()`: no read now (保養所 while its 保存 or 開始 answers with the status
// itself). `warm()` at mount: no read then, the timer started (a read that just happened elsewhere). Call from a
// component's script (it owns an $effect).
import { untrack } from 'svelte';

export interface Poll {
  /** A read now (the timer restarted after it). */
  refresh(): Promise<void>;
  /** The read in flight let go, the timer stopped (until `schedule()`). */
  hold(): void;
  /** The next read `every()` ms from now. */
  schedule(): void;
  /** The mount (the component's $effect runs it; a test may): its end. */
  start(): () => void;
  readonly loading: boolean;
  /** Aborted as the page ends. */
  readonly life: AbortSignal;
}

export function statusPoll(read: (signal: AbortSignal) => Promise<void>, every: () => number, skip: () => boolean = () => false, warm: () => boolean = () => false): Poll {
  const life = new AbortController();
  let ctl: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const st = $state({ loading: false });

  function schedule() {
    clearTimeout(timer);
    if (!life.signal.aborted) timer = setTimeout(() => void (document.hidden ? undefined : refresh()), every());
  }

  function hold() {
    ctl?.abort();
    ctl = null;
    st.loading = false;
    clearTimeout(timer);
  }

  async function refresh() {
    if (life.signal.aborted || skip()) return;
    ctl?.abort();
    const c = (ctl = new AbortController());
    const signal = AbortSignal.any([c.signal, life.signal]);
    st.loading = true;
    await read(signal);
    if (signal.aborted) return;
    ctl = null;
    st.loading = false;
    schedule();
  }

  /** The page's mount: the first read (or the timer, `warm`), the phone coming back reads; its end. */
  function start(): () => void {
    if (warm()) schedule();
    else void refresh();
    const onVisible = () => document.hidden || void refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearTimeout(timer);
      life.abort();
    };
  }

  $effect(() => untrack(start));

  return { refresh, hold, schedule, start, get loading() { return st.loading; }, life: life.signal };
}
