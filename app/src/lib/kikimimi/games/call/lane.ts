// ようじ でんわ's lane (round/registry.ts, its own chunk; games/listenLane.ts): 3 calls (2 rounds each) from the
// `listened` call files at the lobby's place, each player's memo at their own ear, my row's wrong memo rows as `pick`.
// Its pages: components/kikimimi/call/views.ts.
import { listenLane } from '../listenLane.ts';
import { CALL, callDeal } from './def.ts';

export const lane = listenLane(CALL, callDeal);
