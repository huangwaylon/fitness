// しずえの ニュース's lane (round/registry.ts, its own chunk): the day's bulletin from the `listened` news files at the
// content's place, the lobby's seed the Tokyo day (one bulletin a day, by the scene clock: a `?date=` preview too), its
// options carrying the host's weather for today (the relay's timeline this phone holds: sync/wx.ts), so every phone
// deals and grades the same tail; each player at their own ear, my row's choices as `pick`. Its pages:
// components/kikimimi/news/views.ts.
import { tokyoDay } from '../../../contract/live-protocol.ts';
import { heldWx } from '../../../sync/wx.ts';
import { now } from '../../../time/clock.ts';
import { INDEX, listenOf, type Unit } from '../../pool.ts';
import type { Lane } from '../../round/registry.ts';
import { tierOf } from '../taikai/def.ts';
import { cvOver, filesOf, rawOf } from '../listened.ts';
import { itemMs } from '../listenLane.ts';
import { NEWS, newsDeal, newsGame, newsOpts, newsRecord, type NewsCard, type NewsOpts } from './def.ts';
import { newsWxOf } from './weather.ts';

const chunks = ({ o }: { o: readonly number[] }): Unit[] => filesOf('news', newsOpts.decode(o)?.lv ?? 0, INDEX.listen) as Unit[];

export const lane: Lane<NewsOpts> = {
  id: 'news',
  def: (phone) => newsGame({
    cards: (seed, o) => phone.items({ gm: 'news', seed, o: newsOpts.encode({ ...(o as NewsOpts), ear: 0 }) }) as NewsCard[],
    playMs: itemMs,
    cv: (o) => cvOver(chunks({ o: newsOpts.encode(o as NewsOpts) }).map((u) => phone.cv('news', u)))
  }),
  chunks,
  deal: (d) => newsDeal(d.seed, chunks(d).flatMap((u) => listenOf(String(u)) ?? []), newsOpts.decode(d.o)?.wx ?? null),
  seed: () => tokyoDay(now().getTime()),
  myTier: (_u, my) => tierOf(my.level),
  opts: ({ lv, timer, level }) => newsOpts.encode({ lv: lv as NewsOpts['lv'], timer, ear: tierOf(level ?? null), wx: newsWxOf(heldWx(), now().getTime()) }),
  record: (v, items, rp, done) => {
    const o = newsOpts.decode(v.o);
    return o ? newsRecord(NEWS.rounds(items as NewsCard[], v.seed, o, itemMs), v.answers.map(rawOf), v.had, rp, done) : [];
  },
  title: { lobby: 'kiki.mode.news' }
};
