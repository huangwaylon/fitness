// The e2e quarantine (docs/ops/testing.md "Tags"): the tests tagged @quarantine, each with who owns it and why.
// `node scripts/e2e-quarantine.ts`: lists them (Markdown, for a job summary); exits 1 when one has no
// `annotation: { type: 'quarantine', description: 'owner: …' }`: a quarantined test nobody owns is a deleted test.
import { execFileSync } from 'node:child_process';

type Spec = { title: string; file: string; line: number; tags?: string[]; tests: { annotations?: { type: string; description?: string }[] }[] };
type Suite = { title: string; specs?: Spec[]; suites?: Suite[] };

const json = execFileSync('npx', ['playwright', 'test', '--list', '--reporter=json', '--project=chromium', '--grep', '@quarantine', '--pass-with-no-tests'], { encoding: 'utf8', maxBuffer: 64 << 20 });
const report = JSON.parse(json.slice(json.indexOf('{'))) as { suites: Suite[] };
const rows: { where: string; title: string; why: string | null }[] = [];
const walk = (s: Suite) => {
  for (const sp of s.specs ?? []) {
    const a = sp.tests.flatMap((t) => t.annotations ?? []).find((x) => x.type === 'quarantine');
    rows.push({ where: `e2e/${sp.file}:${sp.line}`, title: sp.title, why: a?.description && /owner:/i.test(a.description) ? a.description : null });
  }
  for (const c of s.suites ?? []) walk(c);
};
for (const s of report.suites) walk(s);

console.log(`### The e2e quarantine (${rows.length})\n`);
if (!rows.length) console.log('Empty.');
for (const r of rows) console.log(`- \`${r.where}\` ${r.title}: ${r.why ?? '**no owner** (add `annotation: { type: \'quarantine\', description: \'owner: …, since …, why\' }`)'}`);
if (rows.some((r) => !r.why)) process.exit(1);
