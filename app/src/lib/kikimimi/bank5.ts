// ききみみ クイズ level 5 「アナウンス」 (docs/curriculum.md "Modes" game 7): the announcements pack, B1+ →
// B2. Real station and train announcements (Tokyo's JR and Metro English, US rail and subway), airport PA (boarding,
// gate changes, final calls), voicemails, phone menus (IVR: "press 3 for…"), store announcements and a radio weather
// blurb, each heard
// through its channel: the speech conditions (docs/kikimimi-engine.md "Conditions") are the point of the pack, a ladder of
// channel and noise: a PA's hall (heavy on a busy concourse), a phone line, a voicemail, a station's or a café's noise.
// Formal, scripted register mostly (announcers read), with casual voicemails reduced as people speak (`tts`: gonna,
// lemme, 'cause); every number written out in `tts`, never a digit. American English: US announcement style, spelling
// and vocabulary.
//   Types: `num` (the number that matters, the distractors the corrected one, another heard, a near sound), `gist`
// (what's going on or what to do: a single clip, its own `ask`), `mean` (what it really means: the literal reading, the
// opposite and a plausible wrong inference) and `reply` (what to say back: an IVR, an intercom, a staff member, the
// message to leave). `ja` gives the clip's Japanese, then 「→ the answer's」 for gist, mean and reply.
//   Speakers keep their cast voices for good (cast.ts CAST); station and airport PA voices are the announcers'.
//   Gated like any level: the lobby offers it once every item has a clip (compile.ts playable).
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Cond, Item, ItemType, Tags } from './bank.ts';
import { MEAN_ASK, single, tg } from './content/build.ts';
import { staged } from './staging.ts';

type Extra = { tts?: string; focus?: string; ask?: string };
type Row = readonly [id: string, speaker: RosterId, en: string, ja: string, note: string, choices: readonly string[], tags: Tags, cond: Cond, extra?: Extra];

const light = (kind: Cond['kind'], bed?: Cond['bed']): Cond => ({ kind, level: 'light', ...(bed && { bed }) });
const heavy = (kind: Cond['kind'], bed?: Cond['bed']): Cond => ({ kind, level: 'heavy', ...(bed && { bed }) });

const item = (type: ItemType) => ([id, speaker, en, ja, note, choices, tags, cond, x = {}]: Row): Item => {
  const ask = x.ask ?? (type === 'mean' ? MEAN_ASK : undefined);
  return {
    ...single(5, type, id, speaker, en, ja, note, choices, tags), cond,
    ...(x.tts && { tts: x.tts }), ...(x.focus && { focus: x.focus }), ...(ask && { ask }), ...staged(id), ...HELP[id]
  };
};

// ---- num: the number that matters (the right one first) -------------------------------------------------------------

const NUM: readonly Row[] = [
  ['a5-track', 'judy', "Ladies and gentlemen, due to rain, tonight's first pitch has been pushed back from 7:05 to 7:45. Thanks for your patience!",
    'ご来場の皆さま、雨のため、今夜の試合開始は7時5分から7時45分に変更となりました。ご理解ありがとうございます。',
    'pushed back from A to B＝AからBへ延期。後ろが新時刻',
    ['7:45', '7:05', '8:05'],
    tg(2, 'official', 'literal', ['pa'], ['numbers']), light('pa'),
    { ask: '試合開始は？', focus: '7:45', tts: "Ladies and gentlemen, due to rain, tonight's first pitch has been pushed back from seven-oh-five to seven forty-five. Thanks for your patience!" }],
  ['a5-behind', 'raymond', "Ladies and gentlemen, we apologize for the delay. Due to an earlier signal problem, we're running about 15 minutes behind schedule.",
    '遅れて申し訳ございません。先ほどの信号トラブルのため、この列車は約15分遅れて運行しております。',
    'behind schedule＝遅れ。15は-teenが長い。50はフィフディ',
    ['15分', '50分', '5分'],
    tg(5, 'official', 'literal', ['pa'], ['teen-ty']), light('pa'),
    { ask: '何分遅れ？', focus: '15 minutes', tts: "Ladies and gentlemen, we apologize for the delay. Due to an earlier signal problem, we're running about fifteen minutes behind schedule." }],
  ['a5-final-call', 'orville', "This is the final boarding call for passenger Sato on flight 212 to Chicago. Please proceed immediately to gate 64.",
    'シカゴ行き212便にご搭乗のサトウ様、最終のご案内です。至急64番搭乗口へお越しください。',
    'final call＝最終案内。便名と搭乗口を混同しない',
    ['64番', '46番', '212番'],
    tg(2, 'official', 'literal', ['pa', 'station']), heavy('pa', 'station'),
    { ask: '搭乗口は？', focus: 'gate 64', tts: "This is the final boarding call for passenger Sato on flight two-twelve to Chicago. Please proceed immediately to gate sixty-four." }],
  ['a5-gate-moved', 'coco', 'Welcome to the Fox Theater! The opening act goes on at 7:30, and the headliner takes the stage at about 9:15.',
    'フォックス・シアターへようこそ！前座は7時30分、メインの出演は9時15分ごろです。',
    'headliner＝メイン。opening act＝前座',
    ['9:15', '7:30', '9:50'],
    tg(26, 'official', 'literal', ['pa'], ['numbers', 'teen-ty']), light('pa'),
    { ask: 'メインの 出演は 何時ごろ？', focus: '9:15', tts: 'Welcome to the Fox Theater! The opening act goes on at seven thirty, and the headliner takes the stage at about nine fifteen.' }],
  ['a5-boarding-time', 'wilbur', 'Good morning, guests! All-aboard time in Cozumel today is 4:30 p.m. The ship sails at 5, with or without you!',
    'おはようございます！本日コスメルでの乗船締め切りは午後4時30分です。船は5時に出港します。皆さまがいても、いなくても！',
    'all-aboard time＝乗船締め切り。出港の5時ではない',
    ['4:30', '5:00', '4:50'],
    tg(11, 'official', 'humour', ['pa'], ['numbers']), light('pa'),
    { ask: '船に もどる 締め切りは？', focus: '4:30 p.m.', tts: 'Good morning, guests! All-aboard time in Cozumel today is four thirty p.m. The ship sails at five, with or without you!' }],
  ['a5-press-three', 'maple', 'For billing and payments, press 1. To report a lost or stolen card, press 3. For all other inquiries, please hold.',
    'ご請求とお支払いは1を、カードの紛失・盗難は3を、その他のお問い合わせはそのままお待ちください。',
    'メニューは用件が先、番号が後に来る',
    ['3', '1', 'そのまま待つ'],
    tg(21, 'service', 'literal', ['phone']), light('phone'),
    { ask: 'カードをなくした。何番？', focus: 'press 3', tts: 'For billing and payments, press one. To report a lost or stolen card, press three. For all other inquiries, please hold.' }],
  ['a5-queue', 'diana', 'All of our representatives are currently assisting other callers. You are caller number 6, and your estimated wait time is 12 minutes.',
    'ただいま担当者はすべて他のお客様の対応中です。お客様は6番目で、お待ち時間はおよそ12分です。',
    'caller number 6 は順番。wait time の後が時間',
    ['12分', '6分', '20分'],
    tg(22, 'service', 'literal', ['phone']), heavy('phone'),
    { ask: '待ち時間は？', focus: '12 minutes', tts: 'All of our representatives are currently assisting other callers. You are caller number six, and your estimated wait time is twelve minutes.' }],
  ['a5-dentist', 'whitney', "Hi, it's Karen from Bayside Dental, just confirming your appointment on Thursday the 14th at 3:15. Give us a call if you need to change it.",
    'ベイサイド歯科のカレンです。14日木曜、3時15分のご予約の確認です。変更があればお電話ください。',
    '日付→時刻の順。3:15 の fifteen に引っぱられない',
    ['14日', '15日', '4日'],
    tg(16, 'service', 'literal', ['voicemail'], ['teen-ty']), light('voicemail'),
    { ask: '予約は何日？', focus: 'the 14th', tts: "Hi, it's Karen from Bayside Dental, just confirming your appointment on Thursday the fourteenth at three fifteen. Give us a call if you need to change it." }],
  ['a5-key-code', 'kid-cat', "Hey, it's Sam. So Grandma's turning 90 on Sunday! I got the cake, so can you grab the number candles on your way? Thanks!",
    'サムだよ。おばあちゃん、日曜で90歳だって！ケーキは買ったから、来る途中で数字のろうそくを買ってきてくれる？よろしく！',
    'NINEty は前に強勢。nineTEEN と区別',
    ['90歳', '19歳', '80歳'],
    tg(54, 'friend', 'literal', ['voicemail'], ['teen-ty', 'numbers']), light('voicemail'),
    { ask: 'おばあちゃんは 何歳に なる？', focus: '90', tts: "Hey, it's Sam. So Grandma's turning ninety on Sunday! I got the cake, so can ya grab the number candles on your way? Thanks!" }],
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
    { ask: '何%オフ？', focus: '40% off', tts: 'Shoppers, for the next thirty minutes only, all winter coats on the third floor are forty percent off.' }],
  ['a5-typhoon', 'blathers', 'A typhoon warning remains in place for Kanto. Expect heavy rain from about 2 p.m., with gusts of up to 90 kilometers an hour, easing to 40 by Thursday morning.',
    '関東に台風の警報が続いています。午後2時ごろから大雨、最大瞬間風速は90キロ、木曜朝には40キロまで弱まる見込みです。',
    'gusts of up to＝最大瞬間で〜。easing to は弱まった後',
    ['90キロ', '40キロ', '19キロ'],
    tg(60, 'broadcast', 'literal', ['cafe'], ['numbers']), light('cafe'),
    { ask: '最大の風速は？', focus: 'up to 90 kilometers', tts: 'A typhoon warning remains in place for Kanto. Expect heavy rain from about two p.m., with gusts of up to ninety kilometers an hour, easing to forty by Thursday morning.' }]
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
  ['a5-wind', 'julian', 'May I have your attention, please. The museum will close in twenty minutes. Please make your way to the exits. The gift shop will stay open for another half hour.',
    'お客様にお知らせいたします。当館はあと20分で閉館です。出口へお進みください。ギフトショップはさらに30分営業しております。 → 展示はもうすぐ閉まるが、ショップはもう少し開いている。',
    'another half hour＝さらに30分。ショップのほうが遅くまで',
    ['The galleries close soon, but you can shop a little longer.', 'The gift shop closes in twenty minutes.', 'The museum is staying open late tonight.'],
    tg(26, 'official', 'literal', ['pa']), light('pa'),
    { ask: 'いま どんな じょうきょう？', focus: 'The gift shop will stay open for another half hour' }],
  ['a5-burst-pipe', 'cherry', "Thanks for calling Metro Water. Our office is now closed. If you're reporting a burst pipe or a water outage, please stay on the line.",
    'メトロ水道にお電話ありがとうございます。営業時間外です。水道管の破損や断水のご連絡は、このままお待ちください。 → 切らずに待つ。',
    'stay on the line＝切らずに待つ。closed で切らない',
    ['Stay on the line.', 'Call back tomorrow morning.', 'Hang up and send an email.'],
    tg(21, 'service', 'literal', ['phone']), light('phone'),
    { ask: '水道管が こわれた。どうする？', focus: 'please stay on the line' }],
  ['a5-cover-shift', 'punchy', "Hey, it's me. Look, I know it's short notice, and you can totally say no, but is there any chance you could give me a ride to the airport Saturday morning? My flight's at seven. Anyway, text me.",
    'おれだよ。急で悪いし、断ってくれていいんだけど、土曜の朝、空港まで車で送ってもらえないかな？飛行機が7時なんだ。じゃ、メッセージして。 → 土曜の朝、空港まで送ってほしい。',
    '前置きが長く、用件は but の後。ride＝車で送ること',
    ['He wants a ride to the airport on Saturday.', 'His flight on Saturday was canceled.', 'He wants you to fly with him on Saturday.'],
    tg(45, 'friend', 'indirect', ['voicemail']), light('voicemail'),
    { ask: 'でんわの ようけんは？', focus: 'give me a ride to the airport', tts: "Hey, it's me. Look, I know it's short notice, an' you can totally say no, but is there any chance you could gimme a ride to the airport Saturday mornin'? My flight's at seven. Anyway, text me." }],
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
    ["You'll probably have to wait a long time on the phone.", 'The website is down right now.', "They'll call you back very soon."],
    tg(22, 'service', 'indirect', ['phone']), heavy('phone')],
  ['a5-passing', 'judy', 'Parents in the pickup line, please stay in your vehicles. A staff member will walk your child out to you.',
    '送迎の列にお並びの保護者の皆さま、車から降りずにお待ちください。職員がお子さまを車までお連れします。 → つまり、車から降りずに待てばいい。',
    'stay in your vehicles＝車から降りない',
    ["Don't get out of the car; they'll bring your kid to you.", 'Park and go inside to pick up your child.', 'The pickup line is closed today.'],
    tg(34, 'official', 'literal', ['pa', 'street']), heavy('pa', 'street')],
  ['a5-alight', 'mabel', "Attention, shoppers. We're opening register six, so if you're waiting in line, come on over.",
    'お客様にお知らせします。6番レジを開けますので、お並びの方はどうぞこちらへ。 → つまり、レジがもう一つ開く。',
    'opening＝開ける。come on over＝こちらへどうぞ',
    ['Another checkout lane is opening up.', 'Register six is closing now.', 'Everyone has to change lines.'],
    tg(26, 'official', 'formula', ['pa']), light('pa')],
  ['a5-last-train', 'raymond', 'This is the last train to Newark this evening. There is no further service tonight.',
    'これが今夜のニューアーク行き最終列車です。今夜はこの後の運行はありません。 → つまり、これを逃すともう電車はない。',
    'no further service＝この後はない',
    ['If you miss this one, there are no more trains tonight.', 'This train will stop before Newark tonight.', 'The next train to Newark leaves from another track.'],
    tg(5, 'official', 'literal', ['pa', 'station']), light('pa', 'station')],
  ['a5-plumber', 'tom-nook', "Hi, it's Tom from the management office. Just a heads-up, the plumber's running late tomorrow, so if you're hoping to see him before lunch, I wouldn't hold your breath.",
    '管理会社のトムです。念のため、明日は配管工が遅れそうです。お昼前に来てほしいなら、あまり期待しないでください。 → つまり、午前中は来ない。',
    "don't hold your breath＝期待しないで",
    ["The plumber probably won't come in the morning.", 'The plumber will come early tomorrow.', 'You should call the plumber before lunch.'],
    tg(30, 'neighbour', 'hedge', ['voicemail'], ['idiom', 'contraction']), light('voicemail'),
    { tts: "Hi, it's Tom from the management office. Just a heads-up, the plumber's runnin' late tomorrow, so if you're hopin' to see him before lunch, I wouldn't hold your breath." }],
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
  ['a5-make-known', 'coco', "Attention, shoppers. We have a little boy named Leo, about five years old, at Guest Services by the main entrance. He's looking for his mom.",
    'お客様にお知らせします。5歳くらいのレオくんという男の子が、正面入口のサービスカウンターでお母さんを待っています。 →「うちの子です！大丈夫ですか？」',
    '迷子の呼び出し。名乗り出るなら誰の親かを言う',
    ["That's my son! Is he okay?", 'Guest Services is by the main entrance.', "He's about five, I think."],
    tg(20, 'official', 'literal', ['pa']), heavy('pa')],
  ['a5-leave-message', 'goldie', "Hi, you've reached Dr. Rivera's office. We're closed for lunch until 2. Please leave your name, your number and a short message after the tone.",
    'リベラ医院です。2時まで昼休みです。発信音の後に、お名前、電話番号、ご用件をどうぞ。 →「ケン・モリです。予約のことで折り返しお願いします。」',
    'after the tone＝発信音の後。名前・番号・用件',
    ["Hi, this is Ken Mori. Could you call me back about an appointment?", "Hi, I'll have lunch at two, then.", 'Hello? Dr. Rivera? Are you there?'],
    tg(14, 'service', 'formula', ['voicemail']), light('voicemail'),
    { tts: "Hi, you've reached Doctor Rivera's office. We're closed for lunch until two. Please leave your name, your number and a short message after the tone." }],
  ['a5-did-you-say', 'bunnie', "Sorry, I didn't catch that. Did you say 'cancel my order'?",
    'すみません、聞き取れませんでした。「注文のキャンセル」とおっしゃいましたか？ →「いいえ、注文の変更です。」',
    '自動音声の確認。違うときは No と正しい用件',
    ['No, change my order.', "Yes, I didn't catch it.", "Sorry, I'll order later."],
    tg(21, 'service', 'literal', ['phone']), heavy('phone')],
  ['a5-out-of-service', 'sherb', "Sorry, buddy, this train's not in service. You'll want the next one, on track 2.",
    'すみません、この電車は回送です。次の電車に乗ってください、2番線です。 →「あ、すみません。2番線ですね？」',
    'not in service＝回送。buddy は気さくな呼びかけ',
    ['Oh, sorry. Track 2, you said?', "Yes, it's in service.", "I'll want the last one, then."],
    tg(5, 'service', 'literal', ['station']), light('station'),
    { tts: "Sorry, buddy, this train's not in service. You'll want the next one, on track two." }]
];

// ---- the Japanese help (bank.ts cja, why, ctx; docs/kikimimi.md "Japanese help") -----------------------------------

const HELP: Readonly<Record<string, Pick<Item, 'cja' | 'why' | 'ctx'>>> = {
  // num
  'a5-track': { cja: ['7時45分', '7時5分', '8時5分'],
    why: 'pushed back from A to B＝AからBへ遅らせた。後ろの seven forty-five が新しい開始時刻。seven-oh-five は元の時刻。', ctx: '野球場の場内アナウンス' },
  'a5-behind': { cja: ['15分', '50分', '5分'],
    why: 'running about fifteen minutes behind schedule＝約15分遅れ。fifTEEN は後ろが長く強い。FIFty なら前が強い。', ctx: '電車の車内アナウンス' },
  'a5-final-call': { cja: ['64番', '46番', '212番'],
    why: 'proceed immediately to gate 64＝すぐに64番搭乗口へ。212は便名。sixty-four と forty-six の順番に注意。', ctx: '空港のアナウンス' },
  'a5-gate-moved': { cja: ['9時15分', '7時30分', '9時50分'],
    why: 'opening act（前座）は7時30分、headliner（メイン）は about nine fifteen。fifTEEN と FIFty の強勢に注意。', ctx: 'コンサート会場のアナウンス' },
  'a5-boarding-time': { cja: ['4時30分', '5時', '4時50分'],
    why: 'All-aboard time＝乗船の締め切り、four thirty。The ship sails at five は出港時刻なので、それより前に戻る。', ctx: 'クルーズ船の朝の船内放送' },
  'a5-press-three': { cja: ['3', '1', 'そのまま待つ'],
    why: 'To report a lost or stolen card, press three＝紛失・盗難は3。自動音声は「用件 → 番号」の順なので、用件を聞いてから番号を待つ。', ctx: 'カード会社に電話しています' },
  'a5-queue': { cja: ['12分', '6分', '20分'],
    why: 'caller number six は順番（6番目）。wait time is twelve minutes＝待ち時間は約12分。twelve と twenty も聞き分ける。', ctx: 'サポート窓口に電話しています' },
  'a5-dentist': { cja: ['14日', '15日', '4日'],
    why: 'Thursday the fourteenth＝14日の木曜。three fifteen は時刻（3時15分）。fourth（4日）より長く、teenth がある。', ctx: '歯医者からの留守電' },
  'a5-key-code': { cja: ['90歳', '19歳', '80歳'],
    why: 'turning ninety＝90歳になる。NINEty は前が強い。nineteen なら後ろの teen が長い。number candles＝数字の形のろうそく。', ctx: '家族からの留守電' },
  'a5-closing': { cja: ['20時', '20時15分', '19時45分'],
    why: 'in fifteen minutes＝あと15分で、at eight p.m.＝午後8時に。閉店は8時。15分を足したり引いたりしないこと。', ctx: 'お店の閉店前の放送' },
  'a5-coats': { cja: ['40%オフ', '30%オフ', '13%オフ'],
    why: 'for the next thirty minutes は時間（30分間）。割引は forty percent off＝40%オフ。third floor（3階）も混ざるので注意。', ctx: 'デパートの店内放送' },
  'a5-typhoon': { cja: ['90キロ', '40キロ', '19キロ'],
    why: 'gusts of up to ninety＝最大90キロの突風。easing to forty は木曜朝に弱まった後。NINEty は前が強い。', ctx: 'カフェで、ラジオのニュース' },
  // gist
  'a5-suspended': { cja: ['別の路線で行く。', 'ホームで次の電車を待つ。', '三鷹で乗り換える。'],
    why: 'services are suspended＝運転見合わせ。use Tokyo Metro services instead＝代わりに東京メトロを使って。待っても電車は来ない。', ctx: '東京駅のホームのアナウンス' },
  'a5-other-side': { cja: ['反対側のドアから降りる。', '次の駅は閉鎖中。', 'こちら側のドアは壊れている。'],
    why: 'will not open at the next station＝次の駅では開かない。use the doors on the opposite side＝反対側のドアを使って。', ctx: '電車の車内アナウンス' },
  'a5-wind': { cja: ['展示はもうすぐ閉まるが、ショップは少し長く開いている。', 'ギフトショップは20分で閉まる。', '博物館は今夜遅くまで開いている。'],
    why: '博物館は in twenty minutes で閉館、ギフトショップは stay open for another half hour＝さらに30分営業。ショップのほうが遅い。', ctx: '博物館の館内放送' },
  'a5-burst-pipe': { cja: ['切らずに待つ。', '明日の朝かけ直す。', '電話を切ってメールを送る。'],
    why: 'office is now closed で切りたくなるが、burst pipe（水道管の破裂）なら please stay on the line＝切らずにお待ちください。', ctx: '夜、水道局に電話しています' },
  'a5-cover-shift': { cja: ['土曜に空港まで車で送ってほしい。', '土曜のフライトが欠航した。', '土曜に一緒に飛行機に乗ってほしい。'],
    why: '長い前置きの後、but の後が用件：give me a ride to the airport＝空港まで車で送って。ride は「乗せてもらうこと」。', ctx: '友だちからの留守電' },
  'a5-alarm-test': { cja: ['何もしない。ただの試験。', 'すぐに建物から出る。', '次の指示を待つ。'],
    why: 'This is a test＝試験。No action is required＝対応は不要。normal activities を続けて＝いつもどおりに。', ctx: '職場のビルの館内放送' },
  // mean
  'a5-high-volume': { cja: ['電話ではたぶん長く待つ。', 'ウェブサイトは今使えない。', 'すぐ折り返しの電話が来る。'],
    why: 'high volume of calls＝電話が混んでいる。quicker to visit our website＝サイトのほうが早い、は「電話は長く待つ」という遠回しな案内。', ctx: 'サポート窓口に電話しています' },
  'a5-passing': { cja: ['車から降りずに待てば、子どもを連れてきてくれる。', '車を停めて、中に迎えに行く。', '今日は送迎の列が閉まっている。'],
    why: 'stay in your vehicles＝車から降りないで。A staff member will walk your child out＝職員が子どもを車まで連れてくる。', ctx: '学校のお迎えの車の列で' },
  'a5-alight': { cja: ['レジがもう一つ開く。', '6番レジは今閉まる。', '全員が列を変えなければならない。'],
    why: "We're opening register six＝6番レジを開けます。come on over＝こちらへどうぞ。移っていいのは並んでいる人で、全員ではない。", ctx: 'スーパーの店内放送' },
  'a5-last-train': { cja: ['これを逃すと、今夜はもう電車がない。', '今夜はニューアークの手前で止まる。', '次のニューアーク行きは別のホームから出る。'],
    why: 'the last train＝最終列車。no further service tonight＝今夜はこの後の運行なし。次の電車はない。', ctx: 'ニューヨークの駅のアナウンス' },
  'a5-plumber': { cja: ['配管工はたぶん午前中には来ない。', '配管工は明日早く来る。', 'お昼前に配管工に電話するべき。'],
    why: "I wouldn't hold your breath＝期待しないほうがいい（息を止めて待つな）。遅れる上に、お昼前は期待できない＝午前中は来ない。", ctx: 'アパートの管理会社からの留守電' },
  'a5-rows': { cja: ['今は飛行機の後ろの席の人だけ搭乗できる。', '今は全員が搭乗できる。', '30列目の人は席を変える必要がある。'],
    why: 'rows 30 and higher＝30列目以降で、機体の後ろの席。All other passengers, please remain seated＝ほかの人は座って待つ。', ctx: '空港の搭乗口で' },
  // reply
  'a5-reason': { cja: ['問題の報告。', 'はい、できます。', 'ひとことでお願いします。'],
    why: '自動音声の In a few words＝ひとことで用件を。例の report a problem のように短く言う。質問を繰り返したり Yes で答えたりしない。', ctx: '銀行の自動音声に電話しています' },
  'a5-intercom': { cja: ['はい、2回。まだエラーが出ます。', 'いいえ、黄色いカードは持っていません。', '駅事務室に行ってみます。'],
    why: 'Have you tried tapping～?＝〜をタッチしてみた？ 試したかどうかと結果を答える。yellow は読み取り機の色で、カードの色ではない。', ctx: '改札で、インターホンを押しました' },
  'a5-make-known': { cja: ['うちの子です！ 大丈夫ですか？', 'サービスカウンターは正面入口のそばです。', 'たしか5歳くらいです。'],
    why: "迷子の呼び出し。He's looking for his mom＝お母さんを探している。名乗り出る親なら「うちの子です」が自然。場所や年齢の繰り返しは罠。", ctx: 'ショッピングモールで、子どもとはぐれました' },
  'a5-leave-message': { cja: ['ケン・モリです。予約の件で折り返しお願いします。', 'じゃあ、2時にお昼を食べます。', 'もしもし？ リベラ先生？ いますか？'],
    why: 'after the tone＝発信音の後に。名前・番号・用件を残すのが自然。録音に話しかける Are you there? や、lunch の繰り返しは罠。', ctx: '病院に電話したら、留守電でした' },
  'a5-did-you-say': { cja: ['いいえ、注文の変更です。', 'はい、聞き取れませんでした。', 'すみません、あとで注文します。'],
    why: "Did you say 'cancel my order'?＝「注文のキャンセル」と言いましたか？ 違うなら No と正しい用件を言う。didn't catch の繰り返しは罠。", ctx: '通販の自動音声に電話しています' },
  'a5-out-of-service': { cja: ['あ、すみません。2番線でしたっけ？', 'はい、運行中です。', 'じゃあ、最終に乗ります。'],
    why: "not in service＝回送（客を乗せない）。You'll want the next one＝次のに乗るといいよ。番線を確かめるのが自然。in service の罠に注意。", ctx: '駅で、電車に乗ろうとしたら' }
};

/** Level 5's items. */
export const BANK5: readonly Item[] = [
  ...NUM.map(item('num')),
  ...GIST.map(item('gist')),
  ...MEAN.map(item('mean')),
  ...REPLY.map(item('reply'))
];
for (const id of Object.keys(HELP)) if (!BANK5.some((it) => it.id === id)) throw new Error(`kikimimi: help for ${id}, not an item`);
