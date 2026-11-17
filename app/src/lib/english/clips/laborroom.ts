// “Rachel Goes Into Labor | Friends” (the official Friends channel, Best of Season 8): Ross is proud of a record-fast
// trip to the hospital, the friends got there first anyway, and at the desk the private room they asked for is gone.
// Rachel tells Ross to pay the nurse; he asks politely instead; Rachel threatens to leave, a contraction hits, and she
// agrees to "look" at the semi-private room.
// Segments from the captions, words from whisper (2026-11-16). The captions stretch each line's last word (“over”
// 9.5 s, “sooner” 64.4 s, “look” 132.4 s); whisper's timings settle those. Ross is named at 36.9 s and 44.2 s and
// Rachel at 43.4 s; the speaker of “Man, if only you'd gotten here sooner” (61.6 s) isn't settled, so no item keys on
// it. Untested: 61.6 s (“you gotten”/“you'd gotten”), 66.3 s (“were”/“are all we have”), 79.7 s (“room”/“rooms”), and
// 119.9 s, where both sources have “see us in my private room” (probably “see a semi-private room”; no key rests on it).
// REVIEW 2026-11-16: pass 8, fix 13, drop 0, new 0; ear checks 1 (unchanged)
// OPEN: play-3 draws (seeds 7 and 14, and every seed with “harder” on) can't place an unseen C2: c2 shares `cave`
//   with the gist g2, and c1 reveals three points. This was there before the review (slightly worse before)
// EAR CHECK: 52.0 s r1 — the cut falls after “semi-private?” and before “we asked for a private room”
import type { Clip } from '../types.ts';

export const laborroom: Clip = {
  id: 'laborroom', video: 'B0zV8l9YiL8', title: 'Rachel Goes Into Labor', dur: 134, wpm: 147, band: 'slow',
  tags: ['お願い・断り'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // why: eleven ← “-even” is the part that carries, the first syllable lost; seventeen ← -teen/-ty and a “record”
    //   that sounds like a long trip
    { id: 'n1', skill: 'number', level: 'B1', point: 'seven', seg: [1, 6.5], keep: true,
      stem: 'How long did the trip from home to the hospital take?',
      choices: ['Under seven minutes', 'Under eleven minutes', 'Under seventeen minutes'], a: 0,
      cue: '「in under」のすぐあと、数字とその単位。',
      line: 'From home to the hospital *in under seven minutes*.',
      said: '「家から病院まで7分かからなかった。やった！」と喜んでいる。',
      mean: 'in under ～ minutes ＝ ～分以内で。速さを自慢する言い方。',
      trap: 'seven の後半「ヴン」は eleven とも似る。teen なら語尾が長く強く聞こえる。',
      use: 'We got there in under an hour.（1時間かからずに着いたよ）' },

    // R fix: V2, the lone “Sincerely” choice was a filler, so the labor joke stood out; it's now a sincere reading of
    //   “the hard part” (the pregnancy) that Ross's “No, but come on” refutes
    // why: scared ← right mechanism, wrong target: a fast drive is an easy thing to be sarcastic about; pregnancy over ←
    //   “the hard part is truly over” taken at face value, as the nine months
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'over', seg: [5, 13.2],
      stem: 'How does Rachel answer Ross’s “We did it”?',
      choices: ['Sarcastically: the real work hasn’t even started', 'Sarcastically: his fast driving scared her',
                'Sincerely: the hard months of pregnancy are over'], a: 0,
      cue: '彼女の返事と、それを受けた Ross の「No, but…」。',
      line: 'Yes, the *hard part is truly over*. — *No, but come on*…',
      said: '「一番大変なところはもう終わったわね」と言い、Ross が「いや、でもさ」と返す。',
      mean: 'これから出産なのに「大変なのは終わった」と言う皮肉。',
      trap: 'Yes で始まると同意に聞こえる。相手が No, but で言い訳を始めたら、皮肉だったしるし。',
      use: 'Oh great, that’s the hard part done.（よし、大変なのは済んだね…って、まさか）' },

    // R fix: V2/§9.5, “do you beat us” (a present for a past event) and “did he” (one person) were ruled out by logic;
    //   now “did they” (the friends are a group) and three choices
    // why: did they ← “did you” shrinks to “didja”, heard as the group he's facing; get us ← “beat” with the flapped t
    //   between vowels heard as a softer verb
    { id: 's1', skill: 'sound', level: 'B2', point: 'beat', seg: [20, 23.3],
      stem: 'Fill the gap: “How the hell ___ here?”',
      choices: ['did you beat us', 'did they beat us', 'did you get us'], a: 0,
      cue: '「How the hell」のあと、速くつながる4語。',
      line: 'How the hell *did you beat us* here?',
      said: '「なんで先に着いてるんだ？」と驚いている。',
      mean: 'did you は「ディジャ」、beat us は t が弾んで「ビーラス」に近い。',
      trap: 'did you がつぶれて did they に聞こえやすい。目の前の相手に聞くなら you。',
      use: 'You beat me to it!（先を越されちゃった！）' },

    // why: walked ← “Did you guys walk?” is said, but it's a joke question; subway ← “took a…” caught, the short noun
    //   after it lost
    { id: 'd1', skill: 'detail', level: 'B1', point: 'cab', seg: [20.5, 25.6],
      stem: 'How did the friends get to the hospital so fast?',
      choices: ['They took a cab', 'They walked over', 'They took the subway'], a: 0,
      cue: '「beat us here」の問いへの最初の答え。',
      line: 'We *took a cab*. Did you guys walk?',
      said: '「どうやって先に着いたんだ」と聞かれ、「タクシーで。そっちは歩いてきたの？」と返す。',
      mean: '歩いたのかという問いは、遅かった二人へのからかい。',
      trap: 'walk が聞こえても、それは相手に向けた冗談の質問。自分たちの手段は最初の一文。',
      use: 'Let’s just take a cab.（タクシーで行こうよ）' },

    // R fix: S1/V2, the stem said “they took a cab too”, which gave away d1's key; it now quotes only “but I did…”
    // why: tests at the hospital ← test = 検査, a hospital word; phoned ahead ← “we called from the car” later in the
    //   scene, moved here
    { id: 'i1', skill: 'infer', level: 'B2', point: 'tests', reveals: ['cab'], seg: [22.5, 30],
      stem: 'What does Ross’s “but I did…” add to his answer?',
      choices: ['He had rehearsed the trip on earlier days', 'He had some tests done at this hospital',
                'He had phoned the hospital several times first'], a: 0,
      cue: '「but」のあと、自分がしたことを言う部分。',
      line: 'we took a cab too, but I *did test runs*.',
      said: '「僕らもタクシーだよ。でも僕は下見で何度も走ってみたんだ」と言う。',
      mean: 'test run ＝ 本番前の試し走り。準備までしたのに負けた悔しさ。',
      trap: 'test を「検査」と取ると病院の話に聞こえる。run と組むと「試しにやってみる」。',
      use: 'Let’s do a test run first.（まず一度試してみよう）' },

    // R fix: V2, “a quicker route home” was a filler; now a direction flip (teasing the friends as slow)
    // why: teasing them as slow ← right target, wrong direction: the friends were the fast ones; hard to find ← “to this
    //   hospital” heard as a complaint about the place
    { id: 'h1', skill: 'humor', level: 'C1', point: 'tunnel', reveals: ['tests'], seg: [25, 36.7],
      stem: 'Why does Ross ask about a “magic tunnel”?',
      choices: ['He can’t believe anyone beat his fast trip', 'He is teasing the friends for being so slow',
                'He is joking that the hospital is hard to find'], a: 0,
      cue: '下見の話のすぐあと。何に納得がいかないのか。',
      line: 'is there some kind of *magic tunnel* to this hospital?',
      said: '「この病院には魔法のトンネルでもあるのか？」と聞く。',
      mean: '下見までして記録的に速かったのに負けた。ありえない、という負け惜しみの冗談。',
      trap: '道を本当に聞いているように聞こえるが、直前の悔しさとつなげると冗談だと分かる。',
      use: 'Is there a secret shortcut or something?（秘密の近道でもあるの？）' },

    // R fix: V2, “glad he has friends” didn't fit the moment; now the kind reading of the same words (let him enjoy it)
    // why: let him enjoy it ← the words taken as kind permission; worried he'll be in the way ← a plausible thought for
    //   a woman in labor, but she says nothing about inside
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'talk', seg: [32.3, 40.3],
      stem: 'When Rachel tells Ross to stay and talk, how does she feel?',
      choices: ['Fed up with his chatter about the trip', 'Happy to let him enjoy his record trip',
                'Worried he would get in the way inside'], a: 0,
      cue: '彼のトンネルの話のすぐあと。自分は何をしに行くと言うか。',
      line: 'Ross, you *stay here and talk*. I’m gonna go *have a baby*.',
      said: '「あなたはここで話してて。私は赤ちゃんを産みに行くから」と言う。',
      mean: '速さの話ばかりの Ross へのいら立ち。今いちばん大事なことを思い出させている。',
      trap: '言葉だけなら優しい提案。自分の大きな用事と並べたら、皮肉まじりの一言。',
      use: 'You keep talking. I’ll be inside.（どうぞ話してて。私は中にいるから）' },

    // why: call from the car ← “we called from the car” is said, a worry it didn't go through; far enough along ← the
    //   usual labor-ward script, not in the words
    { id: 'g1', skill: 'gist', level: 'B1', point: 'room', reveals: ['asked'], seg: [41.8, 69.3],
      stem: 'What is the trouble at the front desk about?',
      choices: ['Which kind of room they will get', 'Whether their call ahead got through',
                'Whether Rachel is far enough along'], a: 0,
      cue: '名前を言ったあと、何度も出てくる一つの言葉。',
      said: '電話で予約したが、用意されていたのは希望と違う部屋。二人は抗議する。',
      mean: '個室か、相部屋に近い部屋か。部屋の種類をめぐるやりとり。',
      trap: '電話の話も出てくるが、それは確認できている。問題は部屋のほう。',
      use: 'There’s a problem with my room.（部屋のことで問題があるみたいで）' },

    // why: private ← “semi-” is short and unstressed before the key word; another floor ← “labor room” heard, the rest
    //   filled in
    { id: 'd2', skill: 'detail', level: 'B1', point: 'semi', seg: [44.5, 49.8],
      stem: 'What kind of room does the nurse say is waiting for them?',
      choices: ['A semi-private labor room', 'A private labor room', 'A labor room on another floor'], a: 0,
      cue: '「we have a」のあと、room の前の語。',
      line: 'We have a *semi-private* labor room waiting for you.',
      said: '看護師が「セミプライベートの出産用の部屋をご用意しています」と言う。',
      mean: 'semi-private ＝ 2人ほどで使う部屋。完全な個室ではない。',
      trap: 'semi- は短く弱いので、private だけが耳に残りやすい。前の音まで聞く。',
      use: 'Is this a private room or shared?（個室ですか、相部屋ですか）' },

    // R fix: V2/K5, the key alone named a reason (“they asked for something else”) and the apology choice was ruled out
    //   by “we called from the car”; all three are now bare moves. B1: its line shows the room trouble, so it reveals
    //   `room`
    // why: an explanation ← the echo “Semi-private?” heard as a real question about the word; see the room first ← the
    //   polite “I'm sorry” (すみません) heard as a lead-in to a request
    // predict: the segment stops after “Semi-private?”, the reveal plays “we asked for a private room”
    { id: 'r1', skill: 'predict', level: 'B2', point: 'asked', reveals: ['semi', 'room'], seg: [45.5, 52], then: [52, 58],
      stem: 'After “Whoa, whoa, whoa. I’m sorry. Semi-private?”, what comes next?',
      choices: ['An objection about what they booked', 'A request to see the room first',
                'A question about what the word means'], a: 0,
      cue: 'whoa の繰り返しと、相手の言葉をくり返す言い方。',
      line: 'Whoa, whoa… I’m sorry. Semi-private? *We asked for a private room.*',
      said: '「待って。セミプライベート？個室を頼んだんですよ」と言う。',
      mean: 'この I’m sorry は謝罪でなく「ちょっと待って」。言葉のくり返しは反論の前ぶれ。',
      trap: '「すみません」から丁寧な頼みを予想しやすい。whoa のあとの sorry は抗議の入り口。',
      use: 'I’m sorry, did you say tomorrow?（すみません、明日って言いました？）' },

    // R fix: V2, “booked a day ahead” was weak; now “being cleaned” (currently heard, a hospital reason). B1: the stem
    //   (“no private room”) gives away g1's point
    // why: being cleaned ← “currently” caught, the reason filled in with a hospital routine; important people ←
    //   Rachel's claim later, put in the nurse's mouth
    { id: 'd3', skill: 'detail', level: 'B1', point: 'unavail', reveals: ['room'], seg: [55, 61.5],
      stem: 'What reason does the nurse give for no private room?',
      choices: ['They’re all taken at the moment', 'They’re being cleaned right now', 'They’re kept for important people'],
      a: 0,
      cue: '「unfortunately」のあと、文の最後の語。',
      line: 'we can’t guarantee a private room, and *currently, they’re all unavailable*.',
      said: '「個室はお約束できず、今はすべてふさがっています」と説明する。',
      mean: 'currently ＝ 今のところ。unavailable ＝ 使えない、空きがない。',
      trap: 'currently だけ拾うと「清掃中」などと補いやすい。理由は最後の一言、空きがないこと。',
      use: 'Sorry, that size is currently unavailable.（すみません、そのサイズは今品切れです）' },

    // R fix: K7/K6, the key was the longest and the only two-part choice; all three are now one clause. B1: a choice
    //   names the test runs, so it reveals `tests`
    // why: the friends ← right callback, wrong target: they beat Ross, but they took no room; test runs ← wrong
    //   direction: the test runs came before, and the trip was under seven minutes
    // anchor: 61.6 s the line follows “they're all unavailable”; 1.5–17 s Ross's “under seven minutes… some kind of a
    //   record”
    // retired: one C2 alone is under 2 (c2 retired)
    { id: 'c1', skill: 'humor', level: 'C2', point: 'sooner', reveals: ['unavail', 'seven', 'tests'], seg: [55.2, 65.3],
      stem: 'Why does the line about getting there sooner get a laugh?',
      choices: ['Ross’s record-fast trip still wasn’t fast enough', 'The friends got here first, so Ross looks slow',
                'Ross’s test runs wasted the time they needed'], a: 0,
      cue: '冒頭で Ross が自慢していたことを思い出して。',
      line: 'they’re all unavailable. — Man, *if only you’d gotten here sooner*.',
      said: '個室はもう空いていないと言われ、「もっと早く来ていればねえ」という一言が入る。',
      mean: '冒頭で「7分以内、記録だ」と自慢した速さが、ここで役に立たなかったと分かる。場面の中の前ふりを回収する笑い。',
      trap: '友だちに先を越された話も速さの話だが、部屋を取ったのは友だちではない。前ふりは自分たちの記録。',
      use: 'So much for leaving early.（早く出た意味、なかったね）', retired: true },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'second', seg: [69.3, 72],
      stem: 'Type what Ross says: “Okay, uh, just ___.” (4 words)', answer: 'give us a second',
      cue: '「Okay, uh, just」のあと。小さな語が二つ入る。',
      line: 'Okay, uh, just *give us a second*.',
      said: '看護師に「ちょっと待ってください」と言い、二人で相談する。',
      mean: 'give us a が「ギヴァサ」とつながる。us と a はほとんど音にならない。',
      trap: 'give a second と書きたくなるが、us が弱く入っている。',
      use: 'Can you give me a second?（ちょっと待ってもらえる？）' },

    // R fix: V2, “for women further along” was off the words; now right mechanism (saving), wrong target (emergencies)
    // why: all full ← Ross's view (“they're out of rooms”), the line just before; kept for emergencies ← “saving them”
    //   heard, the “important people” lost
    { id: 'i2', skill: 'infer', level: 'B2', point: 'saving', seg: [78, 83.4],
      stem: 'What does Rachel believe about the private rooms?',
      choices: ['Some are free but held for VIPs', 'They are all full, as the nurse says',
                'Some are free but kept for emergencies'], a: 0,
      cue: '「They’re not, Ross」のあと。', line: 'They’re not, Ross. They’re just *saving them for the important people*.',
      said: '「空きがないんだよ」と言う Ross に、「大事な客用に取ってあるだけ」と返す。',
      mean: 'save ＝ 取っておく。空きはあるのに出し惜しみされている、と思っている。',
      trap: '直前の Ross の意見と混ざりやすい。They’re not のあとが本音。',
      use: 'I’m saving this seat for a friend.（この席、友だちのために取ってあるの）' },

    // why: we'll be ← 'd almost silent before “be”, heard as the more common future; we're ← be heard as part of the
    //   vowel; we've been ← a v-like blur
    { id: 's2', skill: 'sound', level: 'B2', point: 'wed', seg: [83, 86.4],
      stem: 'Fill the gap: “Well, then ___ in a lot of trouble.”',
      choices: ['we’d be', 'we’ll be', 'we’re', 'we’ve been'], a: 0,
      cue: '「Well, then」のすぐあと、短い2語。',
      line: 'Well, then *we’d be* in a lot of trouble.',
      said: '「もしそうなら大変なことになるわ」。’d はほぼ聞こえない。',
      mean: 'What if I was…? という仮定への返事なので、仮定の would（’d）。',
      trap: 'd が消えると we’ll be にも聞こえる。もしもの話への返事なら ’d と考える。',
      use: 'Then we’d have to leave early.（それなら早めに出ないとね）' },

    // R fix: V2, “he would panic” was off the words and “mocks his geography” named the line; now a near miss on the
    //   same target (nobody would believe it)
    // why: even a president ← the topic stays on rooms, so the answer “should” too; nobody would believe it ← right
    //   target (Ross), wrong mechanism: she mocks what he knows, not his image
    { id: 'h2', skill: 'humor', level: 'C1', point: 'president', reveals: ['wed'], seg: [83, 89.4],
      stem: 'Why does Rachel’s answer to “What if I was the president?” get a laugh?',
      choices: ['She takes it literally and mocks what he knows', 'She says even a president would get no room today',
                'She says nobody would believe he was president'], a: 0,
      cue: '「in a lot of trouble」の理由として何を挙げるか。',
      line: 'Well, then *we’d be in a lot of trouble*. You *don’t know where any countries are*.',
      said: '「大統領だったら？」に「それは大変ね。あなた国の場所も知らないし」と返す。',
      mean: 'Ross は「偉い人なら」のつもり。それを本物の大統領の話にずらして、からかっている。',
      trap: '部屋の話が続くと思うと「部屋はもらえない」に引かれる。返事が話をずらしたら冗談。',
      use: 'If I ran things, we’d be in trouble.（私が仕切ったら大変なことになるよ）' },

    // why: an offer of money ← Rachel just told him to pay, and “Say, would you…” sounds like a lead-in; a firm demand ←
    //   what Rachel wants from him, not what he does
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'mind', seg: [91.8, 101.6],
      stem: 'What is Ross doing with “Say, would you, um…”?',
      choices: ['Making a timid request instead of paying', 'Slipping in an offer of money politely',
                'Making a firm demand for a better room'], a: 0,
      cue: 'um や uh の数と、最後に何をお願いしているか。',
      line: 'Say, would you, um, would you *mind checking again*…?',
      said: '「あの、もう一度確認していただけませんか、個室が空いていないか」と遠慮がちに頼む。',
      mean: 'お金を渡せと言われたのに、ただ丁寧にお願いし直している。押しの弱さが出ている。',
      trap: '直前の「お金を」から、渡す前置きに聞こえやすい。お金の話は一言も出ていない。',
      use: 'Would you mind checking again?（もう一度確認していただけますか）' },

    // why: walks out ← her threat (“not the only hospital in the city”) taken as what she does; gets the private room ←
    //   the nurse's last offer misheard (both sources even have “private”)
    { id: 'g2', skill: 'gist', level: 'B2', point: 'cave', seg: [101, 123.5],
      stem: 'How does Rachel’s stand against the nurse end?',
      choices: ['She backs down and goes to see the room', 'She walks out to try another hospital',
                'She wins and gets the private room'], a: 0,
      cue: '陣痛のあと、看護師の申し出への返事。',
      said: 'ほかの病院へ行くと言いかけたところで陣痛が来て、看護師の部屋の案内に応じる。',
      mean: '強気の抗議が、陣痛ひとつで終わってしまう流れ。',
      trap: '途中の「ほかにも病院はある」が強く残るが、言い終わる前に陣痛が来ている。',
      use: 'Fine, you win.（分かった、あなたの勝ち）' },

    // R fix: V2, “can't hear her voice” was a filler; now “don't care” heard as not caring what the nurse thinks
    // why: doesn't mind ← “don't care” = 気にしない, the “for” lost; doesn't care what she thinks ← “I don't really care”
    //   heard as the whole clause, “for your tone” lost
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'tone', seg: [103.9, 107.7],
      stem: 'Right after “I have to say”, what is Rachel telling the nurse?',
      choices: ['She doesn’t like the way the nurse talks', 'She doesn’t mind how the nurse talks to her',
                'She doesn’t care what the nurse thinks of her'], a: 0,
      cue: '「I have to say」のあと、care のあとの語。',
      line: 'I have to say, I *don’t really care for your tone*.',
      said: '「言わせてもらうけど、その言い方は気に入らないわ」と言う。',
      mean: 'not care for ～ ＝ ～が好きではない。tone ＝ 口調。抗議の決まり文句。',
      trap: 'don’t care を「気にしない」と取ると逆の意味になる。care for は「好む」。',
      use: 'I don’t really care for spicy food.（辛い物はあまり好きじゃない）' },

    // R fix: V2, “still finds the nurse rude” was said openly, so nobody would take it; now the direction flip (she
    //   still means to leave)
    // why: the pain ← near miss on what she hides, but the “ow”s say it out loud; still means to leave ← right target
    //   (the threat), wrong direction: “it couldn't hurt to look” accepts the room
    // anchor: 107.8–111.6 s the threat (“not the only hospital… we have no problem to—”), cut off by the contraction,
    //   then “it couldn't hurt to look”
    // retired: for the draws: play 3 drew no C2 while one was unseen (g2 shares its point, cave)
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'cave', reveals: ['look'], seg: [107.5, 123.5],
      stem: 'With her last reply, what is Rachel trying not to say?',
      choices: ['That she’s giving up her threat to go elsewhere', 'That the pain is much worse than she admits',
                'That she still means to try another hospital'], a: 0,
      cue: '陣痛の前に言いかけたことと、最後の返事の差。',
      line: 'this is not the only hospital… — Yeah, it *couldn’t hurt to look*.',
      said: '「ほかにも病院はある」と言いかけ、陣痛のあと「見るだけなら損はない」と答える。',
      mean: '「負けました」とは言わず、ちょっと見てみるだけという顔をする。体面を保ちながらの降参。',
      trap: '痛みは声で隠さず出している。隠しているのは、さっきの強気を引っこめること。',
      use: 'I guess I could take a quick look.（ちょっと見るだけなら、まあ）', retired: true },

    // R fix: V2/K5, two distractors were the same literal-hurt misreading (the key was the odd one out); the second is
    //   now “couldn't” heard as a refusal, and all three are about seeing it
    // why: hurt more ← hurt taken literally right after the contraction; not worth the bother ← the negative
    //   “couldn't” heard as a dismissal
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'look', reveals: ['cave'], seg: [119.3, 123.5],
      stem: 'What does Rachel’s final reply to the nurse mean?',
      choices: ['Seeing it can’t do any harm', 'Seeing it would only hurt more', 'Seeing it is not worth the bother'], a: 0,
      cue: '最後の返事。hurt の前の否定の形。',
      line: 'Would you like to see… room? — Yeah, it *couldn’t hurt to look*.',
      said: '部屋を見るかと聞かれ「見るだけなら損はない」と答える。',
      mean: 'It couldn’t hurt to ～ ＝ ～しても損はない。気軽な受け入れ。',
      trap: '陣痛の直後で hurt を「痛い」、couldn’t を断りと取りやすい。Yeah で始まる受け入れ。',
      use: 'It couldn’t hurt to ask.（聞くだけ聞いてみたら）' },
  ]
};
