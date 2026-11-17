// “Freddie and Carly Lose Their Money in a Scam?! 💸 New iCarly Full Scene | NickRewind” (NickRewind, Best of Carly &
// Freddie #Creddie): Freddie has quit his job to sell “sand”, his daughter calls it an MLM, and on a live sales show
// Carly finds out the product is fish food. Segments from the captions, words from whisper (2026-11-17).
// Speakers: Freddie holds the “VIPDS for NSD” title (5 s, 120.6 s) and quit his job (284–292 s); Spencer is the “real
// sand fan” (144.7 s) and the “sensitive” one (95 s); Carly is addressed before the owl story (206.6 s) and the drink
// (236.9 s). The 90–108 s lines could be Carly's or Freddie's, so those stems say “the speaker”; the explainer is “the
// podcast fan” (76 s), and the man who answers “No…” at 254.7 s is “the co-host”. No key uses 37 s (“placate” vs
// “play kate”), 38.9 s (“Brave San Freddy” vs “braves and freddy”) or 87.7 s (garbled in both).
// REVIEW 2026-11-17: pass 5, fix 19, drop 0, new 0; ear checks 3
// EAR CHECK: 28.0 s s1 — captions "i'm gonna be", whisper "I'm going to be": confirm the reduced "gonna"
// EAR CHECK: 237.5 s s2 — "Why don't you" runs together ("ワイドンチュ"), not "Why won't you" / "Won't you"
// EAR CHECK: 263.6 s x1 — "wanted to meet up": the t's merge ("ワニダ"); both sources agree on the words
// Open: the 38.9 s line ("Brave San Freddy leaps…") may be Freddie or Griffin speaking, so f1 no longer says who.
import type { Clip } from '../types.ts';

export const sandScam: Clip = {
  id: 'sandscam', video: 'Uhui0JbYrdM', title: 'Freddie and Carly Lose Their Money in a Scam?! 💸 New iCarly Full Scene',
  dur: 327, wpm: 138, band: 'slow', tags: ['友だち', '買い物'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // why: 15,000 ← fifteen/fifty, the -ty ending is weak; 5,000 ← "50" heard without the zero after a fast "me";
    //   500,000 ← "000" read as a longer number after the big talk
    { id: 'n1', skill: 'number', level: 'B1', point: 'coins', seg: [18.9, 25.0], keep: true,
      stem: 'How many bonus sand coins did his one case earn him?',
      choices: ['5,000', '15,000', '50,000', '500,000'], a: 2,
      cue: '「netted me」のすぐあとの数字。',
      line: 'I did, but that netted me *50,000* bonus sand coins',
      said: '1ケース売っただけで、5万枚のボーナスコインが入ったと言う。',
      mean: 'net ＝（結果として）手に入れる。fifty thousand ＝ 5万。',
      trap: 'fifty と fifteen は語尾が違う。-ty は前、-teen は後ろが強い。',
      use: 'That netted me fifty dollars.（それで50ドルの稼ぎになった）' },

    // why: scooter ← "sand scooter" is the prize he shows off first, so it sounds bought with the coins; daughter ←
    //   "a daughter to support" comes right after, the sensible use of money
    { id: 'd1', skill: 'detail', level: 'B1', point: 'buy', seg: [18.9, 27.6],
      stem: 'What did Freddie do with his bonus sand coins?',
      choices: ['He used them to buy more sand', 'He traded them for the sand scooter',
                'He saved them to support his daughter'], a: 0,
      cue: '「bonus sand coins」のあと、which で続く部分。',
      line: 'that netted me … bonus sand coins, *which I used to buy more sand*.',
      said: 'ボーナスのコインで、さらに商品の砂を買ったと話している。',
      mean: '稼いだ分をまた在庫に使っている。お金が手元に残っていないということ。',
      trap: 'scooter は最初に見せた景品、daughter はこのあとの話。which のあとが使い道。',
      use: 'I used it to buy a new phone.（それで新しい携帯を買ったの）' },

    // R fix: blind 70 %, "which is why I quit my job" in the stem made the plan reading obvious, and "I'd wanna be"
    //   was a filler (K4); stem trimmed, filler cut
    // why: wanna be ← gonna and wanna differ only in the first sound; gonna get ← "be" is weak and "get rich" is a set
    //   phrase
    { id: 's1', skill: 'sound', level: 'B2', point: 'rich', seg: [27.4, 31.7],
      stem: 'Fill the gap: “Oh, ___ rich…”',
      choices: ['I’m gonna be', 'I wanna be', 'I’m gonna get'], a: 0,
      cue: '「Oh」のあと、rich の前の短い3語。',
      line: 'Oh, *I’m gonna be* rich, which is why I quit my job.',
      said: '「金持ちになるんだ。だから仕事を辞めた」と言う。',
      mean: 'going to が gonna に縮む。be は弱く、ほぼ「ビ」だけ。',
      trap: 'wanna（〜したい）と gonna（〜するつもり）は最初の音だけ違う。g か w か。',
      use: 'I’m gonna be late, sorry.（ごめん、遅れそう）' },

    // R fix: blind 50 %, "the quitting news" in the stem made "risk" the obvious key, and the stem assumed Freddie
    //   speaks (the line is in the third person); the stem is now neutral, the choices parallel claims
    // why: online ← net = ネット (internet), a katakana false friend; no training ← the circus picture taken as skill,
    //   not safety
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'net', seg: [38.4, 45.7],
      stem: 'Right after “You can’t quit…”, what is claimed about Freddie?',
      choices: ['He takes big chances with nothing to catch him', 'He does all of his selling on the internet',
                'He learns new things fast without training'], a: 0,
      cue: '自分の名前を出して言う、ジャンプのたとえ。',
      line: '… Freddie *leaps without a net*, baby.',
      said: '「Freddie はネットなしで飛ぶ」と3人称で得意げに言う。',
      mean: 'without a net ＝ 安全ネットなし。失敗したら受け止めるものがない、大きな賭け。',
      trap: 'net をカタカナの「ネット」と取るとネット通信に聞こえる。ここは安全ネット。',
      use: 'I moved abroad without a safety net.（後ろ盾なしで海外に移った）' },

    // R fix: blind 50 %; only the key had a twist in it, so the distractors now carry one each
    // why: first class ← "fly" taken literally, with "Yeah" read as agreement (the Japanese 「そうそう」 frame);
    //   scooter ← "Today, he has wheels" is the line just before, so the jab seems aimed at the scooter
    { id: 'h1', skill: 'humor', level: 'C1', point: 'debt', seg: [47.9, 54.0],
      stem: 'Why is the reply to “Tomorrow he’ll fly” funny?',
      choices: ['It twists the hype into a jab about money', 'It agrees, and says he’ll soon fly first class',
                'It mocks the scooter as a toy for kids'], a: 0,
      cue: '「Yeah」のあと、fly に何が付け足されるか。',
      line: 'Today, he has wheels. Tomorrow, he’ll fly. — Yeah, *fly into debt*.',
      said: '「明日は空を飛ぶ」という自慢に、「うん、借金に向かって飛ぶね」と返す。',
      mean: '相手の言葉をそのまま借りて、逆の意味にひっくり返す。冷めた一言で笑いになる。',
      trap: '文頭の Yeah は同意に聞こえるが、続きが本音。相手の言葉の言い換えに注意。',
      use: 'Yeah, straight into trouble.（うん、まっすぐトラブルにね）' },

    // R fix: blind 50 %; the distractors are now the two other exits a seller might try, a rank climb and a fire sale
    // why: higher rank ← "buy inventory" is said, and Freddie did just that to climb; sell cheap ← "can't sell" heard
    //   as "can't sell at full price", so a discount looks like the way out
    { id: 'd3', skill: 'detail', level: 'B2', point: 'scheme', seg: [66.4, 74.6],
      stem: 'In the podcast fan’s explanation, what is a seller’s only way out?',
      choices: ['Getting more people to sell for the company', 'Buying more stock to reach a higher rank',
                'Selling the stock off cheap to anyone'], a: 0,
      cue: '「only way out」のあと、文の最後まで。',
      line: 'So your *only way out is to recruit more salespeople*.',
      said: '売れない在庫を抱えたら、ほかの売り手を誘うしか抜け道がない、と説明する。',
      mean: 'recruit ＝ 人を誘って仲間に入れる。これがマルチ商法（ねずみ講）の仕組み。',
      trap: 'buy inventory は罠の入口。way out のあとが出口。',
      use: 'The only way out is asking for help.（助けを求めるしか道はない）' },

    // R fix: blind 60 %, only the key had the sale going on; now all three keep the event, and differ in why
    // why: admitted ← "head in the sand" heard as owning up; last one ← "sales event" plus the familiar "one last
    //   time" script
    { id: 'g1', skill: 'gist', level: 'B2', point: 'brushoff', reveals: ['head'], seg: [79, 115],
      stem: 'How does the argument about the sand end?',
      choices: ['The warning is waved away, and the event goes on', 'The scam is admitted, but the event goes on anyway',
                'The event goes on, but only as a last one'], a: 0,
      cue: '最後の数行と、音楽の前の一言。',
      said: '仕組みを説明されても「砂は効く」と言い返し、セールのイベントの準備に向かう。',
      mean: '警告は届かず、話はイベントへ進む。最後の一言は「聞く気はない」。',
      trap: 'head in the sand は白状ではない。sand works と言い返して話を切る。',
      use: 'I hear you, but I’m doing it anyway.（言いたいことは分かるけど、やるよ）' },

    // R fix: blind 65 %; "Real sales companies give the same rewards" contradicted the scam talk around it; now a
    //   top-sellers-only reading
    // why: top sellers ← "VIP diamond" titles sound like rewards for the best only; only coins fake ← "worthless fake
    //   currency" heard as the one bad part
    { id: 'i2', skill: 'infer', level: 'C1', point: 'bait', seg: [79, 90],
      stem: 'When Freddie denies it, what is her list of rewards pointing out?',
      choices: ['What he bragged about is exactly the bait', 'Only the top sellers ever get real rewards',
                'The prizes are fine, but the coins are fake'], a: 0,
      cue: '並べる3つと、冒頭で Freddie が自慢したもの。',
      line: 'They keep sellers interested with *cheap prizes, fancy titles, and worthless fake currency*.',
      said: '「安い景品、立派な肩書き、価値のない偽の通貨で売り手を釣る」と言う。',
      mean: 'スクーター、VIP の肩書き、砂のコイン。冒頭の自慢がそのまま手口の例になっている。',
      trap: '一般論に聞こえるが、3つとも冒頭で聞いたもの。並べられたら直前の話と照らす。',
      use: 'That’s exactly how they get you.（まさにそうやって引っかけるんだよ）' },

    // R fix: blind 50 %; "jobs are scarce" was a filler, now an over-the-top-praise reading
    // why: over the top ← "so brave" in a sales list sounds like hype; really afraid ← his later panic read back into
    //   this line, though nothing here shows fear
    { id: 'h2', skill: 'humor', level: 'C1', point: 'inadvisably', seg: [90.2, 100.0],
      stem: 'In the list of what sand does, why is the last example funny?',
      choices: ['Its proof of bravery is called an unwise move', 'Its praise is so over the top it sounds fake',
                'It calls Freddie brave when he is really afraid'], a: 0,
      cue: '「brave」のあと、quit の直前の長い一語。',
      line: 'And Freddie’s so brave, he *inadvisably* quit his job.',
      said: '砂の効き目として「Freddie は勇敢で、軽はずみにも仕事を辞めた」と言う。',
      mean: 'inadvisably ＝ 賢明でなく。ほめる例の中に、けなす一語が混じっている。',
      trap: 'brave だけならほめ言葉。長い副詞は話し手の評価なので、最後まで聞く。',
      use: 'He bravely, and unwisely, said yes.（勇敢に、そして軽率に引き受けた）' },

    // R fix: blind 55 %; "keeping calm" was weak, now a literal hiding reading of "head in the sand"
    // why: busy ← "excuse me, I have a sales event to prepare for" comes just before; lie low ← the picture of a head
    //   buried in sand taken as hiding from people
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'head', reveals: ['brushoff'], seg: [100.2, 109.3],
      stem: 'What does the speaker mean by the last line before the music?',
      choices: ['I refuse to look at the problem', 'I’m too busy with work to talk now',
                'I’m going to hide from people for a while'], a: 0,
      cue: '「excuse me」のあと、sand が出てくる最後の文。',
      line: 'I’ve got my *head in the sand*, and it’s staying there.',
      said: '「頭を砂に突っ込んでいるし、このまま出すつもりはない」と言って去る。',
      mean: 'head in the sand ＝ 問題から目をそらす。商品の砂とかけている。',
      trap: '直前の「準備がある」で「忙しい」と取りやすい。sand を商品とだけ取ると成句を逃す。',
      use: 'Stop burying your head in the sand.（現実から目をそらさないで）' },

    // R fix: blind 55 %; the distractors are now a got-worse reading and a forgot-the-script reading
    // why: worse ← "I pretended not to" heard as about life with sand; forgot ← the halting "I listened, but…"
    //   pattern heard as him losing his lines
    { id: 'h3', skill: 'humor', level: 'C1', point: 'truth', seg: [151.7, 164.1],

      stem: 'What gets the laugh in Spencer’s testimony about sand?',
      choices: ['A deep, poetic build-up ends in a tiny excuse', 'He admits that sand made him worse, not better',
                'He talks like a poet but forgets his lines'], a: 0,
      cue: '3つ目の文の「so」のあと、何の話になるか。',
      line: 'I understood, but I pretended not to, *so I didn’t have to give the Greenpeace guy my email*.',
      said: '「聞いたが理解しなかった…」と深い話のように重ね、最後は募金の人にメールを教えたくなかっただけ。',
      mean: '壮大な前置きと、ちっぽけな中身の落差が笑い。',
      trap: 'pretended は砂を使う前の話。大げさな前置きのあとは、オチを待つ。',
      use: 'Long story short, I forgot.（要するに、忘れてたの）' },

    // why: 15% / 50% ← five/fifteen/fifty: the ending and stress are all that differ
    { id: 'n2', skill: 'number', level: 'B1', point: 'promo', seg: [167.4, 176.6], keep: true,
      stem: 'How much off does the promo code give?',
      choices: ['5%', '15%', '50%'], a: 0,
      cue: '「we’ll give you」のすぐあと。',
      line: 'using promo code FREDDIEB, we’ll give you *5% off*',
      said: 'プロモコードを使うと、砂1箱ごとに5パーセント引きになると宣伝する。',
      mean: 'five percent off ＝ 5％引き。大きく宣伝する割に小さな値引き。',
      trap: 'five、fifteen、fifty は語尾と強勢で分かれる。five は1音節で短い。',
      use: 'Is there a student discount?（学生割引はありますか）' },

    // R fix: blind 50 %; "hypnotist" was a filler, now a caller-says-it's-fake reading; the cue named Carly, a word only the key
    //   had (cue leak), so it now points at the moment after the introduction
    // why: Spencer admits ← "sensitivity sand is fake" is said at the end, but by someone else to him; caller ← the
    //   live-sales-show script, where a viewer calls in to complain
    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', reveals: ['fishfood'], seg: [184, 262],
      stem: 'What turns the live sales show around?',
      choices: ['Carly reads out what the sand really is', 'Spencer admits the sand never worked for him',
                'A viewer calls in to say the sand is fake'], a: 0,
      cue: '司会の紹介の直後の一言と、そのあとの流れ。',
      said: 'Carly が商品の正体（魚のエサ）を知り、宣伝の途中でそれを言ってしまう。',
      mean: '売る側の一人が真実に気づき、イベントが崩れていく。',
      trap: 'fake は最後に Spencer が言われる言葉で、電話も来ない。転機は Carly が読み上げる一言。',
      use: 'Wait, this is fake?（待って、これ偽物？）' },

    // R fix: blind 55 %; the sick-owl reading was too literal to tempt, now a "does it still work" reading
    // why: Griffin knew ← "You knew?" comes later; still works ← "Calm sand keeps me very calm" just before, then
    //   "it's fish food", as if asking whether the effect is real
    { id: 'i3', skill: 'infer', level: 'C1', point: 'owl', reveals: ['fishfood'], seg: [213.4, 228.0],
      stem: 'What is Carly really asking with her owl story?',
      choices: ['Whether she is a fraud for selling it unknowingly', 'Whether Griffin knew the truth all along',
                'Whether the sand works even if it’s fish food'], a: 0,
      cue: '話の最後、「even though」のあと。',
      line: 'Do you think that *the owl is a fraud, even though she didn’t know*?',
      said: 'ネズミと思って食べたら魚のエサだった。知らなかったフクロウも詐欺師か、と問う。',
      mean: 'フクロウは自分のこと。知らずに売っていた自分も悪いのか、と生放送で聞いている。',
      trap: '効き目の話に聞こえるが、問いは a fraud か。she が誰を指すか考える。',
      use: 'Is it still lying if you didn’t know?（知らなかったら嘘にならない？）' },

    // R fix: blind 60 %; the distractors are now the two other ways a host handles a meltdown on air
    // why: joke ← "trying to show us" heard as "she's just playing"; break ← the usual live-TV script after "I think
    //   I'm gonna throw up"
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'spin', seg: [228.9, 236.3],
      stem: 'When Carly says she feels sick, what does the next line do?',
      choices: ['Passes off her panic as a product demo', 'Covers for her by calling it a joke',
                'Apologizes and cuts to a commercial'], a: 0,
      cue: '「throw up」の直後、視聴者に向けた一文。',
      line: 'Carly’s trying to show us *what she was like before calm sand*.',
      said: '「Carly は、砂を使う前の自分を見せてくれているんです」と視聴者に言う。',
      mean: '取り乱した様子を「使用前」の実演にすり替え、宣伝を続けている。',
      trap: '冗談扱いに聞こえるが、続くのは before calm sand。使用前の実演にしている。',
      use: 'And that’s what it looked like before.（そしてこれが以前の姿です）' },

    // R fix: blind 75 %, "Why didn't you" didn't fit an offer; replaced by "Won't you", a real offer form
    // why: won't ← don't and won't both end in t and sound alike fast; Won't you ← the weak "why" lost, and it's a
    //   real offer; would ← a polite offer fits the same gap
    { id: 's2', skill: 'sound', level: 'B2', point: 'drink', seg: [236.1, 239.6],
      stem: 'Fill the gap: “Here, Carly. ___ take a nice big drink?”',
      choices: ['Why don’t you', 'Why won’t you', 'Won’t you', 'Would you'], a: 0,
      cue: '「Carly」のすぐあと、続けて聞こえる3語。',
      line: 'Here, Carly. *Why don’t you* take a nice big drink?',
      said: '「ほら Carly、ぐいっと飲んでみたら？」と勧めている。3語が一続き。',
      mean: 'Why don’t you は「ワイドンチュ」に近い。理由でなく勧める言い方。',
      trap: 'won’t だと「なぜ飲まないの？」と責める意味。don’t の母音は短め。',
      use: 'Why don’t you sit down?（座ったら？）' },

    // why: antioxidants ← said, but after "not brimming with"; beach sand ← the product's name taken at face value
    { id: 'd5', skill: 'detail', level: 'B1', point: 'fishfood', seg: [241.6, 252.3],
      stem: 'When Carly refuses the drink, what does she say is in it?',
      choices: ['Fish food', 'Antioxidants', 'Beach sand'], a: 0,
      cue: '「I can’t drink this」のあと、理由の部分。',
      line: 'It’s not brimming with antioxidants. It’s brimming with *fish food*.',
      said: '飲めない理由として「抗酸化物質なんかじゃなく、魚のエサだらけ」と言う。',
      mean: 'brimming with ～ ＝ 〜がたっぷり。宣伝文句をそのまま言い返している。',
      trap: 'antioxidants の前に not がある。not のあとは打ち消される側。',
      use: 'This soup is brimming with flavor.（このスープは味がたっぷり）' },

    // anchor: 254.7 s "No." then 255.2–257.1 s "it has not been legally proven to be food of any kind" (the denial only
    //   says no one has shown it's food, of any kind); 259.6–261.1 s "What?" "You knew?" (the room hears an admission)
    // R fix: blind 50 % (C2, its one rewrite); "cleared by law" was weak, now a "fish food, but harmless" reading; the key's "no" is now "nobody",
    //   since the cue quotes "No" (cue leak)
    // why: food, not for fish ← scope shift: "any kind" heard as "not fish food, some other food"; safe for people ←
    //   "No" heard as "no, it's fine", with "legally" read as a safety claim
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'legal', reveals: ['fishfood'], seg: [252.3, 261.7],
      stem: 'Taken word for word, what does the co-host’s denial actually admit?',
      choices: ['That nobody has shown it’s fit to eat at all', 'That it is real food, just not food for fish',
                'That it is fish food, but safe for people'], a: 0,
      cue: '「No」のあとの長い一文と、周りの反応。',
      line: '*No.* It has *not been legally proven to be food of any kind*. — What? You knew?',
      said: '「エサなの？」に「違う。どんな食べ物とも法的に証明されていない」と答え、「知ってたの？」と返される。',
      mean: '否定のつもりで、食べ物ですらないと認めている。飲ませた物なのに。言い逃れが自白になる。',
      trap: 'legally proven を「お墨付き」と聞きやすい。not が何を打ち消すかを追う。',
      use: 'Technically, it’s not illegal.（厳密に言えば、違法ではない）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'meetup', seg: [262.2, 266.6],
      stem: 'Type Carly’s words: “That’s why you ___, so you could sell me…” (4 words)',
      answer: 'wanted to meet up',
      cue: '「Wait」のあと、that’s why you に続く部分。',
      line: 'That’s why you *wanted to meet up*, so you could sell me this junk.',
      said: '「だから会いたがったのね。このガラクタを売るために」と気づく。',
      mean: 'wanted to は「ワニダ」に近く、meet up とつながる。meet up ＝ 会う。',
      trap: 'wanted の t と to の t が重なり消えやすい。過去形かは文脈で判断。',
      use: 'Do you want to meet up later?（あとで会わない？）' },

    // R fix: blind 65 %; "Honest, because…" was the only choice with a reason; now a relaxed reading, and the key
    //   shortened. The captions' "well" (whisper drops it) isn't a key word.
    // why: hurt ← a question like that "should" hurt someone who cares (the Japanese 傷ついた frame); relaxed ←
    //   "Yes" comes first, plainly, as if nothing were wrong
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'yesno', reveals: ['meetup'], seg: [266.8, 271.8],
      stem: 'When Carly asks if that was his reason, how does the co-host answer?',
      choices: ['Caught out, grabbing at any answer that works', 'Hurt that Carly could think so badly of him',
                'Relaxed, as he sees nothing wrong in it'], a: 0,
      cue: '返事の最初の3語が、どう変わっていくか。',
      line: '*Yes. No, well, maybe.* Um…',
      said: '「会ったのは売るためでしょ」に「うん。いや、まあ、たぶん」と答えがころころ変わる。',
      mean: '本音がばれて、とっさに言い直している。どれでもいいから通る答えを探している。',
      trap: '最初の Yes だけなら正直に見えるが、すぐ打ち消す。返事は最後まで聞いて判断。',
      use: 'Yes. No. I mean, it’s complicated.（うん。いや、その、複雑なんだ）' },

    // R fix: blind 55 %; "Sad that it is too late" was weak, now an "amused, thinks he's joking" reading
    // why: needs time ← the Japanese polite-refusal frame (考えさせて); amused ← "Ew" said lightly, and "for one second"
    //   as a laughing brush-off
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'ew', seg: [271.8, 279.0],
      stem: 'How does Carly take his offer to get back together?',
      choices: ['Disgusted; it was never a possibility', 'Touched, but she needs some time',
                'Amused; she thinks he must be joking'], a: 0,
      cue: '「I love you」の直後の短い一語と、そのあとの文。',
      line: 'Carly, I love you. — *Ew. I never even considered it* for one second.',
      said: '「愛してる」に「うわ。一秒も考えたことない」と即答する。',
      mean: 'Ew は嫌悪の声。never even ～ for one second で、可能性を完全に否定している。',
      trap: '日本語の断り方は「考えさせて」とぼかしがち。ここは迷いのない拒絶。',
      use: 'Ew, no. Not even for a second.（うわ、ないない。一瞬もない）' },

    // R fix: blind 55 %; "worried to relieved" is now the exact reverse of the key, so the order is what's tested
    // why: reverse ← he says "brave" and "handle", which can sound like calming down after a panic; angry to calm ←
    //   "I really am brave" heard as calming himself down after the shock
    { id: 'i4', skill: 'infer', level: 'B2', point: 'panic', seg: [288.2, 302.0],
      stem: 'How does Freddie’s mood change during this speech?',
      choices: ['From proud of himself to panicked', 'From panicked to proud of himself',
                'From angry at Griffin to calm again'], a: 0,
      cue: '始めの言葉と、最後の短い問い。',
      line: 'I *really am brave*… I just quit my job and spent all my money… *What have I done?*',
      said: '「本当に勇敢なんだ」と言っていたが、仕事も金も失ったと口にして「何てことを」となる。',
      mean: '自信が、自分の言葉で崩れていく。最後の問いが本音。',
      trap: 'brave や handle で落ち着いたように聞こえ、順番を逆に取りやすい。最後のひと言で判断する。',
      use: 'Oh no. What have I done?（ああ、何てことをしたんだ）' },

    // anchor: 291.4–295.0 s "I just quit my job and spent all my money and…", 295.5 s "oh, wow", then 301.2 s
    //   "What have I done?": the sweating comes right after he names the loss, and he ends on regret
    // R fix: blind 55 % (C2, its one rewrite); the key named "job and money", the obvious worry; it now says only
    //   that his own words are sinking in, and a stage-fright reading replaces the daughter
    // why: sick ← "fish food" was just said, and sweating sounds like a body reaction to it; on camera ← it's a live
    //   show, so sweating reads as stage fright
    { id: 'a3', skill: 'attitude', level: 'C2', point: 'panic', seg: [288.2, 302.0],
      stem: 'When Freddie blames his sweating on excitement, what is he trying not to say?',
      choices: ['That what he just said is sinking in', 'That the sand drink has made him feel sick',
                'That he is nervous about being live on air'], a: 0,
      cue: '汗の話の直前に、何を口にしたか。',
      line: 'I just *quit my job and spent all my money*… I’m sweating a lot. *Probably just from the excitement*',
      said: '仕事を辞めて金も使い果たしたと言った直後、汗は「興奮と勇気のせいだろう」と言う。',
      mean: '汗の本当の理由を、前向きな言葉で隠している。直前に並べた損失と「何てことを」が答え。',
      trap: '体調や生放送の緊張に聞こえるが、直前に失ったものを並べている。言い訳の直前に隠したい中身がある。',
      use: 'I’m fine! Just… a little warm.（大丈夫！ちょっと暑いだけ）' },

    // R fix: blind 50 %; "sad his gift came only from the sand" was the opposite of the obvious key; now a denial
    //   reading (like the earlier "head in the sand") and a too-busy-feeling reading
    // why: denial ← the earlier "head in the sand" makes a refusal to believe likely; too busy ← "I can see that
    //   you're hurting" heard as Spencer still caught up in feeling for others
    { id: 'h4', skill: 'humor', level: 'C1', point: 'package', seg: [316.2, 325.3],
      stem: 'What makes Spencer’s last reaction funny?',
      choices: ['He takes the bad news as proof of his own gift', 'He refuses to believe the sand is really fake',
                'He is too busy feeling for others to hear it'], a: 0,
      cue: '「fake」のあと、which means で始まる文。',
      line: 'Sensitivity sand is fake. — *Which means I’ve always been this sensitive.* … Am I the absolute total package?',
      said: '砂は偽物と言われ、「つまり元から感受性が強かったんだ。完璧じゃない？」と喜ぶ。',
      mean: 'だまされた話のはずが、自分をほめる話になる。周りの落ち込みとの差が笑い。',
      trap: 'fake と聞くと落ち込む流れを予想しやすい。which means で向きが変わる。',

      use: 'Which means I was right all along.（つまり最初から正しかったってこと）' },
  ]
};
