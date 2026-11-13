// The gym bot's current settings (docs/design.md "Bots": ボット's ジム tab, its 現在の設定): the Worker's
// members-only GET /gym/config, which is 📋 設定を見る's answer in the LINE group in parts, worded by the bot's own
// functions (gym/src/messages.ts statusView). The page shows those words as they are; nothing here rewords them.
// Read with this phone's key through lib/keyed.ts (a failure logged as keyed.fail `gym`), checked with
// contract/guards.ts; an older Worker without the route, or a key it doesn't take, hides the section (no
// error).
import { getKey } from '#lib/sync/storage.ts';
import { keyed } from '#lib/keyed.ts';
import { isRec, isText } from '#lib/contract/guards.ts';
import { GYM_URL } from './status.ts';

// ---- The payload: the parts of gym/src/actions.ts GymConfig the page shows (the Worker owns it, and also sends
// now, intervalMin, lastCheck, nextCheck and LINE's text, unread here; change both together) ----
interface ConfigDay {
  day: string;            // YYYY-MM-DD, Tokyo
  date: string;           // 10/5（月）
  rule: string;           // 🔔 終日, ⏰ 12:00〜13:00（ふだん）, 🔕 通知オフ, 💤 まだチェックしない（…）
  from: string | null;    // ⏳ 16:00から
  soft: boolean;          // nothing announced that day (🔕, 💤): shown soft. An older Worker sends none: false
}
export interface GymConfig {
  title: string;          // 📋 日ごとの設定
  days: ConfigDay[];
  notice: string | null;  // ⚠️ the site is hard to reach
  check: string;          // 15分ごとにチェック・前回 12:00・次回 12:15, or that checks are stopped
  paused: boolean;
}

const str = (x: unknown): x is string => isText(x, 2000);
const strOrNull = (x: unknown): string | null | undefined => (x === null ? null : str(x) ? x : undefined);

function parseDay(x: unknown): ConfigDay | null {
  if (!isRec(x) || typeof x.day !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(x.day) || !str(x.date) || !str(x.rule)) return null;
  const from = strOrNull(x.from ?? null);
  const soft = x.soft ?? false;
  return from === undefined || typeof soft !== 'boolean' ? null : { day: x.day, date: x.date, rule: x.rule, from, soft };
}

/** A /gym/config answer as the page reads it, or null when it isn't one (another version, a proxy's page, garbage).
 *  All or nothing: these are the bot's own words, shown whole or not at all. */
export function parseConfig(x: unknown): GymConfig | null {
  if (!isRec(x) || x.v !== 1 || !str(x.title) || !str(x.check) || !Array.isArray(x.days) || typeof x.paused !== 'boolean') return null;
  const days = x.days.map(parseDay);
  const notice = strOrNull(x.notice ?? null);
  if (days.some((d) => d === null) || notice === undefined) return null;
  return { title: x.title, days: days as ConfigDay[], notice, check: x.check, paused: x.paused };
}

/** A fetch's outcome: the settings, or `hide` (no key, or a Worker without the route or that won't take the key),
 *  `failed` (a server error, garbage) or `unreached` (no answer: offline, a timeout, or a preflight an older Worker
 *  refused without CORS, which the browser can't tell apart; the caller's abort too, which the page ignores). */
export type ConfigReply = { ok: true; config: GymConfig } | { ok: false; why: 'hide' | 'failed' | 'unreached' };

/** GET /gym/config with this phone's key (lib/keyed.ts: its failure logged as keyed.fail `gym`). Never throws. */
export async function fetchConfig(signal?: AbortSignal, url = GYM_URL, key = getKey()): Promise<ConfigReply> {
  const r = await keyed(url && `${url}/gym/config`, key, { signal, cache: 'no-store' });
  if (!r.ok) return { ok: false, why: r.why === 'unpaired' || r.why === 'refused' ? 'hide' : r.why === 'failed' ? 'failed' : 'unreached' };
  const config = parseConfig(await r.res.json().catch(() => null));
  return config ? { ok: true, config } : { ok: false, why: 'failed' };
}

// ---- The section ----
/** What 現在の設定 shows after a fetch, given the last good answer: hidden until one comes (an unreached Worker is
 *  most likely an older one, so no error), then a failure keeps it under the retry row; `hide` drops it. */
export function settle(cfg: GymConfig | null, r: ConfigReply): { cfg: GymConfig | null; state: 'hidden' | 'ok' | 'failed' } {
  if (r.ok) return { cfg: r.config, state: 'ok' };
  if (r.why === 'hide' || (r.why === 'unreached' && !cfg)) return { cfg: null, state: 'hidden' };
  return { cfg, state: 'failed' };
}
