// “Leslie Receives A Passive-Aggresive City Key | Parks and Recreation” (the official Parks and Recreation channel,
// Season 5): Leslie stands in for Ben, home sick with kidney stones, at a Partridge key ceremony that turns out to mock
// him ("Ice Clown", a key of ice); she ends up telling the town off.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 164 s (whisper loops one line from
// 175 s). Leslie is named (82 s, 90.7 s); Ben is the voice on the video and the phone (he's in the hospital, 9 s, 30 s).
// The Partridge men are never named, so stems say "a town official" (0–25 s) and "the host" (51–110 s); nt1's anchor
// ("Again…", 107 s) assumes the host is the official from the start, and the key holds for either. Untested on
// purpose: 34.4 s (captions "baby Smurf", whisper "baby smear"), 78–82 s (who is taken for "his sister"), 124.6 s
// (captions "going to find it in your heart to be able to", whisper "gonna finally be able to"), 128.5–132.7 s (the
// medical detail of Ben's kidney stone).
// EAR CHECK: 151.6 s nt3 — "That's crazy. Judy Garland's amazing, but…" is Leslie, going on in one turn (whisper marks
//   no change of speaker; if it's the official, nt3 is dropped and d2's line loses its first words)
// REVIEW 2026-11-16: pass 4, fix 20, drop 0, new 0; ear checks 1 (unchanged)
import type { Clip } from '../types.ts';

export const iceClown: Clip = {
  id: 'iceclown', video: 'UBj5v7QOWNQ', title: 'Leslie Receives A Passive-Aggresive City Key', dur: 186, wpm: 162,
  band: 'mid', tags: ['旅行', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %, right): "move to another day" was weak. Now "go on without him", which "today, of all days.
    //   Damn it" invites.
    // why: without him ← "today of all days… damn it" heard as the ceremony at risk; who may accept ← "on his behalf"
    //   heard as the point in dispute
    { id: 'g2', skill: 'gist', level: 'B1', point: 'absent', seg: [0, 25.0],
      stem: 'What is the opening argument about?',
      choices: ['Whether Ben is really too sick to come', 'Whether the ceremony can go on without him',
                'Whether Leslie may accept the key for him'], a: 0,
      cue: '最初の「believe that?」と、そのあとの「proof」。',
      said: '町の人が「信じると思う？」と疑い、Leslie たちは動画を証拠に出す。',
      mean: 'Ben の欠席が本当の病気かどうか、が争点。',
      trap: 'on his behalf や of all days が耳に残るが、争点は最初の believe that?。',
      use: 'Do you really expect me to believe that?（そんなの信じると思う？）' },

    // R fix: V2 (blind 90 %, right): "a bad cold in the snow" was a filler. Now "too weak to make the trip", from
    //   wimp = 弱虫 read as physical weakness.
    // why: serious ← "acute" taken as the medical word for a sudden, severe illness; too weak ← "wimp" read as a weak
    //   body, not cold feet
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'wimp', reveals: ['stones'], seg: [1.3, 6.6],
      stem: 'What does the official suggest with his made-up illness, “acute wimping out”?',
      choices: ['Ben is too scared to show up', 'Ben has a sudden, serious illness', 'Ben is too weak to make the trip'],
      a: 0,
      cue: '病名のように言った、最後の2語。',
      line: 'What has he got? *Acute wimping out*?',
      said: '「急性おじけづき症か？」とからかい、「腎臓結石よ」と返される。',
      mean: 'wimp out ＝ おじけづいて逃げる。acute（急性）を付けて病名のようにからかう。',
      trap: 'acute は本物の医学用語なので、深刻な病気に聞こえやすい。後ろの wimp が本題。',
      use: 'Don’t wimp out on me now.（今さら逃げないでよ）' },

    // R fix: V2 (blind 55 %, right): "a bad cold" was easy to cut. Now "a kidney infection", which keeps "kidney".
    // why: nerves ← "wimping out" just before, read as her answer; infection ← "kidney" heard, "stones" missed
    { id: 'd1', skill: 'detail', level: 'B1', point: 'stones', seg: [3.0, 6.6],
      stem: 'What does Leslie say is wrong with Ben?',
      choices: ['He has bad nerves', 'He has kidney stones', 'He has a kidney infection'], a: 1,
      cue: '「No, he has」のあと。',
      line: 'No, he has *kidney stones*. We have proof.',
      said: '「違う、腎臓結石なの。証拠もある」と言い返す。',
      mean: 'kidney stones ＝ 腎臓結石。強い痛みで入院することもある病気。',
      trap: '直前の wimping out（おじけづく）を答えと取りやすい。No のあとが Leslie の答え。',
      use: 'He’s home sick with the flu.（彼はインフルで家で寝てる）' },

    // why: half an hour ← "an" + "hour" with half heard in; two hours / a day ← other short spans
    { id: 'n1', skill: 'number', level: 'B1', point: 'hour', seg: [6.3, 10.6], keep: true,
      stem: 'When was the hospital video taken?',
      choices: ['Half an hour ago', 'An hour ago', 'Two hours ago', 'A day ago'], a: 1,
      cue: '「hospital」のすぐあと、文の終わり。',
      line: 'I took a video of him at the hospital *an hour ago*.',
      said: '「1時間前に病院で彼の動画を撮った」と言う。',
      mean: 'an hour ago ＝ 1時間前。an と hour がつながり「アナワー」。',
      trap: 'an が弱くつながるので、前に half があったように感じやすい。聞こえた音だけで判断。',
      use: 'I called an hour ago.（1時間前に電話しました）' },

    // R fix: V2 (blind 85 %, right): x1's stem printed "it had to happen today". x1 now reveals `hadto`. On its own,
    //   "got to" was weak, so "would" ("it'd" against "it had") replaces it.
    // why: has to ← the final d vs s, a present "it has to happen"; would ← "it'd" is "it had" with the h dropped
    { id: 's1', skill: 'sound', level: 'B2', point: 'hadto', seg: [19.6, 24.0],
      stem: 'Fill the gap: “It’s just a real shame it ___ happen today.”',
      choices: ['had to', 'has to', 'would'], a: 0,
      cue: '「shame it」のあと、短い2語の最初の子音。',
      line: 'it’s just a real shame it *had to* happen today…',
      said: '「よりによって今日こうなるとは、本当に惜しい」と言う。',
      mean: 'had to が「ハットゥ」と短くつながる。もう起きたことなので過去形。',
      trap: 'has to と had to は語尾だけが違う。「すでに起きたこと」の話なら had。',
      use: 'It had to rain on our day off.（よりによって休みの日に雨とは）' },

    // R fix: V2 (blind 55 %, right): "rather not deal with Leslie" was weak. Now the mirror near miss, "relieved Ben
    //   stayed away", which "damn it" and the later "Again…" refute.
    // why: sincere ← "real shame" + "damn it" taken at face value as sympathy; relieved ← a hostile town read as glad he
    //   kept away
    // anchor: 107.2–110 s "Again, this would all be way more satisfying if Ben was here": the shame is losing the
    //   chance to mock him in person
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'shame', reveals: ['hadto', 'ofall'], seg: [19.6, 25.0],
      stem: 'When the official calls it “a real shame”, what is he not saying?',
      choices: ['That he wanted Ben there to be mocked', 'That he is truly sorry Ben is unwell',
                'That he is relieved Ben stayed away'], a: 0,
      cue: 'あとで司会が言う「Again,」の一言と比べて。',
      line: 'Boy, it’s just a *real shame* it had to happen today, of all days. *Damn it.*',
      said: '「今日に限って、惜しい。くそっ」と言う。あとで司会は「Ben がいたら楽しかった」。',
      mean: '同情に見えて、惜しいのは Ben を目の前で笑いものにできないこと。Again が答え合わせになる。',
      trap: 'real shame と damn it は同情に聞こえる。後半の一言が本音を明かすこともある。',
      use: 'What a shame you can’t make it.（来られないなんて惜しいな）' },

    // R fix: C5: the stem prints "it had to happen today", s1's key, so it reveals `hadto`.
    { id: 'x1', skill: 'dict', level: 'B1', point: 'ofall', reveals: ['hadto'], seg: [21.3, 25.0],
      stem: 'Type what he says: “…it had to happen today, ___.” (3 words)', answer: 'of all days',
      cue: '「today」のすぐあと、短い3語。',
      line: 'it had to happen today, *of all days*. Damn it.',
      said: '「よりによって今日に」と言い、「くそっ」と付け足す。',
      mean: 'of all days ＝ よりによって。of all people（よりによってあの人が）と同じ形。',
      trap: 'of と all がつながり「オヴォール」になる。days の s まで書く。',
      use: 'He called me, of all people.（よりによって私に電話してきた）' },

    // R fix: V1 + V2 (blind 60 %, right): "on strong medicine" is never said; it came from world knowledge. The key is
    //   now what the words show. "Suspects the town" was weak, so it's now "in pain, hiding it" (the 我慢 frame). S4: the
    //   segment started inside "Town mascot is here" (39.0 s). It now starts at 38.2 s.
    // why: sad to miss it ← Leslie's "I wish you were here" heard as his feeling; in pain ← kidney stones + a cheerful
    //   voice read as 我慢
    { id: 'i1', skill: 'infer', level: 'C1', point: 'loopy', seg: [38.2, 51.1],
      stem: 'What does Ben’s talk on the phone suggest about his state?',
      choices: ['He is dreamy and not quite himself', 'He is sad to be missing her big day',
                'He is in pain but trying to hide it'], a: 0,
      cue: '彼の最後の一言と、Leslie の返事。',
      line: '*The universe is love.* — Okay, *stay away from sharp things*.',
      said: '「宇宙は愛だ」と言う Ben に「とがった物に近づかないで」。',
      mean: '大げさで夢見心地の言葉と、子どもへのような注意。頭がぼんやりしている。',
      trap: 'wish you were here は Leslie の言葉。結石＝痛みと考えがちだが Ben は上機嫌。',
      use: 'You’re not making sense. Get some rest.（話がおかしいよ。少し休んで）' },

    // R fix: V2 (blind 70 %, right): "truer than he knows" was the only twist. Now two sincere readings that differ on
    //   whether the honor is real, plus sarcasm.
    // why: a real honor ← his delight taken as the scene's truth; sarcasm ← reading in what the clip shows later
    // anchor: 44.6–46.3 s "I can't believe they're doing all this for me", against 74.4–77.5 s "It says Ice Clown… that's
    //   not a typo": it is all for him, as a mockery
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'forme', seg: [40.0, 47.3],
      stem: 'After the banner is read out, how should we hear Ben’s “all this for me”?',
      choices: ['As sincere, but the show is really a mockery', 'As sincere, and the town really is honoring him',
                'As sarcasm: he knows the town is mocking him'], a: 0,
      cue: 'このあとの横断幕の言葉と比べて。',
      line: 'They only bring him out for special occasions. *I can’t believe they’re doing all this for me.*',
      said: 'マスコットまで来たと聞き、「僕のためにここまで」と感激する。',
      mean: '本人は名誉と思っているが、横断幕で、確かに全部「彼のため」の皮肉だったと分かる。知らずに当たっている。',
      trap: '本人の喜び方だけ聞くと、本当に歓迎されていると取りやすい。皮肉と取るのは知っている側の見方。',
      use: 'Little did he know…（彼は知るよしもなかった…）' },

    // why: twelve / thirty ← -ty numbers sound alike at speed; ten ← "twenty" with the -ty dropped
    { id: 'n2', skill: 'number', level: 'B1', point: 'twenty', seg: [51.0, 55.6], keep: true,
      stem: 'How long after Ben’s time as mayor is the ceremony?',
      choices: ['10 years', '12 years', '20 years', '30 years'], a: 2,
      cue: '「But now」のすぐあと。',
      line: 'But now, *20 years later*…',
      said: '「しかし今、20年がたち…」と式典が始まる。',
      mean: '20 years later ＝ 20年後。あとで Leslie も「20年前」と言う。',
      trap: 'twenty と thirty は語頭の音、twelve は語尾で分かれる。-ty の「ティ」も手がかり。',
      use: 'Twenty years later, we met again.（20年後、また会った）' },

    // R fix: V2 (blind 70 %, right): the key was the only negative choice. "Insulting Ben in plain, rude words" has the
    //   right stance and the wrong form.
    // why: thanks for healing ← "made all of that possible" heard as a standard tribute; plain insult ← the hostility
    //   heard, the polite form missed
    { id: 't1', skill: 'attitude', level: 'C1', point: 'possible', seg: [59.2, 70.2],
      stem: 'When the host introduces Ben, what is he really doing?',
      choices: ['Blaming Ben in words that sound like praise', 'Thanking Ben for helping the town heal',
                'Insulting Ben in plain, rude words'], a: 0,
      cue: '「painful memories」のあと、Ben の紹介の言葉。',
      line: 'we put those *horribly painful memories* behind us as we welcome back the mayor who *made all of that possible*',
      said: '「つらい記憶を忘れる日に、それを可能にした市長を迎えます」と紹介する。',
      mean: 'made possible はふつうほめ言葉。ここの「それ」はつらい記憶なので、ほめる形で責めている。',
      trap: '紹介の決まり文句に聞こえやすい。that が指すのは痛い記憶。',
      use: 'Thanks for making this possible.（実現させてくれてありがとう）' },

    // R fix: V2 + §9.4 (blind 70 %, right): the title says "passive-aggressive", so the only on-purpose choice won. All
    //   three now describe the banner's wording.
    // why: misspelled ← "typo" said three times; another mayor ← "ice clown" read as a different name
    { id: 'i2', skill: 'infer', level: 'B2', point: 'typo', seg: [71.9, 78.0],
      stem: 'What does Leslie come to realize about the banner?',
      choices: ['Its wording was chosen on purpose', 'Its wording has a spelling slip',
                'Its wording was meant for another mayor'], a: 0,
      cue: '「It says」のあと、最後の一文の not。',
      line: 'Oh, that’s a typo… It says *Ice Clown*. I’m just realizing now that’s *not a typo*.',
      said: '「タイプミスね」と言いかけ、「Ice Clown…ミスじゃない」と気づく。',
      mean: 'Icetown を Ice Clown（氷のピエロ）にした、わざとの悪口。',
      trap: 'typo が3回聞こえるので、つづりの話に引かれやすい。最後の not で判断。',
      use: 'Wait, I’m just realizing that’s not a joke.（待って、冗談じゃないんだ）' },

    // R fix: V2 (blind 60 %, right): "glad Ben can rest" was the opposite stance, so it was easy to cut. Now "came on
    //   suddenly", the "acute" echo.
    // why: sudden ← "ill" heard alone, with the earlier "acute" carried over; handy for Leslie ← "convenient" = 便利 read
    //   as "it worked out for her"
    { id: 't2', skill: 'attitude', level: 'C1', point: 'conveniently', reveals: ['absent'], seg: [82.6, 91.5],
      stem: 'What does the host hint at about Ben’s illness?',
      choices: ['That he’s using it to get out of coming', 'That it came on suddenly and badly',
                'That it worked out nicely for Leslie'], a: 0,
      cue: '「Mr. Wyatt is」のあと、ill の前の一語。',
      line: 'because Mr. Wyatt is *conveniently ill*',
      said: '「ワイアット氏は都合よく病気なので、妻が」と紹介する。',
      mean: 'conveniently ill ＝「都合よく病気」。仮病だとほのめかす。',
      trap: 'convenient を「便利」と取ると Leslie の話に聞こえる。病気に付くと仮病の意味。',
      use: 'He conveniently forgot his wallet.（彼は都合よく財布を忘れた）' },

    // R fix: V2 (blind 75 %, right): "stays polite" was easy to cut. Now "starts polite… winning them over" mirrors the
    //   key. S3: the cue quoted "screw you", which gave the key.
    // why: angry to forgiving ← "forgive him" said, but about the town; winning over ← her praise of Ben and the end of a
    //   speech heard as a rallying close
    { id: 'g1', skill: 'gist', level: 'B2', point: 'arc', reveals: ['mascot'], seg: [83.0, 164.6],
      stem: 'How does Leslie’s way of speaking to the town change across the ceremony?',
      choices: ['She starts polite and ends up telling them off', 'She starts angry and ends up forgiving them',
                'She starts polite and ends up winning them over'], a: 0,
      cue: '最初の丁寧な言い方と、最後の数語。',
      said: 'からかわれ続けた Leslie が、最後は Ben をかばって町に言い返す。',
      mean: '丁寧な代理の挨拶が、夫を守る反撃に変わる流れ。',
      trap: 'forgive は町が Ben を許す話で、Leslie が許すのではない。最後の言葉で態度が分かる。',
      use: 'I tried to be nice. Enough is enough.（優しくしたけど、もう限界）' },

    // R fix: V2 (blind 75 %, right): the key was the only one that mocks. Two now name Ice Town. S3: the cue held "much
    //   like", which pointed at the key's "like".
    // why: honors Ice Town ← a snowy town with a sled mascot; by accident ← "it's water" + "Uh-oh" heard as a real
    //   mishap
    { id: 'h3', skill: 'humor', level: 'C1', point: 'icekey', seg: [94.5, 106.6],
      stem: 'What is the joke behind giving Ben a key of ice?',
      choices: ['It recalls Ice Town, and melts like their hopes did', 'It honors Ice Town, as a symbol of their winters',
                'It was meant to last, and melted by accident'], a: 0,
      cue: '「made of ice」のあとに続くたとえ。',
      line: 'The key was *made of ice*. And *much like the hopes and dreams* of the people of Partridge, it melted away.',
      said: '「鍵は氷製でした。町の人々の夢と同じく、溶けて消えました」と言う。',
      mean: '氷の失敗をした市長に、溶ける鍵を贈るいやみ。町の失望を重ねている。',
      trap: '冬の町なので氷は自慢にも見えるが、much like 以下で悪口と分かる。Uh-oh もわざとらしい。',
      use: 'Much like my diet, it didn’t last.（私のダイエットと同じで長続きしなかった）' },

    // R fix: V2 (blind 65 %, right): "says sorry" was weak. Now two readings of "by the way": a fun-fact aside, and a
    //   change of subject.
    // why: fun fact ← "by the way" read as an aside about Pawnee; her trip ← "by the way" read as a change of subject
    //   after "drove all the way here"
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'class', seg: [109.6, 118.3],
      stem: 'What does Leslie do by adding “by the way” after naming her city?',
      choices: ['Slips in a dig at Partridge', 'Adds a fun fact about Pawnee',
                'Changes the subject to her trip'], a: 0,
      cue: '「Indiana」のあと、町をどう説明するか。',
      line: 'from Pawnee, Indiana, *a city with some class*, by the way.',
      said: '「インディアナ州パウニーから来ました。ちなみに品のある町です」。',
      mean: '「うちは品がある」＝「ここにはない」。ついでのふりの当てこすり。',
      trap: 'by the way は話題を変える語だが、ここはついでのふりの皮肉。ほめる対象の裏を考える。',
      use: 'I made dinner, by the way. Again.（ちなみに夕飯作ったのは私。また）' },

    // R fix: V2 + S2 (blind 75 %, right): the stem quoted "And sure", the signal under test. It now names the moment.
    //   "Not sure what Ben did" is now a calming-the-crowd reading.
    // why: admits all ← "sure" + "mistake" heard as a full confession; calming ← agreement read as appeasement, the
    //   "But…" missed
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'sure', reveals: ['twenty'], seg: [118.2, 126.25],
      stem: 'What is Leslie doing when she brings up Ben’s old mistake?',
      choices: ['Conceding a point before she pushes back', 'Admitting that Ben is the one to blame',
                'Agreeing so that the crowd calms down'], a: 0,
      cue: '「sure」の文のあと、「But」で始まる部分。',
      line: 'And *sure*, my husband made an honest mistake 20 years ago. *But* it was very meaningful…',
      said: '「たしかに夫は20年前にミスをした。でも、許してもらえるのは意味があった」と言う。',
      mean: 'sure … but ＝ 相手の言い分を一度認めてから、自分の主張に入る形。',
      trap: 'sure を「確か」と取ると全面的に認めたように聞こえる。but のあとが本題。',
      use: 'Sure, it’s expensive. But it’s worth it.（確かに高い。でも価値はある）' },

    // R fix: V2 (blind 70 %, right): "asking her to repeat" was a filler. All three now read "where is he?".
    // why: which hospital ← "where is he?" taken as a real question (and she answers it literally); hiding ← "where"
    //   plus the town's doubt about his illness
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'whereis', seg: [122.4, 128.5],
      stem: 'What is the man doing with “then where is he?”',
      choices: ['Hinting that Ben doesn’t really care', 'Asking which hospital Ben is in', 'Hinting that Ben is hiding nearby'],
      a: 0,
      cue: '「If it’s so meaningful」の if のつながり。',
      line: '*If it’s so meaningful to him*, then where is he?',
      said: '「そんなに意味があるなら、なぜ本人がいない？」と返す。',
      mean: '居場所を聞いているのではない。「本気なら来るはず」という反論。',
      trap: 'where を文字通りの質問と取りやすい。If it’s so ～, then … は相手の言葉で切り返す型。',
      use: 'If you’re so hungry, then eat something.（そんなにお腹すいたなら何か食べなよ）' },

    // R fix: V2 (blind 75 %, right): "Ben is as famous as she is" was odd. Now "agreeing, adding a local name", the
    //   そうそう frame for "What about…?".
    // why: change the subject ← the film star heard as small talk; agreeing ← "Oh, yeah? What about…" heard as そうそう、
    //   それに
    { id: 'i5', skill: 'infer', level: 'B2', point: 'garland', seg: [133.6, 139.35],
      stem: 'Why does the official bring up Judy Garland?',
      choices: ['To top Leslie’s claim with a bigger name', 'To change the subject to old movies',
                'To agree, adding another local name'], a: 0,
      cue: '「best thing to ever come out of」への返事。',
      line: 'Ben Wyatt is the *best thing to ever come out of* this crap town. — Oh, yeah? *What about* Judy Garland?',
      said: '「Ben はこの町の一番の誇り」と言うと、「じゃあ Judy Garland は？」と返される。',
      mean: 'What about ～? は反論の型。「もっとすごい人がいる」。',
      trap: 'What about は話題を変えるときにも使うが、ここは「一番」への反論。',
      use: 'Oh yeah? What about last time?（へえ、じゃあこの前は？）' },

    // why: She's lived ← 's vs 'd, one weak sound, and "still lives here" makes sense; She lived ← the 'd swallowed
    { id: 's2', skill: 'sound', level: 'B2', point: 'shed', seg: [139.0, 142.8],
      stem: 'Fill the gap: “___ here for a while.”',
      choices: ['She’d lived', 'She’s lived', 'She lived'], a: 0,
      cue: '文の最初、She のあとの小さな音。',
      line: 'Judy Garland’s from Partridge? — *She’d lived* here for a while.',
      said: '「出身なの？」と聞かれ、「しばらく住んでた」と答える。',
      mean: 'She’d ＝ She had。d は弱く lived とほぼ一続き。出身ではなく、住んだことがあるだけ。',
      trap: 'She’s なら「今も住んでいる」。小さな音の違いで意味が変わる。',
      use: 'I’d never been there before.（それまで一度も行ったことがなかった）' },

    // R fix: V2 (blind 70 %, right): the key was the only one about the "star". All three are now "Their second star
    //   is…". S3: the cue quoted "golfer", which only the key had.
    // why: big name she doesn't know ← "Who's Lee Jansen?" heard as the joke; mix-up ← two names in a row heard as a
    //   mistake
    { id: 'h1', skill: 'humor', level: 'C1', point: 'jansen', seg: [142.5, 147.25],
      stem: 'Why does the second name from the town get a laugh?',
      choices: ['Their second “star” is just a fair golfer', 'Their second “star” is a big name she doesn’t know',
                'Their second “star” is someone they mix up'], a: 0,
      cue: '名前を聞き返したあとの答えと、ほめ言葉の強さ。',
      line: 'Who’s Lee Jansen? — He’s a golfer. *He’s pretty good.*',
      said: '「Lee Jansen もいる」「誰？」「ゴルファーだ。けっこううまい」。',
      mean: '大スターの次が「けっこううまい」ゴルファー。町の自慢が小さくなる。',
      trap: 'pretty good は「とても」ではなく「まあまあ、けっこう」。誇りにしては弱いのが笑い。',
      use: 'It’s pretty good, not amazing.（まあまあだね、最高ではない）' },

    // why: the official ← the man she is arguing with, who brought up Garland; the golfer ← "pretty good" just before
    // anchor: 151.6–155.3 s "That's crazy. Judy Garland's amazing, but Ben Wyatt is better than all of you": after "but"
    //   she narrows her claim from Garland to "all of you", so "crazy" was her own last claim
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'crazy', seg: [147.0, 158.1],
      stem: 'Who is Leslie’s “That’s crazy” aimed at?',
      choices: ['Herself, for ranking Ben above Judy Garland', 'The official, for claiming Garland for Partridge',
                'The golfer’s fans, for calling him pretty good'], a: 0,
      cue: '「amazing, but」のあと、比べる相手がどう変わるか。',
      line: 'he’s better than Judy Garland. *That’s crazy.* Judy Garland’s amazing, *but* Ben Wyatt is better than *all of you*',
      said: '「Ben は Garland より上」の直後、「それはない。Garland は最高。でも Ben は皆より上」と言い直す。',
      mean: '言いすぎた自分に、自分でつっこむ。but のあと比べる相手を町の人へ下げた。',
      trap: '口論中なので相手への反論に聞こえやすい。but のあとの比べる相手の変化で決まる。',
      use: 'Okay, that’s crazy. Let me take that back.（いや、それは言いすぎ。取り消す）' },

    // R fix: V2 (blind 55 %, right): "more famous" didn't match "cared/tried". Now "cared enough to come back today",
    //   which keeps "cared" and is refuted by the hospital.
    // why: came back ← "cared" heard, then "tried to help" taken as being here; forgave ← "forgive him" earlier, turned
    //   around
    { id: 'd2', skill: 'detail', level: 'B2', point: 'cared', reveals: ['crazy'], seg: [151.1, 158.1],
      stem: 'What reason does Leslie give for Ben being better than them?',
      choices: ['He cared about the town and tried to help', 'He cared enough to come back here today',
                'He forgave the town for how it treated him'], a: 0,
      cue: '「because」のあと、2つの動詞。',
      line: 'Ben Wyatt is better than all of you *because he cared about this town, and he tried to help it*.',
      said: '「Ben はあなたたち全員より上。この町を思って、助けようとしたから」と言う。',
      mean: '有名かどうかではなく、気持ちと努力で比べている。',
      trap: 'cared だけ拾うと「来てくれた」と取りやすいが、Ben は病院。because のあとの動詞2つが理由。',
      use: 'She tried to help, and that matters.（彼女は助けようとした。それが大事）' },

    // R fix: V2 (blind 70 %, right): the key was the only one with a size contrast. All three now say what the last line
    //   does to the speech.
    // why: harshest insult ← "stupid" heard as a peak; friendly joke ← an insult read as a joke to win them over
    { id: 'h2', skill: 'humor', level: 'B2', point: 'mascot', seg: [157.9, 164.6],
      stem: 'Why does Leslie’s very last line get a laugh?',
      choices: ['It shrinks a big speech down to a petty jab', 'It tops her speech with its harshest insult',
                'It softens her speech with a friendly joke'], a: 0,
      cue: '「screw you」のあと、何について言うか。',
      line: 'You know, screw you, Partridge. *And a sled is a stupid mascot.*',
      said: '「もう知らない、Partridge」と言ったあと、「それにソリのマスコットはダサい」と付け足す。',
      mean: '大きな演説の締めに、マスコットへの小さな悪口。落差が笑い。',
      trap: '最後の一言は本題に思えるが、ここは小さな付け足し。And のあとの話題に注目。',
      use: 'And another thing: your coffee is terrible.（それと、ここのコーヒーまずい）' },
  ]
};
