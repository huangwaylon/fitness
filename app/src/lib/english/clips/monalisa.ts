// REVIEW 2026-11-16: pass 9, fix 15, drop 0, new 0; ear checks 1
//   Open: the full clip plays 126–181 s (Tom and Mona Lisa's sexual stretch, "I'd still hit it"). No item touches it,
//   but the learners will watch it. Keep the clip, or skip it under GUIDE §2?
// “Mona Lisa needs money to wax her bees | Parks and Recreation” (the official Parks and Recreation channel, Season 5):
// Chris can't decide whether to help Ann have a baby, so Ben suggests he practise parenting on Tom, who is afraid to
// stand up to Mona Lisa, the employee stealing from him; Chris coaches him like a dad, and keeps at it to the end.
// Segments from the captions, words from whisper (2026-11-16). Names said: Ann, Ben, Tom, Mona Lisa, Jean-Ralphio. The
// man deciding about Ann's baby is never named; stems call him Chris (he is the one Ben asks about "your dad's
// decision", who answers "Ben, that is…", and who then coaches Tom). The man who barges in at 65 s is "a passer-by".
// Written, not skipped: the clip's thread (the flour-sack idea, the coaching, "son", the bike) is clean and needs no
// backstory. Untested on purpose: 33.8–39 s ("klepto and nympho and pyro"), 102–107 s ("clear my browser history"),
// 85–88 s (whisper "I once saw her", captions "everyone saw her"), and the sexual stretch 126–181 s (how Mona Lisa
// "took it", the "wax my bees" loan, the party) and "She's sexy" (201 s); no segment reaches into 126–181 s or 33.8–39 s.
// EAR CHECK: 185.0–186.8 s c1 — a pause before "continuing" (captions: a 1.8 s gap; whisper splits the line there);
//   the key also stands on the word itself
import type { Clip } from '../types.ts';

export const monaLisa: Clip = {
  id: 'monalisa', video: 'LSu9bX3rWdY', title: 'Mona Lisa needs money to wax her bees', dur: 237, wpm: 162,
  band: 'mid', tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (55 % blind) + N1: only the key was a stance; and "Wow" is in the captions only (whisper has "Yep,
    //   that's how it works"), so the line, cue and trap no longer lean on it. All three now judge the remark.
    // why: touched ← the remark taken as deep (the sincerity flip); hopeful ← "that's how it works" read as うまくいく
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'obvious', seg: [0, 10.0],
      stem: 'How does Ben react to Chris’s remark about the kids and their parents?',
      choices: ['He gently mocks a remark that is very obvious', 'He is touched by a very thoughtful remark',
                'He agrees with a hopeful remark about life'], a: 0,
      cue: '最初の発言への、短い返事。',
      line: 'All these kids have fathers and mothers who birthed them… — *Yep, that’s how it works.*',
      said: '「この子たちには産んでくれた父と母がいて…」に、「うん、そういう仕組みだね」と返す。',
      mean: '当たり前のことを大発見のように言う相手を、軽くからかっている。',
      trap: 'Yep を素直な同意と取りやすい。当たり前の話に「そういう仕組み」と返すのはからかい。',
      use: 'Yep, that’s how it works.（うん、そういうもんだよ）' },

    // R fix: V2 (65 % blind): "tell his own dad some news" was weak. "Start a family with Ann" is the near miss: Ann and
    //   the baby are right, the role is wrong ("donate… so she can have a baby").
    // why: adopt ← "all these kids" heard as the decision; family with Ann ← Ann + baby + "dad's decision" heard as a
    //   couple's plan
    { id: 'g1', skill: 'gist', level: 'B2', point: 'decision', seg: [10.0, 29.5],
      stem: 'What is Chris trying to decide?',
      choices: ['Whether to help Ann have a baby', 'Whether to adopt one of the kids',
                'Whether to start a family with Ann'], a: 0,
      cue: 'Ben の質問と、そのあとのカメラへの話。',
      line: 'Did you make your *dad’s decision* yet?',
      said: '「父親になる件、決めた？」と聞かれ、カメラに Ann に頼まれた話をする。',
      mean: 'Ann が子どもを持つ手助けをして、父親になるかどうかで迷っている。',
      trap: '2人の家庭の話に聞こえるが、donate は提供。so she can の she を聞く。',
      use: 'Have you made up your mind yet?（もう決めた？）' },

    // why: sure but secret ← "100% certain" heard, "0% sure" lost; half sure ← the two numbers averaged
    { id: 't1', skill: 'attitude', level: 'B2', point: 'unsure', seg: [12.7, 17.5],
      stem: 'How does Chris feel about the decision so far?',
      choices: ['Completely unsure what to do', 'Sure, but not ready to say yet',
                'About half sure he will say yes'], a: 0,
      cue: '2つの数字のうち、後ろのほう。',
      line: 'I am 100% certain that I am *0% sure* of what I’m going to do.',
      said: '「自分がどうするか、0％しか分かっていないと100％確信している」と言う。',
      mean: '確信しているのは「分からない」こと。つまり、まったく決まっていない。',
      trap: '最初の100％に引かれやすい。何について100％なのかを聞く。',
      use: 'I honestly have no idea yet.（正直まだ全然分からない）' },

    // why: too old ← a common worry about becoming a father (the script); Ann changing her mind ← "Ann asked me" heard,
    //   and the worry put on her
    { id: 'd1', skill: 'detail', level: 'B2', point: 'fear', seg: [21.2, 29.8],
      stem: 'What holds Chris back, by his own account?',
      choices: ['Fear of harming any living thing', 'Fear that he is too old for it',
                'Fear that Ann might change her mind'], a: 0,
      cue: '「battle between」のあと、後半の fear。',
      line: 'my *paralyzing fear of negatively affecting any living thing*.',
      said: '「子どもがほしい本能と、生き物に悪い影響を与えるのが怖い気持ちの戦い」と言う。',
      mean: 'paralyzing ＝ 体がすくむほどの。心配性な性格が出ている。',
      trap: '年齢や相手の気持ちは出てこない。and のあとの fear of の中身を聞く。',
      use: 'I’m afraid of letting people down.（人をがっかりさせるのが怖い）' },

    // why: $16 ← sixty/sixteen, the -ty/-teen pair; $600 ← a weak syllable heard as "hundred"
    { id: 'n1', skill: 'number', level: 'B1', point: 'register', seg: [29.8, 33.75], keep: true,
      stem: 'How much is missing from the register?',
      choices: ['$16', '$60', '$600'], a: 1,
      cue: '「There’s」のすぐあとの数。',
      line: 'There’s *$60* missing from the register.',
      said: 'Tom が「レジから60ドルなくなっている」と言う。',
      mean: 'register ＝ レジ。店の金が合わないという話。',
      trap: 'sixty は前を強く「シクスティ」、sixteen は後ろを強く「ティーン」。強さの位置で聞く。',
      use: 'There’s ten dollars missing.（10ドル足りない）' },

    // R fix: V2 (55 % blind): "can't prove it" was weak. "His CFO told him to wait" turns Ben's "immediately", said just
    //   before, the wrong way round.
    // why: friend's sister ← Chris's guess later in the clip (85 s), a reason that is said but isn't Tom's here; CFO ←
    //   "As your CFO, I recommend…" heard, the "immediately" lost
    { id: 'd3', skill: 'detail', level: 'B1', point: 'party', seg: [41.7, 47.8],
      stem: 'Why can’t Tom let Mona Lisa go right now?',
      choices: ['He has a big party tomorrow and no time', 'She is a friend’s sister, so it’s awkward',
                'His CFO told him to wait a little longer'], a: 0,
      cue: '「I’m throwing」から次の文まで。',
      line: 'I’m throwing a *huge cocktail party tomorrow*… I *don’t have time to find someone new*.',
      said: '「明日、上客向けの大きなパーティーがある。代わりを探す時間がない」と言う。',
      mean: '辞めさせたいが、人手が足りなくなるので今は無理、という事情。',
      trap: '友だちの妹はあとで別の人が言う推測。CFO は「すぐ」と言っている。ここは時間の話。',
      use: 'I don’t have time to train someone new.（新人を教える時間がない）' },

    // why: a day ← the usual length of a school exercise; a month ← "spend a… carrying around" filled with a longer time
    { id: 'n2', skill: 'number', level: 'B1', point: 'week', reveals: ['flour'], seg: [47.8, 54.5], keep: true,
      stem: 'How long did Ben’s class carry the sack of flour around?',
      choices: ['A day', 'A week', 'A month'], a: 1,
      cue: '「we had to spend」のすぐあと。',
      line: 'we had to *spend a week* carrying around a sack of flour pretending it was a kid.',
      said: '「高校で、小麦粉の袋を子どもに見立てて1週間持ち歩かされた」と話す。',
      mean: 'spend a week ～ing ＝ 1週間～して過ごす。子育ての練習の授業。',
      trap: 'a が弱く week とつながる。spend のすぐあとの短い語を聞く。',
      use: 'I spent a week cooking for myself.（1週間自炊して過ごした）' },

    // R fix: V2 (70 % blind): "a helper for Ann's plans" was weak, and only the key was a relationship. All three are
    //   now roles Chris could take toward a younger man.
    // why: little brother ← right idea (family), wrong role, since Tom is younger and gets advice; business friend ←
    //   Tom's store and staff problem are the topic
    { id: 'g2', skill: 'gist', level: 'B2', point: 'practice', reveals: ['flour', 'son'], seg: [48.0, 115.5],
      stem: 'How does Chris end up dealing with Tom?',
      choices: ['As a son he can practise parenting on', 'As a little brother to look out for',
                'As a friend to give business tips to'], a: 0,
      cue: '小麦粉の話と、最後の呼びかけ方。',
      said: '小麦粉の袋の話をきっかけに、Tom の悩みに父親のように助言し、最後は「息子よ」と呼ぶ。',
      mean: 'Tom を子ども役にして、親になる練習をしている。',
      trap: '店の話なので仕事の助言に、年下なので弟扱いにも見える。最後の呼びかけで親役と分かる。',
      use: 'Think of it as practice.（練習だと思って）' },

    // R fix: V2 (75 % blind): the carrying job was a filler. The literal reading is now "Tom carries the sack", and
    //   "ask Tom for tips" turns "parent him" round.
    // why: Tom carries a sack ← "make Tom your sack of flour" heard as giving Tom the sack; tips from Tom ← "parent him"
    //   heard as learning parenting from him
    { id: 'i2', skill: 'infer', level: 'B2', point: 'flour', seg: [54.5, 61.0],
      stem: 'What does Ben suggest Chris do with Tom?',
      choices: ['Treat Tom as the pretend kid and parent him', 'Have Tom carry a flour sack as a pretend kid',
                'Ask Tom for tips on how to be a parent'], a: 0,
      cue: '「See how it feels」のあと。',
      line: 'Why don’t you make *Tom your sack of flour*? See how it feels to *parent him* a little.',
      said: '「Tom を小麦粉の袋にしたら？ 少し親をやってみれば」と言う。',
      mean: '小麦粉の袋＝子育ての練習台。Tom をその役にする提案。',
      trap: '文字どおり取ると Tom に袋を持たせる話になる。your sack of flour ＝ 君の練習台。',
      use: 'Why don’t you try it for a week?（1週間試してみたら？）' },

    // R fix: V2 (75 % blind) + B1: only the key had two parts, and it said "wants in", f1's answer, without a reveals.
    //   All three are now "He takes it for… and…", and reveals gets wantsin.
    // why: threatens ← "fake drugs for sophomores" heard as an accusation (sincerity flip); school plan ← "high school"
    //   heard, in the wrong relation
    { id: 'h2', skill: 'humor', level: 'C1', point: 'drugs', reveals: ['wantsin'], seg: [64.8, 72.4],
      stem: 'Why is the passer-by’s question funny?',
      choices: ['He takes it for a drug plan and wants to join', 'He takes it for a drug plan and threatens to tell',
                'He takes it for a school plan and wants to help'], a: 0,
      cue: '「Because if true」のあと。',
      line: 'I heard *sack of flour* and *high school*. Are you ding-dongs making *fake drugs* for sophomores?',
      said: '「小麦粉の袋と高校って聞こえた。高校生に偽の薬でも作ってるのか？ だったら俺も入れて」と言う。',
      mean: '聞こえた2語だけで悪だくみを想像し、しかも乗り気。その勘違いが笑い。',
      trap: '注意しているように聞こえるが、最後に自分も加わりたいと言う。文の最後まで聞く。',
      use: 'If you’re ordering pizza, I want in.（ピザ頼むなら、私も入れて）' },

    // R fix: V2 (70 % blind): "make them stop" was weak. "Hear more about the plan" takes "if true" as curiosity.
    // why: come inside ← "in" taken as a place; hear more ← "if true" heard as wanting the details first
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'wantsin', reveals: ['drugs'], seg: [68.7, 72.4],
      stem: 'At the end of his question, what does the passer-by say he wants?',
      choices: ['To join in on their plan', 'To come inside the room', 'To hear more about the plan'], a: 0,
      cue: '「if true」のあと、最後の2語。',
      line: 'Because if true, *this guy wants in*.',
      said: '「もし本当なら、俺も一枚かませて」と言う。',
      mean: 'want in ＝ 仲間に入りたい。this guy は自分のこと。',
      trap: 'in を「部屋の中」と、if true を「詳しく知りたい」と取りやすい。want in は計画に加わること。',
      use: 'Are you guys going? I want in.（みんな行くの？私も行く）' },

    // R fix: V2 (50 % blind): only the key was kind. "A reason to fire her today" is the Japanese-frame reading of
    //   "it's not easy" as a preface to an order.
    // why: warning ← "dear friend" heard as a reason to be careful; fire her today ← 「大変なのは分かるけど…」, the
    //   preface read as leading to a firm order
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'dearfriend', seg: [78.0, 83.75],
      stem: 'After saying Tom is being used, what does Chris add?',
      choices: ['A kind excuse for why Tom hasn’t acted', 'A warning not to upset Tom’s friend',
                'A reason Tom should fire her today'], a: 0,
      cue: '「And I’m sure」のあと。',
      line: 'And *I’m sure that it’s not easy* when it’s the sister of a dear friend.',
      said: '「彼女に利用されてる」と言ってから、「親友の妹だと難しいよね」と付け足す。',
      mean: '責めるだけでなく、言い訳を先に用意して受け止める、親らしい言い方。',
      trap: '「分かるけど…」は命令の前置きにも聞こえるが、ここで終わる。dear friend の「妹」が彼女。',
      use: 'I know it’s not easy for you.（簡単じゃないのは分かるよ）' },

    // why: friend's sister ← Chris's guess, said just before; done nothing wrong ← "it's not that" heard as denying the
    //   theft
    { id: 'i3', skill: 'infer', level: 'B2', point: 'scared', reveals: ['dearfriend'], seg: [80.3, 89.2],
      stem: 'What is the real reason Tom hasn’t dealt with Mona Lisa?',
      choices: ['He is too scared of her to act', 'She is his friend’s sister', 'He thinks she did nothing'], a: 0,
      cue: '「it’s not that」のあとの一文。',
      line: 'Oh, no, *it’s not that*. She *scares* the crap out of me.',
      said: '「親友の妹だから」という推測に、「そうじゃない。あいつがめちゃくちゃ怖い」と返す。',
      mean: 'it’s not that ＝ 理由はそれじゃない。本当の理由を続けて言う。',
      trap: '直前の推測に引かれやすい。not that のあとに本当の理由が来る。',
      use: 'It’s not that. I’m just tired.（そうじゃなくて、ただ疲れてるの）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'directly', seg: [89.0, 91.75],
      stem: 'Type Chris’s advice: “___ and tell her…” (4 words)', answer: 'speak directly to her',
      cue: '「scares」の話のあと、助言の最初。',
      line: '*Speak directly to her* and tell her…',
      said: '「本人に直接言うんだ」。to her の h が落ちて「トゥアー」に近い。',
      mean: 'speak directly to ～ ＝ 人づてにせず直接話す。',
      trap: 'her の h が消え、to her が一語に聞こえやすい。directly の t も弱い。',
      use: 'You should speak directly to the manager.（店長に直接言ったほうがいい）' },

    // R fix: V2 (50 % blind): the choices weren't parallel. All three now say how the list of praise ends.
    // why: jab ← the Japanese frame: a remark about someone's body heard as rude; sarcastic ← praise piled this high read
    //   as irony, though "Stand up for yourself" is sincere
    { id: 'h3', skill: 'humor', level: 'C1', point: 'belly', reveals: ['standup'], seg: [94.5, 102.0],
      stem: 'Why does the end of Chris’s list of Tom’s strengths get a laugh?',
      choices: ['A list of strong praise ends on a baby-like one', 'A list of strong praise ends on a jab at his weight',
                'A list of strong praise turns out to be sarcastic'], a: 0,
      cue: '「smart, successful」のあとに続くほめ言葉。',
      line: 'You’re a smart, successful young man with an *adorable little belly*.',
      said: '「君は頭が良くて成功した若者で、かわいいお腹もある。自分を守れ」と励ます。',
      mean: '力強い励ましに、親が子に言うような「かわいいお腹」が混ざる。親役が出ている。',
      trap: '体の話は悪口、並ぶほめ言葉は皮肉と取りやすいが、adorable は親が子に言うほめ言葉。',
      use: 'You’re smart, you’re kind, you’ve got this.（賢くて優しい君なら大丈夫）' },

    // R fix: V2 (60 % blind): "Look after his own health" was weak. Each choice is now a full reading of stand up /
    //   for yourself.
    // why: get up ← stand up taken literally (they are sitting down, so it fits); take care ← "for yourself" read as
    //   self-care (自分のために)
    { id: 'f3', skill: 'phrase', level: 'B1', point: 'standup', seg: [98.6, 103.0],
      stem: 'What does Chris tell Tom to do at the end of the pep talk?',
      choices: ['Defend himself and not back down', 'Get up out of his chair and go', 'Take care of himself for once'], a: 0,
      cue: '励ましの最後の一文。',
      line: '*Stand up for yourself.*',
      said: 'ほめ言葉を並べたあと、「自分のために立ち向かえ」と言う。',
      mean: 'stand up for yourself ＝ 言いなりにならず、自分を守る。',
      trap: '座って話しているので「立ちなさい」と取りやすい。for yourself と組むと「立ち向かう」。',
      use: 'You have to stand up for yourself.（自分の意見は言わないと）' },

    // R fix: V2 (70 % blind): as a reply, "I'll" was the only natural choice. "I'll talk to him" (h-less her/him) adds a
    //   fourth strong choice.
    // why: talked ← I'll + talk blur into a past form; I'd ← the l of I'll heard as a d; him ← "to her" without its h
    //   ("tuh-er") heard as "to 'im"
    { id: 's1', skill: 'sound', level: 'B2', point: 'talktoher', seg: [102.0, 105.3],
      stem: 'Fill the gap: “Yeah. ___ before the party.”',
      choices: ['I’ll talk to her', 'I talked to her', 'I’ll talk to him', 'I’d talk to her'], a: 0,
      cue: '「Yeah」のあと、文の最初の弱い音。',
      line: 'Yeah. *I’ll talk to her* before the party.',
      said: '「パーティーの前に話すよ」。I’ll の l は弱く、talk to her は「トーカー」に近い。',
      mean: 'これから話すという約束。',
      trap: 'l が弱く talked に、h が落ちた her は him に聞こえやすい。最後の母音と時を確かめる。',
      use: 'I’ll talk to him after lunch.（昼のあとで彼と話すよ）' },

    // R fix: V2 (65 % blind): "Tom didn't catch it" answered a different question (K5). All three are now about
    //   Chris's word.
    // why: mocking ← "son" heard as a put-down for asking advice like a kid; wrong name ← a slip, but read as a mix-up
    //   of names rather than of roles
    { id: 'h4', skill: 'humor', level: 'C1', point: 'son', seg: [107.5, 115.6],
      stem: 'Why does Chris’s reply to Tom’s thanks get a laugh?',
      choices: ['He slips into talking like he’s Tom’s dad', 'He mocks Tom for asking advice like a kid',

                'He calls Tom by the wrong name by mistake'], a: 0,
      cue: '「You’re welcome」のあとの呼びかけ。',
      line: 'Thanks for the advice, man. — You’re welcome, *son*. — What was that? — *Nothing.*',
      said: '「ありがとう」に「どういたしまして、息子よ」と返し、「今の何？」に「何でもない」。',
      mean: '親の練習のつもりが、つい息子と呼んでしまった。',
      trap: 'son をからかいや名前の言いまちがいと取りやすい。Nothing とごまかすので、親役が出た自覚がある。',
      use: 'What was that? — Nothing!（今の何？—何でもない！）' },

    // why: pay it back ← the $60 from the register is the problem raised first; apologise ← a softer, Japanese-style
    //   ultimatum
    { id: 'd4', skill: 'detail', level: 'B1', point: 'ultimatum', seg: [115.6, 122.05],
      stem: 'What did Tom tell Mona Lisa?',
      choices: ['Change her attitude or be fired', 'Pay the money back or be fired',
                'Say sorry to Chris or be fired'], a: 0,
      cue: '「I told」のあと、needed to に続く部分。',
      line: 'I told her she needed to *change her attitude* or I was gonna have to *fire her*.',
      said: '「態度を改めないとクビにする、と言った」と報告する。',
      mean: 'A or B ＝ A しないと B。条件つきの最後通告。',
      trap: 'レジの60ドルが頭に残り「返金」を選びやすい。needed to のあとが条件。',
      use: 'Clean your room, or no dessert.（部屋を片づけないと、デザートなし）' },

    // R fix: V2 (60 % blind): with "what is he not saying", the only negative choice was the key. All three are now
    //   "doesn't…", so the target has to come from the audio.
    // why: doesn't believe Tom ← right mechanism, wrong target, but "looks like" means he sees it himself, and Tom
    //   hasn't spoken yet; the store ← right mechanism, wrong target ("things with Mona Lisa" is the couple)
    // anchor: 78.4–80 s he had told Tom "Mona Lisa's taking advantage of you"; here he picks "continuing", a flat word
    //   where "going well" would go, and Tom answers "she's… only kind of terrible" (190–192 s)
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'continuing', seg: [182.0, 194.5],
      stem: 'When Chris calls things with Mona Lisa “continuing”, what is he not saying?',
      choices: ['That he doesn’t approve of the two of them', 'That he doesn’t believe what Tom told him',
                'That he doesn’t like how Tom runs his store'], a: 0,
      cue: '「are」のあとの間と、選んだ一語。',
      line: 'Well, looks like things with Mona Lisa are… *continuing*.',
      said: '「Mona Lisa とのことは…続いてるみたいだね」と、間をおいて言う。',
      mean: '「うまくいってる」と言える所で中立な「続いてる」を選び、賛成できない気持ちを言わずに伝える。',
      trap: '否定は分かっても、何に対してかを取り違えやすい。things with Mona Lisa は2人の仲のこと。',
      use: 'Well, the food was… interesting.（まあ、料理は…個性的だったね）' },

    // R fix: V2 (65 % blind): the key was the only "still bad" choice. Now two share it (one adds "he stopped
    //   trying", which "gradually transforming" refutes), and one says she was never that bad.
    // why: stopped trying ← "kind of terrible" heard as defeat; never that bad ← "only kind of terrible" heard as the
    //   whole verdict, "truly terrible" lost
    { id: 'i4', skill: 'infer', level: 'C1', point: 'victory', seg: [187.5, 194.6],
      stem: 'What does Tom’s talk of progress with Mona Lisa really admit?',
      choices: ['She is still bad; a tiny change counts as a win', 'She is still bad, and he has stopped trying to help',
                'She was never as bad as everyone said'], a: 0,
      cue: '「from」と「to」で何から何へ変わるか。',
      line: 'from *truly terrible* to *only kind of terrible*. It’s the *small victories*, you know?',
      said: '「本当にひどいから少しひどい程度に変えつつある。小さな勝利」と言う。',
      mean: '良くなったと言いつつ、まだひどいと認めている。少しの変化を勝利と呼ぶ。',
      trap: 'あきらめにも聞こえるが、gradually で努力は続く。to のあとも terrible。',

      use: 'It’s the little things, you know?（小さなことが大事なんだよ）' },

    // R fix: V2 (70 % blind): only the key had a two-part "ups and downs" gloss. The choices are now plain and equal.
    // why: theme park ← roller coaster taken literally; enjoy then end ← the thrill heard, "see where… goes" lost
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'coaster', seg: [201.7, 205.2],
      stem: 'What does Tom mean by his roller coaster line?',
      choices: ['He’ll stay with her and see what happens', 'He’ll take her to a theme park on a date',
                'He’ll enjoy the thrill, then end it soon'], a: 0,

      cue: '「I’m just gonna」のあと。',
      line: 'I’m just gonna *see where this roller coaster goes*.',
      said: '「このジェットコースターがどこへ行くか、見てみるよ」と言う。',
      mean: '浮き沈みの激しい関係を、成り行きにまかせて続けるということ。',
      trap: 'roller coaster を本物の乗り物と取りやすい。see where ～ goes は「成り行きを見る」。',
      use: 'Let’s just see where it goes.（とりあえず様子を見よう）' },

    // why: Tom just learned ← "Yeah" taken at face value; rude question ← right target (Chris), wrong reason: the joke is
    //   his missing the dry answer, not offending Tom
    // anchor: 208–213 s "Have you learned how to ride a bike yet?" — "Yeah, I'm 28 years old." (the age is the reason he
    //   can, said flatly) — "I'm proud of you, bud." (the reply treats it as news)
    { id: 'c2', skill: 'humor', level: 'C2', point: 'bike', reveals: ['age'], seg: [205.8, 214.0],
      stem: 'In the exchange about riding a bike, who is the joke on?',
      choices: ['Chris, who takes Tom’s dry answer as news', 'Tom, who admits he has only just learned',
                'Chris, for asking Tom such a rude question'], a: 0,
      cue: '年齢の一言と、そのあとのほめ言葉。',
      line: 'Have you learned how to ride a bike yet? — Yeah, *I’m 28 years old*. — *I’m proud of you, bud.*',
      said: '「自転車に乗れるようになった？」に「うん、28歳だし」と返され、「誇りに思うよ」と言う。',
      mean: '28歳の一言は「当たり前だろ」の意味。それを成長の知らせとしてほめる Chris が笑われている。',
      trap: 'Yeah を「やっと乗れた」と取りやすい。理由に年齢を出したら、冷めた「当然」の返事。',
      use: 'Yeah, I’m an adult.（そりゃね、大人だから）' },

    // why: 18 ← -ty/-teen confusion on the first part; 38 ← "thirty" and "twenty" share the -ty ending
    { id: 'n3', skill: 'number', level: 'B1', point: 'age', seg: [208.0, 213.6], keep: true,
      stem: 'How old does Tom say he is?',
      choices: ['18', '28', '38'], a: 1,
      cue: '「Yeah, I’m」のあと。',
      line: 'Yeah, I’m *28 years old*.',
      said: '「うん、28歳だから」と答える。',
      mean: 'twenty-eight ＝ 28。自転車に乗れて当然の年だと言っている。',
      trap: 'twenty の t が弾んで「トゥエニー」に近い。eighteen と混ざりやすいので、前半を聞く。',
      use: 'I’m thirty-two, not twelve!（12歳じゃなくて32歳だよ！）' }
  ]
};
