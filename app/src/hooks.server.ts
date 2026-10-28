import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { building, dev } from '$app/env';
import { getDb } from '#lib/server/db/index.ts';
import { guard, secureResponse } from '#lib/server/guard.ts';
import { corsHeaders, corsOrigin, withCors } from '#lib/server/cors.ts';
import { startScheduler } from '#lib/server/jobs.ts';

export const init: ServerInit = () => {
  if (building) return;
  getDb(); // open + migrate at boot
  if (process.env.DISABLE_SCHEDULER !== '1') startScheduler(getDb);
};

export const handle: Handle = async ({ event, resolve }) => {
  const cors = corsOrigin(event.request, decodeURIComponentSafe(event.url.pathname));
  if (cors && event.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(cors) });
  const blocked = await guard(event, { db: getDb, dev });
  const response = blocked ?? (await resolve(event));
  return withCors(await secureResponse(response, { dev }), cors);
};

const decodeURIComponentSafe = (p: string) => {
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
};
