// “April Is the New Mouserat Member | Parks and Recreation” (the official Parks and Recreation channel, Season 3): on
// Tom's couples game show Andy and April fight over each other's favorite band, April tells Tom the fight made Andy
// sell his guitar, a "bonus round" hands Andy points for anything, he sees through it, and after the band's song a
// talking head settles it.
// Segments from the captions, words from whisper (2026-11-16). Left out: the game's sexual question and answers at
// 7–33 s (“smush ya boo”), “We're totally gonna do it later” at 184 s, the song at 123–150 s (whisper loops “I was in
// the beer”), the app plug at 60–62 s (captions “Tommy he'll figure”), the Colts question at 98–101 s, and the man the
// guitar went to (whisper “Suze Joe”, captions “sue's joe”). Andy and April are told apart by voice (his and hers) and
// by what they say; Tom is named at 3 s.
// REVIEW 2026-11-16: pass 6, fix 13, drop 0, new 0; ear checks 1
//   Open: none.
// EAR CHECK: 57.8 s a2 — “Damn! This game's got juice.” assumed to be Tom, the host (both sources have the words; no
//   name is said with it)
import type { Clip } from '../types.ts';

export const aprilMouserat: Clip = {
  id: 'mouserat', video: 'XLmDKj4XvKw', title: 'April Is the New Mouserat Member', dur: 209, wpm: 156, band: 'mid',
  tags: ['恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %, right) and K6: the title points at bands, and the key was the only band choice and the
    //   only two-sided one; now one distractor is two-sided and one names a band
    // why: singer ← "some other dude's band more than me" heard as jealousy over the dude; embarrassing answer ← she
    //   called the game's question gross just before, and his answer is a jab
    { id: 'g1', skill: 'gist', level: 'B2', point: 'bands', reveals: ['mouserat'], seg: [32.9, 57.4],
      stem: 'What is the argument between Andy and April really about?',
      choices: ['Each thinks the other doesn’t respect their favorite band',
                'He thinks she likes another band’s singer more than him',
                'Each thinks the other gave an embarrassing answer on the show'], a: 0,
      cue: '二人がそれぞれ相手に言う、不満の中身。',
      said: '彼は「ほかの男のバンドが好きなんだろ」、彼女は「頼んでも聴いてくれない」と言う。',
      mean: '好きなバンドを相手が認めてくれない、という不満のぶつけ合い。',
      trap: 'other dude を聞くと恋のやきもちに聞こえやすい。dude のあとの band まで聞く。',
      use: 'You never even listened to it!（一度も聴いてくれなかったじゃない！）' },

    // R fix: V2 (blind 80 %, right): "showing off" was weak; now "give a real answer", since his answer is a jab. The
    //   idiom itself is the construct, so some guessability stays
    // why: next question ← "Let's move to the next question" is the host's line in this game; real answer ← his
    //   answer names her band as a jab, so she seems to ask for a proper one
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'overit', reveals: ['mouserat'], seg: [32.9, 36.5],
      stem: 'When April says “Ugh, get over it,” what is she telling Andy?',
      choices: ['To stop being upset about it', 'To move on to the next question', 'To give a real answer this time'],
      a: 0,
      cue: '直後に彼が同じ言葉を言い返すところ。',
      line: 'Ugh, *get over it*. — No, you get over it. You like some other dude’s band more than me.',
      said: '「もういいでしょ」に、彼は「そっちこそ」と返し、ほかのバンドの話を出す。',
      mean: 'get over it ＝ いつまでも気にしないで。相手のこだわりを切る言い方。',
      trap: 'over を「次へ」と取るとゲームの話に聞こえる。言い返しの中身で分かる。',
      use: 'It was one bad game. Get over it.（1試合負けただけ。引きずらないで）' },

    // R fix: V2 (blind 60 %, right): "rank the best bands" was weak; now "teasing her", since his line follows his jab
    // why: teasing ← it comes right after his Neutral Milk Hotel jab, so it sounds like more of the same; heard his band
    //   ← "even" missed, so it sounds like a check on whether she knows the band
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'mouserat', reveals: ['notfeel'], seg: [35.15, 39.9],
      stem: 'What is Andy’s question about Mouse Rat really doing?',
      choices: ['Complaining that she doesn’t back his band', 'Teasing her about her own taste in bands',
                'Checking whether she has heard his band'], a: 0,
      cue: '質問のあとに付け足す「cause…」の文。',
      line: 'Do you *even* think that Mouse Rat is the greatest band in the world? ’Cause *it’s starting to not feel that way*.',
      said: '「マウス・ラットが世界一だって、本当に思ってる？そうは感じられなくなってきた」と言う。',
      mean: 'even 入りの質問は答えを求めず、「思ってないだろ」という不満。',
      trap: '疑問文なので本当に聞いていると取りやすい。even と、あとの理由の文で文句だと分かる。',
      use: 'Do you even like my cooking?（そもそも私の料理、好きなの？）' },

    // anchor: 38.4–39.4 s “’cause it’s starting to not feel that way” in both sources: “to not”, not “not to”
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'notfeel', seg: [37.55, 39.9],
      stem: 'Type what Andy says: “’Cause it’s ___ that way.” (4 words)', answer: 'starting to not feel',
      cue: '「in the world?」の直後。文法より聞こえた順で。',
      line: '’Cause it’s *starting to not feel* that way.',
      said: '「だって、そう感じなくなってきた」と付け足す。4語がひと続きで速い。',
      mean: '教科書なら not to feel だが、会話では to not feel もよく言う。not が動詞の直前で目立つ。',
      trap: '習った語順に直して not to と書きたくなる。語順は音のまま書く。',
      use: 'I’m starting to not care anymore.（もうどうでもよくなってきた）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'listen', seg: [40.9, 44.5],
      stem: 'Type what April says: “I’ve asked you to ___ like a million times.” (3 words)',
      answer: 'listen to them',
      cue: '「asked you to」のあと、like の前。',
      line: 'I’ve asked you to *listen to them* like a million times, and you never have.',
      said: '「何百回も聴いてって頼んだのに、一度も聴いてない」と言う。',
      mean: 'listen の t は読まない。to は「タ」、them は弱く短い。',
      trap: 'to them が弱くつながり、一語に聞こえやすい。listen のあとは to が来ると覚えておく。',
      use: 'You have to listen to this song.（この曲、絶対聴いて）' },

    // R fix: V2 (blind 55 %, right): the key was the only choice about the music; now a near miss with other adjectives
    // why: slow and dull ← the same kind of complaint, so only the adjectives settle it; the singer ← "some other
    //   dude" heard as a man she likes
    { id: 'd2', skill: 'detail', level: 'B2', point: 'sad', seg: [44.3, 52.0],
      stem: 'What reason does Andy give for never listening to April’s band?',
      choices: ['He thinks the music is too sad and weird', 'He thinks the music is too slow and dull',
                'He thinks she likes the singer too much'], a: 0,
      cue: '「Because」で始まる答えの、形容詞の並び。',
      line: 'Because their music is *sad and depressing and weird*, and art is supposed to be happy and fun…',
      said: '「暗くて、気がめいって、変だから。芸術は楽しくなくちゃ」と答える。',
      mean: '理由は音楽の中身。芸術は明るく楽しいもの、と思い込んでいる。',
      trap: '好みに合わない理由は想像で埋めやすい。because の直後の形容詞を一つずつ聞く。',
      use: 'It’s a little too sad for me.（ちょっと暗すぎるかな）' },

    // R fix: V2 (blind 75 %, right): "sorry" was weak; now "relieved", the 水に流す reading with a different mood
    // why: settled ← "forget it" heard as agreeing to drop it calmly (水に流す); relieved ← both say "forget it", so
    //   both seem glad to let it go
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'forget', seg: [52.0, 57.4],
      stem: 'When both of them end with “forget it”, how do they feel?',
      choices: ['Fed up; the fight is left unsettled', 'Calm; they have settled the fight',
                'Relieved; both are glad to drop it'], a: 0,
      cue: '「forget it」の前に付く一語ずつ。',
      line: 'You know what? *Whatever*, forget it. — *Fine*, forget it.',
      said: '「もういい、どうでもいい」「ああ、もういいよ」で終わる。',
      mean: 'whatever や fine 付きの forget it は「もう話したくない」。仲直りではない。',
      trap: 'forget it を「水に流す」と取りやすい。前の一語が投げやりなら怒ったまま。',
      use: 'Fine. Whatever. Do what you want.（はいはい、好きにすれば）' },

    // R fix: V2 (blind 60 %, right): "worried" was weak; now "shocked", the reading of "Damn!" alone
    // why: shocked ← "Damn!" heard on its own as dismay at the harsh words; annoyed ← the fight halts the game, so a host
    //   would want to get back to it
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'juice', seg: [57.4, 60.5],
      stem: 'Right after the fight, how does the host react to it?',
      choices: ['He’s thrilled it makes good drama', 'He’s shocked at how harsh it got',
                'He’s annoyed it stopped his game'], a: 0,
      cue: '短い叫びのあと、ゲームを言い表す一語。',
      line: 'Damn! This game’s *got juice*.',
      said: 'けんかを見て「おお！このゲーム、盛り上がるね」と言う。',
      mean: 'got juice ＝ 勢いがある、熱い。二人のけんかを番組の見せ場として喜んでいる。',
      trap: 'damn を困った声と取ると心配や不満に聞こえる。そのあとの語がほめ言葉かどうかで決める。',
      use: 'This party’s got some energy!（このパーティー、盛り上がってるね！）' },

    // why: about to sell ← "he's just" heard as "he'll just", a plan, not a done thing; broke ← a fight and "quitting
    //   music" suggest a smashed guitar
    { id: 'd1', skill: 'detail', level: 'B1', point: 'guitar', seg: [63.4, 71.2],
      stem: 'According to April, what has Andy done since the fight?',
      choices: ['He has sold his guitar', 'He is about to sell his guitar', 'He has broken his guitar'], a: 0,
      cue: '「He just」のあとの動詞の形。',
      line: 'He just *sold his guitar*, and he’s, like, quitting music now.',
      said: '「あなたのゲームのせいで大げんか。彼はギターを売って、音楽をやめるって」と司会者に言う。',
      mean: 'just sold ＝ ついさっき売った。もう済んだこと。',
      trap: 'just を「これから」と取りやすい。sold は過去形で、もう売ってしまった。',
      use: 'I just sold my old bike.（古い自転車、さっき売ったんだ）' },

    // R fix: V2 (blind 55 %, right): the key was the only quiz choice; now "quiz answers that praise his band", from
    //   the fight's topic
    // why: in front of everyone ← a game show stage is where a public "sorry" would happen; praise his band ← the fight
    //   was about Mouse Rat, so a peace offering seems to be about the band
    // R fix (draws): `guitar` dropped from reveals; nothing in the stem, choices or notes says the guitar was sold,
    //   and the extra block made play 2 repeat two play-1 items in 3 of 20 seeds
    { id: 'g2', skill: 'gist', level: 'B2', point: 'fix', reveals: ['setup', 'wrong'], seg: [63.4, 118.2],
      stem: 'After the fight, how does April try to win Andy back on the show?',
      choices: ['Through a quiz the host rigs so he wins', 'Through a public apology to him on stage',
                'Through quiz answers praising his band'], a: 0,
      cue: '彼女が司会者に話したあと、何が始まるか。',
      said: '彼女は司会者に「ゲームのせいでけんか」と訴え、何を答えても点が入るボーナス問題が始まる。',
      mean: '司会者と組んで夫を勝たせ、機嫌を直させる作戦。夫は見破って去る。',
      trap: '舞台の上なので公開の謝罪を思いやすいが、謝る言葉は出てこない。',
      use: 'Let me make it up to you.（埋め合わせさせて）' },

    // R fix: V2 (blind 50 %, right): "April's" was weak; now "Andy's mom's", which starts with the same name
    // why: Kraft ← Andy's own guess, the first answer heard; Andy's mom's ← after a long pause, "Andy" heard as the start
    //   of the usual answer (mom's mac and cheese)
    { id: 'd3', skill: 'detail', level: 'B1', point: 'mac', seg: [77.9, 91.9],
      stem: 'In the bonus round, whose mac and cheese did April name as the best?',
      choices: ['Andy’s', 'Kraft’s', 'Andy’s mom’s'], a: 0,
      cue: '「April said…」のあとの名前。',
      line: 'who did your boo say makes the best mac and cheese in the universe? — Kraft? — April said… *Andy*!',
      said: '「彼女が宇宙一のマカロニチーズを作ると言ったのは誰？」に彼はメーカー名で答え、正解は「アンディ」。',
      mean: 'April の答えは夫本人。仲直りの気持ちがこもった答え。',
      trap: '最初に聞こえる答えは本人の推測。司会者の「April said」のあとが正解。',
      use: 'You make the best pancakes.（あなたのパンケーキが一番）' },

    // why: fewer points ← "won" heard, but he seems to argue they deserved more; skipped her ← "April said" taken as
    //   cut off before her answer
    { id: 'h1', skill: 'humor', level: 'C1', point: 'wrong', reveals: ['mac', 'fifty'], seg: [87.8, 96.25],
      stem: 'Why does Andy’s “Wait, why?” get a laugh?',
      choices: ['They got points for a wrong answer', 'They got fewer points than they should',
                'The host skipped over April’s answer'], a: 0,
      cue: '「Wait, why?」のすぐあとの短い文。',
      line: 'Best couple ever. You just won 50 points. — Wait, why? *We got it wrong.*',
      said: '「最高のカップル！50点獲得！」と言われ、彼は「え、なんで？外れたのに」と返す。',
      mean: '外れても点が入る。このボーナス問題は、勝たせるための仕組みだと分かる。',
      trap: 'won を聞いて喜ぶ場面と取りやすい。返しの wrong が、ずれを示す。',
      use: 'Wait, why? I didn’t do anything.（え、なんで？何もしてないのに）' },

    // why: 15 ← fifteen and fifty differ only in stress and the end; 100 ← the later prize, the next number said
    { id: 'n1', skill: 'number', level: 'B1', point: 'fifty', seg: [91.9, 95.3], keep: true,
      stem: 'How many points does the host give for the mac and cheese answer?',
      choices: ['15', '50', '100'], a: 1,
      cue: '「won」のすぐあとの数。',
      line: 'Best couple ever. You just won *50 points*.',
      said: '「最高のカップル。50点獲得」と司会者が言う。',
      mean: 'fifty は前を強く「フィフティ」。fifteen なら後ろの「ティーン」が強く長い。',
      trap: '-teen と -ty は聞き分けにくい。強いのが前か後ろかで判断する。',
      use: 'That’s fifty, not fifteen.（15じゃなくて50だよ）' },

    // R fix: V2 (blind 65 %, right): "keep the fight going" was easy to rule out; now the host's plan has the same
    //   goal as the key, so "un-mad at you" (April) settles it
    // why: host planned ← "set this whole thing up" heard as about the game's maker, who is running the quiz; win the
    //   prize ← "points" are piling up, so the plan seems to be to win
    { id: 'i1', skill: 'infer', level: 'B2', point: 'setup', reveals: ['unmad'], seg: [104.3, 110.4],
      stem: 'What has Andy figured out about the bonus round?',
      choices: ['April planned it to make peace with him', 'The host planned it to help them make up',
                'April planned it to win the prize'], a: 0,
      cue: '「Wait a minute」のあと、so で始まる目的。',
      line: 'You *set this whole thing up so I would be un-mad at you*.',
      said: '「全部仕組んだんだろ、ぼくの怒りを解くために」と気づく。',
      mean: 'you は April。点をあげて機嫌を直させる作戦だったと見抜いた。',
      trap: 'set up を番組側の仕掛けと取りやすい。so のあとの目的を聞けば誰の作戦か分かる。',
      use: 'You planned this, didn’t you?（これ、仕組んだでしょ）' },

    // R fix: V2 (blind 85 %, right) and K3: "even angrier" was a filler; now "only a bit less angry"
    // why: a bit less ← a playful coined un- word heard as softening, not undoing; pretending ← "would be" heard as
    //   acting a part, not a real change
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'unmad', seg: [104.3, 108.0],
      stem: 'What does Andy mean when he says April wants him to be “un-mad”?',
      choices: ['No longer angry with her', 'Pretending not to be angry', 'Only a bit less angry with her'], a: 0,
      cue: '「un」が付くと、もとの語はどうなる？',
      line: 'so I would be *un-mad* at you.',
      said: '「ぼくが怒らなくなるように」と言う。',
      mean: 'un- ＋ mad の即席の語で、怒りが解けた状態。正式な語ではないが会話では通じる。',
      trap: 'would be を「ふりをする」と取りやすい。un- は打ち消しで、気持ちが本当に戻ること。',
      use: 'Okay, I’m un-mad now.（よし、もう怒ってないよ）' },

    // R fix: §9.5: "Guess what? And it's gonna work" doesn't fit the gap; now "Not gonna", a near sound that does
    // why: not gonna ← the same meaning, and with the t gone the vowel is all that tells them apart; it's gonna ← the
    //   meaning flips to "it will work" if the negative is missed
    { id: 's1', skill: 'sound', level: 'C1', point: 'aint', reveals: ['setup'], seg: [104.3, 110.4],
      stem: 'Fill the gap: “Well, guess what? ___ work.”',
      choices: ['Ain’t gonna', 'Not gonna', 'It’s gonna'], a: 0,
      cue: '「guess what?」のあと、文頭の短い音。',
      line: 'Well, guess what? *Ain’t gonna* work.',
      said: '「おあいにくさま、うまくいかないよ」と言い返す。',
      mean: 'ain’t gonna ＝ isn’t going to。くだけた否定で、t は消え「エイン ガナ」。',
      trap: 'ain’t の t が消え、not や it’s に聞こえやすい。文頭の「エイン」は否定。',
      use: 'That ain’t gonna happen.（そうはいかないよ）' },

    // why: 50 ← the earlier prize, heard again; 1,000 ← hundred and thousand blur at speed
    { id: 'n2', skill: 'number', level: 'B1', point: 'hundred', reveals: ['setup'], seg: [110.3, 114.0], keep: true,
      stem: 'How many points is spotting April’s trick worth, says the host?',
      choices: ['50 points', '100 points', '1,000 points'], a: 1,
      cue: '「worth」のすぐあとの数。',
      line: 'You figured out April’s trying to trick you. That’s worth *100 points*.',
      said: '「April の作戦を見破った！100点！」と司会者が言う。',
      mean: '作戦を見抜いても点が入る。何をしても点をあげるゲームになっている。',
      trap: 'hundred と thousand は速いと似る。「ハン」で始まれば百、「サウ」なら千。',
      use: 'That’s worth a hundred bucks.（それ、100ドルの価値があるよ）' },

    // R fix: V2 (blind 55 %, right): only the key said "doesn't mind"; now the "paid more" choice says it too. N7/B1:
    //   the stem says the guitar was sold, d1's key, so it reveals `guitar`
    // why: paid more ← "bought it back" in the question taken as the answer, with "but whatever"; borrowed ← "from his
    //   office" heard as lent from someone's workplace for a while
    { id: 'i3', skill: 'infer', level: 'C1', point: 'stole', reveals: ['guitar'], seg: [157.4, 166.9],
      stem: 'When Andy asks if she bought the guitar back, what does April’s answer reveal?',
      choices: ['She took it without paying, and doesn’t mind', 'She paid more than he got for it, but doesn’t mind',
                'She only borrowed it, and must return it'], a: 0,
      cue: '「actually」のあとの動詞と、そのあとの一言。',
      line: 'That’s my guitar. You bought it back…? — I *actually stole it* from his office. *But whatever.*',
      said: '「買い戻したの？」に「実は事務所から盗んだ。まあいいの」と答える。',
      mean: 'actually は予想を正す合図。盗んだのに but whatever と平気。',
      trap: '質問の bought back を答えと取りやすい。actually のあとは予想外の話。',
      use: 'Actually, I made it myself.（実は自分で作ったの）' },

    // anchor: 168.9–177.3 s “Maybe April doesn't think that we're the greatest band in the world, but man, she loves me.
    //   And I love her. So, you know, who cares?” (against his 36.6 s “Do you even think that Mouse Rat is…”)
    // R fix: V2 (blind 65 %, right): "that still hurts" was easy to rule out against the warm key; now a near miss
    //   with the key's first half
    // why: now thinks ← right target, wrong direction: she played with the band, so she seems to have changed her mind;
    //   change her mind ← "maybe" heard as "not yet", with "who cares" missed
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'whocares', reveals: ['mouserat'], seg: [168.4, 177.4],
      stem: 'Which plain-English version keeps what Andy says to the camera?',
      choices: ['“She may not rate my band, but she loves me. That’s enough.”',
                '“She now thinks my band is the best, so we’re fine.”',
                '“She may not rate my band, but I’ll change her mind.”'], a: 0,
      cue: '「but man」の前と後、そして最後の一言。',
      line: 'Maybe April *doesn’t think* that we’re the greatest band in the world, but man, *she loves me*. … *who cares?*',
      said: '「世界一のバンドとは思ってないかも。でも彼女はぼくを愛してる。ならいいさ」と話す。',
      mean: 'けんかの元の問いに自分で答えを出した。バンドの評価より彼女の気持ちが大事。',
      trap: 'バンドで演奏した場面から、彼女が考えを変えたと取りやすい。maybe と who cares で、評価は変わらないまま。',
      use: 'Maybe it’s not perfect, but who cares?（完璧じゃないかもだけど、いいじゃん）' },
  ]
};
