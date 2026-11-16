// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 2
// “Michael Scott's Guide to Birthdays - The Office US” (the official The Office channel, Best of Season 4): the office
// throws Michael-style parties for all 13 birthdays, so Jim tries one combined party; one person wants her own cake,
// another wants pie on his real birthday, Toby asks to be added, the planner refuses, and Jim calls the whole thing off
// after a show of hands, then hears himself called Michael.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Michael (4.9, 171.2 s), Jim (110.9,
// 121.8, 148.6, 201.8, 245.3 s), Toby (149.5, 185.4, 192.2 s), Meredith (126.3 s), Angela (137.5 s), Creed (142.4,
// 267 s). Jim is not named before 110 s; the stems call the plan's author Jim, but no key depends on who speaks.
// Who asks “Do you think it's a good idea?” (66.6 s), who says “I knew I could count on you” (106.7 s), and who
// refuses at 198.5 s are never named; no key depends on them.
// Left out on purpose: 16.7–19.3 s (the age toast's race joke), 36.5–44 s beyond nt1 (shouts only), 133–144 s (the
// pie and cobbler requests overlap, and the sources disagree: “do a pie” / “do a butterfly”, “it'll be Angela” / “it'll
// be amazing”), 167.5 s (“there was no party” / “there was some party”), 175.5 s (“people sang” / “I have people
// saying”), 249 s (“Phyllis called me Michael” / “but let's call me Michael”: nt2 uses only “called me Michael” in the
// line it shows, which both have as “Michael”), and the closing song (255–284 s).
// EAR CHECK: 68.5 s r1 — the cut falls after “No.” (captions 67.84 s) and before “I think it's a great idea” (69.12 s);
//   both sources have the same words, and the item holds whoever says them
// EAR CHECK: 129.3 s pr1 — whisper “Everybody's birthday.”, captions only “everybody”: the key holds either way (the
//   reply turns “my” into “everybody”), but the line shows whisper's two words; confirm or trim the line
import type { Clip } from '../types.ts';

export const birthdayGuide: Clip = {
  id: 'birthdays', video: 'qQwoFaHTpY8', title: 'Michael Scott\'s Guide to Birthdays', dur: 304, wpm: 142,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: 30 ← -teen/-ty: thirteen's stressed "teen" is easy to lose, so it's heard as thirty; 33 ← "13" is said
    //   twice in a row, and the two blur into one longer number
    { id: 'n1', skill: 'number', level: 'B1', point: 'thirteen', seg: [0, 6.25],
      stem: 'How many people work in the office, according to the opening comment?',
      choices: ['13', '30', '33'], a: 0, keep: true,
      cue: '冒頭の一文と、すぐあとの「times a year」。',
      line: 'There are *13* people working in this office. So *13* times a year…',
      said: '「この職場には13人。だから年に13回、ケーキと風船」と話す。',
      mean: '人数が、そのまま年のパーティーの回数になる。',
      trap: 'thirteen は後ろの teen が強い。thirty は前が強く語尾が短い。強さの位置で聞き分ける。',
      use: 'There are five of us on the team.（うちのチームは5人です）' },

    // R fix: V2, blind 60 %: "worried he'd be fired" was a filler, and the key was the only negative feeling
    // why: amused ← the deadpan list heard as enjoying how wild the toasts get; tolerant ← "inappropriate" heard as
    //   mild, a boss's harmless habit
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'toasts', seg: [19.35, 25.5],
      stem: 'How does the speaker feel about the second kind of toast?',
      choices: ['Amused; the worse they get, the funnier', 'Fed up; they’re painful to sit through',
                'Tolerant; they’re rude but mean no harm'], a: 1,
      cue: '最後に足された、二語だけの一言。',
      line: 'And the other is *something inappropriate or horrible*. *Or both.*',
      said: 'もう一つは「不適切か、ひどいもの」と言い、「あるいは両方」と付け足す。',
      mean: '付け足しの一言に、うんざりした本音が出る。',
      trap: '習慣を並べる話し方は、ほほえましい思い出話に聞こえやすい。最後に足された一言が評価を決める。',
      use: 'It was long, or boring, or both.（長いか退屈か、その両方だった）' },

    // why: last line ← "only" plus the song read as the show-off script (he belts the ending); after everyone ←
    //   "only" heard as "alone", as if he sings by himself once the others stop
    { id: 'd1', skill: 'detail', level: 'B1', point: 'harmony', seg: [25.1, 29.6],
      stem: 'What does the speaker say about how Michael sings “Happy Birthday”?',
      choices: ['He sings only the high harmony part', 'He sings only the last line, very loudly',
                'He sings only after everyone else is done'], a: 0,
      cue: '「What else?」のあと、歌い方の話。',
      line: 'He only sings *the high harmony* to “Happy Birthday.”',
      said: '「誕生日の歌では、高いハモりしか歌わない」と話す。',
      mean: 'high harmony ＝ 主旋律に重ねる高い声部。',
      trap: 'only を「一人で」と取ると、皆が歌い終えてから歌う話に聞こえる。only がどの語にかかるかを聞く。',
      use: 'I only sing in the shower.（シャワーのときしか歌わない）' },

    // R fix: V2, blind 55 %: "likes them more than he should" was the only reading of a sitcom boss; the choices are
    //   now three degrees of belief, each from a misreading of the words
    // why: flaw ← "fault" = 欠点 read as "without fault", flawless; up to a point ← "maybe… arguably… possibly" heard as
    //   limiting how much he believes
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'fault', seg: [30.9, 37.3],
      stem: 'How much does Michael believe in surprise parties, by the speaker’s last words?',
      choices: ['More than is good for anyone', 'Only up to a point, these days',
                'Without a single doubt or flaw'], a: 0,
      cue: '文の最後、短い3語のまとまり。',
      line: 'a very big believer in surprise parties. Maybe even, arguably, possibly *to a fault*.',
      said: 'サプライズ好きで、「もしかすると、度が過ぎるほど」と言う。',
      mean: 'to a fault ＝ 行き過ぎなほど。良いことでもやり過ぎ、という意味。',
      trap: 'fault を「欠点なく」、控えめな語を「ほどほど」と取りやすい。to a fault でひとまとまり。',
      use: 'She’s generous to a fault.（彼女は人が良すぎるくらい）' },

    // R fix: V2, blind 65 %: "once, all in the past" was a filler and "the hedges are for show" the only knowing
    //   reading; now two near misses (the literal hedge, and a scope shift on how much)
    // why: hard to say ← "maybe… arguably… possibly" read as real caution (かもしれない); only a little ← the hedges
    //   heard as shrinking the degree, not the certainty
    // anchor: 33.9–37 s three hedges stacked onto "to a fault", then 36.5–44 s "Happy birthday!" is shouted again and
    //   again: the surprises themselves settle that he clearly overdoes it
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'fault', seg: [30.9, 44.4],
      stem: 'Which plain-English version keeps what the speaker means about the surprise parties?',
      choices: ['He overdoes them, and it’s plain to see', 'He might overdo them; it’s hard to say',
                'He overdoes them, but only by a little'], a: 0,
      cue: '控えめな3語と、そのあとに続く音。',
      line: 'Maybe even, arguably, possibly *to a fault*. — *Happy birthday!* … *Happy birthday!*',
      said: '「もしかすると、ひょっとして、行き過ぎかも」と慎重に言った直後、「ハッピーバースデー！」が何度も続く。',
      mean: '控えめな語を三つ重ねた遠回しな断言。続く叫びの連発が「明らかにやり過ぎ」と答え合わせをする。',
      trap: '「かもしれない」を自信のなさや「少し」と取りやすい。控えめな語の重なりは本音を疑う。',
      use: 'It’s maybe, possibly, a little too loud.（もしかすると、ちょっとうるさいかも）' },

    // R fix: V2, blind 60 %: the key echoed x1's "at once", and "let each person plan" was weak; now three changes to
    //   the parties, two of them built on words in the clip
    // why: one a month ← "birthday month" in the memo, and "getting these out of the way"; out of work hours ←
    //   "nobody wastes their time" heard as work time
    { id: 'g1', skill: 'gist', level: 'B1', point: 'plan', seg: [44, 60],
      stem: 'What does Jim want to do about the office birthdays?',
      choices: ['Fold all the parties into one big one', 'Cut the parties down to one a month',
                'Move the parties out of work hours'], a: 0,
      cue: '「productive」のあとの提案の中身。',
      line: 'We can just have *one big, fun party*. And everybody’s happy…',
      said: '「まとめて済ませれば生産的。大きな楽しい会を一回やれば、みんな満足」と話す。',
      mean: '会を減らしたり移したりせず、一回にまとめる案。',
      trap: '「時間の無駄」や後の「誕生日月」から、時間や回数の話に取りやすい。one big party が中心。',
      use: 'Let’s do it all in one go.（一回でまとめてやろう）' },

    // R fix: V2, blind 55 %: "a question back" was a filler; now a downward correction, the same "No" mechanism the
    //   other way
    // why: milder ← "No" heard as "not good, just okay"; reason ← "No" heard as a real no, so a reason against follows
    { id: 'r1', skill: 'predict', level: 'C1', point: 'great', seg: [64.6, 68.5], then: [68.5, 71.6],
      stem: 'After the question about the idea, a short “No.” comes. What follows?',
      choices: ['A stronger word of praise for the idea', 'A milder word: the idea is just okay',
                'A reason the idea might not work'], a: 0,
      cue: '「No」は何を打ち消しているのか。',
      line: 'Do you think it’s a *good* idea? — No. I think it’s a *great* idea.',
      said: '「いい案だと思う？」に「いや」と答えてから、「すごくいい案だ」と言う。',
      mean: 'No は案でなく good という語を打ち消し、great に格上げする冗談の型。',
      trap: 'No を聞くと反対か格下げを待ちやすい。No は語を直して程度を上げることもある。',
      use: 'Good? No. It was amazing.（良かった？いや、最高だった）' },

    // R fix: V2, blind 60 % with 3 choices ("do you see my memo" barely fits); a fourth, grammatical choice
    // why: do you ← "did you" shrinks to "didja", and the d is easy to miss; didn't you ← a reminder heard as
    //   "didn't you see it?", the t of n't dropped; did they ← the weak "you" (ja) lost, and "they" fits a question
    //   about others
    { id: 's1', skill: 'sound', level: 'B2', point: 'memo', seg: [78.25, 81.3],
      stem: 'Fill the gap: “Oh, ___ see my memo, by the way?”',
      choices: ['did you', 'do you', 'didn’t you', 'did they'], a: 0,
      cue: 'Oh のあと、とても短くつながる2語。',
      line: 'Oh, *did you* see my memo, by the way?',
      said: '「そうだ、ところでメモは見た？」と聞く。did you がつながり「ディジュ」に近い。',
      mean: 'メモを読んだかの確認。by the way で話題を変える。',
      trap: 'didn’t なら責める響きになる。n’t の t が消えても「ン」が残る。',
      use: 'Oh, did you get my email?（そうだ、メール届いた？）' },

    // R fix: V2, blind 55 %; now three things from the opening's list of party habits
    // why: songs ← "Happy Birthday" at every party (opening); gifts ← "some sort of joke gift" (opening), a word said
    { id: 'd2', skill: 'detail', level: 'B1', point: 'cake', reveals: ['plan'], seg: [83.2, 90.6],
      stem: 'According to the memo, what could everyone use a break from?',
      choices: ['All the cake', 'All the songs', 'All the gifts'], a: 0,
      cue: '「a break from the」のあと、最後の語。',
      line: 'we all could use *a break from the constant cake*',
      said: 'メモに「正直、ケーキ続きから一休みしたい。今日は誕生日月を祝おう」とある。',
      mean: 'constant ＝ ひっきりなしの。ケーキへの遠回しな不満。',
      trap: '冒頭の歌やプレゼントの話が理由に聞こえやすい。名指しされるのはケーキ。',
      use: 'I could use a break from coffee.（コーヒーを少し控えたい）' },

    // R fix: schema, the answer was 7 words (the stem said 6; the test allows 1–6); now the reduced "get it all" only
    { id: 'x1', skill: 'dict', level: 'B2', point: 'outofway', reveals: ['plan'], seg: [96.2, 102.6],
      stem: 'Type the words: “This way we ___ out of the way at once.” (3 words)', answer: 'get it all',
      cue: '「This way we」のすぐあと、弱い3語。',
      line: 'This way we *get it all* out of the way at once…',
      said: '「これで一度に全部片づく」。get it all は t が弾み「ゲリロー」に近い。',
      mean: 'out of the way ＝ 面倒を先に済ませる。',
      trap: '弱い it と all が get にくっつき、1語に聞こえやすい。語数を数えてからほどく。',
      use: 'Let’s get the boring part out of the way.（面倒なところを先に片づけよう）' },

    // R fix: K5, "Peach cobbler" wasn't a cake, so it fell out of the set (blind 50 %)
    // why: angel food ← the opposite cake, and "food cake" is the part heard clearly; peach ← "peach pie… cobbler",
    //   another person's choice later in the clip, a word that is said
    { id: 'd3', skill: 'detail', level: 'B1', point: 'devils', seg: [109.6, 115.9],
      stem: 'When someone asks Jim for her own cake, what kind does she want?',
      choices: ['Devil’s food cake', 'Angel food cake', 'Peach cake'], a: 0,
      cue: '「I really prefer」のあと。',
      line: 'Hey, Jim, can I have *my own cake*? … I really prefer *devil’s food cake*.',
      said: '「自分用のケーキもらえる？デビルズフードがいい」と頼む。',
      mean: 'devil’s food cake ＝ 濃いチョコレートケーキ。',
      trap: 'food cake だけ聞くとエンゼルフードと混ざり、peach は後の別の人の注文。最初の devil’s を拾う。',
      use: 'I’d really prefer chocolate, if that’s okay.（できればチョコがいいな）' },

    // R fix: V2, blind 70 %: "drops it once nearly everyone objects" was the only ending a reader expects; now the
    //   bending plan and the name slip are the near misses; reveals no longer lists `include` (no choice names Toby)
    // why: each pick ← the cake and pie requests get "Oh, sure" and "we'll see what we can do", so the plan seems to
    //   bend; Michael ← "Hey, Michael" near the end heard as the plan passing to the boss
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['hands'], seg: [110, 256],
      stem: 'By the end of the clip, what happens to Jim’s plan?',
      choices: ['He calls it off when the whole room objects', 'He keeps it, but lets each person pick a dessert',
                'He hands it over to Michael when people object'], a: 0,
      cue: '手を挙げさせたあとの、ジムの結論。',
      line: 'So who has problems with the birthday thing? … *so then we just shouldn’t do it*.',
      said: '不満が次々に出て、ジムは「文句のある人？」と聞き、手を見て「じゃあ、やめよう」。',
      mean: 'まとめるはずの会が、全員の不満を集めた。',
      trap: '注文に応じる場面や最後の「マイケル」が結末に見えやすい。挙手のあとの結論を聞く。',
      use: 'Okay, let’s just not do it, then.（じゃあ、やめにしよう）' },

    // R fix: V2, blind 65 %: both distractors were cheerful, the key the only problem; now two other reasons to call out
    //   "Jim!"
    // why: same cake ← "devil's food" heard again with "hate" lost; meeting ← "Jim!" called out, heard as a summons
    { id: 'i2', skill: 'infer', level: 'B2', point: 'likeme', reveals: ['devils'], seg: [118.1, 130.35],
      stem: 'What do the lines right after Jim’s “people like me” show?',
      choices: ['His quick yes has already upset someone', 'Someone wants the same cake for himself',
                'Someone is calling him away to a meeting'], a: 0,
      cue: '「Jim!」と呼ばれたあとの最初の文。',
      line: 'Yeah, *people like me*, I guess. — Jim! *I hate devil’s food*.',
      said: '「みんなに好かれてるな」と満足した直後、「ジム！デビルズフードは大嫌いだ」と来る。',
      mean: '一人に選ばせた途端、別の人の不満が出る。案のほころび。',
      trap: '呼ぶ声は呼び出しにも聞こえ、devil’s food だけ拾うと同じ注文に聞こえる。次の動詞を聞く。',
      use: 'Hey, can we talk about the menu?（ねえ、メニューの件で話せる？）' },

    // R fix: C10, "two-word reply" rested on whisper's "Everybody's birthday" (captions: "everybody"); the stem no
    //   longer counts words, and the line is on the ear-check list (blind 45 %: kept otherwise)
    // why: wishes ← "birthday" heard as the greeting; agrees ← a short reply read as a 相づち (yes, of course)
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'everybody', reveals: ['likeme', 'devils'], seg: [125.7, 133.8],
      stem: 'When the man who hates the cake complains, what does the short reply do?',
      choices: ['Reminds him the party is for all of them', 'Wishes all of them a happy birthday',
                'Agrees that each person should choose'], a: 0,
      cue: '「on my birthday」への短い返し。',
      line: '…pick the cake on *my birthday*. — *Everybody’s birthday.* — Today is actually my birthday…',
      said: '「自分の誕生日に他人がケーキを選ぶのは不公平」に「みんなの誕生日」と返される。',
      mean: 'my を everybody’s に言いかえ、合同の会だと念を押す訂正。',
      trap: 'birthday が聞こえると祝いの言葉に取りやすい。どの語を言いかえたかを聞く。',
      use: 'It’s not your trip. It’s our trip.（君の旅じゃない、僕らの旅だよ）' },

    // why: weeks ← "two" caught and the unit guessed; years ← "months ago" links into one blur ("monthsago")
    { id: 'n2', skill: 'number', level: 'B1', point: 'twomonths', reveals: ['include'], seg: [162.4, 166.8],
      stem: 'When was Toby’s birthday?',
      choices: ['Two weeks ago', 'Two months ago', 'Two years ago'], a: 1, keep: true,
      cue: '「my birthday was」のあと、単位の語。',
      line: 'My birthday was *two months ago*.',
      said: '会話の途中で、トビーが「僕の誕生日は2か月前だった」と切り出す。',
      mean: '日付だけでなく、祝ってもらえなかった話の入り口。',
      trap: 'months の s が ago にくっつく。単位の語は、最後の s まで聞いて決める。',
      use: 'My birthday was last week, actually.（実は先週が誕生日だったんだ）' },

    // R fix: K2 + reveals: "set two months after his birthday" wasn't refuted by the segment (the party could well have
    //   been then) and gave away n2's key; now an a.m. reading of the time
    // why: lunch ← the time is the point, but "four fifty-eight" is heard only as "a time" and its meaning missed;
    //   dawn ← "four fifty-eight" with no a.m./p.m. heard as early morning
    { id: 'i1', skill: 'infer', level: 'C1', point: 'fourfiftyeight', seg: [168.5, 176.85],
      stem: 'Why does Toby feel he didn’t really get a party?',
      choices: ['It was set for the last minutes of the work week', 'It was set for lunch, when people were out',
                'It was set for dawn, before anyone came in'], a: 0,
      cue: '「scheduled it for」のあとの時刻と曜日。',
      line: 'Well, there was. But *Michael scheduled it for 4:58 on a Friday*.',
      said: '「会はあったけど、マイケルが金曜の4時58分に入れた」と話す。',
      mean: '終業直前、週末の帰りぎわ。形だけの会だった。',
      trap: '時刻の数字だけ追うと、昼や早朝にも取れる。数字を聞いたら、どんな時間帯かまで考える。',
      use: 'They scheduled it for Friday at five.（金曜の5時に入れられた）' },

    // R fix: V2, blind 70 %: "include me" made the key the only request; now a second, wrong request
    // why: own party ← "can I have my own cake?" earlier, carried over; complaining ← the 4:58 story just before heard
    //   as the point of it
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'include', reveals: ['fourfiftyeight'], seg: [176.8, 181.9],
      stem: 'When Toby says what he “just thought”, what is he doing?',
      choices: ['Asking, indirectly, to be part of the party', 'Asking, indirectly, for a party of his own',
                'Complaining, politely, about his last party'], a: 0,
      cue: '「I just thought maybe」のあと。',
      line: 'I just thought *maybe you could include me*. — Seriously?',
      said: '「僕も入れてもらえるかなと思って」と言い、「本気？」と返される。',
      mean: 'I just thought maybe ～ は控えめなお願いの型。',
      trap: '直前の4時58分の話や「自分のケーキ」の頼みに引っぱられやすい。include me は「入れて」。',
      use: 'I just thought maybe I could join you.（よかったら一緒に行けるかなと思って）' },

    // R fix: V2, blind 50 %: "likes him, as the praise says" was the weak one; now a near miss on what "much" means
    // why: dull ← "a little bit much" heard as mild criticism of the wrong kind, "much" lost; pities ← the sad party
    //   story just before
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'much', seg: [184.8, 189.6],
      stem: 'In his comment to the camera, how does Jim feel about Toby?',
      choices: ['He finds Toby tiring, despite the praise', 'He finds Toby a bit dull, despite the praise',
                'He pities Toby, after the parking-lot story'], a: 0,
      cue: '「great」が2回のあと、つなぎの一語から。',
      line: 'Toby’s great. He’s great. *But sometimes he can be a little bit much*.',
      said: '「トビーはいいやつだ、本当に。でも時々ちょっと重い」と話す。',
      mean: 'a little bit much ＝ ちょっと疲れる。ほめてから but で本音。',
      trap: 'great の重ねは本気に聞こえる。but のあとの much は「多すぎ」で退屈の逆。',
      use: 'Sweet guy, but a bit much.（いい人だけど、ちょっと疲れる）' },

    // why: won't change ← "just throw you in" heard as a small add-on, so the reason sounds like "no big deal";
    //   fair ← Toby's complaint was about being left out, so the reason sounds like fairness
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'merrier', reveals: ['include'], seg: [194.6, 199.4],
      stem: 'What does Jim mean by his reason for adding Toby?',
      choices: ['More people will make it more fun', 'One more person won’t change much',
                'Everyone deserves a turn, so it’s fair'], a: 0,
      cue: '「because」のあとの決まり文句。',
      line: 'We’re just going to *throw you in*, because *the more the merrier*, right? — No.',
      said: '「君も入れよう。多いほど楽しいしね」に、すぐ「だめ」と返る。',
      mean: 'the more the merrier ＝ 多いほど楽しい。',
      trap: 'throw you in の軽さから「大差ない」と取りやすい。the 比較級, the 比較級 の型で覚える。',
      use: 'Bring your friends! The more the merrier.（友だちも連れてきて、多いほど楽しい）' },

    // why: behind her back ← "you can't just change plans" heard as a complaint about not being asked (a fair
    //   grievance, but not what the word says); again and again ← the rhyming "willy-nilly" heard as repetition
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'willynilly', seg: [200.25, 206.85],
      stem: 'How, according to the “I am not a machine” complaint, does Jim change plans?',
      choices: ['On a whim, without thinking it through', 'Behind her back, without asking her first',
                'Again and again, all week long'], a: 0,
      cue: '「change plans」のすぐあとの、はねるような語。',
      line: 'You can’t just change plans *willy-nilly*…',
      said: '「私は機械じゃない。好き勝手に予定を変えないで」と怒る。',
      mean: 'willy-nilly ＝ 行き当たりばったりに。準備の手間を考えていない、という批判。',
      trap: '似た音のくり返しは「何度も」に聞こえやすい。音遊びの語は、文全体の不満から意味を決める。',
      use: 'Don’t change the plan willy-nilly.（思いつきで予定を変えないで）' },

    // R fix: K1, "moves on with the plan" rested on "Okay, then we need to…", which is cut off (whoever says it, it
    //   could go on to fix the menu); the key now rests on "That's a bummer" alone (blind 55 %, so the choices changed too)
    // why: apologizes ← "bummer" is unfamiliar, and the sorry script after an allergy is expected; teases ← a short,
    //   flat reply read as mocking his fuss about food
    { id: 'pr3', skill: 'pragma', level: 'C1', point: 'bummer', seg: [210.3, 215.1],
      stem: 'What does the reply to the mushroom allergy do?',
      choices: ['Brushes it off with a quick “too bad”', 'Apologizes for not asking about it first',
                'Teases him for being a picky eater'], a: 0,
      cue: 'アレルギーと聞いた直後の、短い返事。',
      line: 'I’m allergic to mushrooms. — *That’s a bummer.* Okay…',
      said: '「キノコのアレルギーなんだ」に「お気の毒」と軽く返すだけ。',
      mean: 'bummer ＝ ついてないね。同情の形だけで、謝りも気づかいもしない。',
      trap: '謝罪が続く型や、短い返事をからかいと取りやすい。bummer は同情の決まり文句。',
      use: 'Rain again? That’s a bummer.（また雨？ついてないね）' },

    // why: three ← "one, two, three" counted aloud, the last number heard; half ← "so then we just shouldn't do it"
    //   sounds like the end of a close vote
    { id: 'd4', skill: 'detail', level: 'B2', point: 'hands', reveals: ['outcome'], seg: [230.65, 238.4],
      stem: 'When Jim asks who has problems with the plan, how many do?',
      choices: ['Three people in the room', 'About half the room', 'Everyone in the room'], a: 2, keep: true,
      cue: '数え始めて、途中でやめたところ。',
      line: 'One, two, three, *everybody*. Okay, so then we just shouldn’t do it.',
      said: '「文句のある人？」と聞き、「1、2、3…全員だ。じゃあ、やめよう」と言う。',
      mean: '数えるのをやめて everybody と言い切る。',
      trap: '最後に聞こえた three を答えにしやすい。数え上げが途中で切れたら、次の語で全体が決まる。',
      use: 'Who’s in? One, two… everybody!（参加する人？1、2…全員だ！）' },

    // why: return ← "take them" read literally as taking the food back to the store; polite ← a Japanese-frame reading:
    //   offering to help clean up is the expected kind move after a complaint
    { id: 'h2', skill: 'humor', level: 'C1', point: 'takethem', reveals: ['outcome'], seg: [238.1, 243.95],
      stem: 'Why does “Oh, I’ll take them” get a laugh?',
      choices: ['He treats the complaint as a real question', 'He offers to return the food to the bakery',
                'He is being polite, offering to help clean up'], a: 0,
      cue: '「What am I supposed to do with」の言い方。',
      line: '*What am I supposed to do with* two cakes and a pie? — *Oh, I’ll take them.*',
      said: '「ケーキ2つとパイ、どうしろっていうの？」に、すかさず「じゃあ僕がもらう」。',
      mean: '答えを求めない嘆きを、本当の質問として受けるのが笑い。',
      trap: 'take を「返品に持っていく」と取りやすい。嘆きの質問にまじめな答えが返ったら笑いどころ。',
      use: 'What am I supposed to do with all this?（これ全部どうしろっていうの）' },

    // R fix: V2, blind 75 %: the key was the only choice tied to the plan, and "sting" in the stem gave the direction;
    //   now a sincerity flip on the same cause
    // why: praise ← sincerity flip: taken for the boss heard as a compliment (出世の兆し); forgot ← the slip taken
    //   literally, as the coworker mixing up names
    // anchor: 244–245.3 s "Hey, Michael. I mean, Jim." then 251.6–254.6 s "always and forever be haunted": mock horror
    //   at being taken for the man whose birthday habits opened the clip, right after his own plan fell apart
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'michael', reveals: ['outcome'], seg: [243.75, 254.9],
      stem: 'After Jim’s comment to the camera, how does the name slip land?',
      choices: ['As a blow: his plan made him act like Michael', 'As praise: his plan made him look like the boss',
                'As a worry: a coworker forgot his name'], a: 0,
      cue: 'haunted という大げさな語と、直前の失敗。',
      line: 'Hey, *Michael*. I mean, Jim. … I will *always and forever be haunted* by that fact.',
      said: '会が流れた後、同僚に「マイケル…じゃなくてジム」と呼ばれ、「一生つきまとわれる」とカメラに話す。',
      mean: '冒頭の誕生日の主役はマイケル。案が空回りした直後で、同じことをしたと突きつけられた。',
      trap: 'ボスと呼ばれたのを出世の兆しや物忘れと取りやすい。大げさな haunted が痛みを示す。',
      use: 'I’ll never live this down.（一生言われ続けるな）' },
  ]
};
