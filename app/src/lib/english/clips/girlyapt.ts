// “Joey’s New Girly Apartment | Friends” (the official Friends channel, Best of Season 6): Chandler warns Joey that
// his new roommate Janine's things are taking over, Joey tries to push back and gives in on each point, and by the end
// he is giving flower tips, until one line of his own gives him away.
// Segments from the captions, words from whisper (2026-11-16). Whisper's timings drift ≈ 9 s late after 60 s and it
// loops 86–107 s, so every segment after 60 s is from the captions alone (their words agree with whisper's wherever
// whisper isn't looping). Joey is named at 67.5 s, Janine at 81.8 s, Monica at 197.2 s; Chandler is never named, and no
// key depends on who he is except h2 and nt1 (below).
// Untested on purpose: the call at 50.4 s (both sources “Taylor”), “sitting around with your fingers soaking in/and
// stuff” (40.8 s), the potpourri reply (169.3 s: captions “I know”, whisper “I don't know”), who says “that's like
// summer in a bowl” (181 s) and “Joey, that is such a great tip” (193.7 s).
// EAR CHECK: 52.3 s h2 nt1 — “Be right there, sweetums” and “Totally different situation” taken as said by the same
//   man who said “Be a man” (45.2 s); no name, but “different situation” only makes sense from him
// REVIEW 2026-11-16: pass 6, fix 17, drop 1, new 0; ear checks 1
import type { Clip } from '../types.ts';

export const girlyApt: Clip = {
  id: 'girlyapt', video: 'lfFrvd50PCk', title: 'Joey’s New Girly Apartment', dur: 270, wpm: 165, band: 'fast',
  tags: ['家', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %): "liked them at first" was a filler; now two choices start "means to push back"
    // why: wins a few ← the talk with Janine heard as Joey winning some points ("We can't have that"); Chandler stops
    //   him ← a role swap: Chandler is the one pushing him to act
    { id: 'g1', skill: 'gist', level: 'B2', point: 'turn', reveals: ['curling', 'peace'], seg: [0, 259],
      stem: 'Across the clip, how does Joey’s stand on Janine’s things change?',
      choices: ['He means to push back, but ends up won over', 'He means to push back, but Chandler stops him',
                'He pushes back, and wins a few of the points'], a: 0,
      cue: '最初の「talk to her」と、最後の叫び。',
      said: '最初は文句を言いに行くが、話すたびに引き下がり、最後は花の生け方まで教えている。',
      mean: '止めるつもりが、自分が染まっていく。その逆転が場面の筋。',
      trap: '話し合いで Joey が言い分を通したように聞こえやすい。各場面の終わり方を並べて聞く。',
      use: 'I came to complain. Now I love it.（文句を言いに来たのに、今は大好き）' },

    // why: asleep in her room ← "my room" comes right after; at her new job ← "class" heard as a work course
    { id: 'd4', skill: 'detail', level: 'B1', point: 'dance', seg: [0.5, 3.6],
      stem: 'When Chandler asks about Janine, where is she?',
      choices: ['At a dance class', 'Asleep in her room', 'At her new job'], a: 0,
      cue: '「no」のすぐあと、場所。',
      line: 'Uh, no. She’s at *dance class*.',
      said: 'Janine はいるかと聞かれ、「いや、ダンスのレッスン中」と答える。',
      mean: '今は留守、という答え。だから部屋をのぞきに行ける流れになる。',
      trap: '直後の my room に引っぱられやすい。no のすぐあとの場所が答え。',
      use: 'She’s at work right now.（彼女は今仕事中）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'checkout', seg: [3.2, 5.3],
      stem: 'Type what Chandler asks: “Can I ___ with my room?” (5 words)', answer: 'check out what she did',
      cue: '「Can I」のあと、速くつながる5語。',
      line: 'Can I *check out what she did* with my room?',
      said: '「僕の前の部屋をどうしたか、見てもいい？」と聞く。',
      mean: 'check out ＝ ちょっと見てみる。my room は前に住んでいた部屋。',
      trap: 'check out は「チェッカウ」、what she did は「ワッシディッ」と縮む。5語を数える。',
      use: 'Can I check out the view?（景色を見てもいい？）' },

    // R fix: V2 (blind 70 %): "more girls" was a filler; now two choices are about her things, split on where
    // why: Joey's own room ← "my room" and "a guy never lived in here" from just before; Joey buying ← "is this your
    //   pretty pink pillow?" heard as the girl thing spreading to Joey himself (his two "No"s refute it)
    { id: 'i2', skill: 'infer', level: 'B2', point: 'spreading', seg: [16.9, 31.8],
      stem: 'When Chandler first warns Joey, what has he noticed?',
      choices: ['Her things are turning up in the shared rooms', 'Her things have taken over Joey’s own room',
                'Joey has started buying girly things himself'], a: 0,
      cue: '警告のすぐあと、ソファの上の物。',
      line: 'This girl thing is dangerous. *It’s spreading already*.',
      said: '「女の子っぽさは危ない。もう広がってる」と言い、ソファのクッションのことを聞く。',
      mean: '病気のように「広がる」と言い、彼女の物がリビングまで来ていると伝える。',
      trap: 'girl を「女の子たち」と取ると、人が増える話に聞こえる。直後の couch が中身。',
      use: 'Her stuff is everywhere now.（彼女の物がもうあちこちに）' },

    // R fix: V2 (blind 55 %): "hides things" was a filler; now two choices start "As cute"
    // why: too small for Joey ← "too small to put anything in" taken as a practical complaint; secretly likes ← "Is
    //   that your…" heard as Chandler catching Joey out (his "No" refutes it)
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'box', seg: [27.5, 33.4],
      stem: 'With his question about the little box, how does Chandler see it?',
      choices: ['As cute, but no use for anything', 'As too small for the things Joey owns',
                'As cute, and something Joey secretly likes'], a: 0,
      cue: 'tiny little と too small、小ささを重ねる言い方。',
      line: 'Is that your *tiny little box that’s too small to put anything in*?',
      said: '「その、何も入らないくらいちっちゃな箱、君の？」と聞く。',
      mean: '飾りの小箱を「役に立たない物」として描く。男の目から見た飾り物への皮肉。',
      trap: '「Joey の物には小さすぎる」と取りやすい。anything は「何も」、つまり使い道がない。',
      use: 'It’s cute, but what’s it for?（かわいいけど、何に使うの？）' },

    // why: give up his place ← "let go" read as 手放す; lose his temper ← "let go" heard as letting feelings out
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'letgo', seg: [34.3, 42.4],
      stem: 'In Chandler’s warning, what does he tell Joey he mustn’t do?',
      choices: ['Leave the changes alone', 'Give up his place to her', 'Lose his temper with her'], a: 0,
      cue: '「If you」のあとの動詞と小さな語。',
      line: '*If you let this go*, you’re gonna be sitting around with your fingers soaking…',
      said: '「これを放っておいたら、そのうち指を浸して座ってることになるぞ」と言う。',
      mean: 'let ～ go ＝ 問題にせず放っておく。何もしないと染まる、という脅し。',
      trap: 'let go を「手放す」と取ると部屋をゆずる話に聞こえる。ここは「見のがす」。',
      use: 'I’ll let it go this time.（今回は見のがすよ）' },

    // R fix: V2 (blind 75 %): the key was the only ironic reading; now all three are about the parallel
    // why: admits ← the right parallel, the wrong move (he denies it); Joey's case worse ← "different situation"
    //   taken at face value, as a real comparison
    { id: 'h2', skill: 'humor', level: 'C1', point: 'sweetums', seg: [44.7, 58.2],
      stem: 'Why does “Totally different situation” get a laugh?',
      choices: ['He denies a match the audience just heard', 'He admits his home is just as girly, laughing',
                'He says Joey’s case is far worse than his'], a: 0,
      cue: '「Be a man」と、そのすぐあとの呼びかけへの返事。',
      line: '*Be a man*. … Be right there, *sweetums*. … Totally different situation.',
      said: '「男らしくしろ」の直後、呼ばれて「すぐ行くよ、ハニー」と答え、「全然別の話」と言う。',
      mean: '飾り付けに呼ばれ、甘い呼び名で返事。自分も同じ状態にいる。',
      trap: 'different を言葉通り取ると、事情が違って聞こえる。直前の Be a man と並べる。',
      use: 'That’s a totally different thing!（それは全然別の話だよ！）' },

    // R fix: V2 (blind 60 %): only the key carried an ironic reason; now Joey's choice has one too ("I'm a man")
    // why: Joey ← the whole talk is about Joey being too soft, and he has just said "I'm a man"; Janine ← "the new
    //   dust ruffle" heard as more of her frilly things
    // anchor: 45.2–47.4 s “Talk to her. Be a man. Defend yourself.”; 52.3 s “Be right there, sweetums”; 56.7 s “Totally
    //   different situation”: he denies the parallel himself, which makes him the target
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'sweetums', seg: [44.7, 58.2],
      stem: 'After the call from the other room, who is the joke on?',
      choices: ['Chandler, who just told Joey to be a man', 'Joey, who just said “I’m a man” himself',
                'Janine, whose frilly things started it all'], a: 0,
      cue: '言いわけの一言は、誰が言った？',
      line: 'Be a man. … Be right there, *sweetums*. … *Totally different situation*.',
      said: '「男らしく立ち向かえ」と言った本人が、呼ばれると「すぐ行くよ、スウィータムズ」と甘く答える。',
      mean: '笑いの的は助言した本人。別の話だと否定するほど、自分も同じだと認めている。',
      trap: '話の中心が Joey なので、笑いも Joey に向くと思いやすい。最後に言いわけしたのが誰かで的が決まる。',
      use: 'Do as I say, not as I do.（言う通りにして、まねはしないで）' },

    // R fix: V2 (blind 65 %): two fillers; now "holds firm" is a near miss and the third is a role swap
    // why: holds firm ← "you're changing too much around here" and "too much stuff" heard as where he ends; she backs
    //   down ← a role swap, with her "I'm sorry" heard as giving in
    { id: 'g2', skill: 'gist', level: 'B2', point: 'talk', reveals: ['curling', 'peace', 'clean'], seg: [67, 172.8],
      stem: 'How does Joey’s talk with Janine mostly go?',
      choices: ['She explains each thing, and he backs down', 'She explains each thing, but he holds firm',
                'He explains what bugs him, and she backs down'], a: 0,
      cue: 'Janine の説明のあと、Joey の返事。',
      said: '写真やタオルに文句を言うたび Janine が説明し、Joey は「それならいい」と引く。',
      mean: '話し合っても、ほぼ何も変わらない。文句を言うはずが説得されている。',
      trap: 'I’m sorry は Janine の言葉。Joey の返事の終わり方を聞く。',
      use: 'Fair enough. You win.（なるほど、君の勝ち）' },

    // R fix: V2 (blind 50 %, K6): the key alone had "just"; all three are now the same length and shape
    // why: relative ← Joey's own guess, said just before; looked after ← "do you know this kid?" heard as a yes
    { id: 'd1', skill: 'detail', level: 'B1', point: 'cute', seg: [69.6, 77.7],
      stem: 'Why does Janine have the picture of the kid?',
      choices: ['She thought the kid looked cute', 'The kid is a relative of hers', 'She used to look after the kid'], a: 0,
      cue: 'Joey の質問への返事、No のあと。',
      line: 'No, *I just thought it was cute*.',
      said: '親せきかと聞かれ、「ううん、かわいいと思っただけ」と答える。',
      mean: '知らない子の写真を、かわいいという理由だけで飾っている。',
      trap: 'relative が耳に残ると「親せき」を選びやすい。答えは No から始まっている。',
      use: 'I just thought it was nice.（いいなと思っただけ）' },

    // R fix: V2 (blind 50 %): "hers from before they met" was a filler; now both distractors are hopes about her
    //   reaction, which "that's what I was afraid of" (of "just cute") refutes
    // why: take it down ← "afraid" heard as fearing a fight over the picture; agree it's girly ← jumping ahead to
    //   "too girly", said a few lines later
    { id: 'i1', skill: 'infer', level: 'C1', point: 'cute', seg: [71.1, 79.9],
      stem: 'What does Joey’s reply to her reason tell us he’d hoped?',
      choices: ['That there was a reason, like family', 'That she would agree it was too girly',
                'That she would offer to take it down'], a: 0,
      cue: 'cute のあとの Joey の一言。何を心配していた？',
      line: '…just thought it was cute. — Yeah, *that’s what I was afraid of*.',
      said: '「かわいいと思っただけ」に、「やっぱりな、それが心配だった」と返す。',
      mean: '親せきなら理由になった。理由なく飾るのは「女の子っぽさ」の証拠。',
      trap: 'afraid から、もめるのを心配したと取りやすい。直前に聞いたのは relative かどうか。',
      use: 'That’s what I was afraid of.（それを心配してたんだ）' },

    // R drop: r1 (predict) — S5: “here” starts at 83.7 s and “but” at 83.9 s, so no cut can stop ≥ 0.3 s before the
    //   continuation without clipping “here”
    // why: try to make ← the grammar-correcting instinct: "try and" written as the textbook "try to"; I tried to ← the
    //   weak 'd lost, so the past tense is written in its place
    // anchor: 110.3–112.1 s captions “I just thought I'd try and make the place a little nicer”, whisper the same words
    { id: 'nt4', skill: 'dict', level: 'C2', point: 'nicer', seg: [109.1, 112.6],
      stem: 'Type what Janine says: “I just thought ___ the place a little nicer.” (4 words)',
      answer: "i'd try and make",
      cue: '「thought」のあと。教科書とは違う小さな一語に注意。',
      line: 'I’m sorry. I just thought *I’d try and make* the place a little nicer.',
      said: '「部屋をちょっと良くしようと思っただけ」と言う。4語とも弱く速い。',
      mean: 'try and ＋動詞は話し言葉の try to。I’d の d はほぼ聞こえないが、thought のあとなので would。',
      trap: '文法の知識で try to と直しやすい。聞こえた and をそのまま書く。',
      use: 'I’ll try and call you tonight.（今夜電話してみるね）' },

    // R fix: V2 (blind 60 %): "apologetically" was a filler; now "playfully" is a near-miss tone
    // why: sincerely ← "I'm sure it's a famous…" heard as a concession; playfully ← the laugh after "watering can"
    //   heard as a shared joke
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'wateringcan', seg: [119.3, 129.5],
      stem: 'When Janine starts to explain the watering can, how does Joey answer?',
      choices: ['Sarcastically, waving off her “famous” point', 'Playfully, hoping she’ll laugh along with him',
                'Sincerely, granting her “famous” point'], a: 0,
      cue: '「I’m sure」と、そのあとの「okay?」「come on」。',
      line: '*I’m sure* it’s a famous watering can, *okay?* But come on.',
      said: 'Janine をさえぎり、「どうせ有名なじょうろだろ。勘弁して」と言う。',
      mean: '「有名な画家」を逆手に取った皮肉。I’m sure は「どうせ」に近い。',
      trap: 'I’m sure を「確かに」と取ると、認めたように聞こえる。But come on が本音。',
      use: 'I’m sure it’s very important, but…（さぞ大事なんでしょうけど…）' },

    // R fix: V2 (blind 50 %): "warns her" was a filler; now the complaint carries on in a milder form
    // why: makes fun ← "okay then" read as the same sarcasm as the watering can; somewhere else ← "in the bathroom"
    //   heard as the problem being where it is
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'curling', seg: [128.8, 143.6],
      stem: 'Once Janine names the hot thing in the bathroom, what does Joey’s reply do?',
      choices: ['Drops that complaint right away', 'Makes fun of her answer to it', 'Asks her to keep it somewhere else'],
      a: 0,
      cue: '名前を聞いたあとの、短い返事。',
      line: 'It’s a curling iron. — *Oh, well, that’s okay then*.',
      said: '「ヘアアイロンよ」と聞くと、「ああ、それならいいや」と引き下がる。',
      mean: '何か分からなかっただけで、正体が分かれば文句はない。あっさり取り下げている。',
      trap: 'さっきの皮肉の流れで、これも嫌味と取りやすい。Oh well の軽さと、すぐ次の話に移る点を聞く。',
      use: 'Oh, well, that’s fine then.（ああ、それならいいよ）' },

    // why: hook ← where it is now, said right after; bathtub ← "bathroom" heard, a guess at a usual place
    { id: 'd2', skill: 'detail', level: 'B1', point: 'towel', seg: [143.5, 154.8],
      stem: 'Where does Joey say he usually keeps his towel?',
      choices: ['On the floor', 'Up on a hook', 'Over the bathtub'], a: 0,
      cue: '「where I keep it」の直前。',
      line: 'my towel is not *on the floor where I keep it*.',
      said: '「僕のタオルが、いつも置いてる床の上にない」と言う。',
      mean: 'Joey は普段タオルを床に置いている。それを Janine がフックにかけ直した。',
      trap: 'hook があとに出るので、そちらを選びやすい。not は「今は」ないということ。',
      use: 'That’s where I keep my keys.（鍵はいつもそこに置いてる）' },

    // R fix: V2 (blind 55 %): the key's "improvements" stood apart; all three now start "What bothers him is"
    // why: she used it ← "smells different" heard as someone else's smell on it; a smell she added ← "smells
    //   different", with the potpourri still to come
    { id: 'i4', skill: 'infer', level: 'B2', point: 'clean', seg: [152.3, 161],
      stem: 'What do Janine’s short answers show about Joey’s towel complaints?',
      choices: ['What bothers him is really an improvement', 'What bothers him is a smell she added',
                'What bothers him is that she used it'], a: 0,
      cue: '「different」と言うたびに返る、短い一語。',
      line: '…it feels different. — It’s *dry*.',
      said: '「匂いが違う」には「洗ったから」、「感じが違う」には「乾いてる」と返す。',
      mean: '違和感の正体は、清潔で乾いていること。文句が改善の証拠になる。',
      trap: 'smells different から「誰かが使った」と取りやすい。Janine の短い答えが理由。',
      use: 'It’s not different. It’s just clean.（違うんじゃなくて、きれいなだけ）' },

    // R fix: V2 (blind 55 %): "ask Janine to leave them alone" was weak; now "accept and thank" splits on the attitude
    // why: make up with Janine ← "peace" read as 仲直り; accept and thank ← "make my peace" heard as warm, not
    //   grudging
    { id: 'ph3', skill: 'phrase', level: 'B2', point: 'peace', reveals: ['clean'], seg: [163.3, 166.5],
      stem: 'After the towel answers, how does Joey settle that point?',
      choices: ['He’ll accept them, though not happily', 'He’ll accept them, and thank her for them',
                'He’ll make up with Janine over them'], a: 0,
      cue: '「All right」のあと、make に続く語。',
      line: 'All right, *I can make my peace with* the clean, dry towels.',
      said: '「わかった、洗って乾いたタオルは受け入れるよ」と言う。',
      mean: 'make peace with ～ ＝ 気は進まないが受け入れる。ここで一つ譲った。',
      trap: 'peace から「仲直り」と取りやすいが、相手は人でなくタオル。with のあとを聞く。',
      use: 'I’ve made my peace with it.（もう受け入れたよ）' },

    // R fix: S3: the cue's "frying pan" named a word only the key has ("pan"); the cue now points at the verb's place
    // why: soaking ← "soaking" was said earlier and is the usual tip; cutting ← the usual real tip, with "stems" and
    //   "first" caught
    { id: 'd3', skill: 'detail', level: 'B1', point: 'tip', seg: [184.7, 192.4],
      stem: 'What does Joey say keeps flower arrangements fresh longer?',
      choices: ['Searing the stems in a pan first', 'Soaking the stems in water first', 'Cutting the stems short first'],
      a: 0,
      cue: '「if you」のすぐあと、茎にする動作。',
      line: 'if you *sear the stems* of the flowers first *in a frying pan*…',
      said: '「茎を先にフライパンで焼くと、長持ちする」と話す。',
      mean: 'sear ＝ 表面をさっと焼く。Joey が花の生け方のコツを教えている。',
      trap: 'sear は soak や cut と同じ位置に来る。frying pan まで聞けば「焼く」と分かる。',
      use: 'Sear the meat first, then lower the heat.（先に肉を焼いて、火を弱める）' },

    // R fix: V2 (blind 75 %, S1): the stem's "asks Monica to step away" ruled Monica out; the stem now names the moment
    //   only, and the three choices are the three candidates for "the girl"
    // why: Janine ← "the girl" heard as the only girl in Joey's home; Monica ← she is the one addressed, and she just
    //   praised the tip
    { id: 'h6', skill: 'humor', level: 'C1', point: 'girlflowers', seg: [193.2, 200.8],
      stem: 'When Chandler cuts into the flower talk, why does it get a laugh?',
      choices: ['He calls Joey the girl with the flowers', 'He calls Monica the girl with the flowers',
                'He calls Janine the girl with the flowers'],
      a: 0,
      cue: '「I need to talk to」のあと、誰のこと？',
      line: 'I need to talk to *the girl with the flowers*.',
      said: 'Monica に席を外してもらい、「花の女の子と話がある」と言う。',
      mean: 'その場で花のコツを語っていたのは Joey。彼を「女の子」と呼んでからかっている。',
      trap: 'girl と聞くと Janine を思い浮かべやすい。花の話をしていたのは誰か。',
      use: 'Can I talk to the birthday boy?（誕生日の主役と話せる？）' },

    // R fix: V2 (blind 70 %): the key alone was insightful; now "quoting Janine to show it's her view" is a near miss
    // why: sarcastic ← "famous… famous" has the shape of his watering-can sarcasm (the sincerity flip); quoting her ←
    //   the right source, the wrong stance: "I am still Joey… nice to look at" makes it his own view
    // anchor: 95.7–97.5 s Janine's “She's a famous artist”; 125.1–127.0 s his “I'm sure it's a famous watering can”;
    //   228.1–237.6 s “I am still Joey… a famous artist of a famous baby”, said straight after defending flowers
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'famousbaby', reveals: ['wateringcan'], seg: [226.2, 238.4],
      stem: 'When Joey defends the baby picture to Chandler, what does his wording show?',
      choices: ['He now argues the way he mocked earlier', 'He mocks it again, the way he did the can',
                'He is quoting Janine, to show it’s her view'], a: 0,
      cue: '「famous」が2回。前にこの語を使ったのは誰？',
      line: 'that happens to be *a picture by a famous artist* of a famous baby.',
      said: '「花は見て楽しいもの。それにあれは有名な画家による有名な赤ちゃんの写真だ」と言う。',
      mean: '前に皮肉った Janine の言い分を、今度は本気で自分が使う。言葉の借り方が変化の証拠。',
      trap: 'famous の重ね方はじょうろの皮肉と同じ形だが、今は守る側。前に誰の言葉だったかと、今の立場を並べる。',
      use: 'Now you sound just like her.（今の、彼女そっくり）' },

    // R fix: V2 (blind 55 %): parallel rewording, so no choice is the only "feelings" one
    // why: calm ← the laugh track and a quick "No, I'm not" heard as playful; cross ← "Why would you say that?" heard
    //   as a challenge
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'mean', seg: [239.7, 246.4],
      stem: 'When Chandler says Joey is turning into a woman, how does Joey react?',
      choices: ['Hurt, as if Chandler was unkind', 'Cross, as if Chandler picked a fight', 'Calm, as if Chandler was joking'],
      a: 0,
      cue: '否定のあとの「Why would you」と最後の一言。',
      line: 'No, I’m not. Why would you say that? *That’s just mean*.',
      said: '「違うよ。なんでそんなこと言うの？ひどいよ」と返す。',
      mean: 'mean ＝ 意地悪な。言い返すより傷ついている。その反応自体がネタになっている。',
      trap: 'Why would you を挑発と取ると怒りに聞こえる。最後の just mean が気持ち。',
      use: 'That’s just mean. Take it back.（ひどいよ、取り消して）' },

    // why: I ← the weak 've swallowed before "upset", leaving the past tense; I'd ← the v heard as a d
    { id: 's1', skill: 'sound', level: 'B2', point: 'ive', seg: [248.6, 251.6],
      stem: 'Fill the gap: “Now ___ upset you.”',
      choices: ['I', 'I’ve', 'I’d'], a: 1,
      cue: 'Now のすぐあと、upset の前の小さな音。',
      line: 'Now *I’ve* upset you. What did I say?',
      said: '「あーあ、傷つけちゃった。何て言った？」と言う。',
      mean: '今の結果を言う現在完了。’ve は弱く、「アイヴ」がほぼ「アヴ」になる。',
      trap: 'v が消えると I upset（過去形）に聞こえる。今の状態を言うときは have が隠れていると考える。',
      use: 'Sorry, I’ve kept you waiting.（お待たせしました）' },

    // R fix: V2 (blind 70 %): all three now start "He hears"; its key shows he's hurt, so it reveals a3's point
    // why: Chandler's list ← the list of flowers and baby pictures came earlier, so it seems to be the cause; loves the
    //   flowers ← "they're nice to look at" heard as the turning point
    { id: 'h7', skill: 'humor', level: 'C1', point: 'wayyousaid', reveals: ['mean'], seg: [248.6, 258.4],
      stem: 'Why does Joey suddenly decide he’s become a woman?',
      choices: ['He hears himself say a line from a couple’s fight', 'He hears himself admit he loves the flowers',
                'He hears Chandler list all the girly things'], a: 0,
      cue: '気づく直前の、Joey 自身の一言。',
      line: '*Not what you said, it’s just the way you said it*. — Oh my God! I’m a woman!',
      said: '「言った中身じゃなくて、言い方なんだよ」と答えた直後、「女になってる！」と叫ぶ。',
      mean: '「中身じゃなく言い方」は、けんかで傷ついた恋人の決まり文句。自分の口から出て気づく。',
      trap: '花や写真の話が前にあるので、それが決め手と取りやすい。直前の一言を聞く。',
      use: 'It’s not what you said. It’s how.（中身じゃなくて、言い方だよ）' },
  ]
};
