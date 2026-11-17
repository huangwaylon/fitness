// REVIEW 2026-11-16: pass 10, fix 11, drop 2, new 1; ear checks 1
// OPEN: i4, f4, nt2 and t1 read at 50–55 % from the choices on the blind pass; kept (the distractors are real
//   misreadings the audio refutes). The new s3 hasn't had a fresh second reader.
// “I'm the Godfather - The Office US” (the official The Office channel, BEST OF SEASON 7 - The Office US): the whole office
// turns up at baby Cece's christening; in a mob-boss voice Michael tries to sit with the family as "the godfather",
// Pam and Jim get him to admit he isn't, the real godfather turns out to be a newer friend, and Michael tells the
// camera he's being shut out; then a pastor's announcements.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Jim and Pam (0.6–1.8 s, 33–34 s),
// Cece (11.7 s, 106.6 s), Michael (83.4 s, 98.1 s, 111.2 s, 141.4 s), Seth (121.3 s). Which parent says each line in
// 83–141 s isn't settled, so no item keys on it.
// Not asked: 18–27 s (an "opium of the masses" / pipes joke), 50–59 s (a crude "nard pups" talking head), 92–97 s (a
// film line and a "shoot you in the head" joke), 146.6 s (a spelled-out insult), 182.7–188 s (a prostitution joke),
// 191–220 s (garbled, then music). 72.6 s: whisper "the big guy", captions "the guy" (f2 avoids the word).
// EAR CHECK: 142–154 s f4 nt1 — the to-camera speaker of "her parents are kind of boxing me out" is Michael (assumed: he
//   is the one just kept from the family seats, and "Thank you for coming, Michael" comes right before)
import type { Clip } from '../types.ts';

export const godfather: Clip = {
  id: 'godfather', video: 'HxOryxpZAng', title: 'I\'m the Godfather - The Office US', dur: 220, wpm: 136,
  band: 'slow', tags: ['職場', '友だち'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 — "thrilled" and "worried" were easy cuts (blind 65 %); now a near miss (surprised, but glad) and
    //   "expecting them"
    // why: glad ← "Big day" just before is bright, and surprise is half right; expecting ← "everyone from work is
    //   here" heard as a plan, missing "weren't"
    { id: 't2', skill: 'attitude', level: 'B2', point: 'planning', seg: [11.2, 18.2],
      stem: 'How do the parents seem to feel about the office being there?',
      choices: ['Caught off guard, and not too happy', 'Caught off guard, but glad they came',
                'Expecting them, and a little nervous'], a: 0,
      cue: 'planning のあと、短い一語の返事。',
      line: 'Everyone from work is here. *We weren’t planning on that.* — *Nope.*',
      said: '「職場の人が全員来てる。そのつもりはなかった」「全然」と言う。',
      mean: '招いていない人たちが来た。Nope は短く、うれしくない気持ちがにじむ。',
      trap: 'Big day の明るさから喜んでいると取りやすい。weren’t の否定と、短い Nope を聞く。',
      use: 'We weren’t planning on that.（それは予定外だった）' },

    // R fix: V2/K6 — "without asking" made the key the only nuanced choice (blind 65 %); the work-outing filler became
    //   "invited a few, and word got around" (refuted by "I invited everyone")
    // why: parents ← the usual script: the parents invite the guests; a few ← "everyone" missed, and a whole office
    //   turning up sounds like gossip
    { id: 'g1', skill: 'gist', level: 'B2', point: 'invite', reveals: ['planning'], seg: [11.2, 45.3],
      stem: 'Why is the whole office at the christening?',
      choices: ['A coworker invited them all on his own', 'Pam and Jim invited them all, to be polite',
                'A coworker invited a few, and word got around'], a: 0,
      cue: 'カメラへの一言の、最初の動詞。',
      line: '*I invited everyone in the office* because it’s not a day for just Jim or Pam…',
      said: '親は「予定外」と言い、別の人が「全員を招いた」とカメラに話す。',
      mean: '招いたのは親ではなく、自分の日のように思っている人。',
      trap: '客は親が招くもの、という型で選びやすい。we weren’t planning と I invited を結ぶ。',
      use: 'Who invited all these people?（誰がこの人たちを呼んだの？）' },

    // R new: s3 (replaces s1). Blind read: "We ___ planning on that." 35 % (were/weren't both fit; aren't/won't be fit
    //   the gap too). Key from both sources ("we weren't planning on that"), refutations from “Nope” agreeing.
    // why: were ← the final -nt of weren't fades before "planning"; aren't ← the same vowel family, "r" heard, tense
    //   missed; won't be ← another negative with a w-
    { id: 's3', skill: 'sound', level: 'B2', point: 'planning', seg: [13.9, 18.1],
      stem: 'Fill the gap: “Everyone from work is here. We ___ planning on that.”',
      choices: ['weren’t', 'were', 'aren’t', 'won’t be'], a: 0,
      cue: 'We のすぐあと、planning の前の短い音。',
      line: 'Everyone from work is here. We *weren’t* planning on that. — Nope.',
      said: '「職場の人が全員来てる。そのつもりはなかった」「全然」。',
      mean: 'weren’t は「ワーン(ト)」。t はほぼ消えるが、n の鼻音は残る。',
      trap: 't が消えると were に聞こえやすい。n の響きと、相手の Nope で否定と分かる。',
      use: 'We weren’t expecting you so soon.（こんなに早く来るとは思わなかった）' },

    // R fix: V2 — "sorry the parents weren't asked" was a filler (blind 50 %); now "office like a family", the
    //   surface of "it is about us all", which is said on purpose, not a slip
    // why: look generous ← inviting everyone can be a show; family ← "it is about us all" taken as the point
    { id: 'h1', skill: 'humor', level: 'C1', point: 'myjoy', reveals: ['invite'], seg: [31.0, 45.3],
      stem: 'At the end of the comment about inviting everyone, what slips out?',
      choices: ['That he sees the day as mainly about him', 'That he only asked people to look generous',
                'That he wants the office to feel like family'], a: 0,
      cue: 'celebrate のあと、まず誰の喜びと言うか。',
      line: 'we should all celebrate *my joy*… and all of our joys.',
      said: '「みんなの日だ」と言いながら、「僕の喜びを祝おう…みんなの喜びも」と言い直す。',
      mean: '他人の子の洗礼式なのに、最初に出たのは my joy。言い直しで本音がばれている。',
      trap: '前半だけなら親への気づかいに聞こえる。言い直しは本音のサイン。',
      use: 'It’s my day— I mean, our day.（僕の日、いや、みんなの日）' },

    // R fix: V2/S2 — the stem quoted the slogan, which answers it (blind 75 %); the stem now points at the repetition
    // why: asking ← "your needs" sounds like a question to the guests; program ← paper and printing at a service
    //   suggest the church's printed program
    { id: 'i2', skill: 'infer', level: 'B2', point: 'paper', seg: [59.9, 68.75],
      stem: 'What is someone doing with the line he repeats three times?',
      choices: ['Promoting the company’s paper at church', 'Asking the guests what paper they need',
                'Joking about the church’s printed program'], a: 0,
      cue: '同じ文を何度くり返すか、その言い方。',
      line: '*For all your paper and printer needs.*',
      said: '「紙とプリンターのことなら何でも」と、同じ文句を何度もくり返す。',
      mean: '宣伝の決まり文句。洗礼式の場で、会社の紙を売り込んでいる。',
      trap: 'your needs から質問と取りやすいが、疑問の形ではない。くり返しは宣伝の型。',
      use: 'For all your travel needs, call us.（旅行のことなら何でもお電話を）' },

    // why: weeks ← "years" with a weak y is as short as "weeks"; days, months ← "a few" fits any of them
    { id: 'n2', skill: 'number', level: 'B1', point: 'years', seg: [68.65, 72.55], keep: true,
      stem: 'In the comment about Sunday church, how long has it been?',
      choices: ['A few days', 'A few weeks', 'A few months', 'A few years'], a: 3,
      cue: 'church service のあと、been に続く部分。',
      line: 'Sunday church service. It’s been *a few years*.',
      said: '「日曜の礼拝か。何年かぶりだな」と言う。',
      mean: 'It’s been a few years ＝ 数年ぶり。長く教会に行っていない。',
      trap: 'years の y は弱く、weeks と同じ長さに聞こえやすい。最後の「イヤーズ」の伸びを聞く。',
      use: 'It’s been a few years, hasn’t it?（何年かぶりだね）' },

    // R fix: V2/K6 — the key was the only choice with "years" and a long gap (blind 55 %); all three are now "He has
    //   a lot…"
    // why: hurry ← catch up = 追いつく; old friends ← "catch up" is often said about meeting friends
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'catchup', reveals: ['years'], seg: [68.65, 75.6],
      stem: 'What does the speaker mean at the end of his comment about church?',
      choices: ['He has a lot to talk over after a long gap', 'He has a lot to do to get there on time today',
                'He has a lot of old friends to see there'], a: 0,
      cue: '教会の話の、最後の一言。',
      line: 'It’s been a few years… we got some *catching up to do*.',
      said: '「何年かぶりだ。あの方とは積もる話がある」と言う。',
      mean: 'catch up ＝ 会わない間の話をする。教会の「相手」と久々に話す冗談。',
      trap: 'catch up を「追いつく・急ぐ」と取りやすい。会っていない相手との catch up は「近況を話す」。',
      use: 'Let’s grab coffee and catch up.（お茶して近況を話そう）' },

    // R fix: V2 — "a second godfather for fun" was a filler (blind 50 %+); now "they give in", the reading of
    //   "really funny" and "I love when you do that voice" as a yes
    // why: sits with them ← the joke goes on for a while and nobody says no outright; give in ← the parents praise
    //   the joke twice
    { id: 'g2', skill: 'gist', level: 'B1', point: 'outcome', reveals: ['sayit', 'family'], seg: [77.0, 118.8],
      stem: 'How does Michael’s attempt to sit with the family end?',
      choices: ['He has to say out loud he isn’t godfather', 'He’s allowed to sit with them after all',
                'He makes them laugh, and they finally give in'], a: 0,
      cue: '最後に Michael が自分で言う一文。',
      said: '家族の席に座ろうとするが断られ、最後は「僕は代父じゃない」と自分で言う。',
      mean: '冗談で押し切ろうとしたが、本人に認めさせる形で話が終わる。',
      trap: '冗談をほめられるので、押し切れた話に見えやすい。ほめ言葉のあとの but と、最後の I’m not を聞く。',
      use: 'Fine. I admit it. I was wrong.（分かった、認める。僕が悪かった）' },

    // R drop: s1 (V1) — "an offer you ___ refuse" is the film quote: the key comes from knowing the line, not from the
    //   audio (blind 80 %). Replaced by s3 at 16 s.
    // R fix: V2 — "look over at the baby" was a filler (blind 60 %); now "stand up so he can get past"
    // why: hurry ← "over" heard as "get it over with"; get past ← "scooch" heard as "excuse me, coming through"
    { id: 'f3', skill: 'phrase', level: 'B1', point: 'scooch', reveals: ['family'], seg: [79.5, 84.85],
      stem: 'Right after his “offer”, what does Michael ask the family to do?',
      choices: ['Move along so he can sit with them', 'Stand up so that he can get past them', 'Hurry up so the service can start'],
      a: 0,
      cue: 'refuse のあと、over で終わる短い一言。',
      line: '*Scooch over!* — Oh, Michael, this is just for family.',
      said: '「詰めて！」と言い、「ここは家族の席なの」と返される。',
      mean: 'scooch over ＝ 少し詰めて。座る場所を空けてもらう、くだけた言い方。',
      trap: 'scooch を「通して」と取りやすい。座る話だと、直後の just for family で分かる。',
      use: 'Can you scooch over a little?（ちょっと詰めてくれる？）' },

    // R fix: V2 — "asks for a part" was weak (blind 55 %); now godfather/grandfather, a near sound
    // why: truly thinks ← Michael often believes such things, and the line is said with force; grandfather ← the near
    //   sound, and "confusing" in the reply
    { id: 'h2', skill: 'humor', level: 'C1', point: 'pun', reveals: ['funny'], seg: [79.5, 91.7],
      stem: 'Why does Michael’s “But I’m the godfather!” get a laugh?',
      choices: ['His movie act uses a word that’s a real role here', 'He truly thinks they chose him as the godfather',
                'He mixes up “godfather” and “grandfather”'], a: 0,
      cue: 'すぐあとの「really funny, but…」の説明。',
      line: 'But *I’m the godfather*! — …that can be confusing *at a christening*…',
      said: '「僕がゴッドファーザーだ！」に「洗礼式だと紛らわしい」と返る。',
      mean: '映画のボスの口まねだが、洗礼式の godfather は本物の役目（代父）。意味が重なる。',
      trap: '本気で代父のつもりと取りやすいが、二人は really funny と冗談で受けている。',
      use: 'Ha, I see what you did there.（うまいこと言うね）' },

    // R fix: V2/K6 — "kindly" made the key the only nuanced choice (blind 60 %); trimmed, choices parallel
    // why: invites ← "family" sounds warm, like "you're family"; explains ← "this is just for family" read as
    //   information, not a refusal
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'family', seg: [81.95, 86.35],
      stem: 'When Michael tries to join them, what does “this is just for family” do?',
      choices: ['It turns him away from the seats', 'It makes room for him in the seats',
                'It tells him who the family are'], a: 0,
      cue: 'Oh, Michael のあとの一文の働き。',
      line: 'Oh, Michael, *this is just for family*.',
      said: '「マイケル、ここは家族だけなの」と言う。',
      mean: '直接「だめ」と言わず、理由を示して断っている。just が「家族以外は無理」を表す。',
      trap: 'family の温かい響きで誘いに聞こえやすい。just ＝ 〜だけ、が断りの中心。',
      use: 'Sorry, this table is just for staff.（すみません、このテーブルは職員用です）' },

    // R fix: V2/S2 — the stem's "…, but" was the cue to the key (blind 65 %); the stem now names the moment, and
    //   "too hard to follow" became "explains it to the guests" ("confusing at a christening")
    // why: laughs along ← "really funny" taken at face value; explains ← "can be confusing at a christening" heard as
    //   said for the guests
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'funny', reveals: ['pun'], seg: [86.05, 91.7],
      stem: 'What does the reply to “But I’m the godfather!” mainly do?',
      choices: ['Praises the joke before asking him to drop it', 'Laughs along, since they enjoy the joke',
                'Explains the joke to the guests nearby'], a: 0,
      cue: 'funny のあと、but に続く部分。',
      line: 'It is really funny, *but* you know that can be confusing… because *you are not the godfather*.',
      said: '「すごく面白い。でも紛らわしい、あなたは代父じゃないから」と言う。',
      mean: 'ほめてから but で本題。冗談をやめてほしい、という頼みを角を立てずに伝えている。',
      trap: 'really funny で一緒に笑っていると取りやすい。but のあとに本音が来る。',
      use: 'That’s funny, but let’s keep it down.（面白いけど、静かにしようか）' },

    // R drop: p3 (V2/V3) — the stem ("asked to drop it… start with praise") gave the key (blind 70 %), and it tests the
    //   same praise-then-but move as p2 eleven seconds earlier
    // why: you're ← one of the two "you"s is lost when fast; were ← "you're" and "you were" blur; knew ← know/knew
    //   differ only in the vowel
    { id: 's2', skill: 'sound', level: 'B2', point: 'tellme', seg: [103.6, 108.2],
      stem: 'Fill the gap: “I need you to tell me that ___ not Cece’s godfather.”',
      choices: ['you know you’re', 'you’re', 'you know you were', 'you knew you were'], a: 0,
      cue: 'tell me that のあと、短い語が続く部分。',
      line: 'I need you to tell me that *you know you’re* not Cece’s godfather.',
      said: '「代父じゃないと分かってる、と言って」。速くつながる部分。',
      mean: '本人が分かっていると認めることを求めている。you’re は弱い「ヨ」。',
      trap: 'you が続くので一つ落として you’re だけと取りやすい。were なら過去。',
      use: 'Tell me you know where we’re going.（行き先、分かってるって言って）' },

    // why: mob voice ← the voice joke has run all scene; too loud ← "Yeah!" is shouted, in a church
    { id: 'i4', skill: 'infer', level: 'C1', point: 'sayit', seg: [103.6, 117.0],
      stem: 'Why is Michael’s “Yeah!” not accepted as an answer?',
      choices: ['It doesn’t actually say he isn’t the godfather', 'It sounds like he’s still doing the mob voice',
                'It was too loud for a church service'], a: 0,
      cue: '「Yeah!」のあと、何をはっきり求めるか。',
      line: 'Yeah! — I’m sorry, Michael. *I need you to say it.*',
      said: 'Michael は「うん！」とだけ答え、「ごめん、ちゃんと言って」と言われる。',
      mean: 'yeah だけでは何を認めたのかはっきりしない。「代父じゃない」と言わせたい。',
      trap: '声の大きさや口調の問題と取りやすい。say it の it は、求めた文そのもの。',
      use: 'Don’t just nod. Say it.（うなずくだけじゃなくて、言って）' },

    // R fix: S1 — "she" named a parent the header says isn't settled; the stem is now neutral
    { id: 'x1', skill: 'dict', level: 'B2', point: 'sayit', seg: [110.1, 114.0],
      stem: 'Type the request: “I’m sorry, Michael. I ___.” (5 words)', answer: 'need you to say it',
      cue: 'Michael と呼んだあと、I から。',
      line: 'I’m sorry, Michael. I *need you to say it*.',
      said: '「ごめん、マイケル。言ってほしいの」。',
      mean: 'need you to が「ニージュタ」のようにつながり、to は弱い「タ」。say it もつながる。',
      trap: 'you to が一つに聞こえ need to と書きやすい。「誰に」の you が入る。',
      use: 'I need you to call me back.（折り返し電話してほしい）' },

    // why: relative ← the talk has been about family seats; office ← the whole office is there
    { id: 'd3', skill: 'detail', level: 'B1', point: 'seth', seg: [118.8, 124.0],
      stem: 'When Michael asks who the godfather is, what is he told?',
      choices: ['A friend of theirs, Seth', 'A relative of theirs, Seth', 'Someone from the office'], a: 0,
      cue: '「So who is」への答えの最初。',
      line: '*Our friend Seth.* And his wife there.',
      said: '「友だちのセス。あそこにいる奥さんと一緒に」と答える。',
      mean: 'our friend ＝ 夫婦の友人。代父母を友人夫婦が務める。',
      trap: '家族の席の話が続いたので親戚と取りやすい。最初の our friend を聞く。',
      use: 'This is our friend Mark.（友だちのマークです）' },

    // why: kindergarten ← the last word of Michael's question; office ← where everyone else there comes from
    { id: 'd4', skill: 'detail', level: 'B2', point: 'mommy', seg: [126.2, 133.7],
      stem: 'Asked if Seth is an old friend, how does the answer say they met?',
      choices: ['Through his wife, at a class for moms and kids', 'Through Seth, back in kindergarten',
                'Through his wife, at work in the office'], a: 0,
      cue: 'No のあと、met his wife に続く部分。',
      line: 'No. I *met his wife*… *Mommy and Me*.',
      said: '「いいえ。奥さんとは親子教室で知り合ったの」と答える。',
      mean: 'Mommy and Me ＝ 母親と赤ちゃんの教室。最近できた、ママ友のつながり。',
      trap: '直前の kindergarten から子どもの頃の友だちと取りやすいが、答えは No から始まる。',
      use: 'We met at a yoga class.（ヨガ教室で知り合ったの）' },

    // why: school days ← "since kindergarten" heard as about Michael's own past; old enough ← old = 年齢, the
    //   literal reading
    // anchor: 126.7–129.9 s he pushes past "Old friend?" to "since kindergarten?" and gets "No."; 134.3–136.6 s he turns
    //   down meeting them with "No. I have plenty of friends, so…": the question was about rank, not history
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'oldfriend', reveals: ['plenty'], seg: [126.2, 136.9],
      stem: 'When Michael asks “Old friend?”, what is he trying not to say?',
      choices: ['That he hopes Seth isn’t closer to them than he is', 'That he thinks he knows Seth from school days',
                'That he doubts Seth is old enough for the role'], a: 0,
      cue: 'kindergarten まで出して確かめる、その聞き方。',
      line: '*Old friend?* Like, you know, *since kindergarten?* — No.',
      said: '「古い友だち？幼稚園からとか？」と聞き、「いいえ」と返される。',
      mean: '長い付き合いなら負けても仕方ない、と確かめたい。違うと分かると、すぐ「友だちは十分いる」とすねる。',
      trap: 'old を年齢、kindergarten を自分の過去と取りやすい。比べているのは、二人との近さ。',
      use: 'So, have you two known each other long?（二人は長い付き合いなの？）' },

    // why: warmly ← "meet them later" is a friendly offer, and "friends" is a warm word; busy ← a "No" to an invitation
    //   read as a polite excuse
    { id: 't1', skill: 'attitude', level: 'C1', point: 'plenty', seg: [126.2, 137.3],
      stem: 'When invited to meet Seth and his wife later, how does Michael answer?',
      choices: ['Stiffly, as if his pride is hurt', 'Warmly, glad to make new friends', 'Politely, since he is busy today'],
      a: 0,
      cue: 'No のあと、friends で終わる一言と最後の so。',
      line: 'You should meet them later. — *No. I have plenty of friends, so…*',
      said: '「あとで二人に会うといい」と言われ、「いや。友だちは十分いるから」と言う。',
      mean: '誘いを断り「友だちは足りてる」と言うのは、すねている証拠。',
      trap: '丁寧な断りに聞こえやすいが、理由が「友だちが多い」なのは不自然。理由の中身で測る。',
      use: 'No thanks, I’m good.（いや、いいよ）' },

    // why: the truth ← the words taken at face value; still the mob boss ← the voice joke from earlier in the scene
    // anchor: 134.3–136.6 s "No. I have plenty of friends, so…" in the scene; 150.1–153.8 s to camera "but her parents
    //   are kind of boxing me out": the to-camera line names the hurt
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'plenty', reveals: ['boxing'], seg: [133.8, 154.3],
      stem: 'After the comment to the camera, how should we hear “I have plenty of friends”?',
      choices: ['As hurt pride: he feels shut out by them', 'As the truth: he really doesn’t need more friends',
                'As a joke: he’s still playing the mob boss'], a: 0,
      cue: '席の場面と、カメラへの最後の一言を比べて。',
      line: 'No. I have *plenty of friends*, so… … her parents are kind of *boxing me out*.',
      said: '会うのを断って「友だちは十分いる」と言い、あとでカメラに「親たちに締め出されてる」と話す。',
      mean: 'カメラへの本音が場面を書きかえる。強がりに見えた一言は、外されて傷ついた気持ちの裏返し。',
      trap: '場面の口調だけで決めない。この形式では、カメラへの一言が答え合わせになる。',
      use: 'I’m fine. Totally fine.（平気。ぜんぜん平気）' },

    // why: packing ← box = 箱に詰める; fights ← boxing = ボクシング
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'boxing', seg: [150.6, 154.4],
      stem: 'In the comment to the camera, what does he say Cece’s parents are doing?',
      choices: ['Keeping him away from the baby', 'Packing his things to send him off', 'Picking fights with him at work'],
      a: 0,
      cue: 'her parents のあと、out で終わる言い方。',
      line: 'But her parents are kind of *boxing me out*.',
      said: '「でも、あの子の親たちに、ちょっと締め出されてる」と話す。',
      mean: 'box out ＝ バスケで相手を体で押し出す動き。そこから「近づけないようにする」。',
      trap: 'box を「箱に詰める」や「ボクシング」と文字通りに取りやすい。out が付くと「締め出す」。',
      use: 'I feel boxed out of the planning.（計画から外されてる気がする）' },

    // why: weeks ← -ths and -ks both end softly; six months, a year ← a school build sounds like a long project
    { id: 'n1', skill: 'number', level: 'B1', point: 'months', seg: [176.3, 182.2], keep: true,
      stem: 'How long will the young adult group be away?',
      choices: ['Three weeks', 'Three months', 'Six months', 'A year'], a: 1,
      cue: 'leaving for のあと。',
      line: 'They’re leaving for *three months* to build a school…',
      said: '「若者の会が3か月、学校を建てに出発する」と牧師が話す。',
      mean: 'leaving for ＋期間 ＝ 〜の間、出かける。',
      trap: 'three はすぐ分かっても、months と weeks を聞き分けたい。最後の「ンス」の音。',
      use: 'I’m leaving for two weeks.（2週間留守にします）' },
  ]
};
