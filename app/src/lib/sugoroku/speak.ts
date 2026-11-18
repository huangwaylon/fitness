// 英語すごろく's speaking step (docs/sugoroku.md "Speaking"), its pure parts: whether a heard or typed sentence is one to
// grade (Whisper's words on silence aren't), on task (the picture's word in it, a mishearing credited; not a bare noun),
// the relay's answer checked again on the phone (lib/speech/grade.ts asks), their words against the recast (what
// changed), when the tip opens by itself, and the stars. Only the speaking step's chunk imports this (SpeakStep.svelte).
import { i18n } from '#lib/i18n/index.ts';
import { wordsOf } from '#lib/speech/match.ts';
import type { Level } from './game.ts';

/** Stars: an on-task sentence, and said again after a tip (game.ts SAID_MAX caps the sum). */
const ON_TASK_STARS = 2;
const RESAID_STARS = 1;
/** 🎤 もう一回 on the 聞こえた文 screen: this many, then the keyboard. */
export const RESAYS = 2;
/** How long the feedback waits for /grade after これでOK before it praises without it. */
export const GRADE_WAIT_MS = 4000;
/** むずかしい's nudge: a sentence of at least this many words. */
export const HARD_WORDS = 6;
/** やさしい's frames. */
export const FRAMES = ['I like ___.', 'There is a ___.'] as const;

/** Levenshtein distance. */
export function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length];
}

const IRREGULAR: Record<string, string> = {
  mouse: 'mice', child: 'children', foot: 'feet', tooth: 'teeth', person: 'people', man: 'men', woman: 'women', goose: 'geese',
  knife: 'knives', leaf: 'leaves', wolf: 'wolves', fish: 'fish', sheep: 'sheep', deer: 'deer'
};
/** A noun and its plurals (the regular ones, and the few irregular a picture may be). */
export function formsOf(w: string): string[] {
  const out = new Set([w, `${w}s`, `${w}es`]);
  if (/[^aeiou]y$/.test(w)) out.add(`${w.slice(0, -1)}ies`);
  if (/fe?$/.test(w)) out.add(w.replace(/fe?$/, 'ves'));
  if (IRREGULAR[w]) out.add(IRREGULAR[w]);
  return [...out];
}

/** How far a heard word may be from the target's form and still count (a mishearing: boring → bowling). */
const slack = (n: number) => (n <= 4 ? 1 : 2);
/** Everyday short words never taken for a misheard target ("the" isn't "tie", "an" isn't "ant"). */
const COMMON = new Set('the and you are was has had his her him she its our out who how why not but for can yes see say get got put use one two all any'.split(' '));
const near = (w: string, f: string) =>
  w.length >= 3 && !COMMON.has(w) && (w[0] === f[0] || f.length > 4) && Math.abs(w.length - f.length) <= 2 && editDistance(w, f) <= slack(f.length);
/** Whether the sentence uses the target word: a form of it, or a word a small edit away (Whisper mishears a
 *  Japanese-accented word: never nudge for a word they did say); a short target only by a word of its first letter. */
export function targetUsed(text: string, target: string): boolean {
  const forms = formsOf(target.toLowerCase());
  return wordsOf(text).some((w) => forms.some((f) => w === f || near(w, f)));
}

/** What Whisper writes for silence, noise or a cough (its training's captions), normalised by wordsOf. */
const SILENCE = new Set(['', 'you', 'thank you', 'thanks', 'thank you so much', 'thank you very much', 'thanks for watching', 'thank you for watching',
  'thanks for watching bye', 'bye', 'bye bye', 'goodbye', 'please subscribe', 'subscribe', 'okay', 'ok', 'so', 'uh', 'um', 'hmm', 'oh', 'music', 'applause',
  'see you next time', 'see you in the next video']);
/** Whether a take is no sentence to grade: empty, a silence caption, or mostly not Latin letters (「もう一回どうぞ」). */
export function isSilence(text: string): boolean {
  const t = text.replace(/\[[^\]]*\]|\([^)]*\)|[♪♫]/g, ' ').trim();
  const letters = t.replace(/[\s\p{P}\p{S}\d]/gu, '');
  if (!letters) return true;
  if ([...letters].filter((c) => /[a-z]/i.test(c)).length / [...letters].length < 0.6) return true;
  return SILENCE.has(wordsOf(t).join(' '));
}

/** Words a bare noun phrase is made of besides its noun: determiners, numbers, possessives, everyday adjectives. */
const NOUNISH = new Set(('a an the my your his her our their its this that these those some one two three four five six seven eight nine ten many ' +
  'big small little cute red blue green yellow white black pink brown orange purple new old nice good great happy hot cold long short tall ' +
  'pretty beautiful sweet yummy delicious fresh funny lovely very so').split(' '));
/** A bare noun phrase ("a big dog", "apples"): three words at most, nothing but its noun and words like these. Only
 *  that is nudged for a verb; "So tired today." and other casual sentences are fine. */
export function bareNoun(text: string, target: string): boolean {
  const ws = wordsOf(text);
  if (!ws.length || ws.length > 3) return false;
  const forms = formsOf(target.toLowerCase());
  const nouns = ws.filter((w) => !NOUNISH.has(w));
  return nouns.length === 1 && (forms.includes(nouns[0]) || targetUsed(nouns[0], target));
}

/** A sentence's task check (the phone's, exact): `again` (no sentence heard: say it again, not graded), `target`
 *  (the word missing: a nudge; the relay's `used` credits it too), `verb` (a bare noun phrase: a nudge), `ok`. */
export type Check = 'again' | 'target' | 'verb' | 'ok';
export function check(text: string, target: string, relayUsed = false): Check {
  if (isSilence(text)) return 'again';
  if (!targetUsed(text, target) && !relayUsed) return 'target';
  if (bareNoun(text, target)) return 'verb';
  return 'ok';
}

/** The relay's answer (contract: relay `POST /grade`), as the phone shows it. */
export interface Grade {
  verdict: 'great' | 'ok' | 'tip';
  fixed: string;
  natural: string;
  also: string;
  tip: string;
  used: boolean;
  src: 'ai' | 'wasei';
}
/** Words a tip never says (the relay drops these too; the phone checks again): failure words, grammar terms. */
const BANNED = /間違|誤り|不正解|不要|ダメ|NG|違う|忘れ|言いません|いけない|必要です|三人称|他動詞|不可算|冠詞|前置詞|過去分詞|主語|原形|副詞|助動詞/;
export const TIP_MAX = 40;
const KANA = /[ぁ-んァ-ン]/;
/** A recast the phone shows: English-ish, no placeholder, not over twice the sentence's length; else their own. */
const fine = (x: string, s: string) => !!x && !/\.\.\.|…/.test(x) && !/[^\x20-\x7e’‘“”]/.test(x) && x.length <= Math.max(40, s.length * 2);
/** The relay's JSON checked against the contract (null: not an answer), its strings trimmed; a tip with a banned word,
 *  no kana or over TIP_MAX dropped (the recast stays); `also` only on great. */
export function cleanGrade(x: unknown, s: string): Grade | null {
  const j = x as Record<string, unknown> | null;
  if (!j || j.ok !== true || !['great', 'ok', 'tip'].includes(j.verdict as string)) return null;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 200) : '');
  const verdict = j.verdict as Grade['verdict'];
  const fixed = fine(str(j.fixed), s) ? str(j.fixed) : s;
  const natural = fine(str(j.natural), s) ? str(j.natural) : fixed;
  const tip = str(j.tip);
  const also = verdict === 'great' && fine(str(j.also), s) ? str(j.also) : '';
  return {
    verdict, fixed, natural, also, used: j.used === true, src: j.src === 'wasei' ? 'wasei' : 'ai',
    tip: tip && KANA.test(tip) && !BANNED.test(tip) && [...tip].length <= TIP_MAX ? tip : ''
  };
}

/** A word of a sentence as shown, and whether it differs from the other sentence's (an LCS over the words). */
export type Word = { w: string; changed: boolean };
const norm = (w: string) => wordsOf(w).join(' ');
/** Their sentence and the recast, word by word: their words not in the recast (a soft underline), the recast's words
 *  not in theirs (bold). Case and punctuation don't count. */
export function diffWords(mine: string, better: string): { mine: Word[]; better: Word[] } {
  const a = mine.trim().split(/\s+/).filter(Boolean), b = better.trim().split(/\s+/).filter(Boolean);
  const na = a.map(norm), nb = b.map(norm);
  const L = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = na[i] === nb[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const ka = new Array<boolean>(a.length).fill(false), kb = new Array<boolean>(b.length).fill(false);
  for (let i = 0, j = 0; i < a.length && j < b.length;) {
    if (na[i] === nb[j]) (ka[i] = kb[j] = true), i++, j++;
    else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  return { mine: a.map((w, i) => ({ w, changed: !ka[i] })), better: b.map((w, j) => ({ w, changed: !kb[j] })) };
}

/** Whether two sentences say the same words (case and punctuation aside). */
const same = (a: string, b: string): boolean => wordsOf(a).join(' ') === wordsOf(b).join(' ');

const ARTICLES = new Set(['a', 'an', 'the']);
/** Whether the recast only adds or drops an article or changes a plural / -s ending (what Whisper changes itself:
 *  やさしい shows the recast but no tip for these). */
export function onlySmall(mine: string, better: string): boolean {
  const a = wordsOf(mine).filter((w) => !ARTICLES.has(w)), b = wordsOf(better).filter((w) => !ARTICLES.has(w));
  if (a.length !== b.length) return false;
  const ending = (x: string, y: string) => y === `${x}s` || y === `${x}es`;
  return a.every((w, i) => w === b[i] || ending(w, b[i]) || ending(b[i], w));
}

/** The recast shown under 「こう言うともっと自然」: the fix, else the natural version, when it differs from theirs. */
export function recastOf(s: string, g: Grade | null): string {
  if (!g) return '';
  if (!same(g.fixed, s)) return g.fixed;
  return g.verdict !== 'great' && !same(g.natural, s) ? g.natural : '';
}

/** Whether a sentence's tip opens by itself: never in two sentences running after one did (at most 1 in 3), `seen`
 *  being this player's sentences this game, whether each one's tip opened by itself. */
export const tipOpens = (seen: readonly boolean[]): boolean => !seen.slice(-2).some(Boolean);
/** Each player's sentences this game (the game's seed and their seat): whether each tip opened by itself. */
const opened = new Map<string, boolean[]>();
export const tipsOf = (key: string): boolean[] => opened.get(key) ?? [];
export function noteTip(key: string, open: boolean): void {
  const was = tipsOf(key);
  opened.delete(key);
  opened.set(key, [...was, open].slice(-3));
  // (the latest few games' only: a Map keeps its order, so the first key is the oldest touched)
  if (opened.size > 8) opened.delete(opened.keys().next().value!);
}

/** The speaking step's stars: on-task +2, said again after a tip +1. */
export const saidStars = (onTask: boolean, resaid: boolean): number => (onTask ? ON_TASK_STARS + (resaid ? RESAID_STARS : 0) : 0);

/** Whether a sentence is long enough for むずかしい (else the stars and a nudge to try a longer one). */
export const longEnough = (text: string, level: Level): boolean => level < 3 || wordsOf(text).length >= HARD_WORDS;

// the step's strings: normal Japanese with kanji, a friend's voice (〜だよ, 〜してみてね), never "incorrect"
const S = {
  ask: { ja: 'この絵で一文言ってみよう', en: 'Say a sentence about this picture' },
  frames: { ja: 'たとえば', en: 'For example' },
  hard: { ja: '{n}語以上で言ってみよう', en: 'Try {n} words or more' },
  say: { ja: '話す', en: 'Speak' },
  type: { ja: '書く', en: 'Type' },
  stop: { ja: '止める（{s}秒）', en: 'Stop ({s} s)' },
  listening: { ja: '聞き取り中…', en: 'Listening…' },
  recording: { ja: '録音中…', en: 'Recording…' },
  heard: { ja: '聞こえた文', en: 'What we heard' },
  typeHere: { ja: '英語で書いてみよう', en: 'Write it in English' },
  editNote: { ja: '違っていたら直してね', en: 'Fix it if it’s off' },
  ok: { ja: 'これでOK', en: 'Looks good' },
  again: { ja: 'もう一回', en: 'Say again' },
  silence: { ja: 'よく聞こえなかったみたい。もう一回どうぞ', en: 'We didn’t catch that. Once more!' },
  useWord: { ja: '「{w}」を入れて言ってみてね', en: 'Try putting “{w}” in it' },
  addVerb: { ja: '動詞を入れて文にしてみよう', en: 'Add a verb to make it a sentence' },
  better: { ja: 'こう言うともっと自然', en: 'A more natural way' },
  tip: { ja: 'ヒント', en: 'Tip' },
  also: { ja: 'こんな言い方も', en: 'You could also say' },
  great: { ja: 'いい文だね！', en: 'Nice sentence!' },
  great2: { ja: 'バッチリ！', en: 'Spot on!' },
  great3: { ja: 'すごくいいね！', en: 'Really good!' },
  great4: { ja: 'その言い方、自然だよ！', en: 'That sounds natural!' },
  praise: { ja: 'いいね！ちゃんと伝わったよ', en: 'Nice! That came across' },
  longer: { ja: '次は{n}語以上にも挑戦してみてね', en: 'Next time, try {n} words or more' },
  resay: { ja: 'まねして言ってみる', en: 'Say it like that' },
  resaid: { ja: '言い直せた！', en: 'Said it again!' },
  denied: { ja: 'マイクが使えないみたい。書いてもOKだよ', en: 'The mic’s off: typing works too' },
  missed: { ja: 'うまく聞き取れなかったみたい。書いてもOKだよ', en: 'That didn’t come through: typing works too' },
  stars: { ja: '星 +{n}', en: '+{n} stars' },
  fine: { ja: '録音は文字にするだけで、保存しません', en: 'Your voice is only turned into text, never kept' }
} as const satisfies Record<string, { ja: string; en: string }>;
export type SayKey = keyof typeof S;
export function say(key: SayKey, params: Record<string, string | number> = {}): string {
  const raw: string = S[key][i18n.locale === 'en' ? 'en' : 'ja'];
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? ''));
}

/** A great sentence's cheer (the relay's tip is empty then): a few in turn, so a game's cheers don't repeat. */
const CHEERS = ['great', 'great2', 'great3', 'great4'] as const;
let cheers = 0;
/** The next cheer's index (cheerOf: its words). */
export const nextCheer = (): number => cheers++ % CHEERS.length;
/** A cheer's words by its index ('' for none, -1). */
export const cheerOf = (k: number): string => (k >= 0 && k < CHEERS.length ? say(CHEERS[k]) : '');
