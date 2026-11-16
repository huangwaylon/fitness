// “Ben is a Criminal | Parks and Recreation” (the official Parks and Recreation channel, Season 5): on his first day
// as city manager Ben tries to be the friendly boss while handing out strict new rules, shares some unpasteurized
// cheese, is "arrested" for it, panics, and learns his new staff staged the whole thing.
// Segments from the captions, words from whisper (2026-11-16). The sources differ at 10.7 s ("smuggled it back" /
// "Smuggle the bag"), 80.8 s ("wearing" / "wound" so tight), 132.4 s ("I just said that" / "Just add that" to the charges)
// and 135–137 s ("prince"/"prints", "wanting"/"wanted"); no key rests on those words, and lines trim them with ….
// REVIEW 2026-11-16: pass 4, fix 20, drop 0, new 0; ear checks 1
// Open: d2's blind 55 % came from show knowledge (Ben's job), not the choices, so it was kept as it is.
// EAR CHECK: 161.8 s nt2 — Ben's “Wow, this— you got me… that's super funny” is shaken, forced cheer, not real amusement
//   (the key also stands on "making me think I was gonna… die in federal prison")
import type { Clip } from '../types.ts';

export const benCriminal: Clip = {
  id: 'bencriminal', video: '2tsny0fMwkI', title: 'Ben is a Criminal', dur: 190, wpm: 160, band: 'slow',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): the key was the one choice that combined the other two; "act tough" is now a keyword trap
    //   (the cheese), and every choice starts the same way
    // why: easing rules ← "clubhouse", "open-door", "your friend" heard without the rules that follow; cheese ← the
    //   Paris cheese he hands out at the start and again later, heard as his plan
    { id: 'g1', skill: 'gist', level: 'B2', point: 'firstday', reveals: ['both'], seg: [12.2, 60.4],
      stem: 'What is Ben trying to do on his first day as boss?',
      choices: ['Win them over as a friend, yet lay down rules', 'Win them over as a friend by easing old rules',
                'Win them over with cheese he got in Paris'], a: 0,
      cue: '前半の「友だちに」と、後半の「新しいルール」。',
      said: '「部屋はクラブハウス、友だちでいたい」と言いつつ、休暇削減や Facebook 禁止を告げる。',
      mean: '優しい上司と厳しい上司を一人でこなそうとしている場面。',
      trap: '前半だけだと「規則をゆるめる」、チーズだけだと「物で釣る」話に聞こえる。両方聞く。',
      use: 'I’m your boss, but also your friend.（上司だけど、仲間でもあるよ）' },

    // R fix: V2 (blind 85 %): "his door will be kept open" was too literal to tempt; it's now "open" = transparent
    // why: open about plans ← "open" read as 隠さない, a real sense of the word; break room ← "think of my office as a
    //   clubhouse" (a room anyone can use), but the policy is about him being easy to reach
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'opendoor', seg: [12.2, 21.9],
      stem: 'What does Ben mean by a “total open-door policy”?',
      choices: ['They can come to him with anything, any time', 'He’ll be open with them about all his plans',
                'They can use his office as their break room'], a: 0,
      cue: 'clubhouse のあと、すぐ続く三語と次の文。',
      line: 'think of my office as a clubhouse, *total open-door policy*.',
      said: '「僕の部屋はクラブハウスだと思って。いつでも来ていい」と言っている。',
      mean: 'open-door policy ＝ 誰でもいつでも相談に来ていい、という方針。',
      trap: 'open を「隠さない」と取りやすい。言いたいのは話しやすさ。決まった言い回しで覚える。',
      use: 'My door is always open.（いつでも相談に来てね）' },

    // why: worried ← "What the hell is wrong with you? Are you in a cult?" taken as real concern; touched ← "Can I join?"
    //   taken as a sincere yes to "be your friend"; "Let's sacrifice Larry" settles it
    // R fix: V2 (blind 65 %) and K6: the key was the only two-part choice; now all three are one stance each
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'cult', seg: [20.5, 28.2],
      stem: 'How does April take Ben’s friendly speech?',
      choices: ['She mocks it, joking she’ll join his cult', 'She is honestly worried he’s in a cult',
                'She likes it, and wants to join for real'], a: 0,
      cue: '「Can I join?」のあと、もう一言。',
      line: 'Are you *in a cult*? *Can I join?* Let’s sacrifice Larry.',
      said: '「何それ、カルト？入れて。じゃあラリーを生けにえに」と返す。',
      mean: '仲良し宣言を「カルトみたい」とからかい、さらに乗ってみせる皮肉。本気の心配ではない。',
      trap: 'Can I join? を「仲間に入りたい」と素直に取りやすい。次の一言で冗談だと分かる。',
      use: 'Are you okay? This is weird.（大丈夫？なんか変だよ）' },

    // why: office manager ← "office hours" said right after; deputy ← "Chris was always…" heard as Ben under Chris
    { id: 'd2', skill: 'detail', level: 'B1', point: 'manager', seg: [27.8, 33.3],
      stem: 'What is Ben’s new job?',
      choices: ['City manager', 'Office manager', 'City planner'], a: 0,
      cue: '「first day as」のすぐあと。',
      line: 'It’s my first day as *city manager*.',
      said: '「今日が市政管理官としての初日なんだ」と言っている。',
      mean: 'city manager ＝ 市の行政を取りしきる役職。今日から皆の上司。',
      trap: '直後の office hours と混ざりやすい。as の直後を聞く。',
      use: 'It’s my first day as a manager.（今日から管理職なんです）' },

    // R fix: V2 (blind 80 %): "ended the meetings" was weak; the distractors are now a judge's gavel (final say) and
    //   the hammer as hard work, both real idiom neighbours
    // why: heavy lifting ← hammer = 金づち, "did the hard work"; final calls ← a judge's gavel, "had the last word"; set
    //   against "the nice guy that made everyone happy"
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'hammer', seg: [33.0, 38.0],
      stem: 'Ben says he “brought down the hammer”. What was his role?',
      choices: ['He played the strict one', 'He made the final calls', 'He did the heavy lifting'], a: 0,
      cue: '「nice guy」と、while のあとを比べて。',
      line: 'Chris was always *the nice guy*… while *I brought down the hammer*.',
      said: '「クリスは皆を喜ばせる役、僕は厳しくする役だった」と言う。',
      mean: 'bring down the hammer ＝ 厳しく取りしまる。nice guy と対になっている。',
      trap: 'hammer から力仕事や木づちを思いやすい。while の前後は対比。',
      use: 'Someone has to be the bad guy.（誰かが嫌われ役にならないと）' },

    // why: both jobs ← "city manager" + "office hours" read as two posts; both people's work ← "he's gone" read as
    //   covering Chris's desk
    // R fix: V2 (blind 80 %): rebalanced so the two job readings are as concrete as the key
    { id: 'i1', skill: 'infer', level: 'B2', point: 'both', reveals: ['hammer'], seg: [33.0, 41.3],
      stem: 'With Chris gone, what does Ben mean he has to “do both”?',
      choices: ['Play the nice guy and the tough guy', 'Do Chris’s job on top of his own', 'Run two offices at the same time'], a: 0,
      cue: 'Chris の役と自分の役、二つの説明のあと。',
      line: 'but now that he’s gone, I kind of have to *do both*.',
      said: '「でも彼がいなくなったから、両方やらなきゃいけない」と言う。',
      mean: 'both ＝ 直前の二つの役（優しい人と厳しい人）。一人で両方を演じるということ。',
      trap: '「仕事が二つ」と取りやすいが、both は直前に並べた二つを指す。前の文に戻る。',
      use: 'Now I have to do both.（今は両方やらなきゃいけない）' },

    // why: firings ← praise then bad news read as the classic layoff softener; worn out by a sad office ← "This is
    //   exhausting" heard as the point, not as his comment on switching
    // R fix: V2 (blind 75 %): "worn out from cheering up a gloomy office" was weak; it's now "staff who miss Chris"
    //   (Chris was just named)
    // why: harsh rule in praise ← praise then bad news read as the classic softener; miss Chris ← "now that he's gone"
    //   just before, heard as the reason for the cheering; the lines alternate, so neither holds
    { id: 'h1', skill: 'humor', level: 'C1', point: 'vitamins', reveals: ['both'], seg: [41.0, 46.9],
      stem: 'What makes Ben’s quick run of lines to the staff funny?',
      choices: ['He swings from nice to harsh with each line', 'He tucks one harsh rule inside lots of praise',
                'He tries to cheer up staff who miss Chris'], a: 0,
      cue: '短い文が四つ。一つずつ、良い話か悪い話か。',
      line: '*Everyone is the best.* *We’re cutting vacation time.* Let’s eat vitamins. *This is exhausting.*',
      said: '「みんな最高。休暇は減らす。ビタミンを取ろう。…疲れる」と続ける。',
      mean: 'ほめる、悪い知らせ、また明るく、と一文ごとに切りかえ、最後に本音がもれる。',
      trap: 'ほめ言葉で悪い知らせを包む型に聞こえるが、ここは一文ずつ交互。文の数と順番を数えて聞く。',
      use: 'Good news and bad news.（いい知らせと悪い知らせがある）' },

    // why: optional ← "super cool" heard as fun extras, "mandatory" not caught; thanks ← the add-on heard as a reply to
    //   "Oh, nice" (the Japanese お礼 frame)
    // R fix: V2 (blind 75 %): all three now "make clear" one thing about the cool rules, so form gives nothing away
    // why: optional ← "super cool" heard as fun extras, "mandatory" not caught; start now ← "real quick" at the start
    //   carried over as timing
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'mandatory', seg: [46.8, 53.45],
      stem: 'After someone says “Oh, nice”, what does Ben’s add-on do?',
      choices: ['It makes clear the cool rules must be kept', 'It makes clear the cool rules are just for fun',
                'It makes clear the cool rules start right away'], a: 0,
      cue: 'Oh, nice のあと、also のあとの語。',
      line: 'I have some *super cool* new rules. — Oh, nice. — That are also *super mandatory*.',
      said: '「クールな新ルールがある」「いいね」「しかも絶対守ること」と続く。',
      mean: '同じ super で明るく包みながら、強制だと告げる。喜んだ相手を落としている。',
      trap: 'mandatory を落とすと楽しい話のまま。also のあとに付け足しの本題が来る。',
      use: 'It’s optional, but also kind of mandatory.（自由参加だけど、実質強制）' },

    // why: bad-news softener ← "let's talk health insurance" heard as good news (a new plan), and cheese as a party;
    //   use it up ← "illegal cheese" heard as evidence to get rid of
    // R fix: V2 (blind 70 %): rebalanced; the dispose reading now names why ("illegal here"), as the clip does
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'insurance', seg: [60.4, 68.7],
      stem: 'Why does Ben offer cheese right after the health insurance news?',
      choices: ['To soften the bad news with a treat', 'To toast their new, better insurance', 'To be rid of cheese that’s illegal here'], a: 0,
      cue: 'insurance の話の中身と、そのすぐあとの一言。',
      line: 'Your dependents *don’t have it anymore*. *Have some illegal cheese.*',
      said: '「家族はもう保険の対象外」と告げ、すぐ「違法チーズでもどうぞ」と勧める。',
      mean: '悪い知らせのあとに小さなごほうび。優しさと厳しさを一度にやろうとしている。',
      trap: '「保険の話をしよう」を良い話の前置きと取りやすい。中身は打ち切り。',
      use: 'Here, have a cookie. Sorry about that.（ほら、クッキーどうぞ。ごめんね）' },

    // why: themselves ← "dependents" (家族) not known, so "you" is assumed; new cover ← "don't" with its t lost, and
    //   "have it" heard as a gain
    { id: 'd4', skill: 'detail', level: 'B2', point: 'insurance', seg: [61.9, 68.7],
      stem: 'What change does Ben announce to the sanitation workers?',
      choices: ['Their families lose their health cover', 'They lose their own health cover', 'Their families get new health cover'], a: 0,
      cue: 'insurance の直後、文の主語に注目。',
      line: 'let’s talk health insurance. *Your dependents don’t have it* anymore.',
      said: '「保険の話だけど、扶養家族はもう入れない」と告げる。',
      mean: 'dependents ＝ 扶養家族。本人ではなく家族の保険がなくなる。',
      trap: '主語を聞き落とすと本人の話に聞こえる。don’t は弱くても、否定は残る。',
      use: 'Does it cover my dependents?（扶養家族も対象ですか）' },

    // why: needs it for work ← the usual reason to defend a phone at work; calls home ← "not fair" read as a family
    //   complaint; "how I avoid doing work" settles it
    // R fix: V2 (blind 65 %): "the very" marked the key; the choices are now three parallel "it gives away / shows"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'cellphone', seg: [68.2, 73.68],
      stem: 'Why is the complaint about the cell phone rule funny?',
      choices: ['It gives away why the rule is needed', 'It shows the phone is part of his job', 'It shows the rule cuts him off from home'], a: 0,
      cue: '「not fair」のあと、how で始まる理由。',
      line: 'That’s not fair. My cell phone is *how I avoid doing work*.',
      said: '「ずるい。携帯は仕事をサボる手段なのに」と抗議する。',
      mean: '反対の理由が、そのままルールが必要な理由になっている。本人は気づかずに言う。',
      trap: '抗議なら「仕事に要る」と続くのが普通。型どおりに聞かず、avoid の意味まで聞く。',
      use: 'That’s exactly the problem.（まさにそれが問題なんだよ）' },

    // why: 15 ← -teen/-ty: "five minutes" with a weak "-ve" heard as "fifteen"; 10 ← a more usual break length
    { id: 'n1', skill: 'number', level: 'B1', point: 'five', seg: [73.6, 78.08], keep: true,
      stem: 'How long can bathroom breaks last under the new rules?',
      choices: ['5 minutes', '10 minutes', '15 minutes'], a: 0,
      cue: '「limited to」のあと。返事でもくり返される。',
      line: 'Bathroom breaks should be limited to *five minutes*. — I can’t shower in five minutes.',
      said: '「トイレ休憩は5分まで」に「5分じゃシャワーできない」と返す。',
      mean: 'five minutes ＝ 5分。返事でもくり返される。',
      trap: 'five の v が弱く fifteen に近く聞こえることも。fifteen なら teen が強く長い。',
      use: 'Can you give me five minutes?（5分だけちょうだい）' },

    // why: truly relaxed ← "loosey-goosey" known as "casual" and taken as the verdict, without "but"; angry ← "gonna pop"
    //   heard as "about to shout at us"; both readings lose the loose/tight contrast
    // R fix: K1 and V2 (blind 60 %): "about to yell at them" was defensible ("gonna pop" can mean snap at someone);
    //   it's now "fed up with them", which nothing in the line says
    // why: easygoing ← "loosey-goosey" known as "casual" and taken as the verdict, with the order flipped; fed up ←
    //   "gonna pop" heard as anger at the staff; both lose the loose/tight contrast
    { id: 'i2', skill: 'infer', level: 'C1', point: 'tight', seg: [78.0, 82.4],
      stem: 'In the comment about Ben, what does the speaker think of him?',
      choices: ['He acts relaxed, but he’s wound up inside', 'He acts strict, but he’s easygoing inside',
                'He acts friendly, but he’s fed up with them'], a: 0,
      cue: 'but の前の「ゆるい」と、後ろの「きつい」。',
      line: 'he’s acting all *loosey-goosey*, but that little dude’s … *so tight he’s gonna pop*.',
      said: '「ゆるく見せてるけど、あいつはガチガチで、今にも爆発しそう」と話す。',
      mean: 'loosey-goosey ＝ ゆるい。tight はその逆で、緊張がたまっている。',
      trap: 'pop を「怒り」と取りやすいが、張りつめた状態のこと。but の前後を対で聞く。',
      use: 'He looks calm, but he’s stressed.（落ち着いて見えるけど、ストレスがたまってる）' },

    // why: real ease ← the shout taken at face value, without the comment just before; mocking the crew ← "Hey,
    //   sanitation" repeated, heard as teasing them
    // anchor: 78.1–82.4 s "acting all loosey-goosey, but… so tight he's gonna pop", then at once 82.4–86 s Ben's
    //   "Hey, sanitation! Sanitation in the house tonight!": the comment tells us how to hear the shout
    // R fix: V2 (blind 70 %): the three are now parallel "As … cheer from someone …", so "strain" isn't a lone tell
    // retired: one C2 alone is under 2 (nt2 retired)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'tight', seg: [78.0, 86.6], retired: true,
      stem: 'After that comment, how should we hear Ben’s “Sanitation in the house tonight”?',
      choices: ['As forced cheer from someone about to snap', 'As real cheer from someone settling in', 'As mock cheer from someone teasing the crew'], a: 0,
      cue: '直前の「ゆるい、でも」の一言と、このかけ声を並べて。',
      line: 'he’s acting all loosey-goosey, but … *gonna pop*. — Hey, sanitation! *Sanitation in the house tonight!*',
      said: '「ゆるく見せてるけど、限界寸前」と話したすぐあと、Ben が「清掃チーム、今夜も最高！」と盛り上げる。',
      mean: '直前の一言が、このかけ声を「無理して明るくしている」姿に書きかえる。編集で見せる皮肉。',
      trap: 'かけ声だけ聞けば楽しそうだが、並べ方に意味がある。直前の評価を答え合わせに使う。',
      use: 'He’s trying a little too hard.（ちょっと無理してるね）' },

    // R fix: V2 (blind 55 %): "navy sailors" had no basis in the clip; it's now customs agents, who are named later
    // why: sanitation crew ← "Hey, sanitation" was the last group he greeted that way; customs agents ← the
    //   cheese is a customs matter, and "customs agents" come up later; "the station" a few lines on settles it
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'blue', seg: [86.8, 89.8],
      stem: 'Who does Ben greet as “the boys in blue”?',
      choices: ['Police officers', 'The sanitation crew', 'Customs agents'], a: 0,
      cue: '直後に来た人たちが、何の件で来たか。',
      line: 'Hey, *the boys in blue*.',
      said: '「やあ、お巡りさんたち」と明るく声をかける。',
      mean: 'the boys in blue ＝ 警察官（制服の青から）。くだけた言い方。',
      trap: '直前まで清掃チームに同じ調子で声をかけていたので混ざりやすい。次の用件で判断。',
      use: 'Uh-oh, here come the boys in blue.（あ、警察が来た）' },

    // R fix: V2 (blind 75 %): "he brags about his trip" was a filler; all three now end on "nothing" and differ in the
    //   feeling
    // why: calm ← "It's just cheese" heard as relaxed certainty; laughs it off ← "guys" and "just" heard as a light,
    //   joking tone; the eight quick "no"s settle it
    { id: 't2', skill: 'attitude', level: 'B1', point: 'justcheese', seg: [96.3, 102.0],
      stem: 'How does Ben react when the officers mention the tip?',
      choices: ['He panics and insists it’s nothing', 'He stays calm and says it’s nothing', 'He laughs it off as nothing at all'], a: 0,
      cue: '最初に何度もくり返す短い語と、just。',
      line: '*No, no, no, no…* It’s *just cheese*, guys.',
      said: '「いやいやいや…ただのチーズだよ。フランスで買ったんだ」と言う。',
      mean: 'no の連発で慌てぶりが、just で「大したことない」と小さく見せたい気持ちが分かる。',
      trap: 'just cheese だけだと落ち着いた冗談にも聞こえる。その前の no の数が本音。',
      use: 'It’s nothing, really.（ほんと、何でもないよ）' },

    // R fix: V2 (blind 50 %, right): added "You're gonna need to" (we're/you're), a strong fourth
    // why: gonna need to ← "you" is a weak "ya" swallowed between "need" and "to"; we'll need you to ← same meaning,
    //   "gonna" heard as a contracted "will"; you're ← "we're" and "you're" both a weak first syllable
    { id: 's1', skill: 'sound', level: 'B2', point: 'station', seg: [105.9, 109.1],
      stem: 'Fill the gap: “___ come down to the station.”',
      choices: ['We’re gonna need you to', 'We’re gonna need to', 'We’ll need you to', 'You’re gonna need to'], a: 0,
      cue: '文の最初、need のあとの小さな音。',
      line: '*We’re gonna need you to* come down to the station.',
      said: '「署まで来てもらうことになる」と告げる。',
      mean: 'need you to が「ニージュタ」とつながり、you は短く弱い。gonna ＝ going to。',
      trap: 'you がのみこまれると need to に聞こえる。誰が行くのかで意味が変わる語は残る。',
      use: 'I’m gonna need you to sign here.（ここにサインをお願いします）' },

    // why: money ← "bribe" brings cash to mind (the usual script); forget the form ← "customs form" was the last thing
    //   asked about
    // R fix: V2 (blind 50 %, right): "the cheese itself" marked the key; three plain parallel offers now
    { id: 'i3', skill: 'infer', level: 'B2', point: 'bribe', seg: [108.8, 114.56],
      stem: 'What makes the officers ask if Ben is trying to bribe them?',
      choices: ['He offers them some of the cheese', 'He offers them money to let it go', 'He asks them to skip the customs form'], a: 0,
      cue: '「not necessary」のあと、Ben が勧めるもの。',
      line: 'this is really good cheese. *You should try some.* — Are you *trying to bribe us*?',
      said: '「すごくおいしいチーズだから、食べてみて」と言い、「買収する気か？」と返される。',
      mean: '問題の証拠そのものを警官に勧めたので、わいろに見えてしまった。',
      trap: 'bribe と聞くとお金を思い浮かべやすいが、お金の話は出ていない。直前の一言を聞く。',
      use: 'You should try some. It’s really good.（食べてみて。本当においしいよ）' },

    // why: explains ← "I mean" as "that is", a definition of jaywalking; adds weight ← "Never." just before, so "I mean"
    //   heard as more of the same; "everyone does it sometimes" settles it
    // R fix: V2 (blind 60 %): reworded to three parallel moves on "what he just said"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', seg: [125.6, 132.38],
      stem: 'Right after “Never.”, what does Ben’s “I mean…” do?',
      choices: ['It walks back what he just said', 'It explains what jaywalking means', 'It backs up what he just said'], a: 0,
      cue: 'I mean のあと、everyone で始まる部分。',
      line: 'I’ve never even jaywalked. Never. *I mean*, I— *everyone does it sometimes*.',
      said: '「信号無視すらしたことない。一度も。…いや、まあ、誰でもたまにはするよね」と言う。',
      mean: 'I mean は言い直しの合図。強く言い切った直後に、自分で取り消している。',
      trap: 'I mean を「つまり」の説明と取りやすい。前と逆のことが続いたら、言い直し。',
      use: 'I never eat sweets. I mean, almost never.（甘い物は食べない。いや、ほぼね）' },

    // R fix: V2 (blind 85 %): the distractors are now two other senses of "straight" (clear, on track), parallel to the key
    // why: hard to follow ← "straight" read as "clear, plain"; wandering off ← "straight" read as "on a straight line,
    //   to the point"
    { id: 'f5', skill: 'phrase', level: 'B2', point: 'story', seg: [139.3, 146.05],
      stem: 'What does the officer mean by “you can’t keep your story straight”?',
      choices: ['Your story keeps on changing', 'Your story is hard to follow', 'Your story keeps wandering off'], a: 0,
      cue: '直前の「行ったことない」と「でも一度」の二つを比べて。',
      line: 'I’ve *never even been* to Colorado. I mean, I *had a layover* in Denver once. — you can’t *keep your story straight*',
      said: '「行ったこともない。いや、乗り継ぎで一度」と言い、「話が変わるな」と返される。',
      mean: 'keep one’s story straight ＝ 話のつじつまを合わせる。',
      trap: 'straight を「分かりやすい」と取ると別の意味。直前の言い直しが答え。',
      use: 'Let’s get our story straight.（話を合わせておこう）' },

    // why: police mix-up ← "a hit on your prints" + "wanted… in Colorado" taken as what really happened; real charge ←
    //   "customs agents… not happy" taken at face value; "Thought we'd have some fun with our new boss" settles it
    // R fix: V2 (blind 80 %): the "real charge" choice is now "real, but dropped", so it ends on a let-off too
    // why: mix-up ← "a hit on your prints" + "wanted… in Colorado" taken as what really happened; dropped ← the
    //   laughter at the end heard as relief after a real arrest; "Thought we'd have some fun" settles it
    { id: 'g2', skill: 'gist', level: 'B2', point: 'prank', reveals: ['uptight'], seg: [146.0, 169.6],
      stem: 'What was really going on with Ben’s arrest?',
      choices: ['It was a prank his staff had set up', 'It was real, but the charges were dropped', 'It was a mix-up with a wanted man'], a: 0,
      cue: '最後の場面、「have some fun」の一文。',
      said: '「その顔見せたかった！写真撮ろう」「堅そうだったから、新しい上司と遊んでみた」と明かされる。',
      mean: '逮捕は部下たちが仕組んだいたずら。指紋も税関も全部ウソ。',
      trap: '指紋やコロラドの話を本当の事件と取りやすいが、最後に全部ネタだと分かる。',
      use: 'Relax, we’re just messing with you.（落ち着いて、からかってるだけだよ）' },

    // EAR CHECK (header): the forced cheer
    // why: saw through it ← "you got me" + "good one" heard as a good sport who knew all along; half thinks it's real ←
    //   the broken start "Wow, this—" heard as doubt, which "you got me" refutes
    // anchor: 153 s "the stupid look on your face" (they saw him panic) and 164–166 s "making me think I was gonna, like,
    //   die in federal prison": he believed it; the start breaks off ("Wow, this— you got me")
    // R fix: V2 (blind 55 %): "funnier than they do" was weak; the three now all say how he stood toward the joke
    // retired: shares g2's point, so play 3+ under g2 drew no C2
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'prank', seg: [152.5, 169.6], retired: true,
      stem: 'When Ben says “Wow, this— you got me”, what is he trying not to show?',
      choices: ['That the joke had him truly scared', 'That he saw through the joke early', 'That he half thinks it’s not a joke'], a: 0,
      cue: '途中で切れる最初の一言と、prison の話。',
      line: 'Wow, *this— you got me*. Good one. Making me think I was gonna, like, *die in federal prison*.',
      said: '「うわ、これ…やられた。いいね。刑務所で死ぬかと思わせるなんて。超おもしろい」と言う。',
      mean: '言いかけて切る、自分の恐怖を口にする。笑ってみせるほど、本当は動揺していたと分かる。',
      trap: 'you got me を素直に取ると、見抜いていた余裕に聞こえる。切れ目と prison の話で本心を聞く。',
      use: 'Ha, good one. You really got me.（はは、やられた。完全にだまされた）' },

    // why: mean to them ← the new rules, the obvious motive for revenge; asked for it ← "have some fun" heard as his
    //   own idea
    // R fix: V2 (blind 70 %): "asked them to cheer him up" was weak; it's now the Paris trip (a keyword from the start)
    // why: strict ← the new rules, the obvious motive for revenge; bragged ← "I got it in France" and "smuggled… from
    //   Paris", heard as showing off
    { id: 'd7', skill: 'detail', level: 'B1', point: 'uptight', reveals: ['prank'], seg: [156.3, 161.0],
      stem: 'What reason do they give for the joke?',
      choices: ['He seemed a little bit too tense', 'He’d been a little too strict', 'He’d bragged about his Paris trip'], a: 0,
      cue: '「Classic!」のあと、彼の様子を言う一文。',
      line: 'You seemed *a little uptight*.',
      said: '「ちょっと堅苦しそうだったから」と理由を言う。',
      mean: 'uptight ＝ 堅い、ぴりぴりしている。だから笑わせてほぐそうとした。',
      trap: '厳しいルールへの仕返しを想像しやすいが、言っているのは彼の固さ。',
      use: 'Don’t be so uptight.（そんなに堅くならないで）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'fun', reveals: ['prank'], seg: [157.2, 161.0],
      stem: 'Type what they say: “Thought ___ some fun with our new boss.” (2 words)', answer: "we'd have",
      cue: 'Thought のすぐあと、some の前まで。',
      line: 'Thought *we’d have* some fun with our new boss.',
      said: '「新しい上司とちょっと遊ぼうと思って」と言う。',
      mean: 'we’d ＝ we would。’d はほぼ聞こえず、we と have がつながる。',
      trap: '’d が消えて we have に聞こえやすい。thought のあとの仮定なら would が入る。',
      use: 'I thought we’d grab lunch.（お昼でも行こうかと思って）' },

  ]
};
