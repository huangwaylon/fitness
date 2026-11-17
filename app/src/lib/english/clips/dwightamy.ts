// REVIEW 2026-11-16: pass 8, fix 16, drop 0, new 0; ear checks 1
// REVIEW open: d2 was a 65 % blind pick only because s1's stem ("put ___ in the hallway") was in view; the two share
//   a reveal and are never drawn together, so it's kept. x1 and nt2 left the ear-check list (both sources agree on
//   their words: review-rubric addendum).
// REVIEW open: on a cold re-read, nt1 and a2 still came in at 65 %, and g1, i2, h3 and g2 at 60 % (sitcom sense);
//   kept, since no distractor I tried was both tempting and refutable.
// “Dwight Hits on Amy Adams - The Office US” (the official The Office channel, Best of Season 1): Michael bans a
// handbag seller until he meets her, then hands her the conference room; the seller explains who buys from her; Dwight
// is coached into "buying a purse" and goes straight to it; Jim chats with Katie, then has an awkward weekend talk.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 273 s; whisper's lines after that are a
// loop. Untested: 26–34 s (the "henhouse" innuendo), 78–81 s (Katie to a customer), 81–96 s (Dwight's checklist talking
// head, sexual), 148–158 s (a garbled brand name), 183–197 s (the watchers' lines, speakers unclear), 225–232 s ("I'm
// bored" / "Thank you for choosing me", speakers unclear), 12.7 s ("you talked to her" vs "you'd talk to her at least")
// and 251 s ("great stuff" vs "Big stuff").
// EAR CHECK: 69.1 s s1 d2 nt1 — "put 'em in the hallway" (whisper "'em", captions "them"); s1 claims 'em sounds close
//   to "him" (the captions hear "give him" at 71.6 s where whisper has "give 'em")
import type { Clip } from '../types.ts';

export const dwightAmyAdams: Clip = {
  id: 'dwightamy', video: 'bDynTALUc84', title: 'Dwight Hits on Amy Adams - The Office US', dur: 302, wpm: 149,
  band: 'slow', tags: ['職場', '買い物'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 — keeping the rule was the only alternative to the key; all three now say why or how far he bends it
    // why: a deal ← sellers often win people over with an offer; until 11:30 ← "HR meeting… at 11:30" heard as a time limit
    //   on the room
    { id: 'g1', skill: 'gist', level: 'B2', point: 'rule', reveals: ['ykw', 'decisive'], seg: [0, 73.6],
      stem: 'What happens to Michael’s “no vendors” rule in this first scene?',
      choices: ['He drops it as soon as he meets her', 'He drops it after she offers him a deal',
                'He keeps it, but bends it until 11:30'], a: 0,
      cue: '最初の「No」と、彼女に会ったあとの「But」。',
      line: 'No vendors in the office. … today I am going to *break some rules*.',
      said: '最初は「物売りは禁止」と断るが、本人に会うと「今日はルールを破る」と会議室を丸一日貸す。',
      mean: '会ったとたんに態度が変わる。あとの予定より彼女を優先する。',
      trap: '11:30 は人事の会議の時刻で、期限ではない。会ったあとの But に変化が出る。',
      use: 'Okay, just this once.（じゃあ、今回だけね）' },

    // why: conference room ← he later hands her the conference room for the day, so the room sounds like the issue; HR ← an office rule sounds like HR's, and HR
    //   comes up later
    { id: 'd1', skill: 'detail', level: 'B1', point: 'distraction', seg: [7.3, 12.8],
      stem: 'What reason does Michael give for not allowing vendors?',
      choices: ['They pull people away from work', 'They tie up the conference room', 'HR doesn’t allow selling at work'], a: 0,
      cue: '「No, no, no」のあとの短い一文。',
      line: 'No vendors in the office. *That is a distraction*.',
      said: '「物売りはだめだ。気が散るから」と即答する。',
      mean: 'distraction ＝ 気を散らすもの。仕事の邪魔になる、が理由。',
      trap: '会議室はあとで貸す部屋の話で、理由ではない。理由は No のあとの一文に来る。',
      use: 'My phone is a big distraction.（スマホがすごく気を散らす）' },

    // R fix: V2 — the amused distractor was weak; a curious reading replaces it
    // why: apologetic ← "I'm busy" heard as the Japanese polite excuse (今ちょっと…); curious ← "come on" heard as "go on"
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'busy', seg: [12.5, 18.2],
      stem: 'How does Michael sound when Pam brings the seller up again?',
      choices: ['Impatient; he wants Pam to get rid of her', 'Apologetic; he’d help, but he’s too busy',
                'Curious; he wants to hear more about her'], a: 0,
      cue: '名前を2回呼んだあと、続く二つの言葉。',
      line: 'Pam, Pam, *come on*. I’m busy. So *just tell her to go away*.',
      said: '「パム、頼むよ。忙しいんだ。帰ってもらって」と言う。',
      mean: 'come on ＝ いいかげんにして。自分で断らず、パムに押しつけている。',
      trap: 'I’m busy を「すみません、今忙しくて」の遠慮と取りやすい。just tell her は突き放す言い方。',
      use: 'Come on, I’m in the middle of something.（ちょっと、今取り込み中なんだ）' },

    // R fix: V2 — "six years" was weak; the sixth-holder reading of "6.0" replaces it, and the choices are parallel
    // why: copying ← "like the new… Pam" heard as Katie modeled on Pam; sixth ← "6.0" heard as a count
    { id: 'i1', skill: 'infer', level: 'C1', point: 'pam6', seg: [40.3, 47.4],
      stem: 'What does Michael’s comparison of Katie to Pam suggest about Pam?',
      choices: ['She’s the older version that Katie beats', 'She’s the original that Katie is copying',
                'She’s the sixth person to have her job'], a: 0,
      cue: '「new and」のあとの語と、数字の付け方。',
      line: 'You’re like the *new and improved* Pam. *Pam 6.0*.',
      said: 'ケイティに「新しく改良されたパムだね。パム6.0」と言う。',
      mean: '製品の新型のような言い方。ほめたつもりでも、本物のパムは旧型扱いになる。',
      trap: '6.0 を年数と取ると通じない。new and improved は「前の型より良い」という宣伝文句。',
      use: 'It’s the new and improved version.（新しく改良された版だよ）' },

    // why: question ← "you know what?" heard as a real question (知ってる？); warning ← it follows "no catfights…
    //   against violence", so more scolding seems next
    { id: 'mk1', skill: 'marker', level: 'B2', point: 'ykw', seg: [51.7, 62.9],
      stem: 'Right after the catfight remarks, what does Michael’s short opener signal?',
      choices: ['A sudden change of heart is coming', 'A real question about what she knows',
                'Another warning about fighting at work'], a: 0,
      cue: '「Doesn’t matter」のあとの、文頭の決まり文句。',
      line: 'So, uh, *you know what?* I usually don’t allow solicitors… But, uh, today…',
      said: '「そうだな、実はね。普段は物売りは入れないんだけど、今日は…」と切り出す。',
      mean: 'you know what? は答えを求めない前置き。今決めたことを出す合図。',
      trap: '「知ってる？」と質問に取りやすい。返事を待たずに話が続けば、ただの前置き。',
      use: 'You know what? Let’s just order pizza.（そうだ、ピザ頼んじゃおう）' },

    // R fix: B1 — its line and notes show the change of heart, so it now reveals 'ykw' (mk1)
    // R fix: V2/S4 — the key was the only cynical choice, and the segment ran 22.8 s; it now starts at "It's yours all
    //   day" (64.25–78.35, 14.1 s), and the near misses take the talking head at face value
    // anchor: 57.4–62.8 s "I usually don't allow solicitors… today I am going to break some rules" for Katie, 66–71 s the
    //   HR meeting pushed out to the hallway, then to camera 73.7–78 s "Decisiveness. One of the keys to success": he
    //   calls the favor a leadership skill
    // why: fair fix ← "Decisiveness… keys to success" taken at face value; against his wishes ← "I usually don't allow"
    //   heard as reluctance
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'decisive', reveals: ['hallway', 'em', 'ykw'], seg: [64.25, 78.35],
      stem: 'After his comment to the camera, how should we hear the hallway decision?',
      choices: ['A favor to Katie that he dresses up as leadership', 'A quick, fair fix that he is rightly proud of',
                'A hard choice he made against his own wishes'], a: 0,
      cue: '場面での決め方と、カメラへの一言を比べて。',
      line: 'It’s yours all day. … let’s put ’em in the hallway. … *Decisiveness.* One of the keys to success…',
      said: '会議室を譲り、人事の会議を廊下に回す。カメラには「決断力。成功の鍵」と語る。',
      mean: '場面で見えたのは気に入った相手へのひいき。それを「決断力」と言いかえている。',
      trap: 'カメラの言葉をそのまま信じやすい。この形式では、場面とのずれに笑いがある。',
      use: 'I call it being flexible.（柔軟って言ってほしいね）', retired: true },

    // why: 7:30 ← "eleven" and "seven" share "-even"; 10:30 ← the "-thirty" is caught but the first number is lost;
    //   11:13 ← thirty/thirteen
    { id: 'n1', skill: 'number', level: 'B1', point: 'meeting', seg: [64.25, 68.45], keep: true,
      stem: 'What time is the HR meeting in the conference room?',
      choices: ['7:30', '10:30', '11:13', '11:30'], a: 3,
      cue: '「at」のあと、時刻の二つの数。',
      line: 'There’s an HR meeting in there at *11:30*.',
      said: '「その会議室は11時半に人事の会議がある」と知らされる。',
      mean: 'eleven thirty ＝ 11時30分。',
      trap: 'thirty と thirteen は似ている。thirty は前が強く、thirteen は teen が長い。',
      use: 'Let’s meet at eleven thirty.（11時半に会おう）' },

    // why: afternoon ← "11:30" plus a delay is the usual fix; his office ← "it's yours all day" heard about another room
    { id: 'd2', skill: 'detail', level: 'B1', point: 'hallway', reveals: ['em'], seg: [64.25, 73.6],
      stem: 'What does Michael do about the clash with the HR meeting?',
      choices: ['Moves the meeting out into the hallway', 'Pushes the meeting back to the afternoon',
                'Gives Katie his own office for the day'], a: 0,
      cue: '「Well」で始まる返事。どこに移す？',
      line: 'Well, let’s put ’em in the *hallway*.',
      said: '「じゃあ人事の会議は廊下でやってもらおう。椅子も出すから」と答える。',
      mean: '会議より物売りを優先する決定。hallway ＝ 廊下。',
      trap: '時刻の話が出たので、時間をずらす案が浮かびやすい。動かしたのは時間でなく場所。',
      use: 'Let’s move the meeting to Room B.（会議をB室に移そう）' },

    // why: him ← "'em" has no th, like "him" with a weak h (the captions themselves hear "him" in the next line); her ←
    //   Katie is the one who needs a room; it ← "the meeting" is a thing
    { id: 's1', skill: 'sound', level: 'B2', point: 'em', reveals: ['hallway'], seg: [68.05, 71.4],
      stem: 'Fill the gap: “Well, let’s put ___ in the hallway.”',
      choices: ['them', 'him', 'her', 'it'], a: 0,
      cue: 'put のすぐあと、とても短い弱い音。',
      line: 'Well, let’s put *’em* in the hallway.',
      said: '「じゃあ、廊下に移そう」と言う。them が弱まり「エム」に近い。',
      mean: '’em は them の弱い形で、会議の人たちを指す。put‿em とつながる。',
      trap: 'him も h が弱いと似る。前に複数の人の話があれば ’em を疑う。',
      use: 'Just tell ’em I’ll be late.（遅れるって伝えといて）' },

    // R fix: V2 — the key was the only gift choice; the distractors now swap one part each (women + gifts, men + work)
    // why: women ← the usual buyers of handbags (the script the line breaks); for work ← "mini briefcases" comes up later
    { id: 'd3', skill: 'detail', level: 'B1', point: 'customers', seg: [97.4, 108.5],
      stem: 'According to Katie, who usually buys the most from her?',
      choices: ['Men buying them as gifts', 'Women buying them as gifts', 'Men buying them for work'], a: 0,
      cue: '「usually」の前の主語と、後の「For」。',
      line: '*Guys* are usually my *best customers*. … *For gifts*, you know.',
      said: '「いちばんのお客さんは、たいてい男性。プレゼント用に買っていく」と話す。',
      mean: 'guys ＝ 男の人たち。ハンドバッグの客は女性、という予想の逆。',
      trap: 'バッグなら女性客と思い込みやすい。usually の前の主語をまず聞く。',
      use: 'Students are our best customers.（学生がいちばんのお客さんです）' },

    // R fix: V2 — the distractors were the only kind readings; all three now steer them somewhere
    // why: budget ← "make suggestions" heard as kind advice (the polite-clerk script); best sellers ← "best customers"
    //   heard just before
    { id: 'i2', skill: 'infer', level: 'C1', point: 'suggest', reveals: ['customers'], seg: [97.4, 108.5],
      stem: 'What does Katie’s remark about making suggestions imply?',
      choices: ['She steers them to the pricier bags', 'She steers them to bags on a budget', 'She steers them to her best sellers'], a: 0,
      cue: '「high-end」と、最後の「so」をつなぐ。',
      line: 'They buy the *high-end stuff*… They *don’t know what they’re looking at*, so I make suggestions.',
      said: '男性客は高い品を買い、よく分かっていないので自分が勧める、と話す。',
      mean: '分からない客に勧めるのは高い品。親切そうな言い方で商売上手を明かす。',
      trap: 'suggestions を親切な助言とだけ取りやすい。前の high-end とつなげる。',
      use: 'Can you suggest something under fifty?（50ドル以下で何かおすすめは？）' },

    // R fix: V2 — the key was the only choice about the talk; all three now say when, in parallel
    // why: sales table ← "stall" as a market stall (売店), and Katie is selling at a table; waiting ← "stall" as in
    //   stalling for time
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'stall', seg: [108.4, 113.65],
      stem: 'In the coaching, when is Dwight’s backup plan meant to be used?',
      choices: ['If he runs out of things to say', 'If Katie’s sales table is too busy', 'If Katie keeps him waiting too long'], a: 0,
      cue: '「keep talking」のあとの「If」。',
      line: 'You just keep talking to her. If you *hit a stall*, you have a perfect *fallback*.',
      said: '「話し続けろ。止まったら、完ぺきな奥の手がある」と言う。',
      mean: 'hit a stall ＝ 行きづまる。会話が続かなくなったら、の意味。',
      trap: 'stall には「売店」の意味もあり、売り場の話に聞こえやすい。hit a ～ は「～にぶつかる」の型。',
      use: 'If we hit a snag, call me.（何か問題が起きたら電話して）' },

    // why: work time ← "spending way too much time" read literally, as a complaint; talks too much ← "talking" heard as
    //   about Dwight's habit with women
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'listen', seg: [124.6, 129.8],
      stem: 'When the coaching ends with “Listen…”, what is the coach doing?',
      choices: ['Pushing Dwight to go talk to Katie right now', 'Complaining Dwight is costing him work time',
                'Warning Dwight he talks too much to women'], a: 0,
      cue: '「Listen」のあと、だれと話す時間のこと？',
      line: 'Listen, you are spending *way too much time talking to me*.',
      said: '「いいか、俺と話してる時間が長すぎる」と言う。',
      mean: '文句の形をとった後押し。「ここにいないで、早く彼女のところへ」という意味。',
      trap: '文字どおり取ると時間の苦情に聞こえる。to me が付いたら「相手が違う」という合図。',
      use: 'Why are you still talking to me? Go!（まだここにいるの？行って！）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'bathroom', seg: [129.6, 133.15],
      stem: 'Type Dwight’s words: “Okay, I’m ___ the bathroom.” (3 words)', answer: 'just gonna use',
      cue: '「I’m」のすぐあと、速く続く3語。',
      line: 'Okay, I’m *just gonna use* the bathroom.',
      said: '「ちょっとトイレに…」と逃げようとする。going to が gonna に。',
      mean: 'just gonna ＝ ちょっと～する。逃げる口実で、すぐ止められる。',
      trap: 'going to と書きたくなるが、音は gonna。just は弱く短く落としやすい。',
      use: 'I’m just gonna grab a coffee.（ちょっとコーヒー買ってくる）' },

    // R fix: V2 — "a fun disaster" was the only vivid choice; all three now say how "it" will go
    // why: hopeful ← "this is going to be good" taken at face value; nervous ← "stop whatever you're doing" is what you say
    //   when the boss walks in
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'good', seg: [137.7, 143.9],
      stem: 'When someone tells others to stop what they’re doing, how do they feel?',
      choices: ['Gleeful; it’s sure to go badly', 'Hopeful; it might go well for once', 'Nervous; it could get them in trouble'], a: 0,
      cue: '「because」のあとの理由。',
      line: 'Stop whatever you’re doing, because *this is going to be good*.',
      said: '「手を止めて。これは見ものだぞ」と周りに声をかける。',
      mean: 'this is going to be good ＝ 面白いことが起きるぞ。失敗を見物する楽しさ。',
      trap: 'good を「うまくいく」と取ると応援に聞こえる。人を呼んで見せるなら、見物の good。',
      use: 'Grab some popcorn. This’ll be good.（ポップコーン用意して。見ものだよ）' },

    // R fix: V2 — "what was saved for last" read as the shape of a joke; plainer key, same near misses
    // why: sell ← "buy a purse from you" with "from" lost, heard as an offer to sell; gift ← Katie just said men buy
    //   purses as gifts
    { id: 'h2', skill: 'humor', level: 'C1', point: 'opener', reveals: ['stall'], seg: [143.9, 148.4],
      stem: 'Why is Dwight’s first line to Katie funny?',
      choices: ['He jumps right to the backup plan', 'He offers to sell her one of his own bags',
                'He says it’s a gift for someone else'], a: 0,
      cue: 'コーチの作戦を思い出して、最初の一言を。',
      line: 'Hi, my name’s Dwight Schrute, and *I would like to buy a purse from you*.',
      said: 'あいさつして名乗るなり「あなたからバッグを買いたい」と言う。',
      mean: '話し続けて、行きづまったら買う、という作戦だった。最後の手を最初に出し、会話を飛ばしている。',
      trap: 'from を聞き落とすと売り込みに聞こえる。作戦の順番と比べると笑いが分かる。',
      use: 'Let’s skip the small talk.（世間話は飛ばそう）' },

    // why: less tense ← "stress" as ストレス, the katakana meaning; worth the price ← a test before buying sounds like
    //   checking value, and he asks the price later
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'stress', seg: [161.2, 166.6],
      stem: 'What does Dwight want to find out about the purse?',
      choices: ['Whether it holds up under rough use', 'Whether it helps him feel less tense', 'Whether it’s worth the high price'], a: 0,
      cue: '「test it」のあとの「in case」。',
      line: 'I want to *stress test it*, you know, *in case anything happens*.',
      said: '「何かあったときのために、ストレステストしたい」と言う。',
      mean: 'stress test ＝ 力をかけて壊れないか試すこと。機械用の言葉をバッグに使うのがおかしい。',
      trap: 'ストレスをカタカナの意味で取ると気分の話になる。in case のあとが目的。',
      use: 'Let’s test it before the trip.（旅行の前に試してみよう）' },

    // R fix: V2 — "making fun of the purse" was weak; the new near miss reads "prettiest girl" as Katie, won over
    // why: Katie ← "I'm" shrinks before "gonna be", so the girl could be her; win her over ← "prettiest" heard as the
    //   effect on Katie
    { id: 'h3', skill: 'humor', level: 'C1', point: 'girl', seg: [175.7, 182.6],
      stem: 'Why does Dwight’s line about the ball get such a big laugh?',
      choices: ['He pictures himself as the girl at the ball', 'He pictures Katie as the girl at the ball',
                'He thinks the bag will win Katie over'], a: 0,
      cue: '「gonna be」の前の主語。',
      line: '*I’m gonna be* the prettiest *girl* in the ball.',
      said: '「いちばんきれいなバッグだ。いちばんきれいな女の子になるぞ」と言う。',
      mean: '「バッグは女の物」と嫌がっていた本人が、自分を女の子に見立ててはしゃぐ落差。',
      trap: 'I’m は弱く、ケイティの話にも聞こえる。主語を聞き、さっきの発言と比べる。',
      use: 'I’m gonna be the best-dressed guy there.（その場でいちばんおしゃれになるぞ）' },

    // R fix: V2 — "pokes fun at his own dull desk job" named the mechanism outright; all three now describe the answer
    // why: everyone knows him ← "best known for" heard as fame (有名); stuck ← "sitting out there" heard as a gripe
    { id: 'h4', skill: 'humor', level: 'B2', point: 'known', seg: [207.3, 213.55],
      stem: 'When Katie asks about where he sits, why is Jim’s answer funny?',
      choices: ['He makes “sitting” sound like a big achievement', 'He hints that everyone in the office knows him',
                'He hints that his desk job keeps him stuck there'], a: 0,
      cue: '「I do」のあとの、大げさな言い方。',
      line: 'I do. That’s what I’m *best known for*. *Sitting out there*.',
      said: '「外の席の人？」に「そう。それで有名。外に座ってること」と返す。',
      mean: 'best known for は本来、大きな業績に使う。座っているだけの地味さを自分で笑う。',
      trap: 'best known を自慢や不満と取りやすい。大げさな語に小さな中身は自分いじり。',
      use: 'That’s what I’m famous for.（それで有名なんだ、僕は）' },

    // R fix: V2 — the choices were uneven; all three now say what he makes clear
    // why: show him ← "here to learn" heard as learning her job; can't afford ← "don't try to sell me one" heard as "I
    //   have no money"
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'learn', seg: [215.5, 223.1],
      stem: 'When Jim tells Katie not to sell him a purse, what is he doing?',
      choices: ['Making it clear he’s there to talk, not buy', 'Asking her to show him how she sells',
                'Letting her know he can’t afford one'], a: 0,
      cue: '「Seriously」のあとの理由。',
      line: 'Don’t try to sell me one, okay? Seriously, ’cause *I’m just here to learn*.',
      said: '「売り込まないでね。本気で。勉強しに来ただけだから」と言う。',
      mean: '買う気はないと先に言い、気楽に話せる場にする。learn は話しに来た口実で、半分冗談。',
      trap: 'learn から「売り方を習う」と取りやすい。何を学ぶかは言っていない。',
      use: 'I’m just looking, thanks.（見てるだけです、どうも）' },

    // R fix: V2 — the key was the only abstract choice; all three now start "Each…"
    // why: free ← "big plans" asked, then "I don't know"; cousin ← "help Roy's cousin move" heard as both of them
    { id: 'g2', skill: 'gist', level: 'B2', point: 'weekend', reveals: ['cool'], seg: [232.5, 273.7],
      stem: 'In the weekend chat at the end, what do the two find out?',
      choices: ['Each has plans with someone else', 'Each is free, so they make plans', 'Each is helping Roy’s cousin move'], a: 0,
      cue: '二人それぞれの答えの、だれと。',
      said: '一人は「ケイティと会う」、もう一人は「ロイのいとこの引っ越し」。最後は「いいね」が続く。',
      mean: '週末はそれぞれ別の相手と過ごすと分かる場面。',
      trap: '食事や引っ越しは片方だけの予定。だれの予定かは I と we で分ける。',
      use: 'What are you up to this weekend?（週末なにするの？）' },

    // R fix: N6 — said + mean + trap were 125 characters; trimmed to 120
    // anchor: 233.4–234.4 s both sources: "so you got big plans this weekend": no "do", no "have", ~6 words in 1.2 s
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'plans', seg: [232.55, 235.4],
      stem: 'Type the question: “Um, so ___ this weekend?” (4 words)', answer: 'you got big plans',
      cue: '「so」のすぐあと。文法より、聞こえた音を。',
      line: 'Um, so *you got big plans* this weekend?',
      said: '「で、週末なにか予定あるの？」と聞く。4語が一続きに速い。',
      mean: '会話では Do you have が落ち、You got ～? で質問になる。上がり調子が疑問の印。',
      trap: '文法どおりに do や have を足したくなる。書き取りは言われた音のとおりに。',
      use: 'You got a minute?（ちょっといい？）' },

    // R fix: V2 — the near misses were weak; both now read the list at face value in a different way
    // anchor: 243.9–245.3 s "Oh, man, I don't know" right before the list, and 248.5 s "matching tattoos" for a date
    //   with someone he met at 206 s ("I'm Jim, by the way. — I'm Katie"): the last item can't be meant
    // why: long night ← four items in a row sound like a full evening; impress ← a big list sounds like trying hard
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'tattoos', seg: [236.7, 250.0],
      stem: 'Taken seriously, what would the last weekend plan in the list say?',
      choices: ['That they’re a couple for life already', 'That he’s planned a very long night out',
                'That he’ll do anything to impress her'], a: 0,
      cue: '「I don’t know」と、最後の一つの重さ。',
      line: 'Oh, man, *I don’t know*. Uh, dinner, drinks, movie, *matching tattoos*.',
      said: '予定を聞かれ「さあね。食事、飲み、映画、おそろいのタトゥー」と並べる。',
      mean: '本気なら、会ったばかりの相手と一生の印を入れる仲。重すぎる一つで、予定はないと伝える。',
      trap: '四つ並ぶと計画的に聞こえる。最後に極端な一つが来たら、全部を冗談にする合図。',
      use: 'Dinner, a movie, maybe a wedding.（食事、映画、たぶん結婚式）' },

    // R fix: V2 — the key was the only plain reading; all three now say what the replies show
    // why: glad ← "That's cool" at face value (the polite-praise frame); teasing ← "cool" after a dull plan (helping
    //   someone move) heard as sarcasm
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'cool', reveals: ['weekend'], seg: [259.1, 268.2],
      stem: 'What do the repeated “That’s cool” replies show about the chat?',
      choices: ['Both have run out of things to say', 'Both are glad the other has nice plans',
                'One is teasing the other’s dull plans'], a: 0,
      cue: '同じ返事の回数と、あいだの短い相づち。',
      line: 'That’s cool. — Uh-huh. — Yes. — *That is cool*.',
      said: '引っ越しの話のあと「いいね」「うん」「そう」「いいね」と短い返事だけが続く。',
      mean: '中身のない相づちのくり返しは、話題が尽きた印。互いの週末を知った気まずさ。',
      trap: 'cool をほめ言葉とも皮肉とも取りやすい。同じ返事が続いたら、中身の量を聞く。',
      use: 'Cool, cool. So… anyway.（そっか、そっか。で…まあ）' },
  ]
};
