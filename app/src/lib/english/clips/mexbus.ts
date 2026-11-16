// REVIEW 2026-11-16: pass 6, fix 16, drop 0, new 0; ear checks 0
// Open: none. "anyway" (228.9 s) is whisper-only, so it's out of every stem, line and anchor now.
// “Michael Scott's Best Decision...or not - The Office US” (the official The Office channel, BEST OF SEASON 7): Michael
// jumps onto a church youth group's bus to build a school in Mexico, a coworker follows, and once they work out how
// long they'll be gone they talk the bus into stopping and get off.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 250 s (whisper repeats the last line at
// 263 s). Michael is named at 14.9, 20.3 and 42.6 s; the coworker who follows him, the youth leader and the driver are
// never named, so stems say "the coworker" or "the two men". Untested on purpose: 0–5 s (captions "the best of mexico",
// whisper "the bus to Mexico"), 41.6 s ("save me at"/"an aisle seat"), 56–68 s (speakers unclear), 91–113 s (what
// they're building, "a school for Mexicans", Carla), 115–140 s (Carla, sleeping, the cheese smell: long gaps), 152–160 s
// (whisper "I'd say… lazy bums", captions "they say… lazy pups"), 186–210 s (Tennessee, which needs geography; the
// driver exchange), 222.8 s (whisper "thing", captions "blog") and 229.8–233 s (garbled in both).
import type { Clip } from '../types.ts';

export const mexBus: Clip = {
  id: 'mexbus', video: 'IVZUUaF1pQ0', title: 'Michael Scott’s Best Decision...or not', dur: 271, wpm: 157,
  band: 'mid', tags: ['職場', '旅行'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): "the smell and the crowd" was weak. Three "they realize…" reasons, each with a line
    //   said in the clip behind it.
    // why: nobody can build ← "Do we know how? I don't know how" is said (keyword); jobs won't wait ← "you have a job
    //   to do" and "no off-season" early on, but at the end nobody mentions work
    { id: 'g1', skill: 'gist', level: 'B2', point: 'why', reveals: ['miss'], seg: [0, 250],
      stem: 'Why do the two men from the office end up wanting off the bus?',
      choices: ['They realize how long they’d be gone', 'They realize none of them can build',
                'They realize their jobs won’t wait'], a: 0,
      cue: '日付や行事が並ぶあたりで、何に気づくか。',
      said: '行事やパーティーを挙げるうちに、何か月も帰れないと気づき、バスを降りようとする。',
      mean: '勢いで乗ったが、長さを知って気が変わる。題名の「…or not」はここ。',
      trap: '作り方を知らない話や仕事の話も出るが、降りる直前に並べるのは、留守にする間の行事。',
      use: 'I didn’t realize it would take that long.（そんなにかかるとは思わなかった）' },

    // why: a polite no ← the Japanese 遠慮 frame: "if…" heard as a soft refusal; room for two ← "have" heard as having
    //   space, and a coworker does join later
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'haveme', seg: [5.6, 10.1],
      stem: 'When asked “Are you coming?”, what does the answer do?',
      choices: ['Says yes, modestly, if they want him', 'Says no, politely, unless they insist',
                'Says yes, if they have room for two'], a: 0,
      cue: '「yes」の前に付けた、if で始まる言葉。',
      line: 'Are you coming? — *If you’ll have me*, yes. — Heck, yes.',
      said: '「来る？」に「迎えてもらえるなら、ぜひ」と答え、相手は「もちろん！」。',
      mean: 'If you’ll have me ＝「受け入れてくれるなら」。へりくだった yes。',
      trap: 'if があると条件や遠慮に聞こえやすい。最後の yes と相手の返事で承諾と分かる。',
      use: 'I’d love to come, if you’ll have me.（よければぜひ参加したいです）' },

    // R fix: V2/K6 (blind 50 %, right): the key was the only one without a worry and carried the only absolute
    //   ("Completely"). Now three stances that all fit the scene, two of them "sure".
    // why: cover his work ← "you have a job to do" is said to him, and "my job will be here" heard as a favor asked;
    //   too proud ← "irresponsible" heard as a doubt he won't admit (the 面子 frame)
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'confident', seg: [20.0, 34.55],
      stem: 'When told he is being irresponsible, how does Michael feel about going?',
      choices: ['Sure of it, and not worried about his job', 'Sure of it, but counting on them to cover his work',
                'Torn, but too proud to back down now'], a: 0,
      cue: '「無責任だ」を打ち消したあとと、仕事への返事。',
      line: 'I have *never been more confident* about a decision… *My job will be here when I get back*.',
      said: '「無責任じゃない。こんなに自信のある決断はない」と言い、仕事も「戻ってもあるさ」と返す。',
      mean: '迷いはまったくない。仕事の心配も軽く受け流している。',
      trap: '仕事の話が出るので頼みごとや心配と取りやすいが、それは止める側の言葉。本人の返事を聞く。',
      use: 'I’ve never been more sure of anything.（こんなに確信したことはない）' },

    // R fix: S2/V2 (blind 85 %): the stem quoted "no off-season", which is the answer. It now names the moment, and
    //   the choices are three readings of the sales remark, two of them "don't go".
    // why: slow right now ← "no" is weak and lost, leaving "off-season" (客の少ない時期); slows down soon ← "season"
    //   heard as a sales calendar, so "wait for the quiet time"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'offseason', seg: [28.5, 34.55],
      stem: 'When printer sales come up, what point is being made to Michael?',
      choices: ['Sales never slow down, so he can’t leave', 'Sales are slow right now, so he can go',
                'Sales slow down soon, so he should wait'], a: 0,
      cue: '「off-season」の直前の短い語に注目。',
      line: '*There’s no off-season* when it comes to printer sales.',
      said: '「君には仕事がある。営業に休みの季節はない」と引き止める。',
      mean: 'off-season ＝ 客の少ない時期。それが「ない」、つまり一年中忙しいという意味。',
      trap: 'no が弱いと「今は暇な時期」と逆に聞こえる。there’s no のあとは否定で聞く。',
      use: 'There’s no off-season for parents.（親業に休みの季節はない）' },

    // why: sick villagers ← said just before, by someone who has it wrong; a hospital ← guessed later on the bus
    { id: 'd1', skill: 'detail', level: 'B1', point: 'school', seg: [43.2, 50.2],
      stem: 'According to the reply, what will the group do in Mexico?',
      choices: ['Build a school', 'Care for sick villagers', 'Build a hospital'], a: 0,
      cue: '「actually」で始まる返事。',
      line: 'these Mexican villagers are sick. — We’re actually *building them a school*.',
      said: '「病気の人々を見捨てない」という熱い宣言に、「実は学校を建てるんです」と返される。',
      mean: 'actually ＝「実は」。相手の思い込みを、やんわり直している。',
      trap: '先に聞こえる sick に引かれやすい。actually のあとが訂正の中身。',
      use: 'Actually, it’s a school, not a hospital.（実は病院じゃなくて学校です）' },

    // R fix: V2/K3 (blind 75 %): "teach at the school" was a filler. Three ways of taking the correction now.
    // why: angry at the speaker ← "I won't stand for it" heard as aimed at the person who corrected him; knew it all
    //   along ← "Whatever" heard as "yes, yes, I know"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'school', seg: [43.2, 53.2],
      stem: 'What makes the exchange about the villagers funny?',
      choices: ['He’s corrected on the cause and carries on regardless', 'He’s corrected on the cause and turns on the speaker',
                'He’s corrected on the cause and claims he knew it'], a: 0,
      cue: '訂正されたあとの「Whatever」と、そのあとの言葉。',
      line: 'We’re actually building them a school. — *Whatever*. I *won’t stand for it*.',
      said: '訂正されても「どうでもいい。とにかく許さない」と、同じ決めぜりふを続ける。',
      mean: '目的を知らないまま英雄気取り。中身より格好よさが大事だと分かる。',
      trap: 'Whatever は「知ってた」でなく受け流し。it も相手ではなく演説の中身。',
      use: 'I won’t stand for it.（黙ってはいられない）' },

    // why: weeks ← "three" caught, the unit lost; two years ← said later, about building projects that never start
    { id: 'n1', skill: 'number', level: 'B1', point: 'months', seg: [68.5, 74.25], keep: true,
      stem: 'How long will the volunteers be doing manual labor?',
      choices: ['three weeks', 'three months', 'two years'], a: 1,
      cue: '「manual labor for」のあと。',
      line: 'to do manual labor for *three months*.',
      said: '「仕事も友人も家族も置いて、3か月も肉体労働しに行く人なんていない」と言う。',
      mean: 'three months ＝ 3か月。数日の旅行ではなく、長期のボランティア。',
      trap: '数字の three だけ聞いて単位を落としやすい。months の s まで聞く。',
      use: 'I’ll be away for three months.（3か月留守にします）' },

    // R fix: V2/K3 (blind 70 %): "his friends love the trip" was a filler. "Crazy people change things" is the
    //   inspirational script he seems about to give.
    // why: admits it ← "I am crazy" is heard inside "everybody thinks that I am crazy"; crazy ones change the world ←
    //   the usual pep-talk script ("they called me crazy…")
    { id: 'h2', skill: 'humor', level: 'C1', point: 'sanest', seg: [73.8, 81.1],
      stem: 'Why is the reply about everybody thinking he is crazy funny?',
      choices: ['He turns their doubt into proof he’s sane', 'He admits he’s a bit crazy, and proud of it',
                'He says it takes crazy people to change things'], a: 0,
      cue: '「and that tells me」のあと。',
      line: 'Everybody thinks that I am crazy, *and that tells me that I am the sanest person I know*.',
      said: '「みんな俺がおかしいと思ってる。だから俺こそ一番まともなんだ」と言う。',
      mean: '「変だと言われる＝正しい」という、ねじれた理屈。本人は自信満々。',
      trap: 'I am crazy だけ聞くと、自分で認めたように聞こえる。that tells me のあとが結論。',
      use: 'That tells me I’m on the right track.（それは正しい道にいる証拠だ）' },

    // why: 15 ← fifteen/forty-five blur in fast speech; 2 days ← the trip's length, said twice around it
    { id: 'n2', skill: 'number', level: 'B1', point: 'road', reveals: ['minus'], seg: [81.7, 90.7], keep: true,
      stem: 'By the answer, how long have they been on the road so far?',
      choices: ['15 minutes', '45 minutes', '2 hours', '2 days'], a: 1,
      cue: '「minus」のあと、少し間をおいて。',
      line: 'two days minus how long we’ve been on the road. *45 minutes*?',
      said: '「あとどれくらい？」に、「2日から走った分を引いて…45分？だから、ほぼ2日」と答える。',
      mean: 'forty-five minutes。まだ出発したばかりだと分かる。',
      trap: '2日が2回聞こえるので、それに引かれやすい。45分は引く側の数。',
      use: 'We’ve only been on the road an hour.（まだ1時間しか走っていない）' },

    // C2 dict: weak words at speed, in an order grammar would "correct"
    // anchor: 84.8–86.2 s both sources "minus how long we've been on the road"; four weak words run into "on the road"
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'minus', seg: [83.6, 87.3],
      stem: 'Type the gap: “two days minus ___ on the road.” (4 words)', answer: "how long we've been",
      cue: '「minus」のすぐあと。弱い語も全部。',
      line: 'two days minus *how long we’ve been* on the road.',
      said: '「2日から、これまで走った時間を引いた分」。4語が一息に流れる。',
      mean: '’ve been は弱く「ヴビン」。間接疑問なので語順は how long we’ve been。',
      trap: '疑問文の語順 have we been に直したくなる。聞こえた順に書き、’ve も落とさない。',
      use: 'I forget how long we’ve been here.（ここに来てどれくらいか忘れた）' },

    // R fix: V2/K3 (blind 85 %): "ride on all the way" and "everyone turns back" were fillers, and the key was the only
    //   two-part outcome. Three "who gets off" outcomes now.
    // why: one stays ← the coworker chased Michael onto the bus, so one of them might ride on; the group turns back ←
    //   "Stop the bus" chanted again and again heard as the whole bus agreeing
    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', reveals: ['farewell'], seg: [140, 250],
      stem: 'How does the bus trip end for the two men?',
      choices: ['Both get off, and the bus goes on without them', 'One gets off, and the other goes on to Mexico',
                'Both get off, and the youth group turns back too'], a: 0,
      cue: '最後の別れのあいさつで、誰が残るか。',
      said: 'バスを止めさせて降り、若いボランティアたちに「世界を救ってきて」と送り出す。',
      mean: '勢いで乗ったバスから、結局降りる。旅は彼らなしで続く。',
      trap: '「止めろ」の連呼で全員が引き返すように聞こえるが、別れのあいさつの we で、降りる側と残る側が分かる。',
      use: 'Have a safe trip, everyone.（みなさん、気をつけて）' },

    // R fix: V2 (blind 80 %): "realized" plus one negative choice gave the key. Two negative readings now; the busy
    //   season calls back to the printer-sales remark.
    // why: Mexico instead ← "be in Mexico for my half birthday" heard as a plan (literal); busy season ← the earlier
    //   "no off-season" and the office "Christmas party" heard as work
    { id: 'i1', skill: 'infer', level: 'B2', point: 'miss', seg: [140.3, 147.25],
      stem: 'As the dates are listed, what are the two men realizing?',
      choices: ['They’ll miss all of them back home', 'They’ll be gone in the busiest sales season',
                'They’ll celebrate them in Mexico instead'], a: 0,
      cue: '「half birthday」に続いて挙がる行事。',
      line: 'I am going to be *in Mexico for my half birthday*. — And the Christmas party. — And Cinco de Mayo.',
      said: '「半分の誕生日もメキシコか」に、「クリスマス会も」「シンコ・デ・マヨも」と続く。',
      mean: '行事を並べるうちに、どれだけ長く留守にするかを実感している。',
      trap: 'メキシコで祝う予定に聞こえやすい。直前の「Oh, God」で、うれしい話でないと分かる。',
      use: 'I’m going to miss the wedding.（結婚式に出られなくなる）' },

    // R fix: V2/K3 (blind 80 %): "dates later than they think" was a filler. "Misheard the dates" is the near miss: he
    //   does stop himself, for a different reason.
    // why: stands by it ← the first sentence ("we'll be back before that") heard alone; misheard ← "No, we… No."
    //   heard as a correction of the dates
    { id: 'i2', skill: 'infer', level: 'C1', point: 'backby', seg: [147.15, 154.6],
      stem: 'When one man starts “No, we’ll be back before that”, what happens?',
      choices: ['He stops, seeing it could run far longer', 'He stands by it, sure they’ll be home sooner',
                'He stops, seeing he had the dates wrong'], a: 0,
      cue: '言いかけて止まる「No, we…」のあと。',
      line: 'No, we’ll be back before that. — No, we… *No*. *You know how these things go*.',
      said: '「それまでには戻る」と言いかけ、「いや…違う。こういうのは長引く」と言い直す。',
      mean: '話しながら、工事は予定どおり終わらないと気づいた。言いかけて止まるのが合図。',
      trap: '最初の一文だけ聞くと、帰れると言い切ったように聞こえる。言い直しの No が本音。',
      use: 'You know how these things go.（こういうのって、いつもそうでしょ）' },

    // R fix: S1/V2 (blind 85 %): the stem said "faked", which refuted "really ill" before listening. It now names the
    //   moment without "fake"; three tones.
    // why: alarmed ← "seizure or a heart attack" heard without "fake"; playful ← an absurd plan heard as a gag
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'fake', seg: [162.1, 171.15],
      stem: 'When he brings up a seizure or a heart attack, how does he sound?',
      choices: ['Desperate, grabbing at any way off', 'Alarmed, afraid someone is ill',
                'Playful, making up a game to pass time'], a: 0,
      cue: '直前の「I gotta」と、「Do that. Do it」の勢い。',
      line: 'Can you *fake* a seizure…? — I can make myself cry. — *Do that. Do it.*',
      said: '「仮病でもいいから」と頼み、「泣ける」と言われると「それだ、やれ」と飛びつく。',
      mean: '降りるためなら何でもする必死さ。直前に「降りなきゃ」と言っている。',
      trap: 'seizure だけ聞くと本当の病気の話に取りやすい。fake を聞き落とさない。',
      use: 'Whatever works. Just do it.（何でもいい、とにかくやって）' },

    // R fix: S1/V2 (blind 85 %): "really after" told the reader the stated wish was a cover. Neutral stem now.
    // why: food and sights ← "check out the view" and "paninis for the road" taken literally; fun for everyone ← the
    //   tour-guide script (pointing out sights to cheer a long ride)
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'pretext', seg: [174.0, 186.1],
      stem: 'Why does he bring up the overlook and the bistro?',
      choices: ['To get the bus stopped, any way he can', 'To pick up food and see the sights',
                'To make the long ride more fun for all'], a: 0,
      cue: '二つの提案に共通する、本当の目的。',
      line: 'I saw a sign for a *scenic overlook*… — there’s a nice *bistro* coming up.',
      said: '「展望台がある」「おしゃれなビストロがある」と、続けて寄り道を提案する。',
      mean: 'どちらも、バスを止めさせて降りるための口実。遠回しな頼み方。',
      trap: '景色や食べ物を文字どおりの希望と取りやすい。必死さの流れから本当の狙いを読む。',
      use: 'Could we pull over for a minute?（ちょっと車を止めてもらえる？）' },

    // R fix: V2 (blind 50 %): "stopped a short time ago" was weak. "Later, in Tennessee" is said two lines on.
    // why: Tennessee ← "Maybe we'll stop in Tennessee" comes after the bistro (keyword); not safe ← "It's unsafe to talk
    //   to a driver" comes a few lines later
    { id: 'd2', skill: 'detail', level: 'B1', point: 'schedule', seg: [178.15, 181.75],
      stem: 'What reason is given for not stopping?',
      choices: ['They have to keep to a schedule', 'They’ll stop later, in Tennessee', 'It isn’t safe to stop on this road'], a: 0,
      cue: '「Can’t stop」のすぐあと。',
      line: 'Can’t stop. *We’re on a schedule*.',
      said: '展望台を見たいと言うと、「止まれない。予定があるから」と断られる。',
      mean: 'on a schedule ＝ 予定どおりに進む。だから寄り道はできない。',
      trap: 'あとの Tennessee や unsafe と混ざりやすい。理由は Can’t stop の直後。',
      use: 'Sorry, we’re on a tight schedule.（すみません、予定が詰まっていて）' },

    // R fix: S2/V2 (blind 80 %): the stem quoted the phrase, and "the stop on the sign" was a filler. It now names the
    //   moment; "feeling sick" answers "Are you okay?" literally.
    // why: the form ← "sign up" = register (literal); feeling sick ← the question "Are you okay, sir?" taken at face
    //   value
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'signup', seg: [207.0, 212.75],
      stem: 'Asked “Are you okay, sir?”, what does his reply mean?',
      choices: ['This isn’t what I agreed to', 'I never filled in a form for this', 'I’m feeling sick on this bus'], a: 0,
      cue: '「Are you okay?」と聞かれたあとの返事。',
      line: 'Are you okay, sir? — *I didn’t sign up for this*.',
      said: '「大丈夫ですか」と聞かれ、「こんなはずじゃなかった」と答える。',
      mean: 'I didn’t sign up for this ＝「こんなこと引き受けた覚えはない」。',
      trap: 'sign up を「申し込む」の字面で取りやすい。体調ではなく、気持ちの話をしている。',
      use: 'I didn’t sign up for overtime.（残業するなんて聞いてない）' },

    // R fix: V2 (blind 80 %): "take a break" was a filler. Two "I've given" readings now, one of them "needs a rest".
    // why: a rest ← "take" heard as take a break / take time off; just not this way ← "I've done that" heard as a
    //   polite preface to a softer no
    { id: 'h3', skill: 'humor', level: 'C1', point: 'take', seg: [212.55, 220.1],
      stem: 'What is funny about how he turns down giving back to society?',
      choices: ['He flips “give back” into his turn to take', 'He says he’s given plenty and needs a rest',
                'He says he’d give back, just not like this'], a: 0,
      cue: '「I’ve done that」のあとの、短い文。',
      line: 'You want to give back to society? *I’ve done that. I need to take.*',
      said: '「社会に恩返し？もうやったよ。今度は僕がもらう番だ」と言う。',
      mean: 'give back の反対で take と言い切る。自分勝手を堂々と言うおかしさ。',
      trap: 'take だけ聞くと「休みを取る」などに取りやすい。give back と対になっている。',
      use: 'I’ve given enough. Now it’s my turn.（もう十分あげた。���は私の番）' },

    // R fix: V2 (blind 70 %): three parallel "Honestly, …" paraphrases. The anchor no longer rests on "anyway",
    //   which the captions don't have (whisper only); "anyway" is out of the stem and the line.
    // why: sorry to let you down ← the sincere reading (an apology); fall apart without us ← the wrong direction
    //   ("screw everything up" heard as what happens if they leave)
    // anchor: 217.4–219.5 s "I've done that. I need to take." gives the real reason first; 227.0–229.1 s "…we'd
    //   probably screw everything up" then dresses the leaving as a favor
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'anyway', reveals: ['wed', 'take'], seg: [216.9, 229.65],
      stem: 'Which plain version keeps what “we’d probably screw everything up” is doing?',
      choices: ['“Honestly, you’re better off without us.”', '“Honestly, we’re sorry to let you down.”',
                '“Honestly, it’ll all fall apart without us.”'], a: 0,
      cue: '直前の「I need to take」とのつながり。',
      line: 'I’ve done that. *I need to take.* … we’d probably *screw everything up*.',
      said: '「もう与えた、今度はもらう番だ」と言ったあと、「行っても、どうせ台無しにするし」と付け足す。',
      mean: '本当の理由は先に言った「もらう番」。そのあとで、降りることを相手のためのように言いかえている。',
      trap: '謝罪や心配と聞きやすい。言い訳は、本音のあとに「どうせ」の形で来る。',
      use: 'I’d only slow you down anyway.（どうせ足手まといになるし）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'forth', seg: [222.7, 225.25],
      stem: 'Type what he says: “We can ___ all day.” (4 words)', answer: 'go back and forth',
      cue: '「We can」のあと、「all day」の前。',
      line: 'We can *go back and forth* all day.',
      said: '「こんな言い合い、一日中でも続けられる」と話を打ち切る。',
      mean: 'back and forth ＝ 行ったり来たり。and は「ン」に縮んでつながる。',
      trap: 'and が弱く、back forth の2語に聞こえやすい。go も短く落としやすい。',
      use: 'We went back and forth on it.（それについて何度もやりとりした）' },

    // R fix: V2 (blind 70 %): "If we went…, ___" let grammar pick "we'd" without listening. The gap now starts the
    //   quote, so all three fit; "anyway" (whisper only) is out.
    // why: we'll ← the 'd is near silent, and 'll is the more common habit; we probably ← the 'd dropped entirely,
    //   leaving a plain present
    { id: 's1', skill: 'sound', level: 'B2', point: 'wed', seg: [225.2, 229.65],
      stem: 'Fill the gap: “___ screw everything up.”',
      choices: ['We’ll probably', 'We’d probably', 'We probably'], a: 1,
      cue: '「Mexico」のあと、we に付く小さな音。',
      line: 'If we went to Mexico, *we’d probably* screw everything up.',
      said: '「メキシコに行っても、どうせ全部台無しにするさ」と言う。',
      mean: 'If + 過去形のあとは we’d（we would）。’d はほとんど聞こえない。',
      trap: '’d が消えると we’ll や we に聞こえる。If we went なら would を待つ。',
      use: 'If I went, I’d probably get lost.（行っても、たぶん迷う）' },

    // R fix: V2/K3 (blind 80 %): "the volunteers should go home" was a filler. The near miss now quits too, but for a
    //   reason nobody gives (a cold re-read still beat "meet them in Mexico" at 80 %).
    // why: will miss them ← the warm goodbye taken as sincere (the お別れ frame); back to work ← "keep an eye on
    //   America" heard as a real job waiting, and work came up at the start
    // anchor: 241.3 s "Stop the dang bus" (they're getting off); 246.9 s "Go save the world" hands the mission back;
    //   248.4 s "We'll keep an eye on America" gives the two of them a made-up job of their own
    // retired: g2 reveals its point, so play 3+ under g2 drew no C2
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'farewell', seg: [240.8, 250.3], retired: true,
      stem: 'With “We’ll keep an eye on America”, what is he trying not to say?',
      choices: ['That they’re just quitting the trip', 'That they’ll truly miss the young group',
                'That they’re quitting to get back to work'], a: 0,
      cue: '直前に何を頼んだかと、「Go save the world」。',
      line: 'Well, a pleasure. *Go save the world*. *We’ll keep an eye on America for you*.',
      said: '「どうも、楽しかった。世界を救ってきて。アメリカは僕らが見張っておくから」と別れる。',
      mean: '降りるだけなのに、自分たちにも大事な役目があるように言う。かっこ悪さを隠す大げさな言い方。',
      trap: '温かい別れのあいさつと取りやすい。直前の「バスを止めろ」との落差で、ごまかしだと分かる。',
      use: 'You go ahead. I’ll hold down the fort.（先に行って。留守は任せて）' },
  ]
};
