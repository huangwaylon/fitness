// ききみみ クイズ: dialogue items (docs/kikimimi.md "Dialogues", docs/curriculum.md §14 increment 4), level 4 「かわ・もり」
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
/** A dialogue (a gist's `ask` its question in Japanese; a `next` asks NEXT_ASK). */
interface Row extends DialogueRow {
  lines: readonly L[];
}

/** A dialogue, each line's sound marks by its clip id (`<item>-<n>`). */
const item = (r: Row): Item => {
  const lines = r.lines.map(([who, en, ja, tts], n) => line([who, en, ja, tts, MARKS[`${r.id}-${n + 1}`]]));
  return { ...dialogueOf(4, r, lines), ...staged(r.id) };
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
    choices: ["No problem, I'm not in a rush.", "Sorry, I'll make it again.", "Yes, it's an iced one."],
    ja: '大丈夫です、急いでないので。', note: 'lemme＝let me。作り直すのは店員の方',
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
    choices: ["He'll take a bus from outside the station.", "He'll wait for the 8:40 train.", "He'll take a taxi to Philadelphia."],
    ja: '駅の外からバスに乗る。', note: 'Great は皮肉。taxi stand は乗り場の場所',
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
    tags: tg(16, 'service', 'literal', ['phone'], ['numbers'])
  },
  {
    id: 'd4-friend-cancels', type: 'next', focus: 'wiped out',
    lines: [
      ['maple', "Hey, so... about tonight. I'm really sorry, but I'm totally wiped out.", 'ねえ、今夜のことなんだけど…本当にごめん、もうクタクタで。'],
      ['audie', 'Oh no, long day?', 'あら、大変な一日だった？'],
      ['maple', 'The worst. Can we do Saturday instead? My treat.', '最悪だった。代わりに土曜日にしない？ おごるから。']
    ],
    choices: ['Sure, Saturday works. Get some rest!', 'Thanks, but I already ate tonight.', "No, I'm not tired at all."],
    ja: 'いいよ、土曜で大丈夫。ゆっくり休んで！', note: 'wiped out＝へとへと。My treat＝おごるよ',
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
    choices: ["She'd like him to let her have the room.", 'She wants to join his meeting at three.', "She's asking him to move the client call."],
    ja: '部屋を使わせてほしい。', note: "No reason. It's just that…＝遠回しなお願いの定番",
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
    choices: ["There's no fixed time for the repair yet.", 'A carpenter is coming tomorrow.', 'She has to fix the steps herself.'],
    ja: '修理の日時はまだ決まっていない。', note: 'once ～ comes in＝入荷しだい。日時は未定のまま',
    tags: tg(31, 'service', 'hedge', ['phone'])
  },
  {
    id: 'd4-neighbour-party', type: 'next', focus: 'up till two',
    lines: [
      ['ankha', 'Hey! Sorry to bother you. Sounded like a fun party Saturday, by the way.', 'こんにちは！お邪魔してごめんなさい。ところで土曜日は楽しそうなパーティーでしたね。'],
      ['apollo', "Oh, thanks! Hope it wasn't too loud.", 'ああ、どうも！うるさくなかったならいいけど。'],
      ['ankha', 'Well... the baby was up till two, to be honest.', 'まあ…正直、赤ちゃんが2時まで起きてて。']
    ],
    choices: ["Oh no, I'm so sorry. We'll keep it down next time.", 'Great, so you enjoyed the party too?', 'Two? I thought it ended at one.'],
    ja: 'うわ、本当にすみません。次は静かにします。', note: 'fun party は前置き。本題は赤ちゃんが眠れなかったこと',
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
    choices: ["He'll probably still make it.", "He'll miss it and need a new ticket.", "He'll be put on a later connection."],
    ja: 'たぶん間に合う。', note: 'should be fine＝たぶん大丈夫。holding＝出発を待つ',
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
    choices: ['Oh, that feels much better on my knees.', "Thanks, I'll grab a chair.", 'Sure, ten more minutes.'],
    ja: 'あ、ひざがずっと楽になった。', note: "like there's a chair＝椅子があるつもりで。本物は使わない",
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
    choices: ["That's fine. Can I use it online as well?", "Great, I'll take the cash, then.", 'No thanks, I already have a receipt.'],
    ja: 'それでいいです。オンラインでも使えますか？', note: 'store credit＝店で使える金券。現金は戻らない',
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
    choices: ['The driver nearly went to the wrong place.', "The driver doesn't know the park.", 'The passenger changed her destination.'],
    ja: '運転手が違う場所へ行くところだった。', note: 'Street と Avenue の聞き違いを直しただけ。行き先は同じ',
    tags: tg(4, 'service', 'literal', [], ['contrast'])
  },
  {
    id: 'd4-grab-lunch', type: 'next', focus: 'grab lunch',
    lines: [
      ['orville', 'Hey, how was your weekend?', 'やあ、週末どうだった？'],
      ['rosie', 'Good, thanks! Pretty quiet. We finally tried that ramen place on Fifth.', 'よかったよ！ のんびりしてた。5番街のラーメン屋にやっと行ってきた。'],
      ['orville', 'Oh, nice! We should grab lunch there sometime.', 'いいね！ 今度そこでランチしようよ。']
    ],
    choices: ["Totally, let's do it!", 'Sorry, I already had lunch.', 'On Fifth? No, I took the train.'],
    ja: 'ぜひ、行こう！', note: 'grab lunch sometime＝社交辞令のことも。軽く乗るのが自然',
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
    choices: ["She probably doesn't want to go.", "She'll go if there are salads.", "She's busy on Friday evening."],
    ja: 'たぶん行きたくない。', note: 'be good＝節制中。get back to you はここでは遠回しな断り',
    tags: tg(18, 'friend', 'refusal', [], ['wanna', 'kinda'])
  },
  {
    id: 'd4-cough-drive', type: 'next', focus: 'two coats',
    lines: [
      ['raymond', "Do you have a paint that'll cover dark red? We're going white.", '濃い赤の上から塗れるペンキはありますか？ 白にしたいんです。'],
      ['diana', 'This one covers well, but it takes two coats. Are you doing it this weekend?', 'これはよく隠れますが、2度塗りが必要です。今週末に塗るんですか？'],
      ['raymond', "Yeah, my in-laws are staying with us on Sunday, actually.", 'ええ、実は日曜に妻の両親が泊まりに来るんです。']
    ],
    choices: ["Then I'd go with this one-coat paint instead. It dries overnight.", 'Great, it takes about two weeks to dry.', 'You can paint them white, if you like.'],
    ja: 'それなら、1回塗りのこちらがいいですね。ひと晩で乾きます。', note: 'coat＝塗る回数。時間がないなら別の品を勧める',
    tags: tg(31, 'service', 'literal')
  },
  {
    id: 'd4-installer', type: 'gist', ask: '火曜に 犬の 散歩を するのは？', focus: 'covers for me',
    lines: [
      ['pietro', "I can walk Max at noon on weekdays, but on Tuesdays I'm out of town.", '平日の正午ならマックスの散歩に行けますけど、火曜は町を離れてるんです。'],
      ['audie', "Tuesdays? That's my late night at the office.", '火曜？ ちょうど私が遅くまで会社にいる日だ。'],
      ['pietro', "My sister covers for me. She's great with dogs, just kind of chatty.", '妹が代わりに行きます。犬の扱いはうまいんです、ちょっとおしゃべりなだけで。',
        "My sister covers for me. She's great with dogs, just kinda chatty."],
      ['audie', 'Ha, okay. As long as Max gets his walk.', 'はは、了解。マックスが散歩できるならそれでいい。']
    ],
    choices: ["The dog walker's sister.", 'The woman herself.', 'Nobody. Max stays home.'],
    ja: '散歩代行の人の妹。', note: 'cover for＝代わりにやる。chatty＝おしゃべり',
    tags: tg(37, 'service', 'literal', ['phone'], ['kinda'])
  },
  {
    id: 'd4-service-charge', type: 'next', focus: "hit 'No tip'",
    lines: [
      ['punchy', "Hang on, the tablet's asking for a 15% tip. For one muffin?", '待って、タブレットが15％のチップを求めてる。マフィン1個で？', "Hang on, the tablet's asking for a fifteen percent tip. For one muffin?"],
      ['coco', 'Yeah, everywhere does that now. Even the self-checkout!', 'うん、今はどこもそう。セルフレジでさえ！'],
      ['punchy', "So is it rude if I just hit 'No tip'?", 'じゃあ「チップなし」を押したら失礼かな？']
    ],
    choices: ["Not for a counter order. It's up to you.", 'No, one muffin is enough for me.', "Fifty percent? That's crazy!"],
    ja: 'カウンター注文なら失礼じゃないよ。君しだい。', note: 'カウンター注文のチップは任意。fifteen と fifty にも注意',
    tags: tg(27, 'friend', 'literal', ['cafe'], ['teen-ty'])
  },
  {
    id: 'd4-misheard-name', type: 'next', focus: 'empty-handed',
    lines: [
      ['kid-cat', 'So what should I bring to Thanksgiving? Wine? Flowers?', '感謝祭には何を持っていけばいい？ワイン？花？'],
      ['goldie', "Honestly, just bring yourself. My mom's been cooking since Tuesday.", '正直、手ぶらでいいよ。母が火曜から料理してるから。'],
      ['kid-cat', "Come on, I can't show up empty-handed.", 'そんな、手ぶらで行けないよ。']
    ],
    choices: ["Okay, then grab a pie on the way. Pumpkin's always safe.", 'Sure, my mom cooks every Tuesday.', "No thanks, I'm not hungry yet."],
    ja: 'じゃあ、途中でパイを買ってきて。パンプキンなら間違いない。', note: 'empty-handed＝手ぶら。手土産を持っていきたい',
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
    choices: ['Fair enough. You pick, then.', 'Awesome, so Saturday it is.', 'Last weekend? No, it was the weekend before.'],
    ja: 'それもそうだね。じゃあ君が選んで。', note: "I'm easy＝なんでもいい。でも本音は別",
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
    choices: ['How much extra the suite costs.', 'Whether the meeting room is free.', 'What time his room will be ready.'],
    ja: 'スイートの追加料金がいくらか。', note: 'for a small fee＝有料。How small…?＝いくら？',
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
    choices: ['Call the bank himself to check.', 'Read out the code he was sent.', 'Ask which payment was blocked.'],
    ja: '自分で銀行に電話して確かめる。', note: 'コードを聞き出す「銀行」は詐欺のサイン。自分でかけ直す',
    tags: tg(23, 'stranger', 'deception', ['phone'])
  },
  {
    id: 'd4-ferry-off', type: 'next', focus: 'called off',
    lines: [
      ['cherry', "Is the four o'clock ferry still going? It's pretty windy out there.", '4時のフェリーはまだ出ますか？ 外かなり風が強いですけど。'],
      ['wilbur', "Afraid not, it's been called off. The next one's at six, weather permitting.", '残念ながら欠航です。次は6時、天候次第ですね。'],
      ['cherry', "And if that one's canceled too?", 'それも欠航になったら？']
    ],
    choices: ["Then we'll put you up in a hotel for the night.", "Yes, it's at six, weather permitting.", "Don't worry, the wind's from the west."],
    ja: 'その場合は、今夜のホテルをご用意します。', note: 'called off＝中止。put you up＝泊める',
    tags: tg(11, 'service', 'literal')
  }
];

/** The dialogue items (level 4). */
export const DIALOGUES: readonly Item[] = ROWS.map(item);
