// 共有リンク's contract (contract/share.ts): the token's shape and its randomness's source, the presets and the year's
// ceiling, the registry (a trip's refs, no reads, a whitelisted, capped snapshot), the device classes, the bot list,
// the states and the page's reading of `POST /share`'s replies.
import { describe, expect, it, vi } from 'vitest';
import {
  devOf, isBotUa, isShareRef, isShareToken, newShareId, newShareToken, readReplyOf, SHARE_DEFAULT_DAYS, SHARE_KINDS, SHARE_PRESETS,
  SHARE_TRIP_REFS, shareEnded, shareExp, shareLabel, shareSnapshot, shareState, tokenFromHash, sharedPackList, sharedTrips, sharedTripsOf,
  SHARE_MAKE_KINDS, SHARE_PRIVATE_NOTE_KEYS, type ShareSource
} from './share.ts';
import { PackBook, packRowOf } from './pack.ts';
import type { Who } from '../types.ts';

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
      Object.assign(def, { snapshot: () => ({ title: "x".repeat(SHARE_KINDS.trip.max) }) });
      expect(shareSnapshot('trip')).toBeNull();
    } finally {
      Object.assign(def, was);
    }
  });
});

describe('the trips kind (the whole trips page)', () => {
  /** A record's packing rows: [type, who, data] each, by trip. */
  const T = 1.79e12;
  const bookOf = (rows: [string, Who, Record<string, unknown>][]) => {
    const b = new PackBook();
    for (const [type, who, d] of rows) {
      const r = packRowOf(type, d, who);
      if (!r) throw new Error(`bad row ${JSON.stringify(d)}`);
      b.put(r);
    }
    return b;
  };
  const NZ: [string, Who, Record<string, unknown>][] = [
    ['pack', 'A', { trip: 'nz', id: '_cat1abc', at: T + 1, kind: 'cat', ord: 9, name: { ja: '買うもの' }, icon: 'cart', by: 'A' }],
    ['pack', 'B', { trip: 'nz', id: '_itm1abc', at: T + 2, kind: 'item', cat: '_cat1abc', ord: 0, name: { ja: '日焼け止め' }, note: { ja: 'SPF50' }, by: 'B' }],
    ['pack', 'A', { trip: 'nz', id: '_itm2abc', at: T + 3, kind: 'item', cat: '_cat1abc', ord: 1, name: { en: 'Print ticket 2051234567890' }, by: 'A' }],
    ['pack', 'A', { trip: 'nz', id: 'docs-passport', at: T + 4, rm: true }],
    // the guest's own item, and the guest's item a member renamed: shared as anyone's (2026-11-24)
    ['pack', 'G', { trip: 'nz', id: '_gst1abc', at: T + 5, kind: 'item', cat: '_cat1abc', ord: 2, name: { ja: 'ゲストの物' }, by: 'G' }],
    ['pack', 'A', { trip: 'nz', id: '_gst2abc', at: T + 6, kind: 'item', cat: '_cat1abc', ord: 3, name: { ja: 'ゲストの物2' }, by: 'G' }],
    ['pack_chk', 'A', { trip: 'nz', id: '_itm1abc', at: T + 7, v: 1 }],
    ['pack_chk', 'G', { trip: 'nz', id: '_itm1abc', at: T + 8, v: 1 }],
    ['pack_reset', 'B', { trip: 'nz', at: T + 9 }],
    ['trip_note', 'A', {
      trip: 'nz', at: T + 10, v: {
        flightRef: 'XK7Q2P', expediaRef: '7312345678901', traveller1: 'HUANG/WAYLON MR', traveller2: 'Ume Example',
        meet: '集合 8:00 オークランド空港', memo: 'Hotel 予約番号：4F7K9Z, call +64 9 123 4567', contactEmail: 'a@example.com', homeUrl: 'https://x.example',
        later: 'mail me at a.b@example.com', plain: 'Taupō は天気次第'
      }
    }]
  ];
  const src = (books: Partial<Record<string, PackBook>>, seen: string[] = []): ShareSource => ({
    pack: (trip) => {
      seen.push(trip);
      return books[trip] ?? new PackBook();
    }
  });

  it('names the whole page (ref all), reads only the packing rows and notes, keeps only `trips`; members make only it', () => {
    expect(SHARE_KINDS.trips.refs).toEqual(['all']);
    expect(SHARE_KINDS.trips.reads).toEqual(['pack', 'trip_note']);
    expect(SHARE_KINDS.trips.fields).toEqual(['trips']);
    expect(isShareRef('trips', 'all')).toBe(true);
    expect(isShareRef('trips', 'nz')).toBe(false);
    expect(SHARE_MAKE_KINDS).toEqual(['trips']);
    const seen: string[] = [];
    expect(Object.keys(shareSnapshot('trips', src({}, seen))!)).toEqual(['trips']);
    expect(seen).toEqual([...SHARE_TRIP_REFS]);
  });
  it('a `trip` link reads nothing, with a source or without; `trips` without one is never built', () => {
    const seen: string[] = [];
    expect(shareSnapshot('trip', src({ nz: bookOf(NZ) }, seen))).toEqual({});
    expect(seen).toEqual([]);
    expect(() => shareSnapshot('trips')).toThrow();
  });
  it('packing: everyone’s ops field by field, names and notes redacted; ticks, resets, `by` and times never', () => {
    const out = sharedTrips(src({ nz: bookOf(NZ) }));
    expect(Object.keys(out)).toEqual(['nz']);
    expect(out.nz!.pack).toEqual([
      { id: '_cat1abc', kind: 'cat', ord: 9, name: { ja: '買うもの' }, icon: 'cart' },
      { id: '_itm1abc', kind: 'item', cat: '_cat1abc', ord: 0, name: { ja: '日焼け止め' }, note: { ja: 'SPF50' } },
      { id: '_itm2abc', kind: 'item', cat: '_cat1abc', ord: 1, name: { en: 'Print ticket 🔒' } },
      { id: 'docs-passport', rm: true },
      { id: '_gst1abc', kind: 'item', cat: '_cat1abc', ord: 2, name: { ja: 'ゲストの物' } },
      { id: '_gst2abc', kind: 'item', cat: '_cat1abc', ord: 3, name: { ja: 'ゲストの物2' } }
    ]);
    const json = JSON.stringify(out);
    for (const s of ['"by"', '"at"', 'ticks', '2051234567890', 'pack_chk', 'pack_reset']) expect(json).not.toContain(s);
  });
  it('notes: the guides’ private keys never, a private-sounding key never, the rest redacted (booking refs, phone, e-mail → 🔒), plain text kept', () => {
    expect(SHARE_PRIVATE_NOTE_KEYS.nz).toEqual(['flightRef', 'expediaRef', 'traveller1', 'traveller2']);
    const notes = sharedTrips(src({ nz: bookOf(NZ) })).nz!.notes;
    expect(notes).toEqual(['mail me at 🔒', '集合 8:00 オークランド空港', 'Hotel 予約番号:🔒, call 🔒', 'Taupō は天気次第']);
    const json = JSON.stringify(notes);
    for (const s of ['XK7Q2P', '7312345678901', 'HUANG', 'Ume Example', '4F7K9Z', '123 4567', 'example.com', 'x.example']) expect(json).not.toContain(s);
  });
  it('fails closed: a text still ID-like after the redaction is withheld, a note of only locks dropped', () => {
    const b = bookOf([['trip_note', 'A', { trip: 'zao', at: T + 1, v: { memo: 'XK7Q2P', other: 'ok' } }]]);
    expect(sharedTrips(src({ zao: b })).zao!.notes).toEqual(['ok']);
  });
  it('the page reads it back checked (junk dropped) and lays the ops over the bundle’s seed', () => {
    const data = JSON.parse(JSON.stringify({ trips: sharedTrips(src({ nz: bookOf(NZ) })) })) as Record<string, unknown>;
    (data.trips as Record<string, unknown>).hawaii = { pack: [], notes: ['x'] };
    ((data.trips as Record<string, { pack: unknown[] }>).nz.pack).push({ id: 'BAD ID', kind: 'cat' }, { id: '_x1abcde', kind: 'item', cat: '_cat1abc', ord: 0, name: { ja: 'x' }, by: 'G', at: T + 5 });
    const back = sharedTripsOf(data);
    expect(Object.keys(back)).toEqual(['nz']);
    expect(back.nz!.pack).toHaveLength(6);
    const seed = { cats: [{ id: 'docs', name: { ja: '書類' }, icon: 'file', items: [{ id: 'docs-passport', text: { ja: 'パスポート' } }, { id: 'docs-esim', text: { ja: 'eSIM' } }] }] };
    const list = sharedPackList('nz', seed, back.nz);
    expect(list.map((c) => [c.id, c.items.map((i) => i.id)])).toEqual([['docs', ['docs-esim']], ['_cat1abc', ['_itm1abc', '_itm2abc', '_gst1abc', '_gst2abc']]]);
    expect(list.flatMap((c) => c.items).every((i) => i.ticks.length === 0)).toBe(true);
    expect(sharedTripsOf(null)).toEqual({});
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
