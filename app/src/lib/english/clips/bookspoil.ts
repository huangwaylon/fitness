// REVIEW 2026-11-16: pass 7, fix 13, drop 0, new 0; ear checks 3 (x1 and s1 taken off: both sources agree)
// Q: n1 is easy for anyone who knows the book (room 217); kept, since the item turns on -teen/-ty. OK?
// Q: d3 is tagged C1, but "she says no" is explicit; B2 fits better, though it would push B2 to 55 %.
// “Rachel and Joey Share Book Spoilers | Friends” (the official Friends channel, Best of Season 3): Joey, who has
// already read The Shining, lets its ending slip while Rachel is reading it; she pays him back with the ending of
// Little Women, he answers with The Shining's, she adds "Beth dies", and a friend sums up Joey's distress.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 93 s (whisper loops one line after;
// the captions' "Nicholson" at 103.4 s and "code" at 44.3 s are late timings, read with whisper's 37–40 s and 90–93 s).
// Names said: Rach, Joey, Rachel. The lines at 37.6 s ("cracked your code") and 88.2 s ("Joey's asking…") are a
// friend's, never named, so no item depends on who says them. No who items. Untested on purpose: 14–27 s (the "blank"
// code game turns on the book's famous line: world knowledge), 79–87 s ("Mm-hmm" in whisper only; who says "No. Beth
// doesn't die" is unclear).
// EAR CHECK: 36.3 s a1 — whisper "Joey, I can't believe *you* just did that", captions "…*he* just did that": a1
//   takes it as Rachel's line to Joey (R added)
// EAR CHECK: 59.8 s r1 — the cut falls after "All right" (whisper has it twice, 58–60 s), before "The boiler…" at 60.3 s
// EAR CHECK: 89.0 s c2 — "if you've just": the 've is there (both sources have it), the three words run together
import type { Clip } from '../types.ts';

export const bookSpoilers: Clip = {
  id: 'bookspoil', video: '7_Dn1My4CZU', title: 'Rachel and Joey Share Book Spoilers', dur: 105, wpm: 164,
  band: 'mid', tags: ['友だち', '家'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // why: 270 ← -teen/-ty: "seventeen" and "seventy" differ mainly in stress; 207 ← "two-oh-seven" if the -teen is
    //   lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'room', seg: [2.6, 6.0], keep: true,
      stem: 'Which room has Danny just gone into?',
      choices: ['207', '217', '270'], a: 1,
      cue: '「went into」のすぐあと。',
      line: 'Danny just went into *room 217*.',
      said: 'ダニーがちょうど217号室に入ったところ、と今読んでいる場所を言う。',
      mean: '部屋番号は two seventeen と分けて読むのがふつう。',
      trap: 'seventeen は後ろの -teen が強く長い。seventy は前が強く、最後は「ディ」に近い。',
      use: 'I’m in room 314.（314号室です）' },

    // R fix: V2 (blind 60 %): the key was the only "he has read it" choice; a second read-it reading added
    // why: dull ← he has read it, but "the best" is missed; same point ← "the next part" heard as the two moving on
    //   together
    { id: 'i1', skill: 'infer', level: 'B2', point: 'ahead', seg: [2.6, 10.6],
      stem: 'From Joey’s first reaction, what do we learn about him?',
      choices: ['He has already read past that point', 'He has read it, but found that part dull',
                'He has just reached the same point'], a: 0,
      cue: '部屋の話のあと、Joey の最初の反応。',
      line: 'Ooh, *the next part’s the best*.',
      said: 'Rachel が今の場面を言うと、Joey は「次がいいところ」と言い出す。',
      mean: '次を知っている＝もう先まで読んでいる。だからネタばれになりそう。',
      trap: 'next を「一緒に次へ」と取ると、同時に読んでいるように聞こえる。',
      use: 'Wait, the next part’s the best!（待って、次がいいところ！）' },

    // R fix: V2 (blind 70 %): "already read that part" was out of step; now a near miss on "the next part"
    // why: retelling ← "the next part" missed, so he seems to recap; scared ← "dead lady in the bathtub" is a horror
    //   detail
    { id: 'd1', skill: 'detail', level: 'B1', point: 'ruin', seg: [5.3, 12.0],
      stem: 'Why does Rachel stop Joey mid-sentence?',
      choices: ['He’s about to give away what happens', 'He’s retelling a part she has just read',
                'She’s too scared to hear about it'], a: 0,
      cue: '「no」が続いたあとの一文。',
      line: 'Come on, you’re gonna *ruin it*.',
      said: '「ちょっと、台なしにする気？」と Joey を止める。',
      mean: 'ruin it ＝ 先を言われて楽しみがなくなる。ネタばれを止めている。',
      trap: '怖い場面の話なので「怖いから」と取りやすいが、止めた理由は次の一文で言っている。',
      use: 'Don’t tell me! You’ll ruin it.（言わないで！台なしになる）' },

    // R fix: V2 (blind 60 %): "at the last second" sat only in the key and one weak choice; the "almost" trap now
    //   shares it
    // why: kills them all ← "almost" is weak and short, so "kills them all… last second" is what sticks; Jack gets away
    //   ← "get away" and "last second" heard, with the wrong subject
    { id: 'd2', skill: 'detail', level: 'B2', point: 'ending', seg: [26.8, 35.0],
      stem: 'In the ending Joey gives away, what happens?',
      choices: ['The family escapes at the last second', 'Jack kills them all at the last second',
                'Jack gets away at the last second'], a: 0,
      cue: '「the end」のあと、but の前と後。',
      line: 'When Jack *almost* kills them all… but then in the last second, *they get away*.',
      said: 'ジャックが家族を殺しかけるが、最後の瞬間に家族は逃げる、と結末を言ってしまう。',
      mean: 'almost ＝「もう少しで〜するところ」。実際には殺していない。',
      trap: 'almost は弱く短いので落ちやすい。kills them all だけ聞くと逆の意味になる。',
      use: 'I almost missed my flight.（あやうく飛行機に乗り遅れるところだった）' },

    // R fix: V2 (blind 70 %): the key was the only negative feeling; "annoyed at the code" added
    // why: no sense ← the "blank" code heard as confusing, a negative feeling with the wrong cause; impressed ← "I
    //   can’t believe" read as amazement
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'didthat', seg: [26.8, 37.4],
      stem: 'How does Rachel feel right after hearing the ending?',
      choices: ['Upset that he spoiled the ending', 'Annoyed that his code made no sense',
                'Impressed by how clever his code was'], a: 0,
      cue: '結末を聞いた直後、名前を呼んでからの一文。',
      line: 'Joey, *I can’t believe you just did that*.',
      said: '「ジョーイ、今のは信じられない」と言う。',
      mean: '「よくもやったわね」という抗議。驚きと非難を同時に表す。',
      trap: 'I can’t believe は「すごい」の驚きにも使う。直前の「no, no」とつながるので、ここは抗議。',
      use: 'I can’t believe you told her!（彼女に言うなんて信じられない！）' },

    // R fix: V2 (blind 65 %): the key was the only teasing reading; "slow to get it" is teasing aimed at the wrong
    //   target
    // why: clever ← "cracked" taken at face value (the sincere reading); slow ← right mechanism (teasing), wrong
    //   target, but she got it at once
    { id: 'h1', skill: 'humor', level: 'C1', point: 'code', reveals: ['crack'], seg: [26.8, 41.0],
      stem: 'Why does the last line about the code get a laugh?',
      choices: ['The “code” hid almost nothing at all', 'The code was clever, but Rachel was smarter',
                'Rachel took far too long to work it out'], a: 0,
      cue: '「blank」が何を隠していたかを思い出して。',
      line: 'I can’t believe she *cracked* your *code*.',
      said: '「暗号を解いたなんて信じられない」と Joey をからかう。',
      mean: 'blank で隠したのは一語だけで、筋は全部言っていた。その暗号への皮肉。',
      trap: 'cracked を本気のほめ言葉と取ると「Rachel が賢い」話になる。からかう相手は暗号の作り手。',
      use: 'Wow, real top-secret stuff.（へえ、すごい極秘情報だね）' },

    // R fix: V2 (blind 80 %): the key alone held "code"-ish wording; all three now parallel on "what he was hiding"
    // why: broke into ← crack a safe = break into it; made fun ← crack a joke / crack up, chunks learners know
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'crack', seg: [36.8, 41.0],
      stem: 'What does “cracked your code” mean here?',
      choices: ['Figured out what he was hiding', 'Broke into what he was hiding',
                'Made fun of what he was hiding'], a: 0,
      cue: '最後の一文、code の前の動詞。',
      line: 'I can’t believe she *cracked your code*.',
      said: '「彼女が君の暗号を解いたなんて」と言っている。',
      mean: 'crack a code ＝ 暗号を解く。難問や金庫を「破る」ときにも使う。',
      trap: 'crack は「割る」、crack up は「爆笑する」。code と一緒なら「解読する」。',
      use: 'We finally cracked the problem.（やっと問題が解けた）' },

    // R fix: V2 (blind 85 %): the only motive about the spoiler; "stop him spoiling the rest" is refuted by "No, the
    //   end"
    // why: stop ← a deterrent reading, but he had already told "the end"; warn ← the sad ending heard as a kindness
    { id: 'g1', skill: 'gist', level: 'C1', point: 'payback', reveals: ['accident'], seg: [44.8, 66.0],
      stem: 'Why does Rachel tell Joey how his book ends?',
      choices: ['To get back at him for spoiling hers', 'To stop him spoiling the rest of hers',
                'To warn him early that it ends sadly'], a: 0,
      cue: 'Rachel の話のすぐあと、Joey の短い抗議。',
      line: 'Hey. *Mine was by accident.*',
      said: 'Rachel は Joey の本の結末をわざと話す。Joey は「僕のは事故だった」と抗議する。',
      mean: '自分の本の結末をばらされた仕返し。理由は言わないが、抗議の言葉で分かる。',
      trap: '悲しい結末なので「心の準備」と取りやすい。直後の反応が答え合わせ。',
      use: 'Okay, now we’re even.（よし、これでおあいこ）' },

    // why: he turns her down ← "Lori" sounds like a woman's name and "Joe" a man's, so the roles flip; yes ← "no" is
    //   short and weak before "even though"
    { id: 'd3', skill: 'detail', level: 'C1', point: 'proposal', reveals: ['stilllove'], seg: [45.0, 50.8],
      stem: 'In Rachel’s spoiler, how does the proposal go?',
      choices: ['She turns him down, though she loves him', 'He turns her down, though he loves her',
                'She says yes, though she loves someone else'], a: 0,
      cue: 'proposes のあと、誰が何と答えるか。',
      line: 'Lori proposes to Joe, and *she says no*…',
      said: 'ローリーがジョーにプロポーズし、ジョーは断る。まだ彼を好きなのに、と続ける。',
      mean: 'Lori（Laurie）は男性、Joe（Jo）は女性。好きなのに断る、が意外な点。',
      trap: '名前の響きで男女を逆に取りやすい。he と she を追えば、誰の話か分かる。',
      use: 'She said no, even though she liked him.（好きだったのに断った）' },

    // R fix: V2 (blind 70 %): the key was the only comparison; "both accidents" mishears "Mine" as "mine too"
    // why: even ← "Mine was by accident" heard as "mine too", a comparison the wrong way round; sorry ← the Japanese
    //   frame: "by accident" heard as an apology
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'accident', seg: [45.0, 59.0],
      stem: 'What is the point of the short reply “Hey. Mine was…”?',
      choices: ['Her spoiler was on purpose, and his wasn’t', 'Both spoilers were accidents, so they’re even',
                'He’s sorry he spoiled her book first'], a: 0,
      cue: '「Mine」が何と比べているか。',
      line: 'Hey. *Mine* was *by accident*.',
      said: '「おい、僕のは事故だったぞ」と言う。',
      mean: 'mine ＝ 僕のネタばれ。「君のはわざとだ」と、口には出さずに相手を責めている。',
      trap: '「わざとじゃない」は日本語だと謝る流れになりやすいが、ここは比べて抗議している。',
      use: 'Hey, I didn’t do it on purpose.（ちょっと、わざとじゃないってば）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'stilllove', reveals: ['proposal'], seg: [48.0, 50.8],
      stem: 'Type what Rachel says: “___ in love with him.” (4 words)', answer: 'even though she\'s still',
      cue: '「says no」のすぐあと、ひと続きの4語。',
      line: 'and she says no, *even though she’s still* in love with him',
      said: '「まだ彼を好きなのに」と付け足す。',
      mean: 'even though ＝「〜なのに」。she’s は短く、still とつながる。',
      trap: 'she’s の s と still の s が一つに聞こえやすい。s が2つあると意識する。',
      use: 'Even though it rained, we had fun.（雨だったけど楽しかった）' },

    // why: ended up ← "ends‿up" links into "endzup", so -s and -ed are hard to tell; she ← "she" runs through the line
    //   before, and "then he" loses its h
    { id: 's1', skill: 'sound', level: 'B2', point: 'endsup', seg: [48.0, 55.0],
      stem: 'Fill the gap: “and then ___ marrying Amy.”',
      choices: ['he ends up', 'he ended up', 'she ends up'], a: 0,
      cue: '「and then」のあと、短い2〜3語。',
      line: 'and then *he ends up* marrying Amy.',
      said: '「で、結局彼はエイミーと結婚するの」。he の h は消え、ends‿up がつながる。',
      mean: 'end up 〜ing ＝「結局〜することになる」。',
      trap: 'ends‿up は「エンザップ」に近く、-s か -ed か聞き取りにくい。あらすじは現在形が多い。',
      use: 'We ended up staying an extra night.（結局もう1泊することになった）' },

    // R fix: V2 (blind 70 %): "greets her" was a filler; "surprise" is a real use of "Hey"
    // why: surprise ← "Hey!" as an exclamation (へえ！); new topic ← "hey" used to call someone over
    { id: 'm1', skill: 'marker', level: 'B2', point: 'hey', reveals: ['accident'], seg: [54.6, 59.0],
      stem: 'What does the “Hey” right after Rachel’s spoiler do?',
      choices: ['Objects to what she has just done', 'Shows surprise that she knows his book',
                'Gets her attention for a new topic'], a: 0,
      cue: '結末の話のすぐあと、文頭の短い一語。',
      line: '*Hey.* Mine was by accident.',
      said: 'Rachel が結末を言った直後、「おい」と言ってから言い返す。',
      mean: 'ここの Hey は「ちょっと待てよ」。相手のしたことに文句を言う合図。',
      trap: '冒頭の Hey, Rach はあいさつ。同じ語でも、何かされた直後に出ると抗議になる。',
      use: 'Hey! I was here first.（ちょっと！私が先だよ）' },

    // why: promise ← "All right" heard as giving in (分かった、もうやめる); ask ← "All right" heard as "go on, then"
    { id: 'r1', skill: 'predict', level: 'B2', point: 'boiler', reveals: ['dad'], seg: [54.6, 59.8], then: [59.8, 66.0],
      stem: 'After “Mine was by accident. All right.”, what is Joey about to do?',
      choices: ['Give away her book’s ending in return', 'Promise to stop talking about the books',
                'Ask her to tell him the rest of his'], a: 0,
      cue: '「All right」の言い方と、直前の抗議。',
      line: 'All right. *The boiler explodes and destroys the hotel*…',
      said: '「よし」と言ってから、Rachel の本の結末を言い始める。',
      mean: 'この All right は「分かった、それなら」。抗議のあとなので、やり返す前置き。',
      trap: 'All right を「降参」と取りやすい。直前に怒っているなら、次は反撃が来やすい。',
      use: 'All right, you asked for it.（よし、そっちがその気なら）' },

    // R fix: V2 (blind 60 %): "gets away" was weak; "badly hurt" misses the last short verb
    // why: hurt ← "kills" is short, at the end of a long breath; blows up ← "destroys the hotel" and "the dad" in one
    //   breath, with the wrong subject
    { id: 'd4', skill: 'detail', level: 'B1', point: 'dad', seg: [59.5, 66.0],
      stem: 'What happens to the dad in Joey’s spoiler?',
      choices: ['He dies when the boiler explodes', 'He’s badly hurt when the boiler explodes',
                'He blows up the hotel himself'], a: 0,
      cue: '「hotel」のあと、文の最後。',
      line: 'The boiler explodes and destroys the hotel *and kills the dad*.',
      said: 'ボイラーが爆発してホテルが壊れ、父親が死ぬ、と結末を言う。',
      mean: '主語はずっと the boiler。爆発が、ホテルを壊し父親を死なせる。',
      trap: '主語はずっと the boiler。最後の短い kills を落とすと「けが」に聞こえる。',
      use: 'The storm knocked out the power.（嵐で停電した）' },

    // why: pleased ← he did land his boiler spoiler just before; sorry ← "Mine was by accident" heard as an apology
    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', reveals: ['star', 'ruined'], seg: [64.5, 94.0],
      stem: 'Where does the scene leave Joey?',
      choices: ['Afraid his favorite book is ruined', 'Pleased that he got even with Rachel',
                'Sorry that he spoiled Rachel’s book'], a: 0,
      cue: '最後の場面、Joey が何を心配しているか。',
      line: 'Joey’s asking if you’ve just *ruined the first book he’s ever loved*…',
      said: '「ベスは死ぬの？」とうろたえ、友だちが「初めて好きになった本なのに」と代弁する。',
      mean: '仕返しは成功したが、最後に一番困っているのは Joey。',
      trap: '直前にやり返しているので「勝った」と思いやすい。最後のせりふで立場が逆転している。',
      use: 'Please tell me that’s not true.（うそだと言って）' },

    // R fix: V2 (blind 60 %): "calm" was a filler; "glad to know ahead" reads "If I keep reading" as relief
    // why: glad ← "If I keep reading" heard as relief at the warning; hit back ← the scene’s pattern so far is spoiler
    //   for spoiler
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'shock', seg: [75.5, 84.2],
      stem: 'How does Joey react to Rachel’s “Beth dies”?',
      choices: ['Shaken, and hoping it isn’t really true', 'Sad, though glad to know ahead of time',
                'Angry, and ready to hit back again'], a: 0,
      cue: '名前のくり返しと、そのあとの質問。',
      line: 'Beth… Beth dies? *Is that true?*',
      said: '「ベス…ベスが死ぬ？本当？」と、何度も聞き返す。',
      mean: '本気でショックを受け、うそであってほしいと思っている。',
      trap: 'ここまでやり返しが続いたので反撃を予想しやすい。質問を重ねるのは動揺のサイン。',
      use: 'Wait, is that true?（待って、それ本当？）' },

    // R fix: V2 (blind 60 %): "decided to stop" was weak; all three are now about where he is in the book
    // why: forgot ← "Is that true?" heard as a memory check; finished ← "keep reading" heard as "kept reading"
    { id: 'i2', skill: 'infer', level: 'B2', point: 'reading', seg: [79.5, 84.2],
      stem: 'What does Joey’s question about reading on tell us?',
      choices: ['He hasn’t reached that part yet', 'He read that part but forgot it',
                'He has already finished the book'], a: 0,
      cue: '「Is that true?」のあと、if で始まる質問。',
      line: '*If I keep reading*, is Beth gonna die?',
      said: '「このまま読み進めたら、ベスは死ぬの？」と聞く。',
      mean: 'まだその場面まで読んでいない。だから結末を知らず、本気で心配している。',
      trap: 'keep reading を kept と取ると「もう読んだ」になる。if＋現在形はこれからの話。',
      use: 'If I keep going, will I find it?（このまま行けば見つかる？）' },

    // R fix: V2 (blind 55 %) + K1: "whose stories all come from films" was vague; "the book" was a filler. The key now
    //   names the joke (one loved book), Nicholson is the last-heard keyword
    // why: Rachel ← the line is put to her ("you’ve just ruined"), right mechanism, wrong target; Nicholson ← the name
    //   ends the line, the last-heard keyword
    // anchor: 88.2–93 s "the first book *he's* ever loved that didn't star Jack Nicholson": the clause is about Joey's
    //   own reading, and "star" (主演) only fits films; the part put to Rachel is the question, not the laugh line
    // retired: for the draws (play 3+ under g2 drew no C2): g2 reveals its point
    { id: 'c1', skill: 'humor', level: 'C2', point: 'star', reveals: ['ruined'], seg: [84.0, 94.0], retired: true,
      stem: 'In the line about “the first book he’s ever loved”, who is the joke on?',
      choices: ['Joey, who has hardly ever loved a book', 'Rachel, for ruining a book he loves',
                'Jack Nicholson, whose films Joey loves'], a: 0,
      cue: '文の最後の that 以下が、誰の話か。',
      line: '…ruined the first book *he’s ever loved* that *didn’t star* Jack Nicholson.',
      said: '「ニコルソンが出ていない本で初めて好きになった本を、台なしにしたのか」と聞く。',
      mean: '好きになった本はニコルソン主演で映画になった1冊だけ。つまり Joey はほとんど本を読まない、と笑う。',
      trap: 'Rachel への言葉なので彼女への皮肉に聞こえやすい。笑いの中身は that 以下の読書歴。',
      use: 'It’s the first salad I’ve ever liked.（初めておいしいと思ったサラダ）' },

    // anchor: 88.2–90.0 s after "Joey's asking", three weak words before "ruined", at the clip's 164 wpm; both sources
    //   have "if you've just"
    // retired: for the draws (play 3+ under g2 drew no C2): g2 reveals its point
    { id: 'c2', skill: 'dict', level: 'C2', point: 'ruined', seg: [87.4, 90.1], retired: true,
      stem: 'Type the words: “Joey’s asking ___ ruined the first book…” (3 words)', answer: 'if you\'ve just',
      cue: '「asking」のすぐあと、とても短い3語。',
      line: 'Joey’s asking *if you’ve just* ruined the first book…',
      said: '「君が今…台なしにしたのか聞いてる」と言う。if you’ve just の3語は弱くひと続き。',
      mean: '’ve はほぼ「v」一音。just と合わせて「たった今やってしまった」感じ。',
      trap: '’ve が聞こえないと you just と書きたくなる。v の音を、文法でなく耳で判断する。',
      use: 'I think you’ve just made my day.（今ので一日が明るくなったよ）' },
  ]
};
