// `npm run gas:deploy`: push the committed Code.js to the bound script, cut a version, point the web app's one
// deployment at it (same /exec URL) and wait for `health` to answer the new build. Needs `clasp login` once and
// app/apps-script/.clasp.json (gitignored: the repo is public) with scriptId, rootDir "." and deploymentId.
// Runbook: docs/ops/runbook.md#2-redeploy-the-apps-script.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { OUT_FILE, buildHash } from './build.ts';

const DIR = fileURLToPath(new URL('../apps-script/', import.meta.url));
const CLASP = ['-y', '@google/clasp@3.4.1'];

function clasp(...args: string[]): string {
  return execFileSync('npx', [...CLASP, ...args], { cwd: DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
}

function fail(msg: string): never {
  console.error(`gas:deploy: ${msg}`);
  process.exit(1);
}

const project = JSON.parse(readFileSync(`${DIR}.clasp.json`, 'utf8'));
const deploymentId: string = project.deploymentId ?? fail('add "deploymentId" (the /exec one) to apps-script/.clasp.json');

const build = buildHash();
const committed = /^\/\/ build: (\w+)$/m.exec(readFileSync(OUT_FILE, 'utf8'))?.[1];
if (committed !== build) fail(`Code.js is build ${committed}, the source is ${build}: run npm run gas:build and commit`);

process.stdout.write(clasp('push', '--force'));
const version = /Created version (\d+)/.exec(clasp('version', `build ${build}`))?.[1] ?? fail('clasp made no version');
process.stdout.write(clasp('redeploy', deploymentId, '-V', version, '-d', `build ${build}`));

// /exec redirects a POST to a GET on googleusercontent.com; fetch follows it like curl -L.
const url = `https://script.google.com/macros/s/${deploymentId}/exec`;
for (let i = 0; i < 10; i++) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'health' })
  }).catch(() => null);
  const live = res?.ok ? ((await res.json().catch(() => null)) as { build?: string } | null)?.build : undefined;
  if (live === build) {
    console.log(`live: version ${version}, build ${build}`);
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 3000));
}
fail(`deployed version ${version}, but health doesn't answer build ${build} yet`);
