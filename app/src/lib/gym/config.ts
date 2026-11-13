// The gym bot's current settings (docs/design.md "Settings": 設定's ジムボット page, its 現在の設定): the Worker's
// members-only GET /gym/config, which is 📋 設定を見る's answer in the LINE group in parts, worded by the bot's own
// functions (gym/src/messages.ts statusView). The page shows those words as they are; nothing here rewords them.
// Read with this phone's key; an older Worker without the route, or a key it doesn't take, hides the section (no
// error). Not in demo mode (the page leaves the section out there).
import { getKey } from '#lib/sync/storage.ts';
import { GYM_URL } from './status.ts';

// ---- The payload: mirrors gym/src/actions.ts GymConfig (the Worker owns it; change both together) ----
interface ConfigDay {
  day: string;            // YYYY-MM-DD, Tokyo
  date: string;           // 10/5（月）
  rule: string;           // 🔔 終日, ⏰ 12:00〜13:00（ふだん）, 🔕 通知オフ, 💤 まだチェックしない（…）
  from: string | null;    // ⏳ 16:00から
}
export interface GymConfig {
  v: 1;
  now: number;
  title: string;          // 📋 日ごとの設定
  days: ConfigDay[];
  notice: string | null;  // ⚠️ the site is hard to reach
  check: string;          // 15分ごとにチェック・前回 12:00・次回 12:15, or that checks are stopped
  paused: boolean;
  intervalMin: number;
  lastCheck: number | null;
  nextCheck: number | null;
  text: string;           // LINE's reply verbatim
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const str = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length <= 2000;
const strOrNull = (x: unknown): string | null | undefined => (x === null ? null : str(x) ? x : undefined);

function parseDay(x: unknown): ConfigDay | null {
  if (!isObj(x) || typeof x.day !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(x.day) || !str(x.date) || !str(x.rule)) return null;
  const from = strOrNull(x.from ?? null);
  return from === undefined ? null : { day: x.day, date: x.date, rule: x.rule, from };
}

/** A /gym/config answer as the page reads it, or null when it isn't one (another version, a proxy's page, garbage).
 *  All or nothing: these are the bot's own words, shown whole or not at all. */
export function parseConfig(x: unknown): GymConfig | null {
  if (!isObj(x) || x.v !== 1 || num(x.now) === null || !str(x.title) || !str(x.check) || !str(x.text) || !Array.isArray(x.days)) return null;
  const days = x.days.map(parseDay);
  const notice = strOrNull(x.notice ?? null);
  if (days.some((d) => d === null) || notice === undefined || typeof x.paused !== 'boolean' || num(x.intervalMin) === null) return null;
  return {
    v: 1, now: x.now as number, title: x.title, days: days as ConfigDay[], notice, check: x.check, paused: x.paused,
    intervalMin: x.intervalMin as number, lastCheck: num(x.lastCheck), nextCheck: num(x.nextCheck), text: x.text
  };
}

/** A fetch's outcome: the settings, or `hide` (no key, or a Worker without the route or that won't take the key: the
 *  section stays out of sight) or `failed` (offline, a server error, garbage: the page offers a retry). */
export type ConfigReply = { ok: true; config: GymConfig } | { ok: false; why: 'hide' | 'failed' };

/** GET /gym/config with this phone's key. Never throws (an abort is a `failed` the page ignores). */
export async function fetchConfig(signal?: AbortSignal, url = GYM_URL, key = getKey()): Promise<ConfigReply> {
  if (!key || !url) return { ok: false, why: 'hide' };
  try {
    const res = await fetch(`${url}/gym/config`, { signal, cache: 'no-store', headers: { Authorization: `Bearer ${key}` } });
    if (res.status === 401 || res.status === 403 || res.status === 404) return { ok: false, why: 'hide' };
    if (!res.ok) return { ok: false, why: 'failed' };
    const config = parseConfig(await res.json());
    return config ? { ok: true, config } : { ok: false, why: 'failed' };
  } catch {
    return { ok: false, why: 'failed' };
  }
}

// ---- The section's view ----
/** A day's row: 🔕 and 💤 (nothing announced that day) in the soft colour; the words are the bot's. */
export interface ConfigRow extends ConfigDay {
  soft: boolean;
}

export function configRows(c: GymConfig): ConfigRow[] {
  return c.days.map((d) => ({ ...d, soft: d.rule.startsWith('🔕') || d.rule.startsWith('💤') }));
}
