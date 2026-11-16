// “Andy's Bucket List | Parks and Recreation” (the official Parks and Recreation channel, Season 4): bored with their
// usual night in, April helps Andy act out his bucket list: $1,000 in cash, the best grilled cheese ever, an action scene.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 184 s; whisper's repeated line after it
// is a hallucination, and whisper also repeats 102–109 s. No talking heads in this clip. Untested: 76–92 s ("Nickels…
// ten bucks… lottery", unclear in both sources) and most of the action skit (136–184 s, role-play lines).
// No predict item (no clean 0.3 s pause before a projected move).
// REVIEW 2026-11-16: pass 8, fix 14, drop 1, new 0; ear checks 1
//   Open: f1 ("bucket list") and f3 are still easy for anyone who knows the idiom; their distractors are literal readings.
// EAR CHECK: 79.8 s a2 — April's “I just handed it to you” is flat and dry, not hurt (the hurt choice rests on tone)
import type { Clip } from '../types.ts';

export const bucketList: Clip = {
  id: 'bucketlist', video: '8R5tWHUEn7Q', title: "Andy's Bucket List", dur: 206, wpm: 185, band: 'mid',
  tags: ['家', '恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: Andy ← "you watch me play" comes first, so "me" carries over; take turns ← "and then… you" heard as
    //   swapping roles each time
    { id: 'd1', skill: 'detail', level: 'B2', point: 'prank', seg: [0.3, 8.25],
      stem: 'In Andy’s plan, who makes the prank phone calls?',
      choices: ['April', 'Andy', 'They take turns'], a: 0,
      cue: '「and then」のあと、watch の前後の代名詞。',
      line: 'and then *I can watch you* make some prank phone calls',
      said: '「僕のゲームを君が見て、次に君のいたずら電話を僕が見る」という案。',
      mean: '見る役とやる役が入れかわる。',
      trap: 'you watch me と I watch you が続き、代名詞が逆になる。弱い me と you を聞き分ける。',
      use: 'You cook, and I’ll do the dishes.（料理お願い、皿洗いはやるよ）' },

    // R fix: "too tired to stay up" was a filler (75 % blind); now a pleased reading. Level C1 (implicit stance)
    // why: agreeing ← a plain statement of fact read as 確認・同意 (the Japanese frame); pleased ← Andy's plan lists
    //   her own favorite things, so "we do that every night" can sound fond
    { id: 'i1', skill: 'infer', level: 'C1', point: 'routine', seg: [0.3, 14.0],
      stem: 'What is April hinting with “We do that every night”?',
      choices: ['She is bored with their usual routine', 'She is agreeing it’s their usual plan',
                'She is pleased he knows her habits'], a: 0,
      cue: 'Andy の予定を聞いた直後の、短い返事。',
      line: '*We do that every night.*',
      said: 'Andy の「いつもの夜」の案に、「それ毎晩やってるじゃん」と返す。',
      mean: '同じことの繰り返しに飽きた、という不満。だから次に「変なことしよう」と言う。',
      trap: '事実を言っただけに聞こえるが、予定への返事として言うと「もう飽きた」の意味になる。',
      use: 'We had pasta yesterday, too.（昨日もパスタだったよね）' },

    // R fix: "quotes a marriage expert" and "agrees they need a change" were weak (80 % blind); now three readings of
    //   the same rule-like line
    // why: parents ← "repetition is the key to…" sounds like a quoted rule; trouble ← "a good marriage" heard as the
    //   topic he's worried about
    { id: 'h1', skill: 'humor', level: 'C1', point: 'repeat', reveals: ['routine'], seg: [0.3, 14.0],
      stem: 'Why is Andy’s answer about “a good marriage” funny?',
      choices: ['He dresses up their dull routine as a rule', 'He hints that their marriage is in trouble',
                'He repeats a rule his parents taught him'], a: 0,
      cue: '「It’s because」のあと、理由のつけ方。',
      line: 'It’s because *repetition is the key* to a good marriage.',
      said: '「繰り返しこそ、いい結婚のカギだからさ」と返す。',
      mean: 'ただの手抜きの習慣を、格言のように言い換えて正当化している。そのずれが笑い。',
      trap: '格言っぽい言い方なので本当の教えに聞こえるが、誰かの言葉ではなく、その場の言い訳。',
      use: 'Practice is the key to getting better.（上達のカギは練習）' },

    // R fix: the title ("Andy's Bucket List") answered "do things Andy dreamed of" (90 % blind); now asks why the night
    //   changes, and the title fits a distractor. Level B2 (two lines tied)
    // why: done much ← "bucket list" suggests a life-regret talk; celebrate ← "the last night on earth" + the
    //   special-night script
    { id: 'g1', skill: 'gist', level: 'B2', point: 'plan', reveals: ['routine', 'bucket'], seg: [0.3, 19.8],
      stem: 'Why do Andy and April change their plans for the night?',
      choices: ['April is bored of doing the same things', 'Andy feels he hasn’t done much with his life',
                'It is a special night they want to mark'], a: 0,
      cue: '最初の案への返事と、そのあとの誘い。',
      line: 'We do that *every night*. … Let’s do *something weird*.',
      said: 'Andy の案に April が「毎晩それじゃん」と返し、「変なことしよう」と誘う。',
      mean: 'きっかけは April の退屈。そこで Andy が夢のリストを出す。',
      trap: 'bucket list から人生の反省と取りやすいが、言い出したのは April。',
      use: 'Let’s do something different tonight.（今夜はいつもと違うことしよう）' },

    // R fix: the stem quoted the marker under test (75 % blind); it now names the moment
    // why: come outside ← "come" read literally (来て); doesn't believe ← "Come on!" is also said in disbelief (まさか)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'comeon', reveals: ['lastnight'], seg: [13.7, 19.85],
      stem: 'Right after “Let’s do something weird”, what do April’s next two words do?',
      choices: ['Push Andy to go along with it', 'Ask Andy to come outside with her', 'Show she doesn’t believe Andy'],
      a: 0,
      cue: '「something weird」のすぐあと、文頭の2語。',
      line: 'Let’s do something weird. *Come on*, it could be the last night on earth.',
      said: '「変なことしようよ。ねえ、今夜が地球最後の夜かもよ」と誘う。',
      mean: 'Come on ＝「ねえ、いいでしょ」。相手の背中を押すときの言い方。',
      trap: 'come を「来る」と取ると外出の話に、「まさか」の Come on! だと不信になる。前後の誘いで判断。',
      use: 'Come on, just one more song!（ねえ、あと1曲だけ！）' },

    // why: happened last night ← "last night" = 昨夜; anniversary ← "a good marriage" just before + special-night script
    { id: 'd2', skill: 'detail', level: 'B1', point: 'lastnight', seg: [13.7, 19.85],
      stem: 'What reason does April give for doing something weird?',
      choices: ['Tonight might be the last night ever', 'Something weird happened last night',
                'It is their wedding anniversary tonight'], a: 0,
      cue: '「Come on」のあと、「earth」で終わる部分。',
      line: 'it could be the *last night on earth*.',
      said: '「今夜が地球最後の夜かもしれないし」と言う。',
      mean: '「人生は一度きり、今夜を楽しもう」という大げさな誘い文句。',
      trap: 'last night は「昨夜」の意味でよく使うので過去の話に聞こえやすい。on earth まで聞くと「最後の夜」。',
      use: 'Live a little. You only live once.（少しは羽目を外そう。人生一度きり）' },

    // R fix: "before he dies" isn't in the audio (only the dreams he lists show it), and "buy for the house" was weak
    //   (95 % blind); the key now says what the list shows
    // why: dares ← a list of crazy stunts (skydiving, outrun a hippo) sounds like dares; jobs ← "list" = a to-do list
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'bucket', seg: [13.7, 23.6],
      stem: 'What is a “bucket list”, as Andy uses it?',
      choices: ['Big things he hopes to do someday', 'Dares his friends have given him',
                'Jobs he still has to do at home'], a: 0,
      cue: 'リストの最初の項目を聞くと分かる。',
      line: 'We could do something off my *bucket list*. … Catch a winning touchdown at the Super Bowl',
      said: '「やりたいことリストから何か」と言い、夢を挙げ始める。',
      mean: 'bucket list ＝ 死ぬまでにやりたいことのリスト。大きな夢を並べる。',
      trap: 'bucket（バケツ）や list から家の用事を想像しやすい。中身を聞けば、自分の夢のリスト。',
      use: 'Paris is on my bucket list.（パリは死ぬまでに行きたい場所）' },

    // R fix: "watch it again with Shaq" was a filler (55 % blind); now a sequel reading of "remake"
    // why: genie himself ← "he plays a genie" heard as "I play"; sequel ← "remake" read as wanting more of a film
    //   he loved
    { id: 'i2', skill: 'infer', level: 'C1', point: 'kazam', seg: [28.15, 33.8],
      stem: 'What does Andy suggest about the original movie?',
      choices: ['He thinks it wasn’t done well', 'He wants to play the genie himself',
                'He loved it and wants a sequel'], a: 0,
      cue: '映画の話の最後、2回目の「I’d like to」。',
      line: 'I’d like to remake the movie… where he plays a genie, and I’d like to *get it right*.',
      said: 'シャックの映画を作り直し、「ちゃんと作りたい」と言う。',
      mean: 'get it right ＝ ちゃんとやる。裏を返せば、元の映画は失敗作という含み。',
      trap: 'he を I と聞くと「自分が演じたい」に。remake は作り直すことで、続編ではない。',
      use: 'This time, let’s get it right.（今度こそちゃんとやろう）' },

    // R fix: "Jump out of one" was defensible (skydiving is on the list, K1); now a private plane
    // why: learn to fly ← "fly… a plane" heard as flying it; private ← "first class" heard only as "a fancy flight"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'plane', seg: [28.95, 38.1],
      stem: 'What does Andy want to do with a plane?',
      choices: ['Fly first class on one', 'Learn to fly one himself', 'Ride in a private one'], a: 0,
      cue: 'リストの後半、「plane」で終わる項目。',
      line: 'Go skydiving, outrun a hippo, *fly first class* on a plane.',
      said: 'スカイダイビング、カバと競走、ファーストクラス、と続ける。',
      mean: 'fly first class ＝ ファーストクラスで旅する。',
      trap: 'fly を「操縦する」と取りやすい。fly のすぐあとの2語で、どんな乗り方かが決まる。',
      use: 'I’ve never flown business class.（ビジネスクラスに乗ったことない）' },

    // R fix: "argue about money" was weak and the key was the title (80 % blind); all three now fit a bucket list
    // why: big trip ← the usual bucket-list script (travel, skydiving); gives up ← "disappointing", "Not ready",
    //   "Super scared" read as quitting
    { id: 'g2', skill: 'gist', level: 'B2', point: 'scene', reveals: ['cash'], seg: [42.3, 184.5],
      stem: 'What happens over the rest of the clip?',
      choices: ['They act out his wishes in homemade ways', 'They plan a big trip to tick off his list',
                'Andy gives up on his list after a few tries'], a: 0,
      cue: 'お金、サンドイッチ、アクション、と場面が続く。',
      said: '現金1000ドル、最高のサンドイッチ、アクションスター。April が付き合い、一つずつやってみる。',
      mean: '妻が夫の夢のリストを、手作りの方法でかなえていく流れ。',
      trap: 'がっかりや怖がる場面があるので「あきらめる」と取りやすいが、次々に挑戦している。',
      use: 'Let’s cross one off the list.（リストを一つ消そう）' },

    // R fix: "nearly all their money" made the key the only specific one, "paid a bill" was weak (65 % blind)
    // why: lottery ← "win the lottery" is on the list; borrowed ← "bank" + "a thousand dollars" in one picture
    { id: 'i3', skill: 'infer', level: 'B2', point: 'cash', reveals: ['left', 'actionstar'], seg: [45.95, 58.1],
      stem: 'What have Andy and April just done?',
      choices: ['Taken out a thousand dollars in cash', 'Won a thousand dollars in the lottery',
                'Borrowed a thousand dollars from the bank'], a: 0,
      cue: '数を数える声と、残高を聞くやり取り。',
      line: 'You wanted to *hold a thousand dollars cash* in your hands?',
      said: '1000まで数えてもらい、残高は18ドルほど。「現金1000ドルを手に持ちたかったんでしょ」。',
      mean: '口座のお金をほぼ全部、現金で下ろした。',
      trap: 'lottery もリストにあるので「当たった」と取りやすい。口座の残高を聞くのは自分のお金だから。',
      use: 'I need to take out some cash.（現金を下ろさなきゃ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'howmuch', seg: [48.5, 50.7],
      stem: 'Type the question: “And ___ in the bank account?” (4 words)', answer: 'how much is left',
      cue: '数え終わった直後の質問の出だし。',
      line: 'And *how much is left* in the bank account?',
      said: '「で、口座にはいくら残ってる？」と聞いている。',
      mean: 'much is がつながって「マッチズ」、is left も「ズレフ」と一続き。',
      trap: 'is は弱く、much is が一語に聞こえる。抜かすと語数が合わない。',
      use: 'How much is left on the card?（カードの残高いくら？）' },

    // why: $80.04 ← eighteen/eighty (-teen/-ty); $18.40 ← "four cents" heard as forty; $8.04 ← weak "eigh-" onset only
    { id: 'n1', skill: 'number', level: 'B1', point: 'left', seg: [48.6, 54.8], keep: true,
      stem: 'What amount is still in their bank account?',
      choices: ['$8.04', '$18.04', '$18.40', '$80.04'], a: 1,
      cue: '「bank account」と聞いたあとの答え。',
      line: '*18 and four cents.*',
      said: '残高は「18ドルと4セント」。',
      mean: '1000ドルを下ろしたあとに残ったのは、ほんの少しだけ。',
      trap: 'eighteen は後ろの「ティーン」が強く長い。eighty は前が強い。four cents も forty と取らないように。',
      use: 'That’ll be eighteen dollars and four cents.（18ドル4セントです）' },

    // why: a little ← the amount is small, so meaning pulls to "little"; a bit ← another short word ending in a lost t
    { id: 's1', skill: 'sound', level: 'B2', point: 'leftover', reveals: ['left'], seg: [50.6, 55.55],
      stem: 'Fill the gap: “Whoa, still ___ left over.”',
      choices: ['a lot', 'a little', 'a bit'], a: 0,
      cue: '「Whoa」のあと、量を表す短い語。',
      line: 'Whoa, still *a lot* left over.',
      said: '残高18ドルちょっとに「おお、まだたくさん残ってる」。',
      mean: 'a lot の t は次の l の前でほぼ消え、「アラッ」と止まる。',
      trap: '残高が少ないので、意味から a little を選びやすい。音の数で判断。little は2音節。',
      use: 'There’s still a lot left.（まだたくさん残ってるよ）' },

    // R fix: line and cue leaned on "Here you go… Yeah", which only whisper has (N1); "nervous" was weak (55 % blind).
    //   Now unsure: April recounts the cash right after. Its ear check is gone
    // why: thrilled ← it's his dream coming true; unsure ← April counts it out again just after
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'disappoint', seg: [54.65, 64.3],
      stem: 'Holding the $1,000 for the first time, how does Andy feel?',
      choices: ['Let down by how it feels', 'Thrilled to finally hold it', 'Unsure it’s all really there'], a: 0,
      cue: '現金を手にしたあとの、短い感想。',
      line: 'That’s *super disappointing*.',
      said: '1000ドルを渡されて「うん、すっごくがっかり」と言う。',
      mean: '夢だった現金なのに、思ったほどの感動がない。',
      trap: '夢がかなう場面なので、喜ぶと予想しやすい。super のあとの一語が本音。',
      use: 'Honestly, it was a bit disappointing.（正直ちょっと期待外れだった）' },

    // R fix: the key was the only plain reading (60 % blind); "excited" now answers the yes/no question literally
    // why: excited ← the question taken at face value (have you seen this much?); hurt ← "I just handed it to you"
    //   read as a complaint about thanks (恩着せ frame)
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'handed', seg: [75.8, 81.5],
      stem: 'How does April sound when she answers Andy’s question about the cash?',
      choices: ['Dry; his question answers itself', 'Excited; she has never seen that much either',
                'Hurt; she wants him to thank her'], a: 0,
      cue: '質問への答えが、質問に合っているか。',
      line: 'Have you ever seen this much cash…? — *I just handed it to you.*',
      said: '「こんな大金、見たことある？」と聞かれ、「今それ渡したの私だけど」と返す。',
      mean: 'もちろん見ている、という当たり前を淡々と指摘する、冷めたつっこみ。',
      trap: '「渡したのは私」を恩着せや不満と取りやすい。声が平らなら、ただの冷静なつっこみ。',
      use: 'Um, I was literally just there.（いや、私もその場にいたけど）' },

    // R fix: the key was the only choice built on April's words (80 % blind); all three use them now
    // why: polite ← praise heard as 社交辞令 (the Japanese frame); forgot ← "my bucket list doesn't say" read as
    //   checking his memory
    { id: 'h2', skill: 'humor', level: 'C1', point: 'awesome', seg: [91.7, 103.3],
      stem: 'Why does the audience laugh at Andy’s “Honey, my bucket list doesn’t say…”?',
      choices: ['He treats “pretty awesome” as not good enough', 'He thinks her “pretty awesome” is only polite',
                'He forgot his list said “pretty awesome”'], a: 0,
      cue: 'April のほめ言葉と、リストの言葉を比べて。',
      line: 'my bucket list doesn’t say make a *pretty awesome* grilled cheese sandwich.',
      said: '「けっこう最高」に、「リストには『けっこう最高』とは書いてない」と返す。',
      mean: 'ほめられたのに、リストどおり「史上最高」でないとダメだと本気で言う。その真面目さが笑い。',
      trap: '答えを否定するので、お世辞と疑っているように聞こえる。比べているのは言葉の強さ。',
      use: 'Good isn’t good enough for me.（「良い」じゃ足りないんだ）' },

    // why: add more ← "cheese" repeated; ready-made ← "store" heard, so buying a sandwich seems natural
    { id: 'd4', skill: 'detail', level: 'B1', point: 'store', seg: [98.5, 109.6],
      stem: 'What does Andy plan to do about the sandwich?',
      choices: ['Go back to the store for other cheese', 'Add more cheese to the one he made',
                'Buy a ready-made one at the store'], a: 0,
      cue: '「Honey」で始まる文のあと。',
      line: '*Gotta go back to the store.* We’re gonna get a *different kind of cheese*.',
      said: '「店に戻らなきゃ。別の種類のチーズを買う」と言う。',
      mean: '「まあまあ」では満足できず、作り直すつもり。',
      trap: 'store が聞こえると「店で買う」と取りやすいが、買うのはチーズ。作るのは自分。',
      use: 'I have to run back to the store.（ちょっと店に戻らなきゃ）' },

    // R fix: the key's "upgrading her praise" was the one precise choice (65 % blind); now three parallel aims
    // why: admit ← "seriously" read as 正直に言うと, a confession; better cheese ← "different kind of cheese" just before
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'stopit', reveals: ['store'], seg: [103.1, 109.95],
      stem: 'Why does April say “No, no, no, dude, seriously…”?',
      choices: ['To keep him home by praising it more', 'To admit she didn’t really like it',
                'To ask him to pick a better cheese'], a: 0,
      cue: 'Andy が店に戻ると言った直後の返事。',
      line: 'No, no, no, dude, *seriously*. This is *the most amazing* grilled cheese sandwich ever made, okay?',
      said: '「いやいや、本気で。史上最高のグリルドチーズだよ、ね？」と言い直す。',
      mean: 'Andy の言葉に合わせてほめ方を上げ、買い物に行かせないようにしている。',
      trap: 'seriously を「正直に言うと」と取ると告白に聞こえる。ここは「本当だってば」と強める言葉。',
      use: 'No, seriously, it’s perfect.（いや本当に、完璧だよ）' },

    // why: joking ← Andy's playful voice; waiting ← "ready" heard as April's readiness
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'scared', seg: [109.65, 119.6],
      stem: 'At “Wait!”, what is going on with Andy?',
      choices: ['He suddenly gets too scared to go on', 'He is joking to make April laugh',
                'He is waiting for April to be ready'], a: 0,
      cue: '「Wait!」のあとの短い言葉二つ。',
      line: 'Wait! *Not ready. Super scared.*',
      said: '「準備OK」と言ったすぐあとに「待って！やっぱ無理。超こわい」と言う。',
      mean: 'やる気を見せたのに、直前で怖くなった。',
      trap: 'ready が何度も聞こえるので、April の準備の話と取りやすい。Not ready の主語は自分。',
      use: 'Wait, I’m not ready yet!（待って、まだ心の準備が！）' },

    // why: want to ← the -ed melts into "to", so the past is lost; were going to ← "said you…" sets up a reported plan
    { id: 's2', skill: 'sound', level: 'B2', point: 'actionstar', seg: [115.95, 119.6],
      stem: 'Fill the gap: “Andy, you said you ___ be an action star.”',
      choices: ['wanted to', 'want to', 'were going to'], a: 0,
      cue: '「you said you」のあと、速くつながる部分。',
      line: 'Andy, you said you *wanted to* be an action star.',
      said: '「アクションスターになりたいって言ってたよね」。',
      mean: 'wanted to は「ウォニッタ」のように縮む。said に合わせて過去形。',
      trap: '-ed と to がくっつき、want to に聞こえやすい。said（過去）のあとは時制がそろうことが多い。',
      use: 'I always wanted to try surfing.（ずっとサーフィンやってみたかった）' },

    // R fix: the stem quoted the phrase whose meaning is the key (90 % blind); it now names the moment. The words
    //   agree in both sources; the seg already holds both timings for "work", so its ear check is gone
    // why: bound to fail ← "crazy enough" heard as "too crazy"; crazy person's job ← "work" read as 仕事
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'crazy', seg: [130.9, 141.4],
      stem: 'What does the reply to “It seems a little crazy” mean?',
      choices: ['So wild it might actually succeed', 'So wild it is bound to go wrong',
                'Only a crazy person would take the job'], a: 0,
      cue: '「a little crazy」への返事。最後の一語の意味。',
      line: 'It seems a little crazy. — *Just crazy enough to work.*',
      said: '「ちょっとむちゃじゃない？」に、「むちゃだからこそ、うまくいく」と返す。',
      mean: '映画でおなじみの決めぜりふ。work ＝ うまくいく。',
      trap: 'work を「仕事」と取ると意味がずれる。計画の話で work と来たら「うまくいく」。',
      use: 'It’s crazy, but it might just work.（むちゃだけど、案外いけるかも）' },

    // R drop: f2 ("cheaters"): the key rests on captions "I cannot see"; whisper has "I cannot say any of that", which
    //   would make cue cards right (K1 at heart, and in the untested skit). Never shipped, deleted
  ]
};
