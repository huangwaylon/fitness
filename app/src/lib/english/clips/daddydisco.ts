// “Don't refer to yourself as our 'Daddy' - The Office US” (the official The Office channel, BEST OF SEASON 5): with
// the strict boss Charles gone, Michael decides the staff are scared and too focused on work, calls himself their
// "Daddy", and opens a "cafe disco" in his downstairs office; Kevin is pulled down there and fought over with
// "come", "stay" and a cookie, and Michael tells the camera he's been made out to be a monster.
// Segments from the captions, words from whisper (2026-11-16). Only Michael, Oscar and Kevin are named, so the others
// are "a staff member" or "the coworker on hold". Untested on purpose: 40–49 s (baby talk: whisper "Widdle Andy",
// "widow angels", captions "Widow Angie", "Widow Angels"), 58 s ("That makes sense", speaker and tone unclear),
// 139–145 s ("respect the lay" / "delay", unclear in both), 156–159 s (whisper "There is no cookie, Kevin", captions
// "Hey Kevin"), 165 s (whisper "Oh, for goodness sakes", captions "thanks Kevin"), 113 s (the name: "Aaron" in both,
// likely Erin). 75.8 s "lunch with you" (whisper) vs "with him" (captions), 79 s "past it" vs "passing" and 135.5 s
// "You were supposed" vs "you're supposed" carry no key. Philip Morris (175 s) is never keyed.
// EAR CHECK: 34.5 s r1 — the cut falls in the ≈ 1 s gap before “am your big Daddy”; the captions put a lone “I”
//   at 33.98 s, before the gap, so check that the cut doesn't let “I” through (harmless if it does)
// EAR CHECK: 159.9 s / 170.4 s i4 — “Is there a cookie?” and “I wanted a cookie” are Kevin's (assumed: he is the one
//   being called; neither source names the speaker)
// EAR CHECK: 94.8 s c3 — “It is a daytime disco on the ground floor of an industrial office building” is said flat
//   and dry (a dig), not as a cheerful summary (the key also stands on the words)
// REVIEW 2026-11-16: pass 3, fix 21, drop 0, new 0; ear checks 3
// OPEN: a cold re-read still got 19/23 choice items at ≥ 50 %. p3 (the proverb, 75 %), h2 and h4 (the pun and the
//   swapped words, 70 %) hold the clever reading as the key; a reader who knows the saying or spots the pun gets them.
import type { Clip } from '../types.ts';

export const daddyDisco: Clip = {
  id: 'daddydisco', video: 'WuQgAwvtVgE', title: 'Don\'t refer to yourself as our \'Daddy\' - The Office US',
  dur: 212, wpm: 133, band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: miss the boss ← "Charles is gone" heard as sad news he's breaking; liked the boss better ← "Daddy's
    //   here" heard as Michael competing with Charles for the staff
    { id: 'g1', skill: 'gist', level: 'B1', point: 'scared', reveals: ['focus', 'charles'], seg: [0, 29.4],
      stem: 'What is Michael trying to do as the scene opens?',
      choices: ['Calm staff he thinks the last boss scared', 'Cheer up staff he thinks miss the last boss',
                'Win back staff who liked the last boss better'], a: 0,
      cue: '最初の数行、「怖がる」話と前の上司の名前。',
      said: '「怖がらなくていい。悪い人はもういない」と言い、皆が仕事ばかりなのは前の上司のせいだと話す。',
      mean: '前の上司が怖かったせいだと考え、安心させようとしている。',
      trap: 'Charles is gone を悲しい知らせと取りやすいが、「悪い人」と呼んでいる。',
      use: 'There’s no reason to be scared.（怖がることはないよ）' },

    // R fix: V2 (blind 50 %): "cut the size of the staff" was weak; now "kept count of every mistake" (number as
    //   counting). Start moved to 5.7 for the 0.5 s lead.
    // why: sales numbers ← "number" taken literally as targets (and "focused on work" follows); kept count ←
    //   "number" heard as counting, a strict boss keeping score
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'charles', reveals: ['scared'], seg: [5.7, 14.3],
      stem: 'What does Michael say Charles did to the staff?',
      choices: ['He left them badly shaken.', 'He gave them tough sales numbers.', 'He kept count of every mistake.'],
      a: 0,
      cue: 'Charles の名前のすぐあとの言い回し。',
      line: 'There’s no reason to be scared… Charles really *did a number on* these guys.',
      said: '「チャールズは本当にこいつらを参らせた」と言う。',
      mean: 'do a number on ～ ＝ ～をひどく痛めつける。数字の話ではない。',
      trap: 'number から「ノルマ」や「人数」を思いやすい。直前の scared と合わせて聞く。',
      use: 'That flight really did a number on me.（あのフライトで本当に参った）' },

    // R fix: V2 (blind 60 %) and S4: "miss their old boss" was weak; now a reversal (too lightly) and a lunch trap.
    //   The start cut "did a number"; now 10.0.
    // why: too lightly ← "having fun, eating naps" is said, but about the old days under him; lunch ← "eating" in the
    //   same breath, and lunch comes up later
    { id: 'd1', skill: 'detail', level: 'B1', point: 'focus', seg: [10.0, 23.6],
      stem: 'What does Michael say is wrong with the staff now?',
      choices: ['They focus too much on work', 'They take their work too lightly', 'They take too long over lunch'],
      a: 0,
      cue: '「When I was in charge」の前の一文。',
      line: 'They are *way too focused on work*.',
      said: '「みんな仕事に集中しすぎ」と言い、自分の時代は遊んで昼寝していたと続ける。',
      mean: 'way too ～ ＝ あまりに～すぎる。普通はほめる点を問題にしている。',
      trap: 'naps が聞こえると「なまけている」を選びやすいが、それは昔の話。時を表す語を追う。',
      use: 'This place is way too quiet.（ここ、静かすぎるよ）' },

    // R fix: V2 (blind 55 %): the key was the only choice tied to the place. Now three readings of who Dave is.
    //   S4: 15.9 s was over the cap; now starts at 15.3, just before "this place was like".
    // why: a coworker ← "Dave" heard as a real person (a coworker has just "gone"); old boss ← "Charles is gone" just
    //   before, so "died" sounds like another boss leaving
    { id: 'h1', skill: 'humor', level: 'C1', point: 'dave', seg: [15.3, 29.4],
      stem: 'Why does “Dave died or something” get a laugh?',
      choices: ['He turns the fun place’s name into a man who died', 'He means a coworker named Dave has really died',
                'He means the fun left when a boss named Dave left'], a: 0,
      cue: '前に出た店の名前と、今の様子のたとえ。',
      line: 'this place was like *Dave and Buster’s*… It’s like… *Dave died* or something.',
      said: '昔は遊べる店みたいだったのに、今は「デイブが死んだ」みたいだと言う。',
      mean: '店名の Dave を本物の人として、その人が亡くなったような暗さだ、とたとえている。',
      trap: '知らない名前は同僚や上司と思いやすい。直前に同じ名前が店名で出ていたら、そこから。',
      use: 'It’s like somebody died in here.（お通夜みたいだね）' },

    // predict: the segment stops after "…as our Daddy"; the reveal plays "I am your big Daddy…"
    // R fix: V2 (blind 70 %): the two scripts were plain "comply" moves. Now a near miss (keeps it, laughs it off)
    //   and a soft swap.
    // why: laughs it off ← the usual way to keep a word without a fight; softer word ← the cooperative script, a boss
    //   taking feedback
    { id: 'r1', skill: 'predict', level: 'B2', point: 'bigdaddy', seg: [29.5, 34.5],
      then: [34.5, 40.1],
      stem: 'After he’s asked to drop the word, what kind of reply does Michael give?',
      choices: ['He keeps the word and goes even further', 'He keeps the word but laughs it off',
                'He swaps in a softer word for it'], a: 0,
      cue: 'マイケルは、ここまで何を目指して話している？',
      line: 'Please don’t refer to yourself as our Daddy. — *I am your big Daddy*…',
      said: 'やめてと言われ、「僕は君たちのビッグ・パパだ。痛いところにキスしてあげる」と返す。',
      mean: '頼みを聞かず、もっと親のようにふるまう。空気の読めなさが笑いになる。',
      trap: '頼まれたら謝る、という型で予想しやすい。この人が何をしたいかから考える。',
      use: 'Too late. I’m already doing it.（もう遅い。もうやってるよ）' },

    // R fix: V2 (blind 60 %): the key was the only pun. Now a second pun (funk = a bad smell) sits next to it.
    // why: smell ← funk also means a stink, a meaning some learners know; near sound ← "funk" heard as a slip for
    //   another word
    { id: 'h2', skill: 'humor', level: 'C1', point: 'funk', seg: [50.8, 59.05],
      stem: 'Why is Michael’s “problem and the solution” line funny?',
      choices: ['One word means both a low mood and dance music', 'One word means both a low mood and a bad smell',
                'He mixes up two words that sound almost the same'], a: 0,
      cue: '前の文の最後の語が、次の文の頭でもう一度。',
      line: 'to get you guys out of your *funk*. — What? — *Funk* is the problem and the solution.',
      said: '「funk から出す方法がある。funk が問題で答えだ」と言う。',
      mean: 'funk は「落ちこみ」とダンス音楽の「ファンク」。落ちこみを音楽で治す言葉遊び。',
      trap: 'funk には「におい」の意味もあるが、解決になるのは音楽。二度目は別の意味では、と疑う。',
      use: 'I’m in a bit of a funk today.（今日はちょっと落ちこんでる）' },

    // R fix: V2 (blind 60 %): "a quiet place to work" was weak; now "meet clients" (meet, greet follow).
    // why: lunches ← "lunch" comes up right after (73 s); clients ← "to meet, to greet" follows, heard as business
    { id: 'd2', skill: 'detail', level: 'B1', point: 'office', seg: [58.6, 67.4],
      stem: 'What has Michael done with his downstairs office?',
      choices: ['Turned it into a place to hang out', 'Turned it into a room for lunches',
                'Turned it into a place to meet clients'], a: 0,
      cue: '「downstairs office」のあとの turned it into。',
      line: 'I’ve taken my downstairs office, and I have turned it into *a place to hang out*',
      said: '「下の階の自分のオフィスを、たまり場に変えた」と言う。',
      mean: 'hang out ＝ 特に目的なく一緒に過ごす。仕事をしない場所を作った。',
      trap: 'あとの meet, greet から客との場を思いやすい。turn A into B は B が新しい姿。',
      use: 'Want to hang out after work?（仕事のあと遊ばない？）' },

    // anchor: 63–74 s the words sit inside a warm invitation ("get together, to meet, to greet… to love the ones that
    //   you see"): he means everyone is welcome, and nobody's looks came up before
    // R fix: V2 (blind 65 %, one rewrite): the key was the only kind reading. Now all three put the joke on Michael
    //   and differ on why; "teasing the plain staff" is the insult reading moved onto him.
    // why: teasing ← right target, wrong reason (an insult he meant); hinting he's unattractive ← right target, wrong
    //   reason (nothing puts him in either group)
    { id: 'c1', skill: 'humor', level: 'C2', point: 'looks', seg: [62.5, 76.4],
      stem: 'In “unattractive and attractive people”, who is the joke on?',
      choices: ['Michael, who thinks naming looks sounds welcoming', 'Michael, who is hinting that he is unattractive',
                'Michael, who is teasing the staff he finds plain'], a: 0,
      cue: 'その語のまわりの、歓迎する言葉の並び。',
      line: 'a place where *unattractive and attractive people* can get together, to meet, to greet…',
      said: '「見た目の悪い人も良い人も集まれる場所」と言い、会って、あいさつして、と歓迎の言葉を重ねる。',
      mean: '本人は「誰でも歓迎」のつもり。わざわざ見た目で人を分けて言うのがずれていて、笑われているのは本人。',
      trap: '失礼な語があると、誰かへの悪口と取りやすい。まわりが歓迎の言葉なら、ずれているのは話し手。',
      use: 'Everyone’s welcome, no matter what.（どんな人でも大歓迎）' },

    // R fix: V2 (blind 50 %) and S4: "a reward" was weak; now "a way to get them to lunch with him". Bounds moved
    //   off "that you" and "all work" (73.25–79.45).
    // why: make up for lunch ← "lunch" heard as the plan's purpose; lunch with him ← "not wanting to have lunch with"
    //   heard as what the space is for
    { id: 'i2', skill: 'infer', level: 'B2', point: 'lunch', seg: [73.25, 79.45],
      stem: 'What does Oscar suspect the new space is?',
      choices: ['A way to get back at them over lunch', 'A way to make up for the lunch they skipped',
                'A way to get them to have lunch with him'], a: 0,
      cue: '質問の最初の名詞。良いものか悪いものか。',
      line: 'Is this our *punishment* for not wanting to have *lunch* with…',
      said: '「ランチを断った罰なの？」と聞き、マイケルは「もう忘れろ」と返す。',
      mean: 'punishment ＝ 罰。新しい場所は、断ったことへの仕返しではと疑っている。',
      trap: 'lunch が聞こえると埋め合わせと取りやすい。最初の名詞が良い意味か悪い意味かを聞く。',
      use: 'Is this payback for last week?（先週の仕返し？）' },

    // R fix: V2 (blind 50 %): "Why didn't you" didn't fit and left the idiom as the pick. Now three natural
    //   complaints; the end moved off "all work" (79.45).
    // why: can't ← "don't" heard as "can't" (both short and weak), and "Why can't you get over it" is a common
    //   complaint; won't ← "don't" and "won't" share the vowel
    { id: 's1', skill: 'sound', level: 'B2', point: 'getover', reveals: ['lunch'], seg: [76.0, 79.45],
      stem: 'Fill the gap: “___ get over lunch, Oscar?”',
      choices: ['Why can’t you', 'Why don’t you', 'Why won’t you'], a: 1,
      cue: '文の最初、とても速い3語。',
      line: '*Why don’t you* get over lunch, Oscar?',
      said: '「ランチのことはもう忘れたら？」と言う。',
      mean: 'Why don’t you が「ワイドンチャ」のように一続き。t が消えて you とつながる。',
      trap: 'can’t も won’t も短く弱いと似て聞こえる。母音「オウ」なら don’t か won’t。',
      use: 'Why don’t you take a break?（ちょっと休んだら？）' },

    // R fix: V2 (blind 75 %) and S2: the stem quoted the proverb, so its known moral answered it. The stem now names
    //   the moment, and the choices are three "Without…, … dull" morals.
    // why: reversed ← "work" and "play" both heard but the order flipped; company ← the space is a place to hang out
    //   together, so "dull" seems to be about being alone
    { id: 'p3', skill: 'phrase', level: 'C1', point: 'dullboy', seg: [79.5, 83.3],
      stem: 'After the lunch exchange, what is Michael’s saying telling the staff?',
      choices: ['Without some fun, work makes you dull', 'Without some work, fun soon gets dull',
                'Without company, any job gets dull'], a: 0,
      cue: '前半の二つの語の対比。',
      line: '*All work and no play* makes Michael a dull boy.',
      said: '「仕事ばかりで遊ばないとマイケルはつまらない子になる」と言う。',
      mean: 'もとは Jack が入ることわざ。名前を入れかえて、遊びも必要だと言っている。',
      trap: 'work と play の両方が聞こえるので、向きを逆に取りやすい。no がどちらに付くかを聞く。',
      use: 'All work and no play, right?（仕事ばかりじゃだめだよね）' },

    // why: coffee bar ← "coffeehouse" is the first label said, and coffee stays; haunted disco ← "haunted disco" is
    //   said too, before Michael's correction
    { id: 'd3', skill: 'detail', level: 'B2', point: 'disco', seg: [83.2, 95.3],
      stem: 'Once Michael corrects them, what kind of place is it?',
      choices: ['A disco that serves coffee, nothing spooky', 'A coffee bar with music, nothing spooky',
                'A haunted disco that also serves coffee'], a: 0,
      cue: '「haunted」が二度出たあとの、マイケルの直し方。',
      line: 'it’s more of a *disco*… — With *coffee*, but *without the haunting*.',
      said: '「どちらかというとディスコ」「コーヒーはあるけど、お化けはなし」と直す。',
      mean: 'haunted ＝ お化けが出る。二度直して、コーヒーのあるディスコだと言う。',
      trap: '先に聞いた haunted が残りやすい。without のあとは「ないもの」として聞く。',
      use: 'With milk, but without the sugar.（ミルクは入れて、砂糖はなしで）' },

    // anchor: 92.6–100.1 s after three playful labels ("haunted disco", "combo dance house coffee bar"), the speaker
    //   lists only the facts that clash with "disco": "daytime", "ground floor", "industrial office building"
    // why: a real club ← the literal reading (it is open in the daytime); fits the building ← a sincerity flip, the
    //   description heard as approval
    { id: 'c3', skill: 'infer', level: 'C2', point: 'cafedisco', seg: [88.6, 100.3],
      stem: 'Which plain-English version keeps what the “daytime disco” speaker means?',
      choices: ['“So: a disco, in the one place no disco belongs.”', '“So: a real disco, but open during work hours.”',
                '“So: a fun spot that fits our building well.”'], a: 0,
      cue: '楽しい呼び名のあと、事実だけを並べる言い方。',
      line: 'It is a *daytime disco* on the ground floor of an *industrial office building*.',
      said: '楽しげな呼び名が続いたあと、一人が「工業用オフィスビルの1階にある、昼間のディスコ」と言う。',
      mean: 'ディスコに合わない事実だけを並べ、どれだけ変かを示す皮肉。説明に見えて、実は「おかしいでしょ」。',
      trap: '言葉どおりなら単なる説明に聞こえる。冷めた事実の列挙は、ほめずに笑う言い方と疑う。',
      use: 'So, a beach party. In January.（つまり、ビーチパーティー。1月に）' },

    // R fix: V2 (blind 60 %): the two distractors were not about the name. Now all three say what the rejected name
    //   is, two of them recalling the earlier labels.
    // why: haunted ← "haunted" was said twice just before; coffeehouse ← the first label, and "cafe" sounds like it
    { id: 'h4', skill: 'humor', level: 'C1', point: 'cafedisco', seg: [99.8, 107.4],
      stem: 'Why does “not even close” get a laugh?',
      choices: ['The rejected name has the same words, just swapped', 'The rejected name brings back the haunted idea',
                'The rejected name is the coffeehouse idea again'], a: 0,
      cue: '直前の二つの呼び名を比べて。',
      line: 'It’s a *cafe disco*. — Exactly. — So like a *disco cafe*. — What? No, no, *not even close*.',
      said: '「カフェ・ディスコ」には「その通り」、「ディスコ・カフェ」には「全然違う」と返す。',
      mean: '同じ二語の順番を入れかえただけなのに、片方を完全に否定する。',
      trap: '前の haunted や coffeehouse を思い出しやすい。直前の二つの言い方を比べる。',
      use: 'Not even close. Try again.（全然違う。もう一回）' },

    // R fix: V2 (blind 50 %) and V5: "leave it up to them" was weak; now "beg them". entice is not a B1 word: B2.
    // why: ask nicely ← "entice" guessed as a polite invitation; beg ← "can't force you" heard as him having no
    //   power, so he pleads
    { id: 'p4', skill: 'phrase', level: 'B2', point: 'entice', reveals: ['force'], seg: [107.2, 111.2],
      stem: 'What does Michael say he’ll do instead of making them go?',
      choices: ['Tempt them with things they like', 'Ask each of them nicely to come', 'Beg them to give it a try'],
      a: 0,
      cue: 'but のあとの動詞。',
      line: 'I can’t force you to go down, but I can *entice* you.',
      said: '「無理に行かせることはできないが、誘い出すことはできる」と言う。',
      mean: 'entice ＝ 魅力的なもので誘う。命令ではなく、行きたくさせる作戦。',
      trap: 'can’t の t は消えやすく、can と聞こえると逆の意味になる。but のあとに本題が来る。',
      use: 'Free cake might entice them.（無料のケーキでつれるかも）' },

    // R fix: schema (repo test): the answer had a curly apostrophe; the test wants [a-z'] only.
    { id: 'x1', skill: 'dict', level: 'B1', point: 'force', reveals: ['entice'], seg: [107.2, 111.2],
      stem: 'Type what Michael says: “I ___ to go down…” (3 words)', answer: 'can\'t force you',
      cue: '文の頭、I のすぐあとの3語。',
      line: 'I *can’t force you* to go down, but I can entice you.',
      said: '「行かせることはできない、でも誘うことはできる」と言う。',
      mean: 'can’t と後半の can が対になっている。前半が否定、後半が肯定。',
      trap: 'can’t の t は消えやすいが、母音が長く強め。後ろの but I can との対比で決める。',
      use: 'I can’t make you, but please try.（無理にとは言わないけど、試してみて）' },

    // anchor: 110.2–112.9 s right after "I can entice you", the first lure he names is "I'm going to be down there",
    //   before the coworker "from time to time" and the espresso
    // R fix: V2 (blind 65 %, one rewrite): "feel safe" was far off. Now a near miss: his presence as permission to
    //   skip work, which "entice" (a list of attractions) rules out.
    // why: permission ← a boss in the room makes slacking off allowed, a real office logic; won't go unless watched
    //   ← "be down there" heard as a boss checking on them
    { id: 'c2', skill: 'infer', level: 'C2', point: 'entice', reveals: ['lunch'], seg: [107.2, 117.8],
      stem: 'What does Michael’s first selling point show he assumes?',
      choices: ['That they will see his being there as a plus', 'That his being there makes skipping work okay',
                'That they won’t go unless he is watching'], a: 0,
      cue: '「entice」のすぐあと、最初に挙げるもの。',
      line: 'I can *entice* you. *I’m going to be down there.* … will be down there from time to time…',
      said: '「誘い出せる」と言い、最初に「僕が下にいる」、次に同僚、エスプレッソを挙げる。',
      mean: '誘う材料の一番目が自分。自分がいればうれしいはず、と思っている。ランチを断られたばかりなのに。',
      trap: '上司がいる＝見張りや安心と取りやすい。entice の直後は「魅力」の一覧。何の一覧かを先に聞く。',
      use: 'And best of all, I’ll be there!（何より、僕が来るよ）' },

    // R fix: V2 (blind 55 %): "everyone joins in" was easy to rule out. Now a near miss: Kevin comes and Michael
    //   ends up proud ("This place is great" / "Thank you"), which the last line refutes.
    // why: nobody comes ← "just me and you" heard as the end state; proud ← "This place is great" / "Thank you"
    //   heard as the outcome
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['monster'], seg: [123.0, 192.2],
      stem: 'How do things turn out for Michael’s new space?',
      choices: ['It draws Kevin in, and Michael ends up blamed', 'It draws nobody in, and Michael ends up hurt',
                'It draws Kevin in, and Michael ends up proud'], a: 0,
      cue: '下の階に残る人と、最後のカメラへの一言。',
      said: 'ケビンも下へ行き、上の同僚と取り合いになる。マイケルは最後に悪者あつかいだと嘆く。',
      mean: '作戦は一人には効いたが、仕事のじゃまとして責められる結果になった。',
      trap: '最後の暗い一言から「失敗」と取りやすいが、人は来ている。',
      use: 'It worked a little too well.（効きすぎちゃった）' },

    // R fix: V2 (blind 55 %): "embarrassed" was weak; now "relieved to find Kevin" (Oh my God as relief). The key
    //   says "Annoyed" now, since "Fed up" put "up" next to the cue's "supposed".
    // why: worried ← "Oh, my God, Kevin" heard as alarm about him; relieved ← the same words heard as finally
    //   finding him
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'onhold', seg: [132.0, 138.4],
      stem: 'How does the coworker on hold sound when he speaks to Kevin?',
      choices: ['Annoyed that Kevin left him waiting', 'Worried that Kevin is in some trouble',
                'Relieved to have found Kevin at last'], a: 0,
      cue: '名前を呼ぶ前の一言と、supposed to の言い方。',
      line: 'Oh, my God, Kevin. I am *still on hold*. You were *supposed to*…',
      said: '「ケビン、まだ保留中だぞ。戻るはずだったろ」と言う。',
      mean: 'still と supposed to で、待たされたいら立ちをケビンにぶつける。',
      trap: 'Oh my God は心配にも聞こえる。still や supposed to が続けば、責める言い方。',
      use: 'I’m still waiting, you know.（まだ待ってるんだけど）' },

    // R fix: V5: the key is said outright ("get the answer from Michael"), so B1 (this also keeps B1 ≥ 20 %).
    // why: pick up the call ← "still on hold" heard as a call for Michael; tell Michael they're busy ← "on hold"
    //   heard as a message to pass on
    { id: 'd5', skill: 'detail', level: 'B1', point: 'answer', seg: [132.5, 138.4],
      stem: 'Why did Kevin go downstairs, according to the coworker on hold?',
      choices: ['To get an answer from Michael', 'To ask Michael to pick up the call', 'To tell Michael they were busy'],
      a: 0,
      cue: '「still on hold」のあと、supposed to の中身。',
      line: '…supposed to *get the answer from Michael and come back up*.',
      said: '「マイケルに答えをもらって戻るはずだったろ」と言う。',
      mean: 'be supposed to ～ ＝ ～するはずだった。用事で下りたのに戻らない。',
      trap: 'on hold から「伝言」を思いやすいが、取りに行ったのは答え。supposed to の後ろを聞く。',
      use: 'You were supposed to call me back.（折り返すはずだったでしょ）' },

    // R fix: V2 (blind 55 %): "apologizes" echoed "Sorry" and was easy to rule out; now an excuse (a short break).
    // why: invite the caller ← the reply comes from the fun place, so it sounds welcoming; short break ← "Sorry" and
    //   then a reason, the usual excuse script
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'nowork', reveals: ['onhold'], seg: [136.5, 142.0],
      stem: 'When Kevin is told off for not coming back, what does the reply do?',
      choices: ['Shuts out work talk in the new space', 'Invites the caller to come down too',
                'Explains that Kevin is on a short break'], a: 0,
      cue: '「Sorry」のあとの、場所のルール。',
      line: 'Sorry. — This is a *no-work zone*.',
      said: '「すみません」のあと、「ここは仕事禁止ゾーンだ」と言う。',
      mean: 'no-work zone ＝ 仕事をしない場所。戻れという話をルールではねつける。',
      trap: '楽しい場所からの返事は誘いに聞こえやすい。zone の前の語が何を禁じるかを聞く。',
      use: 'This is a phone-free zone.（ここはスマホ禁止です）' },

    // R fix: V2 (blind 60 %): "call Kevin back and forth" in the stem pointed at the dog reading. The stem now names
    //   the moment only.
    // why: new worker ← one-word orders heard as a boss's commands; word game ← short words bounced back and forth
    //   sound like a game
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'dog', seg: [145.3, 156.4],
      stem: 'What is going on in the quick back-and-forth over Kevin?',
      choices: ['Calling him the way you’d call a dog', 'Giving him orders like a new worker',
                'Playing a quick word game with him'], a: 0,
      cue: '一語の命令と、ごほうびの言葉。',
      line: 'Kevin, *stay*. — Kevin, *come*. … *Cookie*, Kevin, cookie.',
      said: '上と下から「おいで」「待て」と呼び合い、最後は「クッキーだよ」と呼ぶ。',
      mean: 'come / stay とごほうびのクッキーは、犬のしつけの言葉。ケビンを犬のように取り合う。',
      trap: '短い語のくり返しはゲームに聞こえやすい。ごほうびが出たら、しつけの場面。',
      use: 'Come on, there’s pizza in it for you.（来なよ、ピザがあるよ）' },

    // R fix: V2 (blind 65 %): only the key had the cookie. Now all three do.
    // why: knew all along ← "There's no cookie" heard as what he'd guessed; felt bad ← the Japanese frame: a quiet
    //   line after a fight heard as an apology
    { id: 'i4', skill: 'infer', level: 'C1', point: 'cookie', seg: [159.5, 172.1],
      stem: 'What does Kevin’s last line show about him?',
      choices: ['The cookie mattered more than who won', 'He knew all along there was no cookie',
                'He felt bad that a cookie caused a fight'], a: 0,
      cue: '「cookie」をめぐるやりとりの最後の一言。',
      line: 'Is there a cookie? — Mm-hmm. … There’s no cookie. … *I wanted a cookie.*',
      said: '「クッキーあるの？」と聞き、ないと分かると「クッキー欲しかったのに」と言う。',
      mean: '上か下かの取り合いより、クッキーのことしか考えていない。そこが笑いになる。',
      trap: '静かな一言は反省やあきらめに聞こえやすい。wanted は「欲しかった」。目的語を聞く。',
      use: 'I was told there would be snacks.（おやつがあるって聞いたのに）' },

    // R fix: V2 (blind 70 %) and S4: "proud" was easy to rule out; now "unsure the idea was good" (doubt). The start
    //   cut "Now" and 17.8 s was over the cap; now 175.45–190.4.
    // why: guilty ← he does compare himself to someone blamed; unsure ← "suddenly you're…" heard as second thoughts
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'monster', seg: [175.45, 190.4],
      stem: 'How does Michael feel about how his idea is being seen?',
      choices: ['Hurt to be painted as the bad guy', 'Guilty about pulling staff from work',
                'Unsure whether the idea was a good one'], a: 0,
      cue: 'suddenly のあと、自分が何に見られているか。',
      line: 'You just want to give people a smooth, fun way to relax, and *suddenly you’re just some terrible monster*.',
      said: '「楽しくくつろげる場を作っただけなのに、急に怪物あつかいだ」とカメラに言う。',
      mean: '善意なのに悪者にされた、という不満。会社名はたばこ会社だが、知らなくても解ける。',
      trap: '反省と取りやすいが、just と suddenly は「不当だ」のしるし。',
      use: 'I help, and suddenly I’m the villain.（助けたのに急に悪者だよ）' },
  ]
};
