// REVIEW 2026-11-16: pass 8, fix 15, drop 1, new 0; ear checks 3
// “Therapy with Toby - The Office US” (the official The Office channel, BEST OF SEASON 7 - The Office US): after a
// "corporate punishment", Michael owes six hours of counseling with Toby and stalls; Toby pretends to give up and
// offers games, Michael opens up (Jeff, the pitcher, the dog), Toby names his need to be liked, and Michael, seeing the
// trick, attacks Toby's marriage until Toby lets him fill in the forms himself.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Michael (37 s, 91.7 s, 149 s, 267 s),
// Toby (108.2 s, 110.1 s). The speaker of "Michael's been assigned…" (37 s) isn't settled: no item depends on it.
// EAR CHECK: 228.5 s i2 — whisper "to find a kid he liked better", captions "to find a kitty like better". The key also
//   rests on "playing with another kid" (224.5 s), where both agree
// EAR CHECK: 212.6 s g2 — "It's working. I'm doing it." is Toby to camera (assumed; it follows his own plan)
// EAR CHECK: 290.6–300.4 s h3 g1 — "Just fill them out any way you want" is Toby; "Thank you, doctor. Take two of these
//   and call me in the morning" is Michael (assumed from the content; no address settles it)
// Untested on purpose: 0–21 s (whisper lumps the opening; captions start at 15.9 s and the target of "You are the
// worst" is unclear); 41–50 s words around "a chance" (captions "huh a chance to do something good", whisper "I got a
// chance there's something good": lines skip them with …); 51–61 s ("see you naked", "molest me"); 110–148 s (the
// "penis… peas" and "probed by Alf… lower half" stories: sexual); 263 s and 267 s (bleeped); 293–296 s (captions "Have
// Aaron faxing back to court", whisper "fax them back to court ready").
import type { Clip } from '../types.ts';

export const tobyTherapy: Clip = {
  id: 'tobytherapy', video: 'a9oKQlxeYOM', title: 'Therapy with Toby - The Office US', dur: 323, wpm: 141,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: whole company ← "corporate" read literally as 会社の; company punished him ← "my punishment" comes next
    { id: 'h1', skill: 'humor', level: 'C1', point: 'corporate', seg: [21.2, 27.3],
      stem: 'When Michael owns up to what he did, why does his wording get a laugh?',
      choices: ['He mixes up a word: he means hitting someone', 'He admits he punished the whole company',
                'He jokes that the company punished him'], a: 0,
      cue: 'punishment の前の一語。似た音の別の語がある。',
      line: 'I committed *corporate punishment*. My bad.',
      said: '「会社的な罰を犯した。悪かったね」。',
      mean: '本当は corporal punishment（体罰）。似た音の corporate（会社の）と取りちがえている。',
      trap: 'corporate を「会社全体」と取ると話が大きすぎる。妙な語は似た音の語を疑う。',
      use: 'Sorry, wrong word. I meant “borrow.”（ごめん、言いたかったのは borrow）' },

    // R drop: d1 (V2). The title (“Therapy with Toby”) answers it, and n1 already turns on the same line.

    // why: one hour ← "one hour" is said three times later; sixteen ← "six" with a stretched vowel heard as -teen
    { id: 'n1', skill: 'number', level: 'B1', point: 'hours', seg: [36.4, 40.5], keep: true,
      stem: 'How many hours of sessions must Michael do in all?',
      choices: ['One hour', 'Six hours', 'Sixteen hours'], a: 1,
      cue: 'assigned のすぐあとの数字。',
      line: 'assigned *six hours* of mandatory counseling',
      said: '「6時間の義務のカウンセリングが課された」と説明される。',
      mean: 'six は短く、語尾の「クス」で切れる。sixteen なら後ろが強く長い。',
      trap: 'あとで one hour が何度も出るので混ざりやすい。全体の時間と、終わった時間を分けて聞く。',
      use: 'It’s a six-hour flight.（6時間のフライトです）' },

    // R fix: V2/K6. The key was the only kind choice next to a filler ("get back at Michael"). Now three readings of
    //   what he says: routine box-ticking, showing off the degree, doing good.
    // why: routine ← "standard questions… check off a few boxes" is said, but about other people; degree ← "I actually
    //   have a degree in social work" opens the turn, so the point seems to be the degree
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'goodhere', seg: [40.3, 50.7],
      stem: 'In his comment to the camera, how does Toby see these sessions?',
      choices: ['As a real chance to do some good', 'As routine: a few questions, then done',
                'As a chance to show off his degree'], a: 0,
      cue: 'but のあとに来る、自分の考え。',
      line: 'a lot of people would just ask a few standard questions… *but*… a chance to *do something good* here.',
      said: '「普通は決まった質問で項目に印をつけるだけ。でもここでいいことができる」とトビー。',
      mean: '型通りでなく、本気で助けたいという意気込み。',
      trap: 'standard questions から「退屈な仕事」と取りやすい。but のあとが本音。',
      use: 'I see a chance to do some good.（何か役に立てそうな気がする）' },

    // why: were ← "we're" and "were" both shrink to "wer"; aren't/weren't ← an "n" imagined in the fast start
    { id: 's2', skill: 'sound', level: 'B2', point: 'blinds', seg: [61.6, 66.0],
      stem: 'Fill the gap: “___ leave the blinds open so everybody can see.”',
      choices: ['We’re gonna', 'We were gonna', 'We aren’t gonna', 'We weren’t gonna'], a: 0,
      cue: '文頭の短い語。否定の「ン」があるか。',
      line: '*We’re gonna* leave the blinds open so everybody can see…',
      said: '「ブラインドは開けておく。みんなに見えるように」と言う。',
      mean: 'We’re は「ウィア」と短く、gonna とつながる。これからそうする、という宣言。',
      trap: 'were なら「そのつもりだった」で話が終わってしまう。開けておく理由が続くので、今の宣言。',
      use: 'We’re gonna leave the door open.（ドアは開けておくね）' },

    // R fix: V2. A 3-way pick where "they've done" ruled out the whole six; a fourth near sound added. Segment end moved
    //   off "hours" (it ended 0.1 s after it).
    // why: six ← "all six hours" ends the same turn; half an hour ← "one" heard as a weak "an"; two ← "want to do"
    //   heard as "two"
    { id: 'n2', skill: 'number', level: 'B1', point: 'onehour', reveals: ['hours'], seg: [71.2, 82.9], keep: true,
      stem: 'When Michael cuts Toby off, how much time does he say they’ve done?',
      choices: ['Half an hour', 'One hour', 'Two hours', 'Six hours'], a: 1,
      cue: 'flavor of のあと、くり返される数字。',
      line: '*One hour.* We’ve done *one hour*. … I want to do all six hours.',
      said: 'トビーの質問をさえぎり「1時間。1時間やった」と言い、「6時間全部やりたい」と続ける。',
      mean: '話の中身でなく時間だけを数えている。会話より、早く終えることが目的。',
      trap: '最後の six hours が耳に残りやすい。終わった時間と、全部の時間を分けて聞く。',
      use: 'We’ve done one hour. Five to go.（1時間終わった。あと5時間）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'speedup', seg: [76.4, 80.4],
      stem: 'Type what Michael says: “Let’s just ___, okay?” (3 words)', answer: 'speed this up',
      cue: 'just のあと少し間があり、短い3語が続く。',
      line: 'Let’s just *speed this up*, okay?',
      said: '「さっさと進めよう、いいね？」と言う。',
      mean: 'speed up ＝ 速める。this が間に入り、「スピーディサップ」のようにつながる。',
      trap: 'this と up がつながり一語に聞こえやすい。speed up の間に目的語が入る形に慣れておく。',
      use: 'Can we speed this up a little?（もう少し急げますか）' },

    // R fix: V2/N7. "Half an hour" was a filler and the key the only conditional; the can/can't near miss now faces
    //   it. Its stem and line give away n2's "one hour", so it reveals `onehour`. Segment was 2.6 s: now starts at
    //   "do all six hours". The cue named "count", a word only the key had.
    // why: even if silent ← "can't" heard as "can" (the t drops); signs ← the boxes and forms of Toby's job
    { id: 'd2', skill: 'detail', level: 'B2', point: 'cant', reveals: ['onehour'], seg: [81.5, 84.7],
      stem: 'What does Toby say about the hour Michael has just sat through?',
      choices: ['It won’t count unless Michael talks', 'It counts even if Michael says nothing',
                'It counts once Michael signs the form'], a: 0,
      cue: 'the hour の前の短い語と、if のあと。',
      line: 'Look, I *can’t count the hour* if you don’t talk.',
      said: '「話してくれないと、その1時間は数えられない」とトビー。',
      mean: '黙って座るだけでは、義務の時間に入らない、という条件。',
      trap: 'can’t の t が消えて can に聞こえやすい。if you don’t のあとの条件で意味を確かめる。',
      use: 'I can’t help you if you don’t call.（電話をくれないと助けられないよ）' },

    // R fix: V2/S1. The stem's "only has to sit there" pointed at prison, and the choices weren't parallel. The stem
    //   now names the moment only; all three choices are "a … to …".
    // why: work shift ← "six hours… time" heard as working hours (putting in my time); class ← "sit here" plus "my
    //   rights" heard as a student's complaint
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'dotime', reveals: ['hours'], seg: [82.1, 91.5],
      stem: 'How does the short phrase ending Michael’s “I know my rights” turn frame it?',
      choices: ['As a jail term to serve out', 'As a work shift to clock in for', 'As a class to sit through'], a: 0,
      cue: '文末の短い3語。どこで使う言い方か。',
      line: 'I know my rights. All I had to do is sit here for six hours. *Do my time.*',
      said: '「6時間座っていればいい。刑期を務めるだけ」と言う。',
      mean: 'do time ＝ 刑期を務める。rights と合わせ、刑務所に入った人のつもりで話している。',
      trap: 'time を「勤務時間」と取りやすい。my rights と並ぶと刑務所の言葉と分かる。',
      use: 'Just doing my time until Friday.（金曜までの辛抱だ）' },

    // R fix: V2. "Explain the rules" was a filler, and the counselor's script gave the key away. Now: invite / calm down /
    //   challenge. Ear check dropped: Michael's "Yes, I will. I will talk" answers "Tell me!", so the turn is Toby's.
    // why: calm down ← the Japanese frame of soothing an angry person first; challenges ← "Tell me!" said loudly, heard
    //   as "go on then, prove it"
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'tellme', reveals: ['somewhere'], seg: [91.2, 103.0],
      stem: 'When Michael asks if Toby knows how angry he is, what does Toby do?',
      choices: ['Eagerly invites him to say more', 'Urges him to calm down first',
                'Challenges him to back up his words'], a: 0,
      cue: '怒りを伝えられたあとの短い返事と、その次の一言。',
      line: 'You have any idea how angry that is making me? — *Tell me!* … I think we might… really *get somewhere*.',
      said: '「どれだけ腹が立ってるか分かる？」に「話して！」、そして「進みそうだ」と喜ぶ。',
      mean: '怒りを言葉にさせるのはカウンセリングの狙い。挑発でなく、話してほしいという誘い。',
      trap: '強い Tell me! はけんかを買うようにも聞こえる。次の一言で狙いが分かる。',
      use: 'Tell me. I’m listening.（話して。聞いてるから）' },

    // anchor: 100.3–102.4 s both sources have "we might be about to maybe really get somewhere", about 11 words in 2 s
    { id: 'c1', skill: 'dict', level: 'C2', point: 'somewhere', seg: [99.6, 103.2],
      stem: 'Type the hedges: “I think we ___ really get somewhere.” (5 words)', answer: 'might be about to maybe',
      cue: 'I think we のあと、弱い語が5つ一気に続く。',
      line: 'I think we *might be about to maybe* really get somewhere.',
      said: '「もしかすると、ひょっとしたら本当に進めるかも」と、弱い語を早口で重ねる。',
      mean: 'might と maybe は意味が重なり、文法なら一つでいい。期待しすぎて逃げられないよう弱めた跡。',
      trap: '文法で maybe を消したくなるが、聞こえた音を書く。about to は「アバウタ」。',
      use: 'We might maybe make it on time.（ひょっとしたら間に合うかも）' },

    // why: real promise ← "Yes, I will" taken at face value after Toby's hopeful line; sarcasm ← "all right" heard as
    //   "yeah, right", a refusal
    // anchor: 103.8–108.2 s "I will talk, all right", then to camera "Be careful what you wish for, Toby": he will talk,
    //   and Toby won't like it (the stories that follow are nonsense)
    { id: 'c2', skill: 'infer', level: 'C2', point: 'wish', seg: [99.6, 109.2],
      stem: 'After his comment to the camera, how should we hear Michael’s promise to talk?',
      choices: ['As a threat: his talk will only cause Toby trouble', 'As a real promise: he is ready to open up at last',
                'As sarcasm: he means he will go on saying nothing'], a: 0,
      cue: '約束のあと、カメラに向けた一言。',
      line: 'Yes, I will. I will *talk, all right*. … *Be careful what you wish for*, Toby.',
      said: '「ああ、話すとも」と言い、カメラに「望みには気をつけろ、トビー」。',
      mean: 'all right は「たっぷり話してやる」の強調。カメラへの一言が、協力の約束を脅しに変える。',
      trap: 'Yes, I will だけなら前向きな約束。皮肉の「話さない」なら、カメラに警告する意味がない。',
      use: 'Careful what you wish for.（願いごとには気をつけて）' },

    // R fix: V2. "Asks him straight out" was the plain script against a twist key. It's now Toby's daughter, who is
    //   named in the segment. The trap had a broken character (U+FFFD), now repaired.
    // why: the warning ← Toby's earlier "I can't count the hour" was a push, but it only got nonsense stories;
    //   daughter ← "in case my daughter ever comes over" is said, but only about the games
    { id: 'g2', skill: 'gist', level: 'B2', point: 'tactic', seg: [148.0, 216.6],
      stem: 'What finally gets Michael talking about his childhood?',
      choices: ['Toby acts as if he has given up on the session', 'Toby warns that the hours won’t count otherwise',
                'Toby opens up first about his own daughter'], a: 0,
      cue: '「もう無理だ」と言ったあとの提案と、カメラへの一言。',
      line: 'You’re right. You win. This is pointless… *It’s working. I’m doing it.*',
      said: '「君の勝ちだ、無意味だ」と引き、ゲームで時間をつぶそうと言う。あとでカメラに「効いてる」。',
      mean: 'あきらめたふりで気を抜かせる作戦だった。',
      trap: '「数えられない」という警告は、ふざけた話しか引き出せなかった。効いたのは押すのをやめたこと。',
      use: 'Okay, you win. Let’s just relax.（分かった、君の勝ち。気楽にいこう）' },

    // R fix: V2/N7. The key was the only soft choice, and "all six hours" in a distractor gave away n1. New choices are
    //   parallel and name no number.
    // why: hurry ← "run" read literally, plus Michael's earlier "speed this up"; end early ← "clock" heard as "clock
    //   out" (退勤), after Toby's "This is pointless"
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'clock', seg: [153.7, 164.5],
      stem: 'What does Toby suggest they do with the rest of the time?',
      choices: ['Let the time run down without real work', 'Hurry to get through the rest of the hours',
                'End early and report the hours as done'], a: 0,
      cue: 'Why don’t we just のあと、時計を使った言い方。',
      line: 'Why don’t we just *run out the clock* by playing games, drawing some pictures…',
      said: '「ゲームや絵で、時間を使い切ろう」と提案する。',
      mean: 'run out the clock ＝ スポーツで残り時間を流すこと。ここでは面談の時間をただ過ごす。',
      trap: 'run を「急ぐ」と取りやすい。by playing games と続くので急ぐ話ではない。',
      use: 'Let’s just run out the clock.（あとは時間が過ぎるのを待とう）' },

    // R fix: V2. "Had not known his mom married Jeff" was absurd (he says so himself). Now the "I guess" hedge read as
    //   doubt; the key keeps his own framing.
    // why: not sure ← "I guess" read as real doubt (Japanese 〜かな); forgotten ← "once or twice with Jeff" heard as a
    //   faint memory, though he brought Jeff up himself. Segment trimmed from 15.5 s to 15 s.
    { id: 'i3', skill: 'infer', level: 'C1', point: 'jeff', seg: [172.5, 187.5],
      stem: 'When Toby restates who Jeff was, what does Michael’s answer reveal?',
      choices: ['He had only seen Jeff as his mom’s boyfriend', 'He wasn’t sure his mom had really married Jeff',
                'He had forgotten about Jeff until that moment'], a: 0,
      cue: '言いかえを聞いたあとの、少し間のある返事。',
      line: 'Jeff was my mother’s boyfriend, who she married. — So… *your stepdad*. — Yeah, I guess I *never thought of it that way*.',
      said: '「ジェフは母の彼氏で、母が結婚した人」。「つまり継父」に「そう考えたことはない」。',
      mean: '父と呼ばず「母の彼氏」のまま。家族として受け入れていなかった。',
      trap: 'I guess を「よく分からない」と取りやすいが、結婚は本人が先に言っている。',
      use: 'I never thought of it that way.（そんなふうに考えたことなかった）' },

    // R fix: S4. The segment was 22.5 s for a detail; now 12.7 s, from “It was weird” to “taking the pitcher out”. The
    //   trap had a broken character (U+FFFD), now repaired.
    // why: Jeff… manager ← "Jeff said… the manager" is the story's other half; lost ← "took the pitcher out of the
    //   game" heard as the team losing
    { id: 'd4', skill: 'detail', level: 'B1', point: 'pitcher', seg: [195.4, 208.05],
      stem: 'Why did Michael feel bad at the baseball game?',
      choices: ['The pitcher couldn’t play with his friends anymore', 'Jeff spent the game talking about the manager',
                'His team lost after the pitcher was taken out'], a: 0,
      cue: 'felt really bad because のあと。',
      line: 'I felt really bad *because the pitcher wasn’t going to be able to play with his friends* anymore.',
      said: '「投手が交代させられ、もう友だちと遊べないと思って悲しかった」。',
      mean: '交代を「仲間外れ」と受け取る、子どもの見方。',
      trap: 'took the pitcher out から「負けた」と想像しやすい。because のあとをそのまま聞く。',
      use: 'I felt bad because I forgot her birthday.（誕生日を忘れて悪いと思った）' },

    // R fix: V2. "Toby gives up" was the only ending with a clash in it, and a3's stem ("his attack") and h3's choice
    //   ("after the fight") stated it; those are reworded. The court distractor now uses a word that is said.
    // why: thanks ← "Thank you, doctor" at the very end taken at face value; court ← "fax them back to court" heard
    //   as Toby reporting him
    { id: 'g1', skill: 'gist', level: 'B2', point: 'ending', reveals: ['trick', 'doctor', 'marriage'], seg: [212.4, 301.5],
      stem: 'How do the sessions end?',
      choices: ['Michael turns on Toby, and Toby lets him off', 'Michael thanks Toby and agrees to come back',
                'Toby ends early and reports Michael to court'], a: 0,
      cue: '最後の数分、話している量の差と、書類の渡し方。',
      line: 'You can’t help anybody… — *Just fill them out any way you want.*',
      said: '話させられたと気づいたマイケルが結婚まで持ち出して責め、トビーは書類を好きに書かせる。',
      mean: '心を開きかけた面談が、マイケルの反撃で終わる。',
      trap: '最後の Thank you だけでは円満に聞こえる。その前の攻撃と、トビーの短い返事を聞く。',
      use: 'Fine. Do it any way you want.（もういい、好きにして）' },

    // R fix: V2/V4. The key was the only abstract, psychological choice (65 % blind), and the item asked a stated
    //   reason ("I was afraid I would…", "to find a kid he liked better"), so it's a detail now. The choices are three
    //   fears. Segment trimmed from 23.3 s to 13.5 s (ends on "liked better").
    // why: hurt ← the Japanese frame of worrying for a lost pet; teased ← "another kid" and "park" said, in the wrong
    //   relation
    // retired: the ear-check policy: the key needs “a kid he liked better” (whisper; the captions have “a kitty like
    //   better”, 228.5 s); back after the ear check
    { id: 'i2', skill: 'detail', level: 'B2', point: 'dog', seg: [216.4, 229.9], retired: true,
      stem: 'Why did Michael stay away from the park after his dog ran away?',
      choices: ['He was afraid the dog liked another kid better', 'He was afraid of finding the dog hurt or sick',
                'He was afraid the kids there would tease him'], a: 0,
      cue: 'ran away の理由として、彼が考えていたこと。',
      line: 'he ran away… *to find a kid he liked better*.',
      said: '「犬は自分より好きな子を探しに逃げたと思った」。だから公園が怖かった。',
      mean: '犬の話の形で、もっと好かれる誰かに置いていかれる怖さを語っている。',
      trap: 'afraid と park から犬の身を案じたと取りやすい。怖いのは犬が他の子と幸せそうなこと。',
      use: 'I was afraid you’d find someone better.（もっといい人を見つけるかと不安だった）' },

    // why: games ← Toby's own "just run out the clock by playing games" makes it sound true; not a real counselor ← the
    //   old feud
    { id: 'h2', skill: 'humor', level: 'C1', point: 'session', reveals: ['dog'], seg: [242.0, 253.6],
      stem: 'Why does Michael’s answer to Toby’s question get a laugh?',
      choices: ['It is a counseling session, and he is dodging', 'He means they are only playing games by now',
                'He hints that Toby is not a real counselor'], a: 0,
      cue: '質問をかわす一言と、今いる場の名前。',
      line: 'It’s very important for you to be liked, isn’t it? — Well, let’s not get too… *This isn’t a counseling session.*',
      said: '「好かれるのが大事なんだね」に「まあ…これはカウンセリングじゃないし」。',
      mean: 'まさに面談の最中なのに、図星を突かれて逃げている。本人だけ気づいていない。',
      trap: 'ゲームの時間だから本当に面談ではない、と取りやすい。この面談は罰として決められたもの。',
      use: 'Let’s not get too deep here.（あまり深い話はやめよう）' },

    // R fix: V2/V5/B1. "Write it down" was a filler and the trick key stood alone. "Son of a gun" read as warmth now faces
    //   it. Implicit, from a muttered line and Toby's reply: C1. The key gives away g2's tactic, so it reveals `tactic`.
    // why: dogs ← Toby's "Dogs don't do that" was just agreed with; understands ← "son of a gun" is often affectionate,
    //   and he has just opened up
    { id: 'i4', skill: 'infer', level: 'C1', point: 'trick', reveals: ['tactic'], seg: [254.8, 268.5],
      stem: 'What has Michael realized when he finally speaks after the long pause?',
      choices: ['Toby’s plan to get him talking had worked', 'Toby is someone who truly understands him',
                'Toby was right that dogs don’t do that'], a: 0,
      cue: '長い沈黙のあとの呼びかけと、トビーの返事。',
      line: 'You *son of a gun*. … — I’m just *trying to help you*, Michael.',
      said: '沈黙のあと「この野郎」。トビーは「助けたいだけだよ」。',
      mean: 'son of a gun は「やるな、こいつ」という驚き混じりの一言。うまく話させられたと気づいた。',
      trap: '親しみの言葉にも聞こえるが、すぐ強い悪態に変わる。トビーの返事が気づきの中身を示す。',
      use: 'You son of a gun, you did it!（やるじゃないか、やったな！）' },

    // R fix: V2/B1. The key's "It was a trick" was the only frank choice; all three now have the same shape. It gives
    //   away g2's tactic, so it reveals `tactic`.
    // why: thanks ← the praise taken at face value (the お礼 frame); between us ← "help everybody" heard as worry about
    //   his stories getting out
    // anchor: 259.5–272.1 s "You son of a gun…" (he's been had), Toby's "I'm just trying to help you", then "You're very
    //   helpful, aren't you?" throws "help" back as the charge
    // retired: for the draws: g2 reveals its point (tactic), so play 3+ under g2 drew no C2; c1, c2 remain
    { id: 'c3', skill: 'pragma', level: 'C2', point: 'trick', reveals: ['tactic'], seg: [262.4, 272.5], retired: true,
      stem: 'Which reply from Toby would match what Michael meant by “very helpful”?',
      choices: ['Guilty. I did steer you there.', 'Thanks. I really do try my best.', 'Relax. This stays between us.'],
      a: 0,
      cue: '直前の「この野郎」と、help の言い返し方。',
      line: 'I’m just trying to help you, Michael. … *You’re very helpful, aren’t you?* You try to help everybody.',
      said: '「助けたいだけ」と言うトビーに「本当に親切だね。誰でも助けようとする」。',
      mean: 'ほめ言葉の形の非難。トビーの help をそのまま投げ返し、「親切のふりで操った」と責めている。認める返事が合う。',
      trap: 'ほめ言葉にはお礼、という型で選びやすい。返事は言葉の形でなく、直前に相手がしたことに返す。',
      use: 'Wow, you’re very helpful today.（今日はずいぶん親切だね）' },

    // R fix: V2/S1/K2. The stem said "attack" (g1's key), and "good at board games" can't be refuted from the audio. The
    //   stem now names the moment; the third choice is the compliment read as warming up.
    // why: kind ← "good" read as 善人, with "very helpful" just before; likes him more ← a compliment read as a thaw,
    //   though "But you know what?" follows at once
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'good', seg: [269.0, 278.8],
      stem: 'What does Michael concede with “You are good” before his “But…”?',
      choices: ['That Toby’s trick worked on him', 'That Toby is kind and means well', 'That he likes Toby more than before'],
      a: 0,
      cue: 'another game のあとの短い一言と、その次の but。',
      line: 'Do you want to play another game? *You are good.* But you know what? You can’t help people.',
      said: '「もう一回ゲームする？うまいね。でもな、人は助けられない」。',
      mean: 'You are good ＝「腕がいい、やられた」。作戦が効いたと認める一言。',
      trap: 'ほめ言葉で打ち解けたと取りやすいが、すぐ but で攻撃に戻る。ゲームは話させる道具だった。',
      use: 'You’re good. I didn’t see that coming.（やるね。読めなかった）' },

    // why: could ← the -n't of "couldn't" lost before "help"; can't ← "can't help people" said just before; didn't ←
    //   the past tense caught, the modal missed
    { id: 's1', skill: 'sound', level: 'B2', point: 'marriage', seg: [275.3, 278.8],
      stem: 'Fill the gap: “You ___ your marriage.”',
      choices: ['couldn’t help', 'could help', 'can’t help', 'didn’t help'], a: 0,
      cue: '直前の can’t と比べて、時制と否定の音。',
      line: 'You can’t help people. You *couldn’t help* your marriage.',
      said: '「自分の結婚も救えなかっただろ」と言う。',
      mean: 'couldn’t の t はほぼ消え「クドゥン」。トビーの離婚を突く、いちばんきつい一言。',
      trap: '直前の can’t help に引っぱられやすい。couldn’t は「ク」で始まり、「ン」が残る。',
      use: 'I couldn’t help it.（どうしようもなかった）' },

    // R fix: V2/N7. "After the fight" in a distractor stated g1's ending, and the key was the only role reading. Now
    //   three readings of "doctor": role swap, respect (先生), asking for pills.
    // why: respect ← "doctor" heard as the Japanese 先生, a polite title; pills ← "take two of these" read as asking for
    //   medicine
    { id: 'h3', skill: 'humor', level: 'C1', point: 'doctor', seg: [290.1, 301.5],
      stem: 'Why is Michael’s parting line to Toby funny?',
      choices: ['He plays doctor, as if Toby were his patient', 'He calls Toby “doctor” to show respect at last',
                'He asks Toby for pills to help him calm down'], a: 0,
      cue: '最後の一文は、ふつう誰が誰に言う言葉か。',
      line: 'Just fill them out any way you want. … Thank you, doctor. *Take two of these and call me in the morning.*',
      said: 'トビーが「好きに書いて」と渡し、マイケルは「先生どうも。2錠飲んで朝電話して」。',
      mean: '医者が患者に言う決まり文句。自分が治療した側のように振る舞っている。',
      trap: 'Thank you をお礼と取りやすいが、直前にトビーを泣かせかけた。言う人のずれが笑い。',
      use: 'Get some rest and call me tomorrow.（よく休んで、明日電話して）' }
  ]
};
