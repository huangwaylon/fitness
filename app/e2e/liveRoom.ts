// Two phones on an island of their own (tests only): the relay's real code in the test's process, as relay/test runs
// it, behind each browser context's network. The room (relay/src/room.ts RoomCore) answers the phones' sockets
// (context.routeWebSocket: nothing goes over the network) and the record (relay/src/store.ts StoreCore on
// node:sqlite) their `/api`, the record's writes passed to the room as its `changed` pushes, as the Worker does. The
// test drives what a phone's network does: a socket closed by a deploy (1012), one that stays open but carries
// nothing (dead), a phone offline (sockets refused, `/api` failing).
//   const island = newIsland();
//   await island.pair(context, 'A')              a paired phone (the live app: `/`), on this island
//   await island.demo(context, 'B')              the demo's phone (`demoUrl('B')`: its hooks on) on this island's room
//   island.drop('A', 1012) / dead('A') / offline('A', true)
//   island.fetches('A')                          how many record fetches (snapshot) the phone made
import type { BrowserContext, Page, WebSocketRoute } from '@playwright/test';
import { RoomCore, type Meta } from '../../relay/src/room.ts';
import { StoreCore } from '../../relay/src/store.ts';
import { memSql } from '../../relay/test/sqlite.ts';

type Who = 'A' | 'B' | 'G';
const API = 'https://island-fund-relay.island-fund-relay.workers.dev';
/** The demo's relay URL (`?relay=`): an address nothing answers on, so a socket the route missed goes nowhere. */
const DEMO_WS = 'ws://127.0.0.1:9/room';
const KEYS = { KEY_A: 'a1'.repeat(32), KEY_B: 'b2'.repeat(32), KEY_C: 'c3'.repeat(32) };
const KEY_OF = { A: KEYS.KEY_A, B: KEYS.KEY_B, G: KEYS.KEY_C } as const;

/** One phone's socket as the room holds it. */
interface Sock {
  who: Who;
  route: WebSocketRoute;
  meta: Meta | null;
  closed: boolean;
  /** Open but carrying nothing either way. */
  dead: boolean;
  send(d: string): void;
  close(code?: number, reason?: string): void;
}

/** The context's options for a demo phone on this island (the page's CSP lets only the production relay in). */
export const DEMO_CTX = { viewport: { width: 390, height: 844 }, bypassCSP: true } as const;

export function newIsland() {
  let socks: Sock[] = [];
  const db = memSql();
  const room: RoomCore<Sock> = new RoomCore<Sock>({
    sockets: () => socks.filter((s) => !s.closed),
    meta: (s) => s.meta,
    setMeta: (s, m) => void (s.meta = m),
    keys: KEYS,
    now: () => Date.now(),
    save: () => {}
  });
  const store = new StoreCore({ sql: db.sql, tx: db.tx, keys: KEYS, now: () => Date.now(), notify: (n) => void room.notify(n) });
  /** Per phone: offline (no socket, no `/api`). */
  const offlineOf = new Set<Who>();
  const fetchesOf: Record<Who, number> = { A: 0, B: 0, G: 0 };
  /** What each phone said to the room, by kind (pings, hellos, intents). */
  const saidOf: Record<Who, Record<string, number>> = { A: {}, B: {}, G: {} };

  const socket = (who: Who, ws: WebSocketRoute) => {
    if (offlineOf.has(who)) return void ws.close({ code: 1006, reason: 'offline' });
    const s: Sock = {
      who, route: ws, meta: null, closed: false, dead: false,
      send(d) {
        if (s.closed) throw new Error('closed');
        if (!s.dead) ws.send(d);
      },
      close(code, reason) {
        if (s.closed) return;
        s.closed = true;
        void ws.close({ code, reason });
      }
    };
    socks.push(s);
    room.open(s);
    ws.onMessage((m) => {
      if (s.closed || s.dead) return;
      const text = String(m);
      try {
        const k = (JSON.parse(text) as { kind?: string }).kind ?? '?';
        saidOf[who][k] = (saidOf[who][k] ?? 0) + 1;
      } catch { /* not JSON */ }
      room.message(s, text);
    });
    ws.onClose(() => {
      if (s.closed) return;
      s.closed = true;
      room.close(s);
    });
  };

  const api = async (context: BrowserContext, who: Who) => {
    await context.route(`${API}/**`, (route) => {
      if (offlineOf.has(who)) return route.abort('internetdisconnected');
      const text = route.request().postData() ?? '';
      try {
        if ((JSON.parse(text) as { action?: string }).action === 'snapshot') fetchesOf[who]++;
      } catch { /* not JSON */ }
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: store.handleText(text) });
    });
  };

  return {
    /** A context's phones paired as `who` (the live app, its record and its socket this island's). */
    async pair(context: BrowserContext, who: Who) {
      await context.addInitScript((key) => localStorage.setItem('island.key', key), KEY_OF[who]);
      await context.routeWebSocket(/\/room$/, (ws) => socket(who, ws));
      await api(context, who);
    },
    /** A context's demo phones (`demoUrl(who)`) talking to this island's room. */
    async demo(context: BrowserContext, who: Who) {
      await context.routeWebSocket(DEMO_WS, (ws) => socket(who, ws));
    },
    /** The demo's URL for `who` on this island (the hooks on; `extra`: more of the query). */
    demoUrl(who: Who, extra = '') {
      return `?demo&awake&critter=none&visitor=none${who === 'A' ? '' : `&as=${who}`}&relay=${encodeURIComponent(DEMO_WS)}&key=${KEY_OF[who]}${extra}`;
    },
    /** The relay closes `who`'s sockets (1012: a deploy restarting the room). */
    drop(who: Who, code = 1012) {
      for (const s of socks.filter((x) => x.who === who && !x.closed)) {
        room.close(s);
        s.close(code, 'restart');
      }
    },
    /** `who`'s open sockets stay open but carry nothing either way from now on (a half-open TCP: a phone that slept
     *  on a train); a new socket works. */
    dead(who: Who) {
      for (const s of socks) if (s.who === who && !s.closed) s.dead = true;
    },
    /** `who` offline: its sockets closed and refused, its `/api` failing. */
    offline(who: Who, on = true) {
      if (on) {
        offlineOf.add(who);
        for (const s of socks.filter((x) => x.who === who && !x.closed)) {
          room.close(s);
          s.close(1006, 'offline');
        }
      } else offlineOf.delete(who);
    },
    /** How many record fetches (`snapshot`) `who`'s phones made. */
    fetches: (who: Who) => fetchesOf[who],
    /** What `who`'s phones said to the room, by kind. */
    said: (who: Who) => ({ ...saidOf[who] }),
    /** `who`'s open sockets as the room has them (welcomed ones). */
    sockets: (who: Who) => socks.filter((s) => s.who === who && !s.closed && s.meta?.who === who).length,
    /** An event straight to the record as `who`'s phone would send it (the room pushes `changed` to the phones). */
    event(who: Who, type: string, data: Record<string, unknown>) {
      return store.handle({ key: KEY_OF[who], action: 'event', id: `e2e${Math.random().toString(36).slice(2, 10)}`, type, data }, 100);
    },
    reset() {
      socks = [];
    }
  };
}

/** The page's visibility as the app sees it (a phone's app switcher: `visibilitychange` with `document.hidden`). */
export async function setVisible(p: Page, visible: boolean): Promise<void> {
  await p.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'visible' : 'hidden') });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => !v });
    document.dispatchEvent(new Event('visibilitychange'));
  }, visible);
}
