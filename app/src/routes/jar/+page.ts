// The old ごほうび page: the wallet is the island panel's ごほうび tab now (design.md "Panel"). A phone left on /jar
// (an old build's tab, reloaded into this one) lands on the island with the panel open there.
import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

export function load({ url }: { url: URL }): never {
  redirect(307, `${resolve('/')}${url.search ? `${url.search}&` : '?'}panel=rewards`);
}
