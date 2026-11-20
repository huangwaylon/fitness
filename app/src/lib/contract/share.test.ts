// 共有リンク's contract (contract/share.ts): the token's shape and its randomness's source, the presets and the year's
// ceiling, the registry (a trip's refs, no reads, a whitelisted, capped snapshot), the device classes, the bot list,
// the states and the page's reading of `POST /share`'s replies.
import { describe, expect, it, vi } from 'vitest';
import {
  devOf, isBotUa, isShareRef, isShareToken, newShareId, newShareToken, readReplyOf, SHARE_DEFAULT_DAYS, SHARE_KINDS, SHARE_PRESETS,
  SHARE_SNAPSHOT_MAX, SHARE_TRIP_REFS, shareEnded, shareExp, shareLabel, shareSnapshot, shareState, tokenFromHash
} from './share.ts';

const NOW = Date.parse('2026-11-20T03:00:00.000Z');

describe('the token and the id', () => {
  it('16 bytes of crypto.getRandomValues as base64url: 22 characters of the URL-safe alphabet', () => {
    const spy = vi.spyOn(crypto, 'getRandomValues');
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const t = newShareToken();
      expect(t).toMatch(/^[A-Za-z0-9_-]{22}$/);
      expect(isShareToken(t)).toBe(true);
      seen.add(t);
    }
    expect(seen.size).toBe(200);
    expect(spy).toHaveBeenCalled();
    expect((spy.mock.calls[0][0] as Uint8Array).length).toBe(16);
    spy.mockRestore();
  });
  it('the bytes are the token (no derivation): all ones is ____…, all zeros AAAA…', () => {
    expect(newShareToken((b) => b.fill(255))).toBe('_'.repeat(21) + 'w');
    expect(newShareToken((b) => b.fill(0))).toBe('A'.repeat(22));
    expect(newShareToken((b) => b.fill(0xfb))).toMatch(/-/);
  });
  it('the id is 8 random bytes as hex', () => {
    expect(newShareId()).toMatch(/^[0-9a-f]{16}$/);
    expect(newShareId((b) => b.fill(1))).toBe('01'.repeat(8));
  });
  it('a token is exactly 22 of the alphabet; the fragment carries one or nothing', () => {
    for (const bad of ['', 'a'.repeat(21), 'a'.repeat(23), `${'a'.repeat(21)}=`, `${'a'.repeat(21)}+`, 42, null]) expect(isShareToken(bad)).toBe(false);
    const t = newShareToken();
    expect(tokenFromHash(`#${t}`)).toBe(t);
    expect(tokenFromHash('#key=abc')).toBeNull();
    expect(tokenFromHash('')).toBeNull();
  });
});

describe('the lifecycle', () => {
  it('presets 1週間 · 1か月 · 3か月 · 1年, a year the default and the most', () => {
    expect(SHARE_PRESETS).toEqual([7, 30, 90, 365]);
    expect(SHARE_DEFAULT_DAYS).toBe(365);
    expect(shareExp(NOW, 7)).toBe('2026-11-27T03:00:00.000Z');
    expect(shareExp(NOW, 365)).toBe('2027-11-20T03:00:00.000Z');
    expect(Math.max(...SHARE_PRESETS.map((d) => Date.parse(shareExp(NOW, d)) - NOW))).toBe(365 * 86_400_000);
  });
  it('states: off over expired over live; ended at the off or the expiry', () => {
    const exp = shareExp(NOW, 7);
    expect(shareState({ exp, off: null }, NOW)).toBe('live');
    expect(shareState({ exp, off: null }, Date.parse(exp))).toBe('expired');
    expect(shareState({ exp, off: '2026-11-21T00:00:00.000Z' }, NOW)).toBe('off');
    expect(shareEnded({ exp, off: null }, NOW)).toBeNull();
    expect(shareEnded({ exp, off: null }, Date.parse(exp) + 1)).toBe(exp);
    expect(shareEnded({ exp, off: 'x' }, NOW)).toBe('x');
  });
  it('a label: trimmed, no control characters, ≤ 40 characters (by code point)', () => {
    expect(shareLabel('  両親へ ')).toBe('両親へ');
    expect(shareLabel('a\u0000b‮c')).toBe('a b c');
    expect([...shareLabel('🌺'.repeat(50))].length).toBe(40);
    expect(shareLabel(3)).toBe('');
  });
});

describe('the registry', () => {
  it('a trip names one of the trips, reads nothing of the record, and its snapshot is empty', () => {
    expect(SHARE_KINDS.trip.refs).toBe(SHARE_TRIP_REFS);
    expect(SHARE_KINDS.trip.reads).toEqual([]);
    expect(shareSnapshot('trip')).toEqual({});
    expect(isShareRef('trip', 'okinawa')).toBe(true);
    expect(isShareRef('trip', 'hawaii')).toBe(false);
    expect(isShareRef('trip', 'toString')).toBe(false);
  });
  it('a snapshot keeps only its fields, and none past the size cap', () => {
    const def = SHARE_KINDS.trip as unknown as { fields: string[]; snapshot: () => Record<string, unknown> };
    const was = { fields: def.fields, snapshot: def.snapshot };
    try {
      Object.assign(def, { fields: ['title'], snapshot: () => ({ title: 'x', note: 'secret' }) });
      expect(shareSnapshot('trip')).toEqual({ title: 'x' });
      Object.assign(def, { snapshot: () => ({ title: 'x'.repeat(SHARE_SNAPSHOT_MAX) }) });
      expect(shareSnapshot('trip')).toBeNull();
    } finally {
      Object.assign(def, was);
    }
  });
});

describe('the visitor', () => {
  it('a device class from the User-Agent', () => {
    expect(devOf('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15')).toBe('iphone');
    expect(devOf('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('ipad');
    expect(devOf('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120')).toBe('android');
    expect(devOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605')).toBe('mac');
    expect(devOf('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120')).toBe('windows');
    expect(devOf('curl/8')).toBe('other');
  });
  it('bots: the previewers and crawlers, and no User-Agent at all', () => {
    for (const ua of ['facebookexternalhit/1.1', 'Slackbot-LinkExpanding 1.0', 'Twitterbot/1.0', 'Discordbot/2.0', 'WhatsApp/2.23', 'TelegramBot (like TwitterBot)', 'LinkedInBot/1.0', 'Applebot/0.1', 'Mozilla/5.0 Line/13.0', 'Googlebot/2.1', 'bingpreview', '']) expect(isBotUa(ua)).toBe(true);
    expect(isBotUa('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1')).toBe(false);
  });
});

describe('POST /share replies', () => {
  it('ok with a known kind and ref; gone off / expired; busy; anything else null', () => {
    expect(readReplyOf({ ok: true, kind: 'trip', ref: 'nz', exp: 'e', data: {} })).toEqual({ ok: true, kind: 'trip', ref: 'nz', exp: 'e', data: {} });
    expect(readReplyOf({ ok: true, kind: 'trip', ref: 'mars', exp: 'e', data: {} })).toBeNull();
    expect(readReplyOf({ ok: true, kind: 'board', ref: 'nz', exp: 'e', data: {} })).toBeNull();
    expect(readReplyOf({ ok: false, error: 'gone', why: 'off' })).toEqual({ ok: false, error: 'gone', why: 'off' });
    expect(readReplyOf({ ok: false, error: 'gone', why: 'expired', exp: 'e' })).toEqual({ ok: false, error: 'gone', why: 'expired', exp: 'e' });
    expect(readReplyOf({ ok: false, error: 'busy' })).toEqual({ ok: false, error: 'busy' });
    expect(readReplyOf({ ok: false, error: 'gone', why: 'unknown' })).toBeNull();
    expect(readReplyOf('nope')).toBeNull();
  });
});
