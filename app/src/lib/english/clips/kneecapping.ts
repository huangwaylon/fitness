// REVIEW 2026-11-16: pass 16, fix 8, drop 0, new 0; ear checks 2
//   open: pr3 (blind 65 %), r1 (65 %), nt1 (60 %), a2 (55 %), nt2 (50 %, stress) kept; no clean stronger
//   distractor. d3 and a3 were guessed only through other items' stems (i5, s1); those pairs share reveals.
// “The Kneecapping - The Office US” (the official The Office channel, BEST OF SEASON 9 - The Office US): Angela,
// with Dwight beside her, hires Trevor to hurt the person sleeping with her husband; Dwight objects, then gives in;
// later he works out that the target is Oscar, tries to talk Angela out of it, gets Oscar outside and stands between
// him and Trevor.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Angela (26.0 s, 56.8 s), Trevor
// (52.8 s, 225.9 s), Oscar (87.1 s, 145.5 s), Dwight (230.3 s). Untested: 0–36 s speaker turns ("This seems a little
// crazy", "Thank you!"), 139–186 s (the warehouse lure and the "I am Oscar Martinez" mix-up: unclear who is who),
// 229 s on (the scuffle; whisper loops from 237 s).
//   open: 16 s whisper "Murder." (captions lack it; not used); 53.8 s whisper "Yes, a kneecapping", captions "and
//   kneecapping" (not used); 72.6 s whisper "can't scrub worth a damn", captions "can't scrub with a dam" (h1/nt1
//   trim the line at "scrub"); 75.4 s whisper "then it's settled", captions "and it's settled" (pr3 trims to "it's
//   settled"); 208.6 s whisper "father of our child", captions "her child" (nt2's line stops before it); 222–225 s
//   whisper writes "going to", captions "gonna" (same words; s1 keys on the spoken "gonna"); 235 s whisper "masculine
//   issues", captions "masculinity issues" (not used). Speakers assumed from the turns, not named: "Okay, but it's
//   cruel" is Dwight's (he is the one Angela pleads with; pr3 h1 nt1), "The target. It's Oscar, isn't it?" is
//   Dwight's, answering Angela's "Why did you call me out here?" (d2), "That's very effective…" is Trevor's (f2 says
//   "the speaker"), "the hit goes down at four" is Trevor's ("once I leave"; n1 says "the hired man").
// EAR CHECK: 122.75 s r1 — the predict cut falls between “…must be for you.” (ends ≈ 122.5) and “But” (123.04)
// EAR CHECK: 201.8 s nt2 — the second “What is wrong with you?” is Dwight's turn (both sources run it on from
//   Oscar's), with the stress on “you”, not “wrong” (stress item: ship only once confirmed)
import type { Clip } from '../types.ts';

export const kneecapping: Clip = {
  id: 'kneecapping', video: 'qTKbULvknqo', title: 'The Kneecapping - The Office US', dur: 272, wpm: 154,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %). "Cost her husband his job" was a filler; "a husband who cheats" is the near miss on the
    //   same affair (wrong target), refuted by "They're sleeping with my husband" (the target is the other party).
    // why: the husband ← "husband" is said, and in the usual script the wife goes after him; cheated her ← "cheat"
    //   fits an affair story, and the talk opens with money ("half now… off the books… no taxes")
    { id: 'g1', skill: 'gist', level: 'B1', point: 'motive', seg: [0, 83.0],
      stem: 'What brings Angela to this meeting in the first place?',
      choices: ['Revenge on someone sleeping with her husband', 'Revenge on a husband who cheats on her',
                'Revenge on someone who cheated her out of money'], a: 0,
      cue: 'Angela が理由を聞かれて答える一文。',
      said: '「何をされたの」と聞かれ、Angela は「夫と寝ている」相手への仕返しだと答える。',
      mean: '殺しから膝の話に変わっても、目的はずっと夫の浮気相手への仕返し。',
      trap: 'お金や husband の語に引っぱられやすい。相手は夫ではなく、夫と寝ている人。',
      use: 'What brings you here today?（今日はどうされました？）' },

    // R fix: V2 (blind 55 %). "Covers the whole job" was weak; "includes his taxes" puts "taxes", which is said, in
    //   the wrong relation, refuted by "Nice, no taxes".
    // why: up front ← "all" heard with "half now" just before; taxes ← "taxes" is said, so the price seems to
    //   cover them
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'books', seg: [0, 9.2],
      stem: 'Just before “Obviously”, what is being checked about the money?',
      choices: ['That there will be no record of it', 'That all of it is paid up front',
                'That the price includes his taxes'], a: 0,
      cue: '「Obviously」の前の質問と、あとの一言。',
      line: 'And that’s all *off the books*? — Obviously. — Nice, *no taxes*.',
      said: '「全部、帳簿に載らない金だよな？」「当然」「いいね、税金なしだ」。',
      mean: 'off the books ＝ 記録に残さない。だから税金もかからない。',
      trap: 'all を聞くと「全額前払い」と取りやすい。books を本と取らず、帳簿・記録と考える。',
      use: 'They paid him off the books.（記録に残らない形で払った）' },

    // why: done it himself ← "receiving" missed, and a hired thug sounds like the one who does it; seen it ← "end of
    //   that" heard as watching from the side
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'receiving', seg: [41.85, 47.65],
      stem: 'When the paper-bag trick gets praised, how does the speaker know it works?',
      choices: ['People have done it to him many times', 'He has done it to people many times',
                'He has seen it done many times'], a: 0,
      cue: '「I’ve been on the」のあと、どちら側か。',
      line: 'I’ve been *on the receiving end* of that quite a few times.',
      said: '「それは効く。何度もやられた」とほめる。',
      mean: 'on the receiving end ＝ される側。受けた側として効き目を知っている。',
      trap: 'end を「終わり」と取ると意味が消える。receiving（受ける）が聞こえたら「される側」と覚える。',
      use: 'I’ve been on the receiving end of that.（それ、やられたことある）' },

    // why: Angela ← she picks the word up right after ("kneecapping could work"); Dwight ← he had been listing
    //   revenge ideas just before
    { id: 'w1', skill: 'who', level: 'B2', point: 'kneecap', seg: [49.9, 55.6],
      stem: 'Who first suggests a kneecapping?',
      choices: ['Trevor', 'Angela', 'Dwight'], a: 0,
      cue: '提案のすぐあと、呼ばれる名前。',
      line: 'What about a kneecapping? — No, no, *you’re not helping, Trevor*.',
      said: '「膝を狙うのはどう？」という提案に、「ダメだ、口を出すな、Trevor」と返される。',
      mean: '呼ばれた名前が、直前に話した人。そのあと Angela が乗る。',
      trap: 'Angela がすぐ同じ語を言うので、彼女の案に聞こえやすい。止める言葉の宛先で決める。',
      use: 'You’re not helping.（それ、助けになってないよ）' },

    // why: come along ← "be there" read literally as being at the place; his idea ← "you said" heard as "you
    //   suggested it"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'there', seg: [55.6, 61.45],
      stem: 'When Dwight objects, what is Angela doing with her next line?',
      choices: ['Holding him to a promise of support', 'Asking him to come along to the attack',
                'Reminding him the idea was first his'], a: 0,
      cue: 'Dwight の反対のすぐあと、Angela の一文。',
      line: '…you said you would *be there for me*.',
      said: '反対されて、Angela は「支えてくれるって言ったじゃない」と返す。',
      mean: 'be there for ～ ＝ 味方でいる。約束を持ち出し、断りにくくする。',
      trap: 'be there を「その場にいる」と取ると「一緒に来て」に。for me なら「支える」。',
      use: 'I’ll always be there for you.（いつでも味方だよ）' },

    // why: milder plan ← "but it's cruel" heard as a condition (agree only if it's softened); leave ←
    //   "Okay" as a closing word (じゃあ)
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'okay', seg: [62.9, 77.7],
      stem: 'After the long pause, what does Dwight’s “Okay” tell Angela?',
      choices: ['He’ll go along with it, though he objects', 'He’ll agree if they pick a milder plan',
                'He’s done talking and wants to leave'], a: 0,
      cue: '長い間のあと。次の人の一言も手がかり。',
      line: 'Okay, but it’s cruel… — All right, … it’s *settled*. *One kneecapping*.',
      said: '長い沈黙のあと「わかった、でもひどいな」と言い、すぐ「決まり」となる。',
      mean: 'Okay, but ～ は、文句を言いつつ受け入れる形。',
      trap: 'but で「やはり反対」と取りやすい。but のあとが小さな文句なら、Okay が返事。',
      use: 'Okay, but just this once.（いいよ、でも今回だけ）' },

    // why: praying ← "knees" → kneeling, with the scene's moral words ("make this right"); dancing ← "damaged knees"
    //   heard as a dancer's injury; all three are odd worries, so only "scrub" settles it
    { id: 'h1', skill: 'humor', level: 'C1', point: 'scrub', seg: [67.7, 74.1],
      stem: 'When Dwight calls the plan cruel, what makes his reason funny?',
      choices: ['His worry is her cleaning, not her pain', 'His worry is her praying, not her pain',
                'His worry is her dancing, not her pain'], a: 0,
      cue: '「cruel」の理由で、何を心配しているか。',
      line: 'it’s cruel, ’cause a woman with damaged knees *can’t scrub*…',
      said: '「ひどいよ。膝を痛めた女性は、床みがきができない」と理由を言う。',
      mean: 'ひどい理由が、痛みではなく掃除ができないこと。理由がずれているのが笑いどころ。',
      trap: 'knees から祈りや踊りを連想しやすい。cause のあとの動詞まで聞くと、ずれに気づける。',
      use: 'That’s a little harsh, don’t you think?（ちょっとひどくない？）' },

    // why: Angela's knees ← scope shift: "a woman" heard as the only woman there, Angela; knew all along ← sincerity
    //   flip: since he names Oscar soon after, the line is heard as a sly joke
    // anchor: 69.8–73.4 s "it's cruel, 'cause a woman with damaged knees can't scrub" (about the target); 85.4–90.6 s
    //   "The target. It's Oscar, isn't it? He and the senator…": the target is a man, and "isn't it?" checks a new guess
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'scrub', seg: [67.7, 91.2],
      stem: 'Set against what comes out later, what does the “damaged knees” line show?',
      choices: ['Dwight pictured the target as a woman', 'Dwight feared for Angela’s knees, not the target’s',
                'Dwight already knew and was joking'], a: 0,
      cue: '膝の話の「誰の膝か」と、少しあとの名前。',
      line: 'a *woman* with damaged knees can’t scrub… — It’s *Oscar*, isn’t it? *He* and the senator…',
      said: '「膝を痛めた女性は掃除ができない」と言い、少しあとで「標的は Oscar だろう？」と言う。',
      mean: '聞いたのは「夫と寝ている相手」だけ。女性と決めつけていた。あとの名前が前の一言を書きかえる。',
      trap: 'a woman を Angela と取りやすいが、話題は標的。前の一言は、あとの事実と並べる。',
      use: 'Wait, I assumed you meant someone else.（あ、別の人のことだと思ってた）' },

    // why: one ← "One kneecapping" said just before; two ← "goes down at" running into the number, heard as "to"
    { id: 'n1', skill: 'number', level: 'B1', point: 'four', seg: [77.4, 83.1],
      stem: 'What time does the hired man say the attack will happen?',
      choices: ['At one o’clock', 'At two o’clock', 'At four o’clock'], a: 2, keep: true,
      cue: '「goes down at」のあとの数字。',
      line: 'Now the hit *goes down at four o’clock*.',
      said: '「決行は4時。俺が出たら後戻りはできない」と言う。',
      mean: 'go down ＝（計画が）実行される。four o’clock は「フォーラクロック」とつながる。',
      trap: '直前の One kneecapping の one が残りやすい。時刻は at の直後。',
      use: 'Let’s meet at four o’clock sharp.（4時ちょうどに会おう）' },

    // R fix: V2 (blind 50 %). "Called the hit off" swapped for "ask what the target did", a near miss about the same
    //   person, refuted by "It's Oscar, isn't it?" (he checks who, not what).
    // why: what they did ← "The target." as the topic, heard as the start of a question about the affair; on his way ←
    //   "He's here" a little later, and "the hit goes down at four o'clock" just before
    { id: 'd2', skill: 'detail', level: 'B1', point: 'callout', seg: [83.0, 88.6],
      stem: 'Why has Dwight called Angela out here?',
      choices: ['To confront her about who the target is', 'To ask her what the target did to her',
                'To warn her the hired man is on his way'], a: 0,
      cue: '「call me out here」への、短い答え。',
      line: 'Why did you call me out here? — *The target.* It’s Oscar, isn’t it?',
      said: 'なぜ呼び出したのかと聞かれ、「標的のことだ。Oscar だろう？」と答える。',
      mean: '名詞だけの短い答えで用件を示す。isn’t it? は、つかんだ答えを確かめる付け方。',
      trap: '呼び出しは警告や事情を聞く話と予想しやすい。最初の短い答えが用件。',
      use: 'Why did you call me here?（なんで呼び出したの？）' },

    // R fix: V2 (blind 60 %). "Help the hired man find Oscar" was easy to reject; "find out if the affair is true"
    //   follows "Oh, don't lie", refuted by "I'm trying to save those precious knees" (he already knows).
    // why: affair true ← "I don't know what you're talking about" / "Oh, don't lie" sound like checking; confess ←
    //   "Oh, don't lie" and the talk of the affair outside
    { id: 'g2', skill: 'gist', level: 'B2', point: 'save', reveals: ['tribe'], seg: [83.0, 229.6],
      stem: 'After the target is named, what does Dwight try to do?',
      choices: ['Keep Oscar away from the hired man', 'Find out if the affair is really true',
                'Get Oscar to confess to Angela'], a: 0,
      cue: 'Oscar を連れ出す理由と、Trevor への最後の一言。',
      said: 'Oscar が標的と分かると、彼を外へ連れ出して事情を話し、Trevor を止めようとする。',
      mean: '一度は折れたが、同僚と知って守る側に回る。',
      trap: '浮気の話から、確かめる・白状させる目的に見える。save などの動詞で目的が分かる。',
      use: 'Don’t worry, I’ve got your back.（大丈夫、守るから）' },

    // why: voice ← "a different story" heard as how she sounds; eyes ← the usual tell for lying (the common script)
    { id: 'd3', skill: 'detail', level: 'B1', point: 'nostrils', reveals: ['again'], seg: [91.3, 99.6],
      stem: 'When Angela denies it, how does Dwight say he can tell she’s lying?',
      choices: ['Her nostrils flare when she lies', 'Her voice goes up when she lies',
                'Her eyes look away when she lies'], a: 0,
      cue: '「Your」で始まる一文と、その次の文。',
      line: 'Your *nostrils* tell a different story. They *flare*…',
      said: '否定する Angela に「鼻の穴は別の話をしてる。嘘のたびに広がる」と言う。',
      mean: 'flare ＝ 広がる。tell a different story ＝ 言葉と違うことを示す。',
      trap: '嘘のサインは目や声と思いがち。ここは nostrils と言う。',
      use: 'The numbers tell a different story.（数字は違うことを語っている）' },

    // R fix: V2 (blind 70 %). "About to cry" was a filler; "when she is angry" keeps "every time" but swaps the
    //   trigger, refuted by "every time you're engaging in deception".
    // why: cold ← all the talk of her nose, with "again" as "I noticed it earlier"; angry ← "flare" fits anger, and
    //   "every time" heard without what follows
    { id: 'i5', skill: 'infer', level: 'C1', point: 'again', reveals: ['nostrils'], seg: [91.3, 99.6],
      stem: 'What does Dwight’s “Hello again” to her nose suggest?',
      choices: ['She has lied to him this way before', 'She has a cold he noticed earlier',
                'Her nose does this when she’s angry'], a: 0,
      cue: '「again」と、その前の「every time」。',
      line: 'They flare like that *every time* you’re engaging in deception. *Hello again*, naughty nostrils.',
      said: '「嘘のたびに広がる」と言い、鼻に「やあ、また会ったね」と話しかける。',
      mean: 'again と every time で、前にも同じ嘘を見てきたと分かる。',
      trap: '鼻の話なので体調や怒りと結びつけやすい。every time の後ろを聞く。',
      use: 'Hello again, old friend.（やあ、また会ったね）' },

    // why: ashamed ← the Japanese frame: an admission comes with an apology; relieved ← "Fine" read as "okay, I'll
    //   finally tell you"
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'sowhat', seg: [99.4, 102.5],
      stem: 'When Angela finally admits who it is, how does she sound?',
      choices: ['Defiant, as if she has done nothing wrong', 'Ashamed, as if she wants to take it back',
                'Relieved, as if a weight is off her chest'], a: 0,
      cue: '名前を言ったあとの、短い2語。',
      line: 'Fine, … it’s Oscar, *so what*?',
      said: '「もういい、Oscar よ。それが何？」と認める。',
      mean: 'so what? ＝ だから何？ 認めながら、悪いとは思っていないと突っぱねる言い方。',
      trap: '日本語の感覚だと、白状には謝罪が続きそう。Fine もここでは「もういいわ」の投げやりな一言。',
      use: 'Yeah, I’m late. So what?（遅刻したよ。だから何？）' },

    // why: Angela ← right mechanism, wrong target: the line's form is a rebuke of her plan; Oscar ← "a friend", and
    //   Angela's list of what he did behind her back comes next
    // anchor: 102.64–107.44 s "I could understand you wanting to get a stranger's knees whacked, but a coworker, dare
    //   I say a friend?": the objection grants the stranger case, so the line's own logic is the joke
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'stranger', seg: [102.3, 108.0],
      stem: 'In Dwight’s objection about strangers and friends, who is the joke on?',
      choices: ['Dwight, who would only object for a friend', 'Angela, for wanting a friend of hers hurt',
                'Oscar, for going behind a friend’s back'], a: 0,
      cue: '「I could understand」のあと、何を認めているか。',
      line: 'I *could understand* you wanting to get a *stranger’s* knees whacked, but a coworker…',
      said: '「知らない人の膝ならまだ分かる。でも同僚、いや友だちだぞ」と止める。',
      mean: '止めつつ、他人なら暴力もありと認めている。笑われるのは、ずれた線引きをする Dwight 自身。',
      trap: '形は Angela への説教なので、彼女が的に見えやすい。I could understand のあとに基準が出る。',
      use: 'I could understand a day, but a week?（1日なら分かるけど、1週間？）' },

    // R fix: V2 (blind 60 %). "A stranger would deserve it more" was an odd reading; "never really her friend" is the
    //   common comeback, refuted by "Exactly, a friend."
    // why: agrees ← "Exactly" read as giving in (そうね, the Japanese frame); not a friend ← the usual retort to
    //   "dare I say a friend?"
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'friend', seg: [105.4, 118.45],
      stem: 'How does Angela answer Dwight’s point about Oscar being a friend?',
      choices: ['She turns it into her reason to hurt him', 'She agrees and starts to have doubts',
                'She says Oscar was never really her friend'], a: 0,
      cue: '「Exactly」で始まる返事の、その先。',
      line: '*Exactly, a friend.* Someone who sits next to you year after year…',
      said: '「そう、友だちよ。毎年となりで笑顔で話しながら、陰で夫を誘惑した」と返す。',
      mean: 'Exactly で相手の言葉を受け、自分の理由に変える。友だちだから許せない。',
      trap: 'Exactly を同意と取りやすい。受けた言葉を、どちらの主張に使うかを聞く。',
      use: 'Exactly. That’s why I’m upset.（そう。だから怒ってるの）' },

    // predict: the segment stops before "But"; the reveal plays the rest
    // why: forgive ← sympathy, then advice (the counselor script); help ← sympathy before support (he gave in at 68 s)
    { id: 'r1', skill: 'predict', level: 'B2', point: 'imagine', reveals: ['vows'], seg: [118.0, 122.75],
      then: [122.75, 127.7],
      stem: 'After Dwight says he can’t imagine her pain, what kind of line comes next?',
      choices: ['A “but”, then a hard truth about her', 'A plea for her to forgive her husband',
                'An offer to help her carry out the plan'], a: 0,
      cue: '思いやりの一言のあと、どんな話が来やすい？',
      line: 'I can’t even imagine how painful this must be for you. *But* the first ones…',
      said: '「どれほどつらいか想像もできない」のあと、「でも、先に…」と続ける。',
      mean: '相手の気持ちを先に受け止めるのは、言いにくい指摘の前置きになることが多い。',
      trap: '同情の言葉が続けば味方になると考えやすい。英語では、受け止めのあとに but が来やすい。',
      use: 'I totally get it. But here’s the thing…（すごく分かる。でもね…）' },

    // why: husband first ← "the first ones" heard without "were you and me", the usual cheating story; broken up ←
    //   "break" heard as "break up"
    { id: 'i2', skill: 'infer', level: 'C1', point: 'vows', reveals: ['imagine'], seg: [122.5, 127.7],
      stem: 'What does Dwight’s reminder about the marriage vows reveal?',
      choices: ['Angela had cheated with Dwight before this', 'Angela’s husband had cheated on her before',
                'Angela and Dwight had broken up long ago'], a: 0,
      cue: '「were」のあと、誰と誰か。',
      line: 'the first ones to *break your marriage vows* were *you and me*.',
      said: '「でも、先に結婚の誓いを破ったのは君と僕だ」と言う。',
      mean: '怒る Angela も、先に Dwight と浮気していた。責める立場は弱い。',
      trap: 'the first ones だけだと、夫が先と考えやすい。were のあとの you and me が答え。',
      use: 'To be fair, we started it.（正直、始めたのはこっちだよ）' },

    // why: same again ← "there is time" vs "there's no time": the lone "no" is easy to lose, so it sounds repeated;
    //   give time ← "time to explain" heard as asking for time
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', seg: [188.0, 195.6],
      stem: 'After a long pause, what does Dwight’s second line do?',
      choices: ['It takes back what he has just said', 'It says the same thing again, more firmly',
                'It asks Oscar to give him a little time'], a: 0,
      cue: '同じ文が2回。2回目の、小さな一語の差。',
      line: 'There’s *no* time to explain. … Okay, *actually*, there *is* time to explain.',
      said: '「説明する時間はない」のあと、間をおいて「いや、時間はある」と言い直す。',
      mean: 'actually は自分の言葉を直す合図。大げさな一言をすぐ取り消す。',
      trap: 'no time と is time は no の一語の差。くり返しなら no を確かめる。',
      use: 'Actually, I do have a minute.（あ、やっぱり少し時間あるよ）' },

    // why: on "wrong" ← a repeated line heard as the same shock, louder (the echo-for-emphasis pattern); on "what" ←
    //   the question's form taken at face value, as a real request for the problem
    // anchor: 199.84–202.64 s the line twice; 203.6–208.8 s "There are a million gorgeous guys… and you choose the
    //   man…": the second one starts the blame on Oscar, so the contrast falls on "you"
    // retired: C2 stress item, until the ear check (Dwight's turn, the stress on “you”)
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'wrong', seg: [199.3, 209.1], retired: true,
      stem: 'Where is the stress in the second “What is wrong with you?”, and why?',
      choices: ['On “you”: he throws the question back at Oscar', 'On “wrong”: he repeats the same shock, louder',
                'On “what”: he really wants to know the problem'], a: 0,
      cue: '2回目の文で、いちばん強く長い語。',
      line: 'My God, what is wrong with you? — What is wrong with *you*? There are a million gorgeous guys…',
      said: '「なんてことを」と言われ、同じ文を返して「いい男は山ほどいるのに」と責める。',
      mean: 'you を強めると「おかしいのはそっちだ」と責めを返す形。強勢は、誰を責めるかを示す。',
      trap: 'くり返しは驚きの強調に聞こえやすい。すぐあとの and you choose で、責める相手が分かる。',
      use: 'Me? What about you?（僕？君はどうなの？）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'front', reveals: ['actually'], seg: [217.4, 222.0],
      stem: 'Type Dwight’s correction: “Actually, he’s ___.” (5 words)', answer: 'right in front of us',
      cue: '「behind us」の言い直し。最後の語まで。',
      line: 'He could be right behind us. … Actually, he’s *right in front of us*.',
      said: '「すぐ後ろにいるかも」のあと、「いや、目の前にいる」と言い直す。',
      mean: 'in front of us がつながり「インフランタヴァス」に近い。of は弱い。',
      trap: 'of と us が弱く、front で終わった気がしやすい。最後まで書く。',
      use: 'The taxi is right in front of us.（タクシーはすぐ目の前だよ）' },

    // why: calm ← the hit-man script (a pro who has done this before) and "Let's get it on"; angry ← "I'm gonna do
    //   this" heard as rage at Oscar
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'nervous', reveals: ['gonna'], seg: [220.35, 234.8],
      stem: 'As Trevor gets ready to attack, how does he seem?',
      choices: ['Scared, but set on going through with it', 'Calm, and sure that this will be easy',
                'Angry, and out to punish Oscar himself'], a: 0,
      cue: '「puke」や「stupid」、自分について言う言葉。',
      line: 'I might… I might *puke*, but I’m gonna do this. … for once in my *stupid, stupid life*…',
      said: '「吐きそうだけど、やる」「バカな人生で一度くらい、最後までやる」と言う。',
      mean: '怖さを口にしつつ、自分を証明するために引かない。慣れたプロとは正反対。',
      trap: '殺し屋役なので、慣れたプロや怒りを想像しやすい。本人が自分について言う言葉で判断する。',
      use: 'For once, I’m going to finish something.（一度くらい、最後までやるぞ）' },

    // R fix: N7/B1. The stem quotes "I might puke", which gives away a3's key (scared); a3's point is now in reveals.
    // why: wanna ← g and w blur in a fast "-nna"; gotta ← the flapped t of "gotta" sounds like the n of "gonna";
    //   not gonna ← Dwight's "I'm not gonna let you" right after
    { id: 's1', skill: 'sound', level: 'B2', point: 'gonna', reveals: ['nervous'], seg: [221.6, 227.5],
      stem: 'Fill the gap: “I might puke, but ___ do this.”',
      choices: ['I’m gonna', 'I wanna', 'I gotta', 'I’m not gonna'], a: 0,
      cue: '「puke, but」のあと、短くつながる音。',
      line: 'I might… I might puke, but *I’m gonna* do this.',
      said: '「吐くかもしれない。でもやる」と自分に言い聞かせる。',
      mean: 'I’m gonna は I’m going to の口語。「アムガナ」と短く一続き。',
      trap: 'gonna・wanna・gotta は似た音。最初の I’m の m と、not の有無を聞く。',
      use: 'I’m gonna grab a coffee.（コーヒー買ってくる）' },

    // R fix: V2 (blind 65 %). "Knees already hurt" was a filler; "too good at his job" reads "a Dunder Mifflin man"
    //   as a work reason, refuted by "He's my tribe".
    // why: no affair ← Oscar's "I don't know what you're talking about" just before; good at his job ← "a Dunder
    //   Mifflin man" heard as praise for his work
    { id: 'i4', skill: 'infer', level: 'B2', point: 'tribe', reveals: ['save', 'gonna'], seg: [225.3, 234.8],
      stem: 'Why does Dwight say he won’t let Trevor go ahead?',
      choices: ['Oscar counts as one of his own people', 'Oscar never had an affair with anyone',
                'Oscar is too good at his job to lose'], a: 0,
      cue: '「let you」のあとの2文。',
      line: 'No, Trevor, I’m not gonna let you. He’s a Dunder Mifflin man. He’s *my tribe*.',
      said: '「やらせない。あいつは会社の人間、俺の仲間だ」と止める。',
      mean: 'tribe ＝ 部族、ここでは「身内・仲間」。同じ会社の人間は守る、という Dwight らしい理屈。',
      trap: '直前の否定から無実だから、会社名から有能だから、と取りやすい。最後の一文が理由。',
      use: 'You’re one of us now.（もう仲間だよ）' },
  ]
};
