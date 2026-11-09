// ききみみ: answer-choice tells (docs/curriculum.md "Choice tells"): what lets a test-wise player pick the right choice of a
// `reply`, `mean`, `gist` or `next` item without listening. Per choice set: is the right choice the longest (or the longest
// by a margin), the shortest, the one that echoes the clip's words least (the distractors repeating them, the TOEIC
// sound-alike trap a player learns to reject), and a form the right ones have more often than the wrong (a question, a
// friendly opener). tells.test holds each level's shares to chance plus a tolerance and prints them. Pure.

/** The types whose choices are sentences a player can weigh without the audio. */
export const TELL_TYPES: ReadonlySet<string> = new Set(['reply', 'mean', 'gist', 'next']);

/** A choice set as authored (an item's, or a unit tier's) with what was heard. */
export interface ChoiceSet {
  choices: readonly string[];
  answer: number;
  /** The transcript the choices are weighed against (the item's `en`). */
  en: string;
}

/** The right choice is the longest by this factor (characters) over the longest wrong one: a tell on its own. */
const LONG_BY = 1.25;

const STOP = new Set(
  ('a an the and or but so if of to in on at for with from by up out off over about into as is am are was were be been being do does did done ' +
    'have has had having i me my mine you your yours he him his she her hers it its we us our they them their this that these those there here ' +
    'what which who whom whose when where why how not no yes just very really too also then than can could will would shall should may might must ' +
    "i'm you're he's she's it's we're they're i've you've we've they've i'll you'll he'll she'll we'll they'll i'd you'd he'd she'd we'd they'd " +
    "don't doesn't didn't isn't aren't wasn't weren't won't wouldn't can't couldn't shouldn't haven't hasn't hadn't that's there's what's let's " +
    'oh ah um uh hmm well okay ok yeah sure all some any one get got go going gonna want wanna like now right sorry thanks please').split(' ')
);

/** A word's rough stem (plurals and the regular endings): "plates" and "plate", "booked" and "book" match. */
const stem = (w: string): string => w.replace(/'s$/, '').replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, '') || w;

/** The content words of a text, stemmed (function words and short ones aside). */
export function contentWords(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[’‘]/g, "'").match(/[a-z0-9][a-z0-9']*/g) ?? [];
  return new Set(words.filter((w) => !STOP.has(w) && w.length > 2).map(stem));
}

/** How many of a choice's content words the clip says. */
export const echoOf = (choice: string, heard: ReadonlySet<string>): number => [...contentWords(choice)].filter((w) => heard.has(w)).length;

const OPENER = /^(oh|ah|aw|hmm|well|sure|actually|honestly|wait|great|perfect|thanks|thank you|sorry|of course|yeah|yep|right|okay|ok|wow|ugh|huh|hey|good|nice|that depends)\b/i;

/** A choice's form, which a player can weigh without the audio: it opens with a reaction ("Oh,", "Sure.", "Hmm,"), or
 *  it's a question. */
const opener = (c: string): boolean => OPENER.test(c.trim());
const question = (c: string): boolean => c.trim().endsWith('?');

/** One choice set's tells. */
export interface Tells {
  n: number;
  /** The right choice is the longest (characters, strictly). */
  longest: boolean;
  /** ... by LONG_BY or more. */
  longBy: boolean;
  /** The right choice is the shortest (strictly). */
  shortest: boolean;
  /** Every wrong choice echoes the clip more than the right one (the right one strictly least). */
  echoLeast: boolean;
  /** The right choice echoes the clip most (strictly): the overlap is spread when this happens too. */
  echoMost: boolean;
  /** The right choice's form, and the wrong ones' (how many open with a reaction, how many are questions). */
  form: { opener: boolean; question: boolean; wrongOpeners: number; wrongQuestions: number };
}

export function tellsOf({ choices, answer, en }: ChoiceSet): Tells {
  const len = choices.map((c) => c.trim().length), right = len[answer];
  const wrong = len.filter((_, i) => i !== answer), wrongText = choices.filter((_, i) => i !== answer);
  const heard = contentWords(en), echo = choices.map((c) => echoOf(c, heard));
  const echoWrong = echo.filter((_, i) => i !== answer);
  return {
    n: choices.length,
    longest: wrong.every((l) => right > l),
    longBy: right >= LONG_BY * Math.max(...wrong),
    shortest: wrong.every((l) => right < l),
    echoLeast: echoWrong.every((e) => e > echo[answer]),
    echoMost: echoWrong.every((e) => e < echo[answer]),
    form: {
      opener: opener(choices[answer]), question: question(choices[answer]),
      wrongOpeners: wrongText.filter(opener).length, wrongQuestions: wrongText.filter(question).length
    }
  };
}

/** A level's (or any group's) shares of each tell over its choice sets; `opener` and `question` the gap between the right
 *  choices' share of that form and the wrong ones' (a register or mood the right answer has more often: a tell). */
export interface TellStats {
  sets: number;
  longest: number;
  longBy: number;
  shortest: number;
  echoLeast: number;
  echoMost: number;
  opener: number;
  question: number;
}

export function statsOfTells(all: readonly Tells[]): TellStats {
  const share = (k: 'longest' | 'longBy' | 'shortest' | 'echoLeast' | 'echoMost') => (all.length ? all.filter((t) => t[k]).length / all.length : 0);
  const wrongs = all.reduce((s, t) => s + t.n - 1, 0) || 1, rights = all.length || 1;
  const gap = (r: 'opener' | 'question', w: 'wrongOpeners' | 'wrongQuestions') =>
    all.filter((t) => t.form[r]).length / rights - all.reduce((s, t) => s + t.form[w], 0) / wrongs;
  return {
    sets: all.length, longest: share('longest'), longBy: share('longBy'), shortest: share('shortest'), echoLeast: share('echoLeast'), echoMost: share('echoMost'),
    opener: gap('opener', 'wrongOpeners'), question: gap('question', 'wrongQuestions')
  };
}

/** The limits a group of 3-choice sets is held to, [at least, at most]: chance is 1/3 for longest, shortest, echoLeast
 *  and echoMost (a right answer rarely the longest is a tell too), and 0 for a form gap. */
export const TELL_LIMITS = {
  longest: [0.2, 0.45], longBy: [0, 0.12], shortest: [0.2, 0.45], echoLeast: [0, 0.45], echoMost: [0.15, 1], opener: [-0.12, 0.12], question: [-0.12, 0.12]
} as const satisfies Record<keyof Omit<TellStats, 'sets'>, readonly [number, number]>;

/** What's outside the limits (empty: fine). */
export function overLimits(s: TellStats, lim: typeof TELL_LIMITS = TELL_LIMITS): string[] {
  const pct = (x: number) => `${Math.round(x * 100)} %`;
  return (Object.keys(lim) as (keyof typeof lim)[]).flatMap((k) => {
    const [lo, hi] = lim[k];
    return s[k] < lo ? [`${k} ${pct(s[k])} < ${pct(lo)}`] : s[k] > hi ? [`${k} ${pct(s[k])} > ${pct(hi)}`] : [];
  });
}

/** Each group's shares as lines (and all of them), and what's over the limits; a group under 20 sets is reported, not
 *  held (a share of a handful is noise). `held`: the groups held (default all). */
export function tellReport(sets: readonly (ChoiceSet & { group: string })[], held?: ReadonlySet<string>): { lines: string[]; over: string[] } {
  const by = new Map<string, Tells[]>();
  for (const s of sets) by.set(s.group, [...(by.get(s.group) ?? []), tellsOf(s)]);
  const pct = (x: number) => `${Math.round(x * 100)}`.padStart(4);
  const line = (g: string, s: TellStats) =>
    `${g.padEnd(6)}${String(s.sets).padStart(5)}${pct(s.longest)}${pct(s.longBy)}${pct(s.shortest)}${pct(s.echoLeast)}${pct(s.echoMost)}${pct(s.opener)}${pct(s.question)}`;
  const lines = ['choice tells, % of 3-choice sets (chance 33; form: right − wrong)', 'group  sets long  by>  short eLst eMst open  q?'], over: string[] = [];
  for (const [g, all] of [...by].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const s = statsOfTells(all);
    lines.push(line(g, s));
    if (s.sets >= 20 && (!held || held.has(g))) over.push(...overLimits(s).map((p) => `${g}: ${p}`));
  }
  lines.push(line('all', statsOfTells([...by.values()].flat())));
  return { lines, over };
}
