// REVIEW 2026-11-16: pass 5, fix 15, drop 1, new 0; ear checks 0
// “Parks and Recreation | Pilot (Episode Highlight)” (the official Parks and Recreation channel, Season 1): Tom dodges a
// gift rule on the phone, then he and Leslie brainstorm how to get her park built, and land on bringing in Mark.
// Segments from the captions, words from whisper (2026-11-16). Whisper's word times run up to 2 s early (78–100 s);
// the segments follow the captions. Talk ends at ≈ 114 s; whisper's repeated "He's a smart, capable guy" after that is
// a hallucination. Untested: "I think he's a Libyan" and "I'm what you might call a redneck" (37–43 s; the joke turns
// on ethnicity). No predict item (no clean pause where both sources agree). No who item: in a mockumentary, the
// speaker is mostly told by the face.
// EAR CHECK: none (every key's words agree in both sources; i4, the only speaker-dependent item, is dropped)
import type { Clip } from '../types.ts';

export const parkspilot: Clip = {
  id: 'parkspilot', video: 'JbsBDzQ3NoE', title: 'Pilot (Episode Highlight)', dur: 125, wpm: 171, band: 'mid',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2/K5 (blind 55 %): the key was the only "who" among "how"s, with the nuanced "real pull"; all three are now
    //   "How to get…"
    // why: council ← Tom's first idea ("put up the money"), said and turned down; mayor ← the opening call and
    //   "Mr. Mayor" stay in the ear
    { id: 'g1', skill: 'gist', level: 'B2', point: 'park', reveals: ['firepower', 'outcome'], seg: [0, 90.6],
      stem: 'What is the brainstorm in this scene really about?',
      choices: ['How to get more clout behind the park', 'How to get the council to pay for the park',
                'How to get the mayor to back the park'], a: 0,
      cue: '「brainstorm」のあと、議会案への返事。',
      said: 'どうやって公園を実現する？と問い、議会案を退けて「もっと力が要る」と言う。',
      mean: '話の中心は、公園計画を動かせる影響力をどう集めるか。',
      trap: '冒頭の市長や中盤の money が耳に残るが、求めているのは味方の力。',
      use: 'How do we make this happen?（どうやって実現する？）' },

    // R fix: V2 (blind 70 %): the key echoed "report" and the card distractor was weak; now a delivery reading
    // why: check fit ← "if they don't fit her" heard as the reason; deliver ← "give my wife a call" read as arranging
    //   delivery
    { id: 'i1', skill: 'infer', level: 'C1', point: 'suits', reveals: ['amount'], seg: [0, 15.0],
      stem: 'On the phone, why does Tom ask for the suits to go to his wife?',
      choices: ['So the gift won’t be on his record', 'So she can check first that they fit',
                'So the shop can deliver them to his home'], a: 0,
      cue: '「problem is」のあとの決まりの話。',
      line: 'anything over *$25 has a report*. So… give my wife a call and *give her the suits*.',
      said: '25ドルを超えると報告が要る。だから妻に電話して、スーツを渡して、と頼む。',
      mean: '自分あての贈り物を妻経由にして、報告の決まりをすり抜けようとしている。',
      trap: 'fit her や call から、サイズ確認や配達に思える。problem is が理由。',
      use: 'The problem is, it’s over the limit.（問題は、上限を超えてることで）' },

    // why: $20 ← "twenty" caught, "-five" lost; $35 ← twenty/thirty blur when fast; $250 ← "twenty-five" and
    //   "two-fifty" share most of their sounds
    // R fix: N7: the stem quotes "has a report", the rule i1 turns on, so it reveals `suits`
    { id: 'n1', skill: 'number', level: 'B1', point: 'amount', reveals: ['suits'], seg: [2.45, 6.5],
      stem: 'On the phone, anything over what amount “has a report”?',
      choices: ['$20', '$25', '$35', '$250'], a: 1, keep: true,
      cue: '「anything over」のすぐあと。', line: 'anything over *$25* has a report.',
      said: '「25ドルを超えるものは、全部報告が要るんだ」と言う。',
      mean: '受け取ってよい贈り物の上限の話。それを超えると記録に残る。',
      trap: 'twenty-five と two-fifty は音が近い。数字の切れ目とリズムで聞き分ける。',
      use: 'Anything over fifty needs approval.（50を超えるものは承認が要る）' },

    // why: give him ← 'em sounds like "him" with the h dropped; give it ← the word is so short it's taken as the
    //   shortest pronoun
    { id: 's1', skill: 'sound', level: 'B2', point: 'em', seg: [11.0, 15.0],
      stem: 'Fill the gap: “Maybe she’ll ___ to me.”',
      choices: ['give them', 'give him', 'give it'], a: 0,
      cue: '「she’ll give」のあと、とても弱い一音。', line: 'And then if they don’t fit her, maybe she’ll *give ’em* to me.',
      said: '合わなかったら妻が自分にくれるかも、と付け足す。',
      mean: 'them が弱まって「エム」になる。they don’t fit の they と同じスーツのこと。',
      trap: '’em は h のない him と同じ音に聞こえやすい。前に出た複数のものを指すか確かめる。',
      use: 'Just leave ’em by the door.（ドアのところに置いといて）' },

    // why: golf ← the usual "deal-making with the mayor" script; football ← "game" heard, "Frisbee" lost
    { id: 'd1', skill: 'detail', level: 'B1', point: 'saturday', seg: [15.0, 24.6],
      stem: 'What will Tom see the mayor at on Saturday?',
      choices: ['A Frisbee game', 'A golf game', 'A football game'], a: 0,
      cue: '「Saturday for the」のあと。', line: 'I’ll see you on Saturday for the, uh, *Ultimate Frisbee game*.',
      said: '「では市長、土曜のアルティメット・フリスビーの試合で」と言って電話を切る。',
      mean: '市長と休みの日に遊ぶ仲だと、周りに見せている。',
      trap: 'game だけ聞こえると、定番のスポーツを当てはめやすい。for the のあとの語を聞く。',
      use: 'See you Saturday for the game.（土曜の試合で会おう）' },

    // R fix: V2 (blind 60 %): "a serious problem" was weak; now "arguing", from rap as a scolding (a rap on the knuckles)
    // why: music ← rapping taken as ラップ; arguing ← "rap" known as a blow or a scolding
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'rapping', seg: [26.0, 31.0],
      stem: 'When Leslie asks about the mayor, what does Tom say they were doing?',
      choices: ['Just chatting about this and that', 'Just making some music together',
                'Just arguing over a few issues'], a: 0,
      cue: '「we’re just」のあとの動詞。', line: 'Yep, we’re just *rapping about some things*.',
      said: '「市長と話してたの？」に「うん、ちょっとあれこれ話してただけ」と返す。',
      mean: 'rap ＝ 気軽にしゃべる、の古いくだけた言い方。市長と親しいふりをしている。',
      trap: 'rapping をラップや「たたく」と取りやすい。just … about なら気軽な話。',
      use: 'We were just catching up.（ちょっと近況を話してただけ）' },

    // R fix: K6/V2 (blind 55 %): the key was the only choice without "both"; all three are "They…both" now
    // why: out in the open ← outsiders read literally, and they work in parks; dislike the town ← outsider read as a
    //   rebel against the system
    { id: 'i3', skill: 'infer', level: 'B2', point: 'outsiders', seg: [30.75, 36.9],
      stem: 'When Leslie explains why she and Tom work well, what does she claim?',
      choices: ['They’re both unlike the usual officials', 'They both like to work out in the open',
                'They both dislike how the town is run'], a: 0,
      cue: '「work really well together」のあとの説明。', line: 'We’re both *outsiders*. I’m a woman, he’s a…',
      said: '「トムと私は相性がいい。二人ともアウトサイダーなの。私は女で、彼は…」。',
      mean: '役所の中心にいる典型的な人たちとは違う、という意味で言っている。',
      trap: 'outside から「屋外」を連想しやすい。続く I’m a woman が何の説明か聞く。',
      use: 'We both feel like outsiders here.（二人ともここではよそ者みたい）' },

    // why: no money ← "put up the money" said just before; asked before ← the usual "we tried that" script
    { id: 'd2', skill: 'detail', level: 'B1', point: 'priority', seg: [43.3, 50.95],
      stem: 'Why does Leslie turn down going straight to the city council?',
      choices: ['Parks aren’t high on its list', 'It has no money left to give', 'She already asked it once before'], a: 0,
      cue: '「No,」のすぐあとの一文。', line: 'No, parks are *not a priority*.',
      said: '議会に直接お金を出してもらおう、という案に「だめ、公園は優先されてない」と返す。',
      mean: 'priority ＝ 優先事項。議会にとって公園は後回しだ、という判断。',
      trap: '直前の money が耳に残ると「お金がない」話に聞こえる。No のあとの理由を聞く。',
      use: 'It’s not really a priority right now.（今はあまり優先じゃない）' },

    // R fix: V2 (blind 75 %), S1: "Right after that" leaned on another item; the stem names the moment. "A budget" was
    //   defensible as firepower (K1); now a protest
    // why: tougher argument ← "guns" heard as aggressive talk; protest ← firepower and guns heard as a fight in the
    //   streets
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'firepower', seg: [46.35, 54.15],
      stem: 'After turning down the council idea, what does Leslie say she needs?',
      choices: ['More powerful people on her side', 'A tougher way to argue her case',
                'A bigger protest out in the streets'], a: 0,
      cue: '「I need」のあと、二つのたとえ。', line: 'I need more *firepower*. I need *bigger guns*.',
      said: '「もっと火力が要る。もっとでかい銃が要る」と言う。',
      mean: '武器ではなく、話を動かせる力や味方がほしい、というたとえ。',
      trap: '銃を「強い口調」や「抗議」と取りやすい。bigger guns は力のある人や手段のこと。',
      use: 'We need to bring in the big guns.（大物を呼ばないと）' },

    // why: heard her ← a tag question taken as "did you get that?"; she is right ← Right read literally as 正しい
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'right', seg: [54.0, 58.05],
      stem: 'After Leslie names her idea, what is her one-word follow-up doing?',
      choices: ['Asking Tom to back the idea', 'Checking that Tom heard her', 'Telling Tom that she is right'], a: 0,
      cue: '案を言ったあとの、上がり調子の一語。', line: 'Form a committee. *Right?* — Yeah, that could work.',
      said: '「委員会を作ればいい。でしょ？」と言い、トムが「うん、いけるかも」と返す。',
      mean: '文末の Right? は「そう思わない？」と同意を求める合図。',
      trap: 'right を「正しい」と取ると自慢に聞こえる。上がり調子なら相手への確認。',
      use: 'Let’s leave at eight, right?（8時に出よう、いいよね？）' },

    // R fix: V2 (blind 55 %): rebalanced to one form. V5: the self-praise is implicit (she praises her own line as if it
    //   were someone else's), so C1; this also keeps C1 at ≥ 20 % after the i4 drop
    // why: Tom ← "That's really good" is what people usually say about someone else's idea; poking fun ← the grand
    //   words read as self-mockery
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'proud', seg: [60.95, 73.4],
      stem: 'After the speech about committees, what does Leslie’s request show?',
      choices: ['She’s proud of the words she just used', 'She’s pleased with an idea Tom just gave',
                'She’s poking fun at her own big words'], a: 0,
      cue: '演説のすぐあと、短い二文。', line: 'That’s really good. *Write that down.*',
      said: '自分の演説のあとで「今のいいわね。書いておいて」とトムに頼む。',
      mean: '自分の言葉に満足している。あとで、名言を書き留めさせていると説明する。',
      trap: 'That’s really good は普通、人をほめる言葉。誰の言葉をほめているか聞く。',
      use: 'Ooh, that’s good. Write that down.（お、いいね。メモしといて）' },

    // why: speeches ← "eloquent saying" heard as speech material; town paper ← the usual "quote" script for officials
    // R fix: N7: the stem says she has her sayings written down, a3's point, so it reveals `proud`
    { id: 'd4', skill: 'detail', level: 'B1', point: 'memoirs', reveals: ['proud'], seg: [67.1, 73.4],
      stem: 'In her interview, why does Leslie have Tom write down her sayings?',
      choices: ['For her memoirs', 'For her speeches', 'For the town paper'], a: 0,
      cue: '「collected them」のあと、最後の名詞。', line: 'He’s collected them … my *memoirs*.',
      said: '「いい言葉を思いついたら、トムに書き留めさせているの」と説明する。',
      mean: 'memoirs ＝ 回想録。自分の人生を、いつか本にするつもりでいる。',
      trap: 'saying や phrase から「演説用」と考えやすい。最後の名詞まで聞き取る。',
      use: 'Let me write that down before I forget.（忘れる前に書いとく）' },

    // R fix: V2 (blind 75 %): "exactly right" and "about the park" were weak; now two ways the note could have gone wrong
    // why: dull ← "Sounded better when I said it" heard as the note losing her style; mixed up ← "quote from
    //   Wednesday" heard as an old saying
    { id: 'h1', skill: 'humor', level: 'C1', point: 'blood', seg: [73.4, 85.4],
      stem: 'Why does the audience laugh when Tom reads the quote?',
      choices: ['His note turns her line into something gory', 'His note makes her line sound flat and dull',
                'His note mixes up two of her old sayings'], a: 0,
      cue: '読み上げた一文の最後の語と、元の言葉。', line: 'Committees *cover our democracy with blood*.',
      said: 'トムのメモでは「委員会は民主主義を血でおおう」になっている。',
      mean: '元は「委員会は民主主義の血液だ」。言葉がずれて、急に物騒な話になる。',
      trap: 'メモの出来が悪いだけなら笑いは小さい。元の lifeblood と blood を聞き比べる。',
      use: 'That’s not quite what I said.（そうは言ってないんだけど）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'readback', seg: [76.6, 79.4],
      stem: 'Type what Leslie says: “Okay, ___.” (5 words)', answer: 'read it back to me',
      cue: '「Okay,」のあと、つながる5語。', line: 'Okay, *read it back to me*.',
      said: '「じゃあ、読み上げて」とトムに頼む。',
      mean: 'read it back ＝ 書いたものを読んで聞かせる。電話で注文を確かめるときにも使う。',
      trap: 'read it がつながって「リーディッ」、to me も弱く短い。5語あると知って聞く。',
      use: 'Could you read that back to me?（復唱してもらえますか）' },

    // R fix: K6/V2 (blind 60 %): the key was the only two-part choice; all three are two-part now. "Blames Tom" was
    //   defensible from “sounded better when I said it” (K1); now "asks Tom to fix it"
    // why: hurt ← "Hmm" and "sounded better" heard as disappointment; drops it ← "Hmm" plus "better" heard as giving up
    { id: 'a4', skill: 'attitude', level: 'C1', point: 'still', seg: [79.3, 90.6],
      stem: 'How does Leslie react to hearing her quote read back?',
      choices: ['She admits it’s off, but still likes it', 'She’s hurt, and asks Tom to fix it',
                'She laughs, and drops the saying'], a: 0,
      cue: '「Hmm.」のあとの二つの短い文。', line: 'Hmm. *Sounded better when I said it.* … *Still good, though.*',
      said: '「…言ったときのほうが良かったわね」と言い、「でもまあ、いいわ」と付け足す。',
      mean: '出来の悪さを少し認めつつ、自分の言葉への自信は手放さない。',
      trap: '前半だけだと、がっかりしてやめるようにも聞こえる。文末の though で気持ちが分かる。',
      use: 'Not perfect, but still good, though.（完璧じゃないけど、まあいい）' },

    // R fix: V2 (blind 75 %): the mayor distractor didn't fit the scene; now Saturday's game, where Tom will see him
    // why: city council ← Tom's first idea, said and turned down; mayor at the game ← the opening call, still in the ear
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['onboard', 'fixer', 'bodies'], seg: [90.6, 114.3],
      stem: 'Where does the brainstorm end up?',
      choices: ['With a plan to bring in a well-connected helper', 'With a plan to go straight to the city council',
                'With a plan to ask the mayor at Saturday’s game'], a: 0,
      cue: '後半、トムの「I have an idea」以降。',
      said: 'トムがマークを加える案を出し、レスリーはマークの顔の広さを説明する。',
      mean: '正面から頼むのではなく、町を動かせる人を味方にする方向に話がまとまる。',
      trap: 'city council も mayor も聞こえるが、それは前半の話。最後に出た案を聞く。',
      use: 'I know just the person to call.（ぴったりの人を知ってる）' },

    // R fix: V2 (blind 65 %): "a trip" was weak; now a city board, the keyword reading
    // why: city board ← "board" heard as a committee seat; in charge ← "board" heard as the board of directors
    { id: 'ph4', skill: 'phrase', level: 'B2', point: 'onboard', seg: [90.6, 94.85],
      stem: 'When Tom gets an idea, what does he suggest doing with Mark?',
      choices: ['Asking him to join their effort', 'Getting him a seat on a city board', 'Putting him in charge of it all'], a: 0,
      cue: '「bringing Mark」のあとの二語。', line: 'What about *bringing Mark on board*?',
      said: '「マークを仲間に入れるのはどう？」とトムが提案する。',
      mean: 'bring someone on board ＝ チームや計画に加える。仕事でよく使う。',
      trap: 'board を委員会や役員会と取りやすい。人を bring … on board なら仲間入り。',
      use: 'Let’s bring her on board.（彼女にも加わってもらおう）' },

    // R drop: i4 (never shipped, deleted): who asks each "Which Mark?" can't be settled from the words (K1), and why
    //   she'd dodge rests on the Leslie/Mark backstory (V1)

    // R fix: V2 (blind 55 %): "a council member" was off the sound; now "city manager", a near sound for planner
    // why: lawyer ← planner and lawyer share the ending; manager ← "city" plus the same -er rhythm
    { id: 'd5', skill: 'detail', level: 'B1', point: 'planner', seg: [99.95, 106.65],
      stem: 'In her interview, what does Leslie say Mark’s job is?',
      choices: ['A city planner', 'A city lawyer', 'A city manager'], a: 0,
      cue: '「he’s a city」のあと。', line: 'he’s a *city planner*, but he’s more than that.',
      said: '「彼は都市計画の担当者。でもそれだけじゃないの」と言う。',
      mean: 'city planner ＝ 都市計画の担当。肩書きより影響力を言いたい前置き。',
      trap: 'planner は lawyer や manager と語尾が似る。city のあとの語を頭から聞く。',
      use: 'She’s more than just a coworker.（ただの同僚以上よ）' },

    // R fix: V2 (blind 55 %): rebalanced; both distractors now build on his planner job
    // why: buildings ← "fixes things" taken literally, like a handyman; parks ← "city planner" just before
    { id: 'i6', skill: 'infer', level: 'B2', point: 'fixer', seg: [102.75, 111.28],
      stem: 'What kind of person does Leslie say Mark is, beyond his job?',
      choices: ['Someone who gets problems solved', 'Someone who fixes up old buildings',
                'Someone who plans out the town’s parks'], a: 0,
      cue: '「kind of like a」のあとの語と、次の一文。', line: 'He’s kind of like a *fixer*. He fixes things.',
      said: '「彼は一種のフィクサー。物事を何とかしてくれる人」と言う。',
      mean: 'fixer ＝ 裏で話をつけて問題を片づける人。修理屋の意味ではない。',
      trap: 'fixes things を「修理する」と取りやすい。人について言うなら問題を解決すること。',
      use: 'He’s the guy who gets things done.（彼は物事を片づけてくれる人）' },

    // R fix: V2 (blind 70 %): "every street" was weak; now a second literal reading of "bodies"
    // why: graveyard ← bodies and buried taken literally; who has died ← "bodies" taken literally, with "knows where" lost
    { id: 'ph5', skill: 'phrase', level: 'C1', point: 'bodies', seg: [107.65, 114.3],
      stem: 'At the end, what does Leslie suggest Mark knows?',
      choices: ['The town’s hidden secrets', 'Where the old graveyard is', 'Who in town has died lately'], a: 0,
      cue: '「he knows where」のあと、たとえの部分。', line: 'He just… he *knows where the bodies are buried*.',
      said: '「彼は、死体がどこに埋まってるか知ってる人なの」と言う。',
      mean: '町の裏事情や、人に知られたくない秘密を知っている、という慣用句。',
      trap: 'bodies や buried を文字どおり取ると墓地の話になる。人をほめる文脈ならたとえ。',
      use: 'She knows where all the bodies are buried.（彼女は内情を全部知ってる）' },
  ]
};
