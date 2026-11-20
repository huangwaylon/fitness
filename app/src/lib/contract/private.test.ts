// Private values in free text (contract/private.ts): what a 共有リンク hides of the record's text (redactPrivate), the
// security review's bypasses included (full-width, spaced, zero-width, Japanese labels, refs in links), and what it
// keeps (ordinary trip text).
import { describe, expect, it } from 'vitest';
import { idLikeRuns, LOCK, redactPrivate } from './private.ts';

const hides = (s: string) => expect(redactPrivate(s), s).toContain(LOCK);
const keeps = (s: string) => expect(redactPrivate(s), s).toBe(s);

describe('redactPrivate', () => {
  it('hides booking references and PNRs, any case, labelled or not', () => {
    for (const s of ['予約 XK7Q2P', 'PNR QWERTY', 'booking ref: abc123', 'conf no. 12345', '予約番号：XK7Q2P', '確認番号 4F7K9Z', '予約コード ABCDE1', 'Expedia itinerary 7312345678901', 'ref k7q2px'])
      hides(s);
    expect(redactPrivate('Solaseed 予約番号：XK7Q2P です')).toBe('Solaseed 予約番号:🔒 です');
  });
  it('hides ticket, phone, card, passport and member numbers', () => {
    for (const s of ['e-ticket 2051234567890', '搭乗券 205-1234567890', 'call +81 90 1234 5678', '090-1234-5678', 'card 4111 1111 1111 1111', 'passport TR1234567', 'パスポート TK1234567', '会員番号 12345678', 'membership 88-1234'])
      hides(s);
  });
  it('hides e-mail addresses, "[at]" ones too, and every link (a ref in a path, a query, a fragment)', () => {
    for (const s of ['mail a.b@example.com', 'mail a.b [at] example [dot] com', 'https://booking.example/manage?pnr=XK7Q2P', 'www.example.com/r/abc', 'https://x.example/#ABCDEF'])
      hides(s);
    expect(redactPrivate('check in at https://x.example/c?r=1 by 9')).toBe('check in at 🔒 by 9');
  });
  it('hides passport names and names by their honorific', () => {
    for (const s of ['HUANG/WAYLON MR', 'traveller WAYLON HUANG', 'Mr Huang Waylon', 'Ms. Ume', '黄様', 'ウメ さま']) hides(s);
  });
  it('sees through full-width text, zero-width and soft-hyphen characters, spaces inside a code, kanji numerals', () => {
    for (const s of ['予約 ＸＫ７Ｑ２Ｐ', 'ref XK7​Q2P', 'ref XK­7Q2P', 'code AB C1 23', 'ticket 123 4567 8901 23', '電話 〇九〇一二三四五六七八', 'ｍａｉｌ　ａ＠ｅｘａｍｐｌｅ．ｃｏｍ'])
      hides(s);
  });
  it('hides a long token (base64, percent-escaped)', () => {
    hides('token dGhpcyBpcyBhIHNlY3JldA0');
    hides('q=%E4%BA%88%E7%B4%84XK7Q2P');
  });
  it('keeps ordinary trip text: places, times, dates, flight numbers, measures, small numbers', () => {
    for (const s of ['集合 8:00 那覇空港', 'NH 123 は 10:05 発', '2027-02-11 出発', '水 1000ml を2本', 'Power bank 20000mAh', 'テント #2', 'Day 3: tide pools', 'サンダル', '日焼け止め SPF50', 'Lunch at 12:30, ¥1,500'])
      keeps(s);
  });
  it('one lock for a run of them, and the text around kept', () => {
    expect(redactPrivate('XK7Q2P / 2051234567890')).toBe('🔒');
    expect(redactPrivate('flight XK7Q2P then bus')).toBe('flight 🔒 then bus');
  });
  it('what it leaves has no ID-like run (the guides’ check, idLikeRuns)', () => {
    for (const s of ['予約 XK7Q2P', 'e-ticket 2051234567890', 'a.b@example.com', 'PNR QWERTY', 'passport TR1234567']) expect(idLikeRuns(redactPrivate(s))).toEqual([]);
  });
});

describe('idLikeRuns (the guides’ check)', () => {
  it('catches a booking reference, a ticket and passport number, a PNR, an e-mail; not a name, a flight, a date, a link or a {p:}', () => {
    for (const s of ['予約 XK7Q2P', 'e-ticket 2051234567890', 'passport TR1234567', 'mail me at a.b@example.com', 'PNR QWERTY']) expect(idLikeRuns(s)).not.toEqual([]);
    for (const s of ['{p:flightRef}', 'DIVENUTS 瀬底', 'NH 123', '2027-02-11', 'https://example.com/ABC123XYZ']) expect(idLikeRuns(s)).toEqual([]);
  });
});
