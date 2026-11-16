// REVIEW 2026-11-16: pass 2, fix 17, drop 0, new 0; ear checks 1
// “'OUR PRICES HAVE NEVER BEEN LOWER!' - The Office US” (the official The Office channel, BEST OF SEASON 5): Michael
// sets up a practice sales call with Jim as the client; Jim plays "Bill Buttlicker", baits Dwight until he yells,
// then hands Michael a million-dollar sale on one condition: fire the salesman.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 140 s; the rest is music. Untested on
// purpose: 11.9 s (Jim's word: whisper "Micro-Jimment", captions "micro Drummond"), 38.6 s ("Ask him his name",
// whisper only), 49.4 s ("Be respectful, Dwight" vs "you're respectful to him"), 65.6–68.1 s ("change his mind" vs
// "change mine"), 80.5–81.4 s and 83.7 s (garbled in both), 93–98.6 s ("Pete!" vs "hey", "never yell at the client"
// vs "the guy"), 106.6–109.8 s (garbled), 129–130 s and 133.7–135.3 s (garbled), 141.8 s (whisper only). The name
// joke itself is never asked about. Speakers are settled by "Jim is going to be the client", "Dwight, you're going
// to have to sell to him", "What is your name, sir?", "Yes, Michael", "This is Michael Scott" and "Don't do it,
// Michael".
// EAR CHECK: 44.4 s nt2 — the stress in “Really, that's your real name?” falls on “real” (doubt), not on “your” or
//   “Really” (ship only once confirmed)
import type { Clip } from '../types.ts';

export const neverLower: Clip = {
  id: 'neverlower', video: '1QQBB3cwNM0', title: '\'OUR PRICES HAVE NEVER BEEN LOWER!\' - The Office US', dur: 165,
  wpm: 172, band: 'mid', tags: ['職場', '電話'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // anchor: 1.4–10.5 s "I am going to have to fix you, manage you… on a more personal scale, a more micro form of
    //   management": the object is "you", and the scale is one person, watched closely
    // R fix: V2, blind 55 % right; "watch every move" was the only vivid choice. All three now share it and differ
    //   in one dimension each (scope, direction).
    // why: the team ← scope shift: "management" heard as the whole office, missing "fix you, manage you"; stop ←
    //   "on a more personal scale" read as giving Dwight personal space (direction flip)
    // retired: with nt2 (one C2 alone is under the tier's 2)
    { id: 'nt1', skill: 'infer', level: 'C2', retired: true, point: 'micro', seg: [0, 13.5],
      stem: 'Which plain-English version keeps what Michael means in his opening lines?',
      choices: ['“I’m going to watch every single move you make.”', '“I’m going to watch every move the team makes.”',
                '“I’m going to stop watching every move you make.”'], a: 0,
      cue: '「personal」「micro」と言いかえを重ねる部分。',
      said: '「君を直す、管理する、もっと個人的な規模で、もっとミクロな形の管理で」と言葉を探す。',
      mean: 'つまりマイクロマネジメント（細かく見張る管理）。悪い意味の言葉を、遠回しに言いかえている。',
      trap: 'management をチーム全体、personal を「放任」と取りやすい。目的語 you を追う。',
      line: 'I am going to have to *fix you, manage you*… on a more personal scale, a more *micro* form of management.',
      use: 'I don’t need you watching my every move.（いちいち見張らなくていいよ）' },

    // R fix: V2, blind 70 % right; the key was the only practice-call reading. All three are practice calls now.
    // why: Jim sells ← "Jim is going to be the client" heard with the roles swapped; difficult client ← keyword trap:
    //   "difficult" is said, but it's what Dwight must not be
    { id: 'g1', skill: 'gist', level: 'B1', point: 'purpose', reveals: ['rules'], seg: [0, 22.3],
      stem: 'What is Michael setting up at the start?',
      choices: ['A practice call where Dwight must sell without pushing',
                'A practice call where Jim must sell the way Dwight does',
                'A practice call where Dwight must handle a difficult client'], a: 0,
      cue: '「Jim is going to be」のあと、二人への指示。',
      said: 'ジムを客役、ドワイトを営業役にして、攻撃的にならずに売る練習をさせる。',
      mean: 'ロールプレイ（練習の電話営業）で、ドワイトの売り方を直すのが目的。',
      trap: 'difficult から手ごわい客の練習と思いやすい。without being はドワイトの話。',
      use: 'Let’s do a practice run first.（まず練習してみよう）' },

    // R fix: V2, blind 75 % right; the key was the only list that fits Dwight. Each distractor now keeps one of the
    //   three words, so only a listener who catches all three gets it.
    // why: impatient… rude ← "aggressive" caught, the rest filled in; pushy… loud ← "hostile" caught, plus the
    //   "talk louder" stretch later in the clip
    { id: 'd1', skill: 'detail', level: 'B1', point: 'rules', seg: [14.5, 22.3],
      stem: 'What must Dwight avoid while selling to Jim?',
      choices: ['Being aggressive, hostile or difficult', 'Being impatient, aggressive or rude',
                'Being pushy, hostile or far too loud'], a: 0,
      cue: '「without being」のあとの3語。',
      line: 'sell to him *without being aggressive, hostile, or difficult*.',
      said: '「攻撃的、敵対的、扱いにくい態度をとらずに売れ」と言う。',
      mean: 'without being ～ ＝ 〜にならずに。ドワイトの悪いくせを3つ並べている。',
      trap: '3語のうち1語だけ拾うと、似た悪口の組を選びやすい。without のあとは3語とも聞く。',
      use: 'Try to say no without being rude.（失礼にならずに断ってみて）' },

    // R fix: V2, blind 55 % right; the distractors are now acted reactions too.
    // why: caught out ← "Really, that's your real name?" expects a confession (the prank-call script); misheard ← the
    //   fast "How dare you?" taken as "How… what?"
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'realname', seg: [42.0, 49.5],
      stem: 'When Dwight questions the client’s name, how does Jim react?',
      choices: ['He acts insulted, as if Dwight were rude', 'He acts caught out, as if the joke is up',
                'He acts puzzled, as if he misheard Dwight'], a: 0,
      cue: '名前を疑われた直後の、短い3語。',
      line: 'Really, that’s your real name? — *How dare you?* My family built this country, by the way.',
      said: '「本名？」に「失礼な！うちの家族はこの国を築いたんだぞ」と返す。',
      mean: 'How dare you? ＝「よくもそんなことを」。怒ったふりで、相手を失礼な側に立たせる。',
      trap: '「本名？」には白状が続くと思いやすい。短い3語と family の話は抗議。',
      use: 'How dare you read my diary?（よくも日記を読んだわね）' },

    // anchor: 43.5–45.3 s "Really, that's your real name?" → 45.3–49.4 s "How dare you? My family built this country":
    //   Jim answers as if accused of giving a fake name
    // R fix: V2, blind 60 % right; "with no doubt in it" flagged its choice as the foil. Now a sincerity flip.
    // why: on "your" ← the Japanese ear expects 「あなたの」 to carry the focus, as if comparing names; on "Really" ←
    //   sincerity flip: impressed by a rare name, which "How dare you?" rules out
    // retired: the ear-check policy: a C2 stress item (the stress in “Really, that's your real name?” on “real”,
    //   44.4 s); back after the ear check
    { id: 'nt2', skill: 'sound', level: 'C2', retired: true, point: 'realname', seg: [42.0, 49.5],
      stem: 'In “Really, that’s your real name?”, where is the stress, and why?',
      choices: ['On “real”: he suspects the name is fake', 'On “your”: he compares it with his own name',
                'On “Really”: he’s impressed by such a rare name'], a: 0,
      cue: '聞き返しの中で、いちばん強く長い一語。',
      line: 'Really, that’s your *real* name? — How dare you?',
      said: '「本当にそれが本名？」と聞き返され、ジムは「失礼な」と怒ってみせる。',
      mean: 'real を強めると「偽名じゃないの？」という疑いになる。だから相手は侮辱されたように反応する。',
      trap: 'Really だけなら驚きで済むが、返事が「失礼な」なので疑いと分かる。強勢は返事でも確かめられる。',
      use: 'Is that your real phone number?（それ本当の電話番号？）' },

    // R fix: V2, blind 70 % right; the key was the only phone-call phrase. All three are now line requests.
    // why: his order ← "hold" heard, the reason ("my other line") missed; call back ← "my other line" heard as a
    //   request to switch lines
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'hold', seg: [50.7, 54.4],
      stem: 'What does the client ask Dwight to do?',
      choices: ['Wait while he takes a call on another line', 'Call him back later on his other line',
                'Hold the line while he looks up his order'], a: 0,
      cue: '電話の途中、one second を含む頼み。',
      line: '…*hold on one second*, that’s my other line.',
      said: '「少々お待ちを、別の電話が入ったので」。ドワイトは慌てる。',
      mean: 'hold on ＝ 電話を切らずに待つ。one second は「ちょっと」。電話の決まり文句。',
      trap: 'hold だけ拾うと、理由を想像で補いやすい。理由は my other line。',
      use: 'Can you hold on? I’ll get a pen.（ちょっと待って、ペン取ってくる）' },

    // R fix: V2, blind 50 % right; a near miss on "not buy anything" replaces the price distractor.
    // why: buy a little ← "keep him on the line" caught, "not buy anything" lost (not → a little); hang up ← "stupid
    //   salesman… so dumb" suggests he'll end the call
    { id: 'd2', skill: 'detail', level: 'B2', point: 'otherline', seg: [54.3, 64.6],
      stem: 'On his other call, what does Jim say he plans to do?',
      choices: ['Keep Dwight talking and buy nothing', 'Keep Dwight waiting, then buy a little',
                'Hang up on Dwight and buy elsewhere'], a: 0,
      cue: '「stupid salesman」のあと、probably で始まる文。',
      line: 'Probably just gonna *keep him on the line forever and not buy anything*.',
      said: '「くだらない営業マンと電話中。ずっとつないで、何も買わない」と話す。',
      mean: 'keep ～ on the line ＝ 切らせずに待たせる。ねらいは時間のむだ。',
      trap: '悪口から「すぐ切る」と取りやすい。文末の not buy anything まで聞く。',
      use: 'Sorry to keep you on the line.（お待たせしてすみません）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'otherline', seg: [59.85, 64.6],
      stem: 'Type the words: “Probably just gonna ___ forever…” (5 words)', answer: 'keep him on the line',
      cue: '「gonna」のあと、forever の前の5語。',
      line: 'Probably just gonna *keep him on the line* forever…',
      said: '「ずっとつないでおくつもり」。keep him が「キーピム」とつながる。',
      mean: 'him の h が落ちて keep に付く。on the も弱い。',
      trap: 'h が消えると keep in に聞こえやすい。keep ＋人＋on the line で覚える。',
      use: 'They kept me on hold for an hour.（1時間も保留にされた）' },

    // R fix: V2, blind 50 % right; "family emergency" was the only stock excuse. All three are excuses now.
    // why: office ← "emergency" caught, "family" lost; a friend ← another stock excuse for leaving a call
    { id: 'd3', skill: 'detail', level: 'B1', point: 'emergency', seg: [67.75, 71.8],
      stem: 'What reason does Jim give for the other call when he comes back?',
      choices: ['A family emergency', 'An office emergency', 'A friend in trouble'], a: 0,
      cue: '戻ってきたときの「Sorry」のあと。',
      line: 'Sorry, that was a *family emergency*.',
      said: '「失礼、家族の緊急事態で」と、さっきの電話の言い訳をする。',
      mean: '本当は悪口を言っていただけ。もっともらしいうそで、ドワイトを試している。',
      trap: 'emergency だけ拾うと、急用の中身を補いやすい。その前の一語まで聞く。',
      use: 'Sorry, I had a family emergency.（すみません、家の急用で）' },

    // R fix: V2, blind 60 % right; "too personal" echoed "private". The key now names the move, not the word.
    // why: ask more ← "You know what" read as "Do you know what (happened)?"; back to buying ← the usual script of a
    //   client cutting small talk to get to business
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'private', seg: [70.3, 75.0],
      stem: 'When Dwight asks what’s wrong, what does Jim’s reply do?',
      choices: ['Refuses to share what he just brought up', 'Hints that Dwight should ask him more',
                'Moves the talk back to buying paper'], a: 0,
      cue: '「what’s wrong」への返事の、最後の一語。',
      line: '*You know what, that’s private.* — Boundaries, Dwight…',
      said: '心配すると「それはプライベートだ」と突き放され、「一線を守れ」とまで言われる。',
      mean: '自分から出した話を、聞かれると拒む。何をしてもドワイトが悪者になる仕掛け。',
      trap: 'You know what を「何だと思う？」と取りやすいが、ここは話を切る前置き。',
      use: 'You know what, never mind.（あのさ、やっぱりいいや）' },

    // R fix: V2, blind 70 % right; i3's stem gives the request away, so a near sound (hard to hear) replaces the
    //   tired-of-calls choice.
    // why: hard to please ← "hard of" heard as "hard to (please)" (a literal 'hard'); hard to hear ← "hard of hearing"
    //   heard as "hard to hear", as if his own voice were the problem
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'hearing', seg: [77.9, 80.95],
      stem: 'What does the client say about himself to explain his request?',
      choices: ['He has trouble hearing', 'He is hard to hear', 'He is very hard to please'], a: 0,
      cue: 'louder のあと、I’m で始まる短い一文。',
      line: '…a little bit louder. I’m *hard of hearing*.',
      said: '「もう少し大きな声で。耳が遠いんだ」と言う。',
      mean: 'hard of hearing ＝ 耳が遠い。ここから「もっと大きく」が続く。',
      trap: 'hard を「難しい」と取ると気難しい客、hard to hear と聞くと声が小さい人になる。of で一つの表現。',
      use: 'My grandma is a little hard of hearing.（祖母は少し耳が遠いんです）' },

    // R fix: V2, blind 60 % right; the choices are parallel "To…" reasons now. B1: its notes and a choice give away
    //   f2's "hard of hearing", so it reveals `hearing`. S4: the end cut "stop"; now 78.0–92.7 s.
    // why: hard of hearing ← the stated reason taken at face value; more confident ← the coaching script (speak up =
    //   sound confident) in a training role-play
    { id: 'i3', skill: 'infer', level: 'C1', point: 'louder', reveals: ['yell', 'threewords', 'hearing'],
      seg: [78.0, 92.7],
      stem: 'Why does Jim keep telling Dwight to talk louder?',
      choices: ['To push Dwight into shouting at a client', 'To make Dwight sound more confident',
                'To cope with being truly hard of hearing'], a: 0,
      cue: '「louder」が何度も続いたあと、どうなるか。',
      line: 'Louder, son! — *Our prices have never been lower!*',
      said: '「もっと大きく」が繰り返され、ついにドワイトは「値段はかつてないほど安い！」と叫ぶ。',
      mean: '耳が遠いのは口実。怒鳴らせて「客に怒鳴った」形を作るのが狙い。',
      trap: '耳が遠いと言われると本当の事情に聞こえる。前の「何も買わずに引き延ばす」と合わせて聞く。',
      use: 'Can you speak up a little?（もう少し大きな声で話してもらえますか）' },

    // R fix: V2, blind 70 % right; distractors rebuilt as feeling + action pairs. The cue and line now point at the
    //   shouted "Buttlicker!" (both sources have the name), so the key rests on words, not tone alone.
    // why: eager ← "never been lower" is an upbeat sales line, and he was told to be louder; amused ← a role-play is
    //   a game, and Jim is clearly joking
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'yell', seg: [84.0, 96.4],
      stem: 'By the time Dwight shouts the prices, how is he feeling?',
      choices: ['Fed up, and finally losing his temper', 'Eager, and selling as hard as he can',
                'Amused, and playing along with Jim'], a: 0,
      cue: '叫ぶ直前の客の名前と、上司の一言。',
      line: 'Louder, son! — *Buttlicker!* *Our prices have never been lower!* — … That is *totally inappropriate*.',
      said: 'ドワイトが叫ぶと、上司は「まったく不適切だ」と止める。',
      mean: '値段の文句は明るいが、言い方は我慢の限界。上司の反応がそれを裏づける。',
      trap: '言葉だけ見ると、安さを喜ぶ売り文句に聞こえる。直後の inappropriate で状況が分かる。',
      use: 'Okay, I’ve had enough.（もう、うんざりだ）' },

    // R fix: V2, blind 55 % right; the key was the only one with a hedge ("may"). Now a 2×2 of who lands the sale ×
    //   what happens to Dwight. The key no longer hints at the amount, so it reveals only `condition`.
    // why: Dwight lands it ← "See how it's done?" heard as Michael taking credit for Dwight's sale; turns it down ←
    //   "Don't do it, Michael" heard as the last word, but Michael never refuses
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['condition'], seg: [92.3, 140.6],
      stem: 'How does the role-play turn out for Dwight?',
      choices: ['Michael lands the sale, and Dwight’s job is at risk',
                'Dwight lands the sale, but Michael takes the credit',
                'Michael turns the sale down to protect Dwight'], a: 0,
      cue: '後半、電話がマイケルに代わってからの流れ。',
      said: '電話はマイケルに代わり、客は大口の注文を約束する。ただし条件はドワイトの解雇。',
      mean: '練習のはずが、マイケルの手柄とドワイトの危機で終わる。客役ジムのいたずらの完成。',
      trap: '「やめて」で終わるので断ったと思いやすいが、返事はない。誰が売ったかも追う。',
      use: 'Well, that backfired.（まあ、裏目に出たね）' },

    // R fix: V2, blind 55 % right; the key was the only "exact" echo. Two choices are now echoes of different
    //   earlier lines. S3: the cue named Michael's instructions, i.e. the key; it now asks where the words came from.
    //   The evidence (17.9 s) is outside the segment: a callback, so it's left as is.
    // why: Jim himself ← right mechanism, wrong target: Jim has been difficult, so the list seems to fit him; Jim's
    //   insults ← an echo is heard, but of the wrong line ("stupid… so dumb" on the other call)
    { id: 'h1', skill: 'humor', level: 'C1', point: 'threewords', reveals: ['rules'], seg: [100.3, 106.5],
      stem: 'Why is Jim’s choice of three words for Dwight so pointed?',
      choices: ['They repeat Michael’s list of what not to be', 'They repeat Jim’s insults from the other call',
                'They sum up how Jim himself has acted'], a: 0,
      cue: 'この3語が前にどこで出てきたか。',
      line: 'The three words I would describe you as is *aggressive, hostile, and definitely difficult*.',
      said: '「君を表す3語は、攻撃的、敵対的、そして確実に扱いにくい」と言う。',
      mean: '最初にマイケルが「こうなるな」と言った3語そのまま。練習の失敗を告げている。',
      trap: 'ジム自身も意地悪なので、自分のことと取りやすい。describe you の you はドワイト。',
      use: 'In three words: tired, hungry, done.（ひとことで言うと、疲れた、腹ぺこ、もう無理）' },

    // why: maybe ← "hope" = 希望 (I hope = maybe, if lucky); doubt ← "should" read as uncertainty, plus the angry-client
    //   script
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'hope', seg: [111.9, 115.2],
      stem: 'When Dwight says he’ll put his boss on, what does Jim’s reply mean?',
      choices: ['Good, that is the least you should do', 'Maybe, if your boss has time for me',
                'I doubt your boss will be any better'], a: 0,
      cue: 'boss の話のすぐあと、Well で始まる返事。',
      line: '…with my boss. — Well, *I should hope so*.',
      said: '「上司に代わります」と言われ、「当然だろうね」と返す。',
      mean: 'I should hope so ＝「そうでなくちゃ困る」。当たり前だという、偉そうな同意。',
      trap: 'hope を「〜だといいな」と取ると控えめな期待に聞こえる。should と組むと「当然」。',
      use: 'They refunded me. — I should hope so!（返金された ― 当然でしょ！）' },

    // R fix: V2, blind 60 % right (a sitcom's default is a million). K4: four choices, all near misses.
    // why: billion ← m/b at the start is the only difference; ten million ← the weak "one" heard as "ten";
    //   hundred thousand ← a big number heard, the unit missed
    { id: 'n1', skill: 'number', level: 'B1', point: 'million', seg: [121.3, 128.2], keep: true,
      stem: 'How much does the client say he will buy?',
      choices: ['$100,000 worth', '$1 million worth', '$10 million worth', '$1 billion worth'], a: 1,
      cue: '「buy」のすぐあと、worth の前の数。',
      line: 'I’m gonna buy *$1 million worth* of paper products today.',
      said: '「今日、紙製品を100万ドル分買おう」と言う。',
      mean: '～ worth of ＝ 〜分の。1 million は百万。急に大口の注文になる。',
      trap: 'million と billion は最初の音だけが違う。m は口を閉じ、鼻に響かせる音。',
      use: 'Twenty dollars’ worth of gas, please.（ガソリン20ドル分お願いします）' },

    // R fix: V2, blind 60 % right; only "you'll" and "you'd" read as natural English. A fourth near sound ("we'll")
    //   that fits the gap is added.
    // why: you ← the dark 'll nearly vanishes; you'd ← the l heard as a d-like stop; we'll ← the y glide is short, and
    //   a salesman's "we" fits the deal
    { id: 's1', skill: 'sound', level: 'B2', point: 'regret', seg: [129.6, 133.75],
      stem: 'Fill the gap: “I don’t think ___ regret it.”',
      choices: ['you’ll', 'you', 'you’d', 'we’ll'], a: 0,
      cue: 'regret の直前、とても短く弱い音。',
      line: 'I don’t think *you’ll* regret it.',
      said: 'マイケルが客に「後悔はさせませんよ」と言う。',
      mean: 'you’ll の ll は暗い l で、「ユーォ」のように聞こえる。先のことを約束する言い方。',
      trap: 'll がほぼ消えるので you に聞こえやすい。you だと今の話になり、約束の意味が弱まる。',
      use: 'I don’t think you’ll need a coat.（コートは要らないと思うよ）' },

    // R fix: V2, blind 55 % right; the key was the only one naming Michael's action. All three are now what Dwight
    //   loses or owes if Michael takes the deal.
    // why: apologize ← "treated me so terribly" calls for an apology in the usual complaint script; loses this client
    //   ← "put you on with my boss" just before, and "fire" missed
    { id: 'i1', skill: 'infer', level: 'B2', point: 'condition', seg: [134.4, 140.6],
      stem: 'What would the client’s condition mean for Dwight?',
      choices: ['He loses his job if Michael takes the deal', 'He loses this client if Michael takes the deal',
                'He must apologize before Michael takes the deal'], a: 0,
      cue: '「one condition」のあと、salesman を含む一文。',
      line: 'You have to *fire the salesman* that treated me so terribly. — Don’t do it, Michael.',
      said: '「私をひどく扱った営業マンをクビにしろ」と言われ、ドワイトは「やめてください」と頼む。',
      mean: '大口の注文と引きかえに、ドワイトの解雇を求めている。練習なのに本気で慌てる。',
      trap: '苦情なので謝罪を求める流れを予想しやすい。条件は fire のあと。',
      use: 'There’s just one condition.（条件が一つだけある）' },
  ]
};
