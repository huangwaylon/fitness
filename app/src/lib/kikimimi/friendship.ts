// ききみみ's なかよし (docs/kikimimi.md "なかよし", ずかん › なかま): a friendship with each villager that grows as I understand
// their lines and never drops. +1 for an item of theirs understood after a replay, +2 on the first listen (a dialogue
// counts for each villager in it); a wrong answer adds nothing and takes nothing. The points are never shown: the levels
// are (NH's hearts), at 10 / 30 / 70 / 150 / 300, each with its reward. The rewards are cosmetic here, because the
// island has no way yet to send an English-practice present: L1 their greeting on the card, L2 a letter to read,
// L3 the でんわ ともだち badge (the ようじ でんわ calls come later), L4 a silver frame on the card (in place of the
// furniture gift), L5 their photo in a gold frame (in place of the tent's photo). A level is announced once with a heart,
// the first time ずかん shows it (`levelUps` over the levels last shown). Each person's own, from my answers. Pure.
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Personality } from '#lib/villagers/species.ts';
import type { LocalDate } from '../types.ts';
import type { Answer } from './progress.ts';

/** The points each level needs. */
export const FRIEND_LEVELS = [10, 30, 70, 150, 300] as const;
export const FRIEND_MAX = FRIEND_LEVELS.length;
/** Each level's reward (index: level − 1). */
const REWARDS = ['greeting', 'letter', 'call', 'frame', 'photo'] as const;
type Reward = (typeof REWARDS)[number];

/** An answer's points: understood on the first listen 2, after a replay 1, missed 0 (never below). */
export const pointsFor = (a: Pick<Answer, 'ok' | 'rp'>): number => (a.ok ? (a.rp === 0 ? 2 : 1) : 0);

/** The level of so many points (0 … 5). */
export const levelOf = (points: number): number => FRIEND_LEVELS.filter((x) => points >= x).length;

interface Friend {
  points: number;
  level: number;
  /** Items of theirs I've heard (right or not). */
  heard: number;
  /** The day I last heard them. */
  last: LocalDate;
}

/** Every villager I've heard: points, level and how much heard, from my answers (in order) and who speaks an item
 *  (undefined: an item this phone hasn't loaded, passed by). */
export function friendsOf(answers: readonly Answer[], who: (id: string) => readonly RosterId[] | undefined): Map<RosterId, Friend> {
  const out = new Map<RosterId, Friend>();
  for (const a of answers) {
    const ws = who(a.id);
    if (!ws) continue;
    const p = pointsFor(a);
    for (const w of new Set(ws)) {
      const f = out.get(w) ?? { points: 0, level: 0, heard: 0, last: a.d };
      f.points += p;
      f.heard++;
      if (a.d > f.last) f.last = a.d;
      f.level = levelOf(f.points);
      out.set(w, f);
    }
  }
  return out;
}

/** The rewards a level has opened, in order. */
export const rewardsAt = (level: number): Reward[] => REWARDS.slice(0, Math.max(0, Math.min(FRIEND_MAX, level)));
/** The next reward (null: all five). */
export const nextReward = (level: number): Reward | null => REWARDS[level] ?? null;

/** The villagers whose level is above the one last shown (`seen`; none: 0): each announced once with a heart. */
export function levelUps(friends: ReadonlyMap<RosterId, Pick<Friend, 'level'>>, seen: Readonly<Partial<Record<string, number>>>): { who: RosterId; from: number; to: number }[] {
  return [...friends].filter(([w, f]) => f.level > (seen[w] ?? 0)).map(([w, f]) => ({ who: w, from: seen[w] ?? 0, to: f.level }));
}

/** The order the なかま list shows: the closest first (level, then points), then the most heard, then by id. */
export const friendOrder = (friends: ReadonlyMap<RosterId, Friend>): RosterId[] =>
  [...friends].sort(([a, x], [b, y]) => y.level - x.level || y.points - x.points || y.heard - x.heard || (a < b ? -1 : 1)).map(([w]) => w);

type Kind = Personality | 'special';
type Words = { en: string; ja: string };

/** L1's greeting by personality (`{me}`: my name), as an NH villager would say it. */
const GREETING: Readonly<Record<Kind, Words>> = {
  normal: { en: "Oh, {me}! I was hoping I'd run into you today.", ja: 'あ、{me}！ きょう あえたら いいなって おもってたの。' },
  peppy: { en: "{me}! You're here! Okay, this totally made my day!", ja: '{me}！ きてくれた！ もう、きょう さいこうの ひ！' },
  snooty: { en: "Why, {me}. You're looking rather well today, I must say.", ja: 'あら {me}。きょうは なかなか すてきじゃない。' },
  sisterly: { en: "Hey, {me}! Come here, I've been meaning to catch up with you.", ja: 'ねえ {me}！ ちょっと はなしたいと おもってたんだ。' },
  lazy: { en: "Hey, {me}... I was just thinking about snacks. Wanna hang out?", ja: 'やあ {me}… おやつの こと かんがえてた。いっしょに のんびり する？' },
  jock: { en: "{me}! Perfect timing! I just finished my morning run!", ja: '{me}！ ちょうど いい！ あさの ランニング おわった ところ！' },
  cranky: { en: "Hmph. Oh, it's you, {me}. Well... good to see you, I suppose.", ja: 'ふん。なんだ {me}か。まあ… あえて うれしいよ。' },
  smug: { en: "Ah, {me}. Always a pleasure. Shall we take a little stroll?", ja: 'やあ {me}。いつも あえて うれしいよ。すこし あるかない？' },
  special: { en: "{me}! Thanks for stopping by. It's always nice to see you.", ja: '{me}さん！ よってくれて ありがとう。いつも うれしいです。' }
};

/** L2's letter by personality (`{me}`: my name; `{name}`: theirs). */
const LETTER: Readonly<Record<Kind, Words>> = {
  normal: {
    en: "Dear {me},\nI noticed you've been listening really carefully lately. It makes me so happy when you understand what I'm saying! Let's keep chatting, okay?\nYour friend, {name}",
    ja: '{me}へ\nさいきん しっかり きいてくれてるね。わたしの はなしが つたわると とても うれしい！ これからも おしゃべり しようね。\n{name}より'
  },
  peppy: {
    en: "Dear {me},\nGuess what? You totally got everything I said yesterday! I was so excited I did a little dance. Talk soon!\nLove, {name}",
    ja: '{me}へ\nきいて！ きのう いったこと、ぜんぶ わかってくれたよね！ うれしくて おどっちゃった。また はなそう！\n{name}より'
  },
  snooty: {
    en: "Dear {me},\nI must admit, your ear for English has become quite refined. Not everyone can keep up with me, you know. Do carry on.\nRegards, {name}",
    ja: '{me}へ\nみとめるわ。あなたの えいごの みみ、ずいぶん みがかれてきたわね。わたしに ついてこられる ひとは すくないのよ。そのちょうしで。\n{name}より'
  },
  sisterly: {
    en: "Hey {me},\nJust wanted to say I'm proud of you. You used to miss half of what I said, and now you catch it all. Keep it up, yeah?\n{name}",
    ja: '{me}へ\nほこらしいって いいたくて。まえは はんぶん ききのがしてたのに、いまは ぜんぶ きけてる。そのまま がんばりな！\n{name}より'
  },
  lazy: {
    en: "Hey {me},\nI was gonna write this yesterday, but I took a nap instead. Anyway... you're really good at listening now. That's nice.\n{name}",
    ja: '{me}へ\nきのう かこうと おもったけど、ひるねしちゃった。とにかく… きくのが すごく じょうずに なったね。いいね。\n{name}より'
  },
  jock: {
    en: "Yo {me}!\nYour listening's getting seriously strong! It's like training: a little every day and boom, results! Let's go again tomorrow!\n{name}",
    ja: '{me}へ\nきく ちから、ほんとに つよく なってる！ トレーニングと おなじで、まいにち すこしずつで けっかが でる！ あしたも いこう！\n{name}より'
  },
  cranky: {
    en: "{me},\nI don't usually write letters. But you've been listening, and I noticed. That's all. Don't make a big deal of it.\n{name}",
    ja: '{me}へ\nてがみなんて ふだんは かかない。でも ちゃんと きいてるのは わかってる。それだけだ。おおげさに するなよ。\n{name}より'
  },
  smug: {
    en: "Dear {me},\nA true listener hears not just the words but the meaning behind them. Lately, I believe you do both. Bravo.\nYours, {name}",
    ja: '{me}へ\nほんとうの ききては ことばだけでなく その いみも きく。さいきんの きみは その りょうほうが できているね。ブラボー。\n{name}より'
  },
  special: {
    en: "Dear {me},\nThank you for listening so closely every day. The whole island has noticed how much you understand now!\nWarmly, {name}",
    ja: '{me}さんへ\nまいにち しっかり きいてくれて ありがとう。いまは とても よく わかっているって、しまの みんなが きづいています！\n{name}より'
  }
};

const fill = (w: Words, me: string, name: string): Words => ({ en: w.en.replaceAll('{me}', me).replaceAll('{name}', name), ja: w.ja.replaceAll('{me}', me).replaceAll('{name}', name) });
/** A villager's L1 greeting (their personality's; a special character's own kind). */
export const greetingOf = (p: Personality | null, me: string, name: string): Words => fill(GREETING[p ?? 'special'], me, name);
/** A villager's L2 letter. */
export const letterOf = (p: Personality | null, me: string, name: string): Words => fill(LETTER[p ?? 'special'], me, name);
