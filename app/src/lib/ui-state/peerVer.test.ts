import { describe, expect, it } from 'vitest';
import { newer, newerPeer } from './peerVer.ts';

describe('a partner on a newer app (the update hint)', () => {
  const mine = { b: '2026-11-22.ab12cd3', pr: 1, sv: 'k3x9' };

  it('a later protocol revision is newer; the same or an older one, or a page that said nothing, isn\'t', () => {
    expect(newer(mine, { pr: 2 })).toBe(true);
    expect(newer(mine, { ...mine })).toBe(false);
    expect(newer(mine, { b: '2026-11-25.0000000', pr: 1, sv: 'k3x9' })).toBe(false); // a later build, nothing that shows
    expect(newer(mine, { pr: 0 })).toBe(false);
    expect(newer(mine, {})).toBe(false);
    expect(newer(mine, undefined)).toBe(false);
  });

  it('other seat tables on a later build are newer (a seat mine lack shows them standing); on an older build, not', () => {
    expect(newer(mine, { b: '2026-11-23.0000000', pr: 1, sv: 'zzzz' })).toBe(true);
    expect(newer(mine, { b: '2026-11-21.0000000', pr: 1, sv: 'zzzz' })).toBe(false);
    expect(newer({ pr: 1 }, { b: '2026-11-23.0000000', pr: 1, sv: 'zzzz' })).toBe(false); // (mine unknown: a test page)
  });

  it('the first of the others on one', () => {
    expect(newerPeer(mine, { B: { ...mine }, G: { pr: 2 } })).toBe('G');
    expect(newerPeer(mine, { B: { ...mine } })).toBeNull();
    expect(newerPeer(mine, undefined)).toBeNull();
  });
});
