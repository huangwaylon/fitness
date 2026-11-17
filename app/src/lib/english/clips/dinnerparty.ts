// “The Dinner Party From Hell - The Office US” (the official The Office channel, BEST OF SEASON 4): at Michael and
// Jan's dinner party the hosts snipe at each other and at Pam, a guest says she only wants to eat, Jim tells the camera
// he's escaping, invents a flooded apartment, tries to leave without Pam, and is talked into staying.
// Segments from the captions, words from whisper (2026-11-16). Names in the audio: Michael and Jan (130.4 s, in the
// talking head), Pam (71.8 s, 149.5 s), Jim (165.4 s "Oh, Jim", 209.5 s); the one who leaves is Jim, answered by name.
// The talking head after the fax remark (77–87 s) is never named, so no stem names its speaker. Left out on purpose:
// the toast's crude wine remark (11 s), Hunter's song (30–65 s, innuendo), the first guessing game (87–106 s: a state
// capital and a quarterback, world knowledge), 106–130 s (overlapping argument), "Wait till you hear this" (whisper
// only), "No rhyming" (captions "Riley") and the celebrity clues after 199 s (world knowledge; captions garbled).
// EAR CHECK: 154 s h2 — whisper “you don’t need two of you to do that”, captions “you don’t need to do that”; 163.4 s whisper “Pam, I’ll see you at home”, captions “Pam Ozzy at home”
// EAR CHECK: 143.4 s x1 — “You’ll” reduced to ユル (’ll nearly gone); both sources agree on the words
// EAR CHECK: 1.9 s s1 — “Here’s to” with a weak “to” (≈ タ, same as “two”); both sources agree on the words
// REVIEW 2026-11-16: pass 7, fix 16, drop 0, new 0; ear checks 3
// REVIEW open: none
import type { Clip } from '../types.ts';

export const dinnerParty: Clip = {
  id: 'dinnerparty', video: 'af0GMFIlb4Q', title: 'The Dinner Party From Hell', dur: 245, wpm: 150, band: 'mid',
  tags: ['友だち', '家'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: blind 85 % (V2, GUIDE §9.4): the title ("From Hell") answered "what has it been like"; now asks what
    //   makes it hard, with keyword traps (songs, jokes, the game) put on the wrong people
    // why: a guest takes over ← songs and "I was making people laugh" are heard, but they're the hosts'; guests fight ←
    //   a guessing game and an argument are heard, but the argument is the hosts'
    { id: 'g2', skill: 'gist', level: 'B1', point: 'sofar', reveals: ['game'], seg: [0, 142.7],
      stem: 'Up to Jim’s comment to the camera, what keeps making the evening hard?',
      choices: ['The hosts keep taking shots at each other', 'A guest keeps taking over with jokes and songs',
                'The guests keep fighting over the guessing game'], a: 0,
      cue: 'ホストどうしのやり取りと、カメラへの一言。',
      said: 'ホストの二人が客の前でけなし合う。カメラには「客を気まずくするゲーム」と語られる。',
      mean: '楽しい食事会ではなく、気まずさが続いている。',
      trap: '歌を流すのも、ゲーム中に言い合うのもホストの二人。誰が誰に向けて言っているかを聞く。',
      use: 'Well, this is awkward.（えっと、気まずいね）' },

    // R fix: blind 60 % (V2): only one choice was a toast; now "Cheers to" (said a second later) is a real toast too
    // why: cheers to ← "Cheers" follows at once, and Here's/Cheers share the vowel; there's two ← a weak "Here's" heard
    //   as "There's", to as two
    { id: 's1', skill: 'sound', level: 'B2', point: 'toast', seg: [0, 4.2],
      stem: 'Fill the gap: “___ good friends.”',
      choices: ['Here’s to', 'Cheers to', 'There’s two'], a: 0,
      cue: 'toast の提案のあと、乾杯の決まり文句。',
      line: 'How about a toast? … *Here’s to* good friends.',
      said: '「乾杯しよう」のあと「良き友に」と杯を上げる。',
      mean: 'Here’s to 〜 ＝「〜に乾杯」。to は弱く「タ」に近い。',
      trap: 'すぐあとの Cheers につられやすい。文頭は h で始まる Here’s。to と two は同じ音になりうる。',
      use: 'Here’s to a great trip!（楽しい旅に乾杯！）' },

    // why: explains ← "So" read as だから, leading into a reason; songs they like ← "music?" heard as a question
    //   about taste
    { id: 'm1', skill: 'marker', level: 'B2', point: 'music', seg: [9.8, 19.9],
      stem: 'After someone asks “What was that?”, what does the next line do?',
      choices: ['It moves the talk on to something else', 'It explains what the odd remark meant',
                'It asks the guests what songs they like'], a: 0,
      cue: 'What was that? のすぐあと、文頭の短い一語。',
      line: 'What was that? — *So*, music?',
      said: '妙な一言に「今の何？」と聞かれ、すぐ「で、音楽は？」と言う。',
      mean: '文頭の So は話題を切り替える合図。質問には答えず、気まずい流れを終わらせる。',
      trap: 'So を「だから」と取ると説明が続くように聞こえる。ここは説明も好みの質問もない。',
      use: 'So, anyway… how was your weekend?（で、それはそうと…週末どうだった？）' },

    // why: singing ← a song plays right after; assistant ← "my old assistant" is said first, and he's about to be
    //   called a bad one
    { id: 'd1', skill: 'detail', level: 'B1', point: 'songwriter', seg: [19.5, 28],
      stem: 'When Hunter is brought up, what is he said to be good at?',
      choices: ['Writing his own songs', 'Singing in a band', 'Helping as an assistant'], a: 0,
      cue: 'excellent のあとの名詞。',
      line: 'my old assistant, Hunter? He is an *excellent songwriter*.',
      said: '「前の助手のハンター、覚えてる？すばらしい作曲家なの」と紹介する。',
      mean: 'songwriter ＝ 曲を作る人。歌う人（singer）とは別。',
      trap: 'assistant が先に聞こえるので仕事ぶりの話と取りやすい。ほめているのは曲作り。',
      use: 'She’s an excellent cook, by the way.（ちなみに彼女、料理がすごく上手）' },

    // R fix: S3: the cue gave "terrible", a word only the key has
    // why: songs at work ← the song just played; Ryan ← his name is in the line (keyword)
    { id: 'd2', skill: 'detail', level: 'B1', point: 'fired', seg: [65.4, 69.85],
      stem: 'According to the reply, why did Hunter lose his job?',
      choices: ['He was a terrible assistant', 'He spent work time on songs', 'He didn’t get along with Ryan'], a: 0,
      cue: 'That is why の前の文。',
      line: 'Hunter was a *terrible assistant*. That is why Ryan fired him.',
      said: '「ハンターはひどい助手だった。だからライアンがクビにした」と言い返す。',
      mean: 'That is why ＝ だから〜。前の文が理由になる。',
      trap: 'Ryan の名前があるので二人の仲の話に聞こえやすい。理由は That is why の前の文。',
      use: 'That’s why I left early.（だから早く帰ったんだ）' },

    // R fix: blind 55 % (V2): "Pam liked working with Hunter" had no hook; now a comparison in Pam's favour
    // why: as hard-working ← "as reliable as" heard as praise (wrong direction); do his job better ← a comparison
    //   heard the other way round, with Pam as the standard
    { id: 'i1', skill: 'infer', level: 'C1', point: 'pamdig', reveals: ['afternoon', 'faxes'], seg: [65.4, 76.85],
      stem: 'Why is Pam brought up when Hunter is called a bad assistant?',
      choices: ['To say Pam is just as unreliable', 'To say Hunter worked as hard as Pam',
                'To say Pam could do Hunter’s job better'], a: 0,
      cue: 'reliable as Pam のあと、理由を言う部分。',
      line: 'he’s probably just about *as reliable as Pam*… *she holds on to faxes*.',
      said: '「ハンターはパムと同じくらい頼りになる。返事に午後いっぱいかかるし」。',
      mean: '「パム並み」は悪口。ハンターをかばいつつ、その場にいるパムを下げている。',
      trap: 'as reliable as は形だけならほめ言葉。直後の理由（遅い、ファックス）で向きが決まる。',
      use: 'It’s about as fast as my grandma.（うちのばあちゃん並みの速さだね）' },

    // R fix: S1: "In that remark" only made sense after another item; the stem now names the moment
    // why: an hour ← "an" + a weak first syllable; a day ← "afternoon" heard as a vague "later"; a week ← what a slow
    //   office might take
    { id: 'n1', skill: 'number', level: 'B1', point: 'afternoon', seg: [69.6, 76.85], keep: true,
      stem: 'When Pam comes up, how long are her replies said to take?',
      choices: ['An hour', 'An afternoon', 'A day', 'A week'], a: 1,
      cue: 'takes you のあと。',
      line: 'it usually *takes you an afternoon* to get back to me.',
      said: '「返事にたいてい午後いっぱいかかる」。',
      mean: 'an afternoon ＝ 午後まるごと。get back to me ＝ 返事をよこす。',
      trap: 'an のあとが弱いと an hour に聞こえやすい。f と t が聞こえたら afternoon。',
      use: 'I’ll get back to you by Friday.（金曜までにお返事します）' },

    // why: sending unchecked ← "faxes" + a busy front desk; losing ← "holds on" missed, leaving a vague "messy" picture
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'faxes', seg: [69.6, 76.85],
      stem: 'What is Pam suspected of doing with faxes?',
      choices: ['Keeping them instead of passing them on', 'Sending them out without checking them',
                'Losing them somewhere on her desk'], a: 0,
      cue: 'holds のあとの2語。',
      line: 'Sometimes I think she *holds on to* faxes.',
      said: '「彼女、ファックスを止めてるんじゃないかと思う」と付け足す。',
      mean: 'hold on to ＝ 手放さずに持っておく。渡すべき物を渡さない、という意味。',
      trap: 'hold on を電話の「待って」で覚えているとつかめない。to のあとの物を「持ち続ける」。',
      use: 'Can you hold on to my bag?（バッグ持っててくれる？）' },

    // R fix: blind 75 % (V2, K5): only the key had a second clause; all three are now "feeling; what she cares about"
    // why: hurt ← she was just insulted, and the Japanese frame expects her to be upset; keep the peace ← "I don't care
    //   what they say" read as 寛大
    { id: 't1', skill: 'attitude', level: 'C1', point: 'eat', reveals: ['nofood'], seg: [76.85, 87.65],
      stem: 'In the talking head after the fax remark, how does the speaker sound?',
      choices: ['Dry and fed up; she cares only about eating', 'Hurt and upset; she cares what they think',
                'Calm and kind; she wants to keep the peace'], a: 0,
      cue: '「気にしない」のあと、何を望むかと最後の一言。',
      line: 'I don’t care what they say about me. I just want to eat, which I realize is *a lot to ask for at a dinner party*.',
      said: '「何を言われてもいい。食べたいだけ。食事会でそれは高望みだろうけど」とカメラに言う。',
      mean: '食事会で食べたいのは当然。「高望み」と言うのは皮肉で、うんざりしている。',
      trap: '「気にしない」を寛大さと取りやすい。悪口より空腹のほうが大事、という冷めた言い方。',
      use: 'I just want a hot shower.（熱いシャワーを浴びたい、それだけ）' },

    // R fix: blind 65 % (V2, S1): "so far" pointed at "not yet", and "that talking head" leaned on t1; the stem now
    //   names the moment
    // why: tastes bad ← the strange remark about the drink at the toast; not much ← "a lot to ask for" heard as
    //   being about the amount
    { id: 'i2', skill: 'infer', level: 'B2', point: 'nofood', reveals: ['eat'], seg: [76.85, 87.65],
      stem: 'In the talking head after the fax remark, what is implied about dinner?',
      choices: ['It hasn’t been served yet', 'It isn’t very good', 'There isn’t much of it'], a: 0,
      cue: 'just want to のあとの動詞。',
      line: 'I just *want to eat*',
      said: '「ただ食べたい」と言う。食事会なのに、まだ食べられていない。',
      mean: '食事が出ていないので、「食べる」こと自体が願いになっている。',
      trap: '乾杯のときの妙な感想から「まずい」と取りやすい。味の話は一言もない。',
      use: 'When do we eat?（ごはんはいつ？）' },

    // R fix: blind 60 % (V2): the key was the only plain paraphrase of the quote; now "a lot" read as quantity (a big
    //   meal) is the near miss, refuted by "I just want to eat"
    // why: eats more ← the 遠慮 frame: the speaker blames herself for wanting too much; big meal ← "a lot" heard as an
    //   amount of food
    // anchor: 84.6–87.3 s "at a dinner party": eating is the point of the event, so calling it a lot to ask is a dig
    // retired: one C2 alone is under 2 (nt1 retired)
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'eat', reveals: ['nofood'], seg: [76.85, 87.65], retired: true,
      stem: 'Taken at face value, what would “a lot to ask for” say here?',
      choices: ['That just eating is too much to hope for there', 'That a big meal is too much to hope for there',
                'That she eats more than a guest should'], a: 0,
      cue: '「高望み」と、最後の at a のあと。',
      line: 'which I realize is *a lot to ask for* at a *dinner party*.',
      said: '「食べたいだけ。食事会でそれを望むのは欲張りだと分かってるけど」と言う。',
      mean: '本気なら「食事会で食事は無理な望み」になる。当然のことを高望みと呼んで、ホストを皮肉っている。',
      trap: 'a lot を量と取ると「ごちそう」、遠慮の型なら「自分が欲張り」に。望みは just ＝ 食べることだけ。',
      use: 'Clean towels? Is that too much to ask?（きれいなタオルって、高望み？）' },

    // R fix: blind 70 % (V2): "good hosts" was a filler, and only the key was a "why" (the others said "He means");
    //   now all three say what "winning" means, with the hosts' argument as the near miss
    // why: party game ← a guessing game really is played later (keyword); their argument ← "their own separate game"
    //   heard as the two playing against each other
    { id: 'h1', skill: 'humor', level: 'C1', point: 'game', reveals: ['sofar'], seg: [130.2, 142.7],
      stem: 'In the talking head about Michael and Jan, why is “both winning” funny?',
      choices: ['He means both are making the guests miserable', 'He means the party game they play later',
                'He means each is winning their argument'], a: 0,
      cue: 'ゲームの名前と、「勝つ」が何を指すか。',
      line: 'it’s called, *let’s see how uncomfortable we can make our guests*. And *they’re both winning*',
      said: '「二人は別のゲーム中。『客をどこまで気まずくできるか』で、二人とも勝っている」と話す。',
      mean: '「勝っている」＝ 二人とも客を十分気まずくしている。ほめ言葉の形の皮肉。',
      trap: '本当のゲームや夫婦げんかと混ざりやすい。けんかなら二人とも勝てない。',
      use: 'If it’s a contest, you’re winning.（競争なら、君の勝ちだね）' },

    // R fix: blind 70 % (V2): "feels sorry and wants to help" was a filler; now the 遠慮 frame (annoyed but must stay)
    // why: amused ← his dry, joking tone; must stay ← the Japanese frame: a guest puts up with it to be polite
    { id: 't2', skill: 'attitude', level: 'B2', point: 'run', seg: [130.2, 142.7],
      stem: 'How does Jim feel about staying, judging by his talking head?',
      choices: ['He’s had enough and wants out', 'He’s amused and wants to watch', 'He’s annoyed but feels he must stay'],
      a: 0,
      cue: 'so I am going to のあと。',
      line: 'they’re both winning, *so I am going to make a run for it*.',
      said: '「二人とも勝っているので、逃げ出すことにする」と話す。',
      mean: 'so のあとが結論。もう十分で、帰りたい。',
      trap: '言い方が冷静で笑いまじりなので、面白がっているように聞こえやすい。so のあとの行動を聞く。',
      use: 'I’ve had enough. I’m heading out.（もう十分。帰るね）' },

    // R fix: blind 70 % (V2): "real trouble" was the weakest; now a joke nobody is meant to believe, so the key isn't
    //   the only "not real" reading
    // why: bad luck ← "You'll never guess" sounds like real news, and the timing could be chance; a joke ← the story is
    //   so convenient it might be a gag (but he adds the sprinkler and "see the damage", and the hosts say "Oh, no!")
    // anchor: 140–142.4 s "so I am going to make a run for it", then at once "You'll never guess… my apartment flooded"
    // retired: for the draws (g1 reveals its point, so play 3+ under g1 drew no C2)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'excuse', reveals: ['run', 'flood', 'getgoing', 'guess'],
      seg: [130.2, 153.7], retired: true,
      stem: 'After Jim’s comment to the camera, how should we hear the landlord message?',
      choices: ['As an excuse he has made up to get away', 'As bad luck that just happens to suit him',
                'As a joke he doesn’t expect them to believe'], a: 0,
      cue: 'カメラへの一言と、そのすぐあとの知らせ。',
      line: 'I am going to *make a run for it*. … *You’ll never guess*. I just got a message from my landlord.',
      said: 'カメラに「逃げ出す」と言った直後、「大家から連絡、部屋が水びたしだって」と言い出す。',
      mean: 'カメラへの本音が次の場面の答え合わせ。逃げると言った直後の急な知らせは、作った口実。',
      trap: '偶然の不運と取ると筋は通るが、順番を見落としている。この形式では、カメラへの言葉が先に種明かしをする。',
      use: 'Oh, look at the time! Gotta run.（あ、もうこんな時間！行かなきゃ）' },

    // R fix: blind 65 % (V2): the key was the only two-part answer and said "makes up", nt1's key; all three are now
    //   two-part, and the segment runs on to "It has to be a real person, Jim" (209.5 s), where he's still there
    // why: leaves with Pam ← "Pam, we should probably get going" (keyword); leaves Pam behind ← "Pam, I'll see you at
    //   home" heard as the end of it
    { id: 'g1', skill: 'gist', level: 'B2', point: 'escape',
      reveals: ['run', 'flood', 'excuse', 'leavepam', 'abandon', 'newparty'], seg: [130.2, 211],
      stem: 'After his comment to the camera, how does Jim’s evening turn out?',
      choices: ['He tries to slip out, but is talked into staying', 'He slips out with Pam, using the flood as cover',
                'He gets himself out, but has to leave Pam behind'], a: 0,
      cue: '帰ろうとしたあと、ホストに何と言われるか。',
      said: '部屋が水びたしだと帰ろうとするが、「パーティーは買えない」と引き止められ、ソファに座らされる。',
      mean: '逃げ出す作戦は失敗。結局パーティーに残ることになる。',
      trap: 'パムを置いて帰りかける場面はあるが、そのあと呼び止められる。最後のソファの一言まで聞く。',
      use: 'I tried to sneak out, but got caught.（こっそり帰ろうとしたら、見つかった）' },

    // R fix: blind 60 % (V2): the key was the only choice without "run"-type words and "win" had little pull; now
    //   three "run" readings: escape, jogging, an errand
    // why: a run ← run read literally (ジョギング); store ← "make a run" as in a run to the store (an errand)
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'run', seg: [138.1, 142.7],
      stem: 'What does Jim say he is going to do?',
      choices: ['Run off and leave the party', 'Go for a quick run outside', 'Make a quick run to the store'], a: 0,
      cue: 'make a のあとの2語。',
      line: 'so I am going to *make a run for it*.',
      said: '「だから、逃げ出すことにする」。',
      mean: 'make a run for it ＝（隙を見て）逃げ出す。本当に走るとは限らない。',
      trap: 'run を走る、または買い出し（a run to the store）と取りやすい。for it が付くと「逃げ出す」。',
      use: 'It’s raining. Let’s make a run for it.（雨だ、走って逃げよう）' },

    // R fix: K1/V1: from 148 s alone, "asking her to come and check the damage" was as defensible as the key; the
    //   segment now starts at the talking head ("make a run for it"), and that reading is a distractor
    // why: asking ← "probably" heard as a real question to her; help check ← the flood taken at face value
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'getgoing', reveals: ['flood', 'excuse'], seg: [138.7, 153.7],
      stem: 'What is Jim’s line to Pam doing?',
      choices: ['Giving them both a polite way out', 'Asking whether she’d like to stay',
                'Asking her to help check the damage'], a: 0,
      cue: 'we should probably の主語と、何をするか。',
      line: 'Pam, *we should probably get going* and see the damage.',
      said: '「パム、そろそろ行って被害を見たほうがいいかも」。',
      mean: 'get going は帰るときの決まり文句。we で二人そろって帰る口実を作っている。',
      trap: 'probably があると相談に聞こえやすいが、行くことは決めている。主語は you でなく we。',
      use: 'Well, we should probably get going.（じゃあ、そろそろ失礼しようか）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'guess', seg: [142.7, 148],
      stem: 'Type what Jim says first: “___. I just got a message…” (3 words)', answer: "you'll never guess",
      cue: 'カメラの場面のあと、最初の一言。',
      line: '*You’ll never guess*. I just got a message from my landlord.',
      said: '「なんと、今、大家から連絡が来て」と切り出す。',
      mean: 'You’ll never guess ＝ 驚く知らせの前置き。you’ll は「ユル」と短い。',
      trap: 'you’ll の ’ll が消えて you never に聞こえやすい。縮んだ will を探す。',
      use: 'You’ll never guess who I ran into.（誰に会ったと思う？）' },

    // why: broken into / lost power ← other things a landlord might call about
    { id: 'd3', skill: 'detail', level: 'B1', point: 'flood', seg: [142.7, 148],
      stem: 'What does Jim say has happened to his apartment?',
      choices: ['It flooded with water', 'It got broken into', 'It lost all its power'], a: 0,
      cue: 'apparently のあと、最後の動詞。',
      line: 'Apparently my apartment *flooded*.',
      said: '「大家からの連絡で、どうやら部屋が水びたしらしい」と言う。',
      mean: 'flood ＝ 水があふれる。apparently ＝ 聞いた話では。',
      trap: 'landlord（大家）から泥棒や停電を思い浮かべやすい。最後の動詞 flooded を聞く。',
      use: 'Apparently the train is delayed.（どうやら電車が遅れてるらしい）' },

    // R fix: blind 60 % (V2): "takes Pam home too" was refuted by the stem's own logic; now "That's true" heard as
    //   owning up. "leaves Pam there alone" said more than the audio (she stays with the hosts): now "behind".
    // why: stays ← "That's true" heard as giving in to the host; no flood ← "That's true" heard as admitting the lie
    // retired: ear check (the key needs “Pam, I’ll see you at home” and “two of you”, whisper; the captions have “Pam Ozzy at home” and “you don’t need to do that”)
    { id: 'h2', skill: 'humor', level: 'C1', point: 'leavepam', reveals: ['getgoing'], seg: [153.6, 168.6], retired: true,
      stem: 'Why is Jim’s quick “That’s true” funny?',
      choices: ['He agrees, and leaves Pam behind', 'He agrees, and stays on for dinner',
                'He agrees, and admits there’s no flood'], a: 0,
      cue: 'That’s true のあと、誰に何と言うか。',
      line: 'Well, you don’t need *two of you* to do that. — *That’s true*. … Pam, *I’ll see you at home*.',
      said: '「二人もいらない」と言われ、「確かに」と答え、パムを残して帰ろうとする。',
      mean: '二人で帰る口実だったのに、一人で帰れると分かると、パムを置いていく。',
      trap: 'That’s true を「残ります」の同意と取りやすい。続く「家でね」でパムだけ残ると分かる。',
      use: 'Good point. See you later!（確かに。じゃあね！）' },

    // why: guessing ← "I don't think" as a real opinion (思う); come back ← "abandon… by itself" heard as asking him
    //   to return later
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'abandon', seg: [165.2, 173.65],
      stem: 'What is the host’s first answer to Jim leaving?',
      choices: ['Telling him, softly, he can’t go', 'Guessing, honestly, that he’ll stay',
                'Asking, kindly, if he’ll come back'], a: 0,
      cue: 'Oh, Jim のあと、I don’t think の使い方。',
      line: 'Oh, Jim, *I don’t think you’re going to abandon* this party here all by itself.',
      said: '「ジム、パーティーをひとりぼっちにしないよね」。',
      mean: 'I don’t think you’re going to 〜 は、予想でなく、やわらかい「〜させない」。',
      trap: 'I don’t think は意見に聞こえる。相手の行動に使うと、遠回しな命令。',
      use: 'I don’t think you’re leaving yet.（まだ帰さないよ）' },

    // R fix: blind 60 % (V2, K5): only the key explained the joke; all three are now reasons in one form, with "can't buy"
    //   read as "costs a lot" as the near miss
    // why: offers to buy ← "you can buy new stuff" heard as his offer; costs a lot ← "can't buy" read as a price
    { id: 'h3', skill: 'humor', level: 'C1', point: 'newparty', reveals: ['abandon'], seg: [165.2, 173.65],
      stem: 'Why is the host’s reply about buying new stuff funny?',
      choices: ['He rates a party above all Jim owns', 'He offers to pay for all Jim has lost',
                'He thinks parties cost more than Jim’s stuff'], a: 0,
      cue: 'but のあと、何が「買えない」か。',
      line: 'everything I own is there. — You can buy new stuff, but *you can’t buy a new party*.',
      said: '「全財産があるんだ」に「物は買い直せるけど、パーティーは買えない」。',
      mean: '「お金で買えないもの」の言い方を自分のパーティーに使い、全財産より上に置く。',
      trap: '「買ってあげる」「パーティーは高い」と取りやすい。can’t buy ＝ お金で買えない。',
      use: 'You can’t buy memories like this.（こんな思い出はお金で買えない）' },

    // why: reading my mind ← "into my head" read literally as 心を読む; headache ← "head" + annoyance
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'head', seg: [190.6, 198.65],
      stem: 'When his first clue is stopped by the rules, what does the clue-giver mean?',
      choices: ['You’re making me nervous and confused', 'You’re guessing just what I’m thinking',
                'You’re giving me a terrible headache'], a: 0,
      cue: 'ルールを言われたあと、getting into のあと。',
      line: 'No names… no sound-alike. — Okay. *You’re getting into my head*.',
      said: '名前も似た音もだめと言われ、「調子が狂うよ」とこぼす。',
      mean: 'get into my head ＝ 気にさせて調子を乱す。スポーツで相手を揺さぶるときにも使う。',
      trap: '頭に入る＝心を読む、と取りやすい。ルールを並べられた直後なので、困っている言葉。',
      use: 'Don’t let them get into your head.（相手のペースに乗せられないで）' },
  ]
};
