// REVIEW 2026-11-16: pass 6, fix 14, drop 0, new 0; ear checks 1
// Q: a2, i1, i2, a1 and nt2 still blind-read at 60–75 % through Bobby's known character (dim, carefree, rich), not
//   through the choices; keep, or rebuild around lines that cut against type?
// Q: h2 keys on knowing "Toy Story" is a cartoon (Buzz Lightyear); fine for these learners, or world knowledge?
// “Bobby Newport Returns to Pawnee | Parks and Recreation” (the official Parks and Recreation channel, Season 7):
// visitors offer Bobby Newport a two-month stint as interim mayor; he loves the idea but is off to space, pitches the
// trip (and its $600,000 deposit) to Ben, and won't believe the man who says he walked on the moon.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈68.5 s. Untested: 0–8 s (the greeting
// and "Is she still, um…", which needs the Leslie backstory), 29.9 s ("that'll" in the captions, "that would" in
// whisper), 43.6 s (whisper's "What's that?", not in the captions), the speakers of 18.5 s and 40.2 s (no names), and
// "the guy from Toy Story" as a reference (world knowledge; h2 keys only on "Nice try" and his doubt).
// EAR CHECK: 38.1–43.1 s a2 — "Everything in life is always just so fun, right?" keyed as sincere (the words back it:
//   he has just called both plans fun and praises the one who agrees); confirm it isn't said with a sneer
import type { Clip } from '../types.ts';

export const newport: Clip = {
  id: 'newport', video: 'oFYN0nBXcos', title: 'Bobby Newport Returns to Pawnee', dur: 80, wpm: 163,
  band: 'mid', tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2/K6, the key was the only two-part choice (blind 55–70 %); all three are now "He …; he …"
    //   2nd blind read 70 % (forgetful Bobby): a second memory reading replaces "won't run again"
    // why: corrects them ← "mayor" is the job heard later, read as the race; rather forget ← "hard to remember"
    //   heard as not wanting to, but "if you say so" just accepts what he can't recall
    { id: 'i1', skill: 'infer', level: 'B2', point: 'forgot', reveals: ['boring'], seg: [9.8, 18.45],
      stem: 'When told what he ran for, how does Bobby respond?',
      choices: ['He goes along with it; he can’t recall it', 'He corrects them; he says it was for mayor',
                'He jokes; he says he’d rather forget it'], a: 0,
      cue: '答えを聞いたあとの「All right」に続く一言。',
      line: 'City councilor. — All right, *if you say so*.',
      said: '「何に出たっけ？」「市議会議員」に、「そう言うなら」と返す。',
      mean: 'if you say so ＝「そう言うなら」。覚えていないし、気にもしていない。',
      trap: 'remember を「忘れたい」と取りやすいが、これは覚えていないまま流す返事。',
      use: 'Okay, if you say so.（まあ、君がそう言うなら）' },

    // R fix: V2, the stem named "remembering" (i1's key) and "forgets which city" was a filler; the stem now points
    //   at "I tell you…", and the filler is now a keyword trap on "hard"
    // why: too hard ← "so hard" heard as the race being hard; calls the visitors boring ← "boring" heard, and they are
    //   the ones talking to him
    { id: 'h1', skill: 'humor', level: 'C1', point: 'boring', seg: [12.0, 18.45],
      stem: 'Why does Bobby’s “I tell you…” remark get a laugh?',
      choices: ['He calls his own election boring stuff', 'He says the race was too hard for him',
                'He hints that his visitors are boring'], a: 0,
      cue: 'hard to remember のあと、それを何と呼ぶか。',
      line: 'it’s so hard to remember *boring stuff like that*.',
      said: '「こういう退屈なことって、覚えるの本当に大変だよ」と言う。',
      mean: '自分が出た選挙を「退屈なこと」と呼ぶ。その変さに本人だけが気づいていない。',
      trap: 'boring で、目の前の人を退屈と言ったと取りやすい。like that は直前の話題。',
      use: 'I’m bad at remembering stuff like that.（そういうの覚えるの苦手で）' },

    // C2: why the remark is better ignored (cf. pr1)
    // anchor: 12.8–18.3 s Bobby calls the city councilor race "boring stuff" he can't remember; 18.5–22.4 s at once,
    //   "Choosing to ignore what you just said, we need an interim mayor": they are about to offer him a city job
    // R fix: V2 (blind 60 %), "already saying no" had no basis before the offer; replaced with a near miss on
    //   "hard to remember"
    // why: still upset ← a race comes up, so hurt pride is the script, but he barely recalls it ("if you say so");
    //   forgotten them ← "hard to remember" stretched to the visitors, but only the race is forgotten
    // retired: it reveals g1's point, so play 3+ under g1 drew no C2
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'ignore', reveals: ['boring', 'offer'], seg: [12.0, 23.85], retired: true,
      stem: 'Why would the visitor rather ignore what Bobby just said?',
      choices: ['It makes him sound wrong for a city job', 'It shows he is still upset about the race',
                'It shows he has forgotten who they are'], a: 0,
      cue: '聞き流したい発言と、そのすぐあとの頼みごと。',
      line: 'so hard to remember *boring stuff* like that. — *Choosing to ignore* what you just said, we need an interim mayor…',
      said: '市の役職を「退屈」と言った直後、「今のは聞かなかったことに。臨時の市長が必要で」と続く。',
      mean: 'これから市の仕事を頼む相手が、市の仕事を退屈と言った。都合が悪いので、あえて流して本題に入る。',
      trap: '選挙の話なので悔しさを読みたくなるが、本人はほぼ覚えていない。忘れたのは選挙で、相手ではない。',
      use: 'Let’s pretend you didn’t say that.（今のは聞かなかったことにしよう）' },

    // R fix: V2 (blind 70 %), the key was the only "mayor" choice; "run for mayor" now shares it
    // why: run next year ← "ran for" comes first, then "mayor"; money ← "your family name" heard as the family fortune
    { id: 'g1', skill: 'gist', level: 'B1', point: 'offer', seg: [12.0, 31.0],
      stem: 'Why have the visitors come to see Bobby?',
      choices: ['To ask him to be mayor for a short time', 'To ask him to run for mayor next year',
                'To ask him to give money to the city'], a: 0,
      cue: '「Choosing to ignore」のあと、何が必要と言うか。',
      line: 'we need an *interim mayor*… I thought you might be interested.',
      said: '「臨時の市長が必要で、興味はないかと思って」と話を切り出す。',
      mean: 'interim mayor ＝ 臨時の市長。選挙の話ではなく、短い間まかせたいという誘い。',
      trap: 'ran や mayor から次の選挙に思えるが、用件は need のあと。',
      use: 'I thought you might be interested.（興味があるかと思って）' },

    // R fix: K7/V2, the key was the longest and only nuanced choice (blind 65–70 %); now three moves of equal length
    // why: pretends not to hear ← "ignore" heard as 聞こえないふり; sorry ← the Japanese frame: an awkward moment
    //   answered with an apology
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'ignore', seg: [17.8, 23.85],
      stem: 'How does the visitor move on from Bobby’s remark?',
      choices: ['Sets it aside out loud and moves on', 'Says sorry for bringing the race up',
                'Acts as if it was never heard at all'], a: 0,
      cue: '本題の前に付けた、短い前置き。',
      line: '*Choosing to ignore what you just said*, we need…',
      said: '「今言ったことは聞かなかったことにして」と前置きして、本題に入る。',
      mean: 'あえて聞き流す、と口に出して言っている。あきれつつ本題へ進む合図。',
      trap: '聞こえなかったふりなら黙って流すはず。ここは「無視する」と声に出している。',
      use: 'Anyway, moving on.（まあ、それはさておき）' },

    // keep: ascending. why: two weeks ← "two" caught, the unit lost; twelve months ← two/twelve share an onset;
    //   two years ← a mayor's usual term
    // R fix: N7, the line names the interim mayor (g1's key), so it reveals `offer`
    { id: 'n1', skill: 'number', level: 'B1', point: 'months', reveals: ['offer'], seg: [20.5, 23.85], keep: true,
      stem: 'How long would the job last?',
      choices: ['Two weeks', 'Two months', 'Twelve months', 'Two years'], a: 1,
      cue: '「interim mayor」のすぐあと、just for のあと。',
      line: 'we need an interim mayor *just for two months*',
      said: '「臨時の市長が必要なの。2か月だけ」と言う。',
      mean: 'just for ～ ＝「〜だけ」。短い期間だと強調して、頼みを軽く見せている。',
      trap: 'two と twelve は出だしが同じ。months の前が一音節なら two。',
      use: 'It’s just for two weeks.（2週間だけだよ）' },

    // R fix: V2 (blind 55–60 %), only the key had "name"; a distractor now shares "family's name" and turns on money
    // why: name and money ← "family name" heard as a rich family; the race ← "ran for" earlier, read as his record
    { id: 'd1', skill: 'detail', level: 'B2', point: 'whyhim', seg: [23.3, 29.2],
      stem: 'Why do they think Bobby is right for it?',
      choices: ['His family’s name and how well people like him', 'His family’s name and how much money it has',
                'His time in the race and how well he did in it'], a: 0,
      cue: '「given」のあと、二つ並ぶ理由。',
      line: 'given *your family name* and *how well-liked you are*',
      said: '「家の名前があるし、みんなに好かれているから」と理由を挙げる。',
      mean: 'given ～ ＝「〜を考えると」。理由を前に出す言い方。well-liked ＝ 人気。',
      trap: '有名な一家なのでお金と思いやすいが、name の次は好かれ方。and の後ろも聞く。',
      use: 'Given the weather, let’s stay in.（この天気だし、家にいよう）' },

    // R fix: V2/K6 (blind 75–80 %), the key was the longest and only two-part choice; now all three "He likes… / He
    //   turns it down…" of similar length; d2's stem no longer says "can't do it"
    // why: takes it later ← "That'll be really fun, too" heard as both plans fitting in; suggests Ben ← Ben is asked a
    //   question later, but about space
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', seg: [27.0, 69.5],
      stem: 'How does the offer turn out?',
      choices: ['He likes the idea, but turns it down for his trip', 'He likes the idea, and will take it once he’s back',
                'He turns it down and suggests Ben take it instead'], a: 0,
      cue: '「Mayor?」のあと、though で終わる文。',
      line: 'Man, that’d be fun! God, *I don’t think I can do it, though*.',
      said: '「楽しそう」と喜ぶが「でも無理だと思う」と断り、自分の予定の話へ。',
      mean: '文末の though が、前の「楽しそう」を打ち消す。乗り気でも答えは no。',
      trap: '「それも楽しい」と続くので後で受けそうに聞こえるが、I don’t think I can。',
      use: 'I’d love to, but I can’t.（ぜひやりたいけど、無理なんだ）' },

    // R fix: V2 (blind 70–75 %), "asks them to say it again" was weak; now "doubtful" (the literal "What?"); the line
    //   drops "Mayor?" so it doesn't state g1's key, and a2's stem no longer says "fun"
    // why: worried ← mayor = hard work, the usual reaction; doubtful ← "What?" heard as disbelief, but "Man, that'd
    //   be fun!" follows at once
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'firstreact', seg: [27.3, 30.9],
      stem: 'How does Bobby react when he first hears the offer?',
      choices: ['Excited; it sounds like fun to him', 'Worried; it sounds like hard work',
                'Doubtful; he thinks they are joking'], a: 0,
      cue: '「What? Mayor?」のあと、Man で始まる一言。',
      line: 'What? … — Yeah. — *Man, that’d be fun!*',
      said: '「え、市長？」と聞き返してから、「うわ、それ楽しそう」と言う。',
      mean: '聞き返しは驚き。仕事の重さより「楽しそう」が先に来るのが彼らしい。',
      trap: 'What? は疑いにも聞こえるが、すぐ「楽しそう」と続く。最初の一語より、そのあとの一言で決まる。',
      use: 'Man, that’d be fun!（うわ、それ楽しそう！）' },

    // R fix: V2 (blind 60–70 %), "real work, too serious" was the only other reading; a duty reading replaces it, and
    //   the line repeats a1's key, so it reveals `firstreact`
    // why: a duty ← "mayor" heard as public service, the usual frame; the better plan ← "too" heard as ranking the
    //   job above the trip
    { id: 'i2', skill: 'infer', level: 'C1', point: 'samefun', reveals: ['firstreact', 'toofun'], seg: [29.2, 37.95],
      stem: 'How does Bobby seem to think of being mayor, next to his trip?',
      choices: ['As one more fun thing, just like the trip', 'As a duty to the town, unlike the trip',
                'As the better plan, if the trip falls through'], a: 0,
      cue: '断る理由のあと、最後に付け足す一言。',
      line: 'Man, that’d be fun!… *That’ll be really fun, too.*',
      said: '市長を「楽しそう」と言い、宇宙旅行にも「それも楽しい」と言う。',
      mean: 'too（〜も）で、市長の仕事と旅行を同じ「楽しいこと」に並べている。責任の重さは頭にない。',
      trap: '市長は公の務めと思いやすいが、本人は旅行と同じく too で並べる。重さの話はない。',
      use: 'That sounds fun, too.（それも楽しそう）' },

    // R fix: V2 (blind 85 %) and C5, the stem said "can't do it" (g2's key) and f2's rocket gave space away; the stem
    //   now asks what he's getting ready for, and f2 reveals `space`
    //   2nd blind read 75 % ("the only odd, specific choice"): the race is now "a big trip to Russia"
    // why: family trip ← "big trip" caught, "to space" lost, and "family name" came before; Russia ← "the Russian
    //   guys" come right after, read as the destination
    { id: 'd2', skill: 'detail', level: 'B1', point: 'space', seg: [30.6, 35.7],
      stem: 'What does Bobby say he is getting ready for?',
      choices: ['Going on a big trip to space', 'Going on a big trip to Russia', 'Going on a long family trip'], a: 0,
      cue: 'though のあと、’cause で始まる理由。',
      line: '’cause I’m getting ready to go on *a big trip to space*',
      said: '「だって大きな宇宙旅行に行く準備中なんだ」と断る理由を言う。',
      mean: '’cause ＝ because。市長を断る理由は、宇宙へ行く予定。',
      trap: 'big trip だけ聞くと家族旅行などに思える。trip のあとの to ～ まで聞く。',
      use: 'I can’t, ’cause I’m going away.（行けないんだ、出かけるから）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'space', seg: [32.85, 35.7],
      stem: 'Type what Bobby says: “’Cause I’m ___ on a big trip to space.” (4 words)', answer: 'getting ready to go',
      cue: '「’Cause I’m」のあと、on の前まで。',
      line: '’cause I’m *getting ready to go* on a big trip to space',
      said: '「宇宙旅行に行く準備をしてるから」と、断る理由を話す。',
      mean: 'getting ready to ～ ＝ 〜する準備中。予定が近いと伝える。',
      trap: 'getting の t が弾み、to は弱く、ready と go の間で消えやすい。語の数で確かめる。',
      use: 'I’m getting ready to leave.（もう出る準備してるところ）' },

    // why: That'd ← the same "-d" sound as "that would" a few seconds earlier; That was ← past, if the trip is heard as
    //   done; It'll ← "that" and "it" both shrink to a short vowel
    { id: 's1', skill: 'sound', level: 'B2', point: 'toofun', seg: [33.0, 37.95],
      stem: 'Fill the gap: “___ really fun, too.”',
      choices: ['That’ll be', 'That’d be', 'That was', 'It’ll be'], a: 0,
      cue: '宇宙旅行の話のすぐあと、文の最初の短い部分。',
      line: '*That’ll be* really fun, too.',
      said: '宇宙旅行も「それもすごく楽しいだろうな」と言う。',
      mean: 'That’ll ＝ That will。t が弾み「ザロ」と短い。これからの予定なので will。',
      trap: 'That’d は仮定の形。旅行は予定の話なので will。語尾の「ル」を聞く。',
      use: 'That’ll be great.（それは最高だね）' },

    // R fix: V2/K6, the key was the only "Yes" (blind 55–70 %) and the stem's "fun" gave a1 away; the stem now names
    //   the moment, and the choices are three labelled readings
    // why: mocking ← "always just so…, right?" is a common sarcastic frame; bored ← "always" heard as a complaint
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'sofun', reveals: ['whatswhat'], seg: [35.6, 43.6],
      stem: 'When Bobby sums up his view of life, how does he mean it?',
      choices: ['Sincerely; to him, life really is that easy', 'Sarcastically; he’s mocking their dull jobs',
                'Wistfully; he’s hinting he is bored lately'], a: 0,
      cue: 'そのあとの返事を、Bobby がどう受けるか。',
      line: 'Everything in life is always just so fun, right? — It really is. — *See? This guy knows what’s what.*',
      said: '「人生っていつも楽しいよね？」と言い、同意されると「この人は分かってる」と喜ぶ。',
      mean: '皮肉ではなく本気。お金に困らない彼には、毎日が楽しいことの連続。',
      trap: 'always just so ～ は皮肉にも使うが、同意した相手をほめているので本気。',
      use: 'Isn’t life great?（人生って最高じゃない？）' },

    // why: wants ← "what" taken as "what people want"; going on today ← "what's" heard as "what's happening"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'whatswhat', seg: [37.6, 43.7],
      stem: 'When someone agrees, what does Bobby say about that person?',
      choices: ['He understands how things really are', 'He knows what everybody here wants',
                'He knows what is going on today'], a: 0,
      cue: '「See?」のあと、this guy に続く言い方。',
      line: 'See? This guy *knows what’s what*.',
      said: '同意した相手を指して「ほらね、この人は分かってる」と言う。',
      mean: 'know what’s what ＝ 物事の本当のところが分かっている。ほめ言葉。',
      trap: 'what を「何が欲しいか」「何が起きているか」と具体的に取りやすいが、決まった言い方。',
      use: 'She really knows what’s what.（彼女は本当に物が分かってる）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'checkit', seg: [44.9, 48.95],
      stem: 'Type what Bobby says: “You should ___.” (3 words)', answer: 'check it out',
      cue: '宇宙の質問のあと、You should に続く部分。',
      line: 'You should *check it out*. Seriously.',
      said: '「宇宙、行ってみなよ。本気で」とすすめる。',
      mean: 'check it out ＝ 行ってみる・見てみる。気軽なおすすめの決まり文句。',
      trap: 'check‿it‿out がつながり「チェキラウ」と一語に聞こえる。3語に分けて書く。',
      use: 'You should check out that cafe.（あのカフェ行ってみなよ）' },

    // R fix: S3, the cue's "with" was only in the key; C5, the line's rocket gives d2's key away, so it reveals `space`
    // why: a cool guy ← cool = かっこいい; free ← "would be cool with it" heard as "no charge", before the deposit
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'coolwith', reveals: ['space'], seg: [47.95, 56.1],
      stem: 'What does Bobby say about the Russian rocket builders?',
      choices: ['They’d be fine with Ben going along', 'They’d think Ben was a cool guy',
                'They’d find Ben a seat for free'], a: 0,
      cue: '「the rocket」のあと、文の終わりの言い方。',
      line: 'I’m sure the Russian guys who built the rocket *would be cool with it*.',
      said: '「ロケットを作ったロシア人たちも、きっと構わないよ」。',
      mean: 'be cool with ～ ＝ 〜で構わない。ここの cool は「かっこいい」ではない。',
      trap: 'cool をカタカナの「クール」と取りやすい。be cool with はセットで「平気」。',
      use: 'Are you cool with that?（それで大丈夫？）' },

    // C2: who the joke is on
    // anchor: 51.9–55.7 s "Just one thing. You have $600,000? It's just — that's what they need for a deposit": a
    //   fortune framed as a small catch; 56.2–58.1 s "Oh. Well, no.": it isn't small to anyone else
    // R fix: V2 (blind 65–75 %), the key was the only Bobby choice; now two Bobby and one Ben near misses
    // why: Bobby overpaying ← right target, wrong reason: "that's what they need" heard as a price he resents; Ben
    //   getting excited ← his "Really?" shows interest, then "Oh. Well, no.", so the laugh seems at his expense
    // retired: one C2 alone is under 2 (nt1 retired)
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'onething', reveals: ['deposit'], seg: [51.2, 58.35], retired: true,
      stem: 'When Bobby brings up the deposit, who is the joke on?',
      choices: ['Bobby, who treats a huge sum as a small catch', 'Bobby, who is paying the Russians far too much',
                'Ben, who got excited before he heard the price'], a: 0,
      cue: '金額の前後に付く、小さく見せる言い方。',
      line: '*Just one thing.* You have six hundred thousand dollars? *It’s just —* … — Oh. Well, no.',
      said: '「1つだけ。60万ドルある？それだけ」と軽く聞かれ、相手は「えっと、ない」と答える。',
      mean: '大金を「ちょっとしたこと」扱いする。誰でも持っていると思っている、お金持ちの感覚が笑われている。',
      trap: '値段への不満や、乗り気だった相手の落胆に目が行きやすい。小さく言う語と中身の差がある人が的。',
      use: 'Just one small thing: it costs $500.（1つだけ、500ドルかかるの）' },

    // keep: ascending. why: $600 ← "hundred" caught, "thousand" lost; $60,000 ← six/sixty; $6,000,000 ← a rocket
    //   sounds like millions
    { id: 'n2', skill: 'number', level: 'B1', point: 'deposit', seg: [51.4, 56.1], keep: true,
      stem: 'How much do they need for a deposit?',
      choices: ['$600', '$60,000', '$600,000', '$6,000,000'], a: 2,
      cue: '「you have」のあと、dollars の前。',
      line: 'You have *six hundred thousand dollars*?',
      said: '「60万ドルある？それが手付金に要るんだ」と言う。',
      mean: 'six hundred thousand ＝ 60万。deposit ＝ 手付金・頭金。',
      trap: 'hundred で止まると600ドル。すぐあとに thousand が続くかを聞く。',
      use: 'They need a deposit first.（まず手付金が要るって）' },

    // why: looks like a cartoon ← "the guy from Toy Story" heard as a comment on his face; wants it free ← "Nice try"
    //   heard as "you're trying to get out of the deposit"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'buzz', seg: [57.9, 69.0],
      stem: 'Why does Bobby’s answer to the moon story get a laugh?',
      choices: ['He thinks the man took his name from a cartoon', 'He thinks the man looks like a cartoon character',
                'He thinks the man wants the trip without paying'], a: 0,
      cue: '名乗ったあとの短い返事と、最後の一文。',
      line: 'Buzz Aldrin, nice to meet you. — *Nice try.* That’s *the guy from Toy Story*.',
      said: '月を歩いたと名乗る男に「惜しいね。それはトイ・ストーリーのやつ」と返す。',
      mean: '名乗った名前をアニメの人物だと思いこみ、信じない。勘違いの自信が笑い。',
      trap: 'guy from ～ は「〜に出てくる人」。見た目の話ではない。Nice try は信じない返事。',
      use: 'Nice try, but I’m not buying it.（うまいこと言うね、でも信じないよ）' },
  ]
};
