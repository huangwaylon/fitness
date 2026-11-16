// REVIEW 2026-11-16: pass 7, fix 14, drop 0, new 0; ear checks 0
// OPEN: f2 (do the trick) and p1 (I appreciate…) still sit near 50 % blind for anyone who knows the idiom; that's
//   the skill they test.
// “Kevin's Small Talk - The Office US” (the official The Office channel, BEST OF The Office - Season 8): Kevin has
// started talking in as few words as possible; coworkers think he's ill or "making a statement", a coworker invokes a
// "word code", and the "see world" mix-up shows his method costs time. He agrees to talk normally, then tells the camera
// "When me president, they see."
// Segments from the captions, words from whisper (2026-11-16). Only Kevin is named, so the others are "a coworker".
// Untested on purpose: 20–27 s (captions "what you doing now go stop worry", whisper "Me doing now. Go. Stop
// worrying."), 56–58 s (whisper "car no go", captions "Caro go"), 83–93 s (whisper "words you no need use", captions
// "you know need"), 117–122 s ("oceans, fish, jump, China": what Kevin meant is unclear), 142–153 s (music; whisper
// invents a last line).
// No ear checks: every key rests on words both sources agree on, and no item depends on which coworker speaks.
import type { Clip } from '../types.ts';

export const kevinTalk: Clip = {
  id: 'kevintalk', video: '_K-L9uhsBLM', title: 'Kevin\'s Small Talk', dur: 153, wpm: 133,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: missing ← "which one's right" heard as one of them gone; out of date ← "original" heard as "the old one"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'match', seg: [6.1, 13.3],
      stem: 'What problem does the coworker bring to Kevin?',
      choices: ['Two papers don’t agree with each other', 'One of the papers has gone missing',
                'The papers are both out of date'], a: 0,
      cue: '「Hey, so」のあと、二つを比べる言い方。',
      line: 'this *isn’t matching up with this*, and I’m not sure which one’s right.',
      said: '「これとこれが合わない。どっちが正しいか分からない」と言う。',
      mean: 'match up ＝ 一致する。書類の中身が食い違っている。',
      trap: 'which one’s right から「片方がない」と取りやすいが、二つとも手元にある。',
      use: 'These numbers don’t match up.（この数字、合わないね）' },

    // why: look over ← "hunt" missed, "the original" heard as something to check; copier ← "down" taken literally
    //   (下の階へ)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'hunt', seg: [9.4, 13.3],
      stem: 'What does the coworker ask Kevin to do with the original?',
      choices: ['Search for it and bring it back', 'Read it over and check it',
                'Take it down to make a copy'], a: 0,
      cue: '「Can you just」のすぐあとの動詞。',
      line: 'Can you just *hunt down* the original…',
      said: '「元の書類を探し出してくれる？」とたのむ。',
      mean: 'hunt down ＝ あちこち探して見つけ出す。物にも人にも使う。',
      trap: 'down を「下へ」と文字通りに取りやすい。動詞＋down で「とことん」の意味になる。',
      use: 'I need to hunt down my passport.（パスポートを探し出さなきゃ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'medo', seg: [12.8, 15.9],
      stem: 'Type Kevin’s answer: “___.” (3 words)', answer: 'yes me do',
      cue: 'たのまれた直後の、とても短い返事。文法より音を。',
      line: '*Yes, me do.*',
      said: '「うん、やる」と答える。I でなく me を使った片言。',
      mean: '言葉を減らす話し方の、最初の一言。この先の話の入り口。',
      trap: '頭の中で I do に直したくなる。聞こえた音のとおりに書く。',
      use: 'Yes, I’ll do it right away.（はい、すぐやります）' },

    // why: weak ← "body" heard without "strong"; little sleep ← "sleep" heard, "big" missed
    { id: 'd2', skill: 'detail', level: 'B1', point: 'feel', seg: [27.9, 33.7],
      stem: 'Asked if he feels okay, what does Kevin say?',
      choices: ['He feels fine and slept a lot', 'He feels weak and slept badly',
                'He feels fine but slept little'], a: 0,
      cue: '「Me feel」のあと、体と睡眠の話。',
      line: 'Me feel *good*, body *strong*, sleep *big* last night.',
      said: '「気分いい、体は丈夫、昨夜はよく寝た」と単語だけで答える。',
      mean: '元気だと言っている。sleep big ＝ たくさん寝た、の片言。',
      trap: 'sleep だけ聞くと寝不足の話に聞こえやすい。後ろの big を聞き取る。',
      use: 'I slept like a baby last night.（昨夜はぐっすり寝た）' },

    // R fix: V2 (blind 70 %): the key was the only choice about his manner. "Seems to miss the question" is a second
    //   manner reading; he answers it, so it's refutable.
    // why: pain ← "body" is said; missed the question ← the broken words heard as confusion
    { id: 'i1', skill: 'infer', level: 'B2', point: 'hospital', reveals: ['feel'], seg: [27.9, 36.4],
      stem: 'Why does a coworker suggest getting Kevin to the hospital?',
      choices: ['His odd way of talking worries them', 'He seems not to follow the question',
                'He says his body is hurting him'], a: 0,
      cue: '彼の答えの「中身」でなく「話し方」に注目。',
      line: 'Me feel good, body strong… — I think we should get him to the *hospital*.',
      said: '「元気」と答えたのに、同僚は「病院に連れて行こう」と言う。',
      mean: '答えの中身は元気。心配されているのは、片言の話し方のほう。',
      trap: 'body が聞こえると体調の訴えと取りやすい。答えは質問に合っていて、中身は「元気」。',
      use: 'Are you okay? You don’t sound like yourself.（大丈夫？いつもと違うよ）' },

    // R fix: V2 (blind 75 %): the key was the only choice that described a joke. Both distractors are now joke
    //   mechanisms: the reverse direction, and "over the years" read as age.
    // why: dig then defense ← "No, he hasn't" heard last as the point; getting old ← "over the years" read literally
    { id: 'h1', skill: 'humor', level: 'C1', point: 'worse', seg: [36.8, 43.2],
      stem: 'Why is the reply to “He’s always been like that” funny?',
      choices: ['It starts like a defense but ends as a dig',
                'It starts like a dig but ends as a defense',
                'It blames the years: he is just getting old'], a: 0,
      cue: '「No, he hasn’t」のあと、「I mean」で何を足すか。',
      line: 'No, he hasn’t. I mean, *he’s gotten worse over the years*.',
      said: '「いや、前からじゃない。年々ひどくなってる」と言う。',
      mean: '前からこうだ、を否定するふりで、昔もひどかったと認めている。かばうどころか追い打ち。',
      trap: 'No, he hasn’t はかばう出だし。I mean のあとが本音で、年齢の話でもない。',
      use: 'I mean, it’s gotten worse.（というか、悪化してる）' },

    // R fix: V2 (blind 55 %): the key was the only "on purpose". Now two choices are on purpose (wrong target: a
    //   protest), and one is the earlier coworker's view.
    // why: protest ← "statement" heard as 抗議の声明; always this way ← "He's always been like that" just before
    { id: 'i2', skill: 'infer', level: 'C1', point: 'theory', seg: [42.9, 50.6],
      stem: 'What does another coworker think Kevin is doing?',
      choices: ['Doing it on purpose, to mock how they see him',
                'Doing it on purpose, to protest his workload',
                'Doing nothing new; he has always been this way'], a: 0,
      cue: '「statement」と「ironic」のあと、何についての皮肉か。',
      line: 'He’s *making a statement*. It’s an *ironic comment on our expectations* of him.',
      said: '「主張してるんだ。彼への私たちの期待に対する皮肉だよ」と言う。',
      mean: 'わざと片言を演じて、周りの見方をからかっている、という深読み。',
      trap: 'statement を抗議と取りやすい。皮肉の先は our expectations of him。',
      use: 'I think she’s making a statement.（あれは何かの主張だと思う）' },

    // R fix: V2 (blind 50 %, right): "explain more" was a filler. All three now judge the theory, the third via the
    //   literal keep = 続けて.
    // why: agrees ← "think that" heard as "I think that too"; think it over ← keep think read literally
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'keepthink', reveals: ['theory'], seg: [46.9, 52.4],
      stem: 'How does Kevin respond to the coworker’s theory?',
      choices: ['He waves it off: they have it wrong', 'He admits it: they have it right',
                'He urges them to think it over more'], a: 0,
      cue: '深読みの説明のすぐあと、彼の短い一言。',
      line: '*You keep think that.*',
      said: '「そう思ってれば」と短く返す。you keep thinking that の片言。',
      mean: '「勝手にそう思ってれば」という突き放し。説は外れている合図。',
      trap: 'think that を同意、keep を「続けて」と取りやすい。命令の形は突き放し。',
      use: 'You keep telling yourself that.（そう思い込んでれば）' },

    // R fix: V2 (blind 85 %): with the title known, "fewer words save time" was the only reason about short speech.
    //   All three now give a reason for fewer words.
    // why: friendlier ← "we best friends" right before the reason; smarter ← the scene's "statement" theory
    { id: 'g1', skill: 'gist', level: 'B2', point: 'why', reveals: ['mechanic'], seg: [50.2, 65.7],
      stem: 'What is Kevin’s own reason for talking this way?',
      choices: ['He thinks fewer words save time', 'He thinks fewer words are friendlier',
                'He thinks fewer words sound smarter'], a: 0,
      cue: '整備士の話のあと、「So me think」で始まる部分。',
      line: 'So me think, why *waste time* say lot word…',
      said: '整備士とは少ない言葉で通じる、だから言葉を減らせば時間の節約になる、と言う。',
      mean: '本人の理由は効率。同僚の「皮肉」説とは違う。',
      trap: 'best friends が直前なので「仲良くなれる」と取りやすい。So のあとに理由の結論が来る。',
      use: 'Why waste time? Let’s just go.（時間がもったいない、行こう）' },

    // why: perfect English ← "not speak English" with not missed; rarely talk ← "not speak" heard as "don't talk"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'mechanic', seg: [52.2, 60.0],
      stem: 'What does Kevin say about his mechanic?',
      choices: ['He speaks little English, but they get along', 'He speaks fine English, but rarely says much',
                'He speaks little English, so they rarely talk'], a: 0,
      cue: '「mechanic」のすぐあとと、最後の二語。',
      line: 'Me mechanic *not speak English*… and we *best friends*.',
      said: '「僕の整備士は英語を話さない。でも通じるし、親友だ」と言う。',
      mean: '少ない言葉でも通じる、という自分の説の例。',
      trap: 'not が弱くて「英語を話す」に聞こえやすい。最後の best friends で関係が分かる。',
      use: 'Different languages, but we get along fine.（言葉は違うけど仲がいい）' },

    // R fix: V2 (blind 65 %): "a joke" and "magic" didn't fit a reason for saving time. Both distractors are now
    //   things a person could want from few words.
    // why: get a laugh ← trick = いたずら; get his way ← trick = だます・策略
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'trick', seg: [59.8, 65.7],
      stem: 'At the end of his reason, what does Kevin say few words can do?',
      choices: ['Get the job done well enough', 'Get a laugh out of people',
                'Get people to do what he wants'], a: 0,
      cue: '「when few word」のあと、最後の二語。',
      line: 'why waste time say lot word when *few word do trick*?',
      said: '「少ない言葉で用が足りるのに、なぜ多く言う？」と言う。',
      mean: 'do the trick ＝ 用が足りる、効く。the を落とした片言でも決まり文句。',
      trap: 'trick を「いたずら」「策略」と取りやすい。do the trick は「それで足りる」。',
      use: 'A little salt should do the trick.（塩を少し入れればいけるはず）' },

    // R fix: V2 (blind 75 %): "Softening" was the only nuanced choice. The key is plainer, and "admitting his point" is
    //   a concession reading (日本語の「おっしゃる通り」).
    // why: thanks for help ← "appreciate" = 感謝, and he was asked to fetch papers; concedes ← "what you're trying to
    //   do" heard as agreement
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'appreciate', seg: [65.3, 69.8],
      stem: 'What is the coworker doing by opening with “Kevin, I appreciate…”?',
      choices: ['Setting up an objection to come', 'Admitting his point before agreeing',
                'Thanking him for help with the papers'], a: 0,
      cue: '名前を呼んだあとの一言と、その後に続く話。',
      line: 'Kevin, *I appreciate what you’re trying to do*.',
      said: '「ケビン、やろうとしていることは分かるよ」と切り出す。',
      mean: '反対の前置き。相手の意図を認めてから、だめな理由を言う型。',
      trap: 'appreciate を「感謝」「賛成」と取りやすいが、このあとに反対が来る型。',
      use: 'I appreciate the offer, but I’ll pass.（申し出はうれしいけど、遠慮しとく）' },

    // anchor: 65.8–69.2 s "I appreciate what you're trying to do" gets "Thank." at once; 70.2–74.4 s the coworker goes on
    //   to the objection ("word code… dress code"): the opener was a set-up, and Kevin answered it as praise
    // why: ready to argue ← he does argue later, so it seems he saw the "but" coming; sarcasm ← the one-word "Thank"
    //   heard as cold
    { id: 'c2', skill: 'pragma', level: 'C2', point: 'appreciate', seg: [65.3, 74.6],
      stem: 'From Kevin’s one-word reply, how does he take “I appreciate…”?',
      choices: ['As real praise for his idea', 'As the start of a no, and gets ready',
                'As sarcasm, and answers it coldly'], a: 0,
      cue: '前置きの直後の一語と、そのあと同僚が続ける話。',
      line: 'I appreciate what you’re trying to do. — *Thank.* — Here, we have a *word code*.',
      said: '「やろうとしていることは分かる」に一語で「ありがと」。同僚はそのまま規則の話に入る。',
      mean: 'お礼はほめ言葉への返事。反対の前置きを、本物のほめ言葉と受け取った。thank you まで削るのもおかしい。',
      trap: '短い返事は冷たく聞こえやすい。返事がお礼なら、相手の言葉をほめ言葉と受けている。',
      use: 'I appreciate it, but there’s a catch.（ありがたいけど、問題があってね）' },

    // R fix: V2 (blind 80 %): "they are worried" was a filler. "The time saved is tiny" is said ("microscopic"), and
    //   Kevin answers it ("many small time make big time").
    // why: rule ← "word code" heard as a rule that ends it; tiny saving ← "microscopic amount of time" is said
    { id: 'g2', skill: 'gist', level: 'B2', point: 'scene', reveals: ['normal', 'method'], seg: [65.3, 135.0],
      stem: 'What finally gets Kevin to give up his new way of talking?',
      choices: ['A mix-up shows it costs more time', 'A coworker shows the time saved is tiny',
                'A coworker says there is a rule against it'], a: 0,
      cue: '「Fine, fine」の直前に何があったか。',
      said: '規則の話にも言い返したが、see world の件で時間がかかったと言われ、折れる。',
      mean: '決め手は規則ではなく、「時間の節約」という理屈が崩れたこと。',
      trap: '規則や「節約はわずか」の話でも折れず、言い返している。決め手は直前の一件。',
      use: 'Okay, you’ve convinced me.（分かった、納得したよ）' },

    // R fix: V2 (blind 85 %): only the key held the comparison's odd image (underwear). The key is paraphrased, and
    //   the distractors are rewritten so they read as real points.
    // why: fine if dressed well ← "dress code" is said, so heard as a point about clothes; new rule ← "we have a word
    //   code" taken as something still to come
    { id: 'i3', skill: 'infer', level: 'B2', point: 'code', seg: [69.6, 83.4],
      stem: 'What is the coworker’s comparison saying about Kevin’s speech?',
      choices: ['It is as out of place as coming in half-dressed', 'It is fine as long as he dresses well for work',
                'It will soon be banned by a new office rule'], a: 0,
      cue: '「dress code」と並べたあと、何にたとえるか。',
      line: 'a *word code*, the same way we have a *dress code*… the speech equivalent to just wearing *underpants*.',
      said: '服装規定があるように言葉の規定もある。彼の話し方は下着だけで来るようなもの、と言う。',
      mean: '服にふさわしさがあるように、職場の言葉にもある。今の話し方は度を越している。',
      trap: 'dress code が聞こえると服の話と取りやすいが、たとえに使っているだけ。',
      use: 'There’s an unwritten rule here.（ここには暗黙のルールがある）' },

    // R fix: V2 (blind 50 %, right): "a different topic" was a filler. "Real interest" reads the question as sincere;
    //   the "Because…" that follows refutes it.
    // why: even if ← though = 〜だけれども, read as a conjunction; real interest ← a question read as a sincere question
    { id: 'm1', skill: 'marker', level: 'B2', point: 'though', reveals: ['hour'], seg: [93.4, 96.7],
      stem: 'What does “though” at the end of the coworker’s question signal?',
      choices: ['Doubt about what Kevin just said', 'Real interest in how much he saves',
                'A link to a condition that follows'], a: 0,
      cue: '「save time」のすぐあと、問いの最後の一語。',
      line: 'Does it save time, *though*? Because we’ve been here for about an hour.',
      said: '「でも本当に時間の節約になってる？もう1時間近くここにいるよ」と言う。',
      mean: '文末の though ＝「でもさ」。相手の主張に疑問を投げる。',
      trap: 'though を「〜だけれども」とつなぎの語に取りやすい。文末なら「でも実際は？」。',
      use: 'It’s cheap. Is it any good, though?（安いけど、実際いいの？）' },

    // why: half an hour ← "an hour" with "about" heard as a hedge for less; two hours ← "about" heard as "a couple"
    { id: 'n1', skill: 'number', level: 'B1', point: 'hour', seg: [93.4, 96.7], keep: true,
      stem: 'How long does the coworker say they have been there?',
      choices: ['About ten minutes', 'About half an hour', 'About an hour', 'About two hours'], a: 2,
      cue: '「Because」のあと、最後の数語。',
      line: 'we’ve been here for *about an hour*.',
      said: '「もう1時間くらいここにいる」と言う。',
      mean: '節約どころか、話が通じなくて時間がかかっている、という指摘。',
      trap: 'about an hour は「アバウタナウア」とつながり、an が聞こえにくい。',
      use: 'We’ve been waiting for about an hour.（1時間くらい待ってる）' },

    // R fix: V2 + §9.5 (blind 50 %): "SeaWorld" didn't fit "time to ___", and "see a world" isn't real English. Now
    //   every choice fits the gap.
    // why: see SeaWorld ← the weak "the" heard as "Sea"; the whole world ← the idiom filled in from memory
    { id: 's1', skill: 'sound', level: 'B2', point: 'seeworld', seg: [110.4, 113.55],
      stem: 'Fill the gap: “You can’t possibly save enough time to ___.”',
      choices: ['see the world', 'see SeaWorld', 'see the whole world'], a: 0,
      cue: '「enough time to」のあと、二つ目の語の弱い音。',
      line: 'You can’t possibly save enough time to *see the world*.',
      said: '「世界を見て回るほどの時間なんて、節約できるわけない」と言う。',
      mean: 'the は弱く「ザ」より短い。see the world は「スィーザワールド」。',
      trap: 'the は短く弱いので、消えたように聞こえやすい。消えると次の笑いの種になる。',
      use: 'I want to see the world someday.（いつか世界を見て回りたい）' },

    // R fix: V2 (blind 90 %): "mixes up two places" was weak. The new distractor is Kevin's word list ("oceans, fish,
    //   jump, China"), heard just before "right there".
    // why: wanders off ← the word list comes right before "right there"; too big a plan ← "can't possibly save enough
    //   time" from just before
    { id: 'h3', skill: 'humor', level: 'C1', point: 'method', reveals: ['seeworld'], seg: [117.2, 131.4],
      stem: 'Why does the coworker say “right there” is the problem?',
      choices: ['His short answer can mean two things, so it costs time',
                'His list about oceans and fish wanders off the point',
                'His plan to travel is far too big for the time he saves'], a: 0,
      cue: '「right there」のあと、話し方の何が問題か。',
      line: 'I still don’t know if you’re saying *see world or see the world*… it’s *taken a lot of time to explain* it.',
      said: '「どちらの意味か、まだ分からない。説明にも時間がかかった」と言う。',
      mean: '短く言ったせいで意味が二つになり、かえって時間がかかった。彼の説が崩れる。',
      trap: '直前に並べた単語を責めたと取りやすいが、問題は意味が二つあること。method を聞く。',
      use: 'See, that’s exactly my point.（ほら、まさにそれが言いたいの）' },

    // R fix: V2 (blind 75 %): "Furious; he storms off" was a filler; "Convinced" is the sincerity flip. V5: the double
    //   "fine" is an attitude signal (B2), not an explicit word.
    // why: relieved ← "fine" = 元気・よい; convinced ← "I'll talk normally" taken at face value
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'normal', seg: [131.3, 135.0],
      stem: 'How does Kevin sound when he agrees to change?',
      choices: ['Grudging; he gives in', 'Convinced; he sees their point', 'Relieved; he is glad'], a: 0,
      cue: '同じ語を二回言う、その言い方。',
      line: '*Fine, fine.* I’ll talk normally.',
      said: '「分かった分かった。普通に話すよ」と言う。',
      mean: 'Fine, fine はしぶしぶの承知。納得したわけではない。',
      trap: 'fine を「よい」と取ると喜んでいるように聞こえる。くり返しは不満の合図。',
      use: 'Fine, fine, you win.（はいはい、君の勝ち）' },

    // anchor: 131.8–134.4 s "Fine, fine. I'll talk normally."; then to camera 135.4–141 s "When me president, they see":
    //   the short style is back at once, and "they see" says he'll be proved right
    // R fix: V2 (blind 75 %): "run for office" was easy to rule out. The new distractor gives in for now too but reads
    //   him as hurt; "they see" (he'll be proved right) refutes it.
    // why: real change ← "I'll talk normally" taken at face value; hurt ← the to-camera aside heard as sulking
    { id: 'c1', skill: 'infer', level: 'C2', point: 'normal', seg: [131.3, 141.6],
      stem: 'After his comment to the camera, how should we hear “I’ll talk normally”?',
      choices: ['As giving in for now, still sure he is right', 'As a real change of mind about his method',
                'As giving in for now, but hurt by their teasing'], a: 0,
      cue: '約束のすぐあと、カメラに向けた一言の話し方。',
      line: 'I’ll talk normally. … *When me president, they see.*',
      said: '「普通に話す」と言ったすぐあと、カメラに「僕が大統領になったら、みんな分かる」と片言で言う。',
      mean: 'カメラへの一言が場面を書きかえる。片言に戻り「いつか分かる」と言う。折れたのは表向きだけ。',
      trap: 'カメラへの一言をすねていると取りやすいが、they see は「いつか分かる」という自信。',
      use: 'Fine. But one day, you’ll see.（いいよ。でもいつか分かるさ）' },
  ]
};
