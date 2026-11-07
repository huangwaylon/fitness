// たちぎき on this phone (components/kikimimi/tachi/board.ts) and the party bed it plays under (clipPlayer.svelte.ts):
// my part of the speakers, the easy start, a line as its own clip; the bed shipped as W2-A made it.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { clipIds } from '#lib/kikimimi/bank.ts';
import { EMPTY, SHARED, tachiOpts, type TachiCard } from '#lib/kikimimi/games/tachi/def.ts';
import { PARTY_BED } from '../clipPlayer.svelte.ts';
import { easy, fresh, isCoop, lineItem, okFor, partOf, roleOf } from './board.ts';

const APP = join(import.meta.dirname, '../../../../..');
const card = {
  id: 'tachi-x', lines: [{ who: 'tangy', en: 'One.', ja: '一。' }, { who: 'dom', en: 'Two.', ja: '二。', at: -0.3 }, { who: 'lopez', en: 'Three.', ja: '三。' }],
  bed: 'party', quietReveal: true, tachi: { row: 'tachi-x-op', type: 'opinions', k: 0, conv: 0, who: ['tangy', 'dom', 'lopez'], claims: ['a', 'b', 'c'], answer: [1, 2, 0] }
} as unknown as TachiCard;

describe('たちぎき on this phone', () => {
  it('co-op: role 0 follows the first speaker, role 1 the second, the third shared', () => {
    const solo = { players: [{}], vs: false, roles: {} } as never, two = { players: [{}, {}], vs: false, roles: { A: 0, B: 1 } } as never;
    expect([isCoop(solo), isCoop(two), roleOf(solo, 'A'), roleOf(two, 'B')]).toEqual([false, true, null, 1]);
    expect([0, 1, 2].map((f) => partOf(1, f))).toEqual(['theirs', 'mine', 'shared']);
    expect(partOf(null, 0)).toBeNull();
  });

  it('easy below the deck’s place: the shared speaker’s claim placed from the start', () => {
    expect([1, 2].map((ear) => easy({ o: tachiOpts.encode({ lv: 4, timer: 30, ear }) }))).toEqual([true, false]);
    expect(fresh(card, true)).toEqual([EMPTY, SHARED, EMPTY]);
    expect(fresh(card, false)).toEqual([EMPTY, EMPTY, EMPTY]);
    expect([okFor(card, { k: 1, a: [1, 2, 0] }), okFor(card, { k: 1, a: [1, 0, 2] }), okFor(card, null)]).toEqual([true, false, false]);
  });

  it('a line replayed alone: its own clip, its bed with it', () => {
    const l = lineItem(card, 1);
    expect(clipIds(l)).toEqual(['tachi-x-2']);
    expect([l.en, l.speaker, (l as TachiCard).bed]).toEqual(['Two.', 'dom', 'party']);
  });

  it('ships the party bed W2-A made, its hash in its name', () => {
    const shipped = readFileSync(join(APP, 'static/audio', PARTY_BED)), made = readFileSync(join(APP, 'scripts/tts/beds/party.m4a'));
    const sha8 = createHash('sha256').update(made).digest('hex').slice(0, 8);
    expect(PARTY_BED, 'the bed was made again: copy scripts/tts/beds/party.m4a to static/audio/beds/party.<sha8>.m4a and rename PARTY_BED').toBe(`beds/party.${sha8}.m4a`);
    expect(shipped.equals(made)).toBe(true);
  });
});
