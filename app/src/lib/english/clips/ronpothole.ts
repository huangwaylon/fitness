// “The only time Ron was pro-government | Parks and Recreation” (the official Parks and Recreation channel, Season 5 |
// Parks and Recreation): Ron and Andy fix Diane's pothole; her daughters pull Andy (and then Ron) into a princess game;
// back at the office Ron insists he won't pursue Diane, she comes in and asks him out, and Ron, to camera, calls the
// 3-1-1 program a moderate success.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Andy (1.5 s, 121.2 s), Diane Lewis
// (32.8 s), Ron Swanson (36.1 s), Ron (124.2 s, 211.6 s). Leslie (209 s) is never named: stems avoid her, and the
// colleague at 184–203 s is "a colleague".
// Untested: 22.5–24.8 s (whisper only: "Only if you can tag us!"); 26.7 s ("Your tax dollars at work": who and tone
// can't be settled); 38 s (whisper only "Oh, seaweed choke!"); 81–85 s (Food and Stuff, show-specific); 89 s (whisper
// "edification", captions "notification"); 110–116 s (the "sitting in a tree" rhyme needs the playground song); 128 s
// (whisper only "Can we turn you into a princess?"); 141.5–144 s (who says "two princesses" isn't clear); 172–184 s
// (another room: a book read aloud, sexual, and a birth question); 217 s ("Is that a euphemism?": innuendo); 238 s
// ("I don't screw around": left out of every line).
// REVIEW 2026-11-16: pass 6, fix 17, drop 1, new 0; ear checks 0
// OPEN: nt2's evidence (the rouge, 147.6–160 s) is a callback outside its segment (243–250 s); a replay can't show it.
//   Kept because the oddity of "no need to wear makeup" to a man is in the segment; say if you'd rather drop it.
import type { Clip } from '../types.ts';

export const ronpothole: Clip = {
  id: 'ronpothole', video: 'EddL2v6JC6U', title: 'The only time Ron was pro-government', dur: 290, wpm: 142,
  band: 'slow', tags: ['職場', '恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: blind 55 % (only the key fit a game; "hands over to Ron" was weak). Now a formal-to-their-mother reading.
    // why: refuses ← "I'm the director of Parks and Recreation… Excuse me?" just before, a claim of authority;
    //   their mother ← "Your Highnesses" + "humbly request" heard as 敬語 to an adult
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'kingdom', seg: [9.4, 22.6],
      stem: 'When the girls demand that he ask permission, what does the reply do?',
      choices: ['Plays along, asking in old royal English', 'Asks their mother, in very formal English',
                'Refuses: city work needs no permission'], a: 0,
      cue: 'Your Highnesses で始まる返事の言葉づかい。',
      line: 'Your Highnesses, we do *humbly request thine permission*…',
      said: '「王女さま方、お許しを願います」と王宮の言葉で頼む。',
      mean: 'thine や humbly request は古く大げさな言い方。王国ごっこに合わせている。',
      trap: '口論や大人への敬語と取りやすい。急に古めかしくなったら、ごっこ遊び。',
      use: 'Your Majesty, may I have the remote?（王さま、リモコンをお借りしても？）' },

    // R fix: blind 65 % (the key was the only arc; the others were single events). All three are arcs now.
    // why: cools ← "you're not even from the Public Works Department?" heard as the turn of the scene; stays
    //   doubtful ← "how exactly are you gonna fix this hole" heard as checking up on him
    { id: 'g1', skill: 'gist', level: 'B2', point: 'firstmeet', seg: [30.0, 108.6],
      stem: 'How do things go between Diane and Ron at the pothole?',
      choices: ['She starts out doubtful, then warms to him', 'She starts out friendly, then cools on him',
                'She stays doubtful and checks every step'], a: 0,
      cue: '最初の質問と、レモネードのあとの話し方の変化。',
      said: '最初は「公共事業課ですらないの？」と疑うが、謝ってレモネードを出し、最後はお礼を言う。',
      mean: '疑いから信頼へ、二人の距離が縮まっていく流れ。',
      trap: '最初の一言だけで苦情の場面と決めやすい。場面の最初と最後で態度を比べる。',
      use: 'Sorry, I wasn’t sure about you at first.（ごめん、最初はちょっと疑ってた）' },

    // R drop: d1 — V1/V2: the show's name (and "I'm the director of Parks and Recreation" at 6.5 s) answers it, and
    //   its choices leaked n2's "3-1-1"; never shipped.

    // R fix: blind 65 %. "Told to help with a backlog" was a filler; now "proper channels" in the wrong relation.
    // why: Parks ← he did another department's job, so a "Parks should do roads" story; rules first ← "the proper
    //   channels" is said, but he skips them
    { id: 'i1', skill: 'infer', level: 'C1', point: 'govt', seg: [48.0, 54.3],
      stem: 'What does Ron’s reason suggest about how he sees city departments?',
      choices: ['He doesn’t trust them to get it done', 'He thinks Parks should handle the roads',
                'He thinks the proper rules come first'], a: 0,
      cue: 'proper channels のあと、否定の部分。',
      line: 'it appeared that *no one from the proper channels* was going to fix this, so I decided to *do it myself*.',
      said: '「正式な部署は誰も直しそうになかったから、自分でやることにした」と言う。',
      mean: '役所の正式な流れを待っても無駄、という考え。自分でやる方を信じている。',
      trap: '部署の話が続くので役割分担の話に取りやすい。no one のあとの「しない」に注目。',
      use: 'Nobody else was going to, so I did.（誰もやらないから、自分でやった）' },

    // R fix: blind 60 % (the key was the only unhedged choice). Now all three are two-part and none is hedged.
    // why: unsure ← "ma'am" read as nervous deference (Japanese 恐縮); annoyed ← a doubting question usually gets
    //   a defensive reply
    { id: 't1', skill: 'attitude', level: 'B1', point: 'yesmaam', seg: [53.0, 59.5],
      stem: 'When Diane asks if he knows what he’s doing, how does Ron answer?',
      choices: ['Calm and fully sure of himself', 'Polite, but unsure of himself', 'Curt, and annoyed by the question'], a: 0,
      cue: '短い返事を2回言うところ。',
      line: 'Yes, ma’am. *Yes, I do.*',
      said: '「はい。ええ、分かっています」と、短く2回答える。',
      mean: 'くり返しの Yes, I do は「心配ご無用」という自信。言い訳はしない。',
      trap: 'ma’am を恐縮と取りやすいが、ここは礼儀の呼びかけ。言い足しがないのは自信の印。',
      use: 'Do you know the way? — Yes, I do.（道分かる？うん、分かる）' },

    // why: turns it down ← "thank you" heard as the polite refusal (けっこうです); thanks for letting him work ← "thank
    //   you" taken on its own, about the job
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'please', seg: [66.6, 69.9],
      stem: 'When Diane offers lemonade, what does Ron’s answer do?',
      choices: ['Accepts it, and with good manners', 'Turns it down, with good manners',
                'Thanks her for letting him work'], a: 0,
      cue: '短い答えの、最初の一語。',
      line: 'Lemonade? — *Please* and thank you.',
      said: '「レモネードは？」に「お願いします、ありがとう」と答える。',
      mean: 'Please がつくと「いただきます」。ていねいで、はっきりした yes。',
      trap: 'thank you は断りにも聞こえるが、断るなら No, thank you。please が決め手。',
      use: 'Coffee? — Yes, please.（コーヒーは？はい、お願いします）' },

    // R fix: blind 55 % ("unsure who he was" was weak; the key was the only hedged choice). Now a near sound.
    // why: busy ← "things get chaotic around here" comes right after; curious ← curt ≈ the start of "curious", and she
    //   asks about his work later
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'curt', seg: [69.0, 72.2],
      stem: 'What does Diane say she was with Ron earlier?',
      choices: ['Short and rude with him', 'Too busy to really talk to him', 'Too curious about his work'], a: 0,
      cue: 'I’m sorry if I was のあとの一語。',
      line: 'I’m sorry if I was *curt* earlier.',
      said: '「さっきはそっけなくてごめんなさい」と謝る。',
      mean: 'curt ＝ 言葉が短く、冷たい。失礼だったと認めている。',
      trap: '次の「家がばたばたで」とつなげて「忙しかった」を選びやすい。謝っている中身は態度。',
      use: 'Sorry if I sounded curt on the phone.（電話でそっけなくてごめん）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'gravel', seg: [92.1, 95.6],
      stem: 'Type what Ron says: “I dug the loose gravel ___ hole.” (3 words)', answer: 'out of the',
      cue: 'gravel のすぐあと、短い3語。',
      line: 'I dug the loose gravel *out of the* hole.',
      said: '「穴から砂利をかき出した」と、最初の作業を説明する。',
      mean: 'out of the が「アウダダ」のようにつながる。of は弱く、ほぼ「ア」。',
      trap: 'of がほとんど聞こえず、out the や out in と聞きやすい。outta と縮む形を覚えておく。',
      use: 'Get the milk out of the fridge.（冷蔵庫から牛乳を出して）' },

    // why: hot asphalt ← the usual road-repair picture; cold and hot differ in one vowel-led word; gravel ← "loose
    //   gravel" was the first step, heard as going back in
    { id: 'd3', skill: 'detail', level: 'B1', point: 'steps', seg: [97.8, 103.6],
      stem: 'After spraying down the hole, how will Ron fill it?',
      choices: ['With cold patch asphalt', 'With hot asphalt and tar', 'With the loose gravel again'], a: 0,
      cue: 'fill it with のあと。',
      line: 'then I’ll spray down the hole to settle the dust, and *fill it with cold patch asphalt*.',
      said: '「穴に水をかけてほこりを抑え、冷えたまま使える補修材で埋める」と説明する。',
      mean: '手順を then, and でつないで説明している。最後が埋める材料。',
      trap: '道路工事は熱いものと思いがちだが、cold と言っている。砂利は最初に取り出した物。',
      use: 'First rinse it, then fill it with water.（まずすすいで、それから水を入れて）' },

    // R fix: blind 50 %. "Teach her daughters" became "how long it will take", a single mom's practical worry.
    // why: checking ← her earlier doubt ("Do you know what you're doing?"); how long ← "chaotic around here", a busy
    //   single mom
    { id: 'd4', skill: 'detail', level: 'B2', point: 'nextone', seg: [103.8, 108.6],
      stem: 'Why did Diane want the steps explained?',
      choices: ['So she can fix the next hole on her own', 'So she can check that he does it right',
                'So she knows how long it will take'], a: 0,
      cue: 'thank you のあと、Now で始まる文。',
      line: 'Well, thank you. Now *I can fix the next one myself*.',
      said: '「ありがとう。これで次の穴は自分で直せる」と言う。',
      mean: '人に頼らず自分でやりたい人。Ron と同じ考え方をしている。',
      trap: 'さっき疑っていたので「確認」と取りやすい。Now のあとの「次は自分で」を聞く。',
      use: 'Show me once, and I can do it myself.（一度見せて。あとは自分でやる）' },

    // R fix: blind 55 %. "Last time he will play" became "tired of playing", the irritation read as quitting.
    // why: wants out ← the irritation heard as quitting the game; once more ← "for the last time" heard as asking for a
    //   final try
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'lasttime', seg: [120.7, 127.6],
      stem: 'When Andy corrects how Ron addresses him, what does his opening suggest?',
      choices: ['He has said it many times already', 'He is tired of playing and wants out',
                'He wants Ron to say it just once more'], a: 0,
      cue: '名前を言い直す前の、決まり文句。',
      line: '*For the last time*, Ron, it’s Princess Rainbow Sparkle.',
      said: '「何度言わせるの、Ron。プリンセス・レインボーだよ」と言い直す。',
      mean: 'For the last time ＝ もう何度も言ったでしょ。いらだちの決まり文句。',
      trap: '「最後に一回」や「もうやめたい」と取りやすい。言い直しの前なら「何度言えば」。',
      use: 'For the last time, I’m not hungry.（何度も言うけど、お腹すいてない）' },

    // why: Could ← same request, only the first consonant differs; Will / Won't ← the weak vowel leaves only the w
    { id: 's1', skill: 'sound', level: 'B2', point: 'wouldyou', seg: [136.7, 141.8],
      stem: 'Fill the gap: “___ please come help me tamp this down?”',
      choices: ['Could you', 'Would you', 'Will you', 'Won’t you'], a: 1,
      cue: '文の最初、w で始まる短い音。',
      line: '*Would you* please come help me tamp this down?',
      said: '「これを固めるのを手伝ってくれないか」と頼み直す。',
      mean: 'Would you が「ウッジュ」のようにつながる。d と y がまざって「ジュ」になる。',
      trap: 'Could you と意味は近いが、出だしが k か w か。Won’t なら「ウォウン」と長い。',
      use: 'Would you hold this for a second?（ちょっとこれ持っててくれる？）' },

    // R fix: blind 65 % (only the key named the girls). All three choices now start with the girls.
    // why: hurt ← "your face" + the "hot lava" game; splashed ← he said he'd spray down the hole
    { id: 'i2', skill: 'infer', level: 'C1', point: 'rouge', seg: [147.6, 160.6],
      stem: 'By the time Diane checks in, what has happened to Ron?',
      choices: ['The girls have put makeup on his face', 'The girls have hurt his face playing',
                'The girls have splashed him with the hose'], a: 0,
      cue: '最初の短い2語と、そのあと Ron が怒る理由。',
      line: 'More *rouge*. … I came here to fix a pothole, *not be mocked*.',
      said: '女の子が「もっとほお紅を」と言い、Ron は「からかわれに来たんじゃない」と言う。',
      mean: 'rouge ＝ ほお紅。Ron はプリンセスごっこで化粧をされている。',
      trap: 'face が出てくるのでけがを想像しやすい。最初の rouge が手がかり。',
      use: 'Can you not laugh at my haircut?（髪型、笑わないでくれる？）' },

    // R fix: blind 50 %. The key no longer says "dig"; "she made him up" became a blame reading of "It's just…".
    // why: blames him ← "It's just…" heard as an excuse that shifts it to Ron; for the girls ← the apology heard as
    //   about her daughters' game
    { id: 'h1', skill: 'humor', level: 'C1', point: 'face', reveals: ['rouge'], seg: [154.6, 161.0],
      stem: 'Why is Diane’s apology to Ron funny?',
      choices: ['Her reason for “sorry” is a new insult', 'She says sorry for the girls, not herself',
                'She blames Ron for letting them do it'], a: 0,
      cue: 'I’m sorry のあと、It’s just で始まる理由。',
      line: 'I’m sorry. *It’s just your face is ridiculous*.',
      said: '「ごめんなさい。ただ、その顔がおかしくて」と言う。',
      mean: '謝ったはずが、理由の部分でまた笑っている。謝罪が二度目のからかいになる。',
      trap: 'sorry のあとは言い訳や反省が来ると思いがち。It’s just のあとの中身まで聞く。',
      use: 'I’m sorry, it’s just… your hat.（ごめん、ただ…その帽子が）' },

    // why: half an hour ← "in an hour" links to "inanour", heard as a half; two hours ← "to go" right after
    { id: 'n1', skill: 'number', level: 'B1', point: 'hour', seg: [161.9, 167.5], keep: true,
      stem: 'When will the new asphalt be ready to bear weight?',
      choices: ['In half an hour', 'In an hour', 'In two hours'], a: 1,
      cue: 'bear weight のすぐあと。',
      line: 'The asphalt will bear weight *in an hour*.',
      said: '「アスファルトは1時間で重さに耐えられる」と伝える。',
      mean: 'bear weight ＝ 重さを支える。1時間後には車が通れる、ということ。',
      trap: 'in an hour は「イナナウア」とつながり、half や two を足して聞きやすい。h は発音しない。',
      use: 'I’ll be back in an hour.（1時間で戻ります）' },

    // anchor: 203.2–207 s "I will not pursue Diane. End of story." is undone at 241.8 s ("On the contrary") and 245.3
    //   s ("Please and thank you" to dinner): what he denies here is what he then accepts gladly
    // R fix: blind 60 %. "Got on his nerves" became the near miss "won him over": a soft spot, but for the kids.
    // why: daughters ← "her life is messy" heard as about her kids, and a soft spot moved onto them (wrong target);
    //   princess game ← he complained "not be mocked" earlier, so it sounds like the sore point
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'nottype', reveals: ['date'], seg: [184.0, 207.0],
      stem: 'As Ron insists Diane isn’t his type, what is he trying not to admit?',
      choices: ['That he likes her more than he lets on', 'That her daughters have won him over',
                'That the princess game embarrassed him'], a: 0,
      cue: '否定の数と、最後の End of story の強さ。',
      line: 'And B, *I did not like her*. She’s not my type. … I will not pursue Diane. *End of story*.',
      said: '「彼女を好きじゃない。タイプじゃない。生活がごちゃごちゃだ」と並べ、「追わない。以上」で打ち切る。',
      mean: '理由を重ねて話を打ち切るほど、本心が見える。あとで食事の誘いを喜んで受けるのが答え合わせ。',
      trap: 'messy を子どもの話と取りやすい。強い否定を重ねて話を切ったら、隠したい本心を疑う。',
      use: 'I’m not upset. End of story.（怒ってない。この話は終わり）', retired: true },

    // R fix: blind 50 %. Key reworded ("weren't welcome") so it isn't the only choice about the office.
    // why: forgot ← "don't recall" read literally (覚えていない); remind me ← the same literal reading, as a request
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'recall', seg: [187.6, 191.0],
      stem: 'What is Ron really telling his colleague with point “A”?',
      choices: ['You weren’t welcome to come in', 'I forgot that I’d asked you in', 'Remind me why you came in'], a: 0,
      cue: 'A, で始まる文の動詞。',
      line: 'A, *I don’t recall inviting you in here*.',
      said: '「まず第一に、君を部屋に招いた覚えはない」と言う。',
      mean: '覚えていない、の形で「勝手に入ってくるな」と言っている。遠回しの「出ていけ」。',
      trap: 'recall を文字どおり「思い出せない」と取りやすい。招いていない、が言いたいこと。',
      use: 'I don’t recall asking for your opinion.（意見を聞いた覚えはないけど）' },

    // R fix: blind 75 % ("scolded for another office's job" was weak against the praise in the segment). Now the
    //   praise heard as more road work.
    // why: more holes ← "Excellent work… particularly you, Ron" heard as a new assignment; a complaint ← Ron's own
    //   guess when she walks in
    { id: 'g2', skill: 'gist', level: 'B2', point: 'date', reveals: ['actually'], seg: [208.5, 250.6],
      stem: 'How does the pothole job end up for Ron?',
      choices: ['The citizen he helped asks him out', 'The citizen he helped comes to complain',
                'His boss sends him to fix more holes'], a: 0,
      cue: '廊下で待っていた人が来た理由。',
      said: '上司にほめられたあと、Diane がやって来て、苦情ではなく食事に誘う。',
      mean: '仕事のお礼が、デートの誘いに変わる結末。',
      trap: 'Ron 自身が「苦情なら」と言うので引かれやすい。そのあと Actually で中身が変わる。',
      use: 'Are you free for dinner Friday?（金曜の夜、食事どう？）' },

    // R fix: blind 50 % ("stresses that she means it" was weak). Now the Japanese 実は-as-shy-confession frame.
    // why: softens a complaint ← "Actually, …" often opens a polite objection; shy ← 実は… as the preface to a shy
    //   confession (the Japanese frame), though she is blunt right after
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', reveals: ['date'], seg: [224.6, 232.3],
      stem: 'After Ron guesses why Diane came, what does her first word do?',
      choices: ['It corrects his guess about why she came', 'It softens a small complaint she has',
                'It shows she is shy about asking him'], a: 0,
      cue: 'Ron の「苦情なら」のすぐあと、文頭の一語。',
      line: '*Actually*, I’m here to ask you out for dinner.',
      said: '「苦情なら」と言う Ron に、「実は、食事に誘いに来たの」と返す。',
      mean: '文頭の Actually ＝ 実は（あなたの思っているのとは違って）。相手の予想を正す。',
      trap: '「実は…」を照れの前置きと取りやすい。相手の予想のすぐあとなら「実は違う」の合図。',
      use: 'Actually, I came to say thanks.（実は、お礼を言いに来たの）' },

    // R fix: blind 50 %. "Prefer to ask her himself" became "doesn't mind, isn't thrilled": "No." caught, "On the
    //   contrary" lost.
    // why: scared ← "No." heard as a brave front before "On the contrary"; doesn't mind ← only the flat "No." is
    //   caught
    { id: 'i3', skill: 'infer', level: 'C1', point: 'contrary', seg: [232.2, 243.3],
      stem: 'What does Ron’s answer to “Does that freak you out?” show?',
      choices: ['He likes how direct she is', 'He is uneasy but hides it', 'He doesn’t mind, but isn’t thrilled'], a: 0,
      cue: 'No のあとに付け足す2語。',
      line: 'I’m a middle school vice principal. … Does that freak you out? — No. *On the contrary*.',
      said: '「私は中学の教頭。引いた？」に「いや、むしろ逆だ」と答える。',
      mean: 'On the contrary ＝ その反対。引くどころか、はっきりさが気に入った。',
      trap: 'No だけなら強がりにも聞こえる。on the contrary は「むしろ好ましい」まで言う。',
      use: 'Bored? On the contrary, I loved it.（退屈？とんでもない、最高だった）' },

    // anchor: 147.6–160 s "More rouge… not be mocked… your face is ridiculous": the makeup he wore at her house;
    //   "No need to wear makeup" is said to a man who would never wear it otherwise
    // R fix: blind 65 % (the key was the only specific, long choice). Now three parallel "a … that …" readings.
    // why: a real tip ← "it'll be casual" just before makes it sound like dress-code advice (sincerity flip); her own
    //   plan ← the remark heard as about herself (wrong target)
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'makeup', reveals: ['rouge', 'date'], seg: [243.1, 250.4],
      stem: 'What is Diane’s last remark about the date really about?',
      choices: ['A jab at the makeup he had on earlier', 'A real tip that the dinner is casual',
                'A joke that she won’t dress up either'], a: 0,
      cue: '男性に「化粧はいらない」と言う不思議さ。',
      line: 'Well, it’ll be casual. *No need to wear makeup*.',
      said: '「気楽な食事よ。お化粧はしなくていいから」と付け足す。',
      mean: '男性に化粧の話をするのは、プリンセスごっこでほお紅をつけられた件を持ち出すため。からかいの返し。',
      trap: '直前の casual から服装の注意と取りやすい。場面に合わない一言は、前の出来事を指すことが多い。',
      use: 'Dinner’s at six. Leave the tiara at home.（夕食は6時。ティアラは置いてきてね）', retired: true },

    // anchor: 243.7–246 s "So, dinner? — Please and thank you." just before: he said yes to a date he knows about
    // R fix: blind 50 %, and S4: the segment didn't hold its anchor. It now starts at "So, dinner?" (243.7 s); the
    //   key is reworded so it isn't the only "dry" choice. Moved up to keep clip order.
    // why: real confusion ← "I'm still not sure why" taken at face value (Ron as the oblivious one); a gripe ← "come
    //   speak with me in person" heard as a complaint about the channel she used
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'inperson', reveals: ['date'], seg: [243.1, 266.6],
      stem: 'After the dinner scene, how should we hear Ron’s “not sure why… in person”?',
      choices: ['As a dodge: he knows full well why she came', 'As real confusion: he missed that she liked him',
                'As a gripe: she should have just phoned'], a: 0,
      cue: '直前の食事の誘いへの返事と比べて。',
      line: 'I’m still *not sure why* the citizen decided to come speak with me *in person*',
      said: 'カメラに「なぜ市民がわざわざ直接話しに来たのかは分からないが、制度が機能してうれしい」と話す。',
      mean: '直前に喜んで誘いを受けている。分からないふりで恋の話を仕事の話にすり替える、Ron らしいとぼけ方。',
      trap: '言葉どおり鈍感と取りやすい。カメラへの一言は、直前の場面と比べて答え合わせをする。',
      use: 'No idea why she called. Anyway, work.（なぜ電話してきたのかな。とにかく仕事）', retired: true },
    // R fix: blind 70 % ("proud, as if it were his idea" was a filler). Now "success" heard without its hedges.
    // why: delighted ← "success" heard without "begrudgingly" and "moderate"; failing ← "moderate" heard as "poor"
    { id: 't2', skill: 'attitude', level: 'B2', point: 'begrudging', seg: [250.8, 257.1],
      stem: 'To the camera, how does Ron feel about praising the program?',
      choices: ['He hates admitting it, but he does', 'He’s delighted at how well it works',
                'He secretly thinks it is failing'], a: 0,
      cue: '文の最初、that の前までの言い方。',
      line: 'I *begrudgingly admit* that the… program is a *moderate success*.',
      said: '「しぶしぶ認めるが、あの制度はまあまあの成功だ」と話す。',
      mean: 'begrudgingly ＝ しぶしぶ。役所ぎらいの Ron が少しだけほめる。',
      trap: 'success だけだと大ほめ、moderate を「悪い」と取ると失敗に聞こえる。ほめ方の弱さを聞く。',
      use: 'I hate to admit it, but you were right.（認めたくないけど、君が正しかった）' },

    // why: 9-1-1 ← the number learners know best, same pattern; 4-1-1 ← "four" and the weak first syllable
    { id: 'n2', skill: 'number', level: 'B1', point: '311', seg: [250.8, 257.1], keep: true,
      stem: 'Which program does Ron call a moderate success?',
      choices: ['3-1-1', '4-1-1', '9-1-1'], a: 0,
      cue: 'the のすぐあとの数字3つ。',
      line: 'the *3-1-1* program is a moderate success.',
      said: '「311番の制度は、まあまあの成功だ」と言う。',
      mean: '311 は市民が役所に頼みごとを伝える番号。ここでは穴の通報のこと。',
      trap: '911 はよく知る数なので引かれやすい。three の th と、ナインの n の違いを聞く。',
      use: 'Call 3-1-1 to report a pothole.（道路の穴は311に通報を）' },

  ]
};
