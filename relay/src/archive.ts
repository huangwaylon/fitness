// The record's daily backup (docs/ops/runbook.md#6-backups): at 03:00 Tokyo the cron asks the record (storeObject.ts
// archiveKick), whose alarm dumps it (the admin `dump`'s rows, the file `record.ts dump` writes, so `record.ts load`
// takes it), encrypts it with age to the public recipient only (age-encryption, typage: the Worker never holds the
// secret key) and uploads it as `island-record-YYYY-MM-DD.json.age` to a release of the private archive repo (GitHub's
// REST API, ARCHIVE_TOKEN: a fine-grained token, that repo's Contents read/write). The last ARCHIVE_KEEP are kept;
// nothing else in the release (the Mac's `notes-*`) is touched. Free of the Workers runtime, so it is unit-testable.
//
// - A slot a day: 03:00 Tokyo to 03:00 the next day, named by its first day. Done once a slot (`ok`); a failure is
//   tried again by the alarm after RETRY_MIN_MS, doubling to RETRY_MAX_MS; no token: said once a slot, nothing tried.
// - Read-only: the dump only reads the record (the state is one key of the object's storage, not the record's tables).
// - Never logged: the dump, the token, GitHub's replies (a step and a status only).
import { Encrypter } from 'age-encryption';

export const ARCHIVE_KEEP = 90;
/** The cron's expression that hands the backup to the record (index.ts scheduled): 18:00 UTC, 03:00 Tokyo. */
export const ARCHIVE_CRON = '0 18 * * *';
export const RETRY_MIN_MS = 30 * 60_000;
export const RETRY_MAX_MS = 6 * 3_600_000;
/** Old dumps deleted a run at most (the rest the next day: a run's subrequests stay few). */
const DELETE_MAX = 20;
const RECORD = /^island-record-\d{4}-\d{2}-\d{2}\.json\.age$/;
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
export const assetName = (slot: string): string => `island-record-${slot}.json.age`;
export const backoff = (fails: number): number => Math.min(RETRY_MAX_MS, RETRY_MIN_MS * 2 ** Math.max(0, fails - 1));

/** Whether a run is due now: `done` (this slot's is up, or it has no token), `wait` (a failure's backoff), `run`. */
export function due(s: ArchiveState, now: number): 'run' | 'done' | 'wait' {
  const slot = slotOf(now);
  if (s.ok === slot || s.skip === slot) return 'done';
  if (s.fails > 0 && now < s.lastAt + backoff(s.fails)) return 'wait';
  return 'run';
}

/** The record dumped as `record.ts dump` writes it (its pages put together are the whole: store.ts rowsPage). */
export function dumpText(core: { rev(): string; dump(): { rows: { metrics: unknown[]; events: unknown[]; uploads: unknown[]; held?: unknown[] } } }): { text: string; metrics: number; events: number } {
  const { rows } = core.dump();
  const text = `${JSON.stringify({ ok: true, rev: core.rev(), rows: { metrics: rows.metrics, events: rows.events, uploads: rows.uploads, held: rows.held ?? [] } })}\n`;
  return { text, metrics: rows.metrics.length, events: rows.events.length };
}

/** The bytes encrypted to the age recipient (`age1…`): what `age -R` writes (binary, not armored). */
export async function encrypt(text: string, recipient: string): Promise<Uint8Array> {
  const e = new Encrypter();
  e.addRecipient(recipient);
  return e.encrypt(new TextEncoder().encode(text));
}

/** The dumps to delete: every `island-record-*` but the newest `keep` by name (dated), oldest first. */
export function retention(names: string[], keep = ARCHIVE_KEEP): string[] {
  const records = [...new Set(names.filter((n) => RECORD.test(n)))].sort();
  return records.slice(0, Math.max(0, records.length - keep));
}

/** A GitHub call that failed: its step and status only (its body may say anything). */
class ArchiveError extends Error {
  constructor(readonly step: string, readonly http: number) {
    super(`${step} ${http}`);
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

async function call<T>(gh: GitHub, step: string, method: string, url: string, body?: BodyInit, type = 'application/json'): Promise<T | null> {
  const res = await gh.fetch(url.startsWith('https://') ? url : `https://api.github.com/repos/${gh.repo}${url}`, {
    method,
    headers: { Authorization: `Bearer ${gh.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'island-fund-relay', ...(body !== undefined ? { 'Content-Type': type } : {}) },
    ...(body !== undefined ? { body } : {})
  });
  if (res.status === 404 && method === 'GET') return null;
  if (!res.ok) throw new ArchiveError(step, res.status);
  return res.status === 204 ? ({} as T) : ((await res.json()) as T);
}

/**
 * The file into the release (made if missing): a dump of the same name is replaced (the new one up under `.part`
 * first, then the old deleted and the new renamed: the slot always has one), then the dumps past `keep` deleted.
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
  const names = [...assets.map((a) => a.name), name];
  const gone = retention(names, keep).slice(0, DELETE_MAX);
  for (const n of gone) {
    const a = assets.find((x) => x.name === n);
    if (a) await del(a);
  }
  return { kept: retention(names, 0).length - gone.length, del: gone.length, replaced: !!old };
}

/** What a run did (the log's `cron.backup`): never the dump or the token. */
export interface ArchiveRun {
  ok: boolean;
  /** `ok`, `no_token`, `no_config`, `empty` (no metrics or events: nothing uploaded), `github`, or an error's class */
  st: string;
  slot: string;
  step?: string;
  http?: number;
  kB?: number;
  metrics?: number;
  events?: number;
  kept?: number;
  del?: number;
  /** Wall ms: the whole, the dump, the encryption, GitHub's calls. */
  ms: number;
  dumpMs?: number;
  encMs?: number;
  upMs?: number;
}

export interface ArchiveIO {
  dump(): { text: string; metrics: number; events: number };
  gh: Omit<GitHub, 'token'> & { token?: string };
  recipient?: string;
  now(): number;
}

/** One run: dump, check (as dump.sh did: events and metrics there), encrypt, upload. Never throws. */
export async function runArchive(io: ArchiveIO): Promise<ArchiveRun> {
  const t0 = io.now();
  const slot = slotOf(t0);
  const end = (r: Omit<ArchiveRun, 'slot' | 'ms'>): ArchiveRun => ({ slot, ...r, ms: io.now() - t0 });
  if (!io.gh.token) return end({ ok: false, st: 'no_token' });
  if (!io.recipient?.startsWith('age1') || !io.gh.repo || !io.gh.tag) return end({ ok: false, st: 'no_config' });
  let step = 'dump';
  try {
    const d = io.dump();
    const t1 = io.now();
    if (!d.metrics || !d.events) return end({ ok: false, st: 'empty', metrics: d.metrics, events: d.events, dumpMs: t1 - t0 });
    step = 'encrypt';
    const bytes = await encrypt(d.text, io.recipient);
    const t2 = io.now();
    step = 'github';
    const u = await upload({ ...io.gh, token: io.gh.token }, assetName(slot), bytes);
    return end({ ok: true, st: 'ok', kB: Math.round(bytes.length / 1024), metrics: d.metrics, events: d.events, kept: u.kept, del: u.del, dumpMs: t1 - t0, encMs: t2 - t1, upMs: io.now() - t2 });
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
