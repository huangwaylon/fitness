// What the gate missed (docs/ops/testing.md "The gate"): the full logic tier's failing specs that the gate of the
// deployed commit didn't run, with that commit's changed files, so the next impact rule (e2e/impact.json) is plain.
//
//   node scripts/e2e-missed.ts <gate-plan dir> <report.json…>
//     <gate-plan dir>: the Deploy UI run's `gate-plan` artifact (sel/specs.txt, sel/x3.txt, sel/changed.txt);
//     reports: the full tier's Playwright JSON reports. Markdown for the job summary on stdout, a ::warning per spec on
//     stderr. Exit 0 whatever it finds.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Result = { status: string };
type Spec = { file: string; tests: { results?: Result[] }[] };
type Suite = { specs?: Spec[]; suites?: Suite[] };

/** the spec files with a test that never passed (a retry passing is a flake, not a failure) */
export function failedSpecs(reports: { suites?: Suite[] }[]): string[] {
  const out = new Set<string>();
  const walk = (s: Suite) => {
    for (const sp of s.specs ?? [])
      for (const t of sp.tests) {
        const ran = (t.results ?? []).filter((r) => r.status !== 'skipped');
        if (ran.length && !ran.some((r) => r.status === 'passed')) out.add(sp.file.split('/').pop()!);
      }
    for (const c of s.suites ?? []) walk(c);
  };
  for (const r of reports) for (const s of r.suites ?? []) walk(s);
  return [...out].sort();
}

/** the failed specs the gate didn't run (its plan's spec files, e2e/ paths) */
export const missed = (failed: string[], ran: string[]) => failed.filter((f) => !ran.some((r) => r.split('/').pop() === f));

/** the impact.json rules to consider for the missed specs: each changed source directory (src/, content/) to them */
export function rulesFor(miss: string[], changed: string[]): string[] {
  const dirs = [...new Set(changed.filter((f) => /^(src|content)\//.test(f) && !f.endsWith('.test.ts')).map((f) => f.slice(0, f.lastIndexOf('/'))))].sort();
  const specs = JSON.stringify(miss.map((f) => f.replace(/\.spec\.ts$/, '')));
  return dirs.slice(0, 8).map((d) => `["${d}/**", ${specs}],`);
}

if (import.meta.main) {
  const [dir, ...files] = process.argv.slice(2);
  const lines = (f: string) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf8').split('\n').filter(Boolean) : null);
  const ran = lines('sel/specs.txt'), x3 = lines('sel/x3.txt') ?? [], changed = lines('sel/changed.txt') ?? [];
  const failed = failedSpecs(files.filter(existsSync).map((f) => JSON.parse(readFileSync(f, 'utf8'))));
  console.log('### Failed here, not run by the gate\n');
  if (!ran) console.log(`No gate plan (${dir}/sel/specs.txt): a dispatch, or the Deploy UI run's artifact expired.`);
  else {
    const miss = missed(failed, [...ran, ...x3]);
    if (!miss.length) console.log(failed.length ? `None: every failing spec (${failed.join(', ')}) was in the gate's selection.` : 'None.');
    else {
      const files = changed.length ? `${changed.slice(0, 15).join(', ')}${changed.length > 15 ? `, +${changed.length - 15} more` : ''}` : 'unknown (a plan from before 2026-11-09)';
      console.log(`The gate didn't select ${miss.length} failing spec${miss.length > 1 ? 's' : ''}. If the commit broke ${miss.length > 1 ? 'them' : 'it'}, add an e2e/impact.json rule from the file that did to the spec.\n`);
      for (const f of miss) console.log(`- \`e2e/${f}\``);
      console.log(`\nThe commit's changed files: ${files}`);
      const rules = rulesFor(miss, changed);
      if (rules.length) console.log(`\nThe e2e/impact.json rule for the directory that broke ${miss.length > 1 ? 'them' : 'it'} (merge into its existing rule, if there is one):\n\n\`\`\`json\n${rules.join('\n')}\n\`\`\`\n`);
      for (const f of miss) console.error(`::warning file=app/e2e/${f},title=Missed by the gate::${f} failed in the full logic tier but the gate didn't run it: an e2e/impact.json rule for the change that broke it?`);
    }
  }
}
