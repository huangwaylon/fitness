// GitHub workflow_dispatch of the runner's workflow (README "How it works"), for 開始 and the watchdog: a run starts in
// about a minute instead of at the next scheduled one; the watchdog's look at the workflow's unfinished runs, and its
// cancel of a hung one. A
// fine-grained PAT (GH_DISPATCH_TOKEN: this repo, Actions read/write); unset, nothing is sent and the schedule starts
// the run.
import type { Dispatch } from './rules.ts';

const REPO_URL = 'https://api.github.com/repos/huangwaylon/fitness';
const WORKFLOW_URL = `${REPO_URL}/actions/workflows/its-runner.yml`;
export const DISPATCH_URL = `${WORKFLOW_URL}/dispatches`;
/** The unfinished statuses asked, one query each (a run's gate, its queued or running job, a handoff job all keep it
 *  unfinished): never a page of the newest runs, which finished ticks fill. */
export const UNFINISHED = ['in_progress', 'queued', 'waiting', 'pending', 'requested'] as const;
export const runsUrl = (status: string) => `${WORKFLOW_URL}/runs?status=${status}&per_page=5`;
/** A run's cancel (202 accepted); `force`: the force-cancel, for a run a cancel didn't end (a lost machine). */
export const cancelUrl = (id: number, force = false) => `${REPO_URL}/actions/runs/${id}/${force ? 'force-cancel' : 'cancel'}`;
const TIMEOUT_MS = 10_000;

const gh = (token: string, url: string, init: RequestInit = {}) => fetch(url, {
  ...init,
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'its-bot (huangwaylon/fitness its/worker)',
    'X-GitHub-Api-Version': '2022-11-28',
  },
  signal: AbortSignal.timeout(TIMEOUT_MS),
});

/** The dispatch as recorded: GitHub's status (204 = accepted; 0 = no answer), or `status: null` when no token is set
 *  (nothing sent: ok, the schedule starts one). Never throws. */
export async function dispatchRun(token: string | undefined, now: number): Promise<Dispatch> {
  if (!token) return { at: now, ok: true, status: null };
  try {
    const res = await gh(token, DISPATCH_URL, { method: 'POST', body: JSON.stringify({ ref: 'main' }) });
    if (!res.ok) console.warn(`its dispatch refused status=${res.status} body=${JSON.stringify((await res.text()).slice(0, 200).replace(/\s+/g, ' '))}`);
    return { at: now, ok: res.ok, status: res.status };
  } catch (e) {
    console.warn(`its dispatch failed err=${e instanceof Error ? e.name : 'error'}`);
    return { at: now, ok: false, status: 0 };
  }
}

/** A run of the workflow unfinished (in progress, queued, waiting, pending, requested) as `{id, status, ids}` (the
 *  newest; `ids`: that status's newest 5, where the watchdog looks for a hung run); null: none; 'unknown': no answer,
 *  a refusal or another body (the watchdog then dispatches anyway: the concurrency group queues it). Never throws. */
export async function unfinishedRun(token: string): Promise<{ id: number; status: string; ids: number[] } | null | 'unknown'> {
  for (const status of UNFINISHED) {
    try {
      const res = await gh(token, runsUrl(status));
      const body = res.ok ? ((await res.json()) as { workflow_runs?: unknown }) : null;
      if (!Array.isArray(body?.workflow_runs)) {
        console.warn(`its watchdog runs unknown status=${res.status} asked=${status}`);
        return 'unknown';
      }
      const ids = (body.workflow_runs as { id?: unknown }[]).map((r) => Number(r.id));
      if (ids.length) return { id: ids[0], status, ids };
    } catch (e) {
      console.warn(`its watchdog runs unknown err=${e instanceof Error ? e.name : 'error'} asked=${status}`);
      return 'unknown';
    }
  }
  return null;
}

/** POST a run's cancel (or force-cancel): GitHub's status (202 = accepted; 409 = it can't be: finished already; 0 = no
 *  answer). Never throws. */
export async function cancelRun(token: string, id: number, force = false): Promise<number> {
  try {
    const res = await gh(token, cancelUrl(id, force), { method: 'POST' });
    if (res.status !== 202) console.warn(`its watchdog cancel refused status=${res.status} body=${JSON.stringify((await res.text()).slice(0, 200).replace(/\s+/g, ' '))}`);
    return res.status;
  } catch (e) {
    console.warn(`its watchdog cancel failed err=${e instanceof Error ? e.name : 'error'}`);
    return 0;
  }
}
