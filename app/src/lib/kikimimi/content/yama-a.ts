// ききみみ クイズ stage やま (B2+, docs/curriculum.md §3 S3), set A: harder than もり (bank4.ts, dialogues.ts) in the
// listening and the pragmatics, not in the vocabulary. American idioms and phrasal verbs in context (rain check, throw
// under the bus, on your watch, hang a left), slang and casual speech (yeah, no; ghosted; a parking lot of a freeway;
// when pigs fly), sitcom- and movie-style sarcasm, banter, teasing,
// understatement and overstatement, audible puns (knead / need the dough), heavy reductions spelled as said in `tts`
// (whaddaya, gimme, I'da, sorta, whatcha, dontcha, sposta, c'mon), fillers and false starts, film- and TV-style
// exchanges. The traps reuse words actually heard (the literal reading of an idiom, a number said first then
// corrected, the sound-alike: lock up / look up).
//   LEVEL: やま is level 6 (`LV`, one place).
//   Shape: bank4.ts's and dialogues.ts's (the existing types only: reply, mean, word, num; dialogues gist and next),
// with the staging written in place (`scene`, `channel`, `marks`) since staging.ts is shared: the integrator may move
// them to PLACES / MARKS. Voices: bank4.ts CAST (one cast voice per villager for good); American English and US voices
// by default; about a tenth are UK or AU voices in standard English (no slang), tagged `accent-exposure`.
// `en` is shown (UK spelling for UK and AU voices), `tts` spoken when it differs (§9: every number written out).
//   ids: `ya-` (items), `dya-` (dialogues). bank.test, staging.test and content/sets.test check them.
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Accent, Channel, Item, ItemType, Level, Line, SceneId, SoundMark, Tags } from '../bank.ts';
import { CAST } from '../bank4.ts';

/** やま's level. */
const LV: Level = 6;

const MEAN_ASK = 'つまり、どういうこと？';
const NEXT_ASK = 'つぎの ひとことは？';

type Extra = { tts?: string; focus?: string; ask?: string; scene?: SceneId; channel?: Channel; marks?: readonly SoundMark[] };
type Row = readonly [id: string, speaker: RosterId, en: string, ja: string, note: string, choices: readonly string[], tags: Tags, extra?: Extra];

const tg = (seed: number, register: Tags['register'], pragmatic: Tags['pragmatic'], conditions?: Tags['conditions'], features?: Tags['features']): Tags =>
  ({ seed, register, pragmatic, ...(conditions?.length && { conditions }), ...(features?.length && { features }) });

const castOf = (who: RosterId) => {
  const cast = CAST[who];
  if (!cast) throw new Error(`kikimimi: ${who} has no cast voice`);
  return cast;
};

const item = (type: ItemType) => ([id, speaker, en, ja, note, choices, tags, x = {}]: Row): Item => {
  const cast = castOf(speaker);
  const focus = type === 'word' ? choices[0] : x.focus;
  const ask = x.ask ?? (type === 'mean' ? MEAN_ASK : undefined);
  return {
    id, lv: LV, type, en, ja, speaker, voice: cast.slice(0, 2) as Accent, cast, choices, answer: 0, note, tags,
    ...(x.tts && { tts: x.tts }), ...(focus && { focus }), ...(ask && { ask }),
    ...(x.scene && { scene: x.scene }), ...(x.channel && { channel: x.channel }), ...(x.marks && { marks: x.marks })
  };
};

const g = (at: string): SoundMark => ['drop', at, 'g'];

// ---- reply: the best reply (the right one first) --------------------------------------------------------------------

const REPLY: readonly Row[] = [
  ['ya-r-rain-check', 'kk-slider', "Can I take a rain check on tonight? Work's kind of swamped.",
    '今夜の約束、また今度にしてもいい？仕事がちょっと立て込んでて。 →「全然いいよ。落ち着いたら連絡して。」',
    'rain check＝また今度。天気の話ではない',
    ['No sweat. Hit me up when things calm down.', "Yeah, it's supposed to rain all night.", "Sure, I'll check your work for you."],
    tg(49, 'friend', 'refusal', ['phone'], ['idiom', 'kinda']),
    { tts: "Can I take a rain check on tonight? Work's kinda swamped.", scene: 'living', marks: [['say', 'kind of', 'kinda']] }],
  ['ya-r-whaddaya', 'bob', 'What do you say we just order in and call it a night?',
    'もう出前にして、今日はおしまいってことでどう？ →「しょうがないなあ（大賛成）。メニュー取ってくる。」',
    'Whaddaya say…?＝〜しない？ 意見を聞いてはいない',
    ["You twisted my arm. I'll grab the menus.", "I'd say it's about nine.", "Sure, I'll call them tonight."],
    tg(35, 'partner', 'indirect', [], ['contraction', 'idiom']),
    { tts: "Whaddaya say we just order in an' call it a night?", scene: 'living', marks: [['say', 'What do you', 'whaddaya'], ['say', 'and', "an'"]] }],
  ['ya-r-under-bus', 'audie', 'Did you seriously just throw me under the bus in front of the whole team?',
    'ねえ、チーム全員の前で私に責任をなすりつけたよね？ →「うん、わかってる。あれはひどかった。ごめん。」',
    'throw under the bus＝人に責任を押しつける',
    ['I know, I know. That was out of line. Sorry.', 'No, I took the train this morning.', 'Yeah, the whole team was there.'],
    tg(44, 'colleague', 'attitude', [], ['yod', 'idiom']),
    { tts: 'Didja seriously just throw me under the bus in fronna the whole team?', scene: 'office', marks: [['say', 'Did you', 'didja'], ['say', 'front of', 'fronna']] }],
  ['ya-r-ballpark', 'cj', "I'm not going to hold you to it, but what are we looking at, ballpark?",
    '言質を取るつもりはないけど、ざっくりいくらぐらい？ →「ざっと見て、2千ドル前後かな。」',
    'ballpark＝おおよその額。球場の話ではない',
    ['Rough guess? Somewhere around two grand.', "It's near the ballpark, yeah.", "No, I won't hold it for you."],
    tg(31, 'service', 'hedge', [], ['gonna', 'idiom']),
    { tts: "I'm not gonna hold ya to it, but what're we lookin' at, ballpark?", scene: 'living',
      marks: [['say', 'going to', 'gonna'], ['say', 'you', 'ya'], ['say', 'what are', "what're"], g('looking')] }],
  ['ya-r-humblebrag', 'marshal', "Ugh, I've been so busy, what with the book deal and the podcast and everything.",
    'はあ、忙しくてさ。本の出版契約とか、ポッドキャストとか、いろいろで。 →「まあ、お気の毒に。君でいるのも大変だね。」',
    '自慢話にはからかいで返す。what with＝〜やら',
    ['Oh, you poor thing. Must be exhausting being you.', 'Which book are you reading at the moment?', "No, I'm not busy this week."],
    tg(52, 'friend', 'humour', [], ['ellipsis', 'accent-exposure']), { scene: 'cafe' }],
  ['ya-r-leg', 'teddy', "Dude, you've got something on your face. Nah, I'm just pulling your leg.",
    'おい、顔に何かついてるぞ。…なんてな、冗談だよ。 →「おもしろいね。一瞬だまされた。」',
    'pull your leg＝からかう。最後の Nah で冗談と判明',
    ['Very funny. You got me for a second.', 'Thanks. Is it gone now?', 'Ow! Let go of my leg!'],
    tg(52, 'friend', 'humour', [], ['idiom']),
    { tts: "Dude, you've got somethin' on your face. Nah, I'm just pullin' your leg.", scene: 'street', marks: [g('something'), g('pulling')] }],
  ['ya-r-quick-sync', 'molly', "Oh, great, another 'quick sync' at 6 p.m. on a Friday. My favorite.",
    '最高、金曜の18時にまた「ちょっとした打ち合わせ」。大好き。 →「ほんとそれ。メールで済まないか聞いてみようか？」',
    'great と favorite は皮肉。同調するのが自然',
    ['Ugh, I know. Want me to ask if it can be an email?', 'Great! I love quick meetings too.', "It's at six on Friday, right?"],
    tg(40, 'colleague', 'sarcasm', [], ['intonation']),
    { tts: 'Oh, great, another quick sync at six p.m. on a Friday. My favorite.', scene: 'office', marks: [['say', '6 p.m.', 'six p.m.'], ['stress', 'great favorite']] }],
  ['ya-r-lemme-guess', 'flick', 'Let me guess. You forgot your wallet again?',
    '当ててあげようか。また財布を忘れたんでしょ？ →「わかった、わかった。金曜に返すって。約束。」',
    'Let me guess＝どうせ〜でしょ。からかいの定番',
    ["Okay, okay. I'll pay you back Friday. Promise.", 'Sure, guess as many times as you like.', 'No, it was my wallet, not yours.'],
    tg(27, 'friend', 'humour', [], ['lemme', 'intonation']),
    { tts: 'Lemme guess. You forgot your wallet again?', scene: 'cafe', marks: [['say', 'Let me', 'lemme'], ['stress', 'forgot']] }],
  ['ya-r-hit-sack', 'kicks', "I'm going to hit the sack. You good to lock up?",
    'もう寝るわ。戸締まり頼んでいい？ →「うん、やっとく。おやすみ！」',
    'hit the sack＝寝る。lock up と look up に注意',
    ['Yeah, I got it. Night!', "Sure, the sack's by the door.", "Yeah, I'll look it up."],
    tg(35, 'friend', 'literal', [], ['gonna', 'idiom', 'ellipsis']),
    { tts: "I'm gonna hit the sack. You good to lock up?", scene: 'living', marks: [['say', 'going to', 'gonna'], ['link', 'lock up']] }],
  ['ya-r-dont-quote', 'lopez', "Don't quote me on this, but I'm pretty sure they're going to push it back to spring.",
    '確かな話じゃないけど、春に延期になると思うよ。 →「了解。じゃあ、予約はまだ待っておく。」',
    "Don't quote me＝確証はない。断定と取らない",
    ["Gotcha. I'll hold off on booking anything, then.", "Great, so it's definitely spring?", "Sure, I'll put it in quotes."],
    tg(40, 'colleague', 'hedge', [], ['gonna', 'idiom']),
    { tts: "Don't quote me on this, but I'm pretty sure they're gonna push it back to spring.", scene: 'office', marks: [['say', 'going to', 'gonna'], ['link', 'push it back']] }],
  ['ya-r-breaking-up', 'goldie', "You're kind of breaking up on my end. Want to try turning your video off?",
    'そっちの音声、ちょっと途切れてるみたい。ビデオをオフにしてみる？ →「うん、ちょっと待って。これでどう？」',
    'breaking up＝音声が途切れる。別れ話ではない',
    ['Sure, give me a sec. Is that any better?', "Wait, you're breaking up with me?", "Yeah, I'll turn it off at the end."],
    tg(39, 'colleague', 'literal', ['video'], ['kinda', 'wanna']),
    { tts: "You're kinda breakin' up on my end. Wanna try turnin' your video off?", scene: 'office',
      marks: [['say', 'kind of', 'kinda'], g('breaking'), ['say', 'Want to', 'wanna'], g('turning')] }],
  ['ya-r-care-less', 'label', "Honestly? I couldn't care less what they think of my hair.",
    '正直？私の髪をどう思われようが、どうでもいい。 →「その意気だよ。どっちにしても似合ってる。」',
    "couldn't care less＝全く気にしない",
    ['Good for you. It looks great anyway.', 'Oh, so you care a lot?', 'Less hair? Are you getting it cut?'],
    tg(57, 'friend', 'attitude', [], ['idiom', 'contraction']), { scene: 'street' }],
  ['ya-r-on-house', 'wolfgang', "That one's on the house. You look like you've had a day.",
    'それはサービスです。大変な一日だったみたいですね。 →「いやもう、ほんとに。ありがとう、優しいですね。」',
    'on the house＝店のおごり。had a day＝散々な日',
    ["Ha, you have no idea. Thanks, that's really sweet.", 'Which house? I live in an apartment.', 'Yeah, I had one yesterday.'],
    tg(51, 'service', 'understatement', [], ['idiom', 'ellipsis']), { scene: 'cafe' }],
  ['ya-r-bite-tongue', 'daisy-mae', 'I had to bite my tongue when he said the whole thing was his idea.',
    '全部自分のアイデアだって彼が言ったとき、ぐっとこらえたよ。 →「えらい。よく何も言わなかったね。」',
    'bite my tongue＝言いたいのを我慢する',
    ["Wow. I'm impressed you didn't say anything.", 'Ouch! Is your tongue okay?', 'So you told him it was your idea?'],
    tg(42, 'friend', 'attitude', [], ['idiom']), { scene: 'cafe' }],
  ['ya-r-cutting-close', 'orville', "Boarding closes in ten. You're cutting it pretty close.",
    '搭乗締め切りまで10分です。かなりギリギリですよ。 →「ですよね。保安検査を早く通る方法はありますか？」',
    'cut it close＝時間ギリギリ。距離の close ではない',
    ['I know. Is there a faster way through security?', "It's pretty close, about ten minutes' walk.", "Sorry, I'll close it."],
    tg(2, 'service', 'indirect', [], ['idiom', 'flap']),
    { tts: "Boardin' closes in ten. You're cuttin' it pretty close.", scene: 'gate', marks: [g('Boarding'), g('cutting')] }],
  ['ya-r-full-cover', 'tom-nook', "Look, I'd grab the full coverage. Most folks who skip it end up kicking themselves.",
    'フル補償にしときなよ。付けなかった人はたいてい後悔するんだから。 →「ありがとう。でもクレジットカードで補償されてるので。」',
    'kick oneself＝後悔する。押し売りは丁寧に断る',
    ['Thanks, but my credit card already covers it.', 'Why would they kick themselves?', "No, I'd rather skip the line."],
    tg(7, 'service', 'indirect', [], ['idiom']),
    { tts: "Look, I'd grab the full coverage. Most folks who skip it end up kickin' themselves.", marks: [g('kicking')] }],
  ['ya-r-projector', 'ankha', "The presentation went... well, let's just say the projector had a better day than I did.",
    'プレゼンは…まあ、プロジェクターのほうが私よりましな一日だったってとこかな。 →「あらら。一杯飲みながら話、聞こうか？」',
    "let's just say＝はっきり言わないが悪い結果",
    ['Oh no. Want to grab a drink and tell me about it?', 'Great! So the projector worked?', "Congratulations. I knew you'd nail it."],
    tg(44, 'colleague', 'understatement', [], ['ellipsis', 'accent-exposure']), { scene: 'office' }],
  ['ya-r-coffee-run', 'tia', "I'm doing a coffee run. Want anything, or are you good?",
    'コーヒー買いに行くけど、何かいる？それとも大丈夫？ →「大丈夫、ありがとう。あ、待って、アイスラテを頼めたら最高。」',
    'are you good?＝いらない？ の確認。coffee run＝買い出し',
    ["I'm good, thanks. Actually, wait, an iced latte would be amazing.", "Yeah, I'm pretty good at it.", "No, I don't run in the mornings."],
    tg(38, 'colleague', 'ritual', [], ['idiom', 'self-repair']),
    { tts: "I'm doin' a coffee run. Want anything, or are ya good?", scene: 'office', marks: [g('doing'), ['say', 'you', 'ya']] }],
  ['ya-r-ghosted', 'lily', 'So he just ghosted me. Like, totally fell off the face of the earth.',
    'で、彼に急に連絡を絶たれたの。もう、完全に音信不通。 →「最低。あなたにはもっといい人がいるよ。」',
    'ghost＝急に連絡を絶つ。幽霊ではない',
    ['Ugh, what a coward. You deserve way better.', 'A ghost? Where did you see it?', 'Did he hurt himself when he fell?'],
    tg(57, 'friend', 'attitude', [], ['idiom']), { scene: 'cafe' }],
  ['ya-r-sleep-on', 'reneigh', "It's a really generous offer. Would it be okay if I slept on it?",
    '本当にありがたいお話です。一晩考えさせていただいてもいいですか？ →「もちろん。金曜までにお返事ください。」',
    'sleep on it＝一晩考える。即答を避ける定番',
    ['Of course. Just let us know by Friday.', "There's a sofa in the break room.", "No, we didn't sleep much either."],
    tg(46, 'boss', 'formula', [], ['idiom']), { scene: 'office' }],
  ['ya-r-goalposts', 'kabuki', 'So now they want it by Wednesday? Talk about moving the goalposts.',
    '今度は水曜まで？ころころ条件を変えるよな。 →「ほんとそれ。押し返してみようか？」',
    'move the goalposts＝途中で条件を変える',
    ['Tell me about it. Want me to push back?', 'Which goalposts? The ones on the field?', "No, Wednesday's after the game."],
    tg(41, 'colleague', 'attitude', [], ['idiom']), { scene: 'office' }],
  ['ya-r-dropped-ball', 'judy', "Look, we really dropped the ball on this one, and that's on me.",
    '今回は本当にこちらの落ち度です。私の責任です。 →「そう言っていただけると。どう挽回しましょうか？」',
    "drop the ball＝しくじる。that's on me＝私の責任",
    ['I appreciate that. So how do we fix it?', "Don't worry, I'll pick the ball up.", "On you? I can't see anything."],
    tg(41, 'service', 'formula', [], ['idiom']), { scene: 'office' }]
];

// ---- mean: what they really mean ------------------------------------------------------------------------------------

const MEAN: readonly Row[] = [
  ['ya-m-floats', 'anchovy', 'Pineapple on pizza? Hey, whatever floats your boat.',
    'ピザにパイナップル？まあ、好きにすれば。 → つまり、自分は好きじゃないが、ご自由に。',
    'floats your boat＝好み。船の話ではない',
    ["He doesn't like it, but it's up to you.", "He's suggesting a boat trip.", 'He thinks pineapple pizza is great.'],
    tg(50, 'friend', 'attitude', [], ['idiom']), { scene: 'cafe' }],
  ['ya-m-horses', 'rosie', "Whoa, hold your horses. We haven't even seen the apartment yet.",
    'ちょっと待って、落ち着いて。まだ部屋も見てないよ。 → つまり、決めるのが早すぎる。',
    'hold your horses＝早まらないで',
    ["You're rushing into a decision.", 'She wants to wait for the horses.', "She's ready to sign today."],
    tg(36, 'partner', 'indirect', [], ['idiom', 'contraction']), { scene: 'street' }],
  ['ya-m-opera', 'fauna', "Opera? I mean, I'm sure it's lovely. It's just... three hours is a lot of hours.",
    'オペラ？いや、きっと素敵なんだろうけど。ただ…3時間って、けっこうな時間だよね。 → つまり、長すぎて気が進まない。',
    "I'm sure it's lovely の後の just… が本音",
    ["Three hours sounds too long to her.", "She thinks it's lovely, so she's in.", "She's asking how long it lasts."],
    tg(48, 'friend', 'refusal', [], ['ellipsis', 'accent-exposure']), { scene: 'street' }],
  ['ya-m-yeah-nah', 'bea', "Yeah, no, I'm not doing karaoke again. Not after last time.",
    'うん、いや、カラオケはもうやらない。前回のあとじゃね。 → つまり、絶対に行かない。',
    'Yeah, no＝「いや」。最後の no が本音',
    ["She definitely won't do karaoke.", "She's agreeing to sing again.", "She hasn't decided yet."],
    tg(55, 'friend', 'refusal', [], ['intonation']),
    { tts: "Yeah, no, I'm not doin' karaoke again. Not after last time.", scene: 'street', marks: [g('doing')] }],
  ['ya-m-no-brainer', 'dom', "Free protein shakes after class? Dude, that's a no-brainer. Sign me up.",
    'クラスの後にプロテイン無料？そんなの迷うまでもない。申し込むよ。 → つまり、もちろん参加する。',
    'no-brainer＝考えるまでもない。バカの意ではない',
    ["He'll definitely join.", 'He thinks it\'s a stupid idea.', "He's too tired to think about it."],
    tg(17, 'friend', 'literal', [], ['idiom'])],
  ['ya-m-rocket', 'kid-cat', "Come on, it's a printer, not rocket science. Just turn it off and on again.",
    'ちょっと、ただのプリンターだよ、ロケット工学じゃあるまいし。電源を入れ直せばいい。 → つまり、簡単に直せる。',
    'not rocket science＝難しくない',
    ["It's easy to fix.", 'The printer is broken for good.', 'He works in rocket science.'],
    tg(43, 'colleague', 'attitude', [], ['idiom']),
    { tts: "C'mon, it's a printer, not rocket science. Just turn it off 'n' on again.", scene: 'office', marks: [['say', 'Come on', "c'mon"], ['say', 'and', "'n'"]] }],
  ['ya-m-thanks-heaps', 'lucky', 'Oh, thanks a lot for finishing the milk. Really appreciate it.',
    'あー、牛乳飲み干してくれて、どうもありがとう。助かるわ。 → つまり、牛乳を全部飲まれて怒っている。',
    'thanks a lot は皮肉。平板な口調が本音',
    ["He's annoyed you drank all the milk.", "He's grateful you bought more milk.", 'He wants you to finish the milk.'],
    tg(35, 'friend', 'sarcasm', [], ['intonation']), { scene: 'living' }],
  ['ya-m-sharpest', 'tammy', "He's a sweet guy. Not exactly the sharpest tool in the shed, though.",
    'いい人だよ。まあ、頭はあんまり切れないけどね。 → つまり、いい人だが賢くはない。',
    'sharpest tool＝頭の切れ。though＝でもね',
    ["He's nice, but not very smart.", "He's good with tools.", "He's smart, but not very nice."],
    tg(53, 'friend', 'humour', [], ['idiom']), { scene: 'street' }],
  ['ya-m-believe', 'daisy-mae', "You're going to run a marathon? I'll believe it when I see it.",
    'マラソン走るの？実際に見るまで信じないよ。 → つまり、本当にやるとは思っていない。',
    '見たら信じる＝今は疑っている',
    ["She doubts you'll actually do it.", 'She wants to come and watch.', "She's sure you'll finish."],
    tg(17, 'friend', 'attitude', [], ['gonna', 'idiom']),
    { tts: "You're gonna run a marathon? I'll believe it when I see it.", scene: 'street', marks: [['say', 'going to', 'gonna']] }],
  ['ya-m-night-bus', 'raymond', 'Missed the last train? Well, the night bus is... an experience.',
    '終電逃した？まあ、夜行バスは…なかなかの体験だよ。 → つまり、夜行バスは快適じゃない。',
    'an experience は婉曲。いい意味ではない',
    ["The night bus isn't pleasant.", 'The night bus is fun and exciting.', "There's no night bus tonight."],
    tg(5, 'friend', 'understatement', [], ['ellipsis', 'accent-exposure']), { scene: 'platform' }],
  ['ya-m-steep', 'poppy', "Forty bucks for a candle? That's a little steep, isn't it?",
    'キャンドルに40ドル？ちょっと高すぎない？ → つまり、高すぎて買う気はない。',
    'steep＝高い。bucks＝ドル。坂の話ではない',
    ['She thinks the candle costs too much.', 'She thinks the shelf is too high.', 'She wants to buy two.'],
    tg(26, 'friend', 'understatement', [], ['idiom']), { scene: 'street' }],
  ['ya-m-on-your-watch', 'henry', "Look, I'm not saying it's your fault. I'm just saying it happened on your watch.",
    '君のせいだと言ってるんじゃない。ただ、君の担当中に起きたと言ってるだけだ。 → つまり、遠回しに責めている。',
    'on your watch＝あなたの担当中。腕時計ではない',
    ["He's blaming you, politely.", "He's asking about your watch.", "He's saying it's nobody's fault."],
    tg(42, 'boss', 'indirect', [], ['idiom']), { scene: 'office' }],
  ['ya-m-pass', 'kicks', "Camping in November? I'm going to pass, but you guys have fun.",
    '11月にキャンプ？パスするよ、みんなは楽しんで。 → つまり、行かない。',
    'pass＝遠慮する。通り過ぎる意ではない',
    ["He's not coming.", "He'll pass by later.", "He's excited to come."],
    tg(48, 'friend', 'refusal', [], ['gonna']),
    { tts: "Campin' in November? I'm gonna pass, but you guys have fun.", scene: 'living', marks: [g('Camping'), ['say', 'going to', 'gonna']] }],
  ['ya-m-economy', 'hamlet', "A house? In this economy? Sure, I'll just pick one up on the way home.",
    '家？このご時世に？はいはい、帰りにひとつ買ってくるよ。 → つまり、家なんて買えない。',
    'pick up＝ついでに買う。皮肉で不可能を表す',
    ["He can't afford a house.", "He's buying a house on the way home.", "He's moving closer to home."],
    tg(57, 'friend', 'sarcasm', [], ['idiom']), { scene: 'street' }],
  ['ya-m-tough-crowd', 'pietro', 'Wow. Tough crowd tonight.',
    'うわ。今夜のお客さんは手ごわいね。 → つまり、ジョークが全然ウケなかった。',
    'tough crowd＝笑わない客。人数の話ではない',
    ['Nobody laughed at his joke.', 'The audience is very strong.', 'The room is too crowded.'],
    tg(55, 'stranger', 'humour', [], ['idiom'])],
  ['ya-m-reply-all', 'gulliver', 'So, quick heads-up: you hit reply-all on that email about the boss.',
    'ちょっと知らせとくけど、上司についてのあのメール、全員に返信してたよ。 → つまり、上司を含む全員に届いた。',
    'heads-up＝事前の知らせ。reply-all＝全員に返信',
    ['Your email went to everyone, boss included.', "Your email didn't send.", 'The boss wants you to reply.'],
    tg(44, 'colleague', 'indirect', [], ['idiom']), { scene: 'office' }],
  ['ya-m-bold-shirt', 'celeste', "That's... certainly a bold choice of shirt for a job interview.",
    'それは…面接にしては、なかなか大胆なシャツね。 → つまり、着替えたほうがいい。',
    'bold choice は婉曲な否定。certainly で強調',
    ['She thinks you should change your shirt.', 'She loves how confident it looks.', "She's asking where you bought it."],
    tg(46, 'friend', 'understatement', [], ['ellipsis', 'accent-exposure']), { scene: 'living' }],
  ['ya-m-wouldnt-say-no', 'blathers', "Another slice? Well, I wouldn't say no.",
    'もう一切れ？まあ、断りはしないね。 → つまり、ぜひ欲しい。',
    "wouldn't say no＝控えめな「ぜひ」",
    ["He'd like another slice.", "He's politely saying no.", "He's too full to eat more."],
    tg(32, 'neighbour', 'understatement', [], ['contraction', 'accent-exposure']), { scene: 'door' }],
  ['ya-m-pinch-salt', 'judy', "I'd take anything Greg says with a grain of salt.",
    'グレッグの言うことは、話半分に聞いたほうがいいよ。 → つまり、グレッグの話はあまり信用できない。',
    'with a grain of salt＝割り引いて聞く',
    ["Don't fully believe what Greg says.", "Greg's cooking needs more salt.", 'Greg is always right.'],
    tg(43, 'colleague', 'indirect', [], ['idiom']), { scene: 'office' }],
  ['ya-m-pigs-fly', 'sterling', 'Him? Apologize? Yeah, when pigs fly.',
    'あいつが？謝る？ああ、ブタが空を飛んだらね。 → つまり、絶対に謝らない。',
    'when pigs fly＝ありえない。Yeah は皮肉',
    ["He'll never apologize.", "He's about to apologize.", "He's scared of flying."],
    tg(52, 'friend', 'sarcasm', [], ['idiom', 'intonation']), { scene: 'street' }],
  ['ya-m-fence', 'lily', "I'm kind of on the fence about the job. Like, the money's great, but the commute? Brutal.",
    'その仕事、ちょっと迷ってるんだよね。お金はいいけど、通勤が？地獄。 → つまり、受けるか決めかねている。',
    'on the fence＝どっちつかず。断ったわけではない',
    ["She can't decide whether to take it.", "She's turned the job down.", "She's worried about the money."],
    tg(57, 'friend', 'hedge', [], ['kinda', 'idiom']),
    { tts: "I'm kinda on the fence about the job. Like, the money's great, but the commute? Brutal.", scene: 'cafe', marks: [['say', 'kind of', 'kinda']] }],
  ['ya-m-van', 'cj', "Hey, it's Dan. Listen, no pressure at all, but if you happened to be free Saturday, and you happened to own a van...",
    'もしもし、ダンだけど。全然無理しなくていいんだけど、もし土曜が空いてて、もしバンを持ってたりしたら…。 → つまり、土曜にバンで手伝ってほしい。',
    '仮定を重ねた遠回しな頼み。no pressure は前置き',
    ['He wants you and your van on Saturday.', "He's selling his van.", "He's inviting you out on Saturday."],
    tg(45, 'friend', 'indirect', ['voicemail'], ['ellipsis', 'weak-form']),
    { tts: "Hey, it's Dan. Listen, no pressure at all, but if you happened ta be free Saturday, an' you happened ta own a van...", scene: 'living',
      marks: [['say', 'happened to', 'happened ta'], ['say', 'and', "an'"]] }],
  ['ya-m-holding', 'shep', "Folks, we're going to be in a bit of a holding pattern for, uh, twenty-odd minutes. Nothing to worry about.",
    '皆さま、えー、20分ほど上空で旋回待機となります。ご心配には及びません。 → つまり、到着が20分あまり遅れる。',
    'holding pattern＝着陸待ちの旋回。-odd＝〜あまり',
    ['The plane will land twenty-plus minutes late.', "Something's wrong with the plane.", "They'll land twenty minutes early."],
    tg(2, 'official', 'formula', ['pa'], ['gonna', 'idiom']),
    { tts: "Folks, we're gonna be in a bit of a holdin' pattern for, uh, twenty-odd minutes. Nothing to worry about.",
      marks: [['say', 'going to', 'gonna'], g('holding')] }],
  ['ya-m-accountant', 'octavian', 'An accountant? So, business, then. Definitely not pleasure.',
    '会計士？ということは仕事ですね。楽しみのほうではなさそうだ。 → つまり、会計士は退屈だとからかっている。',
    'Business or pleasure? を使った冗談。疑われてはいない',
    ["He's joking that accounting is dull.", "He thinks you're lying about your job.", 'He wants to see your business card.'],
    tg(9, 'official', 'humour', ['desk']), { scene: 'gate' }]
];

// ---- word: the reduced words heard (the answer first; every choice fits the line) -----------------------------------

const WORD: readonly Row[] = [
  ['ya-w-whaddaya', 'goldie', 'What do you think of the new guy, honestly?',
    '新しく来た人、正直どう思う？',
    'whaddaya＝what do you。過去の did なら whadja',
    ['What do you', 'What did you', 'What would you'],
    tg(38, 'colleague', 'literal', [], ['contraction', 'weak-form']),
    { tts: 'Whaddaya think of the new guy, honestly?', scene: 'office', marks: [['say', 'What do you', 'whaddaya']] }],
  ['ya-w-gimme', 'dom', "Give me a sec, I'm almost done with this level.",
    'ちょっと待って、このステージもうすぐ終わるから。',
    "gimme＝give me。give 'im／give 'em と紛らわしい",
    ['Give me', 'Give him', 'Give them'],
    tg(35, 'friend', 'literal', [], ['weak-form']),
    { tts: "Gimme a sec, I'm almost done with this level.", scene: 'living', marks: [['say', 'Give me', 'gimme']] }],
  ['ya-w-hafta', 'rosie', "If we're catching the last train, we have to leave by 11:30.",
    '終電に乗るなら、11時半には出ないと。',
    'hafta＝have to。過去の had to は「ハットゥ」',
    ['have to', 'had to', 'used to'],
    tg(5, 'friend', 'literal', [], ['weak-form', 'numbers']),
    { tts: "If we're catchin' the last train, we hafta leave by eleven-thirty.", scene: 'platform',
      marks: [g('catching'), ['say', 'have to', 'hafta'], ['say', '11:30', 'eleven-thirty']] }],
  ['ya-w-ida', 'maple', "I would've told you if I'd known.",
    '知ってたら、言ってたよ。',
    "I'da は would've。否定なら n't が残る",
    ["would've", "wouldn't have", 'will have'],
    tg(49, 'friend', 'literal', [], ['contraction', 'weak-form']),
    { tts: "I'da told ya if I'da known.", scene: 'living', marks: [['say', "I would've", "I'da"], ['say', 'you', 'ya'], ['say', "I'd known", "I'da known"]] }],
  ['ya-w-sorta', 'agnes', 'I sort of forgot to call her back.',
    '折り返し電話するの、なんとなく忘れちゃって。',
    'sorta＝sort of。t が弾音で「ソーダ」に近い',
    ['sort of', 'kind of', 'totally'],
    tg(49, 'friend', 'hedge', [], ['kinda', 'weak-form']),
    { tts: "I sorta forgot ta call 'er back.", scene: 'street', marks: [['say', 'sort of', 'sorta'], ['say', 'to', 'ta'], ['say', 'her', "'er"]] }],
  ['ya-w-you-gonna', 'bob', 'You going to eat that, or can I have it?',
    'それ食べる？それとももらっていい？',
    'Are の省略。gonna／wanna／gotta は母音で区別',
    ['going to', 'want to', 'got to'],
    tg(35, 'friend', 'indirect', [], ['gonna', 'ellipsis']),
    { tts: 'You gonna eat that, or can I have it?', scene: 'cafe', marks: [['say', 'going to', 'gonna']] }],
  ['ya-w-tell-im', 'zucker', "If he calls, just tell him I'm in a meeting.",
    'もし彼から電話が来たら、会議中だって言っておいて。',
    "tell 'im は h が落ち「テリム」。'em なら「テレム」",
    ['him', 'them', 'her'],
    tg(44, 'colleague', 'indirect', [], ['weak-form']),
    { tts: "If he calls, just tell 'im I'm in a meeting.", scene: 'office', marks: [['say', 'him', "'im"]] }],
  ['ya-w-oughta', 'daisy-mae', "You ought to get that looked at. It's been weeks.",
    'それ、診てもらったほうがいいよ。もう何週間もでしょ。',
    'oughta は t が弾音で「アーダ」に近い。助言',
    ['ought to', 'have to', 'need to'],
    tg(15, 'friend', 'indirect', [], ['flap', 'weak-form']),
    { tts: "You oughta get that looked at. It's been weeks.", scene: 'living', marks: [['say', 'ought to', 'oughta']] }],
  ['ya-w-useta', 'anchovy', 'We used to come here every summer when I was a kid.',
    '子どものころ、毎年夏にここに来てたんだ。',
    'useta＝used to。d は聞こえず「ユースタ」',
    ['used to', 'got to', 'had to'],
    tg(53, 'friend', 'literal', [], ['weak-form']),
    { tts: 'We useta come here every summer when I was a kid.', scene: 'street', marks: [['say', 'used to', 'useta']] }],
  ['ya-w-whatcha', 'lily', 'What are you up to this weekend?',
    '今週末、何するの？',
    'whatcha は are が消える。were なら過去の話',
    ['What are you', 'What were you', 'What are they'],
    tg(38, 'colleague', 'ritual', [], ['yod', 'contraction']),
    { tts: 'Whatcha up to this weekend?', scene: 'office', marks: [['say', 'What are you', 'whatcha']] }],
  ['ya-w-dontcha', 'judy', "Why don't you just ask her?",
    '彼女に直接聞いてみたら？',
    "dontcha＝don't you。didn't you は「ディドゥンチャ」",
    ["don't you", "didn't you", "won't you"],
    tg(57, 'friend', 'indirect', [], ['yod']),
    { tts: "Why dontcha just ask 'er?", scene: 'cafe', marks: [['say', "don't you", 'dontcha'], ['say', 'her', "'er"]] }],
  ['ya-w-coulda', 'frett', "It could've been way worse, honestly.",
    '正直、もっとずっとひどくてもおかしくなかったよ。',
    "couldn't have なら「最悪だった」で意味が逆",
    ["could've", "couldn't have", "would've"],
    tg(57, 'friend', 'attitude', [], ['contraction', 'weak-form']),
    { tts: 'It coulda been way worse, honestly.', scene: 'street', marks: [['say', "could've", 'coulda']] }],
  ['ya-w-get-it', 'julian', "He's got to get it done by Monday.",
    '彼は月曜までにそれを終わらせないといけない。',
    '英国の t は声門で止まり「ゲッイッ」。g で判断',
    ['get it', 'have it', 'keep it'],
    tg(44, 'colleague', 'literal', [], ['t-glottal', 'gotta', 'accent-exposure']),
    { tts: "He's gotta get it done by Monday.", scene: 'office', marks: [['say', 'got to', 'gotta'], ['link', 'get it']] }],
  ['ya-w-not-gonna-lie', 'kk-slider', "I'm not going to lie, that was rough.",
    '正直に言うと、あれはきつかった。',
    'not は「ナッ」と短い。聞き逃すと意味が変わる',
    ["I'm not going to", 'I was going to', "I'm going to"],
    tg(57, 'friend', 'attitude', [], ['gonna', 'contraction']),
    { tts: "I'm not gonna lie, that was rough.", scene: 'street', marks: [['say', 'going to', 'gonna']] }],
  ['ya-w-couldja', 'bunnie', "Could you grab me one while you're up?",
    '立ったついでに、私にもひとつ取ってくれる？',
    'couldja の d で could。can you は「キャニュ」',
    ['Could you', 'Can you', 'Would you'],
    tg(35, 'partner', 'indirect', [], ['yod']),
    { tts: "Couldja grab me one while you're up?", scene: 'living', marks: [['say', 'Could you', 'couldja']] }],
  ['ya-w-wouldnt-wanna', 'stitches', "Trust me, you wouldn't want to be there at rush hour.",
    '言っとくけど、ラッシュアワーにあそこにはいたくないと思うよ。',
    "wouldn't の t は消えがち。n の鼻音で否定を聞く",
    ["wouldn't want to", 'would want to', "won't want to"],
    tg(58, 'stranger', 'indirect', [], ['wanna', 'contraction']),
    { tts: "Trust me, you wouldn't wanna be there at rush hour.", scene: 'platform', marks: [['say', 'want to', 'wanna']] }],
  ['ya-w-whydja', 'audie', 'Why did you even tell her?',
    'なんでわざわざ彼女に言ったの？',
    'whydja＝why did you。d の音が過去の目印',
    ['Why did you', 'Why do you', 'Why would you'],
    tg(53, 'friend', 'attitude', [], ['yod']),
    { tts: "Whydja even tell 'er?", scene: 'cafe', marks: [['say', 'Why did you', 'whydja'], ['say', 'her', "'er"]] }],
  ['ya-w-sposta', 'nana', "Aren't you supposed to be at work?",
    'あれ、仕事に行ってるはずじゃなかった？',
    'sposta＝supposed to。頭の su がほぼ消える',
    ['supposed to', 'going to', 'about to'],
    tg(35, 'friend', 'humour', [], ['yod', 'weak-form']),
    { tts: "Aren'tcha sposta be at work?", scene: 'street', marks: [['say', "Aren't you", "aren'tcha"], ['say', 'supposed to', 'sposta']] }]
];

// ---- num: numbers inside fast talk (the right one first) ------------------------------------------------------------

const NUM: readonly Row[] = [
  ['ya-n-fee', 'cj', "It was supposed to be $1,500, but with the 'convenience fee' it came to, like, $1,850.",
    '1,500ドルのはずが、「手数料」込みで1,850ドルくらいになったよ。',
    '最初の数字は予定。like の後が実際の額',
    ['$1,850', '$1,500', '$1,815'],
    tg(7, 'friend', 'sarcasm', [], ['numbers']),
    { ask: '実際に はらったのは？', focus: '$1,850', scene: 'street',
      tts: "It was supposed ta be fifteen hundred, but with the convenience fee it came to, like, eighteen-fifty.",
      marks: [['say', 'supposed to', 'supposed ta'], ['say', '$1,500', 'fifteen hundred'], ['say', '$1,850', 'eighteen-fifty']] }],
  ['ya-n-ice', 'bob', "Grab two bags of ice. No, wait, there's twelve of us. Make it four.",
    '氷を2袋買ってきて。いや待って、12人いるんだ。4袋にして。',
    'No, wait の後で変更。12 は人数',
    ['4袋', '2袋', '12袋'],
    tg(50, 'friend', 'literal', [], ['self-repair', 'numbers']),
    { ask: '氷は 何袋？', focus: 'Make it four', scene: 'street', tts: "Grab two bagsa ice. No, wait, there's twelve of us. Make it four.", marks: [['say', 'bags of', 'bagsa']] }],
  ['ya-n-half-six', 'katt', "Should we say six-thirty? Actually, make it a quarter to seven. Traffic's a nightmare.",
    '6時半にしようか？やっぱり7時15分前にして。渋滞がひどいの。',
    'Actually の後が変更後。a quarter to＝15分前',
    ['6:45', '6:30', '7:15'],
    tg(49, 'friend', 'literal', ['phone'], ['clock', 'self-repair']),
    { ask: '待ちあわせは 何時？', focus: 'a quarter to seven', scene: 'living' }],
  ['ya-n-years', 'gulliver', "I've been here, what, eleven years? No, twelve. Twelve this March.",
    'ここに勤めて、えーと、11年？いや、12年。この3月で12年。',
    '言い直し後が答え。March は月で 3 ではない',
    ['12年', '11年', '3年'],
    tg(38, 'colleague', 'literal', [], ['self-repair', 'numbers']),
    { ask: '何年 つとめている？', focus: 'No, twelve', scene: 'office' }],
  ['ya-n-percent', 'label', "It's 30% off, plus another 10% if you use the app. So, call it... 37%?",
    '30％引きで、アプリを使うとさらに10％。つまり…37％かな？',
    '30%＋10%で40%ではない。最後に言う数',
    ['37%', '40%', '30%'],
    tg(26, 'service', 'literal', [], ['numbers']),
    { ask: 'ぜんぶで 何％引き？', focus: '37%', scene: 'street',
      tts: "It's thirty percent off, plus another ten percent if ya use the app. So, call it... thirty-seven percent?",
      marks: [['say', '30%', 'thirty percent'], ['say', '10%', 'ten percent'], ['say', 'you', 'ya'], ['say', '37%', 'thirty-seven percent']] }],
  ['ya-n-feels-like', 'whitney', "It'll be thirty-four tomorrow, but with the humidity it'll feel more like thirty-eight.",
    '明日は34度だけど、湿気で38度くらいに感じるよ。',
    'feel like は体感温度。予想気温は前の数字',
    ['34度', '38度', '43度'],
    tg(60, 'friend', 'literal', [], ['numbers', 'accent-exposure']),
    { ask: '明日の 予想気温は？', focus: 'thirty-four', scene: 'street' }],
  ['ya-n-phone', 'maple', "It's 090-4473-0186. Got that?",
    '番号は090-4473-0186。わかった？',
    '0 は「オー」と読む。4473 と 4743 を聞き分ける',
    ['090-4473-0186', '090-4743-0186', '090-4473-0168'],
    tg(45, 'friend', 'literal', ['phone'], ['numbers']),
    { ask: '電話番号は？', focus: '090-4473-0186', scene: 'living',
      tts: "It's oh-nine-oh, four-four-seven-three, oh-one-eight-six. Got that?",
      marks: [['say', '090-4473-0186', 'oh-nine-oh, four-four-seven-three, oh-one-eight-six']] }],
  ['ya-n-delay', 'orville', "We're now looking at a 9:15 departure, so if you were booked on the 7:45, that's about an hour and a half.",
    '現在、出発は9時15分の見込みです。7時45分の便をご予約の方は、約1時間半の遅れです。',
    '9:15 と 7:45 の差。15 と 45 に惑わされない',
    ['1時間半', '1時間15分', '45分'],
    tg(8, 'official', 'literal', ['pa'], ['numbers']),
    { ask: '遅れは どのくらい？', focus: 'an hour and a half', scene: 'gate',
      tts: "We're now lookin' at a nine-fifteen departure, so if you were booked on the seven forty-five, that's about an hour and a half.",
      marks: [g('looking'), ['say', '9:15', 'nine-fifteen'], ['say', '7:45', 'seven forty-five']] }],
  ['ya-n-age', 'fang', "I'm thirty-nine. Again. For the fourth year in a row.",
    '39歳だよ。また。4年連続でね。',
    '4年連続39歳＝実は42歳。冗談で年をごまかす',
    ['42歳', '39歳', '43歳'],
    tg(52, 'friend', 'humour', [], ['numbers', 'ellipsis']),
    { ask: '本当は 何歳？', focus: 'fourth year in a row', scene: 'cafe' }],
  ['ya-n-rent', 'tom-nook', "Rent's ¥120,000 a month, plus two months' deposit, so you're looking at ¥360,000 upfront.",
    '家賃は月12万円、敷金が2か月分で、最初に36万円です。',
    'three-sixty＝36万円。thousand を省いて言う',
    ['360,000円', '240,000円', '120,000円'],
    tg(33, 'service', 'literal', ['phone'], ['numbers']),
    { ask: '最初に はらう額は？', focus: '¥360,000', scene: 'living',
      tts: "Rent's a hundred and twenty thousand a month, plus two months' deposit, so you're lookin' at three-sixty upfront.",
      marks: [['say', '¥120,000', 'a hundred and twenty thousand'], g('looking'), ['say', '¥360,000', 'three-sixty']] }],
  ['ya-n-buses', 'marina', 'Buses run every twelve minutes until eight, then every twenty after that.',
    'バスは8時までは12分おき、それ以降は20分おきに運行します。',
    'until eight の後は every twenty。8 は時刻',
    ['20分', '12分', '8分'],
    tg(5, 'official', 'literal', ['pa'], ['teen-ty', 'numbers']),
    { ask: '9時ごろの バスの 間隔は？', focus: 'every twenty', scene: 'street' }],
  ['ya-n-fortnight', 'ken', "Normally it's three to four weeks, but for you? Give me ten days, tops.",
    'ふつうは3〜4週間だけど、あなたなら？ 長くても10日でやるよ。',
    'for you? の後が本題。tops＝長くても',
    ['10日以内', '3〜4週間', '約2週間'],
    tg(31, 'service', 'hedge', [], ['idiom', 'numbers', 'weak-form']),
    { ask: 'どのくらい かかる？', focus: 'ten days, tops', tts: "Normally it's three ta four weeks, but for you? Gimme ten days, tops.",
      marks: [['say', 'to', 'ta'], ['say', 'Give me', 'gimme']] }],
  ['ya-n-split', 'gayle', 'Okay, road trip math. Gas was sixty, tolls were eighteen, snacks were twelve. Venmo me your half.',
    'はい、ドライブ旅行の精算。ガソリン60ドル、高速代18ドル、おやつ12ドル。半分をVenmoで送って。',
    '60＋18＋12＝90の半分。half を聞き逃さない',
    ['$45', '$90', '$39'],
    tg(27, 'friend', 'literal', [], ['numbers']),
    { ask: '相手が はらうのは？', focus: 'your half', scene: 'cafe' }],
  ['ya-n-room', 'molly', 'Room 1415. No, sorry, 1450. One-four-five-oh.',
    '1415号室。いえ、失礼しました、1450号室です。',
    'fifteen と fifty。sorry の後が正解',
    ['1450', '1415', '1540'],
    tg(3, 'service', 'literal', ['desk'], ['teen-ty', 'self-repair']),
    { ask: '部屋番号は？', focus: '1450',
      tts: 'Room fourteen fifteen. No, sorry, fourteen fifty. One-four-five-oh.',
      marks: [['say', '1415', 'fourteen fifTEEN'], ['say', '1450', 'fourteen FIFty']] }],
  ['ya-n-movie', 'kid-cat', "Movie's at 7:10, but there's like 20 minutes of trailers, so we're fine if we're there by half past.",
    '映画は7時10分だけど、予告が20分くらいあるから、7時半までに着けば大丈夫。',
    'half past＝7時半。開始の 7:10 ではない',
    ['7:30', '7:10', '7:20'],
    tg(48, 'friend', 'literal', [], ['clock', 'numbers']),
    { ask: '何時までに 着けばいい？', focus: 'half past', scene: 'street',
      tts: "Movie's at seven-ten, but there's like twenty minutes a' trailers, so we're fine if we're there by half past.",
      marks: [['say', '7:10', 'seven-ten'], ['say', '20', 'twenty'], ['say', 'of', "a'"]] }],
  ['ya-n-price', 'stitches', "It used to be 99 bucks. Now it's 129. For the exact same thing!",
    '前は99ドルだったのに、今は129ドル。まったく同じものなのに！',
    'one twenty-nine＝129。hundred を省略',
    ['$129', '$99', '$120'],
    tg(57, 'friend', 'attitude', [], ['numbers']),
    { ask: '今の 値段は？', focus: '129', scene: 'street',
      tts: "It useta be ninety-nine bucks. Now it's one twenty-nine. For the exact same thing!",
      marks: [['say', 'used to', 'useta'], ['say', '99', 'ninety-nine'], ['say', '129', 'one twenty-nine']] }]
];

/** やま's single-clip items. */
export const ITEMS: readonly Item[] = [...REPLY.map(item('reply')), ...MEAN.map(item('mean')), ...WORD.map(item('word')), ...NUM.map(item('num'))];

// ---- dialogues: gist and next (dialogues.ts's shape) ----------------------------------------------------------------

type L = readonly [who: RosterId, en: string, ja: string, tts?: string, marks?: readonly SoundMark[]];
interface DRow {
  id: string;
  type: Extract<ItemType, 'gist' | 'next'>;
  lines: readonly L[];
  ask?: string;
  /** The right one first. */
  choices: readonly string[];
  ja: string;
  note: string;
  focus: string;
  tags: Tags;
  scene?: SceneId;
}

const line = ([who, en, ja, tts, marks]: L): Line => ({ who, cast: castOf(who), en, ja, ...(tts && { tts }), ...(marks && { marks }) });

const dialogue = (r: DRow): Item => {
  const lines = r.lines.map(line);
  return {
    id: r.id, lv: LV, type: r.type, en: lines.map((l) => l.en).join(' '), ja: r.ja, speaker: lines[0].who, voice: lines[0].cast.slice(0, 2) as Accent,
    cast: lines[0].cast, choices: r.choices, answer: 0, focus: r.focus, ask: r.ask ?? NEXT_ASK, note: r.note, tags: r.tags, lines,
    ...(r.scene && { scene: r.scene })
  };
};

const DROWS: readonly DRow[] = [
  {
    id: 'dya-spoiler', type: 'next', focus: 'keep your eyes on the dog', scene: 'living',
    lines: [
      ['kid-cat', "Did you finish the show yet? 'Cause that ending, man.", 'あのドラマ見終わった？だってあのラスト、もうさ。',
        "Didja finish the show yet? 'Cause that ending, man.", [['say', 'Did you', 'didja']]],
      ['lily', "No! I'm on episode six. Don't you dare.", 'まだ！6話目なの。言ったら許さないから。'],
      ['kid-cat', "I'm just saying, keep your eyes on the dog.", '言っとくだけだけどさ、犬に注目しといて。']
    ],
    choices: ["Stop talking! La la la, I can't hear you!", "The dog's on episode six.", "Sure, I'll keep an eye on your dog."],
    ja: 'しゃべらないで！あーあー聞こえない！', note: 'keep your eyes on＝注目して。遠回しなネタバレ',
    tags: tg(52, 'friend', 'humour', [], ['yod'])
  },
  {
    id: 'dya-could-email', type: 'gist', ask: 'ふたりは 会議を どう 思っている？', focus: "could've been an email", scene: 'office',
    lines: [
      ['audie', 'So that was an hour of my life.', 'はい、人生の1時間が終了。'],
      ['stitches', "Yeah, that could've been an email. Did we even decide anything?", 'うん、メールで済んだよね。何か決まったっけ？',
        'Yeah, that coulda been an email. Did we even decide anything?', [['say', "could've", 'coulda']]],
      ['audie', 'We decided to have another meeting. On Thursday.', 'もう一回会議をすることが決まった。木曜に。']
    ],
    choices: ['It was a waste of time.', "It was useful, and they'll finish on Thursday.", 'They missed most of it.'],
    ja: '時間の無駄だった。', note: "could've been an email＝会議は不要だった",
    tags: tg(44, 'colleague', 'sarcasm', [], ['contraction'])
  },
  {
    id: 'dya-third-wheel', type: 'next', focus: "I'm good, thanks", scene: 'street',
    lines: [
      ['rosie', 'You should totally come to dinner with us on Friday!', '金曜、絶対一緒にディナー来なよ！'],
      ['maple', "With you and Matt? On your anniversary? I'm good, thanks.", 'あなたとマットと？記念日に？遠慮しとく。'],
      ['rosie', "Oh, come on, it'll be fun!", 'えー、いいじゃん、楽しいよ！', "Oh, c'mon, it'll be fun!", [['say', 'come on', "c'mon"]]]
    ],
    choices: ["I'm not being your third wheel. Have a great night, you two.", "Thanks! What time's the anniversary?", "Sure, I'll bring Matt along."],
    ja: 'お邪魔虫にはならないよ。二人で楽しんで。', note: "I'm good＝結構です。third wheel＝お邪魔虫",
    tags: tg(48, 'friend', 'refusal')
  },
  {
    id: 'dya-flatpack', type: 'gist', ask: '男性の 最後の ひとことは？', focus: 'right on schedule', scene: 'living',
    lines: [
      ['molly', 'Okay, which way does this piece go?', 'で、この部品はどっち向き？'],
      ['bob', "Says here, 'Easy assembly. Two people, thirty minutes.'", 'ここに書いてある。「簡単組み立て。二人で30分」。'],
      ['molly', "We've been at it for three hours.", 'もう3時間やってるんだけど。'],
      ['bob', 'So, right on schedule, then.', 'じゃあ、予定どおりってことで。']
    ],
    choices: ['A joke: the instructions were way off.', "He thinks they're doing well.", 'He wants to start again in thirty minutes.'],
    ja: '冗談：説明書の時間はまるで当てにならない。', note: 'right on schedule は皮肉。30分のはずが3時間',
    tags: tg(35, 'partner', 'sarcasm', [], ['ellipsis'])
  },
  {
    id: 'dya-pending', type: 'gist', ask: '男性は このあと どうする？', focus: 'still pending', scene: 'living',
    lines: [
      ['goldie', "Thanks for holding. I see the charge, but it's still pending, so I can't reverse it just yet.",
        'お待たせしました。請求は確認できますが、まだ保留中なので、今は取り消しできません。'],
      ['beau', "So I've been on hold for forty minutes to hear 'try again later'?", 'つまり、40分待たされて「また後で」ですか？'],
      ['goldie', 'In three to five business days, yes.', '3〜5営業日後に、はい。']
    ],
    choices: ['Wait a few days, then call again.', 'Get the charge reversed today.', 'Hold for five more minutes.'],
    ja: '数日待って、また電話する。', note: 'pending＝保留中。business days＝営業日',
    tags: tg(22, 'service', 'attitude', ['phone'])
  },
  {
    id: 'dya-dough', type: 'next', focus: 'knead the dough', scene: 'street',
    lines: [
      ['pietro', 'Why do bakers work so hard?', 'パン屋さんって、なんであんなに働くと思う？'],
      ['tammy', "Okay, I'll bite. Why?", 'はいはい、乗ってあげる。なんで？'],
      ['pietro', 'Because they knead the dough! Get it? Knead? Need?', 'パン生地をこねる（お金が要る）から！わかる？こねる、要る！']
    ],
    choices: ['That was terrible. Please never do that again.', 'Do they? I thought they started at five.', "I'd love some bread, thanks."],
    ja: 'ひどいダジャレ。二度とやめて。', note: 'knead（こねる）＝need、dough＝お金の俗語',
    tags: tg(52, 'friend', 'humour')
  },
  {
    id: 'dya-rent-bump', type: 'gist', ask: '大家さんが 伝えているのは？', focus: 'small adjustment', scene: 'door',
    lines: [
      ['tom-nook', "So, just a heads-up. With everything going up, we're looking at a small adjustment to the rent in April.",
        'ひとつ前もってお知らせを。物価高もあって、4月に家賃を少し調整させていただきます。',
        "So, just a heads-up. With everything goin' up, we're lookin' at a small adjustment to the rent in April.", [g('going'), g('looking')]],
      ['kabuki', 'Small like a coffee, or small like a car payment?', 'コーヒー1杯くらいの「少し」？それとも車のローンくらい？'],
      ['tom-nook', 'Eight percent. Ish.', '8%。くらい。']
    ],
    choices: ['The rent goes up about eight percent in April.', 'The rent goes down slightly in April.', "He's fixing something in April."],
    ja: '4月から家賃が約8%上がる。', note: 'adjustment＝値上げの婉曲。Ish＝だいたい',
    tags: tg(30, 'neighbour', 'hedge', [], ['idiom'])
  },
  {
    id: 'dya-shift-swap', type: 'next', focus: "who's counting", scene: 'office',
    lines: [
      ['zucker', "Any chance you'd swap your Saturday for my Tuesday? I'll owe you one.", '君の土曜と俺の火曜、替わってもらえない？借りにするから。'],
      ['pekoe', 'You already owe me, like, three.', 'もう3つくらい貸してるけど。'],
      ['zucker', "Four, technically. But who's counting?", '正確には4つ。でも、誰も数えてないでしょ？']
    ],
    choices: ["Me. I'm counting. Fine, but this is the last one.", "Tuesday's fine. It's only three.", 'Okay, so you owe me one less.'],
    ja: '私が数えてるの。いいけど、これが最後ね。', note: "who's counting?＝細かいことはいいでしょ",
    tags: tg(44, 'colleague', 'humour')
  },
  {
    id: 'dya-hang-left', type: 'gist', ask: '駅は どこ？', focus: 'Hang a left', scene: 'street',
    lines: [
      ['diana', 'Sorry, is Grand Central far from here?', 'すみません、グランド・セントラルはここから遠いですか？'],
      ['dom', "Nah, you're good. Hang a left at the light, go, like, three blocks, and it's going to be on your right. Can't miss it.",
        'いや、近いよ。信号を左に曲がって、3ブロックくらい行けば右側にある。すぐわかるよ。',
        "Nah, you're good. Hang a left at the light, go, like, three blocks, an' it's gonna be on your right. Can't miss it.",
        [['link', 'Hang a left'], ['say', 'and', "an'"], ['say', 'going to', 'gonna']]]
    ],
    choices: ['Left at the light, three blocks, on the right.', 'Right at the light, then three blocks.', 'Three blocks, then left at the light.'],
    ja: '信号を左、3ブロック先の右側。', note: 'hang a left＝左折。right は「右側」の意',
    tags: tg(58, 'stranger', 'literal', [], ['idiom', 'gonna', 'accent-exposure'])
  },
  {
    id: 'dya-celebration', type: 'next', focus: 'celebration cake', scene: 'living',
    lines: [
      ['poppy', 'I thought you were off sugar.', '砂糖やめたんじゃなかったっけ。'],
      ['beau', 'I am. This is a celebration cake. Totally different.', 'やめてるよ。これはお祝いのケーキ。全然別物。'],
      ['poppy', 'Right. And what are we celebrating?', 'へえ。で、何のお祝い？']
    ],
    choices: ['Uh... Tuesday?', "Yes, I'm totally off sugar.", "It's chocolate, I think."],
    ja: 'えーと…火曜日？', note: '苦しい言い訳への突っ込み。とっさの冗談で返す',
    tags: tg(35, 'partner', 'humour')
  },
  {
    id: 'dya-escalate', type: 'gist', ask: 'このあと どうなる？', focus: 'escalate this', scene: 'living',
    lines: [
      ['kicks', 'Okay, so have you tried turning it off and back on again?', 'では、電源を切って入れ直してみましたか？',
        "Okay, so have ya tried turnin' it off and back on again?", [['say', 'you', 'ya'], g('turning')]],
      ['tia', 'Three times. I also unplugged it, waited, and said a little prayer.', '3回。プラグも抜いて、待って、ちょっとお祈りもしました。'],
      ['kicks', 'Okay, um, let me escalate this to my supervisor.', 'えー、では上の者に引き継ぎますね。',
        'Okay, um, lemme escalate this to my supervisor.', [['say', 'let me', 'lemme']]]
    ],
    choices: ['Someone more senior takes over.', 'She turns it off again.', 'The problem is already fixed.'],
    ja: '上の担当者が引き継ぐ。', note: 'escalate＝上の担当に回す。prayer は冗談',
    tags: tg(22, 'service', 'humour', ['phone'], ['lemme'])
  },
  {
    id: 'dya-brave-hair', type: 'next', focus: "It's so... brave", scene: 'street',
    lines: [
      ['label', "Oh wow, your hair! It's so... brave.", 'わあ、その髪！すごく…勇気あるね。'],
      ['francine', "Brave? What's that supposed to mean?", '勇気？どういう意味？'],
      ['label', "No, no, I mean it's, like, a statement.", 'いやいや、なんていうか、主張があるっていうか。']
    ],
    choices: ['Right. So you hate it. Good to know.', "Thanks, I'm very brave.", "It means I'm making a statement at work."],
    ja: 'はいはい、つまり嫌いなのね。了解。', note: 'brave も statement も遠回しな否定',
    tags: tg(52, 'friend', 'attitude', [], ['ellipsis'])
  },
  {
    id: 'dya-chockers', type: 'gist', ask: '運転手が 言っているのは？', focus: 'a parking lot', scene: 'street',
    lines: [
      ['wolfgang', "Mind if I take the back roads? The freeway's a parking lot this time of day.", '裏道を行ってもいいかい？この時間、高速はまるで駐車場でね。'],
      ['gayle', "Whatever's fastest. I've got a flight at six.", 'いちばん早い道で。6時の飛行機なんです。'],
      ['wolfgang', "You got it. We'll get you there with time to spare.", '了解。余裕で着くよ。']
    ],
    choices: ["The freeway's jammed, so he'll go another way.", "He'll take the freeway since it's faster.", 'He needs to stop and park first.'],
    ja: '高速が混んでいるので別の道で行く。', note: 'a parking lot＝大渋滞のたとえ。駐車場ではない',
    tags: tg(4, 'service', 'literal', [], ['idiom'])
  },
  {
    id: 'dya-best-man', type: 'gist', ask: 'スピーチは どうだった？', focus: 'mentioned the ex', scene: 'living',
    lines: [
      ['lopez', "So how was the best man's speech?", 'で、ベストマンのスピーチはどうだった？'],
      ['reneigh', 'Well. It was long. And he mentioned the ex. Twice.', 'まあね。長かった。それに元カノの話。2回も。'],
      ['lopez', 'Ouch.', 'うわ。']
    ],
    choices: ['It went really badly.', 'It was short and sweet.', "It was about the best man's ex."],
    ja: 'ひどい出来だった。', note: 'Well. で溜め、事実を並べてさらっと酷評',
    tags: tg(53, 'friend', 'understatement', [], ['ellipsis'])
  },
  {
    id: 'dya-key-code', type: 'gist', ask: 'ガレージの 番号は？', focus: "It's 4-7-9-1", scene: 'living',
    lines: [
      ['agnes', "The garage code's 4-7-1-9. No, wait, that's the old one. It's 4-7-9-1.", 'ガレージの番号は4719。あ、違う、それは前のだ。4791です。',
        "The garage code's four-seven-one-nine. No, wait, that's the old one. It's four-seven-nine-one.",
        [['say', '4-7-1-9', 'four-seven-one-nine'], ['say', '4-7-9-1', 'four-seven-nine-one']]],
      ['hamlet', 'Got it. And can we park on the street?', '了解。路上に停めてもいいですか？'],
      ['agnes', 'Sure, just not Tuesday mornings. Street sweeping. They will tow you.', 'どうぞ。ただ火曜の朝はダメ。道路清掃があって、本当にレッカーされます。']
    ],
    choices: ['4791', '4719', '4179'],
    ja: '4791番。', note: 'No, wait の後が正しい番号。old one は前の番号',
    tags: tg(10, 'service', 'literal', ['phone'], ['self-repair', 'numbers'])
  },
  {
    id: 'dya-promotion', type: 'next', focus: 'Nope', scene: 'office',
    lines: [
      ['gulliver', 'Guess who got the promotion?', '誰が昇進したと思う？'],
      ['daisy-mae', 'No way! You?', 'うそ！あなた？'],
      ['gulliver', 'Nope. Greg. The guy who microwaves fish.', 'いや。グレッグ。電子レンジで魚をチンするあいつ。']
    ],
    choices: ['Oh no. Want to go get a drink?', 'Congrats! You totally deserve it.', 'Wait, does Greg like fish?'],
    ja: 'あらら。飲みに行く？', note: 'Nope で否定。お祝いは的外れ',
    tags: tg(57, 'colleague', 'attitude')
  },
  {
    id: 'dya-bar-seat', type: 'next', focus: "the bar's open", scene: 'cafe',
    lines: [
      ['judy', "It's going to be about a forty-five-minute wait for a table, but the bar's open if you're not picky.",
        'テーブルは45分ほど待ちますが、こだわらなければバー席が空いてます。',
        "It's gonna be about a forty-five-minute wait for a table, but the bar's open if you're not picky.", [['say', 'going to', 'gonna']]],
      ['cj', 'How long for the bar?', 'バーならどのくらい？']
    ],
    choices: ['You can sit there right now.', 'About forty-five minutes.', "We're not picky, thanks."],
    ja: '今すぐお座りいただけます。', note: 'open＝空いている。45分はテーブルの待ち時間',
    tags: tg(51, 'service', 'literal', [], ['gonna'])
  },
  {
    id: 'dya-quick-look', type: 'gist', ask: '上司の 頼みは 実際には？', focus: 'quick look', scene: 'office',
    lines: [
      ['flick', "No pressure, but if you could take a quick look at this over the weekend, that'd be awesome.",
        '無理しなくていいんだけど、週末にこれ、ちょっと目を通してもらえると最高なんだけど。'],
      ['molly', 'Sure. Like, a skim, or an actual read?', 'いいよ。ざっと見る感じ？ちゃんと読む感じ？'],
      ['flick', "It's forty pages. But they're short pages.", '40ページ。でも短いページだから。']
    ],
    choices: ['A lot of work over the weekend.', 'A quick five-minute job.', 'Nothing until Monday.'],
    ja: '週末にかなりの作業。', note: 'No pressure＋quick look は実は大仕事',
    tags: tg(42, 'boss', 'hedge')
  },
  {
    id: 'dya-capital', type: 'next', focus: 'in front of an Australian',
    lines: [
      ['wilbur', "Last question. What's the capital of Australia?", '最後の問題。オーストラリアの首都は？'],
      ['apollo', 'Sydney. Obviously.', 'シドニー。決まってる。'],
      ['wilbur', "You do realise you're saying that in front of an Australian?", 'オーストラリア人の前でそれ言う？']
    ],
    choices: ['Hang on... Canberra? Is it Canberra?', "Yes, I'm right in front of you.", "Sydney's the biggest, so yes."],
    ja: '待って…キャンベラ？キャンベラだっけ？', note: 'in front of an Australian＝答えが違うという皮肉',
    tags: tg(55, 'friend', 'humour', [], ['accent-exposure'])
  },
  {
    id: 'dya-parking', type: 'next', focus: 'attempt number four', scene: 'street',
    lines: [
      ['teddy', "Want me to park it? No offense, but we'd like to get home tonight.", '俺が停めようか？悪いけど、今夜中には帰りたいし。',
        "Want me ta park it? No offense, but we'd like to get home tonight.", [['say', 'to', 'ta']]],
      ['bea', "Wow. Okay. I've done this, like, a thousand times.", 'へえ。あっそう。これ、千回はやってるんですけど。'],
      ['teddy', "Yeah, and that's attempt number four.", 'うん、で、今のが4回目のトライね。']
    ],
    choices: ["Keep talking and you're walking home.", 'Thanks, a thousand would be great.', "Number four's the next street."],
    ja: 'それ以上言ったら歩いて帰ってもらうよ。', note: 'attempt number four＝今ので4回目というからかい',
    tags: tg(52, 'friend', 'humour')
  }
];

/** やま's dialogue items. */
export const DIALOGUES: readonly Item[] = DROWS.map(dialogue);
