// REVIEW 2026-11-16: pass 4, fix 19, drop 0, new 0; ear checks 1
// OPEN: the macchiato/Jitters lines (122–135 s) are assumed Melissa's; n1 now says "the speaker", a3 rests on "Ryan, you are so dorky".
// “BOY HAVE YOU LOST YOUR MIND - The Office US” (the official The Office channel, Best of Season 2): Take Your
// Daughter to Work Day. Pam hopes to get better with kids, Michael dreads having them around, then misjudges Stanley's
// daughter Melissa's age; Melissa chases Ryan, and after Dwight's tip Stanley warns Ryan off.
// Segments from the captions, words from whisper (2026-11-16). Whisper's timings drift after ≈ 84 s and it loops
// ("Jitters… really cool coffee place" 109–133 s, "I don't know" 149–155 s): all times here are the captions'.
// Untested on purpose: the Janet Jackson / "nasty" bit (17–28 s), Hansel and Gretel (14 s, world knowledge), "stone
// cold fox" (98–103 s), "sniffing around her" (156–170 s), and "I work with a bunch of nerds" (84.6 s, speaker unclear).
// The sources differ at 57.8 s ("they're" / "you're cool"), 59.9 s ("should just really" / "should be fine"), 129.8 s
// ("you ever been" / "you've been"), 161.4 s ("Yes, sir" in whisper only) and 171.5 s ("He finally yelled" / "Stanley
// yelled"): no key or line rests on them.
// EAR CHECK: 107.4 s a2 — key reads Michael's flat “Oh.” and the repeated “extraordinary” as flustered cover (tone)
import type { Clip } from '../types.ts';

export const boyHaveYouLostYourMind: Clip = {
  id: 'lostmind', video: 'tWjQ6RedwYM', title: 'BOY HAVE YOU LOST YOUR MIND', dur: 198, wpm: 186, band: 'fast',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: key was the only hedged choice ("may"); all three now "It hints…" (V2/K6)
    // why: correcting ← the common "Actually, no…" use; for real ← actually read as 実際に (it's really happening)
    { id: 'm2', skill: 'marker', level: 'B2', point: 'actually', seg: [0, 8.3],
      stem: 'In Pam’s first sentence, what does the word before “looking forward” add?',
      choices: ['It hints that her eagerness is a surprise', 'It hints she’s correcting an earlier remark',
                'It hints the day is finally here for real'], a: 0,
      cue: '最初の一文と、すぐ次の一文を比べて。',
      line: 'I am *actually* looking forward to Take Your Daughter to Work Day. I am not great with kids',
      said: '「実は楽しみにしている」と言い、すぐ「子どもは得意じゃない」と続ける。',
      mean: 'actually ＝ 意外かもしれないけど。苦手なのに楽しみ、という意外さ。',
      trap: 'actually は反論の「いや実は」にも使うが、ここは最初の一言で、反論の相手がいない。',
      use: 'I’m actually enjoying this.（意外と楽しんでる）' },

    // R fix: "candy party" was a filler and the key the only choice with kids present; now a school visit (V2/K3)
    // why: class ← "not great with kids… want to get better"; school visit ← children all over the office, "middle school" later
    { id: 'g1', skill: 'gist', level: 'B1', point: 'day', seg: [0, 177],
      stem: 'What is going on at the office in this clip?',
      choices: ['Staff members’ kids are spending the day there', 'Staff members are taking a class on kids',
                'A school class is visiting the office for the day'], a: 0,
      cue: '最初の一文で、何の日かを聞いて。',
      line: '…looking forward to *Take Your Daughter to Work Day*.',
      said: '最初に「娘を職場に連れてくる日」が楽しみだと話す。一日、子どもたちがオフィスにいる。',
      mean: '大人たちが、それぞれのやり方で子どもに向き合う一日の話。',
      trap: '子どもが大勢いるので学校の見学と取りやすい。最初の一文の daughter で日を確かめる。',
      use: 'Are you bringing your kids to work?（子どもを職場に連れてくる？）' },

    // why: daughter ← "Take Your Daughter to Work Day" just before; job ← "get better" read as job training
    { id: 'd2', skill: 'detail', level: 'B1', point: 'married', seg: [2.9, 8.3],
      stem: 'Why does Pam want to get better with kids?',
      choices: ['She is getting married soon', 'She has a daughter starting school', 'She is starting a job with kids'],
      a: 0,
      cue: '「get better」のすぐあと、理由の部分。',
      line: 'I want to get better *because I’m getting married*.',
      said: '「子どもは得意じゃないけど、上達したい。結婚するから」と話す。',
      mean: '結婚すれば、いずれ子どもと関わる。今日はその練習の場。',
      trap: '直前の Daughter から「自分の娘」を想像しやすいが、娘の話はしていない。理由は because のあと。',
      use: 'I want to get better at cooking.（料理がうまくなりたい）' },

    // R fix: "keep the kids quiet" was weak against the key; now "keep them happy while people work" (V2)
    // why: happy while people work ← the usual "keep the kids busy" workplace script; as they leave ← "put out" heard as "out" (a send-off)
    { id: 'd1', skill: 'detail', level: 'B1', point: 'candy', seg: [8.3, 13],
      stem: 'Why has Pam put extra candy on her desk?',
      choices: ['To get the kids to come and talk to her', 'To keep the kids happy while people work',
                'To give the kids a treat as they leave'], a: 0,
      cue: '「on my desk」のあと、so 以下の目的。',
      line: 'I put out a bunch of extra candy on my desk *so the kids will come talk to me*.',
      said: '机にお菓子を多めに置いた。子どもたちが話しに来てくれるように、と言う。',
      mean: 'so ＋ 文 ＝「〜するように」。お菓子で子どもを呼び寄せる作戦。',
      trap: 'put out の out や、職場の「静かにさせる」発想に引かれやすい。so のあとが目的。',
      use: 'I put snacks out for visitors.（来客用にお菓子を出した）' },

    // R fix: an absolute ("not even once") only in a distractor, and the key the only two-part choice; now parallel (K6)
    // why: never told ← "Is that today?" alone sounds like news to him; thrilled ← "Oh, God" heard as excitement, and
    //   Michael says he likes kids
    { id: 'i1', skill: 'infer', level: 'B2', point: 'forgot', seg: [29.4, 33.2],
      stem: 'When told how to behave today, what does Michael’s reply show?',
      choices: ['He forgot, even though he was reminded', 'He was never told, so it’s news to him',
                'He is thrilled, as he says he loves kids'], a: 0,
      cue: '彼の質問と、それへの返事の両方を聞いて。',
      line: 'Oh, God. *Is that today?* — *I reminded you last night.*',
      said: '「え、今日だっけ？」と驚き、相手は「昨日の夜言ったでしょ」と返す。',
      mean: '前の晩に念を押されたのに忘れていた。準備なしで子どもの日を迎える。',
      trap: 'Oh, God は喜びではなく「しまった」。返事の reminded まで聞くと、忘れていたと分かる。',
      use: 'Wait, is that today?（え、それ今日だっけ？）' },

    // R fix: "hear him out" broke the parallel form; now "a plus, then another plus", for a listener who misses "but" (V2/K5)
    // why: reversed ← the order of the two halves flips; two pluses ← "but" lost, so "not a kid's environment" is missed
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'likebut', reveals: ['rrated'], seg: [32.9, 41.7],
      stem: 'When Michael starts talking to the camera, what does his first sentence do?',
      choices: ['Grants a plus, then gets to his real problem', 'Admits a problem, then gets to the good part',
                'Grants a plus, then adds one more good point'], a: 0,
      cue: '文頭の一語と、but の前後を比べて。',
      line: 'Listen, *I like kids, but* this is not a kid’s environment.',
      said: '「いいかい、子どもは好きだ。でもここは子ども向けの場所じゃない」と言う。',
      mean: 'I like X, but… ＝ まず認めてから本題。言いたいのは but のあと。',
      trap: 'Listen は「聞いて」の頼みではなく話の切り出し。本音は but のあと。',
      use: 'I like the idea, but it’s too expensive.（いい案だけど、高すぎる）' },

    // R fix: "kids find the office dull" was weak; now kids getting in the way of work, the usual office script (V2)
    // why: dislike ← "not great with kids" from Pam's talking head; in the way ← "not a kid's environment" read as "kids disturb work"
    { id: 'd3', skill: 'detail', level: 'B2', point: 'rrated', seg: [32.9, 47.9],
      stem: 'What worries Michael about having the kids around?',
      choices: ['He may say things not fit for children', 'He doesn’t really enjoy being around kids',
                'The kids may get in the way of the work'], a: 0,
      cue: '映画のレーティングの話をするあたり。',
      line: 'Who knows *what I’m going to say*? Crazy stuff. And it is *R rated*.',
      said: '「何を言い出すか分からない。とんでもないことを。R指定なんだ」と話す。',
      mean: '自分の話は大人向けで、子どもの前で口がすべりそう、という心配。',
      trap: '前の「子どもは得意じゃない」と混ざりやすいが、彼は I like kids と言う。心配は自分の口。',
      use: 'Sorry, that wasn’t kid-friendly.（ごめん、子ども向けじゃなかった）' },

    // R fix: "stay out" was weak; now "fine as they are", the Japanese 「大丈夫です」 = no-thanks reading; seg runs on to "Hi,
    // children" (64.2), which refutes it (V2/S4)
    // why: gladly ← "fine" = good (katakana ファイン); fine as they are ← Japanese frame: 大丈夫 = no need
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'fine', seg: [58.3, 64.2],
      stem: 'When reminded of his role as the boss, how does Michael answer?',
      choices: ['Grudgingly, giving in to stop the pushing', 'Gladly, as if it was his idea all along',
                'Politely, saying things are fine as they are'], a: 0,
      cue: '相手の話の途中から、同じ一語のくり返し。',
      line: 'Michael, I think that as the boss you should… — *Fine, fine, fine.*',
      said: '「ボスとして…」と言われ、最後まで聞かずに「わかった、わかった」と返す。',
      mean: 'Fine を何度も重ねると「もういい、やるよ」。しぶしぶ折れている。',
      trap: 'fine を「いいね」や「大丈夫」と取りやすい。くり返しと、さえぎる言い方は不満のサイン。',
      use: 'Fine, fine, I’ll do it.（わかったよ、やるってば）' },

    // R fix: "never heard of Superman" was a filler; now "insists he's right", the usual stubborn-boss script (V2/K3)
    // why: insults staff ← "the people who work here are like…" heard as a setup for a dig; insists ← "Okay" heard as
    //   brushing the kid off
    { id: 'h1', skill: 'humor', level: 'C1', point: 'batman', seg: [69.2, 83.9],
      stem: 'What makes Michael’s superhero comparison funny?',
      choices: ['His heroes get mixed up, so he just picks another', 'He calls the staff heroes, then makes fun of them',
                'A kid corrects him, but he insists he’s right'], a: 0,
      cue: '「Gotham City」の直後の、短い返事。',
      line: 'I’m like *Superman*… citizens of *Gotham City*. — *That’s Batman.* — Okay, I’m *Aquaman*.',
      said: 'スーパーマンにたとえるが「それはバットマン」と直され、アクアマンに言い直す。',
      mean: '偉さを見せたいのに、たとえが崩れ、適当に別のヒーローに乗りかえる。',
      trap: 'citizens を「ヒーロー」と取ると別の話になる。短い一言がたとえへのツッコミ。',
      use: 'Okay, bad example.（今のはたとえが悪かった）' },

    // why: Ryan chases ← Stanley's warning taken as fact; Dwight ← his "something fishy" tip read as him stepping in
    { id: 'g2', skill: 'gist', level: 'B2', point: 'melissa', reveals: ['dorky'], seg: [90.9, 177],
      stem: 'How does the storyline with Stanley’s daughter go?',
      choices: ['Melissa chases Ryan, and her dad scares him off', 'Ryan chases Melissa, and her dad scares him off',
                'Melissa chases Ryan, and Dwight tells her off'], a: 0,
      cue: '番号を聞くのは誰か、怒るのは誰か。',
      said: '娘が Ryan に番号を聞き、報告を受けた父が Ryan をどなりつける。',
      mean: '追いかけているのは娘の方。でも父の怒りは Ryan に向く、というずれ。',
      trap: '父の警告を事実と取ると、Ryan が追っていたように見える。誰が誰に頼んだかで判断。',
      use: 'Stay away from my daughter.（うちの娘に近づくな）' },

    // why: eighteen ← “eighth gr-” heard as “eigh-teen”; eleventh ← a high-school year, still far from “frat boys”
    { id: 'n2', skill: 'number', level: 'B1', point: 'grade', seg: [102.55, 107.95], keep: true,
      stem: 'What does Melissa say when Michael mentions frat boys?',
      choices: ['I’m in eighth grade', 'I’m in eleventh grade', 'I’m eighteen'], a: 0,
      cue: '「frat boys」のすぐあと、短い一文。',
      line: 'Better keep the frat boys away from her. — I’m in *eighth grade*.',
      said: '「大学の男子に注意」と言われ、本人が「中学2年です」と返す。',
      mean: 'eighth grade ＝ 中学2年。大学生とは全然合わない。',
      trap: 'eighth grade がつながると eighteen に聞こえやすい。-teen なら語尾が強い。',
      use: 'My son is in third grade.（息子は小学3年です）' },

    // R fix: distractors were blunt; both now say what he does next, like the key (V2/K5)
    // why: impressed ← "amazing… extraordinary" taken at face value; annoyed ← the flat "Oh." heard as irritation
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'oops', reveals: ['grade'], seg: [105.5, 113.85],
      stem: 'How does Michael come across in his reply to Melissa’s answer?',
      choices: ['Caught out, and talking to cover it', 'Impressed, and keen to hear about her school',
                'Annoyed, and trying to wrap the talk up'], a: 0,
      cue: '「Oh.」のあと、同じ語をくり返すところ。',
      line: 'Oh. She’s in middle school. Yeah, middle school’s *amazing*. It is *extraordinary*.',
      said: '「あ、中学生か。中学はすごいよ。すばらしい。すばらしい時期だ」と続ける。',
      mean: '年を大きく勘違いした気まずさを、大げさなほめ言葉でごまかす。',
      trap: 'amazing を文字通り取ると、ほめ言葉に思える。短い Oh. と同じ語のくり返しは動揺のサイン。',
      use: 'Oh. Well, that’s… great.（あ、えっと…いいね）' },

    // R fix: "an example" was weak; now "a milder way of saying the same problem", a softener reading of "just" (V2)
    // why: second problem ← "just" read as "also, on top"; milder ← "just" read as a softener on the same point
    { id: 'm1', skill: 'marker', level: 'B2', point: 'notthat', seg: [113.7, 118.9],
      stem: 'After Michael says what the problem is not, what does his next sentence give?',
      choices: ['What he claims is the real reason', 'A second problem on top of that one',
                'A milder way of saying the same problem'],
      a: 0,
      cue: '「It’s not that…」の次の文の頭。',
      line: 'It’s not that children make me uncomfortable. *It’s just that* why be a dad…',
      said: '「子どもが苦手なわけじゃない。ただ、父親になる必要ある？」と話す。',
      mean: 'not that と just that の対で「Aではなく本当はB」と理由を示す。',
      trap: 'just を「さらに」と取ると、問題が一つ増えたように聞こえる。',
      use: 'It’s not that I’m busy, it’s just…（忙しいわけじゃなくて、ただ…）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'uncle', seg: [113.7, 118.9],
      stem: 'Type what he says: “…when you can be a ___?” (2 words)', answer: 'fun uncle',
      cue: '「when you can be a」のあと。',
      line: 'why be a dad when you can be a *fun uncle*?',
      said: '「父親になるより、楽しいおじさんでいればいい」と言う。',
      mean: 'fun uncle ＝ たまに遊んでくれる楽しいおじさん。責任は軽い。',
      trap: 'fun と uncle がつながり「ファナンコー」。un が一つの音に聞こえやすい。',
      use: 'He’s the fun uncle at parties.（彼はパーティーで楽しいおじさん役）' },

    // R fix: "a father himself" was weak; now "a dad, but a fun one", a keyword trap on dad + fun (V2)
    // why: fun dad ← "dad" and "fun" both heard, the "why be" lost; strict ← "rebelling against" read as wanting to be obeyed
    { id: 'i3', skill: 'infer', level: 'C1', point: 'rebel', reveals: ['uncle', 'notthat'], seg: [113.7, 122],
      stem: 'What does Michael’s talking head about kids suggest he really wants?',
      choices: ['The fun of kids without the hard parts', 'To be a dad, but a really fun one',
                'To be the strict one kids respect'], a: 0,
      cue: '「rebelling against」のあとまで聞いて。',
      line: 'why be a dad when you can be a fun uncle? I’ve never heard of anyone *rebelling against their fun uncle*.',
      said: '「父親より楽しいおじさんがいい。おじさんに反抗する子なんていない」と言う。',
      mean: '楽しいところだけ取り、しつけや反抗期の苦労は避けたい本音。',
      trap: 'dad が聞こえるので父親になりたい話と取りやすい。why be a dad は「なる必要ない」の反語。',
      use: 'Why pay more when you can rent?（借りられるのに、なぜ高く払う？）' },

    // R fix: neither source names who says the macchiato line; the stem no longer names Melissa (S1, ear-check rule)
    // why: dozen ← a realistic number expected; thousand ← hundred/thousand swap
    { id: 'n1', skill: 'number', level: 'B1', point: 'macchiato', seg: [121.75, 126.5], keep: true,
      stem: 'How many iced drinks does the speaker claim to have a day?',
      choices: ['About a dozen', 'About a hundred', 'About a thousand'], a: 1,
      cue: '「I drink like」のあと。',
      line: 'I drink *like a hundred* iced macchiatos a day and practically nothing else.',
      said: '「1日100杯くらいアイスマキアートを飲む」と話す。',
      mean: 'like ＋ 数字 ＝「〜くらい」。大人っぽく見せる大げさな言い方。',
      trap: 'a も hundred の -dred も弱い。thousand なら「サウ」の音がある。like は「好き」ではない。',
      use: 'I walked like ten miles today.（今日10マイルくらい歩いた）' },

    // R fix: distractors were thin; now "mocks him and drops it" and "shocked, says he has to go" (V2)
    // why: drops it ← "so dorky" read as a real insult; has to go ← "You've never been to Jitters?" heard as urging him to go
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'dorky', reveals: ['gimme'], seg: [132.35, 139.3],
      stem: 'When Ryan says he hasn’t been to the coffee place, how does Melissa react?',
      choices: ['She teases him, as a way to flirt', 'She mocks him, then drops the subject',
                'She’s shocked and says he has to go'], a: 0,
      cue: '悪口のすぐあと、彼女が何を頼むか。',
      line: 'Ryan, you are *so dorky*. *Give me your number* so I can text you.',
      said: '「行ったことないの？ダサい」と言い、すぐに「番号教えて」と迫る。',
      mean: '軽くけなすのは、気を引くためのからかい。本気で嫌ならすぐ番号は聞かない。',
      trap: 'dorky を本気の悪口と取りやすい。けなした直後の頼みごとで、気持ちが分かる。',
      use: 'You’re such a nerd. I love it.（オタクだね。そこがいい）' },

    // R fix: "so I can text you" in the stem ruled out "Give him your"; the stem now stops after "number" (V2/S2)
    // why: the ← weak "your" ≈ "yer", close to "the"; him ← "gimme" and "give 'im" both lose a sound
    { id: 's1', skill: 'sound', level: 'B2', point: 'gimme', seg: [136.3, 139.5],
      stem: 'Fill the gap: “___ number…”',
      choices: ['Give me your', 'Give me the', 'Give him your'], a: 0,
      cue: '文の最初、つながった短い音。',
      line: '*Give me your* number so I can text you.',
      said: '「番号教えて、メッセージ送るから」と言う。',
      mean: 'Give me your が「ギミヨア」のように一続き。me と your はとても弱い。',
      trap: 'give him も h が落ちて「ギヴィム」になる。「ミ」か「イム」か、母音の形で聞き分ける。',
      use: 'Give me your email, I’ll send it.（メール教えて、送るから）' },

    // R fix: key was strictly the longest and the only nuanced choice; trimmed and rebalanced (V2/K6)
    // why: as well ← "Can I have…" heard as an extra request after a yes; too young ← what Stanley later says, moved
    //   to Ryan
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'email', seg: [136.3, 145.8],
      stem: 'When pushed for his phone number, what is Ryan’s reply doing?',
      choices: ['Dodging, by offering a less personal contact', 'Agreeing, and asking for her email too',
                'Refusing, and saying she is much too young'], a: 0,
      cue: '「Um」と「Come on」のあと、彼の返事。',
      line: 'Come on. — *Can I have an email address?*',
      said: '「番号教えて」と迫られ、迷ってから「メールアドレスでもいい？」と返す。',
      mean: '番号は避けて、もっと距離のある連絡先を出す。断らずにかわす言い方。',
      trap: 'Can I have… は普通のお願いで、乗り気に聞こえやすい。Um の間と番号を出さない点に注目。',
      use: 'Could we do email instead?（メールでもいいですか）' },

    // R fix: the key was the only generic tip; all three now "… a bit …" (V2/K5)
    // why: smells ← "fishy" taken literally (魚くさい); lazy ← the usual office tattling script
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'fishy', seg: [145.8, 155],
      stem: 'What does Dwight tell Stanley is going on?',
      choices: ['Something seems a bit suspicious', 'Something smells a bit bad', 'Someone is being a bit lazy'], a: 0,
      cue: '「something a little」のあとの一語。',
      line: 'I think something *a little fishy* is going on.',
      said: '「ちょっと怪しいことが起きてる。一日中気づいてた」と知らせる。',
      mean: 'fishy ＝ うさんくさい。においの話ではなく、何か裏がありそうという意味。',
      trap: 'fish から「魚くさい」と取りやすい。is going on なら「起きていること」の話。',
      use: 'Something seems fishy about this deal.（この取引、何か怪しい）' },

    // R fix: "here to help" was the obvious odd one out; now "won't help you", a keyword trap on the next line (V2)
    // why: see someone ← "help you find it" read as real help (therapy); won't help ← "ain't nobody gonna help you" right after
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'mind', seg: [160.4, 166.85],
      stem: 'Right after “Do you understand?”, what is Stanley’s next line really saying?',
      choices: ['You’re acting crazy, and I can make you sorry', 'You’re acting crazy, so you should see someone',
                'You’re acting crazy, and I won’t help you out'], a: 0,
      cue: '「lost your mind」のあと、cause 以下。',
      line: 'Boy, have you *lost your mind*? ’Cause *I’ll help you find it*.',
      said: '「お前、正気を失ったのか？なら俺が見つけさせてやる」と言う。',
      mean: 'lost your mind ＝ 正気を失う。find it と続けて「思い知らせるぞ」の脅し。',
      trap: 'help は親切に聞こえるが、怒って言う「手伝ってやる」は脅し。拒否の意味でもない。',
      use: 'Have you lost your mind?（正気なの？）' },

    // R fix: "go out and find help" was weak; now "only God could save him", a keyword trap on the Jesus line (V2)
    // why: someone ← "ain't nobody" read as two negatives = somebody; only God ← "Jesus can come through that door" heard without the "not"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'aint', seg: [160.4, 171.4],
      stem: 'What is the point of Stanley’s lines about “out there” and “that door”?',
      choices: ['No one at all will come to save Ryan', 'Someone outside might come to help Ryan',
                'Only God could come and save Ryan now'], a: 0,
      cue: '「out there」の前の否定と、ドアの話。',
      line: '*Ain’t nobody* gonna help you out there. Jesus can come through that door and he’s *not gonna help you*',
      said: '「外では誰も助けない。神が来ても助けない」と言う。',
      mean: 'ain’t nobody ＝ nobody。否定の重ねで強める。神様でも無理という誇張。',
      trap: '否定が二つで「肯定」と計算しやすいが、話し言葉では強調。直後の Jesus の文で確かめる。',
      use: 'Ain’t nobody got time for that.（そんなのやってられない）' },

    // R fix: "proud he kept his cool" broke the parallel form; all three now "… by it" (K5)
    // why: amused ← the flat, deadpan delivery; embarrassed ← getting told off over a coworker's daughter
    { id: 'a4', skill: 'attitude', level: 'B1', point: 'scared', seg: [171.4, 177],
      stem: 'In Ryan’s talking head, how does he feel about what happened?',
      choices: ['Really shaken up by it', 'Secretly amused by it', 'Mostly embarrassed by it'], a: 0,
      cue: '後半の「one of the most」のあとの形容詞。',
      line: 'That was *one of the most frightening experiences* of my life.',
      said: '「今日、怒鳴られた。人生で最も怖い経験の一つだった」と話す。',
      mean: '淡々とした口調でも、中身は本気の恐怖。',
      trap: '声が平板なので面白がっているように聞こえやすい。気持ちは口調より frightening に出ている。',
      use: 'It was one of the best meals ever.（今までで最高の食事の一つだった）' },
  ]
};
