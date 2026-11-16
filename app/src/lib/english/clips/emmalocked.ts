// REVIEW 2026-11-16: pass 5, fix 15, drop 0, new 0; ear checks 10
// OPEN: r1 ("bigger bird") and s2 ("Boy, are you…") are still near 50 % blind for a reader who knows sitcom moves
//   or the set phrase; replace them if they play too easy.
// “Emma Is Locked in the Apartment | Friends” (the official Friends channel, Best of Season 9): the baby is locked
// inside; Rachel fears the worst, and Ross answers each fear, then mocks them with a wild eagle story.
// Segments from the captions, words from whisper (2026-11-16). Names aren't said in the clip: the worried voice is
// taken as Rachel, the calm one ("my mother… has the key", the eagle story) as Ross. No item uses 66–74 s or the
// whisper repeats over the end music.
// EAR CHECK: 0–74 s (all named stems) — worried voice = Rachel, calm voice = Ross (assumed; neither name is said)
// EAR CHECK: 7.3 s w1 — the voice that says "Knock that door down!" is Rachel's and "I would, but…" is Ross's
// EAR CHECK: 7.3 s x1 — "knock that door down": "that door" runs together (the t drops)
// EAR CHECK: 9.2 s f1 — whisper "I'd bruise like a peach", captions "I bruise like a peach"
// EAR CHECK: 19.2 s t1 — "…but, yeah, jumped" is sarcastic, not agreement (key rests on tone)
// EAR CHECK: 25.5 s s1 — both have "did not" (not "didn't"); confirm the full, stressed form
// EAR CHECK: 37.4 s p1 — "Oh my God, you know what? I think you're right" is mock agreement (key rests on tone)
// EAR CHECK: 44.0 s r1 — the cut falls before "an eagle"; captions "no no way no no" (last "no" at 44.1–44.3),
//   whisper "No, no, wait, no, no"
// EAR CHECK: 51–64 s t2 — Ross hams it up like a narrator (key rests on tone)
// EAR CHECK: 76.6 s s2 — "Boy, are you gonna be sorry": both have "are you"; speaker unknown (no item needs it)
import type { Clip } from '../types.ts';

export const emmaLocked: Clip = {
  id: 'emmalocked', video: 'e-wpYDsUKoU', title: 'Emma Is Locked in the Apartment', dur: 90, wpm: 209, band: 'fast',
  tags: ['家'],
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: blind 80 % (the only choice with "mother" and "key" together, and i3's stem names his mother).
    //   All three now turn on super/mother/key, so the listener has to hear "not home" and "she has the key".
    // why: super back ← "the super" + "in a minute" glued together; mother gets the super's key ← both words said,
    //   in the wrong relation (the super is out, and she has her own key)
    { id: 'd1', skill: 'detail', level: 'B1', point: 'key', seg: [0, 6.7],
      stem: 'According to Ross, how will they get in?',
      choices: ['The super will be back in a minute', 'His mother will bring her key soon',
                'His mother will get a key from the super'], a: 1,
      cue: '「not home」のあと、「key」までの部分。',
      line: 'the super’s not home… *my mother’s gonna be here in a minute*, and she has the key',
      said: '管理人は留守だが、母がもうすぐ来て、かぎを持っている。',
      mean: 'super ＝ 管理人。in a minute ＝ すぐに。待てば開く、という話。',
      trap: 'super と minute をつなげやすいが、管理人は not home。短い not を聞く。',
      use: 'She’ll be here in a minute.（すぐ来るよ）' },

    // R fix: blind 70 %. The key turned on telling the two (unnamed) voices apart, which is a who item, not a
    //   gist, and the lost-key choice was weak. Now scene-level, no names; the trap is the other one catching the
    //   panic. Reveals `story`, since "laughs them off" makes g2 easy.
    // why: lost key ← "key"/"super" heard, so a quarrel; gets scared too ← "Oh my God… you're right" and the loud
    //   eagle story taken at face value
    { id: 'g1', skill: 'gist', level: 'B1', point: 'scene', reveals: ['story'], seg: [0, 50.3],
      stem: 'What is going on in this scene?',
      choices: ['They argue over who lost the key to the door', 'One keeps imagining dangers; the other gets scared too',
                'One keeps imagining dangers; the other laughs them off'], a: 2,
      cue: '心配が一つ出るたびに、もう一人がどう返すか。',
      said: 'ドアが開かず中に赤ちゃん。Rachel が次々に心配を言い、Ross が一つずつ答える。',
      mean: 'あわてる人と、落ち着かせつつからかう人の場面。',
      trap: '大声や長い話はあわてているようにも聞こえる。声の大きさより、返事が心配を消しているかを聞く。',
      use: 'Okay, let’s not panic.（よし、あわてないでいこう）' },

    // R fix: blind 65 %; the key was the only nuanced choice and "elsewhere" was a filler. New key wording also
    //   clears a cue leak ("minute").
    // why: late ← "that long" heard as "his mother will be late"; doesn't trust ← "key" said, in the wrong relation
    { id: 'i3', skill: 'infer', level: 'B2', point: 'wait', reveals: ['key'], seg: [3.1, 7.3],
      stem: 'When Ross mentions his mother, what does Rachel’s reply show?',
      choices: ['She thinks his mother will be very late', 'She can’t stand even a short wait',
                'She doesn’t trust his mother with the key'], a: 1,
      cue: '「すぐ来る」と聞いた直後の返事。',
      line: 'my mother’s gonna be here *in a minute*… — I can’t *wait that long*.',
      said: '「すぐ来る」と聞いても「そんなに待てない」と返す。',
      mean: '少しの時間も長く感じるほどあせっている。',
      trap: 'that long だけ聞くと「母が遅れる」と取りやすいが、Ross は in a minute と言っている。',
      use: 'I can’t wait that long.（そんなに待てない）' },

    // R fix: blind 60 %; "Neither" was a filler and the key echoed i3. Now two Rachel choices and one Ross,
    //   so the voice and the turn ("You have to…" / "I would, but") decide it.
    // why: Ross offers ← "I would" heard without the "but"; Rachel herself ← "do something" heard as "I'll do something"
    { id: 'w1', skill: 'who', level: 'B1', point: 'knockwho', reveals: ['knock'], seg: [3.1, 11.2],
      stem: 'Who wants to break the door down?',
      choices: ['Ross, who offers to do it himself', 'Rachel, who will do it herself',
                'Rachel, who wants Ross to do it'], a: 2,
      cue: '強く頼む声と、「I would」と答える声を比べて。',
      line: 'You have to do something. *Knock that door down!*',
      said: 'Rachel が「何とかして、ドアを壊して！」と頼み、Ross が断る。',
      mean: 'you have to ～ は強い要求。Ross は乗り気ではない。',
      trap: '力仕事なので Ross の案と思いやすいが、Ross は I would, but と答える側。',
      use: 'You have to do something!（何とかしてよ！）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'knock', reveals: ['knockwho'], seg: [6.7, 9.1],
      stem: 'Type what Rachel says: “___!” (4 words)', answer: 'knock that door down',
      cue: '「do something」のすぐあと、強い命令。',
      line: 'You have to do something. *Knock that door down!*',
      said: '「ドアをたたき壊して！」と叫んでいる。',
      mean: 'knock ～ down ＝ たたいて倒す。that の t が消え、that door がつながる。',
      trap: 'knock を「ノック」とだけ取ると、最後の down を聞きのがしやすい。',
      use: 'They knocked down the old wall.（古い壁を取り壊した）' },

    // R fix: blind 55 %; "wait until she calms down" was a filler. Now two door excuses against one about him.
    // why: door marked ← "bruise" attached to the door, not to him; door too strong ← the usual "I can't break it" script
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'peach', seg: [6.7, 11.5],
      stem: 'Ross answers “I would, but…”. What is his excuse?',
      choices: ['The door would get badly marked up', 'He would get hurt far too easily',
                'The door is much too strong to break'], a: 1,
      cue: '「but」のあと、果物にたとえた部分。',
      line: 'I would, but *I’d bruise like a peach*.',
      said: '「やりたいけど、ももみたいにあざができちゃう」と断る。',
      mean: 'bruise ＝ あざができる。すぐ傷む果物にたとえ、体が弱いとおどけている。',
      trap: 'bruise をドアの傷と取りやすいが、主語は I。I would, but は断りの形。',
      use: 'I would, but I’m really tired.（そうしたいけど、すごく疲れてて）' },

    // R fix: blind 90 %. The stem quoted "besides", so it was a vocabulary question. The stem no longer names the
    //   word: the listener has to catch it.
    // why: new subject ← the opener heard as "anyway"; taking back ← heard as "but" or "well"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'besides', seg: [13, 19.2],
      stem: 'After the peach line, what does the first word of Ross’s next turn signal?',
      choices: ['He is moving on to a new topic', 'He is taking back what he said', 'He is adding one more reason'],
      a: 2,
      cue: '文頭の一語のあと、何と言って安心させているか。',
      line: '*Besides*, you know, everything’s gonna be fine. The baby’s sleeping.',
      said: '「それにさ、大丈夫。赤ちゃんは寝てるし」と続ける。',
      mean: 'besides ＝「それに」。安心できる理由をもう一つ足している。',
      trap: '話題を変える anyway や反対の but と混ざりやすい。besides は同じ方向に足す語。',
      use: 'Besides, it’s too late to go now.（それに、もう行くには遅いよ）' },

    // R fix: blind 75 %; "worrying she is unwell" was weak. A second mocking choice (wrong target) now competes.
    // why: agreeing ← "yeah, jumped" heard as a real yes; mocking Rachel ← the tone is right, the target isn't
    { id: 't1', skill: 'attitude', level: 'C1', point: 'jumped', seg: [16.7, 22.8],
      stem: 'When Ross ends with “…but, yeah, jumped”, what is he doing?',
      choices: ['Agreeing she could have climbed out', 'Mocking the idea; she is far too young',
                'Mocking Rachel for not watching her'], a: 1,
      cue: '「jumped」の前に言う、赤ちゃんの体の話。',
      line: '*Can’t hold her own head up*, but, yeah, *jumped*.',
      said: '「首も支えられないのに、そうだね、跳んだんだね」と言う。',
      mean: '跳べるはずがない、という皮肉。この yeah は同意ではない。',
      trap: 'yeah で同意と取りやすい。前半の事実と後半がかみ合わないときは皮肉。',
      use: 'Oh yeah, that’s gonna happen.（はいはい、そうなるよね）' },

    // why: didn't ← the everyday contraction; do not ← the past tense lost; did ← the "not" swallowed, so a yes
    { id: 's1', skill: 'sound', level: 'B2', point: 'water', seg: [23.4, 27.5],
      stem: 'Fill the gap in Ross’s answer: “You ___ leave the water running.”',
      choices: ['didn’t', 'did not', 'do not', 'did'], a: 1,
      cue: '「You」のすぐあと、動詞 leave の前の部分。',
      line: 'I left the water running! — You *did not* leave the water running.',
      said: '「水出しっぱなし！」に、「出しっぱなしになんかしてない」と返す。',
      mean: 'did not と分けて言うと、強い打ち消しになる。',
      trap: '普段は didn’t が多いのでそう聞こえやすい。音のかたまりの数と not の強さで聞き分ける。',
      use: 'No, I did not eat your cake.（いや、君のケーキは食べてないって）' },

    // why: stick with him ← together = 一緒に; get her things ← "pull … together" read as gathering things up
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'pull', seg: [24.9, 29.4],
      stem: 'After the water worry, what does Ross ask Rachel to do?',
      choices: ['Stay close and stick with him', 'Get her things so they can go', 'Calm down and get a grip'], a: 2,
      cue: '「please, just」のあと、yourself を含む言い方。',
      line: 'Please, just *pull yourself together*, okay?',
      said: '「頼むから、しっかりして」と言っている。',
      mean: 'pull yourself together ＝ 落ち着いて自分を取り戻す。取り乱した人への言葉。',
      trap: 'together を「一緒に」と取ると「そばにいて」に引かれる。yourself と組むと別の意味。',
      use: 'Pull yourself together. You can do this.（しっかり。きっとできるよ）' },

    // R fix: blind 85 %; the key was the only answer to the stove question. Now three answers about the stove.
    // why: may be on ← "haven't" lost, so "you have cooked"; he turned it off ← the usual calming answer
    { id: 'i1', skill: 'infer', level: 'B2', point: 'cooked', seg: [28.1, 33.4],
      stem: 'What does Ross’s answer to the stove question imply?',
      choices: ['It may be on, since she cooked this morning', 'It can’t be on, since she never cooks',
                'It can’t be on, since he turned it off'], a: 1,
      cue: '「stove」の質問のあと、年を言う返事。',
      line: 'did I leave the *stove* on? — You *haven’t cooked since 1996*.',
      said: '「コンロつけっぱなし？」に「1996年から料理してないじゃん」と返す。',
      mean: '使わないコンロがつくはずない、という答え。軽いからかいも入っている。',
      trap: 'cooked だけ拾うと「料理した」に聞こえる。haven’t の否定と since を合わせて聞く。',
      use: 'You haven’t cooked in years!（もう何年も料理してないじゃん）' },

    // why: 1990 ← "nineteen ninety" caught, the short "six" lost; 1999 ← the last word heard as another "nine"
    { id: 'n1', skill: 'number', level: 'B1', point: 'cooked', seg: [29.8, 33.4], keep: true,
      stem: 'Since when has Rachel not cooked, according to Ross?',
      choices: ['1990', '1996', '1999'], a: 1,
      cue: '「since」のあとの年。最後の音まで聞いて。',
      line: 'You haven’t cooked *since 1996*.',
      said: '「1996年から料理してない」と言っている。',
      mean: '年は2けたずつ nineteen ninety-six と読む。since ＝ 〜以来ずっと。',
      trap: '最後の six は短く弱いので、ninety で切れたように聞こえやすい。年は最後の語まで聞く。',
      use: 'I’ve lived here since 2019.（2019年からここに住んでいます）' },

    // R fix: blind 60 %; "pretending" was the only non-literal choice. The distractors now carry a reason too.
    // why: really agrees ← "you're right" taken at face value; soothes, then new topic ← agreeing to calm someone
    //   (a Japanese frame) plus "you know what… listen" read as a new topic
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'right', reveals: ['narr'], seg: [33.5, 39.7],
      stem: 'After the window worry, what is Ross doing with “Oh my God, you know what?”',
      choices: ['Really agreeing, as her worry gets to him', 'Agreeing to soothe her, then changing the subject',
                'Pretending to agree, before mocking her worry'], a: 2,
      cue: '「Oh my God」の言い方を、それまでの Rachel と比べて。',
      line: 'a bird could fly in there… — Oh my God, you know what? *I think you’re right*.',
      said: '鳥が入るかもと言う Rachel に、Ross が「君の言う通りかも」と大げさに乗る。',
      mean: '本気の同意ではなく、心配をまねて大きくする前置き。',
      trap: 'you’re right を文字通りに取りやすい。急に相手の口調をまねたら、からかいの合図。',
      use: 'Oh no, you’re so right.（あーそうだね、ほんとその通り）' },

    // R fix: blind 85 %; the two distractors weren't jokes anyone would see. Now three readings of the laugh.
    //   The segment was 16.8 s (over 15), now starts at "the window's open"; the cue pointed at the key.
    // why: her cooking ← "stove" + the 1996 line just before; scares himself ← his loud, rising delivery
    { id: 'h1', skill: 'humor', level: 'C1', point: 'eagle', reveals: ['pigeon'], seg: [35.5, 50.3],
      stem: 'Why does the audience laugh at “Landed on the stove and caught fire”?',
      choices: ['He blames the fire on her bad cooking', 'He ties all her worries into one disaster',
                'He gets carried away and scares himself'], a: 1,
      cue: 'ワシの話が、それまでの話とどう関係するか。',
      line: 'Is the window open?… *An eagle flew in! Landed on the stove and caught fire!*',
      said: '鳥、いやワシが入り、コンロに止まって燃えた、と心配を全部つなげる。',
      mean: '心配の一つ一つを、大げさな一つの事件にまとめてからかっている。',
      trap: '勢いがあるので本気にも聞こえるが、窓も鳥もコンロも Rachel の心配。前の話とのつながりを聞く。',
      use: 'Now you’re just being silly.（それはもう考えすぎだよ）' },

    // R fix: blind 90 %; both distractors said "real", the key alone didn't. A kind motive (distraction) now competes.
    // why: real events ← the narrator voice sounds like a report; keeping her busy ← the soothing frame of his
    //   earlier lines and "my mother's gonna be here"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'story', reveals: ['narr'], seg: [37.3, 74],
      stem: 'What is Ross doing in his long story?',
      choices: ['Telling her what is really going on inside', 'Keeping her busy with a story till help comes',
                'Making her worries huge to show they’re silly'], a: 2,
      cue: '話の中身が、ありそうなことか、ありえないことか。',
      said: 'ワシが燃え、赤ちゃんが跳び、部屋が水でうずになる、という話を語り続ける。',
      mean: 'Rachel の心配をわざと大げさにして、考えすぎだと伝えている。',
      trap: '話で気をそらしているようにも見えるが、材料は全部 Rachel の心配。何を材料にしているかを聞く。',
      use: 'You’re blowing this out of proportion.（大げさに考えすぎだよ）' },

    // R fix: blind 90 %; "bigger bird" was the only move that kept the story going (and f3's stem names the eagle,
    //   a separate draw). Now two story-changing moves, bigger or smaller.
    // why: stops before "an eagle"; drops the bird ← "No, no" read as backing down; smaller bird ← "No, no" read
    //   as correcting toward something more likely
    { id: 'r1', skill: 'predict', level: 'B2', point: 'pigeon', reveals: ['eagle'], seg: [39.7, 44], then: [44, 50.3],
      stem: 'Ross says “A pigeon. No, no…”. What kind of move comes next?',
      choices: ['He drops the bird and tells her to calm down', 'He swaps in an even bigger, scarier bird',
                'He swaps in a smaller bird that fits better'], a: 1,
      cue: '「No, no」が打ち消しているのは、話そのものか、ハトか。',
      line: 'A pigeon. No, no… *An eagle flew in!* Landed on the stove and caught fire!',
      said: '「ハトが…いや違う、ワシが飛び込んで、コンロに止まって燃えた！」と話を大きくする。',
      mean: 'この No, no は話をやめる合図ではなく、もっと大げさに言い直す前置き。',
      trap: 'No が続くと「やっぱりない」と引くように聞こえやすいが、ここは自分の言葉の訂正。',
      use: 'It was big. No, no — huge.（大きかった。いや、巨大だった）' },

    // why: window ← windows were one of her worries; cry ← what babies usually do
    { id: 'd2', skill: 'detail', level: 'B2', point: 'aid', seg: [51.2, 58.6],
      stem: 'In Ross’s story, what does the baby do when it sees the fire?',
      choices: ['Climbs out through the open window', 'Wakes up and starts to cry for help',
                'Jumps across the room to help the bird'], a: 2,
      cue: '「seeing this」のあと、「aid」で終わる部分。',
      line: 'The baby, seeing this, *jumps across the apartment* to the mighty *bird’s aid*.',
      said: '赤ちゃんはそれを見て、部屋を跳び越え、強い鳥を助けに行く。',
      mean: 'to someone’s aid ＝ 〜を助けに。赤ちゃんが鳥を助けるという、ありえない展開。',
      trap: 'window は前の心配に出てきた語。赤ちゃん＝泣く、という思い込みも、ここでは外れる。',
      use: 'A stranger came to my aid.（知らない人が助けてくれた）' },

    // R fix: blind 80 %; "bored" was a filler. A serious, news-report reading now competes with the hammy one.
    // why: scared ← fast, intense delivery read as real fear; news report ← the narrator words (however, meanwhile)
    //   heard without the hamming
    { id: 't2', skill: 'attitude', level: 'B2', point: 'narr', seg: [51.2, 63.8],
      stem: 'How does Ross sound as he tells this part of the story?',
      choices: ['Shaky and scared, as if it were real', 'Grand and dramatic, like a film narrator',
                'Flat and serious, like a news reporter'], a: 1,
      cue: '言葉の選び方（however、mighty など）と語り口。',
      said: '「しかしワシはこれを攻撃と勘違いし…」と、語り手のように話す。',
      mean: 'わざと大げさに語り、心配がありえないことを見せている。',
      trap: 'however などはニュースの言葉にも聞こえるが、声は大きく伸びて芝居がかっている。言葉と声を両方聞く。',
      use: 'Okay, I’m being dramatic.（はい、大げさに言ってます）' },

    // R fix: blind 90 %; the stem quoted "misconstrues", so a reader who knows the word needed no audio. The stem
    //   now names the moment only. Reveals `aid`: "wrongly" gives away that the baby came to help.
    // why: rightly ← the weak "mis-" lost; takes it as help ← "aid" just before, heard as the eagle's reading
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'misc', reveals: ['aid'], seg: [57.1, 62],
      stem: 'In Ross’s story, how does the eagle take what the baby does?',
      choices: ['It rightly sees it as an attack', 'It sees it as help and calms down', 'It wrongly takes it as an attack'],
      a: 2,
      cue: '動詞の頭の短い音と、そのあとの as に注目。',
      line: 'The eagle, however, *misconstrues this as an act of aggression*',
      said: 'ワシは、助けに来た赤ちゃんを攻撃だと受け取る。',
      mean: 'misconstrue A as B ＝ A を B だと勘違いする。かたい語でおどけている。',
      trap: '頭の mis- が聞こえないと「正しく理解する」になる。mis- は「〜し損なう」。',
      use: 'Please don’t read this as a no.（これを断りだと思わないで）' },

    // R fix: blind 70 %; "Boy," in the stem cued the set phrase "Boy, are you…". The gap now includes it.
    // why: Oh boy, you're ← the statement form is more common, "boy" heard late; aren't you ← the "-n't" seems
    //   hidden in the fast start
    { id: 's2', skill: 'sound', level: 'B2', point: 'sorry', seg: [76, 79],
      stem: 'Fill the gap in the last line: “___ gonna be sorry if that’s true.”',
      choices: ['Boy, are you', 'Oh boy, you’re', 'Boy, aren’t you'], a: 0,
      cue: '最初の短い一語のあと、語の順番に注目。',
      line: 'Boy, *are you* gonna be sorry if that’s true.',
      said: '「それが本当なら、本当に後悔するぞ」と言っている。',
      mean: 'Boy, are you ～ は疑問文の形で「本当に〜だぞ」と強める。',
      trap: '意味は you’re とほぼ同じなので語順で聞き分ける。aren’t なら n が残る。',
      use: 'Boy, am I tired!（いやあ、本当に疲れた）' }
  ]
};
