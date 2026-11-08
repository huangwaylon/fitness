// The deploy's gate (.github/workflows/pages.yml, `deploy`): is every gate job of this run attempt green?
// `GATE=a,b,… node scripts/deploy-gate.ts jobs.json` (jobs.json: the attempt's jobs, from the API) prints `green`,
// `wait: …` (one still running or not there yet) or `red: …`. It fails closed: each job in GATE exactly once, each
// `completed` with the conclusion `success`; any other conclusion, a job twice, or a job of the workflow in neither
// GATE nor `deploy` (a shard or job added, GATE not) is red.
import { readFileSync } from 'node:fs';

export type Job = { name: string; status: string; conclusion: string | null };

export function verdict(gate: string[], jobs: Job[]): string {
  if (!gate.length) return 'red: GATE is empty';
  const other = jobs.filter((j) => j.name !== 'deploy' && !gate.includes(j.name)).map((j) => j.name);
  if (other.length) return `red: not in GATE: ${other.join(', ')}`;
  const wait: string[] = [];
  for (const name of gate) {
    const js = jobs.filter((j) => j.name === name);
    if (js.length > 1) return `red: ${name} ${js.length} times`;
    const [j] = js;
    if (!j || j.status !== 'completed') wait.push(`${name} ${j ? j.status : 'missing'}`);
    else if (j.conclusion !== 'success') return `red: ${name} ${j.conclusion}`;
  }
  return wait.length ? `wait: ${wait.join(', ')}` : 'green';
}

if (import.meta.main) {
  const gate = (process.env.GATE ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const { jobs } = JSON.parse(readFileSync(process.argv[2], 'utf8')) as { jobs: Job[] };
  console.log(verdict(gate, jobs));
}
