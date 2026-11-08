// The flaky ledger (docs/ops/testing.md "Flakes"): every logic-tier run (the gate's shards, the full logic tier after
// the deploy) uploads its flaky tests (e2e/reporters/flaky.ts: failed, then passed on the retry) as an artifact
// flaky-<shard>; this reads the last 48 h of them from the GitHub API. A test flaky in runs of 2 commits or more is
// auto-quarantined: the gate leaves it out (`playwright test --test-list-invert`), the full logic tier still runs it,
// and it comes back by itself once 48 h pass without a flake. Never a test of the gate set (e2e/gate.json: a warning
// instead), and never more than 5: more is the runners, not the tests (an ::error, and nothing left out). No commit, no
// tag: the @quarantine tag is for a test that's broken, with an owner (scripts/e2e-quarantine.ts).
// The repo is public: only this repo's own runs on main count (a push or a dispatch, or the full logic tier after
// one), never a fork's pull request, which writes its artifacts itself; an entry's run and commit are the API's.
//
//   npm run e2e:flakes                     the ledger: each flaky test, how often, where, the last error
//   node scripts/e2e-flakes.ts --out <f>   (the gate's select job) <f>: the auto-quarantined tests as a
//                                          --test-list-invert file; Markdown for the job summary on stdout
// Best effort: the API down, slow (10 s) or the token short of actions:read, it says so and quarantines nothing.
// In CI the window ends at the run's own start (GITHUB_RUN_ID).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const HOURS = 48, MIN_SHAS = 2, MAX_QUARANTINED = 5, SHARDS = 12;
type Entry = { key: string; project: string; file: string; line: number; error: string };
type Ledger = { run: string; sha: string; workflow: string; at: string; flaky: Entry[] };
type WorkflowRun = { id: number; repository_id: number; head_repository_id: number; head_branch: string; head_sha: string };
type Artifact = { id: number; name: string; expired: boolean; created_at: string; workflow_run?: WorkflowRun };
type Run = { id: number; name: string; event: string; head_branch: string; head_sha: string; head_repository?: { id: number } };

/** the one file in an artifact's zip (its central directory: upload-artifact streams, so the local headers have no sizes) */
export function unzipOne(zip: Buffer): Buffer {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new Error('not a zip');
  const cd = zip.readUInt32LE(end + 16);
  const method = zip.readUInt16LE(cd + 10), size = zip.readUInt32LE(cd + 20), local = zip.readUInt32LE(cd + 42);
  const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
  const data = zip.subarray(start, start + size);
  return method === 0 ? data : inflateRawSync(data);
}

/** the tests flaky in runs of at least `minShas` commits, worst first; the gate set's held back, and none at all past `max` */
export function tally(ledgers: Ledger[], gate: string[] = [], { minShas = MIN_SHAS, max = MAX_QUARANTINED } = {}) {
  const by = new Map<string, { key: string; project: string; where: string; runs: Set<string>; shas: Set<string>; error: string; at: string }>();
  for (const l of [...ledgers].sort((a, b) => a.at.localeCompare(b.at)))
    for (const e of l.flaky) {
      const id = `[${e.project}] › ${e.key}`;
      const t = by.get(id) ?? { key: e.key, project: e.project, where: `${e.file}:${e.line}`, runs: new Set(), shas: new Set(), error: '', at: '' };
      t.runs.add(l.run || l.at);
      t.shas.add(l.sha || l.run || l.at);
      t.error = e.error;
      t.at = l.at;
      by.set(id, t);
    }
  const all = [...by.values()].sort((a, b) => b.shas.size - a.shas.size || b.runs.size - a.runs.size || b.at.localeCompare(a.at));
  const due = all.filter((t) => t.shas.size >= minShas);
  const inGate = (t: (typeof all)[number]) => gate.includes(t.key.split(' › ')[0]);
  const held = due.filter(inGate), rest = due.filter((t) => !inGate(t));
  const widespread = rest.length > max;
  return { all, quarantined: widespread ? [] : rest, held, widespread, due: rest };
}

const gateSet = () => Object.keys((JSON.parse(readFileSync(join(import.meta.dirname, '..', 'e2e', 'gate.json'), 'utf8')) as { specs: Record<string, string> }).specs);

async function read(): Promise<{ ledgers: Ledger[]; since: Date; until: Date; dropped: number }> {
  const repo = process.env.GITHUB_REPOSITORY ?? execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], { encoding: 'utf8' }).trim();
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
  const signal = AbortSignal.timeout(10_000);
  const api = async (path: string) => {
    const r = await fetch(`https://api.github.com/repos/${repo}${path && `/${path}`}`, { signal, headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error(`${path.split('?')[0] || 'the repo'}: ${r.status}`);
    return r;
  };
  const json = async <T>(path: string) => (await (await api(path)).json()) as T;
  const repoId = Number(process.env.GITHUB_REPOSITORY_ID) || (await json<{ id: number }>('')).id;
  const until = process.env.GITHUB_RUN_ID ? new Date((await json<{ created_at: string }>(`actions/runs/${process.env.GITHUB_RUN_ID}`)).created_at) : new Date();
  const since = new Date(until.getTime() - HOURS * 3600_000);
  const lists = await Promise.all(Array.from({ length: SHARDS }, (_, i) => json<{ artifacts: Artifact[] }>(`actions/artifacts?per_page=100&name=flaky-${i + 1}`)));
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
  const ledgers = await Promise.all(keep.map(async (a) => {
    const l = JSON.parse(unzipOne(Buffer.from(await (await api(`actions/artifacts/${a.id}/zip`)).arrayBuffer())).toString('utf8')) as Ledger;
    const flaky = (Array.isArray(l.flaky) ? l.flaky : []).filter((e) => typeof e?.key === 'string' && typeof e.project === 'string');
    return { ...l, flaky, run: String(a.workflow_run!.id), sha: a.workflow_run!.head_sha, at: typeof l.at === 'string' ? l.at : a.created_at };
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
  const { all, quarantined, held, widespread, due } = tally(got?.ledgers ?? [], gateSet());
  if (out) writeFileSync(out, quarantined.map((t) => `[${t.project}] › ${t.key}`).join('\n') + (quarantined.length ? '\n' : ''));
  // (workflow commands on stderr: stdout is the summary)
  if (out && widespread) console.error(`::error title=Flaky ledger::widespread flakiness: runner/infra, not the tests (${due.length} tests flaky across ${MIN_SHAS}+ commits, over ${MAX_QUARANTINED}): none auto-quarantined`);
  if (out) for (const t of held) console.error(`::warning file=app/${t.where.replace(/:(\d+)$/, ',line=$1')},title=Flaky gate test (never auto-quarantined)::${t.key} [${t.project}]: flaky in runs of ${t.shas.size} commits. Fix it now: it's in the gate set (e2e/gate.json)`);
  const secs = ((performance.now() - t0) / 1000).toFixed(1);
  const line = (t: (typeof all)[number]) => `- \`${t.where}\` ${t.key} [${t.project}]: flaky in ${t.runs.size} run${t.runs.size > 1 ? 's' : ''} of ${t.shas.size} commit${t.shas.size > 1 ? 's' : ''}, last ${t.at.slice(0, 16).replace('T', ' ')} UTC: ${t.error.replace(/`/g, "'")}`;
  if (!got) console.log(`### Auto-quarantine\n\nThe flaky ledger couldn't be read (${why}, ${secs} s): nothing left out.`);
  else if (out) {
    console.log(`### Auto-quarantined (${quarantined.length}): flaky in runs of ${MIN_SHAS}+ commits in ${HOURS} h\n`);
    if (widespread) console.log(`**Widespread flakiness: runner/infra, not the tests.** ${due.length} tests qualify, over ${MAX_QUARANTINED}: none left out.\n\n${due.map(line).join('\n')}\n`);
    else console.log(quarantined.length ? `Left out of the gate (the full logic tier still runs them); back by themselves after ${HOURS} h without a flake. Fix the cause (docs/ops/testing.md "Flakes").\n\n${quarantined.map(line).join('\n')}\n` : 'None.\n');
    if (held.length) console.log(`**Flaky in the gate set (e2e/gate.json), never left out: fix now.**\n\n${held.map(line).join('\n')}\n`);
    console.log(`(${got.ledgers.length} ledger entries, ${got.dropped} not this repo's main, ${secs} s)`);
  } else {
    console.log(`The flaky ledger, ${got.since.toISOString().slice(0, 16)} to ${got.until.toISOString().slice(0, 16)} UTC: ${got.ledgers.length} runs with a flaky test, ${all.length} tests${widespread ? ` (widespread: ${due.length} qualify, none quarantined)` : ''}\n`);
    for (const t of all) console.log(`${quarantined.includes(t) ? 'QUARANTINED ' : held.includes(t) ? 'GATE (held) ' : ''}${line(t).slice(2)}`);
  }
}
