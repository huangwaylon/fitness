// REVIEW 2026-11-16: pass 8, fix 11, drop 0, new 0; ear checks 1
// OPEN: g2 and pr2 lean on the title "Did I Stutter?"; d4 assumes "I haven't done anything since Christmas" is Michael
//   (one unbroken run in both sources, no name).
// “Did I Stutter? - The Office US” (the official The Office channel, Best of Season 4): Michael calls a meeting to
// "energize" the office; Jim teases Pam with a fake proposal and Andy's idea; Stanley flatly refuses to join in.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 128 s; whisper's repeated line after it
// is a hallucination. Untested on purpose: Michael's insults about Pam's glasses (17–36 s), the hesitant "a, uh,
// friend's house" (5–9 s), the garbled "Don't you dare" (50 s) and "Earth to Stanley" (105 s), and the crosstalk at
// 101–116 s. At 12–15 s the captions have "so I don't wear my backup glasses", whisper "so I had to wear…"; d1's line
// and key stop before it.
// EAR CHECK: 124.6 s a2 — “Good. This is good.” after the silence: key assumes rattled cover, not real pleasure (tone)
import type { Clip } from '../types.ts';

export const didIStutter: Clip = {
  id: 'stutter', video: 'iahcJPo9Dwg', title: 'Did I Stutter?', dur: 154, wpm: 187, band: 'fast',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: the cue quoted "forgot", a word only the key had (S3); it now points at "contact".
    // why: lost a lens ← "contact" heard, "solution" lost; tired eyes ← the usual reason to switch to glasses
    { id: 'd1', skill: 'detail', level: 'B1', point: 'solution', seg: [3.6, 12.6],
      stem: 'Why is Pam wearing her backup glasses today?',
      choices: ['She forgot her contact lens solution', 'She lost one of her contact lenses',
                'Her eyes felt too tired for her contacts'], a: 0,
      cue: '「contact」のすぐあとの一語。',
      line: 'I slept over at a… friend’s house, and I *forgot my contact solution*',
      said: '「友だちの家に泊まって、コンタクトの保存液を忘れた」と話す。',
      mean: 'contact solution ＝ コンタクトの保存液。だから今日はめがね。',
      trap: 'contact だけ聞くとレンズをなくした話に聞こえる。後ろの solution まで聞く。',
      use: 'I forgot my phone charger.（スマホの充電器を忘れた）' },

    // R fix: "cut spending" was a filler (V2); now the phone message, the first idea the meeting turns to.
    // why: phone system ← the answering-machine idea taken as the meeting's purpose; Christmas party ← "Christmas" is
    //   said
    { id: 'g1', skill: 'gist', level: 'B1', point: 'energize', seg: [36.5, 79.4],
      stem: 'What is Michael’s meeting for?',
      choices: ['Ideas to put some life into the office', 'Ideas to fix the office phone messages',
                'Ideas to plan the office Christmas party'], a: 0,
      cue: '「how are we going to」のあとの動詞。',
      line: 'so how are we going to *energize our office*?',
      said: '会議室で話し合いをすると言い、「どうやってこの職場を元気にする？」と聞く。',
      mean: 'energize ＝ 活気づける。退屈な職場に、新しいアイデアがほしい。',
      trap: 'Christmas が聞こえるのでパーティーと取りやすいが、それは「それ以来何も」の話。',
      use: 'Any ideas to liven things up?（盛り上げるアイデアある？）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'brainstorm', seg: [36.6, 41.9],
      stem: 'Type what you hear: “we’re going to have a little ___…” (2 words)',
      answer: 'brainstorming session',
      cue: '「a little」のあと。長い語と短い語。',
      line: 'we’re going to have a little *brainstorming session* in the conference room.',
      said: '「会議室でちょっとしたブレストをやるぞ」とみんなに言う。',
      mean: 'brainstorming session ＝ アイデアを自由に出し合う会議。',
      trap: 'brainstorming の g と session がつながり「ブレインストーミンセッション」。',
      use: 'Let’s do a quick brainstorming session.（さっとブレストしよう）' },

    // R fix: "hates her middle name" was weak (V2); now another glasses joke, which the scene has just had.
    // why: glasses joke ← Michael has just mocked her glasses; in trouble ← a full name is what a parent or boss uses to
    //   scold
    { id: 'i3', skill: 'infer', level: 'B2', point: 'propose', seg: [44.0, 53.6],
      stem: 'When Pam hears her full name, why does she cut in?',
      choices: ['She thinks a marriage proposal is coming', 'She expects another joke about her glasses',
                'She thinks she’s in trouble with Michael'], a: 0,
      cue: 'フルネームのあと、彼女が条件をつける一文。',
      line: 'If you *propose to me* during a Michael meeting, I will say no.',
      said: 'フルネームで呼ばれ、「マイケルの会議中にプロポーズしたら、断るから」と言う。',
      mean: '改まったフルネームは、結婚の申し込みの前置きに聞こえた。',
      trap: 'フルネームは叱られる合図にもなるが、続く propose で何を警戒したか分かる。',
      use: 'Don’t you dare!（絶対やめてよ！）' },

    // R fix: the quote marks around "proposal" flagged the key, and "given up on asking her" was weak (V2/K6); C is now
    //   the other reading of "too late".
    // why: real proposal ← a real proposal read into "proposing"; someone else ← "too late" read as already taken
    { id: 'h1', skill: 'humor', level: 'C1', point: 'proposing', reveals: ['propose', 'coffee'], seg: [50.8, 59.1],
      stem: 'What makes the reply to Pam’s warning funny?',
      choices: ['What he proposes is just a small favor', 'He makes a real proposal anyway',
                'He says he’s proposed to someone else'], a: 0,
      cue: '「too late, because I’m」のあとの動詞。',
      line: 'it’s too late, because *I’m proposing that you get me a cup of coffee*',
      said: '「もう遅い。僕が提案するのは、コーヒーを1杯持ってきてもらうこと」と返す。',
      mean: 'propose には「提案する」の意味もある。結婚かと思わせて、ただの頼みごと。',
      trap: 'proposing でいよいよ結婚と思いやすい。that 以下が何を求めているか聞く。',
      use: 'I propose we take a break.（休憩にしませんか）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'coffee', reveals: ['proposing'], seg: [54.6, 59.1],
      stem: 'Type what you hear: “I’m proposing that you ___…” (6 words)',
      answer: 'get me a cup of coffee',
      cue: '「that you」のあと、6語。',
      line: 'I’m proposing that you *get me a cup of coffee*, which would energize me greatly',
      said: '「コーヒーを1杯持ってきてくれたら、すごく元気が出る」。',
      mean: 'get me ＝ 私に〜を持ってくる。cup of は弱く「カパ」になる。',
      trap: 'get me が「ゲッミ」、cup of が「カパ」と縮む。6語あると思って書く。',
      use: 'Could you get me a cup of coffee?（コーヒー1杯もらえる？）' },

    // why: New Year's ← another holiday near Christmas; his birthday ← the usual personal date for "since…"
    { id: 'd4', skill: 'detail', level: 'B1', point: 'christmas', seg: [63.8, 68.0],
      stem: 'Since when does Michael say he hasn’t done anything?',
      choices: ['Since Christmas', 'Since New Year’s', 'Since his birthday'], a: 0,
      cue: '「I haven’t done anything」のあと。',
      line: 'I mean, I haven’t done anything *since Christmas*.',
      said: '「つまり、クリスマス以来なにもしてない」と言う。',
      mean: 'しばらく何も新しいことがない、と職場の退屈さを言っている。',
      trap: '年末年始の話と思うと New Year’s を選びやすい。since のあとの語を聞く。',
      use: 'I haven’t seen him since Christmas.（クリスマス以来会ってない）' },

    // R fix: "slowing down and calming things" contradicted "get things going" outright (K3); now a gradual-start reading.
    // why: making coffee ← percolate = コーヒーをいれる, read literally; slowly ← "a little bit" + percolate (drip) read
    //   as one small step at a time
    { id: 'p1', skill: 'phrase', level: 'C1', point: 'percolate', seg: [71.9, 76.0],
      stem: 'What does Michael mean by what the office needs to get doing?',
      choices: ['Start getting active and full of ideas', 'Start making fresh coffee for everyone',
                'Start slowly, one small step at a time'], a: 0,
      cue: '「get things going」の言いかえ。',
      line: 'we need to get things going. We need to *get percolating* a little bit.',
      said: '「物事を動かさないと。少しずつわき立たせないと」と言う。',
      mean: 'percolate ＝ コーヒーがわく。ここではアイデアや活気がわいてくるたとえ。',
      trap: 'コーヒーの話と取りやすい。直前の get things going と同じ意味の言いかえ。',
      use: 'Ideas are starting to percolate.（アイデアがわいてきた）' },

    // why: Does anybody ← the full question form expected; had ← the weak v heard as d; Nobody ← "any" lost, "-body" kept
    { id: 's1', skill: 'sound', level: 'B2', point: 'anybody', seg: [75.0, 79.3],
      stem: 'Fill the gap: “___ any ideas what we could do?”',
      choices: ['Anybody have', 'Does anybody have', 'Anybody had', 'Nobody has'], a: 0,
      cue: '文の最初。does があるかどうか。',
      line: '*Anybody have* any ideas what we could do?',
      said: '「何か案はある？何でもいいから」とみんなに聞く。',
      mean: '会話では does を省き、Anybody have…? だけで質問にする。',
      trap: '学校の英語では Does anybody… と習う。最初の音が「エニ」か「ダ」かを聞く。',
      use: 'Anybody want some tea?（お茶ほしい人いる？）' },

    // R fix: "louder rings" was weak (V2); now a peppier live voice, the near miss on "answering machine".
    // why: theme song ← the rap idea comes later; peppier voice ← "answering" + "more pep" heard, "machine" lost
    { id: 'd2', skill: 'detail', level: 'B2', point: 'message', seg: [79.3, 88.8],
      stem: 'What does Andy suggest?',
      choices: ['Making the phone greeting livelier', 'Writing a theme song for the office',
                'Answering calls in a peppier voice'], a: 0,
      cue: '「What if we changed our」のあと。',
      line: 'What if we changed our *outgoing answering machine message*… a little more *zing* and… *pep*?',
      said: '「留守電の応答メッセージを変えて、もっと勢いと元気を出したら？」と言う。',
      mean: 'outgoing message ＝ 留守電の応答。zing と pep は活気。',
      trap: 'answering と pep で声の話と取りやすい。machine まで聞く。',
      use: 'What if we tried something new?（何か新しいことをやってみたら？）' },

    // R fix: "look at something he has" was weak (V2); now "see, I told you".
    // why: knew it ← "See" read as "see, I told you"; doubt ← a pause after "that's" heard as hesitation about the idea
    { id: 'm1', skill: 'marker', level: 'B2', point: 'see', reveals: ['message'], seg: [87.95, 91.15],
      stem: 'After repeating Andy’s two words, what does Michael’s first word do?',
      choices: ['Points to them as the kind of thing he wants', 'Says he knew that idea would come up',
                'Shows he isn’t so sure about the idea'], a: 0,
      cue: '二つの語をくり返したあと、文頭の短い一語。',
      line: '*See*, that’s— those are the kind of words we’re looking for.',
      said: '出た言葉をくり返し、「ほら、こういう言葉を待ってたんだ」と言う。',
      mean: '文頭の See ＝「ほら、これだよ」。例を示して、ほめる合図。',
      trap: '「ほら言ったでしょ」と取りやすいが、前に予言はない。文頭の See は「ほら、これ」。',
      use: 'See, that’s what I mean.（ほら、そういうこと）' },

    // why: Andy ← it's the same idea as his; Pam ← she spoke up earlier and is in the meeting
    // R fix: the name is said right before the line ("Yes, Jim."), so explicit and clear: level B2 → B1 (V5).
    { id: 'w1', skill: 'who', level: 'B1', point: 'jim', reveals: ['message'], seg: [89.0, 97.4],
      stem: 'Who suggests an even newer voicemail message?',
      choices: ['Jim', 'Andy', 'Pam'], a: 0,
      cue: '「Yes,」のあとに呼ばれる名前。',
      line: 'Yes, *Jim*. — What about if we did an even newer voicemail message',
      said: 'マイケルが名前を呼んで当て、その人が「もっと新しい留守電メッセージは？」と言う。',
      mean: '当てられた人が次に話す。名前のあとの声が答えの人。',
      trap: '中身が前の案と同じなので、同じ人と思いやすい。直前に呼ばれた名前を聞く。',
      use: 'Yes, you in the back?（はい、後ろの方どうぞ）' },

    // R fix: "wasn't listening to Andy" was weak (V2); now backing Andy up, the sincere-but-strategic reading.
    // why: better version ← "even newer…even more" read as real improvement; backing Andy ← repeating read as support
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'mock', reveals: ['message'], seg: [91.0, 97.4],
      stem: 'What is the second voicemail idea really doing?',
      choices: ['Mocking the first idea by repeating it', 'Improving on the first idea for real',
                'Backing Andy up to win Michael over'], a: 0,
      cue: '前の案とくらべて、何が新しいか。',
      line: 'an *even newer* voicemail message that had *even more zing and pep*?',
      said: '「もっと新しい留守電で、もっと勢いと元気があるのは？」と言う。',
      mean: '中身は前の案と同じ。even を足しただけで、ばかばかしさをからかっている。',
      trap: 'even more は普通「さらに良く」だが、新しい中身がないなら冗談。',
      use: 'Great idea. Even more zing!（いいね、もっと勢いを！）' },

    // R fix: "annoyed but hides it" was weak (V2); now unsure, a misreading of "Maybe…".
    // why: plays along ← bosses in sitcoms often see the joke; unsure ← "Maybe…" heard as hesitation
    { id: 'i2', skill: 'infer', level: 'C1', point: 'oblivious', reveals: ['mock', 'rap'], seg: [94.6, 101.2],
      stem: 'What does Michael’s reply to that idea show?',
      choices: ['He misses that the idea is a joke', 'He sees the joke and plays along with it',
                'He’s unsure and steers to a new topic'], a: 0,
      cue: '案のすぐあと、彼が足すアイデア。',
      line: 'I like this. Maybe a *whole theme*, like a rap',
      said: '「いいね」と言い、さらに「テーマを決めてラップにするとか」と話を広げる。',
      mean: 'からかいに気づかず、本気でアイデアをふくらませている。',
      trap: 'ノリで合わせているとも取れるが、自分から案を足すのは本気の印。',
      use: 'I like where this is going.（いい流れだね）' },

    // why: in trouble ← "we're cooked" (= done for) heard; lunch ← cooking read literally
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'cooking', seg: [95.6, 99.0],
      stem: 'What does Michael mean by his reaction to the new idea?',
      choices: ['Now we’re making progress', 'Now it’s time to eat lunch', 'Now we’re in big trouble'], a: 0,
      cue: '案のすぐあと、cooking を使った短い文。',
      line: '*Now we’re cooking.* I like this.',
      said: '「よし、いい感じになってきた。これ好きだ」と言う。',
      mean: 'Now we’re cooking ＝ 調子が出てきた、うまく進んでいる。',
      trap: 'cooking を料理と取りやすい。we’re cooked（もうだめだ）とは反対の意味。',
      use: 'Now we’re talking!（そうこなくちゃ）' },

    // why: poem ← "rhyme" heard; rock song ← "theme" read as a theme song of any kind
    { id: 'd3', skill: 'detail', level: 'B1', point: 'rap', reveals: ['oblivious'], seg: [98.3, 102.3],
      stem: 'What kind of theme does Michael want for the message?',
      choices: ['A rap song', 'A rock song', 'A short poem'], a: 0,
      cue: '「a whole theme, like a」のあと。',
      line: 'Maybe a whole theme, like *a rap, a rap rhyme*.',
      said: '「いっそテーマを決めて、ラップとか、韻をふむやつとか」と言う。',
      mean: '留守電をラップにしよう、とどんどん話がずれていく。',
      trap: 'rhyme（韻）が聞こえると詩を選びやすい。その前に2回出る語を聞く。',
      use: 'Maybe something like a song?（歌みたいなのとか？）' },

    // R fix: "gets the rap message he wanted" was weak (V2); now help-later, from “put your little game down”.
    // why: joins ← the usual sitcom ending, the holdout gives in; later ← "put your little game down" read as Stanley
    //   finishing his game first
    { id: 'g2', skill: 'gist', level: 'B2', point: 'refusal', reveals: ['stutter', 'water'], seg: [103.0, 128.6],
      stem: 'How does Michael’s effort to bring Stanley in end?',
      choices: ['Stanley’s flat refusal leaves Michael stuck', 'Stanley joins in, if only unwillingly',
                'Stanley agrees to help once his game ends'], a: 0,
      cue: '最後の質問のあとの、長い沈黙。',
      said: '何度も声をかけるが断られ、最後の一言で部屋が静まる。マイケルは水を取りに行くと言う。',
      mean: '上司の言うことをはっきり拒む。マイケルは何も言い返せない。',
      trap: 'シットコムでは最後に折れる流れが多いが、ここは折れない。',
      use: 'I said no. Please leave me alone.（いやだと言ったよね。ほっといて）' },

    // why: did you hear ← "stutter" read literally, a check on being heard; easing tension ← a question read as a joke
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'stutter', seg: [112.0, 120.0],
      stem: 'What is Stanley’s final question doing?',
      choices: ['Shutting Michael down: he already said no', 'Checking that Michael heard his answer',
                'Joking to ease the tension in the room'], a: 0,
      cue: '何度も誘われたあとの、短い質問。',
      line: 'Stanley, we’re having a brainstorm session. — *Did I stutter?*',
      said: '「ブレストしてるんだ」とまた誘われ、「俺の言い方、分かりにくかったか？」と返す。',
      mean: '答えを求めない質問。「はっきり断ったはずだ」と強く拒んでいる。',
      trap: 'stutter（どもる）を文字どおり取ると確認に聞こえる。強い拒否の決まり文句。',
      use: 'I said no. Did I stutter?（いやだって言ったよね？）' },

    // why: pleased ← "Good. This is good." taken at face value; angry ← a boss defied is expected to strike back
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'water', reveals: ['stutter'], seg: [117.0, 128.6],
      stem: 'After the long silence, how does Michael seem?',
      choices: ['Rattled, and covering it by leaving', 'Pleased with how the meeting has gone',
                'Angry, and about to punish Stanley'], a: 0,
      cue: '沈黙のあと、「Good」の言い方と次の行動。',
      line: '*Good. This is good.* I’m going to grab a glass of water.',
      said: '長い沈黙のあと「よし、いいぞ」と言い、すぐ「水を取ってくる」と出ていく。',
      mean: 'いいぞは口だけ。気まずさから逃げている。',
      trap: 'Good を言葉どおり取りやすい。沈黙のあとすぐ席を外すことと合わせて聞く。',
      use: 'I’m going to grab some water.（ちょっと水を取ってくる）' },
  ]
};
