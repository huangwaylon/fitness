// Japanese-English (和製英語) a learner says, checked before the model (gradeRoute.ts): words where gemma was weak or
// read the Japanese meaning (テンション高い once came back as nervous). A hit answers without an AI call. Each entry: a
// match (case-insensitive), what the match becomes in `fixed`, and a tip in a friend's casual Japanese. Pure.
// Matches are narrow on purpose: a correct sentence must never hit ("She is smart." and "It was a challenge." don't).

export interface Wasei {
  re: RegExp;
  /** The match's recast: a replacement string (`$1`…) or a function of the match. */
  to: string | ((m: string, ...g: string[]) => string);
  tip: string;
}

const SUBJ = String.raw`\b(?:i|we|you|they|he|she)(?:'ll| will| want to| wanna| would like to|'d like to| tried to| try to|'m going to| am going to|'m gonna| am gonna| decided to| will try to)?`;

/** open / close's form as turn's (opened → turned). */
const turn = (v: string): string => (/ed$/i.test(v) ? 'turned' : /ing$/i.test(v) ? 'turning' : /s$/i.test(v) ? 'turns' : 'turn');

export const WASEI: readonly Wasei[] = [
  { re: /\b(?:a|my|the|big|nice|new) mansion\b/i, to: 'an apartment', tip: 'mansion は大豪邸のことだよ。ふつうの家なら apartment！' },
  { re: /\bmansions\b/i, to: 'apartments', tip: 'mansion は大豪邸のことだよ。ふつうの家なら apartment！' },
  { re: /\bmy tension is (?:so |very |really )?(?:high|up)\b/i, to: "I'm so excited", tip: 'テンション高い は excited で言ってみてね！' },
  { re: /\bmy tension is (?:so |very |really )?(?:low|down)\b/i, to: "I'm feeling low", tip: "テンション低い は I'm feeling low で伝わるよ！" },
  { re: /\b(?:high|max) tension\b/i, to: 'really excited', tip: 'テンション高い は excited で言ってみてね！' },
  { re: new RegExp(String.raw`(?<=${SUBJ} )challenge(?= (?:to )?(?!(?:you|him|her|them|me|us|someone|anyone)\b)[a-z])`, 'i'), to: 'try', tip: '挑戦する は try がぴったりだよ！' },
  { re: new RegExp(String.raw`(?<=${SUBJ} )challenged(?= (?:to )?(?!(?:you|him|her|them|me|us|someone|anyone)\b)[a-z])`, 'i'), to: 'tried', tip: '挑戦した は tried がぴったりだよ！' },
  { re: /\b(open|opened|opening|opens) the (tv|television|light|lights|radio|air conditioner)\b/i, to: (_m, v, what) => `${turn(v)} on the ${what}`, tip: 'テレビや電気は turn on / turn off だよ！' },
  { re: /\b(close|closed|closing|closes) the (tv|television|light|lights|radio|air conditioner)\b/i, to: (_m, v, what) => `${turn(v)} off the ${what}`, tip: 'テレビや電気は turn on / turn off だよ！' },
  { re: /\bsmart (?:body|figure|legs|arms|waist)\b/i, to: 'slim figure', tip: '細いは slim だよ。smart は「頭がいい」！' },
  { re: /\b(?:where(?:'s| is) (?:the|a) consent|(?:the|a) consent (?:is|was) (?:broken|near|over|here|there)|(?:into|in|to|from) the consent|consent for (?:my|the) (?:phone|charger|computer|laptop))\b/i, to: (m) => m.replace(/\ba consent/i, 'an outlet').replace(/consent/i, 'outlet'), tip: 'コンセントは outlet って言うよ！' },
  { re: /\bclaimers?\b/i, to: 'complainer', tip: 'クレーマーは complainer って言うよ！' },
  { re: /\b(made|make|makes|making) (?:a )?claims?(?= (?:to|at|about) (?:the |a |my )?(?:shop|store|restaurant|hotel|staff|waiter|company|clerk)\b)/i, to: (_m, v) => ({ made: 'complained', make: 'complain', makes: 'complains', making: 'complaining' })[v.toLowerCase()] ?? 'complained', tip: '苦情を言うは complain だよ！' },
  { re: /\b(go|went|going|goes) to (?:a |the )?viking\b/i, to: '$1 to a buffet', tip: '食べ放題は buffet って言うよ！' },
  { re: /\bviking (?:restaurant|style|lunch|dinner)\b/i, to: 'buffet', tip: '食べ放題は buffet って言うよ！' },
  { re: /\ba salaryman\b/i, to: 'an office worker', tip: '会社員は office worker がふつうだよ！' },
  { re: /\b(?:a|my|new|the|these|her|his) pierces?\b/i, to: (m) => (/^a /i.test(m) ? 'earrings' : m.replace(/pierces?/i, 'earrings')), tip: 'ピアスは earrings だよ！' },
  { re: /\b(?:car'?s handle|handle of (?:the|my|his|her) car)\b/i, to: 'steering wheel', tip: '車のハンドルは steering wheel だよ！' },
  { re: /\bnote ?(?:book )?pc\b/i, to: 'laptop', tip: 'ノートパソコンは laptop だよ！' },
  { re: /\bdid (?:a )?cunning\b/i, to: 'cheated', tip: 'カンニングは cheat を使うよ！' },
  { re: /\b(?:do|doing) (?:a )?cunning\b/i, to: (m) => (/^doing/i.test(m) ? 'cheating' : 'cheat'), tip: 'カンニングは cheat を使うよ！' },
  { re: /\bmorning service\b/i, to: 'breakfast special', tip: 'モーニングは breakfast special だよ！' },
  { re: /\bbaby ?cars?\b/i, to: 'stroller', tip: 'ベビーカーは stroller だよ！' },
  { re: /\bback ?mirror\b/i, to: 'rearview mirror', tip: 'バックミラーは rearview mirror だよ！' },
  { re: /\bfried potato(?:e?s)?\b/i, to: 'fries', tip: 'フライドポテトは fries だよ！' },
  { re: /\bamerican dogs?\b/i, to: 'corn dog', tip: 'アメリカンドッグは corn dog だよ！' },
  { re: /\bshoe ?creams?\b/i, to: 'cream puff', tip: 'シュークリームは cream puff だよ！' },
  { re: /\bsharp ?pencils?\b/i, to: 'mechanical pencil', tip: 'シャーペンは mechanical pencil だよ！' },
  { re: /\b(play|played|playing|plays) (?:the )?trumps?\b/i, to: '$1 cards', tip: 'トランプ遊びは cards って言うよ！' },
  { re: /\bgas(?:oline)? stand\b/i, to: 'gas station', tip: 'ガソリンスタンドは gas station だよ！' },
  { re: /\bjet ?coasters?\b/i, to: 'roller coaster', tip: 'ジェットコースターは roller coaster だよ！' },
  { re: /\border[- ]?made\b/i, to: 'custom-made', tip: 'オーダーメイドは custom-made だよ！' },
  { re: /\b(get|got|have|want|ask for|asked for) (your|his|her|their) sign\b/i, to: '$1 $2 autograph', tip: '有名人のサインは autograph だよ！' },
  { re: /\bskinship\b/i, to: 'hugs', tip: 'スキンシップは hugs や cuddles で言えるよ！' },
  { re: /\by-?shirts?\b/i, to: 'dress shirt', tip: 'ワイシャツは dress shirt だよ！' },
  { re: /\b(go|went|going|goes) to (?:a |the )live\b/i, to: '$1 to a concert', tip: 'ライブは concert や show だよ！' },
  { re: /\b(?:i'?m|i am) (?:a )?my ?pace(?: person)?\b/i, to: 'I do things at my own pace', tip: 'マイペースは at my own pace で言えるよ！' }
];

export interface WaseiHit {
  fixed: string;
  tip: string;
}

/** The first entry `s` hits: `s` with the match recast (its first letter kept a capital), and the tip; or null. */
export function waseiOf(s: string): WaseiHit | null {
  for (const w of WASEI) {
    if (!w.re.test(s)) continue;
    const fixed = typeof w.to === 'string' ? s.replace(w.re, w.to) : s.replace(w.re, w.to);
    return { fixed: s[0] === s[0]?.toUpperCase() ? fixed.charAt(0).toUpperCase() + fixed.slice(1) : fixed, tip: w.tip };
  }
  return null;
}
