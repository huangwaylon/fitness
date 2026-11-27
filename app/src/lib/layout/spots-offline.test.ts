// The outdoor catalogue's table failing to load (offline, its chunk not cached: code review 2026-11-27): the day's
// spots are picked without it, as before 5844dd0bb, never none for the session. (Its own file: the table mocked away.)
import { expect, test, vi } from 'vitest';
import { defaultLayout, withChanges } from './model.ts';
import { daySpots } from './spots.ts';
import { loadOutdoor, outdoorFailed, outdoorReady } from './outdoor.ts';

vi.mock('./outdoor.json', () => {
  throw new Error('offline');
});

test('a failed load: the spots picked without the table', async () => {
  const l = withChanges(defaultLayout(), { set: [{ id: 'o-bench', k: 'nh-f12688', x: 3, z: 30, f: 0 }] });
  expect(daySpots(l, '2026-11-26', 'island-fund')).toEqual({ lawn: [], dig: [] });
  await expect(loadOutdoor()).rejects.toThrow();
  expect([outdoorReady(), outdoorFailed()]).toEqual([false, true]);
  const s = daySpots(l, '2026-11-26', 'island-fund');
  expect(s.dig).toHaveLength(8);
  expect(s.lawn).toHaveLength(15);
});
