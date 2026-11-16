// REVIEW 2026-11-16: pass 3, fix 16, drop 0, new 0; ear checks 8
// OPEN: f1 ("I could use a challenge. It's getting pretty easy") answers the "trying to score" line, which is left
//   untested as sexual. The chunk is useful and the key is clean, so it stays; drop it if the context is too much.
//   Dropping it would leave no phrase item (minimum 1).
// “Joey Wants Rachel to Stay | Friends” (the official Friends channel, Best of Season 8): Rachel is looking for a new
// place before the baby comes; Joey tries to talk her into staying, and they end up saying how much they'll miss it.
// Segments from the captions, words from whisper (2026-11-16). The "trying to score" line (44.8–49.6 s) is left
// untested (its point is sexual), and so is the "Dutch people" reference (backstory). The captions put "baby" at
// 36.8 s, whisper ends that line at 33.7 s; no item uses 30–37 s.
// EAR CHECK: 0.1 s w1 g1 — the first voice (male) is Joey and "Oh, yeah" is Rachel (assumed; used for all named stems)
// EAR CHECK: 1.5 s w1 — captions "you're looking", whisper "you were looking" (no key depends on it)
// EAR CHECK: 10.5 s x1 — "kind of hoping": "kind of" shrinks to ≈ kinda
// EAR CHECK: 22.8 s s1 — captions "you, you could put it", whisper "you know, you could put it"; "put it" flapped
// EAR CHECK: 54.2 s t1 — Rachel's "It's so sweet…" is sincere, not sarcastic (key rests on tone)
// EAR CHECK: 61.2 s t2 — speaker of "I just… I love living with you so much" unknown (stem doesn't name them); the
//   stammer is emotion, not doubt (key rests on tone)
// EAR CHECK: 78.6 s h2 — speakers of "I'm going to miss you" (captions; whisper "gonna") and "You're the hottest
//   roommate I ever had" unknown (stem doesn't name them)
// EAR CHECK: 44.8 s f1 — who says "imagine bringing home some girl…"? The turns suggest Rachel says it and Joey
//   answers "I could use a challenge" (f1's stem assumes Joey for the answer)
import type { Clip } from '../types.ts';

export const joeyStay: Clip = {
  id: 'joeystay', video: 'MBBUJj1hbZg', title: 'Joey Wants Rachel to Stay', dur: 94, wpm: 189, band: 'fast',
  tags: ['家', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: blind 50 % and right; only the key had a story ("heard it from Ross"). Now all three say how.
    // why: Rachel/Ross ← she is the one moving, so she "should" bring it up; Rachel/ad ← the usual house-hunt script
    { id: 'w1', skill: 'who', level: 'B1', point: 'heard', seg: [0, 3.6],
      stem: 'Who brings up the new place first?',
      choices: ['Rachel, who says she talked to Ross', 'Joey, who says he talked to Ross',
                'Rachel, who says she saw an ad'], a: 1,
      cue: '最初の声と、「Oh, yeah」と答える声。',
      line: 'I was *talking to Ross*, and he said that you’re looking for a new place.',
      said: 'Joey が「Ross と話してたら、部屋を探してるって聞いた」と切り出す。',
      mean: '人から聞いた話として、気になっていたことを持ち出している。',
      trap: '引っ越すのは Rachel なので本人が言い出したと思いやすい。最初の声で判断。',
      use: 'I was talking to Mia, and she said…（Mia と話してたら、言ってたんだけど…）' },

    // R fix: blind 90 %; "night care" was a filler and the key was the only one about the move. Key shortened (C7).
    // why: Ross's place ← Ross is named at the start and "put it" talk follows; help her find one ← "new place" +
    //   "talking to Ross" read as an offer to help
    { id: 'g1', skill: 'gist', level: 'B1', point: 'scene', reveals: ['hoping'], seg: [0, 60],
      stem: 'What are Joey and Rachel mainly talking about?',
      choices: ['Where to put the baby in Ross’s apartment', 'Whether Rachel will move out or stay',
                'Whether Joey can help her find a new place'], a: 1,
      cue: '最初の「new place」と、そのあとの理由の話。',
      said: '部屋を探す Rachel に、Joey が「残ってほしい」と言い、置き場所まで提案する。',
      mean: '赤ちゃんが来る前に出て行くか、ここに残るかの話し合い。',
      trap: 'put it over here が何度も出るが、それは引き止めるための提案。',
      use: 'I’m looking for a new place.（新しい部屋を探してるの）' },

    // why: in with Ross ← Ross is named just before; next door ← "across" heard only as "near"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'where', seg: [2.2, 5.3],
      stem: 'Where does Rachel hope to move?',
      choices: ['In with Ross', 'Right next door', 'Across the street'], a: 2,
      cue: '「Oh, yeah」のあと、「Hopefully」に続く場所。',
      line: 'Oh, yeah. *Hopefully across the street*.',
      said: '「うん。できれば通りの向かいがいい」と答えている。',
      mean: 'hopefully ＝ うまくいけば。across the street ＝ 通りをはさんだ向かい側。',
      trap: '直前の Ross の名と結びつけやすい。across は「となり」ではなく「向こう側」。',
      use: 'There’s a café across the street.（通りの向かいにカフェがあります）' },

    // R fix: blind 60 %; "hard to live with" didn't match "let go". Now a near-sound "let (her in)" reading competes.
    // why: won't let her in ← "let" heard, "go" lost; costs ← the usual apartment-hunt script
    { id: 'i1', skill: 'infer', level: 'C1', point: 'letgo', reveals: ['where'], seg: [4.7, 9.9],
      stem: 'From what Rachel adds, what is the problem with that place?',
      choices: ['The people there won’t let her move in', 'Someone there won’t give it up yet',
                'It costs more than she can pay now'], a: 1,
      cue: '「if」で始まる付け足し。最後の2語の意味。',
      line: 'if certain … people would *just let go*',
      said: '「ある人たちが手放してくれさえすればね」と付け足す。',
      mean: 'let go ＝ 手放す。今の住人がなかなか出て行かない、という不満。',
      trap: 'let だけ聞くと「入れてくれない」に取りやすい。let go で「手放す」。最後の go まで聞く。',
      use: 'You have to let it go.（もう手放さなきゃ）' },

    // R fix: blind 85 %; "asking her to explain" was a filler. Now a literal past-tense reading competes.
    // why: insisting ← "stay" heard as an order; assumed all along ← the past "was hoping" read literally
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'hoping', seg: [9.8, 13.3],
      stem: 'What is Joey doing when he says he was “kind of hoping…”?',
      choices: ['Telling her that she has to stay', 'Saying what he wants, without pushing',
                'Saying he’d assumed all along she’d stay'], a: 1,
      cue: '文の最初の「I was kind of」の働き。',
      line: 'I was *kind of hoping* you’d stay.',
      said: '「ちょっと、いてくれたらなって思ってた」と言う。',
      mean: 'was hoping と kind of で二重にやわらげ、断る余地を残して気持ちを伝える。',
      trap: 'stay だけだと命令に、was だけだと「前から」に聞こえる。kind of はクッション。',
      use: 'I was kind of hoping to leave early.（ちょっと早めに帰れたらなと思って）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'hoping', seg: [9.8, 13.3],
      stem: 'Type what Joey says: “I was ___ you’d stay.” (3 words)', answer: 'kind of hoping',
      cue: '「I was」のすぐあと。短くつながる部分。',
      line: 'I was *kind of hoping* you’d stay.',
      said: '「いてくれたらなと思ってた」と言っている。',
      mean: 'kind of は「カインダ」と一語のように縮まる。of の f はほぼ聞こえない。',
      trap: 'kinda が一つの音に聞こえ、kind を「親切な」と取ることも。ここは「ちょっと」。',
      use: 'I’m kind of tired today.（今日はちょっと疲れてる）' },

    // R fix: blind 85 %; "rather live with Ross" was weak. Now three parallel reasons, all about the baby.
    // why: noisy ← "cry all the time" comes later, moved onto the place; rent ← the usual apartment script
    { id: 'd2', skill: 'detail', level: 'B1', point: 'room', seg: [13, 18],
      stem: 'What reason does Rachel give for having to go?',
      choices: ['Joey’s place is too noisy for a baby', 'There isn’t any space for a baby there',
                'The rent there is too high with a baby'], a: 1,
      cue: '「I have to go」の直後の理由。',
      line: 'Joey, I have to go. *There’s no room for a baby here*.',
      said: '「行かなきゃ。ここには赤ちゃんの場所がないもの」と言う。',
      mean: 'room ＝ ここでは「部屋」ではなく「スペース・余地」。数えない名詞。',
      trap: 'noisy は後の「泣く」の話に引かれた読み。理由は no room の一言。room を聞き取る。',
      use: 'Is there room for one more?（もう一人入れますか）' },

    // R fix: blind 50 % and right; "tiny bedroom" was weak. A teasing reading now competes; key shortened (C7).
    // why: huge ← "this big" without the gesture sounds like "so big"; teasing ← "No room?" echoed back sounds mocking
    { id: 'h1', skill: 'humor', level: 'C1', point: 'big', seg: [16.5, 22.6],
      stem: 'Why does the audience laugh at Joey’s answer to “no room”?',
      choices: ['He is joking that the baby will be huge', 'He is teasing her for overreacting',
                'He thinks size is the only problem'], a: 2,
      cue: '「No room」と聞き返したあと、赤ちゃんの何の話をするか。',
      line: 'No room? It’s a baby. *It’s, like, this big.*',
      said: '「場所がない？赤ちゃんだよ。こんなに小さいじゃん」と言う。',
      mean: '赤ちゃんの問題を大きさだけで考えるずれが笑い。room は生活の余裕も含む。',
      trap: 'this big は手で示す大きさなので、音だけだと「大きい」と取りやすい。',
      use: 'The fish was, like, this big!（魚がこーんなに大きくて！）' },

    // R fix: blind 50 % and right. "put" alone doesn't fit before "over here" and "pick it over here" isn't English,
    //   so it was a two-way pick. Now 3 grammatical choices.
    // why: put that ← the flap blurs "it" into a short "that"; push it ← the vowel and ending sound close
    { id: 's1', skill: 'sound', level: 'B2', point: 'put', seg: [22.3, 25.8],
      stem: 'Fill the gap: “You could ___ over here.”',
      choices: ['put it', 'put that', 'push it'], a: 0,
      cue: '「could」のあと、「over」の直前まで。',
      line: 'you could *put it* over here',
      said: '「ここに置けるよ」と場所を提案している。',
      mean: 'put it の t が母音にはさまれて弾み、「プディッ」のようにつながる。',
      trap: 'put it は弾んでつながり、that や push にも聞こえる。t の弾みと短い it を聞く。',
      use: 'Just put it over there.（そこに置いといて）' },

    // R fix: blind 65 %; the key was the only one that wasn't about a spot. Now a "doesn't like the spots" reading.
    // why: bigger place ← "where you put it" heard as needing more space; spots ← "where you put it" heard, "not
    //   just" missed
    { id: 'i2', skill: 'infer', level: 'B2', point: 'matter', reveals: ['imean', 'put'], seg: [37.3, 43.6],
      stem: 'When Rachel answers Joey’s ideas, what is her point?',
      choices: ['She doesn’t like the spots he picked', 'Where it goes isn’t the real problem',
                'She needs a bigger place for it'], a: 1,
      cue: '「Hey」で始まる返事。「not just」のあとに注目。',
      line: 'it’s *not just a matter of where you put it*. I mean, a baby *changes everything*.',
      said: '「置き場所だけの問題じゃない。赤ちゃんで全部変わるの」と言う。',
      mean: 'not just a matter of ～ ＝ 〜だけの話ではない。',
      trap: 'where you put it だけ拾うと場所の相談に聞こえる。not just がポイント。',
      use: 'It’s not just a matter of money.（お金だけの問題じゃない）' },

    // R fix: blind 80 %; the stem named "I mean", so the textbook gloss won. The stem now names the moment only;
    //   the listener has to catch the marker and what follows.
    // why: takes back ← "I mean" as self-repair; new topic ← "a baby changes everything" heard as a fresh start
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['matter', 'put'], seg: [38.3, 43.6],
      stem: 'Right after “…where you put it”, what does Rachel’s next sentence do?',
      choices: ['Takes back what she just said', 'Puts the same point more broadly', 'Moves on to a new topic'],
      a: 1,
      cue: '「I mean」のあと、前の文より大きい話になるか。',
      line: 'it’s not just a matter of where you put it. *I mean*, a baby changes everything.',
      said: '「場所の問題じゃない。つまり、赤ちゃんで何もかも変わるの」と続ける。',
      mean: 'I mean ＝「つまりね」。前の言葉を、もっと大きくはっきり言い直している。',
      trap: 'I mean は訂正にも使うが、ここは前の文を打ち消していない。同じ方向に広げている。',
      use: 'I mean, it’s your call.（つまり、決めるのは君だよ）' },

    // R fix: blind 60 %; "cost money" was off the scene's track. Now two baby-noise readings compete.
    // why: own room ← "no room" from earlier; up at night ← the night-crying script, close in meaning but not said
    { id: 'd3', skill: 'detail', level: 'B1', point: 'cry', seg: [41.1, 44.8],
      stem: 'What does Rachel say babies do?',
      choices: ['Need their own room', 'Keep you up at night', 'Cry all the time'], a: 2,
      cue: '「changes everything」のすぐあと、短い文。',
      line: 'a baby changes everything. *They cry all the time.*',
      said: '「赤ちゃんはずっと泣くのよ」と言っている。',
      mean: 'They は赤ちゃん一般。all the time ＝ しょっちゅう、いつも。',
      trap: '前の room の話や「夜泣き」の連想に引かれやすい。They のあとの動詞を聞く。',
      use: 'It rains all the time here.（ここはしょっちゅう雨が降る）' },

    // why: use it ← "use" read as 使う (use the baby); challenge her ← challenge = 挑戦する read as "argue with him"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'challenge', seg: [49.5, 53.9],
      stem: 'What does Joey mean by “I could use a challenge”?',
      choices: ['He could use the baby to his advantage', 'He would welcome something harder',
                'He wants her to argue the point'], a: 1,
      cue: '「could use」のあと、「pretty easy」とのつながり。',
      line: '*I could use a challenge.* It’s getting pretty easy.',
      said: '「ちょっと難しいほうがいい。最近楽すぎるし」と返す。',
      mean: 'I could use ～ ＝ 〜があるとありがたい。困るどころか歓迎だ、という強がり。',
      trap: 'use を「使う」と取ると意味が通らない。could use は「ほしい」の決まった言い方。',
      use: 'I could use a coffee.（コーヒーが飲みたいな）' },

    // R fix: blind 85 %; "tells him he's silly" was weak. A Japanese-style "I'll think about it" now competes.
    // why: stays ← "you want me to stay" heard as her agreeing; think about it ← 「考えておくね」, a soft maybe
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'sweet', seg: [53.7, 59.8],
      stem: 'What does Rachel do with “It’s so sweet that you want me to stay”?',
      choices: ['Agrees to stay for a little while', 'Thanks him, and says she’ll think about it',
                'Thanks him, then turns him down'], a: 2,
      cue: '「sweet」の文のあと、「but」に続く部分。',
      line: 'It’s *so sweet* that you want me to stay, *but* I can’t do that to you.',
      said: '「残ってほしいって言ってくれてうれしい。でも、できない」と言う。',
      mean: 'まず気持ちに感謝し、but で断る。やわらかい断り方の型。',
      trap: '「考えておくね」の保留に聞こえやすいが、but のあとの can’t ははっきりした断り。',
      use: 'That’s so sweet, but I can’t.（ありがとう、でも無理なの）' },

    // R fix: blind 85 %; "cold and distant" was weak. A light, amused reading now competes.
    // why: sarcastic ← "so sweet" can be ironic in English; amused ← "so sweet" said to a friend's odd idea
    { id: 't1', skill: 'attitude', level: 'C1', point: 'sweet', seg: [53.7, 59.8],
      stem: 'How does Rachel feel about Joey wanting her to stay?',
      choices: ['Annoyed; she says it with sarcasm', 'Touched; she means it very warmly',
                'Amused; she finds it a bit silly'], a: 1,
      cue: '「sweet」の言い方と、そのあとの理由の中身。',
      line: 'It’s so sweet that you want me to stay… it would *disrupt your entire life*.',
      said: '「うれしい」と言い、断る理由も「あなたの生活を乱しちゃう」と Joey のため。',
      mean: '本当に心を動かされている。皮肉なら理由も冷たくなる。',
      trap: '英語の so sweet は皮肉にも使うので迷いやすい。続く理由が相手思いなら本気。',
      use: 'Aw, that means a lot.（わあ、すごくうれしい）' },

    // R fix: blind 85 %; "changes her mind" was the only other outcome. A compromise now competes; key shortened (C7).
    // why: stays till the baby ← "I love living with you" + "wish things didn't have to change" heard as a deal;
    //   blame ← "I blame Ross" heard as a quarrel
    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', reveals: ['sweet', 'change'], seg: [53.7, 83.1],
      stem: 'Where do things stand at the end of the scene?',
      choices: ['She agrees to stay until the baby comes', 'They argue over whose fault the move is',
                'She is still leaving, and both feel sad'], a: 2,
      cue: '最後の「miss you」まで、引っ越しの予定が変わったか。',
      said: 'Rachel は断ったまま。二人とも寂しさを口にして終わる。',
      mean: '予定は変わらず、別れを受け入れてしんみり終わる場面。',
      trap: 'I love living with you で「残る」と取りやすいが、最後は miss you。予定は変わらない。',
      use: 'I’m really going to miss this place.（この場所、本当に寂しくなる）' },

    // R fix: blind 70 %; "can't say no" was weak. "Hurt his feelings" (do that to you = hurt you) now competes.
    // why: not allowed ← "can't" read as a rule; hurt his feelings ← "do that to you" read as "hurt you", the
    //   leaving taken as the thing she can't do
    { id: 'i3', skill: 'infer', level: 'B2', point: 'dothat', reveals: ['sweet'], seg: [55.5, 59.8],
      stem: 'What does Rachel mean by “I can’t do that to you”?',
      choices: ['She isn’t allowed to stay there anymore', 'She doesn’t want to hurt his feelings',
                'She doesn’t want to be a burden on him'], a: 2,
      cue: '直後の「I mean」から始まる説明。',
      line: 'I can’t *do that to you*. I mean, it would *disrupt your entire life*.',
      said: '「そんなことできない。生活が乱れちゃう」と言う。',
      mean: 'do that to you ＝ そんな迷惑をかける。disrupt ＝ かき乱す。',
      trap: 'do that to you を「傷つける」と取ると逆。that は残ること。I mean のあとを聞く。',
      use: 'I can’t do that to her.（彼女にそんなことできない）' },

    // R fix: blind 80 %; "annoyed" didn't fit the words. An embarrassed reading of the stammer now competes.
    // why: embarrassed ← the stammer read as awkwardness; unsure ← the stammer read as not knowing what to say
    { id: 't2', skill: 'attitude', level: 'B2', point: 'change', seg: [60.8, 69.1],
      stem: 'In “I just… I love living with you so much…”, how does the speaker sound?',
      choices: ['Embarrassed, trying to laugh it off', 'Too moved to get the words out',
                'Unsure what they really want to say'], a: 1,
      cue: '何度も「I just」で止まるところと、そのあとの中身。',
      line: 'I just… I *love living with you so much*. I just, I *wish things didn’t have to change*.',
      said: '「一緒に住むのが本当に好き。変わらなきゃいいのに」と、つまりながら言う。',
      mean: '何度も言いかけて止まるのは、気持ちがいっぱいで言葉が出ないから。',
      trap: '言いよどみは迷いにも聞こえるが、中身ははっきりしている。止まり方と中身をセットで。',
      use: 'I wish we didn’t have to leave.（帰らなくてすめばいいのに）' },

    // R fix: blind 80 %; "living together was hard" was weak. An over-reading ("only looks mattered") now competes;
    //   key shortened (C7).
    // why: other roommates ← "ever had" heard as a dig at the others; only looks ← the compliment read as a confession
    { id: 'h2', skill: 'humor', level: 'C1', point: 'hottest', seg: [78.1, 83.1],
      stem: 'Why does the audience laugh at the very last line?',
      choices: ['It pokes fun at all the other roommates', 'A sad goodbye ends with a remark on looks',
                'It admits looks were all that mattered'], a: 1,
      cue: '「miss you」のあと、ほめ言葉の中身。',
      line: 'I’m going to miss you. — You’re the *hottest roommate* I ever had.',
      said: '「寂しくなる」のあと、「今までで一番イケてるルームメイト」と言う。',
      mean: 'しんみりした別れを、見た目のほめ言葉で軽くしめるずれが笑い。',
      trap: 'hot を本音の告白と取ると重くなる。しんみりした流れを軽く外すのが笑いの形。',
      use: 'Best trip I’ve ever had!（今までで最高の旅！）' }
  ]
};
