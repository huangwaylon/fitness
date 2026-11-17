// “Practice Date | Parks and Recreation” (the official Parks and Recreation channel, Season 2): before a first date with
// Dave, Leslie spirals through “what ifs” that turn out to be real stories; Ann stages a practice date as Dave, then
// turns it into a deliberately bad date so Leslie learns she'll survive one.
// Segments from the captions, words from whisper (2026-11-16). Untested on purpose: 25–30 s (“Darfur”/“therefore”),
// 94–102 s (“I know what you're thinking”/“Oh, you're thinking”, “and”/“in the end it never works”), 112–118 s and
// 138–148 s (shown, not said), 150–156 s (the Danish word), 175–187 s (sexual), 220–246 s (the soup, “Whiz Palace”),
// 255–262 s (sexual), 279–285 s (profanity).
// EAR CHECK: 18.6 s s1 — “why I haven’t been married” in both sources; the key claims the t of “haven’t” drops before “been”
// EAR CHECK: 52.7 s nt1 — the stress in “They have happened” falls on “have” (contrast with “won’t”), not “happened” (ship
//   only once confirmed)
// EAR CHECK: 269.2 s x1 — “supposed to be fun” in both sources; the key claims “supposed to” runs together (≈“s’posta”)
// REVIEW 2026-11-16: pass 7, fix 16, drop 1, new 0; ear checks 3
// Open: a cold re-read still beats m1, a2, h2, d2, d3, i2 and g2 at 70–85 %. d2 (Ann plays Dave) follows from the title
//   "Practice Date"; d3 (exposure therapy) and g2 (you'll survive) are textbook. h2 is now off-limits with d1 (reveals).
import type { Clip } from '../types.ts';

export const practiceDate: Clip = {
  id: 'practicedate', video: 'oIkW5meKYHc', title: 'Practice Date', dur: 307, wpm: 169, band: 'fast',
  tags: ['恋愛', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %, then 70 % on a cold re-read) + §9.4: the title ("Practice Date") answered "what happens";
    //   the gist now asks what turns the scene, Leslie's admission, and the choices are three things she says or
    //   pictures
    // why: coach her ← Leslie's earpiece picture ("you sit at a table nearby"), but it comes after Ann's offer and she
    //   waves it off herself; another woman ← one of her "what ifs", the most date-specific
    { id: 'g1', skill: 'gist', level: 'B1', point: 'scene', seg: [9.9, 110.3],
      stem: 'What leads Ann to offer a plan in the first part of the scene?',
      choices: ['Leslie admits she’s just bad at first dates', 'Leslie asks Ann to sit nearby and coach her',
                'Leslie fears Dave may bring another woman'], a: 0,
      cue: '心配の最後のまとめと、アンの返事。',
      line: 'I’m just *not good on first dates*. — Oh, okay, okay. You have a problem, and *this is how we’re gonna fix it*.',
      said: '不安を次々に話したあと「初デートがとにかく苦手」と認める。アンは「直し方はこう」と応じる。',
      mean: '心配の山の結論が「初デートが苦手」。それを受けてアンが練習を提案する。',
      trap: '近くの席の案は、アンの返事のあとに出て自分で打ち消す。告白の直後を聞く。',
      use: 'I’m just not good at small talk.（雑談がどうも苦手で）' },

    // why: not now ← "Shoot!" as a mild curse (しまった); hold on ← a one-word reply heard as stalling
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'shoot', seg: [9.9, 13.38],
      stem: 'When Leslie asks if she can ask a question, what does Ann’s reply mean?',
      choices: ['Sure, go ahead and ask', 'Oh no, not right now', 'Hold on, let me think'], a: 0,
      cue: '質問していい？への、一語の返事。',
      line: 'can I ask you a question? — *Shoot.*',
      said: '「ついでに聞いていい？」に、アンが一語で返す。',
      mean: 'Shoot ＝「どうぞ、言って」。質問を受けるときのくだけた返事。',
      trap: 'Shoot! は「しまった」の意味でも使う。質問していい？への返事なら「どうぞ」。',
      use: 'Got a question? Shoot.（質問？どうぞ）' },

    // R fix: V2 (blind 70 %): "have been" didn't fit the sentence's meaning, so only the key made sense; all three are
    //   now negatives that fit the gap
    // why: have never ← a quick "haven't" heard as "have n…", filled out to "have never"; had never ← haven't and
    //   hadn't differ in one weak consonant
    { id: 's1', skill: 'sound', level: 'B2', point: 'havent', seg: [14.75, 19.3],
      stem: 'Fill the gap: “…wonder why I ___ married.”',
      choices: ['haven’t been', 'have never been', 'had never been'], a: 0,
      cue: 'wonder why I のあと、married の前の2語。',
      line: '…wonder why I *haven’t been* married.',
      said: '「なぜ結婚したことがないのか、と思われる」と心配する。',
      mean: 'haven’t been married ＝ 結婚歴がない。直前の No とつながる。',
      trap: 'haven’t の t は been の前で消え、別の形に聞こえる。never なら拍が増える。',
      use: 'I haven’t been to Hawaii yet.（ハワイにはまだ行ったことがない）' },

    // R fix: V2 (blind 60 %): "kept from Ann" made a distractor odd; all three now give a plan and its aim
    // why: a real marriage ← "say that I was married" heard as a confession, to seem grown-up; married now ← "was"
    //   missed, so it sounds like a present marriage
    { id: 'h1', skill: 'humor', level: 'C1', point: 'married', reveals: ['havent'], seg: [14.75, 21.05],
      stem: 'What makes Leslie’s plan for the marriage question funny?',
      choices: ['She’d invent a marriage to dodge an easy question', 'She’d admit a real past marriage to seem grown-up',
                'She’d say she’s married now to make Dave keener'], a: 0,
      cue: 'Have you? への答えと、最後の決心。',
      line: 'Have you? — No. … I’m gonna *say that I was married*.',
      said: '結婚歴はないのに、なぜ独身か思われないよう「結婚していたと言う」と決める。',
      mean: '簡単な質問を避けるために、もっと大きな嘘を作る。その逆転が笑い。',
      trap: 'I was married を本当の告白と取りやすい。直前の No が、結婚歴はないと示している。',
      use: 'That would only make it worse.（それじゃ余計にひどくなる）' },

    // R fix: V2 (blind 60 %): "agrees guys like that" was a filler; it's now surprise at news (Whoa as 驚き)
    // why: impressed ← "Whoa" also greets something amazing (すごい); shocked she has kids ← "I have kids" heard as news,
    //   without "should I say"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'whoa', seg: [21.05, 25.55],
      stem: 'After Leslie asks about saying she has kids, what does Ann’s reaction signal?',
      choices: ['That Leslie is going way too far', 'That she is impressed by the idea',
                'That she’s shocked Leslie has kids'], a: 0,
      cue: 'right? のすぐあと、アンの一語。',
      line: 'Guys like girls that have kids, right? — *Whoa.*',
      said: '「子どもがいると言うべき？男は子持ちが好きでしょ？」に、アンが一語で止める。',
      mean: 'Whoa ＝「ちょっと待って、行きすぎ」。相手の勢いを止める一語。',
      trap: 'Whoa は「すごい」や驚きにも使う。極端な案のすぐあとなら「ストップ」。',
      use: 'Whoa, slow down. Start again.（ちょっと待って、最初から）' },

    // R fix: V2 (blind 75 %): three "state, with … questions/worries" choices now; "a few" makes the calm one tempting
    // why: calmer ← she says "Okay" and promises only "a few more questions"; annoyed ← "a few more questions for you,
    //   Ann" heard as pointed
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'relax', seg: [29.85, 42.35],
      stem: 'After Ann tells her to relax, how is Leslie doing?',
      choices: ['Still anxious, with wilder and wilder worries', 'Calmer now, with just a few small worries left',
                'Annoyed, with pointed questions for Ann'], a: 0,
      cue: 'Okay のあと、What if で始まる質問の中身。',
      line: 'I just have *a few more questions* for you, Ann. *What if* one of my sleeves *catches on fire*…',
      said: '「落ち着いて」に「分かった」と答えるが、「袖に火がついたら？」と心配が続く。',
      mean: 'Okay と言いながら不安は止まらず、どんどん大げさになっている。',
      trap: 'Okay と丁寧な前置きで落ち着いたように聞こえる。前置きのあとの中身で判断する。',
      use: 'Okay, okay. But what if it rains?（分かった。でも雨だったら？）' },

    // why: keeps her awake ← "to stay awake" is the last thing heard; sick ← swallowing the wrong pill suggests poisoning
    { id: 'i1', skill: 'infer', level: 'B2', point: 'pill', seg: [41.1, 47.65],
      stem: 'What kind of pill does Leslie fear she might take instead of mints?',
      choices: ['One that makes her sleepy', 'One that makes her sick', 'One that keeps her awake'], a: 0,
      cue: 'and I have to のあと、足を叩く理由。',
      line: 'I accidentally pop a couple of Ambien and I have to keep *punching my leg to stay awake*?',
      said: '「ミントの代わりに薬を飲み、起きているため足を叩き続けたら？」と心配する。',
      mean: '起きているために足を叩くなら、眠くなる薬。薬の名前を知らなくても分かる。',
      trap: 'stay awake が最後に聞こえるので「目が覚める薬」に引かれやすい。to のあとは目的。',
      use: 'I had to pinch myself to stay awake.（起きているのに自分をつねった）' },

    // R fix: V2 (blind 75 %): "made up every one" was the odd one out; it's now the general reading of "have happened"
    // why: will happen ← "have happened" heard with a future reading after "won't happen"; do happen ← "They have
    //   happened" heard as a general claim, without "to me"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'happened', seg: [43.3, 56.4],
      stem: 'Why does Leslie’s answer to Ann’s promise get a laugh?',
      choices: ['Her wild “what ifs” turn out to be real memories', 'She’s now sure they’ll all happen on this date',
                'She insists such things do happen to people'], a: 0,
      cue: 'won’t happen への返事、動詞の形。',
      line: 'I promise you they *won’t happen*. — They *have happened*. All of these have happened to me.',
      said: '「ありえない、起きない」と言われ、「もう起きた。全部あった」と返す。',
      mean: '大げさな想像に聞こえた心配が、全部ただの体験談だった。',
      trap: 'have happened を一般論や未来と取りやすい。to me まで聞くと、本人の体験。',
      use: 'Believe me, it’s happened before.（信じて、前にもあったんだ）' },

    // R fix: V2 (blind 75 %) + S1: the stem quoted "they won't happen", which hands over the contrast; it now names
    //   only her reply, and the key no longer says "contradicts"
    // why: on "happened" ← the default stress falls on the last content word, which carries the news; on "they" ← she is
    //   answering about the list just given, so "they" seems to need weight
    // anchor: 47.0–50.8 s Ann: "I promise you they won't happen"; 51.7–52.9 s "They have happened": the reply changes only
    //   won't → have, so the contrast sits on the auxiliary; 54.1–55.9 s "All of these have happened to me"
    { id: 'nt1', skill: 'sound', level: 'C2', point: 'happened', seg: [43.3, 56.4],
      stem: 'In Leslie’s reply “They have happened,” which word is stressed, and why?',
      choices: ['On “have”: it swaps in for Ann’s word', 'On “happened”: it says the events were real',
                'On “they”: it points to which worries she means'], a: 0,
      cue: '短い返事で、いちばん強く長く聞こえる語。',
      line: 'they *won’t* happen. — They *have* happened.',
      said: '「起きないって約束する」に「起きたの」と返す。have が強く長い。',
      mean: '相手の won’t を have に置きかえて言い返している。対比する部分に強勢が来る。',
      trap: 'ふつうは最後の内容語が強い。相手の言葉の一部だけ変えて言い返すときは、変えた語が強くなる。',
      use: 'I did call you! Twice!（電話したってば！2回も）', retired: true },

    // R fix: V2 (blind 50 %): "calm her nerves" was the odd one out; all three are now mix-ups
    // R fix (2): its stem says the vinegar really happened, which gives away h2/nt1 ("They have happened"): reveals
    // why: water ← "accidentally" suggests a look-alike bottle; apple juice ← vinegar and juice share a color, and the
    //   "-ble wine" tail is lost
    { id: 'd1', skill: 'detail', level: 'B1', point: 'vinegar', reveals: ['happened'], seg: [57.9, 63.58],
      stem: 'Why did Leslie once drink a whole bottle of vinegar?',
      choices: ['She thought it was terrible wine', 'She thought it was old apple juice',
                'She mixed it up with water'], a: 0,
      cue: 'vinegar のあと、次の文。',
      line: 'I accidentally drank an entire bottle of vinegar. *I thought it was terrible wine*.',
      said: '「ひどいワインだと思って、酢を一本飲んだことがある」と話す。',
      mean: 'terrible wine ＝ まずいワイン。まずくても飲みきったのが笑いどころ。',
      trap: 'accidentally から、水と取り違えたと思いやすい。I thought のあとが答え。',
      use: 'I thought it was sugar. It was salt.（砂糖だと思ったら塩だった）' },

    // R fix: V2 (blind 60 %): "more than one time" was a filler; it's now a half-asleep reading of "woke up"
    // why: stretching ← "literally" is so often an intensifier for things that didn't happen ("I literally died"); half
    //   asleep ← "woke up" heard as her still dreaming
    { id: 'm2', skill: 'marker', level: 'B2', point: 'literally', seg: [71.9, 81.7],
      stem: 'What does Leslie’s adverb add when she describes waking up?',
      choices: ['That it truly happened, just as she says', 'That she’s stretching the story for effect',
                'That it felt real, though she was half asleep'], a: 0,
      cue: 'woke up の直前の副詞。',
      line: 'I *literally* woke up with his hand in my mouth.',
      said: '「目が覚めたら、本当に彼の手が口の中にあった」と話す。',
      mean: 'literally ＝ 文字どおり。ここは誇張でなく、本当にそうだったと強めている。',
      trap: 'literally は誇張にもよく使う。直前の話が具体的なら、文字どおりの意味。',
      use: 'It literally took five minutes.（本当に5分しかかからなかった）' },

    // R drop: nt2 (humor C2, "but then he got weird": who is the joke on?): after one rewrite a cold re-read still
    //   picked the key at 70 % ("who is the joke on" leans to the speaker whatever the choices say), so by the C2 rule,
    //   one rewrite then drop. Never shipped, so deleted.

    // R fix: V2 (blind 75 %): the waiter filler is now Leslie's own earpiece idea ("a table nearby")
    // why: nearby table ← Leslie's "you sit at a table nearby" a few seconds before; Leslie ← "practice on me" heard as
    //   Ann acting Leslie out
    { id: 'd2', skill: 'detail', level: 'B1', point: 'pretend', seg: [101.85, 108.65],
      stem: 'During the practice date, who will Ann pretend to be?',
      choices: ['Dave, the man Leslie is meeting', 'Someone at a nearby table, giving tips',
                'Leslie, so Leslie can watch herself'], a: 0,
      cue: 'pretend to be のあと。',
      line: '*I will pretend to be Dave*, and you will practice on me.',
      said: '「レストランで練習デートをする。私がデイブ役をやるから練習して」と提案する。',
      mean: 'pretend to be 〜 ＝ 〜のふりをする、〜の役をする。',
      trap: '近くの席はレスリーのイヤホン案で、アンは断る。pretend to be のあとが役。',
      use: 'I’ll pretend to be the customer.（私がお客さん役をやるね）' },

    // R fix: V2 (blind 60 %): "the same idea" was the odd one out; all three now say "better", by how much
    // why: slightly ← "way" sounds short and light to a learner, so the boost is missed; in some ways ← way = 方法・点,
    //   read literally
    { id: 'f2', skill: 'phrase', level: 'B1', point: 'way', seg: [105.55, 110.3],
      stem: 'What does Leslie think of Ann’s idea compared with her own?',
      choices: ['It’s much better than hers', 'It’s slightly better than hers', 'It’s better in some ways'], a: 0,
      cue: 'that’s a のあと、better の前の語。',
      line: 'Oh, that’s a *way better* idea.',
      said: '練習デートの案を聞いて「そっちの方がずっといい」と言う。',
      mean: 'way ＋ 比較級 ＝「ずっと〜」。会話でよく使う、くだけた強調。',
      trap: 'way を「方法・道」と取ると意味がずれる。比較級の前の way は「ずっと」。',
      use: 'This one’s way cheaper.（こっちの方がずっと安い）' },

    // R fix: V2 (blind 65 %): three "… than Ann thought" choices of one length now
    // why: less fit ← shape = 体型・体調, read literally; her cards ← the cards were just shown, and "shape" heard as
    //   their condition
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'shape', seg: [135.1, 138.4],
      stem: 'In her comment to the camera, what does Ann say about Leslie?',
      choices: ['She’s less ready than Ann thought', 'She’s less fit than Ann thought',
                'Her cards are worse than Ann thought'], a: 0,
      cue: 'カメラへの一言、than I thought の前。',
      line: 'Leslie’s *in worse shape* than I thought.',
      said: '話題カードがほぼ空なのを見て、アンはカメラに「思ったより重症」と言う。',
      mean: 'in bad shape ＝ 状態が悪い。体だけでなく、状況や気持ちにも使う。',
      trap: 'shape を体型と取ると「運動不足」に聞こえる。直前の様子から、何の状態かを判断する。',
      use: 'My old car is in bad shape.（古い車はかなりガタがきてる）' },

    // R fix: V2 (blind 55 %): "about to walk out" was the odd extreme; it's now "amused", a second warm reading
    // why: impressed ← "Wow" and "thorough" sound like praise; amused ← "Wow" with a laugh in it heard as enjoying the
    //   show
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'thorough', seg: [155.8, 167.8],
      stem: 'What is Ann’s attitude when she comments on Leslie’s teeter-totter facts?',
      choices: ['Politely bored, steering her elsewhere', 'Amused, and happy to hear more',
                'Impressed by how much she knows'], a: 0,
      cue: 'Wow のあとの感想と、次の提案。',
      line: '*Wow. That’s a thorough history* of the teeter-totter. … *Just ask me a question.*',
      said: 'シーソーの語源まで語るレスリーに「詳しい歴史ね」と言い、「質問して」と促す。',
      mean: 'ほめ言葉の形で「長すぎる」と伝えている。すぐ話題を変えさせるのが証拠。',
      trap: 'Wow や thorough はほめ言葉に聞こえやすい。すぐ話題を変えたら、遠回しな注意。',
      use: 'Wow, that’s very detailed. So, anyway…（へえ、詳しいね。で、それはそうと…）' },

    // R fix: V2 (blind 70 %): the fillers (Dave is a snake, her own fear) are now two other readings of a phobia
    //   example
    // why: how it starts ← "a psych course on… phobias" heard as about their cause; keeping away ← "afraid of snakes"
    //   heard as advice to avoid them
    { id: 'd3', skill: 'detail', level: 'B2', point: 'tank', seg: [188.15, 201.65],
      stem: 'In her comment to the camera, why does Ann bring up snakes?',
      choices: ['To explain treating a fear by facing it', 'To explain how a fear like that starts',
                'To explain keeping away from a fear'], a: 0,
      cue: 'So, like のあと、例え話と最後の一文。',
      line: 'if you were *afraid of snakes*, they would *immerse you in a tank of snakes*.',
      said: '看護学校で習った方法を説明し、「ヘビが怖いならヘビの水槽に入れる」と例を出す。',
      mean: '怖いものにあえて浸らせて慣れさせる方法の例。これをデートに使う。',
      trap: 'phobias と聞くと原因の話と取りやすい。treat と immerse は「慣らす治し方」。',
      use: 'Face your fear head-on.（恐怖に正面から向き合おう）' },

    // why: real anger ← "You're … late. I almost left" is how a truly upset date talks; the real Dave ← "I will pretend
    //   to be Dave" (106 s) suggests she is copying him
    // anchor: 197.2–201.3 s to camera "So I am going to immerse Leslie in a tank of bad date", then at once (201.7 s) she
    //   opens with a complaint and "I almost left"
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'tank', seg: [188.15, 204.25],
      stem: 'After Ann’s comment to the camera, how should we hear “Dave’s” first line?',
      choices: ['As a test she set up on purpose', 'As real anger at Leslie for being late',
                'As her copy of how the real Dave acts'], a: 0,
      cue: 'カメラへの一言の最後と、その直後のせりふ。',
      line: 'So I am going to *immerse Leslie in a tank of bad date*. — You’re … late. *I almost left.*',
      said: 'カメラに「レスリーを最悪のデートに浸らせる」と話し、すぐ「遅刻だ。帰るところだった」と言う。',
      mean: 'カメラへの一言が、直後の不機嫌を説明している。怒りは本物でなく、わざと作った「悪いデート」。',
      trap: 'せりふの口調だけで本気と取りやすい。この形式では、カメラへの一言が答え合わせになる。',
      use: 'Let’s role-play the worst case.（最悪のケースを演じてみよう）', retired: true },

    // why: 12 ← twelve and twenty share "tw"; 30 ← thirty and twenty share -ty
    { id: 'n2', skill: 'number', level: 'B1', point: 'late', seg: [201.65, 205.4],
      stem: 'How late does “Dave” say Leslie is?',
      choices: ['12 minutes', '20 minutes', '30 minutes'], a: 1, keep: true,
      cue: 'You’re のすぐあと、late の前。',
      line: 'You’re *20 minutes* late. I almost left.',
      said: '「20分遅刻だ。帰るところだった」と、いきなり責める。',
      mean: 'twenty の nt の t が弱く、「トゥェニ」に近く聞こえる。',
      trap: 'twelve と twenty は最初が同じ。最後が -ty か -lve かを聞く。',
      use: 'Sorry, I’m twenty minutes late.（ごめん、20分遅れた）' },

    // why: forgot the name ← "I don't know" heard as about the name only; not about family ← her stalling heard as a
    //   private topic
    { id: 'i2', skill: 'infer', level: 'B2', point: 'niece', seg: [204.25, 218.75],
      stem: 'What does Leslie’s answer about her niece show?',
      choices: ['She made the niece up as an excuse', 'She has a niece but forgot her name',
                'She would rather not talk about family'], a: 0,
      cue: 'I don’t know のあと、続けて認めること。',
      line: 'What? I don’t know. That’s not a name. *I don’t have a niece.*',
      said: '遅刻を「めいを送っていた」と言い訳するが、名前を聞かれて「めいはいない」と認める。',
      mean: 'めいの話は、遅刻の言い訳にとっさに作った話。',
      trap: 'I don’t know だけ聞くと「名前を忘れた」に聞こえる。そのあとの I don’t have が決め手。',
      use: 'Okay, I made that up.（はい、それは作り話です）' },

    // why: cries ← drip = 水滴, tears dripping; talks too much ← she was just telling a long story about her dog
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'drip', seg: [251.1, 254.3],
      stem: 'What does “Dave” mean by the word he uses for Leslie on the call?',
      choices: ['A dull, boring person', 'A person who cries a lot', 'A person who talks too much'], a: 0,
      cue: 'on a date with this のあと、最後の一語。',
      line: 'I’m on a date with *this drip*.',
      said: '電話のふりをして「今、このつまらない女とデート中」と言う。',
      mean: 'drip ＝ 退屈でさえない人。少し古い、軽い悪口。',
      trap: 'drip を「しずく」から涙と結びつけやすい。人に使う drip は「つまらない人」。',
      use: 'Don’t be such a drip.（そんなにノリ悪くしないで）' },

    // R fix: V2 (blind 75 %): "Ann is better" was a filler; it's now the opposite of the key (keeping a date from going
    //   wrong)
    // why: not the man for her ← "Dave" was so awful it sounds like a warning about the real Dave; keep it from going
    //   wrong ← "goes wrong" heard, but not "even if"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'survive', reveals: ['welldone'], seg: [263.1, 279.0],
      stem: 'By the end, what has the bad practice date done for Leslie?',
      choices: ['Shown her she can get through a date gone wrong', 'Shown her that Dave is not the man for her',
                'Shown her how to keep a date from going wrong'], a: 0,
      cue: 'now you see のあと、最後まで。',
      line: 'now you see that *even if everything goes wrong, you’ll survive*.',
      said: 'ひどいデート役を終えたアンが「全部うまくいかなくても乗り切れるでしょ」と言う。',
      mean: '失敗に慣れさせる練習の目的を、最後に言葉にしている。',
      trap: 'goes wrong だけだと失敗を防ぐ練習に聞こえる。even if 以下がまとめ。',
      use: 'Even if it goes wrong, you’ll be fine.（うまくいかなくても大丈夫）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'fun', seg: [266.95, 270.48],
      stem: 'Type what she says: “It’s ___. It’s just a date.” (4 words)', answer: 'supposed to be fun',
      cue: 'two people の文のあと、It’s に続く4語。',
      line: 'It’s *supposed to be fun*. It’s just a date.',
      said: '「楽しいはずでしょ。ただのデートなんだから」と言う。',
      mean: 'be supposed to ＝ 本来〜のはず。d と t がつながり、ほぼ「スタ」になる。',
      trap: 'supposed の d が消えて suppose に聞こえやすい。to be も弱い。',
      use: 'This was supposed to be easy.（簡単なはずだったのに）' },

    // R fix: V2 (blind 50 %): "mocking" was the odd one out; two choices now drop the act, told apart by why
    // why: giving in ← "You're right" heard as Dave backing down; had enough ← "Sorry I had to…" heard as quitting a
    //   role she is tired of
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'welldone', seg: [266.95, 279.0],
      stem: 'When Ann answers Leslie’s complaint with praise, what is she doing?',
      choices: ['Dropping the act to tell her she passed', 'Dropping the act because she’s had enough',
                'Still playing Dave, but giving in to her'], a: 0,
      cue: 'You’re right のあと、謝る一文。',
      line: 'You’re right. It is. *Well done*. *Sorry I had to get all medical on you*',
      said: 'レスリーが怒ると、アンは「その通り。よくできました。看護師っぽくしてごめん」と言う。',
      mean: 'デイブ役をやめ、アン本人として練習の成功をほめている。',
      trap: '謝罪を「もう疲れた」と取りやすい。Well done は成功をほめる合図。',
      use: 'Okay, scene over. Well done.（はい、ここまで。よくできました）' },
  ]
};
