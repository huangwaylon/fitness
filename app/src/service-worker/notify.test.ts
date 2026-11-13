// The service worker's ITS notifications (notify.ts): the Worker's title, body and tag shown as they came (cut to
// their bounds), the generic line when a push can't be read, and a tap: an open window focused and told to open
// 保養所, else the app opened at ?open=its.
import { describe, expect, it, vi } from 'vitest';
import example from '../../../its/contract-example.json';
import { notificationFor, openApp, showPush } from './notify.ts';

const data = (s: string) => ({ text: () => s });

describe('notificationFor', () => {
  it('shows the Worker’s words, one tag a stay, the app icon, and opens 保養所', () => {
    const p = example.pushPayload;
    expect(notificationFor(data(JSON.stringify(p)), '/')).toEqual({
      title: '仮押さえ・要対応',
      options: { body: 'NAGU 勝浦・11/22(日)・13:25ごろまでにメールから申込', tag: p.tag, icon: '/icons/icon-192.png', data: { url: '/?open=its' } }
    });
    // a newer kind the worker doesn't know: still its words
    expect(notificationFor(data(JSON.stringify({ ...p, kind: 'later', title: 'x'.repeat(200) })), '/fitness/').title).toHaveLength(80);
    expect(notificationFor(data(JSON.stringify(p)), '/fitness/').options.data).toEqual({ url: '/fitness/?open=its' });
  });
  it('a push it can’t read still shows something (Safari drops a subscription whose push shows nothing)', () => {
    const fallback = { title: '保養所ボット', options: { body: 'お知らせがあります', tag: 'its', icon: '/icons/icon-192.png', data: { url: '/?open=its' } } };
    for (const d of [null, data('not json'), data('null'), data('[]'), data('{"title": ""}'), data('{"body": "no title"}'), { text: () => { throw new Error('x'); } }]) {
      expect(notificationFor(d, '/')).toEqual(fallback);
    }
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
});
