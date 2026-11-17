// REVIEW 2026-11-16: pass 5, fix 18, drop 0, new 0; ear checks 1
// OPEN: 172–183 s — the captions time "sorry" at 182.8 s, 10 s after "I'm just kidding around I'm"; is "I'm sorry" said
//   at 173 s (whisper) or later? a1 no longer keys on it either way
// OPEN: c2 (C2 humor) and several gists still lean on the show prior that Michael is the butt; a cold blind read
//   picked c2 at 55 %. Keep, or replace with a different C2 type?
// “Date Mike, Nice to Meet Me - The Office US” (the official The Office channel, BEST OF SEASON 6 - The Office US): on
// a double date with two coworkers, Michael mixes up his date's job with ESP; when he learns the evening is a date he
// turns into "Date Mike" (a hat, a new greeting, a talk to camera on dating shows), his coworkers wonder who should warn
// her, and his antics on the pool table end with the bar sending him off.
// Segments from the captions, words from whisper (2026-11-16). Only Michael, Pam, Julie and Ted are named; the coworker
// who talks to Michael is "the coworker", and the woman at 0–26 s is "his date" (Julie).
// Untested on purpose: 1.7 s (her job: captions "asl", whisper "ESL"; h1 keys on ESP, which both have), 38.7 s
// ("hitting it up" in both), 61–68 s (unclear speakers), 69–71 s (who says "hit the white ball first"), 84–86 s (the
// eggs line, innuendo), 88–103 s (the tongue trick: garbled in both, and "you (don't) have to do this" disagrees),
// 110.9 s ("like hawk"), 131–135 s, 154–157 s ("Homelessness": unclear), 163 s (captions "get out", whisper "get
// off"; no line quotes it), 175–198 s (whisper repeats one invented line). 118.1 s: captions "learn", whisper
// "learned"; no key turns on the tense.
// EAR CHECK: 149.8 s c3 — both sources have "Ted, we having fun?" with no "are"; confirm no reduced "'re" before "we"
import type { Clip } from '../types.ts';

export const dateMike: Clip = {
  id: 'datemike', video: 'bVilBKyMLYk', title: 'Date Mike, Nice to Meet Me - The Office US', dur: 198, wpm: 143,
  band: 'slow', tags: ['恋愛', '店・レストラン'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): mind reading was the only funny choice; the distractors are now the two literal readings
    //   of "you could teach that… born with"
    // why: language ← "born with" taken about her subject; teachers born ← "teach that" + "born with" heard as a
    //   remark on teaching talent
    { id: 'h1', skill: 'humor', level: 'C1', point: 'esl', seg: [0, 12.3],
      stem: 'Why does Michael’s reply about his date’s job get a laugh?',
      choices: ['He thinks she teaches people to read minds', 'He thinks a language can’t really be taught',
                'He thinks great teachers are born, not made'], a: 0,
      cue: '「born with」のあと、彼が出す小さなテスト。',
      line: 'I thought that was something you were *born with*. *What am I thinking right now?*',
      said: '「生まれつきのものかと思った」と言い、「今何を考えてるか分かる？」と試す。',
      mean: '彼女の仕事を ESP（超能力）と取り違えた。だから「生まれつき」「心を読んで」になる。',
      trap: 'born with を言葉や教える才能と取りやすい。直後の質問が勘違いの中身。',
      use: 'Sorry, I totally misheard you.（ごめん、完全に聞き間違えた）' },

    // R fix: V2 (blind 55 %): "real date" was off-topic for nerves; all three are now things Pam could have said of him
    // why: hard to talk to / a bit odd ← "nervous" suggests a difficult man, and the reason after "told me" is lost
    { id: 'd1', skill: 'detail', level: 'B1', point: 'nervous', seg: [16.4, 22.9],
      stem: 'Why was his date a little nervous before meeting Michael?',
      choices: ['Pam had said he was her boss', 'Pam had said he was hard to talk to', 'Pam had said he was a bit odd'],
      a: 0,
      cue: '「when Pam told me」のあと。',
      line: 'I was a little nervous when *Pam told me he was her boss*',
      said: 'パムから「彼は私の上司」と聞いていたので、少し緊張していたと話す。',
      mean: '友だちの上司に会うのは気をつかう、という理由。会ってみると印象は違った。',
      trap: 'nervous から「話しにくい人」と想像しやすい。理由は when のあとで言っている。',
      use: 'I was a little nervous about meeting you.（会うのに少し緊張してた）' },

    // R fix: V2 (blind 55 %) + B1: new distractors; its choices name "boss", so it reveals d1's point
    // why: like a boss ← "boss" heard twice and the weak "doesn't" lost; not nervous ← "nervous" is said, and
    //   "doesn't… at all" is caught but not what follows
    { id: 'd3', skill: 'detail', level: 'B1', point: 'noboss', reveals: ['nervous'], seg: [16.4, 22.9],
      stem: 'Once she has met Michael, what does his date say about him?',
      choices: ['He doesn’t act like a boss at all', 'He acts like a boss even off the clock',
                'He doesn’t seem nervous with her at all'], a: 0,
      cue: '「but」のあと、boss の前の動詞。',
      line: 'but he *doesn’t act like a boss* at all.',
      said: '「でも全然上司っぽくない」と言う。',
      mean: 'doesn’t act like ＝ 〜らしく振る舞わない。偉ぶらない人だという感想。',
      trap: 'doesn’t の t は消えやすく、boss だけ拾うと「上司っぽい」と取りがち。but で話が反転する。',
      use: 'You don’t act like a manager at all.（全然マネージャーっぽくないね）' },

    // R fix: V2 (blind 55 %) + B1: the key no longer says "easygoing" against two extremes; the stem's "boss" reveals d1
    // why: demanding ← the usual feared-boss script; too busy ← "never get anything done" heard about his own workload
    { id: 'i1', skill: 'infer', level: 'C1', point: 'noboss', reveals: ['nervous'], seg: [16.4, 26.3],
      stem: 'What does the remark about having “a boss like that” suggest about Michael?',
      choices: ['He’s so laid-back that work would never get done', 'He’s so demanding that the staff would burn out',
                'He’s so busy that he never gets his own work done'], a: 0,
      cue: '「we’d never」の we が誰を指すか。',
      line: 'If I had *a boss like that*, *we’d never get anything done*.',
      said: '「あんな上司がいたら、私たちは何も仕事が進まない」と冗談めかして言う。',
      mean: '楽しくて気さくな人だが、仕事は進まなそう。ほめ半分、からかい半分の一言。',
      trap: '「何も終わらない」を本人の忙しさと取りやすい。we＝部下の側が、楽しすぎて働かない話。',
      use: 'With you around, nothing gets done.（君がいると何も進まないよ）' },

    // R fix: V4 (a name said in words, not told by voice: detail, not who) + V2 (blind 70 %: Pam was the obvious
    //   matchmaker); now asks what Pam was right about, which needs "So Pam was right. About what? About you two…" (B2)
    // why: girlfriend ← "Pam was right" right after his "yeah, sure" heard as about him alone; nervous ← the earlier
    //   talk of nerves, and "About what?" missed
    { id: 'w1', skill: 'detail', level: 'B2', point: 'pamright', seg: [26.5, 39.6],
      stem: 'After Michael’s answer, what does the coworker conclude?',
      choices: ['Pam was right that the two would get along', 'Pam was right that he wanted a girlfriend',
                'Pam was right that he’d be nervous tonight'], a: 0,
      cue: '「About what?」への答え。',
      line: 'So *Pam was right*. … About you two hitting it…',
      said: '同僚が「じゃあパムの言った通りだ。二人は気が合うって」と言う。',
      mean: 'パムの予想が当たった。予想の中身は you two、二人の相性。',
      trap: '「うん」の直後なので彼一人の話と取りやすい。About what? の答えまで聞く。',
      use: 'So you were right after all.（結局、君の言う通りだったね）' },

    // R fix: V2 (blind 75 %, §9.4): "suddenly" pointed at news, and both distractors were about a slip; now three things
    //   he could have heard, all parallel
    // why: unlike a boss ← his date's "doesn't act like a boss" (20 s) read as a push to act tougher; Pam expects a
    //   mess ← "So Pam was right" heard as Pam's doubts about him
    { id: 'g1', skill: 'gist', level: 'B2', point: 'date', seg: [26.5, 60],
      stem: 'What sets off Michael’s change of manner?',
      choices: ['Hearing that the evening is meant as a date', 'Hearing that his date found him unlike a boss',
                'Hearing that Pam expects him to mess it up'], a: 0,
      cue: '音楽のあと、カメラに向けた一言。',
      line: 'Well, *apparently, Michael Scott is on a date*… That, my friend, *changes everything*.',
      said: 'カメラに「どうやら僕はデート中らしい。なら話は別だ」と言う。',
      mean: 'デートと気づいて、モードが切り替わる。ここから「デート・マイク」。',
      trap: 'Pam was right をパムの心配と取りやすいが、話は二人の相性。理由はカメラへの一言にある。',
      use: 'Wait, this is a date? That changes everything.（え、デートなの？なら話は別だ）' },

    // anchor: 49–59 s "apparently, Michael Scott is on a date… That, my friend, changes everything": "apparently" makes
    //   it news to him, and "changes everything" puts the switch after his "yeah, sure" (34.6 s)
    // R fix: V2 (blind 60 %): "knew all along" was easy to rule out; it's now the near miss "saw it as a date but
    //   wasn't keen", which "apparently" (news to him) settles
    // why: hiding his liking ← the Japanese frame: a flat yes read as 照れ; not keen ← the flat "yeah, sure" heard as
    //   a lukewarm date, missing that "apparently" makes the date news
    { id: 'c1', skill: 'infer', level: 'C2', point: 'date', seg: [34.1, 59.1],
      stem: 'After his comment to the camera, how should we hear Michael’s “yeah, sure”?',
      choices: ['As a man who hadn’t seen this as a date yet', 'As a man hiding how much he already likes her',
                'As a man who saw it as a date but wasn’t keen'], a: 0,
      cue: 'カメラへの一言の、最初のほうの副詞。',
      line: 'Uh, yeah, sure. … Well, *apparently*, Michael Scott is on a date… That, my friend, *changes everything*.',
      said: '「好き？」に「ああ、うん、まあね」。後でカメラに「どうやらデート中らしい。話は別だ」。',
      mean: 'apparently は「今知った」の合図。カメラへの一言が場面を書きかえ、気のない返事の理由が分かる。',
      trap: '気のない返事は照れや乗り気のなさと読みやすい。カメラへの一言で、今知ったと示す語を探す。',
      use: 'Apparently, I’m in charge now.（どうやら僕が担当らしい）', retired: true },

    // why: favor ← "Can I…?" is the usual shape of a request; time to leave ← pulling someone aside often comes before
    //   "let's go"
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'talk', seg: [71.6, 81.2],
      stem: 'When the coworker first pulls Michael aside, what is he doing?',
      choices: ['Checking why Michael is acting so oddly', 'Asking Michael to do him a quick favor',
                'Telling Michael it’s time for them all to leave'], a: 0,
      cue: '「for a second」のあとに続く二つの質問。',
      line: 'Can I talk to you for a second? … *Everything okay?* *Why are you wearing a hat now?*',
      said: '「ちょっといい？」と呼び、「大丈夫？なんで帽子？」と聞く。',
      mean: 'talk to you for a second ＝ 少し二人で話したい。様子が変な相手への心配。',
      trap: 'Can I…? は頼みごとの形でお願いと取りやすい。中身は直後の質問で決まる。',
      use: 'Hey, can I talk to you for a second?（ちょっといい？）' },

    // R fix: V2 (blind 60 %): the distractors are reworded toward the literal 特技 reading and a call for tips
    // why: show off ← "my thing" read as a party trick (he does show one later: "watch this"); tips ← "Guys, come on"
    //   heard as calling them over
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'thing', reveals: ['date', 'ondate'], seg: [75.9, 81.2],
      stem: 'When his coworkers question him, what does Michael ask them for?',
      choices: ['Room to run the date in his own way', 'A chance to show off his skills',
                'Some tips on how to make the date go well'], a: 0,
      cue: '「come on」のあと、文の最後の一言。',
      line: 'Guys, come on… *Let me do my thing*.',
      said: '「おいおい、デート中なんだ。好きにやらせてくれ」と言う。',
      mean: 'do my thing ＝ 自分のやり方でやる。口出しせずに放っておいてくれ、という意味。',
      trap: 'thing を「特技」と取りやすい。直前の「デート中」とつなげて聞く。',
      use: 'Just let me do my thing.（好きにやらせて）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'ondate', reveals: ['date'], seg: [78.1, 81.2],
      stem: 'Type what Michael says after “Guys, come on”: “___.” (4 words)', answer: "i'm on a date",
      cue: '「come on」のすぐあと。短い語がつながる。',
      line: 'Guys, come on. *I’m on a date*.',
      said: '「おいおい、デート中なんだから」。I’m on a が「アイモナ」のようにつながる。',
      mean: 'be on a date ＝ デート中。邪魔しないで、という言い訳にもなる。',
      trap: 'on a が一つの音になり、語の数が分かりにくい。短い語は前後とつなげて聞く。',
      use: 'Sorry, I’m on a call.（ごめん、今電話中）' },

    // R fix: V2 (blind 80 %): "books" broke the parallel; all three are now things he watches
    // why: real couples ← "reality" heard as "real"; tip shows ← "dating shows" caught, "reality" lost, and
    //   "strategies" heard as advice
    { id: 'd2', skill: 'detail', level: 'B1', point: 'shows', seg: [105.6, 117.1],
      stem: 'Where does Michael say he picks up his dating strategies?',
      choices: ['From watching reality dating shows', 'From watching real couples',
                'From watching TV shows that give dating tips'], a: 0,
      cue: '「because I watch」のあと。',
      line: 'because I watch *reality dating shows*…',
      said: '「恋愛リアリティ番組を見てるから有利なんだ」と話す。',
      mean: '番組の勝ち組と負け組の作戦から学んでいる、というのが彼の自信の根拠。',
      trap: 'absorb information は読書っぽく聞こえる。何から学ぶかは、watch のあとの語で決まる。',
      use: 'I learned it from watching cooking shows.（料理番組を見て覚えたよ）' },

    // anchor: 106–108 s "I kind of have an unfair advantage" (a boast), then 117.3 s "Actually, I probably learn more
    //   from the losers": every clause has "I" for its subject, and the boast ends with him learning most from failures
    // R fix: V2 (blind 70 %): the key was the only nuanced choice ("though he thinks…"); all three now give a reason
    //   in the same shape. Still leans on the show prior that Michael is the butt: see REVIEW.md
    // why: losers ← the word itself sounds like a dig at them; winners ← "learn more from the losers" heard as "the
    //   winners' tactics don't work"
    { id: 'c2', skill: 'humor', level: 'C2', point: 'losers', seg: [105.6, 119.6],
      stem: 'In Michael’s comment to the camera about his edge, who is the joke on?',
      choices: ['Michael: his edge turns out to come from failures', 'The losers: he holds them up as what not to do',
                'The winners: their tactics don’t work for him'], a: 0,
      cue: '自慢の始まりと、最後に付け足す一文。',
      line: 'I kind of have an *unfair advantage*… *Actually, I probably learn more from the losers.*',
      said: '「ちょっと有利なんだ」と自慢し、最後に「実は負けた人から多く学んでる」と足す。',
      mean: '有利さの元が「負けた人の作戦」になり、自慢が自分で崩れる。笑われているのは本人で、本人は気づいていない。',
      trap: 'losers という語で、出演者をけなす冗談と聞きやすい。主語の I を追うと、ずっと自分の話。',
      use: 'I learn a lot from my own mistakes.（自分の失敗から多くを学ぶ）' },

    // R fix: V2 (blind 55 %): "sums up: equally" and "changes the subject" were weak; now the 実際に-as-emphasis reading
    //   and the 実は-as-confession frame
    // why: stresses ← "actually" taken as emphasis (実際に); admits ← the Japanese 実は frame, a confession to follow
    { id: 'm1', skill: 'marker', level: 'B2', point: 'losers', seg: [111.3, 119.6],
      stem: 'How does Michael’s last sentence relate to the one before it?',
      choices: ['It revises it: the losers teach him more', 'It stresses it: he truly learns from both',
                'It admits it: he has been one of the losers'], a: 0,
      cue: '最後の文の、最初の一語。',
      line: 'the winners and the losers. *Actually*, I probably learn more from the losers.',
      said: '「勝ち組と負け組から学ぶ」のあと、「実は負け組からの方が多いかも」と言い直す。',
      mean: 'actually は前の発言を直す合図。「というか」「実は」に近い。',
      trap: 'actually を「実際に」という強調だけに取りやすい。前の文と比べ、何が変わったかを聞く。',
      use: 'Actually, make that two coffees.（やっぱり、コーヒー2つで）' },

    // R fix: V2 (blind 50 %) + S1: "warning" in the stem cued the negative key; the stem is neutral and the choices
    //   are reasons in one shape
    // why: how he always is ← the weak "not" in "he's not normally" is easy to lose; Pam's idea ← "tell her" plus the
    //   earlier "Pam was right" heard as owning up to the setup
    { id: 'i3', skill: 'infer', level: 'B2', point: 'normal', seg: [122.2, 126.4],
      stem: 'Why do the coworkers think his date should be told something?',
      choices: ['So she won’t judge him by tonight’s act', 'So she’ll know this is how he always is',
                'So she’ll know the date was Pam’s idea'], a: 0,
      cue: '「he’s」のすぐあと、とても短い語。',
      line: 'Maybe we should tell her that he’s *not normally like this*.',
      said: '「いつもはこうじゃないって、彼女に言った方がいいかも」と話す。',
      mean: '今のマイケルは普段と違う、と伝えたい。彼女に引かれないか心配している。',
      trap: 'not は弱く短く、聞き落とすと「いつもそうだ」と逆の意味になる。否定語は動詞のあとに注意。',
      use: 'Sorry, I’m not normally like this.（ごめん、いつもはこうじゃないんだ）' },

    // R fix: V2 (blind 60 %): the key's "further and further away" stood out; all three now start "Each one…"
    // why: softer way ← "come from a note" heard as choosing a kind method; doubts ← two "maybe" lines in a row sound
    //   like hesitation over telling her at all
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'note', seg: [122.2, 130.4],
      stem: 'After someone suggests telling her, what do the next two lines do?',
      choices: ['Each one passes the job of telling her along', 'Each one suggests a softer way to tell her',
                'Each one doubts she needs to be told at all'], a: 0,
      cue: '「from a」のあとの語が、どう変わるか。',
      line: 'Maybe it should come *from a man*. — Maybe it should come *from a note*.',
      said: '「男の人から言うべきかも」「いや、メモからがいいかも」と続ける。',
      mean: '一人は相手の男性に、もう一人は手紙に役目を回す。誰も言いたくない気持ちが笑いになる。',
      trap: 'note を伝え方の工夫と取りやすい。from a のあとが、人から物へと遠ざかっていく。',
      use: 'Maybe it should come from you.（君から言った方がいいかも）' },

    // R fix: V2 (blind 75 %): "coworkers tell her" was easy to rule out; now "calms down when coworkers step in", which
    //   "why don't you just get down" and the closing apology make tempting
    // why: calms down ← the coworker's "get down" and the "okay… kidding around" at the end; has to pay ← "400 bucks"
    //   and "send the bill" sound like a bill he's stuck with
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['bill', 'note', 'cost', 'normal'],
      seg: [122.2, 174.5],
      stem: 'How does Michael’s night at the bar end up going?',
      choices: ['He shows off until the bar staff turn on him', 'He calms down as soon as his coworkers step in',
                'He ends up paying for the table he damaged'], a: 0,
      cue: '終盤の短い命令と、それへの返事。',
      line: 'All right, *go*. — Where? …',
      said: 'テーブルの上で騒いで注意され、最後は「さあ、行け」と追い立てられる。',
      mean: '「デート・マイク」の見せびらかしが行きすぎ、店と対立。同僚の心配は当たった。',
      trap: '400ドルや「降りたら？」から、支払いや素直に従う話に見えやすい。最後に誰が何を命じるかを聞く。',
      use: 'Okay, okay, I’m going.（わかった、行くよ）' },

    // why: $40 ← "hundred" is weak and quick; $1,400 ← "four hundred" heard as "fourteen hundred"; $4,000 ← hundred and
    //   thousand confused
    { id: 'n1', skill: 'number', level: 'B1', point: 'cost', seg: [135.4, 139.1],
      stem: 'How much would it cost to fix the table, according to the bar?',
      choices: ['$40', '$400', '$1,400', '$4,000'], a: 1, keep: true,
      cue: '「bucks」の前の数字。',
      line: 'You want to pay *400 bucks*…',
      said: '「この台の修理に400ドル払う気か？」と聞かれる。',
      mean: 'bucks はドルのくだけた言い方。払う気があるのかと迫る、遠回しの警告。',
      trap: 'hundred は弱く速いので、40 や 1,400 と迷いやすい。単位まで聞く。',
      use: 'That’ll be twenty bucks.（20ドルだよ）' },

    // R fix: V2 (blind 60 %): "real address" was easy to rule out; now "agreeing to pay", which his opening "Yeah" makes
    //   tempting
    // why: agreeing ← he opens with "Yeah" and says "send the bill"; his office ← Scranton is where he works
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'bill', seg: [135.4, 143.2],
      stem: 'When asked if he wants to pay for the table, what is Michael’s reply doing?',
      choices: ['Refusing to pay, wrapped in a joke address', 'Agreeing to pay, if they post him the bill',
                'Asking them to bill his office in Scranton'], a: 0,
      cue: '住所の中の、通りの名前。',
      line: 'send the bill to 23 *I Don’t Care Lane*, Scranton, Pennsylvania.',
      said: '「請求書はペンシルベニア州スクラントン、アイ・ドント・ケア通り23番へ」と答える。',
      mean: '通りの名前が「知ったことか」。払う気はない、と冗談めかして突っぱねている。',
      trap: '最初の Yeah で払う気だと取りやすい。住所の冗談は、通りの名前の意味を聞く。',
      use: 'Honestly, I couldn’t care less.（正直、どうでもいいよ）' },

    // R fix: V2 (blind 60 %): "why do you just get down" didn't fit the gap; now "can't", an exasperated version that fits
    // why: won't ← "don't" and "won't" both end in a dropped t; can't ← the same dropped t, and the vowel is short;
    //   didn't ← a past reading of the same blur
    { id: 's1', skill: 'sound', level: 'B2', point: 'getdown', seg: [143.1, 147.25],
      stem: 'Fill the gap: “Hey, Michael, ___ just get down?”',
      choices: ['why can’t you', 'why don’t you', 'why won’t you', 'why didn’t you'], a: 1,
      cue: 'Michael と呼んだあと、文の最初の速い部分。',
      line: 'Hey, Michael, *why don’t you* just get down?',
      said: '「マイケル、降りたら？」と言われる。why don’t you が「ワイドンチュ」に。',
      mean: 'Why don’t you…? は質問でなく指示。降りろという注意。',
      trap: 't と you がつながり「チュ」になる。won’t は「ウォウン」で母音が違う。',
      use: 'Why don’t you sit down?（座ったら？）' },

    // why: confident ← "she can tell" read as certainty; angry ← the opening "Hey" heard as pushing back at the staff
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'right', reveals: ['ondate', 'date'], seg: [144.9, 152.2],
      stem: 'When Michael is told to get down, how does his reply sound?',
      choices: ['Unsure, and hoping someone will agree', 'Sure that his date is having a great time',
                'Angry, and telling the staff to back off'], a: 0,
      cue: '文の終わりに付く短い語と、その回数。',
      line: 'Hey, she can tell I’m on a date, *right? Right?*',
      said: '「彼女だって、僕がデート中だって分かってるよな？な？」と周りに言う。',
      mean: 'right? を重ねるのは同意が返らないから。自信より、味方を探す不安。',
      trap: 'she can tell を自信と取りやすい。文末の right? の数と、返事があるかを聞く。',
      use: 'That was fun, right? Right?（楽しかったよね？ね？）' },

    // anchor: 148.2–150.2 s both sources: "We're just having fun. Ted, we having fun?": no "are" before "we"; the
    //   rising pitch alone makes it a question
    { id: 'c3', skill: 'dict', level: 'C2', point: 'havingfun', seg: [147.7, 151],
      stem: 'Type Michael’s question to Ted: “Ted, ___?” (3 words)', answer: 'we having fun',
      cue: 'Ted のすぐあと。文法より、聞こえた音を。',
      line: 'We’re just having fun. Ted, *we having fun*?',
      said: '「テッド、楽しんでるよな？」。are が抜け、3語を上げ調子で聞く。',
      mean: 'くだけた会話では are we の are がよく落ちる。語順でなく、上がる調子だけで質問になる。',
      trap: '文法どおり are を足したくなるが、言われていない。聞こえた語だけを書く。',
      use: 'You coming tonight?（今夜来る？）' },

    // R fix: V2 (blind 55 %): the key was the only choice about reporting; now the near miss "behind his back" (gossip,
    //   not reporting) and "told his date" (the coworkers' earlier plan)
    // why: behind his back ← "told on" heard as "talked about"; told his date ← "maybe we should tell her" earlier
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'toldon', seg: [150.9, 154.3],
      stem: 'In the complaint just before “That’s lame”, what has someone done?',
      choices: ['Complained about him to someone in charge', 'Talked about him behind his back to others',
                'Told his date the truth about him'], a: 0,
      cue: '「Really?」のあと、told のすぐ後ろの短い語。',
      line: 'Really? *You told on me?* That’s lame.',
      said: '「マジで？告げ口したの？ださいな」と文句を言う。',
      mean: 'tell on 人 ＝ 人のことを言いつける、告げ口する。',
      trap: 'told on を「陰で話した」と取りやすい。tell on は上の人への告げ口。on 一語で意味が変わる。',
      use: 'Please don’t tell on me.（告げ口しないでね）' },

    // R fix: S4/N1: the key rested on "I'm sorry", but the captions time "sorry" at 182.8 s (outside the segment) and
    //   whisper is unreliable after 175 s; the key now rests on "Okay. All right. Okay… I'm just kidding around"
    // why: stands firm ← "Where?" sounds like pushing back; laughs it off ← "kidding around" heard as still joking,
    //   not backing down
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'kidding', seg: [160, 174.5],
      stem: 'In the last few lines, how does Michael respond to the pressure?',
      choices: ['He gives in, saying he was only kidding', 'He stands firm and refuses to leave',
                'He laughs it off and carries on as before'], a: 0,
      cue: '「Now.」のあとの返事と、whoa のあとの一文。',
      line: 'Okay. All right. Okay… whoa. *I’m just kidding around.*',
      said: '「わかった、分かったよ。おっと、ふざけてただけ」と言う。',
      mean: 'okay を重ねて従い、kidding around（ふざけてただけ）と言い訳して引き下がる。',
      trap: 'kidding を「まだふざけ続ける」と取りやすい。okay の連続は従う合図。',
      use: 'Relax, I’m just kidding around.（落ち着いて、冗談だよ）' },
  ]
};
