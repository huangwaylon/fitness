// “Dwight Meets a Hobbit - The Office US” (the official The Office channel, BEST OF SEASON 4): Michael and Dwight
// turn up at a club to take Ryan up on his offer to party; Ryan's friend Troy keeps teasing Dwight (a Tolkien
// character, a hobbit, a "regular-sized house", weevils), Dwight answers everything in earnest, orders food at a bar
// that has none, and worries about Ryan's trips to the bathroom.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Mike/Michael (8.9, 25.0 s), Dwight
// (25.4 s), Troy (39.5 s). Both transcripts give the name at 24.5 s as "Brian" (it's Ryan; no item quotes it). No item
// turns on who speaks the Cabo talk (0–7 s), "Tolkien character… hobbit" (44–51 s), "a regular banking wizard"
// (46.4 s) or "he's a normal guy" (73.4 s): stems say "a man", "the friend", or name the moment. The bathroom trips
// (98.9–108 s) are only read at face value, as Dwight reads them. Stems name Ryan as the one heading to the bathroom
// and Dwight as the one who worries (99–108 s); no key changes if the voices are swapped. Untested: 52.5 s ("y'all" /
// "hill"), 75.7 s ("Wait, Schrute" / "light shroom"), 99.2 s ("head to" / "hit"), 107.4 s ("Vodka," in whisper only),
// 110 s on (music; whisper loops).
// The captions have "No, man" where whisper has "I don't know, man" (0.1 s): m1's line starts after it.
// EAR CHECK: 87.8 s x2 — the captions have an extra “what” before “I don't even know” (whisper doesn't): is the gap
//   right after “man.”?
// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 1
// REVIEW open: c2b, because the title says "hobbit", so the height reading is easier than C2 for anyone who reads it.
//   g2 is tagged gist but asks about the arrival (V4); it was kept for the gist minimum. i2's "at face value" hints at
//   a darker reading of the bathroom trips that the bank never tests; is that OK for the learners?
// REVIEW: s2 moved off "beet" (Office trivia) to "owns his own"; its ear check was taken off (both agree)
import type { Clip } from '../types.ts';

export const dwightHobbit: Clip = {
  id: 'hobbit', video: 'iz6p2OgH-Z4', title: 'Dwight Meets a Hobbit', dur: 133, wpm: 140, band: 'slow',
  tags: ['友だち', '店・レストラン'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 % right): "speaking seriously" was a weak literal outlier; now a retraction reading
    // why: corrects himself ← "I mean" as a self-repair (言い直し); takes back the doubt ← "I don't know" then a firm
    //   claim, heard as a change of mind
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', seg: [0, 5.7],
      stem: 'At the very start, what does “I mean” do in the man’s Cabo talk?',
      choices: ['It leads into the reason for his view', 'It fixes a word he got wrong just before',
                'It takes back the doubt he just voiced'], a: 0,
      cue: '最初の「man」のすぐあと。',
      line: '…man. *I mean*, when you think about it, Cabo is really the third world.',
      said: '「だってさ、考えてみればカボって第三世界だろ」と、自分の意見の理由を話し始める。',
      mean: 'I mean ＝「というのも」「つまり」。自分の考えを説明する入り口。',
      trap: 'I mean は言い直しにも使うが、ここは何も直していない。前の一言を広げる働き。',
      use: 'I don’t know. I mean, it’s pretty far.（どうかな。だって結構遠いし）' },

    // R fix: V2 (blind 65 % right): "nervous about traveling" was a weak filler; now two readings built on his words
    // why: worried about safety ← "third world" and "I don't go to a place like that" heard as fear; tired of fancy
    //   trips ← "glamour" heard without the contrast, as what he wants to escape
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'cabo', seg: [0, 6.95],
      stem: 'How does the man talking about Cabo come across?',
      choices: ['Snobbish about where he travels', 'Worried about safety in poor places', 'Tired of trips that feel too fancy'],
      a: 0,
      cue: '「poverty」の前後、何のために旅をするか。',
      line: 'I don’t go to a place like that *to see more poverty*, you know? … you get some *glamour*.',
      said: '貧しさなんか見たくない、ぜいたくな気分のために行くんだ、と話す。',
      mean: '貧しい国を見下し、旅に華やかさだけを求める、浅い人物に聞こえる。',
      trap: 'third world で治安の心配に聞こえるが、ここは貧しさを「見たくない」だけ。don’t go に注目。',
      use: 'I’m not really a luxury traveler.（ぜいたく旅行はあまりしない）' },

    // R fix: V2 + §9.4 (blind 65 % right): the key restated the title ("meets a hobbit" = teased); all three now
    //   start from the teasing and differ in how it runs, settled by "Hey, Dwight" and his earnest answers
    // why: snapping back ← Dwight's flat answers ("Good.", "we were prepared") heard as cold retorts; Dwight teases ←
    //   his weevil lecture heard as a gross-out joke on the others
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['wizard', 'house'], seg: [0, 112],
      stem: 'What runs through the scene at the club?',
      choices: ['Dwight gets teased, and answers it all in earnest', 'Dwight gets teased, and keeps snapping back',
                'Dwight teases the others, who miss the joke'], a: 0,
      cue: 'Dwight について言われることと、その答え方。',
      said: 'Ryan の友人がドワイトの見た目や農場をネタに何度もからかい、ドワイトは真面目に答える。',
      mean: 'からかう側と、気づかずに本気で返す側のずれが場面の中心。',
      trap: 'Dwight の短い返事は冷たく聞こえるが、どれも本気の答え。ネタにされているのは彼。',
      use: 'Are you making fun of me?（からかってる？）' },

    // why: real life ← "see more poverty" heard without "don't"; peace and quiet ← the usual beach-trip reason
    { id: 'd1', skill: 'detail', level: 'B1', point: 'cabo', seg: [3.0, 6.95],
      stem: 'What does the man say people go to Cabo to get?',
      choices: ['Some glamour', 'Real local life', 'Peace and quiet'], a: 0,
      cue: '文の最後の一語。何が手に入るか。',
      line: 'You go there, you get some *glamour*.',
      said: '「貧しさを見に行くんじゃない。華やかさを味わいに行く」と言う。',
      mean: 'glamour ＝ 華やかさ、ぜいたくな雰囲気。',
      trap: 'see more poverty が聞こえると「地元の暮らし」を選びやすい。直前の don’t を聞く。',
      use: 'I just want a little luxury.（ちょっとぜいたくしたいだけ）' },

    // R fix: V2 (blind 60 % right): "wants Ryan back at work" needed the show's backstory to be tempting; now a role
    //   swap of the offer and a check-up reading
    // why: promised Ryan ← "your offer" with the roles swapped; check up on Ryan ← a visit from the old boss looks
    //   like a mission
    { id: 'g2', skill: 'gist', level: 'B1', point: 'offer', seg: [6.8, 29.0],
      stem: 'Why have Michael and Dwight come to the club?',
      choices: ['Ryan had invited them to party', 'They had promised Ryan a night out', 'They want to check up on Ryan'],
      a: 0,
      cue: '「What are you doing here?」への答え。',
      line: 'just taking you up on your *offer to party*.',
      said: '「何しに来たの？」と聞かれ、「パーティーの誘いに乗りに来た」と答える。',
      mean: '前に Ryan が誘ってくれたので来た、という説明。',
      trap: 'your offer の your に注意。誘ったのは Ryan。元上司の訪問でも様子見ではない。',
      use: 'We’re here for the party.（パーティーに来たんだ）' },

    // R fix: V2 (blind 55 % right): "reminding of a promise" was weak; now the Japanese-polite "checking it still
    //   stands"
    // why: raising your offer ← "up" heard as a higher price (値上げ); checking it still stands ← the polite frame
    //   (まだ有効？) when the line already says they're taking it
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'offer', seg: [9.8, 13.85],
      stem: 'What is Michael saying when he explains why they came?',
      choices: ['That they are accepting Ryan’s invite', 'That they are raising Ryan’s offer',
                'That they are checking Ryan’s offer still stands'], a: 0,
      cue: '「What are you doing here?」の答え、offer の前。',
      line: 'just *taking you up on* your offer to party.',
      said: '「君の誘いに乗りに来た」。up on がつながり「アポン」。',
      mean: 'take ～ up on an offer ＝ 申し出を受ける。誘いに本当に乗るときに使う。',
      trap: 'up を「上げる」と取ると値上げの話になる。take ～ up on で「誘いに乗る」。',
      use: 'I’ll take you up on that coffee.（そのコーヒーの話、乗るよ）' },

    // R fix: V2 (blind 50 % right): "asking to stay" was weak; now "So" read as a wrap-up
    // why: apology ← the Japanese frame: turning up unannounced calls for 突然すみません; cutting it short ← "So" read as
    //   a wrap-up, and ta-da missed
    { id: 'm2', skill: 'marker', level: 'B2', point: 'tada', seg: [11.2, 15.55],
      stem: 'What does Michael do with the word he says right after “So…”?',
      choices: ['Shows off their arrival like a surprise', 'Says sorry for turning up unannounced',
                'Cuts his explanation short to move on'], a: 0,
      cue: '「party」のあと、短い一語。',
      line: 'So, *ta-da*.',
      said: '誘いに乗りに来た、と言ってから「じゃーん」と付け足す。',
      mean: 'ta-da ＝「じゃーん」。手品のように、自分たちの登場を見せている。',
      trap: '突然の訪問なので謝りを予想しやすいが、Michael はむしろ得意げ。',
      use: 'Ta-da! I made dinner.（じゃーん！夕飯作ったよ）' },

    // why: expected them ← "I know" heard as "I knew you'd come"; glad it's them ← "it's you guys" heard as relief
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'iknow', seg: [23.8, 27.4],
      stem: 'When the visitors announce who they are, what does Ryan’s reply do?',
      choices: ['Points out that they didn’t need to say it', 'Says he expected them to come tonight',
                'Says he’s relieved it’s really them'], a: 0,
      cue: '名前を名乗った直後、短い返事。',
      line: '*I know it’s you guys*.',
      said: '名乗られて「君たちなのは分かってる」と返す。',
      mean: '見れば分かることを言われ、「言わなくていい」と軽く返している。',
      trap: 'I know を「来ると思ってた」と取りやすい。続く it’s you guys で名乗りへの返事と分かる。',
      use: 'I know, I know. You told me.（分かってるって。聞いたよ）' },

    // R fix: V2 (blind 65 % right; a cold reader 85 %): "represent" was a weak sound match, now "resent", the closest
    //   re-z- word; and the stem stops before "Tolkien character", which only "resemble" fits
    // why: remember ← re- + m sounds, the same rhythm; resent ← the same re-z-e start, with -ble lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'resemble', seg: [43.0, 46.15],
      stem: 'Fill the gap: “You ___ the…”',
      choices: ['resemble', 'remember', 'resent'], a: 0,
      cue: '「You」のすぐあと、re- で始まる動詞。',
      line: 'You *resemble* the Tolkien character.',
      said: '「君、トールキンのキャラクターに似てるね」とドワイトに言う。',
      mean: 'resemble ＝ ～に似ている（見た目）。初対面では少し失礼な一言。',
      trap: 'resent は出だしが同じ、remember はリズムが近い。z と最後の -ble で聞き分ける。',
      use: 'You resemble your mom.（お母さんに似てるね）' },

    // R fix: V2 (blind 65 % right): the key was the only cynical reading; "good with money" swapped for a near miss
    //   (still a dig, wrong target), so two choices now see the dig
    // why: dig at his brains ← right mechanism, wrong target: "wizard" heard as about smarts, though "resemble" is
    //   looks; a fact about the story ← "the Tolkien character" heard as a quiz about the books
    // anchor: 44.1–50.6 s "You resemble the Tolkien character" (looks, not skill), "a regular banking wizard" (turned
    //   into praise), "No, no, no, not a wizard. A hobbit." (the praise refused, the looks kept)
    // retired: for the draws (play 3+ under g1 drew no C2: g1 reveals its point)
    { id: 'c2a', skill: 'infer', level: 'C2', point: 'wizard', reveals: ['resemble'], seg: [43.0, 52.4], retired: true,
      stem: 'Why does the comparison get corrected from “wizard” back to “hobbit”?',
      choices: ['To keep it a dig at Dwight’s looks, not praise', 'To make it a dig at his brains, not praise',
                'To get a detail of the Tolkien story right'], a: 0,
      cue: '最初の動詞（見た目か能力か）と、no の数。',
      line: 'You *resemble* the Tolkien character. … a regular banking wizard. … *No, no, no, not a wizard. A hobbit.*',
      said: '見た目が似ていると言われ、別の声がほめ言葉に変えるが、「魔法使いじゃなくてホビット」と戻される。',
      mean: 'resemble は見た目の話。ほめ言葉への言いかえを no の3連発で拒み、からかいのまま残す。',
      trap: '中身の訂正に聞こえるが、正しているのはほめ方。訂正は何を守るためかを聞く。',
      use: 'No, no, I meant that as a joke.（いやいや、冗談のつもりだったの）' },

    // R fix: V2 (blind 60 % right): "a magician at the bank" was a filler; now "regular" read as average
    // why: ordinary bank worker ← "regular" taken literally as 普通の; fairly good, nothing special ← "regular" as
    //   average, softening "wizard"
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'wizard', seg: [45.9, 48.95],
      stem: 'What does the friend’s “banking wizard” line claim about Dwight?',
      choices: ['That he is a real genius with money', 'That he is an ordinary bank worker',
                'That he is fairly good with money, nothing special'], a: 0,
      cue: '「He basically is」のあと、wizard の前の2語。',
      line: 'He’s *a regular* banking *wizard*.',
      said: '「まさにそう。本物の金融の天才だ」と言う。',
      mean: 'a regular ～ ＝ まさに～。wizard ＝ 名人。見た目の話をほめ言葉に変えている。',
      trap: 'regular は「普通の」と覚えがち。a regular ＋ 人で「まさに」。',
      use: 'She’s a regular genius in the kitchen.（彼女は料理の天才だ）' },

    // R fix: V2 (blind 55 % right): "a big house on my farm" was the only non-joke reply; all three now catch a
    //   dig, and only one names its target. Open: the title says "hobbit", so it stays easier than C2
    // why: not that rich ← right mechanism, wrong target: the dig heard as about money (a farm owner's big house);
    //   old-fashioned ← the dig heard as about a farmer's rustic home
    // anchor: 49.0–50.6 s "not a wizard. A hobbit." then 70.3–71.5 s "Do you live in a regular-sized house?": the size
    //   word continues the hobbit dig, so only a reply that names the joke shows it was caught
    // retired: for the draws (g1 reveals its point)
    { id: 'c2b', skill: 'pragma', level: 'C2', point: 'house', seg: [48.6, 73.3], retired: true,
      stem: 'Which reply to the house question would show it was understood?',
      choices: ['Ha. Okay, I’m not that short, guys.', 'Ha. Okay, I’m not that rich, you guys.',
                'Ha. Okay, I’m not that old-fashioned.'], a: 0,
      cue: 'ひとつ前のからかいと、家の質問の形容詞。',
      line: 'Not a wizard. *A hobbit*. … Do you live in a *regular-sized* house?',
      said: 'ホビットと言われたあと「普通サイズの家に住んでる？」と聞かれる。',
      mean: 'regular-sized は小さい家に住むホビットへの当てつけ。お金でなく背丈のからかいなので、そこに返すのが合う。',
      trap: '家の質問は財産の話にも聞こえる。hobbit に続く size の語なら、ネタは体の小ささ。',
      use: 'Ha ha. Very funny.（はいはい、面白いね）' },

    // why: out of chicken ← "chicken fingers" heard, and running out is the usual reason; must buy a bottle ← "bottle
    //   service" is offered just before
    { id: 'd3', skill: 'detail', level: 'B1', point: 'nofood', seg: [52.3, 61.2],
      stem: 'Why can’t Dwight have the first thing he orders?',
      choices: ['The place doesn’t serve any food', 'They have run out of chicken fingers',
                'He has to order a whole bottle'], a: 0,
      cue: '注文のすぐあと、店の人の返事。',
      line: '*We don’t serve food here*.',
      said: 'チキンフィンガーなどを頼むと、「食べ物はありません」と言われる。',
      mean: 'クラブなので飲み物だけ。食事を頼んだドワイトが場違いだと分かる。',
      trap: 'bottle service が直前に聞こえるので「ボトル注文が必要」に引かれやすい。返事の food を聞く。',
      use: 'Do you serve food here?（ここ、食べ物ありますか）' },

    // R fix: V2 (blind 55 % right): "annoyed; complains" was a weak filler; now a surprised follow-up question
    // why: surprised ← a refused order usually brings "What do you have, then?"; embarrassed ← the Japanese frame: a wrong request
    //   calls for すみません
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'unfazed', seg: [59.0, 68.6],
      stem: 'How does Dwight take the news about the food?',
      choices: ['Unbothered; he just changes his order', 'Surprised; he asks what they do serve',
                'Embarrassed; he says sorry for asking'], a: 0,
      cue: '返事の最初の2語と、then のあと。',
      line: '*Oh, okay. Then* just bring me two cups.',
      said: '「あ、そう。じゃあカップを2つ」と、すぐ別の注文に切りかえる。',
      mean: 'Oh, okay と then で、気にせず次の手を出している。',
      trap: '断られたら謝る、何があるか聞く、を予想しやすい。then は「それなら」で切りかえの合図。',
      use: 'Oh, okay. Then I’ll have tea.（あ、そう。じゃあ紅茶で）' },

    // R fix: V2 (blind 65 % right): "a round for the table" was a filler; now olives and cherries heard as cocktails
    // why: cocktails his way ← olives and cherries are cocktail garnishes, so "two cups" sounds like drinks; own food ← "cups" heard as empty
    //   cups to fill himself
    { id: 'h1', skill: 'humor', level: 'C1', point: 'cups', seg: [61.0, 68.9],
      stem: 'What makes Dwight’s second order funny?',
      choices: ['He turns drink garnishes into a meal', 'He orders two cocktails made his own way',
                'He asks for empty cups for his own food'], a: 0,
      cue: '2つのカップの中身。',
      line: 'two cups. One with *olives* and another one filled with *maraschino cherries*.',
      said: '食べ物がないなら、オリーブのカップとチェリーのカップを、と頼む。',
      mean: 'カクテルの飾りを山盛りで頼み、無理やり食事にする。抜け道の発想が笑い。',
      trap: 'two cups だけだと飲み物に思える。One with、another one で中身を聞く。',
      use: 'Can I just get a side of fries?（ポテトだけもらえる？）' },

    // why: plays along ← "Yeah" heard as agreeing with the joke; gets angry ← defending a friend usually means a
    //   sharp tone, and "he's cool" sounds like a warning
    { id: 'i1', skill: 'infer', level: 'C1', point: 'house', seg: [69.8, 75.6],
      stem: 'How is the house question answered?',
      choices: ['Straight, as if Dwight needed vouching for', 'As a joke, happily playing along with the teasing',
                'Angrily, as a warning to stop the teasing'], a: 0,
      cue: '質問のあと、Yeah に続く2つの短い文。',
      line: 'Yeah, *he’s a normal guy*. *He’s cool*.',
      said: '家の質問に「ああ、普通のやつだよ。いいやつ」と答える。',
      mean: 'からかいに気づかず、まじめにドワイトをかばっている。そのずれも笑いになる。',
      trap: 'Yeah を「冗談に乗った」と取りやすい。続く normal、cool は本気でかばう言葉。',
      use: 'Don’t worry, he’s cool.（心配ないよ、いいやつだから）' },

    // R fix: V1/V2 (blind 90 % right): "beet" is Office trivia (Schrute Farms), so the gap moved to the linked
    //   "owns his own" (h dropped); point renamed, and d4 no longer reveals it
    // why: owns a whole ← "his own" loses its h and sounds like "a whole"; owned his own ← the -s/-d ending blurs
    //   before "his"
    { id: 's2', skill: 'sound', level: 'B2', point: 'ownsown', seg: [78.6, 82.5],
      stem: 'Fill the gap: “This guy ___ beet farm.”',
      choices: ['owns his own', 'owns a whole', 'owned his own'], a: 0,
      cue: '「This guy」のすぐあと、farm の前まで。',
      line: 'This guy *owns his own* beet farm.',
      said: '「こいつ、自分のビート農場を持ってる」と紹介する。',
      mean: 'his の h が落ち、owns his own が「オウンズィゾウン」と一続きになる。',
      trap: 'h が消えると a whole に聞こえる。z の音が残るかを聞く。owned なら d で止まる。',
      use: 'She owns her own café.（彼女は自分のカフェを持っている）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'evenknow', seg: [86.2, 89.05],
      stem: 'Type what he says: “What a crazy word, man. ___ what that means.” (4 words)',
      answer: "i don't even know",
      cue: '「crazy word, man」のすぐあと。',
      line: '*I don’t even know* what that means.',
      said: '「すごい言葉だね。どういう意味かも分からないよ」と言う。',
      mean: 'don’t even が「ドンティーヴン」とつながる。even ＝「～すら」。',
      trap: 'don’t の t が次の even にくっつき、2語が1語に聞こえる。n’t の「ン」を手がかりにする。',
      use: 'I don’t even know where to start.（どこから始めればいいかも分からない）' },

    // R fix: V2 (blind 50 % right): the key was the only specific, two-step choice; the leaf distractor is now an
    //   inside/outside near miss. reveals: ['beet'] removed (s2 no longer turns on "beet")
    // why: eggs on the beets ← "inside" missed and "eat their way out" heard as "in"; eggs in the soil ← the usual
    //   picture of insects, with "inside" missed
    { id: 'd4', skill: 'detail', level: 'B2', point: 'weevil', seg: [89.0, 95.35],
      stem: 'What does Dwight say weevils do?',
      choices: ['Lay eggs inside young beets that the babies eat out of',
                'Lay eggs on young beets, and the babies eat their way in',
                'Lay eggs in the soil so the babies eat the roots'], a: 0,
      cue: '「They lay their eggs」のあと、場所を表す語。',
      line: 'They lay their eggs *inside the unripe beetroot*. … the babies *eat their way out*.',
      said: '卵をまだ若いビートの中に産み、幼虫が中から食べて出てくる、と説明する。',
      mean: 'eat their way out ＝ 食べながら外へ出る。真面目すぎる説明。',
      trap: '卵は外、幼虫が中へ、と思いやすい。inside と out の位置関係を聞く。',
      use: 'The dog chewed its way out.（犬がかじって外に出た）' },

    // why: before spring ← "come" heard as "coming", something still ahead; after spring ← "springtime" heard as a
    //   season that ends
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'spring', seg: [91.75, 95.35],
      stem: 'In Dwight’s explanation, when do the babies eat their way out?',
      choices: ['When spring arrives', 'Just before spring', 'Once spring is over'], a: 0,
      cue: '「Then」のすぐあと、季節の言葉の前。',
      line: 'Then, *come springtime*, the babies eat their way out.',
      said: '「そして春になると、幼虫が食べながら出てくる」と続ける。',
      mean: 'come ＋ 時 ＝「～になると」。come Monday も同じ形。',
      trap: 'come を「来つつある」と取ると春の前に聞こえる。文頭の come ＋ 時は「その時が来たら」。',
      use: 'Come Friday, we’ll be on the beach.（金曜になれば、もうビーチだ）' },

    // R fix: V2 (blind 65 % right): "the price" was weak; now the crazy word he asked about, said just before
    // why: the word ← "What a crazy word… I don't even know what that means" just before; had too much ← at a bar,
    //   "too much for me" fits drinking
    { id: 'p4', skill: 'pragma', level: 'B2', point: 'toomuch', seg: [95.2, 98.85],
      stem: 'When the friend says it’s “too much for me,” what is too much?',
      choices: ['The gross detail he has just heard', 'The odd word he couldn’t make sense of',
                'The amount he has had to drink'], a: 0,
      cue: '幼虫の話の直後。何が多すぎるのか。',
      line: 'Crazy! … *That’s too much for me*, man.',
      said: '幼虫の話を聞いて「それはちょっと無理」と言う。',
      mean: 'too much ＝ 聞いていられない、刺激が強すぎる。気持ち悪い話を打ち切る一言。',
      trap: 'バーなのでお酒の量、または weevil という言葉に結びつけやすい。返しているのは説明の中身。',
      use: 'Okay, that’s too much information.（もういい、それ以上は聞きたくない）' },

    // why: once ← "already" suggests one earlier trip; twice ← a small number feels normal for a night out
    { id: 'n1', skill: 'number', level: 'B1', point: 'bathroom', seg: [98.6, 101.8], keep: true,
      stem: 'How often has Ryan already gone to the bathroom, says Dwight?',
      choices: ['Once', 'Twice', 'Several times'], a: 2,
      cue: '「already been」のあと。',
      line: 'You’ve already been *several times*.',
      said: 'トイレに行くと言う Ryan に、「もう何回も行ってるよ」とドワイトが言う。',
      mean: 'several times ＝ 何度も（3回以上の感じ）。回数の多さに驚いている。',
      trap: 'already から「1回行った」を想像しやすい。後ろの several を聞く。',
      use: 'I’ve called you several times.（何回も電話したよ）' },

    // R fix: V2 (blind 60 % right): "admits he hasn't been feeling well" was off-topic; now "maybe" read as a yes
    // why: agrees about a doctor ← "maybe" heard as agreement; thanks him ← the Japanese frame: concern calls for お礼
    { id: 'p5', skill: 'pragma', level: 'B2', point: 'maybe', seg: [102.2, 105.8],
      stem: 'When Dwight suggests a medical reason, what does Ryan’s reply do?',
      choices: ['Brushes the idea off without arguing', 'Agrees he may need to see a doctor',
                'Thanks Dwight for worrying about him'], a: 0,
      cue: '病気の話のあと、短い返事。',
      line: '*I don’t know, maybe*.',
      said: '「ぼうこう炎かも」と言われ、「さあね、かもね」とだけ返す。',
      mean: 'I don’t know, maybe ＝ 認めも否定もせず、話を終わらせる返事。',
      trap: 'maybe を「そうかも」と同意に取りやすい。I don’t know と並ぶと、話を流す合図。',
      use: 'I don’t know, maybe later.（さあ、またあとでかな）' },

    // R fix: V2 (blind 60 % right): "a drink for himself" was a filler; now a plausible bar reading (slow down)
    // why: teasing back ← after the hobbit jokes, payback is the sitcom script; slow down ← juice at a bar heard as
    //   cutting Ryan off, though he names an infection
    { id: 'i2', skill: 'infer', level: 'C1', point: 'cranberry', seg: [102.2, 107.9],
      stem: 'What does Dwight’s offer of cranberry juice show?',
      choices: ['He takes the trips at face value and wants to help', 'He wants to tease Ryan back for the hobbit jokes',
                'He thinks Ryan has had too much and should slow down'], a: 0,
      cue: '病名のあと、「I’ll order you」。',
      line: 'Maybe you have some kind of *bladder infection*. … *I’ll order you some cranberry juice*.',
      said: '「ぼうこう炎かもしれない。クランベリージュースを頼んであげる」と言う。',
      mean: 'トイレの多さを本気で体の心配として受け取り、世話を焼いている。',
      trap: 'からかわれたあとなので仕返しに見えやすいが、order you は「君のために」。',
      use: 'Let me get you some water.（水を持ってくるよ）' },
  ]
};
