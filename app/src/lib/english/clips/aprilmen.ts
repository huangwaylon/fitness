// REVIEW 2026-11-16: pass 14, fix 8, drop 0, new 0; ear checks 2
// “April thinks men are better than women | Parks and Recreation” (the official Parks and Recreation channel, Season 5):
// Paula Hork, Pawnee's first woman on the city council, now 82, tells the women's group about the old days; Leslie
// vows to revive Paula's commission, April trolls her, and at its first meeting the men try to take it over.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 150.8 s (music after; the captions'
// last line is "it's not the seventh yet", whisper's garbled "It's not for seventh yet": the calendar callback, kept
// out like the rest of that thread). Untested on purpose: 37.4–43.4 s (bra / mirrors), 45–53 s ("pervert", the
// kiss), 55–79 s except the commission line (the calendar thread), 100.5–106.3 s ("sausage fest"), 149.6 s (the
// callback). Both sources spell "beau" as "bow" (93.6 s, same sound; f3's line writes beau). At 135.4 s whisper has
// "Kelsey and Milton", the captions "councilman Milton": stems use Councilman Milton, and no key rests on the name.
// EAR CHECK: 27.3–28.3 s nt1 — both sources have "quite a ways to go"; confirm the s of "ways" is heard before the
//   C2 dictation keys on it
// EAR CHECK: 145.2–146.3 s nt3 — the stress in "This is my commission" falls on "my" (against "we'll take it from
//   here"), not on "commission" (ship only once confirmed)
import type { Clip } from '../types.ts';

export const aprilMen: Clip = {
  id: 'aprilmen', video: '3jYNwLE_8R0', title: 'April thinks men are better than women', dur: 173, wpm: 161,
  band: 'mid', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %: the key was the only choice about her council years); choices rebalanced, and the
    //   "eighty-second birthday" choice gave away n1's key without a reveals, so the number is gone
    // why: run again ← "still going strong" plus "my time on the city council" heard as a comeback; birthday ←
    //   "still going strong at 82" heard as a birthday toast
    { id: 'g1', skill: 'gist', level: 'B2', point: 'visit', seg: [0, 38.85],
      stem: 'Why has Paula been invited to speak to the group?',
      choices: ['To talk about her old days on the city council', 'To get the women to back her run for council again',
                'To be honored by the group on her birthday'], a: 0,
      cue: '最初のお礼の言葉と、カメラへの紹介。',
      said: '「市議会時代の話なんて誰も興味ないと思った」と言い、初の女性市議だと紹介される。',
      mean: '会の目的は、昔の女性議員の経験を聞くこと。',
      trap: 'still going strong から復帰や誕生日を想像しやすい。目的は本人の最初の一言に出る。',
      use: 'I didn’t think anyone would care.（誰も興味ないと思ってた）' },

    // why: 72 ← "seventy" and "eighty" are both two-beat -ty numbers; 92 ← the same, and "at" blurs the onset
    { id: 'n1', skill: 'number', level: 'B1', point: 'age', seg: [8.22, 11.8], keep: true,
      stem: 'How old is Paula?',
      choices: ['72', '82', '92'], a: 1,
      cue: '「still going strong」のあとの数。',
      line: 'Still going strong *at 82*.',
      said: '「82歳でまだまだ元気」とほめている。',
      mean: 'still going strong ＝ 年を取っても衰えず元気。人にも物にも使う。',
      trap: '-ty の数は頭の音で決まる。eighty は「エイ」、seventy は「セ」、ninety は「ナイ」で始まる。',
      use: 'My old laptop is still going strong.（古いパソコンがまだ元気に動く）' },

    // why: recipe ← receipt and recipe share "re-ci-"; tissue ← "handkerchief" sets up something to wipe with
    { id: 'd1', skill: 'detail', level: 'B1', point: 'receipt', seg: [13.1, 18.1],
      stem: 'When asked about the handkerchief, what does Paula say it really is?',
      choices: ['A receipt', 'A recipe', 'A tissue'], a: 0,
      cue: '「it’s not a handkerchief」のあと。',
      line: 'Well, it’s *not* a handkerchief. It’s *a receipt*.',
      said: '「ハンカチじゃなくて、レシートよ」と答える。',
      mean: '古いハンカチだと思われていたのは、ただのレシート。年齢いじりの質問を、さらりとかわしている。',
      trap: 'receipt の p は読まない。「リシート」と聞こえたらレシート、「レサピ」ならレシピ。',
      use: 'Can I get a receipt, please?（レシートをもらえますか）' },

    // why: 14 ← -teen/-ty; 50 ← fifty and forty both open on f and end in -ty
    { id: 'n2', skill: 'number', level: 'B1', point: 'years', seg: [17.9, 22.95], keep: true,
      stem: 'How long ago was Paula Pawnee’s first woman on the council?',
      choices: ['14 years', '40 years', '50 years'], a: 1,
      cue: '「city councilor」のすぐあとの数。',
      line: 'Pawnee’s first female city councilor *40 years ago*',
      said: '「40年前に、ポーニー初の女性市議になった」と紹介している。',
      mean: '今から40年前の話。このあと出てくる70年代の話と時期が合う。',
      trap: 'forty は頭が強く「フォーティ」、fourteen は後ろの「ティーン」が強く長い。強さの位置で聞き分ける。',
      use: 'I moved here forty years ago.（40年前にここへ越してきた）' },

    // R fix: V2 (blind 65 %: the moving-away choice was off-topic, leaving a two-way pick); it's now "a long way"
    //   heard as distance still to cover
    // why: close to equal ← "come a long way" heard, "but… a ways to go" missed; little better ← "come a long way"
    //   heard as "have a long way to go", so only the second half is kept
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'ways', seg: [23.8, 29.5],
      stem: 'In the comment to camera, how are things for women in Pawnee?',
      choices: ['Much better than before, with more still to do', 'Much better than before, and close to equal now',
                'Little better than before, with a long way to go'], a: 0,
      cue: '「come」で始まる言い方と、but のあと。',
      line: 'Women have *come a long way* in Pawnee, but we still have *quite a ways to go*.',
      said: '「女性はずいぶん進歩したけど、まだ先は長い」と言っている。',
      mean: 'come a long way ＝ 大きく前進した。but 以下で「まだ道半ば」と付け足す。',
      trap: 'come a long way を「まだ遠い」と取りやすい。but の前後で分けて聞く。',
      use: 'You’ve come a long way since April.（4月からずいぶん上達したね）' },

    // anchor: 26.4–28.3 s "but we still have quite a ways to go": five words in about a second, and "a ways" is the
    //   American form that grammar would turn into "a way"
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'ways', seg: [24.3, 29.5],
      stem: 'Type the end: “…but we still have ___.” (5 words)', answer: 'quite a ways to go',
      cue: '「still have」のあと。文法より、聞こえた音を。',
      line: 'but we still have *quite a ways to go*.',
      said: '「でも、まだ先は長い」。quite a は「クワイダ」とつながる。',
      mean: 'a ways は「かなりの道のり」を言うアメリカの話し言葉。a なのに ways で、決まった形。',
      trap: 'a のあとの複数形を直して way と書きたくなる。習った形より、聞こえた音を書く。',
      use: 'The station is still a ways off.（駅はまだ結構遠いよ）' },

    // why: on the council ← "council" is said in the scene and men ran it, so a councilman sounds right; both ←
    //   "husband or father's" heard as two signatures
    { id: 'd2', skill: 'detail', level: 'B1', point: 'sign', seg: [27.9, 35.25],
      stem: 'To book this conference room, what would she technically need?',
      choices: ['Her husband’s or her father’s signature', 'A signature from a man on the council',
                'Both her husband’s and her father’s signatures'], a: 0,
      cue: '「without」のあと。何人の名前か。',
      line: 'technically, I’m not allowed to reserve this conference room *without my husband or father’s signature*.',
      said: '「建前では、夫か父のサインがないとこの会議室を予約できない」と言う。',
      mean: '古い規則がまだ残っている例。technically ＝ 規則の上では。',
      trap: 'husband と father の両方が聞こえ、「両方」と取りやすい。or なら、どちらか一方。',
      use: 'Technically, we’re closed, but come in.（一応閉店だけど、どうぞ）' },

    // R fix: V2 (blind 65 %: "a friendly club where all got along" was an odd one out); all three now say men ran
    //   it, and the key no longer claims women were kept out (Paula was on the council)
    // why: young men ← boys = 少年, the same "ran it / weren't welcome" shape; fun hobby ← club read literally as
    //   部活, a pastime
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'club', seg: [33.2, 38.85],
      stem: 'What does Paula say government was like in the ’70s?',
      choices: ['Men ran it, and women weren’t welcome', 'Young men ran it, and older men weren’t welcome',
                'Men ran it, and treated it like a hobby'],
      a: 0,
      cue: '「government was」のあと、二語の言い方。',
      line: 'Government was *a real boys’ club* back in the ’70s.',
      said: '「70年代の政治は、まさに男だけの世界だった」と話す。',
      mean: 'boys’ club ＝ 男同士で固まり、女性を入れない集団。批判の言い方で、楽しい会ではない。',
      trap: 'boys を「少年」、club を「部活」と取ると別の絵になる。職場の話なら「男社会」。',
      use: 'The industry is still a boys’ club.（あの業界はまだ男社会だ）' },

    // R fix: V2 (blind 60 %: "honor Paula" was weak) and S4 (the segment cut into April's "I think"); the new
    //   distractor turns on who restarts it, and the segment ends before April speaks
    // why: room rule ← the conference room rule is the last "unfair rule" mentioned; ask Paula ← Paula's own
    //   commission, so she seems the one to restart it ("I'm gonna" missed)
    { id: 'd4', skill: 'detail', level: 'B2', point: 'plan', seg: [79.1, 83.8],
      stem: 'After Paula’s story, what does Leslie decide to do?',
      choices: ['Get Paula’s old commission going herself', 'Get the old conference room rule changed',
                'Ask Paula to start her old commission again'], a: 0,
      cue: '「I’m gonna」のあと、何を動かすと言うか。',
      line: 'You know what? I’m gonna get *that commission* going, because this inequality has gone on long enough.',
      said: '「あの委員会を私が動かす。この不平等はもう十分続いた」と宣言する。',
      mean: 'that commission ＝ ポーラが昔作ろうとした委員会。それを引き継ぐ決意。',
      trap: 'that が何を指すかを落とすと別の計画に聞こえる。that は直前の話を指す。',
      use: 'That’s gone on long enough.（それはもう十分続いたよ）' },

    // why: means it ← "No, I'm not" taken at face value; half means it ← "I think…" heard as thinking aloud
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'troll', seg: [83.35, 96.6],
      stem: 'How serious is April about men being better than women?',
      choices: ['She doesn’t mean it; she is putting on an act', 'She means it; she says so when doubted',
                'She half means it; she is thinking aloud'], a: 0,
      cue: '否定のあと、どこまで話を大きくするか。',
      line: 'She’s kidding. — *No, I’m not.* They provide for us… they are *our masters*.',
      said: '「冗談です」と言われても「違う」と返し、男は「ご主人様」とまで言う。',
      mean: '否定してさらに大げさにするのは、相手を怒らせるための芝居。本気の意見ではない。',
      trap: 'No, I’m not を言葉どおり取ると本気に聞こえる。極端な話ほど、わざとの可能性が高い。',
      use: 'Relax, I’m just messing with you.（落ち着いて、からかっただけ）' },

    // why: the men ← praise that absurd heard as sarcasm aimed at men; Paula ← it comes right after her story, as if
    //   brushing it aside
    // anchor: 92.3–96 s "April, stop it" is answered with "Leslie, you'll never land a beau with that domineering tone":
    //   she names Leslie and attacks her tone; no line mocks the men or mentions Paula's story
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'troll', seg: [86.4, 100.2],
      stem: 'Who is April’s speech about men really aimed at?',
      choices: ['Leslie, to annoy her after her big speech', 'The men here, by praising them far too much',
                'Paula, by brushing aside her life’s story'], a: 0,
      cue: '「stop it」と言われたあと、誰の名前を呼ぶか。',
      line: 'April, stop it. — *Leslie*, you’ll never land a beau with that *domineering tone*.',
      said: '止められると「レスリー、その偉そうな口調じゃ男は捕まらないわよ」と返し、さらに男の後ろを歩けと言う。',
      mean: '男をほめる形だが、名指しで口調を責める相手はレスリー。怒る相手を選んでからかっている。',
      trap: 'ほめすぎを男への皮肉と取りやすい。言葉の矛先は、名前を呼ばれた人と「you」で決まる。',
      use: 'Don’t take the bait. She wants a reaction.（乗らないで。反応がほしいだけ）' },

    // why: win a vote ← land = 勝ち取る, and this is a government office; take a bow ← "bow" is how both transcripts
    //   hear it, the literal word
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'beau', reveals: ['troll'], seg: [92.85, 96.6],
      stem: 'What does April say Leslie will never do with that tone?',
      choices: ['Find herself a boyfriend', 'Win a vote on the council', 'Take a bow after a speech'], a: 0,
      cue: '「land a」のあとの短い一語。',
      line: 'Leslie, you’ll never *land a beau* with that domineering tone.',
      said: '「その偉そうな口調じゃ、恋人は無理」と言う。',
      mean: 'beau は古風な「恋人」。land ＝ 苦労して手に入れる。昔の価値観をわざと演じている。',
      trap: 'beau は bow（おじぎ）と同じ音。音だけで取ると舞台の話。land のあとは手に入れる物。',
      use: 'She finally landed her dream job.（ついに夢の仕事を手に入れた）' },

    // why: picked them ← "departments" missed, so the members sound like his own list; told them men ← the all-male
    //   result read back as an order
    { id: 'i2', skill: 'infer', level: 'B2', point: 'assume', seg: [106.9, 116.35],
      stem: 'Why does Chris decide he is to blame?',
      choices: ['He assumed departments would send women', 'He picked every member of it himself',
                'He told departments to send only men'], a: 0,
      cue: '「I just」のあと、部署について何と言うか。',
      line: 'I just *assumed* that some of the departments *would send women*. … I am part of the problem.',
      said: '「どこかの部署は女性を出すと思ってた。僕も問題の一部だ」と気づく。',
      mean: '確かめずに思い込んだことが、男だけの委員会を生んだ。',
      trap: 'assume は「思い込む」で、命令ではない。would send は「送るだろう」という予想。',
      use: 'I just assumed you knew.（てっきり知ってると思ってた）' },

    // R fix: V2 (blind 75 %: the key was the only choice where she resists); a distractor now shares the first half
    // why: rebalance ← "we are gonna need to rebalance this commission" heard as the outcome; lets it go ← "they are
    //   delicious, I must say" heard as giving in
    { id: 'g2', skill: 'gist', level: 'B2', point: 'meeting', reveals: ['take', 'role', 'girl'], seg: [106.9, 149.3],
      stem: 'How does the commission’s first meeting turn?',
      choices: ['The men try to take over, and Leslie pushes back', 'The men try to take over, and Leslie lets it go',
                'The men agree to rebalance it, and Leslie thanks them'], a: 0,
      cue: '後半の、お礼の言葉と彼女の返事。',
      said: '男だけだと気づいたあと、男性議員が彼女を外そうとし、彼女は断る。',
      mean: '昔ポーラが話したような扱いが、今もまだ残っている、という流れ。',
      trap: 'rebalance や delicious だけ拾うと別の結末に聞こえる。最後に誰が何を言い切ったかで判断。',
      use: 'I’m not done yet. Let me finish.（まだ終わってない。最後まで言わせて）' },

    // why: teasing the asker ← "next to you" missed, so the compliment seems aimed at the person spoken to; mistakes a
    //   woman for a man ← the right mix-up, the wrong direction
    { id: 'h1', skill: 'humor', level: 'C1', point: 'lady', seg: [120.35, 127.1],
      stem: 'Why does the reply about a “lady” get a laugh?',
      choices: ['His one example of a woman is really a man', 'He is teasing the man he is talking to',
                'He mistakes a woman for a man'], a: 0,
      cue: '「Oh, wait, no」の前とあとを比べて。',
      line: 'There’s *a lady* right next to you. — Oh, wait, no. It’s just *a very beautiful man*.',
      said: '「隣に女性がいる」と言いかけ、「いや、とても美しい男性だ」と言い直す。',
      mean: '女性がいないという指摘への反論が、言い直しで崩れ、指摘の正しさを示してしまう。',
      trap: '先に lady、あとで man の順。Oh, wait, no は自分の言葉を取り消す合図。',
      use: 'Oh, wait, no. That was last week.（あ、違う。それは先週だ）' },

    // R fix: V2 (blind 65 %: the key was the only polite-but-unkind choice); "politely" now in a distractor too
    // why: keep leading ← praise read as trust (the Japanese frame: thanks = you're in charge); asking for help ←
    //   "we'll" heard as including her
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'take', reveals: ['wetake', 'girl'], seg: [129.1, 135.82],
      stem: 'What is Councilman Milton doing with his thanks to Leslie?',
      choices: ['Praising her, then politely pushing her out', 'Thanking her, then asking her to keep leading',
                'Praising her, then politely asking for her help'], a: 0,
      cue: 'ほめ言葉のあと、but で何が来るか。',
      line: 'you did *a great job* setting it up and getting the snacks ready, *but we’ll take it from here*.',
      said: '「準備とお菓子、よくやった。でもここからは我々がやる」と言う。',
      mean: 'take it from here ＝ ここから先は引き受ける。ほめ言葉は外すための前置き。',
      trap: 'ほめられると任されたと思いやすい。but のあとが本題で、we に彼女は入らない。',
      use: 'Thanks, I’ll take it from here.（ありがとう、ここからは自分でやるよ）' },

    // why: you'll ← the same -'ll shape, and "you did a great job" just before puts "you" in the ear; I'll ← one man
    //   is speaking, so "I" seems to fit
    { id: 's2', skill: 'sound', level: 'B2', point: 'wetake', seg: [131.7, 135.82],
      stem: 'Fill the gap: “…but ___ take it from here.”',
      choices: ['we’ll', 'you’ll', 'I’ll'], a: 0,
      cue: '「but」のすぐあと、短く弱い語。',
      line: '…but *we’ll* take it from here.',
      said: '「でも、ここからは我々でやる」。we’ll は弱く「ウィル」に近い。',
      mean: 'we’ll なら男性たちが引き継ぐ。you’ll なら彼女に任せる、で逆の意味。',
      trap: '直前の you did に引かれ、you’ll と聞きやすい。語頭の「ウィ」と「ユ」を聞く。',
      use: 'We’ll handle it from here.（ここからはこちらで対応します）' },

    // why: on "commission" ← she was just sent for snacks, so "real work, not snacks" sounds like the contrast; on
    //   "this" ← Paula's old commission came up earlier, so "this one" seems to be set against it
    // anchor: 134.0 s "we'll take it from here" (the men claim it), then 144.6–146.3 s "No, I don't. This is my
    //   commission": the contrast is whose it is, we against my
    // retired: C2 stress item, until the ear check (the stress on “my” in “This is my commission”)
    { id: 'nt3', skill: 'sound', level: 'C2', point: 'role', reveals: ['wetake', 'take'], seg: [133.25, 147.15], retired: true,
      stem: 'Where is the stress in “This is my commission,” and why?',
      choices: ['On “my”: it belongs to her, not the men', 'On “commission”: real work, not snacks',
                'On “this”: this one, not Paula’s old one'], a: 0,
      cue: '短い一文で、いちばん強く高く聞こえる語。',
      line: '…but *we’ll* take it from here. … No, I don’t. This is *my* commission.',
      said: '男性が「ここからは我々が」と言い、お菓子の用事も断って「これは私の委員会」と言い切る。',
      mean: 'my が強いと「あなたたちのではなく、私の」という対比になる。日本語なら「私の、なの」。',
      trap: '直前のお菓子の話から、仕事の中身の対比と取りやすい。強勢は、相手の言葉の何に言い返しているかで決まる。',
      use: 'It’s not your call. It’s my decision.（決めるのはあなたじゃない、私よ）' },

    // why: hurt and stepping back ← the polite "but" heard as a soft retreat; pleased, so handing over ← "they are
    //   delicious, I must say" taken as the whole answer
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'role', seg: [134.45, 140.15],
      stem: 'How does Leslie take Milton’s thanks?',
      choices: ['Proud of her snacks, but firm about her role', 'Hurt by his words, but willing to step back',
                'Pleased by the praise, so glad to hand it over'], a: 0,
      cue: 'お菓子の話のあと、but で何と言うか。',
      line: 'I *did* put the snacks together, and they are delicious, I must say, but *that is not the point*.',
      said: '「お菓子は確かに私が作ったし、おいしい。でもそこじゃない」と返す。',
      mean: 'ほめ言葉は受け取り、外されることには反対している。not the point が本題。',
      trap: 'delicious で喜んでいるように聞こえる。but のあとに本音が来る。',
      use: 'That’s nice, but that’s not the point.（うれしいけど、そこじゃないの）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'applause', seg: [139.28, 142.38],
      stem: 'Type what Milton calls for: “___ for the girl.” (3 words)', answer: 'round of applause',
      cue: '「not the point」のすぐあと。of は弱い。',
      line: '*Round of applause* for the girl.',
      said: '「この子に拍手を」と呼びかける。',
      mean: 'round of applause ＝ 拍手。of は弱く「ア」程度で、「ラウンダブ」とつながる。',
      trap: 'of がほとんど聞こえず、2語に聞こえやすい。round と applause の間に小さな音を探す。',
      use: 'Let’s give her a round of applause!（彼女に拍手を！）' },

    // R fix: V2 (blind 70 %: "the leader, and the praise is real" was weak); now a keyword trap on "has to leave"
    // why: a guest leaving early ← "she has to leave" heard as her own plan, "to get more snacks" missed; too young ←
    //   girl = 少女, read as a remark on her age
    { id: 'i3', skill: 'infer', level: 'C1', point: 'girl', reveals: ['applause'], seg: [139.28, 145.18],
      stem: 'What does Milton’s applause line show about how he sees Leslie?',
      choices: ['As a helper, and not as the one in charge', 'As a guest, who has to leave early',
                'As too young to sit on the commission'], a: 0,
      cue: '拍手のあと、彼女に何をさせると言うか。',
      line: 'Round of applause for *the girl*. And she has to leave to *get more snacks*.',
      said: '「この子に拍手を。お菓子を買いに退席する」と勝手に決める。',
      mean: '大人の女性を the girl と呼び、お菓子係として送り出す。対等と見ていない。',
      trap: '拍手は敬意に見えるが、次の文で用事を言いつける。ほめ言葉は次の文と合わせて読む。',
      use: 'Please don’t call me “the girl.”（「お嬢ちゃん」と呼ばないで）' },

    // R fix: V2 (blind 60 %: "apologizing" was weak); now the literal reading of "Why so…?" as a real question
    // why: really hurt ← ouch = 痛い, taken literally; asking in earnest ← "Why so…?" read as a real question about
    //   her reasons
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'ornery', seg: [145.15, 149.3],
      stem: 'What is Milton doing when he answers Leslie’s refusal?',
      choices: ['Brushing her point off as a bad mood', 'Admitting that her words really hurt him',
                'Asking in earnest what has upset her'], a: 0,
      cue: '短い一言のあとの、Why so で始まる質問。',
      line: '*Ouch.* Why so *ornery*?',
      said: '「おっと。なんでそんなに不機嫌なの？」と返す。',
      mean: 'ornery ＝ 怒りっぽい、機嫌が悪い。言い分には答えず、気分の問題にしてかわしている。',
      trap: 'Ouch を本当に傷ついたと取りやすい。Why so ～? は理由を聞くより、からかう決まり文句。',
      use: 'Why so serious?（なんでそんな真顔なの？）' },
  ]
};
