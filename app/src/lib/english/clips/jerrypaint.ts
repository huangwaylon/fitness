// “Tom reacts to Jerry's lewd painting | Parks and Recreation” (the official Parks and Recreation channel, Season 3):
// Jerry's mural of a centaur goddess turns out to have Leslie's face, and Tom is the baby in it; Leslie loves it and
// has it hung, Tom mourns his lost cool in a talking head, and when a citizen, Marsha, demands it be destroyed, the
// office hedges and Leslie vows to keep it.
// Segments from the captions, words from whisper (2026-11-16). Untested: 26–38 s (the "topless" line; the captions
// have "at night" where whisper has "and like"), 85.5–96 s (the greeting and "it's hot"), 134–159 s (Marsha's "animal
// porn" and "who had sex with what"; d6 plays 141.5–148.4 s but keys only on the apology), 166–171 s ("Destroy it",
// missing from the captions), 207 s on (music; whisper loops one line). Named in the audio: Jerry (12.8 s), Leslie
// (16.9 s), Tom (72.5, 85.2, 109.2 s), Chris (132.5 s), Miss Langman / Marsha (159.7, 191.6 s). No item turns on who
// is speaking.
// REVIEW 2026-11-16: pass 8, fix 16, drop 0, new 0; ear checks 3
// OPEN: the clip's core edges on GUIDE §2's sexual-content skip ("lewd painting", "animal porn", "who had sex with
//   what"). No item keys on those lines, but d6, g3 and nt1 play near them. Keep the clip, or skip it?
// EAR CHECK: 82.9 s s1 — “we gotta” (captions) / “we got to” (whisper): is it the reduced “gotta”?
// EAR CHECK: 97.1 s x1 — “This guy's in it, too” (both agree): is “guy's in it” linked as claimed?
// EAR CHECK: 129.6 s x2 — “not as cool of a vibe” (both agree): are all six words audible at speed, “of a” included?
import type { Clip } from '../types.ts';

export const jerryPainting: Clip = {
  id: 'jerrypaint', video: '6J4qQMWnqio', title: "Tom reacts to Jerry's lewd painting", dur: 228, wpm: 181,
  band: 'fast', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: saving ← slaying/saving differ by one sound, and a goddess "saving" fits a myth; riding a horse ← "centaur"
    //   is heard, and a centaur is half horse
    { id: 'd1', skill: 'detail', level: 'B2', point: 'myth', seg: [0.8, 10.0],
      stem: 'What does Jerry say his painting shows?',
      choices: ['A goddess saving a great deer', 'A goddess killing a great deer', 'A goddess riding a great horse'],
      a: 1,
      cue: '「goddess」のあと、動詞と最後の一語。',
      line: 'the centaur goddess…, *slaying a great stag*.',
      said: 'ギリシャ神話から、半人半馬の女神が大きな雄鹿を倒す場面を選んだ、と説明する。',
      mean: 'slay ＝ 殺す・倒す（やや古風）。stag ＝ 雄の鹿。',
      trap: 'slaying と saving は一音ちがい。centaur で馬を思いやすいが、女神自身が半分馬。',
      use: 'It’s based on an old Greek myth.（古いギリシャ神話がもとです）' },

    // why: pleased → take down ← the "lewd" title suggests she'd want it gone after a first laugh; shocked → fine with
    //   removal ← Jerry's apology and offer are the expected end of the scene
    // R fix: C5 — the key ("eager to keep it up") also answers p3 (the painting stays), so it reveals `anywhere` too.
    { id: 'g1', skill: 'gist', level: 'B1', point: 'react', reveals: ['leave', 'anywhere'], seg: [15.5, 56.0],
      stem: 'How does Leslie’s reaction to the painting change?',
      choices: ['Pleased at first, then eager to take it down', 'Shocked at first, then fine with taking it down',
                'Shocked at first, then eager to keep it up'], a: 2,
      cue: '最初の一言と、謝罪のあとの返事。',
      line: 'Oh, my God. … That’s me. … *Leave it up*. … *I love it*.',
      said: '自分が描かれていると気づいて驚くが、謝って外そうとするジェリーに「そのままで。気に入った」と言う。',
      mean: '驚きから一転、絵を気に入って飾っておきたいという流れ。',
      trap: '謝罪のあとは「外して」が普通の流れなので、そう予想しやすい。No のあとの返事で決まる。',
      use: 'Leave it. I actually like it.（そのままでいいよ。実は気に入ってる）' },

    // R fix: V2/K6 — blind 55 %: the key was the only two-part, "it just happened" choice. All three now pair powerful
    //   women with how she came out (on purpose / by accident / on request).
    // why: on purpose ← "powerful women" + "you" heard as a tribute to his boss; asked for ← "I've been thinking" missed,
    //   a commission is the usual reason for a portrait
    { id: 'd3', skill: 'detail', level: 'B2', point: 'why', seg: [38.3, 50.4],
      stem: 'How does Jerry explain painting Leslie?',
      choices: ['He admires powerful women, so he chose her on purpose',
                'He was thinking about powerful women, and she just came out',
                'He was asked for a powerful woman, and she came to mind'], a: 1,
      cue: '文の後半、painted の直前の一語。',
      line: 'I’ve been *thinking a lot about powerful women*, and *subconsciously* I painted you.',
      said: '強い女性のことを考えていて、無意識にレスリーを描いた、と謝る。',
      mean: 'subconsciously ＝ 無意識に。わざとではない弁解。',
      trap: 'powerful と you で「尊敬して描いた」と取りやすい。subconsciously が意図を消す。',
      use: 'I didn’t mean to. It just happened.（わざとじゃないの、つい）' },

    // why: drop it ← "leave it" = そっとしておく, as in "leave it, it's fine"; let her decide ← "leave it up to me" is a
    //   common chunk, and "to" is easy to imagine after "up"
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'leave', seg: [48.4, 55.9],
      stem: 'When Jerry offers to remove it, what does Leslie ask for?',
      choices: ['That it stay up on the wall, just as it is', 'That he drop the subject and stop apologizing',
                'That the choice of what to do be left to her'], a: 0,
      cue: '「No」のすぐあと、三語の命令。',
      line: 'I’m going to take it right down. — No. *Leave it up*.',
      said: '「すぐ外します」に「だめ、掛けておいて」と返す。',
      mean: 'leave it up ＝ 掛けたままにしておく。take it down（外す）の反対。',
      trap: 'leave it up to me（任せて）と混ざりやすい。to はなく、down と up の対比。',
      use: 'Leave the lights on, please.（電気はつけたままでお願い）' },

    // R fix: V2 — blind 60 %: "a woman who can do anything" was the only feeling-about-herself choice. Now three
    //   "It makes her…" readings; "Jerry's talent" (outside the segment) is out.
    // why: young and beautiful ← a flattering portrait is the usual reason to love one (and "it's hot" comes later);
    //   looked up to ← being painted as a goddess by a coworker sounds like a tribute
    { id: 'i3', skill: 'infer', level: 'B2', point: 'power', seg: [53.9, 62.7],
      stem: 'From what Leslie says, why does she love the painting?',
      choices: ['It makes her look young and beautiful', 'It makes her feel she can do anything',
                'It makes her feel others look up to her'], a: 1,
      cue: '「think to myself」のあとの自問。',
      line: 'Every time I look at it, I just think to myself, *what can’t that centaur woman do?*',
      said: '「見るたびに、あの女性にできないことなんてある？と思う」。',
      mean: '何でもできる、という反語。強い自分に見えるのがうれしい。',
      trap: '肖像画を喜ぶ理由は見た目、と考えやすい。what can’t … do? は「何でもできる」の決まった形。',
      use: 'Is there anything she can’t do?（彼女にできないことってある？）' },

    // R fix: V2/K6 — blind 60 %: the key was the only choice that explained a mechanism. All three now "list what a
    //   half-horse…" (can't do / can do in town / would love to do), so "Besides" decides.
    // why: can do in town ← escalator and car heard as a modern woman's skills, with "Besides" missed; would love to ←
    //   the list heard as her wishes, not as exceptions
    { id: 'h1', skill: 'humor', level: 'C1', point: 'centaur', reveals: ['power'], seg: [59.5, 70.3],
      stem: 'Why does Leslie’s follow-up to her own question get a laugh?',
      choices: ['She lists what a half-horse would love to do', 'She lists what a half-horse can do in town',
                'She lists what a half-horse can’t really do'], a: 2,
      cue: '自分の問いのすぐあと、「Besides」で始まる部分。',
      line: 'what can’t that centaur woman do? *Besides ride an escalator and drive a car*.',
      said: '「できないことなんてある？」と言った直後に、「エスカレーターと車の運転以外は」と付け足す。',
      mean: '大げさな反語に、馬の体では無理なことを真顔で答えてしまうのがおかしい。',
      trap: '車の運転を「できること」と取りやすい。Besides は「〜以外は」の例外。',
      use: 'Besides that, it’s perfect.（それ以外は完璧）' },

    // R fix: V2/K6 — blind 50 %: "Even more delighted" was the only positive choice. "Take it down" is replaced by a
    //   lukewarm reading of "easily" (the note's own trap).
    // why: sorry ← "Oh my God" and "What?" heard as concern for the person shown; polite but less keen ← easily heard
    //   as 「何となく」, a weak liking
    { id: 't2', skill: 'attitude', level: 'B1', point: 'favorite', seg: [70.4, 77.0],
      stem: 'Once someone recognizes the baby, how does the next comment sound?',
      choices: ['Sorry for the one painted as the baby', 'Even more delighted with the painting',
                'Polite about it, but a little less keen'], a: 1,
      cue: '「What?」のあとの、短いほめ言葉。',
      line: 'This is *easily my favorite painting ever*.',
      said: '赤ちゃんがトムだと分かると、「これは文句なしに史上最高の絵」と言う。',
      mean: 'easily ＝ 文句なしに。他人が笑われる側になって、さらに上機嫌になった。',
      trap: 'easily を「簡単に・何となく」と軽く取ると、気持ちが弱く聞こえる。最上級の前なら強調。',
      use: 'This is easily the best pizza in town.（町で文句なしに一番のピザ）' },

    // why: angry ← "What the hell, Jerry?" opens his turn, so anger is easy to put in the picture; skinny ← "pot belly"
    //   not known, "baby" suggests small
    { id: 'd4', skill: 'detail', level: 'B2', point: 'belly', seg: [77.0, 82.4],
      stem: 'How does Tom say he looks in the painting?',
      choices: ['Chubby and angry', 'Chubby and frightened', 'Skinny and frightened'], a: 1,
      cue: '「Look at my」から「scared」まで。',
      line: 'Look at my *pot belly*. … And why am I *so scared*?',
      said: '「この太鼓腹を見ろ」「なんでおびえてるんだ」と文句を言う。',
      mean: 'pot belly ＝ ぽっこりお腹。scared ＝ おびえた。絵の自分への不満。',
      trap: '最初の What the hell で怒った顔を想像しやすいが、怒っているのは本人。絵はおびえ顔。',
      use: 'I’ve got a bit of a pot belly.（ちょっとお腹が出てきた）' },

    // why: ought to ← "ought to" ≈ オーラ, close to gotta's ガラ; we're gonna ← the same "-na/-ta" ending, a plan, not a
    //   need
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotta', seg: [80.6, 85.4],
      stem: 'Fill the gap: “All right, ___ take this down now.”',
      choices: ['we gotta', 'we ought to', 'we’re gonna'], a: 0,
      cue: '「All right」の直後、短くつながる二語。',
      line: 'All right, *we gotta* take this down now.',
      said: '「よし、今すぐこれを外さないと」。got to が gotta に縮む。',
      mean: 'gotta ＝ have got to。t が弾んで「ガラ」に近く聞こえる。',
      trap: 'ought to も「オーラ」と似る。語頭の g の音があるかで聞き分ける。',
      use: 'I gotta go. Talk later.（もう行かなきゃ、またね）' },

    // R fix: K1/V2 — blind 55 %. "It won't be shown anywhere else" is compatible with the key (it stays here), so a
    //   fluent listener could defend it. Replaced by "not right now" (Tom's "now" + "No").
    // why: not right now ← "No" heard as "not now", echoing Tom's "take this down now"; getting nowhere ← "This isn't
    //   going anywhere" (= no progress) is a common chunk
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'anywhere', seg: [82.3, 85.4],
      stem: 'When Tom wants it removed, what does the reply mean?',
      choices: ['It can come down, just not right now', 'It’s staying right where it is',
                'This argument is getting them nowhere'], a: 1,
      cue: '「No」のあと、主語の this painting に続く部分。',
      line: 'No, this painting *isn’t going anywhere*, Tom.',
      said: '「外さないと」に「この絵はどこにも行かないよ」と返す。',
      mean: 'isn’t going anywhere ＝ ここにあり続ける。外させない宣言。',
      trap: 'This isn’t going anywhere（話が進まない）と同じ形。主語が絵なら「動かない」。',
      use: 'Don’t worry, I’m not going anywhere.（心配しないで、ずっとここにいるよ）' },

    // R fix: S4 — 96.6 s cut "you" (96.42 s in the captions); the segment now starts before "thank you".
    { id: 'x1', skill: 'dict', level: 'B1', point: 'guy', seg: [95.7, 99.8],
      stem: 'Type the words before “too”. (4 words)', answer: 'this guy\'s in it',
      cue: 'little fat baby の前の文。',
      line: '… *this guy’s in it*, too.',
      said: '「この人も絵に入ってるよ」と、トムを指して言う。',
      mean: 'guy’s in it が「ガイズィニッ」と一続き。最後の t はほぼ聞こえない。',
      trap: 'つながると in it が一語に聞こえ、guys（複数）とも取りやすい。is の z が次の母音につく。',
      use: 'My sister’s in it, too.（妹も出てるよ）' },

    // why: modest ← the Japanese frame: turning down thanks as 謙遜; fixed it herself ← "Thank her" heard as "she did
    //   the work"
    { id: 'i2', skill: 'infer', level: 'B2', point: 'light', seg: [102.8, 114.0],
      stem: 'Why is the thank-you for the light passed on to someone else?',
      choices: ['Taking credit would seem a bit rude', 'She was the one who fixed it herself',
                'She refused to leave until it was done'], a: 2,
      cue: '「Good morning」のあと、this morning の話。',
      line: 'She *marched into my office*… and told me she *wouldn’t leave until I got this done*.',
      said: '照明の修理に礼を言われ「彼女に言って」。終わるまで帰らないと乗り込んできた、と。',
      mean: 'march into ＝ ずかずか乗り込む。強く押したのは彼女、という説明。',
      trap: '日本語の謙遜で「手柄を譲った」と取りやすい。すぐあとの説明が理由になっている。',
      use: 'Don’t thank me, thank her.（私じゃなくて彼女にお礼を）' },

    // R fix: V2 — blind 60 %: "Bitterly… feels awful" was the only reading tied to a reason in the scene. Each choice now
    //   gives a reason from the moment (the light, small talk, his own day).
    // why: warm ← "glad" taken at face value, the light has just been fixed; polite small talk ← the Japanese frame: a
    //   reply to a greeting heard as a set phrase
    { id: 't3', skill: 'attitude', level: 'C1', point: 'someone', seg: [113.9, 117.2],
      stem: 'How is the reply to “Good morning, Tom” meant?',
      choices: ['Warmly; he is glad the light finally got fixed', 'Bitterly; his own day is going badly',
                'Politely; he is only making small talk'], a: 1,
      cue: '「Hmm」のあと、glad の目的の一語。',
      line: 'Well, I’m glad *someone’s* feeling good.',
      said: '「まあ、誰かさんは気分が良さそうでよかったね」。',
      mean: 'someone を使うと「自分は違う」が裏に出る。皮肉の決まった形。',
      trap: 'glad を文字通り取ると祝福に聞こえる。someone は「自分以外の誰か」を指している。',
      use: 'Glad someone’s having fun.（楽しそうな人がいてよかったね）' },

    // R fix: V2 — blind 75 %: "rap music" was a filler, so the key was the only image choice. "A babyish side he kept
    //   hidden" is the near miss ("baby vibe" heard as exposed, "replaced" missed). Reveals t3's point: the stem says he
    //   is upset, and the segment holds t3's line.
    // why: no permission ← a portrait of a coworker raises the question of consent, and Tom is angry; hidden side ←
    //   "baby vibe" heard as something real exposed, with "replaced it" missed
    { id: 'g2', skill: 'gist', level: 'B2', point: 'vibe', reveals: ['someone'], seg: [114.6, 131.4],
      stem: 'In his comment to the camera, why is Tom upset?',
      choices: ['Jerry painted him without asking him first', 'It shows a babyish side he always kept hidden',
                'It ruins the cool image he worked to build'], a: 2,
      cue: '「killed」のあと、何が何に置きかわったか。',
      line: 'Jerry has *killed the Jay-Z vibe*… and *replaced it* with the fat brown baby vibe',
      said: '公共の場に飾られ、「ジェイ・Z風」の自分が「赤ちゃん風」に変わった、と嘆く。',
      mean: 'vibe ＝ 雰囲気・キャラ。イメージが台無しという不満。',
      trap: 'baby で素顔がばれたと取りやすいが、replaced は「別物に置きかえた」。',
      use: 'That totally killed the mood.（それで雰囲気が台無し）' },

    // why: months ← "for months" is heard just before (the light); his whole life ← "years" heard as a lifetime habit;
    //   weeks ← a short, recent effort
    { id: 'n1', skill: 'number', level: 'B1', point: 'years', reveals: ['vibe'], seg: [121.4, 127.6], keep: true,
      stem: 'How long does Tom say his old image took to build?',
      choices: ['A few weeks', 'Months', 'Years', 'His whole life'], a: 2,
      cue: '「taken me」の直後。',
      line: '…the Jay-Z vibe that’s *taken me years* to cultivate',
      said: '「何年もかけて育ててきたジェイ・Z風の雰囲気」。',
      mean: 'take me years to … ＝ 〜するのに何年もかかる。cultivate ＝ 育てる。',
      trap: '少し前に for months（何か月も）が出てくるので混ざりやすい。take の直後を聞く。',
      use: 'It took me years to learn.（覚えるのに何年もかかった）' },

    // R fix: V2/K5 — blind 55 %: the key was the only mechanism; the others were content. All three now say how he
    //   ends ("He ends…").
    // why: half admits it's fine ← "not as cool" heard as "still fairly cool"; equally cool ← "not" lost, so "as cool
    //   of a vibe" sounds like a tie
    { id: 'h2', skill: 'humor', level: 'C1', point: 'cool', reveals: ['vibe', 'coolof'], seg: [121.4, 131.4],
      stem: 'Why does Tom’s final comparison of the two vibes get a laugh?',
      choices: ['He ends by half admitting the baby vibe is fine', 'He ends a huge complaint with a very mild verdict',
                'He ends by calling the two vibes equally cool'], a: 1,
      cue: '最後の「which is」から文末まで。',
      line: '…replaced it with the fat brown baby vibe, *which is not as cool of a vibe*.',
      said: '「太った茶色の赤ちゃん風に変えられた。あれはそんなにかっこよくない」。',
      mean: '人生の一大事のように嘆いたあと、「あまりかっこよくない」と控えめに締めるずれ。',
      trap: 'not を聞き落とすと「同じくらいかっこいい」になる。控えめすぎる比べ方が笑いの種。',
      use: 'Not my best day, to be honest.（正直、いい日ではなかった）' },

    // R fix: V2 + C5 — blind 55 %: the key was the only "takes himself seriously" choice. All three now "treat X like
    //   Y" (right mechanism, wrong target). Its line shows "taken me years" (n1's key), so it reveals `years` and `vibe`.
    // why: Jerry ← right mechanism, wrong target: Tom blames Jerry by name, so the "too serious" one seems to be the
    //   artist; Leslie ← she loves the painting and Tom's comment reacts to her mood
    // anchor: 121.9–127.3 s “the Jay-Z vibe that's taken me years to cultivate”: he talks of a "vibe" as a product he
    //   built, so the self-importance is his
    // retired: for the draws (play 3+ under g2 drew no C2: it reveals g2's point)
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'cool', reveals: ['years', 'vibe'], seg: [121.4, 131.4], retired: true,
      stem: 'In Tom’s complaint, who is the joke on?',
      choices: ['Jerry, for treating a joke painting like great art', 'Leslie, for treating the painting like a tribute',
                'Tom, for treating a “vibe” like his life’s work'], a: 2,
      cue: '「taken me years」と、何を育てたと言うか。',
      line: 'the Jay-Z vibe that’s *taken me years to cultivate*',
      said: '「何年もかけて育てたジェイ・Z風の雰囲気」が台無しになった、と真剣に嘆く。',
      mean: 'vibe を何年も「育てる」と言う時点で、笑われているのは本人。キャラ作りを本気で語るずれが笑い。',
      trap: '名前を出して責めているのはジェリーなので、ジェリーが的に見える。誰の言葉が大げさかで考える。',
      use: 'I’m trying to build my brand here.（自分のキャラ作り中なんだけど）' },

    // why: the grammar-correcting instinct: "not as cool a vibe" (no "of") or "not a cool vibe" is what a learner
    //   writes; "of a" is said
    // anchor: 129.6–131.0 s both sources have "which is not as cool of a vibe"
    { id: 'x2', skill: 'dict', level: 'C2', point: 'coolof', seg: [127.3, 131.4],
      stem: 'Type the end of Tom’s comment: “which is ___.” (6 words)', answer: 'not as cool of a vibe',
      cue: '「which is」のあと、文末まで。',
      line: 'which is *not as cool of a vibe*.',
      said: '「それほどかっこよくない」。of a が「アヴァ」と弱く一続き。',
      mean: '教科書では as cool a vibe だが、会話では as cool of a がよく出る。聞こえたとおりに書く。',
      trap: '文法で直して of を落としやすい。cool と a の間に弱い音がもう一つあるか聞く。',
      use: 'It’s not that big of a deal.（そんなに大したことじゃない）' },

    // why: new painting ← replacing it sounds like a fair compromise; apology from Jerry ← "apologizing" is heard, and
    //   Jerry is the painter
    { id: 'd6', skill: 'detail', level: 'B1', point: 'demand', seg: [141.5, 148.4],
      stem: 'Besides getting rid of the painting, what does Marsha demand?',
      choices: ['A new painting to hang in its place', 'An apology in person from Jerry',
                'A statement of apology from the office'], a: 2,
      cue: '「and I want」のあと、from の次。',
      line: 'I want it destroyed, and I want *a statement from this office apologizing*…',
      said: '「絵を壊して、この役所から謝罪声明を出してほしい」と要求する。',
      mean: 'statement ＝ 公式の声明。個人ではなく役所としての謝罪を求めている。',
      trap: 'apologizing が聞こえると、描いた本人の謝罪と思いやすい。from のあとを聞く。',
      use: 'We’d like a written apology.（書面での謝罪をお願いします）' },

    // R fix: V2/K1 — blind 50 %. "Without promising anything" was arguable: they do promise to try for a solution.
    //   The key now says they don't say *what* they'll do; the choices are parallel.
    // why: agrees ← "we hear you, we understand you" read as full agreement; calm down ← the Japanese frame: a formal
    //   brush-off read as a polite hint that she's too much
    { id: 'pg1', skill: 'pragma', level: 'C1', point: 'hear', seg: [159.05, 165.3],
      stem: 'What does the reply that begins “Miss Langman” actually do?',
      choices: ['Agrees to do what she asks with the painting', 'Hints politely that she should calm down',
                'Soothes her without saying what they will do'], a: 2,
      cue: '最後の「whatever we can」に注目。',
      line: 'we *hear you*, we *understand you*, and we are going to do *whatever we can*…',
      said: '「お気持ちは分かります。解決のためにできることは何でもします」。',
      mean: '聞いた・分かった・努力すると言うだけで、壊すとは約束していない。役所の決まり文句。',
      trap: 'I hear you を同意と取りやすい。何を「する」と言ったか、動詞の中身を聞く。',
      use: 'We hear you, and we’ll look into it.（承知しました、確認します）' },

    // R fix: V2 — blind 55 %: other items show Leslie loves it, so "Leslie vows to keep it" stood alone. All three now
    //   pair what the office does with how it ends; no speaker is named. The key states pg1's point, so it reveals `hear`.
    // why: sides with Leslie ← "Not personally" and "I enjoy… art" heard as backing her, and "solution" as a deal;
    //   orders it destroyed ← "inappropriate" and "take care of this" heard as a ruling
    { id: 'g3', skill: 'gist', level: 'B2', point: 'end', reveals: ['hear'], seg: [159.05, 207.0],
      stem: 'How does the fight over the painting end in this clip?',
      choices: ['The office sides with Leslie, and Marsha gives up', 'The office stays vague, and Leslie vows to keep it',
                'The office orders it destroyed, and Leslie gives in'], a: 1,
      cue: '最後のカメラへの一言、最初の一文。',
      line: 'That painting is *not going to be destroyed*.',
      said: 'マーシャは「壊して」と言い続け、役所はあいまい。最後にレスリーが「壊させない」と宣言する。',
      mean: '話し合いは決着せず、レスリーが戦う構えで終わる。',
      trap: 'solution や inappropriate で決着に聞こえるが、役所は何も決めていない。',
      use: 'That’s not going to happen.（そうはさせない）' },

    // why: bothers him too ← "inappropriate" and "what Marsha is saying" heard as full agreement; Marsha should relax ←
    //   "Not personally, no" and "I enjoy… art" heard as taking Leslie's side outright
    // R fix: S4 — the segment was 19.2 s (limit 15) and its end cut "so" (192.48 s). It now runs from “I've dabbled”
    //   to "saying" (13.6 s), so the stem no longer quotes "personally offensive" (outside it), and the anchor moves.
    // anchor: 179.5–182.3 s “I've dabbled in nude sculpture. I've posed nude”; 187.2–192.2 s “because we're in a
    //   government building, and that would be inappropriate, which is what I think Marsha is saying”: no personal
    //   objection, only the place
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'place', seg: [178.9, 192.45],
      stem: 'Which plain-English version keeps the point of the talk about nude art?',
      choices: ['“It bothers me too; it doesn’t belong anywhere.”', '“It doesn’t bother me; it just doesn’t belong here.”',
                '“It doesn’t bother me; Marsha should just relax.”'], a: 1,
      cue: '前半の自分の経験と、後半の because の理由。',
      line: 'I’ve *dabbled in nude sculpture*. … Because we’re in a *government building*, and that would be *inappropriate*…',
      said: '個人的には平気と言い、「でも役所の中では不適切。マーシャもそう言いたいのでは」とまとめる。',
      mean: '好みと場所の問題を分け、両方の顔を立てている。問題は「ここ」に飾ること。',
      trap: 'inappropriate で同意、経験談で反対、と片方だけ取りやすい。「自分は平気」と「場所」を両方聞く。',
      use: 'I don’t mind it, just not at work.（いいけど、職場ではね）' },

    // R fix: V2 — blind 50 %: the key was the only "settle it" reading. Choices now similar in length and kind.
    // why: look after it ← "take care of" = 世話をする, keep it safe; be careful ← "take care" (= 気をつけて) heard
    //   without "of"
    { id: 'p4', skill: 'phrase', level: 'B2', point: 'care', seg: [190.2, 194.85],
      stem: 'What is the last request in the meeting asking someone to do?',
      choices: ['Look after the painting and keep it safe', 'Be careful how she reacts from now on',
                'Find a way to sort the whole thing out'], a: 2,
      cue: '「So」で始まる、最後の短い一文。',
      line: 'So, *take care of*… situation.',
      said: '「だから、この件はそっちで何とかして」と話を締める。',
      mean: 'take care of ＋ 問題 ＝ 片づける・対処する。具体的な方法は相手に任せている。',
      trap: '「世話をする」や take care（気をつけて）と取りやすい。目的語が問題なら「対処」。',
      use: 'Can you take care of it for me?（それ、代わりに片づけてくれる？）' },

    // R fix: V2/K5 — blind 60 %: only the key explained the joke. All three now "Lofty art talk turns into…".
    // why: joke at Jerry ← she makes up the painting's message herself, so it can sound like a dig at the painter;
    //   polite plea ← "get out of my way" heard as a request, with the arrow line lost
    { id: 'h3', skill: 'humor', level: 'C1', point: 'arrow', reveals: ['end'], seg: [194.4, 207.0],
      stem: 'Why does Leslie’s line about the painting’s message get a laugh?',
      choices: ['Lofty art talk turns into a joke at Jerry', 'Lofty art talk turns into a rude threat',
                'Lofty art talk turns into a polite plea'], a: 1,
      cue: '「the message of this painting is」のあと。',
      line: 'Every great work of art contains a message, and the message… is, *get out of my way*…',
      said: '「芸術にはメッセージがある。この絵のは、どかないと矢をお見舞いするわよ」。',
      mean: '高尚な芸術論の形で始めて、乱暴な脅しで落とすずれが笑い。',
      trap: 'get out of my way を頼みと取ると丁寧に聞こえる。最後の unless 以下が脅し。',
      use: 'Get out of my way, I’m late!（どいて、遅れてるの！）' },
  ]
};
