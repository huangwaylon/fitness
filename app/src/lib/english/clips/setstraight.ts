// “Parks and Recreation | Leslie Sets the World Straight (Episode Highlight)” (the official Parks and Recreation
// channel, Season 6): at Ben's campaign event Leslie starts a statement about her choice, Ben stops her and defends
// her instead, and Leslie answers the questions working mothers always get.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈148 s. Untested: 66–70.4 s (the mailman
// and "men's rights", which needs the episode's backstory), 84.2 s ("Aren't you" in the captions vs "Are you" in
// whisper; f3 trims it out), 140.3 s ("Let them speak" vs "Let Ben speak"; h4 uses only the second chant, which both
// have).
// REVIEW 2026-11-16: pass 9, fix 13, drop 0, new 0; ear checks 1
// EAR CHECK: 102.8 s h3 — "who is taking care of the kids right now?" taken as Ben's (same turn as "no one's ever asked
//   me"); "My mom, babe" is Leslie's
import type { Clip } from '../types.ts';

export const setStraight: Clip = {
  id: 'setstraight', video: 'oMnxPsQanrs', title: 'Leslie Sets the World Straight (Episode Highlight)',
  dur: 170, wpm: 160, band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2/S1 — "goes differently from what he announced" told the reader the economy talk doesn't happen, and
    //   the key was the only choice without it; new stem, three parallel outcomes. Reveals gains 'tired' (the key
    //   says he speaks up for her)
    // why: stops her, back to his plan ← "hang on. Stop." heard as Ben taking the mic back for himself; she finishes,
    //   then his plan ← "a brief statement" + "Recently, I made an attempt to…" is the usual script, and he did say
    //   the economy came first
    { id: 'g1', skill: 'gist', level: 'B2', point: 'turn', reveals: ['silence', 'tired'], seg: [0, 56.2],
      stem: 'What happens after Ben hands the microphone to Leslie?',
      choices: ['He stops her and speaks up for her', 'He stops her and goes back to his plan',
                'She finishes, and then he gives his plan'], a: 0,
      cue: '「But first」のあと、予定がどう変わるか。',
      said: '経済の話をすると言って妻に話を振るが、途中で止めて、彼女を守る話を始める。',
      mean: '予定の政策の話は消え、レスリーへの批判に言い返す場面に変わる。',
      trap: 'Stop. で話を取り戻すように聞こえるが、続くのは彼女を守る話。最後に「好きに話していい」と言う。',
      use: 'Change of plans. Let me say something first.（予定変更。先に一言いいかな）' },

    // R fix: K2 — "angry with the press" was half true (he is tired of everybody's criticism); and V2: the only
    //   negative feeling after "Stop." Now a near sound and a keyword trap, both refuted by "queasy"
    // why: at ease ← "queasy" heard as "easy"; proud of her ← the praise that follows ("a great mother…") pulled onto
    //   this line
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'queasy', seg: [20.2, 27.6],
      stem: 'When Ben stops Leslie, what does he say the situation does to him?',
      choices: ['It makes him feel sick inside', 'It makes him feel at ease',
                'It makes him feel proud of her'], a: 0,
      cue: '「I’m sorry」のあと、文の最後の形容詞。',
      line: 'This whole thing just *makes me queasy*.',
      said: '「待って、やめよう。ごめん、こういうの全部、気分が悪くなる」と止める。',
      mean: 'queasy ＝ 胸がむかむかする落ち着かなさ。この状況に強い違和感がある。',
      trap: 'queasy の後ろが easy に聞こえ、逆の「気楽」に取りやすい。頭の「クウィ」を聞く。',
      use: 'Long bus rides make me queasy.（長いバスは気分が悪くなる）' },

    // R fix: V2/K5 — the key was the only "contradiction" choice; now all three are "praising X leads to Y"
    // why: silence → letting her speak ← the two halves swapped ("will not let her speak" heard as "will let her");
    //   fearing her ← "I will not let her speak" read as fear of what she'll say
    { id: 'h1', skill: 'humor', level: 'C1', point: 'silence', seg: [27.6, 34.3],
      stem: 'What makes Ben’s sentence about his independent wife funny?',
      choices: ['Praising her independence leads to silencing her', 'Praising her silence leads to letting her speak',
                'Praising her leads to admitting he fears her'], a: 0,
      cue: 'and のあと、前半とつながっているかどうか。',
      line: 'I love how *independent* my wife is, and because of that, I *will not let her speak*.',
      said: '「妻の自立したところが大好きだ。だから彼女には話させない」と言う。',
      mean: '自立をほめた直後に、黙らせる宣言。後半が前半を裏切るのが笑い。',
      trap: 'will not let を聞き逃すと、ただの愛妻ほめに聞こえる。前半と後半が合うか確かめる。',
      use: 'I love how honest you are.（君の正直なところが好き）' },

    // R fix: V2 — "didn't match what he meant" was the only repair-shaped choice; now three admissions (key not
    //   strictly shortest: C7)
    // why: only joking ← the Japanese 冗談だよ repair after a bad line, though "The point is…" restates it seriously;
    //   untrue ← wrong read as "false", as if he had told a lie
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'wrong', seg: [27.6, 36.65],
      stem: 'Right after that sentence, what is Ben doing with his next four words?',
      choices: ['Admitting he phrased it badly', 'Admitting he was only joking',
                'Admitting he said something untrue'], a: 0,
      cue: '短い一文のあと、すぐ続く「The point is」。',
      line: 'That *came out wrong*. The point is…',
      said: '「今のは言い方がまずかった」と言い、「要するに」と言い直す。',
      mean: 'came out wrong ＝ 口から出た言葉が意図とずれた。うその告白ではない。',
      trap: 'wrong を「うそ」や「冗談だよ」と取りやすい。came out と組むと「言い方」の話。',
      use: 'Sorry, that came out wrong.（ごめん、今の言い方はよくなかった）' },

    // anchor: 34.4–50.3 s the repair after "That came out wrong": "tired of everybody constantly telling her that she's
    //   making the wrong choice. So, you can say whatever you want" — he lets her speak, and what he stopped was the
    //   answer to her critics
    // why: speak for her ← the slip taken at its word ("I will not let her speak"); off his script ← "independent"
    //   kept, but the wrong implication (she won't follow his plan)
    // retired: g1 reveals its point (silence), so play 3+ under g1 drew no C2
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'silence', reveals: ['wrong', 'tired'], seg: [27.6, 50.55], retired: true,
      stem: 'Once Ben explains himself, what did his slip actually mean to say?',
      choices: ['She shouldn’t have to answer to her critics', 'He would rather speak for her than let her',
                'She is too independent to stick to his script'], a: 0,
      cue: '言い直しのあと、彼が何にうんざりしているか。',
      line: 'I will not let her speak. That came out wrong. The point is… *you can say whatever you want*.',
      said: '「だから話させない」のあと、「彼女を責める声にうんざりだ。好きに話していい」と言い直す。',
      mean: '止めたのは彼女の声ではなく、批判への弁明。言い直しが失言の意図を書きかえる。',
      trap: '失言を字面どおりに取りやすい。came out wrong のあとの The point is が答え合わせ。',
      use: 'You don’t owe anyone an explanation.（誰にも説明する義務はない）' },

    // why: choose between jobs ← "choice" heard without "making the wrong"; choices without asking him ← "she's
    //   making" kept, but the complaint turned on Leslie
    { id: 'd2', skill: 'detail', level: 'B1', point: 'tired', seg: [35.3, 48.75],
      stem: 'What is Ben tired of?',
      choices: ['People saying Leslie made the wrong choice', 'People asking Leslie to choose between jobs',
                'Leslie making big choices without asking him'], a: 0,
      cue: '「I am tired of」のあと、誰が何を言うのか。',
      line: 'I am *tired of everybody* constantly *telling her that she’s making the wrong choice*.',
      said: '「みんながいつも、彼女の選択はよくないと言うのにうんざりだ」と言う。',
      mean: 'tired of ～ ＝ 〜にうんざり。体の疲れではなく、もう聞きたくない気持ち。',
      trap: 'choice から「選ばせる」話に取りやすい。telling her のあとが中身。',
      use: 'I’m tired of hearing that.（それはもう聞き飽きた）' },

    // why: quit the race ← "political consequences" heard as giving up politics; worries a bit ← "care less" read as
    //   "cares a little" (the negative and the comparison lost)
    { id: 'i1', skill: 'infer', level: 'B2', point: 'care', seg: [48.5, 54.3],
      stem: 'What does Ben’s last remark before handing over to Leslie show?',
      choices: ['He’ll back her even if it costs him votes', 'He’s ready to quit the race for Congress',
                'He worries a bit about losing some votes'], a: 0,
      cue: '「whatever you want」のあと、政治について言う部分。',
      line: 'So, you can say whatever you want. I *couldn’t care less* about the political consequences.',
      said: '「何でも言っていい。政治的な影響なんて全く気にしない」と言う。',
      mean: 'couldn’t care less ＝ 全く気にしない。票より妻を取る姿勢。',
      trap: 'less から「少しは気にする」と取りやすいが、意味はゼロ。選挙をやめるとは言っていない。',
      use: 'I couldn’t care less what they think.（どう思われようと全然平気）' },

    // anchor: 56.6–65 s "the first thing I'm going to do is say sorry. I'm sorry that the spotlight is on me and not on
    //   Ben" — the sorry goes to the spotlight; her choice (Ben, 35–48 s: "telling her that she's making the wrong
    //   choice"; Leslie, 122.4 s: "don't judge what someone else has decided to do") is never apologized for
    // R fix: K1 — "A joke; she isn't sorry about anything" was defensible (the swerve does tease the critics'
    //   expectation); now a wrong-target mock reading, refuted by "he is going to make a great congressman"
    // why: for the choice ← "say sorry" heard as giving in to the critics (the expected script); mocking Ben ← right
    //   mechanism (a swerve), wrong target: the line about Ben is praise
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'sorry', seg: [54.3, 65.8],
      stem: 'When Leslie opens her statement, what kind of apology does she make?',
      choices: ['A sincere one, aimed away from her choice', 'A sincere one, for the choice people criticize',
                'A mocking one, aimed at Ben and his campaign'], a: 0,
      cue: '「say sorry」と言ったあと、that に続く中身。',
      line: 'the first thing I’m going to do is *say sorry*. I’m sorry that *the spotlight is on me*…',
      said: '「まず謝ります」と始めるが、謝るのは「注目がベンでなく私にあること」。選んだ道は謝らない。',
      mean: '謝罪を期待させて、謝る中身をすり替える。批判には「選択は謝らない」と答えている。',
      trap: 'sorry が聞こえると、批判を受け入れたと取りやすい。謝罪の向きは that のあとで決まる。',
      use: 'I’m sorry you feel that way.（そう感じさせたならごめんね）' },

    // why: stop his speech ← Ben did stop to speak for her, so an apology for that fits the Japanese frame; late ← an
    //   apology at a public event, and "I just got here" is heard later in the clip
    { id: 'd3', skill: 'detail', level: 'B1', point: 'sorry', seg: [56.0, 65.8],
      stem: 'What is the first thing Leslie says sorry for?',
      choices: ['That people are looking at her, not Ben', 'That Ben had to stop his speech for her',
                'That she was late for Ben’s event'], a: 0,
      cue: '「I’m sorry that」のあと。',
      line: 'I’m sorry that the *spotlight is on me and not on Ben*',
      said: '最初に謝ると言い、「注目がベンでなく私に集まっていること」を謝る。',
      mean: 'spotlight ＝ 注目。ベンはいい議員になる、と話の中心を彼に返す。',
      trap: 'sorry だけ聞くと、演説を止めさせたおわびに取りやすい。sorry that のあとが中身。',
      use: 'I don’t want to steal the spotlight.（主役を取るつもりはないよ）' },

    // R: ear check dropped (the four answer words agree in both sources; addendum)
    { id: 'x1', skill: 'dict', level: 'B2', point: 'gum', seg: [80.0, 84.1],
      stem: 'Type her second answer: “Or my kids ___.” (4 words)', answer: 'got gum in it',
      cue: '「look better」のあと、Or から始まる短い一文。',
      line: 'I just thought it would look better. Or my kids *got gum in it*.',
      said: '髪型の理由に「似合うと思ったから。か、子どもがガムを付けたから」と答える。',
      mean: 'got gum in it が「ガッガミニッ」とつながる。it は髪のこと。',
      trap: 't がほぼ消え、gum in が一語に聞こえやすい。a は言っていない。',
      use: 'The kids got paint on the sofa.（子どもがソファに絵の具を付けた）' },

    // R fix: V2 — the key was the only family-shaped choice; now three readings of "all"
    // why: rich and famous ← "all" read as 富も名声も (the literal "everything"); every job in the campaign ← "all"
    //   tied to the election she has just named
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'haveall', seg: [84.0, 89.4],
      stem: 'What does the second silly question accuse her of trying to do?',
      choices: ['Succeed at work and at home', 'Get rich and become famous', 'Do every job in the campaign'], a: 0,
      cue: '2つめの質問の最後の3語。',
      line: '…trying to *have it all*?',
      said: '「全部手に入れようとしているの？」という質問を読み上げる。',
      mean: 'have it all ＝ 仕事も家庭も両方うまくやること。働く母親への決まり文句。',
      trap: 'all を「富や名声」や「選挙の仕事ぜんぶ」と結びつけやすい。働く母親への決まり文句として覚える。',
      use: 'Nobody can have it all.（何もかも手に入れるなんて無理）' },

    // R fix: V2 — "unsure how to answer" was weak; now "hurt" (the question "accuses" her) competes with "fed up"
    // why: amused ← she has just called them "silly questions"; hurt ← the question reads as an accusation, but her
    //   words are "stupid" and "stop asking", annoyance rather than pain
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'stupidq', seg: [85.6, 89.45],
      stem: 'How does Leslie feel about that question?',
      choices: ['Fed up with hearing it', 'Hurt by what it suggests', 'Amused by how silly it is'], a: 0,
      cue: '質問のあと、短い文がいくつ続くか。',
      line: 'That question *makes no sense*. It’s a *stupid question*. *Stop asking it.*',
      said: '「意味がない。ばかげた質問。もう聞かないで」とたたみかける。',
      mean: '短い文を重ねて、何度も聞かれてうんざりしている気持ちが出ている。',
      trap: '前に silly questions と言うので「おもしろがる」に見えるが、Stop asking it は本気。',
      use: 'Please stop asking me that.（それ、もう聞かないで）' },

    // why: Don't you ← a reproach reading, and n't is easy to imagine; Did you ← only the d is caught
    // R: ear check dropped (both sources have "Do you"; addendum)
    { id: 's1', skill: 'sound', level: 'B2', point: 'doyou', seg: [87.2, 93.2],
      stem: 'Fill the gap: “___ miss your kids while you’re at work?”',
      choices: ['Do you', 'Don’t you', 'Did you'], a: 0,
      cue: '3つめの質問の頭と、答えの最後の一語。',
      line: '*Do you* miss your kids while you’re at work? — Yes, of course I do.',
      said: '「仕事中、子どもが恋しくならない？」と読み上げ、自分で答える。',
      mean: 'Do you は弱く「ジュ」と縮まる。答えも I do と do で返している。',
      trap: 'Don’t なら n が残り、Did なら答えも I did。答えの形から逆算できる。',
      use: 'Do you ever miss home?（家が恋しくなることある？）' },

    // anchor: 91.4–96.5 s "Yes, of course I do. Everybody does." then "And then, you know, sometimes I don't." —
    //   "sometimes" narrows the yes without taking it back; Ben's "Yeah" (96.9 s) agrees
    // why: doesn't miss them at all ← the last negative taken as the real answer (a reversal); hides missing them ← the
    //   modest-downplaying frame, as if "sometimes I don't" were politeness
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'miss', seg: [88.9, 97.2],
      stem: 'What does her last remark add to her answer about missing her kids?',
      choices: ['An honest note that the feeling comes and goes', 'A joke that she doesn’t really miss them at all',
                'A polite way to hide that she misses them a lot'], a: 0,
      cue: '「Everybody does」のあと、文の頭の小さな語。',
      line: 'Yes, of course I do. Everybody does. And then, you know, *sometimes I don’t*.',
      said: '「もちろん恋しい。みんなそう」と答えたあと、「でも、そうでもない時もある」と付け足す。',
      mean: 'sometimes は yes を消さずに範囲をしぼる語。きれいごとで終わらせない正直さが、話の芯。',
      trap: '最後の否定を本音の逆転と取りやすい。sometimes は打ち消しではなく、言い過ぎを直す語。',
      use: 'I love my job. Well, most days.（仕事は好き。まあ、たいていの日はね）' },

    // R fix: V2/K5 — the key was the only general claim against two about Ben's own life; now three "X get questions"
    //   claims, two refuted by "no one's ever asked *me*" (Ben is a man and a parent)
    // why: men get them ← the roles swapped (who is and isn't asked); parents get them ← "where are your kids" heard as
    //   the point, though Ben is a parent too and isn't asked
    { id: 'i2', skill: 'infer', level: 'C1', point: 'double', seg: [96.8, 102.75],
      stem: 'What point is Ben making when he says what he’s never been asked?',
      choices: ['Women get questions that men never get', 'Men get questions that women never get',
                'Parents get questions that others never get'], a: 0,
      cue: '「that question」の that と、me の強さ。',
      line: 'no one’s ever asked *me that question*. No one asked me where are your kids…',
      said: '「その質問、僕は一度もされたことがない。子どもはどこ、とも聞かれない」と言う。',
      mean: '聞かれるのは女性だけ。はっきり言わずに二重の基準を指摘している。',
      trap: 'kids が耳に残ると「親の話」に取りやすいが、聞かれない me も親。対比は男女。',
      use: 'Funny, nobody ever asks me that.（不思議と、僕はそれ聞かれないんだよね）' },

    // R fix: V2/K3 — "asks the crowd to help look after his kids" was a filler; now three "he asks…" readings. N1:
    //   "right?" is the captions', whisper has "right now?"; the line drops it
    // why: a question they can't answer ← "right?" heard as aimed at the audience; testing Leslie ← a quiz reading of
    //   a question asked in public
    { id: 'h3', skill: 'humor', level: 'C1', point: 'kids', reveals: ['double'], seg: [96.8, 106.1],
      stem: 'Right after that, why is Ben’s question about the kids funny?',
      choices: ['He asks the very question he just criticized', 'He asks the crowd something they can’t answer',
                'He asks Leslie a question to test her'], a: 0,
      cue: '「By the way」が2回。2回目のあとに何を聞くか。',
      line: 'By the way, *who is taking care of the kids*…? — My mom, babe. Everything’s fine.',
      said: '男はその質問をされないと言った直後、自分で「子どもは今誰が見てるの？」と聞く。',
      mean: '指摘したばかりの質問を、本人がいちばん気にしていた。',
      trap: '観客への問いに聞こえやすいが、babe と答えるのは妻。直前の自分の指摘とつなげて聞く。',
      use: 'By the way, where did we park?（ところで、車どこに停めたっけ？）' },

    // why: sharply ← a very short reply heard as cold (the Japanese frame); nervously ← Ben's sudden worry carries over
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'mom', reveals: ['kids'], seg: [101.6, 106.1],
      stem: 'How does Leslie answer Ben’s question about the kids?',
      choices: ['Calmly, to put his mind at ease', 'Sharply, annoyed that he asked', 'Nervously, unsure where they are'], a: 0,
      cue: '答えの最後の2語。',
      line: '*My mom, babe. Everything’s fine.*',
      said: '子どもは誰が見ているのかと聞かれ、「母よ。大丈夫」と短く答える。',
      mean: 'babe は夫婦の呼びかけ。Everything’s fine で落ち着かせている。',
      trap: '短い返事は冷たく聞こえがちだが、ここは babe と fine が安心させる合図。',
      use: 'Relax, everything’s fine.（落ち着いて、大丈夫だから）' },

    // R fix: V2/K6 — "waves away as unimportant" was the only dismissive choice; now the Japanese それで？ reading
    //   (admitting a problem) competes, and all three are verb + object
    // why: invites an answer ← a question form taken as a real question; admits a problem ← "So what?" read as stuck
    //   (だから何なんだろう), though "That's good" follows at once
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'sowhat', seg: [105.9, 116.15],
      stem: 'When Ben mentions people’s idea of a candidate’s wife, what does his short question do?',
      choices: ['Dismisses it as not mattering', 'Invites the crowd to answer it', 'Admits it may be a problem'], a: 0,
      cue: '「should be」のあと、すぐ自分で続ける部分。',
      line: 'maybe Leslie doesn’t fit your personal idea… *So what?* That’s good…',
      said: '「レスリーは君たちの妻像に合わないかも。だから何？」と言う。',
      mean: 'So what? は答えを求めない。「問題じゃない」と切り捨てる言い方。',
      trap: '疑問文なので観客への質問に取りやすいが、すぐ That’s good と自分で続けている。',
      use: 'So what if it rains? We’ll go anyway.（雨だから何？どうせ行くよ）' },

    // R fix: V2/K3 — "accept Ben's idea of a good wife" was a filler (Ben gives no such idea); now "do both" is the
    //   keyword trap, and the key no longer echoes "choose" from the career choice
    // why: back women with careers ← "career" is the word that stands out; do both ← "Do both" is heard, "or neither…
    //   doesn't matter" lost
    { id: 'g2', skill: 'gist', level: 'B2', point: 'message', reveals: ['pie'], seg: [105.9, 131.5],
      stem: 'What does Leslie’s closing point ask of the audience?',
      choices: ['To stop judging how others live', 'To support women who choose a career',
                'To try to do both, career and home'], a: 0,
      cue: '最後の Just のあとと、I mean のあと。',
      line: 'Just *don’t judge* what someone else has decided to do.',
      said: '「人が決めたことを裁かないで。みんな自分の道を探しているだけ」と締める。',
      mean: '家庭か仕事かの話を、誰でも生き方を選んでいい、という話にまとめている。',
      trap: 'career が耳に残るので「働く女性を応援」に取りやすいが、パイを焼く人も認めている。',
      use: 'Don’t judge. Everyone has their reasons.（責めないで。みんな事情がある）' },

    // R fix: V2 — the key was the only all-inclusive choice; now its mirror ("except neither") is the near miss
    // why: except neither ← "Do both" heard, "Or neither" lost; only a career, or both ← "career" comes second and
    //   sounds like the point
    { id: 'd4', skill: 'detail', level: 'B2', point: 'pie', seg: [116.1, 122.35],
      stem: 'In Leslie’s pie-and-career examples, which choices does she call fine?',
      choices: ['Every option, even neither', 'Every option, except neither', 'Only a career, or both'], a: 0,
      cue: '「Do both」のすぐあと、短い2語。',
      line: 'If you want to have a career, that’s great, too. Do both. *Or neither.* It doesn’t matter.',
      said: '「パイを焼くのもいい。仕事もいい。両方でも、どちらもしなくても」と言う。',
      mean: 'neither ＝ どちらもしない。どの選び方も同じように認める並べ方。',
      trap: 'Or neither は短く速く、聞き落としやすい。both の直後の「オア」を聞く。',
      use: 'Tea or coffee? — Neither, thanks.（紅茶かコーヒー？―どちらも結構です）' },

    // why: mostly boos ← "boos" is heard first; mostly cheers ← the speech has just ended and "Let Ben speak!" sounds
    //   like support
    { id: 'n1', skill: 'number', level: 'B1', point: 'split', seg: [136.5, 140.25], keep: true,
      stem: 'At the end, how does someone size up the crowd’s reaction?',
      choices: ['Mostly boos', 'Half boos, half cheers', 'Mostly cheers'], a: 1,
      cue: '最後の場面、boos and cheers の前の数字。',
      line: 'Say that’s *50/50* boos and cheers. — That seems about right.',
      said: '最後に「ブーイングと歓声が半々か」「そんなもんだね」と言い合う。',
      mean: '50/50 ＝ fifty-fifty、半分ずつ。賛否が分かれたのを当然と受け止めている。',
      trap: 'boos が先に聞こえると「ほとんどブーイング」に取りやすい。fifty の強勢は前。',
      use: 'It’s fifty-fifty whether it rains.（雨が降るかは五分五分）' },

    // R fix: V2 — "a speech that already happened" was the only coherent joke; now three readings of the chanter. S4:
    //   the segment began at 140.0 s, taking in the first chant ("Let them speak", captions only); now 141.4 s
    // why: means Leslie ← she has just spoken, and a chant for "them" is heard nearby; mocking Ben ← irony read into a
    //   sincere "Oh, sorry… My bad"
    { id: 'h4', skill: 'humor', level: 'C1', point: 'late', seg: [141.4, 148.9],
      stem: 'Why is the late chant of “Let Ben speak!” funny?',
      choices: ['The chanter missed Ben’s speech', 'The chanter means Leslie, not Ben', 'The chanter is mocking Ben’s speech'], a: 0,
      cue: '叫び声への返事と、そのあとのおわび。',
      line: '*Let Ben speak!* — *He just spoke!* — Oh, sorry. I *just got here*.',
      said: '「ベンに話させろ！」と叫ぶ人に「もう話したよ！」。その人は「ごめん、今来た」。',
      mean: '熱心な支持者が演説を見逃した。My bad は軽い謝り方。',
      trap: '皮肉や人ちがいに取りやすいが、Oh, sorry, I just got here は素直なおわび。',
      use: 'My bad, I just got here.（ごめん、今来たところ）' },
  ]
};
