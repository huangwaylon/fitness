// “This is my Boyfriend Derek | Parks and Recreation” (the official Parks and Recreation channel, Season 2): April
// brings Derek and Ben to thank Leslie for the penguin wedding and invite her to a party; then Marsha from a family
// group demands she annul the wedding or resign.
// REVIEW 2026-11-16: pass 8, fix 16, drop 0, new 0; ear checks 1
// REVIEW open: nt2's seg is 24.1 s, over the 15 s test limit but within native-level.md's 25 s for a talking-head item
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈184 s. Untested: 79–82 s (Donna's
// “turn somebody” line), 98–101 s (whisper “I love your talk”, captions “I love your top”), 105–107 s (who says “I
// have nothing to do with this”), 161–166 s (Marsha's view of gay marriage), 173–183 s (the directions exchange;
// whisper “Annul the wedding!”, captions “and all the wedding”).
// EAR CHECK: 20.3–22 s a1 — “Oh. Yeah. Sure.” taken as Leslie's (whisper splits it into turns; “No.” may be April's)
import type { Clip } from '../types.ts';

export const thisIsMyBoyfriendDerek: Clip = {
  id: 'derek', video: 'Nlb5vTI910E', title: 'This is my Boyfriend Derek', dur: 204, wpm: 150,
  band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: blind 55 % (the title names Derek as "my boyfriend", so "her own boyfriend" fell away). Now three
    //   "Derek's …" choices. The stem no longer names April: whisper splits the two intros, so the speaker is unsettled
    // why: brother ← boyfriend/brother share the "br-" start; best friend ← "boy-" caught, "-friend" heard as a plain
    //   friend, and two boys meeting Leslie together fits a friendship
    { id: 'd1', skill: 'detail', level: 'B1', point: 'intro', seg: [2.6, 6.1],
      stem: 'How is Ben introduced?',
      choices: ['As Derek’s boyfriend', 'As Derek’s best friend', 'As Derek’s brother'], a: 0,
      cue: '2人目の紹介、名前の前の「〜の」。',
      line: 'This is my boyfriend, Derek. This is *Derek’s boyfriend*, Ben.',
      said: '「彼氏のデレク。こっちはデレクの彼氏のベン」。',
      mean: 'Derek’s boyfriend ＝ デレクの恋人。この関係をレスリーが聞き返す。',
      trap: 'boyfriend の頭だけでは brother、後ろだけでは friend に聞こえる。語を丸ごと聞く。',
      use: 'This is my coworker, Tom.（同僚のトムです）' },

    // R fix: blind 65 % (the "close to both" filler). Now the same mechanism in reverse, a C2-style near miss. Its
    //   said note gives away d1 (Ben and Derek), so reveals intro
    // why: mixed up ← the fast gay/straight/gay list is hard to follow, so the speaker sounds confused; simple made
    //   tangled ← right mechanism (a mismatch), wrong direction
    { id: 'h1', skill: 'humor', level: 'C1', point: 'situation', reveals: ['intro'], seg: [13.2, 19.65],
      stem: 'What makes April’s answer to “How does this work?” funny?',
      choices: ['She lays out a tangled setup, then calls it simple', 'She mixes up who likes whom as she explains it',
                'She makes a simple setup sound very tangled'], a: 0,
      cue: '長い説明のあと、最後の一文。',
      line: 'Derek is gay, but he’s straight for me… And I hate Ben. *It’s not that complicated.*',
      said: '「デレクはゲイだけど私には別。ベンとは両思い。で、私はベンが嫌い」。',
      mean: 'こんがらがった関係を早口で並べ、「別に複雑じゃない」と言い切るのがおかしい。',
      trap: '早口の列挙で本人が混乱しているように聞こえるが、説明は筋が通っている。笑いは最後の一言。',
      use: 'It’s not that complicated.（そんなに複雑じゃないよ）' },

    // R fix: blind 60 % (dull was a filler). Now "lost, and says so at once", which misses only the "Yeah. Sure." first.
    //   The line drops the "No." that whisper gives to April
    // why: disapproves ← the polite "Sure" heard as hiding a judgment (建前); says so at once ← "I don't understand it"
    //   heard as her first reply, with the short "Yeah. Sure." missed
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'youth', seg: [19.6, 26.4],
      stem: 'How does Leslie take in April’s explanation?',
      choices: ['She acts like she follows, but she’s lost', 'She follows it, but quietly disapproves',
                'She’s lost, and admits it right away'], a: 0,
      cue: '短い相づちの連続と、そのあとの一文。',
      line: 'Oh. Yeah. *Sure.* The thing about youth culture is *I don’t understand it*.',
      said: '「うん、なるほど」と言い、「若者文化って、私には分からない」と続ける。',
      mean: '分かったふりの相づちのあと、分からないと認める。反対ではなく、ついていけないだけ。',
      trap: '短い Sure は賛成や建前に聞こえやすい。相づちと本音の順番を聞く。',
      use: 'Honestly, I don’t get it.（正直、よく分からない）' },

    // R fix: blind 55 % (the brush-off choice was weak). Now "back to an earlier topic", another job of "so"
    // why: conclusion ← "so" learned as だから; earlier topic ← "so" also resumes a dropped thread (それでね), and the
    //   visit started before the explanation
    { id: 'm1', skill: 'marker', level: 'B2', point: 'so', seg: [21.3, 28.15],
      stem: 'When Leslie turns to April’s friends, what does her first word do?',
      choices: ['Moves on to the reason for their visit', 'Draws a conclusion from April’s explanation',
                'Goes back to a topic from earlier on'], a: 0,
      cue: '質問の頭の一語。',
      line: '*So* what can I do for you guys?',
      said: '若者文化の話を切り上げ、「で、何のご用かしら」と二人に聞く。',
      mean: '文頭の So は「さて」。前の話を閉じて本題に入る合図で、「だから」の意味ではない。',
      trap: 'So を「だから」と訳すと結論に聞こえる。質問の頭の So は、たいてい本題への切り替え。',
      use: 'So, what brings you here?（で、今日はどうしたの？）' },

    // R fix: blind 55 % (the key was the only two-part choice). All three now start "To meet her and…"
    // why: speak ← "political stance" and "the whole gay community" heard as a request to speak for them; help ←
    //   "we're gonna have this party" heard as asking for help
    { id: 'g1', skill: 'gist', level: 'B1', point: 'invite', reveals: ['honor'], seg: [26.4, 58.4],
      stem: 'Why have April’s friends come to see Leslie?',
      choices: ['To meet her and invite her to their party', 'To meet her and get her help with a party',
                'To meet her and ask her to speak for them'], a: 0,
      cue: '「something to ask you」のあと。',
      line: 'They just really wanted to *meet you*… We really want you to be *the guest of honor*.',
      said: '「会いたかったの」と言い、パーティーの主賓に誘う。',
      mean: '目的は、英雄に会うことと、会に招くこと。手伝いや演説の頼みではない。',
      trap: 'party で手伝い、community で演説と思いやすい。want you to be のあとが頼み。',
      use: 'We’d love for you to come.（ぜひ来てほしいな）' },

    // R fix: blind 75 % (denying she was there was a filler). Now a credit-passing reading built on "Oh, April"
    // why: tell more ← "please" taken as お願い; credit to April ← "Oh, April" heard as turning the praise toward her
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'please', seg: [29.4, 36.3],
      stem: 'When April calls Leslie their hero, what is Leslie’s reply doing?',
      choices: ['Playing down what she did', 'Asking them to tell her more', 'Giving the credit to April instead'], a: 0,
      cue: '「Oh」が続いたあとの、短い二文。',
      line: '*Oh, please. It was just penguins.*',
      said: '「ヒーローよ」に「やめてよ。ただのペンギンよ」と返す。',
      mean: 'Oh, please ＝ よしてよ。ほめ言葉を押し返し、just で小さく見せる。',
      trap: 'please を「お願い」、Oh, April を手柄を譲る言葉と取りやすい。ほめられた直後なら照れ。',
      use: 'Oh, please. It was nothing.（やめてよ、大したことないって）' },

    // R fix: blind 70 % ("right to stay out" was a filler). Now Leslie's own view (she didn't mean to) offered as
    //   theirs, which "But you did" refutes
    // why: didn't mean to ← Leslie's "not allowed" plus the friends' warmth, heard as "it helped anyway"; from now on
    //   ← "none of the other politicians ever take a stand" heard as a request
    { id: 'i1', skill: 'infer', level: 'B2', point: 'stance', reveals: ['agenda'], seg: [36.3, 46.15],
      stem: 'After Leslie explains what a public servant can’t do, how do the friends see it?',
      choices: ['She took a stand anyway, and they love it', 'She didn’t mean to, but it helped them',
                'She should start taking stands from now on'], a: 0,
      cue: '彼女の説明への、友だちの最初の返事。',
      line: 'I’m not allowed to take a political stance. — *But you did, and it was awesome.*',
      said: '「公務員は政治的な立場をとれない」と言うと、「でもとったよ。最高」と返される。',
      mean: '本人は意図を否定するが、友だちは立場を示したと受け取り喜ぶ。',
      trap: '「ほかの政治家はしない」を頼みと、本人の言い分を友だちの見方と取りやすい。返事の but に注目。',
      use: 'You did it, and it was amazing.（やってくれたね、最高だった）' },

    // why: we were gonna ← "we're" and "we were" blur at speed, and a past plan sounds politer; we wanna ←
    //   "gonna/wanna" share the "-nna"
    { id: 's1', skill: 'sound', level: 'B2', point: 'gonna', seg: [46.55, 50.4],
      stem: 'Fill the gap: “And ___ have this party…”',
      choices: ['we’re gonna', 'we were gonna', 'we wanna'], a: 0,
      cue: 'and のあと、have の前の短い2語。',
      line: 'And *we’re gonna* have this party…',
      said: '「でね、パーティーをやるんだけど」と切り出す。',
      mean: 'we’re gonna ＝ we are going to。決まった予定。we’re はほぼ1音。',
      trap: 'we were gonna なら「やるつもりだった」になる。were なら「ワ」がもう一つ残る。',
      use: 'We’re gonna grab lunch. Want to come?（お昼行くけど、来る？）' },

    // why: tonight ← Leslie later says "tonight", on the day itself; this weekend ← the usual time for a party
    { id: 'n1', skill: 'number', level: 'B1', point: 'when', seg: [46.55, 50.4],
      stem: 'When is the party?',
      choices: ['Tonight', 'Tomorrow night', 'This weekend'], a: 1, keep: true,
      cue: '「party」のすぐあと。',
      line: 'this party *tomorrow night* at the Bulge',
      said: '「明日の夜、バーのザ・バルジでパーティーをする」と言う。',
      mean: 'tomorrow night ＝ 明日の夜。日と場所を伝え、誘いにつなげる。',
      trap: 'tomorrow の t は弱く、night だけ残りやすい。tonight との差は前の「トゥマ」。',
      use: 'Are you free tomorrow night?（明日の夜、空いてる？）' },

    // R fix: blind 60 % ("greets the guests" was weak). Choices are now three parallel party roles
    // why: throws ← "we're gonna have this party" heard as asking her to throw it; opens ← "honor" heard as a formal
    //   duty, like a ribbon-cutting
    { id: 'p1', skill: 'phrase', level: 'B1', point: 'honor', seg: [50.1, 54.75],
      stem: 'What role do they want Leslie to have at the party?',
      choices: ['The person the party is held for', 'The person who throws the party',
                'The person who opens the party'], a: 0,
      cue: '「we really want you to be」のあと。',
      line: 'We really want you to be *the guest of honor*.',
      said: '「ぜひ主賓になってほしい」と頼む。',
      mean: 'guest of honor ＝ 主賓。その人のために開く会の、中心のお客。',
      trap: 'honor を役目と取ると、開会の係に聞こえる。guest of honor で一つの言葉。',
      use: 'You’ll be the guest of honor.（あなたが主賓だよ）' },

    // R fix: blind 60 % (the key was the only joke-shaped choice and held the punch word). All three now read one
    //   turn of the talk
    // why: amazed ← "How?" heard as admiration; shy ← the short answers sound reluctant
    { id: 'h2', skill: 'humor', level: 'C1', point: 'photoshop', seg: [58.4, 64.5],
      stem: 'Why does the short talk after “Who made this?” get a laugh?',
      choices: ['Leslie’s “What?” makes them dumb down their answer', 'Leslie’s “How?” shows she’s amazed by their work',
                'Their short answers show they’re shy about it'], a: 0,
      cue: '「Photoshop」のあとの、彼女の一言と答え。',
      line: 'How? — Photoshop. — *What?* — *Computers.*',
      said: '「どうやって？」「フォトショップ」「何？」「コンピューター」と答えが大ざっぱになる。',
      mean: 'ソフトの名前が通じず、「コンピューター」まで戻る。彼女の機械オンチが笑いどころ。',
      trap: 'How? を感心と取りやすいが、次の What? で分かっていないと分かる。',
      use: 'Sorry, what’s that?（ごめん、それ何？）' },

    // why: tired ← "all … up" heard like "worn out"; good mood ← her bright answer about tonight fits a mood question too
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'dolled', seg: [67.2, 70.95],
      stem: 'When Donna greets Leslie, what does she ask about?',
      choices: ['Why Leslie is dressed up so nicely', 'Why Leslie looks so tired today',
                'Why Leslie is in such a good mood'], a: 0,
      cue: '「Why are you all…」のあと。',
      line: 'Why are you *all dolled up*?',
      said: '「なんでそんなにおめかししてるの？」と聞く。',
      mean: 'dolled up ＝ 人形のように着飾った、おしゃれした。all で「すっかり」と強めている。',
      trap: 'dolled を知らないと「疲れた」などに聞こえる。all ＋〜＋ up は見た目の変化が多い。',
      use: 'Why are you all dressed up?（なんでそんなにおしゃれしてるの？）' },

    // why: usual small talk ← "you look good, girl" sounds like everyday friendly chat; awkward ← the Japanese frame
    //   (気まずい), Leslie's long explanation heard as nervous
    // anchor: 79.6–80.3 s Donna's "you look good, girl"; 87.8–90.6 s to camera, "hands down, the best interaction I've
    //   ever had with Donna": the best ever, so the others were worse
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'handsdown', seg: [67.2, 91.3],
      stem: 'After Leslie’s comment to the camera, how should we hear her chat with Donna?',
      choices: ['As a rare warm moment between the two', 'As their usual friendly daily small talk',
                'As an awkward chat she’s glad is over'], a: 0,
      cue: '場面のあとの、カメラへの一言の最上級。',
      line: 'Well, you look good, girl. … That was, *hands down, the best interaction I’ve ever had* with Donna.',
      said: 'ドナに「似合ってるよ」と言われ、カメラに「文句なしに、ドナとの会話で今までで最高」と話す。',
      mean: 'カメラへの一言が場面を書きかえる。この程度で「最高」なら、ふだんのドナはもっと冷たい。',
      trap: '場面だけなら仲良しの雑談に見える。最上級は「ほかはこれより下」を含む。比べられている相手を考える。',
      use: 'That’s the nicest thing he’s ever said to me.（彼に言われた中で一番うれしい言葉）' },

    // R fix: blind 60 % (the key was the only choice without doubt). All three now open with "I'm not sure" and differ
    //   in the feeling. Ear check removed: "fabulous" settles it in words
    // why: uneasy ← "I don't know" taken as real puzzlement (謙遜); hope ← "I guess" taken as uncertainty
    //   (かもしれない)
    // anchor: 73.9–79 s the hedges ("I guess… I don't know… or something") wrap a self-compliment, "they think I'm
    //   fabulous"
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'fabulous', seg: [70.95, 79.4],
      stem: 'Which plain-English version keeps what Leslie means about the gay bar invitation?',
      choices: ['“I’m not sure why, but I love that they like me.”', '“I’m not sure why, and it makes me a bit uneasy.”',
                '“I’m not sure they like me; I just hope they do.”'], a: 0,
      cue: '控えめな言葉にはさまれた、一つの形容詞。',
      line: 'I *guess* gay men are starting to like me. I don’t know. I guess they think I’m *fabulous* or something.',
      said: '「ゲイの人に好かれ始めたみたい。よく分からないけど、私が素敵なのかも」。',
      mean: 'I guess や or something で軽く見せつつ、fabulous と自分をほめる。控えめなふりの喜び。',
      trap: 'I don’t know を本当の迷いと取りやすい。控えめな語の間のほめ言葉は照れた自慢。',
      use: 'I guess I’m kind of a genius or something.（私ってちょっと天才なのかもね）' },

    // why: fairly sure ← "hands down" heard as a softener (手を下ろす＝控えめ); hopes ← her delight heard as wishful
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'handsdown', seg: [87.3, 91.3],
      stem: 'In her comment to the camera, how sure is Leslie about her claim?',
      choices: ['Completely sure, without question', 'Fairly sure, but not completely', 'Not sure; she just hopes so'], a: 0,
      cue: '「That was」のすぐあとの2語。',
      line: 'That was, *hands down*, the best interaction I’ve ever had with Donna.',
      said: 'カメラに「文句なしに、ドナとの会話で今までで最高だった」と話す。',
      mean: 'hands down ＝ 文句なしに。最上級の前に置いて強める。',
      trap: 'hands down を「手を下ろす」と取ると控えめに聞こえる。最上級と一緒なら強調。',
      use: 'This is, hands down, the best ramen in town.（ここは文句なしに町一番のラーメン）' },

    // R fix: blind 75 % (the event choice was a filler). Now the gay-bar party from the scene before, a family group's
    //   likely target. Resign is left out on purpose: Marsha does suggest it, so it would be a second key
    // why: apology ← "publicly" heard, and a family group sounds like it wants an apology; party ← the guest-of-honor
    //   invite from the earlier scene, and Marsha's "gay marriage agenda"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'annul', seg: [91.5, 171.2],
      stem: 'What does Marsha want Leslie to do?',
      choices: ['Undo the penguin wedding she performed', 'Apologize in public for the wedding',
                'Skip the party at the gay bar tonight'], a: 0,
      cue: '最後の「either … or」の、最初の案。',
      line: 'So either you *annul the wedding*, or…',
      said: 'マーシャは式に抗議に来て、最後に「式を取り消して」と求める。',
      mean: 'annul ＝ 結婚を無効にする。あいさつから入るが、本題は式の取り消し。',
      trap: 'publicly で謝罪、前の場面からパーティーの話と思いやすい。either のすぐあとが本題。',
      use: 'Can we undo that?（それ、取り消せる？）' },

    // R fix: blind 75 % (the key was the only one with tension; the kind way out was weak). Now a literal reading of
    //   "could… if you're up for it", parallel in form. Its line says "resign", so reveals threat
    // why: mild suggestion ← "could" and "if you're up for it" taken at face value; joke ← Leslie's own first
    //   reading, before "you're serious?"
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'resign', reveals: ['threat'], seg: [113.9, 121.25],
      stem: 'When Leslie asks what she can do, what is Marsha’s answer doing?',
      choices: ['Making a harsh demand sound casual', 'Making a mild suggestion she can turn down',
                'Making a joke to break the ice first'], a: 0,
      cue: 'could と up for it の軽さ、そして中身。',
      line: 'Well, uh, you could *resign* if you’re *up for it*. — Oh, you’re serious?',
      said: '「何をすれば？」に「よければ辞任を」と答え、レスリーは「本気？」と驚く。',
      mean: 'could や up for it は軽い提案の形。中身は辞任要求で、その落差が圧力になる。',
      trap: '提案の形を親切や冗談と取りやすい。形がやわらかいほど、中身を確かめる。',
      use: 'You could help out, if you’re up for it.（よかったら手伝ってくれる？）' },

    // R fix: blind 80 % (raising money was a filler). Now Leslie's own reason ("cute"), the wrong speaker's view
    // why: cute stunt ← Leslie's view, given right after ("it would be cute"); making fun ← "ruins marriage" (later)
    //   heard as the charge
    { id: 'd5', skill: 'detail', level: 'B2', point: 'agenda', seg: [121, 132.4],
      stem: 'According to Marsha, what was Leslie really doing at the zoo?',
      choices: ['Taking a side in favor of gay marriage', 'Promoting the zoo with a cute stunt',
                'Making fun of marriage as an institution'], a: 0,
      cue: '「symbolically」のあと。',
      line: 'you were *symbolically taking a stand in favor of* the gay marriage agenda.',
      said: '「税金での役所の式は、同性婚の支持だ」と言う。',
      mean: 'take a stand in favor of ＝ 〜を支持する。式を政治の主張と見る。',
      trap: 'taxpayer money は場面の説明、「かわいい」はレスリーの言い分。誰の見方かを分けて聞く。',
      use: 'I’m taking a stand on this one.（この件ははっきり意見を言うよ）' },

    // R fix: blind 55 % (the key was the only general choice). All three now "Stopping Marsha to…"
    // why: apologize ← "I'm sorry" taken as an apology (すみません); repeat ← "hold on a second" taken literally, as
    //   asking for time to follow
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'holdon', seg: [132.35, 137.85],
      stem: 'When Leslie first answers Marsha’s charge, what is her opening doing?',
      choices: ['Stopping Marsha to push back on her claim', 'Stopping Marsha to apologize for the wedding',
                'Stopping Marsha to ask her to repeat that'], a: 0,
      cue: '文頭の決まり文句と、そのあとの一文。',
      line: 'I’m sorry, but *hold on a second there*, Marsha. That was *not my intention* at all.',
      said: '「ごめん、でもちょっと待って。そんなつもりはまったくない」と言う。',
      mean: 'I’m sorry, but… hold on は、相手を止めて反論する前置き。謝ってはいない。',
      trap: 'sorry を謝罪と取りやすい。but が続く sorry は反論の合図。',
      use: 'Sorry, but I have to disagree.（悪いけど、賛成できない）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'holdon', seg: [132.35, 135.65],
      stem: 'Type the words: “I’m sorry, but ___, Marsha.” (5 words)', answer: 'hold on a second there',
      cue: '「but」のあと、名前の前。つながる5語。',
      line: 'I’m sorry, but *hold on a second there*, Marsha.',
      said: '「ごめんなさい、でもちょっと待って」。',
      mean: 'hold on a は「ホールドンナ」とつながる。there は場所でなく、相手を止める感じを足す語。',
      trap: 'hold on a の a が消えたように聞こえ、抜かして書きやすい。弱い a も一語として数える。',
      use: 'Hold on a second, let me check.（ちょっと待って、確認する）' },

    // R fix: blind 70 % (the key was the only humor mechanism; the others were attitudes). All three now "She treats
    //   X as Y"
    // why: political as cute ← the friends' "you took a stand" reading, and "why else" invites a hidden motive; joke ←
    //   "And it was" heard as a dig at Marsha
    { id: 'h3', skill: 'humor', level: 'C1', point: 'cute', seg: [137.75, 144.8],
      stem: 'Why is Leslie’s answer to “Why else would you marry penguins?” funny?',
      choices: ['She treats a tiny reason as a deep belief', 'She passes off a political act as a cute one',
                'She treats Marsha’s question as a joke'], a: 0,
      cue: '「firmly believed」の重さと、その中身。',
      line: 'Because I *firmly believed* that it would be *cute*. And it was.',
      said: '「かわいいと固く信じていたから。実際かわいかった」。',
      mean: 'firmly believed という重い言い方で、中身は「かわいい」だけ。本気の理由なのが逆におかしい。',
      trap: '政治の話の流れで、本当の理由を隠していると取りやすい。直前に意図を否定している。',
      use: 'I just thought it would be fun.（ただ楽しそうだと思っただけ）' },

    // why: calm pride ← "I have a plan" and "focusing on my career" sound confident; refuses ← "But no, no. Not now."
    //   heard as "I won't answer that"
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'married', seg: [144.9, 157],
      stem: 'How does Leslie handle Marsha’s question about whether she’s married?',
      choices: ['She gets flustered and says too much', 'She answers calmly and with pride',
                'She refuses to answer such a question'], a: 0,
      cue: '答えの長さと、言い直しの数。',
      line: 'No. Um, *not yet*, Marsha. *Soon. Probably.* I have a plan. *But no, no.*',
      said: '「いいえ。まだ。もうすぐ。たぶん。計画はある。でも今はない」。',
      mean: '「いいえ」で済む質問に、言い直しを重ねて答えすぎている。痛い所を突かれ、あわてている。',
      trap: 'But no, no を拒否と取りやすいが、自分の言葉の打ち消し。言い直しの連続は動揺。',
      use: 'Long story. Let’s just say no.（話せば長いけど、要するにノー）' },

    // why: too busy ← "focusing on my career" is said just before; never find someone ← "I thought so" heard as a dig
    //   at her chances
    { id: 'i3', skill: 'infer', level: 'C1', point: 'understand', seg: [155.5, 160.8],
      stem: 'What does Marsha suggest with her reply to Leslie’s answer?',
      choices: ['Single people have no say on marriage', 'Leslie is too busy with work to see it',
                'Leslie will never find someone to marry'], a: 0,
      cue: '「I thought so」のあと、So で始まる一文。',
      line: 'I thought so. *So you couldn’t possibly understand.*',
      said: '「やっぱりね。じゃあ、あなたには到底分からないわ」と言う。',
      mean: '結婚していない人には結婚の問題を語る資格がない、と言っている。So は前の答えからの結論。',
      trap: '直前の career に引っぱられやすい。So のあとが、相手の答えから引き出した結論。',
      use: 'You had to be there.（その場にいないと分からないよ）' },

    // R fix: blind 60 % (the key was the only "resign" choice, after pr2's "you could resign"). Now a firing near miss
    // why: court ← "annul" is a legal word (無効にする); fire ← "resignation" heard as being removed, by the council
    { id: 'd6', skill: 'detail', level: 'B1', point: 'threat', reveals: ['annul', 'resign'], seg: [161, 171.2],
      stem: 'What will Marsha do if Leslie doesn’t do what she asks?',
      choices: ['Publicly call for Leslie to resign', 'Ask the city council to fire Leslie',
                'Take Leslie to court over the wedding'], a: 0,
      cue: '「or」のあと、文の最後まで。',
      line: 'either you annul the wedding, *or I’ll publicly ask for your resignation*.',
      said: '「式を無効にするか、さもなければ公に辞任を求める」。',
      mean: 'either A or B の B が、断ったときの手。最初の「辞めては」は本気だった。',
      trap: '辞任と解雇は別。ask for your resignation は自分から辞めるよう求めること。',
      use: 'Either you call him, or I will.（あなたが電話しないなら、私がする）' },
  ]
};
