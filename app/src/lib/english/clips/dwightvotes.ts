// REVIEW 2026-11-16: pass 8, fix 15, drop 0, new 0; ear checks 2
// OPEN: n1: does the audio say “a 20”? The captions miss the number. If it doesn't, retire n1.
// OPEN: a1 (flustered) and a2 (firm) lean on the words, but a quick listen would confirm the tone.
// “Dwight Rigs the Votes - The Office US” (the official The Office channel, BEST OF SEASON 6 - The Office US): Dwight
// flatters Jim to show how people will suck up for employee of the month, then brings a "data" chart with random numbers
// and asks for a cash prize; Jim's "in an ideal world" is cut off. At the ceremony Jim's own number wins with a
// $250 prize "from all of us"; Jim says it's a mistake, the staff turn on him, Pam suggests the next highest score, and
// it turns out to be hers.
// Segments from the captions, words from whisper (2026-11-16). Names said: Jim (Jimmy), Dwight, Pam, Toby. The speaker
// of the tally, the $20 collection and the closing "doubled my sales" is never named, so stems don't name them.
// Untested on purpose: 12.8–16.8 s (who says "creeping me out"), 66–88 s (the $20 collection: captions merge the turns
// and "Jim said that?" could be sincere or doubtful), 92–102 s ("five minutes ahead of schedule": context missing),
// 109–111 s (whisper "in my eyes", captions "in my house"), 121–135 s (overlapping "What? Are you kidding?"), 175–182 s
// ("Correction, it was my idea": speakers unclear), 183–186 s ("Pam's not even pregnant" needs backstory), 204–206 s
// (an oath, cut off in the captions).
// EAR CHECK: 74.3–75.8 s n1 — whisper “pitched in a 20”, the captions “pitched in a … for” (no number)
// EAR CHECK: 227.3 s c2 — the “Yep” comes from the one who boasted (whisper marks a turn after “two to four?”; the
//   captions don't say who)
import type { Clip } from '../types.ts';

export const dwightVotes: Clip = {
  id: 'dwightvotes', video: 'TADOKwgIHKA', title: 'Dwight Rigs the Votes - The Office US', dur: 248, wpm: 150,
  band: 'mid', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %, right): "make up for being rude" was weak. The new distractor is a selfish reading of the
    //   praise; "the same thing from everyone" refutes it.
    // why: teach praise ← compliments as a model for Jim the manager; win his vote ← flattery read as Dwight's own
    //   campaign, then "I didn't mean…" as a cover
    { id: 'g1', skill: 'gist', level: 'B2', point: 'flatter', seg: [0.5, 28.15],
      stem: 'Why does Dwight praise Jim and then take it all back?',
      choices: ['To show how others will flatter Jim to win', 'To win Jim’s vote, then pass it off as a joke',
                'To show Jim how to praise his staff more'], a: 0,
      cue: 'ほめ言葉を取り消したあと、「everyone」以下の話。',
      line: '*I didn’t mean any of those things* I just said.',
      said: 'ひげをほめたあと「今のは全部うそ。月間優秀社員の件を早く止めないと、みんなこうなる」と言う。',
      mean: 'ほめたのは実演。賞のためのごますりを見せて、仕事で決めろと言いたい。',
      trap: '自分の票集めと取りやすいが、続く everyone 以下は警告。',
      use: 'Kidding. I didn’t mean a word of it.（冗談。今のは全部うそ）' },

    // R fix: V2 (blind 85 %): only the key was about ending it. Both distractors now act on it early too (trim, hold).
    // why: trim back ← nip = 切る・つまむ, so "keep it small"; hold back ← bud = つぼみ, heard as "not yet open"
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'nip', seg: [18.5, 25.7],
      stem: 'What does Dwight tell Jim to do about the award situation?',
      choices: ['Stop it early, before it grows', 'Trim it back so it stays small',
                'Hold it back until it is ready'], a: 0,
      cue: '「if you don’t」のあと、「in the bud」までの言い方。',
      line: 'if you don’t *nip* this whole employee of the month situation *in the bud*.',
      said: '「月間優秀社員の件を、小さいうちに摘んでおかないと」と言う。',
      mean: 'nip ～ in the bud ＝ 問題が大きくなる前に止める。',
      trap: 'nip を「切りつめる」、bud を「まだ開かない」と取りやすい。全体で一つの決まり文句。',
      use: 'Let’s nip this problem in the bud.（この問題は早めに手を打とう）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'work', seg: [25.5, 28.15],
      stem: 'Type what Dwight says: “___.” (5 words)', answer: 'make it about the work',
      cue: '「in the bud」のすぐあと、短い一文。',
      line: '*Make it about the work.*',
      said: '「仕事ぶりで決めろ」と言う。',
      mean: 'make it about ～ ＝ ～を基準にする。it と about がつながり「メイキラバウ」。',
      trap: 't が弾んで「ラ」に近くなり、語の切れ目が消える。it を落としやすい。',
      use: 'Let’s make it about the customer.（お客さんを中心に考えよう）' },

    // why: sales and calls ← the usual sales-office numbers (script); breaks and overtime ← "hours" heard, the rest missed
    { id: 'd1', skill: 'detail', level: 'B2', point: 'data', seg: [30.3, 38.5],
      stem: 'What does Dwight’s chart measure?',
      choices: ['Hours, lateness and sick days', 'Sales, phone calls and sick days',
                'Hours, lunch breaks and overtime'], a: 0,
      cue: '「all available data」のあと、並べる項目。',
      line: 'Hours, *tardiness*, unconfirmed *sick days*, participation.',
      said: '「勤務時間、遅刻、確認の取れない病欠、参加度」と並べる。',
      mean: 'tardiness ＝ 遅刻。勤怠の数字で公平に決めようとしている。',
      trap: '営業の会社なので売上の数字を想像しやすいが、出てくるのは勤怠の項目。',
      use: 'Tardiness will not be tolerated.（遅刻は認めません）' },

    // why: random pick ← "random" heard as the way the winner is chosen; vote by number ← numbers heard as ballots
    { id: 'd2', skill: 'detail', level: 'B1', point: 'random', seg: [38.1, 44.0],
      stem: 'Why has everyone been given a number?',
      choices: ['To keep scores fair and open', 'To pick the winner by chance',
                'To let people vote by number'], a: 0,
      cue: '「random number」のあと、「for」で始まる理由。',
      line: 'a random number *for total fairness and transparency*.',
      said: '「完全な公平さと透明性のため、全員に無作為の番号をふった」と言う。',
      mean: '名前を隠して、誰の点か分からないようにする仕組み。',
      trap: 'random から「くじ引き」と取りやすいが、ランダムなのは番号のほう。',
      use: 'For transparency, here are the numbers.（透明性のため、数字を出します）' },

    // R fix: V2 (blind 55 %): "Agree that it is a great idea" was easy to rule out. It's now a yes-with-a-condition
    //   reading of "in an ideal world".
    // why: condition ← "in an ideal world" heard as "if…"; describes the prize ← "ideal world" heard as the start of a
    //   wish list
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'ideal', seg: [44.0, 53.05],
      stem: 'When Dwight asks for a cash prize, what is Jim starting to do?',
      choices: ['Turn the idea down gently', 'Agree to it, with one condition',
                'Describe the prize he has in mind'], a: 0,
      cue: '「Well」で始まる、途中で切られる返事。',
      line: '*Well, in an ideal world*—',
      said: '賞金も付けるべきと言われ、「理想を言えばね…」と言いかけて切られる。',
      mean: 'in an ideal world は「理想はそうでも現実は無理」という断り。',
      trap: 'ideal world を「条件つきの賛成」と取りやすい。Well で始まる返事は断りが多い。',
      use: 'In an ideal world, yes. But…（理想を言えばね。でも…）' },

    // R fix: V2 (blind 70 %): "bizarre" flagged the joke. All three now say what the reply answers the phrase with.
    // why: threat ← "a fist for punching" taken literally, aimed at Jim; boast ← "self-defense" comes next
    { id: 'h1', skill: 'humor', level: 'C1', point: 'fist', reveals: ['ideal'], seg: [46.6, 53.05],
      stem: 'When Jim is cut off mid-sentence, why is the reply funny?',
      choices: ['It answers his polite phrase with a weird wish', 'It answers his polite no with a threat to punch',
                'It answers his polite phrase with a boast'], a: 0,
      cue: '同じ言葉で始めて、そのあと何を願うか。',
      line: 'In an ideal world, I would have *all ten fingers on my left hand*…',
      said: '「理想の世界なら、左手に指が10本あって、右手はただの殴る用のこぶし」と言う。',
      mean: '断りの決まり文句を、とんでもない願望で返している。理想の話は無意味、と言いたい。',
      trap: 'punching を本気の脅しと取りやすいが、ありえない手の話なので冗談。',
      use: 'In a perfect world, Mondays wouldn’t exist.（理想の世界なら、月曜はない）' },

    // R fix: V2 (blind 60 %): "Since everyone is equal" was weak; "it makes no difference" is the literal reading of
    //   "all the same".
    // why: whatever you decide ← "all the same" heard as indifference; no difference ← same = 同じ, taken literally
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'allsame', seg: [52.2, 56.9],
      stem: 'How does Jim lead into his change to the chart?',
      choices: ['If Dwight doesn’t object', 'Since it makes no difference', 'Whatever Dwight decides'], a: 0,
      cue: '「Okay」のすぐあと、「to you」で終わる前置き。',
      line: 'Okay, *if it’s all the same to you*, I’m just gonna…',
      said: '「よければ、～は外させてもらうよ」と言う。',
      mean: 'if it’s all the same to you ＝ 差しつかえなければ。断りにくい形で決める言い方。',
      trap: 'same から「違いはない」「どちらでも」と取りやすいが、相手への軽い前置き。',
      use: 'I’ll leave early, if it’s all the same.（差しつかえなければ、早めに帰るね）' },

    // R fix: V2 (blind 70 %): "too little weight to safety" was weak. "One skill twice" fits the two similar items, but he
    //   drops both, not one.
    // why: needs more ← "take away" heard as "take on/add"; counted twice ← survival and self-defense sound alike in kind
    { id: 'i1', skill: 'infer', level: 'C1', point: 'survival', seg: [52.2, 56.9],
      stem: 'What does Jim’s change tell us about Dwight’s chart?',
      choices: ['It scores things unrelated to the job', 'It counts one skill twice, by two names',
                'It needs two more items added to it'], a: 0,
      cue: '「take away」のあと、外す二つの項目。',
      line: 'I’m just gonna *take away survival skills and self-defense*.',
      said: '「サバイバル技術と護身術は外すね」と言う。',
      mean: '表にはオフィスと関係ない項目まで入っていた。彼らしい「公平な」表。',
      trap: 'take away を「加える」と取りやすい。away は「取り去る」。二つとも外すので重複の話でもない。',
      use: 'Let’s take that part out.（その部分は外そう）' },

    // why: $10 ← "a" heard as "ten"; $25 ← "a twenty" + a following "f" heard as "twenty-five"; $50 ← fifty/twenty
    { id: 'n1', skill: 'number', level: 'B1', point: 'twenty', seg: [72.1, 77.8], keep: true,
      stem: 'How much is each person asked to pitch in?',
      choices: ['$10', '$20', '$25', '$50'], a: 1,
      cue: '「pitched in」のすぐあと。',
      line: 'if we all pitched in *a 20* for this whole employee of the month thing.',
      said: '「月間優秀社員のために、みんなで20ドルずつ出そう」と言う。',
      mean: 'a 20 ＝ 20ドル札1枚。お札の額だけで言う言い方。',
      trap: 'twenty の t は弱く「トゥエニ」に近い。fifty は「フィフ」で始まる。',
      use: 'Can you break a twenty?（20ドル札、くずせる？）', retired: true },

    // R fix: V2 (blind 60 %): "No one wins" was weak. "Jim wins and takes it" is the sincerity flip; "not taking any
    //   of it" refutes it.
    // why: Dwight wins ← the title and the schemer script; takes it ← the cheering heard as his win
    { id: 'g2', skill: 'gist', level: 'B1', point: 'jimwins', seg: [102.2, 158.25],
      stem: 'What happens when the first winner is announced?',
      choices: ['Jim wins, and he says it must be a mistake', 'Jim wins, and he gladly takes the prize',
                'Dwight wins, and Jim will not pay him the prize'], a: 0,
      cue: '番号が読まれたあと、名前と、その人の言い分。',
      said: '発表された番号は Jim 本人。Jim は匿名だったと言い、受け取らない、何かの手違いだと言う。',
      mean: '主催者が自分で賞を取った形になり、場が気まずくなる。',
      trap: 'タイトルから Dwight の勝ちを想像しやすいが、読まれた番号は Jim 本人。',
      use: 'There must be some mistake.（何かの手違いでしょう）' },

    // R fix: V2 (blind 65 %): "not allowed to vote" was weak. "Never saw the scores" is a near miss; "highest overall
    //   score" refutes it.
    // why: never saw scores ← "didn't even know who was on here" stretched to the scores; Toby checked ← Toby was named
    //   earlier as the data checker
    { id: 'd5', skill: 'detail', level: 'B1', point: 'anon', reveals: ['random'], seg: [134.6, 144.35],
      stem: 'Why does Jim say he could not have picked himself?',
      choices: ['He didn’t know whose scores were whose', 'He never saw the final scores at all',
                'Toby went over the scores first'], a: 0,
      cue: '「Guys, listen」のあと、「because」以下。',
      line: 'this was *anonymous*… I *didn’t even know who was on here*.',
      said: '「匿名だった。誰が載っているかも知らなかった。一番点の高い人に渡しただけ」と言う。',
      mean: '番号だけで選んだので、自分だとは分からなかった、という弁明。',
      trap: '前に Toby の名前が出たので結びつけやすいが、ここでは出てこない。',
      use: 'It was anonymous, I swear.（匿名だったんだ、本当に）' },

    // R fix: K4 + V2 (blind 70 %): "couldn't have" was a weak fourth (a double negative). Three choices now, all of
    //   them good English in the gap.
    // why: should have ← /k/–/ʃ/ both weak before "have"; would have ← the vowel is the same
    { id: 's1', skill: 'sound', level: 'B2', point: 'could', seg: [137.6, 142.3],
      stem: 'Fill the gap: “There’s no way I ___ given it to myself.”',
      choices: ['could have', 'should have', 'would have'], a: 0,
      cue: '「no way I」のすぐあと、弱く短い二語。',
      line: 'There’s no way I *could have* given it to myself',
      said: '「自分に賞をあげるなんて、できたはずがない」と言う。',
      mean: 'could have は弱く「クダヴ」。no way と組んで「ありえない」になる。',
      trap: 'could と would は母音が同じで、k と w だけの差。have とつながると聞き分けにくい。',
      use: 'There’s no way I could have known.（知りようがなかった）' },

    // anchor: 144.4–144.9 s three words run together before "you just won back your own parking spot"; whisper and the
    //   captions both have "to my tally", where grammar expects "by my tally"
    { id: 'c1', skill: 'dict', level: 'C2', point: 'tally', seg: [143.6, 147.3],
      stem: 'Type the start: “___, you just won back your own parking spot.” (3 words)', answer: 'to my tally',
      cue: '「highest overall score」のすぐあと。文法より音を。',
      line: '*To my tally*, you just won back your own parking spot',
      said: '「私の集計では、駐車場を取り戻した」と言う。3語が弱く速く、ひと続き。',
      mean: 'ふつうは by my tally。to my ～ は崩れた形だが、実際にそう言っている。',
      trap: '習った形に直して by と書きたくなる。to は「タ」と弱い。聞こえた音のまま書く。',
      use: 'By my count, we’re one short.（私の数えでは、一人足りない）' },

    // why: $25 ← "quarter" = 25 (cents); $1,000 ← "thousand" heard, "a quarter of" missed; $750 ← three quarters
    { id: 'n2', skill: 'number', level: 'B2', point: 'prize', seg: [143.6, 151.35], keep: true,
      stem: 'How much prize money is Jim told he has won?',
      choices: ['$25', '$250', '$750', '$1,000'], a: 1,
      cue: '駐車場と休暇のあと、「nice tidy」のあと。',
      line: 'a nice tidy *quarter of a thousand dollars* from all of us.',
      said: '「きっちり1000ドルの4分の1、みんなから」と言う。',
      mean: 'quarter of a thousand ＝ 250。わざと回りくどく言っている。',
      trap: 'thousand だけ聞くと1000、quarter から25セントを思い浮かべやすい。',
      use: 'That’s a quarter of the price.（定価の4分の1だよ）' },

    // R fix: V2 (blind 50 %, right): "Angry, telling the staff off" was weak. "Blaming Dwight" is a near miss: he names
    //   no one.
    // why: secretly pleased ← "not taking any of it" heard as modesty (謙遜); blaming Dwight ← "a mistake" heard as
    //   pointed at the man who did the chart
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'notaking', reveals: ['jimwins'], seg: [150.9, 158.25],
      stem: 'How does Jim sound when he answers the news of his prize?',
      choices: ['Flustered, trying to calm everyone down', 'Pleased, but acting modest about it',
                'Annoyed, blaming Dwight for the mix-up'], a: 0,
      cue: '「stop for a second」のあとの言い方。',
      line: 'everybody just *stop for a second*, ’cause *obviously I’m not taking any of it*.',
      said: '「みんなちょっと待って。もちろん何も受け取らないよ」と言う。',
      mean: 'あわてて場を落ち着かせ、疑いを晴らそうとしている。',
      trap: '受け取らない、を謙遜と取りやすいが、obviously は「当然だろ」の弁明。',
      use: 'Okay, everybody just calm down.（はい、みんな落ち着いて）' },

    // R fix: K1 + V2 (blind 70 %): "When it will be fixed" was also left unsaid, so it was a second key. The stem now asks
    //   what the sentence lets him avoid; both distractors are things he does say.
    // why: admitting it ← the passive heard as a denial; promising ← "we'll figure it out" missed
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'mistake', reveals: ['jimwins'], seg: [151.2, 156.45],
      stem: 'What does the way Jim words the error let him avoid?',
      choices: ['Saying who made it', 'Admitting it happened', 'Promising to fix it'], a: 0,
      cue: '「A mistake」で始まる文の形。主語は何か。',
      line: '*A mistake has been made*, and we’ll figure it out.',
      said: '「手違いがあった。なんとかする」と言う。',
      mean: '受け身にすると、誰のせいかを言わずにすむ。責任をぼかす定番。',
      trap: '受け身を否定と取りやすいが、手違いは認めている。we は直す人で、した人ではない。',
      use: 'Mistakes were made. Let’s move on.（手違いはあった。先に進もう）' },

    // R fix: V2 (blind 70 %): "Admitting he made it up" was weak. "Asking Jim to explain" reads the tag question as a real
    //   question (Japanese frame).
    // why: prize announced ← Dwight's "isn't that what you said?" taken as fact; asking ← the tag question heard as a
    //   real question
    { id: 'i4', skill: 'infer', level: 'C1', point: 'idealprize', reveals: ['ideal'], seg: [158.7, 167.6],
      stem: 'When Dwight answers Jim about the cash prize, what is he doing?',
      choices: ['Treating Jim’s half sentence as a promise', 'Reminding Jim of a prize Jim announced',
                'Asking Jim to explain what he meant'], a: 0,
      cue: '「you said」のあとと、Jim の「I meant」。',
      line: 'you said *in an ideal world* there would be a cash prize… — No, Dwight, *I meant*…',
      said: '「理想を言えば賞金がある、と言ったよね」と言い、Jim は「そういう意味じゃない」と返す。',
      mean: '断りの前置きを、約束の言葉にすり替えている。',
      trap: 'isn’t that what you said? を事実の確認と取りやすい。Jim がすぐ否定している。',
      use: 'That’s not what I meant.（そういう意味じゃないよ）' },

    // R fix: V2 (blind 70 %): "Dwight would keep all the money" was weak. Now the distractor has the right mechanism
    //   and the wrong target (recipe 1).
    // why: agrees ← "someone would get money" heard as support for a prize; on Dwight ← "Dwight" is the last name said
    { id: 'h2', skill: 'humor', level: 'C1', point: 'perfect', reveals: ['jimwins'], seg: [162.7, 170.45],
      stem: 'Why does the coworker’s reply to Jim get a laugh?',
      choices: ['It turns Jim’s words on him, since he won', 'It turns Jim’s words on Dwight, who wanted cash',
                'It agrees with Jim that someone deserves money'], a: 0,
      cue: '「Yeah, but」のあと、「your」が誰を指すか。',
      line: 'Yeah, but *in your perfect world, only you get money*.',
      said: '「理想なら誰かがお金をもらう」に、「あなたの理想では、もらうのはあなただけ」と返す。',
      mean: '賞を取ったのは Jim。本人の言葉を使って皮肉っている。',
      trap: '直前に Dwight の名前が出るので your を彼と取りやすいが、話している相手は Jim。',
      use: 'Easy for you to say.（あなたはそう言えるよね）' },

    // R fix: V2 (blind 60 %): "close to tears" was weak. "Sarcastically" is a near miss from “obviously”; her plain
    //   proposal right after refutes it.
    // why: sarcastic ← "obviously" heard as a sneer; playing along ← "okay" heard as amused agreement
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'pamtone', reveals: ['record'], seg: [182.4, 191.6],
      stem: 'How does Pam answer the remark about her?',
      choices: ['Firmly, a little fed up', 'Sarcastically, mocking it', 'Playfully, going along'], a: 0,
      cue: '「Okay」で始まり、「obviously」が入る返事。',
      line: '*Okay, for the record*, I am pregnant, and *obviously* there’s been some kind of a mistake',
      said: '「はっきり言っておく、妊娠してる。それに、明らかに何かの手違いがあった」と言う。',
      mean: '疑いを短く打ち消して、話を本題に戻す、きっぱりした言い方。',
      trap: 'obviously を皮肉と取りやすいが、すぐまじめな提案に移っている。',
      use: 'Okay, let’s get back to the point.（はい、本題に戻ろう）' },

    // R fix: V2 (blind 80 %): "a private remark between friends" was a filler. "Half seriously" is a near miss, and
    //   "the minutes" keeps the literal reading.
    // why: minutes ← record = 記録, taken literally; half serious ← the phrase heard as an aside after a joke
    { id: 'm1', skill: 'marker', level: 'B2', point: 'record', seg: [185.35, 188.75],
      stem: 'What does Pam signal by starting with “Okay, for the record”?',
      choices: ['A plain fact, to clear up a doubt', 'A note she wants added to the minutes',
                'An aside, said only half seriously'], a: 0,
      cue: '「Okay」のすぐあと、本題の前の決まった言い方。',
      line: 'Okay, *for the record*, I am pregnant',
      said: '「はっきり言っておくけど、私は妊娠してる」と言う。',
      mean: 'for the record ＝ 念のためはっきり言うと。うわさや疑いを打ち消す前置き。',
      trap: 'record を「記録」や冗談の一言と取りやすい。会話では「はっきりさせる」合図。',
      use: 'For the record, I was on time.（言っておくけど、時間どおりに来たよ）' },

    // why: 13 ← three/thirteen differ only in the -teen; 30 ← -ty with a weak t sounds close to "three"
    { id: 'n3', skill: 'number', level: 'B1', point: 'three', seg: [200.2, 204.9], keep: true,
      stem: 'Which employee number has the next highest score?',
      choices: ['3', '13', '30'], a: 0,
      cue: '「employee number」のすぐあと。',
      line: 'That would be *employee number three*',
      said: '「次は従業員番号3番」と言う。',
      mean: 'Pam の提案どおり、次に点の高い人を読み上げる。',
      trap: 'three と thirteen は語尾だけの差。-teen なら後ろが長く強く聞こえる。',
      use: 'I’m in room three, not thirteen.（13号室じゃなくて3号室です）' },

    // anchor: 223.4–224.6 s "I doubled my sales last month"; 225.0–226.6 s "from what, two to four?"; 227.3 s "Yep": the
    //   jab was a guess, and the boaster's own "Yep" confirms it
    // why: on the questioner ← "Yep" heard as calm, so the jab seems to miss; on the office ← "two to four" heard as how
    //   low everyone's sales are
    { id: 'c2', skill: 'humor', level: 'C2', point: 'doubled', seg: [218.1, 228.4],
      stem: 'In the last exchange, who is the joke on?',
      choices: ['The boaster: that “Yep” shows the gain is tiny',
                'The teaser: the guess falls flat, shrugged off',
                'The whole office: two sales a month is normal'], a: 0,
      cue: '皮肉な問いへの、最後の一語の返事。',
      line: 'I *doubled my sales* last month. — Oh, really, *from what, two to four*? — *Yep.*',
      said: '「先月は売上を倍にした」に「へえ、2件から4件？」と皮肉られ、「そう」と答える。',
      mean: '皮肉のつもりの数字が、本人の「そう」で事実になる。倍という大きな言葉の中身が小さすぎるのが笑い。',
      trap: '平然とした返事は皮肉をかわしたように聞こえる。返事が「はい」なら、皮肉の中身を認めている。',
      use: 'Doubled? From what, one to two?（倍？1から2とか？）' },
  ]
};
