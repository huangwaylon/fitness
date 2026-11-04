// くまのもり's link between the players' phones (docs/design.md "Kuma no mori"). Two kinds behind one interface:
//   createRelayLink: the relay's forest room (relay/src/expedition.ts, docs/backend.md "The forest room") over a
//     WebSocket, while the page is on screen (closed when hidden, as the island's socket is), reconnecting with backoff,
//     its clock the room's (the shortest of a few pings' round trips).
//   createLocalLink: the demo's, tabs of one browser on a BroadcastChannel (open them in separate windows side by
//     side: a hidden tab's timers slow to a crawl and its bears would stall).
// Every message is heard by its sender too (a loopback), so the host's own player goes through the same path as the
// others'. What the room relays comes back stamped `from`.
import type { Msg } from './protocol.ts';
import { FOREST_V, parseFromRoom } from './wire.ts';
import type { Who } from '../../sync/live-protocol.ts';

export type Heard = Msg & { from?: Who };

export interface Link {
  send(m: Msg): void;
  on(f: (m: Heard) => void): () => void;
  /** The shared clock (ms). */
  now(): number;
  /** Who the room says I am, and whether the socket is up (the local link: always). */
  status(): { up: boolean; me: Who | null };
  close(): void;
}

export function createLocalLink(channel = 'kuma-no-mori'): Link {
  const bc = typeof BroadcastChannel === 'function' ? new BroadcastChannel(channel) : null;
  const subs = new Set<(m: Heard) => void>();
  const deliver = (m: Heard) => {
    for (const f of subs) f(m);
  };
  if (bc) bc.onmessage = (e: MessageEvent<Heard>) => deliver(e.data);
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
    status: () => ({ up: true, me: null }),
    close() {
      subs.clear();
      bc?.close();
    }
  };
}

/** The relay's forest room at `url` (wss://…/expedition), as the person whose key this is. */
export function createRelayLink(url: string, key: string, me: Who): Link {
  const subs = new Set<(m: Heard) => void>();
  const deliver = (m: Heard) => {
    for (const f of subs) f(m);
  };
  let ws: WebSocket | null = null, up = false, closed = false, wait = 500, retry: ReturnType<typeof setTimeout> | 0 = 0, pinger: ReturnType<typeof setInterval> | 0 = 0;
  /** The room's clock less mine (ms), from the ping with the shortest round trip of the last eight. */
  let offset = 0;
  const samples: { rtt: number; off: number }[] = [];
  const ping = () => {
    if (up) ws?.send(JSON.stringify({ k: 'ping', c: Date.now() }));
  };
  function connect() {
    if (closed || ws || document.visibilityState === 'hidden') return;
    const s = new WebSocket(url);
    ws = s;
    s.onopen = () => s.send(JSON.stringify({ k: 'hello', key, v: FOREST_V }));
    s.onmessage = (e) => {
      const m = typeof e.data === 'string' ? parseFromRoom(e.data) : null;
      if (!m) return;
      if (m.k === 'welcome') {
        up = true;
        wait = 500;
        offset = m.t - Date.now();
        // a few pings at once (settled before a start), then one every 10 s
        for (let i = 0; i < 5; i++) setTimeout(ping, i * 250);
        clearInterval(pinger);
        pinger = setInterval(ping, 10_000);
        return;
      }
      if (m.k === 'pong') {
        const t = Date.now(), rtt = t - m.c;
        samples.push({ rtt, off: m.t + rtt / 2 - t });
        if (samples.length > 8) samples.shift();
        offset = samples.reduce((a, b) => (b.rtt < a.rtt ? b : a)).off;
        return;
      }
      if (m.k === 'here') {
        // (a socket gone: the lobby's and the round's `bye`)
        if (!m.on) deliver({ k: 'bye', who: m.who, from: m.who });
        return;
      }
      deliver(m);
    };
    s.onclose = () => {
      if (ws === s) ws = null;
      up = false;
      clearInterval(pinger);
      if (closed) return;
      clearTimeout(retry);
      retry = setTimeout(connect, wait);
      wait = Math.min(8000, wait * 2);
    };
    s.onerror = () => s.close();
  }
  // off screen: no socket (the island's way); back on: straight back
  const onVis = () => {
    if (document.visibilityState === 'hidden') ws?.close();
    else connect();
  };
  document.addEventListener('visibilitychange', onVis);
  connect();
  return {
    send(m) {
      if (up && ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(m));
      queueMicrotask(() => deliver({ ...m, from: me }));
    },
    on(f) {
      subs.add(f);
      return () => subs.delete(f);
    },
    now: () => Date.now() + offset,
    status: () => ({ up, me: up ? me : null }),
    close() {
      closed = true;
      subs.clear();
      document.removeEventListener('visibilitychange', onVis);
      clearTimeout(retry);
      clearInterval(pinger);
      ws?.close();
    }
  };
}
