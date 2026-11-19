// A みんなで！ stone's turn (docs/sugoroku.md "みんなで！"): the lander picks one of the two options (`mg`: online.ts, or
// the passed-round sheet), everyone present plays it (`mp`, from any seat: wire.ts's races, the log's order), and its
// close (`mc`, from anyone; or the game's own end, `done`) gives its stars to each seat that played, keeps what it made,
// marks the stone played (a ことば from then on) and ends the lander's turn. One path for both modes: pure, on the Game.
import type { Who } from '#lib/types.ts';
import { next, type Game, type MiniOn } from '../game.ts';
import { GAMES } from './games.ts';
import type { Ctx, Hand, MiniGame, Play } from './types.ts';

/** The game picked, as the contract's (its state's type is the id's: games.ts MiniStates). */
const gameOf = (id: MiniOn['id']) => GAMES[id] as MiniGame<unknown>;
/** The mini-game on (picked, not closed), or null. */
export const miniOn = (g: Game): MiniOn | null => (g.phase.k === 'mini' ? g.phase.on ?? null : null);

/** The lander picks option `b`: dealt to the seats `here` (those the lander's phone sees present; the lander always;
 *  null: everyone, passed round), `at` the phone's clock passed round. A game over as it's dealt (no line to give)
 *  closes at once. */
export function openMini(g: Game, b: 0 | 1, here: readonly Who[] | null, ctx: Ctx, at?: number): Game {
  const ph = g.phase;
  if (ph.k !== 'mini' || ph.on) return g;
  const lander = g.players[g.turn].who, id = ph.opts[b === 1 ? 1 : 0];
  const seats: Hand[] = g.players.filter((p) => !here || p.who === lander || here.includes(p.who)).map((p) => ({ who: p.who, level: p.level }));
  const used = {
    pictures: new Set(g.made.filter((m) => m.kind === 'picture').map((m) => m.text)),
    lines: new Set(g.made.filter((m) => m.kind === 'sentence').map((m) => m.text))
  };
  const s = gameOf(id).deal({ seed: `${g.seed}:${g.n}:mini`, seats, lander, used, ...(g.rules ? { rules: g.rules } : {}) }, ctx);
  const on = { id, s, here: seats.map((x) => x.who), ...(at !== undefined ? { at } : {}) } as MiniOn;
  const out: Game = { ...g, n: g.n + 1, phase: { ...ph, on } };
  return gameOf(id).done(s) ? closeMini(out) : out;
}

/** A play from `who` (a seat dealt in: one absent at the open only watches); its game's own end closes it. Nothing
 *  (the same game) when it takes nothing, or after the close. */
export function playMini(g: Game, who: Who, p: Play, ctx: Ctx): Game {
  const on = miniOn(g);
  if (!on || !on.here.includes(who) || g.phase.k !== 'mini') return g;
  const game = gameOf(on.id), s = game.play(on.s, who, p, ctx);
  if (s === on.s) return g;
  const out: Game = { ...g, n: g.n + 1, phase: { ...g.phase, on: { ...on, s } as MiniOn } };
  return game.done(s) ? closeMini(out) : out;
}

/** The close: each seat's stars, what it made, the stone played, the lander's turn over; the game as it closed kept for
 *  the results (`lastMini`: the play that closed it in). */
export function closeMini(g: Game): Game {
  const on = miniOn(g);
  if (!on) return g;
  const res = gameOf(on.id).close(on.s);
  const players = g.players.map((p) => ({ ...p, stars: p.stars + Math.max(0, res.stars[p.who] ?? 0) }));
  const idx = (w: Who) => Math.max(0, g.players.findIndex((p) => p.who === w));
  const made = [...g.made, ...res.made.map((m) => ({ p: idx(m.who), kind: m.kind, text: m.text, ja: m.ja, stars: m.stars, mini: on.id }))];
  const minis = [...(g.minis ?? []), { stone: g.players[g.turn].pos, id: on.id, stars: res.stars }];
  return next({ ...g, n: g.n + 1, players, made, minis, lastMini: on });
}
