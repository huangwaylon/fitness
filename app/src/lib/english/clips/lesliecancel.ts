// “Leslie gets cancelled ft. Kathryn Hahn | Parks And Rec” (the official Parks and Recreation channel, Season 4):
// on TV, Leslie calls Nick Newport a jerk without knowing he died that day; Jen calls on her to cancel her campaign
// events, and Leslie's team meeting decides whether to keep going.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 154.8 s (whisper invents a sign-off
// after it). The captions garble names ("sweds" for Sweetums, "pawy" for Pawnee, "an"/"ant" for Ann); whisper has them,
// and Ann is settled by "disagree with Ann" (123.4 s) and "Ann, there is nothing harder…" (143.4 s). Untested on
// purpose: 48.6–53.2 s ("Get on your feet… This isn't the time": the t-shirt cannons are visual, and the captions
// drop half of it), 76–80 s (an insult image), 88–103 s (who says "you called the dead man a jerk"; the list ends on
// mistresses), 111.5 s (an aside about Ben's body), 137–140 s (the panini aside, speaker unclear), 154.8 s ("sked" vs
// "sketch").
// REVIEW 2026-11-16: pass 9, fix 13, drop 0, new 0; ear checks 0
// (The three authored ear checks, s1/x1/s2, came off: whisper and the captions agree on every key word.)
import type { Clip } from '../types.ts';

export const leslieCancelled: Clip = {
  id: 'lesliecancel', video: 'JDebCHrNrdo', title: 'Leslie gets cancelled ft. Kathryn Hahn', dur: 175, wpm: 153,
  band: 'slow', tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: clean it up ← a promise about a river heard as a clean-up; shut the factory ← "Sweetums" (a company) and
    //   "stop" heard as closing it down
    { id: 'd1', skill: 'detail', level: 'B1', point: 'promise', seg: [0, 9.6],
      stem: 'What did Leslie promise to do if elected?',
      choices: ['Stop companies from polluting the river', 'Clean up the river by the next election',
                'Shut down the Sweetums candy factory'], a: 0,
      cue: '「if elected」のあとの約束。',
      line: 'I promise to stop the Newports and … from *blatantly dumping contaminants into the* … River.',
      said: '「当選したら、川に汚染物質を捨てさせない」と約束する。',
      mean: 'dump ＝ 捨てる、contaminants ＝ 汚染物質。工場の汚染をやめさせる公約。',
      trap: '川の話なので「きれいにする」と取りやすい。stop ～ from -ing ＝ ～させない。',
      use: 'Can you stop the dog from barking?（犬が吠えないようにしてくれる？）' },

    // R fix: V2 (blind 85 %): the only "twist" choice was the key; all three now share "only to learn…"
    // why: about his son ← "Sorry, I meant" heard as a who-mix-up, and "his son" is in her answer; stopped backing
    //   his son ← "buy this election for his son" plus a correction, heard as news about the father's support
    { id: 'g1', skill: 'gist', level: 'B2', point: 'died', seg: [8.2, 45.2],
      stem: 'What goes wrong for Leslie in the TV interview?',
      choices: ['She slams Nick, only to learn he died earlier that day',
                'She slams Nick, only to learn the question was about his son',
                'She slams Nick, only to learn he just stopped backing his son'], a: 0,
      cue: '記者の「Sorry, I meant」のあと。',
      said: '記者に父親のことを聞かれ、レスリーは厳しく批判する。実は彼はその日に亡くなっていた。',
      mean: '質問の意味を取りちがえ、亡くなったばかりの人を攻撃してしまった。騒ぎの始まり。',
      trap: 'Newport が二人出るので人ちがいと取りやすい。決め手は記者の言い直し。',
      use: 'Sorry, I meant the other one.（ごめん、もう一つの方のこと）' },

    // R fix: V2 (blind 80 %): the distractors were unrelated plots; all three are now "use his money to…"
    // why: for himself ← "for his son" lost at the end of a fast turn; get his son out ← "buy" + "his son" in the
    //   wrong relation (paying the son off)
    { id: 'd2', skill: 'detail', level: 'B1', point: 'buy', seg: [13.3, 22.65],
      stem: 'What did Leslie say Nick Newport was trying to do?',
      choices: ['Use his money to win the race for his son', 'Use his money to win the race for himself',
                'Use his money to get his son out of the race'], a: 0,
      cue: '「if he thinks he can」のあと。',
      line: 'if he thinks he can *buy this election for his son*, he’s wrong.',
      said: '「息子のために選挙を金で買えると思っているなら、大まちがい」と言う。',
      mean: 'buy an election ＝ お金の力で選挙に勝つ。',
      trap: '文末の for his son を落とすと本人が出るように聞こえる。誰のためかは for のあとで決まる。',
      use: 'You can’t buy happiness.（幸せはお金で買えない）' },

    // R fix: V2 (blind 65 %): "calm" and "annoyed" were off-scene; the distractors are now a sincere tribute and a
    //   quick retraction
    // why: heartfelt tribute ← "Sad." heard as a complete, sincere statement (the reporter even asks if it's
    //   "official"); takes it back ← the usual script after a gaffe
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'sad', reveals: ['died'], seg: [27.3, 37],
      stem: 'How did Leslie react to the reporter’s correction?',
      choices: ['Thrown, she can barely put words together', 'Moved, she gives a short, heartfelt tribute',
                'Guilty, she quickly takes back what she said'], a: 0,
      cue: '返事の語数と、とぎれ方。',
      line: 'He died? — I… *Sad*.',
      said: '亡くなったと聞き、「死んだの？」「私…悲しい」としか言えない。',
      mean: '文にならない返事は、動揺して言葉が出ないしるし。記者が「I sad?」とくり返すほど。',
      trap: '一語の返事を、心のこもった短い追悼と取りやすい。語がとぎれたら、まず動揺を疑う。',
      use: 'Sorry, I’m at a loss for words.（ごめん、言葉が出ない）' },

    // why: glad he's gone ← "bummer" is about bad luck, but a light word after a death can sound pleased; still not a
    //   sentence ← the "I sad" joke just before, expected to repeat
    { id: 'h1', skill: 'humor', level: 'C1', point: 'bummer', seg: [33.8, 45.2],
      stem: 'Why did her second try at an official statement get a laugh?',
      choices: ['It’s far too casual for news of a death', 'It sounds as if she’s glad he’s gone',
                'It’s still not a proper, full sentence'], a: 0,
      cue: '「official statement」のあとの語の軽さ。',
      line: 'My *official statement* is, that is *overall a bummer*.',
      said: '「公式コメントは？」と聞かれ、「全体として、がっかりな話です」と言い直す。',
      mean: 'bummer は「ついてない」のくだけた語。公式の場で人の死に使うには軽すぎる。',
      trap: '喜んでいるとは言っていない。改まった前置きと、軽い中身の差が笑い。',
      use: 'Rain on our day off? What a bummer.（休みに雨？ついてないね）' },

    // R fix: V2 (blind 70 %): "would" didn't fit the contrast; "did" (same d-, emphatic, past) replaces it
    // why: doesn't ← "Harsh words, but" sets up a contrast, and -n't hides easily in a weak syllable; did ← the
    //   emphatic d- is caught and the ending lost, and the rally was in the past
    { id: 's1', skill: 'sound', level: 'B2', point: 'cannons', seg: [56, 61.95],
      stem: 'Fill the gap: “Harsh words, but this reporter ___ love those t-shirt cannons.”',
      choices: ['does', 'doesn’t', 'did'], a: 0,
      cue: '「this reporter」のすぐあと、強い一語。',
      line: 'Harsh words, but this reporter *does* love those t-shirt cannons.',
      said: '司会者が「きつい言葉だ。でも、あのTシャツ大砲は本当に好きだ」と言う。',
      mean: 'does は強調の do で、love を強めている。',
      trap: 'but のあとなので否定を予想しやすい。強調の does は強く長く、doesn’t の「ン」はない。',
      use: 'I do love a good burger.（いいハンバーガー、ほんと好き）' },

    // R fix: V2 (blind 75 %, K6): the key was the only "but" (the mixed view); a second "but" choice now
    // why: harsh and silly ← "Harsh words" heard as his verdict on everything; fair but silly ← "frankly" (the clip
    //   he plays) heard as his own approval of her honesty, and "t-shirt cannons" as mockery
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'cannons', seg: [56, 61.95],
      stem: 'What is the host’s take on the clip of Leslie he just played?',
      choices: ['He finds her words harsh, but the rally fun', 'He finds her words harsh, and the rally silly',
                'He finds her words fair, but the rally silly'], a: 0,
      cue: '「but」の前と後。',
      line: 'Harsh words, *but* this reporter does love those t-shirt cannons.',
      said: '「最低な男だ」の映像のあと、司会者は「きつい言葉だが、Tシャツ大砲はいい」と言う。',
      mean: '発言には眉をひそめつつ、演出は楽しんでいる。ニュースを軽く扱う司会者らしさ。',
      trap: 'harsh で全体を否定したと取りやすい。but のあとに本音が来る。',
      use: 'Pricey, but it’s worth it.（高いけど、その価値はある）' },

    // why: apologize ← "out of respect for the Newport family" heard as the demand itself; drop out ← "cancel" and
    //   the title ("gets cancelled") heard as quitting the race
    { id: 'd3', skill: 'detail', level: 'B1', point: 'cancel', seg: [61.95, 72.5],
      stem: 'What did Jen call on Leslie to do?',
      choices: ['Cancel all her campaign events', 'Apologize to the Newport family', 'Drop out of the race for good'],
      a: 0,
      cue: '「calling on Leslie Knope to」のあと。',
      line: 'I am calling on Leslie Knope *to cancel all of her campaign events* out of respect for the Newport family.',
      said: 'ジェンが「遺族への敬意として、選挙活動をすべて中止すべき」と求める。',
      mean: '予定の活動を取りやめること。選挙から降りろ、とまでは言っていない。',
      trap: 'タイトルの cancelled から「撤退」と取りやすい。目的語 events まで聞く。',
      use: 'We had to cancel all our plans.（予定を全部キャンセルしたよ）' },

    // anchor: 64.1–72.2 s "This is not a time for politics. I am calling on Leslie Knope to cancel all of her
    //   campaign events": the "no politics" line leads straight into a demand aimed at one candidate only
    // R fix: V2 (blind 80 %): the key was the only cynical reading; a second one (a dodge) is now a near miss
    // why: both sides ← "not a time for politics" heard as a general truce (the sincere reading); a dodge ← she is
    //   answering the host's question, so "not a time" is heard as declining to answer it
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'cancel', seg: [61.95, 72.5],
      stem: 'How should we hear Jen’s “This is not a time for politics”?',
      choices: ['As a political attack that sounds like respect', 'As a sincere call for both sides to pause',
                'As a dodge of the host’s question about Leslie'], a: 0,
      cue: 'そのすぐあと、誰に何を求めているか。',
      line: 'This is *not a time for politics*. I am calling on *Leslie Knope* to cancel all of her campaign events…',
      said: '「今は政治の時ではない」と言ってすぐ、「レスリーは選挙活動をすべて中止すべき」と求める。',
      mean: '政治を休もうと言いながら、相手候補だけに活動中止を求めている。その要求自体が政治的な一手。',
      trap: '言葉どおり休戦の呼びかけと取りやすい。名指しは一人だけ。誰に向けた要求かで、ねらいを聞く。',
      use: 'Now’s not the time. Let’s talk later.（今はその時じゃない、あとで話そう）' },

    // why: 88 ← eighty and ninety share the -ty ending; 99 ← "ninety" heard clearly, and "eight years" blurs toward
    //   "nine"
    { id: 'n1', skill: 'number', level: 'B1', point: 'age', seg: [87.3, 92.92], keep: true,
      stem: 'How old was the man who died?',
      choices: ['88', '98', '99'], a: 1,
      cue: '「that man is」のあとの数。',
      line: 'that man is *98 years old* and he’s an awful man.',
      said: '「でもその人は98歳で、ひどい男だった」と言う。',
      mean: 'ninety-eight ＝ 98。高齢でひどい人、だから悲しみすぎなくていい、という理屈。',
      trap: 'eighty と ninety は後ろが同じ -ty。最初の音（エイ／ナイ）で聞き分ける。',
      use: 'My grandma just turned ninety.（祖母がちょうど90歳になった）' },

    // R fix: V2 (blind 55 %): the key alone ended "to stop"; the first two choices now mirror each other
    // why: going on ← "too high" heard as risk (stake ＝ 危険); too close ← "high stakes" heard as a tense, even race
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'lose', seg: [103.35, 110.88],
      stem: 'When Ben weighed it up, what did he say about the race?',
      choices: ['Stopping now would cost them too much', 'Going on now would cost them too much',
                'The race is now too close to call'], a: 0,
      cue: '「unfortunate, but」のあと。',
      line: 'it’s unfortunate, but *the stakes are too high*. We can’t just stop campaigning.',
      said: 'ベンが「気の毒だけど、かかっているものが大きすぎる」と言う。',
      mean: 'stakes ＝ 賭けているもの。too high ＝ 負けたら失うものが大きすぎる。',
      trap: 'high を「危険が高い」と取りやすい。直後の can’t stop で向きを確かめる。',
      use: 'The stakes are high tonight.（今夜は負けられない）' },

    // R fix: V2 (blind 70 %): the key was the only two-part answer; all three now have a "but"
    // why: after saying sorry ← "keep campaigning" + Ann's "until you apologize to Bobby" merged; stop until sorry ←
    //   Ann's proposal, and the title's "cancelled"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'call', seg: [103.35, 155.1],
      stem: 'After hearing everyone, what did Leslie decide?',
      choices: ['To keep going, but in a more low-key way', 'To keep going, but only once she says sorry to Bobby',
                'To stop for now, but just until she says sorry'], a: 0,
      cue: '最後の「But we’re going to」のあと。',
      line: 'We’re going to keep campaigning, okay? *But* we’re going to do it in a *classy and respectful way*…',
      said: 'アンはやめる派、ほかは続ける派。レスリーは「続ける。でも品よく」と決める。',
      mean: '続けるか止めるかに、「続けるが、やり方を変える」と答えた。',
      trap: 'keep campaigning だけだと「今までどおり」と取りやすい。But のあとまでが答え。',
      use: 'Let’s keep going, but slow down.（続けよう、でもペースは落として）' },

    // R fix: V2 (blind 70 %): the choices are now parallel ("It takes her refusal to play as…"); the segment runs
    //   on to "I think you should stop", which refutes the "vote for Ben" reading
    // why: a threat ← "beat him" heard as hitting (殴る), the literal reading; a vote for Ben ← "I'm not going to
    //   beat him" heard as giving in to his answer
    { id: 'h2', skill: 'humor', level: 'C1', point: 'attitude', reveals: ['annview'], seg: [110.9, 118.3],
      stem: 'Why did the quick comeback to “I’m not going to beat him” get a laugh?',
      choices: ['It takes her refusal to play as low confidence', 'It takes her refusal to play as a threat to Ben',
                'It takes her refusal to play as a vote for Ben'], a: 0,
      cue: '短い返しが、ふつうはどんな場面で使われるか。',
      line: 'try to beat what he said. — I’m not going to beat him. — *Not with that attitude*.',
      said: '「彼に勝つ気はない」と言うアンに、「その態度じゃね」と返る。',
      mean: '弱気な人を励ます決まり文句。アンは反対だと言っているのに、やる気の問題にすり替えている。',
      trap: 'beat を「殴る」と取るとずれる。決まり文句は、場面とのずれで笑いになる。',
      use: 'Not with that attitude!（そんな弱気じゃ無理だよ）' },

    // why: Ben ← the first to speak, and "what do we do?" makes him the one with doubts; April ← she answers right
    //   after the "stop" idea; Andy ← "If… if the guy…" starts like a no
    { id: 'w1', skill: 'who', level: 'B2', point: 'annview', seg: [110.9, 124.13],
      stem: 'In the meeting, who thinks Leslie should stop campaigning for now?',
      choices: ['Ann', 'Ben', 'April', 'Andy'], a: 0,
      cue: 'すぐあとのエイプリルの返事に出る名前。',
      line: 'I think you should stop… — I wasn’t listening, but I strongly disagree with *Ann*.',
      said: '一人が「やめるべき」と言い、エイプリルが「聞いてなかったけど、アンには反対」と続ける。',
      mean: 'エイプリルの一言で、「やめるべき」と言ったのがアンだと分かる。ベンとアンディは続ける派。',
      trap: '名前を聞く問題は、声だけでなく、あとで誰の名前が出るかで確かめる。',
      use: 'I’m with Ann on this one.（これはアンに賛成）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'attitude', seg: [113.55, 116.35],
      stem: 'Type the quick comeback to “I’m not going to beat him”. (4 words)', answer: 'not with that attitude',
      cue: '「beat him」のすぐあと。',
      line: 'I’m not going to beat him. — *Not with that attitude*.',
      said: '「勝つ気はない」に、すぐ「その態度じゃね」と返す。',
      mean: 'with that が「ウィザッ」と一つにつながる。th が二つ続く所は一回に聞こえる。',
      trap: 'つながった音で that を落としやすい。語数を数えて確かめる。',
      use: 'Not with that haircut.（その髪型じゃね）' },

    // why: on TV ← she said it on TV, so a TV apology seems to fit; a note ← the usual condolence script
    { id: 'd4', skill: 'detail', level: 'B1', point: 'apologize', reveals: ['annview'], seg: [116.1, 120.45],
      stem: 'What did Ann want Leslie to do before campaigning again?',
      choices: ['Apologize to Bobby face to face', 'Apologize to Bobby on TV', 'Send Bobby a note of sympathy'],
      a: 0,
      cue: '「At least until」のあと、文の最後。',
      line: 'At least until you apologize to Bobby *in person*.',
      said: '「やめるべき。少なくとも、ボビーに直接謝るまでは」と言う。',
      mean: 'in person ＝ 本人に会って、直接。電話や手紙ではなく。',
      trap: 'テレビでの発言なので「テレビで謝る」と取りやすい。文の最後の in person で決まる。',
      use: 'I’d like to thank you in person.（直接お礼が言いたい）' },

    // why: was ← the -n't of "wasn't" shrinks to a short nasal; am ← "I am listening, but…" is the polite meeting
    //   phrase
    // R fix: V2 (blind 65 %): "but I strongly disagree" in the stem made "wasn't" the logical pick; the stem now
    //   stops at "listening…", so only the sound decides
    { id: 's2', skill: 'sound', level: 'B2', point: 'listen', reveals: ['annview'], seg: [120.35, 124.13],
      stem: 'Fill the gap: “April? — I ___ listening…”',
      choices: ['wasn’t', 'was', 'am'], a: 0,
      cue: '「I」のすぐあと、短い一語の終わり。',
      line: 'April? — I *wasn’t* listening, but I strongly disagree with Ann.',
      said: 'エイプリルが「聞いてなかったけど、アンには強く反対」と答える。',
      mean: 'wasn’t の t はほぼ消え、「ワズン」と短い。was には「ン」がない。',
      trap: 't が聞こえず was を選びやすい。最後の「ン」の有無と、but のつながりで聞く。',
      use: 'Sorry, I wasn’t listening.（ごめん、聞いてなかった）' },

    // R fix: V2 (blind 55 %): the choices are now parallel ("She has… view"), so the paradox isn't the odd one out
    // why: no view ← "wasn't listening" caught and "but I strongly disagree" lost; Andy's point ← "Andy?" follows at
    //   once (the captions even run them together as "an Andy")
    { id: 'h3', skill: 'humor', level: 'C1', point: 'listen', reveals: ['annview'], seg: [120.35, 124.13],
      stem: 'Why did April’s answer get a laugh?',
      choices: ['She has a strong view on what she didn’t hear', 'She has no view, since she didn’t hear it',
                'She has a strong view, but on Andy’s point'], a: 0,
      cue: '文の前半と後半の食い違い。',
      line: 'I *wasn’t listening*, but I *strongly disagree* with Ann.',
      said: 'エイプリルが「聞いてなかったけど、アンには強く反対」と答える。',
      mean: '中身を聞かずに反対を決めている。理由ではなく、アンに反対すること自体が目的。',
      trap: 'すぐ Andy? が続くので、アンディの話と混ざりやすい。but の前後が食い違うと笑いになる。',
      use: 'I didn’t read it, but I love it.（読んでないけど、最高）' },

    // R fix: V2 (blind 50 %): the distractors are now reasons said in the scene by others (Leslie's list, sunk
    //   effort); the cue no longer names "stop", the word the key turns on
    // why: the man being awful ← Leslie's list just before ("an awful man… he polluted this town"); hard work ← the
    //   usual "we've come this far" script of a campaign meeting
    { id: 'i1', skill: 'infer', level: 'C1', point: 'death', seg: [124.15, 136.9],
      stem: 'What is odd about Andy’s reasons for keeping going?',
      choices: ['They mostly say again that stopping is bad', 'They mostly rest on the dead man being awful',
                'They mostly rest on the team’s hard work so far'], a: 0,
      cue: '同じ語が何度出てくるか。',
      line: 'if the campaign stops, *we all stop*. And *stopping is certain death*.',
      said: '「最悪なのはやめること。選挙が止まればみんな止まる。止まるのは確実な死」と言う。',
      mean: '理由を足しているようで、「やめるのはだめ」を大げさに言い直しているだけ。',
      trap: '力強い言い方なので、根拠があるように聞こえる。同じ語のくり返しは、中身の薄さのサイン。',
      use: 'Quitting is not an option.（やめるという選択はない）' },

    // R fix: V2 (blind 60 %): all three now point at what comes next (a no, a yes, a mocking no)
    // why: a yes ← the Japanese frame: a warm compliment heard as the lead-in to agreeing; mocks ← "beautiful face"
    //   heard as sarcasm right before turning her down
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'no', reveals: ['call'], seg: [140.6, 149.7],
      stem: 'When Leslie gave her call, what did the line about Ann’s face do?',
      choices: ['It softens the no that comes next', 'It leads up to a yes to Ann’s idea',
                'It mocks Ann just before saying no'], a: 0,
      cue: 'ほめ言葉のあとの「But」。',
      line: 'there is nothing harder… than *saying no to your beautiful face*. *But I’m going to*. No.',
      said: '「あなたの美しい顔にノーと言うほど難しいことはない。でも言う。ノー」と答える。',
      mean: '大げさなほめ言葉で、断りのショックを和らげている。but のあとが本題。',
      trap: '温かい前置きは「はい」の前ぶれに聞こえやすい。英語では断りの前に置くことが多い。',
      use: 'I hate to say no, but I must.（断りたくないけど、断るね）' },

    // why: out of respect ← Jen's "out of respect for the Newport family" earlier, and "respectful" in the same line;
    //   wins votes ← Ben's "the stakes are too high" heard as the reason for the new style
    { id: 'i2', skill: 'infer', level: 'B2', point: 'backs', seg: [149.7, 154.05],
      stem: 'Why did Leslie say they’d campaign in a classy, respectful way?',
      choices: ['Mostly so that Ann will stop pushing her', 'Mostly out of respect for the Newports',
                'Mostly because Ben says it wins votes'], a: 0,
      cue: '文の最後、「to get」のあと。',
      line: 'in a classy and respectful way *to get Ann off of our backs*.',
      said: '「品よく、敬意をもって。アンにうるさく言われないように」と言う。',
      mean: 'get ～ off one’s back ＝ 文句を言わせない。品のよさはアン対策という本音。',
      trap: 'respectful から「遺族への敬意」と取りやすい。目的は to のあと。',
      use: 'Call her to get her off your back.（電話しときなよ、うるさく言われないように）' },

    // anchor: 152.7–153.8 s both sources have "off of our backs": "off of" where grammar wants "off", at ≈ 300 wpm
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'backs', seg: [149.7, 154.05],
      stem: 'Type the end: “…to get Ann ___.” (4 words)', answer: 'off of our backs',
      cue: '「get Ann」のあと。文法より、聞こえた音を。',
      line: '…in a classy and respectful way to get Ann *off of our backs*.',
      said: '「アンにうるさく言われないように」と付け足す。4語がひと続きで、とても速い。',
      mean: 'off one’s back に of が付いた形。文法書では off だけだが、アメリカの会話ではよく言う。',
      trap: '習った形に合わせて of を消したくなる。聞こえた音を書く。of は「ア」程度に弱い。',
      use: 'Get off of my case!（ほっといてよ）' },
  ]
};
