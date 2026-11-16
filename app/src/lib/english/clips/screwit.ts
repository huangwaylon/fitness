// REVIEW 2026-11-16: pass 5, fix 14, drop 2, new 1; ear checks 2 (s1's and s2's went: both sources agree)
// Open: the speaker split (first ear check) carries t1, h1, d1, i3, i4 and the names in most stems. It holds together
//   from the words ("hurt your campaign" is said to the one who proposed, and the proposer also says "I'm done
//   steamrolling", like the apologizer), but only ears can confirm the woman is the proposer.
// “Ben and Leslie Say "Screw It" | Parks and Recreation” (the official Parks and Recreation channel, Season 4): Leslie
// apologizes to Ben for deciding things alone when they broke up, then asks whether they could just be together.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 103 s; whisper's repeated "I don't want to
// be with you" after it is a hallucination (the scene ends without words). From 0–55 s whisper runs ≈ 3 s ahead of the
// captions; segments follow the captions. Untested: "Okay, I want to" (≈ 20.5 s, captions: "I wanted"), the scandal
// and campaign lines (≈ 88–90 s, captions: "I could turn into a scandal if I hurt your campaign"), and "I mean".
// EAR CHECK: whole clip — speakers. No one is named aloud, so the split is assumed from content: Leslie = the one who
//   apologizes, offers "another option", says "I'm done steamrolling people"; Ben = the voicemail joke, "I don't want
//   that… for the best", "What?" (i4), the problems ("hurt your campaign" points at Leslie).
// EAR CHECK: 68.1 s r1 — the cut falls after "There is another option" and before "We could just say"
import type { Clip } from '../types.ts';

export const screwIt: Clip = {
  id: 'screwit', video: 'LK48_nun3KE', title: 'Ben and Leslie Say "Screw It"', dur: 124, wpm: 173, band: 'mid',
  tags: ['恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %, §9.4): the title "Screw It" answered "how does the talk change". It now asks where the
    //   talk is heading before the pause, where the title points the wrong way. Point is now `apart` (was `turn`);
    //   it reveals t1's and f1's points (said gives "for the best" away), not r1's or f2's.
    // why: back together ← the title + "I don't want that. Really."; fight ← "that's not fair" + "I got upset"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'apart', reveals: ['best', 'forbest'], seg: [3.5, 59],
      stem: 'Before the long pause, where does their talk seem to be heading?',
      choices: ['Toward agreeing to stay apart', 'Toward getting back together', 'Toward a fight over who was to blame'],
      a: 0,
      cue: '彼の「But」のあと、結論の部分。',
      said: '彼女が謝ると、彼は「連絡を絶つのは嫌だ、でも離れるのが一番」と答え、二人とも okay。',
      mean: 'いったん「距離を置く」でまとまりかける。長い間が転機。',
      trap: 'I don’t want that を「よりを戻したい」と取りやすいが、but のあとが結論。',
      use: 'Let’s take some time apart.（少し距離を置こう）' },

    // R drop: s1 (never shipped, deleted). V2 (blind 65 %): "I wasn't sure you were gonna come" is the stock opener,
    //   so meaning picks "wasn't" however the gap is cut, and "was so" was a filler (K3). s2 still covers sound.

    // why: worried ← one message instead of twenty sounds like something went wrong; answer ← the usual "I came to tell
    //   you" script
    { id: 'd1', skill: 'detail', level: 'B1', point: 'curious', reveals: ['voicemail'], seg: [7, 13.4],
      stem: 'Why did Ben decide to come?',
      choices: ['He wanted to know why she had changed', 'He wanted to give her his final answer',
                'He was afraid something bad had happened'], a: 0,
      cue: '「Well」のあと、自分の気持ちを表す形容詞。',
      line: 'Well, I got *very curious* when you only left me one voicemail',
      said: '「留守電が1件だけだったから、とても気になって」と答える。',
      mean: 'いつもと違う様子に興味を持った、という軽い返事。心配していたわけではない。',
      trap: '連絡が少ない＝何かあった、と考えると「心配」を選びやすい。curious は「気になる・知りたい」。',
      use: 'I’m just curious, why do you ask?（ちょっと気になって。どうして？）' },

    // R fix: V2 (blind 60 %): only the key took a teasing angle; all three are now "He teases her…"
    // why: only one ← "only left me one" heard as Ben complaining about too few; too many ← a sarcastic reading of
    //   "very curious"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'usual', reveals: ['voicemail', 'curious'], seg: [7, 13.4],
      stem: 'What makes Ben’s answer funny?',
      choices: ['He teases her by calling twenty her usual', 'He teases her for leaving only one this time',
                'He teases her that even one was too many'], a: 0,
      cue: '数字そのものより、「your」のあとの一語。',
      line: 'instead of your *usual* twenty',
      said: '1件だけの留守電を「いつもの20件の代わりに」と言う。',
      mean: '20件を「いつものこと」と軽く言い、彼女の度を越した連絡ぐせを優しくからかっている。',
      trap: 'only を「たった1件で不満」と取りやすいが、文句ではなく冗談。usual が笑いのポイント。',
      use: 'Only three coffees today? That’s new.（今日はコーヒー3杯だけ？珍しいね）' },

    // why: twelve ← -lve/-ty: both start "twe-"; two ← "one… instead of" sets up a small number
    { id: 'n1', skill: 'number', level: 'B1', point: 'voicemail', seg: [8, 13.4], keep: true,
      stem: 'How many messages does Leslie usually leave, according to Ben?',
      choices: ['Two', 'Twelve', 'Twenty'], a: 2,
      cue: '「instead of」のあと、「usual」に続く数。',
      line: 'you only left me *one* voicemail message instead of your *usual twenty*',
      said: '「いつもは20件なのに、留守電が1件だけだった」と言う。',
      mean: 'your usual ～ ＝ いつもの～。普段の連絡の多さを、冗談まじりに言う。',
      trap: 'twelve と twenty は最初が同じ「トゥエ」。語尾が「ルヴ」か「ティ」かで聞き分ける。',
      use: 'I’ll have my usual, please.（いつものをお願いします）' },

    // R fix: V2 (blind 55 %): "more intense" was the only choice against an apology; all three now open with a
    //   "less/calmer" half, so the second half (considerate) has to be heard
    // why: fun ← intense heard as "too serious", so the fix is to lighten up; open ← the apology that follows
    { id: 'd2', skill: 'detail', level: 'B1', point: 'intense', seg: [13.2, 17.4],
      stem: 'What is Leslie trying to change about herself?',
      choices: ['Less intense, and more considerate', 'Less intense, and more fun to be with',
                'Calmer, and more open about her feelings'], a: 0,
      cue: '「I’m trying to be」のあと、比べる言い方が2つ。',
      line: 'I’m trying to be a little *less intense* and a little *more considerate*.',
      said: '「もう少し激しさを控えて、思いやりを持とうとしている」と言う。',
      mean: '変えたいところを素直に言っている。considerate ＝ 人に気を配る。',
      trap: 'intense だけで「真面目すぎ→楽しく」と流れやすい。less と more の後ろを両方聞く。',
      use: 'I’m trying to be more patient.（もっと気長になろうとしてるの）' },

    // R fix: V2 (blind 60 %): the key named her "new, more considerate style" (d2's key, word for word); the choices are
    //   now three readings of the add-on
    // why: rather he didn't ← "only if you want to" heard as reluctance; test ← the add-on read as a challenge
    //   (座るかどうか試す)
    { id: 'h2', skill: 'humor', level: 'C1', point: 'seat', reveals: ['intense'], seg: [17, 21],
      stem: 'Why is Leslie’s add-on after offering him a seat funny?',
      choices: ['She’s so careful to be polite it’s awkward', 'She sounds as if she’d rather he didn’t stay',
                'She turns the seat offer into a test of him'], a: 0,
      cue: '「have a seat」のすぐあと。直前の自分の話を思い出して。',
      line: 'Here, have a seat. *But only if you want to.*',
      said: '「座って。でも、座りたければでいいから」と付け足す。',
      mean: '「人に気を配りたい」と言った直後なので、気を使いすぎて不自然になっている。そこがおかしい。',
      trap: '「〜ならでいい」を来てほしくないサインと取りやすい。直前の言葉とつなげて聞く。',
      use: 'Have a seat, if you like.（よかったら座って）' },

    // R fix: V2 (blind 65 %): the key was the only self-blaming choice; all three are now things she could be sorry for
    // why: kept secret ← "never" is weak, "listened" stays; ended ← "when things ended" + "I just decided"
    { id: 'd3', skill: 'detail', level: 'B2', point: 'decided', seg: [21.6, 36.6],
      stem: 'What does Leslie say she did when things ended between them?',
      choices: ['She decided what she wanted without asking him', 'She listened to him, but kept her own plans secret',
                'She ended things without ever telling him why'], a: 0,
      cue: '「I never listened」から「same thing」まで。',
      line: 'I never listened to what you wanted… *I just decided what I wanted*.',
      said: '「あなたの希望を聞かず、自分の希望だけ決めて、違うと怒った」と認める。',
      mean: '自分本位だった、とはっきり認める謝罪。',
      trap: 'never は弱く、listened だけ残りやすい。ended も聞こえるが、決めたのは別れではなく自分の望み。',
      use: 'I should have asked you first.（先にあなたに聞くべきだった）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'appreciate', seg: [40.1, 42.6],
      stem: 'Type what Ben says: “Well, thank you. ___.” (3 words)', answer: 'i appreciate that',
      cue: '「thank you」のすぐあと。',
      line: 'Well, thank you. *I appreciate that*.',
      said: '「ありがとう。うれしい」と、謝罪を受け止める。',
      mean: 'I appreciate that ＝ 相手の言葉や行動に感謝する、少し改まった言い方。',
      trap: 'I と appreciate がつながって速く、that の t も消えやすい。',
      use: 'Thanks for waiting. I appreciate it.（待ってくれてありがとう）' },

    // R fix: V2 (blind 55 %): the key was the only soft, conditional choice; the distractors are now as gentle
    // why: decided ← the "if" lost, so it sounds like her own decision; asking him ← you/me roles swapped
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'contact', seg: [42.2, 47.8],
      stem: 'What is Leslie doing when she brings up “any more contact”?',
      choices: ['Saying she’d accept it if he wants no contact', 'Telling him she has decided to stop calling',
                'Asking him, kindly, to stop calling her'], a: 0,
      cue: '「if」で始まる文の、後半。',
      line: 'If you don’t want to have any more contact with me, *I finally understand*.',
      said: '「もう連絡を取りたくないなら、今ならちゃんと分かる」と言う。',
      mean: '決めるのは相手だと示して、身を引く用意があると伝えている。',
      trap: 'contact と「やめる」が結びつくと宣言に聞こえる。if のあとは相手の気持ちの話で、決めるのは彼。',
      use: 'If you’d rather not, I understand.（気が進まないなら、分かるよ）' },

    // R fix: V2 (blind 55 %): the key was the only two-sided feeling; all three are now "He wants X, but Y"
    // why: no contact ← Japanese frame: a soft-spoken refusal (やんわり断る); friends ← "I don't want that" read as
    //   not wanting romance
    { id: 't1', skill: 'attitude', level: 'C1', point: 'best', reveals: ['forbest'], seg: [47.5, 54.4],
      stem: 'How does Ben really feel in his answer to her offer?',
      choices: ['He wants to stay close, but thinks distance is wiser', 'He wants no contact, but is too kind to say it',
                'He wants to be friends, but nothing more than that'], a: 0,
      cue: '「Really」のあと、「But」に続く部分。',
      line: '*I don’t want that. Really.* But I just think it’s for the best.',
      said: '「連絡を絶つのは嫌だ。本当に。でも離れるのが一番だと思う」と言う。',
      mean: '気持ちはまだあるが、頭では距離を置くべきだと考えている。',
      trap: 'I don’t want that の that は「連絡を絶つこと」。but の前に本心、あとに判断が来る。',
      use: 'I’d love to, but I really can’t.（ぜひそうしたいけど、本当に無理なの）' },

    // R fix: V2 (blind 60 %): "best for her work" was weak; the distractors are now the "do my best" reading and a
    //   gentle-goodbye reading
    // why: best he can do ← best read as "do my best"; kindest goodbye ← the soft tone and "Really" read as a gentle
    //   farewell
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'forbest', seg: [51.2, 54.4],
      stem: 'At the end of Ben’s answer, what does his last phrase mean?',
      choices: ['Better in the long run, even if it hurts', 'The best he can do for her right now',
                'The kindest way to say goodbye'],
      a: 0,
      cue: '「I just think it’s」の続き。',
      line: 'But I just think *it’s for the best*.',
      said: '「でも、それが一番いいと思う」と言う。',
      mean: 'for the best ＝ つらくても、結局はそのほうがいい。自分に言い聞かせるような言い方。',
      trap: 'best を「ベストを尽くす」と取りやすいが、for the best は結果の話。but のあとの判断。',
      use: 'Maybe it’s all for the best.（かえって良かったのかもね）' },

    // R fix: V1/V2 (blind 60 %): the stem quoted "There is another option", so the signal was in the text, and the
    //   title "Screw It" gave the bold idea away. The stem now names the moment (the learner must hear the preface),
    //   and the choices are kinds of move. Now reveals `apart` (the choices give g1's key away)
    //   and `forreal` (the line holds x1's answer).
    // why: softens ← after "for the best" and the quiet okays, a gentler version (stay friends) is the expected move;
    //   puts off ← the long pause read as hesitation
    { id: 'r1', skill: 'predict', level: 'B2', point: 'option', reveals: ['apart', 'screwit', 'forreal'], seg: [59, 68.1],
      then: [68.1, 73.5],
      stem: 'After the long pause, what kind of idea is Leslie about to offer?',
      choices: ['One that overturns what they just agreed', 'One that softens what they just agreed on',
                'One that puts off any decision for now'],
      a: 0,
      cue: '間のあとの最初の一文。どんな案の前置き？',
      line: 'There is another option. *We could just say “screw it”* and do this thing for real.',
      said: '「別の道もある。もう『どうにでもなれ』と言って、本気で付き合おう」と言う。',
      mean: 'another option は、今の結論をひっくり返す提案の前置き。',
      trap: '直前が「離れるのが一番」なので穏やかな案を予想しやすいが、この前置きは大胆な案につながりやすい。',
      use: 'There is another option, though.（でも、別の手もあるよ）' },

    // R fix: V2 (blind 70 %, §9.4): the title answered "what is she hoping for"; it now asks how she goes about it. The
    //   seg starts at 62 (the second half).
    // why: plan ← "How would you imagine we do this?" sounds like it gets an answer; wait ← "campaign" and "scandal"
    //   heard as reasons to hold off
    { id: 'g2', skill: 'gist', level: 'B2', point: 'hope', reveals: ['steam'], seg: [62, 104],
      stem: 'In the second half, how does Leslie try to win Ben back?',
      choices: ['She says how she feels, then leaves it to him', 'She lays out a plan for handling the problems',
                'She asks him to wait until after the campaign'], a: 0,
      cue: '問題を並べられたあとの、彼女の答え方。',
      said: '「一緒にいたい」と言い、方法を聞かれても「分からない」。最後に「あなたは？」と聞く。',
      mean: '気持ちは伝えるが、押し切らずに決定を相手にゆだねる。',
      trap: '問題が並ぶので解決策を予想しやすいが、答えは I don’t know。延期の話も出ない。',
      use: 'I’d like to try again, if you do.（あなたもそうなら、もう一度やってみたい）' },

    // R fix: V2 (blind 70 %): "fix the problems first" was weak; it's now the "screw up" reading. Now reveals
    //   `forreal`: the line holds x1's answer.
    // why: let it go ← "screw it" is often "forget it, I quit"; messing up ← screw read as "screw up" (しくじる)
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'screwit', reveals: ['option', 'forreal'], seg: [65.3, 73.4],
      stem: 'When Leslie describes the other option, what does her rough phrase mean?',
      choices: ['Stop worrying and just go for it', 'Stop trying and just let the whole thing go', 'Risk messing it all up again'],
      a: 0,
      cue: '「We could just say」のあと、少し乱暴な言い方。',
      line: 'We could just *say “screw it”* and do this thing for real.',
      said: '「細かいことは気にせず、本気で付き合おう」と言う。',
      mean: 'say screw it ＝「知るか、やっちゃえ」。心配を捨てて思い切る言い方。',
      trap: 'screw it は「やめた」にも screw up にも聞こえる。do this で「やる」側と分かる。',
      use: 'Screw it, let’s get dessert.（もういいや、デザート頼もう）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'forreal', reveals: ['option', 'screwit'], seg: [68, 73.3],
      stem: 'Type what Leslie says: “and do this ___.” (3 words)', answer: 'thing for real',
      cue: '「screw it」のあと、文の最後。',
      line: 'We could just say “screw it” and do this *thing for real*.',
      said: '「本気で付き合おう」と言っている。',
      mean: 'for real ＝ 本気で、本当に。this thing は二人の関係を軽くぼかした言い方。',
      trap: 'thing と for がつながり、for は弱く「ファ」程度になる。real の r と l にも注意。',
      use: 'Wait, are you serious? For real?（待って、本気？マジで？）' },

    // R new (replaces i2, for infer ≥ 2). Blind read: 40 % on the key. Rests on the speaker split (ear check 1).
    // why: not hearing ← "What?" is the usual 聞き返し; backs down ← a sharp "What?" read as a no
    { id: 'i4', skill: 'infer', level: 'B2', point: 'what', reveals: ['crazy'], seg: [68, 77.6],
      stem: 'From how Leslie goes on, how does she take Ben’s “What?”',
      choices: ['As surprise, so she explains why', 'As not hearing, so she says it again',
                'As a no, so she tries to back down'], a: 0,
      cue: '短い返事のあと、彼女が同じ文をくり返すかどうか。',
      line: '*What?* — I miss you like crazy. I think about you all the time.',
      said: '「え？」と返され、彼女はくり返さず「恋しくてたまらない」と気持ちを足す。',
      mean: 'What? を驚きと受け取り、理由を話している。',
      trap: 'What? は聞き返しにも使う。相手が言い直すか、説明を足すかで判断。',
      use: 'Wait, what? Since when?（え、何？いつから？）' },

    // R fix: V2 (blind 50 %): "I miss you like crazy" is a set phrase; a 4th choice, the reunion line "I've missed
    //   you", is as natural, so the ear has to choose. Ear check dropped: both sources have "I miss you".
    // why: missed ← "missed you" ≈ ミスチュ, an easy guess when talking about the past; I've missed ← the reunion
    //   phrase, its 've weak; I'll ← a weak 'll swallowed
    { id: 's2', skill: 'sound', level: 'B2', point: 'crazy', seg: [74.2, 78.1],
      stem: 'Fill the gap: “___ like crazy.”',
      choices: ['I miss you', 'I missed you', 'I’ve missed you', 'I’ll miss you'], a: 0,
      cue: '「What?」と聞き返された直後、文の最初。',
      line: '*I miss you* like crazy. I think about you all the time.',
      said: '「あなたが恋しくてたまらない」と言う。',
      mean: 'miss you は「ミシュ」とつながる。missed you なら「ミスチュ」に近く、t の音が入る。',
      trap: '再会の場面なので I’ve missed you にも引かれる。ve や t の音があるかを聞く。',
      use: 'I miss home sometimes.（ときどき家が恋しくなる）' },

    // R fix: S4: the seg ran into "It could turn into a scandal"; it's now 84.9–88.2
    // why: quit ← scandal → losing jobs; secret ← "scandal" right after suggests hiding it
    { id: 'd4', skill: 'detail', level: 'B1', point: 'chris', seg: [84.9, 88.2],
      stem: 'What does Ben say they would have to do?',
      choices: ['Tell Chris about it', 'Quit their jobs', 'Keep it a secret'], a: 0,
      cue: '「screw it」の直後の返事。',
      line: 'We would have to *tell Chris*.',
      said: '「Chris に話さないといけない」と、まず現実的な問題を出す。',
      mean: 'would have to ＝（そうするなら）〜しなければならない。仮の話の条件。',
      trap: 'scandal が続くので「秘密にする」と取りやすいが、言っているのは逆で、話す必要がある。',
      use: 'We’d have to leave by six.（6時には出ないといけないね）' },

    // why: argues ← the "screw it" plan suggests she pushes back; none matter ← "say screw it" = the problems don't count
    { id: 't2', skill: 'attitude', level: 'B2', point: 'yeah', reveals: ['chris'], seg: [85.3, 92.6],
      stem: 'As Ben lists the problems, how does Leslie answer each one?',
      choices: ['She agrees each one is real', 'She argues each one away', 'She says none of them matter'], a: 0,
      cue: '問題が一つ出るたびの、短い返事。',
      line: 'We would have to tell Chris. — *Yeah.* — It could turn into a scandal. — *Yeah.*',
      said: '「Chris に話さないと」「うん」「スキャンダルになるかも」「うん」と続く。',
      mean: '問題は全部認めている。認めたうえで、それでも一緒にいたい。',
      trap: '「どうにでもなれ」と言った人なので、反論すると予想しやすい。返事は短い Yeah だけ。',
      use: 'Yeah, I know. Still, I want to try.（うん、分かってる。それでもやってみたい）' },

    // R drop: i2 (never shipped, deleted). K1: "I mean, how would you imagine we do this?" reads as a real question
    //   or as a rhetorical "no way", and only tone could tell (whisper also has a "No." before the problems that the
    //   captions lack). i4 replaces it.

    // R fix: V2 (blind 60 %): the key was the only choice that fit her apology; a Japanese-frame distractor replaces
    //   "admit he was wrong"
    // why: say it first ← Japanese frame: 相手に先に言わせる, to be safe; unsure ← "I don't know" at the start of
    //   her answer
    { id: 'i3', skill: 'infer', level: 'C1', point: 'steam', seg: [92, 103.8],
      stem: 'Why does Leslie end by asking how he feels?',
      choices: ['She won’t decide for the two of them again', 'She wants him to say it first, to be safe',
                'She isn’t sure of her own feelings yet'], a: 0,
      cue: '「I’m done」のあとの動詞と、最後の質問。',
      line: 'But *I’m done steamrolling people*. This is how I feel. How do you feel?',
      said: '「もう人を押し切るのはやめた。私の気持ちはこう。あなたは？」と聞く。',
      mean: 'steamroll ＝ 人を押しつぶすように思い通りにする。今回は相手に聞く。',
      trap: 'I don’t know で迷っていると取りやすいが、分からないのは方法だけ。',
      use: 'That’s how I feel. What about you?（私はそう思う。あなたは？）' },
  ]
};
