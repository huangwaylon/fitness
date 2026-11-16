// REVIEW 2026-11-16: pass 3, fix 14, drop 1, new 1; ear checks 1
// OPEN: a draw with g1 leaves out 52–76 s, since i1 shares its point and a2, p1, x1, pr2, i2 and d3 reveal it. Fine as a
//   lesson, but those plays lean on the first half.
// OPEN: who says “These pins aren't for playing, are they?” (dropped pr1). A replacement could follow if the phone check settles it.
// “Monica Loves Her Seating Chart | Friends” (the official Friends channel, Best of Season 7): Monica shows off the
// pin chart for her wedding seating, her friends tease it, and Joey learns his parents aren't on the guest list.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 84 s; whisper's repeated lines after it
// are hallucinations. Untested: the found pin's owner (whisper “Oh, Rach”, captions “Oh, wait”), “Chicken alert” vs
// “Chicken, relax”, and Joey's last question (captions “which of your parents”, whisper “see, parents”). The fiancé is
// the one told “the blue pins are yours”; stems don't name him.
// EAR CHECK: 32.4 s h1 — captions “Certainly not a close one”, whisper “It's certainly not a club's one”
import type { Clip } from '../types.ts';

export const seatingChart: Clip = {
  id: 'seatingchart', video: 'TwbtoThdx3E', title: 'Monica Loves Her Seating Chart', dur: 95, wpm: 213,
  band: 'fast', tags: ['家', '友だち'],
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: the key was the only choice about the parents and the others were weak (V2, blind ≈ 60 %); all three are now about the parents
    // why: at the back ← “over here” sounds like a spot in the hall; turned down ← “not invited” heard as “not coming”
    { id: 'g1', skill: 'gist', level: 'B2', point: 'queens', seg: [0, 84.5],
      stem: 'What turns the light mood awkward partway through the scene?',
      choices: ['A friend learns his parents weren’t invited', 'A friend learns his parents sit at the back',
                'A friend learns his parents turned the invite down'], a: 0,
      cue: 'ジョーイが来てからの質問と、その答え。',
      said: '前半は席次表で冗談を言い合うが、ジョーイの質問で空気が変わる。',
      mean: '彼の両親は招待されていないと分かり、気まずくなる。',
      trap: 'over here で会場の端の席を想像しやすい。at home in Queens は会場の外、つまり呼ばれていない。',
      use: 'Wait, they’re not invited?（え、招待されてないの？）' },

    // R fix: the key was the only teasing choice (V2, blind ≈ 70 %); one distractor now teases too, the other mixes admiration with “put me…”
    // why: help ← “Oh, wow” + “take me and put me” heard as offering to place pins; talk her out ← teasing taken one step too far
    { id: 'g2', skill: 'gist', level: 'B1', point: 'firsthalf', reveals: ['bar', 'sad'], seg: [0, 34.0],
      stem: 'How do Monica’s friends respond to her chart in the first half?',
      choices: ['They joke about it and fiddle with the pins', 'They admire it, then offer to help place the pins',
                'They tease it, then talk her out of using it'], a: 0,
      cue: 'Oh, wow のあと、何を頼むか。',
      said: '一人は自分のピンをバーへ動かしたがり、もう一人は自分のピンが少ないと嘆く。',
      mean: '席次表を本気で作るモニカと、遊び半分の友だちの温度差が見える。',
      trap: 'Oh, wow はほめ言葉に、put me は手伝いに聞こえるが、自分の希望を言っているだけ。',
      use: 'Can you put me next to Sam?（サムの隣にしてくれる？）' },

    // why: band ← “where the band is” is said first; serving ← “bartender” heard as her job, not her company
    { id: 'd1', skill: 'detail', level: 'B1', point: 'bar', seg: [9.4, 15.6],
      stem: 'Where does the friend whose pin is found want to be?',
      choices: ['At the bar, talking to the bartender', 'By the band, near the dance floor',
                'At the bar, serving drinks to guests'], a: 0,
      cue: '「put me with」のあと、最後まで。',
      line: 'put me with a Manhattan in my hand *talking to the cute bartender*?',
      said: '「カクテルを片手に、かわいいバーテンと話してる所に置いてよ」と頼む。',
      mean: 'Manhattan はカクテル。席より楽しめる場所を選んでいる。',
      trap: 'bartender が聞こえると働く側を思いがち。前の talking to で、話し相手だと分かる。',
      use: 'Put me next to the window, please.（窓際の席にしてください）' },

    // R drop: pr1 (“These pins aren’t for playing, are they?”). The key needs the speaker: from Monica it's a warning, from the
    //   friend after a look it's a rueful “I get it”. Neither transcript says who (K1, GUIDE §9.7). Replaced by pr2.

    // R fix: “which of the couple” was the common-sense pick for a wedding chart (V2, blind ≈ 70 %); one distractor is now the guests/guess near sound
    // why: family ← two colors look like two kinds of guests; guesses ← “my guests” heard as “my guess” (whisper wrote it so)
    { id: 'd2', skill: 'detail', level: 'B1', point: 'colors', seg: [22.9, 26.08],
      stem: 'What do the two pin colors stand for?',
      choices: ['Which of the two of them invited each guest', 'Which guests are family and which are friends',
                'Which seats are fixed and which are guesses'], a: 0,
      cue: 'red と blue のあと、my と yours。',
      line: 'the red ones are *my guests*, and the blue pins are *yours*.',
      said: '「赤は私の招待客、青はあなたの」と分ける。',
      mean: '色で、新郎新婦どちら側の客かを表している。my と yours の対比が大事。',
      trap: 'guests の ts は弱く、guess（推測）に聞こえやすい。my と yours の対比があれば、持ち主の話。',
      use: 'These are mine, and those are yours.（こっちが私の、そっちがあなたの）' },

    // R fix: the key was the only sad choice (V2, blind ≈ 70 %); the distractors now read “so sad” two other ways.
    //   Adds imean to reveals: said's だって gives away m1's key (N7)
    // why: sorry for Monica ← “This is so sad” heard as mocking her fussy chart; moved ← “sad” heard as touched, the wedding made real
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'sad', reveals: ['ten', 'imean'], seg: [22.9, 29.2],
      stem: 'How does the fiancé feel right after the colors are explained?',
      choices: ['Sorry for himself, since he has so few pins', 'Sorry for Monica, since she’s so obsessed with it',
                'Moved, since the chart makes the wedding feel real'], a: 0,
      cue: '色の説明のすぐあと、最初の一文。',
      line: '*This is so sad.* I mean, I only have, like, ten pins.',
      said: '「悲しすぎる。だって僕のピン、10本くらいしかない」と言う。',
      mean: '招待客の少なさを、半分冗談で恥ずかしがっている。',
      trap: 'so sad を席次表への皮肉と取りやすい。続く文が自分のピンの数なので、嘆いているのは自分のこと。',
      use: 'This is so sad.（なんか悲しくなってきた）' },

    // R fix: the key was the only choice that kept the meaning (V2, blind 50 %); “new subject” is now “says it again milder”.
    //   Adds sad to reveals: the stem quotes “This is so sad” (a1's key)
    // why: takes back ← “I mean” used for self-correction elsewhere; milder ← I mean = つまり, a restatement
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['ten', 'sad'], seg: [22.9, 29.2],
      stem: 'In the fiancé’s reply, what does the phrase after “This is so sad” do?',
      choices: ['Gives the reason for what he said', 'Takes back what he just said',
                'Says it again in milder words'], a: 0,
      cue: 'sad の直後、文頭の2語。',
      line: 'This is so sad. *I mean*, I only have, like, ten pins.',
      said: '「悲しい。だって、10本くらいしかないんだよ」と続ける。',
      mean: 'この I mean は「つまり・だって」。前の気持ちの理由を足している。',
      trap: 'I mean は言い直しにも使うので、取り消しと思いやすい。前後が同じ向きなら理由の追加。',
      use: 'I’m tired. I mean, I worked all day.（疲れた。だって一日中働いたし）' },

    // why: twelve / twenty ← “ten” heard only by its t, with the n lost after “like”
    { id: 'n1', skill: 'number', level: 'B1', point: 'ten', seg: [22.9, 29.2],
      stem: 'About how many pins does the fiancé say he has?',
      choices: ['About 10', 'About 12', 'About 20'], a: 0, keep: true,
      cue: '「only have, like」のあとの数。',
      line: 'I only have, like, *ten* pins.',
      said: '「僕のピンは10本くらいしかない」と言う。like は「〜くらい」。',
      mean: '赤のピンに比べてずっと少ない、という不満の材料になっている。',
      trap: 'ten は短く、n が pins とつながって聞き逃しやすい。前の like は数をぼかす合図。',
      use: 'I only have, like, five dollars.（5ドルくらいしか持ってない）' },

    // R fix: the key was the only choice shaped like a joke (V2, blind ≈ 70 %); both distractors are now jokes too
    // why: not close ← close read as 親しい, a dig at the couple; no score ← “Certainly not” heard alone as plain agreement
    // retired pending its ear check (the key rests on “close”, which whisper hears as “club's”): un-retire once heard
    { id: 'h1', skill: 'humor', level: 'C1', point: 'close', reveals: ['sad'], seg: [28.9, 34.0], retired: true,
      stem: 'Why does the reply to “It’s not a contest” get a laugh?',
      choices: ['It agrees, then adds that he’d lose badly', 'It agrees, then hints the two aren’t close',
                'It agrees, then says nobody keeps score'], a: 0,
      cue: 'contest のあと、Certainly で始まる一言。',
      line: 'Relax, it’s not a contest. — Certainly *not a close one*.',
      said: '「競争じゃないから」に「少なくとも接戦じゃないね」と返す。',
      mean: 'close one は接戦。もし競争なら一方的だ、とピンの少なさをからかっている。',
      trap: 'close を「近い・親しい」と取ると意味が逆になる。contest の後なら「接戦」。',
      use: 'It wasn’t even close.（全然勝負にならなかった）' },

    // R fix: blind ≈ 60 % on “where are” (V2); added “what were” so both slots (w-word, are/were) are open
    // why: were ← “where are” runs together like “where were”; what ← the w-word is short and blurred; what were ← both at once
    { id: 's1', skill: 'sound', level: 'B2', point: 'whereare', seg: [41.3, 44.35],
      stem: 'Fill the gap: “Hey, so ___ my parents gonna be?”',
      choices: ['where are', 'where were', 'what are', 'what were'], a: 0,
      cue: 'so のあと、つながる2語。',
      line: 'Hey, so *where are* my parents gonna be?',
      said: '「うちの親はどこ？」と聞く。where are がつながり「ウェアラー」。',
      mean: 'これからの席の話なので are。gonna be が未来を示す。',
      trap: 'r がつながると were に聞こえやすい。後ろの gonna で時を確かめる。',
      use: 'So where are we gonna sit?（で、どこに座る？）' },

    // R fix: the key was the only drastic choice (V2, blind ≈ 60 %); a second distractor now also keeps them out of the hall
    // why: back ← “over here” sounds like a spot in the hall; party only ← “at home” heard as left out of one part
    { id: 'i1', skill: 'infer', level: 'B2', point: 'queens', seg: [44.3, 52.3],
      stem: 'When Monica places Joey’s parents, what is she really telling him?',
      choices: ['They aren’t on the guest list at all', 'They’ll sit at a table by the back wall',
                'They’re asked to the party, not the service'], a: 0,
      cue: 'wedding hall のあと、指さす場所の言い方。',
      line: 'if this is the wedding hall, then, um, your parents would be over here *at home in Queens*.',
      said: '「ここが式場なら、あなたの両親はこっち。クイーンズの自宅」と示す。',
      mean: '式場の外、つまり家にいる。遠回しに「招待していない」と伝えている。',
      trap: 'over here で式場内の席を想像しやすい。at home が来たら会場の外の話。',
      use: 'Let’s see… you’d be over here.（えーと、あなたはこっちね）' },

    // R fix: “relieved” and “amused” fell to common sense (V2, blind ≈ 80 %); distractors now angry and doubtful
    // why: angry ← a sharp “What?” heard as anger at Monica; doubtful ← “They’re not invited?” heard as checking if she's teasing
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'shock', reveals: ['queens'], seg: [52.3, 56.95],
      stem: 'How does Joey react to where his parents will be?',
      choices: ['Stunned, since he took it for granted they’d come', 'Angry, since Monica never checked with him',
                'Doubtful, since he thinks Monica is teasing'], a: 0,
      cue: '最初の短い一言と、上がる声。',
      line: '*What?* They’re not invited?',
      said: '「え？招待されてないの？」と驚いて聞き返す。',
      mean: '当然呼ばれると思っていた。ここから気まずい話になる。',
      trap: '聞き返しは疑いにも怒りにも聞こえるが、続く that’s terrible と crushed で、本気の驚きと分かる。',
      use: 'What? Since when?（え？いつから？）' },

    // R fix: the key was the only sad choice (V2, blind 50 %); now hurt vs furious vs squeezed
    // why: squeezed ← “crushed” read literally, and the talk is about seats; furious ← a strong word heard as anger
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'crushed', reveals: ['queens'], seg: [53.95, 56.98],
      stem: 'What does the line after “That’s terrible” say about Joey’s parents?',
      choices: ['They’ll be deeply hurt by it', 'They’ll be furious at her',
                'They’ll be squeezed in at a tiny table'], a: 0,
      cue: 'terrible のあと、going to be の次の語。',
      line: 'Oh, no, that’s terrible. They’re gonna be *crushed*.',
      said: '「ひどい。二人ともすごく落ち込むよ」と言う。',
      mean: 'be crushed ＝ ひどくがっかりする、心が折れる。悲しみの強い言い方。',
      trap: 'crush は「つぶす」なので、席の話だと狭い席を想像しやすい。人が主語なら気持ちのこと。',
      use: 'She was crushed when she heard.（聞いて彼女はひどく落ち込んだ）' },

    // R fix: reveals queens; the stem's “think they're invited?” gives away i1's key (N7)
    { id: 'x1', skill: 'dict', level: 'B2', point: 'whywould', reveals: ['queens'], seg: [56.65, 59.5],
      stem: 'Type the start: “___ think they’re invited?” (3 words)', answer: 'why would they',
      cue: '最初の3語。would が弱い。',
      line: '*Why would they* think they’re invited?',
      said: '「なんで招待されてると思ってるの？」。would は「ウッ」程度に弱い。',
      mean: 'Why would ～? は「そう思う理由がないのに」という気持ちを込めた質問。',
      trap: 'would が消えて why they に聞こえやすい。疑問の形なので助動詞があるはず。',
      use: 'Why would I lie?（なんで嘘つく必要があるの？）' },

    // R new: pragma, replacing pr1 (blind read ≈ 40 %)
    // why: invitation ← “invited” in a question heard as a real check on the cards; won't mind ← heard as a calming reply to “crushed”
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'told', reveals: ['whywould', 'queens'], seg: [56.65, 63.2],
      stem: 'When Joey says his parents will be crushed, what does the reply do?',
      choices: ['Hints that Joey gave them the wrong idea', 'Asks Joey whether an invitation went out',
                'Tells Joey his parents won’t really mind'], a: 0,
      cue: 'crushed のすぐあと、Why で始まる質問。',
      line: '*Why would they think they’re invited?* — You got me, I don’t… — Joey!',
      said: '「なんで招待されてると思うの？」と聞き、言葉を濁すジョーイの名前を強く呼ぶ。',
      mean: '答えを求めていない。「あなたが何か言ったんでしょ」という疑い。',
      trap: 'invited で招待状の確認に聞こえやすい。Why would ～? は「理由はないはず」の含み。',
      use: 'Wait, who said you could come?（待って、来ていいって誰が言ったの？）' },

    // R fix: “card by mistake” and “asked Monica” weren't refuted by the segment, and the key was the only one that fit (K1, V2,
    //   blind ≈ 60 %); the choices are now about where the idea came from. Reveals queens (the line implies it)
    // why: no idea ← “You got me, I don't…” taken at its word; Monica ← “You got me” heard as “it was you”
    { id: 'i2', skill: 'infer', level: 'C1', point: 'told', reveals: ['whywould', 'queens'], seg: [56.65, 63.2],
      stem: 'What do Joey’s answer and the reaction to it suggest?',
      choices: ['Joey is the one who gave them that idea', `Joey truly has no idea where it came from`,
                'Joey thinks Monica gave them that idea'], a: 0,
      cue: '質問のあと、答えが途切れたところと名前を呼ぶ声。',
      line: 'Why would they think they’re invited? — *You got me, I don’t…* — Joey!',
      said: '「なんで招待されてると思うの？」に「さあね…」とごまかし、名前を強く呼ばれる。',
      mean: '本人が親に「来ていい」と言ってしまったのが明らか。',
      trap: 'You got me は「知らない」の意味だが、ここは言葉どおりに取らず、続く Joey! で判断する。',
      use: 'You got me. No idea.（さあね、全然わからない）' },

    // R fix: the key was the only choice about Joey's own belief (V2, blind 50 %); the distractors now are other people's words.
    //   Reveals queens (the line implies it)
    // why: Monica said ← “I thought parents were coming” heard as a report; his parents said ← “invited” + “coming” heard as their claim
    { id: 'd3', skill: 'detail', level: 'B2', point: 'assume', reveals: ['queens'], seg: [63.15, 71.0],
      stem: 'Why did Joey think his parents were coming?',
      choices: ['He just assumed every parent was invited', 'Monica had said every parent was invited',
                'His parents said Monica had invited them'], a: 0,
      cue: 'Look のあと、I thought の文。',
      line: 'Look, I *thought parents were coming*.',
      said: '「親はみんな来るものだと思ってた」と謝りながら説明し、来る親を並べる。',
      mean: '誰かに言われたのではなく、自分で決めつけていた。',
      trap: 'I thought を「言われた」と取りやすい。think の過去形は自分の思い込みを表す。',
      use: 'Sorry, I thought you knew.（ごめん、知ってると思ってた）' },

    // R fix: the key was the only choice shaped like a slip (V2, blind ≈ 60 %); both distractors are now slips in the list
    // why: never invited ← the reply heard as “not those parents”; forgot hers ← “your parents” at the start is short and easy to miss
    { id: 'h2', skill: 'humor', level: 'C1', point: 'twice', reveals: ['assume'], seg: [63.15, 74.6],
      stem: 'Why is Monica’s reply to Joey’s list funny?',
      choices: ['He counted the same couple twice', 'He named a couple not invited',
                'He left her own parents off his list'], a: 0,
      cue: '最後の返事の、parents の前の語。',
      line: 'your parents are coming… Ross’s parents are coming. — Ross’s parents are *my parents*.',
      said: 'ジョーイは来る親として「君の親」と「ロスの親」を別々に挙げるが、同じ二人だった。',
      mean: '兄妹なので親は同じ。数を水増しした言い訳が崩れる。',
      trap: '名前が並ぶと別の家族に聞こえる。返事の my parents で同じ人だと分かる。',
      use: 'Wait, that’s the same person.（待って、それ同じ人だよ）' },

    // why: Joey's feelings ← the kind reason anyone would give; empty seats ← the talk is all about a hall's seating
    { id: 'i3', skill: 'infer', level: 'C1', point: 'bluepins', seg: [78.5, 84.5],
      stem: 'What does the reply to the idea of inviting them suggest?',
      choices: ['It’s really about adding guests to the blue side', 'It’s really about sparing Joey’s feelings',
                'It’s really about filling the empty seats'], a: 0,
      cue: '「Oh, please」のあとの一文。',
      line: 'I think we should invite them. — Oh, please. You just want *more blue pins*.',
      said: '「招待しようよ」に「よく言うわ。青いピンを増やしたいだけでしょ」と返す。',
      mean: '親切に見える提案の本音は、自分の客を増やしたいこと。',
      trap: '提案の言葉だけなら優しさに聞こえる。Oh, please は「本音は分かってる」の合図。',
      use: 'Oh, please. You just want dessert.（よく言うよ。デザートが目当てでしょ）' },
  ]
};
