// REVIEW 2026-11-17: pass 5, fix 14, drop 2, new 2; ear checks 1
// Open: c1 rests on how “I do not!” is delivered (ear check). a3 assumes “About time” answers the one who brings the
//   fries (“Here, chili fries”); the stem doesn't name the speaker.
// “Emma Stone Guest Stars on 'iCarly'! 🎉 | Full Episode in 5 Minutes | @NickRewind” (NickRewind, the official iCarly
// channel, Best of iCarly 📲): an episode cut down to five minutes. Spencer's only tennis friend turns out to be a third
// grader, so Carly and a friend pick out men his own age in the park; the dinner with them falls apart over chili fries
// and name-calling, and Spencer tells Carly he hates them. A fan scene closes the clip.
// Segments from the captions, words from whisper (2026-11-17). Named in the audio: Spencer, Ryan, Darnell, Carly.
// Carly's friend isn't named, so stems say “the girls”; the speakers at the apartment (91–104 s) aren't named, so h2
// says “the speaker”. Keys rest on words and turn order, not on who is on screen.
// Untested on purpose: 26–28 s “Get ready to type” (needs the episode's setup), 65.6 s (captions “you can be”, whisper
// “He could be”), 92 s (captions “I got their”, whisper “They got their”), 138–150 s (captions “boating… going bowling
// oh oh”, whisper “bowling… We're not really going bowling”, and whisper's “out to dinner” line isn't in the captions),
// 164–170 s (who brings the cilantro), 189 s (captions “90s Are For Us”, whisper “These are for us”), 198.7 s (captions
// “I am”, whisper “I am not!”), 206–214 s (whisper only: “Carly!… I don't like those guys”), 219.7 s “in live theater”
// (probably “and”, both write “in”), and the fan scene 237–302 s (crowd talk overlaps).
// 53.9 s: the captions cut “friends his own age” to “own h”; g1 runs on to 70.8 s, where both have “Perfect age”.
// 28.5 s: “Uh, what friend?” comes after “Get ready to type”, so it may be Carly's; no item turns on who says it.
// EAR CHECK: 225.2 s c1 — “I do not!” sounds like a kid's comeback (both sources have the words; the joke rests on
//   the delivery)
import type { Clip } from '../types.ts';

export const spencerFriends: Clip = {
  id: 'spencerfrnds', video: '275p_K6X2Gg', title: 'Emma Stone Guest Stars on \'iCarly\'! 🎉 | Full Episode in 5 Minutes',
  dur: 302, wpm: 104, band: 'slow', tags: ['友だち', '家'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: V2 (75 % blind) and S4: “went soft” rested on “floppy” at 47 s, outside the segment; the cue had “made”,
    //   a word only the key had (S3). All three are about the heat now.
    // why: tired ← “the heat just—” finished as the heat getting to him, not to “it”; bought ← “my own tennis racket”
    //   heard without “made”
    { id: 'i1', skill: 'infer', level: 'B2', point: 'racket', seg: [0.5, 20.2],
      stem: 'Spencer stops mid-sentence after “the heat just…”. What happened?',
      choices: ['The heat ruined the racket he made himself', 'The heat wore him out before the game ended',
                'The heat ruined the new racket he’d bought'], a: 0,
      cue: 'ラケットの話の最初の文と、言いかけてやめた文。',
      line: 'I *made my own tennis racket*. And when I got it out into the sun, I guess the heat just—',
      said: '自分でラケットを作り、日なたに出したら暑さで…と言いかけてやめる。',
      mean: '最後まで言わないが、手作りラケットが熱でだめになったと分かる。',
      trap: 'heat から「暑さでばてた」と取りやすい。言いかけの文の主語 it は直前のラケット。',
      use: 'I guess the heat just got to it.（暑さにやられたみたい）' },

    // R fix: V2 (50 % blind): “come along next time” and “alone in the heat” were fillers.
    // why: beat him ← “I lost” comes just before, so the friend sounds like the winner; play with friends more ←
    //   “with a friend, right?” heard as advice
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'probe', seg: [21.8, 33.0],
      stem: 'When Spencer is asked who he played tennis with, what is the question for?',
      choices: ['To check that he has a friend he can name', 'To find out which friend beat him at tennis',
                'To hint that he should play with friends more'], a: 0,
      cue: '「right?」で終わる聞き方と、そのあとの返事。',
      line: 'if you played tennis, then you were *with a friend, right?*',
      said: '「テニスしたなら、友だちと一緒だったんでしょ？」と聞き、彼は少し考えて名前を言う。',
      mean: '答えを決めつけた聞き方で、友だちの名前を引き出している。',
      trap: 'I lost の直後なので「誰に負けたか」の質問に聞こえる。right? は決めつけて確かめる形。',
      use: 'You went with someone, right?（誰かと行ったんでしょ？）' },

    // R drop: a2. “Uh, what friend?” follows “Get ready to type” and may be Carly's question, so the key (Spencer
    //   stalling) rests on who speaks; with “Sure, why?” it's also a tone call (V1, K1). Never shipped: deleted.

    { id: 'x2', skill: 'dict', level: 'B1', point: 'bathroom', seg: [33.8, 38.9],
      stem: 'Type what Ryan asks: “Hey, man, can I ___?” (3 words)', answer: 'use your bathroom',
      cue: '「can I」のあと、つながる3語。',
      line: 'Hey, man, can I *use your bathroom*?',
      said: '「ねえ、トイレ借りていい？」と家の人に聞く。',
      mean: 'use your が「ユーズユア」と一続きになる。家のトイレを借りるときの決まった言い方。',
      trap: 'use your がつながると1語に聞こえ、your を落としやすい。動詞のあとの所有格を探す。',
      use: 'Can I use your bathroom?（トイレお借りしていいですか）' },

    // R new: replaces w1 for the literal minimum (detail, number, who ≥ 4). Blind: 35 %.
    // why: left ← right/left is the last, shortest word, easy to let slip; down the hall ← the usual way directions
    //   in a house are given
    { id: 'dn1', skill: 'detail', level: 'B1', point: 'bathroom', seg: [33.8, 39.6],
      stem: 'Where is Ryan told the bathroom is?',
      choices: ['Up there, to the right', 'Up there, to the left', 'Down the hall, to the right'], a: 0,
      cue: '「Sure」のあと、場所を言う短い文。',
      line: 'Sure, it’s *up there to the right*.',
      said: '「どうぞ、上の右のほうだよ」とトイレの場所を教える。',
      mean: 'up there ＝ 上の階や上のほう。家の中で場所を教えるときの決まった形で、旅先でもよく聞く。',
      trap: '文の最後の right と left は短く、聞き流しやすい。方向は最後の一語まで聞く。',
      use: 'It’s down the hall, on the left.（廊下の先、左側です）' },

    // R fix: S4: the segment ended 0.4 s after “Third”; now 44.8 s.
    // why: wrong grade ← the answer does correct the question, but the joke is which way; offended ← being called a kid
    //   could hurt, but Ryan isn't the one who answers
    { id: 'h1', skill: 'humor', level: 'C1', point: 'grade', seg: [33.8, 44.8],
      stem: 'Why does the one-word answer about Ryan’s grade get a laugh?',
      choices: ['The guess was a jab, and he’s even younger', 'The guess was right, but said too loudly',
                'The guess upset Ryan, who is still in the room'], a: 0,
      cue: '質問の言い方と、返事の数の向き。',
      line: 'What is he, in *fourth grade*? — *Third*.',
      said: '「何、4年生？」とあきれて聞くと、「3年生」とさらに下の答えが返る。',
      mean: '「4年生かよ」は大げさな皮肉のつもり。実際はもっと年下で、皮肉が事実に負ける笑い。',
      trap: '数を直しただけに聞こえるが、笑いは「冗談より現実が上」の部分。誇張の上を行く答えに注目。',
      use: 'What is he, five? — Four.（何、5歳？ー4歳）' },

    // R fix: V2 (80 % blind): two fillers. Now four choices, each a thing to find, with two built on the lines just
    //   before (the racket, the lost game).
    // why: Ryan's age ← “his own age” said right after the third grader; fix the racket ← “fix my floppy racket” is
    //   the line just before; tennis partner ← the scene opened on a lost game
    { id: 'g1', skill: 'gist', level: 'B1', point: 'plan', seg: [40.8, 70.8],
      stem: 'After meeting Ryan, what do the girls set out to find?',
      choices: ['Men Spencer’s age to be his friends', 'Kids Ryan’s age for him to play with',
                'Someone who can fix Spencer’s racket', 'A better tennis partner for Spencer'], a: 0,
      cue: '「we have to find」のあと、誰のための話か。',
      line: 'we have to find *Spencer some friends his own age*.',
      said: '「スペンサーに同年代の友だちを」と決め、公園で候補を探す。',
      mean: 'own age ＝ 同じくらいの年。大人の兄に大人の友だちを、という計画。',
      trap: 'his を直前の子どもと取りやすく、racket の話も残る。find のあとの名前で誰のためか決まる。',
      use: 'You need friends your own age.（同い年の友だちを作らなきゃ）' },

    // R fix: S4: the segment ended 0.1 s after “Third”; now 44.8 s.
    // why: fourth ← said first, as the guess; fifth/second ← the -th endings run together at speed
    { id: 'n1', skill: 'number', level: 'B1', point: 'grade', seg: [41.1, 44.8],
      stem: 'What grade is Ryan in?',
      choices: ['Second', 'Third', 'Fourth', 'Fifth'], a: 1, keep: true,
      cue: '質問の中の数と、そのあとの短い返事。',
      line: 'What is he, in fourth grade? — *Third*.',
      said: '「何、4年生？」と聞かれ、「3年生」と答える。',
      mean: 'Spencer のテニス仲間は小学3年生。大人の友だちではないと分かる。',
      trap: '質問の fourth が先に耳に残る。答えは返事の一語。数字は最後に言われたほうを取る。',
      use: 'What grade is she in?（あの子、何年生？）' },

    // R fix: S4: the end padded to 49.5 s. Its ear check came off: both sources have “I gotta go”, and racket/bracket
    //   isn't the key.
    // why: gonna ← “gotta” and “gonna” differ in one consonant at speed; better ← “I’d better go” fits the exit, and
    //   the d is weak; I’ll go and ← the same exit meaning, with “go” heard
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotta', reveals: ['racket'], seg: [45.2, 49.5],
      stem: 'Fill the gap: “Ah, ___ fix my floppy racket!”',
      choices: ['I gotta go', 'I’m gonna go', 'I’d better go', 'I’ll go and'], a: 0,
      cue: '文の最初、短くつながる2〜3語。',
      line: 'Ah, *I gotta go* fix my floppy racket!',
      said: '「ふにゃふにゃのラケット、直さなきゃ」と言って去る。',
      mean: 'gotta ＝ got to。t が弾んで「ガラ」に近く、「〜しなきゃ」の意味。',
      trap: 'gonna（〜するつもり）と1音違い。真ん中が「ラ」なら gotta、「ナ」なら gonna。',
      use: 'I gotta go, see you later.（行かなきゃ、またね）' },

    // R fix: V2 (50 % blind) and K1: “Alone?” is said between the two, so “not too busy” could be defended. The stem
    //   now points at “look”, and the choices are one shape.
    // why: young/old ← “Perfect age” comes just before, so the age reading carries on; smart/loud ← “too smart” is
    //   heard, but the other half is “stupid”
    { id: 'd2', skill: 'detail', level: 'B1', point: 'criteria', seg: [62.6, 70.6],
      stem: 'Right after “Perfect age”, what is said about how the man looks?',
      choices: ['Neither too dumb nor too bright', 'Neither too young nor too old', 'Neither too smart nor too loud'], a: 0,
      cue: '「Perfect age」のあと、look に続く言葉。',
      line: 'Perfect age… Doesn’t look *too stupid or too smart*.',
      said: '「年もちょうど。ばかすぎず、頭よすぎない」と品定めする。',
      mean: 'Spencer に合うのは「ほどほど」の人。友だちをカタログ式に選ぶ。',
      trap: '直前の Perfect age で年の話が続くと思いやすい。too ～ or too ～ は両側を否定する。',
      use: 'Not too hot, not too cold.（暑すぎず寒すぎず）' },

    // why: bump into ← “hit” read literally (the same walk over, then a bump); wait and watch ← “going in” heard as a hunter's lookout
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'hitup', seg: [68.5, 71.6],
      stem: 'Right before “Going in”, what do the girls decide to do?',
      choices: ['Walk up and start talking to him', 'Walk over and bump into him on purpose',
                'Watch him a little longer first'], a: 0,
      cue: '「let’s」のあとの動詞と、すぐ続く一言。',
      line: '*Let’s hit him up*. — Going in.',
      said: '「声かけよう」「行くよ」と言って近づく。',
      mean: 'hit someone up ＝ 声をかける、連絡する。叩くことではない。',
      trap: 'hit を「ぶつかる」と取りやすい。hit up は人に話しかける・頼むときの口語。',
      use: 'Hit me up when you’re in town.（こっちに来たら連絡して）' },

    // R fix: V2 (70 % blind): “knows the same Darnell” and “upset” were weak. Both distractors are near misses now.
    // why: bad news ← “I used to know a guy named…” sounds like the start of a warning; sorry ← he does admit it isn't
    //   interesting, but he doesn't apologize
    { id: 'h2', skill: 'humor', level: 'C1', point: 'darnell', seg: [95.0, 104.6],
      stem: 'Why is the speaker’s answer to “And?” funny?',
      choices: ['He had no real story, and says that’s fine', 'He’s hinting this Darnell is bad news',
                'He admits it’s dull, and says he’s sorry'], a: 0,
      cue: '「And?」のあと、話の続きがあるかどうか。',
      line: 'I used to know a guy named Darnell. — And? — *Not every story has to be interesting*.',
      said: '「昔ダーネルって知り合いがいた」「で？」「話が全部おもしろい必要はない」。',
      mean: '「で？」はオチを求める合図。オチがないのに開き直る、肩すかしの笑い。',
      trap: '「昔〜って人がいた」は警告の前置きにも聞こえる。認めてはいても謝ってはいない。',
      use: 'And? What happened next?（で？それからどうなったの？）' },

    // why: admits they wouldn't ← “would” heard as a doubt, as in 「そうでしょうね」; asks what they'd like ← “how
    //   would you like” heard as a real question
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'pushy', seg: [130.4, 137.4],
      stem: 'When the men don’t answer the offer, what does the next line do?',
      choices: ['Pushes them to say yes anyway', 'Admits that they probably won’t',
                'Asks what kind of friend they’d like'], a: 0,
      cue: '返事がないあと、短い一文の調子。',
      line: 'how would you like to be friends with him? … *You know you would*.',
      said: '「友だちにならない？」と聞き、返事がないので「なりたいでしょ」と押す。',
      mean: '「本当はなりたいくせに」の意味。答えを決めつけて押す言い方。',
      trap: 'would を推量と取ると「無理だよね」に聞こえる。You know で始まると決めつけ。',
      use: 'Come on, you know you want to.（ほら、本当はしたいんでしょ）' },

    // R fix: V2 (75 % blind); S4: the segment cut “good chili fries” (to 206.5 s), so it ends at 201.0 s after “I am
    //   not!”; the cue named the fries (S3); reveals 'insults' went with w1.
    // why: politics ← the word comes later, at home, not at the table; cilantro ← the gift is the first thing said, and
    //   a gift usually breaks the ice
    { id: 'g2', skill: 'gist', level: 'B2', point: 'dinner', reveals: ['fries'], seg: [155.4, 201.0],
      stem: 'How does Spencer’s dinner with his new friends go?',
      choices: ['It ends in a fight over food and insults', 'It goes fine until they start on politics',
                'It starts awkward, but cilantro breaks the ice'], a: 0,
      cue: 'テーブルの後半、互いに何と言うか。',
      line: 'You said you didn’t want chili fries… You guys are so *mean and boring*. — Well, you’re *childish*.',
      said: 'チリポテトの取り合いから、「意地悪でつまらない」「子どもっぽい」と言い合いになる。',
      mean: '食事は友だち作りどころか、けんかで終わる。計画は失敗。',
      trap: 'cilantro の贈り物で打ち解けたと思いやすい。politics は後で家で出る言葉。最後で判断。',
      use: 'Well, that went badly.（うーん、散々だったね）' },

    // R new: replaces a2 for the attitude minimum. Blind: 40 %. The phrase isn't quoted in the stem (§9.2).
    // why: relieved ← 「やっと来た」 can be glad in Japanese; so soon ← “time” heard as “right on time”
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'abouttime', seg: [177.6, 182.5],
      stem: 'When the chili fries arrive, how does the first reply sound?',
      choices: ['Impatient, as if the wait was too long', 'Relieved and glad the food is finally here',
                'Surprised that the fries came so soon'], a: 0,
      cue: '料理が届いた直後の、短い二語。',
      line: 'Here, chili fries. — *About time*.',
      said: '料理を出されて、すぐに「やっとかよ」と返す。',
      mean: 'About time ＝「遅いよ、やっと来た」。お礼ではなく、待たされた不満を短く言っている。',
      trap: '日本語の「やっと来た！」は喜びにもなる。About time は待たせた相手への文句。',
      use: 'About time you showed up!（やっと来たか、遅いよ）' },

    // R fix: V2 (70 % blind): “not what he ordered” was a filler; the nachos near miss replaces it. Reveals a3's point
    //   (the trap explains “About time”).
    // why: long wait ← “About time” is said, but before the grab; nachos ← “nachos” comes next, as his excuse, not a wish
    { id: 'i2', skill: 'infer', level: 'B2', point: 'fries', reveals: ['abouttime'], seg: [178.1, 188.9],
      stem: 'Why does one of the men say “What the heck?”',
      choices: ['Spencer is eating fries he’d said no to', 'The fries took far too long to come out',
                'Spencer wants nachos, not the fries'], a: 0,
      cue: '「What the heck」のすぐあとの文。',
      line: 'Oh, God, those look good. — What the heck? *You said you didn’t want chili fries*.',
      said: '「うまそう」と手を出し、「いらないって言ったじゃん」と言われる。',
      mean: 'What the heck ＝「おい、何だよ」。断ったものを取られて文句を言う。',
      trap: 'About time や nachos が耳に残りやすい。文句の中身はすぐ次の文にある。',
      use: 'Hey, you said you didn’t want any!（いらないって言ったよね！）' },

    // why: too spicy ← “chili” suggests heat; take too long ← “same time” turned into a waiting complaint
    { id: 'd3', skill: 'detail', level: 'B2', point: 'fries', seg: [182.7, 188.9],
      stem: 'Why had Spencer turned down the chili fries at first?',
      choices: ['He expected his nachos to come with them', 'He expected them to be far too spicy',
                'He expected them to take too long'], a: 0,
      cue: '「’cause I thought」のあと、別の料理。',
      line: '’cause I thought *my nachos were going to come out at the same time*.',
      said: '「ナチョスが同時に来ると思ったから」と言い訳する。',
      mean: '断ったのは嫌いだからではなく、自分の料理と重なると思ったから。今さら欲しい言い訳。',
      trap: 'chili から「辛い」、same time から「待つ」を連想しやすい。理由は cause の後ろ全部。',
      use: 'I thought they’d come together.（一緒に来ると思って）' },

    // anchor: 197.3 s “Well, you're childish” (the men's verdict), then 224–226 s “friends your own age. — I do not!”,
    //   then 228–234 s she soothes him like a child
    // R fix: V2 (70 % blind), the one C2 rewrite: two weak readings. It now asks who the joke is on; the anchor holds.
    // why: the men ← he has just called them dull and unfun, so the laugh could be at them; Carly ← her plan failed,
    //   and “come here” follows as if she's to blame
    { id: 'c1', skill: 'humor', level: 'C2', point: 'denial', reveals: ['baby'], seg: [191.0, 236.6],
      stem: 'Who is Spencer’s “I do not!” really a joke on, and why?',
      choices: ['Himself: his kid-style denial proves them right', 'The men: he was right that they’re no fun',
                'Carly: she picked friends he could never like'], a: 0,
      cue: '少し前の「childish」と、言い返し方。',
      line: 'Well, you’re *childish*. … But you need friends your own age. — *I do not!*',
      said: '「子どもっぽい」と言われたあと、「同年代の友だちが要る」に「要らないもん！」と言い返す。',
      mean: '子どもの口げんかの形で否定するので、否定が「子どもっぽい」の証拠になる。笑われるのは本人。',
      trap: '直前の悪口で、笑いの的が相手側に見えやすい。否定の言い方自体が childish の証拠。',
      use: 'I am not! — See? Like a kid.（違うもん！ーほら、子どもみたい）' },

    // R drop: w1. The episode's premise answers it (the “childish” one is Spencer), so the swap distractor fell to a
    //   blind read (V1), and it needed an ear check on who speaks. g2 and c1 cover the insults. Never shipped: deleted.

    // R fix: V2 (55 % blind): two fillers; the cue said “before her sentence ends” (S3).
    // why: lets her finish ← the reasons come after the “No!”, so the order is easy to flip; blames her ← “dull” is
    //   said, but about the men, not her choice
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'chance', seg: [213.6, 221.8],
      stem: 'When Carly starts “Just give them a chance to…”, what does the reply do?',
      choices: ['Turns her down before she finishes', 'Lets her finish, then turns her down',
                'Blames her for picking such dull men'], a: 0,
      cue: '「chance to」の直後に重なる音。',
      line: 'Just give them a chance to— *No!*',
      said: '「チャンスを…」と言いかけたところに「やだ！」とかぶせる。',
      mean: '最後まで聞かずに断るのは、話し合う気がないという合図。子どもの拒否の仕方。',
      trap: '後に理由が続くので、聞いてから断ったように思いやすい。No! は to の直後にかぶさる。',
      use: 'Before you say no, just hear me out.（断る前に、とにかく聞いて）' },

    // anchor: 216–221 s the list (“politics and taxes”), then 223.4 s “But you need friends your own age”
    // R fix: V2 (65 % blind), the one C2 rewrite: the key was the only “Nothing;”. Three readings of the list now; the
    //   anchor holds.
    // why: too old ← “dull” and “taxes” sound like old men, but she answers that they are his age; argument ←
    //   “politics” heard as heated arguing, but nothing in the clip says they argue
    { id: 'c2', skill: 'humor', level: 'C2', point: 'topics', reveals: ['chance'], seg: [213.6, 226.6],
      stem: 'Taken seriously, what do Spencer’s complaints about the men show?',
      choices: ['They act their age, and he doesn’t', 'They’re too old to share his interests',
                'They turn every talk into an argument'], a: 0,
      cue: '文句に並ぶ話題と、すぐあとの彼女の一言。',
      line: 'they talk about *politics and taxes*… — But you need friends your own age.',
      said: '「政治とか税金の話をする。大嫌い」と言うと、「でも同年代の友だちが要る」と返される。',
      mean: '挙げた欠点は、どれも大人のふつうの話題。本気で聞けば「大人っぽい」だけで、文句が自分に返る。',
      trap: 'politics や taxes から「年寄り」「議論好き」を想像しやすいが、返事は own age。',
      use: 'So, they act like adults. And?（つまり大人っぽいってこと？で？）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'topics', seg: [215.6, 221.8],
      stem: 'Type what the men talk about: “they talk about ___…” (3 words)', answer: 'politics and taxes',
      cue: '「talk about」のあと、三つの語。',
      line: 'they’re dull and unfun and they talk about *politics and taxes*…',
      said: '「つまらなくて楽しくない。政治とか税金の話をする」と文句を言う。',
      mean: 'and が弱く「ン」だけになり、politics‿n‿taxes と一続きになる。',
      trap: 'and が消えると1語に聞こえる。politics の t は弾み、「ポリティクス」より短い。',
      use: 'Let’s not talk about politics.（政治の話はやめよう）' },

    // R fix: V2 (55 % blind) and §9.6: a yes/no frame with “sorry” as a filler. Now three ways of meaning it.
    // why: teasing ← “baby” to a grown man can be mockery; come and listen ← “come here” taken as an order before more
    //   advice
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'baby', seg: [222.8, 236.6],
      stem: 'When Spencer is told “Come here, baby”, how is it meant?',
      choices: ['Gently, calming him down like a child', 'Mockingly, teasing him for being a baby',
                'Firmly, telling him to come and listen'], a: 0,
      cue: '呼びかけのあと、何度もくり返す言葉。',
      line: 'Oh, come here. Come here, baby. *It’s okay. It’s okay*.',
      said: '「おいで、よしよし。大丈夫、大丈夫」と何度もなだめる。',
      mean: '年下の妹が、大人の兄を小さい子のようにあやしている。からかいではなく本気のなだめ。',
      trap: 'baby を皮肉、come here を命令と取りやすい。続く It’s okay のくり返しで判断。',
      use: 'It’s okay, it’s okay. Come here.（大丈夫、大丈夫。おいで）' },
  ]
};
