// “Ron Swanson's Birthday Surprise | Parks and Recreation” (the official Parks and Recreation channel, Season 3): Ron
// dreads a big party, so he grills his coworkers (party-bus and circus-tent questions, a story of last year's
// surprise, Andy sworn to secrecy); the “meeting” turns out to be Leslie's gift of a quiet room, two films, a guard
// at the door and a cab home, and she thanks him for the advice that kept her in Pawnee.
// Segments from the captions, words from whisper (2026-11-16). Untested: 12 s (whisper “Um, that was rude”, not in
// the captions), 40–53 s (the balloons: visual, and captions “a sixth child” vs whisper “a sick child”), 81 s (whisper
// “Senor Vegas”, captions “your Vegas”), 87 s (whisper's “Damn it”, not in the captions), 108–116 s (the shirtless
// exchange: unclear who says what), 203–206 s (captions “she do them all”, whisper “Did she do 'em all?”), 210 s (the
// film titles: world knowledge). The coworker Ron questions at 53–107 s isn't named in the audio: stems say “the
// coworker”.
// REVIEW 2026-11-16: pass 4, fix 19, drop 1, new 0; ear checks 0
// REVIEW open: p2 is now C1 (its purpose, hunting for Leslie's methods, is never said); that keeps C1 at 24 % after
//   a1's drop. If you'd rather keep p2 at B2, the bank needs a new C1 item.
import type { Clip } from '../types.ts';

export const ronBirthday: Clip = {
  id: 'ronbirthday', video: 'apg09bolUIc', title: 'Ron Swanson’s Birthday Surprise', dur: 280, wpm: 162, band: 'mid',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: 4 dozen ← "about" runs into "forty", and the -ty is weak; 14 ← forty/fourteen near sound
    { id: 'n1', skill: 'number', level: 'B1', point: 'dozen', seg: [4.0, 8.95], keep: true,
      stem: 'How many inflatable saxophones does the caller say she needs?',
      choices: ['About 4 dozen', 'About 14 dozen', 'About 40 dozen'], a: 2,
      cue: '「I’m gonna need about」のあと、dozen の前。',
      line: 'I’m gonna need *about 40 dozen* of those.',
      said: '電話で「空気で膨らむサックス、40ダースくらい要るんだけど」と言う。',
      mean: '40 dozen ＝ 480個。ありえない量で、パーティーの準備に聞こえる。',
      trap: 'forty と fourteen は似ている。-ty は前を強く、-teen は後ろを長く。',
      use: 'I’ll need about two dozen eggs.（卵が2ダースくらい要る）' },

    // why: personal calls ← the usual office rule (no personal calls) heard instead of what she says; work call ←
    //   "work-related call" is said, so it sounds like a confession
    { id: 'h1', skill: 'humor', level: 'C1', point: 'workcall', seg: [14.3, 22.6],
      stem: 'What makes April’s excuse to Ron funny?',
      choices: ['She’s proud she never makes work calls', 'She promises to stop making personal calls',
                'She admits the call was really for work'], a: 0,
      cue: '「It was personal」のあと、続く一文の最後。',
      line: 'It was personal. *I would never make a work-related call*, you know that.',
      said: '注意されて「私用の電話です。仕事の電話なんて絶対しません」と答える。',
      mean: 'ふつうは「私用電話はしない」と言う場面。逆を胸を張って言うのが笑い。',
      trap: '職場の決まり文句を予想すると、逆の意味に聞こえる。never のあとの語を最後まで聞く。',
      use: 'Sorry, that was a personal call.（すみません、私用の電話でした）' },

    // R fix: V2 — blind 75 %: the title plus a coworker's party nobody mentions; both distractors now come from the
    //   segment (the phone call; the birthday questions read as wanting a fuss). A second blind read still got it at
    //   70 %, so that choice became the "who told" one
    // why: who told ← Ron guards his birthday, so the questions sound like a hunt for a leak (but he asks "what is going
    //   on" and "what Leslie is planning"); staff calls ← the scene opens on a phone call and "stop it immediately"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'digging', seg: [14.3, 69.6],
      stem: 'Through the first half, what is Ron trying to do?',
      choices: ['Learn what is planned for his birthday', 'Learn who told everyone about his birthday',
                'Stop his staff making personal calls'], a: 0,
      cue: '部屋に呼んだ同僚への質問と、最後に名前の出る人。',
      said: '電話やパーティーの話を耳にした Ron が、同僚を呼んで「誕生日に何がある？」と問う。',
      mean: '止めるより先に、Leslie が何を計画しているかを聞き出したい。',
      trap: '電話の場面から職場の電話、誕生日の話から犯人探しに見えやすい。質問の中身で決める。',
      use: 'Just tell me what’s going on.（何が起きてるのか教えて）' },

    // R fix: V2 — blind 55 %: the odd, specific key stood out next to two plain fillers; a near miss on "street"
    // why: few cars ← "twenty cars" is the question just before; narrow street ← "street" and "bus" both said, but
    //   "not even on a street"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'street', seg: [25.3, 36.55],
      stem: 'What does Ron say about his house?',
      choices: ['It isn’t even on a street at all', 'It’s on a street too narrow for buses', 'It only has space for a few cars'], a: 0,
      cue: '最初の否定の文のあと、もう一文。',
      line: 'There is no street parking at my house. My house is *not even on a street*.',
      said: '車20台や二階建てバスのことを聞かれ、「家は通りにすら面していない」と答える。',
      mean: 'not even ＝ 〜ですらない。駐車どころか、道路もない、と話を打ち切る。',
      trap: '直前の twenty cars が耳に残りやすい。not even のあとが答え。',
      use: 'It’s not even on the map.（地図にすら載っていない）' },

    // R fix: V2 — blind 75 %: the apology was a filler; now a time-pressure reading of "only… once"
    // why: last time ← "only… once" taken as a promise not to ask again; in a hurry ← "only once" heard as having no
    //   time to spare
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'once', seg: [53.1, 61.05],
      stem: 'What is Ron doing when he says how many times he’ll ask?',
      choices: ['Warning him to answer straight, right now', 'Promising this is the last time he’ll ask',
                'Saying he’s in a hurry and can’t stay long'], a: 0,
      cue: '「Don’t care.」のあとの一文と、続く質問。',
      line: 'Don’t care. *I’m only gonna ask you this once.* What is going on with my birthday?',
      said: '「上司じゃない」に「知るか。一度しか聞かない。誕生日に何がある？」と返す。',
      mean: '一度しか聞かない ＝ 二度目はない、正直に答えろ、という警告。',
      trap: 'only once を「もう聞かない」「急いでいる」と取りやすい。Don’t care の後なら脅し。',
      use: 'I’m only going to say this once.（一度しか言わないよ）' },

    // R drop: a1 (attitude C1, "fakes surprise to dodge the question") — K1/V1: the words fit a real surprise too
    //   ("Oh my God, Ron, it's your birthday… I haven't heard anything"); only the tone could settle it. Never shipped:
    //   deleted. Level share kept by retagging p2 B2 → C1
    // R fix: V2 — blind 65 %: the why-question was off topic; it now asks why he won't talk. V5: B2 → C1, since the
    //   purpose (hunting for Leslie's methods) is never said (and the bank fell to 19 % C1 after a1's drop)
    // why: why-question ← "Why don't you…" heard as asking for a reason; small talk ← a friendly topic after a fight
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'whydont', seg: [69.3, 75.15],
      stem: 'When the coworker says he hasn’t heard anything, what does Ron do next?',
      choices: ['Gets him to tell a story that may hold clues', 'Asks him why he won’t say what he knows',
                'Switches to friendlier small talk for a bit'], a: 0,
      cue: '「I haven’t heard anything」のあと、Why で始まる文。',
      line: '*Why don’t you tell me* what she did for *your last birthday*?',
      said: '「何も聞いてない」と言われ、「じゃあ前の誕生日に彼女が何をしたか話せ」と言う。',
      mean: 'Why don’t you 〜? は「〜してくれ」。前の例から手口を探る。',
      trap: 'Why don’t you のあとに動詞が来たら、理由の質問でなく提案か頼み。',
      use: 'Why don’t you sit down?（座ったら？）' },

    // R fix: S3 — the cue quoted "surprised", which only the key echoed (tested cue leak)
    // why: police ← "kidnapped" taken literally; sick day ← "from work" heard as getting him out of work by an excuse
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'kidnap', seg: [75.0, 80.25],
      stem: 'What does the coworker mean about how Leslie started his party?',
      choices: ['She grabbed him from work as a surprise', 'She had him taken in by the police at work',
                'She called him in sick so he could leave'], a: 0,
      cue: '「She totally」の文の次、She のあとの動詞。',
      line: 'She totally surprised me. She *kidnapped me from work*',
      said: '「完全に驚かされた。職場から連れ去られた」と話す。',
      mean: 'kidnap ＝ ここでは冗談で、サプライズのために強引に連れ出すこと。',
      trap: 'kidnap を文字どおり「誘拐」と取ると事件に聞こえる。surprised のあとなら遊び。',
      use: 'We kidnapped her for a birthday lunch.（誕生日ランチに彼女を連れ出した）' },

    // R fix: K6/V2 — "always" was an absolute only in a distractor, and the key was the only hedged choice; now
    //   three parallel predictions
    // why: a week after ← before/after swap; a week's warning ← "a week before my birthday" heard as when he was told
    //   (but "I had no idea it was coming")
    { id: 'i2', skill: 'infer', level: 'C1', point: 'early', seg: [97.0, 102.75],
      stem: 'What does this part of the story suggest about Ron’s party?',
      choices: ['It could come well before his birthday', 'It might come a week after his birthday',
                'He’ll get a week’s warning before it'], a: 0,
      cue: '「a week」のあとの前置詞と、genius の理由。',
      line: 'she did it like *a week before my birthday*, which is genius ’cause *I had no idea it was coming*.',
      said: '「誕生日の1週間前にやったのが天才的。来るなんて思ってなかった」と話す。',
      mean: '当日だけ用心しても無駄。Ron には、いつ来てもおかしくないという警告。',
      trap: 'a week が耳に残りやすい。before と no idea から「不意打ち」。',
      use: 'I had no idea it was coming.（来るなんて全然思ってなかった）' },

    // R fix: V2/K5 — blind 65 %: the key was the only two-part, hedged choice; three parallel "From…" sources now
    //   (knowing the idiom stays the construct)
    // why: a bird ← "birdie" taken literally; a calendar ← a plain "I saw it somewhere" source
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'birdie', seg: [115.8, 121.65],
      stem: 'How does Andy say he heard about Ron’s birthday?',
      choices: ['From someone he would rather not name', 'From the date on the office calendar',
                'From a small bird he heard outside'], a: 0,
      cue: '「So, a little」のあとの二語。',
      line: 'So, *a little birdie told me* it’s your birthday coming up.',
      said: '「小鳥さんから聞いたけど、誕生日が近いんだって？」と声をかける。',
      mean: 'a little birdie told me ＝ ある人から聞いた（誰かは言わない）。',
      trap: 'birdie を本物の鳥と取ると意味が通らない。情報元をぼかす決まり文句。',
      use: 'A little birdie told me you got engaged.（風のうわさで婚約したって聞いたよ）' },

    // R fix: V2 — blind 70 %: "give up and leave Ron alone" was a filler; the new near miss narrows the secret to the
    //   birdie, refuted by Ron's question (now in the segment: it starts at 121.2 s). B1: that choice reveals `birdie`
    // why: no gift ← "getting anything" heard as a present; the birdie ← the birdie is the last thing named, but Ron
    //   asks what is going to happen
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'outof', reveals: ['birdie'], seg: [121.2, 128.1],
      stem: 'What does Andy mean when he answers Ron’s question?',
      choices: ['He won’t give away the plan', 'He won’t say who the birdie was', 'He won’t give Ron a birthday gift'],
      a: 0,
      cue: 'Ron の質問の中身と、Nice try のあと。',
      line: '*Nice try*, Ron. You’re *not getting anything out of me*.',
      said: '計画を探られ、「うまいね。何も聞き出せないよ」と言う。',
      mean: 'Nice try ＝ その手には乗らない。get anything out of me ＝ 聞き出す。',
      trap: 'getting anything を「何ももらえない」と取ると、贈り物の話になる。',
      use: 'Nice try, but I’m not telling.（うまいね、でも言わないよ）' },

    // R fix: K5/V2 — blind 85 %: "getting anything out for me" isn't English, so grammar cut it; "off" is a real
    //   (colloquial) option
    // why: off ← "out of" with the t flapped and "of" lost sounds like one short syllable; off of ← "out" loses its t
    { id: 's2', skill: 'sound', level: 'B2', point: 'outof', seg: [125.0, 128.1],
      stem: 'Fill the gap: “You’re not getting anything ___ me.”',
      choices: ['out of', 'off', 'off of'], a: 0,
      cue: '「anything」のあと、me の前の二語。',
      line: 'Nice try, Ron. You’re not getting anything *out of* me.',
      said: '「うまいね、Ron。何も聞き出せないよ」と言う。',
      mean: 'out of の t は弾み、of は弱く「アウラ」とつながる。get 〜 out of 人 ＝ 聞き出す。',
      trap: 'of が「ア」だけになり、別の前置詞に聞こえやすい。',
      use: 'Good luck getting a word out of him.（彼から何か聞き出すのは無理だよ）' },

    // R fix: K1 — "he keeps hinting that Ron is getting old" is defensible (every fix still names an older man);
    //   replaced by two readings the words refute
    // why: adopt ← "I love you like a father" taken as a wish; his own jobs ← "camp counselor… lacrosse coach" heard
    //   as jobs he wants (but "you're my…")
    { id: 'h3', skill: 'humor', level: 'C1', point: 'father', seg: [129.5, 144.5],
      stem: 'Why is Andy’s speech about how he loves Ron funny?',
      choices: ['Each fix to make Ron younger sounds odder', 'He’s hinting that he wants Ron to adopt him',
                'He lists jobs he would like to have someday'], a: 0,
      cue: 'father のあと、何度も言いかえる部分。',
      line: 'I love you like *a father who’s not that much older than me*. Like *a young uncle*… you’re my *lacrosse coach*.',
      said: '「父親みたいに好き。年は近いけど。若いおじさん、キャンプの先生、いや、ラクロスのコーチ」。',
      mean: '年寄り扱いしないよう直すほど、たとえが妙になる。',
      trap: 'father を養子の願い、職業名を本人の夢と取りやすい。you’re my なら Ron の話。',
      use: 'You’re like a big brother to me.（お兄さんみたいな存在だよ）' },

    // R fix: K6 — the key was the only choice with a clip word ("point", from "What's the point?")
    // why: touched ← a speech about love; confused ← "I get it" read as "I don't get it" after so many changes
    { id: 'a4', skill: 'attitude', level: 'B1', point: 'getit', seg: [142.0, 146.65],
      stem: 'How does Ron react to Andy’s speech?',
      choices: ['He wants Andy to hurry up and finish', 'He is quietly touched by the speech', 'He is confused by all the changes'],
      a: 0,
      cue: '同じ短い文を二回と、そのあとの質問。',
      line: '*I get it. I get it. What’s the point?*',
      said: '「分かった、分かった。で、要点は？」と言う。',
      mean: 'I get it を二回言うのは「もういい」。早く本題を、とせかしている。',
      trap: 'I get it は「分かった」なので混乱とは逆。二回くり返すと、いらだちのサイン。',
      use: 'Okay, I get it. What’s the point?（分かったよ。で、要点は？）' },

    // why: doesn't know ← "can't say anything" heard as "doesn't know anything"; Ron's anger ← he is being grilled
    { id: 'd3', skill: 'detail', level: 'B1', point: 'owe', seg: [146.5, 153.15],
      stem: 'Why won’t Andy tell Ron the plan?',
      choices: ['He owes Leslie too much to spoil it', 'He was never told what the plan is',
                'He’s afraid Ron will get angry at him'], a: 0,
      cue: '「swore me to secrecy」のあと、I owe her。',
      line: 'Leslie *swore me to secrecy*… *I owe her so much* I can’t ruin it for her.',
      said: '「Leslie に口止めされてる。恩があるから台なしにできない」と言う。',
      mean: 'swear 人 to secrecy ＝ 口止めする。owe ＝ 恩がある。',
      trap: 'can’t say anything を「知らない」と取りやすいが、言えないだけ。',
      use: 'I owe you one.（借りができたね）' },

    // C2: who is the joke on?
    // anchor: 148.6–151 s "Leslie swore me to secrecy, so I can't say anything" → 158.7–164.3 s "not if I see you first…
    //   'cause Leslie assigned me to the kidnap squad": the speaker gives away the plan he just swore to keep
    // R fix: V2/Q4 — blind 65 %: "sounds a bit silly" was weak, and "grabbed without warning" is refuted only by
    //   inference; now Ron as the one topped by the comeback, and Leslie as the one whose plan is out. N7: the line no
    //   longer holds x1's answer
    // why: Ron ← "not if I see you first" is a classic comeback, so Ron sounds topped (right mechanism, wrong target);
    //   Leslie ← her plan is the thing exposed
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'squad', seg: [150.0, 164.6],
      stem: 'In Andy’s goodbye to Ron, who is the joke on?',
      choices: ['Andy, who lets slip the secret he swore to keep', 'Ron, who gets topped by Andy’s quick comeback',
                'Leslie, whose secret plan is now out in the open'], a: 0,
      cue: '口止めの話と、別れぎわに付け足す理由。',
      line: 'I can’t say anything… ’cause *Leslie assigned me to the kidnap squad*.',
      said: '「口止めされてるから言えない」の直後、別れぎわに「誘拐係を任されてるから」と付け足す。',
      mean: '秘密を守ると胸を張った本人が、自分で計画をばらす。笑われているのは話し手。',
      trap: '連れ去られる Ron が的に見えやすい。誰が何を口にしたかを追うと、ばらしたのは話し手。',
      use: 'Don’t worry, my lips are sealed.（大丈夫、口は堅いから）' },

    // R fix: S4 — the start (158.35 s) fell inside "Okay" (157.95 s); it now opens on Ron's "See you later"
    { id: 'x1', skill: 'dict', level: 'B2', point: 'seeyou', seg: [156.15, 160.65],
      stem: 'Type Andy’s answer to “See you later”: “Okay, ___, Uncle Ron.” (6 words)', answer: 'not if i see you first',
      cue: '「Okay,」のあと。短い語が六つ続く。',
      line: 'Okay, *not if I see you first*, Uncle Ron.',
      said: '「またね」に「その前にこっちが見つけるよ」と返す。',
      mean: '決まった冗談の返し。if‿I がつながり「イファイ」、see‿you も一続き。',
      trap: '短い語が続くので、if や I が消えて聞こえやすい。語の数を数えて確かめる。',
      use: 'Not if I see you first!（先に見つけてやる！）' },

    // R fix: V2 — blind 60 %: "nothing at all, as he asked" rests on a wish the clip never states; now a scaled-down
    //   party (the face-saving middle) and last year's restaurant
    // why: huge party ← all the party talk and last year's story (the restaurant); small party ← "Ann said you had a
    //   big party", heard as Ron getting a smaller one
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['alone', 'messwith'], seg: [186.0, 268.0],
      stem: 'How does Leslie handle Ron’s birthday in the end?',
      choices: ['Time on his own, just the way he likes it', 'A small party with only his closest friends',
                'A big surprise party at a restaurant'], a: 0,
      cue: '会議室で用意されていたものと、来年の話。',
      said: 'パーティーの気配は作り事で、本当の贈り物は一人で静かに過ごす時間だった。',
      mean: 'Ron の好みに合わせた祝い方。大騒ぎは来年、と冗談で終わる。',
      trap: 'それまでのパーティーの話から大騒ぎを想像しやすい。最後の場面の中身で決める。',
      use: 'I planned something low-key.（控えめなのを用意したよ）' },

    // R fix: V2 — blind 65 %: "too costly" was a filler; now a once-only reading of "I did that for Ann"
    // why: best friend only ← "Why would I…" heard as a put-down (Ron isn't close enough); once only ← "I did that for
    //   Ann" heard as done and not to repeat
    { id: 'i3', skill: 'infer', level: 'C1', point: 'annparty', seg: [189.2, 198.05],
      stem: 'What does Leslie’s question about an “Ann Perkins party” tell Ron?',
      choices: ['She plans each party to fit the person', 'She saves big parties for her best friend',
                'She did one big party and won’t repeat it'], a: 0,
      cue: '「I did that for Ann」と、二人の名前を並べた質問。',
      line: 'I did that *for Ann*. *Why would I throw Ron Swanson an Ann Perkins party?*',
      said: '「大きなパーティーだったって？」に「あれは Ann のため。なぜ Ron に Ann 向けを？」と返す。',
      mean: '答えを求めない質問。相手に合わせて祝い方を変える考え方。',
      trap: 'Why would I を見下す言い方と取りやすいが、「当然しない」の意味。',
      use: 'Why would I wear that to work?（それを仕事に着てくわけないでしょ）' },

    // R fix: V4 — the key is said outright ("a list of ways to mess with you"): detail, not infer. V2 — blind 50 %:
    //   all three choices are now lists, the gift one built on April's opening order (saxophones, fedoras)
    // why: to-do list ← "list of things April was doing" heard as party prep; gifts ← the opening call orders things
    { id: 'i4', skill: 'detail', level: 'B2', point: 'messwith', seg: [197.9, 206.4],
      stem: 'What does Leslie say about April’s long list of things?',
      choices: ['It was just a list of ways to tease him', 'It was a to-do list for his real party',
                'It was a list of gifts April meant to buy'], a: 0,
      cue: '「That was just a list of」のあと。',
      line: 'That was just *a list of ways to mess with you*.',
      said: '「April のリストは？」に「あなたをからかう方法のリストよ」と答える。',
      mean: 'mess with 人 ＝ からかう。パーティーの気配は作り事。',
      trap: 'list of things から準備リストを想像しやすい。ways to のあとを聞く。',
      use: 'Relax, I’m just messing with you.（落ち着いて、からかってるだけ）' },

    // R fix: V2 — blind 55 %: the key was the only specific choice; all three are now lists that mix real pieces
    // why: films for the office ← "rented… films" heard, "no one will bother you" missed; guard drives him ← Artie and
    //   the cab run together
    { id: 'd4', skill: 'detail', level: 'B1', point: 'alone', seg: [207.6, 221.0],
      stem: 'What has Leslie set up for Ron?',
      choices: ['Two films, a guard at the door, a cab home', 'Two films and a cake for the whole office',
                'A guard to drive him home after dinner'], a: 0,
      cue: '「I have rented」のあと、ドアの外と帰り道の話。',
      line: 'I have *rented*… Artie from security is *outside the door so no one will bother you*. And *a cab*…',
      said: '「映画を2本借りた。ドアの外に警備の人がいて、誰も来ない。帰りはタクシー」と話す。',
      mean: '人を呼ぶパーティーでなく、一人で静かに過ごす時間を用意した。',
      trap: 'それまでのパーティーの話が耳に残りやすい。no one will bother you が中身。',
      use: 'No one will bother you here.（ここなら誰にも邪魔されないよ）' },

    // why: nine ← "five" with a weak f heard as a long "ai"; fifteen ← -teen added after a number
    { id: 'n2', skill: 'number', level: 'B1', point: 'fiveyears', seg: [224.6, 230.95], keep: true,
      stem: 'When did Eagleton offer Leslie a job?',
      choices: ['Five years ago', 'Nine years ago', 'Fifteen years ago'], a: 0,
      cue: '「what you said to me」のあとの数。',
      line: 'what you said to me *five years ago* when Eagleton offered me that job',
      said: '「5年前、イーグルトンに誘われて相談したとき、何て言ったか覚えてる？」と聞く。',
      mean: '昔の相談を思い出させて、本題につなげる前置き。',
      trap: 'five と nine は母音が同じ「アイ」。最初の f と n の音で聞き分ける。',
      use: 'We met five years ago.（5年前に会ったよね）' },

    // C2: what was he holding back? (the first answer against the second)
    // anchor: 231–233.3 s "Do whatever the hell you want. What do I care?" → 239.2–253.1 s "we worked well together… I
    //   respected you… you only have one hometown": pressed, he gives the reasons to stay he left out the first time
    // R fix: V2/Q4 — blind 75 %: two face-value fillers left the key as the only "deep" reading; now two near misses
    //   (scope: the town, not him; the first answer as real respect for her choice). S4: the segment now holds both
    //   answers (24.9 s)
    // why: the town's sake ← "one hometown" heard as the whole reason (scope shift); neutral ← "do whatever you want"
    //   heard as respect for her choice (遠慮), the fuller answer as polite extras
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'hometown', seg: [229.3, 254.2],
      stem: 'After “what do I care?”, what does Ron’s fuller answer show?',
      choices: ['He wanted her to stay, and his first reply hid it', 'He wanted her to stay, but only for the town’s sake',
                'He wanted her to choose freely, so he stayed neutral'], a: 0,
      cue: '最初の短い返事と、押されたあとの長い返事の差。',
      line: 'I thought *we worked well together*… but *I respected you*… you only have *one hometown*.',
      said: '最初は「好きにしろ。知るか」。押されると「うまくやれていた。尊敬している。故郷は一つ」。',
      mean: '最初のそっけない返事は本心を隠す形。押されて出た言葉は残ってほしい理由ばかり。',
      trap: 'hometown だけで町のため、好きにしろを遠慮と取りやすい。we と respected you は二人の話。',
      use: 'Do what you want. But I’d miss you.（好きにしなよ。でも寂しくなるな）' },

    // R fix: V2 — blind 50 %: rebalanced; the key now carries the threat ("like it or not") the others echo
    // why: furious ← "rager" heard as "rage" (怒り); same quiet day ← "one-time-only" missed, "birthday party" heard
    //   as more of this year's
    { id: 'f5', skill: 'phrase', level: 'B2', point: 'rager', seg: [260.7, 267.0],
      stem: 'What does Leslie promise for next year?',
      choices: ['A big, wild party, like it or not', 'A party sure to make him furious', 'The same quiet day as this one'], a: 0,
      cue: '「one-time-only」のあと、Next year の文の最後の語。',
      line: 'This, by the way, is a *one-time-only situation*. Next year, your birthday party’s gonna be *a rager*.',
      said: '「ちなみに、これは今回だけ。来年は盛大なパーティーよ」と言う。',
      mean: 'rager ＝ 大騒ぎのパーティー。くだけた言い方。今年は特別扱い。',
      trap: 'rage（激怒）から怒る話を想像しやすい。party’s gonna be のあとなら種類。',
      use: 'Saturday’s party is gonna be a rager.（土曜のパーティーは大騒ぎになるよ）' },
  ]
};
