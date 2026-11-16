// REVIEW 2026-11-16: pass 4, fix 18, drop 0, new 0; ear checks 1
// “Guys Gripe Session - The Office US” (the official The Office channel, Best of Season 2): Michael holds a "guys'
// gripe session" in the warehouse; complaints about girlfriends turn into complaints about pay, then talk of a union.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 179 s; whisper's repeated line after it
// is a hallucination. Untested: 45–60 s ("we even like the same girls", and who should leave: show backstory), 86–98 s
// ("Hasselhoff", "What bugs us" / "He bugs us": tone and wording unclear), 137–152 s (crude "it blows", overlapping
// voices), 160–167 s (the union card: "Dock workers? … hook it up" / "am I truckers, man" differ). No humor item: no
// laugh track, and the one verbal joke ("Not literally") has an unclear speaker.
// EAR CHECK: 167.1 s pr5 — "the problem is the chicks… you gotta blame them" is Michael (assumed; "Are you with us, Mike?" follows; captions start at "the problem")
import type { Clip } from '../types.ts';

export const guysGripe: Clip = {
  id: 'guysgripe', video: '8ds9hMaaHv4', title: 'Guys Gripe Session', dur: 205, wpm: 193, band: 'fast',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2, blind 55 %. "Very; they really need some topics" is now an ice-breaker reading. The ear check is
    //   gone: the words carry the joke (girls' topics for a guys' session, each answered "No").
    // why: light topics ← "topics for conversation" read as easy small talk to start with; pleasing Michael ← "Michael
    //   wants us to…" read as the workers trying to go along
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'ponies', seg: [0, 10.5],
      stem: 'How seriously are the first topic ideas meant?',
      choices: ['Not at all; they mock the whole idea', 'Partly; they want easy topics first',
                'Politely; they want to keep Michael happy'], a: 0,
      cue: '「topics for conversation」のあとに出る名前。',
      line: 'we need topics for conversation. — *Ponies?* — No. — How about *rainbows*?',
      said: '「ポニー？」「虹は？」「花」と出しては「なし」と返す。',
      mean: '男同士の会に女の子向けの話題を並べ、Michael の企画をからかっている。',
      trap: '文字通り取ると、まじめに話題を探しているように聞こえる。並ぶ語の種類で冗談と分かる。',
      use: 'Oh great, another team-building day.（あーあ、また親睦の日か〔皮肉〕）' },

    // R fix: V2, blind 55 %; the title ("Gripe Session") makes complaints the natural guess, so one distractor now
    //   says it (GUIDE §9.4).
    // why: safety ← "my priority is safety" comes early; complaints ← the title and "gripe session" suggest the
    //   workers asked for it
    { id: 'g2', skill: 'gist', level: 'B1', point: 'aim', seg: [0, 52.5],
      stem: 'Why are the men having this session in the first place?',
      choices: ['Michael wants all of them to bond', 'The workers asked to discuss safety', 'The workers asked to air complaints'],
      a: 0,
      cue: '最初の一文、誰が何を望んでいるか。',
      line: '*Michael wants us to bond*, so we need topics for conversation.',
      said: '冒頭で「Michael は俺たちに仲良くなってほしいらしい」と言う。',
      mean: 'bond ＝ 打ち解ける、絆を作る。会は Michael の発案で、本人たちの希望ではない。',
      trap: 'gripe（不満）の会なので本人たちの希望に見える。目的は最初の一文。',
      use: 'It’s a good way to bond with coworkers.（同僚と打ち解けるいい方法だ）' },

    // R fix: V2, blind 60 % ("thanks" was weak). Now "he has done this many times" (confidence read into "I'm fine").
    // why: not hurt ← "I'm fine" is what people say after a fall, but the crash hasn't happened yet; done it before ←
    //   the calm repeat read as a boast of experience
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'imfine', seg: [10, 17.7],
      stem: 'When the workers warn Michael, what does his reply do?',
      choices: ['Brushes off their worries about him', 'Says he wasn’t hurt in the fall',
                'Says he has done this many times'], a: 0,
      cue: '注意する声のあと、同じ言葉を2回くり返す返事。',
      line: 'Mike, get off of the lift, please. — *I’m fine, I’m fine.*',
      said: '「危ないぞ」「降りてくれ」と言われ、「大丈夫、大丈夫」と返す。',
      mean: '心配を軽く受け流す言い方。このあと本当に事故が起きる。',
      trap: 'I’m fine は「けがはない」の意味にもなるが、ここは事故の前。いつ言ったかで意味が決まる。',
      use: 'I’m fine, really. Don’t worry.（本当に平気、心配しないで）' },

    // R fix: V2, blind 60 % ("go to" doesn't fit the meaning). Now "have to", same meaning, so only the ear decides.
    // why: get to ← same shape, but means 〜させてもらえる; have to ← the same meaning, so the stem can't decide it
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotto', seg: [26, 30.5],
      stem: 'Fill the gap: “We’re the ones that ___ clean that up.”',
      choices: ['got to', 'get to', 'have to'], a: 0,
      cue: 'the ones that のあと、短くつながる2語。',
      line: 'We’re the ones that *got to* clean that up.',
      said: '「片づけなきゃいけないのは俺たちだ」。',
      mean: 'got to ＝ have to。t が弾んで「ガダ」に近く聞こえる。',
      trap: 'have to なら h と v の音がある。get to は母音が「エ」。母音と最初の音を聞く。',
      use: 'I’ve got to go now.（もう行かなきゃ）' },

    // R fix: V2, blind 75 % (the quoted "somebody" pointed at the key). The key is reworded; "until later" is now "a
    //   cleaner will come" (Michael's words taken at face value).
    // why: Michael should ← "Damn it, Michael!" follows at once; a cleaner ← "We'll get somebody" taken at face value
    { id: 'i2', skill: 'infer', level: 'B2', point: 'clean', reveals: ['gotto'], seg: [26, 32.3],
      stem: 'After the crash, what does the reply to Michael’s promise point out?',
      choices: ['That the workers will end up doing it', 'That Michael should clean it up himself',
                'That a cleaner will come in later'], a: 0,
      cue: '「Damn it」の前、別の声の文の主語。',
      line: 'We’ll get somebody to clean that up. — *We’re the ones* that got to clean that up.',
      said: '「誰かに片づけさせる」に、「片づけるのは俺たちだ」と返す。',
      mean: 'Michael の言う「誰か」は目の前の倉庫の人たち。上司の気楽さへの不満。',
      trap: 'すぐ「Damn it, Michael!」が続き、本人に片づけろと言ったように思える。主語を聞く。',
      use: 'Guess who has to fix it? Me.（直すのは誰だと思う？私だよ）' },

    // R fix: V2, blind 70 % ("a party" was a filler). Now "a plan to strike", the near miss of a union.
    // why: a fight ← the heated "No, you don't. You don't feel us" + "Damn it, Michael!"; a strike ← "safety" + "pay"
    //   + "we need this" sound like a walkout, but nobody says strike
    { id: 'g1', skill: 'gist', level: 'B2', point: 'turn', reveals: ['nofeel'], seg: [36, 179.5],
      stem: 'How does the session change as it goes on?',
      choices: ['Griping about girls turns into talk of a union', 'Joking around turns into a real fight with Michael',
                'Talk about safety turns into a plan to strike'], a: 0,
      cue: '後半、給料の話のあとに出る語。',
      line: 'Roy, do you still have that card from the dock workers’ *union*?',
      said: 'デートや女性への不満で盛り上がり、給料と手当の話になり、最後は組合を作ろうと言いだす。',
      mean: '親睦のはずの会が、Michael に一番困る話に変わっていく。',
      trap: '言い合いが強くなるのでけんかに見えるが、相手は Michael 個人ではなく待遇。',
      use: 'Things got out of hand pretty fast.（あっという間に手に負えなくなった）' },

    // R fix: V2, blind 50 %. "Safety gear" is now "no training". The line skips "lift"/"left" (the sources differ), so
    //   the ear check is gone; the key rests on "speeding around" and "like a toy", which both agree on.
    // why: no training ← "my priority is safety" sets up a rule about who may drive; slowing work ← "somebody comes in
    //   here" heard as visitors getting in the way
    { id: 'd2', skill: 'detail', level: 'B1', point: 'safety', seg: [64, 72.7],
      stem: 'What does the first worker say really bothers him?',
      choices: ['People racing the machine around like a toy', 'People driving the machine with no training',
                'People coming in here and slowing down work'], a: 0,
      cue: '「My priority is safety」のあと。',
      line: 'somebody comes in here *speeding around*… *playing with it like a toy*.',
      said: '「安全第一。誰かが乗り物を飛ばして、おもちゃみたいに遊ぶのが嫌だ」。',
      mean: '危ない運転への不満。safety は前置きで、本題は具体的な行動。',
      trap: 'safety から講習や規則の話を想像しやすい。前置きのあとの具体的な場面を聞く。',
      use: 'That’s not a toy, buddy.（それ、おもちゃじゃないよ）' },

    // R fix: V2, blind 70 % ("visitors with kids" was a filler). Now the camera crew, the other people who "come in
    //   here".
    // why: a new driver ← "somebody" taken as a general complaint; the crew ← "comes in here" fits outsiders, and the
    //   crew is filming
    { id: 'i3', skill: 'infer', level: 'C1', point: 'somebody', reveals: ['safety'], seg: [64, 72.7],
      stem: 'Who is the worker’s complaint really about?',
      choices: ['Michael, after his ride on it earlier', 'A new driver who is too careless',
                'The camera crew filming in here'], a: 0,
      cue: '少し前の場面で、乗り物に乗っていたのは誰か。',
      line: 'it really bothers me when *somebody* comes in here speeding around…',
      said: '名前は出さずに「誰かが乗り物で飛ばすと気に入らない」と言う。',
      mean: 'さっき乗って事故を起こした Michael のこと。本人の前で遠回しに注意している。',
      trap: 'somebody を一般の話と取ると新人や撮影隊を想像する。前の場面とつなげて聞く。',
      use: 'Some people need to be more careful.（気をつけたほうがいい人がいるね）' },

    // R fix: V2, blind 60 % ("feel ill" was weak). Now "can't forget it" (under the skin = deep, lasting).
    // why: worries ← "under my skin" read as something creeping, deep and uneasy; can't forget ← under the skin read
    //   as stuck deep inside
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'skin', seg: [66.8, 73],
      stem: 'What does the worker mean when he sums up his complaint?',
      choices: ['It really irritates him', 'It quietly worries him', 'It stays with him for days'], a: 0,
      cue: '文句の最後、It kind of のあと。',
      line: 'It kind of *gets under my skin*, okay?',
      said: '「ちょっと頭にくるんだよ、いいか」としめくくる。',
      mean: 'get under one’s skin ＝ イライラさせる。kind of で和らげても、強い不満。',
      trap: '「皮膚の下に入る」から不安や残る感じを想像しやすい。体の比喩は感情の言い方が多い。',
      use: 'His jokes really get under my skin.（彼の冗談、本当にイラッとする）' },

    // R fix: V2, blind 55 %. "He must calm down" is now "telling the worker to calm down" (breathe = 深呼吸して).
    // why: calming him ← "breathing" heard as advice to the angry worker; out of breath ← he did just crash a machine
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'shush', seg: [72.5, 79.2],
      stem: 'After “Don’t shush me”, what is the reply “I was breathing” doing?',
      choices: ['Denying that he shushed anyone', 'Telling the worker to calm down',
                'Saying sorry for being out of breath'], a: 0,
      cue: '文句を言われたあと、言いわけの最後。',
      line: 'Don’t shush me. — No, I… that was just… *I was breathing*.',
      said: '「シーッてするな」と言われ、「いや、今のは…息をしてただけ」と返す。',
      mean: 'シーッと言ったのに、息だったとごまかしている。苦しい言いわけ。',
      trap: 'breathing を文字通り取ると、落ち着く話や息切れの話になる。直前の文句への返事として聞く。',
      use: 'I wasn’t laughing. I was coughing.（笑ってない、せきしてただけ）' },

    // R fix: V2, blind 60 % ("what they like to eat" was a filler). Now "what they have in common", Michael's
    //   earlier words.
    // why: in common ← Michael said "we have a lot in common" earlier; strength ← beef as in "beefy", muscle, + "as
    //   human men"
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'beef', seg: [81.5, 86.4],
      stem: 'After the shushing, what does the next question ask the men for?',
      choices: ['What they all complain about', 'What they all have in common', 'What makes them strong men'], a: 0,
      cue: '「Okay, what is our」のあとの一語。',
      line: 'Okay, what is our *beef* as human men?',
      said: '「さて、人間の男としての、俺たちの不満は何だ？」と聞く。',
      mean: 'beef ＝ 不満、文句（くだけた語）。human men という変な言い方も笑いどころ。',
      trap: 'beef を「牛肉」や筋肉と取るとずれる。our beef と所有格が付けば「不満」。',
      use: 'What’s your beef with him?（彼の何が不満なの？）' },

    // why: once a week ← "weekend" alone heard as one night; every night ← "night" kept, "weekend" lost; every other
    //   weekend ← "every" + "weekend" blur into a softer pattern
    { id: 'n1', skill: 'number', level: 'B1', point: 'often', seg: [98.1, 105.8],
      stem: 'How often do the girls want to be taken out, he says?',
      choices: ['Every other weekend', 'Once a week', 'Every weekend night', 'Every night'], a: 2, keep: true,
      cue: 'restaurants のあと、回数の言い方。',
      line: '…taking them out… *every weekend night*…',
      said: '「週末の夜は毎回、外食に連れていけと言われる」。',
      mean: 'every weekend night ＝ 週末の夜は毎回。金曜も土曜も。',
      trap: 'weekend だけ聞くと週1回と思いやすい。night まで聞くと回数が増える。最後まで聞く。',
      use: 'We eat out every Friday night.（毎週金曜の夜は外食）' },

    // R fix: V2, blind 50 % ("how much they enjoy it" was weak). Now the filler like (a softener).
    // why: comparing ← like = 〜のような; softening ← like heard as the filler "like", 「なんか」
    { id: 'm1', skill: 'marker', level: 'B2', point: 'like', seg: [98.1, 105.8],
      stem: 'How does he bring in the girls’ question about a date?',
      choices: ['By acting out what they say', 'By comparing them to something', 'By softening what comes next'],
      a: 0,
      cue: '「and then they’re」のあとの短い語。',
      line: 'and then they’re *like*, “When are we gonna go on a date date?”',
      said: '「そしたら彼女たち、『いつデートに行くの？』って言うんだ」。',
      mean: 'be like ＋ セリフ ＝ 「〜って言う」。口調をまねて話を再現する会話の言い方。',
      trap: 'like を「なんか」や「〜のような」と取るとずれる。あとに引用が来たら「〜って」。',
      use: 'And she was like, “No way!”（で、彼女「うそでしょ！」って）' },

    // R fix: V2, blind 50 %. "A second date" is now "a double date" (the doubled word, read as a word you know).
    // why: a double date ← the doubled word heard as "double date"; a fixed day ← date = 日付
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'datedate', seg: [98.1, 105.8],
      stem: 'What kind of outing do the girls say they still want?',
      choices: ['A proper date, not just dinner', 'A double date with their friends', 'A date with a fixed day and time'],
      a: 0,
      cue: '彼女たちのセリフの最後、同じ語が2回。',
      line: '“When are we gonna go on a *date date*?”',
      said: '毎週外食しているのに、「いつデートに行くの？」と聞かれると不満を言う。',
      mean: '同じ語を2回重ねて「本物の〜」と強める言い方。いつもの外食はデートに入らない。',
      trap: 'double date や日付と取りやすい。名詞を重ねたら「ちゃんとした〜」。',
      use: 'I mean a job job, with benefits.（ちゃんとした仕事のことだよ、手当付きの）' },

    // why: Sunday lost ← church + morning suggest a ruined day off; too early ← "the next morning" heard as an early start
    { id: 'd3', skill: 'detail', level: 'B2', point: 'church', seg: [109.6, 114.5],
      stem: 'What is the complaint about the next morning?',
      choices: ['Driving them costs money for gas', 'Church takes up their whole Sunday', 'They have to get up far too early'],
      a: 0,
      cue: '「church the next morning」のあと。',
      line: '…they make you drive them to church the next morning, like, *gas ain’t free*.',
      said: '「次の朝は教会まで送らされる。ガソリンはタダじゃないのに」。',
      mean: 'ain’t は isn’t のくだけた形。お金がかかる不満で、教会が嫌なわけではない。',
      trap: 'church や morning から休日や早起きの話を想像しやすい。like のあとに本音。',
      use: 'Parking ain’t cheap around here.（このへん駐車代高いんだよ）' },

    // R fix: V2, blind 65 % ("not listening" was weak). Now "no girlfriends to drive around", the gripe just before.
    // why: girlfriends ← the gripe just before was about driving girls around; never in a warehouse ← "How can you?"
    //   heard as a jab at his office job
    { id: 'i5', skill: 'infer', level: 'B2', point: 'nofeel', seg: [121.5, 130],
      stem: 'Why does the worker say Michael can’t really feel for them?',
      choices: ['He gets paid far more than they do', 'He doesn’t drive girls around like them',
                'He has never worked in a warehouse'], a: 0,
      cue: '「How can you?」のあと、but のうしろ。',
      line: 'You say we’re the same, but we get *compensated very differently*.',
      said: '「分かるよ」に「分かるもんか。同じと言うが、もらう額が違う」と返す。',
      mean: 'compensated ＝ 給料をもらう（硬い語）。給料が違う人に分かるはずがない、という反発。',
      trap: '直前の女性の話を引きずりやすい。but のあとに本当の理由。',
      use: 'How would you know?（あなたに何が分かるの）' },

    // why: longer ← "a lot harder" and "a lot less" pile up and sound like more hours; fewer ← "less" said a moment later
    { id: 'd4', skill: 'detail', level: 'B1', point: 'hours', reveals: ['nofeel'], seg: [129.8, 136.6],
      stem: 'What do the workers say about their hours compared with Michael’s?',
      choices: ['They work the same hours', 'They work longer hours', 'They work fewer hours'], a: 0,
      cue: '「We work」のあと。',
      line: 'We work *the same hours* as you…',
      said: '「同じ時間働いて、仕事はもっときつくて、給料はずっと少ない」。',
      mean: '時間は同じ、仕事はきつい、給料は少ない。三つ並べて不公平を示している。',
      trap: 'a lot harder などが続くので「長く働く」と思いやすい。harder はきつさの話。',
      use: 'We work the same hours, right?（同じ時間働いてるよね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'union', reveals: ['turn'], seg: [142.6, 145.7],
      stem: 'Type the end of the line: “This would not happen ___.” (5 words)', answer: 'if we had a union',
      cue: '「would not happen」のあと。had a がつながる。',
      line: 'this would not happen *if we had a union*.',
      said: '「組合があれば、こんなことにはならない」。',
      mean: '仮定の言い方。今は組合がないので、作ろうという流れになる。',
      trap: 'had a が「ハダ」と一続きになり、a を落としやすい。union は「ユーニャン」に近い。',
      use: 'If we had a car, we’d drive.（車があれば運転するのに）' },

    // R fix: V2, blind 65 % ("happily agreeing" didn't fit "Is that necessary?"). Now "asking what it would cost".
    // why: checking ← "you already sort of have a union" taken literally; cost ← "necessary" read as weighing the
    //   price
    { id: 'pr4', skill: 'pragma', level: 'C1', point: 'necessary', reveals: ['turn'], seg: [152.9, 157.2],
      stem: 'When the union idea grows, what is Michael doing with his question?',
      choices: ['Gently trying to talk them out of it', 'Honestly checking whether they joined one',
                'Asking what a union would cost them'], a: 0,
      cue: '「You know what?」のあとの質問と、その理由。',
      line: 'Is that *necessary*? ’Cause you already *sort of have a union of guys*.',
      said: '「それ、必要？もう男同士の組合みたいなものがあるじゃないか」と言う。',
      mean: '上司として組合は困る。質問の形で、遠回しにやめさせようとしている。',
      trap: 'sort of have a union を文字通り取ると、加入の確認に聞こえる。上司の立場で考える。',
      use: 'Is that really necessary?（それ、本当に必要？）' },

    // R fix: V2, blind 60 % ("jokingly" was weak). Now "angrily, ready to quit" (an overreading of the force).
    // why: agreeing politely ← talking back to a boss read through the Japanese frame (遠慮して引く); ready to quit ←
    //   the strong words read as a threat
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'firm', reveals: ['necessary'], seg: [156.9, 160.1],
      stem: 'How does the worker answer Michael’s doubt about needing one?',
      choices: ['Firmly; he won’t give the idea up', 'Politely; he agrees it may not be needed',
                'Angrily; he’s ready to quit over it'], a: 0,
      cue: '相手の言葉をくり返す返事と、その次の文。',
      line: 'It’s *more than necessary*, Mike. *We need this*.',
      said: '「必要どころじゃないよ、Mike。これが要るんだ」と言い返す。',
      mean: '相手の言葉を使って強く打ち返す言い方。引く気はまったくない。',
      trap: '上司への返事なので、日本語の感覚では遠慮して同意しそうに思える。言葉を強めて返している。',
      use: 'It’s more than important. It’s urgent.（大事どころか、急ぎだよ）' },

    // R fix: V2, blind 75 %. "Low pay" is now "money problems" (closer to the gas and restaurant gripes).
    // why: women caused it ← "the problem is the chicks" heard as a real answer to the money talk; his own troubles ←
    //   the earlier girlfriend griping
    { id: 'pr5', skill: 'pragma', level: 'C1', point: 'chicks', reveals: ['turn'], seg: [166.8, 174],
      stem: 'Near the end, what is Michael doing by blaming the women?',
      choices: ['Steering the anger away from pay and the union', 'Agreeing that women cause their money problems',
                'Admitting he has had girlfriend problems too'], a: 0,
      cue: '組合の話のあと、「You know what?」で始まる声。',
      line: 'I think *the problem is the chicks*. And you gotta blame them.',
      said: '組合の話が進むなか、「問題は女の子たちだ。あいつらのせいにしよう」と言いだす。',
      mean: '話を女性への不満に戻し、組合から目をそらさせようとしている。',
      trap: '前の話の続きと取ると、女性が給料の原因だという意見に聞こえる。話題の戻し方に注目。',
      use: 'Let’s get back to what we were saying.（さっきの話に戻ろう）' },

    // R fix: V2, blind 55 %. Parallel wording now ("Whether he … what they …"), so the key's shape doesn't stand out.
    // why: following ← "Are you with us?" = 話についてきてる？; coming along ← with us = 一緒に来る
    { id: 'f5', skill: 'phrase', level: 'B2', point: 'withus', reveals: ['turn'], seg: [175.3, 178.3],
      stem: 'At the end, what is the worker asking Michael?',
      choices: ['Whether he backs what they want', 'Whether he follows what they mean', 'Whether he’ll come along with them'],
      a: 0,
      cue: '最後、Mike と呼ぶ前の短い質問。',
      line: '*Are you with us*, Mike?',
      said: '最後に「Mike、俺たちの側か？」と聞き、Michael は「ああ」と答える。',
      mean: 'Are you with us? ＝ 味方か、賛成か。ここでは組合の話に乗るかを聞いている。',
      trap: '「話についてきてる？」の意味もあるが、組合の話のあとなら立場の質問。',
      use: 'I’m with you on that.（その点は賛成だ）' },
  ]
};
