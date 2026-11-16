// “How to Get Out of an Awkward Situation - The Office US” (the official Office channel, BEST OF SEASON 4): locked in
// after hours, the staff hunt for the night guard's number and name, get him on the phone, fret about the Christmas tip
// they never paid, and Toby ends the night with a sudden announcement and a hop over the fence.
// Segments from the captions, words from whisper (2026-11-16). Left out on purpose: the overlapping name guesses
// (22–32 s, nothing keys on them), the "African-American guy" stumble (41–45 s, inside h2/c1/i2's segments but never
// asked about), the "better couple" show of hands (75–87 s, speakers unclear), the football/knee stretch (94–145 s:
// visual, whisper invents lines there) and the "get your boss laid Saturday" aside (121–134 s). Whisper's timings are
// rounded to whole seconds, so every segment comes from the captions.
// REVIEW 2026-11-16: pass 6, fix 15, drop 0, new 0; ear checks 1
// REVIEW: c2, s1 and x2's ear checks went (both transcripts agree on "did you not", "should", "neither did I").
// EAR CHECK: 63.2 s r1 — the cut falls before "Sorry, guys…"; captions "I don't think I chipped in for last year's",
//   whisper "…I tipped him for last year's" (the key, an admission about last year's tip, holds either way)
import type { Clip } from '../types.ts';

export const officeLock: Clip = {
  id: 'officelock', video: 's_EHezMKD7Q', title: 'How to Get Out of an Awkward Situation  - The Office US', dur: 199,
  wpm: 177, band: 'fast', tags: ['職場', '電話'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 — the title ("get out") plus two odd distractors gave the key away (blind 90 %); now all three are
    //   ways out through the guard.
    // why: talk through ← a phone call heard as the guard giving directions; someone with a key ← "Hank is going to
    //      come down" missed, a guard heard as passing the job on
    { id: 'g1', skill: 'gist', level: 'B1', point: 'aim', seg: [0, 58.3],
      stem: 'What are all these phone calls meant to achieve?',
      choices: ['Getting the guard to come and unlock the doors', 'Getting the guard to talk them through a way out',
                'Getting the guard to call someone with a key'], a: 0,
      cue: '電話がつながったあと、Jim がまとめる一言。',
      said: '警備員の番号と名前を探し、電話で呼び出す。最後に「来て出してくれる」とまとめる。',
      mean: '目的は閉じ込められた建物から出ること。名前探しはそのための手段。',
      trap: '名前やチップの話が目立つが、それは途中の話。最後のまとめで目的を確かめる。',
      use: 'Could you come let us out?（来て開けてもらえますか）' },

    // R fix: V2 — "rings at the desk" was the only specific choice (blind 65 %); now each choice names where it rings.
    // why: old ← a useless number read as one that no longer works; boss ← "the number" heard as someone else's
    { id: 'i1', skill: 'infer', level: 'B2', point: 'deskno', seg: [0, 3.6],
      stem: 'Why is the first phone number no use to them?',
      choices: ['It only rings in the building they’re in', 'It’s the guard’s old number, no longer used',
                'It’s his boss’s line, and no one picks up'], a: 0,
      cue: '文の最後の短い一語が、どこを指すか。',
      line: 'I told you I have the number *that rings here*.',
      said: '「言ったでしょ、持ってるのはここで鳴る番号だけ」と答える。',
      mean: 'here ＝ 今いる建物。誰もいない警備デスクにかけても、出る人はいない。',
      trap: '役に立たない番号は「古い番号」と思いやすい。場所を表す here を聞き取る。',
      use: 'That number just rings here.（その番号はここにつながるだけ）' },

    // R fix: V2 — "Glad his odd little habit paid off" was the only warm, nuanced choice (blind 55 %); now three
    //   plain feelings.
    // why: annoyed ← "a waste of time" is said; embarrassed ← "It's so random that I have it" heard as awkwardness
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'worth', seg: [8.4, 15.9],
      stem: 'How does Toby feel about having the number?',
      choices: ['Pleased it turned out worth the effort', 'Annoyed that it took so long to find',
                'Embarrassed to have the guard’s number'], a: 0,
      cue: '「a waste of time」のあとの but に注目。',
      line: 'I thought it might be *a waste of time*, *but I guess it was worth it*.',
      said: '「入れたときは時間のむだかと思ったけど、やってよかったみたい」と言う。',
      mean: 'but のあとが今の気持ち。役に立ててうれしい、という小さな満足。',
      trap: 'waste of time が耳に残ると後悔に聞こえる。but のあとに本音が来る。',
      use: 'It was a long wait, but worth it.（長く待ったけど、その価値はあった）' },

    // why: cell ← "home" missed, and a guard's number is usually his cell; desk ← the first number, "rings here"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'home', seg: [12, 20.1],
      stem: 'Which of the guard’s numbers does Toby turn out to have?',
      choices: ['His home number', 'His cell number', 'His desk number'], a: 0,
      cue: '「It’s under here as」のあとの最後の一語。',
      line: 'It’s under here as *security guard home*.',
      said: '電話帳に「警備員・自宅」という名前で入っていたと言う。',
      mean: 'home ＝ 自宅の番号。夜で家にいるので、これならつながる。',
      trap: '最後の home は短く弱い。登録名の最後の語が、どの番号かを決める。',
      use: 'Do you have his home number?（彼の自宅の番号ある？）' },

    // anchor: 17.9–18.9 s both transcripts: "did you not get his name"; the three weak words run together before "get"
    { id: 'c2', skill: 'dict', level: 'C2', point: 'noname', seg: [17.4, 19.5],
      stem: 'Type the question: “___ get his name?” (3 words)', answer: 'did you not',
      cue: '「security guard home」のすぐあと。聞こえた音のまま。',
      line: '*Did you not* get his name?',
      said: '「彼の名前、入れてなかったの？」と聞く。3語が弱く「ディジュナッ」とひと続き。',
      mean: 'Did you not は Didn’t you より驚きが強い言い方。「まさか入れなかったの？」に近い。',
      trap: '習った Didn’t you に直したくなる。not が後ろにあるのを、音のまま書く。',
      use: 'Did you not see my text?（私のメッセージ、見てないの？）' },

    // R fix: V2 — the key's "to avoid a name" spelled out the joke (blind 75 %); now three plain descriptions.
    // why: forgot ← "from, um, where you work" read as Jim losing his own company's name; wrong man ← "who I got
    //      here?" read as Jim unsure who answered
    { id: 'h2', skill: 'humor', level: 'C1', point: 'jimcall', seg: [33, 47.9],
      stem: 'Why does Jim’s call get more laughs the longer it goes?',
      choices: ['He describes the guard to the guard himself', 'He can’t recall the name of his own company',
                'He thinks he’s reached the wrong man at first'], a: 0,
      cue: '「from, um」のあと、相手をどう呼んでいるか。',
      line: 'This is Jim Halpert from, um, *where you work*. You are *the guy who sits behind the desk*.',
      said: '「えー、あなたの職場のJimです。デスクに座ってる人で…」と続ける。',
      mean: '名前を知らないので、本人に本人の説明をしている。つかえるほど気まずさが増す。',
      trap: 'where you work を「会社名を忘れた」と取りやすい。you が誰を指すかを追う。',
      use: 'Sorry, remind me of your name?（ごめん、お名前もう一度いい？）' },

    // R fix: V2 + S4 — "never bothered to learn his name" was the only choice with a motive (blind 75 %); the seg ran
    //   17.9 s and now ends after "who I got here?" (14.95 s). Choices now share the "X: because…" form.
    // why: the guard ← he's the one being described ("the guy who sits behind the desk"); the coworkers ← their wrong
    //      guesses just before the call
    // anchor: 33.5–47.4 s every stumble is Jim's: "from, um, where you work", "you're, you're the…", "who I got here?";
    //         he never had the name the guesses failed to give him
    { id: 'c1', skill: 'humor', level: 'C2', point: 'jimcall', reveals: ['hank'], seg: [33, 47.95],
      stem: 'In Jim’s call to the guard, who is the joke on?',
      choices: ['Jim: he’s stuck without the man’s name', 'The guard: he’s the one being described',
                'The coworkers: their guesses were wrong'], a: 0,
      cue: '言葉につまっているのは誰か。',
      line: 'This is Jim Halpert from, um, *where you work*… you’re, uh, *who I got here*?',
      said: '名前が出てこず、「あなたの職場の」「デスクの人」と言いつなぎ、最後は本人に名前を聞き出す。',
      mean: '笑われているのは、毎日会う人の名前を知らなかった Jim のほう。気まずさが本人に返っている。',
      trap: '説明されている警備員が笑いの的に見えやすい。つかえ、言い直しているのが誰かを追う。',
      use: 'I’m so sorry, I’m terrible with names.（ごめん、名前を覚えるのが苦手で）' },
    // R fix: V2 — "fishes for it" was the only knowing phrasing (blind 50 %); now three plain ways he hears it.
    // why: coworker ← "Hank" was one of the guesses in the room a few seconds earlier; phone ← Toby's number did come
    //      from his phone, but it had no name ("Did you not get his name? — No.")
    { id: 'i2', skill: 'infer', level: 'C1', point: 'hank', seg: [41.9, 50.9],
      stem: 'How does Jim finally learn the guard’s name?',
      choices: ['The guard tells him when Jim asks who he is', 'A coworker calls it out to him mid-call',
                'He reads it off Toby’s phone just in time'], a: 0,
      cue: '言葉につまったあとの短い問いと、すぐあとのお礼。',
      line: 'I mean, you’re, uh, *who I got here*? — Oh, *thank you, Hank*.',
      said: '「えっと、あなたは…どなたでしたっけ？」と聞き、すぐ「ありがとう、Hank」と呼ぶ。',
      mean: '遠回しに名前を聞き出し、相手が名乗ったのですぐ使った。',
      trap: '部屋でも Hank という声は出ていたが、当たりとは決まらなかった。電話の直後に呼んでいる。',
      use: 'And you are…?（失礼ですが、お名前は…？）' },

    // R fix: V2 — "got us out of a jam" was the only idiomatic, everyday reading (blind 50 %); now three plain
    //   paraphrases.
    // why: danger ← "lifesaver" read literally (命の恩人); always ← "you are" heard as a habit
    { id: 'ph1', skill: 'phrase', level: 'B1', point: 'lifesaver', reveals: ['hank'], seg: [47.5, 52.35],
      stem: 'At the end of the call, what is Jim telling the guard?',
      choices: ['You’re really helping us out here', 'You’ve saved us from real danger',
                'You’re always the one who saves us'], a: 0,
      cue: 'お礼のあと、相手を何にたとえているか。',
      line: 'Oh, thank you, Hank. *You are a lifesaver*, Hank.',
      said: '「ありがとう、Hank。本当に助かるよ」とお礼を言う。',
      mean: 'lifesaver ＝ 困ったときに助けてくれる人。命までは関係ない、日常のお礼。',
      trap: 'life を「命」と取ると大げさに聞こえる。日常の「助かった！」として使う。',
      use: 'Thanks for the ride. You’re a lifesaver.（送ってくれてありがとう、助かった）' },

    // why: half hour ← "under" heard as a small amount; over an hour ← "under" missed; two hours ← "an hour" heard as
    //      "two hours"
    { id: 'n1', skill: 'number', level: 'B1', point: 'hour', seg: [52, 58.3],
      stem: 'How long did the guard say it would take him?',
      choices: ['About half an hour', 'Just under an hour', 'A little over an hour', 'Just under two hours'], a: 1,
      keep: true,
      cue: '「he said」のあと、時間の前の小さな語。',
      line: 'he said it should be *just under an hour*',
      said: 'Hank が来て出してくれる。「1時間弱かかる」と言っていたと伝える。',
      mean: 'just under an hour ＝ 1時間弱。over なら1時間を超える。',
      trap: 'under と over は弱く短い。時間の前の小さな語で、前後どちらかが決まる。',
      use: 'It’s just under an hour by train.（電車で1時間弱です）' },

    // why: would ← the same shape, softer; could ← a guess, not his estimate; will ← the full form learners expect
    { id: 's1', skill: 'sound', level: 'B2', point: 'should', reveals: ['hour'], seg: [52, 58.3],
      stem: 'Fill the gap: “He said it ___ just under an hour.”',
      choices: ['should be', 'would be', 'could be', 'will be'], a: 0,
      cue: '「said it」のすぐあと、弱く短い音。',
      line: 'he said it *should be* just under an hour',
      said: '「1時間弱のはずだって」と伝える。should は弱く「シュド」より短い。',
      mean: 'should be ＝ 〜のはず。見込みを伝える言い方で、約束ではない。',
      trap: 'should / would / could は最初の子音で聞き分ける。sh の音を拾う。',
      use: 'It should be ready by noon.（お昼までにはできるはず）' },

    // predict: the segment stops before "Sorry, guys"; then plays the confession and "Jim was supposed to collect it"
    // R fix: V2 — "a complaint that the guard is so slow" was off-topic (blind 60 %); now three tip replies.
    // why: chip in more ← the stock follow-up to "let's give a big tip"; how much ← the practical next question
    { id: 'r1', skill: 'predict', level: 'B2', point: 'tip', seg: [59, 63.2], then: [63.2, 70.4],
      stem: 'After the idea of a big Christmas tip, what kind of reply comes next?',
      choices: ['An admission about last year’s tip', 'A promise to chip in more this year',
                'A question about how much to give'], a: 0,
      cue: '大きなチップの話。去年はどうだった？',
      line: 'give him a big tip this Christmas. — *Sorry, guys, but I don’t think I* chipped in for last year’s.',
      said: '「チップをはずもう」に「去年のは払ってない気がする」と返る。',
      mean: 'Sorry, guys, but で始まると、言いにくい告白が来る合図になる。',
      trap: '賛成や相談が続くのが普通の流れだが、ここは過去の告白。Sorry, but は言いにくい話の前置き。',
      use: 'Sorry, guys, but I forgot the tickets.（みんなごめん、チケット忘れた）' },

    // R fix: V2 — the key's "Nobody… last Christmas" was the only on-topic choice (blind 65 %); B now builds on a
    //   plausible mood of the guard rather than a figure from n1.
    // why: annoyed ← a late-night call heard as a grumpy guard; rude ← Jim's clumsy call just before
    { id: 'i3', skill: 'infer', level: 'B2', point: 'never', reveals: ['tip'], seg: [63, 75.72],
      stem: 'Why do they suddenly fear the guard won’t come at all?',
      choices: ['He never got a tip from them last year', 'He sounded annoyed at being called',
                'Jim was rude to him on the phone'], a: 0,
      cue: '去年の話のあと、誰かが「Jim が…」と言う。',
      line: 'I don’t think I chipped in for last year’s… *he’s never gonna come*.',
      said: '去年のチップは誰も出していなかった。集める係は Jim だった。それで「絶対来ないよ」となる。',
      mean: 'お礼をしていない相手に、夜中の手助けを頼んでいる。だから来ないと思った。',
      trap: '電話のぎこちなさも気になるが、話の流れはお金。直前の2行をつなげて読む。',
      use: 'We never thanked him properly.（ちゃんとお礼してなかった）' },

    // R fix: V2 — "The guard's boss's" was a filler (blind 55 %); now Pam, who is in the scene.
    // why: Toby ← he's the one who found the number; Pam ← she's in the room, and the question is who'd organize it
    { id: 'd3', skill: 'detail', level: 'B1', point: 'collect', reveals: ['tip'], seg: [63, 70.6],
      stem: 'Whose job was it to gather last year’s tip?',
      choices: ['Jim’s', 'Pam’s', 'Toby’s'], a: 0,
      cue: '「neither did I」のあと、人の名前と動詞。',
      line: '*Jim was supposed to collect it*.',
      said: '「チップを集めるのは Jim のはずだった」と言う。',
      mean: 'was supposed to ＝ 〜するはずだった（でもしなかった）。',
      trap: 'Toby は番号で目立った人。名前のあとの was supposed to が誰の役目かを示す。',
      use: 'I was supposed to call him back.（彼に折り返すはずだったのに）' },

    // why: nor ← same meaning, a more formal word; so ← the opposite (they did pay), with the same rhythm
    { id: 'x2', skill: 'dict', level: 'B2', point: 'neither', reveals: ['tip', 'never'], seg: [66.2, 68.4],
      stem: 'Type the reply: “Yeah, ___.” (3 words)', answer: 'neither did i',
      cue: '去年のチップの告白のすぐあと。',
      line: 'Yeah, *neither did I*.',
      said: '「うん、私も払ってない」と続く。did I がつながり「ディダイ」に近い。',
      mean: 'neither did I ＝ 否定に「私も」と合わせる形。',
      trap: 'neither の頭が弱く either に聞こえやすい。否定への同意は neither。',
      use: 'I didn’t sleep much. — Neither did I.（あまり寝てない—私も）' },

    // R fix: V2 — "not doing his job" echoed the line just before and stood out (blind 55 %); now three uses of the
    //   phrase in matching form.
    // why: thanks ← "way to go" is praise, and Jim just got Hank to come; cheer up ← a light tone read as kind teasing
    { id: 't1', skill: 'attitude', level: 'C1', point: 'wayto', reveals: ['tip', 'never', 'collect'], seg: [67.6, 75.72],
      stem: 'When someone says “Way to go, man”, how is it meant?',
      choices: ['As a dig at Jim for dropping the ball', 'As thanks to Jim for getting Hank to come',
                'As a light joke to cheer Jim up a bit'], a: 0,
      cue: '直前の「Jim was supposed to…」とのつながり。',
      line: 'Jim was supposed to collect it. — Yep. — *Way to go, man*.',
      said: '集め係が Jim だったと分かり、「さすがだね」と言う。直後に「来るわけない」が続く。',
      mean: 'ほめ言葉の形の皮肉。失敗が分かった直後なので「よくやってくれたね」の逆。',
      trap: '電話の成功をほめたと取りやすい。ほめ言葉は直前の話題と合わせて聞く。',
      use: 'Great job locking us out.（締め出してくれて、どうもね）' },

    // R fix: V2 + S4 — "Takes him up on the lesson" was easy to strike (blind 50 %); now "rather watch". The seg now
    //   runs to 96.0 s so "Yeah, Pam! Hit me up!" (she plays) is inside it.
    // why: watch ← the Japanese frame: declining the lesson heard as declining to play; never ← "I know how to" heard
    //      as "I don't know how to"
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'football', seg: [86.4, 96],
      stem: 'When the offer to teach her to throw comes, what does her reply do?',
      choices: ['Turns down the lesson, not the game', 'Says she’d rather watch than play',
                'Admits she’s never thrown one before'], a: 0,
      cue: '返事の最初の2語。know の前に何かある？',
      line: 'I could teach you to throw. — *I know how to throw a football*.',
      said: '「投げ方を教えてあげる」に、「投げ方なら知ってる」と返す。',
      mean: '遊びには乗るが、教わる必要はないと伝えている。やんわりした断り。',
      trap: 'I know と I don’t know は弱く聞こえやすい。don’t の「ン」があるかで決める。',
      use: 'Thanks, but I know how to drive stick.（ありがとう、でもマニュアル運転できるよ）' },

    // R fix: V2 — the key was the only clever reading (blind 55 %); now three "He blames… for his being slow", one per
    //   thing named in the line or the scene.
    // why: socks ← "my damn socks" heard as the thing he blames; tip ← the earlier worry that he won't bother
    { id: 'h3', skill: 'humor', level: 'C1', point: 'socks', reveals: ['tip'], seg: [108.3, 120],
      stem: 'Why does the guard’s line about his socks get a laugh?',
      choices: ['He blames their calls for his being slow', 'He blames his socks for his being slow',
                'He blames the tip for his being slow'], a: 0,
      cue: '急かされた返事の、so I can のあと。',
      line: 'Please hurry. — *Stop calling me so I can put on my damn socks*.',
      said: '「急いで」と言われ、「電話をやめろ、靴下がはけない」と返す。',
      mean: '急かす電話そのものが彼を遅らせている。頼む側が自分で邪魔をしている。',
      trap: '最後の socks が耳に残ると、靴下のせいに聞こえる。so I can は「〜できるように」。',
      use: 'Let me finish so I can help you.（終わらせたら手伝えるから）' },

    // R fix: V2 — the distractors were exits nobody would pick (blind 70 %); now all three start with news and differ
    //   in how he goes.
    // why: waits ← the group is waiting for Hank, the usual script; quits + gate ← "moving" heard as leaving the job,
    //      and the gate is the normal way out
    { id: 'g2', skill: 'gist', level: 'B2', point: 'leave', reveals: ['fence'], seg: [144.8, 165.2],
      stem: 'How does the coworker with an announcement leave the group?',
      choices: ['He says he’s moving away, then hops the fence', 'He says he’s moving away, then waits for Hank',
                'He says he’s quitting, then walks out the gate'], a: 0,
      cue: '発表のあと、「So」で始まる最後の一文。',
      said: '「話がある」と切り出し、遠くへ引っ越すと発表する。そして柵を越えて走って帰ると言う。',
      mean: 'みんなが警備員を待つ中、一人だけ自分の足で出ていく。',
      trap: '発表のあとに別れの場面を思い描きやすい。最後の一文が、どう帰るかを言う。',
      use: 'I have an announcement to make.（みんなに発表があります）' },

    // R fix: V2 — "earlier tonight" and "a new job" were weak (blind 50 %); now three "He's thought about it…".
    // why: tonight ← the sudden feel of the announcement; not sure ← "thought about it" heard as still thinking
    { id: 'd2', skill: 'detail', level: 'B1', point: 'longtime', seg: [148.9, 159.2],
      stem: 'What does he say about his decision to move?',
      choices: ['He’s thought about it for a long time', 'He’s thought about it only since tonight',
                'He’s thought about it, but isn’t sure yet'], a: 0,
      cue: '行き先のあと、「thought about it」に続く語。',
      line: 'I am moving to Costa Rica. *Thought about it for a long time now*.',
      said: '「コスタリカに引っ越す。ずっと考えていた。ついに実行する」と言う。',
      mean: 'for a long time ＝ 長いあいだ。急な思いつきではない、と本人は言っている。',
      trap: '突然の発表なので今決めたと思いやすい。言っている言葉どおりに答える。',
      use: 'I’ve thought about it for a long time.（ずっと考えてきたことなんだ）' },

    // why: around ← "hop" missed, so he walks to the gate; through ← "hop" heard as getting past it some other way
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'fence', seg: [159.9, 165.2],
      stem: 'How is he planning to get out?',
      choices: ['By climbing quickly over the fence', 'By walking around the fence to a gate',
                'By squeezing through a gap in the fence'], a: 0,
      cue: '「the fence」の前の短い動詞。',
      line: 'I’m just gonna *hop the fence* and jog home now.',
      said: '「じゃあ柵を越えて、走って帰るよ」と言う。',
      mean: 'hop ＝ ひょいと越える。hop the fence ＝ 柵をさっと乗りこえる。',
      trap: 'hop を「片足で跳ぶ」と覚えていると迷う。物の名前の前の hop は「越える」。',
      use: 'Let’s hop on the next bus.（次のバスにさっと乗ろう）' },

  ]
};
