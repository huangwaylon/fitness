// REVIEW 2026-11-16: pass 9, fix 9, drop 1, new 0; ear checks 1
// OPEN: the 53–71 s turns ("You're right… Well, you're not right", "your condo complex", "M. Shulman"): whisper
//   splits speakers where the captions don't. If an ear check shows one speaker for "You're right… Well, you're not
//   right", the dropped marker item m1 could come back.
// “It's Johnny Depp! - The Office US” (the official The Office channel, BEST OF SEASON 6): a coworker shows Jim a
// photo of "Johnny Depp" taken at his condo complex; Jim plays along and teases him, and the coworker fights to keep
// his excitement.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 71 s; whisper's repeated "go to the
// mall" line after it is a hallucination. Untested on purpose: 4.6 s ("who" / "what that is"), 16.9–21 s (who says
// the People line; the items there are speaker-free), 22.9–26 s (who owns the Pirates "idea"; h2 is speaker-free),
// 53.5 s ("a little bit of" / "a little better reason"), 59.5–71 s (the "your condo complex" / mailbox / "M. Night
// Shulman" turns: speakers unclear, and the punchline rests on a director's name). The coworker is never named, so
// the stems call him "his coworker". Jim is settled by "Jim" (1.4 s) and "Halpert" (44.2 s).
// EAR CHECK: 9.3 s nt1 — “Is it you?” is Jim's and “I am flattered” the coworker's (whisper splits the turns there;
//   the captions add a “no” before “I am flattered”, which no key uses)
import type { Clip } from '../types.ts';

export const deppCondo: Clip = {
  id: 'deppcondo', video: 'RvZcNDj_gQM', title: 'It’s Johnny Depp!', dur: 94, wpm: 203, band: 'fast',
  tags: ['職場', '友だち'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: looks like him ← "Is it you? — I am flattered" heard as the claim; filming near Scranton ← "Scranton" and
    //   the "Pirates movie" talk joined into one story
    { id: 'g1', skill: 'gist', level: 'B1', point: 'claim', reveals: ['where'], seg: [0.5, 22.8],
      stem: 'What is Jim’s coworker trying to convince him of?',
      choices: ['That Johnny Depp lives in his condo complex', 'That Johnny Depp looks a lot like him',
                'That Johnny Depp is filming near Scranton'], a: 0,
      cue: '写真の場所を聞かれたあとの答え。',
      line: 'That’s *Johnny Depp*. … In my *condo complex*.',
      said: '写真の男を見せて「ジョニー・デップだ」と言い、撮った場所は自分のマンションだと答える。',
      mean: '有名人が近所に住んでいる、と同僚に信じてほしい場面。',
      trap: 'flattered や Pirates も聞こえるが、話の中心は「どこで見たか」。場所の答えに注目。',
      use: 'Guess who lives in my building.（うちの建物に誰が住んでると思う？）' },

    // R fix: V2/K6 (blind 70 %): the key was the only two-part, knowing choice; "helps prove it" is now "swept up",
    //   built on the "Oh, my God. That's right" turn taken at face value
    // why: swept up ← "Oh, my God. That's right. I read in People…" heard as sincere excitement; a star story of
    //   his own ← the Roger Clemens memory heard as Jim offering his own sighting
    { id: 'g2', skill: 'gist', level: 'B2', point: 'scene', reveals: ['tease'], seg: [0.5, 67],
      stem: 'What is Jim mostly doing in this scene?',
      choices: ['Playing along while poking fun at the story', 'Getting swept up in the story along with him',
                'Sharing a star story of his own to match it'], a: 0,
      cue: 'ジムの質問や返事の調子を、最後まで通して。',
      said: '同僚の話に付き合って質問もするが、返事のたびに冗談をはさんでいる。',
      mean: '本気で信じてはいない。信じたい同僚を、話を合わせながらからかっている。',
      trap: '質問が多いと協力に聞こえるが、答えを本気で求めてはいない。返しの調子で判断。',
      use: 'I’m just playing along.（話を合わせてるだけだよ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'look', seg: [6.3, 9.2],
      stem: 'Type what he says twice, before “T-shirt, jeans.” (3 words)', answer: 'look at him',
      cue: '「No」のすぐあと、同じ言葉が2回。',
      line: '*Look at him*. Look at him. T-shirt, jeans.',
      said: '「ほら、見てよ。見て。Tシャツにジーンズ」と写真を見せる。',
      mean: 'look at him が「ルッカリム」とつながり、him の h はほぼ消える。',
      trap: 'at の t は弾み、him は「イム」と弱くなる。3語を一つの音のかたまりとして聞く。',
      use: 'Look at him go!（見て、あの走りっぷり！）' },

    // anchor: 7.8–11.8 s "Look at him… T-shirt, jeans." then "Is it you?" then "I am flattered": the plain look is
    //   the dig, and the reply takes it as praise
    // R fix: V2 (blind 50 %): the key was the only choice naming a mechanism; all three now give one, and Jim's is
    //   the literal reading of "Is it you?"
    // why: on Jim ← "Is it you?" heard as a sincere question, so Jim looks like the one who can't spot a star
    //   (right mechanism, wrong target); on Depp ← "T-shirt, jeans" heard as the joke's target, a star shown plainly
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'flattered', seg: [6.4, 14],
      stem: 'At “Is it you?” and the reply to it, who is the joke on?',
      choices: ['The coworker, who hears a dig as praise', 'Jim, who mistakes a star for his coworker',
                'Johnny Depp, who is shown dressed so plainly'], a: 0,
      cue: '見た目の説明と、そのあとの短い返事。',
      line: 'T-shirt, jeans. — *Is it you?* — *I am flattered*.',
      said: 'Tシャツにジーンズの男を見せられ、ジムが「これ君？」と聞くと、同僚は「光栄だね」と返す。',
      mean: '「君かと思うほど普通の男」というからかいを、スターに似ていると言われたと受け取っている。笑われているのは同僚。',
      trap: 'からかう側を笑いの的と取りやすい。返事が的外れなら、笑われているのは返事をした人。',
      use: 'I’ll take that as a compliment.（ほめ言葉として受け取っておくよ）' },

    // R fix: V2 (blind 60 % in a draw): n1's and d2's stems say "condo", so the key was the only condo choice; the
    //   parking lot is now a condo for sale (the "two-bedroom condo" Depp wants); stem names the speaker
    // why: condo for sale ← "looking for a two-bedroom condo" joined to the photo; Yankees game ← a game is named
    //   later in the clip
    { id: 'd1', skill: 'detail', level: 'B1', point: 'where', reveals: ['whered'], seg: [12.6, 16.5],
      stem: 'Where does Jim’s coworker say he took the photo?',
      choices: ['At his condo complex', 'At a condo for sale downtown', 'At a Yankees game'], a: 0,
      cue: '写真について聞かれた直後の答え。',
      line: 'In my *condo complex*.',
      said: '「どこで撮ったの」に「うちのマンションで」と答える。',
      mean: 'condo complex ＝ 分譲マンションの敷地。自分の住まいで撮った、ということ。',
      trap: 'Yankees game もあとで出てくるが、それはジムの昔の話。場所は質問の直後の答えで聞く。',
      use: 'I live in a condo near the station.（駅の近くのマンションに住んでる）' },

    // why: When'd ← same shape, only the vowel differs; Why'd ← "wh-" + "d" heard, and "Why'd you take that?" is a
    //   natural complaint about a photo
    { id: 's1', skill: 'sound', level: 'B2', point: 'whered', seg: [12.6, 16.5],
      stem: 'Fill the gap: “___ take that?”',
      choices: ['Where’d you', 'When’d you', 'Why’d you'], a: 0,
      cue: '文の最初の短いかたまりと、それへの答え。',
      line: '*Where’d you* take that?',
      said: '「それ、どこで撮ったの？」と聞いている。',
      mean: 'where did you が「ウェアジュ」と縮まる。did は d だけ残り、you とつながる。',
      trap: 'when’d も why’d も短く弱い。直後の答えが場所なら where、と答えで確かめる。',
      use: 'Where’d you get that jacket?（そのジャケット、どこで買ったの？）' },

    // why: four ← "looking for a" runs "for a" into a four-like sound just before the number; one ← the article "a"
    //   heard as "one"
    { id: 'n1', skill: 'number', level: 'B1', point: 'bedroom', seg: [17.9, 21.35], keep: true,
      stem: 'According to the story, what kind of condo was Depp looking for?',
      choices: ['A one-bedroom', 'A two-bedroom', 'A four-bedroom'], a: 1,
      cue: '「condo」の直前の数。',
      line: 'he was looking for *a two-bedroom* condo in Scranton',
      said: '話によると、デップはスクラントンで寝室2つのマンションを探していた。',
      mean: 'two-bedroom ＝ 寝室が2つの部屋。間取りを言うときの決まった言い方。',
      trap: '直前の for a が「フォーア」と聞こえ、four と混ざりやすい。数は名詞の直前で拾う。',
      use: 'We need a two-bedroom near the beach.（ビーチ近くの2ベッドルームが要る）' },

    // why: people at work ← "People" heard as the plain noun ("people say"); local news ← a celebrity house hunt
    //   sounds like a TV story
    { id: 'd2', skill: 'detail', level: 'B2', point: 'source', seg: [17.9, 21.35],
      stem: 'Where does the story about Depp’s condo hunt come from?',
      choices: ['An article in a magazine', 'Gossip from people at work', 'A story on the local news'], a: 0,
      cue: '文の最初、「that he was」の前まで。',
      line: 'I read in *People magazine* that he was looking for…',
      said: '「ピープル誌で読んだけど、デップは部屋を探してたって」と言う。',
      mean: 'People はここでは雑誌の名前。人づての話ではなく、記事が出どころ。',
      trap: 'people を「人々」と取ると「誰かが言っていた」になる。直後の magazine まで聞いて判断。',
      use: 'I read in the paper that it’s closing.（閉店するって新聞で読んだ）' },

    // why: give up ← "out" read as ending (やめる, 外れる); turn the photo over ← flip = 裏返す, the literal reading
    //   with a photo in hand
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'flipping', seg: [18.3, 22.8],
      stem: 'What does the short reaction right after the condo story mean?',
      choices: ['I’m so excited I can’t stay calm', 'I’m about to give up on this', 'I’ll turn the photo over and check'],
      a: 0,
      cue: '「Scranton」のすぐあとの短い一言。',
      line: '*I’m flipping out*, man.',
      said: '「もう、たまらないよ」と興奮を口にする。',
      mean: 'flip out ＝ 気持ちが抑えられなくなる。ここでは大喜び。怒ったときにも使う。',
      trap: 'flip を「裏返す」、out を「やめる」と取ると別の意味になる。句動詞はひとかたまりで覚える。',
      use: 'When I saw the price, I flipped out.（値段を見て、取り乱しちゃった）' },

    // why: a part for himself ← "my idea for the… movie" sets up a pitch, so a role sounds likely; shoot it in
    //   Scranton ← "Scranton" was just said
    { id: 'h2', skill: 'humor', level: 'C1', point: 'pirates', seg: [22.4, 26.9],
      stem: 'What makes the “idea for the fourth Pirates movie” funny?',
      choices: ['The whole idea is just that one gets made', 'The idea is a part in it for himself',
                'The idea is to shoot the film in Scranton'], a: 0,
      cue: '「Sure」のあとに続く、アイデアの中身。',
      line: 'my idea for the fourth Pirates movie… — Sure. — *That they should do one*.',
      said: '「4作目のアイデア、覚えてる？」「うん」「作るべきだ、ってやつ」。',
      mean: '中身は「続編を作るべき」だけ。大きな前置きと小さな中身の差が笑い。',
      trap: 'idea と movie で役や筋書きを期待しやすい。前置きが大きいほど、中身を最後まで聞く。',
      use: 'I have a great idea: let’s eat.（いいこと思いついた。食べよう）' },

    // R fix: V2 (blind 60 %) and a leak: "the magazine story" gave away d2's key; that choice is now a film quiz
    // why: the way to a bar ← "where do I find…" read as a real question; a quiz ← "the Black Pearl" right after the
    //   Pirates talk heard as a trivia question for Jim
    { id: 'i2', skill: 'infer', level: 'B2', point: 'sparrow', seg: [25.95, 38.95],
      stem: 'When he asks Jim where to find “the Black Pearl”, what is he doing?',
      choices: ['Acting out a pirate from the films', 'Asking Jim the way to a local bar',
                'Quizzing Jim on the films’ details'], a: 0,
      cue: '「Who’s that?」への答えと、その次の一言。',
      line: 'where do I find *the Black Pearl*? … No, *I’m Captain Jack Sparrow*.',
      said: '「ブラックパールはどこだ？」と聞き、「誰？」と返されると、役の名前を名乗る。',
      mean: '映画の海賊になりきって、デップのものまねをしている。',
      trap: 'where do I find を本当の質問と取りやすい。「誰？」への答えが役名なら、ものまね。',
      use: 'Guess who I am.（私は誰でしょう）' },

    // R fix: V2/K6 (blind 70 %): the key was the only choice with a motive; all three are now "doing X, to/since Y"
    // why: really lost ← the other names sound like honest mix-ups; sound like a fan ← "John Dillinger" is another
    //   Depp role, so the list sounds like film knowledge
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'tease', seg: [30.2, 44.75],
      stem: 'When Jim answers with other names, what is he doing?',
      choices: ['Pretending not to get it, to tease him', 'Naming other Depp roles, to sound like a fan',
                'Mixing up the names, since he really is lost'], a: 0,
      cue: '役名を2回言われたあとの返事と、最後の一言。',
      line: 'No, I’m Captain Jack Sparrow. — *Captain Crunch*. … *Screw you*, Halpert.',
      said: '役名を2回言われても、ジムは似た響きの別の名前で返し、同僚は怒る。',
      mean: '分かっているのに、わざと外してからかっている。最後の Screw you がその証拠。',
      trap: '名前を次々に言うので本気の当て推量に聞こえる。答えを言われたあとも外すなら、わざと。',
      use: 'Okay, okay, I’m just messing with you.（ごめん、からかっただけ）' },

    // why: furious ← "Screw you" is a strong phrase out of context; amused ← the light delivery heard as laughing
    //   along with Jim
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'screw', reveals: ['tease', 'excited'], seg: [42.35, 47.95],
      stem: 'How does he feel as he says “Screw you, Halpert”?',
      choices: ['Fed up with being teased again', 'Furious enough to stop talking', 'Amused and happy to play along'],
      a: 0,
      cue: '強い一言のすぐあとに続く文。',
      line: '*Screw you*, Halpert. You know, it’s *not easy getting excited* about stuff.',
      said: '「うるさいよ」と言い、「わくわくするのは簡単じゃない」と続ける。',
      mean: '本気の怒りではなく、からかわれてうんざりした気持ち。話はそのまま続けている。',
      trap: 'Screw you は強い言葉なので激怒に聞こえやすい。仲間内では軽い「うるさい」にもなる。',
      use: 'Oh, shut up. You know what I mean.（もう、うるさいな。分かるでしょ）' },

    // R fix: V2/K5 (blind 60 %): the key was the only two-part choice; all three are now "fact, so request"
    // why: bored now ← "not easy getting excited" read as "I can't get excited about this any more"; calm down ←
    //   "getting excited" heard as about Jim
    { id: 'i1', skill: 'infer', level: 'C1', point: 'excited', seg: [43.8, 47.95],
      stem: 'Right after “Screw you, Halpert”, what is he telling Jim?',
      choices: ['Excitement is rare, so don’t spoil it', 'Excitement fades, so he’s bored of it now',
                'Jim gets excited too easily, so calm down'], a: 0,
      cue: '「You know」で始まる文の中身。',
      line: 'You know, it’s *not easy getting excited* about stuff.',
      said: '「何かにわくわくするのって、そう簡単じゃないんだぞ」と言う。',
      mean: 'せっかく楽しんでいるのに水を差すな、という抗議。',
      trap: 'not easy を「わくわくできない＝飽きた」と取りやすい。前の Screw you とつなげて聞く。',
      use: 'Let me enjoy this, okay?（楽しませてよ、ね？）' },

    // R fix: V2 (blind 55 %) and S1: whisper gives "At the Yankees game" to another speaker, so the stem now names
    //   Clemens; "saw Depp there" became the coworker's own sighting, a keyword trap on "seen"
    // why: change the subject ← a baseball name in the middle of a Depp talk sounds like a new topic; a sighting of
    //   his own ← "you'd seen" with the weak "you'd" lost, heard as "I'd seen"
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'clemens', seg: [47.9, 52.7],
      stem: 'Why does he bring up Roger Clemens?',
      choices: ['To remind Jim of his own excitement', 'To change the subject to baseball',
                'To top it with a sighting of his own'], a: 0,
      cue: '「Remember how」のあとの you が誰か。',
      line: 'Remember how *you felt* when you thought you’d seen Roger Clemens',
      said: 'ジムが有名な野球選手を見たと思った時のことを持ち出す。',
      mean: '「君だって有名人で興奮したじゃないか」と、ジム自身の経験で言い返している。',
      trap: '急に野球の話が出るので話題を変えたと取りやすい。Remember how you… は相手の経験に訴える形。',
      use: 'Remember how nervous you were?（君だって緊張してたでしょ）' },

    // R fix: V2 (blind 55 %): the key was the only warm reply; "the game" became a second "Fair." reply about being
    //   sure (the truth question again). Cue leak "felt" removed. The anchor and `said` no longer lean on the
    //   "You're right… Well, you're not right" turns, whose speakers whisper splits; seg ends after "it wasn't him"
    // anchor: 48.3–51.2 s "Remember how you felt when you thought…" asks about a feeling, after "it's not easy
    //   getting excited about stuff", not about whether the sighting was real
    // why: a concession ← "thought you'd seen… it wasn't him" heard as him granting his own sighting may be wrong too
    //   (right topic, wrong direction); just as sure ← "thought you'd seen" heard as being about certainty, not the
    //   feeling (warm, but answers the truth question)
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'clemens', seg: [47.9, 52.7],
      stem: 'Which reply from Jim would match what his coworker meant?',
      choices: ['Fair. It felt great, even if it was fake.', 'Right, so you admit it might not be Depp.',
                'Fair. I was just as sure it was him.'], a: 0,
      cue: '「Remember how」の続き。何を思い出させている？',
      line: 'Remember *how you felt* when you thought you’d seen Roger Clemens…',
      said: '「あの選手を見たと思った時、どんな気持ちだった？」と、ジム自身の興奮を思い出させる。',
      mean: '言いたいのは「本物かより、あの興奮を分かって」。気持ちに返す返事が合い、本物か・確信かの話はずれる。',
      trap: '「見たと思った」を、本物かどうかの話と取りやすい。思い出させているのが気持ちか事実かを聞く。',
      use: 'Fair enough. I get why you’re excited.（なるほどね、興奮する気持ちは分かる）' },

    // R fix: the answer's apostrophe now matches the line's (’), so it equals the starred words
    { id: 'x2', skill: 'dict', level: 'B2', point: 'clemens', seg: [48, 51.48],
      stem: 'Type the words: “…when you thought ___ Roger Clemens” (2 words)', answer: "you'd seen",
      cue: '「thought」の直後、とても短い2語。',
      line: 'Remember how you felt when you thought *you’d seen* Roger Clemens',
      said: '「あの選手を見たと思った時の気持ち、覚えてる？」と聞く。',
      mean: 'you’d は you had。had は d だけ残り、seen とつながる。',
      trap: 'd が消えると you seen や you saw に聞こえやすい。弱い had を聞き落とさない。',
      use: 'I thought I’d seen it before.（前に見たことあると思った）' },

    // why: never went ← "wasn't" and "game" heard together as missing the game; did meet him ← -n't lost, so it
    //   sounds like "it was him"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'clemens', seg: [48, 55],
      stem: 'What does Jim say about that time at the game?',
      choices: ['It wasn’t really Clemens he saw', 'He never actually went to the game',
                'He did get to meet Clemens there'], a: 0,
      cue: '「Yeah, well」のすぐあと。',
      line: 'Yeah, well, *it wasn’t him*.',
      said: 'ジムは「まあ、本人じゃなかったけどね」と認める。',
      mean: 'ジムも有名人を見たと勘違いしたことがある。同僚の写真も同じかも、と匂わせる返し。',
      trap: 'wasn’t の t が消えると was に聞こえ、本当に会えた話になる。n の音が残るかを聞く。',
      use: 'It wasn’t him after all.（結局、本人じゃなかった）' },

    // R drop: m1 (marker) — the key needs "You're right. You're right." and "Well, you're not right" from one
    //   speaker, but whisper marks a turn change at "Well" and no name settles it (§9.7). Never shipped, deleted.
  ]
};
