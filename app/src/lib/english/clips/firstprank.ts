// REVIEW 2026-11-17: pass 10, fix 13, drop 0, new 0; ear checks 1. Blind pass first: 18 of 22 choice items at ≥ 50 %.
// REVIEW open: c2's joke is the "first time / the right person" script. It's framed as true love and kept; drop it if it reads as innuendo (§9.8).
// REVIEW open: p1 (60 %), i1 and i2 (55 %), f3 and f4 (phrase knowledge, 85–90 %) were kept on content.
// “Carly Pulls Her FIRST Prank Ever 🤣 | FULL EPISODE in 5 Minutes | iCarly” (NickRewind, Best of Carly Shay ❤️): Carly
// has never pulled a prank, Sam and Freddie push her into one, and she pulls it with Spencer's help; Spencer then can't
// stop pranking (a cast, glow-in-the-dark face cream), and the friends' plan to stop him works too well.
// Segments from the captions, words from whisper (2026-11-17). The captions lose timing in laughs (“Rush@159.5”,
// “weeks@176.8”), so those segments are padded to cover both sources. Speakers come from the words: Sam is the one who
// says it “needs to happen soon” (Freddie answers “I'm with Sam on this one” when he is called on at 85 s) and is
// named again at 281.5 s; Carly is the friend who has never pranked: the friends search for her (94–100 s), her text
// sets up the prank, and she credits “the king of pranks” (Spencer, named 195 s on) for help and then says “I sucked
// him back into pranking”. The other speakers (the man with the face cream, the one with the cast) aren't named and
// no stem names them.
// Untested: 15–24 s (a cop who thinks “his feet got cut off”), 110–134 s (the note from Neville and the prank itself,
// mostly seen), 164–169 s (whisper hears “No, I won't” twice, the captions once), 178–197 s (whisper loops “I heard
// the cue was Gibby”), 214–227 s (lights out, seen), 248–255 s (Sam's sneak attack), 283–316 s (the classmates, mostly
// shouting and music).
// EAR CHECK: 10.3 s s1 — whisper “You wanna know”, captions “you want to know” (the key is the reduced form; neither
//   has a “Do”)
import type { Clip } from '../types.ts';

export const firstPrank: Clip = {
  id: 'firstprank', video: 'sSqM7UMYCzE', title: 'Carly Pulls Her FIRST Prank Ever 🤣 | FULL EPISODE in 5 Minutes',
  dur: 332, wpm: 146, band: 'slow', tags: ['友だち', '家'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // why: dessert ← the “sweet dessert” note later in the clip; an idea ← Carly's “awesome idea for iCarly” text later
    { id: 'd1', skill: 'detail', level: 'B1', point: 'text', seg: [0.0, 4.0],
      stem: 'At the very start, what is the thank-you text for?',
      choices: ['A prank video he sent them', 'A sweet dessert he left them', 'A great idea he gave the show'], a: 0,
      cue: '「thank you text to that guy」のあと。',
      line: 'Just sending a thank you text to that guy that *sent us the prank video*.',
      said: 'いたずら動画を送ってくれた人に、お礼のメッセージを送っているところ。',
      mean: 'that sent us ～ は guy の説明。「動画を送ってくれたあの人」。',
      trap: 'あとでお菓子やアイデアの話も出てくるが、ここでお礼をするのは動画。',
      use: 'I’m just texting him a thank-you.（彼にお礼のメッセージを送ってるだけ）' },

    // R fix: V2 — blind 50 %: with three choices the bare “You wanna” stood out; “Don’t you wanna” adds a fourth strong
    //   sound-alike.
    // why: Do you wanna ← the question tone suggests a “do”, but none is said; You wanted to ← “wanna” heard as two
    //   syllables plus a d; Don’t you wanna ← the rising tone heard as a coaxing negative question
    { id: 's1', skill: 'sound', level: 'B2', point: 'wanna', seg: [9.8, 15.7],
      stem: 'Fill the gap: “___ know the best prank I ever pulled?”',
      choices: ['You wanna', 'Do you wanna', 'You wanted to', 'Don’t you wanna'], a: 0,
      cue: '文の最初、とても速い2語。',
      line: '*You wanna* know the best prank I ever pulled?',
      said: '「私の最高のいたずら、聞きたい？」と切り出す。',
      mean: 'Do を省いて You wanna だけで質問にする、くだけた言い方。want to が「ワナ」になる。',
      trap: '質問なので Do を足して聞きやすい。上がり調子だけで質問になっている。',
      use: 'You wanna grab lunch?（お昼行く？）' },

    // R fix: V2 — blind 65 %: “saw the prank coming” didn't sound like the line; it now echoes “expecting”, so the
    //   lost n't is the trap it claims to be.
    // why: was expecting ← “wasn't” heard as “was” (n't lost); his own hat ← “his hat” read as the teller's own
    { id: 'h1', skill: 'humor', level: 'C1', point: 'raisins', seg: [26.25, 38.0],
      stem: 'Why does the boys’ camp story get a laugh?',
      choices: ['The prank he is proud of is very tame', 'The kid was expecting the prank all along',
                'The raisins ended up in his own hat'], a: 0,
      cue: '「great pranks」と言ったあとの中身と、最後の一言。',
      line: 'I *filled this kid’s hat with raisins*. And I’ll tell you what, *he wasn’t expecting that* in his hat.',
      said: '「すごいのをやった」と言って、出てきたのは「帽子にレーズンを入れた」話。',
      mean: '大げさな前置きと、かわいすぎる中身の差が笑い。',
      trap: 'wasn’t の t が消えると was に聞こえ、「見破られた」話になる。n の音を聞く。',
      use: 'I’ll tell you what, it was worth it.（言っとくけど、やってよかった）' },

    // R fix: V2 — blind 70 %: “top Sam's cop prank” was weak; the new near miss is Sam's own argument, “way too old to
    //   have never pulled one prank”, which Carly deflects.
    // why: too old ← Sam's “way too old to have never pulled one prank”, an argument she brushes off; an idea for the
    //   show ← Carly's text about “an awesome idea for iCarly” comes right after
    { id: 'g1', skill: 'gist', level: 'B2', point: 'agree', reveals: ['pressure', 'side'], seg: [37.8, 93.9],
      stem: 'Why does Carly finally agree to prank someone?',
      choices: ['Her friends keep pushing her to', 'She feels too old not to have one', 'She has a great idea for the show'], a: 0,
      cue: '最後に一人が味方につき、「Okay」と言う流れ。',
      line: 'Okay. I’ll prank someone. — Score one for *peer pressure*.',
      said: '迫る Sam に Freddie も味方し、Carly が折れる。',
      mean: '自分でやりたくなったのではなく、二人に押されて引き受けた。',
      trap: '「もう大人なのに」と言われた理由や、あとの番組のアイデアに引かれやすい。決め手は最後の一言。',
      use: 'Fine, you win. I’ll do it.（分かった、負けた。やるよ）' },

    // R fix: V2/K1 — blind 60 %: “encouraging” was weak; it's now a teasing reply that lets them count, which her
    //   “Well, then I guess I've never done one” refutes. The key said “barely count”; she says “don't even count”.
    // why: lets them count ← a teasing tone heard, the “even” lost; puzzled ← “knock-knock” repeated as a question
    { id: 't1', skill: 'attitude', level: 'B2', point: 'knock', seg: [45.0, 51.3],
      stem: 'When Carly asks “Do knock-knock jokes count?”, how does the reply sound?',
      choices: ['Dismissive; they aren’t even real jokes', 'Teasing; but she’ll let them count',
                'Puzzled; she has never heard of them'], a: 0,
      cue: '聞き返したあと、強く打ち消す一文。',
      line: 'Knock-knock jokes? They *don’t even count as jokes*.',
      said: '「ノックノック・ジョーク？あれはジョークにも入らない」。',
      mean: 'not even ＝「〜でさえない」。いたずら以前に、笑いとしても認めていない。',
      trap: '聞き返しは知らないからではなく、あきれているから。even が強い否定の合図。',
      use: 'That doesn’t even count as cooking.（それ、料理のうちに入らないよ）' },

    // why: show bits ← “on iCarly” heard as “it's just the show”; never funny ← Lewbert is the angry target
    { id: 'd2', skill: 'detail', level: 'B2', point: 'lewbert', seg: [56.95, 64.9],
      stem: 'Why don’t the Lewbert pranks count, according to Sam?',
      choices: ['Sam is the one who thinks them up', 'They are only little bits for the show',
                'Lewbert never finds any of them funny'], a: 0,
      cue: '「Those are pranks」への返事、Yeah のあと。',
      line: 'Those are pranks. — Yeah, *that I come up with*. Doesn’t count.',
      said: '「Lubert へのはいたずらでしょ」に「うん、考えたのは私。だから無効」。',
      mean: 'that I come up with ＝「私が考えたやつ」。Carly の手柄にならない。',
      trap: 'Yeah で同意に聞こえるが、that 以下で打ち消している。',
      use: 'Yeah, the one I came up with.（うん、私が考えたやつね）' },

    // R fix: K3 — “can't keep a secret” was a filler (blind 85 %); the new near miss comes from the “does it count?”
    //   talk just before.
    // why: no time ← a familiar excuse; what counts ← “count” was the word of the last two turns
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'type', seg: [64.9, 68.35],
      stem: 'What does Carly mean by “I guess I’m not the pranky type”?',
      choices: ['Pranks just aren’t her kind of thing', 'She’s never had time to plan a good prank',
                'She isn’t sure what counts as a prank'], a: 0,
      cue: '「sorry」のあと、type で終わる文。',
      line: 'Then sorry. I guess I’m *not the pranky type*.',
      said: '「じゃあごめん、いたずらするタイプじゃないみたい」。',
      mean: 'not the ～ type ＝「〜するタイプじゃない」。pranky は prank から作った形容詞。',
      trap: 'type をカタカナの「好み」と取ると話がずれる。ここは性格・向き不向き。',
      use: 'I’m not really the camping type.（キャンプするタイプじゃないんだ）' },

    // R fix (its one rewrite): V2 — blind 75 %: “already has a crush” was weak; the new near miss reads the pauses
    //   as nerves. Her words are a stock phrase, not a confession, and Sam answers the delay.
    // C2: why the pause is funny (the waiting-for-love script)
    // why: a teacher ← “meet the right person” heard as finding a mentor; nerves ← the pauses heard as fear
    // anchor: 74.9→76.2 s and 76.9→77.7 s and 78.3→79.2 s the gaps before “meet the right person” (both sources); 82.2 s
    //   Sam's “No, no, no… This needs to happen soon”
    { id: 'c2', skill: 'humor', level: 'C2', point: 'right', seg: [72.0, 84.55],
      stem: 'Why does “when I… you know… meet the right person” get a laugh?',
      choices: ['She treats a first prank like waiting for true love', 'She hopes a new friend will teach her how to prank',
                'She admits she is too nervous to try one alone'], a: 0,
      cue: '間の取り方と、Sam がすぐに言い返す内容。',
      line: 'I’m sure it’ll happen. When I… you know… *meet the right person*. — *This needs to happen soon.*',
      said: '「いつかするよ。その…いい人に出会ったら」と、間を置いて言う。Sam は「今すぐ」と迫る。',
      mean: '初めての恋を待つときの決まり文句を、いたずらに使っている。照れた間で、本気の話のふりをしている。',
      trap: 'right person を「教える人」、間を「怖い」と取りやすい。決まり文句の形がヒント。',
      use: 'It’ll happen when the time is right.（時が来ればそうなるよ）' },

    // R fix: K3 — “stand next to Sam” was a filler (blind 90 %); “on this one” heard as a split view replaces it.
    // why: each side ← “on this one” heard as “on one point each”; stay out ← the Japanese frame: a neutral “I'm with you”
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'side', seg: [84.55, 88.3],
      stem: 'When Freddie is called on, what does “I’m with Sam on this one” mean?',
      choices: ['He agrees with Sam on this point', 'He partly agrees with each of them', 'He would rather stay out of the fight'], a: 0,
      cue: '名前を呼ばれた直後の、短い返事。',
      line: '*Freddie!* — *I’m with Sam on this one.*',
      said: 'Carly に助けを求められて、「今回は Sam に賛成」と答える。',
      mean: 'I’m with ～ on this one ＝「この件は〜に賛成」。',
      trap: '「分かるよ」程度の相づちや中立と取りやすい。I’m with ＋人 on this は、はっきり賛成。',
      use: 'I’m with you on this one.（この件は君に賛成）' },

    // why: warning her ← “peer pressure” is a word from school talks against it; sorry ← pressure = 迷惑をかけた
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'pressure', seg: [88.3, 93.9],
      stem: 'Right after “Okay. I’ll prank someone”, what is the comment that follows doing?',
      choices: ['Jokingly cheering that the pushing worked', 'Warning her not to give in to their pushing',
                'Saying sorry for pushing her so hard'], a: 0,
      cue: '「Okay」のあと、スポーツの得点のような言い方。',
      line: 'Score one for *peer pressure*.',
      said: '折れた Carly に「仲間の圧力に1点」。',
      mean: 'score one for ～ ＝「〜の勝ち」。悪いとされる peer pressure をわざとほめる冗談。',
      trap: 'peer pressure は注意の言葉だが、ここは自分たちの勝ちを喜んでいる。',
      use: 'Score one for the early birds.（早起き組の勝ち）' },

    // why: at school ← “after school” heard, “studio” lost; the lobby ← the building's front desk (Lewbert's), a keyword trap
    { id: 'd3', skill: 'detail', level: 'B1', point: 'textmsg', seg: [98.85, 107.2],
      stem: 'Where does Carly’s text ask them to meet her?',
      choices: ['In their studio right after school', 'At school right after their last class',
                'In the lobby right after the show'], a: 0,
      cue: '「meet me in」のあと。',
      line: 'You and Sam meet me *in our studio right after school*.',
      said: '「iCarly のいいアイデアがある。放課後すぐスタジオに来て」というメッセージ。',
      mean: 'right after ＝「〜のすぐあと」。場所は自分たちのスタジオ。',
      trap: 'school が聞こえるので学校を選びやすいが、school は時間（放課後）のほう。',
      use: 'Meet me at the station right after work.（仕事のあとすぐ駅で会おう）' },

    // R fix: V2 — blind 75 %: “nervously, unsure” was weak; the new near miss gets the stance but loses “extremely”.
    // why: sorry ← “Uh, no” heard as a hesitant start; a little ← the playful tone heard, “extremely” lost
    { id: 't2', skill: 'attitude', level: 'B2', point: 'funny', seg: [134.5, 140.7],
      stem: 'How does the prankster answer “That was horrible! Not funny!”?',
      choices: ['Proudly, insisting it was very funny', 'Sorrily, admitting it went too far',
                'Playfully, saying it was a little funny'], a: 0,
      cue: '「Uh, no」のあと、強めの一語。',
      line: '*Uh, no. It was extremely funny.*',
      said: '「ひどい！面白くない！」に、「いや、ものすごく面白かった」と返す。',
      mean: 'Uh, no は「いやいや」。相手の評価をはっきり打ち消している。',
      trap: 'Uh で迷っているように聞こえるが、そのあと extremely と強める。迷いではなく反論。',
      use: 'Uh, no. It was amazing.（いやいや、最高だったよ）' },

    // why: understand ← “I got it” = 分かった; won over ← “got” as “got someone on your side”
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'gotcha', seg: [140.7, 148.2],
      stem: 'After “Admit it!”, what does the reply “You got us” mean?',
      choices: ['You really fooled us', 'You finally understand us', 'You have won us over'], a: 0,
      cue: '「Admit it!」のあと、認める側の短い返事。',
      line: 'Admit it! I gotcha good! — *You got us.* Nice job, kid.',
      said: '「認めなよ、見事に引っかけた！」に、「やられた。よくやった」と返す。',
      mean: 'got ＋ 人 ＝「（いたずらで）引っかけた・やられた」。Admit it への降参。',
      trap: 'get を「分かる」と取るとずれる。いたずらのあとの got は「やられた」。',
      use: 'Ha, you got me!（あはは、やられた！）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'fun', seg: [152.5, 155.1],
      stem: 'Type what Spencer says: “Man, I forgot ___ pranking is.” (3 words)', answer: 'how much fun',
      cue: '「forgot」のすぐあと、pranking の前。',
      line: 'Man, I forgot *how much fun* pranking is.',
      said: '「いやあ、いたずらがこんなに楽しいって忘れてた」。',
      mean: 'how much fun ～ is ＝「〜がどれほど楽しいか」。how much が一つにつながる。',
      trap: 'fun が短く、pranking とつながって消えやすい。',
      use: 'I forgot how much fun this is!（これがこんなに楽しいの、忘れてた！）' },

    // R fix: K3 — “where he learned that” was a filler (blind 90 %); a warning about harm is the near miss now, which
    //   “Don't go getting all prank happy” refutes.
    // why: harm ← “Easy there” heard as a safety warning; praising ← the cheer just before
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'easy', seg: [156.55, 165.2],
      stem: 'After Spencer’s “Woo!”, what is “Easy there, Texas” doing?',
      choices: ['Telling him to calm his excitement', 'Warning him the prank could hurt someone',
                'Praising him for his big prank'], a: 0,
      cue: '「Woo!」のあと、続く「Don’t go…」まで。',
      line: '*Easy there*, Texas. *Don’t go getting all prank happy.*',
      said: '「落ち着いて、カウボーイさん。いたずらに浮かれすぎないで」。',
      mean: 'Easy there ＝「どうどう、落ち着いて」。Texas はカウボーイ風の掛け声へのからかい。',
      trap: 'Easy there を「危ない」と取りやすい。Don’t go… は止める合図。',
      use: 'Easy there, it’s just a game.（落ち着いて、ただのゲームだよ）' },

    // R fix: V2 — blind 75 %: six weeks is the cast everyone knows; “Sixty days” (about the same length) adds a -ty
    //   sound-alike, so the ear has to decide.
    // why: six days ← a cast for days sounds short; sixty days ← six + -ty; sixteen ← -teen/-ty and six- start the same
    { id: 'n1', skill: 'number', level: 'B1', point: 'cast', seg: [171.9, 177.5], keep: true,
      stem: 'How long did the doctor say the cast has to stay on?',
      choices: ['Six days', 'Six weeks', 'Sixty days', 'Sixteen weeks'], a: 1,
      cue: '「wear the cast?」への短い答え。',
      line: 'How long did the doctor say you have to wear the cast? — *Six weeks.*',
      said: '「医者はギプスをどれくらいって？」に「6週間」。',
      mean: 'six weeks ＝ 約1か月半。ギプスの期間としてよくある長さ。',
      trap: 'sixty・sixteen なら six のあとに「ティ」「ティーン」が続く。weeks の語尾まで聞く。',
      use: 'I have to wear it for six weeks.（6週間つけないといけない）' },

    // why: too fancy ← “fancy face cream” is said first; Lucas asked ← the usual “he wanted to try it” script
    { id: 'd4', skill: 'detail', level: 'B1', point: 'cream', seg: [204.55, 213.7],
      stem: 'Why did he pass the face cream on to his friend Lucas?',
      choices: ['His own face is smooth already', 'Lucas asked if he could try it', 'It seemed too fancy for him'], a: 0,
      cue: '「Yeah?」のあと、Well で始まる文。',
      line: 'Well, *my face is already smooth*. So I gave it to my friend Lucas here.',
      said: '「ぼくの顔はもうすべすべだから、乾燥肌の友だち Lucas にあげた」。',
      mean: 'So の前が理由。自分には要らないので、必要な人に回した。',
      trap: 'fancy（高級な）が最初に聞こえるが、理由は So の直前。',
      use: 'Didn’t need it, so I gave it away.（要らなかったから人にあげた）' },

    // R fix: K6 — the key was the only choice with a clip word (“glowing”); blind 75 %. “too upset” became the
    //   “dry patches” line in the wrong relation.
    // why: dry patches ← “his face has dry patches” said just before; sore eyes ← “see” taken literally
    { id: 'h3', skill: 'humor', level: 'C1', point: 'glow', seg: [227.7, 238.6],
      stem: 'Why is “Now he can’t go see a movie” funny?',
      choices: ['His glowing face would light up the dark theater', 'His dry patches now look too bad to go out',
                'The cream has left his eyes too sore to watch one'], a: 0,
      cue: 'クリームの正体と、映画館の明るさ。',
      line: '*Glow in the dark* face cream? … Now he *can’t go see a movie*.',
      said: '暗いところで光るクリームだった。「おかげで彼は映画にも行けない」。',
      mean: '暗い映画館で顔が光ってしまう、という理屈の冗談。',
      trap: 'see を「目で見る」と取ると目の話に聞こえる。理由は glow in the dark。',
      use: 'Now I can’t go to the pool.（おかげでプールにも行けない）' },

    // R fix: N7/B1 — the nunchucks choice and trap note gave away c1 (reveals nunchucks), which kept c1 out of every
    //   draw led by g2, so play 3 could draw no C2. The near miss is now a payback prank.
    // why: fails ← “he can't stop” earlier; pranked back ← “remind Spencer” + “his pranks” heard as a revenge prank
    { id: 'g2', skill: 'gist', level: 'B2', point: 'plan', reveals: ['rock'], seg: [247.0, 326.8],
      stem: 'In the last part, how does the plan to stop Spencer turn out?',
      choices: ['It works, but much more roughly than planned', 'It fails, and he goes on pranking',
                'It works once they prank him right back'], a: 0,
      cue: '最後の「supposed to」と、Spencer の返事。',
      line: 'they were just *supposed to* help you get the message… — *Message received!*',
      said: '昔の被害者を呼んで思い出させる作戦。Spencer は殴られて「分かった！」。',
      mean: '目的は果たしたが、予定よりずっと手荒。supposed to ＝ 本当はそのはず。',
      trap: '仕返しのいたずらではない。supposed to は「予定と違った」の合図。',
      use: 'It was supposed to be a quiet dinner.（静かな夕食のはずだったのに）' },

    // why: first pranked ← a revenge script; kept it secret ← “he knew he had a problem” heard as her secret
    { id: 'i1', skill: 'infer', level: 'B2', point: 'fault', seg: [256.2, 263.95],
      stem: 'Why does Carly say it’s all her fault?',
      choices: ['She talked him back into pranking', 'She pranked him first, so he got even',
                'She kept his old problem a secret'], a: 0,
      cue: '「Why yours?」への答え、but のあと。',
      line: 'He didn’t want to help me, but I *sucked him back into pranking* and now he can’t stop.',
      said: '「彼は分かってて嫌がったのに、私が引き戻した」。',
      mean: 'suck ～ back into ＝「〜に引きずり戻す」。もとはやめていたと分かる。',
      trap: 'he knew he had a problem を秘密と取りやすい。理由は but のあと。',
      use: 'Don’t suck me back into that game.（あのゲームにまた引き戻さないで）' },

    // why: fell ← “bottom” as the ground, and he does get hurt later; out of ideas ← “stop” heard as running out
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'rock', seg: [263.95, 270.2],
      stem: 'What does “he hits rock bottom” mean here?',
      choices: ['He reaches his very worst point', 'He falls and hurts himself badly', 'He runs out of prank ideas'], a: 0,
      cue: '「not going to stop until」のあと。',
      line: 'He’s not going to stop until he *hits rock bottom*.',
      said: '「どん底まで落ちないと、やめないよ」。',
      mean: 'hit rock bottom ＝ 最悪の状態まで落ちる。依存の話でよく使う言い方。',
      trap: 'bottom を「地面」と取ると、転んでけがする話に聞こえる。比喩のどん底。',
      use: 'I think I’ve hit rock bottom.（もう底まで落ちたと思う）' },

    // why: a victim ← “garlic powder in kids' eyes” with Spencer heard as one of the kids; quit when caught ← the usual
    //   “got caught, so he stopped” script
    { id: 'i2', skill: 'infer', level: 'C1', point: 'ninth', reveals: ['rock'], seg: [271.3, 278.4],
      stem: 'What does the “ninth grade” line tell us about Spencer?',
      choices: ['An old prank of his once hurt other kids', 'He was once the victim of a cruel prank',
                'He gave up pranks after he was caught'], a: 0,
      cue: '「ninth grade」のあと、何がどこに入ったか。',
      line: 'Spencer *already hit rock bottom* in ninth grade. The *garlic powder in all those kids’ eyes*?',
      said: '「Spencer は中3でどん底を見た。子どもの目にガーリックパウダー」。',
      mean: '昔、彼のいたずらで何人もの子が痛い目にあった。それが彼の「どん底」。',
      trap: 'kids’ eyes で Spencer がやられた側に聞こえるが、主語は Spencer。',
      use: 'He already learned that lesson in college.（その教訓はもう大学で学んだ）' },

    // R fix (its one rewrite): V2 — blind 65 %: “new ideas” was a general appeal nobody makes about one object; the near
    //   miss is now the object itself (the nunchucks are out), which the plan talk around it refutes.
    // C2: the literal hedge (“keep an open mind” as a pitch, not flexibility)
    // why: drop it ← “open mind” heard as being flexible (柔軟); go easy ← “about the nunchucks” heard as the weapon she
    //   is holding
    // anchor: 252.5 s Carly's “Put the nunchucks away”; 279.9–280.3 s “about the nunchucks”; 280.7 s the “Hey!” at once
    { id: 'c1', skill: 'pragma', level: 'C2', point: 'nunchucks', seg: [278.35, 281.45],
      stem: 'When asked to “keep an open mind about the nunchucks”, what is really being asked?',
      choices: ['To let the nunchucks plan back in', 'To let the nunchucks plan go quietly',
                'To go easy on her for bringing them'], a: 0,
      cue: 'open mind の対象と、すぐに飛ぶ「Hey!」。',
      line: 'Well, if we could all *keep an open mind about the nunchucks*. — *Hey!*',
      said: '「ヌンチャクについても、みんな心を広く持てたら」と言い、すぐ「ちょっと！」と止められる。',
      mean: '心を広くと言うのは、自分の案を通すため。一度止められた案を、柔らかい言葉でもう一度出している。',
      trap: 'open mind を「柔軟に」と取りやすい。about のあとで誰の案か決まる。',
      use: 'Let’s keep an open mind about my plan.（私の案も前向きに考えてみてよ）' },
  ]
};
