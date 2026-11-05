// The record's Durable Object (docs/backend.md#the-record): one instance (`idFromName('record')`), SQLite-backed, apart
// from the island room (which holds the sockets and the day's shared world), so the record's code and the room's change
// independently. The Worker hands it the bodies of `/api` and `/admin` (storeRoute.ts) as they came: the parsing and
// the JSON happen here, on the object's CPU budget. After a write it tells the room, which passes `changed` to the
// open phones.
import { DurableObject } from 'cloudflare:workers';
import type { Notice } from '../../app/src/lib/sync/live-protocol.ts';
import { StoreCore, type Sql } from './store.ts';
import type { StoreRoom } from './storeRoute.ts';
import type { Env } from './index.ts';

export class IslandStore extends DurableObject<Env> implements StoreRoom {
  private core: StoreCore;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.core = new StoreCore({
      sql: ctx.storage.sql as unknown as Sql,
      tx: (fn) => ctx.storage.transactionSync(fn),
      keys: { KEY_A: env.KEY_A, KEY_B: env.KEY_B, KEY_C: env.KEY_C },
      now: () => Date.now(),
      notify: (n) => this.tellRoom(n)
    });
  }

  private tellRoom(n: Notice): void {
    const room = this.env.ROOM.get(this.env.ROOM.idFromName('island'));
    this.ctx.waitUntil(Promise.resolve(room.notify(n)).then(() => undefined, (e) => console.warn('notify the room', e)));
  }

  api(text: string): string {
    return this.core.handleText(text);
  }

  /** A signed `/admin` body (storeRoute.ts): `{op, ...}` → its status and JSON reply. */
  async adminSigned(text: string, t: string | null, sig: string | null): Promise<{ status: number; body: string }> {
    const v = await this.core.signedOp(text, t, sig);
    if ('status' in v) return v;
    try {
      return { status: 200, body: JSON.stringify(await this.admin(v.op)) };
    } catch (e) {
      return { status: 200, body: JSON.stringify({ ok: false, error: 'unavailable', detail: String(e) }) };
    }
  }

  /**
   * - `counts`: rows per table, the revision and the newest `at`;
   * - `bookmark {ms?}`: point-in-time recovery's bookmark now and `ms` ago (default 1 h);
   * - `restore {bookmark}`: restore the record to that bookmark (the object restarts; every phone refetches: a new epoch);
   * - `rev`: start a new epoch (every phone drops its cache and fetches everything);
   * - `dump`: every row (the backup, docs/ops/runbook.md#13-the-record);
   * - `load {rows: {metrics?, events?, uploads?}}`: rows that already have their `at` (a dump's) into the record, by
   *   its rules (idempotent: what it has is skipped);
   * - `wx {refresh?, s?, fx?}`: the room's real weather (index.ts wxAdmin): fetch it now, put a fixture timeline in, or
   *   say how it is.
   */
  private async admin(o: Record<string, unknown>): Promise<Record<string, unknown>> {
    const storage = this.ctx.storage;
    switch (o.op) {
      // the real weather, the room's (index.ts wxAdmin): a fetch now, a fixture timeline, or how it is
      case 'wx':
        return this.env.ROOM.get(this.env.ROOM.idFromName('island')).wxAdmin(o);
      case 'counts':
        return { ok: true, counts: this.core.counts(), rev: this.core.rev(), newest: this.core.newestAt() };
      case 'bookmark': {
        const ms = typeof o.ms === 'number' ? o.ms : 3600_000;
        return { ok: true, now: await storage.getCurrentBookmark(), ago: await storage.getBookmarkForTime(Date.now() - ms) };
      }
      case 'restore': {
        if (typeof o.bookmark !== 'string') return { ok: false, error: 'bad_request' };
        await storage.onNextSessionRestoreBookmark(o.bookmark);
        setTimeout(() => this.ctx.abort('restoring a bookmark'), 200); // after the reply
        return { ok: true, restoring: o.bookmark, note: 'after it restarts, run {op:"rev"} so the phones refetch' };
      }
      case 'rev':
        return { ok: true, rev: this.core.bumpRev() };
      case 'load':
        return this.core.load(o);
      case 'dump':
        return { ok: true, rev: this.core.rev(), ...this.core.dump() };
      case 'telemetry':
        return { ok: true, rows: this.core.telemetryRows(typeof o.n === 'number' ? o.n : 100) };
      default:
        return { ok: false, error: 'bad_request' };
    }
  }
}
