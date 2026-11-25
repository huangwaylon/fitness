// A paired phone on a record of its own (tests only): the relay's API routed to the record's real code
// (relay/src/store.ts StoreCore on node:sqlite, as relay/test does), so what a phone sends goes the real way (its queue,
// the `events` batch, the record's permission and validation checks, the acks) and a phone opening later reads what
// was kept. The room's socket is held shut: everything goes over the API.
import { pinnedClock, type BrowserContext, type Route } from './fixtures.ts';
import { StoreCore } from '../../relay/src/store.ts';
import { shareRoute } from '../../relay/src/share.ts';
import { memSql } from '../../relay/test/sqlite.ts';
import { KEYS, KEY_OF, RELAY, type Who } from './relay.ts';

/** One event the record answered: who sent it, its type and data, and the record's reply. */
interface Sent { who: Who; type: string; data: Record<string, unknown>; ok: boolean; error?: string }

export function newRecord() {
  const db = memSql();
  // the pinned time, the record's and its phones' devices' (e2e/fixtures.ts)
  const clock = pinnedClock();
  const store = new StoreCore({ sql: db.sql, tx: db.tx, keys: KEYS, now: clock.now, notify: () => {} });
  /** Every event sent, in order, with what the record said. */
  const sent: Sent[] = [];
  let events = 0;
  /** The relay out of reach (the phones' requests fail as offline's do). */
  let down = false;
  /** Each reply as a phone gets it, changed (an older relay's or an older build's view of it), or as the record said. */
  let tamper: ((body: Record<string, unknown>, reply: Record<string, unknown>) => Record<string, unknown>) | null = null;
  /** Every `POST /share` (a 共有リンク's visitor's read): its body and headers as sent. */
  const shareReads: { body: string; headers: Record<string, string> }[] = [];
  /** `POST /share` by the relay's own gate and read (relay/src/share.ts), the visitor at a fixed IP. */
  async function share(route: Route) {
    const r = route.request(), headers = r.headers();
    shareReads.push({ body: r.postData() ?? '', headers });
    if (r.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
    const req = new Request(r.url(), { method: 'POST', headers: { Origin: headers.origin ?? 'http://localhost', 'User-Agent': headers['user-agent'] ?? '', 'CF-Connecting-IP': '198.51.100.1' }, body: r.postData() ?? '' });
    const res = await shareRoute(req, '', (i) => store.share.read({ ...i, cc: 'JP' }));
    return route.fulfill({ status: res.status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': headers.origin ?? '*' }, body: await res.text() });
  }
  return {
    sent,
    shareReads,
    /** A visitor's phone (no key, never paired): only `POST /share` reaches this record; anything else to the relay fails. */
    async visitor(context: BrowserContext) {
      await clock.device(context);
      await context.routeWebSocket(/\/room/, (ws) => ws.close());
      await context.route(`${RELAY}/**`, (route) => {
        if (down) return route.abort('internetdisconnected');
        if (new URL(route.request().url()).pathname === '/share') return share(route);
        return route.abort('blockedbyclient');
      });
    },
    /** A link's row as the record keeps it (its counts). */
    shareRow(id: string) {
      return (store.handle({ key: KEYS.KEY_A, action: 'share_visits', id }, 100) as { row?: { views: number; uniq: number; off: string | null } }).row ?? null;
    },
    /** The record's clock (ms): the phones' devices' too. */
    now: clock.now,
    /** A context's phones paired as `who` on this record. */
    async pair(context: BrowserContext, who: Who) {
      await clock.device(context);
      await context.addInitScript((key) => localStorage.setItem('island.key', key), KEY_OF[who]);
      await context.routeWebSocket(/\/room/, () => {});
      await context.route(`${RELAY}/**`, (route) => {
        if (down) return route.abort('internetdisconnected');
        if (new URL(route.request().url()).pathname === '/share') return share(route);
        const text = route.request().postData() ?? '';
        let reply = store.handleText(text);
        if (tamper) {
          try {
            reply = JSON.stringify(tamper(JSON.parse(text), JSON.parse(reply)));
          } catch { /* not JSON */ }
        }
        try {
          const body = JSON.parse(text), r = JSON.parse(reply);
          if (body.action === 'events' && Array.isArray(body.events))
            body.events.forEach((e: { type: string; data: Record<string, unknown> }, i: number) => sent.push({ who, type: e.type, data: e.data, ok: !!r.results?.[i]?.ok, error: r.results?.[i]?.error }));
        } catch { /* not JSON */ }
        return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: reply });
      });
    },
    /** The relay out of reach (true) or back (false), for every phone on this record. */
    offline(on: boolean) {
      down = on;
    },
    /** Every phone's replies changed by `fn` from now on (null: as the record says them). */
    tamper(fn: typeof tamper) {
      tamper = fn;
    },
    /** The admin's correction of `who`'s かいがら (record.ts adjust): the record's reply. */
    adjust(who: Who, v: number) {
      return store.adjust({ id: `adj-${++events}`, who, v, note: 'e2e' });
    },
    /** `who`'s wallet as the record keeps it (record.ts wallet). */
    wallet(who: Who): number {
      return (store.wallets()[who] as { h: number }).h;
    },
    /** An event straight to the record as `who`'s phone would send it: the record's reply. */
    event(who: Who, type: string, data: Record<string, unknown>) {
      return store.handle({ key: KEY_OF[who], action: 'event', id: `e2e${sent.length}-${++events}`, type, data }, 100);
    },
    /** A Shortcut's health body to the record as `who`'s (relay/src/parse.ts): the record's reply. */
    ingest(who: 'A' | 'B', body: Record<string, unknown>) {
      return store.handle({ key: KEY_OF[who], action: 'ingest', ...body }, 100);
    },
    /** A row the record kept before a rule refused its kind (the locked profile): written as a restore keeps it. */
    kept(who: Who, type: string, data: Record<string, unknown>) {
      store.handle({ key: KEY_OF[who], action: 'health' }, 100); // (the tables)
      const slot = type === 'pref' ? `pref|${data.person ?? who}|${data.key}` : null;
      db.sql.exec('INSERT INTO events (id, at, person, type, data, slot) VALUES (?, ?, ?, ?, ?, ?)', `kept${++events}`, new Date(clock.now() - 86_400_000).toISOString(), who, type, JSON.stringify(data), slot);
    },
    /** The `pref` rows `who`'s phone gets (its snapshot, as the record filters it): [sender, data]. */
    prefs(who: Who): [Who, Record<string, unknown>][] {
      const snap = store.handle({ key: KEY_OF[who], action: 'snapshot' }, 100) as unknown as { rows: { events: [string, Who, string, string, string][] } };
      return snap.rows.events.filter((r) => r[3] === 'pref').map((r) => [r[1], JSON.parse(r[4])]);
    },
    /** The record's kept decor rows: [who, data]. */
    decor(): [Who, Record<string, unknown>][] {
      const snap = store.handle({ key: KEYS.KEY_A, action: 'snapshot' }, 100) as unknown as { rows: { events: [string, Who, string, string, string][] } };
      return snap.rows.events.filter((r) => r[3] === 'decor').map((r) => [r[1], JSON.parse(r[4])]);
    }
  };
}
