// まるごと 聞く's lane (round/registry.ts, its own chunk; games/listenLane.ts): one piece from the `listened` long files at
// the content's place, the host's (its options' `piece`: the sheet's pick, from my answers, def.ts pieceFor), each player
// at their own ear, my row's choices as `pick`. Its pages: components/kikimimi/long/views.ts.
import { listenLane } from '../listenLane.ts';
import { LONG, longDeal, longGame, longOpts, type LongCard, type LongOpts, type LongRound } from './def.ts';

export const lane = listenLane<LongCard, LongRound, LongOpts>(LONG, (_seed, parts, o) => longDeal(parts, o), {
  codec: longOpts,
  game: longGame,
  lobby: ({ focus }) => ({ piece: focus ?? 0 })
});
