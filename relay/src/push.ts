// Goal notifications, the relay's side (docs/backend.md#notifications): the subscriptions each person's phones hold,
// and the one push a day when a person's day reaches all four goals, to the partner's phones. Free of the Workers
// runtime so it is unit-testable: storage, the push sender and the clock come in through PushIO; the Durable Object
// (index.ts) stores the subscriptions in its SQLite and sends with fetch.
import type { Who } from '../../app/src/lib/sync/live-protocol.ts';
import type { GoalOutcome, PushLang, PushMsg, PushSub } from '../../app/src/lib/sync/push-protocol.ts';

export interface StoredSub extends PushSub {
  who: Who;
  lang: PushLang;
  /** When it was (re)subscribed, ms. */
  at: number;
}

export interface PushIO {
  subs(who: Who): StoredSub[];
  putSub(s: StoredSub): void;
  /** Remove a subscription; `who` limits it to that person's (a phone unsubscribes only its own). */
  dropSub(endpoint: string, who?: Who): void;
  /** The Tokyo date of the person's last goal push (or attempt), or null. */
  sentOn(who: Who): string | null;
  setSentOn(who: Who, date: string): void;
  /** Deliver one message to one subscription: the push service's HTTP status, or 0 when it couldn't be reached. */
  send(s: StoredSub, msg: PushMsg): Promise<number>;
  now(): number;
}

/** Quiet hours, Tokyo: no push from 22:00 until 08:00 (it is skipped, not queued). */
export const QUIET = { from: 22, to: 8 } as const;
/** Subscriptions kept per person (a phone and a spare browser, re-subscriptions); the oldest goes beyond. */
export const MAX_SUBS = 4;

const TOKYO_MS = 9 * 3600_000;

/** The Tokyo date (YYYY-MM-DD) and hour at `ms` (Japan has no daylight saving). */
export function tokyo(ms: number): { date: string; hour: number } {
  const d = new Date(ms + TOKYO_MS);
  return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() };
}

export const quiet = (hour: number): boolean => hour >= QUIET.from || hour < QUIET.to;

const other = (w: Who): Who => (w === 'A' ? 'B' : 'A');

export class PushCore {
  constructor(private readonly io: PushIO) {}

  /** Keep (or refresh) a phone's subscription. A known endpoint moves to whoever subscribes it now. */
  subscribe(who: Who, sub: PushSub, lang: PushLang): void {
    this.io.dropSub(sub.endpoint);
    this.io.putSub({ ...sub, who, lang, at: this.io.now() });
    const mine = this.io.subs(who).sort((a, b) => a.at - b.at);
    for (const old of mine.slice(0, Math.max(0, mine.length - MAX_SUBS))) this.io.dropSub(old.endpoint);
  }

  unsubscribe(who: Who, endpoint: string): void {
    this.io.dropSub(endpoint, who);
  }

  /**
   * `who`'s day `date` reached all four goals: tell the partner's phones, once a day per person, never in quiet hours
   * and only for today (a phone with a wrong clock or yesterday's view is `stale`). A day is spent by its first report
   * whatever happens (quiet hours too: the partner sees it on the island next time), except when no push service took
   * the message (`failed`), so the next report may try again.
   */
  async goal(who: Who, r: { date: string; both: boolean; name: string }): Promise<{ outcome: GoalOutcome; sent: number }> {
    const { date, hour } = tokyo(this.io.now());
    if (r.date !== date) return { outcome: 'stale', sent: 0 };
    if (this.io.sentOn(who) === date) return { outcome: 'dup', sent: 0 };
    if (quiet(hour)) {
      this.io.setSentOn(who, date);
      return { outcome: 'quiet', sent: 0 };
    }
    const to = this.io.subs(other(who));
    if (!to.length) {
      this.io.setSentOn(who, date);
      return { outcome: 'none', sent: 0 };
    }
    let sent = 0;
    let gone = 0;
    for (const s of to) {
      const status = await this.io.send(s, { v: 1, kind: r.both ? 'both' : 'goal', name: r.name, date, lang: s.lang });
      if (status >= 200 && status < 300) sent++;
      else if (status === 404 || status === 410) {
        // the browser dropped it (unsubscribed, reinstalled, permission revoked): forget it
        this.io.dropSub(s.endpoint);
        gone++;
      }
    }
    if (sent || gone === to.length) this.io.setSentOn(who, date);
    return { outcome: sent ? 'sent' : gone === to.length ? 'none' : 'failed', sent };
  }
}
