// すうじ ラッシュ's lane (round/registry.ts, its own chunk; games/listenLane.ts): 8 customers from the `listened` rush
// files at the lobby's place, each player's ticket at their own ear, しょうぶ paid by expectation; my row's picks as the
// chips authored, the other register's passes left out. Its pages: components/kikimimi/rush/views.ts.
import { listenLane } from '../listenLane.ts';
import { RUSH, rushDeal, rushGameOf, rushRecord } from './def.ts';

export const lane = listenLane(RUSH, rushDeal, { game: rushGameOf, record: rushRecord });
