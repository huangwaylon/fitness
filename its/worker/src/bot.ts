// The record (README "How it works"): one Durable Object holding the settings, the bookings, the runner's last report,
// the lease, the dispatch, the events and the seen names, each under its own storage key. All of it is read once at
// start (one storage call) and kept in memory: a status read touches no storage, and each change is one batched put
// of the keys it changed. The Worker calls it by RPC (index.ts) with bodies already checked; the rules are rules.ts.
import { DurableObject } from 'cloudflare:workers';
import {
  DEFAULT_SETTINGS, LEASE_SEC, PUSH_HOSTS, PUSH_TEST_EVERY_SEC,
  type BookingInput, type ClaimInput, type ClaimReply, type ItsEvent, type ItsHealth, type ItsPushStatus, type ItsSettingsInput, type ItsStatus, type Member,
  type PushEndpointInput, type PushOutcome, type PushReply, type PushSubscribeInput, type RunInput, type RunnerConfig, type RunnerReport,
} from '../../../app/src/lib/its/contract.ts';
import { dispatchRun } from './dispatch.ts';
import type { Env } from './env.ts';
import {
  PUSHQ_KEPT, addSub, emptyPushLog, endpointOk, epOf, jobsFor, keysOk, liveSubs, noticesFor, outcomeOf, payloadOf, pushStatusOf, reasonOf,
  retryAt, topicOf, vapidOf, type PushJob, type PushLog, type PushSub,
} from './push.ts';
import {
  addBookings, addEvents, addMinutes, addOwnEvent, addScans, addSeen, claimLease, freshScans, healthOf, leaseTaken, liveSettings, runnerConfig, runnerOf, statusOf,
  type ItsRecord,
} from './rules.ts';
import { pushRequest } from './webpush.ts';

const KEYS = ['settings', 'bookings', 'runner', 'lease', 'dispatch', 'control', 'events', 'seen', 'acks', 'preflight', 'scans', 'minutes', 'subs', 'pushq', 'pushlog'] as const satisfies readonly (keyof ItsRecord)[];

/** A second 開始 this soon after a dispatch that no report has followed yet sends nothing (one run is on its way; the
 *  dispatch is recorded before GitHub is asked, so a double tap while it's asked is one too), unless a 停止 came after
 *  that dispatch: its run may have seen paused at its preflight and skipped, so 開始 → 停止 → 開始 dispatches again. */
const DISPATCH_AGAIN_MS = 2 * 60_000;
/** Phases of a run that will keep going: 開始 then needs no new run. */
const RUNNING = new Set(['starting', 'solving', 'scanning']);

const empty = (): ItsRecord => ({
  settings: { ...DEFAULT_SETTINGS }, bookings: [], runner: null, lease: null, dispatch: null, control: null,
  events: { routine: [], important: [] }, seen: {}, acks: [], preflight: null, scans: [], minutes: [], subs: [], pushq: [], pushlog: emptyPushLog(),
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
    const now = Date.now();
    return { ...statusOf(this.rec, this.mode, this.env.COMMIT ?? null, now), push: this.pushStatus(now) };
  }

  /** /health/its: codes and counts only. */
  async health(): Promise<ItsHealth> {
    return healthOf(this.rec, this.mode, Date.now());
  }

  /** The page's 保存: refused (ok false, the current status) when someone saved since the edit began (a 409: routine,
   *  logged at info). A body without `search` (an older page) keeps the saved allow-list. */
  async putSettings(input: ItsSettingsInput, by: Member, rid: string): Promise<{ ok: boolean; status: ItsStatus }> {
    const now = Date.now();
    const cur = this.rec.settings;
    if (input.baseUpdatedAt !== cur.updatedAt) {
      console.log(`its settings conflict by=${by} base=${input.baseUpdatedAt} current=${cur.updatedAt} current_by=${cur.updatedBy ?? '-'} rid=${rid}`);
      return { ok: false, status: await this.status() };
    }
    const { baseUpdatedAt: _, ...edit } = input;
    const search = edit.search ?? cur.search;
    // strictly later than the last save, so a draft from before it always conflicts
    const settings = { ...edit, ...(search && { search }), v: 1 as const, paused: cur.paused, updatedAt: Math.max(now, (cur.updatedAt ?? 0) + 1), updatedBy: by };
    await this.save({ settings });
    console.log(`its settings by=${by} dates=${settings.dates.length} skip=${settings.skip.length} pri=${settings.priority.length} int=${settings.intervalSec} guests=${settings.guests} auto=${settings.autoConfirm ? 1 : 0} search=${settings.search?.length ?? '-'}${!edit.search && search ? ' search_kept=1' : ''} list=${settings.dates.join(',') || '-'} rid=${rid}`);
    return { ok: true, status: await this.status() };
  }

  /** 開始 / 停止, at once and outside the draft (`updatedAt` doesn't move: no one's draft conflicts with it), recorded as
   *  `control` (who, when). 開始 dispatches a run unless one wouldn't run (MODE off, no date), one is running, or one
   *  was just dispatched: the dispatch is recorded (ok, no status yet) before GitHub is asked, so a 開始 meanwhile is
   *  `recent`, and a 停止 meanwhile stays (only `dispatch` is written after). */
  async run(input: RunInput, by: Member, rid: string): Promise<ItsStatus> {
    const now = Date.now();
    const settings = { ...this.rec.settings, paused: input.action === 'stop' };
    const control = { action: input.action, by, at: now };
    if (input.action === 'stop') {
      await this.save({ settings, control });
      console.log(`its run stop by=${by} runner=${this.rec.runner?.runId ?? '-'} rid=${rid}`);
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
      console.log(`its run start by=${by} dispatch=skip_${skip}${skip === 'recent' ? ` last=${Math.round((now - dispatch!.at) / 1000)}s` : ''} rid=${rid}`);
      return this.status();
    }
    await this.save({ settings, control, dispatch: { at: now, ok: true, status: null } });   // = no token: nothing sent
    if (this.env.GH_DISPATCH_TOKEN) await this.save({ dispatch: await dispatchRun(this.env.GH_DISPATCH_TOKEN, now) });
    console.log(`its run start by=${by} dispatch=${this.rec.dispatch?.status ?? 'no_token'} rid=${rid}`);
    return this.status();
  }

  async claim(input: ClaimInput): Promise<ClaimReply> {
    const now = Date.now();
    const lease = claimLease(this.rec.lease, input.runId, input.host, now);
    if (!lease) {
      const held = this.rec.lease!;
      console.warn(`its claim run=${input.runId} host=${input.host} ok=0 holder=${held.holder} holder_host=${held.host} for=${Math.round((held.until - now) / 1000)}s`);
      return { ok: false, lease: held };
    }
    // a lease still on the record and someone else's: its holder never released it (no run_end): it died or was cancelled
    const takeover = this.rec.lease && this.rec.lease.holder !== input.runId ? this.rec.lease.holder : null;
    if (takeover) {
      const events = addOwnEvent(this.rec.events, { runId: input.runId, t: now, kind: 'prev_unclean', detail: takeover });
      await this.save({ lease, events });
      console.warn(`its claim run=${input.runId} host=${input.host} ok=1 took_over=${takeover} event=prev_unclean`);
    } else {
      await this.save({ lease });
      console.log(`its claim run=${input.runId} host=${input.host} ok=1`);
    }
    return { ok: true, lease, config: runnerConfig(this.rec, this.mode, input.runId, now) };
  }

  /** A run's config read; without a runId, a run's preflight (deciding whether to start): stamped `preflight`. */
  async config(runId: string | null): Promise<RunnerConfig> {
    const now = Date.now();
    if (runId === null) await this.save({ preflight: now });
    const c = runnerConfig(this.rec, this.mode, runId, now);
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
    const minutes = addMinutes(this.rec.minutes, freshScans(this.rec.scans, r.runId, r.scansLog), now);
    if (minutes) patch.minutes = minutes;
    const scans = addScans(this.rec.scans, r.runId, r.scansLog, now);
    if (scans) patch.scans = scans;
    const held = this.rec.lease;
    const ended = r.events.some((e) => e.kind === 'run_end');
    const late = !ended && held?.holder === r.runId && held.until <= now;
    if (held?.holder === r.runId) {
      patch.runner = runnerOf(r, now, this.rec.runner);
      patch.lease = ended ? null : { ...held, until: now + LEASE_SEC * 1000 };
    } else if (!leaseTaken(held, r.runId, now)) {
      patch.runner = runnerOf(r, now, this.rec.runner);   // nobody holds it: still the runner to show (a retried last report)
    } else {
      console.warn(`its report no_lease run=${r.runId} holder=${held!.holder}`);
    }
    const queued = ev ? this.queuePushes(ev.added, ev.events.important, now) : null;
    if (queued) Object.assign(patch, { pushq: queued.pushq, pushlog: queued.pushlog });
    await this.save(patch);
    if (queued?.n) await this.wake(now);
    if (late) console.warn(`its lease renewed_late run=${r.runId} late=${Math.round((now - held!.until) / 1000)}s`);
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
      console.error(`its bookings refused record_full run=${runId ?? '-'} n=${r.refused} kept=${r.bookings.length}`);   // back it up and look
      return { ok: false, status: 507, error: 'record_full' };
    }
    return { ok: true, config: runnerConfig(this.rec, this.mode, runId, now) };
  }

  // ---- Web Push (README "Push"; the rules are push.ts) ----

  /** The push services' hosts and the fetch that calls them: tests inject a fake push service here (never an env flag). */
  pushDeps: { hosts: readonly string[]; fetch: (req: Request) => Promise<Response> } = { hosts: PUSH_HOSTS, fetch: (req) => fetch(req) };

  private get vapid() {
    return vapidOf(this.env.VAPID_PUBLIC, this.env.VAPID_PRIVATE);
  }

  private pushStatus(now: number): ItsPushStatus {
    return pushStatusOf(this.rec.subs, this.rec.pushlog, this.vapid, now);
  }

  /** POST /its/push/subscribe: stored (or refreshed) for `by`; its endpoint moved from whoever had it. */
  async subscribe(input: PushSubscribeInput, by: Member, rid: string): Promise<PushAnswer> {
    const now = Date.now();
    if (!this.vapid) return { ok: false, status: 503, error: 'push_off' };
    if (!endpointOk(input.endpoint, this.pushDeps.hosts)) return { ok: false, status: 400, error: 'bad_push_endpoint' };
    if (!(await keysOk(input.keys.p256dh, input.keys.auth))) return { ok: false, status: 400, error: 'bad_push_keys' };
    const ep = await epOf(input.endpoint);
    const sub: PushSub = { ep, endpoint: input.endpoint, p256dh: input.keys.p256dh, auth: input.keys.auth, who: by, lang: input.lang, at: now, lastOk: null, fails: 0 };
    const r = addSub(this.rec.subs, sub, now);
    await this.save({ subs: r.subs });
    const s = this.pushStatus(now);
    console.log(`its push subscribe by=${by} ep=${ep.slice(0, 6)} lang=${input.lang} subs=A${s.A}/B${s.B} moved=${r.moved ? 1 : 0} replaced=${r.replaced} rid=${rid}`);
    return { ok: true, push: s };
  }

  /** POST /its/push/unsubscribe: forgotten if it is `by`'s (another member's stays: ok either way, nothing told). */
  async unsubscribe(input: PushEndpointInput, by: Member, rid: string): Promise<PushAnswer> {
    const now = Date.now();
    const ep = await epOf(input.endpoint);
    const subs = this.rec.subs.filter((s) => !(s.ep === ep && s.who === by));
    const removed = this.rec.subs.length - subs.length;
    if (removed) await this.save({ subs, pushq: this.rec.pushq.filter((j) => j.ep !== ep) });
    console.log(`its push unsubscribe by=${by} ep=${ep.slice(0, 6)} removed=${removed} rid=${rid}`);
    return { ok: true, push: this.pushStatus(now) };
  }

  /** POST /its/push/test: one notification to the caller's own subscription, sent now (the outcome in the answer's
   *  lastOutcome); PUSH_TEST_EVERY_SEC apart (no daily cap). */
  async testPush(input: PushEndpointInput, by: Member, rid: string): Promise<PushAnswer> {
    const now = Date.now();
    const vapid = this.vapid;
    if (!vapid) return { ok: false, status: 503, error: 'push_off' };
    const ep = await epOf(input.endpoint);
    const sub = liveSubs(this.rec.subs, now).find((s) => s.ep === ep && s.who === by);
    if (!sub) return { ok: false, status: 404, error: 'not_subscribed' };
    if (now - (sub.lastTest ?? 0) < PUSH_TEST_EVERY_SEC * 1000) {
      console.warn(`its push test refused rate_limited by=${by} ep=${ep.slice(0, 6)} rid=${rid}`);
      return { ok: false, status: 429, error: 'rate_limited' };
    }
    await this.save({ subs: this.rec.subs.map((s) => (s.ep === ep ? { ...s, lastTest: now } : s)) });
    const job: PushJob = { key: `test|${ep}`, ep, kind: 'test', id: 'test', urgency: 'high', until: now + 60_000, tries: 0, next: now };
    const sent = await this.deliver(job, sub, vapid, now);
    await this.save(this.recordSent([sent], now));
    return { ok: true, push: this.pushStatus(now) };
  }

  /** A report's new events as outbox entries, one per live subscription (push.ts noticesFor), or null (nothing to
   *  send). Never throws: a push never fails a report. */
  private queuePushes(added: ItsEvent[], important: ItsEvent[], now: number): { pushq: PushJob[]; pushlog: PushLog; n: number } | null {
    try {
      const r = noticesFor(added, { settings: this.rec.settings, bookings: this.rec.bookings, events: important, done: this.rec.pushlog.done }, now);
      for (const s of r.skipped) console.log(`its push skip ${s.why} kind=${s.kind} id=${s.id}${s.left !== undefined ? ` left=${s.left}s` : ''}`);
      if (!r.notices.length) return null;
      if (!this.vapid) {
        console.warn(`its push skip no_vapid notices=${r.notices.length}`);
        return null;
      }
      const jobs = jobsFor(r.notices, this.rec.subs, now);
      for (const n of r.notices) console.log(`its push queued kind=${n.kind} id=${n.id} urgency=${n.urgency} ttl=${Math.round((n.until - now) / 1000)}s subs=${jobs.filter((j) => j.id === n.id).length}`);
      return { pushq: [...this.rec.pushq, ...jobs].slice(-PUSHQ_KEPT), pushlog: { ...this.rec.pushlog, done: r.done }, n: jobs.length };
    } catch (e) {
      console.error(`its push queue failed err=${e instanceof Error ? e.name : 'error'}`, e);
      return null;
    }
  }

  /** The alarm's wake-up for the outbox; a failure to set it is logged, never thrown (the next report sets it again). */
  private async wake(at: number): Promise<void> {
    try {
      await this.ctx.storage.setAlarm(at);
    } catch (e) {
      console.error(`its push alarm failed err=${e instanceof Error ? e.name : 'error'}`, e);
    }
  }

  /** The outbox: every entry due is sent (concurrently), a success or a final answer removed, a retry kept with its
   *  backoff until its TTL; the alarm set again for the next one. */
  async alarm(): Promise<void> {
    const now = Date.now();
    const vapid = this.vapid;
    const due = this.rec.pushq.filter((j) => j.next <= now);
    const sent = await Promise.all(due.map((j) => {
      const sub = this.rec.subs.find((s) => s.ep === j.ep);
      return sub && vapid ? this.deliver(j, sub, vapid, now) : Promise.resolve(null);
    }));
    // the record as it is now: a report may have queued more while these were sent
    const done = new Map(due.map((j, i) => [j.key, sent[i]]));
    const pushq: PushJob[] = [];
    for (const j of this.rec.pushq) {
      if (!done.has(j.key)) {
        if (j.until > now) pushq.push(j);
        else console.warn(`its push expired kind=${j.kind} id=${j.id} ep=${j.ep.slice(0, 6)} tries=${j.tries}`);
        continue;
      }
      const s = done.get(j.key);
      if (!s) { console.warn(`its push dropped why=${vapid ? 'no_sub' : 'no_vapid'} kind=${j.kind} id=${j.id} ep=${j.ep.slice(0, 6)}`); continue; }
      if (s.code !== 'retry') continue;
      const next = retryAt(j, now, s.retryAfter);
      if (next) pushq.push({ ...j, tries: j.tries + 1, next });
      else { s.code = 'expired'; console.warn(`its push gave_up kind=${j.kind} id=${j.id} ep=${j.ep.slice(0, 6)} tries=${j.tries + 1}`); }
    }
    const rs = this.recordSent(sent.filter((s) => s !== null), now);
    const live = new Set(rs.subs.map((s) => s.ep));
    const kept = pushq.filter((j) => live.has(j.ep));
    await this.save({ ...rs, pushq: kept });
    if (kept.length) await this.wake(Math.max(Date.now(), Math.min(...kept.map((j) => j.next))));
  }

  /** One push, sent: its outcome (push.ts outcomeOf) and the log line; never throws. */
  private async deliver(j: PushJob, sub: PushSub, vapid: NonNullable<ItsBot['vapid']>, now: number): Promise<Sent> {
    const t0 = Date.now();
    const line = (code: string, status: number, extra = '') =>
      `its push kind=${j.kind} id=${j.id} ep=${j.ep.slice(0, 6)} who=${sub.who} status=${status} ms=${Date.now() - t0} outcome=${code}${extra}`;
    if (j.until <= now) {
      console.warn(line('expired', 0));
      return { j, sub, code: 'expired', status: 0, retryAfter: null };
    }
    if (!endpointOk(sub.endpoint, this.pushDeps.hosts)) {
      console.error(line('gone', 0, ' why=endpoint_not_allowed'));
      return { j, sub, code: 'gone', status: 0, retryAfter: null };
    }
    let req: Request;
    try {
      const tag = j.date && j.hotel ? await topicOf(j.date, j.hotel) : `its-${j.kind}`;
      const payload = JSON.stringify(payloadOf(j, sub.lang, tag));
      req = await pushRequest(sub, payload, vapid, now, { ttl: (j.until - now) / 1000, urgency: j.urgency, ...(j.date && j.hotel && { topic: tag }) });
    } catch (e) {
      console.error(line('bug', 0, ` why=${e instanceof Error ? e.message.split(' ')[0] : 'build'}`));
      return { j, sub, code: 'bug', status: 0, retryAfter: null };
    }
    let res: Response;
    try {
      res = await this.pushDeps.fetch(new Request(req, { signal: AbortSignal.timeout(PUSH_TIMEOUT_MS) }));
    } catch (e) {
      console.warn(line('retry', 0, ` why=${e instanceof Error ? e.name : 'network'}`));
      return { j, sub, code: 'retry', status: 0, retryAfter: null };
    }
    const code = outcomeOf(res.status);
    const reason = code === 'ok' ? undefined : reasonOf((await res.text().catch(() => '')).slice(0, 1000));
    const ra = Number(res.headers.get('Retry-After'));
    const msg = line(code, res.status, reason ? ` reason=${reason}` : '');
    if (code === 'ok' || code === 'gone') console.log(msg);
    else if (code === 'retry') console.warn(msg);
    else console.error(code === 'config' ? `${msg} why=vapid_refused` : msg);   // config: README "Push"
    return { j, sub, code, status: res.status, ...(reason && { reason }), retryAfter: res.headers.has('Retry-After') && Number.isFinite(ra) ? ra : null };
  }

  /** What sends did to the record: a gone subscription deleted (and its entries), an ok one's lastOk, the others'
   *  fails; the last outcome; the stale subscriptions dropped. */
  private recordSent(sent: Sent[], now: number): Pick<ItsRecord, 'subs' | 'pushlog'> & { pushq?: PushJob[] } {
    const gone = new Set(sent.filter((s) => s.code === 'gone').map((s) => s.j.ep));
    const by = new Map(sent.map((s) => [s.j.ep, s]));
    const subs = liveSubs(this.rec.subs, now).filter((s) => !gone.has(s.ep)).map((s) => {
      const r = by.get(s.ep);
      if (!r) return s;
      return r.code === 'ok' ? { ...s, lastOk: now, fails: 0 } : { ...s, fails: s.fails + 1 };
    });
    const last = sent.at(-1);
    const pushlog = {
      ...this.rec.pushlog,
      ...(sent.some((s) => s.code === 'ok') && { lastSentAt: now }),
      ...(last && { lastOutcome: { at: now, kind: last.j.kind, code: last.code, status: last.status, ...(last.reason && { reason: last.reason }) } }),
    };
    return { subs, pushlog, ...(gone.size && { pushq: this.rec.pushq.filter((j) => !gone.has(j.ep)) }) };
  }
}

const PUSH_TIMEOUT_MS = 10_000;

/** A push sent (or not: expired, unbuildable) and how it went. */
interface Sent { j: PushJob; sub: PushSub; code: PushOutcome; status: number; reason?: string; retryAfter: number | null }

/** A push route's outcome: the push status, or a refusal for index.ts to answer. */
export type PushAnswer = PushReply | { ok: false; status: 400 | 404 | 429 | 503; error: string };

/** POST /runner/bookings's outcome: the RunnerConfig, or a refusal for index.ts to answer. */
export type BookingsReply = { ok: true; config: RunnerConfig } | { ok: false; status: 409 | 507; error: 'id_conflict' | 'record_full' };
