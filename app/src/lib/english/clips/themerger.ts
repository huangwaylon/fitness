// REVIEW 2026-11-16: pass 11, fix 12, drop 1, new 0; ear checks 2
// OPEN: s1 (60 %) and m1 (50 %) kept: the key is the default grammar / the textbook use, and no stronger distractor
//   avoids a second key. Fine to ship?
// “The Merger - The Office US” (the official The Office channel, BEST OF SEASON 3): staff from the Stamford branch
// arrive in Scranton; Michael hands out gift bags, Andy explains his plan to rise and tries it on Michael, Jim comes
// back, Dwight warns him, and Jim's old desk ends up with someone else.
// Segments from the captions, words from whisper (2026-11-16). The sources differ at 5–9 s (the newcomer's name),
// 84 s, 161 s ("want any of" / "want to hear"), 170 s ("the slaves" / "this names"), 176–179 s (captions empty),
// 181 s, 216–218 s ("smile under" / "spider on my forehead") and 247–250 s ("want to pack" / "want to Peck"); no key
// rests on those words. Whisper loops "That's why I got the desk" from 276 s; nothing after 276.3 s is used. No item
// uses the "exotic-looking… GI" remark (84–87 s), the 155–172 s stretch or the "ball and chain" line.
// EAR CHECK: 182.8 s a1 — "Awesome." assumed Jim's, answering "I know. I don't care." (whisper starts a new turn there)
// EAR CHECK: 252.6 s p3 g3 c2 — "it's really your call" assumed Jim's and "Cool. Thank you." the man at the desk's
//   (the one who answers "Yeah" to "Are you sitting here now?"); neither source names them
import type { Clip } from '../types.ts';

export const theMerger: Clip = {
  id: 'themerger', video: '6G3L94NXGc4', title: 'The Merger', dur: 299, wpm: 149, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: own children ← "Dad" taken as a gift from his kids; staff's families ← "family" said, in the wrong relation
    { id: 'd1', skill: 'detail', level: 'B2', point: 'dad', seg: [17.2, 26.6],
      stem: 'Why does Michael say the words on his mug fit him?',
      choices: ['Many of the staff have no other family', 'He is a father to children of his own',
                'He looks after his staff’s families too'], a: 0,
      cue: '「a lot of these people」のあとの理由。',
      line: 'a lot of these people, *this is the only family they have*. So… this says, “World’s Best Dad.”',
      said: '「多くの人にはここが唯一の家族。だからこのマグは自分に合う」と話す。',
      mean: '自分を職場の父親役だと思っている。as far as I’m concerned は「自分に言わせれば」。',
      trap: 'Dad から本人の子どもを想像しやすい。理由は so の前にある。',
      use: 'As far as I’m concerned, you’re family.（僕に言わせれば、君は家族だよ）' },

    // why: knew it ← "I knew that" taken literally; correcting ← the repeated "Gardner" heard as fixing how it's said
    { id: 'i1', skill: 'infer', level: 'B2', point: 'knew', seg: [27.3, 34.9],
      stem: 'When Tony gives his last name, what does Michael’s reply show?',
      choices: ['He had forgotten it and is covering up', 'He knew it and wanted Tony to say it',
                'He is correcting how Tony said the name'], a: 0,
      cue: '名字を聞いたあとの、マイケルの短い一言。',
      line: 'Tony — *What’s your last name?* — Gardner. — Gardner. *I knew that.*',
      said: '「トニー…名字は？」「ガードナー」「ガードナー。知ってたよ」と言う。',
      mean: '自分で名字を聞いた直後の「知ってた」は、忘れていたのをごまかす決まり文句。',
      trap: 'I knew that を文字どおり取りやすい。直前に自分で聞いているかを確かめる。',
      use: 'Oh, right. I knew that.（あ、そうそう。知ってた）' },

    // R fix: K1: "None will be given to the staff" is arguably true ("just for guests"; leftovers are sold, not given);
    //   a kind-boss promise replaces it
    // why: free ← "later" + "left over" heard as a promise; more ordered ← the kind-boss script, "just for guests" heard
    //   as "yours are coming"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'giftbag', seg: [37.4, 44.9],
      stem: 'What does Michael say to the worker who missed out on a gift bag?',
      choices: ['Any leftovers can be bought later', 'Any leftovers will be handed out free',
                'More will be ordered for the staff'], a: 0,
      cue: '「just for guests」のあと、if の文の動詞。',
      line: 'they’re just for guests. If there are any left over, *you can buy one later*.',
      said: '「客用なんだ。余ったら、あとで買えるよ」と答える。',
      mean: '自分の部下にはおまけを売る、というずれた気配り。動詞の buy がポイント。',
      trap: 'later と left over で「あとでもらえる」と思いやすい。動詞を聞きのがさない。',
      use: 'Any left? Can I buy one?（余ってたら一つ買えますか）' },

    // R drop w1: K1/§9.7: the key rests on who says "I love your sweater" (57.8 s), which neither source settles; the
    //   follow-up "I've always wanted to learn" fits the complimenter, which would make Karen's mother the key

    // why: two ← "number two" is heard just before; sixteen ← -teen/-ty, and "six" links into "weeks"
    { id: 'n1', skill: 'number', level: 'B1', point: 'weeks', seg: [97.8, 101.4],
      stem: 'How soon does Andy say he’ll reach his goal in Scranton?',
      choices: ['In two weeks', 'In six weeks', 'In sixteen weeks'], a: 1, keep: true,
      cue: '文の最後、weeks の前の数。',
      line: 'I’ll be the number two guy here in Scranton *in six weeks*.',
      said: '「6週間でスクラントンのナンバー2になる」と言う。',
      mean: '来たばかりで、6週間で二番手になると宣言している。自信の強さが見える。',
      trap: 'two が先に聞こえるので数字を取り違えやすい。何の数かを後ろの名詞で確かめる。',
      use: 'I’ll be done in two hours.（2時間で終わるよ）' },

    // R fix: V2 (blind 75 %, right): "worries" and "wishes" were stock fillers; a social reading of his methods and a
    //   keyword trap on the place replace them
    // why: make friends ← "name repetition, personality mirroring" heard as a plan to be liked, not to rise; Stamford ←
    //   "here in Scranton" heard as a place he means to leave
    { id: 'g2', skill: 'gist', level: 'B1', point: 'plan', seg: [97.8, 113.6],
      stem: 'What is Andy mainly telling the camera about?',
      choices: ['How he plans to get ahead fast here', 'How he plans to make friends fast here',
                'How he plans to get back to Stamford soon'], a: 0,
      cue: '最初の宣言と、そのあとの「How?」への答え。',
      line: 'I’ll be the *number two guy* here… I’m *always thinking one step ahead*…',
      said: '「すぐにここのナンバー2になる」と言い、そのための方法と心がまえを並べる。',
      mean: '新しい職場への不安ではなく、出世の作戦を自信たっぷりに語っている。',
      trap: '人づきあいの話に聞こえやすい。最初の number two guy で目的が分かる。',
      use: 'I’m always thinking one step ahead.（いつも一歩先を考えてる）' },

    // R fix: V2 (blind 50 %, right): the key echoed "name repetition" word for word; reworded so all three are tips
    // why: short handshakes ← "handshake" is said, but with "never breaking off"; small facts ← a common tip that sits
    //   near "name repetition"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'methods', reveals: ['mirror'], seg: [97.8, 106.2],
      stem: 'Which of these is one of Andy’s methods for getting ahead?',
      choices: ['Using people’s names again and again', 'Keeping his handshakes firm but short',
                'Remembering small facts about people'], a: 0,
      cue: '「How?」のあとに並ぶ三つ。',
      line: '*Name repetition*, personality mirroring, and *never breaking off a handshake*.',
      said: '方法は「名前のくり返し」「相手に合わせる」「握手を切らない」。',
      mean: '名前を呼び、相手をまねて好かれる作戦。このあと実際にやる。',
      trap: 'handshake は聞こえるが never breaking off ＝握手をやめない。短くする話ではない。',
      use: 'Sorry, it’s Sarah, right? Sarah.（サラさんですよね。サラさん）' },

    // why: climbs slowly ← "step" heard as a career built bit by bit; mocks carpenters ← the odd trade comparison heard as
    //   a dig at them
    { id: 'h1', skill: 'humor', level: 'C1', point: 'stairs', seg: [105.75, 113.6],
      stem: 'Why does Andy’s comparison to a carpenter get a laugh?',
      choices: ['It takes “step” literally and so means nothing', 'It admits that he climbs slowly, one step at a time',
                'It mocks carpenters as people who never plan ahead'], a: 0,
      cue: 'one step ahead と、たとえの最後の語。',
      line: 'I’m always thinking *one step ahead*, like a *carpenter that makes stairs*.',
      said: '「いつも一歩先を考えている。階段を作る大工のように」と言う。',
      mean: 'one step ahead ＝先を読む。その step を階段の段にすりかえた、中身のないたとえ。',
      trap: '出世の話なので「一段ずつ」と取りやすい。たとえが言葉遊びだけかを聞く。',
      use: 'She’s always one step ahead of us.（彼女はいつも一枚上手だ）' },

    // R fix: V2 (blind 70 %, right) + S4 (24.7 s for an infer): the segment is now the "little kingdom" echo only
    //   (127–141 s), and "politely fixing the greeting" becomes a reading of the our → your change
    // why: correcting ← "our little kingdom" → "your little kingdom" heard as a fix; knows him ← the nickname "Mike"
    //   heard as old familiarity
    { id: 'i2', skill: 'infer', level: 'C1', point: 'mirror', seg: [127.0, 141.0],
      stem: 'When Andy answers Michael’s greetings, what is he doing?',
      choices: ['Echoing Michael’s own words back to him', 'Correcting what Michael called the office',
                'Showing that he already knows Michael well'], a: 0,
      cue: 'マイケルの言葉と、アンディの返しを比べて。',
      line: 'Welcome to our *little kingdom*. … — …thank you for welcoming me to *your little kingdom, Mike*.',
      said: '「小さな王国へようこそ」に「小さな王国に迎えてくれてありがとう、マイク」と同じ語で返す。',
      mean: '先に語った「まね」を、その場でやっている。',
      trap: 'Mike から古い知り合いと取りやすい。our を your にしただけで、同じ語のくり返し。',
      use: 'You must be Lisa. Nice to meet you.（リサさんですね。はじめまして）' },

    // R fix: V2 (blind 65 %, right): "too busy to notice" was weak; "sees through it" (right target, wrong direction)
    //   replaces it
    // why: Andy ← the copying is clumsy enough to look as if it must fail (right mechanism, wrong target); sees through
    //   ← Michael's "Oh." after "Mike" heard as catching on, refuted by "You know who I really like?"
    // anchor: 146.8–153.3 s right after the "nifty gifties" echo, Michael tells the camera "You know who I really
    //   like? It's this guy Andy Bernard. He has got this very likable way about him."
    { id: 'c1', skill: 'humor', level: 'C2', point: 'mirror', seg: [132.1, 153.4],
      stem: 'In this exchange and Michael’s comment after it, who is the joke on?',
      choices: ['Michael, who is won over by being copied', 'Andy, whose copying is too clumsy to work',
                'Michael, who sees through Andy’s copying'], a: 0,
      cue: '場面のすぐあと、マイケルがカメラに言うこと。',
      line: 'They’re nifty gifties. — *You know who I really like?* It’s this guy Andy Bernard.',
      said: '言葉をまねされた直後、マイケルはカメラに「本当に気に入ったのはアンディ。感じがいい」と話す。',
      mean: 'まねと名前の連呼という見え見えの作戦に、まんまと乗っている。笑われているのはほめている本人。',
      trap: 'まねが下手なのでアンディが笑われていると取りやすい。カメラへの一言で、作戦が効いたかを確かめる。',
      use: 'Weird, but I kind of like him already.（変だけど、もう何となく好き）' },

    // dict: "has got" in full, where "he's got" is the usual form
    { id: 'x1', skill: 'dict', level: 'B2', point: 'hasgot', reveals: ['mirror'], seg: [147.3, 153.3],
      stem: 'Type it: “___ this very likable way about him.” (3 words)', answer: 'he has got',
      cue: '「Andy Bernard」のすぐあと、三語。',
      line: '*He has got* this very likable way about him.',
      said: '「彼にはとても好かれる感じがある」とカメラに話す。',
      mean: 'has got ＝ has（持っている）。ふつうは he’s got だが、ここは has が聞こえる。',
      trap: 'he’s got と思い込むと has を書きのがす。3語なので縮めずに書く。',
      use: 'She’s got a really nice way about her.（彼女には感じのいい雰囲気がある）' },

    // R fix: V2 (blind 70 %, right) + S4 (15.5 s): the key no longer says "used to work here", the weak "upset with old
    //   friends" becomes a test of memory, and the segment ends after "good to be back"
    // why: just hired ← "I'm new here" taken at face value; remembers ← pretending to be new heard as checking who
    //   still knows him
    { id: 'd4', skill: 'detail', level: 'B2', point: 'back', seg: [173.9, 185.4],
      stem: 'Why does Jim introduce himself the way he does?',
      choices: ['As a joke, pretending they’ve never met', 'Because he has just been hired here',
                'To see whether anyone remembers him'], a: 0,
      cue: '自己紹介のあとの説明と、「good to be」の後ろ。',
      line: 'Hi, I’m Jim. I’m new here. … a little *joke* there about how we never met. … It’s *good to be back*.',
      said: '「ジム、新人です」と言い、「初対面のふりの冗談」と説明して「戻れてうれしい」と言う。',
      mean: '前にここで働いていたので「新人」は冗談。back で戻ってきたと分かる。',
      trap: 'I’m new here を文字どおり取りやすい。あとの説明と back まで聞く。',
      use: 'It’s good to be back.（戻ってこられてうれしい）' },

    // R fix: V2 (blind 55 %, right): "Glad: they feel relaxed" was weak; a sincere reading tied to "good to be back"
    //   replaces it
    // why: hurt ← "I don't care" heard as landing hard (the Japanese frame: a cold reply = 気まずい); sincere ← the
    //   "It's good to be back" that follows heard as the mood of "Awesome"
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'awesome', reveals: ['back'], seg: [178.9, 183.75],
      stem: 'After the reply to his explanation, how does Jim’s one-word answer sound?',
      choices: ['Dry: he shrugs off the cold reply', 'Hurt: he’s stung by the cold reply',
                'Sincere: he’s just happy to be back'], a: 0,
      cue: '「I don’t care」への返事の一語。',
      line: 'a little joke there about how we never met. — I know. *I don’t care.* — *Awesome.*',
      said: '冗談だったと説明すると「知ってる。どうでもいい」と返され、「最高」と一言。',
      mean: '「どうでもいい」に「最高」は合わない。そのずれで、冷たい返事を受け流している。',
      trap: 'awesome を文字どおり喜びと取りやすい。前の言葉と合わない返事は受け流しの合図。',
      use: 'You’re late again? Great. Awesome.（また遅刻？最高だね）' },

    // why: did ← do/did both shrink to "d"; would ← the weak "d" heard as 'd (would)
    { id: 's1', skill: 'sound', level: 'B2', point: 'stand', seg: [189.3, 192.6],
      stem: 'Fill the gap: “___ stand with Pam?”',
      choices: ['Where do I', 'Where did I', 'Where would I'], a: 0,
      cue: '文頭、Where のあとの弱い二語。',
      line: '*Where do I* stand with Pam?',
      said: '「パムとの関係はどうかって？」と、聞かれた質問をくり返す。',
      mean: 'do I が弱く「ドゥアイ」とつながる。今の関係を聞く現在形。',
      trap: 'do と did はどちらも d だけ残りやすい。母音が「ウ」か「イ」かを聞き分ける。',
      use: 'Where do I stand with the team?（チームでの私の立場は？）' },

    // why: disagree ← "I mean" often comes before a correction; new topic ← a filler heard as moving on
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['pam'], seg: [189.4, 199.0],
      stem: 'After “no idea,” what does Jim’s next short phrase do?',
      choices: ['It leads into a clearer answer', 'It signals that he disagrees', 'It moves on to a new topic'], a: 0,
      cue: '「no idea」のすぐあとの二語。',
      line: 'Um, no idea. *I mean*, we’re friends.',
      said: '「さあ、分からない。つまり、友だちだよ」と続ける。',
      mean: 'I mean は「つまり」。あいまいな答えを言い直して、具体的にするつなぎ。',
      trap: '「意味する」と直訳すると反論に聞こえる。I mean のあとには言い直しが来る。',
      use: 'It’s fine. I mean, it’s not perfect.（大丈夫。まあ、完ぺきではないけど）' },

    // R fix: V2 (blind 75 %, right) + K6: the key was the only two-sided answer; there are now two "Unsure" choices
    // why: glad friends ← "we're friends… always have been" taken at face value; doesn't care ← "no idea" heard as
    //   brushing the question off, but he goes on to settle it ("that is where we stand")
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'pam', reveals: ['imean'], seg: [189.4, 201.5],
      stem: 'How sure does Jim sound about where things are with Pam?',
      choices: ['Unsure, but he tries to sound settled', 'Sure, and glad to stay just friends',
                'Unsure, and he doesn’t care to find out'], a: 0,
      cue: '「um」の数と、friends のくり返し。',
      line: 'Um, *no idea*. I mean, we’re friends. Always have been friends. Um, *that is where we stand*.',
      said: '「さあね。友だちだよ。ずっと。うん、それが今の関係」と言う。',
      mean: '「分からない」で始めて「それが関係だ」と言い切る。um と言い直しが迷いを示す。',
      trap: 'friends のくり返しで満足と取りやすい。最初の no idea と最後の言い切りのずれを聞く。',
      use: 'Honestly? No idea where we stand.（正直、どういう関係か分からない）' },

    // R fix: V2 (blind 60 %, right): "great to have you back, my friend" was too warm to tempt; a relieved welcome
    //   ("well, well, well" as finally) replaces it
    // why: finally made it ← "well, well, well" heard as relief (the sincerity flip); bring ← "what… dragged in from
    //   Stamford" read literally as an object brought along
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'cat', seg: [201.35, 207.45],
      stem: 'What does Dwight’s first line to Jim mean, in plain words?',
      choices: ['“Oh, look who has shown up again.”', '“Oh good, you finally made it here.”',
                '“So what did you bring from Stamford?”'], a: 0,
      cue: '「Well, well, well」に続く決まり文句。',
      line: 'Well, well, well. *Look what the cat dragged in* from Stamford.',
      said: '「おやおや、スタンフォードから誰かと思えば」と声をかける。',
      mean: '猫が引きずってくる獲物のように「来なくていい人が来た」とからかう言い方。',
      trap: '文字どおり「何を持ってきた」と取りやすい。Well, well, well は皮肉な歓迎の前ぶれ。',
      use: 'Well, look what the cat dragged in.（おや、誰かと思えば）' },

    // R fix: V2 (blind 55 %, right): the key was the only one naming what the words literally are; all three now
    //   describe a move
    // why: stay out of his way ← "Okay" heard as giving in to "Do not mess with me" (the Japanese frame: agreeing =
    //   deferring); warns ← a reply to a threat heard as pushing back
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'soundsgood', seg: [206.4, 214.6],
      stem: 'When Dwight warns Jim, what does Jim’s reply do?',
      choices: ['It brushes off the threat as nothing', 'It promises to stay out of his way',
                'It warns Dwight to back off in turn'], a: 0,
      cue: 'Okay のあとの、軽い二語。',
      line: 'I am older. I am wiser. … — Okay. *Sounds good*.',
      said: '「俺の方が年上で賢い。なめるな」と言われ、「オーケー、いいね」と返す。',
      mean: 'Sounds good は誘いや予定に返す言葉。脅しにそう返すのは、相手にしていない合図。',
      trap: 'Okay を「従います」と取りやすい。何に返した言葉かと合わせて聞く。',
      use: 'Pizza at seven? Sounds good.（7時にピザ？いいね）' },

    // dict: Dwight keeps full forms all through ("I am older. I am wiser."); the learner's habit writes "don't"
    { id: 'x2', skill: 'dict', level: 'B1', point: 'donot', seg: [209.3, 213.1],
      stem: 'Type Dwight’s warning: “___ with me.” (3 words)', answer: 'do not mess',
      cue: '「wiser」のあと、区切って言う三語。',
      line: '*Do not mess* with me.',
      said: '「俺をなめるな」と、一語ずつ区切って言う。',
      mean: 'mess with ＝ちょっかいを出す、なめてかかる。縮めずに do not と言うのが威圧。',
      trap: '会話では don’t が多いので縮めて書きたくなる。3語なので not を分けて書く。',
      use: 'Don’t mess with my coffee.（私のコーヒーに手を出さないで）' },

    // R fix: V2 (blind 60 %, right): "avoiding his eyes because he feels scared" was weak; backing off a fight replaces it
    // why: a mark ← Dwight asks if something is on his forehead (the words differ, but Jim's "No" is in both);
    //   looking away ← after "Do not mess with me", not meeting his eyes heard as backing down
    { id: 'i3', skill: 'infer', level: 'C1', point: 'forehead', seg: [214.5, 229.2],
      stem: 'What is Jim doing to Dwight in this exchange?',
      choices: ['Staring at his forehead to annoy him', 'Looking away to avoid a fight with him',
                'Staring at a mark on his forehead'], a: 0,
      cue: 'ドワイトの質問と、ジムの短い否定。',
      line: 'Why are you looking at *my forehead*? — *I’m not.*',
      said: '額を見られて「何かついてる？」と聞くと「いや」、「なぜ見る？」には「見てない」。',
      mean: 'わざと額を見つめ、聞かれると否定する。「なめるな」に態度で返すいたずら。',
      trap: '目を合わせないのは争いを避けるためと取りやすい。否定しながら見続ける点を聞く。',
      use: 'What? I’m not doing anything.（何？何もしてないよ）' },

    // R fix: V2 (blind 70 %, right): "stand in line" was absurd; "stop looking" (meet lost) replaces it
    // why: stop looking ← "Why are you looking at my forehead?" carried over, "meet" lost; own desk ← "stop looking at
    //   me" heard as "keep your eyes on your work"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'eyeline', reveals: ['forehead'], seg: [219.6, 226.0],
      stem: 'Just before “Stop acting like an idiot,” what does Dwight tell Jim to do?',
      choices: ['Look him straight in the eyes', 'Stop looking at him at all', 'Keep his eyes on his own desk'],
      a: 0,
      cue: '名前を呼ぶ前の、三語の命令。',
      line: '*Meet my eyeline*, Jim. — I am.',
      said: '「目線を合わせろ」と言われ、ジムは「合わせてる」と返す。',
      mean: 'eyeline ＝目の高さ、視線。meet my eyeline で「ちゃんと目を見ろ」という命令。',
      trap: 'meet を聞きのがすと「見るな」に聞こえる。meet は「合わせる」にもなる。',
      use: 'Look me in the eye and say it.（目を見て言って）' },

    // why: gets it back ← "unless you really, really want" heard as the desk being handed back; share ← "This one
    //   taken?" heard as asking to sit together
    { id: 'g3', skill: 'gist', level: 'B2', point: 'deskend', reveals: ['call', 'desk'], seg: [237.6, 276.3],
      stem: 'How is the question of the desk settled by the end?',
      choices: ['The other man keeps it; Jim sits elsewhere', 'Jim gets it back; the other man moves',
                'They share it for now; Jim adds a chair'], a: 0,
      cue: '最後のカメラへの一言の、desk の前。',
      line: 'This one taken? — No. — Good. … *That’s why I got the desk.*',
      said: '机の主が返そうかと言いかけるが、ジムはゆずり、別の空いた席に座る。',
      mean: 'ジムがゆずり、机は今座っている人のものに。最後の一言が結果を言う。',
      trap: 'unless の申し出で「返してもらえる」と思いやすい。最後の got the desk で決まる。',
      use: 'Is this seat taken?（この席、空いてますか）' },

    // why: wants it back ← "really" heard as insisting, "call" as calling for it; share ← a polite middle way (the
    //   Japanese frame: 折衷)
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'call', reveals: ['deskend'], seg: [246.7, 255.6],
      stem: 'When offered his old desk back, how does Jim answer?',
      choices: ['He leaves the choice to the other man', 'He says he’d like to have it back',
                'He suggests that they share it'], a: 0,
      cue: '「unless」の申し出への返事。',
      line: 'unless you really, really want… — You know, man, *it’s really your call*. — Cool. Thank you.',
      said: '「どうしてもと言うなら…」に「君が決めていいよ」と返し、「よし、ありがとう」で決まる。',
      mean: 'your call ＝君が決めること。ゆずる形で、自分から返してとは言わない。',
      trap: 'call を「呼ぶ」「電話」と取ると通じない。決める役を渡す言い方。',
      use: 'Thai or Italian? It’s your call.（タイ料理かイタリアン？君が決めて）' },

    // anchor: 271.9–275.8 s to camera: "Jim is a nice guy. That's why I got the desk." He got it *because* Jim is
    //   nice, so the quick "Cool. Thank you." (254 s) took the yes he was counting on
    // why: surprise ← "Thank you" heard as real thanks for an unexpected gift (sincerity flip); joke ← the light tone
    //   heard as a set-up for handing the desk back (refuted by "I got the desk")
    { id: 'c2', skill: 'infer', level: 'C2', point: 'desk', reveals: ['call', 'deskend'], seg: [251.9, 276.3],
      stem: 'After the last comment to camera, how should we hear “Cool. Thank you.”?',
      choices: ['As the yes he counted on from a nice guy', 'As real surprise; he expected to give it back',
                'As a joke; he’s about to hand the desk back'], a: 0,
      cue: 'カメラへの一言の、that’s why の前と後ろ。',
      line: 'it’s really your call. — *Cool. Thank you.* … Jim is a *nice guy*. *That’s why I got the desk.*',
      said: '「君が決めて」に即「よし、ありがとう」。そのあとカメラに「ジムはいい人。だから机が取れた」。',
      mean: '「いい人だから取れた」は、ゆずると読んでいた証拠。申し出は形だけで、すばやいお礼は計算どおり。',
      trap: 'お礼を本当の驚きと取りやすい。カメラへの一言は場面の答え合わせ。',
      use: 'I offered, knowing she’d say no.（断ると分かってて申し出た）' },
  ]
};
