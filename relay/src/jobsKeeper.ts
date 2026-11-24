// ボット → 定期処理's keeper in the record's object (jobs.ts: the rings, the copy, the answer): its storage keys, the one
// refresh at a time, and the GitHub App's token for it (its/worker/src/ghApp.ts: narrowed to `actions: read` on
// fitness, kept beside the backup's under its own key). storeObject.ts holds one and calls it from its RPCs.
import { ghAuth } from '../../its/worker/src/ghApp.ts';
import type { JobRun, JobsStatus } from '../../app/src/lib/contract/jobs.ts';
import { EXT_CRON_MS, EXT_STALE_MS, KEY, NO_EXT, jobsStatus, noteDayRun, noteRun, refreshExt, tickRuns, type Ext, type Ring, type TickRings } from './jobs.ts';
import { errName } from './log.ts';

/** The App's token for the jobs' reads (TokenStore). */
const GH_TOKEN = 'gh_token_jobs';

export interface KeeperDeps {
  storage: Pick<DurableObjectStorage, 'get' | 'put'>;
  now(): number;
  /** The App's secrets (unset: no GitHub rows, `no_token`). */
  app: { appId?: string; installationId?: string; key?: string };
  fetch: typeof fetch;
  /** gym-bot's /status over its binding, absent without one. */
  gym?: () => Promise<Response>;
  /** The record's: nightly's parts' ages, places' last sync. */
  nightlyAges(): Record<string, number>;
  syncedAt(): number | null;
  waitUntil(p: Promise<unknown>): void;
}

export class JobsKeeper {
  private refreshing: Promise<void> | null = null;
  constructor(private readonly d: KeeperDeps) {}

  private async ext(): Promise<Ext> {
    return (await this.d.storage.get<Ext>(KEY.ext)) ?? NO_EXT;
  }

  /** The copy read again unless it is younger than `ms` or a refresh is under way (that one awaited). */
  refresh(ms: number): Promise<void> {
    return (this.refreshing ??= (async () => {
      const old = await this.ext();
      const now = this.d.now();
      if (old.at !== null && now - old.at < ms) return;
      const { storage } = this.d;
      const auth = await ghAuth(
        { ...this.d.app },
        { repositories: ['fitness'], permissions: { actions: 'read' } },
        { now, fetch: this.d.fetch, store: { get: () => storage.get(GH_TOKEN), put: (v) => storage.put(GH_TOKEN, v) } }
      );
      const next = await refreshExt(old, { now, fetch: this.d.fetch, token: auth?.token ?? null, gym: this.d.gym });
      await storage.put(KEY.ext, next);
    })().catch((e) => console.warn('jobs refresh', errName(e))).finally(() => (this.refreshing = null)));
  }

  /** `GET /jobs`: the answer from what is kept; a copy older than EXT_STALE_MS refreshed behind it. */
  async read(): Promise<JobsStatus> {
    const ext = await this.ext();
    const now = this.d.now();
    if (ext.at === null || now - ext.at >= EXT_STALE_MS) this.d.waitUntil(this.refresh(EXT_STALE_MS));
    const [tick, nightly, backup, since] = await Promise.all([this.d.storage.get<TickRings>(KEY.tick), this.d.storage.get<Ring>(KEY.nightly), this.d.storage.get<Ring>(KEY.backup), this.d.storage.get<number>(KEY.since)]);
    return jobsStatus({ tick, nightly, backup, ext, nightlyAges: this.d.nightlyAges(), syncedAt: this.d.syncedAt(), now, since });
  }

  /** The cron's tick (index.ts): its outcomes into `jobs|tick` (one put; the first one notes `jobs|since`, the oldest
   *  tick kept before it if any), then the copy refreshed if due. */
  async tick(o: Parameters<typeof tickRuns>[0]): Promise<void> {
    const now = this.d.now();
    const runs = tickRuns(o);
    const [old = {}, since] = await Promise.all([this.d.storage.get<TickRings>(KEY.tick), this.d.storage.get<number>(KEY.since)]);
    if (since === undefined) await this.d.storage.put(KEY.since, old.tick?.r.at(-1)?.t ?? runs.tick.t);
    await this.d.storage.put(KEY.tick, { tick: noteRun(old.tick, runs.tick, now), wx: noteRun(old.wx, runs.wx, now), places: noteRun(old.places, runs.places, now) } satisfies TickRings);
    this.d.waitUntil(this.refresh(EXT_CRON_MS));
  }

  /** The nightly jobs' call (storeObject.ts nightly) when it ran any: today's cell (ok, fail: the failed jobs; run: a
   *  prune's batch left over). */
  async nightly(r: { ran: string[]; failed: string[]; left: string[] }, t0: number): Promise<void> {
    if (!r.ran.length) return;
    const now = this.d.now();
    const run: JobRun = r.failed.length ? { t: t0, st: 'fail', ms: now - t0, c: r.failed.join(',') } : r.left.length ? { t: t0, st: 'run', ms: now - t0, c: r.left.join(',') } : { t: t0, st: 'ok', ms: now - t0 };
    await this.d.storage.put(KEY.nightly, noteDayRun(await this.d.storage.get<Ring>(KEY.nightly), run, now));
  }

  /** A backup's run (storeObject.ts archiveRun): ok (warn: the bots' state failed), idle (no token), else fail. */
  async backup(r: { ok: boolean; st: string; botsBad: boolean; by?: string }, t0: number): Promise<void> {
    const now = this.d.now();
    const run: JobRun = r.ok ? { t: t0, st: r.botsBad ? 'warn' : 'ok', ms: now - t0, c: r.botsBad ? 'bots' : (r.by ?? 'ok') }
      : { t: t0, st: r.st === 'no_token' || r.st === 'no_config' ? 'idle' : 'fail', ms: now - t0, c: r.st };
    await this.d.storage.put(KEY.backup, noteRun(await this.d.storage.get<Ring>(KEY.backup), run, now));
  }
}
