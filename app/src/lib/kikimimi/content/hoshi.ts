// ききみみ クイズ: stage ほし (S4, C1; docs/curriculum.md §3 "S4 ほし": podcasts, news, lectures and debates on
// unfamiliar topics; infer stance; follow argument structure). Content sprint 2026-11-06 (track D, Broadcast, with
// some Work and People). Written by a former NPR producer and EAP lecturer's eye, in American media style (public
// radio news, local TV and traffic, podcasts, TED-style talks, US panels; 2026-11-06): news-reader density, fast
// co-hosts, signposting in lectures, hedged academic claims, the speaker's stance (certainty, irony, concession),
// cultural references and wordplay, dense numbers. Level 7 (content/index.ts folds it into the bank; its villagers'
// voices are in cast.ts CAST).
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
//   Accents: US by default. A few items (`accent-exposure` in their features, ACCENT below, at most about 10%) are a UK
//   or Australian broadcaster in standard international English, no slang: a lecture, a documentary, a forecast.
//   `en` is shown (UK spelling for UK and AU voices), `tts` is spoken when it differs (§9: every number written out,
//   reductions spelled as said). `note` is the trap (≤ 40 字).
import type { RosterId } from '#lib/villagers/roster.ts';
import type { Channel, Item, ItemType, Level, SceneId, SoundMark, Tags } from '../bank.ts';
import { MEAN_ASK, NEXT_ASK, dialogueOf, g, line, single, tg, type DialogueRow } from './build.ts';

/** ほし's level (docs/kikimimi.md "Levels 6 and 7"): 7, above やま (6). */
const HOSHI_LV: Level = 7;

export type Family = 'news' | 'radio' | 'lecture' | 'documentary' | 'debate' | 'interview' | 'talk' | 'culture' | 'stats' | 'stance';

/** The Japanese help (bank.ts Item: cja, why, ctx), optional on every item and dialogue. */
type Help = { cja?: readonly string[]; why?: string; ctx?: string };
const helpOf = ({ cja, why, ctx }: Help): Help => ({ ...(cja && { cja }), ...(why && { why }), ...(ctx && { ctx }) });
type Extra = Help & { tts?: string; focus?: string; ask?: string; scene?: SceneId; channel?: Channel };
type Row = readonly [type: Exclude<ItemType, 'pic'>, id: string, speaker: RosterId, en: string, ja: string, note: string, choices: readonly string[], tags: Tags, extra?: Extra];

// ---- sound marks: every clip with a `tts` (staging.ts's rules: the number as said, the reductions, a swallowed g) ----

/** clip id (an item's, or a dialogue line's `<item>-<n>`) → its sound marks. */
const MARKS: Readonly<Record<string, readonly SoundMark[]>> = {
  'ho-rate-hold': [['say', '4.25%', 'four and a quarter percent']],
  'ho-rail-strike': [['say', '5', 'five'], ['say', '4', 'four'], ['say', '40', 'FORty']],
  'ho-heat-record': [['say', '47', 'forty-seven'], ['say', '1939', 'nineteen thirty-nine']],
  'ho-quake': [['say', '6.3', 'six point three'], ['say', '4:17', 'four seventeen'], ['say', '60', 'SIXty']],
  'ho-manuscript': [['say', '900-year-old', 'nine-hundred-year-old'], ['say', '1970s', 'nineteen seventies']],
  'ho-typhoon': [['say', '90', 'ninety'], ['stress', 'relative']],
  'ho-pod-tangent': [['say', 'going to', 'gonna'], ['say', 'because', "'cause"], ['say', 'and', "an'"]],
  'ho-pod-downloads': [['say', '980,000', 'nine hundred eighty thousand'], g('counting')],
  'ho-cohost-recap': [['say', 'because', "'cause"], ['stress', 'twenty-five']],
  'ho-traffic-m1': [g('heading'), ['say', 'I-95', 'I ninety-five'], ['say', '12', 'twelve'], ['say', 'and', "an'"]],
  'ho-pod-wouldve': [['say', "would've", 'woulda']],
  'ho-wrap-up': [['say', 'going to have to', 'gonna hafta']],
  'ho-anchoring': [['say', '65', 'sixty-five'], ['say', 'UN', 'U N']],
  'ho-empire': [['say', 'AD 117', 'A D one seventeen']],
  'ho-city-growth': [['say', '1900', 'nineteen hundred'], ['say', '2050', 'twenty fifty']],
  'ho-whale-heart': [['say', '400', 'four hundred']],
  'ho-station-night': [['say', '1 a.m.', 'one a.m.']],
  'ho-one-sentence': [['say', 'going to', 'gonna']],
  'ho-school-street': [['say', '8 a.m.', 'eight a.m.']],
  'ho-knee': [['say', 'going to', 'gonna'], ['say', 'and', "'n'"], ['say', 'you', 'ya']],
  'ho-summit': [['say', '2 a.m.', 'two a.m.'], ['say', '11', 'eLEVen'], ['stress', '6 7']],
  'ho-catch-22': [['say', 'Catch-22', 'Catch twenty-two']],
  'ho-fare': [['say', '1st', 'first'], ['say', '$2.75', 'two seventy-five'], ['say', '$2.90', 'two ninety']],
  'ho-unemployment': [['say', '4.3%', 'four point three percent'], ['say', '4.1%', 'four point one'], ['say', '5.2%', 'five point two']],
  'ho-survey': [['say', '62%', 'sixty-two percent'], ['say', '26%', 'twenty-six percent']],
  'ho-one-in-three': [['say', '34%', 'thirty-four percent']],
  'ho-per-person': [['say', '$1.2 billion', 'one point two billion dollars'], ['say', '$18', 'eighteen dollars']],
  'ho-population': [['say', '0.4%', 'zero point four percent'], ['say', '2.3 million', 'two point three million']],
  'ho-marathon': [['say', '40', 'FORty'], ['say', '90', 'NINEty']],
  'ho-rounding': [['say', '1.8%', 'one point eight percent']],
  'ho-rain-warning': [['say', '5', 'five'], ['say', '24', 'twenty-four'], ['say', '6 a.m.', 'six a.m.']],
  'dho-nine-years-1': [['say', 'and', "an'"]],
  'dho-let-me-finish-3': [['say', 'going to', 'gonna']],
  'dho-reported-crime-1': [['say', '11%', 'eLEVen percent']],
  'dho-fewer-dates-2': [['say', '1803', 'eighteen oh three']]
};

/** The deliberate UK and Australian voices (the brief's accent exposure, ≤ ~10% of ほし): tagged `accent-exposure`. */
const ACCENT = new Set(['ho-heat-record', 'ho-two-reasons', 'ho-suggestive', 'ho-penguin-fathers', 'ho-city-growth', 'ho-river-crossing',
  'ho-greatest-respect', 'ho-bright-start', 'dho-hours-quality', 'dho-fossil-bias']);
const exposed = (id: string, tags: Tags): Tags =>
  ACCENT.has(id) ? { ...tags, features: [...(tags.features ?? []), 'accent-exposure'] } : tags;

const family: Record<string, Family> = {};

const item = (fam: Family) => ([type, id, speaker, en, ja, note, choices, tags, x = {}]: Row): Item => {
  family[id] = fam;
  const focus = type === 'word' ? choices[0] : x.focus;
  const ask = x.ask ?? (type === 'mean' ? MEAN_ASK : type === 'next' ? NEXT_ASK : undefined);
  return {
    ...single(HOSHI_LV, type, id, speaker, en, ja, note, choices, exposed(id, tags)),
    ...(x.tts && { tts: x.tts }), ...(focus && { focus }), ...(ask && { ask }), ...(x.scene && { scene: x.scene }), ...(x.channel && { channel: x.channel }),
    ...(MARKS[id] && { marks: MARKS[id] }),
    ...helpOf(x)
  };
};

// ---- news bulletins and headlines -----------------------------------------------------------------------------------

const NEWS: readonly Row[] = [
  ['num', 'ho-rate-hold', 'lopez', 'The Fed held rates at 4.25% today, but two of its twelve voting members wanted a cut, up from one at the last meeting.',
    'FRBは本日、金利を4.25%に据え置きましたが、投票権を持つ12人のうち2人が利下げを求めました。前回の会合では1人でした。',
    'up from one＝前回は1人。今回の人数を聞く',
    ['2人', '1人', '12人'],
    tg(62, 'broadcast', 'literal', [], ['numbers']),
    { ask: '利下げを 求めたのは 何人？', focus: 'two of its twelve voting members', tts: 'The Fed held rates at four and a quarter percent today, but two of its twelve voting members wanted a cut, up from one at the last meeting.',
      cja: ['2人', '1人', '12人'], why: 'up from one は「前回の1人から増えて」。今回利下げを求めたのは two で2人です。12人は投票権を持つ全体の人数。', ctx: '経済ニュースで、FRBの金利発表を伝えています' }],
  ['num', 'ho-rail-strike', 'beau', 'The school board voted 5 to 4 last night to push the start of the high school day back 40 minutes, beginning next fall.',
    '教育委員会は昨夜、5対4で、来年の秋から高校の始業時刻を40分遅らせることを決めました。',
    'FORty と fourTEEN の強勢。5対4は票数',
    ['40分', '14分', '4分'],
    tg(62, 'broadcast', 'literal', [], ['teen-ty', 'numbers']),
    { ask: '始業は 何分 おそくなる？', focus: '40 minutes', tts: 'The school board voted five to four last night to push the start of the high school day back forty minutes, beginning next fall.',
      cja: ['40分', '14分', '4分'], why: 'FORty は頭に、fourTEEN は後ろに強勢。5対4は投票の結果で、始業を遅らせるのは40分です。', ctx: '地元のニュースで、教育委員会の決定を伝えています' }],
  ['gist', 'ho-heat-record', 'phoebe', 'Temperatures in parts of western Sydney topped 47 degrees yesterday, the highest since records began in 1939. Hospitals reported a surge in heat-related admissions.',
    '昨日、シドニー西部の一部で気温が47度を超え、1939年の観測開始以来の最高となりました。病院では熱中症などによる入院が急増しました。',
    '1939年は観測開始の年。火事や事件の年ではない',
    ['A record heatwave and its effect on hospitals.', 'A fire that started in 1939.', 'Hospitals running out of beds in winter.'],
    tg(60, 'broadcast', 'literal', [], ['numbers']),
    { ask: 'この ニュースの 中心は？', focus: 'the highest since records began', tts: 'Temperatures in parts of western Sydney topped forty-seven degrees yesterday, the highest since records began in nineteen thirty-nine. Hospitals reported a surge in heat-related admissions.',
      cja: ['記録的な熱波と、病院への影響', '1939年に起きた火事', '冬に病院のベッドが足りなくなること'], why: 'topped 47 degrees と the highest since records began で記録的な暑さ、後半は入院の急増。1939年は観測が始まった年です。', ctx: 'オーストラリアのラジオのニュースで' }],
  ['mean', 'ho-markets-shrug', 'henry', 'Markets largely shrugged off the jobs report, which, to be fair, was neither as strong as the bulls had hoped nor as weak as the bears had feared.',
    '市場は雇用統計をほぼ材料視しませんでした。強気派の期待ほど強くも、弱気派の心配ほど弱くもなかったのです。 → つまり、予想の範囲内だったので相場はあまり動かなかった。',
    'shrug off＝受け流す。neither A nor B＝どっちつかず',
    ['The report was middling, so prices barely moved.', 'Markets fell sharply after a weak report.', 'Investors ignored the report because it came out late.'],
    tg(62, 'broadcast', 'literal', [], ['idiom']),
    { focus: 'shrugged off',
      cja: ['雇用統計は可もなく不可もなく、相場はほとんど動かなかった', '弱い統計を受けて、市場が急落した', '発表が遅れたので、投資家は無視した'], why: 'shrug off は「受け流す」。neither as strong… nor as weak… は「強くも弱くもない」で、予想どおりだから動かなかったという流れです。', ctx: '経済ニュースで、雇用統計への反応を' }],
  ['gist', 'ho-bulletin-correction', 'francine', "And a correction to an earlier report: the new bridge opens in March, not May as we reported, though the toll still hasn't been set.",
    '先ほどのニュースの訂正です。新しい橋の開通は、お伝えした5月ではなく3月です。ただし通行料はまだ決まっていません。',
    'not May は誤報の方。通行料は未定のまま',
    ['The month the bridge opens.', 'The price of the toll.', 'Where the bridge will be built.'],
    tg(62, 'broadcast', 'literal', [], ['self-repair', 'contrast', 'contraction']),
    { ask: '訂正された 内容は？', focus: 'not May as we reported',
      cja: ['橋が開通する月', '通行料の金額', '橋を建設する場所'], why: '訂正の中身は not May as we reported、つまり開通は5月ではなく3月。通行料は still hasn\'t been set で、まだ決まっていません。', ctx: 'ニュースの途中で、キャスターが' }],
  ['num', 'ho-quake', 'lopez', 'The magnitude 6.3 quake struck at 4:17 local time, about 60 miles off the coast. No tsunami warning has been issued.',
    'マグニチュード6.3の地震が現地時間4時17分、沖合およそ60マイルで発生しました。津波警報は出ていません。',
    'sixty は距離。six point three が規模',
    ['6.3', '6.0', '4.1'],
    tg(62, 'broadcast', 'literal', [], ['numbers']),
    { ask: 'マグニチュードは？', focus: 'magnitude 6.3', tts: 'The magnitude six point three quake struck at four seventeen local time, about sixty miles off the coast. No tsunami warning has been issued.',
      cja: ['6.3', '6.0', '4.1'], why: 'magnitude の直後の six point three が規模。four seventeen は発生時刻、sixty は沖合までの距離（マイル）です。', ctx: '速報ニュースで、地震の情報を伝えています' }],
  ['mean', 'ho-trains-restored', 'kabuki', "The Harvest Festival parade is back on after this morning's storms. However, the route's been cut in half, and it'll skip Main Street entirely.",
    '収穫祭のパレードは、今朝の嵐のあと、実施されることになりました。ただしルートは半分に短縮され、メインストリートは通りません。 → つまり、パレードはあるが、短いルートになる。',
    'back on＝やっぱり実施。However 以降が変更点',
    ['The parade is happening, but on a shorter route.', 'The parade is canceled because of the storms.', 'The parade will go down Main Street as usual.'],
    tg(62, 'broadcast', 'literal', [], ['idiom', 'contraction']),
    { focus: 'is back on',
      cja: ['パレードは行われるが、ルートが短くなる', '嵐のため、パレードは中止になる', 'パレードはいつもどおりメインストリートを通る'], why: 'is back on は「やっぱり実施する」。中止ではありません。However 以降で、ルートが半分になりメインストリートは通らないと伝えています。', ctx: '地元ラジオで、お祭りの情報を伝えています' }],
  ['gist', 'ho-manuscript', 'wolfgang', "A 900-year-old manuscript missing since the 1970s has turned up at an estate sale in Ohio. The library, which had long given it up for lost, says it'll go on display next spring.",
    '1970年代から行方不明だった900年前の写本が、オハイオ州の遺品セールで見つかりました。とうに失われたと諦めていた図書館は、来春公開するとしています。',
    'turn up＝見つかる。give up for lost＝諦める',
    ['A long-lost manuscript has been found.', 'A library in Ohio is closing down.', 'A manuscript was stolen and sold in the 1970s.'],
    tg(62, 'broadcast', 'literal', [], ['idiom', 'numbers']),
    { ask: 'どんな ニュース？', focus: 'turned up', tts: "A nine-hundred-year-old manuscript missing since the nineteen seventies has turned up at an estate sale in Ohio. The library, which had long given it up for lost, says it'll go on display next spring.",
      cja: ['長く失われていた写本が見つかった', 'オハイオの図書館が閉館する', '1970年代に写本が盗まれて売られた'], why: 'turned up は「ひょっこり見つかった」。missing since the 1970s は行方不明になった時期で、盗難の話ではありません。', ctx: 'ニュースの最後の、明るい話題のコーナーで' }],
  ['mean', 'ho-typhoon', 'label', "The typhoon is expected to weaken before landfall, but forecasters stress that 'weaker' is relative: gusts of over 90 miles an hour remain possible.",
    '台風は上陸前に弱まる見込みですが、「弱まる」はあくまで相対的だと予報士は強調しています。時速90マイル（約145キロ）を超える突風もありえます。 → つまり、勢力は落ちても依然として危険。',
    '「弱まる」は相対的。油断するなという強調',
    ['It will lose strength, but it could still be very dangerous.', "It's no longer a serious threat.", "It's getting stronger as it gets closer."],
    tg(60, 'broadcast', 'literal', [], ['contrast']),
    { focus: "'weaker' is relative", tts: "The typhoon is expected to weaken before landfall, but forecasters stress that 'weaker' is relative: gusts of over ninety miles an hour remain possible.",
      cja: ['勢力は弱まるが、まだとても危険かもしれない', 'もう深刻な脅威ではない', '近づくにつれて強くなっている'], why: 'weaken だけ聞くと安心しそうですが、\'weaker\' is relative と強調し、時速90マイル超の突風もありうると警告しています。', ctx: '天気ニュースで、台風の進路を伝えています' }],
  ['gist', 'ho-upset', 'gayle', "In one of the biggest upsets in US Open history, an unseeded qualifier has knocked out the defending champion in straight sets. Before this week, she'd never won a match at a major.",
    '全米オープン史上屈指の番狂わせです。ノーシードの予選勝ち上がり選手が、前回王者にストレート勝ちしました。彼女は今週まで四大大会で1勝もしたことがありませんでした。',
    'upset＝番狂わせ。straight sets で勝ったのは無名の方',
    ['A little-known player beat the champion.', 'The champion won easily in straight sets.', 'The qualifier has won several majors before.'],
    tg(62, 'broadcast', 'literal', [], ['idiom', 'contraction']),
    { ask: 'なにが 意外だった？', focus: 'biggest upsets',
      cja: ['無名の選手が王者を破った', '王者がストレートで楽勝した', '予選上がりの選手は四大大会で何度も勝っている'], why: 'upset は「番狂わせ」。knocked out the defending champion で、負けたのは前回王者。勝ったのはノーシードの予選上がりの選手です。', ctx: 'スポーツニュースで、テニスの結果を' }],
  ['next', 'ho-news-segue', 'lopez', "That's the latest on the stadium vote. Now, after a weekend of torrential rain, what does the week ahead look like? Here's our meteorologist.",
    'スタジアムの住民投票については以上です。さて、週末の豪雨のあと、今週はどうなるのでしょう。気象予報士です。',
    "Here's our meteorologist で話者交代。次は天気",
    ["Thanks. Well, the good news is it's drying out by Wednesday.", 'Thanks. The stadium vote passed by a wide margin.', "Here's our meteorologist with the week ahead."],
    tg(62, 'broadcast', 'literal', [], ['contraction']),
    { focus: "Here's our meteorologist",
      cja: ['ありがとう。いい知らせは、水曜までに雨が上がることです', 'ありがとう。スタジアムの住民投票は大差で可決されました', '今週の天気は、気象予報士がお伝えします'], why: 'Here\'s our meteorologist で予報士に話を渡しています。予報士が Thanks と受けて今週の天気を話すのが自然。住民投票の話はもう終わりました。', ctx: '夕方のニュースで、キャスターが話題を変えます' }]
];

// ---- radio and podcast talk -----------------------------------------------------------------------------------------

const RADIO: readonly Row[] = [
  ['mean', 'ho-pod-tangent', 'bunnie', "Okay, I'm going to stop myself there, because if I start on airport sushi we'll be here all day, and we have an actual guest.",
    'はい、このへんでやめとくね。空港のお寿司の話を始めたら一日終わっちゃうし、ちゃんとゲストも来てるから。 → つまり、脱線を切り上げてインタビューに移る。',
    'stop myself＝脱線をやめる。actual guest が本題',
    ["She's cutting her own tangent short to get to the guest.", 'She wants to spend the episode on airport sushi.', 'The guest has canceled, so she keeps talking.'],
    tg(63, 'broadcast', 'humour', [], ['gonna', 'weak-form']),
    { focus: 'stop myself there', tts: "Okay, I'm gonna stop myself there, 'cause if I start on airport sushi we'll be here all day, an' we have an actual guest.",
      cja: ['ゲストの話に移るため、自分の脱線を切り上げている', '今回は空港のお寿司の話をずっとしたい', 'ゲストが来られなくなったので、しゃべり続ける'], why: 'stop myself there は「このへんでやめる」。we\'ll be here all day は「終わらなくなる」の冗談で、ゲストがいるので本題へ移ります。', ctx: 'ポッドキャストの冒頭で、司会者が' }],
  ['mean', 'ho-dj-rain', 'kk-slider', 'And that was the third song about rain in a row, which, given the forecast, is either very clever programming or a cry for help.',
    '以上、3曲連続で雨の歌でした。天気予報を考えると、よほど気の利いた選曲か、助けを求める叫びかのどっちかだね。 → つまり、どんよりした天気に合わせた選曲を自虐的にからかっている。',
    'a cry for help は冗談。雨の曲が続いた自虐',
    ["He's joking that the playlist matches the gloomy weather.", "He's apologizing for a technical problem.", "He's asking listeners to call in for help."],
    tg(61, 'broadcast', 'humour', [], ['idiom']),
    { focus: 'a cry for help',
      cja: ['どんよりした天気に選曲が合ってしまったと冗談を言っている', '機材トラブルを謝っている', 'リスナーに助けの電話をしてほしいと頼んでいる'], why: 'clever programming or a cry for help は自虐ジョーク。雨の予報の日に雨の歌を3曲続けたことを笑っています。本当に助けを求めてはいません。', ctx: 'ラジオの音楽番組で、DJが曲のあとに' }],
  ['num', 'ho-pod-downloads', 'cj', "We hit a million downloads last month. Well, 980,000, but who's counting?",
    '先月100万ダウンロードを達成しました。まあ、正確には98万だけど、誰も数えてないでしょ？',
    "Well, の後が正確な数。who's counting? は冗談",
    ['980,000', '1,000,000', '918,000'],
    tg(63, 'broadcast', 'humour', [], ['self-repair', 'numbers']),
    { ask: '実際の ダウンロード数は？', focus: '980,000', tts: "We hit a million downloads last month. Well, nine hundred eighty thousand, but who's countin'?",
      cja: ['98万', '100万', '91万8千'], why: 'a million は盛った数字で、Well, の後の nine hundred eighty thousand が実数。who\'s counting? は「細かいことはいいよね」', ctx: 'ポッドキャストで、司会者が近況を報告' }],
  ['mean', 'ho-cohost-recap', 'frett', "Oh, sure, because your last 'quick five-minute recap' ran twenty-five minutes.",
    'ああ、そうだね。前回の「さくっと5分のおさらい」は25分かかったけどな。 → つまり、相方が手短にまとめるとは思っていない。',
    '皮肉。前回5分と言って25分かかった',
    ["He doubts his co-host will keep it short.", 'He wants a twenty-five-minute recap this time.', 'He thinks the last recap was too short.'],
    tg(63, 'broadcast', 'sarcasm', [], ['intonation']),
    { focus: 'ran twenty-five minutes', tts: "Oh, sure, 'cause your last 'quick five-minute recap' ran twenty-five minutes.",
      cja: ['相方が手短にまとめるとは思っていない', '今回は25分のおさらいをしてほしい', '前回のおさらいは短すぎたと思っている'], why: 'Oh, sure は皮肉の入り口。「5分」と言った前回のおさらいが25分かかったと指摘して、今回も短くは済まないだろうと突っ込んでいます。', ctx: 'ポッドキャストで、相方が「5分でおさらい」と言うと' }],
  ['gist', 'ho-traffic-m1', 'lucky', "If you're heading north on I-95, don't. There's a tractor-trailer on its side just past exit 12, two lanes are closed, and we're hearing it'll be a couple of hours.",
    'I-95を北へ向かう予定の方、やめておきましょう。12番出口の先で大型トレーラーが横転し、2車線が通行止め。解消まで2時間ほどかかるそうです。',
    "don't＝行くな。2は車線、12は出口の番号",
    ['Avoid the highway heading north.', 'Get off the highway at exit two.', 'Drive slowly past the truck.'],
    tg(62, 'broadcast', 'literal', [], ['ellipsis', 'numbers']),
    { ask: 'ドライバーへの アドバイスは？', focus: "don't", tts: "If you're headin' north on I ninety-five, don't. There's a tractor-trailer on its side just past exit twelve, two lanes are closed, an' we're hearing it'll be a couple of hours.",
      cja: ['北へ向かう高速道路を避ける', '2番出口で高速を降りる', 'トラックの横をゆっくり通る'], why: 'heading north on I-95, don\'t. の don\'t は「行くな」。12番出口の先で横転事故、2車線が通行止めで数時間かかるので、避けるようにという助言です。', ctx: '朝のラジオの交通情報で' }],
  ['reply', 'ho-callin-line', 'kk-slider', "Next up on the postgame show, Denise on the line from Phoenix, and she wants to talk bullpen. Denise, you're on the air. Denise? I think we lost her.",
    '試合後の番組、次はフェニックスのデニースさん。リリーフ陣について話したいそうです。デニースさん、オンエア中ですよ。デニースさん？ 切れちゃったかな。 →「すみません、います！ 聞こえますか？」',
    'on the line＝電話がつながって。行列ではない',
    ["Sorry, sorry, I'm here! Can you hear me now?", 'Yes, the line was really long.', 'I lost it on the train, actually.'],
    tg(61, 'broadcast', 'literal', [], ['contraction']),
    { cja: ['すみません、います！ 今度は聞こえますか？', 'はい、列がすごく長かったです', '実は電車でなくしちゃって'], why: 'on the line は「電話がつながって」。I think we lost her（切れたかな）なので、本人が慌てて「います」と返すのが自然。line は「列」ではありません。', ctx: 'スポーツラジオの電話コーナーで' }],
  ['reply', 'ho-pod-guest', 'pekoe', 'So before we get into the book, can I just say, the title alone got me.',
    '本の話に入る前にひとこと言わせて。タイトルだけでやられちゃった。 →「ありがとう。第1章を書くより、タイトル決めのほうが時間かかったんです」',
    'got me＝心をつかまれた。get into＝本題に入る',
    ['Ha, thank you. It took longer to choose than the first chapter took to write.', 'Sure, I can get the book for you.', 'Yes, it was alone on the shelf.'],
    tg(63, 'broadcast', 'ritual', [], ['idiom']),
    { cja: ['はは、ありがとう。第1章を書くより、タイトル決めのほうが時間がかかりました', 'いいですよ、本を取ってきますね', 'はい、棚に一冊だけありました'], why: 'the title alone got me は「タイトルだけで心をつかまれた」という褒め言葉。お礼と小さな裏話で返すのが自然です。alone を「ひとりで」と取るのが罠。', ctx: 'ポッドキャストで、作家をゲストに迎えて' }],
  ['reply', 'ho-pod-mic', 'audie', 'Wait, is my mic on? Have I been talking to myself this whole time?',
    'ちょっと待って、マイク入ってる？ ずっと独り言しゃべってた？ →「入ってるよ、大丈夫。全部聞こえてた」',
    'this whole time＝ずっと。時間の長さを聞いていない',
    ["You're on, don't worry. We heard every word.", 'Talk to yourself, then.', 'The whole time? About ten minutes.'],
    tg(39, 'broadcast', 'literal', ['video'], ['contraction']),
    { cja: ['入ってるよ、大丈夫。全部聞こえてた', 'じゃあ、独り言を言えば', 'ずっと？ 10分くらいかな'], why: 'this whole time は「ずっと」。独り言だったかと不安がる相手に、マイクは入っていると安心させるのが自然。時間の長さを答えるのはずれています。', ctx: 'ビデオ通話での番組収録中に' }],
  ['reply', 'ho-washing-machine', 'kk-slider', "Before we start recording, you sound like you're calling in from inside a washing machine.",
    '収録を始める前に。洗濯機の中から参加してるみたいな音ですよ。 →「すみません、食洗機です。ドアを閉めてきます。これでどうですか？」',
    '音がひどいという冗談。実際の洗濯の話ではない',
    ["Sorry, that's my dishwasher. Let me close the door. Better?", "Yes, I'm doing my laundry.", 'No, I always call from home.'],
    tg(63, 'broadcast', 'humour', ['video']),
    { cja: ['すみません、食洗機なんです。ドアを閉めますね。どうですか？', 'はい、洗濯しています', 'いいえ、いつも家からかけています'], why: '洗濯機の中から、は「音がひどい」という冗談。雑音の原因を謝って直すのが自然です。本当に洗濯の話をしているわけではありません。', ctx: 'オンラインでの番組収録の前に' }],
  ['word', 'ho-pod-wouldve', 'audie', "Honestly, if you'd told me five years ago, I would've laughed in your face.",
    '正直、5年前にそう言われてたら、鼻で笑ってたと思う。',
    "woulda＝would've。n't の有無を聞く",
    ["would've", "wouldn't have", "might've"],
    tg(63, 'broadcast', 'literal', [], ['contraction', 'weak-form']),
    { tts: "Honestly, if you'd told me five years ago, I woulda laughed in your face.",
      cja: ['笑っていただろう', '笑わなかっただろう', '笑っていたかもしれない'], why: 'woulda は would\'ve の発音。if you\'d told me… の仮定に続いて「鼻で笑っただろう」。wouldn\'t have なら n\'t の音が残ります。', ctx: 'ポッドキャストで、ゲストが成功を振り返って' }],
  ['word', 'ho-wrap-up', 'cj', "We're going to have to wrap it up there, folks.",
    'みなさん、今日はこのへんで締めないといけません。',
    "gonna hafta＝going to have to。we'll とは別",
    ["We're going to have to", "We'll have to", "We'd have to"],
    tg(63, 'broadcast', 'formula', [], ['gonna', 'weak-form']),
    { tts: "We're gonna hafta wrap it up there, folks.",
      cja: ['締めないといけないようです', '締めないといけません', '（それなら）締めないといけないでしょう'], why: 'gonna hafta は going to have to の縮約で、番組を締める定番フレーズ。we\'ll have to や we\'d have to とは音の数が違います。', ctx: 'ラジオ番組の終わりに、司会者が' }],
  ['word', 'ho-wasnt-worst', 'bunnie', "It wasn't the worst trip I've ever had, let's put it that way.",
    'これまでで最悪の旅ではなかった、とだけ言っておこうかな。',
    "wasn't の t は弱い。言外に「かなりひどかった」",
    ["wasn't", 'was', "isn't"],
    tg(63, 'broadcast', 'understatement', [], ['contraction']),
    { cja: ['最悪ではなかった', '最悪だった', '最悪ではない'], why: 'wasn\'t の t は弱くても、n の音で否定とわかります。let\'s put it that way が付くと「最悪ではない＝かなりひどかった」という控えめな言い方。', ctx: '旅行ポッドキャストで、司会者が' }],
  ['next', 'ho-sponsor', 'cj', "Before we get to your questions, a quick word from this week's sponsor. And no, it's not the meal kit again.",
    'リスナーの質問の前に、今週のスポンサーからひとこと。いや、またミールキットじゃないよ。',
    'a word from our sponsor の次は広告の中身',
    ["This week, it's a sleep app, and I genuinely use it.", 'Our first question comes from a listener in Denver.', 'The meal kit is back for a third week.'],
    tg(63, 'broadcast', 'humour', [], ['contraction']),
    { focus: "a quick word from this week's sponsor",
      cja: ['今週は睡眠アプリ。本当に使ってるんです', '最初の質問はデンバーのリスナーからです', 'ミールキットが3週連続で登場です'], why: 'sponsor の話の次は広告の中身。not the meal kit again（またミールキットではない）なので、別のスポンサーの紹介が続きます。', ctx: 'ポッドキャストの途中で、司会者が' }]
];

// ---- mini-lectures and explanations ---------------------------------------------------------------------------------

const LECTURE: readonly Row[] = [
  ['next', 'ho-two-reasons', 'kidd', 'There are, broadly, two reasons the experiment failed. The first, frankly, is that the sample was far too small.',
    '実験が失敗した理由は、大きく分けて二つあります。一つ目は、率直に言って、サンプルが小さすぎたことです。',
    'The first…と来たら次は The second',
    ['The second, and more interesting, is how the questions were worded.', 'The first reason, again, is the sample size.', 'In conclusion, the experiment was a success.'],
    tg(64, 'broadcast', 'literal'),
    { focus: 'The first, frankly',
      cja: ['二つ目は、こちらのほうが興味深いのですが、質問の言い回しです', '一つ目の理由は、繰り返しますが、サンプルの大きさです', '結論として、実験は成功でした'], why: 'two reasons と予告して The first を述べたので、次は The second が来るはず。講義の構成を示す言葉を聞くと、次が読めます。', ctx: 'イギリスの大学の講義で' }],
  ['mean', 'ho-coffee-wealth', 'shep', 'Now, people who drink more coffee do tend to live longer. But before you order a third cup, remember that coffee drinkers also tend to be wealthier.',
    'コーヒーをよく飲む人は、確かに長生きする傾向があります。でも3杯目を頼む前に、コーヒー好きは裕福な傾向もあることを思い出してください。 → つまり、長寿の理由はコーヒーではなく収入かもしれない。',
    '相関と因果の区別。But 以降が講師の主張',
    ['The link may come from income, not the coffee itself.', 'Drinking three cups a day helps you live longer.', 'Wealthy people drink less coffee.'],
    tg(19, 'broadcast', 'hedge', [], ['contrast']),
    { focus: 'also tend to be wealthier',
      cja: ['関連は、コーヒーそのものではなく収入から来ているかもしれない', '1日3杯飲むと長生きできる', '裕福な人はコーヒーをあまり飲まない'], why: '前半は「確かに長生きの傾向」、But 以降で「コーヒー好きは裕福でもある」と別の要因を示します。相関と因果は別、という注意です。', ctx: '健康についての公開講座で' }],
  ['gist', 'ho-anchoring', 'marina', 'In one study, people spun a wheel that landed on 10 or 65, then guessed how many countries in Africa were in the UN. Those who saw 65 guessed far higher. The number was random, and still it stuck.',
    'ある研究で、10か65で止まるルーレットを回してから、国連に加盟するアフリカの国の数を推測してもらいました。65を見た人のほうがずっと高く答えました。数字はでたらめなのに、頭に残ったのです。',
    'アンカリング効果。無関係な数字でも推測が動く',
    ['A random number can bias our estimates.', 'Most people know the UN figures well.', 'People who spin wheels guess lower.'],
    tg(64, 'broadcast', 'literal', [], ['numbers']),
    { ask: '研究で わかったことは？', focus: 'still it stuck', tts: 'In one study, people spun a wheel that landed on ten or sixty-five, then guessed how many countries in Africa were in the U N. Those who saw sixty-five guessed far higher. The number was random, and still it stuck.',
      cja: ['でたらめな数字が、推測をゆがめることがある', 'たいていの人は国連の数字をよく知っている', 'ルーレットを回した人は低めに推測する'], why: '65を見た人ほど高く推測し、The number was random。無関係な数字に引きずられるアンカリング効果の話です。still it stuck は「それでも頭に残った」。', ctx: '心理学の入門講義で' }],
  ['word', 'ho-photography', 'octavian', 'The history of photography begins a lot earlier than most people think.',
    '写真の歴史は、多くの人が思っているよりずっと早く始まります。',
    'phoTOgraphy は第2音節に強勢。カタカナと違う',
    ['photography', 'photographers', 'photographs'],
    tg(64, 'broadcast', 'literal', [], ['katakana', 'intonation']),
    { cja: ['写真（という分野）', '写真家たち', '写真（の作品）'], why: 'phoTOgraphy は2音節目、PHOtograph は1音節目に強勢。カタカナの「フォトグラフィー」のつもりで聞くと、強勢の位置でつまずきます。', ctx: '写真の歴史の講義の冒頭で' }],
  ['mean', 'ho-suggestive', 'curlos', "The evidence is, I'd say, suggestive rather than conclusive, so I'd be wary of anyone telling you the matter is settled.",
    '証拠は、決定的というより示唆的と言えるでしょう。ですから「もう決着済み」と言う人には用心したほうがいいですね。 → つまり、まだ結論は出ていない。',
    'suggestive rather than conclusive＝決め手なし',
    ['The question is still open.', 'The evidence proves the theory.', 'Nobody has studied this yet.'],
    tg(64, 'broadcast', 'hedge', [], ['contrast']),
    { focus: 'suggestive rather than conclusive',
      cja: ['まだ結論は出ていない', '証拠がその説を証明している', 'まだ誰も研究していない'], why: 'suggestive rather than conclusive は「示唆的だが決定的ではない」。決着済みと言う人には用心して、と続くので、まだ結論は出ていません。', ctx: '科学番組で、研究者が' }],
  ['num', 'ho-empire', 'zucker', "At its height, around AD 117, the Roman Empire covered nearly two million square miles and perhaps a fifth of the world's population.",
    '最盛期の西暦117年ごろ、ローマ帝国はおよそ200万平方マイル（約500万平方キロ）に広がり、世界人口の5分の1ほどを抱えていました。',
    'one seventeen＝117。年号は区切って読む',
    ['西暦117年', '西暦170年', '西暦500年'],
    tg(64, 'broadcast', 'literal', [], ['teen-ty', 'numbers']),
    { ask: '最盛期は 西暦 何年ごろ？', focus: 'AD 117', tts: "At its height, around A D one seventeen, the Roman Empire covered nearly two million square miles and perhaps a fifth of the world's population.",
      cja: ['西暦117年', '西暦170年', '西暦500年'], why: 'one seventeen は年号の読み方で117。seventy（170）と取り違えないように。two million は面積、a fifth は人口の割合です。', ctx: '歴史の講義で、ローマ帝国について' }],
  ['gist', 'ho-door-button', 'tia', "Why do elevator 'door close' buttons often do nothing? In many buildings they're disabled, so the doors stay open long enough for wheelchair users. The button stays because pressing it makes us feel in control.",
    'エレベーターの「閉」ボタンが効かないことが多いのはなぜでしょう。多くの建物では無効にされていて、車いすの人のために扉が十分開いたままになります。それでもボタンが残るのは、押すと自分で操作している気分になれるからです。',
    'いわゆるプラシーボボタン。押す満足感のために残る',
    ['Some buttons exist mainly to make us feel in control.', 'Elevator doors close faster when you press the button.', 'Wheelchair users asked for the button to be removed.'],
    tg(64, 'broadcast', 'literal', [], ['contraction']),
    { ask: '講義の ポイントは？', focus: 'feel in control',
      cja: ['主に、自分で操作している気分にさせるために残っているボタンもある', 'ボタンを押すと扉が早く閉まる', '車いすの人がボタンの撤去を求めた'], why: '多くの建物で無効にされているのに残るのは、pressing it makes us feel in control だから。押せば早く閉まる、という思い込みが罠です。', ctx: '身近な科学の講座で' }],
  ['mean', 'ho-rent-control', 'shep', "Rent control is great news if you already have an apartment. It's less great if you're the one looking for one.",
    '家賃規制は、すでに部屋を借りている人には朗報です。部屋を探している側だと、そうでもありません。 → つまり、今の借り手は得をするが、新しく探すのは難しくなりうる。',
    'less great＝控えめな「よくない」',
    ['It helps current tenants but can make finding a place harder.', "It's good news for everyone looking for a home.", 'It only helps people who own apartments.'],
    tg(64, 'broadcast', 'understatement', [], ['contrast']),
    { focus: 'less great',
      cja: ['今の借り手には助けになるが、新しく部屋を探すのは難しくなりうる', '家を探しているすべての人に朗報だ', 'アパートを所有している人だけが得をする'], why: '今部屋がある人には great news、探す側には less great という対比。less great は「あまりよくない」の控えめな言い方です。', ctx: '経済学の講義で、家賃規制について' }],
  ['next', 'ho-inflation-cure', 'fang', "So far we've looked at what causes inflation. What I want to turn to now is the cure, and why it's often worse than the disease.",
    'ここまでインフレの原因を見てきました。ここからは治療法、そしてそれがなぜ病そのものより悪いことが多いのかに移ります。',
    'turn to now＝話題の転換。次は治療策の話',
    ["Let's start with the most common tool: raising interest rates.", 'Inflation, as we said, is caused by rising prices.', "That's why the disease spread so quickly."],
    tg(64, 'broadcast', 'literal', [], ['idiom']),
    { focus: 'turn to now',
      cja: ['まず最もよく使われる手段、利上げから見ていきましょう', 'インフレは、先ほど言ったように物価上昇で起こります', 'だから病気があんなに早く広がったのです'], why: 'turn to now is the cure で、話題を「治療策」に移すと予告。次は具体的な対策の話が自然です。disease は比喩で、本物の病気ではありません。', ctx: '経済学の講義で、教授が' }],
  ['word', 'ho-not-unlikely', 'reneigh', "It's not unlikely that the two species met at some point.",
    'その2つの種がどこかの時点で出会っていた可能性は十分にあります。',
    'not unlikely＝十分ありうる。二重否定',
    ['not unlikely', 'hardly likely', 'not likely'],
    tg(64, 'broadcast', 'hedge', [], ['contraction']),
    { cja: ['ありえなくはない（十分ありうる）', 'まずありえない', 'ありそうにない'], why: 'not unlikely は二重否定で「十分ありうる」。not likely は「ありそうにない」で逆の意味です。un の音を聞き分けます。', ctx: '人類の進化についての講義で' }],
  ['gist', 'ho-sleep-clean', 'marina', "Contrary to popular belief, the brain isn't resting while you sleep. During deep sleep, fluid washes through it far more than during the day, clearing out waste that builds up while we're awake.",
    '通説に反して、脳は眠っている間に休んでいるわけではありません。深い眠りの間、脳内を液体が日中よりずっと多く流れ、起きている間にたまった老廃物を洗い流すのです。',
    'Contrary to popular belief＝通説に反して',
    ['Sleep helps the brain clean itself.', 'The brain switches off during deep sleep.', 'Drinking water before bed helps you sleep.'],
    tg(19, 'broadcast', 'literal', [], ['contraction']),
    { ask: '講義の 主張は？', focus: 'Contrary to popular belief',
      cja: ['睡眠は、脳が自分を掃除するのを助ける', '深い眠りの間、脳は止まっている', '寝る前に水を飲むとよく眠れる'], why: 'Contrary to popular belief は通説をひっくり返す合図。深い眠りの間に液体が流れて老廃物を洗い流す、つまり脳の掃除の話です。', ctx: '睡眠科学の公開講座で' }]
];

// ---- documentary narration ------------------------------------------------------------------------------------------

const DOCUMENTARY: readonly Row[] = [
  ['mean', 'ho-penguin-fathers', 'tex', 'The males will stand here, through the darkest months, without eating. It is, by any measure, an extraordinary commitment to fatherhood.',
    'オスたちは一番暗い数か月間、何も食べずにここに立ち続けます。どう見ても、並外れた父親としての献身です。 → つまり、オスは子のために何か月も絶食に耐える。',
    'by any measure＝どう見ても。without eating が要点',
    ['The males go hungry for months for their young.', 'The males leave their young during the dark months.', 'The males eat more than usual in winter.'],
    tg(64, 'broadcast', 'literal', [], ['idiom']),
    { focus: 'without eating',
      cja: ['オスは子のために何か月も絶食に耐える', 'オスは暗い季節に子を置いていく', 'オスは冬にふだんより多く食べる'], why: '要点は without eating。オスは一番暗い数か月間、何も食べずに立ち続けます。by any measure は「どう見ても」で、献身ぶりを強調しています。', ctx: '南極の自然ドキュメンタリーで' }],
  ['gist', 'ho-city-growth', 'charlise', "In 1900, one person in eight lived in a city. Today it's more than half, and by 2050, if current trends hold, it'll be closer to seven in ten.",
    '1900年には、都市に住むのは8人に1人でした。今では半数以上。このままの傾向なら、2050年には10人に7人近くになります。',
    '1900年→今→2050年の推移。都市離れではない',
    ['The rapid growth of city living.', 'What city life was like in 1900.', 'Why people are leaving cities.'],
    tg(64, 'broadcast', 'literal', [], ['numbers']),
    { ask: 'この ナレーションの テーマは？', focus: 'if current trends hold', tts: "In nineteen hundred, one person in eight lived in a city. Today it's more than half, and by twenty fifty, if current trends hold, it'll be closer to seven in ten.",
      cja: ['都市に住む人が急速に増えていること', '1900年の都市生活の様子', '人々が都市を離れる理由'], why: '1900年は8人に1人、今は半数以上、2050年には10人に7人近く。数字の推移で都市化の進行を伝えています。1900年の暮らしの話ではありません。', ctx: 'イギリスのドキュメンタリー番組で' }],
  ['num', 'ho-whale-heart', 'hamlet', "A blue whale's heart weighs around 400 pounds, roughly as much as a fridge, and on a deep dive it can beat as few as two times a minute.",
    'シロナガスクジラの心臓は約400ポンド（約180キロ）で、冷蔵庫くらいの重さです。深く潜っている間は、1分にわずか2回しか打たないこともあります。',
    'as few as＝わずか。400は心臓の重さ（ポンド）',
    ['2回', '12回', '400回'],
    tg(64, 'broadcast', 'literal', [], ['numbers']),
    { ask: '潜水中の 心拍は 1分に 何回？', focus: 'as few as two times a minute', tts: "A blue whale's heart weighs around four hundred pounds, roughly as much as a fridge, and on a deep dive it can beat as few as two times a minute.",
      cja: ['2回', '12回', '400回'], why: 'as few as two times a minute は「1分にわずか2回」。400はポンドで、心臓の重さです。two と twelve の聞き分けにも注意。', ctx: '海の生き物のドキュメンタリーで' }],
  ['mean', 'ho-coal-town', 'stitches', 'And so the town that built its fortune on coal now markets itself as a destination for clean mountain air.',
    'こうして、石炭で富を築いた町は、いまや澄んだ山の空気を売りにする観光地として自らを宣伝しています。 → つまり、町のイメージが皮肉なほど正反対に変わった。',
    '石炭の町が「澄んだ空気」を売る皮肉',
    ["The town's image has flipped, with some irony.", 'The town still depends on coal.', 'The air in the town is badly polluted.'],
    tg(64, 'broadcast', 'attitude', [], ['contrast']),
    { focus: 'clean mountain air',
      cja: ['町のイメージが、少し皮肉なほど反転した', '町は今も石炭に頼っている', '町の空気はひどく汚れている'], why: '石炭で富を築いた町が、今は clean mountain air を売りにしている、という皮肉な変化です。markets itself as は「〜として売り出す」。', ctx: 'アメリカの町を描くドキュメンタリーで' }],
  ['next', 'ho-river-crossing', 'walker', 'For three days, the herd has waited at the riverbank. The crocodiles have waited too. Then, without warning, one young female steps forward.',
    '3日間、群れは川岸で待ち続けてきました。ワニたちも待っていました。そして突然、一頭の若いメスが前に踏み出します。',
    'Then, without warning は展開が動く合図',
    ['Within seconds, the whole herd follows her in.', 'For three more days, nothing at all happens.', 'The crocodiles have waited at the riverbank too.'],
    tg(66, 'broadcast', 'literal'),
    { focus: 'without warning',
      cja: ['数秒のうちに、群れ全体が彼女に続いて川に入る', 'さらに3日間、何も起こらない', 'ワニも川岸で待っていた'], why: 'without warning, one young female steps forward で事態が動きました。次は群れが一気に続く展開が自然。3日待った話は済んでいます。', ctx: 'アフリカの野生動物ドキュメンタリーで' }],
  ['gist', 'ho-station-night', 'nana', 'Every day, more than three million people pass through this station, making it the busiest in the world. Yet at 1 a.m., when the last train pulls out, it falls almost completely silent.',
    '毎日300万人以上がこの駅を通り、世界一の混雑駅となっています。しかし深夜1時、終電が出ていくと、ほとんど完全に静まり返ります。',
    'Yet が対比の合図。昼の雑踏と夜の静けさ',
    ['The crowds by day and the silence at night.', 'The first and the last trains of the day.', 'Three different stations in the city.'],
    tg(64, 'broadcast', 'literal', [], ['contrast']),
    { ask: 'ナレーションが 対比しているのは？', focus: 'Yet at 1 a.m.', tts: 'Every day, more than three million people pass through this station, making it the busiest in the world. Yet at one a.m., when the last train pulls out, it falls almost completely silent.',
      cja: ['昼の人混みと、夜の静けさ', '一日の始発と終電', '市内の三つの駅'], why: 'Yet が対比の合図。毎日300万人以上が通る昼と、終電が出た深夜1時のほぼ完全な静けさを比べています。始発の話は出てきません。', ctx: '東京を紹介するドキュメンタリーで' }]
];

// ---- debates and panel discussions ----------------------------------------------------------------------------------

const DEBATE: readonly Row[] = [
  ['mean', 'ho-greatest-respect', 'static', "With the greatest respect, that's a lovely idea that has never once worked in practice.",
    'お言葉ですが、それは素敵な考えですが、実際にうまくいったことは一度もありません。 → つまり、その案は非現実的だと思っている。',
    'With the greatest respect＝反論の前置き',
    ['He thinks the idea is unrealistic.', 'He respects the idea and supports it.', 'He thinks it has worked once before.'],
    tg(65, 'broadcast', 'attitude', [], ['contraction']),
    { focus: 'With the greatest respect',
      cja: ['その案は非現実的だと思っている', 'その案を尊重し、支持している', '以前一度うまくいったと思っている'], why: 'With the greatest respect は強い反論の前置き。lovely idea と褒めてから、never once worked（一度も成功していない）と否定。', ctx: 'イギリスの討論番組で、パネリストが' }],
  ['reply', 'ho-come-in', 'tammy', "Sorry, can I jump in here? Because you've said twice now that the numbers don't matter.",
    'すみません、ちょっと割り込んでもいいですか？ 数字は関係ないと、もう2回おっしゃっていますよね。 →「どうぞ。ただ、手短にお願いします」',
    'jump in＝議論に割り込む。飛び込むではない',
    ['Of course. Briefly, though, if you don\'t mind.', 'No, the numbers jumped twice.', "Jump in? The pool's closed today."],
    tg(65, 'broadcast', 'formula', [], ['idiom']),
    { cja: ['どうぞ。ただ、できれば手短に', 'いいえ、数字が2回跳ね上がりました', '飛び込む？ 今日はプールは休みですよ'], why: 'can I jump in here? は「割り込んでもいい？」という討論の決まり文句。相手は「どうぞ、手短に」と応じるのが自然です。', ctx: 'テレビの討論番組で' }],
  ['mean', 'ho-grant-you', 'ken', "I'll grant you that the commute is gone. But the hallway conversations, the ones that actually solve problems, those are gone too.",
    '通勤がなくなったのは認めます。でも廊下での会話、実際に問題を解決していたあの会話も、なくなったんです。 → つまり、在宅勤務の利点は認めつつ、大事なものを失ったと主張している。',
    "I'll grant you＝そこは認める。But 以降が主張",
    ['He admits one benefit but says something important was lost.', 'He agrees completely that working from home is better.', 'He wants more hallways in the office.'],
    tg(65, 'broadcast', 'attitude', [], ['contrast']),
    { focus: "I'll grant you",
      cja: ['利点の一つは認めつつ、大事なものが失われたと言っている', '在宅勤務のほうが良いと全面的に賛成している', 'オフィスに廊下をもっと増やしたい'], why: 'I\'ll grant you は「そこは認める」という譲歩。But 以降の、問題を解決していた廊下での会話もなくなった、が本当の主張です。', ctx: '在宅勤務をめぐる討論番組で' }],
  ['gist', 'ho-one-sentence', 'judy', "We're almost out of time, so I'm going to ask each of you for one sentence, just one, on whether the four-day week is here to stay.",
    'そろそろ時間ですので、週4日勤務は定着するのか、お一人ずつ一文で、本当に一文だけでお願いします。',
    'one sentence, just one＝ひとことで',
    ['A very short final answer from each guest.', 'A full explanation of the four-day week.', 'Questions from the audience.'],
    tg(65, 'broadcast', 'literal', [], ['gonna']),
    { ask: '司会者は 何を 頼んでいる？', focus: 'one sentence, just one', tts: "We're almost out of time, so I'm gonna ask each of you for one sentence, just one, on whether the four-day week is here to stay.",
      cja: ['各ゲストからの、ごく短い最後の答え', '週4日勤務についての詳しい説明', '会場からの質問'], why: 'almost out of time の後、one sentence, just one と念を押しているので、一人ひとこと。is here to stay は「定着する」。', ctx: '討論番組の終わりに、司会者が' }],
  ['word', 'ho-data-cant', 'agnes', "The data can't tell us whether the policy actually caused the drop.",
    'そのデータからは、政策が本当に減少の原因だったかどうかはわかりません。',
    "米国の can't は t がほぼ消える。母音で判断",
    ["can't", 'can', "couldn't"],
    tg(65, 'broadcast', 'hedge', [], ['can-cant']),
    { cja: ['わからない', 'わかる', 'わからなかった'], why: 'アメリカ英語の can\'t は t がほとんど聞こえず、母音が長く強めです。can は弱く短く聞こえます。データからは因果まではわからない、という慎重な主張です。', ctx: '政策をめぐる専門家の討論で' }],
  ['mean', 'ho-school-street', 'teddy', "Nobody on this panel is saying we should ban cars. What we're saying is maybe the street outside a school doesn't need to be a freeway at 8 a.m.",
    'このパネルの誰も、車を禁止しろとは言っていません。言っているのは、朝8時の通学路が高速道路みたいである必要はないだろう、ということです。 → つまり、全面禁止ではなく学校付近の交通を減らしたい。',
    'Nobody is saying…は誤解を否定。本題は後半',
    ['They want less traffic near schools, not a total ban.', 'They want to ban all cars.', 'They want schools to start at eight.'],
    tg(65, 'broadcast', 'attitude', [], ['contrast']),
    { focus: "What we're saying", tts: "Nobody on this panel is saying we should ban cars. What we're saying is maybe the street outside a school doesn't need to be a freeway at eight a.m.",
      cja: ['全面禁止ではなく、学校の近くの交通を減らしたい', 'すべての車を禁止したい', '学校の始業を8時にしたい'], why: 'Nobody is saying… で誤解を否定し、What we\'re saying is… が本題。学校前の道が朝8時に高速道路のようでなくていい、という主張です。', ctx: '交通政策についてのパネル討論で' }],
  ['reply', 'ho-great-question', 'dom', "That's a great question, and I think it really speaks to a broader conversation we need to be having.",
    'すばらしいご質問です。もっと大きな議論につながる話だと思います。 →「なるほど。でも、質問そのものに答えていただけますか？」',
    '褒めて話をそらす定番。答えを促すのが自然',
    ['Right, but could you answer the question itself?', 'Thanks, the conversation room is broader.', "Yes, I'll speak to him about it later."],
    tg(47, 'official', 'hedge', [], ['idiom']),
    { cja: ['なるほど。でも、質問そのものに答えていただけますか？', 'ありがとう。会議室のほうが広いです', 'はい、あとで彼に話しておきます'], why: 'great question と褒めて broader conversation に話を広げるのは、答えをかわす定番。質問に答えるよう促すのが自然です。', ctx: '記者会見で、担当者が質問を受けて' }],
  ['reply', 'ho-couldnt-agree', 'molly', "I couldn't agree more, actually, which I know will surprise everyone here.",
    '実は大賛成なんです。ここにいる皆さんは驚くでしょうけど。 →「はは、カレンダーに印をつけなきゃ。やっと意見が合いましたね」',
    "couldn't agree more＝大賛成。否定ではない",
    ['Ha! Somebody mark the calendar. We finally agree on something.', "Why couldn't you agree?", 'Yes, everyone here is surprised by the weather.'],
    tg(65, 'broadcast', 'humour', [], ['contraction']),
    { cja: ['はは！ 誰かカレンダーに印を。ついに意見が合いました', 'どうして賛成できないの？', 'はい、ここの皆さんは天気に驚いています'], why: 'couldn\'t agree more は否定ではなく「これ以上ないほど賛成」。いつも対立している相手なので、mark the calendar と冗談で受けるのが自然です。', ctx: '討論番組で、いつも対立する相手が' }],
  ['word', 'ho-hardly-begun', 'agnes', "We've hardly begun to understand the long-term effects.",
    '長期的な影響については、まだほとんど理解が始まってもいません。',
    'hardly＝ほとんど〜ない。already とは逆',
    ['hardly', 'already', 'only'],
    tg(65, 'broadcast', 'hedge', [], ['contraction']),
    { cja: ['ほとんど〜ない', 'すでに', '〜だけ'], why: 'hardly は「ほとんど〜ない」で、理解はまだ始まったばかり。already（もう）とは逆の意味なので、慎重な口調の文脈からも判断できます。', ctx: '医療をめぐる専門家の討論で' }]
];

// ---- interviews -----------------------------------------------------------------------------------------------------

const INTERVIEW: readonly Row[] = [
  ['mean', 'ho-knee', 'sterling', "Look, I'm not going to sit here and tell you the knee's a hundred percent. But I'll be on that starting line.",
    'いいかい、膝が完璧だなんてここで言うつもりはないよ。でもスタートラインには立つ。 → つまり、まだ痛むがレースには出る。',
    'not 100% は「まだ痛い」。それでも出場する',
    ["He's still hurt but plans to race anyway.", 'His knee has fully healed.', "He's pulling out of the race."],
    tg(63, 'broadcast', 'attitude', [], ['gonna', 'yod']),
    { focus: 'starting line', tts: "Look, I'm not gonna sit here 'n' tell ya the knee's a hundred percent. But I'll be on that starting line.",
      cja: ['まだ痛むが、それでもレースに出るつもり', '膝は完全に治った', 'レースを欠場する'], why: '膝が a hundred percent だとは言わない、つまりまだ痛む。But I\'ll be on that starting line で、出場はすると言っています。', ctx: 'スポーツ番組で、選手が記者に' }],
  ['reply', 'ho-devastating', 'maple', "Your novel's been called 'quietly devastating'. Is that how you'd describe it?",
    'あなたの小説は「静かに打ちのめされる」と評されていますね。ご自身もそう表現しますか？ →「正直、『静かに』は外すかもしれません」',
    'drop＝外す。もっと強烈だという冗談',
    ["I'd probably drop the 'quietly', to be honest.", 'Yes, I described it very quietly.', 'No, it was called last week.'],
    tg(63, 'broadcast', 'humour', [], ['contraction']),
    { cja: ['正直、「静かに」は外すかもしれません', 'はい、とても静かに表現しました', 'いいえ、先週そう呼ばれました'], why: 'quietly devastating は「静かに胸をえぐる」という書評の言葉。「静かに」を外す＝もっと強烈だよ、とユーモアで返すのが自然です。', ctx: 'ラジオの書評番組で、作家に' }],
  ['mean', 'ho-chef-miss', 'pietro', "Do I miss the restaurant? I miss the food. I don't miss the eighteen-hour days, and I definitely don't miss the landlord.",
    'レストランが恋しいか？ 料理は恋しいよ。1日18時間労働は恋しくないし、大家なんて絶対に恋しくない。 → つまり、料理以外は辞めてよかったと思っている。',
    '恋しいのは料理だけ。残りは否定',
    ["He's glad he left, apart from the cooking.", 'He misses everything about the restaurant.', 'He still works eighteen-hour days.'],
    tg(63, 'broadcast', 'attitude', [], ['contrast']),
    { focus: 'I miss the food',
      cja: ['料理以外は、辞めてよかったと思っている', 'レストランのすべてが恋しい', '今も1日18時間働いている'], why: 'I miss the food の後、I don\'t miss… を2回重ねています。恋しいのは料理だけで、長時間労働や大家とは縁が切れてよかった、という気持ちです。', ctx: '店を閉めたシェフへのインタビューで' }],
  ['reply', 'ho-soil', 'cj', 'In one sentence, for our listeners: why should anyone care about soil?',
    'リスナーのためにひとことで。なぜ土のことを気にかけるべきなんでしょう？ →「今日あなたが食べたものは、ほぼ全部そこから始まっているからです」',
    'In one sentence＝ひとことで。簡潔な答えが自然',
    ['Because almost everything you ate today started in it.', "Sure, I'll take care of it this weekend.", 'One sentence is about forty words.'],
    tg(63, 'broadcast', 'literal'),
    { cja: ['今日あなたが食べたものは、ほとんど全部そこから始まっているからです', 'いいですよ、今週末にやっておきます', '一文はだいたい40語です'], why: 'In one sentence は「ひとことで」。なぜ土が大事かを一文で答えるのが自然です。care about を take care of（片付ける）と混同するのが罠。', ctx: '科学ポッドキャストで、土の研究者に' }],
  ['num', 'ho-summit', 'gulliver', 'We set off at 2 a.m., reached the summit just after 11, and were back in camp by 6. Or was it 7? It\'s all a bit of a blur.',
    '午前2時に出発して、11時すぎに山頂に着いて、6時までにキャンプに戻った。いや7時だったかな。記憶がぼんやりしてるんだ。',
    '6か7かは帰着の時刻。山頂は11時すぎ',
    ['11時すぎ', '7時ごろ', '2時ごろ'],
    tg(63, 'broadcast', 'literal', [], ['self-repair', 'numbers']),
    { ask: '山頂に 着いたのは？', focus: 'just after 11', tts: "We set off at two a.m., reached the summit just after eleven, and were back in camp by six. Or was it seven? It's all a bit of a blur.",
      cja: ['11時すぎ', '7時ごろ', '2時ごろ'], why: '2時は出発、11時すぎが山頂、6時か7時かは帰着の時刻。言い直しの Or was it 7? は帰りの話なので、山頂とは関係ありません。', ctx: '登山家へのラジオインタビューで' }],
  ['gist', 'ho-roommates', 'poppy', "People assume we planned all this. Honestly, the app started as a joke between two roommates who couldn't agree on whose turn it was to buy toilet paper.",
    'みんな、全部計画どおりだったと思ってるの。本当は、トイレットペーパーを買う番がどっちか決められないルームメイト2人の冗談から始まったアプリなのよ。',
    'People assume…は否定される前提。本題は後半',
    ['It began as a joke about household chores.', 'It came from a careful business plan.', 'It was a joke app that failed.'],
    tg(63, 'broadcast', 'literal', [], ['contraction']),
    { ask: 'アプリの きっかけは？', focus: 'started as a joke',
      cja: ['家事についての冗談から始まった', '綿密な事業計画から生まれた', '失敗した冗談アプリだった'], why: 'People assume we planned all this は否定される前置き。Honestly 以降で、ルームメイトのトイレットペーパー当番の冗談が始まりだと明かします。', ctx: '起業家へのインタビューで' }]
];

// ---- TED-style talks ------------------------------------------------------------------------------------------------

const TALK: readonly Row[] = [
  ['mean', 'ho-failure-rent', 'goldie', 'I used to think failure was the opposite of success. Now I think it\'s more like the rent you pay to get there.',
    '失敗は成功の反対だと思っていました。今は、そこにたどり着くために払う家賃のようなものだと思っています。 → つまり、失敗は成功への途中で払う当然のコスト。',
    'rent は比喩。成功への必要経費という意味',
    ['Failure is a normal cost on the way to success.', 'Success means never failing.', 'Successful people pay less rent.'],
    tg(64, 'broadcast', 'literal', [], ['idiom']),
    { focus: 'the rent you pay',
      cja: ['失敗は、成功へ向かう途中の当たり前のコスト', '成功とは決して失敗しないこと', '成功した人は家賃が安い'], why: 'the rent you pay to get there は比喩で、成功にたどり着くために払う「必要経費」。失敗は成功の反対、という昔の考えを改めた話です。', ctx: '講演会で、起業家が' }],
  ['gist', 'ho-phone-hands', 'tia', 'Raise your hand if you checked your phone in the last ten minutes. Keep it up if you can remember why. Yeah. That\'s what I want to talk about.',
    'この10分でスマホを見た人、手を挙げてください。なぜ見たか覚えている人は、そのまま挙げていて。…そう。今日はその話をしたいんです。',
    '聴衆参加の導入。テーマは最後の一文',
    ['Checking our phones without thinking.', 'How to remember phone numbers.', 'Why people raise their hands in talks.'],
    tg(64, 'broadcast', 'literal', [], ['ellipsis']),
    { ask: 'この トークの テーマは？', focus: 'remember why',
      cja: ['何も考えずにスマホを見てしまうこと', '電話番号の覚え方', '講演で人が手を挙げる理由'], why: '見た人は手を挙げ、理由を覚えている人はそのまま、で手がほとんど下がる流れ。テーマは、無意識にスマホを見てしまうことです。', ctx: '講演の冒頭で、話し手が会場に' }],
  ['next', 'ho-and-then', 'beau', 'So the data looked great. Engagement up, costs down, everyone happy. And then we actually talked to the users.',
    'データは上々でした。利用は増え、コストは減り、みんな満足。そして、実際にユーザーと話してみたんです。',
    'And then…は逆転の前触れ',
    ['And it turned out most of them hated it.', 'And engagement went up even more.', 'So the costs came down too.'],
    tg(64, 'broadcast', 'literal', [], ['contrast']),
    { focus: 'And then',
      cja: ['すると、ほとんどの人がそれを嫌っていたとわかったんです', 'すると、利用はさらに伸びました', 'だから、コストも下がりました'], why: '数字は全部好調、と並べた後の And then we actually talked to the users は逆転の前触れ。データと実際の声が違った、という展開が自然です。', ctx: '講演で、アプリ開発者が失敗談を' }],
  ['mean', 'ho-character-building', 'bea', "Moving to a country where I didn't speak the language, with two toddlers, in winter, was, let's say, character-building.",
    '言葉の通じない国に、幼児2人を連れて、冬に引っ越したのは、まあ、人間を鍛えてくれる経験でした。 → つまり、とても大変だった。',
    "let's say, character-building＝控えめに「大変」",
    ['It was extremely hard.', 'It was easy and fun.', 'It made her children more sociable.'],
    tg(64, 'broadcast', 'understatement', [], ['intonation']),
    { focus: 'character-building',
      cja: ['ものすごく大変だった', '楽で楽しかった', '子どもたちが社交的になった'], why: '言葉が通じない国、幼児2人、冬、と大変な条件を重ねて let\'s say, character-building。「人を鍛える経験」は「とても大変だった」の控えめな言い方です。', ctx: '講演で、話し手が海外生活を振り返って' }]
];

// ---- cultural references and wordplay -------------------------------------------------------------------------------

const CULTURE: readonly Row[] = [
  ['mean', 'ho-pencil-pun', 'kk-slider', "Next up, a song about a broken pencil. It's pointless, but stick with it.",
    '次は、折れた鉛筆の歌。ポイントレス（芯がない／無意味）だけど、お付き合いを。 → つまり、pointless のダジャレを言っている。',
    'pointless＝芯がない／無意味のダジャレ',
    ["He's joking: 'pointless' fits a broken pencil.", 'He thinks the song is bad, so he skips it.', "He's asking listeners to buy pencils."],
    tg(61, 'broadcast', 'humour', [], ['idiom']),
    { focus: 'pointless',
      cja: ['冗談だ。「芯がない」が折れた鉛筆にかかっている', '曲がよくないので飛ばす', 'リスナーに鉛筆を買ってほしい'], why: 'pointless は「芯がない」と「無意味」の掛けことば。stick with it（お付き合いを）も軽いダジャレの流れです。曲を飛ばすわけではありません。', ctx: 'ラジオの音楽番組で、DJが次の曲を' }],
  ['reply', 'ho-elephant', 'kicks', "Should we address the elephant in the room? We're forty grand over budget.",
    '誰も触れない問題の話をしましょうか。予算を4万ドルオーバーしています。 →「ええ、そうしましょう。どうしてそこまで膨らんだんですか？」',
    'elephant in the room＝皆が避けている問題',
    ['Yes, let\'s. How did it get that far?', "There's no elephant. I checked.", 'Forty, and the room is too small.'],
    tg(40, 'colleague', 'indirect', [], ['idiom']),
    { scene: 'office',
      cja: ['ええ、そうしましょう。どうしてそこまで膨らんだんですか？', 'ゾウはいません。確認しました', '40で、部屋が狭すぎます'], why: 'the elephant in the room は「皆が気づいているのに触れない問題」。ここでは4万ドルの予算超過です。話し合いに応じて原因を聞くのが自然です。', ctx: '職場の会議で、プロジェクトの責任者が' }],
  ['mean', 'ho-catch-22', 'ken', "It's a classic Catch-22: you need experience to get the job, and you need the job to get experience.",
    '典型的なキャッチ22だよ。仕事を得るには経験が要り、経験を積むには仕事が要る。 → つまり、どちらも先にもう一方が必要で抜け出せない。',
    'Catch-22＝どちらも先に要る堂々巡り',
    ['There\'s no way in, because each needs the other first.', 'He has both the experience and the job.', 'The job is a great catch because it pays well.'],
    tg(43, 'friend', 'attitude', [], ['idiom']),
    { focus: 'Catch-22', tts: "It's a classic Catch twenty-two: you need experience to get the job, and you need the job to get experience.",
      cja: ['抜け道がない。どちらも、先にもう一方が必要だから', '彼は経験も仕事も持っている', '給料がいいので、その仕事は掘り出し物だ'], why: 'Catch-22 は小説から来た言葉で「どちらも先にもう一方が要る堂々巡り」。経験がないと仕事が得られず、仕事がないと経験が積めません。', ctx: '友だちが就職活動の愚痴を' }],
  ['mean', 'ho-over-the-moon', 'tangy', "Getting tickets for that show? I'm on cloud nine. Paying that much for them? Not so much.",
    'あの公演のチケットが取れたこと？ 最高の気分よ。あんなに払ったこと？ それほどでも。 → つまり、行けるのはうれしいが値段には不満。',
    'on cloud nine＝大喜び。Not so much＝そうでもない',
    ["She's thrilled to go but unhappy about the cost.", "She isn't going because of the price.", "She's sad she missed the show."],
    tg(57, 'friend', 'understatement', [], ['idiom', 'ellipsis']),
    { focus: 'Not so much',
      cja: ['行けるのは大喜びだが、値段には不満', '値段のせいで行かない', '公演を見逃して悲しい'], why: 'on cloud nine は「最高の気分」。値段について Not so much（そっちはそうでもない）と言うので、値段には不満です。', ctx: '友だちが、人気公演のチケットについて' }],
  ['mean', 'ho-bite-bullet', 'ken', "'Bite the bullet' supposedly comes from soldiers biting on a bullet during surgery, though historians are, let's say, skeptical.",
    '「弾丸をかむ」は、手術中の兵士が弾をかんで耐えたのが由来とされていますが、歴史家たちは、まあ、懐疑的です。 → つまり、よく聞く由来の話は本当ではないかもしれない。',
    "supposedly・let's say は疑いの合図",
    ['The popular story behind the phrase may not be true.', 'Historians have proven the story is true.', 'Soldiers still do this during surgery today.'],
    tg(64, 'broadcast', 'hedge', [], ['idiom']),
    { focus: 'supposedly',
      cja: ['その言い回しのよく知られた由来は、本当ではないかもしれない', '歴史家がその話は本当だと証明した', '今でも兵士は手術中にこれをする'], why: 'supposedly は「〜とされている」、historians are, let\'s say, skeptical は「まあ懐疑的」。どちらも「この由来は怪しい」の合図です。', ctx: 'ことばの由来を紹介するポッドキャストで' }],
  ['reply', 'ho-tall-poppy', 'cj', "Big promotion, huh? Just don't let it go to your head.",
    '大出世だね。でも調子に乗るなよ。 →「はは、大丈夫。母がしっかり地に足つけさせてくれるから」',
    'go to your head＝調子に乗る。頭痛の話ではない',
    ['Ha, don\'t worry, my mom keeps me grounded.', 'My head? It feels fine now, thanks.', 'Sure, I promoted the head of sales.'],
    tg(55, 'friend', 'humour', [], ['idiom', 'contraction']),
    { cja: ['はは、大丈夫。母がちゃんと地に足をつけさせてくれるから', '頭？ もう大丈夫、ありがとう', 'うん、営業部長を昇進させたよ'], why: 'let it go to your head は「調子に乗る」。からかい半分のお祝いなので、冗談っぽく「大丈夫」と返すのが自然です。頭痛の話ではありません。', ctx: '昇進した友だちに、昔からの友人が' }],
  ['reply', 'ho-lose-story', 'pietro', "We're running long. Can you lose the second story?",
    '押してる。2本目のニュース、カットできる？ →「了解、そのまま天気に行くよ」',
    'lose＝カットする。story は記事（階ではない）',
    ["Fine, I'll go straight to the weather.", 'Which floor? The second story?', 'I lost it somewhere this morning.'],
    tg(62, 'colleague', 'literal', [], ['idiom']),
    { scene: 'office',
      cja: ['了解、そのまま天気に行くよ', 'どの階？ 2階？', '今朝どこかでなくしちゃった'], why: 'running long は「押している」、lose は「カットする」、story は「ニュースの項目」。2本目を飛ばして天気へ進むのが自然です。story を「階」と取るのが罠。', ctx: '生放送中のスタジオで、プロデューサーが' }],
  ['reply', 'ho-make-sense', 'orville', 'Does that make sense, or should I go over it again?',
    'ここまでわかりましたか？ それとももう一度説明しましょうか？ →「後半だけ、もう一度お願いできますか？」',
    'go over＝説明し直す。向こうへ行くではない',
    ['Could you go over the second part once more?', "Yes, I'll go over to the other building.", 'It made sense last week.'],
    tg(43, 'official', 'formula', [], ['idiom']),
    { cja: ['後半だけ、もう一度説明してもらえますか？', 'はい、別の建物に行きます', '先週はわかりました'], why: 'go over it again は「もう一度説明する」。わかったかどうか聞かれているので、わからなかった部分を頼むのが自然です。go over を「向こうへ行く」と取るのが罠。', ctx: '窓口で、係員が手続きを説明したあとで' }],
  ['reply', 'ho-doc-too-long', 'label', "The doc's great, but it's ninety minutes and the slot's an hour.",
    'そのドキュメンタリーは最高なんだけど、90分あって、枠は1時間なのよ。 →「じゃあ、どこを削る？」',
    'but の後が問題。30分の超過',
    ['So what would you cut?', 'Great, so it fits nicely.', 'An hour is plenty for lunch.'],
    tg(42, 'colleague', 'indirect', [], ['contraction']),
    { scene: 'office',
      cja: ['じゃあ、どこを削る？', 'よかった、ぴったり収まるね', 'お昼なら1時間で十分だよ'], why: 'The doc\'s great, but… の後が問題点。doc はドキュメンタリーのこと。90分の作品を1時間の枠に入れるには削るしかないので、どこを削るか聞くのが自然です。', ctx: 'テレビ局の番組会議で' }]
];

// ---- dense numbers and statistics -----------------------------------------------------------------------------------

const STATS: readonly Row[] = [
  ['num', 'ho-fare', 'poppy', 'Starting April 1st, the base fare rises from $2.75 to $2.90, the first increase in six years.',
    '4月1日から、基本運賃が2ドル75セントから2ドル90セントに上がります。6年ぶりの値上げです。',
    'from A to B の B が新運賃。dollars は省略',
    ['$2.90', '$2.75', '$2.60'],
    tg(62, 'broadcast', 'literal', [], ['numbers']),
    { ask: '新しい 運賃は？', focus: '$2.90', tts: 'Starting April first, the base fare rises from two seventy-five to two ninety, the first increase in six years.',
      cja: ['2ドル90セント', '2ドル75セント', '2ドル60セント'], why: 'from two seventy-five to two ninety の to の後が新運賃。ニュースでは dollars を省いて two ninety とよく言います。', ctx: '地元ニュースで、地下鉄の運賃改定を' }],
  ['num', 'ho-unemployment', 'katt', 'Unemployment edged up to 4.3%, from 4.1%, while wage growth slowed to 5.2%.',
    '失業率は4.1%から4.3%へとわずかに上昇し、賃金の伸びは5.2%に鈍化しました。',
    'edged up to＝〜へ微増。from の後は前回値',
    ['4.3%', '4.1%', '5.2%'],
    tg(62, 'broadcast', 'literal', [], ['numbers']),
    { ask: '失業率は？', focus: '4.3%', tts: 'Unemployment edged up to four point three percent, from four point one, while wage growth slowed to five point two.',
      cja: ['4.3%', '4.1%', '5.2%'], why: 'edged up to 4.3%, from 4.1% は「4.1%から4.3%へ微増」。to の後が今回の値です。5.2%は賃金の伸びで、失業率ではありません。', ctx: '経済ニュースで、雇用統計を' }],
  ['num', 'ho-survey', 'poppy', 'In the poll, 62% said they always tip at a sit-down restaurant, but only 26% said they tip at a coffee counter.',
    '世論調査では、62%がレストランでは必ずチップを払うと答えましたが、コーヒーのカウンターで払う人は26%にとどまりました。',
    '62と26の入れ替え。but の後を聞く',
    ['26%', '62%', '36%'],
    tg(65, 'broadcast', 'literal', [], ['numbers']),
    { ask: 'カウンターで チップを 払うのは？', focus: 'only 26%', tts: 'In the poll, sixty-two percent said they always tip at a sit-down restaurant, but only twenty-six percent said they tip at a coffee counter.',
      cja: ['26%', '62%', '36%'], why: '62%はレストラン、but only 26% がコーヒーのカウンター。sixty-two と twenty-six は数字が逆並びなので、何の数字かを聞き分けます。', ctx: 'チップについての世論調査のニュースで' }],
  ['num', 'ho-one-in-three', 'sterling', 'Roughly one in three adults in the study, about 34%, slept less than six hours a night.',
    'この研究では、成人のおよそ3人に1人、約34%が一晩6時間未満の睡眠でした。',
    'one in three≒34%。6は時間の数字',
    ['約34%', '約43%', '約6%'],
    tg(19, 'broadcast', 'literal', [], ['numbers']),
    { ask: '6時間 未満の 割合は？', focus: 'about 34%', tts: 'Roughly one in three adults in the study, about thirty-four percent, slept less than six hours a night.',
      cja: ['約34%', '約43%', '約6%'], why: 'one in three（3人に1人）を about thirty-four percent と言い換え。forty-three との取り違えと、6が睡眠時間である点に注意。', ctx: '健康ニュースで、睡眠の研究結果を' }],
  ['num', 'ho-per-person', 'gulliver', "The program costs $1.2 billion a year. That's about $18 per person, less than a takeout dinner.",
    'この制度は年に12億ドルかかります。1人あたり約18ドル、テイクアウトの夕食1回分より安いのです。',
    'eighTEEN と EIGHty。billion は総額の方',
    ['$18', '$80', '$1.20'],
    tg(65, 'broadcast', 'attitude', [], ['teen-ty', 'numbers']),
    { ask: '1人あたり いくら？', focus: '$18 per person', tts: "The program costs one point two billion dollars a year. That's about eighteen dollars per person, less than a takeout dinner.",
      cja: ['18ドル', '80ドル', '1ドル20セント'], why: 'eighTEEN は後ろ、EIGHty は前に強勢。one point two billion は年間の総額で、1人あたりは about eighteen dollars です。', ctx: 'ニュースで、政策の費用について' }],
  ['num', 'ho-population', 'label', "The city's population fell by 0.4% last year, to just under 2.3 million.",
    '市の人口は昨年0.4%減少し、230万人をわずかに下回りました。',
    'million＝百万。2.3 million は230万',
    ['230万人弱', '2300万人弱', '40万人'],
    tg(62, 'broadcast', 'literal', [], ['numbers']),
    { ask: '市の 人口は？', focus: 'just under 2.3 million', tts: "The city's population fell by zero point four percent last year, to just under two point three million.",
      cja: ['230万人弱', '2300万人弱', '40万人'], why: 'two point three million は230万。just under は「わずかに下回る」。0.4%は減少率で、人数ではありません。', ctx: 'ニュースで、市の人口統計を' }],
  ['num', 'ho-marathon', 'daisy-mae', 'She crossed the line in 2 hours, 19 minutes and 40 seconds, shaving 90 seconds off the course record.',
    '彼女は2時間19分40秒でゴールし、コース記録を90秒縮めました。',
    'shave off＝縮める。19分40秒はタイムの方',
    ['90秒', '19秒', '40秒'],
    tg(62, 'broadcast', 'literal', [], ['teen-ty', 'numbers']),
    { ask: '記録を 何秒 縮めた？', focus: 'shaving 90 seconds', tts: 'She crossed the line in two hours, nineteen minutes and forty seconds, shaving ninety seconds off the course record.',
      cja: ['90秒', '19秒', '40秒'], why: 'shaving ninety seconds が記録を縮めた時間。19分40秒はゴールタイムです。NINEty と nineTEEN の強勢の違いにも注意。', ctx: 'スポーツニュースで、マラソンの結果を' }],
  ['num', 'ho-rounding', 'henry', "Growth came in at 1.8%, which they're rounding up to 2 in the press release, naturally.",
    '成長率は1.8%でしたが、プレスリリースでは当然のように2%に切り上げています。',
    'naturally は皮肉。発表は切り上げた数字',
    ['1.8%', '2%', '8%'],
    tg(62, 'broadcast', 'sarcasm', [], ['numbers']),
    { ask: '実際の 成長率は？', focus: '1.8%', tts: "Growth came in at one point eight percent, which they're rounding up to two in the press release, naturally.",
      cja: ['1.8%', '2%', '8%'], why: 'came in at 1.8% が実際の数字。プレスリリースでは2に rounding up（切り上げ）していて、naturally は「そりゃそうするよね」という皮肉です。', ctx: '経済番組で、解説者が政府の発表を' }],
  ['num', 'ho-rain-warning', 'fang', "Up to 5 inches of rain could fall in 24 hours, a month's worth, and the flood watch is in effect until 6 a.m. Saturday.",
    '24時間で最大5インチ（約130ミリ）、ひと月分の雨が降るおそれがあり、洪水注意報は土曜の朝6時まで続きます。',
    '5は雨量、24は時間。期限は最後に言う',
    ['土曜の 朝6時', '土曜の 夜6時', '24時間後'],
    tg(60, 'broadcast', 'literal', [], ['numbers']),
    { ask: '注意報は いつまで？', focus: 'until 6 a.m. Saturday', tts: "Up to five inches of rain could fall in twenty-four hours, a month's worth, and the flood watch is in effect until six a.m. Saturday.",
      cja: ['土曜の朝6時', '土曜の夜6時', '24時間後'], why: '5は雨量（インチ）、24は雨が降る時間。期限は is in effect until 6 a.m. Saturday で、土曜の朝6時です。a.m. を聞き逃すと夜と迷います。', ctx: '天気予報で、大雨の情報を伝えています' }],
  ['word', 'ho-few-economists', 'henry', 'Few economists expect inflation to fall below target before next year.',
    '来年より前にインフレ率が目標を下回ると見ているエコノミストはほとんどいません。',
    'few＝ほとんどいない。a few なら「何人か」',
    ['Few', 'A few', 'Quite a few'],
    tg(62, 'broadcast', 'literal', [], ['weak-form', 'contrast']),
    { cja: ['ほとんどいない', '少しはいる', 'かなり多い'], why: 'few は「ほとんどいない」、a few は「少しはいる」。a のあるなしで意味が逆になるので、Few の前に音がないことを聞き取ります。', ctx: '経済ニュースで、インフレの見通しを' }],
  ['word', 'ho-exports', 'marina', 'Exports rose for a third month in a row, helped by a weaker currency.',
    '通貨安に支えられ、輸出は3か月連続で増加しました。',
    'EXports と IMports、exPENses。語頭を聞く',
    ['Exports', 'Imports', 'Expenses'],
    tg(62, 'broadcast', 'literal', [], ['vowel']),
    { cja: ['輸出', '輸入', '経費'], why: 'EXports は語頭に強勢。通貨安は輸出の追い風なので、文脈とも合います。expenses は exPENses と後ろに強勢があります。', ctx: '経済ニュースで、貿易統計を' }],
  ['word', 'ho-decreased', 'kabuki', 'Ticket sales decreased sharply over the summer, the festival says.',
    'フェスティバルによると、夏の間にチケットの売り上げが急減しました。',
    'de と in の一音で意味が逆になる',
    ['decreased', 'increased', 'eased'],
    tg(62, 'broadcast', 'literal', [], ['contrast']),
    { cja: ['減少した', '増加した', '和らいだ'], why: 'decreased と increased は de と in の一音で意味が逆。sharply over the summer と合わせて、売り上げが急減したと判断します。', ctx: '地元ニュースで、夏のフェスティバルについて' }],
  ['word', 'ho-theyd-pay', 'lopez', "Two-thirds of respondents said they'd pay more for a greener option.",
    '回答者の3分の2が、より環境に優しい選択肢なら多く払うと答えました。',
    "they'd＝would の仮定。they'll と d／l の差",
    ["they'd", "they'll", 'they'],
    tg(62, 'broadcast', 'literal', [], ['contraction']),
    { cja: ['（そういう選択肢なら）払うだろう', '払うつもりだ', '払う'], why: 'they\'d は they would で「（そういう選択肢があれば）払う」という仮定。said の後の時制とも合います。they\'ll は l の音で終わります。', ctx: '消費者調査のニュースで' }],
  ['word', 'ho-worse-time', 'francine', "The results couldn't have come at a worse time for the company.",
    'この結果は、会社にとって最悪のタイミングで出てしまいました。',
    "couldn't have…worse＝最悪の。n't を聞く",
    ["couldn't have", 'could hardly have', "wouldn't have"],
    tg(62, 'broadcast', 'attitude', [], ['contraction', 'weak-form']),
    { cja: ['これ以上悪いタイミングはなかった', '悪いタイミングでは、まず来なかった', '悪いタイミングでは来なかっただろう'], why: 'couldn\'t have come at a worse time は「これ以上悪いタイミングはない」＝最悪のタイミング。n\'t の音と、弱く短い have を聞き取ります。', ctx: '経済ニュースで、企業の決算を' }]
];

// ---- stance: attitude, certainty, irony -----------------------------------------------------------------------------

const STANCE: readonly Row[] = [
  ['mean', 'ho-supposedly', 'tammy', 'The new program will, supposedly, pay for itself within five years.',
    '新しい制度は、5年以内に元が取れる、ということになっています。 → つまり、話し手はその主張を疑っている。',
    'supposedly＝〜ということになっている（疑い）',
    ['She doubts the claim.', "She's confident it'll pay for itself.", "She thinks it'll take less than five years."],
    tg(65, 'broadcast', 'attitude', [], ['intonation']),
    { focus: 'supposedly',
      cja: ['その主張を疑っている', '元が取れると確信している', '5年もかからないと思っている'], why: 'supposedly は「〜ということになっている」で、話し手は信じていない合図。わざわざ間に挟んで強調しているのもポイントです。', ctx: 'ニュース番組で、記者が新しい制度について' }],
  ['mean', 'ho-footnote', 'ken', 'To be fair to the city council, they did warn us. Three years ago. In a footnote.',
    '市議会の名誉のために言えば、確かに警告はしてたよ。3年前に。脚注でね。 → つまり、警告は目立たず、ほとんど意味がなかった。',
    'To be fair と言いつつ皮肉で批判している',
    ['The warning was so hidden it was almost useless.', 'The council warned everyone clearly.', 'He thinks the council acted fairly.'],
    tg(62, 'friend', 'sarcasm', [], ['ellipsis', 'intonation']),
    { focus: 'In a footnote',
      cja: ['警告はとても目立たず、ほとんど役に立たなかった', '市議会ははっきり全員に警告した', '市議会は公平に行動したと思っている'], why: 'To be fair は一見かばう前置き。Three years ago. In a footnote. と区切って足すことで、3年前の脚注では警告にならないと皮肉っています。', ctx: 'ラジオで、コメンテーターが市の対応について' }],
  ['mean', 'ho-remains-seen', 'reneigh', "Whether it'll scale beyond the pilot remains to be seen.",
    '試験導入の段階を超えて広がるかどうかは、まだわかりません。 → つまり、大規模にうまくいくかは不明。',
    'remains to be seen＝まだわからない',
    ["It's not yet clear whether it'll work on a larger scale.", 'It has already been expanded.', 'The pilot was a failure.'],
    tg(64, 'broadcast', 'hedge', [], ['idiom']),
    { focus: 'remains to be seen',
      cja: ['大規模でうまくいくかは、まだはっきりしない', 'すでに拡大されている', '試験導入は失敗だった'], why: 'remains to be seen は「まだわからない」。scale beyond the pilot は「試験段階より大きく広げる」ことで、失敗とも成功とも言っていません。', ctx: '科学ニュースで、新技術の試験導入について' }],
  ['mean', 'ho-cautiously', 'lopez', "I'm cautiously optimistic, with the emphasis on 'cautiously'.",
    '慎重ながら楽観しています。「慎重に」のほうに力点を置いてね。 → つまり、期待はしているがかなり用心している。',
    '強調は cautiously。慎重さが主',
    ["He's hopeful but very careful.", "He's extremely confident.", "He's pessimistic about it."],
    tg(62, 'broadcast', 'hedge', [], ['contrast']),
    { focus: "with the emphasis on 'cautiously'",
      cja: ['期待はしているが、とても用心している', '非常に自信がある', '悲観している'], why: 'cautiously optimistic は「慎重ながら楽観」。emphasis on \'cautiously\' で、慎重さのほうに重きがあると念を押しています。', ctx: '経済番組で、アナリストが見通しを聞かれて' }],
  ['mean', 'ho-ambitious', 'wolfgang', "It's certainly an ambitious timeline. I'd love to see the plan behind it.",
    '確かに意欲的なスケジュールですね。その裏付けとなる計画をぜひ見たいものです。 → つまり、期限内に実現できるか疑っている。',
    'ambitious＋計画を見せて＝実現性を疑う',
    ['He doubts it can be done on time.', "He's impressed and fully agrees.", 'He wants to join the planning team.'],
    tg(41, 'boss', 'hedge', [], ['contraction']),
    { focus: 'ambitious timeline', scene: 'office',
      cja: ['期限内にできるか疑っている', '感心して、全面的に賛成している', '計画チームに加わりたい'], why: 'ambitious timeline は褒め言葉に聞こえますが、I\'d love to see the plan behind it と続くと、実現性を疑う遠回しな言い方です。', ctx: '会議で、上司が新しいスケジュールを見て' }],
  ['gist', 'ho-changed-mind', 'agnes', "I'll be honest, I came into this study expecting to prove the opposite. The data changed my mind, and that's not a sentence I say lightly.",
    '正直に言うと、この研究は逆のことを証明するつもりで始めました。データが私の考えを変えたんです。そう軽々しく言える言葉ではありません。',
    'not lightly＝重く受け止めている。立場の変化',
    ['The evidence made her change her view.', 'She proved what she had expected.', 'She thinks the data is unreliable.'],
    tg(64, 'broadcast', 'attitude', [], ['contraction']),
    { ask: '話し手の 立場は？', focus: 'changed my mind',
      cja: ['証拠によって、考えを変えた', '予想していたことを証明した', 'データは当てにならないと思っている'], why: '逆を証明するつもりだったのに The data changed my mind。not a sentence I say lightly は「軽く言わない言葉」で、本気の転向です。', ctx: '科学ポッドキャストで、研究者が' }],
  ['next', 'ho-bright-start', 'freya', 'So, a bright start for most of us tomorrow. Make the most of it, though, because by the afternoon…',
    'というわけで、明日はほとんどの地域で晴れて始まります。でも、楽しめるうちに楽しんでおいてください。午後には…',
    'Make the most of it, though＝悪化の予告',
    ['…a band of heavy rain will push in from the west.', "…it'll be brighter still, with clear skies all evening.", '…a bright start for most of us.'],
    tg(60, 'broadcast', 'literal', [], ['intonation']),
    { focus: 'Make the most of it, though',
      cja: ['…西から強い雨の帯が入ってきます', '…さらに晴れて、夜まで快晴です', '…ほとんどの地域で晴れて始まります'], why: 'Make the most of it, though（でも今のうちに楽しんで）は、天気が崩れる予告。by the afternoon の後は悪化の話が来るのが自然です。', ctx: 'イギリスのテレビの天気予報で' }]
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
interface DRow extends DialogueRow, Help {
  fam: Family;
  lines: readonly L[];
  scene?: SceneId;
  channel?: Channel;
}

const dialogue = (r: DRow): Item => {
  const lines = r.lines.map(([who, en, ja, tts], n) => line([who, en, ja, tts, MARKS[`${r.id}-${n + 1}`]]));
  family[r.id] = r.fam;
  return {
    ...dialogueOf(HOSHI_LV, r, lines, exposed(r.id, r.tags)),
    ...(r.scene && { scene: r.scene }), ...(r.channel && { channel: r.channel }),
    ...helpOf(r)
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
    tags: tg(63, 'broadcast', 'sarcasm', [], ['ellipsis', 'weak-form']),
    cja: ['その数字はたぶん当てにならない', '人はスマホに9年を費やしている', 'そのことでブログを始めるべきだ'],
    why: '出どころは別のブログを引用したブログ、つまり孫引きです。So, no idea, then.（つまり、わからないってことね）が皮肉な結論。',
    ctx: 'ポッドキャストで、司会者二人が雑談'
  },
  {
    id: 'dho-breaking-up', type: 'next', fam: 'radio', focus: 'breaking up',
    lines: [
      ['kk-slider', "Next caller, you're on the air. Go ahead.", '次のお電話の方、オンエア中です。どうぞ。'],
      ['stitches', 'Yeah, hi, long-time listener, first-time... sorry, is this... can you hear me?', 'あ、どうも、長年のリスナーで、初めて…すみません、これ…聞こえてます？'],
      ['kk-slider', "Just barely. You're breaking up a little. Where are you calling from?", 'なんとか。ちょっと途切れてますね。どこからかけてます？']
    ],
    choices: ["I'm in the car. Hang on, I'll pull over.", "Yeah, I've been listening for years.", "Breaking up? No, we're still together."],
    ja: '車の中です。待って、車を止めます。', note: 'breaking up＝電話が途切れる。別れ話ではない',
    tags: tg(61, 'broadcast', 'humour', ['phone'], ['self-repair', 'idiom']),
    cja: ['車の中なんです。待って、車を止めます', 'はい、何年も聞いています', '別れる？ いいえ、まだ付き合ってます'],
    why: 'You\'re breaking up は電話の「音声が途切れている」。どこからかけているかを聞かれたので、場所と対処を答えるのが自然。別れ話ではありません。',
    ctx: 'ラジオの電話コーナーで'
  },
  {
    id: 'dho-hours-quality', type: 'gist', fam: 'debate', ask: '女性の 主張は？', focus: 'what it actually measures',
    lines: [
      ['gruff', 'The productivity figures speak for themselves. People at home work longer hours.', '生産性の数字が物語っています。在宅の人のほうが長く働いている。'],
      ['charlise', "Longer, yes. Better? That's a different question, and your figures don't answer it.", '長く、はい。でも、より良く？ それは別の問題で、あなたの数字はそれに答えていません。'],
      ['gruff', "With respect, you can't just wave away the data.", 'お言葉ですが、データを無視するわけにはいきませんよ。'],
      ['charlise', "I'm not waving it away. I'm asking what it actually measures.", '無視していません。それが実際に何を測っているのかを聞いているんです。']
    ],
    choices: ['The figures show hours, not the quality of the work.', 'People at home work fewer hours.', 'The data should be ignored completely.'],
    ja: '数字が示すのは労働時間で、仕事の質ではない。', note: 'Longer, yes. Better? で量と質を区別',
    tags: tg(65, 'broadcast', 'attitude', [], ['contrast', 'intonation']),
    cja: ['数字が示すのは労働時間で、仕事の質ではない', '在宅の人のほうが働く時間が短い', 'データは完全に無視すべきだ'],
    why: 'Longer, yes. Better? で量と質を区別しています。データを無視しているのではなく、数字が実際に何を測っているのかを問うのが女性の主張です。',
    ctx: '在宅勤務についての討論番組で'
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
    tags: tg(47, 'broadcast', 'hedge', [], ['contraction']),
    cja: ['あらゆる選択肢を検討しており、近くお客様にお知らせします', 'はい、6時間、保留でした', '3月に倍にしました、はい'],
    why: '幹部は補償の質問をかわし続けています。yes or no と迫られても「検討中」とはぐらかすのが現実的な流れ。数字を繰り返すだけではかみ合いません。',
    ctx: 'ニュース番組で、記者が企業の幹部に'
  },
  {
    id: 'dho-fossil-bias', type: 'gist', fam: 'lecture', ask: '化石の 記録について 正しいのは？', focus: 'biased sample',
    lines: [
      ['vivian', "Sorry, just to check: are you saying the fossil record is incomplete, or that it's misleading?", 'すみません、確認ですが、化石記録が不完全だということですか、それとも誤解を招くということですか？'],
      ['blathers', 'Both, rather. Incomplete, because most creatures never fossilise. Misleading, because the ones that do are mostly the hard-shelled ones.',
        'むしろ両方です。不完全なのは、ほとんどの生き物が化石にならないから。誤解を招くのは、化石になるのがたいてい硬い殻のある生き物だからです。'],
      ['vivian', "So we're seeing a biased sample.", 'つまり、偏ったサンプルを見ているわけですね。'],
      ['blathers', 'Precisely.', 'そのとおり。']
    ],
    choices: ['It over-represents creatures with hard parts.', "It's complete but hard to read.", 'Most creatures left good fossils.'],
    ja: '硬い部分のある生き物が多く残りすぎている。', note: 'Both, rather＝むしろ両方。偏りがポイント',
    tags: tg(64, 'broadcast', 'literal', [], ['contrast']),
    cja: ['硬い部分を持つ生き物が、実際より多く残っている', '記録は完全だが、読み解くのが難しい', 'ほとんどの生き物はよい化石を残した'],
    why: 'Both, rather で「不完全で、しかも誤解を招く」。化石になるのはたいてい硬い殻のある生き物なので、記録はそちらに偏っています（biased sample）。',
    ctx: 'イギリスの科学番組で、学生と教授が'
  },
  {
    id: 'dho-let-me-finish', type: 'next', fam: 'debate', focus: 'let me finish',
    lines: [
      ['zucker', 'The problem with congestion pricing is it hits the people who can least afford—', '渋滞課金の問題は、いちばん余裕のない人たちを直撃することで——'],
      ['nana', 'Sorry, but the evidence from three cities says the opposite.', 'すみませんが、3つの都市のデータは逆を示しています。'],
      ['zucker', "If you'd let me finish, I was going to say: unless the money goes back into buses.", '最後まで言わせてくれれば、「その税収がバスに回されない限りは」と言うつもりだったんです。',
        "If you'd let me finish, I was gonna say: unless the money goes back into buses."]
    ],
    choices: ['Fair enough. Then we may agree more than I thought.', "Sorry, I'll let you finish your bus.", 'Three cities, yes, all with congestion.'],
    ja: 'それなら納得です。思ったより意見が近いかもしれませんね。', note: '最後まで聞くと意見は近い。譲歩が自然',
    tags: tg(65, 'broadcast', 'attitude', [], ['self-repair', 'gonna']),
    cja: ['それなら納得です。思ったより意見が近いかもしれませんね', 'すみません、バスを最後まで終わらせて', '3都市、はい、どこも渋滞です'],
    why: '最後まで聞くと「税収がバスに回されない限りは」という条件付き。反論した側の意見に近いので、譲歩して歩み寄るのが自然な返しです。',
    ctx: '渋滞課金をめぐる討論番組で'
  },
  {
    id: 'dho-cool-change', type: 'gist', fam: 'radio', ask: '今日の 天気は？', focus: 'Cooler air',
    lines: [
      ['teddy', "We're looking at a hundred and five in Phoenix today, so if you're thinking of a jog at lunch...", '今日のフェニックスは華氏105度（約41度）。昼休みにジョギングしようと思ってるなら…'],
      ['gayle', "Don't. Just don't. Seriously, stay inside with the AC.", 'やめて。本当にやめて。エアコンの効いた室内にいて。'],
      ['teddy', 'Cooler air is supposed to move in around seven tonight, though.', 'でも今夜7時ごろには涼しい空気が入ってくるらしいよ。'],
      ['gayle', "'Cooler' meaning ninety. Great.", '「涼しい」って華氏90度（約32度）のことね。すてき。']
    ],
    choices: ['Very hot all day, a little cooler tonight.', 'Cool enough for a lunchtime jog.', 'Ninety degrees at lunchtime.'],
    ja: '一日中とても暑く、夜に少し涼しくなる。', note: "'Cooler' meaning 90 は皮肉。昼は105度",
    tags: tg(60, 'broadcast', 'sarcasm', [], ['ellipsis', 'numbers']),
    cja: ['一日中とても暑く、夜に少し涼しくなる', '昼休みのジョギングにちょうどいい涼しさ', '昼は華氏90度'],
    why: '昼は華氏105度で、ジョギングは Don\'t. Just don\'t.。夜は涼しくなるものの、\'Cooler\' meaning ninety（涼しいって90度ね）と皮肉っています。',
    ctx: 'フェニックスの朝のラジオで'
  },
  {
    id: 'dho-touch-cheerful', type: 'next', fam: 'documentary', focus: 'a touch too cheerful',
    lines: [
      ['pekoe', "Can we go again on that line? You sounded a touch too cheerful for a glacier that's disappearing.", 'そのセリフ、もう一回いい？ 消えゆく氷河にしては、ちょっと明るすぎたわ。'],
      ['octavian', "Fair point. A little less 'vacation commercial', a little more 'funeral'?", 'ごもっとも。「旅行のCM」感を減らして、「お葬式」寄りに？'],
      ['pekoe', 'Somewhere in between, ideally.', 'できれば、その中間で。']
    ],
    choices: ['Got it. Serious, but not gloomy. Going again.', "The glacier's in between two mountains.", 'Yes, the vacation commercial went really well.'],
    ja: '了解。重々しく、でも暗すぎず。もう一回いきます。', note: 'a touch＝少し。ナレーションの調子の話',
    tags: tg(64, 'colleague', 'humour', [], ['ellipsis']),
    cja: ['了解。重々しく、でも暗すぎず。もう一回いきます', '氷河は二つの山の間にあります', 'はい、旅行のコマーシャルはうまくいきました'],
    why: 'a touch too cheerful は「ちょっと明るすぎ」。コマーシャルと葬式の中間を求められたので、その調子で録り直すのが自然です。',
    ctx: 'ドキュメンタリーのナレーション収録で',
    scene: 'office'
  },
  {
    id: 'dho-headline', type: 'gist', fam: 'interview', ask: '男性の 引退について わかることは？', focus: "don't put it in the headline",
    lines: [
      ['poppy', "Four years ago you said you'd retire after this one. Still the plan?", '4年前、これが最後で引退すると言っていましたね。今もその予定ですか？'],
      ['sterling', "Ask me in a month. Right now my body says yes, but my head's not so sure.", '1か月後に聞いてよ。今は体はイエスって言ってるけど、頭はそうでもない。'],
      ['poppy', "So that's a maybe.", 'つまり、「たぶん」ですね。'],
      ['sterling', "That's a 'don't put it in the headline'.", '「見出しにはしないで」ってことだよ。']
    ],
    choices: ["He hasn't decided yet.", "He's retiring next month.", "He's definitely going to keep playing."],
    ja: 'まだ決めていない。', note: 'Ask me in a month＝まだ決めていない',
    tags: tg(63, 'broadcast', 'humour', [], ['contraction']),
    cja: ['まだ決めていない', '来月引退する', '絶対に現役を続ける'],
    why: 'Ask me in a month、体はイエスで頭はまだ。つまり未定です。\'don\'t put it in the headline\' は「見出しにはしないで」という冗談。',
    ctx: 'スポーツ番組で、ベテラン選手に'
  },
  {
    id: 'dho-print-money', type: 'next', fam: 'lecture', focus: 'worth less',
    lines: [
      ['marina', "So why can't the government just print more money and pay off everyone's debts?", 'じゃあ、政府がお金をもっと刷って、みんなの借金を返しちゃえばいいんじゃない？'],
      ['frett', "It can. Once. Then prices go up, and the money everyone's holding is worth less.", 'できますよ。一度はね。でもそのあと物価が上がって、みんなが持っているお金の価値が下がります。'],
      ['marina', 'So the debts shrink, but so do people\'s savings.', 'つまり借金は減るけど、貯金も目減りするのね。']
    ],
    choices: ["Exactly. Someone always pays. It's just less visible.", 'Yes, print it once and pay it twice.', 'Prices of printers have gone up, yes.'],
    ja: 'そのとおり。誰かが必ず払うんです。見えにくいだけで。', note: 'worth less＝価値が下がる。理解の確認に同意',
    tags: tg(64, 'broadcast', 'literal', [], ['contraction']),
    cja: ['そのとおり。誰かが必ず払うんです。見えにくいだけで', 'はい、一度刷って、二度払う', 'はい、プリンターの値段は上がりました'],
    why: '借金は減るけど貯金も目減りする、という要約は正しい理解です。講師は Exactly と認め、誰かが必ず負担する、とまとめるのが自然です。',
    ctx: '経済の入門講座で、学生が質問'
  },
  {
    id: 'dho-episode-three', type: 'gist', fam: 'radio', ask: '男性は どうする？', focus: 'One more',
    lines: [
      ['audie', "Have you watched it yet? Everyone says episode three's where it gets good.", 'もう見た？ みんな、第3話から面白くなるって言ってるよ。'],
      ['kicks', 'I gave up after two. If I need three hours to get to the good part...', '2話でやめた。面白いところまで3時間かかるなら…'],
      ['audie', 'Okay, but episode three is genuinely one of the best hours of TV I\'ve seen this year.', 'でも第3話は、今年見たテレビの中で本当に最高の1時間なんだって。'],
      ['kicks', "Fine. One more. But if it's not, you're buying lunch.", 'わかった。あと1話。でもそうじゃなかったら、ランチおごりね。']
    ],
    choices: ['Watch one more episode.', 'Stop watching the show.', 'Buy lunch for the woman.'],
    ja: 'あと1話だけ見る。', note: '条件付きで続ける。lunch は賭けの話',
    tags: tg(63, 'broadcast', 'humour', [], ['ellipsis', 'contraction']),
    cja: ['あと1話見る', 'そのドラマを見るのをやめる', '女性にランチをおごる'],
    why: 'Fine. One more. で、あと1話だけ見ることに。you\'re buying lunch は、面白くなかったら女性がおごるという賭けで、男性がおごるのではありません。',
    ctx: 'ポッドキャストで、ドラマの話を'
  },
  {
    id: 'dho-reported-crime', type: 'next', fam: 'stats', focus: 'Reported crime',
    lines: [
      ['lopez', 'Crime is down 11% from last year.', '犯罪は昨年比で11%減っています。', 'Crime is down eleven percent from last year.'],
      ['agnes', "Reported crime. Which isn't quite the same thing.", '「届け出のあった」犯罪ね。それは同じとは言えないでしょ。'],
      ['lopez', 'Meaning what?', 'というと？']
    ],
    choices: ['Meaning fewer people may be bothering to report it.', 'Meaning eleven, not seven.', 'Meaning crime is up eleven percent.'],
    ja: 'つまり、わざわざ届け出る人が減っているのかもしれない。', note: 'Reported に強勢。届け出数と実数は違う',
    tags: tg(65, 'broadcast', 'attitude', [], ['contrast', 'numbers']),
    cja: ['つまり、わざわざ届け出る人が減っているのかもしれない', 'つまり、7ではなく11ということ', 'つまり、犯罪は11%増えている'],
    why: 'Reported crime に強勢があり、届け出の件数と実際の犯罪は違うと指摘しています。Meaning what? への答えは、届け出が減っただけかもしれないという説明です。',
    ctx: 'ニュース番組で、統計の専門家が'
  },
  {
    id: 'dho-allow-it', type: 'gist', fam: 'talk', ask: 'やりとりの 結末は？', focus: "I'll allow it",
    lines: [
      ['bob', "Great talk, but isn't this just common sense with nicer slides?", 'いい講演でしたが、これって見栄えのいいスライド付きの常識にすぎないんじゃ？'],
      ['tia', 'Ha. Partly, sure. But common sense also told us the Earth was flat.', 'はは。一部はそうかも。でも、地球は平らだと言っていたのも常識でしたよね。'],
      ['bob', "Fair point. I'll allow it.", 'ごもっとも。認めよう。']
    ],
    choices: ['The man accepts her answer.', 'The man says her slides were bad.', 'She admits the talk was only common sense.'],
    ja: '男性は彼女の答えを受け入れる。', note: "I'll allow it＝認めよう（おどけた言い方）",
    tags: tg(47, 'broadcast', 'humour', [], ['contraction']),
    cja: ['男性は彼女の答えを受け入れる', '男性はスライドがひどかったと言う', '彼女は講演がただの常識だったと認める'],
    why: 'Fair point. I\'ll allow it. は「もっともだ、認めよう」。法廷ドラマの裁判官のまねで、おどけて相手の反論を受け入れています。',
    ctx: '講演後の質疑応答で'
  },
  {
    id: 'dho-look-away', type: 'next', fam: 'news', focus: 'look away now',
    lines: [
      ['label', "And with that, let's go to sports. Any good news?", 'というわけで、スポーツです。いいニュースはある？'],
      ['dom', "Depends who you root for. If it's the home team, I'd look away now.", '誰を応援してるか次第だね。地元チームなら、今のうちに目をそらして。'],
      ['label', 'That bad?', 'そんなにひどいの？']
    ],
    choices: ['Eleven to two, and honestly, it felt even worse.', "Yes, let's go to sports now.", "Look away? But I'm reading the news."],
    ja: '11対2。正直、もっとひどく感じたよ。', note: 'look away now＝見ない方がいい。大敗の合図',
    tags: tg(62, 'broadcast', 'humour', [], ['idiom']),
    cja: ['11対2。正直、もっとひどく感じたよ', 'はい、スポーツに行きましょう', '目をそらす？ でも私がニュースを読んでるのに'],
    why: 'I\'d look away now は「今のうちに目をそらして」で、地元チームが大敗した合図。That bad? と聞かれたので、スコアでひどさを答えるのが自然です。',
    ctx: '夜のニュースで、スポーツコーナーへ'
  },
  {
    id: 'dho-lab-notes', type: 'gist', fam: 'lecture', ask: 'わかったことは？', focus: 'lab notes',
    lines: [
      ['shep', 'So the famous story is that he discovered it completely by accident.', '有名な話では、彼はまったくの偶然でそれを発見したんですよね。'],
      ['audie', "That's the story he told. His lab notes tell a very different one.", '本人がそう語ったんです。でも実験ノートはかなり違う話をしています。'],
      ['shep', 'Different how?', 'どう違うんですか？'],
      ['audie', "He'd been chasing it for two years. The 'accident' made a better headline.", '2年間も追い求めていたんです。「偶然」のほうが見出し映えしただけで。']
    ],
    choices: ['The discovery was planned, not an accident.', 'The lab notes were lost for two years.', 'He found it completely by accident.'],
    ja: '発見は偶然ではなく、狙ったものだった。', note: '「偶然」は作り話。ノートが証拠',
    tags: tg(64, 'broadcast', 'attitude', [], ['contrast']),
    cja: ['発見は偶然ではなく、狙ったものだった', '実験ノートは2年間なくなっていた', '彼はまったくの偶然で見つけた'],
    why: 'That\'s the story he told と言ってから、実験ノートは別の話をしていると反論。2年間追い求めていて、「偶然」のほうが見出し映えしただけです。',
    ctx: '科学史のポッドキャストで'
  },
  {
    id: 'dho-starter', type: 'next', fam: 'interview', focus: 'earn its place',
    lines: [
      ['katt', "You've said Japanese food changed how you cook. In what way?", '和食で料理が変わったとおっしゃっていますね。どんなふうに？'],
      ['pietro', 'Restraint, mostly. I used to put twelve things on a plate. Now it\'s three, and each one has to earn its place.', '主に引き算だね。昔は皿に12品も載せてた。今は3つで、どれもそこにいる意味がないといけない。'],
      ['katt', 'Do your customers ever ask where the rest is?', 'お客さんに「残りはどこ？」と聞かれたりしません？']
    ],
    choices: ['Every night. Some still think it\'s an appetizer.', 'Three, and each one earned it.', 'Twelve plates, yes, every night.'],
    ja: '毎晩だよ。いまだに前菜だと思う人もいる。', note: 'appetizer＝前菜。量が少なく見える冗談',
    tags: tg(63, 'broadcast', 'humour', [], ['contraction']),
    cja: ['毎晩だよ。いまだに前菜だと思う人もいる', '3つで、どれもその価値があった', '皿12枚、はい、毎晩'],
    why: '12品から3品に減らした話を受けて「残りはどこ？」と聞かれる冗談。量が少なくて前菜と間違えられる、と笑って返すのが自然です。',
    ctx: '料理番組で、シェフへのインタビュー'
  },
  {
    id: 'dho-spread-them', type: 'gist', fam: 'debate', ask: '女性の 提案は？', focus: 'across the country',
    lines: [
      ['agnes', "Overtourism isn't really about numbers. Kyoto in November and Kyoto in February are two different cities.", '観光公害は数の問題じゃないんです。11月の京都と2月の京都は、まるで別の街です。'],
      ['hamlet', 'So spread visitors across the year, rather than cap them?', 'じゃあ、上限を設けるより一年中に分散させろと？'],
      ['agnes', 'Across the year and across the country. Most visitors see the same six places.', '一年中に、そして全国に。ほとんどの観光客は同じ6か所しか見ないんですから。']
    ],
    choices: ['Spread tourists out in both time and place.', 'Put a strict cap on visitor numbers.', 'Visit Kyoto in November instead.'],
    ja: '時期と場所の両方で観光客を分散させる。', note: 'cap ではなく spread。時期と場所の両方',
    tags: tg(65, 'broadcast', 'literal', ['video'], ['contrast']),
    cja: ['時期と場所の両方で、観光客を分散させる', '観光客の数に厳しい上限を設ける', '代わりに11月に京都を訪れる'],
    why: 'cap（上限）ではなく spread（分散）かと聞かれ、Across the year and across the country と、時期にも場所にも分けると答えています。',
    ctx: '観光公害についてのオンライン討論で'
  },
  {
    id: 'dho-swim', type: 'next', fam: 'radio', focus: 'stalled bus',
    lines: [
      ['henry', 'The bridge is closed northbound, so use the tunnel.', '橋は北行きが通行止めなので、トンネルを使ってください。'],
      ['label', "Actually, we're just hearing the tunnel's closed too, for a stalled bus.", 'と思ったら、今入った情報ではトンネルもバスの立ち往生で通行止めだそうです。'],
      ['henry', 'Oh, terrific. So what are our listeners supposed to do, swim?', 'ああ、最高だね。じゃあリスナーはどうすればいいの、泳ぐ？']
    ],
    choices: ['Honestly? If you can, wait an hour.', 'The bus is stalled northbound, yes.', 'Yes, swimming is closed too.'],
    ja: '正直なところ、できるなら1時間待ってから出てください。', note: 'terrific／swim? は皮肉。現実的な助言が次',
    tags: tg(62, 'broadcast', 'sarcasm', [], ['self-repair', 'contraction']),
    cja: ['正直に言うと、できるなら1時間待ってください', 'バスは北行きで立ち往生してます、はい', 'はい、水泳も中止です'],
    why: 'Oh, terrific と swim? は皮肉。橋もトンネルも通れないので、次は「出発を遅らせて」という現実的な助言をするのが自然です。',
    ctx: '朝のラジオの交通情報で'
  },
  {
    id: 'dho-chocolate', type: 'gist', fam: 'stance', ask: '男性の 考えは？', focus: 'funded by a chocolate company',
    lines: [
      ['judy', 'So, does this new study prove that chocolate is good for you?', 'で、この新しい研究で、チョコが体にいいって証明されたの？'],
      ['flick', "'Prove' is a strong word. It found a link in about two hundred people, and it was funded by a chocolate company.", '「証明」は言いすぎだね。約200人で関連が見つかっただけで、しかも資金はチョコレート会社から。'],
      ['judy', 'Ah. Funded by them. I see.', 'ああ…出資元がそこなのね。'],
      ['flick', "'Ah' is about right.", 'その「ああ」が正解。']
    ],
    choices: ['The study is weak and possibly biased.', 'Chocolate has been proven to be healthy.', 'Two hundred people got sick from chocolate.'],
    ja: 'その研究は根拠が弱く、偏っているかもしれない。', note: "'Ah' is about right＝その反応どおり怪しい",
    tags: tg(19, 'broadcast', 'attitude', [], ['ellipsis']),
    cja: ['その研究は根拠が弱く、偏っているかもしれない', 'チョコが体にいいと証明された', '200人がチョコで体調を崩した'],
    why: '\'Prove\' is a strong word で「証明」は言いすぎ。約200人、しかも出資はチョコ会社です。\'Ah\' is about right は「その反応で正解」。',
    ctx: '朝の情報番組で、健康ニュースを'
  },
  {
    id: 'dho-your-job', type: 'next', fam: 'interview', focus: 'Bold.',
    lines: [
      ['poppy', 'Where do you see yourself in five years?', '5年後、どうなっていたいですか？'],
      ['kid-cat', 'Honestly? In your job, ideally.', '正直に？ できれば、あなたのポジションに。'],
      ['poppy', "Bold. I'll let my boss know you're coming for me.", '大胆ね。私の座を狙ってる人がいるって上司に伝えておくわ。']
    ],
    choices: ["Ha. Only once you've been promoted, of course.", 'Five years, yes, in this building.', "Thank you, I'm coming at nine tomorrow."],
    ja: 'はは。もちろん、あなたが昇進したあとで。', note: 'Bold＝大胆だね（冗談）。冗談で返すのが自然',
    tags: tg(46, 'official', 'humour', [], ['contraction']),
    cja: ['はは。もちろん、あなたが昇進したあとで', '5年、はい、このビルで', 'ありがとう、明日9時に行きます'],
    why: 'Bold. と coming for me（私の座を狙ってる）は冗談半分の返し。冗談で受けつつ「あなたが昇進してから」と角を立てないのが自然です。',
    ctx: '採用面接で、面接官が質問',
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
    tags: tg(62, 'broadcast', 'humour', [], ['self-repair']),
    cja: ['番組で言った間違いを訂正している', '万里の長城は宇宙から見えると言っている', '失礼なリスナーに文句を言っている'],
    why: 'Quick correction from last week で訂正だとわかります。Some were very polite は、そうでない人もいたという軽い皮肉。',
    ctx: 'ラジオ番組の冒頭で'
  },
  {
    id: 'dho-benches', type: 'next', fam: 'lecture', focus: 'stay longer',
    lines: [
      ['tia', 'The study found that adding benches increased foot traffic to local stores by nearly a fifth.', 'ベンチを置くと、地元の店への人通りが5分の1近く増えたという研究があります。'],
      ['anchovy', 'Benches? Not bike lanes, not parking? Benches?', 'ベンチ？ 自転車レーンでも駐車場でもなく？ ベンチ？'],
      ['tia', 'People who can sit down stay longer. People who stay longer spend more.', '座れる人は長居する。長居する人はたくさん使うんです。']
    ],
    choices: ['Right, so comfort turns into money.', 'So the stores sell benches now?', 'A fifth of the benches, yes.'],
    ja: 'なるほど、快適さがお金に変わるわけだ。', note: '座る→長居→消費の因果。要約が自然',
    tags: tg(64, 'broadcast', 'literal', [], ['ellipsis']),
    cja: ['なるほど、快適さがお金に変わるわけだ', 'じゃあ、お店は今ベンチを売ってるの？', 'ベンチの5分の1、はい'],
    why: '座れる人は長居し、長居する人はお金を使う、という因果の説明です。それを要約して受けるのが自然。foot traffic は「人通り」です。',
    ctx: 'まちづくりの講座の質疑応答で'
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
    tags: tg(61, 'broadcast', 'humour', [], ['contraction']),
    cja: ['浸水で、ギターが1本しか残らなかったから', '音作りを綿密に計画したから', '評論家に頼まれたから'],
    why: 'Deliberate is generous は「意図的と言うのは好意的すぎる」。浸水で古いギターしか残らなかった、うれしい偶然（happy accident）です。',
    ctx: '音楽番組で、ミュージシャンへのインタビュー'
  },
  {
    id: 'dho-fewer-dates', type: 'next', fam: 'culture', focus: 'Fewer dates',
    lines: [
      ['flick', 'Final question. If you could change one thing about how we teach history, what would it be?', '最後の質問です。歴史の教え方をひとつ変えられるとしたら、何にしますか？'],
      ['rosie', "Fewer dates, more 'why'. Nobody remembers 1803, but everyone remembers a good argument.", '年号を減らして、「なぜ」を増やす。1803年なんて誰も覚えてないけど、いい議論はみんな覚えてる。',
        "Fewer dates, more 'why'. Nobody remembers eighteen oh three, but everyone remembers a good argument."],
      ['flick', 'I bet a few historians listening just spit out their coffee.', '聞いている歴史家の何人かが、今コーヒーを吹き出したと思いますよ。']
    ],
    choices: ["Good. That's exactly the kind of argument I mean.", 'Eighteen oh three, yes, a good date.', "Coffee? No thanks, I'm fine."],
    ja: 'いいですね。まさにそういう議論のことです。', note: 'spit out their coffee＝驚いて反発。受けて立つ',
    tags: tg(65, 'broadcast', 'humour', [], ['numbers', 'idiom']),
    cja: ['いいですね。まさにそういう議論のことです', '1803年、はい、いい年号です', 'コーヒー？ いえ、結構です'],
    why: 'spit out their coffee は「驚いてコーヒーを吹き出す」。歴史家が反発しそうだと言われ、それこそ私の言う議論だ、と受けて立つのが自然です。',
    ctx: '歴史教育についてのインタビューの最後に'
  },
  {
    id: 'dho-heat-island', type: 'gist', fam: 'lecture', ask: '都市が 暑い 理由と 時間帯は？', focus: 'heat island',
    lines: [
      ['molly', "Why does it always feel hotter in the city than out at my parents' place?", 'どうして都会はいつも、実家のあたりより暑く感じるの？'],
      ['shep', 'The heat island effect. Concrete and roads soak up heat all day and let it out at night.', 'ヒートアイランド現象だよ。コンクリートや道路が一日中熱をため込んで、夜に放出するんだ。'],
      ['molly', 'So it\'s worse at night, not during the day?', 'じゃあ昼じゃなくて、夜のほうがひどいの？'],
      ['shep', "The gap's biggest at night. That's when the city can be fifteen degrees warmer.", '差が一番大きいのは夜。そのとき都会は華氏で15度（約8度）も暖かいことがある。']
    ],
    choices: ['Stored heat makes cities warmer, most of all at night.', 'Cities are fifteen degrees hotter during the day.', "Her parents' place is in the hottest area."],
    ja: 'ためた熱で都市が暖かくなり、特に夜に差が大きい。', note: '差が最大なのは夜。fifteen は夜の差',
    tags: tg(60, 'broadcast', 'literal', [], ['contraction']),
    cja: ['ためた熱で都市が暖かくなり、特に夜に差が大きい', '都市は昼に15度暑い', '彼女の実家は一番暑い地域にある'],
    why: 'コンクリートが昼に熱をため、夜に放出するので、差が一番大きいのは夜。fifteen degrees は夜の差で、昼の話ではありません。',
    ctx: '科学ポッドキャストで、リスナーの質問に'
  }
];

/** The dialogues (25). */
export const DIALOGUES: readonly Item[] = DROWS.map(dialogue);

/** Each item's and dialogue's family (the brief's: news, radio, lecture…), for coverage and the integrator. */
export const FAMILY: Readonly<Record<string, Family>> = family;
