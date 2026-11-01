// Timeouts a component owns, cleared together when it goes (or its critters leave): one `later` for the island.

export interface Timers {
  /** Run `fn` after `ms`, unless cleared first. */
  later(fn: () => void, ms: number): void;
  /** Run `fn` after my villager's walk of `ms` (at once when it didn't walk: 0). */
  after(ms: number, fn: () => void): void;
  /** Cancel everything pending. */
  clear(): void;
}

export function timers(): Timers {
  const ids = new Set<ReturnType<typeof setTimeout>>();
  const later = (fn: () => void, ms: number): void => {
    const id = setTimeout(() => {
      ids.delete(id);
      fn();
    }, ms);
    ids.add(id);
  };
  return {
    later,
    after: (ms, fn) => (ms ? later(fn, ms) : fn()),
    clear: () => {
      for (const id of ids) clearTimeout(id);
      ids.clear();
    }
  };
}
