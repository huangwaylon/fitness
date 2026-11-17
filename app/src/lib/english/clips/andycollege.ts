// REVIEW 2026-11-16: pass 6, fix 18, drop 0, new 0; ear checks 0
// OPEN: nt1 (C2) was rewritten once; if a fresh reader still gets it ≥ 80 % from the choices alone, drop it.
// “Andy Goes to College | Parks and Recreation” (the official Parks and Recreation channel, Season 4): Andy shops for
// a first college class while Ron (try something new) and April (take something easy) pull him opposite ways; guitar
// for beginners bores him, the laser course has no lasers, and a women's studies class wins everyone over.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 230 s. Untested on purpose: 6.8–7.8 s
// ("Really? — Yeah", whisper only), 29.3–34.5 s (who says "horizons are dumb" and "Yep"), 34.5–38 s ("April's way" in
// the captions, "April's weight" in whisper), 67.8–69.4 s ("Dude, don't" vs "Dude, don't let down"), 73–75.3 s
// ("barely haven't even never/ever seen"), 90.9 s ("Fun" vs "Fine"), 96.7–108 s (whose goodbye and who is "an
// incredible brunette"), 130.7–134.4 s (who says the class stinks), 147.6–149.4 s (whose "in terms of playing with
// them"), 162.8–167.8 s (who asks about "something that's already happened"), 181.8–206 s (whose lines in the
// lecture). Ron and April are named at 35.4 s ("No offense, Ron, but April's way…"); Ron's advice is the "explore a new
// subject" one.
import type { Clip } from '../types.ts';

export const andyCollege: Clip = {
  id: 'andycollege', video: 'Z3GraSaIBmI', title: 'Andy Goes to College', dur: 249, wpm: 151, band: 'mid',
  tags: ['友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %, right): the distractors were off-scene; all three are now "Two friends…", and "both tell
    //   him to go easy" is the half-heard version
    // why: both go easy ← "easy A" is the last advice heard, and the "broaden" turn is lost; out of college ← "I did not
    //   attend it" heard as the friends' topic
    { id: 'g2', skill: 'gist', level: 'B2', point: 'advice', reveals: ['horizons'], seg: [0, 54.0],
      stem: 'What is the first part of the clip mostly about?',
      choices: ['Two friends pull Andy opposite ways', 'Two friends both tell Andy to go easy',
                'Two friends talk Andy out of college'], a: 0,
      cue: 'Ron と April、それぞれの助言を比べて。',
      said: 'Ron は「新しい分野に挑戦を」、April は「得意なもので楽に A を」と言う。',
      mean: '何を取るかをめぐって、二人の助言がぶつかる場面。Andy は楽なほうに引かれる。',
      trap: 'easy A が残ると、二人とも楽を勧めたと取りやすい。助言の向きを比べる。',
      use: 'Everyone’s giving me different advice.（みんな言うことがばらばら）' },

    // R fix: V2 (blind 85 %, right): "books" and "lower price" were fillers; now "sign up for as many as they like" (the
    //   clip's "as many classes as you want" with the wrong verb)
    // why: sign up for many ← "as many classes as you want" heard, "sample" not; books ← "shopping" read literally
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'shopping', seg: [2.9, 7.5],
      stem: 'What can students do during the “shopping period”?',
      choices: ['Sit in on classes before signing up', 'Sign up for as many classes as they like',
                'Buy course books at a lower price'], a: 0,
      cue: '「where you can」のあと。',
      line: 'a *shopping period* where you can just *sample* as many classes as you want',
      said: '好きなだけ授業をお試しできる期間がある、と説明している。',
      mean: 'sample ＝ 試しに受けてみる。買い物のように見比べてから選べる。',
      trap: 'as many as you want だけ拾うと、何個でも登録できる話になる。sample（試す）が鍵。',
      use: 'Can I sample the soup first?（スープ、味見してもいい？）' },

    // R fix: V2 (blind 70 %, right): "many fail" was weak; now "sit in on, unenrolled" (crash a class = 潜り込む, and it
    //   fits the shopping period)
    // why: car crashes ← "crash" read literally; sit in on ← "crash a class" (attend without signing up) is a real use
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'crash', seg: [7.4, 15.5],
      stem: 'What kind of class is the last one Andy reads out?',
      choices: ['A short class that packs in the basics', 'A class you can sit in on, unenrolled',
                'A class about crashes and car safety'], a: 0,
      cue: 'リストの最後の一つと、そのあとの返事。',
      line: 'a *crash course*? — Yeah, but *it’s not what you think*.',
      said: '授業名を読み上げて「crash course？」と聞き、「思ってるのと違う」と返される。',
      mean: 'crash course ＝ 短期集中の講座。',
      trap: 'crash には「衝突」「潜り込む」もある。course と組めば短期集中。決まった組み合わせで覚える。',
      use: 'I took a crash course in Spanish.（スペイン語の短期集中講座を受けた）' },

    // R fix: V2 (blind 65 %, right): the choices weren't parallel; now three full reasons of the same kind
    // why: failed ← "did not graduate" heard, the reason not caught; dropped out ← the drop-out script
    { id: 'd2', skill: 'detail', level: 'B1', point: 'attend', seg: [15.4, 23.3],
      stem: 'Why didn’t Andy graduate from college, he says?',
      choices: ['He never enrolled in the first place', 'He dropped out in his first year',
                'He failed too many of his classes'], a: 0,
      cue: '「because」のあと、もう一度「did not」。',
      line: 'I did not graduate college *because I did not attend it*.',
      said: '「大学を卒業していない。通っていないから」とカメラに話す。',
      mean: 'attend ＝ 通う。そもそも入学していない、ということ。',
      trap: 'did not が2回続き、最初の否定だけで中退を想像しやすい。because のあとが理由。',
      use: 'I didn’t go, so I can’t say.（行ってないから分からない）' },

    // R fix: V2 (blind 60 %, right): the choices weren't parallel; all three now "The reason…"
    // why: blames school ← "because" heard as an excuse; failing sounds fine ← "did not graduate" heard as failing, and
    //   "trying to improve myself" as shrugging it off
    { id: 'h1', skill: 'humor', level: 'C1', point: 'attend', seg: [15.4, 23.3],
      stem: 'Why does Andy’s reason for not graduating get a laugh?',
      choices: ['The reason is too obvious to say', 'The reason blames the school',
                'The reason makes failing sound fine'], a: 0,
      cue: '理由の部分が、何を言っているか。',
      line: 'I did not graduate college *because I did not attend it*.',
      said: '卒業しなかった理由を「通わなかったから」と大まじめに説明する。',
      mean: '理由になっていない当たり前のことを、理由のように言うのが笑い。',
      trap: 'because を言いわけと取ると、学校のせいにしているように聞こえる。中身は当然の事実。',
      use: 'I didn’t win because I didn’t enter.（出場しなかったから勝たなかった）' },

    // R fix: V2 (blind 55 %, right): "start with" made "just one" the natural pick; added "Just two" (justone ≈
    //   "jus-twon", a linking trap). Four choices, ascending.
    // why: two ← the t of "just" runs into "one" (jus-twʌn); a few ← "sample a few more classes" comes later; as many
    //   as he likes ← the shopping period's "as many classes as you want"
    { id: 'n2', skill: 'number', level: 'B1', point: 'oneclass', seg: [15.4, 23.3], keep: true,
      stem: 'How many classes is Andy going to start with?',
      choices: ['Just one', 'Just two', 'A few', 'As many as he likes'], a: 0,
      cue: 'カメラへの話の最後、「taking」のあと。',
      line: 'I’m gonna start by taking *just one class*.',
      said: '「自分を高めたいので、まずは1つだけ授業を取る」と話す。',
      mean: 'just one ＝ 1つだけ。小さく始めるつもり。',
      trap: '直前に「好きなだけお試しできる」と聞くので、たくさん取ると思いやすい。本人の計画は1つ。',
      use: 'I’ll start with just one.（まずは1つだけにする）' },

    // why: traveling ← horizons = 地平線, read literally as going far; easy A ← April's advice, said right after
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'horizons', seg: [23.2, 31.7],
      stem: 'What is Ron’s advice to Andy about choosing a course?',
      choices: ['Pick something new to widen his world', 'Pick a class that takes him traveling',
                'Pick a class he can easily get an A in'], a: 0,
      cue: '「Andrew」と呼んだあとの助言。',
      line: 'you should *explore a new subject*, *broaden your horizons*.',
      said: 'Ron は「新しい分野に挑戦して、視野を広げろ」と勧める。',
      mean: 'broaden one’s horizons ＝ 視野を広げる。知らない分野に触れること。',
      trap: '直後の「楽に A を取れ」は別の人の助言。horizon（地平線）を文字通りに取らない。',
      use: 'This job will broaden your horizons.（この仕事で視野が広がるよ）' },

    // R fix: V2 (blind 65 %, right): the key was the long two-part one; now three "He quietly…". C10: the stem no longer
    //   names Ron, so it needs no ear check.
    // why: resents ← "root against" heard, the "not" lost; pities ← "I don't want to see Andy waste his time" heard as
    //   feeling sorry for him
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'sappy', reveals: ['root'], seg: [40.2, 54.0],
      stem: 'In the comment to the camera, how does the speaker really feel about Andy?',
      choices: ['He quietly likes him', 'He quietly pities him', 'He quietly resents him'], a: 0,
      cue: '「small number」のあとと、最後の一言。',
      line: 'he is one of a small number whom I do *not* actively root against. … there I go, getting all *sappy*.',
      said: 'Andy は失敗を願わない数少ない同僚だと言い、「感傷的になった」と付け足す。',
      mean: 'Ron なりの最大のほめ言葉。Andy は例外の一人。',
      trap: 'root against（失敗を願う）だけ残ると逆の意味。not と small number を拾う。',
      use: 'Don’t tell anyone, but I like him.（内緒だけど、彼のこと好きなんだ）' },

    // anchor: 45.9–50.2 s "one of a small number whom I do not actively root against": if Andy is in the small group
    //   Ron doesn't root against, the large group is the coworkers he does root against; 51.6–53.1 s "getting all
    //   sappy" files this under warmth
    // R fix: C10 only: the stem no longer names Ron (the speaker doesn't change the key); blind pass missed it
    // why: cheers for most ← sincerity flip: "do not root against" heard as "root for", and widened to everyone;
    //   doesn't care ← "not actively" heard as indifference to all of them
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'root', seg: [45.4, 54.0],
      stem: 'Taken at its word, what does the compliment say about the other coworkers?',
      choices: ['That he hopes most of them fail', 'That he cheers for most of them', 'That he does not care about them'],
      a: 0,
      cue: '「a small number」の外にいるのは誰か。',
      line: 'he is one of *a small number* whom I do not actively *root against*.',
      said: '「同僚の中で、Andy は私が失敗を願っていない少数派だ」と言う。',
      mean: '少数だけが例外なら、残りの大多数は失敗を願う相手になる。ほめ言葉の裏が、Ron の人づきあいを語っている。',
      trap: 'not の付いた言い方を「応援している」と取りやすい。少数を例外にするほめ方は、多数の側を考える。',
      use: 'You’re one of the few I can stand.（我慢できる数少ない一人だよ）' },

    // R fix: V2 (blind 70 %, right): "talking too much" was a filler; now "struggling with the basics" (the suggestion
    //   heard as a move down). All three "He seems…".
    // why: wrong room ← "maybe you should be in" another class heard as a room mix-up; struggling ← "advanced" missed,
    //   and a move heard as a move down
    { id: 'i1', skill: 'infer', level: 'B2', point: 'advanced', seg: [54.9, 67.7],
      stem: 'What does the teacher’s suggestion tell us about Andy?',
      choices: ['He seems to know more than a beginner', 'He seems to struggle with the basics',
                'He seems to be in the wrong room'], a: 0,
      cue: 'Andy が楽器の部品を次々に答えたあと。',
      line: 'It’s called a *capo*. *Changes the key*. — Maybe you should be in the *advanced*…',
      said: '部品の名前と働きを Andy がすらすら答え、先生が「上級に行ったら？」と言う。',
      mean: '初心者にしては知りすぎている、ということ。遠回しに移るよう勧めている。',
      trap: '「別のクラスに」を部屋の取りちがえと取りやすい。理由は直前の Andy の答えにある。',
      use: 'Maybe you should try the next level.（次のレベルに行ったら？）' },

    // anchor: 62.7–63.2 s he has just explained a capo ("changes the key"); 66.5–67.3 s "Yeah, maybe I should"; then
    //   69.4–75.3 s "I couldn't possibly 'cause I'm just a beginner… never seen a gortar", mangling the very word he
    //   had been using with ease
    // R fix: V2 (blind 50 %, right; C2, one rewrite) and K6: the key was the only two-part answer; now all three are
    //   two-part. If a fresh reader still gets it ≥ 80 %, drop it.
    // why: nervous ← the 謙遜 frame: "just a beginner" taken as modesty; only terms ← knowing "fret" and "capo" heard as
    //   book knowledge, not playing
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'beginner', reveals: ['advanced'], seg: [62.2, 76.6],
      stem: 'When Andy insists he’s “just a beginner”, what is he hiding?',
      choices: ['That he’s good, and wants the easy class anyway', 'That he’s nervous, and fears the faster class',
                'That he knows terms, but can’t really play'], a: 0,
      cue: '「maybe I should」と言ったあとの打ち消し。',
      line: 'Yeah, maybe I should. … But I *couldn’t possibly* ’cause I’m *just a beginner*.',
      said: '上級を勧められて「そうかも」と言い、すぐ「無理、初心者だし、ギターも見たことない」と打ち消す。',
      mean: '一度認めてから、わざとらしく初心者を名乗る。楽に良い成績を取るため、うまいのを隠している。',
      trap: 'just a beginner を謙遜と取りやすい。「そうかも」の直後の打ち消しは、建前のほう。',
      use: 'Me? Oh, I’m just a beginner.（私？いえいえ、初心者なので）' },

    // why: two ← the weak "for" and "the first" blur the count; fourteen ← "four" stretched, as "-teen" often is
    { id: 'n1', skill: 'number', level: 'B1', point: 'weeks', seg: [77.6, 83.7], keep: true,
      stem: 'How long will the class work on basic chords?',
      choices: ['Two weeks', 'Four weeks', 'Fourteen weeks'], a: 1,
      cue: '「the first」のあと。',
      line: 'We will be working on basic chords for the first *four weeks*.',
      said: '先生が「最初の4週間は基本のコードをやります」と言う。',
      mean: 'four weeks ＝ 4週間。Andy がすぐ「4週間も？」とくり返す。',
      trap: 'for と four は同じ音。「for the first four」の並びで、どちらが数かを決める。',
      use: 'It takes about four weeks.（4週間くらいかかります）' },

    // R fix: V2 (blind 60 %, right): the choices weren't parallel; now "feeling; reason" for all three
    // why: too short ← "four weeks" heard as the whole course, a short one; too fast ← "basic chords" heard as hard for
    //   a beginner (his act)
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'weeks', seg: [77.6, 87.7],
      stem: 'How does Andy react to the plan for the class?',
      choices: ['Impatient; the pace sounds too slow', 'Surprised; the course sounds short', 'Nervous; the pace sounds too fast'],
      a: 0,
      cue: '「Oh my God」のあとの一言。',
      line: 'Oh my God, *four weeks*. I’m *already bored*.',
      said: '「4週間も？もう退屈」と言うと、Ron が「挑戦していないからだ」と返す。',
      mean: '基本ばかりの4週間が長すぎて、始まる前から飽きている。',
      trap: 'Oh my God を驚きだけと取ると「短い」に聞こえる。直後の already bored が気持ちを決める。',
      use: 'Ugh, I’m already bored.（うわ、もう飽きた）' },

    // R fix: V2 (blind 55 %, right): "apologizes" was a filler; now "comforts" (Of course = そりゃそうだよね). C10: the
    //   stem no longer names Ron, so it needs no ear check.
    // why: agrees ← "Of course" heard as agreeing the class is dull; comforts ← "Of course" heard as sympathy
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'ofcourse', seg: [77.6, 90.5],
      stem: 'When Andy says he’s bored, what does the reply do?',
      choices: ['Blames Andy’s choice for the boredom', 'Agrees the class itself is boring', 'Comforts Andy, who feels bored'],
      a: 0,
      cue: '返事の最初の3語と、続く理由。',
      line: '*Of course you are*. You’re *not challenging yourself*.',
      said: '「当然だ。自分に挑戦していないからだ」と返す。',
      mean: 'Of course you are ＝「だから言っただろう」。自分の助言に話を戻す前置き。',
      trap: 'Of course を共感の「そうだよね」と取りやすい。続く理由は、Andy の選び方を責めている。',
      use: 'Of course you’re tired. You skipped lunch.（そりゃ疲れるよ、昼抜いたんだから）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'sample', seg: [87.7, 90.8],
      stem: 'Type the suggestion: “I suggest we ___.” (5 words)', answer: 'sample a few more classes',
      cue: '「I suggest we」のあと。',
      line: 'I suggest we *sample a few more classes*.',
      said: '「もういくつか授業を試してみよう」と提案している。',
      mean: 'sample ＝ 試しに受ける。a few more は「あといくつか」。',
      trap: 'sample a は「サンプラ」と続き、few more も一息。小さな a を落とさずに書く。',
      use: 'Let’s try a few more places.（あと何軒か回ってみよう）' },

    // predict: the segment stops after Andy's question; the reveal plays the professor's answer
    // R fix: V2 (blind 75 %, right): "the class will vote" was a filler; now two letdowns (none at all / small ones
    //   only) and a warning
    // why: small only ← his "small or big" framing heard as a real option; warning ← lasers plus "play with" invite a
    //   safety talk (the classroom script)
    { id: 'r1', skill: 'predict', level: 'B2', point: 'lasers', seg: [138.1, 147.5], then: [147.5, 152.8],
      stem: 'After Andy asks about small and big lasers, what kind of answer is coming?',
      choices: ['A letdown: no lasers at all in this class', 'A letdown: only small lasers to start with',
                'A warning: lasers aren’t toys to play with'], a: 0,
      cue: 'ここまでの講義の中身は、ずっと何だったか。',
      line: 'would we start with the small lasers, or… the big lasers? — We *won’t be using actual lasers*…',
      said: '「どの大きさのレーザーで遊ぶのか」と聞くと、教授は「本物は使わない。理論の授業だ」と答える。',
      mean: '講義が図と定義ばかりだったことが、答えの予告になっている。',
      trap: '安全の話を予想しやすいが、教授はここまで理論しか話していない。前の流れから次を読む。',
      use: 'I’m afraid that’s not part of the course.（あいにく、それは授業に含まれません）' },

    // R fix: V2 (blind 70 %, right): "actual" cued a negative and "will" was the only odd one; now three negatives
    //   plus "want to"
    // why: want to ← "won't" and "want" share the w-n-t frame, /oʊ/ vs /ɑ/; wouldn't ← the same "no" in a softer form,
    //   only the vowel differs; shouldn't ← the "-n't be" heard, the onset blurred
    { id: 's1', skill: 'sound', level: 'B2', point: 'lasers', seg: [148.9, 152.8],
      stem: 'Fill the gap: “We ___ be using actual lasers in this course.”',
      choices: ['won’t', 'want to', 'wouldn’t', 'shouldn’t'], a: 0,
      cue: '「We」のすぐあと、短い一語。',
      line: 'We *won’t* be using actual lasers in this course.',
      said: '「この授業では本物のレーザーは使いません」と教授が言う。',
      mean: 'won’t は「ウォウント」と口を丸めて伸ばす。want（ワント）とは母音がちがう。',
      trap: 't が消えると want に近い。won’t は「オウ」と口が丸い。続く theory も手がかり。',
      use: 'I won’t be home until late.（帰りは遅くなるよ）' },

    // R fix: V2 (blind 70 %, right): "really about" plus two hands-on choices left theory alone; now "history" (a near
    //   sound) and "safe use"
    // why: history ← theory/history share the "-ory"; safe use ← "using actual lasers" heard without the "won't"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'lasers', seg: [148.9, 153.5],
      stem: 'What does the professor say the course is really about?',
      choices: ['The theory that makes lasers work', 'The history of how lasers were made',
                'The safe use of lasers in labs'], a: 0,
      cue: '「in this course」のあと、「It’s about」に続く部分。',
      line: 'It’s about *the theory* that makes them possible.',
      said: '「本物は使わない。レーザーを可能にする理論の授業だ」と教授が言う。',
      mean: 'theory ＝ 理論。実習ではなく、しくみを学ぶ授業。',
      trap: 'theory と history は語尾が同じ。最初の th の音と、前の won’t の否定で決める。',
      use: 'It’s more theory than practice.（実習より理論が中心です）' },

    // R fix: V2 (blind 70 %, right): "curious" was weak; now "mildly let down" (the size of the feeling is the point)
    // why: mildly ← "bummer" caught, "most significant… of my lifetime" not; relieved ← "theory" heard as safer
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'bummer', reveals: ['lasers'], seg: [148.9, 158.7],
      stem: 'How does Andy feel once he hears what the course is about?',
      choices: ['Badly let down', 'Mildly let down', 'Secretly relieved'], a: 0,
      cue: 'カメラに向かって言う「most significant」のあと。',
      line: 'One of the most significant *bummers* of my lifetime.',
      said: '本物は使わないと聞き、「人生で指折りのがっかり」とカメラに言う。',
      mean: 'bummer ＝ がっかりすること。大げさに言って、落ちこみぶりで笑わせている。',
      trap: 'significant や lifetime のかたい語で真剣に聞こえるが、中身は「がっかり」。',
      use: 'What a bummer. The shop’s closed.（がっかり、店が閉まってる）' },

    // why: easiest ← April's "easy A" advice from the start; lasers ← "women's lasers" in his announcement
    { id: 'g1', skill: 'gist', level: 'B2', point: 'choice', reveals: ['womlasers'], seg: [168.0, 230.2],
      stem: 'Why does Andy end up choosing the class he picks?',
      choices: ['Everyone came out of it loving the class', 'It is the easiest class, as April wanted',
                'It is about lasers, the topic he loves'], a: 0,
      cue: '授業のあとの感想と、「then」。',
      line: 'That class was *awesome*. — I *wholeheartedly agree*. … Well, *then it’s decided*.',
      said: '授業のあと「最高」「心から同意」と続き、Andy は「じゃあ決まり」と言う。',
      mean: '意見が割れていた皆がそろって気に入った。then ＝ それなら。',
      trap: 'women’s lasers の言いそこねから、レーザーが理由と取りやすい。理由は then の前。',
      use: 'Well then, it’s decided.（じゃあ、決まりだね）' },

    // R fix: V2 (blind 55 %, right): the key was the only one with a reason after a colon; three plain parallel choices
    // why: look at ← look = 見る (literal), and they have been reading course lists; apology ← a softening opener read
    //   as an apology (日本語の「あの…」)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'look', seg: [168.0, 176.8],
      stem: 'What does Andy’s first word do as he answers Ron and April?',
      choices: ['Gets their attention before he insists', 'Gets them to look at the course list',
                'Softens what he says as an apology'], a: 0,
      cue: '返事の最初の一語と、そのあとの言い切り。',
      line: '*Look*, you guys have already had your say.',
      said: '「いいか、二人とも言いたいことは言った。今度は自分が選ぶ」と言う。',
      mean: '文頭の Look ＝「いいかい」。注意を引いて、きっぱり言う前置き。',
      trap: 'look を「見て」と取ると何かを見せる話になる。文頭の Look は、これから言い切る合図。',
      use: 'Look, I just need five minutes.（いいかい、5分だけちょうだい）' },

    // why: disagrees ← "violently opposed to marriage" heard as his objection; too fierce ← "violently" heard as a
    //   complaint about her manner
    { id: 'i4', skill: 'infer', level: 'C1', point: 'propose', seg: [207.7, 216.7],
      stem: 'What does the man’s remark about proposing say about how he sees the teacher?',
      choices: ['He admires her greatly', 'He disagrees with her views', 'He finds her too fierce'], a: 0,
      cue: '「If」で始まる文の、後半。',
      line: 'If that woman weren’t so violently opposed to marriage, I think *I would propose to her*.',
      said: '「あの女性が結婚にあれほど反対でなければ、プロポーズしたい」と言う。',
      mean: 'あり得ない条件を付けた、最大級のほめ言葉。心酔している。',
      trap: 'violently や opposed から反対や苦情に聞こえやすい。仮定の文は後半に本音がある。',
      use: 'If it weren’t so far, I’d go.（あんなに遠くなければ行くのに）' },

    // R fix: V2 (blind 55 %, right): "teach it himself" was weak; now "gets the teacher's name wrong" (a slip, the
    //   wrong target)
    // why: laser class after all ← "lasers" is heard in his announcement; teacher's name ← "that woman" just before,
    //   and the correction heard as fixing a name
    { id: 'h3', skill: 'humor', level: 'C1', point: 'womlasers', seg: [216.7, 225.5],
      stem: 'When Andy announces his choice, why does it get a laugh?',
      choices: ['He blurts out the wrong class name', 'He picks the laser class after all',
                'He gets the teacher’s name wrong'], a: 0,
      cue: '選んだ授業の名前と、すぐ入る訂正。',
      line: 'Andy Dwyer will be taking *women’s lasers*. — Women’s studies. — Sorry, God, I cannot stop thinking about lasers.',
      said: '「女性学」のつもりが「女性レーザー」と言い、訂正されて「レーザーが頭から離れない」。',
      mean: 'がっかりしたレーザーへの未練が、つい口から出てしまうのが笑い。',
      trap: 'lasers が聞こえるので、結局レーザーにしたと取りやすい。すぐあとの訂正と謝りを聞く。',
      use: 'Sorry, I meant Tuesday, not Thursday.（ごめん、木曜じゃなくて火曜のこと）' },

    // anchor: 227.0–228.5 s both sources have "is there such thing as women's lasers": no "a" after "such", and
    //   "such thing as" goes by in ≈ 0.4 s
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'suchthing', seg: [225.5, 230.2],
      stem: 'Type his question: “Is there ___ women’s lasers?” (3 words)', answer: 'such thing as',
      cue: '「Is there」のすぐあと。文法より、聞こえた音を。',
      line: 'Is there *such thing as* women’s lasers?',
      said: '「女性レーザーなんてものはある？」と聞く。3語がひと息に、とても速く言われる。',
      mean: '文法では such a thing as だが、ここでは a が聞こえない。速い会話では小さな a が落ちることがある。',
      trap: '習った形に合わせて a を足したくなる。書き取りは、言われた音のとおりに書く。',
      use: 'Too much tea? Is there such a thing?（お茶の飲みすぎ？そんなのある？）' },
  ]
};
