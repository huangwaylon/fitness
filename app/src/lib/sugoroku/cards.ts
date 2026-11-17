// 英語すごろく's イベント cards (docs/sugoroku.md "Rules"): A1 English (≤ 8 words, present tense, one idea; the key word
// starred), its Japanese, an effect (the card shows it as a chip): good or neutral only (no setbacks at a beginner's
// table). `who`: the villager who says it (their head on the card). `ticket`: a card to keep (game.ts Ticket).

export type Ticket = 'hint' | 'dice';
export interface Card {
  en: string;
  ja: string;
  who?: string;
  /** Stars to me (+). */
  stars?: number;
  /** Each other player gives me up to this many. */
  gift?: number;
  /** Spaces forward; no space's action. */
  move?: number;
  /** Roll again now. */
  again?: boolean;
  /** A ticket to keep (at most MAX_TICKETS held). */
  ticket?: Ticket;
}

export const CARDS: readonly Card[] = [
  { en: "It's your *birthday*! Everyone gives you 3 stars.", ja: '誕生日！みんなから星を3つずつもらう。', gift: 3 },
  { en: 'You find a *shortcut*. Move 3.', ja: '近道を見つけた！3マス進む。', move: 3 },
  { en: '*Allowance* day! You get 5 stars.', ja: 'おこづかいの日！星を5つもらう。', stars: 5 },
  { en: 'You buy a cup of *coffee*. Yum!', ja: 'コーヒーを買った。おいしい！', stars: 1 },
  { en: 'You see a *cat*. It is cute!', ja: '猫がいた。かわいい！', stars: 2 },
  { en: 'You *help* a lost old man. "Thank you!"', ja: '道に迷ったおじいさんを助けた。「ありがとう！」', stars: 3 },
  { en: 'It is *sunny* today. Roll again!', ja: '今日は晴れ。もう1回ふろう！', again: true },
  { en: 'You catch a big *fish*!', ja: '大きな魚を釣った！', stars: 4 },
  { en: 'You find a *shell* on the beach.', ja: '浜辺で貝がらを見つけた。', stars: 2 },
  { en: 'Your *bike* is fast. Move 2.', ja: '自転車でスイスイ！2マス進む。', move: 2 },
  { en: 'You *win* a prize at the shop!', ja: 'お店でくじが当たった！', stars: 4 },
  { en: 'You *dance* at the party.', ja: 'パーティーで踊った。', stars: 2 },
  { en: 'The *wind* is strong. Move 1.', ja: '風が強い。1マス進む。', move: 1 },
  // the villagers'
  { en: '*Isabelle* says hello. Roll again!', ja: 'しずえが「おはようございます！」もう1回ふろう！', who: 'isabelle', again: true },
  { en: '*Tom Nook* likes your work.', ja: 'たぬきちが「いい仕事だね」とほめてくれた。', who: 'tom-nook', stars: 3 },
  { en: '*K.K.* sings for you. So nice!', ja: 'とたけけが歌ってくれた。いい曲！', who: 'kk-slider', stars: 2 },
  { en: '*Blathers* shows you a *fossil*.', ja: 'フータが化石を見せてくれた。すごい！', who: 'blathers', stars: 3 },
  { en: 'You make *tea* for friends.', ja: 'みんなにお茶をいれた。お礼に星を1つずつもらう。', gift: 1 },
  { en: 'A *balloon* takes you ahead. Move 3.', ja: '風船にのってふわふわ。3マス進む。', move: 3 },
  { en: 'You water a *flower*. So pretty!', ja: '花に水をあげた。きれい！', stars: 1 },
  // tickets
  { en: 'Isabelle gives you a *hint* ticket.', ja: 'しずえからヒント券をもらった。好きなときに使える！', who: 'isabelle', ticket: 'hint' },
  { en: 'You find a *lucky* dice ticket!', ja: 'サイコロ2つ券を見つけた！好きなときに使える。', ticket: 'dice' },
  { en: 'Tom Nook gives you a *ticket*.', ja: 'たぬきちからヒント券をもらった。', who: 'tom-nook', ticket: 'hint' },
  { en: 'Raymond gives you a dice *ticket*.', ja: 'ジャックからサイコロ2つ券をもらった。', who: 'raymond', ticket: 'dice' }
];
