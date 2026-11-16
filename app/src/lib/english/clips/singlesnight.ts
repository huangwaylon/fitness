// REVIEW 2026-11-16: pass 6, fix 18, drop 0, new 0; ear checks 1
// OPEN: i3: both sources hear "want to see them/him available"; the line now starts at "available" so it doesn't
//   commit to "see" or "seem". No key depends on it.
// “Singles Night | Parks and Recreation” (the official Parks and Recreation channel, Season 3): Ann tries a singles
// night to be "a whole new Ann Perkins". Donna, there too, first treats her as a rival ("every woman for herself"), then
// coaches her after a bungled chat with Brian. When Ann hears her ex Andy is getting married and wants to go home, Donna
// talks her into staying.
// Segments from the captions, words from whisper (2026-11-16). Whisper's timings are a 1 s grid after 67 s; the
// captions' word times are used throughout. The coach from 91 s on is taken to be Donna (Ann calls her Donna at 157 s,
// right before the pep talk); no key depends on it.
// Untested on purpose: 94–100 s ("Are you Nell? From the movie Nell?": captions "the moving mill"; a film reference),
// 130–146 s (Leslie's call needs backstory: "kiss him again, or kiss her"), 152–155 s (a herpes line), 183–185 s
// (whisper and captions "throw him in my bins": unclear).
// EAR CHECK: 174.0 s c1 — the stress in "But I do know" falls on "do" (contrast with "I don't know you"), not on
// "know" or "I" (ship only once confirmed)
import type { Clip } from '../types.ts';

export const singlesNight: Clip = {
  id: 'singlesnight', video: 'Uipz4bJ5wys', title: 'Singles Night | Parks and Recreation', dur: 211, wpm: 143,
  band: 'slow', tags: ['恋愛', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %): "help Donna meet someone" was weak. Now a bet about flirting ("flirt" and Donna both
    //   come up), and the key names Donna, so all three are about something that happened before.
    // why: before the ex marries ← Andy's wedding comes up later, heard as the motive; a bet ← "how to flirt with men"
    //   and Donna's name are both heard, in the wrong relation
    { id: 'g2', skill: 'gist', level: 'B2', point: 'why', seg: [17.6, 63.2],
      stem: 'What brought Ann to the singles night in the first place?',
      choices: ['Advice from Donna to be much bolder', 'A wish to meet someone before her ex',
                'A bet with Donna that she can flirt'], a: 0,
      cue: '「I’m here because of」のあと。',
      line: 'I’m here because of *advice that you gave me to be more adventurous* in my life.',
      said: '「ここに来たのは、もっと冒険しろってあなたが言ったから」とドナに言う。',
      mean: '新しい自分を試しに来た。相手を探すのは、その一歩。',
      trap: '元恋人の結婚の話はあとで出る。来た理由は because of のあとに言っている。',
      use: 'I’m trying to be more adventurous.（もっと冒険してみようと思って）' },

    // R fix: V2 (blind 65 %): both distractors said "going well", so the key was the only doubt. Now one is negative
    //   too ("tiring"), and one reads "casual fun" as how it went.
    // why: fun ← "having some casual fun" heard as the verdict; tiring ← "meeting some new people" heard as the strain
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'awkward', reveals: ['outthere'], seg: [18.7, 29.8],
      stem: 'How is the new Ann finding it so far?',
      choices: ['Uncomfortable, for all her brave words', 'Fun, just as she planned it to be',
                'Tiring, with so many new people to meet'], a: 0,
      cue: '前向きな言葉を並べたあと、and で付け足す一語。',
      line: 'having some casual fun, and it is *awkward*.',
      said: '「新しい人に会って、気軽に楽しむ」と並べ、最後に「そして気まずい」と付け足す。',
      mean: '前向きな計画のあとの本音。間を置いた awkward が落ち。',
      trap: '前半の明るい言葉で気分を決めやすい。最後の一語が全体をひっくり返す。',
      use: 'I’m trying, but it’s awkward.（がんばってるけど、ぎこちない）' },

    // R fix: V2 (blind 50 %): "showing off how good she looks" was weak. Now "putting herself first", the literal
    //   reading of "putting myself".
    // why: bars ← "out" read literally (外に出る); herself first ← "putting myself" read as 自分を優先
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'outthere', seg: [20.4, 26.2],
      stem: 'What does Ann mean about what she is doing these days?',
      choices: ['Opening herself up to new people', 'Going out to bars and clubs more',
                'Putting herself first for once'], a: 0,
      cue: '「I’m putting myself」のあとの二語。',
      line: 'I’m *putting myself out there*, meeting some new people…',
      said: '「思い切って外に出て、新しい人と会って、気軽に楽しんでる」と言う。',
      mean: 'put oneself out there ＝ 断られる危険をおかして、人と関わろうとする。',
      trap: 'out を「外出」と取りやすい。場所でなく、心を開くという意味。',
      use: 'You have to put yourself out there.（自分から出ていかなきゃ）' },

    // R fix: V2 (blind 60 %): "a rival… to the end" left the key as the only arc with a turn. Now "a friend at first,
    //   then a rival", from Ann's warm greeting and the jungle speech.
    // why: becomes a rival ← the order reversed (coaching first, then rivalry); friend first ← Ann's "so excited to see
    //   you" heard as Donna's stance, then "every woman for herself"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'donna', reveals: ['herself', 'choice', 'beatit'], seg: [30.0, 188.6],
      stem: 'How does Donna’s treatment of Ann change over the night?',
      choices: ['A rival at first, then a coach', 'A coach at first, then a rival',
                'A friend at first, then a rival'], a: 0,
      cue: '最初の「jungle」の話と、最後の長い励まし。',
      said: '最初は「友だちはいない、あっち行って」と突き放すが、あとで口説き方を教え、帰ろうとするアンを励ます。',
      mean: '敵扱いから、世話を焼く先輩へ。口は悪いが、最後は味方。',
      trap: '最初の強い言葉で印象が決まりやすい。最後の励ましまで聞いて判断する。',
      use: 'She’s tough, but she’s got my back.（きついけど、味方なんだ）' },

    // R fix: V2 (blind 60 %): the key was the only feeling among errands. All three are now wishes, and one comes from
    //   her own "how does this work?".
    // why: drive her ← "by yourself" heard as coming alone; show her how ← she asked "how does this work?" at the start
    { id: 'd3', skill: 'detail', level: 'B1', point: 'alone', seg: [32.8, 39.8],
      stem: 'Why is Ann so glad to see Donna there?',
      choices: ['She hates being at these things alone', 'She hoped someone would show her how',
                'She needs someone to drive her home'], a: 0,
      cue: '名前を呼んだあと、when で始まる部分の前後。',
      line: 'These things are *horrible when you’re by yourself*.',
      said: '「こういう会は、一人だとつらいの」とうれしそうに言う。',
      mean: 'these things ＝ こういう集まり。知り合いがいて心強い、という意味。',
      trap: 'by yourself を「一人で来た」と交通の話に取りやすい。気持ちの話。',
      use: 'These things are hard on your own.（こういうのは一人だとつらいよね）' },

    // R fix: V2 (blind 70 %): "must find a partner" was weak. Now "should just be herself", the singles-night advice
    //   that "herself" calls up.
    // why: be herself ← "herself" heard in the "be yourself" advice frame; came alone ← "for herself" heard as "by herself"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'herself', seg: [42.1, 49.6],
      stem: 'What does Donna mean with her line about every woman?',
      choices: ['Each woman here looks out for herself', 'Each woman here should just be herself',
                'Each woman here came on her own'], a: 0,
      cue: '「jungle」「no friends」のあとの決まった言い方。',
      line: 'We’re in the jungle. There are no friends here. It’s *every woman for herself*.',
      said: '「ここはジャングル。友だちはいない。自分の身は自分で」と言う。',
      mean: 'every man for himself の女性版。助け合いはなし、という宣言。',
      trap: 'for herself を by herself と聞きやすい。「自分のためだけ」の意味。',
      use: 'It’s every man for himself.（自分のことは自分で、だよ）' },

    // R fix: V2 (blind 50 %): "Says she means every word" was the emphatic odd one out. Now "Asks Ann to look at her
    //   face", the literal reading of "Do I look like…".
    // why: half joking ← the question taken as a real yes/no; look at her face ← "Do I look like" read literally
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'joking', reveals: ['herself'], seg: [50.0, 53.0],
      stem: 'When Ann asks if she is joking, what does Donna’s answer do?',
      choices: ['Tells Ann she is serious', 'Asks Ann to look at her face',
                'Admits she is half joking'], a: 0,
      cue: '質問に質問で返す形。',
      line: 'You’re joking, right? — *Do I look like I’m joking?*',
      said: '「冗談でしょ？」に「冗談を言ってる顔に見える？」と返す。',
      mean: '答えを求めない問い。「本気よ」と強く言う決まった形。',
      trap: '問いの形なので、顔を見てと頼んでいるように聞こえやすい。答えは決まっている。',
      use: 'Do I look like I’m kidding?（冗談言ってるように見える？）' },

    // R fix: V2 (blind 55 %): "share the men" was weak. Now "a game they can both win", the literal upbeat reading of
    //   "game".
    // why: nobody wins ← "zero" heard as both getting nothing; both win ← "game" heard without "zero-sum"
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'zerosum', reveals: ['herself', 'shots'], seg: [52.5, 59.3],
      stem: 'What does Donna say dating is like for the two of them?',
      choices: ['Any man one gets is one the other loses', 'Neither of them is likely to get anyone',
                'It is a game they can both win if they try'], a: 0,
      cue: '「game」のあと、if で始まる説明。',
      line: 'Dating is a *zero-sum game*. If you get a man, I don’t get that man.',
      said: '「デートはゼロサムゲーム。あなたが男をつかまえたら、私はその男を取れない」と言う。',
      mean: 'zero-sum ＝ 一方の得が他方の損。友だちも敵になる、という理屈。',
      trap: 'zero を「どちらもゼロ」と取りやすい。すぐあとの if の文が意味の説明。',
      use: 'It’s not a zero-sum game.（片方が得すれば片方が損、ってわけじゃない）' },

    // why: beat the others ← beat = 打ち負かす, read literally; bolder ← "more advice" heard as more of the same
    { id: 'h1', skill: 'humor', level: 'C1', point: 'beatit', reveals: ['why'], seg: [58.9, 65.9],
      stem: 'Why is Donna’s “more advice” funny?',
      choices: ['It is just telling Ann to go away', 'It is telling Ann to win against her',
                'It is telling Ann to be even bolder'], a: 0,
      cue: '「Here’s some more advice」のあとの二語。',
      line: 'Here’s some more advice. *Beat it.*',
      said: '「冒険しろと言ったのはあなた」に「じゃあもう一つ助言。あっち行って」と返す。',
      mean: 'beat it ＝「消えて」。助言の形を借りて追い払っている。',
      trap: 'beat を「打ち負かす」と取りやすい。命令の二語なら「どっか行け」。',
      use: 'Beat it, I’m busy.（あっち行って、忙しいの）' },

    // why: another store ← "Which one?" heard as a real follow-up she answers; used to ← "was" heard as her past job
    { id: 'd4', skill: 'detail', level: 'B1', point: 'job', seg: [66.9, 79.6],
      stem: 'What does Ann admit right after saying “Me too”?',
      choices: ['She has no such job; it was a tease', 'She works at another store in town',
                'She used to have that job years ago'], a: 0,
      cue: '「Which one?」と聞かれたあとの答え。',
      line: 'No, I’m not. I was just *ribbing you*.',
      said: 'スポーツ用品店の店長だという相手に「私も」と言い、「どの店？」に「違う、からかっただけ」と返す。',
      mean: 'rib ＝ 軽くからかう。話を盛り上げるつもりが、すべっている。',
      trap: 'was が聞こえて「昔の仕事」と取りやすい。was just は「〜しただけ」。',
      use: 'Relax, I’m just ribbing you.（落ち着いて、からかっただけ）' },

    // R fix: V2 (blind 60 %): only the key made a natural bar question. Added "What were you", the same frame with a
    //   weak are/were; 4 choices, all strong.
    // why: Why ← the first word is weak and only its w is caught; Were ← "what are" run together into one syllable;
    //   What were ← are and were are both weak, ər
    { id: 's1', skill: 'sound', level: 'B2', point: 'drinking', seg: [79.9, 83.0],
      stem: 'Fill the gap: “___ drinking?”',
      choices: ['What are you', 'What were you', 'Why are you', 'Were you'], a: 0,
      cue: '文の最初、短くつながった音のかたまり。',
      line: '*What are you* drinking?',
      said: '「何飲んでるの？」と聞く。What are you は「ワダユ」のようにつながる。',
      mean: 'What are の t が弾んで「ラ」「ダ」に近い。are と you は弱く短い。',
      trap: 'Why なら「なぜ飲んでるの？」で意味が変わる。最初の母音の長さを聞く。',
      use: 'What are you having?（何にする？）' },

    // why: yes to a drink ← "Yeah" read as accepting; same drink ← "what are you drinking" read as an offer to order
    { id: 'd5', skill: 'detail', level: 'B1', point: 'yeah', reveals: ['drinking'], seg: [79.9, 90.8],
      stem: 'Why did Ann answer “Yeah” to the man’s question?',
      choices: ['She had not heard his question', 'She was saying yes to a drink with him',
                'She wanted the same drink as him'], a: 0,
      cue: '「What?」と聞き返されたあとの説明。',
      line: 'Oh, I don’t know. *I couldn’t hear you.*',
      said: '「何飲んでる？」に笑って「うん」と答え、「聞こえなかった」と白状する。',
      mean: '聞こえないまま笑ってごまかした。相手にもそれがばれる。',
      trap: 'Yeah を「飲む」への返事と取りやすい。聞き返されたあとの本人の説明が答え。',
      use: 'Sorry, I couldn’t hear you.（ごめん、聞こえなかった）' },

    // R fix: V2 (blind 65 %): "looks too busy to be talked to" was weak. Now "looks relaxed, not too eager", from the
    //   "not too available" advice that follows.
    // why: privacy ← scribbling read as hiding her name; not eager ← "make them work for it" heard as playing it cool
    { id: 'i2', skill: 'infer', level: 'B2', point: 'scribble', seg: [104.6, 111.3],
      stem: 'Why should Ann write her name tag badly, according to Donna?',
      choices: ['So men have to come closer to read it', 'So nobody can find out her real name',
                'So it looks relaxed, not too eager'], a: 0,
      cue: '「scribble the name」のあとの動詞の並び。',
      line: 'You always want to *scribble the name*, make them read, *draw them in*…',
      said: '「名札はなぐり書きにするの。読ませて、引き寄せて、手間をかけさせる」と教える。',
      mean: '読みにくい名札は、相手が近づくきっかけ。draw in ＝ 引き寄せる。',
      trap: 'なぐり書きは名前を隠すためと取りやすい。make them read で目的が分かる。',
      use: 'Make them come to you.（向こうから来させるの）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'workfor', reveals: ['scribble'], seg: [108.0, 111.3],
      stem: 'Type the advice: “Draw them in, make them ___.” (3 words)', answer: 'work for it',
      cue: '「make them」のあと、つながる三語。',
      line: 'draw them in, make them *work for it*.',
      said: '「引き寄せて、手間をかけさせて」と言う。work for it は「ワークフォリッ」。',
      mean: 'work for it ＝ 苦労して手に入れる。簡単に近づかせない作戦。',
      trap: 'for と it が弱く、work だけ残りやすい。最後の t はほぼ消える。',
      use: 'You’ll have to work for it.（簡単には手に入らないよ）' },

    // why: one ← "shots" with the -s missed; three ← "too much" right after ("two" and "too" sound the same)
    { id: 'n1', skill: 'number', level: 'B1', point: 'shots', seg: [110.9, 115.8], keep: true,
      stem: 'How many shots are ordered at the bar?',
      choices: ['One', 'Two', 'Three', 'Four'], a: 1,
      cue: '「Right」のあと、飲み物の名前の前。',
      line: '*Two shots* of Jameson. Don’t make too much eye contact.',
      said: '「ジェイムソンのショットを2つ」と頼み、「目を合わせすぎないで」と続ける。',
      mean: 'shot ＝ 小さなグラスの強い酒。自分とアンの分を頼んでいる。',
      trap: 'two と too は同じ音。数か「〜すぎ」かは、すぐあとの語で決まる。',
      use: 'Two coffees to go, please.（コーヒー2つ、持ち帰りで）' },

    // R fix: N1: the line said "You want to seem…", but both sources have "see them/him". It now starts at the words
    //   both agree on. (Blind 40 %, so V2 passed.)
    // why: busy but looking ← "eye contact" heard as a rule to look; friendly to all ← "available" read as 誰にでも
    { id: 'i3', skill: 'infer', level: 'B2', point: 'available', reveals: ['shots'], seg: [113.3, 119.5],
      stem: 'What impression does Donna tell Ann to give the men?',
      choices: ['Open to them, but in no hurry', 'Busy, but still looking their way',
                'Friendly to all, but not to men'], a: 0,
      cue: '「available」を二回言う、その違い。',
      line: '…*available, but not too available*.',
      said: '「目を合わせすぎないで。気がありそうで、ありすぎないように」と言う。',
      mean: 'available ＝ 恋人がいなくて誘える状態。軽く見られない程度に、という加減。',
      trap: 'available を「手が空いている」と仕事の意味に取りやすい。恋愛では「フリー」。',
      use: 'Act interested, but not too interested.（興味はあるけど、ありすぎない感じで）' },

    // why: feels fine ← "I'm good" read as 体調がいい; later ← "for now" heard as saving it for later
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'goodfornow', reveals: ['shots'], seg: [119.2, 122.6],
      stem: 'When the shot is handed to her, what is Ann doing?',
      choices: ['Turning it down, politely', 'Saying she feels fine now',
                'Saving it for a bit later'], a: 0,
      cue: '「Thanks」のあとの言い方と、言いかけて止める所。',
      line: 'Thanks. *I think I’m good for now.* I’m not gonna…',
      said: '「ありがとう。今はいいかな。飲むつもりは…」と言葉をにごす。',
      mean: 'I’m good ＝「結構です」。Thanks と組むと、やわらかい断り。',
      trap: 'good を「元気」、for now を「あとで」と取りやすい。勧められて I’m good は断り。',
      use: 'I’m good, thanks.（大丈夫です、ありがとう）' },

    // R fix: V2 (blind 65 %): "sure it will happen soon" was weak. Now a sincere reading ("as they got along").
    // why: got along ← "Cool" and "see you" taken at face value, without "maybe"; later tonight ← "around" read as nearby
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'maybe', seg: [146.0, 149.6],
      stem: 'What does the man’s goodbye suggest about seeing Ann again?',
      choices: ['He isn’t really planning on it', 'He expects to, as they got along',
                'He will come find her later tonight'], a: 0,
      cue: '別れのあいさつの最後に足す一語。',
      line: 'Cool. *See you around, maybe.*',
      said: '「じゃあ、またどこかで。たぶん」と言って去る。',
      mean: 'see you around だけでも軽い別れ。maybe が付くと、また会う気は薄い。',
      trap: 'see you で「また会える」と取りやすい。最後に付く maybe が気持ちを表す。',
      use: 'See you around, I guess.（じゃあ、またどこかで）' },

    // R fix: V2 (blind 60 %): "the man… left" was weak. Now "tired of the men here", from the chat she has just had.
    // why: needed at the wedding ← Leslie's call ("getting married tonight… get down here") heard as the reason; tired of
    //   the men ← her last chat went badly just before
    { id: 'd6', skill: 'detail', level: 'B1', point: 'ex', seg: [156.0, 165.9],
      stem: 'Why does Ann tell Donna she wants to go home?',
      choices: ['Her ex-boyfriend is getting married', 'A friend’s wedding tonight needs her',
                'She is tired of the men here'], a: 0,
      cue: '「I just found out」のあとと、「So」の答え。',
      line: 'I just found out *Andy’s getting married*. — So? — So *that’s my ex-boyfriend*.',
      said: '「アンディが結婚するって聞いたの。元カレなの。長く付き合ってた」と言う。',
      mean: '帰りたい理由は、元恋人の結婚の知らせで落ちこんだこと。',
      trap: '電話の「今夜結婚する、来て」に引っぱられやすい。本人の so のあとが理由。',
      use: 'I just found out my ex is engaged.（元カレが婚約したって聞いた）' },

    // R fix: V2 (blind 55 %): "And then what happened?" was weak. Now "what will you do now?", so = それで.
    // why: do now ← "So?" heard as それで, asking her plan; really ← heard as surprise
    { id: 'm1', skill: 'marker', level: 'B2', point: 'so', reveals: ['ex'], seg: [157.8, 165.9],
      stem: 'What does Donna’s one-word reply to Ann’s news mean?',
      choices: ['Why should that matter?', 'And what will you do now?', 'Wait, is that really true?'], a: 0,
      cue: 'ニュースのすぐあとの短い一語と、アンの言い返し。',
      line: 'I just found out Andy’s getting married. — *So?* — So that’s my ex-boyfriend.',
      said: 'アンの知らせにドナは「だから？」とだけ返し、アンは「だから、元カレなの」と言い返す。',
      mean: '上がり調子の So? ＝「それがどうしたの」。気にする理由を問う。',
      trap: 'so を「それで？」と続きを促す語と取りやすい。アンの言い返しで意味が分かる。',
      use: 'So? Who cares?（だから？どうでもいいじゃん）' },

    // R fix: V2 (blind 50 %): "blush" was weak. Now "gets Ann's job wrong and says sorry", the same slip with the
    //   Japanese reading of "Okay, I don't know you" as an apology.
    // why: says sorry ← 「よく知らなくて」 heard as すみません; same job ← "doctor" vs "nurse" read as Donna's real belief
    { id: 'h3', skill: 'humor', level: 'C1', point: 'nurse', seg: [168.4, 173.95],
      stem: 'Why does the opening of Donna’s pep talk get a laugh?',
      choices: ['She gets Ann’s job wrong and shrugs it off', 'She gets Ann’s job wrong and says sorry',
                'She thinks doctors and nurses are the same'], a: 0,
      cue: '「I’m a nurse, actually」への返事。',
      line: 'you are a hot, young doctor. — I’m a nurse, actually. — *Okay, I don’t know you.*',
      said: '「あなたは若くてきれいな医者」に「看護師です」と返され、「まあ、よく知らないし」と流す。',
      mean: '励ましの出だしで職業を外し、平然と認めて続ける。ドナらしい雑さ。',
      trap: '「知らないし」を謝りと取りやすいが、すぐ but で続ける。言い直さずに流す所。',
      use: 'Okay, I don’t really know you, but…（まあ、よく知らないけど…）' },

    // anchor: 172.88–174.48 s "Okay, I don't know you. But I do know…": "do" sets what she knows against what she doesn't
    // R fix: V2 (blind 70 %) + S2: the stem quoted "I don't know you" and the key echoed "don't", so the key was the
    //   only choice tied to the stem. The stem now quotes only the line; all three give a contrast in the same form.
    // why: on "know" ← the content verb, where stress usually goes; on "I" ← a contrast with someone else, heard in "I"
    { id: 'c1', skill: 'sound', level: 'C2', point: 'nurse', seg: [172.3, 175.8],
      stem: 'In “But I do know that you can fix…”, where does the stress fall?',
      choices: ['On “do”: this, at least, she knows', 'On “know”: she knows, not guesses',
                'On “I”: she, unlike others, knows'], a: 0,
      cue: '直前の否定と比べて、強く長く聞こえる語。',
      line: 'Okay, I *don’t* know you. But I *do* know that you can fix your attitude.',
      said: '「あなたのことは知らない。でも、これは知ってる。態度は直せるってこと」と言う。',
      mean: '強い do は直前の don’t との対比。「知らないけど、これだけは知ってる」と言い切る。',
      trap: 'ふつうは動詞 know が強いので選びやすい。否定のすぐあとの do は、打ち消しの打ち消し。',
      use: 'I don’t cook, but I do bake.（料理はしないけど、お菓子は焼く）', retired: true },

    // anchor: 175.84–179.2 s "about a man you didn't want to marry": the subject is "you" (Ann), and 163.8–165.5 s
    //   Ann has only said they were together a long time
    // R fix: V2 (blind 55 %): "no real cause to be upset" was the generic comfort among two misreadings. The key and the
    //   best distractor now differ only in who didn't want it; the third is regret.
    // why: he didn't want her ← the weak "you" lost, heard as Andy's choice; should have married ← "feel sorry for
    //   yourself" heard as regret, the sincerity flipped
    { id: 'c2', skill: 'infer', level: 'C2', point: 'didntwant', reveals: ['ex'], seg: [173.9, 179.25],
      stem: 'What does Donna’s point about marrying tell Ann?',
      choices: ['She never wanted to marry him herself', 'He never wanted to marry her anyway',
                'She should have married him herself'], a: 0,
      cue: '「a man」のあと、didn’t の前の主語。',
      line: 'feel sorry for yourself about *a man you didn’t want to marry*?',
      said: '「結婚したくもなかった男のことで、家で自分をかわいそうがるの？」と聞く。',
      mean: '主語は you。結婚したくなかったのはアン自身だから、落ちこむ理由はない、という突っこみ。',
      trap: '弱い you が消えて「彼が結婚したくなかった」と聞きやすい。didn’t の前の主語を拾う。',
      use: 'You didn’t even want that job!（その仕事、そもそも欲しくなかったでしょ）', retired: true },

    // R fix: V2 (blind 70 %): "put as a choice" named the mechanism, and "take Ann home" was weak. Now "letting Ann go
    //   home if she likes", the Japanese 気づかい reading of offering an out.
    // why: honest preference ← two "Do you want" questions read as a real choice; let her go ← "go home" heard as
    //   permission, a kind way out
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'choice', reveals: ['didntwant', 'shots'], seg: [173.9, 183.4],
      stem: 'What is Donna doing with her two “Do you want…” questions?',
      choices: ['Steering Ann toward staying out', 'Letting Ann go home if she likes',
                'Asking which Ann honestly wants'], a: 0,
      cue: '二つの選択肢の、言い方の差。',
      line: 'Do you want to go home and *feel sorry for yourself*…? Or do you want to go talk to that *cute boy*…',
      said: '「家で自分をかわいそうがる？それとも、見てる男の子と話して番号を渡す？」と聞く。',
      mean: '片方を暗く、片方を明るく言う問い。答えを決めさせた励まし。',
      trap: '問いの形なので、本当に選ばせていると取りやすい。言い方の差が答えを示す。',
      use: 'Do you want to sulk, or have fun?（すねてたい？それとも楽しむ？）' },
  ]
};
