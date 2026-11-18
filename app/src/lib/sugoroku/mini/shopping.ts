// 7 おつかい — Shopping List (docs/sugoroku.md "みんなで！"): each round one seat (the お客さん: the lander, then the next)
// holds a Japanese shopping list (「りんご2つ、バナナ3本、オレンジ1つ」: data/shopping.json) and builds its English from
// chips: a frame ("Can I have … , please?"), and each line's word, number, -s and (むずかしい) container: "two loaves of
// bread". The fold judges it (one `op`: the request's code, below): right, it goes to the shop; not yet, 「おしい！」 and
// the slot to look at (the sheet's); a second miss sends the right one (no bonus). The shop (everyone else; alone, the
// same seat) reads it and fills one basket from a shelf of 9 pictures (`k` a shelf slot in, `k` + `op` 'out' one out),
// then hands it over (`op` 'pay'): all right ナイス！, else 「おしい！」 and one more go. Two lists in 90 s. The round's timer
// (the sheet's, after SHOP_ASK_MS, then SHOP_FILL_MS): a stage's `next` from anyone sends the list to the shop as it is
// written (the お客さん gone: 「リストが届いた」), then ends the round with the basket as it is.
// Levels (the お客さん's): やさしい two lines, only each line's word to pick (the sheet fills the rest); ふつう three, the
// number and the -s too; むずかしい three with a container ("a carton of milk", "two bars of chocolate"). The shelf's
// other pictures: the shop's lowest level's (やさしい・ふつう any other things, むずかしい the same kind: fruit among fruit).
// Stars to everyone present: 2 a line right in the basket, +2 a list asked right first time.
import { seeded, shuffle } from '#lib/random.ts';
import type { Who } from '#lib/types.ts';
import { PICTURES } from '../pictures.ts';
import data from './data/shopping.json';
import { isStage } from './hands.ts';
import { capStars } from './stars.ts';
import type { Deal, Hand, MiniGame, MiniMade, Play, Result } from './types.ts';

export interface ShopItem {
  /** Its picture (pictures.json `w`). */
  w: string;
  /** Countable: its plural ("tomatoes"); a container's: none. */
  many?: string;
  /** Bought in a container: its word ("loaf"), and what's in it when not `w` ("strawberries"). */
  box?: string;
  of?: string;
  /** The list's Japanese and its counter (「食パン」「袋」: the trimmed font has no 斤). */
  ja: string;
  ctr: string;
}
/** A list: its title, then each line's item and count. */
type ListRow = [string, ...(string | number)[]];
export const SHOP_ITEMS: readonly ShopItem[] = data.items as ShopItem[];
export const SHOP_LISTS: readonly ListRow[] = data.lists as ListRow[];
const ITEM = new Map(SHOP_ITEMS.map((i) => [i.w, i]));

/** The containers' chips (むずかしい), in their order on the wire (the code's digit, 1-based); and their plurals. */
export const BOXES = ['carton', 'loaf', 'jar', 'bar', 'bag', 'bottle', 'pack', 'bunch'] as const;
const BOX_MANY: Readonly<Record<(typeof BOXES)[number], string>> = { carton: 'cartons', loaf: 'loaves', jar: 'jars', bar: 'bars', bag: 'bags', bottle: 'bottles', pack: 'packs', bunch: 'bunches' };
/** The request's frames (its first chip); any one is right. */
export const FRAMES = ['Can I have …, please?', 'I’d like …, please.', 'Could I get …, please?', '…, please.'] as const;
/** The number chips, 1–6 ("a" / "an" for one, by the word after). */
const NUMBER = ['', 'one', 'two', 'three', 'four', 'five', 'six'];

export const SHOP_ROUNDS = 2;
export const SHOP_SHELF = 9;
/** The round's timers (the sheet's): the list to the shop, then the round over. */
export const SHOP_ASK_MS = 25_000;
export const SHOP_FILL_MS = 20_000;
const LINE_STARS = 2, FIRST_TRY = 2;

interface Line { w: string; n: number }
interface ShopRound {
  /** The お客さん. */
  asker: Who;
  title: string;
  lines: Line[];
  /** The word chips (the lines' words and two others), as the code's indices. */
  words: string[];
  /** The shelf (PICTURES' indices). */
  shelf: number[];
}
/** A request's slot as built: its word chip, number, -s or not (`many`), container (BOXES' index, -1 none). */
export interface Slot { word: number; n: number; many: boolean; box: number }
export interface ShoppingState {
  seats: Hand[];
  rounds: ShopRound[];
  r: number;
  stage: number;
  /** The round's request: tries not right, the frame of the one that went (null: not yet), sent by the timer or after
   *  two tries (not the お客さん's own). */
  tries: number;
  frame: number | null;
  shown: boolean;
  /** The basket (each shelf slot's count) and the hand-overs that weren't right. */
  basket: number[];
  pays: number;
  results: { first: boolean; right: number; of: number }[];
}

const isBoxed = (i: ShopItem): boolean => !!i.box;
/** A line's level: やさしい・ふつう countable things only, むずかしい lists with a container. */
const listsFor = (level: number): number[] => SHOP_LISTS.map((_, k) => k).filter((k) => lineOf(k).some((l) => isBoxed(ITEM.get(l.w)!)) === (level >= 3));
function lineOf(k: number): Line[] {
  const row = SHOP_LISTS[k], out: Line[] = [];
  for (let i = 1; i < row.length; i += 2) out.push({ w: row[i] as string, n: row[i + 1] as number });
  return out;
}
const pictureOf = (w: string): number => PICTURES.findIndex((p) => p.w === w);

function dealRounds(d: Deal): ShopRound[] {
  const r = seeded(`${d.seed}:shopping`), n = d.seats.length;
  const from = Math.max(0, d.seats.findIndex((s) => s.who === d.lander));
  const taken = new Set<number>(), rounds: ShopRound[] = [];
  for (let k = 0; k < SHOP_ROUNDS; k++) {
    const asker = d.seats[(from + k) % n];
    const pool = listsFor(asker.level).filter((x) => !taken.has(x));
    const pick = pool[Math.floor(r() * pool.length)];
    taken.add(pick);
    const lines = lineOf(pick).slice(0, asker.level === 1 ? 2 : 3);
    // the shop's: its lowest level (alone: the asker's own)
    const shop = d.seats.filter((s) => s.who !== asker.who);
    const level = Math.min(...(shop.length ? shop : [asker]).map((s) => s.level));
    const mine = new Set(lines.map((l) => l.w)), sets = new Set(lines.map((l) => PICTURES[pictureOf(l.w)].set));
    const others = SHOP_ITEMS.filter((i) => !mine.has(i.w));
    const close = others.filter((i) => sets.has(PICTURES[pictureOf(i.w)].set));
    const fill = level >= 3 ? [...shuffle(close, r), ...shuffle(others, r)] : shuffle([...others], r);
    const extra = [...new Set(fill.map((i) => i.w))].slice(0, SHOP_SHELF - lines.length);
    const shelf = shuffle([...lines.map((l) => l.w), ...extra], r).map(pictureOf);
    const words = shuffle([...lines.map((l) => l.w), ...extra.slice(0, 2)], r);
    rounds.push({ asker: asker.who, title: SHOP_LISTS[pick][0], lines, words, shelf });
  }
  return rounds;
}

/** A line in the list's Japanese: 「りんご2つ」. */
export const lineJa = (l: Line): string => `${ITEM.get(l.w)!.ja}${l.n}${ITEM.get(l.w)!.ctr}`;
/** The list as the お客さん reads it: 「りんご2つ、バナナ3本」. */
export const listJa = (round: ShopRound): string => round.lines.map(lineJa).join('、');

/** A slot in English: "two apples", "an egg", "a loaf of bread", "two bars of chocolate". */
export function slotText(s: Slot, words: readonly string[]): string {
  const item = ITEM.get(words[s.word]);
  if (!item) return '';
  const box = BOXES[s.box];
  const noun = box ? `${s.many ? BOX_MANY[box] : box} of ${item.of ?? item.w}` : s.many ? item.many ?? item.w : item.w;
  const num = s.n === 1 ? (/^[aeiou]/.test(noun) ? 'an' : 'a') : NUMBER[s.n] ?? String(s.n);
  return `${num} ${noun}`;
}
/** The whole request: the frame round its slots ("Can I have two apples, a banana and an orange, please?"). */
export function requestText(frame: number, slots: readonly Slot[], words: readonly string[]): string {
  const parts = slots.map((s) => slotText(s, words));
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0] ?? '';
  const text = (FRAMES[frame] ?? FRAMES[0]).replace('…', list);
  return text[0].toUpperCase() + text.slice(1);
}
/** The right slots for the round's list. */
export function rightSlots(round: ShopRound): Slot[] {
  return round.lines.map((l) => {
    const item = ITEM.get(l.w)!;
    return { word: round.words.indexOf(l.w), n: l.n, many: l.n > 1, box: item.box ? BOXES.indexOf(item.box as (typeof BOXES)[number]) : -1 };
  });
}

/** A request on the wire (`op`): the frame's digit, then each slot's word chip (base 36), number (1–9), `p` -s or `s`
 *  not, container (0 none, else BOXES' index + 1): "0" + "21p0" + … (≤ 13 characters, the wire's [a-z0-9]{1,16}). */
export const requestCode = (frame: number, slots: readonly Slot[]): string =>
  `${frame}${slots.map((s) => `${s.word.toString(36)}${s.n}${s.many ? 'p' : 's'}${s.box + 1}`).join('')}`;
export function readCode(code: string): { frame: number; slots: Slot[] } | null {
  const m = /^(\d)((?:[0-9a-z][1-9][ps]\d)+)$/.exec(code);
  if (!m || Number(m[1]) >= FRAMES.length) return null;
  const slots = m[2].match(/.{4}/g)!.map((x) => ({ word: parseInt(x[0], 36), n: Number(x[1]), many: x[2] === 'p', box: Number(x[3]) - 1 }));
  return { frame: Number(m[1]), slots };
}

/** The first slot of a request that isn't right yet and what in it (the sheet's 「おしい！」: the word, the number, the
 *  -s, the container), or null when it's right. The lines in the list's order. */
export function requestCheck(round: ShopRound, code: string): { slot: number; part: 'word' | 'number' | 'many' | 'box' } | null {
  const got = readCode(code)?.slots ?? [], want = rightSlots(round);
  for (let i = 0; i < want.length; i++) {
    const g = got[i], w = want[i];
    if (!g || g.word !== w.word) return { slot: i, part: 'word' };
    if (g.n !== w.n) return { slot: i, part: 'number' };
    if (g.box !== w.box) return { slot: i, part: 'box' };
    if (g.many !== w.many) return { slot: i, part: 'many' };
  }
  return got.length === want.length ? null : { slot: want.length, part: 'word' };
}

/** The round's request as the shop reads it (sent: the frame picked; shown: the first), else null. */
export function shopRequest(s: ShoppingState): string | null {
  const round = s.rounds[s.r];
  if (!round || (s.frame === null && !s.shown)) return null;
  return requestText(s.frame ?? 0, rightSlots(round), round.words);
}
/** The lines the basket has right (each its count exactly). */
export function basketRight(s: ShoppingState): number {
  const round = s.rounds[s.r];
  return round ? round.lines.filter((l) => s.basket[round.shelf.indexOf(pictureOf(l.w))] === l.n).length : 0;
}
/** Who fills the basket: everyone but the お客さん (alone, they do). */
const shops = (s: ShoppingState, who: Who): boolean => s.seats.length === 1 || who !== s.rounds[s.r].asker;

function nextRound(s: ShoppingState): ShoppingState {
  const round = s.rounds[s.r];
  const res = { first: s.frame !== null && s.tries === 0 && !s.shown, right: basketRight(s), of: round.lines.length };
  return { ...s, r: s.r + 1, stage: s.stage + 1, tries: 0, frame: null, shown: false, basket: Array(SHOP_SHELF).fill(0), pays: 0, results: [...s.results, res] };
}
const sent = (s: ShoppingState): boolean => s.frame !== null || s.shown;

export const shopping: MiniGame<ShoppingState> = {
  deal: (d) => ({ seats: [...d.seats], rounds: dealRounds(d), r: 0, stage: 0, tries: 0, frame: null, shown: false, basket: Array(SHOP_SHELF).fill(0), pays: 0, results: [] }),
  play(s, who, p: Play) {
    const round = s.rounds[s.r];
    if (!round) return s;
    if (p.op === 'next') return !isStage(p, s.stage) ? s : sent(s) ? nextRound(s) : { ...s, shown: true, stage: s.stage + 1 };
    // the request: the お客さん's, once
    if (p.op !== undefined && /^\d/.test(p.op)) {
      if (who !== round.asker || sent(s) || !readCode(p.op)) return s;
      if (!requestCheck(round, p.op)) return { ...s, frame: readCode(p.op)!.frame };
      return s.tries + 1 >= 2 ? { ...s, tries: s.tries + 1, shown: true } : { ...s, tries: s.tries + 1 };
    }
    if (!sent(s) || !shops(s, who)) return s;
    if (p.op === 'pay') {
      if (basketRight(s) === round.lines.length && s.basket.reduce((a, b) => a + b, 0) === round.lines.reduce((a, l) => a + l.n, 0)) return nextRound(s);
      return s.pays + 1 >= 2 ? nextRound(s) : { ...s, pays: s.pays + 1 };
    }
    if (p.k === undefined || p.k >= SHOP_SHELF || (p.op !== undefined && p.op !== 'out')) return s;
    const n = s.basket[p.k] + (p.op === 'out' ? -1 : 1);
    if (n < 0 || n > 9) return s;
    return { ...s, basket: s.basket.map((x, i) => (i === p.k ? n : x)) };
  },
  done: (s) => s.r >= s.rounds.length,
  close(s): Result {
    // (a round cut short by the clock: its basket as it is)
    const all = s.r < s.rounds.length ? nextRound(s).results : s.results;
    const each = all.reduce((n, res) => n + LINE_STARS * res.right + (res.first ? FIRST_TRY : 0), 0);
    const made: MiniMade[] = all.flatMap((res, k) => {
      const round = s.rounds[k];
      return res.first ? [{ who: round.asker, kind: 'sentence' as const, text: requestText(0, rightSlots(round), round.words), ja: listJa(round), stars: FIRST_TRY }] : [];
    });
    return { stars: capStars(Object.fromEntries(s.seats.map((x) => [x.who, each])), s.seats), made };
  }
};
