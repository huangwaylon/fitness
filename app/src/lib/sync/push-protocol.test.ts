import { describe, expect, it } from 'vitest';
import { parseGoal, parsePushMsg, parseSubscribe, parseUnsubscribe, pushEndpointOk, pushNotice } from './push-protocol.ts';

const KEY = 'ab'.repeat(16);
const P256DH = 'B'.repeat(87);
const AUTH = 'A'.repeat(22);

describe('push protocol', () => {
  it('takes endpoints on the known push services only, over https', () => {
    for (const ok of ['https://web.push.apple.com/QGx', 'https://fcm.googleapis.com/fcm/send/x:y', 'https://updates.push.services.mozilla.com/wpush/v2/x', 'https://wns2-par02p.notify.windows.com/w/?token=x']) {
      expect(pushEndpointOk(ok)).toBe(true);
    }
    for (const bad of ['http://web.push.apple.com/x', 'https://web.push.apple.com.evil.example/x', 'https://evil.example/web.push.apple.com', 'https://u:p@web.push.apple.com/x', 'https://web.push.apple.com:8443/x', 'not a url', 'https://web.push.apple.com/' + 'x'.repeat(1100)]) {
      expect(pushEndpointOk(bad)).toBe(false);
    }
  });

  it('parses a subscribe as the browser serialises it, and drops anything extra', () => {
    const raw = JSON.stringify({ key: KEY, lang: 'en', extra: 1, sub: { endpoint: 'https://web.push.apple.com/Q', expirationTime: null, keys: { p256dh: P256DH, auth: AUTH, more: 'x' } } });
    expect(parseSubscribe(raw)).toEqual({ key: KEY, lang: 'en', sub: { endpoint: 'https://web.push.apple.com/Q', p256dh: P256DH, auth: AUTH } });
    expect(parseSubscribe(raw.replace(KEY, 'zz'))).toBeNull();
    expect(parseSubscribe(JSON.stringify({ key: KEY, lang: 'ja', sub: { endpoint: 'https://web.push.apple.com/Q', keys: { p256dh: 'short', auth: AUTH } } }))).toBeNull();
    expect(parseSubscribe('x'.repeat(3000))).toBeNull();
  });

  it('parses an unsubscribe and a goal', () => {
    expect(parseUnsubscribe(JSON.stringify({ key: KEY, endpoint: 'https://web.push.apple.com/Q' }))).toEqual({ key: KEY, endpoint: 'https://web.push.apple.com/Q' });
    expect(parseGoal(JSON.stringify({ key: KEY, date: '2026-11-01', both: false, name: 'うめ' }))).toEqual({ key: KEY, date: '2026-11-01', both: false, name: 'うめ' });
    expect(parseGoal(JSON.stringify({ key: KEY, date: '2026-11-01', both: 'no', name: 'うめ' }))).toBeNull();
    expect(parseGoal(JSON.stringify({ key: KEY, date: '2026-11-01', both: false, name: 'あ'.repeat(21) }))).toBeNull();
  });

  it('words the notification in the phone’s language, one tag per day', () => {
    const m = parsePushMsg('{"v":1,"kind":"goal","name":"うめ","date":"2026-11-01","lang":"ja"}')!;
    expect(pushNotice(m)).toEqual({ title: 'しまの貯金箱', body: 'うめが きょうの もくひょうを 4つ ぜんぶ たっせい！', tag: 'island-goal-2026-11-01', lang: 'ja' });
    expect(pushNotice({ ...m, kind: 'both', name: 'ウェイ' }).body).toBe('ふたりで ぜんぶ たっせい！ ウェイも 4つ クリアしたよ');
    expect(pushNotice({ ...m, lang: 'en' }).body).toBe('うめ met all 4 goals today!');
    expect(parsePushMsg({ v: 1, kind: 'goal', name: 'うめ', date: '2026-11-01' })?.lang).toBe('ja');
    expect(parsePushMsg('{"v":2,"kind":"goal","name":"x","date":"2026-11-01"}')).toBeNull();
    expect(parsePushMsg('nope')).toBeNull();
  });
});
