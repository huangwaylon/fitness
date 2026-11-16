// REVIEW 2026-11-16: pass 4, fix 17, drop 3, new 2; ear checks 2
// REVIEW open: nt4 (new C2) rests on "the weekend to decide", which both transcripts have; the rest of that line
//   differs (captions "you know what kind of that weekend"), so the speakers stay unnamed.
// “Michael Is Dating Pam's Mom - The Office US” (the official The Office channel, BEST OF SEASON 6 - The Office US):
// Michael tells Jim he is seeing Helene, Pam's mother; Jim makes him promise to end it and keep it from Pam. Later
// Michael sounds Pam out about a "complicated" new relationship, and she cheers him on until she learns who it is.
// Segments from the captions, words from whisper (2026-11-16). Left out: 21–33 s (sexual brag and innuendo), the Toby
// interruption at 44–52 s, the gift talk at 106–122 s (captions and whisper differ) and the crosstalk at 183–198 s.
// The speaker who stalls at 123 s is never named (he refers to Michael in the third person), so no stem names him.
// EAR CHECK: 39.9 s r1 — the cut falls after “a pact” and before “although” (captions: although 40.3 s; whisper 39.5 s)
// EAR CHECK: 89 s i3 n1 — whisper “from four people to two”, captions “from for people to -” (no “two”); 170 s has
//   “to two people” in both, which n1 rests on
import type { Clip } from '../types.ts';

export const pamsMom: Clip = {
  id: 'pamsmom', video: 'ugm3hm6nxkI', title: 'Michael Is Dating Pam\'s Mom', dur: 278, wpm: 153, band: 'mid',
  tags: ['職場', '恋愛'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): "disbelief" was the only reaction that fits the title; now a 2 × 2 of how it starts
    //   (routine vs real delight) × how it turns (disbelief vs amusement)
    // why: real delight ← "that's great, congratulations" taken at face value; amusement ← "you're messing with me"
    //   heard as playful, so Jim seems entertained rather than thrown
    { id: 't1', skill: 'attitude', level: 'B2', point: 'react', seg: [7.2, 20.45],
      stem: 'How does Jim’s reaction change once he hears who it is?',
      choices: ['From polite cheer to disbelief', 'From real delight to disbelief',
                'From polite cheer to amusement'], a: 0,
      cue: '名前を聞く前と後で、Jim の言葉がどう変わるか。',
      line: 'Well, that’s great, *congratulations*. Who’s the lucky lady? … *What? Pam’s mom?*',
      said: '「おめでとう、相手は誰？」と祝うが、名前を聞くと「え？ Pam のお母さん？」と返す。',
      mean: 'Well で始まる形だけの祝福から、信じられない気持ちへ。',
      trap: 'messing with me を面白がっていると取りやすい。先に来る What? を聞く。',
      use: 'Wait, what? Are you serious?（え、ちょっと待って、本気？）' },

    // R fix: V2 (blind 55 %): "own" flagged the key and two weddings pointed to it; now three events where Jim
    //   could have met Pam's mother
    // why: birthday party ← a family event for Pam, so a guess from the plot; office party ← "remember" + a work
    //   story, and Michael's world is the office
    { id: 'd1', skill: 'detail', level: 'B1', point: 'wedding', seg: [15.4, 20.45],
      stem: 'Where does Michael say Jim has seen her before?',
      choices: ['At Jim’s wedding', 'At Pam’s birthday party', 'At the office party'], a: 0,
      cue: '名前のあと、「Remember?」に続く短い言葉。',
      line: 'Helene. Remember? From *your wedding*.',
      said: '「ヘレンだよ。覚えてる？君の結婚式で」と言っている。',
      mean: 'Jim 自身の結婚式で会った相手、つまり Jim の義理の母だと分かる。',
      trap: '話の流れから場面を想像して選びやすい。from のあとの二語、特に弱い your を聞く。',
      use: 'Remember? From the party last week.（覚えてる？先週のパーティーで）' },

    // why: in my way ← literal mess with = ちょっかいを出す/邪魔する; mixing up ← near sound messing/mixing, and Jim
    //   has just repeated the name as if checking who she is
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'messing', seg: [15.4, 20.45],
      stem: 'Right after “Pam’s mom?”, what is Jim saying to Michael?',
      choices: ['You must be joking with me', 'You’re getting in my way', 'You’re mixing her up with someone'], a: 0,
      cue: '名前を聞き返したあとの、Jim の短い一文。',
      line: '*You’re messing with me.*',
      said: '「からかってるんだろ」と、冗談であってほしいという気持ちで言う。',
      mean: 'mess with someone ＝ 人をからかう。信じられない話への反応。',
      trap: 'mess を「邪魔」と取ると意味がずれる。messing と mixing も音が近い。',
      use: 'Come on, you’re messing with me.（もう、からかってるでしょ）' },

    // R fix: V2 (blind 55 %): the key was the only two-part demand that fits the title; now each choice pairs a Pam
    //   half with a Helene half, so only "never … tell" + "never … see her again" fits
    // why: tell Pam, then stop ← "tell Pam" is said, and honesty is the usual script; keep it until sure ← "never
    //   tell Pam" heard, but "never ever see her again" missed in the fast run
    { id: 'g1', skill: 'gist', level: 'B2', point: 'goal', seg: [34.0, 82.3],
      stem: 'Over their first talk, what is Jim trying to get Michael to do?',
      choices: ['Keep it from Pam and stop seeing her', 'Tell Pam himself, then stop seeing her',
                'Keep it from Pam until he’s sure of her'], a: 0,
      cue: '「never」で始まる条件と、夕食についての指示。',
      said: 'Jim は「Pam には絶対言うな」「今夜の夕食はやめて二度と会うな」と求める。',
      mean: '秘密にすることと、関係を終わらせること。',
      trap: 'tell Pam が聞こえても前に never がある。速い ever のあとの see her again まで聞く。',
      use: 'Promise me you won’t tell anyone.（誰にも言わないって約束して）' },

    // predict: the segment stops after "a pact"; the reveal plays the rest
    // R fix: removed reveals: ['dinner'] (no such point). V2 (blind 60 %): "already undoes the deal" was the only twist among plain deal terms; now three
    //   "reasons", one of which breaks the pact at once
    // why: Jim must keep it too ← a pact usually binds both sides; can't break up yet ← Michael keeps defending the
    //   relationship later, so a listener expects a reason to keep seeing her
    { id: 'r1', skill: 'predict', level: 'B2', point: 'pact', seg: [34.0, 39.9], then: [39.9, 44.3],
      stem: 'Right after Michael agrees to “a pact”, what kind of thing does he add?',
      choices: ['A reason he may break it right away', 'A reason Jim has to keep it too',
                'A reason he can’t break up yet'], a: 0,
      cue: '約束に賛成した直後、Michael の口調。',
      line: 'Good. A pact. A pact. *Although I may have to break it tonight*…',
      said: '「よし、約束だ」の直後に「でも今夜破るかも。夕食で Pam に話すから」と付け足す。',
      mean: 'although は「とはいえ」。言ったばかりの約束をすぐ崩す一言。',
      trap: '約束の話なので条件や誓いを予想しやすい。although のあとは前の話を崩す。',
      use: 'Sure. Although I might be late.（いいよ。遅れるかもしれないけど）' },

    // why: Pam and her mom ← "both" heard as the two women in the story; Michael and Helene ← "both" heard as the couple
    { id: 'i2', skill: 'infer', level: 'C1', point: 'sakes', reveals: ['goal'], seg: [52.4, 61.0],
      stem: 'When Jim asks Michael to stop, whose trouble is he thinking of?',
      choices: ['His own and Michael’s, if Pam finds out', 'Pam’s and her mom’s, if the romance goes on',
                'Michael’s and Helene’s, if Pam objects'], a: 0,
      cue: '「please」のすぐあと、弱く速い4語。',
      line: 'please, for *both of our sakes*, never ever ever see her again.',
      said: '「頼むから、僕たち二人のために、もう二度と会わないで」と言う。',
      mean: 'our ＝ Jim と Michael。Pam に知られたら、知っていた夫の Jim も困る。',
      trap: 'both を話題の二人の女性やカップルと取りやすい。our は話し手を含む。',
      use: 'For both our sakes, let’s leave early.（お互いのために、早めに出よう）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'sakes', seg: [54.9, 59.3],
      stem: 'Type what Jim says: “please, for ___” (4 words)', answer: 'both of our sakes',
      cue: '「please, for」のあと。of と our は弱く、つながる。',
      line: 'please, for *both of our sakes*, never ever ever see her again.',
      said: '「僕たち二人のために」。both of our がひと続きに聞こえる。',
      mean: 'for ～’s sake ＝ ～のために。sakes は複数の人のとき。',
      trap: 'of と our が弱く、「ボウサヴァ」のように一つに聞こえる。語数で補う。',
      use: 'For your own sake, get some sleep.（自分のためにも、少し寝て）' },

    // R fix: V2 (blind 65 %): the key was the only hedged choice; now all three are "Pam does care, but …", and
    //   only the scope of "not" decides
    // why: not about this ← "No" heard as denying her interest in this case; more about Jim ← Jim is her husband, so
    //   "more" heard as a ranking with him in it
    { id: 'i1', skill: 'infer', level: 'B2', point: 'morethan', seg: [60.6, 68.5],
      stem: 'When Jim answers Michael’s claim about what Pam wants, what is he saying?',
      choices: ['Pam does care, but not above everything', 'Pam does care, but not about this one',
                'Pam does care, but more about Jim'], a: 0,
      cue: '「No」のあと、Michael の言葉をどこまで繰り返すか。',
      line: 'more than anything she wants me to be happy. — No. *Not more than anything.*',
      said: 'Michael「Pam は何より僕の幸せを望んでる」、Jim「いや、何よりではない」。',
      mean: '「幸せを願う」こと自体は否定せず、「何より」だけを否定している。',
      trap: 'No のあとを聞き流すと否定の範囲を取り違えやすい。not のすぐあとの語が範囲。',
      use: 'I like it, just not more than pizza.（好きだけど、ピザほどじゃない）' },

    // R drop: nt3 (C2) tested the same line, point and scope of "not" as i1; blind 60 %. Deleted (never shipped).

    // R fix: V2 (blind 55 %): "lives" was the only reading of "she's right on my way"; now all three say where she
    //   lives, and only "way home from work" decides
    // why: on his way to work ← "work" is said, and the direction is lost in the fast run; next to the office ←
    //   "from work" heard as the place itself
    { id: 'd3', skill: 'detail', level: 'B1', point: 'route', seg: [70.4, 76.9],
      stem: 'When Michael pushes back, what practical problem does he raise?',
      choices: ['She lives right on his way home', 'She lives right on his way to work',
                'She lives right next to the office'],
      a: 0,
      cue: '「right on my way」のあとに続く場所。',
      line: 'She’s *right on my way home from work*. — Then take a different way home.',
      said: '「彼女の家は帰り道にある」と言い、Jim は「なら別の道で帰れ」と返す。',
      mean: 'on my way home ＝ 帰り道の途中。会わずにいられないという言い訳。',
      trap: 'work が耳に残ると行き道や職場の話に取りやすい。way のあとの home を聞く。',
      use: 'The bakery is right on my way.（そのパン屋、ちょうど通り道なんだ）' },

    // R new: replaces d4 (dropped) to keep literal ≥ 4; blind read 40 %
    // why: lie to Pam ← the pact is about secrecy, so lying is the expected worry; lose Helene ← Michael has just
    //   defended "a good thing with the mom"
    { id: 'd5', skill: 'detail', level: 'B1', point: 'lastthing', seg: [75.0, 80.6],
      stem: 'What does Michael call “the last thing in the world” he’d want?',
      choices: ['To upset Pam', 'To lie to Pam', 'To lose Helene'], a: 0,
      cue: '「the last thing in the world」の文の最後。',
      line: 'It’s the last thing in the world I would want to do, is *upset Pam*.',
      said: '「Pam を傷つけるなんて、世界で一番したくないことだ」と言う。',
      mean: 'the last thing ＝ 一番したくないこと。それでも交際はやめない。',
      trap: '秘密の約束の話なので「うそ」を選びやすい。長い前置きのあと、最後の動詞を待つ。',
      use: 'The last thing I want is to be late.（遅刻だけは絶対したくない）' },

    // R fix: V2 (blind 65 %): the key was the only choice that keeps the pact; now all three say he still sees
    //   her, and only the head count settles who comes. Added 'pact' to reveals: the dinner distractor and trap give
    //   away r1's continuation
    // why: tell Pam over dinner ← his own plan at 42 s, so a listener expects it still; Jim along ← "minus Pam" but
    //   the third seat missed, "two" heard as "to"
    { id: 'i3', skill: 'infer', level: 'C1', point: 'resv', reveals: ['nobody', 'pact'], seg: [86.0, 90.3],
      stem: 'When Michael changes his dinner booking, what does that suggest?',
      choices: ['He’ll still see her, just without Pam and Jim', 'He’ll still see her, and tell Pam over dinner',
                'He’ll still see her, but with Jim along too'], a: 0,
      cue: '人数が何人から何人に変わるか。',
      line: 'Can you change my dinner reservations *from four people to two*?',
      said: '夕食の予約を「4人から2人に変えて」と頼む。',
      mean: '4人は Michael、ヘレン、Pam、Jim。2人なら二人きりの食事で、会うのはやめていない。',
      trap: '前の「夕食で Pam に話す」が頭に残りやすい。人数が減った分、誰が来ないかを数える。',
      use: 'Could we make it a table for two?（2名席に変えられますか）', retired: true },

    // R new: C2 (new id nt4), replaces nt2 and nt3 (dropped) to keep the native tier at 2
    // anchor: 115.4–117.8 s "can I have the weekend to decide?" — a weekend for rum vs alarm clock is a stall, and
    //   119.3 s "Bottle of rum it is" closes the choice without him
    // why: accepts his choice ← "it is" heard as agreement, but no choice was made; lets him wait ← "the weekend"
    //   heard as granted, but she names the gift on the spot
    { id: 'nt4', skill: 'pragma', level: 'C2', point: 'rum', seg: [109.4, 120.3],
      stem: 'What does “Bottle of rum it is” do after the weekend request?',
      choices: ['Decides for him, taking the stall as no answer', 'Accepts the choice he has just made for them',
                'Teases him for stalling, then lets him wait'], a: 0,
      cue: '二択の質問への返事が、どのくらい長い保留か。',
      line: '…rum or the … alarm clock? — …can I have *the weekend to decide*? — *Bottle of rum it is.*',
      said: 'ラム酒か貝の目覚まし時計かと聞かれ、「週末まで考えさせて」と返すと、すぐ「じゃあラム酒ね」。',
      mean: '小さな二択に週末は長すぎる。先延ばしする相手に代わって、その場で決める。',
      trap: 'it is を同意と取りやすいが、相手はまだ選んでいない。保留のあとの即答は「決めた」。',
      use: 'Pizza it is, then.（じゃあ、ピザで決まりね）' },

    // R fix: V2 (blind 70 %): "without saying no outright" was the only nuanced choice; now each choice is a move
    //   with its own time frame, and only the vague "when things are … less crazy" fits
    // why: a few minutes first ← "catch up on everything here" heard as finishing a task, then going; Michael is out
    //   ← "Michael's slammed" heard as Michael being away, not busy
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'later', seg: [122.0, 132.0],
      stem: 'After “Shall we?”, what does the answer about being busy do?',
      choices: ['Puts it off to some vague later time', 'Agrees, but asks for a few minutes first',
                'Says no, since Michael is out today'], a: 0,
      cue: '「so maybe」のあと、「いつ」やるかの言い方。',
      line: 'I am really *slammed*… so *maybe we should do this when things are a little less crazy*.',
      said: '「今すごく忙しいし、マイケルも忙しい。落ち着いたらにしよう」。',
      mean: 'slammed ＝ 仕事が詰まっている。断らずに、いつとも決めず延ばす。',
      trap: 'catch up を「片付けたら行く」と取りやすい。when things are… は時期をぼかす。',
      use: 'Can we do this when things calm down?（落ち着いてからにしない？）' },

    // R fix: V2 (blind 55 %): "it took" was ungrammatical with "Come on", leaving "it'll take" as the natural
    //   choice; "it takes" is just as natural, so only the sound decides
    // why: it'd ← the -ll is dark and short, close to -d; it takes ← the plain present fits "Come on" too, and the
    //   dark l is easy to lose; I'll ← it'll and I'll differ only in the first vowel
    { id: 's1', skill: 'sound', level: 'B2', point: 'seconds', reveals: ['resv'], seg: [132.0, 138.05],
      stem: 'Fill the gap: “Come on, ___ two seconds.”',
      choices: ['it’ll take', 'it’d take', 'it takes', 'I’ll take'], a: 0,
      cue: '「Come on」のあと、二つ目の語の前の短い音。',
      line: 'Come on, *it’ll take* two seconds.',
      said: '「ほら、すぐ終わるから」と相手を急かす。',
      mean: 'it’ll は「イロ」に近く、ll はほとんど聞こえない。two seconds は「一瞬」。',
      trap: 'll が弱く、it’d や it takes に聞こえやすい。take の語尾に s があるかも聞く。',
      use: 'It’ll only take a minute.（すぐ終わるよ）' },

    // R fix: V2 (blind 50 %): with "One" and "Four", "Two" was the only count for a date; "Three" (Michael, Helene
    //   and Pam, minus Jim) fits the dinner plan from 42 s
    // why: one ← "to" swallowed, and later "it's nobody"; three ← the earlier plan to tell Pam over dinner
    { id: 'n1', skill: 'number', level: 'B1', point: 'resv', seg: [165.0, 171.6], keep: true,
      stem: 'How many people is Michael’s Botticelli’s booking for now?',
      choices: ['One', 'Two', 'Three'], a: 1,
      cue: '「reservation」のあと、「people」の前。',
      line: 'I changed the reservation *to two people*.',
      said: '「予約を2人に変更しました」と伝えている。',
      mean: 'to two は「トゥ・トゥー」と同じ音が続く。前の to は弱く、あとの two が強い。',
      trap: '同じ音が二つ続くので一つに聞こえ、数を落としやすい。話の流れより、強い方の音を聞く。',
      use: 'A table for two, please.（2名でお願いします）' },

    // why: no, not special ← "yeah" heard first as agreement; maybe ← the two words heard as hesitation
    { id: 'm1', skill: 'marker', level: 'B2', point: 'yeahno', seg: [175.4, 183.9],
      stem: 'When someone calls it “a special occasion”, what do Michael’s first words mean?',
      choices: ['No, it isn’t anything special', 'Yes, it really is a big night', 'Maybe; he hasn’t decided yet'], a: 0,
      cue: '最初の二語のうち、あとの一語。',
      line: '*Yeah, no*, it’s nobody.',
      said: '「特別な日みたいね」と言われ、「いや、そんなんじゃない」と返す。',
      mean: 'Yeah, no ＝ 相手の言葉を受けてから否定する口癖。意味は no の方。',
      trap: '最初の yeah で同意と取りやすい。二つ並んだら、あとの語が答え。',
      use: 'Yeah, no, I’m good, thanks.（ううん、大丈夫、ありがとう）' },

    // R fix: V2 (blind 55 %): "let slip" pointed at the only hidden-fact choice; the stem is neutral now, and the
    //   distractors are the two literal readings of "it's nobody"
    // why: a meal for himself ← "nobody" taken literally = 誰もいない; a business meal ← "no" to "special occasion"
    //   heard as "just work"
    { id: 'i4', skill: 'infer', level: 'C1', point: 'nobody', reveals: ['yeahno'], seg: [175.4, 183.9],
      stem: 'What does Michael’s answer about Botticelli’s tell the others?',
      choices: ['That he has someone to meet there', 'That it’s just a quiet meal for himself',
                'That it’s a business meal, not a party'], a: 0,
      cue: '聞かれたのは「何の日か」。答えは何についてか。',
      line: 'that sounds like a special occasion. — Yeah, no, *it’s nobody*.',
      said: '「特別な日？」と聞かれ、「いや、誰でもない」と答える。すぐ「デートでしょ」と言われる。',
      mean: '聞かれたのは行事なのに「誰」で答えたので、相手がいると分かってしまう。',
      trap: 'nobody を文字通り「一人で」と取りやすい。質問と答えのずれに注目。',
      use: 'Who’s the card from? — Oh, nobody.（誰からのカード？—ああ、別に）' },

    // R fix: V2 (blind 60 %): now a 2 × 2 of Pam's first move (cheers on / warns off) × the end (learns / never
    //   told), so the title alone doesn't pick it
    // why: warns him off ← "it is very complicated" heard as Pam's warning; he won't say who ← Michael never says the
    //   name, and "I was probably gonna break up with her anyway" heard as him backing out
    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', seg: [198.0, 255.2],
      stem: 'In Michael’s talk with Pam, how do things turn out?',
      choices: ['She cheers him on, then learns who it is', 'She cheers him on, but he won’t say who',
                'She warns him off, then learns who it is'], a: 0,
      cue: 'Pam の助言と、最後の「Who is it?」のあと。',
      said: 'Pam は「好きなら続けてみて」と励ますが、何度も相手を聞いたあと、答えに動揺する。',
      mean: '誰の話か知らずに励まし、名前は出ないまま最後に気づく。',
      trap: '「複雑」は Michael の言葉で、Pam は止めていない。誰の発言か分け、最後まで聞く。',
      use: 'Who is it? Come on, tell me!（誰？ ねえ、教えて！）' },

    // R fix: V2 (blind 50 %): "move away" was a filler, so the key was the only definition-shaped choice; now two
    //   readings of "moving" that a listener could really mean
    // why: changing ← "moving" heard as 変化/動き; too fast ← "moving" heard as speed, a relationship moving fast
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'parts', seg: [201.0, 207.15],
      stem: 'When Michael tells Pam it’s complicated, what does he add about it?',
      choices: ['Many people and factors are involved', 'Things keep changing from day to day',
                'It’s all moving too fast for him'], a: 0,
      cue: '「very complicated」のあと、「a lot of」に続く語。',
      line: 'it is very complicated. There are *a lot of moving parts* here.',
      said: '「とても複雑で、いろいろ絡んでいる」と言い、Pam は「複雑そうね」。',
      mean: 'moving parts ＝ 機械の可動部品から、関わる人や要素の多さ。',
      trap: 'moving を「変化」や「速さ」と取りやすい。moving parts で一つの言い方。',
      use: 'This trip has a lot of moving parts.（この旅行、決めることが多いんだ）' },

    // R fix: V2 (blind 70 %): the key was the only setup move; now all three are moves before bad news, and only
    //   the question's content (his happiness) picks the key
    // why: keep it to herself ← a question before a secret usually asks for silence; help him win her ← "see where it
    //   goes" heard as an offer, so he lines up her help
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'happy', seg: [207.1, 213.5],
      stem: 'Before he says more, why does Michael check that Pam wants him happy?',
      choices: ['To lock in her support before saying who', 'To make sure she’ll keep it to herself',
                'To ask her help in winning the woman'], a: 0,
      cue: 'Pam の助言のすぐあと。短い質問と、その返事。',
      line: 'you should see where it goes. — *You want me to be happy?* — Of course.',
      said: 'Pam の「好きなら続けてみて」のあと、「僕に幸せでいてほしい？」と聞き「もちろん」と言わせる。',
      mean: '名前を出す前に「もちろん」を言わせる。先に同意を取る話し方。',
      trap: '秘密の前の質問を口止めと取りやすい。質問の中身（僕の幸せ）が、何の同意かを示す。',
      use: 'You trust me, right? Good.（信じてくれるよね？よし）' },

    // R drop: d4 — blind 50 %: the title (Pam's mom) gives "mother" away, and it is the same fact as h1/nt2.
    //   Deleted (never shipped); d5 replaces it.

    // R fix: V2 (blind 60 %): the "once a couple" distractor was a filler; now two readings a listener could hold:
    //   a retreat to a cooler word, and a slip for "girlfriend". Also removed reveals: ['friend'] (point dropped).
    // why: sound less close ← "co-worker" is normally the cooler word, so the correction is heard as backing off;
    //   girlfriend ← "more than a friend" is the usual phrase for romance (友達以上), so a slip is expected
    { id: 'h1', skill: 'humor', level: 'C1', point: 'coworker', seg: [213.3, 222.55],
      stem: 'Why is Michael’s correction after “a close friend of mine” funny?',
      choices: ['He treats “co-worker” as closer than “friend”', 'He backs off to make it sound less close',
                'He means “girlfriend” but says “co-worker”'], a: 0,
      cue: '言い直しの二つ目の語と、その前置き。',
      line: '*More than a friend. A co-worker.*',
      said: '「友人どころか、同僚だ」と言い直す。',
      mean: '「以上」と言いながら、普通は友人より遠い同僚を出す。順序が逆で笑いになる。',
      trap: '同僚の方が遠いので「言い直して距離を置いた」と取りやすい。more than が付くと格上げの言い方。',
      use: 'He’s more than a client. He’s a friend.（彼は客以上、友だちなんだ）' },

    // R drop: nt2 (C2) — V1: "the friend is Pam" comes from the title, not the audio (blind 70 %). Deleted (never
    //   shipped); nt4 replaces it.

    // R fix: V2 (blind 55 %): the key was the only upbeat choice; now two "curious" readings, refuted by "Who is it?"
    //   pushing and by "gossip" (about others)
    // why: careful not to pry ← うわさ話 is something polite people hold back from; guessing it's her ← the audience
    //   knows it's her mom, so a listener expects her to suspect
    { id: 't2', skill: 'attitude', level: 'B1', point: 'gossip', seg: [219.2, 226.0],
      stem: 'When Michael says “a co-worker”, how does Pam react?',
      choices: ['Excited to hear some office news', 'Curious, but careful not to pry',
                'Excited, but guessing it’s about her'], a: 0,
      cue: 'co-worker のすぐあと、Pam の最初の二語。',
      line: 'A co-worker. — *Oh, gossip! Who is it?*',
      said: '「同僚」と聞いて、「うわさ話ね！誰？」と聞く。',
      mean: '職場の人の恋の話なので、興味しんしん。自分のこととは思っていない。',
      trap: '日本語の「うわさ話」は控えるものだが、ここは Who is it? と押す。gossip は他人の話の合図。',
      use: 'Ooh, gossip! Tell me everything.（え、なになに？全部教えて）' },

    // anchor: 249.5–254.7 s "one of two ways" + "never expected her to get upset": of the two ways, upset was the
    //   obvious one, and only Michael didn't see it
    // R fix: V2 (blind 60 %): the key was the only self-aware reading; now two "On Michael" choices that split on
    //   "never expected", plus his own framing of Pam
    // why: saw it coming ← the right target, wrong reason: "one of two ways" heard as him knowing the risk; Pam ←
    //   right mechanism, wrong target: his words blame her reaction, so the joke seems to be on her
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'twoways', reveals: ['resv'], seg: [249.0, 255.2],
      stem: 'In Michael’s last comment to the camera, who is the joke on?',
      choices: ['On Michael, who missed the one likely outcome', 'On Michael, who saw it coming but went ahead',
                'On Pam, whose reaction came out of nowhere'], a: 0,
      cue: '「two ways」と、そのあと予想しなかったこと。',
      line: 'That could have gone *one of two ways*. But I *never expected her to get upset*.',
      said: 'カメラに「どちらにも転び得た。でも彼女が怒るとは思わなかった」と話す。',
      mean: '二つの道の一つは当然「怒る」。それを予想しなかったと言うことで、本人の鈍さが笑いになる。',
      trap: '彼女の反応を責めているように聞こえるが、笑われているのは話し手。言葉の中の矛盾を探す。',
      use: 'In hindsight, I should have seen it coming.（今思えば、予想できたはず）' },
  ]
};
