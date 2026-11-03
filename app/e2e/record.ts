// A paired phone on a record of its own (tests only): the relay's API routed to the record's real code
// (relay/src/store.ts StoreCore on node:sqlite, as relay/test does), so what a phone sends goes the real way (its queue,
// the `events` batch, the record's permission and validation checks, the acks) and a phone opening later reads what
// was kept. The room's socket is held shut: everything goes over the API.
import type { BrowserContext } from '@playwright/test';
import { StoreCore } from '../../relay/src/store.ts';
import { memSql } from '../../relay/test/sqlite.ts';

const RELAY = 'https://island-fund-relay.island-fund-relay.workers.dev';
const KEYS = { KEY_A: 'a1'.repeat(32), KEY_B: 'b2'.repeat(32), KEY_C: 'c3'.repeat(32) };
const KEY_OF = { A: KEYS.KEY_A, B: KEYS.KEY_B, G: KEYS.KEY_C } as const;

type Who = 'A' | 'B' | 'G';
/** One event the record answered: who sent it, its type and data, and the record's reply. */
interface Sent { who: Who; type: string; data: Record<string, unknown>; ok: boolean; error?: string }

export function newRecord() {
  const db = memSql();
  const store = new StoreCore({ sql: db.sql, tx: db.tx, keys: KEYS, now: () => Date.now(), notify: () => {} });
  /** Every event sent, in order, with what the record said. */
  const sent: Sent[] = [];
  return {
    sent,
    /** A context's phones paired as `who` on this record. */
    async pair(context: BrowserContext, who: Who) {
      await context.addInitScript((key) => localStorage.setItem('island.key', key), KEY_OF[who]);
      await context.routeWebSocket(/\/room/, () => {});
      await context.route(`${RELAY}/**`, (route) => {
        const text = route.request().postData() ?? '';
        const reply = store.handleText(text);
        try {
          const body = JSON.parse(text), r = JSON.parse(reply);
          if (body.action === 'events' && Array.isArray(body.events))
            body.events.forEach((e: { type: string; data: Record<string, unknown> }, i: number) => sent.push({ who, type: e.type, data: e.data, ok: !!r.results?.[i]?.ok, error: r.results?.[i]?.error }));
        } catch { /* not JSON */ }
        return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: reply });
      });
    },
    /** An event straight to the record as `who`'s phone would send it: the record's reply. */
    event(who: Who, type: string, data: Record<string, unknown>) {
      return store.handle({ key: KEY_OF[who], action: 'event', id: `e2e${sent.length}${Date.now().toString(36)}`, type, data }, 100);
    },
    /** The record's kept decor rows: [who, data]. */
    decor(): [Who, Record<string, unknown>][] {
      const snap = store.handle({ key: KEYS.KEY_A, action: 'snapshot' }, 100) as unknown as { rows: { events: [string, Who, string, string, string][] } };
      return snap.rows.events.filter((r) => r[3] === 'decor').map((r) => [r[1], JSON.parse(r[4])]);
    }
  };
}
