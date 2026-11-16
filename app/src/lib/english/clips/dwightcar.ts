// REVIEW 2026-11-16: pass 5, fix 16, drop 0, new 0; ear checks 0
// “Dwight Buys Andy's Car  - The Office US” (the official The Office channel, BEST OF SEASON 4 - The Office US):
// after a dull Mad Lib, Andy tells the camera his Xterra helps him meet women. Dwight runs the car down, lists absurd
// "options", rushes Andy into a handshake with a countdown, then resells the car on eBay; "seller beware", and a Mad Lib
// of his own to gloat.
// Segments from the captions, checked against whisper's times where the captions' word times drift (2026-11-16).
// Untested on purpose: 20–33 s (the cat-food Mad Lib: whose lines, and "everybody" vs "What about"), 33–38 s (Dwight's
// "I hope nothing horrible ever happens to them": the point rests on backstory and tone), 83–91 s (the price: whisper
// "$1,500", captions "$59"; "I have the blue book values" vs "I said the bill do I use"), 107–117 s (singing; the
// "What's Dwight up to?" speakers are unnamed). The captions spell "Annie Bernard" and "two white" at 148 s and 155 s;
// whisper has "Andy Bernard" and "Dwight".
// No ear checks: every key rests on words both sources agree on, and no key depends on who speaks.
import type { Clip } from '../types.ts';

export const dwightCar: Clip = {
  id: 'dwightcar', video: 'CpvHx0R2Ytc', title: 'Dwight Buys Andy\'s Car  - The Office US', dur: 182, wpm: 148,
  band: 'slow', tags: ['職場', '買い物'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %): the key was the only "pulls up" choice. All three now share "A woman pulls up" and differ
    //   in what she pulls up in or does.
    // why: sports car ← "pull up" and a car next to you, heard without "Xterra"; asks about his car ← the "icebreaker"
    //   script, with the woman starting the chat
    { id: 'd1', skill: 'detail', level: 'B1', point: 'stoplight', seg: [40.6, 50.4],
      stem: 'According to Andy, what happens at a stoplight?',
      choices: ['A woman pulls up in the same car', 'A woman pulls up in a sports car',
                'A woman pulls up and asks about his car'], a: 0,
      cue: '「look over and」のあと、隣に何があるか。',
      line: 'you pull up to a stoplight and look over and *there’s an Xterra next to you*.',
      said: '「信号で止まって横を見ると、隣も同じ車。運転してるのはいつも女性」と言う。',
      mean: '出会いの「根拠」は、同じ車に女性が乗っていることだけ。',
      trap: 'look over を「女性がこちらを見る」と取りやすい。見るのは彼で、隣は同じ車。',
      use: 'There’s a café right next to you.（すぐ隣にカフェがあるよ）' },

    // R fix: V2 (blind 55 %): "Fed up; time to sell" was weak. Now "Proud; women envy his car": the right feeling for
    //   the wrong reason, so the reason has to be heard.
    // why: embarrassed ← "always driven by chicks" heard as a car for women; envy ← "meet a lot of ladies" heard as
    //   women admiring the car, not driving the same one
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'proud', reveals: ['icebreaker'], seg: [40.6, 52.6],
      stem: 'How does Andy feel about owning his Xterra?',
      choices: ['Proud; he thinks it helps with women', 'Embarrassed; he thinks it’s a woman’s car',
                'Proud; he thinks women envy his car'], a: 0,
      cue: '最初の一文と、最後の「So」のあと。',
      line: 'You *meet a lot of ladies* driving an Xterra… So *there’s your icebreaker*.',
      said: '「この車だと女性とよく出会える。きっかけになるんだ」とカメラに話す。',
      mean: '女性が多く乗る車だから話のきっかけになる、と得意げ。',
      trap: '女性ばかり運転すると聞くと、恥ずかしがっていると取りやすい。So のあとは自慢。',
      use: 'This car is a great conversation starter.（この車、話のきっかけになるんだ）' },

    // R fix: V2 (blind 60 %): all three are now "a way to…", one per reading of "icebreaker". The stem's "matching
    //   cars" gives d1's key: reveals `stoplight`.
    // why: look cool ← ice = クール, the katakana sense; beat the traffic ← "break" heard as breaking through the road
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'icebreaker', reveals: ['proud', 'stoplight'], seg: [45.5, 52.6],
      stem: 'How does Andy say the matching cars help him?',
      choices: ['They give him a way to start a chat', 'They give him a way to look cool',
                'They give him a way to beat the traffic'], a: 0,
      cue: '最後の一文の、ice で始まる語。',
      line: 'They’re always driven by chicks. So there’s your *icebreaker*.',
      said: '「いつも女性が運転してる。ほら、話のきっかけになるだろ」と言う。',
      mean: 'icebreaker ＝ 初対面の気まずさをほぐす話題。同じ車、が会話の糸口。',
      trap: '「氷を割る」から道や障害を思い浮かべやすい。人との最初の一言のこと。',
      use: 'Let’s start with a quick icebreaker.（まず軽く自己紹介ゲームから）' },

    // R fix: V2 (blind 65 %): "Admitting the scratch is real" was the plain opposite. Now "blaming… someone else", an
    //   excuse of the same kind as the key.
    // why: paid extra ← "racing stripe" is a real option on cars; blaming ← a quick reply to a flaw heard as an excuse
    //   about who did it
    { id: 'i1', skill: 'infer', level: 'C1', point: 'stripe', seg: [53.0, 56.3],
      stem: 'When Dwight finds a scratch, what is Andy doing with his reply?',
      choices: ['Passing the flaw off as a feature', 'Pointing out an extra he paid for',
                'Blaming the scratch on someone else'], a: 0,
      cue: '「Scratch」への返事の中の二語。',
      line: 'Scratch. — That’s a *racing stripe*.',
      said: '「傷だ」に「それはレース用のストライプ」と返す。',
      mean: '傷を飾りだと言い張って、値下げの材料を消そうとしている。',
      trap: 'racing stripe は本物の装備なので、事実の説明と取りやすい。傷のすぐあとなら言い逃れ。',
      use: 'It’s not a bug, it’s a feature.（それはバグじゃなくて仕様です）' },

    // why: a dent ← a common car flaw put in place of "scratch"; flat tire ← "sagging" heard as something gone soft
    { id: 'd2', skill: 'detail', level: 'B1', point: 'faults', reveals: ['stripe'], seg: [53.0, 59.7],
      stem: 'What two faults does Dwight point out in the car?',
      choices: ['A scratch and a sagging bumper', 'A dent and a sagging bumper',
                'A scratch and a flat tire'], a: 0,
      cue: '一語ずつ短く言う、二つの指摘。',
      line: '*Scratch.* — That’s a racing stripe. — *Bumper sagging.*',
      said: '車を見ながら「傷」「バンパーが下がってる」と短く指摘する。',
      mean: '欠点を並べて、車の値打ちを下げる。買いたたく準備。',
      trap: '車の欠点としてよくある「へこみ」「パンク」を思い浮かべやすい。言った語そのものを聞く。',
      use: 'There’s a scratch on the door.（ドアに傷があります）' },

    // R fix: V2 (blind 70 %): "wins it in a word game" was weak. Each half of the key is now shared by a distractor
    //   (runs it down + a trade; praises it + rushes).
    // why: trade ← the farm wagon and donkey are in his pitch; praises it ← "I will buy it" and a quick deal heard as
    //   interest, without "This car is crap"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'how', reveals: ['now', 'faults', 'countdown', 'wagon'], seg: [53.0, 108.0],
      stem: 'How does Dwight get Andy to sell the car so cheaply?',
      choices: ['He runs it down, then rushes Andy', 'He runs it down, then offers a trade',
                'He praises it, then rushes Andy'], a: 0,
      cue: '車の欠点の指摘と、最後の数え方。',
      said: '欠点を並べてガラクタと言い、ばかげた選択肢を示し、「今すぐ」と数を数えて握手させる。',
      mean: 'けなして値打ちを下げ、時間を与えない。典型的な買いたたき。',
      trap: '荷車やロバの話が目立つが、それは「この車に価値はない」と思わせる演出。',
      use: 'Don’t let them rush you.（せかされちゃだめだよ）' },

    // R fix: V2 (blind 55 %): "Almost nothing at all" was the only hedged amount. Now "a bit under Andy's price" (also a
    //   hedge), and the key no longer adds "at all".
    // why: near the asking price ← next to = 隣・近く, read as "close to what you want"; free ← "nothing" heard alone
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'nextto', seg: [59.2, 62.25],
      stem: 'What price does Dwight say he will pay for the car?',
      choices: ['Hardly anything at all', 'A bit under Andy’s price', 'Nothing; he wants it free'], a: 0,
      cue: '「buy it for」のあとの三語。',
      line: 'This car is crap. I will buy it for *next to nothing*.',
      said: '「この車はガラクタだ。ほぼタダで買ってやる」と言う。',
      mean: 'next to nothing ＝ ほとんどゼロ。タダではないが、ごくわずか。',
      trap: 'next to を「隣」「近い」と取ると高く聞こえる。nothing のすぐ近く、つまりほぼゼロ。',
      use: 'I got this jacket for next to nothing.（このジャケット、ほぼタダで買った）' },

    // anchor: 62.28–63.7 s "How next to?" right after "This car is crap… next to nothing"; 79.1–82.1 s "I have to pick one
    //   of those? … Can you go over those options again?": he never defends the car again
    // R fix: V2 (blind 65 %): "did not catch what 'next to' meant" was the weakest. Now "mocking Dwight's odd wording",
    //   the wordplay read as a jab; his "go over those options again" refutes it. Steelman of each: insulted (no
    //   defence of the car follows), mocking (he asks to hear the options again, in earnest). Fresh read ≈ 80 %.
    // why: insulted ← a price that low should offend, and the question heard as a challenge; mocking ← the cut-down
    //   phrase heard as making fun of "next to nothing"
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'nextto', seg: [59.2, 82.5],
      stem: 'What does Andy’s reply “How next to?” show about him?',
      choices: ['He is already open to selling', 'He is insulted by the low offer',
                'He is mocking Dwight’s odd wording'], a: 0,
      cue: '侮辱のすぐあとの短い問いと、そのあとの彼の質問。',
      line: 'I will buy it for next to nothing. — *How next to?*',
      said: '「ガラクタだ、ほぼタダで買う」に「どのくらいほぼ？」と返し、選択肢の説明まで聞き直す。',
      mean: '車をけなされても怒らず、すぐ値段を聞く。言葉を切って返すのは、もう交渉に乗っている合図。',
      trap: '安値を言われたら怒るはず、と取りやすい。言い返さず数字を聞くのは、売る気がある証拠。',
      use: 'Cheap? How cheap are we talking?（安いって、どのくらい？）' },

    // why: sell for parts ← the first option, "farm" attached to it; off a cliff ← the most vivid option, heard as his plan
    { id: 'd3', skill: 'detail', level: 'B1', point: 'wagon', seg: [64.6, 79.5],
      stem: 'If Andy sells to Dwight, what will Dwight do with the car?',
      choices: ['Use it on his farm, pulled by a donkey', 'Take it apart and sell it for parts',
                'Drive it off a cliff to be rid of it'], a: 0,
      cue: '「sell it to me」のあとの説明。',
      line: 'or you can sell it to me, and I’ll use it as I would a *wagon on my farm*. It will be *towed by a donkey*.',
      said: '「部品で売るか、崖から落とすか、俺に売るか。俺なら農場の荷車にして、ロバに引かせる」と言う。',
      mean: '車として使う気はない、という見せ方。値打ちがないと思わせる作戦。',
      trap: '先に出た選択肢が耳に残りやすい。sell it to me のあとが彼自身の使い道。',
      use: 'You can take it or leave it.（買うか買わないか、どっちかだ）' },

    // R fix: V2 (blind 60 %): "argue against each" was weak. Now "asks for better options", "again" misheard as a
    //   request for more.
    // why: didn't hear ← "again" heard as a request after noise; better options ← "go over those options" heard as
    //   asking for new ones
    { id: 'h4', skill: 'humor', level: 'C1', point: 'goover', reveals: ['wagon'], seg: [78.6, 82.5],
      stem: 'Why is Andy’s response to the list of options funny?',
      choices: ['He treats the silly options as real choices', 'He asks again as he could not hear the list',
                'He asks Dwight to give him better options'], a: 0,
      cue: '「I have to pick」と、そのあとの頼み。',
      line: 'I have to pick one of those? — Yes. — *Can you go over those options again?*',
      said: '「この中から選ばなきゃいけないの？」と聞き、「もう一回言って」と頼む。',
      mean: '崖や事故の話まで本気で検討している。ばかげた選択肢を真に受ける所が笑い。',
      trap: 'again を聞き逃しの頼みと取りやすい。直前の pick one で、選ぶ気だと分かる。',
      use: 'Can you go over that again?（もう一度説明してもらえますか）' },

    // R fix: V2 (blind 65 %) + K5: the key was the only "To…" among "Because…" choices. All three are now "So…"
    //   purposes; "another buyer" replaces the weak "needs a car today".
    // why: another buyer ← the usual sales pressure ("someone else wants it"); prices rise ← the usual sales line
    //   ("today only")
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'now', reveals: ['offhands'], seg: [82.2, 89.1],
      stem: 'Why does Dwight insist the deal must happen right away?',
      choices: ['So Andy has no time to think', 'So no other buyer gets there first',
                'So he can pay before prices rise'], a: 0,
      cue: '申し出の最後に足す、短い一文。',
      line: 'I will take it off your hands. *It’s got to be now.*',
      said: '値引きを条件に「引き取ってやる。ただし今すぐだ」と言う。',
      mean: '期限を切って考える時間を奪う。押し売りの手口。',
      trap: '今すぐの理由を相手の事情と取りやすい。急がせるのは、売り手に考えさせないため。',
      use: 'Sorry, I need time to think it over.（すみません、考える時間をください）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'offhands', seg: [85.6, 87.7],
      stem: 'Type the words: “I will ___ your hands.” (3 words)', answer: 'take it off',
      cue: '「I will」のあと、つながる三語。',
      line: 'and I will *take it off* your hands.',
      said: '「引き取ってやるよ」と言う。take it off は「テイキロフ」。',
      mean: 'take 物 off 人’s hands ＝ 困り物を引き取る。恩を着せた言い方。',
      trap: 'it が弱く、t が弾んで「ロ」に近い。take off と二語に聞こえやすい。',
      use: 'I can take that off your hands.（それ、引き取ってあげるよ）' },

    // anchor: 92.61–97.11 s "three, two, one, five, four, three, two" (both sources): after "one" the count starts over,
    //   then "now, now, now… shake my hand"
    // R fix: V2 (blind 55 %): "count down with him" was weak. Now "starts over, to give Andy more time": the right
    //   fact, read as kindness. "now, now, now… shake my hand" refutes it.
    // why: nervous ← a counting slip heard as real nerves (the sincerity flip); more time ← the restart heard as a
    //   kind extension
    { id: 'c2', skill: 'humor', level: 'C2', point: 'countdown', reveals: ['now', 'bidders'], seg: [91.5, 108.0],
      stem: 'Why does Dwight’s countdown get a laugh?',
      choices: ['It starts over, so the deadline is fake', 'It starts over, to give Andy more time',
                'He loses count because he is nervous'], a: 0,
      cue: '「one」のあとに来る数。',
      line: 'three, two, *one, five*, four, three, two… Shake my hand.',
      said: '「3、2、1」と数えたあと「5、4、3、2」とやり直し、「今だ、握手しろ」とせかす。',
      mean: '1のあとにまた数えるので、期限は作り物。せかす演技が見えすいていても、アンディは握手する。',
      trap: '数え直しを緊張と取りやすい。一度もためらわずに続けるので、わざと引きのばしている。',
      use: 'Ten seconds left. Okay, ten more.（あと10秒。…よし、もう10秒）' },

    // R fix: V2 (blind 70 %): "Both lose when the car breaks down" was weak. Now "Andy is glad it's sold", so the first
    //   half is shared and Andy's reaction must be heard.
    // why: Andy profits ← "awesome day" heard as Andy's; glad ← Andy did shake on it, and "deal" heard as a good one
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['flip', 'madlib'], seg: [118.5, 159.9],
      stem: 'How does the sale turn out for the two men?',
      choices: ['Dwight profits; Andy feels cheated', 'Dwight profits; Andy is glad it’s sold',
                'Andy profits; Dwight is stuck with junk'], a: 0,
      cue: 'アンディの抗議と、最後の「awesome day」が誰のものか。',
      said: 'ドワイトは車をすぐ eBay で競りにかけ、だまされたと怒るアンディを相手にしない。',
      mean: '安く買って高く売るドワイトの勝ち。アンディは人を信じて損をした。',
      trap: '売ると決めたのはアンディなので、満足していると取りやすい。抗議の声で気持ちが分かる。',
      use: 'I got ripped off.（ぼったくられた）' },

    // R fix: V2 (blind 55 %): "Renting it out" was weak. Now "using it on his farm for profit", from Dwight's own pitch.
    // why: wrecked ← flip = ひっくり返す, read as the car flipped over; farm ← the wagon pitch, with "for profit" attached
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'flip', seg: [122.6, 126.3],
      stem: 'What has Andy found out Dwight is doing with the car?',
      choices: ['Selling it on for more money', 'Turning it over on its roof',
                'Using it on his farm for profit'], a: 0,
      cue: '「my car」のあとの二語。',
      line: 'You’re *flipping my car for profit*.',
      said: '「おれの車を転売してもうけてるな」と問いつめる。',
      mean: 'flip ＝ 安く買ってすぐ高く売る。家や車の転売によく使う。',
      trap: 'flip を「ひっくり返す」と取りやすい。for profit が付けば転売の話。',
      use: 'They flip houses for a living.（家を転売して暮らしてる）' },

    // R fix: V2 (blind 65 %): "Guilty" was the plain opposite. Now "Sorry; he can't undo the sale now", the Japanese
    //   「申し訳ないけど、もう…」 reading of "now".
    // why: sorry ← "now" heard as regret that it's too late; angry ← "my car" heard as Dwight defending himself against a
    //   thief
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'mycar', reveals: ['flip'], seg: [122.6, 126.3],
      stem: 'How does Dwight react when Andy confronts him?',
      choices: ['Unbothered; it is his car now', 'Sorry; he can’t undo the sale now',
                'Angry; he thinks Andy is spying'], a: 0,
      cue: '問いつめられたあとの、短い一言。',
      line: 'You’re flipping my car for profit. — *It’s my car now.*',
      said: '「転売してもうけてるな」に「もうおれの車だ」とだけ返す。',
      mean: '言い訳も謝罪もしない。売った時点で話は終わり、という冷たい態度。',
      trap: 'my car を「取られまいとする怒り」と取りやすい。now があるので、平然とした事実の確認。',
      use: 'Sorry, it’s mine now.（悪いね、もうぼくのだから）' },

    // R fix: K1 + V2 (blind 65 %): "since Dwight called the car junk" left out the farm-wagon story, which is also
    //   "what you said"; the key now covers both. All three are "He sold cheap, …".
    // why: as a friend ← "gave you a deal" read as a favor between coworkers; share ← "based on" heard as a deal with
    //   terms for later
    { id: 'i3', skill: 'infer', level: 'C1', point: 'deal', reveals: ['wagon'], seg: [126.4, 131.3],
      stem: 'What is Andy’s complaint about how the deal was made?',
      choices: ['He sold cheap, trusting what Dwight told him', 'He sold cheap, as Dwight was a friend at work',
                'He sold cheap, for a share of later profit'], a: 0,
      cue: '「based on」のあと、何に基づいたか。',
      line: 'I gave you a deal *based on what you said to me*.',
      said: '「お前の言ったことを信じて、安くしてやったんだ」と言う。',
      mean: 'what you said ＝「ガラクタだ」「農場で使う」。うそを元に値下げした、という抗議。',
      trap: 'deal を「友だち価格」と取りやすい。based on のあとが値下げの根拠。',
      use: 'I trusted what you told me.（言われたことを信じたのに）' },

    // R fix: V2 (blind 65 %): "never Andy's" was weak. Now "quotes a saying that warns sellers", the near miss for a
    //   listener who doesn't notice the saying is turned around.
    // why: warns sellers ← "seller beware" taken as the real saying; eBay buyers ← the eBay line comes next
    { id: 'h5', skill: 'humor', level: 'C1', point: 'beware', reveals: ['deal'], seg: [126.4, 134.4],
      stem: 'Why is Dwight’s two-word answer to Andy’s complaint funny?',
      choices: ['It flips a saying that warns buyers', 'It quotes a saying that warns sellers',
                'It warns Andy about eBay buyers'], a: 0,
      cue: '「Yeah, well」のあとの二語。ふつうは何と言う？',
      line: 'Yeah, well, *seller beware*.',
      said: '「お前を信じて安くした」と言われ、「売り手は用心しろってことだ」と返す。',
      mean: 'buyer beware（買い手は用心せよ）をひっくり返した。ずるい買い手の開き直り。',
      trap: 'beware を次の eBay の話と結びつけやすい。元の決まり文句と比べる。',
      use: 'Buyer beware: read the reviews.（買う側は用心を。レビューを読んで）' },

    // R pass: blind 50 %, but only from the set phrase; "if you'd" and "if you" are both real English here, and the
    //   item is the bank's only `sound`. The 'll is in both sources.
    // why: if you'd ← the weak 'll heard as 'd, a more polite ask; if you ← 'll lost altogether
    { id: 's1', skill: 'sound', level: 'B2', point: 'youll', seg: [134.0, 137.4],
      stem: 'Fill the gap: “Now, ___ excuse me…”',
      choices: ['if you’ll', 'if you’d', 'if you'], a: 0,
      cue: '「Now」のあと、you の終わりの弱い音。',
      line: 'Now, *if you’ll* excuse me…',
      said: '「さて、失礼させてもらうよ」と話を切り上げる。',
      mean: 'if you’ll excuse me ＝ 去るときの決まり文句。丁寧な形で追い払う。',
      trap: '’ll ははっきり聞こえず、you だけに聞こえやすい。決まり文句ごと覚える。',
      use: 'If you’ll excuse me, I have a call.（失礼、電話がありまして）' },

    // why: two ← "way" heard as "two-way" (a common phrase); thirty ← "three" with the stress shifted
    { id: 'n1', skill: 'number', level: 'B1', point: 'bidders', seg: [134.0, 139.4], keep: true,
      stem: 'How many sides are in the bidding war on eBay?',
      choices: ['Two', 'Three', 'Four', 'Thirty'], a: 1,
      cue: '「monitor a」のあと、bidding の前。',
      line: 'I’ve got to monitor a *three-way* bidding war for my car on eBay.',
      said: '「eBay で三者が競り合っているのを見張らないと」と言う。',
      mean: 'three-way ＝ 三者の間の。買い手が三人、値を競っている。',
      trap: 'two-way という言い方もよく聞くので混ざりやすい。three の th と長い母音を聞く。',
      use: 'It’s a three-way tie.（三人が同点だ）' },

    // R fix: V2 (blind 60 %): "mix up who bought the car" was weak. Now the same mechanism aimed the other way (mocks
    //   Dwight, flatters Andy). "sold his Xterra to" settles who is who even with the captions' misspelt names.
    // why: dull again ← a callback to the opening's plain words; other way round ← the names heard late, after the
    //   adjectives
    { id: 'h6', skill: 'humor', level: 'C1', point: 'madlib', seg: [143.2, 156.2],
      stem: 'Why does the closing word-game story get a laugh?',
      choices: ['Its blanks mock Andy and flatter Dwight', 'Its blanks mock Dwight and flatter Andy',
                'Its blanks are as dull as the first one'], a: 0,
      cue: '二人の名前の前に並ぶ語。',
      line: 'A *stupid, idiotic, numbskull* named Andy Bernard sold his Xterra to a *smart and capable* man named Dwight.',
      said: '「まぬけで、ばかで、のろまなアンディが、賢く有能なドワイトに車を売った」という話。',
      mean: '最初の退屈な遊びと同じ形で、語を思い切りえげつなく選んだ。勝ち誇りの一言。',
      trap: '最初の話と同じ遊びなので、同じ退屈さを思い浮かべやすい。今回は語が強烈。',
      use: 'Let’s just say he made a smart choice.（まあ、賢い選択をしたってことで）' },
  ]
};
