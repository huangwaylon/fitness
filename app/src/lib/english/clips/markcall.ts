// “Monica Helps Rachel Connect with Mark | Friends” (the official Friends channel, Best of Season 3): Mark hasn't
// called, a friend talks Rachel into calling him herself (over Ross's "only good things for you"), the call gets her a
// job interview and a prep lunch, and once she's gone Ross rants about the lunch until he's told to trust her and
// grow up.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈150.5 s. Ross is addressed by name at
// 128.7 s, and his lines are tied together by "Look, Rach", "you only want good things for me" and "my girlfriend";
// the other friends are never named, so stems say "a friend" and no item turns on who they are. Untested on purpose:
// 56–58 s (whisper "I'll hold", captions "a hole"), 64–66 s (whisper "But it's", captions "That is": only "so made
// up" is used), 93–96 s (whisper "I call her in baggy pants, say I'm a pro", captions "High collar and baggy pants.
// See, I'm a pro"; speakers unclear), 100.9 s ("You go get 'em": speaker), 112 s (whisper "now he's gonna prep her",
// captions "now I was going to prep her": kept out of every line and key), 134–137 s ("sleep with her": trimmed from
// nt2's line), 141.3–142.6 s (whisper "Well, yeah, I—", captions "Well, yeah, I do").
// REVIEW 2026-11-16: pass 6, fix 16, drop 0, new 0; ear checks 1 (s1 and x2 dropped: both sources agree on the words).
// Open: d2's worrier is probably Ross (the reply says "He gave *her*…"); the stem no longer names anyone, but the
//   header's "Ross's lines are tied together…" reading should be checked by ear if any later item leans on it.
// EAR CHECK: 149.5 s nt3, g2 — "You grow up!" is Ross's (the one just told "Grow up!"), after a gap of ≈5 s
//   (captions 144.4–149.5 s, whisper 144–147 s; both have the words)
import type { Clip } from '../types.ts';

export const markCall: Clip = {
  id: 'markcall', video: 'iRmuDDM3VBE', title: 'Monica Helps Rachel Connect with Mark', dur: 163, wpm: 146,
  band: 'slow', tags: ['恋愛', '電話'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): only the key was upsetting; "called… to cancel" is now an upsetting near-sound reading
    // why: called late ← the t of "didn't" lost, so it sounds like "did", and "Sunday night" heard as the time of a
    //   call; to cancel ← "did call" plus "Sunday night" heard as a call about their plans
    { id: 'd1', skill: 'detail', level: 'B1', point: 'nocall', seg: [0, 4.25],
      stem: 'What is Rachel upset about at the start?',
      choices: ['Mark didn’t call her by Sunday night', 'Mark called her late on Sunday night',
                'Mark called on Sunday night to cancel'], a: 0,
      cue: 'he のあと、動詞の前の短い語の終わり。',
      line: 'I can’t believe Mark *didn’t call*! It’s Sunday night, and he *didn’t call*.',
      said: '「マークが電話してこない。もう日曜の夜なのに」と2回くり返す。',
      mean: '日曜の夜までに連絡が来るはずだった。待ちくたびれている。',
      trap: 'didn’t の t は消えやすく did に聞こえる。can’t believe だけで決めず、n の音を聞く。',
      use: 'I can’t believe she didn’t text back.（返信が来ないなんて信じられない）' },

    // R fix: V2 (blind 65 %): "bored" was a filler; now "cheer her up", a kind reading of the reply
    // why: truly sorry ← "Yeah" heard as agreement (the Japanese そうだね frame), helped by Ross's "genuinely sorry"
    //   next; cheer her up ← "Look at you" heard as fond teasing to lift her mood
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'giddy', seg: [6.1, 9.9],
      stem: 'How does Rachel take Ross’s one-word reply to her news?',
      choices: ['She thinks he’s secretly glad about it', 'She thinks he truly feels sorry for her',
                'She thinks he’s trying to cheer her up'], a: 0,
      cue: '「Yeah」のあとの決まり文句と、最後の形容詞。',
      line: '*Yeah, right.* Look at you. You’re *practically giddy*.',
      said: '「よく言うよ。ほとんど浮かれてるじゃない」と言い返す。',
      mean: 'Yeah, right は同意でなく「うそでしょ」。giddy ＝ うきうき。',
      trap: 'Yeah を「そうだね」と取ると同意に聞こえる。Yeah, right は疑いの決まり文句。',
      use: 'Yeah, right. You never get up early.（よく言うよ、早起きなんてしないくせに）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'workout', seg: [9.6, 13.3],
      stem: 'Type what Ross says: “I’m genuinely sorry the Mark thing ___.” (3 words)', answer: "didn't work out",
      cue: 'thing のあと、文の最後の3語。',
      line: 'No, I’m genuinely sorry the Mark thing *didn’t work out*.',
      said: '「マークの件がうまくいかなくて、本当に気の毒だと思ってる」と言う。',
      mean: 'work out ＝ うまくいく。計画や恋が実らなかったときの決まった言い方。',
      trap: 'didn’t の t は消え、work‿out もつながって一語のように聞こえる。',
      use: 'Sorry the trip didn’t work out.（旅行、だめになっちゃったね）' },

    // R fix: K5 (§9.5): "Why do you just call Mark?" isn't real English; "Why'd you" (= why did you) is, and sounds close.
    //   Ear check dropped: both sources say "don't you" (rubric addendum)
    // why: why'd you ← the n of "don't" swallowed, "whydja" for "whydoncha"; won't ← the don't/won't vowel; didn't ←
    //   the "why didn't you…" scolding script, as if the chance were already gone
    { id: 's1', skill: 'sound', level: 'B2', point: 'callmark', seg: [16.7, 20.0],
      stem: 'Fill the gap: “Wait a minute. ___ just call Mark?”',
      choices: ['Why don’t you', 'Why’d you', 'Why won’t you', 'Why didn’t you'], a: 0,
      cue: 'Wait a minute のあと、文頭の3語。',
      line: 'Wait a minute. *Why don’t you* just call Mark?',
      said: '「ちょっと待って。マークに電話しちゃえば？」と言う。',
      mean: 'Why don’t you ～? は「～したら？」という提案。「ドンチュ」とつながる。',
      trap: 'don’t の t が消えると Why’d you に聞こえやすい。n の鼻の音が残れば don’t。',
      use: 'Why don’t you just ask her?（彼女に聞いてみたら？）' },

    // R fix: K5/V2 (blind 55 %): "Act yourself" isn't natural English and stood out; now "Make the first move"
    // why: other plans ← "make stuff" heard as "make plans"; keep busy ← "make stuff happen" heard as doing things
    //   to fill the time (the literal reading), against "sit here and wait"
    { id: 'p1', skill: 'phrase', level: 'B1', point: 'happen', seg: [21.6, 26.4],
      stem: 'What does the friend’s advice after “I mean…” come down to?',
      choices: ['Make the first move instead of waiting', 'Make other plans instead of waiting',
                'Keep busy so the waiting feels shorter'], a: 0,
      cue: 'wait for him のあとの一文。',
      line: 'who says you have to sit here and wait for him? You’ve got to *make stuff happen*.',
      said: '「待ってるだけなんて誰が決めたの？自分から動かなきゃ」と勧める。',
      mean: 'make stuff happen ＝ 自分から動いて物事を起こす。',
      trap: 'make を「作る」と取ると、予定作りや気晴らしに聞こえる。happen までで一つ。',
      use: 'Don’t wait for luck. Make it happen.（運を待たずに、自分で動こう）' },

    // R fix: S1/V1: the stem said Rachel voices the worry, but the reply "He gave *her* his home number" points to
    //   someone else saying it (likely Ross); the stem is now speaker-free, so nothing turns on who
    // why: too late ← "Sunday night" from her opening line; no number ← "home number" is said, in the opposite
    //   relation (he gave it to her)
    { id: 'd2', skill: 'detail', level: 'B2', point: 'pushy', seg: [26.0, 32.3],
      stem: 'What worry is raised about Rachel calling Mark herself?',
      choices: ['That she’ll come across as too pushy', 'That Sunday night is too late to call',
                'That she doesn’t have his home number'], a: 0,
      cue: 'Yeah, but のあと、文の最後の語。',
      line: 'Yeah, but you don’t want to seem *too pushy*. — Honey, it’s not pushy.',
      said: '「しつこいと思われたくないでしょ」と心配が出るが、「全然しつこくない」と返される。',
      mean: 'pushy ＝ 押しが強い。自分から電話すると、がっついて見えるという心配。',
      trap: 'home number は「もらった」話。Yeah, but のあとが本当の理由。',
      use: 'I don’t want to sound pushy, but…（しつこく聞こえたら悪いけど…）' },

    // R fix: V2 (blind 70 %): "work line" was a filler; now a manners reading (calling a home is rude), the Japanese frame
    // why: by mistake ← "He what?" heard as disbelief that Mark would give it out; rude ← "to his home?" heard as
    //   worry about intruding (the Japanese frame), though Mark gave it himself
    { id: 'i1', skill: 'infer', level: 'C1', point: 'homenumber', seg: [29.6, 36.4],
      stem: 'What lies behind Ross’s questions about the phone number?',
      choices: ['A fear that Mark is interested in her', 'A doubt that Mark meant to give it out',
                'A worry that calling him at home is rude'], a: 0,
      cue: '「He what?」のあと、くり返しと言い直し。',
      line: 'He gave you his *home number*? *As in, like, to his home?*',
      said: '「自宅の番号を？つまり、彼の家につながる番号？」と2回確かめる。',
      mean: '仕事の話なら会社の番号で足りる。home をくり返すのは、個人的な好意を疑っているから。',
      trap: '聞き返しは事実確認に聞こえるが、同じ点を言い直すのは動揺の印。何をくり返すかを聞く。',
      use: 'Wait, his personal number? Like, his cell?（え、個人の番号？携帯ってこと？）' },

    // R fix: V2/K6 (blind 60 %): the key had no clip words and an unclear "it"; choices now parallel, and the thank-you
    //   one echoes "good things"
    // why: his okay ← "you don't mind if I call" heard as asking permission (the literal reading); thanking ← "you
    //   only want good things for me" taken as sincere praise (a sincerity flip)
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'goodthings', seg: [36.0, 43.8],
      stem: 'Before dialing, what is Rachel doing with Ross’s earlier words?',
      choices: ['Using them so he can’t say no to the call', 'Asking for his okay before she makes the call',
                'Thanking him for wanting the best for her'], a: 0,
      cue: '「because」のあと、前に誰が言った言葉か。',
      line: 'you *don’t mind* if I call, *because you only want good things for me*. — That’s right. Good things.',
      said: '「電話していいよね。私にいいことだけ願ってるんだから」。彼は「そう」と返すしかない。',
      mean: '相手の言葉で、反対できなくする逃げ道ふさぎ。',
      trap: 'don’t mind if は許可を聞く形だが、ここは言い切り。相手の言葉を持ち出したら、くぎを刺す合図。',
      use: 'You said you’d help, right? Great.（手伝うって言ったよね？よかった）' },

    // R fix: V2 (blind 65 %): "dinner that night" was easy to rule out; now a lunch-date reading and a call-back reading
    // why: lunch date ← "meet me for lunch" plus the date script with a man who gave out his home number; apology ←
    //   "don't you apologize" is the clearest line early in the call
    { id: 'g1', skill: 'gist', level: 'B1', point: 'outcome', reveals: ['lunch'], seg: [46.6, 84.7],
      stem: 'What does Rachel get out of the phone call?',
      choices: ['A job interview and help getting ready', 'A lunch date with Mark, and nothing more',
                'An apology and a promise to call back'], a: 0,
      cue: '電話を切ったあと、最初の報告。',
      line: '*I got the interview.*',
      said: '電話を切って「面接が決まった」。ランチで準備も手伝ってもらえる。',
      mean: 'マークの紹介で、仕事の面接を受けられることになった。恋ではなく仕事の話。',
      trap: 'apologize は初めに聞こえるが、結果ではない。結果は切ったあとの一言で聞く。',
      use: 'Guess what? I got the job!（聞いて、仕事決まったの！）' },

    // why: stuck at work ← "work" is said, in the wrong relation; lost it at home ← "left" heard as "lost", with
    //   "home number" just before
    { id: 'd3', skill: 'detail', level: 'B2', point: 'excuse', seg: [59.3, 64.6],
      stem: 'What excuse does Rachel pass on for Mark’s not calling?',
      choices: ['He’d left her number at work', 'He’d been stuck at work all weekend', 'He’d lost her number at home'],
      a: 0,
      cue: '「He」で始まる最初の文の最後。',
      line: 'He *left my number at work*. He was going to get it, but…',
      said: '「番号を職場に置いてきたんだって。姪の宿題を手伝ってたって」と伝える。',
      mean: 'left ＝ 置き忘れた。マーク本人の説明を、そのまま伝えている。',
      trap: 'left を lost と聞くと「なくした」になる。leave ＋物＋場所は「～に置き忘れる」。',
      use: 'I left my phone at the hotel.（ホテルに携帯を置いてきた）' },

    // why: made peace ← "make up" as in making up after a fight; made up his mind ← "make up one's mind", the other
    //   common "made up"
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'madeup', seg: [59.3, 67.5],
      stem: 'What does the comment right after the excuse claim?',
      choices: ['That Mark invented the whole story', 'That Mark and Rachel have made peace',
                'That Mark has made up his mind'], a: 0,
      cue: '「pioneers」のすぐあと、短い一言。',
      line: '…helping his niece with her report on the pioneers. — …so *made up*.',
      said: '姪の宿題の話に、すかさず「どう考えても作り話だ」と言う。',
      mean: 'made up ＝ でっち上げの。言い訳が細かすぎて、かえってうそっぽい。',
      trap: 'make up には「仲直りする」「決める」もある。be＋made up は「作り話」。',
      use: 'That excuse sounds totally made up.（その言い訳、完全に作り話っぽい）' },

    // why: tonight ← "Sunday night" from the opening, with "perfect" heard as eager; next Sunday ← "Sunday" is the
    //   only day named before the call
    { id: 'n1', skill: 'number', level: 'B1', point: 'tomorrow', seg: [68.1, 72.4], keep: true,
      stem: 'Which day does Mark suggest on the phone?',
      choices: ['Tonight', 'Tomorrow', 'Next Sunday'], a: 1,
      cue: '「oh my God」のあと、驚いた一語。',
      line: 'Yeah, oh, my God, *tomorrow*? That— no, it’s perfect.',
      said: '「えっ、明日？いや、ちょうどいい」と、驚きながら受ける。',
      mean: '急な日程に一瞬とまどうが、すぐ「完璧」と言い直す。それだけ乗り気だと分かる。',
      trap: '冒頭の Sunday night が耳に残ると「今夜」に引かれる。驚いて聞き返した語が日にち。',
      use: 'Tomorrow? Sure, that works for me.（明日？うん、大丈夫）' },

    // R fix: K6 (blind 60 %): the key was the only choice without "interview"; no choice has it now
    // why: dinner ← "lunch" swapped for a date-like dinner; drive her ← "prep" missed, and the offer guessed from
    //   "meet me"
    { id: 'd4', skill: 'detail', level: 'B1', point: 'lunch', seg: [79.6, 84.7],
      stem: 'What else has Mark offered to do for Rachel?',
      choices: ['Meet her for lunch and help her get ready', 'Take her out to dinner once it’s over',
                'Drive her there and wait outside for her'], a: 0,
      cue: '「even offered」のあと、文の最後まで。',
      line: 'He even offered to *meet me for lunch and prep me for it*.',
      said: '「ランチで会って、面接の準備まで手伝ってくれるって」と言う。',
      mean: 'prep は prepare の短い形。聞かれそうなことを一緒に練習してくれる。',
      trap: 'lunch を夕食や送り迎えと取りやすい。even のあとは「そこまで」の追加。',
      use: 'Can you prep me for the meeting?（会議の準備、手伝ってくれる？）' },

    // R fix: C2/V2 (blind 75 %): "barely knows Mark" was weak; now "showing off", the right target with the wrong motive
    // why: doubts the job ← "expect nothing less" heard about how she'll do (the right mechanism, a doubt, aimed at
    //   the wrong target); showing off ← the grudging "Yeah, well" heard as scorn for Mark's generosity, not suspicion
    // anchor: 85–91 s a praise-shaped line opened by a grudging "Yeah, well," right after "that is amazing"; 113–128 s
    //   Ross names it himself: "before you surgically remove the boyfriend", "taking my girlfriend out for a meal"
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'expect', seg: [84.6, 93.1],
      stem: 'When Ross says he’d “expect nothing less”, what is he trying not to say?',
      choices: ['That he suspects Mark wants Rachel', 'That he doubts Rachel will get the job',
                'That he thinks Mark is just showing off'], a: 0,
      cue: '「Yeah, well」の始まり方と、ほめ言葉の中身。',
      line: 'Yeah, well, *if I know Mark, and I think I do*, I’d *expect nothing less*.',
      said: '「マークのことは分かってるつもりだが、それくらい当然だろうね」と言う。',
      mean: 'ほめ言葉の形で、親切の裏を疑っている。あとで「彼氏を取り除く準備」と言い、本音が出る。',
      trap: 'expect nothing less を彼女の結果の予想や、見せびらかしへの皮肉と取りやすい。的はあとの言葉で確かめる。',
      use: 'Oh, he’s generous. Very generous.（ああ、気前いいよね。すごくね）' },

    // R fix: V2/V4 (blind 60 %): "let down" undersold the sarcasm; the key now says annoyed, and "grateful" became a
    //   mixed reading so it isn't a flat sincerity filler
    // why: hurt the friend ← "Did I hurt you in some way?" taken as a real question; glad ← "thank you very much"
    //   taken at face value (a sincerity flip), softened by the hurt tone
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'blame', reveals: ['callmark'], seg: [102.9, 117.8],
      stem: 'When Ross turns on the friend who suggested the call, how does he feel?',
      choices: ['Annoyed that the friend gave Rachel the idea', 'Worried that he upset the friend earlier',
                'Glad the friend helped Rachel, if a bit hurt'], a: 0,
      cue: '相手の言葉をまねしたあとの、お礼の言い方。',
      line: 'What did I do to you? … “Why don’t you call him?” Well, *thank you very much*.',
      said: '「僕が何かした？」と詰め寄り、「電話したら？」をまねして「どうもありがとう」。',
      mean: '本気のお礼ではない。「余計なことを言ってくれたな」という皮肉。',
      trap: 'Did I hurt you? を本当の質問と取りやすい。まねのあとのお礼は、ほぼ皮肉。',
      use: 'Oh, great idea. Thanks a lot.（ああ、名案だね。どうもありがとう）' },

    // R fix: V2 (blind 75 %): "phones Mark himself" was a filler; now "agrees to try", which shares the key's first half
    //   C4: 嫉妬 left the notes and 'expect' left reveals; with it, a drawn g2 shut out every C2 on play 3 (nt3 shares
    //   its point), which the draw sim flagged
    // why: drops it ← "Well, yeah, I do" (he does trust her) heard as the end of it; agrees ← the told-off half heard,
    //   the reply after the gap missed
    { id: 'g2', skill: 'gist', level: 'B2', point: 'growup', seg: [102.9, 150.9],
      stem: 'After Rachel leaves, how does the argument with Ross end?',
      choices: ['He’s told to grow up, and says it back', 'He’s told to grow up, and agrees to try',
                'He admits he trusts her and lets it go'], a: 0,
      cue: '最後のやりとりと、少し間をおいた一言。',
      line: '*Grow up!* … *You grow up!*',
      said: '「信じてるなら大人になって」と言われ、間をおいて「そっちこそ」と返す。',
      mean: '言い合いは解決せず、子どもっぽい言い返しで終わる。本人の気はおさまっていない。',
      trap: 'yeah, I do で信じると認めるが、話は終わらない。結末は最後の一言で聞く。',
      use: 'Fine. We’ll talk about it later.（分かった。またあとで話そう）' },

    // R fix: B1/N7: the key names the lunch (d4's point); reveals now has 'lunch'
    // why: hospital job ← "surgically" taken literally and tied to the interview; work words ← "prep her as in…"
    //   heard as poking fun at Mark's jargon, not at what the lunch is for
    { id: 'h1', skill: 'humor', level: 'C1', point: 'prep', reveals: ['expect', 'lunch'], seg: [110.4, 117.8],
      stem: 'Why is Ross’s second meaning of “prep” a joke?',
      choices: ['He makes the lunch sound like prep for cutting him out',
                'He thinks Mark will be coaching her for a hospital job',
                'He mocks the fancy work words Mark likes to use'], a: 0,
      cue: 'as in のあと、何の「準備」に言いかえるか。',
      line: 'prep her *as in what you do before you surgically remove the boyfriend*.',
      said: '「準備ってのは、手術で彼氏を取り除く前の準備さ」と言いかえる。',
      mean: 'prep は手術前の下準備にも使う。面接の準備を、彼氏（自分）を切る準備にした自虐。',
      trap: 'surgically を文字どおり取ると病院の話になる。the boyfriend は本人。',
      use: 'Dinner, as in a real date?（ディナーって、本当のデートってこと？）' },

    // why: overreacting ← "Am I out of my mind?" heard as real self-doubt (the Japanese 反省 frame); honest opinion ←
    //   the questions taken as real questions (the literal reading)
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'crazy', reveals: ['expect'], seg: [118.6, 128.7],
      stem: 'When asked if he’s crazy, what do Ross’s own questions do?',
      choices: ['Insist he’s being perfectly reasonable', 'Admit he might be overreacting a bit',
                'Ask the friend for an honest opinion'], a: 0,
      cue: '問いのくり返しのあとに続く、言い分。',
      line: '*Am I?* Am I out of my mind? … This dreamy guy is *taking my girlfriend out* for a meal.',
      said: '「僕が？正気じゃない？」と重ね、「素敵な男が僕の彼女を食事に連れ出すんだぞ」と言う。',
      mean: '答えを求めない反語。「心配して当然だろ」と言い返している。',
      trap: '自分を責める問いに聞こえやすい。問いのあとに理由が来たら反語。',
      use: 'Am I wrong? It’s two in the morning!（僕が悪い？夜中の2時だよ！）' },

    // why: keep it from her ← "even if you're right" (next line) heard as the point; help instead ← "about Rachel"
    //   heard as a reproach that he isn't helping her
    { id: 'i2', skill: 'infer', level: 'B2', point: 'aboutyou', seg: [128.5, 134.3],
      stem: 'When a friend first answers Ross’s rant, what is the point?',
      choices: ['He is making Rachel’s good news about himself', 'He is right, but should keep it from Rachel',
                'He is the one who should help Rachel instead'], a: 0,
      cue: '名前を呼んだあとの2文の対比。',
      line: 'this *isn’t even about you*. I mean, this is about Rachel and *something wonderful happening for her*.',
      said: '「これは君の話じゃない。レイチェルにいいことが起きてる話だ」と言う。',
      mean: '自分の不安ばかり話す彼に、主役はレイチェルだと示す。',
      trap: 'about Rachel を「手伝って」と取りやすい。not A, B の形は A を消して B を立てる。',
      use: 'This isn’t about me. It’s about the team.（これは私の話じゃない。チームの話だ）' },

    // R fix: C2/V2 (blind 65 %): "warn her before the lunch" was far off; now "it's only a lunch", a scope near miss
    // why: only a lunch ← the concession heard, then the point taken as "it's harmless", not "it's her call"; he won't want anything
    //   ← the concession missed, heard as plain reassurance that Mark is harmless (the wrong direction)
    // anchor: 134.9–141 s "even if you're right" grants Mark's motive; "Does that mean he gets to?" and "don't you
    //   trust her?" put the choice with Rachel
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'trust', seg: [133.9, 141.25],
      stem: 'Which plain-English version keeps the friend’s point after “even if you’re right”?',
      choices: ['“Wanting her doesn’t mean he gets her; it’s her call.”',
                '“Even if he wants her, it’s only a lunch.”',
                '“Don’t worry, he won’t want anything from her.”'], a: 0,
      cue: 'even if のあとの問いと、最後の問い。',
      line: 'even if you’re right, what if he wants to…? *Does that mean he gets to?* … *Don’t you trust her?*',
      said: '「君が正しくても、それで彼の思いどおりになる？彼女を信じてないの？」と問う。',
      mean: 'even if で心配を一度認め、反語で「決めるのは彼女」と返す。譲歩と反論の二段がまえ。',
      trap: 'you’re right だけ拾うと同意に聞こえる。even if は仮の話で、言いたいことは続く問いにある。',
      use: 'Even if it rains, so what?（雨が降ったとしても、だから何？）' },

    // R fix: B1/N7: the stem shows "Grow up!" (g2/nt3's point); reveals now has 'growup'. Ear check dropped: both
    //   sources say "get over yourself" (rubric addendum)
    { id: 'x2', skill: 'dict', level: 'B2', point: 'overyourself', reveals: ['growup'], seg: [141.2, 145.2],
      stem: 'Type the friend’s reply: “Then ___. Grow up!” (3 words)', answer: 'get over yourself',
      cue: 'Then のあと、Grow up の前の3語。',
      line: 'Then *get over yourself*. Grow up!',
      said: '「だったら自分中心はやめて。大人になって！」と突き放す。',
      mean: 'get over yourself ＝ 自分を特別扱いするな。信じているなら騒ぐな、という結論。',
      trap: 'get over の t は弾んで「ゲロウヴァ」に近く、yourself ともつながる。',
      use: 'Oh, get over yourself. It’s just a game.（もう、大げさだよ。ただのゲームでしょ）' },

    // R fix: C2/V2 (blind 70 %): the key was the only one explaining itself at length; all three now give a target and
    //   a reason of the same size
    // why: the friend ← the mirrored "you" heard as a fair hit back at the one who started it (the right mechanism,
    //   the wrong target); Mark ← he's the cause of the anger, so the line heard as meant for him (a scope shift)
    // anchor: 143.9 s "Grow up!", then after a gap of ≈5 s (captions 144.4–149.5, whisper 144–147) "You grow up!":
    //   a late "no, you" that copies the two words, the very childishness he was just told off for
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'growup', seg: [141.2, 151.0],
      stem: 'Who is the joke on in the reply to “Grow up!”?',
      choices: ['Ross, whose comeback is just what he was told off for',
                'The friend, whose own words get thrown back at them',
                'Mark, the rival Ross has been fuming about all along'], a: 0,
      cue: '最後の2語と、返事が来るまでの間。',
      line: '*Grow up!* … *You grow up!*',
      said: '「大人になって！」と言われ、しばらく黙ったあと「そっちこそ大人になれ！」と言い返す。',
      mean: '「そっちこそ」は子どものけんかの返し方。遅れて言い返すほど大人げなさが証明され、笑われるのは本人。',
      trap: '言い返しは反撃に聞こえやすい。同じ言葉を相手に返すだけなら、言われた通りの人だと示す一言になる。',
      use: 'Real mature. Very grown-up of you.（ずいぶん大人だね、ほんと）', retired: true },
  ]
};
