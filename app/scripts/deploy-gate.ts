// The deploy's gate (.github/workflows/pages.yml, `deploy`): is every job of the gate green?
// `GATE=a,b,… node scripts/deploy-gate.ts needs.json` (needs.json: the deploy job's `toJSON(needs)`, each job's
// `result`; the matrix's shards as one) prints `green`, `wait: …` or `red: …`. It fails closed: each job in GATE
// exactly once, each `completed` with the conclusion `success`; any other result, or a job in neither GATE nor
// `deploy` (one added to `needs`, GATE not) is red. (No API: the workflow token's quota is per repo and hourly.)
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

/** The deploy job's `needs` (each job's `result`) as the jobs `verdict` reads: all of them finished. */
export const jobsOfNeeds = (needs: Record<string, { result: string }>): Job[] =>
  Object.entries(needs).map(([name, n]) => ({ name, status: 'completed', conclusion: n.result }));

if (import.meta.main) {
  const gate = (process.env.GATE ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const needs = JSON.parse(readFileSync(process.argv[2], 'utf8')) as Record<string, { result: string }>;
  console.log(verdict(gate, jobsOfNeeds(needs)));
}
