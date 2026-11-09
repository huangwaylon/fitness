// ききみみ クイズ: dialogue items (docs/kikimimi.md "Dialogues", docs/curriculum.md "Modes" increment 4), level 4 「かわ・もり」
// (B1+ → B2). Two villagers, 2-4 lines, overheard and service talk cut from the scenario seeds (§5.5): a coffee order
// going wrong, a canceled train, a dog groomer's waitlist, a friend canceling, a coworker hinting, a contractor who
// won't commit, a tip screen, Thanksgiving. American English throughout. Two types (TOEIC Part 3 in spirit, for
// listeners who are already good):
//   `gist`: what's going on, or what will happen (its own `ask`); the distractors a detail heard but misplaced, the
//   literal reading, the opposite.
//   `next`: the best next line; the traps repeat a word or a sound, answer what wasn't asked, or take the wrong role.
// Each line is its own clip (`<id>-<n>`, bank.ts clipIds / clipItems), voiced by its villager's cast voice
// (cast.ts CAST) and played as a sequence (game.svelte.ts playSequence); `en` is shown, `tts` spoken when it differs
// (§9: reductions spelled as said, numbers written out). The item's `en` is its lines joined (the focus is in one of
// them); its `ja` the right choice's Japanese; `note` the trap (≤ 40 字).
//   No clips yet: the neural pipeline (scripts/kikimimi-audio.ts) voices them, and until every line has a clip the
// deck leaves these types out (compile.ts mixes) and にがて れんしゅう too.
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Item } from './bank.ts';
import { dialogueOf, line, tg, type DialogueRow } from './content/build.ts';
import { MARKS, staged } from './staging.ts';

type L = readonly [who: RosterId, en: string, ja: string, tts?: string];
type Help = { cja?: readonly string[]; why?: string; ctx?: string };
/** The Japanese help (bank.ts Item cja, why, ctx), the absent ones left out. */
const help = (h: Help): Help => ({ ...(h.cja && { cja: h.cja }), ...(h.why && { why: h.why }), ...(h.ctx && { ctx: h.ctx }) });
/** A dialogue (a gist's `ask` its question in Japanese; a `next` asks NEXT_ASK). */
interface Row extends DialogueRow, Help {
  lines: readonly L[];
}

/** A dialogue, each line's sound marks by its clip id (`<item>-<n>`). */
const item = (r: Row): Item => {
  const lines = r.lines.map(([who, en, ja, tts], n) => line([who, en, ja, tts, MARKS[`${r.id}-${n + 1}`]]));
  return { ...dialogueOf(4, r, lines), ...help(r), ...staged(r.id) };
};

const ROWS: readonly Row[] = [
  {
    id: 'd4-oat-latte', type: 'next', focus: 'Let me remake it',
    lines: [
      ['rosie', 'Iced caramel macchiato for... Dawn?', 'アイスキャラメルマキアートの、ドーンさん？'],
      ['dom', "Uh, I think that's mine, but I asked for it hot.", 'たぶん僕のですけど、ホットで頼みました。'],
      ['rosie', "Oh, shoot. Sorry about that. Let me remake it for you, it'll just be a minute.", 'あっ、すみません。作り直しますね、少々お待ちください。',
        "Oh, shoot. Sorry about that. Lemme remake it for ya, it'll just be a minute."]
    ],
    choices: ["No problem, I've got a minute.", "Sorry, I'll make it again for you.", "Yes, it's the caramel one, for Dawn."],
    ja: '大丈夫です、時間はあるので。', note: 'lemme＝let me。作り直すのは店員の方',
    cja: ['大丈夫です、時間はあるので。', 'すみません、作り直しますね。', 'はい、ドーンさんのキャラメルのです。'],
    why: '店員が「作り直します」と言ったので、客は「時間はあります」と気づかいを返すのが自然。作り直すのは店員なので、客が謝るのは役割が逆です。',
    ctx: 'カフェで、店員が名前を呼んで飲み物を出しています',
    tags: tg(51, 'service', 'formula', ['cafe'], ['lemme'])
  },
  {
    id: 'd4-train-cancelled', type: 'gist', ask: '男性は このあと どうする？', focus: 'shuttle bus',
    lines: [
      ['raymond', 'Excuse me, is the 8:40 to Philadelphia still running?', 'すみません、8時40分のフィラデルフィア行きはまだ動いていますか？',
        'Excuse me, is the eight forty to Philadelphia still running?'],
      ['mabel', "It's been canceled, I'm afraid. There's a signal problem outside Trenton.", 'あいにく運休です。トレントンの手前で信号トラブルがありまして。'],
      ['raymond', 'Great. So how do I get there?', 'そりゃ最高だね。じゃあ、どうやって行けば？'],
      ['mabel', "Your best bet's the shuttle bus. It leaves from out front, by the taxi stand.", 'シャトルバスがいちばんです。正面のタクシー乗り場の横から出ます。']
    ],
    choices: ["He'll take the shuttle bus out front.", "He'll wait for the next train to Philadelphia.", "He'll take a taxi to Philadelphia."],
    ja: '正面からシャトルバスに乗る。', note: 'Great は皮肉。taxi stand は乗り場の場所',
    cja: ['正面からシャトルバスに乗る。', '次のフィラデルフィア行きの電車を待つ。', 'フィラデルフィアまでタクシーで行く。'],
    why: '電車は運休なので、駅員は正面から出るシャトルバスを勧めています。タクシー乗り場はバス乗り場の目印にすぎません。Great は皮肉です。',
    ctx: '駅の窓口で、男性が駅員に尋ねています',
    tags: tg(5, 'service', 'sarcasm', ['station'], ['contraction'])
  },
  {
    id: 'd4-receptionist', type: 'gist', ask: '男性について 正しいのは？', focus: 'waitlist',
    lines: [
      ['julian', 'Hi, I was hoping to get my dog groomed sometime this week.', '今週どこかで、うちの犬のトリミングをお願いしたいんですが。'],
      ['merengue', "We're booked solid till the 20th, but I could put you on our waitlist.", '20日まで予約でいっぱいですが、キャンセル待ちにお入れできますよ。',
        "We're booked solid till the twentieth, but I could put you on our waitlist."],
      ['julian', 'Okay, sure. And if nothing opens up?', 'じゃあお願いします。もし空きが出なかったら？'],
      ['merengue', "Then it's the 20th at ten after nine. Fair warning, he'll come home in a bandana.", 'その場合は20日の9時10分です。ちなみに、バンダナを巻いて帰ってきますよ。',
        "Then it's the twentieth at ten after nine. Fair warning, he'll come home in a bandana."]
    ],
    choices: ['His dog might get in sooner if someone cancels.', 'His dog is booked for ten after nine this week.', 'He has to call back on the 20th.'],
    ja: 'キャンセルが出れば、もっと早く予約が取れるかもしれない。', note: 'waitlist＝キャンセル待ち。20日は空きが出なかった場合',
    cja: ['キャンセルが出れば、もっと早く予約が取れるかもしれない。', '今週の9時10分に予約が取れた。', '20日に電話をかけ直さないといけない。'],
    why: 'waitlist は「キャンセル待ち」。空きが出れば早まり、出なければ20日の9時10分になります。今週の予約は取れていません。',
    ctx: '男性がペットサロンに電話で予約しています',
    tags: tg(16, 'service', 'literal', ['phone'], ['numbers'])
  },
  {
    id: 'd4-friend-cancels', type: 'next', focus: 'wiped out',
    lines: [
      ['maple', "Hey, so... about tonight. I'm really sorry, but I'm totally wiped out.", 'ねえ、今夜のことなんだけど…本当にごめん、もうクタクタで。'],
      ['audie', 'Oh no, long day?', 'あら、大変な一日だった？'],
      ['maple', 'The worst. Can we do Saturday instead? My treat.', '最悪だった。代わりに土曜日にしない？ おごるから。']
    ],
    choices: ["Sure, Saturday's good. Rest up!", 'Thanks, but I already ate tonight.', "Oh, I'm not tired at all, actually."],
    ja: 'いいよ、土曜で大丈夫。ゆっくり休んで！', note: 'wiped out＝へとへと。My treat＝おごるよ',
    cja: ['いいよ、土曜で大丈夫。ゆっくり休んで！', 'ありがとう、でも今夜はもう食べたよ。', 'あ、実は全然疲れてないよ。'],
    why: 'wiped out は「くたくた」。疲れたので土曜にしようという提案には、了解して相手を気づかうのが自然です。My treat（おごる）を今夜の食事の話と取るのは罠。',
    ctx: '今夜会う予定の友達から電話です',
    tags: tg(49, 'friend', 'refusal', ['phone'], ['ellipsis'])
  },
  {
    id: 'd4-meeting-room', type: 'gist', ask: '女性が 本当に 言いたいことは？', focus: 'the only room with a screen',
    lines: [
      ['molly', 'Are you using the meeting room at three?', '3時に会議室使う？'],
      ['kid-cat', "Yeah, why? What's up?", 'うん、なんで？ どうかした？'],
      ['molly', "No reason. It's just that the client moved our call to three, and it's the only room with a screen.",
        '別に。ただ、クライアントが電話会議を3時にずらして、画面があるのはあの部屋だけなんだよね。']
    ],
    choices: ['She wants the room at three.', 'She wants to join his meeting at three.', "She's asking him to move the client call."],
    ja: '3時にその部屋を使いたい。', note: "No reason. It's just that…＝遠回しなお願いの定番",
    cja: ['3時にその部屋を使いたい。', '3時の彼の会議に参加したい。', 'クライアントとの電話を動かしてほしい。'],
    why: '「別に。ただ…」と事情だけ話すのは、遠回しなお願いの定番。画面のある部屋が3時に必要なので、譲ってほしいのです。電話を動かしたのはクライアントです。',
    ctx: 'オフィスで、同僚が話しかけてきました',
    tags: tg(42, 'colleague', 'indirect')
  },
  {
    id: 'd4-wrong-dish', type: 'next', focus: 'Would the BLT work?',
    lines: [
      ['coco', "Here's your patty melt, enjoy!", 'パティメルトです、どうぞ！'],
      ['sherb', "Sorry, I think there's been a mix-up. I ordered the club sandwich.", 'すみません、手違いがあるみたいです。クラブサンドを頼んだんですが。'],
      ['coco', "Oh, my bad! We're out of turkey, though. Would the BLT work?", 'あら、ごめんなさい！でもターキーを切らしてて。BLTでもいいですか？']
    ],
    choices: ["Yeah, that'd be fine, thanks.", 'No, I ordered the patty melt.', "Sure, I'll pay for both."],
    ja: 'ええ、それで大丈夫です。ありがとう。', note: 'Would ~ work?＝〜でもいい？ my bad＝ごめん',
    cja: ['ええ、それで大丈夫です。ありがとう。', 'いいえ、パティメルトを頼みました。', 'いいですよ、両方払います。'],
    why: 'Would the BLT work? は「BLTでもいいですか？」という代案。受け入れるのが自然です。客が頼んだのはクラブサンドで、パティメルトは間違って来た料理です。',
    ctx: 'ダイナーで、店員が料理を運んできました',
    tags: tg(27, 'service', 'literal', ['cafe'], ['contraction'])
  },
  {
    id: 'd4-landlord', type: 'gist', ask: '修理について わかることは？', focus: 'once the lumber comes in',
    lines: [
      ['bunnie', "Hi, it's Bunnie on Oak Street. The steps on the deck are wobbly again.", 'オーク通りのバニーです。デッキの階段がまたグラグラしてて。'],
      ['tom-nook', 'Ah. Well, they should be fine for now. Just take it slow on the way down.', 'ああ。まあ、今のところ大丈夫でしょう。降りるときはゆっくりね。'],
      ['bunnie', "That's what you said in May.", '5月にもそう言いましたよね。'],
      ['tom-nook', "Right, right. I'll, uh, have my guy call you once the lumber comes in.", 'そうでしたね。材木が入りしだい、うちの職人から電話させます。']
    ],
    choices: ['It depends on when the lumber comes in.', 'A carpenter will be there tomorrow to fix the deck.', 'She has to fix the steps herself.'],
    ja: '材木がいつ入るかしだい。', note: 'once ～ comes in＝入荷しだい。日時は未定のまま',
    cja: ['材木がいつ入るかしだい。', '明日、大工さんがデッキを直しに来る。', '彼女が自分で階段を直さないといけない。'],
    why: 'once the lumber comes in は「材木が入りしだい」。いつ入るかは言っていないので、日時は未定です。5月にも同じことを言っていて、大家ははぐらかしています。',
    ctx: '借家の住人が、大家さんに電話しています',
    tags: tg(31, 'service', 'hedge', ['phone'])
  },
  {
    id: 'd4-neighbour-party', type: 'next', focus: 'up till two',
    lines: [
      ['ankha', 'Hey! Sorry to bother you. Sounded like a fun party on Saturday.', 'こんにちは！お邪魔してごめんなさい。土曜日は楽しそうなパーティーでしたね。'],
      ['apollo', "Oh, thanks! Hope it wasn't too loud.", 'ああ、どうも！うるさくなかったならいいけど。'],
      ['ankha', 'Well... the baby was up till two, to be honest.', 'まあ…正直、赤ちゃんが2時まで起きてて。']
    ],
    choices: ["Oh no, sorry! We'll keep it down.", 'Great, so you enjoyed the party too?', 'Two? I thought the party ended at one.'],
    ja: 'うわ、ごめんなさい！静かにします。', note: 'fun party は前置き。本題は赤ちゃんが眠れなかったこと',
    cja: ['うわ、ごめんなさい！ 静かにします。', 'よかった、じゃああなたも楽しんだんですね？', '2時？ パーティーは1時に終わったと思ってたけど。'],
    why: '「楽しそうでしたね」は前置きで、本題は「赤ちゃんが2時まで寝られなかった」という苦情。謝って、静かにすると約束するのが正解です。時刻を言い返すのは失礼。',
    ctx: '週明け、隣の人が玄関を訪ねてきました',
    tags: tg(32, 'neighbour', 'indirect')
  },
  {
    id: 'd4-gate-change', type: 'gist', ask: '男性の 乗り継ぎは どうなりそう？', focus: 'You should be fine',
    lines: [
      ['roald', 'Is this the gate for Seattle?', 'シアトル行きのゲートはここですか？'],
      ['whitney', "It was, but it's moved to 52. And there's a forty-minute delay.", 'そうでしたが、52番に変わりました。それと40分遅れています。', "It was, but it's moved to fifty-two. And there's a forty-minute delay."],
      ['roald', "Forty? I've got a connection at six-thirty.", '40分？ 6時半に乗り継ぎがあるんですが。'],
      ['whitney', "You should be fine. They're holding it for everyone on this flight.", '大丈夫だと思いますよ。この便の乗客を待ってくれますから。']
    ],
    choices: ["He'll probably still make his connection.", "He'll miss it and need a new ticket.", "He'll be put on a later connection."],
    ja: 'たぶん乗り継ぎに間に合う。', note: 'should be fine＝たぶん大丈夫。holding＝出発を待つ',
    cja: ['たぶん乗り継ぎに間に合う。', '乗り遅れて、新しい航空券が必要になる。', '後の乗り継ぎ便に変更される。'],
    why: 'You should be fine は「たぶん大丈夫」。乗り継ぎ便がこの便の乗客を待ってくれる（holding）ので、間に合いそうです。40分の遅れだけで判断するのは罠。',
    ctx: '空港の搭乗口で、男性が係員に尋ねています',
    tags: tg(8, 'service', 'literal', ['desk'], ['teen-ty', 'clock'])
  },
  {
    id: 'd4-squat-form', type: 'next', focus: 'sitting back',
    lines: [
      ['dom', 'Okay, ten more squats. Keep your chest up!', 'よし、スクワットあと10回。胸を張って！'],
      ['goldie', 'Like this? Is that right?', 'こう？ これで合ってる？'],
      ['dom', "Almost. You're kind of leaning forward. Try sitting back, like there's a chair behind you.", 'おしい。ちょっと前に倒れてる。後ろに椅子があるつもりで、腰を引いてみて。',
        "Almost. You're kinda leaning forward. Try sittin' back, like there's a chair behind ya."]
    ],
    choices: ['Oh, sitting back feels better on my knees.', "Thanks, I'll go grab a chair from the back room.", 'Sure, ten more minutes, then.'],
    ja: 'あ、腰を引くとひざが楽になった。', note: "like there's a chair＝椅子があるつもりで。本物は使わない",
    cja: ['あ、腰を引くとひざが楽になった。', 'ありがとう、奥の部屋から椅子を持ってくるね。', 'いいよ、じゃああと10分ね。'],
    why: 'like there\'s a chair は「椅子があるつもりで」というたとえ。言われたとおり腰を引き、楽になったと返すのが自然です。本物の椅子は使わず、10は分ではなく回数です。',
    ctx: 'ジムで、トレーナーがスクワットを見ています',
    tags: tg(17, 'friend', 'literal', [], ['kinda'])
  },
  {
    id: 'd4-parcel', type: 'gist', ask: '荷物は どうなる？', focus: 'I can take it',
    lines: [
      ['redd', "Package for 12B? No one's answering.", '12B号室宛ての荷物なんですが、誰も出なくて。', "Package for twelve B? No one's answering."],
      ['diana', "Oh, they're away till Friday. I can take it if you want.", 'ああ、金曜まで留守ですよ。よかったら預かりますけど。'],
      ['redd', "Thanks. Just sign here, and I'll leave a note on their door.", 'どうも。ここにサインを。お隣のドアにメモを残しておきます。', "Thanks. Just sign here, an' I'll leave a note on their door."]
    ],
    choices: ['The neighbor keeps it until Friday.', 'The driver takes it back to the warehouse.', "It's left outside 12B."],
    ja: '隣の人が金曜まで預かる。', note: 'I can take it＝預かれる。leave a note＝メモを残す',
    cja: ['隣の人が金曜まで預かる。', '配達員が倉庫に持ち帰る。', '宛先の部屋の前に置いていく。'],
    why: 'I can take it は「私が預かれます」。隣の人がサインして受け取り、配達員は留守の部屋のドアにメモを残します。ドアに置くのはメモで、荷物ではありません。',
    ctx: 'マンションの廊下で、配達員が隣人に声をかけました',
    tags: tg(37, 'service', 'literal', [], ['weak-form'])
  },
  {
    id: 'd4-store-credit', type: 'next', focus: 'store credit',
    lines: [
      ['stitches', "Hi, I'd like to return these headphones. They stopped working after a week.", 'このヘッドホンを返品したいんです。1週間で動かなくなって。'],
      ['audie', 'Do you have the receipt?', 'レシートはお持ちですか？'],
      ['stitches', 'Uh, no, it was a gift.', 'いや、プレゼントでもらったので。'],
      ['audie', "Then I'm afraid all I can offer is store credit.", 'それでしたら、あいにく店内クレジットでのご対応のみになります。']
    ],
    choices: ["That's fine. Does it work online too?", "Great, I'll take cash, then.", "No thanks, I've got a receipt here."],
    ja: 'それでいいです。オンラインでも使えますか？', note: 'store credit＝店で使える金券。現金は戻らない',
    cja: ['それでいいです。オンラインでも使えますか？', 'よかった、じゃあ現金でもらいます。', 'いえ、レシートならここにあります。'],
    why: 'store credit はその店でだけ使える返金分で、現金は戻りません。受け入れて使い道を聞くのが自然です。レシートはないと言ったばかりなので、三つ目は矛盾します。',
    ctx: '家電店のカウンターで、客が返品を頼んでいます',
    tags: tg(26, 'service', 'refusal')
  },
  {
    id: 'd4-taxi-street', type: 'gist', ask: 'なにが おきた？', focus: 'Sorry, Street',
    lines: [
      ['cherry', 'Could you take me to Lincoln Street, please?', 'リンカーン・ストリートまでお願いします。'],
      ['kappn', 'Lincoln Avenue? You got it.', 'リンカーン・アベニューね、了解。'],
      ['cherry', 'Sorry, Street. Lincoln Street, by the park.', 'すみません、ストリートです。公園のそばのリンカーン・ストリート。'],
      ['kappn', 'Oh, gotcha. Totally different direction. Good thing you said something.', 'あー、了解。全然逆方向だ。言ってくれてよかった。', 'Oh, gotcha. Totally different direction. Good thing ya said something.']
    ],
    choices: ['The driver nearly went to the wrong Lincoln.', "The driver didn't know where the park was.", 'The passenger changed where she was going.'],
    ja: '運転手が違うリンカーンへ行くところだった。', note: 'Street と Avenue の聞き違いを直しただけ。行き先は同じ',
    cja: ['運転手が違うリンカーンへ行くところだった。', '運転手は公園の場所を知らなかった。', '乗客が行き先を変えた。'],
    why: '運転手が Street を Avenue と聞き違え、乗客がすぐ訂正しました。行き先は最初から同じなので、変えたわけではありません。「言ってくれてよかった」が決め手です。',
    ctx: 'タクシーに乗った女性が、行き先を告げます',
    tags: tg(4, 'service', 'literal', [], ['contrast'])
  },
  {
    id: 'd4-grab-lunch', type: 'next', focus: 'grab lunch',
    lines: [
      ['orville', 'Hey, how was your weekend?', 'やあ、週末どうだった？'],
      ['rosie', 'Good, thanks! Pretty quiet. We finally tried that ramen place on Fifth.', 'よかったよ！ のんびりしてた。5番街のラーメン屋にやっと行ってきた。'],
      ['orville', 'Oh, nice! We should grab lunch there sometime.', 'いいね！ 今度そこでランチしようよ。']
    ],
    choices: ["Totally! Let's grab lunch there soon.", 'Sorry, I already had lunch today.', 'On Fifth? No, I took the train.'],
    ja: 'いいね！近いうちにそこでランチしよう。', note: 'grab lunch sometime＝社交辞令のことも。軽く乗るのが自然',
    cja: ['いいね！ 近いうちにそこでランチしよう。', 'ごめん、今日はもうお昼食べちゃった。', '5番街？ いや、電車で行ったよ。'],
    why: 'grab lunch sometime は「今度ランチしよう」という軽い誘いで、社交辞令のことも。気軽に乗るのが自然です。sometime なので今日のお昼の話ではありません。',
    ctx: '月曜の朝、職場で同僚と雑談しています',
    tags: tg(38, 'colleague', 'ritual', [], ['weak-form'])
  },
  {
    id: 'd4-video-call', type: 'gist', ask: '音の 問題は どう なおった？', focus: 'turn your video off',
    lines: [
      ['julian', 'Morning, everyone. Can you all hear me?', 'おはようございます。みなさん聞こえますか？'],
      ['mabel', "We can, but you're breaking up a bit. Maybe turn your video off?", '聞こえるけど、ちょっと途切れてる。ビデオ切ってみたら？'],
      ['julian', 'Is that better?', 'これでどう？'],
      ['mabel', "Much. Oh, and Sam, you're on mute.", 'だいぶ良くなった。あ、サム、ミュートになってるよ。']
    ],
    choices: ['He switched his camera off.', 'He unmuted himself.', 'He called back on the phone.'],
    ja: 'カメラを切った。', note: 'breaking up＝音が途切れる。ミュートなのは別の人',
    cja: ['カメラを切った。', 'ミュートを解除した。', '電話でかけ直した。'],
    why: 'breaking up は「音声が途切れる」。ビデオを切ったら「だいぶ良くなった（Much）」と言われています。ミュートになっているのは別の人、サムです。',
    ctx: 'オンライン会議が始まったところです',
    tags: tg(39, 'colleague', 'literal', ['video'])
  },
  {
    id: 'd4-pizza-diet', type: 'gist', ask: '女性の 本音は？', focus: 'trying to be good',
    lines: [
      ['bunnie', "There's a new pizza place opening Friday. Want to go?", '金曜に新しいピザ屋がオープンするの。行かない？', "There's a new pizza place opening Friday. Wanna go?"],
      ['molly', "Ooh, Friday... I'd love to, but I'm kind of trying to be good this month.", 'わあ、金曜か…行きたいけど、今月はちょっと節制しようとしてて。',
        "Ooh, Friday... I'd love to, but I'm kinda tryin' to be good this month."],
      ['bunnie', 'They do salads too!', 'サラダもあるよ！'],
      ['molly', 'Hmm. Let me check my calendar and get back to you.', 'うーん。予定見て、また連絡するね。']
    ],
    choices: ["She'd rather skip the pizza.", "She'll go if there are salads.", "She has plans on Friday, so she can't go."],
    ja: '本当はピザに行きたくない。', note: 'be good＝節制中。get back to you はここでは遠回しな断り',
    cja: ['本当はピザに行きたくない。', 'サラダがあるなら行く。', '金曜は予定があるので行けない。'],
    why: 'trying to be good は「節制中」。サラダもあると言われても「予定を見て連絡する」とかわすのは、遠回しな断りです。忙しいとは一言も言っていません。',
    ctx: '友達が、新しいピザ屋に誘っています',
    tags: tg(18, 'friend', 'refusal', [], ['wanna', 'kinda'])
  },
  {
    id: 'd4-cough-drive', type: 'next', focus: 'two coats',
    lines: [
      ['raymond', "Do you have a paint that'll cover dark red? We're going white.", '濃い赤の上から塗れるペンキはありますか？ 白にしたいんです。'],
      ['diana', 'This one covers well, but it takes two coats. Are you doing it this weekend?', 'これはよく隠れますが、2度塗りが必要です。今週末に塗るんですか？'],
      ['raymond', "Yeah, my in-laws are staying with us on Sunday, actually.", 'ええ、実は日曜に妻の両親が泊まりに来るんです。']
    ],
    choices: ['Then try this one. It only needs one coat.', 'Great, it takes about two weeks to dry.', 'Sure, I can come paint it white for you on Sunday.'],
    ja: 'それならこちらを。1回塗りで済みます。', note: 'coat＝塗る回数。時間がないので1回で済む品を勧める',
    cja: ['それならこちらを。1回塗りで済みます。', 'よかった、乾くのに2週間ほどかかります。', 'いいですよ、日曜に私が白く塗りに行きます。'],
    why: '日曜に義理の両親が泊まりに来るので、時間がありません。2度塗りの品より、1回で済む品を勧めるのが自然です。coat は「塗りの回数」。店員が塗るわけではありません。',
    ctx: 'ホームセンターで、男性がペンキを探しています',
    tags: tg(31, 'service', 'literal')
  },
  {
    id: 'd4-installer', type: 'gist', ask: '火曜に 犬の 散歩を するのは？', focus: 'covers for me',
    lines: [
      ['pietro', "So, I can walk Max at noon on weekdays, but I've got class on Tuesdays.", '平日の正午ならマックスの散歩に行けますけど、火曜は授業があるんです。'],
      ['audie', "Tuesdays? That's my late night at the office.", '火曜？ ちょうど私が遅くまで会社にいる日だ。'],
      ['pietro', "My sister covers for me. She's great with dogs, just kind of chatty.", '妹が代わりに行きます。犬の扱いはうまいんです、ちょっとおしゃべりなだけで。',
        "My sister covers for me. She's great with dogs, just kinda chatty."],
      ['audie', 'Ha, okay. As long as Max gets his walk.', 'はは、了解。マックスが散歩できるならそれでいい。']
    ],
    choices: ["The dog walker's sister.", 'The woman herself.', 'Nobody. Max stays home.'],
    ja: '散歩代行の人の妹。', note: 'cover for＝代わりにやる。chatty＝おしゃべり',
    cja: ['散歩代行の人の妹。', '女性本人。', '誰も行かない。マックスは留守番。'],
    why: '火曜は散歩代行の人も飼い主も都合が悪いのですが、My sister covers for me（妹が代わりに行く）と言っています。cover for は「代わりを務める」です。',
    ctx: '飼い主が、犬の散歩代行の人と電話で話しています',
    tags: tg(37, 'service', 'literal', ['phone'], ['kinda'])
  },
  {
    id: 'd4-service-charge', type: 'next', focus: "hit 'No tip'",
    lines: [
      ['punchy', "Hang on, the tablet's asking for a 15% tip. For one muffin?", '待って、タブレットが15％のチップを求めてる。マフィン1個で？', "Hang on, the tablet's asking for a fifteen percent tip. For one muffin?"],
      ['coco', 'Yeah, everywhere does that now. Even the self-checkout!', 'うん、今はどこもそう。セルフレジでさえ！'],
      ['punchy', "So is it rude if I just hit 'No tip'?", 'じゃあ「チップなし」を押したら失礼かな？']
    ],
    choices: ["Not for one muffin. It's up to you.", 'No, one muffin is plenty for me, thanks.', "Fifty percent? That's crazy for a muffin!"],
    ja: 'マフィン1個なら失礼じゃないよ。君しだい。', note: 'カウンター注文のチップは任意。fifteen と fifty にも注意',
    cja: ['マフィン1個なら失礼じゃないよ。君しだい。', 'ううん、マフィンは1個で十分だよ。', '50％？ マフィンにそれはありえない！'],
    why: '「チップなしは失礼？」への答え。カウンターでマフィン1個なら、チップは任意で「君しだい」が自然。fifteen（15）と fifty（50）の聞き違い、マフィンの数の話は罠。',
    ctx: 'カフェのレジで、友達同士が話しています',
    tags: tg(27, 'friend', 'literal', ['cafe'], ['teen-ty'])
  },
  {
    id: 'd4-misheard-name', type: 'next', focus: 'empty-handed',
    lines: [
      ['kid-cat', 'So what should I bring to Thanksgiving? Wine? Flowers?', '感謝祭には何を持っていけばいい？ワイン？花？'],
      ['goldie', "Honestly, just bring yourself. My mom's been cooking since Tuesday.", '正直、手ぶらでいいよ。母が火曜から料理してるから。'],
      ['kid-cat', "Come on, I can't show up empty-handed.", 'そんな、手ぶらで行けないよ。']
    ],
    choices: ["Okay, bring a pie. Pumpkin's safe.", 'Sure, my mom cooks every Tuesday.', "No thanks, I'm really not hungry yet."],
    ja: 'じゃあ、パイを持ってきて。パンプキンなら間違いない。', note: 'empty-handed＝手ぶら。手土産を持っていきたい',
    cja: ['じゃあ、パイを持ってきて。パンプキンなら間違いない。', 'うん、母は毎週火曜に料理するよ。', 'いや、まだ本当にお腹すいてないから。'],
    why: 'can\'t show up empty-handed は「手ぶらでは行けない」。持っていきたい相手には、手頃な手土産を勧めるのが自然。火曜は料理を始めた日で、毎週ではありません。',
    ctx: '感謝祭に招かれた友達が、手土産の相談をしています',
    tags: tg(48, 'friend', 'ritual')
  },
  {
    id: 'd4-im-easy', type: 'next', focus: "I'm easy",
    lines: [
      ['apollo', 'What do you want to do this weekend?', '週末、何したい？', 'Whaddaya wanna do this weekend?'],
      ['ankha', "Oh, I'm easy. Whatever you want.", 'なんでもいいよ。あなたの好きなので。'],
      ['apollo', 'Great. How about the ballgame on Saturday, then?', 'よし。じゃあ土曜は野球観戦は？'],
      ['ankha', 'Hmm... we went to a game last weekend.', 'うーん…先週も試合に行ったよね。']
    ],
    choices: ['Fair enough. You pick this weekend, then.', 'Awesome, so Saturday it is.', 'Last weekend? No, it was the one before.'],
    ja: 'それもそうだね。じゃあ今週末は君が選んで。', note: "I'm easy＝なんでもいい。でも本音は別",
    cja: ['それもそうだね。じゃあ今週末は君が選んで。', 'よし、じゃあ土曜で決まり。', '先週？ いや、その前の週だよ。'],
    why: 'I\'m easy（なんでもいい）と言いつつ、「先週も試合に行ったよね」は遠回しな反対。くみ取って相手に選んでもらうのが自然です。決めてしまうのも、日付の訂正も的外れ。',
    ctx: 'カップルが、週末の予定を話しています',
    tags: tg(36, 'partner', 'indirect', [], ['wanna'])
  },
  {
    id: 'd4-hotel-suite', type: 'gist', ask: '男性が 知りたいことは？', focus: 'small fee',
    lines: [
      ['merengue', "Your room won't be ready till three, I'm afraid.", '申し訳ありませんが、お部屋は3時までご用意できません。'],
      ['blathers', "Ah. My meeting's at two, so I was hoping to change first.", 'ああ。2時に会議があって、先に着替えたかったんですが。'],
      ['merengue', 'We do have a suite available now, for a small fee.', '少々の追加料金で、今すぐご利用いただけるスイートもございます。'],
      ['blathers', 'How small are we talking?', '少しって、どのくらいです？']
    ],
    choices: ["How much the suite's 'small fee' really is.", 'Whether the hotel has a free meeting room.', 'What time his room will be ready.'],
    ja: 'スイートの「少々の追加料金」が実際いくらか。', note: 'for a small fee＝有料。How small…?＝いくら？',
    cja: ['スイートの「少々の追加料金」が実際いくらか。', 'ホテルに空いている会議室があるか。', '部屋が何時に用意できるか。'],
    why: 'How small are we talking? は「少しって、いくら？」と金額を聞く決まり文句。部屋は3時とすでに聞いています。会議は彼の予定で、会議室の話ではありません。',
    ctx: 'ホテルのフロントで、男性がチェックインしています',
    tags: tg(3, 'service', 'hedge', ['desk'])
  },
  {
    id: 'd4-bank-scam', type: 'gist', ask: '男性は このあと どうする？', focus: 'call the number on the back of my card',
    lines: [
      ['redd', "Hi, this is Mark from your bank's fraud team. We've blocked a suspicious payment.", '銀行の不正対策チームのマークです。不審な支払いをブロックしました。'],
      ['raymond', 'Oh. Which payment?', 'えっ。どの支払いですか？'],
      ['redd', "I'll explain in a sec. First, just read me the code we texted you, to confirm it's you.", 'すぐご説明します。まず本人確認のため、送ったコードを読み上げてください。'],
      ['raymond', "Hang on. I'll call the number on the back of my card.", '待ってください。カードの裏の番号にかけ直します。']
    ],
    choices: ['Call the bank back himself.', 'Read out the code he was sent.', 'Ask which payment was blocked.'],
    ja: '自分で銀行にかけ直す。', note: 'コードを聞き出す「銀行」は詐欺のサイン。自分でかけ直す',
    cja: ['自分で銀行にかけ直す。', '送られてきたコードを読み上げる。', 'どの支払いが止められたか聞く。'],
    why: '送ったコードを読み上げさせる「銀行員」は詐欺の典型。男性は「カードの裏の番号にかけ直す」と言い、自分で確かめます。どの支払いかは聞いたものの、はぐらかされました。',
    ctx: '男性の携帯に、銀行を名乗る電話がかかってきました',
    tags: tg(23, 'stranger', 'deception', ['phone'])
  },
  {
    id: 'd4-ferry-off', type: 'next', focus: 'called off',
    lines: [
      ['cherry', "Is the four o'clock ferry still going? It's pretty windy out there.", '4時のフェリーはまだ出ますか？ 外かなり風が強いですけど。'],
      ['wilbur', "Afraid not, it's been called off. The next one's at six, weather permitting.", '残念ながら欠航です。次は6時、天候次第ですね。'],
      ['cherry', "And if that one's canceled too?", 'それも欠航になったら？']
    ],
    choices: ["Then we'll put you up in a hotel.", "Yes, the next one's at six, weather permitting.", "Don't worry, the wind's from the west."],
    ja: 'その場合は、ホテルをご用意します。', note: 'called off＝中止。put you up＝泊める',
    cja: ['その場合は、ホテルをご用意します。', 'はい、次は6時です。天候次第ですが。', 'ご心配なく、風は西から吹いています。'],
    why: '「それも欠航したら？」には、その場合の対応を答えます。put you up は「泊める」。6時の便のことはもう言ったので、繰り返しても答えになりません。',
    ctx: 'フェリー乗り場で、女性が係員に尋ねています',
    tags: tg(11, 'service', 'literal')
  }
];

/** The dialogue items (level 4). */
export const DIALOGUES: readonly Item[] = ROWS.map(item);
