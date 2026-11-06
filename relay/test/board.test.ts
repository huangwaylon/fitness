// The bulletin board in the record (docs/board.md, docs/backend.md#events `board`): a note set or removed, last writer
// wins per post, removal final; the text sanitised here as on the phone; an edit only by its author, a removal by its
// author or a member, the guest posting and changing only its own; at most BOARD_MAX posts kept (a new one drops the
// oldest); every phone told, and the export carrying them.
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { BOARD_MAX, boardOpOf, boardPosts, type BoardEntry } from '../../app/src/lib/contract/board.ts';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const T0 = Date.parse('2026-11-02T03:00:00.000Z');

describe('the board in the record', () => {
  let now: number;
  let notices: Notice[];
  let db: ReturnType<typeof memSql>;
  let store: StoreCore;
  const open = () => new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: (n) => notices.push(n) });
  beforeEach(() => {
    now = T0;
    notices = [];
    db = memSql();
    store = open();
  });
  const call = (key: string, action: string, extra: object = {}) => store.handle({ key, action, ...extra }, 100) as Record<string, any>;
  const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
  let n = 0;
  /** `who` sends a board op (its event id fresh each time). */
  const send = (who: 'A' | 'B' | 'G', data: object) => call(keyOf[who], 'event', { id: `e${++n}`, type: 'board', data });
  const post = (who: 'A' | 'B' | 'G', id: string, t: string, at = (now += 1000)) => send(who, { id, at, p: at, t });
  /** The posts as a phone gets them (its snapshot's board rows, merged). */
  const posts = (key = KEY_A) => {
    const rows = (call(key, 'snapshot').rows.events as [string, 'A' | 'B' | 'G', string, string, string][]).filter((r) => r[3] === 'board');
    return boardPosts(rows.map((r) => ({ ...boardOpOf(JSON.parse(r[4]))!, who: r[1] }) as BoardEntry));
  };

  it('keeps a post, tells the phones, and a guest’s phone sees it', () => {
    expect(post('A', 'bpost001', 'こんにちは！')).toMatchObject({ ok: true });
    expect(notices.at(-1)).toMatchObject({ what: 'event', who: 'A' });
    expect(posts(KEY_C)).toMatchObject([{ id: 'bpost001', who: 'A', t: 'こんにちは！' }]);
  });

  it('a corrupt stored row is skipped and told to the log (once a request), never silently; the post still goes in', () => {
    const told: string[] = [];
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B, KEY_C }, now: () => now, notify: (n) => notices.push(n), corrupt: (w) => void told.push(w) });
    for (const [id, data] of [['bad1', '{"id":"bpost0'], ['bad2', 'null']])
      db.sql.exec("INSERT INTO events (id, at, person, type, data) VALUES (?, '2026-11-02T02:00:00.000Z', 'A', 'board', ?)", id, data);
    expect(post('A', 'bpost009', 'まだ')).toMatchObject({ ok: true });
    expect(told).toEqual(['board']);
    expect((call(KEY_A, 'snapshot').rows.events as string[][]).filter((r) => r[4].includes('bpost009'))).toHaveLength(1);
    // the next request tells it again
    expect(post('B', 'bpost010', 'もう')).toMatchObject({ ok: true });
    expect(told).toEqual(['board', 'board']);
  });

  it('sanitises the text: trimmed, control characters gone, at most 4 lines and 100 characters', () => {
    expect(post('B', 'bpost002', '  あ\u0007い\u202eう\r\nふたつめ\n\n\n3\n4\n5  ')).toMatchObject({ ok: true });
    expect(posts()[0].t).toBe('あいう\nふたつめ\n\n3 4 5');
    expect(post('B', 'bpost003', 'x'.repeat(130))).toMatchObject({ ok: true });
    expect([...posts()[0].t].length).toBe(100);
    // nothing left: refused
    expect(post('B', 'bpost004', ' \u0000\n ')).toMatchObject({ ok: false, error: 'bad_request' });
    // HTML is only text
    expect(post('A', 'bpost005', '<img src=x onerror=alert(1)>')).toMatchObject({ ok: true });
    expect(posts()[0].t).toBe('<img src=x onerror=alert(1)>');
  });

  it('refuses a malformed op', () => {
    expect(send('A', { id: 'nope', at: now, p: now, t: 'x' })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('A', { id: 'bpost010', at: now, p: now + 1, t: 'x' })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('A', { id: 'bpost010', at: now, p: now, t: 'x', html: '<b>' })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(send('A', { id: 'bpost010', at: now, rm: true, t: 'x' })).toMatchObject({ ok: false, error: 'bad_request' });
  });

  it('lets the author edit, last writer wins, and an older edit changes nothing', () => {
    const p = now + 1000;
    post('A', 'bpost020', 'まえ', p);
    expect(send('A', { id: 'bpost020', at: p + 5000, p, t: 'あと' })).toMatchObject({ ok: true });
    expect(send('A', { id: 'bpost020', at: p + 2000, p, t: 'もっとまえ' })).toMatchObject({ ok: true, duplicate: true });
    expect(posts()).toMatchObject([{ id: 'bpost020', who: 'A', t: 'あと', p, at: p + 5000 }]);
    // an edit keeps the post's `p`
    expect(send('A', { id: 'bpost020', at: p + 9000, p: p + 1, t: 'ずれ' })).toMatchObject({ ok: true, duplicate: true });
    expect(posts()[0].t).toBe('あと');
  });

  it('lets only the author edit: the partner and the guest are refused', () => {
    const p = now + 1000;
    post('A', 'bpost030', 'ウェイの', p);
    expect(send('B', { id: 'bpost030', at: p + 1000, p, t: 'うめが' })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(send('G', { id: 'bpost030', at: p + 1000, p, t: 'ゲストが' })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(posts()[0].t).toBe('ウェイの');
  });

  it('lets anyone remove any post, the guest as a member; a removal is final', () => {
    const p = now + 1000;
    post('G', 'bpost040', 'ゲストのメモ', p);
    post('A', 'bpost041', 'ウェイのメモ', p + 10);
    // the guest posts and edits its own
    expect(send('G', { id: 'bpost040', at: p + 2000, p, t: 'ゲストのメモ（なおした）' })).toMatchObject({ ok: true });
    // but edits nobody else's
    expect(send('G', { id: 'bpost041', at: p + 2500, p: p + 10, t: 'かきかえ' })).toMatchObject({ ok: false, error: 'forbidden' });
    // a member removes the guest's
    expect(send('B', { id: 'bpost040', at: p + 3000, rm: true })).toMatchObject({ ok: true });
    expect(posts().map((x) => x.id)).toEqual(['bpost041']);
    // final: a later set doesn't bring it back
    expect(send('G', { id: 'bpost040', at: p + 9000, p, t: 'もどれ' })).toMatchObject({ ok: true, duplicate: true });
    expect(posts().map((x) => x.id)).toEqual(['bpost041']);
    // the guest removes a member's, as a member may
    expect(send('G', { id: 'bpost041', at: p + 3000, rm: true })).toMatchObject({ ok: true });
    expect(posts()).toEqual([]);
  });

  it('drops an op on a post it doesn’t hold, unless it is a new one', () => {
    expect(send('A', { id: 'bpost050', at: now + 2000, p: now, t: 'まだない' })).toMatchObject({ ok: true, duplicate: true });
    expect(send('A', { id: 'bpost051', at: now + 2000, rm: true })).toMatchObject({ ok: true, duplicate: true });
    expect(posts()).toEqual([]);
  });

  it('keeps at most BOARD_MAX posts: a new one drops the oldest', () => {
    for (let i = 0; i < BOARD_MAX; i++) expect(post(i % 2 ? 'A' : 'G', `bcap${String(i).padStart(4, '0')}`, `#${i}`)).toMatchObject({ ok: true });
    expect(posts()).toHaveLength(BOARD_MAX);
    expect(post('B', 'bcapnew1', 'あたらしい')).toMatchObject({ ok: true });
    const ids = posts().map((x) => x.id);
    expect(ids).toHaveLength(BOARD_MAX);
    expect(ids[0]).toBe('bcapnew1');
    expect(ids).not.toContain('bcap0000');
    // the dropped one's edit is dropped too
    expect(send('G', { id: 'bcap0000', at: now + 60_000, p: T0 + 1000, t: 'もどる？' })).toMatchObject({ ok: true, duplicate: true });
    expect(posts().map((x) => x.id)).not.toContain('bcap0000');
    // the record holds one row per post
    const rows = (call(KEY_A, 'snapshot').rows.events as unknown[][]).filter((r) => r[3] === 'board');
    expect(rows).toHaveLength(BOARD_MAX);
  });

  it('keeps only the latest removals', () => {
    for (let i = 0; i < BOARD_MAX + 5; i++) {
      post('A', `bgone${String(i).padStart(4, '0')}`, `#${i}`);
      expect(send('A', { id: `bgone${String(i).padStart(4, '0')}`, at: (now += 1000), rm: true })).toMatchObject({ ok: true });
    }
    const rows = (call(KEY_A, 'snapshot').rows.events as unknown[][]).filter((r) => r[3] === 'board');
    expect(rows).toHaveLength(BOARD_MAX);
    // a pruned removal's post never comes back (its edit is dropped)
    expect(send('A', { id: 'bgone0000', at: (now += 1000), p: T0 + 1000, t: 'x' })).toMatchObject({ ok: true, duplicate: true });
    expect(posts()).toEqual([]);
  });

  it('persists: a new store over the same database has the posts, and the dump and export carry them', async () => {
    post('A', 'bpost060', 'のこる');
    post('G', 'bpost061', 'ゲストも');
    store = open();
    expect(posts().map((x) => x.t)).toEqual(['ゲストも', 'のこる']);
    const dumped = store.dump().rows.events.filter((r) => r[3] === 'board');
    expect(dumped).toHaveLength(2);
    // a dump loads back into an empty record as it was
    const was = db;
    db = memSql();
    store = open();
    expect(store.load({ rows: { events: dumped } })).toMatchObject({ ok: true, events: 2 });
    expect(posts().map((x) => x.t)).toEqual(['ゲストも', 'のこる']);
    void was;
  });
});
