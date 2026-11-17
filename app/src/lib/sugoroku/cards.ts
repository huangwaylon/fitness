// 英語すごろく's イベント cards (docs/sugoroku.md "Rules"): A1 English (≤ 8 words, present tense, one idea; the key word
// starred), its Japanese, an effect: good or neutral only (the game review: no setbacks for a beginner's table).

export interface Card {
  en: string;
  ja: string;
  /** Stars to me (+). */
  stars?: number;
  /** Each other player gives me up to this many. */
  gift?: number;
  /** Spaces forward; no space's action. */
  move?: number;
  /** Spin again now. */
  again?: boolean;
}

export const CARDS: readonly Card[] = [
  { en: "It's your *birthday*! Everyone gives you 3 stars.", ja: '誕生日！みんなから星を3つずつもらう。', gift: 3 },
  { en: 'You find a *shortcut*. Move 3.', ja: '近道を見つけた！3マス進む。', move: 3 },
  { en: '*Payday*! You get 5 stars.', ja: '給料日！星を5つもらう。', stars: 5 },
  { en: 'You buy a cup of *coffee*. Yum!', ja: 'コーヒーを買った。おいしい！', stars: 1 },
  { en: 'You see a *cat*. It is cute!', ja: '猫がいた。かわいい！', stars: 2 },
  { en: 'You *help* an old man. "Thank you!"', ja: 'おじいさんを手伝った。「ありがとう！」', stars: 3 },
  { en: 'It is *sunny* today. Spin again!', ja: '今日は晴れ。もう1回まわそう！', again: true },
  { en: 'You are *hungry*. Eat some rice.', ja: 'おなかがすいた。ごはんを食べよう。', stars: 1 },
  { en: 'You catch a big *fish*!', ja: '大きな魚を釣った！', stars: 4 },
  { en: 'You find a *shell* on the beach.', ja: '浜辺で貝がらを見つけた。', stars: 2 },
  { en: 'Your *bike* is fast. Move 2.', ja: '自転車は速い。2マス進む。', move: 2 },
  { en: 'A *friend* calls you. Spin again!', ja: '友だちから電話。もう1回まわそう！', again: true },
  { en: 'You *win* a prize at the shop!', ja: 'お店でくじが当たった！', stars: 4 },
  { en: 'You give a *gift*. Everyone smiles.', ja: 'プレゼントをあげた。みんな笑顔。', stars: 2 },
  { en: 'You *see* a rainbow. Wow!', ja: '虹が見えた。すごい！', stars: 1 },
  { en: 'You *dance* at the party.', ja: 'パーティーで踊った。', stars: 2 },
  { en: 'You *take* a photo. Smile!', ja: '写真を撮った。はい、チーズ！', stars: 1 },
  { en: 'The *wind* is strong. Move 1.', ja: '風が強い。1マス進む。', move: 1 }
];
