// The variety set (content/variety.ts): US voices only, the situations it was written for, and its wait for voices: its
// items join the bank (source.ts joined) as each one's clips are made, so levels 4 and 6 stay offered meanwhile. Its
// shape (counts, ids, families, clip length) is content/sets.test.ts's; everything the bank holds items to bank.test's,
// staging.test's and near-dupes.test's (they read every item as written).
import { describe, expect, it } from 'vitest';
import { clipIds, isDialogue } from '../bank.ts';
import { AUTHORED, BANK, joined } from '../source.ts';
import clipsJson from '../clips.json';
import { playable } from '../compile.ts';
import { MORI_FAMILY, MORI_DIALOGUES, MORI_ITEMS, YAMA_DIALOGUES, YAMA_FAMILY, YAMA_ITEMS } from './variety.ts';
import { WAITING } from './index.ts';

const ALL = [...MORI_ITEMS, ...MORI_DIALOGUES, ...YAMA_ITEMS, ...YAMA_DIALOGUES];
const spoken = ALL.flatMap((it) => (isDialogue(it) ? it.lines.map((l) => l.en) : [it.en])).join(' ');

describe('kikimimi variety set', () => {
  it('every voice American: each item and line a US cast voice', () => {
    for (const it of ALL) {
      expect(it.voice, it.id).toBe('us');
      expect(it.cast, it.id).toMatch(/^us-/);
      for (const l of it.lines ?? []) expect(l.cast, it.id).toMatch(/^us-/);
    }
  });

  it('the thin situations, each in both sets', () => {
    for (const fam of [MORI_FAMILY, YAMA_FAMILY])
      expect(new Set(Object.values(fam))).toEqual(new Set(['event', 'town', 'social', 'home', 'tech', 'dating', 'family', 'tokyo']));
    // none of the overused settings (docs/reviews/2026-11-06-us-english-proofread.md)
    expect(spoken).not.toMatch(/refund|Osaka|oat milk|key code|Kyoto|hotel|landlord|clinic|pharmacy|doctor/i);
  });

  it('waits for its voices: in the bank only once voiced, the levels it’s filed under still offered', () => {
    expect(ALL.every((it) => WAITING.has(it.id) && AUTHORED.some((a) => a.id === it.id))).toBe(true);
    const clips: Record<string, unknown> = clipsJson;
    for (const it of ALL) expect(BANK.some((b) => b.id === it.id), it.id).toBe(clipIds(it).every((id) => id in clips));
    // one voiced: it joins, the rest still wait
    const one = MORI_DIALOGUES[0];
    const more = { ...clips, ...Object.fromEntries(clipIds(one).map((id) => [id, { dur: 3, hash: '00000000' }])) };
    expect(joined(more).filter((it) => WAITING.has(it.id)).map((it) => it.id)).toEqual(ALL.filter((it) => it === one || clipIds(it).every((id) => id in clips)).map((it) => it.id));
    expect(playable(clips)).toEqual(expect.arrayContaining([4, 6]));
  });
});
