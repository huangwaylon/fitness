// ことば タイル's lane (round/registry.ts, its own chunk; games/listenLane.ts): 6 sentences from the `listened` tile files
// at the lobby's place, each player's board at their own ear, my row's wrong slots as `pick`. Its pages:
// components/kikimimi/tile/views.ts.
import { listenLane } from '../listenLane.ts';
import { TILE, tileDeal } from './def.ts';

export const lane = listenLane(TILE, tileDeal);
