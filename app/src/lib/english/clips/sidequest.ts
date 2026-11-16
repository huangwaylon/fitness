// REVIEW 2026-11-16: pass 12, fix 12, drop 0, new 0; ear checks 1 (i2's dropped: its line, 182.2 s, agrees in both)
// OPEN: who says "Piece of cake" / "I'll do that, too" (Ann or Leslie) isn't settled by the words; h1 avoids naming anyone.
// “April and Andy go on a side quest for a marriage license | Parks and Recreation” (the official Parks and Recreation
// channel, Season 5): Leslie's friends split up the jobs for a same-day wedding; the dress isn't done, the rings are
// missing, and April and Andy wake up a clerk at home to sign the license.
// Segments from the captions, words from whisper (2026-11-16). The captions drop most of 100–113 s ("No time for verbs")
// and whisper has no "Andy" at 173.9 s; nothing is built on either stretch. The grandma/date lines at 128–135 s are left
// out on purpose (innuendo).
// EAR CHECK: 153.1 s a3 — "Fine." should sound reluctant (whisper adds "Cool. OK, we love you, grandma" after it; the
// captions stop at "okay")
import type { Clip } from '../types.ts';

export const sideQuest: Clip = {
  id: 'sidequest', video: '7qhNXPBbiKA', title: 'April and Andy go on a side quest for a marriage license', dur: 217,
  wpm: 187, band: 'fast', tags: ['恋愛', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: the title gives away "wedding", so only the key fit; distractors now also split jobs for a wedding (V2/K5)
    // why: next week ← weddings are planned ahead, if "today is the real thing" is missed; rehearsing ← "drill" and "go over" read as a practice run
    { id: 'g1', skill: 'gist', level: 'B1', point: 'duties', seg: [3.4, 38.2],
      stem: 'What is the group doing in the first scene?',
      choices: ['Splitting up the jobs for a wedding today', 'Splitting up the jobs for a wedding next week',
                'Rehearsing who does what at the wedding'], a: 0,
      cue: '最初の「let’s go over」と、そのあと次々に出る仕事。',
      line: 'OK, let’s go over the *duties* right now.',
      said: 'ドレス、髪、ケーキ、指輪、許可証と、結婚式に要るものを一人ずつ受け持つ。',
      mean: 'duties ＝ 担当の仕事。今日の式の役割分担。',
      trap: 'drill で予行演習、準備の話で先の式と取りやすい。「today is the real thing」が決め手。',
      use: 'Okay, let’s split up the jobs.（よし、役割を分けよう）' },

    // R fix: "suddenly" in the stem ruled out "next on the list" for a blind reader; now neutral (V2/S1)
    // why: next on the list ← she is going through a list of jobs; cake job ← "piece of cake" + "cake" heard as her bidding for the easy job
    { id: 'h1', skill: 'humor', level: 'C1', point: 'cake', seg: [5.4, 16.7],
      stem: 'Why does the wedding cake come up at this point?',
      choices: ['Her idiom for “easy” reminds them of it', 'It was simply the next job on the list',
                'She hints she would rather take the cake job'], a: 0,
      cue: 'ドレスの係を受けたときの短い返事と、直後の「Oh」。',
      line: '*Piece of cake.* — *Oh*, we have to get the *wedding cake*.',
      said: '「楽勝よ」と答えると、相手が「あ、ケーキも要る」と思い出し、それも頼む。',
      mean: 'piece of cake ＝ 簡単。cake という語が本物のケーキを思い出させた。',
      trap: '仕事の一覧の途中なので、順番どおりと取りやすい。Oh は急に思い出した合図。',
      use: 'That’s a piece of cake.（そんなの楽勝だよ）' },

    // R fix: choices weren't parallel and only the key was upbeat; all three now "They were…" (V2/K5)
    // why: tougher ← "every crazy thing" sounds like a complaint; dreads ← tiring demands, if "perfectly calm" is missed
    { id: 'i1', skill: 'infer', level: 'C1', point: 'drill', reveals: ['duties'], seg: [16.0, 29.5],
      stem: 'In her talk to camera, how does she link Leslie’s old demands to today?',
      choices: ['They were practice for a day like today', 'They were tougher than today will be',
                'They were so draining she dreads today'], a: 0,
      cue: '「drill」の前後と、その次の「today」。',
      line: 'every crazy thing Leslie’s ever had me do has been like a *drill*, and today is the *real thing*.',
      said: 'むちゃな頼みは全部訓練で、今日が本番。だから準備はできている、と言う。',
      mean: 'drill ＝ 訓練。苦労が今日のための訓練だったと前向きに言う。',
      trap: 'crazy で愚痴に聞こえやすいが、すぐ「I’m ready」と続く。前置きのあとの結論を聞く。',
      use: 'This time it’s the real thing.（今度は本番だ）' },

    // why: barely knows ← "I got a guy" is the usual "I know someone" script; wife quit ← "my wife" + "work there" in the wrong relation
    { id: 'h2', skill: 'humor', level: 'C1', point: 'cityhall', seg: [33.9, 40.2],
      stem: 'Why does his City Hall contact idea get a laugh?',
      choices: ['He forgot he works at City Hall too', 'His “guy” is someone he barely knows',
                'His wife has just quit her job there'], a: 0,
      cue: '「that’s my wife」のあとの指摘と、本人の短い返事。',
      line: 'I got a guy that works at City Hall. That guy’s my wife. — Um, *you also work there*. — *Oh, yeah*.',
      said: '市役所の知り合いは妻だと言うが、「あなたもそこで働いてる」と言われ「そうだった」。',
      mean: 'わざわざ知り合いに頼む必要がない人が、得意げに人脈を語っている。',
      trap: 'I got a guy は「つてがある」の決まり文句。Oh, yeah は「忘れてた」の返事。',
      use: 'I know a guy who can help.（助けてくれそうな知り合いがいるよ）' },

    // R fix: key was the only sensible choice; all three now "Do it all now, …" (V2/K5)
    // why: wipe the records ← "system" read as a computer system (katakana システム); no cop can stop him ← "cop tomorrow" + "tonight" in the wrong relation
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'system', reveals: ['crimes'], seg: [39.9, 46.0],
      stem: 'What does he mean by the last few words of his plan for tonight?',
      choices: ['Do it all now, so the urge is gone later', 'Do it all now, then wipe it from the records',
                'Do it all now, while no cop can stop him'], a: 0,
      cue: '「tonight」のあと、最後のひとまとまり。',
      line: 'I better commit as many crimes as possible tonight, *get it out of my system*.',
      said: '明日から警官なので、今夜のうちに悪いことをやっておく、と言う。',
      mean: 'get it out of my system ＝ 気が済むまでやって、やりたい気持ちを出し切る。',
      trap: 'system をパソコンの記録と取りやすいが、自分の中の話。捕まる話でもない。',
      use: 'Go on, get it out of your system.（気が済むまでやりなよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'crimes', seg: [42.6, 46.0],
      stem: 'Type what he says: “I guess I better ___ tonight.” (6 words)', answer: 'commit as many crimes as possible',
      cue: '「better」のあと、「tonight」の前まで。',
      line: 'I guess I better *commit as many crimes as possible* tonight',
      said: '「今夜のうちに罪をたくさん犯しておかないと」。',
      mean: 'as many ～ as possible ＝ できるだけ多くの～。as は弱く短い。',
      trap: 'as many が「アズメニ」、crimes as も「クライムザズ」とつながり、切れ目が消える。',
      use: 'Try to see as many sights as possible.（できるだけ多くの名所を見て）' },

    // R fix: "Leslie told them" was weak; now other couples taking their date, a keyword trap on "anyone else… married" (V2)
    // why: spares ← the forging problem later makes "extra copies" sound sensible; their date ← "anyone else in this town to get married" in the wrong relation
    { id: 'd3', skill: 'detail', level: 'B1', point: 'takeall', seg: [45.5, 54.1],
      stem: 'At City Hall, why does she want every last license?',
      choices: ['Other weddings would make theirs less special', 'Other couples might take their wedding date',
                'They need spares in case one gets spoiled'], a: 0,
      cue: '「anyone else」のあと、because の後ろ。',
      line: 'I don’t want anyone else in this town to get married because it makes it *less special for us*.',
      said: '町のほかの人に結婚してほしくない。特別感が減るから、と言う。',
      mean: '理由は because のあとにそのまま言っている。わがままな理屈が笑いどころ。',
      trap: '予備がほしい、という普通の理由を想像しやすい。because の後ろをそのまま聞く。',
      use: 'Too many people make it less special.（人が多いとありがたみが減る）' },

    // why: phone Leslie ← "call" read as a phone call; trouble ← the usual partner who warns them off the plan
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'goodcall', seg: [49.4, 55.1],
      stem: 'How does her partner answer her plan?',
      choices: ['He tells her it is a smart choice', 'He says he’ll phone Leslie about it',
                'He warns they could get in trouble'], a: 0,
      cue: '彼女の理由のすぐあと、短い3語の返事。',
      line: '*Good call*, babe. Let’s roll.',
      said: '「いい判断だね」と言い、「さあ行こう」と続ける。',
      mean: 'good call ＝ いい判断・正解。審判の判定（call）から来た言い方。',
      trap: 'call を電話と取ると、だれかに電話する話に聞こえる。判断をほめる決まり文句。',
      use: 'Good call on the restaurant.（あの店にしたのは正解だね）' },

    // why: days ← the usual "a few days early"; weeks ← "three" caught, the unit lost in fast speech
    { id: 'n1', skill: 'number', level: 'B1', point: 'early', seg: [59.8, 65.7], keep: true,
      stem: 'How early does she think the dress should have been finished?',
      choices: ['three days', 'three weeks', 'three months'], a: 2,
      cue: '「finish something」のすぐあと、early の前。',
      line: 'If you’re not going to finish something *three months early*, then don’t accept the job.',
      said: '「3か月前に仕上げる気がないなら、仕事を受けるな」と怒っている。',
      mean: '普通は「期限までに」で十分。3か月も前を求めるのが無茶で笑いになる。',
      trap: 'three はよく聞こえるが、単位が速く流れる。months は「マンス」と短い。',
      use: 'We finished three days early.（3日早く終わった）' },

    // R fix: "used to … can" clashed in tense, so grammar ruled it out; now "has to", same meaning, different sound (V2); the cue no
    // longer says "There's", which only two choices had
    // why: going to ← "got to" and "gonna" both shrink to a two-beat sound; has to ← same meaning, "There's g-" heard as "There h-"
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotta', seg: [65.1, 68.25],
      stem: 'Fill the gap: “___ something we can do.”',
      choices: ['There’s got to be', 'There’s going to be', 'There has to be'], a: 0,
      cue: '文の頭、There のあとの短い音。',
      line: '*There’s got to be* something we can do.',
      said: '「何かできることがあるはず」と言っている。',
      mean: 'got to が「ガッタ」と縮む。has got to be ＝ きっと～があるはず。',
      trap: 'going to も「ゴナ」と縮む。has to なら s が聞こえる。ガッタの t の弾みで聞き分ける。',
      use: 'There’s got to be a way.（何か方法があるはず）' },

    // R fix: key was the only one with a purpose; all three now "She's …ing" moves (V2/K5)
    // why: only magic ← the question read as giving up; a dress like hers ← Cinderella's dress heard as the thing she wants
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'cinder', seg: [68.2, 74.38],
      stem: 'Why does she bring up how Cinderella got her dress done?',
      choices: ['She’s hoping the story gives them an idea', 'She’s joking that only magic could help now',
                'She’s wishing for a dress like Cinderella’s'], a: 0,
      cue: '答えのあとの「That’s not」で始まる一言。',
      line: '*Now*, how did Cinderella finish her dress so fast? — Squirrels and birds. — *That’s not very helpful*.',
      said: '「シンデレラはどうやって早く仕上げた？」と聞き、「リスと鳥」と言われて「役に立たない」と返す。',
      mean: '本気でヒントを探す問い。だから答えが使えないと不満を言う。',
      trap: 'あきらめの冗談と取りやすいが、Now で考え始め、答えの役立ち度を気にしている。',
      use: 'How did you do it so fast?（どうやってそんなに早くできたの？）' },

    // why: filed tonight ← "office" + the night-time rush; couple sign ← a license is usually signed by the couple
    { id: 'd4', skill: 'detail', level: 'B1', point: 'sign', seg: [74.4, 81.75],
      stem: 'Just after they say the license is done, what problem comes up?',
      choices: ['Someone at the clerk’s office must sign it', 'It must be filed at the clerk’s office tonight',
                'The couple must sign it in front of a clerk'], a: 0,
      cue: '「Wait a minute, hold on」のあと。',
      line: 'It needs to be *signed by somebody at the city clerk’s office*.',
      said: '「市の書記官室のだれかのサインが要る」と気づく。偽造すると言い出す。',
      mean: 'needs to be signed by ～ ＝ ～のサインが必要。だれが署名するかが要点。',
      trap: '結婚許可証は二人が書くもの、という知識で選びやすい。by のあとの人を聞く。',
      use: 'Does this need to be signed?（これ、サインが必要ですか）' },

    // R fix: traffic choice was one-part and had no clip word; now "stuck behind roadblocks" (V2/K6)
    // why: roadblocks ← "roadblocks" read literally (they are driving around); small delays ← "a few" and "kind of" read as minor
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'roadblock', seg: [87.2, 94.1],
      stem: 'When told no rings were found, how does she sum up the day?',
      choices: ['Problem after problem, and it may all collapse', 'Stuck behind roadblocks, so they may be late',
                'A few small delays, but nothing serious'], a: 0,
      cue: '「Yeah」で始まる返事の、後半の文。',
      line: 'we’re having a few *roadblocks* here. It kind of feels like this thing is *falling apart*.',
      said: '「壁にぶつかってる。全部だめになりそう」と言う。',
      mean: 'roadblock ＝ 物事を止める障害。falling apart ＝ 崩れていく。',
      trap: 'a few や kind of で軽い話に聞こえやすいが、falling apart まで聞くと深刻。',
      use: 'We hit a few roadblocks.（いくつか壁にぶつかった）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'wake', seg: [113.9, 116.5],
      stem: 'Type what’s said: “I hope we ___.” (4 words)', answer: "didn't wake you up",
      cue: '「I hope we」のあと、短い4語。',
      line: 'I hope we *didn’t wake you up*.',
      said: '「起こしてないといいけど」と、夜に家を訪ねて言う。',
      mean: 'didn’t の t はほぼ消え、wake you も「ウェイキュ」とつながる。',
      trap: 'didn’t の最後が消えるので did に聞こえやすい。否定は「ン」の鼻の音で分かる。',
      use: 'Sorry, did I wake you up?（ごめん、起こしちゃった？）' },

    // why: one ← "for four" runs together, so only one number seems said; ten ← "10 o'clock" just before
    { id: 'n2', skill: 'number', level: 'B1', point: 'late', seg: [115.6, 121.05], keep: true,
      stem: 'How long has Ms. Beavers been asleep?',
      choices: ['one hour', 'four hours', 'ten hours'], a: 1,
      cue: '「I’ve been asleep」のあと。',
      line: 'I’ve been asleep for *four hours*.',
      said: '「もう4時間も寝ていた」と言っている。',
      mean: 'for four hours ＝ 4時間（ずっと）。for は期間を表す。',
      trap: 'for と four が続けて同じ音になる。直前の時刻の数字にも引かれやすい。',
      use: 'I’ve been up for twenty hours.（20時間起きてる）' },

    // why: overslept ← "after 10 o'clock" read as 10 in the morning; burglars ← a knock at night (the man asks about robbers later)
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'late', seg: [115.6, 121.05],
      stem: 'When she answers the door, how does Ms. Beavers react to them?',
      choices: ['Cross, since to her it is very late at night', 'Embarrassed, since she thinks she overslept',
                'Scared, since she thinks they are burglars'], a: 0,
      cue: '時刻の言い方と、最後の「What do you want?」。',
      line: 'It’s *after 10 o’clock*. I’ve been asleep for four hours. *What do you want?*',
      said: '「10時過ぎよ。4時間も寝てたのに。何の用？」と言う。',
      mean: '夜10時は普通まだ早いが、彼女には真夜中。それで不機嫌になっている。',
      trap: 'after 10 を朝と取ると寝坊に聞こえる。寝ていた時間と「何の用？」で夜の不満と分かる。',
      use: 'It’s way past my bedtime.（もう寝る時間をとっくに過ぎてる）' },

    // why: police order ← "official police business" at the door; favor back ← the usual bargaining script
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'meanalot', seg: [135.5, 140.1],
      stem: 'When they ask her to sign, how do they put the request?',
      choices: ['They say how much her help would matter', 'They order her to, as police business',
                'They offer to do something for her back'], a: 0,
      cue: '「Cool」のあと、if you sign it までの言い方。',
      line: 'It’d *really mean a lot* if you sign it. It’s for Leslie Knope and Ben Wyatt.',
      said: '「サインしてくれたら本当にありがたい。レスリーとベンのためなんだ」と頼む。',
      mean: 'mean a lot ＝ とても大事。命令ではなく、気持ちに訴える頼み方。',
      trap: '玄関で警察の用だと言っていたので命令と取りやすい。ここは頼みの決まり文句。',
      use: 'It would mean a lot to me.（そうしてもらえると本当にうれしい）' },

    // why: married them ← she is a clerk and this is about a wedding; left in the cold ← "freezing cold" in the wrong relation
    { id: 'd5', skill: 'detail', level: 'B2', point: 'cold', seg: [139.0, 145.95],
      stem: 'What does she remember about Leslie and Ben?',
      choices: ['They made her watch them say “I love you”', 'They made her marry them out in the snow',
                'They left her out in the cold one night'], a: 0,
      cue: '「dragged me out」のあと、so they could に続く部分。',
      line: 'They dragged me out in the freezing cold once, *so they could tell each other I love you*.',
      said: '寒い夜に外へ連れ出され、二人が「愛してる」と言い合うのを見せられた。迷惑だった、と言う。',
      mean: 'so they could ～ ＝ ～するために。連れ出した目的を言っている。',
      trap: '書記官なので結婚の手続きと結び付けやすい。so のあとの目的を聞く。',
      use: 'My friends dragged me out last night.（昨日は友だちに連れ出された）' },

    // why: touched ← being asked to be "grandma" is sweet; turns them down ← a one-word flat reply read as a no
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'fine', seg: [150.85, 156.5],
      stem: 'When they ask to adopt her as their grandma, how does she answer?',
      choices: ['Reluctantly, but she does say yes', 'Touched, though too shy to say much',
                'Annoyed, and she turns them down'], a: 0,
      cue: '質問のあとの、とても短い一語の返事。',
      line: 'So can we adopt you as our grandma? — *Fine.*',
      said: '「おばあちゃんにしていい？」と聞かれ、一言「いいわよ」とだけ答える。',
      mean: 'Fine. だけの返事は「仕方ないわね」に近い。断ってはいない。',
      trap: '素っ気ないので断りと取りやすい。Fine は不満そうでも、答えは yes。',
      use: 'Fine, I’ll do it.（分かった、やるよ）' },

    // why: letters from friends ← "pictures" + a wedding keepsake script; old outfits ← a dress made of "things from her career"
    { id: 'd6', skill: 'detail', level: 'B1', point: 'memos', seg: [156.7, 162.7],
      stem: 'What does she say she gathered up for the bride?',
      choices: ['Papers and photos from her career', 'Letters and photos from her friends',
                'Old outfits from her years at work'], a: 0,
      cue: '「I gathered up all the」のあと。',
      line: 'I gathered up all the meaningful *bills, pictures, documents, and memos* from your career.',
      said: '仕事で大事だった議案、写真、書類、メモを全部集めた、と言う。',
      mean: 'bills はここでは議会の法案。仕事の思い出の紙をドレスに使っている。',
      trap: 'pictures が聞こえるので友人の手紙と取りやすい。from your career が決め手。',
      use: 'I gathered up all the receipts.（レシートを全部集めた）' },

    // R fix: key was the only wholly positive choice; "Ann's dress" now "lovely, would suit Ann too" (V2/K6)
    // why: suit Ann ← the name read literally, as about Ann herself; too plain ← a Japanese-style polite hedge read in
    { id: 'f5', skill: 'phrase', level: 'C1', point: 'perkins', seg: [162.8, 169.5],
      stem: 'When the bride sees the finished dress, what does her comparison mean?',
      choices: ['It is the best dress she could imagine', 'It is lovely, and it would suit Ann too',
                'It is lovely, but a little too plain for her'], a: 0,
      cue: '「most beautiful」の文と、次のたとえ。',
      line: 'It is the most beautiful object I’ve ever seen. It is like *the Ann Perkins of dresses*.',
      said: '「今まで見た中でいちばん美しい。ドレス界のアン・パーキンスね」と言う。',
      mean: 'the X of Ys ＝ Y の中の X のような最高のもの。親友の名前で最大級にほめている。',
      trap: '人の名前があると、その人の話と取りやすい。直前の最上級の文とセットで聞く。',
      use: 'This is the Rolls-Royce of hotels.（ホテルの中の最高級だ）' },

    // R fix: "still need a license" was weak; now the rings, the missing piece the clip dwells on (V2)
    // why: rings ← "we didn't find any rings" earlier; dress ruined ← "I ruined it" just before, in the wrong relation
    { id: 'g2', skill: 'gist', level: 'B2', point: 'together', seg: [172.0, 197.0],
      stem: 'As the clip ends, where do things stand?',
      choices: ['Every missing piece is ready, and they set off', 'All is ready but the rings, so they keep looking',
                'The dress is ruined, so the wedding is delayed'], a: 0,
      cue: '最後のやりとり、何をまとめて確かめているか。',
      line: 'The license, the rings, the officiant, everything? — Yes, it all *came together*.',
      said: '許可証、指輪、司式者、全部そろったかと聞かれ、全部そろったと答え、出発する。',
      mean: 'come together ＝ ばらばらだったものがうまくまとまる。',
      trap: '直前の「I ruined it」で失敗と取りやすいが、式の準備とは別の話。最後の答えを聞く。',
      use: 'Everything came together in the end.（最後は全部うまくいった）' },
    // R fix: "before the wedding" in the stem let the tradition pick the key; the stem now stops after the gap (V2/S2)
    // why: going to ← "supposed to" shrinks to a quick two-beat sound like "gonna"; about to ← the "-bout to" ending blurs
    { id: 's2', skill: 'sound', level: 'B2', point: 'supposed', seg: [178.0, 181.1],
      stem: 'Fill the gap: “I’m not ___ see you…”',
      choices: ['supposed to', 'going to', 'about to'], a: 0,
      cue: '「I’m not」のすぐあと、速く縮んだ音。',
      line: 'I’m not *supposed to* see you before the wedding.',
      said: '「式の前に君を見ちゃいけないんだ」と慌てる。',
      mean: 'supposed to は「スポウスタ」と縮み、最初の su も弱い。決まりで～してはいけない。',
      trap: 'going to も縮むと似る。最初の「ス」の音と、d がほぼ消える点を聞く。',
      use: 'You’re not supposed to park here.（ここは駐車しちゃいけない決まりだよ）' },

    // R fix: "what to wear" was a filler; now "who may be in the room", a near reading of the rule (V2/K3)
    // why: which day ← "before the wedding" heard as a timing question; in the room ← "cover my eyes" read as about being there at all
    { id: 'i2', skill: 'infer', level: 'B2', point: 'groom', reveals: ['supposed'], seg: [178.0, 186.55],
      stem: 'What has Andy got mixed up in this moment?',
      choices: ['Who must not see the bride before the wedding', 'Which day the wedding is going to be held',
                'Who is allowed in the room with the bride'], a: 0,
      cue: '「Andy」と呼ぶ一言と、彼の目の隠し方。',
      line: 'I’m not supposed to see you before the wedding. … *Andy, that’s the groom*. — Well, I saw him too.',
      said: '花嫁を見てはいけないと慌てるが、それは花婿の話だと言われ、念のため目を隠す。',
      mean: '自分には関係ない決まりを自分のことだと思い込んでいる。',
      trap: 'before the wedding が聞こえると日にちの話と取りやすい。the groom の一言で分かる。',
      use: 'Just to be safe, let’s book now.（念のため、今予約しよう）' },

  ]
};
