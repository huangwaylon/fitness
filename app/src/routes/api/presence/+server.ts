import type { RequestHandler } from '@sveltejs/kit';
import { getDb } from '#lib/server/db/index.ts';
import { handle, json, readJson, requirePerson } from '#lib/server/http.ts';
import { schemas } from '#lib/server/actions.ts';
import { recordPresence } from '#lib/server/presence.ts';

// Auth (bearer header or {"token"} in the body) is done in hooks.server.ts.
export const POST: RequestHandler = handle(async ({ request, locals }) => {
  const person = requirePerson(locals);
  const body = await readJson(request, schemas.presence);
  const r = recordPresence(getDb(), person, { place: body.place, event: body.event, at: body.at });
  return json({ ok: true, ...r });
});
