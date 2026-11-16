// “Ron Swanson Can't Handle Whiners | Parks and Recreation” (the official Parks and Recreation channel, Season 6): the
// staff's monthly Wine and Cheese Club lets everyone vent about work; Ann joins, her pregnancy complaints take it over,
// and the others push her out with sushi and cigars.
// Segments from the captions, words from whisper (2026-11-16). Untested: 46.7–54 s ("Hello, Walt… How'd things go",
// under music, captions missing), "Sweet Pea"/"cede my time" at 59–64 s (both sources garbled), and the closing
// "Is the nurse upset? / I don't care" (speakers unclear). No predict item (no clean 0.3 s gap before a projected move).
// REVIEW 2026-11-16: pass 10, fix 13, drop 1, new 0; ear checks 0
// REVIEW Q: this is the same scene as YTVezU88sgY ("Ann gets kicked out of the exclusive club", 266 s), with
//   overlapping items (cheese/Larry, six minutes). Keep both clips, or ship one?
// (Removed the p2 and s1 ear checks: both sources agree on the words, "Time" vs "Time?" is only
//   punctuation, and p2's key holds whoever says it.)
import type { Clip } from '../types.ts';

export const ronWhiners: Clip = {
  id: 'ronwhiners', video: 'DemeythwnzU', title: "Ron Swanson Can't Handle Whiners", dur: 193, wpm: 197, band: 'fast',
  tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 — "reports the club" was the only choice without "joins in", so blind it was a two-way pick; now all
    //   three start the same and differ in the outcome.
    // why: vent more ← "This was our chance to vent" + the others' turns at the start; cheers her up ← the usual
    //   "friends rally round" script, and "I feel bad" is said near the end
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', seg: [7.5, 182.5],
      stem: 'How does the club change once Ann gets involved?',
      choices: ['Ann joins in, and her complaints take over', 'Ann joins in, and the others vent more than ever',
                'Ann joins in, and the group cheers her up'], a: 0,
      cue: '前半で Ann が話し始めてから、後半の仲間の反応まで。',
      said: 'Ann は最初は見学だが、やがて自分の不満ばかり話し、ついに緊急集会まで開く。',
      mean: '仕事の愚痴の会が、Ann の妊娠中の悩みの会になってしまう流れ。',
      trap: '仲間も愚痴の会を続けたように思えるが、後半は Ann の話ばかり。誰が話しているかを追う。',
      use: 'Mind if I join you?（ご一緒してもいい？）' },

    // why: join ← "This looks like fun. I want to try" comes a little later; report ← "getting drunk at work"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'leslie', seg: [11, 18.6],
      stem: 'Why did Ann come into the room in the first place?',
      choices: ['She was looking for Leslie', 'She wanted to join the club', 'She came to report the drinking'], a: 0,
      cue: '「but now」の前、最初の一言。', line: 'I was *looking for Leslie*, but now I’m curious…',
      said: '「Leslie を探しに来たんだけど」と言ってから、みんなの様子に話を移す。',
      mean: '目的は別にあったが、目の前の光景が気になった、という流れ。',
      trap: '後で「やってみたい」と言うので参加目的に見えるが、それは途中で思いついたこと。',
      use: 'I was looking for the front desk.（フロントを探していたんです）' },

    // why: sincere ← "curious" taken at face value (Japanese 純粋な質問 frame); tell Leslie ← Leslie was just named
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'curious', seg: [12, 18.6],
      stem: 'When Ann says she’s “now curious why…”, what is she really doing?',
      choices: ['Teasing them for slacking off at work', 'Asking sincerely what the club is for',
                'Warning them that she will tell Leslie'], a: 0,
      cue: '「curious why」のあとに並ぶ二つの様子。',
      line: 'now I’m curious why you guys are *sitting around doing nothing* and *getting drunk at work*',
      said: '「何もせず座って、職場で酔っぱらってるのはなぜかな」と言う。',
      mean: '質問の形で、さぼっていることを軽くからかう。本気で答えを求めてはいない。',
      trap: 'curious を文字通り「知りたい」と取ると素直な質問に見える。中身の言葉が答え。',
      use: 'I’m curious why the line is so long.（なんでこんなに並んでるんだろう）' },

    // R fix: V2 — blind the key was the only choice about complaining; now two are, and they differ in purpose.
    // why: formally ← Ron's HR "workplace disputes" comes right after; break ← they're drinking during work hours
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'vent', seg: [19.4, 24.2],
      stem: 'In the club’s description, what does “vent” mean?',
      choices: ['Complain to let off steam', 'Complain formally to get action', 'Take a short break from work'], a: 0,
      cue: '「get together and」のあと、何について話すか。', line: 'we all get together and *vent* about … work',
      said: '月に一度集まって、仕事の不満を吐き出す会だと説明している。',
      mean: 'vent ＝ たまった不満や怒りを口に出してすっきりする。解決は目的ではない。',
      trap: 'vent は「通気口」の意味もあり、「休む」に寄せやすい。about のあとの中身が手がかり。',
      use: 'Sorry, I just need to vent for a minute.（ちょっと愚痴らせて）' },

    // R fix: V2 — "skips it whenever HR is not checking" was a filler; now a keyword trap on "listen to Willie
    //   Nelson". V5: B2 → C1 (the stance is never said; it rests on the loophole).
    // why: listens closely ← "available… to discuss disputes" taken as doing the job; plays music ← "listen to
    //   Willie Nelson" heard without "on my headphones"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'ron', seg: [27.4, 41.5],
      stem: 'In his interview, what does Ron reveal about how he handles the club?',
      choices: ['He attends as required but tunes them out', 'He listens closely so he can settle disputes',
                'He attends and plays music for the group'], a: 0,
      cue: '規則の話のあと、「headphones」で終わる部分。',
      line: 'The rules do *not specify* whether or not I’m allowed to listen to Willie Nelson *on my headphones*.',
      said: '人事の規則で月一回は話を聞く場にいる義務がある。でもヘッドホンで音楽を聞くなとは書いていない。',
      mean: '出席はするが、実際は何も聞いていない、ということ。',
      trap: '「規則」と聞くと真面目に聞く話に思えるが、ポイントは規則の抜け道。',
      use: 'Technically, that’s not against the rules.（厳密には規則違反じゃない）' },

    // R drop: h1 (humor, "what makes Ron's interview funny") — its key restated i1's key on the same lines (C5),
    //   and blind it was the only nuanced choice (V2). Deleted (never shipped); i1 now carries the point at C1.

    // R fix: K8 — a number item without keep: true; the choices are already in ascending order.
    // why: third ← -th of fourth is weak; this week ← "month" vs "week" at the very end of the line
    { id: 'n2', skill: 'number', level: 'B1', point: 'kyle', seg: [42, 47.1], keep: true,
      stem: 'How often has Kyle parked in the speaker’s spot?',
      choices: ['For the third time this month', 'For the fourth time this month', 'For the fourth time this week'],
      a: 1,
      cue: '「that is the」のあと、最後まで。', line: 'that is the *fourth time this month*',
      said: 'Kyle がまた自分の場所に駐車した。今月これで4回目だと言う。',
      mean: '回数と期間の両方で不満の大きさを伝えている。',
      trap: 'fourth の th は弱く、third と混ざりやすい。期間は文の最後なので最後まで聞く。',
      use: 'That’s the third time this week.（今週これで3回目だよ）' },

    // R fix: S1/V2 — the stem said "when a complaint ends", which handed over the key; it now names the moment.
    //   "back to work" was weak: now "a short break", built on "Time out… brief recess" at 8 s. Cue and said no
    //   longer claim a second speaker (neither source says who).
    // why: "Time?" heard as a real question about the clock; break ← "Time out. Let's take a brief recess" earlier
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'time', seg: [54.8, 58.4],
      stem: 'Right before Ann says “This looks like fun”, what does “Time” signal?',
      choices: ['The speaker’s turn is over', 'Someone wants to know the time', 'A short break is starting'], a: 0,
      cue: '愚痴の最後の一文の直後、短い一語。', line: '*Time.*',
      said: '一人の愚痴が終わったところで、「Time」の一言が入る。',
      mean: '持ち時間終了の合図。会にはルールがあり、順番に話す。',
      trap: '文字通り「何時？」と取りやすいが、会議や試合で Time は「時間切れ」の合図。',
      use: 'Okay, time’s up. Next!（はい、時間です。次の人）' },

    // why: sixteen/sixty ← -teen/-ty and stress
    { id: 'n1', skill: 'number', level: 'B1', point: 'pee', seg: [64.4, 72.8], keep: true,
      stem: 'How often does Ann say she needs the bathroom?',
      choices: ['Every six minutes', 'Every sixteen minutes', 'Every sixty minutes'], a: 0,
      cue: '「minutes」の直前の数。', line: '‘cause I have to pee *every six minutes*',
      said: '6分ごとにトイレに行かなきゃならない、と言う。お腹の中のビーチボールのせい。',
      mean: '妊娠中のつらさを、大げさな数字で笑いにしている。',
      trap: 'sixteen は後ろに強勢、sixty は前に強勢。six は一音節で短い。',
      use: 'The bus comes every ten minutes.（バスは10分おきに来ます）' },

    // why: never ← "never" is heard and "not" is lost; too tired ← a common pregnancy complaint, not said
    { id: 'd2', skill: 'detail', level: 'B2', point: 'hungry', seg: [73, 77],
      stem: 'After “That sucks… I know”, what other problem does Ann add?',
      choices: ['She is hungry all the time', 'She is never hungry anymore', 'She is too tired to eat much'], a: 0,
      cue: '「I know」のあと、「never」に続く短い語。', line: 'And I’m *never not hungry*.',
      said: '「お腹が空いていないときがない」と言う。',
      mean: 'never not ＝ 否定の否定で「いつも」。強調の言い方。',
      trap: 'never だけ拾うと「全く空かない」と逆になる。弱い not を聞き落とさない。',
      use: 'He’s never not on his phone.（彼はいつもスマホを見てる）' },

    // why: Ron ← the boss is in the room; Donna ← her name comes up just before
    { id: 'w1', skill: 'who', level: 'B1', point: 'cheese', seg: [75.8, 79],
      stem: 'Who offers Ann some cheese?',
      choices: ['Larry', 'Ron', 'Donna'], a: 0,
      cue: 'Ann の返事の最後、呼びかけの名前。', line: 'I can’t have cheese, *Larry*.',
      said: '誰かが「チーズ食べなよ」と言い、Ann が名前を呼んで断る。',
      mean: '返事の中の呼びかけで、誰が言ったかが分かる。',
      trap: '前に出た名前に引かれやすい。英語は返事の最後に相手の名前を付けることが多い。',
      use: 'Thanks, but I’m good, Mike.（ありがとう、でも大丈夫だよ）' },

    // why: can have ← the n't's t is barely released; could have ← the vowel is heard, the rest guessed
    { id: 's1', skill: 'sound', level: 'B2', point: 'cheese', seg: [76.8, 80],
      stem: 'Fill the gap: “I ___ cheese, Larry.”',
      choices: ['can have', 'can’t have', 'could have'], a: 1,
      cue: '最初の短い語の母音と、すぐあとの文の「either」。', line: 'I *can’t have* cheese, Larry. And I can’t have wine, either.',
      said: 'チーズも、ワインも食べられない、と言う。',
      mean: 'can’t は母音が長く強い「キャーン」、can は弱く短い「クン」。',
      trap: 't はほぼ聞こえないので、母音の強さで判断。後ろの either が否定の決め手。',
      use: 'I can’t have caffeine after six.（6時以降カフェインはだめなんだ）' },

    // why: jelly beans / pork rinds ← both are on her list, a few seconds before
    { id: 'd3', skill: 'detail', level: 'B2', point: 'pacman', seg: [90.3, 94.8],
      stem: 'In her Pac-Man daydream, what does Ann want instead of the dots?',
      choices: ['Cinnamon buns', 'Jelly beans', 'Pork rinds'], a: 0,
      cue: '「instead of」のあと、最後の食べ物。', line: 'instead of dots, I want them to be *cinnamon buns*',
      said: 'パックマンになって、点の代わりにシナモンロールを食べたい、と言う。',
      mean: '食べたいものを次々に並べる、妊娠中の空想。',
      trap: '少し前に他の食べ物も並べている。instead of のあとが答え。',
      use: 'Can I get rice instead of fries?（ポテトの代わりにライスにできますか）' },

    // R fix: V2/K3 — "a vote to punish" was a filler; now a keyword trap on "Put your headphones on, Ron", and the
    //   advice choice uses the club's take-turns rule.
    // why: advice ← "I have a lot of complaints" + the club's turns ("rules"); full attention ← "Sit down" and Ron
    //   is named, but she tells him to put his headphones on
    { id: 'i2', skill: 'infer', level: 'B2', point: 'respond', reveals: ['vent'], seg: [110.5, 120],
      stem: 'In her emergency meeting, what does Ann want from the others?',
      choices: ['Just to be heard, with no replies', 'Advice from each of them in turn',
                'Full attention from all, Ron included'], a: 0,
      cue: '「Sit down」のあと、最後の長い指示。', line: 'do not, under any circumstances, *respond to anything I say*',
      said: '「座って。何を言っても絶対に返事しないで」と命じる。',
      mean: '解決や助言はいらない。ただ聞いてほしい、ということ。',
      trap: '悩みを話す＝相談、と考えやすいが、英語の vent は聞いてもらうだけが目的。',
      use: 'I don’t need advice. Just listen.（助言はいいの。聞いてくれるだけで）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'lotof', seg: [111.5, 115],
      stem: 'Type what Ann says: “I have ___.” (4 words)', answer: 'a lot of complaints',
      cue: '「Ron」のすぐあと。', line: 'I have *a lot of complaints*.',
      said: '「言いたい不満がたくさんある」。',
      mean: 'a lot of は「アラダ」のようにつながる。lot の t は弾む音になる。',
      trap: 'a と of は弱く、ほぼ消える。lot のあとに短い「ダ」があれば of。',
      use: 'I have a lot of questions.（聞きたいことがたくさんあります）' },

    // R fix: V2 — both distractors were kind treats, so the key was the odd one out (and the only unkind one).
    //   Now three different aims, one each way.
    // why: without wine ← "I can't have wine" earlier, so sushi read as her substitute; fancier ← sushi and Cuban
    //   cigars sound like an upgrade for the members
    { id: 'i3', skill: 'infer', level: 'C1', point: 'sushi', reveals: ['scene'], seg: [128.8, 143.6],
      stem: 'Why has the club switched to sushi and cigars?',
      choices: ['So that Ann can no longer join in', 'So that Ann can join in without wine',
                'So the club feels fancier for its members'], a: 0,
      cue: 'Ann の「what the hell?」のすぐあとの理由。',
      line: 'You know I *can’t be around smoke or fatty tuna*. … It’s sushi and cigar club now.',
      said: 'Ann は「煙もトロもだめなの知ってるでしょ」と怒る。仲間は「乗っ取られた」と返す。',
      mean: '妊婦が避けるものをわざと選び、Ann を会から遠ざけようとしている。',
      trap: '寿司と葉巻はごちそうに聞こえるが、Ann が近づけないもの。そこが狙い。',
      use: 'Was that on purpose?（それ、わざと？）' },

    // R fix: V2 — "too costly" was a filler; now "no longer their decision", the near idiom "out of our hands".
    // why: decision ← "out of hand" confused with "out of our hands"; hard to follow ← "out of" read as lost
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'hand', seg: [133.8, 141.4],
      stem: 'When one member says it has “gotten out of hand”, what does that mean?',
      choices: ['It has gone much too far', 'It is no longer their decision', 'It has gotten hard to follow'], a: 0,
      cue: '「At first, this was funny, but」のあと。', line: 'At first, this was funny, but it’s *gotten out of hand*.',
      said: '「最初は面白かったけど、もう手に負えない」と言う。',
      mean: 'get out of hand ＝ 度を越す、収拾がつかなくなる。',
      trap: 'out of our hands（自分たちの手を離れた）と似ている。前の「最初は面白かった」との対比が手がかり。',
      use: 'The party got a little out of hand.（パーティーが少し度を越した）' },

    // R fix: V2 — "as a joke" was weak; now "a surprise she doesn't mind", the reading of "Wow. Okay" alone.
    // why: fair ← "I see" = 分かりました (Japanese agreement frame); doesn't mind ← "Wow. Okay" heard as a light,
    //   easy-going reply without the last sentence
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'see', seg: [140.5, 147.2],
      stem: 'When Ann answers with “Wow. Okay…”, how does she take the news?',
      choices: ['As a snub, and it hurts her', 'As fair, and she agrees to back off', 'As a surprise she doesn’t mind'],
      a: 0,
      cue: '「Okay」のあとの短い一文の言い回し。', line: 'Wow. Okay. *I see how it is*.',
      said: '「へえ、そう。そういうことね」と言う。',
      mean: 'I see how it is ＝ 冷たくされたと感じたときの決まり文句。傷ついた気持ちを示す。',
      trap: 'I see を「分かりました」と取ると納得に聞こえる。how it is まで付くと不満。',
      use: 'Oh, I see how it is.（ふーん、そういうことね）' },

    // why: a bit sorry ← "I feel bad" is said just before; make it up ← the usual apology script
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'guilt', seg: [147.8, 153],
      stem: 'In the pair of short interviews, how does the second speaker feel?',
      choices: ['Not sorry, and enjoying it', 'A bit sorry, but sure it was right', 'Sorry, and planning to make up'],
      a: 0,
      cue: '二人目の最初の短い返事と、最後の一文。', line: '*I don’t.* This is a Cuban. … *I feel amazing.*',
      said: '一人は「悪いことした」、もう一人は「私は全然。葉巻と寿司で最高の気分」。',
      mean: '罪悪感はゼロで、今を楽しんでいる。',
      trap: 'I don’t の t は消えやすく、I do と同意に聞こえることも。最後の amazing で判断。',
      use: 'Honestly, I feel great about it.（正直、すごくいい気分）' },

    // R fix: V2 — "missing the wine and cheese" was weak; now her earlier body complaints (the first-turn topic),
    //   worded so it doesn't state d2's "hungry all the time".
    //   N7: its trap says Chris helps too much, d4's key, so it now reveals `chris`.
    // why: Chris ← he is named, but he helps too much, not too little; aches and pains ← her first turn's topics
    { id: 'g2', skill: 'gist', level: 'B2', point: 'nowhere', reveals: ['chris'], seg: [154, 178],
      stem: 'What is Ann’s final speech mostly about?',
      choices: ['Having nowhere she can freely complain', 'Chris not helping her enough at home',
                'All the aches and pains of pregnancy'], a: 0,
      cue: '「biggest complaint」から「I guess」まで。',
      said: '家では言えない、ここなら言えると思った、でも違った、と怒る。',
      mean: '不満そのものより、それを吐き出す場所がないことが一番の不満。',
      trap: 'Chris の名前で「夫への不満」と思いやすいが、彼は優しすぎるほう。',
      use: 'I just need somewhere to let it out.（吐き出せる場所がほしい）' },

    // R fix: V2 — "complains even more" was a filler; now "takes them too personally", another reason a partner
    //   is hard to vent to.
    // why: busy ← the common "partner doesn't listen" script; personally ← "I feel bad… I feel even worse" heard
    //   as his hurt feelings, not hers
    { id: 'd4', skill: 'detail', level: 'B2', point: 'chris', reveals: ['nowhere'], seg: [155.8, 166.6],
      stem: 'Why can’t Ann take her complaints home?',
      choices: ['Chris is so kind that she feels guilty', 'Chris is too busy to listen to her',
                'Chris takes her complaints too personally'], a: 0,
      cue: '「because Chris is」のあとの説明。',
      line: 'Chris is *the most considerate person* in the world, and he just *wants to help* me',
      said: 'Chris は世界一思いやりがあり、助けようとしてくれる。それで逆に気がとがめる。',
      mean: '優しすぎる相手には愚痴が言いにくい、という悩み。',
      trap: '夫への不満なら「聞いてくれない」が定番だが、ここは逆。considerate が鍵。',
      use: 'He’s so sweet that I can’t complain.（優しすぎて文句も言えない）' },

    // R fix: V2 — blind, "would be" was the only natural fill; added "would've been", the weak-form near sound
    //   that fits "I thought" just as well (4 sound choices).
    // why: wouldn't ← "would be" read as a complaint; could ← the d of would heard, the vowel guessed;
    //   would've been ← would‿be heard as "would of been"
    { id: 's2', skill: 'sound', level: 'B2', point: 'cool', seg: [166.1, 169.6],
      stem: 'Fill the gap: “I thought you guys ___ cool with me complaining”',
      choices: ['would be', 'wouldn’t be', 'could be', 'would’ve been'], a: 0,
      cue: '「you guys」のすぐあと、弱く短い部分。', line: 'I thought you guys *would be* cool with me complaining',
      said: '「みんななら私が愚痴っても平気だと思ってた」と言う。',
      mean: 'would は「ウッ」程度に弱まり、be とつながる。I thought のあとの would は予想。',
      trap: 'wouldn’t なら「ン」が残る。could は最初に k の音がはっきりある。',
      use: 'I thought you’d be okay with it.（君なら平気だと思ってた）' },

    // why: asks ← a literal question "Do you know what?"; checks ← "you know" as a filler (ね)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'ykw', seg: [171.6, 174.7],
      stem: 'Right before “I guess I was wrong”, what does Ann’s short phrase do?',
      choices: ['Signals a blunt remark is coming', 'Asks if they know what she means', 'Checks that they are listening'],
      a: 0,
      cue: '「but」のすぐあと、疑問の形の短い言葉。', line: 'but *you know what*? I guess I was wrong',
      said: '「でもね、私が間違ってたみたい」と言う。',
      mean: 'you know what? は答えを求めない。きつい一言や本音の前置き。',
      trap: '疑問文の形なので「知ってる？」と取りやすいが、誰も答えない。すぐ本人が続ける。',
      use: 'You know what? I’m done.（もういい、やめた）' },

    // R fix: V2 — "laughing at her own anger" had nothing in the audio; now a keyword trap on "I would yell some
    //   more".
    // why: yell louder ← "I would yell some more" heard without the "but"; wrong ← "I guess I was wrong" is said,
    //   about them, not her
    { id: 'h2', skill: 'humor', level: 'C1', point: 'pants', seg: [173.8, 178.2],
      stem: 'What makes the end of Ann’s angry speech funny?',
      choices: ['A small accident cuts her big exit short', 'She vows to yell even louder next time',
                'She admits she was wrong to complain'], a: 0,
      cue: '「I would yell some more, but」のあと。',
      line: 'I would yell some more, but I think I just *peed my pants* a little bit.',
      said: '「もっと怒鳴りたいけど、ちょっともらしちゃったみたい」。',
      mean: '堂々と去る場面が、妊娠中の体の事情で台なしになる落差が笑い。',
      trap: 'wrong は「みんなを見誤った」という意味で、自分の愚痴を反省したのではない。',
      use: 'I’d stay longer, but I have to run.（もっといたいけど、行かなきゃ）' },
  ]
};
