// listensOf: one player's listen rows, parsed and checked; another's, another kind, bad JSON or a bad row skipped.
import { describe, expect, it } from 'vitest';
import type { EventRow } from '#lib/contract/api.ts';
import { listenOf } from '#lib/contract/listen.ts';
import { listensOf } from './listens.ts';

const ok = { d: '2026-11-16', g: 'tvabcd', gm: 'tv', u: 'test', lv: 7, n: 1, ms: 1, r: [] };
const row = (who: 'A' | 'B', kind: EventRow[3], data: string): EventRow => ['', who, 'e', kind, data];

describe('listensOf', () => {
  it('mine only, listen only, each read; bad JSON and a bad row skipped', () => {
    const rows = [row('A', 'listen', JSON.stringify(ok)), row('B', 'listen', JSON.stringify(ok)), row('A', 'food', JSON.stringify(ok)), row('A', 'listen', '{'), row('A', 'listen', JSON.stringify({ ...ok, lv: 99 })), row('A', 'listen', JSON.stringify({ ...ok, u: 'two', f: 1 }))];
    expect(listensOf(rows, 'A', listenOf).map((r) => r.u)).toEqual(['test', 'two']);
  });
});
