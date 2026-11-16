// “Josh Peck is iCarly's New Manager?! | NickRewind” (NickRewind, Best of iCarly): Freddie is in a chicken suit to
// catch a fox; Carly wants her old producer Paul back on the team, Freddie says no, and Paul turns up anyway. Paul wins
// Freddie over with loaded either/or questions and pitches ideas; a psychic's card reading (the chicken, the fox) ends
// with Freddie's “It's either him or me.”
// Segments from the captions, words from whisper (2026-11-16). Whisper loops “A list of ex-husbands” over 198–219 s,
// so nothing there is used; at 270.6 s the captions' “partly” is whisper's “Carly”. Speakers come from the words:
// Freddie is addressed by name and is the one in the chicken suit; Paul is named by “No, Paul” and “Paul's thing”, and
// the man with “great ideas” is “the man” Freddie must answer; “This is exactly why I didn't want to bring him on”
// (304 s) is Freddie, who refused at 41 s. Untested: who asks “Do you know how I die?” (224.6 s), so a1 doesn't name
// her; the “Pearl bit her lip” words (26.7 s) run together in both sources, and no key rests on them.
// EAR CHECK: 50.0 s c1 — the voice with “Hey, anybody looking for a fox?” is a new man's (Paul's, named only at 75 s)
// REVIEW 2026-11-17: pass 6, fix 18, drop 0, new 0; ear checks 1
// Open: on the cold re-read c2 was still at 60 % (only the key names the brag); the other ≥ 60 % picks came from
//   paired items that never share a draw (c1 now reveals 'gonna', a2 'paid').
import type { Clip } from '../types.ts';

export const paulManager: Clip = {
  id: 'paulmanager', video: '37br8HTmx2g', title: 'Josh Peck is iCarly\'s New Manager?!', dur: 342, wpm: 159,
  band: 'mid', tags: ['職場', 'お願い・断り'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // why: scare off ← fox + chicken suggests keeping a fox away from hens; a show bit ← the iCarly-sketch script
    { id: 'd1', skill: 'detail', level: 'B1', point: 'fox', seg: [18.4, 25.05],
      stem: 'Why is Freddie dressed as a chicken?',
      choices: ['To catch a fox that has been loose for hours', 'To scare off a fox that keeps coming back',
                'To film a fox-and-chicken bit for the show'], a: 0,
      cue: '「The fox」で始まる説明。',
      line: 'The *fox has been loose for hours*, and Freddie *can’t catch him*, so I suggested he try and trick it',
      said: 'キツネが何時間も逃げていて捕まえられないので、鶏のふりでだますよう勧めた、と説明。',
      mean: '鶏の格好は、キツネをおびき寄せる作戦。',
      trap: 'fox と chicken から「追い払う」を想像しやすいが、can’t catch him が目的。',
      use: 'Our dog has been loose for an hour.（うちの犬が1時間も逃げてるの）' },

    // R fix: V2 — blind 55 %: the key was the only choice about Pearl's look; all three are now things Pearl did
    // why: upset ← bit her lip read as worry (唇をかむ = 悔しい・不安); kept asking ← the usual "nagged into it" script,
    //   but he names one cute moment, not repeated asking
    { id: 'i1', skill: 'infer', level: 'B2', point: 'pearl', seg: [24.3, 33.6],
      stem: 'Why did Freddie go along with the plan in the end?',
      choices: ['Pearl made a cute face he couldn’t resist', 'Pearl looked upset, and he felt bad for her',
                'Pearl kept asking until he finally gave in'], a: 0,
      cue: '「Obviously, I said no」のあと。',
      line: 'Obviously, I said no, *but then* Pearl bit her lip in this *really cute way*… It’s cute when she does it.',
      said: '「もちろん断った。でも Pearl がかわいく唇をかんで…」と言い、「あれをやられるとね」。',
      mean: '作戦に納得したのではなく、おねだりに負けた。',
      trap: 'said no のあとの but then で話が変わる。理由は but のあと。',
      use: 'I said no, but then she smiled.（断ったけど、笑顔を見せられて）' },

    // why: asked for help ← "helpful" is said, but as Carly's idea; new ideas ← Paul pitches ideas later, so the
    //   reason seems to be the show's content
    { id: 'd2', skill: 'detail', level: 'B1', point: 'busy', seg: [33.6, 41.25],
      stem: 'What reason does Carly give for bringing in Paul?',
      choices: ['Freddie has been very busy lately', 'Freddie has asked for more help',
                'The show needs new ideas from outside'], a: 0,
      cue: '「talk more about Paul」のあと。',
      line: 'You’ve just been *so busy*, and I think it might really be helpful to have *someone else on the team*.',
      said: '「最近すごく忙しそうだから、チームにもう一人いると助かると思う」と言っている。',
      mean: '理由は Freddie の負担。番組の中身の話ではない。',
      trap: '後で Paul がアイデアを次々出すので「新しい発想」に引かれやすい。ここで言う理由は busy。',
      use: 'You’ve been so busy. Let me help.（すごく忙しそうだね。手伝うよ）' },

    // R fix: V2 — blind 85 %: the Carly/Freddie roles had no mirror; the new distractor swaps them exactly
    // why: Paul doesn't want Freddie ← Paul does the pitching, so he can seem the pushy, unwilling one; roles swapped ←
    //   "I will agree to it" heard without "please don't do Paul's thing", and Carly's "helpful" missed
    { id: 'g1', skill: 'gist', level: 'B2', point: 'conflict', reveals: ['rather'], seg: [33.6, 191.6],
      stem: 'Across the first half of the scene, what is the main tension?',
      choices: ['Freddie doesn’t want Paul on the team, but Carly does',
                'Paul doesn’t want Freddie on the team, but Carly does',
                'Carly doesn’t want Paul on the team, but Freddie does'], a: 0,
      cue: '最初に Paul の話を出すところと、その返事。',
      said: 'Carly は Paul を仲間に入れたい。Freddie は乗り気でないが、Paul のペースで話が進む。',
      mean: '仲間をめぐる引っぱり合いが、この場面の軸。',
      trap: '誰が頼み、誰が断ったかが入れ替わりやすい。最初の頼みと返事で関係をつかむ。',
      use: 'I think we could use another person.（もう一人いてもいいと思う）' },

    // R fix: V2 — blind 70 %: "turns it down" against a yes and a maybe was the expected sitcom move; two of the three
    //   are now kinds of no
    // why: maybe ← the Japanese 「ちょっと…」 frame: a soft no heard as "not yet"; no for now ← Carly's "so busy" just
    //   before, read as his reason and a door left open
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'rather', reveals: ['gonna'], seg: [34, 47.3],
      stem: 'How does Freddie answer Carly’s suggestion?',
      choices: ['A plain no, softened with an apology', 'A no for now, until he is less busy',
                'A maybe: he wants to think it over first'], a: 0,
      cue: '「Honestly」で始まる返事と、Carly の反応。',
      line: '*Honestly, I’d rather not.* I’m sorry. — Oh, shoot.',
      said: '「正直、やめておきたい。ごめん」と答え、Carly は「イエスだと思ったのに」。',
      mean: 'I’d rather not ＝「できれば遠慮したい」。はっきりした断り。',
      trap: '「ちょっと…」のように保留や「今は」と取りやすい。Carly の反応で断りと分かる。',
      use: 'Thanks, but I’d rather not.（ありがとう、でも遠慮しておく）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'rather', seg: [40.75, 43.6],
      stem: 'Type Freddie’s reply: “Honestly, ___. I’m sorry.” (3 words)', answer: 'i\'d rather not',
      cue: '「Honestly」のすぐあと。',
      line: 'Honestly, *I\'d rather not*. I’m sorry.',
      said: '「正直、遠慮したいな。ごめん」と言っている。',
      mean: 'I’d rather not ＝「できればしたくない」と、やわらかく断る定番。',
      trap: 'I’d の d が消えて I rather に聞こえやすい。rather の前には ’d が入る。',
      use: 'I’d rather not say.（それは言わないでおきたい）' },

    // R fix: V2 (C2) — blind 65 %: only the key named Paul, the surprise; the new near misses are two sincere sorrys
    //   (for putting him on the spot, for being hurt). Notes trimmed to ≤ 120
    // why: on the spot ← "sorry too" heard as a polite mirror of his "I'm sorry"; hurt ← the sincerity flip: a "sorry"
    //   back after a refusal heard as a sulk
    // anchor: 46.8–47.4 s "…say yes, so" (the apology follows from expecting a yes); 50.0 s, the next voice: "Hey,
    //   anybody looking for a fox? This guy just loves me." Paul is already here
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'sorry', reveals: ['gonna'], seg: [43.6, 53.6],
      stem: 'When Carly adds “so I’m sorry too”, what isn’t she saying outright?',
      choices: ['That she acted on a yes before he said it', 'That she is sorry for putting him on the spot',
                'That she is hurt he turned her down'], a: 0,
      cue: '「so」のつながりと、次に聞こえる声。',
      line: '…say yes, *so I’m sorry too*. — *Hey, anybody looking for a fox?*',
      said: '「イエスだと思ったから、こっちもごめん」の直後、別の声が入る。',
      mean: 'so は「だから先に動いた」。もう Paul を呼んである、という謝り。',
      trap: '断られたあとの sorry は気づかいや不満にも聞こえる。so と次の声で決める。',
      use: 'I assumed yes, so I already booked it.（イエスだと思って、もう予約しちゃった）' },

    // R fix: V2 — blind 60 %: "you wanted to" was the least natural fit; now "you'd wanna", as natural and a near sound
    // why: weren't ← n't heard in a sentence about a "no"; you'd wanna ← "yuwanna" vs "yuwəgənə", both fit "say yes"
    { id: 's1', skill: 'sound', level: 'B2', point: 'gonna', seg: [44.7, 49.5],
      stem: 'Fill the gap: “I really thought ___ say yes.”',
      choices: ['you were gonna', 'you weren’t gonna', 'you’d wanna'], a: 0,
      cue: '「really thought」のあと、「say yes」の前。',
      line: 'I really thought *you were gonna* say yes',
      said: '「絶対イエスって言うと思ったのに」と言っている。',
      mean: 'you were gonna が「ユワガナ」のようにつながる。were は弱く、ほぼ「ワ」。',
      trap: 'weren’t なら「ン」の音が残る。直前の Oh, shoot（しまった）も、期待が外れた合図。',
      use: 'I thought you were gonna call.（電話くれると思ってた）' },

    // R fix: V2/K5 — blind 50 %: the key alone began "Two people"; all three now say what the speaker means, and the
    //   new near miss reads "either time" as "the first time"
    // why: first time only ← "either time" heard as "the other time"; stealing ← right mechanism, wrong target: "I just
    //   made that joke" is the complaint, but the last line hits both of them
    { id: 'h1', skill: 'humor', level: 'C1', point: 'cluck', seg: [74.9, 88.7],
      stem: 'Why does the line “Funny how I didn’t laugh…” get a laugh?',
      choices: ['The speaker says the pun fell flat both times it was told',
                'The speaker says the pun only worked the first time',
                'The speaker teases one of them for stealing the joke'], a: 0,
      cue: '「joke」のあとの返事と、最後の一言の終わり。',
      line: 'what the cluck… *I just made that joke*… Funny how I didn’t laugh *either time*.',
      said: '同じ鶏のダジャレを二人が言い合い、最後に「どっちの時も笑わなかった」と一言。',
      mean: 'either time ＝ 2回とも。得意げな二人を冷めた一言で落とす。',
      trap: 'Funny how ～ は「～なのは妙だね」という皮肉の型。「面白い」ではない。',
      use: 'Funny how you vanish on cleaning day.（掃除の日に限って消えるのは妙だね）' },

    // R fix: V2 — blind 80 %: "really do" plus two face-value readings left the key alone; the respect reading gives
    //   way to a second hidden move (a veiled threat)
    // why: lets him decide ← the question taken at face value; elsewhere ← "keep them to myself" heard as "take them
    //   somewhere else"
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'trap', seg: [112.2, 126.1],
      stem: 'What does Paul’s question about sharing his ideas really do?',
      choices: ['Leaves Freddie only one answer he can give', 'Lets Freddie decide if he wants to hear them',
                'Hints he’ll take his ideas elsewhere if refused'], a: 0,
      cue: '二択の中身と、そのあとの短い返事。',
      line: 'do you want me to *share those great ideas or just keep them to myself*? — Well, answer the man. — Share.',
      said: '「アイデアを話そうか、黙っておこうか」と聞かれ、Freddie は「話して」と言うしかない。',
      mean: '片方しか選べない二択で「はい」を言わせる手口。',
      trap: 'keep them to myself を「よそへ持っていく」と取りやすい。ありえない二択は誘導。',
      use: 'Want dessert, or are you no fun?（デザート食べる？それともつまらない人？）' },

    // R fix: V2/S1 — blind 50 %: the quoted "already began" set up the perfect-tense comeback; the stem quotes the
    //   reply only
    // why: it's beginning ← 's taken as "is", so a -ing form is expected; it began ← the past form just heard
    { id: 's3', skill: 'sound', level: 'B2', point: 'begun', seg: [126, 130.5],
      stem: 'Fill the gap in the short reply: “Oh, ___.”',
      choices: ['it’s begun', 'it’s beginning', 'it began'], a: 0,
      cue: '「already began」への返事、最後の短い語。',
      line: 'I thought it already began. — Oh, *it’s begun*.',
      said: '「もう始まってると思ってた」「そう、始まったのさ」。',
      mean: 'it’s begun ＝ it has begun。’s は has の短縮。',
      trap: 'it’s を it is と取ると beginning を探しやすい。begun は短く n で終わる。',
      use: 'Relax, the movie’s already begun.（落ち着いて、映画はもう始まってるよ）' },

    // R fix: V2 — blind 55 %: "save money" was the odd one against two kinds of success; now three payoffs of a tour
    // why: crowds ← "on the road" plus a tour pitch, bank missed; make a name ← a near idiom with "make", the fame side
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'bank', seg: [142.9, 148.6],
      stem: 'In Paul’s pitch for a live tour, what does he say podcasters do?',
      choices: ['Earn a lot of money on the road', 'Draw big crowds on the road',
                'Make a name for themselves on the road'], a: 0,
      cue: '「Podcasters」のすぐあと、動詞と短い名詞。',
      line: 'Podcasters *make bank* on the road. Why not you, Carly?',
      said: '「ポッドキャスターはツアーで大もうけ。君もやったら？」と勧める。',
      mean: 'make bank ＝ 大金をかせぐ（くだけた言い方）。',
      trap: 'bank を聞き流すと、人気や知名度の話に聞こえる。make bank で「かせぐ」。make a name とは別。',
      use: 'She makes bank as a nurse.（彼女は看護師でかなりかせいでる）' },

    // why: homesick ← the usual reason not to tour; a TV show ← "watched a Dateline" heard as the thing he'd miss
    { id: 'i3', skill: 'infer', level: 'C1', point: 'tour', seg: [144.3, 154.6],
      stem: 'From the reason given, why won’t Freddie go on tour?',
      choices: ['He is afraid hotel beds are dirty', 'He gets homesick when he travels',
                'He doesn’t want to miss a TV show'], a: 0,
      cue: '「won’t go on tour」の直後の理由。',
      line: 'Freddie won’t go on tour. He *watched a Dateline about hotel sheets*.',
      said: '「Freddie はツアーに行かない。ホテルのシーツを扱った報道番組を見たから」。',
      mean: 'シーツの汚れの特集を見て、ホテルが怖くなった。',
      trap: 'watched と番組名から「番組を見逃したくない」と取りやすい。about のあとが中身。',
      use: 'Saw a show on airplane food. Never again.（機内食の番組を見て、もう無理）' },

    // R fix: V2 — blind 50 %: only the key had a turn; the new near miss is the same turn in the wrong order
    // why: weaker ← "not great" taken at face value (謙遜); brag then modest ← "amazing" remembered, the order lost
    { id: 'h2', skill: 'humor', level: 'C1', point: 'amazing', seg: [156, 160.9],
      stem: 'Why is Paul’s lead-in to his last idea funny?',
      choices: ['It sounds modest, then turns into a brag', 'It admits the idea is weaker than the rest',
                'It sounds like a brag, then turns modest'], a: 0,
      cue: '「not great」のあと、もう一言。',
      line: 'Now my last idea, it’s actually *not great*. *It’s amazing*.',
      said: '「最後のアイデアは、実はすごくない。最高なんだ」と言っている。',
      mean: '「すごくない」で謙遜に見せて、さらに上の言葉で裏返す。自慢の前ふり。',
      trap: '日本語の謙遜の感覚だと not great で止めて聞きやすい。次の一言で意味が反転する。',
      use: 'This isn’t a good deal. It’s a steal.（お買い得どころか、タダ同然）' },

    // R fix: V2 — blind 50 %: "a fight" was a weak reading for a permission ask; now shake = 混ぜる, the order of his
    //   ideas
    // why: mix up the order ← shake = 振って混ぜる, and he is on his "last idea"; wake everyone ← shake someone = 起こす
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'shake', seg: [161.1, 168.5],
      stem: 'Before his last idea, what does Paul ask permission to do?',
      choices: ['Change how things are usually done', 'Mix up the order of his ideas',
                'Wake everyone up and get them moving'], a: 0,
      cue: '「would you guys mind if I just」のあと。',
      line: 'Would you guys mind if I just *shake things up* a little bit',
      said: '「ちょっと流れを変えて、すごいアイデアを出してもいい？」と聞いている。',
      mean: 'shake things up ＝ やり方に変化を起こす。悪い意味ではない。',
      trap: 'shake を「振る・揺さぶる」と取ると、順番を混ぜる話や目覚ましに聞こえる。',
      use: 'Let’s shake things up and eat outside.（気分を変えて外で食べよう）' },

    // R fix: V2 (C2) — blind 80 %: "another influencer" wasn't a move; now a guilt trip, another way to push a yes.
    //   Notes trimmed to ≤ 120, and the use no longer names a distractor
    // why: guilt trip ← "Do you want…" aimed at him sounds like pressure about letting Carly down; big promise ← right
    //   speaker, wrong feature: "greatest episode… in history" sounds like Paul's "greatness"
    // anchor: 117.8–121.2 s Paul's "do you want me to share… or just keep them to myself?" (and 92.2–98.6 s "most
    //   successful… or… a massive failure?"); 182.7–187.3 s the same two-way shape, cut off at "some massive"
    { id: 'c3', skill: 'pragma', level: 'C2', point: 'trap', seg: [180.5, 191.6],
      stem: 'When Freddie begs “Don’t do Paul’s thing”, what move does he mean?',
      choices: ['A question with only one answer he can give', 'A guilt trip about letting Carly down',
                'A big promise that the episode will be great'], a: 0,
      cue: '質問の形と、どこで彼がさえぎるか。',
      line: 'the greatest episode of iCarly in history *or do you want it to just be like some massive*— *Don’t do Paul’s thing.*',
      said: '「史上最高の回にしたい？それとも…」で「Paul のあれはやめて。賛成するから」と止める。',
      mean: '「あれ」は、片方しか選べない二択で賛成させる手口。or の後半で止めている。',
      trap: 'greatest が大げさな約束に聞こえる。止めた位置と、二択の形を聞く。',
      use: 'Don’t do your sad-face thing. I’ll come.（その顔で頼むのはやめて。行くから）' },

    // R fix: V2/K6 — blind 55 %: the key was the only two-step, nuanced choice; all three are now "X at first, then Y"
    // why: eager then scared ← the two lines' order flipped; calm then scared ← "don't tell me" heard as the last word
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'poison', seg: [218.5, 231.6],
      stem: 'After asking “Do you know how I die?”, how does the asker feel?',
      choices: ['Torn at first, then eager to hear it', 'Eager at first, then too scared to hear it',
                'Calm at first, then suddenly scared of it'], a: 0,
      cue: '「don’t tell me」と、そのあとの言い直し。',
      line: 'No, don’t tell me. *No, do tell me.* Is it poison? *I hope it’s poison.*',
      said: '「やっぱり言わないで。いや、言って。毒？毒だといいな」と気が変わる。',
      mean: '怖さと好奇心で揺れたあと、なぜか楽しみにしている。',
      trap: 'don’t tell me だけ聞くと「拒否」に見える。すぐあとの do tell me で向きが変わる。',
      use: 'No, don’t tell me. Okay, tell me.（いや、言わないで。やっぱり教えて）' },

    // why: 7 ← the weak first syllable of "eleven" leaves "-leven ≈ seven"; 20 ← "2023" is the number heard just before
    { id: 'n1', skill: 'number', level: 'B1', point: 'cameras', seg: [235.9, 242.4], keep: true,
      stem: 'How many cameras does the prototype phone have?',
      choices: ['7', '11', '20'], a: 1,
      cue: '「It has, like」のすぐあと。',
      line: 'a prototype of the 2023 Pear phone. It has like *11 cameras*.',
      said: '「2023年モデルの試作品で、カメラが11個くらいある」と自慢している。',
      mean: '数字の前の like は「だいたい」。',
      trap: 'eleven の最初の「イ」が弱いと seven に近づく。直前の 2023 も耳に残りやすい。',
      use: 'It takes like ten minutes.（10分くらいかかるよ）' },

    // why: shy and scared ← chicken = 弱虫 (the English idiom); careful and slow ← "being too busy to do your job"
    //   half heard as slowness
    { id: 'd3', skill: 'detail', level: 'B1', point: 'chickcard', seg: [250.3, 260.9],
      stem: 'What does the chicken card stand for, according to the psychic?',
      choices: ['Being possessive and too busy to do your job', 'Being shy and too scared to try new things',
                'Being careful and too slow to finish your work'], a: 0,
      cue: '「The chicken represents」のあと。',
      line: 'The chicken represents *possessiveness, extreme sensitivity, and being too busy to do your job*.',
      said: '「鶏は、独占欲、ひどく傷つきやすいこと、忙しすぎて仕事ができないこと」と読む。',
      mean: 'possessiveness ＝ 独り占めしたい気持ち。',
      trap: 'chicken には「弱虫」の意味もあるので引かれやすいが、挙がる特徴は別。',
      use: 'He’s too busy to call his mom.（忙しすぎて母親に電話もしない）' },

    // R fix: V2 — blind 85 %: "agree to start over" was the only calm outcome against the scene's rising anger; now a
    //   second escalation (quitting) as the near miss
    // why: set up ← Paul's "I told you it has begun" is read as a confession; quits ← "I cannot work with this guy"
    //   heard without the "either… or" that follows
    { id: 'g2', skill: 'gist', level: 'B2', point: 'reading', reveals: ['paid'], seg: [250.3, 330.6],
      stem: 'How does the psychic’s reading change things between Freddie and Paul?',
      choices: ['It pushes Freddie to say it’s him or Paul', 'It makes Freddie quit the show on the spot',
                'It makes Paul admit that he set it all up'], a: 0,
      cue: '場面の最後に出てくる条件。',
      line: 'I cannot work with this guy, okay? *It’s either him or me.*',
      said: '読みのあと Freddie は「仕込みだ」と怒り、最後に「彼か僕か」と迫る。',
      mean: '占いは仲を取り持つどころか、対立を決定的にした。',
      trap: 'cannot work with this guy だけだと辞める話に聞こえる。either … or は二択。',
      use: 'It’s either me or the cat.（私か猫か、どっちかにして）' },

    // R fix: V2 — blind 70 %: "a fan of Paul's" was weak; now a second way she could "know" (she overheard them)
    // why: paid too much ← "How much did you pay" taken as a price question; overheard ← a reading that hits home
    //   that hard sounds like inside knowledge, and "pay her" is missed
    { id: 'i2', skill: 'infer', level: 'B2', point: 'paid', seg: [261.8, 270.4],
      stem: 'What does Freddie suspect after the chicken card is read?',
      choices: ['That Paul set up the reading to mock him', 'That Paul paid far too much for the reading',
                'That the psychic overheard the two of them'], a: 0,
      cue: '「How much」で始まる問いと、Paul の返事。',
      line: '*How much did you pay her to say this*, Paul? — I don’t know what you’re talking about.',
      said: '「いくら払って言わせたの？」と Paul に聞き、Paul は「何の話？」と答える。',
      mean: '値段ではなく、「仕込んだだろう」という非難。',
      trap: 'How much だけ聞くと料金の話に聞こえる。pay her to ～ は「お金で～させる」。',
      use: 'Did you pay him to say that?（お金で言わせたでしょ）' },

    // R fix: V2/K6 — blind 55 %: the key alone had "but", and "admits and says sorry" was unlike Paul; now a 2 × 2 of
    //   deny/admit and enjoy/worry, all with "and"
    // why: admits and enjoys ← "I told you it has begun" heard as owning up; worried ← "okay?" heard as concern
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'denies', reveals: ['begun', 'paid'], seg: [283.7, 295.6],
      stem: 'After the fox card is read, how does Paul respond to Freddie?',
      choices: ['He denies setting it up, and enjoys the result', 'He admits setting it up, and enjoys the result',
                'He denies setting it up, and worries Freddie’s upset'], a: 0,
      cue: '「okay?」のあとに続く一言。',
      line: 'I did not tell her to say that, okay? *But I told you it has begun.*',
      said: '「言わせたわけじゃない。でも、始まったって言ったろ？」と返している。',
      mean: '否定しながら、but のあとで勝ち誇っている。',
      trap: 'okay? の否定は気づかいに、I told you は白状に聞こえやすい。but のあとに本音が来る。',
      use: 'Didn’t plan it, but I called it.（仕組んでないよ。でも予言はしたよね）' },

    // R fix: V2 (C2) — blind 50 %: "admits the cards meant nothing" overstated the words; the truce reading is now the
    //   literal offer (share the phone). Notes trimmed to ≤ 120
    // why: real truce ← sincerity flip: "start over and use my… phone" taken at face value; calls him the chicken ←
    //   near sound: "you're not the chicken" with the weak "not" lost
    // anchor: 298.6–302.3 s "let's just start over and use my sick Pear phone that only I and Tom Cruise have"; 304.0–
    //   307.4 s Freddie: "He's just trying to make me look bad."
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'truce', seg: [295.6, 307.72],
      stem: 'How does Paul’s “let’s just start over” offer land with Freddie, and why?',
      choices: ['As a dig: Paul ends the peace offer with a brag', 'As a truce: Paul offers to share his new phone',
                'As an insult: Paul calls Freddie the chicken again'], a: 0,
      cue: '仲直りの言葉の最後と、Freddie の次の一言。',
      line: 'let’s just start over and use *my sick Pear phone that only I and Tom Cruise have*. — *He’s just trying to make me look bad.*',
      said: '「やり直そう、僕と Tom Cruise だけの電話で」に、Freddie は「僕を悪く見せたいだけ」。',
      mean: '仲直りの形に自慢を足すので、見下しに聞こえる。',
      trap: '電話を貸す申し出だけなら和解に見える。not は弱いが、鶏とは呼んでいない。',
      use: 'Let’s start over. Lunch is on me.（仕切り直そう。昼はおごるよ）' },

    // R fix: who — "Paul's reply" named a speaker the words don't settle (the psychic is also there)
    { id: 'x2', skill: 'dict', level: 'B2', point: 'chickensay', seg: [325.5, 328.6],
      stem: 'Type the reply: “That’s exactly ___.” (5 words)', answer: 'what a chicken would say',
      cue: '「either him or me」の直後。',
      line: 'That’s exactly *what a chicken would say*.',
      said: '「彼か僕か」に「それこそ鶏が言いそうなことだ」と返している。',
      mean: 'what a ～ would say ＝「～が言いそうなこと」。',
      trap: 'what a がつながって「ワラ」と一語に聞こえ、a を落としやすい。would も短い。',
      use: 'That’s exactly what a liar would say.（それこそ嘘つきの言いそうなこと）' },
  ]
};
