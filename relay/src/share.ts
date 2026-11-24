// 共有リンク on the relay (docs/travel.md "The relay's part"; the contract app/src/lib/contract/share.ts): the record's
// `share`, `share_visit` and `share_seen` tables, the `/api` actions (share_list, share_make, share_set,
// share_visits), the visitor's keyless `POST /share` (the Worker's gate: shareRoute; the record's read: ShareCore.read),
// the day's salt for the visitors' hashes, the 03:00 sweep of ended links, and the backup's rows. Free of the Workers
// runtime (test/share.test.ts).
import { corsOf, corsRoute } from './auth.ts';
import { readCapped } from './body.ts';
import type { Sql } from './store.ts';
import { isRec } from '../../app/src/lib/contract/guards.ts';
import { ISO_AT, isWho, type Fail, type Who } from '../../app/src/lib/contract/api.ts';
import { localDateAt } from '../../app/src/lib/contract/tokyo.ts';
import {
  devOf, isBotUa, isShareId, isShareKind, isSharePreset, isShareRef, isShareToken, newShareId, newShareToken, shareExp, shareLabel, shareSnapshot, SHARE_KINDS, SHARE_MAKE_KINDS,
  SHARE_ENDED_KEEP_MS, SHARE_LABEL_MAX, SHARE_LIVE_MAX, SHARE_LIVE_PER_REF, SHARE_READ_MAX, SHARE_REPEAT_MS, SHARE_VISITS_KEPT, SHARE_VISITS_SHOWN,
  type ShareAction, type ShareDev, type ShareKind, type ShareSource, type ShareReadReply, type ShareRow, type ShareVisit
} from '../../app/src/lib/contract/share.ts';

type Rec = Record<string, unknown>;

/** The tables (storeSchema.ts MIGRATIONS step 7). */
export const SHARE_TABLES = [
  'CREATE TABLE IF NOT EXISTS share (id TEXT NOT NULL PRIMARY KEY, token TEXT NOT NULL UNIQUE, kind TEXT NOT NULL, ref TEXT NOT NULL, label TEXT NOT NULL, by TEXT NOT NULL, at TEXT NOT NULL, exp TEXT NOT NULL, off_at TEXT, views INTEGER NOT NULL DEFAULT 0, uniq INTEGER NOT NULL DEFAULT 0, first_at TEXT, last_at TEXT)',
  'CREATE INDEX IF NOT EXISTS share_ref ON share (kind, ref)',
  'CREATE TABLE IF NOT EXISTS share_visit (seq INTEGER PRIMARY KEY, id TEXT NOT NULL, at TEXT NOT NULL, dev TEXT NOT NULL, cc TEXT NOT NULL, fresh INTEGER NOT NULL, UNIQUE (id, at, dev, cc))',
  'CREATE INDEX IF NOT EXISTS share_visit_id ON share_visit (id, at)',
  'CREATE TABLE IF NOT EXISTS share_seen (id TEXT NOT NULL, h TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (id, h)) WITHOUT ROWID'
];

/** `POST /share`: reads a minute in all, a visitor's a minute, a visitor's misses (an unknown token) an hour. */
const SHARE_READS_PER_MINUTE = 600;
export const SHARE_VISITOR_PER_MINUTE = 30;
export const SHARE_MISSES_PER_HOUR = 20;

const SHARE_COLS = 'id, token, kind, ref, label, by, at, exp, off_at, views, uniq, first_at, last_at';
type ShareCols = { id: string; token: string; kind: string; ref: string; label: string; by: string; at: string; exp: string; off_at: string | null; views: number; uniq: number; first_at: string | null; last_at: string | null };
const rowOf = (r: ShareCols): ShareRow => ({
  id: r.id, token: r.token, kind: r.kind as ShareKind, ref: r.ref, label: r.label, by: r.by, at: r.at, exp: r.exp, off: r.off_at,
  views: Number(r.views), uniq: Number(r.uniq), first: r.first_at, last: r.last_at
});
const fail = (error: Fail['error'], detail?: string): Fail => (detail ? { ok: false, error, detail } : { ok: false, error });
const iso = (ms: number): string => new Date(ms).toISOString();

/** The visitor's read as the Worker hands it on: the token, `self` (a paired phone's), and what identifies the visitor
 *  for the day's hash only (never kept): the IP and the UA; the country (`cf.country`). */
export interface ShareReadIn { t: string; self: boolean; ip: string; ua: string; cc: string }
/** Why a read wasn't a visit, or `counted` (the log's `share` `why`). */
type ReadWhy = 'counted' | 'off' | 'expired' | 'bot' | 'self' | 'repeat' | 'busy' | 'bad';
export interface ShareReadOut { status: number; reply: ShareReadReply; why: ReadWhy; kind?: ShareKind }

/** The answer to an unknown token, a turned-off link and a malformed body alike. */
export const GONE: ShareReadReply = { ok: false, error: 'gone', why: 'off' };
const BUSY: ShareReadReply = { ok: false, error: 'busy' };

/** An address as the limits key it: an IPv4 one whole, an IPv6 one by its first 64 bits (one subscriber's network). */
export function ipNet(ip: string): string {
  if (!ip.includes(':')) return ip;
  const [head, tail] = ip.toLowerCase().split('::') as [string, string | undefined];
  const h = head ? head.split(':') : [], t = tail ? tail.split(':') : [];
  const full = tail === undefined ? h : [...h, ...Array<string>(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t];
  return full.slice(0, 4).map((x) => x.replace(/^0+(?=.)/, '')).join(':') + '::/64';
}

/** SHA-256 of the parts (joined by a newline), its first 8 bytes as hex. */
async function hash8(...parts: string[]): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(parts.join('\n'))));
  return Array.from(d.subarray(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface ShareIO {
  sql: Sql;
  tx<R>(fn: () => R): R;
  now(): number;
  meta(k: string): string | null;
  setMeta(k: string, v: string): void;
  /** Random bytes (crypto.getRandomValues; the tests' own). */
  rand?: (b: Uint8Array<ArrayBuffer>) => Uint8Array<ArrayBuffer>;
  /** What a kind that reads the record reads (contract/share.ts ShareSource: the packing query, its four event types
   *  only), and that data's version (a snapshot is built again only when it changed). */
  source?: ShareSource;
  version?: () => string;
}

/** The meta key of the day's salt: `{day, s}` (a Tokyo date, 32 random bytes as hex). */
const SALT = 'share_salt';

export class ShareCore {
  /** The day's salt, as meta keeps it. */
  private salt: { day: string; s: string } | null = null;
  /** The reads' counts in memory (a restart forgets them: the limits keep the bill quiet, nothing more). */
  private all = { minute: 0, n: 0 };
  private visitors = { minute: 0, n: new Map<string, number>() };
  private misses = { hour: 0, n: new Map<string, number>() };
  /** Each kind's last snapshot and the version of the record it was built from. */
  private built = new Map<ShareKind, { v: string; data: Record<string, unknown> | null }>();

  constructor(private io: ShareIO) {}

  /** A kind's snapshot (contract/share.ts shareSnapshot), built again only when the record's data changed; one that
   *  can't be built is none (fail closed: never served). */
  snapshot(kind: ShareKind): Record<string, unknown> | null {
    if (!SHARE_KINDS[kind].reads.length) return shareSnapshot(kind);
    const v = this.io.version?.() ?? '';
    const held = this.built.get(kind);
    if (held && v && held.v === v) return held.data;
    let data: Record<string, unknown> | null;
    try {
      data = this.io.source ? shareSnapshot(kind, this.io.source) : null;
    } catch {
      data = null;
    }
    this.built.set(kind, { v, data });
    return data;
  }

  private rand(n: number): Uint8Array<ArrayBuffer> {
    const b = new Uint8Array(n);
    return this.io.rand ? this.io.rand(b) : crypto.getRandomValues(b);
  }

  /** Today's salt (Tokyo's day): a new one at the day's turn, the day's hashes let go with the old. */
  daySalt(now = this.io.now()): string {
    const day = localDateAt(now);
    if (!this.salt) {
      try {
        const m = JSON.parse(this.io.meta(SALT) ?? 'null') as unknown;
        if (isRec(m) && typeof m.day === 'string' && typeof m.s === 'string') this.salt = { day: m.day, s: m.s };
      } catch {
        this.salt = null;
      }
    }
    if (this.salt?.day !== day) {
      const s = Array.from(this.rand(32), (b) => b.toString(16).padStart(2, '0')).join('');
      this.salt = { day, s };
      this.io.tx(() => {
        this.io.sql.exec('DELETE FROM share_seen');
        this.io.setMeta(SALT, JSON.stringify(this.salt));
      });
    }
    return this.salt.s;
  }

  // ---------------------------------------------------------------- the phones' actions

  /** A phone's `/api` share action (any of the three keys). */
  api(me: Who, action: ShareAction, b: Rec): Rec & { ok: boolean } {
    switch (action) {
      case 'share_list': return this.list(b);
      case 'share_make': return this.make(me, b);
      case 'share_set': return this.set(b);
      case 'share_visits': return this.visits(b);
    }
  }

  private byId(id: string): ShareCols | undefined {
    return this.io.sql.exec<ShareCols>(`SELECT ${SHARE_COLS} FROM share WHERE id = ?`, id).toArray()[0];
  }

  /** The live links of a ref and in all (a revival or a new link must leave both under their caps). */
  private live(kind: string, ref: string, now: number): { ref: number; all: number } {
    const at = iso(now);
    const n = (q: string, ...b: string[]) => Number(this.io.sql.exec<{ n: number }>(`SELECT count(*) AS n FROM share WHERE off_at IS NULL AND exp > ?${q}`, at, ...b).toArray()[0]?.n ?? 0);
    return { ref: n(' AND kind = ? AND ref = ?', kind, ref), all: n('') };
  }
  private underCaps(kind: string, ref: string, now: number): boolean {
    const l = this.live(kind, ref, now);
    return l.ref < SHARE_LIVE_PER_REF && l.all < SHARE_LIVE_MAX;
  }

  private list(b: Rec): Rec & { ok: boolean } {
    if (!isShareKind(b.kind) || !isShareRef(b.kind, b.ref)) return fail('bad_request');
    const rows = this.io.sql.exec<ShareCols>(`SELECT ${SHARE_COLS} FROM share WHERE kind = ? AND ref = ? ORDER BY at DESC, id`, b.kind, b.ref).toArray().map(rowOf);
    return { ok: true, rows };
  }

  private make(me: Who, b: Rec): Rec & { ok: boolean } {
    if (!isShareKind(b.kind) || !SHARE_MAKE_KINDS.includes(b.kind) || !isShareRef(b.kind, b.ref) || !isSharePreset(b.days)) return fail('bad_request');
    if (b.label !== undefined && (typeof b.label !== 'string' || b.label.length > SHARE_LABEL_MAX * 4)) return fail('bad_request');
    const now = this.io.now();
    if (!this.underCaps(b.kind, b.ref, now)) return fail('bad_request', 'cap');
    const id = newShareId((x) => this.fill(x)), token = newShareToken((x) => this.fill(x));
    this.io.sql.exec('INSERT INTO share (id, token, kind, ref, label, by, at, exp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', id, token, b.kind, b.ref, shareLabel(b.label), me, iso(now), shareExp(now, b.days));
    return { ok: true, row: rowOf(this.byId(id)!) };
  }
  private fill(b: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
    b.set(this.rand(b.length));
    return b;
  }

  /** `share_set {id, days?, label?, off?}`: a new expiry from now, a name, off or back on (a link coming back live
   *  must fit the caps). */
  private set(b: Rec): Rec & { ok: boolean } {
    if (!isShareId(b.id)) return fail('bad_request');
    if (b.days !== undefined && !isSharePreset(b.days)) return fail('bad_request');
    if (b.label !== undefined && (typeof b.label !== 'string' || b.label.length > SHARE_LABEL_MAX * 4)) return fail('bad_request');
    if (b.off !== undefined && typeof b.off !== 'boolean') return fail('bad_request');
    const r = this.byId(b.id);
    if (!r) return fail('bad_request', 'no such link');
    const now = this.io.now();
    const exp = b.days !== undefined ? shareExp(now, b.days) : r.exp;
    const off = b.off === true ? (r.off_at ?? iso(now)) : b.off === false ? null : r.off_at;
    const wasLive = r.off_at === null && Date.parse(r.exp) > now, isLive = off === null && Date.parse(exp) > now;
    if (isLive && !wasLive && !this.underCaps(r.kind, r.ref, now)) return fail('bad_request', 'cap');
    this.io.sql.exec('UPDATE share SET exp = ?, off_at = ?, label = ? WHERE id = ?', exp, off, b.label !== undefined ? shareLabel(b.label) : r.label, r.id);
    return { ok: true, row: rowOf(this.byId(r.id)!) };
  }

  private visits(b: Rec): Rec & { ok: boolean } {
    if (!isShareId(b.id)) return fail('bad_request');
    const r = this.byId(b.id);
    if (!r) return fail('bad_request', 'no such link');
    const visits: ShareVisit[] = this.io.sql.exec<{ at: string; dev: string; cc: string; fresh: number }>('SELECT at, dev, cc, fresh FROM share_visit WHERE id = ? ORDER BY at DESC, seq DESC LIMIT ?', r.id, SHARE_VISITS_SHOWN)
      .toArray().map((v) => ({ at: v.at, dev: v.dev as ShareDev, cc: v.cc, fresh: Number(v.fresh) === 1 }));
    return { ok: true, row: rowOf(r), visits };
  }

  // ---------------------------------------------------------------- the visitor's read

  /** Whether this read is over a limit (and count it). A visitor's own limits first: a read they refuse never counts
   *  toward the reads in all, so one visitor can't use up everyone's minute. */
  private overLimits(vk: string, now: number): boolean {
    const minute = Math.floor(now / 60_000), hour = Math.floor(now / 3_600_000);
    if (this.all.minute !== minute) this.all = { minute, n: 0 };
    if (this.visitors.minute !== minute) this.visitors = { minute, n: new Map() };
    if (this.misses.hour !== hour) this.misses = { hour, n: new Map() };
    const v = (this.visitors.n.get(vk) ?? 0) + 1;
    this.visitors.n.set(vk, v);
    if (v > SHARE_VISITOR_PER_MINUTE || (this.misses.n.get(vk) ?? 0) >= SHARE_MISSES_PER_HOUR) return true;
    return ++this.all.n > SHARE_READS_PER_MINUTE;
  }

  /** `POST /share` past the Worker's gate: the link's kind, ref, expiry and snapshot, or gone; a visit counted when it
   *  is one (docs/travel.md "The relay's part"). An unknown token and a turned-off link answer alike. Reads nothing but
   *  the share tables, but for a kind that reads the record (`trips`: its packing rows and notes, through `source`). */
  async read(i: ShareReadIn): Promise<ShareReadOut> {
    const now = this.io.now();
    const salt = this.daySalt(now);
    // (the limits' visitor: the address alone, an IPv6 one by its /64: a new User-Agent or address in the same
    // network is the same visitor)
    const vk = await hash8(salt, ipNet(i.ip));
    if (this.overLimits(vk, now)) return { status: 429, reply: BUSY, why: 'busy' };
    const r = this.io.sql.exec<ShareCols>(`SELECT ${SHARE_COLS} FROM share WHERE token = ?`, i.t).toArray()[0];
    if (!r || !isShareKind(r.kind)) {
      this.misses.n.set(vk, (this.misses.n.get(vk) ?? 0) + 1);
      return { status: 200, reply: GONE, why: 'off' };
    }
    if (r.off_at !== null) return { status: 200, reply: GONE, why: 'off', kind: r.kind };
    if (Date.parse(r.exp) <= now) return { status: 200, reply: { ok: false, error: 'gone', why: 'expired', exp: r.exp }, why: 'expired', kind: r.kind };
    const data = this.snapshot(r.kind);
    if (!data) return { status: 200, reply: GONE, why: 'off', kind: r.kind };
    const reply: ShareReadReply = { ok: true, kind: r.kind, ref: r.ref, exp: r.exp, data };
    const why = isBotUa(i.ua) ? 'bot' : i.self ? 'self' : await this.visit(r, salt, i, now);
    return { status: 200, reply, why, kind: r.kind };
  }

  /** A visit, unless the same visitor opened this link within SHARE_REPEAT_MS: kept (≤ SHARE_VISITS_KEPT a link) and
   *  counted (`uniq`: the visitor's first today). */
  private async visit(r: ShareCols, salt: string, i: ShareReadIn, now: number): Promise<'counted' | 'repeat'> {
    const h = await hash8(salt, i.ip, i.ua, r.id);
    return this.io.tx(() => {
      const seen = this.io.sql.exec<{ at: number }>('SELECT at FROM share_seen WHERE id = ? AND h = ?', r.id, h).toArray()[0];
      if (seen && now - Number(seen.at) < SHARE_REPEAT_MS) return 'repeat';
      // (a visit's `at` its own a link: two in the same millisecond a millisecond apart, so a load keeps both)
      const last = this.io.sql.exec<{ at: string | null }>('SELECT max(at) AS at FROM share_visit WHERE id = ?', r.id).toArray()[0]?.at;
      // (its time to the minute, the security review's (4): a small audience isn't timed to the millisecond; a later visit
      // in the same minute a millisecond on, so each is its own row)
      const fresh = seen ? 0 : 1, at = iso(Math.max(Math.floor(now / 60_000) * 60_000, last ? Date.parse(last) + 1 : 0));
      this.io.sql.exec('INSERT INTO share_seen (id, h, at) VALUES (?, ?, ?) ON CONFLICT (id, h) DO UPDATE SET at = excluded.at', r.id, h, now);
      this.io.sql.exec('INSERT OR IGNORE INTO share_visit (id, at, dev, cc, fresh) VALUES (?, ?, ?, ?, ?)', r.id, at, devOf(i.ua), /^[A-Z]{2}$/.test(i.cc) ? i.cc : '', fresh);
      this.io.sql.exec('UPDATE share SET views = views + 1, uniq = uniq + ?, first_at = coalesce(first_at, ?), last_at = ? WHERE id = ?', fresh, at, at, r.id);
      this.io.sql.exec('DELETE FROM share_visit WHERE id = ? AND seq NOT IN (SELECT seq FROM share_visit WHERE id = ? ORDER BY at DESC, seq DESC LIMIT ?)', r.id, r.id, SHARE_VISITS_KEPT);
      return 'counted';
    });
  }

  // ---------------------------------------------------------------- the sweep and the backup

  /** The 03:00 sweep: links ended (off or expired) over SHARE_ENDED_KEEP_MS ago deleted with their visits; the day's
   *  salt turned if it hasn't been. */
  sweep(): { n: number } {
    const now = this.io.now(), cut = iso(now - SHARE_ENDED_KEEP_MS);
    this.daySalt(now);
    return this.io.tx(() => {
      const ids = this.io.sql.exec<{ id: string }>('SELECT id FROM share WHERE min(coalesce(off_at, exp), exp) < ?', cut).toArray().map((r) => r.id);
      for (const id of ids) {
        this.io.sql.exec('DELETE FROM share_visit WHERE id = ?', id);
        this.io.sql.exec('DELETE FROM share_seen WHERE id = ?', id);
        this.io.sql.exec('DELETE FROM share WHERE id = ?', id);
      }
      return { n: ids.length };
    });
  }

  /** The backup's rows (not `share_seen`, not the salt): `share` in its columns' order, `share_visit` `[id, at, dev, cc,
   *  fresh]`. */
  dumpRows(): { share: unknown[][]; share_visit: unknown[][] } {
    const share = this.io.sql.exec<ShareCols>(`SELECT ${SHARE_COLS} FROM share ORDER BY at, id`).toArray()
      .map((r) => [r.id, r.token, r.kind, r.ref, r.label, r.by, r.at, r.exp, r.off_at, Number(r.views), Number(r.uniq), r.first_at, r.last_at]);
    const share_visit = this.io.sql.exec<{ id: string; at: string; dev: string; cc: string; fresh: number }>('SELECT id, at, dev, cc, fresh FROM share_visit ORDER BY seq').toArray()
      .map((v) => [v.id, v.at, v.dev, v.cc, Number(v.fresh)]);
    return { share, share_visit };
  }

  /** A dump's rows into the record (inside the load's transaction): a link by its id once (one held is kept as it
   *  is), a visit once (its link, time, device and country). */
  load(rows: { share?: unknown[]; share_visit?: unknown[] }): { share: number; share_visit: number; skipped: number } {
    const out = { share: 0, share_visit: 0, skipped: 0 };
    const isAt = (v: unknown): v is string => typeof v === 'string' && ISO_AT.test(v);
    const atOrNull = (v: unknown) => v === null || isAt(v);
    const count = (v: unknown) => Number.isInteger(v) && (v as number) >= 0;
    for (const r of rows.share ?? []) {
      const [id, token, kind, ref, label, by, at, exp, off, views, uniq, first, last] = Array.isArray(r) ? r : [];
      if (!Array.isArray(r) || !isShareId(id) || !isShareToken(token) || !isShareKind(kind) || !isShareRef(kind, ref) || typeof label !== 'string' || !isWho(by) || !isAt(at) || !isAt(exp) || !atOrNull(off) || !count(views) || !count(uniq) || !atOrNull(first) || !atOrNull(last)) {
        out.skipped++;
        continue;
      }
      const w = this.io.sql.exec('INSERT OR IGNORE INTO share (id, token, kind, ref, label, by, at, exp, off_at, views, uniq, first_at, last_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        id, token, kind, ref, shareLabel(label), by, at, exp, off as string | null, views as number, uniq as number, first as string | null, last as string | null) as { rowsWritten?: number };
      if (w.rowsWritten !== 0) out.share++;
    }
    const known = new Set(this.io.sql.exec<{ id: string }>('SELECT id FROM share').toArray().map((x) => x.id));
    for (const r of rows.share_visit ?? []) {
      const [id, at, dev, cc, fresh] = Array.isArray(r) ? r : [];
      if (!isShareId(id) || !known.has(id) || !isAt(at) || typeof dev !== 'string' || typeof cc !== 'string' || !/^([A-Z]{2})?$/.test(cc) || (fresh !== 0 && fresh !== 1)) {
        out.skipped++;
        continue;
      }
      const w = this.io.sql.exec('INSERT OR IGNORE INTO share_visit (id, at, dev, cc, fresh) VALUES (?, ?, ?, ?, ?)', id, at, DEVS.has(dev) ? dev : 'other', cc, fresh) as { rowsWritten?: number };
      if (w.rowsWritten !== 0) out.share_visit++;
    }
    return out;
  }
}

const DEVS = new Set<string>(['iphone', 'ipad', 'android', 'mac', 'windows', 'other']);

// ---------------------------------------------------------------- the Worker's gate

/** `POST /share` (no key): refused off our origins (403; an Origin is required: a page's fetch always sends one), the
 *  preflight and other methods as corsRoute's; a body over SHARE_READ_MAX characters, not JSON, or without a token of
 *  the token's shape is GONE here, with no request to the record. Else the record's answer (`read`), `no-store`. */
export async function shareRoute(req: Request, allowed: string, read: (i: ShareReadIn) => Promise<{ status: number; reply: ShareReadReply }>): Promise<Response> {
  if (!req.headers.get('Origin') || !corsOf(req.headers.get('Origin'), allowed)) return new Response('forbidden', { status: 403 });
  const headers = corsRoute(req, allowed, 'Content-Type');
  if (headers instanceof Response) return headers;
  const json = (reply: ShareReadReply, status = 200) => new Response(JSON.stringify(reply), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
  // (read no further than the cap, a body without a Content-Length too)
  const bytes = await readCapped(req, SHARE_READ_MAX * 4);
  const text = bytes ? new TextDecoder().decode(bytes) : '';
  if (!bytes || text.length > SHARE_READ_MAX) return json(GONE);
  let b: unknown;
  try {
    b = JSON.parse(text);
  } catch {
    return json(GONE);
  }
  if (!isRec(b) || !isShareToken(b.t)) return json(GONE);
  const cf = (req as Request & { cf?: { country?: unknown } }).cf;
  try {
    const r = await read({ t: b.t, self: b.self === true, ip: req.headers.get('CF-Connecting-IP') ?? '', ua: req.headers.get('User-Agent') ?? '', cc: typeof cf?.country === 'string' ? cf.country : '' });
    return json(r.reply, r.status);
  } catch {
    return json(BUSY, 503);
  }
}
