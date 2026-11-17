// REVIEW 2026-11-17 (second review): pass 6, fix 17, drop 0, new 0; ear checks 1
// REVIEW open: a second cold read still put f2 at 80 % (anyone who knows "not without cause" gets it), g2 at 75 % and
//   nt1, t2, nt3 at 70 %, from knowing that Michael hates Toby and that Neve Campbell is the Scream heroine. The audio
//   settles all five; only distractors that fit Michael just as well would lower these.
// REVIEW 2026-11-16: pass 3, fix 18, drop 1, new 0; ear checks 1
// REVIEW open: i1 (why David asks if anyone is hurt) is dropped: the title "911 CALL ME" answers it, and d1/h1 already
//   cover the text. i3 left the ear-check list: captions "why don't you stay" vs whisper "Why didn't you stay?" doesn't
//   touch its key (review-rubric addendum).
// REVIEW open: nt2 and nt3 rest partly on knowing Michael hates Toby (h2's line); a cold read may still pick them
//   from sitcom sense.
// “911 CALL ME  - The Office US” (the official The Office channel, BEST OF SEASON 5 - The Office US): Michael phones
// David Wallace to get rid of Toby, who is back at work; David refuses and tells him to get along with Toby. Michael then
// puts on a warm welcome for Toby, asks about his trip, and tells the camera how much it costs him, with a horror-movie
// comparison.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Michael, David (Wallace), Toby.
// Untested on purpose: 0–15 s (unnamed speakers on Toby's tan), 95.3 s (captions "no", whisper "Nope"), 106–114 s ("No /
// Yep / I don't", then captions "goodbye Michael … do that", whisper "Don't do that": speakers and words unsettled),
// 120–122 s (the "Kurt Russell… served" line), 155–158 s (captions "speeches interesting", whisper "Yes, beaches.
// Pristine beaches."), 168–175 s ("this was hot", the air conditioner lines: unclear), 175.9 s (who asks "Are you all
// right?"), 197 s (captions "scream too", whisper "Scream 2"; no key turns on it).
// EAR CHECK: 166.2–167.1 s nt2 — "I bet." then, after a 0.6 s gap, "For you." as a dig at Toby, not sympathy (the key
//   rests on the added words; check the delivery doesn't sound kind)
import type { Clip } from '../types.ts';

export const callMe911: Clip = {
  id: 'callme911', video: 'OkPp0I5PXJw', title: '911 CALL ME  - The Office US', dur: 234, wpm: 124, band: 'slow',
  tags: ['職場', '電話'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 — the key was the only cynical choice (60 % blind); all three now have Michael playing nice, and differ
    //   in why and how it lands. It now also reveals 'dying' (t2).
    // R fix (11-17): V2 (60 % blind): "enjoys the act" and "look for cause" were easy to rule out; all three now start
    //   the same and differ in how it ends. N5: use cut to 8 words.
    // why: sees through ← "For you" sounds like a dig that would give the act away, but Toby answers "That's sweet";
    //   ends up liking ← "I tried to talk to Toby and be his friend", but then "an evil snail" and "dying inside"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['getrid', 'acting', 'dying'], seg: [23.0, 213.6],
      stem: 'Over the whole clip, how does Michael’s trouble with Toby turn out?',
      choices: ['David won’t fire Toby, so Michael fakes a welcome and suffers for it',
                'David won’t fire Toby, so Michael fakes a welcome until Toby sees through it',
                'David won’t fire Toby, so Michael tries being friends and ends up liking him'], a: 0,
      cue: '電話の結末と、最後のカメラへの一言。',
      said: '電話でトビーを辞めさせたいと頼むが断られる。そのあと本人には笑顔で「おかえり」と言う。',
      mean: '前半は追い出し作戦の失敗、後半は本心を隠した歓迎の芝居。',
      trap: '「一流の演技」と自慢するので、楽しんでいると取りやすい。最後のカメラへの本音で判断する。',
      use: 'I guess I’ll have to live with it.（もう受け入れるしかないか）' },

    // R fix: V2 — "someone who got hurt" was weak against the title (75 % blind); both distractors are now about Toby
    // R fix (11-17): V2 (75 % blind): "why Toby was hired back" didn't fit a man who hates Toby; both distractors are
    //   now things an anti-Toby Michael could want. The trap note follows.
    // why: annex ← Michael says he avoids the annex, where Toby sits, so keeping him there sounds like the ask; apology
    //   ← "this hardly seems like a dialogue" complains he wasn't asked, but he never asks for sorry: the ask is "get
    //   rid of him"
    { id: 'g2', skill: 'gist', level: 'B1', point: 'call', reveals: ['getrid'], seg: [23.0, 103.5],
      stem: 'What does Michael want from David on the phone?',
      choices: ['A way to get Toby off the staff for good', 'Permission to keep Toby out in the annex',
                'An apology for hiring Toby without asking'], a: 0,
      cue: '電話の後半、マイケルが直接たずねる質問。',
      line: 'Is there no way we can *get rid of him*?',
      said: 'トビーが戻ってきたと訴え、最後に「彼を追い出す方法はないのか」と聞く。',
      mean: 'けが人の話ではなく、嫌いな同僚を辞めさせたいという相談。',
      trap: '「話し合いになっていない」の不満から、謝ってほしいと取りやすい。本題は最後の質問にある。',
      use: 'Is there any way we can change seats?（席を替えてもらう方法はありますか）' },

    // R fix: V2 — "hurt yet, but may be soon" was weak (55 % blind); a literal "surface" (= surface wounds) reading
    //   replaces it
    // R fix (11-17): V2 (60 % blind) and the cue leak ("but" was only in the key): all three now have "but". N4: the
    //   trap described a distractor that no longer existed.
    // why: hidden injuries ← "Not on the surface" read literally as "not visible", so maybe hurt underneath; a mess ←
    //   "disturbed" read as 乱された (things knocked about); "people are disturbed" settles it
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'surface', seg: [38.8, 43.4],
      stem: 'When asked if anyone is hurt, what does Michael’s answer mean?',
      choices: ['No one is hurt, but people are upset inside', 'No one looks hurt, but some may have hidden injuries',
                'No one is hurt, but the office is in a mess'], a: 0,
      cue: '「no」のあと、but に続く形容詞。',
      line: '*Not on the surface*, no. But I can tell people are *disturbed*',
      said: '「表面上はいない。でもみんな動揺しているのが分かる」と答える。',
      mean: 'on the surface ＝ 見た目には。体のけがはないが、心が傷ついたと大げさに言う。',
      trap: 'surface を体の表面と取ると、隠れたけがの話に。but のあとの気持ちを聞く。',
      use: 'On the surface, she seems fine.（表面上は、彼女は平気そう）' },

    // R fix: V2 — "With it, people stop returning his calls" made no sense as a reason (70 % blind); a texts/calls
    //   near miss replaces it
    // R fix (11-17): V2 (70 % blind) and K5: the third choice wasn't a "without it" reason; it's now parallel.
    //   S4: the end moves from 55.4 to 55.9 s, so "calls" isn't clipped.
    // why: open his texts ← "text" is in the if-clause, so the object slips to texts; assistant ← the call opens with
    //   "David Wallace is on the line", so getting through sounds like the problem, but he says "people will not return
    //   my calls"
    { id: 'd1', skill: 'detail', level: 'B2', point: 'text911', seg: [48.9, 55.9],
      stem: 'Why does Michael say he texts “911”?',
      choices: ['Without it, people don’t return his calls', 'Without it, people don’t open his texts',
                'Without it, David’s assistant won’t put him through'], a: 0,
      cue: '「learned a while back」のあと、if の部分。',
      line: 'if I *don’t text 911*, people *will not return my calls*.',
      said: '「911と送らないと、みんな電話を返してくれないと前に学んだ」と説明する。',
      mean: '本当の緊急ではなく、折り返しをもらうための手口だと認めている。',
      trap: 'text につられて「メッセージ」と取りやすい。返ってこないのは calls、電話の方。',
      use: 'If I don’t call, she worries.（電話しないと、彼女が心配するんだ）' },

    // R fix: V2 — "blames David" was weak (60 % blind); a "the trick stopped working" reading replaces it
    // R fix (11-17): V2 (55 % blind): the key was the only "proud" choice; all three now are.
    // why: affection ← "always return my calls" taken as friendship; only on David ← he tells it to David, so it sounds
    //   aimed at him, but "people always return my calls"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'trick', reveals: ['text911'], seg: [48.9, 62.7],
      stem: 'Why is Michael’s explanation of his texts funny?',
      choices: ['He’s proud of a trick that works by scaring people', 'He’s proud that people now call back out of affection',
                'He’s proud of a trick that he says works only on David'], a: 0,
      cue: '「but now」のあと、みんなが何を思うか。',
      line: '…but now people *always return my calls* because they think that *something horrible has happened*.',
      said: '「今はみんな必ず折り返してくる。何かひどいことが起きたと思うから」と得意げに話す。',
      mean: '人をこわがらせる手口を、うまい方法として上司に自慢している。',
      trap: 'always return を好かれている証拠と取りやすい。because の後が本当の理由。',
      use: 'Works every time.（毎回うまくいくんだ）' },

    // why: Michael ← "I like him" heard as Michael's view (the pronoun); the staff ← "he knows the branch" heard as
    //   the office wanting him
    { id: 'd2', skill: 'detail', level: 'B1', point: 'reasons', seg: [62.7, 68.2],
      stem: 'David gives three reasons for hiring Toby back. What is the last one?',
      choices: ['David likes him, too', 'Michael likes him', 'The staff like him'], a: 0,
      cue: '理由を三つ並べる、最後の短い文。',
      line: 'he knows the branch, he was available, and *I like him*.',
      said: '「支店を知っているし、手が空いていたし、私は彼が好きだ」と理由を並べる。',
      mean: 'I はデビッド自身。トビーを嫌うマイケルとは、正反対の気持ち。',
      trap: '電話の相手の話が続くと、I を誰か取り違えやすい。話しているのが誰かで決まる。',
      use: 'It’s close, it’s cheap, and I like it.（近いし安いし、気に入ってる）' },

    // R fix: V2 — "the only reasons he knows" was weak (60 % blind); the choices are now three ways to end a list
    // R fix (11-17): V2 (65 % blind): "invite objections" was easy to rule out; the new near miss reads "Okay?" as
    //   concern.
    // why: all right ← "Okay?" heard as 大丈夫？, concern for Michael; that's all ← "that's that" read as "that's all I've
    //   got", a modest close
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'decided', seg: [62.7, 69.75],
      stem: 'When David finishes his reasons, what do his last few words do?',
      choices: ['Mark the matter as settled, not up for debate', 'Check gently that Michael is all right with it',
                'Admit that those are all the reasons he has'], a: 0,
      cue: '理由のあと、Okay に続く短い決まり文句。',
      line: 'Okay? And *that’s that*.',
      said: '理由を三つ並べてから、「いいね？それで決まりだ」と付け足す。',
      mean: 'that’s that ＝ もう決まったこと。話し合う気はない、という締めの言葉。',
      trap: 'Okay? を本当の質問と取りやすい。後に that’s that が来たら、返事は求めていない。',
      use: 'We’re leaving at six, and that’s that.（6時に出る。以上）' },

    // R fix: S2/V2 — the stem quoted the phrase under test (70 % blind); it now names the moment, and the "accepts"
    //   distractor is hedged like the key
    // R fix (11-17): V2 (50 % blind): "thanking David" was weak; a polite-request reading replaces it.
    // why: go over ← a polite opener read as a Japanese 恐れ入りますが… request; respects it ← respect read as obeying the
    //   boss (従います), but "this hardly seems like a dialogue" objects
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'respect', seg: [69.4, 74.8],
      stem: 'When Michael answers David’s reasons, what is his opening phrase doing?',
      choices: ['Softening a complaint he is about to make', 'Showing he respects the decision, though unhappy',
                'Politely asking David to go over his reasons'], a: 0,
      cue: '前置きのあとに続く文の中身。',
      line: '*With all due respect*, David, this hardly seems like a dialogue.',
      said: '「お言葉ですが、これは話し合いとは言えません」と返す。',
      mean: '丁寧な前置きは、反対や不満を言う合図。目上の人に言うときの決まった形。',
      trap: 'respect を尊敬や丁寧なお願いと取りやすい。この前置きのあとには、ほぼ必ず反論が来る。',
      use: 'With all due respect, I disagree.（お言葉ですが、反対です）' },

    // R fix: V2 — "He should have asked Michael first" was weak (55 % blind); a conceding reading replaces it
    // R fix (11-17): V2 (60 % blind): "Michael won't let him talk" was off the line; the new near miss mishears "it
    //   isn't".
    // why: will listen ← "That's because" heard as a concession; not yet ← "it isn't" heard as "it isn't yet", an
    //   opening for Michael, but the sentence ends there
    { id: 'i2', skill: 'infer', level: 'C1', point: 'decided', seg: [69.4, 74.8],
      stem: 'What does David mean by his short reply to Michael’s complaint?',
      choices: ['It was never meant to be a discussion', 'He admits it went badly and will listen now',
                'It isn’t one yet, since Michael hasn’t had his say'], a: 0,
      cue: '返事の最後、it のあとの短い否定。',
      line: '…this hardly seems like a dialogue. — That’s because *it isn’t*, Michael.',
      said: '「話し合いになっていない」に、「話し合いではないからだ」と返す。',
      mean: '相談でなく通告だ、ということ。不満をそのまま認めて、はね返している。',
      trap: 'That’s because を言い訳の始まりと取りやすい。it は直前の a dialogue を指す。',
      use: 'That’s because it isn’t up to you.（それは君が決めることじゃないからだ）' },

    // why: a day ← a short gap seems more forgivable; a month ← "entire" makes the time sound long
    { id: 'n1', skill: 'number', level: 'B1', point: 'week', seg: [75.0, 81.15], keep: true,
      stem: 'How long was Toby back before Michael noticed, according to David?',
      choices: ['A day', 'A week', 'A month'], a: 1,
      cue: '「an entire」のすぐあと。',
      line: 'go *an entire week* without knowing a member of your staff was there',
      said: '「社員がいるのに丸一週間気づかなかったのはどういうことだ」と聞く。',
      mean: 'entire ＝ まるまる。気づかなかった期間の長さを強めている。',
      trap: 'entire で長い期間を想像しやすい。単位の語は一音節で短いので、母音まで聞く。',
      use: 'I spent an entire week on it.（丸一週間かけたんだ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'getrid', seg: [94.9, 97.9],
      stem: 'Type what Michael asks: “Is there no way we can ___?” (4 words)', answer: 'get rid of him',
      cue: '「we can」のあと、つながった四語。',
      line: 'Is there no way we can *get rid of him*?',
      said: '「彼を追い出す方法はないのか」と聞く。',
      mean: 'get rid of ＝ 追い払う。t が弾み「ゲリダヴィム」に近く、him の h は消える。',
      trap: 'of と him が弱く、二語に聞こえやすい。get rid of は一つのかたまりとして覚える。',
      use: 'How do I get rid of this smell?（このにおい、どうやって消すの？）' },

    // R fix: V2 — 65 % blind; "needed at the branch" becomes the "I like him" keyword trap
    // R fix (11-17): V2 (75 % blind): "David likes him" was off the phrase; a contract-date reading replaces it. Still
    //   open: HR sense helps.
    // why: contract ← firing talk calls up an end date, but "cause" is a reason, not a time; of his own will ←
    //   "without" read as "unless he chooses to"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'cause', seg: [94.9, 100.7],
      stem: 'When Michael asks if they can get Toby out, what does David’s reply mean?',
      choices: ['Only if there’s a proper reason to fire him', 'Only once Toby’s current contract runs out',
                'Only if Toby agrees to go of his own will'], a: 0,
      cue: '「Not without」のあとの一語。',
      line: 'Not *without cause*, Michael.',
      said: '「正当な理由がなければ無理だ」と答える。',
      mean: 'cause ＝ 解雇などの正当な理由。好き嫌いでは辞めさせられない、という意味。',
      trap: 'without の否定と not が重なり分かりにくい。「〜なしではだめ」＝「〜があれば」と言い換える。',
      use: 'You can’t return it without a receipt.（レシートなしでは返品できません）' },

    // R fix: V2 — 70 % blind; all three are now "a work reason" made of something the call mentions
    // R fix (11-17): V2 (75 % blind): the annex and absence choices were weak; the staff-upset choice is a cause
    //   Michael really claimed. N5: use cut to 8 words.
    // why: tan ← the clip opens on Toby's "stupid tan"; staff upset ← Michael told David "people are disturbed", a
    //   real-sounding cause; "because I hate him" refutes both
    { id: 'h2', skill: 'humor', level: 'C1', point: 'hate', reveals: ['cause'], seg: [97.6, 103.5],
      stem: 'Why is Michael’s answer about having cause funny?',
      choices: ['He offers plain dislike as a work reason', 'He offers Toby’s tan and holiday as a work reason',
                'He offers the staff’s upset as a work reason'], a: 0,
      cue: '「It is because」のあとの三語。',
      line: 'I have cause. It is *because I hate him*.',
      said: '「理由ならある。彼が嫌いだからだ」と即答する。',
      mean: '仕事上の理由が要るのに、ただの好き嫌いを堂々と出している。',
      trap: 'I have cause で本当の問題を期待しやすい。because のあとで中身を確かめる。',
      use: 'I have a reason: I don’t like it.（理由はある。気に入らないだけ）' },

    // R fix: V2 — "have to" was the default command (50 % blind); "got to" (gotta) joins as a fourth sound-alike
    // R fix (11-17): V2 (65 % blind): "ought to" was the odd one out; "'ll have to", a weak-l near sound, replaces it.
    // why: had to ← the flapped "had" sounds like a fast "have"; 'll have to ← the dark l of "you'll" is almost silent;
    //   got to ← "gotta" is the other everyday "must"
    { id: 's1', skill: 'sound', level: 'B2', point: 'haveto', seg: [103.4, 106.5],
      stem: 'Fill the gap: “You ___ get along with Toby.”',
      choices: ['have to', 'had to', '’ll have to', 'got to'], a: 0,
      cue: '「You」のすぐあと、短く弱い二語。',
      line: 'You *have to* get along with Toby.',
      said: '「トビーと仲良くしなければならない」と命じる。',
      mean: 'have to は「ハフタ」と縮む。v が f に変わり、to は弱い「タ」。',
      trap: 'どれも語尾は弱い「タ」。You のあとに l が残るか、出だしが「ハフ」「ハッ」「ガ」かで分ける。',
      use: 'You have to try this place.（この店、絶対行ってみて）' },

    // anchor: 117.4–119.0 s "You want to see some real high-caliber acting?" said right before "Great to have you back,
    //   man… Missed you as part of our family"; 102.2 s "because I hate him"
    // R fix: V2 — "a real change" was a face-value reading the stem already rules out (75 % blind); a "trying to mean
    //   it" near miss replaces it, and the mockery choice is now parallel
    // R fix (11-17): V2 (75 % blind, second rewrite): the stem pointed at the camera remark, which told the reader the
    //   welcome is reframed. It now names the welcome only.
    // why: an effort ← David's "You have to get along with Toby" makes the welcome look like a real try, but "acting"
    //   names it; mockery ← right mechanism (insincere), wrong target: "acting" means fooling Toby, and Toby answers
    //   "That's sweet"
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'acting', reveals: ['sweet'], seg: [116.9, 138.9],
      stem: 'How should we hear Michael’s warm welcome for Toby?',
      choices: ['As a performance: warm words he doesn’t mean', 'As an effort: he is trying hard to mean them',
                'As mockery: he wants Toby to see it’s fake'], a: 0,
      cue: 'カメラへの一言の中の、演技を表す語。',
      line: 'You want to see some real *high-caliber acting*? … Great to have you back, man… *Missed you as part of our family*.',
      said: 'カメラに「一流の演技を見せる」と言い、トビーに「戻ってうれしい、家族だ」と言う。',
      mean: 'カメラへの一言が、続く歓迎を書きかえる。温かい言葉は全部、相手をだます演技。',
      trap: '「仲良くしろ」のあとなので、本気の努力と取りやすい。acting の一語で決まる。',
      use: 'Act natural. Smile like you mean it.（自然にね。本気っぽく笑って）' },

    // why: laughs ← an over-warm welcome usually gets a joke back; cold ← "Wow" read as doubt
    { id: 't1', skill: 'attitude', level: 'B1', point: 'sweet', seg: [133.8, 142.5],
      stem: 'How does Toby take Michael’s welcome?',
      choices: ['He is touched and says the same back', 'He laughs, sure Michael is joking',
                'He sounds cold and doubts that it is true'], a: 0,
      cue: '「Wow」のあとの二つの文。',
      line: 'Wow. *That’s sweet*. *I missed you guys, too*.',
      said: '「わあ、うれしいな。僕もみんなに会いたかった」と返す。',
      mean: 'トビーは歓迎を本気と受け取った。マイケルの芝居は通じている。',
      trap: 'Wow を驚きや疑いと取りやすい。続く sweet と too が、素直に喜ぶ合図。',
      use: 'Aw, that’s sweet of you.（わあ、優しいね）' },

    // R fix: V2 — 55 % blind; the distractors are now the two usual holiday payoffs, said in the same shape
    // R fix (11-17): V2 (50 % blind): "how others live" was weak; an excitement reading of "incredibly" replaces it.
    // why: a break ← a holiday is usually a rest from work; a thrill ← "incredibly" and "amazing" heard as excitement
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'cathartic', seg: [158.4, 161.6],
      stem: 'With his last word about the trip, what does Toby say it did for him?',
      choices: ['Let him release feelings he had held in', 'Gave him the break from work he needed',
                'Gave him a thrill like nothing before'], a: 0,
      cue: '「incredibly」のあとの、長めの一語。',
      line: 'The whole thing was *incredibly cathartic*.',
      said: '「全部、ものすごく心が解放される体験だった」と言う。',
      mean: 'cathartic ＝ ためこんだ気持ちを吐き出せて、すっきりする。カタルシスと同じ語。',
      trap: '旅の話なので「休めた」や「わくわくした」に引かれやすい。旅の一般論より語の意味で選ぶ。',
      use: 'Crying at the movie was cathartic.（映画で泣いて、すっきりした）' },

    // R fix: V2 — "curious about life abroad" was weak small talk (60 % blind); a jealousy reading replaces it
    // R fix (11-17): V2 (55 % blind): "sorry it ended" was weak; the literal "just asking" reading replaces it.
    // why: jealous ← "That must have been fun" makes him sound envious; curious ← "Why'd you come back?" taken as a
    //   plain question, but "Why didn't you stay?" right after pushes Toby away
    { id: 'i3', skill: 'infer', level: 'C1', point: 'stay', reveals: ['cathartic'], seg: [158.7, 164.1],
      stem: 'What do Michael’s two quick questions after the trip talk show?',
      choices: ['He wishes Toby had stayed away', 'He is jealous of Toby’s time away',
                'He is just curious why Toby came back'], a: 0,
      cue: '二つの質問の動詞、来ると残る。',
      line: 'The whole thing was incredibly cathartic. — *Why’d you come back?*',
      said: '旅の話のあと、すぐ「なんで戻ってきた？向こうにいればいいのに」と聞く。',
      mean: '世間話の形で、本音の「戻ってこないでほしかった」がもれている。',
      trap: 'ただの質問やうらやみに聞こえやすい。続けて聞く「戻る」「残る」の二つで本音が出る。',
      use: 'Why don’t you stay a little longer?（もう少しいたら？）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'kindof', seg: [163.7, 166.0],
      stem: 'Type what Toby says: “It’s actually ___ to meet people.” (3 words)', answer: 'kind of hard',
      cue: '「actually」のすぐあと、速い三語。',
      line: 'Well, it’s actually *kind of hard* to meet people.',
      said: '「実は、人と知り合うのがちょっと難しくて」と言う。',
      mean: 'kind of は「カインダ」と縮み、of はほぼ「ア」。言い方を和らげる表現。',
      trap: 'of が消えて kinda hard の二語に聞こえやすい。書くときは kind of と二語に戻す。',
      use: 'It’s kind of far from here.（ここからちょっと遠いよ）' },

    // anchor: 166.2–167.1 s "I bet." is complete, then after a 0.6 s gap "For you." narrows "hard to meet people" from
    //   a fact about the place to a fact about Toby; 102.2 s "because I hate him"
    // R fix: V2 — 65 % blind; the sympathy choice becomes a flattering reading of "for you", so each choice reads the
    //   two words in a different direction
    // R fix (11-17): V2 (65 % blind, second rewrite): the key was the only dig; the flattering reading becomes a second
    //   dig, wrong in one way.
    // why: everyone ← scope flip: "for you" heard as "for you too"; didn't try ← right direction (a dig at Toby), wrong
    //   target: "For you" points at who he is, not at his effort
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'foryou', reveals: ['kindof'], seg: [163.7, 167.7],
      stem: 'With the two words he adds after “I bet”, what is Michael implying?',
      choices: ['That Toby is the problem, not the place', 'That it’s hard for everyone, not just Toby',
                'That Toby didn’t try hard enough there'], a: 0,
      cue: '「I bet」で文が終わったあとの、付け足し。',
      line: 'it’s actually kind of hard to meet people. — I bet. *For you.*',
      said: '「人と知り合うのが難しい」に「だろうね」と返し、間をおいて「君ならね」と足す。',
      mean: '「君なら」を足すと、原因が場所でなく相手の人柄になる。付け足しで本音がもれた。',
      trap: '努力不足の話とも取れるが、for you は人柄を指す。文のあとの付け足しは、皮肉が出やすい場所。',
      use: 'Mornings are hard. For me, anyway.（朝はつらいよ。少なくとも僕はね）' },

    // R fix: V2 — "Fine: relieved" was weak (65 % blind); an anger-at-David reading replaces it
    // R fix (11-17): V2 (65 % blind): "proud" was easy to rule out; a hopeful reading of "be his friend" replaces it.
    // why: angry ← David forced the act, so anger seems natural, but he says "I tried" and "dying inside", not a word
    //   on David; hopeful ← "I tried to talk to Toby and be his friend" heard as a start, but "an evil snail" follows
    { id: 't2', skill: 'attitude', level: 'B2', point: 'dying', seg: [179.2, 193.9],
      stem: 'How is Michael doing after the welcome, from what he tells the camera?',
      choices: ['Badly: being nice to Toby is wearing him down', 'Angry: he blames David for forcing the act',
                'Hopeful: he thinks a friendship may grow'], a: 0,
      cue: 'カメラへの話の最後、feel like のあと。',
      line: 'I tried. I tried to talk to Toby and be his friend… *I feel like I’m dying inside*.',
      said: 'カメラに「努力はした」と言い、「心の中で死にそう」と話す。',
      mean: '仲良くするふりが、かなりこたえている。カメラへの話が本音。',
      trap: 'デビッドに怒っていると取りやすいが、名前は出ない。I tried と dying inside は落ちこみの言葉。',
      use: 'I’m fine. Okay, I’m not fine.（平気。いや、平気じゃない）' },

    // why: snake ← snail/snake share "sn-" and a long vowel; angry ← "evil" caught as a strong feeling word
    { id: 'd4', skill: 'detail', level: 'B1', point: 'snail', seg: [185.5, 190.8],
      stem: 'What does Michael say trying to be Toby’s friend is like?',
      choices: ['Being friends with an evil snail', 'Being friends with an evil snake',
                'Being friends with an angry snail'], a: 0,
      cue: '「friends with」のあと、少し間があく。',
      line: 'that is like trying to be friends with *an evil snail*.',
      said: '「あれは、邪悪なカタツムリと友だちになろうとするようなもの」と言う。',
      mean: 'のろくてぬるぬるした生き物に「邪悪な」を付けた、ばかげたたとえ。',
      trap: 'snail と snake は出だしが同じ。最後が「ル」で終わるか「ク」で終わるかを聞く。',
      use: 'It’s like talking to a wall.（壁に話してるみたい）' },

    // anchor: 196.2 s "I feel like Neve Campbell" (Michael is the girl), 203.3 s "the murderer comes back", which
    //   echoes "Why'd you come back?" (161.8 s) said to Toby
    // R fix: V2 — only the key paired Toby with "comes back" (60 % blind); each choice now casts both men
    // R fix (11-17): V2 (70 % blind, second rewrite): only the key had Toby as the returning killer; now two choices
    //   do, and they differ in Michael's role.
    // why: Michael a friend ← "killing off all of her friends" heard as Michael's fate, but "I feel like Neve Campbell…
    //   she thinks she can go off"; Toby a friend ← Toby heard among the victims, but Toby is the one who "comes back"
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'scream', seg: [195.7, 207.8],
      stem: 'How does Michael’s horror-movie comparison cast the two of them?',
      choices: ['Michael is the girl, Toby the killer who returns', 'Michael is a friend who gets killed, Toby the killer',
                'Michael is the girl, Toby a friend who gets killed'], a: 0,
      cue: '「I feel like」のあとの名前と、comes back。',
      line: 'I feel like *Neve Campbell*… She thinks she can go off to college and be happy. And then *the murderer comes back*.',
      said: '「映画の主人公の気分。幸せになれると思ったら、殺人鬼が戻ってくる」と話す。',
      mean: '自分を主人公、戻ったトビーを殺人鬼にしている。人事の同僚には大げさすぎる役。',
      trap: '殺される友だちを自分と重ねやすい。I feel like の後の名前が話し手の役で、戻るのは殺人鬼。',
      use: 'I feel like the villain in this story.（この話の悪役になった気分）' },
  ]
};
