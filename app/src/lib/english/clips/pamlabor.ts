// REVIEW 2026-11-16: pass 9, fix 15, drop 0, new 0; ear checks 2
//   (fixes: 14 blind-pass rebalances, w1 skill who → detail, and a broken character in w1's trap)
// “Pam Goes into Labor - The Office US” (the official The Office channel, Best of Season 6): Pam's contractions start
// at the office; she stalls, admits she's scared, is talked round, and the office scrambles to get her and Jim out.
// Segments from the captions, words from whisper (2026-11-16). The captions' word times run coarse (up to ≈ 1 s early
// after 130 s), so boundaries sit in gaps both sources leave. Untested: 15–21.5 s (a sex joke), 86–103 s (crowd talk
// overlaps; captions are empty), 187–200 s (the dictionary and dilation bits), the car ride (236–260 s; "saw" / "shot"
// that deer differs), and "warn me at five minutes" / "four and three minutes" (captions: "Friday", "porn three"), used
// only in notes and as distractors. The ambulance order's name is "Aaron" in both sources (Erin; spelling isn't tested).
// EAR CHECK: 77.9 s nt2 — "as long as I can talk through it" (whisper) vs "as long as I can write" (captions)
// EAR CHECK: 104.9 s nt3 — the stress in the second "I am not going" falls on "not" (captions write "NOT"); ship only once confirmed
import type { Clip } from '../types.ts';

export const pamLabor: Clip = {
  id: 'pamlabor', video: '6ILnFPZtOKY', title: 'Pam Goes into Labor', dur: 276, wpm: 182, band: 'fast',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: 4:25 / 4:45 ← "thirty-five" heard with the wrong tens (twenty / forty), near sounds
    { id: 'n1', skill: 'number', level: 'B1', point: 'time', seg: [8.55, 13], keep: true,
      stem: 'When someone asks if it’s midnight yet, what time is it?',
      choices: ['4:25', '4:35', '4:45'], a: 1,
      cue: '「midnight」の質問への返事、数字に注目。',
      line: 'Is it midnight yet? — No, it’s *4:35*.',
      said: '「もう夜中の12時？」に「いや、4時35分」と答える。',
      mean: '4:35 は four thirty-five と読む。時と分を分けて言う。',
      trap: 'thirty は forty や twenty と混ざりやすい。くり返される2回目で確かめる。',
      use: 'It’s a quarter to five.（5時15分前です）' },

    // R fix: blind 80 %: "mixes up 4:35 with midnight" was a filler and named the time n1 asks; now a workday reading
    // why: workday ← at 4:35, "almost made it" naturally means "nearly to 5 o'clock", the end of the day; arrived ←
    //   "made it" literally = got somewhere, so it sounds like the trip to the hospital
    { id: 'h1', skill: 'humor', level: 'C1', point: 'midnight', reveals: ['time'], seg: [8.55, 14.95],
      stem: 'Why is the comment right after the time is given funny?',
      choices: ['He calls a miss of seven-plus hours a near miss', 'He means she nearly held out till quitting time',
                'He means they nearly got her to the hospital'], a: 0,
      cue: '時刻を聞いたあとの「made it」は何に向けた言葉？',
      line: 'It’s 4:35. — 4:35, all right, *almost made it*.',
      said: '4時35分と聞き、「もう少しで間に合ったのに」と言う。',
      mean: 'made it ＝ 間に合う。目標の12時まで7時間以上あるのに「惜しい」と言うずれが笑い。',
      trap: 'made it を「着いた」と取ると病院の話になる。何に間に合うのかを聞く。',
      use: 'We made it, just in time!（ギリギリ間に合った！）' },

    // R fix: blind 75 %: "answer the push" cued resistance and the key was the only no; stem neutral, the feast
    //   distractor added in place of the off-scene "finish her work"
    // why: wait for Jim ← "Somebody get Jim" is heard just before; after the feast ← Ultra Feast is her own topic, so
    //   it sounds like a condition
    { id: 'g1', skill: 'gist', level: 'B2', point: 'stall', reveals: ['feast'], seg: [21.5, 49.1],
      stem: 'In the first minute, what does Pam do about going to the hospital?',
      choices: ['She puts it off with one excuse after another', 'She agrees to go, but only once Jim is there',
                'She agrees to go as soon as the feast is over'], a: 0,
      cue: '「not yet」から、彼女が出す話題と言い方。',
      line: 'No, *not yet*, Michael.',
      said: '病院へと言われても「まだ」と断り、宴会の話を出したり平気だと言ったりする。',
      mean: '理由をつけて出発を延ばしている。本当の理由はまだ言わない。',
      trap: '直前に Jim の名前が出るが、彼を待つとは言っていない。名前より返事の中身。',
      use: 'Can we do this later?（それ、あとにしない？）' },

    // R fix: blind 70 %: "put off leaving" was the only choice tied to the hospital; key reworded, the invite
    //   distractor now built on "Where's Kevin?"
    // why: find Kevin ← "Where's Kevin?" comes right after, so it sounds like her request; eat first ← eating before
    //   a long hospital stay is a common idea
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'feast', reveals: ['stall'], seg: [21.5, 34],
      stem: 'When Pam suddenly mentions Ultra Feast, what is she doing?',
      choices: ['Steering the talk away from the hospital', 'Asking Michael to go and find Kevin',
                'Asking to eat something before she goes'], a: 0,
      cue: '病院の話のすぐあと、急に変わる話題。',
      line: 'No, not yet… *Oh, wow, it’s almost time for Ultra Feast.*',
      said: '「まだいい」と言いかけて、急に「もうすぐウルトラ・フィーストの時間」と言い出す。',
      mean: '話題を変えて病院の話から逃げている。Michael も「行かずに食べる気？」と返す。',
      trap: '食事の話でも、Oh, wow の唐突さが合図。急な話題転換は逃げのサイン。',
      use: 'Oh, look at the time! Anyway…（あ、もうこんな時間！それより…）' },

    // R fix: blind 50 %: the cat distractor was a filler; now a "cheap food" dig
    // why: Kevin's food ← "cat food with Kevin" sounds like a dig at what Kevin brings; cheap ← "cat food" as the
    //   stock put-down for bad, cheap food
    { id: 'h2', skill: 'humor', level: 'C1', point: 'catfood', seg: [27.5, 34.05],
      stem: 'Why does Michael bring up cat food?',
      choices: ['He mixes up the feast’s name with a cat food’s', 'He is making fun of the food Kevin usually brings',
                'He is saying the feast’s food is cheap and bad'], a: 0,
      cue: 'すぐあとの短い訂正の一言に注目。',
      line: 'You wanna eat *cat food* with Kevin…? — *That’s Fancy Feast.*',
      said: '「Kevin とキャットフードを食べる気？」と言い、「それはファンシー・フィースト」と直される。',
      mean: '名前の似たキャットフードと取り違えている。',
      trap: 'cat food を悪口と取りやすいが、すぐに訂正が入る。訂正が来たら、前の言葉は勘違い。',
      use: 'I think you’re thinking of something else.（別のものと勘違いしてない？）' },

    // R fix: blind 60 %: the key was the only cynical choice; the warm distractor became a cynical one the words refute
    // why: old ritual ← "ceremony" heard without "made up"; no one enjoys it ← the cool tone heard, but aimed at the
    //   meal ("pig out" says they love it)
    { id: 'i1', skill: 'infer', level: 'C1', point: 'ultra', seg: [32.7, 39.6],
      stem: 'What does the explanation of Ultra Feast suggest about it?',
      choices: ['It’s an excuse to overeat, dressed up as a ritual', 'It’s an old office ritual built around a big meal',
                'It’s a ritual they keep up, though no one enjoys it'], a: 0,
      cue: '「something they …」以降、言葉の選び方。',
      line: 'something they *made up* so they can *pig out* together *in the name of ceremony*.',
      said: '「あいつらが作った行事で、儀式を口実にたらふく食べる」と言う。',
      mean: 'in the name of ～ ＝ ～を口実に。冷めた目で見た説明。',
      trap: 'ceremony だけだと伝統行事に聞こえる。in the name of は「本音は別」の合図。',
      use: 'It’s a “meeting,” but we just eat.（「会議」と言っても食べるだけ）' },

    // R fix: blind 85 %: the stem named "pig", so the idiom answered it without the audio; stem names the moment,
    //   distractors now a near sound and a potluck reading
    // why: pick up ← "pig out" ≈ "pick up" when the g and t blur; bring dishes ← "together" plus a feast menu =
    //   a potluck
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'ultra', seg: [32.7, 39.6],
      stem: 'In the Ultra Feast explanation, what will they do together?',
      choices: ['Eat as much as you like', 'Pick up food to share', 'Take turns bringing dishes'], a: 0,
      cue: '「they can」のすぐあと、動詞と小さな語。',
      line: 'so they can *pig out* together',
      said: '「いっしょに思いきり食べるため」に作った、と言っている。',
      mean: 'pig out ＝ がつがつたくさん食べる。くだけた言い方で、少しからかう響きがある。',
      trap: 'pig out は pick up に聞こえやすい。動詞＋out は「とことん」の意味が多い。',
      use: 'Let’s pig out on pizza tonight.（今夜はピザを思いきり食べよう）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'norush', seg: [38.4, 43],
      stem: 'Type what Pam says: “There’s ___ to get to the hospital.” (2 words)', answer: 'no rush',
      cue: '「There’s」のすぐあと、短い2語。',
      line: 'There’s *no rush* to get to the hospital.',
      said: '「病院に急ぐ必要はない」と言う。',
      mean: 'There’s no rush ＝ 急ぐ必要はない。相手の「早く」をやんわり止める言い方。',
      trap: 'no と rush がつながり一続きに聞こえる。rush の r は舌をどこにもつけない音。',
      use: 'No rush, take your time.（急がないで、ごゆっくり）' },

    // R fix: blind 60 %: fear was the only feeling on offer; "fed up" swapped for the 遠慮 reading, a stronger near miss
    // why: the feast ← Ultra Feast is the last topic before it, so staying for the meal seems the reason; no fuss ←
    //   the Japanese frame: playing it down read as 遠慮, not wanting to trouble the office
    // anchor: 107.2–110.6 s "I'm not going today because I can't do it. I don't think I can do it", then "I'm scared
    //   too" (123.1 s): the clip itself names what the shrug hides
    // retired: with nt2 and nt3: one C2 alone is under the native tier’s 2; back with either
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'fear', reveals: ['norush'], seg: [38.4, 49.1], retired: true,
      stem: 'When Pam shrugs off getting there at all, what is she trying not to say?',
      choices: ['That she’s afraid she can’t go through with it', 'That she’d rather stay for the coworkers’ feast',
                'That she doesn’t want to cause a fuss at work'], a: 0,
      cue: '平気そうな言い方と、あとで本人が言う理由。',
      line: 'I’m fine, I’ll get there. And *if I don’t get there, I don’t get there*.',
      said: '「平気、そのうち着く。着かなかったら、それまで」と、どうでもいいように言う。',
      mean: '投げやりな言い方は、怖さを隠すため。少しあとで本人が「できない、無理だと思う」と口にし、隠していたものが分かる。',
      trap: '直前の宴会の話や、職場への遠慮に結びつけやすい。平気だと強く言うほど、裏の気持ちを疑う。',
      use: 'Whatever happens, happens.（なるようになるさ）' },

    // why: food ← the feast menu was just being described, so the pain sounds like something she ate; kicking ← the
    //   baby is the topic, and kicks are the familiar pregnancy ache
    { id: 'd1', skill: 'detail', level: 'B1', point: 'minor', seg: [65.9, 79],
      stem: 'When someone asks if she’s okay, how does Pam explain the pain?',
      choices: ['As only a minor contraction', 'As only something she ate', 'As only the baby kicking'], a: 0,
      cue: '「the doctor said」のあと、痛みの呼び名。',
      line: 'the doctor said that it’s still considered a *minor contraction*',
      said: '「先生によると、これはまだ軽い陣痛」と説明する。',
      mean: 'contraction ＝ 陣痛（子宮の収縮）。minor ＝ 軽い。まだ病院は早い、という言い訳。',
      trap: '直前まで宴会の料理の話なので、食べ物のせいと取りやすい。理由は医者の言葉として出てくる。',
      use: 'It’s nothing serious, just a headache.（大したことない、ただの頭痛）' },

    // why: backwards ← "as long as" heard as "until", so the rule seems to say she should go now; can't finish ← the
    //   "um—" just before reads as her breaking off, so the rule would call it serious
    // anchor: 67.8–78.7 s asked "are you okay?" mid-pain, she answers with the whole rule, "minor contraction as long as I
    //   can talk through it", and gets to the end of it
    // retired: the ear-check policy: the key needs “talk through it” (whisper), the captions have “write” (77.9 s)
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'minor', seg: [65.9, 79], retired: true,
      stem: 'Why is Pam’s answer about the doctor’s rule funny, mid-pain?',
      choices: ['She proves the rule just by managing to say it', 'She gets the rule backwards: it means she must go',
                'She can’t finish saying it, so it isn’t minor'], a: 0,
      cue: '痛みの最中に、彼女が何をしているか。',
      line: 'a *minor contraction* as long as I can *talk through it*.',
      said: '痛みの中で「話せるうちは軽い陣痛だと先生が言った」と最後まで言い切る。',
      mean: 'as long as ＝ ～する限り。言い切ること自体が「まだ話せる」証拠で、行かない理屈が完成する。',
      trap: 'as long as を「～まで」と取ると意味が逆になる。条件の文は、今それを満たしているかを見る。',
      use: 'As long as I can walk, I’m fine.（歩けるうちは大丈夫）' },

    // R fix: blind 80 %: the key was the only two-part choice (§9.6); both distractors now have two steps too
    // why: he warns her ← the contraction timing comes right after, so it sounds like the reason; the doctor ← the
    //   doctor was quoted earlier, as the voice that decides
    { id: 'g2', skill: 'gist', level: 'B2', point: 'convince', reveals: ['fear', 'scared'], seg: [102.5, 135.2],
      stem: 'How is Pam finally brought around to going?',
      choices: ['He admits he’s scared too, then talks up the baby', 'He says the pains are close now, then insists',
                'He quotes the doctor, then promises to stay by her'], a: 0,
      cue: '「can’t do it」のあと、相手が自分について言うこと。',
      line: 'Pam, *I’m scared*, I’m real scared… But the *best news* is, we’re gonna have a baby today.',
      said: '「できない」と言う彼女に、相手は「僕も怖い」と認め、「でも今日赤ちゃんに会える」と言う。',
      mean: '怖さを打ち消さずに認め、楽しみに目を向けさせる。それで彼女も行く気になる。',
      trap: '陣痛の間隔の話は、行くと決めたあとに出てくる。決め手は順番で確かめる。',
      use: 'I’m nervous too, but it’ll be fun.（私も緊張してる。でもきっと楽しいよ）' },

    // why: on "I" ← the contrast reading (the others can go), the 「私は」 frame; on "am" ← the "yes I AM" pattern
    //   learners know from arguments, heard as a comeback
    // anchor: 103.8–105.9 s "I'm not going", then at once the full "I am not going, okay?", to people still saying
    //   "let's go": the same refusal made firmer, with nobody to contrast or contradict
    // retired: a C2 stress item, until its ear check (104.9 s)
    { id: 'nt3', skill: 'sound', level: 'C2', point: 'refuse', seg: [102.5, 107.15], retired: true,
      stem: 'In her second “I am not going”, where is the stress, and why?',
      choices: ['On “not”: a firmer repeat of the same refusal', 'On “I”: the others can go, but she won’t',
                'On “am”: a comeback to someone saying she is'], a: 0,
      cue: '1回目の短い形と、2回目の言い方の差。',
      line: 'No, I’m not going, I am *not* going, okay?',
      said: '「行かない」のあと、短くしない形で「行かないってば」とくり返す。',
      mean: 'I’m を I am に広げ、not を強めると念押しになる。同じ拒否を強めただけで、誰かとの対比ではない。',
      trap: 'I を強めると「私は」の対比、am なら言い返し。くり返しは2回目で何を強めたかを聞く。',
      use: 'I am not eating that.（それは絶対食べない）' },

    // R fix: blind 75 %: the key was the only two-part, only warm choice; distractors now parallel (feeling + act)
    // why: annoyed ← "are you kidding me?" is often irritation, and she's holding everyone up; joking ← "kidding"
    //   literally = 冗談, so it sounds like lightening the mood
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'kidding', reveals: ['fear'], seg: [106.2, 119.1],
      stem: 'When Pam says she can’t do it, how is the reply meant?',
      choices: ['Surprised she doubts herself, and backing her', 'Fed up with her stalling, and telling her off',
                'Joking with her, to take some pressure off'], a: 0,
      cue: '「Hey」のくり返しのあと、続く言葉で判断。',
      line: 'Hey, hey, hey, *are you kidding me?*',
      said: '「できない」と言う彼女に、「おいおい、冗談だろ？」と返す。',
      mean: 'ここでは「本気でそう思ってるの？」という驚き。君ならできる、と言う前置き。',
      trap: '怒りや冗談にも使う表現。どれかは後ろの一文で決まる。決まり文句は次の文とセットで。',
      use: 'Are you kidding? You were great!（何言ってるの、最高だったよ！）' },

    // R fix: blind 70 %: the stem quoted the chunk under test (§9.2); now names the moment. "Allowed" (a filler)
    //   became a "just try" reading
    // why: easy ← "anyone can do this" heard alone = anybody could, so it's easy; just try ← "you can do this"
    //   heard as the soft 「やればできる」, an urging, not a judgement of her
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'anyone', seg: [116.3, 120.8],
      stem: 'Right after the “Are you kidding?”, what does the next line tell Pam?',
      choices: ['She is the most able person for this', 'This is so easy that anybody could do it',
                'She should try it, even if it goes badly'], a: 0,
      cue: '「If anyone can …」の後半に来る主語。',
      line: '*If anyone can do this, you can* do this.',
      said: '「誰かにできるなら、それは君だ」とくり返す。',
      mean: 'If anyone can, you can ＝ 君にできなければ誰にもできない。強い信頼を示す励まし。',
      trap: '前半だけだと「誰でもできる＝簡単」に聞こえる。この文は後半の主語が主役。',
      use: 'If anyone can fix it, you can.（直せる人がいるなら君だよ）' },

    // R fix: blind 70 %: the key was the only two-part choice; the wait distractor now shares its "show" frame
    // why: wait ← "I'm scared" heard as a reason to hold off; not ready ← "petrified" heard as doubt about becoming
    //   a father
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'scared', reveals: ['fear'], seg: [119.1, 132.3],
      stem: 'After the pep talk, why does he admit to Pam that he’s scared?',
      choices: ['To show she isn’t alone, then turn to the good news', 'To show they’re both shaky, so it’s fine to wait',
                'To own up to his own doubts about being a father'], a: 0,
      cue: '怖いと何度か言ったあとの「But」。',
      line: 'Pam, *I’m scared*, I’m real scared… *But the best news is*…',
      said: '「僕も怖い、本当に」と打ち明け、「でも一番いい知らせは」と話を変える。',
      mean: '先に弱さを見せ、怖いのは一人じゃないと伝えてから、But で前向きな話に向ける。',
      trap: '怖いと言うと「待って」に聞こえるが、But のあとが本題。認めてから向きを変える型。',
      use: 'Honestly, I’m scared too. But we’ve got this.（正直、私も怖い。でも大丈夫）' },

    // why: have it in ← "at" and "in" both shrink before "the"; head out to ← "have it at" ≈ ハヴィラッ is close to
    //   "head out", and "head out" is said in the crowd before
    { id: 's1', skill: 'sound', level: 'B2', point: 'haveit', seg: [130.6, 135.2],
      stem: 'Fill the gap: “So let’s ___ the hospital.”',
      choices: ['have it at', 'have it in', 'head out to'], a: 0,
      cue: '「So let’s」のあと、つながった3語。',
      line: 'So let’s *have it at* the hospital.',
      said: '「だから病院で産もう」と言う。it は赤ちゃん。',
      mean: 'have it at が「ハヴィラッ」とつながり、t はラ行に近い。',
      trap: 'head out to でも意味は通るが、直前の have a baby を受けて have it。前の動詞が手がかり。',
      use: 'Let’s have it at my place.（うちでやろうよ）' },

    // why: three ← "four and three minutes" is said right after, as the steps they missed; five ← "warn me at five
    //   minutes" is the number said with weight
    { id: 'n2', skill: 'number', level: 'B1', point: 'apart', seg: [135.2, 149.65], keep: true,
      stem: 'How far apart are the contractions now?',
      choices: ['Two minutes', 'Three minutes', 'Five minutes'], a: 0,
      cue: '「contractions」の質問への、最初の答え。',
      line: '*Two minutes* apart.',
      said: '陣痛の間隔を聞かれ、「2分おき」と答える。',
      mean: 'two minutes apart ＝ 2分ごとに来る。間隔が短いほどお産が近い。',
      trap: 'あとで five や three も出てくる。数字が続いたら、どの質問への答えかで選ぶ。',
      use: 'The buses come ten minutes apart.（バスは10分おきに来る）' },

    // R fix: blind 65 %: "reminded of the time, since she asked" didn't fit the scene (she never asks); now a
    //   literal "check the way" reading, and the key shares the distractors' "asked"
    // why: which hospital ← "where you're going" read as a real question about a place; the way ← "you know where
    //   you're going?" read literally, as a check that she knows the route
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'quiz', seg: [148.9, 161.95],
      stem: 'In the quick questions to Pam after “Pamela”, what is going on?',
      choices: ['She’s asked so that she says the plan herself', 'She’s asked which hospital she would like',
                'She’s asked to confirm she knows the way'], a: 0,
      cue: '答えが返ったあとの「Yes」に注目。',
      line: 'You know where you’re going? — *The hospital.* — *Yes*, you are.',
      said: '「どこへ行く？」「病院」「そう！」と、答えの決まった質問を重ねる。',
      mean: '分かりきった質問に本人が答えることで、行く気にさせる応援。',
      trap: 'where や what time を本当の質問と取りやすい。答えに Yes で応じたら、確認でなく後押し。',
      use: 'And what are we going to do? Win!（で、どうする？勝つ！）' },

    // R fix: V4: a name plus its order is a detail, not a who told by voices; skill now `detail` (id kept)
    // why: phones ← Stanley's order opens the list; water ← Meredith's order comes right before Erin's
    { id: 'w1', skill: 'detail', level: 'B1', point: 'stations', seg: [162.6, 169.05],
      stem: 'In the burst of orders, what is Erin told to do?',
      choices: ['Call an ambulance', 'Man the phones', 'Get a bottle of water'], a: 0,
      cue: 'Erin の名前のすぐあとの動詞。',
      line: 'Erin, *call an ambulance*, please.',
      said: '「Stanley は電話番、Meredith は水、Erin は救急車」と次々に指示する。',
      mean: '名前を呼んでから用件を言う形。誰に何を頼んだかは名前の直後で決まる。',
      trap: '指示が早口で並ぶので、となりの指示と混ざりやすい。名前と動詞の組で追う。',
      use: 'Ken, grab the bags. Amy, call a taxi.（ケンは荷物、エイミーはタクシーを）' },

    // why: drive himself ← "we're driving ourselves" comes right after, so it sounds like the reason; cost ← the
    //   familiar worry about what an ambulance costs
    { id: 'd2', skill: 'detail', level: 'B1', point: 'ambulance', seg: [167.7, 174.7],
      stem: 'Why is the call for an ambulance turned down?',
      choices: ['Ambulances are only for emergencies', 'Jim would rather drive Pam there himself',
                'Calling one would cost them too much'], a: 0,
      cue: '「No, no, no」のすぐあとの理由。',
      line: 'No, no, no, *ambulances are emergencies only*.',
      said: '救急車を呼べという指示を「だめだめ、救急車は緊急時だけ」と止める。',
      mean: '出産は緊急ではない、という理屈。陣痛2分おきの場面なので、ずれている。',
      trap: 'すぐあとの「自分たちで運転する」を理由と取りやすい。No のすぐ後ろが理由。',
      use: 'This number is for emergencies only.（この番号は緊急時専用です）' },

    // why: police drive ← cops and cars go together, and an escort comes later; both calls ← "you call…, I call…" heard
    //   as splitting two calls
    { id: 'i2', skill: 'infer', level: 'B2', point: 'ambulance', seg: [167.7, 174.7],
      stem: 'What does the line about calling the cops warn?',
      choices: ['A call for an ambulance would be reported', 'The police could drive Pam there instead',
                'Both calls are needed, just to be safe'], a: 0,
      cue: '対になった二つの文の形と、直前の No。',
      line: '*You call the ambulance, I call the cops.*',
      said: '「救急車を呼ぶなら、こっちは警察を呼ぶ」と言う。',
      mean: '「おまえがAなら、こっちはB」は脅しの形。救急車の使い方がおかしいと通報する、ということ。',
      trap: '分担に聞こえるが、直前の No, no, no が反対の合図。対になった文は脅しのことも。',
      use: 'You touch my fries, I eat your cake.（私のポテトに手を出したら、ケーキ食べるよ）' },

    // R fix: blind 60 %: "not allowed to drive a work car" had nothing in the scene behind it; now a role reading
    // why: sit with Pam ← "I will drive you" heard as a split of jobs, so Jim's job is to look after her; no car ←
    //   "we're driving ourselves" just before, so the problem sounds like a missing car
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'condition', seg: [173.55, 178.5],
      stem: 'Why is Jim told he shouldn’t drive?',
      choices: ['He’s too shaken up to drive safely', 'He should sit in the back with Pam',
                'He doesn’t have his own car here'], a: 0,
      cue: '「Jim」の直後、no のあとの名詞。',
      line: 'Jim, you are *in no condition to drive*.',
      said: '「Jim、君は運転できる状態じゃない。私が運転する」と言う。',
      mean: 'in no condition to ～ ＝ ～できる状態にない。慌てた Jim を見ての言葉。',
      trap: 'condition を「条件」と取ると役割の話に聞こえる。ここでは体や心の「状態」。',
      use: 'You’re in no condition to work today.（今日は働ける状態じゃないよ）' },

    // R fix: blind 80 %: the key explained the sarcasm and "relieved… easier to carry" was a filler; all three now
    //   give a feeling plus a reason from the scene
    // why: amused ← "great" said lightly after a mix-up can be a laugh; calm ← "now" heard as "at least we know now"
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'gobag', seg: [180.5, 186.5],
      stem: 'When he learns the go bag is empty, how is his “Okay, great” meant?',
      choices: ['Annoyed; the news comes far too late', 'Calm; better to find out before they go',
                'Amused; the mix-up strikes him as funny'], a: 0,
      cue: '「telling me now」の now に込めた気持ち。',
      line: 'You are telling me *now* that there is nothing in it? *Okay, great.*',
      said: 'バッグが空だと聞き、「今それを言う？ ああ、最高だね」と返す。',
      mean: 'great は皮肉で「最悪」。you are を縮めず、今さらの不満をぶつけている。',
      trap: 'great を軽く取ると笑いに聞こえる。悪い知らせの直後の great は皮肉を疑う。',
      use: 'Oh, great. Just what I needed.（ああ最高。ちょうど欲しかったよ）' },
  ]
};
