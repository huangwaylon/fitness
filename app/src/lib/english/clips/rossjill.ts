// REVIEW 2026-11-16: pass 5, fix 14, drop 0, new 0; ear checks 1
// OPEN: c2 (C2) ships only if the ear check confirms “again” carries the stress and the tone is dismay.
// “Ross Is Dating Rachel's Sister | Friends” (the official Friends channel, Best of Season 6): Ross tells Rachel her
// sister has asked him out again for Valentine's Day; Rachel says she can't handle it, Ross agrees to stop (after one
// more date, then tonight), and when he offers to call right away she says no, asks about his news, then says do it now.
// Segments from the captions, words from whisper (2026-11-16). No names are said; the speakers are told apart by what
// they say (Rachel is the one who says "my sister").
// Untested on purpose: 16.9–20 s (the drapes-and-slides line is innuendo), 22.2–25 s (captions "I can't not go with you
// and my sister thing", whisper "I'm not good with the you and my sister thing"), 32–37 s (whisper "No, you can't",
// captions only "it's okay"), 75.9–77 s (captions "call it right", whisper "call her right now").
// EAR CHECK: 5.6 s c2 — Rachel's “She asked you out again?” is dismayed, not pleased, with the stress on “again”, not
//   “She” (the key also leans on her later "I can't do it")
import type { Clip } from '../types.ts';

export const rossJill: Clip = {
  id: 'rossjill', video: 'rp76OhWOALI', title: 'Ross Is Dating Rachel\'s Sister', dur: 88, wpm: 170,
  band: 'mid', tags: ['恋愛', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %): the key was the only choice that was right in both halves. Now each half is shared by
    //   two choices.
    // why: one last date ← "after tomorrow night" heard as where he ends up; unsure ← "if she wasn't into me" heard as
    //   real doubt
    { id: 'g2', skill: 'gist', level: 'B2', point: 'scene', reveals: ['tonight', 'after'], seg: [0.8, 79],
      stem: 'How does Ross’s position change from the start of the scene to the end?',
      choices: ['Keen on a date at first, then ready to call it off', 'Keen on a date at first, then set on one last date',
                'Unsure about a date at first, then ready to call it off'], a: 0,
      cue: '最初の彼の話しぶりと、後半で約束すること。',
      said: '最初はバレンタインのデートに張り切っているが、相手の気持ちを聞いて、もう会わないと約束する。',
      mean: '浮かれた報告から、相手を気づかう約束へと話が変わる流れ。',
      trap: 'after tomorrow night で止まりやすいが、最後は「今夜伝える」まで下がる。',
      use: 'Okay, I’ll drop it.（分かった、その話はやめる）' },

    // why: meet her family ← "she" + family talk around a sister; he asked ← who asked whom is lost in the fast turn
    { id: 'd1', skill: 'detail', level: 'B2', point: 'again', reveals: ['askout'], seg: [0.8, 7.3],
      stem: 'What makes Ross think she likes him?',
      choices: ['She has asked him out a second time', 'She has asked him to meet her family',
                'She said yes when he asked a second time'], a: 0,
      cue: '最初の文、「why would she」のあと。',
      line: 'if she wasn’t into me, why would she *ask me out again*?',
      said: '「気がないなら、どうしてまた誘ってくるんだ」と言う。',
      mean: '彼女のほうからもう一度デートに誘ってきた、それが根拠。',
      trap: '速くて主語を聞き落とすと、彼が誘った話に聞こえる。she ask me の向きを確かめる。',
      use: 'She asked me out, believe it or not.（信じられないけど、向こうから誘ってきた）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'askout', seg: [3.4, 6.0],
      stem: 'Type what he says: “Why would she ___?” (4 words)', answer: 'ask me out again',
      cue: '「why would she」のすぐあと、文の終わりまで。',
      line: 'why would she *ask me out again*?',
      said: '「どうしてまた誘ってくるんだ」。4語がひと続きに速く言われる。',
      mean: 'ask out ＝ デートに誘う。ask me out が「アスミアウ」のようにつながる。',
      trap: 'out の t は次の again とつながって弱い。音のかたまりを語に分けて書く。',
      use: 'Are you asking me out?（それってデートの誘い？）' },

    // anchor: 5.6–6.8 s she repeats his news with "again" as a question; 22–32 s she says she "can't do it" with them
    //   together: the surprise is unwelcome news, not joy
    // R fix: V2 (blind 65 %) + K3: "hoping" overstated what the echo shows, and "Ross would ask next" was weak. The stem
    //   says "expected"; the distractors are the sincerity flip and the who-asked reading.
    // why: fall for him ← an echo question heard as happy surprise (sincerity flip); Ross asks ← the echo heard as
    //   being about who did the asking
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'again', seg: [3.4, 8.0], retired: true,
      stem: 'What does Rachel’s quick question show she had expected?',
      choices: ['That the first date would be the last', 'That her sister would fall for him',
                'That Ross would be the one to ask'], a: 0,
      cue: '彼の言葉をくり返すとき、どの語を問い返すか。',
      line: '*She asked you out again?*',
      said: '彼の話をそのままくり返して「また誘われたの？」と問い返す。',
      mean: '相手の言葉をくり返す問いは、知らなかった事への驚き。again を問うのは「一回で終わると思っていた」から。あとの「無理」で裏づけられる。',
      trap: '驚きの問い返しは喜びにも聞こえる。くり返された語と、そのあとの本音を合わせて読む。',
      use: 'Wait, you’re still seeing him?（え、まだ会ってるの？）' },

    // why: tonight ← "tell her tonight" comes later; this weekend ← the date is near but the day is missed
    { id: 'n1', skill: 'number', level: 'B1', point: 'when', seg: [7.8, 14.3], keep: true,
      stem: 'When is Ross’s next date with her?',
      choices: ['Tonight', 'Tomorrow night', 'This weekend'], a: 1,
      cue: '「Yeah」のすぐあと、日付を言う部分。',
      line: '*Tomorrow night*, Valentine’s Day, the most romantic day of the year.',
      said: '「明日の夜、バレンタインデー。一年で一番ロマンチックな日」。',
      mean: 'デートは明日の夜。日付を言い換えて、特別な日だと強調している。',
      trap: 'あとで tonight も出てくるので混ざりやすい。to の後ろまで聞くこと。',
      use: 'Are you free tomorrow night?（明日の夜、あいてる？）' },

    // R fix: V2 (blind 60 %): "hinting" in the stem and "romantic" in the key paired up. The stem is neutral, and all
    //   three choices are about the night.
    // why: worried ← "who knows" heard as anxiety (どうなることやら); no plans ← "who knows" taken literally (分からない)
    { id: 'i2', skill: 'infer', level: 'B2', point: 'hope', seg: [10.3, 16.6],
      stem: 'What does Ross’s question after naming the day suggest?',
      choices: ['He hopes the night will go further', 'He fears the night could go badly',
                'He has no plans for the night yet'], a: 0,
      cue: '日付のあと、問いの形で言う一言。',
      line: 'the most romantic day of the year. *Who knows what could happen?*',
      said: '「一年で一番ロマンチックな日。何が起きるか分からないよ」と言う。',
      mean: '答えを求めない問いで、期待をほのめかしている。',
      trap: 'who knows を不安や「分からない」と取りやすいが、ここは楽しみな気持ち。',
      use: 'Who knows? Maybe we’ll win.（もしかしたら勝つかもよ）' },

    // R fix: V2 (blind 55 %): "the date sounds romantic" was easy to rule out. "I got it" as understanding and accepting
    //   is the Japanese frame; "I can't" right after refutes it.
    // why: accepts ← "I got it" heard as 了解 (fine with it); listening ← repeated okay heard as 相づち that invites more
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'gotit', seg: [19.4, 25.2],
      stem: 'When Rachel answers his last remark, what is she doing?',
      choices: ['Stopping him; she has heard enough', 'Accepting it; she gets it and is fine',
                'Showing she is listening and wants more'], a: 0,
      cue: '同じ短い言葉を何回くり返すか、その勢い。',
      line: '*Okay, okay, okay*, okay, *I got it, I got it*.',
      said: 'okay を何度も言い、「分かった、分かった」と重ねる。',
      mean: 'もう十分、それ以上言わないで、という合図。続けて「無理」と言う。',
      trap: '日本語の相づちのように okay を同意と取りやすい。速くくり返すときは「やめて」のことが多い。',
      use: 'Okay, okay, I get it.（分かった分かった、もういいよ）' },

    // R fix: V2 (blind 55 %): "slow things down" was vague. "Skip the Valentine's date only" is her "no" to tomorrow
    //   night; her thanks for "I won't see her again" refutes it. V5: no line says it outright, so B2.
    // why: skip the date ← her "no, no" to "after tomorrow night" heard as all she wants; out of sight
    //   ← "I imagine the two of you together" heard as "just don't let me see it"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'ask', reveals: ['weird', 'wont'], seg: [19.4, 56],
      stem: 'What does Rachel want from Ross in this scene?',
      choices: ['For him to break things off with her sister', 'For him to skip the Valentine’s date only',
                'For him to keep the dates out of her sight'], a: 0,
      cue: '「I can’t」がくり返される部分と、彼の約束への返事。',
      said: '妹との組み合わせは変すぎて無理だと言い、彼が「もう会わない」と言うと礼を言う。',
      mean: '妹とのデートをやめてほしい、というお願いの場面。',
      trap: '明日のデートへの「無理」だけでなく、「もう会わない」に礼を言っている。',
      use: 'Could you not do that, please?（それ、やめてもらえる？）' },

    // R fix: V2 (blind 70 %): "Confused" was weak. "Worried for her sister" is a near miss; her reasons ("too weird", "I
    //   imagine the two of you") are about her.
    // why: amused ← fast repeated okay with a laugh-like rhythm; worried for sister ← the big-sister frame
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'weird', reveals: ['freak'], seg: [23.4, 32.8],
      stem: 'How does Rachel feel about Ross and her sister together?',
      choices: ['Uncomfortable; the idea bothers her', 'Worried; she fears her sister gets hurt',
                'Amused; the idea makes her laugh'], a: 0,
      cue: '「too」のあとの形容詞と、「imagine」のあと。',
      line: 'It’s just *too weird*… I imagine the two of you together, I just *freak out*.',
      said: '「変すぎる。二人が一緒のところを想像すると、取り乱しちゃう」と言う。',
      mean: '妹と元の相手の組み合わせが、どうしても落ち着かない。',
      trap: '妹を心配しているとも取れそうだが、言葉は weird と freak out で、自分の気持ち。',
      use: 'Sorry, it’s just too weird for me.（ごめん、ちょっと変すぎて無理）' },

    // R fix: V2 (blind 65 %): "strangely curious" was weak. "Very sad" is parallel and is refuted by "freak out".
    // why: angry ← freak out also means losing your temper; sad ← "I can't do it" heard as grief
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'freak', reveals: ['weird'], seg: [27.0, 32.6],
      stem: 'When she pictures the two of them together, what happens to her?',
      choices: ['She gets very uneasy, almost panicky', 'She gets very angry with both of them',
                'She gets very sad, almost in tears'], a: 0,
      cue: '「together」のあと、二度言う言い方。',
      line: 'I just *freak out*. It *freaks me out* and I can’t do it',
      said: '「取り乱しちゃう。ぞっとして、無理なの」と言う。',
      mean: 'freak out ＝ 動揺してパニックになる。freaks me out ＝ ぞっとする。',
      trap: 'freak out は怒るときにも使うが、ここは can’t do it と続く。動揺の意味。',
      use: 'Spiders really freak me out.（クモは本当にぞっとする）' },

    // R fix: S2 + K4 + V2 (blind 60 %): the stem's "it's too weird for you" gave "won't" away, and "wanna see" repeated
    //   "want to see". The stem quotes only the gap line; seg ends before "I" (41.9), not inside "thank".
    // why: want to see ← won't and want differ only in the vowel and a faint t; will see ← the n't is lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'wont', seg: [37.8, 41.9],
      stem: 'Fill the gap: “I ___ her again.”',
      choices: ['won’t see', 'want to see', 'will see'], a: 0,
      cue: '「for you」のすぐあと、短い一語の母音。',
      line: 'Hey, it’s too weird for you. *I won’t see* her again.',
      said: '「君には変すぎるよね。もう会わない」と言う。',
      mean: 'won’t は「ウォウン(ト)」と口を丸める。want は「ワン(ト)」。',
      trap: 't が消えると want と同じに聞こえやすい。母音の「オウ」で聞き分ける。',
      use: 'I won’t be late again.（もう遅れないよ）' },

    // R fix: V2 (blind 50 %, right): "did not mean the promise" was weak. "Makes it stronger" reads I mean as
    //   "I mean it"; "after tomorrow night" weakens it instead.
    // why: stronger ← "I mean" heard as "I mean it"; reason ← "I mean" read as an explanation
    { id: 'm1', skill: 'marker', level: 'B2', point: 'after', reveals: ['when'], seg: [39.8, 44.6],
      stem: 'Right after Rachel thanks him, what does Ross’s “I mean” do?',
      choices: ['Adds a condition to his promise', 'Makes his promise even stronger',
                'Gives the reason for his promise'], a: 0,
      cue: '「Thank you」のあと、彼の短い付け足し。',
      line: '*I mean, after tomorrow night.*',
      said: '「つまり、明日の夜のあとでね」と付け足す。',
      mean: 'I mean は言い直しの合図。ここでは約束に条件を付けている。',
      trap: 'I mean を「本気だ」と取ると約束を強めたように聞こえる。I mean のあとは補足が来る。',
      use: 'I’ll quit. I mean, after this week.（辞めるよ。まあ、今週のあとでね）' },

    // R fix: V2 (blind 65 %): only the key and one distractor had "still". All three now say what he still wants.
    // why: think it over ← "I mean" heard as hedging; friends ← "won't see her" softened to "not as a date"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'after', reveals: ['when', 'wont'], seg: [39.8, 44.6],
      stem: 'What does Ross’s add-on show about him?',
      choices: ['He still wants his one last date', 'He still needs a night to decide',
                'He still plans to see her as a friend'], a: 0,
      cue: '約束のすぐあとに付ける、時を表す言葉。',
      line: 'I won’t see her again. … I mean, *after tomorrow night*.',
      said: '「もう会わない」と言った直後に「明日の夜のあとでね」と付ける。',
      mean: 'バレンタインのデートだけは行くつもり、という本音が出ている。',
      trap: 'I mean をためらいと取りやすいが、付け足しは「明日の夜」というデートの日。',
      use: 'Sure, right after lunch.（いいよ、お昼のあとでね）' },

    // why: teasing ← fast repeated "no" can sound playful; scolding ← her raised voice heard as anger at him
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'please', seg: [43.6, 47.0],
      stem: 'How does Rachel sound as she answers that add-on?',
      choices: ['Pleading', 'Teasing', 'Scolding'], a: 0,
      cue: '「no」が続いたあとの一語。',
      line: 'No, no, no, no, no, no. *Please*, I can’t…',
      said: '「だめだめ、お願い、無理」と言う。',
      mean: 'please で、たのみこんでいる。明日の一回でさえ耐えられない。',
      trap: 'no の連続は怒りにも聞こえるが、please が来るのでお願い。',
      use: 'Please, I’m begging you.（お願い、たのむから）' },

    // why: one last time ← "tonight" heard next to the date talk; wait ← "after tomorrow night" from just before
    { id: 'd2', skill: 'detail', level: 'B1', point: 'tonight', seg: [48.8, 55.1],
      stem: 'What does Ross finally say he will do?',
      choices: ['Tell her tonight that it’s all over', 'Take her out tonight one last time',
                'Tell her to wait until after the date'], a: 0,
      cue: '「Okay」が続いたあと、「tell her」の後ろ。',
      line: 'I’ll *tell her tonight* I *can’t see her anymore*.',
      said: '「今夜、もう会えないって伝える」と言う。',
      mean: 'デートの前に、今夜のうちに断ると決めた。',
      trap: 'tonight と date の話が続くので「最後のデート」と取りやすい。tell her のあとを聞く。',
      use: 'I’ll tell him tonight.（今夜、彼に言うよ）' },

    // anchor: 63.3–67.1 s she answers "no… come on, that's crazy"; 75.6–76.5 s, after one line of his news, "Yeah, do it
    //   now": the refusal was only for show
    // R fix: V2 (blind 75 %): "thinks Ross is overreacting" was weak. "Feels bad making him end it" is the sincere
    //   reading of the refusal; "do it now" refutes it.
    // why: in person ← "call" heard against "tell her tonight" (face to face); feels bad ← the refusal heard as 遠慮
    //   from guilt
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'callnow', reveals: ['teach'], seg: [62.5, 77.3], retired: true,
      stem: 'When Rachel says calling now would be crazy, what is she trying not to say?',
      choices: ['That she wants him to call right away', 'That she feels bad making him end it',
                'That she would rather he tell her in person'], a: 0,
      cue: '断ったあと、話が少し進んでから言う一言。',
      line: 'I mean, come on, *that’s crazy*. … *Yeah, do it now.*',
      said: '「今すぐ電話しようか」に「まさか、ばかげてる」と断り、彼が近況を話し始めると「やっぱり今して」と言う。',
      mean: '口では遠慮しているが、本音はすぐにでも終わらせてほしい。あとの一言が答え合わせ。',
      trap: '断りの言葉をそのまま本音と取りやすい。遠慮のあとに態度が変わったら、そちらが本音。',
      use: 'No, you don’t have to… okay, do it.（いいよいいよ…やっぱりお願い）' },

    // R fix: V2 (blind 60 %): "plans for the date" was weak. "What he thinks of her request" reads "So…?" as asking his
    //   view; "with you" and his news refute it.
    // why: his view ← "So, what…?" heard as "so, what do you think?"; upset ← "what's going on" as "what's wrong?"
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'topic', seg: [67.6, 71.0],
      stem: 'After saying no to the call, why does Rachel ask about Ross?',
      choices: ['To move the talk off her sister', 'To ask what he thinks of her request',
                'To ask what is bothering him'], a: 0,
      cue: '「So」で始まる、二度くり返す問い。',
      line: '*So what’s*, what’s *going on with you*?',
      said: '「で、あなたのほうはどうなの？」と二度聞く。',
      mean: 'So で話題を変える。気まずい話を終わらせたい合図。',
      trap: 'What’s going on? は「どうしたの」にもなるが、ここは近況をたずねている。',
      use: 'So, what’s new with you?（で、最近どう？）' },

    // R fix: V2 (blind 75 %): "mocking him" was weak. "Share his news now" reads "do it now" as "tell me"; he's already
    //   telling.
    // why: urging the job ← "do it now" heard as an answer to "teaching another class"; share news ← "do it" heard as
    //   "tell me"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'callnow', reveals: ['teach', 'topic'], seg: [67.6, 77.3],
      stem: 'Why does the audience laugh at Rachel’s last line?',
      choices: ['Her polite question was a cover; she wants the call',
                'She is urging him to take the teaching job now',
                'She is telling him to share his news right now'], a: 0,
      cue: '彼の話がどこまで進んだところで口をはさむか。',
      line: 'I may be teaching another class… — *Yeah, do it now.*',
      said: '彼が近況を言いかけた途端、「うん、今して」と電話をうながす。',
      mean: '近況を聞いたのは形だけ。一秒も待てずに本音が出るのが笑い。',
      trap: 'do it を直前の「授業」に結びつけやすいが、it は電話のこと。',
      use: 'Anyway, enough about me.（まあ、私の話はいいとして）' },

    // R fix: V2 (blind 55 %): "another school" was weak. "Next term" is a near miss that "this semester" settles.
    // why: take a class ← teach/take near sound and "class"; next term ← "semester" heard, "this" missed
    { id: 'd3', skill: 'detail', level: 'B1', point: 'teach', seg: [70.4, 75.5],
      stem: 'What news does Ross start to share?',
      choices: ['He may teach one more class this term', 'He may take one more class this term',
                'He may teach one more class next term'], a: 0,
      cue: '「um, oh」のあと、may be のあと。',
      line: 'I may be *teaching another class* this semester.',
      said: '「今学期、もう一つ授業を受け持つかも」と言う。',
      mean: '仕事の小さなニュース。もう一つクラスを教えるかもしれない。',
      trap: 'class が聞こえると「授業を受ける」と取りやすい。teaching の ch を聞く。',
      use: 'I may be working late this week.（今週は残業になるかも）' },

  ]
};
