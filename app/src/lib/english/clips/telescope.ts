// REVIEW 2026-11-16: pass 6, fix 14, drop 1, new 0; ear checks 1
// Q: nt1 (C2) rests on Jim's earlier moves (73.9 s "How did those get out?", 111.6 s "I do not want to sell you"),
//   which are outside its 213–217 s segment. Inside it, only the re-correction "legumes" and the trailing "why would
//   I…" point to bait. Kept as a C2 "what's withheld" item. Drop it if that's too much scene memory.
// “Leave the Telescope - The Office US” (the official The Office channel, BEST OF SEASON 7): at the office garage sale
// Dwight sets out to trade a thumbtack up to the finest item there, while Jim tempts him with "Professor Copperfield's
// Miracle Legumes" by refusing to sell them, until Dwight gives up his telescope for the beans.
// Segments from the captions, words from whisper (2026-11-16); whisper hallucinates from ≈205 s, so 205–302 s is from
// the captions only. Untested: 0–5 s (who has the crooked sign), 26–30 s ("like/black your sign"), 60–66 s (the authors'
// names), 151–155 s (Ryan's "mom look"), 164–172 s (who praises Ryan, and how sincerely), 173–185 s (Stanley's album:
// the line turns on race), 201–209 s, 219–251 s (a montage, mostly visual; who says "That's impossible").
// EAR CHECK: 211.9 s s1 — "what were the" (both sources): confirm "were" is the weak "wer", not "are"
import type { Clip } from '../types.ts';

export const leaveTelescope: Clip = {
  id: 'telescope', video: 'YllmYoVdfR4', title: 'Leave the Telescope', dur: 302, wpm: 150, band: 'slow',
  tags: ['職場', '買い物'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %, "trade" in the key matched the title's premise): three "It says…" readings, one helpful
    // why: put it in himself ← the helpful-neighbor script, "not so fast" heard as "let me do it"; slowly ← "not so
    //   fast" read literally as "slow down"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'notsofast', seg: [6.4, 13.0],
      stem: 'When Dwight offers a thumbtack and hears “Sure”, what does his reply do?',
      choices: ['It says the tack won’t come free', 'It says he’ll put the tack in for her',
                'It says she should fix the sign slowly'], a: 0,
      cue: 'Sure のすぐあとの一言と、カメラへの話。',
      line: 'Need a thumbtack? — Sure. — *Not so fast*.',
      said: '「画びょういる？」と聞き、「うん」と言われると「そう簡単にはいかない」と返す。',
      mean: 'Not so fast ＝ ちょっと待った。ただではあげない、交換が条件という合図。',
      trap: 'fast を速さと取ると「慎重に」に聞こえる。相手の同意を止める決まり文句。',
      use: 'Not so fast. You owe me one.（ちょっと待った。貸しがあるでしょ）' },

    // R fix: V2 (blind 65 %, the title's premise) + B1: two trading plans and a haggling one; the segment now starts
    //   at the thumbtack offer (7.0 s), which refutes "farm goods"; reveals notsofast (pr1's key follows from the plan)
    // why: farm goods ← "farmers by hobby" in the same breath as "the art of the swap"; haggle ← "walk out… with the
    //   finest item" heard as getting it cheap
    { id: 'g1', skill: 'gist', level: 'B2', point: 'plan', reveals: ['bytrade', 'notsofast'], seg: [6.4, 33.9],
      stem: 'What is Dwight’s plan for the garage sale?',
      choices: ['Trade small things up to the best item', 'Trade his farm goods for the best item',
                'Haggle the best item down to a low price'], a: 0,
      cue: 'カメラへの話と、そのあと最初にする事。',
      line: 'Through *the art of the swap*, I will walk out of this garage sale with *the finest item here*.',
      said: '「交換の技で一番の品を持って帰る」と言い、まず画びょうを出す。',
      mean: '小さな物から交換を重ねて、だんだん良い物にしていく作戦。',
      trap: 'walk out with the finest item だけだと「買う」に聞こえる。お金でなく swap が手段。',
      use: 'Want to swap seats with me?（席、替わってくれる？）' },

    // why: farm for a living ← "farmers" comes first and is what a listener expects; garage sales ← "hobby" + the
    //   garage sale he's at
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'bytrade', seg: [9.4, 13.4],
      stem: 'In his comment to the camera, what does Dwight say his family does?',
      choices: ['They trade for a living and farm for fun', 'They farm for a living and trade for fun',
                'They run garage sales as a family hobby'], a: 0,
      cue: 'by のあとの語が2回。どちらが仕事か。',
      line: 'Schrutes are *farmers by hobby and traders by trade*.',
      said: '「シュルート家は趣味で農家、本業は商人だ」とカメラに言う。',
      mean: 'by trade ＝ 職業は。by hobby はそれをもじった言い方で、農業の方が趣味。',
      trap: '農家と聞くとそちらが本業に思える。by trade の前にある語が本当の仕事。',
      use: 'She’s a nurse by trade.（彼女の本職は看護師）' },

    // R fix: V2 (blind 60 %, "A box of tacks" was a filler; i1's stem names the candle, so i1 now reveals candle):
    //   a "candles" near miss replaces it
    // why: pack of candles ← "candle" caught but "the used" lost; crooked sign ← the sign is what they're talking about
    { id: 'd1', skill: 'detail', level: 'B1', point: 'candle', seg: [20.5, 26.0],
      stem: 'In his first swap, what does Dwight ask for?',
      choices: ['Her used candle', 'A pack of candles', 'Her crooked sign'], a: 0,
      cue: 'trade you for のあと。',
      line: 'I will trade you *for the used candle*. … Come on, *it’s trash*.',
      said: '「使いかけのろうそくと交換だ。どうせゴミだろ」と迫る。',
      mean: 'trade A for B は「A を出して B をもらう」。もらう側は for のあと。',
      trap: 'candle だけだと新品にも聞こえる。used まで聞き、for の後ろが欲しい物。',
      use: 'I’ll trade you my apple for your banana.（りんごとバナナ、交換しよう）' },

    // R fix: V2 (blind 55 %, the only negative choice): a second "nobody buys" reading with the wrong reason
    // why: prices ← sarcasm caught but the reason missed ("who want your… tchotchkes" is about the things); waiting
    //   behind him ← "line of people" taken literally as his queue
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'hugeline', seg: [37.0, 45.8],
      stem: 'When Dwight mentions “a huge line of people”, what does he mean?',
      choices: ['Nobody wants the things she’s selling', 'Nobody will pay prices that high',
                'People are waiting behind him to trade'], a: 0,
      cue: 'Oh, ’cause のあとと、相手の言い返し。',
      line: 'Oh, ’cause there’s *a huge line of people* who want your… tchotchkes.',
      said: '「どいて」と言われ、「へえ、君のガラクタを欲しがる人が大行列だもんね」と返す。',
      mean: 'Oh, ’cause… は相手の理由をからかう皮肉の型。実際は誰も来ていない。',
      trap: '大行列を本当と取りやすい。相手が「欲しがる人はいる」と言い返すのが証拠。',
      use: 'Oh, ’cause you’re always on time?（へえ、自分はいつも時間通りだって？）' },

    // R fix: K6 (the key was the only two-part choice) + B1 (the stem names the candle, d1's key): reveals candle
    // why: thrifty ← "half-used" heard as thrift; pity ← a candle lit alone, the wrong implication
    { id: 'i1', skill: 'infer', level: 'B2', point: 'pitch', reveals: ['candle'], seg: [48.3, 60.2],
      stem: 'In Dwight’s story about Ryan, what would the half-used candle do?',
      choices: ['Make Ryan jealous, so he’d commit fast', 'Show Ryan she’s thrifty, so he’d trust her',
                'Make Ryan pity her, so he’d stay longer'], a: 0,
      cue: 'Ryan の心の声、Who else から。',
      line: '*Who else is she seeing?* I better *lock her down fast*.',
      said: '使いかけを見たライアンが「他に誰と会ってる？」と焦る、という話。',
      mean: '誰かと使った跡に見えて、焦って本気になる、という売り込み。lock down ＝ 確保する。',
      trap: 'half-used から節約と取りやすい。心の声の Who else が嫉妬の合図。',
      use: 'Lock it in before the price goes up.（値上がり前に決めちゃおう）' },

    // why: professor ← "Professor Copperfield's" is the brand on the packet; shop ← "selling these" heard as a store
    { id: 'd2', skill: 'detail', level: 'B1', point: 'jamaica', seg: [77.8, 89.6],
      stem: 'Where does Jim say the beans came from?',
      choices: ['A man with a cart in Jamaica', 'A shop he found in Jamaica', 'A professor he met in Jamaica'], a: 0,
      cue: '道に迷ったあと、誰が何を持って来たか。',
      line: '…this guy comes *with a cart* and he’s selling these.',
      said: '「ジャマイカで迷った夜、荷車の男が来て売っていた」と話す。',
      mean: '怪しい売り手から買った、という話の入り口。Professor は商品名の一部。',
      trap: 'Professor が先に聞こえるので、教授から買ったと思いやすい。誰が来たかは guy のあと。',
      use: 'A guy with a cart sells coffee here.（ここは屋台の人がコーヒーを売ってる）' },

    // R fix: S4 (the start fell inside "this one night"): now 85.35 s, before "this"
    { id: 'x1', skill: 'dict', level: 'B1', point: 'nowhere', seg: [85.35, 87.75],
      stem: 'Type what Jim says: “And then ___, this guy comes…” (3 words)', answer: 'out of nowhere',
      cue: 'And then のあと、3語がひと続き。',
      line: 'And then *out of nowhere*, this guy comes',
      said: '「そしたら、どこからともなく男が来て」と話す。',
      mean: 'out of nowhere ＝ 突然どこからか。out of がつながり「アウタ」に近い。',
      trap: 'of は弱く「ア」になるので2語に聞こえやすい。決まった3語のかたまりで覚える。',
      use: 'A taxi showed up out of nowhere.（どこからともなくタクシーが来た）' },

    // R fix: S4 (the end cut Jim's "Probably"): now 96.5 s
    // why: proof ← "Miracle Legumes" suggests a demonstration; professor ← the brand name heard as the seller's title
    { id: 'd3', skill: 'detail', level: 'B1', point: 'told', seg: [89.9, 96.5],
      stem: 'Why did Jim believe the seller, at first?',
      choices: ['He knew things about Jim he couldn’t know', 'He showed Jim proof that the beans worked',
                'He said he was a professor of plants'], a: 0,
      cue: 'Dwight, he told me のあと。',
      line: 'he *told me things about myself* that there’s *no way he could have known*.',
      said: '「自分しか知らないはずの事を、あの男は言い当てた」と話す。',
      mean: '占い師のような手口で信じた、という話。ドワイトはすぐ詐欺の手口だと言う。',
      trap: 'Miracle から効き目を見せたと思いやすい。信じた理由は told me things のあと。',
      use: 'There’s no way she could have known.（彼女が知ってたはずがない）' },

    // R fix: V2 (blind 70 %, the reverse-psychology key against two weak readings): three "Refusing…" reasons
    // why: not his ← "I do not want to sell" heard as "I can't sell"; embarrassed ← the sincere reading, after his
    //   "I feel like an idiot" story
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'refuse', seg: [105.6, 116.4],
      stem: 'When Dwight asks if Jim wants to sell him the beans, what is Jim doing?',
      choices: ['Refusing so Dwight will want them more', 'Refusing because the beans aren’t his to sell',
                'Refusing because he’s embarrassed he bought them'], a: 0,
      cue: 'Correction のあと、何を否定しているか。',
      line: '*Correction*, I *do not want to sell you* Professor Copperfield’s Miracle Legumes.',
      said: '「魔法の豆を売りたいのか」に「訂正。売りたくない。それにただの豆じゃない」と返す。',
      mean: '売る気がないふりで、かえって欲しくさせる手。名前を言い直すのも気を引くため。',
      trap: '本気の断りや照れと取りやすい。大げさな正式名での言い直しは、気を引く合図。',
      use: 'I’m not selling it. It’s too special.（売らないよ。特別なものだから）' },

    // why: almost fooled ← "nice try" heard as "you nearly got me"; admires ← "nice" taken at face value
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'nicetry', seg: [111.2, 119.6],
      stem: 'Hearing Jim’s refusal, how does Dwight react?',
      choices: ['He sees through it and mocks it', 'He thinks it almost fooled him', 'He admires how clever it is'],
      a: 0,
      cue: 'try が2回。前につく語の変化。',
      line: '*Nice try*. No, correction. *Terrible try*.',
      said: '「いい線いってた。いや訂正、ひどい線だ」と返す。',
      mean: 'Nice try ＝ その手には乗らない。さらに「ひどい」と言い直し、見え見えだと笑っている。',
      trap: 'nice をほめ言葉と取りやすい。Nice try は企みを見抜いたときの決まり文句。',
      use: 'Nice try. I’m not falling for it.（その手には乗らないよ）' },

    // why: sell it ← "you should sell this… I'll sell it" is his real plan, not what he tells her; family ← "it's just
    //   for family" is her line
    { id: 'd4', skill: 'detail', level: 'B2', point: 'party', seg: [133.4, 146.7],
      stem: 'How does Ryan get his mom to make so much pesto?',
      choices: ['He says it’s for a party with his friends', 'He says he’ll sell it and share the money',
                'He says the whole family has asked for it'], a: 0,
      cue: 'Mom, I need you to のあと。',
      line: 'Mom, I need you to make a ton of pesto *for a pesto party for all my friends*.',
      said: '売る気なのを隠し、「友達とのパーティー用に大量に作って」と母に頼む。',
      mean: '売るのを断られてきたので、うその理由で作らせた。母は「本当に？」と疑う。',
      trap: 'sell が何度も出るので、売ると伝えたと思いやすい。母に言った理由は for のあと。',
      use: 'Can you make extra for my friends?（友達の分も多めに作れる？）' },

    // why: thousand ← "a ton of pesto" just before inflates it; fifty ← "like" before the number heard as a rough,
    //   smaller guess
    { id: 'n1', skill: 'number', level: 'B1', point: 'bottles', seg: [146.5, 150.6],
      stem: 'How much pesto does Ryan say his mom made?',
      choices: ['About fifty bottles', 'About a hundred bottles', 'About a thousand bottles'], a: 1, keep: true,
      cue: 'Anyway のあと、bottles の前。',
      line: 'she makes *like a hundred bottles* worth.',
      said: '「結局、母はだいたい100本分作った」と話す。',
      mean: '数の前の like は「だいたい」。正確でないという合図。',
      trap: '直前の a ton に引っぱられて大きな数を選びやすい。hundred の d まで聞く。',
      use: 'It took like an hour.（1時間くらいかかった）' },

    // R fix: V2 (blind 70 %: "say he meant" ruled out the coworker's literal reading, the only other kind): three
    //   loose, label-like readings of the word; the dictionary reading stays in the trap note
    // why: homemade ← "it's just for family" from his story; healthy ← "kosher" heard as a clean or natural-food label
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'kosher', seg: [157.4, 163.0],
      stem: 'After a coworker asks about a certificate, what does Ryan say he meant?',
      choices: ['That it’s fine and nothing to worry about', 'That it’s homemade, not from a factory',
                'That it’s healthy, with nothing artificial'], a: 0,
      cue: 'No, I meant like のあと、並ぶ言い方。',
      line: 'No, I meant like, “It’s cool, *it’s kosher*, it’s all good.”',
      said: '「認証あるの？」と聞かれ、「いや、問題ないって意味。オッケーってこと」と答える。',
      mean: 'kosher はくだけて「まともな、問題ない」の意味でも使う。',
      trap: '辞書の意味や「手作り」「健康」と取りやすい。cool、all good と同じ意味で聞く。',
      use: 'Is this deal kosher?（この話、まともなの？）' },

    // R fix: K1 + V2 (blind 55 %; "every trade is junk for junk" was false for the last one, "a very cute squid"):
    //   "nearly" in all three
    // why: lost money ← "traded" heard as buying; cheated ← he got the candle by pressure earlier, so the list sounds
    //   like a string of cons
    { id: 'h1', skill: 'humor', level: 'C1', point: 'junk', seg: [187.0, 201.8],
      stem: 'Why is Dwight’s report that things are “going very well” funny?',
      choices: ['He calls nearly everything he got trash', 'He lost money on nearly every trade',
                'He cheated nearly every coworker he met'], a: 0,
      cue: 'for のあとに並ぶ、物の呼び方。',
      line: 'I traded a thumbtack for Meredith’s *junk*, for Kelly’s *crap*, for Phyllis’s *garbage*…',
      said: '「順調だ。画びょうを誰かのガラクタに、クズに、ゴミに…」と並べる。',
      mean: '自分で全部ゴミと呼びながら「順調」と言う、そのずれが笑い。',
      trap: 'traded を「買った」と取ると損の話に聞こえる。物の呼び方がずっと junk、crap、garbage。',
      use: 'Things are going very well, thanks.（おかげさまで順調です）' },

    // why: are ← "were" shrinks to a short "wer" and sounds present; their ← "the" linked to "claims" heard as a fuller
    //   word
    { id: 's1', skill: 'sound', level: 'B2', point: 'werethe', seg: [210.1, 213.75],
      stem: 'Fill the gap: “Just out of curiosity, ___ claims for those beans?”',
      choices: ['what were the', 'what are the', 'what were their'], a: 0,
      cue: 'curiosity のあと、短く弱い3語。',
      line: 'just out of curiosity, *what were the* claims for those beans?',
      said: '「ちょっと気になるんだけど、あの豆の効き目は何て話だった？」と聞く。',
      mean: 'what were the が短くつながる。were は弱く、ほぼ「ワ」。',
      trap: 'were が弱いと are に聞こえやすい。ジャマイカで言われた過去の話なので were。',
      use: 'Just out of curiosity, what time is it?（ちょっと気になるんだけど、今何時？）' },

    // R fix: V2 + K6 (blind 70 %, the key was the only two-part, nuanced choice): three two-part stances; the
    //   literal "just curious" reading is the near miss
    // why: mildly curious ← "just out of curiosity" taken at face value; suspicious ← he called it a swindler's
    //   trick earlier
    { id: 'i2', skill: 'infer', level: 'C1', point: 'curiosity', reveals: ['werethe'], seg: [210.1, 217.0],
      stem: 'When Dwight raises the beans again, what does his way of asking show?',
      choices: ['He’s hooked, but trying to sound casual', 'He’s mildly curious, and nothing more',
                'He’s suspicious, and wants proof they’re fake'], a: 0,
      cue: 'All right のあとの前置きと、ジムの返事。',
      line: 'All right, *just out of curiosity*, what were the claims for those beans?',
      said: '「まあ、ちょっと気になっただけだけど」と前置きして、豆の効き目を聞く。',
      mean: '自分から話を戻すのは、本当は気になっている証拠。',
      trap: 'just out of curiosity を言葉どおり取りやすい。自分から話を戻して軽く見せるのは本気の裏返し。',
      use: 'I’m just curious, that’s all.（ちょっと気になっただけ）' },

    // R fix: V2 (blind 50 %; "sold to Pam" was weak and rests on a line where whisper and the captions differ): the
    //   surface reading ("drop it") is the new near miss
    // why: drop the subject ← "so why would I…" taken at face value; ashamed ← the sincere reading of "you're just
    //   gonna make fun of me" (the sincerity flip)
    // anchor: 73.9–75.4 s "How did those get out? I'm sorry" (a staged slip); 111.6 s "I do not want to sell you…":
    //   each time Jim pulls back, Dwight leans in, and at 252.3 s Dwight takes the beans
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'refuse', seg: [213.4, 217.4],
      stem: 'When Jim says Dwight will only make fun of him, what is he hiding?',
      choices: ['That he wants Dwight to keep asking', 'That he wants Dwight to drop the subject',
                'That he’s ashamed he was fooled himself'], a: 0,
      cue: '名前の言い直しと、言いかけでやめる所。',
      line: 'They’re *legumes*, Dwight. And you’re just gonna make fun of me, so *why would I…*',
      said: '「豆じゃなくマメ科だ。どうせ笑うんだろ、なら何で…」と言いかけてやめる。',
      mean: '照れたふりで話を切り、もっと聞かせる。引くほど相手が寄ってくるわな。',
      trap: '言葉どおりなら「もうやめて」か照れ。でも最初から隠すふり。引く態度が続いたら、わなを疑う。',
      use: 'Never mind. You’d just laugh.（やっぱりいい。どうせ笑うし）' },

    // R fix: V2 (blind 75 %: the title "Leave the Telescope" answered "how does it end"): §9.4, asked from another
    //   angle, how he sums the day up; "the journey was the prize" is the broken-script near miss
    // why: the trading itself ← "in a way, the most valuable thing here wasn't the telescope at all" sets up the
    //   "it was the journey" script; kept the telescope ← "traded my way to a telescope" is his high point
    { id: 'g2', skill: 'gist', level: 'B2', point: 'ending', seg: [233.0, 279.0],
      stem: 'In his last talk to the camera, how does Dwight sum up his day?',
      choices: ['The beans were the real prize of his day', 'The trading itself was the real prize',
                'The telescope he kept was the real prize'], a: 0,
      cue: '最後のカメラへの話、wasn’t のあと。',
      line: 'the most valuable thing here wasn’t the telescope at all. … It was *this packet of beans*.',
      said: '望遠鏡までたどり着いたが、「一番の価値は豆」と言い、望遠鏡と交換したと話す。',
      mean: '最後に、ジムの話に乗って一番の品を手放した結末。',
      trap: 'wasn’t the telescope のあとは「経験こそ宝」が来そうに聞こえる。It was のあとの物を聞く。',
      use: 'I traded my old phone for a bike.（古いスマホを自転車と交換した）' },

    // R fix: V2 + K6 (blind 65 %, the key was the only hedged choice) + S4 (17.6 s; now 12.5 s from “But in a way”)
    //   + B1 (the line and said gave away g2's key, now cut to the trade and the fallback): asked as "why", three
    //   parallel motives
    // why: never mattered ← "the most valuable thing… wasn't the telescope at all" taken at face value; rich ← "just
    //   go buy another" heard as a boast
    // anchor: 277.3–278.7 s "And I can… I can just go buy another telescope": a stall, then a fallback no one asked
    //   for, right after calling the beans the most valuable thing
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'another', seg: [266.8, 279.3],
      stem: 'Why does Dwight add that he can just go buy another telescope?',
      choices: ['To cover a doubt about his trade', 'To show the telescope never mattered',
                'To show he’s rich enough not to care'], a: 0,
      cue: 'I can が2回。言い直しの前後。',
      line: 'So I traded the telescope for it. *And I can… I can just go buy another telescope*.',
      said: '望遠鏡を豆と交換したと言い、言いよどんで「望遠鏡はまた買えるし」と付け足す。',
      mean: '得をしたなら言い訳は不要。誰も聞いていない「また買える」は、だまされたかもという不安。',
      trap: '言葉どおりだと強がりや余裕。言いよどんだあとの付け足しは本音の合図。',
      use: 'It’s fine. I can always get another.（大丈夫、また買えるし）' },
  ]
};
