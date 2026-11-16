// “Chandler & Monica Argue About Move In Plans | Friends” (the official Friends channel, Best of Season 6): Monica
// plans a beautiful guest room for Rachel's old room, Chandler wants a game room, she says no, he mocks her plan; then
// Joey checks they're still moving in, because his roommate ad is out.
// Segments from the captions, words from whisper (2026-11-16). Whisper puts "Hey, what's up?" at 95 s, the captions at
// 101.3 s; the captions are used. Untested: 0–10 s (the phone message; speakers unclear), "Hey/Or whatever" (31.6 s),
// whisper's "Of course" (62 s, no caption), 94.6 s "your beautiful game room" (captions) vs "guest room" (whisper),
// Joey's ad and reasons (109–132 s: "non-ugly", "a girl who is 19"), and "Not just a hat rack, my friend" (whose
// head, and how meant, is arguable). Monica/Chandler are named where the words settle it ("Gee, Chandler", "Monica
// and I had a stupid fight", Rachel's room = Monica's).
// REVIEW 2026-11-16: pass 6, fix 16, drop 0, new 0; ear checks 0
//   Open: c1 (C2, "what is she not saying?") still invites the "she has already decided" key by its type, and its
//   segment is 27.5 s (the plan through the bare "No."). Drop it if the user's ear says the "No." isn't needed.
import type { Clip } from '../types.ts';

export const gameRoom: Clip = {
  id: 'gameroom', video: 'mQTBBgc_4mU', title: 'Chandler & Monica Argue About Move In Plans', dur: 148, wpm: 148,
  band: 'slow', tags: ['家', '恋愛'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): "who sleeps in it" was a filler; a near miss on the outcome ("he talks her round")
    //   replaces it, so both plan-choices have to be told apart by the ending
    // why: talks her round ← he keeps pushing (Asteroids, the guest-room jab), but she never gives way; move in at all ←
    //   "when you move in" and Joey's later "still moving in?", but both plans assume he does
    { id: 'g1', skill: 'gist', level: 'B2', point: 'room', reveals: ['guest'], seg: [10.7, 96],
      stem: 'How does the talk about Rachel’s room go?',
      choices: ['Each has a plan for it, and she won’t give way', 'Each has a plan for it, and he talks her round',
                'They argue over whether he should move in at all'], a: 0,
      cue: '二人それぞれの案と、彼女の短い返事。',
      said: '彼女は客間、彼はゲーム部屋を出し、彼女は「No.」の一言で断る。',
      mean: '部屋の使い道をめぐる言い合い。話し合おうとしても、彼女は譲らない。',
      trap: '彼が食い下がるので説得できたと取りやすい。move in も出るが、引っ越しは決まった前提。',
      use: 'Let’s figure out what to do with it.（それをどうするか決めよう）' },

    // why: office ← a roll-top desk is coming in her plan; keep for Rachel ← "Rachel's room" is how she names it
    { id: 'd1', skill: 'detail', level: 'B1', point: 'guest', reveals: ['cards'], seg: [17.6, 24.5],
      stem: 'What does Monica want to turn Rachel’s room into?',
      choices: ['A room for visitors to stay in', 'An office built around a big desk', 'A room kept ready for Rachel'], a: 0,
      cue: '「I was thinking」のあと、room の前の語。',
      line: 'I was thinking we should have a *beautiful guest room*, right?',
      said: '「すてきな客間にしたいの。マホガニーのベッドに、いつも花を」と話す。',
      mean: 'guest room ＝ 泊まりに来た人の部屋。客を迎える部屋の計画。',
      trap: 'roll-top desk が聞こえると仕事部屋に引かれるが、机は客の感想カード用。',
      use: 'There’s a guest room if you need it.（客間あるから使って）' },

    // R fix: V2 (blind 80 %): "left the planning to Chandler" was weak; a scope shift (the furniture yes, the room's use
    //   no) replaces it, refuted by "guest room" at the start of her plan
    // why: making it up ← the line taken at face value; scope ← "that much" heard as "not the main question", but she
    //   opened with what the room is for
    { id: 'h1', skill: 'humor', level: 'C1', point: 'thought', seg: [19.8, 34.2],
      stem: 'Why does Monica’s “I really haven’t thought about it” get a laugh?',
      choices: ['Her plan was far too detailed for that to be true', 'She admits she was making it all up on the spot',
                'She has planned the furniture, not what it’s for'], a: 0,
      cue: '細かい計画を話した直後の一言。',
      line: '…how much they love staying here. … I *really haven’t thought about it that much*.',
      said: 'ベッドや花、カードまで話した直後、「そんなに考えてないけど」と付け足す。',
      mean: '言葉と直前の細かさが食い違う。本気の計画をごまかそうとして、かえってばれる。',
      trap: '言葉通りなら思いつき。用途も最初に言っている。言葉と、前の中身の量を比べる。',
      use: 'I haven’t really thought about it.（あんまり考えてないんだけど）' },

    // why: complaints ← comment cards are often for problems; notes to each other ← "people can tell us" heard loosely
    { id: 'd2', skill: 'detail', level: 'B1', point: 'cards', seg: [24.2, 29.5],
      stem: 'What are the little comment cards on the desk for?',
      choices: ['So guests can say how much they loved it', 'So guests can point out what needs fixing',
                'So guests can leave notes for each other'], a: 0,
      cue: '「so people can」のあと。',
      line: 'little comment cards so people can *tell us how much they love staying here*.',
      said: '机に小さな感想カードを置き、泊まるのがどれだけ楽しいか書いてもらう、と言う。',
      mean: 'ホテルのアンケートのよう。しかも、ほめ言葉だけが書かれる前提。',
      trap: 'comment card は苦情用という印象があるが、ここは how much they love。',
      use: 'Please fill out this comment card.（このアンケートにご記入ください）' },

    // R fix: V2 (blind 75 %; the item type invites "she has decided"). One rewrite: "unsure he'll move in" (no anchor
    //   either way) becomes a near miss on the same modest words (worried he'll find it silly), refuted by the bare "No."
    //   S4: the segment now starts at the desk (24.4 s), 27.5 s; it can't be shorter and still hold the "No."
    // why: his ideas ← "haven't thought about it" read as 遠慮, an invitation to talk; silly ← "Or whatever" read as
    //   embarrassment, but a woman who fears her plan is silly doesn't answer his with a flat "No."
    // anchor: 18.2–29 s a full plan (bed, tables, flowers, desk, cards), then 31.6–33 s "haven't thought about it that
    //   much", then 51.2 s a bare "No." to his idea: the plan was settled before she asked
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'thought', seg: [24.4, 51.9],
      stem: 'When Monica says she hasn’t thought about it much, what is she not saying?',
      choices: ['That her mind is already made up', 'That she wants to plan it with him',
                'That she fears he’ll think it’s silly'], a: 0,
      cue: '控えめな一言と、彼の案への返事の速さ。',
      line: 'I *really haven’t thought about it that much*. … *No.*',
      said: '細かい計画のあと「そんなに考えてない」と言い、彼の案には説明なしで「No.」と返す。',
      mean: '控えめな一言は、もう決めてあることを隠すため。彼の案を即座に断ることで、それが分かる。',
      trap: '「考えてない」を遠慮や照れと取りやすい。控えめな言葉は、そのあとの行動で答え合わせ。',
      use: 'Whatever you like. But maybe the blue one?（何でもいいよ。でも青かな？）' },

    // R fix: V2 (blind 90 %): "that much" after the gap made only a negative fit; the stem now stops before it, so the
    //   emphatic "I really have thought about it" is a real option
    // why: have ← the t of haven't drops; hadn't ← the n survives in both, and the past fits "I was thinking" nearby
    { id: 's2', skill: 'sound', level: 'B2', point: 'thought', seg: [31, 34.2],
      stem: 'Fill the gap: “You know, I really ___ thought about it…”',
      choices: ['haven’t', 'have', 'hadn’t'], a: 0,
      cue: '「really」のすぐあと、短い一語。',
      line: 'I really *haven’t* thought about it that much.',
      said: '「そんなに考えてないけど」と言っている。',
      mean: 'haven’t の t はほぼ消え、「ハヴン」で止まる。n の音が否定の印。',
      trap: 't が消えると have に聞こえやすい。have thought なら「考えた」で逆の意味。n が残るかを聞く。',
      use: 'I haven’t decided yet.（まだ決めてない）' },

    // R fix: V2 (blind 55 %): "not serious" was weak; "softens the idea" (I mean as a hedge) replaces it, refuted by
    //   the sales pitch that follows
    // why: corrects ← I mean as self-repair, a common use; softens ← I mean often hedges, but he goes on to sell it
    //   ("the real ones, the big big big ones")
    { id: 'm1', skill: 'marker', level: 'B2', point: 'mean', seg: [37.7, 49.3],
      stem: 'Right after “a game room, you know?”, what does Chandler’s “I mean” do?',
      choices: ['Backs the idea up with a reason to like it', 'Fixes a word he has just said wrong',
                'Softens the idea so it sounds less pushy'], a: 0,
      cue: '「game room」のあと、文頭の二語。',
      line: 'it could be a game room, you know? *I mean*, you can buy old arcade games',
      said: '「ゲーム部屋とか。だってさ、本物の昔のゲーム機が買えるんだよ」と続ける。',
      mean: 'I mean ＝「だってさ」。言い直しでなく、案の良さを付け足して押している。',
      trap: 'I mean は言い直しや和らげにも使うが、ここは続けて売り込む。続く中身で判断する。',
      use: 'Let’s go. I mean, it’s free.（行こうよ。だってタダだし）' },

    // why: $20 ← the weak "-dred" makes "two hundred" sound like "twenty"; $2,000 ← "the real ones, the big ones"
    //   sounds expensive
    { id: 'n1', skill: 'number', level: 'B1', point: 'price', seg: [41.3, 49.3], keep: true,
      stem: 'What does Chandler say an old arcade game costs?',
      choices: ['$20', '$200', '$2,000'], a: 1,
      cue: '「Asteroids」のすぐあと。',
      line: 'like Space Invaders and Asteroids *for $200*',
      said: '「昔の本物のゲーム機が200ドルで買える」と言う。',
      mean: 'arcade game ＝ ゲームセンターの大きなゲーム機。安く買えると売り込んでいる。',
      trap: 'hundred が弱く twenty にも聞こえやすい。最後の「ドゥレッド」まで聞く。',
      use: 'You can get one for about fifty bucks.（50ドルくらいで買えるよ）' },

    // R fix: V2 (blind 50 %): "relieved" was weak; "hurt, ready to drop it" (upset, but the wrong direction) replaces
    //   it, refuted by "Let's discuss it"
    // why: hurt ← a flat no after his pitch reads as a blow, but he presses on; amused ← his joking delivery ("Gee,
    //   Chandler")
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'reject', seg: [50.7, 60.9],
      stem: 'How does Chandler take Monica’s one-word answer?',
      choices: ['Annoyed, and pushing for a real talk', 'Hurt, and ready to let the subject drop', 'Amused, since he was only half serious'], a: 0,
      cue: '「No.」のあとの、長い返事の終わり。',
      line: 'Let’s *discuss it before we reject it completely*.',
      said: '「No って、『面白い案ね、断る前に話し合いましょう』って意味だよね？」と返す。',
      mean: '話し合いもなしに断られた不満を、冗談の形で伝えている。',
      trap: 'おどけた口調で面白がって、または傷ついて引くように見えるが、求めているのは話し合い。',
      use: 'Can we at least talk about it?（せめて話し合えない？）' },

    // R fix: V2 (blind 55 %): "give me your reasons" became a one-dimension near miss ("think it over alone"),
    //   refuted by "Let's". S4: 16.7 s → 7.4 s (53.9–61.3), which still holds "Let's discuss it before we reject it"
    // why: alone ← "discuss it before we reject it" heard as "think before you say no", but it's "Let's"; nicer no ←
    //   he acts out a sweeter reply, so it sounds like
    //   he only wants a gentler tone
    // anchor: 57.7–60.1 s "Let's discuss it before we reject it": "Let's" makes it a talk between them, and it must
    //   come before the no; nothing in his version is about tone
    { id: 'c2', skill: 'infer', level: 'C2', point: 'reject', seg: [53.9, 61.3],
      stem: 'Which plain-English version keeps what Chandler means by “no as in…”?',
      choices: ['“Talk it over with me before you say no.”', '“Think it over alone before you say no.”',
                '“Say no more nicely, and I’ll be fine with it.”'], a: 0,
      cue: '彼が演じる理想の返事の、最後の文。',
      line: 'you mean no as in, “Gee, Chandler… *Let’s discuss it before we reject it* completely.”',
      said: '「その No は『面白い案ね、断る前に話し合おう』って意味だよね？」と、望んだ返事を演じる。',
      mean: '欲しいのは優しい言い方でも一人での再考でもなく、断る前の二人の話し合い。',
      trap: '甘い口調をまねるので「優しく断って」に聞こえやすい。最後の文の Let’s（一緒に）が本題。',
      use: 'Can we talk before you decide?（決める前に話せる？）' },

    // R fix: V2 (blind 75 %): "gives in and says yes" was weak; a keyword trap on "interesting idea" (good idea, but
    //   too costly) replaces it
    // why: too costly ← "interesting idea" heard as praise, plus the $200 named earlier; another day ← "Talk about it"
    //   taken as a promise to talk
    { id: 'h2', skill: 'humor', level: 'C1', point: 'butno', seg: [61.3, 68.6],
      stem: 'Why does Monica’s answer after “I’m sorry” get a laugh?',
      choices: ['She does his steps, then still says no', 'She likes the idea, but says it costs too much',
                'She agrees to talk it over another day'], a: 0,
      cue: '謝ったあとの、短い三つの言葉。',
      line: 'Yes, *interesting idea*. *Talk about it*. *But no*.',
      said: '「ごめん。面白い案ね。話し合いました。でもダメ」と言う。',
      mean: '彼が求めた手順を形だけ全部こなし、答えは同じ No。手順の早送りが笑い。',
      trap: 'interesting や talk about it だけ拾うと、認めたように聞こえる。but のあとが結論。',
      use: 'Great idea. Still no.（いい案ね。でもダメ）' },

    // R fix: V2 (blind 60 %): "gives up and agrees to her antiques" became a role swap ("she mocks his idea, and he
    //   backs down"), refuted because "Are you mocking me?" is hers
    // why: share ← the sitcom compromise ending; role swap ← both mock and both push, so who did which is easy to flip
    { id: 'g2', skill: 'gist', level: 'B2', point: 'mock', reveals: ['guest'], seg: [68.8, 96],
      stem: 'Where does the argument end up?',
      choices: ['He mocks her plan, and she calls him on it', 'They agree to share the room between them',
                'She mocks his idea, and he backs down'], a: 0,
      cue: '最後の、彼女の短い問いと彼の答え。',
      said: '理由を言い合ううち、彼が客間をからかい、彼女が「からかってるの？」と問いつめる。',
      mean: '話はまとまらず、最後はからかいと言い合いで終わる。',
      trap: '仲直りで終わると予想しやすく、誰がからかったかも入れ替わりやすい。最後の問いは彼女。',
      use: 'Are you making fun of me?（私のことからかってる？）' },

    // R fix: V2 (blind 60 %): "accepts and drops it" became "gives in, though let down", refuted by his Asteroids
    //   comeback, now in the segment (to 79.8 s)
    // why: finished ← "that's it?" read literally as "is that all you'll say?"; gives in ← a let-down "that's it?" read
    //   as surrender, but he comes straight back with Asteroids
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'thatsit', reveals: ['guest'], seg: [68.8, 79.8],
      stem: 'What does Chandler’s “So, that’s it?” do?',
      choices: ['Protests that the talk ended so fast', 'Checks that she has finished speaking', 'Gives in, though he sounds let down'], a: 0,
      cue: '「But no.」の直後の短い問いと、彼女の返し。',
      line: '*So, that’s it?* — I just don’t think that… arcade games go in the beautiful guest room.',
      said: '「それで終わり？」と聞き、彼女は理由を説明し始める。',
      mean: '確認でなく抗議。「話し合いもなしに終わりか」と食い下がっている。',
      trap: '文字通りなら確認や了解。相手が理由を言い始め、彼もすぐ言い返すのが抗議の印。',
      use: 'So that’s it? We’re done?（それで終わり？もうおしまい？）' },

    // why: won't fit ← "the big, big, big ones" is still in the ear; cost ← a price was named for the games
    { id: 'd3', skill: 'detail', level: 'B1', point: 'antiques', reveals: ['guest'], seg: [70.5, 76.7],
      stem: 'What reason does Monica give for saying no?',
      choices: ['The guest room will be full of antiques', 'The big machines won’t fit in the room',
                'The games cost more than they can spend'], a: 0,
      cue: '二つ目の文、filled with のあと。',
      line: 'The beautiful guest room’s going to be *filled with antiques*.',
      said: '「ゲーム機は客間に合わない。客間はアンティークでいっぱいにするの」と言う。',
      mean: 'antiques ＝ 古い家具など。それで飾る部屋に、ゲーム機は合わないという理由。',
      trap: 'big big big が耳に残り「大きすぎる」に引かれるが、理由は部屋の雰囲気。',
      use: 'The living room is full of antiques.（居間はアンティークでいっぱい）' },

    // R fix: V2 (blind 75 %): "knows nothing about antiques" was weak; "backing down with a joke" replaces it,
    //   refuted by "is perfect"
    // why: sincere ← he might really think an old game counts as an antique; backing down ← a joke after a no often
    //   closes a fight, but "perfect" pushes his idea
    { id: 'h3', skill: 'humor', level: 'C1', point: 'asteroids', reveals: ['antiques'], seg: [74.3, 80],
      stem: 'Why is Chandler’s comeback about Asteroids funny?',
      choices: ['He bends “antiques” to fit his game idea', 'He really thinks old games are antiques',
                'He backs down by making a joke of it'], a: 0,
      cue: '「antiques」を受けた、返事の理屈。',
      line: 'filled with *antiques*. — *Which is why Asteroids is perfect. It’s the oldest game*.',
      said: '「アンティークで飾る」に「だからアステロイドがぴったり。一番古い」と返す。',
      mean: '「古い物」という一点だけを取って、自分の案に合う理屈を作る。こじつけの笑い。',
      trap: '本気の主張や、冗談で引いたと取りやすい。perfect は押す語。意味をずらしているだけ。',
      use: 'Which is exactly why we should go.（だからこそ行くべきなんだ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'asteroids', seg: [76.4, 80],
      stem: 'Type the start of his reply: “___ Asteroids is perfect.” (3 words)', answer: 'which is why',
      cue: '「antiques」の直後、文頭の三語。',
      line: '*Which is why* Asteroids is perfect.',
      said: '「だからこそアステロイドがぴったりなんだ」と返す。',
      mean: 'which is why ＝ だからこそ。相手の言葉を受けて理由に変える。三語が「ウィチズワイ」とつながる。',
      trap: 'which is がつながり一語に聞こえやすい。語の数で区切りを確かめる。',
      use: 'It’s cheap, which is why I buy it.（安いから、それを買うの）' },

    // R fix: V2 (blind 70 %): "What do you" was the only natural present question; the gap now takes "have", and
    //   "What have you got" (just as natural, ワタヴュガッ) replaces "What would you"
    // why: did ← "do" shrinks to "da", close to "did"; have you got ← the common British-sounding twin of the same
    //   question, with the same h and v
    { id: 's1', skill: 'sound', level: 'B2', point: 'whatdo', reveals: ['guest'], seg: [79.8, 84.3],
      stem: 'Fill the gap: “___ against the beautiful guest room?”',
      choices: ['What do you have', 'What did you have', 'What have you got'], a: 0,
      cue: '文の最初、つながって速い三語。',
      line: '*What do you have* against the beautiful guest room?',
      said: '「客間の何が気に入らないの？」と聞く。',
      mean: 'What do you が「ワダヤ」と縮む。have ～ against ＝ ～が気に入らない。',
      trap: 'do は弱く「ダ」程度で did と紛れやすい。have you got とは got の有無で分ける。',
      use: 'What do you have against sushi?（お寿司の何がいやなの？）' },

    // R fix: V2 (blind 80 %): the key was the only negative choice; "Sorry" became "Playful, but he likes her plan",
    //   refuted by the "30 seconds away" reason and "Are you mocking me?"
    // why: sincere ← "Nothing" heard as a real yes; playful ← a light tease between a couple, but his reason says the
    //   room is pointless
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'mock', reveals: ['guest', 'seconds'], seg: [82.1, 96],
      stem: 'When Chandler says he has nothing against her room, how does he sound?',
      choices: ['Sarcastic: he’s making fun of her plan', 'Sincere: he has come round to her plan',
                'Playful: he teases, but likes her plan'], a: 0,
      cue: '「Nothing.」のあとの理由と、彼女の問い返し。',
      line: 'Nothing. I don’t have anything against the beautiful guest room, *especially since*… — *Are you mocking me?*',
      said: '「何もない。特にみんなすぐ近くに住んでるし」と言い、「からかってる？」と言われる。',
      mean: '反対しないと言いつつ、理由で客間の無意味さを突く。',
      trap: 'Nothing. だけなら同意か冗談。理由の中身と Are you mocking me? が答え合わせ。',
      use: 'No, I’m sure it’ll be lovely.（いや、きっとすてきだと思うよ）' },

    // R fix: V2 (blind 70 %) + C5: "kept small" was weak; "ready at short notice" (friends close = sudden guests)
    //   replaces it. The stem names the guest room, so reveals `guest` is added
    // why: busy ← friends close by = friends over a lot (the wrong implication); short notice ← close friends could turn
    //   up any time, but nobody stays over 30 seconds from home
    { id: 'i2', skill: 'infer', level: 'C1', point: 'seconds', reveals: ['guest'], seg: [83.9, 91.5],
      stem: 'What does the remark about where their friends live imply about the guest room?',
      choices: ['It would hardly ever be used by anyone', 'It would be busy with friends dropping by',
                'It would need to be ready at short notice'], a: 0,
      cue: '「especially since」のあとの理由。',
      line: '*especially since everybody that we know lives about 30 seconds away*.',
      said: '「客間に文句はないよ。特に、知り合いはみんな30秒のところだしね」と言う。',
      mean: '泊まりに来る人はいない、つまり客間は無駄という皮肉。理由を言うふりをしている。',
      trap: '近くに友だち＝よく来る・急に来る、と取りやすい。でも客間は泊まる部屋。',
      use: 'Especially since it’s right next door.（特にすぐ隣だしね）' },

    // R fix: V2 (blind 55 %): "3 minutes" became "13 seconds" (thirty/thirteen), so the funny-small answer isn't
    //   unique
    // why: 13 seconds ← thirty and thirteen differ in stress and the final -n; 30 minutes ← thirty heard, the unit
    //   swapped to the more usual "minutes"
    { id: 'n2', skill: 'number', level: 'B1', point: 'seconds', seg: [85.8, 90.4], keep: true,
      stem: 'How far away does everyone they know live?',
      choices: ['About 13 seconds', 'About 30 seconds', 'About 30 minutes'], a: 1,
      cue: '「lives about」のあと。',
      line: 'everybody that we know lives about *30 seconds away*.',
      said: '「知り合いはみんな30秒のところに住んでるしね」と言う。',
      mean: '～ seconds away ＝ そこから～秒。距離を時間で言う英語の言い方。',
      trap: '単位が速く続き minutes と取りやすい。thirty は頭が強く、-teen なら後ろが強く長い。',
      use: 'The station is five minutes away.（駅は5分のところ）' },

    // why: fight ← the fight was just mentioned, so it sounds like a worried friend; will put out ← "my ad came out"
    //   with the tense missed
    { id: 'i1', skill: 'infer', level: 'B2', point: 'ad', seg: [102.7, 108.8],
      stem: 'Why does Joey check that they’re still moving in together?',
      choices: ['His ad for a new roommate is already out', 'He’s afraid the fight will break them up',
                'He’s about to put an ad out for a roommate'], a: 0,
      cue: '「right?」のあと、Cuz で始まる理由。',
      line: 'But you’re still moving in together, right? *Cuz my ad came out today*.',
      said: '「でも一緒に住むのは変わらないよな？今日、俺の広告が出たんだ」と確かめる。',
      mean: '心配なのは二人の仲より、もう出した同居人募集の広告。',
      trap: 'けんかの直後で気づかいに聞こえるが、理由は cuz のあと。came out は過去で、もう出ている。',
      use: 'The ad came out this morning.（広告は今朝出た）' },

    // R fix: V2 (blind 70 %): "a move to a new place" was weak; "a calmer, slower life" (pace = speed, the other
    //   direction) replaces it, refuted by "someone who's different than me"
    // why: faster ← pace = ペース, speed; slower ← the same literal reading, the other way, and "after living with you"
    //   sounds like relief
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'pace', seg: [117.7, 124.5],
      stem: 'What does Joey mean by “an interesting change of pace”?',
      choices: ['Something different from what he’s used to', 'A faster and busier way to live day to day',
                'A calmer, slower life than with Chandler'], a: 0,
      cue: '「after living with you」のあとの言い方。',
      line: 'after living with you, it’d be an *interesting change of pace*',
      said: '「お前と暮らしたあとだし、女性の同居人は面白い気分転換になる」と言う。',
      mean: 'change of pace ＝ いつもと違うことで気分を変える。速さではない。',
      trap: 'pace を速さと取ると速くも遅くも読める。change of ～ は「目先を変える」。',
      use: 'Let’s eat out for a change of pace.（気分を変えて外で食べよう）' },
  ]
};
