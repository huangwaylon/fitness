// “My Apothecary Table! | Friends” (the official Friends channel, Best of Season 6): Ross shows off a new table from
// Pottery Barn, the very table Rachel bought and told Phoebe was an original; Phoebe hates the store, so the table hides
// under Ross's Pottery Barn sheet, passed off as a flea-market find, and Rachel rescues her lie when the table is seen.
// Segments from the captions, words from whisper (2026-11-16). The captions have nothing for 126–136 s (overlapping
// shouts as the table is uncovered); no item uses that stretch. The sources differ at 120.7 s ("Hey, babes" / "Hey,
// Phoebe"), 142.7 s ("God, baby" / "Phoebe") and 163.6 s ("sheep" for "sheet"); no key rests on them. "Than one in fifty
// dollars" (153 s, both sources; likely "one-fifty") is never asked. The opium line (157 s) needs the episode's
// backstory and is left out.
// REVIEW 2026-11-16: pass 4, fix 17, drop 1, new 0; ear checks 1
//   Open: g2 and c2 stay near 45 % blind for anyone who knows the usual sitcom arc; a1's key also stands on
//   "I still can't believe…" (62.5 s), so its tone needs no ear.
// EAR CHECK: 99.5 s s1 — "want to" said as "wanna" (whisper "wanna", captions "want to")
import type { Clip } from '../types.ts';

export const apothecaryTable: Clip = {
  id: 'apothecary', video: 'UfdFfETBs3w', title: 'My Apothecary Table!', dur: 179, wpm: 153, band: 'mid',
  tags: ['友だち', '買い物'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 — the key was the only choice about a lie; all three are now secrets Rachel could be keeping
    // why: talked him out of it ← "I bought the same one" heard as Rachel having stopped Ross buying it; surprise
    //   gift ← "she'll love it" heard as a present for Phoebe
    { id: 'g1', skill: 'gist', level: 'B1', point: 'lie', seg: [12.5, 42],
      stem: 'Why does Rachel need to keep Phoebe from seeing Ross’s table?',
      choices: ['Rachel told her their own table is an original', 'Rachel talked Ross out of buying this very table',
                'Rachel wants it kept as a surprise gift for her'], a: 0,
      cue: '「I bought the same one」のあとの告白。',
      said: 'Rachel は同じテーブルを買い、Phoebe には「うちのは一点物」とうそをついていた。',
      mean: '見られたら、うちのも同じ店の量産品だとばれる。',
      trap: '「見せられない」を贈り物の秘密と取りやすい。理由は told her のあとに来る。',
      use: 'I can’t let her see this.（これは彼女に見せられない）' },

    // R fix: V2/K1 — "not a real antique" was also true and the only choice without "For her"; now a price reading.
    //   Segment trimmed to 25 s (C2 cap)
    // why: costly ← the usual snob view of "real" (brand, price), which Phoebe never mentions; real wood ← "real"
    //   heard as material, which Phoebe never mentions
    // anchor: 15.8–19.8 s "It's the real thing. I got it at Pottery Barn." against 37.4–40.7 s "nothing is authentic"
    { id: 'c1', skill: 'infer', level: 'C2', point: 'real', reveals: ['reasons'], seg: [16.3, 41.2],
      stem: 'Given Phoebe’s view, what’s off about Ross calling the table “the real thing”?',
      choices: ['For her, nothing from that store can be real', 'For her, only a costly piece counts as real',
                'For her, real wood matters, and this isn’t real'], a: 0,
      cue: '「real thing」と、Phoebe の言い分の中の一語。',
      line: 'It’s the *real thing*. I got it at Pottery Barn. … *nothing is authentic*…',
      said: 'Ross は「本物だよ、あの店で買った」と言う。Phoebe の言い分は「本物が何もない」。',
      mean: 'Ross の「本物」は正規の品、Phoebe の「本物」は量産でない物。同じ語で正反対の価値観。',
      trap: '値段や材料の話と取りやすいが、どちらも出てこない。同じ語の使い方を比べる。',
      use: 'Define “real”.（「本物」ってどういう意味で？）' },

    // why: same as Ross's ← "I bought the same one" said just before; copy of an antique ← Rachel's later cover story
    //   ("ripped off the design of our antique")
    { id: 'd1', skill: 'detail', level: 'B1', point: 'lie', seg: [21.3, 29.3],
      stem: 'What did Rachel tell Phoebe about the table they own?',
      choices: ['That it was an original', 'That it matched Ross’s', 'That it copied an antique'], a: 0,
      cue: '「I told her that」のあと。',
      line: 'I *told her that ours was an original*.',
      said: '「うちのテーブルは本物の一点物だと言ってしまった」と打ち明ける。',
      mean: 'original ＝ 複製でない本物。量産品ではない、という意味で言っている。',
      trap: '直前の same one に引っぱられやすい。told her のあとが話した中身。',
      use: 'Is this an original or a copy?（これは本物？複製？）' },

    // R fix: V2 — the stem said "repeated back as a question" (the cue for disbelief) and "unsure of the name" was a
    //   filler; tone ear check dropped, the words "I still can't believe" (62.5 s) settle it
    // why: pleased ← the repeat heard as "that explains it"; amused ← the repeat heard as light teasing about a quirk
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'shock', reveals: ['believe'], seg: [29.3, 35.6],
      stem: 'When Ross hears why Phoebe mustn’t see the table, how does he react?',
      choices: ['Stunned, as if it were hard to believe', 'Pleased, as if it explained a lot about her',
                'Amused, as if it were a funny little quirk'], a: 0,
      cue: '同じ言葉をくり返す声の調子と、少しの間。',
      line: 'Because she hates Pottery Barn. — *She hates Pottery Barn?*',
      said: '理由を聞いて、同じ言葉を疑問の形で言い返す。',
      mean: 'そのままくり返すのは「信じられない」の反応。あとで「まだ信じられない」とも言う。',
      trap: '疑問形を軽いからかいと取りやすい。笑いはなく、くり返しは驚きの合図。',
      use: 'You quit your job? You quit?（仕事を辞めた？本当に？）' },

    // R fix: V2 — the key was the only choice about sameness; a second "Everybody ends up" choice (paying for the
    //   name, built on "winds up") replaces the price filler
    // why: paying for the name ← "winds up" heard, the rest filled in with the usual brand-store complaint; breaks
    //   easily ← "mass-produced" heard as cheaply made
    { id: 'd2', skill: 'detail', level: 'B2', point: 'reasons', seg: [35.8, 41.3],
      stem: 'According to Rachel, what is one of Phoebe’s complaints about the store?',
      choices: ['Everybody ends up owning the same things', 'Everybody ends up paying extra for the name',
                'The furniture there falls apart far too soon'], a: 0,
      cue: '「she says」のあとに並ぶ3つの理由の最後。',
      line: 'it’s all mass-produced, nothing is authentic, and *everyone winds up having the same stuff*.',
      said: '量産品で本物がない、みんな同じ物を持つことになる、と言う。',
      mean: 'wind up ～ing ＝ 結局～することになる。値段や品質の話はしていない。',
      trap: 'mass-produced を「すぐ壊れる」と取りやすい。不満は「みんな同じ」のほう。',
      use: 'We wound up eating at the hotel.（結局ホテルで食べることになった）' },

    // R fix: answer and line take a straight apostrophe (clips.test.ts words()); ear check dropped, both sources
    //   agree on "can't"
    { id: 'x1', skill: 'dict', level: 'B2', point: 'believe', seg: [62.0, 65.4],
      stem: 'Type what he says: “I still ___ she hates Pottery Barn.” (2 words)', answer: 'can\'t believe',
      cue: '「I still」のすぐあと。短い否定の音を。',
      line: 'I still *can\'t believe* she hates Pottery Barn.',
      said: '「彼女がポッタリー・バーンを嫌いだなんて、まだ信じられない」。',
      mean: 'can’t の t はほぼ聞こえず、can より母音が長く強い。それが否定の目印。',
      trap: 'can だと still と意味が合わない。強く長い「キャーン」は否定。',
      use: 'I can’t believe it’s already Friday.（もう金曜日だなんて）' },

    // R fix: V2 — "still upset" pointed at the table's owner; the stem now asks who can't accept her view. Ear check
    //   dropped: the address "Ross, get over it" settles it
    // why: Rachel ← she has more at stake (her lie) and speaks just before; both ← both sound upset about Phoebe
    { id: 'w1', skill: 'who', level: 'B1', point: 'getover', reveals: ['believe', 'shock'], seg: [62.0, 67.5],
      stem: 'Who still can’t accept Phoebe’s view of the store?',
      choices: ['Ross', 'Rachel', 'Both'], a: 0,
      cue: '直後の返事の最初の名前。',
      line: 'I still can’t believe… — *Ross*, get over it.',
      said: '「まだ信じられない」に「Ross、もう気にしないで」と返る。',
      mean: '名前で呼んで「忘れなよ」と言っているので、こだわっているのは Ross。',
      trap: 'うそをついた Rachel のほうが困っていそう。返事の中の呼びかけで決まる。',
      use: 'Come on, get over it.（もう、気にするなって）' },

    // R fix: V2 — "answers Ross's disbelief" hinted at reassurance; stem neutral, choices parallel (label: gloss)
    // why: warning ← "she hates you" heard without "it's not like"; asking ← "it's not like…?" heard as a real question
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'notlike', reveals: ['getover'], seg: [64.6, 70],
      stem: 'When Rachel replies to Ross, what does her second sentence do?',
      choices: ['Plays it down: it isn’t about him', 'Warns him: Phoebe might hate him next',
                'Asks him: has Phoebe said she hates him?'], a: 0,
      cue: '「get over it」に続く一文の働き。',
      line: 'Ross, get over it. *It’s not like she hates you*.',
      said: '「あなたが嫌われてるわけじゃないんだから」と言う。',
      mean: 'It’s not like ～ ＝「～というわけじゃない」。大したことではないと軽くする。',
      trap: 'she hates you だけ聞くと警告に聞こえる。It’s not like で打ち消し。',
      use: 'It’s not like we’re in a hurry.（別に急いでるわけじゃないし）' },

    // R fix: V2 — "Curious" was a filler, leaving the key the only stance with an edge; now "Kind" (the twin line
    //   heard as an excuse for her)
    // why: kind ← "it's because she's a twin" heard as excusing her taste; quoting Phoebe ← "she says" from Rachel's
    //   earlier report
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'twin', seg: [72.2, 77.8],
      stem: 'When Ross brings up Phoebe being a twin, what is his stance?',
      choices: ['Petty: he grabs any reason to call her strange', 'Kind: he finds an excuse for her odd taste',
                'Fair: he is repeating what Phoebe says of herself'], a: 0,
      cue: '「she’s weird」の理由として何を挙げるか。',
      line: 'I think… she’s *weird*. You know? It’s because she’s a twin. *Twins are weird*.',
      said: '「彼女は変なんだよ。双子だからさ。双子って変だろ」と言う。',
      mean: '店を嫌われた腹いせに、関係のない理由で相手を「変」と決めつけている。',
      trap: '双子の話をかばう理由と取りやすい。weird をくり返すのは、すねている合図。',
      use: 'You’re just being petty now.（それ、ただのひがみだよ）' },

    // R fix: V2 — "defends Phoebe's taste" plus a weak "Matching" left the key alone; "Old" (Phoebe's antique
    //   story) replaces it
    // why: kind ← "kind" read as 親切 (environment, people); old ← the "antique" and "original" talk earlier
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'onekind', seg: [79.2, 83.6],
      stem: 'When Rachel says Phoebe isn’t weird, what does Phoebe like her stuff to be?',
      choices: ['Unique, unlike anyone else’s', 'Kind to people and the planet', 'Old, with a bit of history'], a: 0,
      cue: '「she just likes her stuff to be」のあと。',
      line: 'She just likes her stuff to be *one of a kind*.',
      said: '「変なんじゃない、一点物が好きなだけ」と言う。',
      mean: 'one of a kind ＝ ほかにない、唯一の。さっきの original と同じ方向の言葉。',
      trap: 'kind を「親切」と取るとずれる。ここは「種類」で、一種類に一つだけ。',
      use: 'This scarf is one of a kind.（このスカーフは一点物です）' },

    // R fix: K3 — "he lets slip that he is a twin" was absurd; now "agrees, clumsily" (her words echoed back)
    // why: agrees ← "one of a kind" echoed back sounds like going along with her; misheard ← the reply taken as a
    //   slip rather than a jab
    { id: 'h2', skill: 'humor', level: 'C1', point: 'twinjoke', reveals: ['onekind'], seg: [79.2, 88],
      stem: 'Why does Ross’s reply to Rachel’s defense get a laugh?',
      choices: ['He turns her own words into a petty jab', 'He agrees with her, but in a clumsy way',
                'He takes her words to be about twins'], a: 0,
      cue: 'Rachel の言葉を、Ross がどう使い返すか。',
      line: 'You know what’s *not one of a kind*? *A twin!*',
      said: '「一点物じゃないもの、知ってる？双子だよ！」と言い返す。',
      mean: '相手の言葉を逆手に取って、Phoebe をからかう。勝ったつもりの子どもっぽさが笑いどころ。',
      trap: '勘違いと取りやすいが、わざとの切り返し。相手の言葉のくり返しは反撃の合図。',
      use: 'Speaking of “unique”…（「一点物」と言えばさ…）' },

    // R drop: i2 (lights) — V2/V3: the plot answers it (≈ 80 % blind); turning out the lights to hide the table is
    //   common sense once the scene is known, not listening
    // why: learns the truth ← the usual sitcom script, where the table gives the lie away; changes her mind ←
    //   Phoebe's "Wow! Oh my God!" heard as her coming round to the store
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['ripoff', 'pricing'], seg: [92, 167.5],
      stem: 'By the end, where does Rachel’s lie about the table stand?',
      choices: ['It holds, and Phoebe now values her table more', 'It falls apart, and Phoebe is upset with Rachel',
                'It no longer matters: Phoebe now likes the store'], a: 0,
      cue: 'Phoebe の最後の方の言葉、「worth」のあたり。',
      said: '見つかったテーブルは「店のまね」ということになり、Phoebe は喜ぶ。',
      mean: 'うそはばれず、むしろ大きくなった。損をしたのは、シーツを安物扱いされた Ross。',
      trap: 'ふつうはテーブルが見つかればうそがばれる。この場面はその型を外す。',
      use: 'Well, that worked out better than expected.（思ったよりうまくいったね）' },

    // R fix: V2/S1 — the stem said Ross was told to loosen up with his money, which named the butt and f2's key
    // why: Phoebe ← she's the one being lied to, so the laugh seems to be at her; Rachel ← "they got it at a flea
    //   market" was her idea, so it seems to backfire on her
    // anchor: 52.1–54.2 s Ross boasts "I did get some great Pottery Barn sheets"; 108.9–111 s he is called cheap for them
    { id: 'c2', skill: 'humor', level: 'C2', point: 'purse', reveals: ['flea', 'newold'], seg: [96, 111.4],
      stem: 'In the flea-market moment, who is the joke on?',
      choices: ['Ross, called cheap for sheets he’s proud of', 'Phoebe, who doesn’t know the sheet’s secret',
                'Rachel, whose quick story falls apart on her'], a: 0,
      cue: 'シーツを自慢していたのは誰か。',
      line: 'You wanna know where I got it? … You gotta *loosen the purse strings* a little.',
      said: 'Ross は店の名前を言えず、フリーマーケットで買ったことにされ、「けちだね」と言われる。',
      mean: '自慢の高いシーツなのに、うそのせいで安物好きのけち扱い。言い返せない Ross が笑われている。',
      trap: 'だまされている Phoebe に目が行きやすいが、彼女は損をしていない。損をして黙るのは誰か。',
      use: 'Me? Cheap? I paid full price!（僕がけち？定価で買ったのに）' },

    // EAR CHECK: s1 (header)
    // R fix: §9.5/K4 — "went to know" isn't English; cut. "Oh, you like it?" left out of the stem (it made "want to"
    //   the only fit)
    // why: wanted to ← -ed lost before "to"; won't ← "wan" heard as a negative
    { id: 's1', skill: 'sound', level: 'B2', point: 'wanna', seg: [98, 101.5],
      stem: 'Fill the gap: “You ___ know where I got it?”',
      choices: ['want to', 'wanted to', 'won’t'], a: 0,
      cue: '「You」のあとの短い一続きの音。',
      line: 'You *wanna* know where I got it?',
      said: '「どこで買ったか知りたい？」と得意げに聞く。',
      mean: 'want to が「ワナ」に縮む。t が二つとも消えて、一語のように聞こえる。',
      trap: 'wanted to なら過去で話が合わない。「ワナ」と短く聞こえたら、まず want to を考える。',
      use: 'Wanna grab a coffee?（コーヒーでもどう？）' },

    // R fix: V2 — "show off the find was hers" was a filler; now "tease Ross about shopping cheaply" (the
    //   purse-strings line that follows)
    // why: forgot ← someone else answering looks like Ross can't remember; tease ← the "flea market" and
    //   "purse strings" teasing right after, put on the wrong speaker
    { id: 'i3', skill: 'infer', level: 'C1', point: 'flea', reveals: ['wanna'], seg: [98, 104],
      stem: 'Why does someone else answer Ross’s question for him?',
      choices: ['To stop him naming the store Phoebe hates', 'Because Ross can’t remember where he got it',
                'To tease Ross about how cheaply he shops'], a: 0,
      cue: '答えたのが誰か、そして直前に何を言いかけたか。',
      line: 'You wanna know where I got it? — Sure. — *They got it at a flea market*.',
      said: 'Ross が「どこで買ったと思う？」と聞くと、横から「フリマで」と答えが入る。',
      mean: 'Ross は店の名前を言いかけている。先に別の答えを出して口をふさいだ。',
      trap: '代わりに答えるのは助けにも見えるが、ここは口止め。割りこみには目的がある。',
      use: 'Oh, he got it on sale.（あ、それセールで買ったんだって）' },

    // why: relax ← "loosen" read literally (緩める = 気を楽に); less picky ← flea market heard as a shopping-taste issue
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'purse', seg: [104.8, 111.4],
      stem: 'After the question about the flea market, what is Ross told to do?',
      choices: ['Spend a little more money', 'Relax and worry a little less', 'Shop at a few more places'], a: 0,
      cue: '「come on」のあと、お金に関わる慣用句。',
      line: 'Ross, come on. You gotta *loosen the purse strings* a little.',
      said: '「フリマでシーツ？もう少しお金を使いなよ」と言われる。',
      mean: 'loosen the purse strings ＝ 財布のひもをゆるめる。けちだとからかっている。',
      trap: 'loosen を「気を楽に」と取りやすい。purse（財布）が付いたら、お金の話。',
      use: 'Loosen the purse strings — it’s your birthday!（誕生日なんだから奮発しよう）' },

    // R fix: K3 — "her feet will soon make it old" was a filler; now "the old sheet is delicate" (why not put feet on it)
    // why: had it for years ← "old" taken as a real correction; delicate ← "old" + "please not put your feet up"
    //   heard as a request to be careful
    { id: 'i4', skill: 'infer', level: 'C1', point: 'newold', reveals: ['flea'], seg: [120.4, 125.6],
      stem: 'When Ross stops mid-sentence about his sheet, why does he change the word?',
      choices: [`He’s keeping up the story of where it came from`, 'He’s fixing a slip: he’s really had it for years',
                'He’s stressing that the old sheet is delicate'], a: 0,
      cue: '途中で止まって言い直す一語。',
      line: 'can you please not put your feet up on my *new… old sheet*?',
      said: '「僕の新しい…古いシーツに足を乗せないで」と言い直す。',
      mean: 'フリマで買ったことになっているので「新しい」は言えない。うそに合わせた言い直し。',
      trap: 'ただの言いそこないと取りやすい。言い直しは、何を隠しているかの手がかり。',
      use: 'My new — I mean, my old phone.（新しい…じゃなくて古い携帯）' },

    // R fix: V2 — "It tore it up" can't be done to a design; now "overcharged for it" (rip-off's other sense) and
    //   "changed it"
    // why: overcharged ← rip off ＝ ぼったくる, its other common sense; changed ← "the design" heard, the verb missed
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'ripped', seg: [141.6, 146.8],
      stem: 'What does Rachel say Pottery Barn did to the design of their antique?',
      choices: ['It copied it', 'It overcharged for it', 'It changed it'], a: 0,
      cue: '「Pottery Barn has」のあとの動詞と小さな語。',
      line: 'Pottery Barn has *ripped off* the design of our antique!',
      said: '「店がうちのアンティークのデザインをまねした！」と言う。',
      mean: 'rip off ＝ まねする、盗用する。ぼったくる、の意味でもよく使う。',
      trap: 'rip off は「ぼったくる」とも取りやすいが、目的語が design なら「まねる」。',
      use: 'That logo is a total rip-off.（あのロゴ、完全にパクリだね）' },

    // R fix: V2 — the confession choice now sounds like a real admission ("ours came from that store too")
    // why: admitting ← "ripped off" heard as owning up that theirs is a copy too; blaming the store for Ross ← the
    //   line heard as making peace between Phoebe and Ross
    // anchor: 149.0–153.9 s Phoebe answers "ours must be worth much more", so the line landed as proof
    { id: 'c3', skill: 'pragma', level: 'C2', point: 'ripoff', reveals: ['ripped', 'outcome'], seg: [141.6, 154.4],
      stem: 'Which plain-English version keeps what Rachel’s line about the antique does?',
      choices: ['“Their copy proves ours is the real one.”', '“Fine, ours came from that store too.”',
                '“Don’t be mad at Ross; blame the store.”'], a: 0,
      cue: 'Rachel の一言と、それを聞いた Phoebe の反応。',
      line: 'Pottery Barn has *ripped off the design of our antique*! — …ours must be worth much more…',
      said: '「店がうちのアンティークをまねした！」と叫ぶと、Phoebe は「うちのはもっと高い」と喜ぶ。',
      mean: 'ばれる証拠を、本物の証拠にひっくり返した。Phoebe の返事が、それが通じたことを示す。',
      trap: 'ripped off を自白と取りやすい。発言の働きは、相手の返事で答え合わせする。',
      use: 'See? Everyone copies the original.（ほらね、みんな本家をまねする）' },

    // R fix: V2 — "treasured" marked the key; choices rebalanced to one length and tone
    // why: sarcastic ← "calm down" heard as mocking, as if she knows the real price; fussing ← the offer taken as the
    //   real price Ross paid
    { id: 'h3', skill: 'humor', level: 'C1', point: 'pricing', reveals: ['cents', 'newold'], seg: [161.8, 167.5],
      stem: 'Why does the offer to pay for the sheet get a laugh?',
      choices: ['It prices his costly sheet like junk', 'It hints she knows what he really paid',
                'It shows he really paid next to nothing'], a: 0,
      cue: 'シーツはどこで買ったことになっているか。',
      line: 'thanks for wrecking my sheet… — I’ll give you *the 80 cents*.',
      said: 'シーツを台なしにされて怒る Ross に「80セント払う」と返す。',
      mean: '本当は自慢の店のシーツ。古物の値段を言われても、うそのせいで言い返せない。',
      trap: '皮肉にも聞こえるが、言う側はフリマ品だと信じている。誰が何を知っているかを追う。',
      use: 'Relax, I’ll buy you a new one.（大丈夫、新しいの買うから）' },

    // why: 18 ← -teen/-ty; 8 dollars / 80 dollars ← the unit missed, and a sheet usually costs dollars
    { id: 'n1', skill: 'number', level: 'B1', point: 'cents', seg: [164.4, 167.5], keep: true,
      stem: 'How much is Ross offered for his ruined sheet?',
      choices: ['18 cents', '80 cents', '8 dollars', '80 dollars'], a: 1,
      cue: '「calm down」のあと、最後の二語。',
      line: 'Oh, Ross, calm down. I’ll give you *the 80 cents*.',
      said: '「落ち着いて、Ross。80セント払うから」と言われる。',
      mean: 'eighty は最初が強い。フリーマーケット品ならその程度、という値踏み。',
      trap: 'eighteen は後ろが強く長い。数字はどこが強いかで -teen と -ty を分ける。',
      use: 'I’ll pay you back the five bucks.（その5ドル返すね）' },
  ]
};
