// 共有リンク's relay as a spec stands it in (tests only): `POST <relay>/share` answered by a function of its body (the
// relay's own replies: contract/share.ts ShareReadReply, or a status), each read kept (its body, its headers), never
// fetched. share-page.spec (the visitor's page); a spec of the owner's list can answer it from its own state.
import type { BrowserContext, Page } from './fixtures.ts';
import { RELAY } from './relay.ts';

export type ShareAnswer = Record<string, unknown> | { status: number; body?: unknown } | 'abort';
export type ShareSeen = { body: Record<string, unknown>; headers: Record<string, string> };

/** Routes `/share` on `on` (a page or a whole context): `answer(body)` says what to reply. The reads seen, in order. */
export async function routeShare(on: Page | BrowserContext, answer: (body: Record<string, unknown>) => ShareAnswer): Promise<ShareSeen[]> {
  const seen: ShareSeen[] = [];
  await on.route(`${RELAY}/share`, async (route) => {
    const req = route.request();
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(req.postData() ?? '{}') as Record<string, unknown>;
    } catch {
      /* not JSON: the answer's to judge */
    }
    seen.push({ body, headers: req.headers() });
    const a = answer(body);
    if (a === 'abort') return route.abort('internetdisconnected');
    const status = 'status' in a && typeof a.status === 'number' ? a.status : 200;
    const json = 'status' in a && typeof a.status === 'number' ? (a.body ?? {}) : a;
    return route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' }, body: JSON.stringify(json) });
  });
  return seen;
}

/** A link's token (any 22 of base64url: the relay's are random). */
export const TOKEN = 'Abc_def-GHIjklMNOpqrST';
