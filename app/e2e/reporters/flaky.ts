// CI's e2e reporter (docs/ops/testing.md "Flakes"): with `retries: 1` a test that failed and then passed on its retry
// is green but flaky. This one names the flaky tests (a ::warning on each spec, a list in the job summary) and writes
// them to flaky.json (E2E_FLAKY_FILE), the run's entry in the flaky ledger (scripts/e2e-flakes.ts: ≥2 in 48 h and the
// gate leaves a test out; with the tests run and failed, so a shard that mostly broke reads as the runner's trouble); a test that failed every time is an ::error on its spec, and the run is red.
// (Playwright's own `github` reporter annotates a flaky test as an ::error, so CI doesn't use it.)
import { writeFileSync, appendFileSync } from 'node:fs';
import type { Reporter, Suite, TestCase } from '@playwright/test/reporter';

type Entry = { key: string; project: string; file: string; line: number; error: string };

/** a test's id across runs: its file (under e2e/), describes and title, as e2e/timings.json keys it */
const keyOf = (t: TestCase) => t.titlePath().slice(2).join(' › ');
const firstLine = (s = '') => s.replace(/\u001b\[[0-9;]*m/g, '').split('\n').find((l) => l.trim())?.trim().slice(0, 200) ?? '';
const esc = (s: string) => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

export default class FlakyReporter implements Reporter {
  private root!: Suite;
  onBegin(_config: unknown, suite: Suite) {
    this.root = suite;
  }

  printsToStdio() {
    return false;
  }

  onEnd() {
    const flaky: Entry[] = [], failed: Entry[] = [];
    let total = 0;
    for (const t of this.root.allTests()) {
      const outcome = t.outcome();
      if (outcome !== 'skipped') total++;
      if (outcome !== 'flaky' && outcome !== 'unexpected') continue;
      const bad = t.results.find((r) => r.status !== 'passed' && r.status !== 'skipped');
      const e: Entry = {
        key: keyOf(t),
        project: t.parent.project()?.name ?? '',
        file: `e2e/${t.titlePath()[2]}`,
        line: t.location.line,
        error: firstLine(bad?.error?.message ?? bad?.status)
      };
      (outcome === 'flaky' ? flaky : failed).push(e);
    }
    const at = (e: Entry) => `file=app/${e.file},line=${e.line}`;
    for (const e of failed) process.stdout.write(`::error ${at(e)},title=Failed e2e::${esc(`${e.key}: ${e.error}`)}\n`);
    for (const e of flaky) process.stdout.write(`::warning ${at(e)},title=Flaky e2e (passed on its retry)::${esc(`${e.key}: ${e.error}`)}\n`);
    if (flaky.length && process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `### Flaky e2e (${flaky.length}): failed, then passed on its retry\n\nGreen, and in the flaky ledger (\`npm run e2e:flakes\`): flaky in 2 runs in 48 h, the gate leaves it out till it's fixed.\n\n` +
          flaky.map((e) => `- \`${e.file}:${e.line}\` ${e.key} [${e.project}]: ${e.error.replace(/`/g, "'")}`).join('\n') + '\n\n'
      );
    // the ledger's entry: only a run with a flaky test writes one (the gate downloads every entry of the last 48 h)
    if (flaky.length && process.env.E2E_FLAKY_FILE)
      writeFileSync(
        process.env.E2E_FLAKY_FILE,
        JSON.stringify({ run: process.env.GITHUB_RUN_ID ?? '', sha: process.env.GITHUB_SHA ?? '', workflow: process.env.GITHUB_WORKFLOW ?? '', at: new Date().toISOString(), total, failed: failed.length, flaky }, null, 1) + '\n'
      );
  }
}
