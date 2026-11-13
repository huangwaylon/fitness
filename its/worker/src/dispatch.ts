// 開始's GitHub workflow_dispatch of the runner's workflow (README "How it works"): a run starts in about a minute instead
// of at the next scheduled one. A fine-grained PAT (GH_DISPATCH_TOKEN: this repo, Actions read/write); unset, nothing is
// sent and the schedule starts the run.
import type { Dispatch } from './rules.ts';

export const DISPATCH_URL = 'https://api.github.com/repos/huangwaylon/fitness/actions/workflows/its-runner.yml/dispatches';
const TIMEOUT_MS = 10_000;

/** The dispatch as recorded: GitHub's status (204 = accepted; 0 = no answer), or `status: null` when no token is set
 *  (nothing sent: ok, the schedule starts one). Never throws. */
export async function dispatchRun(token: string | undefined, now: number): Promise<Dispatch> {
  if (!token) return { at: now, ok: true, status: null };
  try {
    const res = await fetch(DISPATCH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'its-bot (huangwaylon/fitness its/worker)',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: 'main' }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.warn(`its dispatch refused status=${res.status} body=${JSON.stringify((await res.text()).slice(0, 200).replace(/\s+/g, ' '))}`);
    return { at: now, ok: res.ok, status: res.status };
  } catch (e) {
    console.warn(`its dispatch failed err=${e instanceof Error ? e.name : 'error'}`);
    return { at: now, ok: false, status: 0 };
  }
}
