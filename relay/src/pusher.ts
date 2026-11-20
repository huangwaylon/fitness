// やること's push side on the record's object (docs/todo.md "Reminders"): the phones' subscriptions (`pushsub`, device
// state: not an event, never in a dump), the ledger of what was sent (`push_sent`: `id|fire|ep`, kept 7 days) and the
// tries to send again (`push_retry`), the sender (its-bot's Web Push: its/worker/src/webpush.ts, the same VAPID pair),
// and the reminders' schedule: `next` (the alarm's next minute) and `tick` (what is due, sent). Every rule is re-read at
// the minute it fires: an item done, removed, re-dated or its reminder changed is simply not among the reminders then
// (remind.ts remindersOf), so nothing is ever cancelled. Free of the Workers runtime (test/push.test.ts: node:sqlite, a
// fake push service through `deps`, a fake clock).
import type { Who } from '../../app/src/lib/contract/api.ts';
import type { TodoListView } from '../../app/src/lib/contract/todo.ts';
import type { PushPresence, PushStatus, PushSubscribeInput, TodoPushPayload } from '../../app/src/lib/contract/push.ts';
import { endpointOk, epOf, keysOk, outcomeOf, reasonOf } from '../../its/worker/src/push.ts';
import { pushRequest, type Vapid } from '../../its/worker/src/webpush.ts';
import { inWindow, payloadOf, remindersOf, retryAt, testPayloadOf, type Reminder } from './remind.ts';
import type { Sql } from './store.ts';
import { errName } from './log.ts';

const SUBS_PER_WHO = 5;
const SUB_KEEP_MS = 30 * 86_400_000;
const SENT_KEEP_MS = 7 * 86_400_000;
const TEST_EVERY_MS = 5_000;
/** How long a push service holds a reminder for a phone that's off. */
const TTL_S = 3600;
/** A reminder missed by more than LATE_MS is logged (`skip late`) if it is at most this old. */
const LATE_LOG_MS = 86_400_000;

const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS pushsub (ep TEXT PRIMARY KEY, endpoint TEXT NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL, who TEXT NOT NULL, lang TEXT NOT NULL, at INTEGER NOT NULL, test INTEGER NOT NULL DEFAULT 0) WITHOUT ROWID',
  'CREATE TABLE IF NOT EXISTS push_sent (k TEXT PRIMARY KEY, at INTEGER NOT NULL) WITHOUT ROWID',
  'CREATE TABLE IF NOT EXISTS push_retry (k TEXT PRIMARY KEY, tries INTEGER NOT NULL, next INTEGER NOT NULL) WITHOUT ROWID'
];

type Sub = { ep: string; endpoint: string; p256dh: string; auth: string; who: Who; lang: 'ja' | 'en'; at: number; test: number };

type PushOutcome = ReturnType<typeof outcomeOf>;
/** The push services an endpoint may point at (its-bot's PUSH_HOSTS, app/src/lib/its/contract.ts): Apple's, and FCM
 *  for a desktop Chrome while developing. */
export const PUSH_HOSTS: readonly string[] = ['web.push.apple.com', 'fcm.googleapis.com'];

/** The push services' hosts and the fetch that calls them: tests inject a fake push service here (never an env flag). */
export interface PushDeps { hosts: readonly string[]; fetch: (req: Request) => Promise<Response> }

/** A `todo.push` line's fields (contract/log.ts): never an endpoint (its `ep`: 6 hex of its SHA-256) or a text. */
export type PushLine = Record<string, string | number | boolean>;

export interface PusherIO {
  sql: Sql;
  now(): number;
  /** The VAPID pair (its/worker push.ts vapidOf), or null: push is off (subscribe 503, nothing scheduled). */
  vapid: Vapid | null;
  /** Read at each use (a test sets the object's pushDeps after it is made). */
  deps(): PushDeps;
  /** The lists as the record holds them now (store.ts todoLists). */
  todos(): TodoListView[];
  log(l: 1 | 2 | 3, d: PushLine): void;
}

export type PushAnswer = { ok: true; push: PushStatus } | { ok: false; status: number; error: string };

const short = (ep: string) => ep.slice(0, 6);
const keyOf = (r: Reminder, ep: string) => `${r.id}|${r.fire}|${ep}`;

export class Pusher {
  constructor(private io: PusherIO) {
    for (const s of SCHEMA) io.sql.exec(s);
  }

  private subs(now: number): Sub[] {
    return this.io.sql.exec<Sub>('SELECT ep, endpoint, p256dh, auth, who, lang, at, test FROM pushsub WHERE at > ?', now - SUB_KEEP_MS).toArray();
  }

  /** Who has a live subscription (the form's 「この端末は通知オフ」). */
  presence(now = this.io.now()): PushPresence {
    const p: PushPresence = { A: false, B: false, G: false };
    for (const s of this.subs(now)) p[s.who] = true;
    return p;
  }

  private async status(who: Who, endpoint: unknown): Promise<PushStatus> {
    const now = this.io.now();
    const ep = typeof endpoint === 'string' && endpoint ? await epOf(endpoint) : null;
    const on = ep !== null && this.subs(now).some((s) => s.ep === ep && s.who === who);
    return { vapidPublic: this.io.vapid?.publicKey ?? null, on, subs: this.presence(now) };
  }

  /** `POST /api/push`: the state, `on` for the endpoint sent (if any). */
  async state(who: Who, endpoint?: unknown): Promise<PushAnswer> {
    return { ok: true, push: await this.status(who, endpoint) };
  }

  /** `POST /api/push/subscribe`: kept (or refreshed) for `who`; an endpoint another had moves to `who`; a sixth of
   *  theirs replaces their least recently refreshed. */
  async subscribe(who: Who, i: Partial<PushSubscribeInput>): Promise<PushAnswer> {
    if (!this.io.vapid) return { ok: false, status: 503, error: 'push_off' };
    if (!endpointOk(i.endpoint, this.io.deps().hosts)) return { ok: false, status: 400, error: 'bad_push_endpoint' };
    if (!(await keysOk(i.keys?.p256dh, i.keys?.auth))) return { ok: false, status: 400, error: 'bad_push_keys' };
    if (i.lang !== 'ja' && i.lang !== 'en') return { ok: false, status: 400, error: 'bad_push_lang' };
    const now = this.io.now(), ep = await epOf(i.endpoint);
    const sql = this.io.sql;
    const had = sql.exec<{ who: string; test: number }>('SELECT who, test FROM pushsub WHERE ep = ?', ep).toArray()[0];
    sql.exec('INSERT OR REPLACE INTO pushsub (ep, endpoint, p256dh, auth, who, lang, at, test) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', ep, i.endpoint, i.keys!.p256dh, i.keys!.auth, who, i.lang, now, had?.test ?? 0);
    const mine = sql.exec<{ ep: string }>('SELECT ep FROM pushsub WHERE who = ? ORDER BY at DESC', who).toArray();
    for (const s of mine.slice(SUBS_PER_WHO)) this.drop(s.ep);
    this.io.log(1, { op: 'subscribe', who, ep: short(ep), lang: i.lang, moved: !!had && had.who !== who, replaced: Math.max(0, mine.length - SUBS_PER_WHO) });
    return { ok: true, push: await this.status(who, i.endpoint) };
  }

  /** `POST /api/push/unsubscribe`: forgotten if it is `who`'s (ok either way). */
  async unsubscribe(who: Who, endpoint: unknown): Promise<PushAnswer> {
    if (typeof endpoint !== 'string' || !endpoint) return { ok: false, status: 400, error: 'bad_push_endpoint' };
    const ep = await epOf(endpoint);
    const mine = this.io.sql.exec('SELECT 1 FROM pushsub WHERE ep = ? AND who = ?', ep, who).toArray().length > 0;
    if (mine) this.drop(ep);
    this.io.log(1, { op: 'unsubscribe', who, ep: short(ep), n: mine ? 1 : 0 });
    return { ok: true, push: await this.status(who, endpoint) };
  }

  /** `POST /api/push/test`: a test notification to `who`'s own subscription now, TEST_EVERY_MS apart. */
  async test(who: Who, endpoint: unknown): Promise<PushAnswer> {
    if (!this.io.vapid) return { ok: false, status: 503, error: 'push_off' };
    if (typeof endpoint !== 'string' || !endpoint) return { ok: false, status: 400, error: 'bad_push_endpoint' };
    const now = this.io.now(), ep = await epOf(endpoint);
    const sub = this.subs(now).find((s) => s.ep === ep && s.who === who);
    if (!sub) return { ok: false, status: 404, error: 'not_subscribed' };
    if (now - sub.test < TEST_EVERY_MS) return { ok: false, status: 429, error: 'rate_limited' };
    this.io.sql.exec('UPDATE pushsub SET test = ? WHERE ep = ?', now, ep);
    const r = await this.send(sub, testPayloadOf(sub.lang, now), now);
    this.io.log(r.code === 'ok' ? 1 : 2, { op: 'test', who, ep: short(ep), code: r.code, status: r.status, ...(r.reason ? { reason: r.reason } : {}) });
    if (r.code === 'gone') this.drop(ep);
    if (r.code !== 'ok') return { ok: false, status: 502, error: 'push_failed' };
    return { ok: true, push: await this.status(who, endpoint) };
  }

  private drop(ep: string): void {
    this.io.sql.exec('DELETE FROM pushsub WHERE ep = ?', ep);
    this.io.sql.exec('DELETE FROM push_retry WHERE k LIKE ?', `%|${ep}`);
  }

  /** One push: its outcome (contract PushOutcome), the push service's status (0: no answer) and its reason. */
  private async send(sub: Sub, payload: TodoPushPayload, now: number): Promise<{ code: PushOutcome; status: number; reason?: string }> {
    try {
      const req = await pushRequest(sub, JSON.stringify(payload), this.io.vapid!, now, { ttl: TTL_S, urgency: 'high' });
      const res = await this.io.deps().fetch(req);
      const code = outcomeOf(res.status);
      const reason = code === 'ok' ? undefined : reasonOf((await res.text().catch(() => '')).slice(0, 2000));
      return { code, status: res.status, ...(reason ? { reason } : {}) };
    } catch (e) {
      return { code: e instanceof RangeError ? 'bug' : 'retry', status: 0, reason: errName(e) };
    }
  }

  /** Each reminder still in its window, with each live subscription of its people not yet sent (its retry's time, if
   *  one failed). */
  private pending(now: number): { r: Reminder; sub: Sub; at: number; tries: number }[] {
    if (!this.io.vapid) return [];
    const subs = this.subs(now);
    if (!subs.length) return [];
    const sql = this.io.sql;
    const out: { r: Reminder; sub: Sub; at: number; tries: number }[] = [];
    for (const r of remindersOf(this.io.todos())) {
      if (!inWindow(r.fire, now)) continue;
      for (const sub of subs) {
        if (!r.to.includes(sub.who)) continue;
        const k = keyOf(r, sub.ep);
        if (sql.exec('SELECT 1 FROM push_sent WHERE k = ?', k).toArray().length) continue;
        const retry = sql.exec<{ tries: number; next: number }>('SELECT tries, next FROM push_retry WHERE k = ?', k).toArray()[0];
        out.push({ r, sub, at: retry ? retry.next : r.fire, tries: retry?.tries ?? 0 });
      }
    }
    return out;
  }

  /** The alarm's next minute for the reminders, or null (none pending). */
  next(now = this.io.now()): number | null {
    let t: number | null = null;
    for (const p of this.pending(now)) t = t === null ? p.at : Math.min(t, p.at);
    return t;
  }

  /** The alarm's duty: each pending push whose time has come sent (in parallel), the outcome in the ledger; the stale
   *  subscriptions, ledger and tries let go. Never throws. */
  async tick(now = this.io.now()): Promise<{ sent: number; failed: number }> {
    let sent = 0, failed = 0;
    try {
      const sql = this.io.sql;
      sql.exec('DELETE FROM pushsub WHERE at <= ?', now - SUB_KEEP_MS);
      sql.exec('DELETE FROM push_sent WHERE at < ?', now - SENT_KEEP_MS);
      sql.exec('DELETE FROM push_retry WHERE next < ?', now - SENT_KEEP_MS);
      const due = this.pending(now).filter((p) => p.at <= now);
      const done = (k: string) => {
        sql.exec('INSERT OR REPLACE INTO push_sent (k, at) VALUES (?, ?)', k, now);
        sql.exec('DELETE FROM push_retry WHERE k = ?', k);
      };
      await Promise.all(due.map(async ({ r, sub, tries }) => {
        const k = keyOf(r, sub.ep), base = { who: sub.who, ep: short(sub.ep), rem: r.rem };
        const t0 = Date.now();
        const res = await this.send(sub, payloadOf(r, sub.lang), now);
        const line = { ...base, code: res.code, status: res.status, lateS: Math.round((now - r.fire) / 1000), tries: tries + 1, ms: Date.now() - t0, ...(res.reason ? { reason: res.reason } : {}) };
        if (res.code === 'ok') {
          sent++;
          done(k);
          return this.io.log(1, { op: 'send', ...line });
        }
        failed++;
        if (res.code === 'gone') {
          this.drop(sub.ep);
          return this.io.log(2, { op: 'drop', ...line });
        }
        const next = res.code === 'retry' ? retryAt(r.fire, tries + 1, now) : null;
        if (next === null) {
          done(k);
          return this.io.log(res.code === 'retry' ? 2 : 3, { op: 'send', ...line, ...(res.code === 'retry' ? { code: 'expired' } : {}) });
        }
        sql.exec('INSERT OR REPLACE INTO push_retry (k, tries, next) VALUES (?, ?, ?)', k, tries + 1, next);
        this.io.log(2, { op: 'retry', ...line });
      }));
      // what the window closed on before it was sent (the object woke late, an op queued offline came late): said once
      // (the ledger), never sent; only the last day's, for a phone subscribed by then
      if (this.io.vapid) for (const r of remindersOf(this.io.todos())) {
        if (inWindow(r.fire, now) || now - r.fire > LATE_LOG_MS) continue;
        for (const sub of this.subs(now)) {
          const k = keyOf(r, sub.ep);
          if (!r.to.includes(sub.who) || sub.at > r.fire || sql.exec('SELECT 1 FROM push_sent WHERE k = ?', k).toArray().length) continue;
          done(k);
          this.io.log(2, { op: 'skip', code: 'late', who: sub.who, ep: short(sub.ep), rem: r.rem, lateS: Math.round((now - r.fire) / 1000) });
        }
      }
    } catch (e) {
      this.io.log(3, { op: 'tick', err: errName(e) });
    }
    return { sent, failed };
  }
}
