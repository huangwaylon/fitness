// REVIEW 2026-11-16: pass 9, fix 14, drop 1, new 1; ear checks 2
// REVIEW open: n1 (teams of two) was kept at 55 % blind. The pairs are picked on screen all scene long, and the clip has
//   no other number. Keep it, or retire it and accept no number item?
// “Young Jim, there's just so much I need to warn you about - The Office US” (the official The Office channel, BEST OF
// SEASON 3): Michael pairs the staff up for sales calls (Andy picks him with a grand title, Stanley tries to pass, Jim
// and Dwight are left together), dresses the day up as "the Amazing Race", and can't say what makes it one.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈171 s; whisper loops one invented line
// after 183 s. The sources differ at 63 s (“take the kid” / “the gift”), 53 s (“Stan Lee” / “Stanley”), 39.5 s (“I'm
// now going by” / “Now, going by”) and 125.7 s (“A Amazing Race” / “are we Amazing Race”); no key rests on those words.
// Left out on purpose: 98–104 s and 146–162 s (short overlapping shouts and a visual gag), the team nicknames at
// 115–124 s (world knowledge of the TV show), and who says “Does anyone want to trade?” (stems leave it out).
// EAR CHECK: 83.2 s h4 nt1 — “Oh, young Jim… tragically, I cannot” is assumed to be Jim's talking head, going on from
//   “Dwight and I used to go on sales calls” (both sources run the two lines on; neither names the speaker)
// EAR CHECK: 56.5–57.5 s nt3 — both sources have “You got to pick somebody” with no “'ve”; confirm no “you've” is
//   heard before the C2 dictation keys on “you got to”
import type { Clip } from '../types.ts';

export const youngjim: Clip = {
  id: 'youngjim', video: 'JIs7qNQcQAE', title: 'Young Jim, there\'s just so much I need to warn you about',
  dur: 197, wpm: 148, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): "sit down" and "on a team" were weak; "politely welcoming him in" fits an arrival too,
    //   and only "finally" refutes it
    // why: welcoming ← "care to join us" read word by word as a polite greeting to someone arriving; sales team ← "join
    //   us" heard as joining a team, which the meeting is about
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'late', seg: [0, 4.6],
      stem: 'What is “Dwight, care to join us…” doing at the very start?',
      choices: ['Pointing out that he is late', 'Politely welcoming him in', 'Inviting him onto a sales team'], a: 0,
      cue: '文の最後に付く、一語の副詞。',
      line: 'Dwight, care to join us, *finally*?',
      said: '入ってきた Dwight に「ご一緒いただけますかね、やっと」と言う。',
      mean: 'care to ～? は丁寧な誘いの形。最後の finally で「遅いぞ」という皮肉になる。',
      trap: 'care to を文字どおりの誘いと取りやすい。文末の一語で調子が決まる。',
      use: 'Nice of you to finally show up.（やっと来たね）' },

    // why: manners ← "pass the …" is table talk, so the dig sounds like it is about how he eats; cooking ← a sauce
    //   name heard as a remark on food he made
    { id: 'h1', skill: 'humor', level: 'C1', point: 'late', seg: [0, 9.6],
      stem: 'What is the joke when Dwight is asked to pass a sauce?',
      choices: ['Its name is twisted to mock his lateness', 'Its name is twisted to mock his table manners',
                'Its name is twisted to mock his cooking'], a: 0,
      cue: '「sauce」の直前の一語の音。',
      line: '…care to join us, finally? … pass the *tardy sauce*. Get it, Michael?',
      said: '「tardy ソースを取って」と言い、Michael に「分かる？」と聞く。',
      mean: 'tardy ＝ 遅刻した。似た音のソース名にかけて、遅れた Dwight をからかう。',
      trap: '「取って」でマナーの話に聞こえやすい。Get it? はだじゃれの合図。',
      use: 'Get it? It’s a pun.（分かる？だじゃれだよ）' },

    // R fix: V2 (blind 80 %): "lead sales" was a weak filler; "train the new staff" fits the picks of Karen and "the
    //   kid", and "team up for sales calls" refutes it
    // why: training ← the new people are picked one by one, heard as matching them with mentors; ranking ← "dream team"
    //   + "seniority" heard as ranking people by sales
    { id: 'g1', skill: 'gist', level: 'B1', point: 'pairs', reveals: ['two'], seg: [9.5, 72.5],
      stem: 'What is the meeting for?',
      choices: ['Pairing people up for sales calls', 'Picking who will train the new staff', 'Ranking people by their sales so far'], a: 0,
      cue: '最初の dream team のあとの一文。',
      line: 'Today, we are going to *team up for sales calls*.',
      said: '「今日は組になって営業回りをする」と告げ、順番に相手を選ばせていく。',
      mean: 'team up ＝ 組む。代表選びではなく、二人一組を作っていく場面。',
      trap: 'dream team や pick first で「代表選び」に聞こえやすい。最初の一文で目的を。',
      use: 'Let’s team up on this project.（この企画、組んでやろう）' },

    // why: top seller ← "pick first" read as a reward for results; first in ← the scene opened on someone arriving late
    { id: 'd1', skill: 'detail', level: 'B1', point: 'idea', seg: [14.0, 20.6],
      stem: 'Why does Andy get to pick first?',
      choices: ['Teaming up was his idea', 'He sells more than anyone', 'He got to the room first'], a: 0,
      cue: 'Andy と呼んだ直後、since のあと。',
      line: 'Andy, since this was *your idea*, you get to pick first.',
      said: '「Andy、これは君の発案だから、最初に選んでいい」と言う。',
      mean: 'since ＝ 〜だから。理由を先に言ってから、最初に選ぶ権利を与えている。',
      trap: 'pick first から「一番の成績」と想像しやすい。since のあとに理由がそのまま来る。',
      use: 'Since you cooked, I’ll do the dishes.（作ってくれたから、皿は洗うよ）' },

    // why: tease ← a title this grand often mocks someone; lessons ← "doctor of sales" heard as thanks to a teacher
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'doctor', seg: [24.3, 38.4],
      stem: 'When Andy finally names his pick, how does he mean it?',
      choices: ['As praise meant to win the boss over', 'As a tease about the boss acting smart', 'As thanks for the boss’s sales lessons'], a: 0,
      cue: '名前のあとの肩書きと、そのあとのやり取り。',
      line: 'Michael Scott, *PhD, doctor of sales*. … it is very gracious of you *to accept*.',
      said: '迷うふりのあと「Michael Scott、営業の博士」と上司を選び、受けてくれた礼まで言う。',
      mean: '大げさな肩書きは、上司を持ち上げるため。選んだ側がお礼まで言うのも同じ。',
      trap: '大げさな呼び方はからかいにも聞こえる。そのあとの返し合いで判断する。',
      use: 'You’re the expert here.（ここはあなたが専門家だから）' },

    // why: best seller ← "senior" read as 上級 (the best); Andy ← Andy just picked, so the turn seems to be his to give
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'senior', seg: [38.1, 44.6],
      stem: 'How will the next turn to pick be decided?',
      choices: ['The longest-serving person goes next', 'The best seller this year goes next', 'The person Andy points to goes next'], a: 0,
      cue: 'Okay のあと、by で始まる言い方。',
      line: '*going by seniority*, Phyllis, our resident senior.',
      said: '「次は年功順で、わが社の長老、Phyllis」と指名する。',
      mean: 'go by ～ ＝ 〜に従って決める。seniority は勤めた年数の長さ。',
      trap: 'senior を「上級＝できる人」と取ると成績順に聞こえる。go by のあとは順番の基準。',
      use: 'We’ll go by first come, first served.（先着順でいきます）' },

    // why: top seller ← "senior" heard as a compliment on her work; youngest ← "same age" heard as a claim about
    //   everyone in the room
    { id: 'h2', skill: 'humor', level: 'C1', point: 'sameage', reveals: ['senior'], seg: [38.1, 45.6],
      stem: 'Why does Phyllis’s short reply get a laugh?',
      choices: ['She points out Michael is just as old', 'She thinks she was called the top seller', 'She claims to be the youngest one there'], a: 0,
      cue: '指名された直後の、短い一文。',
      line: 'our *resident senior*. — *We’re the same age.*',
      said: '長老と呼ばれた Phyllis が「（あなたと）同い年でしょ」と返す。',
      mean: '年寄り扱いした本人も同じ年。からかいが Michael に返ってくるのがおかしい。',
      trap: 'same age を「みんなと同じ」と広く取りやすい。we が誰と誰かを考える。',
      use: 'Look who’s talking.（人のこと言えないでしょ）' },

    // R new: C2, exact weak words in fast speech (the dropped "'ve"), in place of nt2
    // anchor: 56.5–57.5 s both sources have "You can't pass. You got to pick somebody" (no "'ve"), run together at
    //   148 wpm
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'gotta', reveals: ['second'], seg: [55.1, 58.5],
      stem: 'Type what’s said: “You can’t pass. ___ pick somebody.” (3 words)', answer: 'you got to',
      cue: 'You can’t pass のすぐあと。文法より、聞こえた音を。',
      line: 'Pass. — You can’t pass. *You got to* pick somebody.',
      said: '「パスはなし。誰か選ばなきゃ」と返す。you と got の間に ’ve はない。',
      mean: '文法では you’ve got to。会話では ’ve が落ち、got to は「ガッタ」と一息。',
      trap: '習った形どおり you’ve と書きたくなる。聞こえた音だけを書く。',
      use: 'You got to try this place.（ここ、絶対に行ってみて）' },

    // why: senior person ← "second choice" heard as someone else coming first; from the start ← "flattered" taken
    //   at face value
    { id: 'i1', skill: 'infer', level: 'C1', point: 'second', seg: [55.2, 69.5],
      stem: 'From what Stanley’s pick says, what did Stanley really want first?',
      choices: ['Not to pick anyone at all', 'Some other, more senior person', 'Him, right from the very start'], a: 0,
      cue: '前半の一語の返事と、後半の after のあと。',
      line: 'Pass. … I was his *second choice after “pass.”*',
      said: 'Stanley は最初「パス」と言い、しかたなく選んだ。選ばれた側が指摘する。',
      mean: '「パス」が一番で自分は二番目。本当は誰とも組みたくなかった、ということ。',
      trap: 'second choice だけだと、別の誰かが一番に思える。after のあとまで聞く。',
      use: 'I was their second choice.（私は二番手だったの）' },

    // R fix: V2 + K6 (blind 50 %): the key alone quoted "pass"; it's now in plain words, and the sincere reading got a
    //   real reason
    // why: someone else ← "second choice" heard as wanting a different partner; glad ← "very flattered" taken at
    //   face value (the お礼 frame), and being left over is the fear in any pick
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'second', seg: [62.0, 69.5],
      stem: 'When Stanley’s pick says he is “very flattered”, is he sincere?',
      choices: ['No; Stanley would rather have had no one', 'No; he had hoped to go with someone else',
                'Yes; it beats being the last one left'], a: 0,
      cue: '2文目の最後、何の「次」だったか。',
      line: 'I’m very *flattered*. I was his *second choice after “pass.”*',
      said: '「光栄だね。“パス”の次に選ばれたんだから」と言う。',
      mean: '一番目の選択肢は「誰も選ばない」。それより下だった、という皮肉。flattered は逆の意味。',
      trap: 'flattered を言葉どおり「うれしい」と取りやすい。すぐあとの事実で本音を判断する。',
      use: 'Wow, I’m so honored.（わあ、光栄だなあ）' },

    // why: tough calls ← "sales calls" is the topic, so the warning sounds like it is about the job; enjoy more ←
    //   "used to… all the time" and "a picture to remember" heard as a fond memory (sincerity flip)
    // anchor: 72.6–75.2 s “Does anyone want to trade? — Yeah, trade.” as Jim and Dwight are left; 77.1–81.6 s
    //   “Dwight and I…”; 83.2–91.7 s “so much I need to warn you about… tragically, I cannot”
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'warn', reveals: ['usedto'], seg: [69.5, 92.6],
      stem: 'After Jim’s words to the camera, what would he warn young Jim about?',
      choices: ['All the time with Dwight still ahead of him', 'How tough sales calls would turn out to be',
                'Not enjoying those trips with Dwight more'], a: 0,
      cue: '交換の話と、カメラへの一言を合わせて。',
      line: 'Does anyone want to *trade*? … Oh, young Jim, there’s just so much I need to *warn you about*.',
      said: '残りが Jim と Dwight になると「交換したい人は？」。Jim は昔の自分に「警告が山ほど」。',
      mean: '交換したいほどの相手と、昔もよく組んでいた。カメラへの一言が、続く年月への嘆きに変える。',
      trap: '「よく一緒に」は懐かしさに聞こえる。warn と tragically は後悔の語。',
      use: 'I should have seen it coming.（こうなるって気づくべきだった）' },

    // R fix: V2 (blind 75 %): the title ("Young Jim") and "all the time" made "used to" the only past choice; "had to"
    //   is past as well, and "want to" went
    // why: had to / have to / got to ← all end in a flapped "-ta" after "and I", so only the first vowel tells them apart;
    //   "had to" also fits a story about the past
    { id: 's1', skill: 'sound', level: 'B2', point: 'usedto', seg: [76.6, 82.3],
      stem: 'Fill the gap: “Dwight and I ___ go on sales calls all the time.”',
      choices: ['used to', 'had to', 'have to', 'got to'], a: 0,
      cue: 'Dwight and I のすぐあと、短くつながる2語。',
      line: 'Dwight and I *used to* go on sales calls all the time.',
      said: '「Dwight とはよく営業に回った」と言う。used to は「ユースタ」。',
      mean: 'used to ＝ 以前はよく〜した。続く「その頃の写真」で昔の話と分かる。',
      trap: 'had to も got to も語尾が「タ」。最初の母音「ユー」で聞き分ける。',
      use: 'I used to live near here.（昔この近くに住んでたんだ）' },

    // R fix: V2 + S3 (blind 50 %): the cue said 大げささ, which is the key; the "forgotten" filler became "a warning
    //   wouldn't change a thing", which "tragically, I cannot" refutes
    // why: not allowed ← "I cannot" read with the Japanese 立場上言えない frame; no use ← "And yet" heard as a turn to
    //   "it wouldn't help anyway"
    { id: 'h4', skill: 'humor', level: 'C1', point: 'warn', seg: [82.6, 92.6],
      stem: 'Why does the end of Jim’s comment to the camera get a laugh?',
      choices: ['He treats a simple fact as a great tragedy', 'He admits he isn’t allowed to talk about it',
                'He admits a warning wouldn’t change a thing'], a: 0,
      cue: '最後の一文の言い方と、できない理由。',
      line: 'Oh, *young Jim*, there’s just so much I need to warn you about. And yet, *tragically, I cannot*.',
      said: '昔の自分の写真に「警告したいことは山ほどある。だが悲しいかな、できない」と語る。',
      mean: '過去の自分に伝えられないのは当然。それを悲劇のように言う大げささが笑い。',
      trap: 'cannot を「立場上言えない」と取りやすいが、相手は過去の自分。',
      use: 'If only I could tell my younger self.（昔の自分に教えてあげたい）' },

    // R fix: V2 (blind 55 %): "hard to drive" was a weak filler; "a strong motor" takes "motor" literally
    // why: old-fashioned ← "carriage" = 馬車, so the car sounds dated; strong motor ← "motor" taken as the engine, so the
    //   praise seems aimed at it
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'heck', seg: [92.9, 98.5],
      stem: 'When the Sebring is introduced, what does the speaker say about it?',
      choices: ['It is a really great car', 'It is an old-style car', 'It has a strong motor'], a: 0,
      cue: 'It’s a のあと、ほめ言葉の決まった形。',
      line: 'Sebring by Chrysler. It’s *a heck of a* motor carriage.',
      said: '「クライスラーのセブリング。大した車だ」と紹介する。',
      mean: 'a heck of a ～ ＝ すごい〜。motor carriage は、わざと古風な言い方。',
      trap: 'carriage を馬車、motor をエンジンと取ると、古い車の話に聞こえる。',
      use: 'That was a heck of a game.（すごい試合だったね）' },

    // R fix: V2 + K1/K5 (blind 50 %): "puts off" overlapped "will tell it in the car" (both defer), and the key alone
    //   wasn't a "says"; all three are now short verb phrases
    // why: later ← "long story" often comes before a story, so one seems promised; takes ages ← "long" read as the
    //   laundry taking long
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'laundry', seg: [104.2, 107.9],
      stem: 'When asked who does his laundry, what does the reply do?',
      choices: ['Brushes the question off', 'Promises to tell it later', 'Says laundry takes ages'], a: 0,
      cue: '質問のすぐあと、2語だけの返事。',
      line: 'Who does your laundry? — *Long story.*',
      said: '「洗濯は誰がしてるの？」と聞かれ、「話せば長い」とだけ返す。',
      mean: 'Long story. ＝ 話すと長くなる。今は説明したくない、と話を切り上げる決まり文句。',
      trap: 'long を「時間がかかる」と取りやすい。2語で止めたら、話す気がない合図。',
      use: 'It’s a long story.（話せば長くなるんだ）' },

    // R fix: V2 (blind 50 %): the prize choice was the odd one out ("ends with"); "a race for the biggest sale" is the
    //   question Phyllis asks, answered "No"
    // why: biggest sale ← "the biggest sale wins?" is asked, so it sounds like the rule; fight ← each pair gets a label
    //   ("you guys are the…"), which can sound like an argument over teams
    { id: 'g2', skill: 'gist', level: 'B2', point: 'race', reveals: ['phyllisq', 'prize'], seg: [108.0, 147.2],
      stem: 'What happens in the huddle before the teams leave?',
      choices: ['A pep talk turns into questions about the game', 'A pep talk sets up a race for the biggest sale',
                'A pep talk turns into a fight over the teams'], a: 0,
      cue: '前半の盛り上げと、後半の質問。',
      said: 'テレビ番組風にチームを紹介して盛り上げるが、「賞品は？」「どこがレース？」と聞かれる。',
      mean: '形だけのレース仕立てに、Phyllis が一つずつ疑問を挟んでいく流れ。',
      trap: 'チームごとに呼び名を付けるので、もめていると思いやすい。後半は中身への質問。',
      use: 'All right, everybody, circle up.（よし、みんな集まって）' },

    // R fix: V2 (blind 50 %): the key was the only three-step plan; all three are plans now
    // why: biggest sale ← the question just before puts the idea in the ear; call first ← "do the sales thing" heard
    //   without "rush out"
    { id: 'd4', skill: 'detail', level: 'B2', point: 'rush', seg: [125.4, 132.3],
      stem: 'When asked if the biggest sale wins, what is the plan said to be?',
      choices: ['Go out, make their calls, and come back', 'See who lands the biggest sale', 'Call clients first, then visit the best ones'], a: 0,
      cue: 'No のあと、動詞が3つ並ぶ。',
      line: 'No, we’re just gonna *rush out, do the sales thing, and come back*.',
      said: '「いや、ただ急いで出て、営業して、戻ってくるだけ」と答える。',
      mean: 'the sales thing ＝ いつもの営業。大きな契約を競うのではない。',
      trap: 'biggest sale が耳に残るとルールに思える。No で始まる答えは前の案の否定。',
      use: 'I’ll run out and grab some coffee.（ちょっとコーヒー買ってくる）' },

    // R drop: nt2 (C2 infer, "what is he avoiding admitting?"). Its key is i2's fact (it isn't a race), with no shared
    //   point, and it was blind-guessable at 60 %: both distractors were things Michael had already said aloud, so the
    //   theme choice stood out. Deleted (never shipped); replaced by nt3 (C2 dict, 56.5 s)
    // R fix: V2 + K5 (blind 60 %): the key was a statement and the distractors "She wants…"; all are now "That…", and
    //   it reveals race (its line shows what g2's "questions about the game" are)
    // why: hasn't seen it ← "Amazing Race" heard as a reference she doesn't get; how to win ← "how is…" read as
    //   "how does it work"
    { id: 'i2', skill: 'infer', level: 'B2', point: 'phyllisq', reveals: ['prize', 'rush', 'race'], seg: [129.2, 136.9],
      stem: 'When Phyllis asks “Then how is this…”, what is she getting at?',
      choices: ['That it isn’t really a race at all', 'That she hasn’t seen the TV show', 'That she wants to know how to win'], a: 0,
      cue: '文頭の Then が、何を受けているか。',
      line: '*Then* how is this Amazing Race?',
      said: '賞品もなく、営業して戻るだけと聞いて「じゃあどこがレースなの」と聞く。',
      mean: 'Then ＝ それなら。答えを受けて、レースらしさがないと突く反論。',
      trap: 'how is ～? を「どうやるの」と取るとルールの質問に聞こえる。Then で始まれば反論。',
      use: 'Then how is that a vacation?（それのどこが休みなの）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'prize', seg: [131.0, 134.2],
      stem: 'Type the question right after “…and come back.” (4 words)', answer: 'is there a prize',
      cue: 'come back の直後、短い質問。',
      line: '*Is there a prize*?',
      said: '「賞品はあるの？」と聞いている。',
      mean: 'Is there a は「イズゼラ」とつながる。there の th は弱く、ほとんど聞こえない。',
      trap: '短く速いので price と聞こえやすい。賞品の prize は z の音で終わる。',
      use: 'Is there a fee for this?（これって料金かかりますか）' },

    // R fix: V2 + K6 (blind 65 %): the key alone had "Only"; all three are now "The right to…"
    // why: leave early ← "rights" heard as a perk, the usual office prize; pick first ← "rights" heard as a privilege
    //   like the first pick earlier
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'prize', seg: [131.0, 134.2],
      stem: 'What does the winning team get?',
      choices: ['The right to boast about winning', 'The right to leave work early', 'The right to pick partners first'], a: 0,
      cue: 'Just のあとの2語。',
      line: 'Is there a prize? — Just *bragging rights*.',
      said: '「賞品は？」に「自慢できる権利だけ」と答える。',
      mean: 'bragging rights ＝ 勝ったと自慢できること。物やお金は何もない、という意味。',
      trap: 'rights を「権利＝何かの特典」と取りやすい。bragging（自慢）と組むと「自慢だけ」。',
      use: 'Winner gets bragging rights.（勝った人は自慢できる）' },

    // R fix: V2 (blind 65 %): "amused" was weak; "sure of himself" takes "teams of two… on a mission" as his reasons,
    //   which the stall at "It's just…" refutes
    // why: patient ← "We're in teams of two…" sounds like the rules again; sure of himself ← "teams of two… on a
    //   mission" heard as the answer to her question
    { id: 'a4', skill: 'attitude', level: 'B2', point: 'howrace', seg: [134.0, 143.4],
      stem: 'When Phyllis presses him, how does Michael answer?',
      choices: ['Stuck for a reason, so he just insists', 'Patient, as he goes over the rules again', 'Sure of himself, as he gives his reasons'], a: 0,
      cue: '言いかけて止まる所と、文末の一語。',
      line: '*It’s just…* It’s Amazing Race, Phyllis, *okay?*',
      said: '「ただ…とにかくアメージング・レースなの、いい？」と押し切る。',
      mean: '理由が出ず、同じ名前をくり返して終わらせる。文末の okay? は「もう聞かないで」。',
      trap: '説明し直しに聞こえるが、中身は増えていない。詰まったあとの okay? は押し切り。',
      use: 'It’s just how it is, okay?（とにかく、そういうものなの）' },

    // why: three / four ← "teams of" runs into a short number; two is easy to lose after "of"
    { id: 'n1', skill: 'number', level: 'B1', point: 'two', seg: [137.4, 143.0], keep: true,
      stem: 'How many people are in each team?',
      choices: ['Two', 'Three', 'Four'], a: 0,
      cue: 'teams of のあと。',
      line: 'We’re in *teams of two*, and we are on a mission.',
      said: '「二人一組のチームで、任務がある」と言う。',
      mean: 'teams of two ＝ 二人ずつのチーム。of のあとの数が人数。',
      trap: 'two は短く、to や of とつながって聞き落としやすい。three なら「スリー」の長い音がある。',
      use: 'A table for two, please.（2人です）' },

    // R fix: V2 (blind 55 %): the key was the only negative; "glad to have more room" became a shrug
    // why: shrug ← "Uh, yeah" and the plain question heard as small talk; smart ← the passenger's own view of his plan
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'seriously', seg: [162.5, 166.7],
      stem: 'How does the driver react to where his passenger sits?',
      choices: ['He finds it hard to believe', 'He shrugs; it’s all the same', 'He thinks it is a smart move'], a: 0,
      cue: '最初の一語の言い方。',
      line: '*Seriously?* You’re gonna sit in the back?',
      said: '「本気？後ろに座るの？」と聞き返す。',
      mean: 'Seriously? ＝ 本気で言ってる？。あきれた驚き。運転手扱いされた不満もにじむ。',
      trap: '普通の質問の形なので、軽い確認に聞こえやすい。文頭の Seriously? はあきれの合図。',
      use: 'Seriously? You ate the whole cake?（本気？ケーキ全部食べたの？）' },

    // R fix: V2 + S3 (blind 55 %): the key was the only odd logic, and "crash" in the cue was a word only the key had;
    //   "drivers steer so the back is never hit" is odd driver logic too
    // why: front hit ← common sense about crashes, not what is said; steer ← "the driver always…" heard as about
    //   steering, not protecting
    { id: 'd5', skill: 'detail', level: 'B2', point: 'backseat', seg: [162.5, 171.8],
      stem: 'Why does the passenger say the back is the safest place?',
      choices: ['Drivers protect their own side in a crash', 'Drivers steer so the back is never hit', 'Most crashes hit the front of the car'], a: 0,
      cue: 'In the event of のあとの文。',
      line: 'In the event of a crash, *the driver always protects his side first*.',
      said: '「事故のとき、運転手はいつも自分の側を先に守るから」と説明する。',
      mean: 'in the event of ＝ 〜の場合は。運転手は自分を守るので、隣の席は危ない、という理屈。',
      trap: '常識で「前がぶつかるから」と考えやすい。理由は、耳で聞いた文のほうで選ぶ。',
      use: 'In the event of rain, we’ll meet inside.（雨の場合は中で集合）' },
  ]
};
