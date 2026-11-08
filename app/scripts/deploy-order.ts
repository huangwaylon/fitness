// The deploy's order guard (.github/workflows/pages.yml, `deploy`, in its `cloudflare-deploy` group, right before
// wrangler): never older code over newer. Runs overlap (no workflow-level group), so an older run can reach its deploy
// after a newer one deployed. `node scripts/deploy-order.ts` reads what is live (Cloudflare Pages' canonical production
// deployment, its commit hash: what wrangler's --commit-hash gave it) and how it stands to this commit and to main
// (GitHub's compare API), then writes `deploy=true|false` to $GITHUB_OUTPUT. It fails closed: an API failing 5 times,
// a live deployment without a commit, or an order it can't be sure of is red (exit 1), nothing deployed.
import { appendFileSync } from 'node:fs';

/** compare/{base}...{head}: `ahead` = head descends from base, `behind` = head is an ancestor of base. */
type Order = 'identical' | 'ahead' | 'behind' | 'diverged';

export type Facts = {
  /** this run's commit, and the live one (null: the live deployment has no commit hash) */
  mine: string;
  live: string | null;
  /** compare/mine...live */
  liveFromMine: Order;
  /** compare/mine...main: main has mine (identical or ahead) */
  mainFromMine: Order;
  /** compare/live...main, asked only when mine and live diverged */
  mainFromLive?: Order;
  /** a workflow_dispatch: the live commit itself may be deployed again */
  dispatch: boolean;
};

export type Decision = { deploy: boolean; why: string } | { red: string };

export function decide(f: Facts): Decision {
  if (!f.live) return { red: 'the live deployment names no commit (deployed without --commit-hash?): deploy it once by hand' };
  const onMain = f.mainFromMine === 'identical' || f.mainFromMine === 'ahead';
  if (!onMain) return { deploy: false, why: `${f.mine} is no longer on main (main moved past it by a force push): main's own run deploys` };
  switch (f.liveFromMine) {
    case 'identical':
      return f.dispatch ? { deploy: true, why: `live is ${f.live}, this commit: deployed again (a dispatch)` } : { deploy: false, why: `live is already ${f.live}, this commit` };
    case 'ahead':
      return { deploy: false, why: `live is ${f.live}, newer than ${f.mine}: an older run never deploys over it` };
    case 'behind':
      return { deploy: true, why: `live is ${f.live}, older than ${f.mine}` };
    case 'diverged':
      // a force push: the live commit off main, this one on it, deploys; anything else isn't sure
      if (f.mainFromLive === 'diverged') return { deploy: true, why: `live is ${f.live}, no longer on main; ${f.mine} is` };
      return { red: `live ${f.live} and ${f.mine} diverged, and main has the live one (${f.mainFromLive ?? 'unknown'}): not sure which is newer` };
    default:
      return { red: `unknown order ${String(f.liveFromMine)} of ${f.live} against ${f.mine}` };
  }
}

async function retry<T>(what: string, get: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let i = 0; i < 5; i++) {
    try {
      return await get();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw new Error(`${what}: ${last instanceof Error ? last.message : String(last)} (5 tries)`);
}

async function json(url: string, token: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent': 'island-fund-deploy' }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`${res.status} from ${url.replace(/accounts\/[^/]+/, 'accounts/…')}`);
  return res.json();
}

if (import.meta.main) {
  const env = (k: string) => {
    const v = process.env[k];
    if (!v) throw new Error(`no ${k}`);
    return v;
  };
  const out = (d: Decision) => {
    if ('red' in d) {
      console.log(`::error::the deploy's order guard: ${d.red}; nothing deployed`);
      process.exit(1);
    }
    console.log(d.deploy ? `deploying: ${d.why}` : `::notice::not deployed: ${d.why}`);
    appendFileSync(env('GITHUB_OUTPUT'), `deploy=${d.deploy}\n`);
  };
  try {
    const mine = env('GITHUB_SHA');
    const gh = (path: string) => retry(`GitHub ${path}`, () => json(`https://api.github.com/repos/${env('GITHUB_REPOSITORY')}/${path}`, env('GH_TOKEN')));
    const project = await retry('Cloudflare Pages project', () =>
      json(`https://api.cloudflare.com/client/v4/accounts/${env('CLOUDFLARE_ACCOUNT_ID')}/pages/projects/${env('PAGES_PROJECT')}`, env('CLOUDFLARE_API_TOKEN')).then((r) => {
        if (!r?.success || !r.result) throw new Error('no project in the answer');
        return r.result;
      })
    );
    const hash: unknown = project.canonical_deployment?.deployment_trigger?.metadata?.commit_hash;
    const live = typeof hash === 'string' && /^[0-9a-f]{7,40}$/.test(hash) ? hash : null;
    if (!live) out(decide({ mine, live: null, liveFromMine: 'identical', mainFromMine: 'identical', dispatch: false }));
    const status = async (base: string, head: string) => {
      const s = (await gh(`compare/${base}...${head}?per_page=1`)).status;
      if (!['identical', 'ahead', 'behind', 'diverged'].includes(s)) throw new Error(`compare ${base}...${head}: status ${s}`);
      return s as Order;
    };
    const liveFromMine = await status(mine, live!);
    const mainFromMine = await status(mine, 'main');
    const mainFromLive = liveFromMine === 'diverged' ? await status(live!, 'main') : undefined;
    out(decide({ mine, live, liveFromMine, mainFromMine, mainFromLive, dispatch: process.env.GITHUB_EVENT_NAME === 'workflow_dispatch' }));
  } catch (e) {
    out({ red: e instanceof Error ? e.message : String(e) });
  }
}
