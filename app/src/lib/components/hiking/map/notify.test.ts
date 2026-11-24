// A hike's notification (notify.ts) on a fake phone: what a start, a resume and an undo do (ask only in the tap,
// show, the Home Screen line once, nothing), the notification's words, tag and trail, 終了's close, and a cleared one
// shown again once a page.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEVICE, type KV } from '#lib/sync/storage.ts';
import type { PushSupport } from '#lib/push/phone.ts';
import { HIKE_TAG, HikeNote, hikeNote, noteAction, resetNotePage, type NoteReg } from './notify.ts';

const mem = (): KV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};
const H = { slug: 'lake-22', name: 'レイク22', l: 'ja' as const, at: new Date(2026, 10, 22, 7, 5).getTime() };

function phone(o: { support?: PushSupport; perm?: NotificationPermission; grant?: NotificationPermission } = {}) {
  let perm: NotificationPermission = o.perm ?? 'granted';
  const shown: { title: string; o: NotificationOptions; closed: boolean }[] = [];
  const reg: NoteReg = {
    scope: 'https://x.example/fitness/',
    showNotification: vi.fn(async (title: string, opts: NotificationOptions) => {
      for (const s of shown) if (s.o.tag === opts.tag) s.closed = true;   // (a tag replaces)
      shown.push({ title, o: opts, closed: false });
    }),
    getNotifications: async () => shown.filter((s) => !s.closed).map((s) => ({ tag: s.o.tag, data: s.o.data, close: () => void (s.closed = true) }))
  };
  const ask = vi.fn(async () => (perm = o.grant ?? 'granted'));
  const kv = mem();
  const note = new HikeNote({ support: () => o.support ?? 'ok', permission: () => perm, ask, reg: async () => reg, kv });
  return { note, reg, ask, kv, open: () => shown.filter((s) => !s.closed) };
}

beforeEach(() => resetNotePage());

describe('noteAction', () => {
  it('asks only in the tap, when never answered; shows once granted; the Home Screen line once, from a tap', () => {
    expect(noteAction('ok', 'default', true, false)).toBe('ask');
    expect(noteAction('ok', 'default', false, false)).toBe('none');
    expect(noteAction('ok', 'granted', false, false)).toBe('show');
    expect(noteAction('denied', 'denied', true, false)).toBe('none');
    expect(noteAction('unsupported', null, true, false)).toBe('none');
    expect(noteAction('install', null, true, false)).toBe('hint');
    expect(noteAction('install', null, true, true)).toBe('none');
    expect(noteAction('install', null, false, false)).toBe('none');
  });
});

describe('the notification', () => {
  it('「登山中」, the trail and its start, one tag, the trail to open', () => {
    expect(hikeNote(H, '/fitness/')).toEqual({
      title: '登山中',
      options: { body: 'レイク22・7:05 出発', tag: HIKE_TAG, icon: '/fitness/icons/icon-192.png', data: { url: '/fitness/?open=hike&trail=lake-22', open: { to: 'hike', trail: 'lake-22' } } }
    });
    expect(hikeNote({ ...H, l: 'en', at: undefined }, '/').options.body).toBe('レイク22');
    expect(hikeNote({ ...H, l: 'en' }, '/').title).toBe('Hiking');
  });
});

describe('HikeNote', () => {
  it('歩きはじめる: asked in the tap (synchronously), shown on a yes; 終了 closes it', async () => {
    const p = phone({ perm: 'default' });
    expect(p.note.start(H, 'tap')).toBe(false);
    expect(p.ask).toHaveBeenCalledTimes(1);   // (before anything was awaited)
    await p.note.settled();
    expect(p.open().map((s) => [s.title, s.o.tag])).toEqual([['登山中', HIKE_TAG]]);
    p.note.end();
    await p.note.settled();
    expect(p.open()).toEqual([]);
  });
  it('refused: nothing shown, never asked again', async () => {
    const p = phone({ perm: 'default', grant: 'denied' });
    p.note.start(H, 'tap');
    await p.note.settled();
    expect(p.reg.showNotification).not.toHaveBeenCalled();
    const q = phone({ support: 'denied', perm: 'denied' });
    q.note.start(H, 'tap');
    await q.note.settled();
    expect([q.ask.mock.calls.length, q.open().length]).toEqual([0, 0]);
  });
  it('a restart or another trail replaces it, never stacks', async () => {
    const p = phone();
    p.note.start(H, 'tap');
    p.note.start({ ...H, slug: 'snow-lake', name: 'スノーレイク' }, 'tap');
    await p.note.settled();
    expect(p.open().map((s) => s.o.body)).toEqual(['スノーレイク・7:05 出発']);
  });
  it('a resume never asks; shows it only when gone, once a page', async () => {
    const p = phone({ perm: 'default' });
    p.note.start(H, 'resume');
    await p.note.settled();
    expect([p.ask.mock.calls.length, p.open().length]).toEqual([0, 0]);
    resetNotePage();
    const q = phone();
    q.note.start(H, 'tap');
    await q.note.settled();
    q.note.start(H, 'resume');   // (still there: not shown again)
    await q.note.settled();
    expect(q.reg.showNotification).toHaveBeenCalledTimes(1);
    resetNotePage();
    q.open()[0].closed = true;   // (cleared by hand)
    q.note.start(H, 'resume');
    q.note.start(H, 'resume');   // (the trail opened again this page: not pushed back)
    await q.note.settled();
    expect([q.open().length, (q.reg.showNotification as ReturnType<typeof vi.fn>).mock.calls.length]).toEqual([1, 2]);
  });
  it('終了 during the prompt: nothing shown after; its 取り消す shows it again', async () => {
    const p = phone({ perm: 'default' });
    p.note.start(H, 'tap');
    p.note.end();
    await p.note.settled();
    expect(p.open()).toEqual([]);
    p.note.start(H, 'undo');
    await p.note.settled();
    expect(p.open()).toHaveLength(1);
  });
  it('an iPhone’s Safari tab: the Home Screen line once a phone, nothing asked', async () => {
    const p = phone({ support: 'install', perm: 'default' });
    expect(p.note.start(H, 'tap')).toBe(true);
    expect(p.kv.m.get(DEVICE.hikeNotifyHint)).toBe('true');
    expect(p.note.start(H, 'tap')).toBe(false);
    await p.note.settled();
    expect([p.ask.mock.calls.length, p.open().length]).toEqual([0, 0]);
  });
  it('a failure (no registration, a throw) is swallowed: the hike goes on', async () => {
    const p = phone();
    const bad = new HikeNote({ support: () => 'ok', permission: () => 'granted', ask: p.ask, reg: async () => ({ ...p.reg, showNotification: async () => { throw new TypeError('x'); } }), kv: p.kv });
    expect(bad.start(H, 'tap')).toBe(false);
    await expect(bad.settled()).resolves.toBeUndefined();
    const none = new HikeNote({ support: () => 'ok', permission: () => 'granted', ask: p.ask, reg: async () => null, kv: p.kv });
    none.start(H, 'tap');
    none.end();
    await expect(none.settled()).resolves.toBeUndefined();
  });
});
