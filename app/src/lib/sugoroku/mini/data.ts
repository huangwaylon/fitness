// みんなで！'s written content (docs/sugoroku.md "みんなで！"): おつかい's things and lists, 返事はどれ？'s exchanges. Their own
// lazy chunks (vite.config.ts FEATURE_CHUNK: the `sg` group, cached on first use, not precached), loaded with the words and
// lines (the fold's Ctx `mini`); a deal copies what its rounds use into the game's state, so a play or a close never reads
// them.
import { once } from '#lib/once.ts';
import type { ShopItem, ShopList } from './shopping.ts';
import type { Exchange } from './reply.ts';

export interface MiniData {
  shop: { items: readonly ShopItem[]; lists: readonly ShopList[] };
  replies: readonly Exchange[];
}

export const loadMiniData: () => Promise<MiniData> = once(() =>
  Promise.all([import('./data/shopping.json'), import('./data/replies.json')]).then(([s, r]) => ({
    shop: { items: s.default.items as ShopItem[], lists: s.default.lists as ShopList[] },
    replies: r.default as Exchange[]
  })));
