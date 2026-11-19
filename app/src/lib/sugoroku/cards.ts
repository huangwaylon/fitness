// 英語すごろく's イベント cards (docs/sugoroku.md "Rules"): A1 English (≤ 8 words, present tense, one idea; the key word
// starred), its Japanese, and either an effect (a move or another roll: the card shows it as a chip) or a key word to
// ask (`kw`, `pos`: a quick quiz, its stars by the tries: game.ts eventDone, quiz.ts). Never a setback.
// `who`: the villager who says it (their head on the card). The order is the draw's: keep it.

export interface Card {
  en: string;
  ja: string;
  who?: string;
  /** Spaces forward; no space's action. */
  move?: number;
  /** Roll again now. */
  again?: boolean;
  /** The key word's Japanese and part of speech (a quiz card, quiz.ts). */
  kw?: string;
  pos?: 'n' | 'v';
}

export const CARDS: readonly Card[] = [
  { en: "It's your *birthday*! Happy birthday!", ja: '誕生日！おめでとう！', kw: '誕生日', pos: 'n' },
  { en: 'You find a *shortcut*. Move 3.', ja: '近道を見つけた！3マス進む。', move: 3 },
  { en: "It's *allowance* day! Yay!", ja: 'おこづかいの日！やった！', kw: 'おこづかい', pos: 'n' },
  { en: 'You buy a cup of *coffee*. Yum!', ja: 'コーヒーを買った。おいしい！', kw: 'コーヒー', pos: 'n' },
  { en: 'You see a *cat*. It is cute!', ja: '猫がいた。かわいい！', kw: '猫', pos: 'n' },
  { en: 'You *help* a lost man. "Thank you!"', ja: '道に迷った人を助けた。「ありがとう！」', kw: '助ける', pos: 'v' },
  { en: 'It is *sunny* today. Roll again!', ja: '今日は晴れ。もう1回ふろう！', again: true },
  { en: 'You catch a big *fish*!', ja: '大きな魚を釣った！', kw: '魚', pos: 'n' },
  { en: 'You find a *shell* on the beach.', ja: '浜辺で貝がらを見つけた。', kw: '貝がら', pos: 'n' },
  { en: 'Your *bike* is fast. Move 2.', ja: '自転車でスイスイ！2マス進む。', move: 2 },
  { en: 'You *win* a prize at the shop!', ja: 'お店で賞品が当たった！', kw: '当たる・勝つ', pos: 'v' },
  { en: 'You *dance* at the party.', ja: 'パーティーで踊った。', kw: '踊る', pos: 'v' },
  { en: 'The *wind* is strong. Move 1.', ja: '風が強い。1マス進む。', move: 1 },
  // the villagers'
  { en: 'Isabelle says *hello*. Roll again!', ja: 'しずえが「おはようございます！」もう1回ふろう！', who: 'isabelle', again: true },
  { en: 'Tom Nook *likes* your work.', ja: 'たぬきちが「いい仕事だね」とほめてくれた。', who: 'tom-nook', kw: '気に入る', pos: 'v' },
  { en: 'K.K. *sings* for you. So nice!', ja: 'とたけけが歌ってくれた。いい曲！', who: 'kk-slider', kw: '歌う', pos: 'v' },
  { en: 'Blathers shows you a *fossil*.', ja: 'フータが化石を見せてくれた。すごい！', who: 'blathers', kw: '化石', pos: 'n' },
  { en: 'You make *tea* for friends.', ja: 'みんなにお茶をいれた。', kw: 'お茶', pos: 'n' },
  { en: 'You ride a *balloon*. Move 3.', ja: '風船に乗ってふわふわ。3マス進む。', move: 3 },
  { en: 'You water a *flower*. So pretty!', ja: '花に水をあげた。きれい！', kw: '花', pos: 'n' }
];
