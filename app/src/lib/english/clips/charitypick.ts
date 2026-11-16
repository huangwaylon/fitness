// REVIEW 2026-11-16: pass 4, fix 20, drop 0, new 0; ear checks 0
//   Open: i1 (a million = "lots") is still about 50 % blind; hyperbole items are hard to hide. Blind pass ran on
//   stems + choices only (header unread); 20 of 23 choice items were ≥ 50 % and right.
// “Nothing Matters and I'm Always Tired | Parks and Recreation” (the official Parks and Recreation channel, Season 5):
// Ben needs help picking his new foundation's first charity; Andy, low since failing the police exam, finds a kids'
// music program, Ben picks an ambulance charity instead, Andy slips out, and Ben is called selfish for it.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈199 s. Untested: 0.5–3.3 s and 7.7–15 s
// (no name is said for the friend who says “Pass”), 54 s (“Tummy” vs “Dummy”: 62 s agrees), 110–137 s (Tom's pick is
// legal help for the KKK; “smoothies” vs “movies”/“foodies”), 163.6 s (“It's a lot in here” vs “it's hot in here”),
// 176.6 s (“I'm outie” vs “I'm audi”) and who says “Ambulances are dumb” and “Classic Ben” (no item names them).
// EAR CHECK: none (every key rests on words both sources agree on)
import type { Clip } from '../types.ts';

export const charityPick: Clip = {
  id: 'charitypick', video: 'WxOtlGmyiSw', title: 'Nothing Matters and I\'m Always Tired', dur: 221, wpm: 146,
  band: 'slow', tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 80 %): only the key was a request for help. All three are now "To get help…".
    // why: office ← "check out the new digs… this place is insane" opens the scene; cheer Andy up ← Andy's low mood
    //   fills the middle
    { id: 'g1', skill: 'gist', level: 'B1', point: 'help', seg: [0, 43.55],
      stem: 'Why has Ben asked his friends to come over?',
      choices: ['To get help choosing where his money goes', 'To get help setting up his new office',
                'To get help cheering Andy up after his exam'], a: 0,
      cue: '最初の頼みと、後半のもう一度の頼み。',
      said: '「手伝ってほしい」と呼び、あとで「明日までに最初の支援先を選ぶ。手伝って」と頼む。',
      mean: '新しい財団の最初の寄付先選びを手伝ってもらうための集まり。',
      trap: '最初に新しい部屋の話、途中でアンディの話が出るが、呼んだ理由は手伝い。',
      use: 'Could you help me sort these out?（これ、仕分けるの手伝ってくれる？）' },

    // why: okays it ← pass = 合格 (passing a test); hand over ← pass = 渡す (pass the salt)
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'pass', seg: [2.55, 15.6],
      stem: 'When Ben asks for help, what does the one-word reply do?',
      choices: ['It turns his request down', 'It okays his request', 'It asks him to hand it over'], a: 0,
      cue: '一語の返事のあと、ベンの聞き返し。',
      line: 'I need your help. — *Pass.* — You came down here to *pass on helping me*?',
      said: '手伝ってと頼むと、一言「パス」。ベンは「断るためにわざわざ来たの？」と聞き返す。',
      mean: 'Pass. ＝ やめとく、遠慮する。pass on 〜 で「〜を断る」。',
      trap: 'pass を「合格」や「渡す」と取ると逆の意味になる。直後の聞き返しで確かめる。',
      use: 'I’ll pass on dessert, thanks.（デザートは遠慮しておきます）' },

    // R fix: V2 (blind 60 %): "settling in" was weak. Now "doesn't know how" (swamped heard as out of his depth).
    // why: unwell ← swamped heard as "sick" (stuck in a swamp, feeling bad); doesn't know how ← the swamp picture read
    //   as being lost, not overloaded
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'swamped', seg: [2.55, 8.35],
      stem: 'How does Ben describe himself when he asks for help?',
      choices: ['He has more work than he can handle', 'He doesn’t know how to do the job', 'He is feeling a little unwell'], a: 0,
      cue: '「I’m super」のあとの一語。',
      line: 'I’m *super swamped* and I need your help.',
      said: '「めちゃくちゃ忙しくて、手伝ってほしい」と言う。',
      mean: 'swamped ＝ 仕事に埋もれている。沼（swamp）に沈むイメージの「手一杯」。',
      trap: '沼のイメージから「動けない、具合が悪い」と取りやすい。仕事の量の話。',
      use: 'I’m swamped this week. Next week?（今週は手一杯。来週は？）' },

    // why: sorry ← saying no to a friend is usually followed by an apology (the Japanese frame: ごめんね); annoyed ←
    //   "came down here" heard as a complaint about the trip
    // R fix: S1 + N7: the stem said "who said no", pr1's key. It now quotes "Pass", and the choices' "no" is in reveals.
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'worth', reveals: ['pass'], seg: [8.35, 15.9],
      stem: 'How does the friend who answered “Pass” feel about it?',
      choices: ['Amused by Ben’s reaction to the no', 'Sorry about having to say no to Ben',
                'Annoyed at being asked to come here'], a: 0,
      cue: '最後の「It was totally」のあと。',
      line: 'I wanted to see what your face looked like when I said no. It was *totally worth it*.',
      said: '「断ったときの顔が見たかっただけ。来たかいがあった」と言う。',
      mean: 'worth it ＝ その価値がある。相手の反応を楽しむ、からかいの一言。',
      trap: '断ったあとは謝るものという型で聞くと外れる。worth it は満足のしるし。',
      use: 'The view was totally worth it.（景色は来たかいがあった）' },

    // why: sleeps all day / stopped eating ← the opposite symptoms, with "over-" lost before "eating"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'symptoms', seg: [15.7, 26.6],
      stem: 'What does Andy say about his sleep and his eating?',
      choices: ['He can’t sleep and he’s overeating', 'He sleeps all day and barely eats',
                'He can’t sleep and has stopped eating'], a: 0,
      cue: '「Also」のあとの短い2文。',
      line: '*Also, I can’t sleep. I’m overeating.*',
      said: '「大丈夫。ただ人生は無意味で疲れてる。眠れないし食べすぎ」と言う。',
      mean: 'overeating ＝ 食べすぎ。眠れない、食べすぎ、趣味に興味がない、と落ちこみのしるしが並ぶ。',
      trap: 'over- が弱いと eating だけ残り、「食べない」と取りやすい。',
      use: 'I’ve been overeating lately.（最近食べすぎてる）' },

    // R fix: V2 (blind 55 %): "music school" was off topic. All three are now police setbacks.
    // why: lost his job ← "police" heard with a job, not a test; dropped out ← "academy" heard without "exam"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'exam', seg: [26.15, 31.95],
      stem: 'According to the comment to camera, what happened to Andy?',
      choices: ['He failed the police academy exam', 'He dropped out of police academy',
                'He lost his job on the police force'], a: 0,
      cue: '「Ever since」のあと。',
      line: 'Ever since Andy *failed the police academy exam*',
      said: '「警察学校の試験に落ちてから」と説明が始まる。',
      mean: 'police academy ＝ 警察学校。ever since ＝ 〜して以来ずっと。',
      trap: 'police から仕事を失った話に思えるが、落ちたのは試験。',
      use: 'Ever since the move, I’ve been tired.（引っ越して以来、ずっと疲れてる）' },

    // R fix: V2 (blind 60 %): "hard and cold" was a filler. Now "a small knock" (the size of the fall missed).
    // why: improving ← "bottom" heard as a turning point (底を打つ = recovery from here); small knock ← "hit" heard
    //   without "rock bottom"
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'rock', seg: [26.15, 31.95],
      stem: 'What has happened to Andy’s self-esteem since then?',
      choices: ['It’s as low as it can go', 'It’s started to come back', 'It’s taken a small knock'], a: 0,
      cue: '「has hit」のあとの2語。',
      line: 'his self-esteem has *hit rock bottom*.',
      said: '「それから自信がどん底まで落ちた」と言う。',
      mean: 'hit rock bottom ＝ どん底に落ちる。最悪の状態、という意味。',
      trap: '日本語の「底を打つ」は回復の始まりも指すが、英語のこの言い方は最悪の今を言う。',
      use: 'My energy hit rock bottom.（元気がどん底だった）' },

    // R fix: V2 (blind 55 %): the key's "Only…; …stays" shape stood out. Three parallel "The…" readings.
    // why: sweat from sadness ← sad + sweaty heard as cause and effect; happy soon ← "usually happy" heard as a
    //   forecast
    { id: 'h2', skill: 'humor', level: 'C1', point: 'sweaty', seg: [26.15, 36.95],
      stem: 'What makes the two short lines about Andy’s mood funny?',
      choices: ['The sweat stays the same whatever his mood', 'The sweat comes from how sad he is now',
                'The sadness is new, but he’ll be happy soon'], a: 0,
      cue: '2文で、変わる語と変わらない語。',
      line: 'He’s always *sad and sweaty*. … He’s usually *happy and sweaty*.',
      said: '「今はいつも悲しくて汗だく」のあと、「ふだんは楽しくて汗だく」と付け足す。',
      mean: '気分は変わっても、汗だけはいつも同じ。2文を並べて初めて分かる笑い。',
      trap: 'sad と sweaty を原因と結果と取りやすい。usually は「ふだんは」。',
      use: 'She’s always tired, sick or not.（彼女は具合に関係なく、いつも眠そう）' },

    // R fix: V2 + K6 (blind 70 %): "Exactly" was an absolute only in a distractor. Choices rebalanced.
    // why: counted ← the number taken at face value; a million dollars ← charities and money go together
    { id: 'i1', skill: 'infer', level: 'B2', point: 'million', seg: [36.6, 43.55],
      stem: 'When Ben says how many applications there are, what does he mean?',
      choices: ['More than he can get through on his own', 'Close to a million, as he has counted',
                'A million dollars in grant requests'], a: 0,
      cue: '「by tomorrow」のあと、数と最後の頼み。',
      line: 'by tomorrow and *there’s a million applications*.',
      said: '「明日までに選ばないといけないのに、応募が山ほどある」と言う。',
      mean: 'a million ＝ ものすごくたくさん。正確な数ではなく、手が足りないという大げさな言い方。',
      trap: '数字を文字どおり取りやすい。会話の a million は「山ほど」。',
      use: 'I have a million things to do.（やることが山ほどある）' },

    // R fix: V2 + K4 (blind 50 %): "It was" doesn't fit "Come on, let's help him", so it's cut.
    // why: It's ← the 'll is swallowed; It'd ← the l and d both sound like a quick tap
    { id: 's1', skill: 'sound', level: 'B2', point: 'itll', seg: [45.75, 49.35],
      stem: 'Fill the gap: “Come on, let’s help him. ___ fun.”',
      choices: ['It’s', 'It’ll be', 'It’d be'], a: 1,
      cue: 'him のあと、fun の前の短い音。',
      line: 'Come on, let’s help him. *It’ll be* fun.',
      said: '「ほら、手伝ってあげよう。楽しいよ」とアンディを誘う。',
      mean: 'It’ll be が「イドゥビ」のように短くなる。これからのことを言う形。',
      trap: 'll はほぼ聞こえず It’s に聞こえやすい。be の音が残れば It’ll be。',
      use: 'Come with us. It’ll be fun.（一緒に行こう。楽しいよ）' },

    // R fix: V2 + K5 (blind 55 %): "praising" was weak. Now three "Offering…" moves, two on readings of "covered".
    // why: costs ← cover = 払う (cover the bill); share of work ← "got it covered" heard as "I'll cover it"
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'covered', seg: [49.35, 55.65],
      stem: 'When the others agree to help, what is Tom doing?',
      choices: ['Offering an excuse to get out of helping', 'Offering to pay for part of the costs',
                'Offering to take on a share of the work'], a: 0,
      cue: '「sounds like」のあとと、「I’m gonna」の続き。',
      line: 'Well, it sounds like *you guys got it covered*. I’m gonna *head out*',
      said: '「君たちで大丈夫そうだね。じゃあ帰るよ、自分の慈善活動があるから」と言う。',
      mean: 'got it covered ＝ もう任せて大丈夫。手伝わずに帰るための口実。',
      trap: 'cover を「費用を払う」と取りやすい。後ろの head out が本当の目的。',
      use: 'Sounds like you’ve got it covered.（もう大丈夫そうだね）' },

    // R fix: V2 (blind 55 %): "a ride" was weak. Three "A share of…" offers now.
    // why: money ← Tom has just named his own "foundation"; credit ← the pick is the task in hand
    { id: 'd4', skill: 'detail', level: 'B1', point: 'lunch', seg: [55.65, 61.45],
      stem: 'What does Ben offer to get Tom to stay?',
      choices: ['A share of the fancy lunches', 'A share of the foundation’s money', 'A share of the credit for the pick'], a: 0,
      cue: '「they bring me」のあと。',
      line: 'they bring me *fancy lunches* here. If you stay, you can have some.',
      said: '「ここは豪華なランチが出る。残るなら食べていいよ」と言う。',
      mean: 'fancy ＝ 高級な、しゃれた。食べ物で引き止めている。',
      trap: '財団の話が続くので、お金の話と取りやすい。have some は食べ物の話。',
      use: 'Stay for dinner. You can have some.（夕飯食べていきなよ）' },

    // R fix: V2 (blind 65 %): the key was the only choice that sounded like a joke. Three parallel "His charity…".
    // why: hungry kids ← "Tummy" missed (captions hear "Dummy" at 54 s), so a real food charity; Ben's money ←
    //   "donation" + "foundation" heard as cash
    { id: 'h3', skill: 'humor', level: 'C1', point: 'tummy', reveals: ['lunch'], seg: [55.65, 66.9],
      stem: 'What is the joke when Tom accepts a “generous donation”?',
      choices: ['His “charity” is his own stomach', 'His “charity” feeds hungry kids',
                'His “charity” gets money from Ben'], a: 0,
      cue: '財団の名前と、受け取っている物。',
      line: 'On behalf of *Tommy’s Tummy Foundation*, I’m happy to accept this generous donation.',
      said: 'ランチを見て「トミーのおなか財団を代表して、寛大な寄付を受け取ります」と言う。',
      mean: 'tummy ＝ おなか。慈善団体の決まり文句で、自分が食べることを言っている。',
      trap: 'donation から本物の寄付に思えるが、財団の名前が答え。おなかを満たすだけ。',
      use: 'On behalf of all of us, thank you.（皆を代表して、ありがとう）' },

    // R fix: V2 (blind 65 %): "Ben never reads things later" was weak and the key's form differed. Three "To…" aims.
    // why: deadline ← "by tomorrow" was Ben's worry; lost in the pile ← "a million applications" + "put it aside"
    { id: 'i2', skill: 'infer', level: 'C1', point: 'rightnow', seg: [70, 80.35],
      stem: 'When Ben tries to read Andy’s find later, why does someone insist on now?',
      choices: ['To let Andy have his moment to shine', 'To get it decided before tomorrow',
                'To keep it from getting lost in the pile'], a: 0,
      cue: '「No,」のあと、誰が見つけたかの強調。',
      line: '*No, Andy found it* and he’s gonna tell you about it *right now*. Go, babe.',
      said: 'ベンが「あとで読む」と言うと、「アンディが見つけたの。今話すから。ほら」と押し返す。',
      mean: 'Andy found it を強調し、落ちこんだアンディに出番を作っている。',
      trap: '締め切りの話は前に出たが、ここで強調されているのは誰が見つけたか。',
      use: 'She found it, so let her tell you.（彼女が見つけたんだから、話させてあげて）' },

    // why: festival ← "music" + "at-risk" heard as families; summer camp ← "keep them off the street" heard as a
    //   holiday program
    { id: 'd5', skill: 'detail', level: 'B1', point: 'redwood', seg: [80.35, 89.25],
      stem: 'What is the program Andy found?',
      choices: ['An after-school music class for kids', 'A music festival for families in need',
                'A summer music camp for older teens'], a: 0,
      // R fix: S3: the cue's "an" was a word only the key had.
      cue: '「It’s」のあとの説明。',
      line: 'It’s an *after-school music class for at-risk kids*.',
      said: '「困難を抱えた子ども向けの、放課後の音楽クラス」と説明する。',
      mean: 'after-school ＝ 放課後の、at-risk ＝ 困った状況に陥りやすい。',
      trap: 'music だけ聞くと、フェスやキャンプも思い浮かぶ。after-school が決め手。',
      use: 'Is there an after-school program here?（ここに放課後の教室はありますか）' },

    // R fix: V2 (blind 65 %): the stem named the sewer and the key was the only "He takes…". Now three dangers, and a
    //   near miss (traffic: the literal street, but not his example).
    // why: gangs and crime ← the idiom's usual sense, which a fluent listener assumes Andy means; traffic ← the street
    //   taken literally, but the wrong danger
    // anchor: 87.2–94.9 s "It'll keep them off the street. And the streets, as you know, are dangerous. Example, I fell
    //   in a sewer grate once. I was there all day.": his example of danger is the street surface
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'street', seg: [83.85, 95.45],
      stem: 'As Andy’s pitch goes on, what danger does “off the street” turn out to mean?',
      choices: ['Holes in the road', 'Gangs and crime', 'Cars and traffic'], a: 0,
      cue: '決まり文句のあとの、たとえ話の中身。',
      line: 'It’ll *keep them off the street*. … the streets, as you know, are dangerous. Example, *I fell in a sewer grate*',
      said: '「子どもを路上から遠ざける」と言い、「通りは危ない。僕は下水の格子に落ちた」と続ける。',
      mean: 'off the street ＝ 非行や犯罪から遠ざける。アンディは道そのものの危なさの話にしてしまう。',
      trap: '決まり文句だけ聞くと、ふつうの意味だと思いやすい。例が何の危険かを聞く。',
      use: 'Sports keep kids out of trouble.（スポーツは子どもを悪い道から守る）' },

    // R fix: V2 (blind 55 %): the key was the only choice about style. Rebalanced; "argues against" was weak.
    // why: name wrong ← "Redwood Music Program go" comes out garbled; after a yes ← "That's a great idea" heard as
    //   coming before the end
    { id: 'h4', skill: 'humor', level: 'C1', point: 'speech', seg: [89.25, 103.55],
      stem: 'What makes Andy’s pitch for the program funny?',
      choices: ['He dresses up a silly story with big speech words', 'He keeps pitching after Ben has already said yes',
                'He gets the program’s name wrong at the end'], a: 0,
      cue: '例のあとの「In conclusion」と、最後の2語。',
      line: 'Example, I fell in a sewer grate once… *In conclusion*… *Your Honor, amen*.',
      said: '「例えば下水の格子に落ちた。結論として…」と話し、最後に「裁判長、アーメン」で締める。',
      mean: 'スピーチ、法廷、お祈りの決まり文句を混ぜ、中身は自分の失敗談。形と中身の落差。',
      trap: '最後の崩れた一文を言いまちがいと取りやすい。形と中身の差を聞く。',
      use: 'In conclusion, let’s order pizza.（結論として、ピザを頼もう）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'across', seg: [102.9, 107],
      stem: 'Type Ben’s question: “Anyone else ___ anything good?” (2 words)', answer: 'come across',
      cue: '「Anyone else」のすぐあと。',
      line: 'Anyone else *come across* anything good?',
      said: '「ほかにいいのを見つけた人は？」と皆に聞く。',
      mean: 'come across ＝ たまたま見つける。文頭の Has が落ちた、くだけた聞き方。',
      trap: 'come の m と across がつながり「カマクロス」に近い。一語に聞こえても2語。',
      use: 'Did you come across my keys?（私の鍵、見かけなかった？）' },

    // R fix: V2 (blind 70 %): "cost" was world knowledge, not from the clip. Now the rhetorical question taken literally.
    // why: too far ← "far away from the hospital" is said, in the wrong relation; rarely save lives ← "When has an
    //   ambulance ever helped anyone?" taken as a real belief
    { id: 'i3', skill: 'infer', level: 'B2', point: 'ambulance', seg: [142.3, 152.65],
      stem: 'When Ben picks the ambulance charity, why does someone call ambulances dumb?',
      choices: ['To push for Andy’s idea instead', 'To say ambulances rarely save lives',
                'To say the homes are too far to reach'], a: 0,
      cue: '最後の「What about」の問い。',
      line: 'Ambulances are dumb. … *What about Andy’s music thing?*',
      said: '救急車の団体に決まりかけると「救急車なんてくだらない。アンディのは？」と言う。',
      mean: '救急車が本当に嫌いなのではない。最後の問いが本音で、アンディの案を推している。',
      trap: 'far away が聞こえるので距離の話に思える。What about が狙い。',
      use: 'What about the other option?（もう一つの案はどう？）' },

    // R fix: V2 (blind 75 %): "really" in the stem and the key's two-part form gave it away. All three are now "He
    //   says it's fine, …"; "angry" was weak.
    // why: glad ← "I'm happy for them… awesome" taken at face value; needs air ← his reason for leaving taken at face
    //   value
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'fine', seg: [155.5, 165.35],
      stem: 'How does Andy take the news that his idea lost?',
      choices: ['He says it’s fine, but he is hurt by it', 'He says it’s fine, and he is glad for them',
                'He says it’s fine, and he just needs air'], a: 0,
      cue: 'ほめ言葉のあと、急に何をすると言うか。',
      line: 'Why? No, … *totally fine*. I’m happy for them… I’m gonna *head out to the car*.',
      said: '「なんで謝るの？全然いいよ。よかったね」と言い、すぐ「車に行ってくる」と出ていく。',
      mean: '言葉は明るいが、すぐ席を外すのが本心。言い張るほど傷ついている。',
      trap: 'happy や awesome をそのまま取りやすい。言葉と行動が合わない時は行動を聞く。',
      use: 'No, it’s fine. Really.（いや、大丈夫。本当に）' },

    // R fix: V2 + K8 (blind 50 %): a scale without keep; "glad it went to doctors" was weak. Ascending, keep: true.
    // why: upset ← "terribly disappointed" taken at face value; sorry but sure ← "I'm sure… will be thrilled" taken
    //   at face value
    { id: 'a4', skill: 'attitude', level: 'B2', point: 'whatever', seg: [165.35, 178.4],
      stem: 'How much does the “terribly disappointed” speaker care about the result?',
      choices: ['Not at all: they didn’t even catch the pick', 'Somewhat: sorry, but sure it will do good',
                'A lot: upset that their own pick lost'], a: 0, keep: true,
      cue: 'doctors のあとの「or」の並びと、whatever の数。',
      line: 'the doctors *or giraffes or whatever you decided to help*…',
      said: '「すごくがっかりだけど、医者かキリンか、相手は喜ぶだろう」と言って帰る。',
      mean: 'whatever を3回並べ、決まった先も知らない。口先だけ。',
      trap: 'disappointed を本気と取りやすい。giraffes で聞いていなかったと分かる。',
      use: 'Pizza, tacos, whatever — I’m easy.（ピザでもタコスでも、何でもいいよ）' },

    // R fix: V2 (blind 65 %): "through lunch" was weak. Now "took the credit" (misreading "all about what you're doing").
    // why: called dumb ← "dumb" is said twice (ambulances, the charity); took the credit ← "it's all about what you're
    //   doing" heard as stealing Andy's idea
    { id: 'g2', skill: 'gist', level: 'B2', point: 'blame', reveals: ['rightnow', 'weeks'], seg: [176.3, 195],
      stem: 'Why is Ben told off at the end of the scene?',
      choices: ['He turned down Andy’s idea when Andy needed a lift', 'He picked a charity that the others called dumb',
                'He took the credit for Andy’s idea himself'], a: 0,
      cue: 'アンディの最近の様子と、選んだことの関係。',
      said: '試験に落ちて落ちこんでいたアンディが久しぶりに張り切っていたのに、とベンを責める。',
      mean: '支援先選びは、アンディを元気づけるチャンスだった。それを逃したことが責められている。',
      trap: '救急車を dumb と言った人もいたが、責めている理由はアンディの気持ち。',
      use: 'He really needed a win.（彼にはいいことが必要だった）' },

    // why: days ← the exam feels recent; months ← "ever since" sounds long
    { id: 'n2', skill: 'number', level: 'B1', point: 'weeks', seg: [180.75, 188.6],
      stem: 'Picking a charity is the most excited Andy has been in how long?',
      choices: ['Days', 'Weeks', 'Months'], a: 1, keep: true,
      cue: '「the most excited he’s been」のあと。',
      line: 'is the most excited he’s been *in weeks*.',
      said: '「つまらない支援先選びが、ここ何週間かで一番張り切ってたことなのに」と言う。',
      mean: 'in weeks ＝ ここ何週間も。それだけ長く元気がなかったということ。',
      trap: 'ever since から何か月も前の話に聞こえやすい。最後の一語を聞く。',
      use: 'That’s the best I’ve slept in weeks.（ここ何週間かで一番よく眠れた）' },

    // R fix: V2 (blind 65 %): "turn… around" in the stem pointed at the key. Neutral stem; "praise" became "a joke".
    // why: a joke ← "Classic Ben" heard as fond teasing; mocks the charity ← "a dumb charity" was said just before
    // anchor: 189.3–193.9 s "I'm running a charity." — "Oh, it's all about what you're doing, isn't it? Classic Ben.":
    //   his defence starts with "I'm", and the reply turns that into the proof
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'blame', seg: [184.1, 195],
      stem: 'What does the reply to “I’m running a charity” do with Ben’s defence?',
      choices: ['His own words become more proof he’s selfish', 'His words are waved off as a typical Ben joke',
                'His charity is mocked as a waste of everyone’s time'], a: 0,
      cue: 'ベンの言い返しの主語と、それへの返し。',
      line: 'Selfish? *I’m running a charity.* — Oh, *it’s all about what you’re doing*, isn’t it? Classic Ben.',
      said: '「自分勝手」に「慈善団体をやってる」と返すと、「結局自分のことばっかり。いつものベン」と言われる。',
      mean: '「僕は〜している」という弁解そのものを、自分中心の証拠に変える。classic ＝ いかにも。',
      trap: 'Classic Ben を冗談と取りやすい。返しは相手の言葉の形をつかんで使う。',
      use: 'See? It’s all about you again.（ほらね、また自分の話）' },
  ]
};
