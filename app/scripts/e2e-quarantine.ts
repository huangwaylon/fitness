// The e2e quarantine (docs/ops/testing.md "Tags"): the tests tagged @quarantine, each with who owns it and why.
// `node scripts/e2e-quarantine.ts`: lists them (Markdown, for a job summary); exits 1 when one has no
// `annotation: { type: 'quarantine', description: 'owner: …' }`: a quarantined test nobody owns is a deleted test.
//
// Playwright's list goes to a JSON file (never parsed out of stdout) and its exit code is not ours: a spec that throws
// as it loads (kikimimi-tile's readdirSync of build-pages, which `checks` never builds: runs 42322201114, 42331121941)
// fails the list, yet every other file's tests are in it. Such a file is a note in the summary, unless its source
// says @quarantine: then its owners can't be read, and that is red.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

type Spec = { title: string; file: string; line: number; tests: { annotations?: { type: string; description?: string }[] }[] };
type Suite = { title: string; specs?: Spec[]; suites?: Suite[] };
type LoadError = { message?: string; location?: { file: string; line: number } };

const dir = mkdtempSync(join(tmpdir(), 'e2e-quarantine-'));
const out = join(dir, 'list.json');
const run = spawnSync('npx', ['playwright', 'test', '--list', '--reporter=json', '--project=chromium', '--grep', '@quarantine', '--pass-with-no-tests'], {
  encoding: 'utf8',
  maxBuffer: 64 << 20,
  env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: out },
});
let report: { suites?: Suite[]; errors?: LoadError[] } | null = null;
try { report = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : null; } catch { /* below */ }
rmSync(dir, { recursive: true, force: true });
if (!report) {
  console.log(`### The e2e quarantine\n\n**Not listed**: \`playwright test --list\` wrote no report (exit ${run.status}).\n\n\`\`\`\n${`${run.stderr ?? ''}${run.stdout ?? ''}`.trim().slice(-2000)}\n\`\`\``);
  process.exit(1);
}

const rows: { where: string; title: string; why: string | null }[] = [];
const walk = (s: Suite, path: string[]) => {
  for (const sp of s.specs ?? []) {
    const a = sp.tests.flatMap((t) => t.annotations ?? []).find((x) => x.type === 'quarantine');
    rows.push({ where: `e2e/${sp.file}:${sp.line}`, title: [...path, sp.title].join(' › '), why: a?.description && /owner:/i.test(a.description) ? a.description : null });
  }
  for (const c of s.suites ?? []) walk(c, c.title && !c.title.endsWith('.ts') ? [...path, c.title] : path);
};
for (const s of report.suites ?? []) walk(s, []);

// a load error in a file without @quarantine hides none of the quarantine; one without a file (the config) hides all
const unread = (report.errors ?? []).map((e) => {
  const file = e.location?.file;
  const blind = !file || !existsSync(file) || readFileSync(file, 'utf8').includes('@quarantine');
  return { where: file ? `${relative(process.cwd(), file)}:${e.location!.line}` : 'playwright', why: (e.message ?? '').split('\n')[0], blind };
});

console.log(`### The e2e quarantine (${rows.length})\n`);
if (!rows.length) console.log('Empty.');
for (const r of rows) console.log(`- \`${r.where}\` ${r.title}: ${r.why ?? '**no owner** (add `annotation: { type: \'quarantine\', description: \'owner: …, since …, why\' }`)'}`);
if (unread.length) console.log(`\nNot loaded (${unread.length}):`);
for (const u of unread) console.log(`- \`${u.where}\` ${u.why}${u.blind ? ': **its quarantined tests can\'t be read**' : ' (no @quarantine in it)'}`);
if (rows.some((r) => !r.why) || unread.some((u) => u.blind)) process.exit(1);
