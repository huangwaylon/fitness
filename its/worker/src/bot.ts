// The record (README "How it works"): one Durable Object holding the settings, the bookings, the runner's last report,
// the lease, the dispatch, the events and the seen names, each under its own storage key. All of it is read once at
// start (one storage call) and kept in memory: a status read touches no storage, and each change is one batched put
// of the keys it changed. The Worker calls it by RPC (index.ts) with bodies already checked; the rules are rules.ts.
import { DurableObject } from 'cloudflare:workers';
import {
  DEFAULT_SETTINGS, LEASE_SEC,
  type BookingInput, type ClaimInput, type ClaimReply, type ItsSettingsInput, type ItsStatus, type Member, type RunInput,
  type RunnerConfig, type RunnerReport,
} from '../../../app/src/lib/its/contract.ts';
import { dispatchRun } from './dispatch.ts';
import type { Env } from './env.ts';
import {
  addBookings, addEvents, addSeen, claimLease, leaseTaken, liveSettings, runnerConfig, runnerOf, statusOf,
  type ItsRecord,
} from './rules.ts';

const KEYS = ['settings', 'bookings', 'runner', 'lease', 'dispatch', 'control', 'events', 'seen', 'acks'] as const satisfies readonly (keyof ItsRecord)[];

/** A second 開始 this soon after a dispatch that no report has followed yet sends nothing (one run is on its way; the
 *  dispatch is recorded before GitHub is asked, so a double tap while it's asked is one too), unless a 停止 came after
 *  that dispatch: its run may have seen paused at its preflight and skipped, so 開始 → 停止 → 開始 dispatches again. */
const DISPATCH_AGAIN_MS = 2 * 60_000;
/** Phases of a run that will keep going: 開始 then needs no new run. */
const RUNNING = new Set(['starting', 'solving', 'scanning']);

const empty = (): ItsRecord => ({
  settings: { ...DEFAULT_SETTINGS }, bookings: [], runner: null, lease: null, dispatch: null, control: null,
  events: { routine: [], important: [] }, seen: {}, acks: [],
});

/** A name or detail in a log line: one line, short (they are checked already; this only keeps lines readable). */
const q = (s: string | undefined) => JSON.stringify((s ?? '').slice(0, 120));

export class ItsBot extends DurableObject<Env> {
  rec: ItsRecord = empty();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    void ctx.blockConcurrencyWhile(() => this.load());
  }

  private async load(): Promise<void> {
    const saved = await this.ctx.storage.get<unknown>([...KEYS]);
    const rec = empty() as unknown as Record<string, unknown>;
    for (const k of KEYS) if (saved.get(k) !== undefined) rec[k] = saved.get(k);
    this.rec = rec as unknown as ItsRecord;
  }

  /** One put of these keys, then into memory: a put that throws leaves the record as it was, so nothing it carried is
   *  acknowledged (the request fails). The runtime's input gate holds other requests while the put runs. */
  private async save(patch: Partial<ItsRecord>): Promise<void> {
    if (!Object.keys(patch).length) return;
    await this.ctx.storage.put(patch as Record<string, unknown>);
    Object.assign(this.rec, patch);
  }

  private get mode(): 'on' | 'off' {
    return this.env.MODE === 'on' ? 'on' : 'off';
  }

  async status(): Promise<ItsStatus> {
    return statusOf(this.rec, this.mode, this.env.COMMIT ?? null, Date.now());
  }

  /** The page's 保存: refused (ok false, the current status) when someone saved since the edit began. */
  async putSettings(input: ItsSettingsInput, by: Member): Promise<{ ok: boolean; status: ItsStatus }> {
    const now = Date.now();
    const cur = this.rec.settings;
    if (input.baseUpdatedAt !== cur.updatedAt) {
      console.warn(`its settings conflict by=${by} base=${input.baseUpdatedAt} current=${cur.updatedAt} (${cur.updatedBy})`);
      return { ok: false, status: await this.status() };
    }
    const { baseUpdatedAt: _, ...edit } = input;
    // strictly later than the last save, so a draft from before it always conflicts
    const settings = { ...edit, v: 1 as const, paused: cur.paused, updatedAt: Math.max(now, (cur.updatedAt ?? 0) + 1), updatedBy: by };
    await this.save({ settings });
    console.log(`its settings by=${by} dates=${settings.dates.length} skip=${settings.skip.length} pri=${settings.priority.length} int=${settings.intervalSec} guests=${settings.guests} auto=${settings.autoConfirm ? 1 : 0} [${settings.dates.join(' ')}]`);
    return { ok: true, status: await this.status() };
  }

  /** 開始 / 停止, at once and outside the draft (`updatedAt` doesn't move: no one's draft conflicts with it), recorded as
   *  `control` (who, when). 開始 dispatches a run unless one wouldn't run (MODE off, no date), one is running, or one
   *  was just dispatched: the dispatch is recorded (ok, no status yet) before GitHub is asked, so a 開始 meanwhile is
   *  `recent`, and a 停止 meanwhile stays (only `dispatch` is written after). */
  async run(input: RunInput, by: Member): Promise<ItsStatus> {
    const now = Date.now();
    const settings = { ...this.rec.settings, paused: input.action === 'stop' };
    const control = { action: input.action, by, at: now };
    if (input.action === 'stop') {
      await this.save({ settings, control });
      console.log(`its run stop by=${by} runner=${this.rec.runner?.runId ?? '-'}`);
      return this.status();
    }
    const { lease, runner, dispatch, control: last } = this.rec;
    const stoppedSince = last?.action === 'stop' && !!dispatch && last.at >= dispatch.at;
    const skip = this.mode === 'off' ? 'mode_off'
      : !liveSettings(settings, now).dates.length ? 'no_dates'
        : leaseTaken(lease, null, now) && runner?.runId === lease?.holder && RUNNING.has(runner?.phase ?? '') ? 'running'
          : dispatch?.ok && now - dispatch.at < DISPATCH_AGAIN_MS && (runner?.lastSeen ?? 0) < dispatch.at && !stoppedSince ? 'recent'
            : null;
    if (skip) {
      await this.save({ settings, control });
      console.log(`its run start by=${by} dispatch=skip_${skip}${skip === 'recent' ? ` last=${Math.round((now - dispatch!.at) / 1000)}s` : ''}`);
      return this.status();
    }
    await this.save({ settings, control, dispatch: { at: now, ok: true, status: null } });   // = no token: nothing sent
    if (this.env.GH_DISPATCH_TOKEN) await this.save({ dispatch: await dispatchRun(this.env.GH_DISPATCH_TOKEN, now) });
    console.log(`its run start by=${by} dispatch=${this.rec.dispatch?.status ?? 'no_token'}`);
    return this.status();
  }

  async claim(input: ClaimInput): Promise<ClaimReply> {
    const now = Date.now();
    const lease = claimLease(this.rec.lease, input.runId, input.host, now);
    if (!lease) {
      const held = this.rec.lease!;
      console.warn(`its claim run=${input.runId} host=${input.host} ok=0 holder=${held.holder} (${held.host}) for=${Math.round((held.until - now) / 1000)}s`);
      return { ok: false, lease: held };
    }
    const takeover = this.rec.lease && this.rec.lease.holder !== input.runId ? this.rec.lease.holder : null;
    await this.save({ lease });
    console.log(`its claim run=${input.runId} host=${input.host} ok=1${takeover ? ` took_over=${takeover}` : ''}`);
    return { ok: true, lease, config: runnerConfig(this.rec, this.mode, input.runId, now) };
  }

  async config(runId: string | null): Promise<RunnerConfig> {
    const c = runnerConfig(this.rec, this.mode, runId, Date.now());
    console.log(`its config run=${runId ?? '-'} stop=${c.stopReason ?? 0}`);
    return c;
  }

  /** A heartbeat: the holder's renews the lease (a `run_end` releases it) and becomes the runner shown; the holder whose
   *  lease expired with nobody claiming it renews it too (`renewed_late`); a free lease (released) is not granted by a
   *  report (claim first). Events and seen names are taken from any run (a stray run's hold is still a fact). */
  async report(r: RunnerReport): Promise<RunnerConfig> {
    const now = Date.now();
    const patch: Partial<ItsRecord> = {};
    const ev = addEvents(this.rec, r.runId, r.events, now);
    if (ev) Object.assign(patch, { events: ev.events, acks: ev.acks });
    const seen = addSeen(this.rec.seen, r.seen, now);
    if (seen) patch.seen = seen;
    const held = this.rec.lease;
    const ended = r.events.some((e) => e.kind === 'run_end');
    const late = !ended && held?.holder === r.runId && held.until <= now;
    if (held?.holder === r.runId) {
      patch.runner = runnerOf(r, now, this.rec.runner);
      patch.lease = ended ? null : { ...held, until: now + LEASE_SEC * 1000 };
    } else if (!leaseTaken(held, r.runId, now)) {
      patch.runner = runnerOf(r, now, this.rec.runner);   // nobody holds it: still the runner to show (a retried last report)
    } else {
      console.warn(`its report from a run without the lease run=${r.runId} holder=${held!.holder}`);
    }
    await this.save(patch);
    if (late) console.warn(`its lease renewed_late run=${r.runId} expired=${Math.round((now - held!.until) / 1000)}s ago`);
    const c = runnerConfig(this.rec, this.mode, r.runId, now, true);
    console.log(`its report run=${r.runId} host=${r.host} phase=${r.phase} scans=${r.scans} fail=${r.scanFailures} solves=${r.solves.ok}/${r.solves.failed} unsynced=${r.unsynced} ev=${ev?.added.length ?? 0}/${r.events.length} seen=${r.seen.length}${seen ? '+' : ''} lease=${patch.lease === undefined ? 'kept' : patch.lease ? 'renewed' : 'released'} stop=${c.stopReason ?? 0}`);
    for (const e of ev?.added ?? []) {
      if (e.kind !== 'available' && e.kind !== 'filtered') console.log(`its event ${e.kind} run=${r.runId} seq=${e.seq} date=${e.date ?? '-'} hotel=${q(e.hotel)} detail=${q(e.detail)}`);
    }
    if (r.lastError && r.scanFailures) console.warn(`its runner error step=${r.lastError.step} status=${r.lastError.status} cls=${r.lastError.cls} streak=${r.scanFailures}`);
    return c;
  }

  /** The runner's booking entries: appended (a known id with the same content ignored), never changed, pruned
   *  BOOKINGS_KEEP_DAYS after the stay. Refused (`ok: false`, the HTTP status for index.ts): an id reused for other
   *  content (409 id_conflict, nothing kept), or entries past the record's bound (507 record_full, those that fit kept):
   *  either way the runner keeps them unsynced. */
  async bookings(list: BookingInput[], runId: string | null): Promise<BookingsReply> {
    const now = Date.now();
    const r = addBookings(this.rec.bookings, list, now);
    if (r.conflict) {
      const had = this.rec.bookings.find((b) => b.id === r.conflict) ?? list.find((b) => b.id === r.conflict)!;
      const got = list.findLast((b) => b.id === r.conflict)!;
      console.error(`its bookings refused id_conflict run=${runId ?? '-'} id=${r.conflict} had=${had.kind}/${had.date}/${q(had.hotel)} got=${got.kind}/${got.date}/${q(got.hotel)}`);
      return { ok: false, status: 409, error: 'id_conflict' };
    }
    if (r.bookings !== this.rec.bookings) await this.save({ bookings: r.bookings });
    console.log(`its bookings run=${runId ?? '-'} got=${list.length} new=${r.added.length} kept=${r.bookings.length}`);
    for (const b of r.added) console.log(`its booking ${b.kind} id=${b.id} date=${b.date} hotel=${q(b.hotel)}${b.number ? ' number=yes' : ''}`);
    if (r.refused) {
      console.error(`its bookings refused=${r.refused} record_full: the record is full (${r.bookings.length}); back it up and look`);
      return { ok: false, status: 507, error: 'record_full' };
    }
    return { ok: true, config: runnerConfig(this.rec, this.mode, runId, now) };
  }
}

/** POST /runner/bookings's outcome: the RunnerConfig, or a refusal for index.ts to answer. */
export type BookingsReply = { ok: true; config: RunnerConfig } | { ok: false; status: 409 | 507; error: 'id_conflict' | 'record_full' };
