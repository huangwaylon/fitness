// REVIEW 2026-11-16: pass 7, fix 16, drop 1, new 0; ear checks 1
// Open question: the clip ends with Ben at Leslie's door (the kiss of the title is visual); no item asks about it.
// “Ben and Leslie's First Kiss | Parks and Recreation” (the official Parks and Recreation channel, Season 3): after
// her presentation Leslie praises "the town" in words that only fit Ben, Ben says they have to talk about it, Leslie
// phones Ann to have a pre-written warning read to her and ignores it, Chris turns up to celebrate and puts them up
// at his condo, and Leslie decides to the camera that it's not worth the risk.
// Segments from the captions, words from whisper (2026-11-16). Whisper loops from ≈190 s, so timings after that are
// the captions'. The sources differ at 28.6 s ("blonde - here -" / "blond hair, too"), 124.2 s ("wildly the static" /
// "wildly ecstatic"), 136–138 s (who offers to go back to Pawnee is unclear in both), 199.9 s ("pointing to the point"
// / "quick and to the point") and 208.7 s ("we're not mother" / "Well, I'm up"); no key rests on those words, and
// lines trim them with ….
// EAR CHECK: 145.0 s f5 — captions "we can put you out like that", whisper "we couldn't put you out like that" (the key
//   needs a polite refusal: couldn't / can't)
import type { Clip } from '../types.ts';

export const benLeslieKiss: Clip = {
  id: 'firstkiss', video: 'aF2tasp8Zqc', title: 'Ben and Leslie\'s First Kiss', dur: 264, wpm: 165, band: 'fast',
  tags: ['恋愛', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: in trouble ← "we can get into trouble" is said, but about the two of them, not her speech; admits ← her
    //   "town" talk is about Ben (h1), but she never says so; Ben is the one who breaks the silence
    { id: 'g1', skill: 'gist', level: 'B2', point: 'admit', reveals: ['liked'], seg: [2.2, 49.0],
      stem: 'How does the talk stop being about Pawnee?',
      choices: ['Ben says they need to talk about their feelings', 'Ben warns that her speech may get them in trouble',
                'Leslie admits she was describing Ben all along'], a: 0,
      cue: '「I’m sorry」から始まる部分。',
      said: '町の話が続いたあと、Ben が「まずいのは分かってる。でももう無理。せめて話そう」と切り出す。',
      mean: '遠回しな会話から、二人の気持ちという本題に入る転換点。',
      trap: 'trouble が聞こえるので仕事の失敗の話に聞こえるが、まずいのは二人の関係のほう。',
      use: 'Can we talk about what happened?（あのことについて話せる？）' },

    // R fix: V2 (§9.4) — with the title known, "plainly Ben" stood alone; "herself" is now a near miss (Leslie is
    //   the one who reads political biographies), refuted by "which I like" and "hang out with the town"
    // why: herself ← blond hair and political biographies could fit Leslie too; repeats ← Ben has just praised "the
    //   stuff you said about Pawnee" in the presentation
    { id: 'h1', skill: 'humor', level: 'C1', point: 'town', seg: [20.4, 35.4],
      stem: 'What makes Leslie’s praise of Pawnee funny?',
      choices: ['She is plainly describing Ben, not the town', 'She is plainly describing herself, not the town',
                'She is repeating her speech from that day'], a: 0,
      cue: '町の「髪」と「読書」の話。',
      line: 'the town has really nice *blond hair*… has read a shocking number of *political biographies* for a town',
      said: '「町と話すのが楽しみ。町は金髪がすてきで、町のわりに政治家の伝記をよく読む」と言う。',
      mean: '町に髪や読書はない。町の話のふりをして、Ben のことを言っている。',
      trap: '前半だけだと地元自慢に聞こえる。人にしか合わない言葉が出たら、話の本当の相手を考える。',
      use: 'I look forward to our chats.（あなたとの雑談が楽しみ）' },

    // R drop: c1 (C2, V3/C5) — same point and evidence as h1 ("the town" = Ben), and the title answers "what is she
    //   trying not to say?"; the bank keeps two C2 (c2, c3)

    // R fix: N7/B1 — its stem ("we ___ talk about it") gives away g1's key, so it now reveals `admit`.
    //   V2 — a fourth sound-alike, "ought to" (≈ "oughta", close to "hafta")
    // why: had to ← have to ≈ "hafta", and the vowel blurs toward "had"; at last ← "at least" with a weak vowel sounds
    //   like "at last"; ought to ← "oughta" and "hafta" share the flap and the weak ending
    { id: 's1', skill: 'sound', level: 'B2', point: 'atleast', reveals: ['admit'], seg: [39.9, 43.4],
      stem: 'Fill the gap: “I feel like we ___ talk about it.”',
      choices: ['have to at least', 'had to at least', 'have to at last', 'ought to at least'], a: 0,
      cue: '「we」のあと、つながった四語。',
      line: 'I feel like we *have to at least* talk about it.',
      said: '「せめて話し合うくらいはしないと」と言っている。',
      mean: 'have to は「ハフタ」、at least は「アッリースト」に近い。',
      trap: 'least の母音が弱いと at last（ついに）に聞こえる。今の気持ちなので過去形 had も合わない。',
      use: 'Let’s at least try it once.（せめて一回はやってみよう）' },

    // R fix: V2 — "share the blame" was easy to rule out; it's now "isn't angry with him", from his "I'm sorry"
    // why: others ← "not just me" read literally, as other people noticing; angry ← his "I'm sorry… I can't take this"
    //   read as an apology that wants forgiving
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'justme', reveals: ['liked'], seg: [39.9, 49.0],
      stem: 'At the end of Ben’s outburst, what is his question for?',
      choices: ['Checking that she feels the same way', 'Checking whether others have noticed too',
                'Checking that she isn’t angry with him'], a: 0,
      cue: '問いの最後の「right?」と、その返事。',
      line: 'I mean, *it’s not just me, right?* — No, it’s not just you.',
      said: '「僕だけじゃないよね？」と聞き、Leslie が「あなただけじゃない」と答える。',
      mean: '気持ちが一方通行でないかを確かめる言い方。返事が両思いの告白になる。',
      trap: 'just me を「ほかの人も？」と取りやすい。返事の you で、二人の話だと分かる。',
      use: 'It’s not just me, is it?（そう思うの、私だけじゃないよね？）' },

    // R fix: V2/K5 — the choices weren't all places, and "to meet a man" was the only odd one; now three places
    // why: gift shop ← porcelain = china, a shopping errand; hotel bar ← "see a man about…" taken literally, as meeting
    //   someone for a drink
    { id: 'f2', skill: 'phrase', level: 'B1', point: 'porcelain', seg: [56.6, 63.4],
      stem: 'When Leslie excuses herself, where does she say she’s going?',
      choices: ['To the restroom', 'To the gift shop', 'To the hotel bar'], a: 0,
      cue: '「porcelain」のあと、自分で言い直す部分。',
      line: 'I’m gonna go *see a man about some porcelain*… I’m *going to the bathroom*.',
      said: '「磁器の件で人に会ってくる」と言い、すぐ「トイレに行く」と言い直す。',
      mean: 'see a man about a dog（ちょっと用足しに）のもじり。磁器は便器のこと。',
      trap: '文字通り取ると「人に会う」「買い物」に聞こえる。言い直しまで待つ。',
      use: 'Excuse me, I need to use the restroom.（ちょっとお手洗いに）' },

    // R fix: V2 — "upset with Ann" was weak; it's now "can handle this without Ann", the face-value reading
    // why: without Ann ← "I'm not calling Ann" taken at face value, as new confidence; promised ← a stated "not" read
    //   as a rule she keeps
    { id: 'i1', skill: 'infer', level: 'B2', point: 'notcalling', reveals: ['code'], seg: [61.0, 67.6],
      stem: 'As Leslie heads off, what does her last remark really tell us?',
      choices: ['She is about to phone Ann right now', 'She can handle this without Ann', 'She promised Ann she wouldn’t call'],
      a: 0,
      cue: '言い終わった直後、次の一言の最初の名前。',
      line: 'And *I’m not calling Ann*. — So, Ann, we have a serious code Ben.',
      said: '「アンには電話しない」と言った直後、「ねえアン、緊急事態」と電話している。',
      mean: '聞かれてもいないのに否定するのは、まさにそうするつもりの証拠。',
      trap: 'not をそのまま受け取ると「一人で大丈夫」に聞こえる。言った直後の行動で本音を確かめる。',
      use: 'I’m not having dessert. …Okay, one bite.（デザートは食べない。…一口だけ）' },

    // why: hospital code ← Ann is a nurse, and "code" is a hospital alarm word; forgotten ← "it's not really code"
    //   heard as Ann failing to decode it
    { id: 'h2', skill: 'humor', level: 'C1', point: 'code', seg: [63.5, 69.9],
      stem: 'Why is Ann’s first reply on the phone funny?',
      choices: ['Leslie’s secret code is just Ben’s name', 'Ann thinks Leslie means a hospital code',
                'Ann has forgotten what the code means'], a: 0,
      cue: 'Ann の返事の「if」のあと。',
      line: 'we have a *serious code Ben*. — Well, it’s *not really code if you say his name*.',
      said: '「緊急事態、コード・ベン」と言うと、Ann は「名前を言ったら暗号じゃない」と返す。',
      mean: '暗号のつもりで名前を言ってしまう慌てぶりに、Ann が突っ込む。',
      trap: 'code を病院の緊急コードと取りやすい。if のあとの「名前」が決め手。',
      use: 'It’s not a secret if you tell everyone.（みんなに言ったら秘密じゃないよ）' },

    // R fix: V2 — "had to leave" was weak; now two near hearings of "he liked me"
    // why: liked her talk ← the scene opens with Ben praising her presentation; he'd like to talk ← "he liked" ≈ "he'd
    //   like", and Ben did say "we have to at least talk about it"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'liked', seg: [69.0, 72.4],
      stem: 'What does Leslie tell Ann that Ben has said?',
      choices: ['He said that he liked her', 'He said he liked her talk', 'He said he’d like to talk'], a: 0,
      cue: '「He told me」のあと。',
      line: '*He told me that he liked me*, and I’m gonna go…',
      said: '「彼が私のこと好きだって言ったの」と Ann に報告する。',
      mean: 'like ＝ 好意がある。ここでは恋愛の「好き」。',
      trap: '最初に Ben が発表をほめていたので、その話と混ざりやすい。told me のあとをそのまま聞く。',
      use: 'She told me that she liked my idea.（私の案が気に入ったって言ってた）' },

    // R fix: C7 — the key is no longer the strictly shortest ("really thrilled"); the bank had it shortest in 9/19
    // why: worried ← the script read later warns about her job, but that's Leslie's own text; lost for words ← her
    //   short "Seriously?" heard as shock
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'awesome', seg: [70.4, 79.6],
      stem: 'How does Ann first react to Leslie’s news?',
      choices: ['She is really thrilled for her', 'She is worried about her job', 'She is shocked and lost for words'], a: 0,
      cue: '報告のすぐあと、Ann の最初の一言。',
      line: '…right now. — *That’s awesome!*',
      said: '「今から彼のところに行く」と聞いて、Ann は「最高じゃない！」と喜ぶ。',
      mean: 'awesome ＝ すごい・最高。友だちの恋を素直に応援している。',
      trap: 'あとの台本は「仕事が危ない」と警告するが、書いたのは Leslie。Ann 自身の反応は最初の一言。',
      use: 'You got the job? That’s awesome!（受かったの？最高！）' },

    // R fix: V2 — "fighting her own warning" explained itself; the choices are now three people and their tie to the
    //   warning, so only "You wrote that!" settles it
    // why: Ann ← the anger is aimed at Ann by name, and she's the one reading; Ben ← "no matter how cute his mouth is"
    //   heard as a dig at him
    // anchor: 94.2–95.1 s Ann answers "You wrote that!", and Leslie goes on to argue with "Leslie… you don't know what
    //   you're talking about": her own words
    { id: 'c2', skill: 'humor', level: 'C2', point: 'shutup', reveals: ['script'], seg: [79.6, 99.2],
      stem: 'When Leslie snaps “Shut up, Ann!”, who is the joke really on?',
      choices: ['Leslie, who wrote the warning', 'Ann, who is reading the warning', 'Ben, whom the warning is about'],
      a: 0,
      cue: '「Shut up」への Ann の返事。',
      line: 'Shut up, Ann! — *You wrote that!*',
      said: '警告に「黙って」と怒る Leslie に、Ann は「書いたのはあなた」と返す。Leslie は台本の自分に言い返す。',
      mean: '怒っている相手は、前もって冷静だった自分。自分の忠告に逆らう姿が笑われている。',
      trap: '名前を呼ぶので Ann が的に見える。呼びかけの相手と、言葉を書いた人を分ける。',
      use: 'Remind me why I agreed to this.（なんでこれ引き受けたんだっけ）' },

    // R fix: V2 — "losing her job" was the only real warning; the distractors are now warnings too, built on the other
    //   senses of "line"
    // why: listening ← "on the line" = on the phone; near the line ← "the line" as a limit (cross the line)
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'line', seg: [86.0, 93.2],
      stem: 'What does the script warn Leslie about at the end?',
      choices: ['She could lose her job over this', 'Her boss may be on the line, listening',
                'She is near the line and should stop'], a: 0,
      cue: '台本の最後の一文。',
      line: 'Be responsible… *Your job is on the line!*',
      said: '「責任ある行動を。仕事がかかっている」と台本が警告する。',
      mean: 'be on the line ＝ 危険にさらされている。失敗すれば仕事を失うかもしれない。',
      trap: 'on the line は電話や行列の意味もある。job が主語なら「危ない」の意味。',
      use: 'My job is on the line here.（こっちは仕事がかかってるんだ）' },

    // R fix: V2 — "ahead of time" was only on the key, and "a script" implies it; all three now say "ahead of time"
    // why: Ann ← she is the one reading, so it sounds like her own advice; both ← "speaking to you through Ann Perkins"
    //   heard as a joint message
    { id: 'd2', skill: 'detail', level: 'B2', point: 'script', seg: [86.0, 95.6],
      stem: 'According to Ann, who wrote the warning she reads out?',
      choices: ['Leslie, ahead of time', 'Ann, ahead of time', 'The two of them, ahead of time'], a: 0,
      cue: '「Shut up, Ann」のすぐあと。',
      line: 'Shut up, Ann! — *You wrote that!*',
      said: '怒る Leslie に、Ann が「それ、あなたが書いたんでしょ」と言い返す。',
      mean: 'Leslie は、こうなったときのために止めてもらう台本を前もって書いていた。',
      trap: '読んでいるのは Ann なので Ann の意見に聞こえる。声の主と、言葉の主は別。',
      use: 'Don’t blame me. You wrote the list!（私のせいにしないで。リスト作ったのあなたでしょ）' },

    // why: two ← "and a half" is quick and weak after "two"; one and a half / three ← the half caught, the whole
    //   number missed
    { id: 'n1', skill: 'number', level: 'B1', point: 'wine', seg: [98.8, 106.0], keep: true,
      stem: 'How much wine does Leslie say she’s had?',
      choices: ['One and a half glasses', 'Two glasses', 'Two and a half glasses', 'Three glasses'], a: 2,
      cue: '「red wine」の直前の数。',
      line: 'I’ve had *two and a half glasses* of red wine',
      said: '「赤ワインを2杯半飲んだ」と言っている。',
      mean: 'two and a half ＝ 2.5。「だから今から行く」と、勢いの理由にしている。',
      trap: 'and a half は短く弱いので、two だけ拾いやすい。数字のあとの and まで聞く。',
      use: 'I’ve had two and a half coffees today.（今日はコーヒー2杯半飲んだ）' },

    // why: trying hard ← the words alone are a clear "no"; scared for her job ← the script's "your job is on the line"
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'yay', reveals: ['talkout'], seg: [105.4, 114.6],
      stem: 'When Ann says “No, don’t. Stop.”, how much does she mean it?',
      choices: ['Not much; she would rather Leslie went', 'Fully; she is trying hard to stop her',
                'Fully; she is scared for Leslie’s job'], a: 0,
      cue: '止める言葉の前とあとに、Ann が言う一言。',
      line: '…talk me out of this. — *No, don’t. Stop.* … — *Yay!*',
      said: '止めてと言われて「だめ、やめて」と言うが、その前後では「やった！」と喜んでいる。',
      mean: '頼まれたので形だけ止めている。本心は応援。',
      trap: '言葉だけなら本気の制止。前後の Yay! を聞けば、気持ちがどちらにあるか分かる。',
      use: 'Oh no, don’t… okay, go for it!（だめだよ…いや、行っちゃえ！）' },

    // R fix: V2 — the key was the only "persuade"; "persuade her to go ahead" is now the into/out of trap
    // why: go ahead ← "talk me out of" heard as "talk me into"; talk it over ← "talk… out" read as 話し合う
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'talkout', seg: [106.9, 111.0],
      stem: 'What did Leslie expect Ann to do on the call?',
      choices: ['Persuade her not to do it', 'Persuade her to go ahead', 'Talk it over with her first'], a: 0,
      cue: '「supposed to」のあとの言い方。',
      line: 'No, you’re supposed to *talk me out of this*.',
      said: '「違う、あなたは私を止める役でしょ」と言う。',
      mean: 'talk someone out of ～ ＝ 説得して〜をやめさせる。into なら逆。',
      trap: 'Ann が「やった！」と応援するので、それが頼みに聞こえる。out of は「やめさせる」方向。',
      use: 'Please talk me out of buying this.（これ買うの止めて）' },

    // anchor: 107.7–108.6 s "you're supposed to" in both sources; at speed the d of supposed and the t of to merge
    { id: 'c3', skill: 'dict', level: 'C2', point: 'talkout', seg: [107.2, 110.0],
      stem: 'Type the words: “No, ___ talk me out of this.” (3 words)', answer: 'you\'re supposed to',
      cue: '「No」のすぐあと。文法より、聞こえた音を。',
      line: 'No, *you’re supposed to* talk me out of this.',
      said: '「違う、あなたは止める役でしょ」。3語とも弱く速く、一続きに聞こえる。',
      mean: 'be supposed to ＝ 〜することになっている。supposed の d は to とつながって消える。',
      trap: 'you’re を聞き落として supposed to だけ書きやすい。弱い主語も一語に数える。',
      use: 'We’re supposed to be there by six.（6時までに行くことになってる）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'anyway', seg: [110.9, 113.4],
      stem: 'Type what Leslie says: “Shut up, Ann. ___.” (4 words)', answer: 'i\'m doing it anyway',
      cue: '「Shut up, Ann」のすぐあと。',
      line: 'Shut up, Ann. *I’m doing it anyway*.',
      said: '「黙って、アン。どうせやるから」と言っている。',
      mean: 'anyway ＝ それでも・どっちみち。止められても気持ちは変わらない。',
      trap: 'doing it がつながって「ドゥーイニッ」と聞こえる。it の t もほぼ消える。',
      use: 'It’s raining, but I’m going anyway.（雨だけど、それでも行く）' },

    // why: check on Ben ← "When Ben told me" puts Ben first; drive home ← "drive all the way back home" comes up a
    //   moment later
    { id: 'd4', skill: 'detail', level: 'B1', point: 'celebrate', seg: [120.7, 130.4],
      stem: 'Why has Chris come up to the city?',
      choices: ['To celebrate the win with Leslie', 'To check on how Ben is doing', 'To drive the two of them home'], a: 0,
      cue: '「won the bid」のあと、「come up here」の目的。',
      line: 'I had to come up here and *celebrate with you*.',
      said: '「Ben から入札に勝ったと聞いて、来て一緒に祝わずにいられなかった」と言う。',
      mean: '入札に勝ったお祝いのために、わざわざ来たということ。',
      trap: 'Ben の名前が先に出るので Ben に用があるように聞こえる。来た目的は to のあと。',
      use: 'I had to come and say congratulations.（おめでとうを言いに来ずにいられなかった）' },

    // R fix: V2 — "agrees and wishes them a safe trip" was easy to rule out; it's now the 社交辞令 reading, an offer
    //   made only to be polite, refuted by "I would love to have you stay" and the rooms he hands out
    // why: only polite ← the Japanese ritual-offer frame; makes no sense ← "nonsense" taken literally, as "your plan is
    //   illogical"
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'nonsense', reveals: ['putout'], seg: [138.6, 148.4],
      stem: 'How does Chris respond each time they try to head home?',
      choices: ['He waves their reasons away and insists', 'He insists, but only to be polite',
                'He laughs that their plan makes no sense'], a: 0,
      cue: '断られるたびに、Chris が最初に言う一語。',
      line: '*Nonsense.*… — *Double nonsense.* I would love to have you stay with me.',
      said: '帰ると言われて「とんでもない」、遠慮されて「さらにとんでもない」と押す。',
      mean: 'Nonsense ＝ 遠慮はいらない、の強い言い方。Double はその上乗せ。',
      trap: 'nonsense を「意味不明」と取ると、相手をばかにしているように聞こえる。',
      use: 'Nonsense! You’re staying for dinner.（遠慮しないで！夕飯食べていって）' },

    // R fix: V2 — "afford what he would charge" was weak; it's now "owe him a favor", the 借りを作りたくない frame
    // why: thrown out ← put out = 外に出す・追い出す; owe ← the reason a Japanese guest declines, but "put you out" is
    //   about his trouble, not their debt
    // retired: ear check (the key needs “couldn’t put you out”, whisper; the captions have “we can put you out”)
    { id: 'f5', skill: 'phrase', level: 'C1', point: 'putout', seg: [140.0, 146.9], retired: true,
      stem: 'When Chris offers his condo, why do they first say no?',
      choices: ['They don’t want to be a bother to him', 'They fear he’ll throw them out later',
                'They don’t want to owe him a favor'], a: 0,
      cue: '申し出のすぐあと、「like that」で終わる返事。',
      line: 'Oh, we *couldn’t put you out* like that.',
      said: '市内のコンドに泊まるよう言われ、「そこまで迷惑はかけられない」と遠慮する。',
      mean: 'put someone out ＝ 人に手間をかけさせる。',
      trap: 'put out を「外に出す」と取ると追い出す話に聞こえる。申し出への返事なら遠慮の決まり文句。',
      use: 'I don’t want to put you out.（ご迷惑をおかけしたくないので）' },

    // R fix: V2/S1 — two "hold back" choices now, so the reason decides. The stem said "by the end", but the clip ends
    //   with Ben at her door (and the kiss of the title); it now names the talking head
    // why: until the bid ← "bid" is said, and a pause sounds like a sensible plan; keep it from Chris ← she says it's
    //   "good that Chris showed up", heard as relief that he didn't see
    { id: 'g2', skill: 'gist', level: 'B2', point: 'decision', seg: [156.8, 221.6],
      stem: 'In her talk to the camera, what has Leslie decided about Ben?',
      choices: ['To hold back, since their jobs matter more', 'To hold back, but only until the bid is done',
                'To go ahead, but keep it from Chris'], a: 0,
      cue: '最後の、カメラに向けた話。',
      said: '「Chris が来てよかった。冷静じゃなかった。二人とも仕事が大事で、危険を冒す価値はない」と話す。',
      mean: '電話のときの勢いが冷め、関係を進めないと決めている。',
      trap: 'bid が聞こえると「入札が終わるまで」と取りやすいが、期限の話はない。',
      use: 'It’s just not worth the risk.（危険を冒すほどの価値はない）' },

    // R fix: V2 — "too tired" was the weak one; it's now homesickness for Pawnee, from the earlier talk about going back
    // why: couch ← Ben has to sleep on the couch, heard as his complaint; Pawnee ← they wanted to drive back home, and
    //   Chris talked them out of it
    { id: 'i4', skill: 'infer', level: 'C1', point: 'weird', seg: [157.0, 168.0],
      stem: 'Once they are alone at Chris’s place, why do things feel off?',
      choices: ['Being in Chris’s home kills the mood', 'Ben is upset about sleeping on a couch',
                'They both wish they were back in Pawnee'], a: 0,
      cue: '「weird」のあと、二人が挙げる二つの事実。',
      line: 'This is weird. *We’re on Chris’s couch.* — Yep, we are. — And *I’m wearing his clothes*.',
      said: '「変な感じ。Chris のソファだし」「私なんて彼の服を着てる」と言い合う。',
      mean: 'Chris の家に Chris の服。二人きりでも、雰囲気にならない。',
      trap: 'ソファへの不満に聞こえるが、言っているのは「誰の」ソファか。',
      use: 'This feels a little weird.（なんか変な感じ）' },

    // R fix: V2 — "a change to a whole new subject" was weak; it's now the filler reading of "Well…"
    // why: fix ← "actually" as the correcting word (実は違って); gathering ← "Well" heard as a stalling filler
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', reveals: ['decision'], seg: [213.0, 221.6],
      stem: 'As Leslie begins her final comment, what does her opening signal?',
      choices: ['A view you might not expect from her', 'A fix for a fact she got wrong',
                'A pause while she gathers her thoughts'], a: 0,
      cue: '最後の話の、最初の二語。',
      line: 'Well, *actually*, I think it’s good that Chris showed up',
      said: '「まあ、実は Chris が来てくれてよかったと思う」と話し始める。',
      mean: 'actually ＝ 意外かもしれないけど。邪魔されたのに「よかった」と言う前置き。',
      trap: 'actually は訂正にも使うが、ここは何も訂正していない。予想を裏切る話の合図。',
      use: 'Actually, I’m glad it rained.（実は、雨でよかったと思ってる）' },
  ]
};
