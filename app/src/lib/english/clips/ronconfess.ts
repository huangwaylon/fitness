// REVIEW 2026-11-16: pass 7, fix 15, drop 0, new 0; ear checks 1
// Q: nt2's stem quotes “unthinkable decision”, which only the captions have (ear check below).
// “Ron's Terrible Confession | Parks and Recreation” (the official Parks and Recreation channel, Season 7): stuck and
// soaked with Leslie, Ron is pushed to explain how their old team broke up; a flashback shows Leslie standing him up
// for lunch, and back in the room she works out he had meant to ask her for a job, apologizes, and Ron says what he
// regrets.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈228 s; music to 250 s. 78–228 s is the
// same scene as PzYF03_w3WE (bank `ronlunch`); this bank leans on the new first 78 s and on lines that bank doesn't
// ask about. Untested: 45 s (whisper “factotum”, captions “fact to him”: h1's line trims it), 68.6 s (whisper “She
// didn't recognize”, captions “just didn't recognize”: i2's key words agree), 85–96 s (“Larry / It's Terry now”, the
// phone call: show trivia, “for Everett” vs “for everyone”), 186.3 s (“I'm sure I love…” in both: a3's line starts
// after it), 203–208 s (Morningstar, the nurse's house: backstory), 225.5 s (“there's a way to fix that”: what way
// isn't said in the clip).
// EAR CHECK: 74.7–77.8 s nt2 — captions “so I made a decision… an unthinkable decision”, whisper only “So I made a
//   decision.” The stem quotes “unthinkable decision”; if it isn't said, reword the stem to “a hard decision”.
import type { Clip } from '../types.ts';

export const ronConfession: Clip = {
  id: 'ronconfess', video: 'yVjnidcT2ts', title: 'Ron’s Terrible Confession', dur: 250, wpm: 143, band: 'slow',
  tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 + K7, "change clothes" was a filler and the key the longest; "the fight" (named later in the clip)
    //   replaces it
    // why: the fight ← "the fight we had" comes later in the clip, heard as what she wants out of him; angry at her ←
    //   "You left" right after the question, heard as a grudge he must admit
    { id: 'g1', skill: 'gist', level: 'B2', point: 'stuck', reveals: ['spill'], seg: [0, 39.4],
      stem: 'What is Leslie pushing Ron to do in this opening scene?',
      choices: ['Explain what happened to their old team', 'Say sorry for the fight they had',
                'Admit he is angry at her for leaving'], a: 0,
      cue: '「nowhere to run」のあと、最後の質問。',
      said: '逃げ道はないと迫り、職場の仲間に何があったのかを聞く。',
      mean: 'タオルや服の話は前置き。本題は、仲間がいなくなった理由を聞き出すこと。',
      trap: 'I feel extremely angry が強く響くが、それは服への一言。最後の質問が場面の目的。',
      use: 'There’s nothing to do but talk.（もう話すしかないよ）' },

    // R fix: V2, "Leslie thought they'd suit him" was easy to rule out; "Craig left them" (the name said) replaces it
    // why: a yoga class ← "Craig is studying yoga" heard as the reason he's in them; Craig left them ← "Craig" + "these"
    //   heard as a loan (refuted: "the only dry clothes I could find")
    { id: 'd1', skill: 'detail', level: 'B1', point: 'clothes', seg: [7.0, 14.3],
      stem: 'Why is Ron wearing these clothes?',
      choices: ['They were the only dry ones around', 'He was about to do a yoga class', 'They’re the ones Craig left for him'], a: 0,
      cue: '「Craig」の文の、次の文。',
      line: 'These are *the only dry clothes* I could find.',
      said: '「クレイグはヨガをやってるみたい。乾いた服はこれしかなかった」と言う。',
      mean: '乾いている服はこれだけ。ヨガ服なのは、それがクレイグの物だから。',
      trap: 'yoga が先に聞こえるので、ヨガをする話と取りやすい。理由は次の文の only のあと。',
      use: 'This is the only seat I could find.（空いてる席はここしかなかった）' },

    // why: pleased ← "you look great" read as a compliment he enjoys; shy ← the Japanese frame: a man in odd clothes
    //   feels 照れ
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'angry', seg: [12.9, 18.8],
      stem: 'When Leslie says he looks great, how does Ron feel?',
      choices: ['Furious about the outfit', 'Pleased by the compliment', 'Shy but secretly amused'], a: 0,
      cue: '「you look great」への返事、feel のあと。',
      line: 'Well, you look great. — I feel *extremely angry*.',
      said: '「似合ってるよ」と言われ、「非常に腹が立っている」と答える。',
      mean: '気持ちをそのまま言葉で言う、ロンらしい返事。ほめ言葉は全く響いていない。',
      trap: '照れ隠しと取りやすいが、言葉どおり怒っている。だから次に「すねないの」と言われる。',
      use: 'Honestly, I feel a little annoyed.（正直、ちょっとイラっとしてる）' },

    // R fix: V2, "how often she helped" was a filler; "how far back they go" (the wrong implication of a shared past)
    //   replaces it
    // why: making fun ← the eyebrows and mustache heard as jokes about his looks; far back ← "I've seen you…" heard as
    //   nostalgia (refuted: it ends in "nowhere to run… nothing to do but talk")
    { id: 'i1', skill: 'infer', level: 'C1', point: 'seenall', seg: [18.7, 30.0],
      stem: 'Why does Leslie list the eyebrows and the missing mustache?',
      choices: ['To show nothing about him could shock her', 'To make fun of how he looked back then',
                'To show how far back their friendship goes'], a: 0,
      cue: '並べたあとのまとめの一言と、その次。',
      line: 'I’ve seen you with your eyebrows blown off… *I’ve seen it all*.',
      said: '「眉毛が吹き飛んだ姿も、ひげのない姿も見た。全部見てきた」と言う。',
      mean: '恥ずかしい姿はもう全部知っている、だから隠さず話して、という前置き。',
      trap: '昔の姿を並べるので、からかいに聞こえやすい。seen it all と「話すしかない」につなげる。',
      use: 'Relax, I’ve seen it all before.（大丈夫、そんなの見慣れてる）' },

    // R fix: V2, "forget the whole thing" contradicted her pushing; "admit what he did wrong" (spill = 白状) is a
    //   closer miss
    // why: clean up ← "spill" = こぼす, and they're both soaking wet; admit fault ← "spill it" as 白状して, read as a
    //   confession of guilt (she asks what happened, not who's to blame)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'spill', seg: [29.6, 39.4],
      stem: 'After her question about his coworkers, what does Leslie tell Ron to do?',
      choices: ['Tell her everything', 'Clean up the mess', 'Admit what he did wrong'], a: 0,
      cue: '「Hm?」のあと、短い命令。',
      line: 'What happened to these workplace proximity associates? Hm? *Spill it*.',
      said: '「職場の近くにいた仲間たちに何があったの？ほら、話して」と促す。',
      mean: 'Spill it ＝ 隠さずに全部話して。中身をこぼすイメージ。',
      trap: 'spill を「こぼす」と取ると、ぬれた服の話に聞こえる。命令の Spill it は「白状して」。',
      use: 'Come on, spill it. Who called?（ほら、白状して。誰からの電話？）' },

    // R fix: V2, "to annoy Ron" was weak; "mindless" in the wrong relation (his wish, not her need) replaces it
    // why: his wish ← "mindless" caught but tied to Terry; top praise ← "the best there is" heard without "mindless"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'mindless', seg: [39.4, 50.1],
      stem: 'Why does Leslie’s reason for taking Terry get a laugh?',
      choices: ['She praises him as the best at mindless work', 'She jokes he only wanted a mindless job',
                'She calls him the best worker she has ever had'], a: 0,
      cue: '「we needed a」のあとの形容詞。',
      line: 'we needed a *mindless*… and *he’s the best there is*. — Amen.',
      said: '「頭を使わない雑用係が必要で、彼はその道の最高峰」と言い、ロンも賛成。',
      mean: 'ほめ言葉の形でテリーをけなしている。ロンの Amen は「まったくだ」。',
      trap: 'the best だけ聞くとほめ言葉に聞こえる。直前の mindless が何の最高かを決める。',
      use: 'She’s the best there is at this.（この分野では彼女が一番）' },

    // why: a week ← "a" + a short word heard as "week"; a year ← "later" heard as a long gap
    { id: 'n1', skill: 'number', level: 'B1', point: 'month', seg: [39.4, 50.1],
      stem: 'How long after Leslie left did Terry go too?',
      choices: ['A week later', 'A month later', 'A year later'], a: 1, keep: true,
      cue: '「You left」のあと、Then に続く部分。',
      line: 'You left. Then *a month later* you took Terry with you.',
      said: '「君が辞めた。その1か月後、テリーも連れていった」と言う。',
      mean: 'a month later ＝ 1か月後。一人ずつ抜けていった順番を語り始めている。',
      trap: 'month の th は弱く、週か月か迷いやすい。month は口を閉じた「マ」で始まる。',
      use: 'A month later, I moved to Boston.（1か月後、ボストンに引っ越した）' },

    // C2: what he is trying not to say
    // anchor: 52.8–62.7 s "I didn't want her to go, as she had become one of my closest workplace acquaintances… so I
    //   didn't try to stop her": "didn't want her to go" and "closest" name a friendship the label avoids
    // R fix: V2, "angry at Leslie" was a far miss; "begged her to stay" (right feeling, wrong action) is the near miss
    // why: begged ← "didn't want her to go" carried on to an action (refuted: "so I didn't try to stop her"); glad ←
    //   "too good to pass up" heard as Ron's approval of the move
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'acquaint', seg: [50.1, 63.0],
      stem: 'Calling April a “workplace acquaintance,” what is Ron trying not to say?',
      choices: ['That she was a dear friend he missed', 'That he begged her to stay, but she left',
                'That he was glad she took the new job'], a: 0,
      cue: '「closest」と、その前の「行ってほしくなかった」。',
      line: 'I didn’t want her to go, as she had become one of my *closest workplace acquaintances*.',
      said: '「行ってほしくなかった。職場で最も親しい知人の一人になっていたから」と言う。',
      mean: '「友だち」と言わずに堅い言葉で包むのがロン流。closest と「行ってほしくない」が本心を示す。',
      trap: 'acquaintance を「ただの知り合い」と取りやすい。堅い言葉の横にある気持ちの言葉を拾う。',
      use: 'He’s, uh, a close colleague. Fine, a friend.（えっと、親しい同僚。…友だちだよ）' },

    // R fix: V2, "someone so young" was the odd one out; "put off" (a near phrasal verb) replaces it
    // why: too good to be true ← the more familiar "too good to…" ending; put off ← pass up / put off, two short
    //   phrasal verbs that blur
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'passup', seg: [52.4, 63.0],
      stem: 'How does Ron describe Leslie’s job offer to April?',
      choices: ['Too good for April to turn down', 'Too good to be completely true', 'Too good for April to put off'], a: 0,
      cue: '「too good to」のあとの2語。',
      line: 'your offer was *too good to pass up*, so I didn’t try to stop her.',
      said: '「君の誘いは断れないほど良かったから、止めなかった」と言う。',
      mean: 'pass up ＝ 機会を見送る。「逃すには惜しすぎる」。',
      trap: 'too good to be true（話がうますぎる）と混ざりやすい。to のあとの動詞まで聞く。',
      use: 'This deal is too good to pass up.（このセール、見逃せない）' },

    // why: joined Leslie ← the pattern "you took Terry… you took April" carried on; one shop ← "hers" missed, so it
    //   sounds like one business together
    // R fix: V2/K6, only the key had "each"; the Leslie distractor now shares it
    { id: 'd2', skill: 'detail', level: 'B2', point: 'business', seg: [62.8, 67.2],
      stem: 'Why did Tom and Donna leave?',
      choices: ['Each left to run a business of their own', 'Each left to go and work for Leslie',
                'They left to start a business together'], a: 0,
      cue: '二人目の文の、最後の短い一語。',
      line: 'Then Tom left to run *his* business. Donna left to run *hers*.',
      said: '「トムは自分の店のため、ドナも自分の事業のために辞めた」と言う。',
      mean: 'his と hers で、それぞれ別の事業だと分かる。レスリーに引き抜かれたのではない。',
      trap: '前の二人と同じ流れでレスリーの所へと思いやすい。hers は短く弱いが「彼女自身の」。',
      use: 'She left to start her own company.（自分の会社を始めるために辞めた）' },

    // R fix: V2, "losing his memory" was a weak literal; "emptied out" (scope: nobody vs strangers) is a closer miss
    // why: empty ← "everyone left" carried to "no one there" (refuted: he didn't recognize anyone, so people were
    //   there); changed ← "anyone" heard as his old friends looking different
    { id: 'i2', skill: 'infer', level: 'B2', point: 'recognize', seg: [66.9, 74.5],
      stem: 'What does Ron mean by what he saw when he “looked up”?',
      choices: ['The office was full of new faces', 'The office had emptied out completely', 'His old friends had changed a lot'], a: 0,
      cue: '「looked up」のあと、anyone の意味。',
      line: 'One day I looked up, *just didn’t recognize anyone*.',
      said: '「ある日ふと顔を上げたら、知っている顔が一人もいなかった」と言う。',
      mean: '仲間が次々に辞め、周りが知らない人ばかりになったということ。',
      trap: '皆が辞めたから誰もいない、と取りやすい。recognize できない人がいる＝知らない顔がいる。',
      use: 'I didn’t recognize anyone at the party.（パーティーに知ってる人がいなかった）' },

    // why: 12:00 ← "twelve" caught, "thirty" lost; 2:30 ← "two" in the air from “too long”
    { id: 'n2', skill: 'number', level: 'B1', point: 'time', seg: [100.9, 109.3],
      stem: 'What time do they agree to meet for lunch?',
      choices: ['12:00', '12:30', '2:30'], a: 1, keep: true,
      cue: '店の名前のすぐあと。',
      line: 'JJ’s Diner, *12:30*. — Excellent. See you then.',
      said: '「JJ’s ダイナーで12時半」と決め、ロンが「では、その時に」と答える。',
      mean: '12:30 は twelve thirty と読む。お店と時間だけの短い約束。',
      trap: '最後の thirty が弱いと12時ちょうどに聞こえやすい。時刻は後半の数字まで聞く。',
      use: 'Lunch tomorrow? Twelve thirty works.（明日ランチ？12時半なら大丈夫）' },

    // R fix: V2, "Ron cancels" was refuted by "I waited for a while"; the phone call about the vote is a closer miss
    // why: kids ← "pick up the kids" is said, but as a request to her husband; a call ← the phone call about the vote
    //   fills the scene (refuted: "they need us in Washington")
    { id: 'g2', skill: 'gist', level: 'B1', point: 'missed', seg: [109.3, 141.8],
      stem: 'Why does Leslie miss her lunch with Ron?',
      choices: ['She rushes off to Washington for a vote', 'She has to go and pick up her kids',
                'She’s stuck on a long call about the vote'], a: 0,
      cue: '「Randy says」のあと、行き先。',
      line: 'they need us *in Washington* to prep… — Oh, no. Ron, I *stood you up* for lunch.',
      said: '議会の採決で急にワシントンへ飛び、あとで「ランチをすっぽかした」と気づく。',
      mean: '約束の翌日に急な出張が入り、連絡もせずに行ってしまった。',
      trap: 'pick up the kids は夫への頼みで、本人の用事ではない。理由は Washington の話。',
      use: 'Sorry, something came up at work.（ごめん、仕事で急用が入って）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'flight', seg: [114.0, 119.7],
      stem: 'Type the request: “Get us the ___.” (5 words)', answer: 'first flight out of here',
      cue: '「Okay,」のあと、Get us the に続く部分。',
      line: 'Okay, get us the *first flight out of here*…',
      said: '「ここを出るいちばん早い便を取って」と頼む。',
      mean: 'first flight out ＝ いちばん早く出る便。out‿of がつながり「アウラ」に近い。',
      trap: 'out of が「アウラ」と縮むと、1語に聞こえやすい。of は弱くても必ずある。',
      use: 'I’ll take the first flight out tomorrow.（明日いちばんの便で行く）' },

    // R fix: V2, "wanna" was easy to drop for a trip she must make; "have to" fits as well as the key
    // why: have to ← the same meaning, "hafta" in fast speech; had to ← a past "had", its d lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotta', seg: [119.7, 124.5],
      stem: 'Fill the gap: “Hey, babe, I ___ go to Washington.”',
      choices: ['gotta', 'have to', 'had to'], a: 0,
      cue: 'babe のあと、I に続く短い音。',
      line: 'Hey, babe, I *gotta* go to Washington.',
      said: '夫に「ワシントンに行かなきゃ」と電話する。',
      mean: 'gotta ＝ got to（have to）。t が弾んで「ガラ」に近い。急ぎの用事の言い方。',
      trap: 'have to なら「ハフタ」と f が残る。had to は過去。「ガラ」は gotta。',
      use: 'I gotta pick up the kids.（子どもを迎えに行かなきゃ）' },

    // C2: what the "unthinkable decision" was (cf. 72–78 s)
    // anchor: 149.6–159.8 s "I was going to ask you for a job. In the federal government. Just saying it out loud feels
    //   dirty.": the add-on and "dirty" say what made the decision unthinkable
    // R fix: V2, "leaving town" was refuted by "the third floor" and the key was the only one about the job itself;
    //   "needing her help" (the right act, the wrong sore point) replaces it
    // why: her help ← asking a former colleague for a job heard as the pride problem (refuted: the add-on is "In the
    //   federal government", and that is what "feels dirty"); the fight ← a later line ("the fight we had") heard as
    //   the hard part
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'unthink', seg: [147.9, 160.1],
      stem: 'Why was asking Leslie for a job an “unthinkable decision” for Ron?',
      choices: ['It meant working for the government', 'It meant admitting he needed her help', 'It meant apologizing for their fight'], a: 0,
      cue: '「for a job」のあとの付け足しと、feels。',
      line: 'I was going to ask you for a job. *In the federal government.* Just saying it out loud *feels dirty*.',
      said: '「仕事を頼むつもりだった。連邦政府でだ。口に出すだけで汚れた気分になる」と言う。',
      mean: '「考えられない決断」とは、政府嫌いの自分が政府で働かせてと頼むこと。付け足しと dirty が中身を明かす。',
      trap: '人に頼む気まずさの話と取りやすい。本題のあとの付け足しと dirty に答えがある。',
      use: 'Just saying it out loud feels weird.（口に出すだけで変な感じ）' },

    // R fix: V2, the key was the only kind choice; "felt the same" (the Japanese 私も frame) replaces "hard to believe"
    // why: no idea ← "can't even imagine" read literally as "I don't understand"; the same ← empathy as 私も同じ
    //   (refuted: "can't even imagine" says she didn't go through it)
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'imagine', reveals: ['acquaint'], seg: [160.1, 170.3],
      stem: 'After guessing Ron missed his friends, what is Leslie doing with her next line?',
      choices: ['Showing she feels for what he went through', 'Admitting she has no idea how he felt',
                'Saying she felt the same after leaving'], a: 0,
      cue: '「can’t even imagine」のあと、hard の部分。',
      line: 'I *can’t even imagine how hard* that must have been *for you*.',
      said: '「仲間が恋しかったのね。どれほどつらかったか」と言う。',
      mean: '相手のつらさに寄りそう決まった言い方。分からないという意味ではない。',
      trap: 'can’t imagine を「分からない」と文字通り取りやすい。how hard と続けば共感の言葉。',
      use: 'I can’t imagine how tired you must be.（どれだけ疲れてるか…大変だったね）' },

    // why: annoyed at Ron ← "why didn't I see that" heard as "why didn't you tell me"; shocked ← "God" heard as shock at
    //   the news itself
    // R fix: S1/V2, "asks herself why she didn't see it" gave the key (self-blame); the stem now quotes up to the subject
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'blame', seg: [170.0, 177.3],
      stem: 'When Leslie starts with “God, why didn’t…”, how does she feel?',
      choices: ['She blames herself for missing it', 'She is annoyed Ron kept it hidden', 'She is shocked he wanted the job'], a: 0,
      cue: '「why didn’t」のあとの主語と、謝り方。',
      line: 'God, *why didn’t I see that*? … *I should have been* a better friend to you.',
      said: '「どうして気づかなかったの。本当にごめん。もっといい友だちでいるべきだった」と言う。',
      mean: '主語は I。ロンを責めず、気づけなかった自分を責めている。',
      trap: '「なぜ言ってくれなかったの」と聞こえやすいが、主語は I。',
      use: 'I should have called you sooner.（もっと早く電話すべきだった）' },

    // why: a hard truth ← "honestly" as a lead-in to a frank criticism (正直に言うと…); an old lie ← "honestly" heard as
    //   "to be honest, I wasn't before"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'honestly', seg: [177.3, 186.1],
      stem: 'When Ron answers her apology, what does his first word signal?',
      choices: ['He means it and isn’t just being polite', 'He is about to tell her a hard truth',
                'He is admitting he wasn’t honest before'], a: 0,
      cue: '謝罪への返事、文頭の一語と it’s fine。',
      line: '*Honestly*, Leslie, it’s fine.',
      said: '謝るレスリーに「本当に、いいんだ」と答える。',
      mean: 'Honestly ＋ it’s fine で「社交辞令ではなく、本当に気にしていない」。',
      trap: '日本語の「正直に言うと」は厳しい話の前置きになりやすいが、ここは安心させる言葉の前。',
      use: 'Honestly, don’t worry about it.（本当に、気にしないで）' },

    // why: the cause ← "punctuation mark" heard as the event that ended things; a hurt ← "mark" heard as a scar it left
    { id: 'i4', skill: 'infer', level: 'C1', point: 'punct', seg: [177.3, 186.1],
      stem: 'What does Ron say the missed lunch meant for his decision to leave?',
      choices: ['Nothing new; he had already made up his mind', 'It was the one thing that made him decide',
                'It left a small hurt that he still feels'], a: 0,
      cue: '「sentence」のあとに続く部分。',
      line: 'It was a *punctuation mark* on a sentence that had *already been written*.',
      said: '「もう書き終わった文に打った句読点だ」と言う。',
      mean: '決心はもうついていて、ランチは最後の点にすぎない。彼女のせいではない。',
      trap: 'mark を決め手と取りやすいが、already been written が「先に決まっていた」を示す。',
      use: 'My mind was already made up.（もう心は決まってた）' },

    // why: sincere ← "beautiful" taken at face value as praise; hurt ← "rotting beast" heard as an insult to her work
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'metaphor', seg: [185.9, 192.7],
      stem: 'When Leslie praises his metaphors, what is she really doing?',
      choices: ['Teasing him about how gross the image is', 'Admiring the way he puts things into words',
                'Showing she is hurt by what he called her job'], a: 0,
      cue: '直前のたとえの中身と、「so beautiful」。',
      line: 'bleeding *the rotting beast* from the inside. — Your metaphors are *so beautiful*.',
      said: '政府を「腐った獣」にたとえるロンに「たとえが美しいわね」と返す。',
      mean: '中身はひどいのに「美しい」とほめる皮肉。怒ってはおらず、いつもの調子でからかう。',
      trap: 'beautiful を文字通りのほめ言葉と取りやすい。ほめ言葉と中身の差が大きければ皮肉。',
      use: 'Wow, what a lovely way to put it.（まあ、なんて素敵な言い方）' },

    // R fix: V2, "a share of the deal" was weak; "the building plans" (the development just named) replaces it
    // why: a nod ← "heads up" as 顔を上げる; plans ← "took on the… development" heard as something to show her
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'headsup', seg: [198.2, 212.8],
      stem: 'What does Ron regret not giving Leslie before the bulldozing?',
      choices: ['A warning ahead of time', 'A friendly nod in person', 'A look at the building plans'], a: 0,
      cue: '「not giving you a」のあとの2語。',
      line: 'the fight we had, not giving you *a heads-up* when my company took on… *I do regret that*.',
      said: '「ケンカも、開発の件を前もって伝えなかったことも悔やんでいる」と言う。',
      mean: '会社の件を前もって伝えなかった後悔。do は「本当に」と強める。',
      trap: 'heads up を「顔を上げる」と取りやすい。a heads-up は「事前の知らせ」。',
      use: 'Thanks for the heads-up!（前もって教えてくれてありがとう）' },
  ]
};
