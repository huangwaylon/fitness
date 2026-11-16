// REVIEW 2026-11-16: pass 7, fix 16, drop 1, new 0; ear checks 0
// “Nothing matters and I'm always tired | Parks and Recreation” (the official Parks and Recreation channel, Season 5):
// Ben needs his friends' help to pick his foundation's first charity; Andy, low since failing the police exam, finds a
// kids' music program that April pushes hard, Ben picks an ambulance service instead, and April calls him selfish.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈198.7 s. Untested: 0.5–3.6 s (who says
// "new digs"), 67–69.5 s (captions "come in", whisper "Ben? Ben?"), 107–137 s (Tom's pick: the joke rests on the KKK,
// left out; "you have to" vs "do you have to run that", "smoothies" vs "foodies"), 156.9–159 s ("Why? No, it's totally
// fine" is in whisper only), 164.3 s ("hot" vs captions "pot"; no key rests on it), 176.2 s ("I'm outie" vs captions
// "I'm Audi"), and 195.6–198.7 s (Tom's oysters).
import type { Clip } from '../types.ts';

export const charity: Clip = {
  id: 'charity', video: 'IxRBqX8riDo', title: 'Nothing matters and I\'m always tired', dur: 221, wpm: 147,
  band: 'slow', tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %): "apply for charity money" was a weak filler; now "give money to his charity". Seg start
    //   3.5 fell inside "This place is insane"; now 2.8
    // why: show off ← "check out the new digs… this place is insane" opens the scene; give money ← "charity" + "I need
    //   your help" heard as a donation request
    { id: 'g1', skill: 'gist', level: 'B1', point: 'task', seg: [2.8, 43.6],
      stem: 'Why has Ben asked the others to come to his office?',
      choices: ['He needs help choosing a charity to fund', 'He wants them to give money to his charity',
                'He wants to show them his new office'], a: 0,
      cue: '「super swamped」のあと、明日までに何をする？',
      line: '…*pick our first charity*… *Can you guys help me*…',
      said: '「忙しくて手伝いが要る」と言い、最初に支援する団体を選ぶ手伝いを頼む。',
      mean: 'charity ＝ 慈善団体。たくさんの応募から、お金を出す先を選ぶ仕事。',
      trap: '新しい事務所の話から始まるが、それは前置き。本題は need your help のあと。',
      use: 'I’m super swamped. Can you help?（手が回らないの、手伝って）' },

    // R fix: V2 (blind 55 %): "wants something handed over" was a filler; now the game sense (skip for now). The stem
    //   no longer names the speaker. Seg start 3.5 → 3.9 (clear of "insane")
    // why: go on ← in a meeting, "pass" heard as handing the turn back to Ben (話を回す); later ← "pass" as in a game,
    //   skipping a turn for now
    { id: 'p1', skill: 'phrase', level: 'B1', point: 'pass', seg: [3.9, 15.4],
      stem: 'When Ben asks for help, what does the one-word reply mean?',
      choices: ['She’s saying no to helping', 'She’s telling him to go on', 'She’s putting it off till later'], a: 0,
      cue: 'Ben の聞き返しと、そのあとの「when I said」。',

      line: '*Pass.* — You came down here to *pass on helping me*?',
      said: '「手伝って」に一言「パス」。Ben は「断るためにわざわざ来たの？」と聞き返す。',
      mean: 'pass ＝ 断る。pass on ～ で「〜を見送る」。',
      trap: 'ゲームの「パス（今回は飛ばす）」と取りやすい。誘いへの Pass は「やめとく」。',
      use: 'Dessert? I’ll pass, thanks.（デザート？ 遠慮しとく、ありがとう）' },

    // R fix: V2 (blind 85 %): the title ("Nothing matters and I'm always tired") plus "really" picked the key. Now
    //   "Tired: just not sleeping" takes the title's other half, and "really" is gone
    // why: tired ← "always tired" + "can't sleep" heard, "pointless… nothing matters" missed; dramatic ← the list is so
    //   long it sounds like a comic bit
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'fine', seg: [15.7, 26.3],
      stem: 'When asked if he’s okay, how is Andy doing?',
      choices: ['Badly: he’s down about everything', 'Tired: he just isn’t sleeping enough',
                'Fine: he’s being dramatic for a laugh'], a: 0,
      cue: '「I’m fine」のあとに続く文の数と中身。',
      line: 'I’m *fine*, it’s just that *life is pointless* and *nothing matters*…',
      said: '「大丈夫」のすぐあとに「人生に意味はない、何も大事じゃない」と並べる。',
      mean: '「大丈夫」と中身が正反対。平気なふりをしているが、かなり落ち込んでいる。',
      trap: 'fine と tired だけだと軽く聞こえる。it’s just that のあとが本題。',
      use: 'I’m fine, it’s just that I’m tired.（大丈夫、ちょっと疲れてるだけ）' },

    // why: sleeps all day ← "always tired" heard, "can't sleep" missed; new hobby ← "hobbies" heard, "none of my old"
    //   missed
    { id: 'd2', skill: 'detail', level: 'B1', point: 'symptoms', reveals: ['fine'], seg: [21.0, 26.3],
      stem: 'Which of these does Andy say about himself?',
      choices: ['He’s been eating too much', 'He sleeps most of the day', 'He’s found a new hobby'], a: 0,
      cue: '「Also」のあとの短い文を3つ。',
      line: 'Also, I *can’t sleep*, I’m *overeating*. None of my old hobbies interest me.',
      said: '「それに、眠れないし、食べすぎるし、昔の趣味も楽しくない」と付け足す。',
      mean: 'overeating ＝ 食べすぎ。眠れない、楽しめない、と元気のなさが並ぶ。',
      trap: 'tired で「よく寝る」と思いやすいが、can’t sleep と言っている。',
      use: 'I’ve been overeating lately.（最近食べすぎてる）' },

    // R fix: V2 (blind 60 %): "Past the worst" now states the 底を打つ trap outright; "mostly fine" replaces "only a little"
    // why: past the worst ← "hit rock bottom" heard as the Japanese 底を���つ (the worst is over); mostly fine ← "hit"
    //   heard as one knock to his pride
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'bottom', reveals: ['fine'], seg: [26.2, 31.7],
      stem: 'In the comment to the camera, how is Andy’s self-esteem now?',
      choices: ['At its lowest point', 'Past the worst and improving', 'Shaken, but mostly fine'], a: 0,
      cue: '「self-esteem has hit」のあとの2語。',
      line: 'Ever since Andy failed the police academy exam, his self-esteem has *hit rock bottom*.',
      said: '「警察学校の試験に落ちてから、Andy の自信はどん底」とカメラに話す。',
      mean: 'hit rock bottom ＝ 最低まで落ちる。今がいちばん悪い状態。',
      trap: '日本語の「底を打つ」は回復の始まりだが、英語は「どん底にいる」。上向きの意味はない。',
      use: 'My energy hit rock bottom today.（今日は元気がどん底）' },

    // why: new sign ← "always sad and sweaty" heard alone, as a list of symptoms; sweated less ← "usually happy" heard,
    //   the second "and sweaty" missed
    // R fix: V2 (blind 65 %): "sweaty" in the stem flagged the sweat as the point; the stem now names the moment only.
    //   Seg start 31.3 cut "bottom" (31.26); now 31.6
    { id: 'h1', skill: 'humor', level: 'C1', point: 'sweaty', reveals: ['fine'], seg: [31.6, 36.8],
      stem: 'Why does the second line of the comment to the camera get a laugh?',
      choices: ['Only his mood changed; the sweat is normal', 'The sweat is a new and worrying sign',
                'He used to be happier and sweat less'], a: 0,
      cue: '2つの文で、入れ替わった語と、同じままの語。',
      line: 'He’s *always sad and sweaty*. He’s *usually happy and sweaty*.',
      said: '「いつも悲しそうで汗だく」と言い、「普段は楽しそうで汗だく」と付け足す。',
      mean: '変わったのは気分だけで、汗は元から。深刻な話を落とす一言が笑い。',
      trap: '最初の文だけで汗を症状と取りやすい。同じ形の2文は、違う語と同じ語を比べる。',
      use: 'He’s usually late, so no change there.（彼はいつも遅れるから、そこは変わらない）' },

    // keep: ascending. why: tonight ← "to-" heard and the end guessed; next week ← "a million applications" makes the
    //   job sound long
    { id: 'n1', skill: 'number', level: 'B1', point: 'tomorrow', reveals: ['task'], seg: [36.8, 41.55], keep: true,
      stem: 'By when does Ben have to choose the charity?',
      choices: ['By tonight', 'By tomorrow', 'By next week'], a: 1,
      cue: '「first charity」のすぐあと、by のうしろ。',
      line: 'I have to pick our first charity *by tomorrow*…',
      said: '「明日までに最初の支援先を決めないと。応募は山ほど」と言う。',
      mean: 'by ＝ 〜までに（期限）。a million は「すごく多い」という大げさな言い方。',
      trap: 'today, tonight, tomorrow は出だしが同じ。最後まで聞いて決める。',
      use: 'I need it by tomorrow.（明日までに必要です）' },

    // why: sort it ← the weak "them" (≈ əm) heard as "it", and "sort it out" is a common chunk; sort him ← "'em" heard as
    //   "'im" with the h dropped
    { id: 's1', skill: 'sound', level: 'B2', point: 'sort', reveals: ['task'], seg: [39.9, 43.6],
      stem: 'Fill the gap: “Can you guys help me ___ out?”',
      choices: ['sort them', 'sort it', 'sort him'], a: 0,
      cue: 'help me のあと。何を整理するのか。',
      line: 'Can you guys help me *sort them* out?',
      said: '山ほどある応募を「整理するのを手伝ってくれる？」と頼む。',
      mean: 'them は弱く「ム」だけ（’em）になり、sort とつながって「ソーテム」に近い。',
      trap: 'sort it out は決まり文句なので it と聞きやすい。何を指すか（応募の山）で決める。',
      use: 'Can you help me sort these out?（これの整理を手伝って）' },

    // R fix: V2 (blind 55 %): "get started right away" was a filler; now "start; he'll join later" (head out heard as
    //   a short break)
    // why: already done ← "got it covered" heard as "the job is finished"; join later ← "head out" heard as stepping
    //   out for a bit
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'covered', seg: [48.0, 55.5],
      stem: 'After April agrees to help, what is Tom telling the others?',
      choices: ['They can handle it all without him', 'They’ve already finished the job',
                'They should start; he��ll join later'], a: 0,
      cue: '「sounds like you guys」のあと、そして I’m gonna。',
      line: 'Well, it sounds like *you guys got it covered*. I’m gonna *head out*…',
      said: '「君たちで何とかなりそうだね。僕は失礼するよ」と、手伝わずに帰ろうとする。',
      mean: 'have it covered ＝ 任せて大丈夫。抜けるための言い訳。',
      trap: 'covered を「終わった」と取りやすい。すぐあとの head out で抜ける話と分かる。',
      use: 'Don’t worry, I’ve got it covered.（心配しないで、こっちでやっとく）' },

    // R fix: V2 (blind 65 %): "just then" pointed at Tom leaving; "spends too much" replaced by showing off (the scene
    //   opens on the new office). Seg start 54.9 cut "Tummy"; now 53.8
    // why: lunch later ← "lunches" + "you can have some" heard as an invitation out; show off ← "check out the new
    //   digs" opens the scene, so fancy lunches sound like more bragging
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'lunch', seg: [53.8, 59.5],
      stem: 'Why does Ben bring up the fancy lunches?',
      choices: ['To get Tom to stay and help out', 'To invite Tom out for lunch later', 'To show off the perks of his job'],
      a: 0,
      cue: '「Well」のあと、If で始まる条件。',
      line: 'they bring me *fancy lunches* here. *If you stay*, you can have some.',
      said: '帰ろうとする Tom に「ここ、豪華なランチが出るんだ。残るなら食べていいよ」と言う。',
      mean: '条件つきの誘いで引き止めている。食べ物に弱い Tom への作戦。',
      trap: 'lunch で「食事に誘う」と取りやすい。If you stay が付くと交換条件になる。',
      use: 'If you stay, I’ll buy you dinner.（残ってくれたら夕飯おごるよ）' },

    // R fix: V2 (blind 60 %): parallel "He treats…" choices, so the giver/receiver flip decides. Seg start 58.2 cut
    //   "can"; now 57.42
    // why: gives away ← "donation" heard as Tom donating, "accept" missed; mocks ← "Tommy's Tummy Foundation" heard as a
    //   jab at Ben's charity work
    { id: 'h2', skill: 'humor', level: 'C1', point: 'tummy', reveals: ['lunch'], seg: [57.42, 66.3],
      stem: 'When Tom stays for the food, why is his last line funny?',
      choices: ['He treats free lunch as a gift to his own charity', 'He treats his lunch as a gift to Ben’s charity',
                'He treats Ben’s charity work as a joke about food'], a: 0,
      cue: '「On behalf of」で始まる、かしこまった言い方。',
      line: '*On behalf of* Tommy’s Tummy Foundation, I’m happy to *accept this generous donation*.',
      said: '料理を見て「トミーのおなか財団を代表し、このご寄付をお受けします」と言う。',
      mean: '自分のおなかを慈善団体に見立て、ランチを「寄付」と呼ぶ。式典の言い方とのずれが笑い。',
      trap: 'donation で Tom が寄付すると取りやすい。accept（受け取る）側。',
      use: 'On behalf of the team, thank you.（チームを代表して、ありがとう）' },

    // R fix: V2 (blind 65 %) and K2: nothing had "been picked" yet, a filler. Now the near sound "I've read it"
    // why: right away ← "I'll read it" heard as a real plan; already read ← "I'll read it" heard as "I've read it"
    //   (read /red/), the weak 'll lost
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'later', seg: [69.9, 76.6],
      stem: 'When Andy says he found something cool, what is Ben’s reply doing?',
      choices: ['Putting it off without saying no', 'Promising to read it right away',
                'Saying he has already read it'], a: 0,
      cue: '「Okay」のあと、aside と later。',
      line: 'Okay, we’ll just *put it aside* and I’ll *read it later*.',
      said: 'Andy の「いいのを見つけたかも」に「置いといて、あとで読むよ」と返す。',
      mean: '「あとで」は、今は聞かないという軽いかわし方。断らずに後回し。',
      trap: 'I’ll read it を約束と取りやすい。just と later が並ぶと、たいてい後回し。',
      use: 'Let’s put that aside for now.（それはいったん置いておこう）' },

    // R fix: V2 (blind 65 %): the key was the only kind choice; "Ben brushing her off" (wrong target) is now the near miss
    // why: over fast ← "right now" heard as impatience (she said "Pass" at the start); brushing her off ← she cuts in
    //   right after Ben's "put it aside", so it sounds like her own grievance
    { id: 'i1', skill: 'infer', level: 'B2', point: 'push', reveals: ['fine'], seg: [76.2, 80.6],
      stem: 'Why does April insist Andy present his idea right now?',
      choices: ['She wants Andy to have his moment', 'She wants the meeting over with fast',
                'She wants Ben to stop brushing her off'], a: 0,
      cue: '見つけたのは誰か、と最後の「Go, babe」。',
      line: 'No, *Andy found it* and he’s gonna tell you about it *right now*. *Go, babe.*',
      said: '「見つけたのは Andy。今ここで説明するの。さあ」と背中を押す。',
      mean: '落ち込んでいる Andy に、活躍の場をつくっている。最初は断っていたのに本気。',
      trap: 'right now を「早く済ませたい」と取りやすい。Go, babe は応援の言葉。',
      use: 'Go on, tell them your idea.（ほら、アイデアを話して）' },

    // why: concerts ← "music" + "program" heard as a show; summer camp ← "after-school" heard as "after school ends"
    //   (vacation)
    { id: 'd3', skill: 'detail', level: 'B1', point: 'redwood', seg: [80.5, 89.2],
      stem: 'What does the Redwood Music Program do?',
      choices: ['Teaches music to kids after school', 'Puts on concerts to raise school money',
                'Runs a summer music camp for kids'], a: 0,
      cue: '「It’s an」で始まる説明の文。',
      line: 'It’s an *after-school music class* for at-risk kids.',
      said: '「放課後の音楽教室で、心配のある子ども向け」と説明する。',
      mean: 'after-school ＝ 放課後の。at-risk kids ＝ 非行が心配な子ども。',
      trap: 'after school を「学校が終わったあと（休み）」と取りやすいが、毎日の授業のあと。',
      use: 'She goes to an after-school class.（彼女は放課後の教室に通っている）' },

    // R fix: V2 (blind 55 %): the key was the only specific choice; a near miss on the same mechanism (a wedding toast,
    //   "Your Honor" missed) now sits beside it
    // why: wedding toast ← "amen" and a grand closing heard as a ceremony, "Your Honor" missed; mocking ← the big
    //   ending heard as a parody aimed at Ben's meeting
    { id: 'h3', skill: 'humor', level: 'C1', point: 'amen', seg: [89.0, 103.2],
      stem: 'Why does the end of Andy’s pitch get a laugh?',
      choices: ['He ends with a courtroom phrase and a prayer word', 'He ends with a wedding-toast phrase and a prayer word',
                'He ends by mocking how formal the meeting is'], a: 0,
      cue: '最後の2語。どんな場面で使う言葉？',
      line: 'In conclusion, we cannot let our children *live in the sewer* any longer… *Your Honor, amen.*',
      said: '「子どもを下水に住まわせてはならない」と締め、「裁判長、アーメン」で終える。',
      mean: '法廷の Your Honor と祈りの amen を混ぜた締め。話もどんどん大きくなる。',
      trap: '大げさなのでからかいと取りやすいが本人は大まじめ。決め言葉の場違いさが笑い。',
      use: 'In conclusion, let’s order pizza.（結論として、ピザを頼もう）' },

    // why: build ← "rural" + "hospital" heard as a new hospital; train drivers ← "AmbuCare" heard as a care service
    // R fix: V2 (blind 60 %): the name "AmbuCare" in the stem gave away "ambulance"
    { id: 'd4', skill: 'detail', level: 'B1', point: 'ambulance', seg: [139.8, 148.32],
      stem: 'What does Ben’s winning charity want to do?',
      choices: ['Buy an ambulance for people far from a hospital', 'Build a hospital closer to people in the country',
                'Train drivers to take people to the hospital'], a: 0,
      cue: '「It’s called」のあと、They want to のうしろ。',
      line: 'They want to *buy an ambulance* for people who *live far away from the hospital*.',
      said: '「ルーラル・アンビュケア。病院から遠くに住む人のために救急車を買いたい」と読む。',
      mean: 'rural ＝ いなかの。病院が遠い地域に救急車を、という申請。',
      trap: 'rural と hospital から「病院を建てる」と取りやすい。動詞は buy（買う）。',
      use: 'I live far away from the station.（駅から遠くに住んでいます）' },

    // R fix: V2 (blind 75 %): "suddenly" cued a hidden motive; "a bad ride" replaced by the sincerity flip
    // why: never help ← "When has an ambulance ever helped anyone?" taken as her real view (the literal reading); not
    //   far ← "far away from the hospital" turned around
    { id: 'i2', skill: 'infer', level: 'B2', point: 'dumb', reveals: ['music'], seg: [147.85, 152.5],
      stem: 'Why does April say ambulances are useless?',
      choices: ['She wants Andy’s idea chosen instead', 'She truly thinks they never help anyone', 'She thinks the hospital isn’t that far'], a: 0,
      cue: 'すぐあとの「What about」で始まる質問。',
      line: '*Ambulances are dumb.* When has an ambulance ever helped anyone? *What about Andy’s music thing?*',
      said: '「救急車なんてくだらない。誰か助けたことある？ Andy の音楽のは？」と言う。',
      mean: 'むちゃくちゃな理屈で、Andy の案に話を戻したい。目的は最後の質問。',
      trap: '強い言い方なので本気の意見と取りやすい。What about ～? で本当の話題が出る。',
      use: 'What about my idea?（私の案はどう？）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'music', seg: [149.75, 152.5],
      stem: 'Type April’s question: “___ Andy’s music thing?” (2 words)', answer: 'what about',
      cue: '「helped anyone?」のすぐあと、短い2語。',
      line: '*What about* Andy’s music thing?',
      said: '「Andy の音楽のやつはどうなの？」と、別の案を持ち出す。',
      mean: 'What about ～? ＝「〜はどう？」と別の案を出す形。',
      trap: 'what の t が弾んで「ラ」に近くなり、about とつながる。一語に聞こえたら what about を疑う。',
      use: 'What about Friday instead?（代わりに金曜はどう？）' },

    // R fix: V2 (blind 75 %): "really" plus the only two-sided choice. Now two "Let down" choices (hiding it / openly
    //   sulking) and the literal "too hot" reading
    // why: sulking ← leaving the room right after "Sorry, Andy" heard as storming out; too hot ← "hot in here, a
    //   little sweaty" taken at face value (whisper "hot", captions "pot"; "sweaty" in both)
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'happy', seg: [155.0, 165.3],
      stem: 'After Ben says “Sorry, Andy”, how does Andy feel about losing?',
      choices: ['Let down, but trying hard to hide it', 'Let down, and openly sulking about it',
                'Fine, just too hot to stay in the room'], a: 0,
      cue: 'ほめ言葉のあと、急に何をすると言うか。',
      line: 'I’m *happy for them*. It’s awesome… I’m gonna *head out to the car*.',
      said: '「彼らのためにうれしい、最高だよ」と言い、すぐ「車に行ってくる」と出ていく。',
      mean: '口ではほめても、すぐその場を離れる。がっかりした顔を見せたくない。',
      trap: '言葉だけだと本当に喜んでいるように聞こえる。言ったあとの行動まで聞く。',
      use: 'No, really, I’m happy for you.（いや、本当によかったね）' },

    // R drop: c1 (C2 "what is he trying not to say"), V2 + S4 + V3. Blind 75 %; its anchor (April's "really
    //   depressed", 183 s) lies outside the seg; it repeats a2's key (hurt but hiding it) one step lower; and the stem's
    //   "blames the heat" rests on "hot", which the captions hear as "pot". Deleted (never shipped).

    // R fix: K1: "doesn't care who won" clashes with her "terribly disappointed"; the key is now about the winner.
    //   "real" left the stem; seg start 165.0 cut "sweaty", now 165.25
    // why: polite ← "terribly disappointed, but I'm sure… will be thrilled" is the polite loser's frame; confused ←
    //   "whatever you decided" heard as her not knowing the winner
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'giraffes', seg: [165.25, 178.4],
      stem: 'In April’s speech after the vote, what is her attitude?',
      choices: ['Scornful: she makes light of the winner', 'Polite: she accepts the choice gracefully',
                'Confused: she didn’t catch who won'], a: 0,
      cue: '「doctors or」のあとの、ありえない組み合わせ。',
      line: 'I’m sure the *doctors or giraffes or whatever* you decided to help will be thrilled…',
      said: '「とてもがっかり。でも医者だかキリンだか、選んだ何かは大喜びでしょうね」と言って去る。',
      mean: 'giraffes はわざとのでたらめで、「どうでもいい」という皮肉。',
      trap: 'disappointed, but… は丁寧な型に聞こえる。中身がでたらめなら皮肉。',
      use: 'Whatever you decide is fine.（どれに決めてもいいよ）' },

    // C2: exact words in fast speech (cf. a3)
    // anchor: 173.52–175.8 s "with the whatever you decided to whatever" in both sources: "whatever" twice, where a
    //   noun and a verb belong, at ≈160 wpm with every small word weak
    // retired: one C2 alone is under 2 (c2 retired)
    { id: 'c3', skill: 'dict', level: 'C2', point: 'giraffes', seg: [172.6, 175.9], retired: true,
      stem: 'Type the end: “…will be thrilled with the ___.” (5 words)', answer: 'whatever you decided to whatever',
      cue: 'thrilled with the のあと。文法より聞こえた語を。',
      line: '…will be thrilled with the *whatever you decided to whatever*.',
      said: '「選んだ何かを何かするのを喜ぶでしょう」。名詞と動詞の場所に whatever が入る。',
      mean: '名詞や動詞を whatever で置きかえ、「中身は知らない」と示す。文法を崩すこと自体が皮肉。',
      trap: '文法に合わせて最後を help などに直したくなる。わざと崩した言葉は、崩れたまま書く。',
      use: 'Bring whatever, I don’t care.（何でもいいよ、持ってきて）' },

    // R fix: V2 (blind 60 %): "without paying them" was a filler; now "kept the credit" ("all about what you're
    //   doing"). C5: its notes say Andy has been depressed, so it now also reveals `fine` and `bottom`
    // why: without asking ← "it's all about what you're doing" heard as him deciding alone (they were there to help);
    //   credit ← "all about what you're doing" heard as him taking the glory
    { id: 'g2', skill: 'gist', level: 'B2', point: 'selfish', reveals: ['happy', 'fine', 'bottom'], seg: [179.5, 195.4],
      stem: 'Why does April call Ben selfish at the end?',
      choices: ['He didn’t think about what it meant to Andy', 'He made the choice without asking anyone else',
                'He wanted all the credit for himself'], a: 0,

      cue: '「Ever since」で始まる説明と、most excited。',
      line: 'Picking out a dumb charity is *the most excited he’s been*… *You’re so selfish.*',
      said: '「試験に落ちてから Andy はずっと落ち込んでた。団体選びは久しぶりに楽しそうだった」と言う。',
      mean: '正しい選択より、Andy を元気づけてほしかった。',
      trap: 'selfish を「自分だけ得をする」と取りやすい。ここは「人の気持ちを見ていない」。',
      use: 'It’s not always about you.（いつもあなた中心じゃないの）' },

    // C2: a plain-English paraphrase (cf. g2)
    // anchor: 188.42–194.3 s "Selfish? I'm running a charity." is answered by "it's all about what you're doing, isn't
    //   it?": the charity work itself is what she calls selfish
    // why: generous ← "I'm running a charity" taken as the point she grants ("classic" heard as praise: the sincerity
    //   flip); takes on too much ← "super swamped" at the start, and "what you're doing" heard as his workload
    // retired: for the draws (play 3+ under a gist drew no C2): it shares g2’s point
    { id: 'c2', skill: 'infer', level: 'C2', point: 'selfish', seg: [186.8, 194.4], retired: true,
      stem: 'Which plain-English version keeps what April means by “Classic Ben”?',
      choices: ['“Your work always comes before your people.”', '“You’re always so generous; that’s so you.”',
                '“You always take on more than you can do.”'], a: 0,
      cue: '「it’s all about」のあと、何についての話か。',
      line: 'Selfish? *I’m running a charity.* — Oh, *it’s all about what you’re doing*, isn’t it? *Classic Ben.*',
      said: '「慈善活動をしてるのに？」に、「結局、自分のしてることばかり。いつもの Ben」と返す。',
      mean: 'classic ＋名前 ＝「いかにもその人らしい（悪い癖）」。人助けの仕事すら、その例にされる。',
      trap: 'charity に引かれて、ほめ言葉と取りやすい。classic ＋名前はあきれた口ぶり。',
      use: 'Late again? Classic Tom.（また遅刻？ いかにもトムだね）' },
  ]
};
