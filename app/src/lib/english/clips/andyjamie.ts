// REVIEW 2026-11-16: pass 6, fix 15, drop 0, new 0; ear checks 3
// REVIEW question: none open. The ear checks below stand as written (p1 now only needs "What about music?" as Jim's).
// “Andy is Dating a Highschooler  - The Office US” (the official The Office channel, BEST OF SEASON 3 - The Office US):
// on the drive to a school Andy keeps up the small talk (and sings when Jim asks for music), Jim endures it; at the
// school Andy's girlfriend turns out to be a student, and his defense ("nothing illegal, except…") makes it worse.
// Segments from the captions, words from whisper (2026-11-16). Only Andy and Jim are named in the stems; Jamie is
// "Andy's girlfriend".
// Untested on purpose: 0–6 s (captions "what's it… pay me that water", whisper "what's that… Amy that water"); 9–15 s
// (Karen needs backstory, and who says "she's only one of my oldest friends" isn't clear); 35–50 s (Andy sings a song);
// 88–100 s (Jim's guesses: whisper "wonder if she's like a guidance counselor… probably a tutor… should probably know",
// captions "she's like a guidance counselor… falling… she's probably now"); 116 s ("you were" / "you're"); 118.6 s
// (who says "This is weird"). Small splits that no key rests on: 30.8 s "do you have any music" (whisper) / "give me
// music" (captions), p1 rests on "What about music?" (its segment now ends before the song); 60.6 s "Lord" (whisper) / "Lauren" (captions), t1 and
// nt2 rest on "beer me strength"; 66.9 s "Did that" / "So that", p2 rests on "really need to be said"; 143.7 s "a
// mailbox" (captions "in", whisper "and"), h3 and nt1 rest on "knock over… mailbox with our friends".
// EAR CHECK: 28.4 s p1 h1 nt2 — "I bet. What about music?" and "I was thinking more like a CD" assumed Jim's from the
//   turn-taking (Andy answers "should've said so", sings, then offers his girlfriend's mix); the captions don't say
// EAR CHECK: 105.6 s x1 — "don't have a lot of" (both sources): "a lot of" runs together, the t of "lot" flapped
// EAR CHECK: 109.7 s s1 — "what are you" (both sources): said as one reduced stretch (≈ "whaddaya")
import type { Clip } from '../types.ts';

export const andyJamie: Clip = {
  id: 'andyjamie', video: '0y0ji1rPiCw', title: 'Andy is Dating a Highschooler  - The Office US', dur: 159, wpm: 122,
  band: 'slow', tags: ['職場', '恋愛'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: a third / half ← "quarter" is short and weak after "like a", so a rounder share is guessed; three quarters ←
    //   "quarter" is caught and a "three" is added
    { id: 'n1', skill: 'number', level: 'B1', point: 'quarter', seg: [5.9, 9.5], keep: true,
      stem: 'According to Andy, how often does “beer me” get a laugh?',
      choices: ['About a quarter of the time', 'About a third of the time', 'About half of the time',
                'About three quarters of the time'], a: 0,
      cue: '「gets a laugh like」のすぐあと。',
      line: 'I always say beer me. Gets a laugh like *a quarter of the time*.',
      said: 'カメラに「beer me っていつも言う。4回に1回はウケる」と話す。',
      mean: 'a quarter ＝ 4分の1。この like は「だいたい」。',
      trap: 'like a のあとの quarter は短く弱い。three がなければ4分の3ではない。',
      use: 'It takes like twenty minutes.（20分くらいかかるかな）' },

    // R fix: V2 (blind 60 %): the key was the only choice where he keeps going; now all three are about how he uses it
    // why: usually lands ← "a quarter" heard as "three quarters", or "like a" lost; saves it ← "always" missed, so he
    //   seems to pick his moments
    { id: 'i1', skill: 'infer', level: 'B2', point: 'quarter', seg: [5.9, 9.5],
      stem: 'What does Andy’s comment to the camera show about him?',
      choices: ['He keeps using a joke that mostly falls flat', 'He keeps using a joke because it usually lands',
                'He now saves the joke for when it will land'], a: 0,
      cue: 'always と、ウケる回数の組み合わせ。',
      line: 'I *always* say beer me. Gets a laugh like *a quarter of the time*.',
      said: '「いつも言っている」のに、ウケるのは4回に1回くらいだと自分で認める。',
      mean: '4回に3回はすべるのに、やめる気はない。それを平気で話すのが Andy らしさ。',
      trap: 'quarter を4分の3と取ると「よくウケる」、always を逃すと「使い分け」に。',
      use: 'It works about half the time.（半分くらいはうまくいく）' },

    // R fix: V2 (blind 65 %): the key was the only choice about how they talk; now all three are
    // why: Jim talks shop ← "let's do a really good job" is about the visit, but it's Andy's line, and empty; both enjoy
    //   it ← Andy sings and Jim borrows "beer me", which can look like playing along
    { id: 'g1', skill: 'gist', level: 'B2', point: 'ride', reveals: ['music'], seg: [8.5, 74.85],
      stem: 'What is the drive to the school mostly like?',
      choices: ['Andy keeps the talk going, and Jim gives as little as he can',
                'Jim tries to talk about the sales call, and Andy keeps drifting off',
                'Andy and Jim trade jokes, and both end up enjoying the ride'], a: 0,
      cue: '話題を出す人と、返事の長さを比べて。',
      said: 'Andy が部屋、天気と話題を出し、Jim は「まあね」「だろうね」と短く返す。',
      mean: '話したい Andy と、静かにしてほしい Jim の温度差が場面の中心。',
      trap: '「いい仕事をしよう」は仕事の話に見えて、中身のない一言。歌も掛け合いではない。',
      use: 'Sorry, I’m not much of a talker.（ごめん、あまりしゃべる方じゃなくて）' },

    // R fix: S4: seg was 36.9 s (song and CD line included); now 21.6–35.0, ending before the song. V2 (blind 55 %):
    //   "a chat about bands" was weak; now the opposite reading (keep the chat going) is a choice
    // why: hear Andy sing ← it's what Andy does next, so his reading looks like the request; keep the chat going ← in a
    //   Japanese frame, offering a new topic is a friendly move to keep talking
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'music', reveals: ['cd'], seg: [21.6, 35.0],
      stem: 'When Jim brings up music, what is he most likely after?',
      choices: ['A way to end the small talk', 'A chance to hear Andy sing', 'A new topic to keep the chat going'], a: 0,
      cue: '短い返事が続いたあと、話題を変える一言。',
      line: 'I bet. *What about music?*',
      said: '部屋や天気の話に短く返したあと、「音楽はどう？」と聞く。',
      mean: '音楽をかければ話さずに済む。「黙って」と言わずに会話を終わらせる方法。',
      trap: 'Andy が歌い出すので、それが頼みに見える。話題を変える一言は、何を終わらせたいかを聞く。',
      use: 'Mind if I put some music on?（音楽かけてもいい？）' },

    // why: colder than expected ← "really cold" is caught, "supposed to" missed; turn cold later ← "supposed to" heard as
    //   a forecast for later today
    { id: 'd3', skill: 'detail', level: 'B1', point: 'weather', seg: [21.6, 29.0],
      stem: 'What does Andy say about today’s weather?',
      choices: ['It was meant to be really cold', 'It is colder than he expected', 'It is supposed to turn cold later'],
      a: 0,
      cue: '「sunshine」のあと、today で始まる文。',
      line: 'Check out this sunshine… *Today was supposed to be really cold*.',
      said: '「今日はすごく寒いはずだったのに」と言う。',
      mean: 'was supposed to ＝「〜のはずだった」。予報が外れて晴れている。',
      trap: 'really cold だけだと「寒い」話に取りやすい。was supposed to は予想が外れたときの形。',
      use: 'The train was supposed to be here by now.（電車はもう来ているはずなのに）' },

    // R fix: V2 (blind 70 %): "the mix Andy's girlfriend made" was weak and gave d1 away; now a lyrics-mocking reading,
    //   and all three choices in one form
    // why: good enough to record ← "more like a CD" heard as praise of the singing; mocks the words ← Andy does garble
    //   the lyrics, so the laugh seems to be at them
    { id: 'h1', skill: 'humor', level: 'C1', point: 'cd', seg: [44.3, 53.8],
      stem: 'Why does Jim’s line about a CD get a laugh?',
      choices: ['He asked for recorded music, and got Andy singing', 'He hints that Andy sings well enough to record',
                'He mocks Andy for getting the song’s words wrong'], a: 0,
      cue: '歌が終わった直後の一言と、その前の歌。',
      line: 'I was thinking *more like a CD*.',
      said: 'Andy が自分で歌い出し、Jim は「CDみたいなのを考えてたんだけど」と言う。',
      mean: 'かける音楽のつもりが、生の歌が返ってきた。そのずれを静かに直す笑い。',
      trap: '「CDにできるほど上手い」とも聞こえる。more like 〜 は「むしろ〜」と直す形。',
      use: 'I was thinking more like pizza.（どっちかというとピザの気分だった）' },

    // why: phone someone ← "call" taken literally (電話); Jim's turn to sing ← "your" and the singing just before suggest
    //   a turn
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'yourcall', seg: [49.7, 59.5],
      stem: 'After Jim mentions a CD, what does Andy tell him?',
      choices: ['It’s up to Jim to decide', 'Jim should phone someone first', 'Now it’s Jim’s turn to sing'], a: 0,
      cue: '「Or a CD」のすぐあと、短い言い方。',
      line: 'Or a CD. *Your call*, dude.',
      said: '「CDでもいいよ。好きに決めて」と、あっさり相手に任せる。',
      mean: 'your call ＝「決めるのは君」。この call は「判断・決定」の意味。',
      trap: 'call を「電話」と取ると別の話になる。審判の判定も call と言う。',
      use: 'Thai or Italian? Your call.（タイ料理かイタリアンか、任せるよ）' },

    // R fix: V2 (blind 60 %): "a real wish to hear the girlfriend's mix" was weak (Jim can't know of it yet); now a
    //   plain-preference reading
    // why: plain request ← taken at face value he does just prefer a CD; friendly tease ← he borrows Andy's phrase,
    //   which can sound like joining the fun
    // anchor: 50.0–51.9 s "I was thinking more like a CD" turns the singing down; 60.5–62.4 s to camera "Lord, beer me
    //   strength": he is enduring Andy, not enjoying him
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'cd', reveals: ['strength'], seg: [49.7, 63.4],
      stem: 'After Jim’s comment to the camera, how should we hear his line about a CD?',
      choices: ['As a polite way to make the singing stop', 'As a plain request, with no complaint in it',
                'As a friendly tease he is enjoying with Andy'], a: 0,
      cue: 'CDの一言と、カメラへの一言を並べて。',
      line: 'I was thinking *more like a CD*. … Lord, *beer me strength*.',
      said: '歌う Andy に「CDみたいなのを」と言い、カメラに「神様、力を」とこぼす。',
      mean: 'カメラへの本音が、CDの一言を書きかえる。好みの話でなく、歌をやめてという遠回しの頼み。',
      trap: '言葉だけなら CD の好みを言っただけにも聞こえる。この形式では、カメラへの一言が本音の答え合わせ。',
      use: 'Maybe we could just put the radio on?（ラジオでもかけようか）' },

    // R fix: V2 (blind 70 %): the key was the only choice with the girlfriend; now all three have her
    // why: made it for her ← "my girlfriend made" heard with the roles swapped; bought it ← a CD is usually bought, and
    //   "made" is short
    { id: 'd1', skill: 'detail', level: 'B1', point: 'mix', seg: [53.6, 59.5],
      stem: 'Where does the CD Andy offers come from?',
      choices: ['His girlfriend made it for him', 'He made it for his girlfriend', 'His girlfriend bought it for him'], a: 0,
      cue: '「Your call」のあと、誰が作ったか。',
      line: '*My girlfriend made* an awesome mix.',
      said: '「彼女がすごくいいミックスを作ってくれたんだ」と言う。',
      mean: 'mix ＝ 好きな曲を集めて作ったCD。恋人が作ってくれる、よくある贈り物。',
      trap: 'made と girlfriend だけだと、作り手と相手が入れ替わる。主語は文頭の girlfriend。',
      use: 'My sister made this playlist.（妹が作ったプレイリストなんだ）' },

    // R fix: V2 (blind 65 %): "grab a beer" was a filler; now "put it in and play it", which the music talk invites
    // why: buy ← "beer me" sounds close to "buy me"; play it ← they've been talking about music, so the disc seems to be
    //   for playing
    { id: 'f2', skill: 'phrase', level: 'B1', point: 'beerme', seg: [53.6, 59.5],
      stem: 'Right after mentioning the mix, what does Andy ask Jim to do?',
      choices: ['Pass the disc over to him', 'Buy him a copy of the disc', 'Put the disc in and play it'], a: 0,
      cue: '「mix」のすぐあと、短い頼みの文。',
      line: '*Beer me* that disc.',
      said: '「そのディスク取って」と頼んでいる。',
      mean: 'beer me は Andy の口ぐせで「〜取って」。give me を beer に変えた冗談。',
      trap: '音楽の流れで「かけて」と取りやすい。beer me ＝ give me なので、頼みは「渡して」まで。',
      use: 'Could you pass me the salt?（塩、取ってくれる？）' },

    // R fix: V2 (blind 70 %): "thirsty" was a filler; now a nervous prayer about the visit, which shares "praying"
    // why: nervous about the visit ← "Lord" heard as a real prayer before the sales call; warming to the joke ← he uses
    //   Andy's phrase, which looks like joining in
    { id: 't1', skill: 'attitude', level: 'B2', point: 'strength', seg: [59.6, 63.4],
      stem: 'In Jim’s comment to the camera, how does he feel about the ride?',
      choices: ['Worn out, and praying for patience', 'Nervous, and praying the visit goes well',
                'Amused, and warming to the joke'], a: 0,
      cue: '最初の呼びかけと、最後の一語。',
      line: 'Lord, *beer me strength*.',
      said: 'カメラに向かって、Andy の口ぐせを借りて「神様、力をください」と祈る。',
      mean: '「この人に耐える力を」の意味。相手の言葉を借りて、うんざりした気持ちを出す。',
      trap: '同じ口ぐせなので楽しんでいるように見える。誰の言葉を何のために借りたかを聞く。',
      use: 'Give me strength.（もう勘弁して）' },

    // R fix: V2 (blind 65 %): "save it for the client" was weak; now a timing reading
    // why: too early ← "when we get in there" points to later, so the line seems premature; unsure Andy meant it ←
    //   "really" heard as doubting his sincerity
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'needsaid', seg: [63.4, 74.85],
      stem: 'What does Jim mean by his question after Andy’s “let’s do a really good job”?',
      choices: ['That it was too obvious to need saying', 'That it was too early to start planning',
                'That he isn’t sure Andy really means it'], a: 0,
      cue: 'Andy の一言への短い質問。答えを求めているか。',
      line: 'Did that *really need to be said*?',
      said: '「いい仕事をしよう」と言われ、「それ、言う必要あった？」と返す。',
      mean: '答えを求める質問ではなく、「言わなくても分かる」という軽い突っこみ。',
      trap: '疑問文なので本当に聞いていると取りやすい。need to be said と聞くのは、たいてい皮肉。',
      use: 'Did you really have to say that?（それ、言う必要あった？）' },

    // R fix: V2 (blind 55 %): the key was the only self-aware choice; now all three are what Andy does with his answer
    // why: wants to sing again ← "music" calls back to his singing; mocks Jim ← "Well, not everything…" heard as a
    //   counterattack on the quiet one
    { id: 'h2', skill: 'humor', level: 'C1', point: 'musicconv', reveals: ['needsaid'], seg: [66.4, 74.85],
      stem: 'Why is Andy’s answer to Jim’s question funny?',
      choices: ['He defends talking for no reason as an art', 'He hints that he wants to sing again',
                'He mocks Jim for barely talking all ride'], a: 0,
      cue: '「Well」で始まる答えの、後半のたとえ。',
      line: 'Well, *not everything a guy says needs to be said*. Sometimes it’s just about *the music of a conversation*.',
      said: '「言うこと全部に意味はいらない。会話は響きが大事」と答える。',
      mean: '中身のないことを言っていると、堂々と認めている。言い訳がそのまま白状になる笑い。',
      trap: 'music で歌の話に戻ると取りやすい。ここは会話の「響き・ノリ」のたとえ。',
      use: 'I’m just making conversation.（ただの世間話だよ）' },

    // why: can't spot her ← why/where sound alike at speed, and "which one is she?" comes soon after; hopes she'll come
    //   ← "girlfriend" heard as good news, as if he wanted her there
    { id: 't2', skill: 'attitude', level: 'B1', point: 'here', seg: [74.2, 78.9],
      stem: 'As they arrive, what does Andy’s question about his girlfriend show?',
      choices: ['He didn’t expect to see her there', 'He can’t pick her out in the crowd', 'He hopes she will come over to him'],
      a: 0,
      cue: '「Whoa」のあと、最初の質問の一語目。',
      line: 'Whoa. What the… *Why is my girlfriend here?*',
      said: '「うわ、なんだ…なんで俺の彼女がここに？」と声を上げる。',
      mean: 'Why is 〜 here? は、いるはずのない人を見つけたときの驚き。',
      trap: 'why は where と聞き違えやすい。「どこ？」でなく「なぜ？」なら、もう見つけている。',
      use: 'Wait, why are you here?（あれ、なんでここにいるの？）' },

    // R fix: V2 (blind 50 %): the key was the only specific, part-time job; now all three are part-time
    // why: teaches here ← Jim's guess "the teacher in the white" comes first; tutors ← one of Jim's later guesses
    { id: 'd2', skill: 'detail', level: 'B1', point: 'job', seg: [78.5, 84.9],
      stem: 'What does Andy say his girlfriend does for work?',
      choices: ['She makes frozen yogurt part-time', 'She teaches part-time at this school', 'She tutors part-time after school'],
      a: 0,
      cue: 'Jim の質問に No と答えたあと。',
      line: 'No, she’s a *part-time frozen yogurt chef*.',
      said: '「先生？」と聞かれて「違う、パートでフローズンヨーグルトを作ってる」と答える。',
      mean: 'chef と立派に言うが、ヨーグルト店のアルバイト。学校の先生ではない。',
      trap: 'teacher が先に聞こえるので引かれやすい。No のあとが本当の答え。',
      use: 'I work part-time at a café.（カフェでアルバイトしてます）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'time', seg: [104.0, 106.7],
      stem: 'Type the words: “We ___ time…” (5 words)', answer: "don't have a lot of",
      cue: '「you know what」のあと、time の前。',
      line: 'you know what, we *don’t have a lot of* time',
      said: '「そうだ、あまり時間がないから」と言う。',
      mean: 'a lot of が「アラーラ」とつながる。t は弾み、of は「ア」程度に弱い。',
      trap: 'have a が���ハヴァ」とつながり、a を落としやすい。don’t の t も消えやすい。',
      use: 'I don’t have a lot of cash on me.（今あまり現金を持ってなくて）' },

    // R fix: V2 (blind 50 %): the set phrase stood out among three; a fourth choice makes a 2 × 2 grid (are/were ×
    //   you/they), so no odd one out
    // why: were ← "are" shrinks to a weak vowel that can pass for "were"; they ← the weak "you" ("ya") heard as "they";
    //   were they ← both slips at once
    { id: 's1', skill: 'sound', level: 'B2', point: 'doinghere', seg: [107.9, 112.0],
      stem: 'Fill the gap: “Oh, ___ doing here?”',
      choices: ['what are you', 'what were you', 'what are they', 'what were they'], a: 0,
      cue: 'Oh のすぐあと、doing の前の3語。',
      line: 'Oh, *what are you* doing here?',
      said: '「えっ、ここで何してるの？」と驚いて聞く。',
      mean: 'what are you が「ワダヤ」のようにつながる。t は弾み、are と you は弱くなる。',
      trap: 'are が弱く、were にも聞こえる。目の前にいる相手には現在形で聞く、と考えて選ぶ。',
      use: 'What are you up to this weekend?（週末なにしてるの？）' },

    // R fix: V2 (blind 65 %): the key was the only choice with the panic; now a calm "mix-up" reading, which "I had no
    //   idea" invites
    // why: calm mix-up ← "I had no idea" taken as a calm explanation, the "oh my god"s missed; blames her ← "You never
    //   told me…" heard as blame
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', seg: [112.0, 146.5],
      stem: 'Once the truth comes out, how does Andy handle it?',
      choices: ['He panics and insists nothing wrong went on', 'He calmly explains it was all a mix-up',
                'He gets angry at her for keeping it a secret'], a: 0,
      cue: '彼女が去ったあと、Andy がくり返す言葉。',
      line: 'Oh my god, oh my god. *I had no idea.*',
      said: '彼女が高校生だと分かり��「なんてこった」「全然知らなかった」と言う。',
      mean: '彼女を責めるより、自分は悪くないと必死に言い訳している。',
      trap: 'I had no idea は冷静な説明に、You never told me は非難に聞こえる。慌てた声を聞く。',
      use: 'I swear, I had no idea.（本当に、全然知らなかったんだ）' },

    // R fix: V2 (blind 60 %): "find a lawyer" was the only other legal choice and pointed to the key; now a "Well…"
    //   heard as sympathy
    // why: delay the visit ← "hold up" = 遅らせる (held up in traffic); he didn't know either ← "Well…" read as a
    //   sympathetic reply in a Japanese frame
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'court', reveals: ['outcome'], seg: [129.0, 140.4],
      stem: 'What does Jim mean by his reply to “I had no idea”?',
      choices: ['That the excuse wouldn’t save him before a judge', 'That he didn’t know she was in school either',
                'That the mess will hold up their sales visit'], a: 0,
      cue: 'Well で始まる、短い返し。',
      line: 'Well, that’s *not gonna hold up in court*.',
      said: '「知らなかった」と言う Andy に「法廷では通用しないぞ」と返す。',
      mean: 'hold up in court ＝ 裁判で認められる。言い訳にならない、という冗談。',
      trap: 'hold up には「遅らせる」の意味もある。in court が付けば「通用する」。',
      use: 'That excuse won’t fly with my boss.（その言い訳は上司には通じない）' },

    // R fix: V2 (blind 55 %): the key was the only two-part choice; now all three open "He clears himself"
    // why: blames their friends ← "with our friends" is the last thing heard; friends always there ← "with our friends"
    //   heard as true of every date
    { id: 'h3', skill: 'humor', level: 'C1', point: 'mailbox', seg: [135.9, 146.5],
      stem: 'Why does Andy’s answer to Jim get a laugh?',
      choices: ['He clears himself, then admits to a teenage prank', 'He clears himself, then blames their friends instead',
                'He clears himself by saying friends were always there'], a: 0,
      cue: '「illegal」のあと、付け足す部分。',
      line: 'We didn’t do anything illegal, *except knock over a mailbox with our friends*.',
      said: '「違法なことはしてない。友だちと郵便受けを倒したくらい」と言う。',
      mean: '潔白を言うつもりが、軽い犯罪を白状している。しかも十代の遊びそのもの。',
      trap: '最後の friends で人のせいにしたと取りやすい。except のあとは例外の付け足し。',
      use: 'I’m always on time, except on Mondays.（月曜以外はいつも時間通り）' },

    // why: always with her friends ← "with our friends" heard as true of every date (scope); stayed inside the law ←
    //   "didn't do anything illegal" taken at face value, the "except" missed
    // anchor: 140.4–145.0 s "except knock over a mailbox with our friends": the one "crime" he confesses is a group
    //   prank, the kind of night out a teenager has
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'mailbox', seg: [139.9, 146.5],
      stem: 'Taken at his word, what does Andy’s defense tell Jim about the dates?',
      choices: ['They were the sort of thing teenagers do', 'They always took place with her friends around',
                'They were careful never to break the law'], a: 0,
      cue: '弁解の中身が、どんなデートだったかを語る。',
      line: 'We didn’t do anything illegal, except *knock over a mailbox with our friends*.',
      said: '「違法なことはしてない。友だちと郵便受けを倒した以外は」と言う。',
      mean: '郵便受けを倒すのはよくある十代のいたずら。弁解のつもりが、デートも高校生並みだったと明かす。',
      trap: 'illegal の否定だけで「法を守った」と取りやすい。弁解は、何を明かすかを聞く。',
      use: 'Well, that says a lot.（それで全部分かるね）' },
  ]
};
