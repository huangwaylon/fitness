import { describe, expect, it } from 'vitest';
import { COMPAT } from '#lib/contract/compat.ts';
import { incompatible, takeUpdate, type UpdateState } from './update.ts';

const s = (o: Partial<UpdateState>): UpdateState => ({ updated: true, ready: true, incompatible: false, busy: false, hidden: false, ...o });

describe('when a deployed build is taken (update.ts)', () => {
  it('never in front for an ordinary deploy: as the app is hidden, its worker in, nothing open', () => {
    expect(takeUpdate(s({}))).toBe(false);
    expect(takeUpdate(s({ hidden: true }))).toBe(true);
    expect(takeUpdate(s({ hidden: true, busy: true })), 'a sheet open: kept for the next hide or launch').toBe(false);
    expect(takeUpdate(s({ hidden: true, ready: false })), 'before its worker: the old shell again').toBe(false);
    expect(takeUpdate(s({ hidden: true, updated: false }))).toBe(false);
  });
  it('a build this one can\'t work with: in front too, but only once nothing is open', () => {
    expect(takeUpdate(s({ incompatible: true }))).toBe(true);
    expect(takeUpdate(s({ incompatible: true, busy: true }))).toBe(false);
    expect(takeUpdate(s({ incompatible: true, ready: false }))).toBe(false);
  });
  it('incompatible: version.json\'s compat past this build\'s; none or not a number is compatible', () => {
    expect(incompatible(COMPAT + 1)).toBe(true);
    expect(incompatible(COMPAT)).toBe(false);
    expect(incompatible(COMPAT - 1)).toBe(false);
    expect(incompatible(undefined)).toBe(false);
    expect(incompatible('9')).toBe(false);
  });
});
