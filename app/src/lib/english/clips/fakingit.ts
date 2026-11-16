// “Deep Down Everyone is Faking It | Parks and Recreation” (the official Parks and Recreation channel, Season 2
// playlist): Andy, home from his London job, tells April work is going great; April tells the camera she's proud of
// him, then finds him hiding in a dumpster. He admits he's in over his head; April tells him nobody knows what they're
// doing and everyone fakes it until they figure it out. A loving goodbye (cookie sandwiches), then he's back in the
// dumpster with a wallet excuse.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 174 s; music after (whisper's 180–194 s
// "I'm not a fan of the world" is a hallucination over music). Names said: Andy (50.7, 66.0, 68.3, 162.2 s), Mr. Dwyer
// (89.9–93.3 s, quoted). April's name is never said; stems use it where the turn settles who speaks (she runs animal
// control, 117 s; she makes the sandwiches for the one going to the airport, 144–147 s). Untested on purpose: 0–11 s
// (the "brilliant" bit; captions "uh watch this", whisper "Whoa"), 15.7 s (captions "it's awesome", whisper "that's
// awesome"), 26–33 s (a making-out line), 44.5–46 s ("See you on stupid Skype": speaker never named), 78.3 s (captions
// "cause uh", whisper "because": not key words), 92–93 s ("That's not a toilet": bodily), 100.7 s (captions "the
// beard", whisper "a beard"), 144.7 s (five sandwiches: memory of a detail), 170–174 s (noodles).
// REVIEW 2026-11-16: pass 7, fix 15, drop 2, new 1; ear checks 0
// REVIEW: s1 and x1 came off the ear-check list: both sources agree on the words (GUIDE §9.7).
import type { Clip } from '../types.ts';

export const fakingIt: Clip = {
  id: 'fakingit', video: 'E27kSCBUIWc', title: 'Deep Down Everyone is Faking It', dur: 194, wpm: 171,
  band: 'mid', tags: ['恋愛', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 75 % (the only upbeat choice); now three upbeat claims, told apart by what he actually says
    // why: team ← "kicking ass" heard as being liked at work; learning ← "Do you still love it?" heard as a newcomer's
    //   question, so the usual "still learning but loving it" script
    { id: 'g1', skill: 'gist', level: 'B2', point: 'front', seg: [2.5, 25.0],
      stem: 'When April asks about work, how does Andy say it’s going?',
      choices: ['He loves it, and he’s doing really well', 'He loves it, and the team loves him',
                'He loves it, and he’s learning a lot'], a: 0,
      cue: '「love it?」への返事と、自分をたとえる人物。',
      line: 'Do you still love it? — Yeah… *I’m kicking ass*.',
      said: '仕事はまだ好きかと聞かれ、「絶好調。チャック・ノリスみたい」と答える。',
      mean: 'kick ass ＝ すごくうまくやっている。この時点では、仕事は順調だと見せている。',
      trap: 'kick ass は「うまくやっている」。評判や学びの話はしていない。',
      use: 'Work’s going great, thanks.（仕事は順調だよ、ありがとう）' },

    // R drop: nt3 (C2 attitude, never shipped): S4/V1, its key rests on the confession at 84–97 s, outside its
    //   segment (11.5–24.6 s), so it tests memory of a later scene; and V2, blind 70 % (the title gives it). Replaced by nt4.

    // R fix: V2, blind 70 % (the only mundane landing); all three now land on something at work
    // why: rivals ← "crushing it" (= doing great) heard as crushing coworkers, with "kicking ass" just before; his fears ←
    //   his later "scared and confused" (104 s) carried back
    { id: 'h1', skill: 'humor', level: 'C1', point: 'norris', seg: [17.0, 24.6],
      stem: 'Why is Andy’s comparison to a tough action star funny?',
      choices: ['It builds up a fighter, then lands on desk work', 'It builds up a fighter, then lands on his rivals',
                'It builds up a fighter, then lands on his fears'], a: 0,
      cue: '「instead of」の前後で、何が入れかわるか。',
      line: 'only instead of crushing bad guys’ skulls, *I’m crushing documents*.',
      said: '「悪党の頭を砕く代わりに、書類を砕いてる」と言う。',
      mean: '強い動詞 crush をそのまま書類に使い、ヒーロー像が事務仕事に落ちるのが笑い。',
      trap: 'crushing it（絶好調）から同僚の話に聞こえやすい。instead of のあとを聞く。',
      use: 'I’m basically a superhero, only with spreadsheets.（要はヒーロー、ただし表計算の）' },

    // R fix: V2, blind 55 % ("wrong fact" stood out); the choices now all name what follows the promise
    // why: distance ← "not the same moon" heard as "we'll be far apart", the London line just before; dig at London ←
    //   "go back to London" (35 s) and the flat "obviously" heard as a jab
    { id: 'h2', skill: 'humor', level: 'C1', point: 'moon', seg: [36.2, 44.4],
      stem: 'Why does the goodbye line about the moon get a laugh?',
      choices: ['A sweet promise gets a needless, false correction', 'A sweet promise gets a gloomy note about distance',
                'A sweet promise gets turned into a dig at London'], a: 0,
      cue: '「a moon」と、そのあとの obviously。',
      line: 'I too will be looking at *a moon*. *Not the same moon, obviously*…',
      said: '「月を見るたび、僕もある月を見てる。同じ月じゃないよ、当然」と言う。',
      mean: 'the moon を a moon に変え、真顔で「同じ月は無理」と訂正。月は一つなので台無し。',
      trap: '距離の寂しさに聞こえやすいが、距離の話はない。the と a の差を聞く。',
      use: 'Think of me when you see the moon.（月を見たら私を思い出して）' },

    // R fix: V2, blind 50 %; distractors now built on "first time" and "out"
    // why: standing up for himself ← "the first time he's really…" heard as a first act of nerve; out of his way ←
    //   "gone out" heard as "gone out of his way" (無理して人のために)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'limb', seg: [49.5, 59.5],
      stem: 'In her talk to the camera, what does April praise Andy for?',
      choices: ['Taking a real risk for once', 'Going out of his way for others',
                'Standing up for himself for once'], a: 0,
      cue: '「first time」のあとの決まった言い方。',
      line: 'This is the first time he’s really *gone out on a limb*.',
      said: '「本当に思い切ったのは初めて」とカメラに話す。',
      mean: 'go out on a limb ＝ 枝の先に出る、つまり思い切って挑戦する。',
      trap: 'gone out から go out of one’s way を思いやすい。on a limb までで一つ。',
      use: 'I went out on a limb and applied.（思い切って応募してみた）' },

    // R drop: nt1 (C2 infer, never shipped): S4/V1, nothing said in 49.5–69.6 s shows the step has stalled (that
    //   comes at 84 s, or from the picture of the dumpster); and V2, blind 70 %. Replaced by nt4.

    // R fix: V2, blind 55 % (the only "explains nothing" choice); now three ways the answer could misfire
    // why: forgets the lie ← the stammered "I was just… just" heard as a story he loses halfway; pool ← "jumped in" is
    //   what you say of a pool
    { id: 'h3', skill: 'humor', level: 'C1', point: 'jumped', seg: [74.8, 81.7],
      stem: 'Why is Andy’s answer about being in the dumpster funny?',
      choices: ['He gives a reason that explains nothing', 'He starts a lie and forgets it halfway',
                'He talks about the dumpster like a pool'], a: 0,
      cue: 'ゴミ箱にいるわけを言う部分に、新しい情報があるか。',
      line: 'I was just… just here in this dumpster, *because I jumped in*.',
      said: '「ちょっと…このゴミ箱にいただけ。飛び込んだから」と言う。',
      mean: '「なぜいるか」に「入ったから」と返しても、何も説明していない。言い訳が出てこない。',
      trap: '言いよどみや jumped in に引かれやすい。because のあとに新しい情報があるか聞く。',
      use: 'Why am I here? Because I came.（なぜいるかって？来たからだよ）' },

    // R fix: V2, blind 75 % ("finally opens up" cued a confession); the stem no longer says so, and "under control"
    //   is the literal reading of "over"
    // why: under control ← "over my head" read as "on top of it" (上に立つ); all he thinks about ← "over my head" heard
    //   as "in my head"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'overhead', seg: [83.8, 93.7],
      stem: 'Out of the dumpster, how does Andy describe the project?',
      choices: ['As far more than he can handle', 'As something he has fully under control',
                'As all he can think about lately'], a: 0,
      cue: '「totally」のあとの決まった言い方。',
      line: 'I’m *totally in over my head* on this project.',
      said: '「このプロジェクト、完全に手に負えない」と打ち明ける。',
      mean: 'in over one’s head ＝ 背が立たない深さ、つまり力を超えている。',
      trap: 'over を「上に立つ」、head を「頭がいっぱい」と取りやすい。正しくは頭の上まで水。',
      use: 'I’m in over my head with this.（これ、手に負えない）' },

    // why: explain ← "I need your…" heard as a request for help; documents ← "crushing documents" from earlier
    { id: 'd1', skill: 'detail', level: 'B1', point: 'sign', seg: [86.2, 93.7],
      stem: 'What do people come to Andy for every day?',
      choices: ['To approve and sign things', 'To explain how things work', 'To check and fix documents'], a: 0,
      cue: '「I need your」のあとの語、2回分。',
      line: 'I need your *approval* on this… I need your *signature*, Mr. Dwyer.',
      said: '毎日だれかが来て「承認をください」「署名をください」と言う、と話す。',
      mean: '決める立場の責任者になっている。でも決める自信がない、というのが本音。',
      trap: '前に書類の話が出たので「書類を直す」に引かれやすい。I need your のあとの名詞を拾う。',
      use: 'I just need your signature here.（ここに署名だけお願いします）' },

    // R fix: V2, blind 65 %; the stem leaked "admits he's struggling" (f2's key), and "lying on purpose" was absurd
    // why: reminds him ← "awesome" and "Chuck Norris" are upbeat words, heard as encouragement (the Japanese 励まし frame);
    //   guessed all along ← "But you said…" heard as "I knew it"
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'said', reveals: ['front'], seg: [93.7, 99.6],
      stem: 'After Andy describes his days at work, what does April’s reply do first?',
      choices: ['It notes this clashes with what he told her', 'It reminds him how well he was doing',
                'It says she had guessed this all along'], a: 0,
      cue: '「But you said」が2回。何と何を比べている？',
      line: '*But you said* everything was going awesome. *You said* you were like Chuck Norris.',
      said: '「でも、全部最高だって言ってたじゃない。チャック・ノリスみたいだって」と返す。',
      mean: '前の話と今の話の食い違いを指摘し、説明をうながす。責めるより確かめている。',
      trap: '明るい語は励ましに聞こえやすい。But you said は「前と違う」の合図。',
      use: 'But you said it was fine!（でも大丈夫って言ってたよね！）' },

    // why: still learning ← "scared and confused about his big London job" heard as a newcomer's nerves; best but tired
    //   ← "I am" heard as a yes, the "now" lost
    { id: 'i1', skill: 'infer', level: 'B2', point: 'now', reveals: ['said'], seg: [95.7, 107.85],
      stem: 'When April brings up the tough-guy comparison, how does Andy update it?',
      choices: ['He’s like the star now: past his best', 'He’s like the star at first: still learning',
                'He’s like the star at his best, only tired'], a: 0,
      cue: '「I am, but」のあとの短い一語。',
      line: 'I am, but I’m like Chuck Norris *now*. Some old guy… who *used to be good* at karate…',
      said: '「そうだよ、でも今のチャック・ノリス。昔は空手が強かった、ひげのおじさん」と言う。',
      mean: 'now の一語で、全盛期でなく今の彼にたとえ直す。もう勢いはない、という自虐。',
      trap: 'I am から「強いまま」と取りやすい。but のあとの now が逆にする。',
      use: 'I used to be good at this.（昔はこれ、得意だったんだけど）' },

    // C2 dict: a non-standard form that grammar would "fix" (him and me)
    // anchor: 108.24–110.4 s both sources have "the parallels between he and I are very eerie"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'eerie', seg: [107.7, 111.0],
      stem: 'Type what Andy says: “The parallels between ___ are very eerie.” (3 words)', answer: 'he and i',
      cue: '「between」のあと。文法より、聞こえた音を。',
      line: 'The parallels between *he and I* are very eerie.',
      said: '「彼と僕の共通点、すごく不気味」と言う。he はチャック・ノリス。',
      mean: '文法どおりなら between him and me。会話では he and I もよく聞く。',
      trap: '文法から him and me と書きたくなる。正しい文でなく、聞こえた形を書く。',
      use: 'Between you and I, it’s a mess.（ここだけの話、ひどいよ）' },

    // R fix: V2, blind 50 % ("not gonna" was out by sense); "I'll" replaces it, as natural a start as the key
    // why: wanna ← "gonna" and "wanna" differ only in one blurred first sound; I'll ← the "I'm" shrinks to one short
    //   vowel, and "I'll tell you a secret" is just as common; gotta ← the flapped middle sound, close to "gotta"
    { id: 's1', skill: 'sound', level: 'B2', point: 'gonna', seg: [110.9, 114.4],
      stem: 'Fill the gap: “___ tell you a secret about everyone else’s job.”',
      choices: ['I’m gonna', 'I wanna', 'I’ll', 'I gotta'], a: 0,
      cue: '文頭、二語がつながって短く聞こえる部分。',
      line: '*I’m gonna* tell you a secret about everyone else’s job.',
      said: '「みんなの仕事について、秘密を教えてあげる」と切り出す。',
      mean: 'I’m going to が縮み、「アムガナ」のようにつながる。',
      trap: 'wanna と gonna は頭の音だけの差。I’ll なら「アイル」で、ガの音がない。母音のあとの g を聞く。',
      use: 'I’m gonna tell you something.（ちょっと言っておくね）' },

    // R fix: V2, blind 75 % (the only hopeful choice); the distractors now come from things she said
    // why: quit and stay ← "I don't want you to go back to London" (35 s) carried onto the pep talk; needs his help ←
    //   "I don't know how to run…" heard as her own cry for help
    { id: 'g2', skill: 'gist', level: 'B2', point: 'advice', reveals: ['figure'], seg: [110.9, 135.6],
      stem: 'Why does April tell Andy about her own job?',
      choices: ['So he sees he’ll find his feet, like everyone', 'So he sees he could quit and stay home with her',
                'So he sees she struggles too and needs his help'], a: 0,
      cue: '「faking it」のあと、文がどこまで続くか。',
      line: 'No one knows what they’re doing… faking it *until they figure it out*.',
      said: '誰も分かっていない、私もそう、みんな分かるまでふりをしてる、と話す。',
      mean: '迷うのは一時のことで、いずれ分かる。だから Andy も戻れる、と伝えている。',
      trap: '前の「戻らないで」を持ちこみやすい。結論は until 以下と you will too。',
      use: 'Fake it till you make it.（できるまで、できるふりを）' },

    // R fix: V2, blind 70 % (the only kind choice, and the only two-part one); three parallel purposes now
    // why: joke ← shredding boring documents sounds like a gag; warning ← "everyone else's job" and "no one knows what
    //   they're doing" heard as about his London coworkers
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'secret', reveals: ['run'], seg: [110.9, 122.95],
      stem: 'How does April mean her “secret” about everyone’s job?',
      choices: ['As comfort, using herself as an example', 'As a warning not to rely on his coworkers',
                'As a joke, so he can laugh the job off'], a: 0,
      cue: '「No one」のあと、主語が「私」に変わる。',
      line: 'No one knows what they’re doing. *I don’t know how to run* an animal control department.',
      said: '「誰も分かってない。私も動物管理課の運営の仕方なんて知らない」と打ち明ける。',
      mean: '自分の弱みを例に、Andy の不安は普通だと伝える。本気のはげまし。',
      trap: 'no one を彼の同僚の話と取りやすい。主語が I に変わり、自分を例にする。',
      use: 'Honestly, nobody knows what they’re doing.（正直、誰も分かってないよ）' },

    // why: animals ← "animal" is said, in the department's name; documents ← the next line about shredding documents
    { id: 'd2', skill: 'detail', level: 'B1', point: 'run', seg: [114.3, 119.3],
      stem: 'What does April say she doesn’t know how to do?',
      choices: ['Run the department she is in charge of', 'Look after the animals she works with',
                'Read the documents she gets each day'], a: 0,
      cue: '「I don’t know how to」のあとの動詞。',
      line: 'I don’t know how to *run* an animal control department.',
      said: '「動物管理課の運営の仕方なんて分からない」と言う。',
      mean: 'run ＝ 運営する・仕切る。走るではない。責任者なのに分からない、と認めている。',
      trap: 'animal が耳に残り、動物の世話と取りやすい。run のあとは組織の名前。',
      use: 'Who runs this place?（ここの責任者は誰？）' },

    // why: a few ← the short "half" lost before "the"; most / all ← "because they're so boring" heard as a reason to
    //   shred everything
    { id: 'n1', skill: 'number', level: 'B1', point: 'half', seg: [118.95, 122.95], keep: true,
      stem: 'How many of her documents does April put into the shredder?',
      choices: ['A few', 'Half', 'Most', 'All of them'], a: 1,
      cue: '文の最初、documents の前の一語。',
      line: '*Half the documents* I get, I put right into the shredder…',
      said: '「届く書類の半分は、退屈すぎてそのままシュレッダー行き」と言う。',
      mean: 'half the ＝ 〜の半分。of がなくても言える。責任者でもいいかげん、という告白。',
      trap: 'half は「ハフ」と短く、the とつながって消えやすい。文頭の量の一語を聞く。',
      use: 'Half the time, I’m just guessing.（半分くらいは勘でやってる）' },

    // R fix: V2, blind 60 % ("thanks him and agrees" was weak); now three nuanced replies
    // why: turns it back ← she goes on to talk about everyone, heard as aimed at him; modesty ← the Japanese 謙遜 frame,
    //   a compliment answered by playing it down, though "I seem like it" grants the look and denies the fact
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'seem', reveals: ['advice'], seg: [122.95, 130.4],
      stem: 'When Andy says she seems to know what she’s doing, what does April’s reply do?',
      choices: ['Admits it looks that way, not that it is', 'Plays down the praise to seem modest',
                'Turns the praise back around onto him'], a: 0,
      cue: '「Yeah」のあと、相手の動詞をくり返す。',
      line: 'But you seem like you do know… — Yeah, *I seem like it*.',
      said: '「分かってるように見える」に「うん、そう見えるよね」と返し、みんなふりをしてると続ける。',
      mean: 'seem を返して「見えるだけ」と認める。yeah は見た目への同意。',
      trap: '謙遜の「いえいえ」に聞こえやすいが、yeah で見た目は認めている。',
      use: 'I look calm, right? I’m not.（落ち着いて見える？全然だよ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'figure', seg: [126.6, 130.5],
      stem: 'Type what April says: “everyone is just faking it until they ___.” (3 words)', answer: 'figure it out',
      cue: '「until they」のあと、つながる三語。',
      line: 'Deep down, everyone is just faking it until they *figure it out*.',
      said: '「心の底では、みんな分かるまでふりをしているだけ」と言う。',
      mean: 'figure it out ＝ やり方が分かる。三語がつながり「フィギュリラウ」に近い。',
      trap: 'it の t が弾んで「リ」になる。figure out と書きやすいが、間に it がある。',
      use: 'Don’t worry, you’ll figure it out.（大丈夫、そのうち分かるよ）' },

    // R fix: V2, blind 60 % ("but warmly meant" was the only nuanced choice); all three now pair a manner and a motive
    // R new: nt4 replaces nt1 and nt3 (C2 minimum 2). Blind (fresh read of stem + choices): no pick above 40 %.
    // anchor: 127.0–129.8 s "everyone is just faking it until they figure it out", then 132.0 s "And you will too":
    //   "will" can only stand for "will figure it out" (the "is faking it" clause would give "and you are too")
    // why: keep faking ← "faking it" is the louder, nearer-sounding chunk, and many hear "you will too" as "you'll fake
    //   it too"; bored ← her shredder line about boring documents (121 s) carried on
    { id: 'nt4', skill: 'infer', level: 'C2', point: 'figure', reveals: ['advice'], seg: [126.6, 135.6],
      stem: 'What exactly does April predict for Andy with “And you will too”?',
      choices: ['That he will work it out too', 'That he will keep faking it too', 'That he will get bored of it too'], a: 0,
      cue: '直前の文の、どの動詞を受けているか。',
      line: 'everyone is just faking it until they *figure it out*. — *And you will too.*',
      said: '「みんな分かるまでふりをしてるだけ」に「あなたもそうなる」と続ける。',
      mean: 'will が受けるのは figure it out。faking なら you are too になる。いずれ分かると言い切る。',
      trap: 'faking it が耳に残りやすい。省略は助動詞の形で、受ける語が決まる。',
      use: 'I passed, and you will too.（私も受かったし、あなたも受かるよ）' },

    // why: teasing ← an over-the-top compliment heard as irony; bored ← April's flat delivery heard as not caring
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'awesome', seg: [131.5, 135.6],
      stem: 'How does April’s last reason for him come across?',
      choices: ['Over the top, but sincere', 'Flat, as if bored by his worries', 'Teasing, poking fun at his ego'], a: 0,
      cue: '「And you will too」から続く流れ。',
      line: 'And you will too. Because *you are awesome* and *everyone else sucks*.',
      said: '「あなたもできる。だってあなたは最高で、ほかはみんなダメだから」と言う。',
      mean: '大げさで乱暴だが、中身は本気の応援。ほかを下げて Andy を持ち上げる。',
      trap: '大げさなほめ言葉は皮肉に聞こえやすい。直前の you will too が本気の合図。',
      use: 'You’ve got this. You’re the best.（大丈夫、あなたが一番）' },

    // R fix: V2, blind 55 %; "only joking about going" was weak
    // why: stop joking ← "for real" heard as "are you for real?"; for good ← "for real" heard as "for good" (永遠に)
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'forreal', seg: [137.5, 141.0],
      stem: 'What does the wording of the goodbye after April’s pep talk suggest?',
      choices: ['They already tried to say goodbye', 'He is going away for good this time',
                'He wants her to stop joking around'], a: 0,
      cue: '「bye」のあとの二つの語句。',
      line: 'Okay, bye *for real this time*.',
      said: '「じゃあ、今度こそ本当にバイバイ」と言う。',
      mean: 'for real ＝ 本当に、this time ＝ 今度こそ。前にも別れを言いかけた、ということ。',
      trap: 'for real を「永遠に」と取りやすい。this time が「前にもあった」の合図。',
      use: 'Okay, I’m leaving for real this time.（じゃあ、今度こそ本当に帰るね）' },

    // why: crackers ← the k- start and two syllables, close to "cookies"; bagels ← "bologna" heard just before, the same
    //   b- start
    { id: 'd3', skill: 'detail', level: 'B1', point: 'cookies', seg: [143.7, 150.45],
      stem: 'What did April make the sandwiches with instead of bread?',
      choices: ['Cookies', 'Crackers', 'Bagels'], a: 0,
      cue: '「I used」のあとの語。',
      line: 'Yes, I used *cookies instead of bread*.',
      said: '空港への道で食べるサンドイッチを作り、「パンの代わりにクッキー」と言う。',
      mean: 'パンでなくクッキーで挟んだ、ちょっと変なサンドイッチ。彼女なりの愛情。',
      trap: '直前の bologna の b の音が残りやすい。used のあとの名詞を聞く。',
      use: 'Can I get rice instead of fries?（ポテトの代わりにライスにできる？）' },

    // R fix: V2, blind 55 %; the stem named the cookies (d3's key), and the choices are now parallel
    // why: polite ← the Japanese 建前 frame: praise for an odd gift heard as courtesy; amused ← cookies instead of bread
    //   heard as April's joke, so his praise as playing along
    { id: 'a4', skill: 'attitude', level: 'C1', point: 'cookies', seg: [143.7, 153.9],
      stem: 'How does Andy take the sandwiches April made him?',
      choices: ['Touched, and he means every word', 'Amused, playing along with a joke', 'Polite, hiding that they’re odd'], a: 0,
      cue: '「Did you?」の声と、そのあとのほめ言葉。',
      line: 'I used cookies instead of bread. — *You think of everything.* — *I love you.*',
      said: '「パンの代わりにクッキーを使った」に、「何でも考えてくれるね。愛してる」と返す。',
      mean: '変なサンドイッチでも、Andy は本気で感動している。',
      trap: '建前の感覚だと、ほめ言葉が気づかいに聞こえる。続く I love you で本気と分かる。',
      use: 'You think of everything!（気が利くね！）' },

    // R fix: V2, blind 70 % ("making up a reason" stood alone); all three are now readings of the wallet line
    // why: just now ← "found it" heard as a fresh drop, "earlier" lost; April's ← "left… wallet" caught, "my" lost
    { id: 'i2', skill: 'infer', level: 'C1', point: 'wallet', seg: [159.9, 168.6],
      stem: 'What does Andy’s explanation at the end of the clip suggest?',
      choices: ['The wallet is an excuse he just thought up', 'He dropped his wallet in there just now',
                'The wallet was April’s, left there earlier'], a: 0,
      cue: '自分の財布の話なのに、文の最後に付く二語。',
      line: 'Found it! … I left my wallet in here earlier, *I guess*.',
      said: '「あった！さっきここに財布を忘れたみたい」と言う。',
      mean: '自分のことに I guess と付けるのは、話を作っている合図。ごまかしている。',
      trap: 'found it を信じやすい。自分の行動に I guess が付いたら言い訳を疑う。',
      use: 'I must have left it here, I guess.（ここに置き忘れたのかな）' },
  ]
};
