// “Joey Lands a Huge Broadway Audition | Friends” (the official Friends channel, Best of Season 9): the friends tell
// Joey his agent got him an audition with Leonard Hayes and praise the star on flimsy grounds; later Joey explains why
// he is drinking everything before his callback, and learns what the “eggnog” in the fridge was.
// Segments from the captions, words from whisper (2026-11-16). Untested: 36.5–39 s (the line before “He has”: missing
// from the captions), 53–64 s (greetings, no talk), 84 s on (whisper loops one line). Named in the audio: Joey (80.6 s),
// Leonard Hayes; the friends who praise him are “a friend”.
// REVIEW 2026-11-16: pass 5, fix 16, drop 0, new 0; ear checks 0 (s2's and s1's removed: both sources agree word
//   for word)
//   open: f3/nt2 quote “probably wondering” (captions); whisper has “You probably wonder”. No key depends on it.
import type { Clip } from '../types.ts';

export const joeyBroadwayAudition: Clip = {
  id: 'joeyaudition', video: 'ImhDYdqi5a0', title: 'Joey Lands a Huge Broadway Audition', dur: 96, wpm: 161,
  band: 'slow', tags: ['友だち', '家'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %, right): “thin grounds” was the only evaluative choice and “doubt… argue” a filler; all
    //   three now praise or judge the star, and the key names what the praise rests on
    // why: stage career ← it's a Broadway play, so stage praise is expected; argue ← “You saw that? No, but…” heard as
    //   one friend disagreeing
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene1', reveals: ['macbeth', 'ads'], seg: [0.2, 52.3],
      stem: 'How does the conversation develop in the first scene?',
      choices: ['The friends celebrate his news, then praise the star’s trailers and ads',
                'The friends celebrate his news, then praise the star’s long stage career',
                'The friends celebrate his news, then argue over whether the star is any good'], a: 0,
      cue: '前半のお祝いと、後半の主演俳優の話の両方。',
      said: 'オーディションの知らせを喜んだあと、主演俳優をほめ合う。ただし根拠は予告編やCMばかり。',
      mean: '「すごい俳優だ」と盛り上がるほど、中身のなさが目立つ流れ。',
      trap: 'ブロードウェイの話なので舞台の経歴をほめると思いやすい。挙がる例を一つずつ聞く。',
      use: 'That’s great news! Congrats!（いい知らせだね！おめでとう）' },

    // why: under a deli ← “deli” is said, but for last time's theater; same as last time ← “like last time” read as
    //   “the same as last time”
    { id: 'd1', skill: 'detail', level: 'B2', point: 'theater', seg: [13.6, 19.8],
      stem: 'What is said about the theater this time?',
      choices: ['A real one, unlike the little one last time', 'A little one, right under a deli',
                'The same one as last time, but bigger'], a: 0,
      cue: '「Broadway」のあと、前回との比べ方。',
      line: 'in a *real theater*, not that little one underneath the deli *like last time*.',
      said: 'ブロードウェイの本物の劇場。前回のデリの地下の小さな所とは違う。',
      mean: 'not ～ like last time ＝「前回みたいな～じゃなく」。今回は格が上。',
      trap: 'like last time を「前回と同じ」と取ると逆になる。not のかかり方を聞く。',
      use: 'Not a motel like last time, please.（前みたいなモーテルはやめてね）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'theater', seg: [16.5, 19.8],
      stem: 'Type what is said: “not ___ underneath the deli” (3 words)', answer: 'that little one',
      cue: '「real theater」のすぐあと、3語のかたまり。',
      line: 'not *that little one* underneath the deli',
      said: '「デリの地下の、あの小さい所じゃなく」と言っている。',
      mean: 'little の t は母音にはさまれて弾み、「リロ」に近い。one は軽く続く。',
      trap: 'that が弱く「ダ」程度になり、落としやすい。3語と分かれば、最初の短い音を探す。',
      use: 'Not that little café, the big one.（あの小さいカフェじゃなくて、大きい方）' },

    // R fix: V2 (blind 65 %, right) and K6: the key sat where the two features met (“can't follow” ×2, “good” ×2);
    //   all three are now “…must be good” with a different reason, each from words near the moment
    // why: Broadway ← said just before the question; star directs ← “and directing” comes right after
    { id: 'i1', skill: 'infer', level: 'C1', point: 'goodplay', seg: [20.0, 24.4],
      stem: 'From his answer, how does Joey judge whether a play is good?',
      choices: ['If he can’t follow it, it must be good', 'If it’s on Broadway, it must be good',
                'If its star directs it, it must be good'], a: 0,
      cue: '「Well」のあと、「because」に続く理由。',
      line: 'Well, it must be, because I read it and I *didn’t understand a single word*.',
      said: 'いい芝居かと聞かれ、「きっとそう。読んでも一語も分からなかったから」と答える。',
      mean: '分からない＝高級でいい芝居、という逆立ちした理屈。',
      trap: 'Broadway や主演・演出の話が前後にあるので、それが理由に見えやすい。理由は because のあとだけ。',
      use: 'It must be good. It’s so expensive.（きっといいんだよ、こんなに高いし）' },

    // R fix: V2 (blind 70 %, right): the writer and the friend were easy to rule out; now a near miss on the same
    //   target (Joey meaning it as a dig at the play)
    // why: a dig ← “didn't understand a single word” heard as a complaint about the script; the friend ← “Well,” read
    //   as a put-down of an obvious question
    // anchor: 21.4–23.84 s “it must be, because I read it and I didn't understand a single word”: “must be” is praise,
    //   and the subject is “I”, so the failure he confesses is his own, not the play's
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'goodplay', seg: [20.0, 24.4],
      stem: 'In Joey’s answer about whether the play is good, who is the joke on?',
      choices: ['Joey, who means it as praise of the play', 'Joey, who means it as a dig at the play',
                'The friend, whom Joey means to tease'], a: 0,
      cue: '理由の文の主語と、「must be」の向き。',
      line: 'Well, it *must be*, because *I* read it and *I didn’t understand* a single word.',
      said: '「いい芝居？」に「きっとね。だって読んでも一語も分からなかったから」と答える。',
      mean: '本人は芝居をほめているつもり。でも理由は自分の理解力のなさで、笑われているのは本人。',
      trap: '「分からない」を台本への不満と聞きやすい。must be はほめる側の言葉。主語の I を追えば、ずっと自分の話。',
      use: 'So fancy I can’t even say it.（高級すぎて名前も言えない）' },

    // why: did ← the n't is weak and its t drops; couldn't ← same meaning, only the first sound differs; don't ← the
    //   past ending is easy to miss in fast speech
    { id: 's2', skill: 'sound', level: 'B2', point: 'goodplay', seg: [21.0, 24.4],
      stem: 'Fill the gap: “I read it and I ___ understand a single word.”',
      choices: ['did', 'didn’t', 'couldn’t', 'don’t'], a: 1,
      cue: '「and I」のすぐあと、とても短い一語。',
      line: 'I read it and I *didn’t* understand a single word.',
      said: '「読んだけど、一語も分からなかった」。',
      mean: 'didn’t の t はほぼ消え、「ディドゥン」のように短い。',
      trap: 'n’t が弱いと did に聞こえやすい。a single word（一語も）は否定と組むのが普通。',
      use: 'I didn’t get a single word.（一言も分からなかった）' },

    // why: writing ← “I read it” just before (the script) suggests who wrote it; producing ← the big-star-runs-the-show
    //   script
    { id: 'd2', skill: 'detail', level: 'B1', point: 'directing', seg: [25.3, 28.6],
      stem: 'Besides starring in the play, what else is Leonard Hayes doing?',
      choices: ['Directing it', 'Writing it', 'Producing it'], a: 0,
      cue: '「starring in it」への返事、最後の一語。',
      line: 'And Leonard Hayes is starring in it. — And *directing*.',
      said: '主演するだけでなく、演出もする、と付け足している。',
      mean: 'directing ＝ 舞台の演出をすること。主演と演出の両方を一人がやる。',
      trap: '直前に「台本を読んだ」話があるので、書いた人と思いやすい。付け足しの and のあとを聞く。',
      use: 'She wrote it, and she’s directing it.（脚本も演出も彼女）' },

    // R fix: V2 (blind 75 %, right) and K5: two choices described the film, not the friend; all three now say what
    //   the friend has seen
    // why: double bill ← “played it right before Jackass”, but “it” is the previews; didn't like it ← “No, but…” read
    //   as a reservation about the film
    { id: 'i2', skill: 'infer', level: 'C1', point: 'macbeth', seg: [28.3, 36.9],
      stem: 'When asked “You saw that?”, what does the answer show?',
      choices: ['The friend only knows the film from its trailer', 'The friend saw it on a double bill with Jackass',
                'The friend saw the film but didn’t like it'], a: 0,
      cue: '「No, but」のあと、何を見たのか。',
      line: 'You saw that? — No, but I saw the *previews*. They played it right before Jackass.',
      said: '「マクベスの彼は良かった」とほめたが、見たのは別の映画の前に流れた予告編だけ。',
      mean: 'ほめ言葉の根拠が予告編だけ。本編は見ていない。',
      trap: 'right before Jackass を本編の話と取りやすいが、it は予告編。最初の No が答え。',
      use: 'Haven’t seen it, but I saw the trailer.（観てないけど、予告は観た）' },

    // R fix: S1/V2 (blind 70 %, right): the stem's monkey and rubber phone gave away the ad; the stem now names
    //   the moment without the content, and Joey's worry (after the laugh) became a never-saw-his-films reading
    // why: mixed up ← praise of a film actor followed by an ad sounds like confusion; never seen ← the Macbeth
    //   previews joke a moment earlier
    { id: 'h1', skill: 'humor', level: 'C1', point: 'ads', seg: [38.3, 48.4],
      stem: 'Why does the audience laugh as the friends finish praising Leonard Hayes?',
      choices: ['The best example of his work is an ad', 'A friend mixes him up with a different actor',
                'A friend admits never seeing his films'], a: 0,
      cue: 'ほめ言葉のあと、例として挙がるもの。',
      line: 'he’s done some *amazing work*. … I loved him in those *cell phone commercials*.',
      said: '「すばらしい仕事をしてきた」と言ったあと、例に挙がるのは猿に顔をたたかれる携帯のCM。',
      mean: '名作を期待させて、出てくるのがドタバタのCM。期待と中身の落差が笑い。',
      trap: '直前の「予告編しか見ていない」話の続きに聞こえやすい。笑いは直前の例に付く。',
      use: 'Her best work? Probably that cereal ad.（代表作？たぶんあのシリアルのCM）' },

    // R fix: K1 (“he was so good in that movie of Macbeth” is praise too, so “say they loved” let Macbeth be defended)
    //   and V2 (blind 50 %, right): the stem now points at “I loved him in…”, and the monkey comedy became TV comedies
    // why: Macbeth ← the film was praised a moment earlier; TV comedies ← the slapstick monkey suggests a sitcom
    { id: 'd3', skill: 'detail', level: 'B1', point: 'ads', seg: [41.0, 47.2],
      stem: 'Right after “I loved him in…”, which of his work is named?',
      choices: ['His cell phone commercials', 'His film of Macbeth', 'His early TV comedies'], a: 0,
      cue: '「I loved him in」のあと。',
      line: 'I loved him in those *cell phone commercials*.',
      said: '「あの携帯電話のCMの彼が大好き」と言い、もう一人が猿に顔をたたかれる場面を足す。',
      mean: '名優の仕事の例として出てくるのが、CMという落差。',
      trap: '猿のドタバタでコメディ番組に聞こえやすいが、猿はCMの中の話。直前の commercials を聞く。',
      use: 'I loved her in that coffee ad.（あのコーヒーのCMの彼女、好きだった）' },

    // R fix: V2 (blind 55 %, right): “angry” was a filler; now two calm-down readings that “more… than I already am”
    //   refutes
    // why: laugh off ← a joke is usually meant to cheer him up; want the part more ← the monkey line heard as a pep talk
    { id: 't2', skill: 'attitude', level: 'B2', point: 'nervous', seg: [47.8, 52.3],
      stem: 'How does Joey take the joke about the monkey at the audition?',
      choices: ['It adds to the nerves he already has', 'It helps him laugh off his nerves',
                'It makes him want the part even more'],
      a: 0,
      cue: '返事の後半、今の自分と比べる言い方。',
      line: 'Don’t make me *more nervous than I already am*.',
      said: '「今でも緊張してるのに、これ以上緊張させないで」と返す。',
      mean: 'already am で、もともと不安だったと分かる。冗談が不安を大きくした。',
      trap: '冗談は緊張をほぐすもの、という型で聞きやすい。more と already am の比べ方を聞く。',
      use: 'Don’t make this harder than it is.（これ以上つらくさせないで）' },

    // R fix: V2 (blind 65 %, right) and K6: the key was the only choice without the clip's “right”; all three carry it
    //   now, and the approval reading got a teasing “for once” so the key isn't the only tease
    // why: right amount ← “about right” read as a quantity (about = だいたい); right thing ← “right” read as 正しい,
    //   approval
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'aboutright', seg: [64.0, 68.9],
      stem: 'When Joey says they’re probably wondering, what does the reply mean?',
      choices: ['That’s right in character for you', 'That’s the right amount to drink',
                'That’s the right thing to do, for once'], a: 0,
      cue: '「No」のあと、right で終わる短い返事。',
      line: 'You’re probably wondering what I’m doing. — No, *that seems about right*.',
      said: '「何してるか気になるでしょ」に「いや、いつも通り」と返す。',
      mean: 'seems about right ＝ 予想どおり。驚かない、という軽いからかい。',
      trap: 'about right を量の「ちょうどいい」や「正しい」と取りやすい。No のあとは驚かない理由。',
      use: 'Two hours late? Sounds about right.（2時間遅刻？まあ、らしいね）' },

    // R fix: V2 (blind 70 %, right): the key was the only nuanced, longer choice; all three are now short stances of
    //   equal length
    // why: too polite ← the Japanese 遠慮 frame: not asking reads as tact; already know ← “No” (not wondering) read as
    //   “we already know why”
    // anchor: 64.56–68.36 s “You're probably wondering what I'm doing.” “No, that seems about right.”: the “No” answers
    //   “wondering” (they aren't puzzled), and “seems about right” says it fits what they expect of him, not that they
    //   were told
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'aboutright', seg: [64.0, 68.9],
      stem: 'What does the reply to Joey’s “probably wondering” show about how they see him?',
      choices: ['They’re used to odd behavior from him', 'They already know why he’s doing this',
                'They’re too polite to ask him about it'], a: 0,
      cue: '「wondering」への No と、そのあとの理由の言い方。',
      line: 'You’re probably wondering what I’m doing. — *No*, that *seems about right*.',
      said: '「僕が何してるか気になるでしょ」に「いや、それで合ってる感じ」と返す。',
      mean: '「らしい」と受け流すのは、変わった行動に慣れきっている印。親しい仲だからこその、からかい。',
      trap: '聞かないのを遠慮と取ると、気づかいの話に見える。No は「知っている」ではなく「驚かない」。理由の言い方が決め手。',
      use: 'Late again? That’s so you.（また遅刻？あなたらしいね）' },

    // R fix: V2 (blind 70 %, right): the toast and sick readings were easy to rule out; now a got-the-part near miss
    //   and an apology reading. C5: the key's “learns what he drank” points at the formula, so it reveals `formula`
    // why: got the part ← “callback” heard as 合格; apologizes ← drinking a housemate's eggnog calls for a sorry in the
    //   Japanese frame
    { id: 'g2', skill: 'gist', level: 'B2', point: 'scene2', reveals: ['pee', 'formula'], seg: [64.0, 84.7],
      stem: 'What is the second scene mostly about?',
      choices: ['Joey explains an odd plan, then learns what he drank',
                'Joey explains an odd plan, then learns he got the part',
                'Joey explains his callback, then says sorry for the eggnog'], a: 0,
      cue: '前半の理由の説明と、最後の冷蔵庫の話。',
      said: 'トイレを我慢すると演技が良くなるので飲みまくっている、と話し、最後に飲んだ物の正体を知る。',
      mean: '変な作戦の説明が、思わぬオチにつながる流れ。',
      trap: 'callback を「合格」と取ると、役が決まった話に見える。最後に分かるのは飲んだ物の正体。',
      use: 'Long story, but there’s a reason.（話せば長いけど、理由があるの）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'hadto', seg: [69.3, 72.6],
      stem: 'Type what Joey says: “I really ___ pee.” (2 words)', answer: 'had to',
      cue: '「audition,」のあと、really に続く2語。',
      line: 'yesterday at my audition, I really *had to* pee',
      said: '「昨日のオーディションで、すごくトイレに行きたかった」。',
      mean: 'd と t がつながり「ハットゥ」に近い。',
      trap: 'd と t が重なって一つの音になり、have to に聞こえやすい。yesterday があるので過去形。',
      use: 'I really had to run for the bus.（バスまで走らなきゃいけなかった）' },

    // R fix: V2 (blind 75 %, right): the key was the only quirky choice; the dry-throat reading is now an equally odd
    //   theory about his last audition
    // why: dry mouth ← actors and drinks, a common script, tied to “yesterday at my audition”; celebrating ← “I got a
    //   callback, so I'm drinking” heard as a toast
    { id: 'd4', skill: 'detail', level: 'B2', point: 'pee', reveals: ['callback'], seg: [69.3, 76.6],
      stem: 'Why is Joey drinking everything?',
      choices: ['He thinks needing the bathroom helped him act', 'He thinks a dry mouth hurt his acting last time',
                'He got a callback and is celebrating it'], a: 0,
      cue: '「apparently」のあとと、「so」の前。',
      line: 'having to pee *makes me a really good actor*. I got a callback, so I’m drinking everything.',
      said: 'トイレを我慢したら演技が良かったらしく、二次審査に呼ばれた。だから何でも飲む。',
      mean: 'so の前が理由。同じ状態で演技するために、わざと飲んでいる。',
      trap: 'callback と drinking が並ぶと乾杯に聞こえる。so の前の文から理由を取る。',
      use: 'I got the job, so I’m buying dinner.（仕事が決まったから、夕食おごるよ）' },

    // R fix: S2/§9.2 and V2 (blind 85 %, right): the stem quoted “callback”, the word under test, and “got his old
    //   part back” was a filler; the stem now asks for his news, and “given the part” is the near miss
    // why: agent's call ← call back read as 折り返しの電話 (the agent called in the first scene); given the part ←
    //   a callback heard as the audition's happy ending
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'callback', seg: [72.0, 76.6],
      stem: 'What news does Joey give about his audition?',
      choices: ['He was asked back for a second audition', 'He got a phone call back from his agent',
                'He was given the part after the audition'], a: 0,
      cue: '「good actor」のすぐあと。オーディションの流れで。',
      line: 'I got a *callback*, so I’m drinking everything.',
      said: 'オーディションの結果、「もう一度来て」と呼ばれた。',
      mean: 'callback ＝ 二次審査への呼び出し。役が決まる一歩手前。',
      trap: 'call back は「折り返し電話」でもよく使う。合格でもなく、もう一度呼ばれた段階。',
      use: 'I got a callback for the job!（その仕事、二次面接に呼ばれた！）' },

    // R fix: V2 (blind 50 %, right): “take back” was weak; now a complaint opener (“hey!” as a protest)
    // why: greet ← “Oh, hey” is a greeting elsewhere; complaint ← “hey” as a protest, and a shared fridge is a usual
    //   complaint topic
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'byway', reveals: ['eggnog'], seg: [75.3, 80.1],
      stem: 'As Joey moves from the callback to the fridge, what do his first words do?',
      choices: ['Bring up a new topic in passing', 'Greet someone who just walked in', 'Warn that a complaint is coming'],
      a: 0,
      cue: '冷蔵庫の話に入る直前の、短い前置き。',
      line: '*Oh, hey, by the way*, that eggnog in our fridge was great.',
      said: '「あ、そうそう、ところで」と、冷蔵庫のエッグノッグの話を始める。',
      mean: 'Oh, hey が付くと「今思い出した」という軽い話題転換。',
      trap: 'hey は「やあ」のあいさつにもなるので、誰か来たように聞こえる。by the way は話題を変える合図。',
      use: 'Oh, by the way, I found your keys.（あ、そういえば、鍵あったよ）' },

    // R fix: V2 (blind 50 %, right): “honestly… a lot” made the key the only emphatic one; three plain judgments now
    // why: tasted off ← eggnog and a fridge suggest old milk; felt bad ← drinking a shared item calls for an apology in
    //   the Japanese frame
    { id: 't3', skill: 'attitude', level: 'B1', point: 'eggnog', seg: [76.3, 80.1],
      stem: 'How does Joey feel about what he drank from the fridge?',
      choices: ['He thought it was really good', 'He thought it tasted a bit off', 'He felt bad for finishing it'],
      a: 0,
      cue: '「fridge」のあと、文の最後の評価。',
      line: 'that eggnog in our fridge *was great*.',
      said: '「冷蔵庫のエッグノッグ、おいしかったよ」と言っている。',
      mean: 'was great ＝ すごくおいしかった。謝るのではなく、ほめている。',
      trap: '共有の物を飲んだら謝るのが日本語の型なので、おわびに聞こえやすい。文末の評価の語を聞く。',
      use: 'That soup you made was great.（あのスープ、おいしかった）' },

    // R fix: V2 (blind 60 %, right): only the key had “happily”; the three choices now share one frame and differ only
    //   in what the drink really was
    // why: medicine ← formula = 調合・処方 (literal reading); gone bad ← eggnog and a fridge, the expected “bad milk”
    //   joke
    { id: 'h2', skill: 'humor', level: 'C1', point: 'formula', reveals: ['eggnog'], seg: [76.3, 81.8],
      stem: 'Why does the audience laugh at the answer about the eggnog?',
      choices: ['He loved a drink that was meant for a baby', 'He loved a drink that was really a medicine',
                'He loved a drink that had gone bad weeks ago'], a: 0,
      cue: '「Joey,」と呼んだあとの、最後の一語。',
      line: 'that eggnog in our fridge was *great*. — Joey, that was *formula*.',
      said: '「エッグノッグ、おいしかった」に、「ジョーイ、あれは粉ミルク」と返される。',
      mean: 'formula ＝ 赤ちゃん用の粉ミルク。大人がそれをほめたのが笑い。',
      trap: 'formula を「調合物」と取ると薬に見える。台所の formula は粉ミルク。',
      use: 'We’re out of baby formula.（粉ミルクが切れてる）' },

    // R fix: V2 (blind 55 %, right) and K4: “We get to get more” was the odd one out (the repeated get gave it away);
    //   cut to 3. Ear check removed: both sources say “We got to”
    // why: ought to ← “oughta” and “gotta” differ only in the g; want to ← “wanna” has the same rhythm
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotto', seg: [81.7, 84.7],
      stem: 'Fill the gap: “___ get more of that.”',
      choices: ['We got to', 'We ought to', 'We want to'], a: 0,
      cue: '最後の一言、文の最初の短いかたまり。',
      line: '*We got to* get more of that.',
      said: '最後に「あれ、もっと買わなきゃ」と言う。',
      mean: 'got to は「ガラ」「ガダ」のように縮み、gotta（〜しなきゃ）になる。',
      trap: 'gotta と oughta は頭の g だけが違い、wanna もリズムが同じ。文頭の子音を聞く。',
      use: 'We gotta go, or we’ll miss the train.（行かなきゃ、電車に遅れる）' },
  ]
};
