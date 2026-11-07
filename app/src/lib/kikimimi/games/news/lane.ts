// しずえの ニュース's lane (round/registry.ts, its own chunk; games/listenLane.ts): the day's bulletin from the `listened`
// news files at the content's place, the lobby's seed the Tokyo day (one bulletin a day, by the scene clock: a `?date=`
// preview too), its options carrying the host's weather for today (the relay's timeline this phone holds: sync/wx.ts),
// so every phone deals and grades the same tail; each player at their own ear, my row's choices as `pick`. Its pages:
// components/kikimimi/news/views.ts.
import { tokyoDay } from '../../../contract/live-protocol.ts';
import { heldWx } from '../../../sync/wx.ts';
import { now } from '../../../time/clock.ts';
import { listenLane } from '../listenLane.ts';
import { NEWS, newsDeal, newsGame, newsOpts, type NewsCard, type NewsOpts, type NewsRound } from './def.ts';
import { newsWxOf } from './weather.ts';

export const lane = listenLane<NewsCard, NewsRound, NewsOpts>(NEWS, (seed, parts, o) => newsDeal(seed, parts, o?.wx ?? null), {
  codec: newsOpts,
  game: newsGame,
  lobby: () => ({ wx: newsWxOf(heldWx(), now().getTime()) }),
  seed: () => tokyoDay(now().getTime())
});
