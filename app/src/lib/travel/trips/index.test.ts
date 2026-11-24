// A guide's chunk not loaded (trips/index.ts loadTrip): counted for the log (`swallow:trip.load`), still a rejection.
import { describe, expect, it, vi } from 'vitest';
import { quietSink } from '#lib/quiet.ts';

vi.mock('./zao.ts', () => {
  throw new TypeError('Importing a module script failed.');
});
const { loadTrip } = await import('./index.ts');

describe('loadTrip', () => {
  it('a guide that did not load is counted and rejects; one that did is its data', async () => {
    const tags: string[] = [];
    quietSink((t) => tags.push(t), () => {});
    await expect(loadTrip('zao')).rejects.toThrow();
    expect((await loadTrip('okinawa')).id).toBe('okinawa');
    expect(tags).toEqual(['trip.load']);
  });
});
