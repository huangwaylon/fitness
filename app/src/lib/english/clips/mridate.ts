// REVIEW 2026-11-16: pass 8, fix 14, drop 0, new 0; ear checks 0
// Q: n2 ($200 / $2,000 / $20,000) is guessable from US MRI prices; kept, since the learners are unlikely to know them.
// “Leslie's MRI Blind Date | Parks and Recreation” (the official Parks and Recreation channel, Season 2): Ann sets
// Leslie up with Chris, an MRI technician; the dinner stalls (rival schools, "amusement parks", a candle trick), then
// he gives her a free scan and keeps chatting to her inside the machine.
// Segments from the captions, words from whisper (2026-11-16). Untested: 37.8–40 s (whisper “I wish she'd told me…”,
// captions “I don't know what she told me…”), 21–25 s (the “Badgers / Hoosiers” cheers: who says which is unclear),
// 162–171 s (the period question) and 213–231 s (the “great oven / triplets” remarks), left out as personal-body
// talk.
// EAR CHECK: none open (pr1 no longer names a speaker; every key's words agree in both sources).
import type { Clip } from '../types.ts';

export const mriBlindDate: Clip = {
  id: 'mridate', video: 'ObHQhpSqLO4', title: 'Leslie’s MRI Blind Date', dur: 252, wpm: 143, band: 'slow',
  tags: ['恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind-guessable (the "late" filler was refuted at once); now a one-slip near miss
    // why: relaxed later ← "isn't it funny how these setups…" heard as a laugh that clears the air; one slip ← only the
    //   "amusement parks" mix-up is noticed, the school clash (Boo) missed
    { id: 'g1', skill: 'gist', level: 'B2', point: 'date', reveals: ['strike', 'awkward'], seg: [0, 57.5],
      stem: 'How is the date going before the candle trick?',
      choices: ['Awkwardly, and each topic makes it a bit worse', 'Awkwardly at first, then more and more relaxed',
                'Smoothly, until one topic suddenly goes wrong'], a: 0,
      cue: '学校、仕事の話のたびに、空気がどうなるか。',
      said: '遅刻は「気にしないで」で済むが、出身校の話も仕事の話もかみ合わない。',
      mean: '話題を変えるたびに小さなずれが重なり、最後は「お見合いって気まずいね」と口に出す。',
      trap: '最初のほめ言葉で好調に見えるが、本題はそのあと。場面は出だしより流れで聞く。',
      use: 'Well, this is a little awkward.（ええと、ちょっと気まずいね）' },

    // why: agrees ← "heard that" taken as "I've heard that too" (Ann's praise); knew of her ← "heard" next to "Ann"
    //   read as "I heard about you from Ann"
    { id: 'i1', skill: 'infer', level: 'B2', point: 'heard', seg: [11.6, 17.0],
      stem: 'Right after “Well done, Ann,” what does the reply show?',
      choices: ['The comment was meant to be private', 'He agrees with what Ann told her', 'Ann had already told him about her'], a: 0,
      cue: '小声の一言のあと、短い返事と「What?」。',
      line: 'Well done, Ann. — I *actually heard that*. — What?',
      said: '小声で「アン、よくやった」と言うと、「今の、聞こえたよ」と返される。',
      mean: '心の中の感想のつもりが本人に届いていた。What? はごまかし。',
      trap: 'heard を「うわさに聞いた」と取ると別の話になる。that は直前の一言。',
      use: 'Oops, did I say that out loud?（あ、声に出てた？）' },

    // why: Indiana ← the other school named a few seconds later; split ← "undergrad and grad" heard as two places
    { id: 'd1', skill: 'detail', level: 'B1', point: 'school', seg: [17.0, 21.3],
      stem: 'Where did her date go to school?',
      choices: ['Wisconsin, for college and grad school', 'Indiana, for college and grad school',
                'Wisconsin, then Indiana for grad school'], a: 0,
      cue: '大学の名前のあと、for both に続く部分。',
      line: 'I went to *Wisconsin for both undergrad and grad school*.',
      said: '「学部も大学院もウィスコンシン」と言う。',
      mean: 'undergrad ＝ 学部、grad school ＝ 大学院。for both で両方同じ大学。',
      trap: 'すぐあとに Indiana も聞こえるので混ざりやすい。both は「2つとも同じ」の合図。',
      use: 'I did both degrees at the same school.（学部も院も同じ大学です）' },

    // R fix: V2 (the key was the only kind choice) + who: by turn-taking "not important… Ann kept going on about you"
    //   reads as his turn, not Leslie's, so the stem no longer names a speaker and the ear check is gone
    // why: no interest ← "not important" read literally as "sports don't matter"; a problem ← the Boo read as a real
    //   rift that the next line flags
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'notimp', seg: [20.9, 32.0],
      stem: 'After the “Badgers” back-and-forth, what does the next line do?',
      choices: ['It drops the clash and turns to a nicer subject', 'It admits that college sports don’t matter much',
                'It hints the rivalry could be a problem for them'], a: 0,
      cue: '「not important」のあと、何の話に移るか。',
      line: '…*not important*. *I’m just glad* that we could make this happen.',
      said: '大学の応援で気まずくなると「それはいいよ。会えてうれしい」と話を変える。',
      mean: '気まずい話を軽く流し、前向きな話題に切り替える働き。',
      trap: 'not important を「興味がない」と文字通り取りやすい。直後に何を話すかで働きが分かる。',
      use: 'Anyway, that’s not important. How are you?（まあそれはいいとして、元気？）' },

    // R fix: V2 + K6, the key was the only hedged choice ("gently") and "about to agree" was a filler
    // why: adds ← katakana アクチュアリー heard as "in fact, even better"; confirms ← actually = 実際 (indeed), after
    //   "Oh, that's exciting" sets up a yes in the Japanese frame (そうなんです)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', seg: [40.5, 48.4],
      stem: 'When he mentions her job, what does the first word of her reply do?',
      choices: ['It corrects what he has just assumed', 'It adds an even more exciting detail', 'It confirms what he has just guessed'], a: 0,
      cue: '「that’s exciting」の直後、文頭の短い一語。',
      line: '…amusement parks, right? Oh, that’s exciting. — *Actually*, it’s regular parks.',
      said: '「遊園地の担当でしょ？すごいね」に、「実は普通の公園。ブランコとか」と返す。',
      mean: 'Actually は、相手の思い込みをやわらかく直す前置き。',
      trap: 'カタカナの「アクチュアリー」から強調と思いやすいが、相手の言葉への返事なら訂正の合図。',
      use: 'Actually, I’m from Ohio, not Iowa.（実はアイオワじゃなくてオハイオです）' },

    // why: in his favor ← katakana ストライク (bowling: a great shot); second ask ← "two" heard as counting his
    //   questions about her job
    // R fix: V2/S1, "mix-up" in the stem told the blind reader the comment was negative
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'strike', seg: [40.5, 50.5],
      stem: 'Right after the talk about her job, what does the two-word comment mean?',
      choices: ['That’s the second thing to go wrong', 'That’s a second point in his favor', 'That’s the second time he has asked'], a: 0,
      cue: '短い一言のあと、空気が良くなったか悪くなったか。',
      line: '…like swings and slides and stuff. — *Strike two*.',
      said: '仕事の話がずれたあと、「ストライク2つ目」とつぶやく。',
      mean: '野球の三振から。だめな点がもう2つ目で、3つ目でアウト。1つ目は大学の件。',
      trap: 'ボウリングのストライクから「好調」と取りやすい。英語の strike は「だめ」の数え方。',
      use: 'That’s strike one for this hotel.（このホテル、まず減点1）' },

    // R fix: V2 + K6, the key was the only nuanced choice ("a little"); the distractors are now as reasonable
    // why: blaming the friend ← "setups" are Ann's doing, so the line sounds like a complaint about her; end now ←
    //   "awkward" taken as a hint to wrap up (refuted: he goes straight on to the candle trick)
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'awkward', seg: [51.0, 57.9],
      stem: 'When the talk stalls, what does “isn’t it funny how these setups…” do?',
      choices: ['It names the awkwardness to ease it', 'It blames the friend who set them up',
                'It hints that the date should end now'], a: 0,
      cue: '「funny」のあと、文の最後にくる形容詞。',
      line: 'isn’t it funny how these setups are always just *so awkward*?',
      said: '会話が止まると「お見合いって、いつも気まずいよね」と言う。',
      mean: '気まずさをあえて口にして、空気を軽くしている。funny は「楽しい」より「妙な」。',
      trap: 'funny から楽しんでいると取りやすい。この型は「妙だよね」。',
      use: 'Isn’t it funny how time flies?（時間が経つのって早いよね）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'internet', seg: [71.0, 76.8],
      stem: 'Type the end of “It looks so much ___.” (4 words)', answer: 'easier on the internet',
      cue: 'ろうそくの技のあと、「God」に続く文。',
      line: 'Oh, God, it looks so much *easier on the internet*.',
      said: '手をやけどして「ネットだとずっと簡単そうなのに」と言う。',
      mean: 'easier‿on‿the がつながり「イージアロンナ」。internet の t も弱い。',
      trap: 'on the が弱く、消えたように聞こえやすい。短い前置詞と冠詞も、ある前提で聞く。',
      use: 'It looked easier on YouTube.（YouTubeだと簡単そうだった）' },

    // R fix: V2, "go and" was easy to rule out; "better" has the same flap after I
    // why: had to ← a past "need", its d lost in the run; better ← "I better" also flaps (ベラー vs ガラ)
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotta', seg: [71.0, 76.8],
      stem: 'Fill the gap: “God, I ___ borrow some ice.”',
      choices: ['gotta', 'better', 'had to'], a: 0,
      cue: 'God のあと、とても速い短い音。',
      line: 'God, I *gotta* borrow some ice.',
      said: '「氷を借りてこなきゃ」と言う。',
      mean: 'gotta ＝ got to（have to）。t が弾んで「ガラ」に近くなる。今すぐ必要、という感じ。',
      trap: 'better も t が弾むが母音が「エ」。had to なら済んだ話。「ガラ」なら gotta。',
      use: 'I gotta go, sorry.（もう行かなきゃ、ごめん）' },

    // why: privacy ← a medical worker who won't discuss a patient; doctors read ← "I don't know" heard as "that's not
    //   my job"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'mother', reveals: ['hour'], seg: [83.6, 98.6],
      stem: 'Why does his “I don’t know” at the end of the story get a laugh?',
      choices: ['He made the patient up, so there’s no answer', 'He can’t talk about a real patient’s health',
                'Only the doctors, not he, read the results'], a: 0,
      cue: '話の始まり方と、最後の答えのずれ。',
      line: '*Imagine* a mother of three. *Maybe* she’s a teacher… — What’s wrong with her? — I don’t know.',
      said: '「3人の子の母親を想像して」と語り「1時間で分かる」と言うが、病名は「知らない」。',
      mean: 'Imagine と maybe で始めた作り話なので、答えはない。',
      trap: '医療の仕事から守秘義務と考えやすい。imagine で始まる話は実在しない例え。',
      use: 'Imagine you’re on a beach.（ビーチにいると想像して）' },

    // why: a minute ← "less than" heard, "an hour" lost; over an hour ← "less" missed, only "an hour" caught
    { id: 'n1', skill: 'number', level: 'B1', point: 'hour', seg: [92.6, 98.6],
      stem: 'How soon does he say he knows what is wrong?',
      choices: ['In less than a minute', 'In less than an hour', 'In a little over an hour'], a: 1, keep: true,
      cue: '「She’s scared」のあと、文の最初。',
      line: 'In *less than an hour*, I know what it is.',
      said: '「1時間もしないうちに、何の病気か分かる」と言う。',
      mean: 'less than an hour ＝ 1時間未満。than an がつながって聞こえる。',
      trap: 'less を聞き落とすと「1時間ちょっと」と取りやすい。数の前の less、more を先に聞く。',
      use: 'It takes less than an hour by train.（電車で1時間かからない）' },

    // why: wants a demo ← "if you look inside this bread" heard as asking him to; impressed ← her "Wow" a few seconds
    //   earlier
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'bread', seg: [110.7, 122.0],
      stem: 'When Leslie replies about the bread, how does she feel about his idea?',
      choices: ['She finds it a bit silly and teases it', 'She wants to see him try it on the bread',
                'She is impressed and plays along with it'], a: 0,
      cue: 'パンの中に何があると言うか、その当たり前さ。',
      line: 'if you look inside this bread, all you’re gonna find is *more bread*.',
      said: '「そのパンの中をのぞいても、出てくるのはパンだけ」と返す。',
      mean: '何でも中が見えると熱く語る相手に、当たり前のことを言って軽くからかっている。',
      trap: '少し前の Wow で感心していると取りやすいが、それは相づち。最後の返しで判断する。',
      use: 'Well, that’s one way to look at it.（まあ、そういう見方もあるね）' },

    // R fix: V2 + K6, the key was the only two-part, longest choice and "Ann asked" was a filler; all three now
    //   share one form (who starts it, and why)
    // why: her hand ← the candle burn and the ice a minute before; she asks ← "I've never even had an MRI" heard as
    //   a request (refuted: "I don't know about this")
    { id: 'g2', skill: 'gist', level: 'B1', point: 'scan', seg: [124.8, 143.8],
      stem: 'Why does Leslie end up getting an MRI scan?',
      choices: ['He offers, and she’s a bit curious', 'She asks, wanting to see what it’s like',
                'He insists, to check her burned hand'], a: 0,
      cue: '「never even had an MRI」のあとの流れ。',
      line: 'I’m offering you a *free scan*. … Well, I am a little *curious*.',
      said: 'MRI を受けたことがないと聞いて、彼が「無料で撮ってあげる」と言う。',
      mean: '迷いながらも「ちょっと興味ある」と受け、デートの流れで検査を受ける。',
      trap: '直前のやけどから手の検査と考えやすいが、手の話は出ない。',
      use: 'I’ve never tried it, but I’m curious.（やったことないけど興味ある）' },

    // why: $200 ← hundred/thousand, the ending weak; $20,000 ← "two" stretched into "twenty"
    { id: 'n2', skill: 'number', level: 'B1', point: 'cost', seg: [133.3, 138.6],
      stem: 'What does a scan usually cost, according to him?',
      choices: ['Up to $200', 'Up to $2,000', 'Up to $20,000'], a: 1, keep: true,
      cue: '「free scan」のあと、usually に続く数字。',
      line: 'Usually costs *up to two thousand dollars*.',
      said: '「ふつうは最高で2000ドルかかる」と言う。',
      mean: 'up to ＝ 最大で。無料で受けさせてあげる、という恩着せの前置き。',
      trap: 'hundred と thousand は語尾が弱いと混ざる。thousand は th の「サ」で始まる。',
      use: 'It costs up to fifty dollars.（最大で50ドルかかります）' },

    // R fix: V2, the key was the only kind reading; "showing off" (the price just said) replaces the money filler
    // why: ruin ← spoil = 台無し (a spoiler); showing off ← the price right before heard as bragging about his job
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'spoil', seg: [133.3, 140.8],
      stem: 'After he mentions the usual price, what does he say he’s doing?',
      choices: ['Treating her to something special', 'Ruining the surprise of the scan', 'Showing off how important his job is'], a: 0,
      cue: '「kind of」のあとの動詞。',
      line: 'I’m offering you a free scan… I’m kind of *spoiling you* here.',
      said: '「無料で撮ってあげる。君をちょっと甘やかしてるね」と言う。',
      mean: 'spoil someone ＝ 特別扱いする、甘やかす。恩着せがましい言い方。',
      trap: 'ネタバレの spoiler から「台無し」と取りやすい。spoil のあとに人が来たら「甘やかす」。',
      use: 'You’re spoiling me with all this food!（こんなにごちそうして、甘やかしすぎ！）' },

    // R fix: V2, "believes she has three months" was absurd before any scan; both distractors are now near misses
    // why: worried ← "three months to live" taken as a real fear about her; costing him ← "invest" heard as money,
    //   right after the price
    { id: 'i2', skill: 'infer', level: 'C1', point: 'invest', seg: [140.6, 148.6],
      stem: 'What does he mean by not wanting to “invest in someone”?',
      choices: ['The scan is partly a check on her health', 'He’s worried she may be seriously ill',
                'The free scan is costing him a lot'], a: 0,
      cue: '「Frankly」のあと、何のための検査か。',
      line: 'Frankly, I don’t want to *invest in someone* who only has *three months to live*.',
      said: '「正直、余命3か月の人に時間をかけたくない」と言う。',
      mean: '無料の検査は、付き合う前の健康チェックでもあるという本音。',
      trap: 'three months to live を診断と取りやすいが、まだ撮っていない。仮の話として聞く。',
      use: 'Is this worth investing my time in?（時間をかける価値ある？）' },

    // R fix: V2, "what Ann wants" was a filler; "never done" (adventure, the trap the notes already name) replaces it
    // why: a break ← "back" heard as "back off"; never done ← "adventure" heard as a first try
    { id: 'f5', skill: 'phrase', level: 'B2', point: 'horse', seg: [150.3, 161.5],
      stem: 'In her comment to the camera, what does Leslie say she’s doing?',
      choices: ['Trying again after things went badly', 'Taking a break from dating for a while', 'Trying something she has never done'], a: 0,
      cue: '「adventure」のあと、馬に乗る話。',
      line: 'Just getting *right back on that horse*.',
      said: 'カメラに「冒険だと思うことにしてる。すぐまた馬に乗るの」と話す。',
      mean: 'get back on the horse ＝ 失敗のあとにもう一度挑む。ここでは恋愛の話。',
      trap: 'adventure から「初めての挑戦」と取りやすいが、back は「もう一度」。',
      use: 'Time to get back on the horse.（そろそろ、また挑戦しなきゃ）' },

    // C2: who the image points at (cf. f5)
    // anchor: 154.4–160.6 s "getting right back on that horse, even if that horse is crazy and wants to peer inside my
    //   body": the horse is what she gets back on (dating), and it "wants" something
    // R fix: S1, "In that comment" dangled when drawn without f5 (same point, never together); "herself" was a weak
    //   target (she rides the horse), so Ann (who set it up) is now the wrong-target near miss
    // why: the machine ← "peer inside my body" is literally what an MRI does; Ann ← the setup was her doing, and
    //   "crazy" fits the push
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'horse', seg: [150.3, 161.5],
      stem: 'In Leslie’s comment to the camera, who or what is the “crazy” horse?',
      choices: ['Her date, who is eager to see inside her', 'The MRI machine she is about to lie in',
                'Ann, who talked her into this date'], a: 0,
      cue: '馬に「戻る」とは何に戻ることか。そして wants to。',
      line: 'getting right back on that horse, even if *that horse is crazy and wants to* peer inside my body.',
      said: '「また馬に乗るの。その馬がイカれてて、体の中をのぞきたがっていても」と話す。',
      mean: '馬に戻る＝恋愛に戻るので、馬はデートの相手。wants to と望むのは機械でなく人。',
      trap: '体の中をのぞくのは MRI なので機械と取りやすい。たとえは、元の決まり文句が何を指すかから追う。',
      use: 'Back in the dating game, I guess.（また恋愛に復帰、かな）' },

    // C2: who the joke is on
    // anchor: 182.2–195.6 s "I'm from Pawnee." "Keep still, please." "What kind of music do you like?" "Can I answer
    //   that?" "Sure, keep still." … "I've told you that a thousand times": each "keep still" follows his own question
    // why: on her ← "keep still at this moment, Leslie" names her as the one at fault; on patients ← "told you that a
    //   thousand times" heard as a general complaint about people in the machine
    // R fix: V2/K7, the key was the longest and the only one with a cause in it; the three are now parallel
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'still', seg: [181.7, 196.4],
      stem: 'During the scan, who is the joke on when he keeps saying “keep still”?',
      choices: ['Him, since his own questions make her move', 'Her, since she can’t lie still for a minute',
                'Patients, since they never follow the rules'], a: 0,
      cue: '「動かないで」の直前に、毎回だれが何をしたか。',
      line: 'What kind of music do you like? — Can I answer that? — Sure, *keep still*.',
      said: '彼は好きな音楽などを次々に聞き、答えるたびに「動かないで」、最後は「何千回も言ってる」と言う。',
      mean: '彼女を動かしているのは彼自身の質問。本人は気づかずに注意し続ける。笑われているのは注意する側。',
      trap: '名前を呼んで注意するので彼女の失敗に聞こえやすい。注意の直前に、誰が話しかけたかを追う。',
      use: 'Don’t make me laugh while I’m drinking!（飲んでるときに笑わせないで！）' },

    // why: pushed ← "some boys were making fun of me" puts the boys in the cause; chased by them ← "chased" heard
    //   as "got chased"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'bike', seg: [196.9, 205.9],
      stem: 'How did Leslie break her arm?',
      choices: ['She lost control chasing some boys', 'Some boys pushed her off her bike', 'She crashed while some boys chased her'], a: 0,
      cue: '「so I」のあとの動詞の向き。',
      line: 'some boys were making fun of me, *so I chased them* and I *lost control*.',
      said: '「からかわれたから追いかけたら、自転車を操れなくなった」と話す。',
      mean: '追いかけたのは彼女のほうで、自分で転んだ。押されたわけではない。',
      trap: 'chased them と chased by は1語で向きが変わる。目的語が後ろに来たら、自分が追った側。',
      use: 'I lost control on the ice.（氷の上で操れなくなった）' },

    // R fix: V2, "restart" was a filler; "she moved" (his "keep still" nagging) is a closer miss
    // why: amazed ← "I can't believe" as real amazement at the story; annoyed ← the "keep still" nagging just before
    //   (refuted: he turned it off himself so she could answer)
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'machine', seg: [198.9, 213.1],
      stem: 'When the story ends, how does he feel about stopping the scan for it?',
      choices: ['Sorry he did, since the story was dull', 'Amazed, since the story was so exciting',
                'Annoyed, since she moved during the scan'], a: 0,
      cue: '「I can’t believe」のあと、for that の that。',
      line: 'I *can’t believe* I turned the machine off *for that*.',
      said: '機械を止めて腕の話を聞いたあと、「あんな話のために」と言う。',
      mean: 'for that ＝「その程度のことで」。話がつまらなかった後悔。',
      trap: 'can’t believe を「すごい」と取りやすい。for that が付くと価値が低い意味。',
      use: 'I can’t believe I waited for that.（あれのために待ったなんて）' },

    // R fix: V2, the key was the only "twist" choice; the reversal distractor is now twist-shaped too
    // why: healing ← "three years" tied to the break itself; reversed ← "making fun of me" heard as her teasing them
    { id: 'h2', skill: 'humor', level: 'C1', point: 'threeyrs', reveals: ['bike'], seg: [200.9, 210.1],
      stem: 'Why does the end of Leslie’s bike story get a laugh?',
      choices: ['A kid’s story turns out to be recent', 'Her arm took three whole years to heal',
                'She, not the boys, did the teasing'], a: 0,
      cue: '話の最後、いつのことかを言う部分。',
      line: 'some boys were making fun of me, so I *chased them*… It was like *three years ago*.',
      said: '子どもの頃のように「からかわれて追いかけた」と語り、「3年くらい前」と付け足す。',
      mean: '子どもの思い出に聞こえた話が、最近の大人の出来事だったと分かる落差。',
      trap: 'three years を治るまでの期間と取りやすい。ago が付けば「いつの話か」。',
      use: 'It was like two weeks ago.（2週間くらい前の話）' },
  ]
};
