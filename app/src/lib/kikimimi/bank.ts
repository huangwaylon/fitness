// ききみみ クイズ: the question bank (docs/kikimimi.md "Question types", "Content"). Loaded with the game only (the
// sheet's lazy chunk imports deck.ts, which imports this): nothing in the first load names it.
//   Written for Japanese adult learners. `pic` tests the sentence, not the noun: the words are ones players know (or
// katakana traps), and the wrong pictures are heard in the sentence too or sound close. `word` gives 3 near-sound
// choices that all fit the sentence, so meaning can't give it away. `num` comes from templates (speaker × phrase ×
// number) with close distractors. `reply` is TOEIC Part 2: the traps repeat a word or a sound of the question, answer
// another wh-question, or say yes/no to a wh-question.
//   Accents: level 1 is US only, level 2 adds UK, level 3 adds AU. Jock villagers say gym lines.
//   Every item is spoken by scripts/kikimimi-audio.ts (the neural cast, docs/kikimimi.md "Audio") into
// static/audio/kikimimi/<id>.m4a; changing an item's `en`, `tts`, `voice` or speaker's voice regenerates its clip. Ids
// are file names: keep them stable. The lobby offers a level only once every item of it has a clip (deck.ts LEVELS).
// Level 4's dialogues (`gist`, `next`: dialogues.ts) are one clip per line and have a gate of their own (deck.ts mixes).
import type { RosterId } from '#lib/villagers/roster.ts';
import type { QuizLv } from '../contract/live-protocol.ts';
import { BANK4 } from './bank4.ts';
import { DIALOGUES } from './dialogues.ts';

/** `mean` (level 4): what the speaker really means, from 3 English paraphrases (the literal reading, the opposite and
 *  a plausible wrong inference as distractors). `gist` and `next` (level 4, dialogues.ts): over a 2-4-line dialogue
 *  between two villagers, what's going on or will happen, and the best next line. */
export type ItemType = 'pic' | 'word' | 'num' | 'reply' | 'mean' | 'gist' | 'next';
/** The dialogue types (an item with `lines`). */
export const DIALOGUE_TYPES: readonly ItemType[] = ['gist', 'next'];
/** The protocol's levels (1-5); the bank has 1-4 (5 is room for the next without a relay deploy). */
export type Level = QuizLv;
export type Accent = 'us' | 'uk' | 'au';
/** A cast voice of the neural TTS (docs/curriculum.md §9; 12 voices, US weighted: speech.ts SLOTS lists the ones that
 *  exist, scripts/tts/cast.json describes them): accent, gender, slot. Each villager speaks with one for good (bank4.ts
 *  CAST). */
export type CastId = `${Accent}-${'f' | 'm'}${1 | 2 | 3}`;

/** The scenario generator's dimensions an item was made from (docs/curriculum.md §5): they drive the levers, review
 *  and coverage later. */
export interface Tags {
  /** The scenario seed (docs/curriculum.md §5.5, 1-66): its setting, goal and complication. */
  seed: number;
  register: 'service' | 'colleague' | 'boss' | 'friend' | 'partner' | 'neighbour' | 'stranger' | 'official' | 'broadcast';
  pragmatic: 'literal' | 'indirect' | 'refusal' | 'hedge' | 'understatement' | 'sarcasm' | 'humour' | 'formula' | 'ritual' | 'attitude' | 'deception';
  /** Speech conditions for the mix (none: studio clean). */
  conditions?: readonly ('phone' | 'voicemail' | 'pa' | 'video' | 'cafe' | 'station' | 'desk')[];
  /** The sound features it trains (curriculum §3). */
  features?: readonly Feature[];
}

/** The sound and listening features an item trains (curriculum §3): level 4's (bank4.ts `tags`) and S0's segmentals
 *  (levels 1-3, tags.ts): L/R, the vowel contrasts, b/v/f/p, th, s/sh/ch, f/h, word endings (-s, -ed), katakana
 *  traps, a "not X but Y" contrast, clock talk (quarter past, half seven). */
export type Feature = 'contraction' | 'weak-form' | 'flap' | 'yod' | 'gonna' | 'wanna' | 'gotta' | 'lemme' | 'dunno' | 'kinda' |
  'can-cant' | 't-glottal' | 'teen-ty' | 'self-repair' | 'numbers' | 'ellipsis' | 'idiom' | 'intonation' |
  'l-r' | 'vowel' | 'b-v' | 'th' | 'sh-s' | 'f-h' | 'ending' | 'katakana' | 'contrast' | 'clock';

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
    return { ...rest, id: ids[n], en: l.en, ja: l.ja, speaker: l.who, voice: l.cast.slice(0, 2) as Accent, cast: l.cast, ...(l.tts && { tts: l.tts }) };
  });
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

// ---- authored items -------------------------------------------------------------------------------------------------

type Row = readonly [id: string, speaker: RosterId, voice: Accent, en: string, ja: string, choices: readonly string[], extra?: Partial<Item>];
const make = (lv: Level, type: ItemType) => ([id, speaker, voice, en, ja, choices, extra]: Row): Item =>
  ({ id, lv, type, en, ja, speaker, voice, choices, answer: 0, ...extra });
/** A `word` item: the first choice is the answer and the focus. */
const word = (lv: Level) => (r: Row): Item => ({ ...make(lv, 'word')(r), focus: r[5][0], ...r[6] });

const PIC: readonly (readonly [Level, ...Row])[] = [
  // level 1
  [1, 'p1-squid', 'cj', 'us', "I didn't catch a tuna, but I got a squid!", 'マグロは つれなかったけど、イカが つれた！',
    ['critters/squid', 'critters/tuna', 'critters/octopus', 'critters/sea-bass'], { ask: 'なにが つれた？', focus: 'squid' }],
  [1, 'p1-peach', 'goldie', 'us', 'Apples are nice, but I love peaches!', 'リンゴも いいけど、モモが だいすき！',
    ['fruit/peach', 'fruit/apple', 'fruit/pear', 'fruit/cherry'], { ask: 'いちばん すきな くだものは？', focus: 'peaches' }],
  [1, 'p1-cherry', 'bunnie', 'us', 'Can I have some cherries? I have lots of apples.', 'サクランボ もらえる？ リンゴなら たくさん あるの。',
    ['fruit/cherry', 'fruit/apple', 'fruit/peach', 'fruit/pear'], { ask: 'ほしい ものは？', focus: 'cherries' }],
  [1, 'p1-dumbbell', 'dom', 'us', 'Grab a dumbbell. Not the kettlebell, the dumbbell!', 'ダンベルを もって。ケトルベルじゃなくて、ダンベル！',
    ['items/dumbbell', 'decor/kettlebell-0', 'decor/barbell-0', 'decor/exercise-ball-0'], { ask: 'どれを もつ？', focus: 'dumbbell' }],
  [1, 'p1-treadmill', 'hamlet', 'us', "Let's run on the treadmill today. The bike can wait!", 'きょうは ランニングマシンで はしろう。バイクは またこんど！',
    ['decor/treadmill-0', 'decor/exercise-bike-0', 'decor/weight-bench-0', 'decor/punching-bag-0'], { ask: 'きょう つかうのは？', focus: 'treadmill' }],
  [1, 'p1-tarantula', 'bob', 'us', "Look out! There's a tarantula behind you!", 'あぶない！ うしろに タランチュラが いるよ！',
    ['critters/tarantula', 'critters/scorpion', 'critters/wasp', 'critters/centipede'], { ask: 'なにが いる？', focus: 'tarantula' }],
  [1, 'p1-umbrella', 'molly', 'us', "It's raining, so take an umbrella. You won't need your cap.", 'あめだから かさを もっていってね。ぼうしは いらないよ。',
    ['finds/items/blue-umbrella', 'finds/items/baseball-cap', 'finds/items/beach-ball', 'finds/items/fan'], { ask: 'もっていく ものは？', focus: 'umbrella' }],
  [1, 'p1-guitar', 'rosie', 'us', 'Raymond plays the piano, and I play the guitar!', 'レイモンドは ピアノで、わたしは ギターを ひくの！',
    ['finds/items/electric-guitar', 'finds/items/upright-piano', 'finds/items/drum-set', 'finds/items/fancy-violin'], { ask: 'このひとが ひくのは？', focus: 'I play the guitar' }],
  [1, 'p1-coffee', 'anchovy', 'us', "No juice for me, thanks. I'll have a coffee.", 'ジュースは いいや。コーヒーを ください。',
    ['finds/items/coffee-cup', 'finds/items/iced-lemon-tea', 'finds/items/blood-orange-juice', 'finds/items/strawberry-soda'], { ask: 'なにを たのんだ？', focus: 'coffee' }],
  [1, 'p1-octopus', 'stitches', 'us', "Hey, that's not a fish. It's an octopus!", 'ねえ、それ さかなじゃないよ。タコだよ！',
    ['critters/octopus', 'critters/squid', 'critters/clownfish', 'critters/sea-star'], { ask: 'なんだった？', focus: 'octopus' }],
  [1, 'p1-bike', 'kid-cat', 'us', 'I ride my bike to the beach every morning. Great for the legs!', 'まいあさ じてんしゃで ビーチまで いくんだ。あしに きくぞ！',
    ['finds/items/mountain-bike', 'finds/items/train-set', 'finds/items/hi-tech-sneakers', 'finds/items/beach-towel'], { ask: 'なにで いく？', focus: 'bike' }],
  [1, 'p1-yoga', 'roald', 'us', "Bring your yoga mat. We're stretching today!", 'ヨガマットを もってきて。きょうは ストレッチだ！',
    ['finds/items/yoga-mat', 'finds/items/beach-towel', 'finds/items/sleeping-bag', 'decor/exercise-ball-0'], { ask: 'なにを もってくる？', focus: 'yoga mat' }],
  [1, 'p1-protein', 'dom', 'us', 'After training, I always drink a protein shake!', 'トレーニングの あとは いつも プロテインを のむんだ！',
    ['decor/protein-shaker-0', 'finds/items/coffee-cup', 'finds/items/iced-lemon-tea', 'finds/items/melon-soda'], { ask: 'トレーニングの あとに のむのは？', focus: 'protein shake' }],
  [1, 'p1-snowman', 'lily', 'us', "It's snowing! Let's build a snowman together.", 'ゆきだ！ いっしょに ゆきだるまを つくろう。',
    ['deco/snowboy-0', 'deco/sandcastle', 'deco/campfire', 'deco/birthday-cake'], { ask: 'なにを つくる？', focus: 'snowman' }],
  [1, 'p1-shovel', 'blathers', 'us', "To dig up fossils, you'll need a shovel. Hoo!", 'かせきを ほるなら スコップが ひつようですぞ。ホー！',
    ['finds/shovel', 'finds/watering-can', 'finds/ammonite', 'finds/tree-branch'], { ask: 'ひつような ものは？', focus: 'shovel' }],
  [1, 'p1-cake', 'cherry', 'us', 'Happy birthday! I baked you a cake.', 'おたんじょうび おめでとう！ ケーキを やいたよ。',
    ['deco/birthday-cake', 'deco/campfire', 'deco/sandcastle', 'fruit/cherry'], { ask: 'なにを くれた？', focus: 'cake' }],
  // level 2
  [2, 'p2-tire', 'cj', 'us', "I thought I'd hooked a shark, but it was just an old tire.", 'サメが かかったと おもったら、ただの ふるいタイヤだった。',
    ['critters/old-tire', 'critters/great-white-shark', 'critters/boot', 'critters/empty-can'], { ask: 'なにが つれた？', focus: 'an old tire' }],
  [2, 'p2-kettlebell', 'dom', 'uk', "Put the barbell down and pick up the kettlebell. We're doing swings!", 'バーベルを おいて、ケトルベルを もって。スイングを やるぞ！',
    ['decor/kettlebell-0', 'decor/barbell-0', 'items/dumbbell', 'decor/exercise-ball-0'], { ask: 'どれを もつ？', focus: 'pick up the kettlebell' }],
  [2, 'p2-bench', 'roald', 'us', 'Forget the treadmill. Today we hit the weight bench!', 'ランニングマシンは わすれて。きょうは ベンチで きたえるぞ！',
    ['decor/weight-bench-0', 'decor/treadmill-0', 'decor/exercise-bike-0', 'decor/punching-bag-0'], { ask: 'きょう つかうのは？', focus: 'weight bench' }],
  [2, 'p2-scale', 'stitches', 'uk', "I stepped on the scales this morning... Let's not talk about it.", 'けさ たいじゅうけいに のったんだ… その はなしは やめよう。',
    ['decor/digital-scale-0', 'decor/exercise-bike-0', 'decor/treadmill-0', 'decor/weight-bench-0'], { ask: 'けさ なにに のった？', focus: 'the scales' }],
  [2, 'p2-camera', 'judy', 'us', "I meant to bring my laptop, but I only brought my camera.", 'パソコンを もってくる つもりだったけど、カメラしか もってこなかった。',
    ['finds/items/slr-camera', 'finds/items/laptop', 'finds/items/cordless-phone', 'finds/items/electric-guitar'], { ask: 'もってきたのは？', focus: 'my camera' }],
  [2, 'p2-pear', 'goldie', 'uk', 'We have plenty of peaches and apples here. What we really need is pears.', 'ここには モモも リンゴも たくさん ある。ほんとうに ほしいのは ナシなの。',
    ['fruit/pear', 'fruit/peach', 'fruit/apple', 'fruit/cherry'], { ask: 'ほしいのは？', focus: 'pears' }],
  [2, 'p2-spider', 'molly', 'us', 'I was shaking a tree for apples, and a spider dropped down!', 'リンゴを とろうと きを ゆらしたら、クモが おちてきたの！',
    ['critters/spider', 'fruit/apple', 'critters/wasp', 'finds/tree-branch'], { ask: 'なにが おちてきた？', focus: 'a spider' }],
  [2, 'p2-hammock', 'anchovy', 'uk', "I was going to go jogging, but I'd rather nap in my hammock.", 'ジョギングに いく つもりだったけど、ハンモックで ひるねしたいな。',
    ['deco/hammock', 'finds/items/walking-shoes', 'decor/treadmill-0', 'deco/campfire'], { ask: 'このひとが したいのは？', focus: 'nap in my hammock' }],
  [2, 'p2-ramen', 'ankha', 'us', "It's freezing. Let's skip the sandwiches and get some hot ramen.", 'さむいわ。サンドイッチは やめて、あつい ラーメンに しましょう。',
    ['finds/items/miso-ramen', 'finds/items/veggie-sandwich-set', 'finds/items/curry-with-rice', 'finds/items/iced-lemon-tea'], { ask: 'なにを たべる？', focus: 'hot ramen' }],
  [2, 'p2-violin', 'marshal', 'uk', "Everyone thinks I play the guitar, but it's actually the violin.", 'みんな ぼくが ギターを ひくと おもってるけど、じつは バイオリンなんだ。',
    ['finds/items/fancy-violin', 'finds/items/electric-guitar', 'finds/items/upright-piano', 'finds/items/drum-set'], { ask: 'このひとが ひくのは？', focus: "it's actually the violin" }],
  // level 3
  [3, 'p3-whale-shark', 'cj', 'au', 'Everyone panicked when they saw the fin, but it was just a harmless whale shark.', 'ヒレを みて みんな パニックに なったけど、おとなしい ジンベエザメだった。',
    ['critters/whale-shark', 'critters/great-white-shark', 'critters/hammerhead-shark', 'critters/ocean-sunfish'], { ask: 'なんだった？', focus: 'a harmless whale shark' }],
  [3, 'p3-water', 'hamlet', 'us', 'Forget the coffee. After that run, what I really need is some ice-cold water.', 'コーヒーは いいや。あれだけ はしったら、ほしいのは つめたい みずだ。',
    ['decor/water-cooler-0', 'finds/items/coffee-cup', 'decor/protein-shaker-0', 'finds/items/iced-lemon-tea'], { ask: 'ほしいのは？', focus: 'ice-cold water' }],
  [3, 'p3-butterfly', 'flick', 'us', "It's not the ladybug I'm after. It's the butterfly right behind it.", 'ねらってるのは テントウムシじゃない。その すぐ うしろの チョウだ。',
    ['critters/common-butterfly', 'critters/ladybug', 'critters/honeybee', 'critters/red-dragonfly'], { ask: 'ねらって いるのは？', focus: 'the butterfly' }],
  [3, 'p3-boot', 'apollo', 'us', "Three hours of fishing, and what've I got to show for it? A soggy old boot.", '3じかんも つりを して、えものは？ ぬれた ふるい ながぐつ だけだ。',
    ['critters/boot', 'critters/old-tire', 'critters/empty-can', 'critters/coelacanth'], { ask: 'なにが つれた？', focus: 'A soggy old boot' }],
  [3, 'p3-orange', 'diana', 'uk', 'I usually go for apple juice, but today I fancy an orange one.', 'いつもは リンゴジュースだけど、きょうは オレンジの きぶん。',
    ['finds/items/blood-orange-juice', 'fruit/apple', 'finds/items/strawberry-soda', 'finds/items/melon-soda'], { ask: 'きょう のみたいのは？', focus: 'an orange one' }],
  [3, 'p3-bike', 'roald', 'au', "My knees are killing me, so I'm swapping the treadmill for the bike today.", 'ひざが いたくて たまらないから、きょうは ランニングマシンを やめて バイクに する。',
    ['decor/exercise-bike-0', 'decor/treadmill-0', 'decor/weight-bench-0', 'finds/items/yoga-mat'], { ask: 'きょう つかうのは？', focus: 'the bike' }],
  [3, 'p3-umbrella', 'fauna', 'au', "The forecast says sunny, but I'm taking my umbrella just in case.", 'てんきよほうは はれだけど、ねんのため かさを もっていくわ。',
    ['finds/items/blue-umbrella', 'finds/items/baseball-cap', 'finds/items/fan', 'finds/items/beach-ball'], { ask: 'もっていく ものは？', focus: 'my umbrella' }],
  [3, 'p3-drums', 'raymond', 'us', 'I gave up the piano years ago. These days it\'s all about the drums.', 'ピアノは とっくに やめたよ。いまは ドラム ひとすじさ。',
    ['finds/items/drum-set', 'finds/items/upright-piano', 'finds/items/electric-guitar', 'finds/items/fancy-violin'], { ask: 'いま やっているのは？', focus: 'the drums' }]
];

const WORD: readonly (readonly [Level, ...Row])[] = [
  // level 1 (US): L/R, vowels, f/v, s/sh/th, can/can't
  [1, 'w1-right', 'goldie', 'us', 'Hmm, I think the right one is better.', 'うーん、みぎの ほうが いいと おもう。', ['right', 'light', 'white']],
  [1, 'w1-rock', 'stitches', 'us', 'Whoa, look at that big rock!', 'わあ、あの おおきな いわ みて！', ['rock', 'lock', 'log']],
  [1, 'w1-grass', 'fauna', 'us', "Please don't step on the grass.", 'しばふに はいらないでね。', ['grass', 'glass', 'gas']],
  [1, 'w1-hat', 'judy', 'us', 'Oh, I love your new hat!', 'わあ、あたらしい ぼうし すてき！', ['hat', 'hut', 'cat']],
  [1, 'w1-cup', 'anchovy', 'us', "Huh? Where's my cup?", 'あれ？ ぼくの コップ どこ？', ['cup', 'cap', 'cab']],
  [1, 'w1-bug', 'bob', 'us', "Wait! There's a bug on your arm!", 'まって！ うでに むしが いるよ！', ['bug', 'bag', 'bat']],
  [1, 'w1-walk', 'hamlet', 'us', "Let's walk after lunch. It's good for you!", 'おひるの あと、あるこう。からだに いいよ！', ['walk', 'work', 'talk']],
  [1, 'w1-cant', 'lily', 'us', "I can't swim very well.", 'わたし、あまり およげないの。', ["can't", 'can', 'could']],
  [1, 'w1-play', 'bunnie', 'us', "Let's play outside!", 'そとで あそぼう！', ['play', 'pray', 'pay']],
  [1, 'w1-hard', 'raymond', 'us', 'This chair is too hard.', 'この いす、かたすぎるね。', ['hard', 'hot', 'high']],
  [1, 'w1-ship', 'gulliver', 'us', 'Look at that big ship!', 'あの おおきな ふねを みて！', ['ship', 'sheep', 'shop']],
  [1, 'w1-sing', 'kk-slider', 'us', 'I love to sing in the bath.', 'おふろで うたうのが すきなんだ。', ['sing', 'think', 'sink']],
  [1, 'w1-fan', 'molly', 'us', 'I want a new fan.', 'あたらしい せんぷうきが ほしいな。', ['fan', 'van', 'pan']],
  [1, 'w1-fly', 'apollo', 'us', 'Can you fly? I can.', 'きみは とべるか？ おれは とべるぞ。', ['fly', 'fry', 'cry']],
  [1, 'w1-collect', 'blathers', 'us', 'Did you collect them all? Splendid!', 'ぜんぶ あつめたのですか？ すばらしい！', ['collect', 'correct', 'connect']],
  // level 2 (US, UK): plurals, final consonants, sh/ch, th/f, vowels in a longer line
  [2, 'w2-cats', 'raymond', 'uk', 'I really like your cats.', 'きみの ところの ネコ、ほんとうに かわいいね。', ['cats', 'cat', 'caps']],
  [2, 'w2-live', 'goldie', 'us', "I'd love to live by the sea someday.", 'いつか うみの そばに すみたいな。', ['live', 'leave', 'lie']],
  [2, 'w2-seat', 'brewster', 'uk', 'Please, take a seat.', 'どうぞ、おかけください。', ['seat', 'sheet', 'seed']],
  [2, 'w2-first', 'kid-cat', 'us', 'I was first in the race today!', 'きょうの レースで 1ばんだったぞ！', ['first', 'fast', 'last']],
  [2, 'w2-watch', 'diana', 'uk', 'Could you watch my bag for a minute?', 'ちょっと わたしの バッグを みていて くれる？', ['watch', 'wash', 'catch']],
  [2, 'w2-ball', 'roald', 'us', 'Pass me the ball!', 'ボールを パスして！', ['ball', 'bowl', 'bell']],
  [2, 'w2-best', 'judy', 'us', 'I think this one is the best.', 'これが いちばん いいと おもう。', ['best', 'vest', 'test']],
  [2, 'w2-cant', 'dom', 'uk', "I can't make it to the gym tomorrow.", 'あしたは ジムに いけないんだ。', ["can't", 'can', 'could']],
  [2, 'w2-read', 'lily', 'us', "Who's going to read first?", 'だれが さいしょに よむ？', ['read', 'lead', 'leave']],
  [2, 'w2-cloud', 'celeste', 'uk', 'Look at that cloud!', 'あの くもを みて！', ['cloud', 'crowd', 'clown']],
  [2, 'w2-free', 'label', 'us', "This one? Oh, that's free!", 'これ？ ああ、それは ただよ！', ['free', 'three', 'tea']],
  [2, 'w2-flight', 'orville', 'uk', 'That was a long flight!', 'ながい フライトでしたね！', ['flight', 'fight', 'night']],
  // level 3 (US, UK, AU): reductions, modals, th/f/t, l/v/n
  [3, 'w3-gotta', 'kid-cat', 'au', 'I gotta go to the gym before it closes.', 'しまる まえに ジムに いかなきゃ。', ['gotta', 'wanna', 'oughta']],
  [3, 'w3-id', 'marshal', 'uk', "I'd go with the blue one, to be honest.", 'しょうじき、ぼくなら あおいのに するね。', ["I'd", "I'll", 'I']],
  [3, 'w3-shouldve', 'rosie', 'us', "You should've told me!", 'いって くれれば よかったのに！', ["should've", "shouldn't have", "could've"]],
  [3, 'w3-thought', 'apollo', 'au', 'I thought about it all night.', 'ひとばんじゅう その ことを かんがえた。', ['thought', 'fought', 'taught']],
  [3, 'w3-wont', 'bob', 'us', "Okay, I won't tell Raymond.", 'わかった、レイモンドには いわないよ。', ["won't", 'want to', 'will']],
  [3, 'w3-lively', 'diana', 'uk', "It's such a lively island.", 'ほんとうに にぎやかな しまね。', ['lively', 'lovely', 'lonely']],
  [3, 'w3-fishing', 'cj', 'us', 'I was fishing all day yesterday.', 'きのうは いちにちじゅう つりを してたんだ。', ['fishing', 'wishing', 'washing']],
  [3, 'w3-breath', 'roald', 'au', 'Okay, take a breath and go again!', 'よし、ひと いき ついて、もう 1かい！', ['breath', 'break', 'bath']],
  [3, 'w3-hold', 'hamlet', 'us', 'Hold it... just five more seconds!', 'そのまま キープ… あと 5びょう！', ['hold', 'fold', 'roll'], { focus: 'Hold' }],
  [3, 'w3-sore', 'dom', 'au', "I'm not sore at all after yesterday's workout!", 'きのうの トレーニングの あとでも ぜんぜん きんにくつうに なってない！', ['sore', 'sure', 'short']],
  [3, 'w3-kitchen', 'fauna', 'uk', "I've never seen such a big kitchen!", 'こんなに おおきな キッチン はじめて みた！', ['kitchen', 'chicken', 'kitten']],
  [3, 'w3-coffee', 'stitches', 'au', 'Can I get a coffee to go?', 'コーヒーを テイクアウトで もらえる？', ['coffee', 'copy', 'cookie']]
];

const REPLY: readonly (readonly [Level, ...Row])[] = [
  // level 2: the traps repeat a word or a sound, answer another wh-question, or say yes/no to a wh-question
  [2, 'r2-up-to', 'anchovy', 'us', "What're you up to?", 'なに してるの？ →「つりを してるだけ。」', ['Just fishing.', 'Up the hill.', "It's ten o'clock."]],
  [2, 'r2-fossil', 'blathers', 'uk', 'Where did you find that fossil?', 'その かせき、どこで みつけたの？ →「ビーチの いわの ちかく。」', ['On the beach, near the rocks.', 'Last Tuesday.', 'Yes, I found it.']],
  [2, 'r2-close', 'tom-nook', 'us', 'When does the shop close?', 'みせは いつ しまるの？ →「こんや 10じ。」', ['At ten tonight.', 'Near the museum.', 'Close the door, please.']],
  [2, 'r2-tea', 'brewster', 'uk', 'Would you like some tea?', 'こうちゃは いかが？ →「はい、すこしだけ。」', ['Yes, please. Just a little.', "No, it's not a tree.", 'I liked it a lot.']],
  [2, 'r2-workout', 'dom', 'us', 'How was your workout?', 'トレーニング どうだった？ →「きつかったけど、きぶん さいこう。」', ['Tough, but I feel great.', 'At the gym.', 'I worked out of town.']],
  [2, 'r2-sleepy', 'rosie', 'uk', 'Why are you so sleepy?', 'なんで そんなに ねむそうなの？ →「ゆうべ よふかし したの。」', ['I stayed up late last night.', 'Yes, very sleepy.', 'In my bed.']],
  [2, 'r2-sofa', 'stitches', 'us', 'Can you help me move this sofa?', 'この ソファ うごかすの てつだって くれる？ →「いいよ、どこに おく？」', ["Sure, where's it going?", 'It moves very fast.', "Yes, it's my sofa."]],
  [2, 'r2-caught', 'cj', 'uk', 'Who caught that sea bass?', 'その スズキ、だれが つったの？ →「ぼく。わるくないでしょ？」', ['I did. Not bad, huh?', 'This morning.', 'At the sea.']],
  [2, 'r2-museum', 'molly', 'us', 'Have you been to the museum yet?', 'もう はくぶつかんに いった？ →「まだ。いいところ？」', ['Not yet. Is it good?', "Yes, I'll go tomorrow.", 'At the museum.']],
  [2, 'r2-running', 'hamlet', 'uk', 'Do you want to go running tomorrow?', 'あした はしりに いかない？ →「いいね、なんじ？」', ['Sure, what time?', 'I ran out of it.', 'It was yesterday.']],
  [2, 'r2-shirt', 'judy', 'us', 'Which shirt do you like better?', 'どっちの シャツが すき？ →「あおいほう。」', ['The blue one.', 'Yes, I like it.', "It's better now."]],
  [2, 'r2-lamp', 'raymond', 'uk', 'How much is this lamp?', 'この ランプ いくら？ →「2,000ベル。」', ["It's 2,000 Bells.", 'Very much, thank you.', "It's on the table."]],
  [2, 'r2-break', 'roald', 'us', 'Should we take a break?', 'きゅうけい しようか？ →「いいね。つかれたよ。」', ["Good idea. I'm tired.", "It's broken.", 'I took it yesterday.']],
  [2, 'r2-rain', 'fauna', 'uk', 'Is it going to rain today?', 'きょう あめ ふるかな？ →「ふりそう。かさを もっていって。」', ['I think so. Take an umbrella.', 'It rained yesterday.', "Yes, I'm going."]],
  // level 3: indirect answers, idioms, and the traps of mind / why don't we / negative questions
  [3, 'r3-snacks', 'bunnie', 'au', "Didn't you say you'd bring snacks?", 'おやつ もってくるって いってなかった？ →「あっ、まだ かばんの なか！」', ["Oops, they're still in my bag!", 'Yes, I said hello.', 'Bring them to the snack bar.']],
  [3, 'r3-coffee', 'marshal', 'us', 'Wanna grab some coffee after this?', 'これが おわったら コーヒー のまない？ →「いきたいけど、よていが あるんだ。」', ["I'd love to, but I've got plans.", "It's after ten.", 'I grabbed it already.']],
  [3, 'r3-early', 'goldie', 'uk', "How come you're up so early?", 'なんで こんなに はやおきなの？ →「ねむれなかったの。」', ["I couldn't sleep.", 'I came up the hill.', 'Since six o\'clock.']],
  [3, 'r3-fireworks', 'tom-nook', 'au', "Who's in charge of the fireworks show?", 'はなびたいかいは だれが しきってるの？ →「しずえさんが やってるよ。」', ["Isabelle's handling it.", "It's free of charge.", 'At eight, on the beach.']],
  [3, 'r3-working-out', 'dom', 'us', "You've been working out, haven't you?", 'きたえてるでしょ？ →「わかる？ ありがとう！」', ['Can you tell? Thanks!', 'I worked it out.', "No, I haven't been out."]],
  [3, 'r3-mind', 'diana', 'uk', 'Do you mind if I sit here?', 'ここに すわっても いい？ →「どうぞ、かまいませんよ。」', ['Not at all, go ahead.', 'Yes, please sit.', "He's sitting over there."]],
  [3, 'r3-gym', 'kid-cat', 'au', "Why don't we hit the gym together?", 'いっしょに ジムに いかない？ →「いいね。5ふん まって。」', ['Sounds good. Give me five minutes.', "Because it's closed.", 'I hit it by accident.']],
  [3, 'r3-hat', 'cherry', 'us', "Where'd you get that hat?", 'その ぼうし、どこで かったの？ →「もちろん きぬよさんの おみせ！」', ["Mabel's shop, of course!", 'I got it yesterday.', "I'll get it for you."]],
  [3, 'r3-monday', 'ankha', 'uk', "Isn't the museum closed on Mondays?", 'はくぶつかんって げつようび おやすみじゃない？ →「この しまでは ちがうよ。」', ['Not on this island.', 'Yes, I closed it.', "I'm closer to the museum."]],
  [3, 'r3-how-long', 'lily', 'au', 'How long have you lived on this island?', 'この しまに すんで どのくらい？ →「もう 2ねんくらい。」', ['About two years now.', "It's a long island.", 'Near the beach.']],
  [3, 'r3-keep-down', 'apollo', 'us', 'Could you keep it down a bit?', 'すこし しずかに して くれないか？ →「あっ、ごめん！ うるさかった？」', ['Oh, sorry! Was I too loud?', "I'll keep it for you.", "It's down the hill."]],
  [3, 'r3-show', 'kk-slider', 'uk', "Are you coming to my show tonight?", 'こんやの ライブ くる？ →「ぜったい いく！」', ["Wouldn't miss it!", 'You showed me last night.', 'Yes, you came.']],
  [3, 'r3-rod', 'molly', 'au', "I can't find my fishing rod anywhere.", 'つりざおが どこにも ないの。 →「いえの ちかくは さがした？」', ['Did you check by your house?', 'I found a fish.', 'Yes, you can find it.']],
  [3, 'r3-picnic', 'bunnie', 'us', 'What do you say we have a picnic?', 'ピクニック しない？ →「いいね！ サンドイッチ もっていく。」', ["Great idea! I'll bring sandwiches.", "I didn't say anything.", 'Yes, I picked it up.']],
  [3, 'r3-boxes', 'raymond', 'uk', 'Mind giving me a hand with this box?', 'この はこ、てつだって もらえる？ →「もちろん、どこに はこぶ？」', ['Sure, where does it go?', 'My hands are cold.', "It's a cardboard box."]],
  [3, 'r3-late', 'flick', 'au', "Sorry I'm late. Did I miss anything?", 'おくれて ごめん。なにか みのがした？ →「ううん、いま はじまった ところ。」', ['Nope, we just started.', "No, I'm not late.", 'I missed the bus.']]
];

// ---- num templates (speaker × phrase × number) ----------------------------------------------------------------------

interface NumTemplate {
  key: string;
  lv: Level;
  ask: string;
  speakers: readonly RosterId[];
  /** Cycled with the speakers (each item's accent: its row's, or the level's cycle). */
  voices: readonly Accent[];
  /** The sentence around the spoken number. */
  say: (n: string) => string;
  /** The Japanese, from the right choice. */
  ja: (c: string) => string;
  /** [spoken, right choice, near distractors…], optional accent. */
  rows: readonly (readonly [spoken: string, choices: readonly string[], voice?: Accent])[];
}

const NUM: readonly NumTemplate[] = [
  // level 1
  { key: 'n1-price', lv: 1, ask: 'いくら？', speakers: ['tom-nook', 'mabel', 'kicks'], voices: ['us'],
    say: (n) => `That'll be ${n} Bells, please.`, ja: (c) => `${c}に なります。`,
    rows: [['1,500', ['1,500 ベル', '15,000 ベル', '1,050 ベル']], ['800', ['800 ベル', '8,000 ベル', '1,800 ベル']], ['4,000', ['4,000 ベル', '400 ベル', '14,000 ベル']]] },
  { key: 'n1-meet', lv: 1, ask: 'なんじに あう？', speakers: ['goldie', 'bunnie', 'molly'], voices: ['us'],
    say: (n) => `Let's meet at ${n}.`, ja: (c) => `${c}に あおう。`,
    rows: [['two fifteen', ['2:15', '2:50', '12:15']], ['six forty', ['6:40', '6:14', '4:40']], ['nine fifty', ['9:50', '9:15', '5:50']]] },
  { key: 'n1-birthday', lv: 1, ask: 'たんじょうびは なんにち？', speakers: ['judy', 'rosie', 'cherry'], voices: ['us'],
    say: (n) => `My birthday is on the ${n}.`, ja: (c) => `わたしの たんじょうびは ${c}。`,
    rows: [['13th', ['13日', '30日', '3日']], ['16th', ['16日', '6日', '26日']], ['19th', ['19日', '9日', '29日']]] },
  { key: 'n1-reps', lv: 1, ask: 'なんかい？', speakers: ['dom', 'hamlet', 'kid-cat'], voices: ['us'],
    say: (n) => `Come on, let's do ${n} push-ups!`, ja: (c) => `さあ、うでたてふせ ${c}！`,
    rows: [['15', ['15かい', '50かい', '5かい']], ['13', ['13かい', '30かい', '3かい']], ['40', ['40かい', '14かい', '4かい']]] },
  { key: 'n1-turnips', lv: 1, ask: 'カブは いくら？', speakers: ['daisy-mae'], voices: ['us'],
    say: (n) => `Turnips are ${n} Bells today!`, ja: (c) => `きょうの カブは ${c}だよ！`,
    rows: [['90', ['90 ベル', '19 ベル', '99 ベル']], ['70', ['70 ベル', '17 ベル', '77 ベル']], ['60', ['60 ベル', '16 ベル', '66 ベル']]] },
  // level 2
  { key: 'n2-opens', lv: 2, ask: 'なんじに ひらく？', speakers: ['blathers', 'celeste'], voices: ['uk', 'us'],
    say: (n) => `The museum opens at ${n}.`, ja: (c) => `はくぶつかんは ${c}に ひらきます。`,
    rows: [['a quarter past nine', ['9:15', '8:45', '9:45']], ['a quarter to seven', ['6:45', '7:15', '7:45']], ['half past three', ['3:30', '2:30', '3:00']]] },
  { key: 'n2-price', lv: 2, ask: 'いくら？', speakers: ['tom-nook', 'label', 'saharah'], voices: ['us', 'uk', 'us'],
    say: (n) => `It's ${n} Bells for this one.`, ja: (c) => `こちらは ${c}です。`,
    rows: [['12,500', ['12,500 ベル', '20,500 ベル', '12,050 ベル']], ['38,000', ['38,000 ベル', '3,800 ベル', '48,000 ベル']], ['9,900', ['9,900 ベル', '99,000 ベル', '9,090 ベル']]] },
  { key: 'n2-days', lv: 2, ask: 'なんにち？', speakers: ['stitches', 'ankha'], voices: ['uk', 'us'],
    say: (n) => `I've been on this island for ${n} days.`, ja: (c) => `この しまに きて ${c}に なるよ。`,
    rows: [['14', ['14日', '40日', '4日']], ['17', ['17日', '70日', '7日']]] },
  { key: 'n2-tourney', lv: 2, ask: 'なんにち？', speakers: ['cj', 'raymond'], voices: ['us', 'uk'],
    say: (n) => `The fishing tourney is on the ${n}.`, ja: (c) => `つりたいかいは ${c}だよ。`,
    rows: [['13th', ['13日', '30日', '3日']], ['31st', ['31日', '13日', '21日']]] },
  { key: 'n2-flight', lv: 2, ask: 'なんじに でる？', speakers: ['orville', 'wilbur'], voices: ['uk', 'us'],
    say: (n) => `Your flight leaves at ${n}.`, ja: (c) => `ひこうきは ${c}に でます。`,
    rows: [['eight forty', ['8:40', '8:14', '8:04']], ['eleven fifteen', ['11:15', '11:50', '7:15']]] },
  { key: 'n2-run', lv: 2, ask: 'なんキロ？', speakers: ['hamlet'], voices: ['us'],
    say: (n) => `I ran ${n} kilometers this morning!`, ja: (c) => `けさ ${c} はしったぞ！`,
    rows: [['16', ['16キロ', '60キロ', '6キロ']]] },
  // level 3
  { key: 'n3-meet', lv: 3, ask: 'なんじ？', speakers: ['diana', 'marshal', 'ankha'], voices: ['uk', 'us', 'au'],
    say: (n) => `Meet me at ${n}, okay?`, ja: (c) => `${c}に きてね。`,
    rows: [['ten to six', ['5:50', '6:10', '10:06']], ['twenty-five past four', ['4:25', '3:35', '4:35']], ['half seven', ['7:30', '6:30', '7:00'], 'uk']] },
  { key: 'n3-steal', lv: 3, ask: 'いくら？', speakers: ['redd', 'saharah', 'redd'], voices: ['us', 'au', 'uk'],
    say: (n) => `It's a steal at ${n} Bells!`, ja: (c) => `${c}なら おかいどくだよ！`,
    rows: [['115,000', ['115,000 ベル', '150,000 ベル', '105,000 ベル']], ['48,800', ['48,800 ベル', '40,800 ベル', '48,080 ベル']], ['16,600', ['16,600 ベル', '60,600 ベル', '16,060 ベル']]] },
  { key: 'n3-loan', lv: 3, ask: 'ローンは いくら？', speakers: ['tom-nook'], voices: ['au'],
    say: (n) => `Your home loan comes to ${n} Bells, yes, yes.`, ja: (c) => `ローンは ${c}だなも。`,
    rows: [['98,000', ['98,000 ベル', '90,800 ベル', '9,800 ベル']]] },
  { key: 'n3-meteor', lv: 3, ask: 'なんにち？', speakers: ['celeste', 'blathers'], voices: ['uk', 'au'],
    say: (n) => `I think the meteor shower's on the ${n}.`, ja: (c) => `りゅうせいぐんは ${c}だと おもう。`,
    rows: [['23rd', ['23日', '20日', '3日']], ['12th', ['12日', '20日', '22日']]] },
  { key: 'n3-turnips', lv: 3, ask: 'カブは いくら？', speakers: ['daisy-mae'], voices: ['uk', 'au'],
    say: (n) => `These turnips are ${n} Bells each.`, ja: (c) => `この カブは 1こ ${c}だよ。`,
    rows: [['a hundred and ten', ['110 ベル', '101 ベル', '1,010 ベル']], ['ninety-eight', ['98 ベル', '88 ベル', '90 ベル']]] },
  { key: 'n3-reps', lv: 3, ask: 'なんびょう？', speakers: ['roald', 'dom'], voices: ['au', 'us'],
    say: (n) => `Hold a plank for sixty seconds. Actually, no, make it ${n}!`, ja: (c) => `プランク 60びょう… いや、${c}に しよう！`,
    rows: [['ninety', ['90びょう', '60びょう', '19びょう']], ['seventy', ['70びょう', '60びょう', '17びょう']]] }
];

const numItems = (t: NumTemplate): Item[] =>
  t.rows.map(([spoken, choices, voice], i) => ({
    id: `${t.key}-${i + 1}`,
    lv: t.lv,
    type: 'num',
    en: t.say(spoken),
    ja: t.ja(choices[0]),
    speaker: t.speakers[i % t.speakers.length],
    voice: voice ?? t.voices[i % t.voices.length],
    choices,
    answer: 0,
    focus: spoken,
    ask: t.ask
  }));

/** Every item, by level and type. */
export const BANK: readonly Item[] = [
  ...PIC.map(([lv, ...r]) => make(lv, 'pic')(r)),
  ...WORD.map(([lv, ...r]) => word(lv)(r)),
  ...NUM.flatMap(numItems),
  ...REPLY.map(([lv, ...r]) => make(lv, 'reply')(r)),
  ...BANK4,
  ...DIALOGUES
];
