// REVIEW 2026-11-16: pass 10, fix 14, drop 0, new 0; ear checks 3
// Open: g2 (the award looks rigged) is still about 75 % blind for anyone who knows the episode's plot. Re-angle it,
//   or accept it as the clip's gist?
// “Employee of the Month - The Office US” (the official The Office channel, BEST OF SEASON 6): Andy pitches an
// employee-of-the-month award to Jim, Dwight explains to the camera that it's a trap to get Jim fired, and the
// ceremony goes wrong for Jim, then for Pam, and ends with a cake Jim never ordered.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 211 s. Andy, Jim and Dwight are named
// in Dwight's talking head (48.8–59.3 s); Dwight (116.6, 120.7 s) and Pam (160.1, 173.3 s) are named in the scene.
// Untested on purpose: 27–32 s (the list of failed companies: world knowledge), 40.6 s (“Jim's talking” in the
// captions, “Dude's talking” in whisper), 66.4–68.4 s (“in my eyes” in whisper, “of my house” in the captions),
// 79–82 s (crowd overlap), 128.9 s (“Don't do that” / “dumb dude”), 136–143 s (who says “your idea” and
// “Correction!”), 165–167 s (a bleeped swear), 200–207 s (crowd shouts; only “He knew all along” is in both).
// EAR CHECK: 44.7–47.6 s nt2 — “Yeah! Your idea.” is Dwight's and “My idea.” is Andy's (assumed from the talking
//   head that follows; no name is said in the exchange)
// EAR CHECK: 82.9–91.0 s a2 — the stammer (“I was not… I did not…”) is Jim's (assumed: the same voice goes on to
//   “There's no way I could have given it to myself”)
// EAR CHECK: 180.6–188.1 s h4 — “I doubled my sales last month” and “Yup” are Pam's (assumed from turn-taking after
//   “No offense, Pam”)
import type { Clip } from '../types.ts';

export const empOfMonth: Clip = {
  id: 'empofmonth', video: 'xwlNGHoOjKA', title: 'Employee of the Month', dur: 230, wpm: 145, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: looks unwell ← a sickness opening, but nothing is said about Andy's health (and looks aren't tested);
    //   his own health ← "terrible news" heard as news about himself
    { id: 'h1', skill: 'humor', level: 'C1', point: 'doctor', seg: [1.7, 6.4],
      stem: 'Why does Jim ask Andy if he is the patient or the doctor?',
      choices: ['Andy calls Jim a doctor, then talks like one', 'Andy sounds as if he has caught something',
                'Andy says the bad news is about his health'], a: 0,
      cue: '最初の呼びかけと、そのあとの言い方。',
      line: '*Dr. Tuna, M.D.* *I have some terrible news.* — Wait, are you the patient or the doctor?',
      said: 'Jim を「Dr. Tuna」と呼びながら、医者のように「悪い知らせが」と言う。',
      mean: '相手を医者と呼んだのに、自分が医者の役。その混乱を Jim が突っこむ。',
      trap: '本人の病気の話と取りやすい。呼びかけの Dr. が誰を指すかを聞く。',
      use: 'Wait, which one of us is driving?（待って、運転するのはどっち？）' },

    // R fix: V2 (blind 70 %, right): "sales drop" was weak; "behind after the weekend" (another Monday reading)
    //   replaces it, and the segment runs on to "morale transplant" (17.9 s), which rules it out
    // why: caught the flu ← "come down with a pernicious case" is how illnesses are named, the literal reading;
    //   behind on work ← "the Mondays" heard as a backlog, but the cure is for morale
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'mondays', seg: [5.4, 18.6],
      stem: 'What does Andy say is wrong with the office?',
      choices: ['Everyone feels low, as on a bad Monday', 'Everyone has caught a flu going around',
                'Everyone is behind on work after the weekend'], a: 0,
      cue: 'come down with のあと、何に「かかった」か。',
      line: 'The entire office has *come down with* a pernicious *case of the Mondays*.',
      said: '「オフィス全体が悪性の『月曜病』にかかった」と言う。',
      mean: 'come down with ＝ 病気にかかる。the Mondays は月曜のだるさ。元気のなさを病気にたとえる。',
      trap: '本物の風邪と取りやすい。かかった中身は最後の Mondays。',
      use: 'I think I’m coming down with a cold.（風邪をひきかけてるみたい）' },

    // why: did you ← "do" shrinks to "d'", and a past reading fits a question about chances; would you / could
    //   you ← only the "-d you" ending is caught
    { id: 's1', skill: 'sound', level: 'B2', point: 'chances', seg: [10.3, 13.6],
      stem: 'Fill the gap: “What ___ put our chances at?”',
      choices: ['do you', 'did you', 'would you', 'could you'], a: 0,
      cue: 'What のあと、弱くつながる2語。',
      line: 'What *do you* put our chances at? — Zero percent.',
      said: '「助かる見込みは何％？」と聞き、「ゼロ」と返される。',
      mean: 'What do you が「ワダヤ」のようにつながる。',
      trap: 'd の音だけ拾うと did や would に聞こえやすい。今の見立てを聞くので現在形。',
      use: 'What do you put the odds at?（見込みはどのくらいだと思う？）' },

    // why: bad but polite ← "bad idea" is what's heard, and 悪くない sounds lukewarm in Japanese; brilliant ←
    //   Andy's "Great!" after it, heard as Jim's own word
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'notbad', seg: [32.4, 37.0],
      stem: 'How does Jim react to Andy’s pitch?',
      choices: ['He finds it a fairly good idea', 'He finds it bad but stays polite', 'He finds it a brilliant idea'], a: 0,
      cue: 'Wow のあと、not で始まる評価。',
      line: 'Wow, that’s *not such a bad idea*. — Great!',
      said: '「へえ、悪くない考えだ」と言い、Andy が喜ぶ。',
      mean: 'not such a bad idea ＝ 意外といい考え。控えめだが、はっきり賛成している。',
      trap: 'bad が耳に残ると否定に聞こえる。not such a bad ＝ 「なかなかいい」。',
      use: 'That’s not such a bad idea.（それ、なかなかいい考えだね）' },

    // why: went off to discuss ← "went for" read word by word as "went (somewhere) for"; turned it down ← the
    //   opposite, from a talk that's still going on ("talking to Michael right now")
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'wentfor', seg: [40.1, 44.7],
      stem: 'What does Andy say has happened to their idea?',
      choices: ['They readily agreed to it', 'They went off to discuss it', 'They turned it down flat'], a: 0,
      cue: 'totally のあとの2語。',
      line: 'They *totally went for* our idea.',
      said: '「完全に乗ってきた、僕らのアイデアに」と報告する。',
      mean: 'go for ＝ 案に乗る・受け入れる。totally で「すっかり」と強めている。',
      trap: 'went を「行った」と取ると「相談しに行った」になる。go for ＋ 案 ＝ 賛成。',
      use: 'I think the boss will go for it.（上司は乗ってくると思う）' },

    // R fix: V2 (blind 50 %, right): "the office cheering up" was easy to rule out; "moved up" (a call from the boss
    //   heard as good news) replaces it
    // why: winning it himself ← Dwight usually wants every prize (but he wants it traced away from him); moved up ←
    //   "a phone call from David Wallace" heard as a promotion, until "He will be fired"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'plan', reveals: ['traced'], seg: [40.1, 60.0],
      stem: 'What is Dwight really hoping the award will lead to?',
      choices: ['Jim being fired by his boss', 'Jim being moved up by his boss', 'Winning the award himself'], a: 0,
      cue: 'カメラに向かって話す、最後の短い一文。',
      line: 'Jim will get a phone call from David Wallace. *He will be fired.*',
      said: 'Andy の案に見せかけた賞のあとで、Jim は上から電話を受けてクビになる、とカメラに話す。',
      mean: '賞は職場を明るくするためでなく、Jim を追い出すためのわな。',
      trap: '上司からの電話と聞くと昇進を想像しやすい。カメラへの最後の一言が本当のねらい。',
      use: 'Trust me, I have a plan.（任せて、考えがあるんだ）' },

    // anchor: 46.6–47.6 s "Your idea. — My idea." then 48.8–51.8 s to camera: "I just need Andy to think it's his
    //   idea so it won't get traced back to me"
    // R fix: V2 (blind 65 %, right): the key was the only cynical reading; "a dig" (sarcasm, another cynical reading)
    //   replaces "praise"
    // why: a dig ← the quick "Yeah! Your idea" heard as sarcasm, but he needs Andy to believe it; modesty ← the
    //   Japanese frame: 謙遜, giving credit away to look humble
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'traced', seg: [42.2, 52.3],
      stem: 'After Dwight’s comment to the camera, how should we hear his “Your idea”?',
      choices: ['As cover: so any blame lands on Andy', 'As a dig: he thinks the idea is silly',
                'As modesty: he won’t take the credit'], a: 0,
      cue: '場面の一言と、カメラへの説明を比べて。',
      line: 'our idea. — Yeah! *Your idea.* — My idea. … so it *won’t get traced back to me*.',
      said: 'Andy の「僕らの案」を「君の案」と言い直し、カメラに「自分までたどられないように」と話す。',
      mean: 'カメラへの本音が、直前の一言を書きかえる。ほめ言葉に見えたのは、責任を押しつける準備。',
      trap: '手柄をゆずる言葉は謙遜に聞こえやすい。この形式では、カメラへの一言が答え合わせになる。',
      use: 'It was all your idea, remember?（全部君の案だったよね？）', retired: true },

    // R fix: V2 (blind 65 %, right): "the credit he deserves" was the odd one out next to the scheming key;
    //   "Michael will like it better" (Andy is pitching to Michael) replaces it
    // why: Michael likes it better ← "talking to Michael right now" just before; pitch to David Wallace ← the name
    //   comes up right after
    { id: 'd1', skill: 'detail', level: 'B1', point: 'traced', seg: [44.2, 52.3],
      stem: 'Why does Dwight want Andy to think the idea is his?',
      choices: ['So it won’t be traced back to Dwight', 'So Michael will like the idea better',
                'So Andy will pitch it to David Wallace'], a: 0,
      cue: 'so のあと、me で終わる部分。',
      line: 'I just need Andy to think it’s his idea *so it won’t get traced back to me*.',
      said: '「Andy に自分の案だと思わせたい。そうすれば自分までたどられない」と話す。',
      mean: 'trace back ＝ 元をたどる。失敗したときに自分の名前が出ないようにしている。',
      trap: 'Michael の名前から上司受けと考えやすい。so のあとが本当の理由。',
      use: 'Pay cash so it can’t be traced.（足がつかないよう現金で）' },

    // why: 16 / 60 ← -teen/-ty from "six"; six days ← "approximately" + a long plan heard as days
    { id: 'n1', skill: 'number', level: 'B1', point: 'hours', seg: [53.3, 60.0],
      stem: 'When does Dwight say Jim will get the phone call?',
      choices: ['in about 6 hours', 'in about 16 hours', 'in about 60 hours', 'in about 6 days'], a: 0, keep: true,
      cue: 'approximately のあと、数字と単位。',
      line: '*In approximately six hours*, Jim will get a phone call…',
      said: '「およそ6時間後、Jim に電話がかかってくる」と予告する。',
      mean: 'approximately ＝ およそ。six に -teen も -ty も付かない。',
      trap: 'sixteen や sixty と迷いやすい。語尾の「ティーン」「ティ」の有無を聞く。',
      use: 'We’ll land in about six hours.（あと6時間ほどで着きます）' },

    // R fix: V2 (blind 65 %, right): "Dwight won" and "a vote" were weak; "fair and square" (Jim's own story) and
    //   "Pam earned it" (the next name) replace them
    // why: fair and square ← Jim's "highest overall score" taken as what the room accepts; Pam earned it ← she is
    //   named next, but the cake for Jim swings it back
    { id: 'g2', skill: 'gist', level: 'C1', point: 'rigged', reveals: ['cake', 'tally'], seg: [60.0, 201.0],
      stem: 'How does the award end up looking for Jim?',
      choices: ['As if he rigged it to reward himself', 'As if he had won it fair and square',
                'As if Pam had really earned it instead'], a: 0,
      cue: '最後に届く物と、みんなの反応。',
      line: 'I have an order here for a custom cake, Jim Halpert. … *He knew all along!*',
      said: 'Jim が選ばれ、次に Pam、最後に Jim あてのケーキが届き、皆が「知ってたんだ」と騒ぐ。',
      mean: '何をしても自分で仕組んだように見える。Dwight のねらいどおり。',
      trap: 'score から公平な決め方と取りやすいが、場面が進むほど疑いが深まる。',
      use: 'This looks bad, but I can explain.（まずく見えるけど、説明させて）' },

    // R fix: N1: the line quoted "in my eyes" (whisper; the captions have "of my house"); it's trimmed to the words
    //   both share
    // why: hinting he won ← "no matter who gets this" heard as false modesty before his own name; not given ←
    //   "you are all employees of the month" taken literally
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'allofyou', seg: [61.6, 69.6],
      stem: 'Before the winner is named, what is the speaker doing?',
      choices: ['Comforting everyone who won’t win', 'Hinting strongly that he has won',
                'Saying the award will not be given'], a: 0,
      cue: 'no matter who のあと、全員に向けた一言。',
      line: 'no matter who gets this… you guys are *all employees of the month*…',
      said: '「誰が選ばれても、みんな月間MVPだと思ってる」と、発表の前に言う。',
      mean: '発表前の決まった前置き。選ばれなかった人の気持ちを先に和らげている。',
      trap: '「全員が受賞」と文字どおり取ると、賞がないことになる。このあと発表は続く。',
      use: 'You’re all winners to me.（僕にとってはみんなが勝者だ）' },

    // why: pleased but modest ← the usual winner's script; angry at Andy ← "your idea anyway" comes later
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'flustered', seg: [82.4, 91.5],
      stem: 'When his name is read out, how does Jim react?',
      choices: ['Flustered; he can’t finish a sentence', 'Pleased, though trying to look modest',
                'Angry, and ready to blame Andy'], a: 0,
      cue: '同じ形で始まって、終わらない文の数。',
      line: 'Okay, wait. *I was not… I did not… That was not…*',
      said: '「待って、僕は…してない…そうじゃ…」と、どの文も最後まで言えない。',
      mean: '言いかけてやめる文が続くのは、あわてて言葉が出ない合図。',
      trap: '受賞者らしく照れていると取りやすいが、not で切れる文は否定しようとしている。',
      use: 'Wait, I didn’t… that’s not what I meant.（待って、そういう意味じゃ…）' },

    // R fix: V2 (blind 50 %, right): "the boss's favorite" was weak; the choices are now crossed pairs (score/vote,
    //   with/without names)
    // why: a secret vote ← "anonymous" heard as a secret ballot; names shown ← "score" is right, but "I didn't even
    //   know who was on here" rules out names
    { id: 'd2', skill: 'detail', level: 'B2', point: 'score', seg: [93.0, 101.9],
      stem: 'How does Jim say the winner was picked?',
      choices: ['By overall score, without names', 'By a secret vote, without names',
                'By overall score, with names shown'], a: 0,
      cue: 'anonymous と、最後の highest のあと。',
      line: 'This was *anonymous*… I just gave it to the employee with the *highest overall score*.',
      said: '「名前は伏せてあった。総合点が一番の人に渡しただけ」と言う。',
      mean: 'anonymous ＝ 名前を伏せた。だから自分を選べたはずがない、という言い分。',
      trap: 'anonymous を「無記名投票」と結びつけやすい。決め方は最後の score で言っている。',
      use: 'The survey is anonymous.（アンケートは無記名です）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'myself', seg: [95.1, 98.0],
      stem: 'Type: “There’s no way I ___ to myself.” (4 words)', answer: 'could have given it',
      cue: '「There’s no way I」のあと、速い4語。',
      line: 'There’s no way I *could have given it* to myself',
      said: '「自分で自分に賞をあげられたはずがない」と言う。',
      mean: 'could have が「クダヴ」、given it が「ギヴニッ」とつながる。',
      trap: 'have が弱く「ア」だけになり、could given と書きやすい。could have ＋ 過去分詞。',
      use: 'I could have told you that.（それなら教えてあげられたのに）' },

    // R fix: V2 (blind 60 %, right): "prizes too small" was weak; "should share them out" ("from all of us") replaces it
    //   A cold re-read still found it at 70 %, so "share them out" became "buy their support" (a second cynical reading)
    // why: earned more ← the list heard as congratulations; buy support ← "from all of us" heard as Jim giving to
    //   them, but "won back your own" has the prizes going to him
    { id: 'i3', skill: 'infer', level: 'C1', point: 'tally', reveals: ['cash'], seg: [101.3, 108.7],
      stem: 'What is the speaker suggesting by listing what Jim has won?',
      choices: ['That Jim has handed rewards to himself', 'That Jim has earned more than he thinks',
                'That Jim is trying to buy their support'], a: 0,
      cue: 'won のあとの back と your own。',
      line: 'you just *won back your own parking spot*, a vacation day, and a nice tidy quarter of $1,000…',
      said: '駐車場所、休み1日、お金まで、と Jim の取り分を数える。',
      mean: 'won back your own ＝ 自分のものを取り戻した。自分にごほうび、という当てこすり。',
      trap: '祝いに聞こえやすいが、your own と from all of us がとげ。',
      use: 'Nice work getting your own way.（自分の思いどおりにできてよかったね）' },

    // why: $25 ← "quarter" heard as 25 (cents, a quarter = 25); $1,000 ← the last number said; $400 ← a filler
    //   near "four" in quarter
    { id: 'n2', skill: 'number', level: 'B2', point: 'cash', seg: [104.3, 108.7],
      stem: 'How much cash does the speaker say Jim has won?',
      choices: ['$25', '$250', '$400', '$1,000'], a: 1, keep: true,
      cue: 'quarter のあと、何の4分の1か。',
      line: 'and a nice tidy *quarter of $1,000* from all of us.',
      said: '「みんなから千ドルの4分の1」と言う。つまり250ドル。',
      mean: 'quarter of ＝ 4分の1。quarter だけなら25セント硬貨のことも多い。',
      trap: 'quarter ＝ 25 と覚えていると$25を選びやすい。of のあとの数の4分の1と考える。',
      use: 'A quarter of the cake is left.（ケーキが4分の1残ってる）' },

    // R fix: V2 (blind 65 %, right) + K6: the key was the only choice quoting the clip ("in an ideal world"); it's now
    //   a paraphrase, and "Andy's pitch" replaces "the boss"
    // why: Andy's pitch ← he sold the award, so a promise from him seems likely; the rules ← "there would be a cash
    //   prize" heard as written terms
    { id: 'd4', skill: 'detail', level: 'B1', point: 'ideal', seg: [116.6, 120.5],
      stem: 'Why does Dwight think there was a cash prize?',
      choices: ['Jim had said one would be ideal', 'Andy had promised one in his pitch',
                'The rules said there would be one'], a: 0,
      cue: '「you said」のあと、world の前の語。',
      line: 'you said *in an ideal world* there would be a cash prize.',
      said: 'Dwight が「理想の世界なら賞金がある、って言ったよね？」と言い返す。',
      mean: 'Jim の「理想を言えば」という話を、本当の約束のように受け取っている。',
      trap: 'Andy の売りこみでの約束と考えやすい。根拠は you said のあとの言葉。',
      use: 'In an ideal world, we’d all work less.（理想を言えば、みんなもっと休める）' },

    // why: promising what he can't pay ← "someone would get money, but not…" heard as an unkept promise; a dream
    //   world ← "perfect world" heard as calling Jim unrealistic
    { id: 'i4', skill: 'infer', level: 'C1', point: 'perfect', seg: [120.0, 128.2],
      stem: 'What does the reply about Jim’s “perfect world” accuse him of?',
      choices: ['Wanting all the money for himself', 'Promising prizes he can never pay',
                'Living in a dream, not the real world'], a: 0,
      cue: 'your と only you が強く聞こえるところ。',
      line: 'Yeah, but in *your* perfect world, *only you get money*.',
      said: '「君の理想の世界では、お金をもらうのは君だけ」と返す。',
      mean: 'Jim の言葉をそのまま使って、自分だけ得をしたい人だと皮肉っている。',
      trap: 'perfect world から「夢見がち」と取りやすい。only you get money が言いたいこと。',
      use: 'Sure, in your perfect world.（はいはい、君の理想の世界ではね）' },

    // R fix: V2 (blind 55 %, right): "a kind joke" was weak; "a rumor" (a reason from outside) replaces it
    // why: doesn't look pregnant ← looks are never said, and she is (she says so next); a rumor ← "Guys" sounds like
    //   passing on gossip, but "I'm starting to think" is his own leap
    { id: 'h3', skill: 'humor', level: 'C1', point: 'pregnant', seg: [143.2, 150.0],
      stem: 'Why does the remark about Pam’s pregnancy get a laugh?',
      choices: ['One mix-up has him doubting everything', 'He has noticed she doesn’t look pregnant',
                'He has heard a rumor going around'], a: 0,
      cue: '「I’m starting to think」が何を疑っているか。',
      line: 'Guys, *I’m starting to think* Pam’s not even pregnant.',
      said: '賞の手違いの話の最中に、「Pam は妊娠もしてないんじゃないか」と言い出す。',
      mean: '一つの疑いが、関係ないことまで広がっている。飛躍の大きさがおかしい。',
      trap: '見た目の話と取りやすいが、何も言っていない。starting to think は疑いの始まり。',
      use: 'I’m starting to think he’s lost.（あいつ迷ってるんじゃないかと思えてきた）' },

    // R fix: V2 (blind 55 %, right): "complaint" and "taping" were weak; "the minutes" (record = 記録) and "a
    //   confession" replace them
    // why: the minutes ← record = 記録, the literal reading; a confession ← "I am pregnant" heard as news, but he has
    //   just said "not even pregnant", so she is confirming what's known
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'record', seg: [146.9, 150.0],
      stem: 'Why does Pam open her reply with the phrase she uses?',
      choices: ['To state a plain fact, once and for all', 'To have her words written in the minutes',
                'To admit to something she had kept quiet'], a: 0,
      cue: '答えの最初の3語。',
      line: '*For the record*, I am pregnant',
      said: '「言っておくけど、妊娠してます」と答える。',
      mean: 'for the record ＝ 念のためはっきり言っておく。うわさや疑いを打ち消すときの前置き。',
      trap: 'record を「記録」と取ると議事録の話になる。文頭なら「言っておくと」。',
      use: 'For the record, I was right.（言っておくけど、私が正しかった）' },

    // R fix: V2 (blind 60 %, right): "too slow" was weak; "she should be picked next" (her name comes up next)
    //   replaces it. S3: the cue named "move on", a word only the key has
    // why: asking why ← "why doesn't Jim" read as a real why-question; picked next ← her name is the next one read,
    //   but she asks for "the next highest score", not herself
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'next', seg: [149.2, 158.0],
      stem: 'When Pam asks why Jim doesn’t pick the next name, what is she doing?',
      choices: ['Suggesting a simple way to move on', 'Asking why Jim hasn’t done it yet',
                'Hinting that she should be picked next'], a: 0,
      cue: '質問の形と、最後に付け足す一言。',
      line: 'so *why doesn’t Jim just pick the next highest score* on the list, and we’ll move on?',
      said: '「次に点の高い人を選べばいい。それで先に進もう」と言う。',
      mean: 'why doesn’t ～ just …? ＝ 「…したら？」という提案。理由は聞いていない。',
      trap: 'why を理由の疑問と取りやすい。why doesn’t ＋ just は軽い提案の形。',
      use: 'Why don’t we just order in?（出前にしない？）' },

    // why: Jim's again ← the same mix-up repeating; Dwight's ← he has argued for a prize and is "Yes!" earlier
    { id: 'd5', skill: 'detail', level: 'B1', point: 'pam', seg: [160.8, 169.6],
      stem: 'Whose name comes up with the next highest score?',
      choices: ['It’s Pam’s name', 'It’s Dwight’s name', 'It’s Jim’s name again'], a: 0,
      cue: '「employee number three」のあと、最後の名前。',
      line: 'That would be employee number three, which is… *Pam Halpert*.',
      said: '次点は3番の社員。読み上げると、提案した Pam 本人だった。',
      mean: 'which is のあとが名前。提案した本人が選ばれ、また疑いが向く。',
      trap: '途中で言葉を飲みこむので、名前の前で聞くのをやめやすい。最後まで待つ。',
      use: 'And the winner is… me?（そして勝者は…私？）' },

    // R fix: V2 (blind 70 %, right): "wrong on purpose" was weak; "his guess is too low" (the opposite reading of
    //   "Two to four?") replaces it
    // why: she lied ← "From what?" heard as catching a lie, but she says "Yup"; too low ← "Two to four?" heard as
    //   an insult she corrects, which her "Yup" rules out
    { id: 'h4', skill: 'humor', level: 'C1', point: 'doubled', seg: [179.0, 188.6],
      stem: 'Why does the question about her sales get a laugh?',
      choices: ['Doubling sounds big, but the base is tiny', 'She lied, and her sales really went down',
                'His guess is far too low, and she says so'], a: 0,
      cue: '「From what?」のあとの数と、短い返事。',
      line: 'I *doubled my sales* last month. — From what? *Two to four?* — Yup.',
      said: '「売上を倍にした」と言うと、「2件から4件？」と聞かれ、「そう」と答える。',
      mean: '「倍」は立派に聞こえるが、元が2件なら4件。小さい数で大きな言葉を使うおかしさ。',
      trap: '「うそを見抜いた」と取りやすいが、返事は Yup。数の小ささが笑いどころ。',
      use: 'Our sales doubled—from one to two.（売上が倍に、1から2に）' },

    // anchor: 189.2 s "this isn't some elaborate scam" → 193.4 s "a custom cake, Jim Halpert" → 198.4 s "I didn't
    //   order the cake" → 205.8 s "He knew all along": a custom cake has to be ordered ahead, so it reads as proof
    // R fix: V2 (blind 75 %, right): "meant for Pam" was weak; "he's celebrating" (a near miss: his cake, but no
    //   foreknowledge) replaces it
    // why: the office thanking him ← cakes at work usually come from colleagues (broken script); celebrating ← his
    //   name is on it, but "He knew all along" accuses him of knowing ahead
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'cake', seg: [189.0, 207.5],
      stem: 'When the cake arrives, how does it turn Jim’s denial against him?',
      choices: ['A cake ordered ahead means he knew he’d win', 'A cake shows the office planned to thank him',
                'A cake in his name means he’s celebrating'], a: 0,
      cue: 'scam を否定した直後に届く物と、custom の一語。',
      line: 'this isn’t some *elaborate scam*… I have an order here for a *custom cake*, Jim Halpert. … *He knew all along!*',
      said: '「詐欺じゃない」と言った直後、Jim の名前でケーキが届き、皆が「知ってたんだ」と叫ぶ。',
      mean: '特注のケーキは前もって頼むもの。受賞を知っていた証拠に見え、否定が逆効果になる。',
      trap: '職場のケーキはお祝い、という型で聞きやすい。否定の直後に何が届いたかで、疑いの向きが決まる。',
      use: 'Bad timing for a delivery.（配達のタイミングが悪すぎる）', retired: true },
  ]
};
