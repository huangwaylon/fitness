// REVIEW 2026-11-16: pass 6, fix 14, drop 0, new 0; ear checks 1
// “50 Years of Marriage | Parks and Recreation” (the official Parks and Recreation channel, Season 6): a TV host
// interviews a couple married 50 years, Leslie cuts in to sell the two towns' unity, and the couple drops the act.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 79 s; whisper's repeated line after it
// is a hallucination. Untested: 73–79 s (the couple's sexual confessions). No humor item (no laugh track; the funny
// lines are either insults or innuendo). No predict item ("because…" projects a reason that never comes).
// EAR CHECK: 15.3 s g2 d3 pr1 — the "bridge… Pawnee and Eagleton" cut-in is Leslie's (assumed; "my show, my questions" shows it isn't the host's, and both sources agree on the words)
import type { Clip } from '../types.ts';

export const fiftyYears: Clip = {
  id: 'fiftyyears', video: 'bsVtU-AZAyA', title: '50 Years of Marriage', dur: 100, wpm: 223, band: 'fast',
  tags: ['恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 60 % (the only choice about the towns). Swapped "her own show" for a rivalry reading of the towns.
    // why: tips ← the host's own angle, "the secret sauce that we should all be putting on…"; her town better ← both
    //   towns are named, so it sounds like a contest between them (but she calls the divide "meaningless")
    { id: 'g2', skill: 'gist', level: 'B2', point: 'aim', reveals: ['bridge'], seg: [0, 46.2],
      stem: 'Why does Leslie care about this couple’s story?',
      choices: ['It could help bring the two towns together', 'It could give viewers tips for their marriages',
                'It could show her town has better marriages'], a: 0,
      cue: 'インタビューの途中で割り込む声。',
      line: 'helping to *bridge the meaningless divide* between Pawnee and Eagleton.',
      said: 'インタビューの途中で、50年の結婚が二つの町の溝を埋めている、と口をはさむ。',
      mean: '彼女の狙いは夫婦の話そのものより、二つの町の仲を良く見せること。',
      trap: '町の名が二つ出るので張り合いに聞こえるが、溝は meaningless。誰の口出しかも分けて聞く。',
      use: 'This could really bring people together.（これで皆がまとまるかも）' },

    // R fix: V2, blind 80 % ("stops acting happy" was the only twist; the others were fillers). New distractors from
    //   the scene's words; the key no longer says "stops acting".
    // why: Leslie takes over ← she does cut in, but the host takes the floor back; the host refuses money ← "Leslie,
    //   you can keep your money" is said, but by the couple, about money offered to them
    { id: 'g1', skill: 'gist', level: 'B1', point: 'turn', reveals: ['bribe'], seg: [0, 63],
      stem: 'How does the interview change partway through?',
      choices: ['The couple drops the happy story and admits why they wed', 'Leslie takes over and starts asking the questions herself',
                'The host refuses the money that Leslie offered her'], a: 0,
      cue: '「Okay」のあとの短い一言から流れが変わる。',
      line: 'Okay. *I can’t do this.*',
      said: '最初は幸せな夫婦の話。途中で一人が「もう無理」と言い、結婚した本当の理由を話しだす。',
      mean: 'お祝いのインタビューが、本音の暴露に変わる場面。',
      trap: 'keep your money は夫婦が Leslie に言う言葉。お金をもらうはずだったのは夫婦の側。',
      use: 'Sorry, I can’t do this anymore.（ごめん、もう無理）' },

    // why: 1953 ← sixty heard as fifty (the "50 years" just said); 1973 ← -ty endings blur; 1979 ← a year said later in the clip
    { id: 'n1', skill: 'number', level: 'B1', point: 'year', seg: [3.7, 8.8],
      stem: 'When did the couple first meet?',
      choices: ['1953', '1963', '1973', '1979'], a: 1, keep: true,
      cue: '「Well, it was」のあとの年。',
      line: 'Well, it was *1963*…',
      said: '出会いを聞かれて「1963年だった」と答える。',
      mean: 'nineteen sixty-three と2けたずつ読む。年の言い方の基本。',
      trap: '直前の 50 years で fifty に引っぱられやすい。79年はあとの別の話の数字。場面と結びつけて聞く。',
      use: 'We met back in 2015.（出会ったのは2015年）' },

    // R fix: V2, blind 50 %; "too moved" rested on tone only (K1). Now "a happy time" (the literal "it was great").
    // why: happy time ← "it was great" taken at face value; great party ← "great" + "met" built into a scene
    { id: 'i1', skill: 'infer', level: 'C1', point: 'met', reveals: ['year'], seg: [3.7, 14.8],
      stem: 'What does the answer about how they met suggest?',
      choices: ['They have nothing much to say about it', 'It was a happy time they love to recall',
                'They met at a great party that year'], a: 0,
      cue: '年のあと、「and」でつなぐ話の中身。',
      line: 'it was 1963, and we met, and, uh… it was *great*.',
      said: '「63年で、出会って、えー、良かった」とだけ言う。',
      mean: '具体的な話が何も出てこない。語れる思い出がないことが伝わる、この先の伏線。',
      trap: 'great があるので楽しい話に聞こえるが、何が良かったのかは言っていない。中身の量を聞く。',
      use: 'It was fine, I guess.（まあ、良かったかな）' },

    // R fix: V2, blind 70 % (the only choice with a divide in it). "Young couples" is now a family feud ("divide" +
    //   "marriage").
    // why: pay for a bridge ← "bridge… between Pawnee and Eagleton" taken as a noun, a real bridge; family feud ←
    //   "divide" heard next to "marriage", without the two town names
    { id: 'd3', skill: 'detail', level: 'B2', point: 'bridge', seg: [14.6, 21],
      stem: 'When Leslie cuts in, what does she say the marriage has helped do?',
      choices: ['Bring two divided towns closer', 'Pay for a bridge between the towns', 'End a feud between two families'],
      a: 0,
      cue: '「50 years of marriage」のあとの動詞。',
      line: '50 years of marriage *helping to bridge the meaningless divide* between Pawnee and Eagleton.',
      said: '「50年の結婚が、二つの町の無意味な溝を埋める」と付け足す。',
      mean: 'bridge the divide は「対立を埋める」。meaningless で対立はくだらないと示す。',
      trap: 'bridge を名詞の「橋」と取ると工事の話。ここは動詞で「つなぐ」。',
      use: 'Let’s try to bridge the gap.（歩み寄ってみよう）' },

    // why: agreeing ← "Yeah" read as 賛成 (the Japanese frame); offering a turn ← "my questions" misheard as "your questions"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'myshow', seg: [14.6, 22.7],
      stem: 'Right after Leslie’s comment, what is the host doing?',
      choices: ['Reminding Leslie that she runs the interview', 'Agreeing and inviting Leslie to say more',
                'Offering Leslie a turn to ask questions'], a: 0,
      cue: '口出しのすぐあと、短く区切った返事。',
      line: 'Yeah, *my show, my questions*.',
      said: '「はいはい、私の番組、私の質問」と短く言い返す。',
      mean: '口出しを止めて主導権を取り戻す言い方。Yeah は同意ではなく、話を切るための相づち。',
      trap: 'Yeah で始まるので賛成に聞こえやすい。英語の Yeah は話を切る合図にもなる。後ろの語で判断する。',
      use: 'My car, my rules.（私の車だから私が決める）' },

    // R fix: V2, blind 70 % (cooking was the only other reading). Swapped cooking for "how it started" (they were just
    //   asked how they met).
    // why: how it started ← the question right before was how they met; a secret ← "secret" heard as 秘密 (and secrets
    //   do come out later)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'sauce', seg: [22.3, 27.9],
      stem: 'When the host mentions “marriage burgers”, what is she really asking?',
      choices: ['What has kept their marriage going', 'What made them want to marry at first',
                'What secret they’ve kept from each other'], a: 0,
      cue: '「So, what is the」のあと、料理の言葉。',
      line: 'what is the *secret sauce* that we should all be putting on our marriage burgers?',
      said: '「結婚というハンバーガーにかける秘伝のソースは？」と聞く。',
      mean: 'secret sauce は成功の秘けつ。ソースの話を広げて、長続きの理由を聞いている。',
      trap: 'secret は「秘密」でなく「秘けつ」。putting on は今も続けること。',
      use: 'What’s your secret sauce for staying fit?（健康の秘けつは？）' },

    // R fix: V1/V2, blind 85 %: "never go to bed angry" is the saying everyone knows, and the other two were jokes.
    //   Now three real marriage rules; the cue no longer gives "go to bed" (only the key had it, S3).
    // why: secrets ← "secret sauce" just before; laugh ← the light, happy tone of the interview so far
    { id: 'd1', skill: 'detail', level: 'B1', point: 'advice', seg: [22.3, 29.9],
      stem: 'What do they give as the key to their marriage?',
      choices: ['Never go to bed angry', 'Never keep secrets from each other', 'Always find time to laugh'], a: 0,
      cue: '質問のすぐあと、Well で始まる答え。',
      line: 'Well, we never go to bed *angry*.',
      said: '「怒ったまま寝ることはない」と答える。',
      mean: 'けんかはその日のうちに仲直りする、という昔からよくある夫婦の教え。',
      trap: '直前の secret sauce から「秘密」を選びやすい。答えの動詞と最後の語を聞く。',
      use: 'Let’s not go to bed angry.（けんかしたまま寝るのはやめよう）' },

    // R fix: V2, blind 50 %. "Wishes she'd known" became a sincere reading with nuance, so the key isn't the only one.
    // why: impressed ← the words taken at face value; surprised it worked ← a sincere reading of "would have thought"
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'never', seg: [27.6, 32.2],
      stem: 'How does the host mean her reply to that advice?',
      choices: ['She mocks it as something everyone has heard', 'She’s impressed; she had never heard it before',
                'She’s surprised such a simple rule worked'], a: 0,
      cue: '答えのすぐあと、強めの never が2つ。',
      line: '*Never, ever would have thought of that.*',
      said: '「そんなこと、絶対に思いつかなかったわ」と返す。',
      mean: '誰でも知っている決まり文句への皮肉。大げさにほめるほど、ありきたりだと言っている。',
      trap: '言葉だけ取ると感心に聞こえる。答えが平凡なのに強くほめたら、皮肉を疑うくせを。',
      use: 'Wow, never would’ve guessed.（へえ、意外だなあ〔皮肉〕）' },

    // R fix: V2, blind 65 % ("borrowed" was weak). Now "a party" (money from Leslie, the wrong purpose).
    // why: a party ← money from Leslie, but for the anniversary, not for being here; a prize ← "keep your money" read
    //   as turning down a show's reward
    { id: 'i2', skill: 'infer', level: 'B2', point: 'bribe', seg: [33.6, 41.5],
      stem: 'What does “Leslie, you can keep your money” reveal?',
      choices: ['Leslie was paying the couple to be on the show', 'Leslie offered to pay for their anniversary party',
                'The couple turned down a prize from the show'], a: 0,
      cue: '「I can’t do this」の直後、名前を呼んでから。',
      line: 'Leslie, you can *keep your money*.',
      said: '「Leslie、お金はいらない」。司会者が「お金？」と聞き返す。',
      mean: 'お金をもらって出演していた、という告白。だから司会者は買収かと聞く。',
      trap: 'お金の目的を聞く。司会者の「買収？」が答え。you can keep it は「受け取らない」。',
      use: 'Keep the change.（おつりは取っておいて）' },

    // why: $100 ← "each" lost, so 200 split in two; $20 and $2,000 ← the hundred blurs into a short or a long number
    { id: 'n2', skill: 'number', level: 'B1', point: 'amount', seg: [41.2, 46.2],
      stem: 'How much did Leslie offer them?',
      choices: ['$20 each', '$100 each', '$200 each', '$2,000 each'], a: 2, keep: true,
      cue: '「offered us」のあと、数字と小さな語。',
      line: 'Leslie offered us *each 200 bucks*…',
      said: '「Leslie は一人200ドルくれると言った」。',
      mean: 'bucks はドルのくだけた言い方。each なので二人で400ドル。',
      trap: 'each を聞き落とすと二人で200、一人100と考えがち。数字の前後の短い語まで聞く。',
      use: 'It’s ten bucks each.（一人10ドルね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'going', seg: [41.2, 46.2],
      stem: 'Type the end of the line: “…to ___, but it’s impossible.” (3 words)', answer: 'keep this going',
      cue: '「bucks to」のあと。this は短く弱い。',
      line: '…to *keep this going*, but… it’s impossible.',
      said: '「この話を続けるために、でも無理」。',
      mean: 'keep ... going ＝ 続ける。keep this going で「この流れ・この芝居を続ける」。',
      trap: 'this の th は弱く、keep の p とつながって一続きに聞こえる。',
      use: 'Let’s keep this going next week.（来週もこの調子で続けよう）' },

    // why: bring the money ← "bring" taken literally, right after the 200 bucks; warns them ← a short, sharp reply read as "stop"
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'bringit', seg: [45.9, 52.2],
      stem: 'When asked “You want to know why we got married?”, what does the reply do?',
      choices: ['Eagerly tells them to go ahead', 'Tells them to bring the money back', 'Warns them to stop right there'],
      a: 0,
      cue: '質問のすぐあと、短い2語。',
      line: 'You want to know why we got married? — *Bring it.*',
      said: '「結婚した理由、聞きたい？」に、すぐ「どうぞ、来い」と返す。',
      mean: 'Bring it (on) は「受けて立つ、どんどん言って」。スキャンダルを歓迎している。',
      trap: 'bring を「持ってくる」と取ると、お金を返す話に聞こえる。短い命令形は勢いで読む。',
      use: 'Another round? Bring it on.（もう1回？受けて立つよ）' },

    // why: alcohol ← said in the same breath, but about Dougie; parents ← "my parents" comes a few lines later, from him
    { id: 'd2', skill: 'detail', level: 'B2', point: 'prospects', reveals: ['turn'], seg: [45.9, 52.2],
      stem: 'What does Rosie say about her own situation back then?',
      choices: ['She had no real future ahead of her', 'She had a problem with alcohol', 'She had no parents to turn to'],
      a: 0,
      cue: '「Bring it」のあと、I had で始まる文。',
      line: '*I had no prospects*, and Dougie…',
      said: '「私には先の見込みがなかった。Dougie は酒の問題」と話す。',
      mean: 'prospects ＝ 将来の見込み。仕事や結婚のあてがなく、他に道がなかった。',
      trap: 'alcohol problem は夫の話。and のあとで主語が Dougie に変わる。',
      use: 'The job has good prospects.（その仕事は将来性がある）' },

    // R fix: V2, blind 60 % ("had no" didn't fit, and d2's "back then" points to the past). "Had no" is now "has had
    //   an": here's had ≈ here had.
    // why: has an ← the d of had linked into "an" sounds like a z; has had an ← "here had" heard as "here's had"
    { id: 's1', skill: 'sound', level: 'B2', point: 'alcohol', seg: [45.9, 52.2],
      stem: 'Fill the gap: “…and Dougie here ___ alcohol problem.”',
      choices: ['had an', 'has an', 'has had an'], a: 0,
      cue: 'Dougie here のあと、つながる短い2語。',
      line: 'and Dougie here *had an* alcohol problem.',
      said: '「Dougie は酒の問題を抱えていた」。',
      mean: '過去の話。had の d と an がつながり「ハダン」と一語に聞こえる。',
      trap: 'here のあとの小さな s を探す。has や here’s had なら「ズ」が聞こえる。',
      use: 'I had an early flight.（朝早い便だったんだ）' },

    // R fix: V2, blind 70 % (a war romance was weak). Now a war reason that isn't love: start a family before the end.
    // why: a family ← "the Cold War" + "gonna die" read as a rush to have children; parents ← "my parents" is said, but
    //   he married to anger them, not because they pushed
    { id: 'i3', skill: 'infer', level: 'C1', point: 'reasons', reveals: ['prospects', 'turn'], seg: [47.9, 62.3],
      stem: 'From the reasons listed, why did they really get married?',
      choices: ['Because they were scared and had no choices', 'Because the war made them want a family fast',
                'Because their parents pushed them together'], a: 0,
      cue: '「Plus」から先、理由の中身。',
      line: '…the Cold War was happening, and frankly, we all thought we were *gonna die*.',
      said: '先の見込みなし、酒、冷戦、「みんな死ぬと思ってた」と理由が並ぶ。',
      mean: '愛の話は一つもない。他に道がなく、不安だったから一緒になった、という告白。',
      trap: 'war から家族を急ぐ話を想像しやすいが、子どもの話は出ない。理由の中身を一つずつ聞く。',
      use: 'Honestly, I had no other choice.（正直、他に選択肢がなかった）' },

    // R fix: V2, blind 50 % ("leave him alone" was weak). Now "worry about him", a softer feeling than anger.
    // why: notice him ← tick = チェックの印, "get noticed"; worry ← a rebel son's usual aim, softer than the real one
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'tickoff', reveals: ['turn'], seg: [56.9, 62.8],
      stem: 'What did the husband hope living with Rosie would do to his parents?',
      choices: ['Make them really angry', 'Make them finally notice him', 'Make them worry about him'], a: 0,
      cue: '「I figured I could」のあとの2語。',
      line: 'I figured I could really *tick off* my parents…',
      said: '「親を本気で怒らせられると思った」と話す。',
      mean: 'tick off ＝ 怒らせる、イラッとさせる。結婚の理由が親への反抗だったと言っている。',
      trap: 'tick を「印」、off を「離れる」と取るとずれる。tick off は一まとまりで覚える。',
      use: 'That really ticks me off.（それ、本当に頭にくる）' },

    // R fix: V2, blind 80 % ("Desperate" made the key the only strong word). The key now says what she does, not how
    //   hard.
    // why: calm acceptance ← her even pace + "ups and downs" heard as admitting it failed; scolding ← "Okay, we all
    //   agree" read as a teacher's correction
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'rescue', reveals: ['tap'], seg: [62.8, 70.5],
      stem: 'How does the speaker sound starting “Okay, we all agree…”?',
      choices: ['Rushed, steering back to a happy message', 'Calm, accepting that this marriage failed',
                'Stern, correcting the couple’s story'], a: 0,
      cue: '「Okay」のあと、早口でまとめに入る声。',
      line: 'Okay, we all agree that marriages have their ups and downs, but… *they’re worth it* because…',
      said: '「結婚には浮き沈みがあるけど、それだけの価値がある、なぜなら…」と言いかける。',
      mean: '暴露のあとで、何とか明るい結論に戻そうとしている。最後の because で詰まるのが本音。',
      trap: '口調だけだと受け入れたように思えるが、言葉は「価値がある」と逆の向き。',
      use: 'Let’s look on the bright side.（いい面を見よう）' },

    // R fix: V2, blind 70 % (two literal readings beside one abstract key). "Near the end" is now "once the hard years
    //   are over" (ups and downs → a time word).
    // why: at night ← "the end of the day" taken literally; hard years ← "ups and downs, but…" heard as "after the bad
    //   times"
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'endofday', seg: [62.8, 70.5],
      stem: 'What does the phrase just before “they’re worth it” mean here?',
      choices: ['When everything is weighed up', 'When they come home at night', 'Once the hard years are behind them'],
      a: 0,
      cue: '「ups and downs, but」のあと。',
      line: '…but *at the end of the day*, they’re worth it…',
      said: '「浮き沈みはあるけど、最終的には価値がある」とまとめる。',
      mean: 'at the end of the day ＝ いろいろあっても、全部考えると。結論を言う前の決まり文句。',
      trap: '「一日の終わり」や「つらい時期のあと」と取りやすい。結論の合図。',
      use: 'At the end of the day, you decide.（結局はあなた次第だよ）' },

    // R fix: V2, blind 65 % ("when no reason comes" was a giveaway). The stem no longer names Leslie, so the speaker
    //   doesn't matter and the ear check is gone.
    // why: a playful reason ← tap dancing heard as the couple's shared joy, the "because"; the couple ← a question
    //   right after "because…" read as handing them the reason
    { id: 'pr3', skill: 'pragma', level: 'C1', point: 'tap', seg: [62.8, 73.3],
      stem: 'After “they’re worth it because…”, what does the next question do?',
      choices: ['It jumps to a new topic instead', 'It gives the reason in a playful way',
                'It asks the couple to give the reason'], a: 0,
      cue: '「because」のあとの沈黙と、次の質問。',
      line: '…they’re worth it because… *Who likes tap dancing?*',
      said: '「なぜなら…」のあと言葉が出ず、間をおいて「タップダンス好きな人？」と聞く。',
      mean: '理由が思いつかないので、全く関係ない話題に飛んでごまかしている。',
      trap: '質問の形なので何かを本当に提案しているように聞こえる。前の文と話がつながるかで判断する。',
      use: 'Anyway, who wants dessert?（ところで、デザート欲しい人？）' },
  ]
};
