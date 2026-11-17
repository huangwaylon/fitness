// “Harper & Dutch Kiss! 😘 | Full Scene | iCarly” (NickRewind, Best of iCarly): after the treehouse trip, Carly and
// Harper own up to their crushes (Harper on Dutch; Carly torn between Wes and Beau), Freddie's pitch fails until someone
// puts in $13, Harper and Dutch agree to keep it professional, and Wes leads Carly to a stage for her award.
// Segments from the captions, words from whisper (2026-11-17). Carly (306, 312, 328 s), Wes (281 s), Beau (55 s),
// Dutch (17, 200 s) and Spencer (98 s) are named in the audio; Harper and Freddie aren't, so no key rests on who says
// a line, and whoever puts in the money is "someone". Lines where the sources split are kept out of keys:
// "Do you still have / I have feelings for him" (34 s), "But we did it" (86 s), "An Irish / Finally Rich terrier"
// (114 s), "a fad / bad" (146 s: d3's key, "his dad doesn't believe in it", holds either way), "Spencer and Millicent /
// Spencer Milson" (151 s), "Thunder Steeler / stealer" (188 s), "psycho-professionalism" (240 s), one or two
// "I love you"s (335 s). No item uses the dog pitch itself (108–133 s) or the tarp beat (192–207 s).
// REVIEW 2026-11-17: pass 8, fix 15, drop 0, new 0; ear checks 2 (a3's came off: it now rests on words)
// OPEN: who puts in the $13 (171–178 s) isn't named; g2 and n2 now avoid "friend". If the user knows it's Millicent
//   (Freddie's stepdaughter), nothing else needs to change.
// EAR CHECK: 43.3 s s1 — “haven't” (both sources): the n't survives only as a nasal before “been”
// EAR CHECK: 162.1 s x1 — “squeeze in one last failure” (both sources): “squeeze in” and “last” link as claimed
import type { Clip } from '../types.ts';

export const dutchKiss: Clip = {
  id: 'dutchkiss', video: 'wO0Nvbio8iE', title: 'Harper & Dutch Kiss!', dur: 344, wpm: 132, band: 'slow',
  tags: ['恋愛', '友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: blind 75 %: the title ("Harper & Dutch Kiss!") makes "feelings" the obvious key and the other two were
    //   off-topic (V2, §9.4). All three now start from the confession and differ in where the talk goes.
    // why: tell them tonight ← the sitcom script where a confession leads to a plan; keep it secret ← "How dare you
    //   read me so accurately" heard as Harper wanting it hushed up
    { id: 'g1', skill: 'gist', level: 'B1', point: 'talk', reveals: ['dutch'], seg: [1.5, 75.3],
      stem: 'What are Carly and Harper mostly doing in their first talk?',
      choices: ['Admit who they like, then ask each other hard questions',
                'Admit who they like, then make a plan to tell them tonight',
                'Admit who they like, then swear to keep it a secret'], a: 0,
      cue: '話の最後、二人がそれぞれ何を聞いているか。',
      said: '二人がそれぞれの気持ちを認め、最後に問いを投げ合う。',
      mean: '答えの出ない問いで終わる。計画も約束もない。',
      trap: '告白のあとは作戦、という型を思い浮かべやすい。最後の question is を聞く。',
      use: 'Okay, fine. I like him.（分かったよ、好きなの）' },

    // R fix: blind 60 % (the title names Dutch, and only the key held her); the cue leaked "for" and pointed at a
    //   name. The runway filler is now a Dutch keyword trap, and the cue points at "so you could".
    // why: award ← the reason Harper herself gives ("my best friend was getting an award"); dress Dutch ← Harper is
    //   Dutch's stylist, and "Dutch" is said, but it's Harper who would look good
    { id: 'd1', skill: 'detail', level: 'B1', point: 'dutch', seg: [11.4, 18.7],
      stem: 'Why does Carly say Harper packed all the cute clothes?',
      choices: ['To look good for Dutch', 'To dress Dutch for the award', 'To wear to Carly’s award'], a: 0,
      cue: '「You liar」のあと、「so you could」の部分。',
      line: 'You packed all these cute clothes so you could *look good for Dutch*.',
      said: '「Dutch によく見られたくて服を詰めたんでしょ」と言う。',
      mean: 'Harper の表向きの理由（親友の授賞）を、Carly が見抜いている。',
      trap: '賞は表向きの理由。Dutch だけ拾うと「Dutch に着せる」に。look good の主語は you。',
      use: 'You just want to look good for her.（あの子によく見られたいだけでしょ）' },

    // R fix: blind 65 %: "taking back her thanks" was a filler, so the key was the only light reading. The new
    //   distractor is also a tease, aimed at Harper's runway exaggeration, and the next sentence refutes it.
    // why: lying about the award ← "liar" taken at face value (the award is real, as the end shows); overstating ←
    //   "rented enough runway to land a plane" is the line right before, so "liar" could answer the exaggeration
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'liar', reveals: ['dutch'], seg: [11.4, 18.7],
      stem: 'What is Carly doing when she calls Harper a liar?',
      choices: ['Teasing her for hiding her real reason', 'Accusing her of lying about the award',
                'Teasing her for overstating how much she packed'], a: 0,
      cue: '「that’s sweet」の直後の言い方と、続く文。',
      line: 'Aw, that’s sweet. *You liar.*',
      said: '「やさしいね」と言った直後に「うそつき」と言い、本当の理由を言い当てる。',
      mean: '親しい相手への「もう、ばればれだよ」。責めているのでなく、からかっている。',
      trap: '直前の大げさな話への「うそ」にも聞こえる。liar の次の文が、何のうそかを示す。',
      use: 'Oh, you big liar. You loved it.（もう、うそばっかり。楽しかったくせに）' },

    // R fix: blind 55 %: the third choice broke the "starts out angry" frame, so the key stood out. All three now
    //   share the frame and differ only in the ending, which "read me so accurately" settles.
    // why: a no ← "How dare you" heard alone is an offended denial; unfinished ← the second-long pause after "How dare
    //   you…" sounds like she has trailed off
    { id: 'h1', skill: 'humor', level: 'C1', point: 'dare', reveals: ['dutch'], seg: [11.4, 23.2],
      stem: 'Why is Harper’s answer to “You like her” funny?',
      choices: ['It starts out angry, then ends up as a yes', 'It starts out angry, then ends up as a no',
                'It starts out angry, then ends up unfinished'], a: 0,
      cue: '「How dare you」のあと、少し間をおいて続く言葉。',
      line: '*How dare you*… *read me so accurately*.',
      said: '「よくもまあ…私のことをそんなに正確に見抜いたわね」と返す。',
      mean: '怒る型の文を、白状で終える。「その通り」を大げさな形で言う冗談。',
      trap: 'How dare you だけ聞くと怒りに見える。後半まで聞いて、何に「よくも」なのかを確かめる。',
      use: 'How dare you know me so well.（よくもそこまで分かってるね）' },

    // R fix: blind 70 %: the stem ("Carly’s own “How dare you…”") pointed straight at the reuse. The stem now names
    //   the moment only, and the best distractor reuses the line too, but to deny.
    // why: deny ← the copied frame heard as a hot denial, with "true events" lost; truly upset ← the treehouse topic
    //   sounds sore, and "How dare you" alone is anger
    // anchor: 18.72 s Harper's "How dare you… read me so accurately"; 29.40 s Carly's "How dare you… recount true
    //   events": the same frame, its end doing the admitting
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'dare', reveals: ['dutch'], seg: [11.4, 32.9],
      stem: 'Why does Carly’s answer about Beau get a laugh?',
      choices: ['She reuses Harper’s line to admit it’s true', 'She reuses Harper’s line to deny it hotly',
                'She is truly upset that the fall came up'], a: 0,
      cue: '文の後半、何に「よくも」と言っているか。',
      line: 'How dare you… read me so accurately. … *How dare you… recount true events.*',
      said: 'Harper の「よくもまあ…」を、Carly が「よくも本当のことを話したわね」とまねて返す。',
      mean: '同じ型をすぐ返すのが笑い。怒った形のまま、Beau に手をのばしたことを認めている。',
      trap: '同じ型なので、言い返しの否定に聞こえやすい。true events で、認めていると分かる。',
      use: 'How dare you remember my birthday.（よくも誕生日を覚えてたね）' },

    // why: time together ← "all weekend" heard as time apart; not talking ← "page" read as messages, being out of touch
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'page', seg: [39.4, 45.6],
      stem: 'What does Carly say about Wes and her this weekend?',
      choices: ['They haven’t seen things the same way', 'They haven’t had much time together',
                'They haven’t been talking to each other'], a: 0,
      cue: '「Wes and I」のあと、「all weekend」の前。',
      line: 'Wes and I haven’t been *on the same page* all weekend.',
      said: '「この週末、Wes とはずっと噛み合ってない」と言う。',
      mean: 'on the same page ＝ 考えや認識が一致している。本や紙の話ではない。',
      trap: 'page から連絡やメッセージを想像しやすい。週末ずっと一緒にいても、気持ちがずれることを言う。',
      use: 'Let’s make sure we’re on the same page.（認識を合わせておこう）' },

    // R fix: blind 50 %: the stem's "But" signalled the negative before any listening. The stem now starts at "Wes".
    // why: have ← n't's t drops before "been", so it sounds like "have"; hadn't ← "a week ago" just before pulls toward
    //   the past perfect
    { id: 's1', skill: 'sound', level: 'B2', point: 'page', seg: [39.4, 45.6],
      stem: 'Fill the gap: “Wes and I ___ been on the same page…”',
      choices: ['have', 'haven’t', 'hadn’t'], a: 1,
      cue: '「Wes and I」のすぐあと、短い語の最後の音。',
      line: 'But Wes and I *haven’t* been on the same page all weekend.',
      said: '「でも、この週末はずっと Wes と噛み合っていない」と言う。',
      mean: 'haven’t の t は been の前でほぼ消え、「ハヴン」の n だけが残る。',
      trap: 'have に聞こえても、but のあとで気持ちが変わった話なので否定。最後の n の音を聞く。',
      use: 'I haven’t been sleeping well.（最近よく眠れてない）' },

    // R fix: blind 60 %: the key was the only "grants the point" choice, against a full yes and a plain misreading.
    //   Two choices now grant the point, and the third pushes back.
    // why: settles on Wes ← "Yeah" read as full agreement (the はい frame); doubts ← "Yeah, but" heard as a polite no,
    //   with "then there's Beau" taken as a change of topic
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'yeahbut', seg: [50.2, 58.5],
      stem: 'After Harper says different people can make great couples, what does Carly’s reply do?',
      choices: ['Grants the point, then brings up Beau', 'Grants the point, and settles on Wes',
                'Doubts the point, then changes the topic'], a: 0,
      cue: '最初の一語と、そのすぐあとの接続の語。',
      line: '*Yeah, but then there’s Beau.* I mean, he makes everything so easy.',
      said: '「そうだけど、でも Beau がいるの。彼といると何でも楽なの」と返す。',
      mean: 'Yeah, but… は一度受けてから別の考えを出す形。話題は恋の迷いのまま。',
      trap: 'Yeah だけなら同意、but だけなら反対に聞こえる。両方聞いて決める。',
      use: 'Yeah, but what about the cost?（そうだけど、費用はどうする？）' },

    // why: fights broke them up ← "broke up" + "fight" put together (wrong implication); made the plans ← "makes
    //   everything so easy" read as doing everything for her
    { id: 'i1', skill: 'infer', level: 'B2', point: 'fewfights', reveals: ['third', 'yeahbut'], seg: [50.2, 62.4],
      stem: 'What does Carly’s breakup comment suggest about her time with Beau?',
      choices: ['They hardly ever argued at all', 'Their fights finally broke them up', 'He made all the plans for her'],
      a: 0,
      cue: '「broke up」のあと、数のことば。',
      line: 'he makes everything *so easy*… that was, like, *the third fight* we’ve ever had.',
      said: '「彼といると何でも楽」、別れたときが「3回目くらいのけんか」だったと言う。',
      mean: '別れの原因の話でなく、ほとんどけんかしない仲だった、ということ。',
      trap: 'broke up と fight が並ぶと「けんかで別れた」と読みやすい。',
      use: 'We hardly ever fight.（ほとんどけんかしないの）' },

    // why: first ← "ever had" suggests a first-ever; thirtieth ← third/thirtieth share "thir-", and the ending is easy
    //   to imagine
    { id: 'n1', skill: 'number', level: 'B1', point: 'third', reveals: ['fewfights'], seg: [58.2, 62.4], keep: true,
      stem: 'About the breakup with Beau, which fight does Carly say it was?',
      choices: ['Their first', 'Their third', 'Their thirtieth'], a: 1,
      cue: '「that was like the」のあと、fight の前。',
      line: 'when we broke up, that was, like, *the third fight* we’ve ever had.',
      said: '「別れたときのけんかが、たしか3回目だった」と言う。',
      mean: 'like は「たしか・〜くらい」のぼかし。それほどけんかが少なかった、ということ。',
      trap: 'ever had から「初めて」を選びやすい。thirtieth なら語尾が長い。',
      use: 'That was like the third time this week.（今週これで3回目くらい）' },

    // R fix: blind 55 %: "exactly like you" was refuted by the stem's own "second kind". It's now "goes along with
    //   you" (comply heard in complement), a near miss built from the word.
    // why: praises ← compliments/complements sound the same (both sources write "compliments"); goes along ← the
    //   "com-" start heard as comply, an easy partner
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'complement', seg: [62.1, 68.1],
      stem: 'What is the second kind of partner in Harper’s question?',
      choices: ['Someone different who balances you out', 'Someone who praises you all the time',
                'Someone who goes along with what you want'], a: 0,
      cue: '「someone who’s like you」と、「or」のあとの対比。',
      line: 'do you want someone who’s *like you* or do you want someone who *complements you*?',
      said: '「自分に似た人がいい？それとも自分を補ってくれる人？」と聞く。',
      mean: 'complement ＝ 足りない所を補う。compliment（ほめる）と同じ音。',
      trap: 'ほめる人、合わせる人と取りやすいが、or の前の like you と対になっている。',
      use: 'Their skills really complement each other.（二人の得意分野がうまく補い合ってる）' },

    // why: change careers ← "risk your dream career" heard as Dutch asking her to give it up; take her job ← "risk" +
    //   "dream career" read as competition
    { id: 'i2', skill: 'infer', level: 'C1', point: 'career', reveals: ['dutch'], seg: [67.8, 75.3],
      stem: 'What does the second question suggest about Dutch?',
      choices: ['She is part of Harper’s working life', 'She wants Harper to change careers',
                'She might take Harper’s dream job'], a: 0,
      cue: '「dream」が2回出る文。何と何を比べているか。',
      line: 'are you willing to *risk your dream career* for your *dream girl*?',
      said: '「夢の彼女のために、夢の仕事を危険にさらせる？」と聞き返す。',
      mean: '恋が仕事に響く＝相手は仕事の関係者。あとで「一緒に働いている」と出てくる。',
      trap: 'risk から「仕事を奪われる」「転職」を想像しやすいが、恋と仕事が同じ場所にあるから危ない。',
      use: 'Is it worth risking your job?（仕事を危険にさらす価値ある？）' },

    // R fix: who puts in the $13 isn't settled by the audio (not named; it may be family, not a friend), so the key
    //   and the notes now say "someone close" instead of "a friend".
    // why: investor yes ← "best pitch I've ever heard" + "Congratulations"; gives up ← "before I give up entirely" is said
    { id: 'g2', skill: 'gist', level: 'B2', point: 'backing', seg: [132.7, 190.5],
      stem: 'How does Freddie’s pitch story end?',
      choices: ['Someone close backs him with all the cash they have', 'The investor says yes once he hears the dog',
                'He gives up on his business for good'], a: 0,
      cue: '投資家が去ったあと、「You can’t give up」から。',
      said: '投資家には断られるが、身近な人が「あきらめないで」と手持ちのお金で出資する。',
      mean: '大きな投資より、信じてくれる人の小さな出資が響く結末。',
      trap: 'best pitch や Congratulations で成功に見えるが、断られている。',
      use: 'Thanks for believing in me.（信じてくれてありがとう）' },

    // R fix (S4): "best pitch I've ever heard" (134 s), the only refutation of the pitch distractor, was outside the
    //   segment, and taking it in runs past 15 s. That distractor is now one the segment refutes ("so bummed I can't
    //   invest"), and the segment starts at "I'm so bummed".
    // why: dislikes dogs ← "dogs are just a fad" heard as his own view; spent ← "bummed I can't" read as a money
    //   problem
    { id: 'd3', skill: 'detail', level: 'B1', point: 'dad', seg: [136.2, 149.4],
      stem: 'Why can’t the investor put money in?',
      choices: ['His dad doesn’t believe in the idea', 'He doesn’t really like dogs himself',
                'He has already spent all his money'], a: 0,
      cue: '「Yeah」で始まる、断りの理由。',
      line: 'I’m so bummed I can’t invest. … Yeah, *my dad thinks* dogs are just…',
      said: '「投資できなくて悔しい。父が犬のビジネスを認めなくて」と理由を言う。',
      mean: '本人は乗り気だが、お金を決めるのは父。断りを父のせいにしている。',
      trap: 'dogs are just… を本人の意見と取りやすい。my dad thinks が誰の考えかを決める。',
      use: 'My boss won’t let me, sorry.（上司がだめって言うんだ、ごめん）' },

    // why: grateful ← "set this up" = arranged it as a favour (sincerity flip); pleased ← the "best pitch" praise just
    //   before
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'setup', reveals: ['squeeze'], seg: [159.0, 164.7],
      stem: 'How does Freddie sound when he says “So you set this up”?',
      choices: ['Hurt, as if he’s only being pitied', 'Grateful that someone helped him out',
                'Pleased that the meeting went so well'], a: 0,
      cue: '「one last failure」と、文の最後の「or—」。',
      line: 'So you set this up. What, just so I could *squeeze in one last failure* before I *give up entirely*?',
      said: '「お膳立てしたのか。あきらめる前に、最後にもう一回失敗させるため？」と言う。',
      mean: '思いやりで用意されたと気づき、傷ついている。',
      trap: 'set this up は感謝にも取れるが、続く failure と give up が気持ちを示す。',
      use: 'Wait, did you set this up?（待って、これ仕組んだの？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'squeeze', seg: [160.9, 164.7],
      stem: 'Type the words: “…just so I could ___ before I give up entirely.” (5 words)',
      answer: 'squeeze in one last failure',
      cue: '「so I could」のすぐあと。最初の2語はつながって短い。',
      line: 'just so I could *squeeze in one last failure* before I give up entirely',
      said: '「あきらめる前に、最後の失敗をもう一つ押しこむため」と言う。',
      mean: 'squeeze in ＝ 予定のすき間に入れる。squeeze と in がつながり「スクウィーズィン」。',
      trap: '2語が一語に聞こえやすい。one last も t が消えやすい。',
      use: 'Can you squeeze in a quick meeting?（ちょっと打ち合わせ入れられる？）' },

    // why: $30 ← -teen/-ty, the stress on "thir-" heard as thirty; $3 ← "only" suggests the smallest amount
    // R fix: the stem's "his friend" isn't settled by the audio (see g2); it now names the moment instead.
    { id: 'n2', skill: 'number', level: 'B1', point: 'thirteen', seg: [171.5, 179.0], keep: true,
      stem: 'When someone finally offers Freddie money, how much is it?',
      choices: ['$3', '$13', '$30'], a: 1,
      cue: '「only」のすぐあと。語尾の長さに注目。',
      line: 'In fact, it’s only *$13*. That’s all I have…',
      said: '「実は13ドルだけ。それが手持ちの全部」と言う。',
      mean: 'thirteen は後ろに強勢があり「サーティーン」と語尾が長い。thirty は前が強く、短く終わる。',
      trap: '-teen と -ty は日本語話者が迷いやすい。強勢の位置と、語尾の n を聞く。',
      use: 'It’s thirteen, not thirty.（30じゃなくて13だよ）' },

    // R fix: blind 55 %: "paying him in drinks" was close to a filler, which left the key as the only money-talk
    //   reading. It's now a wrong implication of "only $13", refuted by "I'm in!" and "You have every reason to
    //   believe in this"; the third choice is reworded to the same shape.
    // why: doubt ← "only $13" heard as a token, half-hearted offer; someone else's ← "all I have" heard as "all I
    //   could get hold of"
    { id: 'h3', skill: 'humor', level: 'C1', point: 'liquid', reveals: ['thirteen'], seg: [171.5, 179.0],
      stem: 'Why does “That’s all I have, liquid” get a laugh?',
      choices: ['Big-investor talk is used for pocket money', 'The tiny sum shows doubt about the idea',
                'The word admits the cash is someone else’s'], a: 0,
      cue: '金額と、最後に付けた一語の差。',
      line: 'it’s only $13. That’s all I have, *liquid*. I’m in!',
      said: '「13ドルだけ。すぐ動かせるお金はこれで全部。乗った！」と言う。',
      mean: 'liquid は「すぐ使える資金」という投資家の言葉。13ドルに使う大げささが笑い。',
      trap: 'only から「本気でない少額」と取りやすいが、I’m in で出資を決めている。',
      use: 'Count me in!（私も乗った！）' },

    // why: dating secretly ← the title says they kiss, and "I think you feel it too — Yeah, I do"; stop working ← "we
    //   work together" read as the problem to remove
    { id: 'g3', skill: 'gist', level: 'B2', point: 'decide', reveals: ['career'], seg: [209.1, 260.3],
      stem: 'What do Harper and Dutch agree on in their talk?',
      choices: ['To put their feelings aside for the job', 'To start dating but keep it a secret',
                'To stop working together so they can date'], a: 0,
      cue: '「Yeah, I do」のあとの「But」から。',
      said: '互いの気持ちを認めたうえで、「一緒に働いているし夢の仕事だから、仕事を優先しよう」と決める。',
      mean: '恋より仕事を選ぶ、という合意。',
      trap: '気持ちを認め合うので交際の話に見えるが、But のあとで仕事を優先すると決めている。',
      use: 'Let’s keep it professional.（仕事として割り切ろう）' },

    // R fix: blind 50 %: the key alone echoed the stem's "love", and the cue leaked "love"; "office rules" was weak.
    //   The key is reworded, the cue no longer names the word, and the weak choice is now the sincere reading.
    // why: mocks ← "really love" read as sarcasm; switched off ← the line taken as a calm compliment that shows the
    //   plan already worked
    { id: 'h5', skill: 'humor', level: 'C1', point: 'bound', seg: [235.7, 245.5],
      stem: 'Why is “I really love your boundaries” funny here?',
      choices: ['Its romantic wording undoes what they agreed', 'It mocks the other one for being too strict',
                'It proves the feelings are already switched off'], a: 0,
      cue: '直前の合意の中身と、この一言の言葉選び。',
      line: 'So we agree! … turn off our feelings… — I *really love your boundaries*.',
      said: '「気持ちはオフに」と決めたあと「あなたの線引き、本当に好き」と言う。',
      mean: '恋をやめると決めた直後に、恋の言葉で相手をほめる。気持ちが隠せていない。',
      trap: '合意の直後なので、ほめ言葉にも皮肉にも取れる。really love に気持ちがもれている。',
      use: 'I respect your boundaries.（あなたの線引きを尊重するよ）' },

    // R fix: blind 55 %: the key was the one nuanced middle between relief and fury. The distractors are now two
    //   near misses the words refute, so the item rests on words, not tone, and its ear check comes off.
    // why: acting as if nothing happened ← "There you are… looking everywhere" opens like a normal greeting; blaming
    //   Beau ← "Beau's arms" heard as Beau grabbing her, though "I will jump on you" puts it on Wes himself
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'arms', seg: [268.3, 279.6],
      stem: 'When Wes finds Carly, how does he sound about the treehouse moment?',
      choices: ['Hurt, and making a pointed joke about it', 'Calm, and acting as if it never happened',
                'Angry, and blaming Beau for grabbing her'], a: 0,
      cue: '「First place I checked」のあとの場所。',
      line: 'I’ve been looking everywhere for you. *First place I checked was in Beau’s arms.*',
      said: '「ずっと探してた。最初に見たのは Beau の腕の中」と言う。',
      mean: 'ツリーハウスで Beau に手をのばしたことへの、傷ついた当てこすり。',
      trap: '出だしはふつうのあいさつ。Beau を責めると取りやすいが、次は自分が飛びつくと言う。',
      use: 'Funny, I thought you’d be with him.（へえ、彼と一緒だと思ってた）' },

    // why: spent too much ← "had it flown in" = expensive; forgot ← "flown out" heard as a missed flight
    { id: 'i5', skill: 'infer', level: 'B2', point: 'flown', seg: [319.5, 329.0],
      stem: 'What does Carly’s question about flying show she has realized?',
      choices: ['Wes could have got them home all along', 'Wes spent far too much on her award',
                'Wes forgot to book their flights home'], a: 0,
      cue: '「flown in」と「flown out」の違い。',
      line: 'I had it *flown in* this morning. — Does that mean you could have had us *flown out*?',
      said: '賞を空輸したと聞き「じゃあ私たちを帰すこともできたの？」と聞く。',
      mean: '運べたのなら、帰る手段もあった。Wes はわざと残っていた、と分かる。',
      trap: 'flown in から費用の話に見えるが、in（ここへ）と out（ここから）の対比が鍵。',
      use: 'You could have told me sooner!（もっと早く言えたでしょ！）' },

    // why: a show ← "arena" taken literally, and they stand on a stage he built; rather not hear ← "if I could just go
    //   first" heard as cutting him off to avoid his news
    // anchor: 328.02 s "I have something to tell you, Carly"; 331.98–333.24 s "so if I could just go first, I'll be
    //   real quick"; 335.24 s "I love you"
    // R fix: blind 55 %: the stem quoted "of what I wanted to say", which answers half the item (S2). It now names
    //   the moment only.
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'arena', seg: [324.1, 337.4],
      stem: 'When Wes says he has something to tell her, what does Carly’s reply do?',
      choices: ['Says his news sounds like hers, so she wants to go first',
                'Says his news sounds like a show, so she wants to leave',
                'Says his news sounds bad, so she would rather not hear it'], a: 0,
      cue: '「so if I could just」のあとと、最後の一言。',
      line: 'this feels like it’s *in the arena of what I wanted to say*, so *if I could just go first*…',
      said: '「伝えたいことがある」と言われ、「私が言いたいことと近い気がする。先に言わせて」と返す。',
      mean: 'in the arena of ＝「〜のあたり」。同じ告白が来ると察し、先に言いたいと伝える。',
      trap: 'arena を会場と取ると「帰りたい」に引かれる。ぼかし語のあとに本体（go first）が来る。',
      use: 'That’s kind of in the same ballpark.（だいたい同じようなことだね）' }
  ]
};
