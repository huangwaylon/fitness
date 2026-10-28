import type { RequestHandler } from '@sveltejs/kit';
import { getDb } from '#lib/server/db/index.ts';
import { handle, json, readJson, requirePerson } from '#lib/server/http.ts';
import { setVisibility, schemas } from '#lib/server/actions.ts';

export const POST: RequestHandler = handle(async ({ request, locals }) => {
  const person = requirePerson(locals);
  const body = await readJson(request, schemas.visibility);
  return json(setVisibility(getDb(), person, body));
});
