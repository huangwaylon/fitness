// Tests for the LINE client and the webhook's signature check, with fetch mocked.
import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Line, LineError, MAX_MESSAGES, MAX_TEXT, chunkLines, menuQuickReply, signatureOk, texts } from '../src/line.ts';
import { GROUP } from './fakeBot.ts';

const API = 'https://api.line.me/v2/bot';

/** fetch answering every request with `status` and `body`. */
function answering(status = 200, body = '{}') {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) => new Response(body, { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

const sent = (fetch: ReturnType<typeof answering>) => JSON.parse(fetch.mock.calls.at(-1)![1]!.body as string);
const headers = (fetch: ReturnType<typeof answering>) => fetch.mock.calls.at(-1)![1]!.headers as Record<string, string>;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the API', () => {
  const line = new Line('tok');

  it('pushes text to the group with the menu chip', async () => {
    const fetch = answering();
    await line.push(GROUP, ['🟢 空きが出ました！', '・12:00〜12:30']);
    expect(fetch.mock.calls[0][0]).toBe(`${API}/message/push`);
    expect(fetch.mock.calls[0][1]!.method).toBe('POST');
    expect(headers(fetch).Authorization).toBe('Bearer tok');
    expect(headers(fetch)['X-Line-Retry-Key']).toBeUndefined();
    const body = sent(fetch);
    expect(body.to).toBe(GROUP);
    expect(body.messages).toEqual([
      { type: 'text', text: '🟢 空きが出ました！\n・12:00〜12:30', quickReply: menuQuickReply() },
    ]);
  });

  it('splits long alerts within LINE limits', async () => {
    const fetch = answering();
    await line.push(GROUP, Array(7).fill('x'.repeat(4000)));
    const messages = sent(fetch).messages;
    expect(messages).toHaveLength(MAX_MESSAGES);
    expect(messages.every((m: { text: string }) => m.text.length <= MAX_TEXT)).toBe(true);
    expect(messages.map((m: object) => 'quickReply' in m)).toEqual([false, false, false, false, true]);
  });

  it('sends a retried push with its key, and a duplicate counts as sent', async () => {
    const fetch = answering();
    await line.push(GROUP, ['hi'], '123e4567-e89b-12d3-a456-426614174000');
    expect(headers(fetch)['X-Line-Retry-Key']).toBe('123e4567-e89b-12d3-a456-426614174000');
    answering(409, '{"message":"The retry key is already accepted"}');
    await line.push(GROUP, ['hi'], 'k');
    answering(409);
    await expect(line.push(GROUP, ['hi'])).rejects.toThrow(/409/); // without a key, a 409 is a real error
  });

  it('raises on errors, with the status', async () => {
    answering(429, '{"message":"You have reached your monthly limit."}');
    const error = await line.push(GROUP, ['hi']).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LineError);
    expect((error as LineError).message).toMatch(/429/);
    expect((error as LineError).status).toBe(429);
  });

  it("doesn't push without a group", async () => {
    const fetch = answering();
    await expect(line.push('', ['hi'])).rejects.toThrow(/LINE_GROUP_ID/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('replies', async () => {
    const fetch = answering();
    await line.reply('rt', texts('hi'));
    expect(fetch.mock.calls[0][0]).toBe(`${API}/message/reply`);
    expect(sent(fetch).replyToken).toBe('rt');
    expect(sent(fetch).messages[0].text).toBe('hi');
  });

  it("falls back to no name when the lookup fails", async () => {
    let fetch = answering(200, '{"displayName": "Bob"}');
    expect(await line.memberName(GROUP, 'U1')).toBe('Bob');
    expect(fetch.mock.calls[0][0]).toBe(`${API}/group/${GROUP}/member/U1`);
    answering(404);
    expect(await line.memberName(GROUP, 'U1')).toBe('');
    answering(200, '{}');
    expect(await line.memberName(GROUP, 'U1')).toBe('');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('timed out', 'TimeoutError'); }));
    expect(await line.memberName(GROUP, 'U1')).toBe('');
    fetch = answering();
    expect(await line.memberName(GROUP, '')).toBe(''); // an event without a user
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('texts', () => {
  it('splits lines into chunks', () => {
    expect(texts('')).toEqual([]);
    expect(chunkLines(['a', 'b'], 10)).toEqual(['a\nb']);
    expect(chunkLines(['aaaa', 'bbbb', 'cc'], 9)).toEqual(['aaaa\nbbbb', 'cc']);
  });

  it('counts emoji as LINE does (UTF-16 units: 💪 is 2)', () => {
    expect(chunkLines(['💪💪', 'a'], 5)).toEqual(['💪💪', 'a']);
    expect(chunkLines(['💪', 'a'], 4)).toEqual(['💪\na']);
  });
});

describe('signatureOk', () => {
  const signed = (body: string) => createHmac('sha256', 'secret').update(body).digest('base64');
  const body = '{"events": [{"type": "join", "message": "メニュー"}]}';

  it('accepts the signature of the body', async () => {
    expect(await signatureOk('secret', body, signed(body))).toBe(true);
  });

  it('refuses a wrong, missing or other-secret signature', async () => {
    expect(await signatureOk('secret', body, signed('other'))).toBe(false);
    expect(await signatureOk('secret', body, '')).toBe(false);
    expect(await signatureOk('secret', body, null)).toBe(false);
    expect(await signatureOk('other', body, signed(body))).toBe(false);
  });
});
