// The trip map on its own (docs/travel.md "Maps"): in `vite dev`, or a build with `?demo` (the map's specs run on the
// build); a 404 otherwise. The map and its sample trip load only here.
import { error } from '@sveltejs/kit';

export async function load({ url }: { url: URL }) {
  if (import.meta.env.DEV || url.searchParams.has('demo')) return { DevMap: (await import('#lib/components/travel/map/DevMap.svelte')).default };
  error(404, 'Not found');
}
