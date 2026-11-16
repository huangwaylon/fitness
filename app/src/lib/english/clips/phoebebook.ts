// REVIEW 2026-11-16: pass 4, fix 14, drop 1, new 1; ear checks 9
// REVIEW Q: i2 and g2 rest on “Phyllis” being heard as a stand-in for Phoebe; if the name doesn't land by ear, drop i2.
// REVIEW Q: x2's segment is 2.0 s with “chair” and “Phyllis” right at its edges; confirm no word is clipped.
// “Phoebe Writes a Book About Chandler and Monica | Friends” (the official Friends channel, Best of Season 6): Phoebe
// takes notes on the couple's bickering for her book on relationships, until she gets written about herself.
// Segments from the captions, words from whisper (2026-11-16). The Joey exchange (41–52 s) is left untested (its joke
// is sexual); no predict item, because no line here has a clean pause before its continuation.
// EAR CHECK: 2.4 s s1 — “we were going to” (both have it; confirm it isn't “we're going to”, and whether it's “gonna”)
// EAR CHECK: 14.2 s x1 — “talk a little slower”: the flapped t in “little”, “talk a” linked
// EAR CHECK: 16.2 s i3 — “This is going in your book?” is one of the couple, surprised (catching on), not pleased
// EAR CHECK: 21.4 s t2 — Phoebe's “Keep going, this stuff's great” is delighted, not sarcastic (key rests on tone)
// EAR CHECK: 24.4 s t1 — “Excuse me?” sounds offended, not a “pardon?” (key rests on tone)
// EAR CHECK: 26.2 s d4 h1 — the speaker of “And how none of it matters…” and “…as long as it's a compliment” (assumed Phoebe, dictating as she writes)
// EAR CHECK: 53.7 s d3 — whisper “Baby, stop writing about us”, captions “Did he stop writing about us?” (probably “Pheebs”); no item keys on it
// EAR CHECK: 65.8 s i2 g2 — the man (assumed Chandler) says he'll write about “Phyllis”, and Phoebe answers “I see what you're doing”
// EAR CHECK: 71.7 s x2 — “see what you're doing”: “what you're” runs together (≈ ワッチャ)
import type { Clip } from '../types.ts';

export const phoebebook: Clip = {
  id: 'phoebebook', video: '5gDVzMcpE1s', title: 'Phoebe Writes a Book About Chandler and Monica', dur: 91, wpm: 185,
  band: 'fast', tags: ['友だち', '恋愛'],
  credit: 'Friends (official YouTube channel)',
  questions: [
    // why: the baby kind ← the swap the couple keeps arguing over; wrong size ← "baby" said, wrong relation
    { id: 'd1', skill: 'detail', level: 'B1', point: 'kind', seg: [0, 4.4],
      stem: 'In the first line, what is the problem with what was bought?',
      choices: ['It’s the kind with the little girl', 'It’s the kind with the baby on it',
                'It’s the wrong size for a baby'], a: 0,
      cue: '最初の一文、「the kind with」のあと。',
      line: 'Hey, honey, you got *the kind with the little girl*.',
      said: '「ねえ、女の子のほうを買ってきたのね」と、最初の人が言う。',
      mean: '相手は「赤ちゃんのほうって言ったでしょ」と返し、言った言わないになる。',
      trap: 'baby と little girl が何度も入れかわるので混ざりやすい。最初の一文だけに集中する。',
      use: 'You got the wrong kind.（違う種類を買ってきたね）' },

    // R fix: its line ("we were going to get the kind with the baby") gives away d1's key: added kind to reveals
    // why: we're ← "we were" shrinks to one syllable; weren't ← the final t of n't is easy to imagine or lose
    { id: 's1', skill: 'sound', level: 'B2', point: 'were', reveals: ['kind'], seg: [0, 4.4],
      stem: 'Fill the gap: “You said ___ get the kind with the baby.”',
      choices: ['we’re going to', 'we were going to', 'we weren’t going to'], a: 1,
      cue: '「You said」のすぐあと、短く続く音。', line: 'You said *we were going to* get the kind with the baby.',
      said: '「赤ちゃんのほうって言ったじゃない」。we were は「ウィワ」と短い。',
      mean: '過去に決めた予定を持ち出して、相手の記憶に反論している。',
      trap: 'we were は we’re と聞こえやすい。n’t を足すと話が逆になる。',
      use: 'I thought we were going to share.（分けるって話だったよね）' },

    // R fix: blind pass 85 % (with the title, "stop fighting" and "love story" were the odd ones out); all three now
    //   involve her book. Its notes give away t2's and d2's keys: reveals great, about.
    // why: reading advice ← "relationships… what not to do" sounds like a self-help book; will help ← "none of it
    //   matters when the people really love each other" heard as comfort
    { id: 'g1', skill: 'gist', level: 'B2', point: 'book', reveals: ['great', 'about'], seg: [0, 35.5],
      stem: 'What is Phoebe doing while the couple argues?',
      choices: ['Using their fight as material for her book', 'Reading them advice from her book on fights',
                'Promising her book will help couples like them'], a: 0,
      cue: '彼女の頼みと、「book」の話のあと。',
      said: 'カップルの言い合いを、フィービーは書き留めている。',
      mean: '二人のけんかを、恋愛本の「悪い例」のネタにしている場面。',
      trap: 'relationships や what not to do から「助言している」と取りやすい。彼女が何をしているかを聞く。',
      use: 'Mind if I take notes?（メモを取ってもいい？）' },

    // R fix: blind pass 95 %; "a little bit sad" was a filler, and the key was the only choice without "a little" (K6).
    //   Now the literal creep (ゆっくり進む) and the annoyance reading.
    // why: grows on you ← literal creep = move slowly; nerves ← "creep" heard as mild annoyance (bug)
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'creep', seg: [4, 7.9],
      stem: 'In this argument, what does “creeps you out” mean?',
      choices: ['Gives you an uneasy, icky feeling', 'Slowly grows on you over time',
                'Gets on your nerves, annoys you'], a: 0,
      cue: '「No」で始まる二つの文の、最後の部分。',
      line: 'No, you said the baby *creeps you out*. — No, the little girl *creeps me out*.',
      said: '「赤ちゃんが気味悪いって言ったでしょ」「いや、女の子のほう」と言い合う。',
      mean: 'creep out ＝ ぞっとさせる、気味悪く感じさせる。日常でよく使う。',
      trap: 'creep ＝ ゆっくり進む、と取ると別の意味になる。イライラでもなく、ぞわっとする感じ。',
      use: 'This empty hotel kind of creeps me out.（このがらんとしたホテル、ちょっと不気味）' },

    // R fix: blind pass 60 %; the key was the only "polite" (nuanced) choice (K6), and "starting their fight" a
    //   filler. Now three plain readings, with the お先に失礼 frame as a trap.
    // why: leaving ← Japanese frame: sorry before excusing oneself; sympathy ← sorry = 気の毒に
    { id: 'r1', skill: 'pragma', level: 'B2', point: 'sorry', reveals: ['slower'], seg: [12.9, 16],
      stem: 'When Phoebe says “You guys, I’m sorry…”, what is she doing?',
      choices: ['Interrupting them to ask for something', 'Apologizing before she leaves them alone',
                'Saying she feels bad that they’re fighting'], a: 0,
      cue: '「I’m sorry」のすぐあと、何を頼むか。',
      line: 'You guys, *I’m sorry*. Can you please talk a little slower?',
      said: '言い合いに入り込み、「ごめん、もう少しゆっくり話して」と頼む。',
      mean: 'この sorry は謝罪ではなく、話をさえぎる前の軽い前置き。「ちょっといい？」に近い。',
      trap: 'sorry ＝ 謝る、気の毒、と取りやすい。すぐあとに頼みが来たら割り込みの合図。',
      use: 'Sorry, could you say that again?（すみません、もう一度言ってもらえますか）' },

    // R new: replaces i1 (infer ≥ 2). Blind read 40 %.
    // why: hopes to be in it ← "your book" heard with interest; how it's going ← near words: "going in your book" ≈
    //   "how's your book going"
    { id: 'i3', skill: 'infer', level: 'B2', point: 'caught', reveals: ['book'], seg: [12.9, 18.6],
      stem: 'What does the question “This is going in your book?” show?',
      choices: ['One of them has just caught on to her plan', 'One of them hopes their fight will be in it',
                'One of them asks how her book is going'], a: 0,
      cue: '彼女の頼みのすぐあと、上がり調子の質問。',
      line: '*This is going in your book?*',
      said: '一人が「これ、きみの本に書くの？」と驚いて聞き返す。',
      mean: 'フィービーが今のけんかを書き留めていると、ここで初めて気づいた反応。',
      trap: 'going と book が聞こえると「本の進み具合」を聞いたと取りやすい。語順と上がり調子で、驚きの確認と分かる。',
      use: 'Wait, is this going online?（待って、これネットに出すの？）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'slower', seg: [13.9, 16.1],
      stem: 'Type what Phoebe asks: “Can you please ___?” (4 words)', answer: 'talk a little slower',
      cue: '「please」のあと。最後は比べる形。', line: 'Can you please *talk a little slower*?',
      said: '「もう少しゆっくり話してくれる？」。talk a がつながり、little の t は弾む。',
      mean: '書き留めたいので、けんかの速さを落としてほしいと頼んでいる。',
      trap: 'talk a が「トーカ」と一語に聞こえ、a を落としやすい。',
      use: 'Could you speak a little slower?（もう少しゆっくり話してもらえますか）' },

    // R fix: the key was the only choice with clip words (K6); "win an argument" → an advice reading reusing "relationship"
    // why: past boyfriends ← "relationships" in the wrong relation; fix after a fight ← "relationship" + the fight in front of her
    { id: 'd2', skill: 'detail', level: 'B1', point: 'about', reveals: ['pitfalls'], seg: [15.9, 21.4],
      stem: 'What does Phoebe say her book is about?',
      choices: ['Relationships, and what not to do', 'Her own past boyfriends and dates',
                'How to fix a relationship after a fight'], a: 0,
      cue: '「This is going in your book?」への返事。',
      line: 'Yeah, it’s about *relationships*, you know, the traps, the pitfalls, *what not to do*.',
      said: '本は恋愛関係についてで、落とし穴や「やってはいけないこと」を書く、と言う。',
      mean: '目の前の二人のけんかは「悪い例」として使える、ということでもある。',
      trap: 'relationships だけ聞くと、自分の恋愛や仲直りの本と思いやすい。あとに続く例まで聞く。',
      use: 'It’s a book about travel mistakes.（旅の失敗についての本だよ）' },

    // R fix: blind pass 80 %: the stem quoted the examples that answer it (S2), and "changes the topic" was a filler.
    //   The stem now stops before them. Its stem and line show d2's key: reveals about.
    // why: ask if they know ← literal "you know" = 知ってる？; can't find the word ← "you know" heard as a stalling filler
    { id: 'm1', skill: 'marker', level: 'B2', point: 'youknow', reveals: ['about'], seg: [16.9, 21.4],
      stem: 'What does “you know” do right after “it’s about relationships”?',
      choices: ['It leads into what she means by that', 'It asks if they’ve heard of the book',
                'It shows she can’t find the right word'], a: 0,
      cue: '「you know」のあとに並ぶ言葉。', line: 'it’s about relationships, *you know*, the traps, the pitfalls…',
      said: '「恋愛についてで、ほら、落とし穴とか…」と、具体例を並べていく。',
      mean: 'この you know は質問ではなく、「ほら、つまり」と例や説明につなぐ言葉。',
      trap: '「知ってる？」と文字通りに取りやすい。上がらず、すぐ例が続くなら説明への入り口と考える。',
      use: 'It’s a small place, you know, very local.（小さい店で、ほら、地元の感じ）' },

    // R fix: blind pass 90 %: "fall into" in the key echoed pit-fall, and "places where couples fight" was a filler
    // why: tricks ← trap = わな set for someone; arguments ← pitfalls heard as big blow-ups
    { id: 'p3', skill: 'phrase', level: 'C1', point: 'pitfalls', reveals: ['about'], seg: [16.9, 21.4],
      stem: 'What does Phoebe mean by “the traps, the pitfalls”?',
      choices: ['Common mistakes couples make', 'Tricks partners play on each other',
                'Arguments that break couples up'], a: 0,
      cue: '並んだ二語のあと、まとめの言い方。',
      line: 'the *traps*, the *pitfalls*, what not to do',
      said: '「落とし穴、つまずきどころ」と言いかえを重ねる。',
      mean: 'pitfall ＝ 気づかずにはまる問題。三つとも「よくある失敗」を言いかえている。',
      trap: 'trap を「人にしかけるわな」と取りやすい。言いかえは what not to do で意味をつかむ。',
      use: 'What are the pitfalls of renting a car?（レンタカーの注意点は？）' },

    // R fix: blind pass 85 % (the key the only negative feeling); now a "didn't catch it" reading (Excuse me? =
    //   pardon?) and a pleased one, both off only by tone and context
    // why: didn't catch it ← Excuse me? = もう一度; pleased ← being put in a book read as flattering
    { id: 't1', skill: 'attitude', level: 'B2', point: 'excuse', seg: [18.6, 25.9],
      stem: 'After hearing about the book, how does the person saying “Excuse me?” feel?',
      choices: ['Offended by what she said about them', 'Confused, since they didn’t catch it',
                'Pleased to be put in her book'], a: 0,
      cue: '「what not to do」のあと、上がり調子の短い返事。',
      line: 'the traps, the pitfalls, what not to do. … — *Excuse me?*',
      said: 'けんかを「やってはいけない例」と言われ、「はあ？」と返す。',
      mean: '強い上がり調子の Excuse me? は「今なんて？」というむっとした反応。',
      trap: 'Excuse me? を「もう一度」と取りやすい。聞き返しなら軽く上がるが、強く上がると怒りのサイン。',
      use: 'Excuse me? That’s my seat.（ちょっと、そこ私の席ですけど）' },

    // R fix: blind pass 75 % ("bored" a filler); now the sarcasm reading its EAR CHECK is about. Level B2 → C1
    //   (sincere vs sarcastic).
    // why: sarcastic ← "this stuff's great" in the middle of a fight can sound ironic; glad they're honest ← "keep
    //   going" read as encouragement for them
    { id: 't2', skill: 'attitude', level: 'C1', point: 'great', seg: [20.9, 24],
      stem: 'How does Phoebe feel when she says “Keep going…”?',
      choices: ['Delighted, since it’s useful to her', 'Glad they’re finally being honest',
                'Annoyed, and being sarcastic'], a: 0,
      cue: '「Keep going」のあとの一言と、声の明るさ。',
      line: 'Keep going, *this stuff’s great*.',
      said: '「続けて、これすごくいい」と、けんかを止めずに書き続ける。',
      mean: '二人のためではなく、本のネタとして「いい」と喜んでいる。だから相手は気を悪くする。',
      trap: 'けんか中の great は皮肉にも聞こえやすいが、声は明るい。何が great なのかを考える。',
      use: 'Keep going, I’m listening.（続けて、聞いてるよ）' },

    // R fix: the key was the only choice with clip words (K6); "every couple has silly fights" → the same comfort
    //   script built from “people… really love”
    // why: love and fights ← "people… really love each other" in the wrong relation; new names ← "other people" comes
    //   later in the clip
    { id: 'd4', skill: 'detail', level: 'B2', point: 'matters', reveals: ['excuse'], seg: [23.9, 29.8],
      stem: 'Right after “Excuse me?”, what does Phoebe add about her book?',
      choices: ['That none of it matters if people are in love', 'That people really in love fight like this too',
                'That she will change the names in the book'], a: 0,
      cue: '「And how」で始まる文の後半。',
      line: 'And how *none of it matters* when the people *really love each other*.',
      said: '「本当に愛し合っていれば全部どうでもいい、ということもね」と付け足す。',
      mean: '二人が気を悪くしたので、あわてて良い話を足している。',
      trap: '「愛し合う人もけんかする」はよくある慰めだが、ここでは言っていない。And how のあとを聞く。',
      use: 'None of that matters now.（今となってはどうでもいいよ）' },

    // R fix: blind pass 60 %: the key was the longest and the only nuanced choice; now three of one length and kind.
    //   The stem said "last line", but her last line in the clip is the medicine one; it now points at the moment.
    // why: praising them ← "compliment" read literally; lie ← "believe anything you tell them"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'compliment', reveals: ['matters'], seg: [25.8, 37.5],
      stem: 'Why does Phoebe’s line about “a compliment” get a laugh?',
      choices: ['Her nice line was flattery, and they fell for it', 'She is quietly praising the couple for making up',
                'She is hinting that the couple lie to each other'], a: 0,
      cue: '前の一文で二人がどう反応し、次に何を書くか。',
      line: 'And how people will *believe anything you tell them* as long as it’s a *compliment*.',
      said: '二人が納得すると、「人はほめ言葉なら何でも信じる」とも書く。',
      mean: 'さっきの良い話はご機嫌取りで、二人がそれにのせられたと本人が明かしている。',
      trap: 'compliment から「ほめる予定」と取りやすい。直前の流れと合わせて、何を指すかを考える。',
      use: 'Flattery will get you nowhere.（おだてても何も出ないよ）' },

    // why: herself and an ex ← she writes about relationships; Joey ← the name is said just before
    { id: 'd3', skill: 'detail', level: 'B1', point: 'marsha', seg: [53.2, 62.8],
      stem: 'Who does Phoebe claim she is writing about?',
      choices: ['Two other people', 'Herself and an ex', 'Joey and a date'], a: 0,
      cue: '「I’m not writing about you」のあと。',
      line: 'I’m not writing about you, I’m writing about *other people*. — Who? — Marsha and Chester.',
      said: '「あなたたちじゃなくて、ほかの人のことを書いてるの」と言い、名前を二つ挙げる。',
      mean: 'other people ＝ 自分たちとは別の人。名前を聞かれて、すぐに答えている。',
      trap: '直前に Joey の名前が出るので選びやすい。not のあとの言いかえを聞く。',
      use: 'It’s not about you, it’s about the rules.（あなたのせいじゃなくて、決まりなの）' },

    // R drop: i1 (infer, "Marsha and Chester"): V1 + V2. The key rests on the names' first sounds matching Monica and
    //   Chandler, which the audio never says (show knowledge), and "still writing about them" is common sense after
    //   "stop writing about us" (blind 80 %). Never shipped, so deleted; i3 replaces it.

    // R fix: blind pass 80 % ("lets them read it" a filler); now a caught-and-confesses reading. Its notes give away
    //   p2's key: reveals medicine.
    // why: gives in ← "Okay, fine. Fine." heard as hers; caught and admits ← "I see what you're doing" heard as a confession
    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', reveals: ['phyllis', 'medicine'], seg: [53.5, 81],
      stem: 'How does the scene end for Phoebe?',
      choices: ['The couple turns her own trick on her', 'She gets caught and admits it’s about them',
                'She gives in and agrees to stop writing'], a: 0,
      cue: '「Okay, fine.」のあと、だれが何を書き始めるか。',
      said: '止めないフィービーに、今度は相手が彼女をネタに書き始める。',
      mean: 'したことがそのまま自分に返ってくる結末。最後の一言がそれをまとめている。',
      trap: 'Okay, fine. を「分かった、やめる」と取りやすいが、このあとは仕返しが来る。',
      use: 'Fine. Two can play that game.（いいよ、こっちも同じ手でいく）' },

    // R fix: blind pass 85 % (the baby fight ended a minute earlier, so that choice was a filler); now a real-Phyllis
    //   reading and a found-notes reading
    // why: mocking a friend ← "Phyllis" taken as a real person; read her notes ← "write about" + her book, wrong relation
    { id: 'i2', skill: 'infer', level: 'C1', point: 'phyllis', reveals: ['see'], seg: [65.2, 75],
      stem: 'Why does Phoebe say “Oh. I see what you’re doing”?',
      choices: ['She realizes “Phyllis” is really her', 'She realizes he’s mocking her friend Phyllis',
                'She realizes they’ve read her notes on them'], a: 0,
      cue: '直前に出た名前が、だれの名前に似ているか。',
      line: 'I will just write about *Phyllis*. … — Oh. *I see what you’re doing*.',
      said: '「じゃあフィリスのことを書く」と言うと、フィービーが「何してるか分かった」と返す。',
      mean: 'フィリスはフィービーの言いかえで、彼女の手口をそのまま返している。',
      trap: 'Phyllis を実在の人と取りやすい。直前の名前がだれに似ているか、何の仕返しかを聞く。',
      use: 'Oh, I see what you’re doing.（あ、何をしてるか分かったよ）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'see', reveals: ['phyllis'], seg: [70.8, 72.8],
      stem: 'Type what Phoebe says: “Oh. I ___.” (4 words)', answer: 'see what you\'re doing',
      cue: '「Oh.」のあと、短くつながる一続き。', line: 'Oh. I *see what you\'re doing*.',
      said: '「何してるか分かった」。what you’re が「ワッチャ」とつながる。',
      mean: '相手のたくらみに気づいたときの決まり文句。',
      trap: 'what you’re がひとかたまりで、you’re を落としやすい。t と y がつながると「チャ」になる。',
      use: 'I see what you did there.（うまいこと言ったね）' },

    // R fix: blind pass 95 %; "a cure she didn't need" was a filler. Now an own-advice reading (her book's advice as
    //   her "medicine") and a regret reading of "bitter".
    // why: own advice ← medicine read as her own remedy; regret ← "bitter" read as regret
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'medicine', seg: [76.2, 80.6],
      stem: 'What does Phoebe mean by “I have tasted my own medicine”?',
      choices: ['She got back what she did to them', 'She found her own advice doesn’t work',
                'She feels sorry for being so harsh'], a: 0,
      cue: '最後の一文。直前に何をされたか。',
      line: 'Ooh, I have *tasted my own medicine*, and it is *bitter*.',
      said: '「自分の薬の味を知った、苦い」と大げさに言う。',
      mean: '人にしたことを自分がされる、という意味。bitter と続けて笑いにしている。',
      trap: 'medicine を薬や「自分の助言」と取りやすい。taste と組むと「したことが返ってくる」の決まった言い方。',
      use: 'Now you know how it feels.（これでどんな気持ちか分かったでしょ）' },
  ]
};
