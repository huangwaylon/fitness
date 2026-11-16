// “Andy Dwyer Investigates | Parks and Recreation” (the official Parks and Recreation channel, Season 5): Andy finds
// his computer gone and takes it for the practice theft he asked the office for; he grills co-workers until Chris
// says another computer was stolen too; the police officer says it's just a report, Andy loses heart, and he's offered
// a weekend security-guard job instead, on one condition.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 231 s. Names in the audio: Andy, Jerry
// / Gary, Chris Traeger, "officer" / "the policeman". The other speakers aren't named, so stems don't name them. The
// sources differ at 14.5 s (the misquoted "game is afoot" line), 30.8 s ("do you guys" / "did you guys"), 125 s ("I
// think"), 147 s ("You're just" / "You just") and 162.6 s ("maybe I had to" / "maybe you ought to"); no key rests on
// those words, and the lines trim them. Untested: the glasses (30–35 s), the "Really? — No." muddle (82–85 s), the
// carpet-store suspect (171–183 s) and the shirt (197–202 s) except as a C2 callback.
// EAR CHECK: 43.7 s a1 — Jerry's "Yes, I took your government computer…" is plainly sarcastic (the key also rests on
//   the words: the over-precise route and price, and "It wasn't me" at 80.7 s)
// EAR CHECK: 93.0 s s1, 128.7 s x1 — "doesn't come up" (the t of doesn't nearly lost before "come"); "what's the play
//   here" run together at speed; both sources agree on the words
// REVIEW 2026-11-16: pass 8, fix 14, drop 0, new 0; ear checks 2 (as authored). Blind pass: 14 of 21 choice items
//   were ≥ 50 % and right. n1 now reveals practice (its stem states g1's key).
import type { Clip } from '../types.ts';

export const andyInvestigates: Clip = {
  id: 'andyinvest', video: 'KXOm29FkU48', title: 'Andy Dwyer Investigates', dur: 252, wpm: 153, band: 'mid',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, 80 % blind: the key was the only police choice under a title that says "Investigates", and n1's
    //   stem states it (n1 now reveals practice). Both distractors are now cases he could think it is.
    // why: exam begun ← "part of the police academy entrance exam is investigating a crime" heard as the exam itself;
    //   a joke ← "they should steal something" heard as a prank, not a request
    { id: 'g1', skill: 'gist', level: 'B1', point: 'practice', seg: [0, 29.8],
      stem: 'Why is Andy glad to find his computer gone?',
      choices: ['He thinks it’s the practice case he asked for', 'He thinks his police exam has already begun',
                'He thinks a co-worker hid it as a joke'], a: 0,
      cue: '「a month ago」のあと、皆に頼んだこと。',
      said: '警察学校の試験に事件の捜査があるので、机から何か盗んでくれと前に皆に頼んでいた。',
      mean: '本物の盗難ではなく、練習用の事件が始まったと思って喜んでいる。',
      trap: 'exam が聞こえるので、試験そのものが始まったと思いやすい。so I could のあとが目的。',
      use: 'I could use the practice.（いい練習になるよ）' },

    // why: a week / a year ← the nearest round spans of time, when the word after "about a" is missed
    // R fix: C5: the stem says he asked the office to steal from him, which is g1's key, so it reveals practice
    { id: 'n1', skill: 'number', level: 'B1', point: 'month', reveals: ['practice'], seg: [21.95, 27.4],
      stem: 'How long ago did Andy ask the office to steal from him?',
      choices: ['about a week', 'about a month', 'about a year'], a: 1, keep: true,
      cue: '「So about」のすぐあと。',
      line: 'So *about a month ago*, I told everyone in the office…',
      said: '「1か月くらい前、オフィスの皆に頼んでおいた」と言う。',
      mean: '頼んだのはずっと前。だから皆はもう忘れているかもしれない。',
      trap: 'about a のあとの短い一語は聞き落としやすい。ago の直前の名詞だけを拾う。',
      use: 'I moved here about a month ago.（1か月くらい前に引っ越してきた）' },

    // why: guarding ← "fence" = 柵, as something that protects; hiding ← a fence hides things behind it
    { id: 'p1', skill: 'phrase', level: 'C1', point: 'fencing', seg: [38.35, 43.6],
      stem: 'What does Andy suggest Jerry was really doing in Miami?',
      choices: ['Selling stolen computers', 'Guarding stolen computers', 'Hiding stolen computers'], a: 0,
      cue: '「Maybe」のあとの動詞。',
      line: 'How do you spend your time in Miami? Maybe *fencing stolen computers*?',
      said: '「マイアミで何してた？盗んだパソコンをさばいてたとか？」と聞く。',
      mean: 'fence はくだけた言い方で「盗品を売りさばく」。刑事ドラマの言い回しをまねている。',
      trap: 'fence を「柵」と取ると、守る・隠すに引かれる。stolen と並んだら売買の話。',
      use: 'He got caught fencing stolen bikes.（盗んだ自転車を売っていて捕まった）' },

    // R fix: V2, 65 % blind: the key was the only joke against two sincere readings. Two choices are now jokes, so
    //   what the joke does decides (the over-precise route answers Andy's absurd "fencing" question).
    // why: covering ← a joke heard as a cover, since Andy then says "you gave yourself away"; confession ← "Yes, I took
    //   your…" taken at face value (the sincerity flip)
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'sarcasm', reveals: ['bucks'], seg: [43.2, 56.0],
      stem: 'How does Jerry mean his answer about the computer?',
      choices: ['A joke: he’s mocking Andy’s question', 'A joke: he’s covering for the real thief',
                'A confession: he’s tired of hiding it'], a: 0,
      cue: '答えの細かさと、聞いた側の受け取り方。',
      line: '*Yes, I took your government computer* from Indiana to Miami… — You just *gave yourself away*.',
      said: '「そう、マイアミまで運んで闇市場で売った」と答え、Andy は「白状したな」と言う。',
      mean: 'ばかげた質問に、わざと大げさに乗った皮肉。Andy だけが本気にしている。',
      trap: 'Yes から始まるので告白に聞こえる。話が細かく大げさすぎたら、冗談の合図。',
      use: 'Yes, I’m a secret spy. Obviously.（そう、私はスパイ。当然でしょ）' },

    // why: fifteen / fifty ← -teen/-ty, with "a hundred" lost before them
    { id: 'n2', skill: 'number', level: 'B1', point: 'bucks', seg: [49.2, 53.2],
      stem: 'For how much does Jerry say he would sell it?',
      choices: ['fifteen dollars', 'fifty dollars', 'a hundred fifty dollars'], a: 2, keep: true,
      cue: '「black market for」のあと。',
      line: 'to sell it on the black market *for 150 bucks*.',
      said: '「闇市場で150ドルで売るため」と言う。bucks はドルのくだけた言い方。',
      mean: '政府のパソコンにしては安すぎる値段。冗談だと分かる材料の一つ。',
      trap: 'one fifty は「ワン」が短く、fifty だけ残りやすい。数字の前の小さな音も聞く。',
      use: 'It’s about fifty bucks.（50ドルくらいだよ）' },

    // R fix: V2, 70 % blind: the key alone named the tough-cop line. All three now start "The tough-cop line…".
    //   why: makes him angry ← "It's not" heard as a snap; over his head ← a short reply heard as not getting it
    { id: 'h1', skill: 'humor', level: 'C1', point: 'realname', seg: [57.6, 66.9],
      stem: 'Why does the man’s reply to Andy’s “real name” line get a laugh?',
      choices: ['The tough-cop line turns out to be true', 'The tough-cop line only makes him angry',
                'The tough-cop line goes right over his head'], a: 0,
      cue: '決まり文句のあとの、短い返事。',
      line: '…*if that even is your real name*. — *It’s not.* My real name is Gary.',
      said: '「それが本名ならな」と刑事っぽく言うと、「違う。本名はゲーリー」と返される。',
      mean: '刑事ドラマのおどしの決まり文句が、本当に当たってしまう。',
      trap: 'It’s not で嘘を認めたように聞こえる。続く「本名は」で、間違えていたのは呼んだ側。',
      use: 'Is that even your real name?（それ、本当に本名？）' },

    // R fix: V2, 55 % blind: "give back" was a filler. "Look at a cop" (his own "look at me", a keyword trap) and
    //   "get a lawyer" (the TV rule) are now the distractors.
    // why: look at ← "look at me" said just before; lawyer ← a real police rule learners know from TV
    { id: 'd2', skill: 'detail', level: 'B2', point: 'legally', seg: [69.05, 79.1],
      stem: 'What does Andy claim the law requires of a criminal?',
      choices: ['To admit it when a cop asks', 'To look at a cop who asks', 'To get a lawyer before he talks'], a: 0,
      cue: '「legally」の前と、or else のあと。',
      line: 'if you’re a criminal, look at me. *You have to tell me, legally*, or else it’s considered entrapment.',
      said: '「犯人なら法律上ぼくに言う義務がある。でないとおとり捜査だ」と言う。',
      mean: 'もちろんそんな法律はない。Andy の思い込みを、本人は大まじめに話している。',
      trap: '警察と法律の話なので、よく聞く本物の決まりを選びやすい。have to のあとの動詞を拾う。',
      use: 'Legally, you have to tell me.（法律上、私に言う義務があるよ）' },

    // why: he knows ← "so we know it's not Jerry" right before; lied himself ← "lying to me" heard the other way round
    { id: 'h2', skill: 'humor', level: 'C1', point: 'lying', reveals: ['doesnt'], seg: [85.0, 94.6],
      stem: 'Why is Andy’s hope at the end of his comment funny?',
      choices: ['Spotting lies is a huge part of police work', 'He has just said he’s sure it isn’t Jerry',
                'He was the one telling lies to Jerry'], a: 0,
      cue: '「Hopefully」のあとと、なりたい仕事。',
      line: 'I can *never tell when people are lying to me*. *Hopefully that doesn’t come up in my police work.*',
      said: '「人の嘘は見抜けない。警察の仕事でそれが出てこないといいな」と話す。',
      mean: '嘘を見抜くのは警官の基本。それを「出てこないといい」と願うずれがおかしい。',
      trap: '直前の「Jerry ではない」と矛盾する点に目が行きやすい。笑いは最後の一文の願いにある。',
      use: 'Hopefully that won’t come up.（それが話に出ないといいけど）' },

    // R fix: V2, 60 % blind: "Hopefully" wants a negative, and the key was the only present negative. "won't come"
    //   (a second present negative) is added; all four are strong, so 4 choices.
    // why: does come ← the weak t lost, so "doesn't" ≈ "does"; didn't ← the same shape in the past; won't ← the same
    //   meaning, the shape a learner expects after "Hopefully"
    { id: 's1', skill: 'sound', level: 'B2', point: 'doesnt', seg: [92.0, 95.05],
      stem: 'Fill the gap: “Hopefully that ___ up in my police work.”',
      choices: ['doesn’t come', 'does come', 'won’t come', 'didn’t come'], a: 0,
      cue: 'that のすぐあと、come の前の小さな音。',
      line: 'Hopefully that *doesn’t come* up in my police work.',
      said: '「警察の仕事でそれが出てこないといい」。doesn’t の t はほぼ消える。',
      mean: 'come up ＝（問題が）出てくる。Hopefully と合うのは否定の形。',
      trap: 't が落ちると does に聞こえやすい。n の鼻にかかる音が残っていれば否定。',
      use: 'If it comes up, call me.（その話が出たら電話して）' },

    // R fix: V2 + K1, 60 % blind: "picks the one man who couldn't do it" was half true (it's a real theft). The
    //   distractors are now a form twin and a callback.
    // why: questions ← Chris's "Did what?" heard as Andy's; wrong name ← the Jerry / Gary joke a minute before
    { id: 'h3', skill: 'humor', level: 'C1', point: 'compliment', seg: [102.5, 111.95],
      stem: 'What is funny about the way Andy accuses Chris?',
      choices: ['His threats keep turning into compliments', 'His threats keep turning into questions',
                'He keeps calling Chris by the wrong name'], a: 0,
      cue: '責める言葉に混じる、ほめ言葉。',
      line: 'Don’t play *stupid and handsome* with me… You’re *as guilty as you are sexy*.',
      said: '「バカでハンサムなふりはよせ」「君はセクシーなのと同じくらい有罪だ」と迫る。',
      mean: '刑事のおどし文句に、相手へのほめ言葉が入ってしまう。本気で責めきれていない。',
      trap: 'Did what? は Chris の言葉。悪口の型にほめ言葉が入ったら笑い。',
      use: 'Don’t play dumb with me.（とぼけないで）' },

    // why: his own too ← Chris's office is nearby, as if he lost one; seen ← the usual police-show reason
    { id: 'd3', skill: 'detail', level: 'B1', point: 'another', seg: [111.95, 120.5],
      stem: 'What makes Chris think this is a real theft?',
      choices: ['Another office lost a computer too', 'His own computer is missing as well',
                'Someone saw a thief in the hallway'], a: 0,
      cue: '最初の主語と、from のあとの場所。',
      line: '*another computer was reported stolen* from the offices on the other side of the courtyard.',
      said: '「中庭の向こうの部署でも、パソコンの盗難届が出た」と言う。',
      mean: 'だから練習ではなく、本当に市役所が盗みにあった、という話。',
      trap: 'another computer だけ聞くと、自分のものもと思いやすい。from のあとの場所を拾う。',
      use: 'Another bag was reported missing.（ほかのカバンも紛失届が出た）' },

    // R fix: V2, 70 % blind: Andy's eagerness everywhere made "excited" the obvious pick. The choices are now
    //   degrees of the same eagerness.
    // why: less excited ← "even" lost, and a real case read as less fun than his game; calm ← "real" heard as the
    //   moment he turns serious, like a real cop
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'better', seg: [124.15, 128.4],
      stem: 'How does Andy take the news that the crime is real?',
      choices: ['He’s even more excited than before', 'He’s less excited, but still keen',
                'He’s calm, the way a real cop is'], a: 0,
      cue: '「real crime?」と聞き返したあとの一言。',
      line: 'Like a real crime? *That’s even better.*',
      said: '「本物の事件？ もっといいじゃん」と言う。',
      mean: 'even better ＝「さらにいい」。練習より本物の方がうれしい、という反応。',
      trap: 'even を落とすと程度が分からない。even + 比較級なら、良さが前より増している。',
      use: 'Free shipping? Even better.（送料無料？ さらにいいね）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'play', seg: [127.6, 129.8],
      stem: 'Type what Andy asks: “___, officer?” (4 words)', answer: "what's the play here",
      cue: '「even better」のあと、officer の前の4語。',
      line: '*What’s the play here*, officer?',
      said: '「で、作戦はどうする、おまわりさん？」と聞く。4語が一気につながる。',
      mean: 'play はスポーツの「作戦」。What’s the play? ＝ どう動く？',
      trap: 'what’s the がつながり、短く聞こえやすい。here まで4語あると数えて聞く。',
      use: 'So what’s the plan here?（で、ここではどうするの？）' },

    // R fix: V2, 70 % blind: catching the thief and joining the police were too rosy for a sad ending. Both
    //   distractors are now quiet endings too.
    // why: study ← "feel out whether you want to be a police officer" heard as preparing for the exam; trainee ←
    //   "weekends" and "police officer" heard together, as a police job
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', seg: [139.5, 232.2],
      stem: 'How does Andy’s investigation end up?',
      choices: ['He takes a weekend guard job instead', 'He drops the case to study for his exam',
                'He’s made a police trainee on weekends'], a: 0,
      cue: '最後に勧められる仕事。',
      said: '捜査は報告書だけで終わり、落ち込んだ Andy は週末の警備員の仕事を勧められる。',
      mean: '本物の捜査はさせてもらえず、警官に向くか試す別の仕事で落ち着く。',
      trap: 'police officer が聞こえ、警察の仕事と思いやすい。guard が結末。',
      use: 'Why not try it for a weekend?（週末だけ試してみたら？）' },

    // R fix: V2, 65 % blind: the stem says he's just said no, so "support" and "a new job" didn't fit. The
    //   distractors are now readings that fit a "no".
    // why: back one plan ← praise taken as a partial yes (the Japanese frame: ほめる＝賛成); calm down ← "enthusiasm"
    //   heard as the problem
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'enthusiasm', reveals: ['money'], seg: [139.6, 146.3],
      stem: 'After the officer turns Andy’s plans down, what does the next praise do?',
      choices: ['Softens the “no” that comes next', 'Shows he’ll back one of Andy’s plans',
                'Asks Andy to calm down a little'], a: 0,
      cue: 'ほめ言葉のすぐあとの but。',
      line: 'Andy, *I love your enthusiasm, but* we don’t really have the kind of money…',
      said: '「やる気は大好きだけど、大がかりな捜査をするお金はない」と言う。',
      mean: 'ほめてから断る、よくある和らげ方。本題は but のあと。',
      trap: 'ほめ言葉を賛成と取りやすい。I love ~, but の形なら、断りの前置き。',
      use: 'I love the idea, but it’s too expensive.（いい案だけど、高すぎる）' },

    // R fix: V2, 55 % blind: the officer's report-only line made money the likeliest blind. "The loss isn't big
    //   enough" (one computer) replaces "officers".
    // why: proof ← the usual reason a case isn't opened; small loss ← "massive investigation" for one computer
    { id: 'd4', skill: 'detail', level: 'B1', point: 'money', seg: [142.5, 146.3],
      stem: 'Why won’t they launch a big investigation?',
      choices: ['There isn’t enough money', 'The loss isn’t big enough', 'There isn’t enough proof'], a: 0,
      cue: '「we don’t really have」のあと。',
      line: 'we *don’t really have the kind of money* to launch a massive investigation.',
      said: '「大がかりな捜査をするほどのお金はない」と言う。',
      mean: 'the kind of money ＝「それほどの額のお金」。予算がない、という理由。',
      trap: '捜査の話なので証拠や被害額を思い浮かべやすい。have のあとの名詞を拾う。',
      use: 'I don’t have that kind of money.（そんな大金は持ってない）' },

    // R fix: V2, 70 % blind: "sound more serious" was a filler. "A quieter police job" (a scope shift on "something
    //   else") replaces it.
    // why: quieter job ← "do something else" heard as another kind of police work; report ← "writing stuff down"
    //   heard as a task for Andy
    { id: 'i1', skill: 'infer', level: 'B2', point: 'boring', seg: [152.55, 164.4],
      stem: 'What is the officer really telling Andy at the end?',
      choices: ['Police work may not be right for him', 'He should try a quieter police job',
                'He should start by writing the report'], a: 0,
      cue: '「If it sounds boring」のあと。',
      line: 'this is what *most police work* is. *Just writing stuff down*. It’s not superhero time. If it sounds boring…',
      said: '「警察の仕事はほとんど書類書きだ。ヒーローごっこじゃない。退屈なら…」と言う。',
      mean: '最後は「別の仕事をした方がいい」という意味。夢を見すぎだ、とたしなめている。',
      trap: 'writing だけ聞くと作業の指示に聞こえる。if のあとが、言いたい結論。',
      use: 'It’s not all fun and games.（楽しいことばかりじゃないよ）' },

    // why: teases Andy ← the line is about his mood, so it can sound like a dig at his sulking; keep looking ← "find
    //   the person who stole" heard as a real request about the computer thief
    // anchor: 160.8–164.2 s the officer's "If it sounds boring, maybe you ought to do something else"; 166.5–170.1 s
    //   "maybe we should find the person who stole his positive attitude": "stole" reuses the case's word, and the one
    //   who just took Andy's spirit is the officer
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'positive', reveals: ['boring'], seg: [160.2, 170.6],
      stem: 'After the officer’s last words, what does the remark about a “positive attitude” do?',
      choices: ['Scolds the officer, in the case’s own terms', 'Teases Andy for losing heart so quickly',
                'Asks the officer to keep after the thief'], a: 0,
      cue: '直前に Andy に何を言ったのは誰か。stole の使い方。',
      line: 'If it sounds boring, maybe you ought to do something else. — Maybe we should *find the person who stole his positive attitude*.',
      said: '警官が「退屈ならほかの仕事を」と言ったあと、「彼の前向きさを盗んだ犯人を探すべきかもね」と言う。',
      mean: '事件の言葉 stole を借りて、Andy のやる気を奪ったのはあなた、と警官をとがめる皮肉。',
      trap: '落ち込んだ本人をからかう冗談にも聞こえる。「盗んだ人」は誰を指すか、直前の発言で決める。',
      use: 'Who stole your smile today?（今日は誰に笑顔を盗まれたの？）' },

    // why: officer ← his "if it sounds boring" is about how dull police work feels, as if "sad" pointed there;
    //   bail ← "maybe I should bail on being a cop" is Andy's low point, and "sad" could point there
    // anchor: 198.5–202.2 s "When I get bummed out, I take my shirt off because the bad feelings make me feel sweaty";
    //   216.2–222.1 s "you must keep your clothes on at all times, even if you get sad": clothes + sad pair with
    //   shirt off + bummed out. The segment runs 24.8 s to hold both lines (native-level §2 allows ≤ 25 s for two parts)
    // R fix: V2, 65 % blind: the officer choice wasn't about Andy's mood. "Sulking when turned down" replaces it, so
    //   all three are Andy's low moments and only the clothes settle it.
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'clothes', seg: [197.1, 221.9],
      stem: 'What does the job’s “even if you get sad” rule call back to?',
      choices: ['Andy taking off his shirt when he feels down', 'Andy sulking when the officer turns him down',
                'Andy saying he may give up on being a cop'], a: 0,
      cue: '少し前に Andy がしたことと、その理由。',
      line: 'When I get *bummed out, I take my shirt off*… — you must *keep your clothes on* at all times, *even if you get sad*.',
      said: '落ち込むとシャツを脱ぐと Andy が言い、あとで「悲しくても服は着ていること」と条件が出る。',
      mean: '条件は「落ち込むと脱ぐ」を受けたもの。clothes と sad が shirt と bummed out に対応。',
      trap: '「悲しい」は前のどの場面にも合いそう。服の話とセットの場面を探す。',
      use: 'And no pajamas at work, even on Fridays.（金曜でも、職場でパジャマはなし）' },

    // why: paying ← bail = 保釈金, the police word, read literally in a cop story; short break ← "bail on" heard as
    //   stepping out for a while, not quitting
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'bail', seg: [203.6, 207.4],
      stem: 'What is Andy thinking of doing about becoming a cop?',
      choices: ['Giving up on the whole idea', 'Paying to get out of training', 'Taking a short break from it'], a: 0,
      cue: '「maybe I should」のあとの動詞。',
      line: 'You know what, maybe I should *bail on* being a cop.',
      said: '「もう警官になるのはやめようかな」と言う。',
      mean: 'bail on ~ ＝ ～から手を引く、投げ出す。くだけた言い方。',
      trap: '警察の話なので bail を「保釈金」と取りやすい。on + 計画なら「やめる」。',
      use: 'Sorry, I have to bail on dinner.（ごめん、夕食は行けなくなった）' },

    // why: part-time ← "part-time" is said just before, as the catch; not real police ← he wanted to be a cop
    { id: 'i3', skill: 'infer', level: 'C1', point: 'clothes', seg: [216.15, 226.15],
      stem: 'Why does Andy first turn the job down?',
      choices: ['He’d have to keep his clothes on', 'It’s only a part-time weekend job',
                'It isn’t a real police officer job'], a: 0,
      cue: '条件が出たすぐあとの短い返事。',
      line: '*you must keep your clothes on* at all times, even if you get sad. — *No deal.* … Okay, I’ll do it.',
      said: '「悲しくても服は着ていること」と条件を出され、「お断り」と言い、結局引き受ける。',
      mean: '断ったのは仕事の中身でなく、服を脱げなくなる条件のせい。',
      trap: 'part-time などの情報も聞こえるので理由を取り違えやすい。No deal の直前の条件が理由。',
      use: 'One condition: no phones.（条件が一つ。スマホは禁止）' },

    // R fix: V2, 55 % blind: "hours wrong" was a filler. "Teases him without meaning no" (the sincerity flip of a
    //   quiz word) replaces it, and "a word he misused" is now "one detail".
    // why: one detail ← "Incorrect" as a teacher marks one part of an answer; teasing ← a quiz word heard as play
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'incorrect', seg: [227.9, 232.0],
      stem: 'When Andy says he’ll get a gun, what does the one-word answer do?',
      choices: ['Flatly turns his hope down', 'Corrects one detail he got wrong', 'Teases him without meaning no'], a: 0,
      cue: '最後の、とても短い返事。',
      line: 'I get a gun and I can point it in people’s faces. — *Incorrect.*',
      said: '「銃をもらって人に向けられるんだよね」と言うと、「違います」の一語で返される。',
      mean: 'Incorrect はクイズの答え合わせの言葉。ここでは一言の否定。',
      trap: '文字どおりだと言葉の訂正に聞こえる。願いへの返事なら、きっぱりとした「ノー」。',
      use: 'Pizza for breakfast? Incorrect.（朝ごはんにピザ？ 却下）' },
  ]
};
