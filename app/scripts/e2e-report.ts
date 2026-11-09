// The e2e run's failures from Playwright's JSON report (playwright-results.json), for CI's job summary and annotations
// (docs/ops/testing.md): each failed test once, with how many of its runs failed (a --repeat-each hunt runs it N times).
// `node scripts/e2e-report.ts [report.json] [heading]`: Markdown on stdout (for $GITHUB_STEP_SUMMARY); with ANNOTATE=1,
// instead one ::warning per test at its file and line (it shows on the spec). Exit 0 whatever it finds: the caller
// decides what a failure means. VERDICT=1 (for a run that failed): exit 0 only when every failed test failed for the
// browser itself crashing under Playwright (ENV: the flake hunt's macOS WebKit, "Cannot find parent object
// browser@…"), which the summary names apart; else (or no report, or no failed test in it) 1.
import { existsSync, readFileSync } from 'node:fs';

type Result = { status: string; error?: { message?: string } };
type Spec = { title: string; file: string; line: number; tests: { projectName: string; results: Result[] }[] };
type Suite = { title: string; specs?: Spec[]; suites?: Suite[] };

const [file = 'playwright-results.json', heading = 'Failed e2e tests'] = process.argv.slice(2);
if (!existsSync(file)) {
  if (!process.env.ANNOTATE) console.log(`### ${heading}\n\nNo report (${file}): the run broke before its tests did (the build? the server?).`);
  process.exit(process.env.VERDICT ? 1 : 0);
}
const report = JSON.parse(readFileSync(file, 'utf8')) as { suites: Suite[] };
const rows: { where: string; title: string; failed: number; runs: number; error: string }[] = [];
const walk = (s: Suite, path: string[]) => {
  for (const sp of s.specs ?? [])
    for (const t of sp.tests) {
      const ran = t.results.filter((r) => r.status !== 'skipped'), bad = ran.filter((r) => r.status !== 'passed');
      if (!ran.length) continue;
      const error = (bad[0]?.error?.message ?? bad[0]?.status ?? '').replace(/\u001b\[[0-9;]*m/g, '').split('\n')[0].slice(0, 160);
      rows.push({ where: `e2e/${sp.file}:${sp.line}`, title: [...path, sp.title].join(' › '), failed: bad.length, runs: ran.length, error });
    }
  for (const c of s.suites ?? []) walk(c, c.title && !c.title.endsWith('.ts') ? [...path, c.title] : path);
};
for (const s of report.suites) walk(s, []);

// a test repeated N times shows once, its failures summed
const merged = new Map<string, (typeof rows)[number]>();
for (const r of rows) {
  const k = `${r.where} ${r.title}`, m = merged.get(k);
  if (m) (m.failed += r.failed), (m.runs += r.runs);
  else merged.set(k, { ...r });
  if (m && !m.error) m.error = r.error;
}
/** the browser or Playwright's link to it failing, not the test: no test can do better */
const ENV = /Cannot find parent object browser@|Browser closed|browser has disconnected/;
const list = [...merged.values()].filter((r) => r.failed).sort((a, b) => b.failed - a.failed);
const env = list.filter((r) => ENV.test(r.error));
if (process.env.ANNOTATE) {
  for (const r of list) {
    const [f, line] = r.where.split(':');
    console.log(`::warning file=app/${f},line=${line},title=${heading}::${r.title} (failed ${r.failed} of ${r.runs})`);
  }
} else {
  console.log(`### ${heading}\n`);
  if (!list.length) console.log('None.');
  for (const r of list) console.log(`- \`${r.where}\` ${r.title}: failed ${r.failed} of ${r.runs}${env.includes(r) ? ' (the browser crashed: environment, not the test)' : ''}. ${r.error.replace(/`/g, "'")}`);
}
// (a run that failed with no failed test in its report broke some other way: red)
if (process.env.VERDICT && (!list.length || list.length > env.length)) process.exit(1);
