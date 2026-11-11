// The flaky ledger (docs/ops/testing.md "Flakes"): every logic-tier run (the gate's shards, the full logic tier after
// the deploy) uploads its flaky tests (e2e/reporters/flaky.ts: failed, then passed on the retry) as an artifact
// flaky-<shard>; this reads the last 48 h of them from the GitHub API. A flake counts only on a commit
// that has its spec's last change (a fix to the spec ends its count; one after is "flaky after its fix"). A test flaky
// in runs of 2 commits or more is auto-quarantined: the gate leaves it out (`playwright test --test-list-invert`), the full logic tier still runs it,
// and it comes back by itself once its spec changes or 48 h pass without a flake. At most 5, the worst (most commits, then most runs, then
// the latest); the rest that qualify are a warning each. Never a test of the gate set (e2e/gate.json: a warning
// instead). Each one quarantined is a warning on its spec naming its owner: the spec's last commit. A shard where
// most tests failed or were flaky (or 10 flaky at once) is the runner, not the tests: its entry is left out of the
// tally and named in the summary. No commit, no tag: the @quarantine tag is for a test that's broken, with an owner
// (scripts/e2e-quarantine.ts).
// Only this repo's own runs on main count (a push or a dispatch, or the full logic tier after
// one), never a fork's pull request, which writes its artifacts itself; an entry's run and commit are the API's.
//
//   npm run e2e:flakes                     the ledger: each flaky test, how often, where, the last error
//   node scripts/e2e-flakes.ts --out <f>   (the gate's checks job) <f>: the auto-quarantined tests as a
//                                          --test-list-invert file; Markdown for the job summary on stdout
// Best effort: the API down, slow (10 s) or the token short of actions:read, it says so and quarantines nothing.
// In CI the window ends at the run's own start (GITHUB_RUN_ID).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';

// (SHARDS: the most flaky-<n> any workflow uploads: the full logic tier's 6, the gate's 4)
const HOURS = 48, MIN_SHAS = 2, MAX_QUARANTINED = 5, SHARDS = 6, RUNNER_FLAKY = 10;
type Entry = { key: string; project: string; file: string; line: number; error: string };
/** a shard's entry: its flaky tests, and (since 2026-11-09) how many tests it ran and how many failed outright */
export type Ledger = { run: string; sha: string; workflow: string; at: string; flaky: Entry[]; total?: number; failed?: number };
type WorkflowRun = { id: number; repository_id: number; head_repository_id: number; head_branch: string; head_sha: string };
type Artifact = { id: number; name: string; expired: boolean; created_at: string; workflow_run?: WorkflowRun };
type Run = { id: number; name: string; event: string; head_branch: string; head_sha: string; head_repository?: { id: number } };

/** the one file in an artifact's zip (its central directory: upload-artifact streams, so the local headers have no sizes) */
function unzipOne(zip: Buffer): Buffer {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new Error('not a zip');
  const cd = zip.readUInt32LE(end + 16);
  const method = zip.readUInt16LE(cd + 10), size = zip.readUInt32LE(cd + 20), local = zip.readUInt32LE(cd + 42);
  const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
  const data = zip.subarray(start, start + size);
  return method === 0 ? data : inflateRawSync(data);
}

/** a shard whose tests mostly broke (flaky or failed), or 10 flaky at once: the runner (a slow or sick VM), not the tests */
export const runnerTrouble = (l: Ledger) => l.flaky.length >= RUNNER_FLAKY || (!!l.total && 2 * (l.flaky.length + (l.failed ?? 0)) > l.total);

/** the tests flaky in runs of at least `minShas` commits, worst first (commits, runs, the latest); the gate set's held
 *  back, the worst `max` of the rest quarantined and the others over the cap; a runner's trouble left out. `current`:
 *  whether a commit has the spec file's last change: a flake before it isn't counted (`fixed`: how many weren't, so a
 *  test with both is flaky after its fix) */
export function tally(ledgers: Ledger[], gate: string[] = [], { minShas = MIN_SHAS, max = MAX_QUARANTINED, current = (_file: string, _sha: string): boolean => true } = {}) {
  const by = new Map<string, { key: string; project: string; where: string; runs: Set<string>; shas: Set<string>; error: string; at: string; fixed: number }>();
  const before = new Map<string, number>();
  const runner = ledgers.filter(runnerTrouble);
  for (const l of ledgers.filter((l) => !runner.includes(l)).sort((a, b) => a.at.localeCompare(b.at)))
    for (const e of l.flaky) {
      const id = `[${e.project}] › ${e.key}`;
      if (l.sha && !current(e.file, l.sha)) {
        before.set(id, (before.get(id) ?? 0) + 1);
        continue;
      }
      const t = by.get(id) ?? { key: e.key, project: e.project, where: `${e.file}:${e.line}`, runs: new Set(), shas: new Set(), error: '', at: '', fixed: 0 };
      t.runs.add(l.run || l.at);
      t.shas.add(l.sha || l.run || l.at);
      t.error = e.error;
      t.at = l.at;
      by.set(id, t);
    }
  for (const [id, n] of before) if (by.has(id)) by.get(id)!.fixed = n;
  const all = [...by.values()].sort((a, b) => b.shas.size - a.shas.size || b.runs.size - a.runs.size || b.at.localeCompare(a.at));
  const due = all.filter((t) => t.shas.size >= minShas);
  const inGate = (t: (typeof all)[number]) => gate.includes(t.key.split(' › ')[0]);
  const held = due.filter(inGate), rest = due.filter((t) => !inGate(t));
  return { all, quarantined: rest.slice(0, max), over: rest.slice(max), held, runner };
}

/** who owns a quarantined test: its spec's last commit (sha, date, subject); '' outside a git checkout */
function owner(file: string) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%h %cs: %s', '--', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim().slice(0, 100);
  } catch {
    return '';
  }
}

/** whether `sha` has `file`'s last change (`git merge-base --is-ancestor`). Not sure: yes. That is a commit not on
 *  this history (not an ancestor of HEAD or origin/main: rewritten away, or not fetched), whether or not its objects
 *  are in the clone, so CI (which may hold a rewritten-away base e2e-impact fetched) and a local clone agree. */
function lastChange() {
  const last = new Map<string, string>();
  const known = new Map<string, boolean>();
  const git = (args: string[]) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  const ok = (args: string[]) => { try { git(args); return true; } catch { return false; } };
  const here = new Map<string, boolean>();
  const onHistory = (sha: string) => {
    if (!here.has(sha)) here.set(sha, ok(['cat-file', '-e', `${sha}^{commit}`]) && ['HEAD', 'origin/main'].some((r) => ok(['merge-base', '--is-ancestor', sha, r])));
    return here.get(sha)!;
  };
  return (file: string, sha: string) => {
    if (!onHistory(sha)) return true;
    if (!last.has(file)) {
      try {
        last.set(file, git(['log', '-1', '--format=%H', '--', file]));
      } catch {
        last.set(file, '');
      }
    }
    const change = last.get(file)!;
    const k = `${change} ${sha}`;
    if (change && !known.has(k)) {
      try {
        git(['merge-base', '--is-ancestor', change, sha]);
        known.set(k, true);
      } catch (e) {
        known.set(k, (e as { status?: number }).status !== 1); // 1: not an ancestor; else unknown
      }
    }
    return !change || known.get(k)!;
  };
}

const gateSet = () => Object.keys((JSON.parse(readFileSync(join(import.meta.dirname, '..', 'e2e', 'gate.json'), 'utf8')) as { specs: Record<string, string> }).specs);

async function read(): Promise<{ ledgers: Ledger[]; since: Date; until: Date; dropped: number }> {
  const repo = process.env.GITHUB_REPOSITORY ?? execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], { encoding: 'utf8' }).trim();
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
  const signal = AbortSignal.timeout(10_000);
  const api = async (path: string, o: { redirect?: RequestRedirect } = {}) => {
    const r = await fetch(`https://api.github.com/repos/${repo}${path && `/${path}`}`, { signal, redirect: o.redirect, headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' } });
    if (!r.ok && !(o.redirect === 'manual' && r.status === 302)) throw new Error(`${path.split('?')[0] || 'the repo'}: ${r.status}`);
    return r;
  };
  const json = async <T>(path: string) => (await (await api(path)).json()) as T;
  const repoId = Number(process.env.GITHUB_REPOSITORY_ID) || (await json<{ id: number }>('')).id;
  const until = process.env.GITHUB_RUN_ID ? new Date((await json<{ created_at: string }>(`actions/runs/${process.env.GITHUB_RUN_ID}`)).created_at) : new Date();
  const since = new Date(until.getTime() - HOURS * 3600_000);
  // (newest first, a page of 100 at a time till one reaches back past the window: a busy day passes 100 in 48 h)
  const listed = async (name: string) => {
    const all: Artifact[] = [];
    for (let page = 1; page <= 10; page++) {
      const { artifacts } = await json<{ artifacts: Artifact[] }>(`actions/artifacts?per_page=100&page=${page}&name=${name}`);
      all.push(...artifacts);
      if (artifacts.length < 100 || new Date(artifacts.at(-1)!.created_at) < since) break;
    }
    return { artifacts: all };
  };
  const lists = await Promise.all(Array.from({ length: SHARDS }, (_, i) => listed(`flaky-${i + 1}`)));
  const ours = (r: Pick<Run, 'head_branch' | 'head_repository'>) => r.head_branch === 'main' && r.head_repository?.id === repoId;
  // a run counts if this repo's main pushed or dispatched it, or it ran after one such (the full logic tier: workflow_run)
  const pushed = new Map<string, Promise<boolean>>();
  const wasPushed = (sha: string) => {
    if (!pushed.has(sha))
      pushed.set(sha, json<{ workflow_runs: Run[] }>(`actions/runs?head_sha=${sha}&per_page=50`).then(({ workflow_runs }) =>
        workflow_runs.some((r) => r.name === 'Deploy UI' && ['push', 'workflow_dispatch'].includes(r.event) && ours(r))));
    return pushed.get(sha)!;
  };
  const trusted = async (id: number) => {
    const r = await json<Run>(`actions/runs/${id}`);
    if (!ours(r)) return false;
    if (r.event === 'push' || r.event === 'workflow_dispatch') return true;
    return r.event === 'workflow_run' && wasPushed(r.head_sha);
  };
  const inWindow = lists.flatMap((l) => l.artifacts).filter((a) => !a.expired && new Date(a.created_at) >= since && new Date(a.created_at) < until);
  const arts = inWindow.filter(({ workflow_run: w }) => w?.head_branch === 'main' && w.repository_id === repoId && w.head_repository_id === repoId);
  const runs = new Map<number, Promise<boolean>>();
  for (const a of arts) if (!runs.has(a.workflow_run!.id)) runs.set(a.workflow_run!.id, trusted(a.workflow_run!.id));
  const ok = new Map(await Promise.all([...runs].map(async ([id, p]) => [id, await p] as const)));
  const keep = arts.filter((a) => ok.get(a.workflow_run!.id));
  // (the zip: a redirect to blob storage, followed without the token; the store's 403s now and then: twice more)
  const zip = async (id: number) => {
    for (let n = 0; ; n++) {
      try {
        const to = (await api(`actions/artifacts/${id}/zip`, { redirect: 'manual' })).headers.get('location');
        const r = to ? await fetch(to, { signal }) : null;
        if (r?.ok) return Buffer.from(await r.arrayBuffer());
        if (n === 2) throw new Error(`actions/artifacts/${id}/zip: ${r ? r.status : 'no redirect'}`);
      } catch (e) {
        if (n === 2) throw e;
      }
    }
  };
  const ledgers = await Promise.all(keep.map(async (a) => {
    const l = JSON.parse(unzipOne(await zip(a.id)).toString('utf8')) as Ledger;
    const flaky = (Array.isArray(l.flaky) ? l.flaky : []).filter((e) => typeof e?.key === 'string' && typeof e.project === 'string');
    const n = (v: unknown) => (typeof v === 'number' && v >= 0 ? v : undefined);
    return { ...l, flaky, total: n(l.total), failed: n(l.failed), run: String(a.workflow_run!.id), sha: a.workflow_run!.head_sha, at: typeof l.at === 'string' ? l.at : a.created_at };
  }));
  return { ledgers, since, until, dropped: inWindow.length - keep.length };
}

if (import.meta.main) {
  const i = process.argv.indexOf('--out');
  const out = i > 0 ? process.argv[i + 1] : '';
  const t0 = performance.now();
  let got: Awaited<ReturnType<typeof read>> | null = null, why = '';
  try {
    got = await read();
  } catch (e) {
    why = String((e as Error)?.message ?? e);
  }
  const { all, quarantined, over, held, runner } = tally(got?.ledgers ?? [], gateSet(), { current: lastChange() });
  if (out) writeFileSync(out, quarantined.map((t) => `[${t.project}] › ${t.key}`).join('\n') + (quarantined.length ? '\n' : ''));
  // (workflow commands on stderr: stdout is the summary)
  const at = (t: (typeof all)[number]) => `file=app/${t.where.replace(/:(\d+)$/, ',line=$1')}`;
  const owners = new Map(quarantined.map((t) => [t, owner(t.where.split(':')[0])]));
  if (out) {
    for (const t of quarantined) console.error(`::warning ${at(t)},title=Auto-quarantined (flaky)::${t.key} [${t.project}]: flaky in runs of ${t.shas.size} commits; out of the gate till its spec changes or 48 h pass without a flake. Owner: ${owners.get(t) || 'unknown'}`);
    for (const t of over) console.error(`::warning ${at(t)},title=Flaky, over the quarantine's cap::${t.key} [${t.project}]: flaky in runs of ${t.shas.size} commits; ${MAX_QUARANTINED} worse ones are quarantined, this one still gates`);
    for (const t of held) console.error(`::warning ${at(t)},title=Flaky gate test (never auto-quarantined)::${t.key} [${t.project}]: flaky in runs of ${t.shas.size} commits. Fix it now: it's in the gate set (e2e/gate.json)`);
    if (runner.length) console.error(`::warning title=Flaky ledger::${runner.length} shard run(s) mostly broken: the runner, not the tests; left out of the tally (${runner.map((l) => l.run).join(', ')})`);
  }
  const secs = ((performance.now() - t0) / 1000).toFixed(1);
  const line = (t: (typeof all)[number]) => `- \`${t.where}\` ${t.key} [${t.project}]: flaky in ${t.runs.size} run${t.runs.size > 1 ? 's' : ''} of ${t.shas.size} commit${t.shas.size > 1 ? 's' : ''}, last ${t.at.slice(0, 16).replace('T', ' ')} UTC${t.fixed ? ` (**flaky after its fix**: ${t.fixed} more before the spec's last change)` : ''}: ${t.error.replace(/`/g, "'")}`;
  const runners = runner.length ? `Left out as the runner's trouble (most of the shard broke): ${runner.map((l) => `run ${l.run} (${l.flaky.length} flaky${l.total ? ` of ${l.total}` : ''})`).join(', ')}.\n` : '';
  if (!got) console.log(`### Auto-quarantine\n\nThe flaky ledger couldn't be read (${why}, ${secs} s): nothing left out.`);
  else if (out) {
    console.log(`### Auto-quarantined (${quarantined.length}): flaky in runs of ${MIN_SHAS}+ commits in ${HOURS} h, the worst ${MAX_QUARANTINED} at most\n`);
    console.log(quarantined.length ? `Left out of the gate (the full logic tier still runs them); back by themselves once their spec changes (a fix) or after ${HOURS} h without a flake. Fix the cause (docs/ops/testing.md "Flakes").\n\n${quarantined.map((t) => `${line(t)} Owner: ${owners.get(t) || 'unknown'}`).join('\n')}\n` : 'None.\n');
    if (over.length) console.log(`**Over the cap, still in the gate (${over.length}):** fix these too.\n\n${over.map(line).join('\n')}\n`);
    if (held.length) console.log(`**Flaky in the gate set (e2e/gate.json), never left out: fix now.**\n\n${held.map(line).join('\n')}\n`);
    if (runners) console.log(runners);
    console.log(`(${got.ledgers.length} ledger entries, ${got.dropped} not this repo's main, ${secs} s)`);
  } else {
    console.log(`The flaky ledger, ${got.since.toISOString().slice(0, 16)} to ${got.until.toISOString().slice(0, 16)} UTC: ${got.ledgers.length} runs with a flaky test, ${all.length} tests, ${quarantined.length} quarantined${over.length ? ` (${over.length} more over the cap)` : ''}\n`);
    if (runners) console.log(runners);
    for (const t of all) console.log(`${quarantined.includes(t) ? `QUARANTINED (owner: ${owners.get(t) || 'unknown'}) ` : over.includes(t) ? 'OVER CAP ' : held.includes(t) ? 'GATE (held) ' : ''}${line(t).slice(2)}`);
  }
}
