// 英語すごろく's mini-games, the games themselves by id (registry.ts the light list): each a pure state machine
// (types.ts MiniGame), loaded with the rules (online.ts, the sheet).
import { market, type MarketState } from './market.ts';
import { spell, type SpellState } from './spell.ts';
import { together, type TogetherState } from './together.ts';
import { sort, type SortState } from './sort.ts';
import { chain, type ChainState } from './chain.ts';
import { numbers, type NumbersState } from './numbers.ts';
import { shopping, type ShoppingState } from './shopping.ts';
import type { MiniGame, MiniId } from './types.ts';

export interface MiniStates { market: MarketState; spell: SpellState; together: TogetherState; sort: SortState; chain: ChainState; numbers: NumbersState; shopping: ShoppingState }
/** A game's state with its id (the phase's: game.ts). */
export type MiniState = { [K in MiniId]: { id: K; s: MiniStates[K] } }[MiniId];

export const GAMES: { readonly [K in MiniId]: MiniGame<MiniStates[K]> } = { market, spell, together, sort, chain, numbers, shopping };
