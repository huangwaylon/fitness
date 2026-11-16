// “Ron and Leslie Make Up While Locked In A Room | Parks and Recreation” (the official Parks and Recreation channel,
// Season 7): years back, swamped Leslie agrees to lunch with Ron, then flies off to Washington and stands him up; in
// the locked room now, she works out he had meant to ask her for a job, apologizes, and Ron explains why he left and
// what he regrets.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈150 s; a sung montage follows (garbled
// in both) and a short tag at 208–228 s (speakers unclear; whisper loops from 228 s). Untested: “Larry / It's Terry
// now” at 8–10 s (show trivia), the phone talk at 13–19 s (“forever” vs “for Everett”), “JJ's Diner, 12:30” at 29.6 s
// (captions “JJ said 12:00 or 12:30”), and 109 s “I'm sure I loved…” (odd in both). No who item.
// REVIEW 2026-11-16: pass 5, fix 16, drop 0, new 0; ear checks 0
// REVIEW open: nt1's anchor (72.7 s) lies ~50 s after its segment, as the "trying not to say" type allows; s1 stays
//   near 50 % blind (“too long” and “so long” are both stock phrases).
import type { Clip } from '../types.ts';

export const ronLeslieLunch: Clip = {
  id: 'ronlunch', video: 'PzYF03_w3WE', title: 'Ron and Leslie Make Up While Locked In A Room', dur: 248, wpm: 154,
  band: 'mid', tags: ['友だち', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 55 %: "can't quite see who it is" was a filler; replaced by the literal reading of "Is that
    //   Ron Swanson?" as a real check.
    // why: expecting ← "Is that Ron Swanson?" taken as a real question, as if she were waiting for someone; called
    //   first ← a surprise visit heard as a polite complaint (the Japanese frame: 来る前に連絡して)
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'greet', seg: [1.0, 6.55],
      stem: 'At the very start, what is Leslie doing with her first lines?',
      choices: ['Greeting him with playful surprise', 'Asking if he’s the man she was expecting',
                'Hinting that he should have called first'], a: 0,
      cue: '最初の「my」の繰り返しと、名前を聞く言い方。',
      line: 'Well, *my, my, my*, do my eyes *deceive* me? Is that Ron Swanson?',
      said: '「あらあら、目の錯覚？ロン・スワンソンじゃない？」と大げさに言う。',
      mean: '昔風のおどけた驚き。久しぶりに来てくれて嬉しい、という歓迎のあいさつ。',
      trap: '名前を聞くのを本当の確認と取りやすい。分かっていて聞くのは、おどけた驚きの決まり文句。',
      use: 'Well, look who it is!（あら、誰かと思ったら！）' },

    // R fix: V2, blind 70 %: "Ron got busy" was refuted by her phone calls alone; all three now start "Leslie got
    //   busy", so only what happened to the lunch differs. B1: its key states p1's key, so it reveals `stoodup`.
    // why: cut it short ← her calls during their first talk, then "the first flight out of here"; moved it ← "they
    //   need us in Washington" heard as the lunch being put off
    { id: 'g1', skill: 'gist', level: 'B1', point: 'missed', reveals: ['busy', 'stoodup'], seg: [11.6, 62.4],
      stem: 'What does the first part of the clip show happened between them?',
      choices: ['Leslie got busy and missed their lunch', 'Leslie got busy and cut their lunch short',
                'Leslie got busy and moved their lunch'], a: 0,
      cue: '電話のあとの「Washington」と、昼食の約束のその後。',
      said: 'ロンが翌日の昼食に誘い、レスリーは喜んで約束する。直後に急用でワシントンへ発つ。',
      mean: '忙しさに追われて約束をすっぽかした。この過去が、今の話の出発点。',
      trap: '電話で慌ただしく見えても、昼食には行っていない。ロンの「待った」で、来なかったと分かる。',
      use: 'Sorry, something came up.（ごめん、急用ができて）' },

    // R fix: V2, blind 65 %: "help with the vote" was weak; replaced by showing off, a reading of a loud work call in
    //   front of a visitor.
    // why: avoiding him ← taking a call as he arrives can read as a snub; showing off ← a big work call in front of an
    //   old friend
    { id: 'i2', skill: 'infer', level: 'B2', point: 'busy', seg: [11.6, 23.0],
      stem: 'From the phone call before Ron’s invitation, what do we learn about Leslie?',
      choices: ['She’s too busy to give Ron her full attention', 'She’s showing off her important new job to Ron',
                'She’s upset with Ron and trying to avoid him'], a: 0,
      cue: '電話のあと、ロンに向けた最初の一言。',
      line: 'Sorry, *this is a crazy day*. So, what’s up with you, you big lug?',
      said: '電話で票の話を早口でしたあと、「ごめん、今日はめちゃくちゃな日で」と向き直る。',
      mean: '仕事に追われ、旧友との会話も電話の合間になっている様子。',
      trap: '電話は失礼や自慢にも見えるが、すぐ謝って big lug と親しく呼ぶ。謝罪の一言で判断。',
      use: 'Sorry, it’s been a crazy day.（ごめん、今日はバタバタで）' },

    // why: hurt she never has time ← "It's been too long" and her calls make a hidden complaint seem likely (the
    //   Japanese frame: 遠慮して不満を隠す); leaving Pawnee ← "Washington" and "flight" come soon after
    // anchor: 72.68–74.0 s "I was going to ask you for a job" (both sources), after 65.28–68.5 s Leslie's "You were
    //   going to ask me something. That's why you wanted to have lunch."
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'nothing', reveals: ['job'], seg: [20.9, 25.9],
      stem: 'When Ron says “Nothing important,” what is he trying not to say?',
      choices: ['That he wants to ask her for a job', 'That he’s hurt she never has time',
                'That he’s planning to leave Pawnee'], a: 0,
      cue: 'あとで明かされる、昼食に誘った本当の理由。',
      line: '*Nothing important.* Just thought you might want to have lunch.',
      said: '「大した用じゃない。昼でもどうかと思って」と軽く誘う。あとで「仕事を頼むつもりだった」と明かす。',
      mean: '「何でもない」は、言いにくい頼みを隠す前置き。軽く言うほど、本人には大きな話だった。',
      trap: '久しぶりの再会なので、寂しさや不満を隠していると取りやすい。答えはあとの本人の言葉にある。',
      use: 'Oh, it’s nothing. Just wanted to chat.（ううん、何でもない。ちょっと話したくて）' },

    // why: today ← "Just thought you might want to have lunch" sounds like now; next week ← "tomorrow" comes after a
    //   pause and an "uh", so a vague plan seems likely
    { id: 'n1', skill: 'number', level: 'B1', point: 'when', seg: [22.6, 26.95], keep: true,
      stem: 'When does Ron suggest they have lunch?',
      choices: ['Today', 'Tomorrow', 'Next week'], a: 1,
      cue: '「have lunch」のあと、少し間をおいて付け足す一語。',
      line: 'Just thought you might want to have lunch. Uh, *tomorrow*?',
      said: '「お昼でもどう？…明日とか」と、間をおいて日を付け足す。',
      mean: 'tomorrow ＝ 明日。その場の誘いではなく、翌日の約束。',
      trap: '「お昼に」と聞くと今日の話に思えるが、間のあとの一語が日にち。',
      use: 'Lunch tomorrow? My treat.（明日お昼どう？おごるよ）' },

    // R fix: S4: the segment was 2.85 s; it now starts before "Uh, tomorrow?" (3.45 s). Ear check removed (addendum):
    //   both sources have "too long".
    // why: so long ← "It's been so long" is the more familiar greeting, and t and s are both short; that long ← the
    //   weak "th" of "that" before "long"
    { id: 's1', skill: 'sound', level: 'B2', point: 'toolong', seg: [26.0, 29.45],
      stem: 'Fill the gap: “I would love to. It’s been ___.”',
      choices: ['too long', 'so long', 'that long'], a: 0,
      cue: '「love to」のあと、long の前の短い語の最初の音。',
      line: 'I would love to. *It’s been too long.*',
      said: '「ぜひ。ずいぶん会ってなかったもんね」と喜んで受ける。',
      mean: 'It’s been too long ＝ 久しぶりすぎる。会えて嬉しいときの決まり文句。',
      trap: 'so long も同じ意味でよく使うので、意味から選ぶと迷う。最初の子音 t と s を聞く。',
      use: 'Great to see you! It’s been too long.（会えて嬉しい！久しぶりだね）' },

    // R fix: V2, blind 55 %: "pick up her kids" was a filler (that line is someone else's); replaced by "voting" in
    //   the wrong relation.
    // why: cast a vote ← "the House is voting" heard as her own vote; lunch with Randy ← "Randy says" right after the
    //   lunch plan
    { id: 'd1', skill: 'detail', level: 'B1', point: 'vote', seg: [31.8, 37.15],
      stem: 'Why does Leslie suddenly have to go to Washington?',
      choices: ['To help prepare for a vote', 'To cast her own vote there', 'To have lunch with Randy'], a: 0,
      cue: '「Washington」のあとの短い語。',
      line: 'the House is *voting*… they need us in Washington *to prep*.',
      said: '「議会が明日採決するので、準備のためワシントンに来てほしいそうです」と伝えられる。',
      mean: 'prep ＝ prepare（準備する）の短縮。採決の準備に呼ばれた。',
      trap: 'voting から本人の投票と取りやすいが、投票は議会。to prep が目的。',
      use: 'I need an hour to prep.（準備に1時間ください）' },

    // R fix: V2, blind 60 %: "stood up for him in a fight" was too odd to pick; replaced by leaving early for the
    //   flight, built from the scene before.
    // why: came late ← "stood" plus "I waited for a while" suggest she came late; left early ← "the first flight out of
    //   here" just before, so she seems to have cut the lunch short
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'stoodup', seg: [47.1, 56.45],
      stem: 'When Leslie remembers that lunch, what does she realize she did?',
      choices: ['She never showed up to meet him', 'She came late and kept him waiting', 'She left early to catch a flight'],
      a: 0,
      cue: '「Oh, no」のあと。ロンの「待った」との関係。',
      line: 'Ron, I *stood you up* for lunch. — You did, yes. I *waited for a while*…',
      said: '「お昼の約束すっぽかしたんだ」。ロンは「そう。しばらく待った」と答える。',
      mean: 'stand ～ up ＝ 約束やデートをすっぽかす。来なかった、という意味。',
      trap: 'waited から遅刻を想像しやすいが、ロンは「何があったか察した」と言う。結局来なかった。',
      use: 'I can’t believe he stood me up.（彼にすっぽかされた）' },

    // R fix: V2, blind 50 %: "forgotten him on purpose" was extreme; the bitter reading is now the likelier one (her
    //   job came first), and all three choices hang on "hectic".
    // why: hurt ← "You did, yes" is blunt, and Japanese ears expect a hidden 不満; amused ← "pretty hectic" heard as
    //   teasing
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'calm', reveals: ['busy'], seg: [51.2, 58.6],
      stem: 'How does Ron sound as he tells her what happened that day?',
      choices: ['Understanding: her life was obviously hectic', 'Hurt: her job clearly mattered more than him',
                'Amused: her hectic life looked a bit silly'], a: 0,
      cue: '「I waited」のあと、彼女の生活について言う一言。',
      line: 'it was *pretty easy to figure out* what had happened. Your life seemed *pretty hectic*.',
      said: '「何があったかはすぐ察しがついた。君は忙しそうだった」と言う。',
      mean: '責めずに、彼女の事情を代わりに説明している。短い You did, yes も事実を認めただけ。',
      trap: '短く認める返事は冷たく聞こえやすい。続く文が「責め」か「理解」かで判断する。',
      use: 'No worries. I figured you were busy.（気にしないで。忙しいんだろうと思った）' },

    // R fix: V2, blind 60 %: "why he never called" was weak; replaced by "the rest of the story" read as what came
    //   next. Ear check removed: the cut falls in a 3.5 s pause (61.7–65.3 s) in both sources.
    // predict: the segment stops in the pause after her question; the reveal plays her guess
    // why: sorry again ← she has just apologized ("Oh, no…"), the expected script; what happened after ← "the rest of
    //   the story" heard as what happened afterwards
    { id: 'pd1', skill: 'predict', level: 'B2', point: 'more', seg: [58.6, 62.6], then: [62.6, 69.0],
      stem: 'After her question about “the rest of the story,” what is Leslie about to do?',
      choices: ['Guess why he really asked her to lunch', 'Ask what happened to him after that day',
                'Say sorry again for missing the lunch'], a: 0,
      cue: '「rest of the story」は、何がまだ語られていないという意味？',
      line: 'Is that *the rest of the story*? … You were going to *ask me something*.',
      said: '「話はそれで全部？」と聞き、間をおいて「何か頼むつもりだったでしょ」と言う。',
      mean: 'the rest of the story ＝ 話の続き、隠れた部分。まだ何かあると感じている。',
      trap: '謝罪や「その後」の話と思いやすいが、隠れた理由を掘る合図。',
      use: 'Is there more to the story?（それだけじゃないでしょ？）' },

    // R fix: V2, blind 60 %: "her vote on a project" was weak; replaced by a "job" in the wrong relation.
    // why: blessing to quit ← "job" said, and he later says his time in government "was over"; money for a company ←
    //   "my company" comes up later
    { id: 'd2', skill: 'detail', level: 'B1', point: 'job', seg: [71.0, 77.5],
      stem: 'What was Ron going to ask Leslie for?',
      choices: ['A job working on her team', 'Her blessing to quit his job', 'Money to start a new company'], a: 0,
      cue: '「Ron, you were going」に、ロンが続ける部分。',
      line: 'I was going to ask you *for a job*. In the federal government.',
      said: '「仕事を頼むつもりだった。連邦政府の」と打ち明ける。',
      mean: 'ask ～ for a job ＝ 仕事をくださいと頼む。友人に雇ってもらう話。',
      trap: 'job は「辞める」話ではなく、company は別の場面の語。ask you for のあとが中身。',
      use: 'Can I ask you for a favor?（お願いがあるんだけど）' },

    // R fix: V2, blind 70 %: "shy" was weak; replaced by nerves about her answer. S3: the cue quoted "government",
    //   which only the key had.
    // why: guilty ← "dirty" read as having done wrong (罪悪感); nervous ← "saying it out loud" heard as fear of asking
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'dirty', seg: [75.5, 81.3],
      stem: 'After he names where the job was, how does Ron feel about it?',
      choices: ['Disgusted: he can’t stand the government', 'Guilty: he’d be leaving his own team',
                'Nervous: he doubts she’ll say yes'], a: 0,
      cue: '勤め先を言った直後の、短い感想。',
      line: 'In the *federal government*. Just saying it out loud *feels dirty*.',
      said: '「連邦政府で。口に出すだけで汚れた気分だ」と言う。',
      mean: 'dirty ＝ 汚らわしい。政府嫌いの彼には、政府で働きたいと言うこと自体がいやなこと。',
      trap: 'dirty を「悪いことをした」と取ると罪悪感に聞こえる。何の直後に言ったかで判断。',
      use: 'Just saying it makes me sad.（口にするだけで悲しくなる）' },

    // R fix: K1: "accepting, but coolly" could be defended from Ron's flat voice; replaced by a still-hurt reading the
    //   words refute. S4: the segment now runs on through "My time in government work was over", so it holds the
    //   evidence against "rather not talk about it".
    // why: still hurt ← "it's fine" is the classic not-fine reply in arguments (a sincerity flip); not talking ← he
    //   later says he "didn't feel like explaining why", heard as closing the topic
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'fine', seg: [95.0, 109.1],
      stem: 'When Leslie apologizes, what is Ron doing with his first reply?',
      choices: ['Telling her there’s no need to feel bad', 'Saying it’s fine while still feeling hurt',
                'Saying he’d rather not talk about it'], a: 0,
      cue: 'ロンの最初の一語が、本心か建前かの目印。',
      line: '*Honestly*, Leslie, *it’s fine*.',
      said: '「正直に言って、レスリー、気にしなくていい」と答える。',
      mean: 'honestly を前に付けて、建前の「大丈夫」ではないと示す。謝罪をやわらかく受け流している。',
      trap: 'it’s fine は「本当は怒ってる」の決まり文句にもなるが、続く説明で本心と分かる。',
      use: 'Honestly, it’s no big deal.（ほんとに、大したことないよ）' },

    // R pass: ear check removed (addendum): both sources write "should have been"; the weak "have" is the normal pattern.
    { id: 'x2', skill: 'dict', level: 'B2', point: 'should', seg: [97.8, 100.35],
      stem: 'Type what Leslie says: “I ___ a better friend to you.” (3 words)', answer: 'should have been',
      cue: '「so sorry」のあと。3語がひと続きに縮まる。',
      line: 'I *should have been* a better friend to you.',
      said: '「もっといい友だちでいるべきだった」と謝る。',
      mean: 'should have been ＝ ～であるべきだった。have が弱く「シュダビン」に近い。',
      trap: 'have が「ア」程度に縮み、should be と聞こえやすい。後悔なら have が入る。',
      use: 'I should have called you.（電話すればよかった）' },

    // R fix: S3: the cue quoted "already", a word only the key had.
    // why: last straw ← a full stop "ends" the sentence, so the lunch is heard as the final cause (cause vs closure);
    //   friendship over ← "sentence" heard as their story together, with "was over" right after
    // anchor: 103.24–108.9 s "a punctuation mark on a sentence that had already been written. My time in government
    //   work was over." (both sources): "already" puts the decision before the lunch, and the next line restates it
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'period', seg: [100.0, 109.1],
      stem: 'Which plain-English version keeps what Ron means about the missed lunch?',
      choices: ['“It didn’t make me leave; I had already decided.”', '“It was the last straw that made me decide to go.”',
                '“It was the moment our friendship came to an end.”'], a: 0,
      cue: 'たとえの後半と、次の一文が何の話か。',
      line: 'It was a *punctuation mark* on a sentence that had *already been written*.',
      said: '「あれは、書き終わった文に打った句読点だった。政府の仕事はもう終わっていた」。',
      mean: '句点は文を終わらせるが、中身は決めない。昼食の件は原因でなく、決まっていたことの締め。',
      trap: '最後の一押し（last straw）と取りやすい。already があれば、決め手ではなく「もう決まっていた」。',
      use: 'By then, my mind was already made up.（その時にはもう決めていた）' },

    // R fix: V2, blind 65 %: the key was the only neutral choice and the shortest; re-cut to near-equal lengths, with
    //   the blame reading kept as the strong distractor.
    // why: a job again ← the earlier job request; blaming her ← "after you… left, nothing was the same" heard as blame
    { id: 'g2', skill: 'gist', level: 'B2', point: 'explain', reveals: ['regret', 'friends'], seg: [100.0, 147.5],
      stem: 'From Leslie’s apology on, what does Ron mainly do?',
      choices: ['Explain his own reasons for leaving', 'Ask her again for a job in her office',
                'Say she was to blame for his leaving'], a: 0,
      cue: 'ロンの長い説明が、何について語っているか。',
      said: 'ロンは「気にするな」と言ったあと、仕事を辞めた理由と、悔やんでいることを話す。',
      mean: '謝罪を受け流し、自分の側の事情を語って、わだかまりを解こうとしている。',
      trap: '「君たちが去ってから」は責めではなく、寂しかったという打ち明け。',
      use: 'Let me explain where I was coming from.（私の事情を説明させて）' },

    // R fix: V2, blind 65 %: "thinks the beast is a real animal" was absurd for Leslie; replaced by a wrong target for
    //   "the beast". The key's "gruesome" was the only vivid word; now "gory", at even length.
    // why: the beast is her ← "the rotting beast" heard as aimed at her federal office; cut him short ← "so beautiful"
    //   heard as sarcasm about his long speech
    { id: 'h1', skill: 'humor', level: 'C1', point: 'metaphor', seg: [109.0, 115.4],
      stem: 'Why does Leslie’s comment about Ron’s metaphors get a laugh?',
      choices: ['She calls a gory image “beautiful”', 'She takes “the beast” to mean her',
                'She says it to cut his long speech short'], a: 0,
      cue: '直前のたとえの中身と、ほめ言葉の差。',
      line: 'shutting things down and *bleeding the rotting beast* from the inside. — Your metaphors are *so beautiful*.',
      said: '政府を「腐った獣」にたとえ、内から血を抜くのが好きだったと言う。返事は「たとえが美しい」。',
      mean: '血や腐敗のたとえを「美しい」と呼ぶ落差が笑い。からかいと親しみが混ざる。',
      trap: 'beast を彼女のことと取りやすいが、前の文で政府のたとえと分かる。',
      use: 'What a lovely way to put it.（なんて素敵な言い方）' },

    // why: asking for the job ← the job request is the earlier topic; leaving ← "I loved shutting things down" heard as
    //   missing the job
    { id: 'd3', skill: 'detail', level: 'B2', point: 'regret', seg: [121.0, 133.6],
      stem: 'What does Ron say he does regret?',
      choices: ['Not warning her about his company’s project', 'Asking her for a job in her federal office',
                'Leaving the government job he once loved'], a: 0,
      cue: '「happened after」から「regret」まで。',
      line: 'the fight we had, *not giving you a heads-up* when my company took on… *I do regret that.*',
      said: 'その後のけんかと、会社の計画を前もって伝えなかったことは「悔やんでいる」。',
      mean: 'heads-up ＝ 事前の知らせ。do regret の do は「そこは本当に」の強め。',
      trap: '辞めたこと自体は「もう終わっていた」。悔やむのは、その「あと」のこと。',
      use: 'Thanks for the heads-up.（前もって教えてくれてありがとう）' },

    // why: ran it well ← "run" heard as "ran (managed) the office"; right time to go ← "a good run" heard as a good
    //   exit, with "time for me to leave" before
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'run', seg: [135.6, 142.5],
      stem: 'Just before Ron says “But after you…”, what is he saying about his time there?',
      choices: ['It went well for quite a while', 'He ran the office very well', 'He got out at just the right time'],
      a: 0,
      cue: '「But after」の直前、短い一文。',
      line: '*I had a good run here.* But after you and Tom… left…',
      said: '「ここではいい時期を過ごした。でも君たちが去ってから…」と言う。',
      mean: 'have a good run ＝ しばらくうまくいく。よかった時期を振り返る言い方。',
      trap: 'run を「経営する」と取りやすいが、a good run は「好調な期間」。',
      use: 'We had a good run.（いい時期だったね）' },

    // R fix: V2, blind 65 %: "his new company needed his time" was weak; replaced by "a good run" read as a job done.
    // why: hated shutting things down ← "shutting things down" was heard earlier, but he said he loved it; done all he
    //   could ← "I had a good run here" just before, heard as a finished job
    { id: 'i1', skill: 'infer', level: 'C1', point: 'friends', seg: [138.0, 147.5],
      stem: 'What does Ron’s last explanation suggest was the real reason he left?',
      choices: ['His friends were gone, so the job felt empty', 'He had come to hate shutting things down',
                'He felt he had done all he could there'], a: 0,
      cue: '「But after」のあと、名前を並べたあとの一言。',
      line: 'after you and Tom and Donna and April and Terry *left*… *nothing was the same*.',
      said: '「君やトムたちが去ってから、オフィスを見回しても何も同じじゃなかった」。',
      mean: '仲間がいなくなり、仕事に意味を感じなくなった、という本音。',
      trap: 'a good run は「よかった時期」で、やり切った話ではない。But のあとに本音が来る。',
      use: 'It wasn’t the same without you.（君がいないと違ったよ）' },

    // R fix: V2, blind 60 %: "closes the talk, since it's too late" was weak; replaced by "well" as a topic change.
    // why: doubting ← "well" read as hesitation or objection (まあ…でも); new topic ← "well" also opens a change of
    //   subject
    { id: 'mk1', skill: 'marker', level: 'B2', point: 'well', seg: [143.0, 150.3],
      stem: 'When Leslie answers Ron’s last line, what does her opening do?',
      choices: ['Accepts what he said, then turns to a fix', 'Agrees, then moves on to a new topic',
                'Doubts what he said and argues back'], a: 0,
      cue: 'ロンの「nothing was the same」の直後、最初の2語。',
      line: '*Yeah, well*, there’s a way to *fix that*.',
      said: '「うん、でもね、それを直す方法があるよ」と返す。',
      mean: 'yeah で受け止め、well で話の向きを変える。ここではぼやきから提案への切りかえ。',
      trap: 'well を迷いや話題の変更と取りやすい。fix that の that はロンの話の続き。',
      use: 'Yeah, well, we can try again.（うん、でもまたやってみればいい）' },
  ]
};
