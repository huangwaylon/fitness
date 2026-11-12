// ききみみ's listening kinds (docs/curriculum.md "Authoring pipeline", kikimimi-engine.md "Listen parts", content/listen/
// README.md): the schema of app/content/listen/*.yaml (ことば タイル `tile`, ようじ でんわ `call`, たちぎき `tachi`,
// すうじ ラッシュ `rush`, しずえの ニュース `news` and its weather sentences `weather`), its
// checker (the README's rules, the Japanese help on each kind, the US-only lint), the kinds' clip ids and the clips as
// the audio script speaks them, and each file as compiled (compile.ts: `parts/<unit>.json`, the index's `listen` and
// `games`). The compiler's, the audio scripts' and the tests' (it reads the roster); the phone imports its types only.
import { ROSTER, type RosterId } from '#lib/villagers/roster.ts';
import { CHANNELS, HENSHIN_LV, PRAGMATICS, REGISTERS, SCENE_IDS, accentOf, helpProblems, type Accent, type CastId, type Channel, type Feature, type Item, type ItemType, type Level, type SoundMark, type Tags } from './bank.ts';
import { CAST } from './cast.ts';
import { PLACES } from './catalog.ts';
import { isInt } from '../contract/ops.ts';
import { CAST_IDS } from './speech.ts';
import { ALERTS, HI_MAX, HI_MIN, SKIES, hiKey, type Alert, type Sky } from './games/news/weather.ts';
import { PHENOMENA, type Phenomenon } from './henshin.ts';
import { FEATURES as BANK_FEATURES } from './tags.ts';
import { TONES, type Tone } from './tone.ts';

const isBankFeature = (f: string): f is Feature => (BANK_FEATURES as readonly string[]).includes(f);

const LISTEN_KINDS = ['tile', 'call', 'tachi', 'rush', 'news', 'long'] as const;
/** The kinds an item may be: a game's, or the news's weather sentences. */
const ITEM_KINDS: readonly string[] = [...LISTEN_KINDS, 'weather'];
type ListenKind = (typeof LISTEN_KINDS)[number];
type ListenStatus = 'draft' | 'voiced' | 'listened';

/** A spoken line of a call or a たちぎき (its clip `<item>-<n>`, n from 1). `me` is the player's side of a call. */
interface ListenLine {
  who: RosterId | 'me';
  en: string;
  ja: string;
  tts?: string;
  /** A call's mid-call change or correction. */
  repair?: true;
  /** たちぎき: seconds from the previous line's end (negative: an overlap; the first 0). */
  at?: number;
  /** Compiled: its clip id. */
  clip?: string;
}

interface Common {
  id: string;
  /** The trap, in Japanese (≤ 40 字). */
  note: string;
  tags: Pick<Tags, 'seed' | 'register' | 'pragmatic'> & { conditions?: readonly string[]; features: readonly string[] };
  scene?: (typeof SCENE_IDS)[number];
  channel?: Channel;
  /** What the scene card says while it plays (UI copy). */
  ask?: string;
  /** The situation, in Japanese (≤ 30 字), before the clip plays (a call's and a tile's; a たちぎき's per round). */
  ctx?: string;
}

/** ことば タイル: one sentence (its clip the item's id, or `clip`, a voiced bank item's), rebuilt from tiles. */
interface TileItem extends Common {
  kind: 'tile';
  /** A derived tile's bank item: its clip, speaker and `en` are that item's (no audio of its own). Compiled: always
   *  the clip id (the tile's own id otherwise). */
  clip?: string;
  speaker: RosterId;
  en: string;
  /** What the engine says, when not `en` (digits spelled out, a proven engine fix): never a respelling (TTS_DROP). */
  tts?: string;
  ja: string;
  /** `en`'s words in order: the answer (a tile may hold 2-3 words, so the sentence has one order). */
  tiles: string[];
  decoys: string[];
  marks?: SoundMark[];
  /** Japanese, ≤ 90 字: names each decoy's trap. */
  why?: string;
  /** Its words changed since its clip was spoken: left out of the part (never dealt) until it's re-voiced. */
  revoice?: true;
  /** How it's said (tone.ts): its voice's soft or firm reference, or its own (neutral), its wh- and either/or questions
   *  ending in "." for the engine, the best of four takes. Audio only (not in the part); an own clip's only. */
  tone?: Tone;
}

interface MemoSlot {
  ask: string;
  options: string[];
  answer: number;
  /** One Japanese reading per option (no English). */
  cja?: string[];
}

/** ようじ でんわ: a call, then 1-2 memo rounds of chip slots. */
interface CallItem extends Common {
  kind: 'call';
  lines: ListenLine[];
  /** Co-op: the role (0/1) that hears each line. */
  half: (0 | 1)[];
  memo: { slots: MemoSlot[]; why?: string }[];
}

type TachiRound =
  | { type: 'opinions'; claims: string[]; answer: RosterId[]; ctx?: string; why?: string }
  | { type: 'changed'; answer: RosterId; ctx?: string; why?: string }
  | { type: 'plan'; ask: string; choices: string[]; answer: number; ja: string; cja?: string[]; ctx?: string; why?: string };

/** たちぎき: three speakers overheard, then the opinions, changed and plan rounds. */
interface TachiItem extends Common {
  kind: 'tachi';
  lines: ListenLine[];
  rounds: TachiRound[];
}

/** すうじ ラッシュ: one customer's order (one clip, its id; written by scripts/kikimimi-rush.ts) and the ticket it asks
 *  for (`ask`): its 4 chips, ascending, the right one and the one said before a self-correction (`was`). */
interface RushItem extends Common {
  kind: 'rush';
  /** The counter (the stage's sign). */
  at: (typeof RUSH_AT)[number];
  speaker: RosterId;
  en: string;
  tts?: string;
  ja: string;
  ask: string;
  options: string[];
  answer: number;
  was?: number;
  cja?: string[];
  why?: string;
  /** Compiled: its clip id (its own id). */
  clip?: string;
}

/** すうじ ラッシュ's counters. */
export const RUSH_AT = ['cafe', 'konbini', 'ticket', 'deli', 'taxi', 'pharmacy'] as const;

// ---- しずえの ニュース (kikimimi-engine.md "しずえの ニュース") ----

/** A bulletin's line, read by しずえ (the file's `cast.isabelle`); compiled with its clip, `<item>-<n>` (n from 1 over
 *  the bulletin). */
interface NewsLine {
  en: string;
  ja: string;
  tts?: string;
  clip?: string;
}
/** A question after the bulletin: 4 English choices, the right one, the real trap (the easy tier's other choice), one
 *  Japanese per choice and 解説. The gist's question is the game's own; the detail's is authored (UI copy). */
interface NewsAsk {
  ask?: string;
  choices: string[];
  answer: number;
  trap: number;
  cja?: string[];
  why?: string;
}
const SEASONS = ['spring', 'summer', 'autumn', 'winter', 'any'] as const;
export const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
/** A bulletin: an island or seasonal item, then a Tokyo-life one (the weather and the sign-off come after, by the day:
 *  games/news/), its season and maybe its weekday (dealt only then), the gist and one detail. */
interface NewsItem extends Common {
  kind: 'news';
  season: (typeof SEASONS)[number];
  weekday?: (typeof WEEKDAYS)[number];
  segments: { topic: 'island' | 'season' | 'tokyo'; lines: NewsLine[] }[];
  gist: NewsAsk;
  detail: NewsAsk & { ask: string };
}
/** A weather sentence as compiled: its key (`sky-rain`, `hi-23`, `alert-heat`, `end`), clip (`<item>-<key>`), text and,
 *  for a sky, the umbrella question's 解説. */
export interface WxSentence {
  key: string;
  clip: string;
  en: string;
  ja: string;
  tts?: string;
  why?: string;
}
type Said = { en: string; ja: string };
/** The weather tail's sentences (one item in the news files): one per sky (with the umbrella question's 解説), the high
 *  as a template (`{n}` the number; `one` for 1 degree), one per alert, the sign-off. Compiled: `sentences`, all 56. */
interface WeatherItem extends Common {
  kind: 'weather';
  sky: Record<Sky, Said & { why: string }>;
  high: Said & { one: string };
  alerts: Record<Alert, Said>;
  end: Said;
  sentences?: WxSentence[];
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty'];
/** A number as said, −49…49 ("minus two", "twenty-three"). */
const inWords = (n: number): string => (n < 0 ? `minus ${inWords(-n)}` : n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ''));

/** Every sentence of the weather tail: the skies, the highs HI_MIN…HI_MAX (the figure shown, the words spoken), the
 *  alerts, the sign-off. */
export function wxSentences(it: Pick<WeatherItem, 'id' | 'sky' | 'high' | 'alerts' | 'end'>): WxSentence[] {
  const of = (key: string, x: Said & { why?: string }, tts?: string): WxSentence => ({ key, clip: `${it.id}-${key}`, en: x.en, ja: x.ja, ...(tts && { tts }), ...(x.why && { why: x.why }) });
  const highs = Array.from({ length: HI_MAX - HI_MIN + 1 }, (_, k) => {
    const c = k + HI_MIN, tpl = c === 1 ? it.high.one : it.high.en;
    return of(`hi-${hiKey(c)}`, { en: tpl.replace('{n}', c < 0 ? `minus ${-c}` : `${c}`), ja: it.high.ja.replace('{n}', c < 0 ? `マイナス${-c}` : `${c}`) }, tpl.replace('{n}', inWords(c)));
  });
  return [...SKIES.map((k) => of(`sky-${k}`, it.sky[k])), ...highs, ...ALERTS.map((k) => of(`alert-${k}`, it.alerts[k])), of('end', it.end)];
}

/** A bulletin's lines in order (both segments). */
export const newsLines = (it: Pick<NewsItem, 'segments'>): NewsLine[] => it.segments.flatMap((s) => s.lines);

// ---- まるごと 聞く (kikimimi-engine.md "まるごと 聞く") ----

/** A long piece's line: a villager's, spoken by the pipeline (`tts` piece: `at` its gap, as a たちぎき's), or a real
 *  speaker's (`real` piece: `who` a key of its `speakers`, `t` its span in the excerpt, s; the lines cut end to end). */
interface LongLine {
  who: string;
  en: string;
  ja: string;
  tts?: string;
  at?: number;
  t?: [number, number];
  clip?: string;
}
/** A question after the piece: its angle, 3 English choices, the right one, the line that answers it (0-based). */
export interface LongQ {
  type: (typeof LONG_QS)[number];
  ask: string;
  choices: string[];
  answer: number;
  /** The line that answers it (0-based): the transcript marks it, a miss's dictation is cut near it. */
  line: number;
  cja?: string[];
  why?: string;
}
/** A dictation's line (0-based), the words to write (in its `en`) and the connected speech in them (henshin.ts). */
export interface LongDict {
  line: number;
  words: string;
  feature: Phenomenon;
}
/** Where a real piece comes from and on what terms (shown with it and in せってい's 音声の 出典). */
interface LongCredit {
  title: string;
  by: string;
  /** The episode's page. */
  url: string;
  /** The file downloaded (an archive's member: `#<name>`; its sha256), and the excerpt's span in it (s). */
  file: string;
  sha256: string;
  start: number;
  end: number;
  licence: string;
  licenceUrl: string;
  /** The credit line as the licence asks for it. */
  attribution: string;
}
/** The questions' angles (curriculum.md "Long listening": CEFR CV 2020's B2 → C1 step). */
const LONG_QS = ['gist', 'mean', 'attitude', 'next'] as const;
/** まるごと 聞く: a 2-4 minute conversation, generated (`tts`) or a real recording (`real`), then its questions; its
 *  transcript and dictation lines for the results. */
interface LongItem extends Common {
  kind: 'long';
  /** Its title in the list (UI copy). */
  name: string;
  source: 'tts' | 'real';
  /** A real piece's speakers: their key, how the transcript names them (English and Japanese) and their gender. */
  speakers?: Record<string, { name: string; ja: string; g: 'f' | 'm' }>;
  credit?: LongCredit;
  lines: LongLine[];
  questions: LongQ[];
  dict: LongDict[];
}

export type ListenItem = TileItem | CallItem | TachiItem | RushItem | NewsItem | WeatherItem | LongItem;

/** An item as the index lists it (pool.ts Index `items`): id, level, type, accent, pragmatic layer, features. */
export type IndexEntry = [string, Level, ItemType, Accent, Tags['pragmatic'], Feature[]];

/** A file's header (content/listen/README.md "Header"). */
interface ListenHead {
  /** The file's name: the pack's, the part's and the play's `u`. */
  unit: string;
  game: ListenKind;
  /** 1-5: S0-S4 (はまべ … ほし). */
  stage: number;
  status: ListenStatus;
  cando: string;
}

/** A file as compiled (`parts/<unit>.json`'s `listen`): its header and items as authored, less `tts` (the engine's),
 *  each tile and line with its `clip` id; a derived tile with its bank item's speaker. */
export interface ListenPart extends ListenHead {
  items: ListenItem[];
}

/** The index's line for a file (`listen[<unit>]`): its game, stage and status, for the catalog without its part. */
export type ListenEntry = [game: ListenKind, stage: number, status: ListenStatus];

/** An item's clip ids: a tile's own id (or its bank item's), a call's or a たちぎき's one per line, `<id>-<n>` (n from 1). */
export const listenClipIds = (it: ListenItem): string[] =>
  it.kind === 'tile' ? [it.clip ?? it.id]
    : it.kind === 'rush' ? [it.id]
      : it.kind === 'news' ? newsLines(it).map((_, n) => `${it.id}-${n + 1}`)
        : it.kind === 'weather' ? wxSentences(it).map((x) => x.clip)
          : it.lines.map((_, n) => `${it.id}-${n + 1}`);

/** A file as parsed (compile.ts readListen). */
export interface ListenSource {
  file: string;
  raw: unknown;
}

// ---- the US-only lint (curriculum.md "American English first", "Authoring pipeline") ----------------------------------------

/** UK and AU words, spellings and phrasings, each with what it's taken for. Phrases rather than words where a word is
 *  also American (a flat tire, a lift ticket, a fancy place, cheers as a toast). */
const NOT_US: readonly [RegExp, string][] = [
  [/\bmate\b/i, 'mate'],
  [/\bcheers(?: for|,? (?:love|then))\b/i, 'cheers for thanks'],
  [/\bqueu(e|es|ed|ing)\b/i, 'queue (line)'],
  [/\b(?:my|your|our|his|her|their|the|a|new|this)\s+flat\b(?!\s+(?:tire|fee|rate|screen|out|white|shoes?|hats?))/i, 'flat (apartment)'],
  [/\b(?:the|take the)\s+lift\b(?!\s+(?:ticket|line|pass))/i, 'lift (elevator)'],
  [/\bfortnight\b/i, 'fortnight'],
  [/\breckon\b/i, 'reckon'],
  [/\bfancy (?:a|an|some|going|getting|coming|it)\b/i, 'fancy a…'],
  [/\bhalf (?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i, 'half nine'],
  [/\b(?:neighbour|colour|favour|flavour|honour|humour|labour|harbour|behaviour)/i, 'UK -our spelling'],
  [/\b(?:realis|organis|apologis|recognis|memoris|minimis|prioritis)(?:e|ed|es|ing)\b/i, 'UK -ise spelling'],
  [/\b(?:centre|theatre|metre|litre|programme|cheque|tyre|travell(?:ed|ing))\b/i, 'UK spelling'],
  [/\b(?:rubbish|loo|arvo|brekkie|cuppa|bloke|quid|knackered|gutted|innit|whilst|sorted|maths|petrol|motorway|pavement|trainers|takeaway|car park)\b/i, 'UK/AU word'],
  [/\bmum\b/i, 'mum (mom)'],
  [/\bmobile (?:number|phone)\b/i, 'mobile (cell phone)'],
  [/\bhow are you going\b/i, 'how are you going'],
  [/\bheaps (?:of|better|good)\b/i, 'heaps'],
  [/\bat the weekend\b/i, 'at the weekend']
];

/** The UK or AU usages in an English text (empty: US English). */
export const notUs = (en: string): string[] => NOT_US.filter(([re]) => re.test(en)).map(([, what]) => what);

/** The English an item shows or speaks (`en` and its lines' and choices'; never `tts`, which respells), unless it's
 *  tagged accent exposure. */
function shownEnglish(it: { en?: unknown; lines?: unknown; choices?: unknown; rounds?: unknown; tags?: { features?: readonly string[] } }): string[] {
  if (it.tags?.features?.includes('accent-exposure')) return [];
  const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const lines = Array.isArray(it.lines) ? (it.lines as { en?: unknown }[]).map((l) => l?.en) : [];
  const plan = Array.isArray(it.rounds) ? (it.rounds as { choices?: unknown }[]).flatMap((r) => strs(r?.choices)) : [];
  return [...strs([it.en]), ...strs(lines), ...(it.choices && typeof (it.choices as unknown[])[0] === 'string' ? strs(it.choices) : []), ...plan];
}

/** An item's US-lint problems, one per usage found. */
export const usProblems = (it: Parameters<typeof shownEnglish>[0]): string[] =>
  shownEnglish(it).flatMap((en) => notUs(en).map((what) => `not US English (${what}): "${en}"`));

// ---- ことば タイル's sound rules (content/listen/README.md "tile") ------------------------------------------------------

/** A spoken text's words, lower case, their apostrophes kept ("an'", "'im"). */
const said = (s: string): string[] => s.toLowerCase().replace(/’/g, "'").split(/[\s.,?!;:"“”—…]+/).filter(Boolean);
/** The respelled forms a tile shows (one tile each): what the clip says and what it stands for (the reveal's gloss). */
export const TRIO: readonly (readonly [said: string, full: string])[] = [['gonna', 'going to'], ['wanna', 'want to'], ['gotta', 'got to']];
/** A bank item's `en` as its clip says it (a derived tile's `en`): the trio, and Why'd for "whydja", where `tts` says them. */
export function asSaid(en: string, tts: string = en): string {
  const words = said(tts);
  let out = en;
  for (const [short, full, shown] of [...TRIO.map(([s, f]) => [s, f, s]), ['whydja', 'why did', "why'd"]]) {
    let n = words.filter((w) => w === short).length;
    out = out.replace(new RegExp(`\\b${full}\\b`, 'gi'), (m) => (n-- > 0 ? (/^[A-Z]/.test(m) ? shown[0].toUpperCase() + shown.slice(1) : shown) : m));
  }
  return out;
}
/** What a tile's own `tts` never says (curriculum.md "Audio and script rules"): a respelled function word or reduction.
 *  The voice says the words at natural speed; only gonna/wanna/gotta, flaps, dropped t and -in' are spelled as said. */
const TTS_DROP = new Set(["ya", "yer", "an'", "'n'", "n'", "ta", "fer", "er", "a'", "c'n", "kin", "d'you", "d'ya", "y'know", "'kay", "innit",
  "i'da", "imma", "dunno", "lemme", "gimme", "hafta", "hasta", "hadta", "useta", "oughta", "sposta", "s'posta", "s'posed", "kinda", "sorta",
  "lotta", "inta", "shoulda", "woulda", "coulda", "musta", "mosta", "'im", "'er", "'e", "'e's", "'is", "'em", "whatcha", "whaddaya", "whadidja"]);
const RESPELT = /(?:tcha|ncha|dja|ja|n't've|'d've|n'ta)$/;
/** A tile's `tts` respellings (empty: plain). */
const ttsDrops = (tts: string): string[] => said(tts).filter((w) => TTS_DROP.has(w) || RESPELT.test(w));
/** How many written words a spoken form stands for (1 if not here): a clip says a tile's every word when its forms add
 *  up to the tiles (whatcha 2: its "are" is never heard). */
const SPAN: Readonly<Record<string, number>> = { whaddaya: 3, whadidja: 3, whatcha: 2, dunno: 2, innit: 2, lemme: 2, gimme: 2, hafta: 2, hasta: 2,
  hadta: 2, useta: 2, oughta: 2, sposta: 2, "s'posta": 2, kinda: 2, sorta: 2, lotta: 2, outta: 2, oudda: 2, inta: 2, mosta: 2, "d'you": 2, "d'ya": 2,
  "y'know": 2, shoulda: 2, woulda: 2, coulda: 2, musta: 2, "where're": 2, greadon: 2 };
const span = (w: string): number => SPAN[w] ?? (RESPELT.test(w) ? 2 : 1);
/** Whether a clip saying `spoken` can be heard as all these tiles (no swallowed word: "Dunno" for "I don't know"). */
const allHeard = (spoken: string, tiles: readonly string[]): boolean =>
  said(spoken).reduce((n, w) => n + span(w), 0) >= tiles.reduce((n, t) => n + t.split(' ').length, 0);
/** The weak function words TTS_DROP respells: ordinary speech, never a reduction of their own. */
const WEAK = new Set(["ya", "yer", "an'", "'n'", "n'", "ta", "fer", "er", "a'", "c'n", "kin", "'im", "'er", "'em", "'kay"]);
/** Whether a clip says a reduction (the stage caps' count): the trio, or a derived clip's respelled form (lemme, hafta,
 *  -cha/-ja, shoulda, 'e…). Weak function words (ya, an', ta, 'im), flaps, dropped t and -in' are ordinary speech. */
const reduces = (spoken: string): boolean => said(spoken).some((w) => TRIO.some(([t]) => t === w) || ((TTS_DROP.has(w) || RESPELT.test(w)) && !WEAK.has(w)));
/** The share of a stage's tiles that may say a reduction (S1 かわ, S2 もり, S3 やま: content/listen/README.md "tile"). */
const REDUCED_CAP: Readonly<Record<number, number>> = { 2: 0.2, 3: 0.25, 4: 0.3 };
/** Decoys only spelling rules out (a listening game can't ask for them): each with its sound-alikes. */
const HOMOPHONES: readonly string[][] = [['here', 'hear'], ['i', 'eye'], ['no', 'know'], ['not', 'knot'], ['their', "they're", 'there'], ['your', "you're"], ["i'll", 'aisle']];
/** Grammar terms a note or 解説 never uses (kids and non-technical players read them). */
const GRAMMAR = /主語|動詞|名詞|過去形|現在形|未来形|複数|単数|短縮|省略|母音|子音|助動詞|代名詞|前置詞|冠詞|形容詞|副詞|仮定法|否定形|疑問文|弱形/;

// ---- the checker (content/listen/README.md "Checks") ------------------------------------------------------------------

/** The scenario bank's seeds (curriculum.md "The scenario bank": 1-66, then まるごと 聞く's 67-70). */
const SEED_MAX = 70;
const GAMES = ['quiz', 'ladder', 'tile', 'call', 'tachi', 'rush', 'news', 'long', 'serial'];
const TRACKS = ['life', 'people', 'work', 'broadcast'];
const STATUSES: readonly ListenStatus[] = ['draft', 'voiced', 'listened'];
/** bank.ts Tags conditions, plus the drafts' new ones (README "Vocabulary"). */
const CONDITIONS = ['phone', 'voicemail', 'pa', 'video', 'cafe', 'station', 'desk', 'signal', 'street', 'train', 'party'];
/** bank.ts Feature, plus the drafts' new ones (README "Vocabulary"). */
const FEATURES = ['contraction', 'weak-form', 'flap', 'yod', 'gonna', 'wanna', 'gotta', 'lemme', 'dunno', 'kinda', 'can-cant',
  't-glottal', 'teen-ty', 'self-repair', 'numbers', 'ellipsis', 'idiom', 'intonation', 'l-r', 'vowel', 'b-v', 'th', 'sh-s', 'f-h',
  'ending', 'katakana', 'contrast', 'clock',
  'linking', 'h-drop', 'chain', 'elision', 'assimilation', 'overlap', 'filler', 'stress'];
const ME = 'me';

type Obj = Record<string, unknown>;
const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const strs = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);
const chars = (s: string) => [...s].length;
/** A sentence's words as its tiles spell them (punctuation dropped, the case kept). */
const tileWords = (s: string) => s.replace(/[.,?!;:"“”—…]/g, ' ').split(/\s+/).filter(Boolean).join(' ');
const hasWords = (en: string, at: string) => new RegExp(`(^|[^A-Za-z'])${at.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z'])`).test(en);

/** One file's problems (empty: fine). `bank` holds the voiced items a derived tile may name (by id). Past `draft`
 *  the Japanese help is required (curriculum.md "Authoring pipeline": tile ctx, why; call ctx, cja per chip, why per memo round; たちぎき ctx
 *  and why per round; rush ctx, cja, why); present, it's checked whatever the status. */
export function checkListen({ file, raw }: ListenSource, bank: ReadonlyMap<string, Pick<Item, 'en' | 'speaker' | 'tts'>> = new Map()): string[] {
  const u = (raw ?? {}) as Obj & { unit: string; seeds: number[]; cast?: Record<string, string>; items: Obj[] };
  const bad: string[] = [];
  const at = (where: string, msg: string) => bad.push(`${file} ${where}: ${msg}`);
  if (u.schema !== 1) at('header', 'schema must be 1');
  if (!/^[a-z0-9-]{1,12}$/.test(u.unit) || `${u.unit}.yaml` !== file) at('header', `unit "${u.unit}" must match the file name and [a-z0-9-]{1,12}`);
  if (!GAMES.includes(u.game as string)) at('header', `game ${u.game}`);
  if (!isInt(u.stage, 1, 5)) at('header', `stage ${u.stage}`);
  if (!TRACKS.includes(u.track as string)) at('header', `track ${u.track}`);
  if (!Array.isArray(u.seeds) || !u.seeds.length || !u.seeds.every((s) => isInt(s, 1, SEED_MAX))) at('header', `seeds: 1-${SEED_MAX}`);
  const f = u.features as Obj | undefined;
  if (!f || !FEATURES.includes(f.primary as string) || (f.review !== undefined && !FEATURES.includes(f.review as string))) at('header', 'features');
  if (!isStr(u.cando)) at('header', 'cando');
  if (!STATUSES.includes(u.status as ListenStatus)) at('header', `status ${u.status}`);
  const helpNeeded = u.status !== 'draft';
  for (const [who, c] of Object.entries(u.cast ?? {})) {
    if (who !== ME && !(who in ROSTER)) at('cast', `${who} isn't in the roster`);
    if (!(CAST_IDS as readonly string[]).includes(c)) at('cast', `${who}: ${c} isn't a cast voice`);
  }
  if (!Array.isArray(u.items) || !u.items.length) at('header', 'no items');

  const voice = (who: string): string | undefined => u.cast?.[who] ?? CAST[who as RosterId];
  /** A speaker: in the roster (or `me` where allowed), with a voice of their gender. */
  const speaker = (where: string, who: unknown, me = false) => {
    if (!isStr(who)) return at(where, 'no speaker');
    if (who === ME) return me ? (voice(ME) ? undefined : at(where, 'a `me` line needs cast.me in the header')) : at(where, '`me` only speaks in calls');
    if (!(who in ROSTER)) return at(where, `${who} isn't in the roster`);
    const v = voice(who);
    if (!v) return at(where, `${who} has no cast voice (cast.ts CAST or the unit's cast)`);
    if (v.split('-')[1][0] !== ROSTER[who as RosterId].gender) at(where, `${who}'s voice ${v} is the wrong gender`);
    if (!v.startsWith('us-')) at(where, `${who}'s voice ${v} isn't American (US only, wave 2)`);
  };
  const spoken = (where: string, o: Obj) => {
    if (!isStr(o.en)) at(where, 'en');
    if (!isStr(o.ja)) at(where, 'ja');
    if (o.tts !== undefined && (!isStr(o.tts) || /\d/.test(o.tts))) at(where, `tts must be a string without digits: ${o.tts}`);
    if (isStr(o.en) && /\d/.test(o.en) && o.tts === undefined) at(where, 'en has digits, so it needs a tts spelled out');
  };
  /** Distinct voices for distinct speakers in one item (else nobody can tell them apart). */
  const distinct = (where: string, whos: string[]) => {
    const vs = [...new Set(whos)].map(voice);
    if (new Set(vs).size !== vs.length) at(where, `two speakers share a voice (${vs.join(', ')})`);
  };
  /** The Japanese help (bank.ts helpProblems), `need`ed past draft. */
  const help = (where: string, o: { choices?: unknown; cja?: unknown; why?: unknown; ctx?: unknown }, need: readonly ('cja' | 'why' | 'ctx')[]) => {
    for (const p of helpProblems(o)) at(where, p);
    if (helpNeeded) for (const k of need) if (o[k] === undefined) at(where, `${k} is needed past draft`);
  };

  for (const [n, it] of (u.items ?? []).entries()) {
    const where = `item ${n} ${it.id ?? ''}`;
    if (!isStr(it.id) || !/^[a-z0-9][a-z0-9-]{0,31}$/.test(it.id)) at(where, 'id');
    if (!ITEM_KINDS.includes(it.kind as string)) at(where, `kind ${it.kind}`);
    if (!isStr(it.note)) at(where, 'note');
    else if (chars(it.note) > 40) at(where, `note is ${chars(it.note)} 字 (≤ 40)`);
    if (it.scene !== undefined && !(SCENE_IDS as readonly string[]).includes(it.scene as string)) at(where, `scene ${it.scene}`);
    if (it.channel !== undefined && !(CHANNELS as readonly string[]).includes(it.channel as string)) at(where, `channel ${it.channel}`);
    const t = it.tags as Obj | undefined;
    if (!t) at(where, 'tags');
    else {
      if (!isInt(t.seed, 1, SEED_MAX) || !u.seeds?.includes(t.seed)) at(where, `tags.seed ${t.seed} must be one of the unit's seeds`);
      if (!(REGISTERS as readonly unknown[]).includes(t.register)) at(where, `register ${t.register}`);
      if (!(PRAGMATICS as readonly unknown[]).includes(t.pragmatic)) at(where, `pragmatic ${t.pragmatic}`);
      if (t.conditions !== undefined && !(strs(t.conditions) && t.conditions.every((c) => CONDITIONS.includes(c)))) at(where, `conditions ${t.conditions}`);
      if (!strs(t.features) || !t.features.length || !t.features.every((x) => FEATURES.includes(x))) at(where, `features ${t.features}`);
    }
    for (const p of usProblems(it)) at(where, p);

    if (it.kind === 'tile') {
      const b = it.clip !== undefined && isStr(it.clip) ? bank.get(it.clip) : undefined;
      if (it.clip !== undefined) {
        if (!b) at(where, `clip ${it.clip} is no voiced bank item`);
        else if (it.en !== asSaid(b.en, b.tts)) at(where, `a derived tile's en is its bank item's, as said: "${asSaid(b.en, b.tts)}"`);
        if (it.speaker !== undefined || it.tts !== undefined) at(where, "a derived tile has its bank item's speaker and audio (no speaker, no tts)");
        if (!isStr(it.ja)) at(where, 'ja');
      } else {
        speaker(where, it.speaker);
        spoken(where, it);
        if (it.tts === it.en) at(where, 'tts is en: drop it (it defaults to en)');
        if (isStr(it.tts) && ttsDrops(it.tts).length) at(where, `tts respells ${ttsDrops(it.tts).join(', ')}: say the words (README "tile")`);
      }
      if (it.revoice !== undefined && it.revoice !== true) at(where, 'revoice: true or nothing');
      if (it.tone !== undefined && !(TONES as readonly unknown[]).includes(it.tone)) at(where, `tone ${it.tone}: ${TONES.join(', ')} or nothing`);
      if (it.tone !== undefined && it.clip !== undefined) at(where, "a derived tile's tone is its bank item's clip (no tone)");
      help(where, it, ['ctx', 'why']);
      for (const k of ['note', 'why'] as const) if (isStr(it[k]) && GRAMMAR.test(it[k])) at(where, `${k} uses a grammar term (${(it[k] as string).match(GRAMMAR)![0]}): say it in plain words`);
      if (!strs(it.tiles) || it.tiles.length < 3 || it.tiles.length > 12) at(where, 'tiles: 3-12');
      else {
        if (isStr(it.en) && it.tiles.join(' ') !== tileWords(it.en)) at(where, `tiles don't rebuild en: "${it.tiles.join(' ')}" vs "${tileWords(it.en)}"`);
        const voice = b ? (b.tts ?? b.en) : isStr(it.tts) ? it.tts : it.en;
        if (isStr(voice) && !allHeard(voice, it.tiles)) at(where, `a tile isn't heard: the clip says "${voice}"`);
      }
      if (!strs(it.decoys) || it.decoys.length < 1 || it.decoys.length > 4) at(where, 'decoys: 1-4');
      else if (strs(it.tiles)) {
        const lower = it.tiles.map((x) => x.toLowerCase()), trio = lower.some((t) => TRIO.some(([w]) => t.split(' ').includes(w)));
        for (const d of it.decoys) {
          const dl = d.toLowerCase();
          if (lower.includes(dl)) at(where, `decoy "${d}" is also a tile`);
          if (HOMOPHONES.some((h) => h.includes(dl) && h.some((x) => x !== dl && lower.includes(x)))) at(where, `decoy "${d}" sounds like a tile (spelling, not listening)`);
          if (ttsDrops(d).length || (!trio && TRIO.some(([w]) => dl.split(' ').includes(w)))) at(where, `decoy "${d}" is a respelled form`);
        }
      }
      for (const m of (it.marks ?? []) as unknown[][]) {
        const ok = Array.isArray(m) && ['say', 'link', 'drop', 'stress'].includes(m[0] as string) && isStr(m[1]) &&
          (m[0] === 'link' || m[0] === 'stress' || isStr(m[2])) && isStr(it.en) &&
          (m[0] === 'stress' ? (m[1] as string).split(' ').every((w) => hasWords(it.en as string, w)) : hasWords(it.en, m[1] as string));
        if (!ok) at(where, `mark ${JSON.stringify(m)} (its words must be in en)`);
        else if (m[0] === 'say' && !TRIO.some(([w, full]) => (m[1] as string).toLowerCase() === w && (m[2] as string).toLowerCase() === full))
          at(where, `mark ${JSON.stringify(m)}: say only glosses gonna, wanna, gotta (["say", "gonna", "going to"])`);
      }
    }

    if (it.kind === 'call') {
      const lines = (it.lines ?? []) as Obj[];
      if (!Array.isArray(it.lines) || lines.length < 4) at(where, 'a call needs ≥ 4 lines');
      lines.forEach((l, i) => { speaker(`${where} line ${i}`, l.who, true); spoken(`${where} line ${i}`, l); });
      distinct(where, lines.map((l) => l.who as string));
      if (!lines.some((l) => l.repair === true)) at(where, 'a call needs a `repair: true` line (the change or correction)');
      const half = it.half as unknown[];
      if (!Array.isArray(half) || half.length !== lines.length || !half.every((h) => h === 0 || h === 1) || !half.includes(0) || !half.includes(1))
        at(where, 'half: one 0/1 per line, both roles used');
      help(where, it, ['ctx']);
      const memo = it.memo as Obj[];
      if (!Array.isArray(memo) || memo.length < 1 || memo.length > 2) at(where, 'memo: 1-2 rounds');
      for (const [r, round] of (memo ?? []).entries()) {
        help(`${where} memo ${r}`, { why: round.why }, ['why']);
        const slots = round.slots as Obj[];
        if (!Array.isArray(slots) || slots.length < 1 || slots.length > 12) { at(where, `memo ${r}: 1-12 slots`); continue; }
        for (const [s, slot] of slots.entries()) {
          const ok = isStr(slot.ask) && strs(slot.options) && slot.options.length >= 2 && slot.options.length <= 6 &&
            new Set(slot.options).size === slot.options.length && isInt(slot.answer, 0, slot.options.length - 1);
          if (!ok) at(where, `memo ${r} slot ${s}: ask, 2-6 distinct options, answer in range`);
          help(`${where} memo ${r} slot ${s}`, { choices: slot.options, cja: slot.cja }, ['cja']);
        }
      }
    }

    if (it.kind === 'rush') {
      speaker(where, it.speaker);
      spoken(where, it);
      if (!isStr(it.ask)) at(where, 'ask');
      if (!(RUSH_AT as readonly unknown[]).includes(it.at)) at(where, `at ${it.at}`);
      const opts = it.options;
      if (!strs(opts) || opts.length !== 4 || new Set(opts).size !== 4 || !isInt(it.answer, 0, 3)) at(where, 'options: 4 distinct chips, answer in range');
      if (it.was !== undefined && (!isInt(it.was, 0, 3) || it.was === it.answer)) at(where, 'was: another chip');
      const repair = strs((it.tags as Obj | undefined)?.features) && ((it.tags as Obj).features as string[]).includes('self-repair');
      if ((it.was !== undefined) !== repair) at(where, 'a `was` and the self-repair feature go together');
      help(where, { choices: opts, cja: it.cja, why: it.why, ctx: it.ctx }, ['ctx', 'why', 'cja']);
    }

    if (it.kind === 'tachi') {
      const lines = (it.lines ?? []) as Obj[];
      if (!Array.isArray(it.lines) || lines.length < 6) at(where, 'a tachi needs ≥ 6 lines');
      lines.forEach((l, i) => {
        speaker(`${where} line ${i}`, l.who);
        spoken(`${where} line ${i}`, l);
        if (typeof l.at !== 'number' || l.at < -1.5 || l.at > 3 || (i === 0 && l.at !== 0)) at(`${where} line ${i}`, `at ${l.at} (the first 0; then -1.5…3 s)`);
      });
      if (u.stage !== 1 && !lines.some((l) => typeof l.at === 'number' && l.at < 0)) at(where, 'no overlap: give some line a negative `at` (はまべ may have none)');
      const who = [...new Set(lines.map((l) => l.who as string))];
      if (who.length !== 3) at(where, `three speakers, not ${who.length}`);
      distinct(where, who);
      const rounds = (it.rounds ?? []) as Obj[];
      if (rounds.map((r) => r.type).join() !== 'opinions,changed,plan') at(where, 'rounds: opinions, changed, plan');
      const [op, ch, plan] = rounds;
      if (op && !(strs(op.claims) && op.claims.length === 3 && strs(op.answer) && op.answer.length === 3 && new Set(op.answer).size === 3 && op.answer.every((a) => who.includes(a))))
        at(where, 'opinions: 3 claims, the answer one speaker each');
      if (ch && !(isStr(ch.answer) && who.includes(ch.answer))) at(where, 'changed: a speaker');
      if (plan && !(isStr(plan.ask) && isStr(plan.ja) && strs(plan.choices) && plan.choices.length >= 3 && plan.choices.length <= 4 && isInt(plan.answer, 0, plan.choices.length - 1)))
        at(where, 'plan: ask, ja, 3-4 choices, answer in range');
      rounds.forEach((r, i) => help(`${where} round ${i}`, r.type === 'plan' ? r : { ctx: r.ctx, why: r.why }, ['ctx', 'why']));
    }

    if (it.kind === 'news') checkNews(where, it, { at, speaker, spoken, help }, u.stage);
    if (it.kind === 'long') checkLong(where, it, { at, speaker, spoken, help, distinct }, u.stage);
    if (it.kind === 'weather') checkWeather(where, it, at, u.game === 'news');
  }
  return bad;
}

// ---- しずえの ニュース's checks ----

type At = (where: string, msg: string) => void;
interface Checks {
  at: At;
  speaker(where: string, who: unknown): void;
  spoken(where: string, o: Obj): void;
  help(where: string, o: { choices?: unknown; cja?: unknown; why?: unknown; ctx?: unknown }, need: readonly ('cja' | 'why' | 'ctx')[]): void;
  distinct?(where: string, whos: string[]): void;
}
const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;
const strsOf = (v: unknown): string[] => (strs(v) ? v : []);

/** A bulletin's words in all by its file's stage (about 45 s before the weather; はまべ shorter, ほし denser). */
const NEWS_WORDS = (stage: unknown): readonly [number, number] => (stage === 1 ? [80, 120] : stage === 5 ? [150, 220] : [100, 170]);

/** A bulletin's problems: its season and weekday; two segments (an island or seasonal item, then Tokyo's) of 3-5 lines
 *  of 6-32 words, NEWS_WORDS in all, read by しずえ; the gist and the detail, each 4 choices with the answer and the
 *  trap apart; the help (ctx, each question's cja and why) past draft; US English. */
function checkNews(where: string, it: Obj, c: Checks, stage: unknown) {
  const { at } = c;
  if (!(SEASONS as readonly unknown[]).includes(it.season)) at(where, `season ${it.season}`);
  if (it.weekday !== undefined && !(WEEKDAYS as readonly unknown[]).includes(it.weekday)) at(where, `weekday ${it.weekday}`);
  if (String(it.id).length > 24) at(where, 'a bulletin id ≤ 24 characters (its rounds add -kasa)');
  c.speaker(where, 'isabelle');
  const segs = (Array.isArray(it.segments) ? it.segments : []) as Obj[];
  if (segs.length !== 2 || !['island', 'season'].includes(segs[0].topic as string) || segs[1].topic !== 'tokyo') at(where, 'segments: an island or season one, then tokyo');
  segs.forEach((s, k) => { if (!Array.isArray(s.lines) || s.lines.length < 3 || s.lines.length > 5) at(where, `segment ${k}: 3-5 lines`); });
  const lines = segs.flatMap((s) => (Array.isArray(s.lines) ? (s.lines as Obj[]) : []));
  lines.forEach((l, k) => {
    c.spoken(`${where} line ${k}`, l);
    if (isStr(l.en) && (wordCount(l.en) < 6 || wordCount(l.en) > 32)) at(`${where} line ${k}`, `${wordCount(l.en)} words (6-32)`);
  });
  const total = lines.reduce((n, l) => n + (isStr(l.en) ? wordCount(l.en) : 0), 0);
  const [lo, hi] = NEWS_WORDS(stage);
  if (total < lo || total > hi) at(where, `${total} words (${lo}-${hi} at this place: about 45 s before the weather)`);
  c.help(where, { ctx: it.ctx }, ['ctx']);
  for (const k of ['gist', 'detail'] as const) {
    const q = (it[k] ?? {}) as Obj;
    if (!(strs(q.choices) && q.choices.length === 4 && new Set(q.choices).size === 4 && isInt(q.answer, 0, 3) && isInt(q.trap, 0, 3) && q.trap !== q.answer))
      at(`${where} ${k}`, '4 distinct choices, the answer and the trap 0-3 and apart');
    if (k === 'detail' && !isStr(q.ask)) at(`${where} ${k}`, 'ask');
    c.help(`${where} ${k}`, { choices: q.choices, cja: q.cja, why: q.why }, ['cja', 'why']);
  }
  const choices = [...strsOf((it.gist as Obj)?.choices), ...strsOf((it.detail as Obj)?.choices)];
  for (const p of usProblems({ lines, choices, tags: it.tags as Common['tags'] })) at(where, p);
}

// ---- まるごと 聞く's checks ----

/** A long piece's clips' AAC bitrate (kbps; the others' 48): minutes of speech a piece (bank.test's line for them). */
export const LONG_KBPS = 32;
/** A long piece's bounds: its lines, its words (about 2-4 minutes), a real one's seconds and a real line's. */
const LONG_LINES = [20, 90] as const;
const LONG_WORDS = [280, 800] as const;
/** はまべ's floor (short sentences: two minutes hold fewer words). */
const LONG_WORDS_HAMA = 200;
const LONG_SECS = [90, 330] as const;
const LONG_LINE_SECS = 16;
const isUrl = (v: unknown): v is string => isStr(v) && /^https?:\/\/\S+$/.test(v);

/** A long piece's problems: its id (≤ 24: its rows add -q5, -k12), title and source; its lines (20-90, 280-800 words,
 *  はまべ from 200): a generated piece's villagers with distinct US voices, `at` gaps with an overlap (はまべ: may have none); a real piece's speakers, its lines
 *  cut end to end from 0 (each ≤ 16 s, 90-330 s in all) and its credit (where, whose, the licence and its credit line);
 *  4-5 questions (the gist first, 3 angles at least), 3 distinct choices each, the line that answers them; 2-4
 *  dictation lines (their words in the line, a connected-speech feature); the help (ctx, each question's cja and why)
 *  past draft; US English. */
function checkLong(where: string, it: Obj, c: Checks, stage: unknown) {
  const { at } = c;
  if (String(it.id).length > 24) at(where, 'a long piece’s id ≤ 24 characters (its rows add -q5, -k12)');
  if (!isStr(it.name) || chars(it.name) > 20) at(where, 'name: its title, ≤ 20 字');
  const lines = (Array.isArray(it.lines) ? it.lines : []) as Obj[];
  if (lines.length < LONG_LINES[0] || lines.length > LONG_LINES[1]) at(where, `${lines.length} lines (${LONG_LINES.join('-')})`);
  const words = lines.reduce((n, l) => n + (isStr(l.en) ? wordCount(l.en) : 0), 0);
  const floor = stage === 1 ? LONG_WORDS_HAMA : LONG_WORDS[0];
  if (words < floor || words > LONG_WORDS[1]) at(where, `${words} words (${floor}-${LONG_WORDS[1]}: about 2-4 minutes)`);
  if (it.source === 'tts') {
    if (it.speakers !== undefined || it.credit !== undefined) at(where, 'a generated piece has no speakers or credit (its villagers speak)');
    lines.forEach((l, i) => {
      c.speaker(`${where} line ${i}`, l.who);
      c.spoken(`${where} line ${i}`, l);
      if (l.t !== undefined) at(`${where} line ${i}`, 'a generated line has no `t`');
      if (typeof l.at !== 'number' || l.at < -1.5 || l.at > 3 || (i === 0 && l.at !== 0)) at(`${where} line ${i}`, `at ${l.at} (the first 0; then -1.5…3 s)`);
    });
    if (stage !== 1 && !lines.some((l) => typeof l.at === 'number' && l.at < 0)) at(where, 'no overlap: give some line a negative `at` (はまべ may have none)');
    const who = [...new Set(lines.map((l) => l.who as string))];
    if (who.length < 2 || who.length > 4) at(where, `2-4 speakers, not ${who.length}`);
    c.distinct?.(where, who);
  } else if (it.source === 'real') {
    const sp = (it.speakers ?? {}) as Record<string, Obj>;
    if (!Object.keys(sp).length) at(where, 'a real piece names its speakers');
    for (const [k, s] of Object.entries(sp)) if (!/^[a-z]$/.test(k) || !isStr(s?.name) || !isStr(s?.ja) || !['f', 'm'].includes(s?.g as string)) at(where, `speaker ${k}: a letter, name, ja, g f|m`);
    let end = 0;
    lines.forEach((l, i) => {
      const w = `${where} line ${i}`;
      if (!isStr(l.who) || !(l.who in sp)) at(w, `speaker ${l.who} isn't one of the piece's`);
      if (!isStr(l.en) || !isStr(l.ja)) at(w, 'en and ja');
      if (l.tts !== undefined || l.at !== undefined) at(w, 'a real line has no tts or at (it’s cut, not spoken)');
      const t = l.t as unknown[];
      const ok = Array.isArray(t) && t.length === 2 && t.every((x) => typeof x === 'number') && (t[1] as number) > (t[0] as number);
      if (!ok) return at(w, 't: [start, end] in s');
      const [a, b] = t as [number, number];
      if (Math.abs(a - end) > 0.001) at(w, `t starts at ${a}, not where the line before ends (${end}): the lines are cut end to end from 0`);
      if (b - a > LONG_LINE_SECS) at(w, `${(b - a).toFixed(1)} s (≤ ${LONG_LINE_SECS}: split it at a sentence)`);
      end = b;
    });
    if (end < LONG_SECS[0] || end > LONG_SECS[1]) at(where, `${end.toFixed(0)} s (${LONG_SECS.join('-')})`);
    const cr = (it.credit ?? {}) as Obj;
    if (!isStr(cr.title) || !isStr(cr.by) || !isUrl(cr.url) || !isUrl(cr.file) || !isStr(cr.licence) || !isUrl(cr.licenceUrl) || !isStr(cr.attribution))
      at(where, 'credit: title, by, url, file, licence, licenceUrl, attribution');
    if (!isStr(cr.sha256) || !/^[0-9a-f]{64}$/.test(cr.sha256)) at(where, 'credit.sha256: the file’s');
    if (typeof cr.start !== 'number' || typeof cr.end !== 'number' || Math.abs(cr.end - cr.start - end) > 0.05) at(where, `credit start/end: the excerpt's span (its lines end at ${end})`);
  } else at(where, 'source: tts | real');
  c.help(where, { ctx: it.ctx }, ['ctx']);
  const qs = (Array.isArray(it.questions) ? it.questions : []) as Obj[];
  if (qs.length < 4 || qs.length > 5) at(where, `${qs.length} questions (4-5)`);
  if (qs[0]?.type !== 'gist') at(where, 'the first question is the gist');
  if (new Set(qs.map((q) => q.type)).size < 3) at(where, 'questions: 3 angles at least (gist, mean, attitude, next)');
  qs.forEach((q, k) => {
    const w = `${where} question ${k}`;
    if (!(LONG_QS as readonly unknown[]).includes(q.type)) at(w, `type ${q.type}`);
    if (!isStr(q.ask)) at(w, 'ask');
    if (!(strs(q.choices) && q.choices.length === 3 && new Set(q.choices).size === 3 && isInt(q.answer, 0, 2))) at(w, '3 distinct choices, the answer 0-2');
    if (!isInt(q.line, 0, lines.length - 1)) at(w, `line ${q.line}: the line that answers it`);
    c.help(w, { choices: q.choices, cja: q.cja, why: q.why }, ['cja', 'why']);
    for (const p of usProblems({ choices: q.choices })) at(w, p);
  });
  const dict = (Array.isArray(it.dict) ? it.dict : []) as Obj[];
  if (dict.length < 2 || dict.length > 4) at(where, `${dict.length} dictation lines (2-4)`);
  if (new Set(dict.map((d) => d.line)).size !== dict.length) at(where, 'a dictation line once');
  dict.forEach((d, k) => {
    const w = `${where} dict ${k}`, l = isInt(d.line, 0, lines.length - 1) ? lines[d.line] : undefined;
    if (!l) return at(w, `line ${d.line}`);
    if (!isStr(d.words) || wordCount(d.words) > 6 || !isStr(l.en) || !hasWords(l.en, d.words)) at(w, `words "${d.words}": 1-6 of the line's own`);
    if (!(PHENOMENA as readonly unknown[]).includes(d.feature)) at(w, `feature ${d.feature}: one of henshin.ts PHENOMENA`);
  });
}

/** The weather sentences' problems: only in a news file; every sky (with its 解説), alert and the sign-off said, in US
 *  English and no digits; the high's templates each with `{n}` (the figure shown, spoken in words). */
function checkWeather(where: string, it: Obj, at: At, inNews: boolean) {
  if (!inNews) at(where, 'weather sentences belong in a news file');
  const one = (k: string, x: unknown, why = false) => {
    const o = (x ?? {}) as Obj;
    if (!isStr(o.en) || !isStr(o.ja) || /\d/.test(o.en)) at(`${where} ${k}`, 'en (no digits) and ja');
    if (why && !isStr(o.why)) at(`${where} ${k}`, 'why: the umbrella question’s 解説');
    for (const p of helpProblems({ why: o.why })) at(`${where} ${k}`, p);
    if (isStr(o.en)) for (const p of notUs(o.en)) at(`${where} ${k}`, `not US English (${p})`);
  };
  for (const k of SKIES) one(`sky.${k}`, (it.sky as Obj)?.[k], true);
  for (const k of ALERTS) one(`alerts.${k}`, (it.alerts as Obj)?.[k]);
  one('end', it.end);
  const h = (it.high ?? {}) as Obj;
  if (![h.en, h.one, h.ja].every((x) => isStr(x) && x.includes('{n}'))) at(`${where} high`, 'en, one and ja, each with {n}');
}

/** Every file's problems, and ids unique across them and apart from `taken` (the bank's and the units' clip ids: the
 *  listen clips share clips.json with them). */
export function checkListenAll(sources: readonly ListenSource[], bank: ReadonlyMap<string, Pick<Item, 'en' | 'speaker' | 'tts'>> = new Map(), taken: ReadonlySet<string> = new Set()): string[] {
  const bad = sources.flatMap((s) => checkListen(s, bank));
  // the stage caps: the share of a stage's tiles whose clip says a reduction (README "tile")
  const per = new Map<number, [number, number]>();
  for (const { raw } of sources) {
    const u = raw as { game?: string; stage?: number; items?: Obj[] };
    if (u.game !== 'tile' || !(Number(u.stage) in REDUCED_CAP)) continue;
    for (const it of u.items ?? []) {
      const b = isStr(it.clip) ? bank.get(it.clip) : undefined, voice = b ? (b.tts ?? b.en) : (it.tts ?? it.en);
      const [n, r] = per.get(u.stage!) ?? [0, 0];
      per.set(u.stage!, [n + 1, r + (isStr(voice) && reduces(voice) ? 1 : 0)]);
    }
  }
  for (const [stage, [n, r]] of per) if (r > n * REDUCED_CAP[stage]) bad.push(`stage ${stage}'s tiles: ${r} of ${n} say a reduction (cap ${REDUCED_CAP[stage] * 100} %)`);
  const seen = new Map<string, string>();
  for (const { file, raw } of sources) for (const it of ((raw as { items?: Obj[] })?.items ?? [])) {
    const id = it.id as string;
    if (seen.has(id)) bad.push(`${file}: id ${id} is also in ${seen.get(id)}`);
    else if (taken.has(id) || (it.kind !== 'tile' && Array.isArray(it.lines) && it.lines.some((_, n) => taken.has(`${id}-${n + 1}`)))) bad.push(`${file}: id ${id} is a bank or unit clip's`);
    seen.set(id, file);
  }
  const wx = sources.flatMap(({ file, raw }) => ((raw as { items?: Obj[] })?.items ?? []).filter((it) => it.kind === 'weather').map(() => file));
  if (wx.length > 1) bad.push(`the weather sentences are in ${wx.join(', ')}: one item in all`);
  return bad;
}

// ---- voicing and compiling -------------------------------------------------------------------------------------------

/** A file's header and items as the compiler and the audio script read them (checked: checkListen). */
export const listenUnit = (raw: unknown): ListenPart & { cast?: Record<string, CastId> } => raw as ListenPart & { cast?: Record<string, CastId> };

/** A stage's place on the bank's level scale (stages.ts rank: S1 かわ → 3), the level its clips are spoken at. */
const levelOf = (stage: number): Level => (stage + 1) as Level;

/** Every clip a file's items have of their own, as the audio script speaks them (one item a clip, as bank.ts
 *  clipItems): its id, the speaker and cast voice (the file's `cast`, else cast.ts CAST; `me` the file's cast.me, with
 *  the call's first villager as its icon), `en`, `tts`, `ja`, the item's channel and tags (so condOf gives a call its
 *  phone band). A derived tile has none (its bank item's clip). */
export function listenClipItems(raw: unknown): Item[] {
  const u = listenUnit(raw);
  const castOf = (who: string): CastId => (u.cast?.[who] ?? CAST[who as RosterId]) as CastId;
  return u.items.flatMap((it): Item[] => {
    const base = { lv: levelOf(u.stage), type: 'gist' as const, choices: [], answer: 0, tags: it.tags as Tags, ...(it.channel && { channel: it.channel }) };
    if (it.kind === 'tile' || it.kind === 'rush') {
      if (it.kind === 'tile' && it.clip) return [];
      const cast = castOf(it.speaker);
      return [{ ...base, id: it.id, en: it.en, ja: it.ja, speaker: it.speaker, voice: accentOf(cast), cast, ...(it.tts && { tts: it.tts }), ...(it.kind === 'tile' && it.tone && { tone: it.tone }) }];
    }
    // (a real piece's lines are cut from its recording: scripts/kikimimi-real.ts)
    if (it.kind === 'long' && it.source === 'real') return [];
    if (it.kind === 'news' || it.kind === 'weather') {
      // (しずえ reads every one: the file's cast.isabelle)
      const cast = castOf('isabelle'), ids = listenClipIds(it), said = it.kind === 'news' ? newsLines(it) : wxSentences(it);
      return said.map((l, n): Item => ({ ...base, id: ids[n], en: l.en, ja: l.ja, speaker: 'isabelle', voice: accentOf(cast), cast, ...(l.tts && { tts: l.tts }) }));
    }
    const icon = it.lines.find((l) => l.who !== ME)!.who as RosterId;
    return it.lines.map((l, n): Item => {
      const cast = castOf(l.who);
      return { ...base, id: `${it.id}-${n + 1}`, en: l.en, ja: l.ja, speaker: l.who === ME ? icon : (l.who as RosterId), voice: accentOf(cast), cast, ...(l.tts && { tts: l.tts }) };
    });
  });
}

/** A file's real pieces' clips (a long `real` piece's lines, cut from its recording by scripts/kikimimi-real.ts, never
 *  spoken): what the audio script keeps beside its own. */
export const realClipIds = (raw: unknown): string[] =>
  listenUnit(raw).items.flatMap((it) => (it.kind === 'long' && it.source === 'real' ? listenClipIds(it) : []));

/** A file as its part holds it: the header and the items less `tts` and a tile's `tone` (`en` is what the reveal shows; the marks the
 *  spoken shape), each tile and line with its clip id (listenClipIds), a derived tile with its bank item's speaker. A
 *  tile to re-voice (`revoice`) isn't in it: its clip still says its old words. */
export function listenPart(raw: unknown, bank: ReadonlyMap<string, Pick<Item, 'speaker'>>): ListenPart {
  const { unit, game, stage, status, cando, items } = listenUnit(raw);
  const drop = <T extends { tts?: string }>({ tts: _, ...o }: T): Omit<T, 'tts'> => o;
  return {
    unit, game, stage, status, cando,
    items: items.filter((it) => !(it.kind === 'tile' && it.revoice)).map((it): ListenItem => {
      const ids = listenClipIds(it);
      if (it.kind === 'tile') {
        const { tone: _, ...tile } = drop(it);
        return { ...tile, ...(it.clip && { speaker: bank.get(it.clip)!.speaker }), clip: ids[0] };
      }
      if (it.kind === 'rush') return { ...drop(it), clip: ids[0] };
      if (it.kind === 'weather') return { ...it, sentences: wxSentences(it).map(drop) };
      if (it.kind === 'news') {
        let n = 0;
        return { ...it, segments: it.segments.map((s) => ({ ...s, lines: s.lines.map((l) => ({ ...drop(l), clip: ids[n++] })) })) };
      }
      if (it.kind === 'long') return { ...it, lines: it.lines.map(({ t: _, ...l }, n) => ({ ...drop(l), clip: ids[n] })) };
      return { ...it, lines: it.lines.map((l, n) => ({ ...drop(l), clip: ids[n] })) } as ListenItem;
    })
  };
}

/** A long piece's place on the bank's level scale (its questions' level: its place's first, はまべ 1 … ほし 7). */
export const longLevel = (stage: number): Level => (PLACES[Math.min(5, Math.max(1, stage)) - 1].lvs[0] as Level);
/** A question's angle as the quiz's item type (きろく's skills, the learned difficulty and a review's sibling: the
 *  implied meaning and the attitude `mean`, the gist and the next step `gist`). */
const LONG_TYPE = { gist: 'gist', mean: 'mean', attitude: 'mean', next: 'gist' } as const satisfies Record<LongQ['type'], ItemType>;
/** A question's row id and a dictation's (`<piece>-q1`, `<piece>-k12`: the line's number, from 1). */
export const longQId = (piece: string, k: number): string => `${piece}-q${k + 1}`;
export const longDictId = (piece: string, line: number): string => `${piece}-k${line + 1}`;
/** A file's long pieces as the index's entries (pool.ts: answers this build knows, outside every deck and level): each
 *  question at its piece's level, its angle's type, the piece's pragmatic layer and features; each dictation line at
 *  音の へんしん's level 8, a `word` of its feature (so it counts, and comes back, as the drill's phrases do). */
export function longEntries(raw: unknown): IndexEntry[] {
  const u = listenUnit(raw);
  if (u.game !== 'long' || u.status === 'draft') return [];
  return u.items.flatMap((it): IndexEntry[] => it.kind !== 'long' ? [] : [
    // (the bank's features only: a listening file's own, overlap and filler, have no skill in きろく)
    ...it.questions.map((q, k): IndexEntry => [longQId(it.id, k), longLevel(u.stage), LONG_TYPE[q.type], 'us', it.tags.pragmatic, it.tags.features.filter(isBankFeature)]),
    ...it.dict.map((d): IndexEntry => [longDictId(it.id, d.line), HENSHIN_LV, 'word', 'us', 'literal', [d.feature]])
  ]);
}

/** What shapes a file's decks (its content version's input, compile.ts): each item's id, kind and answer shape (a
 *  tile's tiles and decoys; a call's halves and its memo's option counts and answers; a たちぎき's speakers, offsets
 *  and answers; a rush's chips (a tier keeps them by their numbers), answer and `was`; a bulletin's season, weekday,
 *  lines and its questions' answers and traps; the weather's sentences; a long piece's speakers, gaps, questions and
 *  dictation lines). No Japanese, notes or marks. */
export function listenShape(it: ListenItem): unknown {
  if (it.kind === 'tile') return [it.id, it.kind, it.tiles, it.decoys];
  if (it.kind === 'rush') return [it.id, it.kind, it.options, it.answer, it.was ?? -1];
  if (it.kind === 'call') return [it.id, it.kind, it.half, it.memo.map((r) => r.slots.map((s) => [s.options.length, s.answer]))];
  if (it.kind === 'news') return [it.id, it.kind, it.season, it.weekday ?? '', it.segments.map((s) => s.lines.length), [it.gist, it.detail].map((q) => [q.answer, q.trap])];
  if (it.kind === 'weather') return [it.id, it.kind, wxSentences(it).map((x) => x.key)];
  if (it.kind === 'long') return [it.id, it.kind, it.source, it.lines.map((l) => [l.who, l.at ?? 0]), it.questions.map((q) => [q.type, q.choices.length, q.answer, q.line]), it.dict.map((d) => [d.line, d.words])];
  return [it.id, it.kind, it.lines.map((l) => [l.who, l.at]), it.rounds.map((r) => [r.type, r.answer, r.type === 'plan' ? r.choices.length : 0])];
}
