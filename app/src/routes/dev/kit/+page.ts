// Dev-only sample of the unified kit (docs/design.md "Unified kit"): 404 outside `vite dev`, no chunk in the build.
import { error } from '@sveltejs/kit';

export async function load() {
  if (import.meta.env.DEV) return { Kit: (await import('#lib/components/dev/Kit.svelte')).default };
  error(404, 'Not found');
}
