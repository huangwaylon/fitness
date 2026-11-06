// ききみみ クイズ: the question bank's shape (docs/kikimimi.md "Question types", "Content"): an item's type, its staging
// and the small helpers the game reads it through. No items here: those are authored in bank1.ts (levels 1-3), bank4.ts,
// dialogues.ts, bank5.ts and content/ (all of them in source.ts BANK), and compiled into levels/ (compile.ts), which the
// sheet loads a level at a time (pool.ts).
//   Every item is spoken by scripts/kikimimi-audio.ts (the neural cast, docs/kikimimi.md "Audio") into
// a slice of its pack (static/audio/listen/, packing.ts); changing an item's `en`, `tts`, `voice` or speaker's voice regenerates its clip. Ids
// key the clips in their packs: keep them stable. The lobby offers a level only once every item of it has a clip (compile.ts
// playable). Level 4's dialogues (`gist`, `next`: dialogues.ts) are one clip per line and have a gate of their own.
import { shuffle } from '#lib/random.ts';
import type { RosterId } from '#lib/villagers/roster.ts';
import type { QuizLv } from '../contract/live-protocol.ts';

/** `mean` (level 4): what the speaker really means, from 3 English paraphrases (the literal reading, the opposite and
 *  a plausible wrong inference as distractors). `gist` and `next` (level 4, dialogues.ts): over a 2-4-line dialogue
 *  between two villagers, what's going on or will happen, and the best next line. */
export const ITEM_TYPES = ['pic', 'word', 'num', 'reply', 'mean', 'gist', 'next'] as const;
export type ItemType = (typeof ITEM_TYPES)[number];
/** The dialogue types (an item with `lines`). */
export const DIALOGUE_TYPES: readonly ItemType[] = ['gist', 'next'];
/** The protocol's levels (1-8): 1-4 the stages' quiz, 5 the アナウンス pack (bank5.ts: announcements, voicemails and
 *  phone menus through their channels, about level 4's band), 6 やま and 7 ほし (content/: the stages above level 4), 8
 *  room for the next. */
export type Level = QuizLv;
export type Accent = 'us' | 'uk' | 'au';
/** A level's place on the stages' ladder (progress.ts difficulty, advice.ts nudges): 1-4 themselves; 5, the アナウンス
 *  pack, sits beside level 4 (its band, B1+ → B2), never above it; 6 (やま) and 7 (ほし) the next steps, 5 and 6. */
export const levelRank = (lv: number): number => (lv === 5 ? 4 : lv > 5 ? lv - 1 : lv);
/** The stage's level at a place on the ladder (levelRank's inverse, never the pack). */
export const levelAt = (rank: number): Level => (rank > 4 ? rank + 1 : rank) as Level;
/** A cast voice of the neural TTS (docs/curriculum.md §9; 18 voices, 12 of them US: speech.ts SLOTS lists the ones that
 *  exist, scripts/tts/cast.json describes them): accent, gender, slot. Each villager speaks with a US one for good
 *  (cast.ts CAST), a few with a UK or AU one too on the やま/ほし accent-exposure items (EXPOSURE). */
export type CastId = `${Accent}-${'f' | 'm'}${1 | 2 | 3 | 4 | 5 | 6}`;
/** A cast voice's accent (us-f1 → us). */
export const accentOf = (cast: CastId): Accent => cast.slice(0, 2) as Accent;

/** Who's talking to whom (Tags.register) and what's meant beyond the words (Tags.pragmatic). */
export const REGISTERS = ['service', 'colleague', 'boss', 'friend', 'partner', 'neighbour', 'stranger', 'official', 'broadcast'] as const;
export const PRAGMATICS = ['literal', 'indirect', 'refusal', 'hedge', 'understatement', 'sarcasm', 'humour', 'formula', 'ritual', 'attitude', 'deception'] as const;

/** The scenario generator's dimensions an item was made from (docs/curriculum.md §5): they drive the levers, review
 *  and coverage later. */
export interface Tags {
  /** The scenario seed (docs/curriculum.md §5.5, 1-66): its setting, goal and complication. */
  seed: number;
  register: (typeof REGISTERS)[number];
  pragmatic: (typeof PRAGMATICS)[number];
  /** Speech conditions for the mix (none: studio clean). */
  conditions?: readonly ('phone' | 'voicemail' | 'pa' | 'video' | 'cafe' | 'station' | 'street' | 'desk')[];
  /** The sound features it trains (curriculum §3). */
  features?: readonly Feature[];
}

/** The sound and listening features an item trains (curriculum §3): level 4's (bank4.ts `tags`) and S0's segmentals
 *  (levels 1-3, tags.ts): L/R, the vowel contrasts, b/v/f/p, th, s/sh/ch, f/h, word endings (-s, -ed), katakana
 *  traps, a "not X but Y" contrast, clock talk (a quarter after, a quarter of); `accent-exposure`, a UK or AU voice heard on
 *  purpose (やま and ほし only, about a tenth of each, standard English without slang; American is the default). */
export type Feature = 'contraction' | 'weak-form' | 'flap' | 'yod' | 'gonna' | 'wanna' | 'gotta' | 'lemme' | 'dunno' | 'kinda' |
  'can-cant' | 't-glottal' | 'teen-ty' | 'self-repair' | 'numbers' | 'ellipsis' | 'idiom' | 'intonation' |
  'l-r' | 'vowel' | 'b-v' | 'th' | 'sh-s' | 'f-h' | 'ending' | 'katakana' | 'contrast' | 'clock' | 'accent-exposure';

/** A dialogue's line: who says it (their cast voice), what's shown and its Japanese, what's spoken when it differs. Each
 *  line is its own clip (clips.ts clipIds: `<item>-<n>`). */
export interface Line {
  who: RosterId;
  cast: CastId;
  en: string;
  ja: string;
  tts?: string;
  /** The sound marks over this line at the reveal (staging.ts MARKS, by its clip id). */
  marks?: readonly SoundMark[];
  /** This line's speech condition, when it isn't the dialogue's (`Item.cond`). */
  cond?: Cond;
}

export interface Item {
  /** Stable: the clip's file name. */
  id: string;
  lv: Level;
  type: ItemType;
  /** The sentence as shown at the reveal (and spoken, unless `tts`). */
  en: string;
  /** Its Japanese (a `reply`'s: the question → the right reply). */
  ja: string;
  /** Who says it (a roster id: their icon, and the voice's gender). */
  speaker: RosterId;
  voice: Accent;
  /** `pic`: art keys (static/art/<key>.webp; Japanese labels in PIC_JA). `word`: the words. `num`: the written
   *  numbers. `reply`: the replies. */
  choices: readonly string[];
  /** The right choice's index in `choices` (as authored; deck() returns it shuffled). */
  answer: number;
  /** The key words in `en`, highlighted at the reveal (`word`: the answer as it appears in `en`, shown as a blank
   *  before). */
  focus?: string;
  /** The question shown in Japanese while it plays (`pic`, `num`): what to listen for. */
  ask?: string;
  /** What's spoken, when it isn't `en` as written (docs/curriculum.md §9): reductions spelled as said (gonna, lemme,
   *  d'you), numbers written out. */
  tts?: string;
  /** Level 4: why the sound or the logic fools you, in Japanese (≤ 40 字), shown at the reveal. */
  note?: string;
  /** Level 4: the cast voice (its accent is `voice`, its gender the speaker's). */
  cast?: CastId;
  /** Level 4: the scenario it was made from. */
  tags?: Tags;
  /** A dialogue's lines (`gist`, `next`): played in turn, one clip each; `en` is them joined, `speaker` the first's. */
  lines?: readonly Line[];
  /** Where it's heard (level 4, staging.ts PLACES): the scene card's backdrop while it plays. None: the plain stage. */
  scene?: SceneId;
  /** How it's heard (staging.ts PLACES): face to face, a phone, a PA, a video call; else from `tags.conditions`
   *  (channelOf). */
  channel?: Channel;
  /** The sound marks over `en` at the reveal (staging.ts MARKS; a dialogue's are its lines'). */
  marks?: readonly SoundMark[];
  /** The speech condition mixed over the clean take (staging.ts NOISE, or the item's own; a phone or PA channel
   *  without one gets its light condition: conditions.ts condOf). A dialogue's lines take it unless they have their own. */
  cond?: Cond;
  /** A スピード はしご rung (ladder.ts): its ladder, its place on it (1-4) and its speed (× natural speech). Its clip is
   *  the ladder's line at that speed (its id, `<ladder>-<n>`). Never in BANK. */
  rung?: Rung;
}

/** An item as the index knows it (pool.ts ENTRIES, without loading its level): what きろく's stats, the advice and
 *  にがて れんしゅう's picks read (tags.ts tagsOf, skillsOf). Every Item is one. */
export type Entry = Pick<Item, 'id' | 'lv' | 'type' | 'voice'> & { tags?: Pick<Tags, 'pragmatic' | 'features'> };

/** A rung of a スピード はしご (docs/kikimimi.md "スピード はしご"). */
interface Rung {
  ladder: string;
  n: number;
  speed: number;
}

// ---- staging: the scene, the channel and the sound marks (docs/kikimimi.md "Visuals") --------------------------------

/** The scene backdrops (static/art/scene/<id>{,@2x,@3x}.webp, painted by scripts/scenes/scenes.ts). */
export const SCENE_IDS = ['cafe', 'platform', 'pharmacy', 'office', 'door', 'gate', 'street', 'living'] as const;
export type SceneId = (typeof SCENE_IDS)[number];
/** How a clip reaches the listener: face to face, a phone call (voicemail too), a PA announcement, a video call. */
export const CHANNELS = ['live', 'phone', 'pa', 'video'] as const;
export type Channel = (typeof CHANNELS)[number];
/**
 * A sound mark over the revealed text (docs/curriculum.md §8), on whole words of the line (`at`, its first whole-word
 * match): `say` the shape it's said in above the spelling (going to → gonna, 14 → fourTEEN); `link` arcs between the
 * words of `at` (pick‿it‿up); `drop` the letters swallowed, greyed (the last `drop` in the word: tryin(g)); `stress` ●
 * over each word of `at` (space-separated, each its first whole-word match).
 */
export type SoundMark = readonly ['say', at: string, said: string] | readonly ['link', at: string] | readonly ['drop', at: string, letters: string] | readonly ['stress', words: string];

/**
 * A speech condition, mixed offline over the clean take (docs/kikimimi.md "Conditions", docs/curriculum.md §5.3 and §9;
 * scripts/kikimimi-audio.ts with conditions.ts): a channel (a phone line, a voicemail, a PA in a hall) or a noise bed
 * (a café, a street, a station), `light` or `heavy` (the beds' SNR +15 / +10 dB), and a channel's `bed` behind it (a PA
 * on a platform, a caller in a café). Part of the clip's source hash; the clean master stays cached.
 */
export const COND_KINDS = ['phone', 'voicemail', 'pa', 'cafe', 'street', 'station'] as const;
type CondKind = (typeof COND_KINDS)[number];
/** The noise beds (scripts/tts/beds/<bed>.m4a, made by scripts/kikimimi-beds.ts). */
export const BEDS = ['cafe', 'street', 'station'] as const;
export type Bed = (typeof BEDS)[number];
export interface Cond {
  kind: CondKind;
  level: 'light' | 'heavy';
  /** A channel's background (a bed kind is its own). */
  bed?: Bed;
}

/** An item's channel: its own, else from its conditions (a phone or voicemail, a PA, a video call), else face to face. */
export function channelOf(it: Pick<Item, 'channel' | 'tags'>): Channel {
  if (it.channel) return it.channel;
  const c = it.tags?.conditions ?? [];
  return c.includes('phone') || c.includes('voicemail') ? 'phone' : c.includes('pa') ? 'pa' : c.includes('video') ? 'video' : 'live';
}

/** Whether an item is a dialogue (its lines are its clips). */
export const isDialogue = (it: Pick<Item, 'lines'>): it is Item & { lines: readonly Line[] } => !!it.lines?.length;

/** An item's clip ids: its own id, or a dialogue's one per line, `<id>-<n>` (n from 1). */
export const clipIds = (it: Pick<Item, 'id' | 'lines'>): string[] => (isDialogue(it) ? it.lines.map((_, n) => `${it.id}-${n + 1}`) : [it.id]);

/** What the audio script speaks, one item per clip (scripts/kikimimi-audio.ts maps it over the bank; here, not in clips.ts, so
 *  the script needn't load clips.json): the item itself,
 *  or each of a dialogue's lines as an item of its own (its clip id, its speaker and cast voice, its `en`, `tts` and
 *  `ja`; no lines), so the script's voice and text rules (speech.ts castOf, spokenText) need no dialogue case. */
export function clipItems(it: Item): Item[] {
  if (!isDialogue(it)) return [it];
  const ids = clipIds(it);
  return it.lines.map((l, n): Item => {
    const { lines: _, tts: __, ...rest } = it;
    return { ...rest, id: ids[n], en: l.en, ja: l.ja, speaker: l.who, voice: accentOf(l.cast), cast: l.cast, ...(l.tts && { tts: l.tts }), ...(l.cond && { cond: l.cond }) };
  });
}

/** A copy of an item with its choices in a seeded order: `choices` the shuffled order, `answer` the right one's index
 *  in it (`set`: another choice set for the same audio, a lesson tier's). Every deck deals its items through this. */
export function shuffleChoices(it: Item, r: () => number, set: Pick<Item, 'choices' | 'answer'> = it): Item {
  const order = shuffle(set.choices.map((_, i) => i), r);
  return { ...it, choices: order.map((i) => set.choices[i]), answer: order.indexOf(set.answer) };
}

/** Japanese names of the `pic` art (the choices' VoiceOver labels and the review list: the English isn't given away). */
export const PIC_JA: Readonly<Record<string, string>> = {
  'critters/squid': 'イカ',
  'critters/tuna': 'マグロ',
  'critters/octopus': 'タコ',
  'critters/sea-bass': 'スズキ',
  'critters/clownfish': 'クマノミ',
  'critters/sea-star': 'ヒトデ',
  'critters/tarantula': 'タランチュラ',
  'critters/scorpion': 'サソリ',
  'critters/wasp': 'ハチ',
  'critters/centipede': 'ムカデ',
  'critters/spider': 'クモ',
  'critters/old-tire': 'ふるいタイヤ',
  'critters/boot': 'ながぐつ',
  'critters/empty-can': 'あきかん',
  'critters/coelacanth': 'シーラカンス',
  'critters/great-white-shark': 'サメ',
  'critters/whale-shark': 'ジンベエザメ',
  'critters/hammerhead-shark': 'シュモクザメ',
  'critters/ocean-sunfish': 'マンボウ',
  'critters/common-butterfly': 'チョウ',
  'critters/ladybug': 'テントウムシ',
  'critters/honeybee': 'ミツバチ',
  'critters/red-dragonfly': 'アカトンボ',
  'fruit/apple': 'リンゴ',
  'fruit/cherry': 'サクランボ',
  'fruit/peach': 'モモ',
  'fruit/pear': 'ナシ',
  'items/dumbbell': 'ダンベル',
  'decor/kettlebell-0': 'ケトルベル',
  'decor/barbell-0': 'バーベル',
  'decor/exercise-ball-0': 'バランスボール',
  'decor/treadmill-0': 'ランニングマシン',
  'decor/exercise-bike-0': 'エアロバイク',
  'decor/weight-bench-0': 'ベンチ',
  'decor/punching-bag-0': 'サンドバッグ',
  'decor/protein-shaker-0': 'プロテイン',
  'decor/digital-scale-0': 'たいじゅうけい',
  'decor/water-cooler-0': 'みず',
  'deco/snowboy-0': 'ゆきだるま',
  'deco/sandcastle': 'すなのしろ',
  'deco/campfire': 'たきび',
  'deco/birthday-cake': 'ケーキ',
  'deco/hammock': 'ハンモック',
  'finds/shovel': 'スコップ',
  'finds/watering-can': 'じょうろ',
  'finds/ammonite': 'かせき',
  'finds/tree-branch': 'きのえだ',
  'finds/items/blue-umbrella': 'かさ',
  'finds/items/baseball-cap': 'ぼうし',
  'finds/items/beach-ball': 'ビーチボール',
  'finds/items/fan': 'せんぷうき',
  'finds/items/electric-guitar': 'ギター',
  'finds/items/upright-piano': 'ピアノ',
  'finds/items/drum-set': 'ドラム',
  'finds/items/fancy-violin': 'バイオリン',
  'finds/items/coffee-cup': 'コーヒー',
  'finds/items/iced-lemon-tea': 'レモンティー',
  'finds/items/blood-orange-juice': 'オレンジジュース',
  'finds/items/strawberry-soda': 'いちごソーダ',
  'finds/items/melon-soda': 'メロンソーダ',
  'finds/items/mountain-bike': 'じてんしゃ',
  'finds/items/train-set': 'でんしゃ',
  'finds/items/hi-tech-sneakers': 'スニーカー',
  'finds/items/yoga-mat': 'ヨガマット',
  'finds/items/beach-towel': 'タオル',
  'finds/items/sleeping-bag': 'ねぶくろ',
  'finds/items/slr-camera': 'カメラ',
  'finds/items/cordless-phone': 'でんわ',
  'finds/items/laptop': 'パソコン',
  'finds/items/miso-ramen': 'ラーメン',
  'finds/items/curry-with-rice': 'カレー',
  'finds/items/veggie-sandwich-set': 'サンドイッチ',
  'finds/items/walking-shoes': 'くつ'
};

/** `en` around its focus: [before, focus, after] (the focus '' when there is none or it isn't in `en`): marked at the
 *  reveal and in the review list, a `word` item's blank before. */
export function splitFocus(it: Pick<Item, 'en' | 'focus'>): [string, string, string] {
  const f = it.focus, at = f ? it.en.indexOf(f) : -1;
  return !f || at < 0 ? [it.en, '', ''] : [it.en.slice(0, at), f, it.en.slice(at + f.length)];
}

/** The Japanese as shown: a `reply`'s (or a `mean`'s) on two lines, the question, then 「→ the reply」 (the gist);
 *  else one line. */
export function jaLines(it: Pick<Item, 'ja'>): string[] {
  const at = it.ja.indexOf('→');
  return at < 0 ? [it.ja] : [it.ja.slice(0, at).trim(), `→ ${it.ja.slice(at + 1).trim()}`];
}

