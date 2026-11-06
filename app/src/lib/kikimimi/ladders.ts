// ききみみ クイズ's スピード はしご (docs/kikimimi.md "スピード はしご", docs/curriculum.md §7 game 2, §14 increment 7): 30
// ladders, each one line of real daily life (B1+ → B2) heard four times, faster each time (ladder.ts SPEEDS: 0.8× →
// 1.4× natural speech), with a different question at each rung, so the climb is never the same question again:
//   1 (0.8×) the gist: what's going on (Japanese choices: nothing English to read before the next rung);
//   2 (1.0×) a detail; 3 (1.2×) another, harder detail (a number, a condition, what to do);
//   4 (1.4×) ことば (dictation-lite): the line shown with its key chunk blanked, and 3 near-sound forms of that chunk
//      which mean much the same (the train's / was / got stuck; I'd / I'll / I helped), so knowing the meaning by now
//      doesn't give it away: only the weak forms heard at speed do.
// Ten lines are level 4's own (`from`: the same take, its Japanese, note, staging and marks), twenty are new, with
// natural reductions spelled in `tts` (§9) and their sound marks. Each new line follows bank4.ts's rules: `en` standard
// spelling (digits allowed), `tts` as said (every number in words), the trap in `note` (≤ 40 字), a cast voice per
// villager (bank4.ts CAST), a scenario seed and its tags.
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Accent, Item, SceneId, SoundMark, Tags } from './bank.ts';
import { BANK4, CAST } from './bank4.ts';
import { SPEEDS, type Ladder } from './ladder.ts';

/** A rung's question: what to listen for (Japanese), its choices (the right one first), `num` for a number's. */
type Ask = readonly [ask: string, choices: readonly string[], type?: 'num'];

/** A new line (not one of level 4's). */
interface LineSrc {
  who: RosterId;
  en: string;
  tts?: string;
  ja: string;
  note: string;
  tags: Tags;
  scene?: SceneId;
  marks?: readonly SoundMark[];
}

export interface LadderSrc {
  /** `sp-<name>`: the rung clips are `<id>-1` … `<id>-4`. */
  id: string;
  /** Level 4's item whose line (and take) it climbs, or the line itself. */
  line: string | LineSrc;
  /** Rungs 1-3's questions. */
  asks: readonly [Ask, Ask, Ask];
  /** Rung 4's chunk (in `en`, the blank) and its two near-sound forms. */
  chunk: readonly [string, string, string];
}

const tg = (seed: number, register: Tags['register'], pragmatic: Tags['pragmatic'], conditions?: Tags['conditions'], features?: Tags['features']): Tags =>
  ({ seed, register, pragmatic, ...(conditions?.length && { conditions }), ...(features?.length && { features }) });
const g = (at: string): SoundMark => ['drop', at, 'g'];

export const LADDER_SRC: readonly LadderSrc[] = [
  // ---- level 4's lines --------------------------------------------------------------------------------------------
  { id: 'sp-platform', line: 'n4-platform',
    asks: [['なんの はなし？', ['ヘルメットの ねだん', 'じてんしゃの しゅうりだい', 'ヘルメットの サイズ']],
      ['ぜいぬきは いくら？', ['$40', '$14', '$43'], 'num'],
      ['ぜいこみで いくら？', ['$43.20', '$40.32', '$34.20'], 'num']],
    chunk: ["you're looking at", "you were looking at", "you'll be looking at"] },
  { id: 'sp-gate', line: 'n4-gate',
    asks: [['なにが はじまった？', ['とうじょう', 'チェックイン', 'てにもつの うけとり']],
      ['どこゆきの びん？', ['デンバー', 'ダラス', 'デトロイト']],
      ['とうじょうぐちは？', ['15ばん', '50ばん', '815ばん'], 'num']],
    chunk: ['is now boarding', 'is boarding', 'was now boarding'] },
  { id: 'sp-water', line: 'n4-water',
    asks: [['なんの はなし？', ['タイルを なんはこ かうか', 'ペンキの いろ', 'タイルの へんぴん']],
      ['1はこで なんへいほうフィート？', ['10', '5', '6'], 'num'],
      ['ぜんぶで なんはこ かう？', ['6はこ', '5はこ', '10はこ'], 'num']],
    chunk: ["that's 5 boxes", "that'd be 5 boxes", 'that was 5 boxes'] },
  { id: 'sp-yen', line: 'n4-yen',
    asks: [['なんの でんわ？', ['ひっこしの みつもり', 'ホテルの よやく', 'くるまの しゅうり']],
      ['きほんの りょうきんは？', ['6万8千円', '8万6千円', '7万8千円'], 'num'],
      ['5千円は なんの りょうきん？', ['にづくり', 'そうじ', 'ほけん']]],
    chunk: ["It'd be", "It'll be", 'It would be'] },
  { id: 'sp-half-nine', line: 'n4-half-nine',
    asks: [['なんの はなし？', ['よやくの あき', 'みせの えいぎょう じかん', 'でんしゃの じこく']],
      ['えらべる ようびは？', ['火曜か 水曜', '木曜か 金曜', '火曜か 木曜']],
      ['水曜は なんじ？', ['9:15', '8:45', '9:45'], 'num']],
    chunk: ["I've got", 'I got', "I'd got"] },
  { id: 'sp-flight', line: 'n4-flight',
    asks: [['なにが おきた？', ['べつの びんに かわった', 'びんが けっこうに なった', 'せきが アップグレードされた']],
      ['どこで のりつぐ？', ['シカゴ', 'シアトル', 'シャーロット']],
      ['なんじ はつ？', ['9:05', '9:50', '7:05'], 'num']],
    chunk: ["You're rebooked", "You've been booked", 'You were rebooked'] },
  { id: 'sp-split', line: 'n4-split',
    asks: [['なんの はなし？', ['チケット代の せいさん', 'おつりの けいさん', 'チップの きんがく']],
      ['チケットは いくらだった？', ['$46.80', '$48.60', '$40.68'], 'num'],
      ['いくら おくる？', ['$47', '$46', '$74'], 'num']],
    chunk: ["So that's", 'So that was', "So that'd be"] },
  { id: 'sp-reschedule', line: 'r4-reschedule',
    asks: [['なんの でんわ？', ['よやくの へんこう', 'ちゅうもんの キャンセル', 'しはらいの さいそく']],
      ['へんこうは できる？', ['できる', 'できない', 'あしたなら できる']],
      ['てすうりょうが かかるのは？', ['24じかん いないの へんこう', 'すべての へんこう', '2かいめの へんこう']]],
    chunk: ['We can move it', 'We could move it', "We'll move it"] },
  { id: 'sp-cat', line: 'm4-cat',
    asks: [['なんの でんわ？', ['たのみごと', 'おわび', 'パーティーの さそい']],
      ['なにを たのんでいる？', ['ねこに エサを あげる', 'ねこを あずかる', 'ねこを びょういんへ つれていく']],
      ['いつ？', ['あした', 'こんや', 'あさって']]],
    chunk: ['you could', 'you can', "you'd"] },
  { id: 'sp-claim', line: 'n4-claim',
    asks: [['なんの れんらく？', ['しめきりの おしらせ', 'しはらいの おれい', 'よやくの かくにん']],
      ['なんにちまでに？', ['30日', '13日', '3日'], 'num'],
      ['それは なんようび？', ['こんしゅうの 木曜', 'らいしゅうの 木曜', 'こんしゅうの 火曜']]],
    chunk: ['we need the claim', 'we needed the claim', "we'll need the claim"] },

  // ---- new lines -----------------------------------------------------------------------------------------------------
  { id: 'sp-gp-slot',
    line: { who: 'fauna', en: "We don't have anything until the 20th, I'm afraid, but if you call at eight tomorrow, you might get a same-day appointment.",
      tts: "We don't have anything until the twentieth, I'm afraid, but if you call at eight tomorrow, you might get a same-day appointment.",
      ja: '申し訳ありませんが20日まで空きがありません。ただ、明日8時にお電話いただければ当日の予約が取れるかもしれません。',
      note: 'until the 20th＝20日まで空きなし。8時に電話が近道', tags: tg(14, 'service', 'formula', ['phone'], ['numbers', 'weak-form']), scene: 'living',
      marks: [['say', '20th', 'TWENtieth'], ['link', 'might get a']] },
    asks: [['なんの でんわ？', ['びょういんの よやく', 'くすりの ちゅうもん', 'けんさの けっか']],
      ['いちばん はやい よやくは？', ['20日', '2日', '12日'], 'num'],
      ['どうすると いい？', ['あした 8時に でんわする', 'あした 8時に いく', 'こんや かけなおす']]],
    chunk: ['you might get', "you might've got", "you'd get"] },
  { id: 'sp-running-late',
    line: { who: 'goldie', en: "Hey, so I'm going to be like 20 minutes late. The train's stuck outside Shibuya. Just order without me, okay?",
      tts: "Hey, so I'm gonna be like twenty minutes late. The train's stuck outside Shibuya. Just order without me, okay?",
      ja: 'ねえ、20分くらい遅れそう。電車が渋谷の手前で止まってるの。先に注文してて。',
      note: 'gonna be like＝〜くらいになりそう。like は「約」', tags: tg(49, 'friend', 'literal', ['phone'], ['gonna', 'contraction']), scene: 'cafe',
      marks: [['say', 'going to', 'gonna'], ['link', 'stuck outside']] },
    asks: [['なにが あった？', ['でんしゃが とまっている', 'ねぼうした', 'みちに まよった']],
      ['どのくらい おくれる？', ['20分', '10分', '30分'], 'num'],
      ['あいては どうすれば いい？', ['さきに ちゅうもんする', 'えきまで むかえに いく', 'さきに かえる']]],
    chunk: ["The train's stuck", 'The train was stuck', 'The train got stuck'] },
  { id: 'sp-drowsy',
    line: { who: 'merengue', en: "Take two every four hours, but no more than eight in a day. And they might make you a bit drowsy, so don't drive.",
      tts: "Take two every four hours, but no more than eight in a day. An' they might make you a bit drowsy, so don't drive.",
      ja: '4時間ごとに2錠、1日8錠までです。少し眠くなるかもしれないので、運転はしないでください。',
      note: 'drowsy＝眠い。no more than＝〜まで（上限）', tags: tg(13, 'service', 'literal', [], ['numbers', 'weak-form']), scene: 'pharmacy',
      marks: [['say', 'And', "an'"], ['link', 'make you a']] },
    asks: [['どこでの かいわ？', ['くすりや', 'ジム', 'レストラン']],
      ['1日に いくつまで？', ['8じょう', '4じょう', '2じょう'], 'num'],
      ['なにを しては いけない？', ['うんてん', 'おさけを のむ', 'くうふくで のむ']]],
    chunk: ['they might make you', 'they may make you', "they'll make you"] },
  { id: 'sp-heating',
    line: { who: 'tom-nook', en: "Yeah, I've got the heating guy coming Thursday. Should be fixed by the weekend. If not, just give me a call.",
      tts: "Yeah, I've got the heating guy comin' Thursday. Should be fixed by the weekend. If not, just gimme a call.",
      ja: 'ああ、木曜に暖房の業者が来るよ。週末までには直るはず。直らなかったら電話して。',
      note: 'Should be～は主語の省略。確約ではない', tags: tg(30, 'neighbour', 'hedge', ['phone'], ['ellipsis', 'weak-form']), scene: 'living',
      marks: [g('coming'), ['say', 'give me', 'gimme']] },
    asks: [['なんの はなし？', ['だんぼうの しゅうり', 'やちんの ねあげ', 'ひっこしの ひにち']],
      ['ぎょうしゃが くるのは？', ['木曜', '火曜', 'しゅうまつ']],
      ['なおらなかったら？', ['おおやに でんわする', 'じぶんで ぎょうしゃを よぶ', 'やちんを さげてもらう']]],
    chunk: ['Should be fixed', "Should've been fixed", 'Should get fixed'] },
  { id: 'sp-numbers-finance',
    line: { who: 'julian', en: "I'm still waiting on the numbers from finance, so I can't really finish the deck until they've sent them over.",
      tts: "I'm still waiting on the numbers from finance, so I can't really finish the deck till they've sent 'em over.",
      ja: 'まだ経理の数字を待っているので、送ってもらうまで資料を仕上げられないんです。',
      note: 'deck＝発表資料。waiting on＝〜待ち', tags: tg(44, 'colleague', 'literal', ['video'], ['weak-form', 'can-cant']), scene: 'office',
      marks: [['say', 'until', 'till'], ['say', 'them', "'em"], ['link', 'sent them over']] },
    asks: [['いまの じょうきょうは？', ['まっている', 'もう おわった', 'てつだって ほしい']],
      ['なにを まっている？', ['けいりの すうじ', 'きゃくの へんじ', 'じょうしの しょうにん']],
      ['なにが しあがらない？', ['はっぴょう しりょう', 'けいやくしょ', 'せいきゅうしょ']]],
    chunk: ["they've sent them", 'they sent them', "they'd sent them"] },
  { id: 'sp-key-code',
    line: { who: 'stitches', en: "Dude, you missed it! We were down 5 to 2 in the eighth, and we came back and won 6 to 5!",
      tts: "Dude, you missed it! We were down five to two in the eighth, and we came back an' won six to five!",
      ja: 'おい、見逃したな！8回で5対2で負けてたのに、逆転して6対5で勝ったんだぞ！',
      note: 'down＝負けている。came back＝逆転した', tags: tg(50, 'friend', 'humour', ['voicemail'], ['numbers', 'weak-form']), scene: 'living',
      marks: [['say', 'and won', "an' won"], ['link', 'came back']] },
    asks: [['なんの メッセージ？', ['やきゅうの しあいの けっか', 'チケットの よやく', 'しあいの ちゅうし']],
      ['8かいの とき なんたい なん？', ['5たい2で まけていた', '6たい5で かっていた', '2たい5で かっていた']],
      ['さいごの スコアは？', ['6たい5', '5たい6', '6たい2'], 'num']],
    chunk: ['we came back', 'we come back', "we've come back"] },
  { id: 'sp-push-meeting',
    line: { who: 'pietro', en: "Can we push this to Thursday? I've got a client thing that's run over. Actually, make it Friday morning, if that works for everyone.",
      tts: "Can we push this to Thursday? I've got a client thing that's run over. Actually, make it Friday mornin', if that works for everyone.",
      ja: '木曜にずらせる？客先の件が長引いてて。いや、みんなが大丈夫なら金曜の朝にしよう。',
      note: 'push＝延期。Actually で言い直し。最後が答え', tags: tg(40, 'boss', 'literal', ['video'], ['self-repair', 'contraction']), scene: 'office',
      marks: [['link', 'push this'], g('morning')] },
    asks: [['なんの はなし？', ['かいぎの にってい へんこう', 'かいぎの キャンセル', 'あたらしい きゃく']],
      ['なぜ？', ['ほかの ようじが のびた', 'たいちょうが わるい', 'しりょうが まにあわない']],
      ['さいごに いつに した？', ['金曜の あさ', '木曜', '金曜の ごご']]],
    chunk: ["that's run over", 'that ran over', "that's running over"] },
  { id: 'sp-depot',
    line: { who: 'punchy', en: "Hi, I've tried apartment 3 twice now and nobody's answering. I'll leave a notice, and you can pick it up at the post office after two tomorrow.",
      tts: "Hi, I've tried apartment three twice now an' nobody's answering. I'll leave a notice, and you can pick it up at the post office after two tomorrow.",
      ja: '3号室に2回伺いましたが、お留守のようです。不在票を入れておくので、明日2時以降に郵便局で受け取ってください。',
      note: 'leave a notice＝不在票を残す。after two＝2時以降', tags: tg(37, 'stranger', 'literal', [], ['weak-form', 'numbers']), scene: 'door',
      marks: [['say', 'and', "an'"], ['link', 'pick it up']] },
    asks: [['なんの はなし？', ['にもつを わたせなかった', 'にもつが こわれていた', 'へやを まちがえた']],
      ['なんごうしつ？', ['3ごうしつ', '2ごうしつ', '13ごうしつ'], 'num'],
      ['どう うけとる？', ['あした 2時いこうに ゆうびんきょくで', 'きょう もういちど とどく', 'となりの ひとから']]],
    chunk: ["I'll leave a notice", "I'd leave a notice", 'I left a notice'] },
  { id: 'sp-oat-out',
    line: { who: 'brewster', en: "Sorry, we just ran out of blueberry muffins. I can do banana nut or cranberry, or there's a fresh batch in about 10 minutes.",
      tts: "Sorry, we just ran out of blueberry muffins. I can do banana nut or cranberry, or there's a fresh batch in about ten minutes.",
      ja: 'すみません、ブルーベリーマフィンがちょうど切れてしまって。バナナナッツかクランベリーならあります。あと10分ほどで焼きたてが出ます。',
      note: 'ran out of＝切らした。I can do＝お出しできる', tags: tg(51, 'service', 'literal', ['cafe'], ['weak-form', 'contraction']), scene: 'cafe',
      marks: [['link', 'ran out of'], ['link', 'fresh batch']] },
    asks: [['なにが おきた？', ['ブルーベリーマフィンが ない', 'カフェが しまる', 'ちゅうもんを まちがえた']],
      ['かわりに えらべるのは？', ['バナナナッツか クランベリー', 'チョコか クランベリー', 'バナナナッツか チョコ']],
      ['やきたては あと どのくらい？', ['10分', '2分', '30分'], 'num']],
    chunk: ['we just ran out of', "we've just run out of", "we'd just run out of"] },
  { id: 'sp-late-checkout',
    line: { who: 'diana', en: "Breakfast's from 6:30 to 10 in the restaurant downstairs, and checkout's at 11, but we can do a late one for $20.",
      tts: "Breakfast's from six-thirty to ten in the restaurant downstairs, and checkout's at eleven, but we can do a late one for twenty dollars.",
      ja: '朝食は下のレストランで6時半から10時まで。チェックアウトは11時ですが、20ドルでレイトチェックアウトもできます。',
      note: 'a late one＝遅めのチェックアウト。$20 で延長できる', tags: tg(3, 'service', 'literal', ['desk'], ['numbers', 'contraction']),
      marks: [['say', '6:30', 'six-thirty'], ['say', '$20', 'twenty dollars']] },
    asks: [['どこでの はなし？', ['ホテルの フロント', 'レストランの よやく', 'くうこうの カウンター']],
      ['ちょうしょくは なんじから？', ['6:30', '5:30', '6:00'], 'num'],
      ['レイト チェックアウトは？', ['20ドルで できる', 'むりょうで できる', 'できない']]],
    chunk: ['we can do', 'we could do', "we'll do"] },
  { id: 'sp-lunges',
    line: { who: 'roald', en: "Nice. Keep your back straight and push through your heels. Two more, then grab some water and we'll switch to lunges.",
      tts: "Nice. Keep your back straight an' push through your heels. Two more, then grab some water an' we'll switch to lunges.",
      ja: 'いいね。背中はまっすぐ、かかとで押して。あと2回、それから水を飲んでランジに変えよう。',
      note: 'switch to～＝〜に切り替える。and は「ン」に弱まる', tags: tg(17, 'service', 'literal', [], ['weak-form', 'contraction']),
      marks: [['say', 'and', "an'"], ['link', 'grab some']] },
    asks: [['どこ？', ['ジム', 'びょういん', 'こうえんの ベンチ']],
      ['なにに きを つける？', ['せなかを まっすぐ', 'ひざを まげない', 'いきを とめない']],
      ['このあと なにを する？', ['みずを のんで ランジ', 'きょうは おわり', 'ストレッチ']]],
    chunk: ["we'll switch", 'we switch', "we'd switch"] },
  { id: 'sp-sister-move',
    line: { who: 'cherry', en: "I'd love to come, but I promised my sister I'd help her move that weekend. Can I let you know closer to the time?",
      tts: "I'd love to come, but I promised my sister I'd help her move that weekend. Can I letcha know closer to the time?",
      ja: '行きたいんだけど、その週末は姉の引っ越しを手伝うって約束しちゃって。近くなったら連絡してもいい？',
      note: "I'd love to, but＝やんわり断る前置き。返事は先のばし", tags: tg(48, 'friend', 'hedge', ['phone'], ['yod', 'contraction']), scene: 'living',
      marks: [['say', 'let you', 'letcha'], ['link', 'help her']] },
    asks: [['さそいへの こたえは？', ['たぶん いけない', 'ぜったい いく', 'もう ことわった']],
      ['なんの ようじ？', ['しまいの ひっこし', 'しごと', 'りょこう']],
      ['さいごに なんと いった？', ['ちかくなったら れんらくする', 'つぎは いく', 'ほかの ひとを さそって']]],
    chunk: ["I'd help her", "I'll help her", 'I helped her'] },
  { id: 'sp-card-frozen',
    line: { who: 'maple', en: "For security, I've temporarily frozen the card. A new one should reach you in five to seven business days, and the old one won't work starting today.",
      ja: 'セキュリティのため、カードを一時停止しました。新しいカードは5〜7営業日で届きます。古いカードは今日から使えません。',
      note: "frozen＝凍結。won't work＝使えない", tags: tg(21, 'service', 'literal', ['phone'], ['numbers', 'weak-form']), scene: 'living' },
    asks: [['なんの でんわ？', ['カードの ていし', 'ローンの そうだん', 'こうざの かいせつ']],
      ['あたらしい カードは いつ とどく？', ['5〜7えいぎょうび', '3〜5えいぎょうび', '7〜10えいぎょうび'], 'num'],
      ['ふるい カードは？', ['きょうから つかえない', 'あしたまで つかえる', 'つかいつづけて いい']]],
    chunk: ['should reach you', "should've reached you", 'shall reach you'] },
  { id: 'sp-back-streets',
    line: { who: 'marshal', en: "Traffic's awful on the main road, so I'm going to cut through the side streets. Should save us 10 minutes, give or take.",
      tts: "Traffic's awful on the main road, so I'm gonna cut through the side streets. Should save us ten minutes, give or take.",
      ja: '大通りがひどく混んでるので、裏道を抜けますね。だいたい10分は短縮できるはずです。',
      note: 'give or take＝だいたい。cut through＝抜け道を通る', tags: tg(4, 'service', 'literal', [], ['gonna', 'ellipsis']), scene: 'street',
      marks: [['say', 'going to', 'gonna'], ['link', 'cut through']] },
    asks: [['だれが はなしている？', ['ウーバーの うんてんしゅ', 'バスの アナウンス', 'みちを きく ひと']],
      ['どうする？', ['うらみちを とおる', 'こうそくに のる', 'ひきかえす']],
      ['どのくらい はやくなる？', ['10分くらい', '2分くらい', '20分くらい'], 'num']],
    chunk: ['Should save us', "Should've saved us", 'Should save you'] },
  { id: 'sp-residence-card',
    line: { who: 'label', en: "You'll need your residence card and something with your address on it, like a utility bill. Photocopies are fine.",
      tts: "You'll need your residence card an' something with your address on it, like a utility bill. Photocopies are fine.",
      ja: '在留カードと、公共料金の請求書など住所がわかるものが必要です。コピーで大丈夫です。',
      note: 'utility bill＝公共料金の請求書。住所の証明', tags: tg(24, 'official', 'literal', [], ['contraction', 'weak-form']),
      marks: [['say', 'and', "an'"], ['link', 'address on it']] },
    asks: [['なんの はなし？', ['ひつような しょるい', 'てすうりょう', 'まどぐちの じかん']],
      ['カードの ほかに なにが いる？', ['じゅうしょが わかる もの', 'しょうめい しゃしん', 'はんこ']],
      ['コピーは？', ['コピーで いい', 'げんぽんだけ', 'りょうほう いる']]],
    chunk: ["You'll need", 'You need', "You'd need"] },
  { id: 'sp-table-wait',
    line: { who: 'raymond', en: "It's about a forty-minute wait for a table, I'm afraid, but you're welcome to sit at the bar and order from the full menu.",
      ja: 'お席は40分ほどお待ちいただきますが、カウンターでしたら全メニューからご注文いただけます。',
      note: "you're welcome to～＝ご自由に〜どうぞ", tags: tg(27, 'service', 'formula', [], ['teen-ty', 'weak-form']), scene: 'cafe',
      marks: [['say', 'forty-minute', 'FORty-minute'], ['link', 'sit at']] },
    asks: [['なにを いわれた？', ['せきが あくまで まつ', 'まんせきで はいれない', 'よやくが ひつよう']],
      ['どのくらい まつ？', ['40分', '14分', '4分'], 'num'],
      ['すぐ たべるには？', ['カウンターで ちゅうもん', 'テイクアウト', 'セットメニューだけ']]],
    chunk: ["you're welcome to", 'you were welcome to', "you'd be welcome to"] },
  { id: 'sp-onions',
    line: { who: 'bunnie', en: "I was going to make curry, but we're out of onions. Do you want to just grab something on your way home?",
      tts: "I was gonna make curry, but we're outta onions. D'you wanna just grab somethin' on your way home?",
      ja: 'カレーを作るつもりだったけど、玉ねぎがないの。帰りに何か買ってきてくれない？',
      note: 'was gonna＝〜するつもりだった（やめた）', tags: tg(35, 'partner', 'indirect', ['phone'], ['gonna', 'wanna']), scene: 'living',
      marks: [['say', 'going to', 'gonna'], ['say', 'out of', 'outta'], ['say', 'Do you', "d'you"], ['say', 'want to', 'wanna'], g('something')] },
    asks: [['なんの はなし？', ['ばんごはん', 'かいもの リスト', 'しゅうまつの よてい']],
      ['なにが たりない？', ['たまねぎ', 'カレールー', 'おこめ']],
      ['なにを たのんでいる？', ['かえりに なにか かってくる', 'たまねぎを かってくる', 'がいしょくに いく']]],
    chunk: ['I was going to', "I'm going to", "I wasn't going to"] },
  { id: 'sp-cover-shift',
    line: { who: 'audie', en: "Hey, it's me. Sorry to bug you, but could you cover my shift on Sunday? I'll take your Wednesday, if that helps.",
      tts: "Hey, it's me. Sorry to bug ya, but could you cover my shift on Sunday? I'll take your Wednesday, if that helps.",
      ja: 'もしもし、私。悪いんだけど、日曜のシフト代わってくれない？そのかわり水曜は私が入るから。',
      note: 'bug＝邪魔する。cover＝代わりに入る', tags: tg(45, 'colleague', 'indirect', ['voicemail'], ['yod']), scene: 'living',
      marks: [['say', 'you', 'ya'], ['link', 'could you']] },
    asks: [['なんの でんわ？', ['シフトの こうたい', 'しごとの ミス', 'やすみの れんらく']],
      ['なんようびを たのんでいる？', ['日曜', '水曜', '土曜']],
      ['かわりに なにを する？', ['水曜に はいる', 'ランチを おごる', '日曜に はいる']]],
    chunk: ['could you cover', 'can you cover', 'would you cover'] },
  { id: 'sp-rain-later',
    line: { who: 'celeste', en: "Tomorrow will start dry, but heavy rain's expected from mid-afternoon, so if you're heading out, you'll want an umbrella.",
      tts: "Tomorrow'll start dry, but heavy rain's expected from mid-afternoon, so if you're headin' out, you'll want an umbrella.",
      ja: '明日は朝のうちは降りませんが、昼過ぎから強い雨の予報です。お出かけならかさがあるといいでしょう。',
      note: "you'll want＝〜があるといい（すすめ）", tags: tg(60, 'broadcast', 'literal', [], ['contraction', 'weak-form']), scene: 'living',
      marks: [['say', 'Tomorrow will', "tomorrow'll"], g('heading')] },
    asks: [['なんの ほうそう？', ['てんきよほう', 'こうつう じょうほう', 'ニュースの まとめ']],
      ['あめは いつから？', ['ごご なかごろ', 'あさ', 'よる']],
      ['なにを すすめている？', ['かさを もつ', 'でかけない', 'はやく かえる']]],
    chunk: ["rain's expected", 'rain was expected', 'rain is expected'] },
  { id: 'sp-exchange',
    line: { who: 'molly', en: "You can exchange it for a different size, no problem, but we can't refund it without the receipt. Sorry about that.",
      tts: "You can exchange it for a different size, no problem, but we can't refund it without the receipt. Sorry 'bout that.",
      ja: '別のサイズへの交換は問題ありませんが、レシートがないと返金はできないんです。すみません。',
      note: "can／can't は強さで聞き分け。can't は母音が長い", tags: tg(26, 'service', 'refusal', [], ['can-cant', 'weak-form']), scene: 'street',
      marks: [['link', 'exchange it'], ['stress', "can't"], ['say', 'about', "'bout"]] },
    asks: [['どこでの はなし？', ['みせの へんぴん', 'ゆうびんきょく', 'ぎんこう']],
      ['できることは？', ['サイズの こうかん', 'へんきん', 'わりびき']],
      ['へんきんに ひつような ものは？', ['レシート', 'クレジットカード', 'みぶんしょう']]],
    chunk: ['exchange it for', 'exchange them for', 'exchange it with'] }
];

// ---- the ladders as items ------------------------------------------------------------------------------------------

/** A ladder's line: level 4's item's (its Japanese without a reply's or a meaning's → part), or a new one. */
function lineOf(src: LadderSrc): Item {
  if (typeof src.line === 'string') {
    const it = BANK4.find((x) => x.id === src.line);
    if (!it) throw new Error(`kikimimi: ladder ${src.id} climbs ${src.line}, not in level 4`);
    const { choices: _, answer: __, focus: ___, ask: ____, cond: _____, ...rest } = it; // (rungs are clean: speed is the lever)
    return { ...rest, id: src.id, type: 'gist', ja: it.ja.split('→')[0].trim(), choices: [], answer: 0 };
  }
  const l = src.line, cast = CAST[l.who];
  if (!cast) throw new Error(`kikimimi: ${l.who} has no cast voice`);
  return {
    id: src.id, lv: 4, type: 'gist', en: l.en, ja: l.ja, speaker: l.who, voice: cast.slice(0, 2) as Accent, cast, choices: [], answer: 0,
    note: l.note, tags: l.tags, ...(l.tts && { tts: l.tts }), ...(l.scene && { scene: l.scene }), ...(l.marks && { marks: l.marks })
  };
}

function ladderOf(src: LadderSrc): Ladder {
  const line = lineOf(src);
  const { id: _, ...base } = line;
  const rungs = SPEEDS.map((speed, k): Item => {
    const rung = { ladder: src.id, n: k + 1, speed };
    if (k < src.asks.length) {
      const [ask, choices, type] = src.asks[k];
      return { ...base, id: `${src.id}-${k + 1}`, type: type ?? 'gist', choices, answer: 0, ask, rung };
    }
    return { ...base, id: `${src.id}-${k + 1}`, type: 'word', choices: src.chunk, answer: 0, focus: src.chunk[0], rung };
  });
  return { id: src.id, line, rungs };
}

export const LADDERS: readonly Ladder[] = LADDER_SRC.map(ladderOf);
/** Every rung (its clip id is its id). */
export const RUNG_ITEMS: readonly Item[] = LADDERS.flatMap((l) => l.rungs);

/** Every ladder's rung clips exist (the mode's gate: the lobby offers it only then; compile.ts, in the index). */
export const ladderReady = (clips: Readonly<Record<string, unknown>>): boolean => RUNG_ITEMS.every((it) => it.id in clips);
