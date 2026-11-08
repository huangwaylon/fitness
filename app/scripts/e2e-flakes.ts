// The flaky ledger (docs/ops/testing.md "Flakes"): every logic-tier run (the gate's shards, the full logic tier after
// the deploy) uploads its flaky tests (e2e/reporters/flaky.ts: failed, then passed on the retry) as an artifact
// flaky-<shard>; this reads the last 48 h of them from the GitHub API. A test flaky in 2 runs or more is
// auto-quarantined: the gate leaves it out (`playwright test --test-list-invert`), the full logic tier still runs it,
// and it comes back by itself once 48 h pass without a flake. No commit, no tag: the @quarantine tag is for a test
// that's broken, with an owner (scripts/e2e-quarantine.ts).
//
//   npm run e2e:flakes                     the ledger: each flaky test, how often, where, the last error
//   node scripts/e2e-flakes.ts --out <f>   (the gate) <f>: the auto-quarantined tests as a --test-list-invert file;
//                                          Markdown for the job summary on stdout
// Best effort: the API down, slow (8 s) or the token short of actions:read, it says so and quarantines nothing.
// In CI the window ends at the run's own start (GITHUB_RUN_ID), so every shard of a run reads the same ledger.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

const HOURS = 48, MIN = 2, SHARDS = 12;
type Entry = { key: string; project: string; file: string; line: number; error: string };
type Ledger = { run: string; sha: string; workflow: string; at: string; flaky: Entry[] };
type Artifact = { id: number; name: string; expired: boolean; created_at: string; workflow_run?: { id: number; head_branch: string } };

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

/** the tests flaky in at least `min` runs, worst first */
export function tally(ledgers: Ledger[], min = MIN) {
  const by = new Map<string, { key: string; project: string; where: string; runs: Set<string>; error: string; at: string }>();
  for (const l of [...ledgers].sort((a, b) => a.at.localeCompare(b.at)))
    for (const e of l.flaky) {
      const id = `[${e.project}] › ${e.key}`;
      const t = by.get(id) ?? { key: e.key, project: e.project, where: `${e.file}:${e.line}`, runs: new Set(), error: '', at: '' };
      t.runs.add(l.run || l.at);
      t.error = e.error;
      t.at = l.at;
      by.set(id, t);
    }
  const all = [...by.values()].sort((a, b) => b.runs.size - a.runs.size || b.at.localeCompare(a.at));
  return { all, quarantined: all.filter((t) => t.runs.size >= min) };
}

async function read(): Promise<{ ledgers: Ledger[]; since: Date; until: Date }> {
  const repo = process.env.GITHUB_REPOSITORY ?? execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], { encoding: 'utf8' }).trim();
  const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
  const signal = AbortSignal.timeout(8000);
  const api = async (path: string) => {
    const r = await fetch(`https://api.github.com/repos/${repo}/${path}`, { signal, headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error(`${path}: ${r.status}`);
    return r;
  };
  const until = process.env.GITHUB_RUN_ID ? new Date(((await (await api(`actions/runs/${process.env.GITHUB_RUN_ID}`)).json()) as { created_at: string }).created_at) : new Date();
  const since = new Date(until.getTime() - HOURS * 3600_000);
  const lists = await Promise.all(Array.from({ length: SHARDS }, (_, i) => api(`actions/artifacts?per_page=100&name=flaky-${i + 1}`).then((r) => r.json() as Promise<{ artifacts: Artifact[] }>)));
  const arts = lists.flatMap((l) => l.artifacts).filter((a) => {
    const t = new Date(a.created_at);
    return !a.expired && t >= since && t < until && (a.workflow_run?.head_branch ?? 'main') === 'main';
  });
  const ledgers = await Promise.all(arts.map(async (a) => JSON.parse(unzipOne(Buffer.from(await (await api(`actions/artifacts/${a.id}/zip`)).arrayBuffer())).toString('utf8')) as Ledger));
  return { ledgers, since, until };
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
  const { all, quarantined } = tally(got?.ledgers ?? []);
  if (out) writeFileSync(out, quarantined.map((t) => `[${t.project}] › ${t.key}`).join('\n') + (quarantined.length ? '\n' : ''));
  const secs = ((performance.now() - t0) / 1000).toFixed(1);
  const line = (t: (typeof all)[number]) => `- \`${t.where}\` ${t.key} [${t.project}]: flaky in ${t.runs.size} run${t.runs.size > 1 ? 's' : ''}, last ${t.at.slice(0, 16).replace('T', ' ')} UTC: ${t.error.replace(/`/g, "'")}`;
  if (!got) console.log(`### Auto-quarantine\n\nThe flaky ledger couldn't be read (${why}, ${secs} s): nothing left out.`);
  else if (out) {
    console.log(`### Auto-quarantined (${quarantined.length}): flaky in ${MIN}+ runs in ${HOURS} h\n`);
    console.log(quarantined.length ? `Left out of the gate (the full logic tier still runs them); back by themselves after ${HOURS} h without a flake. Fix the cause (docs/ops/testing.md "Flakes").\n\n${quarantined.map(line).join('\n')}` : 'None.');
    console.log(`\n(${got.ledgers.length} ledger entries, ${secs} s)`);
  } else {
    console.log(`The flaky ledger, ${got.since.toISOString().slice(0, 16)} to ${got.until.toISOString().slice(0, 16)} UTC: ${got.ledgers.length} runs with a flaky test, ${all.length} tests\n`);
    for (const t of all) console.log(`${t.runs.size >= MIN ? 'QUARANTINED ' : ''}${line(t).slice(2)}`);
  }
}
