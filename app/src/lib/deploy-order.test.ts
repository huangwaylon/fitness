// The deploy's order guard (scripts/deploy-order.ts): never older code over newer, red when not sure.
import { describe, expect, it } from 'vitest';
import { decide, type Facts } from '../../scripts/deploy-order.ts';

const f = (o: Partial<Facts>): Facts => ({ mine: 'm', live: 'l', liveFromMine: 'behind', mainFromMine: 'identical', dispatch: false, ...o });

describe('deploy order', () => {
  it('deploys over an older live commit (main at mine or past it)', () => {
    expect(decide(f({}))).toMatchObject({ deploy: true });
    expect(decide(f({ mainFromMine: 'ahead' }))).toMatchObject({ deploy: true });
  });

  it('never deploys over a newer live commit, nor the live one again on a push', () => {
    expect(decide(f({ liveFromMine: 'ahead' }))).toMatchObject({ deploy: false });
    expect(decide(f({ liveFromMine: 'identical' }))).toMatchObject({ deploy: false });
  });

  it('a dispatch deploys the live commit again, never an older one', () => {
    expect(decide(f({ liveFromMine: 'identical', dispatch: true }))).toMatchObject({ deploy: true });
    expect(decide(f({ liveFromMine: 'ahead', dispatch: true }))).toMatchObject({ deploy: false });
  });

  it('skips a commit main no longer has', () => {
    expect(decide(f({ mainFromMine: 'diverged' }))).toMatchObject({ deploy: false });
    expect(decide(f({ mainFromMine: 'behind' }))).toMatchObject({ deploy: false });
  });

  it('after a force push: deploys only when the live commit is off main', () => {
    expect(decide(f({ liveFromMine: 'diverged', mainFromLive: 'diverged' }))).toMatchObject({ deploy: true });
    for (const mainFromLive of ['ahead', 'identical', 'behind', undefined] as const)
      expect(decide(f({ liveFromMine: 'diverged', mainFromLive }))).toHaveProperty('red');
  });

  it('is red with no live commit, or an order it does not know', () => {
    expect(decide(f({ live: null }))).toHaveProperty('red');
    expect(decide(f({ liveFromMine: 'weird' as never }))).toHaveProperty('red');
  });
});
