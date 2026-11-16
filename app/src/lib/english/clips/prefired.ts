// REVIEW 2026-11-16: pass 4, fix 15, drop 1, new 1; ear checks 0
// Open: four items (a2, h2, i2, nt1) turn on one idea, Jim doubting the promotion; they're tied by reveals, but the
//   bank leans on it. A second blind read still lands on g2, h1, i1 and pr2 at 60–75 % after one rewrite each.
// “If You Haven't Fallen In Love With Me By Then - The Office US” (the official The Office channel, BEST OF SEASON
// 7): Dwight, acting manager, explains away his villain-style office, asks Jim to behave while Joe visits, can't fire
// him, so "pre-fires" him; Jim tells the camera he never thought Dwight would keep the job.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈64.5 s (music after; whisper loops the
// last line). Untested: 0–2.7 s (“Bond villain” rests on world knowledge), 58.3–61 s (captions “pretty premature”,
// whisper “pre-premature”).
// EAR CHECK: none. Both sources agree on every key's words; “When/And I gave him my word, so…” (29.4 s pr2) differs
//   only in the first word, which no key uses.
import type { Clip } from '../types.ts';

export const prefired: Clip = {
  id: 'prefired', video: '5HUQOzZLzFc', title: 'If You Haven\'t Fallen In Love With Me By Then',
  dur: 86, wpm: 171, band: 'fast',
  tags: ['職場', 'お願い・断り'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: K1/V2: both blind readers picked “a host proudly showing off”, which Dwight’s item-by-item tour can support; the stem now asks what the name repeat signals, and the choices split on wrong/caught/pleased.
    // why: caught out ← "embraced the whole Bond villain aesthetic" heard as a hit; pleased ← he goes on to show off each thing, heard as pride
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'jimjim', reveals: ['opening'], seg: [0, 10.6],
      stem: 'When Jim comments on the office’s look, what does “Jim, Jim, Jim” signal?',
      choices: ['That Jim has read it all wrong', 'That Jim has caught him out at last', 'That he is pleased Jim noticed the look'], a: 0,
      cue: '名前を3回くり返す呼びかけと、そのあとの説明。',
      line: 'Oh, *Jim, Jim, Jim*. The gun is a Beaumont Adams…',
      said: '名前を3回呼んでから、銃や魚にはちゃんと理由があると一つずつ説明する。',
      mean: '名前のくり返しは「分かってないなあ」という見下した言い方。悪役っぽさを否定している。',
      trap: '品物の説明が続くので自慢に聞こえやすい。でも始まりは訂正の呼びかけ。',
      use: 'Oh, Mom, Mom, Mom. It’s not like that.（もう、母さん、そうじゃないって）' },

    // R fix: V2: “gifts” and “help redo” were easy to drop; all three now cover “each odd thing”.
    // why: Joe’s idea ← "Joe collects them" heard as Joe choosing the room; scare ← the villain look read as aimed at Jim
    { id: 'g2', skill: 'gist', level: 'B2', point: 'opening', reveals: ['gun', 'rescue', 'desk'], seg: [0, 16.5],
      stem: 'What is Dwight doing in his first long reply to Jim?',
      choices: ['Giving a harmless reason for each odd thing', 'Saying each odd thing was Joe’s idea, not his', 'Saying each odd thing is a joke to scare Jim'], a: 0,
      cue: '銃、魚、机。それぞれのあとに続く一言。',
      said: '銃は Joe との雑談用、ピラニアは保護した魚、机は写真を見て作ったまね、と話す。',
      mean: '悪役みたいな部屋だと言われ、一つずつ「ちゃんと理由がある」と返している。',
      trap: 'Joe の名前で「Joe の考え」に聞こえやすい。集めるのは Joe。',
      use: 'There’s a reason for everything here.（ここの物には全部わけがあるの）' },

    // R fix: V2: “make Jim nervous” was easy to drop; all three now involve Joe.
    // why: gift ← "Joe collects them" heard as the gun being for Joe; too ← "collects" heard with Dwight as the subject
    { id: 'd1', skill: 'detail', level: 'B1', point: 'gun', seg: [3.9, 10.6],
      stem: 'Why does Dwight say the old gun is in his office?',
      choices: ['To have something to chat with Joe about', 'To give to Joe as a gift for his collection', 'To show Joe that he collects them too'], a: 0,
      cue: '銃の名前のすぐあと、誰が集めているか。',
      line: '*Joe collects them*. I thought we could have some nice *small talk* about it.',
      said: '「Joe が集めているから、それで少し雑談できると思って」。',
      mean: 'small talk ＝ 軽い雑談。上の人の好きな物で話題を用意した。',
      trap: 'Joe collects から「Joe にあげる」と取りやすい。about it まで聞く。',
      use: 'Let’s skip the small talk.（世間話は抜きにしよう）' },

    // why: pests ← rescue read as a job the fish does (守る役); dinner ← "saved from being eaten" as a sitcom joke
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'rescue', seg: [8.7, 11.8],
      stem: 'What does Dwight mean when he says what the piranha is?',
      choices: ['He took it in after someone gave it up', 'He keeps it to save the tank from pests',
                'He saved it from being someone’s dinner'], a: 0,
      cue: 'piranha のあと、最後の一語。',
      line: 'And the piranha’s *a rescue*.',
      said: '「それにピラニアは保護した子なんだ」と言う。',
      mean: 'a rescue ＝ 飼い主に手放された動物を引き取ったもの。怖い物好きではない、という言い訳。',
      trap: 'rescue を「助ける役目」と取ると意味が変わる。犬や猫にもよく使う言い方。',
      use: 'Our dog is a rescue.（うちの犬は保護犬なの）' },

    // why: real ← "desk" twice and a famous owner make it sound like the original; Joe ← the name heard just before
    { id: 'd2', skill: 'detail', level: 'B1', point: 'desk', seg: [11.3, 16.5],
      stem: 'What does Dwight say about his desk?',
      choices: ['It copies one he saw in a magazine photo', 'It is the real desk of a famous man',
                'It was a gift Joe picked out from a magazine'], a: 0,
      cue: 'desk の2回目のあと、名詞を一つ。',
      line: 'The desk is a *replica* of… desk. I *saw a picture* in Newsweek.',
      said: '「この机はある人の机の複製。雑誌で写真を見た」と話す。',
      mean: 'replica ＝ 本物をまねて作った物。写真を見て同じ物を作らせた。',
      trap: '有名人の名前が出るので本物に聞こえやすい。replica と picture が手がかり。',
      use: 'It’s just a replica, not the real thing.（ただの複製で、本物じゃない）' },

    // R fix: V2: “saying sorry” was easy to drop; both distractors are now readings of “busy”.
    // why: leave ← "very busy man" heard as a brush-off; help ← busy heard as a call for help
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'business', seg: [16.1, 19.15],
      stem: 'When Dwight says how busy he is, what is he doing?',
      choices: ['Cutting the small talk to get to his point', 'Hinting that Jim should leave him to work', 'Asking Jim to help with his heavy workload'], a: 0,
      cue: 'Listen で始まる2文の、2文目。',
      line: 'Listen, I’m a very busy man. *Let’s get right down to business*.',
      said: '「なあ、私は忙しい。さっそく本題に入ろう」。',
      mean: '雑談を切り上げて用件に入る合図。Jim を追い払っているのではない。',
      trap: 'busy や business から「仕事に戻れ」と取りやすい。Let’s のあとは二人でする事。',
      use: 'Okay, let’s get down to business.（じゃあ、本題に入りましょう）' },

    // why: tomorrow / this week ← later heard as a vague "later on"; the number of days isn't said
    { id: 'd3', skill: 'detail', level: 'B1', point: 'joe', seg: [16.1, 22.6],
      stem: 'When is Joe coming to the office?',
      choices: ['Later today', 'Tomorrow', 'This weekend'], a: 0,
      cue: 'Okay のあと、Joe で始まる短い文。',
      line: 'Joe is coming *later today*.',
      said: '「Joe が今日このあと来る」と伝える。',
      mean: 'later today ＝ 今日のこのあと。だから今すぐ約束がほしい。',
      trap: 'later だけ聞くと「そのうち」に聞こえる。後ろの today まで聞く。',
      use: 'I’ll call you later today.（今日このあと電話するね）' },

    // R fix: V2: the help/apology choices were easy to drop; all three are now promises. C5: its key states p2’s, so it now reveals best.
    // why: praise ← the visit + "make me look" heard as wanting to look good; stay away ← "cannot have a subordinate" heard as wanting Jim gone
    { id: 'g1', skill: 'gist', level: 'B1', point: 'behave', reveals: ['joe', 'stupid', 'best'], seg: [16.1, 31.2],
      stem: 'What does Dwight want from Jim before Joe arrives?',
      choices: ['A promise not to make him look bad', 'A promise to praise him in front of Joe', 'A promise to stay away while Joe is here'], a: 0,
      cue: 'promise のあと、何を約束してほしいか。',
      line: 'Joe is coming later today… I need you to *promise me*…',
      said: 'Joe が来るので、部下にばかにされたくない。おとなしくすると約束して、と頼む。',
      mean: '用件は「Joe の前で恥をかかせるな」。Jim はそれを断っていく。',
      trap: 'look だけだと「よく見せて」に聞こえる。make me look stupid が用件。',
      use: 'Please don’t embarrass me tonight.（今夜は恥をかかせないでね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'stupid', seg: [19.0, 22.6],
      stem: 'Type what Dwight can’t have: “a subordinate trying to ___.” (4 words)', answer: 'make me look stupid',
      cue: 'subordinate のあと、短い語が続いて最後に形容詞。',
      line: 'I cannot have a subordinate trying to *make me look stupid*.',
      said: '「部下に私をばかに見せようとされては困る」。',
      mean: 'make me look ＋形容詞 ＝ 私を〜に見せる。人前での立場を気にしている。',
      trap: 'make me が「メイクミ」と一続きで、look も短い。最後の語だけ強い。',
      use: 'Don’t make me look bad.（私の顔をつぶさないで）' },

    // R fix: V2: “politely” was the only sensible promise, and a “best” stem pointed at the idiom (2nd blind read 80 %); no choice repeats “best” now.
    // why: best work ← best read as 全力 (do your best); friend ← best + "promise me" heard as a friendship ask
    { id: 'p2', skill: 'phrase', level: 'B1', point: 'best', seg: [22.2, 25.25],
      stem: 'What does Dwight want Jim to promise?',
      choices: ['Behave well and cause no trouble', 'Work as hard as he can all day', 'Act like Dwight’s close friend today'], a: 0,
      cue: 'promise me that you’ll be のあと。',
      line: 'I need you to promise me that you’ll be *on your best behavior*.',
      said: '「お行儀よくすると約束してほしい」。',
      mean: 'on one’s best behavior ＝ 人前で行儀よくする。子どもに言う決まり文句。',
      trap: 'best から「全力で働く」と取りやすい。behavior が付くと態度の話になる。',
      use: 'Be on your best behavior at Grandma’s.（おばあちゃんちではいい子にね）' },

    // R new: replaces s1 (a fresh blind read gives about 40 %: "I’d", "I’ll" and "I would" all fit after "promised that")
    // why: I’ll ← the d is short before "be", so only "I" is caught and the promise sounds future; I would ← the full
    //   form a learner’s grammar expects after "promised"
    { id: 's2', skill: 'sound', level: 'B2', point: 'worst', seg: [22.2, 29.3],
      stem: 'Fill the gap: “I promised other people that ___ be on my…”',
      choices: ['I’d', 'I’ll', 'I would'], a: 0,
      cue: 'that のあと、be の前のとても短い音。',
      line: 'I promised other people that *I’d* be on my worst behavior.',
      said: '「ほかの人に、最悪の態度でいると約束した」と返す。I’d は I would の短縮。',
      mean: 'promised のあとなので would の形。d は be の前で弱い。',
      trap: 'd が弱いと I’ll に聞こえる。I’ll なら l の音が残る。',
      use: 'I said I’d be there by six.（6時までに行くって言ったよ）' },

    // R fix: V2: “breaks promises” was easy to drop; all three are now “a prior promise”.
    // why: same ← "promised other people" heard without the best/worst swap; day off ← "other people" + "my word" heard as plans elsewhere
    { id: 'h1', skill: 'humor', level: 'C1', point: 'worst', reveals: ['best'], seg: [22.2, 28.8],
      stem: 'Why does Jim’s answer to the request get a laugh?',
      choices: ['He claims a prior promise to do the opposite', 'He claims a prior promise to do the same for Joe', 'He claims a prior promise to take the day off'], a: 0,
      cue: 'Dwight の頼みと Jim の返事で、一語だけ違う所。',
      line: 'I promised other people that I’d be on my *worst behavior*.',
      said: '「ほかの人たちに、最悪の態度でいると約束したんで」と返す。',
      mean: 'best を worst に変えただけの返事。先約があるふりで、まじめに断るより痛い。',
      trap: '同じ形の文なので同じ約束に聞こえやすい。くり返しの中で変わった語を聞く。',
      use: 'Sorry, I promised to be lazy today.（ごめん、今日はだらける約束でね）' },

    // R fix: V2: “asking what he ought to do” was weak; replaced with a hand-back reading of “so…”.
    // why: agreeing ← "promise" and "my word" heard as a yes; leaving ← the trailing "so…" heard as handing the choice back (どうする？)
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'word', seg: [25.0, 31.2],
      stem: 'When Jim trails off at the end of his reply, what is he doing?',
      choices: ['Turning Dwight down without saying no', 'Agreeing, as long as Dwight asks nicely', 'Leaving it to Dwight to make the call'], a: 0,
      cue: '返事の最後の、短い一語のあとの間。',
      line: '…I gave him my word, *so*…',
      said: '「もう約束しちゃったんで、だから…」と言いかけてやめる。',
      mean: '文末の so… は「だから無理」を言わずに伝える形。はっきり断るより軽く聞こえる。',
      trap: '語尾が消えるので質問や迷いに聞こえやすい。so で止めたら結論は言わなくても分かる。',
      use: 'I already have plans, so…（もう予定があって、だから…）' },

    // R fix: V2: “quit” was easy to drop; replaced with “office manager” said in the wrong relation.
    // why: Joe ← the visit heard as the reason; office manager ← the title said, in the wrong relation
    { id: 'd4', skill: 'detail', level: 'B2', point: 'acting', seg: [30.9, 37.2],
      stem: 'Why can’t Dwight fire Jim, according to Jim?',
      choices: ['He is only filling in as manager for now', 'Only Joe has the power to fire people', 'He is office manager, not a real boss'], a: 0,
      cue: 'You’re のあと、manager が2回出る。',
      line: 'You’re *acting manager*, not office manager, so you have *no firing powers*.',
      said: '「あなたは代理で、正式なマネージャーじゃない。だからクビにする権限はない」。',
      mean: 'acting ＝ 代理の。演技の意味ではない。肩書きで権限が決まる。',
      trap: 'acting を「演技」と取ると話が通らない。役職名の前の acting は「代理」。',
      use: 'She’s the acting director this month.（今月は彼女が部長代理です）' },

    // R drop: s1 (V2: “You wouldn’t dare” is a set phrase, so the gap filled itself; replaced by s2)

    // R fix: V2: “fired once before” was easy to drop; both distractors are now firing conditions.
    // why: unless ← the best-behavior request heard as the condition; earn back ← pre- heard as a trial (仮)
    { id: 'i1', skill: 'infer', level: 'B2', point: 'prefire', seg: [37.2, 46.8],
      stem: 'What does Dwight’s made-up firing word mean?',
      choices: ['Jim will be fired once Dwight has the power', 'Jim will be fired unless he behaves for Joe', 'Jim is fired now, but can earn his job back'], a: 0,
      cue: 'promoted のあと、full が付く言い方。',
      line: 'You’re *pre-fired*. And *when I’m promoted*, you’ll be *full fired*.',
      said: '「お前は仮クビだ。私が昇進したら本クビになる」と言う。',
      mean: '今は権限がないので、昇進したら有効になるクビを先に言い渡した。pre- は「前もって」。',
      trap: 'pre- を「仮の」と取ると、取り消せる処分に聞こえる。when のあとが条件。',
      use: 'I pre-ordered the new phone.（新しいスマホを予約注文した）' },

    // R fix: V2: “Nothing … won’t come” was the only twist; the choices now split on how much it is worth and why.
    // why: plans to quit ← "I would have pre-quit" heard as a plan, not a past "if"; Joe ← the visit heard as the deadline
    // anchor: 52.6–57.7 s “If I had thought… a real chance… permanent manager, I would have pre-quit”: the threat
    //   waits on a promotion Jim doesn't believe in
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'prequit', reveals: ['prefire'], seg: [37.2, 58.0],
      stem: 'After Jim’s words to the camera, what is the “pre-firing” really worth?',
      choices: ['Little, since Jim doubts the promotion will come', 'Little, since Jim plans to quit before it happens', 'A lot, since it takes effect the day Joe arrives'], a: 0,
      cue: 'Dwight の条件と、カメラへの Jim の一言を合わせて。',
      line: 'when I’m promoted, you’ll be full fired. … If I had thought that there was *a real chance*…',
      said: '昇進したら本クビ、と脅されたあと、Jim は「正式になると思っていたら先に辞めていた」と話す。',
      mean: '脅しは昇進が条件。カメラへの一言で、Jim はその条件が来ないと見ていると分かる。',
      trap: 'would have pre-quit を「辞める予定」と取りやすい。条件付きの脅しは条件次第。',
      use: 'That threat doesn’t scare me.（そんな脅し、怖くないよ）' },

    // R fix: V2: “made-up prefix” in the key named the device; reworded.
    // why: himself ← "I always say" heard as Jim laughing at his own habit; planners ← the saying taken as a real
    //   jab at people who plan ahead
    // anchor: 41.8–46 s Dwight's "pre-fired" / "full fired"; 53–64 s Jim piles the same prefix onto quit, premature
    //   and prepared, in Dwight's own sentence shape
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'prepared', seg: [41.3, 65.5],
      stem: 'In Jim’s closing saying, who is the joke on?',
      choices: ['Dwight, whose own word Jim stretches past sense', 'Jim, who catches himself planning too far ahead', 'People who always plan too far ahead'], a: 0,
      cue: '前に作られた言い方を、Jim がどう使うか。',
      line: 'I would have *pre-quit*… it’s better to be *pre-pre-pre-prepared*.',
      said: 'Jim は pre- を quit にも prepared にも付け、重ねて「備えあれば」と言う。',
      mean: 'pre-fire は Dwight の作った言葉。それを重ねてまねるのは本人へのからかい。',
      trap: '「いつも言う」が自分の話に聞こえやすい。相手の言葉をまねて大げさにしたら、的は相手。',
      use: 'Oh, I’m super-duper sure.（ええ、超絶確かですとも）' },

    // R fix: V2: “wants to know when” was weak; all three are now “He thinks the promotion …”. C5: its key states i2’s, so it reveals prequit.
    // why: soon ← if heard as "when", Dwight’s word; go to him ← "If you get promoted" heard as rivalry
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'ifpromo', reveals: ['prequit'], seg: [43.2, 49.4],
      stem: 'When Jim repeats part of Dwight’s threat, what does he show?',
      choices: ['He thinks the promotion may never happen', 'He thinks the promotion will happen soon', 'He thinks the promotion should go to him'], a: 0,
      cue: 'Dwight の when が、Jim の口で何に変わるか。',
      line: 'And *when* I’m promoted… — *If* you get promoted.',
      said: '「昇進したら（when）」を、Jim は「昇進できたらね（if）」と言い直す。',
      mean: 'when を if に変えるだけで「そもそも昇進しないでしょ」という疑いになる。',
      trap: 'if を when と同じに聞くと「すぐ昇進」になる。一語の差が本音。',
      use: 'If it ever happens.（そうなればね）' },

    // R fix: K1/V2: “the promotion is very far off” was one reading of a tease (a fond-Dwight reading was as good); the key now names the move.
    // why: hopes ← "fallen in love with me" taken at face value; deal ← "if" heard as a bargain to calm him
    { id: 'h2', skill: 'humor', level: 'C1', point: 'love', reveals: ['ifpromo'], seg: [47.5, 52.8],
      stem: 'What is Jim doing with his second “if” line?',
      choices: ['Adding a silly condition that mocks the threat', 'Admitting he hopes Dwight will grow to like him', 'Offering a deal so that Dwight will calm down'], a: 0,
      cue: '最後の by then。いつまでの話か。',
      line: '*If* you get promoted. And if you haven’t *fallen in love with me by then*.',
      said: '「それまでに僕を好きになってなかったらね」と付け足す。Dwight は「は？」。',
      mean: 'ありえない条件を足して、昇進後の脅しを笑い話にした。Dwight の「は？」が反応。',
      trap: '恋の話を文字どおりに取ると告白に聞こえる。ありえない条件は、からかいの合図。',
      use: 'Sure, when pigs fly.（はいはい、そのうちね）' },

    // R fix: V2/C5: a2 and nt1 hinted at it; c is now the near opposite of the key, and it reveals ifpromo.
    // why: already quit ← pre-quit heard as something done; afraid ← "permanent manager" heard as his fear
    { id: 'i2', skill: 'infer', level: 'C1', point: 'prequit', reveals: ['ifpromo'], seg: [52.6, 58.0],
      stem: 'What does Jim’s comment to the camera tell us he believes?',
      choices: ['Dwight won’t get the manager job for good', 'He has quit already, before Dwight can fire him', 'Dwight may well get the manager job for good'], a: 0,
      cue: 'If I had thought で始まる文。過去の仮定。',
      line: 'If I had thought that there was *a real chance*… I *would have pre-quit*.',
      said: '「Dwight が正式に上司になると思ったら、先に辞めてた」と話す。',
      mean: '辞めていない＝なるとは思っていない。仮定の形で本音を言っている。',
      trap: 'pre-quit を「もう辞めた」と取りやすい。If I had thought は「思わなかった」の形。',
      use: 'If I’d known, I would have come.（知ってたら来たのに）' },
  ]
};
