// REVIEW 2026-11-16: pass 11, fix 9, drop 0, new 0; ear checks 1
// OPEN: d1, pr1, pr2, nt1 and pr3 changed on disk after the blind pass, so their blind scores aren't clean
// “Ron Swanson Doesn't Share Food | Parks and Recreation” (the official Parks and Recreation channel, Season 5): at a
// party, Tom tells Ron he's been working on tomorrow's presentation, Ron mentions his gold and catches himself, Tom asks
// to move the meeting and gives in at once, and his business partner's entrance and word games end with a reach for
// Ron's shrimp.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 85 s (whisper loops "see you next time"
// over the end card). Tom is named at 2.6 s and Ron at 57 s ("Swanson"); the partner's name is garbled ("John-Ralphio" in
// whisper only), so stems say "the newcomer". Untested on purpose: the opening "Ron in 60 seconds" card, the partner's
// entrance (52–57 s, "Ricka, ricka…"/"erica"), "Shh, clean" (63–65 s), "I just re-associated all over the mustache"
// (74–77 s), the pause after "I have a" (1.6 s in the captions, 0.25 s in whisper) and the reach itself ("Little
// shrimp?" in whisper, "what are the shrimp" in the captions, 80 s; pr3's line keeps only "shrimp").
// EAR CHECK: 77.1 s nt2 — "That's just one of many skills…" is Tom's straight-faced pitch, with no laugh or sarcasm in
//   his voice (the key also stands on the words "skills he brings to this business partnership")
import type { Clip } from '../types.ts';

export const ronShare: Clip = {
  id: 'ronshare', video: 'dFm7pzMvcLs', title: 'Ron Swanson Doesn’t Share Food', dur: 105, wpm: 130,
  band: 'slow', tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: money tonight ← "I'm always looking for new investments" heard as the point of the talk; advice ←
    //   "working on my presentation" heard as a request for help with it
    { id: 'g1', skill: 'gist', level: 'B2', point: 'ask', seg: [2.0, 49.6],
      stem: 'In the first part of the scene, what is Tom trying to get from Ron?',
      choices: ['A later date for their meeting', 'Money for his business, tonight', 'Advice on his presentation'], a: 0,
      cue: 'Yes, about that のあと、明日の話の中身。',
      said: '発表の準備中と話したあと、明日の予定を動かせないかロンに聞く。',
      mean: '頼みはお金ではなく、打ち合わせの日を延ばすこと。',
      trap: 'investments などの語でお金の話と取りやすい。頼みの文を待つ。',
      use: 'Could we push it to next week?（来週にずらせますか）' },

    // why: show the work ← "I've been working on my presentation" heard as why he came, "heading back" lost; celebrate
    //   ← "congratulate Leslie" heard as a celebration Tom shares with her over his own finished work
    { id: 'd1', skill: 'detail', level: 'B1', point: 'congrats', seg: [2.0, 10.4],
      stem: 'Why has Tom stopped by tonight, by his own account?',
      choices: ['To congratulate Leslie, then go back to work', 'To show Ron his work, then stay for the party',
                'To celebrate his finished work with Leslie'], a: 0,
      cue: 'I just came by のあと、だれに何をしに来たか。',
      line: 'I just came by to *congratulate Leslie* and then I’m *heading back*.',
      said: '「レスリーにおめでとうを言いに寄っただけ。すぐ戻る」と話す。',
      mean: 'heading back ＝ 仕事に戻る。発表の準備はまだ続いている。',
      trap: '先に出た presentation を目的と取りやすい。came by to のあとが目的。',
      use: 'I just came by to say hi.（ちょっと顔を出しに来ただけ）' },

    // R fix: V2 — the key was the only warm reading (blind 55 %); "doubtful" became a second warm one, "envious"
    // why: teasing ← a dry voice read as sarcasm (Tom is at a party, not working); envious ← "I admire" read as
    //   wishing he were like Tom, with the next line about investments missed
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'admire', seg: [8.6, 13.3],
      stem: 'How does Ron take Tom’s news that he’s been working?',
      choices: ['Approving: hard work matters to him', 'Teasing: Tom is at a party, not working',
                'Envious: he wishes he worked that hard'], a: 0,
      cue: '短いほめ言葉と、そのすぐあとに続ける話。',
      line: 'I *admire the work ethic*. I’m always looking for new investments.',
      said: '「その勤勉さは立派だ。新しい投資先はいつも探している」と返す。',
      mean: '本気のほめ言葉。続けて投資の話をするのは、明日の話にも関心があるしるし。',
      trap: '口調が平らだと皮肉に、admire は憧れに聞こえやすい。あとに投資の話が続けば本気。',
      use: 'I admire your work ethic.（その仕事ぶり、尊敬するよ）' },

    // why: five ← the same "-ine" vowel; nineteen / fifteen ← -teen added to a short number, a first job at a usual age
    { id: 'n1', skill: 'number', level: 'B1', point: 'nine', seg: [12.8, 17.6],
      stem: 'How old was Ron when he got his first job?',
      choices: ['Five', 'Nine', 'Fifteen', 'Nineteen'], a: 1, keep: true,
      cue: 'at the age of のすぐあと、短い数字。',
      line: 'Ever since I got my first job at the age of *nine*',
      said: '「9歳で初めて仕事に就いてから、お金は全部金に入れてきた」と話す。',
      mean: '子どものころから働き、ずっと同じ方法でお金をためてきた、という自己紹介。',
      trap: 'nineteen なら語尾の -teen が長く強く残る。数字の終わりに伸びる音があるかを聞く。',
      use: 'I started working at sixteen.（16歳で働き始めた）' },

    // why: starting to fall ← "currently" heard as a trend that is turning; too high ← "high" read as 高すぎる, a reason
    //   not to buy
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'alltime', seg: [15.3, 20.1],
      stem: 'What does Ron say about the price of gold right now?',
      choices: ['It has never been higher', 'It is high, but it is starting to fall', 'It is too high to buy any more'], a: 0,
      cue: 'currently のあと、ひとまとまりの言い方。',
      line: 'which is currently at an *all-time high*.',
      said: '「金は今、史上最高値だ」と言う。全財産を金に入れてきた話の続き。',
      mean: 'all-time high ＝ これまでで一番高い。値上がりを喜んでいる言い方。',
      trap: 'currently を「今は下がり始めた」と取りやすい。all-time がつけば過去最高。',
      use: 'Prices are at an all-time high.（物価が過去最高だ）' },

    // R fix: V2 — the key was the plain idiom and "bragged" was weak (blind 60 %); now the 言いすぎ (rude) frame
    // why: talked too long ← "too much" read as too many words (しゃべりすぎ = 長話); ruder ← 日本語の「言いすぎた」
    //   = said something harsh
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'secret', seg: [19.6, 27.2],
      stem: 'After mentioning his money, what does Ron mean by his final remark?',
      choices: ['He has told more than he wanted', 'He has talked for longer than he meant',
                'He has been ruder than he meant'], a: 0,
      cue: 'money のあとの間と、短い一文。',
      line: 'So I have a certain amount of money. … *I’ve said too much*.',
      said: '「ある程度のお金はある」と言って黙り、「しゃべりすぎた」と足す。',
      mean: 'say too much ＝ 言わなくていい事まで言う。秘密をもらした時の決まり文句。',
      trap: '「言いすぎ」は失礼や長話にも聞こえるが、ここは中身の話。何を明かしたかを聞く。',
      use: 'Oops, I’ve said too much.（おっと、言いすぎた）' },

    // why: about to name the total ← the pause heard as a near-slip he caught in time; embarrassed it's small ← the
    //   Japanese frame: "a certain amount" heard as 謙遜, "only a little"
    // R fix: N6 — notes were 137 characters; mean and trap shortened
    // anchor: 20.3–23.3 s "So I have a certain amount of money" is a finished sentence that names no figure; then a
    //   2.5 s gap in both sources (23.3–25.8 s) before "I've said too much"
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'secret', seg: [19.6, 27.2],
      stem: 'Why does the pause before “I’ve said too much” get a laugh?',
      choices: ['All he gave away was that he has some money', 'He seems to stop just before naming his real total',
                'He seems embarrassed that the amount is so small'], a: 0,
      cue: '間の前の文が、具体的に何を言ったか。',
      line: 'So I have *a certain amount of money*. … I’ve said too much.',
      said: '「ある程度のお金はある」と言い終え、少し黙ってから「しゃべりすぎた」と付け足す。',
      mean: '金額も何も言っていないのに、本人は秘密をもらしたつもり、という笑い。',
      trap: '間を「言いかけて止めた」と取りやすいが、文はもう終わっている。',
      use: 'Let’s just say I’m doing fine.（まあ、困ってはいないとだけ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'forward', seg: [27.3, 30.0],
      stem: 'Type what is said: “___ tomorrow.” (3 words)', answer: 'looking forward to',
      cue: '間のあと、tomorrow の前の3語。',
      line: '*Looking forward to* tomorrow.',
      said: '「明日が楽しみだ」。I’m が省かれ、forward to が「フォワドゥ」とつながる。',
      mean: '会話では I’m を落とすことが多い。',
      trap: 'to は弱く、tomorrow とくっついて消えやすい。forward のあとの一語を聞く。',
      use: 'Looking forward to seeing you!（会えるのを楽しみにしてる）' },

    // R fix: V2 — the key was the textbook softener and the only one about the request (blind 60 %); "away from the
    //   gold" became the はい = agreement frame
    // why: unsure for days ← "was wondering" read literally, past tense = he had been wondering before; says yes ←
    //   "Yes, about that" heard as はい, agreeing to tomorrow before anything else
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'wonder', seg: [29.9, 34.5],
      stem: 'When Tom brings up tomorrow, what does his opening phrase do?',
      choices: ['It softens the request coming next', 'It shows he’s been unsure for days',
                'It says yes to the plan for tomorrow'], a: 0,
      cue: 'about that のあと、頼む前の前置き。',
      line: 'Yes, about that, *I was wondering*, is there any chance…',
      said: '「その件ですが、もしよければ…」と前置きして日程の変更を頼む。',
      mean: 'I was wondering は過去の話ではなく、頼みを控えめにする前置き。',
      trap: '過去形を「前から迷っていた」と取りやすい。頼みの前の I was 〜ing は丁寧さ。',
      use: 'I was wondering if you could help.（手伝ってもらえないかなと思って）' },

    // why: we can ← the d of "could" lost before "reschedule"; you could ← "we" heard as the weak "you" (ya)
    { id: 's1', skill: 'sound', level: 'B2', point: 'could', seg: [31.6, 34.6],
      stem: 'Fill the gap: “Is there any chance ___ reschedule?”',
      choices: ['we could', 'we can', 'you could'], a: 0,
      cue: 'chance のあと、短い2語。',
      line: 'is there any chance *we could* reschedule?',
      said: '「日程を変えられませんか」と聞く。we could は弱く短い。',
      mean: 'any chance we could 〜? は控えめな頼み方。could が丁寧さを足す。',
      trap: 'could の d は次の語とつながり聞こえにくい。「クッ」で止まる音を聞く。',
      use: 'Is there any chance we could talk?（少し話せませんか）' },

    // why: too tired ← "I've been working on my presentation" (4.5 s) heard as the reason; Leslie's event ← "came by
    //   to congratulate Leslie" heard as something he must attend tomorrow
    { id: 'i2', skill: 'infer', level: 'C1', point: 'ready', seg: [34.3, 38.1],
      stem: 'What does Tom’s reason for moving the meeting suggest?',
      choices: ['His presentation isn’t ready yet', 'He’s worn out from working all day', 'He has to be at Leslie’s event'], a: 0,
      cue: 'I just wanna make sure のあと。',
      line: 'I just wanna *make sure everything’s up to* my world-class standees.',
      said: '「全部を世界レベルの基準に仕上げたい」と言う。standards の言い違い。',
      mean: '仕上げたいのは、まだ仕上がっていないから。準備不足を前向きな言葉で包む。',
      trap: '疲れや予定は理由として言われていない。make sure のあとが理由。',
      use: 'I just want to make sure it’s perfect.（完璧にしておきたいだけ）' },

    // R fix: V2 — "his day is full" was a weak third (blind 65 %); now "leaves the choice to Tom", all "X, but Y"
    // why: agrees but warns ← the Japanese frame: a remark about manners heard as a reluctant yes (今回だけは);
    //   leaves it to Tom ← a stated preference read as 「あとはお任せ」
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'appoint', seg: [37.7, 42.8],
      stem: 'What does Ron’s answer to the request do?',
      choices: ['It turns the request down, but indirectly', 'It agrees, but warns him not to ask again',
                'It leaves the choice to Tom, but politely'], a: 0,
      cue: 'son のあと、and I like 〜 が誰の話か。',
      line: 'I like to keep my appointments, son, and *I like others to do the same*.',
      said: '「私は約束を守る主義だ。ほかの人にもそうしてほしい」と答える。',
      mean: 'no とは言わずに、自分の主義を述べて断っている。「だから日程は変えない」という意味。',
      trap: '日本語の「今回だけだぞ」のような渋い承諾と取りやすい。主義を言われたら、それが答え。',
      use: 'I like to stick to the plan.（予定どおりにやりたい人なんだ）' },

    // why: another day ← the request just before, heard as continuing; argues ← "Of course" heard as the start of
    //   a defense ("of course I would, but…")
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'backdown', reveals: ['appoint', 'eight'], seg: [41.9, 47.9],
      stem: 'How does Tom answer Ron’s reply about appointments?',
      choices: ['He gives in right away', 'He asks for a different day', 'He argues for a little while'], a: 0,
      cue: '返事の最初の、短い言葉の重なり。',
      line: '*Of course, yes, no problem*, 8 a.m. tomorrow.',
      said: '「もちろん、はい、問題ありません、明日の朝8時で」とすぐに言う。',
      mean: '同意の語を3つ重ね、あわてて引き下がる。頼みはなかった事に。',
      trap: 'Of course は反論の前置きにもなるが、but が来ない。同意が続けば引き下がり。',
      use: 'Of course, no problem at all.（もちろん、全然大丈夫です）' },

    // why: 7 a.m. / 10 a.m. ← an early meeting heard, the number lost under "no problem"; 8 p.m. ← "a.m." is short and
    //   unstressed, and tonight's party makes an evening plausible
    { id: 'n2', skill: 'number', level: 'B1', point: 'eight', reveals: ['appoint'], seg: [43.4, 47.9],
      stem: 'What time is the meeting tomorrow?',
      choices: ['7 a.m.', '8 a.m.', '10 a.m.', '8 p.m.'], a: 1, keep: true,
      cue: 'no problem のすぐあと、数字と2文字。',
      line: '*8 a.m.* tomorrow, I think you’re gonna be very impressed…',
      said: '「明日の朝8時で。きっと感心しますよ」と言う。',
      mean: 'a.m. ＝ 午前。時刻のあとの a.m. / p.m. で朝か夜かが決まる。',
      trap: 'a.m. と p.m. は最初の音だけが違う。数字のあとの「エイ」と「ピー」を聞き分ける。',
      use: 'Let’s meet at eight a.m. sharp.（朝8時ちょうどに会おう）' },

    // why: the time ← "8 a.m. tomorrow" is the last thing before the question; a name ← "Leslie" (8.5 s), the only
    //   other person named tonight
    { id: 'i3', skill: 'infer', level: 'B2', point: 'our', seg: [44.7, 52.0],
      stem: 'What makes Ron ask who else is joining Tom?',
      choices: ['A word Tom used about the presentation', 'The early time Tom agreed to for the meeting',
                'A name Tom mentioned earlier tonight'], a: 0,
      cue: 'ロンが聞き返した語。直前の文のどこかにある。',
      line: 'very impressed with *our* presentation. — *Our* presentation, who else is joining you?',
      said: '「僕たちの発表に感心しますよ」に、ロンが「僕たち？ほかに誰が？」と聞き返す。',
      mean: 'our は複数の人を含む。ロンは一語を聞き逃さず、相手が一人ではないと気づいた。',
      trap: '直前の時刻や名前に気を取られやすい。聞き返しは相手の語をそのまま繰り返す。',
      use: 'Wait, “we”? Who else is coming?（待って、「僕たち」？ほかに誰が来るの？）' },

    // R fix: V2 — the key was the only negative turn (blind 50 %); the stem asks about Ron, choices parallel
    // why: warms up ← the jokes and "now and forever" heard as charm that works; turns to him ← "I didn't realize you
    //   were a part of this" heard as interest in the newcomer
    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', reveals: ['rethink'], seg: [49.0, 85.3],
      stem: 'Once the newcomer arrives, how does Ron react over the rest of the scene?',
      choices: ['He grows cooler with each new thing', 'He warms up as the jokes go on',
                'He turns his questions to the newcomer'], a: 0,
      cue: 'ロンの短い返事と、最後の一言。',
      said: '相棒が現れ、ロンは「知らなかった」と言い、相棒はしりとりを始め、エビに手を出す。',
      mean: 'ロンの返事はどれも冷たく、相棒の行動が発表の前から印象を悪くしていく。',
      trap: 'Tom の明るい紹介だけで決めない。ロンの返事の温度で流れを見る。',
      use: 'That didn’t exactly help.（あんまり助けにならなかったね）' },
    // R fix: V2 — "partner" was the generic pick among unlike roles (blind 60 %); now three "business" roles
    // why: assistant ← the newcomer is the junior one and follows Tom around; backer ← "new investments" (12 s), as if
    //   he were bringing the money
    { id: 'd3', skill: 'detail', level: 'B1', point: 'partner', seg: [58.4, 63.4],
      stem: 'How does Tom describe the newcomer’s role?',
      choices: ['His business partner', 'His business assistant', 'His business backer'], a: 0,
      cue: 'Of course he is のあと。',
      line: 'Of course he is, he’s my *business partner*.',
      said: '「もちろん彼もです。僕のビジネスパートナーですから」と言う。',
      mean: 'business partner ＝ 共同経営者。発表は二人の会社の話だと分かる。',
      trap: '「投資」の話が前に出たので、お金を出す人と取りやすい。he’s my のあとの2語を聞く。',
      use: 'This is my business partner, Sam.（共同経営者のサムです）' },

    // R fix: V2 — "count down" was weak and the key the only one about words (blind 55 %); now name-dropping
    // why: toasting ← "salute" twice and "now and forever" heard as a toast to the deal; name-dropping ← Forever 21
    //   and the rest sound like famous names
    { id: 'h1', skill: 'humor', level: 'C1', point: 'chain', seg: [66.0, 74.2],
      stem: 'Why is the newcomer’s string of phrases funny?',
      choices: ['Each phrase picks up a word from the one before', 'Each phrase is a famous name, dropped to impress Ron',
                'Each phrase is a toast to their new partnership'], a: 0,
      cue: '前の言い方の最後の語と、次の頭の語。',
      line: 'now and *forever*. Hold up, *Forever 21*, *21* gun *salute*. *Salute* your shorts…',
      said: 'forever、21、salute と、前の語を拾って次の言い方へつなげる。',
      mean: '意味でなく語でつなぐしりとり。商談の場で一人で盛り上がるのが笑い。',
      trap: 'salute を乾杯、名前を自慢と取りや��い。同じ語が2回続けば言葉遊び。',
      use: 'Sorry, I got a little carried away.（ごめん、ちょっと調子に乗った）' },

    // R fix: V2, N7 — "apologizing" was easy to cut (blind 55 %); now "a one-off" (one of many / one-off); its line
    //   says "business partnership", so it reveals d3's partner
    // why: teasing ← the same words read as a dry joke at his partner's expense (sincerity flip); one-off ← "That's
    //   just one…" read as minimizing (ただの〜です), the Japanese frame of covering for your own side
    // anchor: 77.1–79.9 s "That's just one of many skills he brings to this business partnership": skills, brings and
    //   partnership are pitch words, and there's no "sorry" and no "kidding"; Ron's next words are a warning (83 s)
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'chain', reveals: ['partner'], seg: [76.4, 80.4],
      stem: 'After that routine, what is Tom doing with “one of many skills”?',
      choices: ['Pitching it to Ron as a plus', 'Teasing his partner for it', 'Excusing it to Ron as a one-off'], a: 0,
      cue: 'skills のあと、he brings to this 〜 の語。',
      line: 'That’s just one of many *skills he brings to this business partnership*.',
      said: 'しりとりのあと「これも彼が事業にもたらす技能の一つ」と言う。',
      mean: 'just は「ほんの一つ」で、ほかにもあると売り込む語。失敗を長所に。',
      trap: 'That’s just を「ただの〜です」とかばう言い方と取りやすい。one of many は売り込み。',
      use: 'And that’s just one of his talents.（それも彼の才能のほんの一つ）' },

    // why: ask first ← the Japanese frame: a quiet line read as a manners lesson (一言ことわって), not a no; the pitch ←
    //   "rethink" and "move" heard as strategy talk, the meeting being about business
    { id: 'pr3', skill: 'pragma', level: 'C1', point: 'rethink', seg: [79.4, 85.3],
      stem: 'Right after the mention of shrimp, what does Ron’s last line do?',
      choices: ['It warns him to keep his hands off', 'It tells him to ask before taking any',
                'It tells him to rethink the whole pitch'], a: 0,
      cue: 'shrimp のあと、短い命令と呼びかけ。',
      line: '…shrimp? … *Rethink that move, son*.',
      said: '相棒がエビに手を出すと、ロンが「その動き、考え直せ」と言う。',
      mean: 'move は手の動き。「手を出すな」という静かな警告で、son は上からの言い方。',
      trap: 'rethink や move は商談の語にも聞こえるが、直前はエビ。命令の直前を聞く。',
      use: 'I’d think twice about that.（それはやめといたほうがいいよ）' },

  ]
};
