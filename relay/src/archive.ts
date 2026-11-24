// The record's daily backup (docs/ops/runbook.md#6-backups): at 03:00 Tokyo the cron asks the record (storeObject.ts
// archiveKick), whose alarm dumps it (the admin `dump`'s rows, the file `record.ts dump` writes, so `record.ts load`
// takes it), gzips it as it comes (store.ts dumpText: a page of rows at a time, never the whole in the object's 128 MB),
// encrypts it with age to the public recipient only (age-encryption, typage: the Worker never holds the secret key) and
// uploads it as `island-record-YYYY-MM-DD.json.gz.age` (till 2026-11-11 `.json.age`, not gzipped: openDump reads
// both) to a release of the private archive repo (GitHub's
// REST API: the GitHub App's token narrowed to that repo's contents, else ARCHIVE_TOKEN; storeObject.ts). The last ARCHIVE_KEEP are kept;
// nothing else in the release (the by-hand `notes-*`) is touched. Free of the Workers runtime, so it is unit-testable.
//
// - A slot a day: 03:00 Tokyo to 03:00 the next day, named by its first day. Done once a slot (`ok`); a failure is
//   tried again by the alarm after RETRY_MIN_MS, doubling to RETRY_MAX_MS; no token: said once a slot, nothing tried.
// - Read-only: the dump only reads the record (the state is one key of the object's storage, not the record's tables).
// - Never logged: the dump, the token, GitHub's replies (a step and a status only).
import { Decrypter, Encrypter } from 'age-encryption';

export const ARCHIVE_KEEP = 90;
/** The cron's expression that hands the backup to the record (index.ts scheduled): 18:00 UTC, 03:00 Tokyo. */
export const ARCHIVE_CRON = '0 18 * * *';
export const RETRY_MIN_MS = 30 * 60_000;
export const RETRY_MAX_MS = 6 * 3_600_000;
/** Old dumps deleted a run at most (the rest the next day: a run's subrequests stay few). */
const DELETE_MAX = 20;
/** The dated files the relay writes: the record's dump and the bots' state (runBots), each kind kept on its own. */
const DATED = /^(island-record|its|gym)-(\d{4}-\d{2}-\d{2})\.json(?:\.gz)?\.age$/;
/** Tokyo is UTC+9; a slot starts at 03:00 there, so the slot's day is the UTC time's + 6 h. */
const SLOT_SHIFT_MS = 6 * 3_600_000;

/** What the record keeps of the backups (one storage key). */
export interface ArchiveState {
  /** The last slot done. */
  ok?: string;
  okAt?: number;
  /** The slot that found no token (said once). */
  skip?: string;
  /** Failures since the last success, and when the last run was. */
  fails: number;
  lastAt: number;
}
export const NO_STATE: ArchiveState = { fails: 0, lastAt: 0 };

export const slotOf = (now: number): string => new Date(now + SLOT_SHIFT_MS).toISOString().slice(0, 10);
/** When the slot after `now`'s starts (03:00 Tokyo). */
export const nextSlotAt = (now: number): number => Date.parse(slotOf(now)) - SLOT_SHIFT_MS + 86_400_000;
export const assetName = (slot: string): string => `island-record-${slot}.json.gz.age`;
export const backoff = (fails: number): number => Math.min(RETRY_MAX_MS, RETRY_MIN_MS * 2 ** Math.max(0, fails - 1));

/** Whether a run is due now: `done` (this slot's is up, or it has no token), `wait` (a failure's backoff), `run`. */
export function due(s: ArchiveState, now: number): 'run' | 'done' | 'wait' {
  const slot = slotOf(now);
  if (s.ok === slot || s.skip === slot) return 'done';
  if (s.fails > 0 && now < s.lastAt + backoff(s.fails)) return 'wait';
  return 'run';
}

/** The dump's text gzipped as it comes (`gzip -d` reads it), and its size before. */
export async function gzip(pieces: Iterable<string>): Promise<{ bytes: Uint8Array; raw: number }> {
  const cs = new CompressionStream('gzip');
  const out = new Response(cs.readable).arrayBuffer();
  const w = cs.writable.getWriter(), enc = new TextEncoder();
  let raw = 0;
  try {
    for (const p of pieces) {
      const b = enc.encode(p);
      raw += b.length;
      await w.write(b);
    }
    await w.close();
  } catch (e) {
    out.catch(() => {});
    await w.abort(e).catch(() => {});
    throw e;
  }
  return { bytes: new Uint8Array(await out), raw };
}

/** The bytes encrypted to the age recipient (`age1…`): what `age -R` writes (binary, not armored). */
export async function encrypt(bytes: Uint8Array, recipient: string): Promise<Uint8Array> {
  const e = new Encrypter();
  e.addRecipient(recipient);
  return e.encrypt(bytes);
}

const AGE = new TextEncoder().encode('age-encryption.org/v1');
const starts = (b: Uint8Array, p: ArrayLike<number>) => b.length >= p.length && Array.prototype.every.call(p, (x: number, i: number) => b[i] === x);

/**
 * A dump's text from a file's bytes, in memory: decrypted with the age identity (`AGE-SECRET-KEY-1…`) if it is a
 * `.age`, gunzipped if gzipped, so the old `.json.age`, the new `.json.gz.age`, a `.json` and a `.json.gz` all read.
 */
export async function openDump(bytes: Uint8Array, identity?: string): Promise<string> {
  let b = bytes;
  if (starts(b, AGE)) {
    if (!identity) throw new Error('an age file: needs the identity');
    const d = new Decrypter();
    d.addIdentity(identity);
    b = await d.decrypt(b);
  }
  if (starts(b, [0x1f, 0x8b])) b = new Uint8Array(await new Response(new Response(b as BodyInit).body!.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  return new TextDecoder().decode(b);
}

/** The files to delete: every one of that kind (`island-record`, `its`, `gym`) but the newest `keep` by day, oldest
 *  first. Nothing else in the release is named. */
export function retention(names: string[], keep = ARCHIVE_KEEP, kind = 'island-record'): string[] {
  const dated = [...new Set(names.filter((n) => kindOf(n) === kind))].sort((a, b) => dayOf(a).localeCompare(dayOf(b)) || a.localeCompare(b));
  return dated.slice(0, Math.max(0, dated.length - keep));
}

const kindOf = (name: string): string => DATED.exec(name)?.[1] ?? '';
const dayOf = (name: string): string => DATED.exec(name)?.[2] ?? '';

/** A GitHub call that failed: its step and status only (its body may say anything). */
class ArchiveError extends Error {
  readonly step: string;
  readonly http: number;
  constructor(step: string, http: number) {
    super(`${step} ${http}`);
    this.step = step;
    this.http = http;
    this.name = 'ArchiveError';
  }
}

export interface GitHub {
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  token: string;
  /** `owner/name` */
  repo: string;
  /** The release's tag (`dumps`; the test relay's `dumps-test`). */
  tag: string;
}

type Asset = { id: number; name: string };
type Release = { id: number; upload_url: string };

/** One GitHub call's limit, its answer read too (the slowest upload took 4.1 s): a hung call would hold the backup's
 *  lock (storeObject.ts `archiving`) for the instance's life; timed out, it's `st:'TimeoutError', step:'github'`, and
 *  the alarm tries again. */
const GH_TIMEOUT_MS = 30_000;

async function call<T>(gh: GitHub, step: string, method: string, url: string, body?: BodyInit, type = 'application/json'): Promise<T | null> {
  const res = await gh.fetch(url.startsWith('https://') ? url : `https://api.github.com/repos/${gh.repo}${url}`, {
    method, signal: AbortSignal.timeout(GH_TIMEOUT_MS),
    headers: { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'island-fund-relay', ...(body !== undefined ? { 'Content-Type': type } : {}) },
    ...(body !== undefined ? { body } : {})
  });
  if (res.status === 404 && method === 'GET') return null;
  if (!res.ok) throw new ArchiveError(step, res.status);
  return res.status === 204 ? ({} as T) : ((await res.json()) as T);
}

/**
 * The file into the release (made if missing): a dump of the same name is replaced (the new one up under `.part`
 * first, then the old deleted and the new renamed: the slot always has one), the same day's in the other format
 * deleted once it is up, then the dumps past `keep` deleted.
 */
export async function upload(gh: GitHub, name: string, bytes: Uint8Array, keep = ARCHIVE_KEEP): Promise<{ kept: number; del: number; replaced: boolean }> {
  const rel = (await call<Release>(gh, 'release', 'GET', `/releases/tags/${gh.tag}`))
    ?? (await call<Release>(gh, 'release', 'POST', '/releases', JSON.stringify({ tag_name: gh.tag, name: gh.tag, body: `Encrypted daily record dumps (age), from the relay. The last ${keep} are kept.` })))!;
  const assets: Asset[] = [];
  for (let page = 1; page <= 10; page++) {
    const p = (await call<Asset[]>(gh, 'list', 'GET', `/releases/${rel.id}/assets?per_page=100&page=${page}`)) ?? [];
    assets.push(...p.map((a) => ({ id: a.id, name: a.name })));
    if (p.length < 100) break;
  }
  const del = (a: Asset) => call(gh, 'delete', 'DELETE', `/releases/assets/${a.id}`);
  const part = `${name}.part`;
  for (const a of assets.filter((x) => x.name === part)) await del(a);
  const old = assets.find((a) => a.name === name);
  const put = (n: string) => call<Asset>(gh, 'upload', 'POST', `${rel.upload_url.replace(/\{.*$/, '')}?name=${encodeURIComponent(n)}`, bytes as BodyInit, 'application/octet-stream');
  if (old) {
    const up = (await put(part))!;
    await del(old);
    await call(gh, 'rename', 'PATCH', `/releases/assets/${up.id}`, JSON.stringify({ name }));
  } else await put(name);
  const kind = kindOf(name) || 'island-record';
  const twins = assets.filter((a) => a.name !== name && dayOf(a.name) && kindOf(a.name) === kind && dayOf(a.name) === dayOf(name));
  for (const a of twins) await del(a);
  const names = [...assets.filter((a) => !twins.includes(a)).map((a) => a.name), name];
  const gone = retention(names, keep, kind).slice(0, DELETE_MAX);
  for (const n of gone) {
    const a = assets.find((x) => x.name === n);
    if (a) await del(a);
  }
  return { kept: retention(names, 0, kind).length - gone.length, del: gone.length, replaced: !!old };
}

/** What a run did (the log's `cron.backup`): never the dump or the token. */
export interface ArchiveRun {
  ok: boolean;
  /** `ok`, `no_token`, `no_config`, `empty` (no metrics or events: nothing uploaded), `github`, or an error's class */
  st: string;
  slot: string;
  step?: string;
  http?: number;
  /** The file's size, and the dump's before gzip (the record's growth). */
  kB?: number;
  rawkB?: number;
  metrics?: number;
  events?: number;
  kept?: number;
  del?: number;
  /** Wall ms: the whole, and GitHub's calls (a Worker's clock stands still while it computes: the dump and the
   *  encryption read as 0). */
  ms: number;
  upMs?: number;
}

export interface ArchiveIO {
  /** The rows counted, and the dump's text a page at a time (store.ts dumpText, read once). */
  dump(): { pieces: Iterable<string>; metrics: number; events: number };
  gh: Omit<GitHub, 'token'> & { token?: string };
  recipient?: string;
  now(): number;
}

/** One run: check (as dump.sh did: events and metrics there), dump and gzip, encrypt, upload. Never throws. */
export async function runArchive(io: ArchiveIO): Promise<ArchiveRun> {
  const t0 = io.now();
  const slot = slotOf(t0);
  const end = (r: Omit<ArchiveRun, 'slot' | 'ms'>): ArchiveRun => ({ slot, ...r, ms: io.now() - t0 });
  if (!io.gh.token) return end({ ok: false, st: 'no_token' });
  if (!io.recipient?.startsWith('age1') || !io.gh.repo || !io.gh.tag) return end({ ok: false, st: 'no_config' });
  let step = 'dump';
  try {
    const d = io.dump();
    if (!d.metrics || !d.events) return end({ ok: false, st: 'empty', metrics: d.metrics, events: d.events });
    const z = await gzip(d.pieces);
    step = 'encrypt';
    const bytes = await encrypt(z.bytes, io.recipient);
    const t2 = io.now();
    step = 'github';
    const u = await upload({ ...io.gh, token: io.gh.token }, assetName(slot), bytes);
    return end({ ok: true, st: 'ok', kB: Math.round(bytes.length / 1024), rawkB: Math.round(z.raw / 1024), metrics: d.metrics, events: d.events, kept: u.kept, del: u.del, upMs: io.now() - t2 });
  } catch (e) {
    if (e instanceof ArchiveError) return end({ ok: false, st: 'github', step: e.step, http: e.http });
    return end({ ok: false, st: e instanceof Error && /^\w{1,40}$/.test(e.name) ? e.name : 'Error', step });
  }
}

/** The state after a run (`now` its end). */
export function after(s: ArchiveState, r: ArchiveRun, now: number): ArchiveState {
  if (r.ok) return { ok: r.slot, okAt: now, fails: 0, lastAt: now };
  if (r.st === 'no_token' || r.st === 'no_config') return { ...s, skip: r.slot, lastAt: now };
  return { ...s, fails: s.fails + 1, lastAt: now };
}

/** When the alarm should try again after a run, or null (done, or nothing to retry till the cron's next kick). */
export function retryAt(s: ArchiveState, r: ArchiveRun): number | null {
  return r.ok || r.st === 'no_token' || r.st === 'no_config' ? null : s.lastAt + backoff(s.fails);
}

// The bots' state beside the record's dump (docs/decisions.md "The bots' state in the nightly backup"): its-bot's
// `GET /its/status` (the settings, the bookings, the events, the seen names) and gym-bot's `GET /gym/state` (version 3),
// read through a service binding (the relay's KEY_A for its-bot, the GYM_TOKEN copy for gym-bot), encrypted to the
// same recipient, uploaded as `its-YYYY-MM-DD.json.age` and `gym-YYYY-MM-DD.json.age` to the same release, the last
// ARCHIVE_KEEP of each kept. After the record's run, never instead of it: a bot's failure is its own field on the
// `cron.backup` line, never the record's `ok`, and nothing retries it before the next run.
export const BOTS = ['its', 'gym'] as const;
export type Bot = (typeof BOTS)[number];
export const botAsset = (bot: Bot, slot: string): string => `${bot}-${slot}.json.age`;
/** A bot's answer's limit (a service binding's call: the bot's object answers in ms). */
const BOT_TIMEOUT_MS = 15_000;

/** A bot's state as read: the count the log says (its bookings; the gym state's version), or null if it isn't one. */
export function botCount(bot: Bot, x: unknown): number | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  if (bot === 'its') return o.settings && typeof o.settings === 'object' && Array.isArray(o.bookings) && Array.isArray(o.events) ? o.bookings.length : null;
  return typeof o.version === 'number' ? o.version : null;
}

/** The bots' counts of a Tokyo day (each bot's `X-Bot-Day` header on the same answer: JSON `{d, <count>: n…}`, the
 *  day before the bot's own Tokyo today), as the backup line's fields: history past Workers Logs' 3 days. */
const BOT_DAY_HEADER = 'X-Bot-Day';
const BOT_DAY: Record<Bot, Record<string, string>> = {
  its: { rep: 'itsRep', runErr: 'itsRunErr', disp: 'itsDisp', dispFail: 'itsDispFail', inc: 'itsInc', alert: 'itsAlert', push: 'itsPush', pushFail: 'itsPushFail' },
  gym: { checks: 'gymChecks', fail: 'gymFail', down: 'gymDown', push: 'gymPush', pushFail: 'gymPushFail', acts: 'gymActs' }
};

/** A bot's header's counts for `day` (the slot's Tokyo day before), its line's names; none when it's another day's or
 *  not one. */
export function botDay(bot: Bot, header: string | null, day: string): Record<string, number> {
  let x: unknown;
  try {
    x = header ? JSON.parse(header) : null;
  } catch {
    return {};
  }
  if (!x || typeof x !== 'object' || (x as { d?: unknown }).d !== day) return {};
  const out: Record<string, number> = {};
  for (const [k, f] of Object.entries(BOT_DAY[bot])) {
    const v = (x as Record<string, unknown>)[k];
    if (typeof v === 'number' && Number.isInteger(v) && v >= 0) out[f] = v;
  }
  return out;
}

export interface BotsIO {
  /** Each bot's read (its binding and credential; missing: `none`). */
  bots: Partial<Record<Bot, (signal: AbortSignal) => Promise<Response>>>;
  gh: Omit<GitHub, 'token'> & { token?: string };
  recipient?: string;
  slot: string;
  now(): number;
}

/** What the bots' part did (the `cron.backup` line's own fields): each one's `ok`, `none` (no binding or credential),
 *  `no_token`, `http_<status>` (the bot refused), `bad` (not its state), `github_<step>_<status>`, or an error's class;
 *  its file's kB and count (its: bookings; gym: the state's version); the part's wall ms. */
export type BotsRun = Partial<Record<string, string | number>>;

/** Each bot read, encrypted and uploaded in turn, one's failure never the other's. Never throws. */
export async function runBots(io: BotsIO): Promise<BotsRun> {
  const t0 = io.now();
  const out: BotsRun = {};
  for (const bot of BOTS) {
    const read = io.bots[bot];
    if (!read) {
      out[bot] = 'none';
      continue;
    }
    if (!io.gh.token || !io.recipient?.startsWith('age1') || !io.gh.repo || !io.gh.tag) {
      out[bot] = 'no_token';
      continue;
    }
    try {
      const res = await read(AbortSignal.timeout(BOT_TIMEOUT_MS));
      if (!res.ok) {
        await res.body?.cancel();
        out[bot] = `http_${res.status}`;
        continue;
      }
      // (the day before's counts, whatever comes of the file)
      Object.assign(out, botDay(bot, res.headers.get(BOT_DAY_HEADER), new Date(Date.parse(io.slot) - 86_400_000).toISOString().slice(0, 10)));
      const text = await res.text();
      let n: number | null = null;
      try {
        n = botCount(bot, JSON.parse(text));
      } catch {
        // not JSON: `bad`
      }
      if (n === null) {
        out[bot] = 'bad';
        continue;
      }
      const bytes = await encrypt(new TextEncoder().encode(text), io.recipient);
      await upload({ ...io.gh, token: io.gh.token }, botAsset(bot, io.slot), bytes);
      out[bot] = 'ok';
      out[`${bot}KB`] = Math.round(bytes.length / 1024);
      out[bot === 'its' ? 'itsN' : 'gymV'] = n;
    } catch (e) {
      out[bot] = e instanceof ArchiveError ? `github_${e.step}_${e.http}` : e instanceof Error && /^\w{1,40}$/.test(e.name) ? e.name : 'Error';
    }
  }
  out.botsMs = io.now() - t0;
  return out;
}
