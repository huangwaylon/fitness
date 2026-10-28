import type { RequestHandler } from '@sveltejs/kit';
import { errorJson } from '#lib/server/http.ts';

export const fallback: RequestHandler = () => errorJson(404, 'not_found');
