// “House Tour from Hell - The Office US” (the official The Office channel, BEST OF SEASON 4 - The Office US): two
// guests arrive for dinner, and the hosts give a proud tour of a home full of odd choices (a "workspace" for
// candles, a repainted bedroom, a bench for a bed, a TV set into the wall, awards put away).
// Segments from the captions, words from whisper (2026-11-16); whisper runs in uniform 1 s blocks, so every time is
// the captions'. Untested: 0–7 s (greetings), 31 s (whisper's "Oh, well, Pam", the captions' "oh whoa oh"), 54–60 s
// (the construction), 89–99 s (the "bonfire / James Bond" candle names: garbled in both, and whisper's "Michael's
// gone" isn't in the captions), 125–131 s ("Maybe… Exactly… I thought you said… Shame on you": no names, speakers
// unsettled), 141–150 s ("he's"/"seems pretty narrow"), 168–170 s ("a lot of people in the room"), 184–189 s (who
// names the wood), 193.6 s ("He tried" in the captions, "I tried" in whisper; n1's line starts after it), 201.5 s
// ("I bet you are": its sting rests on delivery), and 209–217 s (which one the host chose to keep).
// EAR CHECK: 217.3–222.1 s h3 — "Oh, honey, I have the best trophy right here" and "Aside from my Dundies" keyed as the
//   same speaker (the host whose Dundies they are); no name settles the first line
// REVIEW 2026-11-16: pass 6, fix 18, drop 0, new 0; ear checks 1
import type { Clip } from '../types.ts';

export const housetour: Clip = {
  id: 'housetour', video: 'wFv3SQ0YTv0', title: 'House Tour from Hell - The Office US', dur: 244, wpm: 153,
  band: 'slow', tags: ['家', '友だち'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %) — "remind him" was weak; the catch-up reading of "since I saw you" is the near miss,
    //   and "an hour ago" refutes it
    // why: catch-up ← "since I saw you…" usually opens a long "what's new"; kept waiting ← "an hour" heard as a
    //   delay, but nobody waited
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'hour', seg: [16.2, 24.3],
      stem: 'When asked what he has been doing, what does the guest’s reply do?',
      choices: ['Points out they saw each other a short time ago', 'Starts a long catch-up on all his recent news',
                'Complains that he was kept waiting for an hour'], a: 0,
      cue: '「Let’s see」のあと、since で始まる部分。',
      line: 'Let’s see, *since I saw you an hour ago*?',
      said: '「えーと、1時間前に会ってから？」と返し、支度して運転してきた、と答える。',
      mean: '1時間前に会ったのに「最近どう？」は変な質問。それをやんわり指摘している。',
      trap: '上がり調子で質問に聞こえるが、すぐ自分で答える。確認の形で、相手の変さを示している。',
      use: 'Since I saw you this morning?（今朝会ってから？）' },

    // R fix: V2 (blind 50 %) + S1 — "two-word add-on" pointed at a pointless detail; the stem now names the moment
    //   by "Really?", and the key no longer says "obvious"
    // why: guests late ← an add-on after "driving over here" heard as a dig at the time they took; went out too ←
    //   "except" heard as "and also", as if the hosts drove somewhere
    { id: 'h1', skill: 'humor', level: 'C1', point: 'except', seg: [16.2, 29.4],
      stem: 'Why does the host’s answer to “Really?” get a laugh?',
      choices: ['He fixes a tiny, plain difference as if it mattered', 'He hints that the guests took too long to arrive',
                'He reveals that the hosts went out somewhere too'], a: 0,
      cue: '「same thing」のあと、Really? への返事。',
      line: 'we’ve been doing pretty much the same thing. — Really? — *Except driving.*',
      said: '「僕らもほぼ同じことしてたよ」「本当？」「運転以外はね」と返す。',
      mean: '家にいたのだから運転しないのは当たり前。中身のない会話を大まじめに補うおかしさ。',
      trap: 'except を「〜もした」と取りやすい。except のあとは、同じでない部分。',
      use: 'Same here, except the long drive.（こっちも同じ。長い運転以外はね）' },

    // why: serving ← a dinner party, so a gift for the guests' plates; the table ← a gift for the home is often
    //   decor, but "cook with" is said
    { id: 'd1', skill: 'detail', level: 'B1', point: 'gift', seg: [29.4, 35.7],
      stem: 'What does the host say the gift will be good for?',
      choices: ['Cooking meals in the kitchen', 'Serving food to the guests', 'Setting out on the table'], a: 0,
      cue: '「Thank you」のあと、will be で始まる文。',
      line: 'Thank you. That’s so nice. This will be *great to cook with*.',
      said: '贈り物に「ありがとう、すてき。料理に使えそう」と答える。',
      mean: 'great to cook with ＝ 料理に使えそう。お礼のあと、使い道をほめる型。',
      trap: 'パーティーの場なので客に出す物に思えるが、cook with は自分が料理に使う物。',
      use: 'This will be great to cook with.（料理に使えそう）' },

    // R fix: V2 (blind 50 %) — "annoyed" had nothing in the segment to lean on; the easygoing reading of "or… I
    //   don't know, make yourself…" is the near miss, and the stumbling refutes it
    // why: bossy ← "have a seat" heard as an order, but he drops it at once; easygoing ← "or, I don't know" heard
    //   as "whatever you like", but it's three starts in one breath
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'nervous', reveals: ['home'], seg: [35.5, 42.2],
      stem: 'How does the host sound as he asks them in?',
      choices: ['Flustered; he keeps changing what he says', 'Bossy; he tells them just where to sit',
                'Easygoing; he lets them do just as they like'], a: 0,
      cue: '同じ文の中で、言い直しが何回あるか。',
      line: 'We’ll have a seat *or* come on in *or, I don’t know*, make yourself to home.',
      said: '「座って、いや入って、いや、えっと、くつろいで」と言い直し続ける。',
      mean: 'or を重ね、I don’t know まで言う。ホスト役に慣れず、あがっている。',
      trap: '「座って」は指図に聞こえるが、すぐ言い直す。言い直しの多さは緊張の印。',
      use: 'Sorry, I’m a little nervous.（ごめん、ちょっと緊張してて）' },

    // R fix: V2 (blind 90 %) + S2 — the stem quoted "make yourself…", which gives the set phrase away; it now
    //   names the moment, and two "make yourself…"-like readings are the distractors
    // why: help yourselves ← "help yourself" is the other "-self" welcome; look around ← the tour comes next, so
    //   "make yourself…" heard as "go ahead and explore"
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'home', seg: [35.5, 42.2],
      stem: 'At the end of his welcome, what does the host invite them to do?',
      choices: ['Relax as if this were their own house', 'Help themselves to the food and drinks',
                'Feel free to look around the whole house'], a: 0,
      cue: 'make yourself のあと、to home の部分。',
      line: '*make yourself to home*. This is our casa.',
      said: '「くつろいで」の決まり文句を、at でなく to で言っている。',
      mean: '「自分の家のようにくつろいで」の意味。少し崩れても意味は同じ。',
      trap: 'help yourself（自由に取って）と混ざりやすい。make yourself の後の home まで聞く。',
      use: 'Please, make yourself at home.（どうぞ、くつろいでください）' },

    // C2: exact words a learner's grammar would "correct" (cf. p1)
    // anchor: 39.5–40.5 s both sources have "make yourself to home"; just before, "or… or, I don't know" shows a host
    //   losing his words, so the slip is his, not the transcript's
    // why (the instinct): "make yourself at home" ← the set phrase learners know; "make yourself home" ← the weak "to"
    //   dropped as noise
    { id: 'c2', skill: 'dict', level: 'C2', point: 'home', seg: [37.9, 42.2],
      stem: 'Type the end of the welcome: “I don’t know, ___.” (4 words)', answer: 'make yourself to home',
      cue: '「I don’t know」のあと。正しい形より聞こえた音。',
      line: 'or, I don’t know, *make yourself to home*.',
      said: '「えっと、くつろいで」のつもりで、at の代わりに弱い to を言っている。',
      mean: '決まり文句が少し崩れるのは、緊張したホストらしさ。to は弱く「タ」に近く、home とつながる。',
      trap: '習った at home に直したくなる。書き取りは、正しい形でなく言われた音を書く。',
      use: 'Uh, I mean, have a seat.（えっと、つまり、座って）' },

    // R fix: V2 (blind 75 %) — the key was the only middle-ground choice; a second "Politely, …" now competes, and
    //   the key's "quiet teasing" answers pr2 (a quiet doubt), so it reveals 'poof'
    // why: hinting to leave ← the awkward-evening script, but nobody mentions leaving; truly delighted ← "Really
    //   nice… Wow… What a cute bench" taken at face value
    { id: 'g2', skill: 'gist', level: 'B2', point: 'guests', reveals: ['twospaces', 'poof'], seg: [42.0, 202.6],
      stem: 'How do the guests respond to the tour overall?',
      choices: ['Politely, with some quiet teasing', 'Politely, while hinting they want to leave',
                'Warmly, truly delighted by each room'], a: 0,
      cue: '客の短いほめ言葉と、ときどきの一言。',
      line: 'Really nice… Wow… What a cute bench… *it’s really cool*.',
      said: '客は「すてき」「わあ」「かわいいベンチ」とほめつつ、ときどき短い一言をはさむ。',
      mean: '表向きは礼儀正しく合わせる。ただ、短い一言にちょっとしたからかいが混じる。',
      trap: 'ほめ言葉だけ拾うと大喜びに聞こえるが、短い聞き返しに本音が出る。小さな一言を聞く。',
      use: 'Wow, really nice place.（わあ、すてきなお家）' },

    // R fix: V2 (blind 60 %) — the phone choice was a filler; "your guess is as good as mine" (another "your…"
    //   chunk, = I don't know) replaces it
    // why: no idea ← a near chunk with "your", heard as "I don't know either"; "good call" ← a near phrase (= good
    //   choice), as if agreeing to upstairs
    { id: 'p2', skill: 'phrase', level: 'B1', point: 'call', seg: [48.4, 52.4],
      stem: 'When asked which way to go first, what does the reply mean?',
      choices: ['You decide; either is fine with me', 'No idea; your guess is as good as mine',
                'Upstairs, as you said; good call'], a: 0,
      cue: '「Upstairs first?」への返事。',
      line: 'Upstairs first? — *Totally your call*, babe.',
      said: '「2階から？」と聞かれ、「完全に君が決めていいよ」と答える。',
      mean: 'It’s your call ＝ 決めるのはあなた。call は「判断」。',
      trap: 'good call（いい判断）と混ざりやすい。your call は「決めるのはあなた」と任せる言い方。',
      use: 'It’s your call. I’m fine either way.（任せるよ。どっちでもいい）' },

    // R fix: V2 (blind 75 %) — "Shyly" became "Modestly; they keep playing down…", parallel with the key
    // why: modestly ← "So sorry about this god-awful carpet… a work in progress" comes first and sticks, and fits
    //   the Japanese 謙遜 frame; wearily ← an
    //   awkward evening read as hosts who want it over, but they keep adding rooms and things to see
    { id: 'g1', skill: 'gist', level: 'B2', point: 'tone', seg: [61.0, 184.0],
      stem: 'Through most of the tour, how do the hosts present their home?',
      choices: ['Proudly; they keep pointing out what they did', 'Modestly; they keep playing down what they did',
                'Wearily; they want the tour over and done with'], a: 0,
      cue: '何度も出てくる、見せるときの決まり文句。',
      line: 'So sorry about this… carpet… *Check that out.* … *Check it out.* … And *I also built this table*.',
      said: '最初にカーペットを謝るが、その後は「見て」「自分で作った」と次々に見せる。',
      mean: '謝るのは一度だけ。ツアーの大半は自慢で、ほめてほしい気持ちが出ている。',
      trap: '最初の sorry が耳に残るが、全体では check it out が何度も出る。',
      use: 'Check it out. I did it myself.（見て、自分でやったんだ）' },

    // C2: what her reply shows about how she heard the remark (cf. d2)
    // R fix: K1 + V2 (blind 50 %) — the segment ran into "your doodles", a dig that could pass for "jokes back";
    //   it now ends after "conduct business", and "praise" became a mix-up she'd correct (refuted by "I do")
    // anchor: 80.8–82.0 s a guest only restates the facts ("So you have an office and a workspace."); 82.6–87.1 s she
    //   answers "I do. You know, I just… I cannot create…": a reason nobody asked for, so she heard a doubt
    // why: mix-up ← a restatement heard as a check that got it wrong, but she confirms with "I do"; a joke ← a flat
    //   line heard as banter, but she answers in earnest, with no laugh
    { id: 'c1', skill: 'infer', level: 'C2', point: 'twospaces', seg: [80.3, 87.45],
      stem: 'How does her answer show she took the guest’s “So you have…” remark?',
      choices: ['As a quiet doubt, so she defends her choice', 'As a mix-up, so she sets him straight on it',
                'As a joke, so she laughs and jokes back'], a: 0,
      cue: '事実を言い直されたあと、彼女が足す理由。',
      line: 'So you have an office and a workspace. — I do. *You know, I just… I cannot create*…',
      said: '「事務室と作業部屋があるんだ」と言われ、「そう。だって…」と理由を話し出す。',
      mean: '事実をくり返すだけの一言は、遠回しな「多すぎない？」。聞かれていない理由を足すのは、疑いと受け取った印。',
      trap: 'I do は喜んだ返事にも聞こえるが、すぐ言い訳が続く。理由を足したら守りに入っている。',
      use: 'You have two cars? I do, because…（車2台？そう、だって…）' },

    // R fix: V2 (blind 60 %) — the key was the only choice with "create"; the size reading now borrows it
    // why: too little space ← "the same space" heard as room size; smell ← the candle odors just before, as if they
    //   spoil her work
    { id: 'd2', skill: 'detail', level: 'B2', point: 'twospaces', seg: [80.3, 87.45],
      stem: 'Why does she keep a workspace apart from her office?',
      choices: ['She can’t create where she does business', 'Her office has too little space to create in',
                'The candles’ smell gets into her papers'], a: 0,
      cue: '「You know, I just」のあと、cannot で始まる文。',
      line: 'I *cannot create in the same space that I conduct business*.',
      said: '「仕事をする場所では、創作できないの」と説明する。',
      mean: 'create ＝ 創作する、conduct business ＝ 仕事をする。部屋を分ける理由。',
      trap: '香りの話が続いたので匂いが理由に思えるが、理由は cannot のあと。',
      use: 'I can’t work where I sleep.（寝る場所では仕事ができない）' },

    // R fix: V2 (blind 70 %) — the key was the only "on the surface" choice; jealousy is the other two-faced
    //   reading, and "doodles" (belittling, not envious) refutes it
    // why: sincere ← "I'm sure you're the same" heard as warm fellow feeling; jealous ← a backhanded line often
    //   hides envy
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'doodles', seg: [82.5, 89.35],
      stem: 'When she compares herself with Pam, what is her attitude?',
      choices: ['Friendly on the surface, looking down on Pam’s art', 'Friendly and sincere, truly admiring Pam’s art',
                'Friendly on the surface, jealous of Pam’s talent'], a: 0,
      cue: '最後の文、your のあとの一語の響き。',
      line: 'I’m sure that you’re the same with *your doodles*.',
      said: '「あなたも落書きのときは同じでしょうね」とパムに言う。',
      mean: 'doodles ＝ 落書き。相手の絵を軽い語で呼び、自分の「創作」より下に置いている。',
      trap: 'the same は共感に聞こえるが、呼び方に本音が出る。相手の物を何と呼ぶかを聞く。',
      use: 'I’m sure you’re the same way.（あなたもきっと同じでしょう）' },

    // R fix: V2 (blind 55 %) — the key alone had "comes up here"; all three now share it, and "driving" (a filler)
    //   is gone
    // why: lights them ← candles are usually lit (the noun leads); sits in silence ← "poof, goes away" heard as
    //   calming down quietly
    { id: 'd3', skill: 'detail', level: 'B1', point: 'candles', seg: [101.7, 110.6],
      stem: 'What does she do when she gets angry?',
      choices: ['Comes up here and smells her candles', 'Comes up here and lights her candles',
                'Comes up here and sits in silence'], a: 0,
      cue: '「frustrated or irritated or angry」のあと。',
      line: 'I come up here and I just *smell all my candles*, and it just, poof, goes away.',
      said: '「いらいらしたら、ここに来てキャンドルの香りをかぐ。するとすっと消える」。',
      mean: 'smell ＝ 香りをかぐ。火をつける話はしていない。poof ＝ ぱっと消える音。',
      trap: 'キャンドルなら火をつけると思いやすいが、動詞は smell。名詞より動詞を聞く。',
      use: 'When I’m stressed, I go for a walk.（ストレスがたまったら散歩する）' },

    // why (the instinct): "smell my candles" ← "all" melts into "smell"; "smell all the candles" ← the weak "my"
    //   heard as "the"
    { id: 'x1', skill: 'dict', level: 'B2', point: 'candles', seg: [106.1, 110.6],
      stem: 'Type what she does up here: “I just ___.” (4 words)', answer: 'smell all my candles',
      cue: '「I come up here and」のあと。',
      line: 'I just *smell all my candles*.',
      said: '「キャンドルの香りをかぐだけ」。smell‿all がつながる。',
      mean: 'smell all は「スメローゥ」と一続き。my も弱く candles にくっつく。',
      trap: 'all が smell に溶けて聞こえにくい。4語とあるので、消えた語を探す。',
      use: 'I just smell the coffee.（コーヒーの香りをかぐだけ）' },

    // R fix: V2 (blind 65 %) — "agrees" was weak; an echo heard as a request to repeat (a common learner reading
    //   of an echo question) replaces it
    // why: show them how ← a question form taken as a request for steps; repeat ← echo questions are also used
    //   when you didn't catch something, but he caught it and adds "like that"
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'poof', seg: [106.5, 112.6],
      stem: 'After her candle story, what does the short echo question do?',
      choices: ['Shows quiet doubt that it works so fast', 'Asks her to show them how she does it',
                'Asks her to repeat what she just said'], a: 0,
      cue: '「poof, goes away」への、短い聞き返し。',
      line: 'it just, poof, goes away. — *Just like that?* — Just like that.',
      said: '「ぱっと消えるの」に「そんな簡単に？」と聞き返し、「そう、簡単に」と返る。',
      mean: '相手の言葉をくり返す聞き返しは、軽い疑い。やり方を聞いてはいない。',
      trap: '質問の形なので説明を求めているように聞こえるが、短いくり返しは「本当に？」の合図。',
      use: 'Just like that? Really?（そんな簡単に？本当に？）' },

    // R fix: V2 (blind 70 %) — "hates it more" was weak; a name mix-up (she thinks she ordered something else) is
    //   the near miss, refuted by "I had it painted in eggshell white"
    // why: painters' mistake ← the usual home-repair script; mixed up names ← "white and eggshell white" heard as
    //   her confusing two paints, but she got what she ordered
    { id: 'h2', skill: 'humor', level: 'C1', point: 'eggshell', seg: [114.8, 124.7],
      stem: 'Why does the story about the bedroom walls get a laugh?',
      choices: ['The “softer” new color is the same as the old', 'The painters used the wrong color by mistake',
                'She mixed up the names of the two colors'], a: 0,
      cue: '「Guess what?」のあとの比べ方。',
      line: 'I had it painted in *eggshell white*. Guess what? White and eggshell white are *exactly the same color*.',
      said: '「病院みたいな白を和らげたくて卵殻色の白にしたら、同じ色だった」。',
      mean: 'お金をかけて塗り直したのに、何も変わらなかった。それを真顔で話すのが笑い。',
      trap: '塗装屋の失敗に聞こえやすいが、注文どおり。exactly the same は色そのものが同じ。',
      use: 'Guess what? It was the same thing.（なんと、同じものだった）' },

    // why: dog ← "puppy" taken literally; blanket ← "curl up" goes with a blanket, so the word seems to name one
    { id: 'p3', skill: 'phrase', level: 'C1', point: 'puppy', seg: [134.5, 141.2],
      stem: 'When the host explains the bench, what do his last two words refer to?',
      choices: ['The bench he is talking about', 'A small dog that sleeps with him', 'A soft blanket on the bench'],
      a: 0,
      cue: '「curl up on」のあとの二語。',
      line: 'so I *curl up on that puppy*.',
      said: '「だから、あそこで丸まって寝てるんだ」と言う。',
      mean: 'that puppy ＝「こいつ」。物を親しみをこめて呼ぶくだけた言い方で、ここではベンチ。',
      trap: 'puppy を「子犬」と文字どおり取りやすい。that puppy は目の前の物を指すことが多い。',
      use: 'Let’s fire up this puppy.（さあ、こいつを動かそう）' },

    // R fix: V2 (blind 75 %) — the candles choice was weak; the snoring script (his fault, not hers) replaces it,
    //   and "Jan has… issues" refutes it
    // why: room too small ← "space" read as floor space (literal); snores ← the usual reason a man sleeps apart,
    //   but the issues are Jan's
    { id: 'i1', skill: 'infer', level: 'C1', point: 'space', reveals: ['puppy'], seg: [134.5, 141.2],
      stem: 'Reading between the lines, why does the host sleep on the bench?',
      choices: ['Jan doesn’t want to share the bed with him', 'The bedroom is too small for a second bed',
                'He snores, so Jan asked him to move out'], a: 0,
      cue: '「That’s my bed」のあと、uh のあとの言い方。',
      line: 'That’s my bed. Jan has, uh, *some space issues*. So I curl up on that puppy.',
      said: '「僕のベッド。ジャンはちょっと、その、スペースの問題が」と言う。',
      mean: 'uh で言いよどみ、遠回しに言っている。彼女が一緒に寝たがらない、ということ。',
      trap: 'space を部屋の広さと取りやすい。言いよどんだあとの遠回しな語は、言いにくい本当の理由。',
      use: 'She has some, uh, scheduling issues.（彼女はちょっと、その、予定の都合が）' },

    // R fix: V2 (blind 65 %) — the key alone carried "finally"'s "at last"; the broken-TV reading now has it too
    // why: old one broke ← "broke" taken literally, about a machine; cheer up ← "broke down" heard as an emotional
    //   breakdown, but "finally" means after a long wait
    { id: 'p4', skill: 'phrase', level: 'B2', point: 'brokedown', seg: [154.6, 161.6],
      stem: 'What does the host mean about how he came to buy the TV?',
      choices: ['He gave in at last after holding out', 'He bought one at last when his old TV broke',
                'He had a bad week and bought it to cheer up'], a: 0,
      cue: '「I finally」のあと、down で終わる二語。',
      line: 'I finally *broke down* and bought myself… a plasma TV.',
      said: '「ついに我慢できず、プラズマテレビを買った」と言う。',
      mean: 'break down and ～ ＝ 迷った末に折れて〜する。finally と一緒によく使う。',
      trap: 'broke から「古いのが壊れた」と取りやすい。主語は I で、折れたのは本人の我慢。',
      use: 'I finally broke down and called her.（とうとう折れて彼女に電話した）' },

    // R fix: V2 (blind 75 %) + §9.5 — "hang" doesn't fit the past-tense gap, so grammar alone ruled it out; now
    //   three past forms
    // why: hanged ← the regular past learners build from "hang", the "-ng" heard and a "d" assumed; had ← the final
    //   "ng" lost, leaving "ha-"
    { id: 's1', skill: 'sound', level: 'B2', point: 'hung', seg: [162.2, 166.2],
      stem: 'Fill the gap: “I actually ___ this on the wall myself.”',
      choices: ['hung', 'hanged', 'had'], a: 0,
      cue: 'actually のすぐあと、短い母音の一語。',
      line: 'I actually *hung* this on the wall myself.',
      said: '「これ、実は自分で壁に掛けたんだ」と自慢する。',
      mean: 'hung は hang（掛ける）の過去形。母音は口を小さく開く「ア」。',
      trap: 'hanged なら最後に d が付き、had なら ng がない。語の終わりの音まで聞く。',
      use: 'I hung the shelf myself.（棚は自分で取り付けた）' },

    // why: rarely watches ← "sometimes" caught, "for hours" lost; old one better ← "finally broke down" heard as a
    //   reluctant buy he half regrets, but "I love this TV" ends it
    { id: 'a4', skill: 'attitude', level: 'B1', point: 'tv', seg: [173.5, 181.6],
      stem: 'How does the host feel about his new TV?',
      choices: ['He loves it and could watch it for hours', 'He likes it, though he rarely gets to watch it',
                'He likes it, but the old one was better'], a: 0,
      cue: '最後に二回くり返す、短い文。',
      line: 'Sometimes I will just stand here and watch television for hours. I love it. *I love this TV.*',
      said: '「ときどきここに立って何時間も見てる。最高。このテレビ大好き」と言う。',
      mean: 'I love をくり返し、気に入っていることをはっきり言っている。',
      trap: 'sometimes だけ聞くと「たまに」だが、続きは for hours。迷いの話は買う前のこと。',
      use: 'I love this place.（ここ、大好き）' },

    // keep: ascending. why: a day ← "a" heard, the noun lost; two weeks ← "week" caught, the count guessed; a month
    //   ← the usual length of a repair wait
    { id: 'n1', skill: 'number', level: 'B1', point: 'week', seg: [193.1, 197.6], keep: true,
      stem: 'After the TiVo setup, how long was the TV without sound?',
      choices: ['For a day', 'For a week', 'For two weeks', 'For a month'], a: 1,
      cue: '「didn’t have audio」のあと、for で始まる部分。',
      line: 'but then I didn’t have audio *for a week*.',
      said: 'TiVo（録画機）の設定のあと、1週間音が出なかった、と話す。',
      mean: 'audio ＝ 音声。機械が苦手なことを笑う失敗談。',
      trap: 'a week の a は弱く、for‿a がつながる。weeks なら最後に s が聞こえる。',
      use: 'I had no Wi-Fi for a week.（1週間Wi-Fiがなかった）' },

    // R fix: V2 (blind 50 %) — "at the office" was weak; "bored with them" (put away because he's over them) is
    //   the near miss, and "I'm surprised" (= not like him) refutes it
    // why: ashamed ← awards that are put away heard as hidden in shame; bored ← put away as if he's over them, but
    //   "surprised" says showing off is his normal
    { id: 'i2', skill: 'infer', level: 'C1', point: 'dundies', seg: [204.0, 209.6],
      stem: 'What does the guest’s surprise about the coffee table suggest?',
      choices: ['The host loves showing off his awards', 'The host is secretly ashamed of his awards',
                'The host has grown bored with his awards'], a: 0,
      cue: '「I’m surprised」のあと、for everybody to see。',
      line: 'I’m surprised they’re *not out on the coffee table for everybody to see*.',
      said: '「テーブルに出して見せてないなんて意外」と言う。',
      mean: 'surprised ＝ 普段の彼ならそうするはず。見せびらかし好きへの軽いからかい。',
      trap: '隠していると取ると恥ずかしがりに聞こえるが、surprised は「いつもと違う」への驚き。',
      use: 'I’m surprised you’re not out dancing.（踊りに行ってないなんて意外）' },

    // R fix: V2 (blind 60 %) — the key was the only "twist" shape; parallel "He…" claims now, and "she has won an
    //   award" (best trophy taken literally) replaces the weaker one
    // why: she matters more ← “aside from” heard as “more than”, so she stays first; she won one ← "the best trophy
    //   right here" taken literally, as a prize of hers
    { id: 'h3', skill: 'humor', level: 'C1', point: 'trophy', seg: [216.8, 222.6],
      stem: 'Why does the line about the best trophy end in a laugh?',
      choices: ['He ranks his awards above her after all', 'He says she means more than any award',
                'He says she has won an award of her own'], a: 0,
      cue: 'best trophy のあと、Aside from で始まる一言。',
      line: 'I have *the best trophy* right here… *Aside from my Dundies*.',
      said: '「最高のトロフィーはここに」と彼女を指し、「ダンディー賞を除けば」と足す。',
      mean: 'aside from ～ ＝「〜を除けば」。一番と言った直後に、自分の賞を上に置く。',
      trap: 'aside from を「〜よりも」と取ると、彼女が一番のまま。例外を足す語。',
      use: 'Best day ever, aside from the rain.（最高の日。雨を除けばね）' },
  ]
};
