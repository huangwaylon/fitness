// “Does Cat want to be with Freddie?!” (NickRewind, Best of iCarly 📲): Freddie rushes to Sam's place after a call
// saying Sam was badly hurt; Cat answers the door, contradicts herself about where Sam is, keeps sliding off the
// subject, and ends by asking Freddie to hang out, "just me and you".
// Segments from the captions, words from whisper (2026-11-17). Named in the audio: Freddie (2.6 s), Cat (34.9 s),
// Sam (4.8 s on). Two voices only: Freddie asks about Sam, Cat answers.
// Untested on purpose: 27.2 s (captions "Say beans", whisper "Share beans"), 32.4 s (captions "you're Cat", whisper
// "you're a cat?"), 46.2–48.6 s (captions "She added me to her contacts", whisper "Did you add me to your
// contacts?"), 106.8 s (captions "Hanging", whisper "Hang it").
// EAR CHECK: 91.3 s s1 — captions "You want to hang out with me today?", whisper "You wanna hang out…": the reduction
//   to "wanna" is really there
// REVIEW 2026-11-17: pass 3, fix 15, drop 1, new 0; ear checks 1
// OPEN: h1 still leans on the obvious contradiction; its stem quotes the line the laugh follows, so a cold read may
//   still reach ~50 %.
// OPEN: nt3's key assumes "Couple of friends" plays down a one-on-one invite; if it sounds plainly sincere on the
//   phone, the key still holds (it says "framing", not "hiding"), but the mean note's 下心 would go.
import type { Clip } from '../types.ts';

export const catFreddie: Clip = {
  id: 'catfreddie', video: 'tULE5cJy3wI', title: 'Does Cat want to be with Freddie?!', dur: 109, wpm: 110,
  band: 'slow', tags: ['友だち', '恋愛'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): the old key was the only serious reason. Now near misses from words said: "hospital"
    //   (he doesn't know where she is) and "called me last night" (it was the roommate). Segment to 46.8 s so it holds
    //   "The girl who called me last night? – Yeah." (before the disputed contacts line).
    // why: hospital ← "Is she in the hospital?" read as knowing she's there; Sam called ← "called me last night" heard
    //   without "the girl who"
    { id: 'g1', skill: 'gist', level: 'B1', point: 'visit', reveals: ['roommate'], seg: [0, 46.8],
      stem: 'Why has Freddie come over to Sam’s place?',
      choices: ['He was told Sam was hurt and came to check', 'He came to take Sam home from the hospital',
                'Sam called him last night and asked him over'], a: 0,
      cue: 'ドアが開いてすぐの、Freddie の2つの質問。',
      line: 'Hi, is Sam okay? Is she in the *hospital*?',
      said: '「Sam は大丈夫？病院にいるの？」と聞き、「Sam が心配」とくり返す。',
      mean: 'ゆうべの電話で Sam がけがをしたと聞き、心配して来た。',
      trap: 'called me を Sam からの電話と取りやすいが、かけたのはルームメイト。主語まで聞く。',
      use: 'Is everything okay? I came right over.（大丈夫？すぐ来たよ）' },

    // R fix: V2 (blind 55 %): the two others were weak. Now three parallel "That…" findings; "fine, just not at home"
    //   is the near miss from "No" + "Sam's not here".
    // why: fine and out ← "No [not in the hospital]" + "Sam's not here" added up; hospital ← the first question's
    //   keyword
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['look', 'dodge', 'hangout'], seg: [0, 108.8],
      stem: 'By the end of the scene, what has Freddie learned about Sam?',
      choices: ['That he still doesn’t know how Sam is', 'That Sam is fine, just not at home',
                'That Sam is in the hospital after all'], a: 0,
      cue: 'Sam について聞かれたときの答えを、順に。',
      said: 'Sam の様子を聞いても、Cat は質問で返したり話を変えたりする。',
      mean: '無事かどうか分からないまま、話は Cat の誘いへ移る。',
      trap: 'No と not here を足して「無事で外出中」と取りやすいが、無事とは一度も言っていない。',
      use: 'So, is she okay or not?（で、彼女は大丈夫なの？）' },

    // R fix: V2 (blind 50 %): "asks why she lied" and "hiding" didn't fit the moment. Now parallel near misses built
    //   on "Sam, where are you?".
    // why: doubtful ← the later contradiction pulled forward, and "where are you?" heard as asking Cat; worried ←
    //   "where" heard as "where is she hurt"
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'here', seg: [3.6, 11.8],
      stem: 'When Cat says Sam is “just in here”, how does Freddie react?',
      choices: ['Relieved, and he goes in calling for Sam', 'Doubtful, and he asks Cat to fetch Sam',
                'Worried, and he asks where Sam is hurt'], a: 0,
      cue: '答えを聞いた直後の短い一言と、次にすること。',
      line: '– No, she’s *just in here*. – *Oh, thanks.* Sam? Sam, where are you?',
      said: '「中にいるよ」と聞き、Freddie は「ありがとう」と言って Sam を呼ぶ。',
      mean: '病院ではないと分かり、ひとまずほっとしている。',
      trap: 'where are you を Cat への質問や「どこをけが」と取りやすい。呼ぶ相手と、その時の言葉で聞く。',
      use: 'Oh, thank goodness. Where is she?（ああ、よかった。どこにいるの？）' },

    // R fix: V2 (blind 70 %): the two others were far from the moment. Now literal readings of "not here" that a
    //   partial listener could hold.
    // why: just went out ← "not here" read as news; nearby ← "here" read as "this room" (she said "in here")
    { id: 'h1', skill: 'humor', level: 'C1', point: 'here', seg: [3.6, 15.7],
      stem: 'Why does the audience laugh when Cat says “Oh, Sam’s not here”?',
      choices: ['She said seconds ago that Sam was inside', 'She has only just noticed that Sam went out',
                'She means Sam is nearby, just not in this room'], a: 0,
      cue: '少し前の Cat の答えと、今の一言を並べて。',
      line: '– No, she’s *just in here*. … – Oh, *Sam’s not here*.',
      said: '「中にいる」と言ったのに、Cat が「Sam はいないよ」とさらっと言う。',
      mean: '数秒前の自分の言葉と正反対のことを、平気で言うのが笑いどころ。',
      trap: 'not here を「今出かけた」「この部屋にいない」と取りやすい。笑いの直前は前の発言と比べる。',
      use: 'Wait, didn’t you just say she was home?（待って、家にいるって言わなかった？）' },

    // R fix: V2 (blind 65 %) and K1: "praises him for asking good questions" was half true (she does flatter). Now
    //   the "full of questions" complaint reading.
    // why: admits ← "Well…" heard as the start of an excuse (日本語の「ええと、実は」); stop asking ← "full of
    //   questions" read as a complaint
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'dodge', reveals: ['handsome'], seg: [15.5, 22.5],
      stem: 'When Freddie starts “But didn’t you just say she was…”, what does Cat’s reply do?',
      choices: ['Avoids his question by flattering him', 'Admits she got mixed up about Sam',
                'Tells him to stop asking so many questions'], a: 0,
      cue: '質問に答えたかどうか。Well のあとの言葉の向き。',
      line: 'Well… *Aren’t you a handsome boy full of questions?*',
      said: '矛盾を突かれた Cat は「質問だらけの、かっこいい男の子ね」と返す。',
      mean: '答えずに相手をほめて、話をそらしている。',
      trap: 'full of questions を「聞きすぎ」という注意に取りやすいが、handsome と並ぶ甘い言い方。答えたかで見る。',
      use: 'Nice try changing the subject.（話をそらそうとしてもダメだよ）' },

    // R fix: V2 (blind 50 %): the key was the only specific one. "Making fun of her name" is the near miss from the
    //   defensive-sounding "Why?".
    // why: making fun ← "Why?" heard as defensive; a pet ← "like cats" heard as an offer of a cat
    { id: 'i1', skill: 'infer', level: 'B2', point: 'cats', seg: [31.3, 41.2],
      stem: 'Right after giving her full name, why does Cat ask Freddie a question back?',
      choices: ['She takes his question as a liking for cats', 'She thinks he is making fun of her name',
                'She wants to know if he would like a pet'], a: 0,
      cue: '名前を言ったあとの Why? と、その次の質問。',
      line: 'Cat Valentine. Why? *You like cats?*',
      said: '名前を確かめられ、Cat は「なんで？猫が好きなの？」と聞き返す。',
      mean: '名前の確認を、動物の猫への興味と受け取っている。そのずれが笑いになる。',
      trap: 'Why? を名前への不満と取りやすいが、続く You like cats? は明るい問い。',
      use: 'Why do you ask?（なんでそんなこと聞くの？）' },

    // why: neighbor / sister ← she answers the door at Sam's place, and both fit a girl who is there
    { id: 'd4', skill: 'detail', level: 'B1', point: 'roommate', seg: [40.8, 44.0],
      stem: 'When Freddie checks who Cat is, what does she turn out to be?',
      choices: ['Sam’s roommate', 'Sam’s neighbor', 'Sam’s sister'], a: 0,
      cue: '「so you’re Sam’s」のあとの一語。',
      line: 'so you’re Sam’s *roommate*. – Uh-huh.',
      said: '「じゃあ君が Sam のルームメイト？」に、Cat が「うん」と答える。',
      mean: 'roommate ＝ 部屋を一緒に借りて住む人。',
      trap: '家にいるので「姉妹」「隣の人」も考えられるが、聞こえた一語で決める。',
      use: 'My roommate is out right now.（ルームメイトは今出かけてる）' },

    // R fix: V2 (blind 55 %): the key was the only upbeat choice. Now three "He…" readings; "had plenty of time
    //   already" is the reproach a "No" invites.
    // why: right now ← "time" heard as "it's time"; had time already ← "there's time" read as a complaint about the
    //   past after his "No"
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'time', seg: [44.0, 53.3],
      stem: 'When Freddie answers “No,” what does Cat’s reply mean?',
      choices: ['He can still do it some other time', 'He had plenty of time to do it already',
                'He should do it now, while she’s here'], a: 0,
      cue: 'No のあと、Well で始まる短い一言。',
      line: '– No. – Well, *there’s time for that*.',
      said: 'Freddie の「いや」に、Cat は「それはこれからでいいよ」と返す。',
      mean: 'まだ間に合う、そのうちでいい。あきらめず次を期待している。',
      trap: 'time で「今すぐ」、No のあとで「時間はあったのに」と取りやすい。there’s time＝まだある。',
      use: 'No rush, there’s time for that.（急がなくていいよ、まだ時間はあるし）' },

    // R fix: V2 (blind 70 %): "did not hear him" was a filler (its evidence lies outside the segment). Now "Why?"
    //   (said right after, in the wrong order) is the keyword trap.
    // why: asked why he's upset ← Cat's "Why?" comes right after and is pulled before; told him she's fine ← "she's
    //   just in here" from earlier
    { id: 'i3', skill: 'infer', level: 'C1', point: 'look', reveals: ['dodge'], seg: [44.0, 56.3],
      stem: 'Why does Freddie say he’s “really worried about Sam” a second time?',
      choices: ['Cat keeps turning the talk toward the two of them', 'Cat has just asked him why he is so upset',
                'Cat has just told him that Sam is fine'], a: 0,
      cue: 'その前の十数秒、何の話をしていたか。',
      line: '– Well, there’s time for that. – *Look, I’m really worried about Sam.* – Why?',
      said: '電話や連絡先の話のあと、Freddie がもう一度「Sam が心配なんだ」と言う。',
      mean: 'Sam の話が進まないので、話を引き戻している。',
      trap: '直後の Why? を先に言われたと取りやすい。Why? は返事のあと。くり返しは話を戻すサインが多い。',
      use: 'Can we get back to the point?（本題に戻ってもいい？）' },

    // why: a sport ← "sport utility vehicle" heard only as "sport"; fell while running ← "run" + "over" taken
    //   one by one
    { id: 'd2', skill: 'detail', level: 'B2', point: 'runover', seg: [56.1, 60.8],
      stem: 'What does Freddie say happened to Sam?',
      choices: ['She was hit by a big vehicle', 'She got hurt playing a sport', 'She fell over while running'], a: 0,
      cue: 'Cuz のあと、got に続く2語。',
      line: 'Cuz she got *run over*, apparently by a sport utility vehicle.',
      said: '「SUV（大きな車）にひかれたらしい」と Freddie が言う。',
      mean: 'run over ＝ 車がひく。apparently は「〜らしい」、聞いた話。',
      trap: 'run と over を別々に取ると「走って転んだ」になる。句動詞はまとめて聞く。',
      use: 'Watch out, you’ll get run over!（危ない、ひかれるよ！）' },

    // R fix: V2 (blind 50 %): the doctor and text options were fillers, and "on the phone" lay outside the segment.
    //   Now who × when near misses, each settled by "You. Says you." or "Last night." V4: the words, not voices,
    //   settle it, so skill who → detail; its speaker ear check is gone.
    // why: Sam ← "you" taken as the person being talked about; earlier today ← "When?" answer missed
    { id: 'w1', skill: 'detail', level: 'B2', point: 'source', seg: [61.1, 72.9],
      stem: 'By Freddie’s account, who said Sam was badly hurt?',
      choices: ['Cat, last night', 'Sam, last night', 'Cat, earlier today'], a: 0,
      cue: 'Says who? と When? への短い答え。',
      line: '– Says who? – *You. Says you.* – When? – *Last night.*',
      said: '「誰が言ったの？」に、Freddie が「君だよ。ゆうべ」と答える。',
      mean: '話の出どころは Cat 本人。言った本人が「誰が？」と聞いている。',
      trap: 'you を話題の Sam と取ったり、When? の答��を聞き流したりしやすい。短い返事を2つとも聞く。',
      use: 'Says who? That’s not what I heard.（誰がそう言ったの？聞いた話と違うよ）' },

    // R fix: V2 (blind 55 %): the accusation option didn't match anything said. Now the graphic list he just gave is
    //   the near miss.
    // why: too graphic ← the injury list right before "I'm sorry"; raised his voice ← his sharp "You! Says you!"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'sorry', reveals: ['front'], seg: [72.9, 82.2],
      stem: 'Why does Freddie apologize after listing Sam’s injuries?',
      choices: ['He used a word he finds rude in front of her', 'He described Sam’s injuries too graphically',
                'He raised his voice at her about the call'], a: 0,
      cue: 'Why? と聞かれたあと、Cuz に続く理由。',
      line: 'Cuz I… I’ve *never said buttocks in front of a girl* before.',
      said: '「女の子の前で buttocks（おしり）と言ったことがないから」と謝る。',
      mean: '少し上品な言葉でも、女の子の前では照れくさい。Freddie のまじめさ。',
      trap: '直前のけがの話がひどいので「言いすぎた」と謝ったと取りやすい。理由は Cuz のあとに出る。',
      use: 'Sorry, I didn’t mean to say that.（ごめん、そんなこと言うつもりじゃなかった）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'front', reveals: ['sorry'], seg: [78.6, 82.2],
      stem: 'Type what he says: “I’ve never said buttocks ___ girl before.” (4 words)', answer: 'in front of a',
      cue: 'buttocks のあと、girl の前の短い4語。',
      line: 'I’ve never said buttocks *in front of a* girl before.',
      said: '「女の子の前で（言ったことがない）」と言っている。',
      mean: 'in front of a が「インフランタヴァ」と一続き。of と a はとても弱い。',
      trap: 'of a が一つに聞こえ、語数が足りなく感じやすい。in front of はかたまりで覚える。',
      use: 'Not in front of the kids, please.（子どもの前ではやめて）' },

    // R fix: C2 one rewrite (blind 60 %): "Sam, for breaking such a silly body part" was absurd. Now two near misses
    //   that "it's okay… don't offend me" refutes.
    // why: Cat shocked ← she is the odd one, so the laugh seems aimed at her (right mechanism, wrong target);
    //   upsetting Cat ← his apology taken at face value
    // anchor: 79.2–81.1 s "I've never said buttocks in front of a girl before" makes a mild word a big deal; 85.3 s
    //   "Buttocks don't offend me" shows Cat knows it could offend, and answers calmly; the laugh comes after
    //   Freddie's "Oh." (89.4 s)
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'sorry', reveals: ['front'], seg: [78.6, 90.9],
      stem: 'In the “buttocks” exchange, who is the joke mainly on?',
      choices: ['Freddie, for making a mild word a big deal', 'Cat, for being shocked by such a word',
                'Freddie, for upsetting Cat with the word'], a: 0,
      cue: '謝った理由と、それへの Cat の返し方。',
      line: 'I’ve never said buttocks in front of a girl before. … – Oh, it’s okay. *Buttocks don’t offend me.*',
      said: 'Freddie が「女の子の前で言ったことがない」と謝り、Cat は「平気よ」と返す。',
      mean: '笑われるのは、軽い言葉を大事件のように扱う Freddie のうぶさ。Cat の平然さで目立つ。',
      trap: '変わった返事の Cat に目が行きやすいが、Cat は「平気」と言う。笑いは大げさに謝る側に向く。',
      use: 'Relax, it’s not a big deal.（落ち着いて、大したことじゃないよ）' },

    // R fix: V2 (blind 55 %): "were going to" was the odd one out. Now "going to" ("You gonna…?"), which fits the
    //   gap as said.
    // why: won't ← the "-na" of "wanna" heard as n't; going to ← "wanna" heard as "gonna"; wanted to ← a past form
    //   fills the weak syllable
    { id: 's1', skill: 'sound', level: 'B2', point: 'wanna', reveals: ['hangout'], seg: [90.6, 93.7],
      stem: 'Fill the gap: “You ___ hang out with me today?”',
      choices: ['want to', 'wanted to', 'won’t', 'going to'], a: 0,
      cue: '文の2語目、短く縮んだ音。',
      line: 'You *wanna* hang out with me today?',
      said: '「今��、私と遊ばない？」と聞いている。',
      mean: 'want to が「ワナ」と一つに縮む。会話でとてもよく使う形。',
      trap: '「ナ」を n’t と取ると won’t、「ゴナ」と取ると going to になる。上がり調子も手がかり。',
      use: 'Do you wanna grab lunch?（お昼、一緒にどう？）' },

    // R fix: V2 (blind 55 %): the key was the only specific two-part answer. Now three parallel "X, and …ing".
    // why: confused ← "I don't know what you mean" taken at face value; annoyed ← he has asked about Sam twice
    //   already
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'fluster', seg: [90.8, 99.8],
      stem: 'Answering Cat’s question about today, how does Freddie sound?',
      choices: ['Flustered, and playing for time', 'Confused, and asking her to explain',
                'Annoyed, and trying to get back to Sam'], a: 0,
      cue: '答えの中で、言いかけてやめる回数。',
      line: 'Well, I mean, it— See, I don’t— *I don’t know what you mean.*',
      said: '「えっと、つまり…いや、何のことか分からない」と言いかけては止まる。',
      mean: '誘いに困り、断る言葉を探している。分からないふりは時間かせぎ。',
      trap: '言葉どおりなら「意味不明」だが、何度も言い直すのは動揺のサイン。',
      use: 'Um, I’m not sure what you mean.（えっと、どういう意味かな）' },

    // R fix: V2 (blind 75 %) and K3: "hang things up" was absurd. Now "out" + his worry, and a group plan.
    // why: look for Sam ← "out" + his worry about Sam all scene; meet her friends ← "friends" right after, and
    //   "hang out" read as a group plan
    { id: 'ph1', skill: 'phrase', level: 'B1', point: 'hangout', reveals: ['wanna'], seg: [90.8, 103.3],
      stem: 'When Cat asks Freddie about today, what does she want?',
      choices: ['To spend some time with him today', 'To go out looking for Sam with him',
                'To have him meet her friends today'], a: 0,
      cue: 'today の前の動詞と、あとの「me and you」。',
      line: 'You wanna *hang out* with me today? … Just me and you.',
      said: '「今日、私と遊ばない？」と誘い、「あなたと私だけで」と付け足す。',
      mean: 'hang out ＝ 予定なく一緒に過ごす、遊ぶ。友だち同士でよく使う。',
      trap: 'out を「探しに外へ」と取ると Sam の話になる。me and you で二人だけと分かる。',
      use: 'Want to hang out this weekend?（週末、遊ばない？）' },

    // R fix: C2 one rewrite (blind 55 %): the key was the only non-literal choice; now three parallel moves on the
    //   plan.
    // why: add friends ← "a couple of" read as "a few" (scope shift); a couple ← katakana カップル (sincerity flip:
    //   the cover taken as a confession)
    // anchor: 101.8 s "Just me and you." rules out bringing others; "friends" (104.4 s) rules out "a couple"; the
    //   laugh at 106.1 s shows the cover is seen through
    { id: 'nt3', skill: 'pragma', level: 'C2', point: 'couple', reveals: ['hangout'], seg: [100.0, 106.6],
      stem: 'When Cat adds “Couple of friends.”, what is she doing?',
      choices: ['Framing time alone as just two friends', 'Adding a couple of friends to the plan',
                'Calling the two of them a couple'], a: 0,
      cue: '直前の「me and you」と並べて聞く。',
      line: 'Just me and you. *Couple of friends.*',
      said: '「あなたと私だけ。友だち二人でさ」と付け足し、客席が笑う。',
      mean: '二人きりの誘いを「ただの友だち」と言い直して軽く見せる。下心が透けるのが笑いどころ。',
      trap: 'a couple of を「何人か」と取ると友だちを呼ぶ話、カタカナの「カップル」だと恋人宣言になる。決め手は me and you。',
      use: 'Just the two of us, nothing fancy.（二人だけで、気軽にね）' },
  ]
};
