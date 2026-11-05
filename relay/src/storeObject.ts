// The record's Durable Object (docs/backend.md#the-record): one instance (`idFromName('record')`), SQLite-backed, apart
// from the island room (which holds the sockets and the day's shared world), so the record's code and the room's change
// independently. The Worker hands it the bodies of `/api` and `/admin` (storeRoute.ts) as they came: the parsing and
// the JSON happen here, on the object's CPU budget. After a write it tells the room, which passes `changed` to the
// open phones.
import { DurableObject } from 'cloudflare:workers';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
import { StoreCore, type Sql } from './store.ts';
import type { StoreRoom } from './storeRoute.ts';
import type { Env } from './index.ts';
import { apiWithMeta, type ReqMeta } from './reqMeta.ts';
import { keyOwner } from './auth.ts';
import { relaySink } from './logRoute.ts';
import type { RelayEvent } from './log.ts';
import { isToken } from '../../app/src/lib/contract/log.ts';
import { twice } from './notify.ts';
import { errName } from './log.ts';

export class IslandStore extends DurableObject<Env> implements StoreRoom {
  private core: StoreCore;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.core = new StoreCore({
      sql: ctx.storage.sql as unknown as Sql,
      tx: (fn) => ctx.storage.transactionSync(fn),
      keys: { KEY_A: env.KEY_A, KEY_B: env.KEY_B, KEY_C: env.KEY_C },
      now: () => Date.now(),
      notify: (n) => this.tellRoom(n),
      // a stored row that isn't JSON, skipped by a fold: a warning in the log (store.ts rowRec)
      corrupt: (where) => this.log([{ e: 'store.corrupt', l: 2, d: { where } }])
    });
  }

  private logObj() {
    return this.env.LOG.get(this.env.LOG.idFromName('log'));
  }

  /** The record's own events to the log (logRoute.ts relaySink: best effort, off the reply's path). */
  private log(evs: RelayEvent[]): void {
    if (this.env.LOG_OFF === '1') return;
    relaySink(() => this.logObj(), (p) => this.ctx.waitUntil(p), Date.now)(evs);
  }

  /** The record changed: the room passes `changed` to the open phones (after the commit, off the reply's path; once
   *  more, on a fresh stub, if the first call fails: a phone's push is otherwise only caught up by its next poll). */
  private tellRoom(n: Notice): void {
    const room = () => this.env.ROOM.get(this.env.ROOM.idFromName('island'));
    this.ctx.waitUntil(twice(() => Promise.resolve(room().notify(n))).then(() => undefined, (e) => console.warn('notify the room', errName(e))));
  }

  /** RPC from the room's alarm after a restore (index.ts restoring): this is the restored record's first session, so
   *  a new epoch (every phone drops its cache and refetches; bumpRev tells the open ones). */
  restored(): { ok: true; rev: string } {
    return { ok: true, rev: this.core.bumpRev() };
  }

  api(text: string): string {
    return this.core.handleText(text);
  }

  /** The same, with the request's meta for the log's `req` (reqMeta.ts; the Worker times it and sends it). */
  apiMeta(text: string): { body: string; meta: ReqMeta } {
    const keys = { KEY_A: this.env.KEY_A, KEY_B: this.env.KEY_B, KEY_C: this.env.KEY_C };
    return apiWithMeta(this.core, text, (k) => (typeof k === 'string' && /^[0-9a-fA-F]{32,128}$/.test(k) ? keyOwner(k, keys) : null));
  }

  /** A signed `/admin` body (storeRoute.ts): `{op, ...}` → its status and JSON reply. */
  async adminSigned(text: string, t: string | null, sig: string | null): Promise<{ status: number; body: string }> {
    const v = await this.core.signedOp(text, t, sig);
    if ('status' in v) return v;
    // each signed op in the log (an audit: its name and outcome)
    const audit = (st: string) => this.log([{ e: 'admin', l: st === 'ok' ? 1 : 2, d: { op: isToken(v.op.op) ? v.op.op : 'other', st } }]);
    try {
      const r = await this.admin(v.op);
      audit(r.ok === true ? 'ok' : String(r.error ?? 'refused'));
      return { status: 200, body: JSON.stringify(r) };
    } catch (e) {
      audit('unavailable');
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
   * - `logs {since?, until?, after?, before?, desc?, lvl?, ev?, role?, sid?, rid?, src?, build?, limit?}`: the log's
   *   events (log.ts query; relay/scripts/logs.ts); `logstats`: its health; `logpurge {before?, role?}`: deletes;
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
        // the room calls `restored` a few seconds after the restart (a new epoch: every phone refetches); its own
        // storage, since this object's is about to be the bookmark's
        const told = await this.env.ROOM.get(this.env.ROOM.idFromName('island')).restoring().then(() => true, (e) => (console.warn('restoring', errName(e)), false));
        setTimeout(() => this.ctx.abort('restoring a bookmark'), 200); // after the reply
        return { ok: true, restoring: o.bookmark, note: told ? 'a new epoch follows by itself in a few seconds (counts shows the rev)' : 'the room was not told: after it restarts, run {op:"rev"} so the phones refetch' };
      }
      case 'rev':
        return { ok: true, rev: this.core.bumpRev() };
      case 'load':
        return this.core.load(o);
      case 'dump':
        return { ok: true, rev: this.core.rev(), ...this.core.dump() };
      // the log (docs/ops/observability.md): its own object's
      case 'logs':
        return { ok: true, ...(await this.logObj().query(o)) };
      case 'logstats':
        return { ...(await this.logObj().stats()) };
      case 'logpurge':
        return { ...(await this.logObj().purge(o)) };
      default:
        return { ok: false, error: 'bad_request' };
    }
  }
}
