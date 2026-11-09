// 音の へんしん's phrases in おさらい (srs.ts practicePicks over this build's index): a missed phrase comes back through
// another phrase of its phenomenon, another voice and sentence (docs/kikimimi.md "Adaptivity"); none comes without a due card.
import { describe, expect, it } from 'vitest';
import { ENTRIES, entryOf } from '../../pool.ts';
import { practicePicks } from '../../srs.ts';
import { statsOf, type Answer } from '../../progress.ts';
import { phenomenonOf } from '../../henshin.ts';

const today = '2026-11-09';
const picks = (answers: Answer[]) => practicePicks({ answers, stats: statsOf(answers, today), today, seed: 1, levels: [3, 4] }).ids;

describe('音の へんしん: おさらい', () => {
  it('a missed phrase comes back through another phrase of its phenomenon; none comes without a due card', () => {
    const drill = ENTRIES.filter((e) => e.lv === 8);
    expect(drill.length).toBeGreaterThanOrEqual(12);
    const miss = drill[0];
    const back = picks([{ id: miss.id, ok: false, pick: 1, rp: 0, d: '2026-11-08', g: 'g1', lv: 8, p: false }]).filter((id) => entryOf(id)?.lv === 8);
    expect(back).toHaveLength(1);
    expect(back[0]).not.toBe(miss.id);
    expect(phenomenonOf(entryOf(back[0])!)).toBe(phenomenonOf(miss));
    expect(picks([]).filter((id) => entryOf(id)?.lv === 8)).toEqual([]);
  });
});
