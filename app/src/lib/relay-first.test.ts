// The deploy's relay guard (scripts/relay-first.ts): the app waits for a live relay that has the last relay commit.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decide, RELAY_PATHS } from '../../scripts/relay-first.ts';

describe('relay first', () => {
  it('passes once the live relay has the last relay commit', () => {
    expect(decide({ need: 'n', live: 'abc1234', order: 'identical' })).toEqual({ ok: true });
    expect(decide({ need: 'n', live: 'abc1234', order: 'ahead' })).toEqual({ ok: true });
  });

  it('waits on an older, diverged, unstamped, dirty or unreachable relay', () => {
    for (const order of ['behind', 'diverged', undefined] as const) expect(decide({ need: 'n', live: 'abc1234', order })).toHaveProperty('wait');
    expect(decide({ need: 'n', live: null })).toHaveProperty('wait');
    expect(decide({ need: 'n', live: 'abc1234-dirty', order: 'identical' })).toHaveProperty('wait');
  });

  it("covers relay.yml's shared paths (what the Worker bundles of the app and its/)", () => {
    const yml = readFileSync(new URL('../../../.github/workflows/relay.yml', import.meta.url), 'utf8');
    for (const p of RELAY_PATHS.filter((x) => !x.startsWith(':') && !x.startsWith('relay/'))) expect(yml).toContain(`'${p}${p.endsWith('.ts') ? '' : '/**'}'`);
  });
});
