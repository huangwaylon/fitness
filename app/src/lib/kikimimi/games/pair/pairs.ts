// はつおん ききわけ's content (docs/kikimimi-mic.md §2.4): app/content/mic/pairs.yaml checked and made into cards. A
// card is an Item of two lines, the pair's words (its clips `<id>-1`, `<id>-2`, both in the listening villager's
// voice: the session plays both, perception before production), with the pictures, labels, the mouth tips and the
// example lines under `pair`. compile.ts makes them the chunk `parts/mic-pairs.json` (not while the file is a draft),
// the audio script voices each word alone (bank.ts clipItems). Pure.
import type { RosterId } from '../../../villagers/roster.ts';
import { clipItems, helpProblems, type Item, type Line } from '../../bank.ts';
import { CAST } from '../../cast.ts';

/** The chunk's unit (pool.ts) and the pack's home. */
export const PAIR_UNIT = 'mic-pairs';

/** The contrasts (§2.4): r/l, b/v, th/s/z, s/sh, the vowels Japanese merges, teen/ty, a word's last consonant. */
export const SOUNDS = ['l-r', 'b-v', 'th', 's-sh', 'vowel', 'teen-ty', 'final'] as const;
export type Sound = (typeof SOUNDS)[number];

/** One word of a pair. */
interface PairWord {
  /** What's said, alone (and on the card in English). */
  en: string;
  /** The picture's label (kanji Japanese). */
  ja: string;
  /** The villager's reading of it, in spaced kana (「え、 しらみ？！」). */
  kana: string;
  /** An emoji, or a number's figures. */
  pic: string;
  /** The word in a short everyday line, and its Japanese. */
  ex: string;
  exJa: string;
  /** The mouth: tongue, lips, breath (kanji Japanese, ≤ HOW_MAX 字). */
  how: string;
}

export interface PairCard extends Item {
  pair: { sound: Sound; words: readonly [PairWord, PairWord] };
}

export interface PairsFile {
  status: 'draft' | 'voiced' | 'listened';
  cards: PairCard[];
}

const HOW_MAX = 60;
/** The pause between the two words as they play (s; clips.ts lineGaps: a line's `at`). */
const WORD_GAP = 0.7;
const ID = /^pr-[a-z0-9-]{1,20}$/;
const WORD = /^[a-z]+$/;
const STATUSES = ['draft', 'voiced', 'listened'] as const;

const str = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0;
const cap = (w: string): string => w[0].toUpperCase() + w.slice(1);

/** The file's problems (empty: fine): its header, each pair's id (unique), sound, villager (a US voice), help, and
 *  two words with every field, different, and each word in only one pair. */
export function pairProblems(raw: unknown): string[] {
  const f = raw as { schema?: unknown; unit?: unknown; status?: unknown; pairs?: unknown };
  const bad: string[] = [];
  if (f?.schema !== 1) bad.push('schema: 1');
  if (f?.unit !== PAIR_UNIT) bad.push(`unit: ${PAIR_UNIT}`);
  if (!STATUSES.includes(f?.status as never)) bad.push(`status: ${STATUSES.join(' | ')}`);
  if (!Array.isArray(f?.pairs) || !f.pairs.length) return [...bad, 'pairs: a list'];
  const ids = new Set<string>(), words = new Set<string>();
  for (const [k, p] of (f.pairs as Record<string, unknown>[]).entries()) {
    const at = `pairs[${k}]${str(p?.id) ? ` ${p.id}` : ''}`;
    if (!str(p?.id) || !ID.test(p.id)) bad.push(`${at}: id pr-…`);
    else if (ids.has(p.id)) bad.push(`${at}: id twice`);
    else ids.add(p.id);
    if (!SOUNDS.includes(p?.sound as Sound)) bad.push(`${at}: sound ${SOUNDS.join(' | ')}`);
    const cast = CAST[p?.who as RosterId];
    if (!cast?.startsWith('us-')) bad.push(`${at}: who, a villager with a US voice`);
    if (!str(p?.ctx) || !str(p?.why)) bad.push(`${at}: ctx and why`);
    else bad.push(...helpProblems({ ctx: p.ctx, why: p.why }).map((x) => `${at}: ${x}`));
    const ws = p?.words as Record<string, unknown>[] | undefined;
    if (!Array.isArray(ws) || ws.length !== 2) {
      bad.push(`${at}: two words`);
      continue;
    }
    for (const w of ws) {
      for (const key of ['en', 'ja', 'kana', 'pic', 'ex', 'exJa', 'how'] as const) if (!str(w?.[key])) bad.push(`${at}: a word's ${key}`);
      if (str(w?.en) && !WORD.test(w.en)) bad.push(`${at}: ${w.en}: one lower-case word`);
      if (str(w?.en) && words.has(w.en)) bad.push(`${at}: ${w.en} in two pairs`);
      if (str(w?.en)) words.add(w.en);
      if (str(w?.how) && [...w.how].length > HOW_MAX) bad.push(`${at}: ${w.en}'s how ≤ ${HOW_MAX} 字`);
      if (str(w?.ex) && str(w?.en) && !new RegExp(`\\b${w.en}`, 'i').test(w.ex)) bad.push(`${at}: ${w.en} (or a form of it) not in its ex`);
      if (str(w?.kana) && /[一-鿿]/.test(w.kana)) bad.push(`${at}: ${w.en}'s kana in kana`);
    }
    if (str(ws[0]?.en) && ws[0].en === ws[1]?.en) bad.push(`${at}: the same word twice`);
  }
  return bad;
}

/** The file as cards (it must check: pairProblems), in file order. */
export function pairsFile(raw: unknown): PairsFile {
  const bad = pairProblems(raw);
  if (bad.length) throw new Error(`kikimimi: content/mic/pairs.yaml doesn't check:\n${bad.join('\n')}`);
  const f = raw as { status: PairsFile['status']; pairs: { id: string; sound: Sound; who: RosterId; ctx: string; why: string; words: [PairWord, PairWord] }[] };
  const cards = f.pairs.map((p): PairCard => {
    const cast = CAST[p.who]!;
    const words = p.words.map((w) => ({ en: w.en, ja: w.ja, kana: w.kana, pic: String(w.pic), ex: w.ex, exJa: w.exJa, how: w.how })) as unknown as readonly [PairWord, PairWord];
    return {
      id: p.id, lv: 3, type: 'word', en: words.map((w) => w.en).join(' / '), ja: words.map((w) => w.ja).join(' / '), speaker: p.who, voice: 'us', cast,
      choices: words.map((w) => w.en), answer: 0, ctx: p.ctx.trim(), why: p.why.trim(),
      // each word said alone, as a word ("Rice."), a breath between them
      lines: words.map((w, k) => ({ who: p.who, cast, en: w.en, ja: w.ja, tts: `${cap(w.en)}.`, ...(k && { at: WORD_GAP }) }) as Line),
      pair: { sound: p.sound, words }
    };
  });
  return { status: f.status, cards };
}

/** The words' clips as the audio script speaks them (one item a word, `<id>-1`, `<id>-2`). */
export const pairClipItems = (raw: unknown): Item[] => pairsFile(raw).cards.flatMap(({ pair: _, ...c }) => clipItems(c));
