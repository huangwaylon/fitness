// REVIEW 2026-11-16: pass 7, fix 16, drop 1, new 1; ear checks 1
// OPEN: is c3's “Paul Blart” jab more than an insult (GUIDE §3)? If not, drop c3 and add a C2 on another point.

// “The Drug Kingpin of Pawnee | Parks and Recreation” (the official Parks and Recreation channel, Season 2): Leslie
// and Tom stake out the community garden where someone is growing weed; their “kingpin” turns out to be Andy, living
// in the pit, who joins them and crashes on a candy necklace. A couple's evening ends with “that guy… breaking into
// that van”, and an officer questions Tom, who had locked himself out.
// Segments from the captions, words from whisper (2026-11-16). Whisper's timings drift (one line a second, with
// repeated loops at 112–126 s and 230–241 s), so every time is from the captions. Leslie is settled by “Leslie!”
// (289 s, Tom calling his partner) and Tom by “Tom Haverford” (250.4 s); the couple at 192–218 s is never named.
// Untested: 10–14 s (“cameras, um, four”/“cameras, corp”), 56–62 s (“pit”/“fit”, “It's top”/“Stop”), 62.5 s (“What
// did you hear”/“Oh, did you hear”), 104.8 s (“Hold on, look at me”/“Oh, don't look at me”), 133 s (“She's out on
// a—”/“on anything”), 159.5 s, 184.7 s, 191.9 s, 215 s (“plan to not”/“have planned to not… to say no”), 255.6 s (“Want
// to jimmy”/“Why don't you jimmy”) and 287.4 s (“employee”/“appointee”).
// EAR CHECK: 223.5 s s1 — “It does look like” (both sources): the weak “does” is there, not “It looks like”
import type { Clip } from '../types.ts';

export const kingpin: Clip = {
  id: 'kingpin', video: 'nulGoBim0bw', title: 'The Drug Kingpin of Pawnee', dur: 310, wpm: 205, band: 'fast',
  tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 — the key was the only choice that used “real police” (70 % blind). The worried choice now uses it too.
    // why: worried ← “real police” heard as the weight of real police work; bored ← snacks and a mix CD packed for a long
    //   wait
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'thrill', seg: [15.4, 30.3],
      stem: 'How does Leslie seem to feel about the stakeout?',
      choices: ['Excited, as if they were real cops', 'Worried, as if this were real police work',
                'Bored already, with a long night ahead'], a: 0,
      cue: '持ち物の紹介のあと、自分たちを何にたとえるか。',
      line: 'It’s *like we’re real police*. … It’s *really cool*.',
      said: 'キャンディのネックレスまで用意し、「本物の警察みたい」と言う。',
      mean: 'CD まで作り、「すごくいい」と自分で言う。張り込みを楽しみにしている。',
      trap: '張り込み＝緊張、と考えやすいが、言葉は遊びに行くような明るさ。',
      use: 'I feel like a real chef!（本物のシェフみたい！）' },

    // R fix: V2 — “watching” was the only choice that fit a stakeout (50 % blind). “Following” fits one just as well.
    // why: following ← a stakeout word with the same “people … people” frame, the verb only half caught; cops ← “real
    //   police” just before
    { id: 'd2', skill: 'detail', level: 'B1', point: 'cd', seg: [19.5, 27.3],
      stem: 'What kind of songs did Leslie put on the mix CD?',
      choices: ['Songs about people watching people', 'Songs about people following people',
                'Songs about cops chasing bad guys'], a: 0,
      cue: '「filled with」のあと。',
      line: 'It’s all filled with *songs about people watching people*.',
      said: '「人が人を見張る歌ばかり入れた CD を作った」と言う。',
      mean: '張り込みに合わせた選曲。ここまで準備する張り切りぶりも伝わる。',
      trap: '張り込みらしい動詞はほかにもある。about のあとの動詞を一語ずつ聞く。',
      use: 'I made a playlist for the drive.（ドライブ用のプレイリストを作った）' },

    // R fix: V2 + C10 — the key was the only choice built on the name joke (70 % blind); now a brand that put his name
    //   on it is the near miss. The line drops “Everyone” (whisper only), so the key rests on words both sources give
    //   and the ear check is gone.
    // why: a brand put his name on it ← “Tommy Hilfiger?” + “monogrammed”, the relation reversed; designer money ← the
    //   price (n1) caught as the point of pride
    { id: 'h1', skill: 'humor', level: 'C1', point: 'hilfiger', seg: [33.6, 40.2],
      stem: 'What is Tom so pleased about with his shirt?',
      choices: ['His own name gets mistaken for a big brand', 'A big brand agreed to put his name on it',
                'He paid designer money to get it made'], a: 0,
      cue: 'ブランド名の問いへの答えと、最後のひとこと。',
      line: 'Tommy Hilfiger? — No, *Tom Haverford*. … *thinks it’s Tommy Hilfiger*.',
      said: '「ブランドの？」と聞かれ、「いや、自分の名前。みんなブランドだと思う」と言う。',
      mean: '頭文字が同じ自分の名前を入れて、有名ブランドに見せている。それが自慢なのが笑い。',
      trap: 'お金やブランドとの縁の自慢と取りやすいが、喜んでいるのはブランドと思われること。',
      use: 'People think it’s designer. It’s not.（ブランド物だと思われるけど、違うんだ）' },

    // why: $20 ← the first part of the number lost, only “twenty” caught; $200 ← “hundred” caught, the rest heard as
    //   “two”
    { id: 'n1', skill: 'number', level: 'B1', point: 'price', seg: [34.9, 38.5],
      stem: 'How much did Tom pay to have the shirt monogrammed?',
      choices: ['$20', '$120', '$200'], a: 1, keep: true,
      cue: '「I spent」のすぐあと。',
      line: 'I spent *120 bucks* to get… monogrammed.',
      said: '「名前を入れるのに120ドルかけた」と言う。',
      mean: 'bucks ＝ dollars のくだけた言い方。シャツに名前を入れるだけで大金。',
      trap: '数の前半を聞き逃すと20に、後半を聞き逃すと200になりやすい。最後まで聞き切る。',
      use: 'It cost me fifty bucks.（50ドルもしたんだよ）' },

    // R fix: V2 — black was the only stakeout color among non-colors (80 % blind). Now three stakeout outfits.
    // why: navy ← another dark color, the short word half caught; camouflage ← “real police” + “stakeout”, the
    //   hide-and-watch script
    { id: 'd1', skill: 'detail', level: 'B1', point: 'black', seg: [39.7, 45.8],
      stem: 'What does Leslie tell Tom to wear instead?',
      choices: ['Something all in black', 'Something all in navy', 'Something in camouflage'], a: 0,
      cue: '「Take this」のあと、短い命令。',
      line: 'You should be wearing something like this. … *Wear black.*',
      said: '「こういうのを着なさい。黒を着て。張り込みは黒」と言う。',
      mean: '目立つ名前入りシャツの代わりに、黒い服を渡している。',
      trap: '張り込みと聞いて迷彩や紺を思いやすいが、言っているのは一色だけ。短い命令文を聞き逃さない。',
      use: 'Wear something warm tonight.（今夜は暖かい服を着てね）' },

    // R fix: V2 + C10 — three choices of one shape now (55 % blind). The stem says “the speaker”, so the key no longer
    //   rests on who says it, and the ear check is gone.
    // why: pleased ← “pretty” heard as a positive word (かわいい) and “fits” as good news; surprised ← the line's flat
    //   delivery read as mild surprise
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'bummed', seg: [45.4, 50.4],
      stem: 'When the black top turns out to fit, how does the speaker feel?',
      choices: ['Let down that it fits', 'Pleased that it fits', 'Surprised that it fits'], a: 0,
      cue: 'fits の前の2語。気分を表す語。',
      line: '*Pretty bummed* this fits.',
      said: '渡された黒い服を着て、「サイズが合っちゃって、がっかり」と言う。',
      mean: 'bummed ＝ がっかり。合わなければ自慢のシャツでいられた。pretty は「かなり」。',
      trap: 'pretty を「かわいい」、fits を良い知らせと取ると前向きに聞こえる。',
      use: 'I’m pretty bummed about the rain.（雨でけっこうがっかり）' },

    // R fix: V2 — the key was the only choice with a friend in it (60 % blind). All three now start alike.
    // why: tell him to leave ← “Quietly” and “What are you doing here?” heard as shooing him off; turn him in ← “Andy is
    //   the kingpin”, taken as the end of the case
    { id: 'g1', skill: 'gist', level: 'B2', point: 'andy', reveals: ['whydont'], seg: [61.4, 122.3],
      stem: 'What happens once Leslie and Tom spot someone?',
      choices: ['The suspect is a friend, and they ask him to help',
                'The suspect is a friend, and they tell him to leave',
                'The suspect is a friend, and they turn him in'], a: 0,
      cue: '「Andy, come here」のあと、二人の誘い方。',
      line: '*Andy is the kingpin.* … why don’t you *come to the van and help us*?',
      said: '怪しい人影は友人の Andy。犯人だと思ったが、話すうちに「車で手伝って」と誘う。',
      mean: '容疑者だった人が、張り込みの仲間になる。',
      trap: 'Quietly や What are you doing here? は追い返しに聞こえるが、最後は車に誘う。',
      use: 'Why don’t you join us?（一緒にどう？）' },

    // R drop: c1 (C2, never shipped) — no anchor. The key (“he's eating food that isn't his”) rests only on nobody
    //   saying otherwise, and “that's our community garden” reads just as well as a plain lead-in to the weed line
    //   (K1, native-level §2). Replaced by c3 (R new) at 271.6 s.

    // R fix: V2 — the selling and secret choices were the suspicion script, so the innocent key stood out (55 % blind).
    // why: knew but not who ← “There's weed down there?” heard as surprise at the grower, not the plant; making it up ←
    //   the question heard as disbelief at their claim, but “I thought that was…” accepts it
    { id: 'i2', skill: 'infer', level: 'B2', point: 'carrots', seg: [100.2, 108.6],
      stem: 'What does Andy’s reaction to the weed suggest?',
      choices: ['He never knew the plants were weed', 'He knew, but didn’t know who grew it',
                'He thinks they are making it up'], a: 0,
      cue: '驚いた問い返しと、何だと思っていたか。',
      line: 'There’s weed down there? I thought that was *the tops of carrots*.',
      said: '「あそこに weed が？ニンジンの葉だと思ってた」と驚く。',
      mean: 'すぐそばで暮らしていても、正体に気づいていなかった。犯人ではないと分かる一言。',
      trap: '問い返しは疑いにも聞こえるが、何と間違えたかまで言うのは本気の驚き。続きの一文で判断する。',
      use: 'Wait, that’s not parsley?（え、それパセリじゃないの？）' },

    // why: why he hasn't helped ← “why don't you” read word by word (なぜ〜しないの); why he's there ← the earlier
    //   “What are you doing here?”
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'whydont', seg: [109.4, 115.6],
      stem: 'When they explain the stakeout to Andy, what is their question doing?',
      choices: ['Inviting him to join them in the van', 'Asking why he hasn’t helped them yet',
                'Asking him to explain why he’s there'], a: 0,
      cue: '「stakeout, okay?」のあと、Why で始まる文。',
      line: 'So, *why don’t you come to the van* and help us?',
      said: '「張り込み中なんだ。車に来て手伝ってよ」と誘う。',
      mean: 'Why don’t you ～? は理由を聞く形で、実は「～したら？」という誘いや提案。',
      trap: '「なぜ～しないの」と取ると責めているように聞こえる。Why don’t you のあとが行動なら誘い。',
      use: 'Why don’t you sit with us?（一緒に座ったら？）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'rock', seg: [115.2, 118.3],
      stem: 'Type Andy’s reply: “___ have a rock fight with this crazy guy.” (3 words)', answer: "i'm supposed to",
      cue: '誘いへの返事の文頭。予定を表す形。',
      line: '*I’m supposed to* have a rock fight with this crazy guy.',
      said: '「この変なやつと石投げのけんかをする予定なんだ」と言う。',
      mean: 'be supposed to ＝ ～することになっている。予定や約束を言う形。',
      trap: 'supposed to は「サポースタ」とつながり、d と t が一つになる。to を落とさずに書く。',
      use: 'I’m supposed to meet her at six.（6時に彼女と会うことになってる）' },

    // why: 2 ← the “-ty” swallowed; 12 ← twelve and twenty share “twe-”
    { id: 'n2', skill: 'number', level: 'B1', point: 'late', seg: [115.2, 121.3],
      stem: 'How late is the man Andy is meant to meet?',
      choices: ['2 minutes', '12 minutes', '20 minutes'], a: 2, keep: true,
      cue: '「He’s like」のあと。',
      line: 'He’s like *20 minutes* late.',
      said: '「もう20分くらい遅れてる」と言って、二人について行く。',
      mean: 'like は「だいたい」。約束の相手が来ないので、誘いに乗ることにした。',
      trap: 'twenty と twelve は出だしが同じ。終わりが「ティ」なら twenty。',
      use: 'The bus is like ten minutes late.（バスが10分くらい遅れてる）' },

    // R fix: V2 — three different moods let the sad, sitcom-likely key stand out (55 % blind). Now two half-right pairs.
    // why: over Ann ← “really great to have somebody to talk to” is right, but “I miss her so much” rules out the rest;
    //   angry ← “It's ridiculous” heard as a complaint about Ann
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'lonely', seg: [122.3, 130.3],
      stem: 'In the van, how does Andy seem to be doing?',
      choices: ['Lonely, and still missing Ann badly', 'Glad of company, and over Ann by now',
                'Lonely, and angry at Ann for leaving'], a: 0,
      cue: '「talk to」と、Anne の名前のあと。',
      line: 'It is *really great to have somebody to talk to*. … *I miss her so much*. It’s ridiculous.',
      said: '「話し相手がいるって最高」と言い、「Anne に会いたくてたまらない」と言う。',
      mean: '一人きりの寂しさと、別れた相手への思い。ridiculous は「自分でも変なくらい」。',
      trap: 'ridiculous を相手への文句と取りやすいが、気持ちの強さの表現。',
      use: 'I miss home so much. It’s ridiculous.（家が恋しくて、自分でも笑っちゃう）' },

    // R fix: V2 + S4 — the string choice was out of place for “so hard” (65 % blind); now three reasons of one kind. The
    //   segment ran 17.4 s, mostly chewing; it now ends after his reason (151.5 s).
    // why: no food for days ← “for weeks now” caught, “fruits and vegetables” missed; no sleep ← “if I'm going to stay
    //   up tonight” just before, and “for weeks” attached to it
    { id: 'd4', skill: 'detail', level: 'B2', point: 'sugar', seg: [145.2, 151.5],
      stem: 'Why does one candy necklace hit Andy so hard?',
      choices: ['He’s had only fruit and vegetables for weeks', 'He’s had nothing at all to eat for days',
                'He hasn’t had a real night’s sleep in weeks'], a: 0,
      cue: 'キャンディを食べる前の、最近の食事の話。',
      line: '*All I’ve had is fruits and vegetables* for weeks now.',
      said: '「何週間も果物と野菜だけ」と言い、キャンディでハイになる。',
      mean: 'sugar high ＝ 甘い物で急に元気になること。久しぶりの砂糖でよく効く。',
      trap: 'for weeks だけ残ると、絶食や寝不足に聞こえる。All I’ve had is のあとを聞く。',
      use: 'Too much coffee. I’m so wired.（コーヒー飲みすぎてハイだ）' },

    // why: going ahead ← “bring” + food heard as the speaker doing the ordering; too full ← the candy and the sugar high
    //   (it was Andy who ate it)
    { id: 'i5', skill: 'infer', level: 'B2', point: 'stays', seg: [172.1, 180.0],
      stem: 'When going out for food is suggested, what does the last request tell us?',
      choices: ['The speaker is staying behind while they go', 'The speaker is going ahead to order for them',
                'The speaker is too full of candy to come'], a: 0,
      cue: '「I’m in」のあと、最後の頼みごと。',
      line: 'Hey, *bring me back* two cheeseburgers and a green tea.',
      said: '食事に行く話のあと、「チーズバーガー2つと緑茶を買ってきて」と頼む。',
      mean: 'bring me back ＝ 帰りに買ってきて。自分は行かず、残るということ。',
      trap: '食べ物を頼むので一緒に行くと思いやすい。bring me back は「ここで待つ」の合図。',
      use: 'Can you bring me back a coffee?（帰りにコーヒー買ってきてくれる？）' },

    // why: corrects ← in fact = 実は, a correction; admits ← the Japanese frame: 実は… as the start of a confession
    { id: 'm1', skill: 'marker', level: 'B2', point: 'infact', seg: [196.3, 205.0],
      stem: 'After the man says he’s been a perfect gentleman, what does his next phrase do?',
      choices: ['It adds proof he is about to show her', 'It corrects what he has just told her',
                'It admits he has not been so polite'], a: 0,
      cue: 'gentleman のあとの2語と、続く watch this。',
      line: 'I have been a perfect gentleman this evening. *In fact*, watch this.',
      said: '「今夜はずっと紳士だった。なんなら見てて」と言う。',
      mean: 'in fact は、前の話をさらに強める証拠を足す合図。ここは「その証拠に」。',
      trap: 'in fact ＝「実は」と覚えていると、打ち明け話や訂正に聞こえる。前の文を強めているかを聞く。',
      use: 'I love it here. In fact, I’m staying.（ここが好き。なんなら残るよ）' },

    // why: she says yes ← who invites whom gets muddled (“ask me in” / “Will you come in”); won't play along ← her
    //   “Not a chance” (205.2 s)
    // R fix: S4 — the segment ran 20.6 s; it now starts at “Not a chance” (205.2 s), which still holds “Just watch what
    //   I'm going to do” and the evidence against the best distractor.
    { id: 'h2', skill: 'humor', level: 'C1', point: 'nightcap', reveals: ['infact'], seg: [204.6, 216.9],
      stem: 'Why does the man’s “watch this” moment get a laugh?',
      choices: ['He planned to say no, but says yes right away', 'She says yes, which he didn’t expect at all',
                'She won’t play along, so his plan falls flat'], a: 0,
      cue: '彼女の誘いへの、彼の最初の一言。',
      line: 'Will you come in for a nightcap? — *Yes, I will.* No, no, damn! Drats!',
      said: '断ってみせるはずが、「寄っていく？」と聞かれて「うん」と即答し、「しまった」。',
      mean: '紳士ぶりを見せる予定が、誘われた瞬間に本音が出た。damn、drats は「しまった」。',
      trap: '誰が誘い誰が答えたかを追う。最初の一言を No, no と打ち消している。',
      use: 'Oops. Wait, I meant no.（あ、待って、今のなし）' },

    // why: It looks ← the weak “does” lost; doesn't ← does/doesn't, an -n't heard in “does”; just looks ← “does” heard
    //   as a short filler like “just”
    { id: 's1', skill: 'sound', level: 'B2', point: 'does', seg: [219.3, 225.4],
      stem: 'Fill the gap: “___ like he’s breaking into that van.”',
      choices: ['It looks', 'It does look', 'It doesn’t look', 'It just looks'], a: 1,
      cue: 'It と look の間、短い一語。',
      line: 'You know what? *It does look* like he’s breaking into that van.',
      said: '「車に押し入ろうとしてる」と言われ、「確かにそう見える」と返す。',
      mean: 'does を入れると「確かに」と同意を強める。相手の言葉を認める言い方。',
      trap: 'doesn’t なら「そうは見えない」と逆になる。n’t の t が消えても「ン」が残るかを聞く。',
      use: 'You do look tired today.（今日はほんとに疲れて見える）' },

    // R fix: V2 + S4 — Andy was in the van with them, not in the pit, so the distractor didn't hold (65 % blind). Now an
    //   officer driving by, refuted by “a 911 call”. The segment ends at 247.3 s; it still runs 28 s, because the two
    //   lines it ties are in two scenes.
    // why: driving by ← the usual reason police turn up at a parked van, but “I'm responding to a 911 call” rules it
    //   out; Tom himself ← “locked out” (252 s) heard as a call for help that brought the police
    { id: 'i3', skill: 'infer', level: 'C1', point: 'report', reveals: ['cop'], seg: [219.3, 247.3],
      stem: 'Who most likely called the police about Tom?',
      choices: ['The couple who saw him at the van', 'The officer, who saw it driving by',
                'Tom himself, after he got locked out'], a: 0,
      cue: '前の場面の二人の会話と、警官の説明。',
      line: 'That guy’s *trying to break into that van*. … a *911 call about a suspicious person breaking into a van*.',
      said: '前の場面の二人が「車に押し入ろうとしてる」と話し、警官は「押し入りの通報」で来る。',
      mean: '二つの場面の言葉が同じ。通報したのは Tom を泥棒と思った二人。',
      trap: 'locked out から自分で助けを呼んだと取りやすいが、通報の中身は「怪しい人物」。',
      use: 'Somebody called it in.（誰かが通報したんだ）' },

    // R fix: V2 — the ticket choice was far from the scene, so the key stood out (70 % blind). Now a half-right near miss
    //   (taken for a thief, but calm) and a thief caught.
    // why: calmly clears it up ← “I'm all right, officer. How are you?” and the ID handed over (269 s) sound like a quick
    //   end, but “Paul Blart” and “very close… to placing you under arrest” follow; catches a thief ← “breaking into a
    //   van” heard as someone else at the van
    { id: 'g2', skill: 'gist', level: 'B2', point: 'cop', reveals: ['stays'], seg: [228.6, 289.0],
      stem: 'How does Tom’s night in the van turn out?',
      choices: ['He’s taken for a thief and argues with the officer', 'He’s taken for a thief and calmly clears it up',
                'He catches a thief and calls the police himself'], a: 0,
      cue: '警官が来た理由と、そのあとのやりとり。',
      said: '車に入ろうとして通報され、警官に身分証を求められて言い合いになる。',
      mean: '自分の仕事の車なのに泥棒と思われ、態度が悪くて話が大きくなる。',
      trap: '最初は丁寧なあいさつなので穏やかに終わると思いやすい。最後まで聞くと言い合いが強まっていく。',
      use: 'It’s my car. I’m just locked out.（自分の車です。締め出されただけで）' },

    // R fix: V2 — “waited” was a filler, so forcing it stood out (60 % blind). A window is the near miss now.
    // why: a man named Jimmy ← the verb heard as the name; a window ← “my way back in” caught, the verb unknown, and
    //   climbing in is the other way back into a locked car
    { id: 'p1', skill: 'phrase', level: 'C1', point: 'jimmy', seg: [248.9, 255.4],
      stem: 'When Tom explains how he got back into the van, what did he do?',
      choices: ['He forced it open without a key', 'He climbed back in through a window',
                'He got a man named Jimmy to open it'], a: 0,
      cue: '「locked out」のあと、had to に続く動詞。',
      line: 'I just got *locked out* of the van and had to *jimmy my way back in*.',
      said: '「車から締め出されて、こじ開けて中に戻った」と説明する。',
      mean: 'jimmy ＝ 道具でこじ開ける。動詞＋my way back in で「～して中へ戻る」。',
      trap: 'Jimmy という名前に聞こえるが、had to のあとなので動詞。',
      use: 'We pushed our way to the front.（人をかき分けて前に出た）' },

    // R fix: V2 — the card distractor was a plain fact, not a joke, so the key stood out (55 % blind). All three are now
    //   claims Tom could be making.
    // why: already handed it over ← “I just told you” heard as “I just gave you”; a city job ← “I work for the parks
    //   department”, said as if it settled things (he says so outright only later, at 287 s, outside the segment)
    { id: 'h3', skill: 'humor', level: 'C1', point: 'id', seg: [249.0, 261.6],
      stem: 'Why is Tom’s answer to the second request for ID funny?',
      choices: ['He treats saying his name as showing ID', 'He insists he already handed his ID over',
                'He claims his city job means he needs none'], a: 0,
      cue: '「I just」のあとの動詞。',
      line: 'My name is *Tom Haverford*. … I just *told you my ID*.',
      said: '名前と職場を言っただけで、身分証を求められると「もう言ったでしょ」と返す。',
      mean: 'ID は見せる物なのに、名前を言えば済むと思っている。',
      trap: 'told を gave と聞くと、もう渡したことになる。show と tell の違いを聞く。',
      use: 'Can I see some ID, please?（身分証を見せていただけますか）' },

    // anchor: 253.9–255.0 s Tom: “had to jimmy my way back in”; 255.9–257.3 s the officer: “jimmy your way out and show
    //   me some ID”: the same rare verb, with “back in” turned to “out”
    // R fix: V2 — the key was the only non-literal choice (60 % blind). Now right mechanism, wrong target (mocking him
    //   for being locked in) and the literal reading.
    // why: mock him for being locked in ← mocking is right, but Tom said he got back in, so nothing is locked; open it
    //   from inside ← the literal reading of “jimmy… out”
    { id: 'c2', skill: 'infer', level: 'C2', point: 'jimmy', seg: [252.2, 257.8],
      stem: 'Why does the officer tell Tom to “jimmy” his way out?',
      choices: ['To mock Tom’s excuse by using his own word', 'To mock Tom for getting locked in the van',
                'To have Tom force the door open from inside'], a: 0,
      cue: 'Tom の説明と、警官の返しの動詞。',
      line: 'had to *jimmy my way back in*. — *Jimmy your way out* and show me some ID.',
      said: 'Tom が「こじ開けて中に戻った」と言うと、警官は「じゃあ、こじ開けて出てきて、身分証を」と返す。',
      mean: '相手の珍しい言い回しをそのまま使い、方向だけ変えて言い返す。皮肉で言い訳を受け流している。',
      trap: '文字通りなら閉じこめられた人への指示に聞こえる。直前の相手の言葉をまねて返す形に気づく。',
      use: 'Fine. Then talk your way out of it.（じゃあ口でうまく切り抜けてみなよ）' },

    // anchor: 272.2–277.0 s Tom: “Nice job, Paul Blart. Why don't you head back to the mall and make sure nobody's
    //   breaking into Lady Foot Locker”: “back to the mall” and the shoe store put the officer in a mall; 278.6–280.9 s
    //   the officer: “I'm very close right now to placing you under arrest”: it landed as a jab, not as praise
    // why: a good cop ← “Nice job” taken as sincere (the sincerity flip); a new cop on small jobs ← scope: “head back to
    //   the mall” heard as “go back to easy cases”, still a real officer
    // R new: replaces c1 (C2). Blind read: the key is one of three readings of “Nice job”; two say a real cop.
    { id: 'c3', skill: 'attitude', level: 'C2', point: 'blart', seg: [271.6, 281.4],
      stem: 'When Tom says “Nice job, Paul Blart”, what is he calling the officer?',
      choices: ['A mall guard pretending to be a real cop', 'A good cop who did his job quickly',
                'A new cop who should stick to small jobs'], a: 0,
      cue: 'Nice job のあと、どこへ戻れと言うか。',
      line: 'Nice job, Paul Blart. Why don’t you *head back to the mall*… — I’m very close right now to placing you…',
      said: 'Tom は「お見事、Paul Blart。モールに戻って靴屋でも見張ってな」と言う。',
      mean: 'モールの警備員にたとえ、「本物の警察じゃない」とからかう。警官はすぐ「逮捕寸前だ」と返す。',
      trap: 'Nice job をほめ言葉と取ると逆。名前を知らなくても back to the mall が手がかり。',
      use: 'Nice job, Sherlock.（お見事、名探偵さん。皮肉で）' },

    // R fix: V2 — the nearby choice was a filler and the key stood out (70 % blind). Now nearly done is the near miss.
    // why: under arrest ← “under arrest” and “right now” caught, “very close to” missed; nearly done ← “very close
    //   right now” heard as “almost finished”, the ID having just been handed over
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'arrest', seg: [278.1, 282.7],
      stem: 'What is the officer doing when he says he’s “very close right now”?',
      choices: ['Warning Tom he will be arrested if he goes on', 'Telling Tom that he is under arrest from now',
                'Telling Tom he has nearly finished with him'], a: 0,
      cue: '「under arrest」の前の言葉。',
      line: 'I’m *very close right now to* placing you under arrest…',
      said: '「逮捕まであと少しだ。車から出なさい」と言う。',
      mean: 'close to ～ing ＝ もう少しで～する。まだ逮捕ではなく、最後の警告。',
      trap: 'under arrest だけなら逮捕済み、close だけなら「もうすぐ終わる」に聞こえる。to の先まで聞く。',

      use: 'I’m this close to quitting.（もう少しで辞めるところだよ）' },
  ]
};
