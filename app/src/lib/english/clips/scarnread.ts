// “Threat Level Midnight Read Through - The Office US” (the official The Office channel, BEST OF SEASON 2): Jim
// runs a read-through of Michael's spy script; Dwight objects, then reads the hero, until a leftover name shows the
// idiot sidekick was written as him.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 170 s; whisper's lines after 170 s are
// hallucinations. Untested: 13.3 s "That's the character's name?" (needs knowing Catherine Zeta-Jones is a real star),
// 78–86 s (the script's cake scene is garbled, and whisper adds "to the kids"), 64.0 s ("I was good" / "That was good").
// The talking heads' speakers are never asked.
// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 2
// Open: no C2 (native-tier) items yet; GUIDE §10 asks for 2–4, and ref/types.ts has no 'C2' level.
// EAR CHECK: 25–51 s g2 — Scarn's lines read in Dwight's voice (assumed; captions don't say); the key rests on it
// EAR CHECK: 16.7 s a1 — tone of “this is for all of America to enjoy” (assumed mock praise from Jim)
import type { Clip } from '../types.ts';

export const scarnRead: Clip = {
  id: 'scarnread', video: '-FoKU54ITuI', title: 'Threat Level Midnight Read Through', dur: 193, wpm: 169, band: 'fast',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: blind 60 %: the key was the only "reading" job; all three are now reading jobs (V2/K6)
    // why: hero's lines ← "action" caught alone, and the lead role comes up soon after; Catherine ← Phyllis is
    //   given that part in the next breath
    { id: 'd1', skill: 'detail', level: 'B1', point: 'actions', seg: [4.6, 10.1],
      stem: 'What does Jim say his own job in the reading will be?',
      choices: ['Reading out the action descriptions', 'Reading the lines of the action hero', 'Reading the part of Catherine'],
      a: 0,
      cue: 'started のあと、I’m going to の文。',
      line: 'I’m going to be *reading the action descriptions*',
      said: '「僕はト書き（場面の説明）を読む」と言う。',
      mean: 'action descriptions ＝ 脚本の、せりふ以外の説明。ナレーター役になる。',
      trap: 'action だけ拾うと「アクションの主役」と思いやすい。前の動詞 reading まで聞く。',
      use: 'I’ll be taking notes.（私はメモ係をやります）' },

    // R fix: blind 60 %: the key was the only choice where Dwight joins; now two choices have him drop it (V2/K6)
    // why: Jim reads ← "I'm going to be reading" from just before; asks Michael ← "something that doesn't belong to
    //   you" suggests getting the owner's OK first
    { id: 'g2', skill: 'gist', level: 'B2', point: 'offer', seg: [14.0, 51.0],
      stem: 'How does Dwight’s objection play out in the first minute?',
      choices: ['He drops it once he’s offered the lead part', 'He drops it once Jim agrees to ask Michael first',
                'He keeps objecting, so Jim reads the hero himself'], a: 0,
      cue: '名前を呼んでからの質問と、そのあと主役を読む声。',
      line: 'Dwight, *do you want to play the lead role* of Agent Michael Scarn?',
      said: '反対していたドワイトに、主役 Agent Michael Scarn の役を勧める。',
      mean: 'そのあと主役のせりふを読むのはドワイトの声。反対はあっさり消える。',
      trap: '最初の強い反対だけ覚えていると、参加しないと思いやすい。誰の声で主役が読まれるかを追う。',
      use: 'Want to take the lead on this?（これ、仕切ってみる？）' },

    // why: real work ← office setting + "should not be doing this" read as a work rule; not finished ← "This is a
    //   movie" read as a draft still in progress
    { id: 'd2', skill: 'detail', level: 'B2', point: 'objection', seg: [14.0, 25.2],
      stem: 'What reason does Dwight give for wanting the reading stopped?',
      choices: ['They took the script without asking', 'They should be doing their real work',
                'The script is not finished yet'], a: 0,
      cue: 'Why not? と聞かれたあとの答え。',
      line: 'You guys should not be doing this. … *You took something that doesn’t belong to you*',
      said: '「自分のものじゃない物を持ってきた」と言って止めようとする。',
      mean: '脚本は持ち主に断らずに持ち出された物だ、というのが反対の理由。',
      trap: 'should not だけで「仕事中だから」と考えやすい。理由は Why not? への答えに来る。',
      use: 'That doesn’t belong to you.（それ、あなたのじゃないでしょ）' },

    // R fix: blind 55 %: the key was the only non-weakening choice; a topic-change reading replaces the hedge (V2/K3)
    // why: takes back ← I mean learned as 訂正; separate point ← a new sentence after a full stop sounds like moving on
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', seg: [16.2, 21.5],
      stem: 'After “This is a movie,” what does Jim’s next short phrase do?',
      choices: ['It builds the same point up bigger', 'It moves on to a separate point',
                'It takes back what he just said'], a: 0,
      cue: 'movie のあと、次の文の頭の短い2語。',
      line: 'This is a movie. *I mean*, this is for all of America to enjoy.',
      said: '「これは映画だ。というか、全米が楽しむためのものだ」と続ける。',
      mean: 'I mean は前の発言を広げて、もっと大きく言い直す働き。取り消しではない。',
      trap: '「いや」と訳すと訂正に聞こえる。後ろが前より強い主張なら、話を広げている。',
      use: 'It’s good. I mean, really good.（いいよ。いや、本当にいい）' },

    // R fix: blind 55 %: the key was the only "Not at all" against two "Fully"; now a 3-step scale in order (K6/K8)
    // why: really good ← "a movie… for all of America" taken at face value; partly ← the defense heard as polite
    //   loyalty to an absent coworker
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'america', seg: [16.2, 21.5],
      stem: 'When Jim defends the reading to Dwight, how serious is he?',
      choices: ['Not at all; he’s teasing with mock praise', 'Partly; he likes it but is mostly polite',
                'Fully; he thinks the script is really good'], a: 0, keep: true,
      cue: '同僚の手作り脚本に、どれほど大きな言葉を使うか。',
      line: 'This is a movie. I mean, this is *for all of America to enjoy*.',
      said: '同僚の手作り脚本を「全米が楽しむための映画だ」と持ち上げる。',
      mean: 'わざと大げさにほめて、からかっている。本気の評価ではない。',
      trap: '言葉だけならほめ言葉。中身と言葉の大きさが合わないときは、冗談のことが多い。',
      use: 'Oh, it’s a masterpiece, clearly.（ああ、まさに傑作だね〈皮肉〉）' },

    // R fix: blind 55 %: "read the script yet" was a filler and the key the longest; new third choice (K3/K7).
    //   The seg was 18 s; it now ends before the reading starts (S4)
    // why: teasing ← Jim teases all through, so the offer could be a joke; watch ← "Do you want to" heard as asking
    //   whether he'd rather sit out, with "lead role" missed
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'offer', seg: [21.4, 30.6],
      stem: 'What is Jim’s question to Dwight right after his protest really for?',
      choices: ['Winning him over by offering the best part', 'Teasing him with a part he would never accept',
                'Checking if he’d rather just watch the reading'], a: 0,
      cue: '反対のすぐあと、名前を呼んでからの質問。',
      line: 'Dwight, *do you want to play the lead role* of Agent Michael Scarn?',
      said: '止めようとするドワイトに「主役をやらない？」と聞く。',
      mean: '一番いい役を差し出して、反対をやめさせる一手。質問の形をした誘い。',
      trap: 'Do you want to…? をただの質問ととると意図を外す。英語では誘いや提案によく使う形。',
      use: 'Do you want to join us?（一緒にどう？）' },

    // why: someone else ← "message" + "I love you" heard without "That's from me"; wife ← a message read aloud
    //   in front of everyone, a usual sitcom setup
    { id: 'h1', skill: 'humor', level: 'C1', point: 'messages', seg: [36.6, 46.9],
      stem: 'Why is Catherine’s first “message” funny?',
      choices: ['It’s her own love confession, not a real message', 'It’s a love note from someone else that she reads out',
                'It’s a private message from his wife, read aloud'], a: 0,
      cue: 'I love you のあとの短い一言。',
      line: 'First message is, *I love you*. *That’s from me*.',
      said: '「最初の伝言は『愛してる』。それ、私からです」と言う。',
      mean: '伝言を伝えるふりをして、自分の告白をする。仕事の報告の形が急に崩れるのがおかしい。',
      trap: 'message を電話の伝言と思うと、別の人の言葉に聞こえる。最後の from me で話が変わる。',
      use: 'This one’s from me.（これは私からです）' },

    // R fix: the trap called th 「ザ」; it's the voiceless th, closer to 「サ」 (N4). Blind: wrong, choices kept
    { id: 'n1', skill: 'number', level: 'B1', point: 'thousand', seg: [46.6, 49.6],
      stem: 'Fill the gap in Scarn’s answer: “Not in a ___ years, Catherine.”',
      choices: ['hundred', 'thousand', 'million'], a: 1, keep: true,
      cue: 'Not in a のあと、years の前の数。',
      line: 'Not in a *thousand* years, Catherine. We work together.',
      said: '「千年たってもありえない。僕らは同僚だ」と断る。',
      mean: 'Not in a thousand years ＝ 絶対にない。数は強調で、本当の年数ではない。',
      trap: 'hundred や million も同じ形で使う。th は「サ」に近い息の音。それを聞く。',
      use: 'Not in a million years!（絶対ないよ！）' },

    { id: 'n2', skill: 'number', level: 'B1', point: 'grade', seg: [50.9, 55.6],
      stem: 'In the interview, in which school year was his acting experience?',
      choices: ['In the sixth grade', 'In the seventh grade', 'In the eleventh grade'], a: 1, keep: true,
      cue: 'in the のあと、grade の前。',
      line: 'I was in a production of Oklahoma in the *seventh grade*.',
      said: '「7年生（中1）のとき『オクラホマ』の舞台に出た」と話す。',
      mean: '演技の経験はある、と言いたいが、それが中学の学校劇ひとつだけ。',
      trap: 'seventh と eleventh はどちらも -n-th で終わる。語頭の音と、音節が2つか3つかを聞く。',
      use: 'I was in a play in high school.（高校で劇に出たことがある）' },

    // R fix: blind 75 %: the stem quoted "too many kids", which gave the key; the stem now names the moment (S1/V2)
    // why: main part ← "too many kids" read as a crowded audition; wrote himself ← "made up roles" heard, but the
    //   subject "they" missed
    { id: 'i2', skill: 'infer', level: 'C1', point: 'filler', reveals: ['madeup'], seg: [55.5, 64.9],
      stem: 'What does his explanation suggest about his part in the school play?',
      choices: ['A small part added just to fit everyone in', 'A main part he won over many other kids',
                'A part he wrote himself to get on stage'], a: 0,
      cue: 'so の前後：原因と、学校がしたこと。',
      line: 'They had *too many kids*, so they *made up roles* like that.',
      said: '「子どもが多すぎたから、そういう役を作った」。役名は Mute the mailman。',
      mean: '全員を出すための、台本にない役。それを得意げに話すのがおかしい。',
      trap: 'made up だけだと本人が作ったと思いやすい。主語 they（学校）を聞く。',
      use: 'Too many people came, so we split up.（人が多すぎたので分かれた）' },

    // R fix: blind 60 %: "They had" in the stem ruled out "make up", and "mapped out" was weak; stem trimmed,
    //   "take up" in (V2/K3)
    // why: make up ← the past -d links into "up" and is easy to lose; take up ← メイカップ vs テイカップ, only the
    //   first consonant differs, and "take up a role" is real English
    { id: 's1', skill: 'sound', level: 'B2', point: 'madeup', reveals: ['filler'], seg: [59.2, 63.3],
      stem: 'Fill the gap: “…so they ___ roles like that.”',
      choices: ['made up', 'make up', 'take up'], a: 0,
      cue: 'so they のあと、roles の前の2語。',
      line: 'so they *made up* roles like that.',
      said: '「だからそういう役を作った」。made up が「メイダップ」とつながる。',
      mean: 'make up ＝ でっち上げる、作り出す。ここは過去の話なので made。',
      trap: 'd が次の母音とつながると過去形が消えて聞こえる。前の had と時制をそろえる。',
      use: 'Did you make that up?（それ、作り話でしょ？）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'company', seg: [75.3, 78.3],
      stem: 'Type the missing words: “Now, ___ for one more mission.” (3 words)', answer: 'keep me company',
      cue: 'Now, のあと、for の前の3語。',
      line: 'Now, *keep me company* for one more mission.',
      said: '「さあ、もう一回の任務、付き合ってくれ」。',
      mean: 'keep ＋人＋ company ＝ 〜のそばにいて相手をする、付き合う。',
      trap: 'company を聞くと「会社」を思い浮かべやすい。keep me と組むと「一緒にいる」の意味。',
      use: 'Can you keep me company?（ちょっと一緒にいてくれる？）' },

    // why: say again ← "word" heard as asking for the word again; watch your words ← word = 言葉, read literally
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'word', seg: [88.5, 93.7],
      stem: 'What does the one-word reply after “you so funny” mean?',
      choices: ['“Yes, that’s right.”', '“Say that again.”', '“Watch your words.”'], a: 0,
      cue: 'funny のあと、短い一語の返事。',
      line: 'Agent Michael Scarn, you so funny. — *Word.*',
      said: '「あんた最高に面白いね」に、一語で「Word.」と返す。',
      mean: 'Word ＝ 若者言葉の「その通り」「だよな」。同意を示すくだけた返事。',
      trap: 'word を「言葉」と訳すと、言葉づかいの注意に聞こえる。返事の一語なら、同意のことが多い。',
      use: '— That show was great. — Word.（「あの番組よかった」「だよね」）' },

    // R fix: blind 65 %: the scene's premise made "really bad" the only bad verdict; now two choices are mixed (V2)
    // why: good but long ← "two thumbs" without "down" sounds like the stock praise "two thumbs up"; bad but fun ← the
    //   mockumentary's grin heard as fondness
    { id: 'f2', skill: 'phrase', level: 'B1', point: 'thumbs', seg: [93.5, 97.6],
      stem: 'What is the verdict on Michael’s movie in the interview?',
      choices: ['It’s really bad', 'It’s bad but fun', 'It’s good but too long'], a: 0,
      cue: 'Michael’s movie? のすぐあと。最後の一語。',
      line: 'Michael’s movie? *Two thumbs down*.',
      said: '「マイケルの映画？両手の親指を下に」と答える。',
      mean: 'Two thumbs down ＝ 最低の評価。two thumbs up（大絶賛）の逆。',
      trap: 'two thumbs と聞くと、よく聞く up を思い浮かべやすい。最後の down が評価を決める。',
      use: 'I give it two thumbs up.（これは大絶賛）' },

    // R fix: blind 70 %: "would be more comfortable" made "would" the collocation and "should" was odd; "will" in.
    //   The seg now takes in Scarn's "perhaps I would" (to 114.3 s) as evidence (V2/S4)
    // why: could ← only the first consonant differs; will ← "you would" said fast shrinks toward "you'll"
    { id: 's2', skill: 'sound', level: 'B2', point: 'would', seg: [108.1, 114.3],
      stem: 'Fill the gap: “Mr. Scarn, perhaps ___ be more comfortable in my private jet.”',
      choices: ['you would', 'you could', 'you will'], a: 0,
      cue: 'perhaps のあと、be の前。弱く短い2語。',
      line: 'perhaps *you would* be more comfortable in my private jet.',
      said: '「私のジェット機の方が快適でしょう」と誘う。',
      mean: 'you would be more comfortable ＝ 丁寧な誘い。「〜はいかが」。',
      trap: 'would と could は頭の子音だけ違う。w の唇の丸めと、返事の I would が手がかり。',
      use: 'Perhaps you’d prefer a window seat?（窓側の席の方がよろしいですか）' },

    // R fix: blind 70 %: the key was the only choice about the script's content; all three are now (V2/K5)
    // why: Oscar ← Goldenface's private-jet line comes just before; villain ← "downfall of the United States" heard
    //   as a hero who turns bad
    { id: 'g1', skill: 'gist', level: 'B2', point: 'turn', reveals: ['original', 'leftover'], seg: [113.9, 149.3],
      stem: 'What turns the reading sour in the second half?',
      choices: ['The script’s idiot turns out to be written as Dwight',
                'The script’s hero turns out to be a villain at the end',
                'Oscar’s villain gets more attention than Dwight’s hero'], a: 0,
      cue: 'Wait, who’s… のあとの説明。',
      line: 'was *originally named Dwight*, but then Michael changed it…',
      said: 'ばか助手の名前が元はドワイトで、一つだけ置き換え漏れが残っていたと分かる。',
      mean: 'マイケルが脚本でドワイトを笑いものにしていたと知り、場の空気が変わる。',
      trap: '後半には Goldenface など新しい役が出るので、配役の話と思いやすい。問題は名前。',
      use: 'That’s when things went south.（そこから雲行きが怪しくなった）' },

    // R fix: the cue said "luggage", the key's own word (S3)
    // why: jet tickets ← "private jet" just before; "brother" ← a word that *is* said, in the wrong relation
    { id: 'd3', skill: 'detail', level: 'B1', point: 'luggage', seg: [113.9, 122.6],
      stem: 'What does Samuel do that makes Scarn call him an idiot?',
      choices: ['He forgot the luggage', 'He forgot the jet tickets', 'He called Scarn “brother”'], a: 0,
      cue: 'スカーンの命令と、それへの返事。',
      line: 'Sam, get my luggage. — *I forgot it*, brother.',
      said: '「荷物を持ってこい」に「忘れたよ、兄弟」と答える。',
      mean: 'だからスカーンは「お前はバカだ、最悪の助手だ」とののしる。',
      trap: 'brother が耳に残ると、呼び方が原因だと思いやすい。原因は命令への返事の中身。',
      use: 'I forgot my charger.（充電器を忘れちゃった）' },

    // R fix: blind 70 %: the key restated g1 and the distractors were weak; now asks Michael's view of Dwight (V2/K3).
    //   The seg was 23 s; it now ends after "changed it" (S4)
    // why: loyal partner ← sidekick = 相棒, heard without "complete idiot"; hero type ← Dwight reads the lead today
    { id: 'i4', skill: 'infer', level: 'C1', point: 'original', reveals: ['turn'], seg: [125.9, 139.7],
      stem: 'What does the explanation imply about how Michael sees Dwight?',
      choices: ['As a fool who messes everything up', 'As a loyal partner he relies on',
                'As a hero type, a lot like himself'], a: 0,
      cue: 'sidekick の説明と、元の名前。2つをつなげる。',
      line: 'this *complete idiot* who’s causing the downfall… was *originally named Dwight*',
      said: '映画の間ずっと国を滅ぼすばか助手は、元はドワイトという名前だった。',
      mean: 'マイケルはドワイトをモデルにばか役を書いていた。本人は主役を読んでいたのに。',
      trap: 'sidekick（相棒）は良い役に聞こえるが、説明は complete idiot。最後まで聞く。',
      use: 'He’s my sidekick at work.（職場での相棒です）' },

    // R fix: blind 60 %: only the key said "search and replace"; now all three do (K6)
    // why: last page ← "leaving behind one" heard as a forgotten spot; some pages ← "leaving behind" read as a job
    //   left half done
    { id: 'd4', skill: 'detail', level: 'B2', point: 'leftover', seg: [136.7, 147.2],
      stem: 'Why was one “Dwight” still left in the script?',
      choices: ['Search and replace skipped a misspelled one', 'Search and replace missed the last page',
                'Search and replace was run on some pages only'], a: 0,
      cue: 'search and replace のあと、but で始まる部分。',
      line: 'search and replace, but that *doesn’t work on misspelled words*, leaving behind one Dwight.',
      said: '一括置換で名前を変えたが、つづり違いの語には効かず一つ残った。',
      mean: '残ったのはつづりを間違えた箇所。だから後で正しくつづってみせる。',
      trap: 'leaving behind one だけだと単なる見落としに思える。理由は but のあと。',
      use: 'That doesn’t work on my phone.（それ、私の携帯では使えない）' },

    // R fix: blind 75 %: "relieved" and "sleepy" were fillers; new distractors (K3)
    // why: bored ← "I am done" read as "I've had enough of reading"; embarrassed ← the "Oops" just before pinned on him
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'done', seg: [153.5, 157.6],
      stem: 'How does the speaker feel when he stops the reading?',
      choices: ['Hurt and fed up with it', 'Embarrassed and sorry', 'Bored and ready to leave'], a: 0,
      cue: '名前のつづりのあと。短い文が続く調子。',
      line: 'Okay, you know what? *I am done with this*. That’s it. The end.',
      said: '「もういい、こんなのやめだ。以上。おしまい」と打ち切る。',
      mean: 'I am done with this ＝ もう付き合えない。自分がばか役だと知って傷ついている。',
      trap: '直前の Oops を本人の声と取ると、謝りに読める。続く短い文は打ち切りの宣言。',
      use: 'I’m done with this game.（このゲーム、もうやめた）' },

    // why: asking ← "you know what?" taken as a real question (知ってる？); secret ← it often comes before gossip
    { id: 'm2', skill: 'marker', level: 'B2', point: 'youknow', reveals: ['done'], seg: [153.5, 157.6],
      stem: 'Right after the spelled-out name, what does the short opening question signal?',
      choices: ['He is about to announce a decision', 'He is asking if they know the answer',
                'He is about to share a secret'], a: 0,
      cue: 'つづりのあと、文頭の Okay に続く短い問いかけ。',
      line: 'Okay, *you know what?* I am done with this.',
      said: '「よし、あのさ」と前置きしてから、やめると宣言する。',
      mean: 'you know what? は答えを求めない。これから言うこと（ここでは決断）に注意を引く。',
      trap: '「知ってる？」と訳すと質問に聞こえる。答えを待たずに次の文が続くなら前置き。',
      use: 'You know what? Let’s just order pizza.（あのさ、もうピザ頼もう）' },

    // why: Dwight ← the two male voices trade lines fast; Oscar ← he had just read a part, so he may want more
    // retired: the key “Jim” is under 0.8 × the shortest name (K7), and no shorter name fits the scene
    { id: 'w1', skill: 'who', level: 'B2', point: 'keepread', reveals: ['speak'], seg: [153.5, 162.1], retired: true,
      stem: 'After the reading is called off, who says others want to go on?',
      choices: ['Jim', 'Dwight', 'Oscar'], a: 0,
      cue: '答えた人が最後に呼ぶ名前。',
      line: 'Well, *some of us want to keep reading*. — You don’t speak for everyone, *Jim*.',
      said: '「読み続けたい人もいるんだけど」に「全員の代弁をするな、ジム」と返す。',
      mean: '返事の最後の Jim で、続けたいと言ったのがジムだと分かる。',
      trap: '声だけで追うと男性2人の区別が難しい。返事の中の呼びかけの名前を手がかりにする。',
      use: 'Some of us have work to do.（仕事がある人もいるんだよ）' },

    // R fix: blind 55 %: both distractors were weak; new ones (K3)
    // why: admits ← "everyone" heard without "don't"; speak up ← "speak for everyone" heard literally as speaking
    //   so everyone can hear
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'speak', reveals: ['keepread'], seg: [157.3, 162.1],
      stem: 'After someone says others want to keep reading, what does the reply do?',
      choices: ['It rejects his claim to speak for the group', 'It admits most of the group wants to go on',
                'It asks him to speak up so all can hear'], a: 0,
      cue: '返事の文の動詞と、everyone に注目。',
      line: 'Uh, *you don’t speak for everyone*, Jim.',
      said: '「みんなの意見みたいに言うなよ、ジム」と返す。',
      mean: 'speak for ＋人 ＝ 〜を代弁する。「みんな続けたい」とは言わせない、という反論。',
      trap: 'speak を「話す」だけで取ると、声の大きさの話に聞こえる。for ＋人は「〜の代わりに」。',
      use: 'I can only speak for myself.（私個人の意見ですが）' },

    // R fix: blind 55 %: "short break" was weak; the new one reads "outside" as moving the reading (K3)
    // why: celebrate ← fireworks = お祝い; carry on outside ← "come with me outside" heard without "a real show"
    { id: 'i5', skill: 'infer', level: 'B2', point: 'realshow', seg: [161.8, 170.6],
      stem: 'What does the fireworks announcement suggest about the reading?',
      choices: ['He wants to pull everyone away from it', 'He wants to celebrate it finally ending',
                'He wants to carry it on outside instead'], a: 0,
      cue: 'fireworks のあと、show の前の形容詞。',
      line: 'anyone who wants to see *a real show*, come with me outside now.',
      said: '「本物のショーを見たい人は、今すぐ外に来い」と呼びかける。',
      mean: 'a real show で読み合わせを偽物扱いし、みんなを引き抜こうとしている。',
      trap: '花火＝お祝いと考えやすいが、real という比べる語が前の読み合わせを下げている。',
      use: 'Who wants to see something cool?（すごいもの見たい人いる？）' },
  ]
};
