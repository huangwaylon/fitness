// ききみみ クイズ: stage ほし (S4, C1; docs/curriculum.md §3 "S4 ほし": podcasts, news, lectures and debates on
// unfamiliar topics; infer stance; follow argument structure). Content sprint 2026-11-06 (track D, Broadcast, with
// some Work and People). Written by a former BBC/NPR producer and EAP lecturer's eye: news-reader density, fast
// co-hosts, signposting in lectures, hedged academic claims, the speaker's stance (certainty, irony, concession),
// cultural references and wordplay, dense numbers. Level 7 (content/index.ts folds it into the bank; its villagers'
// voices are in bank4.ts CAST).
//   Families (FAMILY): news bulletins and headlines (evergreen, no real politicians), radio and podcast talk, mini-
// lectures, documentary narration, debates and panels, interviews, TED-style talks, cultural references and
// wordplay, dense statistics, and stance.
//   Types: the existing ones. `mean` and `gist` run to 2-4 sentences here. A single-clip `gist` asks what a bulletin or
// a talk is mainly about; a single-clip `next` asks what the same speaker says next (discourse prediction from the
// signposting: "The first…", "And then…", "Make the most of it, though…"). The dialogues (interviews, debates, co-hosts,
// 3-4 lines) follow dialogues.ts's shape.
//   Channels: radio, podcasts and TV are heard with NO channel and no scene (the plain stage): PaFrame's horn and the
//   mix's PA reverb mean a station or airport tannoy, which a newsreader isn't. Real tannoys are `pa`, a radio
//   call-in's bad line `phone`, a remote panel or a podcast recorded over a call `video`.
//   `en` is shown (UK spelling for UK and AU voices), `tts` is spoken when it differs (§9: every number written out,
//   reductions spelled as said). `note` is the trap (≤ 40 字).
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Accent, CastId, Channel, Item, ItemType, Level, Line, SceneId, SoundMark, Tags } from '../bank.ts';
import { CAST } from '../bank4.ts';

/** ほし's level (docs/kikimimi.md "Levels 6 and 7"): 7, above やま (6). */
const HOSHI_LV: Level = 7;

export type Family = 'news' | 'radio' | 'lecture' | 'documentary' | 'debate' | 'interview' | 'talk' | 'culture' | 'stats' | 'stance';

const MEAN_ASK = 'つまり、どういうこと？';
const NEXT_ASK = 'つぎの ひとことは？';

const castOf = (who: RosterId): CastId => {
  const cast = CAST[who];
  if (!cast) throw new Error(`kikimimi: ${who} has no cast voice`);
  return cast;
};

const tg = (seed: number, register: Tags['register'], pragmatic: Tags['pragmatic'], conditions?: Tags['conditions'], features?: Tags['features']): Tags =>
  ({ seed, register, pragmatic, ...(conditions?.length && { conditions }), ...(features?.length && { features }) });

type Extra = { tts?: string; focus?: string; ask?: string; scene?: SceneId; channel?: Channel };
type Row = readonly [type: Exclude<ItemType, 'pic'>, id: string, speaker: RosterId, en: string, ja: string, note: string, choices: readonly string[], tags: Tags, extra?: Extra];

// ---- sound marks: every clip with a `tts` (staging.ts's rules: the number as said, the reductions, a swallowed g) ----

const g = (at: string): SoundMark => ['drop', at, 'g'];
/** clip id (an item's, or a dialogue line's `<item>-<n>`) → its sound marks. */
const MARKS: Readonly<Record<string, readonly SoundMark[]>> = {
  'ho-rate-hold': [['say', '4.25%', 'four and a quarter percent']],
  'ho-rail-strike': [['say', '40%', 'FORty per cent'], ['say', '7 p.m.', 'seven p.m.']],
  'ho-heat-record': [['say', '47', 'forty-seven'], ['say', '1939', 'nineteen thirty-nine']],
  'ho-quake': [['say', '6.3', 'six point three'], ['say', '4:17', 'four seventeen'], ['say', '60', 'SIXty']],
  'ho-manuscript': [['say', '900-year-old', 'nine-hundred-year-old'], ['say', '1970s', 'nineteen seventies']],
  'ho-typhoon': [['say', '150', 'a hundred and fifty'], ['stress', 'relative']],
  'ho-pod-tangent': [['say', 'going to', 'gonna'], ['say', 'because', "'cause"], ['say', 'and', "an'"]],
  'ho-pod-downloads': [['say', '980,000', 'nine hundred and eighty thousand'], g('counting')],
  'ho-cohost-recap': [['say', 'because', "'cause"], ['stress', 'twenty-five']],
  'ho-traffic-m1': [g('heading'), ['say', 'M1', 'M one'], ['say', '12', 'twelve'], ['say', 'and', "an'"]],
  'ho-pod-wouldve': [['say', "would've", 'woulda']],
  'ho-wrap-up': [['say', 'going to have to', 'gonna hafta']],
  'ho-anchoring': [['say', '65', 'sixty-five'], ['say', 'UN', 'U N']],
  'ho-empire': [['say', 'AD 117', 'A D one seventeen']],
  'ho-city-growth': [['say', '1900', 'nineteen hundred'], ['say', '2050', 'twenty fifty']],
  'ho-whale-heart': [['say', '180', 'a hundred and eighty']],
  'ho-station-night': [['say', '1 a.m.', 'one a.m.']],
  'ho-one-sentence': [['say', 'going to', 'gonna']],
  'ho-school-street': [['say', '8 a.m.', 'eight a.m.']],
  'ho-knee': [['say', 'going to', 'gonna'], ['say', 'and', "'n'"], ['say', 'you', 'ya']],
  'ho-summit': [['say', '2 a.m.', 'two a.m.'], ['say', '11', 'eLEVen'], ['stress', '6 7']],
  'ho-catch-22': [['say', 'Catch-22', 'Catch twenty-two']],
  'ho-fare': [['say', '1st', 'first'], ['say', '$2.75', 'two seventy-five'], ['say', '$2.90', 'two ninety']],
  'ho-unemployment': [['say', '4.3%', 'four point three per cent'], ['say', '4.1%', 'four point one'], ['say', '5.2%', 'five point two']],
  'ho-survey': [['say', '62%', 'sixty-two percent'], ['say', '26%', 'twenty-six percent']],
  'ho-one-in-three': [['say', '34%', 'thirty-four per cent']],
  'ho-per-person': [['say', '£1.2 billion', 'one point two billion pounds'], ['say', '£18', 'eighteen pounds']],
  'ho-population': [['say', '0.4%', 'zero point four percent'], ['say', '2.3 million', 'two point three million']],
  'ho-marathon': [['say', '40', 'FORty'], ['say', '90', 'NINEty']],
  'ho-rounding': [['say', '1.8%', 'one point eight per cent']],
  'ho-rain-warning': [['say', '120', 'a hundred and twenty'], ['say', '24', 'twenty-four']],
  'dho-nine-years-1': [['say', 'and', "an'"]],
  'dho-let-me-finish-3': [['say', 'going to', 'gonna']],
  'dho-reported-crime-1': [['say', '11%', 'eLEVen per cent']],
  'dho-fewer-dates-2': [['say', '1066', 'ten sixty-six']]
};

const family: Record<string, Family> = {};

const item = (fam: Family) => ([type, id, speaker, en, ja, note, choices, tags, x = {}]: Row): Item => {
  const cast = castOf(speaker);
  family[id] = fam;
  const focus = type === 'word' ? choices[0] : x.focus;
  const ask = x.ask ?? (type === 'mean' ? MEAN_ASK : type === 'next' ? NEXT_ASK : undefined);
  return {
    id, lv: HOSHI_LV, type, en, ja, speaker, voice: cast.slice(0, 2) as Accent, cast, choices, answer: 0, note, tags,
    ...(x.tts && { tts: x.tts }), ...(focus && { focus }), ...(ask && { ask }), ...(x.scene && { scene: x.scene }), ...(x.channel && { channel: x.channel }),
    ...(MARKS[id] && { marks: MARKS[id] })
  };
};

// ---- news bulletins and headlines -----------------------------------------------------------------------------------

const NEWS: readonly Row[] = [
  ['num', 'ho-rate-hold', 'lopez', 'The central bank held rates at 4.25% today, but two of its nine members voted for a cut, up from one last month.',
    '中央銀行は本日、金利を4.25%に据え置きましたが、委員9人のうち2人が利下げに票を投じました。先月は1人でした。',
    'up from one＝先月は1人。今回の人数を聞く',
    ['2人', '1人', '9人'],
    tg(62, 'broadcast', 'literal', [], ['numbers']),
    { ask: '利下げに 票を 投じたのは 何人？', focus: 'two of its nine members', tts: 'The central bank held rates at four and a quarter percent today, but two of its nine members voted for a cut, up from one last month.' }],
  ['num', 'ho-rail-strike', 'kidd', 'Rail services will run at roughly 40% of normal on Thursday, and not at all after 7 p.m., the operator has warned.',
    '木曜の鉄道は通常のおよそ40%の運行で、午後7時以降は全面運休になると、運行会社が警告しています。',
    'FORty と fourTEEN の強勢。7は時刻の話',
    ['40%', '14%', '7%'],
    tg(62, 'broadcast', 'literal', [], ['teen-ty', 'numbers']),
    { ask: '木曜の 運行は 通常の 何％？', focus: '40%', tts: 'Rail services will run at roughly forty per cent of normal on Thursday, and not at all after seven p.m., the operator has warned.' }],
  ['gist', 'ho-heat-record', 'phoebe', 'Temperatures in parts of western Sydney topped 47 degrees yesterday, the highest since records began in 1939. Hospitals reported a surge in heat-related admissions.',
    '昨日、シドニー西部の一部で気温が47度を超え、1939年の観測開始以来の最高となりました。病院では熱中症などによる入院が急増しました。',
    '1939年は観測開始の年。火事や事件の年ではない',
    ['A record heatwave and its effect on hospitals.', 'A fire that started in 1939.', 'Hospitals running out of beds in winter.'],
    tg(60, 'broadcast', 'literal', [], ['numbers']),
    { ask: 'この ニュースの 中心は？', focus: 'the highest since records began', tts: 'Temperatures in parts of western Sydney topped forty-seven degrees yesterday, the highest since records began in nineteen thirty-nine. Hospitals reported a surge in heat-related admissions.' }],
  ['mean', 'ho-markets-shrug', 'henry', 'Markets largely shrugged off the jobs report, which, to be fair, was neither as strong as the bulls had hoped nor as weak as the bears had feared.',
    '市場は雇用統計をほぼ材料視しませんでした。強気派の期待ほど強くも、弱気派の心配ほど弱くもなかったのです。 → つまり、予想の範囲内だったので相場はあまり動かなかった。',
    'shrug off＝受け流す。neither A nor B＝どっちつかず',
    ['The report was middling, so prices barely moved.', 'Markets fell sharply after a weak report.', 'Investors ignored the report because it came out late.'],
    tg(62, 'broadcast', 'literal', [], ['idiom']),
    { focus: 'shrugged off' }],
  ['gist', 'ho-bulletin-correction', 'freya', 'And a correction to our earlier bulletin: the new bridge will open in March, not May as we reported, though the toll has yet to be confirmed.',
    '先ほどのニュースの訂正です。新しい橋の開通は、お伝えした5月ではなく3月です。ただし通行料はまだ決まっていません。',
    'not May は誤報の方。通行料は未定のまま',
    ['The month the bridge opens.', 'The price of the toll.', 'Where the bridge will be built.'],
    tg(62, 'broadcast', 'literal', [], ['self-repair', 'contrast']),
    { ask: '訂正された 内容は？', focus: 'not May as we reported' }],
  ['num', 'ho-quake', 'lopez', 'The magnitude 6.3 quake struck at 4:17 local time, about 60 kilometers off the coast. No tsunami warning has been issued.',
    'マグニチュード6.3の地震が現地時間4時17分、沖合およそ60キロで発生しました。津波警報は出ていません。',
    'sixty は距離。six point three が規模',
    ['6.3', '6.0', '4.1'],
    tg(62, 'broadcast', 'literal', [], ['numbers']),
    { ask: 'マグニチュードは？', focus: 'magnitude 6.3', tts: 'The magnitude six point three quake struck at four seventeen local time, about sixty kilometers off the coast. No tsunami warning has been issued.' }],
  ['mean', 'ho-trains-restored', 'kappn', 'Tozai Line services have now resumed. However, delays of up to forty minutes are likely to continue well into the evening rush hour.',
    '東西線は運転を再開しました。ただし、最大40分の遅れが夕方のラッシュ時まで続く見込みです。 → つまり、電車は動いているが、夜まで大幅に遅れる。',
    'resumed＝再開。However 以降の遅れが本題',
    ['Trains are running again, but expect long delays tonight.', 'The line stays closed until the evening rush.', 'Trains will run on time from this evening.'],
    tg(5, 'official', 'literal', ['pa', 'station']),
    { focus: 'have now resumed', scene: 'platform' }],
  ['gist', 'ho-manuscript', 'kidd', "A 900-year-old manuscript missing since the 1970s has turned up at a house clearance in Norfolk. The library, which had long given it up for lost, says it'll go on display next spring.",
    '1970年代から行方不明だった900年前の写本が、ノーフォークの遺品整理で見つかりました。とうに失われたと諦めていた図書館は、来春公開するとしています。',
    'turn up＝見つかる。give up for lost＝諦める',
    ['A long-lost manuscript has been found.', 'A library in Norfolk is closing down.', 'A manuscript was stolen and sold in the 1970s.'],
    tg(62, 'broadcast', 'literal', [], ['idiom', 'numbers']),
    { ask: 'どんな ニュース？', focus: 'turned up', tts: "A nine-hundred-year-old manuscript missing since the nineteen seventies has turned up at a house clearance in Norfolk. The library, which had long given it up for lost, says it'll go on display next spring." }],
  ['mean', 'ho-typhoon', 'label', "The typhoon is expected to weaken before landfall, but forecasters stress that 'weaker' is relative: gusts of over 150 kilometers an hour remain possible.",
    '台風は上陸前に弱まる見込みですが、「弱まる」はあくまで相対的だと予報士は強調しています。時速150キロを超える突風もありえます。 → つまり、勢力は落ちても依然として危険。',
    '「弱まる」は相対的。油断するなという強調',
    ['It will lose strength, but it could still be very dangerous.', "It's no longer a serious threat.", "It's getting stronger as it gets closer."],
    tg(60, 'broadcast', 'literal', [], ['contrast']),
    { focus: "'weaker' is relative", tts: "The typhoon is expected to weaken before landfall, but forecasters stress that 'weaker' is relative: gusts of over a hundred and fifty kilometers an hour remain possible." }],
  ['gist', 'ho-upset', 'phoebe', "In one of the biggest upsets in the tournament's history, an unseeded qualifier has beaten the defending champion in straight sets. She'd never won a match on grass before this week.",
    '大会史上屈指の番狂わせです。ノーシードの予選勝ち上がり選手が、前回王者にストレート勝ちしました。彼女は今週まで芝で1勝もしたことがありませんでした。',
    'upset＝番狂わせ。straight sets で勝ったのは無名の方',
    ['A little-known player beat the champion.', 'The champion won easily in straight sets.', 'The match was moved onto grass.'],
    tg(62, 'broadcast', 'literal', [], ['idiom', 'contraction']),
    { ask: 'なにが 意外だった？', focus: 'biggest upsets' }],
  ['next', 'ho-news-segue', 'lopez', "That's all on the stadium vote. Now, after a weekend of torrential rain, what does the week ahead look like? Here's our meteorologist.",
    'スタジアムの住民投票については以上です。さて、週末の豪雨のあと、今週はどうなるのでしょう。気象予報士です。',
    "Here's our meteorologist で話者交代。次は天気",
    ["Thanks. Well, the good news is it's drying out by Wednesday.", 'Thanks. The stadium vote passed by a wide margin.', "Here's our meteorologist with the week ahead."],
    tg(62, 'broadcast', 'literal', [], ['contraction']),
    { focus: "Here's our meteorologist" }]
];

// ---- radio and podcast talk -----------------------------------------------------------------------------------------

const RADIO: readonly Row[] = [
  ['mean', 'ho-pod-tangent', 'bunnie', "Okay, I'm going to stop myself there, because if I start on airport sushi we'll be here all day, and we have an actual guest.",
    'はい、このへんでやめとくね。空港のお寿司の話を始めたら一日終わっちゃうし、ちゃんとゲストも来てるから。 → つまり、脱線を切り上げてインタビューに移る。',
    'stop myself＝脱線をやめる。actual guest が本題',
    ["She's cutting her own tangent short to get to the guest.", 'She wants to spend the episode on airport sushi.', 'The guest has cancelled, so she keeps talking.'],
    tg(63, 'broadcast', 'humour', [], ['gonna', 'weak-form']),
    { focus: 'stop myself there', tts: "Okay, I'm gonna stop myself there, 'cause if I start on airport sushi we'll be here all day, an' we have an actual guest." }],
  ['mean', 'ho-dj-rain', 'kk-slider', 'And that was the third song about rain in a row, which, given the forecast, is either very clever programming or a cry for help.',
    '以上、3曲連続で雨の歌でした。天気予報を考えると、よほど気の利いた選曲か、助けを求める叫びかのどっちかだね。 → つまり、どんよりした天気に合わせた選曲を自虐的にからかっている。',
    'a cry for help は冗談。雨の曲が続いた自虐',
    ["He's joking that the playlist matches the gloomy weather.", "He's apologising for a technical problem.", "He's asking listeners to call in for help."],
    tg(61, 'broadcast', 'humour', [], ['idiom']),
    { focus: 'a cry for help' }],
  ['num', 'ho-pod-downloads', 'cj', "We hit a million downloads last month. Well, 980,000, but who's counting?",
    '先月100万ダウンロードを達成しました。まあ、正確には98万だけど、誰も数えてないでしょ？',
    "Well, の後が正確な数。who's counting? は冗談",
    ['980,000', '1,000,000', '918,000'],
    tg(63, 'broadcast', 'humour', [], ['self-repair', 'numbers']),
    { ask: '実際の ダウンロード数は？', focus: '980,000', tts: "We hit a million downloads last month. Well, nine hundred and eighty thousand, but who's countin'?" }],
  ['mean', 'ho-cohost-recap', 'punchy', "Oh, sure, mate, because your last 'quick five-minute recap' went for twenty-five minutes.",
    'ああ、そうだね。前回の「さくっと5分のおさらい」は25分かかったけどな。 → つまり、相方が手短にまとめるとは思っていない。',
    '皮肉。前回5分と言って25分かかった',
    ["He doubts his co-host will keep it short.", 'He wants a twenty-five-minute recap this time.', 'He thinks the last recap was too short.'],
    tg(63, 'broadcast', 'sarcasm', [], ['intonation']),
    { focus: 'went for twenty-five minutes', tts: "Oh, sure, mate, 'cause your last 'quick five-minute recap' went for twenty-five minutes." }],
  ['gist', 'ho-traffic-m1', 'sherb', "If you're heading north on the M1, don't. There's a truck on its side just past exit 12, two lanes are closed, and we're hearing it'll be a couple of hours.",
    'M1を北に向かう予定の方、やめておきましょう。12番出口の先でトラックが横転し、2車線が通行止め。解消まで2時間ほどかかるそうです。',
    "don't＝行くな。2は車線、12は出口の番号",
    ['Avoid the motorway heading north.', 'Leave the motorway at exit two.', 'Drive slowly past the truck.'],
    tg(62, 'broadcast', 'literal', [], ['ellipsis', 'numbers']),
    { ask: 'ドライバーへの アドバイスは？', focus: "don't", tts: "If you're headin' north on the M one, don't. There's a truck on its side just past exit twelve, two lanes are closed, an' we're hearing it'll be a couple of hours." }],
  ['reply', 'ho-callin-line', 'kk-slider', "We've got Tomoko on the line from Osaka. Tomoko, you're on the air. Tomoko? I think we've lost her.",
    '大阪のトモコさんとつながっています。トモコさん、オンエア中ですよ。トモコさん？ 切れちゃったかな。 →「すみません、います！ 聞こえますか？」',
    'on the line＝電話がつながって。行列ではない',
    ["Sorry, sorry, I'm here! Can you hear me now?", 'Yes, the line was really long.', 'I lost it on the train, actually.'],
    tg(61, 'broadcast', 'literal', [], ['contraction'])],
  ['reply', 'ho-pod-guest', 'pekoe', 'So before we get into the book, can I just say, the title alone got me.',
    '本の話に入る前にひとこと言わせて。タイトルだけでやられちゃった。 →「ありがとう。第1章を書くより、タイトル決めのほうが時間かかったんです」',
    'got me＝心をつかまれた。get into＝本題に入る',
    ['Ha, thank you. It took longer to choose than the first chapter took to write.', 'Sure, I can get the book for you.', 'Yes, it was alone on the shelf.'],
    tg(63, 'broadcast', 'ritual', [], ['idiom'])],
  ['reply', 'ho-pod-mic', 'audie', 'Wait, is my mic on? Have I been talking to myself this whole time?',
    'ちょっと待って、マイク入ってる？ ずっと独り言しゃべってた？ →「入ってるよ、大丈夫。全部聞こえてた」',
    'this whole time＝ずっと。時間の長さを聞いていない',
    ["You're on, don't worry. We heard every word.", 'Talk to yourself, then.', 'The whole time? About ten minutes.'],
    tg(39, 'broadcast', 'literal', ['video'], ['contraction'])],
  ['reply', 'ho-washing-machine', 'kk-slider', "Caller, you sound like you're phoning from inside a washing machine.",
    'お電話の方、洗濯機の中からかけてるみたいな音ですよ。 →「すみません、高速道路なんです。これでどうですか？」',
    '音がひどいという冗談。実際の洗濯の話ではない',
    ["Sorry, I'm on the highway. Is this any better?", "Yes, I'm doing my washing.", 'No, I always phone from Osaka.'],
    tg(61, 'broadcast', 'humour')],
  ['word', 'ho-pod-wouldve', 'audie', "Honestly, if you'd told me five years ago, I would've laughed in your face.",
    '正直、5年前にそう言われてたら、鼻で笑ってたと思う。',
    "woulda＝would've。n't の有無を聞く",
    ["would've", "wouldn't have", "might've"],
    tg(63, 'broadcast', 'literal', [], ['contraction', 'weak-form']),
    { tts: "Honestly, if you'd told me five years ago, I woulda laughed in your face." }],
  ['word', 'ho-wrap-up', 'cj', "We're going to have to wrap it up there, folks.",
    'みなさん、今日はこのへんで締めないといけません。',
    "gonna hafta＝going to have to。we'll とは別",
    ["We're going to have to", "We'll have to", "We'd have to"],
    tg(63, 'broadcast', 'formula', [], ['gonna', 'weak-form']),
    { tts: "We're gonna hafta wrap it up there, folks." }],
  ['word', 'ho-wasnt-worst', 'bunnie', "It wasn't the worst trip I've ever had, let's put it that way.",
    'これまでで最悪の旅ではなかった、とだけ言っておこうかな。',
    "wasn't の t は弱い。全体は控えめな「よかった」",
    ["wasn't", 'was', "isn't"],
    tg(63, 'broadcast', 'understatement', [], ['contraction'])],
  ['next', 'ho-sponsor', 'cj', "Before we get to your questions, a quick word from this week's sponsor. And no, it's not the meal kit again.",
    'リスナーの質問の前に、今週のスポンサーからひとこと。いや、またミールキットじゃないよ。',
    'a word from our sponsor の次は広告の中身',
    ["This week, it's a sleep app, and I genuinely use it.", 'Our first question comes from a listener in Leeds.', 'The meal kit is back for a third week.'],
    tg(63, 'broadcast', 'humour', [], ['contraction']),
    { focus: "a quick word from this week's sponsor" }]
];

// ---- mini-lectures and explanations ---------------------------------------------------------------------------------

const LECTURE: readonly Row[] = [
  ['next', 'ho-two-reasons', 'blathers', 'There are, broadly, two reasons the experiment failed. The first, frankly, is that the sample was far too small.',
    '実験が失敗した理由は、大きく分けて二つあります。一つ目は、率直に言って、サンプルが小さすぎたことです。',
    'The first…と来たら次は The second',
    ['The second, and more interesting, is how the questions were worded.', 'The first reason, again, is the sample size.', 'In conclusion, the experiment was a success.'],
    tg(64, 'broadcast', 'literal'),
    { focus: 'The first, frankly' }],
  ['mean', 'ho-coffee-wealth', 'shep', 'Now, people who drink more coffee do tend to live longer. But before you order a third cup, remember that coffee drinkers also tend to be wealthier.',
    'コーヒーをよく飲む人は、確かに長生きする傾向があります。でも3杯目を頼む前に、コーヒー好きは裕福な傾向もあることを思い出してください。 → つまり、長寿の理由はコーヒーではなく収入かもしれない。',
    '相関と因果の区別。But 以降が講師の主張',
    ['The link may come from income, not the coffee itself.', 'Drinking three cups a day helps you live longer.', 'Wealthy people drink less coffee.'],
    tg(19, 'broadcast', 'hedge', [], ['contrast']),
    { focus: 'also tend to be wealthier' }],
  ['gist', 'ho-anchoring', 'marina', 'In one study, people spun a wheel that landed on 10 or 65, then guessed how many countries in Africa were in the UN. Those who saw 65 guessed far higher. The number was random, and still it stuck.',
    'ある研究で、10か65で止まるルーレットを回してから、国連に加盟するアフリカの国の数を推測してもらいました。65を見た人のほうがずっと高く答えました。数字はでたらめなのに、頭に残ったのです。',
    'アンカリング効果。無関係な数字でも推測が動く',
    ['A random number can bias our estimates.', 'Most people know the UN figures well.', 'People who spin wheels guess lower.'],
    tg(64, 'broadcast', 'literal', [], ['numbers']),
    { ask: '研究で わかったことは？', focus: 'still it stuck', tts: 'In one study, people spun a wheel that landed on ten or sixty-five, then guessed how many countries in Africa were in the U N. Those who saw sixty-five guessed far higher. The number was random, and still it stuck.' }],
  ['word', 'ho-photography', 'curlos', 'The history of photography begins rather earlier than most people assume.',
    '写真術の歴史は、多くの人が思っているよりかなり早く始まります。',
    'phoTOgraphy は第2音節に強勢。カタカナと違う',
    ['photography', 'photographers', 'photographs'],
    tg(64, 'broadcast', 'literal', [], ['katakana', 'intonation'])],
  ['mean', 'ho-suggestive', 'celeste', "The evidence is, I'd say, suggestive rather than conclusive, so I'd be wary of anyone telling you the matter is settled.",
    '証拠は、決定的というより示唆的と言えるでしょう。ですから「もう決着済み」と言う人には用心したほうがいいですね。 → つまり、まだ結論は出ていない。',
    'suggestive rather than conclusive＝決め手なし',
    ['The question is still open.', 'The evidence proves the theory.', 'Nobody has studied this yet.'],
    tg(64, 'broadcast', 'hedge', [], ['contrast']),
    { focus: 'suggestive rather than conclusive' }],
  ['num', 'ho-empire', 'blathers', "At its height, around AD 117, the Roman Empire covered some five million square kilometres and perhaps a fifth of the world's population.",
    '最盛期の西暦117年ごろ、ローマ帝国はおよそ500万平方キロに広がり、世界人口の5分の1ほどを抱えていました。',
    'one seventeen＝117。年号は2桁ずつ読む',
    ['西暦117年', '西暦170年', '西暦500年'],
    tg(64, 'broadcast', 'literal', [], ['teen-ty', 'numbers']),
    { ask: '最盛期は 西暦 何年ごろ？', focus: 'AD 117', tts: "At its height, around A D one seventeen, the Roman Empire covered some five million square kilometres and perhaps a fifth of the world's population." }],
  ['gist', 'ho-door-button', 'tia', "Why do elevator 'door close' buttons often do nothing? In many buildings they're disabled, so the doors stay open long enough for wheelchair users. The button stays because pressing it makes us feel in control.",
    'エレベーターの「閉」ボタンが効かないことが多いのはなぜでしょう。多くの建物では無効にされていて、車いすの人のために扉が十分開いたままになります。それでもボタンが残るのは、押すと自分で操作している気分になれるからです。',
    'いわゆるプラシーボボタン。押す満足感のために残る',
    ['Some buttons exist mainly to make us feel in control.', 'Elevator doors close faster when you press the button.', 'Wheelchair users asked for the button to be removed.'],
    tg(64, 'broadcast', 'literal', [], ['contraction']),
    { ask: '講義の ポイントは？', focus: 'feel in control' }],
  ['mean', 'ho-rent-control', 'shep', "Rent control is great news if you already have an apartment. It's less great if you're the one looking for one.",
    '家賃規制は、すでに部屋を借りている人には朗報です。部屋を探している側だと、そうでもありません。 → つまり、今の借り手は得をするが、新しく探すのは難しくなりうる。',
    'less great＝控えめな「よくない」',
    ['It helps current tenants but can make finding a place harder.', "It's good news for everyone looking for a home.", 'It only helps people who own apartments.'],
    tg(64, 'broadcast', 'understatement', [], ['contrast']),
    { focus: 'less great' }],
  ['next', 'ho-inflation-cure', 'curlos', "So far we've looked at what causes inflation. What I want to turn to now is the cure, and why it's often worse than the disease.",
    'ここまでインフレの原因を見てきました。ここからは治療法、そしてそれがなぜ病そのものより悪いことが多いのかに移ります。',
    'turn to now＝話題の転換。次は治療策の話',
    ["Let's start with the most common tool: raising interest rates.", 'Inflation, as we said, is caused by rising prices.', "That's why the disease spread so quickly."],
    tg(64, 'broadcast', 'literal', [], ['idiom']),
    { focus: 'turn to now' }],
  ['word', 'ho-not-unlikely', 'celeste', "It's not unlikely that the two species met at some point.",
    'その2つの種がどこかの時点で出会っていた可能性は十分にあります。',
    'not unlikely＝十分ありうる。二重否定',
    ['not unlikely', 'hardly likely', 'not likely'],
    tg(64, 'broadcast', 'hedge', [], ['contraction'])],
  ['gist', 'ho-sleep-clean', 'marina', "Contrary to popular belief, the brain isn't resting while you sleep. During deep sleep, fluid washes through it far more than during the day, clearing out waste that builds up while we're awake.",
    '通説に反して、脳は眠っている間に休んでいるわけではありません。深い眠りの間、脳内を液体が日中よりずっと多く流れ、起きている間にたまった老廃物を洗い流すのです。',
    'Contrary to popular belief＝通説に反して',
    ['Sleep helps the brain clean itself.', 'The brain switches off during deep sleep.', 'Drinking water before bed helps you sleep.'],
    tg(19, 'broadcast', 'literal', [], ['contraction']),
    { ask: '講義の 主張は？', focus: 'Contrary to popular belief' }]
];

// ---- documentary narration ------------------------------------------------------------------------------------------

const DOCUMENTARY: readonly Row[] = [
  ['mean', 'ho-penguin-fathers', 'tex', 'The males will stand here, through the darkest months, without eating. It is, by any measure, an extraordinary commitment to fatherhood.',
    'オスたちは一番暗い数か月間、何も食べずにここに立ち続けます。どう見ても、並外れた父親としての献身です。 → つまり、オスは子のために何か月も絶食に耐える。',
    'by any measure＝どう見ても。without eating が要点',
    ['The males go hungry for months for their young.', 'The males leave their young during the dark months.', 'The males eat more than usual in winter.'],
    tg(64, 'broadcast', 'literal', [], ['idiom']),
    { focus: 'without eating' }],
  ['gist', 'ho-city-growth', 'fauna', "In 1900, one person in eight lived in a city. Today it's more than half, and by 2050, if current trends hold, it'll be closer to seven in ten.",
    '1900年には、都市に住むのは8人に1人でした。今では半数以上。このままの傾向なら、2050年には10人に7人近くになります。',
    '1900年→今→2050年の推移。都市離れではない',
    ['The rapid growth of city living.', 'What city life was like in 1900.', 'Why people are leaving cities.'],
    tg(64, 'broadcast', 'literal', [], ['numbers']),
    { ask: 'この ナレーションの テーマは？', focus: 'if current trends hold', tts: "In nineteen hundred, one person in eight lived in a city. Today it's more than half, and by twenty fifty, if current trends hold, it'll be closer to seven in ten." }],
  ['num', 'ho-whale-heart', 'walker', "A blue whale's heart weighs around 180 kilos, roughly as much as a fridge, and on a deep dive it can beat as few as two times a minute.",
    'シロナガスクジラの心臓は約180キロで、冷蔵庫くらいの重さです。深く潜っている間は、1分にわずか2回しか打たないこともあります。',
    'as few as＝わずか。180は心臓の重さ',
    ['2回', '12回', '180回'],
    tg(64, 'broadcast', 'literal', [], ['numbers']),
    { ask: '潜水中の 心拍は 1分に 何回？', focus: 'as few as two times a minute', tts: "A blue whale's heart weighs around a hundred and eighty kilos, roughly as much as a fridge, and on a deep dive it can beat as few as two times a minute." }],
  ['mean', 'ho-coal-town', 'tex', 'And so the town that built its fortune on coal now markets itself as a destination for clean mountain air.',
    'こうして、石炭で富を築いた町は、いまや澄んだ山の空気を売りにする観光地として自らを宣伝しています。 → つまり、町のイメージが皮肉なほど正反対に変わった。',
    '石炭の町が「澄んだ空気」を売る皮肉',
    ["The town's image has flipped, with some irony.", 'The town still depends on coal.', 'The air in the town is badly polluted.'],
    tg(64, 'broadcast', 'attitude', [], ['contrast']),
    { focus: 'clean mountain air' }],
  ['next', 'ho-river-crossing', 'coco', 'For three days, the herd has waited at the riverbank. The crocodiles have waited too. Then, without warning, one young female steps forward.',
    '3日間、群れは川岸で待ち続けてきました。ワニたちも待っていました。そして突然、一頭の若いメスが前に踏み出します。',
    'Then, without warning は展開が動く合図',
    ['Within seconds, the whole herd follows her in.', 'For three more days, nothing at all happens.', 'The crocodiles have waited at the riverbank too.'],
    tg(66, 'broadcast', 'literal'),
    { focus: 'without warning' }],
  ['gist', 'ho-station-night', 'fauna', 'Every day, more than three million people pass through this station, making it the busiest in the world. Yet at 1 a.m., when the last train pulls out, it falls almost completely silent.',
    '毎日300万人以上がこの駅を通り、世界一の混雑駅となっています。しかし深夜1時、終電が出ていくと、ほとんど完全に静まり返ります。',
    'Yet が対比の合図。昼の雑踏と夜の静けさ',
    ['The crowds by day and the silence at night.', 'The first and the last trains of the day.', 'Three different stations in the city.'],
    tg(64, 'broadcast', 'literal', [], ['contrast']),
    { ask: 'ナレーションが 対比しているのは？', focus: 'Yet at 1 a.m.', tts: 'Every day, more than three million people pass through this station, making it the busiest in the world. Yet at one a.m., when the last train pulls out, it falls almost completely silent.' }]
];

// ---- debates and panel discussions ----------------------------------------------------------------------------------

const DEBATE: readonly Row[] = [
  ['mean', 'ho-greatest-respect', 'apollo', "With the greatest respect, that's a lovely idea that has never once worked in practice.",
    'お言葉ですが、それは素敵な考えですが、実際にうまくいったことは一度もありません。 → つまり、その案は非現実的だと思っている。',
    'With the greatest respect＝反論の前置き',
    ['He thinks the idea is unrealistic.', 'He respects the idea and supports it.', 'He thinks it has worked once before.'],
    tg(65, 'broadcast', 'attitude', [], ['contraction']),
    { focus: 'With the greatest respect' }],
  ['reply', 'ho-come-in', 'vivian', "Sorry, can I just come in there? Because you've said twice now that the figures don't matter.",
    'すみません、ちょっと口を挟んでもいいですか？ 数字は関係ないと、もう2回おっしゃっていますよね。 →「どうぞ。ただ、手短にお願いします」',
    'come in＝議論に割って入る。入室ではない',
    ['Of course. Briefly, though, if you don\'t mind.', "No, the figures came in twice.", "Come in, the door's open."],
    tg(65, 'broadcast', 'formula', [], ['idiom'])],
  ['mean', 'ho-grant-you', 'ken', "I'll grant you that the commute is gone. But the hallway conversations, the ones that actually solve problems, those are gone too.",
    '通勤がなくなったのは認めます。でも廊下での会話、実際に問題を解決していたあの会話も、なくなったんです。 → つまり、在宅勤務の利点は認めつつ、大事なものを失ったと主張している。',
    "I'll grant you＝そこは認める。But 以降が主張",
    ['He admits one benefit but says something important was lost.', 'He agrees completely that working from home is better.', 'He wants more hallways in the office.'],
    tg(65, 'broadcast', 'attitude', [], ['contrast']),
    { focus: "I'll grant you" }],
  ['gist', 'ho-one-sentence', 'judy', "We're almost out of time, so I'm going to ask each of you for one sentence, just one, on whether the four-day week is here to stay.",
    'そろそろ時間ですので、週4日勤務は定着するのか、お一人ずつ一文で、本当に一文だけでお願いします。',
    'one sentence, just one＝ひとことで',
    ['A very short final answer from each guest.', 'A full explanation of the four-day week.', 'Questions from the audience.'],
    tg(65, 'broadcast', 'literal', [], ['gonna']),
    { ask: '司会者は 何を 頼んでいる？', focus: 'one sentence, just one', tts: "We're almost out of time, so I'm gonna ask each of you for one sentence, just one, on whether the four-day week is here to stay." }],
  ['word', 'ho-data-cant', 'agnes', "The data can't tell us whether the policy actually caused the drop.",
    'そのデータからは、政策が本当に減少の原因だったかどうかはわかりません。',
    "米国の can't は t がほぼ消える。母音で判断",
    ["can't", 'can', "couldn't"],
    tg(65, 'broadcast', 'hedge', [], ['can-cant'])],
  ['mean', 'ho-school-street', 'chief', "Nobody on this panel is saying we should ban cars. What we're saying is maybe a school street doesn't need to be a motorway at 8 a.m.",
    'このパネルの誰も、車を禁止しろとは言っていません。言っているのは、朝8時の通学路が高速道路みたいである必要はないだろう、ということです。 → つまり、全面禁止ではなく学校付近の交通を減らしたい。',
    'Nobody is saying…は誤解を否定。本題は後半',
    ['They want less traffic near schools, not a total ban.', 'They want to ban all cars.', 'They want schools to start at eight.'],
    tg(65, 'broadcast', 'attitude', [], ['contrast']),
    { focus: "What we're saying", tts: "Nobody on this panel is saying we should ban cars. What we're saying is maybe a school street doesn't need to be a motorway at eight a.m." }],
  ['reply', 'ho-great-question', 'static', "That's a great question, and I think it really speaks to a broader conversation we need to be having.",
    'すばらしいご質問です。もっと大きな議論につながる話だと思います。 →「なるほど。でも、質問そのものに答えていただけますか？」',
    '褒めて話をそらす定番。答えを促すのが自然',
    ['Right, but could you answer the question itself?', 'Thanks, the conversation room is broader.', "Yes, I'll speak to him about it later."],
    tg(47, 'official', 'hedge', [], ['idiom'])],
  ['reply', 'ho-couldnt-agree', 'whitney', "I couldn't agree more, actually, which I know will surprise everyone here.",
    '実は大賛成なんです。ここにいる皆さんは驚くでしょうけど。 →「はは、記念日だ。やっと意見が合いましたね」',
    "couldn't agree more＝大賛成。否定ではない",
    ['Ha! Mark the date. We finally agree on something.', "Why couldn't you agree?", 'Yes, everyone here is surprised by the weather.'],
    tg(65, 'broadcast', 'humour', [], ['contraction'])],
  ['word', 'ho-hardly-begun', 'agnes', "We've hardly begun to understand the long-term effects.",
    '長期的な影響については、まだほとんど理解が始まってもいません。',
    'hardly＝ほとんど〜ない。already とは逆',
    ['hardly', 'already', 'only'],
    tg(65, 'broadcast', 'hedge', [], ['contraction'])]
];

// ---- interviews -----------------------------------------------------------------------------------------------------

const INTERVIEW: readonly Row[] = [
  ['mean', 'ho-knee', 'sterling', "Look, I'm not going to sit here and tell you the knee's a hundred percent. But I'll be on that start line.",
    'いいかい、膝が完璧だなんてここで言うつもりはないよ。でもスタートラインには立つ。 → つまり、まだ痛むがレースには出る。',
    'not 100% は「まだ痛い」。それでも出場する',
    ["He's still hurt but plans to race anyway.", 'His knee has fully healed.', "He's pulling out of the race."],
    tg(63, 'broadcast', 'attitude', [], ['gonna', 'yod']),
    { focus: 'start line', tts: "Look, I'm not gonna sit here 'n' tell ya the knee's a hundred percent. But I'll be on that start line." }],
  ['reply', 'ho-devastating', 'diana', "Your novel's been called 'quietly devastating'. Is that how you'd describe it?",
    'あなたの小説は「静かに打ちのめされる」と評されていますね。ご自身もそう表現しますか？ →「正直、『静かに』は外すかもしれません」',
    'drop＝外す。もっと強烈だという冗談',
    ["I'd probably drop the 'quietly', to be honest.", 'Yes, I described it very quietly.', 'No, it was called last week.'],
    tg(63, 'broadcast', 'humour', [], ['contraction'])],
  ['mean', 'ho-chef-miss', 'pietro', "Do I miss the restaurant? I miss the food. I don't miss the eighteen-hour days, and I definitely don't miss the landlord.",
    'レストランが恋しいか？ 料理は恋しいよ。1日18時間労働は恋しくないし、大家なんて絶対に恋しくない。 → つまり、料理以外は辞めてよかったと思っている。',
    '恋しいのは料理だけ。残りは否定',
    ["He's glad he left, apart from the cooking.", 'He misses everything about the restaurant.', 'He still works eighteen-hour days.'],
    tg(63, 'broadcast', 'attitude', [], ['contrast']),
    { focus: 'I miss the food' }],
  ['reply', 'ho-soil', 'cj', 'In one sentence, for our listeners: why should anyone care about soil?',
    'リスナーのためにひとことで。なぜ土のことを気にかけるべきなんでしょう？ →「今日あなたが食べたものは、ほぼ全部そこから始まっているからです」',
    'In one sentence＝ひとことで。簡潔な答えが自然',
    ['Because almost everything you ate today started in it.', "Sure, I'll take care of it this weekend.", 'One sentence is about forty words.'],
    tg(63, 'broadcast', 'literal')],
  ['num', 'ho-summit', 'gulliver', 'We set off at 2 a.m., reached the summit just after 11, and were back in camp by 6. Or was it 7? It\'s all a bit of a blur.',
    '午前2時に出発して、11時すぎに山頂に着いて、6時までにキャンプに戻った。いや7時だったかな。記憶がぼんやりしてるんだ。',
    '6か7かは帰着の時刻。山頂は11時すぎ',
    ['11時すぎ', '7時ごろ', '2時ごろ'],
    tg(63, 'broadcast', 'literal', [], ['self-repair', 'numbers']),
    { ask: '山頂に 着いたのは？', focus: 'just after 11', tts: "We set off at two a.m., reached the summit just after eleven, and were back in camp by six. Or was it seven? It's all a bit of a blur." }],
  ['gist', 'ho-roommates', 'poppy', "People assume we planned all this. Honestly, the app started as a joke between two roommates who couldn't agree on whose turn it was to buy toilet paper.",
    'みんな、全部計画どおりだったと思ってるの。本当は、トイレットペーパーを買う番がどっちか決められないルームメイト2人の冗談から始まったアプリなのよ。',
    'People assume…は否定される前提。本題は後半',
    ['It began as a joke about household chores.', 'It came from a careful business plan.', 'It was a joke app that failed.'],
    tg(63, 'broadcast', 'literal', [], ['contraction']),
    { ask: 'アプリの きっかけは？', focus: 'started as a joke' }]
];

// ---- TED-style talks ------------------------------------------------------------------------------------------------

const TALK: readonly Row[] = [
  ['mean', 'ho-failure-rent', 'charlise', 'I used to think failure was the opposite of success. Now I think it\'s more like the rent you pay to get there.',
    '失敗は成功の反対だと思っていました。今は、そこにたどり着くために払う家賃のようなものだと思っています。 → つまり、失敗は成功への途中で払う当然のコスト。',
    'rent は比喩。成功への必要経費という意味',
    ['Failure is a normal cost on the way to success.', 'Success means never failing.', 'Successful people pay less rent.'],
    tg(64, 'broadcast', 'literal', [], ['idiom']),
    { focus: 'the rent you pay' }],
  ['gist', 'ho-phone-hands', 'tia', 'Raise your hand if you checked your phone in the last ten minutes. Keep it up if you can remember why. Yeah. That\'s what I want to talk about.',
    'この10分でスマホを見た人、手を挙げてください。なぜ見たか覚えている人は、そのまま挙げていて。…そう。今日はその話をしたいんです。',
    '聴衆参加の導入。テーマは最後の一文',
    ['Checking our phones without thinking.', 'How to remember phone numbers.', 'Why people raise their hands in talks.'],
    tg(64, 'broadcast', 'literal', [], ['ellipsis']),
    { ask: 'この トークの テーマは？', focus: 'remember why' }],
  ['next', 'ho-and-then', 'marshal', 'So the data looked great. Engagement up, costs down, everyone happy. And then we actually talked to the users.',
    'データは上々でした。利用は増え、コストは減り、みんな満足。そして、実際にユーザーと話してみたんです。',
    'And then…は逆転の前触れ',
    ['And it turned out most of them hated it.', 'And engagement went up even more.', 'So the costs came down too.'],
    tg(64, 'broadcast', 'literal', [], ['contrast']),
    { focus: 'And then' }],
  ['mean', 'ho-character-building', 'whitney', "Moving to a country where I didn't speak the language, with two toddlers, in winter, was, let's say, character-building.",
    '言葉の通じない国に、幼児2人を連れて、冬に引っ越したのは、まあ、人間を鍛えてくれる経験でした。 → つまり、とても大変だった。',
    "let's say, character-building＝控えめに「大変」",
    ['It was extremely hard.', 'It was easy and fun.', 'It made her children more sociable.'],
    tg(64, 'broadcast', 'understatement', [], ['intonation']),
    { focus: 'character-building' }]
];

// ---- cultural references and wordplay -------------------------------------------------------------------------------

const CULTURE: readonly Row[] = [
  ['mean', 'ho-pencil-pun', 'kk-slider', "Next up, a song about a broken pencil. It's pointless, but stick with it.",
    '次は、折れた鉛筆の歌。ポイントレス（芯がない／無意味）だけど、お付き合いを。 → つまり、pointless のダジャレを言っている。',
    'pointless＝芯がない／無意味のダジャレ',
    ["He's joking: 'pointless' fits a broken pencil.", 'He thinks the song is bad, so he skips it.', "He's asking listeners to buy pencils."],
    tg(61, 'broadcast', 'humour', [], ['idiom']),
    { focus: 'pointless' }],
  ['reply', 'ho-elephant', 'raymond', "Shall we address the elephant in the room? We're forty grand over budget.",
    '誰も触れない問題の話をしましょうか。予算を4万ポンドオーバーしています。 →「ええ、そうしましょう。どうしてそこまで膨らんだんですか？」',
    'elephant in the room＝皆が避けている問題',
    ['Yes, let\'s. How did it get that far?', "There's no elephant. I checked.", 'Forty, and the room is too small.'],
    tg(40, 'colleague', 'indirect', [], ['idiom']),
    { scene: 'office' }],
  ['mean', 'ho-catch-22', 'ken', "It's a classic Catch-22: you need experience to get the job, and you need the job to get experience.",
    '典型的なキャッチ22だよ。仕事を得るには経験が要り、経験を積むには仕事が要る。 → つまり、どちらも先にもう一方が必要で抜け出せない。',
    'Catch-22＝どちらも先に要る堂々巡り',
    ['There\'s no way in, because each needs the other first.', 'He has both the experience and the job.', 'The job is a great catch because it pays well.'],
    tg(43, 'friend', 'attitude', [], ['idiom']),
    { focus: 'Catch-22', tts: "It's a classic Catch twenty-two: you need experience to get the job, and you need the job to get experience." }],
  ['mean', 'ho-over-the-moon', 'merengue', 'Getting tickets for that show? Over the moon. Getting tickets at that price? Less so.',
    'あの公演のチケットが取れたこと？ 大喜びよ。あの値段で取ったこと？ それほどでも。 → つまり、行けるのはうれしいが値段には不満。',
    'over the moon＝大喜び。Less so＝そこまでは',
    ["She's thrilled to go but unhappy about the cost.", "She isn't going because of the price.", "She's sad she missed the show."],
    tg(57, 'friend', 'understatement', [], ['idiom', 'ellipsis']),
    { focus: 'Less so' }],
  ['mean', 'ho-bite-bullet', 'curlos', "'Bite the bullet' supposedly comes from soldiers biting on a bullet during surgery, though historians are, shall we say, sceptical.",
    '「弾丸をかむ」は、手術中の兵士が弾をかんで耐えたのが由来とされていますが、歴史家たちは、まあ、懐疑的です。 → つまり、よく聞く由来の話は本当ではないかもしれない。',
    'supposedly・shall we say は疑いの合図',
    ['The popular story behind the phrase may not be true.', 'Historians have proven the story is true.', 'Soldiers still do this during surgery today.'],
    tg(64, 'broadcast', 'hedge', [], ['idiom']),
    { focus: 'supposedly' }],
  ['reply', 'ho-tall-poppy', 'roald', "Don't get too big for your boots, mate. Tall poppies and all that.",
    '調子に乗るなよ。出る杭は打たれるって言うだろ。 →「はは、大丈夫。母がしっかり地に足つけさせてくれるから」',
    'tall poppy＝出る杭。豪の定番のからかい',
    ['Ha, don\'t worry, my mum keeps me grounded.', 'My boots are a size ten, actually.', "Tall? I'm only average height."],
    tg(55, 'friend', 'humour', [], ['idiom'])],
  ['reply', 'ho-lose-story', 'brewster', "We're running long. Can you lose the second story?",
    '押してる。2本目のニュース、カットできる？ →「了解、そのまま天気に行くよ」',
    'lose＝カットする。story は記事（階ではない）',
    ["Fine, I'll go straight to the weather.", 'Which floor? The second storey?', 'I lost it somewhere this morning.'],
    tg(62, 'colleague', 'literal', [], ['idiom']),
    { scene: 'office' }],
  ['reply', 'ho-make-sense', 'blathers', 'Does that make sense, or shall I go over it again?',
    'ここまでわかりましたか？ それとももう一度説明しましょうか？ →「後半だけ、もう一度お願いできますか？」',
    'go over＝説明し直す。向こうへ行くではない',
    ['Could you go over the second part once more?', "Yes, I'll go over to the other building.", 'It made sense last week.'],
    tg(43, 'official', 'formula', [], ['idiom'])],
  ['reply', 'ho-doc-too-long', 'label', "The doc's brilliant, but it's ninety minutes and the slot's an hour.",
    'そのドキュメンタリーは最高なんだけど、90分あって、枠は1時間なのよ。 →「じゃあ、どこを削る？」',
    'but の後が問題。30分の超過',
    ['So what would you cut?', 'Great, so it fits nicely.', 'An hour is plenty for lunch.'],
    tg(42, 'colleague', 'indirect', [], ['contraction']),
    { scene: 'office' }]
];

// ---- dense numbers and statistics -----------------------------------------------------------------------------------

const STATS: readonly Row[] = [
  ['num', 'ho-fare', 'poppy', 'Starting April 1st, the base fare rises from $2.75 to $2.90, the first increase in six years.',
    '4月1日から、基本運賃が2ドル75セントから2ドル90セントに上がります。6年ぶりの値上げです。',
    'from A to B の B が新運賃。dollars は省略',
    ['$2.90', '$2.75', '$2.60'],
    tg(62, 'broadcast', 'literal', [], ['numbers']),
    { ask: '新しい 運賃は？', focus: '$2.90', tts: 'Starting April first, the base fare rises from two seventy-five to two ninety, the first increase in six years.' }],
  ['num', 'ho-unemployment', 'freya', 'Unemployment edged up to 4.3%, from 4.1%, while wage growth slowed to 5.2%.',
    '失業率は4.1%から4.3%へとわずかに上昇し、賃金の伸びは5.2%に鈍化しました。',
    'edged up to＝〜へ微増。from の後は前回値',
    ['4.3%', '4.1%', '5.2%'],
    tg(62, 'broadcast', 'literal', [], ['numbers']),
    { ask: '失業率は？', focus: '4.3%', tts: 'Unemployment edged up to four point three per cent, from four point one, while wage growth slowed to five point two.' }],
  ['num', 'ho-survey', 'poppy', "In the survey, 62% said they'd prefer a four-day week, though only 26% thought their employer would agree.",
    '調査では62%が週4日勤務を望むと答えましたが、雇い主が賛成すると思った人は26%にとどまりました。',
    '62と26の入れ替え。though の後を聞く',
    ['26%', '62%', '36%'],
    tg(65, 'broadcast', 'literal', [], ['numbers']),
    { ask: '雇い主が 賛成すると 思ったのは？', focus: 'only 26%', tts: "In the survey, sixty-two percent said they'd prefer a four-day week, though only twenty-six percent thought their employer would agree." }],
  ['num', 'ho-one-in-three', 'curlos', 'Roughly one in three adults in the study, about 34%, slept less than six hours a night.',
    'この研究では、成人のおよそ3人に1人、約34%が一晩6時間未満の睡眠でした。',
    'one in three≒34%。6は時間の数字',
    ['約34%', '約43%', '約6%'],
    tg(19, 'broadcast', 'literal', [], ['numbers']),
    { ask: '6時間 未満の 割合は？', focus: 'about 34%', tts: 'Roughly one in three adults in the study, about thirty-four per cent, slept less than six hours a night.' }],
  ['num', 'ho-per-person', 'static', "The scheme costs £1.2 billion a year. That's about £18 per person, less than a takeaway.",
    'この制度は年に12億ポンドかかります。1人あたり約18ポンド、テイクアウト1回分より安いのです。',
    'eighTEEN と EIGHty。billion は総額の方',
    ['£18', '£80', '£1.20'],
    tg(65, 'broadcast', 'attitude', [], ['teen-ty', 'numbers']),
    { ask: '1人あたり いくら？', focus: '£18 per person', tts: "The scheme costs one point two billion pounds a year. That's about eighteen pounds per person, less than a takeaway." }],
  ['num', 'ho-population', 'label', "The city's population fell by 0.4% last year, to just under 2.3 million.",
    '市の人口は昨年0.4%減少し、230万人をわずかに下回りました。',
    'million＝百万。2.3 million は230万',
    ['230万人弱', '2300万人弱', '40万人'],
    tg(62, 'broadcast', 'literal', [], ['numbers']),
    { ask: '市の 人口は？', focus: 'just under 2.3 million', tts: "The city's population fell by zero point four percent last year, to just under two point three million." }],
  ['num', 'ho-marathon', 'phoebe', 'She crossed the line in 2 hours, 19 minutes and 40 seconds, shaving 90 seconds off the course record.',
    '彼女は2時間19分40秒でゴールし、コース記録を90秒縮めました。',
    'shave off＝縮める。19分40秒はタイムの方',
    ['90秒', '19秒', '40秒'],
    tg(62, 'broadcast', 'literal', [], ['teen-ty', 'numbers']),
    { ask: '記録を 何秒 縮めた？', focus: 'shaving 90 seconds', tts: 'She crossed the line in two hours, nineteen minutes and forty seconds, shaving ninety seconds off the course record.' }],
  ['num', 'ho-rounding', 'marshal', "Growth came in at 1.8%, which they're rounding up to 2 in the press release, naturally.",
    '成長率は1.8%でしたが、プレスリリースでは当然のように2%に切り上げています。',
    'naturally は皮肉。発表は切り上げた数字',
    ['1.8%', '2%', '8%'],
    tg(62, 'broadcast', 'sarcasm', [], ['numbers']),
    { ask: '実際の 成長率は？', focus: '1.8%', tts: "Growth came in at one point eight per cent, which they're rounding up to two in the press release, naturally." }],
  ['num', 'ho-rain-warning', 'kidd', "Up to 120 millimetres of rain could fall in 24 hours, a month's worth, and the warning runs until 6 on Saturday morning.",
    '24時間で最大120ミリ、ひと月分の雨が降るおそれがあり、警報は土曜の朝6時まで続きます。',
    '120は雨量、24は時間。期限は最後に言う',
    ['土曜の 朝6時', '土曜の 夜6時', '24時間後'],
    tg(60, 'broadcast', 'literal', [], ['numbers']),
    { ask: '警報は いつまで？', focus: 'until 6 on Saturday morning', tts: "Up to a hundred and twenty millimetres of rain could fall in twenty-four hours, a month's worth, and the warning runs until six on Saturday morning." }],
  ['word', 'ho-few-economists', 'henry', 'Few economists expect inflation to fall below target before next year.',
    '来年より前にインフレ率が目標を下回ると見ているエコノミストはほとんどいません。',
    'few＝ほとんどいない。a few なら「何人か」',
    ['Few', 'A few', 'Quite a few'],
    tg(62, 'broadcast', 'literal', [], ['weak-form', 'contrast'])],
  ['word', 'ho-exports', 'freya', 'Exports rose for a third month in a row, helped by a weaker currency.',
    '通貨安に支えられ、輸出は3か月連続で増加しました。',
    'EXports と EXpenses、IMports。語頭を聞く',
    ['Exports', 'Imports', 'Expenses'],
    tg(62, 'broadcast', 'literal', [], ['vowel'])],
  ['word', 'ho-decreased', 'kidd', 'Ticket sales decreased sharply over the summer, the festival says.',
    'フェスティバルによると、夏の間にチケットの売り上げが急減しました。',
    'de と in の一音で意味が逆になる',
    ['decreased', 'increased', 'eased'],
    tg(62, 'broadcast', 'literal', [], ['contrast'])],
  ['word', 'ho-theyd-pay', 'lopez', "Two-thirds of respondents said they'd pay more for a greener option.",
    '回答者の3分の2が、より環境に優しい選択肢なら多く払うと答えました。',
    "they'd＝would の仮定。they'll と d／l の差",
    ["they'd", "they'll", 'they'],
    tg(62, 'broadcast', 'literal', [], ['contraction'])],
  ['word', 'ho-worse-time', 'celeste', "The results couldn't have come at a worse time for the company.",
    'この結果は、会社にとって最悪のタイミングで出てしまいました。',
    "couldn't have…worse＝最悪の。n't を聞く",
    ["couldn't have", 'could hardly have', "wouldn't have"],
    tg(62, 'broadcast', 'attitude', [], ['contraction', 'weak-form'])]
];

// ---- stance: attitude, certainty, irony -----------------------------------------------------------------------------

const STANCE: readonly Row[] = [
  ['mean', 'ho-supposedly', 'vivian', 'The new scheme will, supposedly, pay for itself within five years.',
    '新しい制度は、5年以内に元が取れる、ということになっています。 → つまり、話し手はその主張を疑っている。',
    'supposedly＝〜ということになっている（疑い）',
    ['She doubts the claim.', "She's confident it'll pay for itself.", "She thinks it'll take less than five years."],
    tg(65, 'broadcast', 'attitude', [], ['intonation']),
    { focus: 'supposedly' }],
  ['mean', 'ho-footnote', 'ken', 'To be fair to the council, they did warn us. Three years ago. In a footnote.',
    '市議会の名誉のために言えば、確かに警告はしてたよ。3年前に。脚注でね。 → つまり、警告は目立たず、ほとんど意味がなかった。',
    'To be fair と言いつつ皮肉で批判している',
    ['The warning was so hidden it was almost useless.', 'The council warned everyone clearly.', 'He thinks the council acted fairly.'],
    tg(62, 'friend', 'sarcasm', [], ['ellipsis', 'intonation']),
    { focus: 'In a footnote' }],
  ['mean', 'ho-remains-seen', 'celeste', "Whether it'll scale beyond the pilot remains to be seen.",
    '試験導入の段階を超えて広がるかどうかは、まだわかりません。 → つまり、大規模にうまくいくかは不明。',
    'remains to be seen＝まだわからない',
    ["It's not yet clear whether it'll work on a larger scale.", 'It has already been expanded.', 'The pilot was a failure.'],
    tg(64, 'broadcast', 'hedge', [], ['idiom']),
    { focus: 'remains to be seen' }],
  ['mean', 'ho-cautiously', 'lopez', "I'm cautiously optimistic, with the emphasis on 'cautiously'.",
    '慎重ながら楽観しています。「慎重に」のほうに力点を置いてね。 → つまり、期待はしているがかなり用心している。',
    '強調は cautiously。慎重さが主',
    ["He's hopeful but very careful.", "He's extremely confident.", "He's pessimistic about it."],
    tg(62, 'broadcast', 'hedge', [], ['contrast']),
    { focus: "with the emphasis on 'cautiously'" }],
  ['mean', 'ho-ambitious', 'julian', "It's certainly an ambitious timeline. I'd love to see the plan behind it.",
    '確かに意欲的なスケジュールですね。その裏付けとなる計画をぜひ見たいものです。 → つまり、期限内に実現できるか疑っている。',
    'ambitious＋計画を見せて＝実現性を疑う',
    ['He doubts it can be done on time.', "He's impressed and fully agrees.", 'He wants to join the planning team.'],
    tg(41, 'boss', 'hedge', [], ['contraction']),
    { focus: 'ambitious timeline', scene: 'office' }],
  ['gist', 'ho-changed-mind', 'agnes', "I'll be honest, I came into this study expecting to prove the opposite. The data changed my mind, and that's not a sentence I say lightly.",
    '正直に言うと、この研究は逆のことを証明するつもりで始めました。データが私の考えを変えたんです。そう軽々しく言える言葉ではありません。',
    'not lightly＝重く受け止めている。立場の変化',
    ['The evidence made her change her view.', 'She proved what she had expected.', 'She thinks the data is unreliable.'],
    tg(64, 'broadcast', 'attitude', [], ['contraction']),
    { ask: '話し手の 立場は？', focus: 'changed my mind' }],
  ['next', 'ho-bright-start', 'freya', 'So, a bright start for most of us tomorrow. Make the most of it, though, because by the afternoon…',
    'というわけで、明日はほとんどの地域で晴れて始まります。でも、楽しめるうちに楽しんでおいてください。午後には…',
    'Make the most of it, though＝悪化の予告',
    ['…a band of heavy rain will push in from the west.', "…it'll be brighter still, with clear skies all evening.", '…a bright start for most of us.'],
    tg(60, 'broadcast', 'literal', [], ['intonation']),
    { focus: 'Make the most of it, though' }]
];

/** The single-clip items (90). */
export const ITEMS: readonly Item[] = [
  ...NEWS.map(item('news')),
  ...RADIO.map(item('radio')),
  ...LECTURE.map(item('lecture')),
  ...DOCUMENTARY.map(item('documentary')),
  ...DEBATE.map(item('debate')),
  ...INTERVIEW.map(item('interview')),
  ...TALK.map(item('talk')),
  ...CULTURE.map(item('culture')),
  ...STATS.map(item('stats')),
  ...STANCE.map(item('stance'))
];

// ---- dialogues: interviews, debates, co-hosts (3-4 lines, two voices) -----------------------------------------------

type L = readonly [who: RosterId, en: string, ja: string, tts?: string];
interface DRow {
  id: string;
  type: Extract<ItemType, 'gist' | 'next'>;
  fam: Family;
  lines: readonly L[];
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

const line = (id: string) => ([who, en, ja, tts]: L, n: number): Line => {
  const marks = MARKS[`${id}-${n + 1}`];
  return { who, cast: castOf(who), en, ja, ...(tts && { tts }), ...(marks && { marks }) };
};

const dialogue = (r: DRow): Item => {
  const lines = r.lines.map(line(r.id));
  family[r.id] = r.fam;
  return {
    id: r.id, lv: HOSHI_LV, type: r.type, en: lines.map((l) => l.en).join(' '), ja: r.ja, speaker: lines[0].who, voice: lines[0].cast.slice(0, 2) as Accent,
    cast: lines[0].cast, choices: r.choices, answer: 0, focus: r.focus, ask: r.ask ?? NEXT_ASK, note: r.note, tags: r.tags, lines,
    ...(r.scene && { scene: r.scene }), ...(r.channel && { channel: r.channel })
  };
};

const DROWS: readonly DRow[] = [
  {
    id: 'dho-nine-years', type: 'gist', fam: 'radio', ask: 'ふたりの 結論は？', focus: 'cited another blog',
    lines: [
      ['bunnie', 'Okay, so I looked it up, and the average person spends, like, nine years of their life on their phone.', 'ねえ調べたんだけど、平均的な人は人生のうち9年くらいスマホに使ってるんだって。',
        "Okay, so I looked it up, an' the average person spends, like, nine years of their life on their phone."],
      ['cj', "Nine? That can't be right. Where's that from?", '9年？ それはないでしょ。出どころは？'],
      ['bunnie', 'A, um, a blog. Which cited another blog.', 'えーと、ブログ。別のブログを引用してる。'],
      ['cj', 'So, no idea, then.', 'つまり、わからないってことね。']
    ],
    choices: ["The figure probably isn't reliable.", 'People spend nine years on their phones.', 'They should start a blog about it.'],
    ja: 'その数字はたぶん当てにならない。', note: 'ブログの孫引き。no idea は皮肉な結論',
    tags: tg(63, 'broadcast', 'sarcasm', [], ['ellipsis', 'weak-form'])
  },
  {
    id: 'dho-breaking-up', type: 'next', fam: 'radio', focus: 'breaking up',
    lines: [
      ['kk-slider', "Next caller, you're on the air. Go ahead.", '次のお電話の方、オンエア中です。どうぞ。'],
      ['punchy', "Yeah, g'day, long-time listener, first-time... sorry, is this... can you hear me?", 'あ、どうも、長年のリスナーで、初めて…すみません、これ…聞こえてます？'],
      ['kk-slider', "Just about. You're breaking up a bit. Where are you calling from?", 'なんとか。ちょっと途切れてますね。どこからかけてます？']
    ],
    choices: ["I'm in the car. Hang on, I'll pull over.", "Yeah, I've been listening for years.", "Breaking up? No, we're still together."],
    ja: '車の中です。待って、車を止めます。', note: 'breaking up＝電話が途切れる。別れ話ではない',
    tags: tg(61, 'broadcast', 'humour', ['phone'], ['self-repair', 'idiom'])
  },
  {
    id: 'dho-hours-quality', type: 'gist', fam: 'debate', ask: '女性の 主張は？', focus: 'what it actually measures',
    lines: [
      ['apollo', 'The productivity figures speak for themselves. People at home work longer hours.', '生産性の数字が物語っています。在宅の人のほうが長く働いている。'],
      ['charlise', "Longer, yes. Better? That's a different question, and your figures don't answer it.", '長く、はい。でも、より良く？ それは別の問題で、あなたの数字はそれに答えていません。'],
      ['apollo', "With respect, you can't just wave away the data.", 'お言葉ですが、データを無視するわけにはいきませんよ。'],
      ['charlise', "I'm not waving it away. I'm asking what it actually measures.", '無視していません。それが実際に何を測っているのかを聞いているんです。']
    ],
    choices: ['The figures show hours, not the quality of the work.', 'People at home work fewer hours.', 'The data should be ignored completely.'],
    ja: '数字が示すのは労働時間で、仕事の質ではない。', note: 'Longer, yes. Better? で量と質を区別',
    tags: tg(65, 'broadcast', 'attitude', [], ['contrast', 'intonation'])
  },
  {
    id: 'dho-yes-or-no', type: 'next', fam: 'interview', focus: 'yes or no',
    lines: [
      ['label', 'Customers waited up to six hours on hold. Will there be compensation?', 'お客さんは最大6時間も保留で待たされました。補償はありますか？'],
      ['henry', "What I can say is that we've doubled the size of our support team since March.", '申し上げられるのは、3月以降サポート部門の人員を倍にしたということです。'],
      ['label', "That's not what I asked. Will there be compensation, yes or no?", 'それは質問の答えではありません。補償はあるんですか、ないんですか？']
    ],
    choices: ["We're looking at all the options, and we'll update customers shortly.", 'Yes, six hours, on hold.', 'We doubled it in March, yes.'],
    ja: 'あらゆる選択肢を検討しており、近くお客様にお知らせします。', note: '答えをはぐらかし続けるのが自然な流れ',
    tags: tg(47, 'broadcast', 'hedge', [], ['contraction'])
  },
  {
    id: 'dho-fossil-bias', type: 'gist', fam: 'lecture', ask: '化石の 記録について 正しいのは？', focus: 'biased sample',
    lines: [
      ['ankha', "Sorry, just to check: are you saying the fossil record is incomplete, or that it's misleading?", 'すみません、確認ですが、化石記録が不完全だということですか、それとも誤解を招くということですか？'],
      ['blathers', 'Both, rather. Incomplete, because most creatures never fossilise. Misleading, because the ones that do are mostly the hard-shelled ones.',
        'むしろ両方です。不完全なのは、ほとんどの生き物が化石にならないから。誤解を招くのは、化石になるのがたいてい硬い殻のある生き物だからです。'],
      ['ankha', "So we're seeing a biased sample.", 'つまり、偏ったサンプルを見ているわけですね。'],
      ['blathers', 'Precisely.', 'そのとおり。']
    ],
    choices: ['It over-represents creatures with hard parts.', "It's complete but hard to read.", 'Most creatures left good fossils.'],
    ja: '硬い部分のある生き物が多く残りすぎている。', note: 'Both, rather＝むしろ両方。偏りがポイント',
    tags: tg(64, 'broadcast', 'literal', [], ['contrast'])
  },
  {
    id: 'dho-let-me-finish', type: 'next', fam: 'debate', focus: 'let me finish',
    lines: [
      ['curt', 'The problem with congestion charges is they hit the people who can least afford—', '渋滞税の問題は、いちばん余裕のない人たちを直撃することで——'],
      ['vivian', 'Sorry, but the evidence from three cities says the opposite.', 'すみませんが、3つの都市のデータは逆を示しています。'],
      ['curt', "If you'd let me finish, I was going to say: unless the money goes back into buses.", '最後まで言わせてくれれば、「その税収がバスに回されない限りは」と言うつもりだったんです。',
        "If you'd let me finish, I was gonna say: unless the money goes back into buses."]
    ],
    choices: ['Fair enough. Then we may agree more than I thought.', "Sorry, I'll let you finish your bus.", 'Three cities, yes, all with congestion.'],
    ja: 'それなら納得です。思ったより意見が近いかもしれませんね。', note: '最後まで聞くと意見は近い。譲歩が自然',
    tags: tg(65, 'broadcast', 'attitude', [], ['self-repair', 'gonna'])
  },
  {
    id: 'dho-cool-change', type: 'gist', fam: 'radio', ask: '今日の 天気は？', focus: 'Cool change',
    lines: [
      ['sherb', "Forty-one in the west today, so if you're thinking of a jog at lunchtime...", '今日の西部は41度。昼休みにジョギングしようと思ってるなら…'],
      ['coco', "Don't. Just don't. Honestly, stay inside with the air con.", 'やめて。本当にやめて。冷房の効いた室内にいて。'],
      ['sherb', 'Cool change is meant to come through around seven tonight, though.', 'でも今夜7時ごろには涼しい空気が入ってくるらしいよ。'],
      ['coco', "'Cool' meaning thirty-two. Lovely.", '「涼しい」って32度のことね。すてき。']
    ],
    choices: ['Very hot all day, a little cooler tonight.', 'Cool enough for a lunchtime jog.', 'Thirty-two degrees at lunchtime.'],
    ja: '一日中とても暑く、夜に少し涼しくなる。', note: "'Cool' meaning 32 は皮肉。昼は41度",
    tags: tg(60, 'broadcast', 'sarcasm', [], ['ellipsis', 'numbers'])
  },
  {
    id: 'dho-touch-cheerful', type: 'next', fam: 'documentary', focus: 'a touch cheerful',
    lines: [
      ['fauna', "Can we go again on that line? You sounded a touch cheerful for a glacier that's disappearing.", 'そのセリフ、もう一回いい？ 消えゆく氷河にしては、ちょっと明るすぎたわ。'],
      ['tex', "Fair point. Bit less 'holiday advert', bit more 'funeral'?", 'ごもっとも。「旅行のCM」感を減らして、「お葬式」寄りに？'],
      ['fauna', 'Somewhere in between, ideally.', 'できれば、その中間で。']
    ],
    choices: ['Right. Sombre but not gloomy. Going again.', "The glacier's in between two mountains.", 'Yes, the holiday advert went really well.'],
    ja: '了解。重々しく、でも暗すぎず。もう一回いきます。', note: 'a touch＝少し。ナレーションの調子の話',
    tags: tg(64, 'colleague', 'humour', [], ['ellipsis']),
    scene: 'office'
  },
  {
    id: 'dho-headline', type: 'gist', fam: 'interview', ask: '男性の 引退について わかることは？', focus: "don't put it in the headline",
    lines: [
      ['phoebe', "Four years ago you said you'd retire after this one. Still the plan?", '4年前、これが最後で引退すると言っていましたね。今もその予定ですか？'],
      ['roald', "Ask me in a month. Right now my body says yes, but my head's not so sure.", '1か月後に聞いてよ。今は体はイエスって言ってるけど、頭はそうでもない。'],
      ['phoebe', "So that's a maybe.", 'つまり、「たぶん」ですね。'],
      ['roald', "That's a 'don't put it in the headline'.", '「見出しにはしないで」ってことだよ。']
    ],
    choices: ["He hasn't decided yet.", "He's retiring next month.", "He's definitely carrying on."],
    ja: 'まだ決めていない。', note: 'Ask me in a month＝まだ決めていない',
    tags: tg(63, 'broadcast', 'humour', [], ['contraction'])
  },
  {
    id: 'dho-print-money', type: 'next', fam: 'lecture', focus: 'worth less',
    lines: [
      ['marina', "So why can't the government just print more money and pay off everyone's debts?", 'じゃあ、政府がお金をもっと刷って、みんなの借金を返しちゃえばいいんじゃない？'],
      ['kidd', "It can. Once. Then prices go up, and the money everyone's holding is worth less.", 'できますよ。一度はね。でもそのあと物価が上がって、みんなが持っているお金の価値が下がります。'],
      ['marina', 'So the debts shrink, but so do people\'s savings.', 'つまり借金は減るけど、貯金も目減りするのね。']
    ],
    choices: ["Exactly. Someone always pays. It's just less visible.", 'Yes, print it once and pay it twice.', 'Prices of printers have gone up, yes.'],
    ja: 'そのとおり。誰かが必ず払うんです。見えにくいだけで。', note: 'worth less＝価値が下がる。理解の確認に同意',
    tags: tg(64, 'broadcast', 'literal', [], ['contraction'])
  },
  {
    id: 'dho-episode-three', type: 'gist', fam: 'radio', ask: '男性は どうする？', focus: 'One more',
    lines: [
      ['audie', "Have you watched it yet? Everyone says episode three's where it gets good.", 'もう見た？ みんな、第3話から面白くなるって言ってるよ。'],
      ['kicks', 'I gave up after two. If I need three hours to get to the good bit...', '2話でやめた。面白いところまで3時間かかるなら…'],
      ['audie', 'Okay, but episode three is genuinely one of the best hours of TV I\'ve seen this year.', 'でも第3話は、今年見たテレビの中で本当に最高の1時間なんだって。'],
      ['kicks', "Fine. One more. But if it's not, you're buying lunch.", 'わかった。あと1話。でもそうじゃなかったら、ランチおごりね。']
    ],
    choices: ['Watch one more episode.', 'Stop watching the show.', 'Buy lunch for the woman.'],
    ja: 'あと1話だけ見る。', note: '条件付きで続ける。lunch は賭けの話',
    tags: tg(63, 'broadcast', 'humour', [], ['ellipsis', 'contraction'])
  },
  {
    id: 'dho-reported-crime', type: 'next', fam: 'stats', focus: 'Reported crime',
    lines: [
      ['julian', 'Crime is down 11% on last year.', '犯罪は昨年比で11%減っています。', 'Crime is down eleven per cent on last year.'],
      ['whitney', "Reported crime. Which isn't quite the same thing.", '「届け出のあった」犯罪ね。それは同じとは言えないでしょ。'],
      ['julian', 'Meaning?', 'というと？']
    ],
    choices: ['Meaning fewer people may be bothering to report it.', 'Meaning eleven, not seven.', 'Meaning crime is up eleven per cent.'],
    ja: 'つまり、わざわざ届け出る人が減っているのかもしれない。', note: 'Reported に強勢。届け出数と実数は違う',
    tags: tg(65, 'broadcast', 'attitude', [], ['contrast', 'numbers'])
  },
  {
    id: 'dho-allow-it', type: 'gist', fam: 'talk', ask: 'やりとりの 結末は？', focus: "I'll allow it",
    lines: [
      ['gruff', "Lovely talk, but isn't this just common sense with nicer slides?", 'いい講演でしたが、これって見栄えのいいスライド付きの常識にすぎないんじゃ？'],
      ['tia', 'Ha. Partly, sure. But common sense also told us the Earth was flat.', 'はは。一部はそうかも。でも、地球は平らだと言っていたのも常識でしたよね。'],
      ['gruff', "Fair point. I'll allow it.", 'ごもっとも。認めよう。']
    ],
    choices: ['The man accepts her answer.', 'The man says her slides were bad.', 'She admits the talk was only common sense.'],
    ja: '男性は彼女の答えを受け入れる。', note: "I'll allow it＝認めよう（おどけた言い方）",
    tags: tg(47, 'broadcast', 'humour', [], ['contraction'])
  },
  {
    id: 'dho-look-away', type: 'next', fam: 'news', focus: 'look away now',
    lines: [
      ['freya', "And with that, it's over to you for the sport. Any good news?", 'というわけで、スポーツはそちらへ。いいニュースはある？'],
      ['kidd', "Depends who you support. If it's the home side, I'd look away now.", '誰を応援してるか次第だね。地元チームなら、今のうちに目をそらして。'],
      ['freya', 'That bad?', 'そんなにひどいの？']
    ],
    choices: ['Four–nil, and honestly, that flatters them.', "Yes, it's over to you now.", "Look away? But I'm reading the news."],
    ja: '4対0。しかも正直、それでもまだましな内容。', note: 'look away now＝見ない方がいい。大敗の合図',
    tags: tg(62, 'broadcast', 'humour', [], ['idiom'])
  },
  {
    id: 'dho-lab-notes', type: 'gist', fam: 'lecture', ask: 'わかったことは？', focus: 'lab notes',
    lines: [
      ['shep', 'So the famous story is that he discovered it completely by accident.', '有名な話では、彼はまったくの偶然でそれを発見したんですよね。'],
      ['celeste', "That's the story he told. His lab notes tell a rather different one.", '本人がそう語ったんです。でも実験ノートはかなり違う話をしています。'],
      ['shep', 'Different how?', 'どう違うんですか？'],
      ['celeste', "He'd been chasing it for two years. The 'accident' made a better headline.", '2年間も追い求めていたんです。「偶然」のほうが見出し映えしただけで。']
    ],
    choices: ['The discovery was planned, not an accident.', 'The lab notes were lost for two years.', 'He found it completely by accident.'],
    ja: '発見は偶然ではなく、狙ったものだった。', note: '「偶然」は作り話。ノートが証拠',
    tags: tg(64, 'broadcast', 'attitude', [], ['contrast'])
  },
  {
    id: 'dho-starter', type: 'next', fam: 'interview', focus: 'earn its place',
    lines: [
      ['diana', "You've said Japanese food changed how you cook. In what way?", '和食で料理が変わったとおっしゃっていますね。どんなふうに？'],
      ['pietro', 'Restraint, mostly. I used to put twelve things on a plate. Now it\'s three, and each one has to earn its place.', '主に引き算だね。昔は皿に12品も載せてた。今は3つで、どれもそこにいる意味がないといけない。'],
      ['diana', 'Do your customers ever ask where the rest is?', 'お客さんに「残りはどこ？」と聞かれたりしません？']
    ],
    choices: ['Every night. Some still think it\'s a starter.', 'Three, and each one earned it.', 'Twelve plates, yes, every night.'],
    ja: '毎晩だよ。いまだに前菜だと思う人もいる。', note: 'starter＝前菜。量が少なく見える冗談',
    tags: tg(63, 'broadcast', 'humour', [], ['contraction'])
  },
  {
    id: 'dho-spread-them', type: 'gist', fam: 'debate', ask: '女性の 提案は？', focus: 'across the country',
    lines: [
      ['agnes', "Overtourism isn't really about numbers. Kyoto in November and Kyoto in February are two different cities.", '観光公害は数の問題じゃないんです。11月の京都と2月の京都は、まるで別の街です。'],
      ['chief', 'So spread visitors across the year, rather than cap them?', 'じゃあ、上限を設けるより一年中に分散させろと？'],
      ['agnes', 'Across the year and across the country. Most visitors see the same six places.', '一年中に、そして全国に。ほとんどの観光客は同じ6か所しか見ないんですから。']
    ],
    choices: ['Spread tourists out in both time and place.', 'Put a strict cap on visitor numbers.', 'Visit Kyoto in November instead.'],
    ja: '時期と場所の両方で観光客を分散させる。', note: 'cap ではなく spread。時期と場所の両方',
    tags: tg(65, 'broadcast', 'literal', ['video'], ['contrast'])
  },
  {
    id: 'dho-swim', type: 'next', fam: 'radio', focus: 'stalled bus',
    lines: [
      ['henry', 'The bridge is closed northbound, so use the tunnel.', '橋は北行きが通行止めなので、トンネルを使ってください。'],
      ['label', "Actually, we're just hearing the tunnel's closed too, for a stalled bus.", 'と思ったら、今入った情報ではトンネルもバスの立ち往生で通行止めだそうです。'],
      ['henry', 'Oh, terrific. So what are our listeners supposed to do, swim?', 'ああ、最高だね。じゃあリスナーはどうすればいいの、泳ぐ？']
    ],
    choices: ['Honestly? If you can, leave it an hour.', 'The bus is stalled northbound, yes.', 'Yes, swimming is closed too.'],
    ja: '正直なところ、できるなら1時間待ってから出てください。', note: 'terrific／swim? は皮肉。現実的な助言が次',
    tags: tg(62, 'broadcast', 'sarcasm', [], ['self-repair', 'contraction'])
  },
  {
    id: 'dho-chocolate', type: 'gist', fam: 'stance', ask: '男性の 考えは？', focus: 'funded by a chocolate company',
    lines: [
      ['judy', 'So, does this new study prove that chocolate is good for you?', 'で、この新しい研究で、チョコが体にいいって証明されたの？'],
      ['flick', "'Prove' is a strong word. It found a link in about two hundred people, and it was funded by a chocolate company.", '「証明」は言いすぎだね。約200人で関連が見つかっただけで、しかも資金はチョコレート会社から。'],
      ['judy', 'Ah.', 'ああ…。'],
      ['flick', "'Ah' is about right.", 'その「ああ」が正解。']
    ],
    choices: ['The study is weak and possibly biased.', 'Chocolate has been proven to be healthy.', 'Two hundred people got sick from chocolate.'],
    ja: 'その研究は根拠が弱く、偏っているかもしれない。', note: "'Ah' is about right＝その反応どおり怪しい",
    tags: tg(19, 'broadcast', 'attitude', [], ['ellipsis'])
  },
  {
    id: 'dho-your-job', type: 'next', fam: 'interview', focus: 'Bold.',
    lines: [
      ['poppy', 'Where do you see yourself in five years?', '5年後、どうなっていたいですか？'],
      ['marshal', 'Honestly? In your job, ideally.', '正直に？ できれば、あなたのポジションに。'],
      ['poppy', "Bold. I'll let my boss know you're coming for me.", '大胆ね。私の座を狙ってる人がいるって上司に伝えておくわ。']
    ],
    choices: ["Ha. Only once you've been promoted, of course.", 'Five years, yes, in this building.', "Thank you, I'm coming at nine tomorrow."],
    ja: 'はは。もちろん、あなたが昇進したあとで。', note: 'Bold＝大胆だね（冗談）。冗談で返すのが自然',
    tags: tg(46, 'official', 'humour', [], ['contraction']),
    scene: 'office'
  },
  {
    id: 'dho-great-wall', type: 'gist', fam: 'radio', ask: '女性は 何を している？', focus: 'Quick correction',
    lines: [
      ['katt', "Quick correction from last week: I said the Great Wall's visible from space. It isn't.", '先週の訂正をひとつ。万里の長城は宇宙から見えると言いましたが、見えません。'],
      ['cj', 'Not even a little bit?', 'ちょっとも？'],
      ['katt', 'Not with the naked eye. Several of you emailed. Some of you were very polite about it.', '肉眼では無理。何人かからメールが来ました。中にはとても丁寧な方もいました。']
    ],
    choices: ['Correcting a mistake she made on the show.', 'Saying the Great Wall is visible from space.', 'Complaining about rude listeners.'],
    ja: '番組で言った間違いを訂正している。', note: 'Some were polite＝そうでない人も（皮肉）',
    tags: tg(62, 'broadcast', 'humour', [], ['self-repair'])
  },
  {
    id: 'dho-benches', type: 'next', fam: 'lecture', focus: 'stay longer',
    lines: [
      ['tia', 'The study found that adding benches increased foot traffic to local shops by nearly a fifth.', 'ベンチを置くと、地元の店への人通りが5分の1近く増えたという研究があります。'],
      ['curlos', 'Benches? Not bike lanes, not parking? Benches?', 'ベンチ？ 自転車レーンでも駐車場でもなく？ ベンチ？'],
      ['tia', 'People who can sit down stay longer. People who stay longer spend more.', '座れる人は長居する。長居する人はたくさん使うんです。']
    ],
    choices: ['Right, so comfort turns into money.', 'So the shops sell benches now?', 'A fifth of the benches, yes.'],
    ja: 'なるほど、快適さがお金に変わるわけだ。', note: '座る→長居→消費の因果。要約が自然',
    tags: tg(64, 'broadcast', 'literal', [], ['ellipsis'])
  },
  {
    id: 'dho-happy-accident', type: 'gist', fam: 'interview', ask: 'アコースティックに なった 理由は？', focus: 'happy accident',
    lines: [
      ['katt', 'Your new album is entirely acoustic. Was that a deliberate choice?', '新しいアルバムは全編アコースティックですね。意図的な選択ですか？'],
      ['kk-slider', 'Deliberate is generous. The studio flooded, and the only thing that survived was my old guitar.', '意図的、は好意的すぎるね。スタジオが浸水して、無事だったのは古いギターだけだったんだ。'],
      ['katt', 'So the stripped-back sound was—', 'じゃあ、あのシンプルな音は——'],
      ['kk-slider', "A happy accident. Don't tell the critics.", 'うれしい偶然さ。評論家には内緒ね。']
    ],
    choices: ['A flood left him with only one guitar.', 'He planned the sound carefully.', 'The critics asked him to do it.'],
    ja: '浸水でギターが1本しか残らなかったから。', note: 'Deliberate is generous＝計画的とは言えない',
    tags: tg(61, 'broadcast', 'humour', [], ['contraction'])
  },
  {
    id: 'dho-fewer-dates', type: 'next', fam: 'culture', focus: 'Fewer dates',
    lines: [
      ['raymond', 'Final question. If you could change one thing about how we teach history, what would it be?', '最後の質問です。歴史の教え方をひとつ変えられるとしたら、何にしますか？'],
      ['coco', "Fewer dates, more 'why'. Nobody remembers 1066, but everyone remembers a good argument.", '年号を減らして、「なぜ」を増やす。1066年なんて誰も覚えてないけど、いい議論はみんな覚えてる。',
        "Fewer dates, more 'why'. Nobody remembers ten sixty-six, but everyone remembers a good argument."],
      ['raymond', 'I suspect a few historians listening just choked on their tea.', '聞いている歴史家の何人かが、今お茶にむせたと思いますよ。']
    ],
    choices: ["Good. That's exactly the kind of argument I mean.", 'Ten sixty-six, yes, a good date.', "Tea? No thanks, I'm fine."],
    ja: 'いいですね。まさにそういう議論のことです。', note: 'choked on their tea＝驚いて反発。受けて立つ',
    tags: tg(65, 'broadcast', 'humour', [], ['numbers', 'idiom'])
  },
  {
    id: 'dho-heat-island', type: 'gist', fam: 'lecture', ask: '都市が 暑い 理由と 時間帯は？', focus: 'heat island',
    lines: [
      ['saharah', "Why does it always feel hotter in the city than out at my parents' place?", 'どうして都会はいつも、実家のあたりより暑く感じるの？'],
      ['walker', 'The heat island effect. Concrete and roads soak up heat all day and let it out at night.', 'ヒートアイランド現象だよ。コンクリートや道路が一日中熱をため込んで、夜に放出するんだ。'],
      ['saharah', 'So it\'s worse at night, not during the day?', 'じゃあ昼じゃなくて、夜のほうがひどいの？'],
      ['walker', "The gap's biggest at night. That's when the city can be eight degrees warmer.", '差が一番大きいのは夜。そのとき都会は8度も暖かいことがある。']
    ],
    choices: ['Stored heat makes cities warmer, most of all at night.', 'Cities are eight degrees hotter during the day.', "Her parents' place is in the hottest area."],
    ja: 'ためた熱で都市が暖かくなり、特に夜に差が大きい。', note: '差が最大なのは夜。eight は夜の差',
    tags: tg(60, 'broadcast', 'literal', [], ['contraction'])
  }
];

/** The dialogues (25). */
export const DIALOGUES: readonly Item[] = DROWS.map(dialogue);

/** Each item's and dialogue's family (the brief's: news, radio, lecture…), for coverage and the integrator. */
export const FAMILY: Readonly<Record<string, Family>> = family;
