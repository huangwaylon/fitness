import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { building, dev } from '$app/env';
import { getDb } from '#lib/server/db/index.ts';
import { guard, secureResponse } from '#lib/server/guard.ts';
import { startScheduler } from '#lib/server/jobs.ts';

export const init: ServerInit = () => {
  if (building) return;
  getDb(); // open + migrate at boot
  if (process.env.DISABLE_SCHEDULER !== '1') startScheduler(getDb);
};

export const handle: Handle = async ({ event, resolve }) => {
  const blocked = await guard(event, { db: getDb, dev });
  const response = blocked ?? (await resolve(event));
  return secureResponse(response, { dev });
};
