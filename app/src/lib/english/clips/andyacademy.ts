// REVIEW 2026-11-16: pass 7, fix 11, drop 0, new 0; ear checks 3 (as authored)
// “Chris Coaches Andy for the Police Academy | Parks and Recreation” (the official Parks and Recreation channel, Season
// 5): Chris and Tom train Andy for the police physical; the first item on the list is a two-mile run in under 25
// minutes, Andy calls it impossible, runs it in 29:43, despairs, and Chris turns out to be proud of himself.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 97.5 s; music after. Names said: Chris and
// Tom (12.4–13.2 s, by Andy), Tom (67.8 s, addressed), Andy (84.3 s, addressed). Untested on purpose: 0–4 s (captions
// garbled, whisper "Out of the way, people!"), 5.8–12.7 s (who asks "Whereabouts?"; captions "yeah let's do fire",
// whisper "Yeah, that's too far"), 21–29 s (captions "I can't already do this… so you get in there", whisper "I can
// already do this… So. I'm getting there"), 47–56 s (cheering; whisper hears "dig" as "dick"), 65–68 s (what Tom does),
// 81.7–83 s (captions "either drive around", whisper "I'm gonna drive around"), 95–97.5 s (captions "it's so much work",
// whisper "We have so much work").
// EAR CHECK: 18.8 s x1 — "in terrible shape" with "in" weak and linked (both sources have "I am in terrible shape")
// EAR CHECK: 78.2 s s1 h2 — "gonna have to" said "gonna hafta" (both sources have "I'm gonna have to be a robber")
// EAR CHECK: 92.3 s nt2 — the stress in "I guess I'm proud of me" falls on "me" (contrast with "proud of you" at 85.4
// s), not on "proud" (ship only once confirmed)
import type { Clip } from '../types.ts';

export const andyAcademy: Clip = {
  id: 'andyacademy', video: '33Z9lQQywjg', title: 'Chris Coaches Andy for the Police Academy', dur: 108, wpm: 153,
  band: 'slow', tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 — "already fit" was refuted by the title and "terrible shape"; now a keyword trap from “Tom, now is not
    //   the time for criticism”
    // why: argue ← "Tom… criticism" heard as the scene's conflict; quits ← "I'm never gonna be a cop" heard as the end of
    //   the story
    { id: 'g2', skill: 'gist', level: 'B2', point: 'scene', reveals: ['result'], seg: [12.2, 97.5],
      stem: 'What is the clip mostly about?',
      choices: ['Andy’s first workout shows how far he has to go', 'Chris and Tom argue over how to train Andy',
                'Andy decides the police life isn’t for him after all'], a: 0,
      cue: '最初の「terrible shape」と、最後の「work to do」。',
      said: '警察学校をめざす Andy の最初の練習。走りは基準に届かず、最後は「やることは山ほどある」で終わる。',
      mean: '一度の失敗で終わる話ではなく、長い特訓の始まりの場面。',
      trap: '「警官には絶対なれない」は落ち込んだ瞬間の一言。最後まで聞くと練習は続く。',
      use: 'We’ve got a lot of work to do.（やることがたくさんある）' },

    // why: days/weeks ← "three" caught, the unit lost in "months away" (the -ths blurs)
    { id: 'n1', skill: 'number', level: 'B1', point: 'exam', seg: [15.3, 19.0], keep: true,
      stem: 'How soon is Andy’s physical exam?',
      choices: ['About three days', 'About three weeks', 'About three months'], a: 2,
      cue: '「about three」のあとの単位。',
      line: 'The physical exam is *about three months away*.',
      said: '「体力試験まであと3か月くらい」と言う。',
      mean: 'A is 〜 away ＝「A まであと〜」。期間の長さが away の前に来る。',
      trap: 'months の th と s がつぶれて短く聞こえる。数のあとの単位まで聞く。',
      use: 'My birthday is two weeks away.（誕生日まであと2週間）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'shape', seg: [18.1, 21.6],
      stem: 'Type what Andy says: “and I am ___.” (3 words)', answer: 'in terrible shape',
      cue: '試験の話のあと、「I am」に続く部分。',
      line: 'and I am *in terrible shape*',
      said: '「僕は体力がひどいことになってる」と言う。',
      mean: 'in terrible shape ＝ 体力がまるでない状態。in は am とつながる。',
      trap: 'in が短く弱いので落としやすい。terrible の語尾は「ボー」に近い。',
      use: 'I need to get back in shape.（体力を戻さなきゃ）' },

    // R fix: V2 — "misreads the numbers" was a filler; now "checks carefully", the wrong implication of "That's a typo"
    // why: unfair test ← "humanly impossible" taken at face value, as a fact about the list; careful ← "That's a typo"
    //   heard as Andy catching a real error on the list
    { id: 'i1', skill: 'infer', level: 'C1', point: 'humanly', reveals: ['typo', 'shape'], seg: [28.9, 39.1],
      stem: 'What does Andy’s reaction to the first item on the list show?',
      choices: ['How out of shape he is, to call it impossible', 'How unfair the police are, to set such a test',
                'How closely he reads the list, to spot an error'], a: 0,
      cue: '「number one」の項目と、それへの言い方の強さ。',
      line: 'everything that I’m *supposed to be able to do*… That’s a typo, right? I mean, that’s *humanly impossible*.',
      said: '誰もが満たすべき条件の「1番目」を読んで、「人間には無理」と言う。',
      mean: '全員に求める基本の条件を「不可能」と呼ぶのは、自分の体力のなさを語っているのと同じ。',
      trap: '本人の「無理」をそのまま事実と取りやすい。全員向けの条件の1番目、という点を聞く。',
      use: 'Five miles? That’s humanly impossible.（5マイル？人間には無理だよ）' },

    // why: 20 ← "twenty" caught, the short "-five" lost before "minutes"; 35 ← "-five" caught, "twen-" blurred
    { id: 'n2', skill: 'number', level: 'B1', point: 'limit', seg: [31.9, 37.0], keep: true,
      stem: 'Within how many minutes must he run two miles?',
      choices: ['Under 20 minutes', 'Under 25 minutes', 'Under 35 minutes'], a: 1,
      cue: '「in under」のあとの数字。',
      line: 'be able to run two miles *in under 25 minutes*.',
      said: '「2マイルを25分未満で走れること」が1番目の条件。',
      mean: 'in under 〜 ＝「〜以内で」。twenty-five の five は短く、minutes とつながる。',
      trap: 'twenty のあとの five を落とすと20分に聞こえる。',
      use: 'We got there in under an hour.（1時間かからずに着いた）' },

    // why: longer run ← "two miles" thought too short for 25 minutes, so the list must mean more; end of training ←
    //   "three months away" earlier, so the limit heard as a later goal
    { id: 'd2', skill: 'detail', level: 'B2', point: 'typo', reveals: ['limit'], seg: [31.9, 39.1],
      stem: 'What does Andy think the time limit on the list must be?',
      choices: ['A printing mistake on the list', 'The limit for a longer run', 'A target for the end of training'], a: 0,
      cue: '「25 minutes」のあと、right? で終わる短い文。',
      line: 'run two miles in under 25 minutes. That’s a *typo*, right?',
      said: '「2マイルを25分未満」という項目を読み、「印刷ミスだよね？」と言う。',
      mean: 'typo ＝ 打ちミス。そんな短い時間は無理だから、書き方がおかしいと思っている。',
      trap: '数字が続くので別の距離を想像しやすい。right? は「〜だよね？」の確認。',
      use: 'Is that a typo? It says $5,000.（これ打ちミス？5000ドルって書いてある）' },

    // why: takes back ← "I mean" as a self-correction (言い直し), its other common use; asks Chris ← "right?" just before
    //   heard as carrying on into the next phrase
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['typo', 'limit'], seg: [36.0, 39.1],
      stem: 'Right after Andy’s question about the time limit, what does his next phrase do?',
      choices: ['It gives his reason for asking', 'It takes back what he just said', 'It asks Chris to agree with him'], a: 0,
      cue: '「right?」のすぐあと、文頭の短い二語。',
      line: 'That’s a typo, right? *I mean*, that’s humanly impossible.',
      said: '「印刷ミスだよね？だって、人間には無理だよ」と続ける。',
      mean: 'ここの I mean は「だって」「というのも」。直前の疑問に理由を足している。',
      trap: 'I mean は言い直しにも使うが、ここは前の文を取り消していない。同じ方向の話が続く。',
      use: 'Let’s eat in. I mean, it’s pouring.（家で食べよう。だって土砂降りだし）' },

    // R fix: V2 + K5/K6 — the key was the only non-"By…" and only two-part choice; the agreeing miss is now two-part too.
    //   The stem no longer names the speaker (no name in the audio). Its choices show "typo": reveals added
    // why: agreeing ← "humanly impossible" was the last thing said, and "anything is possible" heard as "try anyway";
    //   easy ← "anything is possible" heard as "no problem"
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'possible', reveals: ['typo'], seg: [36.0, 43.4],
      stem: 'How is Andy’s doubt about the list answered?',
      choices: ['By offering a motto rather than a real answer', 'By agreeing it’s a typo, but urging him to try',
                'By telling Andy the time limit will be easy'], a: 0,
      cue: '「When you」で始まる文の最後。',
      line: 'When you are able to focus your mind and your body, *anything is possible*.',
      said: '「心と体に集中できれば、何だって可能だ」と返す。',
      mean: '25分という具体的な疑問に、名言のような決まり文句で答えている。答えにはなっていない。',
      trap: '「可能」を「簡単」と取りやすいが、条件つきの励まし。数字には一言も触れていない。',
      use: 'Hey, anything is possible.（まあ、何だってありえるよ）' },

    // R fix: V2 — "with a bit to spare" was easy to rule out; now the near miss "only just", parallel to the key
    // why: gives up ← "I'm going to die… running is impossible" heard as quitting mid-run; only just ← the cheering and
    //   a "Yes!" heard as success, the time itself missed
    { id: 'g1', skill: 'gist', level: 'B2', point: 'result', seg: [46.0, 81.7],
      stem: 'How does Andy’s first try at the run turn out?',
      choices: ['He finishes it, but far too slowly', 'He gives up before the end of it',
                'He makes the time, but only just'], a: 0,
      cue: '走り終わったあとの、タイムの報告と本人の反応。',
      line: '*I’m never gonna be a cop.*',
      said: '声援を受けて走り切るが、タイムを聞いて「警官には絶対なれない」と嘆く。',
      mean: '最後まで走ったが、基準の時間にまったく届かなかった。',
      trap: '途中の歓声で成功に聞こえるが、そのあとの報告と本人の嘆きが結果を示す。',
      use: 'I finished, but it took forever.（終わったけど、すごく時間がかかった）' },

    // R fix: V2 — "truly ill, in need of a doctor" was a filler; now "afraid he's injured", from “Everything hurts”
    // why: injured ← "I'm going to die… everything hurts" taken literally; proud ← the cheering and a "Yes!" just before
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'die', seg: [57.3, 65.3],
      stem: 'How does Andy feel right after the run?',
      choices: ['Worn out, and making a big deal of it', 'Hurt, and afraid he has injured himself',
                'Proud, though he is very out of breath'], a: 0,
      cue: '走ったあとの短い文を、いくつか続けて。',
      line: '*I’m going to die*. I’m so tired. Everything hurts.',
      said: '「死ぬ。すごく疲れた。全身痛い。走るなんて無理」と並べる。',
      mean: 'going to die は大げさな「もうだめ」。本当に危ないのでなく、へとへとだという表現。',
      trap: 'die や hurts を文字どおり取るとけがに聞こえる。so tired が中身。',
      use: 'I’m dying. Can we take a break?（もうだめ、休憩しない？）' },

    // R fix: V2 — with three choices the key was the only one sharing a part with both others; now the full 2 × 2 grid.
    //   Seg end moved off the end of "seconds"
    // why: 25 ← the limit on the list, the last time heard before this; 53 ← forty/fifty, both f-, with a weak "-ty"
    { id: 'n3', skill: 'number', level: 'B1', point: 'time', reveals: ['result', 'limit'], seg: [68.4, 75.5], keep: true,
      stem: 'What is Andy’s time for the run?',
      choices: ['25 minutes 43 seconds', '25 minutes 53 seconds', '29 minutes 43 seconds', '29 minutes 53 seconds'], a: 2,
      cue: '「in」のあと、分と秒の二つの数。',
      line: 'Andy finished his two-mile run in *29 minutes and 43 seconds*.',
      said: '「2マイルのタイムは29分43秒」と報告される。',
      mean: '基準は25分未満なので、4分以上のオーバー。',
      trap: 'forty と fifty はどちらも f で始まる。-ty の前の母音で聞き分ける。',
      use: 'It took me 45 minutes.（45分かかった）' },

    // R fix: V2 + S3 — "rob a bank to pay for training" was a filler; now the training-drill reading. The cue's "cop"
    //   was a word only the key had
    // why: drills ← "robber" heard inside the training scene (cops and robbers practice); rather ← "gonna have to" lost,
    //   so it sounds like his own wish
    { id: 'h2', skill: 'humor', level: 'C1', point: 'robber', seg: [74.6, 80.4],
      stem: 'Why is Andy’s reaction to his time funny?',
      choices: ['He thinks failing as a cop makes him a robber', 'He means he’ll play the robber in their drills',
                'He says he would rather be a robber anyway'], a: 0,
      cue: 'タイムを聞いて嘆いたあとの、二つ目の文。',
      line: 'I’m never gonna be a cop. I’m gonna have to be a *robber*.',
      said: '「警官には絶対なれない。泥棒になるしかない」と嘆く。',
      mean: '警官がだめなら泥棒、という子どもの遊びの二択。大人の進路の話なのが笑い。',
      trap: 'have to は「しかたなく」。訓練の役の話でも、なりたい夢でもない。',
      use: 'Guess I’ll have to cook tonight.（今夜は自分で作るしかないか）' },

    // R fix: V2 — "have to" was the only natural fit; "gonna try to" is now "going to", the reading a blended "hafta"
    //   collapses into
    // why: get to ← the same "-ta" ending, and "get to" (a chance) flips the feeling; going to ← "gonna hafta" blurred
    //   into one "gonna-ta" and heard as plain future
    { id: 's1', skill: 'sound', level: 'B2', point: 'robber', seg: [76.8, 80.4],
      stem: 'Fill the gap: “I’m ___ be a robber.”',
      choices: ['gonna have to', 'gonna get to', 'going to'], a: 0,
      cue: '「gonna」と「be」のあいだ、短い二語。',
      line: 'I’m *gonna have to* be a robber.',
      said: '「泥棒になるしかない」と言う。',
      mean: 'gonna have to ＝ 〜するしかない。have の v が f に近づき「ハフタ」とつながる。',
      trap: 'get to（〜できる）も「〜タ」で終わり、意味は逆。頭の子音 h と g を聞き分ける。',
      use: 'We’re gonna have to wait.（待つしかないね）' },

    // why: wait ← "hang in there" read as "stay there"; hold on ← "hang" = ぶら下がる・つかまる, with the run's exhaustion
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'hang', seg: [77.0, 81.7],
      stem: 'What is Andy being told right after his reaction?',
      choices: ['Don’t give up yet; keep going', 'Wait right there for a moment', 'Hold on to me and catch your breath'], a: 0,
      cue: '「come on」のすぐあと、pal で終わる一言。',
      line: 'Oh, come on. *Hang in there*, pal.',
      said: '「おいおい、がんばれよ、相棒」と声をかけられる。',
      mean: 'hang in there ＝ あきらめずに踏ん張れ。落ち込んだ人への定番の励まし。',
      trap: 'hang（ぶら下がる）や there（そこ）を文字どおり取ると、場所の指示に聞こえる。',
      use: 'Hang in there. It’s almost Friday.（踏ん張って、もうすぐ金曜だよ）' },

    // why: gently ← praise opens it, and the Japanese frame expects criticism to be wrapped softly; mockingly ← "proud of
    //   you" right before "terrible" heard as sarcasm, though "but because of…" goes on in earnest
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'terrible', seg: [83.8, 92.2],
      stem: 'How does Chris talk about Andy’s run while praising him?',
      choices: ['Bluntly, calling it what it was', 'Gently, so as not to hurt him', 'Mockingly, as if the praise were a joke'], a: 0,
      cue: '「proud of you」のあと、which で付け足す一言。',
      line: 'Not because of what you did, *which was terrible*…',
      said: '「誇りに思う。君がしたことのせいじゃない、あれはひどかった」と言う。',
      mean: 'ほめる途中でも、結果ははっきり「ひどい」と言う。遠回しにしない。',
      trap: '日本語なら厳しい評価は包むので、優しさや皮肉を探しやすい。ここは言葉どおりの率直さ。',
      use: 'Honestly? It was terrible.（正直に言うと、ひどかった）' },

    // R fix: V2 — the key was the only choice about Chris and the only one about the future; "courage in trying out" is
    //   now "what Andy will manage", the scope miss on "get you to do". Seg runs to "proud of me", which refutes it
    // why: effort ← "proud of you" heard alone, the usual "proud of your effort" script; one day ← "what… you… do" heard
    //   as Andy's future, the subject "I" missed
    { id: 'i2', skill: 'infer', level: 'B2', point: 'proud', reveals: ['terrible'], seg: [83.8, 93.75],
      stem: 'What is Chris really proud of, from what he says?',
      choices: ['His own power to make Andy improve', 'How hard Andy pushed himself today',
                'What Andy will manage to do one day'], a: 0,
      cue: '「not because」と「but because」の後ろを比べて。',
      line: 'Not because of what you did… but because of *what I’m going to be able to get you to do*.',
      said: '「したことでなく、これから僕が君にさせられることのせいだ」と言う。',
      mean: '主語が I に変わる。誇らしいのは Andy の今日でなく、自分の指導の力。',
      trap: 'proud of you で「頑張りをほめた」と取りやすい。but のあとの主語 I が中心。',
      use: 'I’m proud of what we built.（自分たちが作ったものが誇らしい）' },

    // anchor: 85.4 s "I'm proud of you" set against 92.3 s "I guess I'm proud of me": the same frame, only the object
    //   changes
    // R fix: V2 — the key was the only choice naming a contrast; "On proud" is now "On I'm", the right mechanism on the
    //   wrong word ("what you did" → "what I'm going to…" just before)
    // why: on "I'm" ← the you/I contrast of the previous sentence carried over; on "guess" ← "I guess" heard as real
    //   doubt (かもしれない), the literal hedge
    // retired: C2 stress item, until the ear check (the stress on “me”)
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'proudme', reveals: ['proud'], seg: [83.8, 93.75], retired: true,
      stem: 'Where is the stress in “I guess I’m proud of me,” and why?',
      choices: ['On “me”: set against “proud of you” earlier', 'On “I’m”: set against “what you did” earlier',
                'On “guess”: showing he isn’t really sure'], a: 0,
      cue: '最初のほめ言葉と比べて、入れ替わった語。',
      line: 'Andy, I’m proud of *you*… I guess I’m proud of *me*.',
      said: '「君を誇りに思う」で始め、「つまり自分が誇らしい」と言い直す。',
      mean: '同じ形の文で、目的語だけが you から me に変わる。新しい情報の me が強く、「君でなく僕」という対比になる。',
      trap: 'I’m は前の文と同じで新しくない。I guess も迷いではない。対比では変わった語を探す。',
      use: 'I wasn’t mad at you. I was mad at me.（君にじゃなく、自分に怒ってた）' },

    // anchor: 85.4 s "I'm proud of you", 88.4 s "which was terrible", 92.3 s "I guess I'm proud of me", then 93.8 s
    //   "Thanks, man. Me too."
    // why: hits back ← "Thanks" heard as sarcastic after "terrible" (the sincerity flip); thought it terrible ← "Me too"
    //   tied to "which was terrible" instead of the last line, "proud of me"
    // retired: one C2 alone is under 2 (nt2 retired)
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'metoo', reveals: ['proud', 'proudme'], seg: [83.8, 95.15], retired: true,
      stem: 'Why is Andy’s answer to Chris’s praise funny?',
      choices: ['He thanks Chris for praise that was really for Chris', 'He hits back at Chris for calling his run terrible',
                'He admits that he, too, thought his run was terrible'], a: 0,
      cue: 'Chris の最後の一文と、それへの返事。',
      line: 'I guess I’m proud of me. — *Thanks, man. Me too.*',
      said: '「走りはひどかった。誇らしいのは、つまり自分だ」と言われ、Andy は「ありがとう、僕も」。',
      mean: 'ほめ言葉は結局 Chris 自身へのもの。気づかずお礼を言い、me too と合わせるずれが笑い。',
      trap: 'me too を前の terrible に結びつけやすい。返事は直前の一文への返し。',
      use: 'Thanks, I guess?（ありがとう…でいいのかな？）' },
  ]
};
