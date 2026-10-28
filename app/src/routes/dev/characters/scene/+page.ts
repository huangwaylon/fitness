// Dev-only art gallery (Builder A): 404 outside `vite dev`.
import { error } from '@sveltejs/kit';
import { dev } from '$app/env';

export function load() {
  if (!dev) error(404, 'Not found');
  return {};
}
