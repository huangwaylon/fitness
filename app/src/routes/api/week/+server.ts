import type { RequestHandler } from '@sveltejs/kit';
import { getDb } from '#lib/server/db/index.ts';
import { handle, json, requirePerson } from '#lib/server/http.ts';
import { getWeekView } from '#lib/server/week.ts';

export const GET: RequestHandler = handle(({ locals }) => json(getWeekView(getDb(), requirePerson(locals))));
