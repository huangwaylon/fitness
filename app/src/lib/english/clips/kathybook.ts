// REVIEW 2026-11-16: pass 3, fix 15, drop 2, new 0; ear checks 1
// REVIEW Q: g1, m1, p1 and h2 are still near 50 % blind (the title gives away “what the gift reveals”; a learner who knows
//   “actually” or “you better” can get m1 and p1 from the choices). Accept, or rework further?
// REVIEW Q: a1 assumes the friend recalling the story is a woman (choices avoid pronouns; stem says “the friend”).
// “Chandler Secretly Loves Joey's Girlfriend | Friends” (the official Friends channel, Best of Season 4): Chandler
// wraps a rare book for Kathy's birthday, and his friends point out what a gift like that says.
// Segments from the captions, words from whisper (2026-11-16). Speakers other than Chandler and Phoebe aren't named
// (stems say “a friend”). No predict item: the one clean pause (“It doesn't say that. … Does it?”) is too short to cut.
// EAR CHECK: 59.0 s i4 — “Does it?” after the pause sounds unsure, not a confident challenge (key rests partly on tone)
import type { Clip } from '../types.ts';

export const kathybook: Clip = {
  id: 'kathybook', video: 'qYlwMAhh92g', title: 'Chandler Secretly Loves Joey\'s Girlfriend', dur: 79, wpm: 199,
  band: 'fast', tags: ['友だち', '恋愛'],
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: the title made the old key the only fit (V2, §9.4); now asks how the talk turns, all three about the gift
    // why: reversed ← “so sweet” and “great” both sound like praise, so the order is easy to flip;
    //      cost ← “expensive” in the last line, heard as a worry about money
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['secret'], seg: [0, 68.2],
      stem: 'How do the friends’ reactions to the gift change during the scene?',
      choices: ['Praise for the gift turns into teasing about what it reveals',
                'Teasing about the gift turns into praise for what it reveals',
                'Praise for the gift turns into worry about what it cost'], a: 0,
      cue: '本が出てきてからの、友だちの反応の順番。',
      said: 'みんなは最初、本の珍しさと手間をほめるが、途中から話の向きが変わる。',
      mean: '「その贈り物、気持ちがバレバレだよ」とからかわれ、本人も不安になる。',
      trap: 'great もほめ言葉に聞こえるので順番を逆に取りやすい。expensive は値段の心配ではなく比較。',
      use: 'I got you a little something.（ちょっとしたものを用意したよ）' },

    // R fix: the key was the only coherent story (V2); now three parallel “who owes what” choices
    // why: she owes him ← “you said you ordered”, the you missed, so giver and receiver swap;
    //      dinner ← “your birthday… months ago” suggests a missed celebration
    { id: 'g2', skill: 'gist', level: 'B1', point: 'promise', reveals: ['phoebe'], seg: [0, 18.8],
      stem: 'What is the opening exchange with Phoebe about?',
      choices: ['A present Chandler still owes her', 'A present she still owes Chandler',
                'A birthday dinner Chandler still owes her'], a: 0,
      cue: '「remember you said」のあとに注目。',
      said: 'フィービーは「注文したけど、まだ届かないって言ってたよね」と言う。',
      mean: '何か月も前の誕生日プレゼントを、チャンドラーはまだ渡していない。',
      trap: 'you said you ordered の you はチャンドラー。主語を落とすと贈る側ともらう側が逆に。',
      use: 'Remember you said you’d call me?（電話するって言ってたよね）' },

    // R fix: Kathy (absent) and Chandler (who asked for the paper) were fillers (K3); now three women in the room.
    //   The answer rests on “Pheebs” in the reply, so no ear check
    // why: Rachel, Monica ← two other women's voices in the room; only the address in the reply settles it
    { id: 'w1', skill: 'who', level: 'B1', point: 'phoebe', seg: [2.6, 8.6],
      stem: 'Who asks if the wrapping paper is for a birthday present?',
      choices: ['Rachel', 'Phoebe', 'Monica'], a: 1,
      cue: '質問のすぐあと、返事の最初の呼びかけ。',
      line: 'Oh, is it for *my* birthday present? — *Pheebs*, it was your birthday…',
      said: '「わたしのプレゼント？」と聞いた人に、チャンドラーが「フィービー」と呼びかけて答える。',
      mean: 'Pheebs は Phoebe の愛称。返事の呼びかけで、直前に話した人が分かる。',
      trap: '女性の声どうしは聞き分けにくい。返事の最初の呼びかけで決める。',
      use: 'Is this for me?（これ、わたしに？）' },

    // why: last week ← “like” heard as a vague, recent time; a month ago ← the final s of “months” is easy to lose
    { id: 'n1', skill: 'number', level: 'B2', point: 'months', reveals: ['phoebe'], seg: [5.3, 8.6],
      stem: 'According to Chandler, when was Phoebe’s birthday?',
      choices: ['Last week', 'A month ago', 'Months ago'], a: 2, keep: true,
      cue: '「your birthday」のあと、like に続く語。',
      line: 'Pheebs, it was your birthday, like, *months ago*.',
      said: '「フィービー、誕生日なんてもう何か月も前だよ」。',
      mean: 'like は「〜くらい」のぼかし。何か月もたっているのに、まだ聞くのかという返し。',
      trap: 'months の s は弱く、a month と聞こえやすい。a があるかどうかで数が変わる。',
      use: 'That was, like, years ago.（それって何年も前の話だよ）' },

    // R fix: “had come … yet” isn't grammatical (§9.5), so it's cut to 3 choices; the segment now reaches “yet”
    //   (captions 14.6 s); the trap is now hasn't/hadn't
    // why: hasn't ← present perfect is the textbook form, and z/d at the end is a small difference;
    //      didn't ← only the d at the start is caught, and American English allows “didn't… yet”
    { id: 's1', skill: 'sound', level: 'B2', point: 'hadnt', reveals: ['promise'], seg: [8.2, 15.3],
      stem: 'Fill the gap: “…you ordered something special and it just ___ yet?”',
      choices: ['hasn’t come', 'hadn’t come', 'didn’t come'], a: 1,
      cue: '「it just」のすぐあと、短い語の終わりの音。',
      line: 'you said you ordered something special and it just *hadn’t come* yet?',
      said: '「まだ届いてないって言ってたよね」。hadn’t は「ハドゥン」。',
      mean: '前に聞いた話なので過去完了。まだ来ていないと念を押している。',
      trap: 'hasn’t と hadn’t は語尾の z と d の差だけ。you said の話なら hadn’t を疑う。',
      use: 'My order hasn’t come yet.（注文したものがまだ来ません）' },

    // R fix: “admitting he forgot” contradicted the line and the key was the only evaluative choice (V2, K3, K6);
    //   all three now mention a call
    // why: go make a call ← “call” taken literally (今から電話); shop called ← “have a call” heard as
    //      “had a call”, as if news came in
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'callin', reveals: ['promise'], seg: [8.2, 18.8],
      stem: 'What is Chandler doing with “Well, I have a call in about that”?',
      choices: ['Stalling her with talk of a pending call', 'Excusing himself to go make a call now',
                'Telling her the shop called with news'], a: 0,
      cue: 'フィービーの質問のあと、Well で始まる返事。',
      line: 'Well, I have a *call in* about that.',
      said: '「その件なら、問い合わせ中なんだ」と答える。',
      mean: 'have a call in ＝ 問い合わせて返事待ち。それらしい言い訳で話を流している。',
      trap: 'call から「今から電話」「電話が来た」と取りやすい。Well で始まる返事はかわしの合図になりやすい。',
      use: 'I have a call in to the hotel.（ホテルに問い合わせ中です）' },

    // R fix: the key was the only sensible choice (V2); choices now parallel (“It signals…”); seg starts before “okay”
    //   so it no longer cuts it
    // why: stressing the truth ← “actually” read as 実際に/本当に; changing the subject ← after his dodge,
    //      “Okay. Actually…” sounds like a move away from her present
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', seg: [18.9, 23.6],
      stem: 'When Chandler says “Actually, this is for…”, what does “Actually” do?',
      choices: ['It signals he is correcting her guess', 'It signals he is stressing the truth',
                'It signals he is changing the subject'], a: 0,
      cue: '文の最初の一語。直前のフィービーの思い込みと比べて。',
      line: '*Actually*, this is for, uh, Kathy’s birthday.',
      said: '「実はね、これはキャシーの誕生日用なんだ」。',
      mean: 'Actually は「いや、そうじゃなくて」。相手の思い込み（自分へのプレゼント）を直している。',
      trap: '「実際に」「本当に」と訳すと、ただの強調に聞こえる。思い込みを直すときの合図と覚える。',
      use: 'Actually, I ordered the fish.（いえ、わたしは魚を頼みました）' },

    // R drop: d3 (“Who is the gift for?”) — never shipped, deleted. V3: m1's line and g1 already give it, and the
    //   choices made it a 90 % blind guess

    // R pass (seg start moved to 18.9 with m1 so “okay” isn't cut)
    // why: signed ← “the author's grandchildren” later; toy rabbit ← “the Velveteen Rabbit” right after
    { id: 'd2', skill: 'detail', level: 'B1', point: 'book', seg: [18.9, 23.6],
      stem: 'What exactly is the gift?',
      choices: ['An early edition of her favorite book', 'A copy signed by her favorite author',
                'A toy rabbit from her favorite story'], a: 0,
      cue: '「It’s」のあと、favorite の前までの語。',
      line: 'It’s an *early edition* of her favorite *book*.',
      said: '「彼女のお気に入りの本の、古い版なんだ」。',
      mean: 'early edition ＝ 出版されて間もないころの版。古書として価値がある。',
      trap: '後で author や rabbit が出てくるので、サインやぬいぐるみと取りやすい。物の名前は最初の説明で決める。',
      use: 'Do you have an older edition?（古い版はありますか）' },

    // R fix: the stem quoted the touching line, so “touched” was obvious (V2, S2); “bored” was a filler (K3).
    //   The stem no longer assumes one friend says both lines, and drops “she”. It mentions the book, so it reveals `book`
    // why: shocked ← “Oh my God” heard as alarm at the gift; worried ← Chandler's “don't touch it” comes right after
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'rabbit', reveals: ['book'], seg: [23.3, 29.4],
      stem: 'How does the friend who recalls a scene from the book sound?',
      choices: ['Moved; it’s a much-loved story', 'Shocked; the gift seems too much',
                'Worried; the book seems too fragile'], a: 0,
      cue: '本の名前が出たあと、続く言葉の中身。',
      line: 'Oh, my God, *when the boy’s love makes the rabbit real*.',
      said: '本の名前が出ると、「男の子の愛でうさぎが本物になるところ！」と名場面を口にする。',
      mean: '好きな話を思い出して、うっとりしている。贈り物への批判ではない。',
      trap: 'Oh my God は驚きにも感動にも使う。続く言葉が贈り物の話か、物語の話かで決める。',
      use: 'Oh my God, I love that song!（うわ、その曲大好き！）' },

    // R fix: the key was the only coherent choice (V2); the distractors are now his views too
    // why: damaged ← “destructive” heard alone; dirty hands ← “your fingers” + “oils” read as her hands in particular
    { id: 'i3', skill: 'infer', level: 'B2', point: 'oils', seg: [29.1, 33.6],
      stem: 'What does Chandler’s warning about “destructive oils” show?',
      choices: ['He treats the book as very precious', 'He thinks the book is already damaged',
                'He thinks her hands must be dirty'], a: 0,
      cue: '「don’t」で始まる注意と、その理由。',
      line: 'Okay, but *don’t touch it*, because your fingers have destructive oils.',
      said: '「触らないで。指の油が本を傷めるから」と注意する。',
      mean: '誰の指にもある油まで気にするほど、この本を大事にしている。',
      trap: 'destructive だけなら本が傷んでいる、fingers だけなら手が汚いと取りやすい。指の油は誰にでもある。',
      use: 'Please don’t touch the paintings.（絵に触らないでください）' },

    // R fix: “rip the book” was a filler (K3); now three parallel hair jokes
    // why: thinning ← the usual hair joke; huge ← big hair that might knock it over, a visual-joke reading
    { id: 'h1', skill: 'humor', level: 'C1', point: 'hair', seg: [29.1, 38.5],
      stem: 'Why does the line about Ross’s hair get a laugh?',
      choices: ['It hints Ross’s hair is greasy', 'It hints Ross’s hair is thinning',
                'It hints Ross’s hair is huge'], a: 0,
      cue: '直前の「oils」の話とつなげて。',
      line: 'Well, then you better keep it away from *Ross’s hair*.',
      said: '「それなら、ロスの髪からは離しておかないと」。',
      mean: '指の油でもダメなら、ロスの髪はもっと危ない、つまり髪がベタベタだというからかい。',
      trap: '髪の冗談は「薄い」が定番なので選びやすい。直前の oils の話を受けた冗談か考える。',
      use: 'Then you’d better hide it from my dog.（それならうちの犬から隠さないと）' },

    // R fix: the stem quoted the phrase under test (§9.2, S2) and the key was the only sensible choice (V2);
    //   seg now ends after “hair” (captions 37.8 s)
    // why: soft suggestion ← Japanese 〜したほうがいい is often mild; comparison ← “better” read as 比較
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'better', seg: [32.6, 38.5],
      stem: 'In the reply about Ross’s hair, what kind of advice is given?',
      choices: ['A firm warning: do it, or else', 'A soft suggestion: maybe do it',
                'A comparison: someone does it better'], a: 0,
      cue: 'Well, then のあと、keep の前の2語。',
      line: 'Well, then *you better* keep it away from Ross’s hair.',
      said: '「それなら、ロスの髪から離しておいたほうがいいよ」。',
      mean: 'you better は you’d better の会話形。「そうしないとまずいよ」という強めの忠告。',
      trap: '日本語の「〜したほうがいい」より強い忠告。better を比べる意味に取らない。',
      use: 'You better hurry, the train’s leaving.（急がないと電車が出るよ）' },

    // R fix: the key was the only full list (V2, K5); now three parallel three-step lists. The audio never says
    //   where he finally got it, so the stem asks what he did. seg ends at 49.4 (was 49.0, tight on “grandchildren”)
    // why: author himself ← “the author's” heard, “grandchildren” lost; libraries ← “bookstores” half-heard, a place for old books
    { id: 'd4', skill: 'detail', level: 'B2', point: 'how', reveals: ['couple'], seg: [38.4, 49.4],
      stem: 'What did Chandler do to find the book?',
      choices: ['Visited stores, spoke to dealers, phoned the author’s family',
                'Visited stores, spoke to dealers, phoned the author himself',
                'Visited libraries, spoke to dealers, phoned the author’s family'], a: 0,
      cue: '「I just went to」から続く、3つの行動。',
      line: 'I just went to a couple of *bookstores*, talked to a couple of *dealers*, called… the author’s *grandchildren*.',
      said: '本屋を回り、古書のディーラーに話を聞き、作者の孫にまで電話したと言う。',
      mean: '3つ並べて、どれだけ手を尽くしたかを伝えている。',
      trap: 'the author’s だけ聞くと作者本人と取りやすい。動詞と相手を順に追う。',
      use: 'I called a couple of shops.（いくつかの店に電話しました）' },

    // R fix: the key was the only nuanced choice (V2, K6); the distractors are now nuanced readings too.
    //   No ear check: the list right after contradicts the words
    // why: honestly easy ← the words taken at face value; paid less ← “deal” as in a good price (ディール)
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'deal', seg: [38.4, 49.4],
      stem: 'When Chandler says “it wasn’t a big deal”, what is he doing?',
      choices: ['Playing down how hard he tried', 'Saying honestly it was easy to find',
                'Hinting he paid less than it looks'], a: 0,
      cue: 'その言葉のすぐあとに続く、した事の一覧。',
      line: 'Oh, it *wasn’t a big deal*. I just went to…',
      said: '「大したことないよ」と言ってから、本屋、ディーラー、作者の孫と、した事を並べる。',
      mean: '言葉とは逆に、大変な手間をかけた。控えめに言って、かえって本気さが出ている。',
      trap: '言葉どおり「簡単」、deal から「安い」と取りやすい。あとに続く話で本音を見る。',
      use: 'Oh, it was nothing, really.（いや、本当に大したことないよ）' },

    // R drop: p2 (“it wasn’t a big deal” = not much trouble) — never shipped, deleted. Same point as a2, and
    //   “no big deal” is known vocabulary, so the choices answered it (V3)

    // R pass (seg start 41.6 → 41.0: it began inside “a big deal”)
    { id: 'x1', skill: 'dict', level: 'B2', point: 'couple', seg: [41.0, 45.2],
      stem: 'Type what Chandler says: “talked to ___ dealers.” (3 words)', answer: 'a couple of',
      cue: '「bookstores」のあと。同じ言い方がくり返される。',
      line: 'I just went to a couple of bookstores, talked to *a couple of* dealers',
      said: '「本屋を何軒か回って、ディーラーにも何人か話を聞いた」。',
      mean: 'a couple of ＝ 2つ3つ、いくつか。ちょうど2とは限らない、軽い言い方。',
      trap: 'a couple of は「アカプラ」と一続きになり、of がほぼ消える。弱い語も数えて書く。',
      use: 'Give me a couple of minutes.（2、3分ちょうだい）' },

    // R fix: the title gave away the yes/no key (V2, §9.4); now three readings that all fit the title, and no “she”
    // why: urging ← “what a great way to say I… love” taken as sincere encouragement;
    //      praising ← “great” taken literally
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'secret', seg: [50.4, 56.5],
      stem: 'What is the friend doing with “what a great way to say…”?',
      choices: ['Teasing Chandler about what the gift gives away', 'Urging Chandler to tell Kathy how he feels',
                'Praising the gift as a perfect birthday present'], a: 0,
      cue: '「to say」のあとに続く言葉の中身。',
      line: 'Yeah, and what a great way to say *I secretly love your roommate’s girlfriend*.',
      said: '「『同居人の彼女がひそかに好き』って伝えるのに最高だね」。',
      mean: 'ほめ言葉の形をとった皮肉。贈り物が重すぎて、気持ちがバレると指摘している。',
      trap: 'great はほめ言葉や応援に聞こえる。to say のあとが困った中身なら皮肉。',
      use: 'Great, just what I needed.（あーあ、それは困ったな）' },

    // R fix: “sure nobody will notice” was a filler (K3); a confident challenge is now the main distractor (ear check)
    // why: challenging ← “Does it?” read as a dare; the book ← “say” read as what the book's words say
    { id: 'i4', skill: 'infer', level: 'B2', point: 'doubt', seg: [50.4, 60.2],
      stem: 'What does Chandler’s “Does it?”, right after “It doesn’t say that”, show?',
      choices: ['He is starting to doubt his own denial', 'He is challenging them to prove it does',
                'He is asking what the book itself says'], a: 0,
      cue: '否定のあと、少し間をおいた短い質問。',
      line: 'It doesn’t say that. … *Does it?*',
      said: '「そんなこと言ってないよ」と否定した直後、「…言ってる？」と聞き返す。',
      mean: '言い切ったのに自信がなくなり、気持ちが表れているかもと不安になっている。',
      trap: '強気の「言ってないよね？」とも取れるが、否定のあと間をおいた短い質問は、自信が揺らいだ合図。',
      use: 'It’s not too late, is it?（まだ間に合うよね？）' },

    // R fix: the key was the only one about both gifts (V2, K5); all three now start “Joey's gift”
    // why: forgot ← a cheap gift read as no real gift; Kathy will love it ← the “simple gift wins” sitcom script
    { id: 'h2', skill: 'humor', level: 'C1', point: 'orange', seg: [60.0, 68.4],
      stem: 'Why does the question about Joey and an orange get a laugh?',
      choices: ['Joey’s gift looks like nothing next to his', 'Joey’s gift shows he forgot her birthday',
                'Joey’s gift is the one Kathy will love'], a: 0,
      cue: '「meaningful and expensive」と比べて。',
      line: 'when you get her something incredibly meaningful and expensive, and her boyfriend, Joey, gives her *an orange*?',
      said: '「高くて意味のある物を贈り、彼氏のジョーイはオレンジ1個。どう見える？」。',
      mean: '贈り物の差が大きすぎて、チャンドラーの気持ちが目立ってしまう、という誇張。',
      trap: 'オレンジ自体に意味があると考えやすい。and でつながる二つの贈り物の差に注目する。',
      use: 'How’s that going to look?（それ、どう見えると思う？）' },
  ]
};
