// REVIEW 2026-11-17: pass 6, fix 18, drop 0, new 0; ear checks 1. Blind pass first: 19 of 23 choice items at ≥ 50 %.
// REVIEW open: c1 and c2 (C2) had their one rewrite each; a cold read may still put them near 50 %. The audio settles both.
// REVIEW open: d2 (70 %) and f3 (90 %) were kept on content: d2 has no near miss that isn't co-true, and f3 tests the word itself.
// “Carly's Grandpa Returns! 👴 Full Scene | iCarly | NickRewind” (NickRewind, Best of the New iCarly 🎉): Carly is too
// busy to see her retired granddad, so she makes him her assistant; cut in are Pearl's “J-smops” and hamster story,
// an astrology chat (Millicent, Pearl's fan), and Granddad on the job: a blunt opinion, a “collab”, a “pot guy” call.
// Segments from the captions, words from whisper (2026-11-17). Captions run ~0.8 s behind whisper; their words drop
// or garble names (“Kyle” for Carly at 53 s, “Jace mop” for J-smop, “Millis it”). Speakers come from the words:
// Carly says “Granddad” (31 s, 65 s, 273 s), he says “Carly” (33 s, 53 s) and calls himself “your lowly assistant”
// (252 s); Pearl is named only as she leaves (153 s), so her stretch (98–134 s) names no speaker.
// Untested: 85–93 s (“an irregular cycle… Is your Peloton broken?”), 136–147 s and 155–159 s (jokes that need star-sign
// lore: “a quiet Aries”, “Total Aquarius move”), 167–240 s (birth charts, “your mother's pelvic angle”, “soulmates”:
// the speakers aren't named, and the sources split at 216–219 s and 238–243 s), 264–272 s (the yogurt that “helps me
// go”; captions “oh I'm pie” vs whisper “Key lime pie”), 288–290 s (“Me and the coins”), 315–326 s (the outro).
// EAR CHECK: 306.6 s n1 — whisper “The '60s are over”, captions “the sexies are over”
import type { Clip } from '../types.ts';

export const grandpaAssistant: Clip = {
  id: 'grandpaasst', video: 'eECvjcNXnq4', title: 'Carly\'s Grandpa Returns! 👴 Full Scene', dur: 333, wpm: 133,
  band: 'slow', tags: ['家', 'お願い・断り'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: K3/K6 — “fussing” in the key was the only parent-to-child word (blind 85 %), and the key was the only
    //   kind reading; the new “own words” distractor is the literal reading of “your”.
    // why: choose words ← the adult sense, “mind your words”; own words ← “your” heard as “not mine”, right after she
    //   lists her own three options
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'words', seg: [5.3, 12.4],
      stem: 'After offering water choices, Carly says “Use your words!” What does that usually ask?',
      choices: ['Just tell me out loud what you need', 'Choose your words more carefully',
                'Answer in your own words, not mine'], a: 0,
      cue: '水を3種類すすめたあとの、短い一言。',
      line: 'More water? Less water? Sparkling water? *Use your words!*',
      said: '水は多め？少なめ？炭酸？と聞いて、「言葉で言って！」と付ける。',
      mean: '泣いたりぐずったりする小さい子に言う定番。ここでは植物に言っているのが笑い。',
      trap: 'your を「自分の言葉で」と取ると言い換えの話になる。決まり文句は丸ごと覚える。',
      use: 'Use your words, buddy. What’s wrong?（言葉で言ってごらん。どうしたの？）' },

    // why: bought too many ← “shopping” + a long list sounds like a spending habit; for a show ← wigs as costumes
    { id: 'd1', skill: 'detail', level: 'B1', point: 'wigs', seg: [12.4, 20.0],
      stem: 'What does Carly admit about the wigs she shops for?',
      choices: ['She will never actually buy one', 'She has already bought too many',
                'She wants them for a show soon'], a: 0,
      cue: '忙しい理由のリストの最後、wigs のあと。',
      line: 'shopping for wigs that, let’s face it, *I’m never gonna buy*',
      said: '仕事のメール、植物カメラ、それに「どうせ買わないカツラ探し」で忙しい。',
      mean: '見るだけで買わない物まで「忙しさ」に入れている、という自虐。',
      trap: 'shopping と聞くと買い物好きに聞こえる。never gonna buy まで聞く。',
      use: 'I’m never gonna use this, am I?（これ、どうせ使わないよね）' },

    // R fix: K3 — “look at the screen” was a filler nobody picks (blind 80 %); the new distractor reads “let's” as an
    //   invitation to agree.
    // why: new topic ← an inserted phrase heard as a change of subject; agree ← “let's” heard as inviting the listener in
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'face', reveals: ['wigs'], seg: [12.4, 20.0],
      stem: 'In her list of tasks, what does Carly’s “let’s face it” add?',
      choices: ['An honest admission about herself', 'A shift to a brand-new topic',
                'A call for him to agree with her'], a: 0,
      cue: '「wigs that」のあと、文の途中に入る3語。',
      line: 'shopping for wigs that, *let’s face it*, I’m never gonna buy',
      said: '「カツラ探し、まあ正直、買わないんだけど」と途中にはさむ。',
      mean: 'let’s face it ＝「認めよう、正直なところ」。自分に不利な本当のことを言う前置き。',
      trap: 'let’s で「一緒に〜しよう」と誘う形に聞こえる。文の途中に入ったら本音の合図。',
      use: 'Let’s face it, we’re lost.（認めよう、道に迷ってる）' },

    // R fix: V2 — blind 70 %: the Harper choice was weak. It's now his system, which she calls “actually amazing”
    //   just before the offer.
    // why: his system ← “that system is actually amazing” heard as the plan; clears her days ← “I wish I had more
    //   time to spend with you” heard as the plan
    { id: 'g1', skill: 'gist', level: 'B1', point: 'hire', seg: [12.4, 84.95],
      stem: 'How does Carly end up dealing with being so busy?',
      choices: ['She makes her granddad her assistant', 'She starts using her granddad’s system',
                'She clears her days to see her granddad'], a: 0,
      cue: '彼の予定表を見たあと、「Wait」で始まる提案。',
      line: 'Wait, *you should be my assistant*.',
      said: '忙しくて祖父と過ごせない Carly が、整理上手な祖父をアシスタントにする。',
      mean: '仕事を手伝ってもらえて、一緒にいる時間もできる、という解決。',
      trap: 'amazing とほめるので方式をまねるように聞こえるが、直後の Wait のあとが答え。',
      use: 'You should be my travel buddy.（旅の相棒になってよ）' },

    // R fix: K3 — “wants the job herself” was weak (blind 50 %); the new distractor puts the dishwasher in the wrong
    //   relation.
    // why: during her dishes ← “dishwasher” heard, “her turn” lost; when busy ← “only comes up when” + Carly’s busy list
    { id: 'h1', skill: 'humor', level: 'C1', point: 'dishes', seg: [20.0, 27.7],
      stem: 'Why does Carly’s comment about Harper’s advice get a laugh?',
      choices: ['Harper gives it to get out of a chore', 'Harper gives it while Carly does the dishes',
                'Harper gives it only when Carly is busy'], a: 0,
      cue: '「but it usually only comes up」のあと。',
      line: 'but it usually *only comes up* when it’s *her turn to unload the dishwasher*',
      said: 'Harper がアシスタントを勧めるのは、いつも自分が食洗機を片付ける番のとき。',
      mean: '親切な助言に見えて、実は家事から逃げたいだけ、という皮肉。',
      trap: 'only comes up when は「〜のときに限って出る」。when のあとに本当の動機が来る。',
      use: 'It only comes up when the bill arrives.（会計のときに限ってその話になる）' },

    // R fix (its one rewrite): V2 — blind 75 %: “really telling her” pointed at the hidden reading, and “likes being
    //   left alone” was weak. The stem is neutral now, and the near miss is the sincere reading.
    // C2: what's withheld (the guilt-trip under a polite “don't worry”)
    // why: comfort ← the 遠慮 frame: “I've gotten used to it” taken at face value; rest ← “don't worry” heard as
    //   caring about her busy schedule
    // anchor: 29.2–31.1 s her “I wish I had more time to spend with you”, which he answers with 33.5–39.7 s “lonely and
    //   bored… reruns”; later 80.7–82.7 s he takes the job as “a great way for us to spend time together”
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'lonely', seg: [28.7, 40.6],
      stem: 'How does Granddad’s “Don’t worry about me, Carly” come across?',
      choices: ['As a hint that he’d love more of her time', 'As honest comfort so she won’t feel guilty',
                'As a nudge for her to rest more herself'], a: 0,
      cue: '「心配しないで」のあとに並ぶ、毎日の様子。',
      line: 'I just wish I had more time… — *Don’t worry about me*, Carly. Since I retired, I’ve gotten used to being *lonely and bored*.',
      said: '「もっと一緒にいたい」に「心配いらない。寂しくて退屈なのにも慣れた」と返す。',
      mean: '口では「気にするな」と言いながら、寂しさを並べて同情を引いている。言葉と中身が逆のときは、中身が本音。',
      trap: '日本語の遠慮のように「慣れたから平気」と取りやすい。あとで「一緒にいられる」と喜ぶのが答え。',
      use: 'Oh, don’t mind me. I’ll just eat alone.（気にしないで。一人で食べるから）' },

    // why: lonely ← (the key); busy ← Carly’s word just before; calm ← “retired” = a restful life (the usual picture)
    { id: 'd2', skill: 'detail', level: 'B1', point: 'lonely', seg: [31.2, 40.6],
      stem: 'How does Granddad describe his life since he retired?',
      choices: ['Lonely and bored', 'Busy but tiring', 'Calm and restful'], a: 0,
      cue: '「since I retired」のすぐあと。',
      line: 'Since I retired, I’ve gotten used to being *lonely and bored*.',
      said: '退職してから、寂しくて退屈なのにも慣れた、と言う。',
      mean: 'gotten used to ＋ -ing ＝「〜に慣れた」。いやな状態が続いている。',
      trap: '直前に Carly の busy があるので混ざりやすい。retired のあとの形容詞2つを聞く。',
      use: 'I’ve gotten used to working from home.（在宅勤務に慣れた）' },


    // R fix: N1 — the line had “no. No.”; both sources have one “Uh, no, not then.” V2 — blind 70 %: the new near
    //   miss hears “not then” as his time, and the stem no longer asks what she “finds” (she finds an odd entry).
    // why: open evening ← “then” heard as the start of a time; his slot ← “not then” heard as turning down his time
    { id: 'i1', skill: 'infer', level: 'B2', point: 'sched', seg: [40.8, 49.5],
      stem: 'When Carly checks her schedule for time with Granddad, how does it go?',
      choices: ['She can’t find a single slot that works', 'She finds a free evening that week',
                'She finds a slot, but he’s busy then'], a: 0,
      cue: '「find time」のあと、短い返事が続くところ。',
      line: 'Let me go through my schedule… Uh, *no, not then.*',
      said: '予定を見ながら「えーと、ダメ、そこもダメ」と候補を消していく。',
      mean: 'はっきり「時間がない」とは言わないが、空きが一つも見つからない。',
      trap: 'not then の then は「そのとき」。彼の都合ではなく、自分の予定を打ち消している。',
      use: 'Tuesday? No. Not then either.（火曜？ダメだ。そこもダメ）' },

    // R fix: V2 — blind 50 %: “planned around her” was weak; the new near miss keeps the TV but loses “all just”.
    //   N7 — the mean note's 「退屈」 gave away d2/c1; reworded.
    // why: many shows ← “watch” + a show title heard, “all just say” lost; too busy ← her own crowded schedule
    { id: 'i2', skill: 'infer', level: 'B2', point: 'system', seg: [52.6, 64.95],
      stem: 'What does Granddad’s own system suggest about his days?',
      choices: ['They are all spent the same way', 'They are spent on lots of TV shows',
                'They are too full for her visits'], a: 0,
      cue: '彼の予定表を見た Carly の、最初の一言。',
      line: 'Those *all just say* watch “Third Rock from the Sun.”',
      said: '「システムがない」と言って見せた予定表は、全部「再放送を見る」だけ。',
      mean: '整理はされているが、どの日も同じ番組を見るだけ。予定表の形をした冗談。',
      trap: 'system は立派な仕組みに聞こえる。all just say の just が「〜だけ」の合図。',
      use: 'It all just says “meeting.”（全部「会議」としか書いてない）' },

    // R fix: K6/V2 — blind 50 %: the key was the only “No”; “just being kind” is now a second “No”.
    // why: teasing ← the one-show schedule invites a joke; only kind ← the 気づかい frame after “lonely and bored”
    { id: 't1', skill: 'attitude', level: 'C1', point: 'amazing', reveals: ['hire', 'wait'], seg: [65.1, 75.75],
      stem: 'When Carly calls Granddad’s system “actually amazing”, is she being sarcastic?',
      choices: ['No; she is truly impressed by his system', 'Yes; she is teasing his one-show plan',
                'No; she is only being kind to him'], a: 0,
      cue: 'そのすぐあとに続く、彼女の提案と理由。',
      line: 'that system is *actually amazing*. Wait, *you should be my assistant*… you’re *super organized*',
      said: '「そのシステム、実はすごい」と言い、すぐ「アシスタントになって」と理由を並べる。',
      mean: 'actually は「意外にも本当に」。ほめ言葉が提案の根拠になっている。',
      trap: '中身がテレビだけなので皮肉や気づかいに聞こえる。次の頼みごとが本気の証拠。',
      use: 'That’s actually a great idea.（それ、意外といい考えだね）' },

    // R fix: S1/V2 — blind 80 %: “Just before her suggestion” told the key; the stem names the moment by “actually
    //   amazing” now. “check her list” became a noticed problem, the other common use of “Wait”.
    // why: stop talking ← wait = 待って (a literal “hold on”); a problem ← “Wait” as “something's wrong here”
    { id: 'm1', skill: 'marker', level: 'B2', point: 'wait', reveals: ['hire'], seg: [65.1, 72.4],
      stem: 'Right after “actually amazing”, Carly says “Wait”. What does it signal here?',
      choices: ['An idea has just come to her', 'She wants him to stop talking', 'She has just spotted a problem'], a: 0,
      cue: '「amazing」のすぐあとの一語と、その次の文。',
      line: 'that system is actually amazing. *Wait*, you should be my assistant.',
      said: 'ほめた直後に「待って、私のアシスタントになればいいんだ」と言う。',
      mean: '文頭の Wait ＝「あ、そうだ」。話の途中で思いついた合図。',
      trap: 'wait を「待って」「変だぞ」と取りやすいが、彼は話していない。次に新しい考えが来る。',
      use: 'Wait, why don’t we take the train?（あ、電車で行けばいいんじゃない？）' },

    // R fix (its one rewrite): S4/V2 — blind 60 %, and the key needed Harper's line at 20–27 s, outside the segment.
    //   The key now rests on the line itself: a chore listed as if it were a reason. The callback only supports it.
    //   Its reveals of hire went: the line and notes give reasons for a request, not the job (and with it, play 3
    //   could draw no C2).
    // C2: who the joke is on (a chore dressed up as a reason)
    // why: share ← “unloading” heard as a joint chore; teasing ← “You're bored”, the first reason, carried over
    // anchor: 25.3–26.5 s “only comes up when it's her turn to unload the dishwasher”; 76.3–77.3 s the same chore as his
    //   “reason”; 83.9 s he says “I'll start right now”
    { id: 'c2', skill: 'humor', level: 'C2', point: 'dishes', seg: [71.9, 84.95],
      stem: 'Why does Carly’s third reason, about the dishwasher, get a laugh?',
      choices: ['It’s a chore she’s passing off as a reason', 'She’s offering to share that chore with him',
                'She’s teasing him for having nothing to do'], a: 0,
      cue: '理由の3つ目。前の2つと何が違う？',
      line: 'You’re bored, you’re super organized, and *you love unloading the dishwasher*.',
      said: '「退屈で、整理上手で、食洗機の片付けが大好き」と頼む理由を並べる。',
      mean: '3つ目は理由ではなく、家事をついでに押しつけている。Harper が避けていた食洗機の話とも重なる。',
      trap: '理由が3つ並ぶと全部まじめに聞こえる。you love のあとに好きでもない家事が来たら冗談。',
      use: 'And you love doing the dishes, right?（それに皿洗い、好きでしょ？）' },

    // R fix: V2 — blind 55 %: “it’d be” was the one natural hypothetical; the full “it would be” now competes with it.
    // why: it’ll be ← the same weak vowel + l lost; it’s ← “it’d” shrinks to “id”, so the d is missed; it would be ←
    //   the textbook full form of the same meaning
    { id: 's1', skill: 'sound', level: 'B2', point: 'weird', seg: [75.75, 80.5],
      stem: 'Fill the gap: “Unless you think ___ weird.”',
      choices: ['it’s', 'it’d be', 'it’ll be', 'it would be'], a: 1,
      cue: '提案のあと、「think」に続く短い部分。',
      line: 'Unless you think *it’d be* weird.',
      said: '「変だと思うなら別だけど」と付け足す。',
      mean: 'it’d be は「イッビ」のように短く、d はほとんど止める音だけ。仮定の would。',
      trap: 'd を聞き落とすと it’s、弱い母音で it’ll に聞こえる。be があれば would か will。',
      use: 'Unless you think it’d be too much.（多すぎると思うなら別だけど）' },

    // why: from smoothies ← “smoothie pops” is the old version; final menu ← “menu” heard, “not finalized” lost
    { id: 'd3', skill: 'detail', level: 'B1', point: 'juice', seg: [98.0, 107.4],
      stem: 'What is new about the J-smops being shown off?',
      choices: ['They are made with juice', 'They are made from smoothies', 'They are on the final menu'], a: 0,
      cue: '「AKA」のあと、made them で始まる部分。',
      line: 'I took my smoothie pops, AKA Smops, and I *made them with juice*.',
      said: 'スムージーのアイス（Smops）を、ジュースで作ってみた。',
      mean: 'J は juice の J。前のスムージー版を作り変えた新作。',
      trap: 'smoothie は元の材料。menu も聞こえるが、まだ決まっていない（not finalized）。',
      use: 'I made them with honey this time.（今回ははちみつで作ったの）' },

    // R fix: V2 — blind 55 %: “hurt and gives up” was weak; the new near miss agrees too but loses the “but”.
    // why: defends the recipe ← “but” heard as a denial; nothing new ← “Yeah” heard, the “but” clause lost
    { id: 't2', skill: 'attitude', level: 'B2', point: 'smops', seg: [112.7, 118.5],
      stem: 'After “So, they’re just… popsicles?”, what does the reply show?',
      choices: ['She agrees, but is proud of the name', 'She disagrees and defends the recipe',
                'She agrees, and admits it is nothing new'], a: 0,
      cue: '返事の最初の一語と、but のあと。',
      line: '*Yeah, but I copyrighted* J-smops.',
      said: '「ただのアイス？」に「そうだけど、J-smops って名前は登録したから」。',
      mean: 'Yeah で認めて、but で胸を張る。中身は普通でも名前が自慢。',
      trap: 'but だけなら反論、Yeah だけなら降参に聞こえる。Yeah, but は両方まで聞く。',
      use: 'Yeah, but it’s my recipe.（そうだけど、私のレシピだから）' },

    // R fix: K3 — “never had any hamsters” was weak (blind 55 %); the new near miss keeps “buy a bunch” but loses
    //   “the ones who don't run away”.
    // why: at random ← “a bunch of hamsters” heard, the test lost; not real ← “I'm just kidding” aimed at the job
    { id: 'h2', skill: 'humor', level: 'C1', point: 'hamster', seg: [119.0, 134.6],
      stem: 'Why does her hamster story get a laugh after “I’m just kidding”?',
      choices: ['Her real method is even sillier than the joke', 'She admits she just picks hamsters at random',
                'She admits the therapy job is not real'], a: 0,
      cue: '「just kidding」のあと、本当のやり方の説明。',
      line: 'I’m just kidding. I *buy a bunch of hamsters*, and *the ones who don’t run away* get the gig.',
      said: '「共感力で選ぶ」と言ってから「冗談。たくさん買って、逃げなかった子を採用」。',
      mean: '冗談を取り消したのに、本当のほうがもっとでたらめ、という笑い。',
      trap: 'just kidding で全部うそだったと取りやすい。そのあとの「本当の話」まで聞く。',
      use: 'Just kidding. I actually flipped a coin.（冗談。実はコインで決めたの）' },

    // why: a treat ← hamsters and rewards; play a show ← katakana ギグ = a live music show
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'gig', reveals: ['hamster'], seg: [129.3, 134.6],
      stem: 'At the end of the hamster story, what does “get the gig” mean?',
      choices: ['get the job', 'get a treat', 'get to play a show'], a: 0,
      cue: '「run away」のすぐあと、最後の3語。',
      line: 'the ones who don’t run away *get the gig*',
      said: '逃げなかったハムスターが「その仕事をもらう」。',
      mean: 'gig ＝ 仕事、特に短期や1回の仕事。ここではセラピー役のこと。',
      trap: 'カタカナの「ギグ」はライブのこと。英語の gig は仕事全般にも使う。',
      use: 'I got the gig!（その仕事、決まった！）' },

    // R fix: K7 bank — the key was lengthened (the bank's key was strictly shortest in 10/21).
    // why: her chart ← “birth chart” comes right after; feel young ← the line quoted in the stem, echoed
    { id: 'd4', skill: 'detail', level: 'B1', point: 'astro', seg: [159.8, 167.2],
      stem: 'After “Agreeing with Millicent makes me feel young”, why does he want to learn astrology?',
      choices: ['To be able to talk about it with Pearl', 'To read Millicent’s birth chart', 'To feel as young as Millicent'], a: 0,
      cue: '「loves astrology」のあと、want to のところ。',
      line: 'Pearl loves astrology, and I want to be able to *talk to her about it*.',
      said: 'Pearl が星占い好きなので、その話ができるようになりたい。',
      mean: 'be able to talk ～ ＝「〜の話ができるようになる」。理由は Pearl。',
      trap: 'Millicent と feel young が直前に出るが、理由は and のあと。',
      use: 'I want to talk to Mom about it.（母とその話がしたい）' },

    // R fix: N7/V2 — blind 85 %: the stem's “your lowly assistant” gave away g1 (he's her assistant), so it's cut
    //   (the line still has it: reveals hire); “judge her work” was weak, and asking leave is the near miss now.
    // why: keep it to himself ← “not… to judge” heard as a refusal to judge; asks leave ← the preface heard as a
    //   question waiting for a yes
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'shoes', reveals: ['hire'], seg: [249.1, 257.6],
      stem: 'What does Granddad’s “Not for… to judge, but…” do?',
      choices: ['Sets up an opinion he then gives anyway', 'Shows he will keep his opinion to himself',
                'Asks her if he may give an opinion'], a: 0,
      cue: '前置きの最後の but のあと、短い一文。',
      line: 'Not for your lowly assistant to judge, *but here goes*. *Those shoes are ugly.*',
      said: '「下っ端の私が言うことじゃないけど、言うね。その靴、ダサい」。',
      mean: '控えめな前置きは、遠慮ではなく本音を言う予告。here goes ＝「じゃあ言うよ」。',
      trap: '日本語の「私なんかが」は黙る合図にもなるが、英語の but here goes は言う合図。',
      use: 'Not my place to say, but here goes.（私が言うことじゃないけど、言うね）' },

    // R fix: V2 — blind 75 %: two weak distractors; both are now near misses with one wrong half. B1 — the stem says
    //   he is her assistant, so it reveals g1's point.
    // why: tired ← “bored” was his word at the start; shy ← “is there anything else I can do” heard as timid
    { id: 'g2', skill: 'gist', level: 'B2', point: 'job', reveals: ['shoes', 'hire'], seg: [249.1, 299.8],
      stem: 'In these later scenes, how is Granddad doing as Carly’s assistant?',
      choices: ['Keen and useful, if a bit too frank', 'Useful, but already tired of the job',
                'Careful and polite, if a bit too shy'], a: 0,
      cue: '靴の話、食べ物、collab、電話。彼が何をしているか。',
      said: '頼まれる前に何かすることを聞き、予約を取り、電話にも出る。靴にははっきり意見。',
      mean: 'やる気があって役に立つ。ただ、正直すぎるところもある。',
      trap: '最初に「退屈」と言っていたので戻ったように思いやすいが、後半はずっと動いている。',
      use: 'Anything else I can do for you?（ほかに何かできることはある？）' },

    // R fix: K3 — “try harder” was weak (blind 65 %); the new near miss is the “asking for it” frame. B1 — a
    //   promotion means he works for her, so it reveals g1's point.
    // why: keeps asking ← beg = 頼む (literal); pushing his luck ← “begging for trouble”, the usual negative frame
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'promo', reveals: ['hire'], seg: [271.2, 278.85],
      stem: 'When Carly says Granddad is “begging for a promotion”, what does she mean?',
      choices: ['He’s doing so well he’s earning one', 'He keeps asking her for a better job',
                'He’s pushing his luck with her'], a: 0,
      cue: 'お菓子をもらった直後の、ほめ言葉の言い方。',
      line: 'Granddad, you are *begging for a promotion*.',
      said: 'おやつを用意してくれた彼に「昇進させてって言ってるようなもの」と言う。',
      mean: 'be begging for ～ ＝「〜を求めているも同然」。昇進に値する、というほめ言葉。',
      trap: 'beg を文字通り「頼む」と取ると、本人が言い出したように聞こえる。',
      use: 'That cake is begging to be eaten.（そのケーキ、食べてくれと言わんばかり）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'young', seg: [279.5, 286.4],
      stem: 'Type what Granddad says: “I ___ of young words on the web.” (4 words)', answer: 'looked up a list',
      cue: '「collab」を知っている理由。web で終わる文。',
      line: 'I *looked up a list* of young words on the web.',
      said: 'ネットで若者言葉のリストを調べたから、collab を知っている。',
      mean: 'looked up a list が「ルクタパリスト」と一息になる。look up ＝ 調べる。',
      trap: 'looked の ed は t の音で up とつながり、消えて聞こえる。',
      use: 'I looked it up online.（ネットで調べた）' },

    // why: ’50s/’70s ← the decade said fast, and -ties all sound alike; the pot joke fits any old decade
    { id: 'n1', skill: 'number', level: 'B1', point: 'sixties', reveals: ['pot'], seg: [302.0, 309.0], keep: true,
      stem: 'Which decade does Granddad say is over?',
      choices: ['The ’50s', 'The ’60s', 'The ’70s'], a: 1,
      cue: '「druggie」のすぐあと、the で始まる短い文。',
      line: 'My granddaughter’s not a druggie. *The ’60s* are over.',
      said: '「孫は薬なんかやらない。60年代は終わったんだ」と電話に言い返す。',
      mean: 'the ’60s ＝ 1960年代。若者と薬のイメージがある時代。',
      trap: 'sixties は「シクス」。fifties は「フィフ」、seventies は「セヴン」で始まる。',
      use: 'Come on, it’s not the ’90s anymore.（もう90年代じゃないんだから）', retired: true },

    // R fix: K3 — the age joke was weak (blind 50 %); the reversed mix-up uses the same two words in the wrong relation.
    // why: reversed ← “pot guy” and “pottery guy” both heard, the order lost; cooking pots ← pot = 鍋
    { id: 'h3', skill: 'humor', level: 'C1', point: 'pot', seg: [302.0, 314.6],
      stem: 'Why is Granddad’s angry reply to the caller funny?',
      choices: ['He takes a pottery seller for a drug dealer', 'He takes a drug dealer for a pottery seller',
                'He takes the caller for a cooking-pot salesman'], a: 0,
      cue: '電話のあと、Carly の説明の最後の一語。',
      line: 'It’s not the *pot guy*. It’s my *pottery guy*.',
      said: '電話の「pot の人？」に彼が怒るが、Carly は「陶芸の人」と言う。',
      mean: 'pot はくだけた英語で大麻。彼はそちらに取ったが、相手は pottery（陶芸）の業者。',
      trap: 'pot ＝ 鍋では通じない。not A, it’s B は B が本当。',
      use: 'Not that guy. The other one.（その人じゃなくて、もう一人のほう）' },
  ]
};
