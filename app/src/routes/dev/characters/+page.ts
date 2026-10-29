// Dev-only art gallery (Builder A): 404 outside `vite dev`. The gallery is imported only inside the DEV branch, so
// the production build has no chunk for it (round 8).
import { error } from '@sveltejs/kit';

export async function load() {
  if (import.meta.env.DEV) return { Gallery: (await import('#lib/components/dev/Gallery.svelte')).default };
  error(404, 'Not found');
}
