// “"iHalfoween" 🎃 iCarly Halloween Episode in 5 Minutes!” (NickRewind, Best of iCarly): the gang throws a
// "Halfoween" party; a guest in a purple robot suit hands out candy, the kids' voices go strange, and they hunt the
// robot. Neville gloats to Freddie and has him put in the robot suit, so the girls beat up the wrong "Neville".
// Segments from the captions, words from whisper (2026-11-17). Speakers come from the words: Freddie is named at
// 149 s and 163 s; Neville at 183 s and 226 s, and he is the one who orders "Dimitri, Yvonne" at 191 s and 280 s;
// "you girls" (248 s) are the ones who caught the robot. The adult who asks about the voices (103–134 s) and the one
// at the door (54 s) are unnamed, so no stem names them. No item asks who says what.
// Untested: the holiday's name (whisper "Hap-A-Ween", captions "half a week"/"halloween"); 30–42 s (whisper only);
// "Lubert"/"luberne" and "wart"/"work" (65, 198 s); 92–101 s ("he"/"you wouldn't like it"; "didn't mean to be rude"
// is past-or-present ambiguous); 106 s "off"/"all" (x2 and f2 use the 103 s line, where both say "off"); 216–218 s
// ("your voice is bad/back", "we're off/more off"); "Papperman"/"peppermint" (221, 255 s); 288–299 s.
// Reduction claims in s1, x1 and x2 rest on words both sources agree on (GUIDE §9.7).
// REVIEW 2026-11-17: pass 3, fix 19, drop 0, new 1; ear checks 1
// Open: i3's "gagged" and a2's "hiding fear" are new near misses; both are refuted by the words ("in a purple robot
//   costume"; "Ooh" right after "quite funny"), but a2 still leans on tone, so it stays on the ear-check list.
// EAR CHECK: 178.0 s a2 — "Ooh, am I?" read as mock fear (tone; the words "Ooh" + the gloat just before point there)
import type { Clip } from '../types.ts';

export const halfoween: Clip = {
  id: 'halfoween', video: 'nn4e3bwVLg8',
  title: '"iHalfoween" 🎃 iCarly Halloween Episode in 5 Minutes!', dur: 301, wpm: 121, band: 'slow',
  tags: ['友だち', '家'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): the two "half" distractors were weak beside the title; now all three are midpoints,
    //   so "previous Halloween and the future Halloween" has to be heard
    // why: Christmas ← "halfway point between" heard, the second Halloween lost: the usual next holiday fills it;
    //   October ← "halfway" + "Halloween" read as the middle of Halloween's own month
    { id: 'd1', skill: 'detail', level: 'B1', point: 'halfway', seg: [9.1, 19.0],
      stem: 'By the hosts’ account, when does the new holiday fall?',
      choices: ['Halfway between one Halloween and the next', 'Halfway between Halloween and Christmas',
                'Halfway through the month of October'], a: 0,
      cue: '「halfway point」のあとに続く語。',
      line: '…at the *halfway point between* the previous Halloween and the future Halloween.',
      said: '去年と次のハロウィンの、ちょうど真ん中で祝う日だと説明する。',
      mean: 'half＋Halloween で、半年ごとのハロウィンという作られた祝日。',
      trap: '二つ目を次の祝日で補いやすい。between A and B は B まで聞く。',
      use: 'It’s halfway between here and the airport.（ここと空港の中間です）' },

    // R fix: V2 (blind 60 %): the key was the only absurd penalty; both distractors are odd penalties now
    // why: hosts' beating ← "arrest and beating" heard, the "of your mother" lost: keyword in the wrong relation;
    //   your best friend ← the joke's shape (someone else pays) kept, the person misheard
    { id: 'h1', skill: 'humor', level: 'C1', point: 'penalty', seg: [18.4, 27.0],
      stem: 'Why does the warning about copying the holiday get a laugh?',
      choices: ['The penalty lands on your mother or your cat', 'The penalty is a beating from the hosts themselves',
                'The penalty lands on you and your best friend'], a: 0,
      cue: '最後の「and/or」の前後。',
      line: '…will result in the arrest and beating of *your mother and/or cat*.',
      said: 'まねをすると、あなたの母親か猫が逮捕され、ぶたれると警告する。',
      mean: '堅い法律口調から、ありえない罰に落とす。and/or の事務的な言い方も笑いどころ。',
      trap: 'beating だけだと殴るのは司会者に聞こえる。of のあとの語まで聞く。',
      use: 'Cash and/or card is fine.（現金でもカードでも、両方でも大丈夫）' },

    // R fix: V2 (blind 70 %): "permission in writing" was the only permission; a spoken-permission near miss now
    // why: given on the show ← "consent" heard, "written" lost (weak, before the stressed noun); a paid license ←
    //   "iCarly Enterprises" named right after: copying a product usually costs money
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'consent', seg: [18.5, 23.1],
      stem: 'What does the warning say you’d need before copying the holiday?',
      choices: ['Their permission, put in writing', 'Their permission, given on the show',
                'A paid license from their company'], a: 0,
      cue: 'without のあとの二語。',
      line: 'Any reproduction… without *written consent* from iCarly Enterprises…',
      said: '書面での同意なしにこの祝日をまねるな、と警告する。',
      mean: 'written consent ＝ 書面での許可。規約の決まり文句をまねた冗談。',
      trap: '前の written は弱く短く、落としやすい。名詞の前の語も拾う。',
      use: 'Do I need your consent for this?（これにはあなたの同意が必要ですか）' },

    // R fix: V2 (blind 50 %): "early" was a filler and the key the only candy choice; a trick-or-treat script now
    // why: asking for candy ← "candy" heard, the direction lost: the Halloween script has the guest take candy;
    //   costume ← a guest in a full robot suit is the visible "great" thing, but the comment is about candy
    { id: 'i1', skill: 'infer', level: 'B2', point: 'guest', seg: [53.4, 60.9],
      stem: 'What’s so great about the robot, by the comment at the door?',
      choices: ['It hands out candy to the people there', 'It came asking for candy, trick-or-treat style',
                'It came in a costume that took real work'], a: 0,
      cue: '「how great is it」のあとの動詞と相手。',
      line: 'How great is it when a party guest *brings you candy*?',
      said: '「客がお菓子を持ってきてくれるなんて最高」と言い、ロボットが配る。',
      mean: 'ハロウィンは普通もらう側が来るのに、この客は配る側。',
      trap: 'candy だけだと、いつものもらう側に取りやすい。brings you の向きを聞く。',
      use: 'Love it when the bus is on time!（バスが時間通りって最高）' },

    // R fix: S4: the segment ended at 86.0 s, inside "I'm"; now 85.6 s, after "Sure"
    // why: why not eat together ← "Why don't you…" read as a real why-question (Japanese frame: なぜ…しないの);
    //   takes a side ← one of them sent away; but "you guys" sends both
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'corndogs', seg: [81.2, 85.6],
      stem: 'After the two trade “No, you’re not!”, what does the next line do?',
      choices: ['It ends the fight by sending them off', 'It asks why they won’t go eat together',
                'It takes a side and sends one away'], a: 0,
      cue: '言い合いの直後、Why で始まる一言。',
      line: '*Why don’t you guys go get* some corn dogs?',
      said: '言い合う二人に「コーンドッグ買ってきたら？」と言う。',
      mean: 'Why don’t you…? は理由を聞くのでなく提案。ここでは二人を引き離す役目。',
      trap: 'Why を「なぜ」と取ると理由の質問に聞こえる。Why don’t you＋動詞は「〜したら？」。',
      use: 'Why don’t you take a break?（ちょっと休んだら？）' },

    // R fix: V2 (blind 60 %): "sorry" was a filler; now a one-side-gives-in reading. Segment end to 88.2 s (+0.5 s)
    // why: calm ← "'Kay. — Sure." sounds like the fight is settled; one gives in ← "I'm Carly!" heard once, the
    //   reply "You're really not!" taken as the other side letting it go
    { id: 'a4', skill: 'attitude', level: 'B2', point: 'bicker', reveals: ['corndogs'], seg: [83.4, 88.2],
      stem: 'As the two head off for the corn dogs, how do they sound?',
      choices: ['Still at it, neither one backing down', 'One giving in, the other still pushing',
                'Calm, the corn dogs ending the fight'], a: 0,
      cue: 'Sure のあとの二人の声。',
      line: 'I’m Carly! — You’re *really* not!',
      said: '素直に返事をしたあと、また「私が Carly」「ぜんぜん違う」と言い合う。',
      mean: 'really を足して前より強く否定。言い合いはまだ終わっていない。',
      trap: '’Kay や Sure で仲直りと思いやすい。返事のあとにもう一回やりとりがあるか聞く。',
      use: 'You’re really not helping.（ぜんぜん助けになってないよ）' },

    // R fix: V2 (blind 70 %): the key was the only choice about the voices; all three are about the voices now
    // why: punch ← "ate or drank" leaves room for a drink, and a party has one; knows who ← "who was in the purple
    //   robot costume? — We don't know" heard as asking the robot, not blaming it
    { id: 'g1', skill: 'gist', level: 'B2', point: 'cause', reveals: ['candy'], seg: [102.3, 141.5],
      stem: 'Why do the kids decide to hunt down the purple robot?',
      choices: ['They think its candy changed their voices', 'They think its punch changed their voices',
                'They think it knows who changed their voices'], a: 0,
      cue: '「ate or drank」への答えと、そのあとの決意。',
      line: 'Is there anything… you ate or drank? … *we all had that candy*.',
      said: '声がおかしい三人に、全員が口にした物を聞く。答えはロボットのお菓子で、犯人探しが始まる。',
      mean: '声が変わった原因はお菓子、と三人が気づく流れ。ここが話の転機。',
      trap: 'drank で飲み物に引かれやすい。we all had のあとまで聞く。',
      use: 'Did you eat anything strange today?（今日何か変な物を食べた？）' },

    // R fix: V2 (blind 60 %): two literal "turn" readings left the key alone; now a "how = method" reading too
    // why: how do you make ← "how come" read as "how" (方法); cut out ← "off" read as a switch (電源が切れる)
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'off', seg: [102.4, 105.6],
      stem: 'What is the first question about the voices asking?',
      choices: ['Why does your voice sound strange?', 'How do you make your voice sound like that?',
                'Why did your voice just cut out?'], a: 0,
      cue: '文頭の二語と、最後の短い一語。',
      line: '*How come* your voice *sounds off*?',
      said: '「なんで声が変なの？」と聞く。',
      mean: 'How come ＝ why のくだけた形。sound off ＝ いつもと違って聞こえる。',
      trap: 'How come を how と取ると方法の質問になる。sound＋形容詞は「〜に聞こえる」。',
      use: 'How come the store’s closed today?（なんで今日は店が閉まってるの？）' },

    // anchor: 103.1–104.2 s, both sources: "how come your voice sounds off", with no inversion after "how come"
    // why: the grammar-correcting instinct: "how come does your voice sound…" or "…voice sound…" (third-person -s lost)
    { id: 'x2', skill: 'dict', level: 'C2', point: 'off', seg: [102.6, 105.0],
      stem: 'Type the question: “___?” (6 words)',
      answer: 'how come your voice sounds off',
      cue: '一秒ほどで六語。語順と -s に注意。',
      line: '*How come your voice sounds off*?',
      said: '六語を一息で言い、sounds と off がつながる。',
      mean: 'How come のあとは疑問の語順にならず、普通の文の形のまま。だから does も入らない。',
      trap: '学校文法で does を足したり、sound の -s を落としたりしやすい。How come の後は普通の文の形。',
      use: 'How come you’re up so early?（なんでそんなに早起きなの？）' },

    // why: fifteen, fifty ← -teen/-ty: "five" said twice, but a listener braced for a longer time hears a longer one
    { id: 'n1', skill: 'number', level: 'B1', point: 'fivemin', seg: [115.8, 121.2],
      stem: 'When did the strange talking start, by the answer given?',
      choices: ['About five minutes ago', 'About fifteen minutes ago', 'About fifty minutes ago'], a: 0, keep: true,
      cue: 'About のあとの数、二回目も同じ。',
      line: 'When did the weird talking start? — About *five minutes* ago.',
      said: '「変なしゃべり方はいつから？」に「五分くらい前」と答え、もう一人もくり返す。',
      mean: '始まったばかり。このあと、直前に何を口にしたかを探す話になる。',
      trap: 'five と fifteen、fifty は語尾が似る。-teen は後ろが強く長い、と聞き分ける。',
      use: 'The bus left about five minutes ago.（バスは五分くらい前に出ました）' },

    // R fix: V2 (blind 70 %): the punch choice was weak; now a second candy source, so "from the robots" decides
    // why: corn dogs ← they were sent for corn dogs a moment ago: keyword trap; candy bowl ← "that candy" heard,
    //   "from the robots" lost: candy at a party is usually in a bowl at the door
    { id: 'd2', skill: 'detail', level: 'B1', point: 'candy', seg: [121.1, 132.2],
      stem: 'What turns out to be the one thing all three of them had?',
      choices: ['The candy from the robot', 'The candy from the bowl by the door', 'The corn dogs from the stand'], a: 0,
      cue: 'Wait のあと、we all had…。',
      line: 'Wait. Yeah, we all had *that candy*. — From the robots!',
      said: '最初は「思いつかない」と答え、少し考えて「みんなあのお菓子を食べた」と気づく。',
      mean: 'all three of you の問いに、三人に共通する物を答えている。',
      trap: 'that candy だけで決めやすい。続く from… まで聞く。',
      use: 'Wait, I left it on the train!（待って、電車に置いてきた！）' },

    // R fix: S4: the segment ended at 139.0 s, on "and" (138.96 s); now 138.9 s, after "robot"
    // why: the grammar-correcting instinct writes "we just have to find" or "we just got to find"
    { id: 'x1', skill: 'dict', level: 'B2', point: 'gotta', seg: [136.5, 138.9],
      stem: 'Type what comes before “that purple robot”: “Okay, ___ …” (4 words)',
      answer: 'we just gotta find',
      cue: 'Okay のあとの四語。真ん中が縮む。',
      line: 'Okay, *we just gotta find* that purple robot…',
      said: '「あのロボットを見つけなきゃ」。gotta は「ガラ」に近い。',
      mean: 'gotta ＝ have to。会話ではこの形がふつう。',
      trap: '文法どおり have to や got to と書きやすい。聞こえたまま gotta と書く。',
      use: 'I gotta go. See you tomorrow.（もう行かなきゃ。また明日）' },

    // R fix: V2 (blind 65 %): "say sorry" was a filler; now "beat the truth out of", the real idiom it's built on
    // why: tell the truth ← "beat the … out of" is also "beat the truth out of": the frame heard, the filler word lost;
    //   eat the fudge ← fudge = a chocolate candy, and candy is the topic: literal reading
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'fudge', seg: [136.5, 141.4],
      stem: 'What do they plan to do once they find whoever is inside?',
      choices: ['Beat them up as hard as they possibly can', 'Make them tell the truth about the candy',
                'Make them eat the fudge they handed out'], a: 0,
      cue: 'out of の前の、お菓子に聞こえる語。',
      line: '…and *beat the fudge out of* whoever’s inside!',
      said: '「中にいるやつを、こてんぱんにしてやる」と言う。',
      mean: 'beat the … out of ＝ ひどくやっつける。fudge は汚い言葉の言いかえ。',
      trap: 'fudge をお菓子、型を「白状させる」と取りやすい。型の中の語は言いかえを疑う。',
      use: 'Oh, fudge! I forgot my keys.（あーもう！鍵を忘れた）' },

    // R new: a third gist, because with two the head alternates g2/g1 and c1 (point twist, g2's) could never be
    //   drawn on plays 3 and 5: the C2 draw check failed. Blind read: 45 % (the key vs "catches Neville")
    // why: catches him ← "Carly, I found the purple robot. It's Neville" heard as the win, the orders after lost;
    //   make peace ← "An old friend" taken at face value
    { id: 'g3', skill: 'gist', level: 'B2', point: 'faceoff', seg: [143.0, 209.8],
      stem: 'How does Freddie’s face-off with the robot turn out?',
      choices: ['Neville turns the tables and has him seized', 'He catches Neville and calls Carly for help',
                'They make peace, since Neville is an old friend'], a: 0,
      cue: 'Carly への電話のあと、命令する声。',
      line: 'Carly, I found the purple robot. It’s Neville… — *Dimitri, Yvonne, help Mr. Benson out of his clothes.*',
      said: 'Freddie は Carly に電話するが、Neville は手下に彼の服を脱がせろと命じる。',
      mean: '見つけた側が逆にやられ、立場が入れかわる。',
      trap: '「見つけた」で Freddie の勝ちに聞こえやすい。最後の命令が誰の声か聞く。',
      use: 'Wait, where are you right now?（待って、今どこにいるの？）' },

    // R fix: V2 (blind 65 %): the key was the only tease; now a tease with the wrong target too
    // why: looks silly ← a tease is heard, but its object isn't: the words are about his voice ("don't sound like
    //   yourself"); real worry ← the question's form is a caring one, and Freddie's voice is odd: sincerity flip
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'gloat', seg: [161.4, 171.3],
      stem: 'How does Neville mean his question about how Freddie is feeling?',
      choices: ['As a tease: he knows why Freddie sounds odd', 'As a tease: Freddie looks silly tonight',
                'As real worry: Freddie sounds like he’s ill'], a: 0,
      cue: '「It’s not funny」への返し方。',
      line: 'Are you feeling all right, Freddie? … On the contrary, it is *quite funny*.',
      said: '「大丈夫？いつもの声じゃないね」と聞き、怒る Freddie に「いや、実におかしい」と返す。',
      mean: '心配の形をした、からかい。声が変わった理由を知っているそぶり。',
      trap: '気づかう言葉は本心に聞こえやすい。何をからかうかは sound の語で決まる。',
      use: 'Are you feeling all right? You look pale.（大丈夫？顔色が悪いよ）' },

    // R fix: V2 (blind 50 %): "laughing so hard it hurts" was a second "amused a lot"; now an "annoyed" reading
    // why: amused him less ← "I don't think… ever" heard as a plain negative; annoyed ← funny bone (肘のしびれる所)
    //   read literally: a knock there hurts
    { id: 'f5', skill: 'phrase', level: 'C1', point: 'gloat', seg: [168.4, 175.4],
      stem: 'What does Neville’s line about his “funny bone” mean?',
      choices: ['Nothing has ever amused him as much as this', 'Nothing has ever amused him less than this',
                'It annoys him, like a knock on the elbow'], a: 0,
      cue: 'I don’t think のあとの ever と so。',
      line: 'I don’t think my funny bone has *ever been so tickled*.',
      said: '「こんなに笑えたことはない」と大げさに言う。',
      mean: 'funny bone を tickle ＝ 笑わせる。not … ever ＝ 今までで一番。',
      trap: 'don’t で「おもしろくない」と取りやすい。not＋ever＋so は最上級と同じ。',
      use: 'That movie really tickled my funny bone.（あの映画、本当に笑えた）' },

    // R fix: V2 (blind 60 %): the key was the only non-literal reading; now a "scared but hiding it" bravado reading.
    //   S4: seg starts at 168.4 s so "it is quite funny" (the evidence against it) is inside
    // why: hiding fear ← "Ooh" read as a real flinch covered by a brave question; unsure ← the rising "am I?"
    //   heard as asking what trouble
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'trouble', reveals: ['gloat'], seg: [168.4, 180.6],
      stem: 'Told he’s in big trouble, how does Neville answer?',
      choices: ['Acting scared, though he isn’t at all', 'Scared, and trying hard to hide it',
                'Unsure, really asking what trouble'], a: 0,
      cue: 'Ooh で始まる短い返し。',
      line: 'You’re in big trouble, buddy. — *Ooh, am I?*',
      said: '「大変なことになるぞ」に「おお、そうかい？」と返す。',
      mean: 'こわがるふりをして、まったく気にしていないと見せる。からかいの続き。',
      trap: 'Ooh を本当にひるんだ声と取りやすい。直前まで笑っていた人の大げさな Ooh は、ふりを疑う。',
      use: 'Oh, am I in trouble now?（え、私、怒られるの？）' },

    // R fix: V2 (blind 60 %): the candy choice was weak; now a "gagged" reading built on "no one can hear you scream"
    // why: gagged ← "no one can hear you scream" heard, "in a purple robot costume" lost; a room downstairs ←
    //   "wait downstairs" (188 s) heard as where Freddie is
    { id: 'i3', skill: 'infer', level: 'B2', point: 'suit', reveals: ['twist'], seg: [192.6, 209.3],
      stem: 'What has Neville done with Freddie, judging by his last line here?',
      choices: ['Put him inside the purple robot suit', 'Had him gagged so no one can hear him',
                'Locked him in a room downstairs'], a: 0,
      cue: 'scream のあと、in で始まる場所。',
      line: '…help Mr. Benson out of his clothes. … No one can hear you scream *in a purple robot costume*.',
      said: 'Freddie の服を脱がせ、「ロボットの中じゃ叫んでも聞こえない」と言う。',
      mean: 'Freddie に自分の着ぐるみを着せた、ということ。勘違いの元。',
      trap: '口をふさいだと取りやすい。in＋場所の名詞まで聞くと理由がわかる。',
      use: 'Sorry, I can’t hear you in here.（ごめん、ここだと聞こえない）' },

    // R fix: V2 (blind 60 %): the pockets choice was a filler; now a voice near miss ("off" → "on", "your voice")
    // why: call Freddie ← Freddie phoned to say it's Neville (181 s), so asking him fits; turn its voice on ← "your
    //   voice is back" and "off" just before, rebuilt as a way to hear who it is
    { id: 'd3', skill: 'detail', level: 'B1', point: 'head', seg: [218.3, 223.5],
      stem: 'What did the girls try to do to the robot they caught?',
      choices: ['Take its head off to see who was inside', 'Call Freddie so he could tell them who it was',
                'Turn its voice back on to hear who it was'], a: 0,
      cue: 'tried to のあとの動詞と、その目的。',
      line: 'We tried to *take his head off* to see who it is.',
      said: '捕まえたロボットの頭を外して、中が誰か確かめようとした、と話す。',
      mean: '中が誰かを確かめるための行動。頭は外れなかった。',
      trap: 'Freddie の電話や直前の voice に引かれやすい。tried to のあとの動詞と、その目的語をそのまま聞く。',
      use: 'Take your shoes off at the door, please.（玄関で靴を脱いでください）' },

    // R fix: V2 (blind 50 %): "would have" was a weak choice; now "has" (the had lost after 's), so each wrong
    //   choice drops one of the two sounds
    // why: had ← the 's swallowed before "had"; has ← the 's heard, the short "had" lost before "enough"
    { id: 's1', skill: 'sound', level: 'B2', point: 'hadenough', seg: [238.1, 242.3],
      stem: 'Which words come right before “enough”?',
      choices: ['Neville has had', 'Neville had', 'Neville has'], a: 0,
      cue: '名前の最後の音と had の間。',
      line: 'Okay, I think *Neville’s had* enough.',
      said: '「もう Neville も十分こりただろう」。has は ’s になり名前につく。',
      mean: 'has had enough ＝ もう十分ひどい目にあった。今やめる、という合図。',
      trap: '’s も had も弱く落としやすい。名前の最後の z と h を聞く。',
      use: 'I think I’ve had enough coffee today.（今日はもうコーヒーは十分）' },

    // R fix: V2 (blind 65 %): "let go once he says sorry" was a filler; now an escape reading on "ropes off him"
    // why: owns up ← "Neville!" "Yep." heard as a confession; slips his ropes ← "get the ropes off him" heard,
    //   but the girls untie him themselves
    { id: 'g2', skill: 'gist', level: 'B2', point: 'twist', seg: [238.1, 267.0],
      stem: 'How does the girls’ hunt for the culprit turn out?',
      choices: ['They beat up the wrong person in the suit', 'They catch Neville, and he owns up to it',
                'They catch Neville, but he slips his ropes'], a: 0,
      cue: 'ロープをほどいたあとの、問いかけの声。',
      line: '…what makes you girls think that? — Neville? … *Then who’s in the robot costume?*',
      said: '「Neville はもう来ない」と話す二人に、本人が声をかける。',
      mean: 'やっつけたのは Neville ではなかった。着ぐるみの中は誰か、という話になる。',
      trap: '名前や ropes で捕まえたのは本人に聞こえる。意外な声は状況が変わる合図。',
      use: 'Wait, then who called me?（待って、じゃあ誰が電話してきたの？）' },

    // anchor: 247.1 s "And what makes you girls think that?" comes from the man they think they just beat; 252.4 s
    //   "Neville?" from the girls, and the sentence "'Cause we just slammed you in…" breaks off
    // R fix: V2 (blind 55 %), C2 one rewrite: "no one" was a filler; now a foiled-villain reading. Anchor holds
    // why: beaten Neville ← the girls' version believed (he's the one beaten): right mechanism, wrong target; plan
    //   fallen apart ← the usual villain-caught script; his smug question says the plan worked
    { id: 'c1', skill: 'humor', level: 'C2', point: 'twist', seg: [243.2, 256.0],
      stem: 'When the girls say Neville won’t bother them soon, who is the joke on?',
      choices: ['The girls: the real Neville is right there', 'Neville: he has just been beaten and tied up',
                'Neville: his plan has fallen apart at last'], a: 0,
      cue: '自信満々の二人に返ってくる問いの声。',
      line: 'I don’t think Neville’s gonna be bothering us anytime soon. — *And what makes you girls think that?*',
      said: '「当分 Neville は来ない」と言い切った直後、当の Neville が「なぜそう思う？」と聞く。',
      mean: '言い切った直後に本人が現れる型。笑われるのは言い切った側。',
      trap: '二人の話を信じると、笑いの的はやられた Neville に見える。言い切った直後の返事が誰の声かを聞く。',
      use: 'What makes you think that?（どうしてそう思うの？）' },

    // why: get ready ← "muscles" heard, "won't be needing" lost; stay close ← "tonight" heard as "stay for tonight"
    { id: 'p3', skill: 'pragma', level: 'B1', point: 'dismiss', seg: [279.4, 285.3],
      stem: 'Near the end, what is Neville doing when he speaks to Dimitri and Yvonne?',
      choices: ['Sending them off for the rest of the night', 'Telling them to get ready to use their muscles',
                'Asking them to stay close for the night'], a: 0,
      cue: '最後の短い三語。',
      line: 'I *won’t be needing* your muscles anymore tonight. *You may go.*',
      said: '手下に「今夜はもう力は要らない。帰ってよい」と言う。',
      mean: 'You may go ＝ 下がってよい。目上のかしこまった言い方。',
      trap: 'muscles が耳に残ると「出番だ」と取りやすい。won’t be needing は「もう要らない」と覚える。',
      use: 'That’s all for today. You may go.（今日はここまで。帰っていいよ）' }
  ]
};
