// The old /push/* routes (Web Push goal notifications, removed 2026-11-02): an app build from before still POSTs
// /push/subscribe, /push/unsubscribe or /push/goal until its phone updates. Each gets 410 Gone (readable by the page:
// CORS for an allowed origin), so it fails quietly and never retries in a loop; nothing is read or kept.
import { originAllowed } from './auth.ts';

export const isOldPushPath = (path: string): boolean => path === '/push' || path.startsWith('/push/');

export function pushGone(req: Request, allowed: string): Response {
  const origin = req.headers.get('Origin');
  const cors: Record<string, string> = originAllowed(origin, allowed) ? { 'Access-Control-Allow-Origin': origin!, Vary: 'Origin' } : {};
  const headers = { ...cors, 'Cache-Control': 'no-store' };
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' } });
  }
  return Response.json({ ok: false, error: 'gone' }, { status: 410, headers });
}
