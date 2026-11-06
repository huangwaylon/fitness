// けっこんしき's board on its invented fixture (components/wedding/fixtures/board.ts), for the e2e and the visual QA:
// in `vite dev`, or with `?demo` in a build (the dev hooks' rule: a live phone never sees it); 404 otherwise.
import { error } from '@sveltejs/kit';
import { hooksOn } from '#lib/ui-state/preview.ts';

export function load({ url }) {
  if (!hooksOn(url.searchParams)) error(404, 'Not found');
}
