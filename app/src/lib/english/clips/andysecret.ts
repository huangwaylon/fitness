// “Can Andy keep a secret? | Parks and Recreation” (the official Parks and Recreation channel, Season 6): April
// spots a secret Andy is keeping and pushes him all day; he invents a sick Larry, then a run of silly fake secrets,
// until he gives in, and the real news is announced to everyone before he can tell her.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈247 s. Untested: 2.9–12.5 s (an
// unnamed speaker's auction plan), 28 s (“hours’ worth of work” vs “hours with the work”), 79–82 s (a cutaway),
// 117–122 s (Larry “passing” the ring), 126–131 s (the grail reference), 143.4 s (“Why? Ben is dying” vs “lie van is
// dying”), 152–157 s (“Chinatown in France”), 164 s (Tom's “butt”), 207–209 s (who says “Don't try to get it out of
// me”), 242 s (“a little freaked out” vs “all freaked out”).
// EAR CHECK: 40.9 s nt1 — the stress in “You're acting weird” falls on “You're” (contrast with “I'm not”), not on
//   “weird” or “acting” (ship only once confirmed)
// REVIEW 2026-11-16: pass 10, fix 14, drop 0, new 0; ear checks 1
//   Open: i4 and g2 name Leslie, who isn't named in the audio near those lines (the voice is hers; kept, as in the
//   other Parks banks).
import type { Clip } from '../types.ts';

export const andySecret: Clip = {
  id: 'andysecret', video: 'OaVa1cpWLk8', title: 'Can Andy keep a secret?', dur: 269, wpm: 168,
  band: 'fast', tags: ['恋愛', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %) and §9.5: "if you have a secret, you had to tell me" isn't grammatical, so only two
    //   choices were live; the gap now takes the subject, and all three fit
    // why: you'd have to ← an extra weak d is easy to imagine before "have"; you've got to ← "-v gotta" and "have-ta"
    //   share the weak "ta" ending
    { id: 's1', skill: 'sound', level: 'B2', point: 'haveto', seg: [30.55, 34.2],
      stem: 'Fill the gap: “Andy, if you have a secret, ___ tell me.”',
      choices: ['you have to', 'you’d have to', 'you’ve got to'], a: 0,
      cue: 'secret のあと、tell の前の短い2語。',
      line: 'Andy, if you have a secret, *you have to* tell me.',
      said: '「秘密があるなら、私に言わなきゃだめ」と言う。',
      mean: 'have to が「ハフタ」と縮まる。v が f に変わり、to は弱い「タ」になる。',
      trap: 'you’d なら「ユードゥ」、you’ve got なら「ガ」が入る。you の直後が f の音か聞く。',
      use: 'You have to try this place.（この店、絶対行ってみて）' },

    // why: twice as many as Andy ← “twice” caught alone, as a count of her own secrets; doubles every problem ← the
    //   “twice the trouble” pattern heard as a gripe about marriage
    { id: 'h1', skill: 'humor', level: 'C1', point: 'twice', seg: [31.7, 36.8],
      stem: 'Why does April’s point about marriage get a laugh?',
      choices: ['She sees marriage as a way to collect more secrets', 'She admits she has twice as many secrets as Andy',
                'She jokes that marriage doubles every problem'], a: 0,
      cue: '「the whole point of marriage」のあとの一言。',
      line: 'That’s the whole point of marriage. You get *twice the secrets*.',
      said: '「それが結婚の意味でしょ。秘密が2倍になるんだから」と言う。',
      mean: '共有は信頼の話のはずが、秘密をたくさん手に入れる「得」として語っている。そのずれが笑い。',
      trap: 'twice だけ拾うと数の話に聞こえる。何が2倍になるのか、後ろの名詞まで聞く。',
      use: 'That’s the whole point of a vacation.（それが休暇ってものでしょ）' },

    // R fix: V2 (blind 75 %): "too busy at work" was a filler; now a half-admission, which "I don't have anything" refutes
    // why: no trust ← a secret-and-denial fight usually turns on trust; half-admits ← "it is nothing" heard as "it's
    //   nothing you need to know"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'weird', seg: [31.7, 44.3],
      stem: 'What does Andy’s answer to April show?',
      choices: ['He denies more than she asked about', 'He feels hurt that she doesn’t trust him',
                'He admits a secret but won’t share it'], a: 0,
      cue: '「nothing」のあと、彼が自分から打ち消すこと。',
      line: 'Dude, it is nothing. I don’t have anything. *I’m not acting weird.*',
      said: '「何でもない。変な態度もとってない」と、聞かれていない点まで打ち消す。',
      mean: '責められていない点を自分から否定すると、隠し事があると言うのと同じ。',
      trap: 'it is nothing を「言えない」と取りやすい。打ち消した中身が相手の言葉にあったか確かめる。',
      use: 'I’m not upset. Why would I be upset?（怒ってないよ。なんで怒るの？）' },

    // anchor: 39.8–41.9 s “I'm not acting weird.” then “You're acting weird.”: “acting weird” repeats, so the only new
    //   word, and the contrast, is the subject (I'm → You're)
    // R fix: V2 (blind 70 %): only the key turned the charge back on April; all three now do, so only the stressed
    //   word differs
    // why: on “weird” ← the habit of stressing the last content word; on “acting” ← “acting” heard as “pretending”
    //   (演技する)
    // retired: the ear-check policy: a C2 stress item (the stress in “You're acting weird” on “You're”, 40.9 s); back after
    //   the ear check
    { id: 'nt1', skill: 'sound', level: 'C2', point: 'weird', seg: [38.4, 42.2], retired: true,
      stem: 'After “I’m not acting weird,” where is the stress in Andy’s next line, and why?',
      choices: ['On “you’re”: the weirdness is hers, not his', 'On “weird”: she is the strange one, not him',
                'On “acting”: she is putting it on, not him'], a: 0,
      cue: '同じ語がくり返されるとき、入れ替わる語。',
      line: 'I’m not acting weird. *You’re* acting weird.',
      said: '「僕は変じゃない。変なのはそっちだ」と、主語だけ変えて言い返す。',
      mean: 'acting weird はくり返しで弱く、新しい you’re に強勢が来る。「そっちこそ」の「こそ」に近い対比。',
      trap: '文末の語を強く読む癖だと weird に置きがち。くり返された語は弱く、入れ替わった語が強い。',
      use: 'I’m not late. You’re early.（僕が遅いんじゃない。君が早いんだ）' },

    // why: 30 ← “a half hour” is the total, said first; 50 ← fifteen/fifty, the -teen stress is easy to lose
    { id: 'n2', skill: 'number', level: 'B1', point: 'shower', seg: [47.8, 55.4],
      stem: 'How long does April give Andy for the wet-nap shower?',
      choices: ['15 minutes', '30 minutes', '50 minutes'], a: 0, keep: true,
      cue: 'travel time のあと、もう一度出てくる時間。',
      line: 'That gives us 15 minutes of travel time and *15 minutes* for you to take a wet nap shower',
      said: '「移動に15分、車でウェットティッシュのシャワーに15分」と割り振る。',
      mean: '30分を15分ずつに分けている。シャワーは本物ではない。',
      trap: 'fifteen は teen を強く長く、fifty は前を強く読む。最初の half hour は合計。',
      use: 'That gives us ten minutes to eat.（それで食べる時間が10分できる）' },

    // R fix: V2 (blind 50 %): the key was the longest and most specific; trimmed, and the others made as concrete
    // why: serious change ← the Japanese frame: ところで before a real topic; apology ← a soft opener heard as 遠慮
    { id: 'm1', skill: 'marker', level: 'B2', point: 'also', seg: [47.8, 58.1],
      stem: 'When April turns from the schedule to the secret, what does her first word do?',
      choices: ['It slips the demand in as one more list item', 'It marks a sharp, serious change of subject',
                'It softens the demand like a polite apology'], a: 0,
      cue: 'シャワーの話の直後、文頭の短い一語。',
      line: 'Good, I need one. — *Also*, tell me your secret.',
      said: '段取りを伝えたあと、「あと、秘密を教えて」と続ける。',
      mean: 'also は予定の項目を足す語。大事な要求を、ついでの一項目のように混ぜている。',
      trap: '話題を変える語は「ところで」と重く訳しがち。also は軽い追加で、その軽さがわざとらしい。',
      use: 'Also, can you grab some milk?（あと、牛乳買ってきて）' },

    // R fix: V2 (blind 60 %): "a promise" was the only reason tied to secrecy; the others are now secret-keeping reasons
    //   too (and the key is no longer the shortest, for C7)
    // why: spoil a surprise ← the usual reason to keep good news quiet; friend in trouble ← the secret is someone
    //   else's, and Larry is next
    { id: 'd2', skill: 'detail', level: 'B1', point: 'promise', seg: [57.7, 62.2],
      stem: 'Why does Andy say he won’t tell April?',
      choices: ['He doesn’t want to break his promise', 'He doesn’t want to spoil a surprise',
                'He doesn’t want to get a friend in trouble'], a: 0,
      cue: '「don’t make me tell」の次の文。',
      line: 'Babe, don’t make me tell. I don’t want to *break my promise*.',
      said: '「言わせないで。約束を破りたくないんだ」と断る。',
      mean: 'break a promise ＝ 約束を破る。誰かに口止めされている、という理由。',
      trap: '秘密と聞くと「驚かせたい」などを思いやすい。理由は I don’t want to のあとに来る。',
      use: 'I promised I wouldn’t tell.（言わないって約束したんだ）' },

    // why: long to explain ← “heavy” as a lot of content; hard to believe ← the story that follows is untrue
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'heavy', seg: [62.2, 65.2],
      stem: 'Before the Larry story, how does Andy describe what he’s about to say?',
      choices: ['Serious and hard to talk about', 'Long and difficult to explain', 'Strange and hard to believe'], a: 0,
      cue: '「Oh, geez」のあとの短い一文。',
      line: 'Oh, geez, *this is heavy*. Pardon me.',
      said: '「うわ、これは重い話だ。ちょっと失礼」と前置きする。',
      mean: 'heavy ＝ 深刻でつらい。悪い知らせの前によく使う前置き。',
      trap: 'heavy を量の多さと取ると「長い話」になる。重いのは中身の深刻さ。',
      use: 'Okay, this is kind of heavy.（ちょっと重い話なんだけど）' },

    // R fix: V2 (blind 55 %): "moving away" was weak; now "some kind of trouble", from “some kind of disease”
    // why: sad ← sick/sad, both short words after “very”; trouble ← "some kind of…" heard, the noun lost
    { id: 'd3', skill: 'detail', level: 'B1', point: 'sick', seg: [64.4, 69.9],
      stem: 'According to Andy, what is wrong with Larry?',
      choices: ['He is very sick', 'He is very sad', 'He is in some kind of trouble'], a: 0,
      cue: '「It’s about Larry」のあとの2文。',
      line: 'It’s about Larry. He is *very sick*. He has some kind of disease.',
      said: '「ラリーのことだ。重い病気で、何かの病にかかってる」と話す。',
      mean: 'sick ＝ 病気。次の disease で同じことを言い直している。',
      trap: 'sick と sad はどちらも短く、very のあとで聞き分けにくい。次の文の言い直しが手がかり。',
      use: 'Sorry, my son is sick today.（すみません、息子が今日具合が悪くて）' },

    // anchor: 71.7–77.8 s April supplies the reason and Andy only echoes it (“Yes. That is the reason. Good call,
    //   babe.”); 110.5–114.2 s Larry is not dying; 139.9 s “Fine. I'll tell you the secret.”: the secret is still untold
    // R fix: V2 (blind 60 %): "even sicker" was weak; now a promise made to Larry, from “I don't want to break my promise”
    // why: guessed the secret ← “good call” read as “you guessed right”; Larry's promise ← the promise said just before
    //   seems to be to Larry, about his illness
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'goodcall', reveals: ['sick', 'promise'], seg: [65.2, 78.6],
      stem: 'When Andy says “Good call, babe,” what is he trying not to say?',
      choices: ['That the story about Larry is made up', 'That April has guessed the real secret',
                'That Larry made him promise to keep quiet'], a: 0,
      cue: '理由を言ったのは誰か、彼がそれにどう答えるか。',
      line: 'So that’s why you’ve been so nice to him… — Yes. *That is the reason. Good call, babe.*',
      said: 'エイプリルが「だから優しくしてたのね」と言い、アンディは「それが理由。さすが」と乗る。',
      mean: '理由を自分で言わず、相手の推測を借りる。作り話によくある手で、ラリーは実は元気。',
      trap: 'good call を「当たり」と取ると、本当の秘密を当てた話になる。相手に乗るだけの返事は作り話の印。',
      use: 'Yes. Exactly. That’s totally what happened.（そう、まさにそれ。そういうこと）' },

    // R fix: V2 (blind 50 %): the key was the only choice built on the quote; the choices are now evened out
    // why: talk to others ← “talk to anyone” heard as sending him elsewhere; says it twice ← “I'm here” said twice,
    //   taken as a check that he heard
    { id: 'h2', skill: 'humor', level: 'C1', point: 'near', seg: [93.2, 100.9],
      stem: 'Why does April’s offer of support to Larry get a laugh?',
      choices: ['She shrinks “here for you” to standing nearby', 'She offers to listen, then points him to others',
                'She repeats “I’m here” as if he didn’t hear'], a: 0,
      cue: '2回目の言い直しで、何が残るか。',
      line: 'I’m here for you. Like, you know, I’m here, *standing near you*.',
      said: '「いつでも話して。ほら、ここにいる、近くに立ってる」と言い直す。',
      mean: 'I’m here for you（味方だよ）を「近くにいる」に縮め、気持ちのなさが出る。',
      trap: '親切な補足に聞こえやすいが、Like, you know のあとは本音に寄せた言い直し。',
      use: 'I’m here for you, okay?（いつでも力になるからね）' },

    // why: lost it in the icing ← “icing” and “ring” heard without the verb; cut his finger ← “finger” comes right
    //   before
    { id: 'd4', skill: 'detail', level: 'B1', point: 'ring', seg: [100.9, 107.5],
      stem: 'What happened to Larry earlier that day?',
      choices: ['He swallowed his wedding ring', 'He lost his ring in the icing', 'He cut his finger on his ring'], a: 0,
      cue: '「and then, boom」のあとの動詞。',
      line: 'I was licking icing off of my finger and then, boom, I *swallowed my wedding ring*.',
      said: '「指のアイシングをなめてたら、結婚指輪を飲みこんだ」と打ち明ける。',
      mean: 'swallow ＝ 飲みこむ。打ち明けにくい、ばつの悪い事故の話。',
      trap: 'icing、finger、ring と名詞が続き、動詞を落とすと別の話になる。boom のあとを聞く。',
      use: 'Oops, I swallowed my gum.（あ、ガム飲みこんじゃった）' },

    // R fix: V2 (blind 55 %): "feeling bad for how she treated Larry" was weak; now embarrassment
    // why: worrying ← a friend's illness usually means worry; foolish ← being fooled in public usually stings as
    //   embarrassment
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'horrible', seg: [131.4, 138.8],
      stem: 'When April confronts Andy about Larry, what is she most upset about?',
      choices: ['Being tricked into being nice to Larry', 'Worrying all day that Larry was dying',
                'Looking foolish in front of Larry'], a: 0,
      cue: '彼女が並べる3つの行動と、そのあとの一言。',
      line: 'I scratched his back. I had a conversation with him. *It was horrible.*',
      said: '「優しくした。背中をかいて、会話までした。最悪だった。よくも」と怒る。',
      mean: '嘘そのものより、だまされて優しくさせられたことに怒っている。',
      trap: '病気の嘘なら「心配させた」と怒る型を予想しやすい。並べた行動のあとの一言が怒りの中身。',
      use: 'How could you do that to me?（よくもそんなことができたね）' },

    // why: tells the truth ← the sitcom script where the truth comes out and nobody believes it; admits the Larry story
    //   ← “Fine. I'll tell you the secret” heard as a confession
    { id: 'g1', skill: 'gist', level: 'B2', point: 'dodge', seg: [138.8, 170.6],
      stem: 'When April presses Andy again, how does he handle it?',
      choices: ['He names one silly fake secret after another', 'He tells the real secret, but she won’t believe it',
                'He admits the Larry story, but won’t say more'], a: 0,
      cue: '「Fine」のあと、出てくる話の数と中身。',
      line: 'Fine. I’ll tell you the secret. Ben’s dog is dying… *Leslie is a spy*.',
      said: '「分かった、話す」と言い、犬、引っ越し、スパイと次々に話を変える。',
      mean: '話すふりをして、ありえない「秘密」を出し続け、本物を言わずに逃げている。',
      trap: 'Fine は降参に聞こえるが、ここは時間かせぎ。話が毎回すぐ No で終わるかを聞く。',
      use: 'Fine, I’ll tell you. Just kidding.（分かった、言うよ。なーんてね）' },

    // R fix: V2 (blind 70 %): "starts another secret" was weak; now a check on the last fake secret, which "Did you hear
    //   that?" right after "Tom has something wrong with his butt" invites
    // why: overheard ← “Did you hear that?” right after a secret sounds like a warning; last secret ← it follows
    //   straight on from his last fake secret, as if asking whether she caught it
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'encore', seg: [164.5, 168.7],
      stem: 'What is Andy doing with “What? Did you hear that?”',
      choices: ['He grabs an excuse to end the talk', 'He warns April someone overheard them',
                'He checks that April caught his last secret'], a: 0,
      cue: '「Did you hear that?」の直後に続く文。',
      line: 'What? Did you hear that? *They need an encore.* Honey, the kids want an encore.',
      said: '「え？聞こえた？アンコールだって。子どもたちが呼んでる」と言う。',
      mean: '話を切り上げる口実を作っている。Did you hear that? で注意をよそへ向ける。',
      trap: '秘密のあとだと「聞かれた？」に聞こえやすい。次の一文が何の話かで決める。',
      use: 'Oh, is that my phone? Sorry, gotta go.（あ、電話かな？ごめん、行かなきゃ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'hide', seg: [180.75, 182.78],
      stem: 'Type what April says: “Babe, you ___ from me.” (4 words)', answer: 'don\'t have to hide',
      cue: '「Babe」のあと、「from me」の前。',
      line: 'Babe, you *don’t have to hide* from me.',
      said: '隠れているアンディに「隠れなくていいよ」と声をかける。',
      mean: 'don’t have to ＝ 〜しなくていい。have to は「ハフタ」と縮む。',
      trap: 'don’t の t が消えて「ドン」になり、have とつながる。not を落とすと逆の意味になる。',
      use: 'You don’t have to pay me back.（返さなくていいよ）' },

    // why: never had a big secret ← “a really big secret” is said just before; April can't keep it ← a common reason
    //   not to share, but not what he says
    { id: 'i3', skill: 'infer', level: 'B2', point: 'foronce', reveals: ['promise'], seg: [192.85, 198.0],
      stem: 'What does Andy’s reason for keeping quiet suggest about him?',
      choices: ['He doesn’t usually keep his word', 'He has never had a big secret before',
                'He doesn’t think April can keep it'], a: 0,
      cue: '「big secret」のあと、次の文の最初の方。',
      line: 'It’s a really big secret. And *for once* I wanted to keep my word.',
      said: '「大きい秘密なんだ。それに、一度くらいは約束を守りたかった」と言う。',
      mean: 'for once ＝ 今回くらいは。いつもは守れていないと、自分で認めている。',
      trap: 'big secret が耳に残りやすい。for once は「いつもと違って」の合図。',
      use: 'For once, I’m on time!（今回は珍しく時間どおり！）' },

    // why: angry at April ← “screw” heard as rude and aimed at her; lock it away ← “screw” read literally (ねじで留める)
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'screw', reveals: ['promise'], seg: [197.5, 201.6],
      stem: 'Right after the reason he kept quiet, what does Andy decide?',
      choices: ['To give up on keeping his promise', 'To get angry at April for pushing',
                'To lock the secret away for good'], a: 0,
      cue: '約束の話の直後の短い一言と、次の文。',
      line: '*But screw it.* You’re more important than anything.',
      said: '「でも、もういいや。君の方が何より大事だ」と言う。',
      mean: 'screw it ＝ もういいや、知るか。こだわっていたことを投げ出すときの言い方。',
      trap: 'screw は乱暴な語なので怒りに聞こえやすい。ここは自分への「もういい」。次の文が向きを決める。',
      use: 'Screw it, let’s get dessert.（もういいや、デザート頼もう）' },

    // R fix: V2 (blind 55 %): the key was the only "swaps a loving reason for…"; all three now have that shape
    // why: warning ← “juicy” read as a scandal that hurts someone; stalling ← “You ready?” heard as more stalling
    { id: 'h3', skill: 'humor', level: 'C1', point: 'juicy', reveals: ['screw'], seg: [199.6, 204.5],
      stem: 'Why does Andy’s last reason for telling April get a laugh?',
      choices: ['It swaps a loving reason for a love of gossip', 'It swaps a loving reason for a scary warning',
                'It swaps a loving reason for more stalling'], a: 0,
      cue: '「more important than anything」のあとの理由。',
      line: 'You’re more important than anything. I’m gonna tell you. ’Cause it’s *super juicy*.',
      said: '「君が何より大事。だから話す。だって、すごくおいしい話だから」と続ける。',
      mean: '愛情の理由のすぐあとに、うわさ話をしたいだけという本音が出る。',
      trap: 'juicy を「やばい話」と取ると、誰かが困る話に聞こえる。ここは「人に話したくなる面白さ」。',
      use: 'Ooh, tell me. Is it juicy?（ねえ教えて。おもしろい話？）' },

    // R fix: V2 (blind 60 %): "whispers it just in time" was weak; now Andy blurting it out to the group, a near miss
    // why: Andy blurts it ← “I'm gonna tell you. You ready?” sets it up, and it does reach the whole group; Larry lets
    //   it slip ← Larry speaks up, complaining, in the middle of the announcement
    { id: 'g2', skill: 'gist', level: 'B1', point: 'reveal', seg: [204.3, 228.0],
      stem: 'How does April finally learn the secret?',
      choices: ['It’s announced to the whole group', 'Andy blurts it out to the whole group',
                'Larry lets it slip while complaining'], a: 0,
      cue: '「Okay」のあと、誰に向けて話が始まるか。',
      line: 'Everybody, if you could *gather around*. … The truth is, I’m pregnant.',
      said: 'アンディが話す直前に、レスリーが皆を集めて「実は妊娠したの」と発表する。',
      mean: 'アンディは結局言わずに済み、秘密は全員の前で本人の口から明かされる。',
      trap: '「話すよ、準備いい？」の流れで、彼が言うと思いやすい。直後の Everybody が全員への合図。',
      use: 'Everybody, can I have your attention?（皆さん、ちょっと聞いてください）' },

    // R fix: V2 (blind 60 %): "redo the samples" was weak; now "too late", from “It doesn't matter”
    //   (I avoided "the test was a cover story": that's true too, so it would be a second key)
    // why: bad results ← “the results of the soil samples” is the last full phrase about the work; too late ← "It
    //   doesn't matter" heard as "it came too late"
    { id: 'i4', skill: 'infer', level: 'C1', point: 'ruse', seg: [209.8, 221.3],
      stem: 'What does Leslie’s reply to Larry tell him about his long night?',
      choices: ['All his work last night was for nothing', 'His work all night came too late to help',
                'The soil test results came back bad'], a: 0,
      cue: '「It doesn’t matter, Larry」のあとの一文。',
      line: 'It doesn’t matter, Larry. It was a *pointless ruse* designed to waste time.',
      said: 'ラリーに「関係ない。時間かせぎの作り話だった」と返す。',
      mean: 'ruse ＝ だますための作り話。検査は口実で、ラリーの徹夜はむだだった。',
      trap: 'doesn’t matter を「もう遅い」と取りやすい。pointless と waste time で判断。',
      use: 'It was just an excuse to see you.（君に会うための口実だったんだ）' },

    // why: sorry ← he had just said “I'm gonna tell you… it's super juicy”, so missing the telling could sting;
    //   shocked ← a loud cry right after big news often means surprise
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'proud', seg: [223.2, 228.05],
      stem: 'Right after the big news, how does Andy react?',
      choices: ['Proud of himself for keeping it', 'Sorry he never got to tell it', 'Shocked, as if he never knew'], a: 0,
      cue: '発表の直後、Yes で始まる声。',
      line: '*Yes, I did it!* Kept a secret.',
      said: '発表を聞いて、アンディが「やった！秘密を守れた」と叫ぶ。',
      mean: 'I did it ＝ やりとげた。最後まで秘密を守りきれたことを、自分で喜んでいる。',
      trap: '大きな声は驚きにも聞こえる。I did it のあとに、何をやりとげたかが続くので、そこまで聞く。',
      use: 'I did it! I passed!（やった！受かった！）' },

    // anchor: 228.1–234.3 s “I'm sure you will both raise a wonderful child” (praise, with no “but”) + “with whom I
    //   will profoundly disagree on nearly everything” (a forecast: the child will take after its parents, not him)
    // why: doubts them as parents ← “profoundly disagree” heard as a dig at the couple; hopes it thinks like him ← the
    //   right warmth, the wrong direction (“will disagree” is a forecast, not a wish to win the child over)
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'ron', seg: [227.6, 234.9],
      stem: 'Which plain-English version keeps what the congratulations really mean?',
      choices: ['“Your kid will be great, and will think like you, not me.”',
                '“I doubt you two will make good parents, but congrats.”',
                '“Your kid will be great, and I hope it thinks like me.”'], a: 0,
      cue: '「wonderful child」のあと、with whom 以下。',
      line: 'I’m sure you will both raise a *wonderful child* with whom I will *profoundly disagree* on nearly everything.',
      said: '「お二人ならすばらしい子を育てる。私とはほぼすべてで意見が合わない子をね」と祝う。',
      mean: 'ほめ言葉に but がない。親に似た考えに育つと読んで「私とは合わない」と言う、彼なりの祝福。',
      trap: 'disagree が親への皮肉に聞こえやすい。ほめ言葉のあとに but が来るか聞く。来なければ本気。',
      use: 'Congrats. Your kid will be smarter than me.（おめでとう。君の子は僕より賢くなるよ）' },

    // R fix: V2 (blind 55 %): "changes the subject" was weak; now agreeing and moving on to her worries, which do come
    //   right after
    // why: turns down the wishes ← “Well, actually” often opens a polite no; agrees, then worries ← "this is crazy" and
    //   "freaked out" heard as her real topic
    { id: 'm2', skill: 'marker', level: 'B2', point: 'plural', seg: [234.9, 239.6],
      stem: 'When Leslie answers the congratulations, what does her opening do?',
      choices: ['It gently corrects what was just said', 'It politely turns down the good wishes',
                'It agrees, then moves on to her worries'], a: 0,
      cue: '「a wonderful child」への返事の最初。',
      line: '*Well, actually*, uh, and this is crazy, but it’s *children*. Plural.',
      said: '「実はね、信じられないけど、子どもたち。複数なの」と言う。',
      mean: 'Well, actually は相手の言葉をやんわり直す前置き。child を children に直している。',
      trap: '断りの前にも使う形だが、ここは直すため。どの語が言い直されるか聞く。',
      use: 'Well, actually, it’s my second time here.（実は、ここは2回目なんです）' },
  ]
};
