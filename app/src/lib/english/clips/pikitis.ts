// REVIEW 2026-11-16: pass 6, fix 17, drop 0, new 0; ear checks 1
// OPEN: h1's "jokes back" distractor is refuted by the words (a bare fact, no joke) but also by the flat delivery; worth a listen.
// “Greg Pikitis | Parks and Recreation” (the official Parks and Recreation channel, Season 2): Leslie is sure a teen,
// Greg Pikitis, vandalized her office on Halloween; the officer doubts it, Andy's questioning flops, and Greg picks her
// case apart. Speakers are named only where the audio names them (Leslie, Andy, Greg); the officer is never named.
// Segments from the captions, words from whisper (2026-11-16). Whisper loops one line from ≈ 200 s (hallucination);
// nothing is built after 199.4 s. Captions say "telling" at 19.8 s (whisper "tailing") and "could be in the same fruit"
// at 154.8 s (whisper "could have eaten"): no key or line rests on either. Captions time "frankly" at 210.8 s, whisper
// at ≈ 198 s; a3's line stops before it.
// EAR CHECK: 72.0 s h2 — the offer and the advice are assumed Andy's (“boss”; Leslie names him at 62 s and 127 s)
import type { Clip } from '../types.ts';

export const pikitis: Clip = {
  id: 'pikitis', video: 'fDzT9ZqaGrM', title: 'Greg Pikitis', dur: 219, wpm: 172, band: 'fast',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: an hour or so ← "couple" heard as a vague small amount; all night ← Greg's "parking lot all night" later
    { id: 'n1', skill: 'number', level: 'B1', point: 'hours', reveals: ['sure'], seg: [19.2, 23.95], keep: true,
      stem: 'When the officer doubts it was the kid, what length of time does he give?',
      choices: ['an hour or so', 'a couple of hours', 'all night'], a: 1,
      cue: '「that kid for」のあと。',
      line: '…that kid for *a couple of hours*.',
      said: '「あの子を2、3時間つけていた」と言い、だから犯人ではないと考えている。',
      mean: 'a couple of ＝ 2つ、または2、3の。ここでは「2時間くらい」。',
      trap: 'あとで all night も出るので混ざりやすい。この場面の数は hours の前を聞く。',
      use: 'I’ll be back in a couple of hours.（2、3時間で戻ります）' },

    // R fix: blind-guessable (only choice with content); "corrects" now "isn't sure of the time", a hedge reading (V2/K6)
    // why: not sure ← "I mean" heard as a hedge on the number; fills a pause ← I mean read as えっと, a hesitation
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['sure'], seg: [19.2, 23.95],
      stem: 'After the officer gives the time, what does the start of his next sentence do?',
      choices: ['Leads into what he concludes from it', 'Admits he isn’t sure of the time he gave',
                'Fills a pause while he finds his words'], a: 0,
      cue: '時間を言った直後、文頭の2語。',
      line: '*I mean*, it must have been somebody else.',
      said: '「つまり、ほかの誰かのはずだ」と、つけていた事実から結論を言う。',
      mean: 'この I mean は「だから」。前の事実から言えることを続ける合図。',
      trap: 'I mean はぼかしや「えっと」にも使うが、ここは前の内容を結論につなげている。次の文の中身で判断する。',
      use: 'I mean, it’s only ten minutes away.（つまり、ほんの10分の距離だよ）' },

    // R fix: blind-guessable (main character vs. sceptic is the obvious split); all three now start with her certainty (V2/K5)
    // why: won over ← "Okay" after the evidence heard as agreement; wants proof ← "need a confession" + the usual cop script
    { id: 'g1', skill: 'gist', level: 'B2', point: 'sure', seg: [19.2, 71.5],
      stem: 'Across these first scenes, where do Leslie and the officer stand on the kid?',
      choices: ['She’s sure the kid did it, but the officer doubts it',
                'She’s sure the kid did it, and her evidence wins the officer over',
                'She’s sure the kid did it; the officer agrees but wants proof'], a: 0,
      cue: '「somebody else」と「Yeah, he did」の言い手。',
      said: '警官は「ほかの誰かだ」「彼じゃないと思う」、Leslie は「いや、彼よ」と言う。',
      mean: '証拠が弱くても決めつける Leslie と、冷静な警官の対立が軸。',
      trap: '警官の Okay は同意ではなく相づち。否定の文をだれが言うかを追う。',
      use: 'I’m telling you, it was him.（だから、あいつだってば）' },

    // why: plum pit ← Greg's "plum" later, in the wrong relation; playing card ← "ace of spades… calling card" right after
    { id: 'd1', skill: 'detail', level: 'B1', point: 'pit', seg: [30.9, 36.55],
      stem: 'What does Leslie say her piece of evidence is?',
      choices: ['A peach pit', 'A plum pit', 'A playing card'], a: 0,
      cue: '「This is a」のあと。',
      line: '*This is a peach pit.* … He was eating a peach when I went to go talk to him.',
      said: '「これは桃の種。話しに行ったとき、彼は桃を食べていた」と言う。',
      mean: 'pit ＝ 桃やさくらんぼなどの大きな種。これを犯人の証拠と見ている。',
      trap: 'あとで plum やトランプの話も出るので混ざりやすい。This is a のすぐあとを聞く。',
      use: 'Watch out, there’s a pit in it.（気をつけて、種が入ってるよ）' },

    // R fix: key was the only choice with intent; "without noticing" now "to frame someone else" (V2/K6)
    // why: frame someone ← a planted clue is the usual crime-show twist; name card ← card read literally (名刺)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'callcard', seg: [36.55, 40.6],
      stem: 'As Leslie goes on about the evidence, what is she claiming?',
      choices: ['He leaves it on purpose, as his sign', 'He left it there to frame someone else',
                'He left a card with his name on it'], a: 0,
      cue: '「ace of spades」に続く、card で終わる言い方。',
      line: 'This is his ace of spades. This is his *calling card*… what he *leaves all his victims*.',
      said: '「彼のスペードのエース、彼の印。被害者みんなに残すもの」と言う。',
      mean: 'calling card ＝ 犯人がわざと残す「自分の仕業」の印。刑事ドラマ風。',
      trap: 'card から名刺を思い浮かべやすいが比喩。his が続くので、ほかの人に罪を着せる話でもない。',
      use: 'Being late is kind of his calling card.（遅刻は彼のトレードマークみたいなもの）' },

    // R fix: key was the only nuanced contrast; distractors now also read the exchange as a move (V2/K6)
    // why: excuse ← a cop who doubts her might dodge the work; jokes back ← her over-the-top TV lines heard as a joke he answers in kind
    { id: 'h1', skill: 'humor', level: 'C1', point: 'lab', reveals: ['pit'], seg: [36.55, 45.45],
      stem: 'Why does the officer’s reply to her orders get a laugh?',
      choices: ['Her TV-cop order meets a town that lacks the basics',
                'He makes up an excuse so he can skip a dull job',
                'He takes her big order as a joke and jokes back'], a: 0,
      cue: '「send this to」のあとの、短い返事。',
      line: 'And it’s still warm. … go and arrest him and send this to the lab. — *We don’t have a lab.*',
      said: '「まだ温かい。逮捕して鑑識に回して」と言うと「鑑識はない」と返される。',
      mean: '刑事ドラマのような指示に、小さな町の現実がそっけなく返る落差が笑い。',
      trap: '言い訳や冗談返しと取りやすいが、平たい声のただの事実。大げさな指示との差を聞く。',
      use: 'Sorry, we don’t have one here.（すみません、ここには置いてないんです）' },

    // R fix: distractors were thin; now an undecided reading and a literal "what to tell" reading (V2)
    // why: undecided ← "don't know" taken literally; asks her ← "what to tell you" read as asking what to say to the kid
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'softener', reveals: ['sure'], seg: [54.7, 58.4],
      stem: 'Right after Leslie mentions the kid’s “obvious guilt”, what does the reply’s opening do?',
      choices: ['Softens the disagreement that follows', 'Shows he hasn’t made up his mind yet',
                'Asks her what to say to the kid'], a: 0,
      cue: '名前を呼んだ直後の決まり文句と、次の文。',
      line: 'Leslie, *I don’t know what to tell you*. I don’t think he did it.',
      said: '「Leslie、何と言えばいいか…彼がやったとは思えない」と言う。',
      mean: '反対意見の前のクッション。「悪いけど」に近く、このあと本題が来る。',
      trap: '文字通り「迷っている」と取りやすい。この形のあとには、相手が聞きたくない一言が来る。',
      use: 'I don’t know what to tell you, sir.（お客様、申し訳ないのですが…）' },

    // why: a walk ← "take a walk" is said, but of Leslie and Andy; Andy with pliers ← "Andy" and "pliers" in one turn
    { id: 'd3', skill: 'detail', level: 'B2', point: 'pliers', seg: [61.5, 67.7],
      stem: 'What is Leslie’s plan for getting the confession?',
      choices: ['Leave the officer alone with the kid and pliers', 'Take the kid out on a walk until he talks',
                'Have Andy question the kid with the pliers'], a: 0,
      cue: '「take a walk」のあと、「just you」に続く部分。',
      line: 'Andy and I are going to take a walk. And it’s gonna be *just you*, Pikitis, *and these pliers*.',
      said: '「Andy と私は散歩。あとはあなたと彼とペンチだけ」と言う。',
      mean: '自分たちは席を外すから、ペンチで白状させて、という遠回しな指示。',
      trap: 'take a walk と Andy が先に聞こえ、二人がやると思いやすい。you がだれかを聞く。',
      use: 'Let’s take a walk and talk about it.（歩きながら話そう）' },

    // R fix: key was the only two-part, nuanced choice; all three now short and parallel (V2/K6)
    // why: takes it back ← Japanese frame: a short denial heard as backing down; Andy ← he volunteers right after
    { id: 'i1', skill: 'infer', level: 'C1', point: 'torture', reveals: ['pliers'], seg: [67.55, 71.6],
      stem: 'What does Leslie’s quick reply to the officer’s refusal suggest?',
      choices: ['She dodges his word but keeps the plan',
                'She takes it back and calls it a joke',
                'She hands the job to Andy instead'], a: 0,
      cue: '警官の「not gonna」のすぐあと、短い返事。',
      line: 'Look, I’m not gonna torture this kid. — *Nobody said torture.*',
      said: '「拷問なんかしない」と言われ、「拷問なんて誰も言ってない」と返す。',
      mean: '言葉だけ否定して、ペンチの計画は引っ込めていない。そのとぼけ方がおかしい。',
      trap: '短い否定は日本語の感覚だと「引き下がった」に聞こえやすい。謝る言葉がない点に注目。',
      use: 'Nobody said it would be easy.（簡単だなんて誰も言ってない）' },

    // R fix: meaning picked the offer form; "didn't" now "you and me", a second offer that sounds alike (V2)
    // why: won't ← same shape, heard as a complaint; you and me ← "let me" and "and me" blur in fast speech, and both make an offer
    { id: 's1', skill: 'sound', level: 'B2', point: 'whydont', reveals: ['run'], seg: [71.35, 77.0],
      stem: 'Fill the gap: “___ take a run at him, boss?”',
      choices: ['Why don’t you let me', 'Why don’t you and me', 'Why won’t you let me'], a: 0,
      cue: '文の最初。Why のあとの短い否定の音。',
      line: '*Why don’t you let me* take a run at him, boss?',
      said: '「僕にやらせて」と申し出る。don’t you は「ドンチュ」とつながる。',
      mean: '理由を聞く文ではなく、自分がやると申し出る決まった形。',
      trap: 'won’t は口が丸い「ウォウン」。let me の l も弱いので and me と迷いやすい。塊で覚える。',
      use: 'Why don’t you let me carry that?（それ、持ちましょうか）' },

    // R fix: the stem asked what was offered *to her*, but the speaker offers to do it himself (K1); pliers swapped for
    // "take a walk", the near chunk said just before (V2)
    // why: chase ← run read literally (走る); a walk ← "take a run" ≈ Leslie's "take a walk" a few seconds earlier
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'run', reveals: ['whydont'], seg: [71.35, 79.2],
      stem: 'When Leslie gets called “boss”, what is the speaker offering to do?',
      choices: ['Have a go at questioning the kid', 'Chase after the kid if he runs', 'Take the kid out for a walk'], a: 0,
      cue: '「let me」のあと、at him で終わる言い方。',
      line: 'Why don’t you let me *take a run at him*, boss?',
      said: '「僕にあいつをやらせてみない？」と、取り調べ役を買って出ている。',
      mean: 'take a run at ＝ 〜に挑んでみる。ここでは「自分が尋問してみる」。',
      trap: 'run を「走る」と取ると追う話、take a walk と混ぜると散歩に。at＋人は「挑む」。',
      use: 'Let me take a run at this problem.（この問題、私がやってみる）' },

    // R fix: distractors were weak; the insult reading is now "the halves contradict", for a listener who catches only "think like" twice (V2)
    // why: ex-criminal ← "think like one of these guys" heard as a confession; contradict ← two halves heard as a contrast
    { id: 'h2', skill: 'humor', level: 'C1', point: 'thinklike', seg: [73.8, 79.3],
      stem: 'Why does Andy’s advice about understanding the kid get a laugh?',
      choices: ['Its two halves say exactly the same thing', 'He lets slip he once was one of these guys',
                'Its second half flips what the first half says'], a: 0,
      cue: '文の前半と後半を比べて。',
      line: 'In order to *think like* one of these guys, you have to *think like them*.',
      said: '「こういう連中のように考えるには、連中のように考えないと」と言う。',
      mean: 'もっともらしい格言の形だが、前と後ろが同じことの繰り返しで中身がない。',
      trap: 'one of these guys を自分のことと取ると告白に聞こえる。前後を比べると、まったく同じ形。',
      use: 'To get better, you have to practice.（上手くなるには練習しかない）' },

    // why: coffee ← his "boiling hot coffee" line earlier; FBI act ← "Burt Macklin… FBI" makes the tears look like a trick
    { id: 'h3', skill: 'humor', level: 'C1', point: 'allergic', seg: [119.8, 126.6],
      stem: 'When Leslie asks about his tears, why is Andy’s answer funny?',
      choices: ['He blames them on an allergy nobody has', 'He blames them on the hot coffee he offered',
                'He claims they are part of his FBI act'], a: 0,
      cue: '「not crying」のあと、もう一文。',
      line: 'It’s an awful thing to say to a human being. … I’m not crying, okay? *I’m allergic to jerks.*',
      said: 'ひどいことを言われたと訴え、泣いてるのか聞かれて「嫌なやつアレルギー」と言う。',
      mean: '泣いたのを認めたくなくて、ありえないアレルギーを出す言い訳が笑い。',
      trap: '前の coffee や FBI の芝居と結びつけやすいが、本人は傷ついている。直前の文を聞く。',
      use: 'I’m not crying, it’s just my allergies.（泣いてないよ、花粉症なだけ）' },

    // R fix: key was the only "though" choice and the only one echoing "don't care"; distractors now echo it too (V2/K6)
    // why: relieved ← he was in tears, so leaving looks like an escape; fine with it ← "I don't care" read at face value
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'sulk', reveals: ['allergic'], seg: [123.05, 130.3],
      stem: 'When Leslie sends Andy out, how does he take it?',
      choices: ['Hurt, though he says he doesn’t care', 'Relieved, as the kid was getting to him',
                'Fine with it, as he says he doesn’t care'], a: 0,
      cue: '最初の一語のあと、二つの短い文の中身。',
      line: 'I’m allergic to jerks. — Okay, Andy out. — *Fine, I don’t even care. It’s stupid.*',
      said: '泣いたのを否定し、外されて「別にいい、どうでもいい、くだらない」と言う。',
      mean: '気にしてないと言うほど、すねているのが分かる。強がりの言い方。',
      trap: 'Fine や don’t care を文字通り取りやすい。It’s stupid のとげと直前の涙で読む。',
      use: 'Fine, whatever. I don’t care.（はいはい、どうでもいいよ）' },

    // R fix: choices were not parallel and only the key sounded like a stance; all three now "She's going to…" (V2/K5)
    // why: a deal ← the usual cop-show move when talks turn serious; bare hands ← gloves + evidence handling, read literally
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'gloves', seg: [130.9, 134.6],
      stem: 'As Leslie takes over from Andy, what does her first line announce?',
      choices: ['She’s going to stop going easy on him', 'She’s going to offer the kid a deal now',
                'She’s going to handle evidence bare-handed'], a: 0,
      cue: '「Okay」のあとの短い一文。',
      line: 'Okay. *The gloves are coming off.*',
      said: 'Andy に代わって「さあ、手加減はなしよ」と言う。',
      mean: '遠慮をやめて本気で行く、という決まり文句。ボクシングから来た。',
      trap: '手袋から「素手で触る」を思い浮かべやすいが比喩。取引ではなく、対決の前ぶれの決まり文句。',
      use: 'Okay, the gloves are off now.（よし、ここからは本気だ）' },

    // R fix: distractors were thin; now "admits but laughs it off" (the sarcasm half-heard) and a friend (V2)
    // why: laughs it off ← "you nailed me" taken literally, the mocking tone heard as a shrug; a friend did it ← "two different people" + "all night"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'holes', reveals: ['nailed', 'alibi', 'plum'], seg: [131, 191.6],
      stem: 'How does Leslie’s questioning of Greg turn out?',
      choices: ['He knocks down each point she makes', 'He admits it, but laughs it off as a prank',
                'He claims a friend was the one who did it'], a: 0,
      cue: '彼女の話のあと、Greg がどう言い返すか。',
      said: '桃の話には「実はプラム」、夜の話には「つけてたなら僕じゃない」と返す。',
      mean: 'Leslie の証拠は一つずつ崩され、最後は脅すしかなくなる流れ。',
      trap: 'you nailed me を「参った」と取ると白状に聞こえる。直後の皮肉と言い返しまで聞く。',
      use: 'That doesn’t prove anything.（それじゃ何の証明にもならないよ）' },

    // why: office ← "my office gets vandalized" next; parking lot ← "parking lot all night" later
    { id: 'd2', skill: 'detail', level: 'B1', point: 'school', reveals: ['were', 'pit'], seg: [139.25, 142.6],
      stem: 'Where does Leslie say she saw Greg eating?',
      choices: ['At his school', 'At her office', 'In the parking lot'], a: 0,
      cue: '「came to visit you」のあと。',
      line: 'When I came to visit you *at the school*, you were eating a peach.',
      said: '「学校に会いに行ったとき、あなたは桃を食べていた」と言う。',
      mean: 'その桃と、あとで机に残された種を結びつけて、犯人だと言っている。',
      trap: 'このあと office や parking lot も出てくる。visit you のすぐあとの場所を聞く。',
      use: 'I came to visit you at work.（職場に会いに来たよ）' },

    // R fix: "came to visit" in the stem let tense pick the key; the stem now starts at the gap (V2/S2)
    // why: you're ← were weakens to "yer", like you're; weren't ← a final -n't heard where there's none
    { id: 's2', skill: 'sound', level: 'B2', point: 'were', reveals: ['pit', 'school'], seg: [139.25, 142.6],
      stem: 'Fill the gap: “… ___ a peach.”',
      choices: ['you were eating', 'you’re eating', 'you weren’t eating'], a: 0,
      cue: '場所を言ったあと、you に続く弱い音。',
      line: 'When I came to visit you at the school, *you were eating* a peach.',
      said: '「会いに行ったとき桃を食べていた」と言う。were は弱く「ワ」程度に縮む。',
      mean: 'came と同じ過去の話なので were。その時点でしていたことを表す。',
      trap: '弱い were は you’re に聞こえやすい。came が過去なら、続きも過去と考える。',
      use: 'You were sleeping when I called.（電話したとき寝てたでしょ）' },

    // R fix: distractors were one-part and blunt; all three now two-part readings of "Wow, you nailed me" (V2/K6)
    // why: admits ← "you nailed me" taken literally, the jokey tone heard as laughing it off; praising ← "Wow" read as admiration, the plum as one gap
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'nailed', reveals: ['plum'], seg: [150.2, 164.9],
      stem: 'How does Greg answer Leslie’s case against him?',
      choices: ['Mocking her by pretending she caught him', 'Admitting she caught him, but laughing it off',
                'Praising her work, then pointing out one gap'], a: 0,
      cue: '最初の「Wow」のあと、最後の一文まで。',
      line: 'Wow, *you nailed me*. I mean, there’s no way that two different people… Never mind that I was actually eating a plum…',
      said: '「わあ、参った」と言い、同じ果物を食べた人が二人いるはずないと続け、実はプラムだったと言う。',
      mean: '認めるふりをして、証拠のおかしさを笑う皮肉。',
      trap: 'nailed me を文字通り「捕まった」と取りやすい。ほめ言葉のあとに反対の事実が来たら皮肉。',
      use: 'Wow, great plan. Really.（へえ、すごい計画だね。ほんとに）' },

    // R fix: "really" in the stem ruled out peach for a blind reader; dropped (V2/S1)
    // why: peach ← Leslie's story says peach; pear ← the p- and long vowel are close to peach
    { id: 'd4', skill: 'detail', level: 'B1', point: 'plum', reveals: ['pit'], seg: [159.3, 164.6],
      stem: 'What does Greg say he was eating when Leslie saw him?',
      choices: ['A plum', 'A peach', 'A pear'], a: 0,
      cue: '「actually eating」のあと。',
      line: 'Never mind that I was actually eating *a plum* when you saw me earlier.',
      said: '「そもそも、あのとき食べていたのはプラムだった」と言う。',
      mean: 'Never mind that… ＝「〜は別としても」。決定的な事実をさらりと出す。',
      trap: '桃の話が続いたあとなので peach と思いこみやすい。actually のあとに本当の話が来る。',
      use: 'Never mind that it’s raining.（雨なのはまあいいとして）' },

    // R fix: "other kid" was weak; now "she must have seen who did it", the wrong implication of "you know" (V2)
    // why: broke the law ← "followed you all night" sounds like stalking; saw who did it ← "then you know" read as "you know who"
    { id: 'i2', skill: 'infer', level: 'B2', point: 'alibi', reveals: ['followed'], seg: [173.55, 184.8],
      stem: 'Once Greg learns how Leslie knows where he was, what does he point out?',
      choices: ['Her own story shows he couldn’t have done it', 'She broke the law by following him all night',
                'She must have seen who really did it, then'], a: 0,
      cue: '「genius」のあと、If で始まる文。',
      line: 'Because I followed you, genius. — If you followed me all night, then you know that *it wasn’t me*.',
      said: '「一晩じゅうつけていたなら、僕じゃないって分かるはず」と言い返す。',
      mean: 'Leslie 自身が彼のアリバイの証人になっている、という皮肉な結果。',
      trap: 'つけたこと自体を責めていると取りやすいが、突いているのは話の矛盾。If…then の形で聞く。',
      use: 'If you were there, then you know.（その場にいたなら分かるでしょ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'followed', seg: [176.2, 180.5],
      stem: 'Type Leslie’s answer: “___, genius.” (4 words)', answer: 'because i followed you',
      cue: '「all night?」と聞かれた直後。',
      line: '*Because I followed you*, genius.',
      said: '「あなたをつけていたからよ、天才くん」と答える。',
      mean: 'genius はここでは皮肉。followed you は「フォロウジュ」とつながる。',
      trap: 'Because は弱く「ビコズ」程度、followed の ed も you に飲まれる。塊で聞く。',
      use: 'I followed the signs to the station.（標識をたどって駅に行った）' },

    // R fix: "Glad someone takes crime seriously" was a filler; now a soft "fond, but she goes too far" reading (V2/K3)
    // why: hopeful ← "make a good cop" heard with the not lost; fond ← Japanese frame: frankness read as gentle teasing
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'scary', seg: [192.0, 199.4],
      stem: 'In the last talking head, how does the speaker feel about Leslie as a cop?',
      choices: ['Worried about her ever being in charge', 'Sure she’d make a good cop with practice',
                'Fond of her, though she goes a bit far'], a: 0,
      cue: '最初の「I don’t think」と、次の文の形容詞。',
      line: 'I don’t think she would make a good cop. I would be *frightened* to live in a town that she’s the cop of…',
      said: '「いい警官にはならない。彼女が警官の町に住むのは怖い」と言う。',
      mean: '取り調べの暴走ぶりを見て、権力を持たせたら危ないと感じている。',
      trap: 'I don’t think の否定が文頭にあるので、make a good cop だけ拾うと逆になる。',
      use: 'I don’t think that’s a good idea.（それはやめたほうがいいと思う）' },
  ]
};
