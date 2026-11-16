// “Joey’s Parting Gift for Chandler | Friends” (the official Friends channel, Best of Season 6): on their last night as
// roommates Joey gives Chandler the big white dog; Chandler's offer to buy it reads to Joey as charity, and Joey says he
// can look after himself and will only miss Chandler (and now the dog).
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Chandler (71 s); Joey by the title.
// Untested: 0–2.6 s ("play" vs "put one more hand"), 12.5 s ("cups money": the game needs backstory), 49.7 s ("the
// bills": what they were needs backstory).
// REVIEW 2026-11-17: pass 5, fix 16, drop 0, new 0; ear checks 1
// OPEN: i2 is still helped by the title ("Parting Gift"), with a cold read at 70 %. i1's key leans on knowing Joey
//   treats the dog as alive, but "It's him, not it" settles it from the words
// EAR CHECK: 69.8–70.4 s c2 — the stress in "I will be okay" falls on "will" (ship only once confirmed)
import type { Clip } from '../types.ts';

export const joeyDog: Clip = {
  id: 'joeydog', video: 'xSXG6xy3Wx4', title: 'Joey’s Parting Gift for Chandler', dur: 101, wpm: 155, band: 'mid',
  tags: ['家', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %): the promise distractor named Chandler and the key echoed "lose another". All three are
    //   now gambler's reasons, and none quotes the line
    // why: ahead ← lose/win flip when "lose" is caught weakly; luck about to turn ← "I'm serious this time" heard as a
    //   gambler's hunch
    { id: 'd1', skill: 'detail', level: 'B1', point: 'dime', seg: [0, 7.0],
      stem: 'Why does Joey refuse to play one more hand?',
      choices: ['He can’t afford to lose any more money', 'He feels his luck is about to turn bad',
                'He’s ahead and wants to keep his winnings'], a: 0,
      cue: '「No, no」のあと、すぐ続く理由。',
      line: 'No, no, no more. I *cannot lose another dime*.',
      said: '「これ以上1セントも負けられない。今度は本気」と断る。',
      mean: 'another dime で「もう1円も」に近い。負けが続いている。',
      trap: 'lose が弱いと「勝っているから」と逆に取りやすい。理由は負けの話。cannot lose を聞き取る。',
      use: 'I can’t spend another dime this month.（今月はもう1円も使えない）' },

    // why: moving out ← the scene is a goodbye, so "now" sounds like a deadline; bet it ← "hand" and the game just before
    //   make "give it to you" sound like a stake
    { id: 'd2', skill: 'detail', level: 'C1', point: 'pawn', seg: [6.9, 14.2],
      stem: 'Why does Joey want to hand over his gift right now?',
      choices: ['Before he ends up selling it to keep gambling', 'Because he is moving out early the next morning',
                'So Chandler can bet it in their next game'], a: 0,
      cue: '「now」のすぐあとに続く理由。',
      line: 'let me give it to you now *before I pawn it* for cups money.',
      said: '「今のうちに渡させて。ゲームの金ほしさに質に入れる前に」と言う。',
      mean: 'pawn ＝ 質に入れる。持っていたら賭けのお金に換えてしまう、という自虐。',
      trap: 'お別れの場面なので「明日出ていくから」と考えやすい。now の理由は、すぐあとの部分で言う。',
      use: 'Take it before I change my mind.（気が変わる前に持っていって）' },

    // R fix: V2 (blind 75 %): "Joey asks to be paid" made no sense for a gift. Now two choices start "Chandler offers
    //   to pay" and split on Joey's reason
    // why: too little ← "reasonable price" + "$1,500" heard as a lowball the giver resents; unwanted ← "I can't take
    //   the big white dog" is Chandler's first answer
    { id: 'g1', skill: 'gist', level: 'B2', point: 'turn', reveals: ['charity'], seg: [14.8, 54.55],
      stem: 'Why does Joey’s goodbye gift lead to an argument?',
      choices: ['Chandler offers to pay, and Joey won’t take his money',
                'Chandler offers to pay, and Joey thinks it’s too little',
                'Chandler turns it down, and Joey feels his gift is unwanted'], a: 0,
      cue: '値段の話のあと、Joey が何に気づくか。',
      line: 'what if I *bought it from you*? … You’re *trying to give me money again*.',
      said: 'Chandler が犬を買い取ると言い、Joey はお金を渡す手だと気づく。',
      mean: '贈り物が、お金を受け取るかどうかの話に変わる。Joey は施しを受けたくない。',
      trap: '「安すぎる」と取りやすいが、Joey が嫌がるのは額でなくお金そのもの。',
      use: 'At least let me pay you for it.（せめてお金を払わせて）' },

    // R fix: V2 (blind 60 %): the key was the only warm reading. All three are now "feels/is unsure" states
    // why: good enough ← the Japanese gift frame つまらないものですが (playing a gift down); accept ← Chandler does refuse
    //   next, so the hesitation reads as doubt
    { id: 'm1', skill: 'marker', level: 'C1', point: 'fillers', reveals: ['roommate'], seg: [14.8, 24.2],
      stem: 'On the way to “thank you”, what do Joey’s little filler words show?',
      choices: ['He finds it awkward to say something heartfelt', 'He’s unsure the dog is a good enough gift',
                'He’s unsure Chandler will accept the dog'], a: 0,
      cue: '「a kind of a」から「thank you」までの言いよどみ。',
      line: 'as *a kind of a, you know, like* a thank you for being such a great roommate.',
      said: '言葉を探しながら「お礼みたいなもの」と渡す。',
      mean: 'a kind of、you know、like が重なるのは、照れくさい本音を言う前の時間かせぎ。',
      trap: '日本語の「つまらないものですが」と重ねやすいが、物は下げていない。言いよどみの先の言葉を聞く。',
      use: 'This is, you know, kind of a thank-you.（これ、まあ、お礼みたいなもの）' },

    // R fix: V2 (blind 60 %): "lending him money so often" was a loose fit. It's now "covering the rent", money
    //   help a roommate gives
    // why: rent ← money comes up all through the scene, and "roommate" brings rent to mind; win ← "one more hand" and the
    //   game just before
    { id: 'd3', skill: 'detail', level: 'B1', point: 'roommate', seg: [14.8, 24.2],
      stem: 'What is Joey thanking Chandler for with the gift?',
      choices: ['Being such a great roommate', 'Covering the rent so often', 'Letting him win tonight’s game'], a: 0,
      cue: '「thank you for」のあと。',
      line: 'like a thank you *for being such a great roommate*.',
      said: '「最高のルームメイトでいてくれたお礼」として犬を渡す。',
      mean: 'thank you for ＋ ing で、何へのお礼かを言う。',
      trap: 'お金やゲームの話が多い場面なので、そちらへのお礼と思いやすい。for のあとで理由が分かる。',
      use: 'Thanks for being such a good friend.（いい友だちでいてくれてありがとう）' },

    // R fix: V2 (blind 60 %): "secretly wants it" was weak. It's now "hurt at the refusal", the natural feeling at
    //   that moment
    // why: making fun ← a reply that corrects sounds like taking offence; hurt ← "I can't take the big white dog" comes
    //   just before, so the quick reply sounds wounded
    { id: 'i1', skill: 'infer', level: 'C1', point: 'him', seg: [24.0, 30.6],
      stem: 'When Chandler says “You love it”, what does Joey’s quick reply show?',
      choices: ['He treats the dog almost like a person', 'He feels Chandler is making fun of the dog',
                'He’s hurt that Chandler is turning it down'], a: 0,
      cue: 'it という代名詞への反応。',
      line: 'You love *it*. — *It’s him, not it*.',
      said: '「好きだろ、それ」に、Joey は「それじゃなくて彼」と直す。',
      mean: 'it は物、him は人。置物の犬を仲間のように扱っていると分かる一言。',
      trap: '断られた直後なので傷ついたようにも聞こえるが、直しているのは代名詞だけ。何を直したかを聞く。',
      use: 'Actually, it’s a she.（実はメスなんです）' },

    // why: $150 ← "fifteen" caught without its "hundred"; $500 ← the first syllable lost; $15,000 ← hundred/thousand
    { id: 'n1', skill: 'number', level: 'B1', point: 'price', seg: [30.8, 39.6],
      stem: 'What price does Chandler name for the dog?',
      choices: ['$150', '$500', '$1,500', '$15,000'], a: 2, keep: true,
      cue: '「reasonable price」のあとの数字。',
      line: 'at a reasonable price, say *$1,500*?',
      said: '「手ごろな値段で、そうだな、1,500ドルでどう？」と持ちかける。',
      mean: 'say は「たとえば」。値段を今思いついたように言う前置き。',
      trap: '数字は hundred と thousand、fifteen と fifty の区別が要。桁の語を最後まで聞く。',
      use: 'How about, say, twenty dollars?（たとえば20ドルでどう？）' },

    // R fix: V2 (blind 65 %): "makes fun of Joey" was a weak filler. Now Chandler suddenly wanting the dog (a
    //   buyer's reason) competes
    // why: haggles ← "reasonable price" read literally as haggling; always wanted ← buying sounds like wanting it,
    //   though he has just said "I can't take the big white dog"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'gesture', reveals: ['charity'], seg: [30.8, 41.0],
      stem: 'Why does the audience laugh at Chandler’s offer to buy the dog?',
      choices: ['He turns paying Joey into a favor Joey does him', 'He haggles as if Joey had put it up for sale',
                'He pretends he has always wanted the dog'], a: 0,
      cue: '「your nice gesture」が誰の何を指すか。',
      line: 'your *nice gesture would be giving it to me* at a reasonable price',
      said: '「君の親切は、犬を手ごろな値段で僕に譲ること」と言う。',
      mean: 'お金を渡したいのを、Joey の親切という形に言いかえた、見え見えの理屈が笑い。',
      trap: '値切りと取りやすいが、値段は自分から言う。誰が得する話か考える。',
      use: 'You’d be doing me a favor, really.（むしろ助かるんだよ）' },

    // R fix: V2 (blind 75 %): "plays along with a joke" and "a fair deal" were far from Joey's suspicion. Now a
    //   suspicious misreading (a trick to get the dog) competes
    // why: trick ← "I see what you're trying to do here" heard as Chandler angling for the dog; touched ← the offer is
    //   kind, and the audience laughs warmly
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'charity', seg: [40.8, 54.55],
      stem: 'How does Joey take Chandler’s offer once he stops to think?',
      choices: ['As charity in disguise, and his pride is hurt', 'As a trick to get the dog cheap, and he’s offended',
                'As a kind offer, and he’s touched by it'], a: 0,
      cue: '「Wait a second」のあと、again が付く理由。',
      line: 'You’re *trying to give me money again*. … You tried to give me *charity*.',
      said: '「また金を渡す気だな。さっきも施しをしようとした」と見抜く。',
      mean: 'charity ＝ 施し。友の援助をそう呼ぶのは、傷ついたプライドのしるし。',
      trap: '見抜いたの一言は「犬狙い」とも取れるが、続くのは money と charity。',
      use: 'I don’t need your charity.（施しはいらない）' },

    // R fix: V2 (blind 75 %): the key was the only deeper, under-the-surface choice. "Who keeps the dog" is now
    //   "whether Chandler takes the gift seriously", another relationship reading
    // why: worth ← the price is the last thing said before the argument; seriously ← Chandler refuses the gift, then
    //   tries to buy it
    { id: 'g2', skill: 'gist', level: 'B2', point: 'manage', reveals: ['okay'], seg: [40.8, 84.6],
      stem: 'Under the talk about the dog, what are they really arguing about?',
      choices: ['Whether Joey can manage without Chandler’s help', 'Whether the dog is worth what Chandler offered',
                'Whether Chandler takes Joey’s gift seriously'], a: 0,
      cue: '後半、「分かってくれ」と頼む中身。',
      line: '…that *I can’t take care of myself*, okay?',
      said: 'Joey は「自分のことは自分でできると分かって」と言う。',
      mean: '犬や値段は表向きの話。本題は、Joey が助けなしでやっていけるかどうか。',
      trap: '最初に出た犬と値段に引っぱられやすい。言い合いの本題は、最後に強く言う一言に出る。',
      use: 'I can take care of myself.（自分のことは自分でできる）' },

    // R fix: V2 (blind 70 %): "walked out on Joey" was off. The choices are now three short readings of "drop it"
    // why: fall ← "dropped" read literally, with "the bills" just before; lowered ← drop the price (値下げ), with money
    //   the topic
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'dropped', seg: [49.5, 57.0],
      stem: 'As Joey sums up earlier tonight, what did Chandler do after the “no”?',
      choices: ['He let the subject go', 'He let the money fall', 'He lowered the amount'], a: 0,
      cue: '「I said no」のすぐあとの短い3語。',
      line: 'I said no, *you dropped it*. Okay, then we had a nice…',
      said: '「僕が断って、君はその話をやめた」とまとめる。',
      mean: 'drop it ＝ その話をやめる。Drop it! は「もうその話はよせ」の決まり文句。',
      trap: 'the bills の直後なので、お金を落とした絵を思い浮かべやすい。it は話題も指す。',
      use: 'Let’s just drop it, okay?（もうその話はやめよう）' },

    // R fix (its one C2 rewrite): V2 (blind 60 %): "hints try again" was weak. Now all three choices are about
    //   Joey's memory of the offer
    // why: forgotten ← an honest memory slip is a fluent reading of a flat denial; mixed up ← "give anybody any money"
    //   heard as a muddle about who gave what
    // anchor: 51.6–53.2 s "You tried to give me charity. I said no", then 58.8–60.0 s "nobody tried to give anybody any
    //   money", a denial of what he described seconds before; the laugh at 61.6 s
    { id: 'c1', skill: 'humor', level: 'C2', point: 'nobody', reveals: ['charity'], seg: [49.5, 62.5],
      stem: 'Why does “nobody tried to give anybody any money” get a laugh?',
      choices: ['Joey wipes out what he said seconds before', 'Joey has honestly forgotten the earlier offer',
                'Joey has mixed up who offered money to whom'], a: 0,
      cue: '数秒前に Joey 自身が言ったことと比べて。',
      line: 'You tried to give me *charity*. I said no… *nobody tried to give anybody any money*.',
      said: '「施しを断った」直後に「誰も金を渡そうとしてない」とまとめる。',
      mean: '自分で話した事を、なかった事にして収める。プライドを守る作り話を堂々と言うのがおかしい。',
      trap: '物忘れと取りやすいが、数秒前に自分で話している。近い打ち消しは、わざと。',
      use: 'As far as I’m concerned, it never happened.（私の中では、なかった事だから）' },

    // R fix: V2 (blind 70 %, from the title "Parting Gift"): "agreed this is their last game ever" was weak. It's
    //   now a quit-gambling pact, built on "I'm serious this time". The title still helps the key (open question)
    // why: yesterday ← "last night" read as 昨夜; quit ← "last" + "we gambled" + the opening "I'm serious this time"
    { id: 'i2', skill: 'infer', level: 'C1', point: 'lastnight', seg: [54.45, 61.5],
      stem: 'What does Joey’s phrase for this evening tell us about the two of them?',
      choices: ['They won’t be living together after tonight', 'They already spent yesterday evening together',
                'They have both agreed to quit gambling now'], a: 0,
      cue: '「a nice」のあとの3語。',
      line: 'we had a nice *last night together*.',
      said: '「僕らは楽しい最後の夜を一緒に過ごした」と言う。',
      mean: 'last night は普通「昨夜」だが、ここは「最後の夜」。同居の最後の晩だと分かる。',
      trap: 'last night ＝ 昨夜と覚えていると取り逃す。a nice が前に付くので「最後の夜」と読む。',
      use: 'It’s our last night in Paris.（パリ最後の夜だね）' },

    // R fix: V2 (blind 65 %): "quietly" was weak. "Over and over" (a misreading of "start… again") replaces it
    // why: sadly ← blue = 憂うつ (ブルーな気分); over and over ← "start with the charity thing again" heard as
    //   nonstop
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'blue', reveals: ['charity'], seg: [62.3, 65.65],
      stem: 'How does Joey say the charity talk came back?',
      choices: ['Suddenly, with nothing leading up to it', 'Sadly, as if Chandler were feeling down',
                'Over and over, all night long'], a: 0,
      cue: '「Now,」のすぐあとの4語。',
      line: 'Now, *out of the blue* you’d start with the charity thing again.',
      said: '「なのに、いきなりまた施しの話を始める」と言う。',
      mean: 'out of the blue ＝ 前触れもなく、突然。晴れた空から急に来るイメージ。',
      trap: 'blue を「ブルーな気分」と取りやすい。英語では、空から突然という意味でよく使う。',
      use: 'She called me out of the blue.（彼女から突然電話が来た）' },

    // R fix: V2 (blind 65 %): "asking Joey to help in return" was silly. "The offer was only a joke" (the laugh
    //   just before) replaces it
    // why: apology ← "just" and "okay?" sound like backing down (日本語の「ごめん、ただ…」); joke ← the audience laughed
    //   at the "nice gesture" pitch
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'helpout', seg: [65.65, 69.7],
      stem: 'When Chandler answers the charity complaint, what is he doing?',
      choices: ['Defending his offer as simple care', 'Taking the offer back with an apology',
                'Saying the offer was only a joke'], a: 0,
      cue: '文頭の just と、文末の okay? に注目。',
      line: 'I’m *just trying to help you out*, okay? I want to *make sure that you’re okay*.',
      said: '「助けたいだけなんだ。君が大丈夫か確かめたい」と言う。',
      mean: 'just は「それ以上の意図はない」。施しではなく心配だと、申し出を弁護している。',
      trap: 'just や okay? は謝りにも聞こえるが、申し出は取り消していない。言い分が続くかを聞く。',
      use: 'I’m just trying to help.（助けたいだけだよ）' },

    // EAR CHECK (header): the stress
    // R fix (its one C2 rewrite): V2 (blind 50 %): the key was the only choice with a two-part reason. All three now
    //   give a reason of the same weight
    // why: on "I" ← the you→I swap sounds like a contrast (worry about yourself); flat "okay" ← a short reply after a
    //   worried line heard as unsure (気まずい間)
    // anchor: 67.8–69.0 s "I want to make sure that you're okay", answered at once by "I will be okay": the reply
    //   pushes back on the doubt, and no one else is compared
    { id: 'c2', skill: 'sound', level: 'C2', point: 'okay', seg: [65.65, 70.95],
      stem: 'After “make sure that you’re okay”, where is Joey’s stress, and why?',
      choices: ['On “will”: insisting he’ll be fine, doubt or not', 'On “I”: saying it’s Chandler who should worry',
                'On “okay”: sounding unsure he really will be'], a: 0,
      cue: '短い返事で、いちばん強く長く聞こえる語。',
      line: 'I want to make sure that you’re okay. — I *will* be okay.',
      said: '「君が大丈夫か確かめたい」に、Joey は「大丈夫になるさ」と短く返す。',
      mean: 'will を強めると「心配されても大丈夫」と言い張る響き。強勢は反論に乗る。',
      trap: 'you から I に変わるので対比に聞こえやすいが、比べる相手はいない。',
      use: 'I will finish it, I promise.（ちゃんと終わらせるって、約束）', retired: true },

    // why: grateful ← "the only thing I'm going to miss is you" heard as thanks for the help; hurt ← "get it out of
    //   your head" heard as a grudge he covers up
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'okay', reveals: ['manage'], seg: [69.6, 84.6],
      stem: 'How does Joey feel about Chandler worrying over him?',
      choices: ['Touched, though tired of being seen as helpless', 'Grateful, though embarrassed that he needs help',
                'Hurt, though he hides it behind a little joke'], a: 0,
      cue: '途中の頼みと、最後の一言の両方を聞く。',
      line: '…*that I can’t take care of myself*… *The only thing that I’m going to miss is you*.',
      said: '「できないなんて思うな」と言い、最後に「寂しいのは君だけ」と伝える。',
      mean: '心配されるのは嫌だが、心配してくれる相手は大事。苛立ちと愛情が同じ人に向いている。',
      trap: '助けが要らないと言うので、強がりに聞こえやすい。最後の一言は本気で、冗談の印もない。',
      use: 'I appreciate it, but I’ve got this.（ありがとう、でも自分でやれる）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'head', seg: [70.95, 76.2],
      stem: 'Type the words: “Look, Chandler, you got to ___ that I can’t…” (6 words)',
      answer: 'get it out of your head',
      cue: '「you got to」のすぐあと。つながる音に注意。',
      line: 'Look, Chandler, you got to *get it out of your head* that…',
      said: '「頭から追い出してくれ」。全体がひと続きに聞こえる。',
      mean: 'その考えを捨てる、という意味。思いこみをやめてほしいときの言い方。',
      trap: 'get it の t が弾んで「ゲリ」、out of が「アウロ」になる。小さな語も数えて書く。',
      use: 'Get that idea out of your head.（その考えは捨てて）' },

    // why: going to ← "not" is short and weak before "going"; only going to ← "only" comes in the very next line
    { id: 's1', skill: 'sound', level: 'B1', point: 'miss', seg: [76.2, 80.4],
      stem: 'Fill the gap: “Look, I’m ___ miss you helping me out with money.”',
      choices: ['not going to', 'going to', 'only going to'], a: 0,
      cue: '「I’m」と「going」の間に何が入るか。',
      line: 'Look, I’m *not going to* miss you helping me out with money.',
      said: '「お金で助けてもらえなくなるのは寂しくない」と言う。',
      mean: '次の「寂しいのは君だけ」への前置き。まず、お金の話ではないと打ち消している。',
      trap: 'not は I’m と going の間で弱くなりやすい。否定の有無は次の文とのつながりで確かめる。',
      use: 'I’m not going to miss this weather.（この天気は恋しくならないな）' },

    // predict: the segment stops after "is you" (84.2 s); the continuation starts at 87.6 s
    // R fix: V2 (blind 65 %): "the one thing" in the stem set up the add-on. The stem is neutral now, and "a joke
    //   that takes it back" (c3's trap) replaces the weak "question about leaving"
    // why: promise ← the usual goodbye script after "I'll miss you"; takes it back ← a punchline after a tender line
    //   can read as undoing it
    { id: 'p1', skill: 'predict', level: 'B2', point: 'dog', seg: [76.2, 86.6], then: [86.6, 90.0],
      stem: 'After Joey says what he’ll miss, what kind of line comes next?',
      choices: ['An add-on that stretches what he just said', 'A joke that takes back what he just said',
                'A promise that they’ll still see each other'], a: 0,
      cue: '「the only thing」という言い切り方に注目。',
      line: 'The *only* thing that I’m going to miss is you. … *And now the dog*.',
      said: '「寂しいのは君だけ」と言ったあと、少し間をおいて「それと、今は犬も」と足す。',
      mean: 'only と言い切ったすぐあとに付け足して、自分で言った「だけ」を崩す。',
      trap: '笑いの一言は「冗談でした」にも見える。only の言い切りは、足し算の前ふり。',
      use: 'That’s all I need. Oh, and coffee.（それだけでいい。あ、あとコーヒー）' },

    // R fix (its one C2 rewrite): V2 (blind 50 %): the key was the only plain description and quoted "only". All
    //   three now describe what the line does to "you"
    // why: was a joke ← a punchline after a tender line can read as taking it back (sincerity flip); swaps ← "now the
    //   dog" heard as the dog replacing Chandler (scope shift)
    // anchor: 80.8–83.7 s "The only thing that I'm going to miss is you", then 87.6 s "And now the dog": "and" adds the
    //   dog he has just given away; nothing takes back "you"
    { id: 'c3', skill: 'humor', level: 'C2', point: 'dog', seg: [76.2, 90.0],
      stem: 'What makes the very last line of the scene funny?',
      choices: ['He adds the dog, so his “only” is no longer true', 'He shows the line about Chandler was a joke',
                'He swaps Chandler out for the dog after all'], a: 0,
      cue: '言い切りの一言と、間をおいた付け足し。',
      line: 'The *only thing* that I’m going to miss is you. … *And now the dog*.',
      said: '「寂しいのは君だけ」と言い切り、間をおいて「それと、今は犬も」と付け足す。',
      mean: '譲ったばかりの犬が急に惜しくなり、「だけ」が数秒で崩れる。君への一言はそのまま。',
      trap: '「冗談だった」と取りやすいが、and now は打ち消しでなく追加。',
      use: 'Just you. And maybe pizza.（君だけ。あと、ピザも）' },
  ]
};
