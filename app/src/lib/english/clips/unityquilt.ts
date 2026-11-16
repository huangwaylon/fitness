// REVIEW 2026-11-16: pass 8, fix 14, drop 0, new 0; ear checks 1
// REVIEW open: g2 is now a plan gist (2.3–31.3 s) instead of the title's "unite the family"; f3 and h2 wait on the
//   ear check below.
// “The Knope-Wyatt Unity Quilt - Parks and Recreation” (the official Parks and Recreation channel, Season 5): Leslie
// walks Ben through her plan to bring his feuding parents together with a quilt; at the party the quilt only starts
// new arguments, and Leslie takes the families' agreement that it's a disaster as a sign that it's working.
// Segments from the captions, words from whisper (2026-11-16). Speakers from 83 s on are mostly unnamed (only
// “Leslie” at 91.9 s and “Steve” at 127.2 s), so no stem there names a speaker. Untested: “That's your dad. — Yes,
// he's terrifying.” at 23.5–25.1 s (who says which part), “omission” at 91 s (captions “submission”), “Yes, you did”
// at 54.8 s (captions “yes he did”), the name at 94.5 s (spelling is never tested), and who says “that old chestnut”.
// EAR CHECK: 126.6 s f3 h2 — whisper “You can say that again, Steve”, captions “say that again Steve” (no “you
//   can”); f3's key (agreement) rests on “can”: without it the line means “repeat that”
import type { Clip } from '../types.ts';

export const unityQuilt: Clip = {
  id: 'unityquilt', video: 'VeoidpIgCbM', title: 'The Knope-Wyatt Unity Quilt', dur: 141, wpm: 157, band: 'mid',
  tags: ['家', '恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %): the stem asked for the idiom's meaning, which a reader knows without the audio; now it
    //   asks what she wants to do with the plan, and the plan run-through that follows settles it
    // why: start right away ← "go" = 行く・始める; change parts ← "over" heard as 作り直す (do over)
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'goover', seg: [0, 3.2],
      stem: 'What does Leslie want to do with the plan first?',
      choices: ['Review it step by step', 'Start on it right away', 'Change a few parts of it'], a: 0,
      cue: '「Let’s」のあとの動詞と前置詞。',
      line: 'Hey, glad you’re here. *Let’s go over the plan.*',
      said: '「来てくれてよかった。計画をおさらいしよう」と言う。',
      mean: 'go over ＝ 見直す、確認する。予定や書類にもよく使う。',
      trap: 'go を「始める」、over を「やり直す」と取りやすい。go over ＋ 物は「ひと通り見る」。',
      use: 'Let’s go over the schedule once more.（予定をもう一度確認しよう）' },

    // R fix: V1/V2 (blind 80 %): "bring the family together" was the title ("Unity Quilt"); now the gist asks how
    //   the plan runs, over 2.3–31.3 s (B1 → B2: it takes several turns). Point renamed purpose → scheme; the key
    //   avoids x1's "small talk", and reveals: ['staged'] for the moms' meeting in its notes
    // why: keep them apart ← his parents can't stand each other and his dad "shows up" later; make the gift together ←
    //   a unity quilt sounds like a family craft
    { id: 'g2', skill: 'gist', level: 'B2', point: 'scheme', reveals: ['staged'], seg: [2.3, 31.3],
      stem: 'In short, how is Leslie’s plan for the evening meant to go?',
      choices: ['Ease them in slowly, then unveil a gift', 'Keep his parents apart until the gift', 'Have the parents make a gift together'], a: 0,
      cue: '時間の順に、何が起きる予定か。',
      said: '到着、ワイン、母親どうしの出会い、父の登場と順に話し、少したってサプライズを見せると言う。',
      mean: 'いきなり贈り物ではなく、場を温めてから見せる段取り。',
      trap: '両親を「会わせない」計画を想像しやすい。順番を表す then や later を追う。',
      use: 'First we chat, then the surprise.（まずおしゃべり、それからサプライズ）' },

    // R fix: V2 (blind 70 %): the key was the only "joking" choice; now a 2 × 2 of joking/serious × what he expects
    // why: just a night out ← "stargazing in the park" sounds like a real date plan; serious, a fight ← "strangle each
    //   other" heard as a real fear, the exaggeration missed
    { id: 't1', skill: 'attitude', level: 'B2', point: 'strangle', reveals: ['parents'], seg: [2.3, 11.4],
      stem: 'When Ben gives his own version of the plan, how serious is he?',
      choices: ['Joking; he expects a fight', 'Joking; he just wants a night out', 'Serious; he expects a fight'], a: 0,
      cue: '「while my parents」のあとの動詞。',
      line: 'you and I go stargazing… while my parents *slowly strangle each other* in the living room.',
      said: '「僕らは公園で星を見て、その間に両親は居間でゆっくり首を絞め合う」。',
      mean: '大げさな言い方で「どうせ大げんかになる」と冗談にしている。Leslie はすぐ No と返す。',
      trap: '前半だけならデート、後半だけなら本気の心配に聞こえる。大げさな動詞が冗談の印。',
      use: 'Sure, and then the sky will fall.（はいはい、そのあと空が落ちてくるんだね）' },

    // R fix: V2 (blind 75 %): the distractors were fillers; now three "each other" relations a listener could take
    // why: hardly see each other ← "each other" kept, the verb lost; tease each other ← "strangle" heard as play-fighting
    { id: 'i1', skill: 'infer', level: 'B2', point: 'parents', seg: [2.3, 11.4],
      stem: 'From Ben’s version of the plan, what do we learn about his parents?',
      choices: ['They can’t stand each other', 'They hardly ever see each other', 'They tease each other a lot'], a: 0,
      cue: '両親が居間で「お互いに」何をするか。',
      line: 'while my parents slowly *strangle each other* in the living room.',
      said: '両親が居間で「首を絞め合う」と言う。',
      mean: '本当に絞めるわけではない。二人の仲が最悪だと分かる。だから Leslie の計画が要る。',
      trap: 'each other は仲の良さにも使うが、ここは動詞が決める。動詞まで聞いてから判断。',
      use: 'Those two can’t stand each other.（あの二人は互いに大嫌い）' },

    // why: eleven ← seven and eleven share the "-even" ending; seven-thirty ← "o'clock" is short and "thirty" comes
    //   later in her plan
    { id: 'n1', skill: 'number', level: 'B1', point: 'seven', seg: [10.4, 14.3], keep: true,
      stem: 'When does Leslie say Ben’s mom arrives?',
      choices: ['Seven o’clock', 'Seven-thirty', 'Eleven o’clock'], a: 0,
      cue: '「arrives at」のすぐあと。',
      line: 'Your mom arrives at *seven o’clock*.',
      said: '「あなたのお母さんは7時に着く」。',
      mean: 'seven o’clock ＝ 7時ちょうど。計画は分刻み。',
      trap: 'seven と eleven は後半の音が同じ。最初に「イ」があるかを聞く。',
      use: 'Dinner is at seven o’clock sharp.（夕食は7時ちょうどです）' },

    // R fix: V2 (blind 55 %): "both teach and both are mothers" was the only two-part choice; now three two-part
    //   choices, one a near sound
    // why: authors ← mothers/authors share the -thers/-thors ending; same school ← "educators" heard as one workplace
    { id: 'd1', skill: 'detail', level: 'B1', point: 'common', seg: [15.4, 21.3],
      stem: 'What does Leslie say the two mothers have in common?',
      choices: ['Both are teachers and mothers', 'Both are teachers and authors', 'Both teach at the same school'], a: 0,
      cue: '「they’re both」のあとの二つの名詞。',
      line: 'they’re *both educators and mothers*.',
      said: '「二人とも教育者で母親」と言う。',
      mean: 'educator ＝ 教育に関わる人。二人をつなぐ話題として用意している。',
      trap: 'mothers と authors は後半が同じ音。educators から同じ職場も想像しやすい。and のあとまで聞く。',
      use: 'We’re both teachers, actually.（実は二人とも先生なんです）' },

    // R fix: V2 (blind 70 %): the key was the only "planned" reading; now the literal "coincidence" and "walking over"
    //   readings are framed the same way
    // why: hoping by chance ← "coincidence" taken at face value; invited herself ← "my mom is walking over" heard as
    //   her mom turning up uninvited
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'staged', seg: [15.4, 21.3],
      stem: 'What is Leslie doing with “oh, look…” and “what a fabulous coincidence”?',
      choices: ['Acting out a meeting she has set up', 'Hoping the moms will meet by chance', 'Admitting her mom just invited herself'], a: 0,
      cue: '計画を説明している途中の、声の変化。',
      line: 'and, *oh, look*, my mom is walking over… *What a fabulous coincidence.*',
      said: '計画の説明の途中で、「あら、母が来たわ…なんて偶然」とその場の台詞を演じてみせる。',
      mean: '偶然に見せかけた出会いを、前もって仕込んでいる。',
      trap: 'coincidence を文字通り「偶然」と取りやすい。計画の説明の中の偶然は、演出。',
      use: 'Oh, what a surprise! (Not really.)（あら偶然！（じつは計画））' },

    // why: thirteen ← -teen/-ty: "thirty" with a strong t heard as "thir-TEEN"; ninety ← the -ty ending is the same
    { id: 'n2', skill: 'number', level: 'B1', point: 'thirty', reveals: ['smalltalk'], seg: [25.3, 31.3], keep: true,
      stem: 'How long after the small talk does Leslie plan the big surprise?',
      choices: ['13 minutes', '30 minutes', '90 minutes'], a: 1,
      cue: '「small talk」のあと、「minutes」の前。',
      line: 'We make some small talk, and *thirty minutes later*, I show everybody the big surprise.',
      said: '「世間話をして、30分後にサプライズを見せる」。',
      mean: 'thirty は最初が強い「サーディ」。thirteen なら後ろの teen が強く長い。',
      trap: '-teen と -ty は強さの位置で聞き分ける。後ろの minutes に引っぱられない。',
      use: 'I’ll be there in thirty minutes.（30分で着きます）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'smalltalk', seg: [25.3, 30.9],
      stem: 'Type what Leslie says: “We ___, and…” (4 words)', answer: 'make some small talk',
      cue: '「We」のあと。k と s がつながる。',
      line: 'We *make some small talk*, and…',
      said: '「少し世間話をする」。',
      mean: 'small talk ＝ 天気などの軽い話。make small talk でひとまとまり。',
      trap: 'make の k と some の s がつながり、「メイサム」のように一語に聞こえる。',
      use: 'I’m bad at making small talk.（世間話が苦手なんです）' },

    // R fix: V2 (blind 60 %): two fillers; now two readings built from what she says (a hand-made brag, "Ben and I")
    // why: by hand ← "I have woven" heard as a craft brag; just about her and Ben ← "Ben and I are weaving our lives"
    //   heard as the quilt's subject
    { id: 'h1', skill: 'humor', level: 'C1', point: 'weave', seg: [32.9, 37.9],
      stem: 'What makes Leslie’s explanation of the quilt funny?',
      choices: ['She makes a figure of speech into a real object', 'She brags that she made the quilt all by hand', 'She says the quilt is just about her and Ben'], a: 0,
      cue: '「weaving our lives」と、そのあとの「so」。',
      line: 'Ben and I are *weaving our lives together*, so I have *woven this quilt*.',
      said: '「私たちは人生を織り合わせている。だからキルトを織った」と言う。',
      mean: '「人生を織り合わせる」は比喩。それを本物のキルトにしてしまうのが笑い。',
      trap: 'woven を腕前の自慢、Ben and I を主題と取りやすい。so の前後で、比喩と現実がつながる。',
      use: 'We’re building a life together.（二人で人生を築いている）' },

    // R fix: V2 (blind 60 %): "too warm" was a filler; now all three say she has made many things before, and only
    //   "metaphorical art projects" decides what
    // why: quilts ← this one is a quilt, so "projects" heard as more of the same; gifts for Ben ← "Ben and I" and the
    //   surprise heard as her habit
    { id: 'i2', skill: 'infer', level: 'C1', point: 'projects', seg: [40.9, 45.5],
      stem: 'What does Leslie’s comment on her “art projects” tell us?',
      choices: ['She has made many symbolic crafts before', 'She has made many quilts before', 'She has made many gifts for Ben before'], a: 0,
      cue: '文頭の「Of all my」。',
      line: '*Of all my metaphorical art projects*, this is by far the coziest.',
      said: '「私の比喩的な作品の中で、これがいちばんふかふか」と言う。',
      mean: 'of all my ～ ＝ たくさんある中で。こうした作品を何度も作ってきたと分かる。',
      trap: '今回がキルトなので「キルトを何枚も」と取りやすい。metaphorical が作品の種類を示す。',
      use: 'Of all my trips, this was the best.（今までの旅で、これが一番）' },

    // why: no square for dad ← the missing square comes up later; Leslie twice ← "out of respect" heard as about her
    { id: 'd2', skill: 'detail', level: 'B2', point: 'biden', seg: [48.6, 57.6],
      stem: 'What does Ben point out on the quilt?',
      choices: ['Joe Biden is on it after all', 'His dad has no square on it', 'Leslie put herself on it twice'], a: 0,
      cue: 'Leslie の説明のすぐあと、Ben の短い返事。',
      line: 'I *did not include* any images of… Joe Biden. — *Yes, you did, right there.*',
      said: '「敬意を払ってバイデンは入れなかった」と言うが、Ben が「そこにいる」と指す。',
      mean: 'Leslie は「小さいのだけ」と認める。言葉と作品がずれている。',
      trap: 'did not include だけだと「入っていない」になる。直後の Ben の返事が答え。',
      use: 'Wait, you did put it in. Right there.（待って、入ってるよ。そこ）' },

    // R fix: V2 (blind 65 %): "list the best points" was a filler; now "explains the little square" is a real reading
    // why: fair point ← "point" heard as Ben's point; explains ← "that's just a little one" heard as the start of an
    //   explanation
    { id: 'm1', skill: 'marker', level: 'B2', point: 'point', seg: [55.3, 61.3],
      stem: 'Right after “that’s just a little one”, what does Leslie’s next phrase do?',
      choices: ['Drops the Biden topic for her main idea', 'Admits Ben has made a fair point', 'Explains what the little square is for'], a: 0,
      cue: '小さい絵の話のあと、文頭の三語。',
      line: 'that’s just a little one. *The point is*, this quilt is going to unite the Wyatt clan.',
      said: '「小さいのだけ。とにかく、このキルトが一家をまとめるの」と言う。',
      mean: 'The point is ＝ 要するに。都合の悪い話を切り上げ、本題に戻す。',
      trap: 'point を相手の「指摘」、続きを説明と取りやすい。The point is は話を戻す合図。',
      use: 'Anyway, the point is, we’re late.（とにかく、要は遅刻なの）' },

    // R fix: V2 (blind 50 %): two "hopes" choices left "doubts" as the odd one out; now a 2 × 2 of likes/dislikes ×
    //   thinks it will / won't work (one cell left out)
    // why: likes it, will work ← "beautiful" heard alone, "won't" lost; dislikes it, will work ← "won't" heard as
    //   about the quilt itself, not the plan
    { id: 't3', skill: 'attitude', level: 'C1', point: 'wont', seg: [57.4, 64.2],
      stem: 'How does Ben feel about the quilt and what it is for?',
      choices: ['He likes it but doubts it will work', 'He likes it and thinks it will work', 'He dislikes it but thinks it will work'], a: 0,
      cue: 'Ben の短い二文。二つ目は何を指すか。',
      line: 'this quilt is going to unite the Wyatt clan. — It’s beautiful. *And it won’t.*',
      said: 'Leslie「家族をまとめる」、Ben「きれいだね。そして、まとまらない」。',
      mean: 'it won’t のあとに unite… が省略されている。作品はほめ、効果は否定。',
      trap: 'beautiful だけで賛成と取りやすい。省略は相手の文から補う。',
      use: 'Nice idea. It won’t work, though.（いい考え。うまくいかないけどね）' },

    // R fix: V2 (blind 55 %): "want" and "wasn't" don't fit after "It's beautiful. And it", which left will/won't;
    //   now all four fit, and only the sound decides
    // why: will ← the contrast is lost, and "it will" (unite) is the hopeful reading; does / is ← short affirmations of
    //   "beautiful" that fit the gap
    { id: 's1', skill: 'sound', level: 'B2', point: 'wont', seg: [61.0, 64.2],
      stem: 'Fill the gap: “It’s beautiful. And it ___.”',
      choices: ['will', 'won’t', 'does', 'is'], a: 1,
      cue: '最後の一語の母音。「オウ」か「アー」か。',
      line: 'It’s beautiful. And it *won’t*.',
      said: '「きれいだね。そして、まとまらない」。',
      mean: 'won’t は「ウォウント」と口を丸める。will は短く「ウィル」、強く伸びない。',
      trap: 'どれも文として成り立つ。前の文に合わせず、口を丸めた長い「オウ」の音を聞く。',
      use: 'It won’t take long.（長くはかからないよ）' },

    // why: closer at once ← Leslie's own "It's working" at the end; one square ← the square talk heard as a small fix
    { id: 'g1', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['agree'], seg: [64.9, 131.0],
      stem: 'At the party, what does the quilt actually do?',
      choices: ['It starts new arguments among them', 'It brings them closer right away',
                'It pleases all but one of them'], a: 0,
      cue: '発表のあと、次々に出てくる不満の数。',
      said: '発表のあと、「私の四角は？」「名前を入れたくない」「ひどい」と不満が続く。',
      mean: '家族をまとめるはずのキルトが、新しいけんかの種になる。',
      trap: '最後の「うまくいってる」は Leslie の受け取り方。実際の言葉の中身で判断する。',
      use: 'Well, that didn’t go as planned.（まあ、計画通りにはいかなかった）' },

    // R fix: V2 (blind 60 %): "asks for time" was a filler; now the key is plainer and both distractors are readings
    //   of the stop
    // why: can't find the word ← the pause heard as searching; make one later ← "technically" heard as about how to
    //   make a square
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'technically', seg: [82.7, 89.5],
      stem: 'When the answer to “Where’s my square?” stops short, what is happening?',
      choices: ['The speaker holds back an awkward fact', 'The speaker can’t find the right word', 'The speaker plans to make one later'], a: 0,
      cue: '「not technically」のあと、言葉が止まるところ。',
      line: 'Where’s my square? — Well, you’re *not technically*… — Not technically what?',
      said: '「私の四角は？」と聞かれ、「えっと、厳密には…」と言葉を切る。',
      mean: '言いにくいことを最後まで言わずに止めている。相手に聞き返され、結局言うことになる。',
      trap: '言葉が止まると、単語を忘れたように聞こえる。言いにくい中身ほど途中で止まる。',
      use: 'Well, it’s not exactly… you know.（うーん、ちょっとその…ね）' },

    // anchor: 88.2–89.5 s the line is finished out loud: "Not technically an adult"
    // why: not family ← right mechanism, wrong target: "not technically" + a missing square heard as "not part of the
    //   family", the natural guess; forgot ← the plain reading: she simply left it out
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'technically', seg: [82.7, 89.5],
      stem: 'When the reply to “Where’s my square?” trails off, what is withheld?',
      choices: ['That the asker isn’t counted as a grown-up', 'That the asker isn’t really part of the family',
                'That the asker’s square was simply forgotten'], a: 0,
      cue: '止まった文が、あとで何という語で終わるか。',
      line: 'Well, you’re not technically… — Not technically what? — *Not technically an adult.*',
      said: '「厳密には…」で止まり、聞き返されて「厳密には、大人じゃない」と言い切る。',
      mean: '言いかけたのは「大人ではない」。家族かどうかではなく、年齢の話で外していた。',
      trap: '四角がない理由は「家族じゃない」と予想しやすい。止まった文は、あとの言い直しで答え合わせ。',
      use: 'He’s not technically my boss.（厳密には、彼は上司じゃない）' },

    // R fix: V2 (blind 55 %): "worried about Leslie" was a filler; now two readings of "concerned" a listener could hold
    // why: concerns them most ← concerned = 関心事, so "what matters most to me"; speak for the family ← "as far as"
    //   heard as a claim to authority
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'concerned', seg: [89.4, 97.4],
      stem: 'After calling the quilt “a very thoughtless omission”, what does the speaker’s next phrase add?',
      choices: ['That this is just their own view', 'That this is what concerns them most', 'That they speak for the whole family'], a: 0,
      cue: '「Leslie」の直後の、五語のかたまり。',
      line: '*As far as I’m concerned*, if there’s no … square, this is not a legitimate unity quilt.',
      said: '「私に言わせれば、あの人の四角がなければ本物じゃない」。',
      mean: 'as far as I’m concerned ＝ 私に言わせれば。自分の意見の前置き。',
      trap: 'concerned を「心配・関心」と取りやすい。as far as と組めば「私としては」。',
      use: 'As far as I’m concerned, it’s fine.（私としては、問題ないよ）' },

    // R fix: V2 (blind 65 %): the "compliment" filler made the key stand out; now two wrong referents for "agreeing"
    // why: agree it's lovely ← "Sweetheart, this is lovely" earlier, and "agreeing" heard as about the quilt; hasn't
    //   heard ← her cheer heard as her missing the fight
    { id: 'h2', skill: 'humor', level: 'C1', point: 'agree', reveals: ['sayagain'], seg: [124.5, 130.9],
      stem: 'Why is Leslie’s final remark to Ben funny?',
      choices: ['The only thing they agree on is the failure', 'She thinks they both agree the quilt is lovely', 'She hasn’t heard what they agreed about'], a: 0,
      cue: '二人が何について同じ意見なのか。',
      line: 'It’s a disaster… — You can say that again, Steve. — See, Ben? *They’re agreeing. It’s working.*',
      said: '「大失敗だ」「その通りね」を聞き、Leslie は「ほら、意見が合ってる。うまくいってる」と言う。',
      mean: '二人が一致したのは「失敗」という点だけ。それを成功の印と取るのがおかしい。',
      trap: '「意見が合う」だけ聞くと前進に見える。何について合っているかを聞く。',
      use: 'Well, at least we agree on something.（まあ、一つは意見が合ったね）' },

    // why: repeat ← literal "say that again" = もう一回言って; don't you dare ← "again" heard as a warning
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'sayagain', seg: [124.5, 127.6],
      stem: 'Right after “It’s a disaster…”, what does the answer to Steve mean?',
      choices: ['I completely agree with you', 'Please repeat that, I missed it', 'Don’t you dare say that again'], a: 0,
      cue: '「disaster」のすぐあと、「Steve」で終わる一言。',
      line: 'It’s a disaster… — *You can say that again*, Steve.',
      said: '「大失敗だ」に「その通りね、スティーブ」と返す。',
      mean: 'You can say that again ＝ まったく同感。何度言ってもいいほど正しい、という意味。',
      trap: '文字通り「もう一度言って」と取りやすい。can のある決まり文句は同意。',
      use: 'Long day? — You can say that again.（長い一日？—ほんとにね）', retired: true },

    // anchor: 124.7–126.3 s "It's a disaster is what it is": seven words in about 1.6 s, the last four all weak
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'disaster', seg: [124.5, 126.55],
      stem: 'Type the end of the line: “It’s a disaster ___.” (4 words)', answer: 'is what it is',
      cue: '「disaster」のあと。文法より、聞こえた音を。',
      line: 'It’s a disaster *is what it is*.',
      said: '「大失敗だよ、まったく」と言い切る。後ろの4語は弱く、ひと続きに聞こえる。',
      mean: '～ is what it is ＝ 「まさに～だ」と言い直して強める会話の形。is が二つ並ぶが、自然な言い方。',
      trap: '文法に合わせて is を一つ消したくなる。書き取りは、正しい文でなく言われた音を書く。',
      use: 'It’s a mess is what it is.（めちゃくちゃだよ、まったく）' },
  ]
};
