// REVIEW 2026-11-16: pass 10, fix 13, drop 0, new 0; ear checks 1
// Open question: none beyond r1's cut. a1 and w1 came off the ear list: the words settle them (the absurd Miami
//   “confession”; Andy's “we know it's not Jerry”).
// “Andy's Stress Sweating | Parks and Recreation” (the official Parks and Recreation channel, Season 5): Andy, who asked
// his coworkers to steal from his desk so he could practise for the police exam, treats his missing computer as a case;
// he questions suspects, a police officer tells him real police work is mostly writing reports, he thinks of quitting,
// and he is offered a weekend security job with one condition.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 199 s; the captions put “Incorrect” at
// 210.8 s, whisper at 198 s, so h3's segment follows whisper. The officer is named by Andy's “officer” (96.3 s); the
// person who offers the job is never named, so stems avoid naming them. Untested on purpose: 14–16.4 s (“A game is the
// foot”, a garbled saying), 30.6–39.5 s (the glasses lines, and “took my talents to South Beach”, a sports reference),
// 95.6 s (captions “plan”, whisper “play”), 104.6 s (whose “Boom”), 133–136 s (who says “the person who stole his
// positive attitude”, and whose attitude), 137.7–150.4 s (the carpet-store suspect: captions “the way I figure his”).
// EAR CHECK: 184.9 s r1 — the cut falls after “if you take this job” (job 184.7) and before “you must” (you 185.2)
import type { Clip } from '../types.ts';

export const stressSweat: Clip = {
  id: 'stresssweat', video: 'Xh1oUOm6EGQ', title: 'Andy\'s Stress Sweating', dur: 219, wpm: 152, band: 'mid',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: guard ← "practice" and "my desk" caught, "steal" missed (a guard drill is the safer script); prank ← "did
    //   you guys take my glasses too?" right after, the office-prank script
    // R fix: V2 — the key was the only choice with a reason that fit "investigating"; a second "practice" choice
    //   replaces the thief warning
    { id: 'g1', skill: 'gist', level: 'B1', point: 'practice', seg: [4, 28.8],
      stem: 'According to Andy, why would something go missing from his desk?',
      choices: ['He asked coworkers to steal from it, as practice', 'He asked coworkers to guard it, as practice',
                'His coworkers take things from it, as a joke'], a: 0,
      cue: '「a month ago」のあと、何を頼んだか。',
      line: 'I told everyone in the office… they should *steal something from my desk* so I could *practice*.',
      said: '「練習用に、机から何か盗んでくれと全員に頼んだ」と話す。',
      mean: '警察学校の入試に捜査があるので、自分で事件を作ってもらった。だから消えても慌てない。',
      trap: 'glasses の質問から、いつものいたずらに聞こえやすい。so I could のあとが目的。',
      use: 'Quiz me so I can practice.（練習したいから問題出して）' },

    // why: alarm ← "something is different about my computer", and the police report later makes the theft look real;
    //   act ← "Aha" heard as a forced brave face (the Japanese frame of hiding worry)
    // anchor: 9.8–11.2 s "Aha, it's gone"; 22.0–26.4 s to camera "I told everyone… they should steal something from my
    //   desk so I could practice"; 28.0 s "Let's do this": he asked for it, so the missing computer is the start he wanted
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'practice', seg: [4.1, 29],
      stem: 'After his comment to the camera, how should we hear “Aha, it’s gone”?',
      choices: ['As delight: his practice case has finally begun', 'As alarm: a real thief has robbed his desk',
                'As an act: he hides real worry behind a joke'], a: 0,
      cue: '消えたと気づいた一言と、カメラへの説明。',
      line: '*Aha*, it’s gone. … they should steal something from my desk so I could *practice*. … *Let’s do this*.',
      said: '「なくなってる！」と言い、カメラに「練習用に盗んでと頼んでいた」と話して「さあ始めよう」。',
      mean: 'カメラへの説明が、直前の一言を書きかえる。Aha は困った声ではなく「来た！」という喜び。',
      trap: '物が消えたら困るはず、という型で聞きやすい。この形式では、カメラへの一言が答え合わせになる。',
      use: 'Finally, a real case! Let’s do this.（ついに本物の事件だ！さあやるぞ）', retired: true },

    // why: agree ← "see" read as the tag "you see?", asking for a yes; figured out ← "see" heard as "I see" (分かった)
    // R fix: V2 — "look at the desk" was easy to rule out; "asks the viewer to agree" is the nearer misreading
    { id: 'm1', skill: 'marker', level: 'B2', point: 'see', seg: [16.6, 21.8],
      stem: 'As Andy begins explaining to the camera, what does his first word do?',
      choices: ['It signals that an explanation is coming', 'It asks the viewer to agree with him',
                'It shows he has just figured something out'], a: 0,
      cue: 'カメラに向かって話し始める最初の一語。',
      line: '*See*, part of the police academy entrance exam…',
      said: '「ほら、警察学校の入試には…」と説明を始める。',
      mean: '文頭の See ＝「つまりね」「ほら」。これから事情を説明する合図で、見る意味はない。',
      trap: 'see を「でしょ？」や I see の「分かった」と取りやすい。文頭で単独なら説明の前置き。',
      use: 'See, the thing is, I’m broke.（ほら、要するに金欠なんだ）' },

    // why: report ← "report" and "writing stuff down" come later in the clip; catching a thief ← "steal" right after,
    //   the TV-cop script
    { id: 'd1', skill: 'detail', level: 'B1', point: 'exam', seg: [16.6, 21.8],
      stem: 'What does Andy say the police academy entrance exam includes?',
      choices: ['Investigating a crime', 'Writing a crime report', 'Catching a thief'], a: 0,
      cue: '「entrance exam is」のあと。',
      line: 'part of the police academy entrance exam is *investigating a crime*.',
      said: '「警察学校の入試の一部に、事件の捜査がある」と言う。',
      mean: 'investigate ＝ 調べる、捜査する。だから練習用の「事件」が必要だった。',
      trap: '後で報告書の話が出るので混ざりやすい。is のあとの動詞を聞く。',
      use: 'Part of the job is talking to customers.（仕事の一部は接客だ）' },

    // why: slip ← Andy's next line, "you just gave yourself away", and the detailed route sound like a real confession;
    //   real trip ← "Indiana to Miami" heard as travel facts
    // R fix: S4 — the segment was 17.3 s; it now starts at Andy's question (39.7 s)
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'miami', reveals: ['price'], seg: [39.2, 53],
      stem: 'When Andy asks about Miami, how is the reply meant?',
      choices: ['As mockery: agreeing to a silly crime', 'As a slip: confessing without meaning to',
                'As an answer: explaining the real trip'], a: 0,
      cue: '「Yes,」のあと、話の大げささ。',
      line: '*Yes, I took your government computer* from Indiana to Miami *to sell it on the black market* for 150 bucks.',
      said: '「ええ、マイアミまで運んで闇市場で150ドルで売ったの」と答える。',
      mean: 'わざと大げさに認めて、疑いをばかにしている。150ドルのために州をまたぐのが「ありえない」印。',
      trap: 'Yes から始まるので白状に聞こえやすい。話が細かく大げさなほど、皮肉を疑う。',
      use: 'Yes, I ate all twelve donuts. Happy?（ええ、12個全部食べたわよ。満足？）' },

    // why: 50 ← "fifty" caught without "a hundred"; 115 ← fifteen/fifty; 1,500 ← "one fifty" heard as fifteen hundred
    { id: 'n1', skill: 'number', level: 'B1', point: 'price', reveals: ['miami'], seg: [43, 52.7], keep: true,
      stem: 'In the reply about Miami, what price is named for the computer?',
      choices: ['$50', '$115', '$150', '$1,500'], a: 2,
      cue: '最後の「bucks」の前の数字。',
      line: 'to sell it on the black market *for 150 bucks*.',
      said: '「闇市場で150ドルで売るため」。bucks はドルのくだけた言い方。',
      mean: '役所のパソコンをはるばる運んで、たった150ドル。安さも大げさな冗談の一部。',
      trap: 'fifty と fifteen は語尾で区別する。-ty は前、-teen は後ろが強い。',
      use: 'I got it for twenty bucks.（20ドルで買ったよ）' },

    // why: wrong again ← Jerry and Gary sound alike, so "Gary" is heard as the old name; knew it ← "Well, Gary" heard
    //   as "I knew it all along", the rest missed
    // R fix: V2 — "the very name" made the key the only pointed choice; all three now plain, "pretends he knew" added
    { id: 'h1', skill: 'humor', level: 'C1', point: 'gary', seg: [57.5, 69],
      stem: 'Why does Andy’s second “if that even is your real name” get a laugh?',
      choices: ['He doubts the name he was just told', 'He calls the man by the wrong name again',
                'He pretends he knew the real name all along'], a: 0,
      cue: '名前を直されたあとの、Andy の返し。',
      line: 'Jerry, if that even is your real name. — It’s not. My real name is Gary. — Well, *Gary, if that even is your real name*.',
      said: '「ジェリー、本名ならね」「違う、ゲイリーだ」「じゃあゲイリー、本名ならね」。',
      mean: '刑事ドラマの決めぜりふを、今聞いた本名にも使う。疑う意味がないのが笑い。',
      trap: 'Jerry と Gary は似ているが、2回目は正しく Gary と呼ぶ。if 以下を聞く。',
      use: 'Well, if that’s even true…（それが本当ならね…）' },

    // why: eye contact ← "look at me" comes first; real name ← "tell me" plus the "real name" lines just before
    // R fix: V2 — the key was the only absurd "law" against a real right; all three are now Andy-style rules
    { id: 'd2', skill: 'detail', level: 'B2', point: 'legally', seg: [68.7, 78],
      stem: 'What rule does Andy claim the law sets for criminals?',
      choices: ['They have to admit it when asked', 'They have to look a cop in the eye',
                'They have to give a cop their real name'], a: 0,
      cue: '「look at me」のあと、have to に続く部分。',
      line: 'if you’re a criminal, look at me. *You have to tell me*, legally, or else it’s considered entrapment.',
      said: '「犯人ならこっちを見て。法律上言わなきゃいけない」と言う。',
      mean: '本当の法律ではない。聞かれたら名乗り出る義務がある、と思いこんでいる。',
      trap: 'look at me が先に聞こえるので「目を見る」決まりと取りやすい。have to のあとが中身。',
      use: 'You have to tell me the truth.（本当のことを言わなきゃだめ）' },

    // why: relieved ← "oh, man" heard as a sigh of relief (ほっとした); proud ← his "you have to tell me" got an answer,
    //   so his method seems to have worked
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'ohman', reveals: ['notme'], seg: [78.5, 83.3],
      stem: 'When the denial comes, how does Andy take it?',
      choices: ['Let down, since he’s lost a suspect', 'Relieved, since his friend is cleared',
                'Proud, since his questioning worked'], a: 0,
      cue: '「it wasn’t me」への最初の反応。',
      line: 'I’m sorry, Andy, it wasn’t me. — *Oh, man. Really?*',
      said: '「僕じゃない」と言われ、「なんだ、そうなの？」と返す。',
      mean: 'Oh, man ＝ がっかりした時の「あーあ」。犯人が見つかると期待していた。',
      trap: 'Oh, man を安心のため息と取りやすい。英語ではがっかりした時によく使う。',
      use: 'Oh, man. They’re sold out?（あーあ、売り切れ？）' },

    // why: Miami coworker ← the suspect questioned just before; glasses ← another office voice asking Andy questions
    { id: 'w1', skill: 'who', level: 'B1', point: 'notme', seg: [78.5, 86.4],
      stem: 'Who answers “I’m sorry, Andy, it wasn’t me”?',
      choices: ['The man Andy called Jerry', 'The coworker back from Miami', 'The person who asked about glasses'], a: 0,
      cue: '答えの少しあと、名前の出る一言。',
      line: 'I’m sorry, Andy, it wasn’t me. … So we know *it’s not Jerry*…',
      said: '「ごめん、僕じゃない」に、Andy は「ジェリーじゃないと分かった」とまとめる。',
      mean: '直前に問いつめた相手の答え。すぐあとの Andy の一言で確かめられる。',
      trap: '容疑者が何人も出るので、声だけでは混ざりやすい。答えの直後の名前を手がかりに。',
      use: 'Sorry, it wasn’t me. I swear.（ごめん、僕じゃないよ。本当に）' },

    // why: caught Gary ← "unless he was lying to me" heard as a decision that Gary lied; lies himself ← "lying" heard
    //   without "to me"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'lying', reveals: ['notme'], seg: [84.6, 94.3],
      stem: 'Why does Andy’s hope about his “police work” get a laugh?',
      choices: ['Spotting liars is a big part of being a cop', 'He has just caught Gary telling an obvious lie',
                'He admits that he lies to people at work'], a: 0,
      cue: '「I can never tell」と、そのあとの願い。',
      line: 'I *can never tell when people are lying* to me. *Hopefully that doesn’t come up* in my police work.',
      said: '「人の嘘を見抜けたことがない。警察の仕事で困らないといいな」と言う。',
      mean: '嘘を見抜くのは警察の基本。それが苦手なのに、困らないよう願うのが笑い。',
      trap: 'lying から、誰かが嘘をついた話に取りやすい。can never tell ＝ 見分けられない。',
      use: 'I can never tell if he’s joking.（彼が冗談か本気か分からない）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'perimeter', seg: [95.1, 99.6],
      stem: 'Type what Andy says: “We gonna ___, maybe bug a few phones?” (4 words)', answer: 'set up a perimeter',
      cue: '「We gonna」のあと。最初の3語がつながる。',
      line: 'We gonna *set up a perimeter*, maybe bug a few phones?',
      said: '刑事ドラマのように「包囲網を張る？盗聴する？」と言う。',
      mean: 'set up a perimeter ＝ 現場を囲んで封鎖する。set‿up‿a が「セラッパ」のようにつながる。',
      trap: 't が弾んで「ラ」になり、up a も一つに聞こえる。ほどいて4語に。',
      use: 'Let’s set up a meeting.（打ち合わせを設定しよう）' },

    // why: help ← "as a future cop" and the officer's praise of his enthusiasm heard as a welcome; bigger team ←
    //   "launch a massive investigation" heard without "we don't have the kind of money"
    // R fix: V2 — "a trap with a fake computer" was easy to rule out; the near miss is now a bigger team
    { id: 'g2', skill: 'gist', level: 'B2', point: 'paperwork', reveals: ['superhero', 'enthusiasm'], seg: [95.1, 131],
      stem: 'How does the officer’s visit turn out for Andy?',
      choices: ['He’s told police work is mostly writing reports', 'He’s told a bigger team will take over the case',
                'He’s told he can help with the case as a trainee'], a: 0,
      cue: '警官の最後の長い答え。',
      line: 'this is what *most police work is*. Just *writing stuff down*.',
      said: '次々に作戦を出す Andy に、警官は「仕事はほぼ書類書き」と言う。',
      mean: '期待した捜査はなく、報告書を書いて終わり。Andy の警官像が崩れる場面。',
      trap: 'massive investigation から捜査が進むと思いやすい。but のあとを聞く。',
      use: 'Most of the job is paperwork.（仕事のほとんどは書類仕事）' },

    // why: only explosives ← the last and wildest idea heard as the only one turned down; judge ← "bug a few phones"
    //   and the TV-cop script of warrants
    // R fix: V2/K6 — the key carried the scope word "all" against "only"; now "None… / Only… / Most…", all three scoped
    { id: 'i1', skill: 'infer', level: 'B2', point: 'plan', reveals: ['perimeter'], seg: [95.1, 107.8],
      stem: 'What does the officer’s answer suggest about Andy’s ideas?',
      choices: ['None of them will happen for this case', 'Only the explosives one is off the table',
                'Most can happen once a judge says OK'], a: 0,
      cue: '並べた案と、警官の返事の範囲。',
      line: 'set up a perimeter… bug a few phones… *fill it with explosives*… — Yeah, *we’re not doing any of that*.',
      said: '爆弾入りのおとりまで並べる Andy に、警官は「どれもやらない」と言う。',
      mean: 'any of that ＝ そのどれも。パソコン1台に刑事ドラマ級の作戦はない。',
      trap: '最後の爆弾だけが問題に聞こえやすいが、any of that は全部を指す。',
      use: 'Thanks, but we’re not doing any of that.（ありがとう、でもどれもやらないよ）' },

    // why: yes ← "I love your enthusiasm" heard as approval (praise means agreement); asking help ← praise for a keen
    //   helper heard as the start of a request
    // R fix: V2/K5 — the key was the only non-"praising" choice; all three now read "Praising Andy before…"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'enthusiasm', reveals: ['money'], seg: [107.3, 113.3],
      stem: 'When the officer mentions Andy’s enthusiasm, what is the officer doing?',
      choices: ['Praising Andy before saying no', 'Praising Andy before saying yes', 'Praising Andy before asking his help'],
      a: 0,
      cue: 'ほめ言葉のあと、but で何が来るか。',
      line: 'Andy, *I love your enthusiasm, but*…',
      said: '「やる気はうれしいんだけど…」と言い、お金がないと続ける。',
      mean: 'ほめてから but で断る型。I love your enthusiasm は「やる気は買うけど」の前置き。',
      trap: 'love が聞こえると賛成に聞こえやすい。英語でも but のあとが本題。',
      use: 'I love the idea, but not today.（いい考えだけど、今日はやめとこう）' },

    // why: not worth ← "150 bucks" from the Miami joke; no proof ← Andy's practice story (maybe nothing was stolen)
    { id: 'd3', skill: 'detail', level: 'B1', point: 'money', reveals: ['paperwork'], seg: [107.3, 113.3],
      stem: 'What reason does the officer give for not doing more?',
      choices: ['There isn’t the money for it', 'The computer isn’t worth enough', 'There isn’t any proof of a crime'],
      a: 0,
      cue: '「but」のあと、何が足りないと言うか。',
      line: 'we don’t really have *the kind of money* to launch a massive investigation.',
      said: '「大がかりな捜査をするほどのお金はない」と言う。',
      mean: 'the kind of money ＝ それほどのお金。予算がないので、報告書を書くだけになる。',
      trap: '150ドルの話が耳に残っていると「安いから」と取りやすい。警官が言うのは予算の話。',
      use: 'We don’t have that kind of money.（そんなお金はない）' },

    // why: pay ← the money talk just before ("the kind of money"); promotion ← "as a future cop" and "superhero" heard
    //   as rising fast, a status reading
    // R fix: V2 — the stem said "pictures police work", and "far more exciting" was the only fit; now "X, not Y" pairs
    { id: 'i2', skill: 'infer', level: 'C1', point: 'superhero', reveals: ['paperwork'], seg: [119.1, 127.1],
      stem: 'What does the officer suggest Andy expects from the job?',
      choices: ['Action, not paperwork', 'Good pay, not long hours', 'Fast promotion, not training'], a: 0,
      cue: '「writing stuff down」と、それに続く一言。',
      line: 'Just writing stuff down. *It’s not superhero time*.',
      said: '「書類を書くだけ。スーパーヒーローの時間じゃない」と言う。',
      mean: 'Andy は映画のような活躍を思い描いている、という指摘。現実は地味だと伝えている。',
      trap: '直前のお金の話から給料と取りやすい。superhero は書類書きの逆、活躍の比喩。',
      use: 'Sorry, it’s not party time yet.（ごめん、まだお祭りの時間じゃない）' },

    // why: got to ← "oughta" and "gotta" differ only in the first sound; want to ← the "wanna" shape at speed; have to ←
    //   the meaning fits, the vowel doesn't
    { id: 's1', skill: 'sound', level: 'B2', point: 'ought', seg: [127, 131],
      stem: 'Fill the gap: “If it sounds boring, maybe you ___ do something else.”',
      choices: ['ought to', 'got to', 'want to', 'have to'], a: 0,
      cue: 'you のあと、とても短い2音。',
      line: 'maybe you *ought to* do something else.',
      said: '「つまらないと思うなら、別のことをした方がいい」と言う。',
      mean: 'ought to ＝ 〜した方がいい。「オーラ」のように縮み、t は弾む。',
      trap: 'gotta と似て聞こえるが、ought は「オー」で始まる。語頭の母音を聞く。',
      use: 'You ought to see a doctor.（医者に行った方がいいよ）' },

    // why: decide yourself ← "I think you might want to" read as a real choice (the literal hedge, 遠慮); ask the
    //   officer ← "what the policeman said" heard as advice to take the new suspect to him
    // anchor: 150.4–156.2 s "while I appreciate your dedication… you might want to take into account what the policeman
    //   said"; 156.6–162.6 s Andy's reply, "if I can't even investigate bad guys, why become a cop at all?": he heard
    //   "stop investigating"
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'account', seg: [150, 162.9],
      stem: 'Which plain-English version keeps what the reply to Andy’s update means?',
      choices: ['“Drop the case, like the officer said.”', '“Think it over, then decide for yourself.”',
                '“Go and ask the officer about the rug man.”'], a: 0,
      cue: '遠回しな言い方と、Andy の返事。',
      line: 'while I appreciate your dedication… *you might want to take into account what the policeman said*. — if I *can’t even investigate* bad guys…',
      said: '「警官の言ったことも考えたら」と言われ、「捜査もできないなら」と返す。',
      mean: 'you might want to は丁寧な「〜して」。中身は「捜査はやめて」で、Andy もそう受け取った。',
      trap: 'might や I think を本当の迷いと取りやすい。遠回しな言い方は、返事で中身を確かめる。',
      use: 'You might want to check that again.（もう一度確認した方がいいかもね）', retired: true },

    // why: hot ← "sweaty" right after; nervous ← the title's "stress", and sweat as a sign of nerves
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'bummed', seg: [164.8, 168.2],
      stem: 'What does Andy say makes him take his shirt off?',
      choices: ['Feeling down', 'Feeling hot', 'Feeling nervous'], a: 0,
      cue: '「When I get」のあとの2語。',
      line: 'When I get *bummed out*, I take my shirt off because the bad feelings make me feel sweaty.',
      said: '「落ちこむとシャツを脱ぐんだ。いやな気分だと汗が出るから」と言う。',
      mean: 'bummed out ＝ がっかりして落ちこむ。汗は気持ちのせいだと言う。',
      trap: 'sweaty から「暑い」、題名から「緊張」に引かれやすい。get のあとが気持ち。',
      use: 'I’m kind of bummed out today.（今日はちょっと落ちこんでる）' },

    // why: paying ← bail as 保釈金, money paid to the police; putting off ← "maybe I should…" heard as a delay, not a stop
    // R fix: S4 — the segment (2.9 s) ended at 173.2 s, inside "being a cop" (whisper to 174.2 s); now 174.7 s
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'bail', seg: [170.3, 174.7],
      stem: 'What is Andy thinking of doing about becoming a cop?',
      choices: ['Giving up on it', 'Paying to get in', 'Putting it off'], a: 0,
      cue: '「Maybe I should」のあとの動詞。',
      line: 'Maybe I should *bail on* being a cop.',
      said: '「警官になるの、やめようかな」と言う。',
      mean: 'bail on ＝ 途中で投げ出す、すっぽかす。予定や人にも使うくだけた言い方。',
      trap: 'bail を保釈金と取ると「お金を払う」に聞こえる。on のあとの物を投げ出す、と覚える。',
      use: 'Sorry I bailed on you last night.（昨夜はドタキャンしてごめん）' },

    // predict: the segment stops after "if you take this job"; the reveal plays the condition
    // why: perk ← "if you take this job" usually leads to what you get; suits him ← "a way to feel out whether you want
    //   to be a police officer" just before, heard as the pitch going on
    // R fix: V2 — "when he can start" was easy to rule out; "a reason the job suits him" carries on the pitch
    { id: 'r1', skill: 'predict', level: 'B2', point: 'clothes', seg: [179.3, 184.9], then: [184.9, 189.5],
      stem: 'After “keep in mind, if you take this job”, what comes next?',
      choices: ['A rule he will have to follow', 'A perk that comes with the job', 'A reason the job suits him'],
      a: 0,
      cue: '「But keep in mind」がどんな話の前に来るか。',
      line: '*But keep in mind*, if you take this job, *you must* keep your clothes on at all times',
      said: '「ただし受けるなら、常に服を着ていること。悲しくても」と条件をつける。',
      mean: 'But keep in mind ＝「ただし」。良い話に条件を足す合図。',
      trap: 'if you take this job から特典の話を期待しやすい。But なら条件が来る。',
      use: 'Keep in mind, the shop closes at six.（6時に閉まるから気をつけて）' },

    // why: later ← "I get a gun" heard as fine, with only the timing corrected; praise ← "Atta boy" just before,
    //   carried over
    // R fix: V2/K5 — "shuts the idea down" was the only choice that answered "why funny"; all three now "It sounds like…"
    { id: 'h3', skill: 'humor', level: 'C1', point: 'incorrect', seg: [192.7, 199.5],
      stem: 'Why does the one-word reply to Andy’s gun idea get a laugh?',
      choices: ['It sounds like a teacher marking him wrong', 'It sounds like a promise of a gun later',
                'It sounds like more praise after “atta boy”'], a: 0,
      cue: '最後の一語の、答え方の形。',
      line: 'And I get a gun and I can point it in people’s faces. — *Incorrect*.',
      said: '「銃を人に向けられる」と喜ぶ Andy に、「違います」と一言。',
      mean: 'Incorrect はクイズの判定のような言葉。長い説明なしの事務的な一語が笑い。',
      trap: '直前の Atta boy の流れで、ほめ言葉が続くと思いやすい。',
      use: 'Free lunch every day? Incorrect.（毎日ランチ無料？それはない）' },
  ]
};
