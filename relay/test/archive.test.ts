// The record's daily backup (src/archive.ts): its slot and retries, the dump (byte for byte what `record.ts dump`
// writes from the admin's pages), the age encryption (decrypted here with a test key, never the real one), the
// release's upload (a fake GitHub: the same day replaced, the last 90 kept, `notes-*` never touched) and the log's
// `backupH`.
import { beforeEach, describe, expect, it } from 'vitest';
import { Decrypter, generateX25519Identity, identityToRecipient } from 'age-encryption';
import {
  after, ARCHIVE_KEEP, assetName, backoff, due, dumpText, encrypt, NO_STATE, retention, retryAt, RETRY_MAX_MS, RETRY_MIN_MS,
  runArchive, slotOf, upload, type ArchiveIO, type ArchiveState, type GitHub
} from '../src/archive.ts';
import { StoreCore } from '../src/store.ts';
import { LogCore } from '../src/log.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64), KEY_B = 'b'.repeat(64), KEY_C = 'c'.repeat(64);
const H = 3_600_000;
/** 03:00 Tokyo on 2026-11-11 (18:00 UTC the 10th) */
const T3 = Date.parse('2026-11-10T18:00:00Z');
const TOKEN = 'github_pat_' + 'x'.repeat(40);

describe('the slot and its retries', () => {
  it('a slot runs from 03:00 Tokyo to 03:00 the next day, named by its first', () => {
    expect(slotOf(T3)).toBe('2026-11-11');
    expect(slotOf(T3 - 1)).toBe('2026-11-10');
    expect(slotOf(T3 + 24 * H - 1)).toBe('2026-11-11');
    expect(assetName('2026-11-11')).toBe('island-record-2026-11-11.json.age');
  });
  it('done once a slot; a failure waits its backoff (30 min doubling to 6 h); no token is said once a slot', () => {
    expect(due(NO_STATE, T3)).toBe('run');
    const ok = after(NO_STATE, { ok: true, st: 'ok', slot: slotOf(T3), ms: 1 }, T3);
    expect([due(ok, T3 + H), due(ok, T3 + 23 * H), due(ok, T3 + 24 * H)]).toEqual(['done', 'done', 'run']);
    expect(retryAt(ok, { ok: true, st: 'ok', slot: '', ms: 0 })).toBe(null);
    let s: ArchiveState = NO_STATE;
    const fail = { ok: false, st: 'github', step: 'upload', http: 502, slot: slotOf(T3), ms: 1 };
    const waits: number[] = [];
    let t = T3;
    for (let i = 0; i < 6; i++) {
      s = after(s, fail, t);
      const at = retryAt(s, fail)!;
      expect(due(s, at - 1)).toBe('wait');
      expect(due(s, at)).toBe('run');
      waits.push(at - t);
      t = at;
    }
    expect(waits).toEqual([RETRY_MIN_MS, 2 * RETRY_MIN_MS, 4 * RETRY_MIN_MS, 8 * RETRY_MIN_MS, RETRY_MAX_MS, RETRY_MAX_MS]);
    expect(backoff(1)).toBe(30 * 60_000);
    // a success after failures: done, the count reset
    s = after(s, { ok: true, st: 'ok', slot: slotOf(t), ms: 1 }, t);
    expect(s.fails).toBe(0);
    const none = after(NO_STATE, { ok: false, st: 'no_token', slot: slotOf(T3), ms: 0 }, T3);
    expect(retryAt(none, { ok: false, st: 'no_token', slot: '', ms: 0 })).toBe(null);
    expect([due(none, T3 + H), due(none, T3 + 24 * H)]).toEqual(['done', 'run']);
  });
});

describe('retention', () => {
  it('keeps the newest 90 island-record dumps and names nothing else', () => {
    const day = (i: number) => new Date(Date.parse('2026-01-01T00:00:00Z') + i * 24 * H).toISOString().slice(0, 10);
    const records = Array.from({ length: 95 }, (_, i) => assetName(day(i)));
    const others = ['notes-2026-01-01.tar.age', 'notes-2026-11-10.tar.age', 'island-record-2026-01-01.json.age.part', 'food-images-raw.tar.zst'];
    const gone = retention([...others, ...records.slice().reverse(), records[0]]);
    expect(gone).toEqual(records.slice(0, 5));
    expect(retention(records.slice(0, ARCHIVE_KEEP))).toEqual([]);
  });
});

describe('the dump', () => {
  it('is byte for byte what record.ts dump writes from the admin dump pages, and the record writes nothing', () => {
    const db = memSql();
    let now = Date.parse('2026-11-01T00:00:00Z');
    const store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: () => {} });
    const metrics: unknown[][] = [], events: unknown[][] = [];
    for (let i = 0; i < 40; i++) {
      const at = new Date(now + i * 60_000).toISOString(), date = `2026-10-${String(10 + (i % 20)).padStart(2, '0')}`;
      metrics.push([at, i % 2 ? 'A' : 'B', date, 'steps', 1000 + i]);
      if (i % 3 === 0) events.push([at, 'A', `t${i}`, 'tally', JSON.stringify({ date, counts: { 'fish:koi': i } })]);
    }
    expect(store.load({ rows: { metrics, events } })).toMatchObject({ ok: true });
    now += H;
    // record.ts dump(): the pages put together
    const rows = { metrics: [] as unknown[], events: [] as unknown[], uploads: [] as unknown[], held: [] as unknown[] };
    let after: unknown, rev: unknown;
    do {
      const r = { rev: store.rev(), ...store.dumpPage({ limit: 7, ...(after ? { after } : {}) }) } as { rev: string; next?: string; rows: typeof rows };
      rev = r.rev;
      for (const k of ['metrics', 'events', 'uploads', 'held'] as const) rows[k].push(...(r.rows[k] ?? []));
      after = r.next;
    } while (after);
    const tool = `${JSON.stringify({ ok: true, rev, rows })}\n`;
    const before = db.db.prepare('SELECT total_changes() AS n').get() as { n: number };
    const d = dumpText(store);
    expect(d.text).toBe(tool);
    expect([d.metrics, d.events]).toEqual([40, 14]);
    expect((db.db.prepare('SELECT total_changes() AS n').get() as { n: number }).n).toBe(before.n);
  });
});

describe('the encryption', () => {
  it('decrypts with the identity of its recipient (a test key), and only with it', async () => {
    const id = await generateX25519Identity(), other = await generateX25519Identity();
    const text = `${JSON.stringify({ ok: true, rev: 'e1', rows: { metrics: [['2026-11-10T00:00:00.000Z', 'A', '2026-11-10', 'steps', 1234]], events: [], uploads: [], held: [] } })}\n`;
    const bytes = await encrypt(text, await identityToRecipient(id));
    expect(new TextDecoder().decode(bytes.slice(0, 21))).toBe('age-encryption.org/v1');
    expect(new TextDecoder().decode(bytes)).not.toContain('steps');
    const d = new Decrypter();
    d.addIdentity(id);
    expect(await d.decrypt(bytes, 'text')).toBe(text);
    const wrong = new Decrypter();
    wrong.addIdentity(other);
    await expect(wrong.decrypt(bytes, 'text')).rejects.toThrow();
  });
});

/** A release's assets on a fake GitHub, and the calls made (never the token in a URL). */
function fakeGitHub(o: { release?: boolean; fail?: { method: string; status: number } } = {}) {
  let id = 100, release: { id: number; tag: string } | null = o.release === false ? null : { id: 7, tag: 'dumps' };
  const assets = new Map<number, { name: string; size: number }>();
  const calls: string[] = [];
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
  const fetch = async (url: string, init: RequestInit): Promise<Response> => {
    const method = init.method ?? 'GET';
    const u = new URL(url);
    calls.push(`${method} ${u.host === 'uploads.github.com' ? 'upload' : u.pathname.replace('/repos/o/r', '')}${u.searchParams.get('name') ? ` ${u.searchParams.get('name')}` : ''}`);
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
    expect(url).not.toContain(TOKEN);
    if (o.fail && o.fail.method === method) return new Response('nope', { status: o.fail.status });
    const p = u.pathname.replace('/repos/o/r', '');
    if (method === 'GET' && p.startsWith('/releases/tags/')) return release && p.endsWith(`/${release.tag}`) ? json({ id: release.id, upload_url: `https://uploads.github.com/repos/o/r/releases/${release.id}/assets{?name,label}` }) : json({}, 404);
    if (method === 'POST' && p === '/releases') {
      const b = JSON.parse(String(init.body)) as { tag_name: string };
      release = { id: 8, tag: b.tag_name };
      return json({ id: 8, upload_url: 'https://uploads.github.com/repos/o/r/releases/8/assets{?name,label}' }, 201);
    }
    if (method === 'GET' && p.endsWith('/assets')) {
      const page = Number(u.searchParams.get('page')), all = [...assets].map(([i, a]) => ({ id: i, name: a.name }));
      return json(all.slice((page - 1) * 100, page * 100));
    }
    if (method === 'POST' && u.host === 'uploads.github.com') {
      const name = u.searchParams.get('name')!;
      if ([...assets.values()].some((a) => a.name === name)) return json({}, 422);
      assets.set(++id, { name, size: (init.body as Uint8Array).length });
      return json({ id, name }, 201);
    }
    const m = /^\/releases\/assets\/(\d+)$/.exec(p);
    if (m && method === 'DELETE') return assets.delete(Number(m[1])) ? new Response(null, { status: 204 }) : json({}, 404);
    if (m && method === 'PATCH') {
      assets.get(Number(m[1]))!.name = (JSON.parse(String(init.body)) as { name: string }).name;
      return json({ id: Number(m[1]) });
    }
    return json({}, 400);
  };
  const names = () => [...assets.values()].map((a) => a.name).sort();
  const add = (name: string) => assets.set(++id, { name, size: 1 });
  return { fetch, calls, names, add, assets, release: () => release };
}

describe('the upload', () => {
  const gh = (f: ReturnType<typeof fakeGitHub>, tag = 'dumps'): GitHub => ({ fetch: f.fetch, token: TOKEN, repo: 'o/r', tag });
  it('makes the release when missing (the test relay’s own tag), then uploads', async () => {
    const f = fakeGitHub({ release: false });
    expect(await upload(gh(f, 'dumps-test'), 'island-record-2026-11-11.json.age', new Uint8Array([1, 2, 3]))).toEqual({ kept: 1, del: 0, replaced: false });
    expect(f.release()).toMatchObject({ tag: 'dumps-test' });
    expect(f.names()).toEqual(['island-record-2026-11-11.json.age']);
  });
  it('replaces the same day’s (idempotent: one file a day), keeps 90 and never touches notes', async () => {
    const f = fakeGitHub();
    for (let i = 0; i < 95; i++) f.add(assetName(new Date(Date.parse('2026-08-01T00:00:00Z') + i * 24 * H).toISOString().slice(0, 10)));
    f.add('notes-2026-08-02.tar.age');
    f.add('notes-2026-11-08.tar.age');
    f.add('island-record-2026-11-11.json.age.part'); // a crashed run's
    const name = 'island-record-2026-11-11.json.age';
    const r1 = await upload(gh(f), name, new Uint8Array(5));
    expect(r1).toEqual({ kept: ARCHIVE_KEEP, del: 6, replaced: false });
    const r2 = await upload(gh(f), name, new Uint8Array(9));
    expect(r2).toEqual({ kept: ARCHIVE_KEEP, del: 0, replaced: true });
    expect(f.names().filter((n) => n.startsWith('island-record-'))).toHaveLength(ARCHIVE_KEEP);
    expect(f.names()).toContain('notes-2026-08-02.tar.age');
    expect(f.names()).toContain('notes-2026-11-08.tar.age');
    expect(f.names().filter((n) => n.endsWith('.part'))).toEqual([]);
    expect([...f.assets.values()].find((a) => a.name === name)!.size).toBe(9);
    // the second run: up under .part, the old deleted, the new renamed
    expect(f.calls.slice(-4).map((c) => c.split(' ')[0] + (c.includes('.part') ? ' part' : ''))).toEqual(['GET', 'POST part', 'DELETE', 'PATCH']);
  });
});

describe('a run', () => {
  let f: ReturnType<typeof fakeGitHub>;
  let t: number;
  let recipient: string;
  let id: string;
  const io = (o: Partial<ArchiveIO> = {}): ArchiveIO => ({
    dump: () => ({ text: '{"ok":true,"rev":"e1","rows":{"metrics":[[1]],"events":[[2]],"uploads":[],"held":[]}}\n', metrics: 1, events: 1 }),
    gh: { fetch: f.fetch, token: TOKEN, repo: 'o/r', tag: 'dumps' }, recipient, now: () => (t += 5), ...o
  });
  beforeEach(async () => {
    f = fakeGitHub();
    t = T3;
    id = await generateX25519Identity();
    recipient = await identityToRecipient(id);
  });
  it('uploads the encrypted dump under the slot’s name and says its size and rows', async () => {
    const r = await runArchive(io());
    expect(r).toMatchObject({ ok: true, st: 'ok', slot: '2026-11-11', metrics: 1, events: 1, kept: 1, del: 0 });
    expect(f.names()).toEqual(['island-record-2026-11-11.json.age']);
    expect(r.ms).toBeGreaterThan(0);
  });
  it('without a token: no_token, no call; an empty record: nothing uploaded; GitHub refusing: its step and status only', async () => {
    expect(await runArchive(io({ gh: { fetch: f.fetch, repo: 'o/r', tag: 'dumps' } }))).toMatchObject({ ok: false, st: 'no_token' });
    expect(await runArchive(io({ dump: () => ({ text: '', metrics: 0, events: 3 }) }))).toMatchObject({ ok: false, st: 'empty' });
    expect(f.calls).toEqual([]);
    const bad = fakeGitHub({ fail: { method: 'POST', status: 403 } });
    const r = await runArchive(io({ gh: { fetch: bad.fetch, token: TOKEN, repo: 'o/r', tag: 'dumps' } }));
    expect(r).toMatchObject({ ok: false, st: 'github', step: 'upload', http: 403 });
    expect(JSON.stringify(r)).not.toContain(TOKEN);
    expect(retryAt(after(NO_STATE, r, t), r)).toBe(t + RETRY_MIN_MS);
    const thrown = await runArchive(io({ dump: () => { throw new TypeError('boom'); } }));
    expect(thrown).toMatchObject({ ok: false, st: 'TypeError', step: 'dump' });
  });
});

describe('the log’s backupH', () => {
  it('hours since the last good cron.backup, -1 with none; the last run’s st', () => {
    const db = memSql();
    let now = T3;
    const log = new LogCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now });
    expect(log.stats()).toMatchObject({ backupH: -1, backupSt: 'none' });
    log.add([{ e: 'cron.backup', l: 1, d: { ok: true, st: 'ok', kB: 1100 } }]);
    now += 30 * H;
    log.add([{ e: 'cron.backup', l: 3, d: { ok: false, st: 'github', step: 'upload', http: 502 } }]);
    now += 20 * H;
    expect(log.stats()).toMatchObject({ backupH: 50, backupSt: 'github' });
  });
});
