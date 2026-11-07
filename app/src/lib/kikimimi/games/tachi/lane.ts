// たちぎき's lane (round/registry.ts, its own chunk; games/listenLane.ts): two conversations from the `listened` tachi
// files at the lobby's place, each player at their own ear, my answers as the row's `pick`. Its pages:
// components/kikimimi/tachi/views.ts.
import { listenLane } from '../listenLane.ts';
import { TACHI, tachiDeal } from './def.ts';

export const lane = listenLane(TACHI, tachiDeal);
