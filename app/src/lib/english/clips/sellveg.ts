// “How to Sell Vegetables | Parks and Recreation” (the official Parks and Recreation channel, Season 6 | Parks and
// Recreation): Leslie is proud of her farmer's market until a loud new chard stand takes it over; she asks Ben, the
// city manager, to kick it out, and he points out that her “rules” are a sign full of vegetable puns.
// Segments from the captions, words from whisper (2026-11-16). Untested: 14–21 s (the tiny tree: visual), 23.5 s
// (captions “Connie cabbage”, whisper “Pawnee cabbage”), 34–62 s (the chard stand's chant: several voices, and the two
// sources disagree on most words), 79.7–85 s (captions “remain calm… won't bay leaf”, whisper “romaine calm… won't
// believe”: no item keys on these words), 85.3–87.4 s (“I don't like vegetables…”: speaker unclear), 89.5 s (whisper
// only: “A little iffy?”), 90.5–92 s (“can't do anything to light/tonight”), 93.8–99.3 s (“Cabbage! Come and get it!…
// put those away”: turns on what is seen), 100 s on (music). Named in the audio: Ben (66.0 s), Connie (97.4 s); Leslie
// is never named, but the opening talking head (“as city councilor”) is hers.
// REVIEW 2026-11-16: pass 3, fix 17, drop 0, new 0; ear checks 1
// REVIEW: s1 and x1 came off the ear-check list (addendum: both sources agree on the words under test).
// REVIEW: i1 assumes “which Pawnee desperately needs” hangs on the last item (healthy lifestyle), not the whole list.
//   If the intonation joins it to all three, i1 needs a rewrite.
// EAR CHECK: 63.7 s nt1 — “chard is so bitter” and “Ben, do something” are the same speaker (assumed; whisper splits
//   them into two segments)
import type { Clip } from '../types.ts';

export const sellVeg: Clip = {
  id: 'sellveg', video: '3S4-nw-O3Dg', title: 'How to Sell Vegetables', dur: 121, wpm: 134, band: 'slow',
  tags: ['買い物', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix (V2, blind 85 %; GUIDE §9.4): the key was the only specific choice and echoed the title's “how to sell”;
    //   now three parallel causes. Seg end 99.5 cut “away” (→ 100.0)
    // why: tastes bad ← “chard is so bitter” taken literally; a city rule ← “check the rules for city vendors” near
    //   the end
    { id: 'g1', skill: 'gist', level: 'B2', point: 'rival', reveals: ['oneway'], seg: [2.0, 100.0],
      stem: 'Over the clip, what spoils Leslie’s day at her market?',
      choices: ['A new stand selling food that tastes bad', 'A loud new stand taking over the market',
                'A city rule forcing her market to close'], a: 1,
      cue: '前半の自慢と、後半で何に腹を立てているか。',
      said: '自分の市場を自慢していたが、派手な売り方の新しい店が現れ、ベンに追い出してと頼む。',
      mean: '問題は野菜の質ではなく、ライバル店の騒がしい売り方。',
      trap: 'rules が何度も出るので規則の話に見えるが、市場を閉める話は出てこない。',
      use: 'What’s going on over there?（あっちで何が起きてるの？）' },

    // R fix (S4): blind 40 % (pass on V2), but seg 6.7 cut “councilor” and 14.3 cut “Look” (→ 7.1, 14.15)
    // why: local farmers ← a farmer's market's usual selling point, and “economy” is said; tourists ← “good for the
    //   economy” heard as visitors' money
    { id: 'd1', skill: 'detail', level: 'B1', point: 'goods', seg: [7.1, 14.15],
      stem: 'Besides the economy and families, what does Leslie say the market is good for?',
      choices: ['Supporting local farmers', 'Promoting a healthy lifestyle', 'Bringing in tourists'], a: 1,
      cue: '3つ目の「it’s good for」のあと。',
      line: 'and it’s good for *promoting a healthy lifestyle*',
      said: '「経済にも家族にもいいし、健康的な暮らしを広めるのにもいい」と話す。',
      mean: 'promote ＝ 広める、後押しする。昇進（promotion）とは別の使い方。',
      trap: 'farmer’s market から農家の話を思いやすいが、3つ目は健康の話。',
      use: 'It’s good for your health, too.（健康にもいいよ）' },

    // R fix (V2, blind 75 %): the key was the only choice tied to the list; now each choice hangs “which” on a
    //   different item (economy, families, lifestyle). Seg as d1
    // why: farmers ← “which” hung on “the economy”; families ← “which” hung on “families”, the middle item
    { id: 'i1', skill: 'infer', level: 'C1', point: 'pawnee', reveals: ['goods'], seg: [7.1, 14.15],
      stem: 'What does her comment right after the list suggest about Pawnee?',
      choices: ['Its farmers have too few customers', 'Many of its people live unhealthily',
                'Its families rarely spend time together'], a: 1,
      cue: '「which」が何を受けているか。直前の語に注目。',
      line: 'a *healthy lifestyle*, *which Pawnee desperately needs*.',
      said: '「健康的な暮らし、ポーニーにぜひ必要なもの」と付け足す。',
      mean: 'which は直前の healthy lifestyle を受ける。町の人は不健康、という遠回しな皮肉。',
      trap: '3つのどれにも which がかかりそうに見えるが、ふつうは直前を受ける。',
      use: 'Fresh air, which I badly need.（新鮮な空気、ぜひ必要だ）' },

    // R fix (V2, blind 60 %): “really” cued a non-literal reading, and “prices” was far off; now best vs cheapest.
    //   Seg end 27.5 cut “Red” (→ 27.4)
    // why: her day ← “what's good” heard like “what's up”, a greeting; cheapest ← a market question about money, and
    //   “safe bet” heard as a bargain
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'whatsgood', reveals: ['safe'], seg: [22.0, 27.4],
      stem: 'When the cabbage vendor is greeted, what is she asked?',
      choices: ['How her day is going so far', 'What is best to buy today', 'What is cheapest to buy today'], a: 1,
      cue: '名前を呼んだあとの質問と、その返事。',
      line: '*what’s good today?* — Green cabbage is always a safe bet.',
      said: '「今日のおすすめは？」と聞き、店の人が「緑のキャベツなら無難」と答える。',
      mean: 'What’s good today? は店でおすすめを聞く決まり文句。',
      trap: 'What’s up? に似ているのであいさつに聞こえる。返事が商品の話かどうかで分かる。',
      use: 'What’s good here?（ここのおすすめは何？）' },

    // R fix (S4 only; blind 45 %): seg end 27.5 cut “Red” (→ 27.4)
    // why: freshest ← “today” in the question; sells out ← “always” heard with a popular item
    { id: 'd2', skill: 'detail', level: 'B1', point: 'safe', seg: [22.0, 27.4],
      stem: 'What does the vendor say about green cabbage?',
      choices: ['It’s the freshest today', 'It always sells out first', 'It’s always a safe bet'], a: 2,
      cue: '「Green cabbage is」のあと。',
      line: 'Green cabbage is *always a safe bet*.',
      said: '「緑のキャベツはいつでも無難」と答える。',
      mean: 'a safe bet ＝ 外れのない選び方。bet は賭けだが、ここでは「選択」くらいの意味。',
      trap: '質問に today があるので「今日の新鮮なもの」と思いやすいが、返事は always。',
      use: 'The pasta is always a safe bet.（パスタなら外れなし）' },

    // R fix (V2, blind 70 %): “can't change your mind” was a filler; now two readings of the red-cabbage praise
    // why: the one to choose ← she has just praised red, read as her top pick; not always ← “I mean” heard as the start
    //   of a “but”
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'cantgo', seg: [25.3, 30.8],
      stem: 'After praising red cabbage, what does the vendor add?',
      choices: ['Red is the one to choose', 'Neither is a bad choice', 'Red is good, but not always'], a: 1,
      cue: '「I mean」のあとの決まり文句。',
      line: 'Red cabbage is good. I mean, *you can’t go wrong*.',
      said: '緑も赤もいい、と言って「どれを選んでも大丈夫」とまとめる。',
      mean: 'You can’t go wrong ＝ どれを選んでも失敗しない。おすすめの決まり文句。',
      trap: '直前に赤を褒めるので「赤が一番」と取りやすいが、緑も赤もどれでも外れなし、の意味。',
      use: 'You can’t go wrong with either.（どっちを選んでも大丈夫）' },

    // R pass (blind 40 %)
    // why: correct ← I mean = 「いや、つまり」, a self-correction; change subject ← I mean heard as a filler before
    //   a new topic
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['cantgo'], seg: [25.3, 30.8],
      stem: 'Right after “Red cabbage is good”, what does her next phrase do?',
      choices: ['It corrects her praise of red cabbage', 'It makes her praise even stronger',
                'It turns the talk to another subject'], a: 1,
      cue: '「good」のすぐあとの短いつなぎ言葉。',
      line: 'Red cabbage is good. *I mean*, you can’t go wrong.',
      said: '「赤もいいよ。っていうか、どれも外れなし」と続ける。',
      mean: 'I mean はここでは「いや、むしろ」。直前の褒め言葉を、もっと強く言い直している。',
      trap: '「いや」の訳から取り消しと思いやすい。I mean のあとが前より強ければ、補強。',
      use: 'It’s cheap. I mean, really cheap.（安い。っていうか、すごく安い）' },

    // R fix (V2, blind 55 %): “red the less fun kind” was a filler; now the toning-down reading of a self-correction
    // why: not fun ← correcting herself sounds like taking it back; tones down ← Japanese frame: a quick fix heard as
    //   modesty (控えめに言い直す)
    { id: 'h1', skill: 'humor', level: 'C1', point: 'funthing', seg: [25.3, 34.2],
      stem: 'Why is the vendor’s quick fix to “the fun thing” funny?',
      choices: ['She admits cabbage isn’t really fun at all', 'She insists cabbage has even more fun sides',
                'She tones down her praise to sound fair'], a: 1,
      cue: '言い直したあと、数が増えたか減ったか。',
      line: 'That’s *the fun thing* about cabbage. *One of the fun things*.',
      said: '「それがキャベツの楽しいところ」と言ってから、「楽しいところの一つ」と言い直す。',
      mean: '楽しい点が一つでは足りない、と真顔で訂正する。キャベツへの熱が大げさで笑いになる。',
      trap: '言い直しは弱める訂正にも聞こえるが、ここは「ほかにもある」と増やす方向。',
      use: 'That’s one of the best things about it.（それがいいところの一つ）' },

    // R fix (V2, blind 85 %; GUIDE §9.2): the stem quoted the line under test and “Dry” was the only knowing word;
    //   the stem names the moment, and the choices are parallel
    // why: praise ← “one way to sell” heard as admiring a new method; buying ← a shopper's frame: “one way” as an
    //   option worth trying
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'oneway', seg: [45.5, 52.4],
      stem: 'Right after the new stand is named, what does the comment show?',
      choices: ['Honest praise for the way it sells', 'Mild interest in buying some chard',
                'Quiet doubt about the way it sells'], a: 2,
      cue: '「I suppose」で始まる、さめた一言。',
      line: 'That’s the new chard stand. *I suppose that’s one way* to sell vegetables.',
      said: '新しい店の騒ぎに「まあ、それも野菜の売り方の一つだね」と言う。',
      mean: 'I suppose that’s one way… は「感心はしない」という遠回しな否定。',
      trap: 'one way を前向きに取りやすい。I suppose が付くと、さめた評価になる。',
      use: 'I suppose that’s one way to do it.（まあ、そういうやり方もあるね）' },

    // R fix (V2, blind 85 %; N7): only the key used the second sense of “bitter”; now a distractor puns too, on the
    //   wrong target. The line names Ben, so it reveals w1 (manager)
    // why: food is bad ← the literal taste, as a reason the stand won't sell; Ben won't help ← the pun aimed at Ben,
    //   who is named right after (but he hasn't refused yet)
    // anchor: 66.0–70.3 s right after: “Ben, do something… kick them out”: a complaint about the stand, not the food,
    //   from someone who has just watched it take over her market
    // retired: one C2 alone is under 2 (nt2 retired)
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'bitter', reveals: ['manager'], seg: [62.6, 74.0], retired: true,
      stem: 'Given what comes next, what else does “chard is so bitter” tell us?',
      choices: ['The chard is too bitter to sell well', 'The speaker is bitter that Ben won’t help',
                'The speaker is bitter about the rival stand'], a: 2,
      cue: '「bitter」のすぐあと、誰に何を頼むか。',
      line: 'Chard is *so bitter*. *Ben, do something.*',
      said: '「チャードって本当に苦い」と言ったすぐあと、「ベン、何とかして」と頼む。',
      mean: 'bitter は「苦い」と「悔しい、恨めしい」の両方。味の文句の形で、ライバル店への悔しさが出ている。',
      trap: '味の話として聞くと、すぐあとの「追い出して」とつながらない。次の一言で二つ目の意味を確かめる。',
      use: 'I’m still a little bitter about it.（まだちょっと根に持ってる）' },

    // R fix (V2, blind 55 %; K6; N7; S3: the cue gave “rules”, now key-only): the key was the only hedged, two-part choice; now all three are. Its key and line
    //   say “check the rules”, so it reveals d3 (rules)
    // why: kicked out ← “kick them out” is the request, and a manager could just do it; keep it down ← the noise is
    //   the complaint, so a softer fix seems likely
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['sign', 'rules'], seg: [62.6, 93.4],
      stem: 'By the end, how is the chard-stand problem left?',
      choices: ['Settled; the stand is kicked out', 'Not yet; the rules will be checked first',
                'Not yet; they’ll be asked to keep it down'], a: 1,
      cue: '最後の一言まで聞いて、結論を確かめる。',
      line: 'I *can’t do anything*… *check the rules* for city vendors.',
      said: '追い出してと頼まれるが、すぐには何もできないので、市の業者の規則を調べる、で終わる。',
      mean: 'まだ解決していない。調べてから決める、という先送り。',
      trap: 'kick them out を何度も聞くので追い出したように思いやすい。最後の一言が結論。',
      use: 'Let me check and get back to you.（確認して連絡します）' },

    // R pass (blind 90 % came from a2's and nt1's stems/lines naming Ben; both now list manager in reveals)
    // why: Leslie ← she is the one asking, and a listener who loses the turns swaps them; Ann ← a near sound of
    //   “Ben” (fixed for the checks: “Connie” made the key under 0.8 × the shortest distractor)
    { id: 'w1', skill: 'who', level: 'B1', point: 'manager', reveals: ['kick'], seg: [65.5, 74.0],
      stem: 'Who is asked to kick the stand out?',
      choices: ['Ben', 'Leslie', 'Ann'], a: 0,
      cue: '頼みごとの前の呼びかけ。',
      line: '*Ben*, do something. … Well, you’re the *city manager*, kick them out.',
      said: '「ベン、何とかして」「シティ・マネージャーでしょ、追い出して」と頼む。',
      mean: '呼びかけの名前と、相手の役職の両方で、頼まれている人が分かる。',
      trap: '頼んでいる人と頼まれている人を取りちがえやすい。呼びかけの名前は相手のこと。',
      use: 'You’re the manager. Can you help?（店長さんですよね。お願いできますか）' },

    // R fix (V2, blind 70 %; N7): “annoyed she is talking to him at all” was a filler; now the deferring reading.
    //   The stem names Ben as the one asked, so it reveals w1 (manager)
    // why: ready ← the literal question, as if he only wants instructions (指示待ち); her lead ← Japanese frame:
    //   “what do you want me to do” as polite deference
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'whatdo', reveals: ['wanna', 'manager'], seg: [65.5, 74.0],
      stem: 'How does Ben’s reply to “Ben, do something” come across?',
      choices: ['Ready to act as soon as she says how', 'Doubtful that there is much he can do',
                'Glad to let her take the lead on it'], a: 1,
      cue: '頼まれた直後の、聞き返しの一言。',
      line: 'Ben, do something. — *What do you want me to do?*',
      said: '「何とかして」と言われ、「僕に何をしろって？」と返す。',
      mean: '本当に指示を聞いているのではなく、「できることはない」という気持ちの聞き返し。',
      trap: '文字どおり取ると指示待ちに見える。このあと彼女が具体的に言い、彼は反論する。',
      use: 'What do you want me to say?（何て言えばいいの？）' },

    // R fix (V2, blind 60 %; GUIDE §9.5): “Why do you want me to do?” and “What you want” aren't real options here;
    //   now three grammatical forms that shrink alike. Seg 66.9 cut “something” (→ 67.15)
    // why: did ← “do” and “did” both shrink in “whaddaya”; would ← “would you” shrinks to “wudja”, close to “d'ya”
    { id: 's1', skill: 'sound', level: 'B2', point: 'wanna', seg: [67.15, 74.0],
      stem: 'Fill the gap: “___ me to do?”',
      choices: ['What do you want', 'What did you want', 'What would you want'], a: 0,
      cue: '「do something」への返事の出だし。',
      line: '*What do you want* me to do?',
      said: '「僕に何をしろって？」と聞き返す。',
      mean: 'What do you want が「ワダユワン」のように一続きになる。do と want の t が弱い。',
      trap: 'do は弱く「ダ」程度で、did や would と紛れやすい。今の頼みへの聞き返しなので do。',
      use: 'What do you want for dinner?（夕飯、何がいい？）' },

    // R fix (S4): seg start → 67.15, in line with s1
    { id: 'x1', skill: 'dict', level: 'B1', point: 'kick', reveals: ['manager'], seg: [67.15, 74.0],
      stem: 'Type what she says: “You’re the city manager, ___.” (3 words)', answer: 'kick them out',
      cue: '「city manager」のすぐあと、短い命令。',
      line: 'Well, you’re the city manager, *kick them out*.',
      said: '「あなたが市の責任者でしょ、追い出して」。',
      mean: 'kick out ＝ 追い出す。them は弱く「エム」程度で、kick‿them がつながる。',
      trap: 'them の th が消えて kick out だけに聞こえやすい。語数から間の語を補う。',
      use: 'They kicked us out at closing time.（閉店で追い出された）' },

    // R pass (blind 60 % came from g2's and i2's “rules”; g2 now reveals rules, i2 already did)
    // why: no license ← the usual reason a city removes a stand; taking spots ← a market dispute over space
    { id: 'd3', skill: 'detail', level: 'B1', point: 'rules', reveals: ['kick'], seg: [67.2, 74.0],
      stem: 'What reason does she give for kicking the stand out?',
      choices: ['It’s selling without a city license', 'It’s breaking every one of the rules',
                'It’s taking the other vendors’ spots'], a: 1,
      cue: '「they’re violating」のあと。',
      line: 'They’re *violating every single one* of the farmer’s market’s *rules of conduct*.',
      said: '「あの店は市場の行動規則を一つ残らず破ってる」と言う。',
      mean: 'violate ＝ 破る。every single one は「一つ残らず」と強める言い方。',
      trap: 'city manager の直後なので、市の許可の話を思いやすい。言っているのは市場の規則。',
      use: 'That breaks every single rule.（それ、規則を全部破ってるよ）' },

    // R fix (V2, blind 85 %; S3: the cue gave “rules”, a key-only word): the key's scare quotes on “rules” gave it away, and “damaged” was a filler
    // why: his OK ← a boss questioning something “you made” sounds like a permission issue; can't see it ← “that
    //   wooden sign” heard as a complaint that the stand never noticed it
    { id: 'i2', skill: 'infer', level: 'C1', point: 'sign', reveals: ['rules'], seg: [69.0, 79.2],
      stem: 'What is Ben’s point when he asks about the wooden sign?',
      choices: ['She needed his OK before putting up a sign', 'A homemade sign isn’t rules he can enforce',
                'The stand can’t be expected to see her sign'], a: 1,
      cue: '「行動規則」と呼ぶものの正体。',
      line: 'By rules of conduct, do you mean that *wooden sign you made*…?',
      said: '「行動規則って、君が作ったあの木の看板のこと？」と聞き返す。',
      mean: '手作りの看板は正式な規則ではない。それを根拠に追い出すことはできない、と言いたい。',
      trap: 'you made を「勝手に作った」と責める意味に取りやすい。ポイントは看板が規則と呼べるか。',
      use: 'Is that an actual rule?（それ、正式な決まりなの？）' },

    // R fix (V2, blind 75 %): the key was the only clever choice; “an order without please” is now the sign's other pun
    //   (the fire rule), which comes after this segment
    // why: kind to vegetables ← “peas” heard as the vegetable the sign is about; fire-safety line ← true of the sign's
    //   next rule, read out after Ben's question
    { id: 'h2', skill: 'humor', level: 'C1', point: 'peas', reveals: ['sign'], seg: [69.0, 79.2],
      stem: 'What makes the sign’s first rule funny?',
      choices: ['It names a vegetable shoppers should be kind to', 'It swaps a polite word for a vegetable',
                'It turns a fire-safety line into a pun'], a: 1,
      cue: '「that says」のあと、最初の一語の音。',
      line: 'that says, “*Peas* be kind to others”?',
      said: '看板には「Peas be kind to others」と書いてある。',
      mean: 'please を peas（豆）に変えただじゃれ。音がほぼ同じで、耳だけでは気づきにくい。',
      trap: 'peas を豆の話と取ると「野菜に優しく」になる。看板の決まり文句を思い出す。',
      use: 'Please be kind to others.（人には親切に）' },

    // R fix (S4): blind 40 % and the anchor settles it, but the seg was 16.2 s; it now starts at Ben's question (→ 73.6)
    // why: backs down ← a question that exposes the sign usually ends the argument; mocks him ← quoting more lines
    //   heard as throwing his jab back
    // anchor: 79.3–85.0 s “Yes, and in case of fire…”: she answers the jab with “Yes” and reads out more of the sign,
    //   proud, instead of defending it as rules
    // retired: for the draws (play 3+ under g2 drew no C2: g2 reveals its point)
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'sign', seg: [73.6, 85.2], retired: true,
      stem: 'How does she answer Ben’s question about the wooden sign?',
      choices: ['She admits the sign is weak and backs down', 'She takes his jab as a real question',
                'She mocks him back by reading his own words'], a: 1,
      cue: '答えの最初の一語と、そのあと続ける内容。',
      line: 'do you mean that wooden sign you made…? — *Yes, and* in case of fire…',
      said: '「あの手作りの看板のこと？」に「そう。それに、火事のときは…」と看板の続きを読み上げる。',
      mean: '彼の問いは「それは規則じゃない」という皮肉。彼女は素直な質問として受け、得意げに続ける。',
      trap: '皮肉を言われたら引くのが普通だが、Yes, and は話を広げる合図。返事の最初の語で向きが分かる。',
      use: 'Yes, and there’s more!（そう、それにまだあるの！）' },

    // R fix (V2, blind 85 %; GUIDE §9.2): the stem quoted and glossed the word under test; it now names the moment
    // why: unfair ← a fair-minded admission, the usual thing to concede; silly ← iffy sounds like “silly”, and the
    //   puns just before are silly
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'iffy', seg: [85.2, 90.3],
      stem: 'Starting with “Okay”, what does she admit about her case?',
      choices: ['That her case is on shaky ground', 'That it’s a little unfair to them', 'That the puns are a little silly'],
      a: 0,
      cue: '「I admit」で認めている中身。',
      line: 'Okay, I admit this is *a little iffy*, but…',
      said: '「まあ、ちょっと怪しいのは認めるけど…」。',
      mean: 'iffy ＝ 問題があるかもしれない、微妙。if（もし）から来たくだけた語。',
      trap: 'iffy は silly と音が近いが、意味は「あやしい」。認めているのは主張の弱さ。',
      use: 'The weather looks a little iffy.（天気がちょっと怪しい）' },

  ]
};
