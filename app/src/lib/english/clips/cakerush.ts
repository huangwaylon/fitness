// REVIEW 2026-11-16: pass 4, fix 16, drop 0, new 0; ear checks 1
// OPEN: on a cold re-read p1 (75 %) and nt2 (70 %) stay guessable: a quoted “We want to be here…” invites the
//   “but” pattern, and “highlight” reads as sarcasm in any sitcom. Second rewrite, or accept as inherent?
// “me when they're singing happy birthday at a restaurant 💀 | iCarly #Shorts” (NickRewind, Best of the New iCarly 🎉):
// at Freddie's party, a guest with a date wants to leave; the host pleads, they strike a deal (cake, dancing, drinks,
// then out), and the guests rush the cake and the song.
// Segments from the captions, words from whisper (2026-11-16). No speaker is named in the audio, so items say “the
// host” (the one told “we know how hard you've worked on this”), “the guest” (the one with the date) and “the guests”;
// no key rests on which character speaks. Left out on purpose: “give me the cake / keys” at 51.7 s (whisper and the
// captions disagree) and the closing slapstick (53–60 s, a fall seen, not heard).
// EAR CHECK: 34.1 s r1 — the cut falls after “I'll get the candles” and before “Ah, no time” (“Ah, no” is whisper only;
//   the captions have just “time” at 34.7 s)
import type { Clip } from '../types.ts';

export const cakeRush: Clip = {
  id: 'cakerush', video: 'yWUOZoCryoQ', title: 'me when they’re singing happy birthday at a restaurant', dur: 60,
  wpm: 154, band: 'mid', tags: ['友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: V2 (blind 80 %): Pearl was the only real pair (“the host's” was filler); the distractors are now the mama
    //   named later and the guest's own “relationship” line, and the stem drops “party”, which ruled that line out
    // why: his mama ← “Freddie's mama” comes a few lines later; the guest's ← the reply repeats “relationship” about
    //   the date, the word in the wrong relation
    { id: 'd3', skill: 'detail', level: 'B1', point: 'pearl', seg: [0, 7.9],
      stem: 'Whose relationship does the host’s first line bring up?',
      choices: ['Freddie’s, with Pearl', 'Freddie’s, with Mama', 'The guest’s, with the date'], a: 0,
      cue: '冒頭の一文、relationship with のあと。',
      line: 'how important this party is to *Freddie’s relationship with Pearl*.',
      said: '「このパーティーがフレディとパールの仲にどれだけ大事か分かるよね」。',
      mean: 'パーティーは二人の関係のためだと言って、帰らせまいとしている。',
      trap: 'relationship は返事にも出て、mama もあとで出る。最初の文の with のあとの名前を聞く。',
      use: 'This trip is important to our relationship.（この旅行は二人の関係に大事なの）' },

    // R fix: V2 (blind 50 %): the key restated the gist (stay) against two odd reads; it now asks how the line works,
    //   against the host's later pitch and a Pearl reading
    // why: more fun later ← the host does list cake and drinks, but at 19 s, not in this line; Pearl takes it badly ←
    //   her name heard, tied to a feeling nobody states
    { id: 'i3', skill: 'infer', level: 'C1', point: 'pearl', seg: [0, 7.9],
      stem: 'What is the host doing with the very first line?',
      choices: ['Appealing to the guest’s loyalty to Freddie', 'Promising the guest more fun later on',
                'Warning that Pearl will take it badly'], a: 0,
      cue: '冒頭の You know how… で始まる一文の働き。',
      line: '*You know how important* this party is to Freddie’s relationship with Pearl.',
      said: '「二人にとってどれだけ大事か、分かるよね」と言う。',
      mean: '直接「帰らないで」とは言わず、フレディへの思いに訴えて引き止めている。',
      trap: 'あとのケーキや飲み物の話と混ざりやすい。この一文は You know の念押しだけで、約束はない。',
      use: 'You know how much this means to me.（これが私にとってどれだけ大事か分かるでしょ）' },

    // R fix: V2 (blind 70 %), S1: the stem said “leaving” (g1's key); the double date was weak, now the near miss
    //   “met once”
    // why: met once ← “never” is short and weak before “met”; dated a while ← “my relationship with” heard as an
    //   existing couple
    { id: 'i1', skill: 'infer', level: 'B2', point: 'nevermet', seg: [0, 7.9],
      stem: 'What does the reply tell us about the guest’s date?',
      choices: ['It’s with someone the guest has never met', 'It’s with someone the guest has met once',
                'It’s with someone the guest has dated a while'], a: 0,
      cue: '返事の最後、woman のあとの部分。',
      line: 'my relationship with *a woman I’ve never met*.',
      said: '「会ったこともない女性との関係に、このデートは大事」と言う。',
      mean: 'never met ＝ 会ったことがない。今夜が初対面。',
      trap: 'my relationship で長い付き合いを想像しやすい。never は弱く短いので、met の前の音を落とさない。',
      use: 'I’m meeting her for the first time tonight.（今夜、初めて会うんだ）' },

    // R fix: V2 (blind 70 %): “mocks as fake” and “only an excuse” were thin; the distractors now use the reply's own
    //   copied frame, and all three are the same shape
    // why: Freddie's is just as new ← right mechanism (the copied frame), wrong target, but “he of all people should
    //   know” treats his as real; only an excuse ← the “it's just an excuse” script, but the guest means to go
    { id: 'h1', skill: 'humor', level: 'C1', point: 'nevermet', seg: [0, 7.9],
      stem: 'Why is the guest’s reply about the date funny?',
      choices: ['It blows a first date up into a relationship', 'It hints Freddie’s relationship is just as new',
                'It admits the date is only an excuse to leave'], a: 0,
      cue: '主催者の言い方をまねた部分と、最後の三語。',
      line: 'how important this date is to *my relationship* with a woman *I’ve never met*.',
      said: '主催者の言い方をまねて「会ったこともない人との関係に大事」と返す。',
      mean: '始まってもいない仲を relationship と呼ぶ大げささが笑い。',
      trap: 'フレディの話の直後なので、彼をからかったと取りやすい。笑いの的は話し手自身の言葉。',
      use: 'It’s a big deal for me, too.（私にとっても大事なことなの）' },

    // R fix: V2 (blind 65 %): only the key fit “Then he… should”; all three are now readings of “of all people”
    // why: like everyone ← “of all people” read as “like all people”; get to decide ← read literally, “out of all the
    //   people here”
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'ofall', seg: [0, 7.9],
      stem: 'When the guest answers with “Then he…”, what is the point about Freddie?',
      choices: ['More than anyone, he should understand', 'Like everyone, he should already understand',
                'Of everyone here, he should get to decide'], a: 0,
      cue: 'Then he のすぐあとの、短い挟み込み。',
      line: 'Then he, *of all people*, should know how important this date is',
      said: '「だったら誰よりもフレディこそ、デートの大事さが分かるはず」と返す。',
      mean: 'of all people ＝「誰よりも」。恋人がいる彼なら分かるはず。',
      trap: 'all people を「みんなと同じく」と取るとずれる。人のすぐあとなら「誰よりもその人が」。',
      use: 'You, of all people, should know that.（あなたこそ、それを分かってるはずでしょ）' },

    // R fix: V2 (blind 65 %): “offers to stay” and “doubts Pearl” were far misses; now two near misses, a concession
    //   with a ranking and a topic change
    // why: matters more ← “Then” read as a concession, then a ranking nobody says; changes the subject ← the date is a
    //   new topic, but the frame is the host's own
    // anchor: 0–7.6 s the reply copies the host's frame word for word: “how important this … is to … relationship”
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'ofall', reveals: ['pearl', 'nevermet'], seg: [0, 7.9],
      stem: 'What does the guest’s reply do with the host’s point?',
      choices: ['Applies the same logic to the guest’s own date', 'Grants the point but says the date matters more',
                'Brushes the point aside to change the subject'], a: 0,
      cue: '二人の文の形を比べて。同じ語が何回出る？',
      line: '*how important this party is* to Freddie’s relationship… — Then he… should know *how important this date is*',
      said: '主催者の「関係にどれだけ大事か」を、ほぼ同じ形で「自分の関係に」と返す。',
      mean: '相手の理屈をそのまま使って言い返す型。関係が大事なら、自分のデートも同じだという主張。',
      trap: 'Then を「認めるけど」と取りやすいが、比べる語はない。相手の言葉をそのまま返したら、たいてい反論。',
      use: 'By that logic, I should go too.（その理屈なら、私も行かなきゃ）' },

    // R fix: V2 (blind 85 %): mostly i1's stem (“leaving”, now gone); “put off his date” becomes a Pearl reading
    // why: bring a date ← “date” and “relationship” recur, “out of here” missed; upset about Pearl ← the opening's
    //   “relationship with Pearl” heard as the sore point
    { id: 'g1', skill: 'gist', level: 'B2', point: 'leave', reveals: ['nevermet'], seg: [0, 30.9],
      stem: 'What is the opening argument between the host and the guests about?',
      choices: ['A guest wants to leave the party for a date', 'A guest wants to bring a date to the party',
                'A guest is upset that Freddie invited Pearl'], a: 0,
      cue: '最初のやりとりから、最後の out of here まで。',
      said: '主催者は残ってと頼み、ゲストはデートがあるから早く帰りたいと言う。',
      mean: 'パーティーに残るか、デートに行くかの押し問答。',
      trap: 'date が何度も出て、誰のデートか混ざりやすい。my relationship の my を拾う。',
      use: 'Sorry, I have to leave early tonight.（ごめん、今夜は早めに帰らなきゃ）' },

    // R fix: V2 (blind 80 %): “a long toast” was filler; now the sitcom turn and a candles mix-up, all “The guests…”
    // why: start to enjoy it ← the sitcom turn where reluctant guests come round; sneak out ← “I'll get the candles”
    //   and “out of here” heard in the wrong order
    { id: 'g2', skill: 'gist', level: 'B2', point: 'rush', reveals: ['candles', 'slow', 'deal'], seg: [0, 50.6],
      stem: 'Once the deal is made, how does the rest of the party go?',
      choices: ['The guests hurry the cake and song along', 'The guests stay on and start to enjoy it',
                'The guests sneak out while candles are fetched'], a: 0,
      cue: '後半の「ろうそく」の話と、歌の速さに注目。',
      said: 'ケーキまでいる約束をすると、ろうそくは省かれ、歌も途中から早口になる。',
      mean: '早く帰りたい気持ちが、パーティーの進め方にそのまま出ている。',
      trap: 'out of here だけ聞くとすぐ抜け出すように思えるが、約束どおりケーキまでは残る。',
      use: 'Let’s speed this up a little.（ちょっとペースを上げよう）' },

    // R fix: V2 (blind 65 %), K4: “you'd worked” didn't fit and “you work” was weak; cut to 3 with “you're working”,
    //   which fits the gap as well as the key
    // why: you worked ← the weak 've lost before w; you're working ← 've and 're both a short sound after “you”,
    //   and “on this” fits both
    { id: 's1', skill: 'sound', level: 'B2', point: 'worked', seg: [8.3, 13.85],
      stem: 'Fill the gap: “and we know how hard ___ on this”',
      choices: ['you’ve worked', 'you worked', 'you’re working'], a: 0,
      cue: 'hard のすぐあと、you に付く小さな音。',
      line: 'we know how hard *you’ve worked* on this',
      said: '「どれだけ頑張ってきたか分かってる」と言う。',
      mean: 'you’ve は「ユv」と短く、すぐ worked につながる。',
      trap: 'v は弱く、w の前でほぼ消えるので you worked に聞こえやすい。you のあとの小さな唇の音を待つ。',
      use: 'You’ve worked so hard this year.（今年は本当によく頑張ったね）' },

    // R fix: V2 (blind 80 %), S2: the stem quoted “but face it”, which gives away a softener; it now quotes the opening
    // why: promises to stay ← “We want to be here for Freddie” heard alone; thanks on the way out ← “how hard you've
    //   worked” heard as thanks before leaving
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'faceit', reveals: ['worked'], seg: [8.3, 18.8],
      stem: 'What does the guests’ opening, “We want to be here for Freddie…”, do?',
      choices: ['Cushions a complaint they’re about to make', 'Promises they’ll stay to the end for Freddie',
                'Thanks the host before they head out the door'], a: 0,
      cue: 'but の前と後で、話の向きが変わるところ。',
      line: '*We want to be here for Freddie*, and *we know how hard you’ve worked* on this, but face it…',
      said: '「フレディのために居たいし、頑張ったのも分かってる。でも正直…」と前置きする。',
      mean: '先に相手を立ててから、but のあとで本音（退屈）を言う、やわらげの型。',
      trap: '前半だけ聞くと「残る」「お礼」に聞こえる。but の前の好意的な言葉は、後の本音の下準備。',
      use: 'I know you tried, but honestly…（頑張ったのは分かるけど、正直…）' },

    // R fix: V2 (blind 50 %): “Freddie watching with Pearl” broke the parallel; now three things the mom did
    // why: showing ← “episode” and a TV picture, “recapping” lost; recording ← “recap” and “record” share their first
    //   sounds
    { id: 'd2', skill: 'detail', level: 'B1', point: 'highlight', seg: [8.3, 18.8],
      stem: 'What do the guests call the best part of the night so far?',
      choices: ['Freddie’s mom retelling a TV episode', 'Freddie’s mom showing a TV episode',
                'Freddie’s mom recording a TV episode'], a: 0,
      cue: 'face it のあと、mama の次の動詞。',
      line: 'Freddie’s mama *recapping an episode* of Yellowstone was the *highlight* of the night.',
      said: '「ママがドラマの1話を語ったのが、今夜の見どころだった」と言う。',
      mean: 'recap ＝ 内容をまとめて話す。highlight ＝ いちばんの場面。',
      trap: 'episode で「番組を見せた」、出だしで record と取りやすい。recap は口で語る。',
      use: 'Can you recap what I missed?（見逃したところ、ざっと教えて）' },

    // R fix: V2 (blind 75 %), K5: the sincere choice was the only “Admit it:”; all three now start “Let's be honest:”
    // why: stole the show ← sincerity flip, “highlight” taken as praise; talks too much ← right mechanism, wrong target
    //   (the mom, not the party)
    // anchor: 11.0–13.3 s “we know how hard you've worked on this, but face it”: the jab follows praise of the host's
    //   work, so the party is its target
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'highlight', reveals: ['faceit', 'worked'], seg: [8.3, 18.8],
      stem: 'Which plain-English version keeps what the guests mean by “the highlight of the night”?',
      choices: ['Let’s be honest: this party has been dull', 'Let’s be honest: Freddie’s mom stole the show',
                'Let’s be honest: Freddie’s mom talks too much'], a: 0,
      cue: 'but face it の前で、何をほめていたか。',
      line: 'we know *how hard you’ve worked on this*, but face it… was the *highlight* of the night.',
      said: '「頑張ったのは分かる。でも正直、ママのドラマの話が今夜の見どころだった」。',
      mean: '見どころがその程度なら、ほかは退屈ということ。ほめ言葉の形で、主催者のパーティーをけなしている。',
      trap: 'ほめ言葉か、ママへの悪口に取りやすい。but face it の前に何があるかで的を決める。',
      use: 'The best part was the free coffee.（いちばん良かったのは無料のコーヒーだったね）' },

    // R fix: V2 (blind 75 %): the key was the only soft choice; the distractors are now the concession and the
    //   surrender readings, each just as soft
    // why: grants ← “Well” read as a slow yes (日本語の「まあね」); giving up ← a sigh-like “well” heard as letting
    //   them go
    { id: 'm1', skill: 'marker', level: 'B2', point: 'well', seg: [16.7, 24.85],
      stem: 'When the host answers the guests, what does the first word do?',
      choices: ['Opens a counter to their point', 'Grants their point, then moves on', 'Signals the host is giving up'],
      a: 0,
      cue: '返事の最初の一語と、そのあとに並ぶもの。',
      line: '*Well*, there’s also cake and a disco playlist…',
      said: '「でもね、まだケーキもディスコの曲もあるし…」と返す。',
      mean: '文頭の Well ＝ 相手の言い分を受けて、別の見方を出す合図。',
      trap: 'Well を「まあね」と同意に取りやすい。あとに also で良いことが並ぶなら、言い返しの始まり。',
      use: 'Well, there’s still dessert.（でもさ、まだデザートがあるよ）' },

    // R fix: V2 (blind 85 %), S1: “listing what is still to come” gave away a pitch; the stem now just points at the
    //   reply
    // why: let go after the cake ← “cake” heard first, the drinks after it missed; telling off ← the host was just told
    //   the party is dull
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'well', seg: [16.7, 24.85],
      stem: 'In the reply that starts with “Well”, how does the host come across?',
      choices: ['Keen to win them over to staying', 'Ready to let them go after the cake', 'Annoyed, and telling them off'],
      a: 0,
      cue: 'also のあとに並ぶものの数と、最後の言い方。',
      line: 'there’s *also* cake and a disco playlist and *drinks that need to happen*.',
      said: '「ケーキも曲も、飲みもあるよ」と次々に並べる。',
      mean: '帰らないでとは言わず、楽しみを並べて引き止めている。',
      trap: 'けなされた直後なので怒りと取りやすいが、責める言葉はない。and でつなぐ列挙は説得の合図。',
      use: 'And there’s karaoke, too!（それにカラオケもあるよ！）' },

    // why: just the cake ← “cake” comes first in both lists; cake and dancing ← the “okay” afterthought missed, so the
    //   drinks drop out
    { id: 'd5', skill: 'detail', level: 'B1', point: 'deal', seg: [16.7, 30.9],
      stem: 'Which of the host’s offers do the guests agree to stay for?',
      choices: ['All three, the drinks too', 'Only the cake, nothing else', 'The cake and dancing, no drinks'], a: 0,
      cue: 'Fine のあとに並ぶもの。okay のあとまで聞く。',
      line: 'We will stay for *cake and dancing and, okay, we’ll drink* heavily',
      said: '「ケーキとダンスまではいる。まあいいや、飲みもする」と言う。',
      mean: '三つ（ケーキ・曲・飲み物）を全部受け入れる。okay は最後の一つも認める合図。',
      trap: 'cake and dancing で終わりと思うと飲み物が抜ける。okay のあとまで聞く。',
      use: 'Okay, one more drink, then we go.（分かった、もう一杯飲んだら行こう）' },

    // R fix: V2 (blind 75 %), S3: the key was the middle of two extremes; now two other mixed readings; the cue's
    //   “but” was a key-only word
    // why: glad ← “okay, we'll drink heavily” sounds keen; as long as needed ← “We will stay” heard, “after that” missed
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'deal', reveals: ['outofhere'], seg: [16.7, 30.9],
      stem: 'How do the guests feel about staying, from their reply?',
      choices: ['Willing, but only up to a point', 'Glad, now drinks are on offer', 'Willing to stay as long as needed'],
      a: 0,
      cue: '最初の一語と、最後の after that のあと。',
      line: '*Fine*. We will stay for cake… *but after that, we are out of here*.',
      said: '「分かった。ケーキまではいる。でもそのあとは帰るから」と言う。',
      mean: 'Fine ＝ しぶしぶの「いいよ」。条件付きで残る、という妥協。',
      trap: 'We will stay だけだと最後まで、drink heavily だけだと乗り気に聞こえる。両端を聞く。',
      use: 'Fine, but just one hour.（いいよ、でも1時間だけね）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'outofhere', reveals: ['deal'], seg: [27.6, 30.95],
      stem: 'Type what the guest says: “but after that, we are ___.” (3 words)', answer: 'out of here',
      cue: 'we are のあと、つながった短い三語。',
      line: 'but after that, we are *out of here*.',
      said: '「でもそのあとは、ここを出るから」と言う。',
      mean: 'out of の t は弾み、of は弱く「アウラ」に近い。out of here ＝ 帰る・出ていく。',
      trap: '三語が一つの音に聞こえて、here だけ書きやすい。間の of を落とさない。',
      use: 'I’m out of here. See you tomorrow.（じゃ帰るね、また明日）' },

    // R fix: V2 (blind 70 %): “where they are” was thin; now the birthday script (an age joke) and the polite one
    // why: candles joke ← the birthday script; thank-you ← the polite script for an offer
    { id: 'r1', skill: 'predict', level: 'B2', point: 'candles', seg: [27.6, 34.1], then: [34.1, 38.5],
      stem: 'When someone offers to get the candles, what kind of reply comes next?',
      choices: ['A brush-off, to speed things up', 'A joke about how many candles it needs',
                'A thank-you, plus a request for a lighter'],
      a: 0,
      cue: '少し前に、ゲストたちは何を約束した？',
      line: 'I’ll get the candles. — Ah, *no time*. Everybody, sing!',
      said: '「ろうそく取ってくる」に、「いや、時間ない。みんな歌って！」と返される。',
      mean: 'ケーキまでいたら帰る約束なので、ろうそくも省いて早く終わらせたい。',
      trap: '申し出には「ありがとう」が来ると思いやすい。早く帰りたい人の返事は、断りになりやすい。',
      use: 'No time for that. Let’s just go.（そんな時間ない。もう行こう）' },

    // why: tired, bored ← an unknown word filled in from the mood of a dull party; “Who wants cake?” settles it
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'famished', seg: [27.6, 36.95],
      stem: 'Right after the deal, how does the next speaker say they feel?',
      choices: ['Very hungry', 'Very tired', 'Very bored'], a: 0,
      cue: 'Hey のあとの一語と、すぐあとの質問。',
      line: 'Hey, I’m *famished*. Who wants cake?',
      said: '「ああ、お腹ぺこぺこ。ケーキ食べたい人？」と言う。',
      mean: 'famished ＝ とてもお腹がすいた。約束のケーキにすぐ話を進めるための一言。',
      trap: '知らない語は場の空気（退屈・疲れ）で埋めたくなる。直後の Who wants cake? が意味を決める。',
      use: 'I’m famished. Let’s grab a bite.（お腹ぺこぺこ。何か食べよう）' },

    // why: too loud ← “slow” blurred under the singing, its vowel close to “loud”; too long ← a common complaint about
    //   the song; the quick singing right after settles it
    { id: 'd4', skill: 'detail', level: 'B1', point: 'slow', seg: [42.4, 50.6],
      stem: 'What does someone say about the birthday song?',
      choices: ['It’s always been too slow', 'It’s always been too loud', 'It’s always been too long'], a: 0,
      cue: 'You know what? のあと、最後の一語。直後の歌い方も。',
      line: 'I have always thought that song was *too slow*.',
      said: '「前から、あの歌は遅すぎると思ってた」と言い、すぐ早口で歌い出す。',
      mean: '早く終わらせたいので、歌も速くしてしまう。言葉と歌い方が一致している。',
      trap: 'slow と loud、long は母音が似て混ざりやすい。直後の歌の速さで確かめる。',
      use: 'I’ve always thought this movie was too long.（前からこの映画は長すぎると思ってた）' },
  ]
};
