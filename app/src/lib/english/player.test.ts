// The embed's protocol, read (player.svelte.ts): its URL, its messages, its state codes.
import { describe, expect, it } from 'vitest';
import { YT_ORIGIN, embedUrl, readMessage, stateOf } from './player.svelte.ts';

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
