import type { RequestHandler } from '@sveltejs/kit';
import { errorJson, handle, json } from '#lib/server/http.ts';

export const GET: RequestHandler = handle(() => {
  const key = process.env.VAPID_PUBLIC_KEY;
  return key ? json({ key }) : errorJson(503, 'push_not_configured');
});
