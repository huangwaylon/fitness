// “Carly's First New iCarly Web Show 📱 Full Scene | iCarly” (NickRewind, Best of the New iCarly): Carly doubts she can
// restart iCarly without Sam; her friends (one of them her new producer) and Spencer take her up to the old studio,
// where the old props remind her what she made as a kid; then the first new webcast, a skincare routine on "baby
// Spencer" that turns as silly as the old show.
// Segments from the captions, words from whisper (2026-11-17). Spencer names himself by reply (Carly's "If Spencer
// ever got around to building…" → "I was never going to use a home gym"; "baby Spencer" → "That's me!"); the friend
// is addressed as "Freddy" at 101 s, but no item keys on which friend speaks except w1, which the address settles.
// No item uses Nora, the "squirrel", the dachshunds, George the bra (sources split: "They"/"I never did grow into
// you"), the 165–173 s search, the lip-mask stretch, or "hurting it"/"eating it" (270 s, sources split).
// REVIEW 2026-11-17: pass 8, fix 16, drop 0, new 0; ear checks 2 (a1+c3 on one line, a2); c3 ships retired until heard
//   Open: is the producer Freddie? (the "he"/"him" in a1 and c3 assume a male speaker; no item keys on the name)
// EAR CHECK: 53.7–56.3 s a1 c3 — the "Aw" (captions "oh") is the same speaker as “You do mean me, right?”, and the
//   stress there falls on “do”, not “me” (c3 ships only once confirmed)
// EAR CHECK: 221.1–233.0 s a2 — “In no way am I worried”, then “No, that's enough already” are the "infant"'s
//   (Spencer's) lines, said as a nervous joke, not calmly
import type { Clip } from '../types.ts';

export const icFirstShow: Clip = {
  id: 'icfirstshow', video: 'ZvK0ddkH6LY', title: 'Carly\'s First New iCarly Web Show 📱 Full Scene', dur: 305,
  wpm: 139, band: 'slow', tags: ['友だち', '家'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: V2 (75 % blind: the key was the only kind, supportive choice); new near misses from the scene
    // why: found the prop ← she goes looking for something ("I thought it might still be here"), but "Damn it": it
    //   isn't there; goofy style ← "Old, goofy stuff?" is her own question, and the answer leaves it to her
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', seg: [0, 175],
      stem: 'What finally gets Carly ready to start the show again?',
      choices: ['Being reminded what she made as a kid', 'Finding the old prop she went looking for',
                'Her friends choosing the old, goofy style'], a: 0,
      cue: '昔の道具を見たあと、友だちが何と言うか。',
      said: '一人では無理かと迷うが、昔の小道具を前に「子どもの頃にこれを作った」と励まされる。',
      mean: 'Sam は戻らないが、昔の自分と仲間の応援が背中を押す。',
      trap: '探し物や old, goofy stuff が耳に残るが、探し物は見つからない。決め手は励ましの一言。',
      use: 'You’ve got this. We’re right behind you.（できるよ。みんな応援してる）' },

    // R fix: V2/K6 (the key was the only choice with the new name Luke); "juice for dinner" (a filler) became a
    //   Luke near miss, and the trap note now names it
    // why: leaving Luke ← Luke is said, but in the wrong relation: the regret is starting with him; Sam ← her name
    //   comes soon after, and "do iCarly again" makes it sound like the show ending is the regret
    { id: 'd1', skill: 'detail', level: 'B1', point: 'luke', seg: [11.6, 15],
      stem: 'What does Carly regret at the start of the scene?',
      choices: ['Starting a channel with Luke', 'Leaving Luke to start her own channel', 'Ending the old show with Sam'],
      a: 0,
      cue: '「Why did I ever think」で始まる文の最後。',
      line: 'Why did I ever think I should *start a channel with Luke*?',
      said: '「なんで Luke とチャンネルを始めようなんて思ったんだろう」と言っている。',
      mean: 'Why did I ever ～? は質問でなく後悔の言い方。',
      trap: 'Luke の名前だけ拾うと「別れた」話にも取れる。Why did I ever のあとが後悔の中身。',
      use: 'Why did I ever buy these shoes?（なんでこの靴買っちゃったんだろう）' },

    // why: think first ← "Don't answer that" read as "wait, think about it"; finished ← a question at the end of a turn
    //   usually hands the floor over (the Japanese 「どう思う？」 flow)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'desperate', seg: [14.6, 18.6],
      stem: 'Why does Carly add two quick lines after her question about a partner?',
      choices: ['She fears they’d honestly say “yes”', 'She wants them to think before answering',
                'She is done and wants their advice'], a: 0,
      cue: '質問のすぐあと、短い二つの言葉。',
      line: 'Am I that desperate for a partner? *Don’t answer that. Still talking.*',
      said: '「そんなに相棒が欲しいの？答えないで、まだ話してる」と続ける。',
      mean: 'Don’t answer that は、正直な答えが分かっていて聞きたくないときの決まり文句。',
      trap: '質問のあとは相手の番、と思いやすい。Still talking で話を続けている。',
      use: 'Do I look tired? Don’t answer that.（疲れて見える？やっぱり答えないで）' },

    // R fix: V2 (60 % blind: the key was the only plain, generic choice); all three are now "chasing…"
    // why: a guy ← "following" read literally (後を追う) and "bliss" as love; work ← "off … with that biker gang"
    //   heard as a job on the road, with "bliss" lost
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'bliss', seg: [26.2, 31.8],
      stem: 'What does Carly say Sam is doing with the biker gang?',
      choices: ['Chasing what makes her happiest', 'Chasing a guy she’s fallen for', 'Chasing work to pay her bills'],
      a: 0,
      cue: '「she’s off」のあと、her で始まる言い方。',
      line: 'But she’s off *following her bliss* with that biker gang.',
      said: 'Sam はバイカー集団と好きなことをしに行った、と言う。',
      mean: 'follow one’s bliss ＝ 自分が本当に楽しいことをする。少し大げさな言い方。',
      trap: 'follow を「人の後を追う」と取ると恋の話に聞こえる。bliss は「至福・喜び」。',
      use: 'She quit her job to follow her bliss.（好きなことをするため仕事を辞めた）' },

    // R fix: V2 (75 % blind: "Sam is in danger" was Carly's worry, not a joke); it's now the "she's" → "they're"
    //   mishearing, a reply that only echoes her
    // why: echo ← "they're" heard as a repeat of "she's", so it sounds like the same worry; shrug ← "It's Sam" heard
    //   as a shrug, as if Sam weren't worth worrying about
    { id: 'h1', skill: 'humor', level: 'C1', point: 'they', seg: [31.7, 36.2],
      stem: 'What makes the reply to Carly’s worry about Sam funny?',
      choices: ['It worries about the gang instead of Sam', 'It repeats her worry about Sam word for word',
                'It shrugs Sam off as not worth worrying about'], a: 0,
      cue: '「I hope」のあと、she と they のどちらか。',
      line: 'I hope she’s okay. — It’s Sam. I hope *they’re* okay.',
      said: '「Sam 大丈夫かな」に「Sam だよ？心配なのはバイカーたちのほう」と返す。',
      mean: '心配する相手を入れかえて、Sam のほうが怖い存在だと笑わせている。',
      trap: '同じ「I hope ～ okay」が続くので、同じ心配に聞こえやすい。主語が変わる所を聞く。',
      use: 'It’s my brother. Worry about the other team.（兄だよ？心配なのは相手チーム）' },

    // why: couldn't ← n't's t drops, so "could" and "couldn't" sound close; could've done ← "do it" heard as "done it";
    //   would ← /k/ and /w/ both weak at the start of a quick word
    { id: 's2', skill: 'sound', level: 'B2', point: 'own', seg: [42, 45.4],
      stem: 'Fill the gap: “Do you think I ___ on my own?”',
      choices: ['could do it', 'couldn’t do it', 'could’ve done it', 'would do it'], a: 0,
      cue: '「think I」のすぐあと、短くつながる3語。',
      line: 'Do you think I *could do it* on my own?',
      said: '「一人でもできると思う？」と聞いている。',
      mean: 'could の d と do の d が重なり、「クドゥーイッ」のように一つに聞こえる。',
      trap: 'couldn’t なら t が消えても「ン」の音が残る。ここに「ン」はない。',
      use: 'Do you think I could do it?（私にできると思う？）' },

    // R fix: V2 (55 % blind: "needs a partner" was a filler); the near miss is now "gives a frank opinion", refuted
    //   by "Doesn't matter what I think"; the stem no longer quotes s2's key ("could do it"); the said note no longer assumes the speaker is male (僕)
    // why: result ← "doesn't matter" heard, in the wrong relation (about the result, not the opinion); opinion ← a
    //   question like "Do you think I could…?" usually gets an honest view back
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'want', seg: [42, 48.6],
      stem: 'When Carly asks if she can manage alone, what does the friend do?',
      choices: ['Leaves the decision up to her', 'Says the result won’t matter much', 'Gives a frank opinion on the plan'],
      a: 0,
      cue: '答えの後半、「what you」のあと。',
      line: '*Doesn’t matter what I think.* It matters *what you want*.',
      said: '「自分がどう思うかは関係ない。大事なのは君がどうしたいか」と答える。',
      mean: '意見を言わずに、決めるのは本人だと返している。突き放しではなく後押し。',
      trap: 'doesn’t matter が聞こえると「どうでもいい」と取りやすい。何が関係ないのか、主語を聞く。',
      use: 'It’s your call. What do you want?（決めるのは君。どうしたい？）' },

    // R fix: schema (the answer's curly ’ failed the dict pattern: now a straight '); S1 (the stem's "he" assumed
    //   the speaker); N3 (the mean note leaned on "It matters", which the captions don't have: whisper "It matters",
    //   captions "matters")
    // dict, C2: the grammar-correcting instinct (learners add "It")
    // anchor: 45.84–46.92 s both sources have "doesn't matter what I think" with no "it"; the next sentence, 47.44 s,
    //   has "It matters", so the dropped "It" is heard against a kept one
    { id: 'c1', skill: 'dict', level: 'C2', point: 'want', seg: [45.3, 47.4],
      stem: 'Type the reply: “___ what I think.” (2 words)', answer: "doesn't matter",
      cue: '答えの最初の部分。文法より、聞こえた音を。',
      line: '*Doesn’t matter* what I think.',
      said: '「自分がどう思うかは関係ない」。文頭の It を言わず、doesn’t から始まる。',
      mean: '会話では文頭の It がよく落ちる。いきなり doesn’t の d から始まるのが聞きどころ。',
      trap: '習った文法どおり It を足したくなる。書き取りは、正しい文ではなく言われた音を書く。',
      use: 'Doesn’t matter. Let’s just go.（どうでもいいよ。行こう）' },

    // R fix: V2 (65 % blind: the key was the only pleased choice); the near miss is now "touched, and certain",
    //   refuted by his checking "right?"; on the ear-check list (is the "Aw" his?)
    // why: certain ← "Aw" heard as the whole reaction, with the check "right?" missed; hurt ← "my new producer" heard
    //   as someone new replacing him
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'producer', seg: [51.4, 57.7],
      stem: 'How does the friend take the news about her “new producer”?',
      choices: ['Touched, if she really means him', 'Touched, and certain she means him',
                'Hurt that she found someone new'], a: 0,
      cue: '「producer」の直後の短い声と、次の質問。',
      line: 'I’d have my new producer. — *Aw.* — *You do mean me, right?*',
      said: '「新しいプロデューサーもいるし」に「わあ」と喜び、「僕のことだよね？」と確かめる。',
      mean: 'Aw はうれしくて胸がいっぱいの声。名前が出ていないので確認している。',
      trap: 'right? の確認を不安や嫌がりと取りやすい。直前の Aw が気持ちを表している。',
      use: 'You do mean me, right?（それ、私のことだよね？）' },

    // C2 stress: the emphatic auxiliary
    // EAR CHECK (header): stress on "do"
    // R hold: a stress item ships retired until its EAR CHECK (clips.test HEARD); once the user confirms "do", drop
    //   `retired` and add 'icfirstshow c3' to HEARD
    // R fix: V2 (60 % blind, its one rewrite): "on right, teasing" was weak; the new near miss is stress on "me"
    //   (him, not someone else), which only the ear settles
    // why: on "me" ← the contrastive reading (me, not another person), natural after "my new producer"; on "mean" ←
    //   the "are you serious?" reading (mean = 本気で言う)
    // anchor: 55.12–56.26 s both sources have "You do mean me, right?": a "do" in a plain positive statement is there
    //   only to carry stress, and the line follows "Aw" (51.9–54.1 s), so it asks her to confirm, not to joke
    { id: 'c3', skill: 'sound', level: 'C2', point: 'producer', seg: [51.4, 57.7],
      stem: 'Where is the stress in “You do mean me, right?”, and why?',
      choices: ['On “do”: he wants her to say yes, it’s him', 'On “me”: him, as opposed to someone else',
                'On “mean”: he isn’t sure she’s serious'], a: 0,
      cue: 'なくても文になる語が、あえて入っている。',
      line: 'You *do* mean me, right?',
      said: '「僕のこと、だよね？」と確かめる。普通は言わない do が入り、そこが強くなる。',
      mean: '肯定文の do は強調のためだけにある。「そうだと言って」と念を押す響き。',
      trap: 'me を強めると「ほかの人でなく僕」の対比になる。肯定文にわざわざ do があれば、強いのはそこ。',
      use: 'I do like it, honestly.（ほんとに気に入ってるんだって）', retired: true },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'gym', seg: [71.3, 74.8],
      stem: 'Type the missing words: “If Spencer ever ___ building that home gym.” (3 words)',
      answer: 'got around to',
      cue: '「ever」のあと、「building」の前。',
      line: 'If Spencer ever *got around to* building that home gym.',
      said: '「そのうちジムを作っていたら」。got around to がつながる。',
      mean: 'get around to ～ing ＝ 後回しにしていたことに、やっと手をつける。',
      trap: 'got の t は弾んで「ラ」に近く around とつながる。to は弱い。',
      use: 'I finally got around to cleaning my room.（やっと部屋を片づけた）' },

    // why: built but unused ← "never going to use" taken literally, as if the gym exists; still plans ← "was never
    //   going to" heard as "hasn't yet"
    { id: 'i2', skill: 'infer', level: 'C1', point: 'gym', seg: [71.3, 84],
      stem: 'What does Spencer’s reply about the home gym tell us?',
      choices: ['He never built it; he wouldn’t have used it', 'He built it, but he has never once used it',
                'He hasn’t built it yet, but still plans to'], a: 0,
      cue: '「ever got around to」の問いと、その答えの was。',
      line: 'If Spencer ever *got around to* building that home gym. — I was *never going to use* a home gym.',
      said: '「ジムを作っていたら」に、本人が「どうせ使わなかったし」と返す。',
      mean: '作らなかった言い訳。昔のスタジオがそのまま残っている。',
      trap: 'never use だけだと「作ったが使っていない」に聞こえる。was going to は「するつもりだった」。',
      use: 'I never got around to it.（結局やらずじまいだった）' },

    // R fix: N1 (the line spelled the name "Freddy", the choice and notes "Freddie")
    // why: Carly ← she's the one in the puppet, so she seems to be the one asking; Spencer ← it's his puppet, so his
    //   voice is expected around it
    { id: 'w1', skill: 'who', level: 'B2', point: 'puppet', seg: [98, 101.7],
      stem: 'Who asks why one of the puppets looks like Carly?',
      choices: ['Freddie', 'Carly', 'Spencer'], a: 0,
      cue: '質問への返事で、誰に呼びかけているか。',
      line: 'Why does that one look like Carly? — I made one that looks like *you too, Freddie*.',
      said: '「なんであれ Carly に似てるの？」に「君に似たのも作ったよ、Freddie」と返る。',
      mean: '返事の呼びかけが、質問した人を示している。Carly なら「私に」と言うはず。',
      trap: '人形の話なので本人や作り手を選びやすい。返事の最後の名前で決まる。',
      use: 'I got one for you too, Mom.（お母さんの分も買ったよ）' },

    // why: an hour ← a prank sounds short; two days ← "overnight" heard as a long time stuck
    { id: 'n1', skill: 'number', level: 'B1', point: 'sack', seg: [137.8, 143.9], keep: true,
      stem: 'How long does he say he was stuck in the sack?',
      choices: ['About an hour', 'All night', 'Two whole days'], a: 1,
      cue: '「left me here」のすぐあと、文の最後の語。',
      line: 'Until Sam superglued my drawstring closed and left me here *overnight*.',
      said: '「Sam がひもを接着剤で閉じて、ひと晩ここに置いていった」と話している。',
      mean: 'overnight ＝ ひと晩じゅう、朝まで。楽しい思い出が、ひどい思い出に変わる。',
      trap: 'night だけ聞くと夜の短い時間にも聞こえる。over が付くと「朝まで」。',
      use: 'Can I leave my bag here overnight?（荷物をひと晩預けられますか）' },

    // R fix: K1/V2 (55 % blind; "locked it in the studio all night" was close to co-true with "left me here
    //   overnight"); it's now a second "glued" near miss
    // why: glued to the floor ← "superglued" heard, but in the wrong relation; his hands ← "superglued my drawstring"
    //   heard with the wrong object
    { id: 'd2', skill: 'detail', level: 'B1', point: 'sack', seg: [137.8, 147],
      stem: 'What did Sam do to him with the sack?',
      choices: ['Glued it shut with him inside', 'Glued it to the studio floor', 'Glued his hands to the string'],
      a: 0,
      cue: '「Until Sam」のあと、何をどうしたか。',
      line: 'Until Sam *superglued my drawstring closed* and left me here overnight.',
      said: 'ひもを接着剤で閉じられ、袋に入ったまま置いていかれた。',
      mean: 'drawstring ＝ 袋の口をしぼるひも。それを閉じた状態に接着した。',
      trap: 'superglue と studio の場面から「床に貼った」と想像しやすい。何を接着したかを聞く。',
      use: 'Pull the drawstring to close it.（ひもを引いて閉じてください）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'cameup', seg: [155.2, 158.1],
      stem: 'Type: “You ___ all this stuff when you were a kid.” (3 words)',
      answer: 'came up with',
      cue: '最初の「You」のすぐあと、3語がひと続き。',
      line: 'You *came up with* all this stuff when you were a kid.',
      said: '「子どもの頃に、これ全部考え出したんだよ」と励ましている。',
      mean: 'come up with ＝ 考え出す、思いつく。came と up、up と with がつながる。',
      trap: 'up with が短くなり、came だけ聞こえやすい。3語で一つの意味。',
      use: 'Who came up with this idea?（このアイデア、誰が考えたの？）' },

    // why: nobody watching ← "bots from Brazil" heard as the verdict on the whole show; calm and grown-up ← "it's grown
    //   up now" heard as the plan that worked
    { id: 'g2', skill: 'gist', level: 'B2', point: 'show', reveals: ['bots', 'baby'], seg: [175, 298.5],
      stem: 'How does the first new webcast turn out?',
      choices: ['Silly like the old show, and viewers enjoy it', 'Silly like the old show, but nobody is watching',
                'Calm and grown-up, just as Carly planned'], a: 0,
      cue: '途中のコメントの話と、最後の一言。',
      said: '大人向けの肌の手入れのはずが、赤ちゃん役の Spencer で大騒ぎ。見ている人には大受け。',
      mean: '「大人になった iCarly」のつもりが、昔と同じノリに戻っていく流れ。',
      trap: 'grown up や bots が耳に残るが、最後は「昔のまま」で終わる。',
      use: 'It feels like old times.（昔に戻ったみたい）' },

    // why: fans in Brazil ← "Brazil" taken as the real point; friends ← a few early viewers are often friends asked to
    //   watch
    { id: 'i3', skill: 'infer', level: 'B2', point: 'bots', seg: [186.2, 191.3],
      stem: 'When someone notices the first viewers, what does the reply suggest?',
      choices: ['They may not be real people at all', 'Most of her new fans live in Brazil',
                'They are friends Carly asked to watch'], a: 0,
      cue: '「viewers」への返事、最初の名詞。',
      line: 'It looks like she’s already got a few viewers. — Probably *bots* from Brazil.',
      said: '「もう何人か見てるね」に「たぶんブラジルのボットだよ」と返す。',
      mean: 'bot ＝ 自動プログラム。人間の視聴者ではないかも、と期待をしぼませる冗談。',
      trap: 'Brazil が耳に残ると国の話に聞こえる。大事なのは前の bots の一語。',
      use: 'Those likes are probably bots.（そのいいね、たぶんボットだよ）' },

    // R fix: V2 (80 % blind: a real baby and a doll were fillers); the near misses are now Freddie and one of
    //   Spencer's puppets (the marionettes are in this scene), both refuted by "baby Spencer" → "That's me!"
    // why: Freddie ← the other man in the room, and "baby" heard without the name; a puppet ← Spencer made
    //   look-alike marionettes, so "baby Spencer" could be one of them
    { id: 'w2', skill: 'who', level: 'B1', point: 'baby', seg: [206.4, 213.4],
      stem: 'Who is the “baby” in Carly’s skincare routine?',
      choices: ['Spencer, acting like a baby', 'Freddie, acting like a baby', 'A puppet that looks like Spencer'], a: 0,
      cue: '「Even for」のあとの名前と、そのあとの返事。',
      line: 'Even for *baby Spencer*. — That’s me!',
      said: '「赤ちゃんスペンサーにもね」と紹介され、本人が「僕だよ！」と答える。',
      mean: '大人の Spencer が赤ちゃん役を演じている、と言葉だけで分かる。',
      trap: '人形の話のあとなので、作り物の赤ちゃんを思いやすい。直後の名前と「That’s me!」で決まる。',
      use: 'Even for beginners, it’s easy.（初心者にも簡単です）' },

    // R fix: V2 (65 % blind: the key was the only one about the label); all three are now about the safety claim
    // why: proved by a baby ← "lucky infant" read sincerely, as a happy tester; tested on animals ← "None… were
    //   tested" heard without "None", as if it admits animal testing
    { id: 'h3', skill: 'humor', level: 'C1', point: 'tested', reveals: ['baby'], seg: [213.3, 223.5],
      stem: 'What is funny about how Carly describes the product testing?',
      choices: ['The safety claim ends in testing on a baby', 'The safety claim is proved by a happy baby',
                'The safety claim admits testing on animals'], a: 0,
      cue: '「animals」のあと、Just で始まる言葉。',
      line: 'None of these products were *tested on animals*. Just *one tiny little lucky infant*.',
      said: '「動物実験はしていません。小さなラッキーな赤ちゃん一人だけ」と言う。',
      mean: '化粧品の決まり文句「動物実験なし」を、もっとひどい話にひっくり返している。',
      trap: '前半だけ聞くと安全の宣伝に聞こえる。Just のあとで意味が逆転する。',
      use: 'No sugar added. Just a lot of honey.（砂糖不使用。はちみつはたっぷり）' },

    // EAR CHECK (header): the speaker and delivery
    // R fix: V2 (70 % blind: the key was the only "nervous"); the near miss is now "nervous, and admits it"
    // why: admits it ← the worry heard, the "In no way" lost; calm ← the words taken at face value
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'worried', seg: [220.9, 235.3],
      stem: 'How does the “infant” feel as the testing begins?',
      choices: ['Nervous, though he claims he isn’t', 'Nervous, and he openly admits it', 'Calm, exactly as he claims he is'],
      a: 0,
      cue: '最初の言い切りと、少しあとの「Ow!」。',
      line: '*In no way am I worried.* … Ow! … No, *that’s enough already*.',
      said: '「全然心配してないよ」と言うが、塗られると「痛っ」「もう十分だって」と止める。',
      mean: 'わざわざ言い切る否定は、本当は心配しているしるし。すぐあとの反応が答え合わせ。',
      trap: '言葉どおり「平気」と取りやすい。聞かれてもいないのに強く否定したら、逆を疑う。',
      use: 'I’m not nervous at all. Nope.（全然緊張してないよ。ほんとに）' },

    // R fix: V2 (75 % blind: "rude clerk" and "selling out" were weak); all three now turn on "ma'am", and the stem
    //   says "product", not "serum" (serum → anti-aging gave the key away)
    // why: obliged ← the Japanese frame: polite service makes leaving empty-handed feel rude; special ← "ma'am"
    //   heard as a flattering, VIP word
    { id: 'i4', skill: 'infer', level: 'C1', point: 'maam', seg: [238.6, 244],
      stem: 'Why did Carly buy the product, from her story?',
      choices: ['Being called “ma’am” made her feel old', 'Being called “ma’am” made her feel obliged',
                'Being called “ma’am” made her feel special'], a: 0,
      cue: '「7-Eleven」のあと、店員が彼女を何と呼んだか。',
      line: 'I actually *panic bought* it… and the guy there *called me ma’am*.',
      said: '「コンビニで店員に ma’am と呼ばれて、あわてて買った」と話す。',
      mean: 'ma’am は年上の女性への呼び方。年を取ったと感じて、アンチエイジングに飛びついた。',
      trap: 'ma’am は丁寧だが、若い人には「年上扱い」に聞こえる。丁寧＝うれしい、と取らない。',
      use: 'A kid called me sir. I felt old.（子どもに sir と呼ばれて年を感じた）' },

    // C2 paraphrase: a deadpan mock of the skincare pitch
    // R fix: V2 (50 % blind, its one rewrite: the key was the only cynical choice); "stopped buying" became
    //   "don't waste money on it", the sincere reading that drops "but… still"
    // why: start early ← the ads' "never too early" line from 200 s, heard as her own view; don't waste money ←
    //   "already too late" taken as sincere advice, dropping the "But you should still spend all your money"
    // anchor: 248.4–257.5 s "by the time you need skincare, it's already too late" + "But you should still spend all your
    //   money on it" + "an expensive reminder we're all going to die": it can't work, and you buy it anyway
    { id: 'c2', skill: 'infer', level: 'C2', point: 'emo', seg: [248, 258.2],
      stem: 'Which plain-English version keeps what Carly says about skincare?',
      choices: ['“It can’t save you, but we keep paying for it.”', '“Start early, and it really will keep you young.”',
                '“It can’t save you, so don’t waste money on it.”'], a: 0,
      cue: '「too late」と、そのあとの but の中身。',
      line: 'by the time you need skincare, it’s *already too late*. But you should *still spend all your money* on it.',
      said: '「必要な頃にはもう手遅れ。それでも全財産をつぎ込め。結局は高い『いつか死ぬ』のお知らせ」と言う。',
      mean: '「効かない、でも買え」と矛盾を真顔で並べ、広告をからかっている。',
      trap: '少し前の「早すぎることはない」を本人の意見と取りやすい。but still が来たら前を打ち消す合図。',
      use: 'It won’t help, but I’ll buy it anyway.（意味ないけど、どうせ買っちゃう）' },

    // R fix: V2 (55 % blind: the key was the only "gently"); the choices are now gentle hint / gentle praise / blunt
    //   order, so the softeners ("a little", "don't you think?") and "emo" decide it
    // why: praise ← katakana エモい = moving, so "emo" heard as a compliment; blunt ← "for a comedy show" heard as a
    //   flat rule, with the softeners lost
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'emo', seg: [253.5, 262.5],
      stem: 'After Carly’s line about dying, what does the friend’s comment do?',
      choices: ['Gently hints she should keep it lighter', 'Gently praises the line as moving',
                'Bluntly tells her to drop the dark bit'], a: 0,
      cue: '「comedy show」と、最後の付け足し。',
      line: 'That’s a *little emo for a comedy show*, don’t you think?',
      said: '「コメディにしてはちょっと暗くない？」と言う。',
      mean: 'a little と don’t you think? で和らげた、軽い注意。「明るくいこう」という意味。',
      trap: 'emo は「エモい」（感動的）と違い「暗い・重い」。付け足しは命令でなく同意を求める形。',
      use: 'That’s a little much, don’t you think?（ちょっとやりすぎじゃない？）' },
  ]
};
