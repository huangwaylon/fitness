// REVIEW 2026-11-16: pass 3, fix 17, drop 0, new 0; ear checks 7
// REVIEW Q: a1 assumes “Not perfect, but good enough” is Chandler about himself; if it's someone else, drop a1.
// REVIEW Q: form items (p1, p2, m1) were judged on cues in the choices, not on a fluent reader knowing the chunk.
// “Monica Doesn't Believe in Soul Mates | Friends” (the official Friends channel, Best of Season 8): Chandler is sulking
// because Phoebe thinks Monica and Don are soulmates; Monica says love is work, not fate.
// Segments from the captions, words from whisper (2026-11-16).
// EAR CHECK: 2.5 s a1 — tone of “Yeah, fine. Fine. Not perfect, but good enough.” (assumed Chandler, sulky; key rests on tone)
// EAR CHECK: 7.8 s s1 h1 — Monica says “Jeez” (captions “Jeez”, whisper “Geez”): clearly not “Sheesh” or “Gee”? close to “cheese”?
// EAR CHECK: 22.0 s s2 p1 — “I won't stand”: is “won't” clearly /woʊnt/, not “want”? (both sources: won't)
// EAR CHECK: 45.6 s h2 — “Some days we work really hard” read as a dry joke (tone; assumed Monica)
// EAR CHECK: 53.7 s x1 — “I've had second thoughts” (captions “I I I've had”, whisper “I've had”); d+s linking
// EAR CHECK: 59.5 s a2 — “I love you.” / “I know.”: speakers assumed Chandler then Monica; “I know” warm and teasing?
// EAR CHECK: 62.2 s m1 h3 — who offers the dinner (unknown; the items avoid naming a speaker)
// NOTE: 27.4 s “Taylor, you…” and 29.4 s “Tomatoes” are in both sources but likely ASR slips; no item uses them.
import type { Clip } from '../types.ts';

export const soulmates: Clip = {
  id: 'soulmates', video: '8zNhLsqrjVs', title: "Monica Doesn't Believe in Soul Mates", dur: 84, wpm: 213, band: 'fast',
  tags: ['恋愛', '家'],
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: blind pass 80 % (two weak distractors); now both distractors reuse said words in the wrong relation
    // why: Monica believes ← "believe in" + "soulmates" said, but it's Chandler who doesn't, Phoebe who thinks;
    //   Phoebe prefers Don ← Phoebe and Don named in one breath
    { id: 'g1', skill: 'gist', level: 'B1', point: 'worry', reveals: ['pair'], seg: [0, 26.8],
      stem: 'What is bothering Chandler in the first half of the scene?',
      choices: ['He fears Monica and Don are a better match', 'He is upset that Monica believes in soulmates',
                'He is jealous that Phoebe prefers Don to him'], a: 0,
      cue: 'what’s going on? のあとの長い説明。',
      line: 'Phoebe thinks that you and *Don* are *soulmates*…',
      said: 'フィービーが「モニカとドンは運命の相手」と言ったので、気にしている。',
      mean: '自分よりドンの方がモニカに合うのでは、と不安になっている。',
      trap: 'Phoebe や cheese など目立つ語だけ拾うと、話の中心を外しやすい。悩みは thinks のあと。',
      use: 'What’s going on with you?（どうしたの？）' },

    // why: working late ← "all afternoon" heard as a time of work; quiet ← "fine. Fine." read back into the question
    { id: 'd1', skill: 'detail', level: 'B1', point: 'weird', seg: [0, 6.3],
      stem: 'What has Monica noticed about Chandler?',
      choices: ['He has been acting strange all afternoon', 'He has been working late all this week',
                'He has been quiet since this morning'], a: 0,
      cue: '最初の質問のすぐあと、様子を表す一語。', line: 'You’ve been *acting weird* all afternoon.',
      said: '「大丈夫？午後ずっと様子が変だよ」と声をかけている。',
      mean: 'act weird ＝ いつもと違う、おかしな振る舞いをする。心配して聞く決まった言い方。',
      trap: 'afternoon だけ拾うと時間の話に流れやすい。様子を表す語（weird）を先に拾う。',
      use: 'You’ve been acting weird lately.（最近ちょっと変だよ）' },

    // R fix: blind pass 70 %: the stem quoted the doubled "fine" (the cue itself), and "second-best" rested on the
    //   later Don talk (V1); stem now names the moment, key stays inside the segment, distractor 3 is a 謙遜 frame;
    //   cue no longer says "fine" (a word only the key had)
    // why: relaxed ← "fine" taken at face value (大丈夫); modest ← "Not perfect, but good enough" read as 謙遜
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'goodenough', reveals: ['weird'], seg: [0, 7.3],
      stem: 'When Monica asks if he is okay, how does Chandler sound?',
      choices: ['Sulky, saying he is fine but not meaning it', 'Relaxed, honestly saying things are okay',
                'Modest, playing down how well things are going'], a: 0,
      cue: 'Yeah のあとの返事と、付け足しの一言。',
      line: 'Yeah, fine. Fine. *Not perfect, but good enough.*',
      said: '「うん、平気。完璧じゃないけど、まあ十分だよ」と答える。',
      mean: '自分を「完璧じゃない男」と言っている。ほかの男と比べて、すねている。',
      trap: 'fine を「大丈夫」とそのまま取ると落ち着いて聞こえる。付け足しに本音が出る。',
      use: 'I’m fine. Not great, but fine.（平気。最高ではないけど）' },

    // R fix: "actually" in the stem flagged the obvious word as wrong, and "Cheese"/"Please" don't fit the frame
    //   as an exclamation (K3); now a gap with three real exclamations; level C1 → B2 (a sound contrast, not heavy reduction)
    // why: Sheesh ← same vowel and z/sh ending, first sound unvoiced; Gee ← the final z is lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'jeez', reveals: ['cheesejoke'], seg: [7.3, 10.5],
      stem: 'Fill the gap: “___, what is with you?”',
      choices: ['Jeez', 'Sheesh', 'Gee'], a: 0,
      cue: '文の最初、短いため息のような一語。', line: '*Jeez*, what is with you?',
      said: '「もう、どうしちゃったの？」。あきれた声。',
      mean: '濁った「ジ」で始まり、z の響きで終わる。次に cheese と聞き返される音。',
      trap: 'Sheesh は濁らない「シ」、Gee は語尾の z がない。最初の濁りと語尾を両方聞く。',
      use: 'Jeez, that was close!（うわ、危なかった！）' },

    // R fix: blind pass 85 % (key the only sensible choice); "mishears" also claimed more than the audio shows —
    //   he may be twisting her word on purpose — so the key now covers both readings
    // why: mocking ← repeating someone's word often mocks how they said it; not listening ← "I'm sorry" read as
    //   an admission he wasn't paying attention
    { id: 'h1', skill: 'humor', level: 'C1', point: 'cheesejoke', reveals: ['jeez'], seg: [7.3, 13.5],
      stem: 'What makes “Did you say cheese?” funny?',
      choices: ['He turns her word into the thing that bugs him', 'He mocks the way Monica pronounces words',
                'He admits he was not listening to her'], a: 0,
      cue: 'sorry のあと。直前の一語とどこが似ている？',
      line: 'I’m sorry. *Did you say cheese?*',
      said: '「ごめん、今チーズって言った？」と聞き返す。',
      mean: 'Jeez を cheese に変えてしまうほど、チーズ（＝Don の話）が頭から離れない。',
      trap: '聞き返しを発音へのからかいと取るとずれる。似た音への言い換えは、気にしている事の表れ。',
      use: 'Sorry, did you say Tuesday?（すみません、火曜って言いました？）' },

    // R fix: cut "Phoebe and Don" (K4: the weakest of three, nobody hears that pair)
    // why: Chandler and Don ← "you" heard as the speaker's own pair; Monica and Chandler ← the usual couple
    { id: 'd2', skill: 'detail', level: 'B1', point: 'pair', seg: [15, 21.2],
      stem: 'Who does Phoebe think are soulmates?',
      choices: ['Monica and Don', 'Chandler and Don', 'Monica and Chandler'], a: 0,
      cue: 'Phoebe thinks のすぐあと、and でつながる二人。', line: 'Phoebe thinks that *you and Don* are soulmates',
      said: '「フィービーは、君とドンが運命の相手だと思ってる」とモニカに言う。',
      mean: 'you はモニカ。soulmate ＝ 生まれつき結ばれている相手。',
      trap: 'you は話し相手のこと。話し手本人と取ると組み合わせがずれる。代名詞は誰に話しているかで決める。',
      use: 'I think you two would get along.（二人は気が合うと思う）' },

    // R fix: the cue ("the short sound before the verb") pointed straight at the negative; now it only says where
    // why: believes for Monica ← "but then you two totally get along"; never thought ← "that kind of stuff" as vagueness
    { id: 'd3', skill: 'detail', level: 'B1', point: 'belief', seg: [18, 21.4],
      stem: 'What does Chandler say about soulmates?',
      choices: ['He doesn’t believe in that kind of thing', 'He believes in them, but not for Monica',
                'He has never thought about them before'], a: 0,
      cue: 'soulmates のすぐあと、自分のことを言う部分。', line: 'and *I don’t believe* in that kind of stuff',
      said: '「僕はそういうのは信じてない」と言う。',
      mean: '信じていないのに、二人の仲の良さを見て不安になっている、という流れ。',
      trap: 'don’t は弱く、t もほぼ消える。「believe」だけ聞こえると逆の意味になる。否定は前の短い音で決まる。',
      use: 'I don’t really believe in that stuff.（そういうのはあまり信じない）' },

    // R fix: cut "will stand" (K4: the weakest; it says the opposite of the whole offer)
    // why: want to ← won't /oʊ/ vs want /ɑ/ blur for Japanese ears; wouldn't ← same frame, one weak syllable more
    { id: 's2', skill: 'sound', level: 'B2', point: 'wont', seg: [20.9, 25.6],
      stem: 'Fill the gap: “So look, I ___ in your way…”',
      choices: ['won’t stand', 'want to stand', 'wouldn’t stand'], a: 0,
      cue: 'look のあと、I に続く短い語の母音。', line: 'So look, *I won’t stand* in your way',
      said: '「だから、邪魔はしないよ」。t はほぼ消える。',
      mean: 'won’t の母音は「オウ」。want は口を大きく開けた「ア」。',
      trap: '日本語の耳では won’t と want が近い。母音が「オウ」と動くかどうかで聞き分ける。',
      use: 'I won’t keep you long.（長くは引き止めないよ）' },

    // R fix: "come along" was a weak filler; replaced with the can't-stand (我慢できない) trap. Its notes say
    //   「ドンと一緒になりたいなら」, so it also reveals runoff
    // why: wait ← stand = 立って待つ (literal); put up with ← "can't stand" = 我慢できない, a known chunk with stand
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'standway', reveals: ['wont', 'runoff'], seg: [20.9, 25.6],
      stem: 'What does Chandler mean by “I won’t stand in your way”?',
      choices: ['I will not try to stop you', 'I will not wait for you any longer', 'I will not put up with this'],
      a: 0,
      cue: 'if you want to のあと、何をしたい人の話か。',
      line: 'I won’t *stand in your way* if you want to run off with Don',
      said: '「ドンと一緒になりたいなら、邪魔はしない」と言う。',
      mean: 'stand in someone’s way ＝ 行く手に立ちふさがる。身を引くふりをした強がり。',
      trap: 'stand を「立って待つ」と取りやすい。道に立つ＝ふさぐ、と覚える。',
      use: 'I won’t stand in your way.（あなたの邪魔はしない）' },

    // why: jogging ← run = 走る (literal); get away ← "off" heard as escape from Don
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'runoff', seg: [21.3, 25.8],
      stem: 'What does “run off with Don” mean here?',
      choices: ['Leave home to be with Don', 'Go out running with Don', 'Get away from Don quickly'], a: 0,
      cue: 'with Don のあと、どこで暮らす話が続くか。',
      line: 'if you want to *run off with* Don and live in a house of cheese',
      said: '「ドンと出ていって、チーズの家で暮らしたいなら」。大げさな言い方。',
      mean: 'run off with ＝ 恋人と一緒に家を出ていく、駆け落ちする。',
      trap: 'run を「走る」と取るとジョギングの話になる。with ＋人 が続いたら「一緒に出ていく」。',
      use: 'She ran off with her boss.（彼女は上司と出ていった）' },

    // why: didn't hear ← "You don't?" taken as a hearing check; upset ← disagreement assumed, though she agrees
    // R fix: its line ("I don't believe in soulmates, *either*") gives away d3's point; added belief to reveals
    { id: 'i1', skill: 'infer', level: 'B2', point: 'surprise', reveals: ['mview', 'belief'], seg: [33.6, 38.5],
      stem: 'When Chandler says “You don’t?”, what does it show?',
      choices: ['He expected Monica to believe in soulmates', 'He didn’t hear what Monica just said',
                'He is upset that Monica disagrees with him'], a: 0,
      cue: '直前の文の最後の一語に注目。', line: 'I don’t believe in soulmates, *either*. — *You don’t?*',
      said: 'モニカの「私も信じない」に「信じないの？」と驚く。',
      mean: 'either ＝ 「私も（〜ない）」。彼女はロマンチックな方だと思っていた、という驚き。',
      trap: '短い聞き返しは「聞こえなかった」ではなく、意外さを表すことが多い。上がり調子に注目。',
      use: 'Oh, you don’t? I thought you did.（え、違うの？そうだと思ってた）' },

    // R fix: blind pass 80 % (Phoebe isn't in the scene; distractor 3 contradicted the stem); now the sitcom script
    //   (we ARE soulmates) and a keyword trap on Don
    // why: soulmates after all ← "destined to end up together" heard without "I don't think"; Don not her type ←
    //   "Don" and "second thoughts" said, but about the house, not about him
    { id: 'g2', skill: 'gist', level: 'B2', point: 'mview', reveals: ['surprise', 'workhard'], seg: [34, 62],
      stem: 'How is Chandler’s worry settled?',
      choices: ['Monica says their love comes from effort, not fate', 'Monica says the two of them are soulmates after all',
                'Monica says Don is not really her type of man'], a: 0,
      cue: 'I don’t think のあと、二人のこれまでの話。',
      line: 'I think that we fell in love, and we *work hard* at our relationship.',
      said: 'モニカは「運命じゃなく、恋に落ちて、努力してきた」と言い、彼は安心する。',
      mean: '運命の相手かどうかより、二人で積み重ねた関係が大事、という答え。',
      trap: 'destined が聞こえても、前に I don’t think がある。否定の枠ごと聞くこと。',
      use: 'We work hard at our relationship.（関係を大事に育てている）' },

    // R fix: blind pass 80 %; "end things soon" was absurd after a love speech. Now a boast reading of "work hard"
    // why: jobs ← "work" taken literally; boasting ← "work really hard" heard as her own effort, missing "we"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'workhard', reveals: ['mview'], seg: [41.3, 48.3],
      stem: 'What is funny about Monica adding “Some days…”?',
      choices: ['It hints that some days he is hard to live with', 'It means their jobs keep them busy some days',
                'It boasts that she tries harder than he does'], a: 0,
      cue: '前の文と同じ言葉に、何が足されたか。', line: '*Some days* we work *really* hard.',
      said: '「日によっては、すごく頑張ってる」と付け足す。',
      mean: 'チャンドラーが手のかかる日もある、という軽いからかい。愛情のある冗談。',
      trap: 'work を仕事と取ると意味が通らない。同じ語をくり返して強めたら、冗談の合図のことが多い。',
      use: 'Some days are harder than others.（大変な日もある）' },

    // R fix: blind pass 75 % (visit and cooking were fillers); now two readings a partial listener would make
    // why: offering ← echoes his earlier "I won't stand in your way"; admit she likes Don ← "live with Don" heard
    //   without "don't want", as a jealous test
    { id: 'i2', skill: 'infer', level: 'B2', point: 'check', seg: [48.4, 52.7],
      stem: 'Why does Chandler ask about “the cheese house” again?',
      choices: ['He wants to hear her say she is staying', 'He is offering once more to let her go',
                'He wants her to admit she still likes Don'], a: 0,
      cue: 'So you のあと、文の形（肯定か否定か）。',
      line: 'So you… you *don’t want* to live with Don in the cheese house?',
      said: '「じゃあ、ドンとチーズの家に住みたくはないんだね？」と確かめる。',
      mean: '言葉で「ここにいる」と聞いて安心したい。否定の形の質問は確認の合図。',
      trap: 'don’t が弱いと「住みたいの？」に聞こえる。So で始まる質問は、話のまとめ・確認が多い。',
      use: 'So you’re not mad at me?（じゃあ、怒ってないんだね？）' },

    // R fix: trap was about "had", outside the answer; now about the typed words
    { id: 'x1', skill: 'dict', level: 'B2', point: 'second', seg: [52.7, 55.6],
      stem: 'Type what Monica says: “No, I’ve had ___ about that.” (2 words)', answer: 'second thoughts',
      cue: 'No のあと。I が何度か聞こえても気にしないで。', line: 'No, I’ve had *second thoughts* about that.',
      said: '「ううん、それは考え直したの」。',
      mean: 'have second thoughts ＝ 考え直す、やっぱりやめようと思う。',
      trap: 'second の d は次の th に飲まれやすい。2語で一つの言い回しと覚える。',
      use: 'I’m having second thoughts.（ちょっと迷ってきた）' },

    // why: allergic ← "hard" heard as health; too small ← a house of cheese pictured literally
    { id: 'd4', skill: 'detail', level: 'B1', point: 'clean', seg: [53, 57.8],
      stem: 'What reason does Monica give for not wanting the cheese house?',
      choices: ['It would be hard to keep clean', 'It would be too far from her work', 'It would make her feel sick'],
      a: 0,
      cue: 'Do you realize のあと、文の最後の語。', line: 'Do you realize how hard that would be *to clean*?',
      said: '「あれを掃除するの、どれだけ大変か分かる？」と言う。',
      mean: '理由は掃除。きれい好きなモニカらしい答え方。',
      trap: 'hard だけ拾うと「体に悪い」「遠い」など別の大変さを想像しやすい。何が大変かは to のあと。',
      use: 'That would be hard to clean.（それは掃除が大変そう）' },

    // R fix: blind pass 70 % ("avoid cheese" a filler); now a topic-change reading and a keyword trap on cleaning
    // why: changing the subject ← a joke read as dodging; help with cleaning ← "Do you realize… clean" as a
    //   scolding frame about their own house
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'cleanjoke', reveals: ['clean'], seg: [53, 61.6],
      stem: 'What is Monica’s cleaning comment really doing?',
      choices: ['Telling him with a joke that she is staying', 'Changing the subject to end the soulmate talk',
                'Hinting that he should help more with cleaning'], a: 0,
      cue: 'このあと二人が何と言い合うか。',
      line: 'Do you realize how hard that would be to clean? — *I love you.*',
      said: '掃除が大変だから無理、と冗談を言い、彼は「愛してる」と返す。',
      mean: '冗談の形で「出ていかない、あなたといる」と伝えている。',
      trap: 'Do you realize… は叱る言い方にも使うが、ここはチーズの家の話で笑いの調子。次の返事が手がかり。',
      use: 'Do you realize how late it is?（もうこんな時間だよ）' },

    // R fix: blind pass 75 % (bored and doubtful were both off-mood); now a shy reading and the cold 知ってる frame
    // why: cold ← "I know" sounds dismissive in Japanese (知ってる); shy ← not saying "too" read as embarrassment
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'iknow', seg: [59, 62],
      stem: 'How does the reply “I know” to “I love you” sound?',
      choices: ['Playful, joking that she is sure of his love', 'Shy, too embarrassed to say it back',
                'Cold, refusing to say the words back'], a: 0,
      cue: '短い返事の声の調子と、そのあとの間。', line: 'I love you. — *I know.*',
      said: '「愛してる」「知ってる」。',
      mean: '「I love you too」の代わりの、自信たっぷりで甘えた返し。仲の良さが出る。',
      trap: '日本語の「知ってる」は冷たく聞こえやすい。英語でも調子しだいで、ここは笑顔の返事。',
      use: 'I know. I love you too.（知ってる。私も）' },

    // R fix: "something both already know" was a filler; replaced with the marker's other common job (a complaint)
    // why: complaint ← "You know what? I'm tired of…" is just as common; guess ← the question form taken literally
    { id: 'm1', skill: 'marker', level: 'B2', point: 'youknowwhat', seg: [61.6, 68.9],
      stem: 'What does “You know what?” signal here?',
      choices: ['A new idea or plan is coming', 'A complaint is about to come', 'The other one should guess something'],
      a: 0,
      cue: 'このあと何の話が始まるか。', line: '*You know what?* I’m going to take you out to dinner tonight.',
      said: '「そうだ、今夜ディナーに連れていくよ」と切り出す。',
      mean: 'You know what? は「ねえ、いいこと思いついた」。答えは求めていない。',
      trap: '文句の前置きにも使う形。疑問文だが返事は要らない。次の一文が提案か不満かで決める。',
      use: 'You know what? Let’s just go.（よし、もう行こう）' },

    // R fix: blind pass 85 %; "eat at the cheese house" was weak and the key's "every" was an absolute only the
    //   key and one distractor shared. Rebalanced
    // why: spicy ← "jalapeño" is the one food word with heat; Don's place ← "found this place" + the cheese theme
    { id: 'h3', skill: 'humor', level: 'C1', point: 'mozz', seg: [62, 73],
      stem: 'What is the joke in the dinner plan?',
      choices: ['Both dishes are cheese, the topic they just settled', 'Both dishes are too spicy for a nice dinner',
                'The place turns out to be Don’s cheese house'], a: 0,
      cue: 'greatest のあとの料理の名前。', line: 'the greatest *mozzarella sticks* and jalapeño poppers',
      said: '「最高のモッツァレラスティックとハラペーニョ・ポッパーの店を見つけた」。',
      mean: 'どちらもチーズ料理。仲直りした直後に、またチーズの話を持ち出してしまう。',
      trap: 'jalapeño（辛い唐辛子）に気を取られると辛さの話に見える。料理名の共通点を探す。',
      use: 'I found this great little place.（いい感じの店を見つけたよ）' },
  ]
};
