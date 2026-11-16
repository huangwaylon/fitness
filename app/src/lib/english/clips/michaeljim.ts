// “Michael Becomes Jim - The Office US” (the official The Office channel, BEST OF SEASON 2): Jim tells the camera he
// confided his old feelings for Pam to Michael, asks him to keep it quiet, and Michael, proud to be trusted, starts
// acting like Jim's buddy (grape soda, sports talk, "the P situation"). Dwight smells a secret and Jim covers with a
// made-up story; later, defending a lunch expense, Michael gives the secret away himself.
// Segments from the captions, words from whisper (2026-11-16).
// Untested on purpose: 19.5–22.5 s (whisper "Wowie, Mikey likey", captions "wow, we might get lucky"), 52–54 s
// (whisper "Hey Jim Beck", captions "gym bag"), 118–123 s (the spelled "P-A-M…": who spells what is unclear), 131–152 s
// (captions "silicate", "peach iced tea"; whisper loops the spelling), 203–226 s (the wig: who asks is unclear, and it's
// visual), 275–303 s (music; captions "pam" at 280.8 s, whisper "Oh, my God").
// No ear checks: every key rests on words both sources agree on, and no key depends on which voice speaks.
// REVIEW 2026-11-16: pass 5, fix 18, drop 1, new 0; ear checks 0
// OPEN: a cold re-read (stems and choices only) still got 15/22 choice items at ≥ 50 %, mostly from show knowledge
//   (Jim–Pam, Michael's neediness, Dwight's suspicion). i1 (75 %) is the clip's premise; it stays.
// OPEN: nt3 (C2) was dropped, so C2 is down to two (nt1, nt2): add a third only if you want the tier fuller.
import type { Clip } from '../types.ts';

export const michaelJim: Clip = {
  id: 'michaeljim', video: 'ABkF3MSxoQg', title: 'Michael Becomes Jim', dur: 303, wpm: 124, band: 'slow',
  tags: ['職場', '友だち'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 80 %) and S3: the key was the only specific choice, and the cue named the lunch-expense scene,
    //   i.e. the key. Now three equally concrete outcomes; the cue only says to listen to the end.
    // why: keeps it ← "my lips are sealed" and the scene with Dwight, where Jim answers for him; Pam's hair ← Michael's
    //   "this must be torture for you" in front of Pam sounds like a slip (but it comes before the promise)
    { id: 'g1', skill: 'gist', level: 'B2', point: 'blurt', reveals: ['between'], seg: [0, 276],
      stem: 'Across the clip, what happens to the promise Michael makes Jim?',
      choices: ['He breaks it while defending a lunch expense', 'He keeps it, even when Dwight pushes him hard',
                'He breaks it while joking about Pam’s hair'], a: 0,
      cue: '最後の場面まで聞く。誰に、何と言うか。',
      line: 'He is in love with *a girl he works with who’s engaged*.',
      said: '秘密を守ると言ったマイケルが、昼食代の言い訳で「同僚の婚約中の子に恋してる」と言う。',
      mean: 'ドワイトには守れたのに、自分から口をすべらせる。',
      trap: 'ドワイトの追及が山場に見えるが、そこはジムが助ける。結末は最後の場面で聞く。',
      use: 'Oops. I wasn’t supposed to say that.（あ、言っちゃいけなかった）' },

    // why: up ← "down" missed, "curls" heard; straight ← "loose" heard as ストレート, and "veil" opens the clip
    // R fix: S4: the segment started inside "answer" and ended inside "and you"; now 6.4–16.7.
    { id: 'd1', skill: 'detail', level: 'B1', point: 'hair', seg: [6.4, 16.7],
      stem: 'How is Pam thinking of wearing her hair for the wedding?',
      choices: ['Down and loose, with big curls', 'Up, with a few loose curls', 'Down and straight, under the veil'],
      a: 0,
      cue: '「I was thinking about」のあと。',
      line: 'I was thinking about wearing it *down*… like *loose with big curls*.',
      said: '髪型を聞かれ、「下ろして、大きな巻き髪でゆるく」と答える。',
      mean: 'wear it down ＝ 髪を下ろす。結い上げるなら up。',
      trap: 'curls だけ拾うとアップを想像しやすい。髪の話は down と up の対を聞く。',
      use: 'I think I’ll wear my hair up today.（今日は髪をアップにしようかな）' },

    // R fix: V2 (blind 85 %): only the key was about feelings; the others were generic. Now three things Jim could
    //   have told Michael, two built on words in his comment (Katie, the drinks); end moved off "and" (42.8).
    // why: Katie ← "I had just broken up with Katie" comes right after, a keyword trap; drinking ← "a couple of drinks"
    //   heard as the thing he confided (that he drinks to cope)
    { id: 'i1', skill: 'infer', level: 'B2', point: 'torture', seg: [28.3, 42.8],
      stem: 'Why does Michael think the hair talk must be hard on Jim?',
      choices: ['Jim once told him he had feelings for Pam', 'Jim once told him he was still upset over Katie',
                'Jim once told him he drinks when things go badly'], a: 0,
      cue: 'マイケルの一言と、直後のカメラへの話。',
      line: 'Man, this must be *torture* for you. … I told Michael about some *feelings I used to have for Pam*.',
      said: '「これはつらいだろう」の直後、ジムがカメラに「パムへの気持ち」を明かす。',
      mean: 'torture ＝ 拷問のようにつらい。好きな人の結婚準備を聞くつらさ。',
      trap: '直後の Katie との別れに飛びつきやすい。それはあの夜の事情で、打ち明けた中身ではない。',
      use: 'Waiting for the results is torture.（結果待ちはほんとにつらい）' },

    // R fix: V2 (blind 80 %): "secret" stood alone against two off-theme choices. Now all three are "the worst / least
    //   … person", and one is built on the drinks he mentions.
    // why: least confident ← confidant and confident sound almost alike; drinking ← "had a couple of drinks" just
    //   before, so "worst" seems to be about the night out
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'confidant', reveals: ['blurt', 'aslong'], seg: [38.4, 47],
      stem: 'How does Jim describe Michael at the end of his comment to the camera?',
      choices: ['The worst person to trust with any secret', 'The least confident person in the office',
                'The worst person to go out drinking with'], a: 0,
      cue: '「world’s worst」のあとの一語。',
      line: '…and I confided in *the world’s worst confidant*.',
      said: '失恋と酒の勢いで、「秘密を守れない最悪の相手」に話した、と言う。',
      mean: 'confidant ＝ 秘密を打ち明ける相手。world’s worst で最悪の人選。',
      trap: 'confident（自信がある）と音がほぼ同じ。前の confided で判断する。',
      use: 'You’re the only one I can trust with this.（こんなこと話せるのは君だけ）' },

    // R fix: V2 (blind 60 %): the key was the only request. Now two "checking" readings built on his literal question
    //   ("You remember…?") and on "Who else knows?", against the request.
    // why: remembers ← "You remember that thing I told you…?" is literally a question; told anyone ← "Who else knows?"
    //   follows right away (but Michael asks it)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'between', seg: [55.3, 64.6],
      stem: 'When Jim brings up the booze cruise, what is he doing?',
      choices: ['Asking Michael to keep it all to himself', 'Checking that Michael still remembers it',
                'Checking whether Michael has told anyone'], a: 0,
      cue: '「That was personal, so」のあと。',
      line: 'That was personal, so if we could just *keep that between you and me*…',
      said: '「個人的な話だから、二人だけのことにしてくれると助かる」と頼む。',
      mean: 'if we could just ～ は、命令せずにやわらかく頼む言い方。',
      trap: 'You remember…? は形だけの質問で、本題の前置き。so のあとに本当の頼みが来る。',
      use: 'Let’s keep this between us, okay?（これはここだけの話ね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'whoknows', seg: [64.2, 68.4],
      stem: 'Type the question after “Really?”: “___?” (3 words)', answer: 'who else knows',
      cue: '「Really?」のすぐあと。短い疑問文。',
      line: 'Really? … *Who else knows?* — Nobody.',
      said: '「ほかに誰が知ってる？」と聞き、「誰も」と返る。',
      mean: 'who else ＝ ほかに誰が。else は who や what のあとに付く。',
      trap: 'else と knows がつながり、一続きに聞こえる。語の切れ目を意識する。',
      use: 'Who else is coming tonight?（今夜はほかに誰が来るの？）' },

    // R fix: V2 (blind 80 %): "hurt that Jim waited" was weak. Now "sorry for Jim" (nobody else → Jim is alone), a
    //   wrong implication of the same words.
    // why: uneasy ← a secret only you know can feel like a weight (重荷), and "Wow" can be shock; sorry ← "Nobody"
    //   heard as Jim having no one else to tell
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'onlyme', seg: [64.2, 75.2],
      stem: 'When he learns nobody else was told, how does Michael feel?',
      choices: ['Proud that Jim chose him alone to tell', 'Uneasy about being the only one to know',
                'Sorry that Jim has no one else to tell'], a: 0,
      cue: '短い反応と、すぐあとのカメラへの第一声。',
      line: '— Nobody. — *Wow.* … Jim and I are *great friends*.',
      said: '誰も知らないと聞いて「わあ」と言い、カメラに「ジムとは大の親友」と話す。',
      mean: '自分だけが打ち明けられたのを、親友の証として喜んでいる。',
      trap: 'Wow は驚きにも困惑にも使う。直後の言葉で、どちらの Wow かが決まる。',
      use: 'Wow, I’m honored you told me.（話してくれて光栄だよ）' },

    // R fix: V2 (blind 70 %): only the key sounded like a joke. Now all three are deadpan claims about the proof.
    // why: never outside ← "mostly at work" heard as "only at work" (mostly ≠ only); go out ← "hang out a ton" heard
    //   as nights out, with "mostly at work" missed
    { id: 'h1', skill: 'humor', level: 'C1', point: 'mostlywork', reveals: ['onlyme'], seg: [69.9, 75.3],
      stem: 'Why is the way Michael backs up his claim about Jim funny?',
      choices: ['His proof is only that they work together', 'His proof is that they never meet outside work',
                'His proof is that they often go out after work'], a: 0,
      cue: '「a ton」のあとの付け足し。',
      line: 'Jim and I are great friends. We *hang out a ton*… *mostly at work*.',
      said: '「大の親友で、しょっちゅう一緒にいる。主に職場で」と言う。',
      mean: '付け足しが前の主張をこわす。職場で会うのは同僚なら当然で、友情の証にならない。',
      trap: '付け足しを事情の説明と取りやすい。自慢のあとの小さな一言が、自慢を打ち消していないかを聞く。',
      use: 'We’re close. Well, we work together.（仲いいよ。まあ、同じ職場だけど）' },

    // R fix: V2 (blind 55 %): the key was the only hedged choice. Now three "his promise lasts…" readings; the near
    //   miss ties the promise to the friendship he has just praised. The key and mean no longer say he will slip, so
    //   nt1 stops revealing g1's 'blurt' (that clash kept nt1 out of every draw led by g1).
    // why: friendship ← "says everything about our friendship, and it is why I intend…" ties the two (but as the
    //   reason, not the length); until Jim allows ← "keep that between you and me" makes the limit Jim's say-so
    // anchor: 81.9–85.7 s "for as long as I possibly can" puts a limit on the promise; 269.3–272.3 s he tells the
    //   expense check "a girl he works with who's engaged"
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'aslong', seg: [75.1, 86.3],
      stem: 'Taken literally, what does Michael’s promise about the secret admit?',
      choices: ['That his promise lasts only while he can manage', 'That his promise lasts as long as their friendship',
                'That his promise lasts until Jim lets him tell'], a: 0,
      cue: '約束の最後に付いた「期限」の言い方。',
      line: 'it is why I intend on keeping that secret *for as long as I possibly can*.',
      said: '「だから、その秘密をできる限り長く守るつもりだ」と胸を張る。',
      mean: '「できる限り長く」は、限界つきの言い方。誓いのつもりで、守り切る自信のなさを先に白状している。',
      trap: '直前の friendship と結びつけやすい。as long as I possibly can は自分の力の限度。',
      use: 'I’ll stay awake as long as I can.（がんばれるだけ起きてるよ）' },

    // R fix: V2 (blind 70 %, §9.4): "like an old buddy" is the title. Now all three are buddy talk, and the choice is
    //   what it leads to; the key gives away the 411 item, so it reveals '411'.
    // why: game invite ← "See the game last night?" heard as plans to watch one; warn ← "Stan" is named, so the chat
    //   seems to be about him overhearing
    { id: 'g2', skill: 'gist', level: 'B2', point: 'vending', reveals: ['411'], seg: [99.6, 131.2],
      stem: 'What is Michael trying to do in the chat by the soda machine?',
      choices: ['Use buddy small talk to get the news on Pam', 'Use buddy small talk to ask Jim to a game',
                'Use buddy small talk to warn Jim about Stan'], a: 0,
      cue: '飲み物、スポーツ、近況。話題の選び方。',
      line: 'Hey, what you getting? … *Good stuff, good stuff.* … *See the game last night?*',
      said: '飲み物を聞き、「いいね」と合わせ、昨日の試合の話を振る。',
      mean: '型どおりの雑談で親友らしく見せ、本題のパムの件の近況へ持っていく。',
      trap: 'game が聞こえると誘いに思えるが、話は last night。誘いなら未来の話になる。',
      use: 'Hey, what are you having?（ねえ、何にする？）' },

    // R fix: V2 (blind 75 %): "forgot which team" was a weak filler. Now a teasing reading (a Japanese ツッコミ frame)
    //   replaces it.
    // why: every game ← "any of them" taken as a real fan's answer; teasing ← Jim's "Which game?" heard as the one who
    //   didn't watch, so "Any of them" sounds like a jab back
    { id: 'h2', skill: 'humor', level: 'C1', point: 'game', seg: [106.3, 113.6],
      stem: 'When asked which game, why is the answer funny?',
      choices: ['It shows he never watched any game at all', 'It shows he watched every game last night',
                'It shows he is teasing Jim for not watching'], a: 0,
      cue: '聞き返されたあとの、短い答え。',
      line: 'See the game last night? — Which game? — *Any of them.*',
      said: '「昨日の試合見た？」「どの試合？」「どれでも」とやり取りする。',
      mean: '話題を振っただけで、試合のことは何も知らない。雑談の型だけをまねていると、答えでばれる。',
      trap: '「どれでも」をスポーツ好きの答えと取りやすい。聞き返されて具体名が出なければ、中身はない。',
      use: 'Did you catch the game last night?（昨日の試合見た？）' },

    // R fix: V2 (blind 50 %): "a quick favor" was a filler. Now "Pam's phone number" (411 = directory help, plus the
    //   P that follows).
    // why: Pam's number ← 411 is the number for directory help, and "P situation" follows; favor ← "So, uh, what's…"
    //   heard as a lead-in to asking
    { id: 'f3', skill: 'phrase', level: 'B2', point: '411', seg: [113.7, 118.4],
      stem: 'What is Michael asking Jim for after the sports talk?',
      choices: ['The latest news', 'Pam’s phone number', 'A quick favor'], a: 0,
      cue: '数字のすぐあとに続く言いかえ。',
      line: 'So, uh, *what’s 411*? Any *updates* on the… P situation?',
      said: '「で、最新情報は？ Pの件、進展ある？」と聞く。Pはパムの頭文字。',
      mean: 'the 411 ＝ 最新情報の古いスラング。直後の any updates が言いかえ。',
      trap: '数字なので番号の話と取りやすい。分からない語は直後の言いかえで確かめる。',
      use: 'So what’s the latest?（で、最新情報は？）' },

    // why: which soda ← "pick out a soda" heard as asking for advice; pull in ← "Listen, Stan, you know" sounds like
    //   a friendly opener
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'stan', seg: [124.1, 128.05],
      stem: 'When Michael turns to Stan, what is his question really doing?',
      choices: ['Telling Stan to hurry up and go', 'Asking Stan which soda is best', 'Pulling Stan into the friendly chat'],
      a: 0,
      cue: '「how long」で始まる質問の目的。',
      line: 'Listen, Stan, you know, *how long does it take* … *to pick out a soda*?',
      said: '「なあスタン、ソーダ選ぶのにどれだけかかるんだ？」と言う。',
      mean: '答えを求める質問ではなく、早く行けという合図。内緒話を聞かれたくない。',
      trap: '前置きで雑談に聞こえやすい。How long does it take は急かす型。',
      use: 'How long does it take to order a coffee?（コーヒー頼むのにどれだけかかるの）' },

    // R fix: V2 (blind 75 %): the key was the only doubting choice. Now a near miss (unsure, wants more) sits next to
    //   it, and the facts list that follows settles it.
    // why: unsure ← "Oh, really?" read as a real question inviting more; amused ← the sing-song repeat heard as
    //   playing along between friends
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'suspect', seg: [152.9, 161.3],
      stem: 'When Dwight repeats Michael’s one-word answer, how does he sound?',
      choices: ['Certain that Michael is hiding something', 'Unsure, so he wants Michael to say more',
                'Amused, as if it were a game between friends'], a: 0,
      cue: '答えをくり返す前の短い一言と、そのあと。',
      line: 'Okay, *what is going on here*? — Nothing. — *Oh, really? Nothing.*',
      said: '「何が起きてる？」「何も」「へえ、何もね」と返し、証拠を並べ出す。',
      mean: 'Oh, really? と相手の言葉のくり返しで、信じていないと示す。',
      trap: 'Oh, really? を素直な問いと取りやすいが、すぐ証拠を並べる。言葉をそのまま返したら疑いの合図。',
      use: 'Oh, really? Nothing at all?（へえ、本当に何もないの？）' },

    // R fix: V2 (blind 60 %): "diet" had no source. Now "peach iced tea" (said at the machine) and "keep secrets"
    //   (Michael's next fact), so each half of the key appears twice.
    // why: Stan ← the name heard just before, at the soda machine; iced tea ← "peach iced tea" is said at the machine;
    //   secrets ← Michael's reply "we tell each other secrets"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'facts', seg: [158.2, 165.2],
      stem: 'What two things does Dwight say Michael never does?',
      choices: ['Drink grape soda and talk to Jim', 'Drink grape soda and keep secrets',
                'Drink peach iced tea and talk to Jim'], a: 0,
      cue: '「fact」のあと、never が2回。',
      line: 'Fact: you’re drinking *grape soda*. You never drink grape soda. Fact: you are *talking to Jim*.',
      said: '「事実：グレープソーダを飲んでいる。普段は飲まない。事実：ジムと話している。普段は話さない」。',
      mean: 'いつもと違う二つの行動を、証拠として並べている。',
      trap: '前後の場面の語が混ざりやすい。fact のたびに区切って聞く。',
      use: 'You never drink coffee. What’s up?（コーヒー飲まないのに、どうしたの？）' },

    // R fix: V2 (blind 50 %) and S1: "a mistake" in the stem steered to the key. The stem is neutral now; the start
    //   moved off "Jim" (165.1).
    // why: likes someone ← the secret is about Pam, so it seems to slip out here (no name or hint is said); soda lie ←
    //   "I love grape soda" is the other "fact", and it does sound false
    { id: 'i2', skill: 'infer', level: 'C1', point: 'slip', seg: [165.1, 173.4],
      stem: 'What does Michael’s last “fact” hand Dwight?',
      choices: ['A secret he could now dig into', 'A sign that Jim likes someone', 'Proof the soda story is false'], a: 0,
      cue: '最後の「fact」と、ドワイトの次の質問。',
      line: 'Fact: Jim and I talk all the time. *We tell each other secrets.* — Okay, so *what is the secret*, Michael?',
      said: '「ジムとはいつも話す。秘密も話し合う」と言い、すぐ「じゃあ秘密は何だ」と聞き返される。',
      mean: '親しさの証拠のつもりで、隠し事があると自分から教えてしまった。',
      trap: '反論がうまくいったように聞こえやすい。相手の次の質問が、どこが失言だったかを示す。',
      use: 'Wait, I didn’t mean it like that.（待って、そういう意味じゃない）' },

    // why: complain ← the story heard as sincere, a real grudge about being passed over; share ← "head up" heard as a
    //   bid for the job that Dwight could still split
    // R fix: S4: 16.9 s was over the 15 s cap; now 170.85–183.6, from “So what is the secret” to “material”.
    { id: 'i3', skill: 'infer', level: 'C1', point: 'cover', seg: [170.85, 183.6],
      stem: 'Why is the story about the Oscar investigation told just then?',
      choices: ['To hide the real secret by flattering Dwight', 'To complain that Michael chose Dwight over him',
                'To get Dwight to share the job with him'], a: 0,
      cue: '問い詰められた直後に出る話。',
      line: 'I had asked Michael if I could *head up the Oscar investigation*… *only Dwight was capable*…',
      said: '「調査の責任者をやりたいと頼んだら、ドワイトにしか任せられないと言われた」と話す。',
      mean: '秘密を聞かれた瞬間の作り話。ドワイトをほめる内容なので、彼は喜ぶ。',
      trap: '中身だけ聞くと不満に聞こえやすい。いつ言ったか（秘密を聞かれた直後）で意図を読む。',
      use: 'Oh, that? It was nothing, really.（ああ、あれ？何でもないよ）' },

    // why: bluff ← "I can tell" heard as "I can see through you" (direction flip); kindness ← the Japanese 察し frame:
    //   he hears the hesitation and lets the fib pass to spare Michael
    // anchor: 188.3–194.6 s "Um, I, I don't know… yeah, yeah, yeah, it is", then 195.7–202.2 s "Thank you, Michael. I
    //   know you're telling the truth… I won't let you down": he thanks, claims to know, and pledges
    // R fix: S3: the cue quoted "yes", a word only the key has; now 口ごもった返事.
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'cantell', reveals: ['cover', 'letdown'], seg: [184.9, 202.75],
      stem: 'How should we hear Dwight saying he can tell?',
      choices: ['As real belief: a shaky “yes” has fooled him', 'As a bluff: he knows the story is made up',
                'As kindness: he lets Michael’s fib slide'], a: 0,
      cue: '口ごもった返事と、そのあとのお礼と誓い。',
      line: 'Um, I, I don’t know… yeah, yeah, yeah, it is. — Thank you, Michael. *I know you’re telling the truth.* … *I can tell.*',
      said: 'マイケルは口ごもってから認め、ドワイトは「本当だと分かる。見抜ける」と礼を言う。',
      mean: '笑いの的はドワイト。ためらいだらけの返事を「本当」と言い切り、見抜く力を自慢する。',
      trap: '「分かる」を皮肉や、察して流したと読みやすい。礼と誓いが続けば本気で信じている。',
      use: 'I can tell you mean it.（本気なのが分かるよ）' },

    // why: want to ← won't and want share "w…n(t)", and the t is barely there; wouldn't ← the "-dn't" is swallowed,
    //   so it can sound like won't
    { id: 's1', skill: 'sound', level: 'B2', point: 'letdown', seg: [199.1, 202.75],
      stem: 'Fill the gap: “I ___ let you down.”',
      choices: ['won’t', 'want to', 'wouldn’t'], a: 0,
      cue: '「I can tell」のあと、I に続く短い語。',
      line: 'I can tell. *I won’t let you down.*',
      said: '「期待は裏切らない」と誓う。',
      mean: 'won’t は will not。母音は「オウ」で、want の「ア」とは違う。',
      trap: 'won’t と want は日本語の耳では同じ「ウォン」になりやすい。母音を聞き分ける。',
      use: 'Don’t worry, I won’t let you down.（心配しないで、がっかりさせないから）' },

    // why: $18 ← "eighty" heard as "eighteen" (-teen/-ty); $800 ← a card taken away sounds like a big bill
    { id: 'n1', skill: 'number', level: 'B1', point: 'amount', seg: [237.9, 243.3], keep: true,
      stem: 'How much did Michael spend that got his card taken away?',
      choices: ['$18', '$80', '$800'], a: 1,
      cue: '「because I spent」のあと。',
      line: 'they took my card away because I spent *80 bucks* at a magic shop.',
      said: '「手品の店で80ドル使ったら、カードを取り上げられた」と言う。',
      mean: 'bucks ＝ ドルのくだけた言い方。eighty は最初が強い。',
      trap: 'eighteen は後ろの teen が強く長い。eighty は ty が短く弱い。',
      use: 'It only cost me twenty bucks.（たった20ドルだったよ）' },

    // why: gifts ← "bought the stuff… clients" heard as presents for them; party ← magic tricks sound like office
    //   party fun
    // R fix: S4: the segment started inside "shop"; now 243.3.
    { id: 'd4', skill: 'detail', level: 'B1', point: 'clients', seg: [243.3, 250.7],
      stem: 'Why does Michael say his magic shop spending was for business?',
      choices: ['He bought the tricks to impress possible clients', 'He bought the tricks as gifts for possible clients',
                'He bought the tricks for a staff party at work'], a: 0,
      cue: '「I bought the stuff」のあと、to に続く動詞。',
      line: 'I bought the stuff *to impress potential clients*. So, business related.',
      said: '「見込み客をうならせるために買った。だから仕事の経費だ」と言う。',
      mean: 'impress ＝ 感心させる。potential ＝ これからの、見込みの。',
      trap: 'bought と clients だけだと贈り物に聞こえる。to のあとの動詞が目的。',
      use: 'I want to impress my new boss.（新しい上司にいいところを見せたい）' },

    // R fix: V2 (blind 50 %): only the key was a let-down. Now "a trick that failed" is a second let-down; the start
    //   moved off "right" (250.1).
    // why: all bought ← "almost" heard as "all most" / "all of them", so the trick sounds like a hit; failed ← the
    //   quarter trick heard as the thing that went wrong
    { id: 'h3', skill: 'humor', level: 'C1', point: 'almost', seg: [250.1, 256.9],
      stem: 'Why is Michael’s proof that the trick worked funny?',
      choices: ['His proof is a sale that never quite happened', 'His proof is a trick that failed in front of them',
                'His proof is clients who all bought from them'], a: 0,
      cue: '手品の話の最後、bought の直前の語。',
      line: 'I put a cigarette through a freaking quarter. And you know what, Toby? They *almost bought* from us.',
      said: '「タバコを硬貨に通したんだぞ。先方は買いかけた」と自慢する。',
      mean: 'almost bought ＝ 買いかけたが、買っていない。証拠が失敗の報告になる。',
      trap: 'almost の弱い音を all と取りやすい。almost は「しかけて、しなかった」。',
      use: 'I almost won the lottery.（宝くじ、もう少しで当たるところだった）' },

    // why: more time ← slack = ゆとり, as with a deadline; paid back ← the expense talk, and "cut me" heard like
    //   "cut me a check"
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'slack', seg: [265.9, 274.8],
      stem: 'What does Michael ask for at the end of his defense of the lunch?',
      choices: ['To be let off easy this time', 'To be given a little more time', 'To be paid back for the lunch'], a: 0,
      cue: '最後の「so just」のあと。',
      line: '…so just *cut me some slack*, please.',
      said: '「だから大目に見てくれよ、頼む」と言う。',
      mean: 'cut someone some slack ＝ 大目に見る。経費を通してほしいという頼み。',
      trap: 'slack を「時間の余裕」と取りやすい。cut me some slack は決まり文句。',
      use: 'He’s new here. Cut him some slack.（彼は新人だから大目に見てあげて）' },

    // R drop: nt3 (C2 infer, "how much does Michael give away"): blind 80 % (V2), the same point as g1, and the key
    //   needs the clip's opening (the veil), outside its segment (S4). Never shipped, so deleted.
  ]
};
