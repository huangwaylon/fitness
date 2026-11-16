// REVIEW 2026-11-16: pass 10, fix 10, drop 0, new 0; ear checks 1
// Open: g1 and d1 stay near 55 % blind (the key fits the setup story); s1, s2 and f1 near 50 % for anyone who knows
//   the chunk. i1 and f4 share the "get out of it" line and reveal each other, so they're never drawn together.
// “Michael Tricks People Into Coming To His Party - The Office US” (the official The Office channel, Best of Season
// 4): Michael keeps the staff late on a Friday, "calls corporate" to cancel the overtime, then invites Jim and Pam to
// dinner; Jim realizes it was a setup, and Dwight is left off the list.
// Segments from the captions, words from whisper (2026-11-16). Talk runs ≈ 3–102 s; whisper loops after 103 s and the
// captions have only stray words after 102 s. Untested: 27 s ("I'm Scott" / "I'm — God"), 61–63 s (the dinner list),
// 93.8 s ("him" / "Pam"), 97.8 s ("Hell" / "Hail"), the silent talking head at the end.
// EAR CHECK: 89.75 s r1 — the cut falls after "Dwight, it's couples only", before "And besides"
import type { Clip } from '../types.ts';

export const couplesOnly: Clip = {
  id: 'couplesonly', video: '8H16SWHUAuM', title: 'Michael Tricks People Into Coming To His Party',
  dur: 132, wpm: 185, band: 'mid', tags: ['職場', 'お願い・断り'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: shorter shift ← "what time we'll get out of here" heard as a deal on hours; Monday ← "Friday" heard as the
    //   work moving to after the weekend
    { id: 'g1', skill: 'gist', level: 'B1', point: 'outcome', seg: [3, 56.45],
      stem: 'What happens to the evening’s overtime work?',
      choices: ['It’s called off, and they can go home', 'It’s cut down to a shorter shift tonight',
                'It’s put off until Monday morning'], a: 0,
      cue: '電話のあと、Michael がみんなに言う知らせ。',
      said: '残業に文句が出て、Michael が本社に電話し、「金曜を楽しんで」と伝える。',
      mean: '残業は取り消され、みんな帰れることになった、という流れ。',
      trap: 'Friday で週明けに回す話にも思えるが、enjoy your Friday は「もう帰っていい」。',
      use: 'Go enjoy your weekend.（週末を楽しんできて）' },

    // R fix: the title ("Tricks People Into Coming To His Party") picked the only party-shaped choice (V2, GUIDE §9.4).
    //   Both setups now aim at Jim, so the mechanism decides it.
    // why: owe him one ← "Thank you, Michael" heard as a favor Jim must repay with dinner; real order ← the call taken at
    //   face value
    { id: 'g2', skill: 'gist', level: 'C1', point: 'setup', reveals: ['noorder', 'noplans', 'block'], seg: [3, 85.6],
      stem: 'Looking back, what was the late evening really for?',
      choices: ['A setup so Jim couldn’t say he was busy', 'A setup so Jim would owe Michael one',
                'A real order that Michael got cancelled'], a: 0,
      cue: '最後の Jim の話と、最初の「予定ある？」をつなげて。',
      said: '予定を入れるなと言っておき、残業を取り消してから Jim と Pam を誘う。',
      mean: '残業は口実で、断れない状態を作るための作戦だった。',
      trap: 'Thank you, Michael で恩を売る作戦にも見えるが、誘う決め手は「予定はないと言った」。',
      use: 'Was that a setup?（あれってわざと仕組んだの？）' },

    // why: will ← the "we" of "we'll" lost; we ← the 'll swallowed before "get"; we'd ← 'll and 'd both shrink
    { id: 's1', skill: 'sound', level: 'B2', point: 'well', seg: [3, 7.1],
      stem: 'Fill the gap: “Do you have any idea what time ___ get out of here?”',
      choices: ['we’ll', 'will', 'we', 'we’d'], a: 0,
      cue: 'what time のあと、get の前の弱い音。',
      line: 'Do you have any idea what time *we’ll* get out of here?',
      said: '「何時にここを出られるか分かってる？」と不満を言う。',
      mean: 'we’ll は「ウィル」より短く、暗い l で終わる。未来のことを聞いている。',
      trap: 'we’d なら「出られるだろうか」と仮定の響き。d で止まるか、l の音が残るかを聞く。',
      use: 'What time will we get there?（何時に着くかな）' },

    // why: minds it least ← "least" taken as "the least bothered"; leaves last ← "least of all" heard as "last of all"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'leastme', seg: [6.7, 12],
      stem: 'After saying nobody likes working late, what does Michael add about himself?',
      choices: ['He hates it more than anyone does', 'He minds it less than anyone does',
                'He is always the last one to leave'], a: 0,
      cue: 'Nobody likes ～ の直後、短い付け足し。',
      line: 'Nobody likes to work late, *least of all me*.',
      said: '「残業が好きな人はいない。中でも僕が一番いやだ」と言う。',
      mean: '特に僕は（～ない）。否定の文に続けて「自分が一番」と強める。',
      trap: 'least を「一番少なく気にする」と取ると逆になる。否定文のあとなら「とりわけ～ない」。',
      use: 'Nobody wants rain, least of all me.（雨は誰もいやだ、特に僕は）' },

    // why: cancelled them ← "plans" + "working" heard as a sacrifice he made himself; Pam busy ← "us" heard as Jim and Pam
    //   both being stuck
    { id: 'd1', skill: 'detail', level: 'B1', point: 'noplans', seg: [12, 18.9],
      stem: 'Why doesn’t Jim have plans tonight?',
      choices: ['Michael told them not to make any', 'He cancelled them to stay and work',
                'Pam had to stay late at work too'], a: 0,
      cue: 'No, I don’t のあと、理由を言う文。',
      line: 'No, I don’t. *Remember you told us not to make plans*…',
      said: '「ないよ。残業だから予定を入れるなって言ったでしょう」と答える。',
      mean: '予定がないのは、Michael 自身が前もって禁止していたから。',
      trap: 'plans と working から自分で取り消したように思えるが、told us で指示した人が分かる。',
      use: 'Remember you told me to come early?（早く来てって言ったよね）' },

    // why: simple call ← "basically" read as "basic = easy" (katakana ベーシック); said little ← "uh" + a short summary
    //   heard as a confession
    // R fix: its choices say it was a call, which answers f2; added `horn` to reveals (N7).
    { id: 'm1', skill: 'marker', level: 'B2', point: 'basically', reveals: ['horn'], seg: [44.1, 52.35],
      stem: 'After “And, uh…”, what does Michael’s next word signal?',
      choices: ['A short summary of the call is coming', 'The call he made was easy to make',
                'He didn’t say much on the call'], a: 0,
      cue: 'uh のすぐあと、told の前の一語。',
      line: 'And, uh, *basically*, I told them where they could stick…',
      said: '「まあ要するに、残業の話はお断りだと言ってやった」と報告する。',
      mean: 'basically ＝ 要するに。長い話をまとめて言う合図で、内容が簡単という意味ではない。',
      trap: 'カタカナのベーシックから「簡単」と取りやすい。話の前に来たら「まとめるとね」の合図。',
      use: 'Basically, we missed the train.（要するに、電車に乗り遅れたの）' },

    // R fix: "I am gonna call corporate" (24 s) already tells anyone who watched that it was a call, so the idiom
    //   wasn't needed (V1/V2). All three choices are now about the call; only "got off" separates them.
    // why: cut off ← "got off" heard as "cut off"; voice message ← "horn" unknown, so a one-way message is guessed
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'horn', seg: [44.1, 47.3],
      stem: 'When Michael comes back to the staff, what has he just done?',
      choices: ['Finished his call with corporate', 'Got cut off by corporate mid-call',
                'Left corporate a voice message'], a: 0,
      cue: 'Everybody のあと、corporate の前の言い方。',
      line: 'Everybody, I just *got off the horn* with corporate.',
      said: '「みんな、今、本社との電話を切ったところだ」と言う。',
      mean: 'the horn は電話のくだけた言い方。',
      trap: 'horn が分からないと off から「切られた」と取りやすい。get off は自分で話し終えたこと。',
      use: 'I just got off the phone with them.（今その人たちと電話を切ったところ）' },

    // R fix: blind-guessable (V2), and "all our work" was an absolute only a distractor had (K6).
    // why: jobs ← "bullet" heard as a serious danger; finished in time ← "dodged" heard as getting out of work early by
    //   working hard
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'bullet', seg: [55.4, 58.55],
      stem: 'Right after “Happy Friday”, what does the first speaker mean?',
      choices: ['We got out of something bad', 'We nearly lost our jobs there', 'We finished our work in time'],
      a: 0,
      cue: 'Happy Friday の直後、Well で始まる一言。',
      line: 'Well, I think we *dodged a bullet* there.',
      said: '「いやあ、危ないところを逃れたね」と言う。',
      mean: 'dodge a bullet ＝ 弾をよける、つまり嫌なことをうまく避ける。ここは残業のこと。',
      trap: 'bullet を文字通り取ると大きな危険の話になる。dodge の後ろの名詞は「避けた嫌なこと」。',
      use: 'The flight got cancelled? We dodged a bullet.（あの便が欠航？助かったね）' },

    // R fix: blind-guessable (V2): "saying sorry" was a filler. Now "you said" heard as holding Jim to a promise.
    // why: check again ← a reminder-like "you said"; promise ← "you said… that's what you said" heard as holding Jim to
    //   his word about coming
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'block', seg: [58.1, 69.4],
      stem: 'When Jim starts to answer the dinner invitation, what is Michael doing?',
      choices: ['Heading off an excuse before Jim gives it', 'Reminding Jim of a promise he made to come',
                'Asking Jim to check his plans once more'], a: 0,
      cue: 'Jim が言いよどんだ直後、Michael が繰り返す言葉。',
      line: '*You said you didn’t have plans.* That’s what you said.',
      said: '食事に誘い、Jim が何か言いかけると「予定はないって言ったよね」と2回押す。',
      mean: '前に聞いた答えを持ち出して、断る理由を先に消している。',
      trap: 'you said は確認や約束の念押しにも聞こえるが、2回繰り返すと「もう逃げられないよ」という圧になる。',
      use: 'But you said you were free!（でも空いてるって言ったじゃない）' },

    // why: five ← -ive/-ine endings sound close; nineteen ← -teen stress
    { id: 'n1', skill: 'number', level: 'B1', point: 'nine', seg: [69.4, 76.8],
      stem: 'How many times has Michael asked Jim and Pam to dinner?',
      choices: ['At least five', 'At least nine', 'At least nineteen'], a: 1, keep: true,
      cue: 'at least の直後の数。',
      line: 'to dinner *at least nine times*',
      said: '「少なくとも9回、僕とPamを食事に誘ってきた」と話す。',
      mean: 'at least ＝ 少なくとも。実際はもっと多いかもしれない、という含み。',
      trap: 'nineteen なら teen が強く長い。短く切れて times に続くかを聞く。',
      use: 'I’ve called at least three times.（少なくとも3回は電話したよ）' },

    // R fix: same line and same fact as f4 ("would rather not go" = "get out of it"), and blind-guessable. Rewritten as
    //   the inference from the whole sentence: Michael keeps asking. Reveals `nine` (line) and `getout`.
    // why: polite ← the Japanese 社交辞令 frame, an invitation made for form's sake; gives up ← "get out of it" caught
    //   without "at least nine times"
    { id: 'i1', skill: 'infer', level: 'B2', point: 'keepask', reveals: ['nine', 'getout'], seg: [69.4, 76.8],
      stem: 'What does Jim’s first sentence suggest about Michael?',
      choices: ['He keeps asking despite the noes', 'He only asks them to be polite', 'He gives up after one no'], a: 0,
      cue: '回数と、そのあと毎回どうなったか。',
      line: '…to dinner *at least nine times*, and every time, we’ve been able to *get out of it*.',
      said: '「少なくとも9回は食事に誘われ、毎回うまく断ってきた」と話す。',
      mean: '何度断られても誘い続ける、つまり Michael はあきらめない人だと分かる。',
      trap: '社交辞令のような形だけの誘いと取りやすいが、9回も誘うのは本気。回数に注目。',
      use: 'He won’t take no for an answer.（断っても全然引かないの）' },

    // R fix: "managed to… every time" in the stem pointed at avoiding (S1/V2), and "join late" was a filler. The stem
    //   now names the moment only.
    // why: leave early ← "get out" = 出る; call it off ← "get out of it" heard as the dinner itself falling through
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'getout', seg: [73.8, 76.8],
      stem: 'What does Jim say he and Pam have done every time?',
      choices: ['Avoided going to the dinner', 'Left the dinner early', 'Got Michael to call it off'], a: 0,
      cue: 'been able to のあとの句動詞。',
      line: 'every time, we’ve been able to *get out of it*.',
      said: '「毎回、なんとか断れてきた」と言う。',
      mean: 'get out of ～ ＝ 予定や義務からうまく逃れる。出かけた先から出るのではない。',
      trap: 'get out を「外に出る」と取ると途中で帰る話になる。of の後ろが予定なら「免れる」。',
      use: 'I got out of jury duty.（裁判員の役目を免れた）' },

    // R fix: the key was the only mixed feeling (V2/K6). Now a second mixed distractor.
    // why: angry ← "he got me" heard as a grudge; embarrassed but relieved ← "he got me" as being caught out, and the
    //   cancelled overtime as relief
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'credit', reveals: ['gotto'], seg: [76.5, 85.6],
      stem: 'How does Jim feel about being caught by Michael this time?',
      choices: ['Annoyed, but a bit impressed', 'Embarrassed, but a bit relieved',
                'Angry, and planning to get even'], a: 0,
      cue: 'But のあとの言い方と、He got me。',
      line: 'But I got to *give him credit*. He got me.',
      said: '「でも認めるしかない。やられたよ」と話す。',
      mean: 'give ～ credit ＝ 相手の腕前を認める。悔しいけれど感心している。',
      trap: 'He got me を「恨み」や「恥」と取りやすいが、だまされたことを認めるくだけた言い方。',
      use: 'I have to give you credit.（それは認めるよ、すごいね）' },

    // why: I get to ← got/get close and both fit; I'd have to ← "got to" heard as a softer "have to"
    { id: 's2', skill: 'sound', level: 'B2', point: 'gotto', seg: [76.5, 80.5],
      stem: 'Fill the gap: “But ___ give him credit.”',
      choices: ['I got to', 'I get to', 'I’d have to'], a: 0,
      cue: 'But のあと、give の前の短い音のかたまり。',
      line: 'But *I got to* give him credit.',
      said: '「でも、それは認めないとね」と言う。',
      mean: 'I got to が「アイガラ」とつながる。have got to の have が消えた形。',
      trap: 'get to なら「～させてもらえる」。got の t は弾んで「ラ」に近く、o は口を大きく開ける。',
      use: 'I got to go, see you!（もう行かなきゃ、またね）' },

    // R fix: "Michael never planned a dinner" broke the parallel (the other two are about corporate, K5).
    // why: corporate cancelled ← "corporate" + "assignment" heard without "no"; next week ← the Friday cancellation
    //   heard as the work being moved
    { id: 'd2', skill: 'detail', level: 'B1', point: 'noorder', seg: [78.9, 85.6],
      stem: 'What is Jim starting to suspect?',
      choices: ['Corporate never gave the overtime work', 'Corporate canceled the work on its own',
                'Corporate moved the work to next week'], a: 0,
      cue: 'suspect that のあと、文の終わりまで。',
      line: 'I’m starting to suspect that there was *no assignment from corporate*.',
      said: '「本社からの指示なんて、なかったんじゃないかと思い始めてる」と話す。',
      mean: '残業そのものが作り話だった、という疑い。',
      trap: 'corporate と assignment がそろって聞こえるので本当の指示に思える。直前の no を落とさない。',
      use: 'I suspect there was no problem.（問題なんてなかった気がする）' },

    // R fix: "kindly invite him" was an odd, weak distractor (K3). It's now the plain request reading the trap describes.
    // why: asking to be invited ← a polite question form read as a request; checking work ← "what time" heard as overtime
    //   talk from earlier
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'arrive', seg: [85.2, 89.75],
      stem: 'When Dwight asks Michael about the dinner, what does his question show?',
      choices: ['He takes it for granted that he’s invited', 'He is politely asking to be invited',
                'He wants to know if he must work late'], a: 0,
      cue: 'Dwight の質問の形。何を聞いていて、何を聞いていない？',
      line: 'Michael, uh, *what time should I be arriving*?',
      said: '「Michael、僕は何時に行けばいい？」と聞く。',
      mean: '行くかどうかではなく何時かを聞くのは、招かれている前提で話しているということ。',
      trap: 'ていねいな疑問文なのでお願いにも聞こえるが、Can I come? とは聞いていない。',
      use: 'What time should I be there?（何時に行けばいい？）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'arrive', seg: [85.2, 88.45],
      stem: 'Type Dwight’s question: “Michael, uh, ___?” (6 words)', answer: 'what time should i be arriving',
      cue: 'uh のあと、質問全部。',
      line: 'Michael, uh, *what time should I be arriving*?',
      said: '「Michael、僕は何時に到着すればいい？」と聞く。',
      mean: 'should I be ～ing は予定を確かめる、少しかしこまった言い方。',
      trap: 'should I が「シュダイ」と一続きになり、I を落としやすい。be も弱く短い。',
      use: 'What time should I be arriving?（何時に着けばいいですか）' },

    // predict: the segment stops after "couples only"; the reveal plays the rest
    // why: an exception ← a boss softening after a no; a date ← "couples only" heard as a condition Dwight can meet
    { id: 'r1', skill: 'predict', level: 'B2', point: 'besides', seg: [85.2, 89.75], then: [89.75, 97.6],
      stem: 'Right after Michael’s first answer to Dwight, what kind of move comes next?',
      choices: ['Another reason Dwight can’t come', 'An offer to make an exception',
                'A question about Dwight’s date'], a: 0,
      cue: '一つ理由を言ったあと、さらに続ける言葉。',
      line: 'Dwight, it’s couples only. *And besides*, I only have…',
      said: '「カップル限定だ」のあと、「それに」と別の理由を足す。',
      mean: 'And besides は理由を重ねる合図。断りを強める。',
      trap: '断ったあとに譲るのは日本語の会話でよくある型。英語の besides は断りを重ねる。',
      use: 'It’s late. And besides, I’m tired.（もう遅いし、それに疲れてる）' },

    // why: bring a date ← "couples only" taken as a condition; bring a glass ← "wine glasses" heard as a supply problem
    { id: 'i2', skill: 'infer', level: 'C1', point: 'glasses', reveals: ['six', 'besides'], seg: [88.1, 97.6],
      stem: 'From Michael’s whole answer to Dwight, what follows?',
      choices: ['There’s no seat left for Dwight', 'Dwight can come if he brings a date',
                'Dwight can come if he brings a glass'], a: 0,
      cue: 'グラスの数と、そのあと並べる名前の数。',
      line: 'I only have *six wine glasses*, so it will be me and Jan and…',
      said: 'グラスは6つしかないと言い、自分を含めた6人の名前を並べる。',
      mean: '人数がもう埋まっていて、Dwight の席はないという断り。',
      trap: 'couples only だけ聞くと相手がいれば行けそうだが、6人で数がぴったり埋まっている。',
      use: 'Sorry, we’re fully booked.（すみません、満席です）' },

    // why: four ← "for" before "wine"; sixteen ← -teen stress
    { id: 'n2', skill: 'number', level: 'B1', point: 'six', seg: [89.6, 95],
      stem: 'How many wine glasses does Michael say he has?',
      choices: ['Four', 'Six', 'Sixteen'], a: 1, keep: true,
      cue: 'besides のあと、wine の直前の数。',
      line: 'I only have *six* wine glasses',
      said: '「ワイングラスが6つしかない」と言う。',
      mean: 'only があるので「少ない」という言い訳。客の数を限る理由にしている。',
      trap: 'sixteen なら teen が長く強い。six は短く、すぐ wine に続く。only は少なさの合図。',
      use: 'We only have two rooms left.（残りは2部屋だけです）' },
  ]
};
