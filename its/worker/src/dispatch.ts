// GitHub workflow_dispatch of the runner's workflow (README "How it works"), for 開始 and the watchdog: a run starts in
// about a minute instead of at the next scheduled one; the watchdog's look at the workflow's unfinished runs, and its
// cancel of a hung one. And the health workflows on time (dispatchHealth: docs/ops/observability.md "The alert"), and
// Kalori's weekly refresh (dispatchKalori). A fine-grained PAT (GH_DISPATCH_TOKEN: this repo, Actions read/write);
// unset, nothing is sent and the schedule starts the run.
import type { Dispatch } from './rules.ts';
import { errName } from './env.ts';

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
    console.warn(`its dispatch failed err=${errName(e)}`);
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
      console.warn(`its watchdog runs unknown err=${errName(e)} asked=${status}`);
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
    console.warn(`its watchdog cancel failed err=${errName(e)}`);
    return 0;
  }
}

/** The health workflows a cron tick dispatches (GitHub runs a schedule best effort: health.yml's hourly cron ran ~4
 *  times a day; their own schedules stay the backstop): at :15 health.yml (hourly) and its-health.yml, at :45
 *  its-health.yml (every 30 min); the cron's other ticks none. */
export const dueHealth = (scheduledTime: number): ('health' | 'its-health')[] => {
  const m = new Date(scheduledTime).getUTCMinutes();
  return m === 15 ? ['health', 'its-health'] : m === 45 ? ['its-health'] : [];
};
export const healthDispatchUrl = (wf: string) => `${REPO_URL}/actions/workflows/${wf}.yml/dispatches`;

/** Dispatch the tick's health workflows on main: each one's GitHub status (204 = accepted, 0 = no answer); a refusal
 *  or no answer is one warn line (`its health-dispatch refused`). No token: nothing sent. Never throws. */
export async function dispatchHealth(token: string | undefined, scheduledTime: number): Promise<{ wf: string; st: number }[]> {
  const due = dueHealth(scheduledTime);
  if (!due.length) return [];
  if (!token) {
    console.log('its health-dispatch no_token');
    return [];
  }
  return Promise.all(due.map(async (wf) => {
    let st = 0;
    try {
      st = (await gh(token, healthDispatchUrl(wf), { method: 'POST', body: JSON.stringify({ ref: 'main' }) })).status;
    } catch {
      st = 0;
    }
    if (st !== 204) console.warn(`its health-dispatch refused wf=${wf} status=${st}`);
    return { wf, st };
  }));
}

// ---- Kalori's weekly refresh (kalori-scrape.yml; docs/ops/runbook.md "Refresh Kalori") ----
// GitHub drops scheduled runs, and the weekly one is Kalori's only trigger: the cron dispatches it too, as it does the
// health workflows. GitHub's schedule stays the backstop; a weekly run it (or a tick) already started means none is sent.
const KALORI_WF = `${REPO_URL}/actions/workflows/kalori-scrape.yml`;
export const KALORI_DISPATCH_URL = `${KALORI_WF}/dispatches`;
const HOUR_MS = 3_600_000;
/** Tuesday 17:41 UTC (Wednesday 02:41 JST): kalori-scrape.yml's cron. */
const KALORI_DAY = 2, KALORI_H = 17, KALORI_M = 41;
/** The dispatch waits an hour past the schedule (a late scheduled run has started by then), then each tick tries for
 *  2 h (one refused or unanswered tries again at the next). */
const KALORI_WAIT_MS = HOUR_MS, KALORI_TRIES_MS = 2 * HOUR_MS;
/** A weekly run created this long before the schedule or since (GitHub's schedule's, or a tick's dispatch) is this
 *  week's: nothing sent. A retry's round, a smoke or a run by hand isn't one. */
const KALORI_RECENT_MS = 24 * HOUR_MS;
/** kalori-scrape.yml's `run-name` for a weekly run (the schedule's, or `weekly`): the runs list's `display_title`, the
 *  only place it shows (the list has no inputs). */
export const KALORI_WEEKLY_TITLE = 'Kalori scrape (weekly)';

/** The week's scheduled time when `scheduledTime` is a tick that may dispatch it; else null. */
export function kaloriSlot(scheduledTime: number): number | null {
  const d = new Date(scheduledTime);
  if (d.getUTCDay() !== KALORI_DAY) return null;
  const slot = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), KALORI_H, KALORI_M);
  const after = scheduledTime - slot;
  return after >= KALORI_WAIT_MS && after < KALORI_WAIT_MS + KALORI_TRIES_MS ? slot : null;
}
export const kaloriRecentUrl = (slot: number) =>
  `${KALORI_WF}/runs?created=${encodeURIComponent(`>=${new Date(slot - KALORI_RECENT_MS).toISOString().slice(0, 19)}Z`)}&per_page=100`;
export const kaloriUnfinishedUrl = (status: string) => `${KALORI_WF}/runs?status=${status}&per_page=1`;

/** A count of the runs a query lists (`total_count`), or null: no answer, a refusal or another body. */
async function runCount(token: string, url: string): Promise<number | null> {
  try {
    const res = await gh(token, url);
    const n = res.ok ? ((await res.json()) as { total_count?: unknown }).total_count : null;
    return typeof n === 'number' ? n : null;
  } catch {
    return null;
  }
}

/** The weekly runs a page of runs lists (`event` schedule, or KALORI_WEEKLY_TITLE), or null: no answer, a refusal or
 *  another body. */
async function weeklyCount(token: string, url: string): Promise<number | null> {
  try {
    const res = await gh(token, url);
    const runs = res.ok ? ((await res.json()) as { workflow_runs?: unknown }).workflow_runs : null;
    if (!Array.isArray(runs)) return null;
    return (runs as { event?: unknown; display_title?: unknown }[]).filter((r) => r.event === 'schedule' || r.display_title === KALORI_WEEKLY_TITLE).length;
  } catch {
    return null;
  }
}

/** On a due tick (kaloriSlot), dispatch the weekly run on main unless one is this week's (a weekly run created within
 *  KALORI_RECENT_MS of the schedule) or unfinished (queued, running…: kalori-scrape.yml's concurrency group would
 *  replace a pending retry with it). Exactly the scheduled run: no inputs but `weekly` (setup starts the refresh's
 *  `since` anew, as a scheduled run does), so every input's default and the gates' "a default run". An unknown answer
 *  sends nothing (the next tick asks again). One line each tick: `its kalori-dispatch …`. Never throws. */
export async function dispatchKalori(token: string | undefined, scheduledTime: number): Promise<string | null> {
  const slot = kaloriSlot(scheduledTime);
  if (slot === null) return null;
  const say = (what: string) => {
    (what.startsWith('sent') || what.startsWith('skip') ? console.log : console.warn)(`its kalori-dispatch ${what}`);
    return what;
  };
  if (!token) return say('no_token');
  const recent = await weeklyCount(token, kaloriRecentUrl(slot));
  if (recent === null) return say('unknown asked=recent');
  if (recent > 0) return say('skip why=recent');
  for (const status of UNFINISHED) {
    const n = await runCount(token, kaloriUnfinishedUrl(status));
    if (n === null) return say(`unknown asked=${status}`);
    if (n > 0) return say(`skip why=${status}`);
  }
  let st = 0;
  try {
    st = (await gh(token, KALORI_DISPATCH_URL, { method: 'POST', body: JSON.stringify({ ref: 'main', inputs: { weekly: 'true' } }) })).status;
  } catch {
    st = 0;
  }
  return say(st === 204 ? 'sent status=204' : `refused status=${st}`);
}
