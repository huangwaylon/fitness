import type { RequestHandler } from '@sveltejs/kit';
import { getDb } from '#lib/server/db/index.ts';
import { BODY_CAP, errorJson, handle, json, readText, requirePerson } from '#lib/server/http.ts';
import { ingestShortcut } from '#lib/server/ingest/shortcut.ts';

export const POST: RequestHandler = handle(async ({ request, locals, params }) => {
  const person = requirePerson(locals);
  if (params.person !== person) return errorJson(403, 'person_mismatch');
  const text = await readText(request, BODY_CAP.ingest);
  const r = ingestShortcut(getDb(), person, text);
  if (!r.ok) return errorJson(422, 'unparseable', { status: r.status, detail: r.error });
  return json({ ok: true, metrics: r.metrics, workouts: r.workouts, status: r.status, ...(r.unknownTypes ? { unknownTypes: r.unknownTypes } : {}) });
});
