// REVIEW 2026-11-16: pass 8, fix 13, drop 0, new 0; ear checks 0
// REVIEW open: on play 3, nt2 (the only unseen C2 by then) can't join g1 (it reveals `turndown`), so about 1 seed in 4
//   gets no C2 until play 4. draw.ts treats the C2 as a preference, so nothing breaks; a third C2 would fix it.
// REVIEW open: the stems give the first lines (0–11 s) to Ben; no name settles it, but nt2's “In this building” is
//   Ben's by Leslie's retelling (51 s), and the opening is the same two-hander.
// “Leslie fills out a dating profile like it's a CV | Parks and Recreation” (the official Parks and Recreation channel,
// Season 3): Leslie asks Ben out to dinner and gets a flustered no; while Ann runs a cholesterol test, she talks Leslie
// into internet dating, and the profile they write comes out as dull and honest as a CV.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Ben (51.9 s), Ann (95.8, 137.3 s);
// Leslie is never named, and the stems use her name from the title. Talk ends at ≈ 162 s (music after). Left out on
// purpose: who says “So I have some ideas…” and “How about I swing by later” (11–18 s: no name settles it; f3 asks
// only the phrase), “you're great, and you have great ideas… bye” (32–41 s: the speaker isn't named; a1 uses Leslie's
// retelling instead), Ann's “If he just/doesn't want to go out with you” (63.5 s; both sources write “just want”),
// “Bye, babe” (44.6 s; whisper only), and the Phantom of the Opera line (160 s: the joke needs world knowledge).
import type { Clip } from '../types.ts';

export const datingCv: Clip = {
  id: 'datingcv', video: 'uKQA8Umr-wo', title: 'Leslie fills out a dating profile like it\'s a CV', dur: 184, wpm: 157,
  band: 'mid', tags: ['恋愛', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: sorry ← "I can't believe I'm saying this" heard as regret; let down ← "that you recommended" heard as high
    //   hopes that weren't met
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'believe', seg: [0, 8],
      stem: 'How does Ben feel about the snow globe museum?',
      choices: ['Surprised that he ended up liking it', 'Sorry he let Leslie talk him into it',
                'Let down after all that Leslie had said'], a: 0,
      cue: '「but」のあとと、最後の I have to say。',
      line: 'I *can’t believe I’m saying this, but*… it was *pretty awesome*, I have to say.',
      said: '「信じられないけど、君が勧めた博物館、正直かなり良かった」。',
      mean: 'I can’t believe I’m saying this ＝ 意外なことを認める前置き。',
      trap: '「信じられない」を後悔や不満と取りやすい。but のあとが本題で、ほめている。',
      use: 'Can’t believe I’m saying it: I agree.（言うのも意外だけど、賛成）' },

    // why: broke ← "got in trouble" with snow globes suggests a broken one; went back ← "anymore" and "awesome" heard as
    //   repeat visits
    { id: 'd1', skill: 'detail', level: 'B1', point: 'museum', seg: [0, 11.6],
      stem: 'What happened to Ben at the museum?',
      choices: ['He got banned for shaking a globe', 'He broke a globe and had to pay', 'He liked it and went back again'],
      a: 0,
      cue: '「I did get in trouble」のあと。',
      line: 'I did get in trouble for *shaking one*. Yeah, *I’m not allowed there anymore*.',
      said: '「1個振っちゃって怒られた。もう出入り禁止なんだ」。',
      mean: 'not allowed there anymore ＝ もう入れてもらえない。',
      trap: 'trouble と聞くと壊した話を想像しやすい。理由は for のあと、結果は anymore の文。',
      use: 'Am I allowed to take photos here?（ここ、写真を撮ってもいいですか）' },

    // why: phone call ← "later" + talking it over = a call (the usual office script); drive ← "swing" heard as a ride
    //   or a turn of the wheel
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'swingby', seg: [11.4, 18.2],
      stem: 'What is the first offer for going over the health ideas?',
      choices: ['A short visit to talk them over later', 'A phone call to go over them tonight',
                'A drive out together to see the site'], a: 0,
      cue: '「How about I」のあとの2語。',
      line: 'How about I *swing by later* and… we’ll go over everything?',
      said: '「あとでちょっと寄って、全部確認しようか」と提案する。',
      mean: 'swing by ＝ ついでに立ち寄る。短く気軽な訪問を言う口語。',
      trap: 'swing を「振る」「車で回る」と取りやすい。by がつくと「立ち寄る」。動詞＋by は場所に寄る形。',
      use: 'I’ll swing by after lunch.（お昼のあとに寄るね）' },

    // R fix: V2 (55 % blind: the key was the only "X, not Y" choice). Three "It … the talk" readings; the new near miss
    //   keeps the date and only moves it.
    // why: a date at work ← "talk about it later" + a place, heard as accepting the date in a new spot (office
    //   romance); right now ← "later" lost under the afterthought, heard as a place to go at once
    // anchor: 27.62–29.02 s “In this building” tacked on after “talk about it later”, answering “go out after work… grab
    //   a bite” (18–23 s); 51.4–53.7 s Leslie: “I asked Ben out to dinner, and he said no”
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'building', reveals: ['turndown'], seg: [13.9, 29.8],
      stem: 'What does Ben’s short afterthought add to “talk about it later”?',
      choices: ['It keeps the talk at work, not a date', 'It makes the talk a date, but at work',
                'It moves the talk to his office right now'], a: 0,
      cue: '「later」のあとの付け足しと、直前の誘い。',
      line: 'why don’t we just talk about it later? *In this building*.',
      said: '仕事のあと食事に誘われ、「無理かな。あとで話そう」と答えてから「この建物の中で」と付け足す。',
      mean: '「あとで」が夜のデートに聞こえないよう、仕事の場に限ると念を押す一言。やんわりした線引き。',
      trap: 'later だけだと「あとで会おう」にも聞こえる。付け足しは、誤解を消すために言うことが多い。',
      use: 'Let’s talk tomorrow. At the office, I mean.（明日話そう。会社でね）', retired: true },

    // R fix: V2 (65 % blind: two fillers). Three "Leslie…" causes; the near misses are Ann's dating talk given to
    //   Leslie and the profile topic pushed back in time.
    // why: meet more men ← Ann's "dating a bunch of people" and "a million other guys" heard as Leslie's wish; old
    //   profile ← "profile" and "internet dating" heard as something she already tried
    { id: 'g1', skill: 'gist', level: 'B2', point: 'turndown', seg: [46.5, 104.6],
      stem: 'What leads Ann to help with a dating profile?',
      choices: ['Leslie’s dinner invitation got turned down', 'Leslie told Ann she wanted to meet more men',
                'Leslie’s old dating profile got no replies'], a: 0,
      cue: '最初の報告と、そのあとの提案の流れ。',
      said: '食事に誘って断られた、と報告すると、アンは出会いの幅を広げようとネットを勧める。',
      mean: '振られた話がきっかけで、新しい出会いを探す流れになる。',
      trap: 'アンのデートの話や profile の語が耳に残りやすい。話のきっかけは、最初の報告にある。',
      use: 'Want to grab dinner sometime?（今度ごはんでもどう？）' },

    // why: busy ← the usual reason given for a no; the project ← "into" heard as interest in a thing (the health work)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'into', reveals: ['turndown'], seg: [50.4, 57.95],
      stem: 'When Ann hears Ben said no, what does she say about him?',
      choices: ['He seemed to really like Leslie', 'He seemed to be really busy lately', 'He seemed really into the project'],
      a: 0,
      cue: '「What?」のあと、seemed に続く語。',
      line: 'What? He seemed *really into you*.',
      said: '「えっ？　すごく気がありそうだったのに」と驚く。',
      mean: 'be into someone ＝ その人に気がある。物なら「はまっている」。',
      trap: 'into は物事への興味にも使うので、仕事に熱心と取りやすい。後ろが人（you）なら恋愛の意味。',
      use: 'I think he’s into you.（彼、あなたに気があると思う）' },

    // why: cold ← a short "bye" and walking off heard as a brush-off; calm ← "he said no" told flatly, heard as no
    //   surprise to him
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'flustered', reveals: ['turndown'], seg: [56.5, 62.6],
      stem: 'In Leslie’s retelling, how did Ben react to her invitation?',
      choices: ['Flustered, as if caught off guard', 'Cold, as if her question offended him',
                'Calm, as if he’d expected it all along'], a: 0,
      cue: '口まねのあと、彼がどこへ行ったか。',
      line: 'He was like, huh, what… bye, and then he *walked into an office that wasn’t his*.',
      said: '「は？え？…じゃ」と言って、自分のでもない部屋に入っていった、と口まねする。',
      mean: '慌てて言葉にならず、行き先を間違えるほど動揺していた様子。',
      trap: '短い bye は冷たく聞こえやすい。行動（違う部屋に入った）が、気持ちの手がかりになる。',
      use: 'Sorry, you caught me off guard.（ごめん、不意をつかれて）' },

    // why: billion ← m/b at the start, and both mean "huge"; thousand ← the everyday "plenty out there" scale
    { id: 'n1', skill: 'number', level: 'B1', point: 'million', seg: [62.6, 68], keep: true,
      stem: 'How many other guys does Ann say are out there?',
      choices: ['A thousand', 'A million', 'A billion'], a: 1,
      cue: '「there’s a」のあと。',
      line: 'You’re awesome, and there’s *a million* other guys out there.',
      said: '「あなたは最高。ほかに男なんていくらでもいる」と励ます。',
      mean: 'a million ＝ 実数ではなく「数えきれないほど」。励ましの大げさ表現。',
      trap: 'million と billion は頭の音だけが違う。唇を閉じる m か、破裂する b かを聞く。',
      use: 'There are a million other options.（ほかにも選択肢はいくらでもある）' },

    // R fix: V2 (65 % blind: the "needle went in harder" filler). The new near miss is an overreaction to a real prick.
    // why: tiny prick ← "that really stings" taken as a real but small sting, the usual overreaction joke; kissing ← the
    //   cry cuts into the talk about the guy Ann was kissing
    { id: 'h1', skill: 'humor', level: 'B2', point: 'prick', seg: [70.9, 80.05],
      stem: 'Why does the cry during the cholesterol test get a laugh?',
      choices: ['It comes before she has been pricked at all', 'It is a huge cry for such a tiny prick',
                'It is really a reaction to the kissing story'], a: 0,
      cue: '叫びのすぐあと、相手の短い返事。',
      line: '…*that really stings*. — *I haven’t pricked you yet*. — Oh, sorry, I was just picturing it.',
      said: '「いたっ、しみる！」と叫ぶが「まだ刺してないよ」と言われ、「想像しちゃった」。',
      mean: '針が刺さる前に、想像だけで痛がっていた。返事の yet が落ちになる。',
      trap: 'stings を聞くと本当に痛かったと思いやすい。叫びのあとの返事で、事実を確かめる。',
      use: 'Relax, I haven’t even started yet.（落ち着いて、まだ始めてもいないよ）' },

    // R fix: V2 (55 % blind: "patient with Ben" was a filler). The new near miss is the usual friends' set-up script.
    // why: set up ← the friend-helps script, with "net" heard as a network of friends; travel ← "wider" heard as
    //   going farther
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'widernet', seg: [78.2, 83.55],
      stem: 'What is Ann’s advice about finding someone?',
      choices: ['Meet a much wider range of people', 'Get out and travel a lot more often', 'Let her friends set her up on dates'],
      a: 0,
      cue: '「maybe you need to」のあと。',
      line: 'Maybe you need to *cast a wider net*.',
      said: '「もっと網を広げてみたら？」とネットの出会いを勧める。',
      mean: 'cast a wider net ＝ 範囲を広げて探す。仕事探しにも使う。',
      trap: 'wider を距離、net を友人の輪と取りやすい。続く internet dating がヒント。',
      use: 'Try casting a wider net.（もっと幅広く探してみたら）' },

    // R fix: V2 (60 % blind: "again" tied the key to h1's pattern). Three parallel "She reacts to…" choices.
    // why: online dating ← the outburst follows "I don't think that's for me", so it sounds aimed at Ann's advice;
    //   finally hurt ← a second cry heard as real pain this time
    { id: 'h2', skill: 'humor', level: 'C1', point: 'monster', reveals: ['prick'], seg: [80, 88.3],
      stem: 'What is the second outburst during the test really about?',
      choices: ['She reacts to a prick that still hasn’t happened', 'She reacts to the advice to try online dating',
                'She reacts to a prick that finally really hurt'], a: 0,
      cue: '叫びのあとの返事と、さっきの場面。',
      line: 'Ah, *you’re a monster*. — I still *haven’t done it yet*.',
      said: 'ネットの出会いを渋ったあと「ひどい人！」と叫ぶが、「まだやってないよ」と返される。',
      mean: '刺される前に、また痛がっている。くり返しが笑いを大きくする。',
      trap: '直前の話題に向けた悪口に聞こえやすい。返事の yet が、何に反応したのかを教えてくれる。',
      use: 'Wait, I haven’t done anything yet!（待って、まだ何もしてないよ）' },

    // R fix: V2 (55 % blind: "forgotten" was a filler). The new near miss reads "different" as a replacement.
    // why: hiding ← "a different guy" heard as one new man she hid; dropped ← "different… from earlier" heard as the
    //   earlier man already replaced (Ann's "dating a bunch of people", 68 s, says otherwise)
    { id: 'i3', skill: 'infer', level: 'C1', point: 'differentguy', seg: [96.8, 102.15],
      stem: 'What does the question right after the goodbye hint about Ann?',
      choices: ['She has been seeing more than one man', 'She has been hiding a new boyfriend',
                'She has dropped the man from earlier'], a: 0,
      cue: '「different」と「from earlier」。',
      line: 'Is that *a different guy from earlier*? — What? — Never mind.',
      said: '「さっきとは別の人？」と聞き、「え？」と返されて「なんでもない」と引っこめる。',
      mean: 'いろいろな男性と会っている、とからかう。前の「デート三昧」とつながる。',
      trap: 'different を乗りかえと取りやすい。from earlier で今日二人目と分かる。',
      use: 'Never mind, it’s nothing.（なんでもない、気にしないで）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'rock', seg: [100.65, 104.8],
      stem: 'Type the question: “You ___ this profile?” (3 words)', answer: 'ready to rock',
      cue: '「Never mind」のあと。to はとても弱い。',
      line: 'You *ready to rock* this profile?',
      said: '「さあ、プロフィール作り、いく？」。Are が落ち、ready to は「レディタ」に。',
      mean: 'rock ＝ 勢いよくやる。Are you を落とすのは会話でよくある形。',
      trap: 'to が弱く ready rock に聞こえやすい。to は短い「タ」。',
      use: 'You ready to go?（もう出られる？）' },

    // R fix: V2 (60 % blind: the title says "like a CV", so "honest answers come out dull" was the title restated,
    //   §9.4). Now asks how the two of them work: plain answers, and what Ann does with them.
    // why: lets them stand ← Ann helps, so she seems to accept what Leslie gives; reins her in ← "Sexy" (110 s) heard
    //   as Leslie's own wild answer that Ann then tones down
    { id: 'g2', skill: 'gist', level: 'B2', point: 'profile', reveals: ['mural', 'planner', 'rewrite'], seg: [104.6, 162.6],
      stem: 'What keeps happening as they fill in the profile?',
      choices: ['Leslie’s answers are plain, and Ann pushes for more', 'Leslie’s answers are wild, and Ann reins her in',
                'Leslie’s answers are plain, and Ann lets them stand'], a: 0,
      cue: '答えのたびに、アンがどう反応するか。',
      said: '好きな場所は壁画の前のベンチ、趣味は手帳、理想の男性は歌えてオルガンを弾く謎の人。',
      mean: '正直すぎる答えが続き、アンが言い直したり突っ込んだりする。',
      trap: 'アンが手伝うので、答えをそのまま受け入れたように見えやすい。Really? や別案の提案を聞く。',
      use: 'Let’s make that sound more fun.（もっと楽しそうに書こう）' },
    // R fix: V2 (65 % blind: a dating-profile rewrite is "made attractive" by default) + N6 (the trap had a broken
    //   character, U+FFFD). Now asks which first-version fact "the sweeter things in life" stands for.
    // why: romance ← the idiom's usual sense (sweet = 恋, 甘い人生) in a dating profile; news ← the other fact in the
    //   same first line, mapped in the wrong order (well-read is the news)
    { id: 'i4', skill: 'infer', level: 'C1', point: 'rewrite', seg: [104.8, 115.15],
      stem: 'In the second description, what does “the sweeter things in life” stand for?',
      choices: ['Her love of waffles', 'Her love of romance', 'Her love of the news'], a: 0,
      cue: '1つ目の3つの情報が、2つ目でどうなったか。',
      line: 'Yellow-haired female. Likes *waffles* and news. — Sexy, well-read blonde. Loves *the sweeter things in life*.',
      said: '「黄色い髪、ワッフルとニュース好き」を言い直す。',
      mean: 'blonde＝黄色い髪、well-read＝ニュース好き、sweeter things＝ワッフル。響きだけ良くした。',
      trap: 'sweet を恋の話と取りやすい。言い直しは、前の言葉と順番に対応させる。',
      use: 'Let’s say it in a nicer way.（もっといい言い方にしよう）' },

    // R fix: V2 (65 % blind: the key was the only choice that fit a "second try"). Three "It's the … hobby in … words"
    //   choices: same/new × cooler/duller.
    // why: new hobby ← "jamming" (playing music) heard as a different hobby, still dull; duller ← "Wait, that doesn't
    //   sound fun" heard as the second try failing too
    { id: 'h3', skill: 'humor', level: 'C1', point: 'planner', reveals: ['doesnt'], seg: [115, 121.3],
      stem: 'What makes Leslie’s second try at listing a hobby funny?',
      choices: ['It’s the same hobby in cooler words', 'It’s a new hobby in equally dull words',
                'It’s the same hobby in even duller words'], a: 0,
      cue: '1回目と2回目、言い方と中身を比べる。',
      line: 'Organizing my agenda. Wait, that doesn’t sound fun. Um, *jamming on my planner*.',
      said: '「手帳の整理」と言い、「楽しそうじゃない」と「手帳でノリノリ」に言い直す。',
      mean: 'jam ＝ ノって楽しむ。言葉だけ派手にして、中身は手帳のまま。',
      trap: 'jamming を演奏と取ると新しい趣味に聞こえる。on my planner で同じ手帳だと分かる。',
      use: 'Wait, that came out wrong.（待って、言い方が変だった）' },

    // why: does ← the n't's t is swallowed before "sound"; didn't ← the same d- start and a weak middle
    // R fix: S4 (2.25 s, under 3 s). Starts after "Hobbies", 3.6 s.
    { id: 's1', skill: 'sound', level: 'B2', point: 'doesnt', seg: [115.9, 119.5],
      stem: 'Fill the gap: “Wait, that ___ fun.”',
      choices: ['does sound', 'doesn’t sound', 'didn’t sound'], a: 1,
      cue: '「Wait, that」のあと、sound の前。',
      line: 'Wait, that *doesn’t sound* fun.',
      said: '「待って、楽しそうに聞こえない」。doesn’t の t が sound に飲まれる。',
      mean: '自分の答えを聞き直して地味だと気づき、このあと言い直す。',
      trap: 'n’t の t は消えても「ン」は残る。その「ン」と、続く言い直しで決める。',
      use: 'Hmm, that doesn’t sound right.（うーん、それ、なんか変じゃない？）' },

    // R fix: S3 (the cue said "Upstairs", a word only the key had) + N7 (p2's old choices and d3's stem gave the bench
    //   and the "not real" away; both now reveal `mural`).
    // why: meadow ← "wildflowers" is said, but in the painting; roof ← "upstairs" heard as up top, outdoors
    { id: 'd2', skill: 'detail', level: 'B1', point: 'mural', seg: [121.3, 127.95],
      stem: 'What does Leslie give as her favorite place?',
      choices: ['A bench by a painting upstairs', 'A meadow full of real wildflowers', 'A garden up on the building’s roof'],
      a: 0,
      cue: '「Favorite place?」のあと、2つの名詞。',
      line: 'Upstairs, there’s this *mural of wildflowers*, and I like to sit on *a bench in front of it*.',
      said: '「上の階に野の花の壁画があって、その前のベンチに座るのが好き」。',
      mean: 'mural ＝ 壁画。本物の自然ではなく、絵の前のベンチがお気に入り。',
      trap: 'wildflowers が聞こえると本物の野原を想像しやすい。mural of で「〜の絵」になる。',
      use: 'There’s this little café I love.（お気に入りの小さなカフェがあるの）' },

    // R fix: V2 (55 % blind: the "famous mural" filler) + N7 (its choices named the bench and the mural, d2's key; it
    //   now reveals `mural`). The new near miss is "Really?" as a hearing check.
    // why: heard right ← "Really?" as a plain check (聞き返し), which it can be; likes it ← "Really?" read as
    //   interested agreement (日本語の「へえ、いいね」)
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'anywhere', reveals: ['mural'], seg: [127.6, 134.55],
      stem: 'When Ann answers with “Really?”, what is she doing?',
      choices: ['Hinting that Leslie could aim higher', 'Checking that she heard the answer right',
                'Showing that she likes the bench idea'], a: 0,
      cue: '「Really?」のあとの地名の並び。',
      line: 'Really? It *could be anywhere in the world*. Paris, Hawaii, the Grand Canyon.',
      said: '「本当に？世界中どこでもいいのに。パリ、ハワイ、グランドキャニオン」。',
      mean: 'Really? は感心ではなく軽い疑問。もっと素敵な場所を、と遠回しに勧める。',
      trap: 'Really? を感心や聞き返しと取りやすい。すぐ別の案を並べたら、やんわりした反対。',
      use: 'Really? You could pick anything.（本当に？何でも選べるのに）' },

    // why: hay fever ← flowers and "Ew" go together; too far ← Paris and the Grand Canyon, just listed, are far away
    // R fix: N7 — the stem's "a real meadow" and the line's "Mural!" give d2's key away; reveals `mural`.
    { id: 'd3', skill: 'detail', level: 'B1', point: 'bees', reveals: ['mural'], seg: [134.5, 139.5],
      stem: 'Why does Leslie say no to a real meadow?',
      choices: ['She’s scared of bees', 'She gets hay fever', 'It’s too far from work'], a: 0,
      cue: '「Ew, Ann」のあと。',
      line: 'Ew, Ann, *I’m scared of bees*. Mural!',
      said: '「やだ、アン、ハチが怖いもん。壁画で！」と即答する。',
      mean: 'scared of ～ ＝ 〜が怖い。本物の野原にはハチがいるので、絵で十分という理屈。',
      trap: '花と「Ew」から花粉症を思い浮かべやすい。理由は I’m のあとにはっきり言っている。',
      use: 'I’m scared of heights.（高い所が怖いの）' },

    // why: never seen ← "no opinion" heard as no experience (or as polite 遠慮); loves them ← the run of "Love" (dogs,
    //   cats, fish) carried over
    // anchor: 146.4–147.2 s “No opinion” after three quick “Love”s and a long pause; 149.5–150.4 s “They're
    //   condescending”, after another ~2 s pause
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'turtles', seg: [139.2, 150.75],
      stem: 'When asked about turtles, what is the first answer holding back?',
      choices: ['That she secretly dislikes them', 'That she has never seen one up close',
                'That she loves them like the others'], a: 0,
      cue: 'ペットへの返事のテンポと、少しあとの一言。',
      line: 'Turtles? — … *No opinion*. … *They’re condescending*.',
      said: '犬、猫、魚には即「大好き」。カメだけ間があって「特になし」、さらに間をおいて「見下してくる」と本音。',
      mean: '「意見なし」は角を立てない言い方。すぐに理由つきの悪口が出るので、本当は嫌いだと分かる。',
      trap: '「特になし」を中立や遠慮と取りやすい。返事のテンポが変わったら、言わずにいることを疑う。',
      use: 'No opinion. Well, okay, I hate it.（特に意見は…いや、正直きらい）', retired: true },

  ]
};
