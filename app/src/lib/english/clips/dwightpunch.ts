// ESL REVIEW 2026-11-28: keep 16, fix 2, retire 0, new 0 (p1: a choice in Michael's voice like the others; k2: the trap quoted
// a line after the segment)
// R4 REVIEW 2026-11-18: keep 12, rewrite 5, retire 2, new 2, ctx 4, tx 1, qa 9
// A2 REVIEW 2026-11-17: keep 4, rewrite 15, retire 3, new 0
// “Dwight Punches Michael  - The Office US” (the official The Office channel, BEST OF SEASON 2): asked whom he could
// beat up, Dwight says Michael; Michael insists he'd win, brags about his tough past, dodges a question about the
// expense reports, tells the camera why bosses like to remind "friends" they could beat them up, then mocks Dwight as
// soft until Dwight agrees to punch him; Dwight tells the camera he never wanted to harm Michael.
// Segments from the captions, words from whisper (2026-11-16). Only Michael and Dwight are named in the audio; the
// others are "a coworker". Untested on purpose: 2–6 s, 37–41 s, 54–64 s (wrestling), 115–118 s, 121–128 s (bleeped
// and shouted), 133–140 s. Lines that quote "kick his ass" are trimmed in `line`.
// EXCLUDE 89.1–94.3: a slur-based joke ("queer… Queer Eye")
// EAR CHECK: 8–22 s s2 d5 — assumed Michael says "I don't think that would happen" and "They told me, after", and
//   Dwight says "'Cause we're friends" (whisper's dashes mark the turns; no name settles them)
// EAR CHECK: 109 s d6 — whisper "No. He cried at the end of it." vs captions "no right at the end of it" (Dwight's
//   "That was because…" stands in both)
// EXCLUDE 10.2–13.1: swear (“Because I would kick his ass”)
// EXCLUDE 101.6–102.5: swear (“that could kick his ass”)
// CHECKS 2026-11-28: segment ends pulled 0.4 s before the EXCLUDE they ran into (the player plays on 0.4 s): p2 s1 x1
// n1; started earlier to keep the minimum length after that: p2.
// CHECKS 2026-11-28: blind check: f1 f2 p2 rewritten so listening decides.
import type { Clip } from '../types.ts';

export const dwightPunch: Clip = {
  id: 'dwightpunch', video: 'TvJzrKFPm60', title: 'Dwight Punches Michael  - The Office US', dur: 165, wpm: 143,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    { id: 'd1', skill: 'detail', level: 'B1', point: 'provoked', seg: [0, 3.7],
      stem: 'When would Dwight fight women or children?', ja: 'ドワイトは、どんなとき女性や子どもとも戦う？',
      choices: ['Only if they start it', 'Never, no matter what', 'Only if they are armed'], a: 0,
      choicesJa: ['向こうから仕掛けてきたときだけ', 'どんなときも絶対にしない', '武器を持っているときだけ'],
      cue: '文の最後の条件',
      line: '*No women or children, unless provoked.*',
      said: '「女性と子どもはやらない。向こうから仕掛けてこない限り」と言う。',
      mean: 'unless 〜 ＝ 〜でない限り。provoked ＝ 挑発された。条件つきなのがおかしい。',
      trap: 'No women or children で止めると、絶対しないと思いやすい。最後の unless が例外。',
      use: 'No refunds, unless the item is damaged.（破損品以外は返金なし）' },

    // why: too close ← Dwight's "'Cause we're friends" comes just before, from the other voice; too loyal ← the boss
    //   frame: a staff member wouldn't hit the boss
    { id: 'd3', skill: 'detail', level: 'B2', point: 'kick', reveals: ['friends'], seg: [5.4, 13.2], retired: true,
      stem: 'Why does Michael say Dwight beating him up wouldn’t happen?',
      choices: ['Michael would be the one to win', 'They are too close as friends', 'Dwight is too loyal to his boss'],
      a: 0,
      cue: '「friends」のあと、言い直すように始まる文。',
      line: 'I don’t think that would happen. — ’Cause we’re friends. — *Because I would kick his ass.*',
      said: '「友だちだから」を、Michael が「俺が勝つからだ」と言い直す。',
      mean: 'kick someone’s ass ＝ 打ち負かす（くだけた言い方）。',
      trap: '先の friends を Michael の理由と取りやすい。Because が答え。',
      use: 'I’d beat you at tennis any day.（テニスならいつでも勝てる）' },

    { id: 's2', skill: 'sound', level: 'B2', point: 'friends', seg: [5.8, 13.5], retired: true,
      stem: 'Fill the gap: “___ friends.”', ja: '空所に入るのは？ “___ friends.”',
      choices: ['’Cause we’re', 'Of course we’re', '’Cause we were'], a: 0,
      choicesJa: ['だって〜だから', 'もちろん〜だ', 'だって〜だったから'],
      cue: '前の文に続く、短く弱いかたまり',
      line: 'I don’t think that would happen. — *’Cause we’re* friends.',
      said: 'マイケルの「それはないな」に続けて「友だちだから」と言う。',
      mean: '’Cause は because の短い形で「カズ」と弱い。we’re も一拍。',
      trap: 'Of course なら「オブコース」と長い。we were なら「ワー」が2回。短い「カズウィア」なら ’Cause we’re。',
      use: 'I’ll go, ’cause you asked.（行くよ、頼まれたから）' },

    { id: 'g1', skill: 'gist', level: 'B1', point: 'prove', seg: [13.1, 37.6],
      stem: 'What does Michael keep saying about himself?', ja: 'マイケルは自分のことを何度も何と言う？',
      choices: ['He’s a tough fighter', 'Dwight is much stronger', 'He never fights'], a: 0,
      choicesJa: ['自分はケンカが強い', 'ドワイトの方がずっと強い', '自分はケンカをしない'],
      cue: '黒帯の話と、昔の話',
      line: 'So? *I’d beat up black belts*, yeah. … I used to run with a *very tough crowd*',
      said: '黒帯にも勝ったと言い張り、昔は荒っぽい連中といたと話す。',
      mean: '一貫して、自分はケンカが強いと言いたい。',
      trap: 'belt（帯）が耳に残りやすい。誰が強いという話かを聞く。',
      use: 'I could beat you at tennis.（テニスなら君に勝てるよ）' },

    { id: 'd5', skill: 'detail', level: 'B1', point: 'after', ctx: true, seg: [16.5, 23.5],
      stem: 'When did Michael learn they were black belts?', ja: 'マイケルは、相手が黒帯だといつ知った？',
      choices: ['After the fight', 'During the fight', 'Before the fight'], a: 0,
      choicesJa: ['ケンカのあと', 'ケンカの最中', 'ケンカの前'],
      cue: '答えの最後の一語',
      line: 'Coworker: And how did you know there were black belts? / Michael: They told me, *after*.',
      said: '「なぜ黒帯だと分かった？」に「あとで本人たちが言ってた」と答える。',
      mean: 'after ＝ あとで。戦う前は知らなかった。勝った話としては、かなりあやしい。',
      trap: 'They told me で止めると、前に聞いた話に聞こえる。最後の after まで待つ。',
      use: 'I only found out after.（あとになって知った）' },

    { id: 'm1', retired: true, skill: 'marker', level: 'B2', point: 'see', seg: [20.3, 32.3],
      stem: 'Why does Michael say “See,” here?', ja: 'マイケルはなぜ、ここで「See,」と言う？',
      choices: ['To start his reason', 'To ask if they can see', 'To show he is surprised'], a: 0,
      choicesJa: ['理由を話し始めるため', '見えるか聞くため', '驚きを示すため'],
      cue: '話を始める最初の一語',
      line: '*See*, I used to run with a very tough crowd…',
      said: '「黒帯にも勝てる」と言ったあと、「いいか、昔は荒っぽい連中といたんだ」と始める。',
      mean: '文の頭の See, は「というのもね、いいかい」。自分の話の理由を説明し始める合図。',
      trap: 'see から「見る」「分かる？」と思いやすい。文の頭の See, は説明の前置き。',
      use: 'See, I grew up in a small town.（というのも、小さな町で育ったから）' },

    { id: 'f1', skill: 'phrase', level: 'B2', point: 'crowd', seg: [22.2, 32.3],
      stem: 'What does Michael say about his past?', ja: 'マイケルは自分の昔について何と言う？',
      choices: ['He hung out with rough people', 'He trained to be a boxer', 'He ran every day back then'], a: 0,
      choicesJa: ['荒っぽい連中とつるんでいた', 'ボクサーになる練習をした', '当時は毎日走っていた'],
      cue: '「used to」のあと',
      line: 'I used to *run with a very tough crowd*, street fighter types…',
      said: '「昔はすごく荒っぽい連中とつるんでいた。ストリートファイター系の」と言う。',
      mean: 'run with 〜 ＝ 文字どおりは「〜と一緒に走る」→ いつも一緒に動く＝つるむ。crowd ＝ 連中。tough ＝ 荒っぽい。',
      trap: 'run を「走る」と考えがち。run with ＋人は「〜とつるむ」。',
      use: 'He runs with the wrong crowd.（彼は悪い仲間とつるんでる）' },

    { id: 'a1', skill: 'attitude', level: 'B1', point: 'lucky', seg: [25.5, 36],
      stem: 'How does Michael tell his old-crowd story?', ja: 'マイケルは昔の仲間の話を、どんなふうに話す？',
      choices: ['Proudly, showing off', 'Sadly, with regret', 'Angrily, as a warning'], a: 0,
      choicesJa: ['得意げに、自慢して', '悲しそうに、後悔して', '怒って、警告として'],
      cue: '「lucky」のあとの最後の一文',
      line: 'real, real bad people. *I’m just lucky I got out.* *Nobody ever messed with* the … rascals *ever again*.',
      said: '「本当に悪い連中だった。抜けられて運が良かった。以来、誰も手を出さなかった」と話す。',
      mean: 'mess with 〜 ＝ 〜にちょっかいを出す。反省のふりをした自慢で、最後は恐れられていたと言う。',
      trap: 'lucky I got out（抜けられてよかった）を後悔だと思いやすい。最後の一文は自慢。',
      use: 'Nobody messes with my sister.（妹には誰も手を出せない）' },

    // anchor: 42.8–46.4 s "Yes. In theory, I have. I just need to cross some T's and dot some I's" — "in theory" sets
    //   theory against fact, and "just need to" leaves the job undone, so the reply must address unsigned reports
    // why: send them ← "Yes" taken as the answer (the thank-you frame); which ones ← "some" heard as some of the
    //   reports (refuted: he claims all, "in theory", and the T's and I's are tiny marks, not whole reports)
    { id: 'c3', skill: 'pragma', level: 'C2', point: 'theory', seg: [39.95, 47.2], retired: true,
      stem: 'Which reply from the coworker would match what Michael really meant?',
      choices: ['So they’re still not signed, then?', 'Great, so I can send them in now?',
                'Okay, which ones still need signing?'], a: 0,
      cue: '「Yes」に何がついたかと、そのあとの言いわけ。',
      line: 'Yes. *In theory, I have.* I *just need to* cross some T’s and dot some I’s.',
      said: '「はい。理屈の上では。あとは細かいところを仕上げるだけ」と明るく答える。',
      mean: 'Yes と決まり文句で包んでいるが、中身は「まだ」。分かった人は「まだなの？」と返す。',
      trap: 'Yes に合わせてお礼や段取りで返しやすい。返事は言葉の形でなく実際の状態に。some は書類の数ではない。',
      use: 'So that’s a no, then?（つまり、まだってこと？）' },

    { id: 'p1', skill: 'pragma', level: 'B2', point: 'theory', ctx: true, seg: [40.5, 48.6],
      stem: 'What does Michael mean by “In theory, I have”?', ja: 'マイケルの “In theory, I have” はどういう意味？',
      choices: ['Not really, not yet', 'Yes, all done', 'I can’t really remember'], a: 0,
      choicesJa: ['本当はまだ', 'はい、全部終わった', '覚えていない'],
      cue: '「Yes」のすぐあとの二語',
      line: 'Coworker: Have you signed the expense reports yet? / Michael: Yes. *In theory, I have.* I *just need to* cross some T’s…',
      said: '「署名した？」に「うん。理屈の上ではね。あと少しだけ」と答える。',
      mean: 'in theory ＝ 理屈の上では（実際はまだ）。Yes で始めて、やっていないことをぼかす。',
      trap: 'Yes で始まるので、終わったと考えがち。in theory（理屈の上では）は「実際はまだ」。',
      use: 'In theory, I’m on vacation.（一応、休暇中なんだけどね）' },

    { id: 'f2', skill: 'phrase', level: 'B2', point: 'tees', seg: [42.7, 47.7],
      stem: 'What does Michael say is left to do?', ja: 'マイケルは、あと何が残っていると言う？',
      choices: ['Only a few small details', 'Fix some spelling mistakes', 'Find the missing reports'], a: 0,
      choicesJa: ['細かいところが少しだけ', 'つづりのまちがいを直す', 'なくした書類を探す'],
      cue: '「just need to」のあと',
      line: 'I just need to *cross some T’s and dot some I’s*.',
      said: '「あとは細かいところ（t の横棒と i の点）だけ」と言う。',
      mean: 'cross the t’s and dot the i’s ＝ t の横棒、i の点まで書く→細かいところまで仕上げる。the でなく some なのがいい加減。',
      trap: '文字の話なので、つづりを直すと考えがち。文字の決まり文句は「細かい仕上げ」のたとえ。',
      use: 'Let’s dot the i’s and cross the t’s.（最後の細かい確認をしよう）' },

    { id: 'k1', skill: 'detail', level: 'B1', point: 'office', seg: [48.6, 54.5],
      stem: 'Where does Michael say he’ll be?', ja: 'マイケルは、自分はどこにいると言う？',
      choices: ['In his office', 'In the warehouse', 'At the dentist'], a: 0,
      choicesJa: ['自分の部屋', '倉庫', '歯医者'],
      cue: 'All right のあと',
      line: 'All right. I am going to be *in my office* if anybody needs me.',
      said: '署名の話から逃げるように、「何かあったら、私は部屋にいるから」と言う。',
      mean: 'if anybody needs me ＝ 用があれば。話を切り上げてその場を離れるときの決まり文句。',
      trap: 'warehouse（倉庫）は前に出た Roy の話。in my のあとを聞く。',
      use: 'I’ll be in my office if you need me.（用があれば部屋にいます）' },

    { id: 'k2', skill: 'detail', level: 'B1', point: 'bestfriends', reveals: ['dentist'], seg: [64.5, 72.0],
      stem: 'What does Michael say about everyone in the office?', ja: '職場のみんなについて、マイケルは何と言う？',
      choices: ['They’re all his best friends', 'They all come in late', 'They’re all afraid of him'], a: 0,
      choicesJa: ['全員が大親友', '全員が遅刻してくる', '全員が彼をこわがっている'],
      cue: 'カメラへの最初の言葉',
      line: 'I’m friends with everybody in this office. *We’re all best friends.* I love everybody here.',
      said: 'カメラに「この職場の全員と友だちだ。みんな大親友。全員が大好きだ」と話す。',
      mean: 'best friends ＝ 大親友。このあと But sometimes（でも時々）と、なぐる話につなげる前置き。',
      trap: 'このあと殴る話になるので、こわがられていると考えがち。最初の We’re all best friends を聞く。',
      use: 'We’re all good friends here.（ここではみんな仲がいいんです）' },

    // anchor: 71.2–84.3 s "sometimes your best friends start coming into work late… dentist appointments that aren't
    //   dentist appointments, and that is when it's nice to let them know that you could beat them up"
    // why: rough play ← "We're all best friends" and "I love everybody here" taken at face value; attack ← "beat them
    //   up" turned around, as if he fears them (right words, wrong direction)
    { id: 'c1', skill: 'infer', level: 'C2', point: 'dentist', seg: [65.05, 86.3], retired: true,
      stem: 'After his comment to the camera, what is Michael’s fight talk really for?',
      choices: ['Reminding slacking staff who is in charge', 'Showing that close friends can play rough',
                'Preparing in case a coworker turns on him'], a: 0,
      cue: '「But sometimes」のあと、どんな時にそう伝えるか。',
      line: 'We’re all best friends… *But sometimes* your best friends *start coming into work late*… that is when it’s nice to *let them know that you could beat them up*.',
      said: '「みんな親友」のあと、遅刻や怪しい歯医者が始まったら「勝てると知らせるのがいい」と話す。',
      mean: 'カメラへの本音が場面のケンカ話を書きかえる。じゃれ合いでなく、さぼる部下へのにらみ。',
      trap: 'best friends を前提にじゃれ合いと取りやすい。But のあとの本音で、誰に何を伝えるかが決まる。',
      use: 'Just so you know, I notice these things.（念のため、ちゃんと見てるからね）' },

    { id: 'i1', skill: 'infer', level: 'B2', point: 'dentist', seg: [74.3, 86.3],
      stem: 'What does Michael say about some dentist appointments?', ja: 'マイケルは、一部の歯医者の予約について何と言う？',
      choices: ['They are fake excuses', 'They make people late', 'They are real but too many'], a: 0,
      choicesJa: ['うその口実', '人を遅刻させる', '本物だけど多すぎる'],
      cue: '同じ言葉が二回',
      line: 'start having *dentist appointments that aren’t dentist appointments*',
      said: '「歯医者の予約、でも歯医者じゃない予約を入れ始める」とカメラに話す。',
      mean: 'A that isn’t A ＝ A のふりをした別物。歯医者を口実に、別の場所へ行っているということ。',
      trap: '前の coming in late に引っぱられやすい。that aren’t のあとの同じ言葉で「名前だけ」と分かる。',
      use: 'It was a meeting that wasn’t really a meeting.（名ばかりの会議だった）' },

    { id: 'p2', skill: 'pragma', level: 'B1', point: 'manicure', ctx: true, seg: [82.7, 88.7],
      stem: 'How does the coworker answer “Just hit me”?', ja: '「Just hit me」に、同僚はどう答える？',
      choices: ['Refuses with a small excuse', 'Agrees and hits him lightly', 'Agrees to do it after lunch'], a: 0,
      choicesJa: ['軽い理由をつけて断る', '引き受けて軽く殴る', '昼休みのあとならと引き受ける'],
      cue: '「Just hit me」への返事',
      line: 'Michael: Just hit me. You’ll see. / Coworker: I can’t, ’cause, uh, I *just got a manicure*, so…',
      said: '「殴れ」と言われ、「ネイルしたばかりなので」と理由をつけて断る。',
      mean: 'I can’t, ’cause 〜 ＝ 無理、〜だから。わざと軽い理由で、冗談まじりに断っている。',
      trap: '最後の so… で言葉を濁すので、あとでならやると勘違いしやすい。I can’t で始まれば断り。',
      use: 'I can’t, I just washed my hair.（無理、髪洗ったばかりだから）' },

    { id: 's1', skill: 'sound', level: 'B1', point: 'manicure', seg: [83.5, 88.7],
      stem: 'Fill the gap: “I ___, ’cause, uh, I just got a manicure.”', ja: '空所に入るのは？ “I ___, ’cause, uh, I just got a manicure.”',
      choices: ['can’t', 'couldn’t', 'won’t'], a: 0,
      choicesJa: ['できない', 'できなかった', 'しない'],
      cue: 'I のすぐあと',
      line: 'Just hit me. You’ll see. — I *can’t*, ’cause, uh, I just got a manicure, so…',
      said: '「殴ってみろ」に「無理です、ネイルしたばかりなので」と返す。',
      mean: 'can’t は t が消え「キャーン」と一拍。couldn’t は「クドゥン」、won’t は「ウォウン」。',
      trap: 't が消えると、どれも「〜ン」で終わる。最初の母音「キャ」と、一拍かどうかで聞き分ける。',
      use: 'I can’t, I’m driving tonight.（無理なんだ、今夜は運転するから）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'worthless', seg: [95.9, 101.2],
      stem: 'Type what Michael says: “Well, that would be ___.” (3 words)', ja: '書こう：“Well, that would be ___.”（3語）',
      answer: 'kind of worthless',
      cue: '「would be」のあと',
      line: 'Well, that would be *kind of worthless*, because…',
      said: '「ドワイトに殴らせても、あまり意味がない」と言う。',
      mean: 'kind of ＝ ちょっと、わりと。kind of が「カインダ」とつながる。worthless ＝ 意味がない。',
      trap: 'of がほぼ消えて、二語に聞こえやすい。kinda と聞こえたら kind of と書く。',
      use: 'That’s kind of a long walk.（歩くにはちょっと遠いね）' },

    { id: 'n1', skill: 'number', level: 'B1', point: 'fourteen', seg: [96.9, 101.2], keep: true,
      stem: 'How old are the girls Michael talks about?', ja: 'マイケルが話す女の子たちは何歳？',
      choices: ['4', '14', '15', '40'], a: 1,
      choicesJa: ['4歳', '14歳', '15歳', '40歳'],
      cue: '「a ton of」のあと',
      line: 'I know a ton of *14*-year-old girls that could…',
      said: '「あいつに勝てる14歳の女の子なら山ほど知ってる」と言う。',
      mean: 'a ton of 〜 ＝ たくさんの〜。ドワイトの弱さを言うための大げさな言い方。',
      trap: '4 なら「フォー」だけ、40 なら前が強い「フォーティ」、15 は「フィフ」。後ろの「ティーン」が長ければ14。',
      use: 'I have a ton of work today.（今日は仕事が山ほどある）' },

    { id: 'h1', retired: true, skill: 'humor', level: 'B1', point: 'belt', seg: [99.45, 105.3],
      stem: 'What does Dwight ask about the girls?', ja: 'ドワイトは、女の子たちについて何を聞く？',
      choices: ['What belt they have', 'How old they are', 'Where the girls live'], a: 0,
      choicesJa: ['何帯か', '何歳か', 'どこに住んでいるか'],
      cue: 'けなされたあとの短い質問',
      line: '…girls that could… — … — *What belt are they?*',
      said: '「14歳の子でも勝てる」とけなされ、ドワイトは「何帯？」と聞く。',
      mean: 'belt ＝ 空手などの帯（黒帯など）。けなされたことより、相手の強さを本気で気にしているのが笑い。',
      trap: '年齢の話が出たあとなので、何歳かを聞いたと思いやすい。belt を聞く。',
      use: 'What level are you?（どのレベル？）' },

    { id: 'g2', skill: 'gist', level: 'B2', point: 'taunt', seg: [104.0, 121.0],
      stem: 'Why does Dwight finally agree to punch Michael?', ja: 'ドワイトはなぜ、最後にマイケルを殴ることにする？',
      choices: ['Michael keeps calling him weak', 'Michael gives him an order', 'A coworker asks him to'], a: 0,
      choicesJa: ['弱虫と言われ続けたから', '命令されたから', '同僚に頼まれたから'],
      cue: '「OK」の直前のマイケルの言葉',
      line: 'Look, *Dwight is a wuss*. … — Okay. I’ll punch you.',
      said: '「殴らせても意味がない」「あいつは弱虫」とからかい続け、最後にドワイトが応じる。',
      mean: 'wuss ＝ 弱虫（くだけた言い方）。命令ではなく、からかわれて引けなくなった。',
      trap: 'マイケルが殴られたがっているので、命令と考えがち。直前の Dwight is a wuss を聞く。',
      use: 'Fine, you asked for it.（いいよ、そっちが言ったんだからね）' },

    // anchor: 105.8–114.6 s "Dwight is a wuss… Michael, I told you. That was because it was New Year's Eve, and it
    //   started to snow at exactly midnight" — "That was because" explains the tears instead of denying them
    // why: Michael ← "I told you" heard as Dwight winning the exchange, so Michael's story falls apart (right
    //   mechanism, wrong target; refuted: the explanation itself is what admits the tears); nobody ← snow at midnight
    //   on New Year's Eve taken as a fair, moving reason (sincerity flip)
    // R fix: V2 (blind 55 %, right: the key was the only specific choice). Both distractors now name a mechanism.
    { id: 'c2', skill: 'humor', level: 'C2', point: 'armageddon', seg: [105.3, 115.6],
      stem: 'When Dwight explains the movie night, who is the joke on, and why?',
      choices: ['Dwight: his excuse admits the tears, for a softer reason', 'Michael: his story falls apart once Dwight explains',
                'Nobody: snow at midnight is a fair reason to tear up'], a: 0,
      cue: '「That was because」が、何を認めているか。',
      line: 'Dwight is a *wuss*… — Michael, I told you. *That was because* it was New Year’s Eve, and it started to *snow at exactly midnight*.',
      said: '弱虫と言われ、Dwight は「あれは大みそかで、0時ちょうどに雪が降ったからだ」と説明する。',
      mean: '理由を言うことで、泣いたこと自体は認めている。しかも理由がもっと感傷的で、弱虫説を強める。',
      trap: '言い返しなので Michael の負けと取りやすい。否定でなく理由を言ったら、事実は認めている。',
      use: 'I only cried because of the music.（泣いたのは音楽のせいだけ）', retired: true },

    { id: 'd6', skill: 'detail', level: 'B1', point: 'armageddon', ctx: true, seg: [108.9, 116.4],
      stem: 'Why did Dwight cry that night, he says?', ja: 'ドワイトによると、あの夜泣いたのはなぜ？',
      choices: ['It began to snow at midnight', 'The film ended at midnight', 'He was alone that night'], a: 0,
      choicesJa: ['夜中の12時に雪が降り出した', '映画が夜中の12時に終わった', 'その夜は一人だった'],
      cue: '「That was because」のあと',
      line: 'Michael: He cried at the end of it. / Dwight: Michael, I told you. That was because it was New Year’s Eve, and *it started to snow at exactly midnight*.',
      said: '「大みそかで、ちょうど0時に雪が降り始めたからだ」と言い返す。',
      mean: 'Armageddon ＝ 最後に主人公が死ぬ、泣ける映画。exactly midnight ＝ ちょうど夜12時。映画のせいではないと言いたい。',
      trap: '映画の話なので、映画が終わったからだと思いやすい。and のあとの snow を聞く。',
      use: 'It started to rain right at noon.（ちょうど正午に雨が降り出した）' },

    { id: 'a2', skill: 'attitude', level: 'B2', point: 'harm', seg: [125.8, 136.7],
      stem: 'What does Dwight say about the punch?', ja: 'ドワイトはパンチについて何と言う？',
      choices: ['He meant no harm', 'He is sorry for it', 'He is proud of it'], a: 0,
      choicesJa: ['傷つけるつもりはなかった', '悪かったと思っている', '殴ったのが自慢だ'],
      cue: '自分への二つの質問と答え',
      line: '*Did I want to harm Michael?* The one man I’ve been hired to protect? *No, I did not.*',
      said: '「マイケルを傷つけたかったか？守るべき人を？いいや」と自分で聞き、自分で答える。',
      mean: 'harm ＝ 傷つける。自分で質問して自分で答え、「わざとではない」と言い張っている。謝ってはいない。',
      trap: '反省しているように思いやすい。sorry がなく、No, I did not で終わる。',
      use: 'I didn’t mean to hurt you.（傷つけるつもりはなかった）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'hired', seg: [127, 133.8],
      stem: 'Type what Dwight says: “The one man ___ to protect?” (3 words)', ja: '書こう：“The one man ___ to protect?”（3語）',
      answer: "i've been hired",
      cue: '「The one man」のあと',
      line: 'The one man *I’ve been hired* to protect?',
      said: '「守るために雇われている、その人を？」と言う。',
      mean: 'I’ve been hired ＝ 雇われている（今もその役目）。I’ve の ’ve は「ヴ」だけ。',
      trap: '’ve が消えて I been に聞こえやすい。been の前には have が隠れている。',
      use: 'I’ve been asked to help out.（手伝うよう頼まれてるんだ）' },
  ]
};
