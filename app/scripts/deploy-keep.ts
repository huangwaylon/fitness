// The deploy keeps the builds before it's hashed files (.github/workflows/pages.yml, `deploy`, before wrangler): a page
// still running an older build (a PWA left open across deploys) asks for its own lazy chunks, which Pages served no
// more once a deploy replaced them (chunk.fail, then a reload under the player: review 11-24 R2; the worker's older
// shells hold only what that build fetched, not the parts never opened, English's strings among them). Each deploy
// writes _app/kept.json, every _app/immutable file it serves with when it last was a live build's own; the next one
// reads the live site's, and copies from the live site each file no longer its build's that was a build's own within
// KEEP_MS (MAX_KEPT at most, the latest first: Pages takes 20,000 files a deployment, a build ~12,000). A file it can't
// fetch is let go. Fails open: no kept.json on the site (the first deploy with it) keeps nothing.
//   node scripts/deploy-keep.ts <site dir> <live site URL>
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

export const KEEP_MS = 3 * 24 * 3600_000;
export const MAX_KEPT = 3000;
export const KEPT_FILE = '_app/kept.json';

export type Kept = Record<string, number>;

/** The new kept list (this build's files at `now`, the older ones still within KEEP_MS, MAX_KEPT at most) and which
 *  older files to copy in. */
export function plan(own: readonly string[], live: Kept, now: number, keepMs = KEEP_MS, max = MAX_KEPT): { kept: Kept; copy: string[] } {
  const mine = new Set(own);
  const copy = Object.entries(live)
    .filter(([p, t]) => !mine.has(p) && /^_app\/immutable\/[\w./-]+$/.test(p) && !p.includes('..') && typeof t === 'number' && now - t <= keepMs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max);
  const kept: Kept = Object.fromEntries(own.map((p) => [p, now]));
  for (const [p, t] of copy) kept[p] = t;
  return { kept, copy: copy.map(([p]) => p) };
}

function files(dir: string, root = dir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name), root) : [relative(root, join(dir, e.name)).split('\\').join('/')]));
}

if (import.meta.main) {
  const [site, url] = process.argv.slice(2);
  if (!site || !url) throw new Error('usage: deploy-keep.ts <site dir> <live site URL>');
  const own = files(join(site, '_app/immutable')).map((p) => `_app/immutable/${p}`);
  let live: Kept = {};
  try {
    const res = await fetch(`${url}/${KEPT_FILE}?t=${Date.now()}`, { signal: AbortSignal.timeout(20_000) });
    if (res.ok && (res.headers.get('content-type') ?? '').includes('json')) live = (await res.json()) as Kept;
  } catch (e) {
    console.log(`::warning::no ${KEPT_FILE} read from ${url} (${e instanceof Error ? e.message : String(e)}): nothing kept`);
  }
  const { kept, copy } = plan(own, live, Date.now());
  let got = 0;
  const queue = [...copy];
  await Promise.all(Array.from({ length: 16 }, async () => {
    for (let p = queue.shift(); p; p = queue.shift()) {
      try {
        const res = await fetch(`${url}/${p}`, { signal: AbortSignal.timeout(30_000) });
        // (a missing file is Pages' 404 page, HTML)
        if (!res.ok || (res.headers.get('content-type') ?? '').includes('text/html')) throw new Error(String(res.status));
        const to = join(site, p);
        if (!existsSync(dirname(to))) mkdirSync(dirname(to), { recursive: true });
        writeFileSync(to, Buffer.from(await res.arrayBuffer()));
        got++;
      } catch {
        delete kept[p];
      }
    }
  }));
  writeFileSync(join(site, KEPT_FILE), JSON.stringify(kept));
  console.log(`${KEPT_FILE}: ${own.length} this build's, ${got} kept from before (${copy.length - got} not fetched)`);
}
