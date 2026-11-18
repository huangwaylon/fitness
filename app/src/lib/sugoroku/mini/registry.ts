// 英語すごろく's mini-games by id (docs/sugoroku.md "みんなで！"), light: what a みんなで！ stone's landing needs (game.ts:
// the two options) without the games themselves (games.ts). In the order they're built: the ★ four, then the next wave
// (しりとり, 数字キャッチ, おつかい, 返事はどれ？).
export const MINI_IDS = ['market', 'spell', 'together', 'sort', 'chain', 'numbers'] as const;
export type MiniId = (typeof MINI_IDS)[number];

export interface MiniInfo {
  /** How long it runs on everyone's phone at once (ms, the countdown aside: clock.ts). */
  ms: number;
  /** Passed round one phone: `hotseat` each seat in turn behind a cover (「Bに渡してね」, `turnMs` each), `shared`
   *  everyone on the phone at once (tiles in each seat's colour). */
  local: 'hotseat' | 'shared';
  turnMs?: number;
  /** One of the panel's first four (★): a game's first mini-game is one of them. */
  star: boolean;
}
export const MINIS: Readonly<Record<MiniId, MiniInfo>> = {
  market: { ms: 60_000, local: 'hotseat', turnMs: 20_000, star: true },
  spell: { ms: 60_000, local: 'hotseat', star: true },
  together: { ms: 90_000, local: 'shared', star: true },
  sort: { ms: 30_000, local: 'hotseat', turnMs: 20_000, star: true },
  // (turn by turn already: passed round, the phone goes round with the chain)
  chain: { ms: 60_000, local: 'shared', star: false },
  numbers: { ms: 30_000, local: 'hotseat', turnMs: 20_000, star: false }
};
export const isMiniId = (x: unknown): x is MiniId => (MINI_IDS as readonly unknown[]).includes(x);

/** How long a mini-game runs: online everyone at once; passed round, a hot-seat game's turns one after another. */
export const miniMs = (id: MiniId, seats: number, local: boolean): number => {
  const m = MINIS[id];
  return local && m.local === 'hotseat' && m.turnMs ? m.turnMs * seats : m.ms;
};

/** The lander's two options from `pool` (seeded by the landing's random `r`): two not played in this game yet while
 *  there are (a game's first from the ★ ones), then the ones played longest ago. */
export function miniOptions(played: readonly MiniId[], r: () => number, pool: readonly MiniId[] = MINI_IDS): [MiniId, MiniId] {
  const fresh = pool.filter((id) => !played.includes(id) && (played.length > 0 || MINIS[id].star));
  if (fresh.length >= 2) {
    const a = fresh.splice(Math.floor(r() * fresh.length), 1)[0];
    return [a, fresh[Math.floor(r() * fresh.length)]];
  }
  const old = pool.filter((id) => played.includes(id)).sort((x, y) => played.lastIndexOf(x) - played.lastIndexOf(y));
  const [a, b] = [...fresh, ...old];
  return r() < 0.5 ? [a, b] : [b, a];
}
