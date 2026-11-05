// ききみみ クイズ: dialogue items (docs/kikimimi.md "Dialogues", docs/curriculum.md §14 increment 4), level 4 「かわ・もり」
// (B1+ → B2). Two villagers, 2-4 lines, overheard and service talk cut from the scenario seeds (§5.5): a café order
// going wrong, a cancelled train, a doctor's receptionist, a friend cancelling, a coworker hinting, a landlord who
// won't commit. Two types (TOEIC Part 3 in spirit, for listeners who are already good):
//   `gist`: what's going on, or what will happen (its own `ask`); the distractors a detail heard but misplaced, the
//   literal reading, the opposite.
//   `next`: the best next line; the traps repeat a word or a sound, answer what wasn't asked, or take the wrong role.
// Each line is its own clip (`<id>-<n>`, bank.ts clipIds / clipItems), voiced by its villager's cast voice
// (bank4.ts CAST) and played as a sequence (game.svelte.ts playSequence); `en` is shown, `tts` spoken when it differs
// (§9: reductions spelled as said, numbers written out). The item's `en` is its lines joined (the focus is in one of
// them); its `ja` the right choice's Japanese; `note` the trap (≤ 40 字).
//   No clips yet: the neural pipeline (scripts/kikimimi-audio.ts) voices them, and until every line has a clip the
// deck leaves these types out (deck.ts mixes) and にがて れんしゅう too.
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Accent, Item, ItemType, Line, Tags } from './bank.ts';
import { CAST } from './bank4.ts';
import { MARKS, staged } from './staging.ts';

/** A `next` item's question while it plays (a `gist` has its own). */
const NEXT_ASK = 'つぎの ひとことは？';

type L = readonly [who: RosterId, en: string, ja: string, tts?: string];
interface Row {
  id: string;
  type: Extract<ItemType, 'gist' | 'next'>;
  lines: readonly L[];
  /** A gist's question (Japanese). */
  ask?: string;
  /** The right one first. */
  choices: readonly string[];
  ja: string;
  note: string;
  focus: string;
  tags: Tags;
}

const tg = (seed: number, register: Tags['register'], pragmatic: Tags['pragmatic'], conditions?: Tags['conditions'], features?: Tags['features']): Tags =>
  ({ seed, register, pragmatic, ...(conditions?.length && { conditions }), ...(features?.length && { features }) });

/** A line, `<item>-<n>` its clip id (its sound marks'). */
const line = (id: string) => ([who, en, ja, tts]: L, n: number): Line => {
  const cast = CAST[who];
  if (!cast) throw new Error(`kikimimi: ${who} has no cast voice`);
  const marks = MARKS[`${id}-${n + 1}`];
  return { who, cast, en, ja, ...(tts && { tts }), ...(marks && { marks }) };
};

const item = (r: Row): Item => {
  const lines = r.lines.map(line(r.id));
  return {
    id: r.id, lv: 4, type: r.type, en: lines.map((l) => l.en).join(' '), ja: r.ja, speaker: lines[0].who, voice: lines[0].cast.slice(0, 2) as Accent,
    cast: lines[0].cast, choices: r.choices, answer: 0, focus: r.focus, ask: r.ask ?? NEXT_ASK, note: r.note, tags: r.tags, lines,
    ...staged(r.id)
  };
};

const ROWS: readonly Row[] = [
  {
    id: 'd4-oat-latte', type: 'next', focus: 'Let me remake it',
    lines: [
      ['rosie', 'Large oat latte for... Dawn?', 'ラージのオーツラテ、ドーンさん？'],
      ['dom', "Uh, I think that's mine, but I asked for almond milk.", 'たぶん僕のですけど、アーモンドミルクで頼みました。'],
      ['rosie', "Oh, shoot. Sorry about that. Let me remake it for you, it'll just be a minute.", 'あっ、すみません。作り直しますね、少々お待ちください。',
        "Oh, shoot. Sorry about that. Lemme remake it for ya, it'll just be a minute."]
    ],
    choices: ["No worries, I'm not in a rush.", "Sorry, I'll make it again.", "Yes, it's a large one."],
    ja: '大丈夫です、急いでないので。', note: 'lemme＝let me。作り直すのは店員の方',
    tags: tg(51, 'service', 'formula', ['cafe'], ['lemme'])
  },
  {
    id: 'd4-train-cancelled', type: 'gist', ask: '男性は このあと どうする？', focus: 'rail replacement bus',
    lines: [
      ['raymond', 'Excuse me, is the 8:40 to Brighton still running?', 'すみません、8時40分のブライトン行きはまだ動いていますか？',
        'Excuse me, is the eight forty to Brighton still running?'],
      ['mabel', "It's been cancelled, I'm afraid. There's a signal fault at Haywards Heath.", 'あいにく運休です。ヘイワーズヒースで信号故障がありまして。'],
      ['raymond', 'Brilliant. So how do I get there?', 'そりゃ最高だね。じゃあ、どうやって行けば？'],
      ['mabel', "Your best bet's the rail replacement bus. It leaves from outside, by the taxi rank.", '代行バスがいちばんです。外のタクシー乗り場の横から出ます。']
    ],
    choices: ["He'll take a bus from outside the station.", "He'll wait for the 8:40 train.", "He'll take a taxi to Brighton."],
    ja: '駅の外からバスに乗る。', note: 'Brilliant は皮肉。taxi rank は乗り場の場所',
    tags: tg(5, 'service', 'sarcasm', ['station'], ['contraction'])
  },
  {
    id: 'd4-receptionist', type: 'gist', ask: '男性について 正しいのは？', focus: 'cancellation list',
    lines: [
      ['julian', 'Hi, I was hoping to see Dr Patel sometime this week.', '今週どこかでパテル先生に診ていただきたいのですが。', 'Hi, I was hoping to see Doctor Patel sometime this week.'],
      ['merengue', "She's fully booked till the 20th, but I could put you on the cancellation list.", '20日まで予約がいっぱいですが、キャンセル待ちリストにお入れできます。',
        "She's fully booked till the twentieth, but I could put you on the cancellation list."],
      ['julian', 'Go on, then. And if nothing comes up?', 'じゃあお願いします。もし空きが出なかったら？'],
      ['merengue', "Then it's the 20th at ten past nine, with Dr Okafor instead.", 'その場合は20日の9時10分、オカフォー先生になります。',
        "Then it's the twentieth at ten past nine, with Doctor Okafor instead."]
    ],
    choices: ['He might get an earlier slot if someone cancels.', "He'll see Dr Patel at ten past nine on the 20th.", 'He has to call back on the 20th.'],
    ja: 'キャンセルが出れば、もっと早く診てもらえるかもしれない。', note: 'instead＝代わりに。20日はパテル先生ではない',
    tags: tg(14, 'service', 'literal', ['phone'], ['numbers'])
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
    id: 'd4-wrong-dish', type: 'next', focus: 'Would the snapper do?',
    lines: [
      ['coco', "Here's your chicken parmy, enjoy!", 'チキンパルミジャーナです、どうぞ！'],
      ['sherb', "Sorry, I think there's been a mix-up. I ordered the barramundi.", 'すみません、手違いがあるみたいです。バラマンディを頼んだんですが。'],
      ['coco', "Oh, my bad! The barramundi's sold out, though. Would the snapper do?", 'あら、ごめんなさい！ でもバラマンディは売り切れで。スナッパーでもいいですか？']
    ],
    choices: ["Yeah, that'd be fine, thanks.", 'No, I ordered the chicken.', "Sure, I'll pay for both."],
    ja: 'ええ、それで大丈夫です。ありがとう。', note: 'Would ~ do?＝〜でもいい？。my bad＝ごめん',
    tags: tg(27, 'service', 'literal', ['cafe'], ['contraction'])
  },
  {
    id: 'd4-landlord', type: 'gist', ask: '修理について わかることは？', focus: 'sometime next week',
    lines: [
      ['bunnie', "Hi, it's Bunnie in 4B. The leak under the sink is back.", '4Bのバニーです。シンクの下の水漏れがまた始まって。', "Hi, it's Bunnie in four B. The leak under the sink is back."],
      ['tom-nook', 'Ah. Well, it should be fine for now. Just keep a bucket under it.', 'ああ。まあ、今のところ大丈夫でしょう。バケツを置いといてください。'],
      ['bunnie', "That's what you said last month.", '先月もそう言いましたよね。'],
      ['tom-nook', "Right, right. I'll, uh, see if my guy can swing by sometime next week.", 'そうでしたね。業者が来週どこかで寄れるか、聞いてみます。']
    ],
    choices: ["There's no fixed time for the repair yet.", 'A plumber is coming tomorrow.', 'The tenant has to fix it herself.'],
    ja: '修理の日時はまだ決まっていない。', note: 'see if…sometime＝確約ではない、あいまいな返事',
    tags: tg(30, 'service', 'hedge', ['phone'])
  },
  {
    id: 'd4-neighbour-party', type: 'next', focus: 'up till two',
    lines: [
      ['ankha', 'Hiya! Sorry to bother you. Lovely party on Saturday, by the way.', 'こんにちは！ お邪魔してごめんなさい。ところで土曜日は楽しそうなパーティーでしたね。'],
      ['apollo', "Oh, thanks! Hope it wasn't too loud.", 'ああ、どうも！ うるさくなかったならいいけど。'],
      ['ankha', 'Well... the baby was up till two, to be honest.', 'まあ…正直、赤ちゃんが2時まで起きてて。']
    ],
    choices: ["Oh no, I'm so sorry. We'll keep it down next time.", 'Great, so you enjoyed the party too?', 'Two? I thought it finished at one.'],
    ja: 'うわ、本当にすみません。次は静かにします。', note: 'Lovely party は前置き。本題は赤ちゃんが眠れなかったこと',
    tags: tg(32, 'neighbour', 'indirect')
  },
  {
    id: 'd4-gate-change', type: 'gist', ask: '男性の 乗り継ぎは どうなりそう？', focus: 'You should be right',
    lines: [
      ['roald', 'Is this the gate for Melbourne?', 'メルボルン行きのゲートはここですか？'],
      ['whitney', "It was, but it's moved to 52. And there's a forty-minute delay.", 'そうでしたが、52番に変わりました。それと40分遅れています。', "It was, but it's moved to fifty-two. And there's a forty-minute delay."],
      ['roald', "Forty? I've got a connection at half six.", '40分？ 6時半に乗り継ぎがあるんですが。'],
      ['whitney', "You should be right. They'll hold it for the Sydney passengers.", '大丈夫だと思いますよ。シドニーからの乗客を待ってくれますから。']
    ],
    choices: ["He'll probably still make it.", "He'll miss it and need a new ticket.", "It's been moved to gate 52."],
    ja: 'たぶん間に合う。', note: 'You should be right＝大丈夫（豪）。hold＝出発を待つ',
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
      ['redd', "Parcel for number 12? No one's answering.", '12番地宛ての荷物なんですが、誰も出なくて。', "Parcel for number twelve? No one's answering."],
      ['diana', "Oh, they're away till Friday. I can take it if you like.", 'ああ、金曜まで留守ですよ。よかったら預かりますけど。'],
      ['redd', "Ta. Just sign here, and I'll pop a card through their door.", 'どうも。ここにサインを。お隣のドアに不在票を入れておきます。', "Ta. Just sign here, an' I'll pop a card through their door."]
    ],
    choices: ['The neighbour keeps it until Friday.', 'The driver takes it back to the depot.', "It's left outside number 12."],
    ja: '隣の人が金曜まで預かる。', note: 'Ta＝ありがとう（英口語）。pop a card＝不在票を入れる',
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
      ['cherry', 'Could you take me to Brunswick Street, please?', 'ブランズウィック通り（ストリート）までお願いします。'],
      ['kappn', 'Brunswick Road? No worries, mate.', 'ブランズウィック・ロードね、了解。'],
      ['cherry', 'Sorry, Street. Brunswick Street, in Fitzroy.', 'すみません、ストリートです。フィッツロイのブランズウィック通り。'],
      ['kappn', 'Ah, righto. Totally different direction. Good thing you said something.', 'あー、了解。全然逆方向だ。言ってくれてよかった。', 'Ah, righto. Totally different direction. Good thing ya said something.']
    ],
    choices: ['The driver nearly went to the wrong place.', "The driver doesn't know Fitzroy.", 'The passenger changed her destination.'],
    ja: '運転手が違う場所へ行くところだった。', note: 'Street と Road の聞き違いを直しただけ。行き先は同じ',
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
    id: 'd4-cough-drive', type: 'next', focus: 'drowsy',
    lines: [
      ['raymond', 'Have you got anything for a really bad cough?', 'ひどいせきに効くものはありますか？'],
      ['diana', 'This one works well, but it can make you drowsy. Are you driving today?', 'これがよく効きますが、眠くなることがあります。今日は運転されますか？'],
      ['raymond', "Yeah, I've got a long drive tonight, actually.", 'ええ、実は今夜長距離を運転するんです。']
    ],
    choices: ["Then I'd go for this non-drowsy one instead.", 'Great, it should help you sleep in the car.', 'You can drive me there, if you like.'],
    ja: 'それなら、眠くならないこちらの方がいいですね。', note: 'drowsy＝眠くなる。運転するなら別の薬を勧める',
    tags: tg(13, 'service', 'literal')
  },
  {
    id: 'd4-installer', type: 'gist', ask: '木曜の 朝、家に いるのは？', focus: 'stay in',
    lines: [
      ['pietro', 'We can send someone Thursday, between eight and one.', '木曜の8時から1時の間に、担当の者がお伺いします。'],
      ['audie', 'Between eight and one? I start work at ten.', '8時から1時？ 10時から仕事なんです。'],
      ['pietro', 'Somebody over 18 just needs to be home to let them in.', '18歳以上の方がご在宅で、中に入れていただければ大丈夫です。', "Somebody over eighteen just needs to be home to let 'em in."],
      ['audie', "Okay, I'll ask my roommate to stay in.", 'わかりました、ルームメイトに家にいてもらいます。']
    ],
    choices: ['Her roommate.', 'The woman herself.', "Nobody, she'll be at work."],
    ja: 'ルームメイト。', note: "let 'em in＝let them in。stay in＝家にいる",
    tags: tg(25, 'service', 'literal', ['phone'], ['weak-form', 'teen-ty'])
  },
  {
    id: 'd4-service-charge', type: 'next', focus: 'take it off',
    lines: [
      ['punchy', "Hang on, there's a 15% service charge on here.", '待って、15％のサービス料が入ってる。', "Hang on, there's a fifteen per cent service charge on here."],
      ['coco', 'Seriously? The waiter forgot our drinks twice!', 'うそ？ 店員さん、飲み物を2回も忘れたのに！'],
      ['punchy', 'Want me to ask them to take it off?', '外してもらうように頼もうか？']
    ],
    choices: ["Yeah, would you? That'd be great.", 'No, two drinks is enough for me.', "Fifty per cent? That's crazy!"],
    ja: 'うん、お願いできる？ 助かる。', note: 'take it off＝料金から外す。fifteen と fifty にも注意',
    tags: tg(27, 'friend', 'literal', ['cafe'], ['teen-ty'])
  },
  {
    id: 'd4-misheard-name', type: 'next', focus: 'May?',
    lines: [
      ['goldie', 'Can I get a name for that?', 'お名前いただけますか？'],
      ['kid-cat', "It's Wei. W, E, I.", 'ウェイです。W・E・I。'],
      ['goldie', 'Got it. Large mocha for... May?', '了解です。ラージのモカ、メイさん？']
    ],
    choices: ['Close enough, thanks!', 'Can I get a name for that?', 'No, I ordered a mocha.'],
    ja: 'だいたい合ってるし、いいよ。ありがとう！', note: 'Wei を May と聞き違えた。Close enough＝まあいいか',
    tags: tg(51, 'service', 'humour', ['cafe'])
  },
  {
    id: 'd4-im-easy', type: 'next', focus: "I'm easy",
    lines: [
      ['apollo', 'What do you fancy doing this weekend?', '週末、何したい？'],
      ['ankha', "Oh, I'm easy. Whatever you want.", 'なんでもいいよ。あなたの好きなので。'],
      ['apollo', 'Great. How about the football on Saturday, then?', 'よし。じゃあ土曜はサッカー観戦は？'],
      ['ankha', 'Hmm... we did football last weekend.', 'うーん…先週もサッカーだったよね。']
    ],
    choices: ['Fair enough. You pick, then.', "Brilliant, so Saturday it is.", 'Last weekend? No, it was the weekend before.'],
    ja: 'それもそうだね。じゃあ君が選んで。', note: "I'm easy＝なんでもいい、でも本音は別",
    tags: tg(36, 'partner', 'indirect')
  },
  {
    id: 'd4-hotel-suite', type: 'gist', ask: '男性が 知りたいことは？', focus: 'small supplement',
    lines: [
      ['merengue', "Your room won't be ready till three, I'm afraid.", '申し訳ありませんが、お部屋は3時までご用意できません。'],
      ['blathers', "Ah. My meeting's at two, so I was hoping to change first.", 'ああ。2時に会議があって、先に着替えたかったんですが。'],
      ['merengue', 'We do have a suite available now, for a small supplement.', '少々の追加料金で、今すぐご利用いただけるスイートもございます。'],
      ['blathers', 'How small are we talking?', '少しって、どのくらいです？']
    ],
    choices: ['How much extra the suite costs.', 'Whether the meeting room is free.', 'What time his room will be ready.'],
    ja: 'スイートの追加料金がいくらか。', note: 'supplement＝追加料金。How small…?＝いくら？',
    tags: tg(3, 'service', 'hedge', ['desk'])
  },
  {
    id: 'd4-bank-scam', type: 'gist', ask: '男性は このあと どうする？', focus: 'ring the number on the back of my card',
    lines: [
      ['redd', "Hi, this is Mark from your bank's fraud team. We've blocked a suspicious payment.", '銀行の不正対策チームのマークです。不審な支払いをブロックしました。'],
      ['raymond', 'Oh. Which payment?', 'えっ。どの支払いですか？'],
      ['redd', "I'll explain in a sec. First, just read me the code we've texted you, to confirm it's you.", 'すぐご説明します。まず本人確認のため、送ったコードを読み上げてください。'],
      ['raymond', "Hang on. I'll ring the number on the back of my card.", '待ってください。カードの裏の番号にかけ直します。']
    ],
    choices: ['Call the bank himself to check.', 'Read out the code he was sent.', 'Ask which payment was blocked.'],
    ja: '自分で銀行に電話して確かめる。', note: 'ring＝電話する（英）。コードを聞く銀行は詐欺のサイン',
    tags: tg(23, 'stranger', 'deception', ['phone'])
  },
  {
    id: 'd4-ferry-off', type: 'next', focus: 'called off',
    lines: [
      ['cherry', "Is the four o'clock ferry still going? It's pretty windy out there.", '4時のフェリーはまだ出ますか？ 外かなり風が強いですけど。'],
      ['wilbur', "Afraid not, it's been called off. The next one's at six, weather permitting.", '残念ながら欠航です。次は6時、天候次第ですね。'],
      ['cherry', "And if that one's cancelled too?", 'それも欠航になったら？']
    ],
    choices: ["Then we'll put you up in a hotel for the night.", "Yes, it's at six, weather permitting.", "No worries, the wind's from the west."],
    ja: 'その場合は、今夜のホテルをご用意します。', note: 'called off＝中止。put you up＝泊める',
    tags: tg(11, 'service', 'literal')
  }
];

/** The dialogue items (level 4). */
export const DIALOGUES: readonly Item[] = ROWS.map(item);
