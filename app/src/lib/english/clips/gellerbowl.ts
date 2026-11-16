// REVIEW 2026-11-16: pass 7, fix 14, drop 0, new 0; ear checks 2

// “The One With the Thanksgiving Football Game | Friends” (the official Friends channel, Best of Season 3): the friends
// want a halftime game; Chandler is talked into it, and Ross and Monica explain why their mom banned them from football
// (the Geller Bowl, a broken nose, a trophy in a lake) before they decide to play anyway.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 176 s; 176–307 s is a music montage, and
// whisper repeats one line through it. Speakers are settled by “Chandler” (36.5 s), “Ross?… What?” (51.7 s), “Monica and
// I” (57.3 s) and “Ross and I” (77.5 s). Untested: the captions-only lines at 274–290 s (“you're 5 ft short so we win”),
// 35.5 s (“goals”/“ghouls”), 41.4 s (“you'll”/“they'll”), and the gap at 128–135 s (whisper ends “trophy” at 128.8 s, the
// captions put it at 135.2 s).
// EAR CHECK: 49.1 s s1 — “I'll play” (both sources): the 'll is heard, not just “I play”
// EAR CHECK: 90.0 s x1 — “so not an accident” (both sources): “not an” links into one stretch
import type { Clip } from '../types.ts';

export const gellerBowl: Clip = {
  id: 'gellerbowl', video: '0M06pw25LPU', title: 'The One With the Thanksgiving Football Game', dur: 307, wpm: 267,
  band: 'fast', tags: ['友だち', '家'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 — the blind pass picked the key at 75 % (the Janice and cup choices didn't fit a football scene). Now
    //   three real threads of the scene; the key runs ~100 s, against ~30 s for Chandler and a few lines on teams.
    // why: Chandler ← the first 50 s really are about getting him to play; even teams ← “the teams won't be even”,
    //   “cover Chandler” and “captains” all sound like picking sides
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', seg: [0, 176],
      stem: 'What is most of the scene about?',
      choices: ['How a family game got two of them banned', 'How Chandler is talked into joining in',
                'How the friends split into even teams'], a: 0,
      cue: '中盤の長い思い出話が、何の説明になっているか。',
      said: '前半は Chandler の説得。そのあと Ross と Monica が、昔の試合と禁止の理由を長く話す。',
      mean: '昔のけんかの話が中心で、今日の試合に二人が出るかどうかにつながる。',
      trap: '最初に出る話題が大意とは限らない。いちばん長く続く話を追う。',
      use: 'Long story. I’ll tell you later.（長い話なんだ。あとで話すよ）' },

    // why: every year ← “one of these things” heard as a yearly habit (the Thanksgiving game); rather play ← the talk
    //   right after turns to playing (“who wants to throw the ball around”)
    { id: 'i1', skill: 'infer', level: 'B2', point: 'once', seg: [0, 5.6],
      stem: 'What does the opening line suggest about the speaker?',
      choices: ['Watching a game is not something they usually do', 'Watching games is a habit they keep up every year',
                'Playing football is what they would rather do'], a: 0,
      cue: '文頭の2語と、試合の呼び方。',
      line: 'For *once* I’m going to sit down and try to watch *one of these things*.',
      said: '「今回は座って、こういうのをちゃんと見てみる」と言う。',
      mean: 'for once ＝ いつもと違って今回は。these things という呼び方からも、ふだん見ない人だと分かる。',
      trap: '「毎年見る」と取りやすいが、for once は「珍しく」の合図。',
      use: 'For once, I’m leaving work on time.（今日は珍しく定時で帰る）' },

    // why: in school ← “played football” caught without the weak “never”; only on TV ← the opening “watch one of these
    //   things”
    { id: 'd1', skill: 'detail', level: 'B1', point: 'never', seg: [14.0, 18.3],
      stem: 'When one friend asks to join the game, what does she say about football?',
      choices: ['She has never played it at all', 'She used to play it in school', 'She has only ever watched it on TV'], a: 0,
      cue: '「play too?」のあと、短い否定の語。',
      line: 'Can I play too? I’ve *never played football*, like, *ever*.',
      said: '「私も入れて？フットボールは、本当に一度もやったことないの」と言う。',
      mean: 'like, ever は「一度も」をさらに強める言い方。経験ゼロを明るく言っている。',
      trap: 'never が速く弱いと「やったことがある」に聞こえる。最後の ever が決め手。',
      use: 'I’ve never skied, like, ever.（スキーは一度もやったことないの）' },

    // R fix: S3 — the cue named Chandler, which the test reads as a word only the key has (“Chandler’s” elsewhere).
    // why: in Chandler's place ← cover for = 代わりをする, and Chandler says right after that he won't play; keeping
    //   score ← a beginner seems given a side job, not a place in the game
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'cover', seg: [14.0, 22.2],
      stem: 'When she asks to join, what job is she given in the game?',
      choices: ['Guarding Chandler on the other team', 'Playing in Chandler’s place on his team',
                'Keeping score for Chandler’s team'], a: 0,
      cue: 'great のあとの動詞。for があるかどうか。',
      line: 'Great, you can *cover Chandler*.',
      said: '「いいね、君は Chandler をマークして」と言われる。',
      mean: 'スポーツの cover ＝ 相手の選手について守る。初心者に楽な相手が当てられた。',
      trap: 'cover for なら「代わりをする」。for なしの cover＋人は、試合では「マーク」。',
      use: 'Can you cover for me today?（今日、代わってもらえる？）' },

    // R fix: V2 — the key was the only choice that sounded like a joke (55 % blind). Now three readings of his answer.
    // why: Janice back ← “since you and Janice broke up” just before; big goals ← “Don't say that I don't have goals”
    //   caught without the list before it
    { id: 'h1', skill: 'humor', level: 'C1', point: 'goals', seg: [22.0, 36.3],
      stem: 'Why does Chandler’s answer about what he “wanted” get laughs?',
      choices: ['His examples back up the very point he denies', 'He says all he wants now is to get Janice back',
                'He claims he has been busy chasing big goals'], a: 0,
      cue: '「That’s not true」のあと、何を「したかった」か。',
      line: 'That’s not true. I *wanted to wear my bathrobe* and eat peanut clusters *all day*.',
      said: '「何もしたがらない」と言われ、「違う。一日中バスローブでお菓子が食べたかった」と言う。',
      mean: '反論の形で、落ちこんだ生活を認めている。言い返すほど図星。',
      trap: 'That’s not true を本気の反論と取りやすい。続く中身が反論かどうかを聞く。',
      use: 'I have plans: my couch and a pizza.（予定ならある。ソファとピザ）' },

    // why: I play ← the dark l of 'll swallowed; I'd ← 'll and 'd are both tiny after “I”; I played ← the final
    //   consonant of 'll heard as the -ed of a past form
    // R fix: V2 + §9.5 — “I play” and “I played” don't fit the gap, so grammar alone gave the key (80 % blind). Now
    //   three choices that all fit. Old why: I play ← the dark l of 'll swallowed.
    // why (new): I'd ← 'll and 'd are both tiny after “I”; I'll pay ← the l of “play” lost in the cluster, and paying
    //   is a plausible thing to agree to
    { id: 's1', skill: 'sound', level: 'B2', point: 'illplay', seg: [46.5, 50.0],
      stem: 'Fill the gap in the reply: “Yeah, all right, ___.”',
      choices: ['I’d play', 'I’ll play', 'I’ll pay'], a: 1,
      cue: '「all right」のあと、I にくっつく小さな音。',
      line: 'Yeah, all right, *I’ll play*.',
      said: '説得されて「分かった、やるよ」と引き受ける。',
      mean: 'I’ll は「アイウ」に近く、l は舌が軽く触れるだけ。その場で決めたことは will。',
      trap: '暗い l は「ル」に聞こえず、’d との差も小さい。I が少し長く濁ったら ’ll を疑う。',
      use: 'Okay, fine, I’ll come.（分かった、行くよ）' },

    // R fix: V2 — the key was the only teasing choice (60 % blind). Now mocking / doubting / asking in earnest.
    // why: asking in earnest ← “Says who” read word by word as a real question (誰が言ったの？); doubting ← Says who? as
    //   a challenge to the rule's source, missing that “your mom?” makes it a jab
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'mom', seg: [55.5, 67.3],
      stem: 'When Ross says they aren’t supposed to play, what is the reply doing?',
      choices: ['Mocking him for still obeying his mother', 'Doubting that any such rule really exists',
                'Asking in earnest whose rule it is'], a: 0,
      cue: '短い問い返しと、そのあとの決めつけ。',
      line: '*Says who*, your mom?',
      said: '「しちゃいけない」と聞いて、「誰が決めたの、ママ？」と返す。',
      mean: 'Says who? は「誰がそんなこと」と言い分を軽くあしらう形。ママを出してからかっている。',
      trap: '文字通りなら丁寧な質問に見えるが、Says who? は反発の決まり文句。',
      use: 'Says who? It’s my day off.（誰が決めたの？今日は休みだよ）' },

    // R fix: V2 — the key was the only “twist” choice (65 % blind). Now three readings of the “yes”.
    // why: agrees to play ← the yes heard as the answer to “Want to play football?”; sarcastic ← after teasing, a dry
    //   “yes” is the expected comeback (the next lines explain the rule in earnest)
    { id: 'h2', skill: 'humor', level: 'C1', point: 'mom', seg: [55.8, 69.5],
      stem: 'Why does Ross’s one-word answer get a big laugh?',
      choices: ['He confirms what was only said as a tease', 'He gives in and agrees to play after all',
                'He answers with a sarcastic yes, mocking them'], a: 0,
      cue: '問い返しへの、短い返事。',
      line: 'Says who, *your mom*? — *Yes.*',
      said: '「ママが言ったの？」とからかうと、Ross は一言「うん」と答える。',
      mean: 'からかいの決めつけが本当だった。言い訳もせず素直に認めるので笑いになる。',
      trap: '短い返事は冷たく聞こえやすいが、照れも否定もない。続く説明が本気の証拠。',
      use: 'Funny you ask. Yes, actually.（よく聞いたね。実はそう）' },

    // R fix: V2 — the key was the only nuanced choice (55 % blind). Now a mirror pair (milder / wilder) plus a blame.
    // why: wilder ← a broken nose in her own story sounds like a dramatic telling, but “kind of” and “accidentally”
    //   shrink it and Ross objects; blames Ross ← “Ross and I were always captains”, his name the last heard
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'competitive', seg: [76.6, 91.4],
      stem: 'How does Monica describe the way the old games went?',
      choices: ['She makes them sound milder than they were', 'She makes them sound wilder than they were',
                'She blames Ross for how rough they got'], a: 0,
      cue: '「kind of」の控えめさと、そのあとの出来事。',
      line: 'it got *kind of competitive*. … I *accidentally broke Ross’s nose*.',
      said: '「ちょっと白熱して」と言い、「Ross の鼻を折った」と続ける。',
      mean: 'kind of で軽く言うが、中身は鼻の骨折。気まずい話を小さく見せている。',
      trap: 'kind of を「少し」と取ると楽しい試合に聞こえる。言葉と出来事の大きさを比べる。',
      use: 'Things got a little heated.（ちょっとヒートアップしちゃって）' },

    // why: 16 ← -teen heard on a short number word; 60 ← -ty heard on it
    { id: 'n1', skill: 'number', level: 'B1', point: 'six', seg: [81.6, 88.6],
      stem: 'Which year’s game was the one where Ross’s nose got broken?',
      choices: ['Game 6', 'Game 16', 'Game 60'], a: 0, keep: true,
      cue: '「one year」のあと、試合の名前の最後。',
      line: 'And one year, Geller Bowl *six*, I accidentally broke Ross’s nose.',
      said: '「ある年、ゲラーボウル6で、Ross の鼻を折っちゃった」と話す。',
      mean: '毎年の試合に通し番号を付けて呼んでいる。Bowl 6 ＝ 6回目の大会。',
      trap: 'six は短く一音節。-teen なら「ティーン」と長く伸び、-ty なら最後に「ティ」が付く。',
      use: 'This is our sixth year in a row.（これで6年連続です）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'accident', seg: [88.4, 91.4],
      stem: 'Type Ross’s reply: “It was ___.” (4 words)', answer: 'so not an accident',
      cue: '「accidentally」への返事。強く言う語に注意。',
      line: 'It was *so not an accident*.',
      said: '「事故なんかじゃ全然ない」と、すぐ打ち消す。',
      mean: 'so not ＋名詞は「全然〜じゃない」のくだけた強調。',
      trap: 'not an は「ナランナ」とつながり、an が消えやすい。so は強く、not an は弱く速い。',
      use: 'That was so not my fault.（あれは全然私のせいじゃない）' },

    // R fix: V2 — the key was the only choice about content (60 % blind). All three now hedge alike.
    // why: steering off ← by the way = ところで, the textbook topic change; half apologizing ← “just kept running” heard
    //   as the start of an apology for not stopping
    { id: 'm1', skill: 'marker', level: 'C1', point: 'byway', seg: [91.2, 101.5],
      stem: 'When Monica finishes Ross’s sentence, what is she doing?',
      choices: ['Adding, as if in passing, that she won', 'Quietly steering the talk off the nose',
                'Half apologizing for not stopping to help'], a: 0,
      cue: 'Ross の文の続きを Monica が言う、最後の3語。',
      line: 'Just kept running. — To score the winning touchdown, *by the way*.',
      said: 'Ross の「そのまま走った」に、Monica が「勝ちのタッチダウンを決めにね」と足す。',
      mean: 'by the way は、さらっと自慢を足すときにも使う。ここは勝ちの強調。',
      trap: '「ところで」と覚えていると話が変わると思いやすい。ここは同じ話の付け足し。',
      use: 'I made dinner, by the way.（ちなみに、夕飯作ったよ）' },

    // anchor: 100.7–100.9 s Monica's “by the way” adds the winning touchdown to Ross's story; 108.4–108.7 s Ross answers
    //   with “oh, and by the way, savage nose-breaking”: the same marker, now adding the foul to his
    // R fix: V2 + S4 — “Monica's own boast” was the only choice tied to her words (60 % blind). Now right mechanism,
    //   wrong target (her mild telling) and a second foul. The segment ran 20.7 s; it now starts at her add-on.
    // why: her mild telling ← mocking is right, but the echoed form is “by the way”, which came with the touchdown, not
    //   with “kind of competitive”; a second foul ← by the way as a topic change, and “spectacularly illegal” sounds
    //   like a list of fouls (it names the same elbow)
    { id: 'c2', skill: 'infer', level: 'C2', point: 'byway', seg: [98.4, 111.9],
      stem: 'Why does Ross put “oh, and by the way” into his complaint?',
      choices: ['To mock the way Monica slipped in her win', 'To mock how mildly Monica told the story',
                'To add a second foul she committed that day'], a: 0,
      cue: 'Monica の付け足しと、Ross の付け足しの形。',
      line: 'To score the winning touchdown, *by the way*. … *oh, and by the way*, savage nose-breaking.',
      said: 'Monica は「ちなみに勝った」、Ross は「あと、ちなみに、ひどい鼻折り」と足す。',
      mean: '同じ by the way で返し、相手の言い方をまねて投げ返している。自慢を同じ形で打ち消す。',
      trap: '話題を変える合図と取ると別の反則に聞こえる。まねた形が、誰のどの言葉から来たかを聞く。',
      use: 'Oh, and by the way, you owe me.（あ、ちなみに貸しだからね）' },

    // R fix: V2 — “after all these years” made the key the only one tied to “now” (60 % blind). Three parallel feelings.
    // why: amused ← “whoa, whoa, whoa” and the laughs around it; embarrassed ← a broken nose from his sister sounds
    //   like a loss to hide, but he denies she won at all
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'bitter', seg: [101.0, 111.9],
      stem: 'Judging by his words, how does Ross feel about that game now?',
      choices: ['Still sore about it, all these years later', 'Amused, as if it were just a funny old story',
                'Embarrassed that his sister got the better of him'], a: 0,
      cue: '反則を言うときの形容詞の強さ。',
      line: 'The touchdown *didn’t count* because of the *spectacularly illegal*… *savage nose-breaking*.',
      said: '「タッチダウンは無効。とんでもない反則だった。ひどい鼻折りね」と言う。',
      mean: 'spectacularly、savage と強い語を重ね、今も納得していない。',
      trap: '周りの笑いで楽しそうに聞こえ、負けを恥じているとも取れるが、本人の言葉は抗議そのもの。',
      use: 'I’m still not over that.（あれ、まだ根に持ってるんだ）' },

    // R fix: V2 + S4 — the key was the only conditional, matching the stem's logic (70 % blind), and the segment ran
    //   15.9 s. It now ends before the dad's line; the distractors are refuted by “Oh yeah? Then…” and “the trophy you
    //   got if you won the game”.
    // why: no cup at all ← “There was a Geller Cup?” heard as Ross's point; robbed ← “how come you didn't get” read as
    //   sympathy, missing the challenge in “Oh yeah? Then…”
    { id: 'i2', skill: 'infer', level: 'B2', point: 'cup', seg: [111.8, 124.1],
      stem: 'When Monica says she won, what is Ross’s comeback suggesting?',
      choices: ['No cup means she never really won', 'Winning that game did not come with a cup',
                'She won, but was unfairly denied the cup'], a: 0,
      cue: 'Monica の「勝った」への、問い返しの形。',
      line: 'Oh yeah? Then *how come you didn’t get* the Geller Cup? … the trophy you got *if you won the game*.',
      said: '「勝ったなら、なんでカップがないの？」と聞き返す。',
      mean: 'Oh yeah? Then how come ～？は反論の形。カップがない＝勝っていない、と言う。',
      trap: 'how come を同情と取ると「不公平」に聞こえる。Oh yeah? の直後は反論が来る。',
      use: 'How come you didn’t call me?（なんで電話くれなかったの？）' },

    // R fix: V2 + S4 — the lake was the only memorable fate (85 % blind); now three fates of one kind. The segment ran
    //   15.3 s and now starts at 124.0 s.
    // why: thrown out ← “threw it” caught, “lake” missed; locked away by their dad ← “our dad… so we took the trophy”,
    //   heard as the story ending with him holding it
    { id: 'd3', skill: 'detail', level: 'B1', point: 'lake', reveals: ['cup'], seg: [124.0, 138.9],
      stem: 'What happened to the trophy in the end?',
      choices: ['It was thrown into a lake', 'It was locked away by their dad', 'It was thrown out with the trash'], a: 0,
      cue: '「took the」のあと、トロフィーをどうしたか。',
      line: 'so we took the trophy… *threw it in the lake*.',
      said: '父は「勝者なし」と言い、家族でトロフィーを持っていって、みずうみに投げた。',
      mean: 'けんかの元になるトロフィーそのものを、なくしてしまった。',
      trap: 'took で終わると思うと「父がしまった」、threw だけ聞くと「捨てた」になる。最後の名詞まで聞く。',
      use: 'I threw it in the trash.（ゴミ箱に捨てちゃった）' },

    // R fix: V2 (§9.4) — the title gives away that they play (70 % blind). The item now asks how they come to it.
    // why: teased into it ← the usual script, and the street joke and “play rough” come soon after, but “we're going to
    //   play” (162 s) comes first; their mom ← “Mom said we were not allowed” is the last thing said about the rule
    { id: 'g2', skill: 'gist', level: 'B1', point: 'decide', reveals: ['mom', 'second'], seg: [143.0, 176.0],
      stem: 'How do Ross and Monica come to their decision about the game?',
      choices: ['They talk it over alone, then agree to play', 'They refuse until the others tease them',
                'They agree once their mom says it is okay'], a: 0,
      cue: '後半、二人だけの話のあとの一言。',
      line: 'Can I see you for a second? … All right, *we’re going to play*.',
      said: '禁止の話のあと、二人だけで話して戻り、「よし、やろう」と決める。からかいはそのあと。',
      mean: '長く守ってきた母の決まりを、二人で相談して破ることにした。',
      trap: 'からかわれて決めた流れに見えやすいが、順番が逆。決めた一言がどこにあるかを聞く。',
      use: 'All right, let’s do this.（よし、やろう）' },

    // why: 2 ← the -elve swallowed, only “twe-” caught; 20 ← twelve and twenty both start “twe-”
    { id: 'n2', skill: 'number', level: 'B1', point: 'years', seg: [148.3, 154.1],
      stem: 'How long has it been since Ross and Monica last played?',
      choices: ['2 years', '12 years', '20 years'], a: 1, keep: true,
      cue: '「come on」のあと、年数の語の終わり。',
      line: 'I mean, come on, it’s been *12 years*.',
      said: '「だってもう12年だよ」と、もう一度やろうと言い出す。',
      mean: '禁止されてから長い時間がたった。だからもういいだろう、という理由。',
      trap: 'twelve と twenty は出だしが同じ。最後が「ルヴ」なら twelve、「ティ」なら twenty。',
      use: 'It’s been ten years since we met.（出会って10年になる）' },

    // why: takes it back ← I mean = 「いや、つまり」, a correction; not sure ← the Japanese frame: words right after a
    //   proposal heard as hedging it
    { id: 'm2', skill: 'marker', level: 'B2', point: 'imean', seg: [148.3, 154.1],
      stem: 'Right after the suggestion to play a game, what does the next phrase do?',
      choices: ['It gives a reason to back the idea up', 'It takes back what was just suggested',
                'It shows the speaker is not really sure'], a: 0,
      cue: '提案のすぐあとの2語と、その後の中身。',
      line: 'I think we should play a game. *I mean*, come on, it’s been…',
      said: '「試合しようよ。だって、もう何年もたってるし」と続ける。',
      mean: 'I mean は言い直しだけでなく、「だって」と理由を足して押すときにも使う。',
      trap: 'I mean ＝「いや、つまり」と覚えていると、取り消しに聞こえる。あとに来るのが理由か訂正かを聞く。',
      use: 'Let’s eat out. I mean, it’s Friday.（外で食べようよ。だって金曜だし）' },

    // why: time to think ← “for a second” read as a moment to decide; a look ← “see you” read literally as 見る
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'second', seg: [150.0, 161.0],
      stem: 'When the suggestion is answered with a question, what is that question asking for?',
      choices: ['A word alone, away from the others', 'A moment longer to think about it',
                'A look at something the other has'], a: 0,
      cue: '提案への返事が、質問の形。see の意味。',
      line: '*Can I see you* for a second?',
      said: '「ちょっといい？」と呼び出す。',
      mean: 'Can I see you for a second? ＝「ちょっと二人で話せる？」。人前で言いにくいときに。',
      trap: 'see を「見る」、a second を「考える時間」と取りやすい。人を see は「会う・話す」。',
      use: 'Can I see you in my office?（ちょっと部屋に来てくれる？）' },

    // R fix: S3 — the cue held “Mom”, a word only the key's choice had.
    // anchor: 165.6–168.4 s “my mom won't let me cross the street” right after “we're going to play”, echoing “Mom said
    //   we were not allowed” (144.4–147.8 s); 169.4–172.1 s “You want to play rough? We can play rough”: they answer it
    //   as a dig at them
    // why: himself ← “my mom… me”: first person, so it sounds like self-mockery; his own mother ← “won't let me” heard as
    //   a complaint about a strict parent
    { id: 'c1', skill: 'humor', level: 'C2', point: 'street', seg: [161.9, 172.6],
      stem: 'In the line about crossing the street, who is the joke on?',
      choices: ['Ross and Monica, for still minding their mom', 'The speaker himself, for being so sheltered',
                'The speaker’s own mother, for being so strict'], a: 0,
      cue: '直前の禁止の話と、返ってきた答え。',

      line: 'How are we going to get there? Because *my mom won’t let me cross the street*. — You want to *play rough*?',
      said: 'やると決めた二人に「どうやって行く？ママが道を渡らせてくれない」と言い、「荒っぽくやる気？」と返る。',
      mean: '自分の話のふりで、母の言いつけを守る二人をまねている。二人が挑発と受け取ったのが証拠。',
      trap: 'my や me で自虐に聞こえる。ふざけた「私」は、直前の誰かの話をなぞっていることが多い。',
      use: 'Should we ask your mom first?（先にママに聞いとく？）' },
  ]
};
