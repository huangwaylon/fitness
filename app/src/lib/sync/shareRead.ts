// The visitor's read of a 共有リンク (docs/travel.md "Sharing"): `POST <relay>/share` with the token as text/plain JSON
// (a simple request: no preflight; the token never in a URL), and `self` when this phone is paired (ours: not counted
// as a visit). No key is ever sent. Never throws: the reply (contract/share.ts readReplyOf) or `offline`.
import { readReplyOf, type ShareReadReply } from '#lib/contract/share.ts';
import { relayUrl } from './transport.ts';

const TIMEOUT_MS = 15_000;

export type ShareRead = ShareReadReply | { ok: false; error: 'offline' };

export async function shareRead(token: string, self: boolean, fetcher: typeof fetch = (...a) => fetch(...a), url = relayUrl('/share')): Promise<ShareRead> {
  if (!url) return { ok: false, error: 'offline' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetcher(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(self ? { t: token, self: true } : { t: token }),
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: ctrl.signal
    });
    if (res.status === 429) return { ok: false, error: 'busy' };
    const r = readReplyOf(await res.json().catch(() => null));
    // (an answer that isn't ours: an error page on the way, a relay down) the page offers もう一度, as offline
    return r ?? { ok: false, error: 'offline' };
  } catch {
    return { ok: false, error: 'offline' };
  } finally {
    clearTimeout(timer);
  }
}
