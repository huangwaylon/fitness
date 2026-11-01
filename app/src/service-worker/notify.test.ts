import { describe, expect, it, vi } from 'vitest';
import { notificationFor, openApp } from './notify.ts';

const SCOPE = '/fitness/';
const data = (s: string) => ({ text: () => s });

describe('the push handler', () => {
  it("shows the partner's goal with the app icon, in the phone's language, tagged by day", () => {
    const n = notificationFor(data('{"v":1,"kind":"goal","name":"うめ","date":"2026-11-01","lang":"ja"}'), SCOPE);
    expect(n).toEqual({
      title: 'しまの貯金箱',
      options: { body: 'うめが きょうの もくひょうを 4つ ぜんぶ たっせい！', tag: 'island-goal-2026-11-01', icon: '/fitness/icons/icon-192.png', lang: 'ja', data: { url: SCOPE } }
    });
    expect(notificationFor(data('{"v":1,"kind":"both","name":"ウェイ","date":"2026-11-01","lang":"en"}'), SCOPE).options.body).toBe('Both of you met every goal! ウェイ just finished all 4.');
  });

  it('an empty or unreadable push still shows a notification (a silent one is not allowed)', () => {
    for (const d of [null, data('garbage'), { text: () => { throw new Error('bad'); } }]) {
      const n = notificationFor(d, SCOPE);
      expect(n.title).toBe('しまの貯金箱');
      expect(n.options.body).toBeTruthy();
    }
  });
});

describe('the notification tap', () => {
  it('focuses an open window of the app', async () => {
    const focus = vi.fn(async () => {});
    const openWindow = vi.fn(async () => null);
    await openApp({ matchAll: async () => [{ url: 'https://x.example/other/', focus: vi.fn() }, { url: 'https://x.example/fitness/?x', focus }], openWindow }, SCOPE);
    expect(focus).toHaveBeenCalled();
    expect(openWindow).not.toHaveBeenCalled();
  });

  it('opens the app when none is open', async () => {
    const openWindow = vi.fn(async () => null);
    await openApp({ matchAll: async () => [], openWindow }, SCOPE);
    expect(openWindow).toHaveBeenCalledWith(SCOPE);
  });
});
