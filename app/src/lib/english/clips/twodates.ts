// REVIEW 2026-11-16: pass 2, fix 19, drop 1, new 0; ear checks 12
// REVIEW Q: i3 assumes Patrick is still there at 82 s (“congratulations… all the cash”) though someone tells him “Bye-bye” at 45 s; if he left, its Patrick choice can't be refuted, so drop i3.
// “Rachel Gets Set Up with Two Guys | Friends” (the official Friends channel, Best of Season 6): two friends each push
// a date on Rachel (rich Patrick, soft-haired Eldon) while she's talking with someone else, until she's had enough.
// Segments from the captions, words from whisper (2026-11-16). Speakers are named only where the audio names them.
// EAR CHECK: 13.4 s r1 — captions “But B, I'm kind of…”, whisper “But, Thieves” (probably “Pheebs”); the keyed words “I'm just sort of in the middle of something” agree
// EAR CHECK: 22.5 s i1 — captions “they just sit down”, whisper “You better sit down”; both have “We're winning”, which carries the key
// EAR CHECK: 21.8 s t1 — “Maybe I should go” overlaps “You can't do that”; confirm it's the man Rachel was talking with, both times (27.1 s), and that he sounds uneasy
// EAR CHECK: 31.2 s s2 — “you haven't touched”: the n't (both agree on haven't)
// EAR CHECK: 35.4 s r2 — “Oh, I'm good” is Rachel, and a polite no (tone)
// EAR CHECK: 42.7 s i2 — the speaker of “This isn't really worth the free massage” (assumed Patrick, talking to Phoebe)
// EAR CHECK: 53.2 s s1 — “Don't dance for me”: the t of don't is dropped; confirm the n is heard
// EAR CHECK: 63.3 s h1 — someone other than Rachel answers “I'm a little embarrassed” (one of the men; captions don't say who), sincerely, not mocking her
// EAR CHECK: 71.8 s t2 — “Thank you very much, but…” is annoyed, not grateful (key rests on tone)
// EAR CHECK: 78.4 s i3 — “the one guy that I actually liked” is the man from the start, and both dates are still there at 82–89 s (“congratulations… all the cash”, “very soft hair”); whisper and captions both have the odd “son” at 83.1 s (likely “on”)
// EAR CHECK: 92.0 s x1 — “all by myself”: linked, and “by my” runs together
// EAR CHECK: 98.5 s h2 d4 — after Rachel's “Goodbye”, a friend asks Eldon about conditioner (speaker assumed, not keyed)
import type { Clip } from '../types.ts';

export const twodates: Clip = {
  id: 'twodates', video: 'xb9S6MT2ea4', title: 'Rachel Gets Set Up with Two Guys', dur: 115, wpm: 161, band: 'slow',
  tags: ['友だち', '恋愛'],
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: blind pass 85 % (the title gives "set up", and both distractors were off the scene); now a choosing
    //   reading and a men-compete reading. Its key and notes give away i1's and d1's keys: reveals winning, rich.
    // why: helping her choose ← two men are presented to her; men compete ← two men are pushed at her
    { id: 'g1', skill: 'gist', level: 'B2', point: 'contest', reveals: ['winning', 'rich'], seg: [0, 66],
      stem: 'What is happening for most of this scene?',
      choices: ['Two friends compete to find Rachel a date', 'Two friends help Rachel choose between two men',
                'Two men compete to win Rachel over'], a: 0,
      cue: 'だれがだれを、どんな言葉で売り込んでいるか。',
      said: '友だち二人がそれぞれ男性を連れてきて、お金持ちだ、髪が柔らかい、と競って売り込む。',
      mean: '男性同士ではなく、紹介する友だち同士の勝負になっている。',
      trap: '男性が二人いるので「取り合い」と思いやすいが、売り込んでいるのは友だちのほう。',
      use: 'Can you set me up with someone?（だれか紹介してくれない？）' },

    // R fix: blind pass 55 %; the key was the only "polite" (nuanced) choice (K6). "Stuck on a problem" → a promise
    //   reading of the softener.
    // why: invite ← "have a seat" follows right after; done in a minute ← "just" heard as "only a moment"
    { id: 'r1', skill: 'pragma', level: 'B2', point: 'middle', seg: [12.6, 16.9],
      stem: 'What is Rachel doing when she says “I’m just sort of…”?',
      choices: ['Hinting that now is a bad time', 'Politely inviting them to sit down',
                'Saying she’ll be done in a minute'], a: 0,
      cue: '「But」で始まる文。何の途中だと言うか。',
      line: 'But… I’m just sort of *in the middle of something*.',
      said: '男性を紹介されたレイチェルが、「ちょっと今、取り込み中で」と返す。',
      mean: 'はっきり断らずに「今は困る」と伝える決まった言い方。sort of で柔らかくしている。',
      trap: 'just を「すぐ終わる」と取りやすいが、時間の話はない。but のあとは断りの合図。',
      use: 'Sorry, I’m in the middle of something.（ごめん、今ちょっと手が離せなくて）' },

    // R fix: blind pass 80 % ("Rachel has said yes" contradicted the scene); now a date-going-well reading. Level
    //   C1 → B2 (a common metaphor across two adjacent lines).
    // why: a game on TV ← "winning" read literally; date going well ← winning = success
    { id: 'i1', skill: 'infer', level: 'B2', point: 'winning', seg: [17, 26.3],
      stem: 'What does “We’re winning” tell us about the friends?',
      choices: ['They’re competing against each other', 'Their team is ahead in a game on TV',
                'Rachel’s date is going really well'], a: 0,
      cue: '「sit down」のあとの短い一言。',
      line: '… sit down. *We’re winning*.',
      said: '連れてきた男性に「座って、こっちが勝ってる」と言う。',
      mean: 'デートの紹介をもう一人の友だちとの勝負として見ている、と分かる。',
      trap: 'winning から試合を思い浮かべやすいが、試合の話は出ていない。だれと比べて「勝ち」なのかを考える。',
      use: 'It’s not a competition.（勝ち負けじゃないよ）' },

    // R fix: blind pass 75 %: the key was the only nuanced choice; now all three are a feeling plus a reading. Its
    //   stem names the man who wanted to go, which points at i3's key: reveals oneguy.
    // why: annoyed ← "you can't do that" overlaps, so the tension sounds like anger; relieved ← leaving read as wanting out
    { id: 't1', skill: 'attitude', level: 'B2', point: 'go', reveals: ['oneguy'], seg: [20.4, 29.9],
      stem: 'How does the man who says “Maybe I should go” feel?',
      choices: ['Awkward, like he’s in the way', 'Annoyed, and about to storm off', 'Relieved to have a reason to leave'], a: 0,
      cue: '同じ言葉を2回言う。声の調子と言い方。',
      line: 'Okay, you know what? *Maybe I should go*. — No, no, no. Have a seat.',
      said: '友だちが割り込む中、彼は2回「帰ったほうがいいかな」と言い、引き止められる。',
      mean: 'maybe I should ＝ 遠慮がちな申し出。居づらさを感じている。',
      trap: '場が荒れているので「怒り」と取りやすい。maybe で始まる言い方は控えめな気持ち。',
      use: 'Maybe I should come back later.（また後で来たほうがいいかな）' },

    // R fix: "had" can't follow as said to Rachel now (a filler); "hadn't" keeps the n, so the v/d decides
    // why: have ← the n't is swallowed before "touched"; hadn't ← v/d near the end, both with the n
    { id: 's2', skill: 'sound', level: 'B2', point: 'havent', seg: [29.6, 33.2],
      stem: 'Fill the gap: “Rachel, you ___ touched Eldon’s hair.”',
      choices: ['have', 'haven’t', 'hadn’t'], a: 1,
      cue: '「you」のすぐあと、短い一語の最後の音。', line: 'Rachel, you *haven’t* touched Eldon’s hair.',
      said: '「まだエルドンの髪を触ってないじゃない」と、触るようすすめている。',
      mean: 'haven’t の t はほぼ消え、「ハヴン」と聞こえる。ン の音が否定の印。',
      trap: 't が消えるので have と聞こえやすい。最後の「ン」と、その前の v の音を聞く。',
      use: 'You haven’t tried the soup yet.（まだスープ飲んでないでしょ）' },

    // R fix: blind pass 90 % ("I feel fine now" a filler); now three quoted replies of one shape
    // why: a yes ← good = OK, and Japanese 大丈夫 can mean yes; likes it ← "good" read as about the hair
    { id: 'r2', skill: 'pragma', level: 'B2', point: 'good', reveals: ['havent'], seg: [29.6, 36.1],
      stem: 'When she’s urged to touch the hair, what does “Oh, I’m good” mean?',
      choices: ['“No, thanks, I’ll pass.”', '“Sure, that’s fine with me.”', '“It feels good, I like it.”'], a: 0,
      cue: '触ってとすすめられた直後の短い返事。',
      line: 'It’s the softest hair. Touch it. — *Oh, I’m good*.',
      said: '「すごく柔らかいから触って」とすすめられ、「あ、大丈夫」と返す。',
      mean: 'すすめられたときの I’m good は「結構です」。軽く、角を立てずに断る言い方。',
      trap: '日本語の「大丈夫」と同じで、はいにも聞こえやすい。すすめの直後なら断りと考える。',
      use: 'More coffee? — I’m good, thanks.（コーヒーもっと？―大丈夫、ありがとう）' },

    // why: dance ← said for Eldon later; soft hair ← said for Eldon just before
    { id: 'd1', skill: 'detail', level: 'B1', point: 'rich', seg: [35.8, 42.6],
      stem: 'What is said to sell Patrick to Rachel?',
      choices: ['He’s really rich', 'He can dance', 'His hair is soft'], a: 0,
      cue: '「Patrick is」のあとの一語。', line: 'Rachel, Patrick is *really rich*.',
      said: '「パトリックはすごくお金持ちなの」と言い、彼にお金を渡すよう言う。',
      mean: '相手を売り込む理由として、お金をそのまま挙げているのが笑いどころ。',
      trap: '髪とダンスはもう一人の男性の話。名前のすぐあとを聞き、だれの話かを区別する。',
      use: 'He’s really nice, and he cooks.（すごくいい人で、料理もするの）' },

    // R fix: blind pass 65 %: "money back" clashed with "free"; now a gave-a-massage reading of "the free massage"
    // why: from Rachel ← "massage" in the wrong relation; gave Phoebe one ← "free massage" with the giver reversed
    { id: 'i2', skill: 'infer', level: 'C1', point: 'massage', seg: [42.2, 46.4],
      stem: 'What does “This isn’t really worth the free massage” suggest?',
      choices: ['He was offered a massage to come', 'He hoped to get a massage from Rachel',
                'He gave Phoebe a free massage first'], a: 0,
      cue: '「Phoebe」と呼びかけたあとの文。何と比べているか。',
      line: 'You know what, Phoebe? This *isn’t really worth the free massage*.',
      said: '「フィービー、これじゃタダのマッサージに見合わない」と言う。',
      mean: 'マッサージ無料を条件に来たと分かる。それでも割に合わないほど気まずい。',
      trap: 'だれがだれにマッサージするのか混ざりやすい。worth が何と何を比べているかを考える。',
      use: 'It’s not worth the trouble.（そこまでする価値はないよ）' },

    // R fix: each half of the key was in a distractor, so the majority choice gave it away (K6), and "richer" implied
    //   d1's key. Now no choice shares a half with the key.
    // why: creative ← near sound of "cooperative"; sing ← "dance" heard as a talent; money ← "rich"/"money" said just before
    { id: 'd2', skill: 'detail', level: 'B2', point: 'eldon', seg: [46.8, 52.6],
      stem: 'What makes Eldon better than Patrick, according to his friend?',
      choices: ['He’s more cooperative, and he can dance', 'He’s more creative, and he can sing',
                'He’s better-looking, and he has money'], a: 0,
      cue: '「Eldon is much more」のあと、二つの点。',
      line: 'Eldon is much more *cooperative*, and he *can dance*.',
      said: '「エルドンのほうがずっと協力的で、踊れるよ」と売り込む。',
      mean: 'cooperative ＝ 言うことを聞いてくれる。帰りたがる相手と比べている。',
      trap: 'cooperative は creative と音が近い。more のあとの一語を聞く。',
      use: 'This one is much more comfortable.（こっちのほうがずっと楽だよ）' },

    // R fix: its stem and line ("___ dance for me") show d2's "dance", now only in d2's key: reveals eldon
    // why: Do ← the t of don't drops and "Don" sounds like "Do"; Won't you ← a polite-request frame
    { id: 's1', skill: 'sound', level: 'B2', point: 'dont', reveals: ['eldon'], seg: [52.3, 55.35],
      stem: 'Fill the gap: “___ dance for me, please.”',
      choices: ['Do', 'Don’t', 'Won’t you'], a: 1,
      cue: '文の最初、短い一語の終わりの音。', line: 'No, no, no. *Don’t* dance for me, please.',
      said: '「いい、いい、私のために踊らないで」と止めている。',
      mean: 'don’t の t はほぼ消え、「ドン」と聞こえる。直前の no, no, no も手がかり。',
      trap: 't が消えると Do に聞こえ、意味が逆になる。「ン」が残るか、前後の no を聞く。',
      use: 'Please don’t wait for me.（私のことは待たなくていいよ）' },

    // R fix: blind pass 75 %: the key was the longest and the only nuanced choice; now three of one kind, with a
    //   mocking reading (tone; on the EAR CHECK)
    // why: confesses ← "embarrassed" read as shy about feelings; mocking ← the reply heard as a jab at her
    { id: 'h1', skill: 'humor', level: 'C1', point: 'embarrassed', seg: [58.5, 67.2],
      stem: 'Why does the reply to “Am I the only one…?” get a laugh?',
      choices: ['He answers a question she didn’t want answered', 'He confesses he likes Rachel, at a bad time',
                'He makes fun of her for being embarrassed'], a: 0,
      cue: '彼女の質問のあと、だれが何と答えるか。',
      line: 'Am I the only one that this is embarrassing for? — *I’m a little embarrassed*.',
      said: '「恥ずかしいのは私だけ？」と言うと、男性の一人が「僕も少し」と答える。',
      mean: '答えを求めない問いに、真面目に答えてしまうずれが笑いになる。',
      trap: 'embarrassed を「照れ・好意」と取りやすい。質問が本当の質問かどうかを考える。',
      use: 'Am I the only one who’s hungry?（お腹すいてるの私だけ？）' },

    // R fix: blind pass 80 %; "go to the ball with one" leaked d3's key. Now a give-one-a-chance reading.
    // why: picks soft hair ← "you do have very soft hair" sounds like a choice; a chance ← "thank you very much" heard as a soft yes
    { id: 'g2', skill: 'gist', level: 'B1', point: 'outcome', reveals: ['rather', 'needdate'], seg: [66.9, 98.3],
      stem: 'How does Rachel’s long speech end?',
      choices: ['She refuses both men and walks out', 'She ends up choosing the man with soft hair',
                'She agrees to give one of them a chance'], a: 0,
      cue: '最後の文と、最後の一言。',
      said: '友だちを責め、男性二人にも一言ずつ言ってから、「ひとりで行く」と言って去る。',
      mean: 'どちらも選ばず、紹介そのものを断って話を終えている。',
      trap: 'soft hair をほめるので「選んだ」と思いやすいが、but のあとで断っている。',
      use: 'Thanks, but I’ll pass.（ありがとう、でも遠慮しとく）' },

    // R fix: blind pass 75 %: the yes/no frame left the key as the only "No"; now three tones, each with its reading
    // why: grateful ← "thank you very much" taken at face value; playful ← the over-polite thanks heard as teasing
    { id: 't2', skill: 'attitude', level: 'C1', point: 'needdate', seg: [69.4, 74.15],
      stem: 'What is Rachel’s tone in “Thank you very much, but…”?',
      choices: ['Fed up; the thanks leads into a firm no', 'Grateful; she thanks them, then says no gently',
                'Playful; she’s teasing them a little'], a: 0,
      cue: '直前の「ridiculous」と、but のあと。',
      line: 'Come on, this is ridiculous. *Thank you very much, but* I do not need you to give me a date.',
      said: '「ばかばかしい。どうもありがとう、でもデートの世話は要らない」と言う。',
      mean: 'いら立った前置き。do not と区切って強く断っている。',
      trap: 'thank you ＝ 感謝と取りやすい。直前の怒りと、but のあとの強い否定で判断する。',
      use: 'Thanks, but I can handle it myself.（ありがとう、でも自分でできるから）' },

    // R drop: r3 (pragma, "I am still talking"): V3. The words say literally what they do, so there's no pragmatic step
    //   to test (blind 95 %, and the stem's "cut off" gave the rest). Never shipped, so deleted; pragma still has r1, r2.

    // R fix: blind pass 85 %: the key was the only one about leaving in plain words, and "to bring him back" made the
    //   literal reading odd; evened the three out
    // why: ran after him ← literal chase = 追いかける; kept him away ← "away" read as "kept from coming"
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'chase', seg: [76.4, 80.1],
      stem: 'What does Rachel mean by “you chase away the one guy…”?',
      choices: ['They made him want to leave', 'They ran after him to catch him',
                'They kept him from coming over'], a: 0,
      cue: '「chase」のすぐあとの短い語。',
      line: 'And then you *chase away* the one guy that I actually liked.',
      said: '「私が本当にいいなと思ってた人を追い払った」と責める。',
      mean: 'chase away ＝ 追い払う。away が付くと「追いかける」とは逆の向きになる。',
      trap: 'chase ＝ 追いかける、と取りやすい。動詞のあとの away や off で意味が変わる。',
      use: 'The noise chased everyone away.（うるさくてみんな帰っちゃった）' },

    // R fix: blind pass 65 % (with t1's stem, "talking with first" stood out); the distractors now name the two dates.
    //   Its Patrick choice gives away d1's key: reveals rich.
    // why: Patrick ← he said "this isn't worth…", so he seems the one who left; Eldon ← he's praised in the same speech
    { id: 'i3', skill: 'infer', level: 'C1', point: 'oneguy', reveals: ['rich'], seg: [76.4, 89.7],
      stem: 'Who is “the one guy that I actually liked”?',
      choices: ['The man who was with her at the start', 'Patrick, the rich man she just met',
                'Eldon, the man with the soft hair'], a: 0,
      cue: 'そのあと、残っている二人にそれぞれ何と言うか。',
      line: 'you chase away the one guy that I actually liked. … congratulations… all the cash … you do have very soft hair',
      said: '「好きだった人を追い払った」と言ったあと、お金持ちと髪の人に一言ずつかける。',
      mean: '二人はまだその場にいるので、去った「その人」は最初に話していた男性だと分かる。',
      trap: '途中で帰りたがった人を思い浮かべやすいが、そのあと本人に声をかけている。',
      use: 'He’s the only one I really liked.（本当に気に入ったのは彼だけ）' },

    // R fix: blind pass 75 %: the stem quoted "no offense", which answers it (S2), and "takes back" was close to
    //   defensible (K1). The stem now points at the line before; a keep-complaining reading replaces it.
    // why: explains a word ← literal "mean" = 意味する; another complaint ← she has been complaining up to here
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', seg: [79.8, 86.1],
      stem: 'What does “I mean” do right after “…that I actually liked”?',
      choices: ['It softens what she just said', 'It explains a word she just used',
                'It brings in another complaint'], a: 0,
      cue: '「I mean」のあとに続く言葉の種類。',
      line: '*I mean*, no offense to you guys, really.',
      said: '友だちを責めたあと、男性二人に「悪気はないのよ」と付け足す。',
      mean: 'この I mean は、言いすぎを和らげたり補ったりする前置き。',
      trap: 'mean ＝ 意味、と取りやすい。I mean のあとに no offense が続けば、責めを和らげる合図。',
      use: 'I mean, no offense, but it’s too loud.（悪気はないけど、うるさすぎるかな）' },

    // why: the bar ← /l/ heard as an r-colored vowel; the mall ← b/m both lip sounds before "-all"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'ball', reveals: ['byself'], seg: [87.55, 95.2],
      stem: 'Where does Rachel say she would go by herself?',
      choices: ['To the ball', 'To the bar', 'To the mall'], a: 0,
      cue: '「go to the」のあとの一語。', line: 'I would much rather go to *the ball* all by myself',
      said: '「むしろパーティーにひとりで行くほうがいい」と言う。',
      mean: 'ball ＝ 正式なダンスパーティー。デートの相手を探していた理由がここで分かる。',
      trap: 'ball の l は日本語にない音で、bar や mall に聞こえやすい。語の終わりの舌の位置に注意。',
      use: 'Are you going to the party alone?（パーティーはひとりで行くの？）' },

    // R fix: the key wasn't parallel with the two "She will…" choices (K5); now three sentences about her, with a
    //   swapped rather-than reading
    // why: only if they stop ← "than" read as a condition; rather skip ← rather A than B with A and B swapped
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'rather', reveals: ['ball', 'byself'], seg: [87.55, 95.2],
      stem: 'What does Rachel say with “I would much rather… than…”?',
      choices: ['She prefers going alone to more of this', 'She’ll go alone only if they stop this',
                'She’d rather skip the ball than go alone'], a: 0,
      cue: '「rather」と「than」の二つを比べる。',
      line: 'I would *much rather* go to the ball all by myself *than* go through any more of this.',
      said: '「これ以上こんな目にあうより、ひとりで行くほうがいい」と言う。',
      mean: 'rather A than B ＝ B より A がいい。go through ＝ つらいことを経験する。',
      trap: 'than を条件と取ると「やめてくれたら」と読みやすい。二つを比べる形。',
      use: 'I’d rather walk than wait for the bus.（バスを待つより歩きたい）' },

    // R fix: its stem ("go to the ball ___") gives away d3's key: added ball to reveals
    { id: 'x1', skill: 'dict', level: 'B1', point: 'byself', reveals: ['ball'], seg: [91.1, 93.43],
      stem: 'Type what Rachel says: “go to the ball ___.” (3 words)', answer: 'all by myself',
      cue: '「ball」のあと、ひとかたまりの短い語。', line: 'go to the ball *all by myself*',
      said: '「ひとりきりで」。all by がつながっている。',
      mean: 'だれも連れずに、たったひとりで。all で強めている。',
      trap: 'ball のすぐあとの all が前の語に飲まれて聞こえにくい。all を落とさないこと。',
      use: 'I traveled all by myself.（ひとりきりで旅行したよ）' },

    // R fix: blind pass 70 %: the key was the longest and the only one about hair; now three readings of the moment.
    //   Its stem says she has gone: reveals outcome.
    // why: follow her out ← "Goodbye" then "Now…"; Eldon should go ← a question heard as a hint to leave
    { id: 'h2', skill: 'humor', level: 'C1', point: 'after', reveals: ['conditioner', 'outcome'], seg: [94.4, 103.8],
      stem: 'Why is the question right after Rachel’s “Goodbye” funny?',
      choices: ['They act as if her speech never happened', 'They’re quietly planning to follow her out',
                'They’re hinting that Eldon should go too'], a: 0,
      cue: '彼女が去った直後、話題が何に戻るか。',
      line: '— Goodbye. — Now, do you use some sort of special *conditioner* on that hair?',
      said: 'レイチェルが去ると、すぐにエルドンの髪の手入れについて質問する。',
      mean: '真剣な訴えが全く届いていないことが、このすぐの質問で分かり、笑いになる。',
      trap: 'Goodbye のあとの Now を「さあ追いかけよう」と取りやすい。続く話題の中身を聞く。',
      use: 'Anyway, where were we?（で、何の話だっけ？）' },

    // R fix: blind pass 65 % (hair is the clip's running topic, and only the key had it); now two hair choices, so
    //   "conditioner" decides. Its stem says she has left: reveals outcome.
    // why: haircut ← "hair" caught, the rest missed; dance ← Eldon's other selling point
    { id: 'd4', skill: 'detail', level: 'B1', point: 'conditioner', reveals: ['outcome'], seg: [97.9, 102.3],
      stem: 'After Rachel leaves, what is Eldon asked about?',
      choices: ['What he uses on his hair', 'Where he gets his hair cut', 'Whether he’ll dance now'], a: 0,
      cue: '「special」のあとの語と、最後の語。',
      line: 'do you use some sort of special *conditioner* on that *hair*?',
      said: '「その髪に何か特別なコンディショナーを使ってる？」と聞かれる。',
      mean: 'conditioner ＝ 髪のリンス。直前の話と関係ない質問なのがおかしい。',
      trap: 'hair だけ聞くと、髪の話ならどれも選びやすい。special のあとの一語まで聞く。',
      use: 'What shampoo do you use?（どのシャンプー使ってる？）' },
  ]
};
