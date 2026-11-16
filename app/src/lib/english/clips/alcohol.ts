// “Do you think DOING ALCOHOL is COOL? - The Office US” (the official Office channel, Best of Season 2): Michael
// lectures the office on drugs with made-up facts, turns on Toby for correcting him, and asks for a tragic story; Pam
// volunteers Jim, who gets out of it by crying, and a comment to the camera calls it fake.
// Segments from the captions, words from whisper (2026-11-16). Whisper's timings drift late after ≈ 170 s and it loops
// “No.” at 197–202 s; all times here are the captions'.
// Speakers: Michael is named (“Thank you, Michael”, 34 s; “…an illegal drug, Michael”, 109.5 s), and so are Toby and
// Pam (118.6 s, 149.1 s). The person who answers about wine, the one who asks where the facts came from, and the
// to-camera speaker are never named, so items don't name them.
// Untested on purpose: who says “Really?” (156.9 s: Jim or Michael), who says “Oh, he's doing it” (173.4 s) and “are
// you sure? That looked like it was going to be good” (197 s; c2 asks about “the speaker”), the left/right line (it
// asks for arithmetic), and why the Cheech and Chong line works for people who know them (h2 needs only the words).
// REVIEW 2026-11-16: pass 6, fix 17, drop 0, new 0; ear checks 0
// OPEN: c1 (C2) is still about 50 % blind: "Sure it was" is a known sarcastic form. Keep, or ask the user to retire it.
// EAR CHECK: none. No key rests on a line where whisper and the captions disagree, and no item asks who speaks.
import type { Clip } from '../types.ts';

export const doingAlcohol: Clip = {
  id: 'alcohol', video: '4L7HbOcpETw', title: 'Do you think DOING ALCOHOL is COOL?', dur: 233, wpm: 140, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %): the key was the only critical choice, and the title points at it. The test-rules filler
    //   is now "his own past", the usual anti-drug-talk script.
    // why: drug use here ← "some people here" and "Dwight was a narc" heard as drug use found in the office; his own
    //   past ← the usual script for an anti-drug talk, a speaker's own story
    { id: 'g1', skill: 'gist', level: 'B2', point: 'talk', reveals: ['facts'], seg: [0, 84.6],
      stem: 'What is Michael’s anti-drug talk mostly built on?',
      choices: ['Wild facts with no source', 'His own past with drugs', 'Drug use found in this office'], a: 0,
      cue: '話の後半、聞き手が口をはさむところ。',
      said: '「薬は人生を壊す」「隣の人が薬で死ぬ」などと並べ、出どころを聞かれる。',
      mean: '中身は根拠のない脅し文句ばかり。聞き手もまったく怖がっていない。',
      trap: 'testing が何度も出るので検査の説明と思いやすいが、規則の話は一つも出てこない。',
      use: 'Where did you hear that?（それ、どこで聞いたの？）' },

    // R fix: V2 (blind 50 %): "someone else has to own up" was a filler. All three now name who joked; the new one
    //   loses who "you" is.
    // why: Dwight ← "Dwight" is the name heard, in the wrong role; everyone but Michael ← "you were the one" heard as
    //   aimed at the staff, not at the boss
    { id: 'i2', skill: 'infer', level: 'B2', point: 'narcjoke', seg: [9.4, 14.6],
      stem: 'What is the point of the reply that starts “You were the one…”?',
      choices: ['Michael is the one who joked', 'Dwight is the one who joked', 'Everyone joked except Michael'],
      a: 0,
      cue: '「joking around」の主語に注目。',
      line: '*You were the one joking around* calling Dwight a narc.',
      said: '「冗談にしてたのはそっちでしょ」と返される。',
      mean: '「笑いごとではない」と言う本人が、一番ふざけていた、という指摘。',
      trap: 'Dwight の名前が聞こえるので、彼がふざけたと取りやすい。you were the one の you が誰かを聞く。',
      use: 'You’re the one who said it!（言ったのはそっちでしょ！）' },

    // why: "what was it testing" ← "test" and "failed" taken at face value (the sincerity flip); sorry ← accepting the
    //   blame he hands them, the Japanese 謝罪 frame
    // R fix: V2 (blind 70 %): the key was the only short, casual reply. All three are now short spoken replies of the
    //   same length; "What was it testing?" takes the test at face value. Still about 50 % blind (open).
    // anchor: 12.0–13.8 s the accusation comes first ("You were the one joking around…"); 14.3–16.5 s "No. No. That was
    //   a test.": the test is named only after he is caught, and its result ("you all failed") only after that
    { id: 'c1', skill: 'pragma', level: 'C2', point: 'test', reveals: ['narcjoke'], seg: [9.4, 22.6],
      stem: 'Which reply would show the staff saw through “That was a test”?',
      choices: ['“Right. Sure it was, Michael.”', '“Oh. What was it testing, then?”',
                '“Sorry. We should have said something.”'],
      a: 0,
      cue: '「test」と言い出す直前に、何があった？',
      line: 'You were the one joking around… — *No. No. That was a test.*',
      said: 'ふざけていたと指摘されると、「違う違う、あれはテストで、みんな落ちた」と言い出す。',
      mean: 'テストだと言うのは、ばれたあと。見抜いたなら「はいはい」と流す返事になる。謝るのは言い訳を真に受けた返事。',
      trap: 'failed と言われると反省したくなる。言い訳には中身でなく、言い出したタイミングで返す。',
      use: 'Sure you were. Nice try.（はいはい。うまいこと言うね）' },

    // R fix: V2 (blind 75 %) and S4: the key was the only knowing choice. Now three "claiming/admitting" moves, one of
    //   them the keyword trap (Dwight). The segment began inside "narc" (13.6 s); now 13.2 s.
    // why: joked too much ← "No. No." heard as regret; testing Dwight ← "Dwight" was the last name said, so the test
    //   seems aimed at him
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'test', reveals: ['narcjoke'], seg: [13.2, 22.6],
      stem: 'What is Michael doing when he calls it “a test”?',
      choices: ['Claiming he joked on purpose', 'Admitting he joked too much', 'Claiming he was testing Dwight'], a: 0,
      cue: '「No. No.」のあと、話の向きが変わるところ。',
      line: 'No. No. *That was a test*. I was testing you',
      said: '「違う違う。あれはテストだった。みんなを試したんだ」と言い出す。',
      mean: 'ふざけていたと指摘され、あとから「わざとだった」に書きかえている。言い逃れ。',
      trap: 'No. No. を反省と取りやすいが、打ち消してから話を作りかえている。',
      use: 'I was just testing you.（ちょっと試しただけだよ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'failed', seg: [16.8, 22.7],
      stem: 'Type what he says: “I was testing you, and ___.” (4 words)', answer: 'you all failed miserably',
      cue: '「testing you」のあと。最後に一語足す。',
      line: 'I was testing you, and *you all failed. Miserably.*',
      said: '「みんなを試した。そして全員、見事に落ちた」と言う。',
      mean: 'you all ＝ 君たち全員。miserably は間をおいて足す「みじめに」。',
      trap: 'you all は「ユーオー」と縮み、一語に聞こえやすい。最後の miserably を落とさない。',
      use: 'You all did great today.（今日はみんなよくやった）' },

    // R fix: V2 (blind 60 %): "repeats what Dwight told them" was a filler. Now the wrong-target reading: that the
    //   staff called Dwight a narc.
    // why: agree in secret ← "He's right" inside his quote heard as their real view; they called him that ← "Dwight was
    //   a narc" heard without "When I said"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'defend', reveals: ['narcjoke'], seg: [22.4, 34.4],
      stem: 'Why is Michael’s question about defending Dwight funny?',
      choices: ['He blames them for an insult he made himself', 'He scolds them for calling Dwight a narc',
                'He proves they all agree with Dwight in secret'], a: 0,
      cue: '「narc」と言ったのは誰だったか。',
      line: 'When *I said* that Dwight was a narc, *how many of you defended him?*',
      said: '「僕が Dwight を密告屋と言ったとき、誰か彼をかばったか？」と問いつめる。',
      mean: '悪口を言ったのは自分なのに、止めなかったみんなを責めている。筋が逆。',
      trap: '引用の He’s right をみんなの本音と取りやすい。引用は「言うべきだったセリフ」。',
      use: 'Why didn’t anyone stop me?（なんで誰も止めてくれなかったの？）' },

    // R fix: V2 (blind 55 %): "every person tested, him too" now reads as the leader-goes-first frame, a stronger near
    //   miss.
    // why: run the testing ← "testing of any kind" heard as his job; first one tested ← the Japanese frame of the boss
    //   setting an example, with "anti-drug" heard as backing tests
    { id: 'i1', skill: 'infer', level: 'C1', point: 'above', seg: [34.5, 44.8],
      stem: 'What is the point of the claim to be “above suspicion”?',
      choices: ['He wants no test to apply to him', 'He wants to run the testing himself',
                'He offers to be the first one tested'], a: 0,
      cue: '「suspicion」のあと、何が並ぶか。',
      line: 'I am so anti-drug that *I am above suspicion* in any way that involves suspicion or *testing of any kind*.',
      said: '「反対しすぎて、疑いも検査も対象外」と言う。',
      mean: 'above suspicion ＝ 疑われる立場にない。それを理由に、自分だけ検査を逃れたい。',
      trap: 'anti-drug と testing が並ぶので検査に賛成と取りやすい。above は「外にいる」。',
      use: 'Nobody here is above the rules.（ここではだれもルールの例外じゃない）' },

    // R fix: V2 (blind 55 %) and S3: the key was the only abstract choice; all three now say what he says about the
    //   pair. The cue had "careers", a word only the key had.
    // why: made them funny ← "funny" and "pot" heard together, with the direction lost; quit and lost fans ← the
    //   "careers destroyed" story he has just set up
    { id: 'h2', skill: 'humor', level: 'C1', point: 'cheech', seg: [47, 58.4],
      stem: 'Why does his Cheech and Chong example get a laugh?',
      choices: ['He calls them funny, so drugs didn’t ruin them', 'He says pot is what made them so funny',
                'He says they quit pot and then lost their fans'], a: 0,
      cue: '例を出す前の一文と、例の二人への一言。',
      line: 'Drugs *destroy careers*. … Everybody knows that Cheech and Chong *are funny*.',
      said: '「薬は仕事を壊す。例えばこの二人。吸わなければもっと面白い」。',
      mean: '仕事が壊れた例のはずが、成功例を出す。そのずれが笑い。二人を知らなくても解ける。',
      trap: 'funny と pot が並ぶので「薬のおかげ」と取りやすい。didn’t は「吸わなければ」。',
      use: 'Take me, for example.（たとえば私がそう）' },

    // why: alcohol ← "alcohol" comes a few lines later; pot ← "smoke pot" was the line before
    { id: 'd2', skill: 'detail', level: 'B1', point: 'cocaine', seg: [73.6, 79.6],
      stem: 'What does Michael compare cocaine use with?',
      choices: ['Parents reading books to their children', 'People drinking alcohol at home',
                'Kids smoking pot with their friends'], a: 0,
      cue: '「than」のあとの部分。',
      line: 'more people will use cocaine *than will read a book to their children*.',
      said: '「今年は、子どもに本を読む人より、コカインを使う人の方が多い」と言う。',
      mean: 'more A than B で比べる形。でたらめな数字で怖がらせようとしている。',
      trap: 'than のあとが比べる相手。前後の alcohol や pot と混ぜないように。',
      use: 'More people walk than drive here.（ここは車より歩く人が多い）' },

    // why: names a study ← a question about sources expects a source; made them up ← the facts sound false, so a
    //   confession seems likely
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'facts', seg: [79.3, 84.6],
      stem: 'When asked where the facts came from, how does Michael respond?',
      choices: ['He answers with a question of his own', 'He names the study he read them in',
                'He admits that he made them up'], a: 0,
      cue: '「Where did you get」の直後の返し。',
      line: 'Where did you get these facts? — *Are these facts scaring you or are they not?*',
      said: '「その情報、どこから？」と聞かれ、「怖くなったか、ならないか？」と聞き返す。',
      mean: '出どころには答えず、質問で返してごまかしている。',
      trap: '聞かれたら答えると思いやすい。返しが、聞かれたことへの答えになっているかを聞く。',
      use: 'Why do you ask?（どうしてそんなこと聞くの？）' },

    // R fix: V2 (blind 50 %): "Nervously: they ask him to stop" was weak. Now "Jokingly: they pretend to be scared",
    //   the sitcom reading.
    // why: politely scared ← the 気をつかう answer expected from staff to a boss; pretend ← an office mocking its boss
    //   would play along with a fake "yes"
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'scared', seg: [80.8, 84.6],
      stem: 'How do the staff answer his question about being scared?',
      choices: ['Flatly: the facts don’t scare them', 'Politely: they say the facts are scary',
                'Jokingly: they pretend to be scared'], a: 0,
      cue: '質問のすぐあと、短い返事。',
      line: 'Are these facts scaring you or are they not? — *They are not.*',
      said: '「怖くなった？ならない？」に、「なりません」とそっけなく返す。',
      mean: '質問の言葉をそのまま使い、「ならない」と言い切る。まったく響いていない。',
      trap: '上司への返事は気をつかうと思いやすい。are they not? の not をそのまま返している。',
      use: 'Honestly? No, not really.（正直に言うと、そうでもない）' },

    // why: once a day ← "with dinner" suggests every night; twice ← once/twice share the ending and the "a week"
    { id: 'n1', skill: 'number', level: 'B1', point: 'wine', seg: [90, 96.5], keep: true,
      stem: 'How often does the person who answers have red wine?',
      choices: ['Once a week', 'Twice a week', 'Once a day'], a: 0,
      cue: '「with dinner」のあと。',
      line: 'I have a glass of red wine with dinner *about once a week*.',
      said: '「夕食に赤ワインを一杯、週に一回くらい」と答える。',
      mean: 'once a week ＝ 週1回。about で「だいたい」。健康のため、と付け足す。',
      trap: 'with dinner から毎晩と取りやすい。頻度は文の最後の once a week。',
      use: 'I go to the gym twice a week.（ジムは週2回）' },

    // R fix: V2 (blind 50 %) and S4: "pleased and says thanks" was weak; now "agrees and lets them go on", the reading of
    //   "Okay". The segment began inside "antioxidants" (95.5 s) and ended inside "I have" (99.2 s); now 94.6–98.9 s.
    // why: lets them go on ← "Okay" heard as agreement with the answer; curious ← the long answer heard as something he
    //   asked for
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'enough', seg: [94.6, 98.9],
      stem: 'How does Michael react to the answer about wine?',
      choices: ['He is fed up and cuts it short', 'He agrees and lets them go on', 'He is curious and asks for more'],
      a: 0,
      cue: '同じ語を何回くり返すか。',
      line: 'For the antioxidants. — *Okay, enough. Enough. Enough.*',
      said: '「抗酸化物質のため」と言われ、「もういい、もういい」とさえぎる。',
      mean: '欲しかったのは「かっこよくない」の一言だけ。ワインの話は聞きたくない。',
      trap: 'Okay を「なるほど」と取りやすいが、すぐ enough が3回続く。くり返しは打ち切りの合図。',
      use: 'Okay, okay, I get it.（はいはい、分かったよ）' },

    // R fix: V2 (blind 85 %): only the key was a plain "look" reading. Distractors are now "take a guess" (the quiz that
    //   follows) and "take turns reading", both take-a-noun chunks.
    // why: guess ← "How many of these are you familiar with?" comes next, so it sounds like "take a guess"; take turns ←
    //   take a ～ heard as another "take" chunk, with a list to read
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'gander', seg: [98.6, 107.4],
      stem: 'When Michael shows his list, what does “Take a gander” ask?',
      choices: ['That they have a look at it', 'That they take a guess at it', 'That they take turns reading it'],
      a: 0,
      cue: '「list」のあと、「How many」の前。',
      line: 'I have written down a list of illegal drugs. *Take a gander*.',
      said: '「違法な薬物のリストを書いた。見てくれ」と言う。',
      mean: 'take a gander ＝ ちょっと見る（くだけた言い方）。take a look と同じ。',
      trap: '直後のクイズから take a guess と取りやすい。take a ～ は動作を一回する形。',
      use: 'Take a gander at this menu.（このメニュー、見てみて）' },

    // R fix: S4: the segment began inside "other flavors" (117.6 s); now 117.9 s.
    // why: off the board ← take down = 取り外す, the literal reading; Toby out ← "Toby" is named just before
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'takedown', seg: [117.9, 125.6],
      stem: 'What does Michael ask Pam to do?',
      choices: ['Write down what he says next', 'Take his list off the board', 'Take Toby out of the room'], a: 0,
      cue: '「Pam」と呼んだあとの頼み。',
      line: 'Pam, could you *take this down*? In addition to Toby’s urine…',
      said: 'Pam に「これを書きとめて」と頼み、Toby の検査の話を始める。',
      mean: 'take down ＝ 書きとめる。このあと言うことを記録させたい。',
      trap: 'take down には「外す」の意味もある。すぐ話し始めるので、言うことの記録。',
      use: 'Let me take down your number.（番号を控えさせて）' },

    // why: heart ← hair/heart share the /h/ onset, with the final t easy to imagine; breath ← blood/breath share the
    //   /b/ onset
    { id: 'd3', skill: 'detail', level: 'B1', point: 'hair', reveals: ['random'], seg: [120.5, 125.6],
      stem: 'Besides Toby’s urine, what else does Michael want tested?',
      choices: ['His blood and his hair', 'His blood and his heart', 'His breath and his hair'], a: 0,
      cue: '「I would like to test」のあと。',
      line: 'I would like to test *his blood and his hair*.',
      said: '「尿に加えて、Toby の血液と髪も検査したい」と言う。',
      mean: '検査を増やして Toby を困らせたい。直前に言い返されたことへの仕返し。',
      trap: 'hair と heart は出だしが同じ。hair は最後に t がない。blood の bl も聞き分ける。',
      use: 'They tested my blood and my eyes.（血液と目の検査をした）' },

    // R fix: S4: the segment ended inside "randomly" (130.6 s); now 130.9 s.
    // why: can ← the t of can't drops; could / couldn't ← the vowel blurred, and a polite past form expected
    { id: 's1', skill: 'sound', level: 'B2', point: 'cant', seg: [124.8, 130.9],
      stem: 'Fill the gap: “You ___ do that.”',
      choices: ['can', 'can’t', 'could', 'couldn’t'], a: 1,
      cue: 'Michael の言い返しの、最初の二語も聞く。',
      line: '*You can’t do that.* — I can test anyone randomly…',
      said: '「できませんよ」と言われ、「誰でも無作為に検査できる」と言い返す。',
      mean: 'can’t は「キャーン」と母音が長く強い。肯定の can は弱く「クン」に近い。',
      trap: 't が消えると can に聞こえる。母音の長さと、相手の I can という言い返しで判断。',
      use: 'You can’t park here.（ここは駐車できません）' },

    // R fix: V2 (blind 75 %), S2 and K1: the stem quoted the self-contradiction, and the segment ran on into "eeny,
    //   meeny…", a second laugh. The stem names the moment, the segment ends at 131.85 s, and the distractors are the
    //   boss's power claim and an admission he never makes.
    // why: anyone he likes ← "I can test anyone" is said first, a claim that sounds bossy enough to laugh at; admits ←
    //   the revenge is plain, so it seems he says it
    { id: 'h3', skill: 'humor', level: 'C1', point: 'random', reveals: ['cant'], seg: [126.2, 131.85],
      stem: 'Why does Michael’s answer to Toby’s objection get a laugh?',
      choices: ['He calls his choice of Toby random', 'He says he can test anyone he likes',
                'He admits he picked Toby to punish him'], a: 0,
      cue: '「anyone」の文と、次の「chosen you」の文。',
      line: 'I can test anyone randomly, and *I have chosen you randomly*. — *That’s not random.*',
      said: '「誰でも無作為に検査できる。無作為に君を選んだ」に「無作為じゃない」。',
      mean: '「選んだ」と「無作為」は両立しない。わざと選んだのに、口では偶然と言う。',
      trap: '仕返しは見え見えでも、口では認めていない。chosen と randomly の矛盾が笑い。',
      use: 'Totally random, I swear.（ほんとにたまたまだって）' },

    // R fix: V2 (blind 60 %): the key was the only "story" choice. All three now start "Pick a drug and…".
    // why: dangers ← "select one of these words" heard as a lesson on one drug; tried one ← "familiar with" earlier and
    //   "their lives" heard as a confession
    { id: 'd4', skill: 'detail', level: 'B2', point: 'volunteer', seg: [136.2, 147.3],
      stem: 'What does Michael want the volunteer to do?',
      choices: ['Pick a drug and tell a sad true story about it', 'Pick a drug and explain why it is dangerous',
                'Pick a drug and say if they have tried it'], a: 0,
      cue: '「select one of these words and」のあと。',
      line: 'select one of these words and *tell us of something tragic*… in either their lives or the lives of a loved one.',
      said: '「言葉を一つ選び、自分か大切な人の悲しい話をしてほしい」と言う。',
      mean: 'tragic ＝ 悲劇的な。薬にまつわる身近な悲しい体験を話させたい。',
      trap: 'select one of these words で薬の説明と思いやすい。and のあとが本題。',
      use: 'Can anyone tell us a story?（誰か話してくれる人？）' },

    // R fix: V2 (blind 50 %) and C5: the stem said "sad story", d4's key. The stem now names the moment, and the Pam
    //   filler is now "he cries for real", the sincerity flip the comment to the camera settles.
    // why: real story ← "a relative of his" and the long coaxing set up a real one; cries for real ← the crying is
    //   heard, and "It's okay" treats it as real
    { id: 'g2', skill: 'gist', level: 'B2', point: 'story', seg: [148.4, 211.6],
      stem: 'How does it end once Pam brings up Jim?',
      choices: ['Jim cries instead, and it is an act', 'Jim tells a real story about a relative',
                'Jim cries for real over a relative'], a: 0,
      cue: '最後の、カメラに向けた一言。',
      said: 'Pam が Jim の話を振り、Michael がせかすが、話は出てこない。',
      mean: '話をさせられそうになった Jim が、泣くふりで逃げ切った。',
      trap: '親戚の話が出るので本当の話があると思いやすい。カメラへの一言が答え合わせ。',
      use: 'I’m not getting out of this, am I?（これは逃げられないな）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'letout', seg: [162, 164.6],
      stem: 'Type what he says: “This would be a good place to ___, Jim.” (3 words)', answer: 'let it out',
      cue: '「a good place to」のあと。',
      line: 'This would be a good place to *let it out*, Jim.',
      said: '「ここは、思いを吐き出すのにいい場所だよ」と言う。',
      mean: 'let it out ＝ ためこんだ気持ちを出す。let it の t が弾んで「レリッ」になる。',
      trap: 't が「ラ行」に変わり、let it が一語に聞こえる。3語で確かめる。',
      use: 'It’s okay to let it out.（我慢しなくていいよ）' },

    // why: helped Jim ← "good" heard as "good for Jim" (the sincerity flip); taught them ← the meeting's anti-drug
    //   purpose, the right mechanism aimed at the wrong target
    // R fix: V2 (blind 65 %): the key was the only cynical choice. All three are now "hoped…" choices.
    // anchor: 180.9 s "It's okay" to the crying man, then 196.9–199.3 s "Okay, are you sure? That looked like it was
    //   going to be good": "it" is the story that didn't come, "looked like" is a watcher's word, and "good" is said of a
    //   story, not of Jim
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'good', seg: [180.4, 200.6],
      stem: 'What does “That looked like it was going to be good” show?',
      choices: ['The speaker hoped for a show, not to help', 'The speaker hoped talking would help Jim heal',
                'The speaker hoped the story would teach them all'], a: 0,
      cue: '「it」が何を指すか。',
      line: 'It’s okay. … Okay, are you sure? *That looked like it was going to be good.*',
      said: 'Jim が話さずに終わると、「本当に？面白くなりそうだったのに」と言う。',
      mean: 'good は Jim でなく「話」のこと。looked like は見物する側の言葉。支えるふりの裏で、ドラマを待っていた。',
      trap: 'good を「Jim のためになる」と取りやすい。it が何を指すかを聞く。',
      use: 'Aw, I was looking forward to that.（えー、楽しみにしてたのに）' },

    // R fix: V2 (blind 75 %): reworded so the key isn't the only "win" choice, and the two literal readings match it in
    //   form.
    // why: hit back ← "guns" heard as violence; someone stronger ← "big" heard as big people (大物) brought in
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'bigguns', reveals: ['story'], seg: [203.6, 211.6],
      stem: 'In the comment to the camera, what does “pulled out the big guns” mean?',
      choices: ['Used his best trick to get out of it', 'Got angry and hit back hard at Michael',
                'Asked someone stronger to step in'],
      a: 0,
      cue: '直後の二語が、その中身。',
      line: 'He really *pulled out the big guns*. Fake crying. Did not expect that.',
      said: 'カメラに「切り札を出したね。嘘泣き。予想外」と話す。',
      mean: 'pull out the big guns ＝ 最強の手を使う。嘘泣きを勝負の切り札にたとえる。',
      trap: 'guns から怒りや暴力を想像しやすい。たとえの中身は、直後の fake crying。',
      use: 'Time to bring out the big guns.（いよいよ切り札の出番だ）' },
  ]
};
