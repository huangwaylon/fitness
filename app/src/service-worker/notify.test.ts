// The service worker's notifications (notify.ts): the sender's title, body and tag shown as they came (cut to their
// bounds), the generic line when a push can't be read, and a tap: an open window focused and told where to open
// (保養所, or やること at an item), else the app opened at ?open=its / ?open=todo&item=….
import { describe, expect, it, vi } from 'vitest';
import example from '../../../its/contract-example.json';
import { notificationFor, openApp, showPush } from './notify.ts';

const data = (s: string) => ({ text: () => s });

describe('notificationFor', () => {
  it('shows the Worker’s words, one tag a stay, the app icon, and opens 保養所', () => {
    const p = example.pushPayload;
    expect(notificationFor(data(JSON.stringify(p)), '/')).toEqual({
      title: '仮押さえ・要対応', open: { to: 'its' },
      options: { body: 'NAGU 勝浦・11/22(日)・13:25ごろまでにメールから申込', tag: p.tag, icon: '/icons/icon-192.png', data: { url: '/?open=its' } }
    });
    // a newer kind the worker doesn't know: still its words
    expect(notificationFor(data(JSON.stringify({ ...p, kind: 'later', title: 'x'.repeat(200) })), '/fitness/').title).toHaveLength(80);
    expect(notificationFor(data(JSON.stringify(p)), '/fitness/').options.data).toEqual({ url: '/fitness/?open=its' });
  });
  it('a push it can’t read still shows something (Safari drops a subscription whose push shows nothing)', () => {
    const fallback = { title: '保養所ボット', open: { to: 'its' }, options: { body: 'お知らせがあります', tag: 'its', icon: '/icons/icon-192.png', data: { url: '/?open=its' } } };
    for (const d of [null, data('not json'), data('null'), data('[]'), data('{"title": ""}'), data('{"body": "no title"}'), { text: () => { throw new Error('x'); } }]) {
      expect(notificationFor(d, '/')).toEqual(fallback);
    }
  });
});

describe('a やること reminder', () => {
  const todo = { v: 1, kind: 'todo', title: '歯医者', body: '明日 9:30', tag: 'ditem0001', open: { to: 'todo', item: 'ditem0001' } };
  it('opens やること at the item; no badge', async () => {
    const n = notificationFor(data(JSON.stringify(todo)), '/fitness/');
    expect(n).toMatchObject({ title: '歯医者', options: { body: '明日 9:30', tag: 'ditem0001', data: { url: '/fitness/?open=todo&item=ditem0001', open: todo.open } } });
    const reg = { showNotification: vi.fn(async () => {}) }, nav = { setAppBadge: vi.fn(async () => {}) };
    await showPush(reg, nav, data(JSON.stringify(todo)), '/');
    expect(nav.setAppBadge).not.toHaveBeenCalled();
    // a test notification: やること, no item; an id that isn't one dropped; an older relay's `list` ignored
    expect(notificationFor(data(JSON.stringify({ ...todo, kind: 'test', open: { to: 'todo' } })), '/').options.data).toEqual({ url: '/?open=todo', open: { to: 'todo' } });
    expect(notificationFor(data(JSON.stringify({ ...todo, open: { to: 'todo', item: '../x' } })), '/').open).toEqual({ to: 'todo' });
    expect(notificationFor(data(JSON.stringify({ ...todo, open: { to: 'todo', list: 'dlist0001', item: 'ditem0001' } })), '/').open).toEqual({ to: 'todo', item: 'ditem0001' });
  });
  it('a tap: the open window told the item, else the app opened there', async () => {
    const mine = { url: 'https://island.test/fitness/', focus: vi.fn(async () => {}), postMessage: vi.fn() };
    const clients = { matchAll: vi.fn(async () => [mine]), openWindow: vi.fn(async () => null) };
    await openApp(clients, '/fitness/', { url: 'x', open: todo.open });
    expect(mine.postMessage).toHaveBeenCalledWith({ k: 'open', to: 'todo', item: 'ditem0001' });
    clients.matchAll.mockResolvedValueOnce([]);
    await openApp(clients, '/fitness/', { url: 'x', open: todo.open });
    expect(clients.openWindow).toHaveBeenCalledWith('/fitness/?open=todo&item=ditem0001');
  });
});

describe('showPush', () => {
  const reg = () => ({ showNotification: vi.fn(async (_t: string, _o: NotificationOptions) => {}) });
  it('shows the notification and sets the badge, both inside the one promise', async () => {
    const r = reg();
    let badged = false;
    const nav = { setAppBadge: vi.fn(async () => void (badged = true)) };
    const p = showPush(r, nav, data(JSON.stringify(example.pushPayload)), '/');
    expect(r.showNotification).toHaveBeenCalledWith('仮押さえ・要対応', expect.objectContaining({ tag: example.pushPayload.tag }));
    await p;
    expect([nav.setAppBadge.mock.calls, badged]).toEqual([[[1]], true]);
  });
  it('a badge that throws, rejects or is missing never stops the notification nor fails the promise', async () => {
    for (const nav of [
      { setAppBadge: () => { throw new TypeError('no'); } },
      { setAppBadge: () => Promise.reject(new DOMException('x', 'NotAllowedError')) },
      { setAppBadge: () => undefined as unknown as Promise<void> },
      {},
      null,
    ]) {
      const r = reg();
      await expect(showPush(r, nav as never, data('not json'), '/')).resolves.toBeUndefined();
      expect(r.showNotification).toHaveBeenCalledWith('保養所ボット', expect.objectContaining({ body: 'お知らせがあります' }));
    }
  });
});

describe('openApp', () => {
  const win = (url: string) => ({ url, focus: vi.fn(async () => {}), postMessage: vi.fn() });
  it('an open window in the scope is focused and told to open 保養所', async () => {
    const other = win('https://example.com/elsewhere'), mine = win('https://island.test/fitness/?x=1');
    const clients = { matchAll: vi.fn(async () => [other, mine]), openWindow: vi.fn(async () => null) };
    await openApp(clients, '/fitness/');
    expect(mine.focus).toHaveBeenCalled();
    expect(mine.postMessage).toHaveBeenCalledWith({ k: 'open', to: 'its' });
    expect(other.postMessage).not.toHaveBeenCalled();
    expect(clients.openWindow).not.toHaveBeenCalled();
    // a focus refused still tells it
    mine.focus.mockRejectedValueOnce(new Error('not allowed'));
    await openApp(clients, '/fitness/');
    expect(mine.postMessage).toHaveBeenCalledTimes(2);
  });
  it('none open: the app opens at ?open=its', async () => {
    const clients = { matchAll: vi.fn(async () => [win('https://island.test/other/')]), openWindow: vi.fn(async () => null) };
    await openApp(clients, '/fitness/');
    expect(clients.openWindow).toHaveBeenCalledWith('/fitness/?open=its');
  });
  it('a hike’s (the page’s own, hiking/map/notify.ts): its trail, open or opened; a slug that isn’t one goes to 保養所', async () => {
    const data = { url: '/fitness/?open=hike&trail=lake-22', open: { to: 'hike', trail: 'lake-22' } };
    const mine = win('https://island.test/fitness/');
    await openApp({ matchAll: vi.fn(async () => [mine]), openWindow: vi.fn(async () => null) }, '/fitness/', data);
    expect(mine.postMessage).toHaveBeenCalledWith({ k: 'open', to: 'hike', trail: 'lake-22' });
    const none = { matchAll: vi.fn(async () => []), openWindow: vi.fn(async () => null) };
    await openApp(none, '/fitness/', data);
    await openApp(none, '/fitness/', { open: { to: 'hike', trail: 'u-hmi3x0k2abcd' } });
    await openApp(none, '/fitness/', { open: { to: 'hike', trail: '../x?open=its' } });
    expect(none.openWindow.mock.calls.map((c) => c[0])).toEqual(['/fitness/?open=hike&trail=lake-22', '/fitness/?open=hike&trail=u-hmi3x0k2abcd', '/fitness/?open=its']);
  });
});
