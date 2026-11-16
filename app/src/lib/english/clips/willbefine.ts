// “It Will Be Fine - The Office US” (the official The Office channel, BEST OF SEASON 5): Michael's Willy Wonka
// "golden ticket" promotion lets the biggest client (Blue Cross) claim all five discounts; on the phone he dodges David
// and pins the idea on Dwight, then Blue Cross signs on as an exclusive client and Dwight gets the credit, and Michael
// can't win it back.
// Segments from the captions, words from whisper (2026-11-16). Only Michael, David, Dwight, Pam and Oscar are named;
// the others are "a coworker" or "the salesman".
// Untested on purpose: 61–70 s and 74–80 s (whoops, and the Wonka-film lines "spoiled little girl / cowboy obsession"
// are film knowledge), 135–142 s (the roof "jump off" joke; "Good one" in the captions vs "Give one" in whisper),
// 161–164 s (who asks "How are you doing?"; whisper adds a "What is going on?" the captions lack), 212–220 s (whisper
// repeats the next scene's lines there), "take the ball for him" (both sources; likely "fall"), 290–300 s (who says
// "You're welcome"), 320–322 s (innuendo), 336–339 s (captions "just so", whisper "Just boom"), 365 s ("They should
// meet you" vs "they said I need you"), 381.8 s (who says "He's never seen the movie").
// EAR CHECK: 273.3 s r1 — the cut falls after "can't be undone" (captions 272.8 s) and before "Because" (273.6 s)
// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 1
// OPEN: a cold re-read still got 16/22 choice items at ≥ 50 %. d3 (Dwight, 70 %) is show knowledge, and h1 is the only
//   "made it up" choice (see its comment). Your call on how strict V2 should be for show-savvy readers.
// OPEN: c2 (C2) rests on the opening scene ("I am Willy Wonka!"), not on its own segment; the player has seen it
//   after one watch, but S4 is bent.
import type { Clip } from '../types.ts';

export const willBeFine: Clip = {
  id: 'willbefine', video: 'WN7nBZMB3lk', title: 'It Will Be Fine  - The Office US', dur: 411, wpm: 149,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: three ← "Three days ago" opens the line; ten ← "10% off" right after; fifteen ← fif-/five sound alike
    { id: 'n1', skill: 'number', level: 'B1', point: 'five', seg: [37.3, 43.1], keep: true,
      stem: 'How many golden tickets were slipped into paper shipments?',
      choices: ['Three', 'Five', 'Ten', 'Fifteen'], a: 1,
      cue: '「slipped」のすぐあとの数。',
      line: 'Three days ago, I slipped *five* pieces of gold paper…',
      said: '「3日前、金色の紙を5枚、荷物に入れた」とカメラに話す。',
      mean: '金色の紙がゴールデンチケット。5枚だけ入れたことが、あとの騒ぎにつながる。',
      trap: '文頭の three days ago の three が残りやすい。数は slipped の後ろを聞く。',
      use: 'I slipped a note into her bag.（彼女のかばんにメモをそっと入れた）' },

    // why: next order ← "total" missed, read as the usual coupon; free gift ← a "golden ticket" heard as a prize
    { id: 'd1', skill: 'detail', level: 'B1', point: 'discount', seg: [37.3, 46.9],
      stem: 'What does each golden ticket give the customer?',
      choices: ['Ten percent off their whole order', 'Ten percent off their next order',
                'A free gift with their next order'], a: 0,
      cue: '「entitles the customer to」のあと。',
      line: 'This entitles the customer to *10% off of their total order*.',
      said: '「これで客は注文全体が10%引きになる」と説明する。',
      mean: 'entitle A to B ＝ AにBの権利を与える。total order ＝ 注文の合計。',
      trap: 'ゴールデンチケットは景品と思いやすい。割引の話は off の前後を聞く。',
      use: 'This coupon entitles you to a free drink.（このクーポンでドリンク1杯無料）' },

    // R fix: V2 (blind 60 %) and C4: "It costs a fortune" was easy to rule out, and the old key (Dwight gets the credit)
    //   was given away by c2's line, so g1 kept the C2 c2 out of every draw it led (the draws test failed). g1 now asks
    //   how the mess turns around; the credit stays with c2 and d3. A cold re-read still took a "loss, then a big
    //   deal" arc at 75 % (the sitcom turn plus the title), so the choices are now three concrete turnarounds.
    // why: too small ← "It'll be fine, it'll be good" sounds like the loss being shrugged off; a cap ← "does it say
    //   limit one per customer?" makes a limit sound like the fix
    { id: 'g1', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['exclusive', 'undone'],
      seg: [56.0, 384.6],
      stem: 'What turns the golden ticket mess around in the end?',
      choices: ['The client with the tickets gives them all its business', 'David decides the loss is too small to worry about',
                'Dwight finds a way to put a cap on the discount'], a: 0,
      cue: '前半の損の話と、後半の電話の知らせ。',
      said: '途中は大損かと思われたが、最後にその大口の客が全部うちから買うと決める。',
      mean: '損に見えた案が、大きな契約を生む。手柄の行方は別の話。',
      trap: 'It’ll be fine から損が小さく済むと取りやすい。後半の Blue Cross の知らせまで聞く。',
      use: 'It worked out in the end.（結局うまくいった）' },

    // why: success ← katakana ヒット = a big success; clients ← "One of my clients found a golden ticket" just before
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'hit', reveals: ['discount'], seg: [85.4, 97.1],
      stem: 'After “Hey, Oscar!”, what does the next question ask about?',
      choices: ['How much money the tickets will cost them', 'How much of a success the promotion has been',
                'How many clients have found a ticket so far'], a: 0,
      cue: '「how much of a」のあとの一語と、その答え。',
      line: 'Um, how much of a *hit*? … It’s gonna *hurt*.',
      said: '「どのくらいの痛手？」と聞き、「Blue Cross の取引の10%。痛いね」と返る。',
      mean: 'hit ＝ 損害、打撃。take a hit で「損をかぶる」。',
      trap: 'カタカナのヒットで「大成功」と取りやすい。答えの hurt が損の話だと示す。',
      use: 'Our budget took a big hit this year.（今年は予算が大きく減った）' },

    // R fix: V2 (blind 50 %): the key alone had an extra detail ("at once"); the choices are now parallel. S4: 19.5 s
    //   was over the cap; now 100.1–108.7 (through "Nope, it doesn't"), and the cue and mean drop "half my sales".
    //   After a cold re-read (75 %): the stem no longer says "five", and "five clients each" (the plan, not bad news)
    //   became "no time limit" ("limit" heard as a time limit).
    // why: time limit ← "limit one per customer" with only "limit" caught; every order ← "limit one per customer" heard as "per order"
    { id: 'i1', skill: 'infer', level: 'B2', point: 'limit', reveals: ['five'], seg: [100.1, 108.7],
      stem: 'Why is the news about the tickets Blue Cross found so bad?',
      choices: ['One client can use all five discounts', 'The discounts come with no time limit',
                'One client can use it on every order'], a: 0,
      cue: '「Nope」の前の質問。',
      line: 'You found *five* golden tickets? … does it say *limit one per customer*? — Nope, it doesn’t.',
      said: '一社が5枚とも見つけた。「1社1枚まで」と書いてあるかには「ない」。',
      mean: '制限がないので、大口の客が5枚とも使える。',
      trap: 'limit だけ拾うと期限の話に聞こえる。limit one per customer は「1社1枚まで」。',
      use: 'Is there a limit of one per customer?（お一人様一点限りですか）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'spread', seg: [110.1, 113.15],
      stem: 'Type the question: “How do you ___ the tickets into different shipments?” (3 words)',
      answer: 'not spread out',
      cue: '「How do you」のすぐあと。三語がつながる。',
      line: 'How do you *not spread out* the tickets into different shipments?',
      said: '「なぜチケットを別々の荷物に分けなかった？」と聞く。',
      mean: 'not‿spread‿out とつながり、not の t はほぼ消える。',
      trap: 'not が弱く、肯定の質問に聞こえやすい。How do you not…? は「なぜしなかった」。',
      use: 'Let’s spread out and look for it.（手分けして探そう）' },

    // why: he did ← a weak "he" loses its h, and blaming someone fits a scolding; it did ← "Does it say…? It doesn't"
    //   just before, so "it" seems to carry on
    { id: 's1', skill: 'sound', level: 'B2', point: 'thought', seg: [110.1, 114.15],
      stem: 'Fill the answer to the question about the tickets: “I thought ___.”',
      choices: ['I did', 'he did', 'it did'], a: 0,
      cue: '問いのすぐあと、とても短い返事の二語目。',
      line: '*I thought I did.*',
      said: '「分けたつもりだった」と答える。',
      mean: '自分ではやったつもり、という返事。I did は「アイディッ」と短く、最後の d は弱い。',
      trap: '弱い he は h が落ちて「イ」に近くなり、I と似る。返事の主語は、問いの you を受けて考える。',
      use: 'I thought I locked the door.（鍵をかけたつもりだった）' },

    // R fix: V2 (blind 55 %): "Cheering" was weak; now "Agreeing" (someone says "Yes" right before the question).
    // why: agreeing ← the "Yes" just before, and "blows up" read as 大ブレイク, a big hit; warning ← "later" heard as a sincere general caution
    //   (refuted: "a gold ticket idea" names the one that just went wrong, and "Does that mean…?" turns it into a jab)
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'blowup', seg: [126.0, 134.0],
      stem: 'How is the coworker’s question about a “gold ticket idea” meant?',
      choices: ['Mocking: the last one like it backfired', 'Agreeing: they need one that is just as bold',
                'Warning: any quick fix could backfire'], a: 0,
      cue: '「Does that mean」のあとの動詞と later。',
      line: 'We need a gold ticket idea to get us out of this mess. — … an idea that *blows up in our faces later*?',
      said: '「金のチケット級の案を」に「あとで顔の前で爆発する案？」と返す。',
      mean: 'blow up in one’s face ＝ 裏目に出る。前の案への皮肉。',
      trap: '直前の Yes と blow up（大当たり）で賛成に聞こえやすい。指しているのは直前の案。',
      use: 'That plan could blow up in our faces.（その計画、裏目に出るかも）' },

    // R fix: S4: 24.1 s was over the cap; now 152.9–167.2, from "I'll find out if he's out yet" to "large colon".
    //   V2 (blind 70 %) stays open: the key is the only "made it up", and a second one ("Pam gave it away") would rest
    //   on her line at 148.8 s, outside the segment. Kept the choices; the speed of his "Hello, David" settles it.
    // why: real ← "colonoscopy" taken at face value, so the detail is just oversharing; groggy ← a real procedure
    //   would leave him loopy, which could explain the odd speech
    { id: 'h1', skill: 'humor', level: 'C1', point: 'colon', seg: [152.9, 167.2],
      stem: 'Why is Michael’s description of his procedure funny?',
      choices: ['He made it up and is hiding behind details', 'He really had it and is sharing too much',
                'He really had it and is still groggy from it'], a: 0,
      cue: '「out yet」から、彼が電話に出るまでの短さ。',
      line: 'I’ll find out if he’s out yet. — Hello, David. I *just got back from my procedure*… *my large colon*…',
      said: '検査中のはずが数秒で電話に出て「検査から戻った」と言い、大腸の検査を細かく説明する。',
      mean: '検査は電話を避けるための作り話。「何が起きてる」と聞かれ、検査の説明で逃げている。',
      trap: '病院の話は本当に聞こえやすい。電話に出るまでの数秒の短さに注目。',
      use: 'Sorry, I was in a meeting.（すみません、会議中でした）' },

    // R fix: V2 (blind 70 %): "playing down the money" became "owning the idea but playing down the loss", the
    //   honest-boss script; the start moved to 155.0 for the 0.5 s lead. C5: it no longer reveals 'explain': "dodging
    //   by pointing to others" fits every choice of p1 and c1, and its notes don't touch the explanation.
    // why: playing down ← David's "lose a fortune" invites a boss to shrink the loss (he never mentions money);
    //   covering ← Dwight's name comes up, and the next scene is about taking the blame for someone
    { id: 'g2', skill: 'gist', level: 'B2', point: 'blame', reveals: ['breakup', 'dwight'], seg: [155.0, 218.0],
      stem: 'What is Michael mainly doing on the phone with David?',
      choices: ['Dodging the blame by pointing to others', 'Owning the idea but playing down the loss',
                'Covering for Dwight by taking the blame'], a: 0,
      cue: '「What firm?」のあとの返事と、最後の返事。',
      said: '「外部のコンサルかも」「電話が遠い」と言い逃れ、最後は営業の Dwight の名前に「はい」と答える。',
      mean: '自分の案だと認めず、責任を他人に回している。',
      trap: 'Dwight の名前から、かばう話と取りやすい。名前を出したのが誰の得になるかを聞く。',
      use: 'Don’t look at me. It wasn’t my idea.（こっち見ないで。私の案じゃない）' },

    // R fix: V2 (blind 50 %): "panicked, ready to give up" was weak; now "hurt, but polite" (he does ask how Michael
    //   is doing, in the Japanese reading). S4: 21.6 s was over the cap; now 158.55–173.5, "Michael, what the
    //   hell…" through "Why did you okay this golden ticket idea?"
    // why: calm ← he asks short, plain questions in order, which can sound controlled; hurt ← a boss let down by a
    //   manager, and "How are you doing?" is in the exchange (refuted: "what the hell")
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'david', seg: [158.55, 173.5],
      stem: 'How does David sound when Michael comes on the line?',
      choices: ['Angry, and pressing for answers', 'Calm, but firm about the numbers', 'Hurt, but trying to stay polite'],
      a: 0,
      cue: '最初の一言の強い語と、次の質問。',
      line: 'Michael, *what the hell* is going on here? … *Why did you okay* this golden ticket idea?',
      said: '「一体どうなってる」と問い詰め、「なぜこの案を許可した」と聞く。',
      mean: 'what the hell は強いいら立ち。名前を呼び、なぜと問い詰める調子。',
      trap: '礼儀を保っているようにも聞こえるが、名前を呼んで問い詰め続ける。強い語が先に出る。',
      use: 'What on earth is going on here?（一体どうなってるの）' },

    // anchor: 29–34 s, to camera: "The Willy Wonka golden ticket promotional idea is probably the best idea I have ever
    //   had"; 177–181 s "an explanation that involves me not letting it happen"; 189–212 s he goes on to an "outside",
    //   then an "inside" consultant, then Dwight
    // R fix: V2 (blind 50 %, §9.6): the key was the only two-part answer ("…, and he loved it"); now one claim.
    // why: okayed unread ← David asks "Why did you okay this…?", so it seems he only signed off on it; may work out ←
    //   the clip's ending (it does) read back into this moment
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'explain', seg: [169.2, 186.05],
      stem: 'When Michael offers David “an explanation”, what is he trying not to say?',
      choices: ['That the idea came from him in the first place', 'That he okayed the idea without reading it',
                'That he still thinks the idea may work out'], a: 0,
      cue: '冒頭のカメラへの一言と、この言い訳の差。',
      line: 'Why did you okay this golden ticket idea? … there is an explanation that involves *me not letting it happen*…',
      said: 'カメラに「最高の案」と話した彼が、ここでは「僕が許さなかったという説明がある」と言う。',
      mean: '隠したいのは、自分の発案だったこと。カメラへの一言を聞いた観客には言い訳だと分かる。',
      trap: 'okay this idea から「よく見ずに許可した」と取りやすいが、本人の案。カメラへの一言と比べる。',
      use: 'It wasn’t exactly my idea.（正確には私の案じゃなくて）' },

    // R fix: V2 (blind 55 %): the key alone gave a reason; now each choice carries one. S4: 16.85 s was over the
    //   cap; now 173.6–186.05, from "We're going to lose a fortune".
    // why: later ← "there is an explanation" sounds like one is coming; David ← "me not letting it happen" heard as
    //   pointing at whoever did let it happen
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'explain', seg: [173.6, 186.05],
      stem: 'What is Michael doing in his first answer to “How could you let this happen?”',
      choices: ['Stalling, because he has no real answer', 'Promising an answer once he has the facts',
                'Hinting that David should have stopped it'], a: 0,
      cue: '「there is an explanation」のあと、最後の三語。',
      line: 'Well, there is an explanation that involves *me not letting it happen*, and I just don’t… *I don’t know*.',
      said: '「僕が許さなかったという説明が…分からない」と詰まる。',
      mean: '説明があると言いながら中身がない。時間かせぎで、言い逃れの最初の一手。',
      trap: 'explanation のあとに答えが続くと思いやすい。最後の I don’t know が中身のなさを示す。',
      use: 'Well, it’s a long story.（まあ、話せば長いんだ）' },

    // R fix: V2 (blind 70 %): the key alone named a motive. Now two "blaming the line" choices with different aims,
    //   plus the literal "firm broke up".
    // why: call back ← "You're breaking up" is the usual lead-in to "I'll call you back"; firm broke up ← break up =
    //   解散・別れる, right after "firm"
    { id: 'i2', skill: 'infer', level: 'C1', point: 'breakup', seg: [193.7, 204.4],
      stem: 'Right after David asks which firm it was, what is Michael doing?',
      choices: ['Blaming the line so he doesn’t have to answer', 'Blaming the line so he can call David back',
                'Saying the firm he hired has broken up'], a: 0,
      cue: '返事の直後、Michael が普通に話し続けるか。',
      line: 'What firm? — *You’re breaking up.* — Michael? — Okay, I think… it might have been an *inside* consultant.',
      said: '「どの会社だ」に「電波が悪い」と返し、すぐ普通に「社内のコンサルかも」と続ける。',
      mean: '電波のせいにして質問をかわした。外部の会社などないので答えられない。',
      trap: 'breaking up は「かけ直す」の前置きにもなるが、すぐ普通に話し続ける。',
      use: 'Sorry, you’re breaking up.（ごめん、電波が悪くて）' },

    // why: Jim ← "Was it Jim?" comes first and its short "No" is easy to miss; Oscar ← named earlier, in the talk about the money
    { id: 'd3', skill: 'detail', level: 'B1', point: 'dwight', reveals: ['blame'], seg: [204.4, 218.0],
      stem: 'When David guesses names, which person does Michael say yes to?',
      choices: ['Dwight', 'Jim', 'Oscar'], a: 0,
      cue: '名前を二つ聞いたあとの、二つの返事。',
      line: 'Was it *Jim*? — *No.* — Okay. Was it *Dwight*? — *Yes.*',
      said: 'Jim には「いいえ」、Dwight には「はい」と答える。',
      mean: '名前を挙げたのは David で、Michael は答えるだけ。責任を回した。',
      trap: '最初の Jim が耳に残りやすい。No と Yes の順番を、名前と組にして聞く。',
      use: 'Was it you? — No, it wasn’t me.（あなた？いいえ、私じゃない）' },

    // R fix: V2 (blind 55 %): "save the favor for later" was weak; now a role swap (Dwight should take it), which only
    //   the pronouns settle: "He can do the same for you".
    // why: fired soon ← "getting fired" is said, in the wrong relation; Dwight ← "he" and "you" swapped, the usual
    //   loss when two men are "he"
    { id: 'i3', skill: 'infer', level: 'B2', point: 'same', seg: [222.9, 230.5],
      stem: 'What is the coworker’s point about Michael’s promise to Dwight?',
      choices: ['If Michael meant it, he could take the blame now', 'Michael will be fired soon, so Dwight is safe',
                'If Dwight meant it, he should take the blame now'], a: 0,
      cue: '「do the same」のくり返しと、そのあと。',
      line: 'He said he would *do the same for me*. — He can do the same for you *right now*, by *getting fired instead of you*.',
      said: '「同じことをすると言った」に「なら今できる。代わりにクビになれば」と返す。',
      mean: '約束が本物なら今こそ守れるはず、という皮肉。',
      trap: 'he が二人いて取り違えやすい。He can do the same for you の he は Michael。',
      use: 'If you mean it, prove it now.（本気なら今証明して）' },

    // R fix: V2 (blind 60 %): "turned down a new idea" was weak; now "Dwight complained" (unfortunate as Dwight's
    //   bad mood).
    // why: sorry ← "unfortunate" heard as regret for his own act; complained ← "a very unfortunate conversation" heard
    //   as Dwight being the unhappy one
    { id: 'i4', skill: 'infer', level: 'B2', point: 'unfortunate', seg: [263.3, 270.95],
      stem: 'What does Michael want David to think his talk with Dwight was?',
      choices: ['A talk where he punished Dwight for the idea', 'A talk where he said sorry to Dwight for it',
                'A talk where Dwight complained about him'], a: 0,
      cue: '「unfortunate」のあと、「But」で何を足すか。',
      line: 'Dwight and I were just having a *very unfortunate conversation*. … But it *had to be done*, didn’t it?',
      said: '「気の重い話をしていた。でも必要だった、ですよね？」と言う。',
      mean: '処分したと見せ、上司に同意を求める。didn’t it? は念押し。',
      trap: 'unfortunate を反省と取りやすい。but のあとの had to be done が本音。',
      use: 'It wasn’t easy, but it had to be done.（楽じゃないけど、必要だった）' },

    // predict: the segment stops after "can't be undone"; the reveal plays the apology and the Blue Cross news
    // R fix: V2 (blind 70 %): the key was the only good news. Now a second good-news choice (it clears Michael).
    // why: bad news ← "too bad" and "unfortunate" just before set a gloomy frame; clears Michael ← good news after a
    //   blame call seems to help the one blamed on the phone
    { id: 'r1', skill: 'predict', level: 'B2', point: 'undone', reveals: ['exclusive'], seg: [263.3, 273.3],
      then: [273.3, 282.95],
      stem: 'After David’s “Hopefully nothing that can’t be undone…”, what kind of news follows?',
      choices: ['Good news that changes how Dwight is seen', 'Good news that clears Michael of all blame',
                'Bad news that means Dwight has to go'], a: 0,
      cue: '「元に戻せないことでなければ」は何の前置き？',
      line: 'Hopefully nothing that *can’t be undone*. Because Dwight, *I owe you an apology*.',
      said: '「取り返しのつかないことでなければ。君に謝らないと」と続ける。',
      mean: 'can’t be undone ＝ 元に戻せない。状況が変わる知らせの前置き。',
      trap: '直前の too bad で悪い知らせを予想しやすい。because のあと誰の名前を呼ぶかに注目。',
      use: 'I hope it’s nothing that can’t be fixed.（直せないことじゃないといいけど）' },

    // R fix: V2 (blind 75 %): only the key was good news. Now a near miss ("more of", not "all … only") sits next to it.
    // why: stop ← the earlier fear of losing the client; more ← "so excited" heard, "exclusive… all" missed
    { id: 'd4', skill: 'detail', level: 'B1', point: 'exclusive', reveals: ['undone'], seg: [276.1, 287.2],
      stem: 'What has Blue Cross decided to do?',
      choices: ['Buy all its office supplies only from them', 'Stop buying any office supplies from them',
                'Buy more of its office supplies from them'], a: 0,
      cue: '「decided to make」のあと。',
      line: 'they have decided to make Dunder Mifflin their *exclusive provider of all office supplies*.',
      said: '「割引に大喜びして、事務用品をすべてうちから買うことに」と伝える。',
      mean: 'exclusive provider ＝ 独占の取引先。損どころか大きな契約に。',
      trap: '良い知らせでも「増やす」程度と取りやすい。exclusive と all は「全部うちから」。',
      use: 'We’re their only supplier now.（うちが唯一の仕入れ先になった）' },

    // R fix: S4: the start cut "going"; now 336.6.
    { id: 'x2', skill: 'dict', level: 'B2', point: 'pop', seg: [336.6, 338.65],
      stem: 'Type the question: “How did it ___, Dwight?” (4 words)', answer: 'pop into your head',
      cue: '「How did it」のあと、四語がつながる。',
      line: 'How did it *pop into your head*, Dwight?',
      said: '「どうやって頭に浮かんだんだ？」と問い詰める。',
      mean: 'pop into one’s head ＝ ふと思いつく。pop‿into がつながり「ポピントゥ」に近い。',
      trap: 'into your が「イントゥヤ」と短くなり、語の数を数えにくい。前置詞は弱く速い。',
      use: 'It just popped into my head.（ふと思いついたんだ）' },

    // anchor: 4.3–10.7 s the man greeted as "Michael" says "I am not Michael. I am Willy Wonka!"; 347.3–351.8 s "I even
    //   made fun of you when you dressed up as Willy Wonka to pitch this idea" is said to Dwight, who answers "What?",
    //   then "Apology rejected", while Michael has just pressed Dwight for "the details of how that happened"
    // why: Dwight ← "the biggest Wonka fan I know" is said to him, so it sounds like teasing him; the speaker ← "for
    //   that I apologize" taken as sincere
    // R fix: S4: the start cut "happened"; now 340.75. It no longer reveals 'outcome' (g1 now asks about the deal,
    //   which this line doesn't touch).
    { id: 'c2', skill: 'humor', level: 'C2', point: 'wonka', reveals: ['explain'], seg: [340.75, 354.4],
      stem: 'In the coworker’s apology to Dwight, who is the joke really on?',
      choices: ['Michael, the one who really wore the Wonka suit', 'Dwight, for being an odd Wonka superfan',
                'The speaker, for having mocked a good idea'], a: 0,
      cue: '冒頭で Wonka を名乗っていたのは誰か。',
      line: 'the biggest Wonka fan I know… I even made fun of you when you *dressed up as Willy Wonka* to pitch this idea…',
      said: '「一番の Wonka ファン。Wonka の格好の君をからかって悪かった」と謝る。',
      mean: '格好をしたのは Michael。作り話で手柄は Dwight に固まり、本人は名乗れない。',
      trap: '謝罪を本気、的を Dwight と取りやすい。言葉の宛先と、刺さる相手は別。',
      use: 'Oh, I’m sure it was all your idea.（きっと全部君の案なんだろうね）' },

    // R fix: V2 (blind 50 %): "fly out" was a stretch; now "meet with them when they visit", from “They should meet
    //   you” (whisper; captions "they said I need you", so it carries no key).
    // why: visit ← "They should meet you" right after; celebrate ← horn = ラッパ, blown at a party
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'horn', seg: [362.1, 369.95],
      stem: 'What does David want Dwight to do with the people in New York?',
      choices: ['Talk with them on the phone', 'Meet with them when they visit', 'Celebrate the deal with them'], a: 0,
      cue: 'New York の前の言い方と、すぐあとの頼み。',
      line: 'I want to get you *on the horn* with the marketing people in New York. … Pam, could you *set up a call*…',
      said: 'ニューヨークの人と話させたいと言い、Pam に電話を頼む。',
      mean: 'on the horn ＝ 電話で（くだけた言い方）。すぐ set up a call と続く。',
      trap: 'horn をラッパ、meet を会う話と取りやすい。直後の call で決まる。',
      use: 'Let me get him on the horn.（彼に電話してみる）' },

    // why: five ← "fif-" alone is caught; fifty ← -teen/-ty; an hour ← "about" heard as a rough, longer wait
    { id: 'n2', skill: 'number', level: 'B1', point: 'minutes', seg: [366.5, 370.0], keep: true,
      stem: 'When does David want the call to start?',
      choices: ['In about five minutes', 'In about fifteen minutes', 'In about fifty minutes', 'In about an hour'], a: 1,
      cue: '「in about」のあとの数。',
      line: 'Pam, could you set up a call in there in *about 15 minutes*, please?',
      said: '「15分後くらいに、あの部屋で電話をつないで」と Pam に頼む。',
      mean: 'fifteen は後ろの teen を強く長く言う。fifty は前の fif が強い。',
      trap: '-teen と -ty は似て聞こえる。強さが後ろなら teen、前なら ty。',
      use: 'Can we meet in about fifteen minutes?（15分後くらいに会える？）' },

    // R fix: V2 (blind 70 %): "in trouble for the mess" was weak; now "putting him off until later" (the Japanese
    //   「また今度」 frame).
    // why: concern ← "too much to do" and "your time" taken at face value (遠慮 read as kindness); later ← "another
    //   meeting" heard as a promise of one (refuted: nothing is offered, and "Wonka fans only" leaves him out)
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'meeting', seg: [373.4, 383.0],
      stem: 'What is David doing with his reply to Michael’s request?',
      choices: ['Keeping him out while sounding considerate', 'Putting him off until a later meeting',
                'Sparing him out of real concern for his time'], a: 0,
      cue: '断りの理由と、すぐあとの同僚の一言。',
      line: 'You probably have *too much to do* around here. I don’t want to *take up your time*… — … *Wonka fans only*.',
      said: '「忙しいだろう。時間を取らせたくない」と答え、同僚が「Wonka ファン限定」と足す。',
      mean: '気づかう形の断り。会議に入れたくない本音を、相手の忙しさを理由に包んでいる。',
      trap: '気づかいの言葉を親切と取りやすい。頼みに理由だけ返ったら、たいてい「ノー」。',
      use: 'I don’t want to keep you. You’re busy.（引き止めちゃ悪いね、忙しいでしょ）' },
  ]
};
