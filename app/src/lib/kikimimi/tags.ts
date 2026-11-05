// ききみみ クイズ: what each item trains (docs/kikimimi.md "Progress & feedback"): its features and sub-skills, the
// dimensions きろく measures and にがて れんしゅう draws from. Level 4 carries its own `tags` (bank4.ts); levels 1-3 are
// tagged here, keyed by item id, with the same vocabulary plus S0's segmentals (curriculum §3) and, for replies, the
// pragmatic layer. bank.test checks every item of levels 1-3 has an entry. Pure.
import type { Feature, Item, Tags } from './bank.ts';

type Pragmatic = Tags['pragmatic'];
type Tag = Feature | Pragmatic;

/** Levels 1-3: an item's features, and a reply's pragmatic layer when it isn't literal. */
const L13: Readonly<Record<string, readonly Tag[]>> = {
  // pic: the right word among others heard ("not the tuna, the squid"), katakana traps
  'p1-squid': ['contrast'], 'p1-peach': ['contrast'], 'p1-cherry': ['contrast'], 'p1-dumbbell': ['contrast', 'katakana'],
  'p1-treadmill': ['contrast'], 'p1-tarantula': ['katakana'], 'p1-umbrella': ['contrast'], 'p1-guitar': ['contrast', 'katakana'],
  'p1-coffee': ['contrast', 'katakana'], 'p1-octopus': ['contrast'], 'p1-bike': ['katakana'], 'p1-yoga': ['katakana'],
  'p1-protein': ['katakana'], 'p1-snowman': [], 'p1-shovel': [], 'p1-cake': ['katakana'],
  'p2-tire': ['contrast', 'contraction'], 'p2-kettlebell': ['contrast', 'katakana'], 'p2-bench': ['contrast'], 'p2-scale': ['understatement'],
  'p2-camera': ['contrast', 'katakana'], 'p2-pear': ['contrast'], 'p2-spider': [], 'p2-hammock': ['contrast', 'contraction'],
  'p2-ramen': ['contrast', 'katakana'], 'p2-violin': ['contrast'],
  'p3-whale-shark': ['contrast'], 'p3-water': ['contrast'], 'p3-butterfly': ['contrast', 'contraction'], 'p3-boot': ['contraction'],
  'p3-orange': ['contrast', 'katakana'], 'p3-bike': ['contrast', 'idiom'], 'p3-umbrella': ['contrast'], 'p3-drums': ['contrast'],
  // word: near-sound choices
  'w1-right': ['l-r'], 'w1-rock': ['l-r'], 'w1-grass': ['l-r'], 'w1-hat': ['vowel'], 'w1-cup': ['vowel'], 'w1-bug': ['vowel'],
  'w1-walk': ['vowel'], 'w1-cant': ['can-cant'], 'w1-play': ['l-r'], 'w1-hard': ['vowel'], 'w1-ship': ['vowel'], 'w1-sing': ['th'],
  'w1-fan': ['b-v'], 'w1-fly': ['l-r'], 'w1-collect': ['l-r'],
  'w2-cats': ['ending'], 'w2-live': ['vowel'], 'w2-seat': ['sh-s'], 'w2-first': ['vowel'], 'w2-watch': ['sh-s'], 'w2-ball': ['vowel'],
  'w2-best': ['b-v'], 'w2-cant': ['can-cant'], 'w2-read': ['l-r'], 'w2-cloud': ['l-r'], 'w2-free': ['th'], 'w2-flight': ['l-r'],
  'w3-gotta': ['gotta'], 'w3-id': ['contraction'], 'w3-shouldve': ['contraction', 'weak-form'], 'w3-thought': ['th'],
  'w3-wont': ['contraction'], 'w3-lively': ['vowel'], 'w3-fishing': ['vowel'], 'w3-breath': ['th'], 'w3-hold': ['f-h'],
  'w3-sore': ['vowel'], 'w3-kitchen': [], 'w3-coffee': ['b-v'],
  // num: -teen / -ty, clock talk, big numbers, a self-correction
  'n1-price-1': ['numbers'], 'n1-price-2': ['numbers'], 'n1-price-3': ['numbers'],
  'n1-meet-1': ['teen-ty'], 'n1-meet-2': ['teen-ty'], 'n1-meet-3': ['teen-ty'],
  'n1-birthday-1': ['teen-ty'], 'n1-birthday-2': ['numbers'], 'n1-birthday-3': ['numbers'],
  'n1-reps-1': ['teen-ty'], 'n1-reps-2': ['teen-ty'], 'n1-reps-3': ['teen-ty'],
  'n1-turnips-1': ['teen-ty'], 'n1-turnips-2': ['teen-ty'], 'n1-turnips-3': ['teen-ty'],
  'n2-opens-1': ['clock'], 'n2-opens-2': ['clock'], 'n2-opens-3': ['clock'],
  'n2-price-1': ['numbers'], 'n2-price-2': ['numbers'], 'n2-price-3': ['numbers'],
  'n2-days-1': ['teen-ty'], 'n2-days-2': ['teen-ty'], 'n2-tourney-1': ['teen-ty'], 'n2-tourney-2': ['numbers'],
  'n2-flight-1': ['teen-ty'], 'n2-flight-2': ['teen-ty'], 'n2-run-1': ['teen-ty'],
  'n3-meet-1': ['clock'], 'n3-meet-2': ['clock'], 'n3-meet-3': ['clock'],
  'n3-steal-1': ['teen-ty', 'numbers'], 'n3-steal-2': ['numbers'], 'n3-steal-3': ['teen-ty', 'numbers'], 'n3-loan-1': ['numbers'],
  'n3-meteor-1': ['numbers'], 'n3-meteor-2': ['numbers'], 'n3-turnips-1': ['numbers'], 'n3-turnips-2': ['numbers'],
  'n3-reps-1': ['self-repair'], 'n3-reps-2': ['self-repair'],
  // reply: TOEIC Part 2 (the traps repeat a sound or answer another question); the indirect ones marked
  'r2-up-to': ['contraction'], 'r2-fossil': [], 'r2-close': [], 'r2-tea': ['formula'], 'r2-workout': [], 'r2-sleepy': [],
  'r2-sofa': ['formula'], 'r2-caught': [], 'r2-museum': [], 'r2-running': [], 'r2-shirt': [], 'r2-lamp': [], 'r2-break': [],
  'r2-rain': ['contraction'],
  'r3-snacks': ['indirect'], 'r3-coffee': ['wanna', 'refusal'], 'r3-early': ['idiom'], 'r3-fireworks': [],
  'r3-working-out': ['intonation'], 'r3-mind': ['formula'], 'r3-gym': ['formula'], 'r3-hat': ['contraction'],
  'r3-monday': ['indirect'], 'r3-how-long': [], 'r3-keep-down': ['indirect'], 'r3-show': ['idiom'], 'r3-rod': ['indirect'],
  'r3-picnic': ['formula'], 'r3-boxes': ['formula'], 'r3-late': []
};

const PRAGMATIC: ReadonlySet<string> = new Set<Pragmatic>(['literal', 'indirect', 'refusal', 'hedge', 'understatement', 'sarcasm', 'humour', 'formula', 'ritual', 'attitude', 'deception']);
/** The pragmatic layers that mean "what they really mean" (ほんね). */
const NOT_SAID: ReadonlySet<string> = new Set<Pragmatic>(['indirect', 'refusal', 'hedge', 'understatement', 'sarcasm', 'humour', 'attitude', 'deception']);

/** The sub-skills (きろく's bars), in the order shown. */
export const SKILLS = ['lr', 'vowel', 'cons', 'reduce', 'num', 'detail', 'reply', 'indirect'] as const;
export type Skill = (typeof SKILLS)[number];

/** Each feature's sub-skill. */
const FEATURE_SKILL: Readonly<Record<Feature, Skill>> = {
  'l-r': 'lr', vowel: 'vowel',
  'b-v': 'cons', th: 'cons', 'sh-s': 'cons', 'f-h': 'cons', ending: 'cons',
  contraction: 'reduce', 'weak-form': 'reduce', flap: 'reduce', yod: 'reduce', gonna: 'reduce', wanna: 'reduce', gotta: 'reduce',
  lemme: 'reduce', dunno: 'reduce', kinda: 'reduce', 'can-cant': 'reduce', 't-glottal': 'reduce', ellipsis: 'reduce',
  numbers: 'num', 'teen-ty': 'num', clock: 'num', 'self-repair': 'num',
  contrast: 'detail', katakana: 'detail',
  idiom: 'reply', intonation: 'indirect'
};
export const FEATURES = Object.keys(FEATURE_SKILL) as Feature[];
const isFeature = (v: string): v is Feature => v in FEATURE_SKILL;
export const featureSkill = (f: Feature): Skill => FEATURE_SKILL[f];

/** An item's features and pragmatic layer (level 4's own tags; levels 1-3's from the table; none for an unknown id). */
export function tagsOf(it: Pick<Item, 'id' | 'tags'>): { features: readonly Feature[]; pragmatic: Pragmatic } {
  if (it.tags) return { features: it.tags.features ?? [], pragmatic: it.tags.pragmatic };
  const row = L13[it.id] ?? [];
  return {
    features: row.filter((t): t is Feature => isFeature(t)),
    pragmatic: (row.find((t) => PRAGMATIC.has(t)) as Pragmatic | undefined) ?? 'literal'
  };
}

/** Whether levels 1-3's table has this id (bank.test: every item does). */
export const tagged = (id: string): boolean => id in L13;

/**
 * An item's sub-skills: the primary (its type: `pic` だいじな ところ, `num` すうじ, `mean` ほんね, `reply` and `next` うけこたえ
 * or ほんね when its pragmatic layer is unsaid, `gist` だいじな ところ or ほんね likewise; `word` its first feature's, にた しいん with none) and the others its features give
 * (counted at half weight by the stats).
 */
export function skillsOf(it: Pick<Item, 'id' | 'type' | 'tags'>): { primary: Skill; also: Skill[] } {
  const { features, pragmatic } = tagsOf(it);
  const primary: Skill =
    it.type === 'pic' ? 'detail'
    : it.type === 'num' ? 'num'
    : it.type === 'mean' ? 'indirect'
    : it.type === 'reply' || it.type === 'next' ? (NOT_SAID.has(pragmatic) ? 'indirect' : 'reply')
    : it.type === 'gist' ? (NOT_SAID.has(pragmatic) ? 'indirect' : 'detail')
    : features.length ? FEATURE_SKILL[features[0]] : 'cons';
  const also = [...new Set(features.map((f) => FEATURE_SKILL[f]))].filter((s) => s !== primary);
  // an unsaid layer on a non-reply item (a pic's understatement) is ほんね too
  if (it.type !== 'reply' && it.type !== 'mean' && it.type !== 'next' && it.type !== 'gist' && NOT_SAID.has(pragmatic) && !also.includes('indirect')) also.push('indirect');
  return { primary, also };
}
