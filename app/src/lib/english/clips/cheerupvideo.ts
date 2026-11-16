// “Michael's Cheer Up Video - The Office US” (the official The Office channel, BEST OF SEASON 7): on the day Holly's
// ultimatum to AJ runs out, Michael watches the video he made to calm himself, sorts happy and sad supplies with
// Erin, and tries to find out whether Holly is wearing a ring under her mittens.
// Segments from the captions, words from whisper (2026-11-16); whisper's timings slip from 60 s to 94 s, so the
// captions set every segment there. Talk is sparse after ≈ 178 s (dancing and music). Untested on purpose:
// 46.9–52.3 s and 59.3–64.5 s (the video's joke turns on suicide), 0.2–4.8 s ("live in famously" mangles a phrase
// the clip doesn't explain), 74.8–78.5 s ("bear sad" vs "beer sad"), 103–106.5 s (a role-play whose speakers
// aren't clear), 145.3 s ("put her there" vs "put it there"), 165–172 s (whisper only), 180–183 s (an insult),
// 192–205 s ("breathe" in whisper, "three" in the captions), 208 s on (dancing, crowd).
// REVIEW 2026-11-16: pass 9, fix 14, drop 0, new 0; ear checks 0
// (s1, s2 and x1 came off the ear-check list: both sources agree on the words.)
import type { Clip } from '../types.ts';

export const michaelCheerUp: Clip = {
  id: 'cheerupvideo', video: '5giO6ie0ZV0', title: 'Michael’s Cheer Up Video', dur: 261, wpm: 149, band: 'slow',
  tags: ['職場', '恋愛'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: a nickname ← "otherwise known as" sets up a nickname, and the joke is missed if "Holly" isn't caught;
    //   her full title ← "Holly Partridge Flax" heard as the name that's being shortened, so the joke is the length
    { id: 'h1', skill: 'humor', level: 'C1', point: 'aka', seg: [5.2, 14.6],
      stem: 'Why is the first “otherwise known as…” in the video funny?',
      choices: ['The “other name” is just her first name again', 'The “other name” is a pet name only he uses',
                'The “other name” is longer than her real name'], a: 0,
      cue: '最初の「otherwise known as」のすぐあとの一語。',
      line: 'Holly Partridge Flax, *otherwise known as Holly*, otherwise otherwise known as a living breathing angel',
      said: '「ホリー・パートリッジ・フラックス、またの名をホリー。またの、またの名を天使」と話す。',
      mean: '別名のはずが、ただの名前。大げさな紹介の形と、中身のずれが笑い。',
      trap: '別名と聞くと愛称を待ちやすい。型が予想どおりに埋まらない所に笑いがある。',
      use: 'Bob, otherwise known as the boss.（ボブ、またの名をボス）' },

    // why: thrilled ← "freak out" can mean wild excitement too; embarrassed ← he is watching himself on video, a
    //   common source of shyness
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'freak', seg: [10.95, 18.1],
      stem: 'How does Michael react to the news at the start of his video?',
      choices: ['Rattled and upset by it all', 'Thrilled and excited by it', 'Embarrassed and shy about it'], a: 0,
      cue: '「another man」のあとの、本人の一言。',
      line: 'is engaged to another man. — This is *freaking me out*.',
      said: '動画の自分が「ホリーは婚約した」と言い、見ている本人が「動揺する」と言う。',
      mean: 'freak ～ out ＝ ひどく動揺させる。すぐ「楽しい方の動画に」と言うのもそのしるし。',
      trap: 'freak out は大はしゃぎにも使う。何に対してかで向きを決める。',
      use: 'Heights totally freak me out.（高い所、ほんとに無理）' },

    // why: skip ahead ← "switch to the happy video" heard as the plan he goes with; push the button ← "push" taken
    //   literally, with a video player in the scene
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'push', seg: [17.9, 25.9],
      stem: 'After almost switching videos, what does Michael decide?',
      choices: ['To keep watching, though it’s hard', 'To skip ahead to the happy part',
                'To press the button for the other video'], a: 0,
      cue: '「No, no, no, no」のあと。',
      line: 'let’s just switch to the happy video. Okay. No no no no, *let’s push through*, we’ll do this.',
      said: '「楽しい方の動画にしよう」と言いかけて、「いや、乗りきろう。やるぞ」と言い直す。',
      mean: 'push through ＝ つらくても最後までやり通す。',
      trap: 'push を「ボタンを押す」と取りやすい。through が付くと「突き抜ける、やり通す」。',
      use: 'I’m tired, but let’s push through.（疲れたけど、がんばろう）' },

    // R fix: V2 (blind 50 %): a second loss-of-control reading (falling apart in tears) is now the near miss
    // why: in tears ← "worst day of my life" heard as the only outcome, and the sponge "to soak up my tears" later;
    //   must face Holly ← the day is about her, so "either way" is heard as "either way, he'll see her"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'eitherway', seg: [22.9, 46.6],
      stem: 'According to Michael, why will he need help whatever the news is?',
      choices: ['Either news may make him go wild and wreck things', 'Either news may make him fall apart in tears',
                'Either news means he’ll have to face Holly'], a: 0,
      cue: '「if she’s engaged」と「if she’s not」の二つの結果。',
      said: '「婚約なら暴れる。婚約してなくても、うれしくて燃やすかも」と話す。',
      mean: 'どちらの結果でも、自分が手に負えなくなると分かっている。だから動画を用意した。',
      trap: 'worst day だけだと「悲しい」方に寄りやすい。either way は両方をまとめる。',
      use: 'Either way, I’ll call you tonight.（どっちにしても、今夜電話するね）' },

    // R fix: V2 (blind 60 %): "move in" was a weak next step; "set a wedding date" (the step after proposing) replaces it
    // why: a wedding date ← "proposes" blurred into the usual engagement talk, and "by New Year's" fits a date too;
    //   leave town ← "break up" heard as her leaving
    { id: 'd1', skill: 'detail', level: 'B1', point: 'ultimatum', seg: [25.9, 30.6],
      stem: 'What ultimatum did Holly give AJ?',
      choices: ['Propose by New Year’s, or they break up', 'Set a wedding date by New Year’s, or they break up',
                'Propose by New Year’s, or she’ll move away'], a: 0,
      cue: '「he either」のあと、二つの選択。',
      line: 'he either *proposes by New Year’s* or *they break up*.',
      said: '「新年までにプロポーズするか、別れるか」という最後通告を説明する。',
      mean: 'ultimatum ＝ 最後通告。either A or B で、道は二つだけ。',
      trap: '期限の New Year’s に気を取られ、条件の動詞を聞き落としやすい。',
      use: 'Either you call her, or I will.（君が電話するか、僕がするか）' },

    // why: angry either way ← "burn this whole place to the ground" heard without "out of happiness"; calm if not ←
    //   "if she's not engaged" heard as the good news that settles him
    { id: 'h2', skill: 'humor', level: 'C1', point: 'burn', reveals: ['eitherway'], seg: [30.6, 39.7],
      stem: 'What’s funny about what Michael might do if Holly isn’t engaged?',
      choices: ['His joy would be as wild as his anger', 'His anger would be worse than if she were',
                'His calm would surprise everyone there'], a: 0,
      cue: '最後の「out of」のあと。',
      line: 'if she’s not engaged… I may just *burn this whole place to the ground out of happiness*.',
      said: '「婚約してなかったら、うれしさのあまり、ここを燃やすかも」と言う。',
      mean: 'よい知らせでも、悪い知らせと同じくらい大暴れする。out of ～ ＝ ～のあまり。',
      trap: 'burn だけ聞くと怒りと取りやすい。理由は文の最後の out of のあとに来る。',
      use: 'I almost cried out of joy.（うれしくて泣きそうだった）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'attack', seg: [32.35, 34.9],
      stem: 'Type the words: “and I’m ___ attacking people.” (2 words)', answer: 'gonna start',
      cue: '「and I’m」のすぐあと。',
      line: 'and I’m *gonna start* attacking people.',
      said: '「婚約してたら、おかしくなって、人に襲いかかりはじめる」と言う。',
      mean: 'gonna ＝ going to。start の t は弱く、attacking とつながる。',
      trap: '文法どおり going to と書きたくなる。聞こえた音を書く。',
      use: 'I’m gonna start running again.（またランニング始めるんだ）' },

    // R fix: V2 (blind 70 %): "talk him into it" was the odd one out; a second kind choice (company) replaces it,
    //   and the "look down on" distractor now uses the literal words ("talk down to")
    // why: talk down to him ← "talk down" heard as "talk down to" (見下す); keep him company ← the usual job of a
    //   friend on a hard day
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'talkdown', seg: [39.75, 46.6],
      stem: 'What does Michael say he will need from the video?',
      choices: ['Someone to calm him right down', 'Someone to talk down to him', 'Someone to keep him company'], a: 0,
      cue: '「I am going to need some」のあと。',
      line: 'I am going to need some *talking down*, and nobody *talks me down* like myself in a video…',
      said: '「どちらでも、なだめてもらう必要がある」と言う。',
      mean: 'talk someone down ＝ 興奮している人を言葉で落ち着かせる。',
      trap: 'talk down to なら「見下して話す」。to の有無で意味が変わる。',
      use: 'She talked me down from quitting.（辞めようとした私を彼女がなだめた）' },

    // anchor: 39.8–46.2 s "nobody talks me down like myself in a video talking me down": the best calmer he can name
    //   is himself, on tape; the boast is about him, not about the people around him
    // R fix: V2 (blind 75 %), one C2 rewrite: "who is the joke on" made self-mockery the obvious pick; it now asks
    //   why it gets a laugh, with two brags, and "need some talking down" refutes the second
    // why: a dig at the staff ← "nobody… like" heard as a complaint about others (right mechanism, wrong target);
    //   never needs help ← "myself" heard without "in a video", and the earlier "I am going to need" lost
    // retired: for the draws (play 4 drew no C2 while nt2 was unseen)
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'talkdown', seg: [39.75, 46.6], retired: true,
      stem: 'Why does “nobody talks me down like myself in a video” get a laugh?',
      choices: ['He brags that his best helper is a tape of himself', 'He takes a dig at the staff who never help him',
                'He brags that he never needs anyone to calm him'], a: 0,
      cue: '「like」のあと、比べている相手。',
      line: 'nobody talks me down *like myself in a video* talking me down.',
      said: '「動画の中の自分ほど、自分をうまく落ち着かせる人はいない」と自信たっぷりに言う。',
      mean: '自慢の形で、頼れる相手が録画の自分しかいないと言っている。笑われているのは話している本人。',
      trap: 'nobody… like は他人への不満に聞こえやすい。比べた結果、選ばれたのが誰かを聞くと、本人の話。',
      use: 'Nobody makes pancakes like my dad.（パンケーキは父のが一番）' },

    // R fix: V2 (blind 50 %): the key was the only sound-based choice; all three are now about how it sounded
    // why: too loud ← "Sorry" heard as an apology for tone; sounded like "no" ← the t of "not" is weak, so a
    //   dropped t is the reduction learners expect
    { id: 's1', skill: 'sound', level: 'B2', point: 'snot', seg: [52.35, 59.15],
      stem: 'Why does Michael say “Sorry” after the video says “It’s not”?',
      choices: ['The two words ran together into a new word', 'The t of “not” dropped, so it sounded like “no”',
                'The “not” was so loud it sounded like shouting'], a: 0,
      cue: 'It’s の最後の音と、not の最初の音。',
      line: '*It’s not*. — Sorry, it sounded like you said *it’s snot*.',
      said: '「It’s not」が「it’s snot（鼻水だ）」に聞こえた、と謝る。',
      mean: 'it’s の s が not に移り、「スナット」と一語になる。',
      trap: 'Sorry を態度へのおわびと取りやすい。sounded like ＝「〜に聞こえた」で、音の話。',
      use: 'Sorry, it sounded like you said “nine”.（ごめん、「9」って聞こえた）' },

    // R fix: V2 (blind 80 %): all three are now "Sorting them…", so the scene's happy/sad theme no longer picks
    //   the key
    // why: gifts ← "Chocolates for you", with Erin thanked; keep and toss ← "something to break" heard as clearing
    //   out, the usual sorting script
    { id: 'g2', skill: 'gist', level: 'B2', point: 'sort', seg: [66.2, 92.5],
      stem: 'What are Michael and Erin doing with all the items?',
      choices: ['Sorting them for good news and for bad', 'Sorting them into gifts for Holly and Erin',
                'Sorting them into things to keep and to toss'], a: 0,
      cue: '品物の名前のあと、毎回付く一語。',
      line: 'Champagne: *happy*. Sponge: *sad*…',
      said: 'シャンパンは「うれしい時」、スポンジは「悲しい時」と分けていく。',
      mean: '結果に合わせて、どちらの場合の品も用意している。',
      trap: 'Chocolates for you で贈り物、something to break で片づけと取りやすい。毎回の一語を聞く。',
      use: 'This pile is keep, that one is toss.（こっちは残す、あっちは捨てる）' },

    // why: spilled champagne ← "champagne" is the item just before; cleaning the table ← a sponge's usual job
    { id: 'd2', skill: 'detail', level: 'B1', point: 'sponge', seg: [70, 73.6],
      stem: 'What is the sponge for?',
      choices: ['Soaking up his tears', 'Mopping up champagne', 'Wiping down a table'], a: 0,
      cue: '「Sponge: sad」のあと。',
      line: 'Sponge: sad, *to soak up my tears*.',
      said: '「スポンジは悲しい方。涙を吸いとるため」と言う。',
      mean: 'soak up ＝ 吸いとる。悲しい結果の時に、泣く用の品として用意している。',
      trap: '直前のシャンパンと結びつけて「こぼれたのをふく」と取りやすい。to のあとの目的まで聞く。',
      use: 'Use bread to soak up the sauce.（パンでソースをすくって）' },

    // why: happy pile ← the pattern "item: happy/sad", with "job well done" heard as good news; sad pile ← chocolate
    //   as comfort food
    { id: 'd3', skill: 'detail', level: 'B1', point: 'choc', seg: [80.1, 88.4],
      stem: 'Where do the chocolates go?',
      choices: ['To Erin, as thanks for her help', 'Into the pile for good news', 'Into the pile for bad news'], a: 0,
      cue: '「Chocolates」のあとの二語と、返事。',
      line: '*Chocolates: for you*. Job well done. — Thank you.',
      said: 'それまでは happy / sad に分けていたが、チョコは「君に。よくやった」と渡す。',
      mean: 'for you ＝ あなたに。仕分けではなく、手伝いへのお礼。',
      trap: 'それまでの型で、happy か sad を待ちやすい。型がくずれた所を聞きのがさない。',
      use: 'These are for you. Thanks for everything.（これ、どうぞ。いろいろありがとう）' },

    // R fix: V2 (blind 55 %): "didn't" clashed with "hope"; "won't" (same nasal ending, future) replaces it
    // why: does ← the -n't shrinks to a short nasal before "call"; won't ← the same nasal ending, and "hope" invites
    //   a future
    { id: 's2', skill: 'sound', level: 'B2', point: 'stage', seg: [99.7, 102.8],
      stem: 'Fill the gap: “I hope she ___ call us up on stage.”',
      choices: ['doesn’t', 'does', 'won’t'], a: 0,
      cue: '「she」のすぐあと、短い一語の終わり。',
      line: 'I hope she *doesn’t* call us up on stage. That would suck.',
      said: '「彼女に舞台へ呼ばれませんように。それは最悪」と言う。',
      mean: 'doesn’t の t はほぼ消え、「ダズン」と短い。次の That would suck で向きを確かめる。',
      trap: 't が聞こえず does を選びやすい。最後の「ン」と次の文で聞く。',
      use: 'I hope it doesn’t rain tomorrow.（明日、雨が降りませんように）' },

    // R fix: V2 (blind 60 %): the choices are now parallel ("Upbeat/Worried, …"), with a conditional near miss
    // why: worried ← "biggest mistake of his life" heard as fear for him; only if Holly picks him ← "if Holly chooses
    //   to be with him… so, so happy" heard without "either way"
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'erin', seg: [108.7, 119.3],
      stem: 'How does Erin feel about how Michael’s day will go?',
      choices: ['Upbeat, whatever happens', 'Upbeat, if Holly picks him', 'Worried, whatever happens'], a: 0,
      cue: '最初の文の最後の二語。',
      line: 'I’m really excited for Michael *either way*.',
      said: 'エリンがカメラに「どちらになっても、マイケルのことが楽しみ」と話す。',
      mean: 'either way ＝ どちらでも。結果に関係なく前向き。',
      trap: 'mistake という語に引かれて心配と取りやすい。最初の文で気持ちを言い切っている。',
      use: 'I’m happy for you either way.（どっちでも、よかったね）' },

    // anchor: 110.9–118.6 s "if Holly chooses to be with him, he will be so, so happy. And if not, he'll be avoiding
    //   the biggest mistake of his life": the subject of "avoiding" is "he", so the mistake would be his: Holly
    // why: Holly's loss ← the stock comfort line ("she'll be making the biggest mistake of her life"), the one Erin
    //   means to say (the sincere reading); stop chasing ← "if not… avoiding" heard as advice to Michael
    // retired: one C2 alone is under 2 (nt2 retired)
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'mistake', reveals: ['erin'], seg: [108.7, 119.3], retired: true,
      stem: 'What does Erin’s “and if not…” part actually say about Holly?',
      choices: ['That being with her would be a mistake', 'That she would regret turning him down',
                'That he should stop chasing after her'], a: 0,
      cue: '「avoiding」の主語と、何を避けるのか。',
      line: '*if not, he’ll be avoiding the biggest mistake of his life*.',
      said: 'エリンが「結ばれたら幸せ。そうでなければ、人生最大の失敗を避けられる」と話す。',
      mean: '励ますつもりで、「ホリーと一緒になるのは失敗」と言ってしまっている。本人は気づいていない。',
      trap: 'よくある励まし「彼女が後悔する」に聞こえやすい。主語 he と avoiding を聞くと、失敗は彼の側。',
      use: 'You dodged a bullet there.（危ないところだったね）' },

    // why: tired ← "New Year's Resolution Board" heard as a chore she's stuck with; nervous ← she's the one with the
    //   ultimatum, so her chatter is heard as covering nerves
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'board', seg: [120.5, 127.4],
      stem: 'How does Holly come in?',
      choices: ['Playful, joking about her new board', 'Tired, stuck with a dull new board',
                'Nervous, talking fast to hide it'], a: 0,
      cue: '板を何と呼んで紹介しているか。',
      line: 'I’d like to introduce you to *a new little friend of mine*. His name is New Year’s Resolution Board.',
      said: 'ホリーが「新しい小さなお友だちを紹介するね。名前は新年の抱負ボード」と言って入ってくる。',
      mean: 'ただの板を人のように紹介している。ふざけた明るい登場。',
      trap: '最後通告の日なので緊張と取りやすい。言葉の選び方（friend, his name）で気分を聞く。',
      use: 'Meet my new friend: the coffee machine.（新しい友だちを紹介、コーヒーマシン）' },

    // R fix: V2 (blind 85 %): "warm enough" was a filler; a kind, on-theme reading (calming her on a big day)
    //   replaces it, and the key no longer names the ring
    // why: wants to hire her ← "You're hired" taken as a real job offer; calm her nerves ← the ultimatum day, and a
    //   hand held as comfort
    { id: 'i1', skill: 'infer', level: 'C1', point: 'ring', seg: [136.4, 149.05],
      stem: 'Why does Michael keep asking to feel Holly’s hand?',
      choices: ['To find out what’s under her mitten', 'To start a pretend job interview with her',
                'To calm her nerves on such a big day'], a: 0,
      cue: '何をほめてから、手をさわろうとするか。',
      line: 'Look at those *mittens*… Let me *feel those*… Give me a good, firm one.',
      said: 'ミトンをほめ、「さわらせて」「しっかり握手して」と言い、「いい握手だ、採用」と続ける。',
      mean: '手袋の下に指輪があるか、握手のふりをして確かめようとしている。',
      trap: 'You’re hired から面接ごっこが目的と取りやすいが、口実。最初の関心はミトン。',
      use: 'Let me feel that fabric.（その生地、さわらせて）' },

    // R fix: V2 (blind 50 %): "a real client" is now "ending his act by getting back to real work", a stronger near
    //   miss on the same misreading
    // why: real work ← "the Anderson account" heard as a real client she wants to discuss; a meeting ← "let's get
    //   right into" heard as starting the day's business
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'anderson', seg: [143.2, 152.45],
      stem: 'What is Holly doing when she brings up “the Anderson account”?',
      choices: ['Playing along with his job-interview act', 'Ending his act by getting back to real work',
                'Asking him to start the team meeting'], a: 0,
      cue: '直前の「You’re hired」とのつながり。',
      line: 'You’re hired. — Yes, well, *let’s get right into the Anderson account, shall we?*',
      said: '「採用だ」と言われ、ホリーは「では、さっそくアンダーソンの件に入りましょうか」と返す。',
      mean: '採用されたばかりの新人のふりをして、冗談に乗っている。',
      trap: '取引先の名前が出るので、本当の仕事の話と取りやすい。直前の一言を受けた返しかを聞く。',
      use: 'Yes, sir. Right away, sir.（はい、ただちに）' },

    // R fix: V2 (blind 60 %): i2's "way up" made 90 the only high choice; 80 (same -ty end) replaces 60
    // why: 19 ← -teen/-ty, and 19 °C is a normal room temperature to a Celsius ear; 80 ← "eighty" shares the -ty end
    //   and is just as "way up"
    { id: 'n1', skill: 'number', level: 'B1', point: 'heat', seg: [156.2, 160.95], keep: true,
      stem: 'What temperature does someone offer to set the thermostat to?',
      choices: ['19', '80', '90'], a: 2,
      cue: '「crank the thermostat to」のあと。',
      line: 'Want me to *crank the thermostat to 90*?',
      said: '「暖房を90度まで上げようか」と言う。アメリカなので華氏で、約32℃。',
      mean: 'crank ＝ ぐっと上げる。ninety は最初が強く、最後は短い。',
      trap: '19℃ならふつうの室温なので、意味でも選びやすい。nineteen は後ろの「ティーン」が強く長い。',
      use: 'Can you turn the heat up a bit?（暖房、少し上げてくれる？）' },

    // R fix: V2 (blind 85 %): "keep her warm" was a filler; "take off her coat" (the same move, wrong garment)
    //   replaces it
    // why: her coat ← a hot room makes people shed coats first, and "those" heard without "mittens"; make her leave
    //   ← "smoke her out" taken as driving her out of the room
    { id: 'i2', skill: 'infer', level: 'B2', point: 'mittens', reveals: ['ring'], seg: [156.2, 160.95],
      stem: 'What is the point of turning the heat way up?',
      choices: ['To get Holly to take off her mittens', 'To get Holly to take off her coat',
                'To make Holly leave the office early'], a: 0,
      cue: '最後の文、「She can’t keep」のあと。',
      line: 'Smoke her out? *She can’t keep those mittens on forever*.',
      said: '「暑くしてあぶり出す？ずっとミトンをしてはいられないさ」と提案する。',
      mean: '暑くすればミトンを外す。そうすれば指輪が見える、というねらい。',
      trap: 'smoke out を「追い出す」と取りやすいが、ここは隠れたものを出させること。最後の文が目的。',
      use: 'You can’t hide in there forever.（ずっとそこに隠れてはいられないよ）' },

    // R fix: V2 (blind 60 %): the key was the only two-part answer; the choices now mirror each other, so the last
    //   "Yes" decides
    // why: says yes, means no ← the first "Yes" heard as a reflex, and "No… Stop" as the real answer; a joke ←
    //   "what?" heard as laughing the idea off
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'yesno', seg: [156.2, 163.6],
      stem: 'What does the answer to the thermostat offer show?',
      choices: ['He says no, but his real answer is yes', 'He says yes, but his real answer is no',
                'He says yes, but only as a joke'], a: 0,
      cue: '返事の最初と最後の語。',
      line: '*Yes*. No, what? Stop. *Yes*.',
      said: '暖房の提案に、「うん。いや、何言ってる、やめろ。…うん」と答える。',
      mean: '本音が先に出て、いったん止めるが、結局 yes に戻る。良くないと分かっていても乗りたい。',
      trap: 'No や Stop だけで「反対」と取りやすい。最後に何を言ったかで気持ちが決まる。',
      use: 'No. Well… okay, yes.（だめ。いや…まあ、いいよ）' },

    // R fix: V2 (blind 50 %): all three are now "That everyone knows about…", so the object after "about" decides
    // why: her engagement ← "Congrat…" is heard just before; her new board ← the board she showed off when she came in
    { id: 'd4', skill: 'detail', level: 'B1', point: 'told', seg: [173.2, 178.8],
      stem: 'What does Holly finally figure out?',
      choices: ['That everyone knows about her ultimatum', 'That everyone knows about her engagement',
                'That everyone knows about her new board'], a: 0,
      cue: '「Oh, I get it」のあと。',
      line: 'Oh, I get it. *Everybody knows about the ultimatum*. — Yes, I told everyone.',
      said: 'ホリーが「みんな最後通告のことを知ってるのね」と言い、「みんなに話した」と返る。',
      mean: 'I get it ＝ やっと分かった。周りの妙な態度の理由に気づいた。',
      trap: '直前の Congrat… から「婚約と思われた」と取りやすい。about のあとが答え。',
      use: 'Oh, I get it now. Thanks!（ああ、やっと分かった。ありがとう）' },
  ]
};
