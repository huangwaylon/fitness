// REVIEW 2026-11-16: pass 4, fix 17, drop 0, new 0; ear checks 3
// REVIEW Q: n1 (two broken legs): "legs" caps the count at two, so a blind guess is 50 %. Kept; retire it if that's too easy.
// “Leslie Knope's New Hairdo | Parks and Recreation” (the official Parks and Recreation channel, Season 1): Leslie
// gets a "political" hairdo for her mother's award night, takes Ann to the party, meets a former councilman who has his
// own idea about the two of them, and falls out with Ann over her mother's plan to lean on an official.
// Segments from the captions, words from whisper (2026-11-16). Left out, as the sources disagree: Leslie's first
// answer at 19 s (whisper "That depends", captions "nope"), "I'm way overdressed" at 63 s (captions "overpriced"), the
// councilman's and the official's names (captions "French novel", "Restrepo"; whisper "Frank Schnabel", "her stripo"),
// "Talonson style" at 156 s, the cut-off line about the official's husband at 145–150 s, and "You're allowed to fight"
// at 197 s (captions "you're all out to fight"). Also left out: who says "Salvatore usually does men" and "Leslie's new
// friend" at 116–124 s (no name settles it), and Ann's "Just friends… He's a man" reply. Ann is named at 79.6 s and
// 129.4 s, April at 46.4 s; the mother is never on the audio by name except "Marlene-something Knope".
// EAR CHECK: 139.4 s x1 — “blow us off” runs together (ブロウアソフ); both sources agree on the words
// EAR CHECK: 171.8 s s1 — “can't” with its t dropped before “let” (both sources have “can't”)
// EAR CHECK: 182.2 s nt1 — “Make any pancakes lately?”: “make”, not “made”, with no “did you” (both sources agree)
import type { Clip } from '../types.ts';

export const newHairdo: Clip = {
  id: 'newhairdo', video: 'C86lv4VbySE', title: 'Leslie Knope\'s New Hairdo', dur: 220, wpm: 151,
  band: 'mid', tags: ['友だち', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): the key was the only feeling-based reason. "Look just like her mom" is now "her mom
    //   asked her to look the part", which "I just wanted to mix things up" refutes.
    // why: a new job ← "my first official political haircut" + her title, "deputy director"; mom asked ← "my mom is
    //   being honored" heard as the mother's request, with "I just wanted" missed
    { id: 'g1', skill: 'gist', level: 'B1', point: 'honored', seg: [0, 39.5],
      stem: 'Why does Leslie want a special hairdo tonight?',
      choices: ['Her mom’s big honor feels like hers too', 'She is starting a new job in politics tonight',
                'Her mom asked her to look the part tonight'], a: 0,
      cue: '「Well, um」のあと、mom で始まる文。',
      line: 'my mom is being honored tonight, so *in a way, I am also being honored*.',
      said: '「今夜は母が表彰される。だからある意味、私も表彰される」と言う。',
      mean: '母の晴れ舞台を自分のことのように感じている。だから特別な髪型を頼んだ。',
      trap: 'political haircut から新しい仕事の話に聞こえやすい。理由は so の前後。',
      use: 'In a way, it’s my big night too.（ある意味、私の晴れ舞台でもある）' },

    // R fix: V2 (blind 60 %): the key was the only two-part contrast. "Too tired" is now "acts like a regular, and he
    //   plays along".
    // why: plays along ← "Classic Salvatore" heard as real familiarity, with "Do I know you? — Uh, no" missed; teasing
    //   ← "My feet hurt" + "Classic" heard as a running joke about his grumbling
    { id: 'h1', skill: 'humor', level: 'C1', point: 'scoop', seg: [1.3, 10.3],
      stem: 'Why does Leslie’s chat with Salvatore get a laugh?',
      choices: ['She acts like a regular, but he’s never met her', 'She acts like a regular, and he plays along',
                'She teases him for always grumbling to her'], a: 0,
      cue: 'Leslie の「Classic」のあとの、彼の質問。',
      line: 'So, what’s the inside scoop, Salvatore? — My feet hurt. — Classic Salvatore. — *Do I know you?* — *Uh, no.*',
      said: '常連のように話しかけるが、「知り合いだっけ？」と聞かれ「いいえ」と答える。',
      mean: 'なじみのふりが、相手の一言で崩れる。Leslie の背伸びが笑い所。',
      trap: 'Classic を聞くと本当に親しいと思いやすい。相手の質問が答え合わせ。',
      use: 'Sorry, do I know you?（すみません、お会いしたことありました？）' },

    // R fix: V2 (blind 55 %): "dislikes her politics" was weak. It's now "Confused: didn't know her mom had a
    //   daughter", from the question form and "Marlene-something".
    // why: wants to hear more ← he asked about the mother first, so he seems interested; confused ← his reply is a
    //   question, and "Marlene-something" sounds like he barely knows the family
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'related', seg: [16.3, 25.6],
      stem: 'How does Salvatore take Leslie’s answer about her mother?',
      choices: ['Impatiently: of course a daughter is related', 'Kindly: he wants to hear more about her mother',
                'Confused: he didn’t know her mom had a daughter'], a: 0,
      cue: '彼の返事が、質問の形をしている理由。',
      line: 'Would you call being her daughter related? — *What the hell else would you call it?*',
      said: '「娘って親戚に入ります？」と聞き返すと、「それ以外に何と呼ぶんだ」と返される。',
      mean: '当たり前のことをもったいぶって聞かれ、いらだっている。',
      trap: '母について先に聞いたので興味ありと取りやすい。the hell else は強いいらだち。',
      use: 'What else would you call it?（それ以外に何て言うの？）' },

    // R fix: V2 (blind 75 %): the key was the only choice as detailed as the line. All three are now "shape, X but Y".
    // why: simple and elegant ← "pin it up" caught, the adjectives missed and filled in with a party default; worn
    //   down ← "mix things up" heard as a change from her usual style
    { id: 'd2', skill: 'detail', level: 'B1', point: 'style', seg: [32.2, 39.5],
      stem: 'What kind of hairdo does Leslie ask for?',
      choices: ['Pinned up, sassy but powerful', 'Pinned up, simple and elegant', 'Worn down, sassy but soft'],
      a: 0,
      cue: '「you know」のあと、髪の形と形容詞。',
      line: '*Pin it up*, something *sassy, but powerful* and dynastic.',
      said: '「アップにして。生意気だけど力強くて、王朝っぽく」と頼む。',
      mean: 'pin it up ＝ 髪を上げてとめる。政治家一家らしい堂々とした髪型が希望。',
      trap: '形容詞を聞き逃すと、無難な髪型を想像しやすい。pin up のあとの二語まで聞く。',
      use: 'Could you pin it up for me?（アップにしてもらえますか）' },

    // R fix: V2 (blind 60 %): "no longer April's boss" was weak. It's now "would rather be called ma'am", a gender
    //   reading of "don't call me sir".
    // why: in a rush ← "clock" heard as time pressure (時間に追われる); ma'am ← "don't need to call me sir" heard as
    //   a correction of the title, with "off the clock" missed
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'clock', seg: [45.4, 52.6],
      stem: 'Why does Leslie tell April not to call her “sir”?',
      choices: ['She isn’t at work right now', 'She is in a rush tonight', 'She would rather be called ma’am'], a: 0,
      cue: '「No」のあと、I’m に続く言い方。',
      line: 'I’m *off the clock*, April. You don’t need to call me sir.',
      said: '「今は勤務時間外よ、エイプリル。サーなんて呼ばなくていい」と言う。',
      mean: 'off the clock ＝ 仕事の時間外。職場の呼び方はいらない、という意味。',
      trap: 'clock から「急いでいる」と取りやすい。off the clock は勤務の外。',
      use: 'I’m off the clock, so call me Ken.（勤務外だから、ケンでいいよ）' },

    // R fix: V2 (blind 50 %): the key was the only mayor choice. "Mom's award" is now "when she first runs for mayor",
    //   which "when I am the first female mayor" refutes.
    // why: every event ← "Salvatore calls this hairdo the mayor" heard as an everyday name; runs for mayor ← "mayor"
    //   + "first" caught, the "when I am" missed
    { id: 'd3', skill: 'detail', level: 'B1', point: 'mayor', seg: [52.4, 60.0],
      stem: 'When does Leslie say she will wear her hair this way?',
      choices: ['When she becomes the town’s first woman mayor', 'At every city event she goes to from now on',
                'When she first runs for mayor of the town'], a: 0,
      cue: '「And yes」のあと、when に続く部分。',
      line: 'Salvatore calls this hairdo *the mayor*. … I will wear my hair like this *when I am the first female mayor* of Pawnee.',
      said: '「この髪型の名前は『市長』。初の女性市長になったら、この髪にする」と言う。',
      mean: '髪型の名前に夢を重ねている。目標は町で初めての女性市長。',
      trap: '髪型の名前だけ聞くと、ただのあだ名に聞こえる。when のあとが答え。',
      use: 'I’ll wear this when I get the job.（採用されたらこれを着る）' },

    // R fix: V2 (blind 60 %): "hot and crowded" was absurd. It's now "stuck-up and cold", which takes the elite sense
    //   of "rarefied" the wrong way (she says it in awe, "Oh").
    // why: stuck-up ← "rarefied" known as "exclusive" and heard as a dig; rarely seen ← "rare" heard inside
    //   "rarefied"
    { id: 'ph3', skill: 'phrase', level: 'C1', point: 'rarefied', seg: [74.6, 80.8],
      stem: 'What does Leslie mean about the people at the party?',
      choices: ['They are very important, top-level people', 'They are a bit stuck-up and cold to others',
                'They are people she almost never sees'], a: 0,
      cue: '元市議を見つけたあと、空気の話。',
      line: 'That’s former city councilman… Oh, *we’re in rarefied air* tonight, Ann.',
      said: '「あれは元市議よ。今夜は特別な空気の中にいるわね」と言う。',
      mean: 'rarefied air ＝ 一部の上の人だけがいる世界。元市議を見て舞い上がっている。',
      trap: '気取った人への皮肉にも聞こえるが、直前の Oh は感激。rare の音にも引かれやすい。',
      use: 'Wow, we’re in rarefied air here.（すごい、ここは別世界だね）' },

    // R fix: V2 (blind 65 %): the key was the only "the two of them" choice. "New to politics" is now "running for
    //   office", from “brave” and the political party.
    // why: a brave hairdo ← "brave" said to a woman with a striking new hairdo, plus "being who you are"; running for
    //   office ← "what you two are doing is so brave" at a political party, with "being who you are" missed
    { id: 'i1', skill: 'infer', level: 'C1', point: 'couple', reveals: ['legs'], seg: [85.8, 100.3],
      stem: 'What does the councilman seem to think about Leslie and Ann?',
      choices: ['That the two of them are a couple', 'That Leslie’s bold new hairdo is brave',
                'That the two of them are running for office'], a: 0,
      cue: '「you two」と、そのあとの「who you are」。',
      line: 'what *you two* are doing is so brave… just *being who you are*. I wish I had your courage.',
      said: '「お二人のしていることは勇敢だ。ありのままで。私も勇気がほしい」と言う。',
      mean: '二人をカップルだと思い込んでいる。being who you are はその決まった言い方。',
      trap: '髪型をほめていると取りやすい。you two とあるので、二人についての話。',
      use: 'Just be who you are.（ありのままでいて）' },

    // why: drive Ann home ← "He left with Tom" + Ann standing there, so a ride seems to be the issue; meet her mom ←
    //   her mother is the night's honoree
    { id: 'd4', skill: 'detail', level: 'B1', point: 'mark', seg: [129.2, 135.35],
      stem: 'Why is Leslie looking for Mark?',
      choices: ['She needs his help with a hard task', 'She wants him to drive Ann home tonight', 'She wants him to meet her mom'],
      a: 0,
      cue: '「Shoot」のあと、I need に続く部分。',
      line: 'Shoot, I have a *tough assignment*, and *I need his help* with it.',
      said: '「しまった。難しい仕事があって、彼の助けが要るのに」と言う。',
      mean: 'shoot ＝ しまった（軽い言い方）。母から頼まれた仕事に、マークの力を借りたかった。',
      trap: '直前の「トムと帰った」から送り迎えの話に聞こえやすい。理由は I need のあと。',
      use: 'Shoot, I left my phone at home.（しまった、スマホを家に忘れた）' },

    // R fix: V2 (blind 60 %): "ask nicely" was weak. It's now "trick her into giving in", another kind of unfair push.
    // why: hurt her ← "twist her arm" taken literally (腕をひねる); trick ← "twist" heard as twisting the truth
    //   (話をねじ曲げる)
    { id: 'ph4', skill: 'phrase', level: 'B2', point: 'twist', seg: [135.3, 143.0],
      stem: 'What does Leslie’s mom plan to do to the woman?',
      choices: ['Put pressure on her to give in', 'Hurt her a little to scare her', 'Trick her into giving in'],
      a: 0,
      cue: '「my mom has a plan」のあと。',
      line: 'my mom has a plan. We’re gonna *twist her arm* a little bit.',
      said: '「母に作戦がある。少し腕をひねってやるの」と言う。',
      mean: 'twist someone’s arm ＝ 無理に言うことを聞かせる。体に手を出す意味ではない。',
      trap: '文字通り「腕をひねる」と取りやすい。a little bit で柔らかいが、中身は圧力。',
      use: 'Okay, you twisted my arm. One more.（わかった、負けたよ。もう1杯）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'blowoff', seg: [137.3, 140.45],
      stem: 'Type the words: “…is trying to ___, so my mom has a plan.” (3 words)', answer: 'blow us off',
      cue: '「trying to」のすぐあと。3語がつながる。',
      line: 'apparently… is trying to *blow us off*, so my mom has a plan.',
      said: '「どうやら、あの人が私たちを避けようとしているらしい」と言う。',
      mean: 'blow someone off ＝ 相手を無視する、すっぽかす。us が間に入る。',
      trap: 'blow‿us‿off がつながり「ブロウアソフ」。us は弱く、ほぼ「ア」だけ。',
      use: 'He totally blew me off yesterday.（昨日、完全にすっぽかされた）' },

    // R fix: V2 (blind 65 %): "impress the councilman" was weak. It's now "secretly enjoys playing dirty", from “slimy”.
    // why: too soft ← "That doesn't sound tough to me" taken literally, as "not tough enough"; enjoys it ← "slimy"
    //   heard as a judgment of Leslie herself, with "your mom's telling you" missed
    { id: 'i2', skill: 'infer', level: 'B2', point: 'mom', reveals: ['slimy'], seg: [149.8, 160.8],
      stem: 'What does Ann think is really going on with Leslie?',
      choices: ['She just does what her mom tells her', 'She’s too soft to stand up to the woman',
                'She secretly enjoys playing dirty'], a: 0,
      cue: '最後の「It sounds like」のあと。',
      line: 'That sounds slimy. *It sounds like your mom’s telling you to be slimy*.',
      said: '「ずるく聞こえる。お母さんにずるくなれと言われてるみたい」と言う。',
      mean: 'アンは、計画の元は母親だと見ている。後の「全部お母さんの言う通り？」につながる。',
      trap: 'doesn’t sound tough を「強さが足りない」と取りやすい。評価は slimy。',
      use: 'That sounds a little shady to me.（それ、ちょっと怪しく聞こえる）' },

    // anchor: 150.9–158.7 s "So you're gonna blackmail her? — No… I'm just gonna get tough with her — That doesn't
    //   sound tough to me. That sounds slimy.": Ann names the plan blackmail, then sets "slimy" against "tough"
    // R fix: V2 (blind 55 %): the key was the only "isn't X; it's Y" choice. "Tough and uneasy" is now "isn't
    //   strength; it's just plain rude" (slimy = sneaky, not rude).
    // why: not tough enough ← "doesn't sound tough to me" read literally, as too weak (right target, wrong direction);
    //   rude ← "slimy" known only as "nasty", so a manners complaint, not dishonesty
    // retired: for the draws (play 3+ under a gist drew no C2): g2 reveals its point
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'slimy', seg: [149.8, 159.2], retired: true,
      stem: 'Which plain-English version keeps what Ann means about “getting tough”?',
      choices: ['“That isn’t strength; it’s a dirty trick.”', '“That isn’t tough enough to work on her.”',
                '“That isn’t strength; it’s just plain rude.”'], a: 0,
      cue: 'tough を打ち消したあとの、別の形容詞。',
      line: 'So you’re gonna blackmail her? … — *That doesn’t sound tough to me. That sounds slimy.*',
      said: '「脅すの？」と聞き、「強気なだけ」と言われ「強気じゃなく、ずるい」と返す。',
      mean: 'not X, but Y の形で言いかえを退ける。tough はほめ言葉、slimy は汚いやり方。',
      trap: 'doesn’t sound tough を「強さが足りない」と取りやすい。打ち消しの後の語が本当の評価。',
      use: 'That’s not smart, that’s just lucky.（それは賢いんじゃなくて、運がいいだけ）' },

    // R fix: V2 (blind 75 %): "stay at the party" was weak, and the key was the only one about the mother. It's now
    //   "help her mom at all" (Ann objects to the method, "slimy", not to helping).
    // why: the boyfriend ← the boyfriend jabs ("pancakes", "crutches") fill the end of the fight; help at all ←
    //   "bad advice" heard as against the whole plan, not its dirtiness
    { id: 'g2', skill: 'gist', level: 'B2', point: 'fight', reveals: ['slimy', 'mom', 'backatyou'], seg: [149.8, 192.2],
      stem: 'What are Leslie and Ann arguing about at the party?',
      choices: ['Whether Leslie should play dirty for her mom', 'Whether Ann should have brought her boyfriend',
                'Whether Leslie should help her mom at all tonight'], a: 0,
      cue: 'blackmail の質問から始まる言い合い。',
      said: 'アンは「ずるい、母親の言いなり」と言い、レスリーは「政治は違う」と返し、互いを責め合う。',
      mean: '中心は、母の作戦で汚い手を使うかどうか。彼氏の話は言い返しの中で出たもの。',
      trap: '終わりの彼氏の話が強く残る。言い合いのきっかけは、最初の blackmail。',
      use: 'Let’s not fight about this.（このことでケンカはやめよう）' },

    // R fix: V2 (blind 60 %): "risky" was weak. It's now "simple, meaning it kindly", the sincere reading of "easy".
    // why: respect ← "Look" + "nursing" heard as the start of praise (相手の仕事を立てる前置き); kindly ← "easy" heard as
    //   a plain contrast, with "you don't understand politics" and "just" missed
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'nursing', seg: [160.4, 167.85],
      stem: 'How does Leslie talk to Ann about Ann’s own job?',
      choices: ['As if it were simple, talking down to her', 'As if it were hard, with real respect',
                'As if it were simple, meaning it kindly'], a: 0,
      cue: '「Look」のあと、仕事の説明の短さ。',
      line: 'you don’t understand politics. Look, *nursing is easy*. … You *just* go to work, and people come in, and you heal them.',
      said: '「政治が分かってない。看護は簡単。出勤して、来た人を治すだけ」と言う。',
      mean: '相手の仕事を軽く見て、上から話している。アンの Really? はあきれた返事。',
      trap: 'Look を聞くと、ほめる前置きと取りやすい。中身の easy と just が見下し。',
      use: 'It’s not as easy as it looks.（見た目ほど簡単じゃない）' },

    // R fix: V2 (blind 55 %): the key was the only "Being ready to…" choice. "Putting up with pain" is now "Being ready
    //   to take hard hits" (bring vs take).
    // why: take hits ← "the pain" heard as something you suffer, not deal out; hard truths kindly ← the
    //   nurse-and-patient frame from the line before
    { id: 'ph5', skill: 'phrase', level: 'B2', point: 'pain', seg: [167.5, 173.35],
      stem: 'What does Leslie say politics sometimes needs?',
      choices: ['Being ready to hit people hard', 'Being ready to take hard hits', 'Telling people hard truths kindly'],
      a: 0,
      cue: '「sometimes you have to」のあと。',
      line: 'sometimes you have to *bring the pain*.',
      said: '「時には痛い目にあわせなきゃいけない」と言う。',
      mean: 'bring the pain ＝ 相手に手かげんせず、強く攻める。スポーツなどでよく聞く言い方。',
      trap: 'pain から「我慢する」側と取りやすい。bring は相手に持っていく、つまり与える側。',
      use: 'Our team is ready to bring the pain.（うちのチームは本気で攻めるよ）' },

    // R fix: V2 (blind 60 %): "could" failed on grammar. "don't" is now a second negative that fits the advice.
    // why: can ← the t of can't drops before "let"; don't ← a negative is caught, and the vowel is misheard
    { id: 's1', skill: 'sound', level: 'B2', point: 'cant', seg: [167.5, 173.35],
      stem: 'Fill the gap: “You ___ let yourself get taken advantage of.”',
      choices: ['can', 'can’t', 'don’t'], a: 1,
      cue: 'You のすぐあと、母音の長さと強さ。',
      line: 'You *can’t* let yourself get taken advantage of.',
      said: '「利用されるままではだめ」と言う。can’t の t はほぼ消える。',
      mean: 'take advantage of ＝ 弱みにつけこむ。',
      trap: 't が消えると can に聞こえやすい。can’t は母音が長く強く、can は弱く短い。',
      use: 'Don’t let them take advantage of you.（つけこまれないで）' },

    // R fix: V2 (blind 65 %): "lighter subject" was weak. It's now "agrees, then jokes about Ann's boyfriend", which
    //   her "I don't think so" just before refutes.
    // why: admits it ← a question answered with a question heard as a real one; agrees then jokes ← "boyfriend" +
    //   "pancakes" heard as a joke after a yes
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'backatyou', seg: [173.2, 183.95],
      stem: 'When Ann asks if she obeys her mom, what does Leslie’s reply do?',
      choices: ['Throws the same charge back at Ann', 'Admits she does, and asks Ann’s view',
                'Agrees, then jokes about Ann’s boyfriend'], a: 0,
      cue: 'アンの質問と、返事の形を比べる。',
      line: 'You just do everything your mom tells you to do? — *You just do everything your boyfriend tells you to do?*',
      said: '「何でもお母さんの言う通り？」と聞かれ、「何でも彼氏の言う通り？」と同じ形で返す。',
      mean: '同じ文の形で言い返す反撃。相手の弱点を指して、立場を入れかえる。',
      trap: '質問の形なので本当に聞いていると取りやすい。同じ形のくり返しは言い返しの印。',
      use: 'Oh yeah? Look who’s talking.（よく言うよ、そっちこそ）' },

    // anchor: 182.2–183.5 s "Make any pancakes lately?": both sources have "make", with no "did you" or "have you"
    //   before it, tacked onto the end of a fast jab
    // retired: one C2 alone is under 2 (nt2 retired)
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'pancakes', seg: [179.95, 184.05], retired: true,
      stem: 'Type Leslie’s jab: “___ lately?” (3 words)', answer: 'make any pancakes',
      cue: '「boyfriend tells you to do?」のすぐあと。',
      line: '*Make any pancakes* lately?',
      said: '「最近パンケーキ作ってる？」と付け足す。彼氏の言いなりだ、というからかい。',
      mean: '会話では Did you や Have you がよく落ち、いきなり動詞で始まる。',
      trap: 'lately があるので made や have made に直したくなる。書き取りは、言われた音を書く。',
      use: 'Get any sleep last night?（昨夜は眠れた？）' },

    // R pass, note: blind 50 % only because "legs" caps the count at two; nothing else in the item gives it away.
    // why: three ← "three crutches" comes right after; one ← a broken leg is the usual case, and "has" sounds singular
    { id: 'n1', skill: 'number', level: 'B1', point: 'legs', seg: [179.95, 187.7], keep: true,
      stem: 'How many broken legs does Ann’s boyfriend have?',
      choices: ['One', 'Two', 'Three'], a: 1,
      cue: '「pancakes」のあと、アンの答えの数。',
      line: 'He has *two broken legs*. — Yeah, and he’s got three crutches.',
      said: '「彼は両脚を骨折しているの」とアンが言い返す。',
      mean: 'だから料理を作るのは当然、という反論。two broken legs ＝ 両脚の骨折。',
      trap: '直後に three crutches が来るので、最後に聞こえた数に引かれやすい。話し手を分ける。',
      use: 'I broke my leg skiing.（スキーで脚を骨折した）' },

    // R fix: V2 (blind 65 %): "one more crutch" was absurd. It's now "faking how badly he's hurt", from three crutches
    //   for two legs.
    // why: more help ← "three crutches" heard as too much need; faking ← three crutches for two broken legs heard as
    //   exaggeration, with "one of them is you" missed
    { id: 'h3', skill: 'humor', level: 'C1', point: 'crutch', reveals: ['legs'], seg: [185.3, 190.2],
      stem: 'What is Leslie saying with her “three crutches” line?',
      choices: ['He leans on Ann as much as on his crutches', 'He needs far more help than Ann can give him',
                'He is faking how badly hurt he really is'], a: 0,
      cue: '「one of them is」のあと。',
      line: 'Yeah, and he’s got *three crutches*. And *one of them is you*. And the other two are crutches.',
      said: '「松葉づえが3本ある。1本はあなた、残り2本が松葉づえ」と言う。',
      mean: 'アンを松葉づえにたとえ、彼に頼られ使われていると皮肉る。最後の言い直しが落ち。',
      trap: '数の話に聞こえて、本数を考えやすい。one of them is you で人をたとえている。',
      use: 'He uses you like a crutch.（彼はあなたをつえみたいに頼ってる）' },
  ]
};
