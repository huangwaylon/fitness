// The record's Durable Object (docs/backend.md#the-record): one instance (`idFromName('record')`), SQLite-backed, apart
// from the island room (which holds the sockets and the day's shared world), so the record's code and the room's change
// independently. The Worker hands it the bodies of `/api` and `/import` (storeRoute.ts) as they came: the parsing and
// the JSON happen here, on the object's CPU budget. After a write it tells the room, which passes `changed` to the
// open phones.
import { DurableObject } from 'cloudflare:workers';
import type { Notice } from '../../app/src/lib/sync/live-protocol.ts';
import { StoreCore, type Sql } from './store.ts';
import { verifyNotify } from './notify.ts';
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

  api(text: string): string {
    return this.core.handleText(text);
  }

  async importSigned(text: string, t: string | null, sig: string | null): Promise<{ status: number; body: string }> {
    const op = await this.adminOp(text, t, sig);
    if (op) {
      try {
        return { status: 200, body: JSON.stringify(await this.admin(op)) };
      } catch (e) {
        return { status: 200, body: JSON.stringify({ ok: false, error: 'unavailable', detail: String(e) }) };
      }
    }
    const r = await this.core.importSigned(text, t, sig);
    if (r.notice) this.tellRoom(r.notice);
    return { status: r.status, body: r.body };
  }

  /** A signed `{op, ...}` body (the runbook's admin calls, docs/ops/runbook.md#13-the-record), or null. */
  private async adminOp(text: string, t: string | null, sig: string | null): Promise<Record<string, unknown> | null> {
    if (!text.includes('"op"') || !(await verifyNotify({ KEY_A: this.env.KEY_A, KEY_B: this.env.KEY_B }, t, sig, text, Date.now()))) return null;
    try {
      const o = JSON.parse(text) as unknown;
      return o && typeof o === 'object' && typeof (o as { op?: unknown }).op === 'string' ? (o as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  /**
   * - `counts`: rows per table, the revision and the newest `at`;
   * - `bookmark {ms?}`: point-in-time recovery's bookmark now and `ms` ago (default 1 h);
   * - `restore {bookmark}`: restore the record to that bookmark (the object restarts; every phone refetches: a new epoch);
   * - `rev`: start a new epoch (every phone drops its cache and fetches everything);
   * - `dump`: every row (the backup, docs/ops/runbook.md#13-the-record).
   */
  private async admin(o: Record<string, unknown>): Promise<Record<string, unknown>> {
    const storage = this.ctx.storage;
    switch (o.op) {
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
      case 'dump':
        return { ok: true, rev: this.core.rev(), ...this.core.dump() };
      default:
        return { ok: false, error: 'bad_request' };
    }
  }
}
