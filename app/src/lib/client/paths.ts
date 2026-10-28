// App routes vs. URL paths: on GitHub Pages the app lives under a base path (/fitness); on the Mac it's at /.
import { resolve } from '$app/paths';

const BASE = resolve('/').replace(/\/$/, '');

/** URL pathname → app route ('/fitness/jar' → '/jar'). */
export function routeOf(pathname: string): string {
  return (pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname) || '/';
}
