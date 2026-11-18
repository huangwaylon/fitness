// Dev-only preview of 英語すごろく's 3D board (lib/sugoroku/board3d/engine.ts): 404 outside `vite dev`, no chunk in the build.
import { error } from '@sveltejs/kit';

export async function load() {
  if (import.meta.env.DEV) return { Preview: (await import('#lib/sugoroku/board3d/Preview.svelte')).default };
  error(404, 'Not found');
}
