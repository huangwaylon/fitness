// ききみみ クイズ content 「もり」 (B2, level 4): work and people (docs/curriculum.md §3 S2, §5.5 seeds 17-18, 27, 35-36,
// 39-57). Workplace: meetings, deadlines, feedback and hinting, declining politely, onboarding, remote calls, IT, client
// calls, job interviews. Social: friends making and changing plans, gossip, advice, dating, family, parties, sports,
// hobbies, films and food, apologies, compliments.
//   Harder than bank4.ts's first cut by the levers, not by rare words: natural-speed reductions in `tts` (gonna hafta,
// whaddaya, didncha, musta), numbers embedded in talk and corrected mid-line, office idioms and phrasal verbs (loop in,
// take it offline, push back, rain check, cold feet), implied meaning (the praise sandwich, "very brave", "keep you in
// mind") and distractors that reuse a word actually heard.
//   Same shapes and rules as bank4.ts and dialogues.ts: the right choice first, `note` the trap (≤ 40 字), `tts` with its
// sound marks, a scene where one of the 8 fits. Speakers are CAST villagers only (one voice each, for good), spread
// across all 46. content/index.ts folds ITEMS and DIALOGUES into the bank, their staging as written here.
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Accent, Channel, Item, ItemType, Line, SceneId, SoundMark, Tags } from '../bank.ts';
import { CAST } from '../bank4.ts';

const MEAN_ASK = 'つまり、どういうこと？';
const NEXT_ASK = 'つぎの ひとことは？';

type Extra = { tts?: string; focus?: string; ask?: string; marks?: readonly SoundMark[]; channel?: Channel };
type Row = readonly [id: string, speaker: RosterId, en: string, ja: string, note: string, choices: readonly string[], tags: Tags, scene: SceneId | null, extra?: Extra];

const tg = (seed: number, register: Tags['register'], pragmatic: Tags['pragmatic'], conditions?: Tags['conditions'], features?: Tags['features']): Tags =>
  ({ seed, register, pragmatic, ...(conditions?.length && { conditions }), ...(features?.length && { features }) });

const g = (at: string): SoundMark => ['drop', at, 'g'];

const castOf = (who: RosterId) => {
  const cast = CAST[who];
  if (!cast) throw new Error(`kikimimi: ${who} has no cast voice`);
  return cast;
};

const item = (type: ItemType) => ([id, speaker, en, ja, note, choices, tags, scene, x = {}]: Row): Item => {
  const cast = castOf(speaker);
  const focus = type === 'word' ? choices[0] : x.focus;
  const ask = x.ask ?? (type === 'mean' ? MEAN_ASK : undefined);
  return {
    id, lv: 4, type, en, ja, speaker, voice: cast.slice(0, 2) as Accent, cast, choices, answer: 0, note, tags,
    ...(x.tts && { tts: x.tts }), ...(focus && { focus }), ...(ask && { ask }), ...(scene && { scene }),
    ...(x.channel && { channel: x.channel }), ...(x.marks && { marks: x.marks })
  };
};

// ---- reply: the best reply (the right one first) --------------------------------------------------------------------

const REPLY: readonly Row[] = [
  // work
  ['mw-ballpark', 'cj', "Could you give me a ballpark figure? Nothing set in stone, just roughly.",
    'だいたいの金額を出してもらえますか？ 確定じゃなくて、ざっくりでいいので。 →「ざっくり200万円くらいです、税抜きで。」',
    'ballpark figure＝概算。野球場の話ではない',
    ['Roughly two million yen, before tax.', "Sorry, I've never been to a ballpark.", "Yes, it's set in stone now."],
    tg(41, 'boss', 'literal', ['phone'], ['idiom']), 'office'],
  ['mw-loop-in', 'goldie', 'Could you loop me in on the thread with the design team?',
    'デザインチームとのスレッドに、私も入れてもらえる？ →「もちろん、今CCに入れますね。」',
    'loop in＝やり取りに加える。回り道ではない',
    ["Sure, I'll add you to the CC now.", "I'll loop around and meet you there.", "The design team's on the third floor."],
    tg(43, 'colleague', 'literal', [], ['idiom']), 'office'],
  ['mw-bandwidth', 'raymond', 'Have you got the bandwidth to take on the Osaka account this quarter?',
    '今期、大阪の案件を引き受ける余裕はある？ →「正直、来月までは手一杯です。」',
    'bandwidth＝仕事の余力。回線の話ではない',
    ["Honestly, I'm stretched thin until next month.", "Yes, the Wi-Fi's been slow all week.", 'I took it to Osaka last quarter.'],
    tg(40, 'boss', 'literal', [], ['idiom']), 'office'],
  ['mw-hard-stop', 'judy', "Just a heads-up, I've got a hard stop at 11.",
    '先に言っておくと、11時きっかりで抜けなきゃいけないの。 →「了解。じゃあ大事な議題から始めよう。」',
    'hard stop＝次の予定があり時間厳守で抜ける',
    ["Got it. Let's start with the big items, then.", "Okay, I'll stop it at eleven sharp.", 'Thanks, my head feels fine now.'],
    tg(39, 'colleague', 'formula', ['video'], ['idiom', 'numbers']), 'office',
    { tts: "Just a heads-up, I've got a hard stop at eleven.", marks: [['say', '11', 'eLEVen'], ['stress', 'hard stop']] }],
  ['mw-push-back', 'flick', 'The client wants to push the launch back. Again.',
    'クライアントがローンチを延期したいって。またね。 →「またですか？ 今度はどのくらい？」',
    'push back＝延期する。Again に不満がにじむ',
    ['Again? How far back this time?', "Then I'll push them harder.", 'Yes, the launch went really well.'],
    tg(41, 'colleague', 'attitude', [], ['idiom']), 'office'],
  ['mw-offline', 'marshal', "Let's take this offline, shall we? We're running over.",
    'この件は会議の外で話しましょうか。時間が押しているので。 →「そうですね。このあと5分いただけますか？」',
    'take this offline＝会議外で別途話す。ネットは無関係',
    ['Sure. Can we grab five minutes after this?', "Okay, I'll switch the Wi-Fi off.", 'Yes, I ran over here from the station.'],
    tg(40, 'boss', 'indirect', ['video'], ['idiom']), 'office'],
  ['mw-sanity-check', 'audie', 'Would you mind giving my deck a quick sanity check before I send it?',
    '送る前に、私の資料をざっと見てもらえないかな？ →「いいよ。10分後でいい？」',
    'sanity check＝ざっと確認。deck＝スライド資料',
    ['Happy to. Give me ten minutes?', "No, I don't mind the deck chairs.", "Don't worry, I'm perfectly sane."],
    tg(42, 'colleague', 'literal', [], ['idiom']), 'office'],
  ['mw-ticket', 'kicks', "Have you tried logging out and back in? If that doesn't work, I'll raise a ticket.",
    'ログアウトしてもう一度ログインしてみました？ だめなら問い合わせを起票します。 →「やりました。それでもVPNにつながらないんです。」',
    'raise a ticket＝問い合わせを起票。手を挙げるではない',
    ["I have. The VPN still won't connect.", 'No thanks, I already have a ticket.', "Sure, I'll raise my hand next time."],
    tg(43, 'colleague', 'literal', ['phone']), 'office'],
  ['mw-talk-me-through', 'celeste', "So, talk me through a time something didn't go to plan.",
    'では、物事が計画通りに進まなかったときのことを、順を追って話してください。 →「はい。前職でサーバー移行が2週間遅れたときのことです。」',
    'talk me through＝順を追って説明して',
    ['Sure. At my last job, a server move ran two weeks late.', "I'm planning to talk to them next week.", 'Yes, it went to plan in the end.'],
    tg(46, 'boss', 'literal'), 'office'],
  ['mw-where-at', 'tom-nook', 'Remind me, where are we at with the Kobe proposal?',
    'えーと、神戸の提案書はどこまで進んでる？ →「あと少しです。金曜には出せます。」',
    'where are we at＝進み具合は？ 場所を聞いていない',
    ["Nearly there. It'll be out by Friday.", "We're at the Kobe office till Friday.", "Sure, I'll remind you tomorrow."],
    tg(44, 'boss', 'literal', [], ['weak-form']), 'office',
    { tts: "Remind me, where're we at with the Kobe proposal?", marks: [['say', 'where are', "where're"]] }],
  ['mw-reply-all', 'whitney', 'Did you just reply-all to the entire company?',
    '今、全社員に全員返信した？ →「えっ、うそ…取り消せるかな？」',
    '驚きの指摘。命令や事実確認と取らない',
    ['Oh no. Is there any way to recall it?', "Not yet, I'll do it now.", "Yes, they've all replied to me."],
    tg(45, 'colleague', 'attitude'), 'office'],
  // social
  ['mw-rain-check', 'cherry', "Mind if I take a rain check on drinks tonight? I'm wrecked.",
    '今夜の飲み、また今度にしてもいい？ もうクタクタで。 →「全然いいよ。じゃあ来週？」',
    'take a rain check＝また今度に。雨の確認ではない',
    ['Not at all. Next week, then?', "Sure, I'll check the forecast.", 'Yeah, the drinks were awful.'],
    tg(49, 'friend', 'refusal', ['phone'], ['idiom']), 'living'],
  ['mw-spill', 'daisy-mae', 'Okay, spill. What happened with you and the guy from the climbing gym?',
    'ほら、白状しなよ。クライミングジムの彼とはどうなったの？ →「別に。2回出かけただけ。」',
    'spill＝白状して（話して）。こぼすではない',
    ['Nothing much. We went out twice, that\'s all.', "Sorry, I'll grab a towel.", "The climbing gym's just round the corner."],
    tg(53, 'friend', 'literal', [], ['idiom']), 'cafe'],
  ['mw-fair-and-square', 'hamlet', 'You beat me fair and square. Rematch next Sunday?',
    '正々堂々、君の勝ちだ。来週の日曜にリベンジ戦はどう？ →「受けて立つよ。次も手加減しないから。」',
    'beat＝勝つ。fair and square＝正々堂々',
    ["You're on. I won't go easy on you, though.", "Sorry, I didn't mean to hit you.", 'Sunday at the square? Sure.'],
    tg(17, 'friend', 'ritual', [], ['idiom']), null],
  ['mw-overrated', 'apollo', 'Between you and me, I thought it was a bit overrated.',
    'ここだけの話、ちょっと評判倒れだと思ったな。 →「わかる。後半ちょっとダレたよね。」',
    'overrated＝評判ほどではない。率直な不満',
    ['Same. The second half really dragged.', 'Yes, it was rated fifteen.', "Between us? Sure, I'll sit in the middle."],
    tg(52, 'friend', 'attitude'), 'living'],
  ['mw-set-up', 'molly', 'So my friend wants to set you up with her cousin. Interested?',
    'でね、友だちが自分のいとこをあなたに紹介したいんだって。興味ある？ →「うーん、どんな人か次第かな。」',
    'set A up with B＝AにBを紹介（恋愛）。設置ではない',
    ["Maybe. Depends what he's like.", "Sure, I'll set it up on the table.", "Yes, my cousin's really interested."],
    tg(56, 'friend', 'literal', [], ['idiom']), 'cafe'],
  ['mw-fortnight', 'fauna', 'My in-laws are staying for a fortnight. A whole fortnight.',
    '夫の両親が2週間泊まりに来るの。まるまる2週間よ。 →「2週間も？ それは大変だね。」',
    'fortnight＝2週間（英）。four nights と聞き違えない',
    ['Two weeks? Good luck with that.', "Four nights? That's not too bad.", 'Lovely. Are they flying in tonight?'],
    tg(57, 'friend', 'attitude', [], ['contrast']), 'living'],
  ['mw-bring-anything', 'rosie', 'Can I bring anything on Saturday?',
    '土曜日、何か持っていこうか？ →「手ぶらで大丈夫。まあ、飲み物くらいかな。」',
    '手土産の申し出。持ち帰る話ではない',
    ['Just yourself. Well, maybe something to drink.', "Yes, I'll bring it back on Saturday.", "No, I can't make Saturday."],
    tg(48, 'friend', 'ritual'), 'street'],
  ['mw-you-made-this', 'label', 'Wait, you made this? This is seriously good.',
    'えっ、これ作ったの？ ほんとにおいしい。 →「ありがとう！ ネットで見つけたレシピだけどね。」',
    '褒められたら謝らずお礼を。謙遜しすぎない',
    ["Thanks! It's just a recipe I found online.", "Sorry, I'll make it better next time.", "No, I didn't wait for you."],
    tg(48, 'friend', 'ritual'), 'living'],
  ['mw-owe-you', 'kid-cat', 'I owe you one for covering my shift. Seriously.',
    'シフト代わってくれて借りができたよ。ほんとに。 →「気にしないで。今度コーヒーおごってね。」',
    'I owe you one＝恩に着る。金額の話ではない',
    ["Don't mention it. Buy me a coffee sometime.", 'Sure. How much do I owe you?', 'Yes, I covered it with a sheet.'],
    tg(45, 'friend', 'formula', [], ['idiom']), 'cafe'],
  ['mw-cold-feet', 'roald', "Mate, I reckon he's getting cold feet about the wedding.",
    'なあ、あいつ結婚式のことで怖気づいてると思うんだ。 →「え、本当？ なんでそう思うの？」',
    'get cold feet＝怖気づく。寒さの話ではない',
    ['Really? What makes you say that?', 'Maybe he needs thicker socks.', "Yeah, the wedding's in winter."],
    tg(53, 'friend', 'literal', [], ['idiom']), 'street'],
  ['mw-rammed', 'julian', 'Sorry, sorry, the Tube was rammed. Have you been waiting long?',
    'ごめんごめん、地下鉄がぎゅうぎゅうで。だいぶ待った？ →「ううん、私も今来たところ。」',
    'rammed＝超満員（英口語）。聞かれたのは待ち時間',
    ["No, I've only just got here myself.", "Yes, the Tube's usually quicker.", "No worries, I'll wait for the next one."],
    tg(49, 'friend', 'ritual'), 'street']
];

// ---- mean: what they really mean ------------------------------------------------------------------------------------

const MEAN: readonly Row[] = [
  // work
  ['mw-as-i-mentioned', 'lily', 'As I mentioned in my last email, the deadline was Tuesday.',
    '前回のメールでお伝えした通り、締め切りは火曜日でした。 → つまり、メールを読んでいないことに苛立っている。',
    'As I mentioned＝前にも言ったでしょ、という苛立ち',
    ["She's annoyed that you didn't read her email.", "She's checking which day the deadline is.", 'She forgot to send you the email.'],
    tg(42, 'colleague', 'attitude', [], ['intonation']), 'office'],
  ['mw-circle-back', 'bob', "Great question. Let's, uh, circle back to that once we've got more data.",
    'いい質問だね。えー、データがもっと揃ったらまた戻ろう。 → つまり、今は答えたくない。',
    'circle back＝後で戻る。体のいい先送り',
    ["He's putting the question off for now.", "He'll answer it right after the meeting.", 'He thinks the question is easy to answer.'],
    tg(40, 'boss', 'hedge', ['video'], ['idiom']), 'office'],
  ['mw-very-brave', 'diana', "Launching in December? Well, that's a very brave decision.",
    '12月にローンチ？ まあ、それはとても勇敢な決断ね。 → つまり、無謀だと思っている。',
    'very brave（英）＝無謀だ、の婉曲。褒めていない',
    ["She thinks it's a risky, bad idea.", 'She admires how bold the team is.', 'She wants to launch even earlier.'],
    tg(40, 'colleague', 'understatement'), 'office'],
  ['mw-close-the-door', 'gulliver', 'Could you pop into my office when you get a minute? And close the door behind you.',
    '手が空いたら、ちょっと私の部屋に来てくれる？ ドアは閉めてね。 → つまり、内密で深刻な話がある。',
    'ドアを閉めて＝内密で深刻な話の合図',
    ['He wants a private, serious talk.', 'He wants you to fix his office door.', 'He needs a minute to finish something first.'],
    tg(42, 'boss', 'indirect'), 'office'],
  ['mw-top-of-list', 'anchovy', "It's on my list. It's just, you know, not exactly at the top of it.",
    'リストには入ってるよ。ただまあ、一番上ってわけじゃないけど。 → つまり、当分やらない。',
    'not exactly at the top＝後回し。やるとは言っていない',
    ["He won't get to it any time soon.", "He's about to do it next.", "He's lost the list somewhere."],
    tg(44, 'colleague', 'hedge'), 'office'],
  ['mw-fresh-eyes', 'merengue', 'It might be worth having someone with fresh eyes go over the figures.',
    '数字は、新しい目で誰かに見直してもらってもいいかもしれないわね。 → つまり、数字に間違いがありそう。',
    'might be worth＝遠回しな指摘。数字を疑っている',
    ['She suspects there are mistakes in the figures.', 'She wants to hire a new analyst.', "She's happy with the figures as they are."],
    tg(42, 'boss', 'indirect'), 'office'],
  ['mw-learning-curve', 'stitches', "Don't worry, everyone's a bit lost their first month. It's a steep learning curve.",
    '心配しないで、最初の1か月はみんなちょっと迷うから。覚えることが多いんだよ。 → つまり、最初は大変で当然。',
    'steep learning curve＝覚えることが多くて大変',
    ["It's normal to find it hard at first.", "You're learning more slowly than others.", 'The office is hard to find at first.'],
    tg(43, 'colleague', 'literal', [], ['idiom']), 'office'],
  ['mw-perfectionist', 'blathers', "Your CV says you're a perfectionist. We'll see how long that lasts here.",
    '履歴書に完璧主義とありますね。ここでいつまで続くか、見ものです。 → つまり、ここは忙しいという冗談。',
    '面接官の乾いた冗談。疑い・拒絶ではない',
    ["He's joking that this job is too busy for perfection.", "He doesn't believe what's on your CV.", 'He wants you to stop being a perfectionist.'],
    tg(46, 'boss', 'humour'), 'office'],
  ['mw-keep-in-mind', 'saharah', "We'll definitely keep you in mind for future projects.",
    '今後のプロジェクトの際には、ぜひ検討させていただきます。 → つまり、今回は不採用。',
    'keep you in mind＝今回は見送り、の定型句',
    ["You didn't get this project.", "You've already won the next project.", "They'll call you tomorrow about it."],
    tg(41, 'boss', 'refusal', ['phone']), 'office'],
  ['mw-still-sharing', 'maple', 'Sorry, I think you might still be sharing your screen. Including your messages.',
    'ごめん、まだ画面共有になってるかも。メッセージも含めて。 → つまり、個人チャットがみんなに見えている。',
    'Including…が本題。気まずい事態を遠回しに',
    ['Everyone can see your private chats.', 'Your screen has frozen.', 'She wants you to share your screen.'],
    tg(39, 'colleague', 'indirect', ['video']), 'office'],
  // social
  ['mw-each-to-their-own', 'ankha', 'Pineapple and blue cheese? Well, each to their own, I suppose.',
    'パイナップルとブルーチーズ？ まあ、人それぞれよね。 → つまり、変な組み合わせだと思っている。',
    'each to their own＝人それぞれ（私は無理）',
    ["She thinks it's a strange combination.", "She'd like to try some too.", "She can't decide what to order."],
    tg(35, 'friend', 'understatement', [], ['idiom']), 'cafe'],
  ['mw-seen-better', 'kk-slider', "The soundtrack was great. The rest of it... I've seen better.",
    '音楽はよかった。ほかは…まあ、もっといいのを見たことあるかな。 → つまり、映画はいまいちだった。',
    "I've seen better＝いまいち。何度も見たではない",
    ["He didn't think much of the film.", 'He saw it more than once.', 'He loved everything except the music.'],
    tg(52, 'friend', 'understatement'), 'living'],
  ['mw-not-saying', 'bunnie', "I'm not saying she's the reason they split up. I'm just saying the timing's interesting.",
    '彼女が別れた原因だなんて言ってないよ。ただ、タイミングが気になるってだけ。 → つまり、彼女が原因だとほのめかしている。',
    "I'm not saying…＝実はそう言っている",
    ["She's hinting that the woman caused the break-up.", "She's sure the woman had nothing to do with it.", "She's asking when they broke up."],
    tg(53, 'friend', 'indirect'), 'cafe'],
  ['mw-bit-much', 'goldie', "Proposing at her work party? I mean, it's your call, but it might be a bit much.",
    '彼女の会社のパーティーでプロポーズ？ まあ、決めるのはあなただけど、ちょっとやりすぎかも。 → つまり、やめたほうがいい。',
    "it's your call＝あなた次第。a bit much＝やりすぎ",
    ["She thinks it's a bad idea.", 'She thinks the party will cost too much.', 'She wants him to call her about it.'],
    tg(57, 'friend', 'hedge', [], ['idiom']), 'cafe'],
  ['mw-let-you-know', 'sherb', "Camping? In February? Yeah... I'll let you know.",
    'キャンプ？ 2月に？ うーん…また連絡するよ。 → つまり、行きたくない。',
    '間と気のない声が本音。let you know＝たぶん断る',
    ["He doesn't really want to go.", "He'll check the weather and decide.", "He's excited about going in February."],
    tg(48, 'friend', 'refusal', [], ['intonation']), 'street'],
  ['mw-my-shout', 'punchy', "Put your wallet away, it's my shout.",
    '財布はしまって、ここは俺のおごり。 → つまり、彼が払う。',
    'my shout＝おごるよ（豪・英）。叫ぶではない',
    ["He's paying for everyone.", "He's going to shout at the waiter.", 'He wants you to pay in cash.'],
    tg(27, 'friend', 'formula', [], ['idiom']), 'cafe'],
  ['mw-that-person', 'coco', "I hate to be that person, but you did say you'd be here by seven.",
    'こういうこと言いたくないけど、7時までに来るって言ったよね。 → つまり、遅刻に文句を言っている。',
    'I hate to be that person, but…＝苦情の前置き',
    ["She's complaining that you're late.", 'She hates it when people arrive early.', "She's asking what time it is."],
    tg(49, 'friend', 'indirect', [], ['contraction']), 'street'],
  ['mw-popping-round', 'mabel', "Mum's 'just popping round' on Sunday. So, you know, maybe tidy the spare room?",
    '日曜に母が「ちょっと寄る」んだって。だから、ね、客間を片付けてくれる？ → つまり、母が来るから片付けてほしい。',
    'popping round＝ちょっと寄る。でも本題は片付け',
    ['She wants the room cleaned before her mum visits.', 'Her mum is moving into the spare room.', "Her mum can't come on Sunday after all."],
    tg(36, 'partner', 'indirect'), 'living'],
  ['mw-came-out-wrong', 'rosie', 'Oh wow, you look way better than your photos! Sorry, that came out wrong.',
    'わあ、写真よりずっと素敵！ ごめん、今の言い方まずかった。 → つまり、褒めるつもりが失言した。',
    'that came out wrong＝言い方を間違えた',
    ['She meant it as a compliment but said it badly.', 'She thinks your photos look better than you.', "She doesn't recognise you from your photos."],
    tg(56, 'friend', 'humour', [], ['self-repair']), 'cafe'],
  ['mw-cup-of-tea', 'brewster', "Jazz? It's not really my cup of tea, but I'll come along for the company.",
    'ジャズ？ あまり好みじゃないけど、付き合いで行くよ。 → つまり、好きではないが一緒に行く。',
    'not my cup of tea＝好みでない。でも付き合いで行く',
    ["He doesn't love jazz, but he'll still go.", "He'd rather stay in and have tea.", "He loves jazz and can't wait."],
    tg(48, 'friend', 'hedge', [], ['idiom']), 'cafe']
];

// ---- word: the reduced words heard (the answer first; every choice fits the line) -----------------------------------

const WORD: readonly Row[] = [
  // work
  ['mw-gonna-hafta', 'pietro', "We're going to have to push the review to Thursday.",
    'レビューは木曜に延ばさざるを得ないな。',
    'gonna hafta＝〜せざるを得ない。were なら過去',
    ["We're going to have to", 'We were going to', "We'd love to"],
    tg(40, 'boss', 'literal', [], ['gonna', 'weak-form']), 'office',
    { tts: "We're gonna hafta push the review to Thursday.", marks: [['say', 'going to have to', 'gonna hafta']] }],
  ['mw-whaddaya', 'kicks', 'What do you want to do about the printer?',
    'プリンター、どうしたい？',
    'whaddaya＝what do you。did you なら「ワッジャ」',
    ['What do you want to', 'What did you want to', 'Where do you want to'],
    tg(43, 'colleague', 'literal', [], ['wanna', 'weak-form']), 'office',
    { tts: 'Whaddaya wanna do about the printer?', marks: [['say', 'What do you', 'whaddaya'], ['say', 'want to', 'wanna']] }],
  ['mw-been-meaning', 'maple', "I've been meaning to ask you about your trip.",
    '旅行のこと、ずっと聞こうと思ってたんだ。',
    "I've been meaning to＝ずっと〜しようと思っていた",
    ["I've been meaning", "I'd been meaning", 'I was meaning'],
    tg(38, 'colleague', 'ritual', [], ['contraction']), 'office',
    { tts: "I've been meanin' to ask ya about your trip.", marks: [g('meaning'), ['say', 'you', 'ya']] }],
  ['mw-have-you-had', 'saharah', 'Have you had a chance to look at the contract?',
    '契約書、もうご覧いただけましたか？',
    'had は弱く「ヤド」。Did you have と聞き分け',
    ['Have you had', 'Did you have', 'Do you have'],
    tg(41, 'boss', 'formula', ['phone'], ['weak-form', 'yod']), 'office',
    { tts: 'Have ya had a chance ta look at the contract?', marks: [['say', 'you', 'ya'], ['say', 'to', 'ta']] }],
  ['mw-werent-we', 'whitney', "Weren't we supposed to hear back by now?",
    'もう返事が来ててもいい頃じゃなかった？',
    "Weren't「ワーント」と Aren't「アーント」の差",
    ["Weren't we", "Aren't we", "Won't we"],
    tg(46, 'colleague', 'attitude', [], ['contraction', 'weak-form']), 'office',
    { tts: "Weren't we s'posed to hear back by now?", marks: [['say', 'supposed', "s'posed"]] }],
  ['mw-couldja', 'audie', 'Could you just send me the link again?',
    'リンク、もう一回送ってもらえる？',
    'Could you は「クッジュ」。Would you は w で始まる',
    ['Could you', 'Would you', 'Did you'],
    tg(39, 'colleague', 'literal', ['video'], ['yod']), 'office',
    { tts: 'Couldja just send me the link again?', marks: [['say', 'Could you', 'couldja']] }],
  // social
  ['mw-shouldnt-have', 'redd', "You shouldn't have told him about the party.",
    'あいつにパーティーのこと、言うべきじゃなかったな。',
    "shouldn't've の n't を聞き逃すと意味が逆に",
    ["shouldn't have", 'should have', "wouldn't have"],
    tg(54, 'friend', 'literal', [], ['contraction', 'weak-form']), 'living',
    { tts: "You shouldn't've told 'im about the party.", marks: [['say', "shouldn't have", "shouldn't've"], ['say', 'him', "'im"]] }],
  ['mw-used-to', 'kk-slider', 'I used to play in a band, believe it or not.',
    '信じないかもしれないけど、昔バンドやってたんだ。',
    'used to＝昔は〜した。「ユーストゥ」と一語に',
    ['used to', 'get to', 'want to'],
    tg(48, 'friend', 'literal', [], ['weak-form']), 'living',
    { tts: 'I useta play in a band, believe it or not.', marks: [['say', 'used to', 'useta']] }],
  ['mw-must-have', 'molly', "She must have left already. Her coat's gone.",
    '彼女もう帰ったんだね。コートがないもん。',
    'musta＝must have。mighta とは母音で区別',
    ['must have', 'might have', 'would have'],
    tg(54, 'friend', 'literal', [], ['weak-form']), 'living',
    { tts: "She musta left already. Her coat's gone.", marks: [['say', 'must have', 'musta']] }],
  ['mw-youd-better', 'fauna', "You'd better book it now. It'll sell out.",
    '今すぐ予約したほうがいいよ。売り切れちゃうから。',
    "You'd better の 'd はほぼ聞こえない",
    ["You'd better", "We'd better", "You'd rather"],
    tg(48, 'friend', 'literal', [], ['contraction']), 'street',
    { tts: "Ya better book it now. It'll sell out.", marks: [['say', "You'd better", 'ya better']] }],
  ['mw-didncha', 'bunnie', "Didn't you say you'd already booked it?",
    'もう予約したって言ってなかった？',
    "Didn't you は「ディドンチャ」。t と y がつながる",
    ["Didn't you", 'Did you', "Don't you"],
    tg(56, 'partner', 'literal', [], ['yod', 'contraction']), 'living',
    { tts: "Didncha say you'd already booked it?", marks: [['say', "Didn't you", 'didncha']] }],
  ['mw-whats-he-been', 'daisy-mae', "What's he been up to lately?",
    'あの人、最近どうしてるの？',
    'he の h が落ちて「ワッツィ」。she なら sh が残る',
    ["What's he been", "What's she been", 'What have you been'],
    tg(53, 'friend', 'literal', [], ['weak-form']), 'cafe',
    { tts: "What's 'e been up to lately?", marks: [['say', 'he', "'e"]] }],
  ['mw-ya-gonna', 'hamlet', 'Are you going to watch the match tonight?',
    '今夜の試合、見る？',
    'Are you going to →「ヤガナ」。are はほぼ消える',
    ['Are you going to', 'Do you want to', 'Were you going to'],
    tg(50, 'friend', 'literal', [], ['gonna', 'yod']), 'cafe',
    { tts: 'Ya gonna watch the match tonight?', marks: [['say', 'Are you going to', 'ya gonna']] }],
  ['mw-havent-got', 'brewster', "I haven't got a clue where they've gone.",
    '彼らがどこに行ったのか、さっぱりわからない。',
    "haven't got＝持っていない（英）。t は声門で止まる",
    ["haven't got", 'have got', "hadn't got"],
    tg(50, 'friend', 'literal', [], ['contraction', 't-glottal']), 'cafe']
];

// ---- num: numbers at natural speed, embedded in talk (the right one first) ------------------------------------------

const NUM: readonly Row[] = [
  // work
  ['mw-under-budget', 'tom-nook', 'We came in at 1.2 million, about 15% under budget.',
    '120万で着地しました。予算より15%ほど下回りました。',
    'fifTEEN は後ろに強勢。1.2 は金額で別の数字',
    ['15%', '50%', '12%'],
    tg(44, 'boss', 'literal', [], ['teen-ty', 'numbers']), 'office',
    { ask: '予算を どれだけ下回った？', focus: '15% under budget', tts: 'We came in at one point two million, about fifteen percent under budget.',
      marks: [['say', '1.2', 'one point two'], ['say', '15%', 'fifTEEN percent']] }],
  ['mw-q2', 'raymond', 'Sales were up 8% in Q3. Sorry, Q2. Q3 was flat.',
    '売上は第3四半期に8%増…失礼、第2四半期です。第3四半期は横ばいでした。',
    'Sorry の後が訂正。flat＝横ばい',
    ['Q2（第2四半期）', 'Q3（第3四半期）', 'Q4（第4四半期）'],
    tg(44, 'boss', 'literal', ['video'], ['self-repair', 'numbers']), 'office',
    { ask: '8%伸びたのは いつ？', focus: 'Sorry, Q2', tts: 'Sales were up eight per cent in Q three. Sorry, Q two. Q three was flat.',
      marks: [['say', '8%', 'eight per cent'], ['say', 'Q3', 'Q three'], ['stress', 'Sorry']] }],
  ['mw-extension', 'saharah', "My direct line's 03 6457 2210, or just ring reception and ask for extension 38.",
    '直通は03-6457-2210です。または受付に電話して、内線38をお呼びください。',
    '長い直通番号に気を取られず、内線を拾う',
    ['38', '83', '2210'],
    tg(41, 'boss', 'literal', ['phone'], ['numbers']), 'office',
    { ask: '内線番号は？', focus: 'extension 38', tts: "My direct line's oh-three, six-four-five-seven, two-two-one-oh, or just ring reception and ask for extension thirty-eight.",
      marks: [['say', '03 6457 2210', 'oh-three, six-four-five-seven, two-two-one-oh'], ['say', '38', 'thirty-eight']] }],
  ['mw-the-16th', 'judy', "Can we say the 13th? No, wait, that's a Friday. Let's make it the 16th.",
    '13日でいい？ あ、待って、金曜日だ。16日にしよう。',
    'No, wait の後が決定。thirTEEN／sixTEEN',
    ['16日', '13日', '15日'],
    tg(40, 'boss', 'literal', [], ['self-repair', 'teen-ty']), 'office',
    { ask: '締め切りは 何日？', focus: 'the 16th', tts: "Can we say the thirteenth? No, wait, that's a Friday. Let's make it the sixteenth.",
      marks: [['say', '13th', 'thirTEENth'], ['stress', 'wait'], ['say', '16th', 'sixTEENth']] }],
  ['mw-headcount', 'pietro', "We're down to 40 for the offsite, so book a room for 45 to be safe.",
    '社外研修は40人に減ったから、念のため45人分の部屋を取っておいて。',
    'to be safe＝念のため多めに。40は参加人数',
    ['45人', '40人', '14人'],
    tg(43, 'boss', 'literal', [], ['numbers', 'teen-ty']), 'office',
    { ask: '何人分の部屋を とる？', focus: 'a room for 45', tts: "We're down to forty for the offsite, so book a room for forty-five to be safe.",
      marks: [['say', '40', 'FORty'], ['say', '45', 'forty-five']] }],
  ['mw-salary', 'blathers', 'The role starts at £42k, rising to £48k after probation.',
    'このポジションは年収4万2千ポンドから、試用期間後は4万8千ポンドになります。',
    'k＝thousand（省略）。after の後が上がった額',
    ['£48,000', '£42,000', '£40,800'],
    tg(46, 'boss', 'literal', [], ['numbers']), 'office',
    { ask: '試用期間後の 年収は？', focus: '£48k', tts: 'The role starts at forty-two k, rising to forty-eight k after probation.',
      marks: [['say', '£42k', 'forty-two k'], ['say', '£48k', 'forty-eight k']] }],
  ['mw-time-zone', 'whitney', "The call's at 9 our time, so that's 8 for you in Tokyo. Wait, no, 7. We're on daylight saving.",
    '電話会議はこっちの9時だから、東京は8時…いや待って、7時だ。こっちは夏時間だから。',
    'Wait, no の後が正しい時刻（夏時間で2時間差）',
    ['7時', '8時', '9時'],
    tg(39, 'colleague', 'literal', ['video'], ['self-repair', 'numbers']), 'office',
    { ask: '東京では 何時？', focus: 'Wait, no, 7', tts: "The call's at nine our time, so that's eight for you in Tokyo. Wait, no, seven. We're on daylight saving.",
      marks: [['say', '9', 'nine'], ['say', '8', 'eight'], ['say', '7', 'SEVen']] }],
  ['mw-badge-days', 'stitches', 'Your laptop should arrive in 3 to 5 working days. Your badge, another 2 on top of that.',
    'ノートPCは3〜5営業日で届くはず。社員証はさらにその2日後。',
    'on top of that＝さらに上乗せ。最長は5＋2',
    ['7営業日', '5営業日', '2営業日'],
    tg(43, 'colleague', 'literal', [], ['numbers']), 'office',
    { ask: '社員証は 最長で 何営業日後？', focus: 'another 2 on top of that', tts: 'Your laptop should arrive in three to five working days. Your badge, another two on top of that.',
      marks: [['say', '3 to 5', 'three to five'], ['say', '2', 'two'], ['link', 'top of']] }],
  // social
  ['mw-tickets', 'kk-slider', 'Tickets were 85 bucks each, but with fees it came to 210 for both.',
    'チケットは1枚85ドルだったけど、手数料込みで2枚210ドルになった。',
    'two-ten＝210。手数料込みの合計を聞いている',
    ['$210', '$170', '$85'],
    tg(48, 'friend', 'literal', [], ['numbers']), 'street',
    { ask: '2枚で いくら？', focus: '210 for both', tts: 'Tickets were eighty-five bucks each, but with fees it came to two-ten for both.',
      marks: [['say', '85', 'eighty-five'], ['say', '210', 'two-ten']] }],
  ['mw-score', 'punchy', "We were up 3-1 at half-time and lost 4-3. Don't ask.",
    'ハーフタイムで3対1でリードしてたのに、4対3で負けた。聞かないで。',
    'half-time は途中経過。lost の後が結果',
    ['4対3で負け', '3対1で勝ち', '4対1で負け'],
    tg(55, 'friend', 'humour', [], ['numbers']), 'living',
    { ask: '試合の 結果は？', focus: 'lost 4-3', tts: "We were up three-one at half-time and lost four-three. Don't ask.",
      marks: [['say', '3-1', 'three-one'], ['say', '4-3', 'four-three']] }],
  ['mw-surprise-time', 'rosie', "Doors at 7, but don't come before half past. She gets there at quarter to 8.",
    '開場は7時だけど、7時半より前には来ないで。主役は7時45分に着くから。',
    'half past＝7時半。quarter to 8 は主役の到着',
    ['7:30', '7:45', '7:00'],
    tg(54, 'friend', 'literal', ['phone'], ['clock', 'numbers']), 'living',
    { ask: '何時以降に 来てほしい？', focus: 'half past', tts: "Doors at seven, but don't come before half past. She gets there at quarter to eight.",
      marks: [['say', '7', 'seven'], ['say', 'quarter to 8', 'quarter to eight']] }],
  ['mw-rent', 'cherry', "Rent's 2,400 a month, so 800 each. Plus bills, so more like 950.",
    '家賃は月2400ドルだから1人800。光熱費を足すと、950くらいかな。',
    'more like＝むしろ〜くらい。最後が光熱費込み',
    ['$950', '$800', '$2,400'],
    tg(50, 'friend', 'literal', [], ['numbers']), 'living',
    { ask: '光熱費込みで 1人いくら？', focus: 'more like 950', tts: "Rent's twenty-four hundred a month, so eight hundred each. Plus bills, so more like nine-fifty.",
      marks: [['say', '2,400', 'twenty-four hundred'], ['say', '800', 'eight hundred'], ['say', '950', 'nine-fifty']] }],
  ['mw-oven', 'molly', 'Bake it at 180 for 25 minutes. Actually, make it 20, my oven runs hot.',
    '180度で25分焼いて。やっぱり20分にして、うちのオーブン火が強いから。',
    'Actually の後が訂正。180は温度',
    ['20分', '25分', '18分'],
    tg(35, 'partner', 'literal', [], ['self-repair', 'numbers']), 'living',
    { ask: '焼き時間は？', focus: 'make it 20', tts: 'Bake it at one-eighty for twenty-five minutes. Actually, make it twenty, my oven runs hot.',
      marks: [['say', '180', 'one-eighty'], ['say', '25', 'twenty-five'], ['stress', 'Actually'], ['say', '20', 'TWENty']] }],
  ['mw-marathon', 'dom', 'I finished in 4:12. My goal was under four, so... next year.',
    '4時間12分でゴールした。目標は4時間切りだったから…また来年だな。',
    '4:12＝4時間12分。under four は目標の方',
    ['4時間12分', '4時間ちょうど', '4時間20分'],
    tg(17, 'friend', 'literal', [], ['numbers']), null,
    { ask: '記録は？', focus: 'finished in 4:12', tts: 'I finished in four-twelve. My goal was under four, so... next year.',
      marks: [['say', '4:12', 'four-twelve'], ['stress', 'goal']] }]
];

/** もり, work and people: the single-clip items (level 4). */
export const ITEMS: readonly Item[] = [
  ...REPLY.map(item('reply')),
  ...MEAN.map(item('mean')),
  ...WORD.map(item('word')),
  ...NUM.map(item('num'))
];

// ---- dialogues: gist and next (dialogues.ts's shape) ----------------------------------------------------------------

type L = readonly [who: RosterId, en: string, ja: string, tts?: string, marks?: readonly SoundMark[]];
interface DRow {
  id: string;
  type: Extract<ItemType, 'gist' | 'next'>;
  lines: readonly L[];
  ask?: string;
  choices: readonly string[];
  ja: string;
  note: string;
  focus: string;
  tags: Tags;
  scene: SceneId | null;
}

const line = ([who, en, ja, tts, marks]: L): Line => ({ who, cast: castOf(who), en, ja, ...(tts && { tts }), ...(marks && { marks }) });

const dialogue = (r: DRow): Item => {
  const lines = r.lines.map(line);
  return {
    id: r.id, lv: 4, type: r.type, en: lines.map((l) => l.en).join(' '), ja: r.ja, speaker: lines[0].who, voice: lines[0].cast.slice(0, 2) as Accent,
    cast: lines[0].cast, choices: r.choices, answer: 0, focus: r.focus, ask: r.ask ?? NEXT_ASK, note: r.note, tags: r.tags, lines,
    ...(r.scene && { scene: r.scene })
  };
};

const DROWS: readonly DRow[] = [
  // work
  {
    id: 'dmw-standup', type: 'gist', ask: '作業が 止まっているのは？', focus: 'waiting on the API keys', scene: 'office',
    lines: [
      ['gulliver', 'Okay, quick round. Yesterday I wrapped up the login page, and today it\'s the tests.', 'じゃあ手短に。昨日ログイン画面を仕上げて、今日はテストです。'],
      ['audie', "Nice. I'm still stuck on the payments bit, waiting on the API keys from the client. Can't do much till they come through.",
        'いいね。私はまだ決済のところで止まってて、クライアントからのAPIキー待ち。届くまで何もできないの。',
        "Nice. I'm still stuck on the payments bit, waitin' on the API keys from the client. Can't do much till they come through.", [g('waiting')]],
      ['gulliver', "Want me to chase them? I've got a call with them at two anyway.", '催促しようか？ どうせ2時に電話するし。']
    ],
    choices: ['The woman, until the client sends the keys.', 'The man, until the tests are written.', 'The client, until the call at two.'],
    ja: '女性。クライアントがキーを送るまで。', note: 'stuck on／waiting on＝足止め。chase＝催促',
    tags: tg(44, 'colleague', 'literal', ['video'], ['idiom'])
  },
  {
    id: 'dmw-deadline', type: 'next', focus: 'Realistically', scene: 'office',
    lines: [
      ['julian', "Have you got a minute? It's about the Friday deadline.", '少しいいですか？ 金曜の締め切りの件で。'],
      ['celeste', 'Go on. I had a feeling this was coming.', 'どうぞ。そんな気がしてたわ。'],
      ['julian', "The data from finance only landed this morning. Realistically, I'd need till Tuesday.", '経理のデータが今朝やっと届いたんです。現実的には、火曜までかかりそうです。']
    ],
    choices: ["Tuesday's a stretch, but fine. First thing, though.", "Finance? They're on the third floor.", 'I had a feeling it would rain, too.'],
    ja: '火曜はぎりぎりだけど、いいわ。ただし朝イチでね。', note: 'Realistically＝現実的には。延長を受けて条件を出す',
    tags: tg(40, 'boss', 'hedge')
  },
  {
    id: 'dmw-praise-sandwich', type: 'gist', ask: '上司が いちばん 伝えたいことは？', focus: "The one thing I'd flag", scene: 'office',
    lines: [
      ['tom-nook', 'So, overall, a really solid quarter. The clients love working with you.', 'さて、全体的にとても良い四半期だったよ。クライアントも君と仕事するのを喜んでる。'],
      ['maple', "Oh, thanks! That's good to hear.", 'わあ、ありがとうございます！ うれしいです。'],
      ['tom-nook', "The one thing I'd flag is the reports. A couple went out late, and, uh, people noticed. But honestly, keep doing what you're doing.",
        'ひとつ指摘するなら、レポートかな。2本ほど遅れて、まあ、みんな気づいてた。でも本当に、今の調子で続けて。']
    ],
    choices: ['Her reports need to go out on time.', 'The clients want more reports from her.', "She shouldn't change anything at all."],
    ja: 'レポートは期限通りに出してほしい。', note: "The one thing I'd flag＝本題。最後の褒めに流されない",
    tags: tg(42, 'boss', 'indirect')
  },
  {
    id: 'dmw-it-desk', type: 'next', focus: 'on a sticker underneath', scene: 'office',
    lines: [
      ['kicks', 'IT desk, what seems to be the problem?', 'ITサポートです。どうされましたか？'],
      ['lily', "My laptop keeps freezing whenever I join a video call. I've restarted it twice.", 'ビデオ会議に入るたびにノートPCが固まるんです。2回再起動しました。'],
      ['kicks', "Okay. Can you read me the asset number? It's on a sticker underneath.", 'わかりました。管理番号を読んでもらえますか？ 裏のシールにあります。']
    ],
    choices: ['Hang on, let me flip it over.', 'Yes, I restarted it twice.', "Sure, the call's at three."],
    ja: 'ちょっと待ってください、ひっくり返してみます。', note: 'underneath＝裏側。もう話した再起動に戻らない',
    tags: tg(43, 'service', 'literal', ['phone'])
  },
  {
    id: 'dmw-scope', type: 'gist', ask: 'このあと どうなりそう？', focus: 'outside the current scope', scene: 'office',
    lines: [
      ['diana', "While we're at it, could we add a French version of the site? Shouldn't be a big job.", 'ついでに、サイトのフランス語版も追加できます？ 大した作業じゃないでしょう。'],
      ['pietro', "We'd love to help with that. It's outside the current scope, though, so I'll send over a separate quote.", 'ぜひお手伝いしたいです。ただ現在の契約範囲外なので、別途お見積もりをお送りします。'],
      ['diana', "Ah. I was rather hoping it'd be included.", 'あら。含まれていると期待していたんですけど。'],
      ['pietro', 'I understand. Let me see if we can do something on the price.', 'わかります。お値段の方で何かできないか検討します。', 'I understand. Lemme see if we can do something on the price.', [['say', 'Let me', 'lemme']]]
    ],
    choices: ["He'll send a quote, maybe with a discount.", 'The French version will be added for free.', "He'll refuse to do the French site."],
    ja: '見積もりを出す。値引きもあるかもしれない。', note: 'outside the scope＝契約外。値段の相談には乗る',
    tags: tg(41, 'boss', 'hedge', ['phone'], ['lemme'])
  },
  {
    id: 'dmw-cv-gap', type: 'next', focus: 'most useful', scene: 'office',
    lines: [
      ['blathers', "I notice there's a gap on your CV in 2023. Could you tell me about that?", '履歴書の2023年に空白がありますね。お聞きしてもいいですか？',
        "I notice there's a gap on your CV in twenty twenty-three. Could you tell me about that?", [['say', '2023', 'twenty twenty-three']]],
      ['ankha', 'Of course. I took a year out to care for my father, and kept my skills up with a few online courses.', 'もちろんです。父の介護で1年離れていて、オンライン講座でスキルを維持していました。'],
      ['blathers', 'Thank you for sharing that. Which course did you find most useful?', 'お話しいただきありがとうございます。どの講座がいちばん役に立ちましたか？']
    ],
    choices: ['The data analysis one. I use it almost daily.', 'I cared for him for about a year.', 'Yes, the gap was in 2023.'],
    ja: 'データ分析の講座です。ほぼ毎日使っています。', note: '理由はもう話した。聞かれたのは講座',
    tags: tg(46, 'boss', 'literal', [], ['numbers'])
  },
  {
    id: 'dmw-frozen', type: 'gist', ask: '男性は このあと どうする？', focus: 'we lost you', scene: 'office',
    lines: [
      ['raymond', 'So if we look at slide four... Sorry, go ahead.', 'では、スライド4を見ると…すみません、どうぞ。'],
      ['whitney', "No, you go. I was just going to say you'd frozen for a sec.", 'いえ、どうぞ。ちょっと画面が固まってたって言おうとしただけ。',
        "No, you go. I was just gonna say you'd frozen for a sec.", [['say', 'going to', 'gonna']]],
      ['raymond', 'Have I? Can you see me now?', 'そうですか？ 今は見えます？'],
      ['whitney', "Yep, you're back. But we lost you around slide two, so maybe start from there.", 'うん、戻った。でもスライド2あたりから途切れてたから、そこからお願い。']
    ],
    choices: ['Go back to an earlier slide.', 'Skip ahead to slide four.', 'Turn his camera off.'],
    ja: '前のスライドに戻る。', note: 'we lost you＝途中から途切れていた。2から再開',
    tags: tg(39, 'colleague', 'literal', ['video'], ['gonna'])
  },
  {
    id: 'dmw-pto', type: 'next', focus: "what's PTO again", scene: 'office',
    lines: [
      ['saharah', "So all your PTO goes through the HR portal, and anything over two days needs your manager's sign-off. Does that make sense?",
        '休暇の申請は全部人事ポータルから。2日を超えるものは上司の承認が要ります。わかりました？'],
      ['roald', "Mostly. Sorry, what's PTO again?", 'だいたいは。すみません、PTOって何でしたっけ？']
    ],
    choices: ['Paid time off. Your holidays, basically.', 'Yes, two days is fine.', "The HR portal's on the intranet."],
    ja: '有給休暇のこと。要するにお休みです。', note: '聞かれたのは略語の意味。sign-off＝承認',
    tags: tg(43, 'colleague', 'literal')
  },
  // social
  {
    id: 'dmw-plan-b', type: 'gist', ask: '土曜日は 何をする？', focus: 'pour all day', scene: 'living',
    lines: [
      ['bunnie', 'So are we still doing the beer garden on Saturday?', 'で、土曜のビアガーデンはまだ行く感じ？'],
      ['kid-cat', "It's supposed to pour all day. What about bowling instead?", '一日中土砂降りらしいよ。代わりにボウリングは？'],
      ['bunnie', 'Ugh, fine. But only if we get tacos after.', 'うーん、いいよ。でもそのあとタコスなら。'],
      ['kid-cat', "Deal. I'll let the others know.", '決まり。みんなに伝えとく。']
    ],
    choices: ['Go bowling, then eat tacos.', 'Go to the beer garden in the rain.', 'Stay home because of the rain.'],
    ja: 'ボウリングをして、そのあとタコスを食べる。', note: 'pour＝土砂降り。最初の案は雨で変更',
    tags: tg(50, 'friend', 'literal', ['phone'])
  },
  {
    id: 'dmw-gossip', type: 'gist', ask: 'うわさの 内容は？', focus: 'jumped before he was pushed', scene: 'cafe',
    lines: [
      ['judy', "Did you hear? He's moving to the Singapore office.", '聞いた？ あの人シンガポール支社に移るんだって。'],
      ['daisy-mae', "No way. Wasn't he up for the manager job here?", 'うそ。こっちのマネージャー職の候補じゃなかった？'],
      ['judy', "That's the thing. Word is, they gave it to someone else, so he jumped before he was pushed.", 'そこなのよ。うわさでは別の人に決まったらしくて、追い出される前に自分から動いたってわけ。']
    ],
    choices: ["He's leaving because he didn't get the promotion.", 'He got the manager job in Singapore.', 'He was fired from his job.'],
    ja: '昇進できなかったので、自分から移る。', note: 'jumped before he was pushed＝追い出される前に自ら',
    tags: tg(53, 'friend', 'indirect', [], ['idiom'])
  },
  {
    id: 'dmw-advice', type: 'next', focus: 'If you have to ask', scene: 'living',
    lines: [
      ['cherry', 'He texted me again last night. Should I reply?', 'ゆうべまた彼からメッセージが来たの。返したほうがいい？'],
      ['sherb', 'Honestly? If you have to ask, you probably already know the answer.', '正直？ 迷ってる時点で、もう答えは出てるんじゃない？'],
      ['cherry', 'Yeah... I know. I just miss having someone to talk to.', 'うん…わかってる。ただ、話し相手がいないのがさみしくて。']
    ],
    choices: ["That's what your mates are for. Come over tonight.", 'Then text him back right now.', 'Ask him what the answer is.'],
    ja: 'そのための友だちでしょ。今夜うちにおいで。', note: '寄り添う返しを。If you have to ask＝迷う時点で答えは出ている',
    tags: tg(57, 'friend', 'attitude', ['phone'], ['idiom'])
  },
  {
    id: 'dmw-which-friday', type: 'gist', ask: '2人の 食事は いつ？', focus: 'Not tomorrow, the one after', scene: 'living',
    lines: [
      ['apollo', "Dinner next Friday, then? I'll book somewhere.", 'じゃあ来週の金曜に夕食ね？ どこか予約しとく。'],
      ['mabel', 'Lovely. Hang on, do you mean this Friday or the one after?', 'いいわね。待って、今週の金曜？ それともその次？'],
      ['apollo', 'Not tomorrow, the one after. The fourteenth.', '明日じゃなくて、その次。14日。'],
      ['mabel', "Oh good, I'm away this weekend anyway.", 'よかった、どのみち今週末は留守なの。']
    ],
    choices: ['A week from tomorrow, the 14th.', 'Tomorrow, Friday.', 'This weekend, while she is away.'],
    ja: '明日から1週間後の14日。', note: 'next Friday はあいまい。the one after＝その次の金曜',
    tags: tg(56, 'partner', 'literal', [], ['contrast'])
  },
  {
    id: 'dmw-birthday', type: 'next', focus: 'messing with you', scene: 'living',
    lines: [
      ['molly', "You totally forgot my birthday, didn't you?", '私の誕生日、完全に忘れてたでしょ？'],
      ['stitches', 'I... okay, yes. I have no excuse. I am so sorry.', 'えっと…うん、そうです。言い訳できない。本当にごめん。'],
      ['molly', "Relax, I'm messing with you. You sent flowers. They're right there.", '落ち着いて、からかっただけ。お花送ってくれたじゃない。そこにあるよ。', "Relax, I'm messin' with ya. You sent flowers. They're right there.", [g('messing'), ['say', 'you', 'ya']]]
    ],
    choices: ['Oh, thank goodness. You had me worried.', "I'm sorry, I'll send some flowers.", 'Yes, it was my birthday too.'],
    ja: 'あー、よかった。ヒヤッとしたよ。', note: 'messing with you＝からかってるだけ。忘れていない',
    tags: tg(35, 'partner', 'humour', [], ['idiom'])
  },
  {
    id: 'dmw-ending', type: 'next', focus: 'make up your own mind', scene: 'living',
    lines: [
      ['kk-slider', 'So what did you think? Be honest.', 'で、どうだった？ 正直に。'],
      ['raymond', "The first hour was gorgeous. The ending, though... I'm still not sure what happened.", '最初の1時間は見事だった。でも結末は…いまだに何が起きたのかわからない。'],
      ['kk-slider', "That's kind of the point. You're meant to make up your own mind.", 'そこがミソなんだよ。自分で考えるようにできてるんだ。', "That's kinda the point. You're meant to make up your own mind.", [['say', 'kind of', 'kinda']]]
    ],
    choices: ['Fair enough. I might need to watch it again.', 'No, it ended at about ten.', "Sure, I'll make up the spare bed."],
    ja: 'なるほどね。もう一回見ないとだめかも。', note: 'make up your mind＝自分で決める。ベッドを整えるではない',
    tags: tg(52, 'friend', 'literal', [], ['kinda', 'idiom'])
  },
  {
    id: 'dmw-haircut', type: 'gist', ask: '男性の 髪について わかることは？', focus: 'carried away', scene: 'street',
    lines: [
      ['label', 'Okay, I love the hair. When did you get that done?', 'ねえ、その髪いいね。いつ切ったの？'],
      ['roald', 'Cheers! Yesterday. The barber got a bit carried away, to be honest.', 'ありがとう！ 昨日。正直、床屋がちょっと調子に乗っちゃってさ。'],
      ['label', "Well, it suits you. Shorter's definitely better.", 'でも似合ってるよ。短い方が絶対いい。']
    ],
    choices: ['It was cut shorter than he wanted.', 'He cut it himself yesterday.', 'She thinks he should grow it longer.'],
    ja: '思っていたより短く切られた。', note: 'got carried away＝やりすぎた（切りすぎ）',
    tags: tg(48, 'friend', 'understatement', [], ['idiom'])
  }
];

/** もり, work and people: the dialogues (level 4). */
export const DIALOGUES: readonly Item[] = DROWS.map(dialogue);
