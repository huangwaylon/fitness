// REVIEW 2026-11-16: pass 3, fix 16, drop 1, new 0; ear checks 8
// REVIEW open: s1 is ~60 % blind (gonna reads more natural than gotta / was gonna); left as is, the near sounds are the real ones — rewrite?
// “Ron Loves Lil' Sebastian | Parks and Recreation” (the official Parks and Recreation channel, Season 3): Leslie
// surprises the team with Pawnee's beloved mini horse; everyone is thrilled except Ben, who can't see the big deal.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 77 s; whisper's repeated lines after it
// are hallucinations. No predict item (no clean pause before a projected move). The "Get out" at 77 s is untested.
// EAR CHECK: 6.6 s a0 — Leslie's “possibly… potentially… the universe” is thrilled hype, not real doubt or modesty (key rests on tone)
// EAR CHECK: 23.0 s a1 x1 — the man (assumed Ron) sounds starstruck; “I'd get to meet him”: the d of I'd nearly gone, “get to” flapped
// EAR CHECK: 27.1 s — captions “it's really him”, whisper “Oh, my God, I hate him” (no key rests on it since review; a1's line now stops before it)
// EAR CHECK: 45.8 s p1 a2 pr1 g2 — the newcomer is “Ben” (whisper “Ben”, captions “van”)
// EAR CHECK: 45.8 s a2 — “He's not a pony, Ben” sounds offended for the horse, not irritated at the interruption or teacherly (key rests on tone)
// EAR CHECK: 50.9 s s2 — “Does he do something”: does‿he linked, h dropped (both have “does he”)
// EAR CHECK: 64.1 s w1 s1 — whisper “Jerry's gonna”, captions “jerry's going to”; Jerry himself answers “Yes, I am”
// EAR CHECK: 73.7 s pr1 — whisper “I just gotta be honest”, captions “i just got to be honest” (same meaning; no key on the form)
import type { Clip } from '../types.ts';

export const sebastian: Clip = {
  id: 'sebastian', video: 'qjPnbUrYsw0', title: 'Ron Loves Lil\' Sebastian', dur: 98, wpm: 224, band: 'fast',
  tags: ['職場'],
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: blind 90 % — only the key was specific; a "famous singer" distractor now uses the stage-intro words.
    //        The seg ran to 31 s, where nothing said it's an animal (V1); now to 49.2 s, through "pony… mini horse".
    // why: singer ← "Ladies and gentlemen, the world famous…" is a stage intro + "festival"; day off ← "you've worked so hard" + surprise = a reward
    { id: 'g1', skill: 'gist', level: 'B1', point: 'surprise', seg: [0, 49.2],
      stem: 'What is Leslie’s surprise for her team?',
      choices: ['A visit from a famous local animal', 'A famous singer to open tomorrow’s festival',
                'A paid day off for all their hard work'], a: 0,
      cue: '紹介のあと、みんながそれを何と呼ぶか。',
      line: 'Ladies and gentlemen, the *world famous Lil’ Sebastian*.',
      said: 'チームをほめたあと、町で有名な小さな馬を紹介する。',
      mean: 'world famous は大げさ。実は地元で大人気の馬。',
      trap: 'world famous は舞台の紹介の決まり文句で歌手と思いやすい。あとで pony と呼ばれる。',
      use: 'I have a surprise for you all.（みんなにサプライズがあるの）' },

    // R fix: blind 80 % — the key was the only "Most…, but Ben…" choice; both distractors now single Ben out too.
    // why: Ben worried ← "be very careful" + age + illness pinned on the newcomer; Ben won over ← the usual sitcom script, his questions get answers
    { id: 'g2', skill: 'gist', level: 'B2', point: 'reaction', reveals: ['honest'], seg: [0, 76.5],
      stem: 'How does the group react to the surprise overall?',
      choices: ['Most are thrilled, but Ben can’t see why', 'Most are thrilled, but Ben worries it’s too old',
                'Everyone is thrilled, Ben too, once he hears the story'], a: 0,
      cue: '歓声のあと、最後まで質問を重ねる人の声。',
      said: 'みんなは大喜び。Ben だけは質問を重ね、最後に何がすごいのか分からないと言う。',
      mean: '町の人には伝説の馬でも、彼にはただの小さな馬。その温度差が場面の笑い。',
      trap: 'careful や病気の話が続くので心配の場面に見えるが、それは別の人の世話の注意。',
      use: 'Am I missing something here?（何か見落としてる？）' },

    // R fix: blind 60 % — "builds up" cued hype and the key was the only upbeat choice; "playfully" also clashed with
    //        Leslie's sincere excitement (K1). Stem neutral, key now "thrilled… for effect", a modest-pride distractor added.
    // why: unsure ← possibly/potentially read as real doubt (日本語の「かもしれない」); modest ← "you've worked so hard" + hedges read as 謙遜
    { id: 'a0', skill: 'attitude', level: 'C1', point: 'buildup', seg: [6.1, 17],
      stem: 'When Leslie describes her surprise, how does she sound?',
      choices: ['Thrilled, and piling on big claims for effect', 'Unsure, so softening her claim in case it flops',
                'Proud, but modestly playing down her own idea'], a: 0,
      cue: '「possibly」から「universe」まで、声の勢い。',
      line: 'it is *possibly* the best thing to *potentially* ever happen to anyone… in the *history of the universe*.',
      said: '「もしかすると、宇宙の歴史で最高の出来事かも」と言う。',
      mean: 'possibly や potentially は本当の迷いではなく、大げさな言葉を重ねて盛り上げている。',
      trap: 'かもしれない＝自信がない、と取りやすい。後ろがこれほど大げさなら、ふざけた強調。',
      use: 'This is possibly the best pizza ever.（これ、たぶん史上最高のピザ）' },

    // R fix: blind 70 % — "annoyed" was a filler; now an old-friend reading of "never thought". The line dropped
    //        "It's really him" (captions only; whisper hears "I hate him" there).
    // why: still alive ← "never thought" + "him" heard as "never thought he'd still be around"; old friend ← "meet him" read as meeting again
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'meet', seg: [22.5, 28],
      stem: 'When a man says “I never thought…”, what is he feeling?',
      choices: ['Starstruck, finally meeting a hero', 'Surprised the horse is still alive',
                'Touched, seeing an old friend again'],
      a: 0,
      cue: '「Oh my God」のあと、声の高さと続く言葉。',
      line: 'I never thought I’d *get to meet him*.',
      said: '「まさか会えるなんて」と声をうわずらせる。',
      mean: 'get to ＋動詞＝念願がかなう。あこがれの有名人に会えたファンの喜び方。',
      trap: 'never thought だけ拾うと「まだ生きていたとは」と取りやすい。get to meet は初めて会えた喜び。',
      use: 'I never thought I’d get to see Paris.（パリに行けるなんて思わなかった）' },

    // R fix: "get to meet him" is 4 words, not 3 (stem and cue); the trap was about I'd, which sits outside the gap.
    { id: 'x1', skill: 'dict', level: 'B2', point: 'meet', seg: [24.6, 27],
      stem: 'Type what he says: “I never thought I’d ___.” (4 words)', answer: 'get to meet him',
      cue: '「I never thought」のあと、短くつながる4語。',
      line: 'I never thought I’d *get to meet him*.',
      said: '「彼に会えるなんて」。get to は「ゲラ」に近く、him の h も弱い。',
      mean: 'get to meet ＝ 会う機会に恵まれる。うれしさを含む言い方。',
      trap: 'meet‿him は h が落ちて一語に聞こえ、語数を少なく数えやすい。弱い代名詞を探す。',
      use: 'Did you get to meet the chef?（シェフに会えた？）' },

    // why: 1978 ← nineteen-eighty-seven heard with the last two digits swapped; 1997 ← "nineteen" + "seven" caught, the middle lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'year', reveals: ['last'], seg: [30.6, 37],
      stem: 'In what year did Lil’ Sebastian first appear at the festival?',
      choices: ['1978', '1987', '1997'], a: 1, keep: true,
      cue: '「debut」のあと、年号。',
      line: 'Lil’ Sebastian made his debut at the last Harvest Festival in *1987*',
      said: '前回のお祭り、1987年にデビューしたと説明している。',
      mean: '1987 は nineteen eighty-seven と、2けたずつ二つに分けて読む。',
      trap: '後半を聞き逃すと seven だけ残り、97 や 78 にずれやすい。年号は2けたずつ聞く。',
      use: 'I first came here in 1998.（初めてここに来たのは1998年）' },

    // R fix: blind 55 % — "for many years" was the only choice with a span; now three parallel "since/then" claims.
    // why: every year since ← debut + "for the next few years" suggest a regular event; first held ← "debut" moved from the horse to the festival
    { id: 'i1', skill: 'infer', level: 'C1', point: 'last', reveals: ['year'], seg: [30.6, 37],
      stem: 'From how Lil’ Sebastian’s debut is described, what can you tell about the festival?',
      choices: ['It hasn’t been held since then', 'It’s been held every year since then',
                'It was first held that year'], a: 0,
      cue: '「debut at the」のあとの一語と、年号。',
      line: 'made his debut at *the last Harvest Festival* in 1987',
      said: '1987年の「前回の」お祭りでデビューした、と説明している。',
      mean: 'last ＝ この前の。それ以来お祭りは開かれていなかった、ということ。',
      trap: 'debut を聞くと「初めての回」と取りやすい。the last ＋行事は「前回の」が多い。',
      use: 'When was the last time you went camping?（最後にキャンプしたのはいつ？）' },

    // R fix: blind 75 % — "hugely popular" was the only positive, emphatic choice; the choices are now parallel.
    // why: strange ← katakana-style 現象 = an odd event; short-lived ← "instant" read as quickly over
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'phenom', seg: [30.6, 37],
      stem: 'What does “an instant phenomenon” mean here?',
      choices: ['A big hit right from the start', 'A strange event right from the start', 'A quick fad that soon ended'],
      a: 0,
      cue: '「instant」のあと。訳語に引っぱられないで。',
      line: 'and he was an *instant phenomenon*.',
      said: '「あっという間に大人気になった」と言っている。',
      mean: 'phenomenon は人や物が「大ブーム」になったときにも使う。instant ＝ すぐに。',
      trap: '「現象」と訳すと不思議な出来事に聞こえる。instant を「すぐ終わる」と取るのも逆。',
      use: 'The song became an instant hit.（その曲はすぐにヒットした）' },

    // R fix: blind 60 % — "even" marked the key as the punchline; reworded so all three are flat claims.
    // why: really a girl ← "girl's name" keyword in the wrong relation; never popular ← "number three" sounds low after "number one"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'names', seg: [36.8, 43.4],
      stem: 'What makes the last fact about baby names funny?',
      choices: ['His name was a hit for baby girls as well', 'It hints that the horse was really a girl',
                'It shows the name was never that popular'], a: 0,
      cue: '「boy’s name」のあと、もう一つのリスト。',
      line: 'the number one boy’s name in Pawnee. And the *number three girl’s name*.',
      said: '数年間、男の子の名前で1位、女の子の名前でも3位だったと言う。',
      mean: 'オスの馬の名を女の子にまで付けた。町の熱狂を、さらりと付け足して笑わせる。',
      trap: 'girl を聞いて「実はメス」と取りやすい。ここは人気の大きさを付け足す一言。',
      use: 'It was the number one song that year.（その年の1位の曲だった）' },

    // R fix: blind 85 % — both distractors were the same "deal = 取引" reading; one is now "what's wrong with it?",
    //        a real sense of the idiom that "what am I missing" rules out.
    // why: cost ← deal = 取引・お得; wrong with it ← "What's the deal with…?" also means "what's wrong with…?"
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'deal', seg: [42.6, 45.7],
      stem: 'When Ben asks about the horse, what does “What’s the deal with…” mean?',
      choices: ['Why is everyone so excited about it?', 'How much did it cost to bring it here?',
                'Is something wrong with it? Is it sick?'], a: 0,
      cue: '直前の「what am I missing」と並べて考えて。',
      line: 'So what am I missing? *What’s the deal* with this pony?',
      said: '「何を見落としてる？このポニーの何がすごいの？」',
      mean: 'What’s the deal with ～? ＝ ～は何が特別なの、とわけを聞くくだけた言い方。',
      trap: 'deal を取引と取るとお金の話。「どこか変？」の意味もあるが、ここは前の文の言い直し。',
      use: 'What’s the deal with this line?（この行列、どうしたの？）' },

    // R fix: blind 60 % — the key was the only negative feeling; "amused" became "annoyed he cut into the story".
    // why: annoyed ← Ben's question does interrupt the history, same edge in the voice; patiently teaching ← "there's a big difference" sounds like an explanation for a newcomer
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'pony', seg: [44.3, 49.2],
      stem: 'In the reply that starts “He’s not a…”, how does the speaker sound?',
      choices: ['Offended on the horse’s behalf', 'Annoyed that Ben cut into the story', 'Patiently teaching Ben a new word'],
      a: 0,
      cue: '「pony」を言い返すときの声と、最後の一文。',
      line: 'He’s *not a pony*, Ben. He’s a mini horse, *there’s a big difference*.',
      said: '「ポニーじゃない、ミニホースだ。大違いだ」と言い返す。',
      mean: 'ほぼ同じ物なのに大違いと言い張る。大事な馬を軽く扱われてむっとしている。',
      trap: '説明の形なので親切に教えていると取りやすい。何に言い返しているか、big difference の言い張りを聞く。',
      use: 'It’s not a cold. There’s a big difference.（ただの風邪じゃない。全然違う）' },

    // R drop: m1 (marker, "Well, then…") — blind 60 %; "Well, then" = それなら is transparent at this level (V3), and a
    //         stronger distractor (irritated, brushing it off) would be defensible from tone (K1). Never shipped: deleted.

    // why: Did ← only the d is caught and the vowel lost; Doesn't ← a puzzled check reading, n't easy to imagine
    { id: 's2', skill: 'sound', level: 'B2', point: 'doeshe', seg: [49.2, 52.2],
      stem: 'Fill the gap: “Why is he so famous? ___ do something?”',
      choices: ['Does he', 'Did he', 'Doesn’t he'], a: 0,
      cue: '「famous」のすぐあと、文頭の弱い音。',
      line: '*Does he* do something? What does he do?',
      said: '「何かするの？何をするの？」。does he は「ダズィ」と短い。',
      mean: 'h が落ちて does‿he がつながる。今できることを聞くので現在形。',
      trap: 'Did he だと昔の話になる。Doesn’t he なら「するんでしょ？」と確かめる意味。',
      use: 'Does he speak English?（彼、英語話せる？）' },

    // R fix: blind 65 % — "clever tricks" isn't a reason to laugh (filler); now a mascot reading of "Notre Dame".
    // why: studied ← "degree" heard, "honorary" missed (literal); mascot ← a famous college name + an animal = a sports mascot
    { id: 'h3', skill: 'humor', level: 'C1', point: 'degree', seg: [49.2, 56.1],
      stem: 'When Ben asks what the horse does, what makes the reply funny?',
      choices: ['It offers a human honor as if it proved his worth', 'It claims the horse really studied at a college',
                'It reveals the horse is a college’s sports mascot'], a: 0,
      cue: '「Son」のあと、何を持ち出して答えたか。',
      line: 'Son, this horse has an *honorary degree* from Notre Dame.',
      said: '「この馬は大学の名誉学位を持っているんだぞ」と答える。',
      mean: '何ができるかの答えになっていない。馬に人間の名誉を与えるほどの人気を、真顔で証拠にしている。',
      trap: 'honorary を聞き逃すと「大学で学んだ」に聞こえる。名誉学位は学ばずにもらえる。',
      use: 'He has a degree in economics.（彼は経済学の学位を持っている）' },

    // R fix: "Diabetes…" was true — Jerry says he and the horse are "both on the same diabetes medication" (K2).
    //        Now "bad hearing" (both + a body part missed); trap rewritten (it claimed diabetes was only Jerry's).
    // why: weak heart ← "very careful" + "severe" suggest a dangerous condition; hearing ← "cataracts" unknown, "both" = two ears
    { id: 'd2', skill: 'detail', level: 'B1', point: 'health', seg: [55.8, 63.9],
      stem: 'What health problems does the horse have?',
      choices: ['Bad eyes and stiff, painful joints', 'Bad eyes and a weak, tired heart',
                'Bad hearing and stiff, painful joints'], a: 0,
      cue: '「careful」の理由。体の二か所。',
      line: 'he has *cataracts in both eyes*, and he has *severe arthritis*.',
      said: '両目に白内障があり、ひどい関節炎もある、とみんなに注意している。',
      mean: '年を取った馬なので、優しく扱ってほしいという呼びかけ。',
      trap: 'cataracts が分からないと both だけ残り、耳とも取れる。直後の in both eyes で絞る。',
      use: 'Be careful, he has a bad back.（気をつけて、彼は腰が悪いの）' },

    // why: 20 ← the "-five" swallowed before "now"; 35 ← "guy's" blurs into the number, heard as thirty-
    { id: 'n2', skill: 'number', level: 'B1', point: 'age', seg: [57.5, 61],
      stem: 'How old is the horse now?',
      choices: ['20', '25', '35'], a: 1, keep: true,
      cue: '「this little guy’s」のすぐあと。',
      line: 'Remember, this little guy’s *25* now',
      said: '「この子はもう25歳なんだから」と念を押す。',
      mean: 'guy’s は guy is の短縮。馬としてはかなりの高齢で、だから注意が必要。',
      trap: 'guy’s の s が数字にくっつき、five が now に紛れやすい。最後の音まで聞く。',
      use: 'My cat is fifteen now.（うちの猫ももう15歳）' },

    // why: got to ← gonna/gotta near sound; was going to ← "Jerry's" heard as "Jerry was", a plan that fell through
    // R fix: seg was 2.0 s (< 3 s); now 62.4–65.6, which keeps "Yes, I am" (it rules out "got to": that would be "Yes, I have").
    { id: 's1', skill: 'sound', level: 'B2', point: 'gonna', reveals: ['jerry'], seg: [62.4, 65.6],
      stem: 'Fill the gap: “___ look after him.”',
      choices: ['Jerry’s going to', 'Jerry’s got to', 'Jerry was going to'], a: 0,
      cue: '名前のすぐあと、短くつながる音。',
      line: '*Jerry’s going to* look after him.',
      said: '「Jerry が面倒を見ることになってる」。going to は「ゴナ」に近い。',
      mean: '決まった予定を伝える言い方。本人もすぐ「はい」と受ける。',
      trap: 'gonna と gotta は似ているが gotta は「しなきゃ」。was なら「予定だったのに」。',
      use: 'I’m going to look after the kids.（子どもたちの面倒は私が見るよ）' },

    // why: Leslie ← she gives the instruction, so the speaker is heard as the carer; Ben ← the last name heard before this
    // R fix: skill who → detail (V4): the carer is named in words ("Jerry's going to…"), not told apart by voice.
    { id: 'w1', skill: 'detail', level: 'B1', point: 'jerry', seg: [63.6, 67.6],
      stem: 'Who will take care of the horse?',
      choices: ['Jerry', 'Leslie', 'Ben'], a: 0,
      cue: '「look after him」の前の名前と、そのあとの返事。',
      line: '*Jerry’s* going to look after him. — Yes, I am.',
      said: '「Jerry が世話をする」と言われ、本人が「そうだよ」と答える。',
      mean: 'look after ＝ 面倒を見る。Yes, I am は「はい、僕がやります」という返事。',
      trap: '指示する人の声が目立つので、その人が世話をすると思いやすい。文頭の主語を聞く。',
      use: 'Could you look after my bag?（かばんを見ていてもらえますか）' },

    // R fix: blind 65 % — the key was the only one tying Jerry to the horse; all three are now about him and the job.
    // why: breaks ← "medication" = his own illness, a practical warning; sick animals ← "look after him" + medicine = experience
    { id: 'i3', skill: 'infer', level: 'B2', point: 'meds', reveals: ['jerry'], seg: [63.6, 70.5],
      stem: 'Why does Jerry mention his medication?',
      choices: ['To bond with the horse over a shared illness', 'To warn he may need breaks for his own illness',
                'To show he has looked after sick animals before'], a: 0,
      cue: '「Yes, I am」のあと、「same」が何を指すか。',
      line: 'We are both on the *same diabetes medication*. Are you my glucotrol *buddy*?',
      said: '「同じ糖尿病の薬を飲んでる。薬仲間だね」と馬に話しかける。',
      mean: '世話係にぴったりな理由として、持病が同じという妙な共通点を挙げている。',
      trap: 'medication から仕事の注意や経験の話と取りやすい。both と buddy が仲間意識の合図。',
      use: 'We’re both on the same team.（僕たち同じチームだね）' },

    // R fix: blind 85 % — "admit a lie" was a filler; now "hasn't been paying attention" (his earlier "what am I missing").
    // why: not listening ← "So what am I missing?" earlier + "be honest" as a confession; stronger yes ← the opening "Yeah" read as a yes (日本語の「はい」)
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'honest', reveals: ['reaction'], seg: [70.7, 76.2],
      stem: 'After “Isn’t it amazing?”, what does Ben’s “I just gotta be honest” do?',
      choices: ['Warns that his opinion is different', 'Admits he hasn’t been paying attention',
                'Adds weight to the yes he just gave'], a: 0,
      cue: '「Yeah」で始まるが、そのあとに来る中身。',
      line: 'Yeah, I just *gotta be honest*. I don’t know what the big deal is.',
      said: '「うん、正直に言うと、何がそんなにすごいのか分からない」と答える。',
      mean: '人と違う意見を言う、という予告の前置き。Yeah は返事の入り口だけ。',
      trap: 'Yeah を聞いて賛成と取りやすい。I gotta be honest のあとには反対意見が来やすい。',
      use: 'I gotta be honest, I didn’t like it.（正直言うと、好きじゃなかった）' },
  ]
};
