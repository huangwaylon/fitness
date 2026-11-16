// “Parks and Recreation | Tom's Apartment (Episode Highlight)” (the official Parks and Recreation channel, Season 4):
// with Tom out, Ann sneaks Leslie into his apartment and shows off its comforts, telling the camera it's the apartment
// she's ready to say "I love you" to.
// Segments from the captions, words from whisper (2026-11-16). Leslie is named in the audio (42.2 s, by the host); Ann
// isn't, but the content settles her lines (she is the one "seeing" Tom, 7.7 s, and the one giving the tour); stems
// name the visitor only where it's settled and keep the rest neutral. Talk ends at ≈ 64 s, then music. Left out on
// purpose: "Here, feel it" (24 s: whisper only; the captions have "your… yep"), the blanket count (18–24 s: a list to
// remember, not to understand), "I love amenities. — I know." (55–56 s: who says which isn't settled), and "There's
// another soft one" (62–64 s: its point is on screen).
// REVIEW 2026-11-16: pass 5, fix 14, drop 0, new 0; ear checks 1
// OPEN: h1 and nt1 stay about 50 % blind, because the title names the apartment. nt1 can't take a second Tom
//   distractor (C2: no two distractors on one misreading), so both are left as they are.
// EAR CHECK: 42.2 s nt2 — the stress in “this is always here” falls on “always” (ship only once confirmed)
import type { Clip } from '../types.ts';

export const tomsApartment: Clip = {
  id: 'tomsapt', video: 'FI7nGY23d5k', title: 'Parks and Recreation | Tom\'s Apartment (Episode Highlight)',
  dur: 78, wpm: 148, band: 'slow',
  tags: ['恋愛', '家'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 — blind 65 %: "tidied up" was weak. Now "whether she's welcome to come in" (asking permission, not
    //   safety); "Is he gone?" refutes it.
    // why: weather ← coast + clear read word by word (海岸が晴れている); welcome ← a question at the door heard as asking
    //   permission (「入っていい？」)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'coast', seg: [0, 3.2],
      stem: 'What does Leslie want to know with her first question?',
      choices: ['Whether it’s safe to come in unseen', 'Whether the weather is nice outside',
                'Whether she is welcome to come in now'], a: 0,
      cue: '最初の一文。海の話ではない。',
      line: '*Is the coast clear?*',
      said: '入ってくるなり「だれもいない？」と小声で確かめている。',
      mean: 'The coast is clear ＝ 見張りや邪魔な人がいない、今なら安全。',
      trap: '文字どおりなら天気、戸口の質問なら「入っていい？」に聞こえる。決まった言い方で覚える。',
      use: 'Is the coast clear? Can I come out?（もう大丈夫？出ていい？）' },

    // R fix: V2 — blind 65 %: "sorry to have missed Tom" was weak. Now "hopes to catch Tom doing something" (the
    //   snooping script); "Is he gone?" refutes it.
    // why: surprise ← sneaking in to set up a surprise is the usual sitcom script; catch him ← sneak-around clothes read
    //   as spying on Tom
    { id: 'i1', skill: 'infer', level: 'B2', point: 'sneak', reveals: ['coast', 'gone'], seg: [0, 7.6],
      stem: 'Why does Leslie arrive the way she does?',
      choices: ['She doesn’t want Tom to know she’s there', 'She wants to set up a surprise for Tom',
                'She hopes to catch Tom doing something'], a: 0,
      cue: '着ている服の呼び方と、最後の質問。',
      line: 'Is the coast clear? … My *sneak around clothes*. *Is he gone?*',
      said: '「だれもいない？」と聞き、服は「こっそり用の服」、そして「彼、出かけた？」と確かめる。',
      mean: 'Tom に知られずに部屋を見に来ている。こっそりの訪問。',
      trap: 'こっそり＝サプライズや探り、と考えやすい。Is he gone? で確かめるのは留守かどうか。',
      use: 'Is he gone? Okay, come on in.（彼、行った？じゃあ入って）' },

    // R fix: V2 + K6 — blind 70 %: the title names the apartment, and the key was the only nuanced choice. Three
    //   readings of Ann's stake in the place now.
    // why: move in ← "ready to say I love you" + his apartment heard as the next step; spending ← "deeply in debt" (37 s)
    //   heard as the worry, "who cares" missed
    { id: 'g1', skill: 'gist', level: 'C1', point: 'tour', reveals: ['apartment'], seg: [0, 66],
      stem: 'What does the whole visit show about Ann?',
      choices: ['Ann loves his place more than him', 'Ann is hoping to move in with Tom',
                'Ann is worried about Tom’s spending'], a: 0,
      cue: 'Tom 本人の話がどれだけ出るか。',
      said: 'Tom の留守に部屋を案内し、毛布、飲み物、チーズ、化粧品、室温と、部屋の自慢を続ける。',
      mean: 'ほれているのは彼本人より、彼の暮らし。そのずれが場面の笑い。',
      trap: '借金の話や「愛してる」から、心配や同居の話に見えやすい。話題はずっと部屋の中の物。',
      use: 'Honestly, I’m mostly here for the food.（正直、目当ては料理なんだ）' },

    // R fix: V2 — blind 55 %: "he's coming. Come in." didn't make sense. Now "he's home", a near sound (long o +
    //   nasal) that fits "Come in".
    // why: going ← the final n of "gone" heard as the -ing of "going" (he's leaving now); home ← the same long vowel and
    //   nasal ending, and "Come in" fits a host at home
    { id: 's1', skill: 'sound', level: 'B2', point: 'gone', seg: [4.2, 7.6],
      stem: 'Fill the gap: “Yeah, ___. Come in.”',
      choices: ['he’s gone', 'he’s going', 'he’s home'], a: 0,
      cue: '質問への答え。語の終わりの音。',
      line: 'Yeah, *he’s gone*. Come in. You gotta see this.',
      said: '「うん、出かけた。入って。これ見てよ」。',
      mean: 'gone は「ゴーン」と n で止まる。直前の質問 Is he gone? をそのまま受けた答え。',
      trap: 'going なら語尾に「ング」が付き、「今出るところ」になる。答えは質問の形をなぞることが多い。',
      use: 'Are they gone? — Yeah, they’re gone.（帰った？—うん、帰った）' },

    // why: days ← "few" + a new romance; months ← "weeks" and "months" both end in a hiss after a short vowel
    { id: 'n1', skill: 'number', level: 'B1', point: 'weeks', seg: [7.3, 10.3], keep: true,
      stem: 'How long have Ann and Tom been seeing each other?',
      choices: ['A few days', 'A few weeks', 'A few months'], a: 1,
      cue: '「for a few」のあと。',
      line: 'Tom and I have been seeing each other for *a few weeks*',
      said: '「Tom と付き合って数週間」と話している。',
      mean: 'see each other ＝ 付き合っている。会っているだけの意味ではない。',
      trap: 'weeks と months は語尾がどちらも「ス」。真ん中の母音「ウィー」を聞く。',
      use: 'We’ve been seeing each other for a month.（付き合って1か月なんだ）' },

    // R fix: V2 — blind 70 %: "said many times" was weak. Now "really about his money", the near miss (his wealth, not
    //   his place).
    // why: too soon ← "a few weeks" + "ready to say I love you" read as the usual too-fast romance; money ← a fancy
    //   apartment heard as a joke about his wealth
    { id: 'h1', skill: 'humor', level: 'C1', point: 'apartment', reveals: ['weeks'], seg: [7.3, 15],
      stem: 'Why does Ann’s talk to the camera get a laugh?',
      choices: ['Her “I love you” turns out to be for his place', 'Her “I love you” comes after only a few weeks',
                'Her “I love you” is really about his money'], a: 0,
      cue: '「I love you」のあと、少し間があってからの3語。',
      line: 'I think I’m ready to say *I love you*… *to his apartment*.',
      said: '「そろそろ『愛してる』を言えそう…彼の部屋に」と言う。',
      mean: '恋の告白の型で始めて、最後に相手が部屋だと明かす。間が落ちを作る。',
      trap: '数週間で早い、お金目当て、と聞こえやすい。最後の3語で、相手が人ではなく部屋だと分かる。',
      use: 'I think I’m in love… with this sandwich.（恋したかも…このサンドイッチに）' },

    // anchor: 13.1–14.2 s "…I love you… to his apartment" (to camera), then 14.5–18.1 s "I love you so much" in the
    //   scene, before anyone else speaks: the target was named a second earlier
    // why: practice ← "ready to say I love you" heard as a plan, so the line sounds like a rehearsal for Tom; to Leslie
    //   ← she's the only other person in the room
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'apartment', seg: [7.3, 18.3], retired: true,
      stem: 'After her comment to the camera, how should we hear “I love you so much”?',
      choices: ['As said to the apartment itself', 'As practice for saying it to Tom', 'As said to Leslie for coming by'], a: 0,
      cue: 'カメラへの一言の最後と、直後の場面を比べて。',
      line: 'ready to say I love you… *to his apartment*. … *I love you so much.*',
      said: 'カメラに「彼の部屋に愛してると言えそう」と話し、場面に戻ると「大好き」と言う。',
      mean: 'カメラへの一言が、直後の場面の聞き方を決める。「大好き」の相手は部屋。人への練習ではない。',
      trap: 'ready to say から、Tom に言う練習と聞きやすい。この形式では、カメラへの言葉が答え合わせになる。',
      use: 'Oh, I’ve missed you, my own bed.（会いたかったよ、わが家のベッド）' },

    // R fix: V2 — blind 60 %: the key was the only specific choice. Now "saving the bedroom for last" matches its form.
    // why: best first ← "this is the best part" heard as an opener; bedroom ← the usual end of a home tour
    { id: 'g2', skill: 'gist', level: 'B2', point: 'order', reveals: ['degrees', 'best'], seg: [18, 61],
      stem: 'How does Ann’s tour build, from start to finish?',
      choices: ['Item after item, saving the heat for last', 'From the very best thing down to small ones',
                'Item after item, saving the bedroom for last'], a: 0,
      cue: '最後に出てくる「一番いいところ」が何か。',
      said: '毛布、飲み物、チーズ、化粧品と次々に見せ、最後に「一番いいところ」として室温を出す。',
      mean: '細かい自慢を積み上げて、最後に一番を出す流れ。',
      trap: '最初に一番、最後に寝室、が普通に思えるが、最後は数字と degrees。寝室は出てこない。',
      use: 'And now, for the best part.（そしていよいよ、一番いいところ）' },

    // R fix: V2 — blind 80 %: "annoyed it isn't hers" was a filler. Now "surprised at how thin it is" (right feeling,
    //   wrong direction).
    // why: price ← "holy hell" heard as shock at a cost; thin ← surprise heard, the word "soft" missed
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'soft', seg: [24.7, 29.2],
      stem: 'At “Holy hell…”, how does she react to the blanket?',
      choices: ['Amazed at how soft it is', 'Shocked at how much it cost', 'Surprised at how thin it is'], a: 0,
      cue: '「Holy hell」のすぐあとの一語。',
      line: '*Holy hell*, that *soft*.',
      said: '毛布にさわって「うそ、やわらかい！」と声を上げる。',
      mean: 'Holy hell はくだけた驚きの声。ここでは感動。hell があっても怒りではない。',
      trap: 'hell を聞くと悪い驚きに聞こえやすい。驚きの中身は続く一語。soft なら、ほめている。',
      use: 'Wow, this is so comfy.（わあ、これすごく気持ちいい）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'shelf', seg: [28.9, 31.1],
      stem: 'Type what Ann says: “Yep, ___ coconut water.” (4 words)', answer: 'a whole shelf of',
      cue: '「Yep」のあと、coconut の前まで。',
      line: 'Yep, *a whole shelf of* coconut water.',
      said: '「そう、ココナッツウォーターが棚まるごと」。',
      mean: 'shelf of が「シェルフォヴ」とつながる。a whole ～ of ＝「〜まるごと」。',
      trap: 'a と of が弱く、2語に聞こえやすい。whole の前後に小さい語があると思って聞く。',
      use: 'I ate a whole box of cookies.（クッキーを箱ごと食べちゃった）' },

    // R fix: K1 — the speaker of "gonna cry" asks "Did he do all of this just for you?" next, so "she thinks it's a
    //   romantic gift" was defensible. Now "overwhelmed; too much".
    // why: overwhelmed ← "gonna cry" heard as being swamped (too much); upset ← "I'm gonna cry" taken literally, as
    //   sadness
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'cry', seg: [30.8, 36.4],
      stem: 'When one of them says she might cry, how does she feel?',
      choices: ['Thrilled; the place is a dream come true', 'Overwhelmed; it’s all a bit too much',
                'Upset; it makes her own home look poor'], a: 0,
      cue: '「gonna cry」のあと、This is like に続く言葉。',
      line: 'I think I’m *gonna cry*. This is like *girl heaven*.',
      said: '「泣きそう。女子の天国みたい」と言う。',
      mean: 'うれしさのあまり泣きそう、という意味。girl heaven が気持ちを決める。',
      trap: '泣く＝悲しい、つらい、と取りやすい。泣きそうの理由は直後の一言で決まる。',
      use: 'This view is so pretty, I could cry.（景色がきれいすぎて泣けそう）' },

    // R fix: V2 — blind 70 %: "for a party" was weak. Now "keeps it nice for guests" (near the key: not for her, but
    //   still for others).
    // why: for Ann ← the question itself offers that reading; for guests ← "not just for you" heard as "for everyone
    //   who visits"
    { id: 'd4', skill: 'detail', level: 'B1', point: 'lives', seg: [32.9, 36.4],
      stem: 'Did Tom set all this up for Ann?',
      choices: ['No, it’s how he always lives', 'Yes, he did it to impress her', 'No, he keeps it nice for guests'], a: 0,
      cue: '質問への答え、No のあと。',
      line: 'Did he do all of this just for you? — No, *he just lives like this*.',
      said: '「全部あなたのため？」と聞かれ、「ううん、いつもこうなの」と答える。',
      mean: 'just はここで「ただ普通に」。特別なことではなく、彼の日常。',
      trap: 'just for you の just と混ざりやすい。答えの just は「単に、いつも」。',
      use: 'No, he’s just like that.（ううん、あの人はいつもああなの）' },

    // R fix: V2 — blind 65 %: "a sadder topic" was weak. Now "admitting the debt bothers her" (the opposite stance).
    // why: real question ← "you know what?" heard as asking Leslie's view; bothered ← "deeply in debt, but" heard as
    //   leading into a real worry
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'debt', seg: [36, 39.75],
      stem: 'What is Ann doing with the words right after mentioning Tom’s money?',
      choices: ['Waving away a worry she just raised', 'Asking Leslie what she thinks of it',
                'Admitting the debt does bother her'], a: 0,
      cue: '「debt」のあと、but に続く短い問い。',
      line: 'He’s deeply in debt, but *you know what? Who cares?*',
      said: '「借金まみれなんだけど、まあいいじゃない？」と言う。',
      mean: 'Who cares? は答えを求めない問い。「気にしない」と自分で片付けている。',
      trap: '疑問の形なので、意見を聞いていると取りやすい。答えを待たずに次へ進む点に注目。',
      use: 'It’s a bit pricey, but who cares?（ちょっと高いけど、気にしない）' },

    // R fix: V2 — blind 70 %: "her savings" was weak. Now "the fun of sneaking in" (what she's doing right now).
    // why: Tom himself ← the romance script (love outweighs money); sneaking in ← the secret visit is what the scene
    //   opened on
    { id: 'i2', skill: 'infer', level: 'C1', point: 'debt', seg: [36, 42.1],
      stem: 'What does Ann put ahead of Tom’s money problems?',
      choices: ['The treats and comforts in his place', 'Her real feelings for Tom as a person',
                'How much fun it is sneaking in here'], a: 0,
      cue: '「Who cares?」のあと、’Cause で始まる部分。',
      line: 'Who cares? *’Cause check it out.* *Cheese plate and Adriatic figs.*',
      said: '「どうでもいい、だって見て。チーズの盛り合わせとイチジク」と続ける。',
      mean: '’Cause のあとが、気にしない理由。理由は彼の人柄ではなく、ぜいたく品。',
      trap: '恋の話なら「彼が好きだから」が来るはず。’Cause のあとに何が来たかで決める。',
      use: 'Who cares about the rain? We have pizza.（雨なんかいいよ、ピザがある）' },

    // anchor: 42.2–46.1 s "this is always here. I don't know when he has time to make it": the next line is about how
    //   often (when he has time), which only a stress on "always" sets up
    // why: on "here" ← the last content word takes the stress by default, and she is showing a place; on "this" ← she's
    //   pointing at one plate among many things
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'cheese', seg: [41.7, 44.7], retired: true,
      stem: 'In “this is always here”, where is the main stress, and why?',
      choices: ['On “always”: it is there every single time', 'On “here”: it is kept in this spot, not elsewhere',
                'On “this”: this plate, not the other treats'], a: 0,
      cue: '4語のうち、いちばん強く長い語。次の文ともつなげて。',
      line: 'Leslie, this is *always* here.',
      said: '「ねえ、これ、いつ来てもあるの」と言う。always が強く、少し長く聞こえる。',
      mean: '強勢は伝えたい対比に置かれる。always が強いと「たまたまじゃない」。次の文につながる。',
      trap: '文末の here を強く読む癖があると、場所の話に聞こえる。強勢の語と、次の文の中身を合わせて判断。',
      use: 'He’s always on time.（彼は毎回、時間どおりなんだ）' },

    // R fix: V2 — blind 55 %: "never offers her any" was weak. Now "how he can afford it" (from “deeply in debt”, 37 s).
    // why: figs ← "Adriatic figs" is the exotic word heard just before; afford ← "deeply in debt" a few seconds earlier
    { id: 'd5', skill: 'detail', level: 'B2', point: 'cheese', seg: [41.7, 46.35],
      stem: 'What puzzles Ann about the cheese plate?',
      choices: ['When he finds time to keep it ready', 'Where he finds such unusual figs',
                'How he can afford it, being in debt'], a: 0,
      cue: '「I don’t know」のあとの、疑問の中身。',
      line: 'Leslie, this is always here. *I don’t know when he has time to make it.*',
      said: '「これ、いつもあるの。いつ作ってるのか分からない」と言う。',
      mean: 'いつ来ても用意されている、という驚き。彼の暮らしの手のかけ方。',
      trap: '珍しい語 Adriatic や、少し前の借金の話が耳に残りやすい。I don’t know のあとが疑問の中身。',
      use: 'I don’t know when she finds the time.（いつそんな時間があるんだろう）' },

    // R fix: V2 — blind 75 %: "like a nice hotel has" leaned on the katakana アメニティ, and "gifts" was weak. Now
    //   "beauty products just for women" (eye cream, lip exfoliator), refuted by "unisex cologne" and the Sudoku book.
    // why: furniture ← the tour began with blankets, an ottoman and a couch; for women ← most of the list is cosmetics,
    //   and Leslie just said "girl heaven"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'amenities', seg: [46, 56.05],
      stem: 'What does Ann mean by the word she sums up the list with?',
      choices: ['Little extras that make life comfy', 'Beauty products made just for women',
                'Costly pieces of furniture and decor'], a: 0,
      cue: 'リストの最後、「everywhere」の前の一語。',
      line: 'eye cream, unisex cologne… and a Sudoku book. Just *amenities* everywhere.',
      said: 'アイクリーム、香水、アーモンド、数独の本と並べ、「アメニティだらけ」と言う。',
      mean: 'amenities ＝ ホテルのような、暮らしを快適にする小物や設備。',
      trap: '家具の話や化粧品の多さに引かれやすい。unisex や数独の本もあり、中身は快適グッズ。',
      use: 'The hotel has great amenities.（そのホテルは設備や備品がいい）' },

    // R fix: V2 — blind 70 %: the key was the only plain, everyday thing. Now "the fridge, kept full" is plain too.
    // why: fridge ← "night and day" heard as "always stocked", after the coconut-water shelf; hot tub ← "80 degrees"
    //   heard as water temperature
    { id: 'h2', skill: 'humor', level: 'C1', point: 'best', reveals: ['degrees'], seg: [56, 61],
      stem: 'Why is what Ann calls “the best part” funny?',
      choices: ['It’s just the heating, left on high all day', 'It’s just the fridge, kept full all day long',
                'It’s just a hot tub that is always ready'], a: 0,
      cue: '「the best part」のあとの数字と、そのあとの言葉。',
      line: 'This is *the best part*. *80 degrees, night and day.*',
      said: '「一番いいところはこれ。昼も夜もずっと暖かいの」と言う。',
      mean: '豪華な品を並べたあと、最高のものが室温。しかも借金がある人の部屋で。',
      trap: 'night and day を「いつも満タン」、degrees をお湯の温度と取りやすい。部屋の暖かさの話。',
      use: 'The best part? Free parking.（一番いいところ？駐車場がタダ）' },

    // why: 18 ← -teen/-ty, and 18 °C sounds like a normal room; 88 ← "eighty" heard twice in a fast run
    { id: 'n2', skill: 'number', level: 'B1', point: 'degrees', seg: [56.9, 60.5], keep: true,
      stem: 'What temperature does Ann say the apartment is kept at?',
      choices: ['18 degrees', '80 degrees', '88 degrees'], a: 1,
      cue: '「the best part」のあと、degrees の前。',
      line: '*80 degrees*, night and day.',
      said: '「昼も夜もずっと80度」と言う。アメリカでは華氏で、約27度。',
      mean: 'night and day ＝ 一日中ずっと。暖かさも、この部屋の自慢の一つ。',
      trap: 'eighteen は後ろの「ティーン」が強い。eighty は前の「エイ」が強く、ティは短い。',
      use: 'It’s open night and day.（昼も夜も開いてるよ）' },
  ]
};
