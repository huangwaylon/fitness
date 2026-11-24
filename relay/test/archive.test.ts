// The record's daily backup (src/archive.ts): its slot and retries, the dump (byte for byte what `record.ts dump`
// writes from the admin's pages, a page at a time), its gzip, the age encryption and the reading of old and new dumps (decrypted here with a test key, never the real one), the
// release's upload (a fake GitHub: the same day replaced, the last 90 kept, `notes-*` never touched) and the log's
// `backupH`.
import { gunzipSync } from 'node:zlib';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Decrypter, generateX25519Identity, identityToRecipient } from 'age-encryption';
import {
  after, ARCHIVE_KEEP, assetName, backoff, due, encrypt, gzip, NO_STATE, openDump, retention, retryAt, RETRY_MAX_MS, RETRY_MIN_MS,
  botAsset, botCount, botDay, runArchive, runBots, slotOf, upload, type ArchiveIO, type ArchiveState, type BotsIO, type GitHub
} from '../src/archive.ts';
import { StoreCore } from '../src/store.ts';
import { LogCore } from '../src/log.ts';
import { memSql } from './sqlite.ts';
import { idOf, jpeg } from './imgfix.ts';
import { fakeGitHub, TOKEN } from './github.ts';

const KEY_A = 'a'.repeat(64), KEY_B = 'b'.repeat(64), KEY_C = 'c'.repeat(64);
const H = 3_600_000;
/** 03:00 Tokyo on 2026-11-11 (18:00 UTC the 10th) */
const T3 = Date.parse('2026-11-10T18:00:00Z');

describe('the slot and its retries', () => {
  it('a slot runs from 03:00 Tokyo to 03:00 the next day, named by its first', () => {
    expect(slotOf(T3)).toBe('2026-11-11');
    expect(slotOf(T3 - 1)).toBe('2026-11-10');
    expect(slotOf(T3 + 24 * H - 1)).toBe('2026-11-11');
    expect(assetName('2026-11-11')).toBe('island-record-2026-11-11.json.gz.age');
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
  it('keeps each kind on its own: the bots’ files never count against the record’s', () => {
    const day = (i: number) => new Date(Date.parse('2026-01-01T00:00:00Z') + i * 24 * H).toISOString().slice(0, 10);
    const its = Array.from({ length: 4 }, (_, i) => botAsset('its', day(i))), gym = Array.from({ length: 4 }, (_, i) => botAsset('gym', day(i)));
    const recs = Array.from({ length: 2 }, (_, i) => assetName(day(i)));
    const all = [...its, ...gym, ...recs];
    expect(retention(all, 2)).toEqual([]);
    expect(retention(all, 2, 'its')).toEqual(its.slice(0, 2));
    expect(retention(all, 3, 'gym')).toEqual(gym.slice(0, 1));
  });
  it('counts the old .json.age dumps with the new, by day', () => {
    const old = ['island-record-2026-11-10.json.age', 'island-record-2026-11-11.json.age'];
    expect(retention([assetName('2026-11-12'), ...old, assetName('2026-11-13')], 2)).toEqual(old);
  });
});

describe('the dump', () => {
  it('is byte for byte what record.ts dump writes from the admin dump pages, and the record writes nothing', async () => {
    const db = memSql();
    let now = Date.parse('2026-11-01T00:00:00Z');
    const store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: () => {} });
    const metrics: unknown[][] = [], events: unknown[][] = [];
    for (let i = 0; i < 40; i++) {
      const at = new Date(now + i * 60_000).toISOString(), date = `2026-10-${String(10 + (i % 20)).padStart(2, '0')}`;
      metrics.push([at, i % 2 ? 'A' : 'B', date, 'steps', 1000 + i]);
      if (i % 3 === 0) events.push([at, 'A', `t${i}`, 'tally', JSON.stringify({ date, counts: { 'fish:koi': i } })]);
    }
    const uploads = [0, 1, 2].map((i) => [new Date(now + i * 60_000 + 1).toISOString(), 'A', 'ok', 100 + i, '']);
    expect(store.load({ rows: { metrics, events, uploads } })).toMatchObject({ ok: true });
    // (25 pictures: more than one page of imgdump's and of the text's)
    for (let i = 0; i < 25; i++) {
      const b = jpeg({ seed: i, pad: 50 });
      await store.imgPut('A', await idOf(b), b);
    }
    now += H;
    // record.ts dump(): the pages put together, then the pictures' pages
    const rows = { metrics: [] as unknown[], events: [] as unknown[], uploads: [] as unknown[], held: [] as unknown[], share: [] as unknown[], share_visit: [] as unknown[], places: [] as unknown[], img: [] as unknown[], ledger: [] as unknown[], ledger_log: [] as unknown[] };
    let after: unknown, rev: unknown;
    do {
      const r = { rev: store.rev(), ...store.dumpPage({ limit: 7, ...(after ? { after } : {}) }) } as unknown as { rev: string; next?: string; rows: typeof rows };
      rev = r.rev;
      for (const k of ['metrics', 'events', 'uploads', 'held', 'share', 'share_visit', 'places', 'ledger', 'ledger_log'] as const) rows[k].push(...(r.rows[k] ?? []));
      after = r.next;
    } while (after);
    do {
      const r = store.imgDump(after ? { after } : {}) as { next?: string; img: unknown[] };
      rows.img.push(...r.img);
      after = r.next;
    } while (after);
    expect(rows.img).toHaveLength(25);
    const tool = `${JSON.stringify({ ok: true, rev, rows })}\n`;
    const before = db.db.prepare('SELECT total_changes() AS n').get() as { n: number };
    for (const page of [1, 3, 2000]) expect([...store.dumpText(page)].join('')).toBe(tool);
    expect(tool).toContain('"uploads":[["');
    expect((db.db.prepare('SELECT total_changes() AS n').get() as { n: number }).n).toBe(before.n);
  });
  it('a row written between its pages is in it once or not at all; a new epoch under it throws', () => {
    const db = memSql();
    let now = Date.parse('2026-11-01T00:00:00Z');
    const store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: () => {} });
    const metrics = Array.from({ length: 10 }, (_, i) => [new Date(now + i * 1000).toISOString(), 'A', `2026-10-${10 + i}`, 'steps', i]);
    store.load({ rows: { metrics, events: [] } });
    now += H;
    const it = store.dumpText(4);
    const head = [it.next().value, it.next().value];
    store.load({ rows: { metrics: [[new Date(now).toISOString(), 'B', '2026-10-31', 'steps', 99]], events: [] } });
    const d = JSON.parse(head.join('') + [...it].join('')) as { rows: { metrics: unknown[][] } };
    expect(d.rows.metrics.map((r) => r[4])).toEqual([...metrics.map((r) => r[4]), 99]);
    const it2 = store.dumpText(4);
    it2.next();
    store.bumpRev();
    expect(() => [...it2]).toThrow(expect.objectContaining({ name: 'epoch' }));
  });
});

describe('the encryption', () => {
  it('decrypts with the identity of its recipient (a test key), and only with it', async () => {
    const id = await generateX25519Identity(), other = await generateX25519Identity();
    const text = `${JSON.stringify({ ok: true, rev: 'e1', rows: { metrics: [['2026-11-10T00:00:00.000Z', 'A', '2026-11-10', 'steps', 1234]], events: [], uploads: [], held: [] } })}\n`;
    const bytes = await encrypt(new TextEncoder().encode(text), await identityToRecipient(id));
    expect(new TextDecoder().decode(bytes.slice(0, 21))).toBe('age-encryption.org/v1');
    expect(new TextDecoder().decode(bytes)).not.toContain('steps');
    const d = new Decrypter();
    d.addIdentity(id);
    expect(await d.decrypt(bytes, 'text')).toBe(text);
    const wrong = new Decrypter();
    wrong.addIdentity(other);
    await expect(wrong.decrypt(bytes, 'text')).rejects.toThrow();
  });
  it('gzips the pieces as they come (gzip -d reads it) and openDump reads every kind of dump file', async () => {
    const id = await generateX25519Identity(), r = await identityToRecipient(id);
    const text = `${JSON.stringify({ ok: true, rev: 'e1', rows: { metrics: Array.from({ length: 500 }, (_, i) => ['2026-11-10T00:00:00.000Z', 'A', '2026-11-10', 'steps', i]), events: [], uploads: [], held: [] } })}\n`;
    const z = await gzip([text.slice(0, 7), '', text.slice(7)]);
    expect(z.raw).toBe(text.length);
    expect([z.bytes[0], z.bytes[1]]).toEqual([0x1f, 0x8b]);
    expect(z.bytes.length).toBeLessThan(text.length / 5);
    expect(gunzipSync(z.bytes).toString()).toBe(text);
    const old = await encrypt(new TextEncoder().encode(text), r), neu = await encrypt(z.bytes, r);
    for (const b of [old, neu, z.bytes, new TextEncoder().encode(text)]) expect(await openDump(b, id)).toBe(text);
    await expect(openDump(neu)).rejects.toThrow(/identity/);
  });
});

describe('the upload', () => {
  const gh = (f: ReturnType<typeof fakeGitHub>, tag = 'dumps'): GitHub => ({ fetch: f.fetch, token: TOKEN, repo: 'o/r', tag });
  it('makes the release when missing (the test relay’s own tag), then uploads', async () => {
    const f = fakeGitHub({ release: false });
    expect(await upload(gh(f, 'dumps-test'), 'island-record-2026-11-11.json.age', new Uint8Array([1, 2, 3]))).toEqual({ kept: 1, del: 0, replaced: false });
    expect(f.release()).toMatchObject({ tag: 'dumps-test' });
    expect(f.names()).toEqual(['island-record-2026-11-11.json.age']);
  });
  it('the day’s old-format dump goes once the new one is up', async () => {
    const f = fakeGitHub();
    f.add('island-record-2026-11-10.json.age');
    f.add('island-record-2026-11-11.json.age');
    expect(await upload(gh(f), assetName('2026-11-11'), new Uint8Array(3))).toEqual({ kept: 2, del: 0, replaced: false });
    expect(f.names()).toEqual(['island-record-2026-11-10.json.age', 'island-record-2026-11-11.json.gz.age']);
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
    dump: () => ({ pieces: ['{"ok":true,"rev":"e1","rows":{"metrics":[[1]],', '"events":[[2]],"uploads":[],"held":[]}}\n'], metrics: 1, events: 1 }),
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
    expect(f.names()).toEqual(['island-record-2026-11-11.json.gz.age']);
    expect(await openDump([...f.assets.values()][0].body!, id)).toBe('{"ok":true,"rev":"e1","rows":{"metrics":[[1]],"events":[[2]],"uploads":[],"held":[]}}\n');
    expect(r.rawkB).toBe(0);
    expect(r.ms).toBeGreaterThan(0);
  });
  it('without a token: no_token, no call; an empty record: nothing uploaded; GitHub refusing: its step and status only', async () => {
    expect(await runArchive(io({ gh: { fetch: f.fetch, repo: 'o/r', tag: 'dumps' } }))).toMatchObject({ ok: false, st: 'no_token' });
    expect(await runArchive(io({ dump: () => ({ pieces: [], metrics: 0, events: 3 }) }))).toMatchObject({ ok: false, st: 'empty' });
    expect(f.calls).toEqual([]);
    const bad = fakeGitHub({ fail: { method: 'POST', status: 403 } });
    const r = await runArchive(io({ gh: { fetch: bad.fetch, token: TOKEN, repo: 'o/r', tag: 'dumps' } }));
    expect(r).toMatchObject({ ok: false, st: 'github', step: 'upload', http: 403 });
    expect(JSON.stringify(r)).not.toContain(TOKEN);
    expect(retryAt(after(NO_STATE, r, t), r)).toBe(t + RETRY_MIN_MS);
    const thrown = await runArchive(io({ dump: () => { throw new TypeError('boom'); } }));
    expect(thrown).toMatchObject({ ok: false, st: 'TypeError', step: 'dump' });
  });
  it('a GitHub call that never answers times out (30 s, here 20 ms): TimeoutError at the github step, retried later', async () => {
    const orig = AbortSignal.timeout.bind(AbortSignal);
    const spy = vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => orig(20));
    const hang = (_u: string, init: RequestInit) => new Promise<Response>((_, rej) => init.signal?.addEventListener('abort', () => rej(init.signal!.reason)));
    const r = await runArchive(io({ gh: { fetch: hang, token: TOKEN, repo: 'o/r', tag: 'dumps' } }));
    spy.mockRestore();
    expect(r).toMatchObject({ ok: false, st: 'TimeoutError', step: 'github' });
    expect(retryAt(after(NO_STATE, r, t), r)).toBe(t + RETRY_MIN_MS);
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

  it('kept as each is added (meta `backup`, 2026-11-24): a stats call reads no backup rows; a log from before it read once; a purge forgets it', () => {
    const db = memSql();
    let now = T3;
    const mk = () => new LogCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now });
    let log = mk();
    log.add([{ e: 'cron.backup', l: 1, d: { ok: true, st: 'ok' } }]);
    db.sql.exec("DELETE FROM meta WHERE k = 'backup'"); // a log from before the row
    now += 2 * H;
    log = mk();
    expect(log.stats()).toMatchObject({ backupH: 2, backupSt: 'ok' });
    expect(db.sql.exec<{ v: string }>("SELECT v FROM meta WHERE k = 'backup'").toArray()).toHaveLength(1);
    // a day of other rows: the newest backup isn't looked for among them
    for (let i = 0; i < 50; i++) log.add([{ e: 'room.close', l: 1, d: { code: 1000 } }]);
    log.add([{ e: 'cron.backup', l: 2, d: { ok: false, st: 'no_token' } }]);
    expect(log.stats()).toMatchObject({ backupH: 2, backupSt: 'no_token' });
    // the good one older than the log keeps: none
    now += 31 * 24 * H;
    expect(log.stats()).toMatchObject({ backupH: -1, backupSt: 'no_token' });
    log.purge({});
    expect(log.stats()).toMatchObject({ backupH: -1, backupSt: 'none' });
  });
});

describe('the bots’ state', () => {
  const ITS = { verdict: 'ok', settings: { dates: ['2026-12-01'], updatedAt: 1 }, bookings: [{ id: 'b1' }, { id: 'b2' }], events: [], seen: [] };
  const GYM = { version: 3, days: {} };
  let f: ReturnType<typeof fakeGitHub>;
  let id: string;
  let recipient: string;
  let t: number;
  const answer = (x: unknown, status = 200) => () => Promise.resolve(new Response(typeof x === 'string' ? x : JSON.stringify(x), { status }));
  const io = (o: Partial<BotsIO> = {}): BotsIO => ({
    bots: { its: answer(ITS), gym: answer(GYM) }, gh: { fetch: f.fetch, token: TOKEN, repo: 'o/r', tag: 'dumps' }, recipient, slot: '2026-11-11', now: () => (t += 5), ...o
  });
  const decrypted = async (name: string) => {
    const d = new Decrypter();
    d.addIdentity(id);
    return new TextDecoder().decode(await d.decrypt([...f.assets.values()].find((a) => a.name === name)!.body!));
  };
  beforeEach(async () => {
    f = fakeGitHub();
    t = T3;
    id = await generateX25519Identity();
    recipient = await identityToRecipient(id);
  });
  it('reads each, encrypts it to the recipient and uploads it beside the record’s, kept 90 a kind', async () => {
    f.add(assetName('2026-11-11'));
    f.add('notes-2026-11-08.tar.age');
    const r = await runBots(io());
    expect(r).toMatchObject({ its: 'ok', gym: 'ok', itsN: 2, gymV: 3 });
    expect(r.botsMs).toBeGreaterThan(0);
    expect(f.names()).toEqual(['gym-2026-11-11.json.age', 'island-record-2026-11-11.json.gz.age', 'its-2026-11-11.json.age', 'notes-2026-11-08.tar.age']);
    expect(JSON.parse(await decrypted('its-2026-11-11.json.age'))).toEqual(ITS);
    expect(JSON.parse(await decrypted('gym-2026-11-11.json.age'))).toEqual(GYM);
    // the same slot again replaces its files; the record's untouched
    await runBots(io());
    expect(f.names()).toHaveLength(4);
  });
  it('one bot failing never stops the other: a refusal, a throw, a hang, not its state, no binding', async () => {
    const orig = AbortSignal.timeout.bind(AbortSignal);
    const spy = vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => orig(20));
    const hang = (signal: AbortSignal) => new Promise<Response>((_, rej) => signal.addEventListener('abort', () => rej(signal.reason)));
    expect(await runBots(io({ bots: { its: answer('unauthorized', 401), gym: answer(GYM) } }))).toMatchObject({ its: 'http_401', gym: 'ok' });
    expect(await runBots(io({ bots: { its: () => Promise.reject(new TypeError('binding')), gym: hang } }))).toMatchObject({ its: 'TypeError', gym: 'TimeoutError' });
    expect(await runBots(io({ bots: { its: answer({ ok: false }), gym: answer('<html>') } }))).toMatchObject({ its: 'bad', gym: 'bad' });
    expect(await runBots(io({ bots: { gym: answer(GYM) } }))).toMatchObject({ its: 'none', gym: 'ok' });
    spy.mockRestore();
    expect(f.names()).toEqual(['gym-2026-11-11.json.age']);
  });
  it('GitHub refusing: its step and status; no token: nothing read', async () => {
    const bad = fakeGitHub({ fail: { method: 'POST', status: 403 } });
    expect(await runBots(io({ gh: { fetch: bad.fetch, token: TOKEN, repo: 'o/r', tag: 'dumps' } }))).toMatchObject({ its: 'github_upload_403', gym: 'github_upload_403' });
    let read = 0;
    const counted = () => (read++, Promise.resolve(new Response('{}')));
    expect(await runBots(io({ bots: { its: counted, gym: counted }, gh: { fetch: f.fetch, repo: 'o/r', tag: 'dumps' } }))).toMatchObject({ its: 'no_token', gym: 'no_token' });
    expect(read).toBe(0);
  });
  it('the day before’s counts from each bot’s X-Bot-Day header, on the line (2026-11-24); another day’s or junk: none', async () => {
    const day = (bot: string, x: unknown) => () => Promise.resolve(new Response(JSON.stringify(bot === 'its' ? ITS : GYM), { headers: { 'X-Bot-Day': JSON.stringify(x) } }));
    const r = await runBots(io({ bots: { its: day('its', { d: '2026-11-10', rep: 120, runErr: 2, disp: 1, dispFail: 0, inc: 1, alert: 0, push: 3, pushFail: 1 }), gym: day('gym', { d: '2026-11-10', checks: 96, fail: 1, down: 0, push: 2, pushFail: 0, acts: 4, other: 9 }) } }));
    expect(r).toMatchObject({ its: 'ok', gym: 'ok', itsRep: 120, itsRunErr: 2, itsDisp: 1, itsDispFail: 0, itsInc: 1, itsAlert: 0, itsPush: 3, itsPushFail: 1, gymChecks: 96, gymFail: 1, gymDown: 0, gymPush: 2, gymPushFail: 0, gymActs: 4 });
    expect(r).not.toHaveProperty('other');
    expect(botDay('gym', JSON.stringify({ d: '2026-11-09', checks: 1 }), '2026-11-10')).toEqual({});
    expect(botDay('gym', '{', '2026-11-10')).toEqual({});
    expect(botDay('gym', null, '2026-11-10')).toEqual({});
    expect(botDay('its', JSON.stringify({ d: '2026-11-10', rep: -1, disp: 1.5, push: '3', inc: 2 }), '2026-11-10')).toEqual({ itsInc: 2 });
  });
  it('what counts as each one’s state', () => {
    expect([botCount('its', ITS), botCount('its', { settings: {}, bookings: [] }), botCount('its', null)]).toEqual([2, null, null]);
    expect([botCount('gym', GYM), botCount('gym', { version: '3' }), botCount('gym', [])]).toEqual([3, null, null]);
  });
});
