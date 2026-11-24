// The deploy's relay guard (.github/workflows/pages.yml, `deploy`, before wrangler; docs/ops/runbook.md §8): the app
// never goes live before the relay it needs. A phone drops an event the record refuses as `bad_request` (sync/queue.ts),
// so an app writing a new contract to an older relay loses data. `node scripts/relay-first.ts` takes the last commit
// touching what the relay bundles (RELAY_PATHS, its tests aside: relay.yml's paths), reads the live relay's `/health`
// `sha` (scripts/deploy.sh stamps it) and asks GitHub's compare API whether the live commit has it; while not, it asks
// again every 30 s for up to WAIT_MS (relay.yml's `deploy` puts the relay live after its checks: ~3 min), then fails:
// nothing deployed. RELAY_FIRST_ONCE=1 (relay.yml's `deploy`: is a deploy needed?) asks once: exit 0 if it has it, else 1.
import { execFileSync } from 'node:child_process';

/** What the relay's Worker bundles of the repo (relay/src's imports), as git pathspecs from the repo's root. */
export const RELAY_PATHS = ['relay/src', 'relay/wrangler.toml', 'app/src/lib/contract', 'app/src/lib/random.ts', 'app/src/lib/types.ts', 'app/src/lib/its/contract.ts', 'its/worker/src', ':(exclude)*.test.ts'];
const WAIT_MS = 15 * 60_000, EVERY_MS = 30_000;

/** compare/{need}...{live}: `ahead` or `identical` = the live commit has it. */
type Order = 'identical' | 'ahead' | 'behind' | 'diverged';

export type Facts = {
  /** the last commit touching RELAY_PATHS (this run's history) */
  need: string;
  /** /health's sha: null when unreachable or unstamped */
  live: string | null;
  /** compare/need...live, when live is a commit */
  order?: Order;
};

export function decide(f: Facts): { ok: true } | { wait: string } {
  if (!f.live) return { wait: 'the live relay names no commit (unreachable, or deployed without scripts/deploy.sh)' };
  if (!/^[0-9a-f]{7,40}$/.test(f.live)) return { wait: `the live relay is ${f.live}, not a commit of main (a dirty deploy?)` };
  if (f.order === 'identical' || f.order === 'ahead') return { ok: true };
  return { wait: `the live relay is ${f.live}, without ${f.need.slice(0, 12)} (${f.order ?? 'unknown'})` };
}

if (import.meta.main) {
  const env = (k: string) => {
    const v = process.env[k];
    if (!v) throw new Error(`no ${k}`);
    return v;
  };
  const need = execFileSync('git', ['log', '-1', '--format=%H', 'HEAD', '--', ...RELAY_PATHS], { cwd: new URL('../..', import.meta.url), encoding: 'utf8' }).trim();
  const facts = async (): Promise<Facts> => {
    const live = await fetch(env('RELAY_HEALTH'), { signal: AbortSignal.timeout(20_000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { sha?: unknown } | null) => (typeof j?.sha === 'string' ? j.sha : null))
      .catch(() => null);
    if (!live || !/^[0-9a-f]{7,40}$/.test(live)) return { need, live };
    const res = await fetch(`https://api.github.com/repos/${env('GITHUB_REPOSITORY')}/compare/${need}...${live}?per_page=1`, {
      headers: { Authorization: `Bearer ${env('GH_TOKEN')}`, Accept: 'application/json', 'User-Agent': 'island-fund-deploy' },
      signal: AbortSignal.timeout(20_000)
    }).catch(() => null);
    const order = res?.ok ? ((await res.json()) as { status?: Order }).status : undefined;
    return { need, live, order };
  };
  if (!need) {
    console.log('::error::relay-first: no commit touches the relay paths (a shallow checkout?)');
    process.exit(1);
  }
  const end = process.env.RELAY_FIRST_ONCE === '1' ? 0 : Date.now() + WAIT_MS;
  for (;;) {
    const d = decide(await facts());
    if ('ok' in d) {
      console.log(`the live relay has ${need.slice(0, 12)}, the last relay commit`);
      break;
    }
    if (!end) {
      console.log(`the live relay lacks the last relay commit: ${d.wait}`);
      process.exit(1);
    }
    if (Date.now() + EVERY_MS > end) {
      console.log(`::error title=Relay behind::${d.wait}: is Relay checks' deploy red? (runbook §8) Then re-run this job; nothing deployed`);
      process.exit(1);
    }
    console.log(`waiting for the relay: ${d.wait}`);
    await new Promise((r) => setTimeout(r, EVERY_MS));
  }
}
