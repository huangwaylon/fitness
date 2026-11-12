// LINE's Messaging API: alerts pushed to the group (they count toward the free plan's 200 a month, once per member),
// free replies to taps, members' names, and the webhook's signature check.
import { MENU } from './messages.ts';

const API = 'https://api.line.me/v2/bot';
/** LINE's limit per text message, in UTF-16 code units (an emoji counts 2: a JS string's length). */
export const MAX_TEXT = 5000;
/** Per push or reply. */
export const MAX_MESSAGES = 5;
const TIMEOUT_MS = 30_000;
/** The reply waits for the name, and reply tokens expire. */
const NAME_TIMEOUT_MS = 5_000;

export class LineError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'LineError';
    this.status = status;
  }
}

interface TextMessage {
  type: 'text';
  text: string;
  quickReply?: object;
}

/** The ⚙️ メニュー chip under a message (it disappears once anything else is posted). */
export function menuQuickReply(): object {
  return { items: [{ type: 'action', action: { type: 'postback', label: MENU, data: 'a=menu' } }] };
}

/** Join lines into as few texts as possible, each within the length limit. */
export function chunkLines(lines: string[], limit = MAX_TEXT): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const line of lines) {
    if (current && current.length + 1 + line.length > limit) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Text messages (split to fit), the last one with the ⚙️ メニュー chip. */
export function texts(text: string | string[]): TextMessage[] {
  const out: TextMessage[] = chunkLines(typeof text === 'string' ? [text] : text)
    .slice(0, MAX_MESSAGES)
    .map((c) => ({ type: 'text', text: c }));
  if (out.length) out[out.length - 1].quickReply = menuQuickReply();
  return out;
}

/** The API client, with the channel's token. */
export class Line {
  private readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  /** Send to the group (counts toward the quota). Retrying with the same `retryKey` (a UUID) never sends it twice. */
  async push(to: string, lines: string[], retryKey?: string): Promise<void> {
    if (!to) throw new LineError("LINE_GROUP_ID isn't set");
    await this.call('POST', '/message/push', { to, messages: texts(lines) }, TIMEOUT_MS, retryKey);
  }

  /** Answer an event (free). A reply token works once, for about a minute. */
  async reply(replyToken: string, messages: object[]): Promise<void> {
    await this.call('POST', '/message/reply', { replyToken, messages });
  }

  /** The member's display name, or '' if it can't be looked up. */
  async memberName(groupId: string, userId: string): Promise<string> {
    if (!userId) return '';
    try {
      const profile = await this.call('GET', `/group/${groupId}/member/${userId}`, undefined, NAME_TIMEOUT_MS);
      return typeof profile.displayName === 'string' ? profile.displayName : '';
    } catch (e) {
      console.warn(`could not look up a LINE member's name: ${e}`);
      return '';
    }
  }

  private async call(
    method: string, path: string, body?: object, timeoutMs = TIMEOUT_MS, retryKey?: string,
  ): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = { Authorization: `Bearer ${this.token}` };
    if (body) headers['Content-Type'] = 'application/json';
    if (retryKey) headers['X-Line-Retry-Key'] = retryKey;
    const resp = await fetch(API + path, {
      method, headers, body: body && JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs),
    });
    if (retryKey && resp.status === 409) { // an earlier try with this key was already accepted
      console.log(`${method} ${path} was already accepted (retry key ${retryKey})`);
      return {};
    }
    if (!resp.ok) { // 429 on a push = the month's quota is used up
      throw new LineError(`${method} ${path} failed: ${resp.status} ${await resp.text()}`, resp.status);
    }
    const text = await resp.text();
    return (text && JSON.parse(text)) || {};
  }
}

/** Whether `signature` (the X-Line-Signature header) is the base64 HMAC-SHA256 of `body` with the channel secret. */
export async function signatureOk(secret: string, body: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(body)));
  const expected = enc.encode(btoa(String.fromCharCode(...mac)));
  const given = enc.encode(signature);
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ given[i];
  return diff === 0;
}
