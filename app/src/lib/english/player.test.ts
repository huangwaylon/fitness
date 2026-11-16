// The embed's protocol, read (player.svelte.ts): its URL, its messages, its state codes, its captions' info.
import { describe, expect, it } from 'vitest';
import { YT_ORIGIN, captionsOf, embedUrl, jaOutcome, readMessage, stateOf } from './player.svelte.ts';

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
  it('finds the tracklist, track and translationLanguages wherever nested, as language codes; anything else is ignored', () => {
    expect(captionsOf({ currentTime: 3, availablePlaybackRates: [1] })).toBeNull();
    expect(captionsOf({ options: { captions: { tracklist: [{ languageCode: 'en', languageName: 'English' }, { languageCode: 'ja' }], track: { languageCode: 'en', translationLanguage: { languageCode: 'ja' } } } } }))
      .toEqual({ tracks: ['en', 'ja'], track: { lang: 'en', tr: 'ja' } });
    expect(captionsOf({ translationLanguages: [{ languageCode: 'ja' }, 7, null], track: {} })).toEqual({ trLangs: ['ja'] });
    for (const bad of [null, 3, 'x', [], { track: 'ja' }]) expect(captionsOf(bad)).toBeNull();
  });
  it('how it went: a Japanese track, the translation, offered, none, or nothing reported', () => {
    expect(jaOutcome({ track: { lang: 'ja' } })).toBe('track');
    expect(jaOutcome({ track: { lang: 'en', tr: 'ja' } })).toBe('tr');
    expect(jaOutcome({ track: { lang: 'en' }, trLangs: ['fr', 'ja'] })).toBe('offer');
    expect(jaOutcome({ tracks: ['en'] })).toBe('none');
    expect(jaOutcome(null)).toBe('silent');
  });
});
