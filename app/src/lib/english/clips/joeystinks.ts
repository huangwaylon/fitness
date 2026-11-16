// “Joey Stinks | Friends” (the official Friends channel, Best of Season 4): Joey overslept and wants to run to the set
// without a shower; then Rachel tells how her night out went wrong, from a misspelled guest list to a punch.
// Segments from the captions, words from whisper (2026-11-16). The captions garble the name on the list ("GP", "grep",
// "G"; whisper "Greep"); every item only needs it to differ from “Green”, which both sources agree on. Left out on
// purpose: "Hey, slow down! / No, keep moving" at 16.8–19.4 s (who says it is unclear in both sources) and the insult at
// 52 s (never quoted).
// REVIEW 2026-11-16: pass 2, fix 18, drop 0, new 0; ear checks 1
// Open: f1's evidence ("punch a girl in the face", 24–27 s) lies outside its segment; the slang has to carry it.
// EAR CHECK: 24.9 s nt2 — the stress in “but I did punch a girl” falls on “did” (contrast with “didn’t see”), not on “I” or
//   “girl” (ship only once confirmed)
import type { Clip } from '../types.ts';

export const joeyStinks: Clip = {
  id: 'joeystinks', video: '1MfB8Q1BW9w', title: 'Joey Stinks', dur: 68, wpm: 176, band: 'mid',
  tags: ['友だち', '家'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %): only the key skipped the shower, which the title gives away; all three are now about the
    //   shower and the way there
    // why: a cab ← "ten blocks away" heard as a ride-length trip, with "run" lost; shower first ← "before I could take a
    //   shower" heard without "now I don't have time"; "If I run, I can make it" settles it
    { id: 'g1', skill: 'gist', level: 'B1', point: 'decide', reveals: ['run'], seg: [0, 16.8],
      stem: 'After his friend’s warning, what does Joey decide to do?',
      choices: ['Skip the shower and run all the way', 'Skip the shower and take a cab', 'Shower quickly, then run there'], a: 0,
      cue: '「time」のあと、if で始まる文。',
      said: '寝坊して遅刻中。臭うと言われても、シャワーの時間はないので走って行く、と言う。',
      mean: '遅刻と臭い、二つの問題のうち、時間を取った。友だちはそれを笑う。',
      trap: '遅刻と聞くと「連絡する」「タクシー」が浮かぶが、本人は走れば間に合うと言っている。',
      use: 'No time. I’ll just have to run.（時間ない。走るしかない）' },

    // R fix: V2 (blind 80 %): "glad he slept so well" was a filler; both distractors are now real reactions to oversleeping
    // why: nobody woke him ← a loud start heard as blame; smell ← the title and the next lines, carried back to his
    //   first words, where he says nothing about it
    { id: 't0', skill: 'attitude', level: 'B1', point: 'overslept', seg: [0, 5.7],
      stem: 'How does Joey sound in his first few lines?',
      choices: ['Panicked that he’s running late', 'Annoyed that nobody woke him up', 'Embarrassed about how he smells'], a: 0,
      cue: '最初の一言と、最後の「ここから」の部分。',
      line: 'My God! *I overslept!* … I gotta *get out of here!*',
      said: '「しまった、寝坊した！もう出なきゃ！」と叫んでいる。',
      mean: 'My God と gotta get out of here が、時間に追われた焦りを表す。',
      trap: '寝坊なら「誰も起こさない」と怒る筋も浮かぶが、責める言葉も臭いの話もない。言葉だけで判断。',
      use: 'Oh no, I gotta go!（やばい、行かなきゃ！）' },

    // why: an hour ← "half" is short and weak before "an hour", so only "an hour" is caught; a quarter ← a smaller
    //   fraction, the "just a bit late" picture
    { id: 'n1', skill: 'number', level: 'B1', point: 'halfhour', seg: [1.1, 5.7], keep: true,
      stem: 'How late is Joey already?',
      choices: ['A quarter of an hour', 'Half an hour', 'A whole hour'], a: 1,
      cue: '「on the set」のすぐあと、ago の前。',
      line: 'I was supposed to be on the set *half an hour* ago.',
      said: '「30分前に撮影現場にいるはずだった」と言っている。',
      mean: 'half an hour ＝ 30分。half と an がつながり「ハーファナワー」に近い。',
      trap: 'half が短く弱いので an hour だけ耳に残りやすい。an の前の小さな音に注意。',
      use: 'The train left half an hour ago.（電車は30分前に出ちゃった）' },

    // R fix: V2 (blind 70 %) and S2: the title made "not fit to be seen" the obvious key, and the stem quoted "can't". The
    //   stem now names the moment, and the choices turn on can/can't and on what the line does
    // why: fine as he is ← "can't" with its t dropped heard as "can"; hurry ← he is late, so the friend's line taken as
    //   "go now"; "like that" + "You stink" settle it
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'cantgo', seg: [5.5, 9.0],
      stem: 'When Joey says he has to leave, what does his friend’s first line do?',
      choices: ['Warns him not to go out in that state', 'Tells him it’s fine to go out as he is', 'Urges him to hurry before he’s later'], a: 0,
      cue: 'go のあとの二語と、その次の短い文。',
      line: 'Joey, you *can’t* go *like that*. *You stink.*',
      said: '「その格好じゃ行けないよ。臭うもん」と言っている。',
      mean: 'like that ＝「その状態で」。急かすのではなく、人前に出られないという忠告。',
      trap: 'can’t の t は弱く can に聞こえやすい。直後の You stink とつなげれば否定と分かる。',
      use: 'You can’t go out like that!（その格好で出かけちゃだめだよ！）' },

    // R fix: V2 (blind 75 %): both distractors were weak; one now takes "look" as pointing at what the friend just said,
    //   and one as the turn to the time, which comes two lines later
    // why: look at the state ← look = 見る, tied to the friend's "like that"; to the time ← "Now I don't have time"
    //   follows, so a sentence-first word heard as the turn to it
    { id: 'm1', skill: 'marker', level: 'B2', point: 'look', seg: [7.55, 11.5],
      stem: 'Joey begins his answer with “Look”. What does that word do here?',
      choices: ['It pushes back before he explains', 'It asks them to look at the state he’s in', 'It changes the subject to how late he is'], a: 0,
      cue: '「臭う」と言われた直後の、文頭の一語。',
      line: '*Look*, I fell asleep…',
      said: '「だってさ、シャワーの前に寝ちゃったんだよ」と言い返している。',
      mean: '文頭の Look ＝「いいかい、だって」。言われたことに反論・弁解する前置き。',
      trap: 'look を「見て」と取りやすいが、何も見せていない。文頭の look は言い返す合図。',
      use: 'Look, I’m doing my best here.（だから、これでも頑張ってるんだって）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'asleep', seg: [8.5, 11.45],
      stem: 'Type what Joey says: “I fell asleep ___ take a shower.” (3 words)', answer: 'before i could',
      cue: '「fell asleep」のすぐあと、take の前まで。',
      line: 'I fell asleep *before I could* take a shower.',
      said: '「シャワーを浴びる前に寝ちゃった」。三語が一続きに聞こえる。',
      mean: 'could の l は読まず、d も次の take にのまれて「クッ」程度。',
      trap: 'I could が短く、before だけ書きやすい。間の小さな音を拾う。',
      use: 'It started raining before I could leave.（出る前に雨が降り出した）' },

    // R fix: V2 (blind 65 %): the key was the one choice with "run" and "ten blocks" both; now all three share the
    //   distance and differ only in the verb
    // why: a cab ← "ten blocks" heard but the verb lost, and a cab is the late person's script; a bike ← "run" and
    //   "ride", both a short r- word, caught only as their first sound
    { id: 'd1', skill: 'detail', level: 'B1', point: 'run', seg: [10.45, 13.95],
      stem: 'How does Joey plan to get there in time?',
      choices: ['He’ll run there; it’s just ten blocks', 'He’ll take a cab; it’s just ten blocks', 'He’ll ride a bike; it’s just ten blocks'], a: 0,
      cue: '「away」のあと、if で始まる短い文。',
      line: 'They’re just *ten blocks* away. *If I run*, I can make it.',
      said: '「現場はたった10ブロック先。走れば間に合う」と言っている。',
      mean: 'just ＝「たった」。近いから走って行ける、という計算。',
      trap: 'ten blocks は聞こえても、動詞を落とすとタクシーにも自転車にも取れる。if のすぐあとの動詞を拾う。',
      use: 'It’s just two blocks away. Let’s walk.（2ブロック先だよ。歩こう）' },

    // R fix: V2 (blind 50 %, right): the key was the only one that gave a reason, and the stem said "plan". The stem is
    //   neutral now, and a second mocking choice aims at the wrong target
    // why: agrees ← "Yeah" read as a real yes (the Japanese 相づち frame); his excuse ← mocking, but aimed at the shower
    //   excuse just before; the repeat "run ten blocks" shows the target is the plan
    { id: 't1', skill: 'attitude', level: 'B2', point: 'smell', reveals: ['run'], seg: [10.45, 16.8],
      stem: 'When the friend replies “Yeah…” to Joey, what is the friend doing?',
      choices: ['Mocking his plan to run there', 'Mocking his excuse about the shower', 'Agreeing that running is quickest'], a: 0,
      cue: 'Yeah のあと、彼の言葉をくり返してから付け足す部分。',
      line: 'Yeah, *run ten blocks*. *That’ll help the smell.*',
      said: '「そうだね、10ブロック走れば。臭いにはいいだろうね」と返す。',
      mean: 'Yeah で始めても皮肉。走るという案を、臭いが増すと笑っている。',
      trap: 'Yeah を賛成と取りやすい。相手の言葉をそのまま返したら皮肉を疑い、どの言葉を返したかで的を聞く。',
      use: 'Oh yeah, that’ll help.（ああ、それは助かるね［皮肉］）' },

    // R fix: V2 (blind 85 %): "too fast for anyone to notice" was a filler; it's now the wrong-target reading (a joke on
    //   Joey's fitness)
    // why: airs out ← "help the smell" taken literally, as real advice; can't run ← "run ten blocks" repeated, heard as
    //   doubt that Joey could; "help the smell" ties the joke to the smell
    { id: 'h1', skill: 'humor', level: 'C1', point: 'smell', reveals: ['run'], seg: [11.4, 16.8],
      stem: 'Why does the friend’s reply to Joey’s plan get a laugh?',
      choices: ['The run will make the smell worse, not better', 'The friend means the run will air out the smell',
                'The friend is sure Joey can’t run ten blocks'], a: 0,
      cue: '走る話のあと、help の次の語。',
      line: 'Yeah, run ten blocks. That’ll *help the smell*.',
      said: '「10ブロック走るんだ。臭いにはいいね」と言われる。',
      mean: 'シャワーなしで走れば汗をかく。「助けになる」と言いながら、逆効果だと笑っている。',
      trap: 'help を文字通り取ると本当の助言に聞こえる。反対のことを言う皮肉は英語の会話でよくある。',
      use: 'Great, that’s just what I needed.（最高、まさにそれが欲しかった［皮肉］）' },

    // R fix: V2 (blind 60 %): "it went pretty well" was out of keeping with a bad-night story; it's now the keyword trap
    //   (Joshua next to "punch"), so the segment runs on to 27.85 to hold "a girl", which refutes it
    // why: briefly ← "didn't" with its t dropped sounds like "did"; punched him ← "Joshua" and "punch" a breath apart,
    //   with "a girl" lost
    { id: 'd4', skill: 'detail', level: 'B1', point: 'joshua', seg: [20.0, 27.85],
      stem: 'Did Rachel see Joshua last night?',
      choices: ['No, she didn’t get to see him at all', 'Yes, she saw him, but only briefly', 'Yes, and she ended up punching him'], a: 0,
      cue: '「Oh, well」のすぐあと、名前の前の部分。',
      line: 'Oh, well, I *didn’t see* Joshua…',
      said: '「昨日の夜どうだった？」と聞かれ、「ジョシュアには会えなかった」と答える。',
      mean: 'didn’t see ＝ 会えなかった。デートの予定がそもそも実現していない。',
      trap: 'didn’t の t はほぼ消え、did に近く聞こえる。「ン」の音が残るかを聞く。',
      use: 'I didn’t get to see her.（彼女には会えなかった）' },

    // R fix: V2 (blind 75 %): "it went fine" didn't fit a story told as a disaster; all three are now bad nights
    // why: went home ← "pouring down rain" is the first complaint, heard as the whole story; fight with Joshua ←
    //   "Joshua" + "punch" in the wrong relation (she never saw him)
    { id: 'g2', skill: 'gist', level: 'B2', point: 'night', reveals: ['clocked', 'joshua'], seg: [20.0, 60.0],
      stem: 'How did Rachel’s night out go, from her story?',
      choices: ['Things kept going wrong, and she hit someone', 'It rained, so she gave up and went home early',
                'She met Joshua, but the two of them fought'], a: 0,
      cue: '最初の答えと、話の最後の一文を比べて。',
      said: '彼には会えず、雨の中、入口の名簿でももめ、最後は人を殴った、と話す。',
      mean: '悪いことが次々に重なった夜。最後の一撃がオチになっている。',
      trap: 'Joshua と punch が近いので「彼とけんか」に聞こえやすい。didn’t see を落とさない。',
      use: 'The whole day was a disaster.（一日じゅう散々だった）' },

    // EAR CHECK (header): the stress on "did"
    // why: on "I" ← the "I, not someone else" contrast learners know; on "girl" ← "a girl, not the guy she went to see"
    //   (Joshua just before)
    // anchor: 22.4–27.2 s "I didn't see Joshua, but I did punch a girl": "did" here is only there for emphasis
    //   (plain "I punched" needs no "did"), set against "didn't see"
    // R fix: V2 (blind 70 %): the key spelled out its reasoning; "I" (no one else is in question) is now "punch" (a
    //   blow, not words). B1: now reveals `clocked`, since the stem says she punched someone
    // retired: the ear-check policy: a C2 stress item (the stress on “did” in “but I did punch a girl”, 24.9 s); back
    //   after the ear check
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'didpunch', reveals: ['joshua', 'clocked'], seg: [22.0, 27.85], retired: true,
      stem: 'In “…but I did punch a girl”, where is the stress, and why?',
      choices: ['On “did”: set against “didn’t see”', 'On “punch”: a punch, not just words',
                'On “girl”: a girl, not Joshua'], a: 0,
      cue: 'but のあと、いちばん強く長く聞こえる語。',
      line: 'I didn’t see Joshua, but I *did* punch a girl in the face.',
      said: '「彼には会えなかった。でも女の子を殴っちゃった」と言う。',
      mean: 'punched で済むのに did を入れるのは強調。前の didn’t と対比して「会えはしなかったが、殴りはした」。',
      trap: 'punch や girl を強めると別の対比になるが、その話はない。強調の did は否定と組で聞く。',
      use: 'I didn’t win, but I did finish.（勝てなかったけど、完走はしたよ）' },

    // why: taken off ← "no Rachel Green on the list" heard alone, without the "but there was…"; two Rachels ← the
    //   friend's own reading ("did you get to meet her?"), which "there is no Rachel Greep" refutes
    // R fix: V2 (blind 70 %): rebalanced so the key isn't the only "her name" choice with a hedge ("a bit")
    { id: 'i1', skill: 'infer', level: 'C1', point: 'greep', seg: [31.2, 43.7],
      stem: 'What had gone wrong with the guest list, from what Rachel says?',
      choices: ['Her name was there, but spelled wrongly', 'Her name had been left off it entirely',
                'It had two Rachels, and the other was real'], a: 0,
      cue: '「on the list」のあと、but で始まる部分の名前の終わり。',
      line: 'there was *no Rachel Green* on the list, but there was a *Rachel Greep*.',
      said: '名簿に Green はなく Greep ならあった。そのあと「Greep なんて人はいない」と言う。',
      mean: '最後の一音だけ違う名前。つまり自分の名前のつづり違い。',
      trap: '「名前がない」だけ聞くと消されたと取りやすい。but のあとに続きがある。',
      use: 'I think my name is misspelled.（私の名前、つづりが違うみたいです）' },

    // R fix: V2 (blind 80 %): "skip ahead to the punch" was weak; it's now the not-listening reading, a stock sitcom
    //   laugh
    // why: teasing ← the question heard as sarcasm about a made-up story; not listening ← the stock "he wasn't
    //   listening" laugh; "her" tracks Rachel's words, and "No, there is no Rachel Greep" answers a sincere question
    { id: 'h2', skill: 'humor', level: 'C1', point: 'greep', reveals: ['getto'], seg: [34.3, 43.7],
      stem: 'Why does the friend’s “So did you get to meet her?” get a laugh?',
      choices: ['He takes the misspelling for a real woman', 'He is hinting that she made the story up',
                'He has stopped listening and asks at random'], a: 0,
      cue: '質問のあとの Rachel の返事、最初の二語。',
      line: '*Did you get to meet her?* — No, *there is no Rachel Greep*.',
      said: '友だちが「その人に会えた？」と聞き、Rachel が「そんな人いないの」と答える。',
      mean: 'つづり違いの名前を、本当にいる別人だと思っている。真顔の勘違いが笑い。',
      trap: '茶化したと取りやすいが、Rachel は本気で訂正している。返事から質問の意図を読む。',
      use: 'Wait, there’s no such person.（待って、そんな人いないよ）' },

    // R fix: §9.5 and V2 (blind 60 %): "did you get a meet her" doesn't fit the gap; it's now "didn't you get to"
    // why: did you go to ← "get" flapped to "ged" and "to" weak, so "go to" fills it; do you ← past "did" weak
    //   and the d lost; didn't you ← "did you" linked to "didja", heard as a negative question
    { id: 's1', skill: 'sound', level: 'B2', point: 'getto', seg: [36.4, 39.5],
      stem: 'Fill the gap: “Oh, so ___ meet her?”',
      choices: ['did you get to', 'do you get to', 'did you go to', 'didn’t you get to'], a: 0,
      cue: 'so のあと、meet の前の四語。',
      line: 'Oh, so *did you get to* meet her?',
      said: '「じゃあ、その人には会えたの？」と聞いている。',
      mean: 'get to ＝「〜する機会がある」。get の t が弾み「ゲラ」、to は弱く「タ」。',
      trap: '「ディジュゲラ」と続き、did と do、get と go が混ざりやすい。過去の話なら did。',
      use: 'Did you get to try the local food?（現地の料理は食べられた？）' },

    // R fix: V2 (blind 70 %) and S1: the stem said "before quoting her", and only the key had "saying, like". The stem
    //   names the moment now, and the choices are three plain glosses
    // why: completely sure ← all = 全部, "she was all (= totally)…"; the only one ← "all" heard as "she alone"
    { id: 'm2', skill: 'marker', level: 'B2', point: 'wasall', seg: [43.3, 48.0],
      stem: 'When Rachel says the other girl “was all…”, what does “was all” mean?',
      choices: ['said something like', 'was completely sure', 'was the only one to say'], a: 0,
      cue: 'was all のあとに続く、声色を変えた部分。',
      line: 'and she *was all*, “I’m Rachel Greep! I’m Rachel Greep!”',
      said: '「その子が『私が Rachel Greep よ！』って」と口調をまねる。',
      mean: 'be all ＋ セリフ ＝「〜って感じで言った」。人をまねて伝えるくだけた言い方。',
      trap: 'all を「全部」と取ると意味がつながらない。直後にセリフが来たら、引用の合図。',
      use: 'And he was all, “No way!”（で、彼が「まさか！」って感じで）' },

    // R fix: V2 (blind 65 %): rebalanced to three parallel outcomes at the door
    // why: both in ← "overheard us" read as a kind stranger stepping in; turned away ← the expected script, a liar
    //   caught; "he let her right in" settles it
    { id: 'i2', skill: 'infer', level: 'B2', point: 'letin', seg: [43.3, 49.05],
      stem: 'What happened once the other girl spoke up?',
      choices: ['She got in under Rachel’s name', 'She got them both in at last', 'She was caught and turned away'], a: 0,
      cue: 'セリフのまねのあと、and he で始まる短い文。',
      line: 'and *he let her right in*.',
      said: '別の子が「私よ」と名乗り、入口の人はその子をすぐ通した。',
      mean: 'he は入口の係。Rachel の名前を使って、他人が入ってしまった。',
      trap: 'overheard us で「助けてくれた」と取りやすい。let her の her が誰かを追う。',
      use: 'They let us right in.（すぐに入れてくれた）' },

    // why: deserved ← "No" read as moral restraint (the sincerity flip); too cold ← "pouring down rain" and "horrible"
    //   carried over as the reason
    // anchor: 50.5 s the "No" is followed by a reason of place, not of right ("she was already in"), and 55.6 s "so I
    //   clocked her" shows she was ready to hit
    // R fix: V2 (blind 60 %): the weather choice is now a practical reason too, so the key isn't the only one about
    //   being able to reach her
    // retired: one C2 alone is under 2 (nt2 retired, a stress item)
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'already', reveals: ['umbrella', 'clocked'], seg: [48.65, 56.5], retired: true,
      stem: 'What does Rachel’s “No, she was already in” tell us about her?',
      choices: ['She’d have hit her if she could reach her', 'She drew the line at hitting the liar',
                'She was too cold and wet to go after her'], a: 0,
      cue: 'No のあとの理由が、どんな種類の理由か。',
      line: 'So you hit her in the face? — No, *she was already in*.',
      said: '「その子を殴ったの？」と聞かれ、「ううん、もう中に入っちゃってたから」と答える。',
      mean: '殴らなかった理由は「手が届かなかった」だけ。本気なら「いたら殴ってた」になる。そのあと別の人を本当に殴る。',
      trap: 'No を「そこまではしない」という分別と取りやすい。断る理由が気持ちか状況かを聞き分ける。',
      use: 'I would’ve said something, but she’d left.（言ってやろうと思ったけど、もういなかった）' },

    // R fix: V2 (blind 75 %), and B1: the old distractor stated i2's key, so it's now an insult reading, and every choice
    //   starts with "a woman behind her"
    // why: cut in ← "behind me" plus the line at the door, the cutting-in script; a nasty name ← Rachel's own insult
    //   word "big b—" in the wrong relation
    { id: 'd3', skill: 'detail', level: 'B1', point: 'umbrella', reveals: ['clocked'], seg: [50.0, 56.5],
      stem: 'Why did Rachel finally hit someone?',
      choices: ['A woman behind her tried to steal her umbrella', 'A woman behind her tried to cut in front of her',
                'A woman behind her called her a nasty name'], a: 0,
      cue: '「behind me」のあと、動詞とその次の語。',
      line: 'this big … behind me *tried to steal my umbrella*, so I clocked her.',
      said: '後ろにいた大柄な女が傘を盗ろうとしたので、殴った、と言っている。',
      mean: '名前を使った子ではなく、傘を盗ろうとした別の人を殴った。',
      trap: 'behind me で「割り込み」を思い浮かべやすい。but then で話が変わったら、次の動詞を聞く。',
      use: 'Someone tried to steal my bag!（誰かにかばんを盗られそうになった！）' },

    // R fix: V2 (blind 70 %): "called a guard over" was the odd one out; the distractors are now the slang "clock" =
    //   notice (a hard look) and a grab for the umbrella
    // why: glared ← slang clock = notice, spot, so "gave her a look"; grabbed it back ← the umbrella just mentioned,
    //   the natural follow-up action
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'clocked', reveals: ['umbrella'], seg: [50.4, 56.5],
      stem: 'What does Rachel mean by “so I clocked her”?',
      choices: ['She punched her hard', 'She glared right at her', 'She grabbed it back off her'], a: 0,
      cue: '話の最初に言った出来事と、この一文をつなげて。',
      line: 'tried to steal my umbrella, *so I clocked her*.',
      said: '「傘を盗ろうとしたから、ガツンとやってやった」と言う。',
      mean: 'clock ＝（俗）顔を殴る。最初の「殴った」の話がここで回収される。',
      trap: 'clock を「時計」や「目を付ける」と取りやすい。くだけた会話では「殴る」もある。話の頭と結んで聞く。',
      use: 'He almost got clocked for that.（それで危うく殴られかけた）' },
  ]
};
