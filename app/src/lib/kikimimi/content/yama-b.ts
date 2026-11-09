// ききみみ クイズ 「やま」 (S3, B2+; docs/curriculum.md "Stages and can-dos"), content set B: work, money and grown-up life at natural speed.
// A step past もり: denser turns, hedges and implied meaning in business and service talk, numbers buried in fast
// speech (rent, salary, tax, bills, splitting costs), and opinions on current-life topics (housing, remote work, AI at
// work, overtourism in Japan, health trends). Families (FAMILY): negotiation and persuasion, complaints that escalate,
// diplomatic disagreement, giving bad news, meetings, explaining processes, hedged recommendations, support
// escalations, medical explanations, contracts in plain speech, money, opinions.
//   Same shapes as bank4.ts and dialogues.ts: `en` shown (UK spelling for UK and AU voices), `tts` spoken when it
// differs (§9: reductions as said, every number written out), `note` the trap (≤ 40 字), `tags` the scenario (§5.5
// seed, register, pragmatics, conditions, features). Staging (scene, channel, sound marks) is written on each item
// here instead of staging.ts, so the integrator can fold it in as is. The right choice is authored first.
//   Speakers: cast.ts CAST (this set's new villagers are there too). Level 6 (やま). American English and US voices by
// default (US vocabulary, idioms, spelling, dollars); about a tenth are UK or AU voices in standard English (no slang),
// tagged `accent-exposure`.
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Channel, Item, ItemType, Level, SceneId, SoundMark, Tags } from '../bank.ts';
import { MEAN_ASK, dialogueOf, g, line, single, tg, type DialogueRow, type L } from './build.ts';

/** The content family an item was written for (this set's coverage). */
export type Family = 'negotiate' | 'complain' | 'disagree' | 'bad-news' | 'meeting' | 'process' | 'recommend' | 'support' | 'medical' | 'contract' | 'money' | 'opinion';

/** やま's level. */
const LV: Level = 6;

/** The Japanese help (bank.ts Item: cja, why, ctx), optional on every item and dialogue. */
type Help = { cja?: readonly string[]; why?: string; ctx?: string };
const helpOf = ({ cja, why, ctx }: Help): Help => ({ ...(cja && { cja }), ...(why && { why }), ...(ctx && { ctx }) });
type Extra = Help & { tts?: string; focus?: string; ask?: string; scene?: SceneId; channel?: Channel; marks?: readonly SoundMark[] };
type Row = readonly [type: Exclude<ItemType, 'pic' | 'gist' | 'next'>, id: string, speaker: RosterId, en: string, ja: string, note: string, choices: readonly string[], tags: Tags, extra?: Extra];

const FAMILY_OF: Record<string, Family> = {};

const item = (family: Family) => ([type, id, speaker, en, ja, note, choices, tags, x = {}]: Row): Item => {
  FAMILY_OF[id] = family;
  const focus = type === 'word' ? choices[0] : x.focus;
  const ask = x.ask ?? (type === 'mean' ? MEAN_ASK : undefined);
  return {
    ...single(LV, type, id, speaker, en, ja, note, choices, tags),
    ...(x.tts && { tts: x.tts }), ...(focus && { focus }), ...(ask && { ask }),
    ...(x.scene && { scene: x.scene }), ...(x.channel && { channel: x.channel }), ...(x.marks && { marks: x.marks }),
    ...helpOf(x)
  };
};

// ---- negotiation and persuasion ---------------------------------------------------------------------------------------

const NEGOTIATE: readonly Row[] = [
  ['reply', 'yb-throw-in', 'gulliver', "I can't go any lower on the rate, but I could throw in the installation for free.",
    'これ以上料金は下げられませんが、設置費を無料でお付けできます。 →「よかった。設置の件を書面でもらえますか？」',
    'throw in＝おまけで付ける。料金自体は下がっていない',
    ['Great. Can I get the installation in writing?', "So you're lowering the rate, then?", 'No thanks, I can throw it out myself.'],
    tg(41, 'service', 'refusal', [], ['idiom']), { scene: 'office',
      ctx: 'ネット回線の営業が、料金交渉に答えています', cja: ['よかった。設置の件を書面でもらえますか？', 'じゃあ料金を下げてくれるんですね？', 'いえ、自分で捨てられますから。'],
      why: 'throw in は「おまけで付ける」。料金は下がらず設置費が無料になるので、条件を書面で確認するのが自然。throw out（捨てる）は音の罠。' }],
  ['mean', 'yb-wiggle-room', 'judy', "Honestly, that's a little outside what we'd budgeted. If there's any wiggle room on your end, we'd love to make this work.",
    '正直、予算を少し超えていまして。そちらで多少融通がきくなら、ぜひ進めたいのですが。 → つまり、値下げしてほしい。',
    'budget を超える＋wiggle room＝値下げの要求',
    ["She's asking you to come down on the price.", "She's happy to pay the price as it is.", "She's saying the deal is off for good."],
    tg(41, 'service', 'indirect', ['phone'], ['idiom', 'contraction']), { scene: 'office',
      ctx: '業者との電話で、見積もりに返事をしています', cja: ['価格を下げてほしいと頼んでいる。', '今の価格のまま喜んで払う。', 'この取引は完全になしだと言っている。'],
      why: "予算オーバーと伝えて wiggle room（融通の余地）を聞くのは、遠回しな値下げ要求。we'd love to make this work は前向きなので、打ち切りではない。" }],
  ['mean', 'yb-final-offer', 'shep', "Look, I'll be straight with you. That's my final offer, and between you and me, there's another buyer coming at four.",
    'いいかい、正直に言うよ。これが最終提示だ。ここだけの話、4時に別の買い手が来るんだ。 → つまり、早く決めろと急かしている。',
    '別の買い手の話は決断を急がせる常套句',
    ["He's pushing you to decide right now.", "He'll drop the price if you wait.", "He's already sold it to someone else."],
    tg(7, 'stranger', 'deception', [], ['idiom']),
    { tts: "Look, I'll be straight with ya. That's my final offer, and between you and me, there's another buyer comin' at four.",
      scene: 'street', marks: [['say', 'you', 'ya'], g('coming')],
      ctx: 'フリマで中古の自転車を値切っています', cja: ['今すぐ決めろと急かしている。', '待てば値下げしてくれる。', 'もう別の人に売ってしまった。'],
      why: '「最終提示」＋「4時に別の買い手が来る」は、決断を急がせる売り手の常套句。買い手は「これから来る」ので、まだ売れていない。' }],
  ['reply', 'yb-match-quote', 'tangy', 'The company down the road quoted us $1,200 for the same job. Can you match that?',
    '近くの会社は同じ工事で1,200ドルの見積もりでした。同じ額にできますか？ →「そこまでは無理ですが、うちの価格は撤去込みです。」',
    'match＝同額にする。距離や数字の繰り返しは罠',
    ['Not quite, but our price includes haul-away.', "We're just down the road from them, too.", 'Twelve hundred? We quoted you two grand.'],
    tg(31, 'service', 'literal', [], ['numbers']),
    { tts: 'The company down the road quoted us twelve hundred for the same job. Can you match that?', scene: 'door',
      marks: [['say', '$1,200', 'twelve hundred']],
      ctx: '家の工事の見積もりで、業者と交渉中', cja: ['そこまでは無理ですが、うちの価格は撤去込みです。', 'うちもその会社のすぐ近くですよ。', '1,200ドル？ うちは2千ドルで見積もりましたよ。'],
      why: 'match は「同じ額に合わせる」。全額は無理でも別の価値（撤去込み）を示すのが交渉の返し。down the road（近所の）や数字の繰り返しは罠。' }],
  ['num', 'yb-deposit-hold', 'hamlet', "We'll put a hold of $450 on your card, which drops to $150 if you take the full coverage.",
    'カードに450ドルの仮押さえをします。フル補償に入れば150ドルになります。',
    'drops to の後が補償ありの額。差額300は罠',
    ['$150', '$450', '$300'],
    tg(7, 'service', 'formula', ['desk'], ['numbers']),
    { ask: 'フル補償なら いくら押さえる？', focus: '$150', tts: "We'll put a hold of four-fifty on your card, which drops to one-fifty if you take the full coverage.",
      marks: [['say', '$450', 'four-fifty'], ['say', '$150', 'one-fifty']],
      ctx: 'レンタカーのカウンターで説明を受けています', cja: ['150ドル', '450ドル', '300ドル'],
      why: 'hold は「仮押さえ（保証金）」。drops to の後の150ドルが補償ありの額。450ドルは補償なしの額、300ドルはその差額で、どちらも罠。' }],
  ['mean', 'yb-sweeten', 'maple', 'If you can sign by Friday, I might be able to get my manager to sweeten the deal a little.',
    '金曜までにご契約いただければ、上司に掛け合って条件を少し良くできるかもしれません。 → つまり、早く決めれば値引きの可能性がある。',
    'might be able to は未確定。sweeten＝条件を良くする',
    ['Signing by Friday could get you a better deal.', 'Her manager has already signed off on a discount.', 'The deal ends on Friday, whatever you decide.'],
    tg(29, 'service', 'hedge', ['phone'], ['idiom']), { scene: 'living',
      ctx: '車の販売店から、商談の電話がかかってきました', cja: ['金曜までに契約すれば、条件が良くなるかもしれない。', '上司がもう値引きを承認している。', 'どう決めても、金曜でこの条件は終わる。'],
      why: 'might be able to は「〜できるかも」で、まだ確約ではない。sweeten the deal は「条件を良くする」。金曜は値引きの条件で、締め切りの宣言ではない。' }],
  ['reply', 'yb-run-it-by', 'octavian', 'So, can we shake on twelve percent, or do you need to run it by your team first?',
    'では12パーセントで手を打ちますか、それともまずチームに確認が必要ですか？ →「チームに確認しますが、かなり前向きです。」',
    'run it by＝確認を取る。shake on＝合意する',
    ["I'll run it by them, but I'm pretty hopeful.", 'I go running with my team every week.', 'We already shook on it last year.'],
    tg(41, 'colleague', 'literal', ['video'], ['yod', 'idiom']),
    { tts: "So, can we shake on twelve percent, or d'you need to run it by your team first?", scene: 'office',
      marks: [['say', 'do you', "d'you"], ['link', 'run it']],
      ctx: '取引先とビデオ会議で、値引き率を詰めています', cja: ['チームに確認しますが、かなり前向きです。', '毎週チームと走ってますよ。', 'それは去年もう合意しましたよ。'],
      why: 'shake on は「握手して合意する」、run it by は「〜に確認を取る」。二択の質問なので「確認は要るが前向き」と答えるのが自然。run（走る）は罠。' }]
];

// ---- complaints that escalate -----------------------------------------------------------------------------------------

const COMPLAIN: readonly Row[] = [
  ['reply', 'yb-third-time', 'pekoe', "This is the third time this week the dishes have sat in the sink overnight, and every time you say you'll get to them.",
    '今週、お皿が一晩シンクに置きっぱなしなのはこれで3回目。毎回「やるから」って言うよね。 →「そのとおり、ごめん。今すぐ洗うよ。」',
    '「あとでやる」はもう通じない。今すぐ動くのが正解',
    ["You're right, sorry. I'll do them right now.", "I'll get to them after this episode.", "That's right, it's the third time."],
    tg(35, 'partner', 'attitude', [], ['contraction']), { scene: 'living',
      ctx: '同居中のパートナーが、台所で怒っています', cja: ['そのとおり、ごめん。今すぐ洗うよ。', 'この回が終わったらやるよ。', 'そうだね、3回目だね。'],
      why: '「毎回やると言う」と責められているので、「あとで」はさらに怒らせる。謝って今すぐ動くのが正解。回数に同意するだけでは返事になっていない。' }],
  ['mean', 'yb-decision-maker', 'olivia', "I appreciate you're only following policy, but I'd like to speak to someone who can actually make a decision.",
    'あなたが規則に従っているだけなのはわかりますが、実際に判断できる方と話したいです。 → つまり、上の人を出してほしい。',
    'someone who can make a decision＝上司を出して',
    ['She wants to speak to a manager.', 'She agrees with the policy.', "She'll make the decision herself."],
    tg(26, 'service', 'indirect', [], ['contraction', 'accent-exposure']), { scene: 'street',
      ctx: '店の受付で、客が規則の説明に食い下がっています', cja: ['責任者と話したい。', '規則に賛成している。', '自分で決めるつもりだ。'],
      why: 'I appreciate… but は丁寧な前置き。someone who can make a decision は「決裁できる人＝上司を出して」の遠回しな表現。' }],
  ['mean', 'yb-generously', 'chief', "Right. So I ordered a king-size, and what's turned up is, generously, a large single.",
    'で、キングサイズを頼んだのに、届いたのは、甘く見ても大きめのシングルだ。 → つまり、ずっと小さいものが届いた。',
    'generously＝甘く見ても。届いたのは大幅に小さい',
    ['The bed that turned up is way too small.', 'He got an even bigger bed than he ordered.', "He's pretty happy with what turned up."],
    tg(26, 'service', 'sarcasm', [], ['intonation', 'accent-exposure']), { scene: 'door',
      ctx: '通販で頼んだベッドが届いて、電話で苦情です', cja: ['届いたベッドは小さすぎる。', '頼んだよりさらに大きいベッドが届いた。', '届いたものにけっこう満足している。'],
      why: 'generously は「甘く見ても」。キングサイズを頼んで「甘く見ても大きめのシングル」なので、ずっと小さいという皮肉。' }],
  ['num', 'yb-overcharged', 'molly', "I was quoted $79 a month, but I've been charged $97 for three months now.",
    '月79ドルと言われたのに、もう3か月も97ドル請求されているんです。',
    '79と97の逆転に注意。差額18×3か月',
    ['$54', '$18', '$97'],
    tg(22, 'service', 'attitude', ['phone'], ['numbers', 'teen-ty']),
    { ask: '払いすぎた 合計は？', focus: '$97', tts: "I was quoted seventy-nine a month, but I've been charged ninety-seven for three months now.",
      scene: 'living', marks: [['say', '$79', 'SEVenty-nine'], ['say', '$97', 'NINEty-seven']],
      ctx: 'ネット回線の請求について、電話で問い合わせ中', cja: ['54ドル', '18ドル', '97ドル'],
      why: '97−79＝18ドルの払いすぎが3か月で54ドル。18ドルは1か月分、97ドルは請求額。seventy と ninety の聞き分けもポイント。' }],
  ['reply', 'yb-barely-warm', 'anchovy', 'Excuse me, sorry to be a pain, but this is barely warm in the middle.',
    'すみません、面倒をかけて申し訳ないんですが、これ真ん中がほとんど温かくないです。 →「申し訳ありません！作り直させます。」',
    'sorry to be a pain は前置き。本題は「ぬるい」',
    ["Oh, sorry! I'll have them redo it.", 'No pain at all! Can I get you anything else?', 'You can move to the middle table if you like.'],
    tg(27, 'service', 'indirect', ['cafe'], ['idiom']), { scene: 'cafe',
      ctx: 'レストランで、客が店員を呼び止めました', cja: ['申し訳ありません！作り直させます。', 'お手数なんてとんでもない！ほかに何かお持ちしますか？', 'よろしければ真ん中のテーブルに移れますよ。'],
      why: 'sorry to be a pain は「お手数ですが」の前置きで、本題は「真ん中がぬるい」。謝って作り直すのが店員の返し。pain や middle は罠。' }],
  ['word', 'yb-supposed-to', 'francine', "We were supposed to leave at noon. It's two, and you're still packing.",
    'お昼に出発するはずだったよね。もう2時なのに、まだ荷造りしてる。',
    "supposed to は s'posta と縮む。d はほぼ聞こえない",
    ['supposed to', 'going to', 'due to'],
    tg(35, 'partner', 'attitude', [], ['weak-form']),
    { tts: "We were s'posta leave at noon. It's two, and you're still packing.", scene: 'living', marks: [['say', 'supposed to', "s'posta"]],
      ctx: '旅行の出発日、パートナーがいらいらしています', cja: ['〜するはずだった', '〜するつもりだった', '〜する予定だった'],
      why: "supposed to は s'posta と縮み、最初の母音はほぼ消える。「するはずだったのに」という不満の響き。going to（gonna）や due to とは音が違う。" }],
  ['mean', 'yb-before-midnight', 'kabuki', "Don't get me wrong, I love a little music. I'd just love it a lot more before midnight.",
    '誤解しないで、音楽は好きなんだ。ただ、夜中の12時前ならもっと好きなんだけどね。 → つまり、深夜の音楽をやめてほしい。',
    'ユーモアで包んだ騒音の苦情',
    ['Please stop playing music so late.', "He'd like to join in with the music.", 'Please play it louder before midnight.'],
    tg(32, 'neighbour', 'humour', [], ['contraction']), { scene: 'door',
      ctx: '隣の住人が、夜にドアをノックしてきました', cja: ['夜遅くに音楽をかけないで。', '一緒に音楽に参加したい。', '12時前はもっと音を大きくして。'],
      why: "Don't get me wrong で始まる冗談まじりの苦情。「12時前ならもっと好き」は、深夜の音楽をやめてほしいという意味。" }]
];

// ---- diplomatic disagreement ------------------------------------------------------------------------------------------

const DISAGREE: readonly Row[] = [
  ['mean', 'yb-devils-advocate', 'bob', "Just to play devil's advocate, are we sure customers actually want this, or do we just want to build it?",
    'あえて反対の立場で言うけど、お客さんは本当にこれを求めてる？それとも僕らが作りたいだけ？ → つまり、計画に疑問がある。',
    "devil's advocate＝あえて反対意見を言う役",
    ["He's not sure customers really want it.", 'He fully supports building it right away.', 'He knows customers have been asking for it.'],
    tg(40, 'colleague', 'hedge', [], ['idiom']), { scene: 'office',
      ctx: '新機能の企画会議で、同僚が発言しています', cja: ['お客さんが本当に求めているか疑問に思っている。', 'すぐに作ることに全面的に賛成している。', 'お客さんから要望が出ていると知っている。'],
      why: "play devil's advocate は「あえて反対の立場で言う」。前置きはやわらかいが、中身は「自分たちが作りたいだけでは？」という疑問。" }],
  ['reply', 'yb-coming-from', 'tammy', "I see where you're coming from, but I'm not sure the numbers back that up.",
    'おっしゃることはわかりますが、数字がそれを裏付けているかは疑問です。 →「確かに。一緒に数字を見てみましょう。」',
    'see where you’re coming from は反論の前置き',
    ["Fair. Let's look at the numbers together.", "I'm coming in from Chicago today.", 'I backed all the numbers up last night.'],
    tg(40, 'colleague', 'hedge', [], ['idiom']), { scene: 'office',
      ctx: '会議で、同僚の提案に意見しています', cja: ['確かに。一緒に数字を見てみましょう。', '今日はシカゴから来てるんだ。', '昨夜数字は全部バックアップしたよ。'],
      why: "I see where you're coming from は「言いたいことはわかる」で、but の後が反論。一緒に数字を確かめようと返すのが自然。" }],
  ['mean', 'yb-due-respect', 'fang', "With all due respect, that's not what was agreed in the last meeting.",
    'お言葉ですが、それは前回の会議で合意した内容と違います。 → つまり、強く反対している。',
    'With all due respect の後は強い反論',
    ['He flatly disagrees with that.', 'He respects the decision and agrees.', "He wasn't at the last meeting himself."],
    tg(41, 'colleague', 'attitude', [], ['intonation']), { scene: 'office',
      ctx: '会議で、同僚が上司の発言をさえぎりました', cja: ['それにはっきり反対している。', '決定を尊重して賛成している。', '自分は前回の会議に出ていなかった。'],
      why: 'With all due respect は丁寧に聞こえるが、後に強い反論が来る合図。respect という単語につられて「賛成」と取るのが罠。' }],
  ['word', 'yb-couldnt-agree', 'nana', "Honestly, I couldn't agree more, but that's not the part I'm worried about.",
    '正直、大賛成よ。でも私が心配しているのはそこじゃないの。',
    "couldn't agree more＝大賛成。could との差は n't",
    ["couldn't", 'could', "wouldn't"],
    tg(40, 'colleague', 'hedge', [], ['contraction', 'idiom']), { scene: 'office',
      ctx: '会議で、先輩が提案にコメントしています', cja: ['（これ以上）できない', 'できる', '（〜し）ないだろう'],
      why: "couldn't agree more は「これ以上賛成できない＝大賛成」。could では意味が通じない。語尾の n't は弱く、t はほぼ聞こえない。" }],
  ['reply', 'yb-park-that', 'reneigh', "Can we park that for now and come back to it once we've seen the budget?",
    'それはいったん置いておいて、予算を見てから戻りませんか？ →「いいですね。来週またこの話に戻りましょう。」',
    'park＝いったん保留する。駐車の話ではない',
    ["Sure, let's come back to it next week.", "The parking lot's full, I'm afraid.", "I've already seen the budget, thanks."],
    tg(40, 'colleague', 'literal', [], ['idiom', 'contraction']), { scene: 'office',
      ctx: '会議で、議論が予算の話に行き詰まりました', cja: ['いいですね。来週またこの話に戻りましょう。', 'あいにく駐車場は満車です。', '予算はもう見ました、ありがとう。'],
      why: 'park は会議で「いったん保留する」。保留を受けて、いつ戻るか決めるのが自然な返し。駐車の意味に取るのが罠。' }],
  ['mean', 'yb-get-noticed', 'katt', "Purple for a law firm's logo? Well, it'll certainly get noticed.",
    '法律事務所のロゴに紫？ まあ、確かに目立つでしょうね。 → つまり、いいとは思っていない。',
    'certainly get noticed は婉曲な否定。褒めていない',
    ["She doesn't think it works.", "She thinks it's eye-catching and perfect.", 'She wants it to stand out even more.'],
    tg(42, 'colleague', 'understatement', [], ['intonation']), { scene: 'office',
      ctx: '法律事務所の新しいロゴ案を見ています', cja: ['合っていないと思っている。', '目を引いて完璧だと思っている。', 'もっと目立たせたい。'],
      why: '「確かに目立つでしょうね」は褒めているようで、実は否定の婉曲表現。法律事務所に紫は合わない、という本音が裏にある。' }],
  ['reply', 'yb-agree-to-disagree', 'beau', "I think we're going around in circles. Can we just agree to disagree and move on?",
    '堂々巡りになってる気がする。意見の違いは違いとして、先に進めない？ →「いいよ。先に進もう。」',
    'agree to disagree＝違いを認めて先へ。賛成ではない',
    ["Fine by me. Let's move on.", "Sure, I agree with you completely.", 'Yeah, I keep getting lost in this building too.'],
    tg(44, 'colleague', 'literal', ['video'], ['idiom']), { scene: 'office',
      ctx: 'ビデオ会議で、議論が平行線になっています', cja: ['いいよ。先に進もう。', 'うん、完全に賛成だよ。', 'わかる、このビル、迷子になるよね。'],
      why: 'going around in circles は「堂々巡り」。agree to disagree は「意見の違いを認めて先へ進む」で、賛成したわけではない。' }]
];

// ---- giving bad news --------------------------------------------------------------------------------------------------

const BAD_NEWS: readonly Row[] = [
  ['mean', 'yb-role-affected', 'tom-nook', "As you know, we've been reviewing the team structure, and unfortunately, your role is one of the ones affected.",
    'ご存じのとおりチーム体制を見直してきたが、残念ながら君の職もその対象になった。 → つまり、ポジションがなくなる。',
    'role is affected は「職がなくなる」の婉曲表現',
    ['Your role is being cut.', "You're being promoted to a new role.", 'The review will happen next year.'],
    tg(42, 'boss', 'indirect', [], ['contraction']), { scene: 'office',
      ctx: '上司との一対一の面談です', cja: ['あなたの職がなくなる。', '新しい役職に昇進する。', '見直しは来年行われる。'],
      why: 'your role is one of the ones affected は「あなたの職も削減対象」という解雇の婉曲表現。unfortunately が悪い知らせの合図。' }],
  ['reply', 'yb-not-go-ahead', 'poppy', "Unfortunately, the board decided not to go ahead with the project, at least for this year.",
    '残念ながら、役員会は少なくとも今年はこのプロジェクトを進めないと決めました。 →「それは残念。来年の可能性はありますか？」',
    'not go ahead＝中止。at least で来年に余地',
    ["That's a shame. Any chance of next year?", 'Great, so when do we get started?', "Go ahead, I'll wait till you're done."],
    tg(40, 'boss', 'formula', [], ['contraction']), { scene: 'office',
      ctx: '上司が、役員会の結果を伝えに来ました', cja: ['それは残念。来年の可能性はありますか？', 'よかった、じゃあいつ始めますか？', 'どうぞ、終わるまで待ってますから。'],
      why: 'not go ahead は「進めない＝中止」。at least for this year とあるので、来年の可能性を聞くのが自然。Go ahead（どうぞ）は罠。' }],
  ['num', 'yb-back-order', 'lucky', "The parts are on back order, so we're looking at six to eight weeks, not the two we said.",
    '部品が入荷待ちなので、お伝えした2週間ではなく、6〜8週間かかりそうです。',
    'not the two we said は前の約束。最長は8',
    ['8週間', '2週間', '6週間'],
    tg(31, 'service', 'literal', ['phone'], ['numbers', 'contrast']),
    { ask: '新しい見込みは 最長 何週間？', focus: 'six to eight weeks', tts: "The parts are on back order, so we're lookin' at six to eight weeks, not the two we said.",
      scene: 'living', marks: [g('looking'), ['stress', 'two']],
      ctx: '修理店から、部品について電話がありました', cja: ['8週間', '2週間', '6週間'],
      why: 'six to eight weeks の最長は8週間。not the two we said は前に伝えた見込みで、もう古い情報。back order は「入荷待ち」。' }],
  ['mean', 'yb-different-direction', 'audie', 'Thanks so much for your time. The team really enjoyed meeting you, but we decided to go in a different direction.',
    'お時間をありがとうございました。チームもお会いできて喜んでいましたが、別の方向で進めることになりました。 → つまり、不採用。',
    'different direction＝不採用を伝える定型句',
    ["You didn't get the job.", "They'd like a second interview.", 'The team is moving to a new office.'],
    tg(46, 'official', 'formula', ['phone'], ['idiom']), { scene: 'living',
      ctx: '面接を受けた会社から電話がありました', cja: ['採用されなかった。', '二次面接に呼びたい。', 'チームが新しいオフィスに移る。'],
      why: 'go in a different direction は不採用を伝える決まり文句。お礼やほめ言葉から入るのは、悪い知らせをやわらげるため。' }],
  ['reply', 'yb-bearer', 'teddy', "I hate to be the bearer of bad news, but your car's not going to be ready till Monday.",
    '悪い知らせで申し訳ないけど、車は月曜まで仕上がらないんです。 →「うわ。それまで代車を借りられますか？」',
    'bearer of bad news＝悪い知らせを伝える役',
    ['Ugh. Could I get a loaner till then?', "I'll bear that in mind, thanks.", 'So I can pick it up this afternoon?'],
    tg(31, 'service', 'formula', [], ['gonna', 'idiom']),
    { tts: "I hate to be the bearer of bad news, but your car's not gonna be ready till Monday.", scene: 'street',
      marks: [['say', 'going to', 'gonna']],
      ctx: '車の修理工場で、整備士が説明しています', cja: ['うわ。それまで代車を借りられますか？', '覚えておきます、ありがとう。', 'じゃあ今日の午後に取りに行けますね？'],
      why: 'bearer of bad news は「悪い知らせを伝える役」。月曜まで車が使えないので、代車（loaner）を頼むのが自然。bear in mind は音の罠。' }],
  ['word', 'yb-wont-be-able', 'henry', "I'm sorry, but we won't be able to fit you in until next month.",
    '申し訳ありませんが、来月までご予約をお取りできません。',
    "won't は want と別の母音。否定を聞き逃さない",
    ["won't", 'will', "wouldn't"],
    tg(26, 'service', 'refusal', ['phone'], ['contraction']), { scene: 'living',
      ctx: '病院に予約の電話をしています', cja: ['できない（未来の否定）', 'できる', 'できないだろう'],
      why: "won't は「ウォウント」で、want とは母音が違う。I'm sorry, but の後なので否定が来ると予測できる。wouldn't は仮定の響き。" }],
  ['num', 'yb-rent-up', 'curt', 'From April, the swim club fee goes up from ¥8,200 to ¥8,950 a month.',
    '4月から、スイミングクラブの月謝は8,200円から8,950円に上がります。',
    'from→to の to の後が新しい月謝',
    ['8,950円', '8,200円', '750円'],
    tg(30, 'official', 'literal', ['voicemail'], ['numbers', 'accent-exposure']),
    { ask: '4月からの 月謝は？', focus: '¥8,950', tts: 'From April, the swim club fee goes up from eight thousand two hundred to eight thousand nine hundred and fifty a month.',
      scene: 'living', marks: [['say', '¥8,200', 'eight thousand two hundred'], ['say', '¥8,950', 'eight thousand nine hundred and fifty']],
      ctx: 'スイミングクラブからの留守電を聞いています', cja: ['8,950円', '8,200円', '750円'],
      why: 'goes up from A to B の B が新しい月謝。8,200円は今の額、750円は値上げ幅で、どちらも罠。英国英語は hundred の後に and が入る。' }]
];

// ---- meetings with competing opinions ---------------------------------------------------------------------------------

const MEETING: readonly Row[] = [
  ['mean', 'yb-hit-pause', 'lily', "Let's hit pause on pricing till legal's taken a look. No point locking anything in before then.",
    '価格は法務が見るまでいったん止めよう。それまでに何かを確定しても意味がないから。 → つまり、価格は法務の確認待ち。',
    'hit pause＝一時停止。lock in＝確定する',
    ["Pricing waits for legal's review.", 'The price has already been locked in.', 'Legal will be the ones to set the price.'],
    tg(40, 'colleague', 'literal', ['video'], ['idiom', 'contraction']), { scene: 'office',
      ctx: 'オンライン会議で、価格の決定について', cja: ['価格は法務の確認待ち。', '価格はもう確定している。', '価格を決めるのは法務だ。'],
      why: 'hit pause は「いったん止める」、lock in は「確定する」。法務が見るまで価格は保留。法務が決めるわけではない。' }],
  ['reply', 'yb-whos-owning', 'label', "So who's owning the follow-up with the vendor?",
    'で、業者とのフォローアップは誰が担当する？ →「私がやります。今日業者にメールします。」',
    'owning＝担当する。所有の意味ではない',
    ["I'll take it. I'll email the vendor today.", 'Oh, the vendor owns the whole building.', 'We followed the vendor on social media.'],
    tg(44, 'colleague', 'literal', [], ['contraction']), { scene: 'office',
      ctx: '会議の最後に、タスクの担当を決めています', cja: ['私がやります。今日業者にメールします。', 'ああ、業者はあのビル全体の持ち主ですよ。', 'その業者、ネットでフォローしたよ。'],
      why: '仕事の英語で own は「担当して責任を持つ」。誰がやるか聞かれたので、引き受けて期限を言うのが自然。所有や follow（フォロー）は罠。' }],
  ['word', 'yb-launch-date', 'daisy-mae', 'Before we wrap up, are we all on the same page about the launch date?',
    '終わる前に、発売日について全員認識は合ってる？',
    'launch と lunch は母音が違う。会議なら発売日',
    ['launch', 'lunch', 'last'],
    tg(40, 'colleague', 'literal', [], ['vowel', 'katakana', 'idiom']), { scene: 'office',
      ctx: '会議の終わりに、リーダーが確認しています', cja: ['発売日', '昼食', '最後の'],
      why: 'launch は「ローンチ」で口を大きく開ける。lunch とは母音が違う。会議の締めの確認なので、内容的にも発売日が自然。on the same page は「認識が一致」。' }],
  ['mean', 'yb-table-it', 'wolfgang', "Let's table this until Thursday, when the whole team's there.",
    'この件は、全員がそろう木曜まで保留にしましょう。 → つまり、木曜まで先送りしたい。',
    '米国の table は「保留・後回し」。議題に出すではない',
    ['He wants to put it off until Thursday.', 'He wants to drop the topic for good.', 'He wants to settle it right now, before Thursday.'],
    tg(40, 'colleague', 'literal', [], ['idiom']), { scene: 'office',
      ctx: '会議で、人がそろわない議題が出ました', cja: ['木曜まで先送りしたい。', 'その話題を完全にやめたい。', '木曜を待たずに今すぐ決めたい。'],
      why: 'アメリカ英語の table は「保留する・後回しにする」（イギリスでは逆に「議題に出す」）。until Thursday とあるので、やめるのではなく先送り。' }],
  ['word', 'yb-could-have-email', 'kk-slider', "Wow. Ninety minutes, and it could've been one email.",
    'うわ。90分もかけて、メール1通で済んだのに。',
    "皮肉。coulda＝could have。should との差は頭の音",
    ["could've", "should've", "would've"],
    tg(44, 'colleague', 'sarcasm', [], ['contraction', 'intonation']),
    { tts: "Wow. Ninety minutes, and it coulda been one email.", scene: 'office', marks: [['say', "could've", 'coulda']],
      ctx: '長い会議が終わって、同僚がぼやいています', cja: ['（〜で）済んだのに', '（〜す）べきだったのに', '（〜）だっただろうに'],
      why: "could've been an email は「メールで済んだのに」という定番の皮肉。coulda と縮み、should've（shoulda）とは最初の音で区別する。" }],
  ['num', 'yb-headcount', 'stitches', "We're at 38 sign-ups, minus the 5 who canceled, plus the 3 from the Denver office.",
    '申込みは38人、キャンセルの5人を引いて、デンバー支社の3人を足して。',
    '38−5＋3＝36。最初の数字は罠',
    ['36人', '38人', '46人'],
    tg(44, 'colleague', 'literal', [], ['numbers']),
    { ask: '最終的な 人数は？', focus: '38 sign-ups', tts: "We're at thirty-eight sign-ups, minus the five who canceled, plus the three from the Denver office.",
      scene: 'office', marks: [['say', '38', 'thirty-eight'], ['stress', 'minus plus']],
      ctx: 'イベントの参加人数を、同僚と確認中', cja: ['36人', '38人', '46人'],
      why: '38人から5人を引いて3人を足すと36人。最初の38人は途中の数、46人は足し引きを逆にした数。minus と plus を聞き分けよう。' }],
  ['mean', 'yb-that-fly', 'sterling', "Noted. I'm not sure that'll fly with the client, but let's see what they say.",
    '了解。それがクライアントに通るかは怪しいけど、反応を見てみよう。 → つまり、受け入れられないと思っている。',
    'fly＝通用する。飛行機の話ではない',
    ['He thinks the client may say no.', "He's sure the client will love it.", "He's flying out to meet them."],
    tg(41, 'colleague', 'hedge', [], ['idiom', 'contraction']), { scene: 'office',
      ctx: 'クライアント向けの提案を、上司が見ています', cja: ['クライアントは断るかもしれないと思っている。', 'クライアントは絶対に気に入ると思っている。', '飛行機で会いに行くところだ。'],
      why: "that'll fly は「通用する・受け入れられる」。I'm not sure that'll fly は「通らないと思う」の婉曲表現。飛行機の意味は罠。" }]
];

// ---- explaining processes ---------------------------------------------------------------------------------------------

const PROCESS: readonly Row[] = [
  ['num', 'yb-business-days', 'flick', "Once we get the form, it's 3 to 5 business days for review, then another 10 for the card to arrive.",
    '書類が届いてから審査に3〜5営業日、さらにカード到着まで10営業日です。',
    '3〜5日＋10日。最長は5＋10＝15',
    ['15日', '10日', '13日'],
    tg(21, 'official', 'literal', ['phone'], ['numbers']),
    { ask: '最長で 何営業日？', focus: 'another 10', tts: "Once we get the form, it's three to five business days for review, then another ten for the card to arrive.",
      scene: 'living', marks: [['say', '3 to 5', 'three to five'], ['say', '10', 'ten']],
      ctx: 'カード会社に電話で、発行の流れを聞いています', cja: ['15日', '10日', '13日'],
      why: '審査3〜5営業日のあと、到着まで10営業日。最長は5＋10＝15日。10日は配送だけの日数。business days は「営業日」。' }],
  ['reply', 'yb-make-sense', 'cj', 'So you scan it, tag it, and then it goes to finance for sign-off. Does that make sense?',
    'スキャンしてタグを付けたら、経理の承認に回る。わかった？ →「だいたい。経理で止まったら誰に催促すれば？」',
    'Does that make sense? は確認。質問で返してよい',
    ['Mostly. Who do I bug if finance sits on it?', 'Yes, it makes sense to sign off now.', "No, I've never been up to the finance floor."],
    tg(43, 'colleague', 'literal', [], ['ellipsis']), { scene: 'office',
      ctx: '職場で、先輩が経費精算の手順を説明中', cja: ['だいたい。経理で止まったら誰に催促すれば？', 'うん、今承認するのは理にかなってるね。', 'いや、経理のフロアには行ったことがないよ。'],
      why: 'Does that make sense? は「わかった？」の確認。理解を示して具体的に質問するのが自然。bug は「催促する」、sit on it は「放置する」。' }],
  ['mean', 'yb-skip-step', 'faith', "You can skip step four, technically. I just wouldn't, unless you enjoy starting again from scratch.",
    '手順4は一応飛ばせるよ。私ならやらないけどね、一からやり直すのが好きなら別だけど。 → つまり、手順4は飛ばすな。',
    "technically＝一応。I wouldn't＝やめとけ",
    ["Don't skip step four.", 'Step four is optional and harmless.', 'Starting again is quicker.'],
    tg(43, 'colleague', 'humour', [], ['contraction', 'accent-exposure']), { scene: 'office',
      ctx: '職場で、先輩がシステムの手順を教えています', cja: ['手順4は飛ばさないで。', '手順4は任意で、飛ばしても問題ない。', 'やり直したほうが早い。'],
      why: "technically は「一応は」。I just wouldn't は「私ならやらない＝やめとけ」。後半の皮肉は、飛ばすと一からやり直しになるという意味。" }],
  ['word', 'yb-fill-out', 'rosie', 'Just fill out the top half and leave the rest to us.',
    '上半分だけ記入して、残りはこちらに任せてください。',
    '書類は米で fill out。fill‿out とつながる',
    ['fill out', 'fill in', 'feel out'],
    tg(24, 'service', 'literal', [], ['flap', 'weak-form']),
    { tts: "Just fill out the top half 'n' leave the rest to us.", scene: 'pharmacy', marks: [['link', 'fill out'], ['say', 'and', "'n'"]],
      ctx: '薬局の窓口で、書類を渡されました', cja: ['記入する', '書き込む', '探りを入れる'],
      why: '書類の記入はアメリカでは fill out が普通（fill in はイギリス寄り）。fill‿out はつながって「フィラウト」に聞こえる。feel out は「探る」。' }],
  ['reply', 'yb-working-days', 'agnes', 'Your new card should arrive in seven to ten business days, but you can start using it in the app today.',
    '新しいカードは7〜10営業日で届きますが、アプリなら今日から使えます。 →「へえ、いいですね。じゃあ、それまではアプリで使えるんですね？」',
    'business days＝営業日。アプリでは先に使える',
    ['Oh, nice. So I can use the app till then?', "I'll show you my old card if you need it.", "That's fine. I only work weekdays."],
    tg(21, 'service', 'formula', [], ['numbers']), { scene: 'street',
      ctx: '銀行の窓口で、カードの再発行を頼みました', cja: ['へえ、いいですね。じゃあ、それまではアプリで使えるんですね？', '必要なら古いカードをお見せします。', '大丈夫です。私は平日しか働かないので。'],
      why: 'カードは7〜10営業日で届くが、アプリでは今日から使える。but 以降の情報に反応するのが自然。business days を自分の勤務と取るのは罠。' }],
  ['num', 'yb-check-in-closes', 'ken', "Check-in closes 45 minutes before departure, so with a 7:15 flight, you'll want to be through by 6:30.",
    'チェックインは出発45分前に締め切りなので、7時15分の便なら6時半までに済ませてください。',
    '7:15の45分前＝6:30。数字三つの役割を分ける',
    ['6:30', '7:15', '6:45'],
    tg(1, 'service', 'literal', ['desk'], ['numbers', 'wanna']),
    { ask: '何時までに 手続き？', focus: '6:30', tts: "Check-in closes forty-five minutes before departure, so with a seven-fifteen flight, you'll wanna be through by six-thirty.",
      scene: 'gate', marks: [['say', '45', 'forty-five'], ['say', '7:15', 'seven-fifteen'], ['say', 'want to', 'wanna'], ['say', '6:30', 'six-thirty']],
      ctx: '空港で、係員がチェックインの締め切りを説明', cja: ['6時30分', '7時15分', '6時45分'],
      why: "7時15分の45分前なので6時30分。7時15分は出発時刻。you'll want to（wanna）は「〜したほうがいい」というやわらかい指示。" }]
];

// ---- hedged recommendations -------------------------------------------------------------------------------------------

const RECOMMEND: readonly Row[] = [
  ['mean', 'yb-sit-tight', 'lopez', "I mean, it's your call, but if it were my money, I'd probably sit tight till the new model's out.",
    'まあ決めるのは君だけど、僕のお金なら新型が出るまでじっと待つかな。 → つまり、今は買わずに待つのがいい。',
    "it's your call の後が本音。sit tight＝じっと待つ",
    ["He'd wait for the new model.", 'He thinks you should buy it now.', "He's offering to lend you money."],
    tg(26, 'friend', 'hedge', [], ['idiom', 'contraction']), { scene: 'street',
      ctx: '新しいスマホを買うか、友だちに相談中', cja: ['自分なら新型が出るまで待つ。', '今すぐ買うべきだと思っている。', 'お金を貸そうとしている。'],
      why: "it's your call（決めるのは君）は前置きで、if it were my money の後が本音。sit tight は「動かずに待つ」。" }],
  ['word', 'yb-might-as-well', 'bunnie', 'Honestly, you might as well wait for the sale at this point.',
    '正直、ここまで来たらセールを待ったほうがいいよ。',
    'might as well＝〜したほうがまし。as は弱く縮む',
    ['might as well', 'may as well', 'might well'],
    tg(26, 'friend', 'hedge', [], ['weak-form', 'idiom']),
    { tts: "Honestly, you might's well wait for the sale at this point.", scene: 'street', marks: [['say', 'might as well', "might's well"]],
      ctx: '買い物中、友だちが値段を見て一言', cja: ['〜したほうがまし', '〜したほうがまし（別の言い方）', 'たぶん〜するだろう'],
      why: "might as well は might's well と縮み、as はほぼ消える。「ここまで来たら〜したほうがまし」。may as well も同じ意味だが、音は might。" }],
  ['mean', 'yb-double-check', 'tia', 'You might want to double-check that figure before it goes to the client.',
    'クライアントに出す前に、その数字をもう一度確認したほうがいいかもね。 → つまり、間違っていると思う。',
    'might want to＝やんわりした指示。誤りの示唆',
    ['She suspects the figure might be wrong.', 'She has checked it and it\'s correct.', 'She wants to send it to the client herself.'],
    tg(42, 'colleague', 'indirect', [], ['wanna']),
    { tts: 'You might wanna double-check that figure before it goes to the client.', scene: 'office', marks: [['say', 'want to', 'wanna']],
      ctx: '上司が、提出前の資料を見ています', cja: ['数字が間違っているかもと疑っている。', '確認済みで、数字は正しい。', '自分でクライアントに送りたい。'],
      why: 'You might want to… は「〜したほうがいいかも」というやわらかい指示。数字の再確認を勧めるのは、間違いを遠回しに指摘している。' }],
  ['word', 'yb-ought-to', 'genji', 'You ought to book your tickets early. They tend to sell out by Friday.',
    'チケットは早めに取ったほうがいいよ。金曜には売り切れがちだから。',
    'oughta＝ought to。gotta（got to）と聞き分け',
    ['ought to', 'got to', 'have to'],
    tg(17, 'friend', 'hedge', [], ['weak-form', 'gotta', 'accent-exposure']),
    { tts: 'You oughta book your tickets early. They tend to sell out by Friday.', marks: [['say', 'ought to', 'oughta']],
      ctx: '友だちが、コンサートのチケットについて助言', cja: ['〜したほうがいい', '〜しなきゃ', '〜しなければならない'],
      why: 'ought to は oughta と縮む。「〜したほうがいい」という助言。gotta（got to）は義務で、最初の音が違う。' }],
  ['reply', 'yb-go-for', 'tammy', 'If you had to pick one, the ryokan in Hakone or the hotel in Yokohama, which would you go for?',
    'どちらか一つ選ぶなら、箱根の旅館と横浜のホテル、どっちにする？ →「箱根。旅館は奮発する価値があるよ。」',
    'go for＝選ぶ。二択には片方を答える',
    ["Hakone. A ryokan's worth the splurge.", 'I went to Yokohama last spring.', "I'll pick you up at the hotel."],
    tg(3, 'friend', 'literal', [], ['contraction']), { scene: 'living',
      ctx: '友だちと、週末の旅行先を相談しています', cja: ['箱根。旅館は奮発する価値があるよ。', '去年の春、横浜に行ったよ。', 'ホテルまで迎えに行くよ。'],
      why: 'go for は「〜を選ぶ」。二択を聞かれているので、片方を選んで理由を言うのが自然。過去の旅行の話や pick up（迎えに行く）はずれている。' }],
  ['mean', 'yb-too-soon', 'zucker', "It's not that the plan's bad. I just think we're trying to do too much, too soon.",
    '計画が悪いってわけじゃない。ただ、急いで欲張りすぎてる気がするんだ。 → つまり、規模を縮めてゆっくりやるべき。',
    "It's not that ~. I just…＝本音は後半",
    ['He wants a smaller, slower plan.', 'He thinks the plan itself is bad.', 'He wants the team to move faster.'],
    tg(40, 'colleague', 'hedge', [], ['contraction']), { scene: 'office',
      ctx: '新しい計画について、同僚が意見を言っています', cja: ['もっと小さく、ゆっくりした計画にしたい。', '計画そのものが悪いと思っている。', 'チームにもっと速く進んでほしい。'],
      why: "It's not that… I just think… は「〜というわけじゃない。ただ…」で、本音は後半。too much, too soon は「欲張りすぎ、急ぎすぎ」。" }]
];

// ---- customer support escalations -------------------------------------------------------------------------------------

const SUPPORT: readonly Row[] = [
  ['reply', 'yb-escalated', 'marina', "I've passed your question on to the head coach. She usually gets back to parents within 48 hours.",
    'ご質問はヘッドコーチに伝えました。保護者の方には、たいてい48時間以内に返事があります。 →「それまでに連絡がなかったらどうなりますか？」',
    'pass on＝伝える。まだ返事は来ていない',
    ["And what if I haven't heard back by then?", 'Great, so she said yes?', 'I can help coach on weekends, too.'],
    tg(22, 'official', 'formula', ['phone'], ['numbers']),
    { tts: "I've passed your question on to the head coach. She usually gets back to parents within forty-eight hours.", scene: 'living',
      marks: [['say', '48', 'forty-eight']],
      ctx: '子どものスポーツクラブに、電話で質問しました', cja: ['それまでに連絡がなかったらどうなりますか？', 'よかった、じゃあ承諾してくれたんですね？', '週末なら私もコーチを手伝えますよ。'],
      why: 'pass on は「伝える」。まだ返事は来ていないので、48時間以内に連絡がない場合を聞くのが自然。もう承諾されたと思うのは罠。' }],
  ['mean', 'yb-authorize', 'orville', "I'd love to give you Friday off, but that's above my pay grade. I can ask the boss for you, though.",
    '金曜休みにしてあげたいけど、それは僕が決められることじゃないんだ。でも、上に聞いてみるよ。 → つまり、自分では決められないが上に頼める。',
    'above my pay grade＝自分の権限外。依頼は可',
    ["He can't okay it, but he'll ask the boss.", "He's already said yes to giving you Friday off.", "He's refusing to get involved at all."],
    tg(42, 'colleague', 'refusal', [], ['idiom', 'contraction']), { scene: 'office',
      ctx: '職場で、金曜の休みを先輩に頼みました', cja: ['自分では決められないが、上に聞いてくれる。', 'もう金曜を休みにすると言ってくれた。', '一切関わろうとしない。'],
      why: 'above my pay grade は「自分の権限を超えている」。断っているようで、I can ask the boss for you と手助けを申し出ている。' }],
  ['num', 'yb-double-seven', 'ken', "Your case number is 507713. That's two sevens in the middle.",
    'お客様の受付番号は507713です。真ん中は7が二つです。',
    'two sevens＝77。0は「オー」と読む',
    ['507713', '507173', '570713'],
    tg(21, 'service', 'literal', ['phone'], ['numbers']),
    { ask: '受付番号は？', focus: '507713', tts: "Your case number is five-oh-seven, seven-one-three. That's two sevens in the middle.",
      scene: 'living', marks: [['say', '507713', 'five-oh-seven, seven-one-three']],
      ctx: 'サポート窓口から、受付番号を伝えられました', cja: ['507713', '507173', '570713'],
      why: '数字の0は「オー」と読むことが多い。「真ん中に7が二つ」とあるので507713。507、713という3桁ずつの区切りにも注意。' }],
  ['reply', 'yb-on-hold', 'lily', "I'm going to have to restart your phone in recovery mode, and anything that isn't backed up is gone. Is that OK?",
    'スマホをリカバリーモードで再起動しないといけない。バックアップしてないものは消えるけど、いい？ →「待って、先に写真をバックアップさせて。」',
    'isn’t backed up is gone＝消えるという警告',
    ['Wait, let me back up my photos first.', "I'm fully recovered now, thanks.", "No worries, my phone's not that old."],
    tg(43, 'friend', 'literal', [], ['gonna']),
    { tts: "I'm gonna have to restart your phone in recovery mode, and anything that isn't backed up is gone. Is that OK?", scene: 'living',
      marks: [['say', 'going to', 'gonna']],
      ctx: '友だちが、こわれたスマホを直してくれています', cja: ['待って、先に写真をバックアップさせて。', 'もうすっかり回復したよ、ありがとう。', '大丈夫、そんなに古いスマホじゃないよ。'],
      why: "isn't backed up is gone は「バックアップしていないものは消える」という警告。まず大事なデータを守るのが自然。recovery（回復）は罠。" }],
  ['mean', 'yb-goodwill', 'gayle', "I can't fix it for free, but since it's you, I'll knock the price down to half.",
    'タダで直すわけにはいかないけど、あなただから半額にしとくね。 → つまり、半額で直してくれる。',
    "since it's you＝あなただから。knock down＝下げる",
    ['You pay half the price.', "You don't pay anything at all.", 'You still pay the full price.'],
    tg(31, 'friend', 'refusal', [], ['contraction', 'idiom']), { scene: 'street',
      ctx: '自転車の修理を、店をやっている友だちに頼みました', cja: ['半額で払う。', '一切払わない。', 'やはり定価を払う。'],
      why: "for free ではないのでタダではない。since it's you は「あなただから特別に」、knock the price down は「値引きする」。半額が正解。" }],
  ['word', 'yb-hasnt-gone', 'kid-cat', "Hey, your Venmo for the cabin hasn't come through on my end.",
    'ねえ、コテージ代のVenmo、こっちにまだ届いてないよ。',
    "hasn't の t はほぼ消える。n の有無で判断",
    ["hasn't", 'has', 'had'],
    tg(27, 'friend', 'literal', [], ['contraction']),
    { tts: "Hey, your Venmo for the cabin hasn' come through on my end.", scene: 'living', marks: [['drop', "hasn't", 't']],
      ctx: '旅行の後、友だちが割り勘の送金について', cja: ['（まだ）〜していない', '〜した', '〜していた'],
      why: "hasn't の t はほぼ消えて hasn' と聞こえる。n の音が否定のサイン。「まだ届いていない」と催促している場面。" }],
  ['reply', 'yb-last-four', 'tangy', "Before I can do anything, I'll just need you to verify the last four digits of the card.",
    '手続きの前に、カード番号の下4桁で本人確認をお願いします。 →「はい、下4桁は6018です。」',
    'verify＝本人確認。下4桁を言うのが答え',
    ['Sure, last four: 6018.', "Four? I've only got one card.", 'Yes, the card is in my name.'],
    tg(21, 'service', 'formula', ['phone'], ['numbers']), { scene: 'living',
      ctx: 'カード会社に電話して、本人確認を求められました', cja: ['はい、下4桁は6018です。', '4？ カードは1枚しかありません。', 'はい、カードは私の名義です。'],
      why: 'verify the last four digits は「カード番号の下4桁で本人確認」。番号を言うのが答え。four を枚数と取るのは罠。' }]
];

// ---- medical explanations ---------------------------------------------------------------------------------------------

const MEDICAL: readonly Row[] = [
  ['num', 'yb-max-dose', 'pekoe', 'Take 2 tonight, then 1 every 8 hours, but no more than 6 in 24 hours.',
    '今夜2錠、その後は8時間ごとに1錠。ただし24時間で6錠までです。',
    'every 8 hours は間隔。上限は no more than の後',
    ['6錠', '8錠', '2錠'],
    tg(13, 'service', 'literal', [], ['numbers']),
    { ask: '24時間の 上限は？', focus: 'no more than 6', tts: 'Take two tonight, then one every eight hours, but no more than six in twenty-four hours.',
      scene: 'pharmacy', marks: [['say', '24', 'twenty-four'], ['stress', '6']],
      ctx: '薬局で、薬剤師が飲み方を説明しています', cja: ['6錠', '8錠', '2錠'],
      why: 'no more than 6 in 24 hours が上限。8は「8時間ごと」の間隔、2は今夜の量。数字それぞれの役割を聞き分けよう。' }],
  ['mean', 'yb-rule-out', 'nana', "It's probably nothing to worry about, but I'd like to rule a few things out, so I'm going to order some blood work.",
    'たぶん心配いりませんが、いくつか可能性を除外したいので、血液検査をしましょう。 → つまり、念のため検査する。',
    'rule out＝可能性を消す。blood work＝血液検査',
    ["It's a blood test, just to be safe.", 'The doctor has found something serious.', 'No tests are needed.'],
    tg(15, 'service', 'hedge', [], ['idiom', 'gonna']),
    { tts: "It's probably nothing to worry about, but I'd like to rule a few things out, so I'm gonna order some blood work.", marks: [['say', 'going to', 'gonna']],
      ctx: '診察室で、医師が検査について説明しています', cja: ['念のための血液検査。', '医師が深刻なものを見つけた。', '検査は必要ない。'],
      why: 'rule out は「可能性を除外する」。probably nothing to worry about なので、深刻な発見ではなく念のため。blood work は「血液検査」。' }],
  ['word', 'yb-tell-them', 'cj', "Call the office and tell them it's been three days, and ask for something stronger.",
    '病院に電話して、もう3日経つって伝えて、もっと強い薬を頼みなよ。',
    "'em＝them。him（'im）とは母音で区別",
    ['them', 'him', 'her'],
    tg(14, 'friend', 'literal', [], ['weak-form']),
    { tts: "Call the office and tell 'em it's been three days, and ask for something stronger.", scene: 'living', marks: [['say', 'them', "'em"]],
      ctx: '風邪が長引いて、友だちがアドバイスしています', cja: ['彼らに（病院の人に）', '彼に', '彼女に'],
      why: "them は 'em と縮んで「エム」に聞こえる。'im（him）とは母音が違う。the office（病院の受付）を指すので「彼ら」。" }],
  ['word', 'yb-mustnt-drive', 'mabel', "You mustn't drive for twenty-four hours after the sedation.",
    '鎮静剤のあと24時間は運転してはいけません。',
    "mustn't＝禁止。真ん中の t は発音しない",
    ["mustn't", 'must', "needn't"],
    tg(15, 'service', 'literal', [], ['contraction', 'weak-form', 'accent-exposure']),
    { tts: "You mussn't drive for twenty-four hours after the sedation.", scene: 'pharmacy', marks: [['say', "mustn't", 'MUSS-nt']],
      ctx: '内視鏡検査の後、看護師が注意しています', cja: ['〜してはいけない', '〜しなければならない', '〜する必要はない'],
      why: "mustn't は「マスント」で、真ん中の t は発音しない。禁止の意味。needn't は「必要ない」で、意味が逆になる。" }],
  ['word', 'yb-sprain', 'dom', "Good news: it's a sprain rather than a break, so you'll be back on your feet in a couple of weeks.",
    '骨折じゃなくて捻挫だから、2週間くらいで歩けるようになるよ。',
    'sprain＝捻挫。strain（筋の損傷）は sp/st で区別',
    ['sprain', 'strain', 'pain'],
    tg(17, 'friend', 'literal', [], ['contrast', 'idiom']),
    { ctx: '足をけがした友だちに、医者の友人が一言', cja: ['捻挫', '筋を痛めること（肉離れ）', '痛み'],
      why: 'sprain は「捻挫」。strain は筋肉の損傷で、sp と st の違いを聞く。rather than a break は「骨折ではなく」。' }],
  ['reply', 'yb-running-behind', 'bea', "The doctor's running about forty minutes behind. Are you okay to wait, or would you rather reschedule?",
    '先生は40分ほど遅れています。お待ちになりますか、それとも予約を取り直しますか？ →「待ちます。コーヒーを買いに出てもいいですか？」',
    'running behind＝予定より遅れている。走る話ではない',
    ["I'll wait. Okay if I grab a coffee?", 'Forty? I booked for four.', 'No, the doctor ran this morning.'],
    tg(20, 'service', 'literal', [], ['idiom', 'contraction']), { scene: 'pharmacy',
      ctx: '病院の受付で、待ち時間を告げられました', cja: ['待ちます。コーヒーを買いに出てもいいですか？', '40？ 4時に予約したんですが。', 'いいえ、先生は今朝走りました。'],
      why: 'running behind は「予定より遅れている」。待つか予約を取り直すかの質問に答えるのが自然。run（走る）や forty と four の混同は罠。' }],
  ['mean', 'yb-cut-back', 'marina', "I'm not saying cut it out altogether. Just maybe not three coffees before lunch.",
    '完全にやめろとは言ってないの。ただ、お昼前に3杯はどうかなって。 → つまり、量を減らして。',
    'cut out＝完全にやめる。言っているのは「減らせ」',
    ['Drink less coffee, not none.', 'Stop drinking coffee completely.', 'Only drink coffee after lunch.'],
    tg(15, 'service', 'hedge', [], ['idiom', 'contrast']), { scene: 'cafe',
      ctx: '3杯目のコーヒーを頼んだら、看護師の友人が一言', cja: ['やめなくていいから量を減らして。', 'コーヒーを完全にやめて。', 'お昼の後だけ飲んで。'],
      why: 'cut it out altogether は「完全にやめる」で、それは否定している。言いたいのは「お昼前に3杯は多い＝減らして」。' }]
];

// ---- contracts in plain speech ----------------------------------------------------------------------------------------

const CONTRACT: readonly Row[] = [
  ['mean', 'yb-notice-period', 'henry', "You're welcome to take her out of the program, of course. It's just that we require a full month's notice, and we'd need that in writing.",
    'もちろん退園は自由です。ただ、うちでは丸1か月前の通知が必要で、それを書面でいただきたいんです。 → つまり、1か月前に書面で通知が必要。',
    'notice＝事前の通知。すぐやめられるわけではない',
    ["You need a month's notice in writing.", 'You can take her out whenever you like.', 'The program itself ends in a month.'],
    tg(29, 'service', 'formula', ['phone'], ['contraction']), { scene: 'living',
      ctx: '保育園に、退園について電話しています', cja: ['書面で1か月前の通知が必要。', 'いつでも好きなときに退園させられる。', 'プログラム自体が1か月で終わる。'],
      why: "You're welcome to は「ご自由に」だが、It's just that の後が条件。full month's notice は「丸1か月前の通知」で、書面が必要。" }],
  ['reply', 'yb-small-print', 'sterling', "Read the fine print, man. There's a twelve-month minimum, and they charge you to leave early.",
    '細かい規約を読みなよ。最低12か月で、途中解約は料金を取られるぞ。 →「本当？ 途中でやめる料金はいくら？」',
    'fine print＝細則。文字の大きさの話ではない',
    ['Seriously? How much is the fee to leave?', "I can't read print that small either.", "Twelve? I've only got eleven bucks."],
    tg(29, 'friend', 'literal', [], ['idiom']),
    { ctx: '友だちが、スマホの契約について忠告しています', cja: ['本当？ 途中でやめる料金はいくら？', '僕もそんな小さい字は読めないよ。', '12？ 11ドルしか持ってないよ。'],
      why: 'fine print は「細かい規約」。最低12か月と解約金があると聞いたので、金額を確認するのが自然。字の大きさの話と取るのは罠。' }],
  ['num', 'yb-break-fee', 'octavian', "Break the lease in the first year and there's a fee of two months' rent, so $3,800.",
    '1年以内に契約を解除すると家賃2か月分の違約金、つまり3,800ドルかかります。',
    'thirty-eight hundred＝3,800。bucks＝ドル',
    ['$3,800', '$1,900', '$3,000'],
    tg(30, 'neighbour', 'literal', [], ['numbers', 'idiom']),
    { ask: '違約金は いくら？', focus: '$3,800', tts: "Break the lease in the first year and there's a fee of two months' rent, so thirty-eight hundred bucks.",
      scene: 'living', marks: [['say', '$3,800', 'thirty-eight hundred bucks']],
      ctx: '大家さんが、賃貸契約の条件を説明しています', cja: ['3,800ドル', '1,900ドル', '3,000ドル'],
      why: 'thirty-eight hundred は3,800。家賃2か月分なので、1,900ドルは1か月分。bucks は「ドル」のくだけた言い方。' }],
  ['mean', 'yb-not-liable', 'ken', "If anything gets broken while we're moving it, we're not liable unless you've bought the extra coverage.",
    '運搬中に何か壊れても、追加の補償に入っていなければ当社は責任を負いません。 → つまり、補償なしなら壊れても弁償なし。',
    'not liable＝責任を負わない。coverage＝補償',
    ['They only pay if you buy the coverage.', "They'll pay for any damage while moving.", 'The extra coverage is already included.'],
    tg(33, 'service', 'literal', ['phone'], ['contraction']), { scene: 'living',
      ctx: '引っ越し業者が、電話で補償の説明をしています', cja: ['補償に入った場合だけ弁償する。', '運搬中のどんな破損でも弁償する。', '追加補償はもう含まれている。'],
      why: "not liable は「責任を負わない」。unless you've bought the extra coverage なので、追加の補償に入っていなければ弁償なし。" }],
  ['word', 'yb-deductions', 'tom-nook', 'Your first paycheck looks small because of all the deductions for health insurance and taxes.',
    '最初の給料が少なく見えるのは、健康保険や税金がいろいろ差し引かれるからだよ。',
    'deductions＝天引き。reductions と頭の音で区別',
    ['deductions', 'reductions', 'deduction'],
    tg(46, 'boss', 'literal', [], ['ending']),
    { ctx: '入社後最初の給料日、上司が説明しています', cja: ['天引き（控除）', '値下げ・削減', '控除（単数）'],
      why: 'deductions は給料からの「天引き」。reductions とは最初の音（d と r）で区別する。all the の後なので複数形の s も聞こう。' }],
  ['reply', 'yb-sign-today', 'fang', "We'd need you to sign today to lock in this rate.",
    'この料金を確保するには、本日ご署名いただく必要があります。 →「署名する前に家で読みたいです。」',
    '即日署名の圧力。先に読むのが賢い返し',
    ["I'd like to read it at home before I sign.", "Sure, I'll lock the door on my way out.", 'I already signed up yesterday.'],
    tg(7, 'service', 'formula', [], ['contraction', 'idiom']), { scene: 'office',
      ctx: '営業担当が、契約を急がせています', cja: ['署名する前に家で読みたいです。', 'はい、出るときにドアに鍵をかけます。', 'もう昨日申し込みました。'],
      why: 'lock in this rate は「この料金を確保する」。即日署名は営業の圧力の常套手段なので、署名前に読みたいと言うのが賢い。lock（鍵）は罠。' }]
];

// ---- money: rent, salary, tax, bills, splitting -----------------------------------------------------------------------

const MONEY: readonly Row[] = [
  ['num', 'yb-split-four', 'audie', 'The Airbnb was $1,140 for three nights, plus a $60 cleaning fee, split four ways.',
    'Airbnbは3泊で1,140ドル、プラス清掃費60ドル。それを4人で割り勘ね。',
    '1,140＋60＝1,200を4人で。285は清掃費抜き',
    ['$300', '$285', '$1,200'],
    tg(27, 'friend', 'literal', [], ['numbers']),
    { ask: '1人 いくら？', focus: 'split four ways', tts: 'The Airbnb was eleven-forty for three nights, plus a sixty-dollar cleaning fee, split four ways.',
      scene: 'cafe', marks: [['say', '$1,140', 'eleven-forty'], ['say', '$60', 'sixty-dollar']],
      ctx: '旅行の後、友だちが宿代の割り勘を計算中', cja: ['300ドル', '285ドル', '1,200ドル'],
      why: '1,140ドルに清掃費60ドルを足して1,200ドル、4人で割ると300ドル。285ドルは清掃費を入れ忘れた額。eleven-forty は1,140。' }],
  ['num', 'yb-take-home', 'pietro', "On paper it's ¥380,000, but after tax and insurance I take home about ¥290,000.",
    '額面は38万円だけど、税金と保険を引くと手取りは29万円くらいなんだ。',
    'on paper＝額面。take home＝手取り',
    ['29万円', '38万円', '9万円'],
    tg(57, 'friend', 'attitude', [], ['numbers', 'idiom']),
    { ask: '手取りは？', focus: '¥290,000', tts: "On paper it's three hundred eighty thousand, but after tax and insurance I take home about two hundred ninety thousand.",
      scene: 'cafe', marks: [['say', '¥380,000', 'three hundred eighty thousand'], ['say', '¥290,000', 'two hundred ninety thousand']],
      ctx: '友だちが、新しい仕事の給料について話しています', cja: ['29万円', '38万円', '9万円'],
      why: 'on paper は「額面では」、take home は「手取り」。手取りは29万円。38万円は額面、9万円は差額で、どちらも罠。' }],
  ['num', 'yb-electric-bill', 'molly', "The electric bill's ¥11,800 this month, almost double last month's ¥6,200. It's the heater.",
    '今月の電気代は1万1,800円で、先月の6,200円のほぼ倍。暖房のせいだね。',
    'almost double は概算。実額は最初の数字',
    ['11,800円', '6,200円', '12,400円'],
    tg(35, 'partner', 'literal', [], ['numbers']),
    { ask: '今月の 電気代は？', focus: '¥11,800', tts: "The electric bill's eleven thousand eight hundred this month, almost double last month's six thousand two hundred. It's the heater.",
      scene: 'living', marks: [['say', '¥11,800', 'eleven thousand eight hundred'], ['say', '¥6,200', 'six thousand two hundred']],
      ctx: 'パートナーが、今月の電気代を見ています', cja: ['11,800円', '6,200円', '12,400円'],
      why: '今月は11,800円。6,200円は先月の額、12,400円は「ちょうど倍」の計算。almost double は概算なので、実額は最初の数字。' }],
  ['word', 'yb-wouldve-split', 'rosie', "Oh, come on, I would've split it with you if you'd just asked.",
    'もう、言ってくれれば割り勘にしたのに。',
    "woulda＝would have。could／should は頭の音で区別",
    ["would've", "could've", "should've"],
    tg(27, 'friend', 'attitude', [], ['contraction', 'weak-form']),
    { tts: "Oh, come on, I woulda split it with ya if you'd just asked.", scene: 'cafe', marks: [['say', "would've", 'woulda'], ['say', 'you', 'ya']],
      ctx: '友だちが一人で払ったと聞いて、一言', cja: ['（〜して）あげたのに', '（〜で）きたのに', '（〜す）べきだったのに'],
      why: "would've は woulda と縮む。if you'd just asked と合わせて「言ってくれたら割り勘にしたのに」。coulda、shoulda とは頭の音が違う。" }],
  ['mean', 'yb-on-me', 'stitches', "You got the last round, so this one's on me. And no, I'm not taking no for an answer.",
    'この前は君がおごったから、今回は僕が払う。断ってもだめだよ。 → つまり、絶対に自分が払う。',
    "this one's on me＝おごる。断らせない",
    ['He insists on paying this time.', 'He wants you to get this round too.', "He's turning down another drink."],
    tg(27, 'friend', 'formula', [], ['idiom', 'contraction']), { scene: 'cafe',
      ctx: 'バーで、友だちと会計をしようとしています', cja: ['今回は絶対に自分が払うと言っている。', 'この一杯もあなたに払ってほしい。', 'もう一杯を断っている。'],
      why: "this one's on me は「ここはおごる」。I'm not taking no for an answer は「断っても聞かない」。前回は相手が払ったので今回は自分の番。" }],
  ['num', 'yb-base-salary', 'judy', 'The base is $92K, with up to 15% bonus, so in a good year, just over $105K.',
    '基本給は9万2千ドル、ボーナスは最大15％。いい年なら10万5千ドルを少し超えるわ。',
    'base＝基本給。105Kはボーナス込みの額',
    ['$92,000', '$105,000', '$15,000'],
    tg(46, 'official', 'literal', ['phone'], ['numbers']),
    { ask: '基本給は？', focus: '$92K', tts: 'The base is ninety-two K, with up to fifteen percent bonus, so in a good year, just over a hundred and five.',
      scene: 'living', marks: [['say', '$92K', 'ninety-two K'], ['say', '15%', 'fifteen percent'], ['say', '$105K', 'a hundred and five']],
      ctx: '転職先の人事から、給与の説明の電話です', cja: ['9万2千ドル', '10万5千ドル', '1万5千ドル'],
      why: 'base は「基本給」で9万2千ドル。10万5千ドルはボーナス込みの最高額、15はボーナスの割合（％）。K は「千」。' }],
  ['word', 'yb-didnt-include', 'gulliver', "Just so you know, the quote didn't include tax or delivery.",
    '念のためですが、見積もりには税金と配送料が含まれていませんでした。',
    "didn't の t は弱い。過去の否定を聞き逃さない",
    ["didn't", 'did', "doesn't"],
    tg(33, 'service', 'literal', ['phone'], ['contraction']),
    { tts: "Just so you know, the quote didn' include tax or delivery.", scene: 'living', marks: [['drop', "didn't", 't']],
      ctx: '家具店から、見積もりについて電話がありました', cja: ['含んでいなかった', '含んでいた', '含んでいない'],
      why: "didn't の t は弱く、didn' と聞こえる。Just so you know（念のため）の後は、追加の費用がかかるという注意。" }]
];

// ---- opinions on current-life topics ----------------------------------------------------------------------------------

const OPINION: readonly Row[] = [
  ['mean', 'yb-in-theory', 'beau', "Remote work's great in theory. In practice, I end up answering emails at eleven at night.",
    'リモートワークは理屈では最高。でも実際は、夜11時にメールに返信する羽目になる。 → つまり、仕事と私生活の境がなくなる。',
    'in theory／in practice の対比。後半が本音',
    ['Work creeps into his evenings.', 'He loves working late at night.', 'He prefers the office in every way.'],
    tg(65, 'colleague', 'attitude', [], ['contrast', 'contraction']), { scene: 'office',
      ctx: '同僚と、リモートワークについて雑談中', cja: ['仕事が夜の時間に入り込んでくる。', '夜遅く働くのが大好きだ。', 'あらゆる点でオフィスのほうがいい。'],
      why: 'in theory（理屈では）と in practice（実際は）の対比で、後半が本音。夜11時のメールは、仕事が私生活に入り込むという不満。' }],
  ['reply', 'yb-cant-face', 'katt', "Kyoto's beautiful, but honestly, I can't deal with the crowds at Fushimi Inari again.",
    '京都はすてきだけど、正直、伏見稲荷の人混みはもう無理。 →「夜明けに行きなよ。7時前なら人混みはないよ。」',
    "can't deal with＝もう無理。can と聞き違えない",
    ['Go at dawn. No crowds before seven.', "Great, so you're up for going again?", "I've never been to Fushimi Inari either."],
    tg(12, 'friend', 'attitude', [], ['idiom', 'can-cant']), { scene: 'street',
      ctx: '友だちと、日本旅行の計画を話しています', cja: ['夜明けに行きなよ。7時前なら人混みはないよ。', 'いいね、じゃあまた一緒に行けるんだ？', '私も伏見稲荷には行ったことないよ。'],
      why: "can't deal with は「もう無理」。can't の t は弱く、can と聞き違えると「また行ける」と取ってしまう。人混みを避ける方法を勧めるのが自然。" }],
  ['mean', 'yb-anywhere-near', 'goldie', "AI's great for a first draft. I just wouldn't let it anywhere near the final version.",
    'AIは下書きには最高。ただ、最終版には絶対に触らせないね。 → つまり、AIは下書き用だけ。',
    "wouldn't let it anywhere near＝絶対に任せない",
    ['She only trusts AI for first drafts.', 'She trusts AI with the final version.', "She doesn't use AI at all."],
    tg(43, 'colleague', 'attitude', [], ['idiom', 'contraction']), { scene: 'office',
      ctx: '同僚と、仕事でのAIの使い方を話しています', cja: ['人工知能を信用するのは下書きだけ。', '最終版も人工知能に任せている。', '人工知能をまったく使わない。'],
      why: "great for a first draft で下書きには使うとわかる。wouldn't let it anywhere near は「絶対に近づけない＝任せない」。" }],
  ['reply', 'yb-saitama-or-central', 'bob', 'Would you rather have a bigger place out in Saitama, or something tiny in central Tokyo?',
    '埼玉の広めの家と、都心の狭い家、どっちがいい？ →「都心かな。通勤がいやだから。」',
    '二択の質問に Yes／No で答える罠',
    ["Central. I'd hate the commute.", "I'd rather have a bigger salary.", 'Yeah, I think I would, honestly.'],
    tg(36, 'friend', 'literal', [], ['contraction']), { scene: 'living',
      ctx: '友だちと、東京の住まい探しの話をしています', cja: ['都心かな。通勤がいやだから。', 'もっと高い給料のほうがいいな。', 'うん、正直そうすると思う。'],
      why: 'Would you rather A or B? は二択の質問なので、Yes／No では答えにならない。片方を選んで理由を言うのが自然。' }],
  ['mean', 'yb-good-on-you', 'teddy', "Cold plunges? Hey, if it works for you, more power to you. I'll stick to a hot bath.",
    '冷水浴？まあ、君に合うならどうぞご自由に。僕は熱い風呂で十分。 → つまり、自分はやる気がない。',
    'more power to you＝どうぞご自由に。自分はやらない',
    ["He's not interested in trying it.", "He's going to try one soon.", 'He thinks cold plunges are dangerous.'],
    tg(18, 'friend', 'attitude', [], ['idiom']),
    { ctx: '友だちが、冷水浴にはまっていると言いました', cja: ['自分はやってみる気がない。', 'もうすぐやってみるつもり。', '冷水浴は危険だと思っている。'],
      why: "more power to you は「いいんじゃない、どうぞご自由に」。応援しつつ、I'll stick to a hot bath で自分はやらないと言っている。" }],
  ['num', 'yb-tourists', 'frett', 'Apparently something like 36 million tourists came last year, and half of them were in my neighborhood konbini.',
    '去年は観光客が3,600万人くらい来たらしいよ。で、その半分がうちの近所のコンビニにいた。',
    'half はジョーク。数字は thirty-six million',
    ['3,600万人', '1,800万人', '3,000万人'],
    tg(12, 'friend', 'humour', [], ['numbers', 'teen-ty']),
    { ask: '観光客は 何人？', focus: '36 million', tts: 'Apparently somethin\' like thirty-six million tourists came last year, and half of them were in my neighborhood konbini.',
      scene: 'street', marks: [g('something'), ['say', '36', 'thirty-six']],
      ctx: '友だちが、東京の観光客の多さについてぼやいています', cja: ['3,600万人', '1,800万人', '3,000万人'],
      why: 'thirty-six million は3,600万人。half of them はジョークで、1,800万人はその半分。3,000万人は thirty だけ聞いた罠。' }]
];

// ---- dialogues ----------------------------------------------------------------------------------------------------------

interface DRow extends DialogueRow, Help {
  family: Family;
  lines: readonly L[];
  scene?: SceneId;
  channel?: Channel;
}

const dialogue = (r: DRow): Item => {
  FAMILY_OF[r.id] = r.family;
  return {
    ...dialogueOf(LV, r, r.lines.map(line)),
    ...(r.scene && { scene: r.scene }), ...(r.channel && { channel: r.channel }),
    ...helpOf(r)
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
    ctx: 'ウェブ制作の業者と、依頼主が電話で相談中',
    cja: ['追加料金がかかり、見積もりが送られてくる。', 'すぐできるので無料で追加してくれる。', '今夜中にページを仕上げる。'],
    why: 'outside the original scope は「当初の契約範囲外」で、別料金になる。Happy to は引き受ける意思。今夜送るのは見積もりで、ページではない。',
    tags: tg(41, 'service', 'refusal', ['phone'], ['idiom']), scene: 'office'
  },
  {
    id: 'dyb-supervisor', family: 'complain', type: 'next', focus: 'realistically',
    lines: [
      ['tia', "I've been on hold for forty minutes, and now you're telling me you can't issue a refund?", '40分も保留にされて、今度は返金できないって言うんですか？'],
      ['lily', 'I completely understand your frustration. What I can do is escalate it to a supervisor today.', 'お怒りはごもっともです。私にできるのは、本日中に上の者へ上げることです。'],
      ['tia', 'And how long will that take, realistically?', 'で、実際のところ、どのくらいかかるんですか？']
    ],
    choices: ['Usually within one business day.', 'About forty minutes, like before.', 'I can escalate it to a supervisor.'],
    ja: 'たいてい1営業日以内です。', note: 'realistically＝本当のところ。期間で答える',
    ctx: '返金を断られた客が、電話で問い詰めています',
    cja: ['たいてい1営業日以内です。', '前と同じで40分くらいです。', '上の者に回すことはできます。'],
    why: 'how long, realistically? は「本当のところ何日？」という質問なので、期間で答える。40分は保留の時間、上に回すのはすでに言ったこと。',
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
    ctx: 'オンライン会議の終わり近く、残り時間が少ない',
    cja: ['木曜の電話会議の冒頭に回る。', '残りの5分で終わらせる。', '経理が一人で決める。'],
    why: '5分は残り時間で、予算の話は木曜の会議の最初の10分に回る。as long as finance can join は「経理が参加できるなら」という条件。',
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
    choices: ['Two grand? Can I get that in writing?', "Great! So you're all done here, then?", "Another week? Sure, I'll grab a coffee."],
    ja: '2千ドル？ それを書面でもらえますか？', note: 'grand＝千ドル。直ったで終わりではない',
    ctx: '家の水漏れの修理業者が、報告に来ました',
    cja: ['2千ドル？ それを書面でもらえますか？', 'よかった！ じゃあもう全部終わったんですね？', 'もう1週間？ じゃあコーヒーを買ってきます。'],
    why: 'good news and bad news の悪い方は「床が腐っていて、あと1週間と2千ドル」。grand は「千ドル」。高額なので書面で確認するのが自然。',
    tags: tg(31, 'service', 'literal', [], ['idiom', 'numbers']), scene: 'door'
  },
  {
    id: 'dyb-blood-pressure', family: 'medical', type: 'gist', ask: '医者の 判断は？', focus: 'Not yet',
    lines: [
      ['reneigh', "Your blood pressure's a little on the high side. Not dangerous, but I'd like to keep an eye on it.", '血圧が少し高めですね。危険ではありませんが、様子を見ておきたいです。'],
      ['dom', 'So do I need to start taking something?', 'じゃあ、何か薬を飲み始めないといけませんか？'],
      ['reneigh', "Not yet. Cut back on salt, walk a little more, and we'll recheck in three months.", 'まだです。塩分を控えて、もう少し歩いて、3か月後に再検査しましょう。']
    ],
    choices: ['No pills yet: less salt, more walking.', 'He has to start taking medicine today.', 'His blood pressure is at a dangerous level.'],
    ja: 'まだ薬はなし。減塩と運動から。', note: 'Not yet＝まだ不要。3か月後に再検査',
    ctx: '健康診断の結果を、医師が説明しています',
    cja: ['まだ薬はなし。減塩と運動から。', '今日から薬を飲み始めなければならない。', '血圧が危険なレベルだ。'],
    why: 'Not yet は「まだ薬は不要」。on the high side は「高め」だが、Not dangerous と言っている。keep an eye on は「様子を見る」。',
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
    choices: ["Let's take her salad off, then split it.", "I'll just have a salad next time too.", 'Rough? I thought the steak was good.'],
    ja: '彼女のサラダ代を引いてから割ろう。', note: 'rough on〜＝〜に不公平。料理の話ではない',
    ctx: 'レストランで、友だちと割り勘の相談中',
    cja: ['彼女のサラダ代を引いてから割ろう。', '次は私もサラダだけにするよ。', 'ひどい？ ステーキはおいしかったけど。'],
    why: 'rough on Jess は「ジェスにはかわいそう・不公平」。サラダだけの人が均等割りで損をするので、その分を引くのが自然な提案。料理の話ではない。',
    tags: tg(27, 'friend', 'indirect', ['cafe'], ['numbers', 'idiom']), scene: 'cafe'
  },
  {
    id: 'dyb-check-in-photos', family: 'contract', type: 'gist', ask: '女性が 言いたいことは？', focus: 'move-in photos',
    lines: [
      ['bunnie', 'So when do I get my deposit back?', 'で、敷金はいつ返ってきますか？'],
      ['tom-nook', "Within thirty days, minus cleaning. And the wall where the shelf was, that'll need patching.", '30日以内、清掃費を引いてね。それと棚があった壁、あそこは補修が必要だ。'],
      ['bunnie', "The shelf was there when I moved in, though. It's in the move-in photos.", 'でも、あの棚は入居時からありましたよ。入居時の写真に写ってます。']
    ],
    choices: ["She shouldn't pay to patch the wall.", 'She wants the shelf back.', "She'll pay for the cleaning and the wall."],
    ja: '壁の補修代を払うべきではない。', note: '入居時からある＝修理費は払わない主張',
    ctx: '退去の立ち会いで、大家さんと話しています',
    cja: ['壁の補修代を払うべきではない。', '棚を返してほしい。', '清掃費と壁の補修費を払う。'],
    why: '棚は入居時からあり、写真もあると言っている。つまり壁の補修は自分の責任ではないという主張。though は「でも」と反論の合図。',
    tags: tg(30, 'neighbour', 'indirect', [], ['contraction']), scene: 'living'
  },
  {
    id: 'dyb-potato', family: 'opinion', type: 'next', focus: 'Potato, potahto',
    lines: [
      ['wolfgang', 'Honestly, half our team could be replaced by AI in five years.', '正直、5年でうちのチームの半分はAIに置き換わるかもね。'],
      ['audie', 'Replaced? Or just doing different work?', '置き換わる？ それとも違う仕事をするだけ？'],
      ['wolfgang', "Potato, potahto. Either way, nobody's job looks the same.", '言い方の違いだよ。どっちにしろ、誰の仕事も今のままじゃない。']
    ],
    choices: ["Sure, but 'different' isn't the same as 'gone'.", 'Either way, I like my potatoes mashed.', "Five years? I've been on this team for six."],
    ja: 'そうだけど、「違う」と「なくなる」は別だよ。', note: 'Potato, potahto＝言い方の違いだけ',
    ctx: '同僚と、AIで仕事がどう変わるか話しています',
    cja: ['そうだけど、「違う」と「なくなる」は別だよ。', 'どっちにしろ、ジャガイモはマッシュが好きだな。', '5年？ 僕はこのチームに6年いるよ。'],
    why: 'Potato, potahto は「言い方が違うだけ」という決まり文句。相手は同じだと言うので、違いを指摘して反論するのが自然。ジャガイモの話ではない。',
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
    choices: ["It's canceled, just this once.", 'She has to pay the full ¥23,000.', "They'll split it with her, half each."],
    ja: '今回に限り免除される。', note: 'waive＝免除。one-time thing＝今回だけ',
    ctx: 'スマホの請求について、サポートに電話中',
    cja: ['今回に限り、請求は取り消される。', '2万3千円を全額払わなければならない。', '会社と半分ずつ負担する。'],
    why: 'waive は「（料金を）免除する」、as a one-time thing は「今回だけ特別に」。船のネットワークの料金は請求されない。',
    tags: tg(22, 'service', 'literal', ['phone'], ['numbers', 'idiom']), scene: 'living'
  },
  {
    id: 'dyb-kanazawa', family: 'opinion', type: 'next', focus: 'a fraction of the crowds',
    lines: [
      ['whitney', "We were going to do Yosemite in July, but everyone says the valley's bumper-to-bumper.", '7月にヨセミテに行くつもりだったけど、谷は車でぎっしりだってみんな言うの。',
        "We were gonna do Yosemite in July, but everyone says the valley's bumper-to-bumper.", [['say', 'going to', 'gonna']]],
      ['julian', 'It is. Have you thought about Sequoia? Similar feel, a fraction of the crowds.', 'そうだよ。セコイアは考えた？ 雰囲気は似てて、人出はずっと少ない。'],
      ['whitney', "Ooh. And that's an easy drive from LA, isn't it?", 'へえ。ロサンゼルスから車で行きやすいんだよね？']
    ],
    choices: ['It is. About four hours, with traffic.', "Yes, it's bumper-to-bumper in July.", 'No, you can only drive to Yosemite.'],
    ja: 'そう。渋滞込みで4時間くらい。', note: '付加疑問は確認。所要時間で答えるのが自然',
    ctx: 'カフェで、友だちと夏の旅行の相談中',
    cja: ['そう。渋滞込みで4時間くらい。', 'うん、7月は渋滞でぎっしりだよ。', 'いや、車で行けるのはヨセミテだけだよ。'],
    why: "isn't it? の付加疑問は確認なので、そうだと答えて所要時間を言うのが自然。bumper-to-bumper（大渋滞）はヨセミテの話で、セコイアではない。",
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
    choices: ["Fair. Let's say the 15th.", "Tight? I'll loosen the budget, then.", 'Yes, you took on the new hires.'],
    ja: 'もっともだ。15日にしよう。', note: 'put a date on it＝日付を決めて。日で答える',
    ctx: '上司との面談で、昇給を交渉しています',
    cja: ['もっともだ。15日にしよう。', 'きついか。じゃあ予算をゆるめるよ。', 'うん、新人の担当を引き受けたね。'],
    why: 'put a date on it は「日付を決めてほしい」。あいまいな約束を具体的にする頼みなので、日付で答えるのが自然。tight（厳しい）は罠。',
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
    choices: ['He can still be seen, but may wait hours.', 'He has to book online and come back another day.', 'He only needs to bring this one form.'],
    ja: '手続きはできるが、何時間も待つかもしれない。', note: 'strictly＝厳密には。予約は必須でない',
    ctx: '入管の窓口で、在留カードの更新手続き',
    cja: ['手続きはできるが、何時間も待つかもしれない。', 'オンラインで予約して、別の日に出直さなければならない。', 'この書類一枚だけ持ってくればいい。'],
    why: "You don't, strictly は「厳密には予約は要らない」。ただ予約なし（walk-in）は2時間以上待つこともある。書類のほかパスポートや写真も必要。",
    tags: tg(43, 'official', 'literal', [], ['contraction']), scene: 'office'
  },
  {
    id: 'dyb-near-your-folks', family: 'recommend', type: 'next', focus: 'near your folks',
    lines: [
      ['rosie', "Should I take the job in Singapore? The money's way better.", 'シンガポールの仕事、受けるべきかな？ 給料がずっといいの。'],
      ['flick', "I mean, I'd never tell you what to do. But you did say you wanted to be near your folks.", 'まあ、どうしろとは絶対言わないけど。でも、家族の近くにいたいって言ってたよね。']
    ],
    choices: ["I know. That's the hard part.", "Right, so you think I should go?", 'Yes, Singapore is near my folks.'],
    ja: 'わかってる。そこが悩みどころなの。', note: '決めないと言いつつ反対を示唆',
    ctx: '友だちが、海外の仕事を受けるか迷っています',
    cja: ['わかってる。そこが悩みどころなの。', 'そうだよね、じゃあ行くべきってこと？', 'うん、シンガポールは家族の近くだよ。'],
    why: "I'd never tell you what to do と言いつつ、But の後で「家族の近くにいたいと言ってたよね」と遠回しに反対している。folks は「家族・両親」。",
    tags: tg(57, 'friend', 'indirect', [], ['contraction'])
  },
  {
    id: 'dyb-auto-renew', family: 'contract', type: 'gist', ask: 'わかることは？', focus: 'auto-renew',
    lines: [
      ['cyd', "Why's the gym still charging me? I stopped going in March.", 'なんでジムからまだ請求が来るんだ？ 3月から行ってないのに。'],
      ['saharah', "Did you actually cancel, though? Those contracts auto-renew unless you give thirty days' notice.", 'でも、ちゃんと解約した？ ああいう契約は30日前に通知しないと自動更新だよ。'],
      ['cyd', "Hang on, so not going isn't cancelling?", 'ちょっと待って、行かないだけじゃ解約にならないのか？']
    ],
    choices: ["He didn't cancel, so it auto-renewed.", 'The gym has been charging him by mistake.', 'He cancelled in March with notice.'],
    ja: '解約していないので、自動更新された。', note: '行かない≠解約。30日前の通知が要る',
    ctx: '友だちが、ジムの請求について困っています',
    cja: ['解約していないので、自動更新された。', 'ジムが間違って請求し続けている。', '3月に通知して解約した。'],
    why: '3月から行っていないだけで、解約はしていない。auto-renew は「自動更新」で、30日前の通知が必要。行かない＝解約ではない。',
    tags: tg(29, 'friend', 'literal', [], ['contraction', 'accent-exposure'])
  },
  {
    id: 'dyb-steer-clear', family: 'medical', type: 'next', focus: 'steer clear of alcohol',
    lines: [
      ['kicks', "Can I take these with the antibiotics I'm on?", '今飲んでいる抗生物質と一緒に、これを飲んでもいいですか？'],
      ['pekoe', 'Should be fine, but leave a couple of hours between them, and steer clear of alcohol till the course is done.', '大丈夫だと思いますが、2時間ほど間を空けて、飲み終わるまでお酒は控えてください。'],
      ['kicks', 'Not even one beer on the weekend?', '週末にビール1杯もだめですか？']
    ],
    choices: ["Sorry, not until the course is finished.", 'A couple of hours apart is fine.', "On the weekend? We're open Saturdays."],
    ja: 'ごめんなさい、飲み終わるまではだめです。', note: 'steer clear of＝避ける。course＝服用期間',
    ctx: '薬局で、薬の飲み合わせを聞いています',
    cja: ['ごめんなさい、飲み終わるまではだめです。', '2時間空ければ大丈夫です。', '週末？ 土曜も開いてますよ。'],
    why: 'steer clear of は「避ける」、course は「抗生物質の服用期間」。飲み終わるまでお酒はだめ。2時間空けるのは薬どうしの話。',
    tags: tg(13, 'service', 'literal', [], ['idiom']), scene: 'pharmacy'
  },
  {
    id: 'dyb-bins', family: 'complain', type: 'gist', ask: 'なにが おきた？', focus: 'It moved to Monday',
    lines: [
      ['henry', 'Evening. Sorry to bother you, but your trash cans have been out on the curb since Tuesday.', 'こんばんは。すみませんが、お宅のゴミ箱が火曜から道路脇に出たままでして。'],
      ['katt', "Oh, have they? Pickup's Thursday, isn't it?", 'あら、そうでした？ 収集は木曜ですよね？'],
      ['henry', 'It moved to Monday last month. There was a notice.', '先月から月曜になったんです。お知らせが来てましたよ。']
    ],
    choices: ['She missed the change to the pickup day.', "He's complaining about the noise on Tuesday.", 'Pickup is still on Thursday, as always.'],
    ja: '彼女は収集日の変更を見落としていた。', note: 'trash cans＝ゴミ箱。収集日が変わっていた',
    ctx: '夜、隣の住人がゴミ出しのことで訪ねてきました',
    cja: ['彼女は収集日の変更を見落としていた。', '火曜の騒音について苦情を言っている。', '収集日は今までどおり木曜だ。'],
    why: 'ゴミ箱が火曜から出しっぱなしなのは、収集日が先月から月曜に変わったのを知らなかったから。There was a notice は「お知らせがあった」。',
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
    ctx: 'オンラインの朝会で、進捗を報告しています',
    cja: ['二人とも他の人の作業待ちになっている。', 'ログイン画面が終わっていない。', '彼は決済のテスト方法を知らない。'],
    why: 'waiting on と come through は、どちらも「他の人待ち」の表現。blocking both of us は「二人とも作業が止まっている」。',
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
    ctx: '友だちに、確定申告について相談しています',
    cja: ['じゃあ、たぶん申告が必要だね。', 'よかった、会社がやってくれるよ。', '30万？ じゃあ上限以下だね。'],
    why: '副業の所得が20万円を超えると確定申告が必要。30万円は20万円を超えている。年末調整だけで済むのは、副業がない場合。',
    tags: tg(57, 'friend', 'literal', [], ['numbers'])
  },
  {
    id: 'dyb-under-promise', family: 'bad-news', type: 'next', focus: 'under-promise',
    lines: [
      ['fang', "The deck is solid. My only worry is the timeline slide. It's promising a lot.", '資料はしっかりしてる。唯一気になるのはスケジュールのスライドだね。約束しすぎかな。'],
      ['molly', 'Too optimistic, you mean?', '楽観的すぎるってことですか？'],
      ['fang', "Let's just say I'd rather under-promise and over-deliver.", 'まあ、控えめに約束して期待以上に応えるほうがいい、ってことさ。']
    ],
    choices: ["Got it. I'll pad the timeline.", "I'll promise even more, then.", "Great, so the timeline's fine as it is."],
    ja: 'わかりました。スケジュールに余裕を持たせます。', note: 'under-promise＝控えめに約束。日程に余裕を',
    ctx: '上司が、プレゼン資料にコメントしています',
    cja: ['わかりました。スケジュールに余裕を持たせます。', 'じゃあもっと約束します。', 'よかった、じゃあスケジュールはこのままでいいんですね。'],
    why: 'under-promise and over-deliver は「控えめに約束して期待以上に応える」。遠回しに日程が楽観的すぎると言っているので、余裕を持たせる。',
    tags: tg(42, 'boss', 'indirect', [], ['idiom']), scene: 'office'
  },
  {
    id: 'dyb-four-days', family: 'opinion', type: 'gist', ask: '二人は どう 思っている？', focus: 'until further notice',
    lines: [
      ['tasha', 'Have you heard? They want us in the office four days a week from January.', '聞いた？ 1月から週4日出社だって。'],
      ['raymond', 'Four? I moved to Kamakura because they said remote was permanent.', '4日？ リモートは恒久だって言うから鎌倉に引っ越したのに。'],
      ['tasha', "I know. Apparently 'permanent' meant 'until further notice'.", 'だよね。どうやら「恒久」って「追って通知があるまで」って意味だったみたい。']
    ],
    choices: ["They're annoyed about the four days.", "They're glad to go back to the office.", "They think it's only twice a week."],
    ja: '二人とも週4日出社に不満がある。', note: '皮肉。恒久のはずのリモートが撤回された',
    ctx: '同僚と、出社方針の変更について話しています',
    cja: ['二人とも週4日出社に不満がある。', 'オフィスに戻れて喜んでいる。', '週2回だけだと思っている。'],
    why: '「恒久的」のはずが「追って通知があるまで」だった、という皮肉。鎌倉に引っ越した人に週4日出社はつらい。until further notice は「当面の間」。',
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
