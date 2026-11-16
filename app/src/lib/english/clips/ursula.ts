// REVIEW 2026-11-16: pass 7, fix 13, drop 0, new 0; ear checks 0
// REVIEW Q: the guesses at 4–8 s read as Liam Neeson, then Morley Safer (whisper "Weren't we safer", captions
//   "Marley safer"), so the hairdresser is the third guess; h1 and p1 now say "last guess" and don't depend on it.
// “Phoebe Hates Her Sister | Friends” (the official Friends channel, Best of Season 1): the friends tell Phoebe they
// ran into her sister Ursula, and Phoebe explains why the two of them don't talk.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 59 s; whisper's lines after that are a
// loop. Untested: Phoebe's first guess and the replies at 4–8 s (the captions garble them: "Liam n no Marley safer
// NOP"), and "Where were you standing?" at 33 s (an innuendo joke). The captions' word times run late at 29–37 s and
// 52–55 s ("fat", "standing", "day"); segments there follow whisper's.
// EAR CHECK: none (every key rests on words both sources agree on)
import type { Clip } from '../types.ts';

export const ursula: Clip = {
  id: 'ursula', video: 'VP8BgcO7AKY', title: 'Phoebe Hates Her Sister', dur: 70, wpm: 180, band: 'fast',
  tags: ['友だち', '家'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // why: tired ← "guess who" games can feel like a chore, and she stalls with "okay, um"; nervous ← a dread
    //   reading, as if she senses bad news coming
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'fun', seg: [0, 5.6],
      stem: 'How does Phoebe take her friends’ “guess who” question?',
      choices: ['Happy to play the guessing game', 'Tired of being made to guess', 'Nervous about who it might be'], a: 0,
      cue: '質問のすぐあと、最初の短い反応。',
      line: 'Oh, oh, *fun*! Okay, um…',
      said: '「わあ、楽しい！えっと…」と、すぐに当てようとする。',
      mean: 'guess who ～? は当てっこの誘い。fun! と乗って、ゲームとして楽しんでいる。',
      trap: 'okay, um の言いよどみを迷惑や不安と取りやすい。最初の fun が気持ちを決める。',
      use: 'Ooh, fun! Let me guess.（わあ、楽しい！当てさせて）' },

    // R fix: the stem said "second guess", but the hairdresser is her third (after Liam Neeson and Morley Safer)
    // why: right ← "Your sister" comes right after, so the guess can seem to be the answer; disliked ← the clip is
    //   about a sister she dislikes, and that feeling gets pinned on the guess
    { id: 'h1', skill: 'humor', level: 'C1', point: 'guess', seg: [0, 12.4],
      stem: 'Why does Phoebe’s last guess get a laugh?',
      choices: ['She names a nobody as if it were big news', 'She names the right person, but much too early',
                'She names someone she has said she dislikes'], a: 0,
      cue: '2つ目の答えの中身と、その言い方の勢い。',
      line: '*The woman who cuts my hair!*',
      said: '当てっこの最後に「私の髪を切ってる人！」と勢いよく答える。',
      mean: '有名人を当てる流れで、友だちが知らない身近な人を大ニュースのように言う。そのずれが笑い。',
      trap: '直後に正解が出るので当たりに聞こえやすい。答えのあとの反応で、外れかどうかを確かめる。',
      use: 'Is it someone famous?（有名な人？）' },

    // R fix: blind pass 65 % (the key was the only plain report; "call her" was a filler); both distractors are now
    //   Ursula reaching out through them. V5/C3: B1 → B2 (it ties "guess who we saw today" to the name 10 s later),
    //   which also brings B1 down from 35.3 % to 29 %
    // why: say hi ← "she said you guys haven't talked", so Ursula seems to have sent a message; looking for Phoebe ←
    //   "guess who we saw" heard as Ursula turning up at their place
    { id: 'g1', skill: 'gist', level: 'B2', point: 'news', seg: [0, 22.6],
      stem: 'Why do the friends bring up Phoebe’s sister?',
      choices: ['They happened to see her today', 'She asked them to say hi to Phoebe', 'She stopped by to look for Phoebe'],
      a: 0,
      cue: '最初の一言と、名前を言ったあとの説明。',
      line: 'Hey, Phoebs, *guess who we saw today*? … Your sister, Ursula.',
      said: '「今日だれに会ったと思う？」と切り出し、妹のアースラに会ったと伝える。',
      mean: '用事を頼まれたわけではなく、たまたま会ったという報告から話が始まる。',
      trap: '妹の言葉が伝えられるので伝言を頼まれたと思いやすい。話の出発点は「会った」こと。',
      use: 'Guess who I ran into at the airport?（空港でだれに会ったと思う？）' },

    // R fix: "second guess" was the third (see h1); blind pass 50 % ("play a longer game later" was a filler), now an
    //   impatient reading of "this could be a really long game"
    // why: close ← "look" read as a warm-up to a hint (hot/cold); hurry ← the line heard as a complaint that pushes
    //   her to guess faster
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'longgame', seg: [7.7, 14.1],
      stem: 'After Phoebe’s last guess, what does her friend’s reply do?',
      choices: ['It ends the game with the answer', 'It urges her to hurry up and guess',
                'It hints that she is getting close'], a: 0,
      cue: '最後の答えのあと、「look」で始まる返事と次の一言。',
      line: 'Okay, look, *this could be a really long game*. — Your sister, Ursula.',
      said: '「このままだと長いゲームになりそう」と言って、すぐに答えを言う。',
      mean: '当てっこを打ち切る合図。look は「いい？」と話を仕切り直すときの前置き。',
      trap: '「早く当てて」とせかす言葉にも聞こえる。直後に自分で答えを言っていることで判断。',
      use: 'Okay, look, let me just tell you.（いい？もう言っちゃうね）' },

    // why: never heard ← "that place, uh…" sounds like nobody knows the place; went there ← she knows its name, so
    //   she seems to be a regular there
    { id: 'd1', skill: 'detail', level: 'B1', point: 'knew', seg: [14.6, 22.6],
      stem: 'When her friend can’t recall the name of the place, what does Phoebe say?',
      choices: ['She already knows about it', 'She has never heard of it', 'She used to go there a lot'], a: 0,
      cue: '「that place, uh…」のあと、短い返事。',
      line: 'she works over at that place, uh… — Riff’s, *yeah, I know*.',
      said: '妹がある店で働いていると聞き、店の名前を自分で言って「知ってる」と返す。',
      mean: '妹がどこで働いているか、フィービーはもう知っていた。ニュースではなかった。',
      trap: '言いよどむのは友だちの方。名前を出したのはフィービーで、そのあと I know と続く。',
      use: 'Yeah, I know. She told me.（うん、知ってる。聞いたよ）' },

    // R fix: blind pass 55 % (with the title, "weren't in touch" was the only sister choice); a near miss now has the
    //   right topic and the wrong time
    // why: just started ← a new job would explain how nobody could know yet; only lately ← the falling-out is right,
    //   but "in, like, years" is lost under the filler
    { id: 'i1', skill: 'infer', level: 'B2', point: 'oyoudo', reveals: ['knew', 'talked'], seg: [14.6, 22.6],
      stem: 'Why is the friend surprised that Phoebe already knows?',
      choices: ['He’d heard the sisters hadn’t talked for years', 'He’d heard Ursula had only just started there',
                'He’d heard the sisters fell out only lately'], a: 0,
      cue: '「Oh, you do?」のあと、because で始まる理由。',
      line: 'Oh, you do? *Because she said you guys haven’t talked* in, like, years.',
      said: '「え、知ってるの？妹さんが、もう何年も話してないって言ってたから」と返す。',
      mean: '何年も話していない姉が、妹の職場を知っているのが意外だった、という流れ。',
      trap: '働き始めたばかり、最近けんかした、と理由を作りやすい。because のあとの期間を聞く。',
      use: 'Oh, you know? I thought you never talked.（え、知ってるの？話さないと思ってた）' },

    // C2 dict: four weak words, the filler "like" that grammar would delete
    // anchor: 19.6–21.8 s "because she said you guys haven't talked in, like, years" (both sources), 180 wpm
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'talked', seg: [18.5, 22.4],
      stem: 'Type the middle: “she said you guys ___ years.” (4 words)', answer: "haven't talked in like",
      cue: '「you guys」のあと、years の直前まで。つなぎの語も。',
      line: 'she said you guys *haven’t talked in, like,* years.',
      said: '「もう何年も話してないって」。haven’t の t は消え、in と like も弱くひと続き。',
      mean: 'like は期間をぼかすつなぎ。文法上なくても成り立つが、会話では頻繁に入る。',
      trap: '整った文に合わせて like を落としがち。書き取りは聞こえた語をそのまま書く。',
      use: 'It took, like, an hour.（1時間くらいかかったよ）' },

    // why: weeks / months ← "in, like, years": the filler "like" blurs the last word, and the end of "years" is weak
    // R fix: K5: "Years" was the only choice without "A few"; all three are now bare
    { id: 'n1', skill: 'number', level: 'B1', point: 'talked', seg: [18.5, 22.6], keep: true,
      stem: 'According to Ursula, how long is it since the sisters last talked?',
      choices: ['Weeks', 'Months', 'Years'], a: 2,
      cue: '「talked in」のあと、like をはさんだ最後の一語。',
      line: 'you guys haven’t talked in, like, *years*.',
      said: '「あなたたち、もう何年も話してないって」と妹が言っていた、と伝える。',
      mean: 'haven’t talked in years ＝ 何年も話していない。in のあとに期間が来る。',
      trap: 'like がはさまり期間の語が弱くなる。like は「〜くらい」のつなぎ。',
      use: 'I haven’t been there in years.（もう何年も行ってない）' },

    // why: have ← the n't's t drops and leaves a short nasal; hadn't / had ← "she said" (past) pulls toward a past
    //   perfect, and -n't is lost the same way
    { id: 's1', skill: 'sound', level: 'B2', point: 'talked', seg: [18.5, 22.6],
      stem: 'Fill the gap: “she said you guys ___ talked in, like, years.”',
      choices: ['haven’t', 'have', 'hadn’t', 'had'], a: 0,
      cue: 'you guys のすぐあと、短く弱い一語の終わり。',
      line: 'she said you guys *haven’t* talked in, like, years.',
      said: '「何年も話してない」と、妹から聞いたことを伝えている。',
      mean: 'haven’t の t はほぼ消え「ハヴン」で止まる。「ン」が否定のしるし。',
      trap: 'she said の過去形に引かれやすいが、会話では haven’t のままが多い。',
      use: 'We haven’t talked since college.（大学以来話してない）' },

    // why: a little ← a hedged "yes" reading of "not from where…"; couldn't see ← "where I was standing" taken
    //   literally, as a bad view
    { id: 'i2', skill: 'infer', level: 'C1', point: 'standing', seg: [24.8, 32.7],
      stem: 'What is the friend’s answer to Phoebe’s question about her sister?',
      choices: ['No, she looked fine to him', 'Yes, but only a little bit', 'He couldn’t see her well enough'], a: 0,
      cue: '質問のすぐあと、not で始まる返事。',
      line: '*Not from where I was standing.*',
      said: '「僕のいた所からは、そうは見えなかった」と答える。',
      mean: 'from where I was standing ＝ 僕の見た限り。つまり「太ってなかった」という答え。',
      trap: '立っていた場所を文字どおり取ると「よく見えなかった」になる。not が答えの中心。',
      use: 'Not from where I’m sitting.（ここから見る限り、そうでもないよ）' },

    // R fix: blind pass 70 % (the key was the only nuanced choice); "too painful" is now a denial reading of "mostly
    //   just", which is nuanced too
    // why: fine now ← "mostly just…" heard as "it's nothing", i.e. no problem any more; to blame ← "dumb" heard as
    //   aimed at the sister ("dumb sister")
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'dumb', reveals: ['getalong'], seg: [37.0, 47.6],
      stem: 'When asked if the sisters just don’t get along, how does Phoebe answer?',
      choices: ['She plays it down as petty family things', 'She says they get along fine these days',
                'She says her sister is the one to blame'], a: 0,
      cue: '質問のすぐあと、「mostly just」で始まる答え。',
      line: 'It’s *mostly just dumb sister stuff*, you know?',
      said: '「まあ、だいたいは姉妹のくだらないことよ」と答える。',
      mean: 'mostly just で小さく見せる言い方。大したことではない、と話を軽くしている。',
      trap: 'dumb は sister でなく stuff にかかる。軽い言い方は「もう平気」ではない。',
      use: 'It’s just dumb work stuff.（仕事のくだらない話だよ）' },

    // R fix: blind pass 75 % ("got a job Phoebe had wanted" was a filler); a distractor now has the rivalry with the
    //   direction reversed
    // why: copied ← the rivalry is right, but who went first is flipped ("she was the first one"); stopped talking ←
    //   "haven't talked in years" heard as the problem itself, with no reason given
    { id: 'g2', skill: 'gist', level: 'B2', point: 'problem', reveals: ['dumb', 'pretty', 'walkfirst'], seg: [37.0, 59.6],
      stem: 'What is Phoebe’s problem with her sister, as she tells it?',
      choices: ['She always came second in her family’s eyes', 'Her sister stopped talking to her for no reason',
                'Her sister always copied whatever she did'], a: 0,
      cue: '後半、フィービーが挙げる例と、親の反応。',
      said: '妹はいつも「かわいい方」で、先に歩いたのも妹。親も「いつものこと」という反応だった。',
      mean: '一つの事件ではなく、いつも比べられて二番目だったことが不満の中心。',
      trap: '前半の「何年も話してない」を原因と取りやすい。後半の例は、どれも妹が先の話。',
      use: 'I always felt like the second choice.（いつも二番手な気がしてた）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'getalong', seg: [37.9, 40.6],
      stem: 'Type the question: “So, you guys just ___?” (3 words)', answer: "don't get along",
      cue: '「you guys just」のあと、質問の終わりまで。',
      line: 'So, you guys just *don’t get along*?',
      said: '「じゃあ、二人はただ仲が悪いだけ？」と聞いている。',
      mean: 'get along ＝ 仲よくやる。don’t の t は消え、get‿along とつながる。',
      trap: 'get‿along が「ゲラロン」と一語に聞こえる。don’t の「ン」で否定と分かる。',
      use: 'Do you get along with your roommate?（ルームメイトとうまくいってる？）' },

    // R fix: blind pass 60 % ("did something cruel" was a filler); it is now a scope shift onto the first example.
    //   S4: the segment ran 22.6 s; it now stops after the walking story (14.5 s), which holds both examples
    // why: her fault ← "mostly just dumb…" heard as admitting it was something silly she did; envies her looks ← the
    //   first example ("the pretty one") taken as the whole grievance, though the walking story follows
    // anchor: 40.7–54 s "mostly just dumb sister stuff" is followed by small grievances (the pretty one, walking
    //   "later that same day"): none is her own doing, and both are about coming second
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'dumb', reveals: ['pretty', 'walkfirst'], seg: [40.3, 54.8],
      stem: 'With “mostly just dumb sister stuff”, what is Phoebe trying not to say?',
      choices: ['How much it still hurts to come second', 'That the trouble was mostly her own fault',
                'How much she envies her sister’s looks'], a: 0,
      cue: '軽く言ったあと、続けて並べる話の中身。',
      line: 'It’s *mostly just dumb sister stuff*… the pretty one… *the first one to start walking*',
      said: '「くだらないことよ」と言ってから、かわいい方、先に歩いたのも妹、と次々に挙げていく。',
      mean: '軽く言うのは、気にしているのを隠すため。挙げる例はどれも「いつも二番目」の話で、本音はそこにある。',
      trap: '軽い言い方を反省と、最初の例を見た目の話と取りやすい。並ぶ例に共通するもので本音が分かる。',
      use: 'It’s nothing, really. Just old stuff.（なんでもないの。昔の話）', retired: true },

    // R fix: blind pass 60 % ("moves on to a different subject" was weak); a distractor now reads "I mean" as a
    //   softener (a Japanese frame)
    // why: correcting ← "I mean" is often a self-correction; softening ← 「っていうか」 read as toning a remark down,
    //   though what follows is a sharper grievance
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['pretty'], seg: [40.3, 47.6],
      stem: 'Right after “dumb sister stuff, you know?”, what does Phoebe go on to do?',
      choices: ['She starts to give an example of it', 'She takes back what she just said',
                'She softens it so it sounds less harsh'], a: 0,
      cue: '「you know?」のすぐあと、文頭の短い2語。',
      line: '*I mean, like*, everyone always thought of her as the pretty one',
      said: '「つまりね、ほら、みんな妹をかわいい子だと思ってて」と続ける。',
      mean: 'I mean, like ＝「たとえばね」。ぼかした言い方のあとに中身を出す合図。',
      trap: 'I mean は言い直しにも使うが、ここは前の話を取り消していない。具体例が続くかを聞く。',
      use: 'It’s hard. I mean, like, really hard.（大変なの。ほら、本当に大変）' },

    // R fix: blind pass 55 % ("pretty" is the stock sister label); "funny" is now the near sound "witty"
    // why: witty ← the same flapped -tty ending, /r/ lost after p; smart ← the usual "the X one" label for siblings
    { id: 'd2', skill: 'detail', level: 'B1', point: 'pretty', seg: [42.6, 46.6],
      stem: 'What does Phoebe say everyone always thought of her sister?',
      choices: ['That she was the pretty one', 'That she was the witty one', 'That she was the smart one'], a: 0,
      cue: '「thought of her as」のあと。',
      line: 'everyone always thought of her as *the pretty one*',
      said: '「みんな妹を“かわいい方”だと思ってた」と言う。',
      mean: 'think of A as B ＝ AをBと見なす。the pretty one ＝ かわいい方。',
      trap: 'witty と同じく -tty が弾む。p のあとの r を聞く。one があれば「〜な方」。',
      use: 'He’s always been the quiet one.（彼はいつもおとなしい方だった）' },

    // why: talking ← talk/walk differ only in the first sound, and "talked" was heard earlier; dating ← "first one
    //   to" + the sibling-rivalry script (first boyfriend)
    { id: 'd3', skill: 'detail', level: 'B1', point: 'walkfirst', seg: [47.4, 50.6],
      stem: 'What does Phoebe say her sister was the first one to do?',
      choices: ['Start walking', 'Start talking', 'Start dating'], a: 0,
      cue: '「first one to start」のあとの一語。',
      line: 'she was the first one to *start walking*',
      said: '「最初に歩き始めたのは妹だった」と言う。',
      mean: '赤ちゃんのころの話。どちらが先に歩いたかを比べている。',
      trap: 'walking と talking は最初の音だけの差。直前の talked の記憶に引かれやすい。',
      use: 'She was the first one to say yes.（最初にOKしたのは彼女だった）' },

    // R fix: blind pass 60 % ("resents losing that race" was the only charged choice); the key is plainer now
    // why: laugh about it ← the audience laughs, so she seems to be joking about herself; proud ← "later that same
    //   day" heard as boasting how fast she caught up
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'walking', reveals: ['walkfirst'], seg: [47.4, 54.8],
      stem: 'How does Phoebe feel about the walking story now?',
      choices: ['She still minds that she came second', 'She can laugh about it all now',
                'She is proud she caught up so fast'], a: 0,
      cue: '「even though」のあと、自分がいつ歩いたかの言い方。',
      line: 'she was the first one to start walking, *even though I did it later that same day*.',
      said: '「最初に歩いたのは妹。私だってその日のうちに歩いたのに」と言う。',
      mean: '数時間の差を言い返すのは、今も気にしている証拠。even though に悔しさが出る。',
      trap: '笑いが起きるので笑い話や自慢にも聞こえる。言い返す口調がこだわりのしるし。',
      use: 'Even though I got there five minutes later!（5分遅れただけなのに！）' },

    // R fix: blind pass 55 % (only the key named a concrete, funny detail); the distractors are now as concrete
    // why: parents ← they did brush her off ("what else is new"), the last thing said, so the jab seems aimed at
    //   them; sister ← "the first one" and "the pretty one" make the sister sound like a show-off
    // anchor: 50.6–54 s "even though I did it later that same day": the gap she still argues over is hours, and the
    //   laugh comes there, before the parents are mentioned
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'walking', reveals: ['walkfirst'], seg: [47.4, 59.6],
      stem: 'In Phoebe’s walking story, who is the joke on?',
      choices: ['Phoebe, for minding a gap of a few hours', 'Her parents, for shrugging at a first step',
                'Her sister, for showing off even as a baby'], a: 0,
      cue: '「even though」のあと、差がどれだけだったか。',
      line: '*even though I did it later that same day*. But to my parents…',
      said: '妹が先に歩いた、私も同じ日のうちに歩いたのに、と言い、親の反応に話が移る。',
      mean: '自分では不公平を訴えているつもりで、その日のうちの差に今もこだわる自分を笑わせている。笑いは親の話の前に来る。',
      trap: '最後に出た親を的と取りやすい。笑いの起きた位置と、本人が言い張っている差の小ささを聞く。',
      use: 'I was only one minute late!（たった1分の遅刻だよ！）' },

    // R fix: K6/V2 (blind 55 %): the key was the only two-part choice ("Nothing special; …"); all three are now one
    //   clause each
    // why: don't believe ← "yeah, right" is the usual sarcastic "I don't believe you"; what else ← "what else is
    //   new" taken literally, as a real question about her other skills
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'whatelse', seg: [54.7, 60.4],
      stem: 'When Phoebe acts out her parents’ reaction, what are they saying?',
      choices: ['It was old news after her sister', 'They doubted she could really walk',
                'They asked what else she could do'], a: 0,
      cue: '「to my parents」のあと、親のまねの最後の部分。',
      line: 'it was like, “*Yeah, right, well, what else is new?*”',
      said: '親は「はいはい、ほかに何か？」という反応だった、と話す。',
      mean: 'what else is new ＝ 珍しくもない。妹が先にやったので親は驚かない。',
      trap: 'yeah, right は「信じない」、what else は質問に聞こえやすい。親の慣れで判断。',
      use: 'He’s late again? What else is new.（また遅刻？いつものことだね）' },
  ]
};
