// “Parks Department Makeover | Parks and Recreation” (the official Parks and Recreation channel, Season 4): Chris asks
// Tom to redesign the logo, which comes down to picking a font; Tom ranks Jerry his “number three” on a team of two,
// pitches a whole-department makeover instead, sulks that he's become Jerry, and then spots Jerry's 1970s ID card and
// turns the old logo into a nostalgia campaign that Chris loves.
// Segments from the captions, words from whisper (2026-11-16). Untested: 19.7–21.9 s (who says “that's too close”:
// Tom or Chris), 47 s (captions “I never in more bored”, whisper “I've never been more bored”: a1 keys only on
// “bored”, in both), 49.7 s (captions “who cares about later”, whisper “letters”), 79.7 s (Steve Harvey: world
// knowledge), 91–93 s (“not gonna forget about it” as a Sopranos accent joke: world knowledge), 101–108 s (the
// “wrinkly old housewife” simile), 132 s (captions “we're a miserable life”, whisper “Or a miserable life”: h4 keys
// on “boring house… beautiful daughters… miserable life”, in both), 169 s (captions “the one they had grown up”,
// whisper “the fun they had growing up”), 187–190 s (who says “Thanks, buddy”).
// REVIEW 2026-11-16: pass 3, fix 21, drop 0, new 0; ear checks 1
// REVIEW: the author's ear check at 180.4 s (whisper “my number four, Jerry”, captions “my number for Jerry”) is
//   removed: “four” and “for” sound the same, so an ear can't settle it, and only “four” makes sense there.
// EAR CHECK: 90.6 s s1 — both sources have “is not gonna forget”; s1's key needs the uncontracted “is not” (two beats)
//   rather than “isn't”. If it sounds like “isn't”, drop s1.
import type { Clip } from '../types.ts';

export const parksMakeover: Clip = {
  id: 'parksmakeov', video: 'MV63ujc7pQ4', title: 'Parks Department Makeover', dur: 210, wpm: 162, band: 'mid',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 — blind 60 %: "actually" in the stem signalled a let-down answer, and the ad campaign was a weak
    //   filler; the slogan distractor now builds on "take these words"
    // why: whole department ← the title's "makeover" and Tom's later pitch; slogan ← "take these words and make
    //   something amazing" heard as writing copy
    { id: 'g1', skill: 'gist', level: 'B2', point: 'font', seg: [0, 30.2],
      stem: 'What does Chris want Tom to do?',
      choices: ['Pick a new font for the parks logo', 'Give the parks a whole new look', 'Write a new slogan for the parks'],
      a: 0,
      cue: '大きな言葉のあと、Tom が言いかえて確かめる部分。',
      line: 'So you’re saying you want me to *choose a new font*? — Yes, *essentially*.',
      said: 'ロゴの作り直しを頼まれ、「つまり書体を選べってこと？」と聞くと「要するにそう」と返る。',
      mean: '立派な言い方でも、中身は書体選び一つ。',
      trap: 'rethink our visual brand から大きな仕事を想像しやすい。言いかえの確認が中身。',
      use: 'So basically, you want me to…?（要するに、私に〜してほしいと？）' },

    // R fix: V2/K6 — blind 70 %: the key was the only real joke mechanism ("not a single word" was an absolute filler)
    // why: gets it wrong ← "you're saying…?" heard as a misreading that Chris must correct (he says "Yes, essentially");
    //   dodging ← the question heard as playing dumb to get out of work
    { id: 'h1', skill: 'humor', level: 'C1', point: 'font', seg: [9.0, 15.8],
      stem: 'Why is Tom’s question about the assignment funny?',
      choices: ['He boils the big speech down to one small job', 'He gets the job wrong, and Chris has to correct him',
                'He plays dumb so he can get out of the work'], a: 0,
      cue: '前の大げさな言葉と、Tom の短い言いかえの差。',
      line: 'take these words and make *something amazing*. — So you’re saying you want me to *choose a new font*?',
      said: '「この言葉で何かすごいものを」と言われ、「つまり新しい書体を選ぶ？」と聞き返す。',
      mean: '大げさな頼み方を、一言で小さな作業に言いかえた。その落差が笑い。',
      trap: '聞き返しにも聞こえるが、Chris は Yes と認める。返事で確かめる。',
      use: 'So you want me to pick a color?（つまり色を選べってこと？）' },

    // why: two ← the first rank said; four ← a rank said much later in the clip
    { id: 'n1', skill: 'number', level: 'B1', point: 'rank', seg: [15.0, 24.6], keep: true,
      stem: 'By the end of the talk about ranks, what number is Jerry?',
      choices: ['Number two', 'Number three', 'Number four'], a: 1,
      cue: '「Jerry, you’re」のあとの数。',
      line: 'Fair enough. Jerry, *you’re number three*.',
      said: '最初は「ナンバー2」、すぐ「近すぎる」と下げて「ナンバー3」にする。',
      mean: 'number two ＝ 右腕。それを一つ下げて、Jerry との距離を取る。',
      trap: '最初に聞こえる two が残りやすい。決まった数は、最後の you’re のあと。',
      use: 'You’re my number two on this.（この件では君が右腕だ）' },

    // R fix: K1 — "he fixes their counting" is also what Jerry does, so a fluent listener could defend it; now a
    //   staffing complaint, which the order of the lines refutes
    // why: happy ← a calm reply heard as accepting the rank; team too small ← "only two of us" heard as a complaint
    //   about staff
    { id: 'h2', skill: 'humor', level: 'C1', point: 'rank', seg: [19.4, 24.6],
      stem: 'Why does Jerry’s reply to his new rank get a laugh?',
      choices: ['Tom ranks him third on a team of only two', 'He’s glad to be third, which shows he aims low',
                'He thinks two people are too few for the job'], a: 0,
      cue: '順位のあとの短い返事。何人いるか。',
      line: 'Jerry, you’re number three. — *There’s only two of us.*',
      said: '「ナンバー3」と言われ、Jerry が「二人しかいないけど」と返す。',
      mean: '二人のチームで三番は、ただ下に置くための順位。Jerry の扱いの軽さが笑い。',
      trap: '人手が足りない不満に聞こえるが、順位を言われた直後の返事。何への返事かで決める。',
      use: 'Wait, there are only two of us.（待って、二人しかいないよ）' },

    // R fix: V2 — blind 65 %: "kids scream for" was absurd, leaving the key as the only sensible reading
    // why: too loud ← "screams" as a fault (garish); for kids ← "Comic" plus "fun" heard as a font made for children
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'screams', seg: [37.4, 42.8],
      stem: 'What does Jerry mean about Comic Sans?',
      choices: ['It looks fun the moment you see it', 'It looks too loud to be easy to read',
                'It was made for fun signs, like for kids'], a: 0,
      cue: '「Comic Sans always」のあとの動詞。',
      line: 'I think that Comic Sans always *screams fun*, right?',
      said: '「Comic Sans はいつも楽しさ全開だよね」と言う。',
      mean: 'X screams Y ＝ 見るからに Y だ。悪口ではなく、印象が強いという意味。',
      trap: 'scream を「叫ぶ・うるさい」と取りやすい。後ろの語が、その印象の中身。',
      use: 'That jacket screams tourist.（その上着、いかにも観光客だね）' },

    // R fix: V2 — blind 65 %: two fillers; "keen" now builds on Tom's own favorite font (the Sopranos one)
    // why: impressed ← Jerry talks with real knowledge; keen ← "The only good font is the Sopranos one" shows he has a
    //   favorite
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'bored', seg: [42.5, 53.7],
      stem: 'While Jerry talks about fonts, how does Tom feel?',
      choices: ['Bored stiff by all the font talk', 'Keen, as he has a favorite font too', 'Impressed by how much Jerry knows'], a: 0,
      cue: 'Helvetica の話のあと、カメラへの一言。',
      line: 'I’ve never been more *bored* in my entire life.',
      said: 'Helvetica の R を熱く語る Jerry の横で、「人生でいちばん退屈」と言う。',
      mean: 'never been more 〜 ＝ これ以上〜だったことはない。',
      trap: '好きな書体を挙げるので乗り気に聞こえるが、Who cares＝どうでもいい。',
      use: 'I’ve never been more tired in my life.（人生でいちばん疲れた）' },

    // why: building ← "top-to-bottom" taken as floors; managers ← "top" heard as the people in charge
    // R fix: V2 — blind 60 %: the key was the only general choice; all three are now concrete
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'makeover', seg: [53.3, 58.85],
      stem: 'What does Tom propose instead?',
      choices: ['A new look for the whole department', 'A fresh coat of paint, roof to floor',
                'A new team, from the boss on down'], a: 0,
      cue: '「Let’s think bigger」のあと、What about に続く語。',
      line: 'What about a *top-to-bottom makeover* for the entire department?',
      said: '「もっと大きく考えよう。部全体を上から下まで変えるのは？」と言う。',
      mean: 'top-to-bottom ＝ 全部、すみずみまで。makeover ＝ 見た目の大改造。',
      trap: 'top と bottom を建物の上下と取りやすい。ここは範囲の「全部」を表す。',
      use: 'The kitchen needs a top-to-bottom cleaning.（台所は全部掃除しないと）' },

    // why: doesn't know ← "I don't know" taken as 分からない; check with Chris ← "Chris" is named
    // R fix: K6 — the key was the only hedged choice ("Softly"); every choice now has a manner word
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'pushback', reveals: ['stick'], seg: [63.75, 68.45],
      stem: 'When Tom’s big plan is laid out, what is Jerry doing?',
      choices: ['Softly pushing back on the plan', 'Politely saying he’s lost in the plan', 'Gently asking to check with Chris first'],
      a: 0,
      cue: '最初の三語と、Chris の名前のあとの提案。',
      line: '*I don’t know*. This really *isn’t what Chris asked* us to do.',
      said: '「どうかな。Chris に頼まれたことと違うし、課題どおりにやろう」と言う。',
      mean: '文頭の I don’t know は、反対をやわらげる前置き。',
      trap: '日本語の「分からない」と取ると、理解できない話に聞こえる。続く isn’t が本音。',
      use: 'I don’t know, it seems kind of risky.（どうかな、ちょっと危なそう）' },

    // R fix: S4 — the end (69.3 s) fell inside "Jerry" (69.06 s); now ends after "Cool"
    { id: 'x1', skill: 'dict', level: 'B1', point: 'stick', seg: [66.5, 69.05],
      stem: 'Type what Jerry says: “Maybe we should just ___.” (4 words)', answer: 'stick to the assignment',
      cue: '「should just」のあと。',
      line: 'Maybe we should just *stick to the assignment*.',
      said: '「課題どおりにやったほうがいいよ」と言う。',
      mean: 'stick to ＝ 決まったことから外れない。to the は弱く「タザ」とつながる。',
      trap: 'stick の k と to がつながり、to が消えたように聞こえる。前置詞を一つ入れて確かめる。',
      use: 'Let’s stick to the plan.（計画どおりにいこう）' },

    // R fix: V2 — blind 50 %: the thank-you filler; both distractors now take "I'd take your advice" partly at face
    //   value. S4: the start (68.3 s) cut "assignment"
    // why: if Chris agreed ← "I'd take your advice if…" heard with the condition lost; takes it ← sarcasm heard as
    //   friendly teasing before giving in
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'cool', seg: [68.5, 72.65],
      stem: 'How does Tom answer Jerry’s suggestion?',
      choices: ['He waves it off with an insult', 'He says he’d take it, if Chris agreed',
                'He takes it, but makes a joke first'], a: 0,
      cue: '「Cool, Jerry」のあと、if で始まる条件。',
      line: 'Cool, Jerry. … if I wanted to be a *dead-eyed government drone with no ambition*.',
      said: '「いいね。死んだ目の野心ゼロの役人になりたいなら、聞くよ」と返す。',
      mean: 'Cool はほめていない。if 以下で「そうなる気はない」と退ける。',
      trap: 'I’d take your advice だけ聞くと受け入れに聞こえる。if のあとの条件で本音が分かる。',
      use: 'Cool. Thanks for nothing.（あっそう、どうも）' },

    // why: I take ← "I'd" shrinks to a bare "aɪ", the d lost before t; I'll ← a dark l is easy to imagine there
    // R fix: V2/K5 — blind 90 %: "if I wanted" in the stem let grammar pick "I'd"; the stem now stops before it, so
    //   all three fit and the learner needs the audio. S4: the start (68.9 s) fell inside "Cool"
    { id: 's2', skill: 'sound', level: 'B2', point: 'itake', seg: [68.5, 72.65],
      stem: 'Fill the gap: “Cool, Jerry. ___ your advice…”',
      choices: ['I’d take', 'I take', 'I’ll take'], a: 0,
      cue: '「Jerry」のすぐあと、take の前の小さな音。',
      line: 'Cool, Jerry. *I’d take* your advice if I wanted to be…',
      said: '「〜になりたいなら、君の意見を聞くけどね」と言う。',
      mean: 'if I wanted と組む仮定の形なので I’d。d は次の t に飲まれ、ほぼ聞こえない。',
      trap: 'd が消えて I take に聞こえやすい。後ろに if＋過去形が来たら would を疑う。',
      use: 'I’d go if I had time.（時間があれば行くんだけど）' },

    // R fix: V2/K5 — blind 50 %: the key was the only negative, nuanced choice; now three parallel job + feeling pairs
    // why: promoted ← "my new job" heard alone, and "I dream big" as pride; two jobs ← "new job… old job" heard as two
    //   jobs at once
    { id: 'i2', skill: 'infer', level: 'C1', point: 'oldjob', seg: [72.6, 78.95],
      stem: 'In his talk to the camera, what does Tom admit, and how?',
      choices: ['He’s back in his old job, and it bugs him', 'He has moved up a job, and it thrills him',
                'He has taken on two jobs, and it tires him'], a: 0,
      cue: '最初の Yes と Technically、そのあとの But。',
      line: '*Yes. Technically, my new job is my old job.* But I’m not some boring…',
      said: '「そう。厳密には、新しい仕事は前の仕事だ。でも退屈なやつとは違う」と話す。',
      mean: '聞かれる前に Yes と認め、Technically でぼかす。元の職に戻ったのが気になる。',
      trap: 'new job だけなら昇進に聞こえる。最後まで聞く。',
      use: 'Technically, I’m still an intern.（厳密には、まだインターンです）' },

    // R fix: V2 — blind 85 %: "is gonna forget" made no sense in a sales pitch, so common sense picked the key; the
    //   choices now differ only in the form of the negative (both sources: "is not gonna"). The old cue said "is"
    // why: isn't ← the contraction learners expect in speech; never ← a strong pitch word, and "not" and "nev-" both
    //   start with n
    { id: 's1', skill: 'sound', level: 'B2', point: 'forget', seg: [88.6, 94.4],
      stem: 'Fill the gap: “anyone that sees this logo ___ about it.”',
      choices: ['is not gonna forget', 'isn’t gonna forget', 'is never gonna forget'], a: 0,
      cue: '「this logo」のあと、gonna の前の拍の数。',
      line: 'anyone that sees this logo *is not gonna forget* about it.',
      said: '「このロゴを見た人は、絶対に忘れない」と売りこむ。',
      mean: 'is と not を縮めずに言い、not を立てて「絶対に」と強める。is not gonna で四拍。',
      trap: '会話は isn’t と縮むと思いこむと拍を数えない。縮めない否定は強調のサイン。',
      use: 'Trust me, you’re not gonna regret it.（大丈夫、後悔しないよ）' },

    // R fix: V2 — blind 70 %: the key was the only vague choice next to two specific fillers; coffee is the classic
    //   pick-me-up, refuted by "ham and cheese"
    // why: a ride ← "pick me up" = 迎えに行く; coffee ← the usual pick-me-up, but he names a ham and cheese sandwich
    { id: 'f6', skill: 'phrase', level: 'B1', point: 'pickmeup', seg: [109.4, 116.5],
      stem: 'What has Jerry brought Tom?',
      choices: ['A snack to lift his mood', 'A coffee to keep him awake', 'A ride home after work'], a: 0,
      cue: '「Got you a little」のあとの語と、最後の一文。',
      line: 'Got you a little *pick-me-up*, Tommy. … Always makes me *feel better*.',
      said: '「元気の出るものを持ってきた。三段のハムチーズサンド。いつも元気になる」と言う。',
      mean: 'pick-me-up ＝ 元気づけになるもの。食べ物や飲み物によく使う。',
      trap: 'pick me up は「迎えに来て」でよく聞くので、送り迎えを思いやすい。',
      use: 'I need a little pick-me-up.（ちょっと元気出るもの欲しい）' },

    // R fix: V2 — blind 50 %: the face-value choice now echoes "sounds terrific". S4: the end (120.5 s) cut
    //   "terrific"; it now runs through "I guess I'm Jerry now". B1: the stem names the sandwich (f6's key)
    // why: pleased ← "terrific" read at face value; teasing ← a gentle joke between friends
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'terrific', reveals: ['pickmeup'], seg: [116.3, 121.65],
      stem: 'How does Tom take the sandwich?',
      choices: ['As a sign of how low he has sunk', 'As a kind treat that sounds great to him',
                'As a friendly joke he plays along with'], a: 0,
      cue: '最後の二語の前に、同じ形容詞が二回。',
      line: 'Two *pathetic* guys eating *pathetic* sandwiches. *Sounds terrific.* I guess I’m Jerry now.',
      said: '「みじめな男二人が、みじめなサンドイッチを食べる。最高だね」と言う。',
      mean: 'pathetic を二回言ったあとの terrific は皮肉。自分も Jerry の側に落ちた、と嘆いている。',
      trap: '前に悪い言葉が並んだら、最後のほめ言葉は逆の意味。',
      use: 'Rain all weekend. Sounds great.（週末ずっと雨。最高だね）' },

    // R fix: V2 — blind 70 %: "making fun of the daughters" was a filler; now the mirror reading (wrong direction)
    // why: envies ← the warm list heard as a wish; lovely-sounds-sad ← "boring" and "miserable" missed, so the list
    //   sounds praised and the laugh sad
    { id: 'h4', skill: 'humor', level: 'C1', point: 'miserable', seg: [120.4, 132.9],
      stem: 'Why is Tom’s picture of life as Jerry funny?',
      choices: ['The life he calls miserable sounds lovely', 'The life he calls lovely sounds miserable',
                'He admits that he would love Jerry’s life'], a: 0,
      cue: '並べる中身と、最後のまとめの一言。',
      line: 'straight to my *boring house*, kiss my wife… my *three beautiful daughters*. … a *miserable life*.',
      said: '「退屈な家に帰り、妻にキスして、三人の美しい娘と手料理。みじめな人生」と言う。',
      mean: '本人は不幸のつもりで並べるが、中身は幸せな家庭そのもの。',
      trap: 'beautiful が耳に残ると、ほめているように聞こえる。最初と最後の評価の語を聞く。',
      use: 'Home by six, dinner with family. Tragic.（6時に帰宅、家族と夕食。悲劇だね）' },

    // why: 13 ← thirty/thirteen near sound; 40-some ← a long career heard as longer
    { id: 'n2', skill: 'number', level: 'B1', point: 'years', seg: [132.6, 136.3], keep: true,
      stem: 'How long has Jerry been in the department?',
      choices: ['13 years', '30-some years', '40-some years'], a: 1,
      cue: '「I have been here」のあとの数。',
      line: 'I have been here, well, *30-some years*.',
      said: '「ここに、まあ、30何年かいる」と言う。',
      mean: '30-some ＝ 30いくつか。はっきり数えていないほど長い。',
      trap: 'thirty と thirteen は似ている。-ty は最初を強く、-teen は後ろを長く強く言う。',
      use: 'I’ve lived here twenty-some years.（ここに20何年住んでる）' },

    // R fix: V2 — blind 55 %: "a long break" was a filler; now the "one day at a time" script
    // why: something new ← "best way to cope" expected to be a fresh idea; no plan ← "every day" heard as "take each
    //   day as it comes"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'cope', seg: [135.9, 141.6],
      stem: 'What is Jerry’s way of coping with the job?',
      choices: ['Doing every task the same way each day', 'Trying one new thing on the job each day',
                'Taking each day as it comes, with no plan'], a: 0,
      cue: '「cope with this job」のあと、is to に続く部分。',
      line: 'the best way to cope with this job is to do *everything the exact same way every day*.',
      said: '「この仕事を乗り切るには、毎日すべて同じようにやるのがいちばん」と言う。',
      mean: 'cope with ＝ 乗り切る。変化をなくすのが Jerry のやり方。',
      trap: '「いちばんの方法」と聞くと前向きな工夫を期待しやすい。',
      use: 'How do you cope with the heat?（暑さをどう乗り切ってる？）' },

    // R fix: V2 — blind 50 %: "just pick a font" was the odd one out; all three now have Chris loving something. B1:
    //   the "top-to-bottom makeover" choice gives away f2's phrase, so it reveals `makeover`
    // why: makeover ← the title and Tom's own big pitch; Jerry's font ← Jerry gets the credit at the end
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['idcard', 'amazing', 'makeover'], seg: [141.5, 189.5],
      stem: 'How does Tom’s project end up?',
      choices: ['Chris loves a plan built on the old logo', 'Chris loves his top-to-bottom makeover',
                'Chris loves Jerry’s font, not Tom’s plan'], a: 0,
      cue: 'Jerry の身分証を見たあと、Tom が持っていく案。',
      said: 'Jerry の古い身分証を見て、昔のロゴで限定グッズを作る案を出し、Chris に絶賛される。',
      mean: '大改造ではなく、古いものを生かす案が通った。',
      trap: '題名の makeover から大改造が通ったと思いやすい。最後に出す案の中身を聞く。',
      use: 'Sometimes old is the new new.（古いものが一番新しいこともある）' },

    // why: 1960s ← sixties/seventies both start with s; 1990s ← -ties heard, the number before lost
    { id: 'n3', skill: 'number', level: 'B1', point: 'decade', seg: [155.5, 163.0], keep: true,
      stem: 'Which old logo does Tom want to bring back?',
      choices: ['The one from the 1960s', 'The one from the 1970s', 'The one from the 1990s'], a: 1,
      cue: '「the old logo from the」のあと。',
      line: 'we take *the old logo from the 1970s*',
      said: '「1970年代の古いロゴを使って、限定の帽子やポスターを作る」と話す。',
      mean: 'the 1970s ＝ 70年代。昔のものをあえて使う作戦。',
      trap: 'sixties と seventies は始まりが同じ s。seven の v の音を聞く。',
      use: 'It’s a song from the seventies.（70年代の曲だよ）' },

    // R fix: V2 — blind 75 %: two fillers, and "nostalgia" pointed straight at the key; both distractors now keep a
    //   real piece of the line
    // why: sad ← nostalgia read as 懐かしくて寂しい (but "recreate the fun" follows); buying ← "limited editions" just
    //   before, and "swept up" heard as pushed into it
    { id: 'f7', skill: 'phrase', level: 'B2', point: 'swept', seg: [164.4, 169.95],
      stem: 'What does Tom expect parents to feel?',
      choices: ['Carried away by memories of their youth', 'A bit sad that their youth is long gone',
                'Rushed into buying the limited editions'], a: 0,
      cue: '「Plus, parents will get」のあとの二語。',
      line: 'Plus, parents will *get swept up* with the nostalgia',
      said: '「それに親たちは懐かしさに引きこまれて、公園に行きたくなる」と言う。',
      mean: 'get swept up ＝ 気持ちに流される。nostalgia ＝ 懐かしさ。',
      trap: '懐かしさを寂しさと取りやすいが、続きは「楽しさをもう一度」。気持ちにさらわれる感じ。',
      use: 'I got swept up in the moment.（その場の勢いに流された）' },

    // C2: a plain-English paraphrase (earnest hedge on a huge claim)
    // anchor: 169.7–177 s "This is amazing" → "possibly the best idea anyone has had in this government in 100 years"
    //   → "Tom, terrific": the frame is all praise, so "possibly" can't be real doubt
    // why: unsure ← "possibly" read as real caution (かもしれない); Tom in years ← the scope "anyone… in this government"
    //   heard as "you", and "100 years" as "years"
    // R fix: V2/Q4 — blind 75 %: the key was the only "deep" choice and the only one quoting "possibly"; now three
    //   parallel first-person paraphrases, each off in one dimension (sincerity, scope)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'amazing', seg: [169.6, 177.4],
      stem: 'Which plain-English version keeps what Chris means?',
      choices: ['“It’s amazing: just about the best idea here in a century.”',
                '“It could be good, but I’d like to think it over first.”',
                '“It’s the best idea that you, Tom, have had in years.”'], a: 0,
      cue: '前後のほめ言葉と、間に入る控えめな一語。',
      line: '*This is amazing.* It is *possibly* the best idea anyone has had in this government *in 100 years*.',
      said: '「すばらしい。この役所で100年に一度の、もしかすると最高の案だ」と言う。',
      mean: 'ほめ言葉にはさまれた possibly は疑いでなく、大げさな称賛の一部。範囲も大きい。',
      trap: 'possibly を「かもしれない」と取ると迷いに聞こえる。前後がほめ言葉なら飾り。',
      use: 'Possibly the best pizza in New York.（もしかするとNYで一番のピザ）' },

    // R fix: V2/K6 — blind 60 %: "actually" in the stem and the key's two-part "not Jerry's advice" were cues; the
    //   "same way" choice also gave away d3's key. Now parallel "Jerry's…" choices
    // why: his advice ← "words of wisdom" heard as the source; font tips ← Jerry's font talk earlier
    { id: 'i4', skill: 'infer', level: 'C1', point: 'idcard', seg: [177.2, 187.25],
      stem: 'According to Tom, what gave him the idea?',
      choices: ['Jerry’s old ID card, seen by chance', 'Jerry’s words of wisdom on the job',
                'Jerry’s tips on which fonts look fun'], a: 0,
      cue: '「while he was」のあと、何をしていて何を見たか。',
      line: 'while he was *yammering on about whatever*, I *happened to see his old ID card*.',
      said: '「Jerry がどうでもいい話をしている間に、古い身分証が目に入った」と話す。',
      mean: 'yammer on ＝ だらだらしゃべる。きっかけは話でなく、見たカード。',
      trap: 'words of wisdom から助言のおかげと取りやすい。while 以下に注目。',
      use: 'I happened to see it on the way.（途中でたまたま見かけた）' },

    // C2: a callback inside the clip (cf. n1, h2)
    // anchor: 16–24 s "my number two guy… make it my number three… There's only two of us"; 180.4 s "my number four,
    //   Jerry": the rank drops again, while Jerry is being thanked
    // why: fourth helper ← "number four" taken as a plain count of helpers; moved up ← being thanked heard as a reward
    // R fix: V2/Q4 — blind 65 %: the key was the only "meta" choice; now three parallel readings of what Tom does
    //   with the rank (lower again / a plain count / a reward)
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'rank', seg: [178.0, 183.6],
      stem: 'When Tom thanks “my number four, Jerry”, what is going on?',
      choices: ['He drops Jerry’s rank again, even while thanking him', 'He ranks Jerry fourth among the people who helped',
                'He raises Jerry’s rank to thank him for the idea'], a: 0,
      cue: '最初の場面の順位の話と、ここで出る数。',
      line: 'most of the credit goes to *my number four*, Jerry.',
      said: '「手柄のほとんどはナンバー4の Jerry のもの」と言う。最初は2、すぐ3に下げた順位が、また一つ下がる。',
      mean: '最初の順位の冗談がここで戻る。ほめている最中にも順位を下げ、二人しかいないチームで4番。',
      trap: '手柄をゆずる場面なので昇格に聞こえやすい。数が前より上か下か、最初の場面と比べる。',
      use: 'And a special thanks to my number two.（そして右腕に特別な感謝を）' },
  ]
};
