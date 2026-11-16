// “Is She Hot? - The Office US” (the official The Office channel, BEST OF SEASON 5): the office argues over whether an
// actress is hot, takes a vote that ties, tries a thought experiment on Kevin, and then hears a run of odd reasons for
// each side, ending with Stanley's new optimism.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 254 s. Stanley is named at 2.2 s and
// names himself at 223.7 s; Kevin at 65.6, 66.9, 73.2 and 88.0 s. The coworker who runs the thought experiment, the man
// with the celebrity theory, the man on face symmetry and the two women are never named, so stems describe them.
// Untested on purpose: 13–20 s (an insult to her looks; whisper "bangs", captions "bags"), 34–36 s ("I'm not voting. No
// one cares." — speakers unclear), 49.6–51 s ("Thank you, accounting department": who says it and why isn't clear),
// 100–163 s (whisper loses sync and loops from 114 s, so the words are captions-only; the stretch holds "would you do
// her", a sexual plot-twist joke, "hot is a temperature" and a Boris Becker reference), 233–254 s (a list of adjectives;
// captions garble the last lines).
// REVIEW 2026-11-16: pass 7, fix 14, drop 0, new 0; ear checks 2
//   Open: none.
// EAR CHECK: 32.0 s x1 — "put this to a" said linked, with the t of "put" flapped (both sources have "put this to a vote")
// EAR CHECK: 188.0 s h1 — "Wait, what?" taken as Kevin's (the line before is about "him"; no name is said)
import type { Clip } from '../types.ts';

export const isSheHot: Clip = {
  id: 'isshehot', video: '1JAE8kM_Uy4', title: 'Is She Hot?', dur: 277, wpm: 162,
  band: 'mid', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: admits it ← the Japanese frame: a short reply to a jab read as giving in; joking he has none ← "Oh" read as a
    //   playful sigh, and "no taste" is the last thing heard
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'taste', seg: [0.3, 3.95],
      stem: 'How does Stanley answer being told he has no taste?',
      choices: ['Calmly sure that he does have it', 'Hurt, and quietly admitting it', 'Joking that he has none at all'],
      a: 0,
      cue: '「Stanley Hudson」の直後、とても短い返事。',
      line: 'You’ve got no taste, Stanley Hudson. — Oh, *I do*.',
      said: '「趣味が悪いな」と言われ、「いや、あるさ」と短く返す。',
      mean: 'I do ＝ I do have taste の省略。do を強く言って、相手の言葉を打ち消している。',
      trap: '短い返事は「まあね」と認める意味に聞こえやすい。I do の do は肯定の強調。',
      use: 'You don’t care. — I do!（気にしてないでしょ — 気にしてるよ！）' },

    // R fix: V2 blind ≈ 50–80 %: "nobody agrees to vote" was weak. Now a won-by-one near miss.
    // why: won by one ← "Five." is said once before the score, as if one side counted five and the other more; most say
    //   not hot ← "She's not hot" is said just before the vote
    { id: 'g1', skill: 'gist', level: 'B1', point: 'tie', seg: [3.5, 51.1],
      stem: 'How does the first try to settle the argument turn out?',
      choices: ['It ends even, so nothing is settled', 'It’s won by one vote, but the losers object',
                'Most of the room says she isn’t hot'], a: 0,
      cue: '手を挙げさせたあと、数を数える部分。',
      said: '「趣味が悪い」「きれいな女優だ」と言い合い、多数決をとるが、結果は同数。',
      mean: '投票で決着をつけるはずが、引き分けで振り出しに戻る。ここから別の方法が始まる。',
      trap: '投票の前に She’s not hot が聞こえるので多数派に思えるが、数えると同じ数。',
      use: 'It’s a tie, so let’s flip a coin.（引き分けだから、コインで決めよう）' },

    // R fix: K1 "the woman they have doubts about" was defensible ("in question" can mean "in doubt", and her looks are
    //   being doubted). Now a reputation reading of "questionable".
    // why: asked the question ← "question" read as a question someone asked; doubtful reputation ← "in question" read
    //   as "questionable" (疑わしい)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'inquestion', seg: [7.0, 10.6],
      stem: 'Joining the talk, which woman does the newcomer ask about?',
      choices: ['The woman they are talking about', 'The woman who asked the question', 'The woman with a doubtful reputation'],
      a: 0,
      cue: '「Who’s the gal」のあと。',
      line: 'Who’s *the gal in question*? — Hilary Swank.',
      said: '加わった人が「話題の女性は誰？」と聞き、名前が返る。',
      mean: 'in question ＝ 今話題の。gal は girl のくだけた言い方。',
      trap: 'question を「質問」と取ると、質問した人に聞こえる。in question ＝「その〜」。',
      use: 'The hotel in question is downtown.（そのホテルは中心街にあるよ）' },

    // why: says she's hot ← "beautiful" heard as a vote for "hot" (they're treated as different later); watch a film ←
    //   "movie star" is said (keyword)
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'gotowork', seg: [19.7, 26.7],
      stem: 'When someone calls her “a beautiful movie star”, what are they trying to do?',
      choices: ['Get everyone to drop it and start work', 'Say that she is hot, since she’s a star',
                'Suggest they watch one of her films'], a: 0,
      cue: '「so maybe」のあと。',
      line: 'Guys, she is a beautiful movie star, *so maybe we should just go to work*.',
      said: '「彼女はきれいな映画スターだ。だから、もう仕事に戻ろうか」と言う。',
      mean: 'so maybe we should just ～ ＝ やんわり話を終わらせる言い方。',
      trap: 'beautiful を hot と同じと取ると、賛成票に聞こえる。so のあとが本題。',
      use: 'So maybe we should just order pizza.（じゃあ、もうピザ頼もうか）' },

    // R fix: V2 blind 65 %: "nobody has asked a question yet" was a filler. Now a ranking reading.
    // why: looks matter more ← the reply heard as ranking the two, not as steering back to the point; acting not good ←
    //   the reply heard as disagreeing with the praise itself
    { id: 'i1', skill: 'infer', level: 'C1', point: 'notq', seg: [24.5, 29.2],
      stem: 'What does the reply to the praise of her acting point out?',
      choices: ['Talent isn’t what they’re judging', 'Looks matter more than talent', 'Her acting isn’t that good really'],
      a: 0,
      cue: '「amazing actress」への、すぐの返事。',
      line: 'She is an amazing actress. — *That’s not the question*. — She’s not hot.',
      said: '「すごい女優だ」に「そういう話じゃない」と返り、「ホットじゃない」と続く。',
      mean: '演技のうまさではなく、ホットかどうかの話だ、と論点を戻している。',
      trap: 'question を「質問」と取ると話がずれる。比べてもいない。論点を戻しているだけ。',
      use: 'That’s not the point.（そういうことじゃないんだ）' },

    // R fix: V2 blind 65 %: "complains that people won't vote" was weak. Now the earlier "go to work" line.
    // why: asks why ← "why don't we" read as a real why-question; back to work ← the earlier "so maybe we should just go
    //   to work" (keyword, another speaker)
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'whydont', reveals: ['putvote'], seg: [29.6, 35.8],
      stem: 'After “Okay, okay, okay…”, what does the speaker do?',
      choices: ['Proposes a quick way to end it', 'Asks why they haven’t voted on it', 'Tells them to get back to work'],
      a: 0,
      cue: '「Okay」を3回言ったあとの文の形。',
      line: '*Why don’t we* just put this to a vote, *and then we’ll be done with it*.',
      said: '「多数決にしよう。それで終わりにしよう」と持ちかける。',
      mean: 'Why don’t we ～? は理由を聞く文ではなく、「〜しよう」という提案。',
      trap: 'why を「なぜ」と取ると、理由を聞いているように聞こえる。Why don’t we は誘いの型。',
      use: 'Why don’t we split the bill?（割り勘にしない？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'putvote', seg: [30.55, 33.9],
      stem: 'Type what he suggests: “Why don’t we just ___, and then…” (5 words)', answer: 'put this to a vote',
      cue: '「just」のあと、and の前まで。',
      line: 'Why don’t we just *put this to a vote*, and then we’ll be done with it.',
      said: '「多数決で決めよう」と言っている。',
      mean: 'put の t が弾み、this とつながる。to a は「タ」のように短く一つになる。',
      trap: 'to a が一音に聞こえて、語の数が足りなくなりやすい。put ＋ 物 ＋ to a vote で「投票にかける」。',
      use: 'Let’s put it to a vote.（多数決で決めよう）' },

    // why: 4 to 5 ← "five" heard once before the score, as if one side had more; 9 to 5 ← nine/five share a vowel, and
    //   "nine to five" is a familiar chunk
    { id: 'n1', skill: 'number', level: 'B1', point: 'tie', seg: [40.9, 51.1], keep: true,
      stem: 'What is the result of the show of hands?',
      choices: ['4 to 5', '5 to 5', '9 to 5'], a: 1,
      cue: '2回目の挙手のあと、数を言う声。',
      line: 'Five. *Five to five*.',
      said: '二回の挙手を数え、「5対5」と結果を言う。',
      mean: 'five to five ＝ 5対5。同じ数で、決着がつかなかった。',
      trap: 'nine to five（9時5時）という決まった言い方があり、つられやすい。five の v まで聞く。',
      use: 'It’s three to two, our team.（3対2で、うちのチームだ）' },

    // R fix: V2 blind 50 %: "judge them more harshly" was the odd one out. Now a screen-role reading; trap matched.
    // why: roles ← "figures" and "celebrities" heard as their screen parts; believe stories ← "mythical" read as
    //   myths, stories people tell
    { id: 'd2', skill: 'detail', level: 'B2', point: 'mythical', seg: [52.4, 62.4],
      stem: 'What does the man claim people tend to do with celebrities?',
      choices: ['Not judge them as real people', 'Judge them by the roles they play', 'Believe the stories told about them'],
      a: 0,
      cue: '「so therefore」のあと。',
      line: 'we have a tendency to view celebrities as sort of *mythical figures*… *we don’t judge them as real people*.',
      said: '「有名人を伝説の人物のように見て、普通の人として判断しない」と言う。',
      mean: 'mythical figures ＝ 伝説の存在。普通の人の物差しで見ない、という説。',
      trap: 'mythical を「作り話」と取ると、うわさの話に聞こえる。',
      use: 'We don’t see them as real people.（私たちは彼らを普通の人として見ていない）' },

    // R fix: S3 the cue's "just" was only in the key; the key now says "only".
    // why: impressed ← a long, clever-sounding theory expects interest; amused ← "Are you serious?" can be a laughing
    //   "no way"
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'serious', seg: [62.0, 67.3],
      stem: 'How does Kevin react to the theory about celebrities?',
      choices: ['Impatient: he only wants to see her', 'Impressed: he wants to hear more of it',
                'Amused: he takes the theory as a joke'], a: 0,
      cue: '理論のすぐあと、「just」を含む頼み。',
      line: 'Are you serious? Jim, *just show us a picture*. — Kevin, come on.',
      said: '「本気？いいから写真見せてよ」と言い、周りに止められる。',
      mean: 'just show us ＝ ごちゃごちゃ言わずに。理屈はいらない、という苛立ち。',
      trap: 'Are you serious? は笑いにも使うが、ここは just が続く。苛立ちの合図。',
      use: 'Just tell me the price.（とにかく値段を教えて）' },

    // R fix: V2 blind 75 %: the key was the only "X, not Y" choice. Now a parallel looks-not-acting choice.
    // why: looks not acting ← the earlier "amazing actress… that's not the question" (the debate's frame, not Kevin's
    //   line); nervous ← "gut" as the stomach feeling of butterflies (literal reading)
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'gut', seg: [66.9, 72.75],
      stem: 'How does Kevin say people should decide if someone is hot?',
      choices: ['By instinct, not by reasoning', 'By her looks, not her acting', 'By how nervous she makes them'],
      a: 0,
      cue: '「fancy」で言いよどんだあと。',
      line: 'he’s making all these fancy… It’s *a gut thing*.',
      said: '「あいつは難しい言葉ばかり使うけど、これは直感の問題だ」と言う。',
      mean: 'a gut thing ＝ 理屈でなく直感で分かること。gut は本能を表す。',
      trap: 'gut を「お腹」と取ると、緊張や体の感覚の話に聞こえる。理屈の反対として使っている。',
      use: 'I can’t explain it. It’s a gut thing.（説明できない、直感なんだ）' },

    // R fix: V2 blind 70 %: "That's far" made no sense. Now "rare", the same vowel. C5: the stem quotes f2's line, so it
    //   reveals `gut`.
    // why: fine ← the more familiar reply, and the r-colored vowel is easy to miss; rare ← the same vowel, with the f
    //   lost before it
    { id: 's1', skill: 'sound', level: 'B2', point: 'fair', reveals: ['gut'], seg: [70.0, 74.15],
      stem: 'After “It’s a gut thing,” what exactly is the reply?',
      choices: ['That’s fine.', 'That’s fair.', 'That’s rare.'], a: 1,
      cue: '短い返事の、最後の母音の響き。',
      line: 'It’s a gut thing. — *That’s fair*.',
      said: '「直感の問題だ」に「もっともだ」と返し、次の提案に移る。',
      mean: 'That’s fair ＝ 一理ある。fair は「フェア」で、r の響きで終わる。',
      trap: 'That’s fine はよく聞く返事なので、つられやすい。fair は口を開いたまま終わる。',
      use: 'That’s fair. I’ll try again.（もっともだね。もう一回やってみる）' },

    // R fix: V2 blind 55 %: the key was the only imagining choice. Now two "picture her" choices.
    // why: in a film ← "picture" and "movie star" from earlier: imagining, but the wrong place; photo ← "show us a
    //   picture" was asked for a moment before
    { id: 'g2', skill: 'gist', level: 'B2', point: 'imagine', seg: [72.7, 100.4],
      stem: 'How does one coworker try to settle the question for Kevin?',
      choices: ['By having him picture her visiting him', 'By having him picture her in a film',
                'By finding a photo of her to show him'], a: 0,
      cue: '「close your eyes」のあとの話。',
      said: '目を閉じさせ、女優がオフィスに来て自分に声をかける場面を思い浮かべさせる。',
      mean: '写真や投票ではなく、想像の場面で Kevin 本人に答えを出させようとしている。',
      trap: '直前に「写真を見せて」と言われているので写真に思えるが、ここで使うのは想像。',
      use: 'Close your eyes and picture this.（目を閉じて、想像してみて）' },

    // R fix: V2 blind 55 %: "look at a photo" was weak. Now a manner-not-looks reading, parallel to the key.
    // why: manner ← she's kind to him in the imagined scene, so it sounds like a test of her personality; only likes
    //   women who like him ← the imagined lines are about her wanting him (wrong implication)
    { id: 'i2', skill: 'infer', level: 'C1', point: 'forreal', reveals: ['imagine', 'mythical'], seg: [80.0, 94.95],
      stem: 'What is the imagined visit meant to make Kevin do?',
      choices: ['Judge her as a real person, not a star', 'Judge her by her manner, not her looks',
                'Admit he only likes women who like him'], a: 0,
      cue: '「comes into this office」のあとの二語。',
      line: 'imagine that Hilary Swank comes into this office *for real*, and she walks over to you…',
      said: '「本当にこのオフィスに来て、君に話しかけたら」と想像させる。',
      mean: '有名人を普通の人として見ない、という先の説を試している。for real で身近な人にする。',
      trap: '想像の中身が「君に会いたい」なので、好かれたいかの話に思えるが、狙いは見方を変えること。',
      use: 'Imagine you met her for real.（実際に会ったと想像してみて）' },

    // anchor: 167.0–174.6 s "if you were saying that Hilary Swank isn't hot, then you're saying I'm not hot, because
    //   obviously I'm not as hot as…": she puts the actress above herself, so "not hot" for her means "not hot" for both
    // why: about as hot ← "as hot as" heard without "not" (scope); hotter than her ← the comparison read the other way
    //   (right relation, wrong direction)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'pam', seg: [163.9, 175.0],
      stem: 'Which plain-English version keeps the woman’s argument that the actress is hot?',
      choices: ['“If she’s not hot, then I can’t be hot either.”', '“We’re about as hot as each other, so she’s hot.”',
                '“She’s hot, but I’m hotter, so it doesn’t matter.”'], a: 0,
      cue: 'because のあと、二人を比べる言い方。',
      line: 'if you were saying that she isn’t hot then you’re saying I’m not hot, because obviously *I’m not as hot as*…',
      said: '「彼女がホットじゃないなら私もそう。だって私は彼女ほどじゃないから」と言う。',
      mean: '自分を女優より下に置き、女優が否定されると自分も否定される理屈。結局は自分の話。',
      trap: 'as hot as だけ拾うと「同じくらい」になる。not as ～ as は「〜ほどではない」。',
      use: 'I’m not as fast as you.（君ほど速くないよ）' },

    // R fix: the cue relied on the plural s, which only whisper has; the key holds either way, so the cue no longer
    //   points at the s and the ear check is gone.
    // why: every Kevin ← "Kevins" read literally as people with that name; Kevin and his allies ← the men who sided with
    //   him in the debate
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'kevins', seg: [175.4, 183.4],
      stem: 'When the second woman addresses the “ladies”, whose opinions is she dismissing?',
      choices: ['People like Kevin in general', 'Every man named Kevin she knows', 'Kevin and the men who agree'], a: 0,
      cue: '「let the」のあと、名前を使った言い方。',
      line: 'are we prepared to let *the Kevins of the world* decide anything for us',
      said: '女性たちに「ケビンみたいな人に、何か決めさせていいの？」と呼びかける。',
      mean: 'the ～s of the world ＝ その人のような人たち全般。見下した言い方。',
      trap: '名前に s が付くと「同じ名前の人たち」と取りやすいが、性質の代表として使っている。',
      use: 'Ignore the critics of the world.（世の批評家たちなんて気にしないで）' },

    // why: on his side ← "ladies… us" heard as women against men, so Kevin is surprised to lose; didn't hear ← "Wait,
    //   what?" taken literally, as a request to repeat
    { id: 'h1', skill: 'humor', level: 'C1', point: 'internet', seg: [175.4, 189.0],
      stem: 'Why does the reply “Wait, what?” get a laugh?',
      choices: ['Kevin learns his internet is limited', 'Kevin thought the women were on his side',
                'Kevin didn’t hear what she said'], a: 0,
      cue: '「We don’t even」で始まる一文の中身。',
      line: '*We don’t even give him full internet access*. — Wait, what?',
      said: '「彼にはインターネットも全部は使わせてないのよ」と言われ、「え、何それ？」と返る。',
      mean: '本人の知らない社内の扱いが、議論のついでにばれる。その驚きが笑い。',
      trap: 'Wait, what? を聞き返しと取りやすいが、「聞いてないぞ」の驚き。直前の一文が原因。',
      use: 'Wait, what? Since when?（え、何？いつから？）' },

    // R fix: V2 blind 50 %: "face symmetry" in the stem pointed at "attractive". The stem now names the moment.
    // why: hot not attractive ← the same two words, order swapped; both ← "attractive" and "hot" are both said
    { id: 'd3', skill: 'detail', level: 'B1', point: 'verdict', seg: [196.4, 206.9],
      stem: 'After “See that?”, what is the man’s final verdict?',
      choices: ['Attractive, but not hot', 'Hot, but not attractive', 'Both attractive and hot'], a: 0,
      cue: '最後の「Yes」から始まる一文。',
      line: 'Yes, she’s *attractive*, but *she’s not hot*.',
      said: '顔の対称性を理屈で説明し、「魅力的だが、ホットではない」と結ぶ。',
      mean: 'attractive ＝ 整っていて魅力的。hot ＝ 色気がある。彼はこの二つを分けている。',
      trap: '二つの語が両方出るので、順番が入れ替わって聞こえやすい。but のあとが結論。',
      use: 'It’s nice, but it’s not for me.（いいけど、私向きじゃない）' },

    // why: 2 or 3 ← "twenty, thirty" heard without the -ty; 12 or 13 ← -ty/-teen, the classic swap
    { id: 'n2', skill: 'number', level: 'B1', point: 'years', seg: [211.7, 216.4], keep: true,
      stem: 'How many more years does Stanley think he has?',
      choices: ['2 or 3', '12 or 13', '20 or 30'], a: 2,
      cue: '「I’ve got, what」のあと。',
      line: 'I’ve got, what, *20, 30 more years* left.',
      said: '「あと20年か30年は生きられる」と言う。what は数を思い出す間。',
      mean: 'twenty, thirty と2つ並べるのは、ざっくりした見積もり。',
      trap: '-ty と -teen は聞き分けにくい。-ty は最初が強く、-teen は最後が強く長い。',
      use: 'It’s, what, ten minutes from here?（ここから、えーと、10分くらい？）' },

    // R fix: V2 blind 70 %: the key was the only joke-shaped choice. Distractors now parallel ("His family history…",
    //   "gloomy").
    // why: adds more years ← "less" heard as "more" from “more years” just before; blames his family ← the old Stanley's
    //   complaining, and "family" heard as people, not a medical history
    { id: 'h2', skill: 'humor', level: 'C1', point: 'less', reveals: ['years'], seg: [211.7, 222.7],
      stem: 'Why does Stanley’s comment about his family history get a laugh?',
      choices: ['His hopeful count turns gloomy at once', 'His family history adds even more years',
                'He blames his family for his gloomy mood'], a: 0,
      cue: '「family history」のあと、最後の一語。',
      line: '20, 30 more years left. And *my family history says I have less*.',
      said: '「あと20〜30年ある」と言った直後、「家系的にはもっと短い」と足す。',
      mean: '前向きになろうとした直後に、自分で暗い事実を足してしまう。そのずれが笑い。',
      trap: 'more years のすぐあとなので、less を見落としやすい。最後の一語で意味が逆になる。',
      use: 'I’m on a diet. Starting tomorrow.（ダイエット中。明日からね）' },

    // anchor: 212.2–221.9 s "20, 30 more years left. And my family history says I have less."; 222.9–232.6 s "the old
    //   Stanley Hudson would have found something to complain about with this actress, but that's no way to live life"
    // R fix: V2 blind 70 %: "the talk of her face" was a weak near miss. Now an image motive (right change, wrong why).
    // why: stop seeing him as a grump ← "the old Stanley… found something to complain about" heard as being about his
    //   image; good taste ← the opening jab "You've got no taste, Stanley Hudson" (0.8 s) heard as what he's answering
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'stanley', reveals: ['less'], seg: [211.7, 233.0],
      stem: 'Why does Stanley say he won’t find fault with this actress?',
      choices: ['He feels his time is short, so wants joy', 'He wants others to stop seeing him as a grump',
                'He wants to prove he does have good taste'], a: 0,
      cue: '残りの年数の話と、「old Stanley」の話をつなげて。',
      line: 'my family history says I have less. … the old Stanley Hudson would have found something to complain about…',
      said: '残りの人生は長くないかもしれないと言い、「昔の自分なら文句を言ったが、そんな生き方はだめだ」と続ける。',
      mean: '残り時間を意識したから、楽しむ方を選ぶ。彼の判定は女優より、彼自身の変化の話。',
      trap: '冒頭の「趣味が悪い」や、人の目の話に結びつけやすい。本人が挙げる理由は、年数と生き方。',
      use: 'Life’s too short to complain.（文句を言うには人生は短すぎる）' },
  ]
};
