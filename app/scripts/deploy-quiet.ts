// The deploy's quiet window (.github/workflows/pages.yml, `deploy`, after the gate, before the relay guard): a deploy
// at most every QUIET_MS, so a push storm isn't a phone update each (review 11-24 R2: ~half the launches were a
// build's first, each a new worker's install; the phones took 15 reloads a day). A green run waits till QUIET_MS after
// the live deployment (Cloudflare Pages' canonical one), then deploys; the run queued behind it (one per ref) carries
// everything pushed meanwhile. Urgent, no wait: a workflow_dispatch with `urgent`, or a commit since the live one whose
// message has an `Urgent:` trailer line (one pushed during the wait ends it). Fails open: a Cloudflare answer it can't
// read waits nothing (the deploy as before this window).
//   node scripts/deploy-quiet.ts   (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, PAGES_PROJECT, GITHUB_SHA[, URGENT])
import { execFileSync } from 'node:child_process';

export const QUIET_MS = 20 * 60_000;

/** How long to wait before deploying (ms). */
export function waitMs(o: { now: number; liveAt: number | null; urgent: boolean; quietMs?: number }): number {
  const quiet = o.quietMs ?? QUIET_MS;
  if (o.urgent || o.liveAt === null || !Number.isFinite(o.liveAt)) return 0;
  return Math.min(quiet, Math.max(0, o.liveAt + quiet - o.now));
}

/** Whether commit messages carry an `Urgent:` trailer line (any case). */
export const urgentIn = (messages: string): boolean => /^urgent:/im.test(messages);

if (import.meta.main) {
  const env = (k: string) => process.env[k] ?? '';
  let liveAt: number | null = null, live = '';
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env('CLOUDFLARE_ACCOUNT_ID')}/pages/projects/${env('PAGES_PROJECT')}`, {
      headers: { Authorization: `Bearer ${env('CLOUDFLARE_API_TOKEN')}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000)
    });
    const d = (await res.json()) as { result?: { canonical_deployment?: { created_on?: string; deployment_trigger?: { metadata?: { commit_hash?: string } } } } };
    const c = d.result?.canonical_deployment;
    liveAt = c?.created_on ? Date.parse(c.created_on) : null;
    live = c?.deployment_trigger?.metadata?.commit_hash ?? '';
  } catch (e) {
    console.log(`::warning::the quiet window: no live deployment read (${e instanceof Error ? e.message : String(e)}): no wait`);
  }
  let messages = '';
  if (/^[0-9a-f]{7,40}$/.test(live)) {
    try {
      messages = execFileSync('git', ['log', '--format=%B', `${live}..${env('GITHUB_SHA')}`], { encoding: 'utf8', maxBuffer: 64 << 20 });
    } catch {
      /* the live commit not in this history (a force push): no trailer seen */
    }
  }
  const urgent = env('URGENT') === 'true' || urgentIn(messages);
  const ms = waitMs({ now: Date.now(), liveAt, urgent });
  const since = liveAt === null ? 'unknown' : `${Math.round((Date.now() - liveAt) / 60_000)} min ago`;
  console.log(urgent ? `urgent: deploying now (live ${since})` : ms ? `the live deployment is from ${since}: deploying in ${Math.ceil(ms / 60_000)} min (QUIET_MS ${QUIET_MS / 60_000} min; an Urgent: trailer or a dispatch with urgent skips it)` : `the live deployment is from ${since}: deploying now`);
  // (a newer commit with the trailer, pushed meanwhile, waits behind this run in the ref's group: seen by git, no API
  // call, every 30 s, the wait ends and the urgent run follows at once)
  const until = Date.now() + ms;
  while (Date.now() < until) {
    await new Promise((ok) => setTimeout(ok, Math.min(30_000, until - Date.now())));
    try {
      execFileSync('git', ['fetch', '-q', '--filter=blob:none', 'origin', 'main'], { stdio: 'ignore', timeout: 20_000 });
      if (urgentIn(execFileSync('git', ['log', '--format=%B', `${env('GITHUB_SHA')}..FETCH_HEAD`], { encoding: 'utf8', maxBuffer: 64 << 20 }))) {
        console.log('an urgent commit is queued behind this run: deploying now');
        break;
      }
    } catch {
      /* not seen: the wait goes on */
    }
  }
}
