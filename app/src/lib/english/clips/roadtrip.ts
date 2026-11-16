// “Leslie's Road Trip Playlist for the Unsexiest of Rides | Parks and Recreation” (the official Parks and Recreation
// channel, Season 3): before a road trip with Ben, Leslie and Ann plan ways to keep it unromantic (a sweatsuit, boring
// topics, a dull CD); in the car the plan wobbles, and Leslie ends up asking for silence.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–7 s (the dress line), 42.4–46 s (Ann's
// crude joke), 58–61 s (captions “you're gonna play”, whisper “do you want to play”), 86–99 s (music over the talk;
// whisper only for “whale sounds”), 110–124 s (the hotel rule: captions “within singing”, whisper “within city
// limits”), 139.7 s (captions “lamp”, whisper “lamb”), 141–157 s (the eyelash: “Get away from me” is whisper only)
// and 168–172 s. The towel talk's speakers are never named, so no item says who says what there.
// The comment to camera at 104–110 s is Ann's by the words: “Ann and I burned… CD” (61.8 s) and “I want them to get
// together” (not Leslie, who is one of “them”).
// REVIEW 2026-11-16: pass 5, fix 15, drop 0, new 0; ear checks 0
// REVIEW: the s1 and x1 ear checks are gone (both sources agree on “can” and “gotta tell you”; rubric addendum).
//   Open: the title (“Unsexiest”) still hints at g1's theme; both g1 distractors are now on-theme too.
import type { Clip } from '../types.ts';

export const unsexyRoadTrip: Clip = {
  id: 'roadtrip', video: 'D_Ny_S2UC_U', title: 'Leslie\'s Road Trip Playlist for the Unsexiest of Rides', dur: 183,
  wpm: 156, band: 'mid', tags: ['恋愛', '旅行'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 / GUIDE §9.4, the title's "Unsexiest" gave "boring" away; a second anti-romance choice now competes
    // why: music ← the title's "playlist" and the CD later; tell him outright ← "send out a signal that nothing is
    //   gonna happen" heard as a plan to say it to him
    { id: 'g1', skill: 'gist', level: 'B1', point: 'plan', reveals: ['change'], seg: [7.1, 42.2],
      stem: 'What are Leslie and Ann working out before the trip?',
      choices: ['How to keep the trip from feeling romantic', 'How to tell Ben outright she isn’t interested',
                'Which songs will make the drive more fun'], a: 0,
      cue: '「unsexy」のあとに並ぶ形容詞と案。',
      line: 'I need to think of *unsexy, boring conversation topics* we can talk about in the car.',
      said: '服装や車での話題まで、色気のない退屈な旅にする方法を二人で考える。',
      mean: '目的は二人の仲が進まないようにすること。話題も服もそのための道具。',
      trap: 'タイトルの playlist から音楽選びを思い浮かべやすい。場面で何度も出る形容詞を聞く。',
      use: 'Let’s keep it simple and boring.（地味に、無難にいこう）' },

    // R fix: V2, "business suit" was easy to rule out for an anti-romance plan; now a sweat- near sound
    // why: swimsuit ← sweat/swim share the sw- start; sweater ← "sweat" caught and "suit" lost
    { id: 'd1', skill: 'detail', level: 'B1', point: 'sweatsuit', seg: [7.1, 12],
      stem: 'What does Leslie say she needs to wear?',
      choices: ['A sweatsuit', 'A swimsuit', 'A sweater'], a: 0,
      cue: '「like a」のあと、suit の前の音。',
      line: 'I need, like, a *sweatsuit* or something.',
      said: '「スウェットの上下か何かが要る。何も起きないって合図を出さないと」。',
      mean: 'sweatsuit ＝ スウェットの上下。わざと色気のない服を選ぶ。',
      trap: 'sweat と swim は始まりが同じ。sweat は「スウェ」と短く、t で止まる。',
      use: 'I’m just going to wear a sweatsuit.（スウェットで行くよ）' },

    // R fix: V2, the key was the only nuanced choice; the dress choice now uses Leslie's own "I look really good in it"
    // why: dress ← "I look really good in it" just before, so "insane" sounds like shock at the outfit; trip length ←
    //   "road trip" is the last thing she names
    { id: 't1', skill: 'attitude', level: 'B2', point: 'insane', reveals: ['dying'], seg: [11, 17.6],
      stem: 'When Ann says “Oh, this is insane”, what is she reacting to?',
      choices: ['How they hide something so obvious', 'How good Leslie looks in that dress',
                'How long the road trip is going to be'], a: 0,
      cue: '「insane」の直後に続く一文。',
      line: 'Oh, this is insane. *It’s so obvious* you’re dying to be together.',
      said: '「一緒にいたいのが見え見えなのに、今度は車の旅？」とあきれる。',
      mean: 'insane はここでは「どうかしてる」。隠そうとすること自体にあきれている。',
      trap: '直前の服の話に反応したと取りやすい。すぐあとの it’s so obvious が理由の説明。',
      use: 'Come on, it’s so obvious.（ねえ、見え見えだよ）' },

    // R fix: V2, "until they die" was a filler; now the opposite reading of "dying" (死ぬほど嫌)
    // why: miserable ← "dying" read literally (死にそう); hate it ← "dying" heard as something negative
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'dying', seg: [13, 16.3],
      stem: 'What does Ann mean about Leslie and Ben being together?',
      choices: ['They want to be a couple very badly', 'Being apart is making them miserable',
                'They’d hate to be stuck together'], a: 0,
      cue: '「so obvious」のあとの動詞。',
      line: 'It’s so obvious *you’re dying to be together*.',
      said: '「二人が一緒になりたくてたまらないのは見え見え」。',
      mean: 'be dying to ＝ 〜したくてたまらない。よく使う強調。',
      trap: 'dying を「死にそう」と取ると、苦しさや嫌さの話になる。dying to＋動詞は強い願望。',
      use: 'I’m dying to see that movie.（その映画、見たくてたまらない）' },

    // R fix: V2, "ends on her real fear" was the only nuanced choice; all three now describe what she does
    // why: literal room ← "literally" makes "get a room" sound like hotel advice; already fired ← "could… get fired"
    //   heard as the past
    { id: 'h1', skill: 'humor', level: 'C1', point: 'fired', seg: [17.3, 22],
      stem: 'Why is Leslie’s answer to Ann’s “get a room” funny?',
      choices: ['She copies Ann’s line with a word about her job', 'She takes Ann’s line as a real tip about a hotel',
                'She admits she was once fired over a man'], a: 0,
      cue: '「literally get a」が2回。最後の語の違い。',
      line: 'you guys could *literally get a room*. — Yeah, and I could *literally get a-fired*.',
      said: '「本当に部屋を取れば」に、同じ形で「本当にクビになれる」と返す。',
      mean: 'get a room の形をまねて fired を入れる。文法を崩してまで合わせる返しが笑い。',
      trap: 'literally を本気の提案と取りやすい。同じ形が2回来たら、変えた語が要点。',
      use: 'Yeah, and I could get in trouble.（そうだね、で、怒られるのは私）' },

    // anchor: 18.2–21.4 s Ann's “you guys could literally get a room”, then Leslie's “I could literally get a-fired”:
    //   both sources keep the “a” (captions “get a fired”, whisper “get a-fired”), copied from “get a room”
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'fired', seg: [17.3, 22],
      stem: 'Type Leslie’s reply, as said: “Yeah, and I could literally ___.” (3 words)', answer: 'get a fired',
      cue: '直前の Ann の言い方と、同じ形かどうか。',
      line: 'you guys could literally get a room. — Yeah, and I could literally *get a fired*.',
      said: '「部屋を取れば」に、a を残したまま「クビを取れる」と返す。3語は速くひと続き。',
      mean: 'get a room の形をなぞり、ふつう付かない a を fired の前に残す。文法の崩れが返しの面白さ。',
      trap: '文法どおり get fired と書きたくなる。書き取りは正しい文より、聞こえた音を。',
      use: 'Sure, and I could literally get lost.（そうね、で私は本当に迷うけど）' },

    // why: graduate ← she knows so much, so she must have gone there; lying ← the short "No" heard as hiding it
    { id: 'h2', skill: 'humor', level: 'C1', point: 'hopkins', seg: [47.6, 56.7],
      stem: 'Why does Ben’s question about the school get a laugh?',
      choices: ['She knows its dorms well but never went there', 'She went there and keeps bragging about it',
                'She went there but won’t admit it to him'], a: 0,
      cue: '長い説明のあとの、一語の返事。',
      line: 'every dorm allows bed-lofting… — Did you go to Johns Hopkins? — *No*.',
      said: '寮のロフトベッド事情を細かく話し、「そこの出身？」と聞かれて「いいえ」。',
      mean: '行ってもいない大学の寮に詳しい。わざと退屈な話をしている計画が見える。',
      trap: '詳しいので出身だと思いやすい。長い話のあとの短い No が落ち。',
      use: 'No, I just read about it.（ううん、読んだだけ）' },

    // R fix: V2, "dull things" named the plan; the choices now list contents, with clip words in the wrong relation
    // why: Mandarin pop ← "learning to speak Mandarin" heard as songs, and a love song does come on later; comedy ←
    //   "Banjo Boogie Bonanza" sounds like a gag next to the speech
    { id: 'd2', skill: 'detail', level: 'B2', point: 'cd', seg: [60.6, 75.5],
      stem: 'What kind of things are on the CD Leslie and Ann made?',
      choices: ['A speech, a language lesson and car horns', 'Pop songs in Mandarin and a love song',
                'A comedy show and a famous speech'], a: 0,
      cue: '「awesome CD」のあとに並ぶ中身。',
      line: 'Ann and I burned an awesome CD… *Jimmy Carter’s “Crisis of Confidence” speech*, *learning to speak Mandarin*…',
      said: '「最高のCDを作った」と言い、演説、中国語講座などを並べる。',
      mean: 'awesome は皮肉まじりで、中身はわざと退屈なものばかり。',
      trap: 'Mandarin や後のラブソングに引っぱられやすい。awesome より、並ぶ中身を一つずつ聞く。',
      use: 'I made a playlist for the drive.（ドライブ用にプレイリスト作った）' },

    // why: sixty ← -ty and -teen sound alike at speed; six ← the -teen ending swallowed
    { id: 'n1', skill: 'number', level: 'B1', point: 'horn', seg: [66.3, 71.9],
      stem: 'How long is the car horn track on the CD?',
      choices: ['Six minutes', 'Sixteen minutes', 'Sixty minutes'], a: 1, keep: true,
      cue: '「Mandarin」のすぐあとの数字。',
      line: 'learning to speak Mandarin, *16 minutes* of old-timey car horn',
      said: '中国語講座のあとに「昔の車のクラクション16分」が入っている。',
      mean: 'わざと退屈で耳障りなものを長く入れている。',
      trap: 'sixteen と sixty は似ている。-teen は後ろが強く長い。-ty は前が強い。',
      use: 'It’s about sixteen minutes long.（だいたい16分くらい）' },

    // R fix: V2, "go up" was a filler; now a literal reading of "I didn't realize"
    // why: agrees ← "Yeah" heard as full agreement with "amazing instrument"; never heard one ← "I didn't realize"
    //   taken literally
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'loud', seg: [79.4, 86.6],
      stem: 'When the banjo is praised, what does the answer about the volume do?',
      choices: ['It hints that the music is too much', 'It agrees that the banjo is amazing',
                'It admits never having heard one before'], a: 0,
      cue: '「Yeah」のあとに続く感想の中身。',
      line: 'It’s an amazing instrument, the banjo. — Yeah, *I didn’t realize it could be this loud*.',
      said: '「バンジョーってすごい楽器だね」「うん、こんなにうるさいとは知らなかった」。',
      mean: 'Yeah で合わせてから loud と言う。ほめ言葉の形で「うるさい」と伝える。',
      trap: 'Yeah を全面同意と取りやすい。Yeah のあとに否定的な語が来たら本音はそちら。',
      use: 'Yeah, I didn’t expect it to be this spicy.（うん、こんなに辛いとは）' },

    // why: can't ← the weak "can" (kən) heard as a lost -n't; could ← a polite version with the same k- start;
    //   should ← heard as pushing him to change it
    { id: 's1', skill: 'sound', level: 'B2', point: 'change', seg: [93.5, 96.8],
      stem: 'Fill the gap: “You ___ change it if you want.”',
      choices: ['can', 'can’t', 'could', 'should'], a: 0,
      cue: '文の2語目、とても弱く短い音。',
      line: 'You *can* change it if you want.',
      said: '「変えたかったら変えていいよ」と相手に任せる。',
      mean: '肯定の can は弱く「クン」。否定の can’t なら「キャン」と強く長くなる。',
      trap: '弱い can は聞き逃しやすく、can’t と迷う。if you want が続くなら許可の can。',
      use: 'You can sit here if you want.（よかったらここに座っていいよ）' },

    // R fix: V2, "Ben had asked" had no basis; now a plausible motive for a good song on a dull CD
    // why: by mistake ← "snuck… in there" heard as slipped in by accident; easier to bear ← a great song among dull
    //   tracks sounds like a treat for the listeners
    { id: 'i1', skill: 'infer', level: 'B2', point: 'snuck', seg: [103.4, 110.65],
      stem: 'In the comment to camera, why was that song put on the CD?',
      choices: ['To push Leslie and Ben toward each other', 'To make the dull CD easier to sit through',
                'Because it slipped onto the CD by mistake'], a: 0,
      cue: '「snuck」のあと、want で始まる一文。',
      line: 'I snuck an Al Green song in there. *I want them to get together*.',
      said: '「アル・グリーンの曲をこっそり入れた。二人にくっついてほしいの」。',
      mean: 'snuck（sneak の過去形）＝ こっそり入れた。わざと、ラブソングで雰囲気を作る作戦。',
      trap: 'snuck を「うっかり」と取りやすい。sneak はこっそり、つまりわざと。',
      use: 'I want you two to get along.（二人に仲良くしてほしいな）' },

    // R fix: V2, the key was the only "not sorry"; now a near miss (a bit sorry) competes
    // why: worried ← "sue" taken literally, as fear of being taken to court; a bit sorry ← a short add-on after a
    //   confession heard as a sheepish shrug (the すみません frame)
    { id: 't2', skill: 'attitude', level: 'B2', point: 'sueme', reveals: ['snuck'], seg: [106.6, 110.65],
      stem: 'How does Ann feel about what she did, judging by her last two words?',
      choices: ['Not sorry, and ready to own it', 'A bit sorry, but she’d do it again', 'Worried she could get in trouble'], a: 0,
      cue: '告白のあとの、短い2語。',
      line: 'I want them to get together. *Sue me*.',
      said: '「二人にくっついてほしいの。文句ある？」と言い切る。',
      mean: 'Sue me ＝ 訴えれば？つまり「悪いと思ってない、文句ある？」。開き直りの決まり文句。',
      trap: 'sue を「訴える」と文字通り取ると心配に聞こえる。告白のあとの Sue me は開き直り。',
      use: 'I ate the last cookie. Sue me.（最後のクッキー食べた。文句ある？）' },

    // R fix: V2, "pulls them closer" was the only warm choice; now right-target/wrong-direction (working vs
    //   backfiring). N7: the choices name g1's plan, so it reveals plan
    // why: working ← the topic is dull, so the plan seems on track; where to stay ← the hotel rule and "Granville
    //   Hotel and Spa" heard as a plan to stay there
    { id: 'i2', skill: 'infer', level: 'C1', point: 'towels', reveals: ['gotta', 'difference', 'plan'], seg: [127.4, 138.75],
      stem: 'What does the talk about hotel towels show about the two of them?',
      choices: ['The boring-talk plan is backfiring', 'The boring-talk plan is working well',
                'They’re really planning where to stay'], a: 0,
      cue: '二人の返事の熱の入り方。',
      line: 'They have *the softest towels*. — Oh, I gotta tell you, *I love a nice towel*… *it makes all the difference*.',
      said: 'ホテルのタオルの柔らかさで盛り上がり、「最高のぜいたく」「バスマットもすごい」と続く。',
      mean: '退屈なはずの話題で息がぴったり。退屈作戦が逆に二人を近づけている。',
      trap: '話題が退屈なので、作戦どおりに聞こえる。中身より、二人の乗り方の熱を聞く。',
      use: 'Oh, I love a hot shower after a flight.（フライトのあとの熱いシャワー、最高）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'gotta', seg: [130, 133.25],
      stem: 'Type the words: “Oh, I ___, I love a nice towel.” (3 words)', answer: 'gotta tell you',
      cue: '「Oh, I」のあと、つながって速い3語。',
      line: 'Oh, I *gotta tell you*, I love a nice towel…',
      said: '「ねえ、言わせて。いいタオルって大好き」。',
      mean: 'I gotta tell you ＝ 本当にそう思う、と強調する前置き。gotta は got to の短縮。',
      trap: 'gotta の t が弾んで「ガラ」に近く、tell you も「テリュ」とつながる。',
      use: 'I gotta tell you, this is great.（ほんと、これ最高）' },

    // R fix: V2, the key was the only positive choice; "worth paying more" is positive too
    // why: different ← "difference" taken literally, as "makes it different"; worth paying for ← "luxury" heard as
    //   price
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'difference', reveals: ['towels'], seg: [133.2, 137.3],
      stem: 'What is said about a simple luxury like a nice towel?',
      choices: ['It makes things much better', 'It’s worth paying much more for', 'It makes things a bit different'], a: 0,
      cue: '「simplest luxury, but」のあと。',
      line: 'it’s the simplest luxury, but it *makes all the difference*.',
      said: '「いちばん簡単なぜいたくだけど、それで全然違う」。',
      mean: 'make all the difference ＝ 大きく良くする。小さなものの効果をほめる言い方。',
      trap: 'difference を「違い」とだけ取ると、良し悪しが分からない。ほめ言葉の決まり文句。',
      use: 'A good pillow makes all the difference.（いい枕で全然違う）' },

    // R fix: V2, "stop talking" was the only choice tied to the plan; "stick to dull topics" is now a near miss
    // why: tell him ← the closeness just before suggests a confession; dull topics ← the plan from the start, heard
    //   as what she returns to
    { id: 'g2', skill: 'gist', level: 'B1', point: 'silence', seg: [147, 168],
      stem: 'What does Leslie decide by the end of the clip?',
      choices: ['To not talk to Ben for the rest of the trip', 'To stick to dull topics for the rest of the trip',
                'To tell Ben how she really feels about him'], a: 0,
      cue: '「Maybe we should just」のあと。',
      line: 'Maybe we should just *not talk to each other* for the rest of the trip.',
      said: '「残りの旅は話さないでおこう」と言い、相手も「わかった」と答える。',
      mean: '話すほど近づくので、話すこと自体をやめると決めた。',
      trap: '近づいた直後なので告白が来そうに聞こえる。Maybe we should just のあとが提案の中身。',
      use: 'Maybe we should just call it a night.（今日はもうお開きにしようか）' },

    // R fix: V2/K3, "a real allergy he never knew of" was a filler; now right-target/wrong-direction (she disliked
    //   the touch)
    // why: didn't like it ← pulling away heard as dislike of his touch (the wrong direction); embarrassed ← the
    //   Japanese frame: pulling back after a personal moment heard as 照れ over the eyelash
    // anchor: 9–11.5 s “send out a signal that nothing is gonna happen”, then 162.4 s “maybe we should just not talk
    //   to each other for the rest of the trip”: she shuts down all talk, which answers a threat to the plan, not a
    //   passing blush; no fingers allergy exists, so the excuse covers something
    // seg 17.6 s: the excuse and the request for silence both have to be in it (native-level §2: ≤ 25 s)
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'fingers', reveals: ['silence'], seg: [148, 165.6],
      stem: 'When Leslie says she’s allergic to fingers, what is she trying not to say?',
      choices: ['That his touch moved her more than she wants', 'That she just didn’t like being touched by him',
                'That she felt silly about the eyelash on her face'], a: 0,
      cue: '冒頭の「合図」の話と、このあとの提案。',
      line: '*I’m allergic to fingers*… Maybe we should just *not talk to each other* for the rest of the trip…',
      said: 'まつげを取ってもらったあと「指アレルギーなの」と言い、さらに「残りの旅は話さないでおこう」と言う。',
      mean: 'ありえない言い訳は本当の理由を隠すため。会話ごと断つので、照れではなく近さそのものから逃げている。',
      trap: '言い訳を「触られるのが嫌」や照れと取りやすい。ばかげた言い訳ほど隠す理由は大きい。',
      use: 'Sorry, I just remembered I have a thing.（ごめん、用事を思い出した）' },

    // R fix: K2, "she sneezes" could only be settled by the picture; now a real-allergy reading
    // why: real allergy ← "allergic" taken at face value, as a real condition; a joke to relax him ← the line gets a
    //   laugh, so it sounds meant to be funny
    { id: 'h3', skill: 'humor', level: 'C1', point: 'fingers', seg: [148, 160.1],
      stem: 'After the eyelash moment, why is Leslie’s excuse funny?',
      choices: ['It’s an allergy no one could really have', 'It’s a real allergy, but a strange time to say it',
                'It’s a joke she makes to put him at ease'], a: 0,
      cue: '言い訳の最後の一語。',
      line: '*I’m allergic to fingers*.',
      said: 'まつげを取ってもらったあと「指アレルギーなの」と言う。',
      mean: '指のアレルギーはありえない。とっさの言い訳が下手すぎて笑いになる。',
      trap: 'allergic で本当の体質の話に聞こえる。何に対してのアレルギーかを最後まで聞く。',
      use: 'Sorry, I’m allergic to cats.（ごめん、猫アレルギーなの）' },

    // R fix: V2, "drive" and "radio" were easy to rule out; now -tion near sounds. N7: "instead of talking" in the
    //   stem gives g2's key, so it reveals silence
    // why: pronunciation ← the Mandarin lesson ("Unit 3") is playing, and -nunciation / -sentation sound alike;
    //   conference ← it's a work trip
    { id: 'd3', skill: 'detail', level: 'B1', point: 'presentation', reveals: ['silence'], seg: [161.8, 168],
      stem: 'What does Leslie say she will focus on instead of talking?',
      choices: ['The presentation', 'The pronunciation', 'The conference'], a: 0,
      cue: '「I’m just gonna」のあと。',
      line: 'I’m just gonna… on the *presentation*.',
      said: '「私はプレゼンに集中する」と言う。',
      mean: 'この旅は仕事。話さない理由として仕事を持ち出している。',
      trap: '流れている中国語講座から pronunciation と取りやすい。concentrate on のあとの名詞を最後まで聞く。',
      use: 'I need to focus on my presentation.（プレゼンに集中しないと）' },
  ]
};
