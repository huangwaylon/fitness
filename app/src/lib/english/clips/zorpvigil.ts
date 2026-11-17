// “Leslie gets jealous of a journalist | Parks and Recreation” (the official Parks and Recreation channel, Season 4): Leslie
// and Ben sit up with a doomsday group's all-night vigil in the park; when a reporter asks about Ben, Leslie tries to keep
// the two apart, and before dawn she admits to Ron that she still wants to be with him.
// Segments from the captions, words from whisper (2026-11-16). Untested on purpose: 68–76 s (“Planet Nutbrain”/“nut
// brand”, “bran”/“brand”), 104–107 s (the reporter's name), 155 s and 209 s (sex), 225–235 s (“keep your pants on”),
// 242 s (“For her”/“or”).
// EAR CHECK: 192.4 s s1 — whisper “I’m gonna remind you”, captions “I’m going to remind you”; the key is the reduced form
// EAR CHECK: 210.6 s x1 — whisper “I gotta keep them away”, captions “I got to keep them away”; the key is “gotta keep”
// EAR CHECK: 306.9 s r1 — the cut must fall after “Ron” and before “if the world was ending tomorrow”
// REVIEW 2026-11-16: pass 6, fix 17, drop 1, new 0; ear checks 3
// Open: a cold re-read (fresh session, choices only) still beats d2, a3, d5 and i3 at 70–80 %. d2 and d5 lean on show
//   knowledge, and i3 on the title ("jealous"); a3's stammer is hard to hide from a sitcom-savvy reader.
// Open: i3 assumes the reporter is the one who says "I could check that out" (the rest of her lines fit); if it's Ben,
//   the key still holds, but the said note (記者が興味を見せる) should change.
import type { Clip } from '../types.ts';

export const zorpVigil: Clip = {
  id: 'zorpvigil', video: 'iTmKoRbKc0I', title: 'Leslie gets jealous of a journalist', dur: 362, wpm: 165, band: 'fast',
  tags: ['職場', '恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: shut it down ← "terrible news" and "cult" build a danger story, and city staff do go; reporter ← a reporter
    //   asks questions later in the clip, so it sounds like a job for the paper
    { id: 'g1', skill: 'gist', level: 'B1', point: 'go', reveals: ['vigil'], seg: [0, 72.2],
      stem: 'Why does Leslie end up spending the night at the park?',
      choices: ['She insists on watching a vigil she isn’t worried about',
                'The city has asked her to shut down a vigil it fears',
                'A reporter has asked her help to cover the doomsday story'], a: 0,
      cue: 'Herb の知らせへの反応と、最後に自分から言い出すこと。',
      line: 'Look, there’s *nothing to worry about*… I think Ben and I *should accompany you* tonight.',
      said: '「世界が終わる」という知らせに、レスリーは「心配ない」と言いつつ、今夜ベンと付き添うと言い張る。',
      mean: '危険だからではなく、自分から見守りに行く場面。',
      trap: 'cult や terrible news で危険な話に聞こえやすい。本人の「心配ない」を聞く。',
      use: 'There’s nothing to worry about.（心配することないよ）' },

    // R fix: V2 (blind 75 %): the key was the only choice in the park and the only quiet one; three park choices now,
    //   and the key no longer says "vigil" (g1 shows that word)
    // R fix (2): a cold re-read still got it (75 %): "all night" was the only overnight choice; a hilltop vigil (the
    //   doomsday cliché) replaces the week-long camp
    // why: march at dawn ← "at dawn" is said twice, just before; hilltop ← the doomsday-cult picture, with "in the
    //   park" missed
    { id: 'd1', skill: 'detail', level: 'B1', point: 'vigil', seg: [22.5, 33.5],
      stem: 'According to Leslie, what do the group’s members do every few years?',
      choices: ['Stay up all night in the park', 'Stay up all night on a hilltop',
                'March through the park at dawn'], a: 0,
      cue: 'predict のあと、and they have の続き。',
      line: 'they have an *all-night vigil in the park*',
      said: '残った信者が数年ごとに世界の終わりを予言し、公園で徹夜の集まりを開く、と説明する。',
      mean: 'vigil ＝ 夜通し起きて待つ集まり。',
      trap: '直前に at dawn が2回出るので「夜明けに集まる」と取りやすい。all-night は一晩中。',
      use: 'They held a candlelight vigil.（キャンドルを灯して集まった）' },

    // R fix: V2 (blind 55 %): the key was the only choice about critics; three "Anyone who…" choices now, built on who
    //   does what to whom
    // R fix (2): a cold re-read got it at 80 %; "they criticize" (roles flipped) is now "attackers look sensible",
    //   "very reasonable" pinned on the wrong side
    // why: joins ← "reasonable" heard as the members' own image; attackers look sensible ← "attacking something very
    //   reasonable" with the adjective put on the attackers
    { id: 'd2', skill: 'detail', level: 'B2', point: 'name', seg: [39.8, 49.5],
      stem: 'What is the thinking behind the group’s name?',
      choices: ['Anyone who attacks them will look unfair', 'Anyone who attacks them will look sensible',
                'Anyone who joins them will look sensible'], a: 0,
      cue: '名前を聞く質問のあと、if で始まる部分。',
      line: 'if people *criticize them*, it’ll seem like they’re *attacking something very reasonable*.',
      said: '「批判されても、とても筋の通ったものを攻撃しているように見えるから」と説明する。',
      mean: '名前を「理にかなった」にして、批判する側を非常識に見せる作戦。',
      trap: '名前は入る人のため、という型で取りやすい。if のあと、誰が誰を批判するかを聞く。',
      use: 'Complain, and you look like the bad guy.（文句を言うと、こっちが悪者に見える）' },

    // why: 50 ← fifteen/fifty (-teen/-ty); 5 ← "every few years" and a weak "fif-" leave a small number
    { id: 'n1', skill: 'number', level: 'B1', point: 'times', seg: [50.5, 55.5],
      stem: 'How many times has the group said the world would end?',
      choices: ['5', '15', '50'], a: 1, keep: true,
      cue: 'end のすぐあと、回数を言う部分。',
      line: 'They’ve said that the world’s gonna end *15 times*',
      said: '「世界が終わると言ったのは15回」。だから心配ない、という話。',
      mean: 'fifteen は teen を強く長く言う。fifty は前の fif が強い。',
      trap: '-teen と -ty は聞き分けにくい。teen は「ティーン」と長く伸び、強勢も後ろにある。',
      use: 'I’ve told you fifteen times!（もう15回は言ったよ！）' },

    // R fix: V2 (blind 55 %): "how often" was a filler; it's now an apology for the joke before (Live Strong)
    // why: less certain ← "I think" right after reads as a hedge, and "at any rate" as "at least"; the joke ← it follows
    //   the Lance Armstrong joke, so it sounds like a retreat from it
    { id: 'm1', skill: 'marker', level: 'B2', point: 'rate', seg: [62.1, 65.8],
      stem: 'What does Leslie’s opening phrase do before “I think Ben and I…”?',
      choices: ['It moves on from the side talk to her plan', 'It makes her plan sound less certain',
                'It admits the joke before it fell flat'], a: 0,
      cue: 'I think の直前、3語の決まった言い方。',
      line: '*At any rate*, I think Ben and I should accompany you tonight.',
      said: '有名人の別れ話のあと、「とにかく、今夜はベンと私が付き添う」と切り出す。',
      mean: 'At any rate ＝「それはさておき」。脱線した話を本題に戻す。',
      trap: 'rate を「割合・料金」と文字通りに取ると意味がずれる。文頭の3語は話の切りかえ。',
      use: 'At any rate, let’s order.（それはさておき、注文しよう）' },

    // R fix: V2 (blind 50 %): the key was the only choice naming Leslie and the only one about feelings; all three are
    //   now one-clause reasons of the same length
    // why: early start ← the usual excuse for leaving early; silly ← "forced to hang out" heard as a complaint about the
    //   vigil
    { id: 'd3', skill: 'detail', level: 'B2', point: 'weird', seg: [78.4, 87.3],
      stem: 'Why does Ben say he won’t stay long tonight?',
      choices: ['Things with Leslie still feel awkward', 'He has an early start at work tomorrow',
                'The vigil feels a bit silly to him'], a: 0,
      cue: 'It’s just のあと、文の最後の形容詞。',
      line: 'I’ll *come for a bit*, but… I’m not gonna stay. It’s just… *still kind of weird*, right?',
      said: '「少しは行くけど、長くはいない。まだちょっと気まずいでしょ」と言う。',
      mean: 'weird ＝ 変。ここでは二人の間が気まずいこと。理由をぼかして伝えている。',
      trap: '「仕方なく」と聞くと、行事が嫌に聞こえやすい。It’s just のあとに本当の理由が来る。',
      use: 'It’s still a little weird for me.（まだちょっと気まずくて）' },

    // R fix: V2 (blind 65 %): the key was the only two-sided feeling; every choice now pairs a feeling with how she
    //   handles it
    // R fix (2): a cold re-read got it at 80 % ("minds but hides it" is the sitcom default); the "glad" choice is now a
    //   second "she minds", so the feeling alone doesn't pick the key
    // why: pushes him to stay ← she minds, and "I insist" earlier sounds like her pushing; means it ← the yeahs taken
    //   at face value
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'yeah', seg: [78.4, 92.2],
      stem: 'How does Leslie take Ben’s plan to leave early?',
      choices: ['She minds, but tries hard to seem fine', 'She minds, and pushes him to stay longer',
                'She’s fine with it, and means what she says'], a: 0,
      cue: '返事の yeah の数と、そのあとの2つの言い方。',
      line: 'Yeah, yeah, yeah… mm-hmm, *totally get it*. *Definitely get it*.',
      said: 'ベンが「長くはいない」と言うと、yeah を何度も重ね、「全然分かる」と言う。',
      mean: '分かったと何度も言いすぎるのは、平気なふりのサイン。',
      trap: 'totally を本気の同意と取りやすい。同じ返事が続きすぎたら、気持ちを隠していると疑う。',
      use: 'No, totally, I get it. It’s fine.（いや、全然分かるよ。大丈夫）' },

    // R fix: V2 (blind 50 %): "joking, doesn't mind" was the easy throw-away; it's now a second "she cares" reading
    //   that the words don't support, so the key isn't the only choice where she minds
    // why: drifted apart ← "don't hang out" heard as "stopped hanging out", so the pairs sound like old friends; hopes
    //   Ben hears ← she does mind, but nothing in the words is aimed at Ben
    // anchor: 92.3–101.6 s "Lots of people don't hang out", then pairs that were never close, ending on "probably";
    //   right after the run of "yeah"s at 87.6–92 s
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'yeah', seg: [78.4, 101.9],
      stem: 'In her comment to the camera, what does Leslie’s list of pairs give away?',
      choices: ['She’ll grab any pair at all to make it seem normal', 'She thinks those pairs drifted apart, as she and Ben did',
                'She hopes Ben hears this and starts calling again'], a: 0,
      cue: '並べる二人組と、最後に付ける一語。',
      line: 'Big deal. *Lots of people don’t hang out*. Jerry and April, Obama and Madonna, *probably*.',
      said: 'カメラに「会わない人は大勢いる。オバマとマドンナとか、たぶん」と話す。',
      mean: '元々親しくない二人組を並べ、probably まで付ける。手当たり次第の例で自分を納得させている。',
      trap: '会わない＝疎遠になった、と取りやすい。慰めの例が苦しいほど、本人は気にしている。',
      use: 'It’s fine. Lots of people eat alone.（平気。一人で食べる人なんて大勢いる）' },

    // R fix: V2 (blind 70 %): the fillers (good press, broke a rule) are now a literal reading and a fair reporter's angle
    // why: join ← "two people… here" read literally, as staff taking part; wasting staff ← a reporter's usual angle on
    //   officials at a harmless event
    { id: 'i1', skill: 'infer', level: 'B2', point: 'interpret', seg: [101.8, 112.25],
      stem: 'When the reporter mentions two people from the city manager’s office, what is she hinting?',
      choices: ['The city is more worried than it admits', 'The city has sent staff to join the group',
                'The city is wasting staff on a harmless event'], a: 0,
      cue: '最初の質問の答えのあと、So で始まる質問。',
      line: 'So I *shouldn’t interpret anything* from the fact that there are *two people from the city manager’s office* here?',
      said: '「危険視していない」と聞いて、「では市の職員が二人いることに意味はないと？」と聞き返す。',
      mean: 'So で前の答えにつなぎ、本当は心配しているのでは、と遠回しに言っている。',
      trap: '記者の質問はむだ遣いの批判に聞こえやすい。So の前の質問とつなげて聞く。',
      use: 'So I shouldn’t read anything into that?（じゃあ、深い意味はないってこと？）' },

    // R fix: V2 (blind 55 %): three "He clears the city by…" choices now, so the frame gives nothing away
    // why: mocking the cult ← "says more about me than them" heard as a dig at "them"; teasing her ← "them" heard as
    //   aimed at the reporter who asked
    { id: 'h1', skill: 'humor', level: 'C1', point: 'nothing', reveals: ['interpret'], seg: [107.1, 116.6],
      stem: 'Why is the reply to the reporter’s question about the staff funny?',
      choices: ['He clears the city by putting himself down', 'He clears the city by mocking the cult',
                'He clears the city by teasing the reporter'], a: 0,
      cue: 'except のあとと、最後の比べ方。',
      line: 'Nothing except that *I had nothing better to do*. Which probably *says more about me* than them.',
      said: '「意味はない。ほかにやることがなかっただけ。それは彼らより僕のことを物語るね」と答える。',
      mean: '市は心配していないと示すため、自分は暇人だと認める。自分を下げる笑い。',
      trap: 'them は信者のこと。最後の比べ方を悪口と取りやすいが、下げているのは自分。',
      use: 'That says more about me than you.（それは君より僕の問題だね）' },

    // R fix: V2 (blind 65 %): the party-stories filler is now "story" as a news story (she is a reporter); "earlier in the
    //   evening" is now why he came
    // why: news story ← story = 記事, and she is writing one; why he came ← "What's the story?" = 何があった、どうして
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'story', seg: [139.1, 144.1],
      stem: 'When the reporter makes clear she means Ben, what is she asking?',
      choices: ['Who he is and what his situation is', 'Why he decided to come tonight',
                'What he thinks of her news story'], a: 0,
      cue: 'I meant のあと、短い質問。',
      line: 'I meant Ben. *What’s his story?*',
      said: '「クリスじゃなくてベン。どういう人？」と聞く。「独身？」の続き。',
      mean: 'What’s his story? ＝ どんな人？事情は？恋人の有無も含めて探る聞き方。',
      trap: '記者なので story を「記事」と取りやすい。人について聞くときは「素性・事情」。',
      use: 'Who’s the new guy? What’s his story?（新人誰？どんな人？）' },

    // R fix: V2 (blind 70 %): "offended" was a filler; it's now "suspicious" (her jealousy later makes it tempting), and
    //   "bored" is now "cool"
    // why: cool ← "I don't know" and "not sure" taken as a calm brush-off; suspicious ← "Who? Ben?" heard as her
    //   turning the question back on the reporter
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'fluster', seg: [143.7, 150.5],
      stem: 'How does Leslie sound when she is asked about Ben?',
      choices: ['Flustered, tripping over her words', 'Cool, as if she’d rather not gossip',
                'Suspicious, as if testing the reporter'], a: 0,
      cue: '答えの最初の数語、同じ語のくり返し。',
      line: 'Who? Ben? *I… I don’t know. I… I’m not… I’m not sure.*',
      said: '「誰？ベン？えっと…分からない…よく知らない」と、何度も言いかける。',
      mean: 'よく知る人のことを聞かれて、言葉が出てこない。動揺のサイン。',
      trap: 'I don’t know だけ聞くと冷静にかわしたように聞こえる。言いかけてやめる回数に注目する。',
      use: 'Who, me? I… I’m not sure.（え、私？えっと…よく分からない）' },

    // R drop: nt2 (attitude C2, "what is she trying not to say?"): its key (they once dated) rests on lines at 192 s and
    //   300 s, outside its segment (S4, V1); blind 70 %; it shared a3's point. Never shipped, so deleted.

    // why: softens ← nay = いいえ, heard as pulling the claim back; disagrees ← "nay" as a no-vote aimed at the reporter
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'nay', seg: [159.3, 163.4],
      stem: 'In her last line about Ben, what does the old-fashioned word do?',
      choices: ['It turns her claim into a stronger one', 'It softens her claim into a weaker one',
                'It shows she disagrees with the reporter'], a: 0,
      cue: 'as good のあと、短い一語とその次の語。',
      line: 'Your guess is as good, *nay, better* than mine.',
      said: '「あなたの推測は私と同じくらい、いや、私以上に当たる」と言う。',
      mean: 'nay ＝ 古風な「いや、むしろ」。前の言葉を強い言葉で言い直す、わざと大げさな言い方。',
      trap: 'nay を「いいえ」と取ると、取り消しや反対に聞こえる。後ろの語が前より強いかを聞く。',
      use: 'It was good, nay, amazing.（良かった、いや、最高だった）' },

    // why: wanna ← once "I'm" shrinks, gonna and wanna differ only in the first consonant; have to ← "hafta" has the
    //   same two-beat rhythm
    { id: 's1', skill: 'sound', level: 'B2', point: 'remind', seg: [191.35, 196.85],
      stem: 'Fill the gap: “___ remind you that the reason…”',
      choices: ['I’m gonna', 'I wanna', 'I have to'], a: 0,
      cue: '文の最初、remind の前の弱い2拍。',
      line: '*I’m gonna* remind you that the reason…',
      said: '「言っておくけど」と切り出す。I’m gonna が「アムガナ」と短い。',
      mean: 'I’m gonna ＋ 動詞 ＝ これから〜するよ、という予告。ここでは釘を刺す前置き。',
      trap: 'I’m の m が溶けて wanna に聞こえやすい。g の音があるかを聞く。',
      use: 'I’m gonna be honest with you.（正直に言うね）' },

    // R fix: V2 (blind 55 %): the key was the only choice about Leslie; three "… decided to…" choices now, two of them
    //   on "city council", told apart by the subject
    // why: city manager ← "city" is heard, and Ben is from the city manager's office; he ran ← the subject of "decided"
    //   lost in fast speech
    { id: 'd5', skill: 'detail', level: 'B1', point: 'council', reveals: ['fluster'], seg: [191.35, 196.85],
      stem: 'According to her friend, why isn’t Leslie dating Ben?',
      choices: ['She decided to run for city council', 'She decided to work for the city manager',
                'He decided to run for city council'], a: 0,
      cue: 'because のあと、誰が何を決めたか。',
      line: 'the reason you’re not dating him is because *you decided to run for city council*.',
      said: '友だちが「付き合わないのは、あなたが市議会選に出ると決めたからでしょ」と思い出させる。',
      mean: '付き合わないのはレスリー自身の選択だった、という指摘。',
      trap: 'city が聞こえるので市の仕事の話と混ざりやすい。decided の主語を聞く。',
      use: 'Remember, this was your idea.（忘れないで、言い出したのは君だよ）' },

    // R fix: V2 (blind 50 %): three "verb, as if…" choices of one length now
    // why: checks ← it has a question's form and rising pitch; gives in ← "Oh, so…" heard as accepting the point
    //   (そっか)
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'canta', seg: [191.35, 199.85],
      stem: 'When her friend reminds her why she isn’t dating Ben, what does Leslie’s reply do?',
      choices: ['Pushes back, as if the idea is unfair', 'Checks, as if she truly isn’t sure',
                'Gives in, as if she sees the point'], a: 0,
      cue: 'Oh, so で始まる返事の、文の形。',
      line: 'Oh, so *just because I can’t go out with him, someone else can?*',
      said: '「じゃあ、私が付き合えないからって、ほかの人ならいいわけ？」と言い返す。',
      mean: '答えを求めない反語の質問。理屈で負けても、ほかの人もダメだと言い張っている。',
      trap: 'Oh, so は「そっか」と納得にも聞こえる。疑問の形でも、言い返しなら答えは求めていない。',
      use: 'Oh, so now it’s my fault?（え、じゃあ私のせいってこと？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'gotta', seg: [209.3, 212.0],
      stem: 'Type what she says: “I ___ them away from each other…” (2 words)', answer: 'gotta keep',
      cue: '2回目の I のあと、them の前の2語。',
      line: 'I gotta stop this. I *gotta keep* them away from each other…',
      said: '「止めなきゃ。引き離さなきゃ」。got to が「ガラ」と縮む。',
      mean: 'gotta ＝ have got to ＝ have to。焦りが出る言い方。',
      trap: 'have が消え、gotta の t は弾んで「ラ」に近い。got to に戻すと意味が分かる。',
      use: 'I gotta go, my train’s here.（もう行かなきゃ、電車が来た）' },

    // R fix: V2 (blind 75 %) + S1: "take him herself" was a filler; it's now her own "losers" line. The stem no longer
    //   says she is talking to Ben (who "you" is can't be settled from the words)
    // why: Zorp ← her own stated reason, taken at face value; losers ← she has just called the party-goers losers
    { id: 'i3', skill: 'infer', level: 'C1', point: 'party', seg: [234.9, 249.75],
      stem: 'Why does Leslie go from mocking the party to blocking it?',
      choices: ['She doesn’t want Ben there with the reporter', 'She doesn’t want Ben seen with the losers there',
                'She wants Ben here in case Zorp shows up'], a: 0,
      cue: 'パーティーをけなしたあと、誰が興味を見せるか。',
      line: 'Yeah, *what is that?* … Well, then you should *stay here*, then. Because *you can’t go*.',
      said: 'パーティーをけなしたあと、記者が興味を見せると、急に「行っちゃだめ」と言い出す。',
      mean: '本当の理由は記者とベンを一緒にさせないこと。ゾープの話は後付けの口実。',
      trap: '口で言う理由を本当の理由と取りやすい。態度が変わる直前に何があったかを聞く。',
      use: 'On second thought, you should stay.（やっぱり、残った方がいいよ）' },

    // R fix: V2 (blind 60 %): "all along" made the key the only choice with a twist; three "X, since…" choices now
    // why: brushing off ← "I'll take my chances" heard as a snub to Leslie; Herb ← his face-melting threat is the
    //   nastiest line, and it comes just before
    // anchor: 243.6–247.9 s Leslie orders Ben "you should stay here… because you can't go"; 260.7 s the reporter's
    //   goodbye is "Leslie, thanks as always"; Leslie's verdict lands on the person she has just been bossing around
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'rude', seg: [243.1, 267.1],
      stem: 'When Leslie calls the reporter unpleasant, who is the joke on?',
      choices: ['Leslie, since she’s the one who acted rudely', 'The reporter, since she brushed off the warning',
                'Herb, since his threat was the rudest line'], a: 0,
      cue: '記者の別れのあいさつと、その前のレスリーの言葉。',
      line: 'Leslie, *thanks as always*. — Wow, what an *unbelievably unpleasant person*.',
      said: '引き止めるレスリーに、記者は「いつもありがとう」と去る。レスリーは「なんて感じの悪い人」と言う。',
      mean: '感じが悪かったのは、命令して引き止めたレスリーの方。自分のことを相手に重ねて言うのが笑い。',
      trap: '最後の悪口を、直前の脅しや断り方への反応と取りやすい。悪口は、言った本人の行動と比べて聞く。',
      use: 'Look who’s talking.（よく言うよ）' },

    // why: 12 ← twelve and twenty both start "tw"; 30 ← thirty and twenty share -ty, and the weak start blurs
    { id: 'n2', skill: 'number', level: 'B1', point: 'twenty', seg: [282.7, 290.5],
      stem: 'How long does Ron say is left until the end?',
      choices: ['12 minutes', '20 minutes', '30 minutes'], a: 1, keep: true,
      cue: 'only のあと、until の前の数。',
      line: 'given there’s only *20 minutes* until the end of human existence',
      said: '「人類の終わりまで、あと20分しかないとしても」と前置きする。',
      mean: 'twenty の二つ目の t は弱く、twenny に近く聞こえることもある。',
      trap: 'twelve と twenty は最初が同じ。語尾の -ty を聞く。thirty は「サ」から。',
      use: 'There’s only twenty minutes left.（あと20分しかない）' },

    // R fix: V2 (blind 60 %): the key was the only choice with a twist; one distractor is now the reverse twist
    // why: turns into a yes ← "But given…" is the usual set-up for an exception; excuse ← the end of the world is named,
    //   so it sounds like his reason for saying no
    { id: 'h5', skill: 'humor', level: 'C1', point: 'alsono', seg: [282.7, 290.5],
      stem: 'Why does Ron’s answer to Leslie’s request get a laugh?',
      choices: ['It promises an exception, then says no again', 'It starts as a no, then turns into a yes',
                'It refuses, with the world ending as its excuse'], a: 0,
      cue: 'Normally のあと、But で始まる後半の最後。',
      line: '*Normally, no.* But given there’s only… until the end of human existence, *also no*.',
      said: '「普段ならノー。でも人類の終わりが近いことを考えても、やっぱりノー」と答える。',
      mean: 'But given 〜 は例外を出す前置き。期待させて同じ答えなのが笑い。',
      trap: 'But given で「今日は特別」と予想しやすい。逆の話が来なければ冗談。',
      use: 'Normally, no. Today? Also no.（普段はダメ。今日は？やっぱりダメ）' },

    // R fix: V2 (blind 65 %): the apology filler is now a second confession (of what she did), so "confession" isn't a
    //   giveaway
    // why: what she did ← "I tried to screw up…" and "because of me" lead toward more owning-up; promise ← "lost my
    //   mind" leads toward a vow to stop
    { id: 'r1', skill: 'predict', level: 'B2', point: 'want', reveals: ['fluster'], seg: [299.3, 306.9],
      then: [306.9, 313.6],
      stem: 'After “But I have to tell you, Ron…”, what kind of thing comes next?',
      choices: ['A confession of how she still feels', 'A confession of what she did to Ben',
                'A promise to make things right with Ben'], a: 0,
      cue: '「別れたのは私のせい」のあとの But。',
      line: 'We broke up because of me. But I have to tell you, Ron, *if the world was ending tomorrow, I’d want to be with him*.',
      said: '「別れたのは私のせい。でも明日世界が終わるなら、彼といたい」と言う。',
      mean: 'I have to tell you は本音の前置き。But で反省と逆の気持ちが来る。',
      trap: '反省の続きを予想しやすい。But は逆向き、この前置きのあとは本音が多い。',
      use: 'I have to tell you, I miss it.（正直に言うと、恋しいんだ）' },

    // R fix: V2 (blind 50 %): two choices now start from “a regular Friday”, told apart by what comes back with it
    // why: stop worrying ← "a regular Friday" heard as comfort, everything back to normal; tell Ben ← the usual "if the
    //   world was ending" romance script
    { id: 'g2', skill: 'gist', level: 'B2', point: 'same', reveals: ['want'], seg: [313.4, 333.6],
      stem: 'What is the point of Ron’s reply to Leslie’s confession?',
      choices: ['Tomorrow will be normal, and so will her problem',
                'Tomorrow will be normal, so she can stop worrying',
                'The end may be near, so she should tell Ben now'], a: 0,
      cue: 'Ron の後半、position で終わる文。',
      line: 'It’ll be a regular Friday, and you’ll be in the *exact same position* you were in before.',
      said: 'ロンは「世界は終わらない。日が昇り、普通の金曜になって、前と同じ状況のままだ」と言う。',
      mean: '世界の終わりは言い訳にならない、という指摘。悩みは残ったまま。',
      trap: '「いつもの金曜」を慰めと取りやすい。戻るのは前と同じ状況で、悩みも一緒に戻る。',
      use: 'Tomorrow, you’ll still have the same problem.（明日になっても、問題は同じだよ）' },
  ]
};
