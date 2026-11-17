// “Ron gives advice as a show host, naturally | Parks and Recreation” (the official Parks and Recreation channel,
// Season 5): Ron comes on Joan's TV show to plug a park gala, Joan is too hung over to go on, and the crew keeps Ron on
// air taking calls; meanwhile Leslie, stuck at a disaster drill, hears the news from Ben, and Ron answers callers his
// own way (a walnut for a chewed table, "ditch the terrier", a hangover cure he says he never needs).
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈224 s; whisper loops "Good morning" from
// 227 s. Untested: the caller's bet at 60–67 s (a "sexiest couple" question; names garbled), the off-camera prompt at
// 54.5 s ("take it, take it" vs "take a ticket"), Leslie's line at 106 s (garbled in both), whisper's second "Fix it!"
// vs the captions' "okay" at 108 s, 149.7 s "pan-fried and salted butter" (both), "woodworking" at 161 s (captions only;
// whisper garbles it), the book/food/music and banks answers at 192–201 s (world knowledge). 8 s "booze cruise" is
// "boost cruise" in the captions (an ASR slip; no key rests on it). No who, predict or stress item.
// REVIEW 2026-11-16: pass 10, fix 14, drop 0, new 0; ear checks 0
//   open: nt1, nt2, nt3 (C2) read 50–65 % blind; I kept them, because each distractor is a one-step near miss
//   that the anchor refutes
// EAR CHECK: none (every key's words agree in whisper and the captions; no key rests on tone alone).
import type { Clip } from '../types.ts';

export const ronShowHost: Clip = {
  id: 'ronhost', video: 'AWBuLWGRi4s', title: 'Ron gives advice as a show host, naturally', dur: 248, wpm: 151,
  band: 'mid', tags: ['電話', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: hands him the show ← Ron's "lie down somewhere?" and Joan stopping heard as her leaving to rest (the crew
    //   won't take her off camera); offers ← "I do need to promote this event" heard as him pushing to host
    // R fix: S1/V2, "end up" in the stem pointed at the one choice where Ron doesn't choose
    { id: 'g1', skill: 'gist', level: 'B2', point: 'host', reveals: ['apparently', 'goon'], seg: [0.2, 126.8],
      stem: 'Why is Ron the one taking calls on the TV show?',
      choices: ['The host can’t carry on, and the crew keeps him on air',
                'The host hands him the show and goes off to rest',
                'He offers to take over so his event gets more airtime'], a: 0,
      cue: 'ジョーンの本番の第一声と、スタッフの指示。',
      said: '本番の第一声は「今日の番組はやりません」。スタッフはロンに電話を受け続けさせる。',
      mean: '司会が続けられず、代役として放送に残された。自分から名乗り出たのではない。',
      trap: '「宣伝したい」と言っていたので、自分から引き受けたと思いやすい。誰の指示かを聞く。',
      use: 'Can you cover for me today?（今日、代わりをお願いできる？）' },

    // R fix: V2, "how does she say she is?" made a health answer the default; the stem now asks what she tells him,
    //   and "nervous" is now "running late" ("a little" + "finished up an hour ago")
    // why: weather ← the literal reading of "under the weather"; late ← "a little…" heard as "a little late", with
    //   the trip that "just finished" as the reason
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'weather', seg: [4.55, 7.62],
      stem: 'When Joan first answers Ron, what does she tell him?',
      choices: ['She’s feeling slightly unwell', 'She’s upset about the weather', 'She’s running a little late'], a: 0,
      cue: '「listen」のあと、天気の語を使った言い方。',
      line: 'Yeah, listen, I’m *a little under the weather*.',
      said: '「ちょっと調子が悪くて」と切り出す。',
      mean: 'under the weather ＝ 体調がすぐれない。天気の話ではない決まり文句。',
      trap: '文字どおり天気の話と取りやすい。体の話に天気の語が出たら、慣用句を疑う。',
      use: 'I’m a bit under the weather today.（今日はちょっと体調が悪い）' },

    // why: last week ← the first time phrase heard ("last week"); last night ← a hangover story usually means the night
    //   before (a broken script)
    { id: 'n1', skill: 'number', level: 'B1', point: 'cruise', reveals: ['hangover'], seg: [7.2, 11.7], keep: true,
      stem: 'When does Joan say her cruise ended?',
      choices: ['An hour ago', 'Last night', 'Last week'], a: 0,
      cue: '「last week」のあと、Just で始まる一文。',
      line: 'Went on a booze cruise last week. Just *finished up an hour ago*.',
      said: '「先週クルーズに行って、1時間前に終わったところ」。',
      mean: 'finished up an hour ago ＝ ついさっき終わった。終わったのは今日。',
      trap: 'last week が先に聞こえるので選びやすい。始めた時と終えた時を分けて聞く。',
      use: 'I just got back an hour ago.（1時間前に帰ってきたところ）' },

    // why: a cold ← "under the weather" plus "allergies" heard as a real illness picked up on the trip (right link to the
    //   cruise, wrong cause); skip ← "a little under the weather" heard as the start of a polite excuse (the Japanese
    //   frame: 体調が…と断る前置き)
    // anchor: 7.68–11.4 s "booze cruise… just finished up an hour ago" right before "On a completely unrelated note";
    //   137.44–141.3 s Ron names it: "She has a bad hangover, which she is pretending is allergies" (both sources;
    //   captions "pretending as"); 20.88–24.7 s "I'm a true professional. The show must go on" rules out skipping
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'hangover', reveals: ['weather', 'cruise'],
      seg: [7.2, 24.85],
      stem: 'When Joan says “On a completely unrelated note…”, what is she trying not to say?',
      choices: ['That the cruise’s drinking is what’s wrong', 'That she caught a cold while on the cruise',
                'That she’d rather skip the interview today'], a: 0,
      cue: '「unrelated」と言いつつ並べた、二つの話の関係。',
      line: 'Went on a booze cruise… *On a completely unrelated note*, I have horrible *allergies*.',
      said: '酒のクルーズが1時間前に終わったと言い、「全然別の話だけど、ひどいアレルギーで」と続ける。',
      mean: '「関係ない」と断るほど関係が分かる。アレルギーは二日酔いの言いかえで、あとでロンも「ふり」と言う。',
      trap: '体調の話なので、旅先の風邪と取りやすい。わざわざ「関係ない」と言ったら、二つをつなげて聞く。',
      use: 'Totally unrelated, but can I borrow your car?（全然関係ないけど、車借りていい？）' },

    // R fix: V2, the key was the only two-part choice; all three now start "Noting her trouble, then…"
    // why: another day ← the Japanese frame: after "Sorry to hear that", a polite guest would back off (また今度);
    //   go home and rest ← sympathy heard as concern for her health
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'promote', seg: [14.5, 22.75],
      stem: 'When Ron answers Joan’s news, what is his reply doing?',
      choices: ['Noting her trouble, then insisting on his interview', 'Noting her trouble, then offering to come another day',
                'Noting her trouble, then telling her to go home and rest'], a: 0,
      cue: '「Sorry」の直後、But で始まる一文。',
      line: 'Sorry to hear that. … *But I do need to promote this event.*',
      said: '「お気の毒に」と短く言い、すぐ「でもイベントの宣伝はしないと」と続ける。',
      mean: '気づかいは一言で済ませ、本題は自分の用事。インタビューはやってほしいという念押し。',
      trap: '日本語の感覚では「また今度」と引くのが自然に思える。But のあとが本当の希望。',
      use: 'Too bad. But we still need it today.（それは大変。でも今日中に要るんだ）' },

    // why: plugs the gala ← "show" and the gala were just talked about, so a host's cancel-and-plug seems likely;
    //   confesses ← the hangover is in the air, so her first words seem like an admission
    // R fix: V2/K5, the key was the only "It…" choice and the only one with an intensifier; now three parallel
    //   "It…" choices
    { id: 'h1', skill: 'humor', level: 'C1', point: 'goon', seg: [20.7, 34.0],
      stem: 'Why is Joan’s opening line on air funny?',
      choices: ['It reverses what she said a moment ago', 'It cancels the show to plug Ron’s gala',
                'It admits on air she’s been drinking'], a: 0,
      cue: '本番前の決めぜりふと、本番の第一声。',
      line: 'I’m a true professional. *The show must go on.* … Today’s show *will not go on*.',
      said: '「プロだから、ショーは続けなきゃ」と言った直後、本番で「今日の番組は続けません」。',
      mean: '決めぜりふをそのまま否定形で返す落差が笑い。強がりがすぐ崩れる。',
      trap: 'イベントの話から、宣伝のためと取りやすい。同じ語が戻ったら、前と比べて聞く。',
      use: 'The show must go on.（何があってもやるしかない）' },

    // why: fixing up ← "Pawnee Commons" sounds like a place that already exists; fire department ← firemen come up
    //   later, and a gala often raises money for them
    { id: 'd1', skill: 'detail', level: 'B1', point: 'park', seg: [44.3, 54.4],
      stem: 'What will the money from tonight’s event go toward?',
      choices: ['Building a new park', 'Fixing up an old park', 'Helping the fire department'], a: 0,
      cue: '「All proceeds」のあと、go toward の行き先。',
      line: 'All proceeds will go toward *building a park*.',
      said: '「収益はすべて公園づくりに」と説明する。',
      mean: 'proceeds ＝ 収益、go toward ＝ ～に充てられる。新しい公園を建てる資金。',
      trap: 'Pawnee Commons の名前から、今ある場所の手入れと取りやすい。building は「建てる」。',
      use: 'All proceeds go to the animal shelter.（収益はすべて動物保護施設へ）' },

    // R fix: V2, "he had asked the crew" went against "apparently" outright; now a near miss on its hearsay sense
    //   (told by whom: the crew off camera, not viewers)
    // why: doubts callers ← "apparently" read as "maybe" (かもしれない); viewers asked ← the hearsay sense caught,
    //   but pinned on the audience, though the prompt comes from off camera
    { id: 'i1', skill: 'marker', level: 'C1', point: 'apparently', reveals: ['host'], seg: [54.35, 59.5],
      stem: 'When Ron says he’ll take calls, what does his last word show?',
      choices: ['He has only just been told he’s doing this', 'He doubts that anybody will call in at all',
                'He has heard that viewers asked for calls'], a: 0,
      cue: '電話を受けると言った文の、最後の一語。',
      line: 'I will take your calls, *apparently*.',
      said: '画面の外から促され、「では電話を受けます…どうやらね」と言う。',
      mean: 'apparently ＝ そう決まったらしい。自分で決めたのではない、という含み。',
      trap: '「たぶん」と取ると、電話が来るか不安に聞こえる。apparently は人から聞いた話の印。',
      use: 'Apparently, I’m in charge now.（どうやら僕が担当らしい）' },

    // why: a real emergency ← the literal reading of "disaster"; looks real ← "simulated" heard as "realistic", so the
    //   drill sounds convincing
    { id: 'i2', skill: 'infer', level: 'B2', point: 'drill', seg: [69.8, 74.9],
      stem: 'What does Leslie say when asked how things are going?',
      choices: ['The practice run is turning into a mess', 'A real emergency has broken out in town',
                'The fake disaster looks a lot like the real thing'], a: 0,
      cue: '同じ語が2回。一つ目の前に付いた語に注目。',
      line: 'Well, this *simulated disaster* is a *total disaster*.',
      said: '「この訓練の大事故が、本物の大失敗になってる」と答える。',
      mean: 'total disaster ＝ 大失敗。訓練そのものがうまくいっていない。',
      trap: 'disaster を文字どおり取ると、本物の事故に聞こえる。simulated は「訓練用」の印。',
      use: 'The trip was a total disaster.（旅行は大失敗だった）' },

    // R fix: V2, "annoyed" was weak; now "Ron who?" read literally (誰？), which "Ron Swanson?" refutes at once
    // why: pleased ← Ron filling in reads as help for her event; confused ← "Ron who?" taken as a real question
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'tv', seg: [74.9, 81.1],
      stem: 'How does Leslie react to the news about the TV show?',
      choices: ['Amazed: TV is the last place she’d expect him', 'Pleased: he’s the right person to sell the event',
                'Confused: she can’t think which Ron he means'], a: 0,
      cue: '名前を聞き返す言い方と、最後の短い問い。',
      line: 'Ron subbed for you on Pawnee Today. — *Ron who? Ron Swanson? On television?*',
      said: '「ロンが代わりに出た」と聞き、「ロンって誰？スワンソン？テレビに？」と聞き返す。',
      mean: '名前を2回確かめ「テレビに？」と重ねるのは強い驚き。ロンとテレビが結びつかない。',
      trap: 'Ron who? を「誰？」と取りやすいが、すぐ名字が出る。聞き返しは驚き。',
      use: 'Wait, you? Singing karaoke?（え、君が？カラオケで歌うの？）' },

    // why: Jerry ← "We don't know where Jerry is" comes just before; chairs ← "Donna still can't find any chairs" is the
    //   other problem, so firemen helping seems likely
    { id: 'd2', skill: 'detail', level: 'B1', point: 'firemen', seg: [83.45, 91.95],
      stem: 'What does Ben say the firemen are doing at the lot?',
      choices: ['Using the lot for their drill', 'Looking for Jerry around the lot', 'Bringing extra chairs to the lot'],
      a: 0,
      cue: '「And now」のあと。',
      line: '*And now*, some firemen are *using the lot* as a triage center for the emergency drill.',
      said: '「椅子はないし、ジェリーもいない。そのうえ消防士が会場を使ってる」と伝える。',
      mean: '消防士が、訓練の救護所として会場の空き地を使っている。問題がまた一つ。',
      trap: '椅子もジェリーも聞こえるので、つなげて選びやすい。And now のあとが新しい話。',
      use: 'And now, it’s starting to rain.（しかも今度は雨が降ってきた）' },

    // R fix: V2, "finish your call quickly" was easy to rule out; now the towers reason he gave just before
    // why: didn't hear ← a repeat often just means "I'll say it again" (but she answered him, so she heard); towers
    //   ← "overloaded cell phone towers" said just before, so the repeat seems to carry that warning
    { id: 'pr2', skill: 'pragma', level: 'B1', point: 'allphones', seg: [93.2, 107.9],
      stem: 'When Leslie objects, what is the second “All phones” doing?',
      choices: ['Refusing to make an exception for her', 'Repeating it because she didn’t hear him',
                'Warning her the towers will cut her call'], a: 0,
      cue: 'Leslie の言い分のあと、同じ二語がもう一度。',
      line: '*All phones.* — But I’m talking to someone important. — *All phones.*',
      said: '「電話は全部」と言われ、「大事な人と話してる」と返すが、また「電話は全部」。',
      mean: '同じ言葉を繰り返し、例外は認めないと伝えている。説明を足さない断り方。',
      trap: '電波塔の話から、理由の念押しと取りやすい。同じ言葉だけが返るのは、きっぱりした断り。',
      use: 'Sorry, no exceptions.（すみません、例外はなしです）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'fixit', seg: [104.4, 108.9],
      stem: 'Type what Leslie shouts: “___, Ben!” (2 words)', answer: 'fix it',
      cue: '電話を手放す直前、ベンの名前の前。',
      line: '*Fix it*, Ben!',
      said: '電話を取られる前に「ベン、何とかして！」と叫ぶ。',
      mean: 'fix it ＝ 何とかして、直して。fix と it がつながり「フィクスィット」に聞こえる。',
      trap: 'it が弱く、fix だけ、または fixed に聞こえやすい。動詞のあとの短い it を探す。',
      use: 'Can you fix it by tonight?（今夜までに直せる？）' },

    // why: two ← "a second" is heard last; none yet ← "got a lead" heard as still searching for all of them
    { id: 'n2', skill: 'number', level: 'B2', point: 'chair', seg: [110.9, 116.3], keep: true,
      stem: 'How many chairs have been found so far?',
      choices: ['None yet', 'One chair', 'Two chairs'], a: 1,
      cue: '「found」と「a lead on」のちがい。',
      line: 'I *found one chair*. Got *a lead on* a second.',
      said: '「椅子を1つ見つけた。2つ目も当てがある」と報告する。',
      mean: 'got a lead on ～ ＝ ～の手がかりがある。2つ目はまだ見つかっていない。',
      trap: 'second が聞こえるので2つと取りやすい。lead は「見込み」で、手に入れたわけではない。',
      use: 'I’ve got a lead on an apartment.（部屋のあてが一つある）' },

    // R fix: V2, of three choices the usual "Shouldn't you be…" was the likely one; a fourth form, "Wouldn't you"
    // why: Should you ← the n't's t drops, so it sounds like a plain question; Couldn't you / Wouldn't you ← the
    //   weak first syllable caught as another -ouldn't ("couldn't you take her…")
    { id: 's1', skill: 'sound', level: 'B2', point: 'shouldnt', seg: [116.7, 119.95],
      stem: 'Fill the gap: “___ be taking her to lie down somewhere?”',
      choices: ['Shouldn’t you', 'Should you', 'Couldn’t you', 'Wouldn’t you'], a: 0,
      cue: '文の最初、be の前の短い2語。',
      line: '*Shouldn’t you* be taking her to lie down somewhere?',
      said: '「どこかで横にならせたら？」とスタッフに聞く。',
      mean: 'Shouldn’t you ～? ＝ ～したほうがいいのでは。t がほぼ消え「シュドゥンチュ」。',
      trap: 'Should you だと迷う意味の質問になる。t が消えても n の鼻の音は残る。',
      use: 'Shouldn’t you be at work?（仕事じゃないの？）' },

    // why: feel worse ← Ron's "lie down" suggestion turned round, a health reason; viewers worry ← "off camera" heard
    //   as the audience noticing she's gone
    { id: 'd4', skill: 'detail', level: 'B2', point: 'offcam', seg: [117.0, 123.15],
      stem: 'Why won’t the crew take Joan off the air?',
      choices: ['She’d fire them all if she found out', 'Moving her now might make her feel worse',
                'Viewers would worry if she suddenly vanished'], a: 0,
      cue: '「Oh, no」のあと、if で始まる文。',
      line: 'If she ever *found out* that we took her off camera, *we’d all be fired*.',
      said: '「カメラから外したと知られたら、全員クビだ」と言う。',
      mean: '休ませないのは、ジョーンに知られてクビになるのが怖いから。体調より自分たちの身。',
      trap: '「横にならせては」の流れから、体を気づかう理由を探しやすい。if のあとが理由。',
      use: 'If my boss finds out, I’m done.（上司にばれたら終わりだ）' },

    // R fix: V2 (GUIDE §9.4), the title ("gives advice… naturally") and Ron's manner answered "how"; now asks what
    //   the calls turn into, and the key reveals i3's point
    // why: the gala ← "Come to the gala" and "questions about tonight's gala" are said, and he came to promote it;
    //   Joan's health ← the first answered call asks "what's wrong with Joan?"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'style', reveals: ['ditch', 'hopefully'], seg: [126.75, 224.6],
      stem: 'Taking calls, what does Ron mostly end up talking about?',
      choices: ['His own views on whatever callers ask', 'The gala he came on the show to promote',
                'Joan’s health and how she is doing'], a: 0,
      cue: '答えの中身と、ガラが出てくる回数。',
      said: '机の直し方に答えたあと犬を替えろと言い、幽霊の相談には「寂しいだけ」と返す。',
      mean: '遠慮なく言い切り、頼まれていない助言まで足す。宣伝より、本人の考えが前に出ている。',
      trap: '「ガラに来て」が聞こえるので、宣伝ばかりと取りやすい。答えの中身の多さで判断する。',
      use: 'Can I give you some honest advice?（正直なアドバイスしてもいい？）' },

    // R fix: S3, the cue's "calls" was in the key only; V2, "buy tickets" was weak, now "still" heard as weariness
    // why: unsure the gala happens ← "hopefully" read as doubt about the event (かもしれない); tired ← "still taking
    //   your calls" heard as a sigh about how long it's gone on
    { id: 'i3', skill: 'infer', level: 'B2', point: 'hopefully', seg: [126.75, 133.9],
      stem: 'Back on air, what does Ron’s wish about the calls suggest?',
      choices: ['The calls so far haven’t been about the gala', 'He’s not sure the gala will happen tonight',
                'He’s getting tired of taking calls all day'], a: 0,
      cue: '「I am still taking your…」のあとの一語。',
      line: 'I am still taking your calls, *hopefully about tonight’s gala*.',
      said: '「引き続き電話を受けます。できれば今夜のガラについて」と話す。',
      mean: 'hopefully を付けたのは、これまでの電話がガラと関係なかったから。軽いぼやき。',
      trap: '「できれば」を、ガラが開けるかの不安と取りやすい。何についての電話か、を言っている。',
      use: 'Next question, hopefully an easy one.（次の質問、簡単なのだといいな）' },

    // R fix: V2, "fears she's ill" was weak; now a near miss on degree (a hint vs the plain words he uses)
    // why: keeps her cover ← "allergies" is said, so he seems to go along with her story; a polite hint ← "which
    //   she is pretending" heard as a tactful aside, but "bad hangover" comes first, flat out
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'hangover', reveals: ['weather'], seg: [133.9, 141.5],
      stem: 'When a caller asks about Joan, what does Ron’s answer show about him?',
      choices: ['He says the plain truth, even if it embarrasses her', 'He keeps her cover story going for the viewers',
                'He hints at the truth but keeps it polite'], a: 0,
      cue: '答えの後半、which のあとの動詞。',
      line: 'She has a *bad hangover*, which she is *pretending* is allergies.',
      said: '「ひどい二日酔いで、それをアレルギーだと言っている」と答える。',
      mean: '本人が隠したい事を、放送でそのまま言う。気づかいより正直さを選ぶ人。',
      trap: 'アレルギーの語から、話を合わせたと取りやすい。pretending は「ふり」で、うそだと明かしている。',
      use: 'To be honest, he’s just tired.（正直に言うと、彼はただ疲れてるだけ）' },

    // why: hardly drinks ← "Never been hungover" read literally, as someone who doesn't drink; none of my business ←
    //   "Wouldn't know" heard as a cold brush-off (the Japanese frame: 知らない＝突き放す)
    // anchor: 145.84–153.1 s "After I've had too much whiskey, I cook myself a large flank steak… put on a pair of wet
    //   socks, and go to sleep" — 153.6–154.9 s "That works? — It does." (both sources): he drinks, and credits the
    //   routine; and he goes on explaining, so it isn't a brush-off
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'neverhung', reveals: ['hangover'], seg: [141.4, 155.3],
      stem: 'Which plain-English version keeps what Ron means by “Never been hungover”?',
      choices: ['“I drink, but my routine prevents hangovers.”', '“I hardly ever drink, so I can’t say.”',
                '“Her health is none of my business.”'], a: 0,
      cue: '短い一言のすぐあと、ウイスキーの話。',
      line: 'Wouldn’t know. *Never been hungover.* After I’ve had *too much whiskey*, I cook myself…',
      said: '「さあね、二日酔いになったことがない」と言い、ウイスキーを飲みすぎた夜の手順を話す。',
      mean: '飲まないのではなく、飲んでもステーキとぬれた靴下で防ぐという主張。あとの説明が前の一言の意味を決める。',
      trap: '「二日酔いがない」を、あまり飲まない人と取りやすい。短い一言は、すぐあとの説明と合わせて聞く。',
      use: 'Never get seasick. I always eat ginger.（船酔いはしない。いつもしょうがを食べるから）' },

    // R fix: V2, "keep it outside" was a filler; now "swap it for a cat", from “is a cat” right after (which "cats
    //   are pointless" refutes)
    // why: train it ← "a proper dog" heard as "make it behave properly"; a cat ← "cat" comes next, and "ditch" is
    //   caught only as "change"
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'ditch', reveals: ['style'], seg: [181.32, 190.3],
      stem: 'After the walnut tip, what does Ron tell the caller to do next?',
      choices: ['Get rid of the terrier', 'Train the terrier properly', 'Swap the terrier for a cat'], a: 0,
      cue: '「Next thing」のあと、terrier の前の動詞。',
      line: 'Next thing you want to do is *ditch the terrier* and get yourself a proper dog.',
      said: '「次は、テリアを手放して、ちゃんとした犬を飼うことだ」と言う。',
      mean: 'ditch ＝ 捨てる、手放す。机の相談なのに、犬ごと替えろという助言。',
      trap: 'proper から「しつける」と取りやすい。a proper dog は別の犬のこと。',
      use: 'Let’s ditch the car and walk.（車はやめて歩こう）' },

    // why: fifteen ← -teen/-ty; sixty ← another two-syllable -ty number, f and s both soft
    { id: 'n3', skill: 'number', level: 'B1', point: 'fifty', seg: [185.0, 191.5], keep: true,
      stem: 'According to Ron, a dog under what weight counts as a cat?',
      choices: ['Fifteen pounds', 'Fifty pounds', 'Sixty pounds'], a: 1,
      cue: '「under」のあとの数字。強い音の位置。',
      line: 'Any dog under *50 pounds* is a cat, and cats are pointless.',
      said: '「50ポンド未満の犬は猫だ。猫に意味はない」と言い切る。',
      mean: 'fifty は前が強く、最後は短い「ティ」。fifteen は後ろが長く強い「ティーン」。',
      trap: '-teen と -ty は聞き分けにくい。強い音が前か後ろかで判断する。',
      use: 'It’s under fifty dollars.（50ドル以下だよ）' },

    // R fix: V2, "selling food you grew" was a filler; now small vs big sellers, from the banks line just before
    // why: small sellers ← "big banks or small banks" just before, and the apples seller is small; politer ← "Yes,
    //   thank you" and "whatever happened to" heard as nostalgia for manners
    { id: 'i5', skill: 'infer', level: 'C1', point: 'apples', seg: [201.15, 212.0],
      stem: 'In the apples example, what is Ron’s point about business?',
      choices: ['Starting one should need hardly any rules', 'Small sellers are better than big companies',
                'People were more polite about buying back then'], a: 0,
      cue: '例のあとの「That’s as complicated as…」。',
      line: 'I have some apples. Would you like to buy them? — Yes, thank you. *That’s as complicated as it should be*…',
      said: '「りんご買う？」「ええ」。商売を始めるのはこれくらい簡単であるべき、と言う。',
      mean: '複雑さはこの程度でいい、つまり規則や手続きは少ないほどいい、という主張。',
      trap: 'Yes, thank you から礼儀の話と取りやすい。例のあとのまとめの一文が主張。',
      use: 'It should be as simple as that.（それくらい簡単であるべきだ）' },

    // why: the kids ← "pretty funny" heard as sarcasm about the film the kids love (a sincerity flip); film fans ←
    //   "three movies in my life" heard as a dig at people who watch many
    // anchor: 218.88–222.5 s "My girlfriend's kids love it. It's pretty funny." (both sources): "It's pretty funny" is
    //   his own verdict, agreeing with the kids; every clause before it has "I" or "my" ("I've seen three movies in my
    //   life"), and nobody else is mentioned
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'movies', seg: [210.92, 222.9],
      stem: 'In Ron’s answer about films, who is the joke on?',
      choices: ['Ron, whose short list ends on a kids’ film he likes', 'The kids, for loving a film that silly',
                'People who expect him to watch lots of films'], a: 0,
      cue: '最後の2文で、楽しんでいるのは誰か。',
      line: 'I’ve seen *three movies* in my life… My girlfriend’s kids love it. *It’s pretty funny.*',
      said: '「人生で見た映画は3本」と挙げ、最後の1本は「彼女の子が大好きで、なかなか面白い」と言う。',
      mean: 'たった3本の一つが子ども向けで、本人も面白いと認める。笑われているのはロン自身。',
      trap: 'pretty funny を皮肉と取ると、子どもを笑う話に聞こえる。主語を追うと、気に入っているのは本人。',
      use: 'Honestly, the kids’ movie was pretty good.（正直、子ども向け映画けっこう良かった）' },
  ]
};
