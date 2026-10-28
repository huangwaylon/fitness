// Web push (VAPID from env). At most one notification per person per local day (notification_log PK).
import webpush from 'web-push';
import { eq } from 'drizzle-orm';
import type { PersonId } from '#lib/types.ts';
import { nowInZone } from '#lib/scoring/index.ts';
import type { Db } from '#lib/server/db/index.ts';
import { notificationLog, personPref, pushSubscription } from '#lib/server/db/schema.ts';
import { now } from '#lib/server/clock.ts';

/** Quiet hours (JST). */
const QUIET = { from: 22, until: 7 } as const;

export type PushKind = 'harvest' | 'checkin' | 'payday' | 'visit';

/** Push copy lives here (not in the UI catalogs) because the server renders it. Keep the banned-words list in mind. */
const MESSAGES: Record<PushKind, Record<'ja' | 'en', { title: string; body: string }>> = {
  harvest: {
    ja: { title: 'しまの貯金箱', body: '日曜の収穫だよ。今週の果物を壺へ 🍑' },
    en: { title: 'Island Fund', body: "Sunday harvest: put this week's fruit in the jar 🍑" }
  },
  checkin: {
    ja: { title: 'しまの貯金箱', body: '今夜のチェック、10秒だけどう? 🌙' },
    en: { title: 'Island Fund', body: "Tonight's check-in — 10 seconds? 🌙" }
  },
  payday: {
    ja: { title: '給料日 🐚', body: '先月の分を貯金に移したら ✓ をタップしてね' },
    en: { title: 'Payday 🐚', body: "Moved last month's yen to savings? Tap ✓" }
  },
  visit: {
    ja: { title: 'ジムに行ってきたね 🏋️', body: '筋トレとして記録する?' },
    en: { title: 'Gym visit 🏋️', body: 'Count it as a strength day?' }
  }
};

export function vapidConfigured(env = process.env): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}

let configured = false;
function configure(): boolean {
  if (!vapidConfigured()) return false;
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:island@example.invalid', process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
    configured = true;
  }
  return true;
}

/** Test seam: replace the transport. */
export type Sender = (sub: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string) => Promise<{ statusCode: number }>;
let sender: Sender = (sub, payload) => webpush.sendNotification(sub, payload, { TTL: 6 * 3600, urgency: 'normal' });
export function setSender(s: Sender | null): void {
  sender = s ?? ((sub, payload) => webpush.sendNotification(sub, payload, { TTL: 6 * 3600, urgency: 'normal' }));
}
let forceEnabled = false;
export function forcePushEnabled(v: boolean): void { forceEnabled = v; }

/**
 * Claim today's notification slot for `person` and send. Returns false (and sends nothing)
 * if push isn't configured, a notification already went out today, or there are no subscriptions.
 */
export async function notify(db: Db, person: PersonId, kind: PushKind, extra: { url?: string; tag?: string; data?: Record<string, unknown> } = {}): Promise<boolean> {
  if (!forceEnabled && !configure()) return false;
  const subs = db.select().from(pushSubscription).where(eq(pushSubscription.person, person)).all();
  if (subs.length === 0) return false;
  const z = nowInZone(now());
  if (z.hour < QUIET.until || z.hour >= QUIET.from) return false; // sleep-aware: nothing 22:00–07:00
  const localDate = z.date;
  const claimed = db.insert(notificationLog).values({ person, localDate, kind }).onConflictDoNothing().run();
  if (claimed.changes !== 1) return false;
  const locale = db.select().from(personPref).where(eq(personPref.person, person)).get()?.locale ?? 'ja';
  const msg = MESSAGES[kind][locale];
  const payload = JSON.stringify({ kind, key: `push.${kind}`, ...msg, url: extra.url ?? '/', tag: extra.tag ?? kind, data: extra.data ?? {} });
  let sent = false;
  for (const s of subs) {
    try {
      await sender({ endpoint: s.endpoint, keys: JSON.parse(s.keysJson) }, payload);
      sent = true;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) db.delete(pushSubscription).where(eq(pushSubscription.id, s.id)).run();
      else console.error('[push] send failed', code ?? (e instanceof Error ? e.message : e));
    }
  }
  return sent;
}
