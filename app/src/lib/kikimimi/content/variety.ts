// ききみみ content: the variety set (2026-11-06; the user: "more variety and situations, American English, fun and
// short"). The situations the banks were thin on, all in American English with US voices: events and celebrations (a
// wedding toast, a baby shower, a Super Bowl party, Halloween, a graduation, a concert, a farmers market), places in
// town (a barber, the library, a museum tour, the park, the gym's front desk, a bookstore, a hardware store, a car
// rental counter), friends (catching up after a trip, a show worth the slow start, a roommate, gossip, group-chat voice
// memos), home (moving, roommates, a broken AC, a neighbor's dog), tech help (a password reset, a café's Wi-Fi, setting
// up a phone), dating and family, and Tokyo daily life told by Americans (a konbini, the train, a coworker from the
// US). Two sets: もり's (level 4, `vm-` and `dvm-`) and やま's (level 6, `vy-` and `dvy-`: denser idiom, irony and
// reductions).
//   Same shape as mori-life.ts (a row per item, its family, its scene and staging in place). Written after levels 4 and 6
// were offered, so its items join the bank as they're voiced (content/index.ts WAITING, source.ts joined). Voices:
// bank4.ts CAST, US only (content/variety.test.ts).
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Accent, CastId, Channel, Item, ItemType, Level, Line, SceneId, SoundMark, Tags } from '../bank.ts';
import { CAST } from '../bank4.ts';

/** The situation family an item belongs to (coverage; the seed is the nearest §5.5 scenario). */
type Family = 'event' | 'town' | 'social' | 'home' | 'tech' | 'dating' | 'family' | 'tokyo';

const MEAN_ASK = 'つまり、どういうこと？';
const NEXT_ASK = 'つぎの ひとことは？';

type X = { tts?: string; focus?: string; ask?: string; marks?: readonly SoundMark[]; channel?: Channel };
type Row = readonly [id: string, fam: Family, speaker: RosterId, scene: SceneId | null, en: string, ja: string, note: string, choices: readonly string[], tags: Tags, x?: X];
type L = readonly [who: RosterId, en: string, ja: string, tts?: string, marks?: readonly SoundMark[]];
interface DRow {
  id: string;
  fam: Family;
  type: Extract<ItemType, 'gist' | 'next'>;
  scene: SceneId | null;
  lines: readonly L[];
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
const g = (at: string): SoundMark => ['drop', at, 'g'];

const castOf = (who: RosterId): CastId => {
  const cast = CAST[who];
  if (!cast) throw new Error(`kikimimi: ${who} has no cast voice`);
  return cast;
};

/** A set's rows as items and dialogues, with its family map. */
function build(lv: Level, rows: Record<'reply' | 'mean' | 'word' | 'num', readonly Row[]>, drows: readonly DRow[]) {
  const fam: Record<string, Family> = {};
  const item = (type: ItemType) => ([id, f, speaker, scene, en, ja, note, choices, tags, x = {}]: Row): Item => {
    fam[id] = f;
    const cast = castOf(speaker);
    const focus = type === 'word' ? choices[0] : x.focus;
    const ask = x.ask ?? (type === 'mean' ? MEAN_ASK : undefined);
    return {
      id, lv, type, en, ja, speaker, voice: cast.slice(0, 2) as Accent, cast, choices, answer: 0, note, tags,
      ...(x.tts && { tts: x.tts }), ...(focus && { focus }), ...(ask && { ask }), ...(scene && { scene }),
      ...(x.channel && { channel: x.channel }), ...(x.marks && { marks: x.marks })
    };
  };
  const dialogue = (r: DRow): Item => {
    fam[r.id] = r.fam;
    const lines = r.lines.map(([who, en, ja, tts, marks]): Line => ({ who, cast: castOf(who), en, ja, ...(tts && { tts }), ...(marks && { marks }) }));
    return {
      id: r.id, lv, type: r.type, en: lines.map((l) => l.en).join(' '), ja: r.ja, speaker: lines[0].who, voice: lines[0].cast.slice(0, 2) as Accent,
      cast: lines[0].cast, choices: r.choices, answer: 0, focus: r.focus, ask: r.ask ?? NEXT_ASK, note: r.note, tags: r.tags, lines,
      ...(r.scene && { scene: r.scene })
    };
  };
  const items = (['reply', 'mean', 'word', 'num'] as const).flatMap((t) => rows[t].map(item(t)));
  return { items, dialogues: drows.map(dialogue), family: fam as Readonly<Record<string, Family>> };
}

// ==== もり (level 4) ==================================================================================================

const M_REPLY: readonly Row[] = [
  ['vm-r-barber', 'town', 'kabuki', null, 'So, just cleaning it up, or do you want to go shorter on the sides this time?',
    'で、整えるだけ？ それとも今回はサイドをもっと短くする？ →「整えるだけで。前回の、妻に好評だったので。」',
    'A or B の質問。clean up＝今の形を整える',
    ['Just clean it up. My wife liked it last time.', 'Yes, the sides are shorter now.', "It's been about six weeks."],
    tg(26, 'service', 'literal', [], ['wanna']),
    { tts: "So, just cleanin' it up, or d'you wanna go shorter on the sides this time?", marks: [g('cleaning'), ['say', 'do you', "d'you"], ['say', 'want to', 'wanna']] }],
  ['vm-r-library', 'town', 'maple', null, "You can usually renew online, but someone's put a hold on this one, so it's due back Friday.",
    'ふだんはネットで延長できますが、この本は予約が入っているので金曜までに返却です。 →「了解。じゃあ今週中に一気に読みます。」',
    'but の後が本題。予約ありで延長できない',
    ["Got it. I'll speed-read it this week, then.", "Great, I'll renew it online tonight.", 'Sure, can you hold it for me till Friday?'],
    tg(24, 'service', 'indirect')],
  ['vm-r-gym-desk', 'town', 'kicks', null, 'Your membership covers the gym floor, but classes are extra unless you upgrade to Plus.',
    '会員プランでジムは使えますが、クラスはプラスにアップグレードしない限り別料金です。 →「プラスは月いくら高くなりますか？」',
    'unless＝〜しない限り。クラスは今は有料',
    ['How much more is Plus a month?', 'Great, so the yoga class is free.', "I've been working out for years."],
    tg(17, 'service', 'literal')],
  ['vm-r-farmers', 'event', 'pietro', 'street', "These are the last peaches of the season. Want me to throw in the bruised ones for free?",
    '今シーズン最後の桃だよ。傷のあるやつ、タダでおまけしようか？ →「ぜひ。パイにぴったりです。」',
    'throw in＝おまけでつける',
    ["Sure, they'll be perfect for a pie.", "No thanks, I'll wait till they're in season.", 'They do look a little bruised, huh?'],
    tg(26, 'stranger', 'literal', [], ['weak-form']),
    { tts: "These are the last peaches of the season. Want me ta throw in the bruised ones for free?", marks: [['say', 'to', 'ta']] }],
  ['vm-r-halloween', 'event', 'poppy', 'door', "We're turning our garage into a haunted house for the kids Saturday. Want to be a zombie?",
    '土曜、子どもたちのためにガレージをお化け屋敷にするの。ゾンビ役やらない？ →「やる。ゾンビ歩き、けっこううまいよ。」',
    'Want to be～?＝〜役やらない？ の誘い',
    ['Count me in. My zombie walk is pretty convincing.', 'Sure, I can park in your garage Saturday.', 'Wait, is your house actually haunted?'],
    tg(48, 'neighbour', 'literal', [], ['wanna']),
    { tts: "We're turning our garage into a haunted house for the kids Saturday. Wanna be a zombie?", marks: [['say', 'Want to', 'wanna']] }],
  ['vm-r-wifi', 'tech', 'tangy', 'cafe', "The Wi-Fi password's on your receipt, but it kicks you off after an hour.",
    'Wi-Fiのパスワードはレシートに書いてありますが、1時間で切れちゃいます。 →「大丈夫です。メールを2、3通送るだけなので。」',
    'kicks you off＝接続が切られる。1時間の制限',
    ["That's fine. I just need to send a couple of emails.", "Great, I'll stay and work all afternoon.", 'No receipt, thanks. I paid with my phone.'],
    tg(22, 'service', 'literal', ['cafe'])],
  ['vm-r-chargers', 'home', 'beau', 'living', "Hey, no pressure, but my phone chargers have kind of been disappearing. All three of them.",
    'ねえ、責めるつもりはないんだけど、僕の充電器がなんか消えてってるんだよね。3本とも。 →「うっ、犯人は私。ベッドの横にある。返すね。」',
    'no pressure, but＝やんわりした催促',
    ["Ugh, guilty. They're by my bed. I'll bring them back.", 'No pressure. I can charge it for you.', 'Yeah, three is kind of a lot.'],
    tg(35, 'friend', 'indirect', [], ['kinda']),
    { tts: "Hey, no pressure, but my phone chargers have kinda been disappearing. All three of them.", marks: [['say', 'kind of', 'kinda']] }],
  ['vm-r-konbini', 'tokyo', 'flick', 'office', "Want me to grab you anything from the 7-Eleven? I'm going to get one of those egg sandwiches.",
    'セブンで何か買ってこようか？ 俺はあの卵サンドを買うつもり。 →「あ、ホットコーヒーお願い。あとで払うね。」',
    'grab＝さっと買ってくる。頼むなら品名で答える',
    ["Ooh, a hot coffee, please. I'll pay you back.", 'No, I already had eggs for breakfast.', "It's open twenty-four hours, right?"],
    tg(58, 'colleague', 'literal', [], ['gonna']),
    { tts: "Want me ta grab you anything from the Seven-Eleven? I'm gonna get one of those egg sandwiches.",
      marks: [['say', 'to', 'ta'], ['say', '7-Eleven', 'Seven-Eleven'], ['say', 'going to', 'gonna']] }]
];

const M_MEAN: readonly Row[] = [
  ['vm-m-baby-shower', 'event', 'molly', 'living', "The theme's \"little pumpkin,\" so, you know, orange is very much encouraged.",
    'テーマは「ちいさなかぼちゃ」だから、まあ、オレンジは大歓迎ってこと。 → オレンジの服で来てほしい。',
    'very much encouraged＝ほぼ必須のやんわり表現',
    ['Guests should really wear orange.', 'Orange clothes are not allowed.', 'Each guest should bring a pumpkin.'],
    tg(54, 'friend', 'indirect')],
  ['vm-m-super-bowl', 'event', 'bob', 'living', "You can root for the other team at my party. I'm just saying the wings are for our fans.",
    'うちのパーティーで相手チームを応援してもいいよ。ただ、手羽先はうちのファン用ってだけ。 → 冗談めかして、自分のチームを応援してほしい。',
    "I'm just saying＝冗談まじりの本音",
    ["He's joking, but he'd like you to cheer for his team.", "You're not invited to the party.", "There won't be enough wings for everyone."],
    tg(50, 'friend', 'humour')],
  ['vm-m-graduation', 'event', 'admiral', 'street', 'Four years of college, and he still can\'t find his car keys. Proudest day of my life.',
    '大学4年間通っても、まだ車の鍵が見つけられない。人生で一番誇らしい日だよ。 → からかいながらも、孫をとても誇りに思っている。',
    'からかい＋本音。proudest day が結論',
    ["He's teasing, but he's truly proud of him.", "He's upset that college didn't help.", 'His grandson lost the car at graduation.'],
    tg(54, 'friend', 'humour')],
  ['vm-m-concert', 'event', 'katt', 'street', 'Our seats are, uh, technically in the same zip code as the stage.',
    '私たちの席は、えーと、一応ステージと同じ郵便番号の中にあるよ。 → 席はステージからものすごく遠い。',
    'technically＝一応は。誇張で「遠い」と言っている',
    ['The seats are really far from the stage.', 'The seats are right next to the stage.', 'The concert is in another town.'],
    tg(48, 'friend', 'humour', [], ['ellipsis'])],
  ['vm-m-hardware', 'town', 'cyrano', null, 'You could patch it yourself. Or you could watch three videos, patch it twice and then call a plumber.',
    '自分で直すのもアリです。もしくは動画を3本見て、2回直してみて、結局配管工を呼ぶか。 → 最初から配管工を呼んだほうがいい。',
    '皮肉な二択。言いたいのは後半の結末',
    ['Calling a plumber now would save you trouble.', "It's an easy job to do yourself.", 'Watching videos first is the best plan.'],
    tg(31, 'service', 'humour')],
  ['vm-m-car-rental', 'town', 'lopez', null, "You can decline the coverage, of course. Just know your card usually doesn't cover the windshield.",
    '補償はもちろん断れます。ただ、カードの保険では普通フロントガラスは対象外です。 → 補償に入ったほうがいいと勧めている。',
    'Just know＝念のため。遠回しな勧め',
    ["He's nudging you to buy the coverage.", 'Your card covers everything you need.', 'The windshield is already damaged.'],
    tg(7, 'service', 'hedge', ['desk'])],
  ['vm-m-boyfriend', 'home', 'marina', 'living', "I don't mind your boyfriend staying over. I just noticed he's started getting his mail here.",
    '彼氏が泊まるのは別にいいの。ただ、ここに彼宛ての郵便が届き始めたなって。 → 彼が実質住み着いていて、困っている。',
    'I don\'t mind, just～＝本当は気にしている',
    ["She thinks he's basically moved in, and she minds.", "She's happy he stays over so often.", 'She wants him to forward her mail.'],
    tg(32, 'friend', 'indirect')],
  ['vm-m-date', 'dating', 'audie', 'cafe', 'He was nice. He talked a lot about his fantasy football team. Like, a lot.',
    'いい人だったよ。ファンタジーフットボールのチームの話をたくさんしてた。ほんとに、たくさん。 → デートは退屈で、あまり乗り気じゃない。',
    'nice だけ＋Like, a lot.＝退屈だった',
    ["The date was boring, and she's not that into him.", 'She really liked him and wants a second date.', 'She wants to join his fantasy league.'],
    tg(57, 'friend', 'understatement', ['cafe'], ['intonation'])]
];

const M_WORD: readonly Row[] = [
  ['vm-w-gonna-truck', 'home', 'gulliver', 'living', "We're going to have to rent a bigger truck. The couch alone won't fit.",
    'もっと大きいトラックを借りないとだめだね。ソファだけで入らないよ。',
    'gonna＝going to。were なら過去で意味が違う',
    ["We're going to", 'We were going to', 'We want to'],
    tg(33, 'partner', 'literal', [], ['gonna', 'weak-form']),
    { tts: "We're gonna hafta rent a bigger truck. The couch alone won't fit.", marks: [['say', "We're going to", "we're gonna"], ['say', 'have to', 'hafta']] }],
  ['vm-w-lemme-reset', 'tech', 'sterling', 'office', "Let me reset it real quick. You'll get a text with a code.",
    'さくっとリセットするね。コード付きのメッセージが届くよ。',
    "lemme＝Let me。Let's なら一緒にやる",
    ['Let me', "Let's", 'Let him'],
    tg(43, 'colleague', 'literal', [], ['lemme']),
    { tts: "Lemme reset it real quick. You'll get a text with a code.", marks: [['say', 'Let me', 'lemme']] }],
  ['vm-w-shoulda-surprise', 'social', 'frett', 'living', "You should've seen his face when we all yelled \"Surprise!\"",
    'みんなで「サプライズ！」って叫んだときのあいつの顔、見せたかったよ。',
    "shoulda＝should've。否定なら n が残る",
    ["should've", "shouldn't have", "could've"],
    tg(54, 'friend', 'humour', [], ['contraction']),
    { tts: "You shoulda seen his face when we all yelled \"Surprise!\"", marks: [['say', "should've", 'shoulda']] }],
  ['vm-w-didja-text', 'dating', 'tammy', 'cafe', 'Did you text him back yet, or are you making him sweat?',
    'もう彼に返信した？ それともじらしてるの？',
    'didja＝Did you。Can you の k は聞こえる',
    ['Did you', 'Can you', 'Could you'],
    tg(56, 'friend', 'literal', [], ['yod']),
    { tts: "Didja text him back yet, or are you makin' him sweat?", marks: [['say', 'Did you', 'didja'], g('making')] }],
  ['vm-w-wanna-dog', 'home', 'rosie', 'door', "Do you want to meet him? He's friendly. He just thinks he's a lap dog.",
    '会ってみる？ 人懐っこいよ。自分のことを小型犬だと思ってるだけ。',
    'wanna＝want to。hafta なら have to',
    ['want to', 'have to', 'get to'],
    tg(32, 'neighbour', 'literal', [], ['wanna']),
    { tts: "D'you wanna meet him? He's friendly. He just thinks he's a lap dog.", marks: [['say', 'Do you', "d'you"], ['say', 'want to', 'wanna']] }],
  ['vm-w-couldnta', 'family', 'goldie', 'street', "Honestly, we couldn't have planned today without your dad's spreadsheets.",
    '正直、お父さんの表計算がなかったら、今日の段取りは無理だったよ。',
    "couldn'ta＝couldn't have。n't の t が手がかり",
    ["couldn't have", "could've", "wouldn't have"],
    tg(54, 'partner', 'humour', [], ['contraction']),
    { tts: "Honestly, we couldn'ta planned today without your dad's spreadsheets.", marks: [['say', "couldn't have", "couldn'ta"]] }],
  ['vm-w-gotta-yamanote', 'tokyo', 'dom', 'platform', "I've got to switch to the Yamanote at Shinjuku. It's the green one, right?",
    '新宿で山手線に乗り換えなきゃ。緑のやつだよね？',
    'gotta＝have got to。forgot なら for が聞こえる',
    ["I've got to", 'I forgot to', "I'd like to"],
    tg(58, 'friend', 'literal', [], ['gotta']),
    { tts: "I gotta switch to the Yamanote at Shinjuku. It's the green one, right?", marks: [['say', "I've got to", 'I gotta']] }]
];

const M_NUM: readonly Row[] = [
  ['vm-n-book-tax', 'town', 'label', null, "The book's $24, and with tax that comes to $26.16. Do you need a bag?",
    '本は24ドルで、税込みで26ドル16セントです。袋はご入り用ですか？',
    'with tax の後が合計。twenty-six sixteen',
    ['$26.16', '$24.00', '$2.16'],
    tg(24, 'service', 'literal', [], ['numbers']),
    { ask: '税込みの 合計は？', focus: '$26.16', tts: "The book's twenty-four dollars, and with tax that comes to twenty-six sixteen. Do you need a bag?",
      marks: [['say', '$24', 'twenty-four dollars'], ['say', '$26.16', 'twenty-six sixteen']] }],
  ['vm-n-park', 'town', 'teddy', 'street', "The picnic pavilion's $75 for four hours, and the grill's another $20.",
    'ピクニック用の東屋は4時間で75ドル、グリルはさらに20ドルです。',
    'another＝さらに追加で。合計を計算',
    ['$95', '$75', '$80'],
    tg(24, 'service', 'literal', [], ['numbers']),
    { ask: '東屋と グリルで いくら？', tts: "The picnic pavilion's seventy-five for four hours, and the grill's another twenty.",
      marks: [['say', '$75', 'seventy-five'], ['say', '$20', 'twenty']] }],
  ['vm-n-recipe', 'family', 'pekoe', 'living', "Grandma's recipe says one and a half cups of flour, but that's for four people. You're feeding eight.",
    'おばあちゃんのレシピだと小麦粉1カップ半。でもそれは4人分。あなたは8人分作るんでしょ。',
    '4人分→8人分で倍。1.5×2',
    ['3カップ', '1.5カップ', '8カップ'],
    tg(35, 'partner', 'literal', ['phone'], ['numbers']),
    { ask: '小麦粉は なんカップ いる？' }],
  ['vm-n-niece', 'family', 'judy', 'living', 'My niece just turned 13, so apparently everything I do is embarrassing now.',
    'めいが13歳になったばかりで、どうやら私のやることは全部恥ずかしいらしい。',
    'thirTEEN は後ろに強勢。THIRty は前',
    ['13', '30', '16'],
    tg(57, 'friend', 'humour', [], ['numbers', 'teen-ty']),
    { ask: 'めいは なんさい？', focus: '13', tts: 'My niece just turned thirteen, so apparently everything I do is embarrassing now.', marks: [['say', '13', 'thirTEEN']] }],
  ['vm-n-halftime', 'event', 'bud', 'living', "We were down 17 to 10 at halftime, and now we're up 24 to 17!",
    'ハーフタイムでは17対10で負けてたのに、今は24対17で勝ってる！',
    'down＝負け、up＝勝ち。now の後が今の点',
    ['24-17', '17-10', '24-10'],
    tg(50, 'friend', 'literal', [], ['numbers']),
    { ask: 'いまの スコアは？', focus: '24 to 17', tts: "We were down seventeen to ten at halftime, and now we're up twenty-four to seventeen!",
      marks: [['say', '17 to 10', 'seventeen to ten'], ['say', '24 to 17', 'twenty-four to seventeen']] }],
  ['vm-n-address', 'social', 'bea', 'street', "It's 1630 Linden Avenue, the blue house. Not Linden Street, that's across town.",
    'リンデン・アベニュー1630番地、青い家だよ。リンデン・ストリートじゃないよ、それは町の反対側。',
    '番地は2桁ずつ。sixteen-thirty＝1630',
    ['1630', '1613', '630'],
    tg(54, 'friend', 'literal', ['phone'], ['numbers', 'teen-ty']),
    { ask: 'パーティーの 番地は？', focus: '1630', tts: "It's sixteen-thirty Linden Avenue, the blue house. Not Linden Street, that's across town.", marks: [['say', '1630', 'sixteen-thirty']] }],
  ['vm-n-konbini-lunch', 'tokyo', 'kid-cat', 'office', 'Lunch from the konbini was 780 yen. Back home, a sad sandwich is like twelve bucks.',
    'コンビニのお昼、780円だったよ。地元じゃ、しょぼいサンドイッチでも12ドルくらいするのに。',
    'seven hundred eighty＝780。twelve はドル',
    ['¥780', '¥718', '¥1,200'],
    tg(58, 'colleague', 'humour', [], ['numbers']),
    { ask: 'コンビニの お昼は いくら？', focus: '780 yen', tts: 'Lunch from the konbini was seven hundred eighty yen. Back home, a sad sandwich is like twelve bucks.',
      marks: [['say', '780', 'seven hundred eighty']] }]
];

const M_DROWS: readonly DRow[] = [
  {
    id: 'dvm-new-phone', fam: 'tech', type: 'gist', scene: 'living', ask: 'ゲームの きろくは どうなる？', focus: 'saved to your account',
    lines: [
      ['admiral', "Okay, it wants my old phone's passcode. Which I wrote down... somewhere.", 'よし、古い電話のパスコードを聞いてくる。書き留めたんだが…どこかに。'],
      ['poppy', "No problem, Grandpa. We'll skip that and move your photos from the cloud.", '大丈夫だよ、おじいちゃん。そこは飛ばして、写真はクラウドから移そう。'],
      ['admiral', 'Will I lose my high score in that word game?', 'あの単語ゲームのハイスコアは消えるのかい？'],
      ['poppy', "Nope. That's saved to your account. You're all set.", '消えないよ。アカウントに保存されてるから。これで準備OK。']
    ],
    choices: ["It'll carry over to the new phone.", "It's gone without the old passcode.", "It's only saved with the photos."],
    ja: '新しい電話にそのまま引き継がれる。', note: 'saved to your account＝アカウントに保存＝消えない',
    tags: tg(22, 'partner', 'literal', [], ['ellipsis'])
  },
  {
    id: 'dvm-locked-out', fam: 'tech', type: 'next', scene: 'office', focus: 'expires in ten minutes',
    lines: [
      ['lily', "Hi, I'm locked out of my email. I think I typed the wrong password, like, five times.", 'もしもし、メールにログインできなくなっちゃって。パスワードを5回くらい間違えたみたい。'],
      ['cj', "Happens all the time. I just sent a reset link to your phone. It expires in ten minutes.", 'よくあることですよ。いまリセット用のリンクを携帯に送りました。10分で期限切れになります。']
    ],
    choices: ["Got it. I'm opening it right now.", 'Could you send it in ten minutes instead?', 'No, it was five times, not ten.'],
    ja: 'わかりました。いますぐ開きます。', note: 'expires＝期限が切れる。すぐ開くのが正解',
    tags: tg(22, 'colleague', 'literal', ['phone'], ['numbers'])
  },
  {
    id: 'dvm-first-date', fam: 'dating', type: 'gist', scene: 'cafe', ask: 'らいしゅう ブランチを するのは？', focus: 'She and I',
    lines: [
      ['katt', 'So how was the date? I want every detail.', 'で、デートどうだった？ ぜんぶ聞かせて。'],
      ['gayle', 'Well, it turned out to be his mom\'s birthday dinner. So I met his whole family.', 'それがね、彼のお母さんの誕生日ディナーだったの。だから家族全員に会った。'],
      ['katt', 'On a first date? Oh no.', '初デートで？ うわあ。'],
      ['gayle', "Honestly? His mom was great. We're getting brunch next week. She and I.", '正直ね、お母さんが最高だった。来週ブランチするの。お母さんと私で。']
    ],
    choices: ["She's having brunch with his mom.", "She's having brunch with him.", 'His mom is coming to her birthday.'],
    ja: '彼のお母さんとブランチする。', note: 'She and I の She は彼の母。彼ではない',
    tags: tg(56, 'friend', 'humour', ['cafe'])
  },
  {
    id: 'dvm-ac-out', fam: 'home', type: 'next', scene: 'living', focus: 'is Thursday',
    lines: [
      ['teddy', "The AC's making that clicking noise again, and it's ninety-two degrees out.", 'エアコンがまたカチカチ鳴ってる。外は92度（約33℃）だよ。',
        "The AC's makin' that clickin' noise again, and it's ninety-two degrees out.", [g('making'), g('clicking')]],
      ['pashmina', 'I called the repair place. The earliest they can come is Thursday.', '修理屋さんに電話した。いちばん早くて木曜だって。'],
      ['teddy', "Thursday? We'll be soup by Thursday.", '木曜？ 木曜までに溶けちゃうよ。']
    ],
    choices: ["I know. Let's go buy a fan tonight.", "Great, Thursday's supposed to be cool.", "Sure, I'll make soup for dinner."],
    ja: 'だよね。今夜、扇風機を買いに行こう。', note: "We'll be soup＝暑さで溶ける、の冗談",
    tags: tg(31, 'friend', 'humour', [], ['idiom'])
  },
  {
    id: 'dvm-voice-memo', fam: 'social', type: 'gist', scene: 'street', ask: 'デザートは どうなる？', focus: 'store-bought',
    lines: [
      ['tia', "Voice memo for the group: dinner's moved to Saturday, same place. You're on dessert, okay?", 'グループにボイスメモ。ごはんは土曜に変更、場所は同じ。デザートはあなた担当ね。'],
      ['flick', "Love it. But I'm bringing store-bought cookies. Nobody wants my baking again.", 'いいね。でも買ったクッキーを持ってく。もう誰も僕の手作りはいらないでしょ。'],
      ['tia', 'Honestly? Fair.', '正直、それが正解。']
    ],
    choices: ["He'll bring cookies from a store.", "He'll bake cookies himself.", "Dinner's canceled this Saturday."],
    ja: 'お店で買ったクッキーを持ってくる。', note: 'store-bought＝市販の。手作りではない',
    tags: tg(50, 'friend', 'humour', ['voicemail'])
  },
  {
    id: 'dvm-bento', fam: 'tokyo', type: 'next', scene: 'street', focus: 'heated up',
    lines: [
      ['kid-cat', 'Wait, the cashier asked me something. Was it about my point card?', '待って、店員さんに何か聞かれた。ポイントカードのこと？'],
      ['nana', 'She asked if you want your bento heated up. Just say "onegai shimasu."', 'お弁当を温めるか聞いてたの。「お願いします」って言えばいいよ。']
    ],
    choices: ['Onegai shimasu! I love a hot lunch.', "No, I don't have a point card.", "Sure, I'll heat it up at home."],
    ja: 'お願いします！ 温かいお昼、最高。', note: 'heated up＝温める。ポイントカードの話ではない',
    tags: tg(58, 'friend', 'literal', ['street'])
  }
];

// ==== やま (level 6) ==================================================================================================

const Y_REPLY: readonly Row[] = [
  ['vy-r-toast', 'event', 'henry', 'living', "Are you the one giving the toast? You look like you're about to pass out.",
    'スピーチするの、あなた？ 今にも倒れそうな顔してるけど。 →「そんなにバレてる？ 手がほんとに震えてるんだ。」',
    'toast＝乾杯のスピーチ。パンではない',
    ["Is it that obvious? My hands are literally shaking.", "No thanks, I'm not drinking tonight.", "Sure, I'd love some toast."],
    tg(54, 'stranger', 'literal', [], ['idiom']),
    { tts: "Are you the one givin' the toast? You look like you're about ta pass out.", marks: [g('giving'), ['say', 'to', 'ta']] }],
  ['vy-r-museum', 'town', 'octavian', null, "Photos are fine, but if your flash goes off, I'm legally required to give you a very long lecture.",
    '写真はかまいませんが、フラッシュが光ったら、法律上とても長いお説教をしなければなりません。 →「了解。フラッシュは正式にオフです。」',
    '冗談の脅し。フラッシュ禁止が本題',
    ['Noted. Flash is officially off.', 'Great, I love a long lecture.', 'Is the lecture included in the ticket?'],
    tg(43, 'service', 'humour')],
  ['vy-r-portugal', 'social', 'reneigh', 'cafe', 'Okay, I want the full download on Portugal. Was it as dreamy as your stories made it look?',
    'で、ポルトガルの話をぜんぶ聞かせて。ストーリーで見たとおり夢みたいだった？ →「だいたいね。食あたりのことはストーリーに載せてないけど。」',
    'full download＝全部話して。stories＝SNS投稿',
    ['Mostly. The stories left out the food poisoning.', "I haven't downloaded the photos yet.", 'Yeah, I posted a story about it.'],
    tg(57, 'friend', 'literal', ['cafe'], ['idiom'])],
  ['vy-r-second-date', 'dating', 'kicks', 'street', 'So, second date: mini golf, or that wine bar with the weird jazz?',
    'で、2回目のデートは？ ミニゴルフ？ それとも変なジャズのワインバー？ →「ミニゴルフ。気楽だし、なぜか得意なんだ。」',
    'A or B の質問。second date＝2回目のデート',
    ["Mini golf. Less pressure, and I'm weirdly good at it.", 'The second one went pretty well, thanks.', "I didn't know mini golf had jazz."],
    tg(56, 'friend', 'literal', ['street'])],
  ['vy-r-biscuit', 'home', 'shep', 'door', "Sorry about Biscuit. He's not aggressive. He just has a lot of opinions about your mail carrier.",
    'ビスケットがごめんね。攻撃的じゃないんだ。ただ、君のとこの郵便屋さんに言いたいことが山ほどあるだけで。 →「はは、大丈夫。あの人いつも遅いし、気持ちはわかる。」',
    'opinions＝吠える、の冗談。噛んではいない',
    ["Ha, it's fine. Honestly, the guy's always late anyway.", 'Oh no, did he bite the mail carrier?', 'Should I call animal control?'],
    tg(32, 'neighbour', 'humour')],
  ['vy-r-bookstore', 'town', 'label', null, "If you liked that one, you'll either love this or throw it across the room. No in-between.",
    'あれが好きなら、これは大好きになるか、部屋の向こうに投げつけるかのどっちか。中間はないよ。 →「買います。心を揺さぶられたい気分なので。」',
    'either A or B＝極端な二択。中間なし',
    ['Sold. I need something that makes me feel things.', "I'll take the one in between, then.", 'Can I return it if I throw it?'],
    tg(24, 'service', 'humour')],
  ['vy-r-in-laws', 'family', 'goldie', 'living', "Heads up: my mom's going to ask when we're having kids. Within five minutes. I'd put money on it.",
    '先に言っとくね。うちの母、子どもはいつかって聞いてくるから。5分以内に。賭けてもいい。 →「じゃあ『犬を飼ったばかり』のスピーチを用意しとく。」',
    "I'd put money on it＝賭けてもいい（確実）",
    ['Then I\'ll have my "we just got a dog" speech ready.', "I'd put money on five kids, too.", 'Sure, I can lend her some money.'],
    tg(36, 'partner', 'humour', [], ['gonna', 'idiom']),
    { tts: "Heads up: my mom's gonna ask when we're havin' kids. Within five minutes. I'd put money on it.", marks: [['say', 'going to', 'gonna'], g('having')] }],
  ['vy-r-chopsticks', 'tokyo', 'lucky', 'office', 'Is it weird if I bring my own chopsticks to the izakaya, or is that a whole thing here?',
    '居酒屋にマイ箸を持っていくのって変かな？ それともこっちじゃ何か特別な意味がある？ →「全然変じゃないよ。持ち歩いてる人、けっこういるし。」',
    'a whole thing＝大ごと・特別な意味がある',
    ['Not weird at all. Plenty of people carry their own.', 'Yeah, the izakaya has a whole menu.', "No, they don't sell chopsticks there."],
    tg(58, 'colleague', 'literal', [], ['idiom'])]
];

const Y_MEAN: readonly Row[] = [
  ['vy-m-wedding-food', 'event', 'sylvia', 'living', 'The ceremony was gorgeous. And the food was... definitely food.',
    '式はすごく素敵だった。で、料理は…まあ、間違いなく料理だった。 → 料理はおいしくなかった。',
    '褒め言葉が見つからない間（ま）。皮肉',
    ["The food wasn't very good.", 'The food was the best part.', 'There was far too much food.'],
    tg(54, 'friend', 'sarcasm', [], ['ellipsis', 'intonation'])],
  ['vy-m-slow-season', 'social', 'tangy', 'cafe', "Okay, the first season's slow. Like, painfully slow. But trust me, episode six changes everything.",
    'たしかに、シーズン1は展開が遅い。ほんと、つらいくらい。でも信じて、第6話で全部変わるから。 → 最初は我慢して見続ける価値がある。',
    'But trust me の後が本音。勧めている',
    ["It's worth pushing through the slow start.", 'You can skip the whole first season.', 'The show goes downhill after episode six.'],
    tg(52, 'friend', 'indirect', ['cafe'])],
  ['vy-m-drums', 'home', 'frett', 'living', 'Love that you took up the drums. Love it. Truly. At seven a.m. on a Sunday.',
    'ドラムを始めたの、最高だと思うよ。本当に。心から。日曜の朝7時でなければね。 → 早朝のドラムに怒っている。',
    'Love it の繰り返し＋時間で皮肉',
    ["He's annoyed about the early-morning drumming.", 'He wants to join you on the drums.', 'He thinks Sunday mornings are a good time to practice.'],
    tg(32, 'friend', 'sarcasm', [], ['intonation'])],
  ['vy-m-few-boxes', 'home', 'zucker', 'living', 'Oh, just a few boxes? That\'s what everybody says. Right before the fourteenth box.',
    'え、箱はちょっとだけ？ みんなそう言うんだよね。14箱目が出てくる直前に。 → 箱はきっと言っているよりずっと多い。',
    'Right before～＝そう言った直後に増える',
    ['He thinks there will be far more boxes than you say.', "He's sure fourteen boxes will be enough.", "He'll only help with a few of the boxes."],
    tg(33, 'friend', 'humour')],
  ['vy-m-on-paper', 'dating', 'bea', 'cafe', "He's great on paper. So were my last three exes.",
    '彼、条件的には完璧。元カレ3人もそうだったけどね。 → 今回もうまくいくとは思えない。',
    'on paper＝書類上は。実際は別、の含み',
    ["She doubts it'll work out any better this time.", "She thinks he's finally the perfect match.", "She's still close with her three exes."],
    tg(56, 'friend', 'sarcasm', ['cafe'], ['idiom'])],
  ['vy-m-assume-alive', 'family', 'pekoe', 'living', "No, no, don't worry about calling. I'll just assume you're alive.",
    'いいのいいの、電話なんか気にしないで。生きてるって思っとくから。 → もっと電話してほしい（遠回しに責めている）。',
    '気にしないで＋皮肉＝罪悪感を誘う',
    ['She wants you to call more often.', "She really doesn't mind if you never call.", 'She thinks something bad has happened to you.'],
    tg(36, 'partner', 'sarcasm', ['phone'], ['intonation'])],
  ['vy-m-back-up', 'tech', 'jacques', 'living', "Sure, I can set up your new phone. Did you back up the old one? ...You didn't back up the old one.",
    'いいよ、新しい電話の設定してあげる。古いほうのバックアップは取った？ …取ってないんだね。 → バックアップがないから、面倒なことになる。',
    '問いの後の言い直し＝表情で察した',
    ["He can tell you didn't back it up, so this will be harder.", "He's sure you already backed up the phone.", "He doesn't know how to set up phones."],
    tg(22, 'friend', 'indirect', [], ['ellipsis', 'intonation'])],
  ['vy-m-sardine', 'tokyo', 'stitches', 'platform', 'The 8:15 Chuo Line? Sure, if you enjoy being a sardine.',
    '8時15分の中央線？ いいんじゃない、イワシの缶詰になりたいなら。 → その電車はとても混んでいるからやめたほうがいい。',
    'sardine＝すし詰め。Sure は皮肉',
    ["That train is packed, so he'd skip it.", "He thinks it's a great train to take.", 'The train sells fish in the morning.'],
    tg(58, 'friend', 'sarcasm', ['station'], ['numbers']),
    { tts: "The eight-fifteen Chuo Line? Sure, if you enjoy bein' a sardine.", marks: [['say', '8:15', 'eight-fifteen'], g('being')] }]
];

const Y_WORD: readonly Row[] = [
  ['vy-w-oughta', 'home', 'wolfgang', 'living', 'We ought to label the boxes this time. Last move, the forks ended up in the bathroom.',
    '今回は箱にラベルを貼ったほうがいいね。前の引っ越しじゃ、フォークが風呂場から出てきたし。',
    'oughta＝ought to（〜すべき）',
    ['ought to', 'need to', "don't have to"],
    tg(33, 'partner', 'humour', [], ['weak-form']),
    { tts: 'We oughta label the boxes this time. Last move, the forks ended up in the bathroom.', marks: [['say', 'ought to', 'oughta']] }],
  ['vy-w-was-gonna', 'event', 'katt', 'street', 'I was going to get tickets, but they sold out in, like, four minutes.',
    'チケット取ろうと思ってたのに、4分くらいで売り切れちゃった。',
    'was gonna＝〜するつもりだった（できず）',
    ['I was going to', 'I tried to', 'I wanted to'],
    tg(48, 'friend', 'literal', [], ['gonna']),
    { tts: 'I was gonna get tickets, but they sold out in, like, four minutes.', marks: [['say', 'going to', 'gonna']] }],
  ['vy-w-dontcha', 'dating', 'beau', 'cafe', "Why don't you just ask her out? Worst case, she says no and you move on.",
    'さっさとデートに誘えばいいじゃん。最悪、断られて次に行くだけだよ。',
    "dontcha＝don't you。didn't なら過去の話",
    ["Why don't you", "Why didn't you", "Why won't you"],
    tg(56, 'friend', 'indirect', ['cafe'], ['yod', 'contraction']),
    { tts: "Whydontcha just ask her out? Worst case, she says no an' you move on.", marks: [['say', "Why don't you", 'whydontcha'], ['say', 'and', "an'"]] }],
  ['vy-w-gimme', 'tech', 'bob', 'living', "Give me your phone. I'll turn off the thing that keeps autocorrecting your name.",
    '携帯貸して。名前を勝手に変換しちゃう機能、オフにしてあげる。',
    'gimme＝Give me。get なら t が聞こえる',
    ['Give me', 'Give him', 'Get me'],
    tg(35, 'partner', 'literal', [], ['contraction']),
    { tts: "Gimme your phone. I'll turn off the thing that keeps autocorrectin' your name.", marks: [['say', 'Give me', 'gimme'], g('autocorrecting')] }],
  ['vy-w-hafta-aunt', 'family', 'portia', 'living', "We have to leave by six if we're doing dinner at your aunt's. She locks the door at seven. Literally.",
    'おばさんの家で夕飯なら6時には出ないと。7時に鍵かけちゃうから。文字どおり。',
    'hafta＝have to。had to なら過去',
    ['We have to', 'We had to', "We'd have to"],
    tg(36, 'partner', 'humour', [], ['weak-form']),
    { tts: "We hafta leave by six if we're doin' dinner at your aunt's. She locks the door at seven. Literally.", marks: [['say', 'have to', 'hafta'], g('doing')] }],
  ['vy-w-sposta', 'town', 'francine', null, "We're supposed to be quiet in here, but this book is making me laugh out loud.",
    'ここでは静かにしてなきゃいけないのに、この本、声出して笑っちゃう。',
    'sposta＝supposed to（〜することになっている）',
    ["We're supposed to", 'We used to', "We're going to"],
    tg(24, 'friend', 'humour', [], ['weak-form']),
    { tts: "We're sposta be quiet in here, but this book is makin' me laugh out loud.", marks: [['say', 'supposed to', 'sposta'], g('making')] }],
  ['vy-w-couldja', 'tokyo', 'sterling', 'platform', "Could you show me how to top up my Suica? The screen's stuck in Japanese.",
    'Suicaのチャージのやり方、教えてくれない？ 画面が日本語のままで。',
    'couldja＝Could you。can なら短く強い',
    ['Could you', 'Can you', 'Would you'],
    tg(58, 'friend', 'literal', [], ['yod']),
    { tts: "Couldja show me how ta top up my Suica? The screen's stuck in Japanese.", marks: [['say', 'Could you', 'couldja'], ['say', 'to', 'ta']] }]
];

const Y_NUM: readonly Row[] = [
  ['vy-n-rsvp', 'event', 'tia', 'living', "We've got 140 yeses, 12 maybes, and my uncle, who counts as three.",
    '出席の返事が140、未定が12、それからうちのおじ。おじは3人分に数えて。',
    'a hundred and forty＝140。maybes は未定',
    ['140', '112', '14'],
    tg(54, 'friend', 'humour', [], ['numbers']),
    { ask: '「出席」の 返事は なん人？', focus: '140', tts: "We've got a hundred and forty yeses, twelve maybes, and my uncle, who counts as three.",
      marks: [['say', '140', 'a hundred and forty'], ['say', '12', 'twelve']] }],
  ['vy-n-gym', 'town', 'kicks', null, "It's $49 a month, or $480 if you pay for the year up front.",
    '月49ドル、または1年分を前払いなら480ドルです。',
    'four-eighty＝480。月額×12（588）ではない',
    ['$480', '$588', '$49'],
    tg(17, 'service', 'literal', [], ['numbers']),
    { ask: '1年分 前払いだと？', focus: '$480', tts: "It's forty-nine a month, or four-eighty if you pay for the year up front.",
      marks: [['say', '$49', 'forty-nine'], ['say', '$480', 'four-eighty']] }],
  ['vy-n-movers', 'home', 'ken', 'living', 'Base price is $1,850, plus $50 for each flight of stairs. You said two flights?',
    '基本料金は1,850ドル、階段1階分ごとに50ドル追加です。2階分でしたよね？',
    '1850＋50×2。eighteen-fifty＝1,850',
    ['$1,950', '$1,850', '$1,900'],
    tg(33, 'service', 'literal', ['phone'], ['numbers']),
    { ask: '合計は いくら？', tts: 'Base price is eighteen-fifty, plus fifty for each flight of stairs. You said two flights?',
      marks: [['say', '$1,850', 'eighteen-fifty'], ['say', '$50', 'fifty']] }],
  ['vy-n-grand-slam', 'social', 'kabuki', 'street', 'Bottom of the ninth, two outs, down by three, and he hits a grand slam. Final score, 7 to 6.',
    '9回裏、2アウト、3点差で負けてたのに、満塁ホームラン。最終スコアは7対6。',
    'Final score の後が答え。down by three は途中',
    ['7-6', '6-3', '7-3'],
    tg(57, 'friend', 'literal', [], ['numbers']),
    { ask: '最終スコアは？', focus: '7 to 6', tts: 'Bottom of the ninth, two outs, down by three, and he hits a grand slam. Final score, seven to six.',
      marks: [['say', '7 to 6', 'seven to six']] }],
  ['vy-n-grandpa', 'family', 'maple', 'living', "Grandpa says he's 74, but he's been 74 for, like, three birthdays now.",
    'おじいちゃんは74歳って言うけど、もう3回くらい誕生日を74歳のまま迎えてるの。',
    '74のまま誕生日3回＝実際は77',
    ['77', '74', '71'],
    tg(57, 'friend', 'humour', [], ['numbers']),
    { ask: 'おじいさんは 本当は なんさい？', tts: "Grandpa says he's seventy-four, but he's been seventy-four for, like, three birthdays now.", marks: [['say', '74', 'seventy-four']] }],
  ['vy-n-phone-plan', 'tech', 'lopez', null, "The new phone's $999, or $41.62 a month for 24 months.",
    '新しい電話は999ドル、または24か月払いで月41ドル62セントです。',
    'forty-one sixty-two。24 は回数',
    ['$41.62', '$41.26', '$24.00'],
    tg(22, 'service', 'literal', [], ['numbers']),
    { ask: '月々の 支払いは？', focus: '$41.62', tts: "The new phone's nine ninety-nine, or forty-one sixty-two a month for twenty-four months.",
      marks: [['say', '$999', 'nine ninety-nine'], ['say', '$41.62', 'forty-one sixty-two'], ['say', '24', 'twenty-four']] }],
  ['vy-n-square-meters', 'tokyo', 'dom', 'office', "My place is 28 square meters. That's, what, three hundred square feet? My closet back home was bigger.",
    'うちの部屋、28平米なんだ。えーと、300平方フィートくらい？ 地元のクローゼットのほうが広かったよ。',
    'twenty-eight は平米。three hundred はフィート',
    ['28', '38', '300'],
    tg(58, 'colleague', 'humour', [], ['numbers']),
    { ask: '部屋は なん平米？', focus: '28 square meters', tts: "My place is twenty-eight square meters. That's, what, three hundred square feet? My closet back home was bigger.",
      marks: [['say', '28', 'twenty-eight']] }]
];

const Y_DROWS: readonly DRow[] = [
  {
    id: 'dvy-toast', fam: 'event', type: 'gist', scene: 'living', ask: 'スピーチで 話すのは？', focus: 'Thanksgiving',
    lines: [
      ['wolfgang', 'So, I promised the bride I would not tell the Vegas story.', 'さて、花嫁にはラスベガスの話はしないと約束しました。'],
      ['tammy', 'Thank you!', 'ありがとう！'],
      ['wolfgang', "Instead, here's the year the groom cooked Thanksgiving. The fire department's here tonight, actually. Hi, guys!", '代わりに、新郎が感謝祭の料理をした年の話を。実は今夜、消防隊の方々も来てます。どうもー！']
    ],
    choices: ["The groom's Thanksgiving cooking disaster.", 'What happened on the trip to Vegas.', 'How the bride met a firefighter.'],
    ja: '新郎の感謝祭の料理の大失敗。', note: 'Instead の後が本題。消防隊＝火事を起こした',
    tags: tg(54, 'friend', 'humour')
  },
  {
    id: 'dvy-almond-milk', fam: 'home', type: 'next', scene: 'cafe', focus: 'So obviously I drank some',
    lines: [
      ['katt', 'My roommate labeled her almond milk. With her name, the date and a drawing of an eye.', 'ルームメイトがアーモンドミルクにラベル貼ったの。名前と日付と、目の絵つきで。'],
      ['beau', "An eye? Okay, that's a threat.", '目？ それ、もう脅しじゃん。'],
      ['katt', 'Right? So obviously I drank some.', 'でしょ？ だから当然ちょっと飲んだ。']
    ],
    choices: ["Bold move. She's going to know.", "Aw, that's sweet of her to share.", "Maybe she's just into drawing."],
    ja: '大胆だね。絶対バレるよ。', note: 'obviously＝当然。反抗して飲んだ冗談',
    tags: tg(57, 'friend', 'humour', ['cafe'])
  },
  {
    id: 'dvy-same-car', fam: 'social', type: 'gist', scene: 'street', ask: 'わかったことは？', focus: 'Since when',
    lines: [
      ['stitches', 'Did you see Tyler and Jenna at the barbecue? They showed up in the same car.', 'バーベキューのタイラーとジェナ見た？ 同じ車で来てたよ。'],
      ['molly', 'They carpool. They live on the same street.', '相乗りしてるのよ。同じ通りに住んでるから。'],
      ['stitches', 'Since when does Jenna live on Elm Street?', 'ジェナっていつからエルム通りに住んでるの？'],
      ['molly', 'Since... oh. Oh!', 'いつからって…あ。あっ！']
    ],
    choices: ['Jenna seems to have moved in with Tyler.', 'Jenna and Tyler always carpool to work.', 'Tyler is selling his car to Jenna.'],
    ja: 'ジェナはタイラーと同居しているらしい。', note: 'Since when…?＝いつから？ 気づいた瞬間の Oh!',
    tags: tg(53, 'friend', 'indirect', ['street'], ['ellipsis'])
  },
  {
    id: 'dvy-dumpster', fam: 'town', type: 'next', scene: null, focus: "Please don't lean on the frame",
    lines: [
      ['admiral', 'This painting was almost thrown out in 1962. Someone found it behind a dumpster.', 'この絵は1962年に捨てられかけました。誰かがゴミ箱の裏で見つけたんです。',
        'This painting was almost thrown out in nineteen sixty-two. Someone found it behind a dumpster.', [['say', '1962', 'nineteen sixty-two']]],
      ['francine', 'Behind a dumpster? So what is it worth now?', 'ゴミ箱の裏で？ で、今はいくらの価値が？'],
      ['admiral', "Let's just say more than this building. Please don't lean on the frame.", 'この建物より高い、とだけ。額縁に寄りかからないでください。']
    ],
    choices: ['Oh! Sorry. Stepping back.', 'And how much is the building worth?', "I'll check behind my dumpster, then."],
    ja: 'あっ、すみません。下がります。', note: "Please don't lean＝注意された。まず謝る",
    tags: tg(43, 'service', 'humour', [], ['numbers'])
  },
  {
    id: 'dvy-ceiling', fam: 'family', type: 'gist', scene: 'living', ask: 'どういう じょうきょう？', focus: 'upside down',
    lines: [
      ['bob', 'Can you see me? I can see your ceiling. Lovely ceiling.', '見えるかい？ こっちは天井が見えるよ。いい天井だね。'],
      ['agnes', "Dad, you're holding the phone upside down again.", 'お父さん、また電話を逆さまに持ってるよ。'],
      ['bob', "Ah. Well, now I can see your face. And your mother's thumb.", 'おっと。よし、顔が見えた。それとお母さんの親指も。']
    ],
    choices: ['Her dad is struggling with a video call.', 'Her dad is painting her ceiling.', 'Her mom hurt her thumb.'],
    ja: 'お父さんがビデオ通話に苦戦している。', note: 'upside down＝逆さま。天井が映っていた',
    tags: tg(39, 'partner', 'humour', ['video'])
  },
  {
    id: 'dvy-slippers', fam: 'tokyo', type: 'next', scene: 'door', focus: 'bathroom slippers',
    lines: [
      ['kabuki', "Quick question. Everyone left their shoes at Kenji's front door. Do I...?", 'ちょっと質問。みんなケンジの家の玄関で靴を脱いでたけど、僕も…？'],
      ['judy', "Yep. Slippers are in the cabinet. Just don't wear them into the bathroom.", 'そう。スリッパは棚の中。ただ、トイレには履いていかないでね。'],
      ['kabuki', 'Wait, there are separate bathroom slippers?', '待って、トイレ用のスリッパが別にあるの？']
    ],
    choices: ['Yep. Different room, different slippers.', 'No, just keep your shoes on.', "The cabinet's in the bathroom."],
    ja: 'そう。部屋が違えばスリッパも違うの。', note: 'separate＝別の。トイレ専用スリッパ',
    tags: tg(58, 'friend', 'literal', [], ['ellipsis'])
  }
];

const MORI = build(4, { reply: M_REPLY, mean: M_MEAN, word: M_WORD, num: M_NUM }, M_DROWS);
const YAMA = build(6, { reply: Y_REPLY, mean: Y_MEAN, word: Y_WORD, num: Y_NUM }, Y_DROWS);

export const MORI_ITEMS: readonly Item[] = MORI.items;
export const MORI_DIALOGUES: readonly Item[] = MORI.dialogues;
export const MORI_FAMILY = MORI.family;
export const YAMA_ITEMS: readonly Item[] = YAMA.items;
export const YAMA_DIALOGUES: readonly Item[] = YAMA.dialogues;
export const YAMA_FAMILY = YAMA.family;
