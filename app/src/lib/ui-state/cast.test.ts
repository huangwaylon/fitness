import { afterEach, describe, expect, it } from 'vitest';
import { islandActors, othersOf, setCast, setGuestHere } from './cast.ts';

describe('the island’s villagers (whose life is shared: 2026-11-06)', () => {
  afterEach(() => (setCast('A'), setGuestHere(false)));

  it('a member’s phone: mine and the partner’s, and the guest’s while its app is open', () => {
    setCast('A');
    expect(islandActors()).toEqual(['mine', 'partner']);
    expect(othersOf('mine')).toEqual(['partner']);
    setGuestHere(true);
    expect(islandActors()).toEqual(['mine', 'partner', 'third']);
    expect(othersOf('third')).toEqual(['mine', 'partner']);
  });

  it('the guest’s phone: all three, its own and both members’', () => {
    setCast('G');
    expect(islandActors()).toEqual(['mine', 'partner', 'third']);
    expect(othersOf('mine')).toEqual(['partner', 'third']);
  });
});
