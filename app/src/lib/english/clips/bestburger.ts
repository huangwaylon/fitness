// “The Best Burger | Parks and Recreation” (the official Parks and Recreation channel, Season 3): a burger contest at
// work. Chris presents a long, fancy turkey burger, Ron a plain beef one, and the tasters pick Ron's.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 85 s; whisper's repeated "The
// commissary will continue to serve as a hamburger" after 82.9 s is a loop. Speakers are settled by "Kyle" (29.4 s,
// 51.5 s, 54.9 s), "Andy" (53.1 s), "Ron" (42.0 s) and "Chris" (61.3 s); the first taster and the closing announcer
// are never named, so no stem names them. Untested: the cheese (whisper "telégio", captions "tile") and 56–62 s
// ("Oh my God…", "Turkey can never beat cow" from an unnamed taster).
// REVIEW 2026-11-16: pass 9, fix 10, drop 1, new 1; ear checks 1 (unchanged)
// EAR CHECK: 46.6 s p1 — the voice that says “I'm so disappointed” (42–46 s) also says “Never mind. This is better”
//   (47 s); whisper splits them into two segments, the captions don't mark a speaker
import type { Clip } from '../types.ts';

export const bestBurger: Clip = {
  id: 'bestburger', video: 'pNZtLWFXFB8', title: 'The Best Burger', dur: 107, wpm: 184, band: 'fast',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // C2 plain-English paraphrase (mock humility)
    // why: modest ← "humbly" taken at face value (謙遜); a sample ← "place before you" heard as a small offering, a taste
    // anchor: 0.6–12.8 s "humbly" is followed by "my… patented… burger" and a list of luxury ingredients: the humility
    //   is a ceremony, the pride is real
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'humbly', seg: [0, 12.85],
      stem: 'Which plain-English version keeps what Chris means as he presents his burger?',
      choices: ['“Behold my great creation; I’m proud of it.”', '“It’s a modest try, so please go easy on me.”',
                '“This is only a small taste of the full dish.”'], a: 0,
      cue: '最初の控えめな一語と、そのあとに並ぶ言葉の豪華さ。',
      line: 'I *humbly* place before you my East Meets West *patented* turkey burger, an Asian fusion burger…',
      said: '「謹んでお出しします」と始め、特許つきのバーガーだと言い、高級な食材を次々に並べる。',
      mean: 'humbly は儀式のような決まり文句。特許や高級食材の自慢と並ぶと、謙遜ではなく晴れ舞台の宣言になる。',
      trap: '控えめな語を本当の謙遜と取りやすい。控えめな一語のあとに自慢が続いたら、形だけの謙遜を疑う。',
      use: 'I humbly present my famous chili.（自慢のチリを謹んでお出しします）' },

    // R fix: V2, blind 85 %: the key was the only contrast that fit a plain cook. All three now share the first half and
    //   differ only in what the second cook does
    // why: sorry ← Kyle's "Sorry." falls just before "Here's mine", so it's heard as Ron's opener; where it's from ←
    //   "made out of" heard as "made in", an origin like Chris's "Willow Farms"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'pitch', reveals: ['toppings'], seg: [0, 41.2],
      stem: 'How do the two cooks present their burgers?',
      choices: ['One lists every fancy item; the other just says what it is',
                'One lists every fancy item; the other just says sorry for his',
                `One lists every fancy item; the other just says where it’s from`], a: 0,
      cue: '二人の説明の長さを比べて。',
      said: '一人目は産地からパンまで長々と説明し、二人目は「肉をパンに」で終わる。',
      mean: '長い気取った説明と、ひと言の対比が笑いの土台。',
      trap: '直前の Sorry を二人目の言葉、made out of を産地と取りやすい。Here’s mine 以降を聞く。',
      use: 'Long story short, it worked.（要するに、うまくいったよ）' },

    // R fix: V2, blind 60 %: "never smelled the singer" was the only odd, joke-shaped choice. All three are now "has no
    //   idea what…"
    // why: spice ← "guessing" tied to the next line's "Saffron?" guess; which burger ← guessing read as judging before
    //   knowing whose burger it is
    { id: 'h1', skill: 'humor', level: 'C1', point: 'beyonce', seg: [17.2, 22.6],
      stem: 'Why does the first taster’s add-on after his praise get a laugh?',
      choices: ['He has no idea what the star he named smells like', 'He has no idea what the spice he tasted is called',
                'He has no idea which of the two burgers he is eating'], a: 0,
      cue: 'ほめ言葉のすぐあと、短く付け足すひと言。',
      line: 'This tastes as delicious as *Beyoncé smells*. *I’m guessing*.',
      said: '「ビヨンセの香りくらいおいしい」とほめ、「たぶんね」と足す。',
      mean: '大げさなたとえを言ったあと、実はかいだことがないと自分で認めている。その落差が笑い。',
      trap: 'guessing を味の推測と取りやすい。何を推測しているかは、直前の比べた相手で決まる。',
      use: 'It’s worth it, I’m guessing.（たぶん、その価値はあるよ）' },

    // why: wrong ← "Wow" heard as surprise at a silly guess; won't say ← the cook moves on without a yes
    { id: 'i1', skill: 'infer', level: 'B2', point: 'palate', seg: [20.9, 27.5],
      stem: 'After a taster asks what is in the burger, what does the cook’s reply suggest?',
      choices: ['That the taster has guessed right', 'That the taster has guessed wrong',
                'That the cook would rather not say'], a: 0,
      cue: 'Wow のあと、相手の舌をどう言うか。',
      line: 'Saffron? — Wow, somebody’s got a *sharp palate*.',
      said: '「サフラン？」と聞かれ、「わあ、舌が鋭い人がいるね」と返す。',
      mean: 'はっきり yes とは言わないが、ほめることで「当たり」と伝えている。',
      trap: 'Wow を「何それ」という驚きと取りやすい。ほめ言葉が返ってきたら、答えは当たり。',
      use: 'Wow, you’ve got a good eye.（わあ、見る目があるね）' },

    // R fix: V2, blind 55 %: the key was the only negative feeling. Now two "annoyed" readings and an embarrassed one
    // why: turkey ← Kyle has just praised the turkey burger, and "Damn it, Kyle" comes later; embarrassed ← "pretentious"
    //   unknown, and "Sorry" heard as owning a slip with "umami"
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'pretentious', seg: [25.2, 30.9],
      stem: 'How does someone react when Kyle praises the flavor?',
      choices: ['Annoyed that Kyle is being a show-off', 'Annoyed that Kyle likes the turkey one',
                'Embarrassed that Kyle misused a word'], a: 0,
      cue: 'Kyle の名前で終わる文と、その返事。',
      line: '*Stop being so pretentious*, Kyle. — Sorry.',
      said: 'うまみがいいと言った Kyle が「気取るな」と言われ、すぐ謝る。',
      mean: 'pretentious ＝ 通ぶった。通っぽい言葉にいら立っている。',
      trap: 'Stop で不満とは分かっても、理由を七面鳥びいきと取りやすい。理由は pretentious の一語。',
      use: 'Stop showing off.（かっこつけるのはやめて）' },

    // R fix: V2, blind 70 %: the key was the only "nothing". Now two "nothing" readings
    // why: no ketchup ← "with nothing" + "couldn't care less" heard as a ban; already on ← "ketchup" is the only topping
    //   named
    { id: 'd2', skill: 'detail', level: 'B1', point: 'toppings', reveals: ['meat'], seg: [30.6, 40.8],
      stem: 'What comes on Ron’s burger?',
      choices: ['Nothing; you can add ketchup yourself', 'Nothing; he won’t allow ketchup on it',
                'Just ketchup, which he’s put on already'], a: 0,
      cue: 'bun のあとの一語と、次の文。',
      line: 'a hamburger made out of meat on a bun *with nothing*. *Add ketchup if you want*.',
      said: '「肉をパンにはさんだだけ。ケチャップは好きにかけて」。',
      mean: 'with nothing ＝ 何ものせていない。豪華なバーガーとの差を一言で示す。',
      trap: 'ketchup でかかっている、否定語で禁止と取りやすい。if you want は「お好みで」。',
      use: 'A coffee with nothing in it, please.（何も入れないコーヒーをください）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'meat', seg: [31.8, 36.9],
      stem: 'Type what Ron says: “It’s a hamburger ___ on a bun.” (4 words)', answer: 'made out of meat',
      cue: 'hamburger のすぐあと、bun の前まで。',
      line: 'It’s a hamburger *made out of meat* on a bun with nothing.',
      said: '「肉でできたバーガーを、パンにのせただけ」。',
      mean: 'made out of ＝ 〜でできた。made‿out‿of がつながって「メイダウラヴ」のように聞こえる。',
      trap: 'out の t が弾み of も弱いので、2語ほどに聞こえやすい。語数は意味で数える。',
      use: 'It’s made out of paper.（紙でできています）' },

    // R fix: V2, blind 85 %: "matters a great deal" was a filler. Now a reluctant yes and a recommendation
    // why: reluctant ← "if you want" read as 遠慮 permission (どうぞ… but); suggests ← the bare "Add ketchup" heard as
    //   advice
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'care', seg: [36.8, 40.8],
      stem: 'How does Ron feel about whether you add ketchup?',
      choices: ['It makes no difference to him at all', 'He’d rather you didn’t, but allows it',
                'He suggests adding some for the taste'], a: 0,
      cue: 'ketchup の文のあと、care を含む短い文。',
      line: 'Add ketchup if you want. *I couldn’t care less*.',
      said: '「ケチャップはお好みで。どうでもいい」。',
      mean: 'これ以上気にしないことはできない、つまり全くどうでもいい。',
      trap: 'if you want を遠慮がちな許可と取りやすい。couldn’t care less は決まった形。',
      use: 'Honestly, I couldn’t care less.（正直、全然気にしないよ）' },

    // R drop: s1 (V2, blind 55 %): "couldn't care less" is the textbook idiom, so the gap was answered without
    //   listening, and f2 already tests the line. Replaced by s2 on "will continue" (79 s)

    // R fix: V2, blind 50 %: "add some toppings" was weak; the new one hangs on "you and I". V4: the reason is stated
    //   ("I thought…"), so it's a detail, not an attitude
    // why: mocking ← Ron's "couldn't care less" heard as a jab at the fancy burger; team up ← "you and I were gonna
    //   have…" heard as a plan together
    { id: 'a2', skill: 'detail', level: 'B2', point: 'disappoint', seg: [41.4, 46.6],
      stem: 'Why does Ron’s rival say he’s disappointed?',
      choices: ['He expected Ron to be a tougher rival', 'He feels Ron is mocking his burger',
                'He hoped the two of them would team up'], a: 0,
      cue: 'I thought のあと、何を期待していたか。',
      line: 'Ron, I’m so disappointed. I thought that you and I were going to have *a real challenge*.',
      said: '「がっかりだよ。君とはいい勝負になると思っていたのに」。',
      mean: '何ものせないバーガーを見て、相手にならないと見下している。',
      trap: 'you and I から協力の話と取りやすい。期待の中身は a real challenge。',
      use: 'I thought this would be harder.（もっと難しいと思ってた）' },

    // why: forget the contest ← never mind = 気にしないで, read as a word to Ron; next burger ← "this is" heard as
    //   pointing to something new
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'nevermind', reveals: ['winner'], seg: [41.4, 49.3],
      stem: 'Seconds after that complaint, what does the next line do?',
      choices: ['It takes the complaint back', 'It tells Ron to forget the contest',
                'It moves on to the other burger'], a: 0,
      cue: 'がっかりのあと、文頭の二語。',
      line: '*Never mind*. This is better. Way better.',
      said: 'がっかりと言った直後に「やっぱりいい。こっちがうまい」と言う。',
      mean: 'Never mind ＝ 今の発言は取り消し。食べてみて、評価がひっくり返った。',
      trap: '「気にしないで」と相手への言葉に取りやすいが、自分の発言を消す働きもある。',
      use: 'Never mind, I found it.（やっぱりいい、見つかった）' },

    // R fix: V2, blind 90 %: "end up preferring" pointed to the surprise winner. The stem now asks how it turns out, and
    //   two choices share the winner, so the cook's reaction decides. N7: the line showed "Sorry, Andy" (w1's key)
    // why: angry ← "Damn it, Kyle" taken as the losing cook's; fancy wins ← early praise ("delicious", "umami") and
    //   Ron's "couldn't care less" carried over to the end
    { id: 'g1', skill: 'gist', level: 'B1', point: 'winner', seg: [41.4, 72],
      stem: 'How does the tasting turn out?',
      choices: ['The plain one wins, and the fancy cook is puzzled', 'The plain one wins, and the fancy cook gets angry',
                'The fancy one wins, and the plain cook doesn’t care'], a: 0,
      cue: '試食のあとの評価と、作り手の最後の反応。',
      line: '*Ron’s is better*. … *I don’t understand*.',
      said: '試食した人たちが「こっちがいい」と言い、七面鳥の作り手は首をかしげる。',
      mean: '何ものせない牛肉のバーガーが、手のこんだバーガーに勝つ。',
      trap: 'Damn it を負けた作り手の怒りと取りやすい。本人は I don’t understand と戸惑う。',
      use: 'Simple is better.（シンプルが一番）' },

    // why: Chris ← his burger is the one that lost, so an apology seems owed to him; Ron ← the winner's name comes
    //   right after "sorry"
    { id: 'w1', skill: 'who', level: 'B1', point: 'sorry', seg: [50.9, 56],
      stem: 'When Kyle gives his choice, who does he apologize to?',
      choices: ['Andy', 'Chris', 'Ron'], a: 0,
      cue: 'Sorry のすぐあとの名前。',
      line: '*Sorry, Andy*. Ron’s is better.',
      said: '名前を呼ばれた Kyle が「ごめん、アンディ。ロンのほうがうまい」と答える。',
      mean: '謝る相手は名前で分かる。負けた料理人ではなく、質問した相手に謝っている。',
      trap: '負けた側に謝ると思いやすいが、sorry の直後の名前が謝る相手。そのあとの名前は勝者。',
      use: 'Sorry, Mom. I forgot.（ごめん、お母さん。忘れてた）' },

    // why: Chris lost ← the polite frame: sorry to the loser; slow ← a pause before "Kyle" answers reads as hesitation
    { id: 'i2', skill: 'infer', level: 'C1', point: 'sorry', seg: [50.9, 56],
      stem: 'Judging by the reply he gets, what lies behind Kyle’s apology?',
      choices: ['His pick isn’t the one Andy hoped for', 'He feels bad that Chris’s burger lost',
                'He took too long to give his answer'], a: 0,
      cue: '謝る相手の名前と、そのあとの返事。',
      line: 'Sorry, Andy. Ron’s is better. — *Damn it, Kyle*.',
      said: '「ごめん、アンディ。ロンのほうがうまい」と言うと、「くそっ、カイル」と返される。',
      mean: '謝るのは、相手の望まない答えを言うから。返事の舌打ちで、それが当たっていたと分かる。',
      trap: '負けた料理人に気をつかったと取りやすいが、謝っている相手と、その反応を聞く。',
      use: 'Sorry, but I have to say no.（悪いけど、断らなきゃ）' },

    // why: weeks / months ← "a long time" just after, and "years" is short and falls at the end
    { id: 'n1', skill: 'number', level: 'B1', point: 'years', seg: [63, 67.75], keep: true,
      stem: 'How long has Chris been working on his recipe?',
      choices: ['For weeks', 'For months', 'For years'], a: 2,
      cue: 'recipe のすぐあと、for に続く語。',
      line: 'I’ve tinkered with this recipe *for years*.',
      said: '「このレシピは何年もいじってきたのに」と言う。',
      mean: 'for years ＝ 何年も。長く手をかけたのに負けた、という嘆き。',
      trap: '語尾の years は短く弱い。すぐあとの a long time とは別の話なので、混ぜずに聞く。',
      use: 'I’ve lived here for years.（もう何年もここに住んでいます）' },

    // R fix: V2, blind 60 %: the key was the only reading that fit "for years… and lost". Now a near sound and a
    //   same-every-time reading
    // why: thinking ← tinker ≈ think, the t/th pair; same way ← "for years" + a long-kept recipe heard as tradition
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'tinker', reveals: ['years'], seg: [63, 67.75],
      stem: 'What has Chris been doing with his recipe for years?',
      choices: ['Making small changes, bit by bit', 'Thinking about it now and then', 'Making it the same way each time'], a: 0,
      cue: 'I’ve のあとの動詞。',
      line: 'I’ve *tinkered with* this recipe for years.',
      said: '「何年もこのレシピをいじってきた」と言う。',
      mean: 'tinker with ＝ 少しずつ手を加える・いじる。機械やレシピの改良によく使う。',
      trap: 'tinker を think と聞いたり、長年のレシピを「伝統の味」と取ったりしやすい。動詞の意味から考える。',
      use: 'He’s always tinkering with his bike.（彼はいつも自転車をいじってる）' },

    // R fix: V2, blind 55 %: "never followed his recipe" was weak. The new one is a scope shift (his own burger)
    // why: own burger ← "since I've had a…" heard as about his own cooking; always preferred ← "hamburger" + a loser's
    //   confession script
    { id: 'i3', skill: 'infer', level: 'C1', point: 'granted', reveals: ['years', 'tinker'], seg: [63, 72],
      stem: 'What does Chris’s last admission suggest about how he lost?',
      choices: ['He had forgotten what a real burger tastes like', 'He had not tasted his own burger in ages',
                'He had always secretly preferred beef burgers'], a: 0,
      cue: 'Granted で始まる文の中身。',
      line: '*Granted*, it’s been *a long time since I’ve had a hamburger*.',
      said: '何年も工夫したと言ってから「まあ、ハンバーガーは長く食べてないけど」と認める。',
      mean: '比べる相手の味を忘れたまま作っていた、と本人が気づいた瞬間。',
      trap: 'hamburger から「本当は好き」、自分の料理の話と取りやすい。何を食べていないかを聞く。',
      use: 'Granted, I haven’t tried it yet.（まあ、まだ試してはいないけど）' },

    // C2 dict: four weak words that a grammar instinct "fixes" to "since I had a"
    // anchor: 69.2–69.7 s "since I’ve had a" in about half a second, both sources agreeing, then a pause before
    //   "hamburger"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'granted', seg: [67.4, 72],
      stem: 'Type the words: “It’s been a long time ___ hamburger.” (4 words)', answer: "since i've had a",
      cue: 'long time のすぐあと。小さな語も全部。',
      line: 'Granted, it’s been a long time *since I’ve had a* hamburger.',
      said: '「ハンバーガーは長いこと食べてない」。4語が半秒ほどにつまる。',
      mean: 'it’s been … since のあとは現在完了がふつう。’ve は弱く、had とくっつく。',
      trap: '’ve が聞こえず since I had a と書きやすい。文の形から現在完了を予想して聞く。',
      use: 'It’s been ages since I’ve seen you.（会うのはすごく久しぶりだね）' },

    // R fix: V2, blind 75 %: "both kinds" was a filler. Now a healthier-burger reading of "artery-clogging"
    // why: turkey ← the cook who lost seems to be the one announcing; healthier ← "artery-clogging" heard as a health
    //   complaint that leads to a change
    { id: 'd3', skill: 'detail', level: 'B1', point: 'commissary', reveals: ['winner'], seg: [77.3, 86],
      stem: 'At the end, what will the commissary keep doing?',
      choices: ['Serving the same hamburgers as now', 'Serving healthier hamburgers instead', 'Serving the new turkey burger'], a: 0,
      cue: 'will continue to serve のあとの名詞。',
      line: 'The commissary will continue to serve horrifying, artery-clogging *hamburgers*.',
      said: '「食堂は今後も、恐ろしい、動脈が詰まるハンバーガーを出します」と発表する。',
      mean: 'continue to ＝ これまで通り続ける。メニューは変わらない。',
      trap: 'artery-clogging から「変える」と思いやすい。動詞 continue は今のまま。',
      use: 'We will continue to offer free Wi-Fi.（無料Wi-Fiは引き続きご利用いただけます）' },

    // why: pleased ← the hamburgers "continue", a happy-ending reading; defiant ← the harsh adjectives heard as a refusal
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'commissary', seg: [77.3, 86],
      stem: 'In the closing announcement, how does the speaker feel about the result?',
      choices: ['Resigned: they stay, though he finds them awful', 'Pleased: the burgers he likes get to stay',
                'Defiant: he plans to stop serving them soon'], a: 0,
      cue: 'hamburgers の前に付いた二つの形容詞。',
      line: 'will continue to serve *horrifying, artery-clogging* hamburgers.',
      said: '結果どおりハンバーガーを出し続けると発表しつつ、「恐ろしい」「動脈が詰まる」と付ける。',
      mean: '約束は守るが、気持ちは不満。形容詞に本音が出ている。',
      trap: 'ひどい形容詞から「出さない」と取りやすいが、動詞は continue。決定と気持ちを分けて聞く。',
      use: 'Fine, we’ll do it your way.（分かった、君のやり方でやろう）' },

    // R new: s2 replaces s1 (id not reused). Blind (fresh): "horrifying, artery-clogging" pulls a reader to "won't", 30 %, wrong
    // why: won't ← the harsh adjectives sound like a ban, and will/won't differ by one vowel; would ← "will" is weak
    //   and short, a conditional reading
    { id: 's2', skill: 'sound', level: 'B2', point: 'commissary', seg: [78.4, 85.6],
      stem: 'Fill the gap: “The commissary ___ continue to serve…”',
      choices: ['will', 'won’t', 'would'], a: 0,
      cue: 'commissary のすぐあと、短い助動詞。',
      line: 'The commissary *will* continue to serve horrifying, artery-clogging hamburgers.',
      said: '「食堂は今後もハンバーガーを出し続けます」。',
      mean: 'will は弱く「ウォ」に近い短い音。won’t なら母音が「ウォウ」と伸び、最後に n が残る。',
      trap: 'ひどい形容詞が続くので won’t と思いやすい。意味でなく母音の長さと n を聞く。',
      use: 'The store will stay open late.（お店は遅くまで開いています）' },
  ]
};
