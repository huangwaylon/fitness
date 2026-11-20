// Timing-based e2e shards (docs/ops/testing.md "CI"). Playwright's own --shard splits by count, so one shard got
// the 3D specs (40 s each under CI's software GL) and ran 3× as long as another. This one splits by each test's time.
//
//   node scripts/e2e-shards.ts plan <n> <outDir> [timings.json] [--lead <ms>] [-- <playwright list args>]
//     lists the tests (`playwright test --list`, with the args: --project, --grep…), and writes <outDir>/1.txt … n.txt,
//     test lists for `playwright test --test-list <file>`, balanced by the timings (a test without one: the median),
//     and <outDir>/1.skip.txt …, each for `--test-list-invert`: the list args' own --test-list-invert file's lines and
//     the tests its shard must not run. A spec file that runs serially goes whole to one shard; a test titled with `›`
//     (the list's own delimiter) is named by its file's line, which takes in the whole file: that shard's skip list
//     names the file's tests the other shards have (food.spec's 394 s went whole to one shard, 2026-11-20).
//   node scripts/e2e-shards.ts timings <out.json> <report.json…>
//     the tests' times from Playwright JSON reports (failed and skipped runs left out), folded into <out.json>'s
//     (a new time counts half: one slow run doesn't swing it; over 2× off, it replaces).
//   node scripts/e2e-shards.ts spread <report.json…>
//     how long each shard's tests ran, as Markdown (the run's summary).
//   node scripts/e2e-shards.ts refresh   (npm run e2e:timings)
//     e2e/timings.json from the newest green full logic tier (e2e-logic-full.yml: its shards' `timings-*` folded into
//     the committed times, or after a day its `e2e-timings` artifact): commit it
//     when the shards drift apart (the run's summary says how far), or after renaming or deleting tests: it keeps only
//     the tests there are now (the fold never forgets a key). The plan reads the committed file, so every shard
//     of a run has the same plan (a cache restored by each shard could differ between them).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type Result = { status: string; duration: number };
type Spec = { title: string; file: string; line: number; tests: { projectName: string; results?: Result[] }[] };
type Suite = { title: string; file?: string; specs?: Spec[]; suites?: Suite[] };
type Report = { suites: Suite[]; config?: { rootDir?: string } };

/** Every test in a report: its project, file (relative to the test dir), its describe path and title, its runs. */
function tests(report: Report) {
  const out: { project: string; file: string; titles: string[]; results: Result[] }[] = [];
  const walk = (s: Suite, path: string[]) => {
    for (const sp of s.specs ?? [])
      for (const t of sp.tests) out.push({ project: t.projectName, file: sp.file, titles: [...path, sp.title], results: t.results ?? [] });
    for (const c of s.suites ?? []) walk(c, c.title && !c.title.endsWith('.ts') ? [...path, c.title] : path);
  };
  for (const s of report.suites) walk(s, []);
  return out;
}
const key = (file: string, titles: string[]) => [file, ...titles].join(' › ');

const [cmd, ...rest] = process.argv.slice(2);
/** Reports' passed runs folded into `old` (in place): a new time counts half, so one slow run doesn't swing it, unless
 *  it is over 2× off (a test made faster or slower: halving left kikimimi-scenes at 48 s for its ~8.5 s): then it
 *  replaces. */
function fold(old: Record<string, number>, reports: string[]) {
  const fresh = new Map<string, number[]>();
  for (const f of reports) {
    if (!existsSync(f)) continue;
    for (const t of tests(JSON.parse(readFileSync(f, 'utf8')) as Report))
      for (const r of t.results) if (r.status === 'passed') fresh.set(key(t.file, t.titles), [...(fresh.get(key(t.file, t.titles)) ?? []), r.duration]);
  }
  for (const [k, ds] of fresh) {
    const d = Math.round(ds.reduce((a, b) => a + b, 0) / ds.length);
    old[k] = old[k] && d <= 2 * old[k] && 2 * d >= old[k] ? Math.round((old[k] + d) / 2) : d;
  }
  return fresh.size;
}
const sorted = (o: Record<string, number>) => JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))), null, 1) + '\n';

if (cmd === 'timings') {
  const [outFile, ...reports] = rest;
  const old: Record<string, number> = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : {};
  const n = fold(old, reports);
  writeFileSync(outFile, sorted(old));
  console.log(`${n} tests timed (${Object.keys(old).length} in ${outFile})`);
} else if (cmd === 'plan') {
  const dash = rest.indexOf('--');
  const head = dash < 0 ? rest : rest.slice(0, dash);
  const lead = head.includes('--lead') ? Number(head.splice(head.indexOf('--lead'), 2)[1]) : 0;
  const [nArg, outDir, timingsFile] = head;
  const listArgs = dash < 0 ? [] : rest.slice(dash + 1);
  const n = Number(nArg);
  if (!(n >= 1) || !outDir) throw new Error('usage: e2e-shards.ts plan <n> <outDir> [timings.json] [--lead <ms>] [-- <list args>]');
  const times: Record<string, number> = timingsFile && existsSync(timingsFile) ? JSON.parse(readFileSync(timingsFile, 'utf8')) : {};
  const json = execFileSync('npx', ['playwright', 'test', '--list', '--reporter=json', ...listArgs], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const report = JSON.parse(json.slice(json.indexOf('{'))) as Report;
  const all = tests(report);
  const known = Object.values(times).sort((a, b) => a - b);
  const median = known.length ? known[Math.floor(known.length / 2)] : 5000;
  // the units: a test, or a whole file (serial); a title the list's `›` can't name: its file's line, which takes in
  // the whole file, so its shard skips the file's other tests that went to other shards (<i>.skip.txt)
  const src = new Map<string, string>();
  const serial = (file: string) => {
    if (!src.has(file)) src.set(file, existsSync(join('e2e', file)) ? readFileSync(join('e2e', file), 'utf8') : '');
    return /mode:\s*'serial'|describe\.serial/.test(src.get(file)!);
  };
  type Unit = { lines: string[]; ms: number; n: number; of: string; whole: boolean; shard?: number };
  const units = new Map<string, Unit>();
  for (const t of all) {
    const whole = serial(t.file) || t.titles.some((x) => x.includes('›'));
    const u = whole ? `[${t.project}] › ${t.file}` : `[${t.project}] › ${key(t.file, t.titles)}`;
    const ms = times[key(t.file, t.titles)] ?? median;
    const cur = units.get(u) ?? { lines: [u], ms: 0, n: 0, of: `[${t.project}] › ${t.file}`, whole };
    cur.ms += ms;
    cur.n++;
    units.set(u, cur);
  }
  // longest first, each onto the shard that ends soonest (LPT)
  // (--lead: shard 1's head start in test time, for its own work before the tests: the gate's uploads `site`)
  const shards = Array.from({ length: n }, (_, i) => ({ ms: i ? 0 : lead, n: 0, lines: [] as string[] }));
  for (const u of [...units.values()].sort((a, b) => b.ms - a.ms)) {
    const s = shards.reduce((a, b) => (b.ms < a.ms ? b : a));
    u.shard = shards.indexOf(s);
    s.ms += u.ms;
    s.n += u.n;
    s.lines.push(...u.lines);
  }
  // (the skip lists start from the run's own --test-list-invert, the quarantine: one invert file per run)
  const inv = listArgs.indexOf('--test-list-invert');
  const base = inv >= 0 && existsSync(listArgs[inv + 1]) ? readFileSync(listArgs[inv + 1], 'utf8').split('\n').filter(Boolean) : [];
  const skips = shards.map(() => [...base]);
  for (const w of units.values())
    if (w.whole) for (const u of units.values()) if (!u.whole && u.of === w.of && u.shard !== w.shard) skips[w.shard!].push(...u.lines);
  mkdirSync(outDir, { recursive: true });
  shards.forEach((s, i) => writeFileSync(join(outDir, `${i + 1}.txt`), s.lines.join('\n') + '\n'));
  skips.forEach((s, i) => writeFileSync(join(outDir, `${i + 1}.skip.txt`), s.map((l) => `${l}\n`).join('')));
  console.log(`${all.length} tests in ${n} shards (${Object.keys(times).length ? 'timed' : 'untimed: by count'}): ` + shards.map((s) => `${s.n} tests ~${Math.round(s.ms / 1000)} s`).join(', '));
} else if (cmd === 'spread') {
  // how long each shard's tests ran (its report's own duration), for the run's summary
  const ds = rest.filter((f) => existsSync(f)).map((f) => (JSON.parse(readFileSync(f, 'utf8')) as { stats?: { duration?: number } }).stats?.duration ?? 0).filter((d) => d > 0);
  const s = (ms: number) => `${Math.round(ms / 1000)} s`;
  console.log(ds.length ? `### The logic tier's shards\n\n${ds.length} shards ran ${s(Math.min(...ds))} to ${s(Math.max(...ds))} (${ds.map(s).join(', ')}).${Math.max(...ds) > 1.3 * Math.min(...ds) ? ' Far apart: `npm run e2e:timings` and commit e2e/timings.json.' : ''}` : 'No shard reports.');
} else if (cmd === 'refresh') {
  const gh = (...a: string[]) => execFileSync('gh', a, { encoding: 'utf8' }).trim();
  const id = gh('run', 'list', '--workflow', 'e2e-logic-full.yml', '--status', 'success', '--limit', '1', '--json', 'databaseId', '--jq', '.[0].databaseId');
  const dir = mkdtempSync(join(tmpdir(), 'e2e-timings-'));
  // its shards' own reports (kept a day) folded into the committed times; older, its folded `e2e-timings`
  let got: Record<string, number>;
  try {
    gh('run', 'download', id, '--pattern', 'timings-*', '--dir', dir);
    got = JSON.parse(readFileSync('e2e/timings.json', 'utf8'));
    fold(got, readdirSync(dir).map((d) => join(dir, d, `${d}.json`)));
  } catch {
    gh('run', 'download', id, '--name', 'e2e-timings', '--dir', dir);
    got = JSON.parse(readFileSync(join(dir, 'e2e-timings.json'), 'utf8'));
  }
  rmSync(dir, { recursive: true });
  // (the fold keeps every key it ever saw: a renamed or deleted test's time stays unless pruned to today's tests)
  const json = execFileSync('npx', ['playwright', 'test', '--list', '--reporter=json', '--project=chromium'], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const now = new Set(tests(JSON.parse(json.slice(json.indexOf('{'))) as Report).map((t) => key(t.file, t.titles)));
  const kept = Object.fromEntries(Object.entries(got).filter(([k]) => now.has(k)));
  writeFileSync('e2e/timings.json', sorted(kept));
  console.log(`e2e/timings.json from run ${id}: ${Object.keys(kept).length} tests (${Object.keys(got).length - Object.keys(kept).length} gone dropped, ${[...now].filter((k) => !(k in kept)).length} without a time yet)`);
} else throw new Error('usage: e2e-shards.ts plan|timings|spread|refresh …');
