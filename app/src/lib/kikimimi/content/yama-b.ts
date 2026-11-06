// ききみみ クイズ 「やま」 (S3, B2+; docs/curriculum.md §3), content set B: work, money and grown-up life at natural speed.
// A step past もり: denser turns, hedges and implied meaning in business and service talk, numbers buried in fast
// speech (rent, salary, tax, bills, splitting costs), and opinions on current-life topics (housing, remote work, AI at
// work, overtourism in Japan, health trends). Families (FAMILY): negotiation and persuasion, complaints that escalate,
// diplomatic disagreement, giving bad news, meetings, explaining processes, hedged recommendations, support
// escalations, medical explanations, contracts in plain speech, money, opinions.
//   Same shapes as bank4.ts and dialogues.ts: `en` shown (UK spelling for UK and AU voices), `tts` spoken when it
// differs (§9: reductions as said, every number written out), `note` the trap (≤ 40 字), `tags` the scenario (§5.5
// seed, register, pragmatics, conditions, features). Staging (scene, channel, sound marks) is written on each item
// here instead of staging.ts, so the integrator can fold it in as is. The right choice is authored first.
//   Speakers: bank4.ts CAST (this set's new villagers are there too). Level 6 (やま). American English and US voices by
// default (US vocabulary, idioms, spelling, dollars); about a tenth are UK or AU voices in standard English (no slang),
// tagged `accent-exposure`.
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Accent, CastId, Channel, Item, ItemType, Level, Line, SceneId, SoundMark, Tags } from '../bank.ts';
import { CAST } from '../bank4.ts';

/** The content family an item was written for (this set's coverage). */
export type Family = 'negotiate' | 'complain' | 'disagree' | 'bad-news' | 'meeting' | 'process' | 'recommend' | 'support' | 'medical' | 'contract' | 'money' | 'opinion';

/** やま's level. */
const LV: Level = 6;
const MEAN_ASK = 'つまり、どういうこと？';
const NEXT_ASK = 'つぎの ひとことは？';

const castOf = (who: RosterId): CastId => {
  const c = CAST[who];
  if (!c) throw new Error(`kikimimi: ${who} has no cast voice`);
  return c;
};

const tg = (seed: number, register: Tags['register'], pragmatic: Tags['pragmatic'], conditions?: Tags['conditions'], features?: Tags['features']): Tags =>
  ({ seed, register, pragmatic, ...(conditions?.length && { conditions }), ...(features?.length && { features }) });

type Extra = { tts?: string; focus?: string; ask?: string; scene?: SceneId; channel?: Channel; marks?: readonly SoundMark[] };
type Row = readonly [type: Exclude<ItemType, 'pic' | 'gist' | 'next'>, id: string, speaker: RosterId, en: string, ja: string, note: string, choices: readonly string[], tags: Tags, extra?: Extra];

const FAMILY_OF: Record<string, Family> = {};

const item = (family: Family) => ([type, id, speaker, en, ja, note, choices, tags, x = {}]: Row): Item => {
  FAMILY_OF[id] = family;
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

// ---- negotiation and persuasion ---------------------------------------------------------------------------------------

const NEGOTIATE: readonly Row[] = [
  ['reply', 'yb-throw-in', 'gulliver', "I can't go any lower on the rate, but I could throw in the installation for free.",
    'これ以上料金は下げられませんが、設置費を無料でお付けできます。 →「助かります。それを書面でいただけますか？」',
    'throw in＝おまけで付ける。料金自体は下がっていない',
    ['That helps. Could you put that in writing?', "So the rate's lower now?", "No thanks, I'll throw it out myself."],
    tg(41, 'service', 'refusal', [], ['idiom']), { scene: 'office' }],
  ['mean', 'yb-wiggle-room', 'judy', "Honestly, that's a little outside what we'd budgeted. If there's any wiggle room on your end, we'd love to make this work.",
    '正直、予算を少し超えていまして。そちらで多少融通がきくなら、ぜひ進めたいのですが。 → つまり、値下げしてほしい。',
    'budget を超える＋wiggle room＝値下げの要求',
    ['She wants a lower price before she agrees.', "She's happy to pay the price as it is.", "She's ending the negotiation."],
    tg(41, 'service', 'indirect', ['phone'], ['idiom', 'contraction']), { scene: 'office' }],
  ['mean', 'yb-final-offer', 'shep', "Look, I'll be straight with you. That's my final offer, and between you and me, there's another buyer coming at four.",
    'いいかい、正直に言うよ。これが最終提示だ。ここだけの話、4時に別の買い手が来るんだ。 → つまり、早く決めろと急かしている。',
    '別の買い手の話は決断を急がせる常套句',
    ["He's pushing you to decide right now.", "He'll drop the price if you wait.", "He's already sold it to someone else."],
    tg(7, 'stranger', 'deception', [], ['idiom']),
    { tts: "Look, I'll be straight with ya. That's my final offer, and between you and me, there's another buyer comin' at four.",
      scene: 'street', marks: [['say', 'you', 'ya'], g('coming')] }],
  ['reply', 'yb-match-quote', 'tangy', 'The company down the road quoted us $1,200 for the same job. Can you match that?',
    '近くの会社は同じ工事で1,200ドルの見積もりでした。同じ額にできますか？ →「そこまでは無理ですが、うちは古いものの撤去込みです。」',
    'match＝同額にする。距離や数字の繰り返しは罠',
    ['Not quite, but our price includes hauling the old stuff away.', "Yes, we're just down the road.", 'Twelve? We said twenty.'],
    tg(31, 'service', 'literal', [], ['numbers']),
    { tts: 'The company down the road quoted us twelve hundred for the same job. Can you match that?', scene: 'door',
      marks: [['say', '$1,200', 'twelve hundred']] }],
  ['num', 'yb-deposit-hold', 'hamlet', "We'll put a hold of $450 on your card, which drops to $150 if you take the full coverage.",
    'カードに450ドルの仮押さえをします。フル補償に入れば150ドルになります。',
    'drops to の後が補償ありの額。差額300は罠',
    ['$150', '$450', '$300'],
    tg(7, 'service', 'formula', ['desk'], ['numbers']),
    { ask: 'フル補償なら いくら押さえる？', focus: '$150', tts: "We'll put a hold of four-fifty on your card, which drops to one-fifty if you take the full coverage.",
      marks: [['say', '$450', 'four-fifty'], ['say', '$150', 'one-fifty']] }],
  ['mean', 'yb-sweeten', 'maple', 'If you can sign by Friday, I might be able to get my manager to sweeten the deal a little.',
    '金曜までにご契約いただければ、上司に掛け合って条件を少し良くできるかもしれません。 → つまり、早く決めれば値引きの可能性がある。',
    'might be able to は未確定。sweeten＝条件を良くする',
    ['A better offer may be possible if you decide soon.', "Her manager has already approved a discount.", 'The offer ends on Friday whatever happens.'],
    tg(29, 'service', 'hedge', ['phone'], ['idiom']), { scene: 'living' }],
  ['reply', 'yb-run-it-by', 'octavian', 'So, can we shake on twelve percent, or do you need to run it by your team first?',
    'では12パーセントで手を打ちますか、それともまずチームに確認が必要ですか？ →「確認は要りますが、前向きです。」',
    'run it by＝確認を取る。shake on＝合意する',
    ["I'd need to check with them, but I'm optimistic.", 'Yes, I run with my team every week.', 'We shook on it last year, actually.'],
    tg(41, 'colleague', 'literal', ['video'], ['yod', 'idiom']),
    { tts: "So, can we shake on twelve percent, or d'you need to run it by your team first?", scene: 'office',
      marks: [['say', 'do you', "d'you"], ['link', 'run it']] }]
];

// ---- complaints that escalate -----------------------------------------------------------------------------------------

const COMPLAIN: readonly Row[] = [
  ['reply', 'yb-third-time', 'pekoe', "This is the third time I've called about this, and every time I'm told someone'll call me back.",
    'この件で電話するのは3回目で、毎回折り返すと言われるんです。 →「申し訳ありません。解決するまで私が担当します。」',
    '「また折り返します」は火に油。担当を約束するのが正解',
    ["I'm so sorry. I'll stay on this with you until it's resolved.", "Of course, someone will call you back.", "That's right, it's your third time."],
    tg(22, 'service', 'attitude', ['phone'], ['contraction']), { scene: 'living' }],
  ['mean', 'yb-decision-maker', 'olivia', "I appreciate you're only following policy, but I'd like to speak to someone who can actually make a decision.",
    'あなたが規則に従っているだけなのはわかりますが、実際に判断できる方と話したいです。 → つまり、上の人を出してほしい。',
    'someone who can make a decision＝上司を出して',
    ['She wants to talk to a manager.', 'She agrees with the policy.', "She'll make the decision herself."],
    tg(26, 'service', 'indirect', [], ['contraction', 'accent-exposure']), { scene: 'street' }],
  ['mean', 'yb-generously', 'chief', "Right. So I ordered a king-size, and what's turned up is, generously, a large single.",
    'で、キングサイズを頼んだのに、届いたのは、甘く見ても大きめのシングルだ。 → つまり、ずっと小さいものが届いた。',
    'generously＝甘く見ても。届いたのは大幅に小さい',
    ['He got a much smaller bed than he ordered.', 'He got a bigger bed than he ordered.', "He's happy with what arrived."],
    tg(26, 'service', 'sarcasm', [], ['intonation', 'accent-exposure']), { scene: 'door' }],
  ['num', 'yb-overcharged', 'molly', "I was quoted $79 a month, but I've been charged $97 for three months now.",
    '月79ドルと言われたのに、もう3か月も97ドル請求されているんです。',
    '79と97の逆転に注意。差額18×3か月',
    ['$54', '$18', '$97'],
    tg(22, 'service', 'attitude', ['phone'], ['numbers', 'teen-ty']),
    { ask: '払いすぎた 合計は？', focus: '$97', tts: "I was quoted seventy-nine a month, but I've been charged ninety-seven for three months now.",
      scene: 'living', marks: [['say', '$79', 'SEVenty-nine'], ['say', '$97', 'NINEty-seven']] }],
  ['reply', 'yb-barely-warm', 'anchovy', 'Excuse me, sorry to be a pain, but this is barely warm in the middle.',
    'すみません、面倒をかけて申し訳ないんですが、これ真ん中がほとんど温かくないです。 →「失礼しました。すぐ作り直させます。」',
    'sorry to be a pain は前置き。本題は「ぬるい」',
    ["Oh, I'm so sorry. I'll have the kitchen redo it.", 'No pain, no gain!', 'Sure, the middle table is free.'],
    tg(27, 'service', 'indirect', ['cafe'], ['idiom']), { scene: 'cafe' }],
  ['word', 'yb-supposed-to', 'francine', "It was supposed to be here by Tuesday. It's now Friday.",
    '火曜までに届くはずだったんです。今日はもう金曜ですよ。',
    "supposed to は s'posta と縮む。d はほぼ聞こえない",
    ['supposed to', 'going to', 'due to'],
    tg(26, 'service', 'understatement', ['phone'], ['weak-form']),
    { tts: "It was s'posta be here by Tuesday. It's now Friday.", scene: 'living', marks: [['say', 'supposed to', "s'posta"]] }],
  ['mean', 'yb-before-midnight', 'kabuki', "Don't get me wrong, I love a little music. I'd just love it a lot more before midnight.",
    '誤解しないで、音楽は好きなんだ。ただ、夜中の12時前ならもっと好きなんだけどね。 → つまり、深夜の音楽をやめてほしい。',
    'ユーモアで包んだ騒音の苦情',
    ['Please stop playing music so late.', "He'd like to join in with the music.", 'Please play it louder before midnight.'],
    tg(32, 'neighbour', 'humour', [], ['contraction']), { scene: 'door' }]
];

// ---- diplomatic disagreement ------------------------------------------------------------------------------------------

const DISAGREE: readonly Row[] = [
  ['mean', 'yb-devils-advocate', 'bob', "Just to play devil's advocate, are we sure customers actually want this, or do we just want to build it?",
    'あえて反対の立場で言うけど、お客さんは本当にこれを求めてる？それとも僕らが作りたいだけ？ → つまり、計画に疑問がある。',
    "devil's advocate＝あえて反対意見を言う役",
    ['He doubts customers really need it.', 'He fully supports building it.', 'He knows customers asked for it.'],
    tg(40, 'colleague', 'hedge', [], ['idiom']), { scene: 'office' }],
  ['reply', 'yb-coming-from', 'tammy', "I see where you're coming from, but I'm not sure the numbers back that up.",
    'おっしゃることはわかりますが、数字がそれを裏付けているかは疑問です。 →「確かに。データを出して一緒に見ましょう。」',
    'see where you’re coming from は反論の前置き',
    ["Fair. Let me pull the data and we can look at it together.", "I'm coming from the Chicago office.", 'Yes, I backed it all up last night.'],
    tg(40, 'colleague', 'hedge', [], ['idiom']), { scene: 'office' }],
  ['mean', 'yb-due-respect', 'fang', "With all due respect, that's not what was agreed in the last meeting.",
    'お言葉ですが、それは前回の会議で合意した内容と違います。 → つまり、強く反対している。',
    'With all due respect の後は強い反論',
    ["He firmly disagrees with what's being said.", 'He respects the decision and agrees.', 'He missed the last meeting.'],
    tg(41, 'colleague', 'attitude', [], ['intonation']), { scene: 'office' }],
  ['word', 'yb-couldnt-agree', 'nana', "Honestly, I couldn't agree more, but that's not the part I'm worried about.",
    '正直、大賛成よ。でも私が心配しているのはそこじゃないの。',
    "couldn't agree more＝大賛成。could との差は n't",
    ["couldn't", 'could', "wouldn't"],
    tg(40, 'colleague', 'hedge', [], ['contraction', 'idiom']), { scene: 'office' }],
  ['reply', 'yb-park-that', 'reneigh', "Can we park that for now and come back to it once we've seen the budget?",
    'それはいったん置いておいて、予算を見てから戻りませんか？ →「いいですね。来週の議題に入れましょう。」',
    'park＝いったん保留する。駐車の話ではない',
    ["Sure, let's put it on next week's agenda.", "The parking lot's full, I'm afraid.", "I've already seen it, thanks."],
    tg(40, 'colleague', 'literal', [], ['idiom', 'contraction']), { scene: 'office' }],
  ['mean', 'yb-get-noticed', 'katt', "Purple for a law firm's logo? Well, it'll certainly get noticed.",
    '法律事務所のロゴに紫？ まあ、確かに目立つでしょうね。 → つまり、いいとは思っていない。',
    'certainly get noticed は婉曲な否定。褒めていない',
    ["She doesn't think it works.", "She thinks it's eye-catching and perfect.", 'She wants it to stand out even more.'],
    tg(42, 'colleague', 'understatement', [], ['intonation']), { scene: 'office' }],
  ['reply', 'yb-agree-to-disagree', 'beau', "I think we're going around in circles. Can we just agree to disagree and move on?",
    '堂々巡りになってる気がする。意見の違いは違いとして、先に進めない？ →「いいよ。両方の意見を議事録に残そう。」',
    'agree to disagree＝違いを認めて先へ。賛成ではない',
    ["Fine by me. Let's note both views in the minutes.", "Sure, I agree with you completely.", 'The circle chart is on slide three.'],
    tg(44, 'colleague', 'literal', ['video'], ['idiom']), { scene: 'office' }]
];

// ---- giving bad news --------------------------------------------------------------------------------------------------

const BAD_NEWS: readonly Row[] = [
  ['mean', 'yb-role-affected', 'tom-nook', "As you know, we've been reviewing the team structure, and unfortunately, your role is one of the ones affected.",
    'ご存じのとおりチーム体制を見直してきたが、残念ながら君の職もその対象になった。 → つまり、ポジションがなくなる。',
    'role is affected は「職がなくなる」の婉曲表現',
    ['Your job is being cut.', "You're being promoted to a new role.", 'The review will happen next year.'],
    tg(42, 'boss', 'indirect', [], ['contraction']), { scene: 'office' }],
  ['reply', 'yb-not-go-ahead', 'poppy', "Unfortunately, the board decided not to go ahead with the project, at least for this year.",
    '残念ながら、役員会は少なくとも今年はこのプロジェクトを進めないと決めました。 →「残念です。来年また動く可能性は？」',
    'not go ahead＝中止。at least で来年に余地',
    ["That's disappointing. Any chance it comes back next year?", 'Great, so when do we start?', "Go ahead, I'll wait."],
    tg(40, 'boss', 'formula', [], ['contraction']), { scene: 'office' }],
  ['num', 'yb-back-order', 'lucky', "The parts are on back order, so we're looking at six to eight weeks, not the two we said.",
    '部品が入荷待ちなので、お伝えした2週間ではなく、6〜8週間かかりそうです。',
    'not the two we said は前の約束。最長は8',
    ['8週間', '2週間', '6週間'],
    tg(31, 'service', 'literal', ['phone'], ['numbers', 'contrast']),
    { ask: '新しい見込みは 最長 何週間？', focus: 'six to eight weeks', tts: "The parts are on back order, so we're lookin' at six to eight weeks, not the two we said.",
      scene: 'living', marks: [g('looking'), ['stress', 'two']] }],
  ['mean', 'yb-different-direction', 'audie', 'Thanks so much for your time. The team really enjoyed meeting you, but we decided to go in a different direction.',
    'お時間をありがとうございました。チームもお会いできて喜んでいましたが、別の方向で進めることになりました。 → つまり、不採用。',
    'different direction＝不採用を伝える定型句',
    ["You didn't get the job.", "They'd like a second interview.", 'The team is moving to a new office.'],
    tg(46, 'official', 'formula', ['phone'], ['idiom']), { scene: 'living' }],
  ['reply', 'yb-bearer', 'teddy', "I hate to be the bearer of bad news, but your car's not going to be ready till Monday.",
    '悪い知らせで申し訳ないけど、車は月曜まで仕上がらないんです。 →「うわ。それまで代車はありますか？」',
    'bearer of bad news＝悪い知らせを伝える役',
    ['Ugh. Is there a loaner I could use till then?', "Thanks, I'll bear that in mind.", "Great, I'll pick it up today."],
    tg(31, 'service', 'formula', [], ['gonna', 'idiom']),
    { tts: "I hate to be the bearer of bad news, but your car's not gonna be ready till Monday.", scene: 'street',
      marks: [['say', 'going to', 'gonna']] }],
  ['word', 'yb-wont-be-able', 'henry', "I'm sorry, but we won't be able to fit you in until next month.",
    '申し訳ありませんが、来月までご予約をお取りできません。',
    "won't は want と別の母音。否定を聞き逃さない",
    ["won't", 'will', "wouldn't"],
    tg(26, 'service', 'refusal', ['phone'], ['contraction']), { scene: 'living' }],
  ['num', 'yb-rent-up', 'curt', 'Starting in April, rent goes up from ¥142,000 to ¥149,500 a month.',
    '4月から、家賃は月14万2千円から14万9千5百円に上がります。',
    'from→to の to の後が新しい家賃',
    ['149,500円', '142,000円', '7,500円'],
    tg(30, 'neighbour', 'literal', ['voicemail'], ['numbers', 'accent-exposure']),
    { ask: '4月からの 家賃は？', focus: '¥149,500', tts: 'Starting in April, rent goes up from a hundred and forty-two thousand to a hundred and forty-nine thousand five hundred a month.',
      scene: 'living', marks: [['say', '¥142,000', 'a hundred and forty-two thousand'], ['say', '¥149,500', 'a hundred and forty-nine thousand five hundred']] }]
];

// ---- meetings with competing opinions ---------------------------------------------------------------------------------

const MEETING: readonly Row[] = [
  ['mean', 'yb-hit-pause', 'lily', "Let's hit pause on pricing till legal's taken a look. No point locking anything in before then.",
    '価格は法務が見るまでいったん止めよう。それまでに何かを確定しても意味がないから。 → つまり、価格は法務の確認待ち。',
    'hit pause＝一時停止。lock in＝確定する',
    ['Pricing waits until legal has checked it.', 'Pricing has already been decided.', 'Legal will set the price.'],
    tg(40, 'colleague', 'literal', ['video'], ['idiom', 'contraction']), { scene: 'office' }],
  ['reply', 'yb-whos-owning', 'label', "So who's owning the follow-up with the vendor?",
    'で、業者とのフォローアップは誰が担当する？ →「私がやります。今日メールします。」',
    'owning＝担当する。所有の意味ではない',
    ["I can take that. I'll email them today.", 'The vendor owns the building.', 'We followed the vendor on social media.'],
    tg(44, 'colleague', 'literal', [], ['contraction']), { scene: 'office' }],
  ['word', 'yb-launch-date', 'daisy-mae', 'Before we wrap up, are we all on the same page about the launch date?',
    '終わる前に、発売日について全員認識は合ってる？',
    'launch と lunch は母音が違う。会議なら発売日',
    ['launch', 'lunch', 'last'],
    tg(40, 'colleague', 'literal', [], ['vowel', 'katakana', 'idiom']), { scene: 'office' }],
  ['mean', 'yb-table-it', 'wolfgang', "Let's table this until Thursday, when the whole team's there.",
    'この件は、全員がそろう木曜まで保留にしましょう。 → つまり、木曜まで先送りしたい。',
    '米国の table は「保留・後回し」。議題に出すではない',
    ['He wants to put it off until Thursday.', 'He wants to drop the topic for good.', 'He wants to decide it right now.'],
    tg(40, 'colleague', 'literal', [], ['idiom']), { scene: 'office' }],
  ['word', 'yb-could-have-email', 'kk-slider', "Wow. Ninety minutes, and it could've been one email.",
    'うわ。90分もかけて、メール1通で済んだのに。',
    "皮肉。coulda＝could have。should との差は頭の音",
    ["could've", "should've", "would've"],
    tg(44, 'colleague', 'sarcasm', [], ['contraction', 'intonation']),
    { tts: "Wow. Ninety minutes, and it coulda been one email.", scene: 'office', marks: [['say', "could've", 'coulda']] }],
  ['num', 'yb-headcount', 'stitches', "We're at 38 sign-ups, minus the 5 who canceled, plus the 3 from the Denver office.",
    '申込みは38人、キャンセルの5人を引いて、デンバー支社の3人を足して。',
    '38−5＋3＝36。最初の数字は罠',
    ['36人', '38人', '46人'],
    tg(44, 'colleague', 'literal', [], ['numbers']),
    { ask: '最終的な 人数は？', focus: '38 sign-ups', tts: "We're at thirty-eight sign-ups, minus the five who canceled, plus the three from the Denver office.",
      scene: 'office', marks: [['say', '38', 'thirty-eight'], ['stress', 'minus plus']] }],
  ['mean', 'yb-that-fly', 'sterling', "Noted. I'm not sure that'll fly with the client, but let's see what they say.",
    '了解。それがクライアントに通るかは怪しいけど、反応を見てみよう。 → つまり、受け入れられないと思っている。',
    'fly＝通用する。飛行機の話ではない',
    ["He doubts the client will accept it.", "He's sure the client will love it.", "He'll fly out to meet the client."],
    tg(41, 'colleague', 'hedge', [], ['idiom', 'contraction']), { scene: 'office' }]
];

// ---- explaining processes ---------------------------------------------------------------------------------------------

const PROCESS: readonly Row[] = [
  ['num', 'yb-business-days', 'flick', "Once we get the form, it's 3 to 5 business days for review, then another 10 for the card to arrive.",
    '書類が届いてから審査に3〜5営業日、さらにカード到着まで10営業日です。',
    '3〜5日＋10日。最長は5＋10＝15',
    ['15日', '10日', '13日'],
    tg(21, 'official', 'literal', ['phone'], ['numbers']),
    { ask: '最長で 何営業日？', focus: 'another 10', tts: "Once we get the form, it's three to five business days for review, then another ten for the card to arrive.",
      scene: 'living', marks: [['say', '3 to 5', 'three to five'], ['say', '10', 'ten']] }],
  ['reply', 'yb-make-sense', 'cj', 'So you scan it, tag it, and then it goes to finance for sign-off. Does that make sense?',
    'スキャンしてタグを付けたら、経理の承認に回る。わかった？ →「だいたい。経理で止まったら誰に催促すれば？」',
    'Does that make sense? は確認。質問で返してよい',
    ['Mostly. Who do I bug if finance sits on it?', 'Yes, it makes sense to sign off now.', "No, I've never been to finance."],
    tg(43, 'colleague', 'literal', [], ['ellipsis']), { scene: 'office' }],
  ['mean', 'yb-skip-step', 'faith', "You can skip step four, technically. I just wouldn't, unless you enjoy starting again from scratch.",
    '手順4は一応飛ばせるよ。私ならやらないけどね、一からやり直すのが好きなら別だけど。 → つまり、手順4は飛ばすな。',
    "technically＝一応。I wouldn't＝やめとけ",
    ["Don't skip step four.", 'Step four is optional and harmless.', 'Starting again is quicker.'],
    tg(43, 'colleague', 'humour', [], ['contraction', 'accent-exposure']), { scene: 'office' }],
  ['word', 'yb-fill-out', 'rosie', 'Just fill out the top half and leave the rest to us.',
    '上半分だけ記入して、残りはこちらに任せてください。',
    '書類は米で fill out。fill‿out とつながる',
    ['fill out', 'fill in', 'feel out'],
    tg(24, 'service', 'literal', [], ['flap', 'weak-form']),
    { tts: "Just fill out the top half 'n' leave the rest to us.", scene: 'pharmacy', marks: [['link', 'fill out'], ['say', 'and', "'n'"]] }],
  ['reply', 'yb-working-days', 'agnes', 'Your new card should arrive in seven to ten business days, but you can start using it in the app today.',
    '新しいカードは7〜10営業日で届きますが、アプリなら今日から使えます。 →「へえ、いいですね。じゃあ、それまではスマホで払えるんですね？」',
    'business days＝営業日。アプリでは先に使える',
    ['Oh, nice. So I can pay with my phone till then?', "Sure, I'll show you the card.", 'No, I only work weekdays.'],
    tg(21, 'service', 'formula', [], ['numbers']), { scene: 'street' }],
  ['num', 'yb-check-in-closes', 'ken', "Check-in closes 45 minutes before departure, so with a 7:15 flight, you'll want to be through by 6:30.",
    'チェックインは出発45分前に締め切りなので、7時15分の便なら6時半までに済ませてください。',
    '7:15の45分前＝6:30。数字三つの役割を分ける',
    ['6:30', '7:15', '6:45'],
    tg(1, 'service', 'literal', ['desk'], ['numbers', 'wanna']),
    { ask: '何時までに 手続き？', focus: '6:30', tts: "Check-in closes forty-five minutes before departure, so with a seven-fifteen flight, you'll wanna be through by six-thirty.",
      scene: 'gate', marks: [['say', '45', 'forty-five'], ['say', '7:15', 'seven-fifteen'], ['say', 'want to', 'wanna'], ['say', '6:30', 'six-thirty']] }]
];

// ---- hedged recommendations -------------------------------------------------------------------------------------------

const RECOMMEND: readonly Row[] = [
  ['mean', 'yb-sit-tight', 'lopez', "I mean, it's your call, but if it were my money, I'd probably sit tight till the new model's out.",
    'まあ決めるのは君だけど、僕のお金なら新型が出るまでじっと待つかな。 → つまり、今は買わずに待つのがいい。',
    "it's your call の後が本音。sit tight＝じっと待つ",
    ['He suggests waiting for the new model.', 'He thinks you should buy it now.', "He's offering to lend you money."],
    tg(26, 'friend', 'hedge', [], ['idiom', 'contraction']), { scene: 'street' }],
  ['word', 'yb-might-as-well', 'bunnie', 'Honestly, you might as well wait for the sale at this point.',
    '正直、ここまで来たらセールを待ったほうがいいよ。',
    'might as well＝〜したほうがまし。as は弱く縮む',
    ['might as well', 'may as well', 'might well'],
    tg(26, 'friend', 'hedge', [], ['weak-form', 'idiom']),
    { tts: "Honestly, you might's well wait for the sale at this point.", scene: 'street', marks: [['say', 'might as well', "might's well"]] }],
  ['mean', 'yb-double-check', 'tia', 'You might want to double-check that figure before it goes to the client.',
    'クライアントに出す前に、その数字をもう一度確認したほうがいいかもね。 → つまり、間違っていると思う。',
    'might want to＝やんわりした指示。誤りの示唆',
    ['She thinks the figure is probably wrong.', 'She has checked it and it\'s correct.', 'She wants to send it herself.'],
    tg(42, 'colleague', 'indirect', [], ['wanna']),
    { tts: 'You might wanna double-check that figure before it goes to the client.', scene: 'office', marks: [['say', 'want to', 'wanna']] }],
  ['word', 'yb-ought-to', 'genji', 'You ought to book your tickets early. They tend to sell out by Friday.',
    'チケットは早めに取ったほうがいいよ。金曜には売り切れがちだから。',
    'oughta＝ought to。gotta（got to）と聞き分け',
    ['ought to', 'got to', 'have to'],
    tg(17, 'friend', 'hedge', [], ['weak-form', 'gotta', 'accent-exposure']),
    { tts: 'You oughta book your tickets early. They tend to sell out by Friday.', marks: [['say', 'ought to', 'oughta']] }],
  ['reply', 'yb-go-for', 'tammy', 'If you had to pick one, the ryokan in Hakone or the hotel in Yokohama, which would you go for?',
    'どちらか一つ選ぶなら、箱根の旅館と横浜のホテル、どっちにする？ →「予算が許すなら箱根。一生に一度だし。」',
    'go for＝選ぶ。二択には片方を答える',
    ["Hakone, if the budget stretches. It's a once-in-a-lifetime thing.", 'I went to Yokohama last spring.', "I'll pick you up at the hotel."],
    tg(3, 'friend', 'literal', [], ['contraction']), { scene: 'living' }],
  ['mean', 'yb-too-soon', 'zucker', "It's not that the plan's bad. I just think we're trying to do too much, too soon.",
    '計画が悪いってわけじゃない。ただ、急いで欲張りすぎてる気がするんだ。 → つまり、規模を縮めてゆっくりやるべき。',
    "It's not that ~. I just…＝本音は後半",
    ['They should do less, more slowly.', 'He thinks the plan is bad.', 'He wants to move faster.'],
    tg(40, 'colleague', 'hedge', [], ['contraction']), { scene: 'office' }]
];

// ---- customer support escalations -------------------------------------------------------------------------------------

const SUPPORT: readonly Row[] = [
  ['reply', 'yb-escalated', 'marina', "I've escalated this to our technical team. They usually respond within 48 hours.",
    '技術チームに引き継ぎました。通常48時間以内に返答があります。 →「それまでに連絡がなかったら？」',
    'escalate＝上に回す。まだ解決していない',
    ["And if I don't hear back by then?", "Thanks, I'll take the escalator.", "Great, so it's fixed now?"],
    tg(22, 'service', 'formula', ['phone'], ['numbers']),
    { tts: "I've escalated this to our technical team. They usually respond within forty-eight hours.", scene: 'living',
      marks: [['say', '48', 'forty-eight']] }],
  ['mean', 'yb-authorize', 'orville', "Unfortunately, that falls outside what I'm able to authorize. But I can put in a request for you.",
    'あいにく、それは私の権限を超えています。ですが、代わりに申請を出すことはできます。 → つまり、自分では決められないが上に頼める。',
    'outside what I can authorize＝権限外。依頼は可',
    ["He can't approve it, but he can ask someone who can.", 'The request is already approved.', 'He refuses to help at all.'],
    tg(22, 'service', 'refusal', ['phone'], ['contraction']), { scene: 'living' }],
  ['num', 'yb-double-seven', 'ken', "Your case number is 507713. That's two sevens in the middle.",
    'お客様の受付番号は507713です。真ん中は7が二つです。',
    'two sevens＝77。0は「オー」と読む',
    ['507713', '507173', '570713'],
    tg(21, 'service', 'literal', ['phone'], ['numbers']),
    { ask: '受付番号は？', focus: '507713', tts: "Your case number is five-oh-seven, seven-one-three. That's two sevens in the middle.",
      scene: 'living', marks: [['say', '507713', 'five-oh-seven, seven-one-three']] }],
  ['reply', 'yb-on-hold', 'lily', "I'm going to have to put you on hold for a moment while I check with my supervisor. Is that OK?",
    '上の者に確認しますので、少々保留にさせていただいてもよろしいですか？ →「いいですけど、今度は切らないでくださいね。」',
    'on hold＝保留。前回切られた不満を添える',
    ["That's fine, but please don't cut me off this time.", "No, I'm not holding anything.", "Sure, my supervisor's out today."],
    tg(22, 'service', 'formula', ['phone'], ['gonna']),
    { tts: "I'm gonna have to put you on hold for a moment while I check with my supervisor. Is that OK?", scene: 'living',
      marks: [['say', 'going to', 'gonna']] }],
  ['mean', 'yb-goodwill', 'gayle', "I can't waive the late fee completely, but as a courtesy, I can knock it down to half.",
    '延滞料を全額免除することはできませんが、特別に半額まで下げられます。 → つまり、延滞料は半額になる。',
    'as a courtesy＝特別対応。knock down＝下げる',
    ['You pay half the late fee.', 'You pay no late fee at all.', 'You pay the full late fee.'],
    tg(22, 'service', 'refusal', ['phone'], ['contraction', 'idiom']), { scene: 'living' }],
  ['word', 'yb-hasnt-gone', 'kid-cat', "Your payment hasn't gone through on our end.",
    'こちらでは、お支払いがまだ完了していません。',
    "hasn't の t はほぼ消える。n の有無で判断",
    ["hasn't", 'has', 'had'],
    tg(21, 'service', 'literal', ['phone'], ['contraction']),
    { tts: "Your payment hasn' gone through on our end.", scene: 'living', marks: [['drop', "hasn't", 't']] }],
  ['reply', 'yb-last-four', 'tangy', "Before I can do anything, I'll just need you to verify the last four digits of the card.",
    '手続きの前に、カード番号の下4桁で本人確認をお願いします。 →「はい、6018で終わります。」',
    'verify＝本人確認。下4桁を言うのが答え',
    ['Sure, it ends in 6018.', "Four? I've only got one card.", 'Yes, the card is in my name.'],
    tg(21, 'service', 'formula', ['phone'], ['numbers']), { scene: 'living' }]
];

// ---- medical explanations ---------------------------------------------------------------------------------------------

const MEDICAL: readonly Row[] = [
  ['num', 'yb-max-dose', 'pekoe', 'Take 2 tonight, then 1 every 8 hours, but no more than 6 in 24 hours.',
    '今夜2錠、その後は8時間ごとに1錠。ただし24時間で6錠までです。',
    'every 8 hours は間隔。上限は no more than の後',
    ['6錠', '8錠', '2錠'],
    tg(13, 'service', 'literal', [], ['numbers']),
    { ask: '24時間の 上限は？', focus: 'no more than 6', tts: 'Take two tonight, then one every eight hours, but no more than six in twenty-four hours.',
      scene: 'pharmacy', marks: [['say', '24', 'twenty-four'], ['stress', '6']] }],
  ['mean', 'yb-rule-out', 'nana', "It's probably nothing to worry about, but I'd like to rule a few things out, so I'm going to order some blood work.",
    'たぶん心配いりませんが、いくつか可能性を除外したいので、血液検査をしましょう。 → つまり、念のため検査する。',
    'rule out＝可能性を消す。blood work＝血液検査',
    ["It's a blood test, just to be safe.", 'The doctor has found something serious.', 'No tests are needed.'],
    tg(15, 'service', 'hedge', [], ['idiom', 'gonna']),
    { tts: "It's probably nothing to worry about, but I'd like to rule a few things out, so I'm gonna order some blood work.", marks: [['say', 'going to', 'gonna']] }],
  ['word', 'yb-tell-them', 'cj', "Call the office and tell them it's been three days, and ask for something stronger.",
    '病院に電話して、もう3日経つって伝えて、もっと強い薬を頼みなよ。',
    "'em＝them。him（'im）とは母音で区別",
    ['them', 'him', 'her'],
    tg(14, 'friend', 'literal', [], ['weak-form']),
    { tts: "Call the office and tell 'em it's been three days, and ask for something stronger.", scene: 'living', marks: [['say', 'them', "'em"]] }],
  ['word', 'yb-mustnt-drive', 'mabel', "You mustn't drive for twenty-four hours after the sedation.",
    '鎮静剤のあと24時間は運転してはいけません。',
    "mustn't＝禁止。真ん中の t は発音しない",
    ["mustn't", 'must', "needn't"],
    tg(15, 'service', 'literal', [], ['contraction', 'weak-form', 'accent-exposure']),
    { tts: "You mussn't drive for twenty-four hours after the sedation.", scene: 'pharmacy', marks: [['say', "mustn't", 'MUSS-nt']] }],
  ['word', 'yb-sprain', 'dom', "Good news: it's a sprain rather than a break, so you'll be back on your feet in a couple of weeks.",
    '骨折じゃなくて捻挫だから、2週間くらいで歩けるようになるよ。',
    'sprain＝捻挫。strain（筋の損傷）は sp/st で区別',
    ['sprain', 'strain', 'pain'],
    tg(17, 'friend', 'literal', [], ['contrast', 'idiom'])],
  ['reply', 'yb-running-behind', 'bea', "The doctor's running about forty minutes behind. Are you okay to wait, or would you rather reschedule?",
    '先生は40分ほど遅れています。お待ちになりますか、それとも予約を取り直しますか？ →「待ちます。でもちょっとコーヒーを買いに出てもいいですか？」',
    'running behind＝予定より遅れている。走る話ではない',
    ['I can wait, but could I run out and grab a coffee?', 'Forty? I booked for four.', 'No, the doctor ran this morning.'],
    tg(20, 'service', 'literal', [], ['idiom', 'contraction']), { scene: 'pharmacy' }],
  ['mean', 'yb-cut-back', 'marina', "I'm not saying cut it out altogether. Just maybe not three coffees before lunch.",
    '完全にやめろとは言ってないの。ただ、お昼前に3杯はどうかなって。 → つまり、量を減らして。',
    'cut out＝完全にやめる。言っているのは「減らせ」',
    ['Drink less coffee, not none.', 'Stop drinking coffee completely.', 'Only drink coffee after lunch.'],
    tg(15, 'service', 'hedge', [], ['idiom', 'contrast']), { scene: 'cafe' }]
];

// ---- contracts in plain speech ----------------------------------------------------------------------------------------

const CONTRACT: readonly Row[] = [
  ['mean', 'yb-notice-period', 'henry', "You're free to move out, of course. It's just that the lease requires sixty days' notice, so we'd need that in writing.",
    'もちろん退去は自由です。ただ賃貸契約で60日前の通知が必要なので、書面でいただきたいんです。 → つまり、60日前に書面で通知が必要。',
    'notice＝事前の通知。すぐ出られるわけではない',
    ["You must give sixty days' written notice.", 'You can move out whenever you like.', 'The lease ends in sixty days.'],
    tg(30, 'neighbour', 'formula', ['phone'], ['contraction']), { scene: 'living' }],
  ['reply', 'yb-small-print', 'sterling', "Read the fine print, man. There's a twelve-month minimum, and they charge you to leave early.",
    '細かい規約を読みなよ。最低12か月で、途中解約は料金を取られるぞ。 →「本当？途中解約の料金はいくら？」',
    'fine print＝細則。文字の大きさの話ではない',
    ['Seriously? How much is the early cancellation fee?', "I can't read print that small.", "Twelve? I've only got eleven."],
    tg(29, 'friend', 'literal', [], ['idiom'])],
  ['num', 'yb-break-fee', 'octavian', "Break the lease in the first year and there's a fee of two months' rent, so $3,800.",
    '1年以内に契約を解除すると家賃2か月分の違約金、つまり3,800ドルかかります。',
    'thirty-eight hundred＝3,800。bucks＝ドル',
    ['$3,800', '$1,900', '$3,000'],
    tg(30, 'neighbour', 'literal', [], ['numbers', 'idiom']),
    { ask: '違約金は いくら？', focus: '$3,800', tts: "Break the lease in the first year and there's a fee of two months' rent, so thirty-eight hundred bucks.",
      scene: 'living', marks: [['say', '$3,800', 'thirty-eight hundred bucks']] }],
  ['mean', 'yb-not-liable', 'ken', "If anything gets broken while we're moving it, we're not liable unless you've bought the extra coverage.",
    '運搬中に何か壊れても、追加の補償に入っていなければ当社は責任を負いません。 → つまり、補償なしなら壊れても弁償なし。',
    'not liable＝責任を負わない。coverage＝補償',
    ["Without extra coverage, they won't pay for damage.", 'They pay for any damage.', 'The extra coverage is already included.'],
    tg(33, 'service', 'literal', ['phone'], ['contraction']), { scene: 'living' }],
  ['word', 'yb-deductions', 'tom-nook', "You'll get your deposit back, minus any deductions for damage.",
    '敷金は返ってくるよ。傷みの分を差し引いてね。',
    'deductions＝差し引き。reductions と頭の音で区別',
    ['deductions', 'reductions', 'deduction'],
    tg(30, 'neighbour', 'literal', [], ['ending'])],
  ['reply', 'yb-sign-today', 'fang', "We'd need you to sign today to lock in this rate.",
    'この料金を確保するには、本日ご署名いただく必要があります。 →「先に契約書を持ち帰って読みたいです。」',
    '即日署名の圧力。持ち帰るのが賢い返し',
    ["I'd rather take the contract home and read it first.", "Sure, I'll lock the door on my way out.", 'No, I signed up yesterday.'],
    tg(7, 'service', 'formula', [], ['contraction', 'idiom']), { scene: 'office' }]
];

// ---- money: rent, salary, tax, bills, splitting -----------------------------------------------------------------------

const MONEY: readonly Row[] = [
  ['num', 'yb-split-four', 'audie', 'The Airbnb was $1,140 for three nights, plus a $60 cleaning fee, split four ways.',
    'Airbnbは3泊で1,140ドル、プラス清掃費60ドル。それを4人で割り勘ね。',
    '1,140＋60＝1,200を4人で。285は清掃費抜き',
    ['$300', '$285', '$1,200'],
    tg(27, 'friend', 'literal', [], ['numbers']),
    { ask: '1人 いくら？', focus: 'split four ways', tts: 'The Airbnb was eleven-forty for three nights, plus a sixty-dollar cleaning fee, split four ways.',
      scene: 'cafe', marks: [['say', '$1,140', 'eleven-forty'], ['say', '$60', 'sixty-dollar']] }],
  ['num', 'yb-take-home', 'pietro', "On paper it's ¥380,000, but after tax and insurance I take home about ¥290,000.",
    '額面は38万円だけど、税金と保険を引くと手取りは29万円くらいなんだ。',
    'on paper＝額面。take home＝手取り',
    ['29万円', '38万円', '9万円'],
    tg(57, 'friend', 'attitude', [], ['numbers', 'idiom']),
    { ask: '手取りは？', focus: '¥290,000', tts: "On paper it's three hundred and eighty thousand, but after tax and insurance I take home about two hundred and ninety thousand.",
      scene: 'cafe', marks: [['say', '¥380,000', 'three hundred and eighty thousand'], ['say', '¥290,000', 'two hundred and ninety thousand']] }],
  ['num', 'yb-electric-bill', 'molly', "The electric bill's ¥11,800 this month, almost double last month's ¥6,200. It's the heater.",
    '今月の電気代は1万1,800円で、先月の6,200円のほぼ倍。暖房のせいだね。',
    'almost double は概算。実額は最初の数字',
    ['11,800円', '6,200円', '12,400円'],
    tg(35, 'partner', 'literal', [], ['numbers']),
    { ask: '今月の 電気代は？', focus: '¥11,800', tts: "The electric bill's eleven thousand eight hundred this month, almost double last month's six thousand two hundred. It's the heater.",
      scene: 'living', marks: [['say', '¥11,800', 'eleven thousand eight hundred'], ['say', '¥6,200', 'six thousand two hundred']] }],
  ['word', 'yb-wouldve-split', 'rosie', "Oh, come on, I would've split it with you if you'd just asked.",
    'もう、言ってくれれば割り勘にしたのに。',
    "woulda＝would have。could／should は頭の音で区別",
    ["would've", "could've", "should've"],
    tg(27, 'friend', 'attitude', [], ['contraction', 'weak-form']),
    { tts: "Oh, come on, I woulda split it with ya if you'd just asked.", scene: 'cafe', marks: [['say', "would've", 'woulda'], ['say', 'you', 'ya']] }],
  ['mean', 'yb-on-me', 'stitches', "You got the last round, so this one's on me. And no, I'm not taking no for an answer.",
    'この前は君がおごったから、今回は僕が払う。断ってもだめだよ。 → つまり、絶対に自分が払う。',
    "this one's on me＝おごる。断らせない",
    ["He insists on paying this time.", 'He wants you to pay again.', "He's turning down a drink."],
    tg(27, 'friend', 'formula', [], ['idiom', 'contraction']), { scene: 'cafe' }],
  ['num', 'yb-base-salary', 'judy', 'The base is $92K, with up to 15% bonus, so in a good year, just over $105K.',
    '基本給は9万2千ドル、ボーナスは最大15％。いい年なら10万5千ドルを少し超えるわ。',
    'base＝基本給。105Kはボーナス込みの額',
    ['$92,000', '$105,000', '$15,000'],
    tg(46, 'official', 'literal', ['phone'], ['numbers']),
    { ask: '基本給は？', focus: '$92K', tts: 'The base is ninety-two K, with up to fifteen percent bonus, so in a good year, just over a hundred and five.',
      scene: 'living', marks: [['say', '$92K', 'ninety-two K'], ['say', '15%', 'fifteen percent'], ['say', '$105K', 'a hundred and five']] }],
  ['word', 'yb-didnt-include', 'gulliver', "Just so you know, the quote didn't include tax or delivery.",
    '念のためですが、見積もりには税金と配送料が含まれていませんでした。',
    "didn't の t は弱い。過去の否定を聞き逃さない",
    ["didn't", 'did', "doesn't"],
    tg(33, 'service', 'literal', ['phone'], ['contraction']),
    { tts: "Just so you know, the quote didn' include tax or delivery.", scene: 'living', marks: [['drop', "didn't", 't']] }]
];

// ---- opinions on current-life topics ----------------------------------------------------------------------------------

const OPINION: readonly Row[] = [
  ['mean', 'yb-in-theory', 'beau', "Remote work's great in theory. In practice, I end up answering emails at eleven at night.",
    'リモートワークは理屈では最高。でも実際は、夜11時にメールに返信する羽目になる。 → つまり、仕事と私生活の境がなくなる。',
    'in theory／in practice の対比。後半が本音',
    ['Working from home blurs work and free time.', 'He loves working late at night.', 'He prefers the office in every way.'],
    tg(65, 'colleague', 'attitude', [], ['contrast', 'contraction']), { scene: 'office' }],
  ['reply', 'yb-cant-face', 'katt', "Kyoto's beautiful, but honestly, I can't face the crowds at Fushimi Inari again.",
    '京都はすてきだけど、正直、伏見稲荷の人混みはもう勘弁。 →「夜明けに行きなよ。7時前ならほぼ誰もいないよ。」',
    "can't face＝気が重くて無理。顔の話ではない",
    ["Go at dawn. It's practically empty before seven.", 'Face the crowds? Sure, take a photo.', "I've never been to Fushimi Inari either."],
    tg(12, 'friend', 'attitude', [], ['idiom', 'can-cant']), { scene: 'street' }],
  ['mean', 'yb-anywhere-near', 'goldie', "AI's great for a first draft. I just wouldn't let it anywhere near the final version.",
    'AIは下書きには最高。ただ、最終版には絶対に触らせないね。 → つまり、AIは下書き用だけ。',
    "wouldn't let it anywhere near＝絶対に任せない",
    ['She only trusts AI for first drafts.', 'She trusts AI with the final version.', "She doesn't use AI at all."],
    tg(43, 'colleague', 'attitude', [], ['idiom', 'contraction']), { scene: 'office' }],
  ['reply', 'yb-saitama-or-central', 'bob', 'Would you rather have a bigger place out in Saitama, or something tiny in central Tokyo?',
    '埼玉の広めの家と、都心の狭い家、どっちがいい？ →「狭くても都心。長い通勤はいやだな。」',
    '二択の質問に Yes／No で答える罠',
    ["Tiny and central. I'd hate a long commute.", "I'd rather have a bigger salary.", 'Yes, I would.'],
    tg(36, 'friend', 'literal', [], ['contraction']), { scene: 'living' }],
  ['mean', 'yb-good-on-you', 'teddy', "Cold plunges? Hey, if it works for you, more power to you. I'll stick to a hot bath.",
    '冷水浴？まあ、君に合うならどうぞご自由に。僕は熱い風呂で十分。 → つまり、自分はやる気がない。',
    'more power to you＝どうぞご自由に。自分はやらない',
    ["He's not interested in trying it.", "He's going to try one soon.", 'He thinks cold plunges are dangerous.'],
    tg(18, 'friend', 'attitude', [], ['idiom'])],
  ['num', 'yb-tourists', 'frett', 'Apparently something like 36 million tourists came last year, and half of them were in my neighborhood konbini.',
    '去年は観光客が3,600万人くらい来たらしいよ。で、その半分がうちの近所のコンビニにいた。',
    'half はジョーク。数字は thirty-six million',
    ['3,600万人', '1,800万人', '3,000万人'],
    tg(12, 'friend', 'humour', [], ['numbers', 'teen-ty']),
    { ask: '観光客は 何人？', focus: '36 million', tts: 'Apparently somethin\' like thirty-six million tourists came last year, and half of them were in my neighborhood konbini.',
      scene: 'street', marks: [g('something'), ['say', '36', 'thirty-six']] }]
];

// ---- dialogues ----------------------------------------------------------------------------------------------------------

type L = readonly [who: RosterId, en: string, ja: string, tts?: string, marks?: readonly SoundMark[]];
interface DRow {
  id: string;
  family: Family;
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
  scene?: SceneId;
  channel?: Channel;
}

const line = ([who, en, ja, tts, marks]: L): Line => ({ who, cast: castOf(who), en, ja, ...(tts && { tts }), ...(marks && { marks }) });

const dialogue = (r: DRow): Item => {
  FAMILY_OF[r.id] = r.family;
  const lines = r.lines.map(line);
  return {
    id: r.id, lv: LV, type: r.type, en: lines.map((l) => l.en).join(' '), ja: r.ja, speaker: lines[0].who, voice: lines[0].cast.slice(0, 2) as Accent,
    cast: lines[0].cast, choices: r.choices, answer: 0, focus: r.focus, ask: r.ask ?? NEXT_ASK, note: r.note, tags: r.tags, lines,
    ...(r.scene && { scene: r.scene }), ...(r.channel && { channel: r.channel })
  };
};

const DROWS: readonly DRow[] = [
  {
    id: 'dyb-scope-creep', family: 'negotiate', type: 'gist', ask: '追加の 仕事は どうなる？', focus: 'outside the original scope',
    lines: [
      ['judy', "While you're at it, could you also add a booking page? Should be quick, right?", 'ついでに予約ページも追加してもらえます？すぐですよね？'],
      ['lopez', "Happy to, but that's outside the original scope, so it'd be a separate quote.", '喜んで。ただ当初の範囲外なので、別のお見積もりになります。'],
      ['judy', 'Ah. Roughly what are we talking?', 'あら。だいたいどのくらいですか？'],
      ['lopez', "Ballpark, another three or four days' work. I'll send something over tonight.", 'ざっと3、4日分の作業です。今夜お送りします。']
    ],
    choices: ["It'll cost extra, and he'll send a quote.", "He'll add it for free because it's quick.", "He'll finish the page tonight."],
    ja: '追加料金がかかり、見積もりが送られてくる。', note: 'scope＝契約範囲。tonight は見積もりの送付',
    tags: tg(41, 'service', 'refusal', ['phone'], ['idiom']), scene: 'office'
  },
  {
    id: 'dyb-supervisor', family: 'complain', type: 'next', focus: 'realistically',
    lines: [
      ['tia', "I've been on hold for forty minutes, and now you're telling me you can't issue a refund?", '40分も保留にされて、今度は返金できないって言うんですか？'],
      ['lily', 'I completely understand your frustration. What I can do is escalate it to a supervisor today.', 'お怒りはごもっともです。私にできるのは、本日中に上の者へ上げることです。'],
      ['tia', 'And how long will that take, realistically?', 'で、実際のところ、どのくらいかかるんですか？']
    ],
    choices: ['You should hear back within one business day.', 'About forty minutes, like before.', 'I can escalate it to a supervisor.'],
    ja: '1営業日以内にご連絡がいくはずです。', note: 'realistically＝本当のところ。期間で答える',
    tags: tg(22, 'service', 'attitude', ['phone']), scene: 'living'
  },
  {
    id: 'dyb-out-of-time', family: 'meeting', type: 'gist', ask: '予算の話は どうなる？', focus: "Thursday's call",
    lines: [
      ['goldie', "Sorry to cut in, but we've got five minutes left and we haven't touched the budget.", '割り込んでごめん、でも残り5分で予算にまったく触れてないよ。'],
      ['kid-cat', "Fair point. Can we give it ten minutes at the start of Thursday's call?", 'もっともだ。木曜の電話会議の最初の10分を充てようか？'],
      ['goldie', 'Works for me, as long as finance can join.', 'それでいいよ、経理も入れるならね。']
    ],
    choices: ["It moves to the start of Thursday's call.", "They'll finish it in the next five minutes.", 'Finance will decide it alone.'],
    ja: '木曜の電話会議の冒頭に回る。', note: 'five minutes は残り時間。予算は木曜へ',
    tags: tg(40, 'colleague', 'literal', ['video'], ['contraction']), scene: 'office'
  },
  {
    id: 'dyb-good-and-bad', family: 'bad-news', type: 'next', focus: 'two grand',
    lines: [
      ['zucker', "So, good news and bad news. The good news is the leak's fixed.", 'さて、いい知らせと悪い知らせがある。いい知らせは、水漏れは直った。'],
      ['tia', 'And the bad news?', 'で、悪い知らせは？'],
      ['zucker', "The floor underneath is rotten, so we're looking at another week and about two grand.", '下の床が腐ってて、あと1週間と2千ドルくらいかかりそうだ。',
        "The floor underneath is rotten, so we're lookin' at another week and about two grand.", [g('looking')]]
    ],
    choices: ['Two grand? Can I get that in writing first?', "Great, so you're all done?", "Another week? Sure, I'll grab a coffee."],
    ja: '2千ドル？ まず書面でもらえますか？', note: 'grand＝千ドル。直ったで終わりではない',
    tags: tg(31, 'service', 'literal', [], ['idiom', 'numbers']), scene: 'door'
  },
  {
    id: 'dyb-blood-pressure', family: 'medical', type: 'gist', ask: '医者の 判断は？', focus: 'Not yet',
    lines: [
      ['reneigh', "Your blood pressure's a little on the high side. Not dangerous, but I'd like to keep an eye on it.", '血圧が少し高めですね。危険ではありませんが、様子を見ておきたいです。'],
      ['dom', 'So do I need to start taking something?', 'じゃあ、何か薬を飲み始めないといけませんか？'],
      ['reneigh', "Not yet. Cut back on salt, walk a little more, and we'll recheck in three months.", 'まだです。塩分を控えて、もう少し歩いて、3か月後に再検査しましょう。']
    ],
    choices: ['No medicine yet: less salt, more walking, then a recheck.', 'He has to start medicine today.', 'His blood pressure is dangerous.'],
    ja: '薬はまだ不要。減塩と運動のあと再検査。', note: 'Not yet＝まだ不要。3か月後に再検査',
    tags: tg(15, 'service', 'hedge', [], ['contraction', 'idiom'])
  },
  {
    id: 'dyb-rough-on', family: 'money', type: 'next', focus: 'rough on Jess',
    lines: [
      ['poppy', "Okay, the total's $312, and Jess only had a salad.", 'えっと、合計312ドルで、ジェスはサラダだけだったよね。',
        "Okay, the total's three-twelve, and Jess only had a salad.", [['say', '$312', 'three-twelve']]],
      ['lucky', 'So do we split it evenly or figure out who had what?', 'じゃあ均等に割る？ それとも誰が何を食べたか計算する？'],
      ['poppy', "Evenly's easier, but it feels kind of rough on Jess.", '均等が楽だけど、ジェスにはちょっと不公平な気がする。']
    ],
    choices: ["Let's take her salad off and split the rest.", "Sure, I'll have a salad too.", 'Rough? The steak was fine.'],
    ja: '彼女のサラダ代を引いて、残りを割ろう。', note: 'rough on〜＝〜に不公平。料理の話ではない',
    tags: tg(27, 'friend', 'indirect', ['cafe'], ['numbers', 'idiom']), scene: 'cafe'
  },
  {
    id: 'dyb-check-in-photos', family: 'contract', type: 'gist', ask: '女性が 言いたいことは？', focus: 'move-in photos',
    lines: [
      ['bunnie', 'So when do I get my deposit back?', 'で、敷金はいつ返ってきますか？'],
      ['tom-nook', "Within thirty days, minus cleaning. And the wall where the shelf was, that'll need patching.", '30日以内、清掃費を引いてね。それと棚があった壁、あそこは補修が必要だ。'],
      ['bunnie', "The shelf was there when I moved in, though. It's in the move-in photos.", 'でも、あの棚は入居時からありましたよ。入居時の写真に写ってます。']
    ],
    choices: ["She shouldn't have to pay for the wall.", 'She wants the shelf back.', "She'll pay for the cleaning and the wall."],
    ja: '壁の補修費は払う必要がない。', note: '入居時からある＝修理費は払わない主張',
    tags: tg(30, 'neighbour', 'indirect', [], ['contraction']), scene: 'living'
  },
  {
    id: 'dyb-potato', family: 'opinion', type: 'next', focus: 'Potato, potahto',
    lines: [
      ['wolfgang', 'Honestly, half our team could be replaced by AI in five years.', '正直、5年でうちのチームの半分はAIに置き換わるかもね。'],
      ['audie', 'Replaced? Or just doing different work?', '置き換わる？ それとも違う仕事をするだけ？'],
      ['wolfgang', "Potato, potahto. Either way, nobody's job looks the same.", '言い方の違いだよ。どっちにしろ、誰の仕事も今のままじゃない。']
    ],
    choices: ["Maybe, but 'different' isn't the same as 'gone'.", 'I like potatoes either way.', "Five years? I've been here six."],
    ja: 'かもね、でも「違う」と「なくなる」は別だよ。', note: 'Potato, potahto＝言い方の違いだけ',
    tags: tg(65, 'colleague', 'attitude', [], ['idiom'])
  },
  {
    id: 'dyb-ship-network', family: 'support', type: 'gist', ask: '請求は どうなる？', focus: 'waive it',
    lines: [
      ['francine', "There's a ¥23,000 roaming charge on my bill, and I had data roaming turned off.", '請求書に2万3千円のローミング料金がありますけど、データローミングは切ってたんです。',
        "There's a twenty-three thousand yen roaming charge on my bill, and I had data roaming turned off.", [['say', '¥23,000', 'twenty-three thousand yen']]],
      ['orville', 'I see it. It looks like your phone connected to a ship network on the ferry.', '確認できました。フェリーで船内のネットワークにつながったようです。'],
      ['francine', 'A ship network? Nobody mentioned that.', '船のネットワーク？ そんなの誰も言ってなかったわ。'],
      ['orville', 'It happens a lot. I can waive it this time, as a one-time thing.', 'よくあることです。今回に限り免除いたします。']
    ],
    choices: ["It's canceled, just this once.", 'She has to pay ¥23,000.', "It's split in half."],
    ja: '今回に限り免除される。', note: 'waive＝免除。one-time thing＝今回だけ',
    tags: tg(22, 'service', 'literal', ['phone'], ['numbers', 'idiom']), scene: 'living'
  },
  {
    id: 'dyb-kanazawa', family: 'opinion', type: 'next', focus: 'a fraction of the crowds',
    lines: [
      ['whitney', "We were going to do Kyoto in April, but everyone says it's wall-to-wall tourists.", '4月に京都に行くつもりだったけど、観光客でぎっしりだってみんな言うの。',
        "We were gonna do Kyoto in April, but everyone says it's wall-to-wall tourists.", [['say', 'going to', 'gonna']]],
      ['julian', 'It is. Have you thought about Kanazawa? Similar feel, a fraction of the crowds.', 'そうだよ。金沢は考えた？ 雰囲気は似てて、人出はずっと少ない。'],
      ['whitney', 'Ooh. And the bullet train goes straight there now, doesn\'t it?', 'へえ。今は新幹線で直通なんだよね？']
    ],
    choices: ['It does. About two and a half hours from Tokyo.', "Yes, it's wall-to-wall in April.", 'No, the bullet train only goes to Kyoto in April.'],
    ja: 'そう。東京から2時間半くらいだよ。', note: '付加疑問は確認。所要時間で答えるのが自然',
    tags: tg(12, 'friend', 'literal', [], ['gonna', 'idiom', 'accent-exposure']), scene: 'cafe'
  },
  {
    id: 'dyb-put-a-date', family: 'negotiate', type: 'next', focus: 'put a date on it',
    lines: [
      ['label', "I've taken on the Chicago account and the new hires. I'd like to talk about my salary.", 'シカゴの担当と新人教育を引き受けました。給与について話したいです。'],
      ['pietro', 'I hear you. Budgets are tight this year, but let me see what I can do before the review.', 'わかるよ。今年は予算が厳しいけど、査定の前に何ができるか考えてみる。',
        'I hear ya. Budgets are tight this year, but lemme see what I can do before the review.', [['say', 'you', 'ya'], ['say', 'let me', 'lemme']]],
      ['label', 'I appreciate that. Could we put a date on it?', 'ありがとうございます。日付を決めてもらえますか？']
    ],
    choices: ["Fair enough. Let's sit down again on the 15th.", "Tight? I'll loosen the budget, then.", 'Yes, you took on the new hires.'],
    ja: 'もっともだ。15日にもう一度話そう。', note: 'put a date on it＝日付を決めて。日で答える',
    tags: tg(42, 'boss', 'hedge', [], ['lemme', 'idiom']), scene: 'office'
  },
  {
    id: 'dyb-residence-card', family: 'process', type: 'gist', ask: '男性について わかることは？', focus: 'walk-ins',
    lines: [
      ['kid-cat', "I'm here to renew my residence card. Is it just this form?", '在留カードの更新に来ました。この書類だけですか？'],
      ['agnes', 'That one, your passport, a photo, and proof of employment. Did you book online?', 'それと、パスポート、写真、在職証明です。オンラインで予約されました？'],
      ['kid-cat', "Book? I didn't realize you had to.", '予約？ 必要だなんて知りませんでした。'],
      ['agnes', "You don't, strictly, but walk-ins can wait two hours or more.", '厳密には不要ですが、予約なしだと2時間以上お待ちいただくことも。']
    ],
    choices: ['He can still be seen, but may wait a long time.', 'He has to book online and come back.', 'He only needs the form.'],
    ja: '手続きはできるが、長く待つかもしれない。', note: 'strictly＝厳密には。予約は必須でない',
    tags: tg(43, 'official', 'literal', [], ['contraction']), scene: 'office'
  },
  {
    id: 'dyb-near-your-folks', family: 'recommend', type: 'next', focus: 'near your folks',
    lines: [
      ['rosie', "Should I take the job in Singapore? The money's way better.", 'シンガポールの仕事、受けるべきかな？ 給料がずっといいの。'],
      ['flick', "I mean, I'd never tell you what to do. But you did say you wanted to be near your folks.", 'まあ、どうしろとは絶対言わないけど。でも、家族の近くにいたいって言ってたよね。']
    ],
    choices: ["I know. That's what's holding me back.", "OK, then I'll tell you what to do.", 'Yes, Singapore is near my folks.'],
    ja: 'わかってる。それが引っかかってるの。', note: '決めないと言いつつ反対を示唆',
    tags: tg(57, 'friend', 'indirect', [], ['contraction'])
  },
  {
    id: 'dyb-auto-renew', family: 'contract', type: 'gist', ask: 'わかることは？', focus: 'auto-renew',
    lines: [
      ['cyd', "Why's the gym still charging me? I stopped going in March.", 'なんでジムからまだ請求が来るんだ？ 3月から行ってないのに。'],
      ['saharah', "Did you actually cancel, though? Those contracts auto-renew unless you give thirty days' notice.", 'でも、ちゃんと解約した？ ああいう契約は30日前に通知しないと自動更新だよ。'],
      ['cyd', "Hang on, so not going isn't cancelling?", 'ちょっと待って、行かないだけじゃ解約にならないのか？']
    ],
    choices: ["He never cancelled, so he's still paying.", 'The gym charged him by mistake.', 'He cancelled in March with notice.'],
    ja: '解約していないので、まだ払っている。', note: '行かない≠解約。30日前の通知が要る',
    tags: tg(29, 'friend', 'literal', [], ['contraction', 'accent-exposure'])
  },
  {
    id: 'dyb-steer-clear', family: 'medical', type: 'next', focus: 'steer clear of alcohol',
    lines: [
      ['kicks', "Can I take these with the antibiotics I'm on?", '今飲んでいる抗生物質と一緒に、これを飲んでもいいですか？'],
      ['pekoe', 'Should be fine, but leave a couple of hours between them, and steer clear of alcohol till the course is done.', '大丈夫だと思いますが、2時間ほど間を空けて、飲み終わるまでお酒は控えてください。'],
      ['kicks', 'Not even one beer on the weekend?', '週末にビール1杯もだめですか？']
    ],
    choices: ["Sorry, not until you've finished the whole course.", 'Of course, a couple of hours is fine.', "On the weekend? We're open Saturdays."],
    ja: 'ごめんなさい、全部飲み終わるまではだめです。', note: 'steer clear of＝避ける。course＝服用期間',
    tags: tg(13, 'service', 'literal', [], ['idiom']), scene: 'pharmacy'
  },
  {
    id: 'dyb-bins', family: 'complain', type: 'gist', ask: 'なにが おきた？', focus: 'It moved to Monday',
    lines: [
      ['henry', 'Evening. Sorry to bother you, but your trash cans have been out on the curb since Tuesday.', 'こんばんは。すみませんが、お宅のゴミ箱が火曜から道路脇に出たままでして。'],
      ['katt', "Oh, have they? Pickup's Thursday, isn't it?", 'あら、そうでした？ 収集は木曜ですよね？'],
      ['henry', 'It moved to Monday last month. There was a notice.', '先月から月曜になったんです。お知らせが来てましたよ。']
    ],
    choices: ['She missed a change to the pickup day.', "He's complaining about noise.", 'Pickup is still on Thursday.'],
    ja: '収集日の変更を彼女が見落としていた。', note: 'trash cans＝ゴミ箱。収集日が変わっていた',
    tags: tg(32, 'neighbour', 'indirect', [], ['contraction']), scene: 'door'
  },
  {
    id: 'dyb-blocked', family: 'meeting', type: 'gist', ask: '二人の 問題は？', focus: 'blocking both of us',
    lines: [
      ['lily', "Quick update. I'm done with the login page, just waiting on design for the icons.", '手短に。ログイン画面は完了、アイコンはデザイン待ちです。'],
      ['beau', "Same boat, sort of. I can't test payments till the API keys come through.", '似たようなもんかな。APIキーが届くまで決済のテストができない。'],
      ['lily', "Who's following up on the keys? Because that's blocking both of us now.", 'キーは誰が催促してる？ もう二人とも止まってるよ。']
    ],
    choices: ["They're both waiting on other people.", "The login page isn't finished.", "He doesn't know how to test payments."],
    ja: '二人とも他の人の作業待ちになっている。', note: 'waiting on／come through＝他人待ち',
    tags: tg(44, 'colleague', 'literal', ['video'], ['can-cant', 'idiom']), scene: 'office'
  },
  {
    id: 'dyb-side-income', family: 'money', type: 'next', focus: 'side income',
    lines: [
      ['hamlet', 'Do I need to file a tax return if my company already does the year-end adjustment?', '会社が年末調整をしてくれてるなら、確定申告は要る？'],
      ['goldie', 'Not usually, unless you had side income over two hundred thousand yen.', '普通は要らないよ。副業の所得が20万円を超えてなければね。'],
      ['hamlet', 'Ah. My weekend coaching made about three hundred thousand.', 'あ。週末のコーチで30万くらい稼いだんだ。']
    ],
    choices: ["Then you'll probably need to file one.", "Great, your company will handle it.", "Three hundred? That's under the limit, then."],
    ja: 'じゃあ、たぶん申告が必要だね。', note: '副業30万＞20万。申告が必要',
    tags: tg(57, 'friend', 'literal', [], ['numbers'])
  },
  {
    id: 'dyb-under-promise', family: 'bad-news', type: 'next', focus: 'under-promise',
    lines: [
      ['fang', "The deck is solid. My only worry is the timeline slide. It's promising a lot.", '資料はしっかりしてる。唯一気になるのはスケジュールのスライドだね。約束しすぎかな。'],
      ['molly', 'Too optimistic, you mean?', '楽観的すぎるってことですか？'],
      ['fang', "Let's just say I'd rather under-promise and over-deliver.", 'まあ、控えめに約束して期待以上に応えるほうがいい、ってことさ。']
    ],
    choices: ["Got it. I'll build some slack into the dates.", "Thanks, I'll promise even more, then.", "Great, so the timeline's fine as it is."],
    ja: 'わかりました。日程に余裕を持たせます。', note: 'under-promise＝控えめに約束。日程に余裕を',
    tags: tg(42, 'boss', 'indirect', [], ['idiom']), scene: 'office'
  },
  {
    id: 'dyb-four-days', family: 'opinion', type: 'gist', ask: '二人は どう 思っている？', focus: 'until further notice',
    lines: [
      ['tasha', 'Have you heard? They want us in the office four days a week from January.', '聞いた？ 1月から週4日出社だって。'],
      ['raymond', 'Four? I moved to Kamakura because they said remote was permanent.', '4日？ リモートは恒久だって言うから鎌倉に引っ越したのに。'],
      ['tasha', "I know. Apparently 'permanent' meant 'until further notice'.", 'だよね。どうやら「恒久」って「追って通知があるまで」って意味だったみたい。']
    ],
    choices: ["They're unhappy about the change.", "They're glad to go back to the office.", "They think it's only two days a week."],
    ja: '二人とも変更に不満がある。', note: '皮肉。恒久のはずのリモートが撤回された',
    tags: tg(65, 'colleague', 'sarcasm', [], ['intonation', 'accent-exposure']), scene: 'office'
  }
];

const SINGLES: readonly Item[] = [
  ...NEGOTIATE.map(item('negotiate')),
  ...COMPLAIN.map(item('complain')),
  ...DISAGREE.map(item('disagree')),
  ...BAD_NEWS.map(item('bad-news')),
  ...MEETING.map(item('meeting')),
  ...PROCESS.map(item('process')),
  ...RECOMMEND.map(item('recommend')),
  ...SUPPORT.map(item('support')),
  ...MEDICAL.map(item('medical')),
  ...CONTRACT.map(item('contract')),
  ...MONEY.map(item('money')),
  ...OPINION.map(item('opinion'))
];

/** This set's single-clip items (word, num, reply, mean). */
export const ITEMS: readonly Item[] = SINGLES;
/** This set's dialogues (gist, next). */
export const DIALOGUES: readonly Item[] = DROWS.map(dialogue);
/** Each item's and dialogue's family (after ITEMS and DIALOGUES are built). */
export const FAMILY: Readonly<Record<string, Family>> = FAMILY_OF;
