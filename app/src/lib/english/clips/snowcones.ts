// “Leslie tries bribing like a real politician | Parks and Recreation” (the official Parks and Recreation channel,
// Season 5): Ron's budget plan cuts the town's public mini golf course; before the vote, Leslie treats Councilman Jamm
// to snow cones and a round there, Ron turns up to talk about the cost, and she ends up admitting she'll do anything
// for Jamm's vote.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈249 s. Untested: 8–11 s (“Pawnee Poms”
// vs “Palms”), 51 s (“vigor” vs “vicar”), 67–70 s (an unrelated cutaway), 78–85 s (Chris's “lubricant” line),
// 105–108 s and 120–123 s (Jamm's insult and “you racist” lines), 138–142 s (a beer brand), 157.7 s (a film title),
// 190 s (the golf term “away”), and every line that rests on world knowledge (Hoover Dam, putt-putt windmills).
// EAR CHECK: 115.8 s a4 — “What a great and funny story” is taken as Leslie's (same turn as her hot-dog offer;
//   no name is said); the key holds if it's Chris, who is also on her side
// REVIEW 2026-11-16: pass 5, fix 19, drop 0, new 0; ear checks 1 (unchanged)
import type { Clip } from '../types.ts';

export const snowCones: Clip = {
  id: 'snowcones', video: '_qcWA1BX34k', title: 'Leslie tries bribing like a real politician', dur: 270, wpm: 172,
  band: 'fast', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %): the "sweating" choice was a filler; the new distractor uses "budget cut proposal"
    // why: budget cuts ← "my latest budget cut proposal" heard as the whole city's cuts; agenda ← "city council
    //   meeting tomorrow" comes later in the scene
    { id: 'g1', skill: 'gist', level: 'B1', point: 'cut', reveals: ['putt'], seg: [0, 34.6],
      stem: 'Why is Leslie so angry at the start?',
      choices: ['Ron wants to stop funding a place she loves', 'Ron blames her for the city’s budget cuts',
                'Ron took her plan off the city council’s agenda'], a: 0,
      cue: '「Second,」のあと、ロンが何をしたいのか。',
      line: 'Second, you want to *cut funding* for the… public putt-putt?',
      said: 'ロンの削減案を見て「公営ミニゴルフの予算を切るの？」と詰め寄る。',
      mean: 'cut funding ＝ 予算を削る。レスリーの好きな施設が対象なのが怒りの理由。',
      trap: 'budget cut から予算全体の話に思えるが、怒りは Second のあとの施設。',
      use: 'They’re cutting funding for the library.（図書館の予算が削られる）' },

    // R fix: V2 (blind 80 %): "only things Ron likes" was a filler; the new distractor has the right items in the wrong
    //   relation (ranked above)
    // why: leaves out roads ← "roads and bridges" comes late and fast; above ← mini golf heard as put first, when it
    //   comes third
    { id: 'h2', skill: 'humor', level: 'C1', point: 'list', reveals: ['putt'], seg: [12.9, 24.8],
      stem: 'In Leslie’s list of things you don’t cut, what makes it funny?',
      choices: ['She puts mini golf in with schools and police', 'She leaves roads and bridges off the list',
                'She puts mini golf above schools and police'], a: 0,
      cue: '最初の2つのあとに、何が並ぶか。',
      line: 'Schools, police, *mini golf, merry-go-rounds*, parades, gazebo repair…',
      said: '「削れない物もある。学校、警察、ミニゴルフ、メリーゴーラウンド…」と並べる。',
      mean: '大事な公共サービスと遊び場を同じ重さで並べる。本人は真剣なのが笑い。',
      trap: 'roads and bridges も後で出てくるので、抜けてはいない。並び順の落差を聞く。',
      use: 'Some things you just don’t cut.（削っちゃいけない物もある）' },

    // R fix: V2 (blind 60 %): the key was the only choice with "useful"; a partial-listener distractor now has it too
    // why: costly useful ones ← "useful projects" heard but taken with a sensible limit; keeps the built ones ← "past
    //   projects" missed at speed
    { id: 'i1', skill: 'infer', level: 'B2', point: 'ronview', seg: [24.6, 32.9],
      stem: 'What does Ron’s answer show about which projects he would cut?',
      choices: ['Nearly all of them, useful or not', 'Useless ones, and useful ones that cost a lot',
                'New ones, but not the ones already built'], a: 0,
      cue: '「I also believe」のあと、並ぶ形容詞。',
      line: 'I also believe in cutting *useful projects, future projects and past projects*.',
      said: '「無駄な事業も、役立つ事業も、未来や過去の事業も削る」と言う。',
      mean: 'useless のあとに useful まで並べる。事業ならほぼ何でも削りたいという立場。',
      trap: '最初の useless だけ聞くと、まともな節約家に聞こえる。also のあとが本音。',
      use: 'I also believe in second chances.（やり直しのチャンスも大事だと思う）' },

    // R fix: V2 (blind 60 %): "offers help" was weak; the new distractor is the Japanese frame of a compliment that
    //   cools things down
    // why: asks why ← "Why don't you…?" read as a real why-question (なぜ〜しないの); praising ← "you also believe in
    //   making furniture" heard as a peace offering
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'whydont', seg: [34.8, 39.6],
      stem: 'When Leslie brings up Ron’s furniture making, what is she doing?',
      choices: ['Telling him to go do that and leave this alone', 'Asking him why he has stopped making chairs lately',
                'Praising his chair making to calm things down'], a: 0,
      cue: '「Why don’t you go」の形と、最後の instead。',
      line: '*Why don’t you go* solder a chair *instead*?',
      said: '「代わりに椅子でもはんだ付けしてきたら？」と言う。',
      mean: '「そっちでもやってたら」。口出しするなという皮肉な提案。',
      trap: 'Why を「なぜ」と取ると質問に聞こえる。Why don’t you は提案の形。',
      use: 'Why don’t you take a break instead?（代わりに休憩したら？）' },

    // R fix: V2 (blind 75 %): "can't make chairs at all" was refuted by the stem's own premise; the new distractor
    //   reads the reply as "stay out of my hobby"
    // why: won't work for the city ← Ron's anti-government stance; keep out ← "Do you expect me to…" heard as a
    //   brush-off
    { id: 'h3', skill: 'humor', level: 'C1', point: 'solder', seg: [36.9, 43.7],
      stem: 'Why does Ron answer with a question about chips and small wires?',
      choices: ['She used a word for electronics, not wood', 'He will not make furniture for the city',
                'He wants her to keep out of his hobby'], a: 0,
      cue: '彼女が使った動詞と、ロンの返事の材料。',
      line: 'go *solder* a chair… — Do you expect me to make a chair out of *transistor chips and small wires*?',
      said: '「椅子をはんだ付けしたら」に、「チップと細い線で椅子を作れと？」と返す。',
      mean: 'solder（はんだ付け）は電子部品の作業。木工ではないと、言葉の選び方を突いている。',
      trap: '反政府のロンなので「市のためには作らない」と取りやすいが、返事は材料の話。',
      use: 'That’s not quite the right word.（それはちょっと言葉が違うね）' },

    // R fix: V2 (blind 75 %): "the public pool" isn't in the clip; it's now a place from her list
    // why: golf club ← "golf course" heard without the weak "mini"; merry-go-rounds ← from her list just before
    { id: 'd1', skill: 'detail', level: 'B1', point: 'putt', seg: [43.5, 48.7],
      stem: 'According to Ron, what is on tomorrow’s council agenda?',
      choices: ['Ending money for the mini golf course', 'Ending money for the town’s golf club',
                'Ending money for the merry-go-rounds'], a: 0,
      cue: '「Look,」のあと、the defunding of のあと。',
      line: 'the *defunding of the mini golf course* is on the agenda…',
      said: '「ミニゴルフ場への予算打ち切りが、明日の市議会の議題だ」と言う。',
      mean: 'defunding ＝ 予算をなくすこと。明日の会議で決まる、という話の土台。',
      trap: 'golf course だけ聞くと本物のゴルフ場に思える。mini は短く弱いので聞き逃しやすい。',
      use: 'It’s on the agenda for Monday.（それは月曜の議題に入ってる）' },

    // why: the same ← "more visitors than the Hoover Dam" just before; half ← "double" missed, "the amount" heard;
    //   ten times ← her big talk
    { id: 'n1', skill: 'number', level: 'B1', point: 'double', seg: [55.9, 63.6], keep: true,
      stem: 'How much electricity does Leslie say the course will produce?',
      choices: ['Half the dam’s', 'The same as the dam', 'Double the dam’s', 'Ten times the dam’s'], a: 2,
      cue: '「electricity」の前、量を表す一語。',
      line: 'And it’ll produce *double the amount* of electricity.',
      said: '「フーバーダムより人が来て、電気も2倍作る」と言い切る。',
      mean: 'double the amount ＝ 2倍の量。大げさな約束。',
      trap: '直前の more visitors than に引かれやすい。量の語は amount の前。',
      use: 'It takes double the time.（2倍の時間がかかる）' },

    // R fix: V2 (blind 60 %): "about to back down" didn't fit her lines; the new distractor takes the windmills as her
    //   plan
    // why: clear plan ← her confident "I'm going to win" just before; windmills ← "it already has windmills" heard as
    //   the method
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'windmill', reveals: ['figure'], seg: [60.6, 67],
      stem: 'When Ron asks how, how does Leslie sound?',
      choices: ['Making it up as she goes along', 'Calm, with a clear plan ready', 'Sure the windmills will do the job'],
      a: 0,
      cue: '「How?」のあとの3つの短い文。',
      line: '*I’ll figure it out*, it already has windmills, *who cares?*',
      said: '「何とかする。風車もあるし。どうでもいいでしょ」と勢いで返す。',
      mean: '具体的な方法はない。ミニゴルフの飾りの風車まで持ち出す、勢いだけの答え。',
      trap: '風車を本気の策と取りやすいが、I’ll figure it out は「これから考える」。',
      use: 'I’ll figure it out as I go.（やりながら考えるよ）' },

    // R fix: S4: the segment ended 0.15 s after "out", which runs into "already"; it now ends after "windmills"
    { id: 'x1', skill: 'dict', level: 'B2', point: 'figure', seg: [63.3, 66.25],
      stem: 'Type what Leslie says after “How?”: “___.” (4 words)', answer: 'i\'ll figure it out',
      cue: '「How?」の直後。語がつながって短い。',
      line: '*I’ll figure it out*, it already has windmills',
      said: '「何とかするわよ」と、方法は言わずに返す。',
      mean: 'figure it out ＝ 考えて答えを出す。方法がまだないときの決まり文句。',
      trap: 'figure‿it‿out が「フィギャリラウ」とつながる。it の t は弾み、out の t は消えやすい。',
      use: 'We’ll figure something out.（何とかなるよ）' },

    // R fix: V2 (blind 60 %): "a real red carpet" named the idiom, which gave the key; the literal reading is now a
    //   formal party
    // why: formal party ← "red carpet" heard as a ceremony; asks for the vote ← the vote is what she wants, said
    //   outright
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'carpet', seg: [70.5, 75.2],
      stem: 'What is Leslie planning to do for Jamm?',
      choices: ['Treat him like a very important guest', 'Throw a formal party in his honor',
                'Ask him straight out for his vote'], a: 0,
      cue: '「fall in love with this place」のあとの言い方。',
      line: 'I need to have Jamm fall in love with this place, so I’m *rolling out the red carpet*.',
      said: '「ジャムにこの場所を好きになってもらう。だから大歓迎する」と言う。',
      mean: 'roll out the red carpet ＝ 大切な客として盛大にもてなす。',
      trap: 'red carpet から式典を想像しやすい。慣用句は「相手に何をするか」で考える。',
      use: 'They rolled out the red carpet for us.（私たちを大歓迎してくれた）' },

    // why: carries things ← "caddy" = carrying clubs, stretched to his whole life; golf tips ← a caddie advises on
    //   shots
    // reveals offnight only for the test's match: “offering” holds s1's key “off”
    { id: 'i2', skill: 'infer', level: 'B2', point: 'caddy', reveals: ['offnight'], seg: [84.9, 95.9],
      stem: 'What does Chris mean by being a caddy to everyone in his life?',
      choices: ['He keeps cheering on everyone he knows', 'He carries things for all his friends',
                'He gives everyone tips on their game'], a: 0,
      cue: '「more than just carrying clubs」のあとの文。',
      line: 'It’s about offering *positive reinforcement*. I consider myself a caddy to everyone in my life.',
      said: '「キャディは励ます役。僕はみんなのキャディ」。',
      mean: 'positive reinforcement ＝ ほめて伸ばすこと。誰でも励ます人。',
      trap: 'caddy で「荷物運び」を思い浮かべやすいが、本人が just carrying clubs を否定。',
      use: 'I’m always in your corner.（いつも君の味方だよ）' },

    // R fix: V2 (blind 75 %): "open mockery to his face" was too strong to pick; it's now a quiet dig. The sincere
    //   choice no longer says "she", since the speaker is on the ear-check list
    // why: admired ← "great and funny" taken at face value; quiet dig ← praise for a theft story can be ironic
    { id: 'a4', skill: 'attitude', level: 'C1', point: 'story', seg: [108.8, 119.9],
      stem: 'When Jamm’s putter story is called “great and funny”, is that sincere?',
      choices: ['No; it’s flattery to win him over', 'Yes; the trick is honestly admired',
                'No; it’s a quiet dig at what he did'], a: 0,
      cue: 'ほめ言葉のすぐあと、何を勧めるか。',
      line: '*What a great and funny story*. Okay, before we start, anybody want a hot dog?',
      said: 'パターを盗んだ話に「なんて素敵で面白い話」と言い、すぐ食べ物を勧める。',
      mean: '盗んだ話をほめるのは、票がほしいから。ご機嫌取りのお世辞。',
      trap: '大げさなほめ言葉は皮肉にも聞こえるが、続けて食べ物を勧めている。怒らせる気はない。',
      use: 'Wow, what a great story!（へえ、いい話ですね！）' },

    // R fix: K1: "drops the cost and talks about the kids" is half true ("kids love it" follows); it's now a dispute
    //   of the figure (blind 55 %)
    // why: agrees it's costly ← "What a bargain!" can be sarcastic; lower cost ← "bargain" heard as "it’s cheap"
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'bargain', reveals: ['subsidy'], seg: [145.2, 157.6],
      stem: 'What does Leslie do with Ron’s point about the cost?',
      choices: ['Turns the cost into a reason to keep it', 'Agrees with him that it costs too much',
                'Says the true cost is much lower than that'], a: 0,
      cue: '「thousands of dollars」の直後の一言。',
      line: 'cost the taxpayers *thousands of dollars a year*. — *And what a bargain!*',
      said: '「年に何千ドルもかかる」に、すかさず「なんてお得！」と返し、みんな大好きだと続ける。',
      mean: '相手の「高い」を「安い」に言い換えて、残す理由にする切り返し。',
      trap: 'What a bargain! は皮肉にもなるが、続けて「子どもも大人も大好き」とほめている。',
      use: 'For that price? What a bargain!（その値段で？お得だね！）' },

    // R fix: V2 (blind 60 %): "really had no idea" was weak; the new distractor takes the reply as an answer to "Have a
    //   snow cone"
    // why: don't say it ← "don't say" read as an order (言うな); turns down ← the offer "Have a snow cone" just before
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'dontsay', seg: [159, 170.9],
      stem: 'When Jamm says Leslie is buying all night, what does Ron’s reply do?',
      choices: ['Fakes surprise to point at something shady', 'Tells Jamm not to say that kind of thing aloud',
                'Politely turns down the free snow cone'], a: 0,
      cue: '短い一言のあと、続けて何を並べるか。',
      line: '*You don’t say.* She’s buying you snow cones and tomorrow you’re voting…',
      said: '「へえ」と言い、「おごられて、明日は彼女の件で投票か」と続ける。',
      mean: 'You don’t say ＝ 驚いたふり。分かりきったことを皮肉に強調する。',
      trap: 'don’t say を「言うな」と取りやすい。この形は決まり文句で、驚いたふりの相づち。',
      use: 'You don’t say! Who would’ve guessed?（へえ、まさかね！）' },

    // C2: which reply would show he understood (cf. f2)
    // anchor: 165.6–170.6 s "You don't say." then "She's buying you snow cones and tomorrow you're voting on an issue
    //   that she cares about": two facts set side by side, with no word of praise
    // R fix: C2 §3 (blind 70 %): the key was the only choice about the vote; the thanks reply became right topic,
    //   wrong direction
    // why: literal ← "You don't say" as a ban on speech → "I do say"; owes her ← Ron's two facts heard as approving
    //   the deal
    // retired with nt2 (see there)
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'dontsay', seg: [159, 170.9], retired: true,
      stem: 'Which reply from Jamm would show he got Ron’s point?',
      choices: ['Come on, a snow cone won’t buy my vote.', 'I do say. Leslie is paying all night.',
                'Right, so I owe her my vote tomorrow.'], a: 0,
      cue: '「You don’t say」のあと、二つの事を並べる文。',
      line: 'She’s buying you snow cones *and tomorrow you’re voting* on an issue that she cares about.',
      said: 'ロンは「へえ」と驚いたふりをし、「おごられて、明日は彼女の件で投票」と並べる。',
      mean: '二つの事実を並べるだけで、買収だとほのめかしている。分かったなら、票は買えないと否定する返事が合う。',
      trap: '文字通りに「言うな」と取ると返事がずれる。事実を並べる皮肉には、その裏の意味に返す。',
      use: 'Are you saying I can be bought?（僕が買収されるって言いたいの？）' },

    // R fix: V2 (blind 60 %): "agrees and turns down the offer" was weak; the new distractor reads "spout off" as anger
    // why: takes it seriously ← "facts" heard as respect; calls it a lie ← "spout off" heard as an angry denial
    // reveals offnight only for the test's match: “spout off” holds s1's key “off”
    { id: 'i5', skill: 'infer', level: 'B2', point: 'spout', reveals: ['dontsay', 'offnight'], seg: [170.6, 178.9],
      stem: 'How does the next speaker treat Ron’s point about the snow cones?',
      choices: ['Waves it off and wants to start the game', 'Takes it seriously and asks for the facts',
                'Calls it a lie and tells Ron to leave'], a: 0,
      cue: '「stand around all day」のあと、Ron の話を何と呼ぶか。',
      line: 'are we going to stand around all day and listen to Ron *spout off unrelated facts*… *Game on!*',
      said: '「ロンの関係ない話を一日聞くの？さあ始めよう！」と言う。',
      mean: 'spout off ＝ べらべらしゃべる。ロンの指摘を「無関係」と片づける。',
      trap: 'facts（事実）が聞こえるので、まじめに受け取ったように思える。前の unrelated を聞く。',
      use: 'Enough talk. Let’s get started.（話はいいから、始めよう）' },

    // why: already has one ← "got" = has; for the kids ← balloons = children's things
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'dibs', seg: [180.5, 188.7],
      stem: 'When the free balloons arrive, what does the first reply do?',
      choices: ['Claims several of them first', 'Says he already has the dinosaur', 'Offers them to the children first'],
      a: 0,
      cue: '「I got」のあとの短い語と、最後の一文。',
      line: 'I *got dibs on* the dinosaur. And the pirate and the dolphin. *I want all of them*.',
      said: '「恐竜はおれのもの。海賊とイルカも。全部ほしい」と言う。',
      mean: 'got dibs on ～ ＝ 〜は自分が先に取った、という宣言。子どもっぽいわがまま。',
      trap: 'got を「持っている」と取ると意味が変わる。dibs は「先取り」の決まった言い方。',
      use: 'Dibs on the front seat!（助手席は僕ね！）' },

    // R fix: S2/V2 (blind 50 %): the quote "I could be a pro" gave the key; the stem now names the moment only, and
    //   "too hot" became "too serious"
    // why: angry ← "on fire" heard as fired up (頭に血が上る); too serious ← fire = intensity
    { id: 'f4', skill: 'phrase', level: 'B1', point: 'fire', seg: [197.1, 201.7],
      stem: 'Right after Jamm’s next putt, what is said about his game?',
      choices: ['He is playing extremely well', 'He is getting really angry', 'He is taking it all too seriously'],
      a: 0,
      cue: '「Wow, you are」のあと。',
      line: 'Wow, *you are on fire*, Jeremy. Having fun?',
      said: '「すごい、絶好調ね、ジェレミー。楽しい？」と声をかける。',
      mean: 'on fire ＝ 絶好調。スポーツやゲームで調子がいい人によく使う。',
      trap: 'fire から「怒り」や「熱くなりすぎ」を想像しやすい。直前の「プロになれる」と合わせる。',
      use: 'You’re on fire today!（今日は絶好調だね！）' },

    // why: $900 ← "nine" heard and "thousand" lost; $19,000 ← nine/nineteen; $90,000 ← nine/ninety
    { id: 'n2', skill: 'number', level: 'B1', point: 'subsidy', seg: [208.6, 213.8], keep: true,
      stem: 'How much a year does Ron say the course costs taxpayers?',
      choices: ['$900', '$9,000', '$19,000', '$90,000'], a: 1,
      cue: '「cost the taxpayer」のあとの数字。',
      line: 'cost the taxpayer *$9,000* in annual subsidies.',
      said: '「年間9,000ドルの補助金を納税者に負担させている」。',
      mean: 'annual subsidies ＝ 年間の補助金。数字での反論。',
      trap: 'nine と nineteen、ninety は語尾で区別する。thousand の「サウ」まで聞く。',
      use: 'It costs about nine thousand a year.（年に約9,000かかる）' },

    // R fix: V2 (blind 80 %): "agrees to stop and play fairly" was weak; the new distractor gives her closing words
    //   to Ron
    // why: says she's playing badly ← "I'm having a very off night" comes first; Ron agrees ← "good for the
    //   community" is said, but by Leslie
    { id: 'g2', skill: 'gist', level: 'B2', point: 'anything', reveals: ['losing'], seg: [226.9, 249.2],
      stem: 'How does the argument with Ron end?',
      choices: ['Leslie admits she’ll do whatever it takes', 'Leslie insists she is just playing badly',
                'Ron agrees the course is good for the town'], a: 0,
      cue: '最後の長い文で、何をすると言うか。',
      line: '*I will do anything I can* to get Jamm’s vote…',
      said: '「わざと負けている」と責められ、最後は「票のためなら何でもする」と言い切る。',
      mean: '否定から開き直りへ。地域のためと言いながら、票集めを認めている。',
      trap: '最初の「今夜は調子が悪い」で終わったと思いやすい。最後の長い文が結論。',
      use: 'I’ll do whatever it takes.（何でもやるよ）' },

    // R fix: V2 (blind 50 %): "snow cones with city money" isn't hinted anywhere; the new distractor is flattery,
    //   which Leslie does do ("you are on fire")
    // why: lying ← "lying" is the next sentence's word; praising ← "pandering" heard as flattery, then "worse" as
    //   more of it
    { id: 'd4', skill: 'detail', level: 'B2', point: 'losing', seg: [227.2, 231.6],
      stem: 'What does Ron call even worse than pandering?',
      choices: ['Losing the round to Jamm on purpose', 'Lying about what the course costs',
                'Praising Jamm’s game to his face'], a: 0,
      cue: '「And worse,」のあと。',
      line: 'And worse, *you’re deliberately losing*.',
      said: '「票目当てのご機嫌取りだ。もっと悪いのは、わざと負けていることだ」と言う。',
      mean: 'deliberately ＝ わざと。ロンには、勝負で手を抜くのはご機嫌取り以上に許せない。',
      trap: 'lying は次の文で出る言葉。worse のすぐあとを聞く。',
      use: 'Did you do that on purpose?（それ、わざとやった？）' },

    // why: awful ← "very off" links into something like "awful"; odd ← the same vowel, the last sound lost; long ← a
    //   common "night" phrase
    { id: 's1', skill: 'sound', level: 'B2', point: 'offnight', seg: [231.2, 234.3],
      stem: 'Fill the gap: “I’m having a very ___ night.”',
      choices: ['off', 'awful', 'odd', 'long'], a: 0,
      cue: '「very」のあとの短い一語。',
      line: 'I’m having a very *off* night.',
      said: '「わざとじゃない。今夜は調子が悪いだけ」と言う。',
      mean: 'an off night ＝ 調子の出ない日。off は「いつもの状態から外れた」。',
      trap: 'very off がつながると「ヴェリオーフ」で awful に近く聞こえる。f で短く終われば off。',
      use: 'Sorry, I’m having an off day.（ごめん、今日は調子が悪くて）' },

    // C2: what she is trying not to say (cf. d4)
    // anchor: 231.7–234.0 s "I am not deliberately losing. I'm having a very off night.", then 242.2–245.8 s "I will
    //   do anything I can to get Jamm's vote so that he will keep this course open"
    // R fix: C2 §3 (blind 75 %): "upset Ron came" was weak; the new near miss has the right target (Jamm) and the
    //   wrong motive
    // why: a good time ← her "Having fun?" and the keep-things-light plan; bad at golf ← "off night" taken at face
    //   value
    // retired: g2 and nt2 reveal each other, so with g2 leading play 3 and nt1 seen, the draw has no C2 to give;
    //   back with a third C2
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'losing', reveals: ['offnight', 'anything'], seg: [231.2, 246.1], retired: true,
      stem: 'When Leslie blames an off night, what is she trying not to say?',
      choices: ['That she is letting Jamm win for his vote', 'That she only wants Jamm to have a good time',
                'That she has never been good at mini golf'], a: 0,
      cue: '言い訳のあと、何のためなら何でもすると言うか。',
      line: 'I’m having a very *off night*. … *I will do anything I can to get Jamm’s vote*',
      said: '「わざとじゃない、調子が悪いだけ」と言ったあと、「ジャムの票のためなら何でもする」と言い切る。',
      mean: '「調子が悪い」は、わざと負けているのを隠す言い訳。最後の一文で、隠していた目的を自分で明かす。',
      trap: 'off night を本当の不調と取りやすい。言い訳は、あとで本人が言う目的と合わせて聞く。',
      use: 'I wasn’t trying very hard, okay?（本気じゃなかったの、いい？）' },

    // R fix: V2 (blind 55 %): the key's quotes around “a word” were the cue, and "keep her word next time" was weak
    // why: one rude word ← "I have a word for you" usually brings an insult; swears ← "your word" heard as giving her
    //   word that she isn't losing
    { id: 'h5', skill: 'humor', level: 'C1', point: 'word', seg: [236.6, 249.2],
      stem: 'Why does Leslie’s answer to “only as good as your word” get laughs?',
      choices: ['She promises one word, then gives a long speech', 'She answers him with one very rude word',
                'She swears she isn’t losing on purpose'], a: 0,
      cue: '「I have a word for you」のあと、何語話すか。',
      line: 'You want a *word*, Ron? I have *a word* for you… Stop, I know it’s *more than one word*.',
      said: '「一言あるわ」と長々と話し、「一語じゃないのは分かってる」と止める。',
      mean: 'your word（約束）を a word（一語）にずらし、長い演説にする言葉遊び。',
      trap: '「一言ある」はふつう悪口の前置きなので、悪口を待ちやすい。来るのは長い本音。',
      use: 'Can I have a word with you?（ちょっと話せる？）' },
  ]
};
