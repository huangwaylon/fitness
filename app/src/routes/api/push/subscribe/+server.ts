import type { RequestHandler } from '@sveltejs/kit';
import { getDb } from '#lib/server/db/index.ts';
import { HttpError, handle, json, readJson, requirePerson } from '#lib/server/http.ts';
import { schemas, subscribePush } from '#lib/server/actions.ts';

export const POST: RequestHandler = handle(async ({ request, locals }) => {
  const person = requirePerson(locals);
  if (!locals.deviceId) throw new HttpError(401, 'unauthorized');
  const body = await readJson(request, schemas.subscribe);
  return json(subscribePush(getDb(), person, locals.deviceId, body));
});
