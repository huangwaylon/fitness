// ききみみ content: もり (S2, B2; docs/curriculum.md §3), daily life, services and travel. 70 single items (reply, mean,
// word, num) and 15 dialogues (gist, next), written for listeners who are already good (TOEIC 700+): shops and
// drugstores, restaurants and bars, hotels, flights, Amtrak and the subway, doctors and urgent care, banks, landlords and
// repairs, deliveries, the ward office, gyms, hair salons, neighbors and emergencies. American English throughout (US
// words, spelling, money and times; every voice a US one). Harder here means natural speed and reductions (spelled in
// `tts`: musta, didncha, whaddaya, 'em, s'posedly), the point in the second half of a turn, implied refusals and
// complaints, understatement and irony, phrasal verbs in context, numbers inside talk with the corrected value or a
// heard number as the trap; never rare words for their own sake.
//   Same shape as bank4.ts and dialogues.ts (a level-4 `Item`; `lv` is one constant, LV, for the integrator to move),
// but staged here: each row carries its scene (or null), its channel only where the conditions don't give it, and the
// sound marks of every clip with a `tts` (staging.ts's rules, which this file can't add to). Ids: `ml-` and `dml-`.
//   Voices: a villager's cast voice is cast.ts CAST's (the villagers this set added are there too, all US).
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Channel, Item, ItemType, Level, SceneId, SoundMark, Tags } from '../bank.ts';
import { MEAN_ASK, dialogueOf, g, line, single, tg, type DialogueRow, type L } from './build.ts';

/** The level these are filed under (もり, level 4). */
const LV: Level = 4;

/** The life family an item belongs to (coverage; the seed is the nearest §5.5 scenario). */
export type Family = 'shop' | 'food' | 'hotel' | 'travel' | 'health' | 'bank' | 'home' | 'delivery' | 'office' | 'gym' | 'salon' | 'neighbour' | 'emergency';

type X = { tts?: string; focus?: string; ask?: string; marks?: readonly SoundMark[]; channel?: Channel };
type Row = readonly [id: string, fam: Family, speaker: RosterId, scene: SceneId | null, en: string, ja: string, note: string, choices: readonly string[], tags: Tags, x?: X];
interface DRow extends DialogueRow {
  fam: Family;
  scene: SceneId | null;
  lines: readonly L[];
  channel?: Channel;
}

const FAM: Record<string, Family> = {};

const item = (type: ItemType) => ([id, fam, speaker, scene, en, ja, note, choices, tags, x = {}]: Row): Item => {
  FAM[id] = fam;
  const focus = type === 'word' ? choices[0] : x.focus;
  const ask = x.ask ?? (type === 'mean' ? MEAN_ASK : undefined);
  return {
    ...single(LV, type, id, speaker, en, ja, note, choices, tags),
    ...(x.tts && { tts: x.tts }), ...(focus && { focus }), ...(ask && { ask }), ...(scene && { scene }),
    ...(x.channel && { channel: x.channel }), ...(x.marks && { marks: x.marks })
  };
};

const dialogue = (r: DRow): Item => {
  FAM[r.id] = r.fam;
  return {
    ...dialogueOf(LV, r, r.lines.map(line)),
    ...(r.scene && { scene: r.scene }), ...(r.channel && { channel: r.channel })
  };
};

// ---- reply: the best reply (the right one first) --------------------------------------------------------------------

const REPLY: readonly Row[] = [
  ['ml-r-swap', 'shop', 'tia', 'street', 'Did you want to pick it up in the store, or have it shipped to your house?',
    '店舗で受け取りますか、それともご自宅に配送しますか？ →「配送でお願いします。車がないので。」',
    'A or B の質問。Yes/No では答えにならない',
    ["Shipped, please. I don't have a car.", 'Yes, I picked it up yesterday.', "It's a two-story house."],
    tg(26, 'service', 'literal', [], ['yod', 'wanna']),
    { tts: 'Didja wanna pick it up in the store, or have it shipped to your house?', marks: [['say', 'Did you', 'didja'], ['say', 'want to', 'wanna']] }],
  ['ml-r-corkage', 'food', 'hamlet', 'cafe', "You're welcome to bring your own, but there's a $20 corkage fee per bottle.",
    'お持ち込みは可能ですが、1本につき20ドルの持ち込み料がかかります。 →「なるほど。じゃあ、リストから頼みます。」',
    'corkage＝持ち込み料。but の後が本題',
    ["Fair enough. We'll just order off the list, then.", "Twenty bottles? That's a lot.", 'No thanks, I brought my own cork.'],
    tg(27, 'service', 'indirect', ['cafe'], ['numbers']),
    { tts: "You're welcome to bring your own, but there's a twenty-dollar corkage fee per bottle.", marks: [['say', '$20', 'twenty-dollar']] }],
  ['ml-r-card-machine', 'food', 'bud', 'cafe', "Our card reader's acting up. Got any cash on you?",
    'カードリーダーの調子が悪くて。現金、お持ちですか？ →「1セントもないです。近くにATMありますか？」',
    'acting up＝調子が悪い。on you＝手持ち',
    ['Not a cent, sorry. Is there an ATM nearby?', "Sure, I'll just put it on my card.", "Yeah, he's been acting up all day."],
    tg(27, 'service', 'literal', ['cafe'], ['ellipsis', 'contraction']),
    { tts: "Our card reader's actin' up. Got any cash on ya?", marks: [g('acting'), ['say', 'you', 'ya']] }],
  ['ml-r-incidentals', 'hotel', 'keaton', null, 'Should I put a hold on your card for incidentals, or would you rather leave a cash deposit?',
    '雑費の保証としてカードを仮押さえしますか、それとも現金のデポジットになさいますか？ →「カードで。仮押さえはいつ解除されますか？」',
    'incidentals＝客室の雑費。hold＝カードの仮押さえ',
    ["The card's fine. When does the hold come off?", "I'd rather not hold on, thanks.", 'Yes, I deposited it this morning.'],
    tg(3, 'service', 'formula', ['desk'])],
  ['ml-r-seats-together', 'travel', 'ken', 'street', "The only two spots left on the boat are up on the top deck. It gets pretty windy up there, just so you know.",
    'ボートで残っている2席は上のデッキだけです。念のため、上はかなり風が強いですよ。 →「大丈夫です。上着を持っていきます。」',
    'just so you know の後が条件。受けるか断るか',
    ["Fine by us. We'll bring jackets.", "Great, we'll take the bottom deck, then.", 'No thanks, I already know.'],
    tg(8, 'service', 'indirect')],
  ['ml-r-drink', 'health', 'pashmina', 'pharmacy', "Has anyone told you not to drink while you're on these?",
    'この薬を飲んでいる間は、お酒を控えるよう言われましたか？ →「いいえ、何も。まずいですか？」',
    'drink＝お酒。on these＝この薬を服用中',
    ["No, nobody mentioned it. Is that a problem?", 'Just water, thanks.', "I've been on them since Tuesday."],
    tg(13, 'service', 'literal', [], ['weak-form'])],
  ['ml-r-fortnight', 'health', 'admiral', null, 'And how long has this been going on, roughly?',
    'それで、こういう状態はだいたいいつから続いていますか？ →「よくなったり悪くなったりで、2週間くらいです。」',
    'How long＝いつから続くか。程度や今後ではない',
    ['On and off for a couple of weeks now.', 'Pretty rough, to be honest.', 'Hopefully not much longer.'],
    tg(15, 'service', 'literal')],
  ['ml-r-photo-id', 'bank', 'judy', null, "For a transfer that size, you'll need to come back with photo ID.",
    'その金額のお振込みですと、写真付きの身分証をお持ちのうえ、もう一度お越しいただく必要があります。 →「えっ、本当に？ 電話では誰もそんなこと言ってなかったのに。」',
    'that size＝その金額。服のサイズの話ではない',
    ['Seriously? Nobody told me that on the phone.', 'Sure, I can transfer the photo.', 'That size fits me fine, thanks.'],
    tg(21, 'service', 'literal', [], ['contraction'])],
  ['ml-r-bleed', 'home', 'cyrano', 'living', 'Have you tried bleeding the radiators? That usually does the trick.',
    'ラジエーターの空気抜きはしてみました？ たいていそれで直るんですが。 →「2回やりました。上のほうはまだ冷たいままです。」',
    'bleed＝ラジエーターの空気抜き。血ではない',
    ["Twice. They're still ice-cold at the top.", "No, nobody's bleeding.", "Sure, I'll turn the AC on."],
    tg(30, 'neighbour', 'hedge', ['phone'], ['idiom'])],
  ['ml-r-buzz-in', 'delivery', 'kabuki', 'door', 'Delivery for 304. You want to buzz me in, or should I just leave it in the lobby?',
    '304号室にお届けです。開けてもらえます？ それともロビーに置いときましょうか？ →「待って、下まで取りに行きます。」',
    'buzz in＝オートロックを開ける。置くのは配達員',
    ["Hang on, I'll come down and grab it.", "Yes, I'll leave it in the lobby.", "The lobby's buzzing tonight."],
    tg(37, 'stranger', 'literal', ['phone'], ['wanna', 'numbers']),
    { tts: 'Delivery for three-oh-four. You wanna buzz me in, or should I just leave it in the lobby?', marks: [['say', '304', 'three-oh-four'], ['say', 'want to', 'wanna']] }],
  ['ml-r-residence-card', 'office', 'nana', 'office', 'Did you bring your residence card, or just the passport?',
    '在留カードはお持ちですか、それともパスポートだけですか？ →「パスポートだけです。それじゃ足りませんか？」',
    'or just ～＝それとも～だけ？ 持参物で答える',
    ["Just the passport. Is that not enough?", "I've been a resident for two years.", 'Yes, I turned it in yesterday.'],
    tg(21, 'official', 'literal')],
  ['ml-r-induction', 'gym', 'sterling', null, 'Have you done an orientation yet, or are you good to just jump in?',
    '初回のオリエンテーションは受けました？ それとも、このまま始めて大丈夫？ →「何年も筋トレしてるので、大丈夫だと思います。」',
    'jump in＝さっそく始める。are you good＝大丈夫？',
    ["I've lifted for years, so I think I'm good.", 'Good, thanks. How about you?', "Sure, I'll jump in the pool."],
    tg(17, 'service', 'literal', [], ['idiom']),
    { tts: 'Have ya done an orientation yet, or are ya good to just jump in?', marks: [['say', 'you', 'ya']] }],
  ['ml-r-fringe', 'salon', 'pekoe', null, "Should I take a little off your bangs while I'm at it, or are you growing them out?",
    'ついでに前髪も少し切りましょうか、それとも伸ばしてます？ →「そのままで。伸ばしてるところなんです。」',
    'bangs＝前髪（米）。grow out＝伸ばす',
    ["Leave them, please. I'm growing them out.", "I'm going out later, actually.", 'Yes, I grew up around here.'],
    tg(26, 'service', 'literal', [], ['contraction'])],
  ['ml-r-recycling', 'neighbour', 'frett', 'door', 'You know the recycling goes out on Wednesdays, right? Not Mondays.',
    '資源ごみは水曜に出すって知ってるよね？ 月曜じゃなくて。 →「あっ、すみません！ 戻しておきます。」',
    'right? は確認の形の苦情。謝って対応する',
    ["Oh, sorry! I'll bring it back in.", 'Right, Monday works for me.', 'Sure, I know where it goes.'],
    tg(32, 'neighbour', 'attitude', [], ['contrast']),
    { tts: 'Ya know the recycling goes out on Wednesdays, right? Not Mondays.', marks: [['say', 'You know', 'ya know'], ['stress', 'Wednesdays Mondays']] }],
  ['ml-r-toll', 'travel', 'wolfgang', 'street', "Highway's quicker, but there's a toll. Want me to take it?",
    '高速のほうが早いけど、有料だよ。乗る？ →「10分以上早いなら、お願いします。」',
    'take it＝高速を使う。toll＝通行料',
    ['If it saves more than ten minutes, sure.', "Yes, I'll take it with me.", "It's quicker to walk, I think."],
    tg(4, 'service', 'literal', [], ['ellipsis'])],
  ['ml-r-four-hour', 'health', 'bea', null, "It's about a four-hour wait right now, unless it's an emergency.",
    '緊急でなければ、今は4時間ほどお待ちいただきます。 →「命に関わるほどではないので、アージェントケアに行ってみます。」',
    'four-hour wait＝4時間待ち。時刻ではない',
    ["It's not life-threatening. I'll try an urgent care clinic.", "Four o'clock? That's fine.", "No, I've waited a moment already."],
    tg(20, 'service', 'indirect')],
  ['ml-r-off-peak', 'travel', 'portia', 'platform', "Your ticket's off-peak, I'm afraid. You'll have to pay the difference or get off at the next stop.",
    '恐れ入りますが、こちらはオフピークの切符です。差額をお支払いいただくか、次の駅で降りていただくことになります。 →「わかりました。ここでカード払いできますか？」',
    'off-peak 切符は時間帯制限。差額の払い方を聞く',
    ['Fine. Can I pay by card here?', "Yes, I've paid off the ticket.", 'The next stop is mine as well.'],
    tg(5, 'service', 'literal', ['station'])],
  ['ml-r-callout', 'emergency', 'octavian', 'street', "I can be there in about forty minutes. The trip charge is ninety bucks before I even touch the lock.",
    '40分くらいで行けるよ。鍵に触る前から出張料が90ドルね。 →「うわ、高いな。それって作業代とは別ですか？」',
    'trip charge＝出張料。before I even touch＝作業前に',
    ['Ouch. Is that on top of the actual job?', 'No, I locked it forty minutes ago.', "I'll touch it before you get here."],
    tg(31, 'service', 'literal', ['phone'], ['contraction'])]
];

// ---- mean: what they really mean (the right one first) -------------------------------------------------------------

const MEAN: readonly Row[] = [
  ['ml-m-popular-choice', 'food', 'tangy', 'cafe', "The salmon? Mm, it's... a popular choice. The steak's really good tonight, though.",
    'サーモン？ うーん…人気はありますね。今夜はステーキがすごくおいしいですけど。 → サーモンより、ステーキを勧めている。',
    'popular choice の間(ま)と though が本音',
    ["She'd steer you toward the steak instead.", 'The salmon is the best thing on the menu.', "The steak's sold out tonight."],
    tg(27, 'service', 'indirect', ['cafe'], ['intonation', 'ellipsis'])],
  ['ml-m-quieter-room', 'hotel', 'jacques', null, "We can certainly try to find you a quieter room, though we're pretty booked up this weekend.",
    'もちろん静かなお部屋をお探しいたしますが、今週末はかなり埋まっておりまして。 → 静かな部屋は、たぶん用意できない。',
    'certainly try～, though＝期待しないで、の含み',
    ["A quieter room probably isn't available.", "He'll move you to a quieter room right away.", 'The hotel is nearly empty this weekend.'],
    tg(3, 'service', 'hedge', ['desk'])],
  ['ml-m-cozy', 'home', 'lopez', 'living', "It's what I'd call cozy. Perfect if you don't have a lot of stuff.",
    'いわゆる「こぢんまり」ってやつですね。荷物が少ない方にはぴったりですよ。 → 部屋がとても狭い。',
    'cozy は不動産の婉曲語で「狭い」',
    ['The apartment is really small.', 'The apartment is warm and comfortable.', 'He thinks you own too much stuff.'],
    tg(30, 'service', 'understatement')],
  ['ml-m-character', 'home', 'cyrano', null, 'The building has a lot of character. The elevator, for instance, has its own opinions.',
    'この建物はとても味がありましてね。たとえばエレベーターには、それなりの「こだわり」がありまして。 → 建物は古く、エレベーターもあてにならない。',
    'character＝古さの褒め言葉。エレベーターに意見＝気まぐれ',
    ["It's an old building, and the elevator doesn't always work.", 'The elevator was just modernized.', 'The other tenants are very opinionated.'],
    tg(10, 'service', 'humour')],
  ['ml-m-terms', 'bank', 'audie', null, "I can see why you'd think that. Unfortunately, the fee was in the terms you agreed to.",
    'そう思われるのもわかります。ただ残念ながら、その手数料はご同意いただいた規約に含まれていまして。 → 手数料は返金しない。',
    'I can see why…＋Unfortunately＝共感してから断る',
    ["She won't refund the fee.", 'She agrees the fee was a mistake.', 'You need to agree to some new terms.'],
    tg(21, 'service', 'refusal', ['phone'])],
  ['ml-m-next-month', 'gym', 'teddy', null, "That's a solid weight for you. We can maybe think about going up... next month.",
    '今の君には十分な重さだよ。上げるのは…来月あたりに考えようか。 → まだ重さを上げる段階ではない。',
    'next month の前の間(ま)が本音。今は上げない',
    ["You're not ready to lift more yet.", 'You should go up a weight today.', "You've lifted too much and should stop."],
    tg(17, 'service', 'hedge', [], ['intonation', 'ellipsis'])],
  ['ml-m-fitzroy', 'health', 'melba', 'living', "Dr. Lee isn't taking new patients, but there's a clinic in Midtown that might have room.",
    'リー先生は新しい患者さんを受け付けていないんですが、ミッドタウンのクリニックなら空きがあるかもしれません。 → 別のクリニックを当たってほしい。',
    'might have room＝よそを当たって、の意',
    ["You'll have to try a different clinic.", 'Dr. Lee will see you in Midtown instead.', 'The clinic is moving to Midtown.'],
    tg(14, 'service', 'refusal', ['phone']),
    { tts: "Doctor Lee isn't taking new patients, but there's a clinic in Midtown that might have room.", marks: [['say', 'Dr.', 'Doctor']] }],
  ['ml-m-run-small', 'shop', 'francine', 'street', 'These tend to run a little small. You might want to try the next size up... or two.',
    'こちらは少し小さめの作りなんです。ワンサイズ上を試されては…いえ、ツーサイズかしら。 → かなり大きいサイズが必要だと思っている。',
    'run small＝小さめの作り。…or two が皮肉',
    ['She thinks you need a much bigger size.', 'She thinks these are too big for you.', 'The next size up is out of stock.'],
    tg(26, 'service', 'attitude', [], ['ellipsis'])],
  ['ml-m-gratuity', 'food', 'gulliver', 'cafe', "Tip's included? Huh. Then why's there a line for 'additional gratuity'?",
    'チップ込み？ へえ。じゃあ、なんで「追加チップ」の欄があるわけ？ → チップを二重に払わされそうだと疑っている。',
    'gratuity＝チップ。欄があるのを怪しんでいる',
    ["He suspects they're being asked to tip twice.", "He's glad the tip is already included.", 'He wants to leave a bigger tip.'],
    tg(27, 'friend', 'sarcasm', ['cafe'], ['contraction'])],
  ['ml-m-safe-ish', 'delivery', 'al', 'living', "Hi, nobody answered, so I left it somewhere safe. Well, safe-ish. Behind the trash cans.",
    'どうも、お留守だったんで安全な場所に置いときました。まあ、そこそこ安全。ゴミ箱の裏です。 → 荷物は、あまり安全な場所にない。',
    'safe-ish＝まあまあ安全。ゴミ箱の裏が落ち',
    ["The package isn't really anywhere very safe.", 'The package has gone back to the warehouse.', "He'll try to deliver it again later."],
    tg(37, 'stranger', 'humour', ['voicemail'], ['self-repair'])],
  ['ml-m-on-time', 'travel', 'goldie', 'street', "The app says our driver's two minutes away. It's also been saying that for, like, ten minutes.",
    'アプリだと運転手はあと2分だって。10分くらい前からずっとそう言ってるけどね。 → 運転手は、たぶんまだ近くない。',
    '2分と言いつつ「ずっとそう」＝当てにならない',
    ["The driver probably isn't that close.", 'The driver will be there in two minutes.', 'They have been in the car for ten minutes.'],
    tg(2, 'friend', 'sarcasm', [], ['contraction'])],
  ['ml-m-patch', 'home', 'stitches', 'living', "I mean, I could patch it. But you'd be calling me again in a month.",
    'まあ、応急処置はできるよ。でも、1か月後にまた呼ぶことになるね。 → きちんと交換したほうがいい。',
    'could patch, but…＝応急処置では直らない',
    ['Replacing it would be the better fix.', 'A patch will fix it for good.', "He'll come back to check it next month."],
    tg(31, 'service', 'indirect', [], ['contraction']),
    { tts: "I mean, I could patch it. But you'd be callin' me again in a month.", marks: [g('calling')] }],
  ['ml-m-lie-in', 'neighbour', 'henry', 'door', "No, no, it's fine. I wasn't really planning on sleeping in this Saturday anyway.",
    'いえいえ、大丈夫ですよ。どうせ今週の土曜は朝寝坊するつもりもなかったので。 → 土曜朝の工事の音に怒っている。',
    'anyway の皮肉。本当は寝ていたかった',
    ["He's annoyed about the noise on Saturday morning.", "He doesn't mind because he gets up early.", 'He wants to help with the work on Saturday.'],
    tg(32, 'neighbour', 'sarcasm', [], ['intonation'])],
  ['ml-m-processed', 'office', 'bob', 'office', "You can submit it today. Whether it gets processed before your flight... that I can't tell you.",
    '今日提出はできます。ご出発までに処理されるかどうかは…そこはお約束できません。 → 出発までに間に合わないかもしれない。',
    'that I can’t tell you＝保証しない＝危ない',
    ['It might not be ready before you leave.', "It'll be processed before your flight.", "You can't turn the form in today."],
    tg(9, 'official', 'hedge', [], ['ellipsis'])],
  ['ml-m-tonight', 'emergency', 'maple', 'living', "It's probably nothing, but I'd rather someone looked at it tonight than tomorrow.",
    'たぶん大したことはないと思いますが、明日より今夜のうちに誰かに診てもらうほうがいいですね。 → 今夜のうちに受診したほうがいい。',
    'probably nothing, but…＝念のため今夜受診を',
    ['You should get it checked tonight.', "It's nothing, so you can wait.", 'Someone will visit you tomorrow.'],
    tg(15, 'service', 'hedge', ['phone'])],
  ['ml-m-bold-choice', 'salon', 'sylvia', null, "Bold choice! I mean, it'll grow back, right?",
    '大胆ね！ まあ、また伸びるしね？ → その髪型を良いとは思っていない。',
    'Bold choice!＋grow back が本音。褒めていない',
    ['She has her doubts about the haircut.', 'She thinks the haircut looks perfect.', "She's worried your hair won't grow back."],
    tg(26, 'service', 'humour', [], ['intonation'])],
  ['ml-m-slow-day', 'shop', 'agnes', 'street', "Technically, this coupon expired yesterday. But... it's been a slow day.",
    '厳密には、このクーポンは昨日で期限切れです。でも…今日は暇なので。 → 期限切れでもクーポンを使わせてくれる。',
    'Technically…But＝規則上は無理、でも特別にOK',
    ["She'll take the coupon anyway.", "She can't accept the coupon.", 'The store is closing early today.'],
    tg(26, 'service', 'indirect', [], ['ellipsis'])],
  ['ml-m-eat-my-hat', 'travel', 'beau', 'platform', "Dude, if this train's on time, I'll eat my hat.",
    'なあ、この電車が時間どおりに来たら、帽子でも食ってやるよ。 → 電車は絶対に遅れると思っている。',
    "I'll eat my hat＝絶対ありえない（慣用句）",
    ["He's sure the train will be late.", "He's hungry and wants something to eat.", 'He thinks the train will be on time.'],
    tg(5, 'friend', 'humour', ['station'], ['idiom'])]
];

// ---- word: the word heard (the right one first; all three fit) ----------------------------------------------------

const WORD: readonly Row[] = [
  ['ml-w-woulda', 'shop', 'gayle', 'street', "I would've bought it, but they didn't have my size.",
    '買うつもりだったけど、私のサイズがなかったの。',
    "woulda＝would've。否定なら n が聞こえる",
    ["would've", "wouldn't have", 'will have'],
    tg(26, 'friend', 'literal', [], ['contraction', 'weak-form']),
    { tts: "I woulda bought it, but they didn't have my size.", marks: [['say', "would've", 'woulda']] }],
  ['ml-w-didncha', 'travel', 'kitt', 'street', "Didn't you get the email about the bike trail being closed?",
    'サイクリングコースが閉鎖ってメール、届かなかったの？',
    "didncha＝Didn't you。n の鼻音が手がかり",
    ["Didn't you", 'Did you', "Don't you"],
    tg(2, 'partner', 'literal', [], ['yod', 't-glottal']),
    { tts: 'Didncha get the email about the bike trail being closed?', marks: [['say', "Didn't you", 'didncha']] }],
  ['ml-w-hafta', 'shop', 'label', 'street', "I'd have to check with my manager first.",
    'まず店長に確認しないといけませんね。',
    "I'd hafta＝〜しないと。'd は弱く消えがち",
    ["I'd have to", 'I have to', 'I had to'],
    tg(26, 'service', 'hedge', [], ['contraction', 'weak-form']),
    { tts: "I'd hafta check with my manager first.", marks: [['say', 'have to', 'hafta']] }],
  ['ml-w-musta', 'food', 'bob', null, "I must've left my card at the bar last night.",
    'ゆうべ、バーにカードを置いてきちゃったに違いない。',
    "musta＝must've（きっと〜した）。確信度が違う",
    ["must've", "might've", "mustn't have"],
    tg(27, 'friend', 'literal', [], ['contraction']),
    { tts: 'I musta left my card at the bar last night.', marks: [['say', "must've", 'musta']] }],
  ['ml-w-hadta', 'travel', 'gulliver', null, 'We had to wait, like, three hours at immigration.',
    '入国審査で、3時間くらい待たされたんだよ。',
    'hadta＝had to。過去の話。hate to は「嫌だ」',
    ['had to', 'have to', 'hate to'],
    tg(9, 'friend', 'literal', [], ['weak-form', 'flap']),
    { tts: 'We hadta wait, like, three hours at immigration.', marks: [['say', 'had to', 'hadta']] }],
  ['ml-w-wouldja', 'travel', 'portia', 'platform', "Would you mind moving your bag? That seat's reserved.",
    'お荷物をどけていただけます？ その席、予約済みなんです。',
    'wouldja＝Would you。Do you mind より丁寧',
    ['Would you mind', 'Do you mind', 'Did you mind'],
    tg(5, 'stranger', 'formula', ['station'], ['yod']),
    { tts: "Wouldja mind movin' your bag? That seat's reserved.", marks: [['say', 'Would you', 'wouldja'], g('moving')] }],
  ['ml-w-wont', 'hotel', 'melba', null, "They won't let us check in till three.",
    '3時までチェックインさせてくれないって。',
    "won't は長い［オウ］と n。will と聞き分ける",
    ["won't", 'will', "wouldn't"],
    tg(3, 'partner', 'literal', [], ['vowel', 'contraction'])],
  ['ml-w-tell-im', 'home', 'pashmina', 'living', "Can you tell him the water heater's making that noise again?",
    '給湯器がまたあの音を立ててるって、彼に伝えてくれる？',
    "tell 'im＝tell him。h が落ちて「テリム」",
    ['tell him', 'tell them', 'tell her'],
    tg(30, 'partner', 'literal', ['phone'], ['weak-form']),
    { tts: "Can ya tell 'im the water heater's making that noise again?", marks: [['say', 'you', 'ya'], ['say', 'tell him', "tell 'im"]] }],
  ['ml-w-whaddaya', 'food', 'audie', 'cafe', 'What do you recommend for two people?',
    '2人だと、何がおすすめですか？',
    'whaddaya＝What do you。今のおすすめを聞く',
    ['What do you', 'What would you', 'What did you'],
    tg(27, 'service', 'literal', ['cafe'], ['weak-form']),
    { tts: 'Whaddaya recommend for two people?', marks: [['say', 'What do you', 'whaddaya']] }],
  ['ml-w-put-up', 'travel', 'shep', 'street', 'My cousin will put us up for the night when we get to Nashville.',
    'ナッシュビルに着いたら、いとこが一晩泊めてくれるって。',
    'put up＝泊める。pick up（迎え）と紛らわしい',
    ['put us up', 'pick us up', 'put us off'],
    tg(8, 'friend', 'literal', [], ['idiom', 'contraction']),
    { tts: "My cousin'll put us up for the night when we get to Nashville.", marks: [['say', 'cousin will', "cousin'll"], ['link', 'put us up']] }],
  ['ml-w-walk-through', 'office', 'nana', 'office', "Don't worry, I'll walk you through the form.",
    'ご心配なく、書類は順番にご説明しますね。',
    'walk you through＝順を追って説明。work と母音で区別',
    ['walk', 'work', 'talk'],
    tg(21, 'official', 'literal', [], ['vowel'])],
  ['ml-w-lent', 'home', 'lucky', 'living', "The landlord lent us a space heater till the heat's fixed.",
    '暖房が直るまで、大家さんがヒーターを貸してくれたんだ。',
    'lent（貸した）の L。rent と取り違えない',
    ['lent', 'rent', 'sent'],
    tg(30, 'friend', 'literal', [], ['l-r'])],
  ['ml-w-collect', 'home', 'zucker', null, 'Could I collect it on Friday instead?',
    '代わりに金曜日に受け取りに行ってもいいですか？',
    'collect の L。correct と聞き分ける',
    ['collect', 'correct', 'connect'],
    tg(31, 'service', 'literal', ['phone'], ['l-r'])],
  ['ml-w-hadnt', 'shop', 'lily', 'street', "If I hadn't kept the receipt, I'd be stuck right now.",
    'レシートを取っておかなかったら、今ごろ困ってたよ。',
    "hadn't の t は弱いが、n で否定とわかる",
    ["hadn't", 'had', "didn't"],
    tg(26, 'friend', 'literal', [], ['contraction', 't-glottal'])],
  ['ml-w-arentcha', 'health', 'tammy', 'living', "Aren't you supposed to fast before a blood test?",
    '血液検査の前って、絶食しなきゃいけないんじゃなかった？',
    "aren'tcha＝Aren't you。否定疑問で確認",
    ["Aren't you", 'Are you', "Weren't you"],
    tg(15, 'friend', 'literal', [], ['yod', 'weak-form']),
    { tts: "Aren'tcha s'posed ta fast before a blood test?", marks: [['say', "Aren't you", "aren'tcha"], ['say', 'supposed to', "s'posed ta"]] }],
  ['ml-w-weve-got', 'food', 'orville', 'street', "We've got a table at eight, but they'll only hold it for fifteen minutes.",
    '8時に席を取ってあるけど、15分しか待ってくれないって。',
    "'ve は弱く短い。今ある予約の話",
    ["We've got", 'We got', "We'll get"],
    tg(27, 'friend', 'literal', [], ['contraction', 'weak-form'])],
  ['ml-w-cant-au', 'travel', 'marina', 'gate', "Sorry, you can't carry that one on. It's too big.",
    'すみません、それは機内に持ち込めません。大きすぎます。',
    "米の can't は母音がはっきり強い。can は弱く「クン」",
    ["can't", 'can', 'cannot'],
    tg(1, 'official', 'literal', ['desk'], ['can-cant', 'vowel'])]
];

// ---- num: the number heard (the right one first) ------------------------------------------------------------------

const NUM: readonly Row[] = [
  ['ml-n-sale-refund', 'shop', 'tia', 'street', "It rang up at $64.99, but it's on sale this week, so it should've been $49.99. Let me fix that.",
    'レジでは64.99ドルになってましたが、今週はセール中なので49.99ドルのはずです。直しますね。',
    '正しいのはセール価格。最初の額は打ち間違い',
    ['$49.99', '$64.99', '$15.00'],
    tg(26, 'service', 'literal', [], ['numbers']),
    { ask: '正しい ねだんは？', focus: '$49.99', tts: "It rang up at sixty-four ninety-nine, but it's on sale this week, so it should've been forty-nine ninety-nine. Let me fix that.",
      marks: [['say', '$64.99', 'sixty-four ninety-nine'], ['say', '$49.99', 'forty-nine ninety-nine']] }],
  ['ml-n-room', 'hotel', 'zucker', null, "You're in 1214. Elevators are on your left. Sorry, 1241. I read that upside down.",
    '1214号室です。エレベーターは左手に。失礼、1241号室でした。逆さまに読んでしまって。',
    'Sorry の後が訂正値。twelve forty-one',
    ['1241', '1214', '1421'],
    tg(3, 'service', 'literal', ['desk'], ['numbers', 'self-repair', 'teen-ty']),
    { ask: '部屋番号は？', focus: '1241', tts: "You're in twelve fourteen. Elevators are on your left. Sorry, twelve forty-one. I read that upside down.",
      marks: [['say', '1214', 'twelve fourTEEN'], ['say', '1241', 'twelve FORty-one']] }],
  ['ml-n-hold', 'travel', 'lopez', null, "We'll put a hold of $500 on your card. It drops off five to seven business days after you return the car.",
    'カードに500ドルの仮押さえをします。車の返却後、5〜7営業日で解除されます。',
    'five to seven は日数。金額は five hundred',
    ['$500', '$700', '$5,000'],
    tg(7, 'service', 'literal', ['desk'], ['numbers']),
    { ask: 'カードに仮押さえされる額は？', focus: '$500', tts: "We'll put a hold of five hundred on your card. It drops off five to seven business days after you return the car.",
      marks: [['say', '$500', 'five hundred']] }],
  ['ml-n-edinburgh', 'travel', 'cj', 'platform', 'The delayed 5:52 Northeast Regional to Boston is now expected to depart at 6:15, about 23 minutes late.',
    '遅れている5時52分発ボストン行きノースイースト・リージョナルは、6時15分発の見込みです。約23分の遅れです。',
    'five fifty-two は元の時刻。新しいのは six fifteen',
    ['6:15', '5:52', '6:23'],
    tg(5, 'official', 'literal', ['pa', 'station'], ['numbers']),
    { ask: '出発の見込み時刻は？', focus: '6:15', tts: 'The delayed five fifty-two Northeast Regional to Boston is now expected to depart at six fifteen, about twenty-three minutes late.',
      marks: [['say', '5:52', 'five fifty-two'], ['say', '6:15', 'six fifteen'], ['say', '23', 'twenty-three']] }],
  ['ml-n-tablets', 'health', 'daisy-mae', 'pharmacy', 'Take two tablets every six hours, but no more than eight in 24 hours.',
    '6時間ごとに2錠ずつ。ただし24時間で8錠までにしてください。',
    'every six hours は間隔。上限は eight',
    ['8錠', '6錠', '12錠'],
    tg(15, 'service', 'literal', [], ['numbers']),
    { ask: '1日に飲める上限は？', focus: 'eight', tts: 'Take two tablets every six hours, but no more than eight in twenty-four hours.', marks: [['say', '24', 'twenty-four']] }],
  ['ml-n-blood-pressure', 'health', 'admiral', null, "Your blood pressure's 145 over 90. Not terrible, but I'd like it under 130.",
    '血圧は上が145、下が90です。ひどくはないですが、130未満にしたいですね。',
    'over は上下の区切り。目標は under の後',
    ['130', '145', '90'],
    tg(15, 'service', 'understatement', [], ['numbers']),
    { ask: '医師の目標（上の血圧）は？', focus: '130', tts: "Your blood pressure's a hundred and forty-five over ninety. Not terrible, but I'd like it under a hundred and thirty.",
      marks: [['say', '145', 'a hundred and forty-five'], ['say', '90', 'ninety'], ['say', '130', 'a hundred and thirty']] }],
  ['ml-n-transfer-fee', 'bank', 'poppy', null, "So that's $2,000 to Japan. The fee's $25, plus a 1% margin, so call it $45 total.",
    'では日本へ2,000ドルですね。手数料が25ドル、それに1%のマージンで、全部で45ドルくらいです。',
    'call it＝ざっと。25 は基本料だけ',
    ['$45', '$25', '$20'],
    tg(21, 'service', 'literal', [], ['numbers']),
    { ask: '手数料の合計は？', focus: '$45', tts: "So that's two thousand to Japan. The fee's twenty-five, plus a one percent margin, so call it forty-five total.",
      marks: [['say', '$2,000', 'two thousand'], ['say', '$25', 'twenty-five'], ['say', '1%', 'one percent'], ['say', '$45', 'forty-five']] }],
  ['ml-n-rent', 'home', 'tom-nook', 'living', "Rent's going up to ¥128,000 in April. That's still ¥4,000 below market, for what it's worth.",
    '4月から家賃は12万8千円に上がります。それでも相場より4千円安いんですよ。',
    'below market は相場との差。家賃は128,000円',
    ['¥128,000', '¥124,000', '¥132,000'],
    tg(30, 'service', 'attitude', [], ['numbers']),
    { ask: '4月からの家賃は？', focus: '¥128,000', tts: "Rent's going up to a hundred and twenty-eight thousand in April. That's still four thousand below market, for what it's worth.",
      marks: [['say', '¥128,000', 'a hundred and twenty-eight thousand'], ['say', '¥4,000', 'four thousand']] }],
  ['ml-n-screen', 'home', 'octavian', null, "Screen's $189, battery's $79. Do both and I'll knock 20 off.",
    '画面が189ドル、バッテリーが79ドル。両方なら20ドル引くよ。',
    'knock 20 off＝20ドル引く。合計268から',
    ['$248', '$268', '$189'],
    tg(31, 'service', 'literal', [], ['numbers', 'idiom']),
    { ask: '両方 なおすと いくら？', tts: "Screen's a hundred and eighty-nine, battery's seventy-nine. Do both and I'll knock twenty off.",
      marks: [['say', '$189', 'a hundred and eighty-nine'], ['say', '$79', 'seventy-nine'], ['say', '20', 'twenty']] }],
  ['ml-n-gym-year', 'gym', 'kicks', null, "Monthly's $59, or $540 if you pay for the year up front. The initiation fee's waived this week.",
    '月払いは59ドル、1年分を前払いなら540ドル。今週は入会金なしだよ。',
    'five-forty＝540。12か月分の708ではない',
    ['$540', '$708', '$590'],
    tg(17, 'service', 'literal', [], ['numbers']),
    { ask: '年払いは いくら？', focus: '$540', tts: "Monthly's fifty-nine, or five-forty if you pay for the year up front. The initiation fee's waived this week.",
      marks: [['say', '$59', 'fifty-nine'], ['say', '$540', 'five-forty']] }],
  ['ml-n-quarter-past', 'salon', 'katt', 'living', "I can squeeze you in at ten to four. Actually, make it a quarter after, she's running late.",
    '4時10分前にお入れできます。いえ、やっぱり4時15分で。担当が押してまして。',
    'quarter after は4時15分。ten to four は3時50分',
    ['4:15', '3:50', '3:15'],
    tg(26, 'service', 'literal', ['phone'], ['clock', 'self-repair']),
    { ask: '予約の時刻は？', focus: 'quarter after' }],
  ['ml-n-boarding', 'travel', 'anchovy', 'gate', 'Passengers on flight 837 to Tokyo Narita, boarding will now begin at 11:20, from gate C14.',
    '東京成田行き837便のお客様、搭乗は11時20分から、C14番ゲートで開始いたします。',
    'eight three seven は便名。時刻は eleven twenty',
    ['11:20', '11:14', '8:37'],
    tg(2, 'official', 'literal', ['pa'], ['numbers']),
    { ask: '搭乗開始は何時？', focus: '11:20', tts: 'Passengers on flight eight three seven to Tokyo Narita, boarding will now begin at eleven twenty, from gate C fourteen.',
      marks: [['say', '837', 'eight three seven'], ['say', '11:20', 'eleven twenty'], ['say', 'C14', 'C fourteen']] }],
  ['ml-n-ticket', 'office', 'molly', 'office', "You're number 47. They're on 31 now, so maybe twenty minutes?",
    'あなたは47番です。今31番なので、20分くらいですかね？',
    'on 31＝今呼んでいる番号。自分は47',
    ['47', '31', '20'],
    tg(21, 'official', 'literal', [], ['numbers']),
    { ask: 'じぶんの 番号は？', focus: '47', tts: "You're number forty-seven. They're on thirty-one now, so maybe twenty minutes?",
      marks: [['say', '47', 'forty-seven'], ['say', '31', 'thirty-one']] }],
  ['ml-n-delivery-window', 'delivery', 'lily', 'living', 'Your package is out for delivery. Estimated window, 2:15 to 4:45. Reply 1 to reschedule.',
    'お荷物は配達中です。お届け予定は2時15分から4時45分。日時変更は1を返信してください。',
    'window＝時間帯。終わりは four forty-five',
    ['4:45', '2:15', '4:15'],
    tg(37, 'service', 'literal', ['voicemail'], ['numbers']),
    { ask: '配達の 時間帯の おわりは？', focus: '4:45', tts: 'Your package is out for delivery. Estimated window, two fifteen to four forty-five. Reply one to reschedule.',
      marks: [['say', '2:15', 'two fifteen'], ['say', '4:45', 'four forty-five'], ['say', '1', 'one']] }],
  ['ml-n-insurance', 'emergency', 'goldie', 'living', "Your insurance covers 80%, so out of the $1,250, you'd owe $250.",
    '保険で80%カバーされるので、1,250ドルのうち、お支払いは250ドルです。',
    'twelve fifty＝1,250。払うのは残りの2割',
    ['$250', '$1,000', '$1,250'],
    tg(28, 'service', 'literal', ['phone'], ['numbers']),
    { ask: '自己負担は いくら？', focus: '$250', tts: "Your insurance covers eighty percent, so out of the twelve fifty, you'd owe two-fifty.",
      marks: [['say', '80%', 'eighty percent'], ['say', '$1,250', 'twelve fifty'], ['say', '$250', 'two-fifty']] }],
  ['ml-n-taxi-toll', 'travel', 'kid-cat', 'street', 'The meter said ¥3,980, but there was a ¥720 highway toll on top.',
    'メーターは3,980円だったけど、高速料金の720円が上乗せされたんだ。',
    'on top＝上乗せ。合計は4,700円',
    ['¥4,700', '¥3,980', '¥4,070'],
    tg(4, 'friend', 'literal', [], ['numbers']),
    { ask: 'タクシー代の 合計は？', tts: 'The meter said three thousand nine hundred and eighty, but there was a seven hundred and twenty yen highway toll on top.',
      marks: [['say', '¥3,980', 'three thousand nine hundred and eighty'], ['say', '¥720', 'seven hundred and twenty yen']] }],
  ['ml-n-late-checkout', 'hotel', 'bunnie', null, "Checkout's at 10, but I can give you till 12 for $30, or 2 for $60.",
    'チェックアウトは10時ですが、12時までなら30ドル、2時までなら60ドルで延長できます。',
    'till twelve は30ドル。two は午後2時の話',
    ['$30', '$60', '$12'],
    tg(3, 'service', 'literal', ['desk'], ['numbers']),
    { ask: '12時まで のばすと いくら？', focus: '$30', tts: "Checkout's at ten, but I can give you till twelve for thirty, or two for sixty.",
      marks: [['say', '10', 'ten'], ['say', '12', 'twelve'], ['say', '$30', 'thirty'], ['say', '$60', 'sixty']] }]
];

// ---- dialogues: gist and next (the right one first) ---------------------------------------------------------------

const DROWS: readonly DRow[] = [
  {
    id: 'dml-worn-boots', fam: 'shop', type: 'gist', scene: 'street', ask: 'ブーツは どうなる？', focus: 'send them back to the manufacturer',
    lines: [
      ['bea', "Hi, I'd like to return these boots. They pinch at the toes.", 'このブーツを返品したいんです。つま先がきつくて。'],
      ['francine', "Hmm, the soles are a little scuffed, so they've been worn outside.", 'うーん、靴底に擦れがありますね。外で履かれてます。'],
      ['bea', 'Only once, to the subway and back!', '1回だけです、地下鉄の駅まで往復しただけ！'],
      ['francine', "I can't refund worn items, but I can send them back to the manufacturer as defective.", '履いた商品は返金できませんが、不良品としてメーカーに送ることはできます。',
        "I can't refund worn items, but I can send 'em back to the manufacturer as defective.", [['say', 'them', "'em"]]]
    ],
    choices: ["They'll go back to the manufacturer as defective.", "She'll get a full refund today.", "She'll swap them for a bigger size."],
    ja: '不良品としてメーカーに送られる。', note: "can't refund, but の後が結論。返金ではない",
    tags: tg(26, 'service', 'refusal', [], ['contrast'])
  },
  {
    id: 'dml-one-for-the-road', fam: 'food', type: 'next', scene: 'cafe', focus: 'one more for the road',
    lines: [
      ['wolfgang', 'Want me to keep your tab open, or are you closing out?', 'お会計、このまま付けときます？ それとも締めます？',
        "Want me ta keep your tab open, or are you closin' out?", [['say', 'to', 'ta'], g('closing')]],
      ['orville', 'Closing out, I think. Actually, you know what, one more for the road.', '締めで。…いや、やっぱりもう1杯だけ。'],
      ['wolfgang', 'Another one of those? Or do you want to try the seasonal IPA?', '同じのにします？ それとも季節限定のIPAを試してみます？',
        "Another one of those? Or d'you wanna try the seasonal IPA?", [['say', 'do you', "d'you"], ['say', 'want to', 'wanna']]]
    ],
    choices: ["Let's do the IPA.", 'Same time tomorrow, then.', "No, I'm closing out, remember?"],
    ja: 'IPAにしよう。', note: 'one more for the road＝帰る前の最後の1杯',
    tags: tg(27, 'service', 'formula', ['cafe'], ['idiom'])
  },
  {
    id: 'dml-party-next-door', fam: 'hotel', type: 'gist', scene: null, ask: '30分後も うるさかったら どうなる？', focus: 'quiet floor',
    lines: [
      ['gulliver', "Hi, room 512. There's some kind of party going on next door.", 'もしもし、512号室です。隣でパーティーみたいなのをやってて。',
        "Hi, room five twelve. There's some kinda party going on next door.", [['say', '512', 'five twelve'], ['say', 'kind of', 'kinda']]],
      ['audie', "I'm so sorry. Security's on their way up. If it's still going in half an hour, call me back.", '申し訳ありません。警備がいま向かっています。30分たっても続いていたら、またお電話ください。',
        "I'm so sorry. Security's on their way up. If it's still goin' in half an hour, call me back.", [g('going')]],
      ['gulliver', "And if it is? I've got a seven a.m. flight.", '続いてたら？ 朝7時の便なんですよ。'],
      ['audie', "Then we'll move you to a quiet floor, no charge.", 'その場合は、静かな階に無料でお移りいただきます。']
    ],
    choices: ["He'll be moved to another floor for free.", "He'll be put on an earlier flight.", 'Security will move the party to his floor.'],
    ja: '無料で静かな階に移れる。', note: 'no charge＝無料。seven a.m. は彼の便の時刻',
    tags: tg(3, 'service', 'literal', ['phone'], ['numbers'])
  },
  {
    id: 'dml-missed-connection', fam: 'travel', type: 'next', scene: 'gate', focus: 'delivered to your hotel',
    lines: [
      ['ken', 'Okay, so your bag was checked through to Denver, but it missed the connection in Chicago.', 'ええと、お荷物はデンバーまで預けられていますが、シカゴで乗り継ぎに間に合わなかったようです。'],
      ['melba', 'Great. So when will it actually get here?', '最高ね。で、実際いつ届くんですか？'],
      ['ken', 'It should be on the first flight tomorrow. We can have it delivered to your hotel.', '明日の始発便に乗るはずです。ホテルまでお届けできますよ。']
    ],
    choices: ["That'd be great. Do you need the address?", "No, I'd rather take the first flight.", "I've already checked in at the hotel, thanks."],
    ja: '助かります。住所が必要ですか？', note: 'have it delivered＝届けてもらう。始発便に乗るのは荷物',
    tags: tg(6, 'service', 'sarcasm', ['desk'])
  },
  {
    id: 'dml-test-results', fam: 'health', type: 'gist', scene: 'living', ask: '検査結果について わかることは？', focus: "it's not urgent",
    lines: [
      ['reneigh', 'Your blood test results are back. The doctor wants to go over them with you.', '血液検査の結果が出ました。先生が直接ご説明したいそうです。'],
      ['lucky', 'Oh. Is that... bad?', 'えっ。それって…悪いんですか？'],
      ['reneigh', "I can't go into it over the phone, but it's not urgent. Next Tuesday's fine.", '電話では詳しく申し上げられませんが、急ぎではありません。来週の火曜で大丈夫です。'],
      ['lucky', "Okay. I'll stop googling my symptoms, then.", 'わかりました。じゃあ、症状を検索するのはやめておきます。']
    ],
    choices: ["It isn't urgent, but the doctor wants to discuss it.", 'The results are bad and he must come in today.', "She'll explain them over the phone."],
    ja: '急ぎではないが、医師が説明したい。', note: 'go over＝説明する。not urgent が要点',
    tags: tg(14, 'service', 'humour', ['phone'], ['ellipsis'])
  },
  {
    id: 'dml-card-declined', fam: 'bank', type: 'next', scene: 'living', focus: 'flagged it',
    lines: [
      ['lucky', "Hi, my card got declined at a hotel in Lisbon, and I've got plenty in the account.", 'リスボンのホテルでカードが通らなかったんです。口座には十分あるのに。'],
      ['judy', "Looks like our fraud system flagged it. Did you let us know you'd be traveling?", '不正検知システムが止めたようです。ご旅行のこと、事前にお知らせいただいてました？',
        "Looks like our fraud system flagged it. Didja let us know you'd be traveling?", [['say', 'Did you', 'didja']]],
      ['lucky', "No, I didn't know I had to.", 'いいえ、必要だなんて知らなくて。']
    ],
    choices: ["No problem. I've unblocked it, so try it again now.", "Yes, I'd be traveling too.", "You don't have to pay at the hotel."],
    ja: '大丈夫です。ブロックを解除したので、もう一度お試しください。', note: 'flag＝要注意として止める。解除するのは銀行',
    tags: tg(21, 'service', 'literal', ['phone'], ['yod'])
  },
  {
    id: 'dml-plumber-late', fam: 'home', type: 'gist', scene: 'living', ask: '女性は どうする？', focus: "I'd rather wait",
    lines: [
      ['stitches', "Hey, it's Joe, the plumber. I'm running a little behind. Traffic's a nightmare.", 'どうも、配管工のジョーです。ちょっと遅れてて。渋滞がひどくて。',
        "Hey, it's Joe, the plumber. I'm runnin' a little behind. Traffic's a nightmare.", [g('running')]],
      ['molly', 'How far behind are we talking? I have to leave at noon.', 'どのくらい遅れそう？ お昼には出なきゃいけないの。'],
      ['stitches', 'Forty-five minutes, tops. If you leave a key under the mat, I can let myself in.', '長くて45分。マットの下に鍵を置いといてくれたら、勝手に入れるよ。'],
      ['molly', "Hmm. I'd rather wait, thanks.", 'うーん。待ってるほうがいいかな。']
    ],
    choices: ["She'll stay home until he arrives.", "She'll leave a key under the mat.", "She'll leave at noon as planned."],
    ja: '彼が来るまで家で待つ。', note: "I'd rather wait＝鍵は置かない。tops＝最大で",
    tags: tg(31, 'service', 'refusal', ['phone'], ['idiom'])
  },
  {
    id: 'dml-gutter', fam: 'neighbour', type: 'next', scene: 'street', focus: 'taken over our gutter',
    lines: [
      ['poppy', "Morning! Your tree's looking very... healthy. It's sort of taken over our gutter.", 'おはよう！ お宅の木、すごく…元気ね。うちの雨どいまで覆っちゃってて。',
        "Morning! Your tree's looking very... healthy. It's sorta taken over our gutter.", [['say', 'sort of', 'sorta']]],
      ['henry', "Oh, sorry about that. I've been meaning to get someone out here.", 'あ、ごめん。誰か呼ぼうと思ってたんだ。'],
      ['poppy', 'No rush. Just before the storms, ideally.', '急がないけど、できれば嵐の季節の前に。']
    ],
    choices: ["Fair enough. I'll call someone this week.", "Thanks, it's very healthy.", "No rush, it's not raining yet."],
    ja: 'わかった。今週中に誰か頼むよ。', note: 'healthy は遠回しな苦情。No rush でも期限つき',
    tags: tg(32, 'neighbour', 'indirect', [], ['ellipsis', 'kinda'])
  },
  {
    id: 'dml-moving-out-cert', fam: 'office', type: 'gist', scene: 'office', ask: '男性は まず 何を する？', focus: 'moving-out certificate',
    lines: [
      ['nana', "For the moving-in notice, I'll need your residence card and the moving-out certificate from your old ward.", '転入届には、在留カードと、前の区の転出証明書が必要です。'],
      ['lopez', 'The moving-out what? Nobody mentioned that.', '転出…何ですか？ 誰もそんなこと言ってなかった。'],
      ['nana', 'You get it from your previous ward office. Some do it by mail, if that helps.', '前の区役所で出してもらえます。郵送でやってくれる所もありますよ。'],
      ['lopez', "Okay. I'll call them this afternoon and ask.", 'わかりました。午後に電話して聞いてみます。']
    ],
    choices: ['Call his old ward office.', 'Fill out a form at this desk.', 'Mail his residence card.'],
    ja: '前の区役所に電話する。', note: 'by mail は前の区の対応。カードを送るのではない',
    tags: tg(21, 'official', 'literal')
  },
  {
    id: 'dml-work-in', fam: 'gym', type: 'next', scene: null, focus: 'work in with me',
    lines: [
      ['teddy', 'Hey, man, you got many sets left on that?', 'なあ、それ、あと何セット残ってる？'],
      ['bud', "Two more. You're welcome to work in with me, though.", 'あと2セット。よかったら交互に使う？'],
      ['teddy', 'Sweet. You mind if I change the weight between sets?', 'いいね。セットの合間に重さ変えてもいい？']
    ],
    choices: ['Go for it. Just put it back after.', "Sure, I'll change after two sets.", "No, I don't work in here."],
    ja: 'どうぞ。終わったら戻しといて。', note: 'work in＝交互に使う。mind if…? への承諾',
    tags: tg(17, 'stranger', 'formula', [], ['idiom', 'ellipsis'])
  },
  {
    id: 'dml-stylist', fam: 'salon', type: 'gist', scene: 'living', ask: '予約は どうなった？', focus: "Let's do both",
    lines: [
      ['tangy', "Hi! So Mia's fully booked Saturday, but Jordan has a two o'clock?", 'こんにちは！ ミアは土曜いっぱいなんですけど、ジョーダンなら2時が空いてます？'],
      ['goldie', "Hmm, I'd really rather stick with Mia. She knows my hair.", 'うーん、やっぱりミアがいいな。私の髪をわかってるから。'],
      ['tangy', "Totally. She's got Tuesday at six, or I can text you if Saturday frees up?", 'ですよね。火曜の6時か、土曜に空きが出たらメッセージしましょうか？'],
      ['goldie', "Let's do both. Book the Tuesday, and text me anyway.", '両方で。火曜を予約して、連絡もください。']
    ],
    choices: ['Tuesday at six with Mia, and a text if Saturday opens up.', "Saturday at two o'clock with Jordan.", 'Saturday with Mia, and Tuesday with Jordan.'],
    ja: 'ミアで火曜6時。土曜に空きが出たら連絡が来る。', note: "Let's do both＝予約も空き待ちも両方",
    tags: tg(26, 'service', 'literal', ['phone'], ['intonation'])
  },
  {
    id: 'dml-via-munich', fam: 'travel', type: 'next', scene: 'gate', focus: "tomorrow's 7:15",
    lines: [
      ['pashmina', "I'm afraid the 6:40 to Rome's been canceled. I can get you on tomorrow's 7:15, or a flight tonight via Munich.", 'あいにく6時40分発のローマ行きは欠航です。明日の7時15分発か、今夜のミュンヘン経由の便にお取りできます。',
        "I'm afraid the six forty to Rome's been canceled. I can get you on tomorrow's seven fifteen, or a flight tonight via Munich.",
        [['say', '6:40', 'six forty'], ['say', '7:15', 'seven fifteen']]],
      ['jacques', 'And the Munich one gets in when, roughly?', 'ミュンヘン経由だと、だいたい何時に着きます？'],
      ['pashmina', "Just after one in the morning, I'm afraid.", '深夜1時過ぎになってしまいます。']
    ],
    choices: ["Hmm. I'll take the morning one, then.", "That's fine, I'm afraid of flying too.", "No, I'd rather go via Rome."],
    ja: 'うーん。じゃあ朝の便にします。', note: '深夜着と聞いて朝便を選ぶ流れ。via＝経由',
    tags: tg(8, 'service', 'literal', ['desk'], ['numbers'])
  },
  {
    id: 'dml-jet-lag', fam: 'health', type: 'gist', scene: 'pharmacy', ask: '男性は 今夜 どうするべき？', focus: 'hold off',
    lines: [
      ['flick', "Hi, do you have anything for jet lag? I can't sleep at all.", '時差ボケに効くもの、ありますか？ 全然眠れなくて。'],
      ['maple', "There's melatonin, but it's not something I'd take with alcohol.", 'メラトニンがありますが、お酒と一緒に飲むのはおすすめしません。'],
      ['flick', 'Ah. I did have a couple of beers at dinner.', 'あ。夕食でビールを2杯飲んじゃった。'],
      ['maple', "Then I'd hold off till tomorrow night. Get some daylight in the morning instead.", 'なら、明日の夜まで待ったほうがいいですね。代わりに朝、日の光を浴びてください。']
    ],
    choices: ['Not take the melatonin tonight.', 'Take the melatonin with dinner.', 'Stay up until the morning.'],
    ja: '今夜はメラトニンを飲まない。', note: 'hold off＝控える。not something I’d＝遠回しな注意',
    tags: tg(13, 'service', 'indirect', [], ['idiom'])
  },
  {
    id: 'dml-power-cut', fam: 'emergency', type: 'next', scene: 'street', focus: 'supposedly',
    lines: [
      ['gayle', "Hey, is your power out too? The whole street's gone dark.", 'ねえ、そっちも停電？ 通りじゅう真っ暗。'],
      ['kicks', 'Yeah. The app says crews are on it, back by ten, supposedly.', 'うん。アプリだと作業中で、10時には戻るって。一応ね。',
        "Yeah. The app says crews are on it, back by ten, s'posedly.", [['say', 'supposedly', "s'posedly"]]],
      ['gayle', "My freezer's full. Should I be worried?", '冷凍庫がいっぱいなの。心配したほうがいい？']
    ],
    choices: ["Keep the door shut and it'll be fine for hours.", "Yeah, I'm worried about the app too.", "It's full of crews, apparently."],
    ja: '扉を閉めておけば、何時間かは大丈夫。', note: 'supposedly＝一応そう言われている（半信半疑）',
    tags: tg(34, 'neighbour', 'hedge', [], ['ellipsis'])
  },
  {
    id: 'dml-id-only', fam: 'delivery', type: 'gist', scene: 'door', ask: '荷物は どうなる？', focus: 'needs her ID',
    lines: [
      ['fang', "Package for apartment 6? It needs a signature, and it's for a Ms. Tanaka.", '6号室宛ての荷物です。サインが必要で、タナカさん宛てですね。',
        "Package for apartment six? It needs a signature, and it's for a Ms. Tanaka.", [['say', '6', 'six']]],
      ['katt', "She's at work, but I'm her roommate. Can I sign for it?", '彼女は仕事中ですけど、私がルームメイトです。代わりにサインできます？'],
      ['fang', "Not this one, it needs her ID. I'll leave a notice, and she can pick it up at our customer center.", 'これはダメなんです、本人確認が要るので。不在票を置いていくので、営業所で受け取ってもらえます。'],
      ['katt', "Fine, I'll tell her. What time does the customer center close?", 'わかりました、伝えます。営業所は何時に閉まります？']
    ],
    choices: ['Ms. Tanaka has to pick it up from the customer center herself.', 'The roommate signs for it now.', "It's left with a neighbor in apartment six."],
    ja: 'タナカさん本人が営業所で受け取る。', note: 'needs her ID＝本人確認が必須。代理サイン不可',
    tags: tg(37, 'service', 'refusal')
  }
];

/** The single items: reply, mean, word, num. */
export const ITEMS: readonly Item[] = [...REPLY.map(item('reply')), ...MEAN.map(item('mean')), ...WORD.map(item('word')), ...NUM.map(item('num'))];
/** The dialogues: gist and next. */
export const DIALOGUES: readonly Item[] = DROWS.map(dialogue);
/** Each item's life family (coverage). */
export const FAMILY: Readonly<Record<string, Family>> = FAM;
