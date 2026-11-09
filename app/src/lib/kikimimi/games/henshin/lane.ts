// 音の へんしん's lane (round/registry.ts, its own chunk): 8 phrases from the level-8 chunk (the drill's: content/henshin.ts),
// 5 of the host's phenomenon of the day (its `focus`, from the lobby: the sheet's focus) and 3 before it; each player at
// their own ear; my row's answers graded by my rounds. Its pages: components/kikimimi/henshin/views.ts.
import { HENSHIN_LV } from '../../bank.ts';
import { itemMs } from '../../clips.ts';
import { levelItems } from '../../pool.ts';
import type { Lane } from '../../round/registry.ts';
import { tierOf } from '../taikai/def.ts';
import { rawOf } from '../listened.ts';
import { henshinDeal, henshinGame, henshinOpts, henshinRecord, henshinRounds, type HenshinCard, type HenshinOpts } from './def.ts';

export const lane: Lane<HenshinOpts> = {
  id: 'henshin',
  def: (phone) => henshinGame({
    cards: (seed, o) => phone.items({ gm: 'henshin', seed, o: henshinOpts.encode({ ...o, ear: 0 }) }) as HenshinCard[],
    playMs: itemMs,
    cv: () => phone.cv('henshin', HENSHIN_LV)
  }),
  chunks: () => [HENSHIN_LV],
  deal: (d) => henshinDeal(d.seed, levelItems(HENSHIN_LV), henshinOpts.decode(d.o)),
  myTier: (_u, my) => tierOf(my.level),
  opts: ({ timer, level, focus }) => henshinOpts.encode({ lv: HENSHIN_LV, timer, ear: tierOf(level ?? null), focus: focus ?? 0 }),
  record: (v, items, rp, done) => {
    const o = henshinOpts.decode(v.o), cards = items as HenshinCard[];
    return o ? henshinRecord(cards, henshinRounds(cards, v.seed, o, itemMs), v.answers.map(rawOf), v.had, rp, done) : [];
  },
  title: { lobby: 'kiki.mode.henshin' }
};
