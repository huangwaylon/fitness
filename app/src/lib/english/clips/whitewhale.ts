// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 2
// Q: pr2 and c1 assume the voice to camera at 136 s is the one who said “I have the thing” (see EAR CHECK). Right?
// “Selling to Women - The Office US” (the official The Office channel, BEST OF SEASON 7 - The Office US): David Wallace
// gives Dwight the huge White Pages account; the office, afraid he can't sell to women, coaches him in role-plays that
// go badly (standing, “twelve minutes”, the listening face), and the coach ends up calling him hopeless.
// Segments from the captions, words from whisper (2026-11-16). The sources differ at 89.6 s (“catch her name” /
// “catch your name”), 117.1 s (“vagina said that” / “Gina said that”), 280.9 s (“regular knot” / “regular nod”) and
// 332 s (“boom” / “Boo”); no item rests on them. Crude lines (117 s, 198–206 s, 325–332 s, 292–297 s) are never keyed.
// Only Dwight, David, Jim (as addressed) and Nellie (named at 256.4 s) are named; the coaches stay “a coworker”/“the
// coach”.
// EAR CHECK: 157.2 s s1 / 250.4 s x1 — the weak forms are there (“you've just”, with an audible 've; “a little smile and
//   a nod”); both sources have these words
// EAR CHECK: 131.4–147.3 s pr2 c1 — the voice to camera (“I have this conference call today…”) is the one who answered
//   “Yeah. I have the thing.” (assumed from the matching “I have”; captions don't say)
import type { Clip } from '../types.ts';

export const whiteWhale: Clip = {
  id: 'whitewhale', video: 'iYvvc1fwoWw', title: 'Selling to Women', dur: 371, wpm: 175, band: 'fast',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %): the key was the only reading that fit Dwight's ego and the only one about rank. The
    //   distractors are now two other readings of "significant" (bad news; Jim already told)
    // why: bad news ← "significant" read as serious, ominous (重大); already told ← "you didn't call Jim" heard as
    //   "no need, Jim knows"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'jimcall', seg: [5.1, 16.0],
      stem: 'What does Dwight make of David phoning him rather than Jim?',
      choices: ['That David now trusts him more than Jim', 'That the news must be bad, since Jim was skipped',
                'That Jim has already heard the news'], a: 0,
      cue: '「Jim」の名前のあと、短い感想の一言。',
      line: 'Why would you ever call me when the manager is out of town? … And *you didn’t call Jim*. *That seems significant.*',
      said: '「店長の留守に僕に電話？ジムにはかけていない。意味深だ」と言う。',
      mean: 'significant ＝ 意味がある。自分が上に見られた、と取っている。',
      trap: 'significant を「重大＝悪い知らせ」と取りやすい。ここは自分への評価の話。',
      use: 'They called me first. That says something.（最初に私に電話してきた。意味あるよね）' },

    // R fix: V2 (blind 60 %): "glad" and "too busy" were easy to rule out. Now a "let him stay, go ahead" reading
    //   (from “Go ahead, David”) and a "Jim knows already" reading
    // why: lets him stay ← "Go ahead, David" comes right after; heard it ← "no, he shouldn't" heard as "he needn't,
    //   he knows"
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'shouldnt', seg: [15.3, 19.5],
      stem: 'When David invites Jim to listen in, how does Dwight respond?',
      choices: ['He tries to keep Jim out of the call', 'He lets Jim stay but tells David to hurry',
                'He says Jim has heard it all already'], a: 0,
      cue: '「You should hear this」への、すぐの返事。',
      line: 'Jim, good. You should hear this, too. — *Uh, no, he shouldn’t.*',
      said: '「ジムも聞いて」に、ドワイトが「いや、聞かなくていい」と返す。',
      mean: '理由も言わずに断っている。いい知らせをジムと分けたくない気持ち。',
      trap: 'あとの Go ahead で「続けて」に聞こえやすいが、その前に No が来ている。最初の一語で決める。',
      use: 'No, I think we’re good, thanks.（いや、大丈夫です）' },

    // why: 3 ← "three times a year" comes a few lines later; 20 ← "ten" with a -ty ending added by the ear
    { id: 'n1', skill: 'number', level: 'B1', point: 'tenyears', seg: [26.7, 35.2],
      stem: 'How long had the White Pages used the supplier they just dropped?',
      choices: ['3 years', '10 years', '20 years'], a: 1, keep: true,
      cue: '「supplier」のあと、文の最後。',
      line: 'They have apparently dropped their supplier for *the last ten years*.',
      said: '「10年使ってきた仕入れ先と、取引をやめたらしい」と伝える。',
      mean: 'for the last ten years ＝ この10年ずっと。長い取引が空いた。',
      trap: 'あとの three times と混ざりやすい。twenty なら「トゥエン」で始まり長い。',
      use: 'I’ve lived here for the last five years.（この5年ここに住んでいます）' },

    // why: quiet ← he is still mid-call, so shushing the room fits; lunch ← "eat" taken literally, and good news is
    //   often shared with a treat
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'eatit', seg: [65.3, 71.3],
      stem: 'With David on hold, what is Dwight shouting at his coworkers?',
      choices: ['“In your face, I won!”', '“Quiet, I’m on a call!”', '“Lunch is on me today!”'], a: 0,
      cue: '保留にしたあと、名前の前の2語。',
      line: '*Eat it*, Jim! *Eat it*, Phyllis!',
      said: '電話を保留にして、同僚の名前を呼びながら同じ2語を叫ぶ。',
      mean: 'Eat it ＝「ざまあみろ」。勝ったときに相手をあおる、くだけた言い方。',
      trap: 'eat を「食べる」と取ると、おごりの話に聞こえる。人の名前に向けて叫ぶならあおり。',
      use: 'Yes! Eat it, guys! I won!（よっしゃ、見たか！勝ったぞ）' },

    // R fix: V2 (blind 50 %): the key was the only detailed, two-part choice. All three are now one short shape
    // why: Peterman ← Dwight's own guess, the first name heard; receptionist ← the last role named before the answer
    { id: 'd1', skill: 'detail', level: 'B2', point: 'newbuyer', seg: [82.0, 92.5],
      stem: 'According to David, who handles the White Pages account now?',
      choices: ['A new woman, name unknown', 'Tom Peterman, as before', 'The receptionist there'], a: 0,
      cue: '「No」のあと、文の後半。',
      line: 'Tom Peterman was in charge of that account? — No… *someone new*, but she didn’t catch her name.',
      said: 'ドワイトが前の担当者の名前を出すと、「いや、新しい人。名前は聞けなかった」と返る。',
      mean: '担当者が代わったので、相手がよく分からないまま会いに行くことになる。',
      trap: '先に聞こえた名前や receptionist に引かれやすい。No のあとが答え。',
      use: 'Who’s in charge of this now?（今これの担当はどなたですか）' },

    // R fix: V2 (blind 50 %): the key was the only comic choice. Now "lets him finish, then thanks him" (the near
    //   miss: the cut-off is the point) and "puts him on hold again" (hold is said earlier)
    // why: lets him finish ← the thanks sound like a normal close; on hold ← he put David on hold a minute ago
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'hangup', seg: [90.9, 99.15],
      stem: 'When David starts to add something, what does Dwight do?',
      choices: ['Cuts him off with thanks and hangs up', 'Lets him finish, then thanks him and hangs up',
                'Puts him on hold again to tell the others'], a: 0,
      cue: 'Dwight と呼ばれたすぐあとの、お礼の言葉。',
      line: 'No. Hey, Dwight— *Thanks, David. Thank you so much for calling me today.*',
      said: 'デイビッドが何か言いかけたところで、「ありがとう、電話をくれて」と切り上げる。',
      mean: 'お礼で話を終わらせ、都合の悪い一言を言わせない動き。',
      trap: 'お礼は丁寧に聞こえるが、ここでは相手をさえぎるため。言いかけで終わった文に注目。',
      use: 'Great, thanks so much. Gotta run!（ありがとう、もう行かなきゃ）' },

    // R fix: V2 (blind 70 %): the key was the common-sense reason and the distractors weren't about women. Now all
    //   three tie a woman to the account; two misplace Gina's complaint
    // why: retrain ← Gina's complaint + David's cut-off "Dwight should…" heard as an order; win her back ← "Gina
    //   Rogers at Apex" heard as the account at stake
    { id: 'g2', skill: 'gist', level: 'B2', point: 'whyhelp', reveals: ['blow'], seg: [98.9, 152.2],
      stem: 'Why do Dwight’s coworkers decide to coach him before the meeting?',
      choices: ['He’s poor at selling to women, and the deal is too big to lose',
                'A woman complained, and David asked them to retrain him',
                'He offended a client, and they want her business back'], a: 0,
      cue: '「can’t go」と言われたあと、お金の話の部分。',
      said: '「女性に売るのが苦手」と指摘し、「この大口は逃せない」と話す。',
      mean: '昇給やボーナスがかかった大きな取引なので、みんなで準備させることにした。',
      trap: 'Gina の苦情や Dwight should… は指示に聞こえるが、言いかけで終わる。決め手はお金の話。',
      use: 'We can’t afford to lose this client.（この客は絶対に逃せない）' },

    // R fix: V2 (blind 70 %) + S1: the stem said "afraid", which gave away "mess it up". The stem now names the moment;
    //   the distractors are two other things they wouldn't let him do (keep the bonus, brag)
    // why: keep the bonus ← "raises, bonuses" follow at once; brag ← "blow your own horn"
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'blow', seg: [118.2, 123.05],
      stem: 'When a coworker says what they can’t let Dwight do, what does he mean?',
      choices: ['Ruin the chance and lose it', 'Keep all the bonus money', 'Brag about it to everyone'], a: 0,
      cue: '「can’t let Dwight」のあとの動詞。',
      line: 'Guys, we can’t let Dwight *blow this*. An account this size…',
      said: '「ドワイトにこれを台無しにさせられない。この規模だぞ」と言う。',
      mean: 'blow ＝ しくじる、ふいにする。blow it / blow this の形でよく使う。',
      trap: 'あとの bonuses に引かれやすい。blow のあとがチャンスなら「台無し」。',
      use: 'Don’t blow it. You’ve got one shot.（しくじるなよ、チャンスは一回）' },

    // R fix: V2 (blind 60 %): the key was the only one with a reason. All three are now "yes/no: reason", and two are
    //   yes-readings of "Yeah" plus "the thing"
    // why: yes, later ← "Yeah" read as a yes, "the thing" as something to finish first; yes, has it ← "the thing" read
    //   as an object they need
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'thing', seg: [130.95, 135.2],
      stem: 'When he’s asked to go instead, what does the reply do?',
      choices: ['Says no: he’s busy with something else', 'Says yes: once his own thing is done',
                'Says yes: he has what they need for it'], a: 0,
      cue: '「Yeah」のあとの短い一文。',
      line: 'Can you go instead? — Yeah. *I have the thing.*',
      said: '「代わりに行ける？」に「ああ…例の用事があって」と答える。',
      mean: 'Yeah は「その件ね」と受ける一語。the thing ＝ 例の予定で、断っている。',
      trap: 'Yeah を「はい」と取ると引き受けに聞こえる。そのあとの理由までが返事。',
      use: 'Ah, I can’t. I have a thing.（あ、無理だ。用事があって）' },

    // anchor: 133.6 s "I have the thing", then to camera 136.24–147.3 s "I have this conference call today… first board
    //   meeting… the first time I've ever been excited about work": the same "I have" now names a real plan he's
    //   thrilled about
    // R fix: V2 (blind 55 %): the key was the only upbeat reading. "A real plan he dreads" (the wrong direction, from
    //   "feels wrong") now sits beside the made-up excuse
    // why: made-up ← "the thing" is vague enough to sound invented (the usual office dodge); dreads ← "that feels
    //   wrong" heard as being about the plan itself
    { id: 'c1', skill: 'infer', level: 'C2', point: 'thing', reveals: ['wrong'], seg: [130.95, 147.8],
      stem: 'After his talk to the camera, how should we hear “I have the thing”?',
      choices: ['As a real plan he’s quietly thrilled about', 'As a made-up excuse to dodge Dwight’s mess',
                'As a real plan, but one he’s dreading'], a: 0,
      cue: '短い断りと、カメラへの説明を比べて。',
      line: 'Yeah. I have the thing. … I have this *conference call* today… Also the *first time I’ve ever been excited about work*.',
      said: '「例の用事が」とだけ言い、カメラには「手伝う会社の初の役員会。仕事でわくわくするのは初めて」と話す。',
      mean: 'ぼかした the thing の中身を、カメラへの一言が明かす。大事な予定を、わざと軽く言っている。',
      trap: '作り話や嫌な予定に聞こえやすいが、決め手は excited。',
      use: 'Oh, it’s just a little side project.（ああ、ちょっとした副業だよ）' },

    // R fix: V2 (blind 55 %): "joking" was the only hedge-like, nuanced word. All three are now plain "X seems odd/
    //   unkind/risky" readings of what "that" points to
    // why: unkind ← "feels wrong" right after turning the coworkers down (the Japanese 申し訳ない frame); risky ←
    //   "wrong" attached to the new company
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'wrong', seg: [141.1, 147.8],
      stem: 'How should we take the last line of his talk to the camera?',
      choices: ['Enjoying work is so new to him it seems odd', 'Leaving Dwight alone with this seems unkind',
                'The new company seems like a risky bet'], a: 0,
      cue: '「that」が指す、すぐ前の一文。',
      line: 'Also the first time I’ve ever been *excited about work*. So *that feels wrong*.',
      said: '「仕事でわくわくするのも初めて。だから、なんか変な感じ」と言う。',
      mean: 'that ＝ 仕事にわくわくしていること。今の職場では一度もなかった、という冗談。',
      trap: 'wrong を罪悪感と取りやすい。that が何を指すかを、すぐ前の文で確かめる。',
      use: 'I’m early for once. That feels weird.（めずらしく早く着いた。変な感じ）' },

    // why: ready ← "I thought it went great" and "You got this, Schrute" heard as real praise; someone else goes ←
    //   "Can you go instead? — Yeah" with "Yeah" read as a yes
    { id: 'g1', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['lostcause'], seg: [147.6, 337.8],
      stem: 'How does the coaching go, from the first try to the last?',
      choices: ['Every try goes wrong, and they decide he’s hopeless', 'Every try goes better, and they send him off ready',
                'Every try goes wrong, so someone else agrees to go'], a: 0,
      cue: 'いくつかの練習のあと、最後のまとめの一言。',
      said: '何度か練習するが、立ち方も聞き方も的外れで、最後に「もう無理だ」と言われる。',
      mean: '女性客への売り込み方を教える場面が、どれも失敗に終わる流れ。',
      trap: '「うまくいった」と言う声は一人だけ。Yeah も引き受けの返事ではない。',
      use: 'Let’s try that one more time.（もう一回やってみよう）' },

    // why: You just ← the 've is a faint v before "just"; You'd ← a soft d heard in the same spot
    { id: 's1', skill: 'sound', level: 'B2', point: 'walked', seg: [156.7, 160.9],
      stem: 'Fill the gap: “___ walked into her office.”',
      choices: ['You’ve just', 'You just', 'You’d just'], a: 0,
      cue: '文頭、you のすぐあとの小さな音。',
      line: '*You’ve just* walked into her office. And begin.',
      said: '「今オフィスに入ったところ。はい、始めて」と場面を決める。',
      mean: '’ve はごく弱い v だけ。現在完了で「入ったばかり」。',
      trap: '’ve は消えたように聞こえ、You just と取りやすい。just の前の小さな音を聞く。',
      use: 'You’ve just landed. What do you do first?（着いたばかり。まず何する？）' },

    // R fix: V2 (blind 60 %): アグレッシブ (= keen, active in Japanese) is a stronger trap than "moving fast", so it
    //   replaces it; the segment ended inside "I'm going" and now ends at 190.1 s
    // why: respect ← the Japanese frame: standing while a client sits is polite; keen ← katakana アグレッシブ = 積極的
    { id: 'd2', skill: 'detail', level: 'B1', point: 'stand', seg: [182.6, 190.1],
      stem: 'Why does Dwight turn down the seat he’s offered?',
      choices: ['To look strong and intimidating', 'To look keen and full of energy', 'To show respect while she sits'],
      a: 0,
      cue: '「I want to」のあと、2つの形容詞。',
      line: 'Please have a seat. — I never sit down during sales meetings. I want to appear *aggressive and imposing*.',
      said: '座るよう勧められ、「商談中は座らない。攻撃的で威圧的に見せたい」と答える。',
      mean: '客に圧をかけるための立ち方。売り込みの場では逆効果になる考え方。',
      trap: '立つのは礼儀、と日本の感覚で取りやすい。アグレッシブ＝積極的とも違い、ここは威圧。',
      use: 'Please, have a seat.（どうぞ、おかけください）' },

    // why: 2 ← twelve's "tw-" caught, the weak "-elve" lost; 20 ← twelve and twenty share the "twe-" onset
    // R fix: S4: the segment ended inside "actually"; it now ends at 192.15 s
    { id: 'n3', skill: 'number', level: 'B1', point: 'twelve', seg: [188.3, 192.15],
      stem: 'How quickly does Dwight promise to make his sale?',
      choices: ['In 2 minutes', 'In 12 minutes', 'In 20 minutes'], a: 1, keep: true,
      cue: '「sell to you」のあと、in に続く数。',
      line: 'I’m going to sell to you in *twelve minutes*.',
      said: '「12分であなたに売ってみせる」と宣言する。',
      mean: '相手の話を聞く時間は取らず、決めた時間で押し切るつもり。',
      trap: 'twelve と twenty は出だしが同じ。最後が「ルヴ」なら12、「ティ」なら20。',
      use: 'I’ll be ready in twelve minutes.（12分で準備できるよ）' },

    // R fix: V4: Dwight states the plan in words ("I will tell her what her needs are"), so it's a detail, not an
    //   infer. V2 (blind 50 %): the key was the only odd choice; all three now end "then meet them"
    // why: ask first ← the usual sales script, plus "fill them"; give her time ← the coach's own suggestion, heard as
    //   agreed to
    { id: 'i5', skill: 'detail', level: 'B2', point: 'needs', seg: [191.7, 198.6],
      stem: 'After the coach steps in, how does Dwight plan to deal with the buyer?',
      choices: ['Decide her needs for her, then meet them', 'Ask about her needs, then meet them fast',
                'Let her take her time, then meet her needs'], a: 0,
      cue: '「I will」で始まる返事。',
      line: 'she’d like to take her time discussing her needs. — *I will tell her what her needs are* and then fill them.',
      said: '「彼女は時間をかけて要望を話したい」と言われ、「何が必要かは私が言う。そして満たす」と返す。',
      mean: '相手に聞くどころか、要望まで自分で決める。教わったことの正反対。',
      trap: 'コーチの言葉が先に聞こえるので、それに合わせると思いやすい。返事の主語は I。',
      use: 'Tell me what you need.（何が必要か教えて）' },

    // anchor: 214.08–217.6 s "have you ever killed a woman?" (a yes/no question) becomes "How many women have you
    //   killed?" (it assumes a yes); the plea "Please, sir, will you not kill me?" comes only at 218.24 s
    // R fix: V2 (blind 70 %): "kill the asker" was off the question's form. It's replaced by the scope shift "many,
    //   not one", the near miss a fluent non-native takes from “how many”
    // why: many ← "how many" heard as "a lot of" (scope shift); men not women ← "women" is the word stressed in both
    //   questions, so the contrast seems to be men vs women
    { id: 'c2', skill: 'infer', level: 'C2', point: 'killed', seg: [211.2, 220.4],
      stem: 'What does the second of the written questions assume that the first didn’t?',
      choices: ['That he has killed; only how many is open', 'That he has killed many women, not just one',
                'That he has killed men, but never any women'], a: 0,
      cue: '1つ目と2つ目の質問の、文頭の形の違い。',
      line: 'One, *have you ever* killed a woman? *How many* women have you killed? Please, sir, will you not kill me?',
      said: '「殺したことは？」「何人殺した？」「どうか殺さないで」と続ける。',
      mean: 'ever の質問は「ある／ない」を聞くが、How many は「ある」が前提。質問の形だけで、話が一段こわくなる。',
      trap: 'How many は「たくさん」とは限らない。1人以上が前提なだけ。文頭の形で、何が前提か分かる。',
      use: 'How many times have you been late?（何回遅刻した？）' },

    // R fix: V2 (blind 60 %): the key was the only one about "show". The confession filler is replaced by the wrong
    //   direction (he claims his hairs do move, "vibrate" being the word heard)
    // why: weak ears ← "our external hairs don't vibrate at all" heard as a hearing problem; hairs move ← "vibrate to
    //   indicate" heard, "don't" lost
    { id: 'h2', skill: 'humor', level: 'C1', point: 'showus', seg: [232.9, 246.2],
      stem: 'Why is Dwight’s reply to “you have to show us” funny?',
      choices: ['He takes “show” as a body sign, which humans lack',
                'He claims his ear hairs move as he listens',
                'He says his ears are too weak to really listen'], a: 0,
      cue: '「impossible」のあと、体の話をする部分。',
      line: 'You have to show us. — *That’s impossible.* Listening happens in the ear and in the brain… our external hairs *don’t vibrate at all*.',
      said: '「見せて」に「無理だ。聞くのは耳と脳の中。人間の毛は振動しない」と返す。',
      mean: 'show を「体に見える証拠」と取っている。うなずきなど態度で示す、という意味が通じていない。',
      trap: '毛の話を「耳が悪い」と取りやすい。our は人間全体、don’t は否定。',
      use: 'Show me you’re listening.（ちゃんと聞いてるって態度で見せて）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'nod', seg: [249.9, 254.1],
      stem: 'Type what the coach says: “___ shows that I hear you.” (6 words)', answer: 'a little smile and a nod',
      cue: '「What are you doing?」の答え、文の前半。',
      line: '*A little smile and a nod* shows that I hear you.',
      said: '「少しほほえんで、うなずく。それで聞いてると伝わる」と見せる。',
      mean: 'a と and が弱く、little の t は弾んで「リル」。全体が一息でつながる。',
      trap: '2つの a が落ちやすく、nod は not に聞こえやすい。名詞の前の a を確かめる。',
      use: 'A smile goes a long way.（笑顔ひとつで全然ちがう）' },

    // why: modest ← the Japanese 謙遜 frame ("まあ一応", said when you do understand); easy ← "kind of" heard as the
    //   casual "sort of, yeah"
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'kindof', seg: [250.3, 259.05],
      stem: 'When the coach asks if he’s got it, what does Dwight’s answer say?',
      choices: ['He only half gets it so far', 'He gets it but is being modest', 'He gets it and finds it easy'], a: 0,
      cue: '「Got it?」への短い返事。',
      line: 'Got it? — *Kind of.*',
      said: '「分かった？」と聞かれて、「まあ、なんとなく」と答える。',
      mean: 'Kind of ＝ 半分くらい。はっきり yes と言えないときの答え方。',
      trap: '日本語の「一応」のような謙遜と取りやすいが、英語の kind of は本当に「半分」。',
      use: 'Sort of. Can you show me again?（なんとなく。もう一回見せて）' },

    // R fix: V2 (blind 70 %): "Pam's style" was a filler. It's replaced by the forests reading, natural for a paper
    //   company and built on "cutting down trees"
    // why: hires no children ← "child labor" taken as a statement about the company's real practice; forests ←
    //   "cutting down trees" heard as the worry, "-y" lost
    { id: 'h3', skill: 'humor', level: 'C1', point: 'mural', seg: [263.3, 278.3],
      stem: 'Why does Nellie tack a quick “but not…” onto her mural idea?',
      choices: ['Kids cutting trees could look like kids put to work', 'She wants it clear the company hires no children',
                'Cutting trees could look bad for a paper company'], a: 0,
      cue: '絵の中で、子どもたちが何をしているか。',
      line: 'Children of the world coming together, *cutting down trees to make paper*, but not in a *child labor-y* way.',
      said: '「子どもたちが紙のために木を切る。でも児童労働っぽくなく」と話す。',
      mean: '絵が児童労働に見えると気づき、あわてて付け足した。-y は「〜っぽい」。',
      trap: '会社の方針の話と取りやすいが、話しているのは絵のこと。直前の絵の中身とつなげる。',
      use: 'It’s casual, but not in a sloppy way.（ラフだけど、だらしない感じじゃない）' },

    // R fix: V2 (blind 55 %): "happy to go on" contradicted the stop she makes. All three now stop her; only the
    //   feeling differs
    // why: laughing ← the scene is comic and "Look at it" sounds playful; moved ← "can't carry on" heard as being
    //   moved (胸がいっぱい)
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'face', seg: [285.9, 292.6],
      stem: 'How does Nellie react to Dwight’s listening face?',
      choices: ['She’s too creeped out to keep going', 'She’s laughing too hard to keep going',
                'She’s too moved by his effort to go on'], a: 0,
      cue: '話を途中でやめたあとの言葉。',
      line: 'I can’t. I just *can’t carry on* with that face… I’m going to get *nightmares* with that face.',
      said: '「無理。あの顔では続けられない。悪い夢を見そう」と話をやめる。',
      mean: 'carry on ＝ 続ける。気味が悪くて、説明を続けられなくなった。',
      trap: 'can’t carry on を「胸がいっぱい」と取りやすい。nightmares が気持ちを決める。',
      use: 'Sorry, I can’t carry on like this.（ごめん、このままは続けられない）' },

    // why: reason ← lost = 忘れた, cause = 理由 (word by word); fight ← "cause" as in fighting for a cause, "lost" as
    //   one defeat that could be undone
    { id: 'f5', skill: 'phrase', level: 'B2', point: 'lostcause', seg: [334.1, 337.8],
      stem: 'How does the coach describe the training, right after Dwight’s answer?',
      choices: ['Something no amount of effort can fix', 'Something whose reason nobody remembers',
                'A fight they lost but could still win'], a: 0,
      cue: '「this is a」のあとの2語と、続く一言。',
      line: 'Okay, um, this is a *lost cause*. He’s hopeless.',
      said: '「よし…これは見込みなしだ。どうしようもない」と言う。',
      mean: 'a lost cause ＝ もう救えないもの。すぐあとの hopeless も同じ意味。',
      trap: 'lost を「忘れた」、cause を「理由」と取りやすい。2語で一つの決まった言い方。',
      use: 'Fixing this old printer is a lost cause.（この古いプリンターは直しようがない）' },

    // anchor: 342.88–349.7 s "having kids makes you so soft. I used to watch… and laugh, and now I'm like 'That poor…
    //   is somebody's child'": every clause after "Ten years ago, I didn't care…" is about his own change ("I", "you")
    // R fix: V2 (blind 60 %): the Dwight choice now has the same mechanism as the key (pity), so only the target
    //   differs. S4: the segment began inside "hopeless"; it now starts at 337.5 s
    // why: Dwight ← "died a … bachelor" sounds like a dig at him, and "poor…" sounds like pity for him; movie fans ←
    //   "used to… laugh" heard as mocking people who laugh at such films
    { id: 'c3', skill: 'humor', level: 'C2', point: 'soft', seg: [337.5, 351.6],
      stem: 'In the talking head about having kids, who is the joke on?',
      choices: ['The speaker, gone so soft he pities everyone', 'Dwight, so sad a case that even he gets pity',
                'People who laugh at violent films, as he did'], a: 0,
      cue: '「I used to」と「now I’m like」の主語。',
      line: 'But *having kids makes you so soft*. I used to watch Pulp Fiction and laugh, and now I’m like…',
      said: '「昔はドワイトがどうなろうと平気だった。子どもができると甘くなる。今は映画の人も誰かの子に見える」。',
      mean: '自分の変わりようを大げさな例で笑う。ドワイトの話は前ふりで、笑われているのは本人。',
      trap: 'bachelor の部分はドワイトへの皮肉に聞こえやすい。主語の I を追うと、ずっと自分の話。',
      use: 'Since my kids came, I cry at ads.（子どもができてから、CMで泣く）' },
  ]
};
