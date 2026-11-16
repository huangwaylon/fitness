// “Monica Got a Date with a Millionaire | Friends” (the official Friends channel, Best of Season 3): her friends talk
// up Pete, the customer who left Monica a huge tip she takes for a joke, until a magazine shows he's a software
// millionaire; Monica still won't date him.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 60.3 s (whisper loops one line after
// it; the captions have music). Untested on purpose: 17.4–39 s (reading the check, then a magazine photo: "Is this
// him? — That's Bill Clinton", visual), 39.1 s ("embedded Moss 865" in both sources; no line quotes it), 54.0 s (the
// last word of "a real $20,000 …" is "Jericho" in the captions, "chair" in whisper; lines trim it with …). Speakers
// other than Monica are never named in a stem: only "Mon" (0.4 s) and "Monica's gonna…" settle anyone.
// EAR CHECK: 50.3 s nt1 — the stress in “No, I'm not gonna go out with him” falls on “not” (ship only once confirmed)
// REVIEW 2026-11-16: pass 6, fix 12, drop 0, new 0; ear checks 1
// (s1 and x1 came off the ear-check list: both sources agree on the words.)
// Open: n1 and nt2 were ≥ 50 % in my blind pass from knowing the episode / f1 and d3's stems, not from the choices;
//   kept as they are.
import type { Clip } from '../types.ts';

export const monicaMillionaire: Clip = {
  id: 'millionaire', video: 'ltbHNnrkbXY', title: 'Monica Got a Date with a Millionaire', dur: 72, wpm: 202,
  band: 'fast', tags: ['恋愛', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): "Monica likes a man" was off-scene; a role swap (Monica pushing, friends cool) now
    // why: Monica talks him up ← she tells the long customer story, so the pushing is heard as hers; warn her ←
    //   "customer… crush… so I'd call" heard as a creepy-admirer story
    { id: 'g1', skill: 'gist', level: 'B2', point: 'setup', reveals: ['fond', 'push', 'fake'], seg: [0, 22],
      stem: 'What is going on as the scene opens?',
      choices: ['Her friends talk up a man Monica brushes off', 'Monica talks up a man her friends brush off',
                'Her friends warn Monica off a pushy customer'], a: 0,
      cue: '最初の声の勢いと、モニカの返し方。',
      said: '友だちが「ピートにチャンスを」と勧め、モニカは「あのチップは冗談」と取り合わない。',
      mean: '乗り気の友だちと、相手にしないモニカのずれが、場面の出発点。',
      trap: 'crush on me を「モニカが好き」と取りやすい。好意を持つのは客の方。',
      use: 'Give him a chance. He’s sweet.（チャンスをあげなよ、いい人だよ）' },

    // R fix: V2 (blind 50 %, K6): the key was the only "and"/all-positive choice; all three now read "As X, and the
    //   tip as Y"
    // why: a bit much ← "check thing" read as the big money being over the top; a joke ← "funny" heard, and Monica's
    //   "As a joke" right after
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'fond', seg: [0, 8.7],
      stem: 'In the opening lines, how does the first speaker see Pete?',
      choices: ['As nice, and the tip as sweet', 'As nice, and the tip as a bit much',
                'As funny, and the tip as a joke'], a: 0,
      cue: '3つ並ぶほめ言葉の、最後の一つ。',
      line: 'he was funny, he seems really nice, and that check thing was *adorable*.',
      said: '「面白いし、いい人そう。あの小切手の件もかわいかった」と言う。',
      mean: 'adorable ＝ ほほえましい。大金のチップの件まで好意的に見ている。',
      trap: '大金なので「やりすぎ」と取りやすい。ほめ言葉の並びは最後の語まで聞く。',
      use: 'Oh, that’s adorable.（え、それかわいい）' },

    // R fix: V2 (blind 50 %): "asking" was weak; "listing what Monica liked" (the praise heard as reported) replaces it
    // why: teasing ← friends + "that check thing was adorable" heard as poking fun; what Monica liked ← "he was
    //   funny, he seems really nice" heard as quoting Monica's own view back to her
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'push', reveals: ['setup'], seg: [0, 8.7],
      stem: 'What is the first speaker doing in the opening lines?',
      choices: ['Listing reasons Monica should see him', 'Teasing Monica about her new admirer',
                'Listing what Monica liked about him'], a: 0,
      cue: '文頭の短い二語と、そのあとの並び。',
      line: 'let’s *give Pete a chance*. *Come on*, he was funny…',
      said: '「ピートにチャンスをあげよう。だって、面白かったし」と続ける。',
      mean: 'Come on ＝「ほら、いいじゃない」。説得の合図で、そのあとに理由を並べている。',
      trap: '友だち同士の軽い調子なので、からかいと取りやすい。Come on のあとに理由が続けば説得。',
      use: 'Come on, it’ll be fun.（いいじゃん、楽しいって）' },

    // R fix: V2 (blind 55 %): "secretly" was the only hedge; all three are now "He likes…"
    // why: fan of her food ← "customer at work" and a big tip fit a happy diner; a hard time ← crush (つぶす) read as
    //   pressure
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'crush', seg: [8.5, 14.1],
      stem: 'How does Monica describe the customer’s feelings toward her?',
      choices: ['He likes her as more than a chef', 'He likes her food more than anyone', 'He likes to give her a hard time'],
      a: 0,
      cue: '「customer at work」のあとの説明。',
      line: 'this customer at work who *has a crush on me*',
      said: '「私に気がある、店のお客さん」と説明している。',
      mean: 'have a crush on ～ ＝ ～に片思いしている、気がある。',
      trap: 'crush（つぶす）から悪い意味を想像しやすい。お客さん＋大金で「料理のファン」とも取りやすいが、on me は人への好意。',
      use: 'I had a huge crush on him.（彼に夢中だった）' },

    // why: $2,000 ← "twenty" shrinks before "thousand" and is heard as "two"; $12,000 ← "twelve" and "twenty" share
    //   the tw- onset
    { id: 'n1', skill: 'number', level: 'B1', point: 'amount', seg: [8.5, 14.1], keep: true,
      stem: 'How big was the tip the customer left?',
      choices: ['$2,000', '$12,000', '$20,000'], a: 2,
      cue: '「gave me a」のすぐあと。',
      line: 'gave me a *$20,000* tip.',
      said: '「2万ドルのチップをくれた」と言う。',
      mean: 'twenty thousand ＝ 2万。冗談だと思うほどの額。',
      trap: '速いと twenty の「ティ」が弱く、two や twelve と混ざる。thousand の前の語は長さで聞く。',
      use: 'Can you break a twenty?（20ドル札、くずせる？）' },

    // why: for the staff ← "customer at work" and a tip that size read as meant for the restaurant; wants it back ←
    //   "so I'd call" (just after) heard as a deal with strings
    { id: 'i2', skill: 'infer', level: 'B2', point: 'fake', reveals: ['amount'], seg: [8.5, 14.1],
      stem: 'At first, what does Monica assume about the tip?',
      choices: ['That he never meant her to cash it', 'That he meant it for the whole staff',
                'That he’ll want it back if she says no'], a: 0,
      cue: '文の最初の三語。',
      line: '*As a joke*, this customer… gave me a $20,000 tip.',
      said: '「冗談でね、店のお客さんが2万ドルのチップをくれたの」と話す。',
      mean: 'as a joke ＝ 冗談として。本物のお金だとは思っていない、という前置き。',
      trap: '大きなチップを「店全体へ」と取りやすい。文頭の As a joke が、全体の読み方を決める。',
      use: 'I only said it as a joke.（冗談で言っただけだよ）' },

    // R fix: V2 (blind 60 %): "make fun of her cooking" was off-scene; the usual tip script is now a distractor
    // why: a joke on her ← "As a joke" opens the story; thank her ← the usual customer-and-tip script
    { id: 'd3', skill: 'detail', level: 'B2', point: 'call', seg: [8.5, 17.1],
      stem: 'According to Monica, why did the customer leave such a tip?',
      choices: ['To get her to call him', 'To thank her for a great meal', 'To play a joke on her'], a: 0,
      cue: '「He just did it」のあと。',
      line: 'He just did it *so I’d call*.',
      said: '大金のチップの話のあと、「私に電話させたかっただけ」と言う。',
      mean: 'so (that) I’d call ＝ 私が電話するように。大金は気を引く手、と見ている。',
      trap: 'as a joke を「からかい」と取りやすい。理由は so のあとに来る。',
      use: 'I left a note so you’d see it.（気づくようにメモを置いたよ）' },

    // R fix: V2 (blind 70 %): the distractors are now a near sound ("His name's") and the literal reading of
    //   "number" on a check (the amount)
    // why: only his name ← "His number's" heard as "His name's"; the tip in words ← "number" on a check read as the
    //   amount
    { id: 'd1', skill: 'detail', level: 'B1', point: 'number', seg: [13.9, 17.1],
      stem: 'What else did the customer put on the check?',
      choices: ['His phone number', 'Only his name', 'The tip in words'], a: 0,
      cue: '「His」で始まる短い文。',
      line: '*His number’s* on the check.',
      said: '「彼の番号が小切手に書いてある」と言う。',
      mean: 'number だけで電話番号を指すことが多い。金額のことではない。',
      trap: '小切手の話なので number を金額と取りやすい。His number なら、まず人の電話番号と考える。',
      use: 'Can I get your number?（連絡先、聞いてもいい？）' },

    { id: 'x1', skill: 'dict', level: 'C1', point: 'call', seg: [13.9, 17.1],
      stem: 'Type the end of Monica’s line: “He just did it ___.” (3 words)', answer: 'so i\'d call',
      cue: '「did it」のあと、短く速い3語。',
      line: 'He just did it *so I\'d call*.',
      said: '「電話させるためにやっただけ」と言う。3語がほぼ一息。',
      mean: 'so (that) I would call の短い形。I’d の d はほぼ聞こえない。',
      trap: 'd が消えるので so I call と書きやすい。過去の話の「〜するように」なら I’d。',
      use: 'I called so you’d know.（知らせようと思って電話したよ）' },

    // R fix: V2 (blind 65 %): all three now start "Offices all over…", so scope and tense decide
    // why: all over town ← "every office" kept, "in the world" lost; used it once ← "uses"/"use it" heard as
    //   "used"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'office', seg: [38.95, 46.8],
      stem: 'What do we learn about the computer program Pete made?',
      choices: ['Offices all over the world use it', 'Offices all over town use it',
                'Offices all over the world used it once'], a: 0,
      cue: '「every」で始まる文。',
      line: '*Every office in the world* uses that program.',
      said: '「世界中のオフィスがあのソフトを使ってる」と説明する。',
      mean: '世界中のあらゆる会社、という意味。大げさではなく事実として言っている。',
      trap: 'We use it を used と聞くと「やめた」と取りやすい。-d は次の語との間で聞く。',
      use: 'Everyone at work uses it.（職場のみんなが使ってるよ）' },

    // R fix: V2 (blind 60 %): "hard to work with" was off-scene; a brag about his office is now the near miss
    // why: knows Pete ← using his program heard as knowing him; up to date ← "We use it!" said with pride, heard as
    //   bragging about his own office
    { id: 'i1', skill: 'infer', level: 'C1', point: 'useit', reveals: ['office'], seg: [38.95, 46.8],
      stem: 'Why does the speaker add the short line about his own office?',
      choices: ['To give proof that the program is everywhere', 'To show his office is up to date on tech',
                'To show he may know Pete through work'], a: 0,
      cue: '短い一言と、そのあとの「There you go」。',
      line: 'Every office in the world uses that program. *We use it!*',
      said: '「世界中の会社が使ってる。うちでも使ってる！」と付け足す。',
      mean: '身近な例を一つ足して、ピートの成功が本物で大きいことを示す。だから大金持ち、という流れ。',
      trap: '使っている＝本人を知っている、とは限らない。身近な例は「証拠」として出されることが多い。',
      use: 'Even my mom uses it!（うちの母でさえ使ってるよ）' },

    // why: have a look ← "there you go" said when handing something over (the magazine is being passed around);
    //   drop it ← "go" heard as "let it go"
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'there', reveals: ['useit'], seg: [40.6, 46.8],
      stem: 'What does the short reply after “We use it!” mean here?',
      choices: ['That settles it, then', 'Here, have a look', 'Let’s drop it, then'], a: 0,
      cue: '「We use it!」への短い返し。',
      line: 'We use it! — *There you go*.',
      said: '「うちでも使ってる！」に「ほらね」と返す。',
      mean: 'There you go ＝「ほら、それが証拠」。話の結論が出たときの一言。',
      trap: '物を渡すときの「はい、どうぞ」でもあるので、雑誌を回す場面と結びつけやすい。前の発言への返しなら「ほらね」。',
      use: 'There you go. Told you so.（ほらね、言ったでしょ）' },

    // why: she'll date him ← "Monica's gonna go out with a millionaire" (a friend's words) and the title; call to
    //   thank him ← "so I'd call" from before, plus "so exciting"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', seg: [43.4, 61.2],
      stem: 'Where does Monica stand on Pete by the end of the scene?',
      choices: ['She still won’t date him, rich or not', 'She’ll date him now that he’s rich',
                'She’ll call him, but only to say thanks'], a: 0,
      cue: '「millionaire」の直後の、モニカの返事。',
      line: 'Monica’s gonna go out with a millionaire. — No, *I’m not gonna go out with him*.',
      said: '友だちが「モニカが億万長者とデート」と騒ぐが、モニカは「デートしない」と言う。',
      mean: 'お金持ちと分かっても答えは同じ。周りとのずれが笑いになる。',
      trap: 'タイトルや友だちの言葉で「デートする」と取りやすい。決めるのは本人の返事。',
      use: 'I’m not going out with him.（彼とは付き合わないよ）' },

    // anchor: 47.2–51.6 s "Monica's gonna go out with a millionaire" — "No, I'm not gonna go out with him": she denies
    //   a claim about herself; no one else's plans are in play, so there's nothing for "I'm" to contrast with
    // why: on "I'm" ← the contrast pattern ("I'm not, but you would") learners know, and the friends are the excited
    //   ones; on neither ← the denial heard as embarrassed (照れ) now that the money looks real
    // retired: C2 stress item, until the ear check (the stress on “not”)
    { id: 'nt1', skill: 'sound', level: 'C2', point: 'end', seg: [46.6, 52.25], retired: true,
      stem: 'In Monica’s reply “No, I’m not…”, where is the stress, and why?',
      choices: ['On “not”: a flat denial of what was just said', 'On “I’m”: a contrast with the friends who would',
                'On neither: a shy, half-hearted denial'], a: 0,
      cue: '短い返事で、いちばん強く長く聞こえる語。',
      line: 'Monica’s gonna go out with a millionaire. — No, I’m *not* gonna go out with him.',
      said: '友だちが「億万長者とデートだ」と騒ぎ、モニカが「デートなんてしない」と打ち消す。',
      mean: 'not が強いと、言われたこと自体の否定。I’m を強めるのは、他の誰かと比べるとき（「私は」の「は」）。',
      trap: '照れた小声の否定と取りやすい。比べる相手がいなければ、否定の語が強くなる。',
      use: 'I’m not doing that. No way.（それはやらない、絶対に）' },

    // R fix: N6: `said` had a broken character (U+FFFD) where 億 belongs; the item is otherwise kept as is
    // anchor: 11–16.5 s "has a crush on me… so I'd call", then 48.4–58.4 s "go out with a millionaire", "a real
    //   $20,000 …", "Or incredibly offensive": real money, sent to get a date
    // why: pity ← a huge tip to a working chef read as charity (施し); fake money ← "As a joke" from the start, still
    //   heard as a prank though "real" has just been said
    // retired: one C2 alone is under 2 (nt1 retired)
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'offend', reveals: ['amount', 'fake'], seg: [46.6, 59.1], retired: true,
      stem: 'Why might someone find this tip “incredibly offensive”?',
      choices: ['It looks like he’s paying to get a date', 'It looks like he pities her for being poor',
                'It looks like he’s mocking her with fake money'], a: 0,
      cue: '「millionaire」と「real」のあとの一言。',
      line: 'Monica’s gonna go out with a *millionaire*. … a *real* $20,000… — Or incredibly offensive.',
      said: '「億万長者とデート」「本物の2万ドル」と騒ぐ中、「もしくは、ものすごく失礼」と声が入る。',
      mean: '気を引くための大金が本物なら、お金でデートを買おうとしているようにも見える。だから失礼。',
      trap: '施しと取りやすいが、出したのは気がある客。大金の意味は、誰が何のために出したかで聞く。',
      use: 'Are you trying to buy my vote?（私の票をお金で買う気？）' },

    // R fix: V2 (blind 85 %): "I ___ believe" is a fixed chunk, so "can't" was a sure guess; the gap moved to the
    //   linked "this is a" after it (both sources have it)
    // why: this was a ← a surprise story heard in the past, with the weak "is" lost; that's a ← "this is" squeezed
    //   into one syllable and heard as a contraction
    { id: 's1', skill: 'sound', level: 'B2', point: 'thisis', reveals: ['amount', 'fake'], seg: [51.65, 56.6],
      stem: 'Fill the gap: “Oh my God, I can’t believe ___ real $20,000…”',
      choices: ['this is a', 'this was a', 'that’s a'], a: 0,
      cue: '「believe」のすぐあと、つながった3語。',
      line: 'Oh my God, I can’t believe *this is a* real $20,000…',
      said: '「うそでしょ、これが本物の2万ドルなんて」と驚く。',
      mean: 'this is a が「ディスィザ」と一続き。is は弱く短く、a は is にくっつく。',
      trap: '驚いた話なので過去の was を選びやすい。目の前の小切手の話なら is。s の音が続くかで聞く。',
      use: 'I can’t believe it’s Friday already.（もう金曜なんて信じられない）' },

    // R fix: V2 (blind 55 %): the choices are now parallel ("As more X than Y")
    // why: scary ← "incredibly" heard as fear at a huge sum; a prank ← "As a joke" from the start, still heard as
    //   the frame
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'offend', seg: [51.65, 59.1],
      stem: 'Right after “so exciting”, how does the next voice see the tip?',
      choices: ['As more insulting than flattering', 'As more scary than exciting',
                'As more of a prank than a gift'], a: 0,
      cue: '「or」で始まる、もう一つの見方。',
      line: 'This is just so exciting. — Or *incredibly offensive*.',
      said: '「すごくわくわくする」に、「もしくは、ものすごく失礼」と別の声が足す。',
      mean: 'offensive ＝ 失礼。大金で気を引かれても、ほめられたことにならない。',
      trap: 'incredibly を「怖い」と取りやすい。強めるだけの語で、気持ちは後ろの語にある。',
      use: 'Honestly, I found that a bit offensive.（正直、ちょっと失礼だと思った）' },

    // R fix: V2 (blind 60 %): the choices are now parallel ("She agrees…"), so the key isn't the only mixed one
    // why: feels bad ← "yeah, sure" heard as full agreement (the 「そうだね」 frame); a joke ← "Or incredibly
    //   offensive" heard as a playful add-on, not a real objection
    { id: 'h1', skill: 'humor', level: 'C1', point: 'too', reveals: ['offend'], seg: [51.65, 61.2],
      stem: 'Why does the reply “Well, yeah, sure, that too” get a laugh?',
      choices: ['She agrees it’s rude, but is still thrilled', 'She agrees it’s rude, and now feels bad',
                'She agrees it’s a joke, and plays along'], a: 0,
      cue: '返事の最初の三語の軽さと、最後の二語。',
      line: 'Or incredibly offensive. — *Well, yeah, sure, that too*.',
      said: '「ものすごく失礼」と言われ、「まあ、うん、確かに、それもね」と返す。',
      mean: '失礼という指摘を、おまけのように軽く受け流す。興奮はそのまま。',
      trap: 'yeah, sure を本気の同意と取りやすい。that too ＝「それもある」で、元の見方は変えていない。',
      use: 'Sure, that too.（うん、それもあるね）' },
  ]
};
