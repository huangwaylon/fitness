// The record's Durable Object (docs/backend.md#the-record): one instance (`idFromName('record')`), SQLite-backed, apart
// from the island room (which holds the sockets and the day's shared world), so the record's code and the room's change
// independently. The Worker hands it `/api` and `/import` (storeRoute.ts); after a write it tells the room, which
// passes `changed` to the open phones.
import { DurableObject } from 'cloudflare:workers';
import { parseNotice, type Notice } from '../../app/src/lib/sync/live-protocol.ts';
import { StoreCore, type ImportRows, type Sql } from './store.ts';
import type { StoreRoom } from './storeRoute.ts';
import type { Env } from './index.ts';

export class IslandStore extends DurableObject<Env> implements StoreRoom {
  private core: StoreCore;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.core = new StoreCore({
      sql: ctx.storage.sql as unknown as Sql,
      tx: (fn) => ctx.storage.transactionSync(fn),
      keys: { KEY_A: env.KEY_A, KEY_B: env.KEY_B },
      now: () => Date.now(),
      notify: (n) => this.tellRoom(n)
    });
  }

  private tellRoom(n: Notice): void {
    const room = this.env.ROOM.get(this.env.ROOM.idFromName('island'));
    this.ctx.waitUntil(Promise.resolve(room.notify(n)).then(() => undefined, (e) => console.warn('notify the room', e)));
  }

  api(body: unknown, bytes: number): Record<string, unknown> {
    return this.core.handle(body, bytes);
  }

  importRows(rows: ImportRows, notice: Notice | null) {
    const r = this.core.import(rows);
    const n = notice ? parseNotice(JSON.stringify(notice)) : null;
    if (n && (r.metrics || r.events)) this.tellRoom(n);
    return { ...r, counts: this.core.counts() };
  }
}
