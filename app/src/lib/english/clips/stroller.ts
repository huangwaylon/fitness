// “Is Kevin the Dad of Jan's Baby? | Season 5 Deleted Scene | Superfan - The Office US” (the official The Office
// channel, Best of Season 5): at Jan's office baby shower the group's stroller turns out to be far worse than the
// $1,200 one she already has; a talking head scoffs at brand names, then tests her stroller on a curb and brags that
// he survived being left beside the road as a baby.
// Segments from the captions, words from whisper (2026-11-16). Jan is named at 44.3 s ("Hey, Jan"); the talking-head
// man is never named, so stems say "he". Untested on purpose: the sperm-bank exchange and the two talking heads after
// it (43–84 s: innuendo, "I might have done it with Jan", and Michael's lines need his history with Jan), "She's gonna
// orbit" (18.5 s, odd in both), the opening "presents" lines (speakers unclear), the curb crash and "Inconclusive"
// (110–118 s: visual, music). Whisper repeats the Spartan lines at 129.6 s and loops one invented line from 137 s;
// the captions show only music there. No who item.
// REVIEW 2026-11-16: pass 10, fix 10, drop 0, new 0; ear checks 1
//   open: c1 and c2 (C2) read about 55 % blind; I kept them, because each distractor is a one-step near miss
//   that the anchor refutes, and a wider spread would weaken the anchor
// EAR CHECK: 35.5 s s1 — both sources write “My grandmother makes my own medicine”; the key needs “my own”, not the
//   “her own” grammar expects
import type { Clip } from '../types.ts';

export const jansStroller: Clip = {
  id: 'stroller', video: 'j8RNwdcDn0g', title: 'Is Kevin the Dad of Jan\'s Baby? | Season 5 Deleted Scene | Superfan',
  dur: 150, wpm: 154, band: 'mid', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: S1/N7, "group gift" in the stem gave away p1's key (chipped in); V2, "take it back" was the only
    //   choice nobody says; now "the same stroller", from “she already has a stroller”
    // why: hit despite price ← "Oh! Well, thank you" heard as delight, and "$1,200" heard as the gift's price; the
    //   same one ← "she already has a stroller" heard without the "way worse than" that follows
    { id: 'g1', skill: 'gist', level: 'B1', point: 'gift', reveals: ['worse'], seg: [0, 27.6],
      stem: 'How does the office’s gift for Jan go over?',
      choices: ['It’s outdone by the stroller she already has', 'It’s a hit, though its price shocks everyone',
                'It’s the same stroller as the one she has'], a: 0,
      cue: '贈り物を開けたあと、誰かの短い二言。',
      said: 'みんなでベビーカーを贈るが、誰かが「もう持ってるし、元のよりずっと下」と言う。',
      mean: '気持ちのこもった贈り物が、本人の持ち物に負けてしまう気まずい場面。',
      trap: 'Oh! と thank you を喜びと取りやすいが、すぐあとに比べる一言が続く。直後を聞く。',
      use: 'Oh, you shouldn’t have!（まあ、気をつかわなくてよかったのに）' },

    // R fix: V2, the shower script made the key the default against a wish list; now a "thank-you speech", which
    //   only "notes" refutes
    // why: baby book ← a shower list is often kept as a keepsake; speech ← "thank-you" caught, "notes" lost; the
    //   line's "for" and "notes" settle it
    { id: 'd1', skill: 'detail', level: 'B1', point: 'notes', seg: [3.4, 8.4],
      stem: 'Why does someone want to write things down during the gifts?',
      choices: ['For writing thank-you cards later', 'For the baby’s first memory book', 'For a thank-you speech at the end'], a: 0,
      cue: '「so I can write down」のあと。',
      line: 'so I can write down for *thank-you notes*.',
      said: 'もらった物を書き留めておく、あとでお礼のカードを書くため、と言う。',
      mean: 'thank-you note ＝ お礼のカード。誰から何をもらったかの記録。',
      trap: '記録と聞くと記念の本や欲しい物リストを思い浮かべやすい。for のあとが目的。',
      use: 'I’ll send you a thank-you note.（お礼のカードを送るね）' },

    // why: one payer ← "got you this" heard as one giver; company ← an office gift is often paid by the firm
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'chip', seg: [8.0, 12.9],
      stem: 'How did the office pay for the stroller?',
      choices: ['Everyone put in part of the money', 'One person paid, and everyone signed',
                'The company paid for it from its budget'], a: 0,
      cue: '「we all」のすぐあと、短い動詞句。',
      line: 'we all *chipped in* and got you this stroller.',
      said: '「みんなでお金を出し合って、このベビーカーを買ったの」と渡す。',
      mean: 'chip in ＝ 少しずつお金を出し合う。職場の贈り物や割り勘の定番。',
      trap: 'chip は「かけら・欠ける」の印象が強い。in が付くと「出し合う」。all と組むと全員。',
      use: 'Want to chip in for pizza?（ピザ代、出し合わない？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'worse', reveals: ['gift'], seg: [15.1, 18.4],
      stem: 'Type what is said: “And this is ___ the stroller she came with.” (3 words)', answer: 'way worse than',
      cue: '「And this is」のあと、比べる言い方。',
      line: 'She already has a stroller. And this is *way worse than* the stroller she came with.',
      said: '「もう持ってるし、これは元のよりずっと下」と言う。',
      mean: 'way ＋比較級 ＝「ずっと〜」。会話で much の代わりによく使う。',
      trap: 'than は弱く「ン」程度になり、worse につながる。way を「道」と取らず、強める語と聞く。',
      use: 'This one is way better.（こっちの方がずっといい）' },

    // R fix: V2, the middle of three was the likely price; a fourth form, $120 ("twelve" + "hundred" read as 12 × 10)
    // why: $120 ← "twelve hundred" heard as one-twenty; $200 ← "twelve" swallowed, only "hundred" caught; $12,000 ←
    //   hundred/thousand mixed up
    { id: 'n1', skill: 'number', level: 'B1', point: 'price', seg: [18.4, 26.0],
      stem: 'What price is given for the stroller Jan came with?',
      choices: ['$120', '$200', '$1,200', '$12,000'], a: 2, keep: true,
      cue: '「That’s a」のあと。二度目にも出てくる。',
      line: 'That’s a *$1,200* stroller. … *$1,200* for a stroller.',
      said: '「1,200ドルのベビーカーよ」と言い、別の人がくり返す。',
      mean: 'ベビーカーにしてはかなりの高額。くり返すのは驚きから。',
      trap: '1,200 は twelve hundred とも言うので、hundred だけ拾うと桁を落とす。thousand との違いも。',
      use: 'That’s twelve hundred dollars!（それ、1,200ドルだよ！）' },

    // why: the gift ← the question follows the gift-opening, and "the stroller" sounds like the one just given; any
    //   stroller ← "people assume" heard as a view on the whole product, not on one brand
    // anchor: 19.4–25.3 s "That's a $1,200 stroller… $1,200 for a stroller" (hers), 28.9–31.9 s "something with a brand
    //   name… higher quality. False.", 40.2 s "So am I impressed with the stroller?"; later 99.7 s "your fancy
    //   brand-name stroller"
    // R fix: S4, the segment sat at the 25 s cap; it now starts 0.5 s before "That's a $1,200" (19.4 s)
    { id: 'c1', skill: 'infer', level: 'C2', retired: true, point: 'impressed', reveals: ['brand', 'price'], seg: [18.9, 43.45],
      stem: 'After his talking head, which stroller is he unimpressed by?',
      choices: ['Jan’s own pricey one, for its brand', 'The office’s gift, as the cheaper one',
                'Any stroller, as a waste of money'], a: 0,
      cue: '値段の話のすぐあとの、カメラへの一言。',
      line: '*$1,200*… with a *brand name*… higher quality. *False.* … So am I impressed with the stroller?',
      said: '1,200ドルのベビーカーが話題になった直後、カメラに「ブランド品が上等というのはうそ。で、感心してるか？」と話す。',
      mean: 'カメラへの一言が場面を書きかえる。驚きの的だった高級品こそ、彼が認めない相手。',
      trap: '直前に開けた贈り物の話と取りやすいが、それは安い方。ブランドの話なので高い方を指す。',
      use: 'Fancy label, same old stuff.（ラベルは立派、中身は普通）' },

    // why: the stroller's extras ← "what else" taken literally about the item just shown; who else ← "chipped in"
    //   earlier, heard as asking for the rest of the givers
    { id: 'r1', skill: 'pragma', level: 'B2', point: 'else', seg: [21.9, 27.8],
      stem: 'Right after the price is repeated, what does the next short line do?',
      choices: ['It moves on to the next present', 'It asks what else the stroller can do',
                'It asks who else put money in'], a: 0,
      cue: '値段のくり返しのあと、Okay で始まる一言。',
      line: '*Okay, what else?*',
      said: '値段の話が出たあと、「さて、ほかには？」と言う。',
      mean: '気まずい空気を切って、次のプレゼントに進める。話題を変える Okay。',
      trap: 'what else を物の機能の話と取りやすい。Okay で始まる短い問いは、たいてい場面の切りかえ。',
      use: 'Okay, what’s next?（じゃあ、次は？）' },

    // R fix: V2, the key was the only choice about brands; now two brand-name choices that "False" separates
    // why: worth paying extra ← "higher quality" heard as his view, not as what "people assume"; homemade ← the
    //   grandmother's medicine taken as the theme, but his clothing and cola are bought
    { id: 'g2', skill: 'gist', level: 'B2', point: 'brand', reveals: ['impressed'], seg: [27.5, 43.9],
      stem: 'In his first talking head, what is his point?',
      choices: ['A brand name doesn’t mean better quality', 'A brand name is worth paying extra for',
                'Homemade beats anything from a store'], a: 0,
      cue: '「People assume」の文の次の一語で、立場が決まる。',
      line: 'People assume… with a *brand name*… higher quality. *False.*',
      said: '「ブランド品は質が高いと思われているが、違う」と言い、安上がりな暮らしを並べる。',
      mean: '高いブランドのベビーカーにも感心しない、という話。',
      trap: 'higher quality が残ると賛成に聞こえるが、それは people の考え。False で打ち消す。',
      use: 'Pricier doesn’t always mean better.（高いほど良いとは限らない）' },

    // why: one pound each ← pound read as money (ポンド), a price per item; pawn shops ← "pound" and "pawn" sound close
    //   to Japanese ears
    { id: 'ph2', skill: 'phrase', level: 'C1', point: 'pound', seg: [31.6, 39.5],
      stem: 'What does he say about how he buys his clothes?',
      choices: ['He buys them by weight, not by the piece', 'He pays just one pound for each piece',
                'He buys them second-hand at pawn shops'], a: 0,
      cue: '「clothing」のあと、3語のまとまり。',
      line: 'I buy my clothing *by the pound*.',
      said: '「服は重さで買う」と言う。量と安さの自慢。',
      mean: 'by the pound ＝ 1ポンド（約450g）いくらの量り売り。ブランドと正反対の買い方。',
      trap: 'pound をお金のポンドと取りやすいが、アメリカでは重さの単位。by the＋単位は「〜単位で」。',
      use: 'They sell coffee beans by the pound.（コーヒー豆を量り売りしている）' },

    // why: made ← the final s of "makes" blurs into "my"; her own ← grammar expects "her own" after "my grandmother"
    { id: 's1', skill: 'sound', level: 'B2', point: 'medicine', seg: [32.8, 39.5],
      stem: 'Fill the gap: “My grandmother ___ medicine.”',
      choices: ['makes my own', 'made my own', 'makes her own'], a: 0,
      cue: '「grandmother」のあと、3語が続けて聞こえる。',
      line: 'My grandmother *makes my own* medicine.',
      said: '「祖母が僕の薬を作ってくれる」と言う。makes の s が my につながる。',
      mean: '文法としては少し変だが、そう言っている。薬も手作りという安上がり自慢。',
      trap: '文法に合わせて her own と思いやすい。所有の語は、予想でなく聞こえた音で選ぶ。',
      use: 'My mom makes my lunch.（母がお弁当を作ってくれる）' },

    // why: a hated flavor ← "soda-flavored" heard as an odd taste; a sign of quality ← "higher quality" from the start
    //   of the talking head attached to the cola
    { id: 'h1', skill: 'humor', level: 'C1', point: 'cola', seg: [32.8, 41.9],
      stem: 'Why does his line about his favorite cola get a laugh?',
      choices: ['All cola is soda, so the label says nothing', 'He brags about a flavor most people would hate',
                'He takes an odd flavor as a sign of quality'], a: 0,
      cue: '好きな飲み物の説明の、最後の一語。',
      line: 'My favorite cola is *soda-flavored*.',
      said: '「好きなコーラはソーダ味」と、得意げに言う。',
      mean: 'コーラはもともとソーダの一種。ブランドなしの安物を自慢したつもりが、何も言っていない。',
      trap: '変わった味の話と取りやすい。自慢の中身が当たり前すぎる、という笑いの型。',
      use: 'It tastes like… well, soda.（味は…まあ、炭酸飲料だね）' },

    // R fix: V2, "asking the crew to judge" was a filler; now "You tell me" read as real doubt (= I can't say)
    // why: can't decide ← "You tell me" read literally, as handing the question over; a big yes ← the question
    //   heard as a setup for praise, but he has just called brand-name quality "False"
    { id: 'r2', skill: 'pragma', level: 'B2', point: 'impressed', reveals: ['brand'], seg: [39.25, 43.9],
      stem: 'When he ends the talking head with a question, what is he doing?',
      choices: ['Making it clear the answer is a firm no', 'Admitting he can’t make up his mind',
                'Making it clear the answer is a big yes'], a: 0,
      cue: '自分への問いと、そのあとの短い3語。',
      line: 'So am I impressed with the stroller? *You tell me.*',
      said: '「で、僕はあのベビーカーに感心してるか？言うまでもないだろ」と締める。',
      mean: '答えの分かりきった問い。You tell me ＝「見れば分かるだろ」で、ノーを強める。',
      trap: '文字通りなら相手に意見を求める形。直前の主張と合わせ、答えが決まっているかを聞く。',
      use: 'Am I tired? You tell me.（疲れてるかって？見れば分かるでしょ）' },

    // R fix: V2, the key was the only scornful choice; now three parallel "To say…" comparisons
    // why: the shelter cost more ← "whole" missed, so the shelter sounds bigger and pricier; as safe as a shelter ←
    //   "indestructible" in the next line attached to the shelter
    { id: 'i2', skill: 'infer', level: 'B2', point: 'shelter', reveals: ['price'], seg: [84.05, 89.2],
      stem: 'Why does he bring up his bomb shelter?',
      choices: ['To say the stroller costs as much as a shelter', 'To say his shelter cost him far more than that',
                'To say the stroller is as safe as a shelter'], a: 0,
      cue: '数字と、whole が付いた比べる相手。',
      line: '*$1,200* is what I spent on my *whole bomb shelter*.',
      said: '「1,200ドルは、シェルター丸ごとにかけた額だ」と言う。',
      mean: 'シェルター1つとベビーカー1台が同じ値段。高すぎる、という皮肉な比べ方。',
      trap: 'whole を聞き落とすとシェルターの方が高く聞こえる。比べる文は「何と何が同じか」を押さえる。',
      use: 'That’s what I paid for my whole car.（それ、私の車1台分だよ）' },

    // R fix: V2, "should be" + money made the toughness key likely; "simple to fold" is now "impossible to tip
    //   over", a near miss on the same "im-" start
    // why: easy to put together ← "indestructible" heard as "instructions"; tip over ← the "im-…-ible" frame caught
    //   and filled with the usual stroller safety worry
    { id: 'd3', skill: 'detail', level: 'B1', point: 'indestr', seg: [89.0, 96.9],
      stem: 'For that kind of money, what does he say the stroller should be?',
      choices: ['Impossible to break', 'Easy to put together', 'Impossible to tip over'], a: 0,
      cue: '「should be」のあと、長い一語。',
      line: 'this stroller *should be indestructible*.',
      said: '「その値段なら、このベビーカーは絶対に壊れないはずだ」と言う。',
      mean: 'indestructible ＝ 壊せない。高いなら丈夫で当然、という理屈。',
      trap: 'destruct が instruction に似て、組み立ての話に聞こえやすい。頭の in は否定。',
      use: 'This phone case is almost indestructible.（このケース、ほぼ壊れない）' },

    // why: fond ← "Hello, … little baby" is baby talk; anxious ← the next line's "as safe as" pulled back onto the
    //   greeting
    { id: 't1', skill: 'attitude', level: 'B2', point: 'spoiled', seg: [94.9, 102.4],
      stem: 'When he greets the baby in the stroller, how does he sound?',
      choices: ['Scornful of how pampered the baby is', 'Fond, like cooing over a cute baby',
                'Anxious about whether the baby is safe'], a: 0,
      cue: '呼びかけに付いた形容の語。',
      line: 'Hello, *spoiled* little baby in your *fancy* brand-name stroller.',
      said: '「やあ、しゃれたベビーカーの甘やかされた赤ちゃん」と言う。',
      mean: 'spoiled と fancy で見下した呼びかけ。口調は優しくても中身はけなす。',
      trap: 'Hello と little baby だけだと、あやす言葉に聞こえる。名詞の前の語で態度が決まる。',
      use: 'Look at you, Mr. Fancy Shoes.（あら、おしゃれな靴ですこと）' },

    // R fix: V2, "look up reviews" was a filler; now "Oh, look, a curb" heard as a warning to himself
    // why: warn Jan ← "I wonder if it's as safe" heard as worry; steer around ← "Oh, look, a curb" heard as
    //   spotting a hazard to avoid
    { id: 'i1', skill: 'infer', level: 'B2', point: 'test', seg: [102.4, 108.9],
      stem: 'After he wonders aloud about its safety, what is he about to do?',
      choices: ['Put it to a rough test himself', 'Warn Jan that it might not be safe',
                'Steer it carefully around the curb'], a: 0,
      cue: '安全の話のあと、目に入った物の名前。',
      line: 'I wonder if it’s *as safe as they say* it is. Oh, look, *a curb*.',
      said: '「言われているほど安全かな。おや、縁石だ」とつぶやく。',
      mean: '縁石を見つけたのは偶然ではなく、自分で試すための口実。',
      trap: 'I wonder を心配と取りやすい。そのあとの行動の言葉（look, curb）で、たくらみと分かる。',
      use: 'Let’s put it to the test.（試してみよう）' },

    // why: real alarm ← "Uh-oh" taken at face value, as when something goes wrong by accident; to amuse the baby ← it
    //   sounds like the "Hello, little baby" voice, but he called the baby "spoiled" and wants to see "what happens"
    // anchor: 103.2–105.9 s "I wonder if it's as safe as they say it is", 106.2 s "Oh, look, a curb", 109.1 s "let's
    //   see what happens": he spots the curb as a chance to test, then voices surprise at his own move
    { id: 'c2', skill: 'attitude', level: 'C2', retired: true, point: 'test', seg: [102.4, 110.9],
      stem: 'When he says “Uh-oh” at the curb, how is it meant?',
      choices: ['As fake alarm at a bump he’s causing', 'As real alarm; the curb took him by surprise',
                'As play, to make the baby laugh'], a: 0,
      cue: '「Uh-oh」の前後で、彼が何を言っているか。',
      line: 'I wonder if it’s as safe as they say… Oh, look, a curb. *Uh-oh*, *let’s see what happens*.',
      said: '安全性を疑い、縁石を「見つけて」から、「おっと、どうなるかな」と言う。',
      mean: '自分でやっておいて驚いたふりをする Uh-oh。前の一言で、わざとだと分かる。とぼけた言い方の定番。',
      trap: 'Uh-oh を本当の驚きと取りやすい。驚きの言葉は、その前に計画が語られていないかで確かめる。',
      use: 'Oops, did I eat the last cookie?（あれ、最後のクッキー食べちゃった？）' },

    // why: the Spartans ← they're the subject of the line just before; no one ← "I crawled home" heard as having
    //   wandered off alone
    { id: 'd5', skill: 'detail', level: 'B1', point: 'parents', seg: [119.7, 127.0],
      stem: 'Who does he say left him beside the road?',
      choices: ['His parents', 'The Spartans', 'No one; he crawled off'], a: 0,
      cue: '「left me」の前の主語。',
      line: '*My parents left me* beside the road. But I crawled home.',
      said: '「スパルタ人は弱い赤ん坊を道ばたに置いた。僕の両親も僕を置いていった」と話す。',
      mean: 'スパルタの話は前置きで、自分の家の話がそれに続く。',
      trap: '直前の Spartans が主語として残りやすい。My で始まると話は自分のことに移る。',
      use: 'My parents dropped me off at school.（親が学校まで送ってくれた）' },

    // R fix: V2, the key was the only "tough" choice; "teases a soft mom" is now a Spartan-upbringing boast
    // why: parents were right ← "a weak baby" heard as his admission; raised like a Spartan ← "Spartans" as the
    //   subject, with "My parents" missed
    { id: 'h2', skill: 'humor', level: 'C1', point: 'weak', reveals: ['parents', 'mom'], seg: [119.7, 129.5],
      stem: 'Why is his story about the Spartans funny?',
      choices: ['He offers being abandoned as proof he’s tough', 'He admits his parents rightly saw him as weak',
                'He boasts that he was raised like a Spartan'], a: 0,
      cue: '「left me」と、最後の一言の組み合わせ。',
      line: 'My parents *left me* beside the road. But I *crawled home*. *Not so weak*.',
      said: '「両親に道ばたに置かれたが、はって家に帰った。弱くなかっただろ」と言う。',
      mean: '捨てられた話を、強さの証拠として誇らしげに語る。笑われているのは本人の方。',
      trap: 'weak baby を本人が弱さを認めたと取りやすい。but のあとに本人の言い分が来る。',
      use: 'Not so bad, huh?（悪くないでしょ）' },

    // why: hurt ← a story of being left heard as a complaint (the sad-story frame); grateful ← "not so weak" heard as
    //   thanks for a tough start, but "Huh?" throws it back at her
    { id: 't2', skill: 'attitude', level: 'C1', point: 'mom', reveals: ['parents', 'weak'], seg: [123.1, 129.5],
      stem: 'In his last words to his mom, how does he sound?',
      choices: ['Smug, as if scoring a point off her', 'Hurt, as if asking why she left him',
                'Grateful, as if thanking her for it'], a: 0,
      cue: '最後の2語の言い方と、その直前の主張。',
      line: '…I crawled home. *Not so weak. Huh, Mom?*',
      said: '「はって帰ったんだ。弱くなかっただろ？ねえ、母さん」と言う。',
      mean: 'Huh? は「どうだ」と相手に突きつける一言。勝ち誇って母親に言い返している。',
      trap: '捨てられた話なので悲しみと取りやすい。文末の Huh? は問いでなく、念押しの挑発。',
      use: 'Told you I could do it, huh?（できるって言ったでしょ？）' },
  ]
};
