import type { RequestHandler } from '@sveltejs/kit';
import { getDb } from '#lib/server/db/index.ts';
import { SESSION_COOKIE, redeemPairingCode } from '#lib/server/auth.ts';
import { sessionCookieOptions } from '#lib/server/guard.ts';
import { errorJson, handle, json, readJson } from '#lib/server/http.ts';
import { schemas } from '#lib/server/actions.ts';
import { corsOrigin } from '#lib/server/cors.ts';

export const POST: RequestHandler = handle(async ({ request, cookies }) => {
  const body = await readJson(request, schemas.pair);
  const label = body.label ?? (request.headers.get('user-agent')?.includes('iPhone') ? 'iPhone' : 'browser');
  const res = redeemPairingCode(getDb(), body.code, label);
  if (!res) return errorJson(401, 'invalid_code');
  cookies.set(SESSION_COOKIE, res.secret, sessionCookieOptions);
  // Cross-origin UI (GitHub Pages): the cookie won't travel, so hand the session over as a bearer token.
  const crossOrigin = corsOrigin(request, '/api/pair') !== null;
  return json({ ok: true, person: res.person, ...(crossOrigin ? { token: res.secret } : {}) });
});
