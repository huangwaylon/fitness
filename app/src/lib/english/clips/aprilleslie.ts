// “April Becomes Leslie Knope | Parks and Recreation” (the official Parks and Recreation channel, Season 5): April,
// who hates talking to people, runs the Pawnee Commons forums dressed and acting as Leslie; the first goes badly, the
// wrong bag leaves her without her Leslie things, and she runs the second as herself.
// Segments from the captions, words from whisper (2026-11-16). Left out on purpose: "you'd look hot naked" (10–13 s),
// the Roosevelt/Ford/Clinton "quote" (70–78 s, needs world knowledge), the topless-park stretch (115–144 s, 233–245 s;
// inside g2/a3's segments but never asked about), "Farts McCool" (152 s) and the "30%"/"30 days" line (219 s, the two
// transcripts differ). Andy's apology (196–205 s) is garbled in the captions, so only "just being yourself" (both agree)
// is used, in g2's notes.
// REVIEW 2026-11-16: pass 3, fix 20, drop 1, new 1; ear checks 2
// REVIEW: c1 (band-name C2) dropped, since its joke needs the 40 s "concert" setup and can't fit in 15 s; c3 (C2 pragma on
// "don't use the numbers" → "no extra money") replaces it. s1's ear check went (both transcripts agree on "will").
// EAR CHECK: 171.2 s p2 c2 — Andy's rework: whisper "do you think it would help? I mean, if you think it would help,
//   yeah", captions "do you think would I hope I mean everything that hell yeah" (both keys need only that he takes
//   back "so hot" and turns to whether it helps)
// EAR CHECK: 254.9 s r1 — the cut falls after "What's your deal?", before "She's married to me"
import type { Clip } from '../types.ts';

export const aprilLeslie: Clip = {
  id: 'aprilleslie', video: 'vDVo1TIhwRk', title: 'April Becomes Leslie Knope', dur: 268, wpm: 168, band: 'fast',
  tags: ['職場', '恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 — "only this one" and "none so far" were easy to strike (blind 60 %); now "all of them" read as people
    //   (every woman) and "Leslie Knope outfit" read as Leslie wearing it.
    // why: every woman ← "all of them" heard as people, a stock flirt complaint; Leslie ← "Leslie Knope outfit number
    //      eight" heard as Leslie in the outfit
    { id: 'd1', skill: 'detail', level: 'B1', point: 'allof', seg: [0, 10.3],
      stem: 'What does April point out about Andy’s compliment?',
      choices: ['He’s said it about every outfit so far', 'He says that about every woman he sees',
                'He’s said it about Leslie in this outfit'], a: 0,
      cue: '「You realize」のあと、文の最後の3語。',
      line: 'You realize you’ve said that *about all of them*?',
      said: '「すごくセクシー」と言われ、「それ、全部の服に言ってるよね」と返す。',
      mean: 'all of them ＝ これまで着た服ぜんぶ。ほめ言葉に軽くつっこんでいる。',
      trap: 'all of them を「女の人みんな」と取りやすい。outfit の話だと押さえる。',
      use: 'You say that about everything.（なんにでもそう言うよね）' },

    // R fix: V2 — the key was the only negative choice against a mild "quite likes it" (blind 50 %); now all three are
    //   unhappy, and they differ in what about.
    // why: dull ← the Japanese frame: a strong complaint heard as mild putting-up; woman ← "Ann Taylor… I hate her"
    //      heard as someone she knows who chose it
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'suit', seg: [12.9, 20.25],
      stem: 'In her comment to the camera, how does April feel about the suit?',
      choices: ['It makes her feel like a strict, bossy grown-up', 'It’s dull, but she can put up with it for now',
                'She’s angry at the woman who picked it for her'], a: 0,
      cue: '服が「何をしたくさせる」か、そのたとえ。',
      line: 'the suit makes me want to *scold a Catholic child*. I *don’t know who* Ann Taylor is, but I hate her',
      said: '「このスーツだと子どもを叱りたくなる。Ann Taylor は知らないが嫌い」と言う。',
      mean: '堅苦しく口うるさい気分になる、という強い拒否。Ann Taylor は服のブランド。',
      trap: '人名に聞こえるが「誰か知らない」と言っている。たとえで気持ちをつかむ。',
      use: 'This tie makes me feel like a principal.（このネクタイ、校長みたいな気分）' },

    // R fix: V2 + K2 — the key was the only sensible reason (blind 65 %), and "Leslie asked her to stand in" isn't
    //   refuted by the audio ("I have to lead" says nothing on who asked). Now three goals, each built on clip words.
    // why: crowd ← "Leslie" + "public forum" heard as winning over Leslie's public; job ← dressing up as a boss heard as
    //      a try-out for her post
    { id: 'g1', skill: 'gist', level: 'B2', point: 'why', reveals: ['hate'], seg: [12.9, 31.1],
      stem: 'Why does April plan to dress and act like Leslie?',
      choices: ['To cope with a week of talking to people', 'To win over a crowd that’s used to Leslie',
                'To test how she’d look in Leslie’s job'], a: 0,
      cue: '「So to get through it」のあと。',
      said: '人と話すのが嫌いなのに、人前の仕事がある。そこで Leslie のまねをすると決めた。',
      mean: '得意な人になりきる作戦。苦手な一週間を乗り切るための案。',
      trap: 'Leslie の名前が続くので、相手や仕事の話に取りやすい。get through は乗り切る。',
      use: 'To get through it, I just pretend.（乗り切るために、なりきるの）' },

    // R fix: V2 — only the key echoed "public forum" (blind 50 %); now all three are forums.
    // why: once ← "every day" missed, "this week" heard as one event; with Leslie ← she's copying Leslie, heard as
    //      running them together
    { id: 'd2', skill: 'detail', level: 'B1', point: 'daily', reveals: ['hate'], seg: [19.6, 27.2],
      stem: 'Why will this week be hard for April?',
      choices: ['She must lead a public forum every day', 'She must lead one public forum this week',
                'She must help Leslie run a forum every day'], a: 0,
      cue: '「public forum」のあと、いつなのか。',
      line: 'I have to lead a public forum… *every day this week*, and I hate talking to people.',
      said: '「今週は毎日、公開討論会を仕切らなきゃ。しかも人と話すのが嫌い」と言う。',
      mean: 'every day this week ＝ 今週は毎日。一度きりではないのでつらい。',
      trap: 'this week だけ聞くと週に一度に思える。前の every day まで聞く。',
      use: 'I have meetings every day this week.（今週は毎日会議だ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'hate', seg: [23.5, 27.2],
      stem: 'Type what she says: “…this week, and ___.” (5 words)', answer: 'i hate talking to people',
      cue: '「every day this week」のすぐあと。',
      line: 'and *I hate talking to people*.',
      said: '「しかも、人と話すのが大嫌い」と付け足す。',
      mean: 'hate ～ing ＝ ～するのが嫌い。人前の仕事が苦手な理由をはっきり言っている。',
      trap: 'hate talking を hate to talk と書きたくなるかも。意味は同じでも、聞こえた形で書く。',
      use: 'I hate talking on the phone.（電話で話すのが苦手）' },

    // R fix: V2 — "bought new" and "gave away" were fillers (blind 70 %); now two misreadings of "still" and the stub.
    // why: stopped ← the 1995 stub heard as when she last wore it; never worn ← "still" + "you can't remove it" heard
    //      as a tag left on
    { id: 'i1', skill: 'infer', level: 'B2', point: 'old', reveals: ['1995'], seg: [31.1, 42.3],
      stem: 'From the talk about the patch and the pocket, what is implied about Leslie?',
      choices: ['She’s worn it for years and still does', 'She stopped wearing it back in the nineties',
                'She’s never worn it; the tag is still on'], a: 0,
      cue: '「still」と、ポケットの中身の年。',
      line: 'She *still wears* this. She had the patch *sewn in*.',
      said: '「今も着てる。ワッペンは縫い付けで外せない。ポケットには1995年のチケット」と見せる。',
      mean: 'still と古い半券から、長年大事に着続けている服だと分かる。',
      trap: '古い半券の年から「昔の服」と思いやすい。still は「今も（前から）ずっと」。',
      use: 'I still wear the jacket you gave me.（もらった上着、今も着てるよ）' },

    // why: 1985 ← "nineteen" kept, "ninety" heard as "eighty"; 1999 ← "nine" heard twice
    { id: 'n1', skill: 'number', level: 'B1', point: '1995', seg: [35.6, 43],
      stem: 'What year is the concert ticket stub from?',
      choices: ['1985', '1995', '1999'], a: 1, keep: true,
      cue: '「concert in」のあと、年の後半。',
      line: 'a ticket stub from a Fleetwood Mac concert *in 1995*',
      said: 'ポケットから、1995年のコンサートの半券が出てくる。',
      mean: 'nineteen ninety-five と2つに分けて読む。年は2けたずつ。',
      trap: 'ninety と eighty は最初の音で決まる。n で始まるか、エで始まるか。',
      use: 'It was back in nineteen ninety-five.（1995年のことだよ）' },

    // R drop: S4 — the joke needs "a Fleetwood Mac concert" (40.0 s) to show that the "new" name is a band's, so the
    //   segment can't come under 15 s (it ran 24 s); cut to 49 s it would rest on world knowledge (V1). Its choice
    //   "a 1995 concert stub" also gave away n1. Never shipped, so deleted; c3 (R new) is the bank's second C2 item.

    // R fix: V2 + V4 — the distractors were easy to strike (blind 60 %), and the reason is said outright, so it's a
    //   detail, not an infer. Now three "awful, but…" reasons.
    // why: Andy ← "super hot" heard as a vote for this one, but he said it "every single time"; most like Leslie ← the
    //      whole plan is to look like her
    { id: 'i2', skill: 'detail', level: 'B1', point: 'lessbad', seg: [44.2, 49.6],
      stem: 'Why is this outfit the one picked?',
      choices: ['It’s awful, but the others are worse', 'It’s awful, but Andy likes it best',
                'It’s awful, but it’s the most like Leslie'], a: 0,
      cue: '「terrible」が2回。2回目の前の語。',
      line: 'This one is terrible, but it is *slightly less terrible* than the rest.',
      said: '「これもひどい。でもほかよりは少しましだ」と言う。',
      mean: 'less terrible ＝ ひどさが少ない。ほめていない、消去法の選び方。',
      trap: 'terrible が強く残るが、but のあとで比べている。比べる語 less を聞く。',
      use: 'It’s the least bad option.（いちばんましな選択だね）' },

    // R fix: V2 — "point out the chair" was a filler (blind 80 %); now "deal with it" and calling on the next speaker.
    // why: deal with it ← "you should see the booger" heard as a problem she hands to him; next speaker ← a name said
    //      at a forum heard as calling on someone to talk
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'andy1', seg: [92.1, 96.9],
      stem: 'When April answers the booger remark with just “Andy.”, what is she doing?',
      choices: ['Telling him to behave in front of people', 'Asking him to deal with it for her',
                'Calling on him to speak next'], a: 0,
      cue: '名前だけの返事。直前に何を言われた？',
      line: 'You should see the booger under this chair. — *Andy.*',
      said: '彼が「この椅子の下の鼻くそ見てよ」と言い、April は名前だけで返す。',
      mean: '名前を短く低く呼ぶのは「やめて」の合図。人前なので一語で止めている。',
      trap: '名前を呼ぶと紹介や呼び出しに聞こえやすい。直前の発言への反応として聞く。',
      use: 'Kids. Not now.（こら。今はやめて）' },

    // R fix: V2 — "won't" clashed with "I'm afraid" and fell by meaning alone (blind 70 %); now "has raised", which
    //   fits the worry as well as the key. Ear check dropped: both transcripts agree on "will".
    // why: would ← the same shape, softer; has raised ← "I'm afraid" also fits a rise already made, and "park has"
    //      shrinks to "parkz"
    { id: 's1', skill: 'sound', level: 'B2', point: 'taxes', seg: [96.9, 99.9],
      stem: 'Fill the gap: “I’m afraid this park ___ my taxes.”',
      choices: ['will raise', 'would raise', 'has raised'], a: 0,
      cue: '「this park」のあと、動詞の前の短い音。',
      line: 'I’m afraid this park *will raise* my taxes.',
      said: '「この公園で税金が上がるのが心配だ」と言う。will は弱く短い。',
      mean: 'I’m afraid ＋ will ＝ これから起きそうで心配。',
      trap: 'park のあとの短い「ゥル」が will。would なら d、has なら z が残る。',
      use: 'I’m afraid it will rain tomorrow.（明日、雨が降りそうで心配）' },

    // R fix: V2 — "You're right to be worried" was a filler (blind 55 %); now a brush-off, which her next words refute.
    // why: not afraid ← "fear" + "not" read word by word (she isn't scared); brush-off ← "Ah, well" heard as the start
    //      of a dodge, but she goes straight into the budget
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'fearnot', reveals: ['taxes'], seg: [96.9, 104.25],
      stem: 'What does April’s first reply to the tax worry mean?',
      choices: ['There’s no need to worry about it', 'I’m not afraid of a tax rise', 'Let’s not get into that just now'],
      a: 0,
      cue: '「Ah, well」のあとの2語。',
      line: 'Ah, well, *fear not*. Between the normal parks budget and our corporate partners…',
      said: '「ご心配なく。通常の予算と企業の協力で…」と説明しはじめる。',
      mean: 'fear not ＝ 心配いりません。古風で芝居がかった言い方で、Leslie らしさを演じている。',
      trap: '語ごとに訳すと「私は怖くない」になる。相手を安心させる決まり文句。',
      use: 'Fear not, I brought snacks.（ご心配なく、おやつ持ってきた）' },

    // R fix: V2 + K6 + S4 — the key restated the list and both distractors had "all" (blind 85 %); the segment ran
    //   18.3 s. Now three funny-sounding readings, and the seg ends after "scared of a lot of stuff" (14.2 s).
    // why: scared of April ← "I'm scared of a lot of stuff" heard as aimed at her; April raising taxes ← "this park
    //      will raise my taxes" heard with April as the subject
    { id: 'h3', skill: 'humor', level: 'C1', point: 'walter', reveals: ['taxes'], seg: [96.9, 111.1],
      stem: 'Why does Walter’s list of worries get laughs?',
      choices: ['His worries slide from grown-up to childish', 'He admits he’s scared of April herself',
                'He thinks April wants to raise his taxes'], a: 0,
      cue: '2つ目の「I’m also afraid」から先。',
      line: 'I’m also afraid the park will be noisy and *full of spiders and dark at nighttime*.',
      said: '税金の心配から始まり、うるさい、クモが多い、夜は暗い、と心配が続く。',
      mean: '大人の意見から子どもの怖がりに落ちていく。最後は「怖いものだらけ」と認める。',
      trap: '最初の税金の話で決めない。リストは最後の項目まで聞く。',
      use: 'I’m also a little scared of the dark.（それに、暗いのもちょっと怖い）' },

    // R fix: V2 — "clearly not fine at all" was the only reading against the face value (blind 75 %); now the key is
    //   the mechanism (talking himself down), and the distractors are face-value readings.
    // why: better ← "Everything's fine" heard at face value; move on ← "I'm Walter" heard as signing off
    { id: 'i4', skill: 'infer', level: 'C1', point: 'fine', seg: [108.3, 115.2],
      stem: 'What does Walter’s closing “I’m fine…” suggest?',
      choices: ['He’s trying to calm himself down', 'He’s fine now that he’s said it all',
                'He wants April to move on to others'], a: 0,
      cue: '直前の一言と、fine の回数。',
      line: 'I’m *scared of a lot of stuff*. Everything’s fine. *I’m fine*, I’m Walter, and *I’m fine*.',
      said: '「怖いものがいっぱい。大丈夫。僕は大丈夫、Walter です、大丈夫」と言う。',
      mean: '怖いと言った直後に「大丈夫」を重ねるほど、大丈夫でないのが伝わる。',
      trap: 'fine を言葉どおりに取りやすい。同じ語を何度も言うのは、自分に言い聞かせる形。',
      use: 'I’m fine. Totally fine. Really.（大丈夫。全然平気。ほんとに）' },

    // why: two ← "Two of them were me and Andy" comes right after; fourteen / forty ← -teen/-ty near sounds
    { id: 'n2', skill: 'number', level: 'B1', point: 'four', seg: [144.5, 151.45],
      stem: 'How many signatures did the first forum get?',
      choices: ['Two', 'Four', 'Fourteen', 'Forty'], a: 1, keep: true,
      cue: '「We only got」のあとの数。',
      line: 'We *only got four* signatures. Two of them were me and Andy.',
      said: '「署名は4つだけ。うち2つは私と Andy」と報告する。',
      mean: 'only ＝ たった。4つのうち2つが身内なので、ほぼ集まっていない。',
      trap: 'すぐあとの two に引っぱられやすい。only got の直後の数を拾う。',
      use: 'We only got three replies.（返事はたった3件だった）' },

    // R fix: V2 — "take a break" and "the old way" were weak (blind 65 %); now a literal horse-riding reading (take the
    //   reins) beside the break.
    // why: take charge ← saddle read as riding = being in control; break ← "hop back" heard as a rest first
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'saddle', seg: [160.3, 165.9],
      stem: 'When Andy brings up the next forum, what does he mean?',
      choices: ['Go right back and try it again', 'Take charge and be the boss this time',
                'Take a short break, then go back'], a: 0,
      cue: '「another forum today」のあとの「Let’s」。',
      line: 'We’ve got another forum today. Let’s just *hop back in that saddle*.',
      said: '「今日もフォーラムがある。さっさともう一回いこう」と励ます。',
      mean: '落馬してもすぐ鞍に戻る、から「失敗してもすぐ再挑戦」の意味。',
      trap: '馬に乗る＝主導権と取ると「仕切れ」に聞こえる。just と back は「すぐもう一度」。',
      use: 'Bad day? Get back in the saddle.（ダメな日？またすぐやろう）' },

    // R fix: V2 — "a wig is a bad idea" wasn't built on anything said (blind 60 %); now "would it help" (said, but by
    //   him) and "blonde" (said, wrong relation).
    // why: she asked ← "do you think it would help?" is said, but it's his rework, not her question; blonde ← "blonde
    //      wig" heard, and the rework heard as doubt
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'wig', reveals: ['andy1'], seg: [165.9, 174.6],
      stem: 'Why does Andy rework his answer about the wig?',
      choices: ['Because his first answer was about her looks', 'Because she asked whether it would help',
                'Because he thinks blonde wigs look silly'], a: 0,
      cue: '名前だけの一言の前と後で、何が変わったか。',
      line: 'That would be *so hot*. — *Andy.* — …do you think it would help?',
      said: '「すごくセクシー」と言い、名前を呼ばれると「役に立つと思うなら…」と言い直す。',
      mean: '見た目の話を、仕事に役立つかの話に変えてごまかしている。',
      trap: '名前だけの返事を「反対」と取りやすい。指摘されたのは、彼の最初の答え。',
      use: 'I mean, if it helps, sure.（つまり、役に立つならね）' },

    // R fix: V2 + S4 — the key was the only warm choice (blind 60 %); now "afraid of her" is a near miss (he does back
    //   down; "babe" says it isn't fear). Seg trimmed from 15.3 s to 14.9 s.
    // why: afraid ← he backs down at once, read as fear rather than ease; fed up ← the Japanese frame: a curt name heard
    //      as real anger
    // anchor: 166.3 s she asks "Should I wear a blonde wig?" herself; 169.97 s "Andy." and 171–174 s he reworks "so
    //         hot" into "would it help?"; 177–180 s the plan goes on: "can you give me that bag?" — "You got it, babe."
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'wig', reveals: ['andy1'], seg: [166, 180.9],
      stem: 'What does the wig moment show about how April and Andy get along?',
      choices: ['One word from her, and he cheerfully adjusts', 'He’s afraid of her, so he backs down at once',
                'She’s fed up and close to giving up on him'], a: 0,
      cue: '名前のあとの彼の言い直しと、そのあとの頼み事。',
      line: '*Andy.* — …do you think it would help? … Can you give me that bag? — *You got it, babe.*',
      said: '名前だけでたしなめられ、彼はすぐ言い直す。そのまま彼女は頼み事をし、彼は「了解」と返す。',
      mean: '短い一言で通じ合う、気安い関係。叱っても空気は壊れず、すぐ次の話に進んでいる。',
      trap: '名前だけで止まるのを、怖さや怒りと取りやすい。babe と軽い返事が続くかで、関係の温度を見る。',
      use: 'Babe. — Okay, okay, I’ll stop.（ちょっと。—はいはい、やめるよ）' },

    // R fix: V2 — the "be yourself" arc made the key easy to pick (blind 50 %); now three manners, each tied to a
    //   thing the clip offers (no notes; Andy beside her).
    // why: notes ← the plan from the morning, but the bag had none of her Leslie things; Andy ← he does speak up at the
    //      end
    { id: 'g2', skill: 'gist', level: 'B2', point: 'self', reveals: ['bag'], seg: [182, 257.6],
      stem: 'How does April run the second forum?',
      choices: ['Bluntly, as herself, without the Leslie act', 'Cheerfully, with her Leslie notes in hand',
                'Nervously, letting Andy handle questions'], a: 0,
      cue: 'かばんの件のあと、彼女の答え方の調子。',
      said: 'Leslie の道具がなく、Andy は「そのままでいい」と励ます。彼女は短くそっけなく答える。',
      mean: 'Leslie のまねをやめ、April らしいやり方で場を仕切っている。',
      trap: '道具が届かず、Leslie にはなれなかった。答え方の調子で判断する。',
      use: 'Just be yourself up there.（壇上では、いつものあなたで）' },

    // R fix: V2 — the key was the only full answer (blind 50 %); now every choice says what's in and what's missing.
    // why: suit only ← the list "pantsuit… headband… notes" heard in part; wrong suit ← "the wrong bag" heard as the
    //      wrong outfit
    { id: 'd5', skill: 'detail', level: 'B1', point: 'bag', seg: [183.9, 194.3],
      stem: 'What is wrong with the bag Andy brings?',
      choices: ['It has snacks and cards, none of her things', 'It has her suit, but not her notes or headband',
                'It has her notes, but the suit is the wrong one'], a: 0,
      cue: '「This bag is full of」のあと。',
      line: 'This bag is full of *fruit roll-ups and baseball cards*. I don’t have my Leslie pantsuit… or my Leslie notes.',
      said: '「お菓子と野球カードばかり。スーツもヘアバンドもメモもない」と言う。',
      mean: '持ってきたのは別のかばん。Leslie になるための道具がひとつもない。',
      trap: 'リストの一部だけ聞くと「一つだけ足りない」と思える。don’t have は全部にかかる。',
      use: 'I think I grabbed the wrong bag.（かばんを間違えたみたい）' },

    // R fix: V2 — the key's colon and "simple answer" stood out (blind 70 %); now three plain verb phrases.
    // why: apology ← "Excuse me" read as すみません; again ← "math lesson" read as a request to go over the numbers
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'math', seg: [213.55, 222.35],
      stem: 'When the man cuts in with “Excuse me, ma’am”, what is he doing?',
      choices: ['Cutting her off to get a plain answer', 'Apologizing for not following the math',
                'Asking her to go over the numbers again'], a: 0,
      cue: '「Excuse me」のあとの「I didn’t ask for」。',
      line: '*Excuse me*, ma’am. *I didn’t ask for a math lesson*.',
      said: '割合の説明を「すみませんが、算数の授業は頼んでない」とさえぎる。',
      mean: 'この Excuse me は謝罪ではなく、話を止める合図。',
      trap: 'Excuse me を「すみません」と訳すと謝っているように聞こえる。後ろの文で働きを決める。',
      use: 'Excuse me, I wasn’t finished.（ちょっと、まだ話の途中です）' },

    // R fix: V2 — the key was the only absurd (funny) choice (blind 80 %); now three demands about the form of the
    //   answer, each built on a clip word (40%, "tell me").
    // why: percentages ← she did start on "40%…", heard as what he asks for; in writing ← "don't use the numbers"
    //      heard as "don't say them aloud"
    { id: 'h4', skill: 'humor', level: 'C1', point: 'nonumbers', reveals: ['math'], seg: [219.3, 226.5],
      stem: 'Why does the man’s last demand get a laugh?',
      choices: ['He wants an amount but no numbers in it', 'He wants the cost split into percentages',
                'He wants the answer in writing, not words'], a: 0,
      cue: '「how much」と、最後の3語。',
      line: 'just tell me *how much* it’s gonna cost me, and *don’t use numbers*.',
      said: '「いくらかかるのか言ってくれ。ただし数字は使わずに」と言う。',
      mean: '金額を聞きながら数字を禁じる、無理な注文。April は「追加の負担なし」で切り抜ける。',
      trap: '前半だけ聞くと普通の質問。and のあとの条件が笑いどころ。',
      use: 'Just give me the short version.（手短に言って）' },

    // R new: replaces c1 as the bank's second C2 item (blind read: 40 %, B was my pick).
    // why: percentage ← "40%… another 30%" is her first try, heard as her answer; not settled ← "Look," heard as the
    //      start of a refusal (the Japanese frame: a preface before "we can't say")
    // anchor: 224.4–225.2 s "don't use the numbers"; 228.0–229.3 s "you won't have to pay any extra money": the cost
    //         (none extra) is given, and no figure is said
    { id: 'c3', skill: 'pragma', level: 'C2', point: 'nonumbers', reveals: ['math'], seg: [219.3, 229.85],
      stem: 'How does April’s answer handle the man’s demand?',
      choices: ['She tells him the cost with no numbers at all', 'She gives a percentage instead of a price',
                'She says the cost isn’t settled yet'], a: 0,
      cue: '「Look,」のあと、お金の話に数字が出るか。',
      line: '…and *don’t use the numbers*. — Look, *you won’t have to pay any extra money*, okay?',
      said: '「数字は使わずにいくらか言え」と言われ、「追加でお金を払う必要はない」と答える。',
      mean: '無理な注文を、文字どおり守って答えている。追加ゼロという答えには数字が一つもいらない。',
      trap: '前の 40% が耳に残ると割合で答えたと思いやすい。Look は断りではなく、要点を言う前置き。',
      use: 'Short version: it won’t cost you a thing.（要するに、一銭もかからないよ）' },

    // R fix: V2 — "hurt… for good" and "angry… argues" were easy to strike against the odd key (blind 65 %); now
    //   "scared off" (the literal "You scare me") and a cool-stoner shrug.
    // why: scared off ← "You scare me" taken at face value; plays it cool ← "Yeah, chill/shut me down" heard as a
    //      shrug
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'dig', seg: [244.05, 253.2],
      stem: 'After April shuts Harris down, how does he react?',
      choices: ['He’s into her because she’s tough', 'He’s scared off and drops the subject',
                'He’s annoyed but plays it cool'], a: 0,
      cue: '「You scare me」のあと、and に続く部分。',
      line: 'You scare me, and I gotta say, *I kinda dig that*.',
      said: '「君、怖いね。でも正直、そういうの結構好きだ」と言う。',
      mean: 'dig ＝ 好き、いいと思う（くだけた言い方）。怖さに引かれている。',
      trap: 'scare だけ聞くと引いたように思える。and I gotta say のあとが本音。',
      use: 'I kinda dig your new haircut.（新しい髪型、けっこういいね）' },

    // predict: the segment stops after "What's your deal?"; then plays "She's married to me."
    // R fix: V2 — "gives him her phone number" was a filler (blind 55 %); now three readings of "What's your deal?",
    //   all of them replies.
    // why: what's wrong ← "What's your deal?" also means "what's wrong with you"; asks back ← the stock reply to a
    //      personal question is to turn it around
    { id: 'r1', skill: 'predict', level: 'B2', point: 'deal', reveals: ['dig'], seg: [248.2, 254.9], then: [254.9, 257.6],
      stem: 'After Harris asks about her “deal”, what kind of reply comes?',
      choices: ['Someone else answers that she’s taken', 'April says what’s wrong with him',
                'April answers by asking about his deal'], a: 0,
      cue: '彼女に興味を示したあとの質問。何を聞いている？',
      line: 'What’s your deal? — *She’s married to me.*',
      said: '好意を見せて「君はどうなの？」と聞くと、別の声が「僕の妻だ」と答える。',
      mean: 'ここでは「付き合ってる人いる？」に近い。答えは既婚の知らせ。',
      trap: '「何が問題なの」の意味もあるが、直前に好意を見せている。流れで意味を決める。',
      use: 'So what’s your deal? Seeing anyone?（で、君は？誰かいるの？）' },
  ]
};
