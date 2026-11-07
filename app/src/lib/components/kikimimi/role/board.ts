// ふたりで ロールプレイ's turn on this phone (RoleLobby, RolePlay, RoleResults; over games/role/def.ts): whose turn it
// is, the key phrases heard in a take (lib/mic/match.ts phrases), whether the English shows at first (easy: my level
// below the unit's stage), and each turn's ✓ as this phone saw them (mine as I said them, the partner's at their
// reveals) for the results' list. What was heard never leaves the round's view state; only the bitmask is kept here,
// for this game, in memory. Its pages' strings come in with it (i18n/kiki-role.ts: kikimimi/ may not import i18n).
import '#lib/i18n/kiki-role.ts';
import type { Who } from '#lib/types.ts';
import type { QuizView } from '#lib/kikimimi/games/quiz/view.ts';
import { ORDER } from '#lib/kikimimi/round/session.ts';
import { HEARD, ROLES, saidOf, type Key, type RoleCard } from '#lib/kikimimi/games/role/def.ts';
import { rawOf } from '#lib/kikimimi/games/listened.ts';
import { tierFor } from '#lib/kikimimi/lesson.ts';
import { INDEX } from '#lib/kikimimi/pool.ts';
import type { Stage } from '#lib/kikimimi/stages.ts';
import { phrases } from '#lib/mic/match.ts';

/** A player's role: the game's (`pl` at go), else, in the lobby, their place among those joined (A, B, G). */
export function roleOfWho(v: Pick<QuizView, 'roles' | 'players'>, w: Who): number {
  const r = v.roles[w];
  if (r !== undefined) return r;
  const k = ORDER.filter((x) => v.players.some((p) => p.who === x)).indexOf(w);
  return Math.max(0, k) % ROLES;
}

/** Someone here plays this role (else I say its lines too: the partner gone). */
export const roleHere = (v: Pick<QuizView, 'roles' | 'players'>, role: number): boolean => v.players.some((p) => p.here && roleOfWho(v, p.who) === role);

/** The keys said in a take, as the answer's mask (bit i: keys[i]). */
export const heardKeys = (text: string, keys: readonly Key[]): number => phrases(text, keys.map((k) => k.en));

/** The English shown faded from the start: my level below the unit's stage (lesson.ts tierFor's easy). */
export function easyFor(unit: string, level: number | null): boolean {
  const stage = INDEX.paths.find((p) => p[0] === unit)?.[2] as Stage | undefined;
  return !!stage && tierFor(level, stage) === 'easy';
}

/** The unit's name (しまの みち's). */
export const unitName = (unit: string): string => INDEX.paths.find((p) => p[0] === unit)?.[1] ?? unit;

/** Each turn's ✓ as seen here: the speaker's mask by game and turn (this app's memory, this game only). */
const SAID = new Map<string, number>();
let saidFor = '';
/** The speaker's answer to turn i of game g, kept (a listener's ack isn't). */
export function keepSaid(g: string, i: number, a: Parameters<typeof rawOf>[0]): void {
  const x = rawOf(a);
  if (x === null || x === HEARD) return;
  const s = saidOf(x);
  if (!s) return;
  if (saidFor !== g) SAID.clear();
  saidFor = g;
  SAID.set(`${g}:${i}`, s.mask);
}
/** Turn i's phrases said (null: not seen here). */
export const saidAt = (g: string, i: number): number | null => SAID.get(`${g}:${i}`) ?? null;

/** The scene's parts: each its first turn's card and where it starts. */
export const partsOf = (cards: readonly RoleCard[]): { card: RoleCard; at: number }[] =>
  cards.flatMap((c, i) => (i === 0 || cards[i - 1].turn.part !== c.turn.part ? [{ card: c, at: i }] : []));
