// “Dwight Punches Michael  - The Office US” (the official The Office channel, BEST OF SEASON 2): asked whom he could
// beat up, Dwight says Michael; Michael insists he'd win, brags about his tough past, dodges a question about the
// expense reports, tells the camera why bosses like to remind "friends" they could beat them up, then mocks Dwight as
// soft until Dwight agrees to punch him; Dwight tells the camera he never wanted to harm Michael.
// Segments from the captions, words from whisper (2026-11-16). Only Michael and Dwight are named in the audio; the
// others are "a coworker".
// Untested on purpose: 2–6 s ("Roy… Warehouse guy", show knowledge), 37–41 s ("When you're a Jet…", a film
// reference), 54–65 s (wrestling with shouted fragments; captions "sleeper hold / bedtime for Bonzo" vs whisper "Sleep
// or hold / time for blanco"), 89–94 s (a slur-based joke), 102.4 s ("You know a ton of 14-year-old girls?" is only
// played as context, never keyed), 115–118 s ("Bruce Willis…": whisper only), 121–128 s (bleeped and shouted), 133–140 s
// (captions and whisper differ on the closing "Are you okay?" lines).
// REVIEW 2026-11-16: pass 7, fix 16, drop 0, new 0; ear checks 3
// Open: c1's segment is 21.3 s (a C2 talking-head item, inside the 25 s limit); the repo's 3–15 s test may need the
//   C2 exemption.
// EAR CHECK: 8–22 s s2 d3 d5 — assumed Michael says "I don't think that would happen", "Because I would kick his ass",
//   "I'd beat up black belts" and "They told me, after", and Dwight says "'Cause we're friends" (whisper's dashes mark
//   the turns; no name settles them)
// EAR CHECK: 109 s d6 c2 — whisper "No. He cried at the end of it." vs captions "no right at the end of it" (c2's
//   anchor leans on the crying claim; Dwight's "That was because…" stands in both)
// EAR CHECK: 104.5 s h1 — "What belt are they?" is a plain, literal question (not a sarcastic dare)
import type { Clip } from '../types.ts';

export const dwightPunch: Clip = {
  id: 'dwightpunch', video: 'TvJzrKFPm60', title: 'Dwight Punches Michael  - The Office US', dur: 165, wpm: 143,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %, right: the only joke-shaped choice). "Coworkers" became a second "unless", so the
    //   condition itself has to be heard.
    // why: no matter what ← "unless provoked" is quick and easy to drop; armed ← "unless" is caught and the rest
    //   is filled in with the likeliest exception
    { id: 'd1', skill: 'detail', level: 'B1', point: 'provoked', seg: [0, 3.3],
      stem: 'Which people does Dwight say he would not beat up?',
      choices: ['Women or children, unless they start it', 'Women or children, no matter what happens',
                'Women or children, unless they’re armed'], a: 0,
      cue: '文の最初と、最後につく短い条件。',
      line: '*No women or children, unless provoked.*',
      said: '「女性と子どもはやらない。向こうから仕掛けてこない限り」と言う。',
      mean: 'unless provoked ＝ 挑発されない限り。条件つきなのがおかしみ。',
      trap: 'unless 以下は早口で落ちやすい。文末の unless は、例外を足す合図。',
      use: 'No refunds, unless the item is damaged.（破損品以外は返金なし）' },

    // R fix: V2 (blind 60 %, right: the title's punch made the fight reading obvious, §9.4). "Fighting days behind
    //   him" became the "friends" reading, which the title doesn't rule out.
    // why: real danger ← "purple belt" and the belt talk make Dwight sound like the threat (refuted: "worthless",
    //   "Dwight is a wuss"); never hit him ← "I don't think that would happen" and "'cause we're friends" heard as
    //   Michael's point (refuted: "Because I would kick his ass")
    { id: 'g1', skill: 'gist', level: 'B2', point: 'prove', seg: [0, 121.5],
      stem: 'Across the clip, what is Michael trying to prove?',
      choices: ['That he would win a fight against Dwight', 'That Dwight’s belt makes him a real danger',
                'That Dwight would never really hit him'], a: 0,
      cue: '前半の「friends」への返事と、後半の挑発。',
      said: 'Dwight に勝てると言い張り、昔の武勇伝を話し、最後は「殴ってみろ」と迫る。',
      mean: '一貫して、自分の方が強いと示したい。友だちだからという理由は自分で打ち消す。',
      trap: 'belt や friends が残りやすい。誰の強さの話か、何のための話かを聞く。',
      use: 'I could take him in a fight.（あいつにはケンカで勝てる）' },

    // why: too close ← Dwight's "'Cause we're friends" comes just before, from the other voice; too loyal ← the boss
    //   frame: a staff member wouldn't hit the boss
    { id: 'd3', skill: 'detail', level: 'B2', point: 'kick', reveals: ['friends'], seg: [5.4, 13.2],
      stem: 'Why does Michael say Dwight beating him up wouldn’t happen?',
      choices: ['Michael would be the one to win', 'They are too close as friends', 'Dwight is too loyal to his boss'],
      a: 0,
      cue: '「friends」のあと、言い直すように始まる文。',
      line: 'I don’t think that would happen. — ’Cause we’re friends. — *Because I would kick his ass.*',
      said: '「友だちだから」を、Michael が「俺が勝つからだ」と言い直す。',
      mean: 'kick someone’s ass ＝ 打ち負かす（くだけた言い方）。',
      trap: '先の friends を Michael の理由と取りやすい。Because が答え。',
      use: 'I’d beat you at tennis any day.（テニスならいつでも勝てる）' },

    // R fix: V2 (blind 55 %, right: the only short form, the usual answer of a sound item). Four choices on a 2 × 2
    //   grid (’cause / of course × we’re / we were), so each half has to be heard.
    // why: of course ← /kəz/ heard as "course", the agreeing reply; we were ← the weak "we're" stretched into past
    //   tense, as if they no longer are; of course… were ← both slips at once
    { id: 's2', skill: 'sound', level: 'C1', point: 'friends', seg: [8.9, 11.9],
      stem: 'Fill the gap in Dwight’s reply: “___ friends.”',
      choices: ['’Cause we’re', 'Of course we’re', '’Cause we were', 'Of course we were'], a: 0,
      cue: '前の文に続く、短く弱い語のかたまり。',
      line: 'I don’t think that would happen. — *’Cause we’re* friends.',
      said: 'Michael の「それはないな」に続けて「友だちだから」と言う。',
      mean: '’Cause は because の短い形で「カズ」と弱い。we’re も一拍。',
      trap: '「カズ」を course と聞くと同意の返事に、we were なら「昔は友だち」になる。',
      use: 'I’ll go, ’cause you asked.（行くよ、頼まれたから）' },

    // R fix: V2 (blind 55 %, right: the only comic answer). "Saw their belts" became an equally comic, wrong one.
    // why: hard they hit ← "beat up black belts" heard, so the fight itself seems the proof; just before ← "told me"
    //   heard, "after" missed
    { id: 'd5', skill: 'detail', level: 'B1', point: 'after', seg: [15.4, 22.6],
      stem: 'How does Michael say he knew the people he fought were black belts?',
      choices: ['They told him once the fight was over', 'He could tell by how hard they hit',
                'They told him just before the fight began'], a: 0,
      cue: '答えの最後に、少し間をおいて足される一語。',
      line: 'how did you know they were black belts? — They told me, *after*.',
      said: '「なぜ黒帯だと分かった？」に「あとで本人たちが言ってた」と答える。',
      mean: '戦う前は知らなかったということ。勝った話としては、かなりあやしい。',
      trap: 'told me で止めると「前に聞いた」と取りやすい。最後の after まで待つ。',
      use: 'I only found out after.（あとになって知った）' },

    // why: checks ← "see" heard as the tag "you see?", asking if they follow; just realized ← "see" heard as "I see"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'see', seg: [22.2, 29.9],
      stem: 'What does Michael’s first word do as he starts his story?',
      choices: ['It leads into the reason behind his claim', 'It checks that they’re following what he says',
                'It shows he has just realized something'], a: 0,
      cue: '話を始める、文頭の短い一語。',
      line: '*See*, I used to run with a very tough crowd…',
      said: '「黒帯にも勝てる」と言ったあと、「いいか、昔は荒っぽい連中といたんだ」と始める。',
      mean: '文頭の See は「というのもね」。自分の話の根拠を説明し始める合図。',
      trap: 'see を「分かる？」や「なるほど」と取りやすい。文頭の See, は説明の前置き。',
      use: 'See, the thing is, I’m new here.（というのも、ここは初めてで）' },

    // R fix: V2 (blind 60 %, right: "jogging" was the giveaway). It became "train with", the sporty reading of run.
    // why: train ← run = 走る read as a workout, with "street fighter types" right after; manage ← run = 運営する
    //   (run a shop), and the fighters could be people he led
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'crowd', seg: [22.2, 29.9],
      stem: 'How does Michael describe his past at the start of his story?',
      choices: ['He used to hang out with rough people', 'He used to train with street fighters',
                'He used to manage a group of fighters'], a: 0,
      cue: '「used to」のあとの動詞と、そのあとの名詞。',
      line: 'I used to *run with a very tough crowd*, street fighter types…',
      said: '「昔はすごく荒っぽい連中とつるんでいた。ストリートファイター系の」と言う。',
      mean: 'run with a crowd ＝ その仲間とつるむ。crowd は仲間、連中。',
      trap: 'run を「走る」「経営する」と取りやすい。run with ＋人は「つき合う」。',
      use: 'He runs with the wrong crowd.（彼は悪い仲間とつるんでる）' },

    // R fix: V2 (blind 65 %, right): "want… to come across" hinted a gap between aim and effect. The stem now asks
    //   what he does; "sad memory" became "why he quit", the "got out" reading.
    // why: warning ← "I'm just lucky I got out" sounds like a moral (the "don't do what I did" script); quit for
    //   good ← "got out" heard as the point of the story
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'lucky', seg: [22.2, 35.6],
      stem: 'What is Michael doing with his story about his old crowd?',
      choices: ['Showing off how tough he used to be', 'Warning them to stay away from gangs',
                'Explaining why he gave up fighting for good'], a: 0,
      cue: '「lucky」のあと、最後の一文の中身。',
      line: 'real, real bad people. *I’m just lucky I got out.* *Nobody ever messed with* the … rascals *ever again*.',
      said: '「本当に悪い連中だった。抜けられて運が良かった。以来、誰も手を出さなかった」と話す。',
      mean: '反省の形をとった自慢。最後の一文で、恐れられていたと言っている。',
      trap: 'lucky I got out を反省と取りやすい。締めの一文が自慢なら全体も自慢。',
      use: 'Nobody messes with my sister.（妹には誰も手を出せない）' },

    // R fix: V2 (blind 60 %, right: "actually" in the key echoed "really" in the stem). "All taken care of" became a
    //   near miss: signed, only the sending left.
    // why: unsure ← "in theory" read as たぶん / 理論上は (a memory hedge); not sent ← "Yes" taken at face value and
    //   "just need to…" heard as a later step (refuted: "in theory" undoes the "Yes")
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'theory', seg: [39.95, 47.2],
      stem: 'When a coworker asks about the expense reports, what is Michael really saying?',
      choices: ['He hasn’t really signed any of them yet', 'He thinks he signed them, but isn’t sure',
                'He signed them, but hasn’t sent them in'], a: 0,
      cue: '「Yes」のすぐあとにつく二語。',
      line: 'Have you signed the expense reports yet? — Yes. *In theory, I have.* I *just need to*…',
      said: '「署名した？」に「うん。理屈の上ではね。あと少しだけ」と答える。',
      mean: 'in theory ＝ 実際にはまだ。Yes で始めて、やっていないことをぼかす。',
      trap: '「たぶんした」と記憶の話に取りやすい。in theory は「実際には」の反対。',
      use: 'In theory, I’m on vacation.（一応、休暇中なんだけどね）' },

    // anchor: 42.8–46.4 s "Yes. In theory, I have. I just need to cross some T's and dot some I's" — "in theory" sets
    //   theory against fact, and "just need to" leaves the job undone, so the reply must address unsigned reports
    // why: send them ← "Yes" taken as the answer (the thank-you frame); which ones ← "some" heard as some of the
    //   reports (refuted: he claims all, "in theory", and the T's and I's are tiny marks, not whole reports)
    { id: 'c3', skill: 'pragma', level: 'C2', point: 'theory', seg: [39.95, 47.2],
      stem: 'Which reply from the coworker would match what Michael really meant?',
      choices: ['So they’re still not signed, then?', 'Great, so I can send them in now?',
                'Okay, which ones still need signing?'], a: 0,
      cue: '「Yes」に何がついたかと、そのあとの言いわけ。',
      line: 'Yes. *In theory, I have.* I *just need to* cross some T’s and dot some I’s.',
      said: '「はい。理屈の上では。あとは細かいところを仕上げるだけ」と明るく答える。',
      mean: 'Yes と決まり文句で包んでいるが、中身は「まだ」。分かった人は「まだなの？」と返す。',
      trap: 'Yes に合わせてお礼や段取りで返しやすい。返事は言葉の形でなく実際の状態に。some は書類の数ではない。',
      use: 'So that’s a no, then?（つまり、まだってこと？）' },

    // R fix: V2 (blind 50 %, right: the key was the only summary-style choice). All three now name a thing left on
    //   the forms.
    // why: spelling ← T's and I's are letters, read literally (a typo check); signatures ← "signed" in the question,
    //   so "some" sounds like more names to add
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'tees', seg: [43.0, 47.4],
      stem: 'After “In theory, I have,” what does Michael say is left to do?',
      choices: ['Some tiny details on the forms', 'Some spelling mistakes on the forms', 'Some signatures left on the forms'],
      a: 0,
      cue: '「just need to」のあと、二つの動詞と文字。',
      line: 'I just need to *cross some T’s and dot some I’s*.',
      said: '「あとは t の横棒と i の点だけ」と言う。',
      mean: 'ふつうは dot the i’s and cross the t’s で「細部まで仕上げる」。順番が逆。',
      trap: '文字の話なので、つづりの直しと取りやすい。文字の決まり文句は比ゆが多い。',
      use: 'Let’s dot the i’s and cross the t’s.（最後の細かい確認をしよう）' },

    // anchor: 71.2–84.3 s "sometimes your best friends start coming into work late… dentist appointments that aren't
    //   dentist appointments, and that is when it's nice to let them know that you could beat them up"
    // why: rough play ← "We're all best friends" and "I love everybody here" taken at face value; attack ← "beat them
    //   up" turned around, as if he fears them (right words, wrong direction)
    { id: 'c1', skill: 'infer', level: 'C2', point: 'dentist', seg: [65.05, 86.3],
      stem: 'After his comment to the camera, what is Michael’s fight talk really for?',
      choices: ['Reminding slacking staff who is in charge', 'Showing that close friends can play rough',
                'Preparing in case a coworker turns on him'], a: 0,
      cue: '「But sometimes」のあと、どんな時にそう伝えるか。',
      line: 'We’re all best friends… *But sometimes* your best friends *start coming into work late*… that is when it’s nice to *let them know that you could beat them up*.',
      said: '「みんな親友」のあと、遅刻や怪しい歯医者が始まったら「勝てると知らせるのがいい」と話す。',
      mean: 'カメラへの本音が場面のケンカ話を書きかえる。じゃれ合いでなく、さぼる部下へのにらみ。',
      trap: 'best friends を前提にじゃれ合いと取りやすい。But のあとの本音で、誰に何を伝えるかが決まる。',
      use: 'Just so you know, I notice these things.（念のため、ちゃんと見てるからね）' },

    // R fix: V2 (blind 65 %, right): "suggesting" in the stem told the reader to look for a hidden meaning. The stem
    //   is now neutral; "booked at bad times" became "too many", the reading of "start having".
    // why: late ← "coming into work late" is said right before, so it seems the problem is the time; too many ←
    //   "start having dentist appointments" heard as a sudden run of real ones
    { id: 'i1', skill: 'infer', level: 'C1', point: 'dentist', seg: [70.7, 80.4],
      stem: 'What does Michael say about some coworkers’ dentist appointments?',
      choices: ['They are cover for going somewhere else', 'They make people come into work late',
                'They are real, but there are too many'], a: 0,
      cue: '同じ言葉が二回、あとのほうにつく打ち消し。',
      line: 'start having *dentist appointments that aren’t dentist appointments*',
      said: '「歯医者の予約、でも歯医者じゃない予約を入れ始める」とカメラに話す。',
      mean: '歯医者を口実に、別の場所へ行っているということ。くり返しで「名目だけ」と示す。',
      trap: 'late の話に引っぱられやすい。A that isn’t A は「Aのふりをした別物」。',
      use: 'a meeting that isn’t really a meeting（名ばかりの会議）' },

    // R fix: V2 (blind 55 %, right): next to an excuse, "can" and "could" were ruled out by meaning. All three are
    //   now refusals, told apart by sound only; the notes follow.
    // why: couldn't ← k- + a swallowed -n't, the polite past form; won't ← the same -n't ending and a refusal
    { id: 's1', skill: 'sound', level: 'B2', point: 'manicure', seg: [84.35, 89.0],
      stem: 'Fill the gap in the reply: “I ___, ’cause, uh, I just got a manicure.”',
      choices: ['can’t', 'couldn’t', 'won’t'], a: 0,
      cue: '返事の最初、I のすぐあとの一語の長さ。',
      line: 'Just hit me. You’ll see. — I *can’t*, ’cause, uh, I just got a manicure, so…',
      said: '「殴ってみろ」に「無理です、ネイルしたばかりなので」と返す。',
      mean: 'can’t は t が消え「キャーン」と一拍。couldn’t は「クドゥン」、won’t は「ウォウン」。',
      trap: 't が消えるとどれも「〜ン」で終わる。最初の母音と拍の数で聞き分ける。',
      use: 'I can’t, I’m driving tonight.（無理なんだ、今夜は運転するから）' },

    // R fix: V2 (blind 70 %, right: "a real injury" isn't what a manicure is). It became the sincere reading of the
    //   manicure, so the key has to be heard in the "uh" and the trailing "so…".
    // why: wait ← "so…" trailing off heard as "so, give me a moment" (the Japanese soft-pending reply); new nails ←
    //   the manicure taken as a sincere reason (sincerity flip)
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'manicure', seg: [84.35, 89.0],
      stem: 'What is the coworker doing with his reply to “Just hit me”?',
      choices: ['Turning Michael down with a made-up excuse', 'Agreeing, but asking him to wait a little',
                'Turning Michael down to protect his new nails'], a: 0,
      cue: '返事の最初の語と、理由の重さ。',
      line: 'Just hit me. — I can’t, ’cause, uh, I *just got a manicure*, so…',
      said: '「殴れ」と言われ、「ネイルしたばかりなので」と理由をつけて断る。',
      mean: 'わざと軽い理由での断り。本気で殴る気はないと、冗談で伝えている。',
      trap: '語尾の so… を「ちょっと待って」と取りやすい。小さすぎる理由は、冗談の「ノー」。',
      use: 'I can’t, I just washed my hair.（無理、髪洗ったばかりだから）' },

    // R fix: V2 (blind 55 %, right: "show off his belt" was weak). It became Michael's own "Just hit me. You'll see",
    //   said to someone else and outside the segment.
    // why: orders ← Michael pushes for a hit all along ("Go ahead. Do it." just before), so it seems he commands it;
    //   take the hit ← "Just hit me. You'll see." earlier, to the coworker
    { id: 'g2', skill: 'gist', level: 'B2', point: 'taunt', seg: [95.4, 120.5],
      stem: 'Why does Dwight finally agree to punch Michael?',
      choices: ['Michael keeps mocking him as soft and weak', 'Michael orders him to do it, as his boss',
                'Michael insists he can easily take a hit'], a: 0,
      cue: 'Dwight が「OK」と言う直前の、Michael の言葉。',
      said: '「殴らせても意味がない」「あいつは弱虫」とからかい続け、最後に Dwight が応じる。',
      mean: '命令ではなく、挑発に乗った形。弱いと言われ続け、引けなくなった。',
      trap: 'Michael は殴られたがっているので命令に聞こえやすい。OK の直前の言葉を聞く。',
      use: 'Fine, you asked for it.（いいよ、そっちが言ったんだからね）' },

    // R fix: S4 (100.4 s cut "a ton of"); it now ends after "girls".
    { id: 'x1', skill: 'dict', level: 'B2', point: 'worthless', seg: [96.9, 101.55],
      stem: 'Type what Michael says: “Well, that would be ___.” (3 words)', answer: 'kind of worthless',
      cue: '「would be」のあと、三語がつながる。',
      line: 'Well, that would be *kind of worthless*, because…',
      said: '「Dwight に殴らせても、あまり意味がない」と言う。',
      mean: 'kind of は「ちょっと」とぼかす言い方。kind‿of が「カインダ」とつながる。',
      trap: 'of がほぼ消えて二語に聞こえやすい。kinda と聞こえたら kind of と書く。',
      use: 'That’s kind of a long walk.（ちょっと歩くには遠いね）' },

    // why: four ← "four" alone is caught; fifteen ← fif-/four- blur in fast speech; forty ← -teen/-ty
    { id: 'n1', skill: 'number', level: 'B1', point: 'fourteen', seg: [96.9, 102.35], keep: true,
      stem: 'How old are the girls Michael says could beat Dwight?',
      choices: ['Four', 'Fourteen', 'Fifteen', 'Forty'], a: 1,
      cue: '「a ton of」のあとの数。',
      line: 'I know a ton of *14*-year-old girls that could kick his ass.',
      said: '「あいつに勝てる14歳の女の子なら山ほど知ってる」と言う。',
      mean: 'Dwight の弱さを言うための大げさな言い方。a ton of ＝ たくさんの。',
      trap: 'fourteen と forty は似て聞こえる。強さが後ろの teen にあれば14、前なら40。',
      use: 'I have a ton of work today.（今日は仕事が山ほどある）' },

    // R fix: V2 (blind 50 %, right: the key was the only specific choice). All three now say how he treats the
    //   insult.
    // why: jokes along ← the Japanese face-saving frame: laugh it off so the teasing doesn't sting; dare ← "What belt"
    //   heard as a challenge, after the coworker's "You know a ton of 14-year-old girls?"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'belt', seg: [99.45, 105.3],
      stem: 'Why does Dwight’s question about the girls get a laugh?',
      choices: ['He treats the insult as a real question of skill', 'He treats the insult as a joke and plays along',
                'He treats the insult as a dare to name the girls'], a: 0,
      cue: 'Dwight が気にしているのは、話のどの部分か。',
      line: '…girls that could kick his ass. — … — *What belt are they?*',
      said: '「14歳の子でも勝てる」とけなされ、Dwight は「何帯？」と聞く。',
      mean: 'けなされたことより、相手の段位を本気で気にしている。悪口を試合の話として受けるのがおかしい。',
      trap: '言い返しや照れかくしと取りやすい。聞いているのは帯の色だけで、反論の語がない。',
      use: 'Wait, what level are they?（待って、どのくらいのレベル？）' },

    // why: film ended ← "at the end of it" and "midnight" mixed; alone ← New Year's Eve heard as a lonely night
    //   (refuted: "When we rented…")
    { id: 'd6', skill: 'detail', level: 'B1', point: 'armageddon', seg: [105.3, 115.6],
      stem: 'What reason does Dwight give for that night with the movie?',
      choices: ['It started to snow right at midnight on New Year’s Eve', 'The film ended right at midnight on New Year’s Eve',
                'He was all alone that night, on New Year’s Eve'], a: 0,
      cue: '「That was because」のあと、二つ目の出来事。',
      line: 'That was because it was New Year’s Eve, and *it started to snow at exactly midnight*.',
      said: '「大みそかで、ちょうど0時に雪が降り始めたからだ」と言い返す。',
      mean: '映画のせいではないと言いたい。exactly midnight ＝ ちょうど夜12時。',
      trap: 'end と midnight が近く、映画の終わりと混ざりやすい。and のあとを聞く。',
      use: 'It started to rain right at noon.（ちょうど正午に雨が降り出した）' },

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

    // why: sorry ← the Japanese apology frame: a comment after hurting someone heard as an apology; proud ← the usual
    //   tough-guy script after a punch
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'harm', seg: [126.8, 133.2],
      stem: 'In his comment to the camera after the punch, how does Dwight sound?',
      choices: ['Defensive, denying he meant any harm', 'Sorry, admitting he went too far',
                'Proud of how hard he was able to hit'], a: 0,
      cue: '自分への二つの質問と、その答え。',
      line: '*Did I want to harm Michael?* The one man I’ve been hired to protect? *No, I did not.*',
      said: '「Michael を傷つけたかったか？守るべき人を？いいや」と自分で問い、自分で答える。',
      mean: '自問自答で「わざとではない」と言い張っている。謝罪ではなく弁明。',
      trap: '日本語の感覚だと反省の言葉に聞こえやすい。sorry がなく、No で終わるなら弁明。',
      use: 'Did I mean to break it? No.（わざと壊した？まさか）' },

    // R fix: S4 (129.0 s cut "Michael"); it now starts before "Did I".
    { id: 'x2', skill: 'dict', level: 'B2', point: 'hired', seg: [127.0, 131.9],
      stem: 'Type what Dwight says: “The one man ___ to protect?” (3 words)', answer: "i've been hired",
      cue: '「The one man」のあと、三語がつながる。',
      line: "The one man *I've been hired* to protect?",
      said: '「守るために雇われている、その人を？」と言う。',
      mean: 'I’ve been hired ＝ 雇われている（今もその役目）。I’ve の ’ve は「ヴ」だけ。',
      trap: '’ve が消えて I been に聞こえやすい。been の前には have が隠れている。',
      use: 'I’ve been asked to help out.（手伝うよう頼まれてるんだ）' },
  ]
};
