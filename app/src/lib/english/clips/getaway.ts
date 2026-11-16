// “Chandler & Monica Delay Their Getaway | Friends” (the official Friends channel, Best of Season 10): Monica has booked
// the inn Chandler wanted for the weekend, but it's baby Emma's first birthday, and her parents talk the couple into
// staying for the party and driving up after it.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈66 s. Chandler is named by Monica at
// 29.9 s; the baby's parents are left unnamed in the stems. The captions garble 18.3 s (“that's the day when there will
// be her real birthday”; whisper “That won't be your real birthday”): d3 rests only on “real birthday”, in both.
// Untested, by content: the “Maxim” thread (34.8–37.4 s, 61.2–66.2 s) and the “weird sex stuff” line (45–48 s).
// REVIEW 2026-11-16: pass 4, fix 16, drop 0, new 0; ear checks 3
// EAR CHECK: 9.0 s nt1 — the stress in “You can take a hint!” falls on “can” (ship only once confirmed)
// EAR CHECK: 15.7 s s1 — “can't you just” (both sources); the claim is that “can't” keeps its long “æ” though the t is
//   barely there
// EAR CHECK: 59.9 s x1 — “drive up after” links into one stretch (both sources have the words)
import type { Clip } from '../types.ts';

export const getaway: Clip = {
  id: 'getaway', video: '3QWX3Vtu5RQ', title: 'Chandler & Monica Delay Their Getaway', dur: 78, wpm: 175,
  band: 'fast', tags: ['友だち', 'お願い・断り'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2, blind 75 % (baby → birthday, against two weak favors); all three are now family events "then".
    //   Line shows "this weekend": reveals d1's point
    // why: family dinner ← "Emma's" + family heard as a get-together; own trip ← "go away this weekend" heard as their
    //   plan too; "It's Emma's birthday. We're having a party." is the reason
    { id: 'g1', skill: 'gist', level: 'B1', point: 'clash', reveals: ['when'], seg: [4.1, 20.5],
      stem: 'Why do the baby’s parents object to the weekend away?',
      choices: ['They are throwing her a party then', 'They are having a big family dinner then',
                'They had planned a trip of their own then'], a: 0,
      cue: '「But」で始まる反対の理由。',
      line: 'But you can’t go away this weekend. It’s *Emma’s birthday*. We’re *having a party*.',
      said: '旅行の話を聞いて、赤ちゃんの親が「今週末はだめ。誕生日でパーティーをする」と言う。',
      mean: '週末旅行と誕生日パーティーが重なった、というのが場面の出発点。',
      trap: '家族の集まりなら食事会、と考えやすいが、言っているのは誕生日のパーティー。',
      use: 'I can’t this weekend. It’s my mom’s birthday.（今週末は無理。母の誕生日なの）' },

    // R fix: V2, blind 50 % ("tomorrow night" was the odd one out); now a this/next pair plus "this Friday"
    // why: next weekend ← "next" is heard later ("the next day"); this Friday ← "this" caught, "weekend" lost
    { id: 'd1', skill: 'detail', level: 'B1', point: 'when', seg: [4.1, 7.1],
      stem: 'When is the room at the inn booked for?',
      choices: ['This weekend', 'Next weekend', 'This Friday night'], a: 0,
      cue: '「Woodford Inn」のすぐあとの二語。',
      line: 'Honey, I got us that room at the Woodford Inn *this weekend*.',
      said: '「ねえ、ウッドフォード・インの部屋、今週末で取ったよ」と言う。',
      mean: 'this weekend ＝ 今週末。すぐ先の予定なので、誕生日と重なる。',
      trap: 'あとで the next day が出てくるので next に引かれやすい。最初の文の最後を聞く。',
      use: 'Are you free this weekend?（今週末あいてる？）' },

    // R fix: V2, blind 60 % (the only positive, active choice); "ask before booking" → a surprise plan of his own
    // why: never heard of it ← "That place in Vermont?" heard as a real question; his own surprise ← "I got us that
    //   room" heard as beating him to it; "You can take a hint!" says he had been hinting
    { id: 'i1', skill: 'infer', level: 'C1', point: 'hint', seg: [4.1, 10.6],
      stem: 'What does Chandler’s reaction show he had been doing about that inn?',
      choices: ['Dropping hints that he wanted to go', 'Hearing about it for the very first time',
                'Planning to book it for her as a surprise'], a: 0,
      cue: '場所を聞き返したあとの、短い一文。',
      line: 'That place in Vermont? *You can take a hint!*',
      said: '部屋を取ったと聞き、「バーモントのあそこ？ちゃんと察してくれたんだ！」と喜ぶ。',
      mean: 'take a hint ＝ ほのめかしを察する。前から遠回しに言っていた。',
      trap: '聞き返しを「知らない場所」と取りやすい。続く一文で、知っていて喜んでいると分かる。',
      use: 'Okay, I can take a hint. I’ll go.（はいはい、察したよ。帰るね）' },

    // anchor: 4.6–9.9 s "Honey, I got us that room…" — "That place in Vermont? You can take a hint!": she did what he
    //   had hinted at, so the stress marks pleased surprise ("so you can!"), not an order or a contrast
    // R fix: V2, blind 60 % (only the key was glad; "telling her to take a hint" fit no one); all three are glad now,
    //   so only the stress decides
    // why: on "hint" ← the idiom's last word stressed as in "take the hint", the hint itself as the news; on "you" ←
    //   a contrast reading (you, unlike others), which needs someone to contrast with, and nobody else is mentioned
    // retired: a C2 stress item, until its ear check (9.0 s)
    { id: 'nt1', skill: 'sound', level: 'C2', point: 'hint', seg: [6.9, 10.6], retired: true,
      stem: 'Where is the stress in Chandler’s “You can take a hint!”, and why?',
      choices: ['On “can”: so she can do it after all', 'On “you”: she, unlike others, got it',
                'On “hint”: the hint itself got through'], a: 0,
      cue: '短い一文で、いちばん高く長く聞こえる語。',
      line: 'That place in Vermont? You *can* take a hint!',
      said: '部屋を取ったと聞いて「バーモントのあそこ？ちゃんと察してくれるんだね！」と言う。',
      mean: 'can を強めると「やればできるじゃない」という、うれしい驚き。助動詞の強勢は「本当に〜だ」を足す。',
      trap: 'hint を強めると話の中心がヒントに、you なら他人との対比になる。強勢は、何に驚いたかを示す。',
      use: 'You can cook! This is great.（料理できるんだ！おいしい）' },

    // R fix: V2, blind 60 % ("can't you just" was the only negative suggestion form); couldn't → could, so two
    //   positives against one negative
    // why: Can you just ← "can't" with its t gone sounds like "can"; Could you just ← a politer frame Japanese
    //   learners expect; the vowel of "can't" is long and stressed
    { id: 's1', skill: 'sound', level: 'B2', point: 'cant', reveals: ['move'], seg: [15.2, 18.2],
      stem: 'Fill the gap: “Well, ___ have the party when we get back?”',
      choices: ['can’t you just', 'can you just', 'could you just'], a: 0,
      cue: '「Well」の直後、強く長めに聞こえる母音。',
      line: 'Well, *can’t you just* have the party when we get back?',
      said: '「帰ってからパーティーすればいいんじゃない？」と提案している。',
      mean: 'can’t は t がほぼ消えるが、母音が長く強い。can は弱く短い「クン」。',
      trap: 't が聞こえないと can と思いやすい。can’t you は強く長い母音で判断する。',
      use: 'Can’t you just call him back later?（あとでかけ直せばいいじゃない）' },

    // R fix: V2, blind 55 % ("tired" was a filler); all three are now scheduling reasons. Line shows "can't you
    //   just": reveals s1's point
    // why: guests ← the usual reason a party can't move; place ← "have the party" heard as a booked venue; the reply is
    //   about "real birthday"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'real', reveals: ['move', 'cant'], seg: [15.2, 20.5],
      stem: 'Why won’t the parents move the party to after the trip?',
      choices: ['It wouldn’t be on the actual day', 'The guests are only free that day',
                'The place is only booked for then'], a: 0,
      cue: '「No」のあと、文の最後の二語。',
      line: 'can’t you just have the party when we get back? — No… *real birthday*.',
      said: '「帰ってからにしたら？」に、「だめ、それじゃ本当の誕生日じゃない」と返す。',
      mean: '本当の誕生日の当日に祝いたい、というのが親の理由。',
      trap: 'パーティーを動かせない理由は招待客、という型で聞きやすい。返事の最後の語を聞く。',
      use: 'Let’s celebrate on the real day.（当日にお祝いしよう）' },

    // R fix: V2, blind 60 % (the title gives "delay their getaway", and only the key was a clean swap); all three now
    //   end with the trip pushed back, so the first request decides. "Monica's" → "the couple's": no voice needed
    // why: shorter ← a common compromise (stay an hour, then go); skip ← "you can't go away this weekend" heard as
    //   them asking to miss it; "can't you just have the party when we get back?" is the first idea
    { id: 'g2', skill: 'gist', level: 'B2', point: 'move', reveals: ['nextday', 'after'], seg: [15.2, 61.1],
      stem: 'How does the argument turn between the couple’s first idea and the end?',
      choices: ['They ask for the party to be later, then push the trip back',
                'They ask for the party to be shorter, then push the trip back',
                'They ask to skip the party, then push the trip back'], a: 0,
      cue: '最初の提案で、何を動かそうとしたか。',
      said: '最初は「パーティーをずらして」と頼み、最後は「パーティーのあとで車で行く」と旅行の方をずらす。',
      mean: '頼む側だった二人が、頼まれる側に回って折れる流れ。',
      trap: '最後に旅行を後ろにずらすのは共通。最初に何を頼んだかで見分ける。',
      use: 'Fine, we’ll push the trip back.（分かった、旅行を後ろにずらすよ）' },

    // R fix: V2, blind 65 % (only the key gave a reason that fit a laugh); all three now read "His wish is…"
    // why: sweet ← "if only" read as a sincere wish (もし〜だったらなあ); mistake ← "if only she were one" read as if he
    //   thinks she's older; she is turning one, so the wish is already true
    { id: 'h1', skill: 'humor', level: 'C1', point: 'gee', reveals: ['age'], seg: [20.5, 25.6],
      stem: 'Why does the “Gee, if only…” reply get a laugh?',
      choices: ['His wish is already true: at one, she won’t know the date', 'His wish is a sweet one: he wants her to stay one',
                'His wish is a mistake: he thinks she’s turning two'], a: 0,
      cue: '「if only」のあとの年齢と、最後の部分。',
      line: 'Gee, *if only she were one* and *had no idea* what the hell a birthday was.',
      said: '「ああ、あの子が1歳で、誕生日が何かも分かってなかったらなあ」と言う。',
      mean: '実際に1歳なので、願いの形で事実を言う皮肉。「当日にこだわる意味ある？」。',
      trap: 'if only を本当の願いと取りやすい。願いの中身が事実なら、皮肉のサイン。',
      use: 'Gee, if only someone had a car.（ああ、誰か車持ってたらなあ）' },

    // anchor: 26.8–28.6 s the real reply, "Come on, you guys. This is really important to us.", grants that the baby
    //   won't know and moves the case to the parents: it answers the sarcasm's point
    // R fix: V2, blind 50 % (the age correction was a weak near miss); now a play-along reply that treats it as banter
    // why: grow up fast ← the line heard as a wistful wish ("if only she were…"); eat the cake ← the line heard as a
    //   light joke to play along with, not a point about the date; the point is that the day can't matter to her
    // retired: with nt1: one C2 alone is under the native tier’s 2; back with nt1
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'gee', reveals: ['age', 'comeon'], seg: [20.5, 29.0], retired: true,
      stem: 'Which reply from the parents would match what the “Gee” line meant?',
      choices: ['“Maybe she won’t know, but we will.”', '“I know, they grow up so fast.”',
                '“Ha, she’ll just eat the cake.”'], a: 0,
      cue: '皮肉の中身と、実際の返事が何に答えたか。',
      line: 'Gee, if only she were one and had no idea… — Come on, you guys. *This is really important to us.*',
      said: '「1歳で何も分かってなければなあ」と皮肉を言われ、親は「お願い、私たちには大事なの」と返す。',
      mean: '皮肉の中身は「本人は分からないから日にちはどうでもいい」。それには「私たちの問題」と返すのが合う。',
      trap: '願いの形をそのまま受けると、しみじみした返事や軽いノリになる。返事は言いたいことに返す。',
      use: 'True, he won’t remember. But we will.（確かに覚えてないだろうけど、私たちは覚えてる）' },

    // R fix: V2, blind 50 % ("hurry up and decide" fit nothing before it); now a laugh-it-off reading of "Come on"
    // why: come along ← "Come on" read literally as an invitation to come; laughs off ← "Come on, you guys" as a
    //   jokey "oh, stop it"; "This is really important to us" makes it a plea
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'comeon', seg: [26.0, 29.0],
      stem: 'Right after the “Gee” remark, what does the next turn do?',
      choices: ['Begs the couple to take it seriously', 'Invites the couple to join the party',
                'Laughs off the joke and moves on'], a: 0,
      cue: '呼びかけのあと、important を含む文。',
      line: '*Come on, you guys*. This is really important to us.',
      said: '「ねえ、みんな。これは私たちには本当に大事なの」と言う。',
      mean: 'Come on ＝ 頼むよ、お願い。軽く流さないで、という訴え。',
      trap: 'come を「来て」と取ると招待に聞こえる。後ろの important で、お願いだと分かる。',
      use: 'Come on, it’s just one drink.（ねえ、一杯だけだから）' },

    // R fix: V2, blind 55 % ("mockingly" was a filler); now a firm-but-blaming reading, so two choices hold firm. Cue leak ("but") fixed
    // why: real apology ← the Japanese frame: すみません first, then giving in; blaming ← "but" plus "really" heard as
    //   pushing back at them; the "but" brings her own need, with no blame, and she doesn't give in here
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'sorry', reveals: ['comeon'], seg: [28.6, 34.5],
      stem: 'How does Monica answer that plea?',
      choices: ['Politely, but holding firm on the trip', 'Apologizing, and ready to give up the trip',
                'Firmly, and blaming them for the clash'], a: 0,
      cue: '最初の一言と、そのあとに来る本音。',
      line: 'Well, *I’m sorry, but* Chandler and I could really use a weekend away.',
      said: '「悪いけど、私とチャンドラーには週末の旅行が必要なの」と言う。',
      mean: 'I’m sorry, but は断る前のクッション。謝っているのではなく、引かない姿勢。',
      trap: 'sorry を謝罪と取ると、譲るように聞こえる。but のあとに本音が来る。',
      use: 'I’m sorry, but I can’t stay late tonight.（悪いけど、今夜は残れない）' },

    // why: allowed ← "could" read as permission (〜してもいい); spend it freely ← "use" read literally, as using the
    //   weekend however they like; "really" plus "We need to…" next makes it need
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'use', seg: [28.6, 32.1],
      stem: 'What does Monica mean about a weekend away?',
      choices: ['They really need one', 'They are allowed one', 'They can spend it freely'], a: 0,
      cue: '「Chandler and I」のあとの動詞の組み合わせ。',
      line: 'Chandler and I *could really use* a weekend away.',
      said: '「私とチャンドラーには、週末の旅行が本当に必要」と言う。',
      mean: 'could use ＝ 〜があるとありがたい、〜が欲しい。really が付いてかなり強い。',
      trap: 'could を「〜してもいい」、use を「使う」と取りやすい。could use で一つ。',
      use: 'I could really use a coffee.（コーヒーがすごく欲しい）' },

    // why: anniversary ← the usual reason a couple goes away; rest ← "a weekend away" heard as a break from work; she
    //   says "reconnect emotionally"
    { id: 'd4', skill: 'detail', level: 'B2', point: 'reconnect', seg: [29.4, 34.5],
      stem: 'What reason does Monica give for needing the trip?',
      choices: ['To feel close to each other again', 'To celebrate their anniversary',
                'To get some rest from work'], a: 0,
      cue: '「We need to」のあとの動詞。',
      line: 'We need to *reconnect emotionally*.',
      said: '「気持ちの面で、もう一度つながりたいの」と理由を言う。',
      mean: 'reconnect ＝ つながり直す。二人の時間を取り戻したい、という説明。',
      trap: 'カップルの旅行なら記念日や休養、と考えやすい。need to のあとの語を聞く。',
      use: 'We need to reconnect as a family.（家族の時間を取り戻したい）' },

    // R fix: B1, the line shows "can't you just": reveals s1's point. Cue leak ("Vermont") fixed
    // why: weekend before ← "go away this weekend" moved the other way; take the baby ← the party and the trip combined;
    //   the line says "the next day"
    { id: 'd5', skill: 'detail', level: 'B1', point: 'nextday', reveals: ['cant'], seg: [39.3, 42.7],
      stem: 'What do the parents suggest the couple do instead?',
      choices: ['Leave for Vermont the next day', 'Go away the weekend before',
                'Bring the baby along to the inn'], a: 0,
      cue: '提案の文の、最後の二語。',
      line: 'Well, can’t you just go to Vermont *the next day*?',
      said: '「次の日にバーモントへ行けばいいじゃない？」と提案する。',
      mean: 'the next day ＝ その翌日。旅行を1日ずらす案。',
      trap: 'can’t you just の形は同じだが、今度は旅行の方をずらす話。最後の語まで聞く。',
      use: 'Can we do it the next day instead?（代わりに次の日にしない？）' },

    // R fix: V2, blind 50 % ("take back" had nothing to take back); now a topic-shift reading. `said` gives i2's key:
    //   reveals 'aunt'
    // why: new topic ← "And I mean" heard as opening something new; unsure ← the Japanese frame: fillers read as
    //   hesitation (えーと); each "I mean" adds a stronger line ("a big deal", "how can we…")
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['age', 'bigdeal', 'aunt'], seg: [50.0, 56.9],
      stem: 'In the last turn before the couple agree, how do the short fillers work?',
      choices: ['They add to the case and press it harder', 'They mark a turn to a new topic',
                'They show she isn’t sure of her own point'], a: 0,
      cue: '二回出る短い言葉のあと、話が強まるか弱まるか。',
      line: 'And *I mean*, you know, you guys… *I mean*, how can we have her first birthday party…',
      said: '「それにね、大事なことなの。だって、おばとおじ抜きでどうやって？」と重ねる。',
      mean: 'I mean ＝ 言いたいことを足して強める合図。押しを重ねている。',
      trap: '日本語の「えーと」のような迷いと取りやすい。I mean のあとが強い言葉なら、押している。',
      use: 'It’s cheap. I mean, really cheap.（安いよ。いや、ほんとに安い）' },

    // R fix: V2, blind 50 % ("large and costly" was a far-off literal reading); now a "big hassle" reading
    // why: hassle ← "big deal" heard as a lot of work (大ごと = 面倒); fixed plan ← "deal" as a business deal (ディール
    //   = 取引), so it's settled
    { id: 'p2', skill: 'phrase', level: 'B1', point: 'bigdeal', seg: [50.0, 53.1],
      stem: 'What does she say the party is, in her last turn?',
      choices: ['It matters a lot to them', 'It’s turning into a big hassle', 'It’s a fixed plan they can’t change'], a: 0,
      cue: '「this is」のあとの三語。',
      line: 'you guys, this is *a big deal*.',
      said: '「みんな、これはすごく大事なことなの」と言う。',
      mean: 'a big deal ＝ 大事なこと。No big deal なら「大したことない」。',
      trap: 'big を「面倒の大きさ」、deal を取引と取りやすい。a big deal で一つの言い方。',
      use: 'It’s no big deal. Don’t worry.（大したことないよ。気にしないで）' },

    // R fix: V2, blind 55 % (the baby missing them was easy to rule out); now a guilt-trip near miss
    // why: who else ← the question heard as a real one, asking for other guests; regret ← the wrong implication: a
    //   warning about how they'll feel later; the form "how can we… without" means "we can't", about the party
    { id: 'i2', skill: 'infer', level: 'C1', point: 'aunt', reveals: ['age'], seg: [52.6, 56.9],
      stem: 'What is the question about the aunt and uncle really saying?',
      choices: ['The party wouldn’t be right without the couple', 'She wants to know who could come in their place',
                'The couple will feel bad later for missing it'], a: 0,
      cue: '「how can we」で始まる、答えを求めない質問。',
      line: 'how can we have her first birthday party *without her aunt and her uncle*?',
      said: '「おばとおじがいないのに、どうやって1歳の誕生日会をするの？」と言う。',
      mean: '答えを聞く質問ではなく「いなきゃ無理」という訴え。',
      trap: '質問の形なので、代わりの人を聞いていると取りやすい。how can we … without は「なしは無理」。',
      use: 'How can we start without you?（あなた抜きで始められないよ）' },

    // why: two ← "first" heard, but birthdays read as counting from one already; three ← no number caught at all
    { id: 'n1', skill: 'number', level: 'B1', point: 'age', seg: [52.6, 56.9], keep: true,
      stem: 'How old is the baby turning?',
      choices: ['1', '2', '3'], a: 0,
      cue: '「birthday party」の直前の一語。',
      line: 'how can we have her *first* birthday party…',
      said: '「1歳の誕生日会」と言っている。first birthday ＝ 1歳の誕生日。',
      mean: '生まれた日は数えないので、最初の誕生日は1歳。',
      trap: 'first を「初めて開く会」とだけ取ると、年齢と結びつかない。first birthday は1歳。',
      use: 'It’s his first birthday next week.（来週、あの子の1歳の誕生日）' },

    // R fix: V2, blind 55 % ("sarcastic" didn't fit a real agreement); now an annoyed give-up, so two choices give in
    // why: glad to skip ← "we'll stay" heard as relief; drops it ← "All right" heard as a grudging end to the trip;
    //   she adds a plan at once ("We can just drive up after the party")
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'stay', reveals: ['after'], seg: [57.1, 61.0],
      stem: 'When the couple agree to stay, how does the agreement sound?',
      choices: ['Giving in, but saving the trip for later', 'Glad to have a reason to skip the trip',
                'Annoyed, and dropping the trip for good'], a: 0,
      cue: '「we’ll stay」のすぐあとに続く文。',
      line: 'All right, *we’ll stay*. We can just *drive up after the party*.',
      said: '「分かった、残る。パーティーのあとで車で行けばいいし」と言う。',
      mean: '譲りながら、すぐ代わりの案を出している。しぶしぶだが本気の了承。',
      trap: 'All right を投げやりと取りやすいが、すぐ具体的な案を足す。旅行はやめずに後ろへずらしただけ。',
      use: 'All right, we’ll wait. We can eat later.（分かった、待つよ。食べるのは後で）' },

    // why: "drive up" heard as one word ("driveup"); "after" lost after "up"; three words, linked
    { id: 'x1', skill: 'dict', level: 'B2', point: 'after', seg: [59.1, 61.1],
      stem: 'Type what is said: “We can just ___ the party.” (3 words)', answer: 'drive up after',
      cue: '「just」のあと、三語がつながる部分。',
      line: 'We can just *drive up after* the party.',
      said: '「パーティーのあとで車で行けばいい」と言う。',
      mean: 'drive up ＝ 車で（遠くへ）行く。drive‿up‿after と、子音と母音がつながる。',
      trap: 'up と after がつながり、一語に聞こえやすい。語の切れ目は意味から考える。',
      use: 'We’ll drive up on Saturday.（土曜に車で行くよ）' },
  ]
};
