// The deploy's gate (scripts/deploy-gate.ts): green only with every gate job there once and `success`.
import { describe, expect, it } from 'vitest';
import { jobsOfNeeds, verdict, type Job } from '../../scripts/deploy-gate.ts';

const gate = ['build', 'checks', 'e2e-gate (1)', 'e2e-gate (2)'];
const ok = (name: string): Job => ({ name, status: 'completed', conclusion: 'success' });
const all = () => [...gate.map(ok), { name: 'deploy', status: 'in_progress', conclusion: null }];

describe('deploy gate', () => {
  it('is green with every job a success', () => expect(verdict(gate, all())).toBe('green'));

  it('waits for a job running or not there yet', () => {
    const jobs = all();
    jobs[1] = { name: 'checks', status: 'in_progress', conclusion: null };
    expect(verdict(gate, jobs)).toBe('wait: checks in_progress');
    expect(verdict(gate, all().filter((j) => j.name !== 'e2e-gate (2)'))).toBe('wait: e2e-gate (2) missing');
  });

  it('is red for any other conclusion', () => {
    for (const conclusion of ['failure', 'cancelled', 'skipped', 'neutral', 'timed_out', 'action_required', null]) {
      const jobs = all();
      jobs[2] = { name: 'e2e-gate (1)', status: 'completed', conclusion };
      expect(verdict(gate, jobs)).toBe(`red: e2e-gate (1) ${conclusion}`);
    }
  });

  it('is red even while others still run', () => {
    const jobs = all();
    jobs[0] = { name: 'build', status: 'in_progress', conclusion: null };
    jobs[3] = { name: 'e2e-gate (2)', status: 'completed', conclusion: 'failure' };
    expect(verdict(gate, jobs)).toBe('red: e2e-gate (2) failure');
  });

  it('is red for a job twice, a job not in GATE (a new shard), or no GATE', () => {
    expect(verdict(gate, [...all(), ok('checks')])).toBe('red: checks 2 times');
    expect(verdict(gate, [...all(), ok('e2e-gate (3)')])).toBe('red: not in GATE: e2e-gate (3)');
    expect(verdict([], all())).toBe('red: GATE is empty');
  });
});

describe('deploy gate on the deploy job\'s needs (pages.yml: no API)', () => {
  const G = ['plan', 'checks', 'unit', 'e2e-gate'];
  const needs = (o: Record<string, string> = {}) => Object.fromEntries(G.map((n) => [n, { result: o[n] ?? 'success' }]));
  it('is green with every needed job a success', () => expect(verdict(G, jobsOfNeeds(needs()))).toBe('green'));
  it('is red for a failed, cancelled or skipped one (a red shard fails the matrix)', () => {
    for (const r of ['failure', 'cancelled', 'skipped']) expect(verdict(G, jobsOfNeeds(needs({ 'e2e-gate': r })))).toBe(`red: e2e-gate ${r}`);
  });
  it('is red for a job needed but not in GATE, or one in GATE not needed', () => {
    expect(verdict(G, jobsOfNeeds({ ...needs(), lint: { result: 'success' } }))).toBe('red: not in GATE: lint');
    expect(verdict([...G, 'lint'], jobsOfNeeds(needs()))).toBe('wait: lint missing');
  });
});
