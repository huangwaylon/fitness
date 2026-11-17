// “Carly and Freddie EXPOSED On Reality TV 🎥 | Full Scene | iCarly” (NickRewind, Best of the New iCarly): a
// director tries to film drama for a reality show starring Carly and Freddie: a staged peanut butter fight, a therapy
// story, aerial silks, “receipts”, until someone walks out.
// Segments from the captions, words from whisper (2026-11-17). Speakers are named only by address (“Carly, Sunny”,
// “Sunny, no”, “Freddy”), so no key rests on a face. The person who calls “Cut”, says “use that anxiety to fuel your
// confrontation” and “That's going on the sizzle reel” is called “the director” in stems, from those words. Items
// avoid the lines the sources split on or leave out: 54.7 s (“Cut”), 95–99 s, 118–125 s (“I was a dinosaur” / “I'm
// sore”, “you two sure…”), 177.4 s (“make that two” / “too”), 225–229 s, 240.6 s (“he told me” / “you told me”), 259 s
// (“tackle” / “Taco Pearl”). Skipped as visual: 78–83 s (the fingers), 182–188 s and 216–224 s (the silks, the twist).
// EAR CHECK: 73.9–74.5 s s1 — “writers” (both sources): the t really flaps, so it sounds close to “riders”
// EAR CHECK: 176.2–177.1 s x3 — “Can I get a” (both sources): the four words run together, the t of “get” flaps
// EAR CHECK: 211.9–213.2 s nt2 — “that should have been” (both sources): all four words weak, ≈ 220 wpm
// REVIEW 2026-11-17: pass 6, fix 15, drop 1, new 0; ear checks 3
// OPEN: s1 — writers/riders differ only by vowel length after the flap; if the phone check finds them identical,
//   the item is a context item, not a sound item (the stem no longer gives the context).
// OPEN: nt1 — its segment is 22.7 s (the whole Dr. Susan account it needs); trim or drop if C2 is held to 15 s.
import type { Clip } from '../types.ts';

export const realityExposed: Clip = {
  id: 'realityexpo', video: 'fV1QHT3uxbM', title: 'Carly and Freddie EXPOSED On Reality TV 🎥 | Full Scene',
  dur: 284, wpm: 121, band: 'slow', tags: ['職場', '友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: N7 — said shows the "hit me" suggestion, so g1 reveals 'hitme'.
    // R fix: V2 (blind 75 %: "a fight, on camera" was the only reality-TV want; the Freddie confession is outside the
    //   segment). Three reality-TV wants now, each refuted by "real conflict" / "more drama"; said no longer pins
    //   "more drama" on the director (it's the other cast member's line).
    // why: confession ← reality-TV script, and "feelings for Freddy" comes later; sweet moment ← "do we live
    //   together? That's fun" is said, warmly, but as a dodge
    { id: 'g1', skill: 'gist', level: 'B1', point: 'conflict', reveals: ['hitme'], seg: [14.5, 51.5],
      stem: 'In the opening, what does the person running it want from Carly and Sunny?',
      choices: ['Real conflict between the two of them', 'A tearful confession from one of them',
                'A sweet moment between the two of them'], a: 0,
      cue: '名前を呼んだ直後と、少しあとの「no」のあと。',
      said: '「もう一回。本物の対立を」と言われ、「もっとドラマを」と、たたくよう持ちかける。',
      mean: 'リアリティ番組らしい、けんかの場面を撮りたい。',
      trap: 'live together の明るい返事は、けんかをかわしただけ。狙いは conflict と drama。',
      use: 'Let’s try this one more time.（もう一回やってみよう）' },

    // R fix: N7 — the old trap ("喜ぶ一言") gave away a3's key; reworded.
    // R fix: K1/K2 — "the director is thrilled" is true ("everything I look for", "sizzle reel"), so the old
    //   distractor was half right; it now claims the shoot wraps, which "Let's do it again" and "I am done with this"
    //   refute. Blind 55 %.
    // why: fights for real ← "sizzle reel" and "tackle" late in the scene sound like a win for the director; relax ←
    //   "a fun and relaxing activity" is said, but it's a setup for more conflict
    { id: 'g2', skill: 'gist', level: 'B2', point: 'scene', seg: [14.5, 277.5],
      stem: 'Across the whole scene, how do the director’s efforts turn out?',
      choices: ['The setups get sillier until one of the cast walks out',
                'The cast ends up fighting for real, so filming wraps',
                'The director drops the drama and lets them relax'], a: 0,
      cue: '最初の頼み、途中の活動、最後のひと言の流れ。',
      said: '口げんか、身の上話、布の空中芸と、次々に仕掛けが続き、最後は誰かが「もうやめる」と言う。',
      mean: 'ドラマを無理に作るほど、場面がばかばかしくなる。',
      trap: 'relaxing は次の仕掛けの前置き。「もう一回」が続き、撮影も終わらない。',
      use: 'I’m done with this.（もうこれ以上はやらない）' },

    // R fix: V2 (blind 60 %: the empty-jar complaint was the only one about the jar being empty). All three are now
    //   "put back" stories; "so I thought there was more, but there wasn't" settles it.
    // why: wrong cabinet ← "back in the cabinet" heard, the point (empty) missed; no lid ← "put the jar back" + a
    //   kitchen complaint script
    { id: 'd1', skill: 'detail', level: 'B1', point: 'jar', seg: [26.3, 34.8],
      stem: 'In the peanut butter complaint, what exactly went wrong?',
      choices: ['The empty jar was put back in the cabinet', 'The jar was put back in the wrong cabinet',
                'The jar was put back without its lid on'], a: 0,
      cue: '「cabinet」のあと、「So I thought」に続く部分。',
      line: 'You ate the last of the peanut butter and then *put the jar back*… So I thought *there was more*',
      said: '最後まで食べたのに、びんを戸棚に戻した。まだあると思ったら、なかった。',
      mean: '空のびんを戻されると、残っていると勘違いする。よくある同居の不満。',
      trap: 'cabinet が耳に残ると場所の話に聞こえる。So のあとの「あると思ったのに」が不満の中身。',
      use: 'Please put it back when you’re done.（使ったら戻してね）' },

    // why: mocks the complaint ← a cheerful reply to a small grievance heard as sarcasm; dodges the blame ← the
    //   Japanese frame: changing the subject to avoid an apology
    // R fix: V2/K6 (blind 55 %: "made-up premise … not a fight" was the only nuanced, scene-aware choice). The key is
    //   now as plain as the distractors.
    { id: 'h1', skill: 'humor', level: 'C1', point: 'live', seg: [26.3, 38.8],
      stem: 'What makes the reply to the peanut butter complaint funny?',
      choices: ['It shows she’s hearing the roommate story for the first time',
                'It mocks the complaint for being about something so tiny',
                'It dodges the blame by quickly changing the subject'], a: 0,
      cue: '返事の最初の質問と、そのあとのひと言。',
      line: 'Oh, *do we live together?* That’s fun.',
      said: '「え、私たち一緒に住んでるの？楽しいね」と返す。',
      mean: '同居という設定はでっち上げ。しかも怒らずに喜ぶので、けんかが始まらない。',
      trap: '小さな不満への明るい返事は皮肉にも聞こえるが、ここは本当に知らなかった、という返し。',
      use: 'Wait, since when do we do that?（え、いつからそうなってたの？）' },

    // why: real question ← "why" taken literally (なぜ); complaint ← "just" heard as blame, as in "why didn't you just"
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'hitme', seg: [38.9, 51.5],
      stem: 'After “we need more drama”, what kind of move comes next?',
      choices: ['A suggestion: just go ahead and do it', 'A question: why the other one won’t fight',
                'A complaint: it should have been done already'], a: 0,
      cue: '「You know what?」のあと、Why で始まる文。',
      line: 'Sunny, no, we need more drama… *Why don’t you just* hit me one time, real quick?',
      said: '「ねえ、一回ちょっと私をたたいてみたら？」と持ちかけている。',
      mean: 'Why don’t you …? は理由を聞く文ではなく「〜したら？」という提案。',
      trap: 'why を「なぜ」と取ると質問に聞こえる。didn’t なら不満だが、ここは don’t で提案。',
      use: 'Why don’t you just ask her?（彼女に聞いてみたら？）' },

    // R fix: V2/S1 (blind 50 %: "actually" in the stem flagged a twist, and "silly" matched the show). Neutral stem,
    //   parallel choices.
    // why: a soft hit ← "I'll hit you" heard as a yes; acting lesson ← "character work" read as coaching
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'troll', reveals: ['hitme'], seg: [41.8, 51.5],
      stem: 'When asked for a hit, what does the reply offer?',
      choices: ['A comic bit in a made-up voice', 'A soft hit, just for the camera',
                'A quick lesson in playing a character'], a: 0,
      cue: '「I’ll hit you」のあと、少し間があって続く部分。',
      line: 'Oh, I’ll hit you… *with some character work*. Greetings from Troll Crossing.',
      said: '「たたくよ…キャラ芸でね」と言い、トロールの声であいさつする。',
      mean: 'hit you with ～ ＝「〜をお見舞いする」。たたく話をずらしている。',
      trap: 'I’ll hit you で切ると承知に聞こえる。with のあとまで聞く。',
      use: 'Let me hit you with some good news.（いい知らせがあるよ）' },

    // why: riders ← the flapped t makes "writers" sound like "riders"; waiters ← "wine throwing" pulls toward a
    //   restaurant
    // R fix: V2 (blind 50 %: "wine throwing" in the stem pointed at a reality-TV list); the stem stops at the gap.
    { id: 's1', skill: 'sound', level: 'B2', point: 'writers', seg: [69.9, 76.6],
      stem: 'Fill the gap: “We’re missing ___…”',
      choices: ['writers', 'riders', 'waiters'], a: 0,
      cue: '「missing」のすぐあと、リストの最初の語。',
      line: 'Every reality show has… we’re missing *writers*, wine throwing…',
      said: '「どの番組にもあるのに、うちにないもの。脚本家、ワイン投げ…」。',
      mean: 'writers の w は読まず、t は弾んで「ライラーズ」に近い。',
      trap: 'riders と音が近く、wine から waiters も浮かぶ。番組に欠けた物、という流れで決める。',
      use: 'The writers really nailed this episode.（この回の脚本は最高だね）' },

    // R fix: V2 (blind 60 %: "weakens the denial" was the only reading that fits the "but it's complicated" trope).
    //   Two choices now hint, one firms up; parallel form.
    // why: firm ← "complicated" heard as closing the topic for good; Freddie's side ← "feelings" + "Freddy" put
    //   together the other way
    { id: 'i6', skill: 'infer', level: 'B2', point: 'feelings', seg: [85.1, 91.2],
      stem: 'In the line about feelings for Freddie, what does its ending do?',
      choices: ['It hints the denial isn’t the whole story', 'It makes the denial sound firm and final',
                'It hints that Freddie is the one with feelings'], a: 0,
      cue: '否定の文のあと、but に続く短い部分。',
      line: 'I don’t have feelings for Freddy, *but it’s complicated*.',
      said: '「フレディに気持ちはない。でも複雑なの」と言う。',
      mean: 'but のあとが本音。「ない」と言い切れない、という含みになる。',
      trap: 'complicated は話を打ち切る言葉にも聞こえるが、but で前の否定を弱めている。but のあとに本音が来る。',
      use: 'I’m fine, but it’s complicated.（大丈夫。でもちょっと複雑で）' },

    // R fix: V2 (blind 55 %: the dinosaur was the only odd choice, so it had to be the key). Every choice has the
    //   dinosaur now; the verb settles it.
    // why: played one ← "re-placed" heard as "played", and "kids love dinosaurs" sounds like a role; co-star ←
    //   "replaced by" heard as "paired with"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'dino', seg: [110.8, 117.8],
      stem: 'According to the jab, what happened last time?',
      choices: ['A dinosaur took over their spot', 'They played a dinosaur on it', 'A dinosaur was their co-star'], a: 0,
      cue: '「last time」のあと、dinosaur の前の動詞。',
      line: 'Last time you *got replaced by a dinosaur*. — Oh, kids love dinosaurs.',
      said: '「前は恐竜に代えられたのに」とからかう。',
      mean: 'got replaced by ～ ＝「〜に取って代わられた」。前の番組を降ろされた皮肉。',
      trap: 'replaced の -placed が played に聞こえやすい。by のあとは代わりに来たもの。',
      use: 'I got replaced by a younger guy.（若い人に代えられた）' },

    // why: no flirting ← "feelings" + "Carly" turned into a rule for Carly; Dr. Susan approves ← her name and
    //   "session" make her sound in charge
    { id: 'd4', skill: 'detail', level: 'B2', point: 'condition', seg: [125.7, 139.8],
      stem: 'In the Dr. Susan story, what condition was set for doing the show?',
      choices: ['Freddie must have no feelings at all for Carly', 'Carly must promise not to flirt with Freddie',
                'Every scene must be approved by Dr. Susan'], a: 0,
      cue: '「I told Freddy」のあと、if で始まる部分。',
      line: 'if you’re sure you have *no feelings for Carly whatsoever*, we should do the show',
      said: '「カーリーに気持ちが全くないなら、番組に出よう」とフレディに言った。',
      mean: 'whatsoever は否定を強めて「全く〜ない」。条件はフレディの気持ち。',
      trap: 'Dr. Susan は話をした相手で、許可を出す人ではない。if のあとが条件。',
      use: 'No problems whatsoever.（何の問題もありません）' },

    // R fix: V2 (blind 50 %: after d4's condition, only distrust fit). Pride now uses "watching closely" too, so
    //   "arms crossed" is what decides; the cue points there.
    // why: pride ← "watching closely" alone sounds like a fan in the wings; patience ← "sit on the side" read
    //   literally as waiting for a turn
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'watch', seg: [125.7, 139.8],
      stem: 'What does the plan for scenes the speaker isn’t in show?',
      choices: ['Distrust: keeping a close watch on Freddie', 'Pride: enjoying every scene Freddie does',
                'Patience: waiting calmly for a turn on camera'], a: 0,
      cue: '「sit on the side」のあと、腕の様子と見方。',
      line: 'any scene I’m not in, I’ll sit on the side with my *arms crossed, watching closely*.',
      said: '「私が出ない場面は、横で腕を組んでじっと見てる」。',
      mean: '腕組みでじっと見る ＝ 疑って見張る態度。',
      trap: 'watching closely だけなら応援にも取れるが、arms crossed は警戒。体の様子の語まで聞く。',
      use: 'I’ll be watching closely.（しっかり見てるからね）' },

    // R drop: h3 (humor, 'therapy') — same point, segment and joke as nt1; its 22.7 s segment breaks the 3–15 s
    //   rule, and the stem ("pay for listening") gave the key away (blind 70 %).
    // anchor: 141–148.4 s the long account of “an emergency session with Dr. Susan”, then “Do I get $200 an hour
    //   for listening to that story?”: a fee for listening is a therapist's, so the line says the story was too much
    // R fix: V2/K6 (blind 60 %: the key was the only apology, and "pays by the week" the only flat no). One rewrite:
    //   the pay reading now apologises too, and the praise reading is warm; the anchor holds at ≥ 80 % with ears.
    // why: can't pay that much ← the question taken as a real one about the show's pay; hoped you'd like it ← the
    //   line heard as praise (the お礼 frame: "worth paying for")
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'therapy', reveals: ['fee'], seg: [125.7, 148.4],
      stem: 'Which reply from the storytellers would fit what the listener meant?',
      choices: ['Ha, sorry. We did go on a bit, huh?', 'Sorry, the show can’t pay you that much.',
                'Thanks! We hoped you’d like the story.'], a: 0,
      cue: '話の中身と長さ、そして「聞くこと」への料金。',
      line: 'Do I get *$200 an hour for listening* to that story?',
      said: 'カウンセリングの長い話を聞いた人が「聞いたら時給200ドル出るの？」と言う。',
      mean: '聞くだけで料金が出るのはカウンセラー。「重い話を長々と聞かされた」という皮肉で、苦笑いの謝りが合う。',
      trap: '質問の形なので給料の話やほめ言葉に取りやすい。返事は言葉の形でなく、相手のしたことに返す。',
      use: 'Sorry, that was way too much info.（ごめん、話しすぎたね）' },

    // R fix: S2/V2 (blind 80 %: the stem quoted the line under test, and a "no" was ruled out by the show going
    //   ahead). The stem names the moment; all choices now fit a show that goes ahead.
    // why: time to think ← "how can I…?" heard as hesitation; how to refuse ← "how can I…?" taken as asking for a
    //   way, and weak "can" can sound like "can't"
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'sayno', seg: [140.5, 143.8],
      stem: 'How was the condition for doing the show answered?',
      choices: ['With a yes: refusing was never an option', 'With a yes, after asking for time to think',
                'With a question: how to refuse without a fight'], a: 0,
      cue: '「To which I replied」のあと。答えを求める質問かどうか。',
      line: 'To which I replied, *how can I say no?*',
      said: '「それに僕は『断れるわけないだろ』と答えた」。',
      mean: '答えを求めない疑問文で、「もちろんいいよ」と承知している。',
      trap: '疑問の形でも答えは求めていない。考える時間も頼んでいない。can は弱く「クン」、can’t なら t の止めがある。',
      use: 'Free pizza? How can I say no?（タダのピザ？断れないよ）' },

    // why: $20 ← "two" heard, "hundred" lost in the weak middle; $2,000 ← a therapist's fee sounds big
    { id: 'n1', skill: 'number', level: 'B1', point: 'fee', seg: [143.9, 148.4], keep: true,
      stem: 'What hourly pay comes up right after the story?',
      choices: ['$20', '$200', '$2,000'], a: 1,
      cue: '「an hour」の直前の数字。',
      line: 'Do I get *$200 an hour* for listening to that story?',
      said: '「この話を聞いて、時給200ドルもらえるの？」と聞く。',
      mean: 'two hundred an hour ＝ 時給200ドル。',
      trap: 'hundred は弱く短くなりやすい。thousand なら「サウ」の音がある。数のあとの an hour まで聞く。',
      use: 'It’s twenty dollars an hour.（時給20ドルです）' },

    // R fix: V2 (blind 55 %: "more dramatic" echoed the reality-TV frame; "thinks they said relaxed" was weak). Three
    //   uses of nerves now, parallel; "fuel your confrontation" picks one.
    // why: careful up high ← "height of two to three feet" + a safety script; taking it seriously ← "Perfect" heard
    //   as praise for the cast's attitude
    { id: 'i2', skill: 'infer', level: 'B2', point: 'perfect', seg: [166.8, 175.6],
      stem: 'Why does the director answer “Perfect” to the cast’s nerves?',
      choices: ['The nerves can feed the fight being filmed', 'The nerves will keep them careful up high',
                'The nerves show they’re taking it seriously'], a: 0,
      cue: '「Perfect」のあと、anxiety を何に使うと言うか。',
      line: 'I do *not* feel relaxed. — Perfect… use that anxiety to *fuel your confrontation*',
      said: '「全然くつろげない」に「完璧。その不安を対決の燃料に」と返す。',
      mean: 'fuel ～ ＝「〜をあおる」。不安はけんかの場面に役立つ、という考え。',
      trap: 'height で安全の話に取りやすい。理由は use … to のあとの confrontation。',
      use: 'Use that energy to fuel your workout.（そのエネルギーを運動に回して）' },

    { id: 'x3', skill: 'dict', level: 'B1', point: 'helmet', seg: [175.7, 179.3],
      stem: 'Type the request: “___ helmet?” (4 words)', answer: 'can i get a',
      cue: '空中の話のすぐあと、短いお願い。',
      line: '*Can I get a* helmet?',
      said: '「ヘルメットもらえますか？」と頼む。',
      mean: 'Can I get a ～? は店でも使う、気軽なお願いの形。4語がつながって「キャナイゲラ」に近い。',
      trap: 'get の t が弾んで a とつながるので、語の数を少なく感じやすい。',
      use: 'Can I get a coffee to go?（コーヒーを持ち帰りで）' },

    // why: Freddie told it ← weak "she" vs "he", and the remark is about Freddy; it hurts ← "Wow" heard as shock
    { id: 'i3', skill: 'infer', level: 'C1', point: 'shetold', seg: [197.0, 207.5],
      stem: 'After the remark about being alone forever, what does the reply suggest?',
      choices: ['The words came from someone else', 'The words came from Freddie himself',
                'The words are true, and they hurt'], a: 0,
      cue: '「Wow」のあと、短い質問の主語。',
      line: '…worry about being alone forever… — Wow. *Is that what she told you?*',
      said: '「一生ひとりの心配をしたら」と言われ、「へえ。彼女がそう言ったの？」と返す。',
      mean: '誰か（女性）の受け売りだと見抜く返し。',
      trap: 'Wow を傷ついた声と取りやすいが、続く質問は出どころを問う。she と he は語頭で聞き分ける。',
      use: 'Is that what he told you?（彼がそう言ったの？）' },

    // anchor: 209.4–213.2 s both sources “Why did no one fetch me from my trailer that should have been provided”,
    //   about 220 wpm; the four middle words are all weak, and grammar pulls toward “which should be”
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'trailer', seg: [208.9, 215.6],
      stem: 'Type the complaint: “…from my trailer ___ provided?” (4 words)', answer: 'that should have been',
      cue: '「trailer」のすぐあと。文法より、聞こえた音を。',
      line: 'Why did no one fetch me from my trailer *that should have been* provided?',
      said: '「なぜ誰もトレーラーに呼びに来ない？」と怒る。真ん中の4語は弱く、ひと続き。',
      mean: 'should have been ＝「〜のはずだった」。トレーラーは用意されていない、という文句。',
      trap: 'should be と書きたくなるが、言われたのは have been。弱い語ほど音の数を数える。',
      use: 'That should have been done yesterday.（それは昨日やるべきだった）' },

    // R fix: V2 (blind 70 %: "a written record of what she said" was the only choice about what she said). All three
    //   now turn on "receipts": proof, store bills, payment.
    // why: shopping bills ← "receipts" taken literally (レシート); paid to say it ← receipts as proof of payment
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'receipts', seg: [230.1, 236.6],
      stem: 'After the question about what Carly’s been saying, what is claimed?',
      choices: ['There’s solid proof of what she’s been saying', 'There are bills from her latest shopping',
                'She was paid to say those things on camera'], a: 0,
      cue: '「I do because」のあと、文の最後の語。',
      line: 'I do, because *I’ve got the receipts*.',
      said: '「知ってるよ、証拠があるからね」と言う。',
      mean: 'have the receipts ＝ 会話のくだけた言い方で「証拠を押さえている」。',
      trap: 'receipt はふつうレシートだが、言い争いの場面では「証拠」。文字通りに取らない。',
      use: 'Don’t lie. I’ve got the receipts.（ごまかさないで。証拠あるから）' },

    // R fix: K1/V2 — the "about someone else" distractor rested on 240.6 s, where the sources split ("he told me" /
    //   "you told me"), and the key was the only one quoting "receipts" (blind 50 %, cue leak "are"). All three are
    //   now about the proof; "write down everything" settles it.
    // why: shopped instead of working ← "CVS" is a store, heard as being caught out; blank ← "Those are from CVS"
    //   heard as "they're just store slips", the "write down" missed
    { id: 'h6', skill: 'humor', level: 'C1', point: 'cvs', reveals: ['receipts'], seg: [230.1, 241.7],
      stem: 'Why does the reply right after the receipts claim get a laugh?',
      choices: ['The proof is written on a pile of real store receipts', 'The proof shows someone shopped instead of working',
                'The proof is a stack of receipts with nothing on them'], a: 0,
      cue: '店の名前のあと、「I know, but」に続く説明。',
      line: 'Those are *from CVS*. — I know, but I used them to *write down everything*',
      said: '「それドラッグストアのレシートじゃん」「うん、でも全部そこに書いた」。',
      mean: '「証拠」の receipts を、本物のレシートで出す。比喩が文字通りになる笑い。',
      trap: '店の名前で「買い物がばれた」と取りやすいが、続く write down が答え。',
      use: 'Can I write on the back?（裏に書いてもいい？）' },

    // R fix: V2 (blind 50 %: "perfect for the show's promo" glossed "sizzle reel" in the key). Plainer key; the
    //   let-down reading now borrows "do it again, but this time".
    // why: doubtful ← the story is plainly staged, so it might seem too fake to use; let down ← "Let's do it again,
    //   but this time…" heard as "not enough yet"
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'sizzle', seg: [251.2, 260.6],
      stem: 'How does the director react to the story about Carly waiting up all night?',
      choices: ['Pleased: it’s a clip worth showing off', 'Doubtful: it sounds too fake to air',
                'Let down: it isn’t dramatic enough yet'], a: 0,
      cue: '話のすぐあと、「going on」に続く部分。',
      line: 'That’s *going on the sizzle reel*. Let’s do it again, but this time…',
      said: '「それは予告編行きだ。もう一回、今度は…」と言う。',
      mean: 'sizzle reel は売り込み用のハイライト映像。使える場面だと喜んでいる。',
      trap: 'do it again を撮り直し＝不満と取りやすいが、もっと派手にしたいだけ。',
      use: 'That’s going on my wall.（それ、壁に飾ろう）' },
  ]
};
