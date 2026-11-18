// The embed's protocol, read (player.svelte.ts): its URL, its messages, its state codes, its captions' info.
import { describe, expect, it, vi } from 'vitest';
import { YT_ORIGIN, captionsOf, embedUrl, readMessage, stateOf } from './player.svelte.ts';

describe('the embed', () => {
  it('youtube-nocookie, the JS API for our origin, inline, no controls', () => {
    const u = new URL(embedUrl('lm2MpPpkGL8', 'https://fitness.example'));
    expect(u.origin).toBe(YT_ORIGIN);
    expect(u.pathname).toBe('/embed/lm2MpPpkGL8');
    expect(Object.fromEntries(u.searchParams)).toMatchObject({ enablejsapi: '1', playsinline: '1', controls: '0', rel: '0', origin: 'https://fitness.example' });
  });
  it('reads its messages, nothing else', () => {
    expect(readMessage('{"event":"infoDelivery","info":{"currentTime":3.2}}')).toEqual({ event: 'infoDelivery', info: { currentTime: 3.2 } });
    for (const bad of [{ event: 'x' }, '{', '{"info":1}', null]) expect(readMessage(bad)).toBeNull();
  });
  it('its states', () => {
    expect([-1, 0, 1, 2, 3, 5, 9].map(stateOf)).toEqual(['ready', 'ended', 'playing', 'paused', 'buffering', 'ready', null]);
  });
});

describe('字幕 日本語: what the frame reports of its captions', () => {
  it('finds the tracklist and track wherever nested, as language codes; anything else is ignored', () => {
    expect(captionsOf({ currentTime: 3, availablePlaybackRates: [1] })).toBeNull();
    expect(captionsOf({ options: { captions: { tracklist: [{ languageCode: 'en', languageName: 'English' }, { languageCode: 'ja' }], track: { languageCode: 'en', translationLanguage: { languageCode: 'ja' } } } } }))
      .toEqual({ tracks: ['en', 'ja'], track: { lang: 'en' } });
    expect(captionsOf({ tracklist: [{ languageCode: 'ja' }, 7, null], track: {} })).toEqual({ tracks: ['ja'] });
    for (const bad of [null, 3, 'x', [], { track: 'ja' }]) expect(captionsOf(bad)).toBeNull();
  });
});

describe('the 100 ms check', () => {
  it('runs only while playing or buffering; a delivery while paused still moves the time', async () => {
    const { YtPlayer } = await import('./player.svelte.ts');
    vi.useFakeTimers();
    let onMsg: ((e: unknown) => void) | undefined;
    vi.stubGlobal('addEventListener', (_: string, f: (e: unknown) => void) => void (onMsg = f));
    vi.stubGlobal('removeEventListener', () => {});
    const win = { postMessage: () => {} };
    const frame = { contentWindow: win, addEventListener: () => {}, removeEventListener: () => {} } as unknown as HTMLIFrameElement;
    const p = new YtPlayer(frame);
    const say = (event: string, info: unknown) => onMsg!({ origin: YT_ORIGIN, source: win, data: JSON.stringify({ event, info }) });
    say('onReady', null);
    const greeted = vi.getTimerCount();
    say('onStateChange', 1);
    expect(vi.getTimerCount()).toBe(greeted + 1);
    say('onStateChange', 2);
    expect(vi.getTimerCount()).toBe(greeted);
    say('infoDelivery', { currentTime: 42.34 });
    expect(p.time).toBe(42.3);
    say('onStateChange', 3);
    expect(vi.getTimerCount()).toBe(greeted + 1);
    p.destroy();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});

describe('cue', () => {
  it('another video into the same frame: cueVideoById, its length and time start over, no new greeting', async () => {
    const { YtPlayer } = await import('./player.svelte.ts');
    vi.useFakeTimers();
    let onMsg: ((e: unknown) => void) | undefined;
    vi.stubGlobal('addEventListener', (_: string, f: (e: unknown) => void) => void (onMsg = f));
    vi.stubGlobal('removeEventListener', () => {});
    const sent: { event: string; func?: string; args?: unknown[] }[] = [];
    const win = { postMessage: (m: string) => void sent.push(JSON.parse(m)) };
    const frame = { contentWindow: win, addEventListener: () => {}, removeEventListener: () => {} } as unknown as HTMLIFrameElement;
    const p = new YtPlayer(frame);
    const say = (event: string, info: unknown) => onMsg!({ origin: YT_ORIGIN, source: win, data: JSON.stringify({ event, info }) });
    say('onReady', null);
    say('infoDelivery', { currentTime: 30, duration: 68, playerState: 2 });
    expect([p.time, p.duration]).toEqual([30, 68]);
    const greeted = vi.getTimerCount();
    sent.length = 0;
    p.cue('abc');
    expect(sent.map((m) => [m.func, m.args])).toEqual([['cueVideoById', ['abc', 0]]]);
    expect([p.time, p.duration]).toEqual([0, 0]);
    expect(vi.getTimerCount()).toBe(greeted);
    say('onStateChange', 5);
    expect(p.state).toBe('ready');
    p.destroy();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
});
