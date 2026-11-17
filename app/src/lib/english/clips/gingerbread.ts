// “Ron's Gingerbread Fail | Parks and Recreation” (the official Parks and Recreation channel, Season 4 | Parks and
// Recreation): the office plans a Christmas gift for Leslie; Tom's word cloud, Ron's wood model and a gingerbread
// version, everyone's candy decorations, Ron failing at gingerbread and bowing out, and the reveal: the model hides
// a second gift, the team as Leslie's new campaign staff.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Leslie, Tom, Ron, Ann, Andy, April,
// Donna. The fluff eater at 0–13 s, the off-camera voice at 122 s and the reply at 268 s aren't named, and no item
// needs them to be.
// Untested on purpose: 20–22 s (whisper "I'd settle for getting you into the 20th", captions "I've settled… the 20s"),
// 60 s (whisper "A wood model is best", captions "wood models"), 67 s ("excellent" only in the captions), 119–122 s
// (the white-chocolate "stereotypes" line), 143 s (whisper "I didn't eat any", captions "I didn't need any"), 223 s
// ("Big deal": the speaker is unclear), 242 s (whisper "suites", captions "sweets"), 253–257 s (an unnamed
// coworker who wasn't told).
// REVIEW 2026-11-16: pass 9, fix 13, drop 1, new 0; ear checks 1
//   Open: g2's blind read leaned on r1's "campaign"; they now reveal each other's point, so they never meet in a draw.
// EAR CHECK: 280.8 s r1 — the predict cut at 281.6 s: captions put "except" at 280.84 and "let's" at 282.08, whisper
//   puts "Except..." at 279–280; confirm the cut keeps all of "Except…" and none of "Let's"
import type { Clip } from '../types.ts';

export const gingerbread: Clip = {
  id: 'gingerbread', video: '1XnCmBhiodw', title: 'Ron\'s Gingerbread Fail | Parks and Recreation', dur: 306,
  wpm: 143, band: 'slow', tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %). "A new look for her office" was off the kind of the other two. All three are now "an idea
    //   for Leslie"; the slogan reading comes from the word cloud (words collected from her mail).
    // why: party ← a Christmas-time office scene suggests the party script; slogan ← the word cloud collects her words,
    //   which sounds like campaign material
    { id: 'g1', skill: 'gist', level: 'B1', point: 'gift', seg: [0, 31.0],
      stem: 'What is the group trying to come up with at the start?',
      choices: ['A gift idea for Leslie', 'A party idea for Leslie', 'A slogan idea for Leslie'], a: 0,
      cue: '単語の雲の説明の最後、「This is how we can」のあと。',
      line: 'This is how we can get *gift ideas*.',
      said: 'マシュマロの話から始まり、トムが「これでプレゼントのアイデアが出せる」と言う。',
      mean: 'みんなでレスリーへの贈り物を考えている。単語の雲もそのための道具。',
      trap: '年末ならパーティー、言葉集めならスローガンと取りやすい。目的は how we can のあと。',
      use: 'Any gift ideas for Mom?（お母さんへのプレゼント、何かある？）' },

    // R fix: V2 (blind 50 %). "Scolding them for taking it" differed from the key in content as well as tone; now the
    //   key and the near miss differ only in tone, which "darling" and the mock-formal "Correction" settle.
    // why: scolding ← "Correction" heard as a stern fix; flirting ← darling = 恋人への呼びかけ, read literally
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'darling', reveals: ['had'], seg: [0.1, 10.1],
      stem: 'How does the reply “Correction, darling…” treat the person with the fluff?',
      choices: ['Teasing them for eating it all', 'Scolding them for eating it all', 'Flirting with them over it'],
      a: 0,
      cue: '呼びかけのあと、時制が一つだけ変わる所。',
      line: 'Correction, darling, you *had* some right here.',
      said: '「持ってる」に「訂正、持って『た』でしょ」と返す。',
      mean: '全部食べたことを、わざと気取った言い方でからかっている。darling も冗談の調子。',
      trap: 'darling は恋人と取りやすいが、友人をからかう時にも使う。言葉の中身で判断する。',
      use: 'Correction: we had cake. It’s gone.（訂正、ケーキは「あった」。もうない）' },

    // why: have ← the first speaker's own word, repeated; would have ← "you'd have" fills a weak sound before "some";
    //   hid ← the vowel of "had" heard short
    { id: 's1', skill: 'sound', level: 'B2', point: 'had', seg: [4.4, 7.6],
      stem: 'Fill the gap: “Correction, darling, you ___ some right here.”',
      choices: ['had', 'have', 'hid', 'would have'], a: 0,
      cue: '「you」のすぐあと、一語の母音。',
      line: 'Correction, darling, you *had* some right here.',
      said: '「持ってる」に対して「訂正、持って『た』」と返す。',
      mean: 'have と had の一語の差が冗談の中身。もう全部食べてしまった、ということ。',
      trap: '直前の I have が耳に残り、同じ語に聞こえやすい。訂正のあとは、どこが変わったかを聞く。',
      use: 'I had my keys a minute ago.（さっきまで鍵、持ってたのに）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'off', seg: [10.8, 13.9],
      stem: 'Type what the fluff eater says: “I can’t ___.” (3 words)', answer: 'get it off',
      cue: '「Yes」のあと、手についたものの話。',
      line: 'I can’t *get it off*.',
      said: '手でジャーからすくったので、「取れない、手伝って」と言う。',
      mean: 'get it off が「ゲリロフ」とつながる。t が弾んでラ行に近くなる。',
      trap: '三語が一語に聞こえやすい。get it 〜 は t が「ラ」になる型として覚える。',
      use: 'Can you help me get it off?（取るの、手伝ってくれる？）' },

    // R drop: d2 (word cloud: "the more she's mentioned a word, the larger it appears"). How a word cloud works is
    //   world knowledge (V1), so the key was guessable from the stem (blind 75 %, V2). Literal stays at 4 (d1, d3, n1, n2).

    // why: gingerbread ← the version that wins later, and the clip's title; a sign ← "wood" and "her office" heard
    //   without "model of the parks department"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'wood', seg: [39.3, 44.5],
      stem: 'What does Ron first offer to build?',
      choices: ['A small wooden model of the department', 'A small gingerbread copy of the office',
                'A carved wooden sign for her office'], a: 0,
      cue: '「I have an idea」のあと、素材の語。',
      line: 'I will build *a small wood model* of the parks department.',
      said: '「公園課の小さな木の模型を作ろう」と言う。',
      mean: '最初の案は木の模型。お菓子の家はこのあと別の人が出す案。',
      trap: 'タイトルのお菓子の家が頭にあると選びやすい。最初の案と、あとの案を分けて聞く。',
      use: 'I’ll build a small shelf for you.（小さな棚を作ってあげるよ）' },

    // R fix: V2 (blind 65 %) and K6. The key was the only choice that wasn't "asking". Now two offers and one question.
    // why: help improve ← "better" read as "make yours better"; asks for ideas ← the question form read as an open call
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'better', reveals: ['wood'], seg: [44.5, 57.3],
      stem: 'Right after Ron’s plan, what is “Wait. Better idea?” doing?',
      choices: ['Offering a new plan to replace Ron’s', 'Offering to help improve Ron’s plan',
                'Asking if anyone has a better plan'], a: 0,
      cue: '短い前置きのあと、すぐに続く文。',
      line: 'Wait. *Better idea?* We make a *gingerbread version* of the office.',
      said: '木の模型の話のあと、「待って、もっといい案」と言ってお菓子の家を出す。',
      mean: '疑問の形だが、自分の案に切りかえる前置き。答えを待たずに案が続く。',
      trap: '? が付くので質問と取りやすい。すぐに案が続けば、自分の提案の合図。',
      use: 'Wait, better idea: let’s eat out.（待って、いい案。外で食べよう）' },

    // R fix: V2 (blind 50 %). "Pay for the candy" was a filler; a gruff-Ron script reading replaces it.
    // why: switches ← "such a cute idea" from the group heard as everyone, him too, agreeing; grumbling ← the gruff
    //   character's usual script, when the words are only praise of wood
    { id: 'i1', skill: 'infer', level: 'C1', point: 'birch', reveals: ['wood'], seg: [61.0, 73.9],
      stem: 'While the others plan candy decorations, what is Ron doing?',
      choices: ['Planning the wood parts as if nothing changed', 'Agreeing to make the model from candy too',
                'Grumbling that the candy idea is silly'], a: 0,
      cue: 'お菓子の話のあと、木材の名前が出る所。',
      line: 'I have some great *red birch*… I already have some *scale wainscoting*.',
      said: 'みんながお菓子の飾りで盛り上がる横で、カバ材や腰板の話をする。',
      mean: 'お菓子の案を聞いていないかのように、木の模型の材料の話を続けている。',
      trap: 'ロンなら文句を言うと思いやすいが、出るのは木材のほめ言葉だけ。語の中身を聞く。',
      use: 'I already have some wood at home.（家に木材ならあるよ）' },

    // why: himself ← "I didn't do anything for my office" comes just before; waiting ← crossed arms read as impatience
    { id: 'd1', skill: 'detail', level: 'B1', point: 'arms', seg: [88.2, 98.3],
      stem: 'Why are the marshmallow Ron’s arms crossed?',
      choices: ['He’s mad at coworkers for annoying him', 'He’s mad at himself for doing nothing',
                'He’s tired of waiting on his coworkers'], a: 0,
      cue: '「because」のあと、誰に怒っているか。',
      line: 'His arms are crossed because *he’s mad at all the other marshmallow workers for annoying him*.',
      said: 'ロンの代わりにマシュマロのロンを作り、「ほかの社員にイライラして腕を組んでる」と説明する。',
      mean: '本人の人づきあい嫌いを、人形でからかっている。',
      trap: '直前の「何もしてない」から自分への怒りと取りやすい。because のあとが理由。',
      use: 'She’s mad at me for being late.（遅れたから彼女に怒られてる）' },

    // why: start over ← "put out" read as 捨てる; out of sight ← "put … out" read as "put away"
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'putout', seg: [113.0, 123.4],
      stem: 'What does the voice that cuts in want the chocolate speaker to do?',
      choices: ['Stop talking and just show his candy', 'Throw his candy out and start over again',
                'Put his candy away out of sight'], a: 0,
      cue: 'チョコの自問が続いたあと、割り込む短い一言。',
      line: '…*put your damn candy out*.',
      said: '自分は何のチョコかと語り続ける人に、「いいからキャンディを出せ」と割り込む。',
      mean: 'put out ＝ 出して並べる。長い自分語りに、いら立って先を促している。',
      trap: 'put out を「捨てる」「消す」と取りやすい。飾りを並べる場面なら「出す」。',
      use: 'Can you put the snacks out?（お菓子、出しておいてくれる？）' },

    // why: $50 ← "fifty-five" heard only to its first half; $15 ← fifteen/fifty swap; $5 ← "five" heard alone
    { id: 'n1', skill: 'number', level: 'B1', point: 'fudge', seg: [123.3, 132.0], keep: true,
      stem: 'How much does the gourmet fudge cost?',
      choices: ['$5 an ounce', '$15 an ounce', '$50 an ounce', '$55 an ounce'], a: 3,
      cue: '「please don’t eat it」のあと。',
      line: 'please don’t eat it ’cause it costs *$55 an ounce*.',
      said: '「作る時間がなかった。食べないで、1オンス55ドルだから」と言う。',
      mean: '飾りを作らず、高い材料をそのまま置いただけ。値段で「食べるな」と言っている。',
      trap: 'fifty-five の後半が聞こえないと fifty になる。数のあとの単位まで聞く。',
      use: 'It’s ten dollars a pound.（1ポンド10ドルです）' },

    // R fix: V2 (blind 55 %). "Sick from the fumes" was the odd one out; now all three are about eating, and the near
    //   miss is the usual "too much candy" script.
    // why: fudge ← "please don't eat it" about the fudge comes just before; too much ← throwing up after a lot of sweets
    //   is the usual script
    { id: 'i2', skill: 'infer', level: 'C1', point: 'silver', seg: [131.8, 145.2],
      stem: 'Why does someone get told “Go throw up”?',
      choices: ['They seem to have eaten the painted candy', 'They seem to have eaten the costly fudge',
                'They seem to have eaten too much candy'], a: 0,
      cue: '「poisonous」と、その直後の短い返事。',
      line: 'those are *poisonous*, so no one eat them. — *Yeah, duh.* — Go throw up.',
      said: '毒だから食べるな、と言われ「当然」と返した人が「吐いてこい」と言われる。',
      mean: 'Yeah, duh は「分かってるよ」。そのすぐあとの命令から、もう食べたと思われていると分かる。',
      trap: '直前の高いファッジの話と混ざりやすい。毒の話の直後のやり取りを聞く。',
      use: 'Don’t eat that. It’s for decoration.（それ食べないで。飾りだから）' },

    // why: 70 ← seventeen/seventy swap; 7 ← "-teen" heard as a weak ending; 27 ← "twenty-" added by a guess at a
    //   long canoe
    { id: 'n2', skill: 'number', level: 'B1', point: 'canoe', seg: [154.2, 161.1], keep: true,
      stem: 'How long are the canoes Ron says he can handcraft?',
      choices: ['7 feet', '17 feet', '27 feet', '70 feet'], a: 1,
      cue: '「handcraft」のすぐあとの数。',
      line: 'I can handcraft *17-foot* canoes…',
      said: '「17フィートのカヌーは作れるのに」と言う。',
      mean: '大きな物が作れる腕前を先に言い、あとの失敗との差を大きくしている。',
      trap: 'seventeen と seventy は似ている。-teen は後ろが強く長く、-ty は前が強い。',
      use: 'It’s about seventeen feet long.（長さは17フィートくらい）' },

    // R fix: V2 (blind 65 %) and S3. "Mocks the others" was weak; a change-of-subject reading replaces it. The cue named
    //   the size contrast, which is the key.
    // why: changes the subject ← the canoe boast heard as a way off the failure; blames crackers ← "two damn graham
    //   crackers" heard as a complaint about them
    { id: 'h1', skill: 'humor', level: 'C1', point: 'crackers', seg: [154.2, 161.1],
      stem: 'Why is Ron’s comment to the camera about canoes funny?',
      choices: ['His great skill makes a tiny failure absurd', 'He blames cheap crackers instead of himself',
                'He brings up canoes to change the subject'], a: 0,
      cue: '「but」の前とあとを比べて。',
      line: 'I can *handcraft*… canoes… but I *can’t glue two damn graham crackers* together.',
      said: '「大きなカヌーは手作りできるのに、クラッカー2枚がくっつけられない」と言う。',
      mean: '大きな腕前と小さな失敗を並べた落差の笑い。but の前後で物の大きさが逆になる。',
      trap: 'damn で物のせいにしていると取りやすいが、言っているのは自分ができないこと。',
      use: 'I can fix cars, but not cook.（車は直せるのに料理はだめ）' },

    // R fix: V2 (blind 60 %). The title ("Gingerbread Fail") pointed at the only choice about failing; now a second
    //   failing reading is the near miss.
    // why: hands out jobs ← "Everyone else makes this…" heard as giving orders; cool down ← "elsewhere" heard as leaving
    //   the room after the failure
    // retired: the bank’s fifth infer (infer ≤ 4); its review: the title (“Gingerbread Fail”) gave it away
    { id: 'i3', skill: 'infer', level: 'C1', point: 'elsewhere', seg: [166.5, 176.8],
      stem: 'What is Ron really doing with his “new plan”?',
      choices: ['Bowing out of a job he can’t do', 'Handing out jobs to the whole team',
                'Going off to cool down after failing'], a: 0,
      cue: '「and I」のあと、自分の役目の言い方。',
      line: 'Everyone else makes this candy house and *I make myself useful elsewhere*.',
      said: '「お菓子の家はみんなで作って、僕はよそで役に立つ」と言う。',
      mean: 'make myself useful elsewhere ＝ ほかで役に立つ。できない作業から体よく手を引いている。',
      trap: '指示の形なので仕切っていると取りやすい。自分が何をするかを聞く。',
      use: 'I’ll make myself useful in the kitchen.（キッチンで何か手伝うよ）', retired: true },

    // R fix: V2 (blind 55 %) and K6. The key was the only "doesn't bother him"; now two are, with a near miss on the
    //   reason.
    // why: felt like a kid ← "eight-year-old girl" heard as how he felt; others did it ← "except for me" right before
    //   heard as his reason not to mind
    { id: 'i4', skill: 'infer', level: 'C1', point: 'eightyear', seg: [194.4, 205.3],
      stem: 'What does Ron claim about failing at the gingerbread house?',
      choices: ['It doesn’t bother him; it’s a kid’s skill', 'It doesn’t bother him; the others did it',
                'It bothers him; he felt like a little kid'], a: 0,
      cue: '「which would」のあと、「if」で始まる部分。',
      line: 'which *would bother me if I were* an eight-year-old girl.',
      said: '「8歳の女の子なら気にするだろうけど」と言う。',
      mean: 'would 〜 if I were は「実際は違う」の形。自分は子どもでないから平気、という主張。',
      trap: 'bother で「気にしている」と取りやすい。if I were は事実の逆を言う形。',
      use: 'That would bother me if I cared.（気にするならね。してないけど）' },

    // R fix: V2 (blind 50 %). "Stood back and cheered" was a filler; the katakana ステップアップ (= improve) replaces it.
    // why: took his side ← "stepped up" read as speaking up for him; got better ← ステップアップ = 向上, read as the English
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'stepup', seg: [205.2, 211.3],
      stem: 'What does Ron say the others did for him?',
      choices: ['Came forward and did the work', 'Spoke up and took his side', 'Got better and showed him how'],
      a: 0,
      cue: '「In any case」のあと、「these people」の次の動詞。',
      line: 'these people *stepped up* and helped me out…',
      said: '「この人たちが進んで引き受けて、助けてくれた」と言う。',
      mean: 'step up ＝ 必要な時に進んで役目を引き受ける。',
      trap: 'step up をステップアップ（向上）や「声を上げる」と取りやすい。仕事を買って出ること。',
      use: 'Thanks for stepping up today.（今日は引き受けてくれてありがとう）' },

    // why: real office ← "replica of the Parks Department" heard as a plan to redo it; won a seat ← "city council
    //   chambers… that's you next May" heard as done already
    // R fix: B1. g2's line ("running for city council… with our help") gives away r1's key, and r1's choices name the
    //   campaign: each now reveals the other's point.
    { id: 'g2', skill: 'gist', level: 'B2', point: 'campaign', reveals: ['election'], seg: [205.2, 251.0],
      stem: 'What is the bigger surprise behind the gingerbread gift?',
      choices: ['They’ll run her campaign with her', 'They’ll redo her real office', 'They’ve won her a council seat'],
      a: 0,
      cue: '「another idea」のあと、一人ずつ名前と役目。',
      line: 'You’re *running for city council again*, Leslie. *With our help*.',
      said: '議会の部屋の模型を見せ、「選挙に出るんだ。僕らが手伝う」と言い、一人ずつ役目を名乗る。',
      mean: '本当の贈り物は選挙の手伝い。お菓子の家はその入り口。',
      trap: 'that’s you next May を当選済みと取りやすい。running は「これから出る」。',
      use: 'You can do it. We’ve got your back.（できるよ。私たちがついてる）' },

    // anchor: 258.6–262.1 s "Ron Swanson, any other damn thing you might need": "any other… thing" takes on everything
    //   left, and "you might need" points at her needs; nothing in it says he minds
    // why: grumble ← "damn" and "any other" heard as being left the scraps (the Japanese frame: a curse = 不満); does
    //   little ← a vague title heard as a dodge
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'ron', seg: [258.1, 262.7],
      stem: 'How does the job Ron gives himself land?',
      choices: ['A gruff offer to do whatever she needs', 'A grumble about getting the leftover jobs',
                'A joke that he plans to do very little'], a: 0,
      cue: '名乗ったあと、「any other」から最後まで。',
      line: 'Ron Swanson, *any other damn thing you might need*.',
      said: 'みんなが役目を名乗ったあと、ロンは「ロン・スワンソン、ほかに要るもの全部」と言う。',
      mean: '「ほかの何でも」は一番広い役目。damn は不満でなく、照れ隠しの乱暴な言い方。',
      trap: 'damn を不満と聞きやすい。何を引き受けると言っているか、語の範囲で判断する。',
      use: 'Whatever you need, just say the word.（必要なことがあれば何でも言って）' },

    // R fix: V2 (blind 70 %) and K6. The key was the only mixed feeling; now all three are mixed.
    // why: upset ← someone just said "You guys didn't tell me we were doing this" (another voice); unsure ← "so much
    //   work" heard as doubt about the team
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'muchwork', seg: [262.6, 268.55],
      stem: 'Once all the jobs are named, how does Leslie react?',
      choices: ['Touched, but unwilling to take so much', 'Touched, but unsure they can pull it off',
                'Pleased, but upset nobody asked her first'], a: 0,
      cue: '「Guys」と呼びかけたあと、「I can’t ask」まで。',
      line: 'Guys, *it’s so much work*. *I can’t ask you*…',
      said: '「みんな、大変すぎるよ。そこまで頼めない」と言う。',
      mean: '喜びつつ、負担をかけるのを遠慮している。断りの形の感謝。',
      trap: 'so much work を「無理だ」という疑いと取りやすい。can’t ask you は相手への気づかい。',
      use: 'I can’t ask you to do that.（そこまで頼めないよ）' },

    // R fix: V2 (blind 60 %) and B1. "Keep it a secret" was a filler; "put lives on the line" (risk) is the near miss.
    //   The stem ("can't ask the team") gives away a1's key: it reveals `muchwork`.
    // why: phone ← "on hold" = 電話の保留, read literally; risk ← "put your lives on hold" heard as "on the line"
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'hold', reveals: ['muchwork'], seg: [263.7, 268.6],
      stem: 'What does Leslie say she can’t ask the team to do?',
      choices: ['Set their own lives aside for her', 'Wait by the phone for her news',
                'Put their own lives at risk for her'],
      a: 0,
      cue: '「I can’t ask you to」のあと。',
      line: 'I can’t ask you to *put your lives on hold*.',
      said: '「みんなの生活を後回しにさせられない」と言う。',
      mean: 'put 〜 on hold ＝ いったん止める、後回しにする。',
      trap: 'on hold を電話の保留や on the line（危険）と取りやすい。計画や生活にも使う。',
      use: 'We put the trip on hold.（旅行はいったん保留にした）' },

    // anchor: 268.7–272 s "Find one person here who you haven't helped by putting your life on hold": "you" is the one
    //   who helped, "your life" is what was put on hold, and "find one person" dares her to find any
    // why: flipped ← the team is about to give up time for her, so the reply sounds like their offer; none needed ←
    //   "haven't helped" heard as "haven't needed help" (the scope of the negative)
    { id: 'c3', skill: 'infer', level: 'C2', point: 'hold', seg: [263.7, 272.6],
      stem: 'Which plain-English version keeps what the reply to Leslie means?',
      choices: ['“You’ve given up your time for each of us.”', '“Each of us has given up our time for you.”',
                '“None of us has ever needed your help.”'], a: 0,
      cue: '主語の you と、your life が誰のものか。',
      line: '*Find one person here who you haven’t helped* by putting *your life* on hold.',
      said: '「あなたが自分の生活を後回しにして助けなかった人を、ここで一人でも探してみて」と返す。',
      mean: '「探してみて」は「いない」の意味の反語。全員があなたに助けられた、だから今度は返す番。',
      trap: '直前の申し出から主語を逆に聞きやすい。help した人と、後回しにした life の持ち主を追う。',
      use: 'Name one time I let you down.（私が裏切ったこと、一度でもある？）' },

    // R fix: B1. It now reveals `campaign` (g2's point), which its key choice names; see g2.
    // predict: the segment stops after "Except…" (280.8 s); the reveal plays "Let's go win an election!" (282.1 s)
    // why: a no ← "so much work" and "can't ask you" just before; a thank-you ← "I don't know what to say" usually
    //   comes before thanks
    { id: 'r1', skill: 'predict', level: 'B2', point: 'election', reveals: ['campaign'], seg: [272.5, 281.6], then: [281.6, 287.0],
      stem: 'After a long pause and “Except…”, what kind of line does Leslie give?',
      choices: ['A call to go and start the campaign', 'A no, since it asks too much of them',
                'A thank-you to each of them by name'], a: 0,
      cue: '長い間のあと、except で何を足すか。',
      line: 'I don’t know what to say. … Except… *Let’s go win an election!*',
      said: '「何て言えばいいか…ただ、選挙に勝ちに行こう！」と言う。',
      mean: 'except は「〜以外に言うことはない」。言葉に詰まったあと、引き受けの宣言が来る。',
      trap: '言葉に詰まる前置きは、お礼の前によく来る。except のあとは決めの一言のことが多い。',
      use: 'I don’t know what to say. Thanks.（何て言えばいいか。ありがとう）' },
  ]
};
