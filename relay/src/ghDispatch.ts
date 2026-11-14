// The health workflows on time (docs/ops/observability.md "The alert"): GitHub runs a scheduled workflow best effort
// (health.yml's hourly cron ran ~4 times a day), a Cloudflare cron on time. The relay's :15/:45 tick (index.ts
// scheduled) dispatches health.yml at :15 (hourly) and its-health.yml at both (every 30 min); their own schedules stay
// as the backstop. GH_DISPATCH_TOKEN: a fine-grained PAT, this repo only, Actions read and write (runbook §2). Unset:
// nothing is sent, one Workers Logs line a tick. A refusal or no answer is the log's `cron.gh` (warn). Never throws.
import type { RelayEvent } from './log.ts';

const WORKFLOWS_URL = 'https://api.github.com/repos/huangwaylon/fitness/actions/workflows';
export const dispatchUrl = (wf: string) => `${WORKFLOWS_URL}/${wf}.yml/dispatches`;
const TIMEOUT_MS = 10_000;

export type HealthWorkflow = 'health' | 'its-health';

/** The workflows a tick dispatches: both in the hour's first half (the :15 tick), else its-health only (:45). */
export const dueWorkflows = (scheduledTime: number): HealthWorkflow[] =>
  new Date(scheduledTime).getUTCMinutes() < 30 ? ['health', 'its-health'] : ['its-health'];

type FetchLike = (url: string, init: RequestInit) => Promise<{ ok: boolean; status: number }>;

/** Dispatch the tick's workflows on main: each one's GitHub status (204 = accepted, 0 = no answer); null: no token. */
export async function dispatchHealth(token: string | undefined, scheduledTime: number, log: (evs: RelayEvent[]) => void, f: FetchLike = fetch): Promise<{ wf: HealthWorkflow; st: number }[] | null> {
  if (!token) {
    console.log('health-dispatch no_token');
    return null;
  }
  return Promise.all(dueWorkflows(scheduledTime).map(async (wf) => {
    let st = 0;
    try {
      st = (await f(dispatchUrl(wf), {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'island-fund-relay (huangwaylon/fitness relay)',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ ref: 'main' }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })).status;
    } catch {
      st = 0;
    }
    if (st !== 204) {
      console.warn(`health-dispatch refused wf=${wf} status=${st}`);
      log([{ e: 'cron.gh', l: 2, d: { wf, st } }]);
    }
    return { wf, st };
  }));
}
