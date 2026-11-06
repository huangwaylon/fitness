// しずえの しゅうまつ たいかい's lane (round/registry.ts): its deck the open's ids (the host's pick), their levels' chunks
// in first; a player who joins, their tier by their comfortable level. Its lobby, show and results are its own pages
// (components/kikimimi/taikai/views.ts).
import type { Lane } from '../../round/registry.ts';
import { taikaiGame, tierOf, type TaikaiOpts } from './def.ts';
import { taikaiDeck, taikaiLevels, taikaiSource } from './source.ts';

export const taikaiLane: Lane<TaikaiOpts> = {
  id: 'taikai',
  def: () => taikaiGame(taikaiSource),
  chunks: ({ ids }) => taikaiLevels(ids ?? []),
  deal: (d) => taikaiDeck(d.seed, d.ids ?? []),
  byIds: true,
  myTier: (_u, my) => tierOf(my.level),
  title: { lobby: 'kiki.mode.taikai' }
};
