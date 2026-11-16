// REVIEW 2026-11-16: pass 5, fix 18, drop 1, new 1; ear checks 0
// “Michael Scott Sensitivity Training - The Office US” (the official The Office channel, Best of Season 6): Michael
// runs his own sensitivity training, really aimed at the jokes about his fall into a koi pond, and sets up a "do not
// mock" list; each worry people add to it (a nose, a figure, a relationship) is teased at once.
// Segments from the captions, words from whisper (2026-11-16). Whisper's timings are whole-second blocks here, so
// segments follow the captions. Talk ends at ≈ 233 s. Speakers are settled by "Toby" (39.5 s), "Phyllis" (50.1 s),
// "Meredith" (186.2 s), "Creed" (227 s) and by sense (Michael runs the list and writes on it). Untested on purpose:
// 13.7–17.5 s (Michael's "Oscar is gay, that is his choice": offensive, the item would only repeat it), 21 s
// (captions "maybe", whisper "Mike"), 107.8–113.3 s (captions "the second fountain", whisper "a second fountain"; who
// asks to be kicked out), 129.5 s (captions "break, come on", whisper "Dwight, come on": the stems name Dwight, but no
// key rests on it), 166–171 s (the weight and "Yum?" turns, unclear speakers), 197–205 s (what Meredith wrote is on
// screen).
// EAR CHECK: none (every key stands on words both sources agree on; w1 is settled by "Phyllis" just before)
import type { Clip } from '../types.ts';

export const doNotMock: Clip = {
  id: 'donotmock', video: 'TWzezWq7FkA', title: 'Michael Scott Sensitivity Training', dur: 244, wpm: 157, band: 'mid',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: control ← "control over" is said, but for what you *can* mock; meeting ← the training itself is a meeting
    //   (broken script)
    { id: 'd1', skill: 'detail', level: 'B1', point: 'rule', seg: [0, 13.4],
      stem: 'By Michael’s rule, what can’t you make fun of a person for?',
      choices: ['Something they did and now regret', 'Something they have control over', 'Something they said in a meeting'],
      a: 0,
      cue: '「cannot」のあと、「that they」に続く語。',
      line: 'you *cannot* make fun of a person for something… that they have done that they *regret*.',
      said: '「後悔していることはからかうな。からかえるのは本人が選べることだけ」。',
      mean: 'regret ＝ 後悔する。選んだことはからかってよい、という理屈。',
      trap: 'control over は「からかっていい」ほう。cannot と can only を聞き分ける。',
      use: 'I regret saying that.（あんなこと言わなきゃよかった）' },

    // R drop: s1 ("You still ___ make fun of people for race or gender"). Blind 55 %, and no rewording saves it:
    //   "still ___" leaves only can't as natural word order, and "for race or gender" makes it common sense (V1/V2).
    //   It had never shipped, so it's deleted; s2 (R new) is the sound item now
    // R fix: V2, blind 55 % (the warm-welcome filler); now "blames the training", built on "that is why we are doing
    //   this"
    // why: quoting Toby ← "what I want to say" heard as reported speech; blames the training ← "because that is why we
    //   are doing this right now" heard as an excuse for the insults, not a reason to hold them back
    { id: 'h1', skill: 'humor', level: 'B2', point: 'lemon', seg: [26.9, 39.3],
      stem: 'Why is Michael’s greeting to Toby funny?',
      choices: ['He says every rude word, then says he won’t', 'He is repeating what Toby once said about him',
                'He insults Toby, then blames the training for it'], a: 0,
      cue: '悪口のあとの「is what I want to」。',
      line: '…*is what I want to say, but I won’t*, because that is why we are doing this right now.',
      said: 'ひどい悪口を言い切ってから、「と言いたいが言わない。そのための研修だ」と続ける。',
      mean: '「言わない」と言う前に全部言っている。研修の目的と真逆の行動が笑い。',
      trap: '誰かの言葉の引用に聞こえるが、主語は I want。言わないと言いながら、もう言っている。',
      use: 'I won’t say it, but you know.（言わないけど、分かるでしょ）' },

    // R fix: V2, blind 60 % (the ponds filler); now a wrong-direction "jokes he makes" choice
    // why: for Toby ← "So Toby, welcome" opens it, as if the training is for him; jokes he makes ← "the butt of a joke"
    //   and the staff's complaints, with "has been koi ponded" (he's the one it happened to) missed
    { id: 'i1', skill: 'infer', level: 'C1', point: 'koi', seg: [38.8, 50.0],
      stem: 'What does Michael’s first show-of-hands question reveal about the training?',
      choices: ['It’s really about the jokes made about him', 'It’s mainly to teach Toby the office rules',
                'It’s really about the jokes he makes about others'], a: 0,
      cue: '「Show of hands」のあと、最初の質問の動詞。',
      line: 'Show of hands. Who here has been *koi ponded*?',
      said: '「手を挙げて。コイの池に落とされた人は？」と、自分の出来事を動詞にして聞く。',
      mean: '池に落ちたのは彼自身。研修の本当の目的は、自分へのからかいを止めること。',
      trap: 'Toby への歓迎で始まるので彼のための研修に見えるが、最初の質問が本音を示す。',
      use: 'Show of hands: who wants pizza?（ピザがいい人、手を挙げて）' },

    // why: told ← "a joke that has gone too far" heard as being about the jokers; laughed ← a joke's audience, not its
    //   target
    // R fix: K6/V2, blind 50 %: the key was the only choice without "that went too far". It has it now
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'butt', seg: [43.8, 50.0],
      stem: 'Who is Michael asking about in his second show-of-hands question?',
      choices: ['People who were the target of a joke that went too far', 'People who told a joke that went too far',
                'People who laughed at a joke that went too far'], a: 0,
      cue: '「has been」のあと、joke の前の一語。',

      line: 'Who here has been *the butt of a joke* that has gone too far?',
      said: '「行き過ぎた冗談の的にされた人は？」と聞く。',
      mean: 'the butt of a joke ＝ 笑いものにされる人、冗談の的。',
      trap: 'gone too far に気を取られ、冗談を言った側と取りやすい。has been the butt は受け身の立場。',
      use: 'I’m always the butt of the joke.（いつも私が笑いものだ）' },

    // why: Toby ← the last name heard before this, at 39 s; Meredith ← another name called on later in the meeting
    { id: 'w1', skill: 'who', level: 'B1', point: 'everyday', seg: [49.9, 56.4],
      stem: 'Who answers Michael’s question with “You make fun of us every day”?',
      choices: ['Phyllis', 'Toby', 'Meredith'], a: 0,
      cue: '彼が呼んだ名前のすぐあとの声。',
      line: '*Phyllis.* — Michael, you make fun of us every day.',
      said: 'マイケルがフィリスを指し、彼女が「毎日からかってるでしょ」と言う。',
      mean: '名前を呼ばれた直後に、本人が答える。us で、みんなの代わりに話している。',
      trap: 'Toby は少し前に呼ばれた名前。誰が話すかは、直前に呼ばれた名前と順番で決まる。',
      use: 'You do this every single day.（毎日毎日これだよ）' },

    // R fix: V2, blind 65 % (the key alone was about meaning); all three are now "couldn't tell/hear" excuses
    // why: not loud enough ← "hard to tell" heard as hard to hear; over his laughing ← "laugh so hard" heard as Michael
    //   laughing over them
    { id: 'i2', skill: 'infer', level: 'B2', point: 'stop', reveals: ['gut'], seg: [56.9, 71.6],
      stem: 'After the staff say they have told him, what is Michael’s excuse?',
      choices: ['He couldn’t tell a real “stop” from a laughing one', 'They never said “stop” loudly enough for him',
                'He couldn’t hear their “stop” over his laughing'], a: 0,
      cue: '二つの「stop」の言い方の違い。',
      line: 'it is *hard to tell the difference* between… “Stop,” because I want you to stop. Or “Stop,” as in “Stop! You’re making me laugh so hard.”',
      said: '「やめてほしいの『やめて』と、笑いすぎての『やめて』の区別が難しい」と言い訳する。',
      mean: '同じ stop に二つの意味がある、と責任を逃れている。',
      trap: 'hard を「聞こえにくい」と取りやすいが、tell the difference ＝ 見分ける。',
      use: 'I can’t tell the difference.（違いが分からない）' },

    // R fix: V2, blind 60 % (the only laughing choice); "trying not to laugh" now takes "Stop!" as holding back
    // why: sick ← "gut" read literally (おなか) and "busting" as hurting; not to laugh ← "Stop!" heard as holding a
    //   laugh in, the "busting" (breaking open) lost
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'gut', seg: [69.0, 73.2],
      stem: 'In Michael’s acted-out “stop”, what does he claim he is doing?',
      choices: ['Laughing as hard as he can', 'Feeling sick to his stomach', 'Trying hard not to laugh out loud'], a: 0,
      cue: '「on a roll」のあとの四語。',
      line: 'You’re on a roll. I am *busting a gut*. Stop!',
      said: '「絶好調だね。腹がよじれるよ。やめて！」と、笑うふりを演じる。',
      mean: 'bust a gut ＝ 腹がちぎれるほど笑う。on a roll ＝ 調子に乗っている。',
      trap: 'gut（おなか）から腹痛と取りやすいが、直前の so funny から笑いの話。',
      use: 'That show had me busting a gut.（あの番組、腹がよじれた）' },

    // R fix: V2, blind 50 %; the laugh filler is now "playing along with his act" (the sitcom script), and the three
    //   choices are parallel
    // why: half yes ← "case" heard as "in some cases"; playing along ← the acted-out laughter just before, so the
    //   reply heard as part of the bit
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'case', seg: [71.4, 75.8],
      stem: 'How does the reply to Michael’s “stop” excuse come across?',
      choices: ['A flat no: they never meant it that way', 'A half yes: they sometimes meant it that way',
                'A joke: they play along with his act'],
      a: 0,
      cue: '演技の「Stop!」のすぐあと、別の声。',
      line: 'Stop! — *That’s never been the case.*',
      said: '笑いの「やめて」もあるという言い訳に、「そんなことは一度もない」と返す。',
      mean: 'never been the case ＝ そんな事実はない。きっぱりした否定。',
      trap: 'case を「場合」と取り、「時には」と聞きやすい。never が付けば全否定。',
      use: 'That’s not the case at all.（全然そんなことないよ）' },

    // R fix: V2, blind 65 % (the only choice with a list); now a second list choice, with the list in the wrong relation
    // why: ban on all teasing ← "teasing will no longer be tolerated" taken at face value (someone asks just that);
    //   teasers listed ← "do not mock list" heard as a list of the people who mock
    { id: 'g1', skill: 'gist', level: 'B2', point: 'list', seg: [75.0, 127.0],
      stem: 'How is Michael’s plan supposed to cut down on teasing?',
      choices: ['Only topics people list are off-limits', 'All teasing is banned from now on', 'People who tease get put on a list'],
      a: 0,
      cue: '「of any kind?」と聞かれたあとの答え。',
      line: 'You mean there’s no teasing of any kind? — No, no… *Just things that are on the list*.',
      said: '「一切だめ？」と聞かれ、「いや、リストにあることだけ」と答える。',
      mean: '全面禁止ではなく、本人が書いた話題だけを守る仕組み。',
      trap: 'no longer be tolerated は全面禁止に聞こえるが、すぐ「リストのことだけ」と絞られる。',
      use: 'Just the things on the list, please.（リストにある物だけお願い）' },

    // R fix: V2, blind 75 % (the only choice about jokes); now "jokes that went too far", which "you cannot be teased
    //   about" refutes
    // why: outside ← "out of bounds" read as outside a place (the office); past jokes ← "out of bounds" heard as jokes
    //   that crossed the line (the "gone too far" from 49 s)
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'bounds', seg: [83.4, 92.4],
      stem: 'According to Michael, what goes on the list?',
      choices: ['Topics that are off-limits for jokes', 'Things that happen outside the office', 'Jokes that have gone too far before'],
      a: 0,
      cue: '「might be」に続く句と、次の一文。',
      line: 'Anything that we think might be *out of bounds*, we put on this list.',
      said: '「行き過ぎかもしれないことは、このリストに書く」と説明する。',
      mean: 'out of bounds ＝ 本来は球技の場外。ここでは「触れてはいけない話題」。',
      trap: 'out of を「外」と取り、場所の話に聞こえやすい。次の文が意味を決める。',
      use: 'Sorry, that topic is out of bounds.（ごめん、その話はなしで）' },

    // R fix: V2, blind 55 %; "head off" is now "start the meeting again", the right sense of kick off on the wrong thing
    // why: kick out ← "kick" + the later "kick me out of the meeting"; meeting again ← kick off = start, attached to the
    //   meeting rather than the list
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'kickoff', seg: [92.0, 97.6],
      stem: 'Once the list is set up, what does Michael offer to do?',
      choices: ['Go first and start the list', 'Kick out anyone who mocks', 'Start the meeting again from the top'], a: 0,
      cue: '確認の問いのすぐあとの句動詞。',
      line: 'Got it? I’m gonna *kick it off*.',
      said: '「分かった？じゃあ、私から始めよう」と言う。',
      mean: 'kick it off ＝ 始める、口火を切る。サッカーのキックオフと同じ発想。',
      trap: 'kick から追い出す話と取りやすいが、kick out と kick off は別。off は「始まり」。',
      use: 'Let me kick things off.（まず私から始めます）' },

    // why: pond ← the koi pond from the start, heard again; food court ← "Steamtown Mall" kept, the fall placed
    //   elsewhere
    { id: 'd2', skill: 'detail', level: 'B1', point: 'fountain', reveals: ['koi'], seg: [100.0, 108.4],
      stem: 'What does Michael add to the list for himself?',
      choices: ['Falling into a fountain at the mall', 'Falling into a pond at an office party',
                'Falling down in the mall food court'], a: 0,
      cue: '「I also have」のあとの動詞と場所。',
      line: 'I *also* have *fallen into the fountain at the Steamtown Mall*.',
      said: '「スチームタウン・モールの噴水にも落ちたことがある」と付け足す。',
      mean: 'also ＝（コイの池に）加えて。水に落ちた話がもう一つある。',
      trap: 'fountain と pond はどちらも水だが別の物。最初の koi pond と混ぜず、場所の語を聞く。',
      use: 'I also lost my umbrella.（傘もなくしちゃった）' },

    // R fix: V2, blind 70 % (the refuse filler); now teasing aimed at Michael's falls, the clip's opening theme
    // why: Michael's falls ← the koi pond and the fountain from the first half, so the teasing heard as aimed at him;
    //   it stops ← the list's promise taken as what happens
    { id: 'g2', skill: 'gist', level: 'B2', point: 'backfire', reveals: ['nose'], seg: [127.0, 205.4],
      stem: 'As people add to the list, what keeps happening?',
      choices: ['Each new worry sets off fresh teasing', 'People start teasing Michael about his falls',
                'The teasing stops once things are listed'], a: 0,
      cue: '各人の悩みのあと、周りの声。',
      line: 'Oh, my. That is small. … *Can you breathe okay?*',
      said: '鼻、体重、体格と悩みが出るたびに、周りがすぐそれをネタにからかう。',
      mean: 'からかいを防ぐリストが、かえって弱点を知らせる場になっている。',
      trap: '前半の池や噴水の話が残りやすいが、ネタになるのは毎回いま出た悩み。直後の反応を聞く。',
      use: 'Well, that backfired.（あーあ、裏目に出た）' },

    // why: too big ← the usual complaint about a nose (broken script); smell ← "smell" is said, but he says it still
    //   works
    { id: 'd3', skill: 'detail', level: 'B1', point: 'nose', seg: [129.0, 141.2],
      stem: 'What does Dwight say is wrong with his nose?',
      choices: ['It’s too small for his face', 'It’s too big for his face', 'It doesn’t let him smell'], a: 0,
      cue: '「Your nose?」と聞き返されたあとの答え。',
      line: 'Your nose? — It’s *too small*. … My nose is too small.',
      said: '「鼻をからかわれたくない」「鼻？」「小さすぎるんだ」と答える。',
      mean: '顔の比率は完璧で、鼻だけが小さい、と本人は思っている。',
      trap: '鼻の悩みは「大きい」が多いので、思い込みで選びやすい。small を2回言っている。',
      use: 'These shoes are too small for me.（この靴、小さすぎる）' },

    // R fix: V2, blind 55 %; "showing off" is now "it doesn't work at all", wrong only in degree ("it still works")
    // why: others smell ← "smell things… closer than most people" heard as a jab at how people smell; doesn't work ←
    //   "I just have to be a lot closer" heard as an admission, the "it still works" before it lost
    { id: 'h2', skill: 'humor', level: 'C1', point: 'smell', seg: [140.9, 146.5],
      stem: 'Why does Dwight’s point about smelling things get a laugh?',
      choices: ['His proof that it works shows how bad it is', 'He is hinting that other people smell bad',
                'He admits his nose doesn’t really work at all'], a: 0,
      cue: '「I can smell things」のあとの条件。',
      line: 'I mean, it still works. I can smell things. *I just have to be a lot closer than most people*.',
      said: '「機能はする。においも分かる。ただ人よりずっと近づく必要がある」と言う。',
      mean: '大丈夫だと示すつもりの説明が、鼻の小ささの証拠になっている。',
      trap: '「使えない」と認めたようにも聞こえるが、still works と言っている。弁明が弱点を広げている。',
      use: 'It still works. Mostly.（まだ使えるよ。だいたいは）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'writeit', seg: [147.6, 150.4],
      stem: 'Type Dwight’s request: “Just ___, please.” (3 words)', answer: 'write it down',
      cue: '「That is small」のあとの頼み。',
      line: 'Just *write it down*, please.',
      said: '鼻をからかわれ、「いいから書いてくれ」と頼む。',
      mean: 'write it down ＝ 書き留める。早くリストに載せて守られたい。',
      trap: 'write‿it がつながり、t が弾んで「ライリッ」に近い。down の前でいったん切れる。',
      use: 'Could you write it down for me?（書いてもらえますか）' },

    // C2: the letter against the spirit (cf. g1)
    // R fix: V2, blind 65 % (the detail filler); now "puts the jokes on hold", the right topic in the wrong direction.
    //   It reveals s2's answer through its line
    // why: wait quietly ← "I haven't finished writing" heard as a request for patience; jokes on hold ← the list's
    //   purpose read into the line (protection until it's written), the joke that lands next missed
    // anchor: 153.2 s "Hey, it's on the list, everybody", then 154.4–156 s "No, I haven't finished writing", then
    //   156.3 s "Did you sneeze it off?": the next joke lands in the gap he leaves
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'notyet', reveals: ['sneeze'], seg: [150.2, 159.4],
      stem: 'When Michael says he hasn’t finished writing, what does that do?',
      choices: ['Leaves the nose open to jokes a bit longer', 'Asks everyone to wait quietly until he’s done',
                'Puts the jokes on hold until he has finished'], a: 0,
      cue: '「it’s on the list」への返事と、次の冗談。',
      line: 'Hey, *it’s on the list*, everybody. — No, *I haven’t finished writing*. — Did you sneeze it off?',
      said: '「もうリストに載った」と言う本人に「まだ書き終わってない」。すぐ次の冗談が飛ぶ。',
      mean: '決まりの文字どおりなら、書き終わるまで守られない。その隙にからかいが続く。規則の文言と目的のずれ。',
      trap: '「静かに待って」に聞こえやすい。直後に冗談が来るなら、この一言は抜け道を開けている。',
      use: 'Technically, it’s not official yet.（厳密には、まだ正式じゃない）' },

    // R new: the sound item, replacing s1. Both sources have "Did you sneeze it off?" (156.8–158.3 s)
    // why: them ← "What keeps your glasses on?" just before, so the pronoun heard as the glasses; squeeze ← /sn/ and
    //   /skw/ blurred at speed, both with the same "-eeze it" ending
    { id: 's2', skill: 'sound', level: 'B2', point: 'sneeze', reveals: ['notyet'], seg: [155.0, 159.2],
      stem: 'Fill the gap: “Did you ___ off?”',
      choices: ['sneeze it', 'sneeze them', 'squeeze it'], a: 0,
      cue: '「writing」のあと、別の声の短い問い。',
      line: 'No, I haven’t finished writing. — Did you *sneeze it* off?',
      said: '鼻が小さいとからかう続きで、「くしゃみで飛ばしたの？」と聞く。',
      mean: 'sneeze it off が「スニーズィトフ」とつながる。it は鼻。',

      trap: '直前の glasses から them と取りやすいが、them なら m が残る。短い「イ」を聞く。',
      use: 'Did you leave it on the bus?（バスに置いてきちゃった？）' },

    // R fix: V2, blind 55 % (the key's "X dressed up as Y" form was unique); now there's a parallel "joke dressed up
    //   as a worry"
    // why: shared fear ← "I'm afraid" heard as a real fear; a joke ← "thrown around like a football" heard as her own
    //   joke, though she insists "I am"
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'petite', seg: [173.8, 181.6],
      stem: 'How do the others take the worry about a “petite figure”?',
      choices: ['As a brag dressed up as a worry', 'As a real fear that they share', 'As a joke dressed up as a worry'],
      a: 0,
      cue: '彼女の一言への短い反応と、その返し。',
      line: 'I’m very sensitive about my *petite figure*. — *Oh, God.* — *I am.*',
      said: '「小柄な体型が気になる」と言うと「やれやれ」と声が上がり、彼女は「本当よ」と返す。',
      mean: 'Oh, God は、自慢と受け取ったあきれ。I am は、それを打ち消す返し。',
      trap: 'afraid から本当の悩みと取りやすいが、周りの反応が受け取り方を示す。',
      use: 'Oh, please. You look great.（またまた。素敵だよ）' },

    // R fix: V2, blind 60 % (the only kind aim); now a second "cheer her up", wrong on what he actually says
    // why: tease ← she is "petite", so a weight line heard as mocking her size; looks fine ← "make you feel better"
    //   caught, "you are fat" before it lost
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'richie', seg: [180.3, 186.2],
      stem: 'What is Michael trying to do with his comment about Nicole Richie?',
      choices: ['Cheer her up, though it comes out badly', 'Tease her for being much too thin',
                'Cheer her up by saying she looks fine'], a: 0,
      cue: '最後の問いかけ「Does that…」。',
      line: 'Nicole Richie might think that you are fat. *Does that make you feel better?*',
      said: '「ニコール・リッチーなら君を太ってると思うかも。少しは楽になった？」と言う。',
      mean: '小柄の悩みへの励ましのつもりで「太って見える人もいる」と言う。慰め方がずれている。',
      trap: 'fat から悪口と取りやすいが、最後の feel better が目的を示す。',
      use: 'Does that make you feel better?（それで少しは楽になった？）' },

    // R fix: V2, blind 50 % (the only choice about the name); now "she said her own name", wrong on who said it
    // why: own name ← "Meredith?" heard as her own voice, with "out loud" next to it; read out ← the usual
    //   teacher-reads-it script, against "nobody look"
    { id: 'h3', skill: 'humor', level: 'C1', point: 'sign', seg: [186.0, 196.6],
      stem: 'Why is Michael’s “don’t sign your name to it” funny?',
      choices: ['He just called her up to the board by name', 'She just said her own name to the whole room',
                'He plans to read it out to everyone anyway'], a: 0,
      cue: '「Meredith?」と呼んだあとの流れ。',
      line: '*Meredith?* — I don’t want to say it out loud. — Okay, fine. *Come on up here*. Write it yourself, and *don’t sign your name to it*.',
      said: '名前を呼び、「声に出したくない」と言う彼女に「前に来て書いて。名前は書かないで」。',
      mean: 'みんなの前で名前を呼んで前に出したのに、名前は伏せろと言う。匿名の意味がない。',
      trap: '「見ないで」と続くので配慮に見えるが、呼んだ時点で誰かは全員に分かっている。',
      use: 'You don’t have to sign it.（名前は書かなくていいよ）' },

    // R fix: V2, blind 60 % (the only choice about wording); "proud" is now "more serious than it is", the opposite
    //   effect of the same hedges
    // why: more serious ← "relationship" said slowly, with pauses (213–218 s), heard as weight; ending ← "ill-defined"
    //   heard as "going badly"
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'hedge', seg: [210.5, 222.4],
      stem: 'What do the words around “relationship” do in the man’s request?',
      choices: ['Keep it vague and not quite official', 'Make it sound more serious than it is', 'Hint that it’s about to end soon'],
      a: 0,
      cue: 'relationship の前後に付く言葉の数。',
      line: 'I’m in a *kind of ill-defined* relationship *type of thing*. — …Just put Kelly.',
      said: '「はっきりしない交際みたいなもの」と言い、「ケリーと書いて」。',
      mean: 'kind of、ill-defined、type of thing と三重にぼかし、正式な交際と認めない。',
      trap: 'ゆっくり言うので重い話に聞こえるが、ぼかす語が多いほど言い切りたくない。',

      use: 'It’s a kind of date-type thing.（デートみたいなものかな）' },

    // C2: a callback inside the clip (who the joke is on)
    // R fix: V2, blind 65 % (the "mocks Michael" filler); now "the list worked: she stops in time", the wrong direction
    // why: just noticed ← "tiny nose" heard as a new insult she just came up with; stops in time ← "It's on the list"
    //   heard as cutting her off before she finishes, though she says the whole threat
    // anchor: 223.4 s "That's still going on?", 224.3 s "I will claw your tiny nose off", 226 s "It's on the list":
    //   the man she threatens answers with the list, so it's the nose put on it at 130–141 s
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'tinynose', reveals: ['nose'], seg: [220.8, 227.4],
      stem: 'Why does the threat about a “tiny nose” get a laugh?',
      choices: ['It hits the very thing he put on the list', 'It shows she has only now noticed his nose',
                'It shows the list working: she stops in time'], a: 0,
      cue: '脅しへの返事と、少し前の鼻の話。',
      line: 'That’s still going on? — I will claw your *tiny nose* off. — *It’s on the list.*',
      said: '「まだ続いてたの？」と言った男に、彼女が「その小さな鼻をむしるわよ」。彼は「リストに載ってる」と返す。',
      mean: '守られたはずの鼻が、すぐ攻撃の的になる。リストは何の盾にもならない、という落ち。',
      trap: '新しい悪口に聞こえるが、本人の返事が少し前の鼻の話につながる。返事が前の場面を指す。',
      use: 'Hey, that’s on the list!（ちょっと、それ禁止でしょ！）' },

    // R fix: V2, blind 60 % (the only legal choice); "jokes allowed" is now "report crimes in secret", from Meredith's
    //   anonymous note just before
    // why: report in secret ← "write it down" right after Meredith's unsigned note, heard as an anonymous tip; record
    //   ← "write it down" heard as a confession list
    { id: 'i3', skill: 'infer', level: 'C1', point: 'creed', reveals: ['writeit'], seg: [226.4, 233.2],
      stem: 'What does Creed seem to think the list is?',
      choices: ['A shield from being charged with crimes', 'A way to report crimes in secret',

                'A record of things people did wrong'], a: 0,
      cue: '「If I write it down」のあとの結果。',
      line: 'If I write it down, *I can’t be charged with it*. — No one said that.',
      said: '「書けば罪に問われないんだろ」。マイケルは「誰も言ってない」。',
      mean: 'charged ＝ 罪に問われる。リストを罪逃れの道具と勘違いしている。',
      trap: 'write it down から告白の記録と取りやすいが、can’t be charged は守られる話。',
      use: 'Nobody said that.（誰もそんなこと言ってないよ）' },
  ]
};
