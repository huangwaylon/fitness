// REVIEW 2026-11-16: pass 3, fix 20, drop 0, new 0; ear checks 2
// Open: i1 now spans 13.6–27.8 s and keys on "It's not a real call — Oh… okay". Both sources have "not a real" and
//   "oh… okay"; only the last word differs (captions "go"). Is that enough, or should it go on the ear list?
// “Your Mother is Dead - The Office US” (the official The Office channel, BEST OF The Office - Season 8): Andy asks
// Erin to fake an important call he can turn down in front of a client; she says his mother is dead, the client makes
// him take it, and Andy turns the “news” into a sales pitch.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 143 s. Speakers are settled by “Erin”
// (1.4 s), “Andy” (50.0 s, 89.2 s) and “it's Darryl” (109.1 s). Untested: 22.7–27 s (“You're not gonna take it?” /
// “not just”; “It's not a real call” / “real go, don't make it up”), 29–32 s (“But she—” is whisper only), and
// whisper's 127–133 s lines (“You're a bad man”, “That is so mom”, “karma”), which the captions don't have.
// EAR CHECK: 63.4 s r1 — the cut falls after “…than this meeting” (62.4) and before Erin's “Really?” (63.9)
// EAR CHECK: 116–127 s a2 c2 — “Look, man, this is a bad idea” and “That is messed up, man” are Darryl's, and “Oh, make
//   sure that your client gets the best deal possible” is Andy's (assumed from the turns; captions don't say)
import type { Clip } from '../types.ts';

export const fakeCall: Clip = {
  id: 'fakecall', video: 'On-FtkzYVKU', title: 'Your Mother is Dead', dur: 165, wpm: 143, band: 'slow',
  tags: ['職場', '電話'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 80 %): the key was the only fake call that fit. All three are fake calls now, put to three
    //   different uses.
    // why: look busy ← an "important call" usually makes the one who gets it look in demand; get out ← the usual
    //   sitcom fake call, the one that rescues you from a bad meeting (broken script)
    { id: 'g1', skill: 'gist', level: 'B1', point: 'plan', reveals: ['why', 'fake'], seg: [0, 39.0],
      stem: 'What is Andy setting up with Erin before the meeting?',
      choices: ['A fake call he can turn down in front of the client', 'A fake call to make him look busy to the client',
                'A fake call to get him out if the meeting goes badly'], a: 0,
      cue: '前半の説明全体。電話を何に使うつもりか。',
      said: '会議中に「大事な電話です」と言いに来てほしい、でも自分は出ない、と頼む。',
      mean: '客の前で電話を断って、この会議が一番大事だと見せる作戦。',
      trap: '偽の電話は抜け出すため、忙しく見せるため、という型を思いやすい。ここは断って見せるため。',
      use: 'Can you cover for me?（うまく合わせてくれる？）' },

    // why: twenty ← "two" + a long "minutes" heard as -ty; two hours ← "two" caught, the unit guessed
    { id: 'n1', skill: 'number', level: 'B1', point: 'two', seg: [2.8, 8.2],
      stem: 'When does Andy want Erin to come into the meeting?',
      choices: ['In two minutes', 'In twenty minutes', 'In two hours'], a: 0, keep: true,
      cue: '文のいちばん最初、時を表す2語。',
      line: 'In *two minutes*, I want you to come into this meeting',
      said: '「2分後に、この会議に入ってきてほしい」と頼む。',
      mean: 'すぐに始まる会議の途中で来てほしい、ということ。in ＋時間は「〜後に」。',
      trap: 'two と twenty は出だしが同じ。-ty の音がなければ two。in は「以内」より「〜後に」。',
      use: 'I’ll be there in ten minutes.（10分後に着くよ）' },

    // R fix: V2 (blind 60 %): "private news" was weak. "How busy and in demand he is" (what an important call usually
    //   shows) replaces it.
    // why: wait for the deal ← refusing a call read as a bargaining move (he's selling); in demand ← "a really
    //   important phone call" heard as the point of the show
    { id: 'd1', skill: 'detail', level: 'B2', point: 'why', seg: [8.5, 14.0],
      stem: 'What reason does Andy give for turning the call down?',
      choices: ['To show the client how much the meeting matters', 'To make the client wait and want the deal more',
                'To show the client how busy and in demand he is'], a: 0,
      cue: 'because のあと、him に何を伝えたいか。',
      line: 'because I want him to know *how important the meeting is* to me.',
      said: '「出ない。この会議がどれだけ大事か、彼に分かってほしいから」と言う。',
      mean: 'him は会議の相手の客。電話より客を大事にする姿を見せたい。',
      trap: 'じらす作戦や、忙しさを見せる作戦と読みやすい。because のあとは会議の大事さ。',
      use: 'This means a lot to me.（これは私にとって大事なの）' },

    // R fix: S4: the seg (2.8 s) held only "Who's calling? — Nobody", which doesn't show her reading; it now runs to
    //   her "Oh… okay" after "It's not a real call" (both sources: "not a real"). V2 (blind 55 %): "hiding the
    //   caller" → "take the call for him".
    // why: place a call ← "phone call" + "you" heard as a job for Erin; take it for him ← "You're not gonna take
    //   it?" heard as her offering to
    { id: 'i1', skill: 'infer', level: 'B2', point: 'fake', seg: [13.6, 27.8],
      stem: 'When Erin asks who’s calling, what has she misunderstood?',
      choices: ['She thinks a real call is coming in for Andy', 'She thinks Andy wants her to place a call',
                'She thinks Andy wants her to take the call'], a: 0,
      cue: '彼女の質問と、最後の「Oh」の前の一言。',
      line: '*Who’s calling?* — Nobody. … *It’s not a real call.* — Oh. Oh, okay.',
      said: '「誰から？」と聞き、「本物の電話じゃない」と言われて、やっと「ああ」と分かる。',
      mean: 'エリンは本物の電話が来ると思っていた。作り話だと伝わっていない。',
      trap: 'Nobody は文字どおり「かけてくる人はいない」。Oh, okay でやっと伝わる。',
      use: 'Who’s calling, please?（どちら様ですか）' },

    // R fix: V2 (blind 70 %): "Put it through" made "Pretend" the only odd-job reading. "Put it off until later"
    //   (make up as 延期) replaces it.
    // why: put it off ← "make… up" heard as a time phrase (後回し); make up for it ← the phrasal verb with "for"
    //   (埋め合わせ)
    // R fix: B1: point `makeup` → `fake`. It's the same fact as i1, and g1's and i1's lines give it away.
    { id: 'p1', skill: 'phrase', level: 'B1', point: 'fake', seg: [15.4, 22.6],
      stem: 'What does Andy tell Erin to do about the call?',
      choices: ['Pretend there is one', 'Put it off until later', 'Make up for missing it'], a: 0,
      cue: 'just のあと、短い動詞のかたまり。',
      line: 'just *make it up* that I have a phone call',
      said: '「とにかく、電話があるってことにして」と言い直す。',
      mean: 'make it up ＝ 作り話をする、でっち上げる。本当の電話はない。',
      trap: 'make up for なら「埋め合わせる」で別の意味。for が続くかどうかを聞き分ける。',
      use: 'I didn’t make it up, I swear.（作り話じゃないよ、本当）' },

    // R fix: V2 (blind 60 %): "a comparison" was weak. "What he wants Erin to say" (a quote of her script) replaces it.
    // why: actual words ← a quote follows, so it sounds reported; Erin's line ← he has just been telling her what to
    //   say
    { id: 'm1', skill: 'marker', level: 'B2', point: 'like', seg: [32.9, 36.2],
      stem: 'When Andy describes the client’s next move, what does he introduce?',
      choices: ['The reaction he pictures the client having', 'Something the client really said to him',
                'What he wants Erin to say in the meeting'], a: 0,
      cue: 'he’s gonna のあと、引用の前の2語。',
      line: 'And then he’s gonna *be like*, “Wow, this is a really important meeting.”',
      said: '「そしたら彼は『わあ、本当に大事な会議だ』って感じになる」と言う。',
      mean: 'be like ＋引用は「〜って感じ」。相手の反応を演じて見せている。',
      trap: '引用は実際の発言やエリンの台詞に聞こえやすい。he’s gonna be like は想像。',
      use: 'And I was like, “No way!”（で、私「うそでしょ！」って）' },

    // R fix: V2 (blind 60 %): rebalanced; two copy = 写す/くり返す readings, both phrased as a closing move. S4: seg
    //   2.5 s → 3.5 s.
    // why: write it down ← copy = 写す; go over it again ← copy = くり返す, and a long set of steps often gets one
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'copy', seg: [34.7, 38.2],
      stem: 'How does the reply end the planning talk?',
      choices: ['It says the plan is understood', 'It asks him to go over the plan again', 'It offers to write the plan down'],
      a: 0,
      cue: '説明のすぐあと、短い2語の返事。',
      line: '*Copy that.* — Okay.',
      said: '長い説明のあと、「了解」と短く答える。',
      mean: 'Copy that ＝ 了解。無線の言い方から来た表現で、少しおどけて使うことも多い。',
      trap: 'copy をコピー（写す）や「まねる」と取りやすい。返事の一言なら「受け取った」の意味。',
      use: 'Copy that. On my way.（了解、今行く）' },

    // R fix: V2 (blind 70 %): "find out who gave him his deal" was a filler. "Match" (beat/meet, a near sound) and
    //   "show why his deal is bad" replace the two distractors.
    // why: match ← "beat it" heard as "meet it"; a bad deal ← "tell me exactly what kind of deal" heard as a set-up
    //   to pick it apart
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'beat', seg: [39.6, 48.0],
      stem: 'What does Andy offer the client?',
      choices: ['To offer him a better deal than his current one', 'To match the deal he is getting right now',
                'To show him why his current deal is a bad one'], a: 0,
      cue: '「I’ll tell you how we can」のあとの動詞。',
      line: 'tell me exactly what kind of deal you are getting… I’ll tell you how we can *beat it*.',
      said: '「今どんな条件で買っているか教えてくれれば、それを上回る方法を言います」と持ちかける。',
      mean: 'beat ＝ 他社の条件より良くする。営業の決まり文句。',
      trap: 'beat を meet（合わせる）と聞きやすい。m なら鼻に抜ける音が先に来る。',
      use: 'Can you beat this price?（この値段より安くできますか）' },

    // R fix: K5/V2 (blind 50 %): "There'll have to wait" isn't English. "He'll" (the caller as "he") replaces it.
    // why: They ← 'll vanishes before "have"; They'd ← a soft d in the same spot; He'll ← the same -ell ending, the
    //   weak th- lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'wait', seg: [52.3, 55.4],
      stem: 'Fill the gap: “___ have to wait.”',
      choices: ['They’ll', 'They', 'They’d', 'He’ll'], a: 0,
      cue: '「client」のすぐあと、文頭の弱い一語。',
      line: 'I’m with a very important client. *They’ll* have to wait.',
      said: '「大事なお客さんといる。電話の相手には待ってもらう」と断る。',
      mean: 'They’ll の ’ll は弱く「ゼイル」に近いが、残っている。',
      trap: '’ll が消えると They に聞こえる。He’ll は th の音がなく「ヒール」。文頭の弱い音まで聞く。',
      use: 'It’ll have to wait till Monday.（それは月曜まで待ってもらおう）' },

    // R fix: V2 (blind 50 %): the key's scare-quoted "call" stood out. The choices are now three parallel moves.
    // why: backs out ← giving way is the polite move in a Japanese office; a slip ← "Really?" heard as her dropping
    //   the act
    { id: 'r1', skill: 'predict', level: 'B2', point: 'dead', seg: [55.2, 63.4], then: [63.4, 67.0],
      stem: 'After Andy says nothing matters more, what kind of reply comes next?',
      choices: ['A push with news he can’t possibly refuse', 'A quiet apology as she backs out of the room',
                'A slip that lets the client know it’s fake'], a: 0,
      cue: '「何より大事」と言い切られたら、どう試す？',
      line: 'There is nothing more important to me right now than this meeting. — Really? Because *your mother is dead*.',
      said: '「この会議より大事なものはない」と言い切ると、エリンは「本当に？」と返す。',
      mean: '強い言い切りは、もっと大きな話で試される前ふり。エリンは台本どおり押す。',
      trap: '引き下がるのが自然に思えるが、エリンは「大事な電話」を演じ続ける。',
      use: 'Nothing is more important than this.（これより大事なことはない）' },

    // R fix: V2 (blind 75 %): "get back at Andy" had no hook. "A caller far too important" (keyword "important")
    //   now competes as a second "too much" reading.
    // why: real news ← "really, really important" + a death heard as sincere (she dropped the plan); caller ←
    //   "really, really important" heard as a grand caller
    { id: 'h1', skill: 'humor', level: 'C1', point: 'dead', seg: [63.4, 75.0],
      stem: 'Why does the audience laugh at Erin’s reason for the call?',
      choices: ['She picks news far too serious for a fake call', 'She forgot the plan and gives him real news',
                'She makes up a caller who is far too important'], a: 0,
      cue: '「Really?」のあと、作り話の中身の重さ。',
      line: 'Really? Because *your mother is dead*.',
      said: '「本当に？だってお母さんが亡くなったのよ」と、作り話の中身を言う。',
      mean: '作り話に、いちばん重い知らせを選んだ。断れない話なので作戦が自分で壊れる。',
      trap: '本当の知らせや、大物からの電話と取ると笑いが見えない。やりすぎたのは知らせの中身。',
      use: 'Okay, that’s a bit much.（それはちょっとやりすぎ）' },

    // R fix: V2 (blind 55 %): near misses now. Owning up but still selling (right end, wrong way), and taking the call
    //   then cutting the meeting short.
    // why: admits it ← the call was fake, so the honest ending; cuts it short ← the client told him to take the
    //   call
    { id: 'g2', skill: 'gist', level: 'C1', point: 'outcome', reveals: ['lastword', 'hold', 'officer'], seg: [63.4, 143.0],
      stem: 'How does the meeting end up, after the fake call?',
      choices: ['Andy plays along, then goes back to his pitch', 'Andy admits it was fake, then goes back to his pitch',
                'Andy takes the call, then cuts the meeting short'], a: 0,
      cue: '電話のあと、アンディが何の話に戻るか。',
      said: '偽の電話と分かっても、アンディは警察と話すふりを続け、商談に戻る。',
      mean: '作戦は崩れたが、「不幸」まで売り込みに使う。客には本当だと思わせたまま。',
      trap: 'ふつうは白状するか席を外す場面。officer と呼ぶのと最後の2文が、芝居を続けたしるし。',
      use: 'Let’s get back to business.（本題に戻りましょう）' },

    // anchor: 2–36 s Andy sets up the call himself ("Just make up a phone call"); 73.5–83 s "I don't think she's dead…
    //   She's not dead": no worry in the words, and he pins it on his mom, not on Erin, in front of the client
    // R fix: V2 (blind 50 %): "don't get along" was a filler. "That his mom often plays tricks on him" is what he
    //   does say (the literal near miss: said, not withheld).
    // why: fear ← "Oh my God" and "I don't think" heard as shock and doubt (the sincere reading); tricks ← "the kind
    //   of thing my mom pulls" taken as the hidden part, though he says it out loud
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'pulls', seg: [70.5, 83.2],
      stem: 'When Andy waves the news away, what is he trying not to tell the client?',
      choices: ['That he set the whole call up himself', 'That he fears the news may be true',
                'That his mom often plays tricks on him'], a: 0,
      cue: '否定の言い方と、誰のせいにしているか。',
      line: 'I *don’t think she’s dead*. … This is exactly the kind of thing *my mom pulls*.',
      said: '「死んでないと思う」「母がよくやる手だ」と、客の前で知らせを打ち消す。',
      mean: '本当は自分で頼んだ作り話。客にそう言えないので、母のいたずらのせいにして収めている。',
      trap: '「死んでない」を不安の裏返しと取りやすいが、言い切っている。母のいたずらは口に出した言い訳。',
      use: 'Oh, that’s just my brother being silly.（ああ、弟がふざけてるだけ）' },

    // R fix: V2 (blind 55 %): "Call him at work" → "Survive accidents" (pull through), which fits "She's not dead".
    // why: accidents ← "hit by a bus" just before; survive ← pull read as "pull through", and "She's not dead"
    //   comes right before
    { id: 'p4', skill: 'phrase', level: 'C1', point: 'pulls', seg: [78.6, 83.2],
      stem: 'What does Andy claim his mother tends to do?',
      choices: ['Play tricks like this one', 'Get into accidents like this one', 'Survive accidents like this one'], a: 0,
      cue: '「my mom」のあと、文の最後の動詞。',
      line: 'She’s not dead. This is exactly the kind of thing my mom *pulls*.',
      said: '「母さんは死んでない。これは母がよくやる手だ」と言う。',
      mean: 'pull ＝（いたずらを）やる。pull a prank の形で使う。',
      trap: 'not dead から pull through（助かる）と取りやすい。thing ＋ pull は「手口」。',
      use: 'Don’t pull that on me again.（その手はもう通じないよ）' },

    // R fix: V2 (blind 65 %): "admits it" was weak. "Sticks to it but makes it milder" (right move, wrong direction)
    //   replaces it.
    // why: drops it ← his denial seems to close the topic; milder ← "This isn't one of those times" heard as a calm
    //   correction
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'worse', reveals: ['police'], seg: [79.0, 88.6],
      stem: 'When Andy brushes off the news, how does Erin respond?',
      choices: ['She sticks to the story and makes it even worse', 'She takes his hint and quietly drops the story',
                'She sticks to the story but makes it sound milder'], a: 0,
      cue: 'アンディの否定のあと、彼女が続ける3文。',
      line: 'This isn’t one of those times. It’s the police. They said it’s *the worst they’ve ever seen*.',
      said: '「今回は違う。警察よ。今まで見た中で最悪だって」と続ける。',
      mean: 'アンディが逃げ道を出したのに、作り話をさらに大きくしている。',
      trap: '否定で話が終わる、または和らげると思いやすい。worst they’ve ever seen でさらに重くした。',
      use: 'Trust me, this time is different.（今回は本当に違うんだって）' },

    // R fix: V2 (blind 60 %): "a neighbor" was weak; "The hospital" replaces it, so two accident-call readings compete.
    // why: hospital, doctor ← a bus accident brings hospitals to mind
    { id: 'd2', skill: 'detail', level: 'B1', point: 'police', seg: [82.9, 88.6],
      stem: 'According to Erin, who is on the line?',
      choices: ['The police', 'The hospital', 'Her doctor'], a: 0,
      cue: '「those times」のあと、短い一文。',
      line: 'This isn’t one of those times. *It’s the police.*',
      said: '「今回はそういうのじゃない。警察からよ」と言う。',
      mean: '作り話をもっと本当らしくするため、警察を持ち出している。',
      trap: 'バスの事故なら病院や医者を思いやすいが、言っているのは police。「リース」の長い音が手がかり。',
      use: 'It’s the front desk calling.（フロントからのお電話です）' },

    // R fix: V2 (blind 55 %): "sees through it" was weak. "Sympathy, but the meeting goes on" (the condolence-then-
    //   business frame) replaces it.
    // why: ends the meeting ← condolences usually close a meeting; goes on ← a polite condolence, then back to
    //   business, the usual move in a Japanese meeting
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'must', seg: [88.6, 98.0],
      stem: 'What does the client’s reply do to Andy’s plan?',
      choices: ['It pushes him to take the call he meant to refuse', 'It ends the meeting so he can go to his family',
                'It offers sympathy, but keeps the meeting going'], a: 0,
      cue: 'お悔やみの言葉のあとの、最後の一文。',
      line: 'I’m really sorry about your mother… *You must take this call.*',
      said: '客が「お母さんのこと、お気の毒に」と言い、「電話に出ないと」と勧める。',
      mean: '客の思いやりが、電話を断って見せる作戦をつぶしてしまう。must は強い勧め。',
      trap: 'お悔やみで会議が終わる、または一言で本題に戻ると思いやすい。客が言うのは「電話に出て」。',
      use: 'You must try the local food.（地元の料理はぜひ食べてみて）' },

    // R fix: V2 (blind 50 %): "Erin herself" was refuted by a man's "it's Darryl". "Someone asked to play a doctor"
    //   (keyword: the role) replaces it.
    // why: a real cop ← "cop" is said; a doctor ← "pretend to be" caught, and a bus accident brings doctors to mind
    { id: 'd3', skill: 'detail', level: 'B2', point: 'darryl', seg: [104.5, 112.4],
      stem: 'When Andy picks up, who turns out to be on the line?',
      choices: ['Someone Erin talked into playing a cop', 'A real cop calling about an accident',
                'Someone Erin asked to play a doctor'], a: 0,
      cue: '電話の声が名乗ったあとの一文。',
      line: 'Hi, it’s Darryl. Erin told me to *pretend to be a cop*…',
      said: '電話の相手は「ダリルだ」と名乗り、エリンに頼まれた警官役だと話す。',
      mean: '本物の警察ではない。エリンが人に頼んで、作り話を続けた。',
      trap: 'cop が聞こえると本物と思いやすい。pretend to be ＝ 〜のふりをする、が中心。',
      use: 'Hi, it’s Ken from upstairs.（どうも、上の階のケンです）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'darryl', seg: [108.0, 112.4],
      stem: 'Type what Darryl says: “Erin told me to ___ cop.” (4 words)', answer: 'pretend to be a',
      cue: '「told me to」のあと、弱くつながる4語。',
      line: 'Erin told me to *pretend to be a* cop and say your mom died.',
      said: '「警官のふりをして、お母さんが死んだと言えって、エリンに言われた」と話す。',
      mean: 'pretend to be a が「プリテンタビア」と一続き。to と a はごく弱い。',
      trap: '弱い to be a が落ちやすい。名詞の前の a も聞き直す。',
      use: 'Just pretend to be busy.（忙しいふりをして）' },

    // R fix: V2 (blind 65 %): "to tease him" was weak. "To hint that Darryl should stop" (Darryl is against it)
    //   replaces it.
    // why: believes it ← "officer" taken at face value; hint to stop ← Darryl's "Dude" and "bad idea" make a
    //   signal to him sound likely
    { id: 'i2', skill: 'infer', level: 'C1', point: 'officer', reveals: ['darryl'], seg: [108.0, 118.4],
      stem: 'Why does Andy call the caller “officer” and thank him?',
      choices: ['To keep the act going for the client', 'Because he believes the caller is a cop',
                'To hint to Darryl that he should stop'], a: 0,
      cue: '相手が名乗ったあとの、アンディの呼びかけ。',
      line: 'Hi, it’s Darryl… — *Thank you, officer.*',
      said: 'ダリルだと分かったのに、「ありがとうございます、おまわりさん」と答える。',
      mean: '客に聞こえているので、警察と話しているふりを続けている。',
      trap: 'officer を信じた言葉と取りやすいが、名乗られた直後に officer と呼ぶのが芝居のしるし。',
      use: 'Thank you, sir. I appreciate it.（ありがとうございます、助かります）' },

    // why: amused ← "man" and "Really?" heard as easygoing; confused ← "Really?" heard as a real question
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'badidea', seg: [116.8, 122.0],
      stem: 'How does Darryl feel about the joke he is part of?',
      choices: ['Uneasy, and against it', 'Amused, and keen to go on', 'Puzzled by it all'], a: 0,
      cue: '「Look, man」で始まる一言と、そのあとの返事。',
      line: 'Look, man, *this is a bad idea*. … Really? *That is messed up*, man.',
      said: '「なあ、これはまずいって」「マジかよ、ひどいな」とダリルが言う。',
      mean: 'messed up ＝ ひどい、どうかしてる。頼まれて電話したが、気が進まない。',
      trap: 'man や Really? を軽いノリと取りやすいが、言葉の中身は反対の気持ち。',
      use: 'That’s messed up, man.（それはひどいな）' },

    // anchor: 118.4 s Andy asks "Did she have any last words, or—"; 120.2 s Darryl: "Really? That is messed up, man";
    //   122.1–126.8 s "Oh, make sure that your client gets the best deal possible": "Oh" receives an "answer" to the
    //   last-words question, and "your client" makes it a message to Andy
    // R fix: V2 (blind 60 %): "last words" in the stem echoed only the key. The stem now names the moment only, and a
    //   sincerity flip ("hinting it's fake") replaces "wrapping up".
    // why: a message passed on ← "Oh" heard as a reaction to something the caller just said; hinting ← the line is so
    //   absurd it sounds like a wink to the client
    { id: 'c2', skill: 'infer', level: 'C2', point: 'lastword', reveals: ['badidea'], seg: [117.9, 127.5],
      stem: 'After Andy’s question to the caller, what is he doing with his next line?',
      choices: ['Passing off a sales pitch as his mom’s last words', 'Repeating a message the caller has just passed on',
                'Hinting to the client that the call is fake'], a: 0,
      cue: '直前の質問と、相手の「ひどいな」のあと。',
      line: 'Did she have any *last words*, or— … Oh, *make sure that your client gets the best deal possible*.',
      said: '「最期の言葉は？」と聞き、ダリルが「ひどいな」と言うと、「客にいちばんいい条件を、か」と言う。',
      mean: '売り込みを母の最期の言葉に見せかけている。作り話の不幸まで商談に使うのが笑い。',
      trap: 'Oh を相づちと取ると伝言に、ばかげた中身を合図と取りやすい。直前の last words が枠を決める。',
      use: 'My doctor says I need a vacation.（医者に休めって言われてさ）' },

    // R fix: V2 (blind 60 %): "ending the meeting" → "acting too upset to take calls" (hold my calls as grief), a
    //   nearer reading of the same line.
    // why: too upset ← "hold all my other calls" heard as grief; telling Erin off ← her name, then an order
    { id: 'i3', skill: 'infer', level: 'B2', point: 'hold', seg: [136.4, 143.0],
      stem: 'With his last two lines, what does Andy show?',
      choices: ['He is going straight back to the sales talk', 'He is acting too upset to take more calls',
                'He is telling Erin off for the fake call'], a: 0,
      cue: '電話を置いたあとの、2つの短い文。',
      line: 'Erin, please *hold all my other calls*. … *Where were we?*',
      said: '「ほかの電話は取り次がないで」「どこまで話したっけ？」と言う。',
      mean: 'Where were we? は話を戻す決まり文句。「死」の直後なのが笑い。',
      trap: 'hold my calls を悲しみ、Erin を叱る声と取りやすい。最後の一言で商談に戻る。',
      use: 'Sorry about that. Where were we?（失礼、どこまで話しましたっけ）' },
  ]
};
