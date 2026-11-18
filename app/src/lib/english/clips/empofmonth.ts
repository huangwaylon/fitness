// A2 REVIEW 2026-11-17: keep 3, rewrite 15, retire 4, new 0
// “Employee of the Month - The Office US” (the official The Office channel, BEST OF SEASON 6): Andy pitches an
// employee-of-the-month award to Jim, Dwight explains to the camera that it's a trap to get Jim fired, and the
// ceremony goes wrong for Jim, then for Pam, and ends with a cake Jim never ordered.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 211 s. Andy, Jim and Dwight are named
// in Dwight's talking head (48.8–59.3 s); Dwight (116.6, 120.7 s) and Pam (160.1, 173.3 s) in the scene. Untested on
// purpose: 0–5 s, 27–32 s, 40.6 s, 66.4–68.4 s, 79–82 s (crowd overlap), 120–146 s (the "perfect world" jab, who says
// "your idea", the pregnancy aside), 165–167 s (a bleeped swear), 200–207 s (crowd shouts; only "He knew all along").
// EAR CHECK: 82.9–91.0 s a2 — the stammer (“I was not… I did not…”) is Jim's (assumed from what follows)
// EAR CHECK: 180.6–188.1 s h4 — “I doubled my sales last month” and “Yup” are Pam's (assumed from turn-taking)
import type { Clip } from '../types.ts';

export const empOfMonth: Clip = {
  id: 'empofmonth', video: 'xwlNGHoOjKA', title: 'Employee of the Month', dur: 230, wpm: 145, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: looks unwell ← a sickness opening, but nothing is said about Andy's health (and looks aren't tested);
    //   his own health ← "terrible news" heard as news about himself
    { id: 'h1', skill: 'humor', level: 'C1', point: 'doctor', seg: [1.7, 6.4], retired: true,
      stem: 'Why does Jim ask Andy if he is the patient or the doctor?',
      choices: ['Andy calls Jim a doctor, then talks like one', 'Andy sounds as if he has caught something',
                'Andy says the bad news is about his health'], a: 0,
      cue: '最初の呼びかけと、そのあとの言い方。',
      line: '*Dr. Tuna, M.D.* *I have some terrible news.* — Wait, are you the patient or the doctor?',
      said: 'Jim を「Dr. Tuna」と呼びながら、医者のように「悪い知らせが」と言う。',
      mean: '相手を医者と呼んだのに、自分が医者の役。その混乱を Jim が突っこむ。',
      trap: '本人の病気の話と取りやすい。呼びかけの Dr. が誰を指すかを聞く。',
      use: 'Wait, which one of us is driving?（待って、運転するのはどっち？）' },

    { id: 'f1', skill: 'phrase', level: 'B2', point: 'mondays', seg: [4.4, 13],
      stem: 'What does “come down with” mean here?', ja: 'ここでの “come down with” はどういう意味？',
      choices: ['Catch, like an illness', 'Go downstairs with', 'Get angry about'], a: 0,
      choicesJa: ['（病気に）かかる', '〜と一緒に下りる', '〜に怒る'],
      cue: '「The entire office has」のあと',
      line: 'The entire office has *come down with* a pernicious *case of the Mondays*.',
      said: '「オフィス全体が悪性の『月曜病』にかかった」と言う。',
      mean: 'come down with 〜 ＝ （病気に）かかる。the Mondays は月曜のだるさ。元気のなさを病気にたとえている。',
      trap: 'down から「下りる」と思いやすい。come down with ＋病気で「かかる」。',
      use: 'I think I’m coming down with a cold.（風邪をひきかけてるみたい）' },

    { id: 's1', skill: 'sound', level: 'B2', point: 'chances', seg: [9.2, 14.2],
      stem: 'Fill the gap: “What ___ put our chances at?”', ja: '空所に入るのは？ “What ___ put our chances at?”',
      choices: ['do you', 'did you', 'would you'], a: 0,
      choicesJa: ['（今）〜する', '〜した', '〜するだろう'],
      cue: 'What のあと',
      line: 'What *do you* put our chances at? — Zero percent.',
      said: '「助かる見込みは何パーセント？」と聞き、「ゼロ」と返される。',
      mean: 'What do you が「ワダヤ」のようにつながる。put our chances at 〜 ＝ 見込みを〜と見る。',
      trap: 'did you なら「ディジュ」、would you なら「ウッジュ」。「ワダヤ」と聞こえれば do you。',
      use: 'What do you think our chances are?（見込みはどのくらいだと思う？）' },

    { id: 'a1', skill: 'attitude', level: 'B1', point: 'notbad', seg: [31, 37.6],
      stem: 'What does Jim think of Andy’s idea?', ja: 'ジムはアンディの考えをどう思う？',
      choices: ['He thinks it’s pretty good', 'He hates it, but is polite', 'He thinks it’s brilliant'], a: 0,
      choicesJa: ['なかなかいいと思う', 'いやだけど、ていねいに言う', 'すばらしいと思う'],
      cue: 'Wow のあと',
      line: 'Wow, that’s *not such a bad idea*. — Great!',
      said: '「へえ、悪くない考えだ」と言い、アンディが喜ぶ。',
      mean: 'not such a bad idea ＝ 意外といい考え。控えめだが、はっきり賛成している。',
      trap: 'bad が耳に残ると、反対だと思いやすい。not such a bad ＝「なかなかいい」。',
      use: 'That’s not such a bad idea.（それ、なかなかいい考えだね）' },

    { id: 'f2', skill: 'phrase', level: 'B2', point: 'wentfor', seg: [40.1, 45.7],
      stem: 'What does “They totally went for our idea” mean?', ja: '“They totally went for our idea” はどういう意味？',
      choices: ['They liked our idea', 'They went to talk about it', 'They said no to it'], a: 0,
      choicesJa: ['アイデアに乗ってきた', '相談しに行った', '断った'],
      cue: '「totally」のあと',
      line: 'They *totally went for* our idea.',
      said: '「完全に乗ってきた、僕らのアイデアに」と報告する。',
      mean: 'go for 〜 ＝ （案に）乗る、受け入れる。totally で「すっかり」と強めている。',
      trap: 'went を「行った」と思うと、相談しに行った話に聞こえやすい。go for ＋案 ＝ 賛成。',
      use: 'I think the boss will go for it.（上司は乗ってくると思う）' },

    { id: 'g1', skill: 'gist', level: 'B1', point: 'plan', seg: [40.1, 62.4],
      stem: 'What does Dwight hope the award will lead to?', ja: 'ドワイトは、この賞が何につながってほしい？',
      choices: ['Jim getting fired', 'Jim getting promoted', 'Dwight winning it'], a: 0,
      choicesJa: ['ジムがクビになる', 'ジムが昇進する', 'ドワイトが受賞する'],
      cue: 'カメラへの最後の短い一文',
      line: 'Jim will get a phone call from David Wallace. *He will be fired.*',
      said: 'アンディの案に見せかけた賞のあとで、ジムは上から電話を受けてクビになる、とカメラに話す。',
      mean: 'be fired ＝ クビになる。賞は職場を明るくするためでなく、ジムを追い出すためのわな。',
      trap: '上司からの電話と聞くと、昇進を思いやすい。最後の He will be fired が本当のねらい。',
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

    { id: 'd1', skill: 'detail', level: 'B1', point: 'traced', seg: [44.2, 53.6],
      stem: 'Why should Andy think the idea is his?', ja: 'なぜアンディに、自分の案だと思わせたい？',
      choices: ['So no one traces it to Dwight', 'So Michael likes it more', 'So Andy tells David Wallace'], a: 0,
      choicesJa: ['ドワイトまでたどられないように', 'マイケルがもっと気に入るように', 'アンディが上司に話すように'],
      cue: '「so」のあと',
      line: 'I just need Andy to think it’s his idea *so it won’t get traced back to me*.',
      said: '「アンディに自分の案だと思わせたい。そうすれば自分までたどられない」と話す。',
      mean: 'trace back ＝ 元をたどる。失敗したとき、自分の名前が出ないようにしている。',
      trap: 'マイケルの名前から、上司受けのためと思いやすい。so のあとが本当の理由。',
      use: 'Pay cash so it can’t be traced.（足がつかないよう現金で）' },

    { id: 'n1', skill: 'number', level: 'B1', point: 'hours', seg: [52.3, 60], keep: true,
      stem: 'When does Dwight say Jim gets the call?', ja: 'ドワイトは、ジムに電話が来るのはいつだと言う？',
      choices: ['in about 6 hours', 'in about 16 hours', 'in about 60 hours', 'in about 6 days'], a: 0,
      choicesJa: ['約6時間後', '約16時間後', '約60時間後', '約6日後'],
      cue: '「approximately」のあと',
      line: '*In approximately six hours*, Jim will get a phone call…',
      said: '「およそ6時間後、ジムに電話がかかってくる」と予告する。',
      mean: 'approximately ＝ およそ。six に -teen も -ty も付かない。',
      trap: '16 なら「ティーン」、60 なら「ティ」が付く。days なら「デイズ」。「シックス・アワーズ」なら6時間。',
      use: 'We’ll land in about six hours.（あと6時間ほどで着きます）' },

    { id: 'p1', skill: 'pragma', level: 'B1', point: 'allofyou', seg: [61.6, 69.6],
      stem: 'Why does Jim say “you’re all employees of the month”?', ja: 'ジムはなぜ “you’re all employees of the month” と言う？',
      choices: ['To be kind to everyone', 'To give everyone a prize', 'To say there’s no award'], a: 0,
      choicesJa: ['みんなにやさしくするため', 'みんなに賞をあげるため', '賞はないと言うため'],
      cue: '「no matter who」のあと',
      line: 'no matter who gets this… you guys are *all employees of the month*…',
      said: '「誰が選ばれても、みんな月間MVPだと思ってる」と、発表の前に言う。',
      mean: 'no matter who 〜 ＝ 誰が〜しても。選ばれなかった人の気持ちを先にやわらげる、決まった前置き。',
      trap: '「全員が受賞」と字のまま取りやすい。このあと一人を発表するので、やさしい前置き。',
      use: 'You’re all winners to me.（僕にとってはみんなが勝者だ）' },

    { id: 'a2', skill: 'attitude', level: 'B1', point: 'flustered', seg: [81.4, 91.4],
      stem: 'How does Jim react when his name is read?', ja: '名前を読まれて、ジムはどう反応する？',
      choices: ['Flustered, can’t finish', 'Pleased, but acts modest', 'Angry at Andy'], a: 0,
      choicesJa: ['あわてて、言い終えられない', 'うれしいが、けんそんする', 'アンディに怒る'],
      cue: '終わらない文の数',
      line: 'Okay, wait. *I was not… I did not… That was not…*',
      said: '「待って、僕は…してない…そうじゃ…」と、どの文も最後まで言えない。',
      mean: '言いかけてやめる文が続くのは、あわてて言葉が出ないしるし。',
      trap: '受賞して照れていると思いやすい。not で切れる文は、否定しようとしている。',
      use: 'Wait, I didn’t… that’s not what I meant.（待って、そういう意味じゃ…）' },

    { id: 'd2', skill: 'detail', level: 'B2', point: 'score', seg: [91.6, 101.8],
      stem: 'How does Jim say the winner was picked?', ja: 'ジムは、受賞者をどう選んだと言う？',
      choices: ['By score, without names', 'By a secret vote', 'By score, with names'], a: 0,
      choicesJa: ['名前を伏せて、点数で', '秘密の投票で', '名前を見て、点数で'],
      cue: '「anonymous」と「highest」のあと',
      line: 'This was *anonymous*… I just gave it to the employee with the *highest overall score*.',
      said: '「名前は伏せてあった。総合点がいちばんの人に渡しただけ」と言う。',
      mean: 'anonymous ＝ 名前を伏せた。だから自分を選べたはずがない、という言い分。',
      trap: 'anonymous から「無記名投票」を思いやすい。決め方は score（点数）。',
      use: 'The survey is anonymous.（アンケートは無記名です）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'myself', seg: [94.1, 100],
      stem: 'Type: “There’s no way I ___ to myself.” (4 words)', ja: '書こう：“There’s no way I ___ to myself.”（4語）',
      answer: 'could have given it',
      cue: '「There’s no way I」のあと',
      line: 'There’s no way I *could have given it* to myself',
      said: '「自分で自分に賞をあげられたはずがない」と言う。',
      mean: 'could have ＋過去分詞 ＝ 〜できたかもしれない。could have が「クダヴ」、given it が「ギヴニッ」。',
      trap: 'have が弱く「ア」だけになり、could given と書きやすい。could のあとに have がある。',
      use: 'I could have told you that.（それなら教えてあげられたのに）' },

    // R fix: V2 (blind 60 %, right): "prizes too small" was weak; "should share them out" ("from all of us") replaces it
    //   A cold re-read still found it at 70 %, so "share them out" became "buy their support" (a second cynical reading)
    // why: earned more ← the list heard as congratulations; buy support ← "from all of us" heard as Jim giving to
    //   them, but "won back your own" has the prizes going to him
    { id: 'i3', skill: 'infer', level: 'C1', point: 'tally', reveals: ['cash'], seg: [101.3, 108.7], retired: true,
      stem: 'What is the speaker suggesting by listing what Jim has won?',
      choices: ['That Jim has handed rewards to himself', 'That Jim has earned more than he thinks',
                'That Jim is trying to buy their support'], a: 0,
      cue: 'won のあとの back と your own。',
      line: 'you just *won back your own parking spot*, a vacation day, and a nice tidy quarter of $1,000…',
      said: '駐車場所、休み1日、お金まで、と Jim の取り分を数える。',
      mean: 'won back your own ＝ 自分のものを取り戻した。自分にごほうび、という当てこすり。',
      trap: '祝いに聞こえやすいが、your own と from all of us がとげ。',
      use: 'Nice work getting your own way.（自分の思いどおりにできてよかったね）' },

    { id: 'n2', skill: 'number', level: 'B2', point: 'cash', seg: [101.6, 112.1], keep: true,
      stem: 'How much cash is Jim told he has won?', ja: 'ジムは賞金をいくらもらったと言われる？',
      choices: ['$25', '$250', '$400', '$1,000'], a: 1,
      choicesJa: ['25ドル', '250ドル', '400ドル', '1,000ドル'],
      cue: '「quarter」のあと',
      line: 'and a nice tidy *quarter of $1,000* from all of us.',
      said: '「みんなから千ドルの4分の1」と言う。つまり250ドル。',
      mean: 'quarter of 〜 ＝ 〜の4分の1。quarter だけなら25セント硬貨のことも多い。',
      trap: '「クォーター」だけなら25、「サウザンド」だけなら1,000。「フォー」は聞こえない。両方で250。',
      use: 'A quarter of the cake is left.（ケーキが4分の1残ってる）' },

    { id: 'd4', skill: 'detail', level: 'B1', point: 'ideal', seg: [115.4, 120.4],
      stem: 'Why does Dwight think there was a cash prize?', ja: 'ドワイトはなぜ、賞金があると思った？',
      choices: ['Jim had mentioned one', 'Andy promised one', 'The rules said so'], a: 0,
      choicesJa: ['ジムが話に出していた', 'アンディが約束した', 'ルールにあった'],
      cue: '「you said」のあと',
      line: 'you said *in an ideal world* there would be a cash prize.',
      said: 'ドワイトが「理想の世界なら賞金がある、って言ったよね？」と言い返す。',
      mean: 'in an ideal world ＝ 理想を言えば。ジムの「理想なら」の話を、本当の約束のように受け取っている。',
      trap: 'アンディの約束だと思いやすい。理由は you said のあとの言葉。',
      use: 'In an ideal world, we’d all work less.（理想を言えば、みんなもっと休める）' },

    // why: promising what he can't pay ← "someone would get money, but not…" heard as an unkept promise; a dream
    //   world ← "perfect world" heard as calling Jim unrealistic
    { id: 'i4', skill: 'infer', level: 'C1', point: 'perfect', seg: [120.0, 128.2], retired: true,
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
    { id: 'h3', skill: 'humor', level: 'C1', point: 'pregnant', seg: [143.2, 150.0], retired: true,
      stem: 'Why does the remark about Pam’s pregnancy get a laugh?',
      choices: ['One mix-up has him doubting everything', 'He has noticed she doesn’t look pregnant',
                'He has heard a rumor going around'], a: 0,
      cue: '「I’m starting to think」が何を疑っているか。',
      line: 'Guys, *I’m starting to think* Pam’s not even pregnant.',
      said: '賞の手違いの話の最中に、「Pam は妊娠もしてないんじゃないか」と言い出す。',
      mean: '一つの疑いが、関係ないことまで広がっている。飛躍の大きさがおかしい。',
      trap: '見た目の話と取りやすいが、何も言っていない。starting to think は疑いの始まり。',
      use: 'I’m starting to think he’s lost.（あいつ迷ってるんじゃないかと思えてきた）' },

    { id: 'f3', skill: 'phrase', level: 'B1', point: 'record', seg: [146.9, 150], retired: true,
      stem: 'What does “For the record” mean?', ja: '“For the record” はどういう意味？',
      choices: ['Just to be clear', 'Please write this down', 'I have a secret'], a: 0,
      choicesJa: ['はっきり言っておくと', 'これを書きとめて', '秘密があるの'],
      cue: '答えの最初の3語',
      line: '*For the record*, I am pregnant',
      said: '「言っておくけど、妊娠してます」と答える。',
      mean: 'for the record ＝ 念のため、はっきり言っておく。うわさや疑いを打ち消すときの前置き。',
      trap: 'record を「記録」と思うと、書きとめる話に聞こえやすい。文の頭なら「言っておくと」。',
      use: 'For the record, I was right.（言っておくけど、私が正しかった）' },

    { id: 'p2', skill: 'pragma', level: 'B1', point: 'next', seg: [149.2, 158], retired: true,
      stem: 'What does Pam mean by “why doesn’t Jim just pick”?', ja: 'パムの “why doesn’t Jim just pick” はどういう意味？',
      choices: ['Jim can just pick the next one', 'She wants to know Jim’s reason', 'Jim should keep the award'], a: 0,
      choicesJa: ['ジムが次の人を選べばいい', 'ジムの理由を知りたい', 'ジムが賞をもらっておけばいい'],
      cue: '質問の形と、最後の一言',
      line: 'so *why doesn’t Jim just pick the next highest score* on the list, and we’ll move on?',
      said: '「次に点の高い人を選べばいい。それで先に進もう」と言う。',
      mean: 'why doesn’t 〜 just …? ＝ 〜が…したら？という提案。理由は聞いていない。',
      trap: 'why から、理由を聞いていると思いやすい。why doesn’t ＋ just は軽い提案。',
      use: 'Why don’t we just order in?（出前にしない？）' },

    { id: 'd5', skill: 'detail', level: 'B1', point: 'pam', seg: [159.8, 169.9],
      stem: 'Whose name comes up with the next highest score?', ja: '次に点数が高いのは誰？',
      choices: ['It’s Pam’s name', 'It’s Dwight’s name', 'It’s Jim’s name again'], a: 0,
      choicesJa: ['パム', 'ドワイト', 'またジム'],
      cue: '「employee number three」のあと',
      line: 'That would be employee number three, which is… *Pam Halpert*.',
      said: '次点は3番の社員。読み上げると、提案したパム本人だった。',
      mean: 'which is のあとが名前。提案した本人が選ばれ、また疑いが向く。',
      trap: '途中で言葉を飲みこむので、名前の前で聞くのをやめやすい。最後まで待つ。',
      use: 'And the winner is… me?（そして勝者は…私？）' },

    { id: 'g2', skill: 'gist', level: 'B2', point: 'rigged', seg: [160.8, 205],
      stem: 'How do the others see Jim at the end?', ja: '最後に、みんなはジムをどう見ている？',
      choices: ['As if he set it all up', 'As if he won it fairly', 'As if Pam deserved it'], a: 0,
      choicesJa: ['全部ジムが仕組んだように', '公平に勝ったように', 'パムがふさわしかったように'],
      cue: '最後に届く物と、みんなの声',
      line: 'I have an order here for a custom cake, Jim Halpert. … *It could only be you!*',
      said: '最後にジムあてのケーキが届き、みんなが「あなたしかいない！」と騒ぐ。',
      mean: 'It could only be you ＝ あなたしかありえない。何をしても、ジムが仕組んだと見られる。',
      trap: 'score（点数）から、公平に決まったと思いやすい。最後の It could only be you を聞く。',
      use: 'This looks bad, but I can explain.（まずく見えるけど、説明させて）' },

    { id: 'h4', skill: 'humor', level: 'B1', point: 'doubled', seg: [179, 189.4],
      stem: 'Pam doubled her sales. To how many?', ja: 'パムは売上を倍にした。何件になった？',
      choices: ['4', '12', '20'], a: 0,
      choicesJa: ['4件', '12件', '20件'],
      cue: '「From what?」のあと',
      line: 'I *doubled my sales* last month. — From what? *Two to four?* — Yup.',
      said: '「売上を倍にした」と言うと、「2件から4件？」と聞かれ、「そう」と答える。',
      mean: 'double ＝ 2倍にする。「倍」は立派に聞こえるが、元が2なら4。小さい数で大きな言葉を使うのが笑い。',
      trap: '「トゥー・トゥ」は twenty（トゥエニ）や twelve（トゥエルヴ）に似るが、最後が「フォー」なら4。',
      use: 'Our sales doubled, from one to two.（売上が倍に、1から2に）' },

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
