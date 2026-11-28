// The log's Durable Object (docs/ops/observability.md, log.ts): one instance (`idFromName('log')`), SQLite-backed,
// apart from the record and the room. The Worker hands it a phone's batch (`/log`, its key already checked) and the
// relay's own events by RPC (best effort: `ctx.waitUntil`, never in a reply's path); the record's signed admin ops
// read it. Its alarm prunes it once a day; a timer writes the caps' counts within CAPS_SAVE_MS of a write (log.ts).
// The write guard's account-wide count (log.ts writes): Cloudflare's GraphQL (cfUsage.ts, the isolate's copy) asked at
// most every USAGE_TTL_MS while calls come in; no token (the test copy), the object's own count alone.
import { DurableObject } from 'cloudflare:workers';
import { cfUsage, USAGE_CACHE, USAGE_TTL_MS } from './cfUsage.ts';
import { DAY, LogCore, type LogQuery, type RelayEvent } from './log.ts';
import type { Sql } from './store.ts';
import type { Env } from './index.ts';


export class IslandLog extends DurableObject<Env> {
  private core: LogCore;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.core = new LogCore({
      sql: ctx.storage.sql as unknown as Sql,
      tx: (fn) => ctx.storage.transactionSync(fn),
      keys: { KEY_A: env.KEY_A, KEY_B: env.KEY_B, KEY_C: env.KEY_C },
      now: () => Date.now(),
      // (the test copy's lower: its reads share the account's quota with production's)
      shedPct: Number(env.READS_SHED_PCT) || undefined,
      writeShedPct: Number(env.WRITES_SHED_PCT) || undefined
    });
    // the daily prune: armed whenever it isn't (a first start, an alarm that failed for good)
    void ctx.blockConcurrencyWhile(async () => {
      if ((await ctx.storage.getAlarm()) === null) await ctx.storage.setAlarm(Date.now() + 60_000);
    });
  }

  /** The caps' counts not written yet (log.ts pending) are written by a timer in this instance: memory is all they're in
   *  (an alarm 30 s on often woke a fresh instance, the counts gone, on the test relay 2026-11-10), and the timer keeps
   *  the instance up meanwhile. */
  private saving: ReturnType<typeof setTimeout> | null = null;
  private soon(): void {
    const at = this.core.pending();
    if (at === null || this.saving) return;
    this.saving = setTimeout(() => {
      this.saving = null;
      this.core.saveCaps();
    }, Math.max(0, at - Date.now()));
  }

  /** The account's rows written today, asked of Cloudflare in the background (at most every USAGE_TTL_MS). */
  private usageAt = 0;
  private usage(): void {
    const token = this.env.CF_ANALYTICS_TOKEN;
    if (!token || Date.now() - this.usageAt < USAGE_TTL_MS) return;
    this.usageAt = Date.now();
    this.ctx.waitUntil(cfUsage(USAGE_CACHE, { now: Date.now, fetch: (u, i) => fetch(u, i), token, log: (e) => void this.core.add([e]) })
      .then((u) => {
        const w = u.limits.find((l) => l.k === 'doWrite');
        if (u.day && w) this.core.account(u.day, w.used);
      }, () => {}));
  }

  /** A phone's batch (its body as sent). */
  ingest(text: string): Record<string, unknown> {
    this.usage();
    const r = this.core.ingestText(text);
    this.soon();
    return r;
  }

  /** The relay's own events. */
  add(evs: RelayEvent[]): { ok: true; kept: number; closed?: number } {
    this.usage();
    const r = this.core.add(evs);
    this.soon();
    return r;
  }

  /** Today's rows read against the budget (log.ts reads): the record asks before an optional read. */
  reads(): ReturnType<LogCore['reads']> {
    this.usage();
    return this.core.reads();
  }

  /** Today's rows written against the Free plan's (log.ts writes): the money's import asks before each chunk. */
  writes(): ReturnType<LogCore['writes']> {
    this.usage();
    return this.core.writes();
  }

  /** The record's rows outside a `req` (storeObject.ts meter): counted, no event. */
  meter(m: { rw?: number; rr?: number }): void {
    this.core.meter(m);
    this.soon();
  }

  query(q: LogQuery): ReturnType<LogCore['query']> {
    return this.core.query(q);
  }

  /** A day's use of a capped bucket (sttRoute.ts). */
  spend(bucket: string, limit: number): boolean {
    return this.core.spend(bucket, limit);
  }

  stats(): ReturnType<LogCore['stats']> {
    this.usage();
    return this.core.stats();
  }

  purge(o: { before?: unknown; role?: unknown }): ReturnType<LogCore['purge']> {
    return this.core.purge(o);
  }

  async alarm(): Promise<void> {
    const r = this.core.prune();
    // a backlog (a month of missed prunes) goes on in an hour, else tomorrow
    await this.ctx.storage.setAlarm(Date.now() + (r.more ? 3_600_000 : DAY));
  }
}
