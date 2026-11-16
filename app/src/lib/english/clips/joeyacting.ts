// REVIEW 2026-11-16: pass 7, fix 13, drop 0, new 0; ear checks 1
// Open question: d3 (tweezers), i1 and n1 (232 ÷ 13) are famous lines; a Friends fan gets them blind whatever the
//   choices, so I judged those from a non-fan's read.
// “Joey Teaches Acting | Friends” (the official Friends channel, Best of Season 3): Joey opens a soap-opera acting
// class, explains "reacting", tells some students they'll need to be better-looking, and shares his tricks for crying,
// looking evil and taking bad news.
// Segments from the captions, words from whisper (2026-11-16). Whisper loops from ≈101 s (after the last line). The
// sources differ at 61.1 s ("picks up the tree" / "Some tricks of the trade") and 63.5 s ("I've been able to cry" /
// "I've never been able to cry"); no key rests on those words, and no line quotes them.
// EAR CHECK: 31.0 s c1 — Joey stresses "RE-acting" on the first syllable (whisper writes "re-acting"; ship only once
//   confirmed)
import type { Clip } from '../types.ts';

export const joeyTeachesActing: Clip = {
  id: 'joeyacting', video: 'YiPHMMy7Z2w', title: 'Joey Teaches Acting', dur: 119, wpm: 169, band: 'fast',
  tags: ['職場'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (§9.4) — the title says he teaches, so "teaching a class" stood alone; all three are now teaching, and
    //   what for decides it
    // why: stage ← "acting" caught, "for soap operas" missed, and a class is the classic stage setting; Days of Our
    //   Lives ← the show is named, but as where he learned, not what he teaches
    { id: 'g2', skill: 'gist', level: 'B1', point: 'class', seg: [5.7, 22.0],
      stem: 'What is Joey doing in this scene?',
      choices: ['Teaching a class on soap acting', 'Teaching a class on stage acting',
                'Coaching new actors for Days of Our Lives'], a: 0,
      cue: '「I will be」のあと、何をするか。',
      line: 'I will be *teaching acting for soap operas*.',
      said: '「トリビアーニです。昼ドラの演技を教えます」と自己紹介している。',
      mean: 'teach acting ＝ 演技を教える。教える側に立っている。',
      trap: 'acting だけ拾うと何の演技か分からない。for のあとの soap operas（昼ドラ）まで聞く。',
      use: 'I’ll be teaching English this term.（今学期は英語を教えます）' },

    // R fix: V2 — "as Dr. Drake" was only on the key; the distractors now share "first day" or "Dr. Drake"
    // why: acting class ← he is teaching a class, so "first day" is heard as a class; last day ← "first" and "last" are
    //   both short words before "day"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'firstday', seg: [16.9, 31.6],
      stem: 'When did Joey learn the lesson he is about to share?',
      choices: ['On his first day as Dr. Drake', 'On his first day of acting class', 'On his last day as Dr. Drake'], a: 0,
      cue: '「on my」のあと、いつの話か。',
      line: 'on *my first day* as Dr. Drake Ramoray… I learned that',
      said: '「ドクター・ドレイク役の初日に学んだ」と言っている。',
      mean: 'first day as ～ ＝ 〜としての初日。現場で学んだ教えだと示している。',
      trap: '授業中なので「最初の授業」と思いやすい。as のあとの役名で、撮影現場の話と分かる。',
      use: 'On my first day here, I got lost.（ここに来た初日、迷子になった）' },

    // R fix: V2 — "admits he doesn't know" was weak; the choices are now three ways a teacher's definition can misfire
    // why: wrong ← "re-acting" / "acting again" heard as Joey confusing two words; technical ← a pro explaining a term
    //   to a class, the "jargon" reading
    { id: 'h1', skill: 'humor', level: 'C1', point: 'again', seg: [24.9, 34.6],
      stem: 'What is funny about how Joey explains his key word?',
      choices: ['He warns against a mistake nobody would make', 'He gets the meaning of his own key word wrong',
                'He makes a simple idea sound very technical'], a: 0,
      cue: '大事な語を言った直後の一文。',
      line: '…is *reacting*. This does *not mean acting again*.',
      said: '「大事なのはリアクティング。『もう一度演じる』という意味ではない」と言う。',
      mean: '誰も取らない読み方を、わざわざ打ち消している。先生らしく言うほど、ずれが目立つ。',
      trap: '語の分け方の話なので言いそこないに聞こえるが、本人は分かったうえで真顔で注意している。',
      use: 'Just to be clear, this isn’t a test.（念のため言うと、これはテストじゃない）' },

    // why: re-ACT-ing ← the dictionary stress, which a fluent learner expects; evenly ← the Japanese habit of giving
    //   each syllable the same weight (リアクティング)
    // anchor: 31.0 s whisper writes "re-acting" with a hyphen, and 31.7–33.4 s he rules out "acting again", a reading
    //   that only arises if "re" stands out
    { id: 'c1', skill: 'sound', level: 'C2', point: 'again', seg: [24.9, 34.6],
      stem: 'Where does Joey put the stress in “reacting”?',
      choices: ['On “re”: RE-acting', 'On “act”: re-ACT-ing', 'Evenly on every part'], a: 0,
      cue: '語の最初と真ん中、どちらが強いか。',
      line: 'the most important things in soap opera acting is *RE-acting*. This does not mean acting again.',
      said: '「一番大事なのは RE-acting」と re を強く言い、すぐ「もう一度演じる、ではない」と足す。',
      mean: 'ふつうは act を強く読む。re を強めると「再び演じる」に聞こえるので、打ち消しが要る。',
      trap: '辞書どおりの強勢を予想しやすい。強さの位置で意味が変わる。直後の打ち消しが手がかり。',
      use: 'It’s RE-cover, as in cover again.（「もう一度覆う」の re-cover だよ）', retired: true },

    // R fix: V2 — "remember their lines" was weak; it's now the method-acting reading, the usual acting-class advice
    // why: from memory ← the usual acting-class advice (悲しいことを思い出す); calm ← "tricks" from a pro heard as
    //   calming tips for nervous actors
    { id: 'g1', skill: 'gist', level: 'B2', point: 'tips', reveals: ['tweezers', 'evil'], seg: [24.9, 100.3],
      stem: 'What do Joey’s acting tips have in common?',
      choices: ['They make a face with a trick, not a feeling', 'They call up a real feeling from memory',
                'They keep actors calm in front of the camera'], a: 0,
      cue: '泣く、悪い顔、悪い知らせ、それぞれの方法。',
      said: '泣くときはピンセット、悪事の顔は釣り針、悪い知らせは割り算、と方法を並べる。',
      mean: 'どれも感情を本当に感じるのではなく、体や頭の小技で顔だけ作る方法。',
      trap: '演技の授業なので「本当の気持ちを思い出す」方法を予想しやすいが、どれも小技で顔だけ作る。',
      use: 'Here’s a little trick I use.（私がやってるちょっとしたコツがあるの）' },

    // R fix: V2 — "saying your own line on cue" was weak; it's now "speaking right after", which keeps the key's frame
    // why: second time ← "re-acting" split as re + acting, the reading he rules out; speaking ← "line" and "someone else
    //   just did" heard without "you don't have", as your turn to speak
    { id: 'd2', skill: 'detail', level: 'B2', point: 'reacting', seg: [30.5, 41.0],
      stem: 'How does Joey define the skill he calls most important?',
      choices: ['Responding when someone else has spoken', 'Speaking right after someone else has spoken',
                'Doing a scene a second time over'], a: 0,
      cue: '「It means」のあと。',
      line: 'It means *you don’t have a line, but someone else just did*.',
      said: '「自分にセリフがなくて、ほかの人が言ったとき」と説明している。',
      mean: 'reacting ＝ 相手のセリフへの反応。黙って表情で返す演技のこと。',
      trap: 'line が聞こえるので「自分のセリフ」の話に聞こえる。don’t have の否定を落とさない。',
      use: 'Don’t talk. Just react.（しゃべらないで、反応だけして）' },

    // R fix: V2 — "a side note he almost forgot" paraphrased "before I forget"; the key is now "tacked on in passing",
    //   next to two equally specific readings
    // why: planned ← "much more attractive" is said with weight and gets the laugh; a reply ← "Oh" at the start heard
    //   as reacting to someone
    { id: 'm1', skill: 'marker', level: 'B2', point: 'byway', seg: [49.3, 56.4],
      stem: 'How does Joey bring in the point about looks?',
      choices: ['As an extra point tacked on in passing', 'As the warning he planned to end on',
                'As an answer to a student’s question'], a: 0,
      cue: '「thanks a lot」のあと、文の頭の決まり文句。',
      line: '*Oh, by the way, before I forget*, to work in soap operas…',
      said: '「あ、ところで、忘れないうちに」と前置きして、見た目の話を始める。',
      mean: 'by the way ＝ ついでに、話は変わるけど。本筋ではない付け足しの合図。',
      trap: '中身が強烈なので本題に聞こえるが、前置きは「ついで」の扱い。前置きで話の重さを測る。',
      use: 'Oh, by the way, your mom called.（あ、そうそう、お母さんから電話あったよ）' },

    // R fix: K5/K6 — the key alone was two-part ("advice; he doesn't hear…"); all three now share the form
    // why: joke ← the audience laughs, so he must be joking; one student ← "some of you" heard as pointed at someone
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'attractive', reveals: ['byway', 'moving'], seg: [49.3, 59.6],
      stem: 'How does Joey mean the tip about becoming “more attractive”?',
      choices: ['As advice; he doesn’t hear the insult', 'As a joke; he expects the class to laugh',
                'As a dig; he aims it at one student'], a: 0,
      cue: '言ったあと、すぐ続ける一言。',
      line: 'some of you are going to have to become much more attractive. — All right, *moving right along*.',
      said: '「昼ドラで働くには、もっと見た目を良く」と言い、すぐ次の話に移る。',
      mean: '本人は事務連絡のつもり。失礼さに気づかず流している。',
      trap: '笑いが起きるので冗談に聞こえる。前の by the way と後の moving along が、本人の軽さを示す。',
      use: 'No offense, but you need a haircut.（悪気はないけど、髪切ったほうがいいよ）' },

    // anchor: 53.9–54.6 s "are going to have to" in both sources: five weak words in under a second
    { id: 'c2', skill: 'dict', level: 'C2', point: 'attractive', seg: [52.6, 56.2],
      stem: 'Type the words: “some of you ___ become much more attractive.” (5 words)', answer: 'are going to have to',
      cue: '「some of you」のあと。文法より、聞こえた音を。',
      line: 'some of you *are going to have to* become much more attractive.',
      said: '「何人かは、もっと見た目を良くしないと」。are から to まで5語が弱く一続き。',
      mean: 'be going to have to ＝ 〜しなければならなくなる。どれも弱く短く、are はほぼ消える。',
      trap: 'are を聞き落として going to から書きやすい。弱い be動詞も一語に数える。',
      use: 'We’re going to have to wait.（待つしかなさそうだ）', retired: true },

    // R fix: V2 — "says sorry" was easy to rule out; it's now "says it was only a joke", the take-back after a laugh
    // why: asks ← "All right" heard as checking with the class (いいですか); only a joke ← after a harsh remark gets a
    //   laugh, the usual move is to take it back
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'moving', seg: [52.6, 59.6],
      stem: 'Right after the tip about looks, what does Joey do?',
      choices: ['Goes straight on to his next point', 'Asks the class if they agree with him',
                'Tells them it was only a joke'], a: 0,
      cue: '「All right」のあとの三語。',
      line: 'All right, *moving right along*.',
      said: '「よし、どんどん次へ」と言って、次の話に移る。',
      mean: 'moving right along ＝ さっさと次へ。話を区切って先に進む言い方。',
      trap: 'All right は「いいですか」と確認にも聞こえるが、ここは区切りの合図。返事を待っていない。',
      use: 'Okay, moving right along…（はい、では次に…）' },

    // why: scissors ← "cut a hole" just before suggests a cutting tool; onion ← the classic way to fake tears
    { id: 'd3', skill: 'detail', level: 'B1', point: 'tweezers', reveals: ['hole'], seg: [63.0, 72.2],
      stem: 'What does Joey use when a scene needs him to cry?',
      choices: ['A pair of tweezers', 'A pair of scissors', 'A slice of onion'], a: 0,
      cue: '「cut a hole」のあと、何を使うか。',
      line: 'I cut a hole in my pocket, take *a pair of tweezers*',
      said: '「泣く場面では、ポケットに穴を開けて、ピンセットを使う」と言う。',
      mean: 'tweezers ＝ ピンセット。a pair of で数える道具。',
      trap: '直前の cut から「はさみ」を想像しやすい。take a pair of のあとの語をそのまま聞く。',
      use: 'Do you have a pair of tweezers?（ピンセットある？）' },

    // why: something sad ← the usual acting-class advice (悲しいことを思い出す); a bottle ← "a hole in my pocket" heard as
    //   hiding a prop
    { id: 'i1', skill: 'infer', level: 'B2', point: 'pain', reveals: ['tweezers', 'hole'], seg: [63.0, 74.8],
      stem: 'How does Joey’s crying trick work?',
      choices: ['A little pain brings real tears', 'He thinks of something very sad', 'The pocket hides a tear-drop bottle'],
      a: 0,
      cue: '道具を取り出したあとの動作。',
      line: 'I cut a hole in my pocket, take a pair of tweezers, and *just start pulling*.',
      said: '「ポケットに穴を開け、ピンセットで…とにかく引っ張る」と、涙を出す方法を話す。',
      mean: '何を引っ張るかは言わないが、痛みで涙を出すということ。',
      trap: '演技の授業なので「悲しいことを思い出す」と予想しやすい。pulling で、体を使う方法だと分かる。',
      use: 'Just start typing, and it’ll come.（とにかく書き始めれば出てくるよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'hole', seg: [66.4, 69.9],
      stem: 'Type what he says: “I ___ my pocket.” (4 words)', answer: 'cut a hole in',
      cue: '「have to cry」のあと。',
      line: 'I *cut a hole in* my pocket',
      said: '「ポケットに穴を開ける」と言っている。',
      mean: 'cut a はつながって「カラ」に近い（t が弾む）。hole in も「ホウリン」と一続き。',
      trap: 'cut a が一語に聞こえ、a を落としやすい。冠詞 a も一語として書く。',
      use: 'I cut a hole in the box.（箱に穴を開けた）' },

    // why: bad news ← the next trick, said in the same "let's say I've just…" frame; pain ← a fish hook in the eyebrow
    //   taken at face value
    { id: 'd4', skill: 'detail', level: 'B1', point: 'evil', seg: [77.2, 88.2],
      stem: 'What is the fish-hook face meant to show?',
      choices: ['That he has just done something evil', 'That he has just gotten bad news', 'That he is in terrible pain'],
      a: 0,
      cue: '「convey」のあと。',
      line: 'let’s say I want to convey that I’ve just *done something evil*.',
      said: '「悪いことをした直後だと伝えたいなら」と言い、釣り針の顔を説明する。',
      mean: 'convey ＝ 伝える・表す。悪事をはたらいた人の顔の作り方。',
      trap: '次の「悪い知らせ」も同じ形 let’s say I’ve just… で始まる。動詞のあとの中身で分ける。',
      use: 'Let’s say you missed the last train.（たとえば終電を逃したとしよう）' },

    // R fix: V2 — "the time he hurt his eyebrow" was weak; it's now a pun reading ("hook" + "I like it" ≈ hooked)
    // why: real trick ← he presents it as standard practice ("your basic"); pun ← "fish hook… and I like it" heard as
    //   wordplay on "hooked", though he never says it
    { id: 'h3', skill: 'humor', level: 'C1', point: 'fishhook', reveals: ['evil'], seg: [78.8, 91.4],
      stem: 'What makes Joey’s fish-hook description funny?',
      choices: ['It is an oddly exact recipe for a look', 'It is a real trick soap actors swear by',
                'It is a pun on “hooked”, as in addicted'], a: 0,
      cue: '「your basic」のあとの、引用のような一文。',
      line: '“*I’ve got a fish hook in my eyebrow, and I like it*.”',
      said: '悪事を働いた顔を「眉に釣り針が刺さってて、それが気に入ってる」顔だと説明する。',
      mean: '感情を、妙に具体的な体の感覚で説明している。痛いのに満足、という組み合わせのおかしさ。',
      trap: '本人が「定番」と言うので本当の技に聞こえるが、言い方の大げささが笑いの中心。',
      use: 'You look like you just won the lottery.（宝くじ当たったみたいな顔してる）' },

    // why: own version ← "your basic" with "your" taken as his own or the listener's; first step ← "basic" = 基礎, a
    //   beginner's exercise
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'basic', seg: [83.0, 88.2],
      stem: 'How does Joey introduce the fish-hook face?',
      choices: ['As the standard face everyone uses', 'As his very own simple version', 'As a first step for beginners'],
      a: 0,
      cue: '「that would be」のあとの二語。',
      line: 'that would be *your basic* “I’ve got a fish hook in my eyebrow, and I like it.”',
      said: '「それはよくある『眉に釣り針、気に入ってる』顔」と言う。',
      mean: 'your basic ～ ＝ よくある・定番の〜。your は「あなたの」ではない。',
      trap: 'your を「あなたの」、basic を「基礎」と取りやすい。your basic で一まとまり。',
      use: 'It’s your basic tourist trap.（よくある観光客向けの店だよ）' },

    // R fix: V2 — a fourth sound-alike, "I've just got", which differs only in the final n
    // why: I just got ← the weak 've vanishes and "gotten" is heard short; I'd ← 've and 'd are both one soft consonant
    //   before "just"; I've just got ← the 've caught, the n of "gotten" lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotten', seg: [91.5, 95.6],
      stem: 'Fill the gap: “Okay, let’s say ___ bad news.”',
      choices: ['I’ve just gotten', 'I just got', 'I’d just gotten', 'I’ve just got'], a: 0,
      cue: '「let’s say」のあと、弱い音と語尾の n。',
      line: 'let’s say *I’ve just gotten* bad news.',
      said: '「たとえば悪い知らせを受けたとしよう」と言っている。',
      mean: '’ve はほぼ聞こえず、gotten の tt は詰まって「ガッン」に近い。',
      trap: '’ve が消えると I just got に聞こえる。最後の n まで聞くと完了形と分かる。',
      use: 'I’ve just gotten home.（今帰ったところ）' },

    // R fix: V2/K6 — the key was the only choice sharing a number with each distractor (232 with one, 13 with the
    //   other); a full 2 × 2 now, in ascending order
    // why: by 30 ← thirteen/thirty, the -teen/-ty trap; 222 ← "two thirty-two" heard as "two twenty-two"
    { id: 'n1', skill: 'number', level: 'B1', point: 'divide', seg: [92.4, 100.3], keep: true,
      stem: 'What sum does Joey do in his head for bad news?',
      choices: ['222 divided by 13', '222 divided by 30', '232 divided by 13', '232 divided by 30'], a: 2,
      cue: '「divide」のあとの二つの数。',
      line: 'all I do there is try and divide *232 by 13*.',
      said: '「悪い知らせの顔は、232を13で割ろうとするだけ」と言う。',
      mean: 'two thirty-two ＝ 232。区切って言う読み方。',
      trap: 'thirteen と thirty は似て聞こえる。teen は後ろが強く長い、ty は前が強く短い。',
      use: 'What’s twenty percent of sixty?（60の20%っていくつ？）' },

    // R fix: V2/S1 — the stem said "help with the bad-news face", so only the face-based choice fit; the stem is now
    //   neutral, and a second face-based reason (not laughing) sits beside the key
    // why: recall ← a sum as a memory aid, a common study trick; not laughing ← actors use a hard thought to keep a
    //   straight face, which also changes the face
    { id: 'i2', skill: 'infer', level: 'B2', point: 'math', reveals: ['divide'], seg: [92.4, 100.3],
      stem: 'Why does a hard sum work as Joey’s bad-news trick?',
      choices: ['The strain of it looks like worry', 'It helps him recall his next line', 'It keeps him from laughing'],
      a: 0,
      cue: '「bad news」のあと、何をするか。',
      line: 'all I do there is try and *divide 232 by 13*.',
      said: '悪い知らせを受けた顔は、232÷13 を暗算しようとするだけ、と言う。',
      mean: '難しい計算に必死な顔が、困って思い悩む顔に見える、という裏技。',
      trap: '計算は暗記や笑いをこらえるのにも使うが、ここは悪い知らせの顔の作り方。必死な顔そのものが狙い。',
      use: 'Try to look worried.（困った顔をしてみて）' },

    // R fix: V2 — "a secret he's shy to admit" was easy to rule out; now two "easy trick" choices, so the attitude
    //   decides (he hands it to a class as a tip)
    // why: ashamed ← admitting he fakes feelings sounds embarrassing; took years ← "tricks" from a pro heard as hard-won
    //   craft
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'math', reveals: ['divide'], seg: [94.4, 100.3],
      stem: 'How does Joey present his bad-news trick?',
      choices: ['As an easy trick he’s pleased with', 'As an easy trick he’s a bit ashamed of',
                'As a hard skill that took him years'], a: 0,
      cue: '「Well」のあと、「is」までの言い方。',
      line: 'Well, *all I do there* is try and divide 232 by 13.',
      said: '「まあ、そこでやるのは、232を13で割ろうとするだけ」と言う。',
      mean: 'all I do is ～ ＝ 〜するだけ。簡単さを強調し、得意げに種明かししている。',
      trap: '裏技を明かすので、照れや苦労話に聞こえやすい。all I do は「これだけ」の合図。',
      use: 'All I do is add a little salt.（塩を少し足すだけ）' },
  ]
};
