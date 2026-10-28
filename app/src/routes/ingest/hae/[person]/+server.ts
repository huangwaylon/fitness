import type { RequestHandler } from '@sveltejs/kit';
import { getDb } from '#lib/server/db/index.ts';
import { BODY_CAP, errorJson, handle, json, readText, requirePerson } from '#lib/server/http.ts';
import { ingestHae } from '#lib/server/ingest/hae.ts';

export const POST: RequestHandler = handle(async ({ request, locals, params }) => {
  const person = requirePerson(locals);
  if (params.person !== person) return errorJson(403, 'person_mismatch');
  const text = await readText(request, BODY_CAP.ingest);
  const r = ingestHae(getDb(), person, text);
  if (!r.ok) return errorJson(422, 'unparseable', { status: r.status });
  return json({ ok: true, metrics: r.metrics, workouts: r.workouts, status: r.status });
});
