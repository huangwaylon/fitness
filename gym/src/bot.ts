// The bot (MODE 'bot'; the Python gymbot.py): one Durable Object holding the state, checking the gym on its
// alarm, pushing alerts and notices to the group, and answering the taps (ui.ts). The alarm replaces poll_forever:
// each one runs a check and sets the next. The Worker calls it by RPC (index.ts).
import { DurableObject } from 'cloudflare:workers';
import type { Bot } from './actions.ts';
import type { Env } from './env.ts';
import { CheckFailed, fetchOpenSlots, matches, PROGRAMS, RateLimited, type Slot } from './hacomono.ts';
import { Line } from './line.ts';
import * as messages from './messages.ts';
import { Store, type StateJson } from './store.ts';
import { dayOf } from './time.ts';
import { handle } from './ui.ts';

export const MAX_BACKOFF_MINUTES = 120;
export const FAILURES_BEFORE_WARNING = 3;

/** Storage keys: the state (the Python state.json, Store.toJSON), and what the Python bot kept in memory, saved too
 *  so an eviction loses nothing. A saved state that can't be read is kept aside under STATE_BAD. */
const STATE = 'state';
const STATE_BAD = 'state.bad';
const RUNTIME = 'runtime';

interface Runtime {
  failures: number;
  siteDownSent: boolean;
  retry: [string, string] | null;
  lastCheck: number | null;
  lastManualCheck: number | null;
}

export class GymBot extends DurableObject<Env> implements Bot {
  store = new Store();
  line: Line;
  groupId: string;
  /** Fully failed checks in a row. */
  failures = 0;
  /** The "site is down" warning went out, and the recovery notice hasn't yet. */
  siteDownSent = false;
  /** The last push that failed: its text and X-Line-Retry-Key. */
  retry: [string, string] | null = null;
  lastCheck: number | null = null;
  lastManualCheck: number | null = null;
  checking = false;
  /** The Python check_lock: one check at a time (an alarm and a 🔎 tap can interleave at each await). */
  private lock: Promise<void> = Promise.resolve();
  /** The alarm's check is running; `woken` = the check settings changed meanwhile. */
  private polling = false;
  private woken = false;
  private savedRuntime = '';

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.line = new Line(env.LINE_CHANNEL_TOKEN);
    this.groupId = env.LINE_GROUP_ID ?? '';
    void ctx.blockConcurrencyWhile(() => this.load());
  }

  private async load(): Promise<void> {
    const saved = await this.ctx.storage.get(STATE);
    try {
      this.store = new Store(saved);
    } catch (e) { // broken or unsupported: start empty, the bad copy kept (GET /gym/state is the backup)
      console.error(`could not read the saved state (${e}); starting from an empty one`);
      await this.ctx.storage.put(STATE_BAD, saved);
      this.store = new Store();
    }
    const rt = await this.ctx.storage.get<Runtime>(RUNTIME);
    if (rt) ({ failures: this.failures, siteDownSent: this.siteDownSent, retry: this.retry, lastCheck: this.lastCheck,
      lastManualCheck: this.lastManualCheck } = rt);
    this.savedRuntime = JSON.stringify(this.runtime());
    if (!this.groupId) console.warn("LINE_GROUP_ID isn't set: alerts can't be sent until it is");
  }

  private runtime(): Runtime {
    const { failures, siteDownSent, retry, lastCheck, lastManualCheck } = this;
    return { failures, siteDownSent, retry, lastCheck, lastManualCheck };
  }

  /** Write the state if it changed, and the runtime fields if they did. */
  async save(): Promise<void> {
    if (this.store.dirty) {
      this.store.dirty = false; // before the await: a change meanwhile marks it again
      await this.ctx.storage.put(STATE, this.store.toJSON());
    }
    const rt = JSON.stringify(this.runtime());
    if (rt !== this.savedRuntime) {
      this.savedRuntime = rt;
      await this.ctx.storage.put(RUNTIME, JSON.parse(rt));
    }
  }

  // --- RPC from the Worker ---

  /** A LINE webhook event (MODE 'bot'). */
  async handle(event: Record<string, unknown>): Promise<void> {
    await handle(this, event);
    await this.save();
    await this.ensureAlarm();
  }

  /** The state, in the Python bot's state.json format (the backup). */
  async getState(): Promise<StateJson> {
    await this.ensureAlarm();
    return this.store.toJSON();
  }

  /** Replace the state (a restore, or an edit by hand). Refused if it isn't a valid v3 state. */
  async putState(json: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      this.store = new Store(json);
    } catch (e) {
      return { ok: false, error: String(e instanceof Error ? e.message : e) };
    }
    this.store.dirty = true;
    await this.save();
    console.log('state imported');
    await this.wake();
    return { ok: true };
  }

  /** Start the checks if they aren't scheduled: the first alarm after the switch to MODE 'bot'. */
  async ensureAlarm(): Promise<void> {
    if (this.env.MODE !== 'bot' || this.store.paused || this.polling) return;
    if ((await this.ctx.storage.getAlarm()) === null) await this.ctx.storage.setAlarm(Date.now());
  }

  // --- Bot (actions.ts) ---

  async nextCheck(): Promise<number | null> {
    return this.store.paused ? null : this.ctx.storage.getAlarm();
  }

  /** The check settings changed (Python's `wake`). Stopped: no alarm. Restarted: check now. A new interval: counted
   *  from the last check (now if that has passed). */
  async wake(): Promise<void> {
    if (this.store.paused) return this.ctx.storage.deleteAlarm();
    if (this.env.MODE !== 'bot') return;
    if (this.polling) { // the alarm sets the next one when its check ends
      this.woken = true;
      return;
    }
    const now = Date.now();
    const current = await this.ctx.storage.getAlarm();
    const next = (this.lastCheck ?? now) + this.store.intervalMinutes * 60_000;
    await this.ctx.storage.setAlarm(current === null ? now : Math.max(now, next));
  }

  /** Fetch both programs, alert on slot times not announced yet, and return the open slots that match. With
   *  `alert` false (🔎, whose reply lists them anyway) new times are only marked as announced. Throws CheckFailed
   *  (after alerting on whatever did succeed) if any program failed. */
  async runCheck(alert = true): Promise<Slot[]> {
    const before = this.lock;
    let release!: () => void;
    this.lock = new Promise((r) => (release = r));
    await before;
    this.checking = true;
    try {
      return await this.check(alert);
    } finally {
      this.checking = false;
      try {
        await this.save();
      } finally {
        release();
      }
    }
  }

  private async check(alert: boolean): Promise<Slot[]> {
    const now = Date.now();
    const today = dayOf(now);
    this.store.purge(now);
    let windows = this.store.windows(now);
    const lastDay = [...windows.keys()].at(-1) ?? today; // windows are in date order

    const found: Slot[] = [];
    const errors: Error[] = [];
    for (const [i, program] of (windows.size ? PROGRAMS : []).entries()) {
      if (i) await this.sleep(2000 + Math.random() * 3000); // space out requests
      try {
        // Always from today, so the response is never legitimately empty.
        found.push(...(await fetchOpenSlots(program, today, lastDay)));
      } catch (e) {
        console.warn(`fetch failed for ${program.key}: ${e}`);
        errors.push(e instanceof Error ? e : new Error(String(e)));
      }
    }

    windows = this.store.windows(now); // again: a tap may have changed a setting while fetching
    const open = found.filter((s) => {
      const day = dayOf(s.start);
      return s.start > now && windows.has(day) && matches(s, windows.get(day)!);
    });

    // Once per slot time: every program open at a new time is listed, later ones at that time aren't.
    const fresh = open.filter((s) => !this.store.isNotified(s.start));
    if (fresh.length) {
      try {
        if (alert) await this.push(messages.newSlots(fresh));
        this.store.markNotified(fresh.map((s) => s.start));
      } catch (e) { // still new next check
        console.warn(`could not send the alert to LINE: ${e}`);
      }
    }
    this.lastCheck = now;
    console.log(`check: ${open.length} open, ${fresh.length} new, ${errors.length} errors (through ${lastDay})`);
    if (errors.length) throw new CheckFailed(errors, open, errors.length === PROGRAMS.length);
    return open;
  }

  /** Spaces out the gym requests (a method so the tests can skip the wait). */
  sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  /** Send to the group. A retry of the same text keeps its retry key, so LINE drops it if an earlier try did arrive
   *  (e.g. it timed out). */
  async push(lines: string[]): Promise<void> {
    const text = lines.join('\n');
    if (!this.retry || this.retry[0] !== text) this.retry = [text, crypto.randomUUID()];
    await this.line.push(this.groupId, lines, this.retry[1]);
    this.retry = null;
  }

  /** Push a notice; true if it went out. Failures are only logged. */
  async notify(text: string): Promise<boolean> {
    try {
      await this.push([text]);
      return true;
    } catch (e) {
      console.warn(`could not send a notice to LINE: ${e}`);
      return false;
    }
  }

  // --- polling ---

  /** One automatic check, then the next alarm. Nothing (and no next alarm) unless MODE is 'bot' (MODE 'off' is the
   *  stop switch). */
  async alarm(): Promise<void> {
    if (this.env.MODE !== 'bot') return console.log(`alarm ignored (MODE ${this.env.MODE})`);
    if (this.store.paused) return;
    this.polling = true;
    this.woken = false;
    let delay: number;
    try {
      delay = await this.pollOnce();
    } catch (e) { // never let the checks stop
      console.error('unexpected error in poll loop', e);
      delay = this.store.intervalMinutes * 60_000;
    } finally {
      this.polling = false;
    }
    await this.save();
    if (this.store.paused) return;
    const now = Date.now();
    // the interval changed during the check: count the new one from the last check
    const next = this.woken ? (this.lastCheck ?? now) + this.store.intervalMinutes * 60_000 : now + delay;
    await this.ctx.storage.setAlarm(Math.max(now, next));
  }

  /** Run one check; return ms until the next one. */
  async pollOnce(): Promise<number> {
    const interval = this.store.intervalMinutes * 60_000;
    let delay = interval * (0.85 + Math.random() * 0.3);
    if (!this.store.windows(Date.now()).size) return delay; // nothing to check: says nothing about the site
    try {
      await this.runCheck(true);
    } catch (e) {
      if (!(e instanceof CheckFailed)) throw e;
      console.warn(`check failed: ${e.message}`);
      if (e.allFailed) { // the gym site is failing: back off, and warn the group once if it keeps failing
        this.failures++;
        const cap = MAX_BACKOFF_MINUTES * 60_000;
        const backoff = Math.min(interval * 2 ** (this.failures - 1), cap);
        const retryAfters = e.errors.map((x) => (x instanceof RateLimited && x.retryAfter ? x.retryAfter * 1000 : 0));
        delay = Math.max(delay, backoff, ...retryAfters);
        if (this.failures >= FAILURES_BEFORE_WARNING && !this.siteDownSent) { // retried if it fails
          this.siteDownSent = await this.notify(messages.SITE_DOWN);
        }
        return Math.min(delay, cap);
      }
    }
    // The site answered (perhaps for one program only)
    this.failures = 0;
    if (this.siteDownSent) this.siteDownSent = !(await this.notify(messages.SITE_BACK)); // retried next check if it fails
    return delay;
  }
}
