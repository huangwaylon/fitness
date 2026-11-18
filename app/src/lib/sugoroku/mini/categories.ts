// なかま分け's categories (docs/sugoroku.md "みんなで！"): the pictures' sets (pictures.json `set`) as a bin reads, in
// English and a sheet's Japanese (kanji, casual), and the pairs a seat sorts between: やさしい・ふつう far apart and
// rich in everyday pictures, むずかしい closer (home vs tools: you have to read the word).
export const SETS = {
  food: { en: 'food', ja: '食べ物' },
  animal: { en: 'animals', ja: '動物' },
  home: { en: 'at home', ja: '家にあるもの' },
  town: { en: 'in town', ja: '町にあるもの' },
  nature: { en: 'nature', ja: '自然' },
  school: { en: 'school', ja: '学校' },
  music: { en: 'music', ja: '音楽' },
  clothes: { en: 'clothes', ja: '服' },
  sport: { en: 'sports', ja: 'スポーツ' },
  body: { en: 'the body', ja: '体' },
  tools: { en: 'tools', ja: '道具' },
  people: { en: 'people', ja: '人' },
  science: { en: 'science', ja: '科学' }
} as const satisfies Record<string, { en: string; ja: string }>;
export type SetId = keyof typeof SETS;

/** The pairs by how close: `far` (levels 1–2: everyday pictures, sets far apart), `close` (level 3: B1+ pictures,
 *  sets that share a room or a topic). */
export const PAIRS: Readonly<Record<'far' | 'close', readonly (readonly [SetId, SetId])[]>> = {
  far: [['food', 'animal'], ['clothes', 'body'], ['nature', 'town'], ['sport', 'food'], ['school', 'animal'], ['home', 'nature'], ['clothes', 'food'], ['animal', 'town'], ['body', 'home'], ['sport', 'clothes']],
  close: [['home', 'tools'], ['school', 'science'], ['people', 'body'], ['sport', 'music'], ['town', 'home'], ['nature', 'animal'], ['food', 'home'], ['clothes', 'body'], ['tools', 'science'], ['music', 'school']]
};
