// ふたりで ロールプレイ (docs/kikimimi-mic.md "ふたりで ロールプレイ") as a GameDef: one scene (scenes.ts: a unit's two dialogues chained),
// a round a turn, each turn a line of the dialogue said by the player in its speaker's role. The speaker sees the line
// in Japanese and its key phrases in English (the unit's `ph` found in the line), taps the mic and says it; their own
// phone hears it and lights the phrases said (lib/mic/match.ts phrases). Only that bitmask goes on the wire (the
// answer), never what was heard; the partner's phone shows the ✓ chips. The other player's answer is an ack once the
// speaker's is in, so the turn's reveal comes when the speaker is done; it moves on by itself. Co-op only, two roles
// (`pl`'s order: A, then B; a third player shares A's turns). No score: each turn's points are its phrases said, so
// the running totals add up to the team's 「ふたりで k / n フレーズ」, never shown per person. Pure.
import { fnv1a } from '#lib/random.ts';
import type { Item, Level, Line } from '../../bank.ts';
import type { UnitPlay } from '../../lesson.ts';
import { TIMERS, type QuizTimer } from '../../seed.ts';
import type { AnswerValue, GameDef, Graded, Round, RoundDeck, RoundWindows } from '../../round/types.ts';
import { ROLES } from '../listened.ts';
import type { Scene } from './scenes.ts';

/** A turn's most key phrases (the answer's low bits). */
export const KEYS_MAX = 6;
/** The answer's bit for "something was heard" (a turn with no key phrase still counts as said). */
export const SPOKE = 1 << KEYS_MAX;
/** The listener's answer: heard the partner (no phrases, no points). */
export const HEARD = 255;
/** A part's first turn's lead-in (ms: its scene card read), the others'. */
const LEAD_PART = 2500, LEAD_TURN = 800;

/** The lobby's options: the scene's place's level (the quiz family's view reads it), こたえる じかん (unused: a turn has no
 *  limit) and the scene (its place in SCENES). */
export interface RoleOpts {
  lv: Level;
  timer: QuizTimer;
  scene: number;
}

export const roleOpts = (count: number) => ({
  encode: (o: RoleOpts): number[] => [o.lv, Math.max(0, TIMERS.indexOf(o.timer)), o.scene],
  decode: (a: readonly number[]): RoleOpts | null => {
    const [lv, ti = 0, scene] = a, timer = TIMERS[ti];
    return Number.isInteger(lv) && lv >= 1 && lv <= 7 && timer !== undefined && Number.isInteger(scene) && scene >= 0 && scene < count ? { lv: lv as Level, timer, scene } : null;
  }
});

// ---------- the key phrases ----------

/** A key phrase in a line: its id, the words as the line says them (the chip, and what's listened for), its Japanese. */
export interface Key {
  ph: string;
  en: string;
  ja: string;
}

type Phrase = UnitPlay['ph'][number] & { match?: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A match's ends without what isn't a word (`. Sorry?` → `Sorry`). */
const trim = (s: string) => s.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '');

/** The unit's key phrases a line has, in the order they're said (at most KEYS_MAX). */
export function keysOf(en: string, ph: readonly Phrase[]): Key[] {
  return ph.flatMap((p) => {
    const m = new RegExp(p.match ?? `\\b${escape(p.en).replace(/'/g, "['’]")}\\b`, 'i').exec(en.replace(/’/g, "'"));
    return m && trim(m[0]) ? [{ ph: p.id, en: trim(m[0]), ja: p.ja ?? '', at: m.index }] : [];
  }).sort((x, y) => x.at - y.at).slice(0, KEYS_MAX).map(({ at: _, ...k }) => k);
}

// ---------- the deal ----------

/** A turn: the scene's dialogue as an Item (its clips are the お手本's), the line said, who says it, its keys. No clip
 *  plays during it (the partner's own voice is the audio), none at its reveal either. */
export interface RoleCard extends Item {
  lines: readonly Line[];
  turn: {
    /** The scene's part (its dialogue) and the line in it. */
    part: number;
    k: number;
    /** The speaker's role (0 A, 1 B). */
    role: number;
    keys: Key[];
  };
  quietReveal: true;
}

/** A scene's turns from its unit's chunk (the unit's items and phrases): every line of each part in order; a part whose
 *  dialogue isn't there (or isn't two voices) is left out. */
export function roleDeal(scene: Scene, unit: { unit: Pick<UnitPlay, 'ph'>; items: readonly Item[] }): RoleCard[] {
  return scene.parts.flatMap((p, part) => {
    const it = unit.items.find((x) => x.id === p.id);
    if (!it?.lines || it.lines.length < 2 || new Set(it.lines.map((l) => l.who)).size !== 2) return [];
    return it.lines.map((l, k): RoleCard => ({ ...it, lines: it.lines!, quietReveal: true, turn: { part, k, role: l.who === p.a ? 0 : 1, keys: keysOf(l.en, unit.unit.ph) } }));
  });
}

/** A turn's line. */
export const lineOf = (c: RoleCard): Line => c.lines[c.turn.k];

// ---------- answers ----------

/** The phrases said (bit i: keys[i]) and whether anything was heard, as the answer. */
export const saidAnswer = (mask: number, spoke: boolean): number => (mask & (SPOKE - 1)) | (spoke ? SPOKE : 0);

/** An answer read: the phrases said and whether it was spoken (null: the listener's, or none). */
export function saidOf(a: AnswerValue | null | undefined): { mask: number; spoke: boolean } | null {
  return typeof a === 'number' && a >= 0 && a < SPOKE * 2 ? { mask: a & (SPOKE - 1), spoke: (a & SPOKE) !== 0 } : null;
}

const bits = (m: number): number => {
  let n = 0;
  for (let x = m; x; x &= x - 1) n++;
  return n;
};

/** A turn's said phrases (its points). */
export const saidCount = (a: AnswerValue | null | undefined): number => bits(saidOf(a)?.mask ?? 0);

/** A turn said whole: every phrase (a turn without one: something heard). */
export const turnOk = (r: { keys: number }, a: AnswerValue | null | undefined): boolean => {
  const s = saidOf(a);
  return !!s && (r.keys ? bits(s.mask) === r.keys : s.spoke);
};

// ---------- the deck ----------

/** A round: a turn (its line's clip id), its speaker's role, how many keys, whether it opens a part. */
interface RoleRound extends Round {
  kind: 'role';
  role: number;
  keys: number;
  first: boolean;
}

export const roundsOf = (cards: readonly RoleCard[]): RoleRound[] =>
  cards.map((c, i) => ({ kind: 'role', id: `${c.id}-${c.turn.k + 1}`, role: c.turn.role, keys: c.turn.keys.length, first: i === 0 || cards[i - 1].turn.part !== c.turn.part }));

/** The phrases a scene has in all (the team's most). */
export const phrasesIn = (rounds: readonly Pick<RoleRound, 'keys'>[]): number => rounds.reduce((s, r) => s + r.keys, 0);

function roleDeck(rounds: () => readonly RoleRound[], w: RoundWindows): RoundDeck {
  const none: Graded = { ok: false, pts: 0 };
  const valid = (r: RoleRound | undefined, a: AnswerValue) => !!r && (a === HEARD || (saidOf(a) !== null && (saidOf(a)!.mask >> r.keys) === 0));
  return {
    get count() {
      return rounds().length;
    },
    round: (i) => rounds()[i],
    // no clip and no limit: the turn is over when the speaker is (and the partner has heard); its reveal moves on
    timing: (i) => ({ lead: rounds()[i]?.first ? Math.max(w.lead, LEAD_PART) : LEAD_TURN, play: 0, answer: Infinity, auto: true }),
    valid: (i, a) => valid(rounds()[i], a),
    grade: (i, a) => {
      const r = rounds()[i];
      return r && a !== HEARD && valid(r, a) ? { ok: turnOk(r, a), pts: saidCount(a) } : none;
    },
    get maxScore() {
      return phrasesIn(rounds());
    }
  };
}

/** Where a game's turns come from (lane.ts over the phone's decks; a test's), and a scene's content version. */
export interface RoleSource {
  scenes: number;
  cards(seed: number, o: RoleOpts): readonly RoleCard[];
  cv?(o: RoleOpts): string | undefined;
}

/** A scene's turns, kept per its cards (the session reads the deck at every call). */
const ROUNDS = new WeakMap<readonly RoleCard[], RoleRound[]>();
function roundsFor(cards: readonly RoleCard[]): RoleRound[] {
  let rs = ROUNDS.get(cards);
  if (!rs) ROUNDS.set(cards, (rs = roundsOf(cards)));
  return rs;
}

export function roleGame(src: RoleSource): GameDef<RoleOpts> {
  return {
    id: 'role',
    modes: { solo: false, coop: true, vs: false, same: false },
    opts: roleOpts(src.scenes),
    deck: (seed, o, ctx) => roleDeck(() => roundsFor(src.cards(seed, o)), ctx.w),
    cv: (o) => src.cv?.(o),
    roles: ROLES
  };
}

/** A scene's content version: its unit's (the lessons' cv over the unit's items and clips), the game's build and the
 *  scene as written (6 hex; the unit unknown: undefined). */
export function roleCv(scene: Scene, unitCv: string | undefined, v: number): string | undefined {
  return unitCv === undefined ? undefined : (fnv1a(JSON.stringify(['role', v, unitCv, scene.unit, scene.parts.map((p) => [p.id, p.a])])) >>> 0).toString(16).padStart(8, '0').slice(0, 6);
}

/** The team's phrases said (the players' running totals: each turn's points are its phrases), at most `of`. */
export const teamSaid = (scores: Readonly<Partial<Record<string, number>>>, of: number): number =>
  Math.min(of, Object.values(scores).reduce<number>((s, x) => s + (x ?? 0), 0));
