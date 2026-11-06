// The log's Durable Object (docs/ops/observability.md, log.ts): one instance (`idFromName('log')`), SQLite-backed,
// apart from the record and the room. The Worker hands it a phone's batch (`/log`, its key already checked) and the
// relay's own events by RPC (best effort: `ctx.waitUntil`, never in a reply's path); the record's signed admin ops
// read it. Its alarm prunes it once a day.
import { DurableObject } from 'cloudflare:workers';
import { LogCore, type LogQuery, type RelayEvent } from './log.ts';
import type { Sql } from './store.ts';
import type { Env } from './index.ts';

const DAY = 86_400_000;

export class IslandLog extends DurableObject<Env> {
  private core: LogCore;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.core = new LogCore({
      sql: ctx.storage.sql as unknown as Sql,
      tx: (fn) => ctx.storage.transactionSync(fn),
      keys: { KEY_A: env.KEY_A, KEY_B: env.KEY_B, KEY_C: env.KEY_C },
      now: () => Date.now()
    });
    // the daily prune: armed whenever it isn't (a first start, an alarm that failed for good)
    void ctx.blockConcurrencyWhile(async () => {
      if ((await ctx.storage.getAlarm()) === null) await ctx.storage.setAlarm(Date.now() + 60_000);
    });
  }

  /** A phone's batch (its body as sent). */
  ingest(text: string): Record<string, unknown> {
    return this.core.ingestText(text);
  }

  /** The relay's own events. */
  add(evs: RelayEvent[]): { ok: true; kept: number; closed?: number } {
    return this.core.add(evs);
  }

  query(q: LogQuery): ReturnType<LogCore['query']> {
    return this.core.query(q);
  }

  /** A day's use of a capped bucket (sttRoute.ts). */
  spend(bucket: string, limit: number): boolean {
    return this.core.spend(bucket, limit);
  }

  stats(): ReturnType<LogCore['stats']> {
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
