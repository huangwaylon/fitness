// くまのもり's link between the players' phones (docs/design.md "Kuma no mori"). The POC's: tabs of one browser on a
// BroadcastChannel (open them in separate windows side by side: a hidden tab's timers slow to a crawl and its bears
// would stall). Every message is heard by its sender too (a loopback), so the host's own player goes through the same
// path as the others'. A relay room would stand behind the same interface.
import type { Msg } from './protocol.ts';

export interface Link {
  send(m: Msg): void;
  on(f: (m: Msg) => void): () => void;
  /** The shared clock (ms): the tabs share the machine's. */
  now(): number;
  close(): void;
}

export function createLocalLink(channel = 'kuma-no-mori'): Link {
  const bc = typeof BroadcastChannel === 'function' ? new BroadcastChannel(channel) : null;
  const subs = new Set<(m: Msg) => void>();
  const deliver = (m: Msg) => {
    for (const f of subs) f(m);
  };
  if (bc) bc.onmessage = (e: MessageEvent<Msg>) => deliver(e.data);
  return {
    send(m) {
      bc?.postMessage(m);
      queueMicrotask(() => deliver(m));
    },
    on(f) {
      subs.add(f);
      return () => subs.delete(f);
    },
    now: () => Date.now(),
    close() {
      subs.clear();
      bc?.close();
    }
  };
}
