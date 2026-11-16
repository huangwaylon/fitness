// “Ron Deals With A "Beef Milk" Influencer | Parks and Recreation” (the official Parks and Recreation channel, Season
// 7): Gryzzl's slang-talking team asks the locals for a celebrity to back its bid, Ron wants none of it, and the pick,
// lifestyle guru Annabelle Porter, wins the room by selling plain milk as "beef milk" for $60 a gallon.
// Segments from the captions, words from whisper (2026-11-16). The sources differ on several slang words ("frack your
// brainiums" / "frac uraniums" at 52.6 s, "chums"/"chumps" at 23 s, "Blush"/"blue" at 98.7 s, "I'd"/"it'd" be jazzed at
// 181.8 s) and on the names Tom reads at 83.7–86 s; no key rests on them, and lines leave them out. Left out on purpose:
// the Jay-Z / Chick-fil-A lines (35.7–43.8 s; world knowledge, and "can't help" reads against its own examples), the
// "Pulitzer" joke (world knowledge), and the signing gag at 225–233 s (shown, not said).
// REVIEW 2026-11-16: pass 4, fix 19, drop 1, new 1; ear checks 1
// R drop: s1 ("I ___ but ask"): "can't help but" is a set phrase that fills itself, and "can help but" / "can't tell
//   but" don't fit the gap (§9.5). Replaced by s2 ("Shall we").
// EAR CHECK: 179.7 s nt1 — “This woman knows business” is sincere admiration (dry, but not a dig); the key also stands on
//   the words (it follows the $3/$60 gap and the wait list)
import type { Clip } from '../types.ts';

export const beefMilk: Clip = {
  id: 'beefmilk', video: 'N4B4ELSyDJg', title: 'Ron Deals With A “Beef Milk” Influencer', dur: 254, wpm: 153,
  band: 'slow',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %): the job-offer choice didn't fit the title; all three now "get ideas" for something, and one
    //   is an ad campaign (the usual celebrity script)
    // why: help Leslie ← "Leslie Knope… presentation" is the first name heard, in the wrong relation (she's the rival);
    //   ad campaign ← celebrity = ads, the usual script; "As a minority owner" settles it
    { id: 'g1', skill: 'gist', level: 'B2', point: 'celeb', reveals: ['britty'], seg: [0, 57.9],
      stem: 'Why has Gryzzl’s team called in the locals?',
      choices: ['To get ideas for a local star to back their bid', 'To get ideas to help Leslie’s presentation',
                'To get ideas for their first local ad campaign'], a: 0,
      cue: '若者言葉のあと、言い直す人の一言。',
      said: 'Leslie が発表を強化しているので、こちらも地元の有名人を味方につけたい、と話す。',
      mean: '入札で勝つための作戦会議。地元の人に有名人の案を出してほしい。',
      trap: '最初に Leslie の名前が出るが、彼女はライバル。有名人＝広告と決めず、役割の語を聞く。',
      use: 'We need some local help on this.（この件は地元の協力が要る）' },

    // why: formal ← "vice president" heard as a stiff title; shy ← the "I am… I am…" restart heard as nerves; "kick back"
    //   and "break out your vapes" settle it
    // R fix: V2 (blind 75 %): reworded to three short, parallel stances
    { id: 'a0', skill: 'attitude', level: 'B1', point: 'roscoe', seg: [1.26, 10.3],
      stem: 'How does Roscoe come across as he opens the meeting?',
      choices: ['Eager to seem cool and relaxed', 'Eager to show he’s in charge', 'Nervous about the big meeting'], a: 0,
      cue: '肩書きの言い方と、最後の「kick」のあと。',
      line: 'I am vice president of *Cool New Shiz*… *break out your vapes and just kick back*.',
      said: '「イケてる新しいモノ担当の副社長。電子タバコでも吸ってくつろいで」と言う。',
      mean: '肩書きも誘い方もくだけている。かっこよく、ゆるく見せたい人。',
      trap: 'vice president だけ聞くと堅い人に思えるが、肩書きの中身はふざけている。',
      use: 'Make yourself at home. Kick back.（楽にして、くつろいでね）' },

    // R fix: V2 (blind 55 %): all three are now "Make it more …"
    // why: romantic ← sexy taken literally (セクシー); to the point ← "sexy up" heard as "sum up"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'sexyup', seg: [10.3, 15.65],
      stem: 'What does Roscoe say Leslie is trying to do to her presentation?',
      choices: ['Make it more appealing', 'Make it more romantic', 'Make it more to the point'], a: 0,
      cue: '「try to」のあと、up で終わる部分。',
      line: 'to try to *sexy up* her presentation.',
      said: '「Leslie は発表を魅力的にしようと、人に会って回っている」と言う。',
      mean: 'sexy up ＝ 見栄えよく、ワクワクするものにする。色っぽさとは無関係。',
      trap: 'カタカナの「セクシー」で取ると恋愛の話に聞こえる。仕事の場では「魅力的に」。',
      use: 'Let’s sexy up this menu a little.（このメニュー、少し華やかにしよう）' },

    // R fix: V2 (blind 75 %) and S1: the stem's "idea session" pointed at "brainstorm", and the real-storm choice was a
    //   filler. It's now a slip of the tongue, against the team's deliberate slang
    // why: a mess ← tornado = destruction, so "our ideas were chaos"; a slip ← a weather word swapped by mistake, but
    //   the whole team talks like this on purpose ("Cool New Shiz", "peep this")
    { id: 'h1', skill: 'humor', level: 'C1', point: 'tornado', seg: [10.3, 18.05],
      stem: 'Why does Roscoe say they had a “brain tornado”?',
      choices: ['He hypes up “brainstorm” to sound cool', 'He admits the ideas came out a mess',
                'He mixes up two weather words by mistake'], a: 0,
      cue: 'far out のあとの二語。よく聞く「頭の嵐」の言い方と比べて。',
      line: 'So we had this *far-out brain tornado*.',
      said: '「ぶっとんだブレイン・トルネードをやってさ」と言う。',
      mean: 'brainstorm（話し合い）を tornado に格上げした造語。かっこつけた言い方が笑い。',
      trap: 'tornado を「めちゃくちゃ」や言いそこないと取りやすい。周りも同じ調子の造語だらけ。',
      use: 'Let’s brainstorm some ideas.（アイデアを出し合おう）' },

    // why: British person ← "britty" heard as "Brit"; pretty girl ← "britty" ≈ "pretty" (b/p); the next speaker's
    //   "We need a celebrity" settles it
    // R fix: V2 (blind 75 %): added "a rich investor" ("minority owner" follows), a strong fourth
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'britty', reveals: ['celeb'], seg: [18.95, 28.38],
      stem: 'What is “a britty”, judging from the line right after it?',
      choices: ['A celebrity', 'A British person', 'A pretty girl', 'A rich investor'], a: 0,
      cue: '次の人が、同じことを普通の言葉で言い直す。',
      line: 'We should get *a britty* to come kick it with us… — We need *a celebrity*.',
      said: '「ブリティを呼ぼう」に、次の人が「有名人が要る」と言い直す。',
      mean: 'britty は celebrity を縮めた若者言葉。分からない語は、次の言い直しで分かる。',
      trap: 'Brit や pretty に聞こえやすい。知らない語は、すぐあとの言いかえを待つ。',
      use: 'In other words, we need a celebrity.（つまり、有名人が要るってこと）' },

    // why: spokesperson ← the usual celebrity ad script; judge ← "bid" heard as a contest someone decides
    { id: 'd1', skill: 'detail', level: 'B2', point: 'minority', seg: [24.32, 28.38],
      stem: 'How would the celebrity help, according to the plan?',
      choices: ['By owning a small share, adding weight to the bid', 'By starring in ads, so Gryzzl sells more phones',
                'By judging the bids, and picking Gryzzl as winner'], a: 0,
      cue: '「As a」のあと、owner の前の語。',
      line: '*As a minority owner*, it’ll *strengthen* Gryzzl’s *bid*.',
      said: '「少数株主として加われば、Gryzzl の入札が強くなる」と言う。',
      mean: 'minority owner ＝ 一部だけ出資する持ち主。名前を出すことで入札に重みが出る。',
      trap: '有名人と聞くと広告を思い浮かべやすい。as a のあとに役割がはっきり出ている。',
      use: 'She owns a small share of the team.（彼女はチームの一部を持っている）' },

    // why: can't write cursive ← "refuse" missed, heard as an admission; mocking Roscoe ← "flash" aimed at the
    //   flashy visitor; the joke is the tiny "proof"
    // R fix: V2 (blind 75 %): the key was the only abstract choice; shortened and evened out
    { id: 'h2', skill: 'humor', level: 'C1', point: 'cursive', seg: [28.38, 35.66],
      stem: 'Why is the reply about signing in cursive funny?',
      choices: ['A tiny habit is his proof of a big value', 'He admits he can’t write in cursive at all',
                'He takes a dig at the visitors’ flashy style'], a: 0,
      cue: '「quality over flash」のあと、That’s why の理由。',
      line: 'I prefer *quality over flash*. *That’s why I refuse* to write my signature in cursive.',
      said: '「派手さより中身。だからサインも筆記体では書かない」と言う。',
      mean: '大きな信条の証拠が、サインの書き方という小さすぎる話。その落差が笑い。',
      trap: 'refuse を聞き落とすと「書けない」告白に聞こえる。That’s why の前後の大きさを比べる。',
      use: 'I prefer quality over quantity.（量より質が好きなんだ）' },

    // why: too costly ← the usual reason to want a small, local name; Leslie signed one ← "Leslie" is the rival named
    //   earlier, in the wrong relation
    // R fix: V2 (blind 70 %): the key was the only kind reason; all three are now "A local face would…"
    // why: cheaper ← the usual reason to want a small, local name; rules require ← "here in Pawnee" heard as a
    //   condition of the bid
    { id: 'd2', skill: 'detail', level: 'B1', point: 'outsider', seg: [43.28, 50.05],
      stem: 'Why does Gryzzl want a celebrity from Pawnee in particular?',
      choices: ['A local face would put the town at ease', 'A local face would cost far less money', 'A local face is what the town’s rules require'], a: 0,
      cue: '「Exactly」のあと、Gryzzl を何と呼ぶか。',
      line: 'Gryzzl is *an outsider* here in Pawnee, so a local celebrity is gonna make everyone *feel more at ease*',
      said: '「Gryzzl はよそ者だから、地元の有名人がいれば皆が安心する」と言う。',
      mean: 'outsider ＝ よそ者。地元の顔を立てて、警戒を解きたい。',
      trap: 'お金や決まりの話はここでは出ない。so の前が理由、後ろが狙い。',
      use: 'As a newcomer, I feel like an outsider.（新参者なので、よそ者の気分です）' },

    // why: wants it explained ← "I got it" heard as a question or a request; praise ← "from context" heard as admiring
    //   the clever slang; the cut-off "ideas—" settles it
    // R fix: V2 (blind 70 %): "praises the slang" was weak; it's now "only half got it" ("from context" = a guess)
    // why: slower ← "I got it" heard as a request; half got it ← "from context" read as "I only guessed"; the cut-off
    //   "ideas—" settles it
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'context', reveals: ['celeb'], seg: [50.05, 58.7],
      stem: 'When someone starts to explain the slang, what does the reply do?',
      choices: ['It stops a recap that he didn’t need', 'It asks for the recap to go slower', 'It admits he only half got the slang'], a: 0,
      cue: '説明が途中で切れたところの一言。',
      line: 'Since we’re locals, they want us to think of ideas— — *I got it from context.*',
      said: '「地元だから案を出してほしいって…」と言いかけたところで、「文脈で分かった」とさえぎる。',
      mean: '「説明は要らない」というそっけない合図。言い直しを止めている。',
      trap: 'I got it を質問やお願いと取りやすい。相手の言葉が途中で切れたら、さえぎりの印。',
      use: 'It’s okay, I got it.（大丈夫、分かったから）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'context', seg: [55.76, 58.7],
      stem: 'Type the reply: “I ___ context.” (3 words)', answer: `got it from`,
      cue: '説明が切れたすぐあと。I から context まで。',
      line: 'I *got it from* context.',
      said: '「文脈で分かったよ」と言う。三語が一続きに聞こえる。',
      mean: 'got it の t が弾み「ガリッ」、it from がつながって「ガリフロム」に近い。',
      trap: 'got と it が一つになり、got from と書きやすい。間の小さな it を拾う。',
      use: 'I got it from my mom.（母からもらったの）' },

    // R fix: V2 (blind 75 %): the key was the only animal you'd never call a celebrity; now all three are animals
    // why: hunting dog ← "took a shot" heard first, so an animal at his side; a prize bull ← "bull" heard without
    //   "elk"; "the five-by-five bull elk I saw near my cabin" settles it
    { id: 'h3', skill: 'humor', level: 'C1', point: 'elk', seg: [61.8, 76.05],
      stem: 'What makes Ron’s list of the celebrities he recognizes funny?',
      choices: ['They’re a furniture maker and an elk he once saw', 'They’re a furniture maker and his old hunting dog',
                'They’re a furniture maker and a prize bull he owns'], a: 0,
      cue: '二人目の名前のすぐあと、何と説明するか。',
      line: 'furniture maker Gary Knox Bennett… and *Magnus, the five-by-five bull elk* I saw near my cabin',
      said: '「私が知る有名人は家具職人と、小屋の近くで見たオスのヘラジカのマグナスだけ」と言う。',
      mean: '有名人の例が、職人と一頭の野生動物。彼の価値観がそのまま出た答え。',
      trap: 'bull だけ聞くと牛、shot だけだと猟犬に取りやすい。名前の直後の説明が正体。',
      use: 'I don’t really follow celebrities.（有名人にはあまり興味がない）' },

    // why: admiration ← he just listed Magnus as a "celebrity" he respects; fear ← the antlers through his shed door
    // R fix: V2 (blind 70 %): reworded so the key isn't the only vivid choice
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'magnus', seg: [79.6, 83.65],
      stem: 'When Ron speaks directly to Magnus, what feeling comes through?',
      choices: ['A grudge he swears he will settle', 'Fond respect for a fine animal', 'Worry the elk will come back'], a: 0,
      cue: '「One day」で始まる一文の最後の語。',
      line: '*One day*, Magnus, *I will wear you as a jacket*.',
      said: '「いつか、マグナス、お前を上着にしてやる」と言う。',
      mean: 'One day ＋ I will ～ は宣戦布告の型。小屋を壊された恨みを晴らすという誓い。',
      trap: '直前に「有名人」と呼んだので尊敬に聞こえやすい。上着にする、は敬意ではない。',
      use: 'One day, I’ll beat you.（いつか絶対に勝ってやる）' },

    // why: a friend's joke ← the polite "I don't know if you can consider me…" heard as real surprise; left himself off
    //   ← "handwriting" heard as "he wrote the list", without his name on it
    // R fix: V2 (blind 65 %): evened out; all three are now about who wrote what
    { id: 'i2', skill: 'infer', level: 'C1', point: 'handwriting', seg: [87.2, 92.78],
      stem: 'What does the reply “Yeah, that’s your…” reveal about Tom?',
      choices: ['He wrote his own name on the list', 'A friend wrote his name in as a joke', 'He wrote the list, but not his name'], a: 0,
      cue: 'Tom の謙遜のあと、返事の最後の語。',
      line: 'I don’t know if you can really *consider me a celebrity*. — Yeah, *that’s your handwriting*.',
      said: 'Tom が「僕が有名人だなんて」と謙遜すると、「それ、お前の字だろ」と返される。',
      mean: '名簿に自分の名前を書いたのは本人。謙遜はうわべだけ、とばれた。',
      trap: '謙遜を本気と取ると「誰かのいたずら」に聞こえる。字が誰のものかで決まる。',
      use: 'Don’t be modest. You wrote it.（謙遜しないで。君が書いたんでしょ）' },

    // R fix: V2 (blind 85 %): "richest company" didn't fit "who"; it's now the "go after" reading (a rival to chase)
    // why: seafood ← "fish" taken literally; toughest rival ← "go after" heard as "go up against"; the name that
    //   follows, the person they want on their side, settles it
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'bigfish', seg: [92.78, 98.55],
      stem: 'Who is “Pawnee’s biggest fish”?',
      choices: ['The best-known person in town', 'The best seafood place in town', 'The toughest rival in town'], a: 0,
      cue: 'fish のすぐあとに出る名前。',
      line: 'we need to go after *Pawnee’s biggest fish*, Annabelle Porter',
      said: '「狙うなら町いちばんの大物、アナベル・ポーターだ」と言う。',
      mean: 'big fish ＝ 大物、影響力のある人。その場の文脈では一番有名な人。',
      trap: 'fish を文字通り取ると魚の店、go after を「対決」と取るとライバルに聞こえる。直後の人名が答え。',
      use: 'He’s a big fish in a small pond.（小さな世界の大物だね）' },

    // why: scared to meet her ← "nightmare" taken literally, as fear; jealous ← her success ("biggest fish") read as
    //   envy
    // R fix: V2 (blind 70 %): "scared to meet her" is now "nervous she'll turn them down" ("she's a big deal" follows)
    // why: nervous ← "nightmare" taken as worry, with "big deal" right after; envy ← her success ("biggest fish") read
    //   as envy
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'nightmare', seg: [98.55, 106.5],
      stem: 'How does Ron feel about Annabelle Porter?',
      choices: ['He can’t stand her or what she makes', 'He’s nervous she’ll turn them down', 'He envies how famous she has become'], a: 0,
      cue: '「Forget it」のあと、その人を何と呼ぶか。',
      line: 'That *horrifying* lifestyle newsletter… *Forget it.* That woman is *my nightmare*.',
      said: '「あのぞっとする生活情報誌か。お断りだ。あの女は悪夢だ」と言う。',
      mean: 'nightmare ＝ 最悪の存在。怖いのではなく、心から嫌いだということ。',
      trap: 'nightmare を「怖い」と取りやすい。Forget it と並ぶと強い拒否。',
      use: 'Traffic here is a nightmare.（ここの渋滞は最悪だ）' },

    // why: Ron walks out ← his "my nightmare" and the "Ron!" called at the end; she turns them down ← "Leslie" as the
    //   rival who might have her; "extremely jazzed to be part of the Gryzzl bid" settles it
    // R fix: V2 (blind 70 %) and K6: the key was the only three-part choice; shortened and evened out
    { id: 'g2', skill: 'gist', level: 'B2', point: 'visit', reveals: ['price'], seg: [114.4, 187.6],
      stem: 'How does the visit to Annabelle turn out?',
      choices: ['She wins them over and says she’s in', 'Ron walks out, and the deal falls apart', 'She says no, as she’s backing Leslie'], a: 0,
      cue: '訪問の最後、彼女が自分から言う一文。',
      said: '気取った流行話に引きつつも、高い牛乳の商売に感心し、彼女も「ぜひ参加したい」と言う。',
      mean: '嫌っていた相手が、商売の腕で場を味方につけた流れ。',
      trap: 'Ron の「悪夢」や最後の呼びかけで決裂に聞こえやすいが、彼女は乗り気。',
      use: 'I’d love to be part of it.（ぜひ参加させてください）' },

    // why: warm forgiveness ← "Apology accepted" taken at face value (the お礼・許し frame); asks about the forks ← "anything
    //   else you said" heard as a question about it
    // R fix: V2 (blind 70 %): all three now accept the apology and differ in what follows
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'apology', seg: [120.95, 133.15],
      stem: 'What does the reply beginning “Apology accepted” do?',
      choices: ['Accepts the apology, but ignores all the rest', 'Accepts the apology, and forgives her warmly', 'Accepts the apology, and asks about the forks'], a: 0,
      cue: '「accepted」のあとに続く部分。',
      line: 'I’m sorry I’m late… — *Apology accepted*. And then *I have no reaction to anything else you said*.',
      said: '遅刻のおわびと気取った話に「謝罪は受け取る。残りには反応なし」と返す。',
      mean: '礼儀の部分だけ受け取り、自慢話は無視すると宣言する、冷たい返し。',
      trap: 'Apology accepted だけなら優しい許し。and then のあとで、残りを切り捨てている。',
      use: 'Apology accepted. Let’s move on.（謝罪は受け取った。先に進もう）' },


    // R fix: V2 (blind 75 %): "soaking beef in water" was a filler; it's now "cows fed on almonds", built from both
    //   halves of the description
    // why: beefy almond milk ← "almond milk" is the first thing in the description (the keyword trap); fed on almonds ←
    //   "almond milk" + "living cows" joined the wrong way; "squeezed through tiny holes in living cows" is milking
    { id: 'i3', skill: 'infer', level: 'C1', point: 'beefmilk', seg: [150.0, 163.6],
      stem: 'From the description, what is “beef milk” really?',
      choices: ['Plain cow’s milk under a new name', 'Almond milk with a beefy flavor', 'Milk from cows fed on almonds'], a: 0,
      cue: '「squeezed through」のあと、どこから出てくるか。',
      line: 'It’s like almond milk that’s been *squeezed through tiny holes in living cows*.',
      said: '「アーモンドミルクみたいなもので、生きた牛の小さな穴からしぼり出したもの」と説明する。',
      mean: '牛からしぼるなら、ただの牛乳。新しい名前で売っているだけ。',
      trap: '最初の almond milk に引かれやすい。説明の最後に正体が来る。',
      use: 'So it’s basically just milk.（つまり、ただの牛乳だよね）' },

    // why: orders some ← "Milk." heard as a request, the café script; stunned ← the long pause heard as speechless
    //   shock, the one word as nothing more
    // anchor: 163–166.8 s a long silence, then "Milk." and at once "No, no. Milk costs three dollars a gallon… beef milk…
    //   sixty": the "No, no" answers a claim that it is only milk
    // R fix: V2 (blind 65 %): "plain old" marked the key; the three are now plain, parallel acts
    // retired: one C2 alone is under 2 (nt1 retired)
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'beefmilk', reveals: ['price'], seg: [159.8, 176.7], retired: true,
      stem: 'After the long pause, what does the one-word reply “Milk.” do?',
      choices: ['It sums up what the drink really is', 'It asks to try a glass of the drink',
                'It shows he’s too stunned to say more'], a: 0,
      cue: '一語のあとの「No, no」が、何に反論しているか。',
      line: '*Milk.* — *No, no.* Milk costs three dollars a gallon…',
      said: '長い沈黙のあと「牛乳だな」と一言。すぐ「違う、牛乳は3ドル、これは60ドル」と返される。',
      mean: '一語で「要するに牛乳」と正体を言いあてている。直後の No, no がその指摘への反論。',
      trap: '一語だけだと注文や絶句にも聞こえる。次の人が何に「違う」と言ったかで、一語の働きが決まる。',
      use: 'So, a sandwich. Got it.（つまりサンドイッチね。了解）' },

    // why: $16 ← -teen/-ty: "sixty" with a flapped t and a weak "-ty" heard as "sixteen"; $6 ← the "-ty" lost after
    //   "three dollars" just before
    { id: 'n1', skill: 'number', level: 'B1', point: 'price', seg: [169.3, 176.7], keep: true,
      stem: 'How much does a gallon of the beef milk cost?',
      choices: ['$6', '$16', '$60'], a: 2,
      cue: '二つ目の「costs」のあと、gallon の前。',
      line: 'Milk costs three dollars a gallon… beef milk? That costs *sixty* a gallon.',
      said: '「牛乳は1ガロン3ドル。アナベルの手しぼり牛肉ミルクは60ドル」と言う。',
      mean: 'sixty は前が強く、ty は短い。普通の牛乳の20倍の値段。',
      trap: 'sixty の t が弾み「シックスディ」となり sixteen と混ざる。強い所が前か後ろかで判断。',
      use: 'That’s sixty dollars a night.（1泊60ドルです）' },

    // why: worth every cent ← "knows business" read as praise of the product (the sincerity frame); fooling buyers ←
    //   the speaker's earlier dislike of her carried over, the right target in the wrong direction
    // anchor: 169.6–176.2 s "Milk costs three dollars… beef milk… sixty a gallon", 177–178.7 s "And there's a wait list",
    //   then 179.7 s "This woman knows business": the praise follows the price gap and the queue, not the product
    // R fix: V2 (blind 60 %): the key was the only specific, two-part choice; shortened to one point each
    // retired: g2 and nt2 reveal its point, so play 3+ under g2 drew no C2 once nt2 was seen
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'price', reveals: ['waitlist'], seg: [169.3, 184.2], retired: true,
      stem: 'What exactly is being admired in “This woman knows business”?',
      choices: ['Her knack for selling plain milk at a huge markup', 'Her milk, so good it is worth sixty a gallon',
                'Nothing: it’s a dig at how she fools buyers'], a: 0,
      cue: '直前の二つの数字と、順番待ちの話。',
      line: 'That costs sixty a gallon. — And *there’s a wait list*. — *This woman knows business.*',
      said: '3ドルの牛乳を60ドルで売り、順番待ちまである、と聞いて「この女は商売を分かっている」と言う。',
      mean: 'ほめているのは品質ではなく、ただの牛乳を20倍で売る手腕。中身を見抜いた上での感心。',
      trap: 'ほめ言葉を商品のことと取るか、皮肉と取るか。何の直後に言ったかで、ほめる対象が決まる。',
      use: 'That guy really knows how to sell.（あの人、売り方を分かってるね）' },

    // R fix: V2 (blind 50 %, right): the key was the only choice with "list"; it's now in a distractor instead
    // why: sells out daily ← "wait list" heard as "it's always gone"; her list ← "list" heard as a private, VIP list
    { id: 'd3', skill: 'detail', level: 'B1', point: 'waitlist', seg: [176.6, 179.65],
      stem: 'What does Annabelle add about the beef milk?',
      choices: ['People wait their turn to buy it', 'It sells out the day it’s made', 'It’s only sold to people on her list'], a: 0,
      cue: '「Yeah. And」のあと。',
      line: 'Yeah. And *there’s a wait list*.',
      said: '「そう。しかも順番待ちのリストがあるの」と付け足す。',
      mean: 'wait list ＝ 順番待ち。高くても欲しい人が待っている、という自慢。',
      trap: 'list だけ聞くと「特別な人だけ」に聞こえやすい。wait と組で「待っている人の列」。',
      use: 'Is there a wait list?（順番待ちはありますか）' },

    // R new (replaces s1): sound on a weak "shall"; both sources have "shall we discuss it in my yurt"
    // why: should ← "shall" and "should" both shrink to "sh'"; can ← a weak, quick first word heard as the commonest
    //   request opener
    { id: 's2', skill: 'sound', level: 'B2', point: 'yurt', seg: [183.1, 186.3],
      stem: 'Fill the gap: “___ discuss it in my yurt?”',
      choices: ['Shall we', 'Should we', 'Can we'], a: 0,
      cue: 'yurt の前の文の、最初の二語。',
      line: '*Shall we* discuss it in my yurt?',
      said: '「続きは私のゲルで話しましょうか」と誘う。',
      mean: 'Shall we ～? ＝「～しましょうか」と誘う形。shall は弱く「シャウィ」に近い。',
      trap: 'should だと「～すべき？」と相談する形。語末の d の止まりがあるかを聞き分ける。',
      use: 'Shall we get started?（始めましょうか）' },

    // why: price cut ← "no need to discuss any further" heard as the money talk being settled; Ron won over ← "This
    //   woman knows business" earlier, carried over as the reason
    { id: 'i4', skill: 'infer', level: 'C1', point: 'face', seg: [206.75, 221.6],
      stem: 'Why is Annabelle suddenly made “the face of the Gryzzl bid”?',
      choices: ['They think Leslie has found a big name of her own', 'Annabelle has agreed to lower her price for them',
                'Ron has finally come around to liking her'], a: 0,
      cue: '「press conference」と聞いたあとの、So で始まる一文。',
      line: 'getting ready for a *big press conference*. … So *she’s found something to strengthen her bid*.',
      said: '「Leslie は記者会見の準備中」と聞き、「強い手を見つけたな」と読んで、すぐアナベルに決める。',
      mean: 'ライバルの動きを見て、先に手を打った。',
      trap: 'no need to discuss を「値段が決まった」と取りやすい。直前の So の推測が理由。',
      use: 'No need to discuss it further.（これ以上話し合う必要はない）' },
  ]
};
