// Timing-based e2e shards (docs/ops/test-strategy.md "CI"). Playwright's own --shard splits by count, so one shard got
// the 3D specs (40 s each under CI's software GL) and ran 3× as long as another. This one splits by each test's time.
//
//   node scripts/e2e-shards.ts plan <n> <outDir> [timings.json] [-- <playwright list args>]
//     lists the tests (`playwright test --list`, with the args: --project, --grep…), and writes <outDir>/1.txt … n.txt,
//     test lists for `playwright test --test-list <file>`, balanced by the timings (a test without one: the median).
//     A spec file that runs serially, or has a title with `›` in it (the list's own delimiter), goes whole to one shard.
//   node scripts/e2e-shards.ts timings <out.json> <report.json…>
//     the tests' times from Playwright JSON reports (failed and skipped runs left out), folded into <out.json>'s
//     (a new time counts half: one slow run doesn't swing it).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
if (cmd === 'timings') {
  const [outFile, ...reports] = rest;
  const old: Record<string, number> = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : {};
  const fresh = new Map<string, number[]>();
  for (const f of reports) {
    if (!existsSync(f)) continue;
    for (const t of tests(JSON.parse(readFileSync(f, 'utf8')) as Report))
      for (const r of t.results) if (r.status === 'passed') fresh.set(key(t.file, t.titles), [...(fresh.get(key(t.file, t.titles)) ?? []), r.duration]);
  }
  for (const [k, ds] of fresh) {
    const d = Math.round(ds.reduce((a, b) => a + b, 0) / ds.length);
    old[k] = old[k] ? Math.round((old[k] + d) / 2) : d;
  }
  writeFileSync(outFile, JSON.stringify(Object.fromEntries(Object.entries(old).sort(([a], [b]) => a.localeCompare(b))), null, 0));
  console.log(`${fresh.size} tests timed (${Object.keys(old).length} in ${outFile})`);
} else if (cmd === 'plan') {
  const dash = rest.indexOf('--');
  const [nArg, outDir, timingsFile] = dash < 0 ? rest : rest.slice(0, dash);
  const listArgs = dash < 0 ? [] : rest.slice(dash + 1);
  const n = Number(nArg);
  if (!(n >= 1) || !outDir) throw new Error('usage: e2e-shards.ts plan <n> <outDir> [timings.json] [-- <list args>]');
  const times: Record<string, number> = timingsFile && existsSync(timingsFile) ? JSON.parse(readFileSync(timingsFile, 'utf8')) : {};
  const json = execFileSync('npx', ['playwright', 'test', '--list', '--reporter=json', ...listArgs], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const report = JSON.parse(json.slice(json.indexOf('{'))) as Report;
  const all = tests(report);
  const known = Object.values(times).sort((a, b) => a - b);
  const median = known.length ? known[Math.floor(known.length / 2)] : 5000;
  // the units: a test, or a whole file (serial, or a title the list's `›` can't name)
  const src = new Map<string, string>();
  const whole = (file: string) => {
    if (!src.has(file)) src.set(file, existsSync(join('e2e', file)) ? readFileSync(join('e2e', file), 'utf8') : '');
    return /mode:\s*'serial'|describe\.serial/.test(src.get(file)!);
  };
  const odd = new Set(all.filter((t) => t.titles.some((x) => x.includes('›'))).map((t) => t.file));
  const units = new Map<string, { lines: string[]; ms: number; n: number }>();
  for (const t of all) {
    const asFile = whole(t.file) || odd.has(t.file);
    const u = asFile ? `[${t.project}] › ${t.file}` : `[${t.project}] › ${key(t.file, t.titles)}`;
    const ms = times[key(t.file, t.titles)] ?? median;
    const cur = units.get(u) ?? { lines: [u], ms: 0, n: 0 };
    cur.ms += ms;
    cur.n++;
    units.set(u, cur);
  }
  // longest first, each onto the shard that ends soonest (LPT)
  const shards = Array.from({ length: n }, () => ({ ms: 0, n: 0, lines: [] as string[] }));
  for (const u of [...units.values()].sort((a, b) => b.ms - a.ms)) {
    const s = shards.reduce((a, b) => (b.ms < a.ms ? b : a));
    s.ms += u.ms;
    s.n += u.n;
    s.lines.push(...u.lines);
  }
  mkdirSync(outDir, { recursive: true });
  shards.forEach((s, i) => writeFileSync(join(outDir, `${i + 1}.txt`), s.lines.join('\n') + '\n'));
  console.log(`${all.length} tests in ${n} shards (${Object.keys(times).length ? 'timed' : 'untimed: by count'}): ` + shards.map((s) => `${s.n} tests ~${Math.round(s.ms / 1000)} s`).join(', '));
} else throw new Error('usage: e2e-shards.ts plan|timings …');
