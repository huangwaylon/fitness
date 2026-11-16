// REVIEW 2026-11-16: pass 10, fix 12, drop 1, new 1; ear checks 1
// OPEN: i1 is still ~70 % blind, because the lie-detector warm-up ("an easy question first") is common knowledge. Keep it, or
//   swap in another infer?
// OPEN: s2: "what it takes" (present) still points to "doesn't" by agreement (80 % blind); only the vowel is tested by ear.
// OPEN: g1, g2, g3 and a2 sit at 65–70 % for a reader who knows the title or the characters; n2 (100 %) is ~50 %.
// “Andy is too smart for this test | Parks and Recreation” (the official Parks and Recreation channel, Season 5): Andy
// is about to take the police exams; his wife quizzes him on codes, cheers him up and gives him a lucky charm, the
// examiner runs the personality test, and the chief later explains how Andy did.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 155 s (whisper loops "see you next time"
// over the end card). Andy is named by the examiner (66 s) and the chief by "Hello, Chief Fugleberg" (119.6 s); the
// wife is never named, so stems say "his wife" ("divorce you", 38.6 s). Untested on purpose: who says "Okay, quiz me"
// and who says "Wait" / "Yes" (79–81 s), the examiner's call before the test (captions "liar", whisper "Flyer", 57 s),
// "you were going to pass this to us" (captions) vs "you are going to pass this test" (whisper, 34 s), "We can use"
// (captions) vs "We could use" (whisper, 141 s), and the wrist-lock bit (143–152 s), whose speaker and partner aren't
// named.
// EAR CHECK: 106.4 s r1 — the cut falls in the pause after "I would be like," before "Dad, you're alive?"
import type { Clip } from '../types.ts';

export const andyTest: Clip = {
  id: 'andytest', video: '1CATyJf5giI', title: 'Andy is too smart for this test', dur: 183, wpm: 154,
  band: 'slow', tags: ['職場', '家'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): both distractors were incoherent with a test-prep scene; now "explaining how the tests
    //   work" (the opening line) and "a promise to quit" (the divorce line read as a condition)
    // why: explaining ← "First we do the written exam, and then…" heard as the topic; promise to quit ← "if you don't,
    //   I'll just divorce you" heard as a condition she sets
    { id: 'g1', skill: 'gist', level: 'B1', point: 'prep', reveals: ['divorce'], seg: [0, 56.4],
      stem: 'What is the first part of the scene mostly about?',
      choices: ['Andy getting ready for his tests, with his wife’s help', 'Andy explaining to his wife how the police tests work',
                'Andy’s wife making him promise to quit if he fails'], a: 0,
      cue: 'quiz me のあと、二人のやりとりの流れ。',
      said: '試験の前に妻が番号のクイズを出し、緊張すると励まし、お守りまで渡す。',
      mean: 'divorce は本気の話ではなく、応援の冗談。場面全体は試験の準備と応援。',
      trap: '最初の一文や強い語（divorce）だけで決めない。返事と全体の流れで判断する。',
      use: 'Okay, quiz me. I’m ready.（よし、問題出して。準備OK）' },

    // R fix: V2 (blind 75 %): "how does he expect it to go" plus the title made "really well" the only fit; now three
    //   verbs a personality test could take
    // why: fake ← a personality test is the one you'd act your way through, and "nail" is lost; rush ← "nail" = 釘,
    //   one quick hit and done
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'nail', seg: [0, 9.8],
      stem: 'What does Andy say he’ll do on the personality evaluation?',
      choices: ['Ace it', 'Fake it', 'Rush it'], a: 0,
      cue: 'personality evaluation のすぐあと、短い動詞。',
      line: 'which I feel like I’m gonna *nail*',
      said: '筆記のあとの性格検査は「完璧にこなせる気がする」と言う。',
      mean: 'nail ＝ 見事に決める。試験や面接がうまくいく時の口語。',
      trap: '「釘」から「さっと片づける」、性格検査から「演技でごまかす」と取りやすい。すぐあとの理由まで聞く。',
      use: 'You totally nailed that interview!（あの面接、完璧だったね）' },

    // why: brags ← "always say" + "great" heard without the "But", as plain praise; modesty ← the Japanese frame:
    //   a remark about yourself heard as 謙遜 that comes out as a boast
    { id: 'h1', skill: 'humor', level: 'C1', point: 'personality', seg: [0, 9.8],
      stem: 'Why does the audience laugh at what people always say about Andy?',
      choices: ['People say that line when there’s little else to praise', 'He brags that everyone already calls him great',
                'He means it as modesty, but it sounds like bragging'], a: 0,
      cue: '引用の最初の一語と、そのあとのほめ言葉。',
      line: 'people always say, “*But* he’s got a *great personality*.”',
      said: '性格検査は楽勝、だって「でも彼、性格はいいよね」とよく言われるから、と言う。',
      mean: '他にほめる所がない人へのフォローの決まり文句。本人はほめ言葉と思っている。',
      trap: 'great だけだと自慢に聞こえる。But で始まるほめ言葉の前には、言いにくい事がある。',
      use: 'Well, he’s got a great personality.（まあ、性格はいいんだよね）' },

    // R drop: nt1 (C2, blind 60 %) asked the same fact as h1 (what the "But" quote implies) and shared its point; no
    //   rewrite gave it a second near miss the audio settles. Replaced by nt3 (36.9 s).
    // why: breaking and entering ← the same "X and Y" pattern of a legal term; over the limit ← the later test scenario
    //   ("pull a car over for speeding")
    { id: 'd1', skill: 'detail', level: 'B1', point: 'code1', seg: [11.9, 18.05],
      stem: 'What does an officer mean by calling in a 35-42?',
      choices: ['Breaking and entering', 'Assault and battery', 'Driving over the limit'], a: 1,
      cue: '番号のすぐあと、答える側の最初の言葉。',
      line: 'calls in a 35-42? — *Assault and battery*.',
      said: '「35-42と言ったら？」に「暴行」と即答する。',
      mean: 'assault and battery ＝ 暴行・傷害。セットで使う法律用語。',
      trap: 'breaking and entering は同じ型の別の罪、速度違反は後の場面の話。どの問いへの答えかを追う。',
      use: 'What does that code mean?（そのコード、どういう意味？）' },

    // why: 513 ← -teen/-ty (thirteen/thirty); 530 ← the final "-ee" of "three" lost in "thirty-three"; 553 ← the
    //   digits shuffled after "35" and "42" just before
    { id: 'n1', skill: 'number', level: 'B1', point: 'arson', seg: [17.9, 26.9],
      stem: 'What code does Andy give for arson?',
      choices: ['513', '530', '533', '553'], a: 2, keep: true,
      cue: 'arson が2回続いたあと、3つの数字。',
      line: 'Arson is *533*.',
      said: '「放火のコードは？」に「533」と答える。5と33に分けて読んでいる。',
      mean: '3けたの番号は、1けたと2けたに分けて読むことが多い。',
      trap: 'thirty と thirteen は強勢で聞き分ける。-ty は前、-teen は後ろが強い。',
      use: 'My room number is five thirty-three.（部屋番号は533です）' },

    // why: different number ← the second code is heard as a slip; nothing to do with fire ← the salt shakers and
    //   batteries heard as the whole picture, without "lighting a building on fire"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'arsonpic', reveals: ['arson', 'code1'], seg: [17.9, 31.05],
      stem: 'Why is Andy’s picture for the arson code funny?',
      choices: ['It reuses the salt shakers and batteries from before', 'It uses a number other than the code he just gave',
                'It pictures a crime that has nothing to do with fire'], a: 0,
      cue: '2つ目の「I picture」のあと、何が出てくるか。',
      line: 'I picture 533 *salt shakers and batteries* lighting a building on fire.',
      said: '暴行は「塩入れと電池」、放火も「533個の塩入れと電池がビルに放火」の絵で覚える。',
      mean: '暴行用の塩入れと電池を、別の罪に使い回している。全部同じ絵になるのが笑い。',
      trap: '数字に気を取られると絵の中身を聞き逃す。前に出た語が戻ってきたら笑いの合図。',
      use: 'Here’s how I remember it.（覚え方はこうだよ）' },

    // R fix: N1: the reply's first words differ (captions "it's", whisper "Oh, that's"); the line now keeps only the
    //   agreed "so sweet"
    // why: threat ← "divorce you" heard as the point (the reply is missed); weak joke ← "cheat on them" heard as a
    //   jab and the reply as polite (the Japanese 苦笑い frame)
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'divorce', seg: [32.5, 44.5],
      stem: 'How is the wife’s backup plan, if he fails, received?',
      choices: ['As a touching promise', 'As a hurtful threat', 'As a weak joke'], a: 0,
      cue: 'プランを聞いた直後の、短い返事。',
      line: 'I’ll just *divorce you* and marry someone else and then cheat on them *with you*. — …so *sweet*.',
      said: '「落ちたら離婚して別の人と結婚し、その人を裏切ってあなたと会う」に「優しいね」と返す。',
      mean: '形は脅しでも、中身は「結局あなたを選ぶ」。だから感動している。',
      trap: 'divorce という強い語で脅しに聞こえやすい。言葉の形より、直後の返事が答え。',
      use: 'Aw, that’s so sweet of you.（わあ、優しいね）' },

    // R new: replaces nt1; C2 exact weak words. Fresh blind read: 40 %, a weak joke-logic guess.
    // why: Andy ← "cheat" and "you" caught, "on them" lost, so the cheating is done to the listener; the person Andy
    //   marries ← "marry someone else" heard with Andy as the subject
    // anchor: 39.44–41.52 s "and marry someone else and then cheat on them with you" (both sources): "them" is the
    //   someone else, "with you" makes Andy the partner, not the victim
    { id: 'nt3', skill: 'detail', level: 'C2', point: 'divorce', seg: [36.9, 42.8], retired: true,
      stem: 'In the wife’s backup plan, who would end up being cheated on?',
      choices: ['The person she’d marry after Andy', 'Andy, after she had remarried', 'The person Andy would marry next'], a: 0,
      cue: 'cheat on のあとの、短い2語ずつ。',
      line: 'I’ll just divorce you and marry someone else and then *cheat on them with you*.',
      said: '「離婚して別の人と結婚し、その人をあなたと裏切る」。on them, with you が速い。',
      mean: '裏切られるのは新しい相手で、浮気相手はアンディ。結局アンディを選ぶ、という冗談。',
      trap: 'cheat と you だけだと、アンディが裏切られる話に。on の後が相手、with の後が一緒の人。',
      use: 'I’d choose you every time.（何度でも君を選ぶよ）' },

    // R fix: V2 (blind 55 %): "cute" was the odd one out; all three now start from "creepy", as the line does
    // why: polite thanks ← the Japanese frame: you thank someone for a gift even if you dislike it; rather not keep it
    //   ← "creepy" heard as rejection, "I love it" lost
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'creepy', seg: [44.3, 56.4],
      stem: 'When the lucky charm’s story is told, how is it taken?',
      choices: ['As creepy, and loved for exactly that reason', 'As creepy, so the thanks is just being polite',
                'As creepy, so he’d rather not keep it'], a: 0,
      cue: 'creepy の前の呼びかけと、すぐあとの返事。',
      line: '*Baby*, you are so creepy. *Thank you, I love it*.',
      said: '死んだウサギの足のお守りに「ベイビー、気味悪いね。ありがとう、気に入った」。',
      mean: 'creepy はここではほめ言葉。その気味悪さが好き、という愛情。',
      trap: '「嫌でもお礼は言う」と取りやすい。悪口の直後に Thank you なら、その悪口は好意。',
      use: 'You’re so weird. I love it.（変わってるね。そこがいい）' },

    // R fix: V2 (blind 80 %): "keeps asking to repeat" had no hook in the audio; now "cutting his answers short",
    //   from the examiner's "Let's move on" (82 s)
    // why: cut short ← "Let's move on" heard as the examiner stopping him; machine ← "make sure the machine is working"
    //   heard as a breakdown
    { id: 'g2', skill: 'gist', level: 'B2', point: 'test', reveals: ['machine'], seg: [56.5, 113.4],
      stem: 'What goes wrong once the personality test begins?',
      choices: ['Andy’s answers show odd judgment for a police officer', 'The examiner keeps cutting Andy’s answers short',
                'The machine stops working, so the test starts over'], a: 0,
      cue: '3つの質問への、アンディの答え方。',
      said: '名前の確認、銃を持ちたがる高校生、違反した父という3つの質問に答えていく。',
      mean: 'どの答えも警官の判断からずれている。落ちる前ぶれ。',
      trap: 'machine is working は確認、Let’s move on は次へ進む合図。故障や中断ではない。',
      use: 'How would you handle the situation?（その状況、どう対応する？）' },

    // R fix: V2 (blind 75 %): "help him relax" was weak; now "check he understands yes-or-no", from “Simple yes or no”
    // why: right person ← the usual ID-check script; yes-or-no ← "Simple yes or no" (70 s) heard as the reason for the
    //   easy question
    { id: 'i1', skill: 'infer', level: 'B2', point: 'machine', seg: [58.6, 67.5],
      stem: 'Why does the examiner start by asking Andy’s name?',
      choices: ['To check the equipment with an easy question', 'To make sure the right person is taking the test',
                'To check Andy understands the yes-or-no format'], a: 0,
      cue: '名前を聞く直前のひとこと。',
      line: '*Just to make sure the machine is working*. Is your name Andy?',
      said: '「警官向きの性格か判断する検査」と説明し、「機械の確認のため」と名前を聞く。',
      mean: '答えが分かりきった質問で、機械が正しく反応するかを試す。本人確認ではない。',
      trap: '名前を聞くのは本人確認、という普通の流れで取りやすい。質問の前に言う理由を聞く。',
      use: 'Just to make sure, is this seat free?（念のため、この席空いてますか）' },

    // R fix: V2 (blind 50 %): "annoyed the examiner doesn't know him" had no hook; now "corrects the pronunciation",
    //   from “everyone calls me Andy, but my full name is Andrew”
    // why: fake name ← "Andrew" heard as a different name given on purpose; corrects ← "but my full name is Andrew"
    //   heard as a correction, the "I think, so no?" missed
    { id: 'h3', skill: 'humor', level: 'C1', point: 'name', seg: [65.0, 79.2],
      stem: 'Why is Andy’s reply to the first question funny?',
      choices: ['He can’t answer the easiest question on the test', 'He gives a fake name to see if the machine notices',
                'He corrects how the examiner says his name'], a: 0,
      cue: '「Is your name…」への最初の返事と、迷い方。',
      line: 'I *don’t know how to answer that*. … my full name is Andrew, I think. So, *no*?',
      said: '「名前はアンディ？」に「本名はアンドリュー、たぶん。じゃあノー？」と迷う。',
      mean: 'いちばん簡単な確認の質問を考えすぎて答えられない。「たぶん」まで付くのが笑い。',
      trap: 'Andrew が別名に聞こえると、わざとの嘘と取りやすい。迷う声と言い直しを聞く。',
      use: 'I don’t know how to answer that.（なんて答えればいいか…）' },

    // why: respect ← a sensible-sounding training reason, with "that's what being a cop's all about" heard as a lesson;
    //   almost grown ← "high school-aged" heard as the reason
    { id: 'd2', skill: 'detail', level: 'B2', point: 'revolver', seg: [82.6, 97.4],
      stem: 'What reason does Andy give for his answer about the high schooler?',
      choices: ['He wanted to do the same thing when he was a kid', 'He thinks kids learn respect by holding a real gun',
                'He trusts kids who are almost old enough to be cops'], a: 0,
      cue: 'Yes のあと、子どものころの話。',
      line: 'When I was a kid, I *always wanted to hold a cop’s gun*…',
      said: '「子どもの頃、警官の銃を持ってみたかった。その夢を別の子にかなえる」と答える。',
      mean: '理由は自分の子ども時代の夢。警官の判断としては逆の答え。',
      trap: 'もっともらしい教育的な理由を想像しやすい。理由は When I was a kid のあと。',
      use: 'As a kid, I always wanted one.（子どもの頃、ずっと欲しかった）' },

    // R fix: V2 (blind 60 %): "got it" was the filler; the choices are now the full give/gave × it/'em grid
    // why: give it ← the "ay" of "gave" shortened at speed, and the present fits "what do you do"; gave 'em ← "it"
    //   heard as the weak "'em"; give 'em ← both slips at once
    { id: 's1', skill: 'sound', level: 'B2', point: 'gave', seg: [86.3, 90.55],
      stem: 'Fill the gap: “Yes, I ___ to him.”',
      choices: ['give it', 'gave it', 'gave ’em', 'give ’em'], a: 1,
      cue: 'Yes のすぐあと、動詞と短い語がつながる所。',
      line: 'Yes, I *gave it* to him.',
      said: '「持たせますか？」に「うん、渡した」と答える。gave it が「ゲイヴィッ」とつながる。',
      mean: 'まだ起きていない場面に、渡したと答えるのも小さな笑い。',
      trap: 'gave の「エイ」が短いと give に聞こえる。it の t は次の to に吸収される。',
      use: 'I gave it to her yesterday.（昨日彼女に渡したよ）' },

    // predict: the segment stops in the pause after "I would be like,"; the reveal plays "Dad, you're alive?…"
    // R fix: V2 (blind 65 %, then 75 %) + S2: "a rule he learned" was weak, so it's now "a comparison" (like read as
    //   〜のような). The stem quoted "be like", which answers the item; it now names the moment only.
    // why: a step ← "first" sets up a list of steps; a comparison ← "be like" read literally, as 「〜のようだ」
    { id: 'r1', skill: 'predict', level: 'B2', point: 'belike', reveals: ['dad'], seg: [97.4, 106.4], then: [106.4, 113.4],
      stem: 'As Andy starts his answer about his father, what kind of thing comes next?',
      choices: ['The words he’d say, acted out', 'The first step in a list of steps', 'A comparison with something similar'], a: 0,
      cue: 'first より、そのあとの2語の働き。',
      line: 'Well, first, I would *be like*, “Dad, you’re alive?”',
      said: '「まずはこんな感じ」と、「父さん、生きてたの？」とセリフを演じる。',
      mean: 'be like ＝「〜って感じ」。このあと言葉や反応を再現する合図。',
      trap: 'first から手順、like から「〜のよう」と予想しやすい。be like のあとはセリフが来る。',
      use: 'And I was like, “No way!”（で、私は「うそでしょ！」って感じ）' },

    // why: also a cop ← the police setting and "cop" said all through; caught before ← "pull a car over for speeding"
    //   is the test's made-up setup, heard as his father's past
    { id: 'i2', skill: 'infer', level: 'B2', point: 'dad', seg: [97.4, 110.8],
      stem: 'What does Andy’s reaction suggest about his father?',
      choices: ['Andy hasn’t seen or heard from him in years', 'His father is also a police officer in town',
                'His father has been caught speeding before'], a: 0,
      cue: 'Dad と呼んだすぐあとの驚き。',
      line: '*Dad, you’re alive?* What the hell?',
      said: '違反で止めた車が父だった、という想定に「父さん、生きてたの？」と驚く。',
      mean: '生きているかも知らないほど長く会っていない。警官としての対応より先に出る反応。',
      trap: 'speeding は問題の設定で、父の過去ではない。問題文の語と答えの中身を分けて聞く。',
      use: 'You’re alive! Where have you been?（生きてた！どこ行ってたの？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'knowwhere', seg: [110.6, 113.4],
      stem: 'Type what Andy asks: “Also, ___ my catcher’s mitt is?” (4 words)', answer: 'do you know where',
      cue: 'Also のすぐあと、4語がつながって短く。',
      line: 'Also, *do you know where* my catcher’s mitt is?',
      said: '「僕のミットどこか知ってる？」。do you が弱く短く know につながる。',
      mean: '父に昔の物の場所を聞く。Do you know where 〜 is? は基本の形。',
      trap: 'do you が弱く、know から聞こえやすい。頭の弱い語を補って書く。',
      use: 'Do you know where the station is?（駅がどこか知ってますか）' },

    // R fix: V2 (blind 75 %): "no jobs open" was off-scene; now "they think he cheated", from "It's weird… first guy
    //   in history", which the title ("too smart") also invites
    // why: both, but only just ← "did he fail his test" heard as the whole answer; cheated ← "It's weird" and "first guy
    //   in history" heard as suspicion
    { id: 'g3', skill: 'gist', level: 'B1', point: 'result', reveals: ['hundred'], seg: [118.8, 136.6],
      stem: 'Why is Andy’s result called a shame?',
      choices: ['He aced one test but failed the other', 'He failed both tests, but only just',
                'He scored so high they think he cheated'], a: 0,
      cue: 'It’s weird のあと、but の前と後。',
      line: 'but he *failed his personality examination*.',
      said: '署長が「筆記は史上初の満点。でも性格検査で落ちた」と話す。',
      mean: '頭は抜群なのに、警官向きの性格ではないと判定。だから「もったいない」。',
      trap: 'fail や It’s weird だけだと、全部落ちた、不正を疑われたと取りやすい。but の前後で分ける。',
      use: 'Such a shame. He tried so hard.（もったいない、すごく頑張ったのに）' },

    // why: 99 ← "first guy in history" heard as "nearly perfect"; 90 / 95 ← a high score guessed when the number is
    //   lost under "it's weird, he got…"
    { id: 'n2', skill: 'number', level: 'B1', point: 'hundred', seg: [125.1, 133.1],
      stem: 'What did Andy score on the written test?',
      choices: ['90%', '95%', '99%', '100%'], a: 3, keep: true,
      cue: 'written test の直前の数字。',
      line: 'he got *100%* on his written test. First guy in history to do it',
      said: '「筆記で100%を取った。史上初だ」と言う。',
      mean: 'one hundred percent ＝ 満点。First guy in history は、それを取った初めての人。',
      trap: '「史上初」は満点の珍しさの話。数字は percent の前の音で決める。',
      use: 'I’m a hundred percent sure.（100%確実だよ）' },

    // R fix: V2 (blind 70 %, then 75 %): "the chief disagrees" and "a second chance" were weak; now "too young"
    //   (kid read literally) and "a hard decision" (the chief's regret)
    // why: hard decision ← "such a shame" and the praise heard as regret over a choice, though the test decided; too
    //   young ← "sweet kid" read literally, kid = 子ども
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'sweetkid', seg: [125.1, 136.6],
      stem: 'Why is Andy praised right after the result is given?',
      choices: ['To soften the hard truth that comes next', 'To show the decision was a hard one to make',
                'To say Andy is still too young for the job'], a: 0,
      cue: 'ほめ言葉のすぐあと、Just で始まる文。',
      line: 'He’s a *sweet kid*. *Just doesn’t*…',
      said: '「いい子なんだ。ただ、警官に必要なものがない」と、ほめてから結論。',
      mean: '先にほめて悪い評価を和らげる。Just は「ただ〜」で、本題はこちら。',
      trap: 'ほめ言葉を決断の迷い、kid を子どもと取りやすい。kid は親しみの呼び方。直後の Just が本音。',
      use: 'She’s great. Just not right for this job.（いい人だよ。ただこの仕事向きじゃない）' },

    // R fix: V2 (blind 95 %): only "what it takes" was a real idiom, so the item tested vocabulary, not sound; the gap
    //   moves to the verb, and the stem drops "He's a sweet kid", whose present tense gave it away
    // why: didn't ← the vowel of "does" (ʌ) heard as "did" (ɪ), and the result is in the past; don't ← the z of "doesn't"
    //   lost at speed, leaving "dun't"
    { id: 's2', skill: 'sound', level: 'B2', point: 'doesnt', seg: [133.05, 136.6],
      stem: 'Fill the gap: “Just ___ what it takes to be a cop.”',
      choices: ['doesn’t have', 'didn’t have', 'don’t have'], a: 0,
      cue: 'Just のすぐあと、短く弱い否定。',
      line: 'Just *doesn’t have* what it takes to be a cop.',
      said: '「警官に必要なものがない」。doesn’t は「ダズン」と短く、have につながる。',
      mean: '人柄の話なので現在形。have what it takes ＝ 素質がある。',
      trap: 'does の「ダ」と did の「ディ」は母音で分かれる。人柄の評価は現在形。',
      use: 'You’ve got what it takes.（君には素質がある）' },

    // why: oddly smart ← "something" read as 何か変な; only one thing ← "something of" read as 何か一つの
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'genius', seg: [136.5, 140.95],
      stem: 'Right after “Too bad”, how is Andy’s mind described?',
      choices: ['As pretty much a real genius', 'As oddly smart, in his own way', 'As a genius at one thing'], a: 0,
      cue: 'Too bad のあと、certainly に続く言い方。',
      line: 'Too bad, he’s *certainly something of a genius*.',
      said: '「惜しいな、確かにちょっとした天才だ」と言う。',
      mean: 'something of a ＝「かなりの〜」。満点の話を受けて本気でほめている。',
      trap: 'something を「何か」と訳すと、変な才能や一部の才能に聞こえる。ひとかたまりで覚える。',
      use: 'She’s something of an expert on wine.（彼女はワインにかなり詳しい）' },

    // anchor: 152.16–154.32 s "If I had my gun, you wouldn't try to hit me" is complete, then four fast words follow
    //   it (≈ 0.6 s, both sources: "though… is the thing")
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'thing', seg: [151.6, 155.2], retired: true,
      stem: 'Type the end: “…you wouldn’t try to hit me ___.” (4 words)', answer: 'though is the thing',
      cue: 'hit me のすぐあと、文が終わってから足される4語。',
      line: 'If I had my gun, you wouldn’t try to hit me *though is the thing*.',
      said: '「銃があったら殴ろうとしないだろうけどね、って話」と足す。4語が一息。',
      mean: '〜, is the thing ＝「〜ってことなんだけどね」。言い終えた文に後から足す、会話だけの形。',
      trap: '文法では文が二重になり、is the thing を消したくなる。正しい文でなく、聞こえた音を書く。',
      use: 'It’s cheap, though, is the thing.（安いってのが大きいんだけどね）' },
  ]
};
