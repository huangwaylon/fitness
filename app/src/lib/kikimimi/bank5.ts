// ききみみ クイズ level 5 「アナウンス」 (docs/curriculum.md §7 game 7 and §14 increment 6): the announcements pack, B1+ →
// B2. Real station and train announcements (Tokyo's JR and Metro English, UK rail), airport PA (boarding, gate changes,
// final calls), voicemails, phone menus (IVR: "press 3 for…"), shop announcements and a radio weather blurb, each heard
// through its channel: the speech conditions (docs/kikimimi.md "Conditions") are the point of the pack, a ladder of
// channel and noise: a PA's hall (heavy on a busy concourse), a phone line, a voicemail, a station's or a café's noise.
// Formal, scripted register mostly (announcers read), with casual voicemails reduced as people speak (`tts`: gonna,
// lemme, 'cause); every number written out in `tts`, never a digit.
//   Types: `num` (the number that matters, the distractors the corrected one, another heard, a near sound), `gist`
// (what's going on or what to do: a single clip, its own `ask`), `mean` (what it really means: the literal reading, the
// opposite and a plausible wrong inference) and `reply` (what to say back: an IVR, an intercom, a staff member, the
// message to leave). `ja` gives the clip's Japanese, then 「→ the answer's」 for gist, mean and reply.
//   Speakers keep their cast voices for good (bank4.ts CAST); station and airport PA voices are the announcers'.
//   Gated like any level: the lobby offers it once every item has a clip (compile.ts playable).
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Accent, Cond, Item, ItemType, Tags } from './bank.ts';
import { CAST } from './bank4.ts';
import { staged } from './staging.ts';

type Extra = { tts?: string; focus?: string; ask?: string };
type Row = readonly [id: string, speaker: RosterId, en: string, ja: string, note: string, choices: readonly string[], tags: Tags, cond: Cond, extra?: Extra];

const tg = (seed: number, register: Tags['register'], pragmatic: Tags['pragmatic'], conditions: Tags['conditions'], features?: Tags['features']): Tags =>
  ({ seed, register, pragmatic, conditions, ...(features?.length && { features }) });
const light = (kind: Cond['kind'], bed?: Cond['bed']): Cond => ({ kind, level: 'light', ...(bed && { bed }) });
const heavy = (kind: Cond['kind'], bed?: Cond['bed']): Cond => ({ kind, level: 'heavy', ...(bed && { bed }) });

const MEAN_ASK = 'つまり、どういうこと？';

const item = (type: ItemType) => ([id, speaker, en, ja, note, choices, tags, cond, x = {}]: Row): Item => {
  const cast = CAST[speaker];
  if (!cast) throw new Error(`kikimimi: ${speaker} has no cast voice`);
  const ask = x.ask ?? (type === 'mean' ? MEAN_ASK : undefined);
  return {
    id, lv: 5, type, en, ja, speaker, voice: cast.slice(0, 2) as Accent, cast, choices, answer: 0, note, tags, cond,
    ...(x.tts && { tts: x.tts }), ...(x.focus && { focus: x.focus }), ...(ask && { ask }), ...staged(id)
  };
};

// ---- num: the number that matters (the right one first) -------------------------------------------------------------

const NUM: readonly Row[] = [
  ['a5-track', 'judy', 'Attention, please. The 10:12 rapid service for Takao will depart from track 3, not track 5.',
    'お知らせします。10時12分発の快速高尾行きは、5番線ではなく3番線から発車します。',
    'not の後は訂正前。track＝番線（米・日本の英語）',
    ['3番線', '5番線', '12番線'],
    tg(5, 'official', 'literal', ['pa', 'station'], ['self-repair']), light('pa', 'station'),
    { ask: '何番線？', focus: 'track 3', tts: 'Attention, please. The ten twelve rapid service for Takao will depart from track three, not track five.' }],
  ['a5-behind', 'raymond', 'We apologise for the delay. Due to an earlier signal failure, this train is running approximately 15 minutes behind schedule.',
    '遅れて申し訳ございません。先ほどの信号故障のため、この列車は約15分遅れて運行しております。',
    'behind schedule＝遅れ。fifTEEN は後ろに強勢',
    ['15分', '50分', '5分'],
    tg(5, 'official', 'literal', ['pa'], ['teen-ty']), light('pa'),
    { ask: '何分遅れ？', focus: '15 minutes', tts: 'We apologise for the delay. Due to an earlier signal failure, this train is running approximately fifteen minutes behind schedule.' }],
  ['a5-final-call', 'orville', 'This is the final boarding call for passenger Sato on flight 212 to London Heathrow. Please proceed immediately to gate 64.',
    'ロンドン・ヒースロー行き212便にご搭乗のサトウ様、最終のご案内です。至急64番搭乗口へお越しください。',
    'final call＝最終案内。便名と搭乗口を混同しない',
    ['64番', '46番', '212番'],
    tg(2, 'official', 'literal', ['pa', 'station']), heavy('pa', 'station'),
    { ask: '搭乗口は？', focus: 'gate 64', tts: 'This is the final boarding call for passenger Sato on flight two-one-two to London Heathrow. Please proceed immediately to gate sixty-four.' }],
  ['a5-gate-moved', 'coco', 'Passengers on flight 838 to San Francisco, please note your departure gate has changed. The flight will now leave from gate 71.',
    'サンフランシスコ行き838便のお客様、出発ゲートが変更になりました。71番ゲートからの出発となります。',
    'now leave from の後が新しいゲート',
    ['71番', '17番', '38番'],
    tg(2, 'official', 'literal', ['pa', 'station']), light('pa', 'station'),
    { ask: '新しい搭乗口は？', focus: 'gate 71', tts: 'Passengers on flight eight-three-eight to San Francisco, please note your departure gate has changed. The flight will now leave from gate seventy-one.' }],
  ['a5-boarding-time', 'wilbur', "Boarding for flight 409 to Singapore will begin at 7:50. That's ten minutes earlier than shown on your boarding pass.",
    'シンガポール行き409便の搭乗は7時50分に始まります。搭乗券の表示より10分早くなります。',
    'earlier than shown＝券の時刻より前。計算させるひっかけ',
    ['7:50', '8:00', '7:40'],
    tg(2, 'official', 'literal', ['pa', 'station']), light('pa', 'station'),
    { ask: '搭乗開始は？', focus: '7:50', tts: "Boarding for flight four-oh-nine to Singapore will begin at seven fifty. That's ten minutes earlier than shown on your boarding pass." }],
  ['a5-press-three', 'maple', 'For billing and payments, press 1. To report a lost or stolen card, press 3. For all other enquiries, please hold.',
    'ご請求とお支払いは1を、カードの紛失・盗難は3を、その他のお問い合わせはそのままお待ちください。',
    'メニューは目的語が先、番号が後に来る',
    ['3', '1', 'そのまま待つ'],
    tg(21, 'service', 'literal', ['phone']), light('phone'),
    { ask: 'カードをなくした。何番？', focus: 'press 3', tts: 'For billing and payments, press one. To report a lost or stolen card, press three. For all other enquiries, please hold.' }],
  ['a5-queue', 'diana', 'All of our advisers are busy at the moment. You are number 6 in the queue, and your estimated wait time is 12 minutes.',
    'ただいま担当者はすべて対応中です。お客様は6番目で、お待ち時間はおよそ12分です。',
    'number 6 は順番。wait time の後が時間',
    ['12分', '6分', '20分'],
    tg(22, 'service', 'literal', ['phone']), heavy('phone'),
    { ask: '待ち時間は？', focus: '12 minutes', tts: 'All of our advisers are busy at the moment. You are number six in the queue, and your estimated wait time is twelve minutes.' }],
  ['a5-dentist', 'whitney', "Hi, it's Karen from Bayside Dental, just confirming your appointment on Thursday the 14th at 3:15. Give us a ring if you need to change it.",
    'ベイサイド歯科のカレンです。14日木曜、3時15分のご予約の確認です。変更があればお電話ください。',
    '日付→時刻の順。3:15 の fifteen に引っぱられない',
    ['14日', '15日', '4日'],
    tg(16, 'service', 'literal', ['voicemail'], ['teen-ty']), light('voicemail'),
    { ask: '予約は何日？', focus: 'the 14th', tts: "Hi, it's Karen from Bayside Dental, just confirming your appointment on Thursday the fourteenth at three fifteen. Give us a ring if you need to change it." }],
  ['a5-key-code', 'kid-cat', "Hey, it's Sam, your host. The code for the key box is 4719. Sorry, 4791. See you tomorrow!",
    'ホストのサムです。キーボックスの番号は4719…ごめん、4791。じゃあ明日！',
    'sorry の後が訂正。最後の2桁が入れ替わる',
    ['4791', '4719', '7491'],
    tg(10, 'friend', 'literal', ['voicemail'], ['self-repair', 'numbers']), light('voicemail'),
    { ask: '暗証番号は？', focus: '4791', tts: "Hey, it's Sam, your host. The code for the key box is four-seven-one-nine — sorry, four-seven-nine-one. See ya tomorrow!" }],
  ['a5-closing', 'label', 'Thank you for shopping with us today. The store will be closing in 15 minutes, at 8 p.m. Please bring your final purchases to the registers.',
    '本日はご来店ありがとうございます。あと15分、午後8時で閉店いたします。お会計はレジへお持ちください。',
    'in 15 minutes＝あと15分。閉店時刻は at の後',
    ['20時', '20時15分', '19時45分'],
    tg(26, 'official', 'literal', ['pa']), light('pa'),
    { ask: '閉店は何時？', focus: 'at 8 p.m.', tts: 'Thank you for shopping with us today. The store will be closing in fifteen minutes, at eight p.m. Please bring your final purchases to the registers.' }],
  ['a5-coats', 'mabel', 'Shoppers, for the next 30 minutes only, all winter coats on the third floor are 40% off.',
    'お客様へ、これから30分間限定で、3階の冬物コートがすべて40%オフです。',
    'thirty（時間）と forty（割引）。3階の third も混ざる',
    ['40%オフ', '30%オフ', '13%オフ'],
    tg(26, 'official', 'literal', ['pa'], ['numbers']), light('pa'),
    { ask: '何%オフ？', focus: '40% off', tts: 'Shoppers, for the next thirty minutes only, all winter coats on the third floor are forty per cent off.' }],
  ['a5-typhoon', 'blathers', 'A typhoon warning remains in place for Kanto. Expect heavy rain from about 2 p.m., with gusts of up to 90 kilometres an hour, easing to 40 by Thursday morning.',
    '関東に台風の警報が続いています。午後2時ごろから大雨、最大瞬間風速は90キロ、木曜朝には40キロまで弱まる見込みです。',
    'gusts of up to＝最大瞬間で〜。easing to は弱まった後',
    ['90キロ', '40キロ', '19キロ'],
    tg(60, 'broadcast', 'literal', ['cafe'], ['numbers']), light('cafe'),
    { ask: '最大の風速は？', focus: 'up to 90 kilometres', tts: 'A typhoon warning remains in place for Kanto. Expect heavy rain from about two p.m., with gusts of up to ninety kilometres an hour, easing to forty by Thursday morning.' }]
];

// ---- gist: what's going on, what to do (a single clip; the right one first) -----------------------------------------

const GIST: readonly Row[] = [
  ['a5-suspended', 'goldie', 'Due to an accident at Shinjuku, Chuo Line services are suspended between Tokyo and Mitaka. Passengers are advised to use Tokyo Metro services instead.',
    '新宿駅での事故のため、中央線は東京〜三鷹間で運転を見合わせています。東京メトロをご利用ください。 → 別の路線で行く。',
    'suspended＝運転見合わせ。instead の前が代わりの手段',
    ['Take a different line.', 'Wait on the platform for the next train.', 'Change trains at Mitaka.'],
    tg(5, 'official', 'literal', ['pa', 'station']), heavy('pa', 'station'),
    { ask: 'どうすれば いい？', focus: 'use Tokyo Metro services instead' }],
  ['a5-other-side', 'maple', 'The doors on this side will not open at the next station. Please use the doors on the opposite side.',
    '次の駅では、こちら側のドアは開きません。反対側のドアをご利用ください。 → 反対側のドアから降りる。',
    'opposite side＝反対側。will not open を聞き逃さない',
    ['Get off on the other side.', 'The next station is closed.', 'The doors on this side are broken.'],
    tg(5, 'official', 'literal', ['pa']), light('pa'),
    { ask: 'なんの アナウンス？', focus: 'use the doors on the opposite side' }],
  ['a5-wind', 'julian', 'Owing to high winds, trains on this line are running at reduced speed, and some services may be cancelled at short notice.',
    '強風のため、この路線の列車は速度を落として運転しており、一部の列車は急に運休となる場合があります。 → 遅れていて、運休もありうる。',
    'owing to＝〜のため。at short notice＝直前に',
    ['Trains are slower, and some may not run.', 'All trains are cancelled for today.', 'Trains are running on time despite the wind.'],
    tg(11, 'official', 'literal', ['pa', 'station']), light('pa', 'station'),
    { ask: 'いま どんな じょうきょう？', focus: 'running at reduced speed' }],
  ['a5-burst-pipe', 'cherry', "Thanks for calling Metro Water. Our office is now closed. If you're reporting a burst pipe or no water supply, please stay on the line.",
    'メトロ水道にお電話ありがとうございます。営業時間外です。水道管の破損や断水のご連絡は、このままお待ちください。 → 切らずに待つ。',
    'stay on the line＝切らずに待つ。closed で切らない',
    ['Stay on the line.', 'Call back tomorrow morning.', 'Hang up and send an email.'],
    tg(21, 'service', 'literal', ['phone']), light('phone'),
    { ask: '水道管が こわれた。どうする？', focus: 'please stay on the line' }],
  ['a5-cover-shift', 'punchy', "Hey, it's me. Look, I know it's short notice, and you can totally say no, but is there any chance you could cover my shift on Saturday? My sister's flying in. Anyway, text me.",
    'おれだよ。急で悪いし、断ってくれていいんだけど、土曜のシフト代わってもらえないかな？姉が来るんだ。じゃ、メールして。 → 土曜に代わりに働いてほしい。',
    '前置きが長く、用件は but の後。cover＝代わる',
    ['He wants you to work for him on Saturday.', 'His sister wants to meet you on Saturday.', "He can't come to your party on Saturday."],
    tg(45, 'friend', 'indirect', ['voicemail']), light('voicemail'),
    { ask: 'でんわの ようけんは？', focus: 'cover my shift on Saturday', tts: "Hey, it's me. Look, I know it's short notice, an' you can totally say no, but is there any chance you could cover my shift on Saturday? My sister's flyin' in. Anyway, text me." }],
  ['a5-alarm-test', 'tom-nook', 'This is a test of the building fire alarm system. No action is required. Please continue with your normal activities.',
    'これはビルの火災報知設備の試験です。対応は必要ありません。そのまま通常どおりお過ごしください。 → 何もしなくていい。',
    'No action is required＝何もしなくてよい',
    ["Nothing. It's only a test.", 'Leave the building now.', 'Wait for more instructions.'],
    tg(34, 'official', 'literal', ['pa']), light('pa'),
    { ask: 'どうすれば いい？', focus: 'No action is required' }]
];

// ---- mean: what it really means --------------------------------------------------------------------------------------

const MEAN: readonly Row[] = [
  ['a5-high-volume', 'diana', "We're currently experiencing a high volume of calls. You may find it quicker to visit our website.",
    'ただいまお電話が大変混み合っております。ウェブサイトのほうが早い場合がございます。 → つまり、電話はかなり待つ。',
    'high volume of calls＝混雑。遠回しに「待つよ」',
    ["You'll probably have to wait a long time on the phone.", 'The website is down at the moment.', "They'll call you back very soon."],
    tg(22, 'service', 'indirect', ['phone']), heavy('phone')],
  ['a5-passing', 'judy', 'Please stand back from the platform edge. The next train will not be stopping at this station.',
    'ホームの端から下がってください。次の電車はこの駅に停まりません。 → つまり、電車が通過する。',
    'not stopping＝通過。運休ではない',
    ['A train is going to pass through without stopping.', 'The next train has been cancelled.', 'The platform is closed for repairs.'],
    tg(5, 'official', 'literal', ['pa', 'station']), heavy('pa', 'station')],
  ['a5-alight', 'mabel', 'Please allow passengers to alight before boarding.',
    'ご乗車の前に、お降りになるお客様をお待ちください。 → つまり、降りる人が先。',
    'alight＝降りる（堅い言い方）。board＝乗る',
    ['Let people get off first.', 'Board through the front doors only.', 'Get on quickly, the doors are closing.'],
    tg(5, 'official', 'formula', ['pa', 'station']), light('pa', 'station')],
  ['a5-last-train', 'raymond', 'This is the last train this evening to Brighton. There are no further services tonight.',
    'これが今夜のブライトン行き最終列車です。今夜はこの後の運行はありません。 → つまり、これを逃すともう電車はない。',
    'no further services＝この後はない',
    ['If you miss this one, there are no more trains tonight.', 'This train will stop before Brighton tonight.', 'The next train to Brighton leaves from another platform.'],
    tg(5, 'official', 'literal', ['pa', 'station']), light('pa', 'station')],
  ['a5-plumber', 'tom-nook', "Hi, it's Tom from the agency. Just a heads-up, the plumber's running late tomorrow. I wouldn't hold your breath before lunch.",
    '不動産屋のトムです。念のため、明日は配管工が遅れそうです。お昼前はあまり期待しないでください。 → つまり、午前中は来ない。',
    "don't hold your breath＝期待しないで",
    ["The plumber probably won't come in the morning.", 'The plumber will come early tomorrow.', 'You should call the plumber before lunch.'],
    tg(30, 'neighbour', 'hedge', ['voicemail'], ['idiom', 'contraction']), light('voicemail'),
    { tts: "Hi, it's Tom from the agency. Just a heads-up, the plumber's runnin' late tomorrow. I wouldn't hold your breath before lunch." }],
  ['a5-rows', 'orville', "At this time, we'd like to invite passengers seated in rows 30 and higher to board. All other passengers, please remain seated.",
    'ただいまより、30列目以降のお客様のご搭乗をご案内いたします。その他のお客様はお座りのままお待ちください。 → つまり、後方の席の人だけ。',
    'rows 30 and higher＝30列目以降（機体の後方）',
    ['Only people at the back of the plane can board now.', 'Everyone can board the plane now.', 'Passengers in row 30 need to change seats.'],
    tg(2, 'official', 'literal', ['pa', 'station']), light('pa', 'station'),
    { tts: "At this time, we'd like to invite passengers seated in rows thirty and higher to board. All other passengers, please remain seated." }]
];

// ---- reply: what to say back -----------------------------------------------------------------------------------------

const REPLY: readonly Row[] = [
  ['a5-reason', 'maple', "In a few words, please tell me the reason for your call. For example, you can say 'check my balance' or 'report a problem'.",
    'ご用件をひとことでお話しください。たとえば「残高確認」や「問題の報告」などとお話しいただけます。 → 「問題の報告。」',
    '自動音声には用件だけを短く言う',
    ['Report a problem.', 'Yes, I can.', 'A few words, please.'],
    tg(21, 'service', 'literal', ['phone']), light('phone')],
  ['a5-intercom', 'julian', 'Station office. Have you tried tapping your card again on the yellow reader?',
    '駅事務室です。黄色の読み取り機にもう一度カードをタッチしてみましたか？ →「はい、2回。まだエラーが出ます。」',
    'Have you tried ~ing?＝〜してみた？ 経験の有無',
    ['Yes, twice. It still says error.', "No, I don't have a yellow card.", "I'll try the station office."],
    tg(5, 'service', 'literal', ['phone']), heavy('phone', 'station')],
  ['a5-make-known', 'coco', 'Passenger Kenji Mori, travelling to Bangkok, please make yourself known to a member of staff at gate 22.',
    'バンコク行きのモリ・ケンジ様、22番ゲートの係員までお申し出ください。 →「モリです。名前を呼ばれたと思います。」',
    'make yourself known＝名乗り出る。呼び出し放送',
    ["Hi, I'm Kenji Mori. I think you called my name.", "Gate 22 is just over there.", "I'm travelling to Bangkok, too."],
    tg(2, 'official', 'literal', ['pa', 'station']), heavy('pa', 'station'),
    { tts: 'Passenger Kenji Mori, travelling to Bangkok, please make yourself known to a member of staff at gate twenty-two.' }],
  ['a5-leave-message', 'goldie', "Hi, you've reached Dr Patel's office. We're closed for lunch until 2. Please leave your name, your number and a short message after the tone.",
    'パテル医院です。2時まで昼休みです。発信音の後に、お名前、電話番号、ご用件をどうぞ。 →「ケン・モリです。予約のことで折り返しお願いします。」',
    'after the tone＝発信音の後。名前・番号・用件',
    ["Hi, this is Ken Mori. Could you call me back about an appointment?", "Hi, I'll have lunch at two, then.", 'Hello? Dr Patel? Are you there?'],
    tg(14, 'service', 'formula', ['voicemail']), light('voicemail'),
    { tts: "Hi, you've reached Doctor Patel's office. We're closed for lunch until two. Please leave your name, your number and a short message after the tone." }],
  ['a5-did-you-say', 'bunnie', "Sorry, I didn't catch that. Did you say 'cancel my order'?",
    'すみません、聞き取れませんでした。「注文のキャンセル」とおっしゃいましたか？ →「いいえ、注文の変更です。」',
    '自動音声の確認。違うときは No と正しい用件',
    ['No, change my order.', "Yes, I didn't catch it.", "Sorry, I'll order later."],
    tg(21, 'service', 'literal', ['phone']), heavy('phone')],
  ['a5-out-of-service', 'sherb', "Sorry, mate, this train's not in service. You'll want the next one, from platform 2.",
    'すみません、この電車は回送です。次の電車に乗ってください、2番線からです。 →「あ、すみません。2番線ですね？」',
    'not in service＝回送。mate は気さくな呼びかけ',
    ['Oh, sorry. Platform 2, you said?', "Yes, it's in service.", "I'll want the last one, then."],
    tg(5, 'service', 'literal', ['station']), light('station'),
    { tts: "Sorry, mate, this train's not in service. You'll want the next one, from platform two." }]
];

/** Level 5's items. */
export const BANK5: readonly Item[] = [
  ...NUM.map(item('num')),
  ...GIST.map(item('gist')),
  ...MEAN.map(item('mean')),
  ...REPLY.map(item('reply'))
];
