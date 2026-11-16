// “Ron, April and Andy's Wild Puzzle | Parks and Recreation” (the official Parks and Recreation channel, Season 7): April
// can't find the key to Ron's house she hid years ago, only her own teasing note, so Ron, April and Andy follow her old
// clues; at the end Ron tells her the key never mattered, and a pun leads her to it.
// Segments from the captions, words from whisper (2026-11-16). Untested on purpose: 95–97 s (“Team Voldemort”/“killing
// Tim Baltimore”), 114–116 s (captions garbled), 122.5 s (“Still”, missing in the captions), 141–197 s (the basement
// scene and the “ghost”), 197–213 s (the councilman's racist line), 230–246 s (“See me in my office”, “Get off my boat”).
// EAR CHECK: 109.4 s s1 — “She did make a stop” in both sources; the key rests on hearing the stressed “did” (not “didn’t”)
// EAR CHECK: 251.8 s x1 — “I let you down” in both sources; the key claims “let you” links (≈“letcha”)
// REVIEW 2026-11-16: pass 8, fix 16, drop 0, new 0; ear checks 2
// Open: a cold re-read still beats a1 and a2 at 70 % (Ron loving puzzles is show knowledge; April's sarcasm is
//   in character).
// Open: a1 rests on "And I love puzzles" being sincere; "Finally, a scavenger hunt worthy of my time" (72 s, outside the
//   segment) confirms it. If his voice sounds dry on the phone, widen the segment rather than change the key.
import type { Clip } from '../types.ts';

export const ronsKey: Clip = {
  id: 'ronskey', video: 'fsCeZQ4cjGk', title: 'Ron, April and Andy\'s Wild Puzzle', dur: 349, wpm: 153, band: 'slow',
  tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %): the key was the only choice where April acts; three "She … long ago, and…" choices now
    // why: remodel ← "My desk was right here" says the office has changed; Andy ← Andy is there, and the note in its
    //   place reads like a prank
    { id: 'g1', skill: 'gist', level: 'B1', point: 'lost', seg: [0, 56.65],
      stem: 'Why can’t April simply hand Ron’s key back to him?',
      choices: ['She moved it long ago and can’t remember where', 'She hid it long ago, and a remodel moved her desk',
                'She hid it long ago, and Andy took it as a joke'], a: 0,
      cue: 'Ron への説明、safe place のあと。',
      line: 'I had it in a safe place and then I *moved it to protect it* and *I don’t remember where*.',
      said: '隠した場所に鍵はなく、自分のメモだけ。「守るために移して、どこか忘れた」と言う。',
      mean: '鍵探しは、昔の自分が残した謎を解くこと。だから宝探しになる。',
      trap: '「机はここだった」で、改装で消えたように聞こえやすい。署名と「移した」を聞く。',
      use: 'I put it somewhere safe. Now where?（安全な所にしまった。で、どこだっけ）' },

    // why: a love note ← later we learn April had a crush on Andy; a hint ← "If you are looking for…" sounds like the
    //   start of a clue
    { id: 'h1', skill: 'humor', level: 'C1', point: 'cordial', seg: [13.75, 19.05],
      stem: 'What makes the way April’s note ends funny?',
      choices: ['A taunt ends with a stiff, polite sign-off', 'A taunt ends like a sweet love note to Andy',
                'A taunt ends with a small hint about the key'], a: 0,
      cue: 'メモの最後、名前の前の一語。',
      line: 'I moved it and *you’ll never find it*. *Cordially, April.*',
      said: 'メモに「鍵は移した。絶対見つからない。敬具、エイプリル」とある。',
      mean: 'Cordially は仕事の手紙の結び。挑発の中身と、かしこまった結びの落差が笑い。',
      trap: '結びの語は中身に合うはず、と思いやすい。言葉の格式と中身の差に注目する。',
      use: 'Cordially, your annoying neighbor.（敬具、迷惑な隣人より）' },

    // why: 4 ← "four teeth" was just heard; 18 ← eight and eighteen share the start, and a weak -teen is easy to add
    { id: 'n1', skill: 'number', level: 'B1', point: 'eight', seg: [19.0, 22.8],
      stem: 'How long ago did April hide the key?',
      choices: ['4 years', '8 years', '18 years'], a: 1, keep: true,
      cue: 'I don’t know のあと、years の前。',
      line: 'I don’t know. It was *eight years* ago.',
      said: '「どこに置いたか分からない。8年前だもの」と言う。',
      mean: 'eight の t は years の前で弱く、「エイ」に近い。',
      trap: '直前に four teeth と聞いているので4に引かれやすい。eighteen なら teen が長く強い。',
      use: 'That was eight years ago!（それ、8年前の話だよ！）' },

    // R fix: V2 (blind 70 %): the fillers (years of training, Ron's permission) are now a misheard "him" and a second
    //   loop
    // why: Ron's scent ← "give him the scent" with "him" heard as Ron; April's memory ← the same circle, but the plan
    //   never needs her to remember
    { id: 'h2', skill: 'humor', level: 'C1', point: 'plan', seg: [26.2, 38.7],
      stem: 'What makes the plan for finding the key funny?',
      choices: ['To work, it needs the very key it’s meant to find', 'To work, it needs Ron to give the dog his scent',
                'To work, it needs April to remember the hiding spot'], a: 0,
      cue: '犬に何をかがせるか、最後の一文。',
      line: 'All we need is Ron’s key to give him the scent. So *give me the key and I’ll get you that key*.',
      said: '「犬に鍵を探させよう。匂いを覚えさせるのにロンの鍵が要る。鍵をくれたら鍵を見つける」と言う。',
      mean: '探している鍵そのものが作戦に必要。本人が気づいていないのが笑い。',
      trap: 'him をロンと取りやすいが犬のこと。材料と目的が同じ物か聞く。',
      use: 'That’s a catch-22.（どうにもならない堂々めぐりだ）' },

    // R fix: V2 (blind 55 %): three "feeling, because…" choices now, each with a reason from the scene
    // why: upset ← Andy's "Don't be mad" makes anger the expected reaction; worried ← April's "lost in a government
    //   building… worst nightmare" just before, put in Ron's mouth
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'puzzle', seg: [46.2, 56.65],
      stem: 'How does Ron take the news that the key is lost?',
      choices: ['Excited, because it’s now a real puzzle', 'Worried, because it’s lost in a public building',
                'Upset, because April broke his trust'], a: 0,
      cue: '「怒らないで」のあと、ロンの最後の一言。',
      line: 'It’s an *impossible puzzle*. And *I love puzzles*.',
      said: '「怒らないで」と言われ、ロンは「解けないパズルだ。パズルは大好きだ」と言う。',
      mean: '鍵をなくされた怒りより、難しい謎への喜びが勝っている。',
      trap: '「怒らないで」や「最悪の悪夢」から怒りや心配を予想しやすい。本人の最後の一言で判断する。',
      use: 'A challenge? I love a challenge.（難題？大好物だよ）' },

    // anchor: 46.7–50.3 s both sources have "she hid it too good": "good" where school grammar wants "well", at speed
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'toogood', seg: [46.2, 50.5],
      stem: 'Type the line: “Don’t be mad, Ron. ___.” (5 words)', answer: 'she hid it too good',
      cue: '「Ron」のすぐあと。文法より、聞こえた語を。',
      line: 'Don’t be mad, Ron. *She hid it too good*.',
      said: '「怒らないで、ロン。隠し方がうますぎたんだ」と、エイプリルをかばう。5語が速く続く。',
      mean: '文法では well だが、会話では good を副詞に使う人も多い。くだけた、子どもっぽい言い方。',
      trap: '習った文法に合わせて well と書きたくなる。書き取りは、正しい文でなく言われた語を書く。',
      use: 'You did good, kid.（よくやったな）' },

    // R fix: V2 (blind 50 %): the two low choices said the same thing, so the odd one out was the key; the scale is now
    //   low / middle / high
    // why: a small bet ← "dollars" vs "donuts": a cheap stake heard as a small bet; coin toss ← a bet heard as a gamble,
    //   50/50
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'donuts', seg: [67.25, 72.6], keep: true,
      stem: 'When the movie ticket is linked to Donna, how sure is the speaker?',
      choices: ['Doubtful, a small bet at best', 'Half sure, like a coin toss',
                'Almost certain, sure to win a bet'], a: 2,
      cue: 'Donna likes のあと、this points の前の言い方。',
      line: 'Donna likes those things. *Dollars to donuts*, this points us her way.',
      said: '「ドナはああいうのが好きだ。賭けてもいい、ドナを指している」と言う。',
      mean: 'Dollars to donuts ＝ ドルをドーナツに賭けてもいい → ほぼ確実。',
      trap: 'donuts が安いので小さな賭けと取りやすい。高い物を安い物に賭けるほど自信がある。',
      use: 'Dollars to donuts, he’s late again.（賭けてもいい、彼はまた遅刻だ）' },

    // R fix: V2 (blind 60 %): the film filler is now a second painkiller choice, told apart by the reason after "from"
    // why: toothache ← "painkillers" and "teeth" heard, but not "out"; a fever ← "teeth" and "hopped up" heard as an
    //   illness
    { id: 'd2', skill: 'detail', level: 'B2', point: 'teeth', seg: [83.5, 91.5],
      stem: 'Why was April so out of it on the day of the movie?',
      choices: ['She was on painkillers after having teeth out', 'She was on painkillers for a bad toothache',
                'She had a fever from an infected tooth'], a: 0,
      cue: 'I saw it with April のあと、from の前後。',
      line: 'She was so *hopped up on painkillers* from getting her *wisdom teeth out*',
      said: '「親知らずを抜いたあとで、痛み止めでかなりぼうっとしてた」と話す。',
      mean: 'hopped up on 〜 ＝ 薬などで興奮した、ぼうっとした状態。くだけた言い方。',
      trap: '痛み止めと歯だけだと歯痛に聞こえる。from のあとの out まで聞く。',
      use: 'I was hopped up on cold medicine.（風邪薬でぼーっとしてた）' },

    // why: 7 ← "seventh time" taken as the count before; 2 ← "the second Twilight film" is the other number heard
    { id: 'n2', skill: 'number', level: 'B2', point: 'seventh', seg: [97.85, 103.55],
      stem: 'Before that night, how many times had Donna seen the film?',
      choices: ['2', '6', '7'], a: 1, keep: true,
      cue: 'I was furious のあと、time の前の語。',
      line: 'You only get to see the second Twilight film *for the seventh time* once.',
      said: '「2作目を7回目に見られるのは一度きりなのに」と怒っている。',
      mean: '7回目だったので、それまでに6回見ていた。同じ映画を何度も見るほど好き。',
      trap: 'seventh をそのまま答えにしやすい。「〜回目」は、それまでの回数より1多い。',
      use: 'This is my third time here.（ここに来るのは3回目です）' },

    // why: didn't ← the final t is lost, and "anything unusual?" invites a no; had made ← past perfect suits "before we
    //   left"; would make ← "would" shrinks to a "d" sound like "did"
    { id: 's1', skill: 'sound', level: 'B2', point: 'didmake', seg: [108.1, 114.2],
      stem: 'Fill the gap: “She ___ a stop by the shoeshine stand…”',
      choices: ['did make', 'didn’t make', 'had made', 'would make'], a: 0,
      cue: 'She のすぐあと、強く言われる短い語。',
      line: 'She *did make* a stop by the shoeshine stand',
      said: '「何か変わったことは？」に「そういえば、靴みがきスタンドに寄った」と答える。',
      mean: '強調の did ＋ 動詞。「確かに〜した」と、思い出したことを強める。',
      trap: 'didn’t の t は消えても n の音が残る。did は強く言われ、思い出した合図になる。',
      use: 'I did lock the door. I’m sure.（鍵はちゃんと閉めたよ。確か）' },

    // R fix: V2 (blind 50 %): the shoes filler was the odd one out; all three choices are now about Andy
    // why: pick up ← "drop something off" heard the other way round; invite ← "before we left" for the film heard as
    //   asking him along
    { id: 'd3', skill: 'detail', level: 'B1', point: 'drop', seg: [108.1, 114.2],
      stem: 'Why did April stop at the shoeshine stand that day?',
      choices: ['To leave something there for Andy', 'To pick up something Andy had left',
                'To ask Andy to come to the film'], a: 0,
      cue: 'because のあと、Andy で終わる部分。',
      line: 'she wanted to *drop something off for Andy*.',
      said: '「出かける前に靴みがきスタンドに寄った。アンディに何か届けたかったから」と話す。',
      mean: 'drop off ＝ 置いていく、届ける。pick up（受け取る）と逆。',
      trap: '受け取りと逆に聞きやすい。because のあと off まで聞いて向きを決める。',
      use: 'Can I drop this off for my sister?（姉にこれを預けてもいいですか）' },

    // R fix: V2 (blind 60 %): three "…, since they're married" choices now; the later-crush filler is gone
    // why: should've told ← "We're married" heard as a complaint about secrets; knew all along ← a married couple
    //   "knows everything"
    { id: 'i2', skill: 'infer', level: 'B2', point: 'married', reveals: ['note2'], seg: [116.25, 123.0],
      stem: 'When April calls the crush embarrassing, what is Andy’s reply pointing out?',
      choices: ['There’s no need for shame, since they’re married',
                'She should’ve told him, since they’re married',
                'He knew all along, since they’re married'], a: 0,
      cue: '「恥ずかしい」のすぐあと、アンディの短い返事。',
      line: 'Oh, babe, you had a crush on me. — That’s embarrassing. — *We’re married.*',
      said: '「僕に片思いしてたんだ」に「恥ずかしい」と返すと、アンディは「結婚してるのに」。',
      mean: '今は夫婦なのだから、昔の片思いを恥ずかしがる理由はない、という指摘。',
      trap: '夫婦なら隠し事はなし、と責めているように聞こえやすい。直前の「恥ずかしい」への返事。',
      use: 'Come on, we’re family!（何言ってるの、家族でしょ）' },

    // R fix: V2 (blind 75 %): "hates him too" was a filler; it's now "okay" read as まあまあ, a real near miss
    // R fix (2): a cold re-read got it at 80 %; "he's weird" is now a second "likes him" that says more than the note
    // why: puts up with him ← "you are okay" read as just acceptable (まあまあ); ask her out ← she likes him, but the
    //   note asks for nothing
    { id: 'i3', skill: 'infer', level: 'C1', point: 'note2', seg: [217.1, 223.2],
      stem: 'What does young April’s note really tell Andy?',
      choices: ['That she likes him, in her own dry way', 'That she puts up with him, and no more',
                'That she likes him, and hopes he’ll ask her out'], a: 0,
      cue: 'but のあとと、最後の短い一文。',
      line: 'I hate people, but *you are okay*. *It’s weird.*',
      said: '昔のメモに「人は嫌い。でもあなたは平気。変なの」とある。',
      mean: '人嫌いの彼女の「平気」は大きな好意。照れ隠しの、そっけない告白。',
      trap: 'okay を「まあまあ」と取りやすい。人嫌いの but のあとの okay は、特別扱いの合図。',
      use: 'I don’t like mornings, but this is okay.（朝は苦手だけど、これは悪くない）' },

    // R fix: V2 (blind 50 %): three short "It … now" choices of one length
    // why: the finish ← "end" heard as the finish line; start over ← "That's it" heard as giving up on this path only
    { id: 'f3', skill: 'phrase', level: 'B1', point: 'deadend', seg: [226.2, 230.0],
      stem: 'After the old note is read, what is said about the search?',
      choices: ['It can’t go any further now', 'It has reached the finish now',
                'It has to start over now'], a: 0,
      cue: 'That’s it のあと、2つの短い文。',
      line: 'That’s it. It’s a *dead end*. *No more clues.*',
      said: '「これで終わり。行き止まり。もう手がかりはない」と言う。',
      mean: 'dead end ＝ 行き止まり。調べ物や仕事が先に進まないときにも使う。',
      trap: 'end から「ゴールに着いた」と取りやすい。No more clues が「先がない」を裏づける。',
      use: 'This job is a dead end.（この仕事は先がない）' },

    // R fix: V2 (blind 55 %): three "Ease her shame by…" choices now, so "comfort" isn't the giveaway
    // why: laughing ← he has just been laughing at her ("That's hilarious"); change the subject ← "I had a big crush"
    //   heard as the start of a new story
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'better', reveals: ['note2'], seg: [233.8, 241.1],
      stem: 'After April’s embarrassment, what is Andy’s next line meant to do?',
      choices: ['Ease her shame by admitting the same thing', 'Ease her shame by laughing it off together',
                'Ease her shame by changing the subject'], a: 0,
      cue: '文の最初の前置きと、最後の too。',
      line: '*If it makes you feel any better*, I had a big crush on you, too.',
      said: '「気が楽になるなら言うけど、僕も君が好きだった」と打ち明ける。',
      mean: 'If it makes you feel any better は慰めの前置き。自分も同じだと明かす。',
      trap: '直前の笑いから、笑い飛ばす流れに聞こえやすい。最後の too が「自分も」。',
      use: 'If it helps, I failed my test too.（慰めになるなら、僕も試験落ちたよ）' },

    // R fix: V2 (blind 65 %): two "Sour, and…" choices now, told apart by whom she blames
    // why: cheery ← "celebrating" and "Great" taken at face value; cross with Ron ← "you trusted me" heard as blame
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'letdown', seg: [245.2, 253.3],
      stem: 'How does April feel as she sums up the day to Ron?',
      choices: ['Sour, and down on herself for failing him', 'Sour, and cross with Ron for trusting her',
                'Cheery, as if failing is no big deal'], a: 0,
      cue: 'celebrating の中身と、最後の一語。',
      line: 'So, I guess we are *celebrating* that you trusted me and *I let you down*. *Great.*',
      said: '「つまり、信じてもらったのに私が裏切ったお祝いね。最高」と言う。',
      mean: 'celebrating と Great は皮肉。失敗した自分への苛立ちを表している。',
      trap: '言葉だけ見ると明るく聞こえやすい。お祝いの中身が失敗なら、皮肉を疑う。',
      use: 'Great. Just what I needed.（最高。まさに欲しかったやつ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'letdown', seg: [249.3, 253.3],
      stem: 'Type what she says: “…that you trusted me and ___.” (4 words)', answer: 'i let you down',
      cue: 'trusted me and のあと、つながる4語。',
      line: 'that you trusted me and *I let you down*.',
      said: '「信じてくれたのに、期待を裏切った」。let you が「レッチュ」に近い。',
      mean: 'let 人 down ＝ 期待を裏切る、がっかりさせる。',
      trap: 'let の t と you がつながり、別の語に聞こえやすい。t ＋ you は「チュ」になりやすい。',
      use: 'I’m sorry I let you down.（がっかりさせてごめん）' },

    // why: 60 ← sixteen/sixty (-teen/-ty); 6 ← only the "six" is caught, and the weak end is lost
    { id: 'n3', skill: 'number', level: 'B1', point: 'locks', seg: [253.3, 261.75],
      stem: 'How often does Ron change his house locks?',
      choices: ['Every 6 days', 'Every 16 days', 'Every 60 days'], a: 1, keep: true,
      cue: 'house locks のあと、days の前の数。',
      line: 'I change my house locks *every 16 days*.',
      said: '「家の錠は16日ごとに替えている」と明かす。',
      mean: 'sixteen は後ろの teen を強く長く言う。sixty なら前の six が強い。',
      trap: '-teen と -ty は聞き分けにくい。強勢が後ろなら teen、前なら ty と覚えておく。',
      use: 'The bus comes every fifteen minutes.（バスは15分ごとに来る）' },

    // R fix: V2 (blind 70 %): three choices about whether the key works, told apart by "since" and the tense. Second
    //   pass (cold re-read 70 %): "anyway" in the key echoed the stem's logic, so it's gone, and all three are short
    // why: next change ← "every 16 days" heard as the key's time running out; new ones ← "after I gave it to you"
    //   heard as him handing her each new key
    { id: 'i4', skill: 'infer', level: 'B2', point: 'useless', seg: [253.3, 261.75],
      stem: 'What does Ron’s news about his locks mean for the lost key?',
      choices: ['It has not worked for years now', 'It works until the next change',
                'It still works on his new locks'], a: 0,
      cue: 'That key で始まる文の、since の前後。',
      line: 'That key has been *useless* since the second Tuesday after I gave it to you.',
      said: '錠は定期的に替えていて、「あの鍵は、渡して2回目の火曜から役に立たない」と言う。',
      mean: 'なくした鍵は、ずっと前から使えない鍵。探す意味は最初からなかった。',
      trap: '16日ごとから「次の交換で」と取りやすい。has been と since はずっと前から。',
      use: 'That coupon’s been useless since May.（そのクーポン、5月から使えないよ）' },

    // R fix: V2 (blind 75 %): the gold filler is now her puzzle (praised in this segment), and "lost trust" is now
    //   "forgives her", which still treats the key as mattering
    // why: forgives ← "I let you down" sets up a forgiving reply; her puzzle ← he praises the puzzle right after
    { id: 'g2', skill: 'gist', level: 'B2', point: 'trust', reveals: ['useless', 'least'], seg: [253.3, 277.0],
      stem: 'What does Ron make clear to April at the end of the search?',
      choices: ['The key never mattered; his trust in her does', 'The key mattered, but he forgives her for it',
                'The key never mattered; her puzzle does'], a: 0,
      cue: 'What matters のあとが本題。',
      line: '*What matters is that I trust you* and admire you as a person.',
      said: '鍵はとっくに使えないと明かし、「大事なのは君を信頼し、尊敬していること」と言う。',
      mean: '鍵の失敗は問題ではない、と言い切り、別れの前に気持ちを伝えている。',
      trap: '「裏切った」のあとなので、許す話を予想しやすい。What matters のあとが本題。',
      use: 'What matters is that you’re safe.（大事なのは君が無事なこと）' },

    // R fix: V2 (blind 55 %): the family filler is now her job (a near reading of "leave")
    // why: a trip ← leave = 出かける; her job ← "leave" heard as quitting, the usual farewell at work
    { id: 'd5', skill: 'detail', level: 'B1', point: 'leave', seg: [266.3, 271.6],
      stem: 'What do we learn about April’s plans from Ron?',
      choices: ['She is moving away from town', 'She is leaving her job at city hall',
                'She is going out of town for a while'], a: 0,
      cue: 'sorry to see you のあと。',
      line: 'I will be *sorry to see you leave this town*.',
      said: '「君がこの町を離れると寂しくなる。理由はたくさんある」と言う。',
      mean: 'sorry to see you leave ＝ 去るのが寂しい。町を離れる話。',
      trap: 'leave だけだと退職や旅行に聞こえやすい。leave this town と、目的語まで聞く。',
      use: 'We’ll be sorry to see you go.（いなくなると寂しくなるよ）' },

    // why: the smallest ← "least" heard without the "not"; the only one ← "not the least of which" heard as narrowing
    //   to one
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'least', seg: [271.6, 277.9],
      stem: 'Among Ron’s many reasons, how does he rank the puzzle?',
      choices: ['As one of the biggest of them', 'As the smallest of them all', 'As the only one that is real'], a: 0,
      cue: 'many reasons のあと、which で終わる言い方。',
      line: 'For many reasons. *Not the least of which* is that you created a puzzle that even I couldn’t solve.',
      said: '「理由は多いが、特に、私でも解けないパズルを作ったことだ」と言う。',
      mean: 'not the least of which ＝ 中でも小さくない → 特に大きな理由。',
      trap: 'least だけ聞くと「いちばん小さい」と取りやすい。not が付けば逆。',
      use: 'Many reasons, not least the price.（理由は多い。特に値段）' },

    // R fix: V2 (blind 65 %): Champion was a weak link back to the opening; it's now the woofing she and Andy trade a
    //   minute before
    // why: private joke ← she and Andy trade "Woof, woof" at 282–286 s; dodging ← her "Or whatever" habit of brushing
    //   things off
    // anchor: 300.3–302.7 s "Woof, woof" (her old sign-off), then "Bark"; 304.7–310.5 s "Why here?" — "Because this tree
    //   reminds me of you": the key is at a tree
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'bark', seg: [285.9, 310.7],
      stem: 'Why does April answer “How’d you remember?” with dog sounds and “Bark”?',
      choices: ['“Bark” took her from a dog’s sound to a tree', 'Barking is still her private joke with Andy',
                'It’s her way of dodging a sincere question'], a: 0,
      cue: '犬の鳴き声の最後の一語と、そのあと出てくる物。',
      line: 'How’d you remember? — Woof, woof. *Bark.* … Because *this tree* reminds me of you.',
      said: 'どう思い出したか聞かれ、「ワンワン。バーク」と答える。鍵は木のそばにあった。',
      mean: 'bark は犬の「ほえ声」と木の「樹皮」の両方。犬の声から木を思い出した、という言葉遊び。',
      trap: '犬の話が続くので、犬に関係する理由を探しやすい。一語だけの答えは、二つの意味を疑う。',
      use: 'Get it? It’s a pun.（分かる？ダジャレだよ）' },

    // R fix: V2 (blind 65 %): the key was the only quirky choice; all three are now "they both…" / tree-shaped. It
    //   reveals nt2's point: "the same tree" gives away where "Bark" leads (a cold re-read used it)
    // why: strong, quiet tree ← her kind words come right before, and sound like proof; a puzzle ← Ron just praised the
    //   puzzle she made
    { id: 'd6', skill: 'detail', level: 'B2', point: 'kinship', reveals: ['bark'], seg: [318.3, 331.65],
      stem: 'What does Ron take as proof of his bond with April?',
      choices: ['They both buried things under the same tree', 'She described him as that strong, quiet tree',
                'They both love a puzzle no one else can solve'], a: 0,
      cue: 'proof のあと、Not で始まる文と次の文。',
      line: '*Not the nice things she said about me*. The fact that I *buried* a large amount of gold *under that same tree*',
      said: '「通じ合う証拠は、ほめ言葉ではない。私も昔、同じ木の下に金を埋めたことだ」と言う。',
      mean: '感動的な言葉より、隠し場所が同じことを絆の証拠にする。ロンらしいずれ。',
      trap: '直前のほめ言葉を証拠と取りやすいが、Not で否定している。Not のあとの本命を聞く。',
      use: 'Not the money. The fact that you came.（お金じゃない。来てくれたことだよ）' },
  ]
};
