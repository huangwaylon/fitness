// App routes vs. URL paths: the app may live under a base path (BASE_PATH; at the root today).
import { resolve } from '$app/paths';

const BASE = resolve('/').replace(/\/$/, '');

/** URL pathname → app route ('/base/jar' → '/jar'). */
export function routeOf(pathname: string): string {
  return (pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname) || '/';
}
