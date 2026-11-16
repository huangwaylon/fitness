// “Ron Swanson's Self-Defense Class | Parks and Recreation” (the official Parks and Recreation channel, Season 2): Ron
// opens a self-defense class that promises "maximum damage", turns a classmate's headlock idea back on them, teaches a
// wrist grab, and takes on a cocky Andy, who ends up out cold and then asks to learn the move; a talking head explains
// why TV movies brought her to the class.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 155 s; music after. Names said: Ron (11.0,
// 79.7 s), Mark (13.0 s), Andy (30.2, 74.9, 108.2, 118.9, 143.8 s); "Ann" only in whisper (31.2 s; captions "and"), so
// no item names her. Untested on purpose: 22.4 s ("You wish": speaker unclear), 33–34 s (whisper "watch", captions
// "watched"), 35–40 s (the movie's title, garbled in both), 47–49.5 s (a sexual line in the movie plot), 54–72 s (the
// wrist-grab demo: speakers never named; "that/it was awesome"), 96.9–101 s (captions "I see what's going on with
// this", whisper "Let's see where we're going with this"), 109–123 s (the hold itself: physical), 146.3 s (captions
// "she wants", whisper "Do you want"), 152–155 s (a crude closing line).
// REVIEW 2026-11-16: pass 8, fix 10, drop 1, new 1; ear checks 0
// REVIEW: s1 and x1 came off the ear-check list: both sources agree on the words (GUIDE §9.7).
import type { Clip } from '../types.ts';

export const ronSelfDefense: Clip = {
  id: 'ronselfdef', video: 'kl3IPL01a2s', title: 'Ron Swanson\'s Self-Defense Class', dur: 166, wpm: 146,
  band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 60 %; the distractors are now other aims a class could add to escaping
    // why: holding them ← "escape… situations" plus the usual "until help comes" script; scaring off ← the textbook
    //      aim of self-defense, avoiding a fight
    { id: 'd1', skill: 'detail', level: 'B1', point: 'damage', seg: [0.3, 11.6],
      stem: 'Besides escaping, what does Ron say his class will teach?',
      choices: ['Hurting attackers as badly as possible', 'Holding attackers until help comes',
                'Scaring attackers off without a fight'], a: 0,
      cue: '「while」のあと、escape に足される目的。',
      line: 'how to escape… *while inflicting maximum damage* on your attackers.',
      said: 'いろいろな場面から逃げる方法を、相手に最大のダメージを与えながら教える、と言う。',
      mean: 'inflict ＝（害を）与える。逃げるだけでなく、相手を痛めつけるのも目標。',
      trap: '護身術なら「戦わずに済ませる」が定番。while のあとを最後まで聞く。',
      use: 'I’ll show you how to fix it.（直し方を教えるね）' },

    // R fix: V2, blind 55 %, and K1: "get back at Mark with a real headlock" was close to what they literally ask
    // why: show off ← volunteering a hold heard as wanting to show a move they know; avoid the attacker ← Ron's
    //      "attackers" just before, and in the asker's own picture they are the one escaping
    { id: 'i2', skill: 'infer', level: 'B2', point: 'pervert', seg: [10.6, 22.3],
      stem: 'What does the classmate who brings up Mark really want?',
      choices: ['To make Mark look like the pervert', 'To show off a hold they already know',
                'To avoid playing the attacker role'], a: 0,
      cue: '「That way」以下の文の最後。',
      line: 'should I put *Mark* in a headlock? That way I can show everyone how to escape *a pervert*?',
      said: 'Mark をヘッドロックして「変質者からの逃げ方」を見せようか、と聞く。',
      mean: 'Mark を変質者の役にして、皆の前で笑いものにしたい。デモを借りた悪口。',
      trap: 'headlock が強く響き、技の話に聞こえやすい。That way 以下が「何のためか」。',
      use: 'That way, everyone can see it.（そうすれば、みんなに見える）' },

    // anchor: 17.2–22.0 s "in the scenario you just laid out, you're the pervert. You understand that, right?":
    //         "you" is the asker, who meant Mark to be the pervert
    // why: Mark ← the asker aimed the joke at him, and "pervert" comes right after "Mark" (right mechanism, wrong
    //      target); Ron ← his flat, careful wording heard as the joke being on his own literal mind
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'pervert', seg: [10.6, 22.3],
      stem: 'In Ron’s reply to the headlock idea, who is the joke on?',
      choices: ['The classmate who suggested the idea', 'Mark, the one who would be in the headlock',
                'Ron, for taking a silly idea too seriously'], a: 0,
      cue: 'Ron の返事の主語が、誰を指すか。',
      line: 'in the scenario you just laid out, *you’re the pervert*. You understand that, right?',
      said: 'Ron は「君の設定だと、変質者は君の方だ。分かってるよね？」と返す。',
      mean: 'Mark を笑うはずの案が、理屈で本人に返る。Ron は淡々と確かめるだけ。',
      trap: 'pervert が Mark のすぐあとに来るので、Mark が的に聞こえる。ねらいと当たりは別。you を追う。',
      use: 'So in your plan, you’re the bad guy.（君の案だと、悪者は君だね）' },

    // why: acted it out ← they wanted a demo, so "laid out" is heard as a performance; put it aside ← lay = 置く,
    //      read literally as laying the idea down
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'laidout', reveals: ['pervert'], seg: [17.15, 22.3],
      stem: 'When Ron answers, what does he say the classmate did with the scenario?',
      choices: ['Described it', 'Acted it out', 'Put it aside'], a: 0,
      cue: 'scenario のすぐあと、you just に続く動詞。',
      line: 'in the scenario you just *laid out*, you’re the pervert.',
      said: '「君が今説明した設定だと、変質者は君の方」と言う。',
      mean: 'lay out ＝ 順を追って説明する。案を「並べて見せる」イメージ。',
      trap: 'lay を「置く」と取ると「わきに置いた」になる。plan や scenario と組むと「説明する」。',
      use: 'Let me lay out the plan.（計画を説明させて）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'simple', seg: [23.55, 27.4],
      stem: 'Type what Ron says: “I’m gonna ___ and demonstrate…” (3 words)', answer: 'start off simple',
      cue: '「I’m gonna」のあと、つながって聞こえる3語。',
      line: 'I’m gonna *start off simple* and demonstrate…',
      said: '「まずは簡単なところから始めて、見せる」と言う。',
      mean: 'start off ＝ 始める。start‿off がつながり「スターロフ」に近い。',
      trap: 't が弾んで off とくっつき、1語に聞こえやすい。simple の前で区切る。',
      use: 'Let’s start off with something easy.（簡単なことから始めよう）' },

    // why: headlock ← said just before, in the classmate's idea; a hold on the arms ← "arms are pinned" comes later in
    //      Andy's turn, and "grab" heard as any hold
    { id: 'd2', skill: 'detail', level: 'B1', point: 'wrist', seg: [24.2, 32.9],
      stem: 'What does Ron say he’ll show the class first?',
      choices: ['Getting free from a wrist grab', 'Getting free from a headlock',
                'Getting free from a hold on the arms'], a: 0,
      cue: '「from a」のあと、体の部分を表す語。',
      line: 'demonstrate how to extract oneself from a *wrist grab*.',
      said: '「手首をつかまれたときの抜け方を見せる」と言う。',
      mean: 'extract oneself ＝ 抜け出す。硬い言い方で、Ron らしい。',
      trap: '直前の headlock が耳に残りやすい。見せるものは demonstrate のあとに来る。',
      use: 'Let me demonstrate how it works.（どう動くか、やって見せるね）' },

    // R fix: V2, blind 50 %; all three are now stories of an attack, told apart by whose
    // why: a friend ← "This woman… he attacked her" heard as someone she knows; her therapist ← "her therapist" heard
    //      as hers, giving advice
    { id: 'g2', skill: 'gist', level: 'B2', point: 'reason', reveals: ['there'], seg: [32.8, 54.2],
      stem: 'What does the woman talking to the camera say led her to the class?',
      choices: ['A TV movie about a woman who was attacked', 'A friend of hers who was attacked at home',
                'Her own therapist, who told her to come'], a: 0,
      cue: '話の最初の一文と、最後の so のあと。',
      line: '*Lifetime movies*… her therapist was obsessed with her… So, yeah, free self-defense class…',
      said: 'テレビ映画をよく見る。ある作品ではセラピストが女性を襲った。だから来た、と話す。',
      mean: '怖い映画を見て、身を守りたくなった。きっかけは作り話。',
      trap: 'this woman や her で知人の話に聞こえる。this one から始まるのは映画の筋。',
      use: 'There was this one movie where…（こんな映画があってね…）' },

    // why: not by choice ← "I'm there" read as a place (she is at the class); if I have time ← "free" heard as free
    //      time, not "costs nothing"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'there', seg: [46.55, 54.2],
      stem: 'At the end of her talk to the camera, what does she mean?',
      choices: ['“Count me in, for sure.”', '“I’m here, but not by choice.”', '“I’ll go if I have the time.”'], a: 0,
      cue: 'free のあと、最後の短い2語。',
      line: 'So, yeah, *free* self-defense class, *I’m there*.',
      said: '「というわけで、無料の護身術教室なら行く」としめくくる。',
      mean: 'I’m there ＝ 絶対行く。free ＝ 無料。場所の説明ではない。',
      trap: 'free を「暇」、there を「そこにいる」と取るとずれる。誘いへの I’m there は「乗った」。',
      use: 'Pizza night? I’m there.（ピザの夜？行く行く）' },

    // why: try to ← the textbook form, and weak "and" (ən) sits close to weak "to" (tə); have to ← "gonna" + a short
    //      weak chunk heard as an obligation
    { id: 's1', skill: 'sound', level: 'C1', point: 'tryand', seg: [72.85, 78.5],
      stem: 'Fill the gap: “He’s gonna ___ break free.”',
      choices: ['try and', 'try to', 'have to'], a: 0,
      cue: '動詞のあとの、とても弱く短い一語。',
      line: 'he’s gonna *try and* break free.',
      said: '「Andy が抜け出そうとする」。try and は「トライアン」と弱くつながる。',
      mean: '話し言葉では try to の代わりに try and も使う。意味は同じ。',
      trap: '習った try to に寄せて聞きがち。and は「ン」、to は「タ」に近い。',
      use: 'I’ll try and call you tonight.（今夜電話してみるね）' },

    // R fix: V2, blind 60 %
    // why: reassures ← "don't worry" is what you say to a scared person, with the roles flipped; thanks ← the
    //      Japanese frame, a kind offer answered with thanks
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'dontworry', reveals: ['cocky'], seg: [78.35, 86.45],
      stem: 'What does Ron’s first answer to Andy do?',
      choices: ['Dismisses the idea he could get hurt', 'Reassures Andy that he won’t get hurt',
                'Thanks Andy politely for his concern'], a: 0,
      cue: '直前の Andy の心配が、誰の身についてか。',
      line: 'I don’t want to hurt you, Ron. — *Don’t worry about that.* Just try to escape my attack.',
      said: 'Andy の「ケガさせたくない」に、「その心配は要らない。抜けてみろ」と返す。',
      mean: '心配を「無用」と払いのける返事。やられるとは少しも思っていない。',
      trap: 'don’t worry は励ましで習うので、なだめる言葉に聞こえる。何の心配かを先に押さえる。',
      use: 'Don’t worry about me. Just go.（僕のことは気にしないで、行って）' },

    // R fix: V2, blind 50 %; the distractors now turn on when and what
    // why: while held ← "counter-strike" caught, "when I get out" lost; any way he likes ← "allowed to" heard as a
    //      general request for a free hand
    { id: 'd3', skill: 'detail', level: 'B1', point: 'counter', seg: [81.9, 91.95],
      stem: 'What does Andy ask Ron’s permission to do?',
      choices: ['Hit back at Ron once he gets out', 'Hit back at Ron while still in the hold',
                'Get out of the hold any way he likes'], a: 0,
      cue: '質問の頭の「抜けたら」と、allowed to のあと。',
      line: 'am I *allowed to counter-strike*? — Sure… you may *counter-attack*.',
      said: '反撃してもいいかと聞き、Ron は「いいとも」と答える。',
      mean: 'counter-strike ＝ 反撃。Ron は counter-attack で返す。',
      trap: 'counter だけだと「つかまれたまま」にも取れる。when I get out が順番。',
      use: 'Am I allowed to take photos here?（ここで写真を撮ってもいいですか）' },

    // R fix: V2, blind 60 % ("leaving the class" was weak)
    // why: soon ← "when" heard as about timing, so the hold will be short; let out ← "get out" heard as being let out,
    //      something Ron would have to agree to
    { id: 'i1', skill: 'infer', level: 'C1', point: 'cocky', reveals: ['counter'], seg: [81.9, 91.95],
      stem: 'What does the way Andy starts his question take for granted?',
      choices: ['That he will surely get out of the hold', 'That Ron will let him out if he asks',
                'That the hold will only last a moment'], a: 0,
      cue: '質問の前半、「抜けたら」の部分の一語目。',
      line: 'Now, *when* I get out, am I allowed to counter-strike?',
      said: '「抜けたら、反撃していい？」と聞く。if でなく when。',
      mean: 'when は「抜けるのは確実」という前提。Ron も when で返して受け流す。',
      trap: 'when を時間の話と取りやすい。if でなく when を選ぶのは、起きると決めている証拠。',
      use: 'When we win, dinner’s on me.（勝ったら夕食はおごる）' },

    // R fix: V2, blind 50 %, and K1: "gentle, and against real fighting" could be argued from “I don't want to hurt you”
    // why: afraid ← "I don't want to destroy you" heard with the roles flipped; unsure ← "promise me you'll be ready"
    //      heard as stalling
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'cocky', seg: [88.15, 98.6],
      stem: 'How does Andy come across before Ron’s hold?',
      choices: ['Sure he’ll beat Ron with ease', 'Afraid he’ll get hurt by Ron', 'Unsure whether to really fight Ron'], a: 0,
      cue: 'Andy が心配しているのは、誰の身か。',
      line: 'promise me you’ll *be ready*, because, I mean, I don’t want to *destroy you*.',
      said: 'Ron に「本気でつぶしたくないから、準備しておいて」と言う。',
      mean: '心配しているのは Ron の身。勝つのは自分だと決めている。',
      trap: 'destroy you を逆向きに聞くと「怖がっている」になる。誰が誰を、を確かめる。',
      use: 'Don’t worry, I’ll go easy on you.（心配しないで、手加減するから）' },

    // why: his legs ← said first, as the right way; his arms ← the first body word, and what you'd push with
    { id: 'd4', skill: 'detail', level: 'B2', point: 'neck', seg: [102.0, 109.6],
      stem: 'According to Ron, what is Andy using to try to break free?',
      choices: ['His neck', 'His legs', 'His arms'], a: 0,
      cue: '「instead of」のあとと、Andy の名前の前。',
      line: 'use your legs to break free *instead of your neck*, which is what Andy’s trying to do.',
      said: '「首でなく脚を使って抜けろ。首でやっているのが Andy だ」と言う。',
      mean: 'which は「首を使う」を指す。Andy は悪い見本にされている。',
      trap: '先に聞こえる legs が残りやすい。instead of のあとが「しない方」。',
      use: 'Use the stairs instead of the elevator.（エレベーターでなく階段を使って）' },

    // R fix: V2, blind 60 % (m1's choices gave the key; "Andy won" was out once the apology is heard). All three
    //   now share "Ron won"; Andy's request tells them apart.
    // why: rematch ← "show me… that move" heard as "let's go again"; sit out ← "take it easy" and "I'm fine" heard as
    //      Andy stepping back
    { id: 'g1', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['move', 'sorry'], seg: [118.5, 151.95],
      stem: 'How does Andy’s turn with Ron end, judging by the talk after?',
      choices: ['Ron won; Andy asks to learn the move', 'Ron won; Andy asks for a rematch',
                'Ron won; Andy asks to sit the rest out'], a: 0,
      cue: 'Ron の謝る一言と、Andy の頼みごと。',
      line: 'Sorry I *squeezed your lights out* there, son. — No worries. *Will you show me* how to do that move…',
      said: 'Ron が「気絶させて悪かった」と謝り、Andy は「その技教えて」。',
      mean: 'Andy は負けたが、怒るどころか技を習いたがる。その反応がオチ。',
      trap: 'take it easy は別の人の言葉。Andy の頼みは show me how で、再戦ではない。',
      use: 'No worries. Can you show me how?（大丈夫。やり方教えてくれる？）' },

    // R drop: nt2 (C2 infer, never shipped): K1, ambiguous at heart. "you never know" as "you, Andy" or "people in
    //   general" both lead to "the test proves nothing", and Andy's "That's kind of true. I'm super bad at days" fits
    //   either. Replaced by nt3.

    // R fix: V2, blind 65 %; three parallel manner words now
    // why: heavy ← "Sorry" after a knockout, the Japanese frame where an apology means deep regret; stiff ← "son"
    //      heard as a formal, teacherly address
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'sorry', reveals: ['outcome'], seg: [135.85, 143.2],
      stem: 'How does Ron’s apology to Andy sound?',
      choices: ['Casual, as if it were nothing much', 'Heavy, full of real regret', 'Stiff, as a duty to the class'], a: 0,
      cue: '「Sorry」のあとの呼びかけと、次の Ron の返事。',
      line: 'Sorry I squeezed your lights out *there, son*. … *Sure. I can teach you right now.*',
      said: '「気絶させて悪かったな」と言い、技を頼まれると「今すぐ教える」と答える。',
      mean: 'there, son は気軽な言い方。すぐまたやろうとするので、大ごとではない。',
      trap: '「すみません」の感覚だと深い反省に聞こえる。直後の一言で重さを測る。',
      use: 'Sorry I kept you waiting there.（待たせちゃって、ごめん）' },

    // R fix: V2, blind 60 %; the choices are now one frame with different openers
    // why: also ← "though" heard as "too" (/ð/ vs /t/, the same long vowel); if it's okay ← "though" heard as a hedge,
    //      like a soft 「〜けど」
    { id: 'm1', skill: 'marker', level: 'B2', point: 'move', reveals: ['outcome'], seg: [136.3, 143.2],
      stem: 'What does the last word of Andy’s request add?',
      choices: ['“Even so, I want to learn it.”', '“Also, I want to learn that.”',
                '“If it’s okay, I want to learn it.”'], a: 0,
      cue: '謝られたあとの頼みで、文末に付く短い一語。',
      line: 'No worries. Will you show me how to do that move, *though*?',
      said: '謝る Ron に「平気。でもさ、あの技教えてくれる？」と聞く。',
      mean: '文末の though ＝「それはそれとして」。やられても習いたい、を足す。',
      trap: '「〜けど」の感覚でためらいと、too と聞いて「も」と取りやすい。文末の though は逆向き。',
      use: 'Nice hotel. It’s a bit far, though.（いいホテル。ちょっと遠いけどね）' },

    // why: annoyed ← "No, no, no" heard as a scolding; teasing ← "pancakes" sounds like a joke, so the offer is heard
    //      as teasing
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'worry', seg: [141.6, 151.95],
      stem: 'How does the next speaker sound, right after Ron’s offer?',
      choices: ['Worried, and fussing over Andy', 'Annoyed at Andy for showing off', 'Amused, and teasing Andy a bit'], a: 0,
      cue: '「No, no, no」のあと、すすめている物。',
      line: 'No, no, no. Andy, you should really just *take it easy*… more *water* or maybe some *pancakes*?',
      said: 'Ron をさえぎり、「Andy は休んでて。水かパンケーキでもどう？」と言う。',
      mean: '休ませて、飲み物や食べ物をすすめる。心配して世話を焼いている。',
      trap: 'No を3回重ねると怒っているようだが、続くのは気づかい。no のあとで読む。',
      use: 'Just take it easy today.（今日はゆっくりして）' },

    // R new: nt3 replaces nt2 (C2 minimum 2). Blind (fresh read of stem + choices): no pick above 40 %.
    // anchor: 143.3–145.7 s "No, no, no. Andy, you should really just take it easy"; 146.3–148.5 s "…more water or
    //   maybe some pancakes?": rest, water and food are what you offer someone recovering, said to Andy about Andy
    // why: Ron's too rough ← she cuts in right on Ron's offer, so the "No, no, no" is heard as aimed at him; embarrassed
    //   ← after a public knockout, "take it easy" heard as "don't make it worse"
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'worry', seg: [141.6, 151.95],
      stem: 'When Ron offers to teach the move, what does the reply leave unsaid?',
      choices: ['That Andy may still be hurt from the hold', `That Ron is too rough to learn from`,
                'That Andy has embarrassed himself enough'], a: 0,
      cue: '誰に向けた言葉か、すすめる物は何か。',
      line: 'No, no, no. *Andy, you should really just take it easy*… more *water* or maybe some *pancakes*?',
      said: 'Ron の申し出をさえぎり、Andy に「ゆっくりして。水かパンケーキでも」と言う。',
      mean: '休ませて水や食べ物をすすめるのは、回復中の人への扱い。「気絶したばかり」を言わずに伝える。',
      trap: 'Ron をさえぎるので Ron への文句に聞こえやすい。呼びかけとすすめる物で向きを決める。',
      use: 'Sit down. Can I get you some water?（座って。水持ってこようか？）' },
  ]
};
