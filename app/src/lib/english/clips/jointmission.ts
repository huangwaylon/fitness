// REVIEW 2026-11-16: pass 13, fix 11, drop 0, new 0; ear checks 2
//   open: nt1, nt2, g2, i2 (blind 55 %), a2 (60 %), a1 (65 %) kept as written; a stronger near miss would risk a
//   second key. A second cold reader could settle them.
//   open: d3's key is now "just his own name": if the shirt shows only initials, the item still holds (he says
//   "Tom Haverford"), but confirm the monogram isn't "TH" read as a brand.
// “Leslie and Tom's "Joint" Mission | Parks and Recreation” (the official Parks and Recreation channel, Season 2):
// Leslie shows off the community garden in the pit, where Tom passes off rappers' names as Latin plant names; someone
// has planted something new, so the two set up a night stakeout, with Leslie's kit, a mix CD, a talk about Tom's
// name, and a surprise when the "kingpin" turns up.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 195.6 s (music after). The marijuana
// is only the premise: no item keys on it (55–61 s, the "joint" line, is never asked about). Untested on purpose:
// 37–43 s (captions "deities", "ludicrouses" for the rapper names; f3's line trims them), 48–53 s (whisper "garden
// pest", captions "garden past"; speaker unclear), 109–126 s (the camera test: "Pretty bummed / bum this fits",
// "where the weed… / kick… / wheel", repeated "Stop"), 146–147 s ("My mother's uterus"), 156–160 s (the birth name),
// 166 s (whisper "don't make it really far", captions "all might get really far"; d5 keys only on "in politics",
// in both), 175.5 s (whisper "maybe I wouldn't change it", captions "maybe I would have changed it": opposite
// meanings, so nt3's line stops before it). Named in the audio: Tom (10.9 s, 23.8 s), Leslie (30.8 s, 134.7 s),
// "Tom Haverford" (99.7 s, 161.6 s), Andy (189.3 s).
//   open: 30.5–35 s whisper "asks… give her", captions "asked… gave her" (tense only; h1's key is "rappers", in both)
// EAR CHECK: 171.5 s nt3 — “If I knew a dude” (both sources), not “If I'd known a dude”: confirm no swallowed 'd
// EAR CHECK: 64–94 s nt1 — the kit list, “It's like we're real police”, the mix CD and “It's really cool” are taken
//   as Leslie's (no name is said; Tom's shirt exchange follows, where Leslie asks about his shirt)
import type { Clip } from '../types.ts';

export const jointMission: Clip = {
  id: 'jointmission', video: 'gl4x_NoBDd8', title: 'Leslie and Tom\'s "Joint" Mission', dur: 217, wpm: 154,
  band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %). "Tom planted all by himself" was easy to reject; "she and Tom planted for the town"
    //   uses "Tom and I… help out", refuted by "people… plant whatever they want".
    // why: she and Tom ← "Tom and I sometimes… help out" and "master horticulturist" make them sound like the
    //   gardeners; open soon ← "we're
    //   encouraging people" heard as a plan, missing "have just really embraced this and planted"
    { id: 'g1', skill: 'gist', level: 'B1', point: 'garden', seg: [0, 25.0],
      stem: 'At the start, what is Leslie so proud of?',
      choices: ['A garden where anyone can plant anything', 'A garden she and Tom planted for the town',
                'A garden she will open to all soon'], a: 0,
      cue: '冒頭の自慢と、町の人が何をしているか。',
      said: '穴だった土地の市民菜園を「最高のひらめき」と紹介する。町の人が好きな物を植えている。',
      mean: '自慢しているのは、誰でも自由に参加できる菜園という仕組みそのもの。',
      trap: '「Tom and I」から、二人が育てたと取りやすい。植えた人、people を追う。',
      use: 'Feel free to bring whatever you want.（好きな物を持ってきてね）' },

    // R fix: V2 (blind 55 %). "Most stressful" was a weak reading of "storm"; "biggest project she has led" takes
    //   "greatest… ever" as size (a scope misreading), refuted by brainstorm = idea.
    // why: team meeting ← katakana ブレスト is a group idea session; biggest project ← "greatest… ever" heard as size
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'brainstorm', seg: [0.2, 5.6],
      stem: 'What does Leslie mean by her very first sentence?',
      choices: ['It was one of her best ideas ever', 'It came out of a long team meeting',
                'It was the biggest project she has led'], a: 0,
      cue: '最初の一文の、最後のほうの名詞。',
      line: 'Oh, this is one of my *greatest brainstorms ever*.',
      said: '菜園を見せて「私の史上最高のひらめきの一つ」と言う。',
      mean: 'brainstorm ＝ 急に浮かんだ名案。ここでは自分のアイデアを自慢している。',
      trap: 'カタカナのブレストは会議なので、話し合いの結果と取りやすい。英語では一人のひらめきにも使う。',
      use: 'I just had a brainstorm!（いいこと思いついた！）' },

    // why: plant things ← "plant whatever they want" is said just before, about other people; stay late ← "early"
    //   missed, and "It's so hot" right after sounds like the end of a long day
    { id: 'd1', skill: 'detail', level: 'B1', point: 'early', seg: [10.0, 16.0],
      stem: 'What do Leslie and Tom sometimes do at the garden?',
      choices: ['Get there early and help out', 'Get there early and plant things',
                'Stay there late and water things'], a: 0,
      cue: '「Tom and I」で始まる文。',
      line: 'Tom and I sometimes *get here early and help out*.',
      said: 'トムと自分は時々早めに来て手伝う、と言う。',
      mean: 'help out ＝ 手を貸す。植えるのは町の人で、二人は手伝い役。',
      trap: '直前の plant が残りやすいが、植えるのは people。主語が Tom and I に変わったら聞き直す。',
      use: 'Can I help out with anything?（何か手伝おうか）' },

    // R fix: V2 (blind 50 %). "Put up with it" was the only negative; "curious but careful" is a mild middle reading,
    //   refuted by "really embraced… and planted the coolest stuff".
    // why: hugged ← embrace = 抱きしめる, the literal reading; curious but careful ← "just really" heard as a hedge,
    //   the cautious reading
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'embrace', seg: [15.8, 20.1],
      stem: 'How does Leslie say people have responded to the garden?',
      choices: ['They have welcomed it very eagerly', 'They have hugged her to say thanks',
                'They have been curious but careful'], a: 0,
      cue: '「People have just really」のあとの動詞。',
      line: 'People have just really *embraced this* and planted the coolest stuff.',
      said: '「みんなすっかり気に入ってくれて、すごく面白い物を植えている」と言う。',
      mean: 'embrace ＝ 考えや計画を喜んで受け入れる。植えた物の話につながる。',
      trap: 'embrace を「抱きしめる」と文字通り取りやすい。目的語が物や計画なら「受け入れる」の意味。',
      use: 'The team really embraced the new plan.（チームは新しい計画を大歓迎した）' },

    // R fix: V2 (blind 55 %). "Names Leslie made up" was weak; "brand names" is a near miss on the same mechanism
    //   (pop-culture names passed off as Latin), refuted by "the names of rappers".
    // why: said badly ← Leslie asks for "Latin names", so a botched Latin word is the expected joke; brand names ←
    //   "Soulja Boy", "Diddy" heard as products, not people
    { id: 'h1', skill: 'humor', level: 'C1', point: 'rappers', seg: [24.3, 35.85],
      stem: 'Why do Tom’s “scientific names” for the plants get a laugh?',
      choices: ['They are rappers’ names, not Latin', 'They are real Latin names, said badly',
                'They are brand names, not Latin'], a: 0,
      cue: 'カメラに向けた話の、最後の語。',
      line: 'tomatoes or Soulja Boy Tellers. … I just give her *the names of rappers*.',
      said: 'トマトを妙な名前で呼び、カメラに「学名を聞かれたらラッパーの名前を言う」と明かす。',
      mean: '学名らしい名前が実はラッパー名。レスリーは本物だと信じている。',
      trap: 'Latin が聞こえるので、本物の学名を言いそこねたと取りやすい。カメラへの一言が種明かし。',
      use: 'I just make it up as I go.（その場で適当に作ってる）' },

    // why: just planted ← "someone planted something new" comes right after; arrive soon ← come in = 入ってくる,
    //   the literal reading
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'comingin', reveals: ['rappers'], seg: [41.3, 47.2],
      stem: 'Just before the new plant is found, what is said about some plants?',
      choices: ['They are growing really well', 'They have only just been planted',
                'They are going to arrive soon'], a: 0,
      cue: '新しい植物が見つかる直前の一文。',
      line: 'Those … are *coming in great*.',
      said: 'ラッパー名を付けたまま「あれもよく育ってる」と言い、そのあと新しい植物に気づく。',
      mean: 'come in ＝ 作物や毛が生えてくる、育つ。great で順調だと伝える。',
      trap: 'come in を「入ってくる・届く」と取りやすい。主語が植物なら「育つ」。',
      use: 'Your hair is coming in nicely.（髪がいい感じに生えてきたね）' },

    // anchor: 82.0–93.9 s right after “It's like we're real police” she goes on, “And I made us a mix CD…”, “I put
    //   our faces on there. It's really cool.”: no twist, no self-mocking line, only more excitement
    // why: ironically ← candy necklaces and whipped cream just before make "real police" sound like a joke (the
    //   sincerity flip); warning ← "we're real police" heard as a reminder to take it seriously (the 心構え frame)
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'police', seg: [79.2, 94.0],
      stem: 'When Leslie says “It’s like we’re real police”, how does she mean it?',
      choices: ['Sincerely: she’s thrilled to be on a stakeout', 'Ironically: she knows her kit is mostly sweets',
                'As a warning: they must act like real officers'], a: 0,
      cue: 'このあとの話が、冗談で落ちるかどうか。',
      line: '*candy necklaces*. … *It’s like we’re real police*. … *It’s really cool*.',
      said: 'キャンディのネックレスなどを並べて「本物の警察みたい」。続けて、CDに二人の顔も入れたと話す。',
      mean: '中身は遊び道具なのに、本人は本気でわくわくしている。皮肉ならあとで落とすが、喜びを重ねるだけ。',
      trap: '道具の幼さから皮肉と取りやすい。皮肉かどうかは、次の一言が続けるか落とすかで分かる。',
      use: 'This is just like a spy movie!（スパイ映画みたい！）' },

    // R fix: V2 (blind 70 %). "Friends staying up late" fitted no stakeout; "waiting for someone to come" is the
    //   stakeout theme too, and waiting/watching sound alike.
    // why: police ← "real police" just before, the stakeout theme; waiting ← watching/waiting share the start, and a
    //   stakeout is mostly waiting
    { id: 'd4', skill: 'detail', level: 'B1', point: 'songs', seg: [83.2, 91.2],
      stem: 'What are the songs on Leslie’s mix CD about?',
      choices: ['People keeping watch on other people', 'Police officers catching criminals',
                'People waiting for someone to come'], a: 0,
      cue: '「songs about」のあと。',
      line: 'It’s all filled with *songs about people watching people*.',
      said: '張り込み用にCDを作った、中身は「人を見張る人」の歌ばかり、と言う。',
      mean: 'watching ＝ 見張る。張り込みに合わせた選曲という、凝った準備ぶり。',
      trap: '直前の police が耳に残ると、警察の歌と思いやすい。about のあとの語を最後まで聞く。',
      use: 'I made a playlist for the road trip.（ドライブ用のプレイリストを作ったよ）' },

    // why: Aren't ← the n't is barely voiced, and the line is a hint, so a "surely you won't" question seems
    //   likely; Do you want to ← "wanna" and "gonna" sound close at speed
    { id: 's2', skill: 'sound', level: 'B2', point: 'gonna', reveals: ['black'], seg: [93.05, 97.5],
      stem: 'Fill the gap: “___ wear that shirt?”',
      choices: ['Are you going to', 'Aren’t you going to', 'Do you want to'], a: 0,
      cue: '文の最初、とても速い3〜4語。',
      line: '*Are you going to* wear that shirt?',
      said: '「そのシャツ着ていくの？」と聞く。going to は「ゴナ」に縮む。',
      mean: 'Are you gonna ～? は予定の確認だが、ここでは遠回しな「それでいいの？」。',
      trap: 'Aren’t なら「着ないの？」と逆の期待になる。文頭に n の音があるかを聞く。',
      use: 'Are you gonna finish that?（それ、全部食べる？）' },

    // why: $20 ← "a hundred" is weak and quick, leaving "twenty"; $100 ← "twenty" blurs into "bucks"; $200 ←
    //   "twen-" heard as "two"
    { id: 'n1', skill: 'number', level: 'B1', point: 'money', reveals: ['shirtname'], seg: [97.4, 102.3],
      stem: 'How much did Tom pay to have his shirt customized?',
      choices: ['$20', '$100', '$120', '$200'], a: 2, keep: true,
      cue: '「I spent」のすぐあと。',
      line: 'I spent *120 bucks* to get it monogrammed.',
      said: '「名前を入れてもらうのに120ドル使った」と言う。',
      mean: 'bucks ＝ ドルのくだけた言い方。シャツ代ではなく、名前の刺しゅう代。',
      trap: 'hundred は弱く速いので twenty だけ残りやすい。数の頭の小さな音を落とさない。',
      use: 'It cost me fifty bucks.（50ドルかかった）' },

    // R fix: V2 + K1 (blind 70 %). "Full name" claimed more than the audio settles (a monogram can be initials), so
    //   the key is now "just his own name"; "his father's name" replaces "his old school's name", the weakest.
    // why: designer ← "Tommy Hilfiger" is said twice, by Leslie and at the end (keyword trap); father ← a
    //   "monogrammed" shirt sounds like a family heirloom
    { id: 'd3', skill: 'detail', level: 'B2', point: 'shirtname', seg: [97.4, 104.05],
      stem: 'What does Tom say his shirt actually has on it?',
      choices: ['Just his own name', 'A designer’s name', 'His father’s name'], a: 0,
      cue: '「No.」のすぐあとの名前。',
      line: 'Tommy Hilfiger? — No. *Tom Haverford*. … to get it *monogrammed*.',
      said: 'ブランド名かと聞かれ、「違う、トム・ハヴァフォード」と自分の名前を言う。',
      mean: 'monogram ＝ 名前や頭文字の刺しゅう。似た響きのブランドではない。',
      trap: 'Tommy Hilfiger が2回出るので、そちらに引かれやすい。No のすぐあとを聞く。',
      use: 'Can you put my name on it?（名前を入れてもらえますか）' },

    // anchor: 99.7–104 s “No. Tom Haverford. I spent 120 bucks to get it monogrammed. … Everyone thinks it's Tommy
    //   Hilfiger.”: the cost and the boast come together, so being taken for the brand is what he paid for
    // why: Leslie ← she did just guess "Tommy Hilfiger?", so "everyone thinks" sounds like a dig at her (right
    //   mechanism, wrong target); anyone ← "Everyone thinks…" heard as Tom mocking the people he fools (scope shift)
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'shirtname', reveals: ['money'], seg: [97.4, 104.05],
      stem: 'When Tom adds that everyone thinks it’s a designer shirt, who is the joke on?',
      choices: ['Tom, who paid to have it taken for a brand', 'Leslie, who took his name for the brand',
                'Anyone who falls for a fake brand name'], a: 0,
      cue: 'お金の話と、そのあとの一言のつながり。',
      line: 'I spent 120 bucks to get it monogrammed. … *Everyone thinks it’s Tommy Hilfiger*.',
      said: '刺しゅうに120ドルかけたと言い、「みんなトミー・ヒルフィガーだと思う」と付け足す。',
      mean: 'ブランド品と思われるのが自慢。お金を払って得たのが人の勘違いなので、笑われているのは本人。',
      trap: 'everyone を、見抜けない人へのからかいと取りやすい。自慢の一言は、まず話し手に向いた笑いを疑う。',
      use: 'People always think it’s real gold.（みんな本物の金だと思うんだよね）' },

    // R fix: V2 (blind 60 %). "Dress more formally" swapped for "get cold out there", a night-stakeout reason,
    //   refuted by "Black is what you wear in a stakeout"; the 礼服 frame stays in the trap note.
    // why: costly ← "120 bucks" was just said; cold ← a night outside, and "wear something like this" sounds like a
    //   jacket
    { id: 'i1', skill: 'infer', level: 'B2', point: 'black', seg: [103.95, 109.5],
      stem: 'When Leslie hands Tom something else to wear, what is her point?',
      choices: ['His shirt is all wrong for a stakeout', 'His shirt is too costly to get dirty',
                'He’ll get cold out there tonight'], a: 0,
      cue: '服を渡したあとの、理由を言う文。',
      line: 'you should be wearing something like this. … *Black is what you wear in a stakeout*.',
      said: '「こういうのを着るべき。黒を着て。張り込みでは黒を着るもの」と服を渡す。',
      mean: 'シャツを直接けなさず、張り込みの決まりを理由に着替えさせている。',
      trap: '夜の外なので防寒、120ドルなので汚れ、と考えやすい。渡した理由を最後まで聞く。',
      use: 'You might want to wear something warmer.（もっと暖かい服がいいかも）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'black', seg: [107.35, 109.5],
      stem: 'Type the start of Leslie’s rule: “___ in a stakeout.” (5 words)', answer: 'black is what you wear',
      cue: '「Wear black.」のすぐあと。',
      line: 'Wear black. *Black is what you wear* in a stakeout.',
      said: '「黒を着て。張り込みでは黒なの」と言う。',
      mean: 'what you wear は「ワッチュウェア」とつながる。you は一般の人で「ふつう着るもの」。',
      trap: 'is what が弱く短いので、語が抜けやすい。語数を数えて確かめる。',
      use: 'Coffee is what I need right now.（今必要なのはコーヒー）' },

    // why: impressed ← "playing shovel guitar" taken as praise for a skill; the noise ← they're on a stakeout, so a
    //   din seems the problem (broken script)
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'bored', reveals: ['hour'], seg: [128.8, 137.9],
      stem: 'In his to-camera comment about the shovel guitar, how does Tom feel?',
      choices: ['Worn out by how long it has gone on', 'Impressed by how well she can play',
                'Worried the noise will give them away'], a: 0,
      cue: '文の終わり、時間の言い方と最後の一語。',
      line: 'Leslie’s been playing shovel guitar *for about an hour now*.',
      said: 'シャベルをギター��するレスリーについて「もう1時間くらいこれ」と話す。',
      mean: '文句は言わないが、最後の now で「まだ続いている、もう十分」と伝える。',
      trap: '事実の報告に聞こえやすい。時間をわざわざ言うのは、うんざりのサイン。',
      use: 'He’s been talking for ages now.（もうずっとしゃべってる）' },

    // why: half ← "an hour" heard as the end of "half an hour"; four ← the weak "for about" heard as "four…"
    { id: 'n2', skill: 'number', level: 'B1', point: 'hour', seg: [134.2, 137.9],
      stem: 'In Tom’s comment to the camera, how long has Leslie been playing?',
      choices: ['about half an hour', 'about an hour', 'about four hours'], a: 1, keep: true,
      cue: '「playing shovel guitar」のあと。',
      line: 'Leslie’s been playing shovel guitar *for about an hour* now.',
      said: 'もう1時間くらい弾いている、と言う。',
      mean: 'for about an hour ＝ 約1時間。have been ～ing で、今も続いていること。',
      trap: 'for は弱く「フォ」なので four に聞こえやすい。about のあとの語で長さが決まる。',
      use: 'I’ve been here for about an hour.（ここに1時間くらいいるよ）' },

    // why: left SC ← "South Carolina" and "moved" come up first; parents ← "My parents are Indian" and "conceived
    //   in America" heard as the start of a family story
    { id: 'g2', skill: 'gist', level: 'B2', point: 'talk', seg: [141.5, 176.75],
      stem: 'While they wait, what does Leslie get Tom to talk about?',
      choices: [`Where his name Haverford came from`, 'Why he left South Carolina', 'How his parents came to America'], a: 0,
      cue: '質問が何度か続いたあとの、一番長い答え。',
      said: '出身を聞かれたトムは、本名と、トム・ハヴァフォードに変えた理由を話す。',
      mean: '出身の質問から始まり、話の中心は名前を変えた理由になっていく。',
      trap: 'South Carolina や両親の話が先に出るので、そちらが中心に見える。一番長く話した内容が話の芯。',
      use: 'So, where does your name come from?（その名前の由来は？）' },

    // why: near here ← "You're not from here, right?" heard as a real question expecting "yes"; born in SC ← Tom's
    //   "I'm from South Carolina" heard as the answer she accepts
    { id: 'i2', skill: 'infer', level: 'C1', point: 'abroad', seg: [141.5, 150.5],
      stem: 'What do Leslie’s questions about where Tom is from keep assuming?',
      choices: ['That he must be from another country', 'That he grew up somewhere near here',
                'That he was born in South Carolina'], a: 0,
      cue: '「But you」で始まる2つの質問。',
      line: 'But you moved to South Carolina *from where*? … But you were conceived in *Libya*, right?',
      said: '「その前はどこ？」「リビアで授かったんでしょ？」と、答えを聞いても質問を重ねる。',
      mean: 'アメリカ出身と聞いても、外国が本当の出身のはずだと思いこんでいる。',
      trap: '答えに納得したように取りやすい。But で始まる質問は、相手の答えを受け入れていない印。',
      use: 'Wait, so where did you grow up?（え、じゃあどこで育ったの？）' },

    // why: admiration ← wow = すごい, the katakana reading; knows his past ← "conceived" heard as a family secret
    //   she has found out
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'wow', reveals: ['abroad'], seg: [146.4, 153.1],
      stem: 'When Leslie brings up Libya, what does Tom’s first word show?',
      choices: ['Disbelief at what she is assuming', 'Admiration for such a good guess',
                'Surprise that she knows his past'], a: 0,
      cue: '質問のすぐあと、短い一語とその次の語。',
      line: 'But you were conceived in Libya, right? — *Wow*. *No*. I was conceived in America.',
      said: 'リビアかと聞かれ、「うわ。違う。アメリカだよ」と返す。',
      mean: 'この Wow は感心ではなく「よくそんなこと言うね」というあきれ。すぐに No が続く。',
      trap: 'ワオ＝すごい、と取りやすい。Wow のすぐあとに No が来たら、驚きは相手の言葉へのあきれ。',
      use: 'Wow. No. That’s not how it works.（うわ、違うよ。そういうことじゃない）' },

    // R fix: V2 (blind 60 %). "Sound like a designer" was a joke reading; "get ahead in business" is the same career
    //   reason with the wrong field, refuted by "in politics".
    // why: easier to say ← "funny-sounding… names" heard as a pronunciation problem; business ← "get really far"
    //   heard as a career in general
    { id: 'd5', skill: 'detail', level: 'B2', point: 'politics', reveals: ['talk'], seg: [160.1, 167.9],
      stem: 'By Tom’s own account, why did he change his name?',
      choices: ['To get further in politics', 'To be easier for people to say', 'To get ahead in business'],
      a: 0,
      cue: '「because」の文の、最後の語。',
      line: 'I changed it to Tom Haverford because… *far in politics*.',
      said: '名前を変えた理由を「政治の世界で上に行けないから」と話す。',
      mean: '名前の響きが選挙や出世に不利だと考えた、という説明。',
      trap: 'funny-sounding から「言いにくいから」と取りやすい。because の文は最後まで聞く。',
      use: 'I want to go far in this company.（この会社で上に行きたい）' },

    // R fix: V2 (blind 65 %). "Asks whether he admires him" was weak; "teasing him to run for office" takes the
    //   politics thread the wrong way, refuted by Tom's concession "Okay, yeah, fine".
    // why: backing ← the Japanese frame: an example after someone's claim heard as support (「例えば」); teasing ←
    //   "What about…?" after "politics" heard as a playful push
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'obama', reveals: ['politics'], seg: [168.4, 171.5],
      stem: 'When Leslie brings up Barack Obama, what is she doing?',
      choices: ['Pointing out a case that undercuts his reason', 'Backing his reason with a famous example',
                'Teasing him that he should run for office'], a: 0,
      cue: '質問のあと、トムの短い3語の返事。',
      line: '*What about Barack Obama?* — *Okay, yeah, fine*.',
      said: '政治は無理と言うトムに「オバマは？」と聞き、トムは「まあね」と認める。',
      mean: 'What about ～? で反例を出し、理屈に穴があると示している。',
      trap: 'What about を意見を聞く形や、例を足す形に取りやすい。返事が譲歩なら反論だった。',
      use: 'What about last time, though?（でも前回はどうだった？）' },

    // anchor: 171.5–172.7 s both sources have “if I knew a dude named…”: no “had”, no “'d”, a past “if” in the
    //   plain past tense, five quick words
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'ifiknew', seg: [170.7, 175.4],
      stem: 'Type the words: “___ named Barack Obama was going to be elected…” (5 words)',
      answer: 'if i knew a dude',
      cue: '「Barack Obama」のあと。文法より聞こえた音を。',
      line: '*If I knew a dude* named Barack Obama was going to be elected president…',
      said: '「オバマって男が大統領になると知ってたら」と言う。5語がひと続きに聞こえる。',
      mean: '過去の仮定なので文法では If I had known だが、会話では If I knew もよく使う。',
      trap: '習った仮定法に合わせて had を足したくなる。正しい文でなく聞こえた音を書く。',
      use: 'If I knew, I’d have told you.（知ってたら言ってたよ）' },

    // R fix: V2 (blind 55 %). "Give up after a long wait" broke with the noise and the description; "scare him off"
    //   follows "did you hear that noise", refuted by the description and the name.
    // why: stranger ← "white male, light brown hair" is how you describe a stranger, and the name only comes after;
    //   scare him off ← "did you hear that noise?" sounds like they've been heard
    { id: 'g3', skill: 'gist', level: 'B2', point: 'kingpin', seg: [177.85, 196.5],
      stem: 'How does the stakeout end?',
      choices: ['They realize the man is someone they know', 'They spot a stranger they can only describe',
                'They scare the man off before seeing him'], a: 0,
      cue: '見た目を言ったあと、何度もくり返される名前。',
      said: '物音がして「黒幕だ」とメモを取り、外見を言ううちに、知っている人だと気づく。',
      mean: '正体不明の「大物」が、実は身近な人だった、という落ち。',
      trap: '外見の説明や物音から、知らない人や逃げられた話と思いやすい。最後にくり返される名前が結末。',
      use: 'Wait, I know that guy!（待って、あの人知ってる！）' },

    // R fix: V2 (blind 50 %). "Does it look like" is barely idiomatic after "Oh my God"; "he looks like" (a weak "it"
    //   vs "he") is a real option, refuted by the vowel-only start "it".
    // why: looked ← the final consonant before "like" is easy to lose, so the past tense seems possible; he ← the weak
    //   "it" heard as "he", since a man is being described
    { id: 's1', skill: 'sound', level: 'B2', point: 'looks', reveals: ['kingpin'], seg: [186.7, 190.5],
      stem: 'Fill the gap: “Oh my God, ___ Andy.”',
      choices: ['it looks like', 'it looked like', 'he looks like'], a: 0,
      cue: '「Oh my God」のすぐあと、動詞の語尾。',
      line: 'Oh my God, *it looks like* Andy.',
      said: '写真を撮りながら「うそ、アンディみたい」と言う。',
      mean: 'looks like ＋ 人 ＝ ～に見える。まだ確信はなく、次で言い切る。',
      trap: '-ed の t は like の前で消えやすいが、-s は息が残る。語尾の息で今か過去かを聞く。',
      use: 'It looks like rain.（雨が降りそう）' },
  ]
};
