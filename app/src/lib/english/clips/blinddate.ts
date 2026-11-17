// REVIEW 2026-11-17: pass 5, fix 14, drop 0, new 0; ear checks 1
// Open: c2's key is the only “Spencer” choice (two “The woman” near misses), so it may still read at about 50 % blind.
// “spencer goes on a blind date (literally) 🫣 | iCarly #shorts” (NickRewind, the official iCarly channel, Best of the
// New iCarly 🎉): Spencer has blinded himself again and asks his friend to be his eyes on a date; the friend suspects a
// trick, tests him with a “think fast”, and believes him; Spencer has forgotten the woman's name and plans to have the
// friend, as a “butler”, read her driver's license, but he's been saying it to the woman herself.
// Segments from the captions, words from whisper (2026-11-17). Spencer is named by the title; the friend is named only
// in the line h1 hangs on, so stems call him “his friend”. Who is who rests on the words: the doubter asks “You expect
// me to fall for this again?”, and the one who “really can't see” is Spencer.
// Untested on purpose: 19–31 s (the throw, the fall and “That's my fault, I deserve it”, whose speaker isn't settled),
// 40.4 s (captions “her purse”, whisper “her person”: no line quotes it), 48–56 s (the woman's lines, garbled in both).
// EAR CHECK: 45.6 s h1 — captions “You're not Freddy, are you?”, whisper “You're not ready. Are you?”; the key and the
//   reversed mix-up distractor assume the name (he realizes he's been talking to someone else; “It's Sarah” follows)
import type { Clip } from '../types.ts';

export const blindDate: Clip = {
  id: 'blinddate', video: 'skMmid_AK6U', title: 'spencer goes on a blind date (literally)', dur: 56, wpm: 161,
  band: 'mid', tags: ['恋愛', 'お願い・断り'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %): “embarrassed” came from a later line and nobody would pick it; now a “casual” near miss
    // why: doubtful ← “hard to tell… only talked for 5 minutes” taken as his own doubt; calm ← “we'll see where the
    //   night takes us” heard as shrugging it off
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'hope', reveals: ['talk'], seg: [0, 11.4],
      stem: 'How does Spencer feel about tonight’s date?',
      choices: ['Hopeful about where it could lead', 'Doubtful, since they barely talked',
                'Calm, since it’s only a casual date'], a: 0,
      cue: '「soulmate」と「romantic」の前後。',
      line: 'a *gorgeous woman* who *just might be my soulmate*',
      said: 'すごくきれいな人で、運命の人かもしれない、と話している。',
      mean: '会ったばかりでも期待でいっぱい。romantic は「夢見がち」に近い。',
      trap: '「5分しか話してない」を不安と取りやすいが、すぐ but I’m a romantic で打ち消している。',
      use: 'She just might be the one.（運命の人かもしれない）' },

    // R fix: V2 (blind 60 %): the key was the only doubt-then-belief path; now three test outcomes, two near misses
    // why: believes, then doubts ← the usual sitcom script where the faker gets caught; proves him right ← the test
    //   heard as exposing the act (“Oh” read as “caught you”)
    { id: 'g1', skill: 'gist', level: 'B2', point: 'turn', reveals: ['again', 'truth'], seg: [0, 31],
      stem: 'How does his friend’s view of Spencer’s story change?',
      choices: ['He doubts it, until a test makes him half-believe it',
                'He believes it, until a test makes him doubt it', 'He doubts it, and a test proves him right'], a: 0,
      cue: '最初の疑う一言と、物が飛んだあとの一言。',
      line: 'You expect me to *fall for this again*? … *Might be telling the truth*.',
      said: '「また騙されると思う？」と疑うが、物を投げたあとで「本当かも」と言う。',
      mean: '前半は疑い、試してみて考えが変わる、という流れ。',
      trap: '仮病がばれる展開はよくあるが、ここは逆。疑いから信じる方へ動いている。',
      use: 'Okay, maybe you’re right.（わかった、そうかもね）' },

    // anchor: 3.0–9.5 s “just might be my soulmate… hard to tell cuz we only talked for 5 minutes… but I'm a
    //   romantic”: he raises the doubt himself and waves it off with “but”
    // R fix: V2 (C2, blind 55 %; its one rewrite): all three now open “I barely know her”, so the key isn't the odd form
    // why: hopes low ← “hard to tell” taken as real caution (the literal hedge); sure ← “soulmate” heard without “just
    //   might” and “hard to tell” (scope)
    { id: 'c1', skill: 'infer', level: 'C2', point: 'hope', reveals: ['talk'], seg: [2.3, 11.4],
      stem: 'Which plain-English version keeps what Spencer means about the woman?',
      choices: ['“I barely know her, but I’m hoping for a lot.”', '“I barely know her, so I’m keeping hopes low.”',
                '“I barely know her, but I’m sure she’s the one.”'], a: 0,
      cue: '控えめな言葉と、そのあとの打ち消し。',
      line: '*just might be* my soulmate, but it’s *hard to tell*… *but I’m a romantic*.',
      said: '「運命の人かも。5分しか話してないから分からないけど、ロマンチストだから」。',
      mean: '自分で疑いを出し、but で打ち消す。分からないと認めつつ、大いに期待している。',
      trap: 'hard to tell を慎重さと取りやすい。打ち消しの but のあとが本音。控えめな語は次の一言と合わせて聞く。',
      use: 'It’s early, but I have a good feeling.（まだ早いけど、いい予感がする）' },

    // why: eye doctor ← “eyewash” and his eyes come up later; online ← “only talked” read as chatting, not meeting
    { id: 'd1', skill: 'detail', level: 'B1', point: 'met', seg: [5.2, 9.45],
      stem: 'Where did Spencer meet the woman?',
      choices: ['At the emergency room', 'At an eye doctor’s office', 'Online, through a chat app'], a: 0,
      cue: '「only talked」のあと、場所を表す言葉。',
      line: 'we only talked … at the *emergency room*',
      said: '「救急外来で少し話しただけ」と言っている。',
      mean: 'emergency room ＝ 救急外来（ER）。けがの手当ての場で知り合った、ということ。',
      trap: 'eyewash（目の洗浄）があとで出るので眼科を選びやすい。場所は at のあとを聞く。',
      use: 'Where’s the nearest emergency room?（一番近い救急外来はどこ？）' },

    // why: 15/50 ← “for five” runs together, and with “only” missed a longer talk seems likely
    { id: 'n1', skill: 'number', level: 'B1', point: 'talk', seg: [5.2, 9.45], keep: true,
      stem: 'How long had Spencer talked with her?',
      choices: ['5 minutes', '15 minutes', '50 minutes'], a: 0,
      cue: '「only talked for」のあとの数字。',
      line: 'we *only* talked for *five minutes*',
      said: '「5分しか話していない」。only が「たった」の気持ち。',
      mean: '運命の人と言うには短すぎる。だから hard to tell（何とも言えない）と言う。',
      trap: 'for five がつながって聞き取りにくい。only があれば短い時間だと考える。',
      use: 'I only slept for four hours.（4時間しか寝てない）' },

    // R fix: V2 (blind 55 %): “all night” was weak; now “let her choose”, the literal “takes us” from a man who can't see
    // why: let her choose ← “the night takes us” read as her leading him; decide later ← “we'll see” read as putting
    //   off a decision (様子を見る)
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'night', seg: [5.2, 11.6],
      stem: 'At the end of his first turn, what does Spencer say about tonight?',
      choices: ['He has no fixed plan and will go with it', 'He will let her choose where they go',
                'He will decide later whether to go at all'], a: 0,
      cue: '「romantic」のあと、最後のひと言。',
      line: 'but I’m a romantic. *We’ll see where the night takes us*.',
      said: '「ロマンチストだから、夜の流れに任せる」と言う。',
      mean: 'see where ～ takes us ＝ 成り行きに任せる。計画を決めない、前向きな言い方。',
      trap: 'we’ll see を「行くか考える」と取りやすいが、行く前提。takes us の主語は夜。',
      use: 'Let’s just see where the day takes us.（今日は成り行きに任せよう）' },

    // R fix: V2 (blind 60 %): “same trick twice” paraphrased the idiom and “trip and fall” was absurd (K3)
    // why: fall for a woman ← “fall for” = fall in love, and the date is the topic; woman is real ← “this” taken as the
    //   date story rather than the blindness
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'again', seg: [11.3, 17],
      stem: 'What does his friend’s first question say he won’t do?',
      choices: ['Believe Spencer’s story a second time', 'Fall for a woman he has never met',
                'Believe the woman is real this time'],
      a: 0,
      cue: '「expect me to」のあと、最後の again まで。',
      line: 'You expect me to *fall for this again*?',
      said: '「また同じ手に引っかかると思う？」と言う。',
      mean: 'fall for ～ ＝ だまされる、引っかかる。again で、前にも同じことがあったと分かる。',
      trap: 'fall for は「好きになる」の意味もあるが、for this（この手）なら「引っかかる」。',
      use: 'I’m not falling for that again.（もうその手には乗らないよ）', retired: true },

    // R fix: V2 (blind 55 %): “eager” was weak; now “annoyed at another date”, “fall for this again” read as
    //   “get dragged into this again”
    // why: worried ← “blinded myself again” makes sympathy the expected reply; annoyed ← “this again” taken as the
    //   favour, not the claim
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'again', seg: [11.3, 17],
      stem: 'How does his friend first react to Spencer’s request?',
      choices: ['Doubtful that Spencer is really blind this time',
                'Worried that Spencer has hurt his eyes again', 'Annoyed at being pulled into another date'], a: 0,
      cue: '最初の質問の形と、最後の again。',
      line: 'You *expect me to* fall for this *again*?',
      said: '「また信じると思う？」と、疑いの質問で返している。',
      mean: '質問の形だが、答えは求めていない。「今回は信じないよ」という反応。',
      trap: 'again は前回の心配にも聞こえるが、expect me to ～? は「そんなの信じない」の型。',
      use: 'You expect me to believe that?（それを信じろって？）' },

    // R fix: S1 (“that question” leaned on another item's stem) and V2 (blind 65 %, the only “no”): the maybe became a
    //   second no on the wrong proposition
    // why: yes ← “yeah” taken at face value as agreeing it's a trick; no to helping ← the no heard, the thing it
    //   answers missed
    { id: 'm1', skill: 'marker', level: 'C1', point: 'yeahno', reveals: ['again'], seg: [11.3, 17],
      stem: 'When Spencer answers “You expect me to…?”, what is his answer in effect?',
      choices: ['A no: it isn’t a trick this time', 'A yes: he admits it is a trick',
                'A no: he won’t need his help after all'],
      a: 0,
      cue: '答えの最初の二語と、そのあとの理由。',
      line: '*Yeah, no*, there’s *nothing to fall for*. I really can’t see.',
      said: '「いや、引っかける話じゃない。本当に見えない」と答える。',
      mean: 'Yeah, no ＝ 受けてからの「いや」。答えは no の方。',
      trap: 'yeah と no が並ぶと迷いに聞こえるが、後ろの nothing to fall for で答えが決まる。',
      use: 'Yeah, no, I’m not doing that.（いや、それはやらないよ）' },

    // R fix: V2 (blind 55 %): the key's invented “catch this” quote was the one vivid choice; reworded, and the
    //   apology distractor (its line falls outside the segment and its speaker isn't settled) became “admits he faked it”
    // why: swears ← “I really can't see” comes just before, but words alone didn't move him; admits ← “again” and
    //   “fall for this” suggest a past fake, so a confession seems a natural turn
    { id: 'i1', skill: 'infer', level: 'C1', point: 'truth', seg: [13.2, 25.2],
      stem: 'What makes his friend say Spencer “might be telling the truth”?',
      choices: ['Spencer can’t catch what gets thrown to him', 'Spencer swears again that he really can’t see',
                'Spencer admits he faked it the last time'], a: 0,
      cue: '「think fast」と、そのあとの短い声。',
      line: '*Think fast.* … *Oh.* … Might be telling the truth.',
      said: '「ほら、取って！」と声をかけ、「おっと…本当かも」。',
      mean: 'think fast ＝ 物を投げるときの「ほら！」。受け取れず、見えないのは本当らしい。',
      trap: 'I really can’t see で信じたと取りやすいが、言葉では信じず、試してから変わった。',
      use: 'Think fast! Catch!（ほら、受け取って！）' },

    // why: five minutes ← “5 minutes” was said earlier, and “minute” comes again; later tonight ← “a date tonight” in
    //   the first line
    { id: 'd3', skill: 'detail', level: 'B1', point: 'soon', seg: [16, 19.6],
      stem: 'When is the date going to arrive?',
      choices: ['Any minute now', 'In about five minutes', 'Later on tonight'], a: 0,
      cue: '「think fast」の直前の一文。',
      line: 'She’s gonna be here *any minute*.',
      said: '「もうすぐ彼女が来る」と言っている。',
      mean: 'any minute ＝ 今にも、いつ来てもおかしくない。急いでいる気持ちも伝わる。',
      trap: 'minute が聞こえるので、前の five minutes と結びつけやすい。any が付くと「今すぐにも」。',
      use: 'The bus should be here any minute.（バスはもうすぐ来るはず）' },

    // why: out ← “help me out” is the more familiar chunk, and final p and t are both barely released; off ← a short
    //   vowel and stop heard as “off”
    { id: 's1', skill: 'sound', level: 'B2', point: 'up', seg: [28.5, 31.5],
      stem: 'Fill the gap: “Can you help me ___?”',
      choices: ['up', 'out', 'off'], a: 0,
      cue: '文の最後、短く消えそうな音。',
      line: 'Can you *help me up*?',
      said: '「起こしてくれる？」と頼んでいる。',
      mean: 'help ～ up ＝ 起き上がるのを手伝う。転んだあとの頼み方。',
      trap: 'help me out（助けて）の方が聞き慣れていて選びやすい。語末の p は口を閉じるだけで、ほぼ音がない。',
      use: 'Could you help me up the stairs?（階段を上がるのを手伝って）' },

    // R fix: V2 (blind 70 %): only the key had a reason behind the butler act; now all three are “butler and …”
    // why: her age ← a license shows age, the usual reason to check one; drive ← “driver's license” heard as a
    //   driving job
    { id: 'g2', skill: 'gist', level: 'B2', point: 'plan', reveals: ['name', 'license'], seg: [28.5, 47.6],
      stem: 'Once the date arrives, what does Spencer want his friend to do?',
      choices: ['Act as his butler and find out her name', 'Act as his butler and check how old she is',
                'Act as his butler and drive them to dinner'], a: 0,
      cue: '「pretend to be」のあと、何をするか。',
      line: 'pretend to be my *butler*… look at her *driver’s license*',
      said: '執事のふりをして、彼女の免許証を見てほしい、と頼む。名前を知るため。',
      mean: '執事役はただの口実。本当の目的は、忘れた名前を確かめること。',
      trap: 'butler で「給仕」、driver’s license で「運転」を想像しやすいが、見たいのは免許証の名前。',
      use: 'Can you pretend to be my brother?（兄のふりをしてくれる？）' },

    // R fix: V2 (blind 55 %, K5): parallel “Getting ready to …” choices, so the key isn't the only one about feelings
    // why: scold ← “now listen” also starts a scolding, and he has just been hit; secrecy ← the plan that follows
    //   is sneaky
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'confess', reveals: ['name'], seg: [32, 37.2],
      stem: 'What is Spencer doing when he begins with “Now listen…”?',
      choices: ['Getting ready to admit something awkward', 'Getting ready to scold him for the test',
                'Getting ready to swear him to secrecy'], a: 0,
      cue: '「Now listen」のあとの言葉と、but。',
      line: 'Now listen, *this is embarrassing, but* I have forgotten…',
      said: '「いいか、恥ずかしいんだけど…」と前置きして打ち明ける。',
      mean: 'this is embarrassing, but ＝ 言いにくい告白の前置き。but のあとに本題が来る。',
      trap: 'Now listen は叱るときにも使うが、ここは自分の失敗を話す前の合図。',
      use: 'This is embarrassing, but I’m lost.（恥ずかしいけど、道に迷った）' },

    // R fix: V2 (blind 80 %): “where she lives” was a filler; now the time, from “any minute” said just before
    // why: looks ← he can't see now, and “hot” is about her looks; time ← “she's gonna be here any minute” is the
    //   last thing he said about her
    { id: 'd2', skill: 'detail', level: 'B1', point: 'name', seg: [32, 37.2],
      stem: 'What has Spencer forgotten about his date?',
      choices: ['What her name is', 'What she looks like', 'What time she’s coming'], a: 0,
      cue: '「forgotten」のあと、最後の一語。',
      line: 'I have *forgotten* hot eyewash lady’s *name*.',
      said: '「“目を洗ってた美人”の名前を忘れた」と言っている。',
      mean: '名前を知らないので、あだ名で呼ぶしかない。だから次の作戦が要る。',
      trap: 'hot は見た目の話なので「顔を忘れた」と取りやすいが、最後の name が答え。',
      use: 'I’m sorry, I’ve forgotten your name.（すみません、お名前を忘れてしまって）' },

    // anchor: 33.2–36.8 s “this is embarrassing, but I have forgotten hot eyewash lady's name”: the slip is his own,
    //   and it lands on the woman he called “my soulmate” at 4.8 s
    // R fix: V2 (C2, blind 60 %; its one rewrite): the friend option was weak; now a “hot = judged by looks” near miss
    // why: by her looks ← “hot” heard as the put-down (right mechanism, wrong target); eye trouble ← the nickname
    //   sounds like it mocks her
    { id: 'c2', skill: 'humor', level: 'C2', point: 'eyewash', reveals: ['name'], seg: [32, 37.2],
      stem: 'Who is the joke on when Spencer calls her “hot eyewash lady”?',
      choices: ['Spencer: his “soulmate” is a woman he can’t name', 'The woman: he knows her only by her looks',
                'The woman: she’s known only for her eye trouble'], a: 0,
      cue: '恥ずかしいと言っているのは誰か。',
      line: 'this is *embarrassing*, but I have *forgotten* hot eyewash lady’s name.',
      said: '「恥ずかしいけど、“目を洗ってた美人”の名前を忘れた」と打ち明けている。',
      mean: '運命の人とまで言った相手を、名前でなくあだ名でしか覚えていない。笑われているのは本人。',
      trap: 'あだ名は相手をからかうように聞こえるが、hot はほめ言葉で、恥じているのは本人。笑いの的は、しくじった人。',
      use: 'I’m terrible with names, sorry.（名前を覚えるのが苦手で、ごめん）' },

    // R fix: V2 (blind 75 %): “take her home” was weak; now “check she's who she says”, the other ID reason
    // why: age ← a license shows age, a usual reason to check one; identity ← checking an ID reads as doubting her
    { id: 'i2', skill: 'infer', level: 'C1', point: 'license', reveals: ['name'], seg: [32, 42.25],
      stem: 'Why does Spencer want her license checked instead of just asking her?',
      choices: ['So she won’t find out he forgot her name', 'So he can find out how old she really is',
                'So he can check she is who she says'], a: 0,
      cue: '「embarrassing」と、免許証の話をつなげて。',
      line: 'this is embarrassing… look at her *driver’s license*',
      said: '名前を忘れたのは恥ずかしい、だから免許証をこっそり見てほしい、とつながる。',
      mean: '本人に聞けば忘れたことがばれる。言わないけれど、面目を守りたい。',
      trap: '免許証で年齢や身元も分かるが、話の流れは「名前を忘れた」から始まっている。',
      use: 'I didn’t want to ask and look silly.（聞いたら恥ずかしいと思って）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'allineed', seg: [36.85, 39.7],
      stem: 'Type what he says: “___ is pretend to be my butler.” (6 words)', answer: 'all i need you to do',
      cue: '「name」のあと、文の頭。',
      line: '*All I need you to do* is pretend to be my butler',
      said: '「頼みたいのは、執事のふりだけ」。',
      mean: '頼みを小さく見せる言い方。need you to が「ニージュタ」とつながる。',
      trap: 'you と to が弱く、I need do のように聞こえやすい。頼みの型で覚えると拾える。',
      use: 'All I need you to do is sign here.（ここにサインするだけでいいです）' },

    // R fix: K3 (blind 50 %): “takes his friend for the butler” made no sense; now the reverse mix-up. S4: the segment
    //   now runs through “It's Sarah”, which settles who he's touching
    // why: flattery ← “your hands are really soft” read as a compliment before a favour (the お世辞 frame); flirting
    //   with his friend ← “soft hands” heard as meant for his date, the mix-up reversed
    { id: 'h1', skill: 'humor', level: 'C1', point: 'hands', seg: [38.2, 52.7],
      stem: 'What makes the end of Spencer’s request funny?',
      choices: ['He has been telling the plan to his date herself', 'He praises his friend’s hands to soften the ask',
                'He takes his friend’s hands for his date’s'], a: 0,
      cue: '手の話のあと、相手を確かめる質問。',
      line: '*Your hands are really soft.* … *You’re not Freddie, are you?* … It’s Sarah.',
      said: '「手がすごく柔らかいね…君、フレディじゃないよね？」と気づく。',
      mean: '見えないまま、名前をこっそり調べる計画を、当の彼女に話していた。そこが笑い。',
      trap: '手をほめるのは頼みの前のお世辞にも聞こえるが、続く質問で相手が別人だと分かる。',
      use: 'Wait, you’re not Tom, are you?（待って、トムじゃないよね？）', retired: true },
  ]
};
