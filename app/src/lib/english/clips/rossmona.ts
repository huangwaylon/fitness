// “Ross Lies to Mona About Living with Rachel | Friends” (the official Friends channel, Best of Season 8): Ross tells
// Mona about the baby's week, floats "Joey's" idea that Rachel move in with him, then laughs it off once Mona pictures
// it.
// Segments from the captions, words from whisper (2026-11-16). Left out on purpose: who says "Yeah, right." (17.9 s) and
// "What?" (21.3 s), which neither source settles (p1 asks only what the words do, so it holds either way), and the
// 28–33 s beat ("Huh." / whisper "Hey, could you imagine?", captions "Like, could you imagine?"), which no key uses.
// EAR CHECK: 46.4 s i2 — Ross's whole reply to "what did you tell him?" is a non-word (captions "Mhm.", whisper
//   "Hoo, hoo, hoo…"); the key assumes no real answer follows before the clip ends, and the "too funny" distractor
//   assumes the sound is a nervous non-answer, not a real laugh at the idea
// REVIEW 2026-11-16: pass 4, fix 14, drop 0, new 0; ear checks 1
// Open: d3 and t1 stay near 50 % blind (who moves where is a coin toss; sarcasm is the sitcom default). No item may
//   rest on the title's "lies" (that Rachel already lives with Ross): the audio never says so.
import type { Clip } from '../types.ts';

export const rossMona: Clip = {
  id: 'rossmona', video: 'tcOGOvK_m0w', title: 'Ross Lies to Mona About Living with Rachel', dur: 61, wpm: 125,
  band: 'slow', tags: ['恋愛', '家'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %) + §9.4: the title answered "find out how she'd feel". The stem now asks why he raises the
    //   idea; both distractors are readings of his laugh ("Yeah, right" as a no already given; "cracks me up" taken
    //   at face value).
    // why: already said no ← "Yeah, right" heard as his answer to Joey; silly Joey ← "Joey cracks me up" taken
    //   literally; the build-up ("missing out… So") and his waiting for her reaction settle it
    { id: 'g1', skill: 'gist', level: 'B2', point: 'aim', reveals: ['suggest'], seg: [0, 28.5],
      stem: 'Why does Ross bring up Joey’s idea with Mona?',
      choices: ['To see how she’d feel about it', 'To tell her he’s already said no to it',
                'To show her how silly Joey can be'], a: 0,
      cue: 'Joey の名前を出す前の話と、そのあとの間。',
      said: '赤ちゃんの話から、Joey の案として「Rachel がうちに住む」話を出し、笑い話にする。',
      mean: '自分の案とは言わず、人の案にして彼女の反応を探っている。',
      trap: '笑い飛ばすので「もう断った」話に聞こえる。断ったとは一度も言っていない。',
      use: 'Just out of curiosity, how would you feel?（参考までに、どう思う？）' },

    // R fix: V2 (blind 70 %): "kicking" was the one baby milestone; all three are now "has started…" news, one a
    //   near sound.
    // why: picking names ← "kicking" and "picking" differ only in the first sound; showing ← "started" + a
    //   pregnancy word, heard as news about the mother; "the baby" before "started" settles it
    { id: 'd1', skill: 'detail', level: 'B1', point: 'kick', seg: [0, 5.0],
      stem: 'What news does Ross have from his week?',
      choices: ['The baby has started kicking', 'Rachel has started showing', 'They’ve started picking names'], a: 0,
      cue: '「actually」のあと、started の前後。',
      line: 'Actually, the *baby started kicking*.',
      said: '「今週ね、赤ちゃんがおなかをけり始めたんだ」と話している。',
      mean: 'kick ＝ ける。胎動が始まった、という大きなニュース。',
      trap: 'kicking と picking は最初の音だけの違い。started の前の主語 baby も一緒に聞く。',
      use: 'It actually started raining.（実は雨が降り出したんだ）' },

    // R fix: V2 (blind 60 %): the key was the only mixed feeling and restated d2's fact. All three now pair a feeling
    //   with a second one; the reveal of `around` goes.
    // why: worried ← "sad thing" half heard as worry; acting cool ← "Yeah, I know" read as blasé; "Oh, it was
    //   amazing" and "the only sad thing" settle it
    { id: 't2', skill: 'attitude', level: 'B2', point: 'amazing', seg: [1.2, 10.6],
      stem: 'How does Ross feel about the news?',
      choices: ['Thrilled, with one small regret', 'Thrilled, but a bit worried too', 'Pleased, but acting cool about it'], a: 0,
      cue: 'amazing のあと、「only」で始まる文。',
      line: 'Oh, it was *amazing*. The *only sad thing* is…',
      said: '「すごかった」と喜んだあと、「悲しいのは一つだけ」と付け足す。',
      mean: '喜びと、小さな心残りの両方。良い話のあとに一点だけ足す型。',
      trap: 'sad を「心配」と取ると不安に聞こえる。only が付くと、残りは良い話という合図。',
      use: 'The only bad thing was the weather.（いまいちだったのは天気だけ）' },

    // R fix: V2 (blind 60 %): "only the one time" was a filler. "around" read as "about" (だいたい) replaces it.
    // why: there but missed it ← "wasn't" with its t dropped heard as "was"; not sure when ← "around" = だいたい,
    //   as in "around noon"; "wasn't around when it happened" settles it
    { id: 'd2', skill: 'detail', level: 'B1', point: 'around', seg: [6.6, 10.6],
      stem: 'What was the one sad thing for Ross?',
      choices: ['He wasn’t there when it first happened', 'He was there, but didn’t feel it himself',
                'He isn’t sure when it first happened'], a: 0,
      cue: '「I」のあとの短い語と、その次の一語。',
      line: 'I *wasn’t around* when it happened *for the first time*.',
      said: '「初めてけったとき、そばにいなかった」と言っている。',
      mean: 'be around ＝ その場にいる、近くにいる。最初の一回を見逃した。',
      trap: 'wasn’t の t は消えやすく was に聞こえる。around も「だいたい」でなく「そばに」の意味。',
      use: 'I’ll be around if you need me.（何かあったら近くにいるよ）' },

    // R fix: V2 (blind 65 %): "before he mentions Joey" in the stem pointed at the link. The stem now names only the
    //   moment; "busy lately" and "blames Rachel" are the readings of "missing out" a partial listener takes.
    // why: busy ← "missing out on all this stuff" heard as an apology for being away; blames Rachel ← "sad" read as
    //   a complaint; "So, Joey suggested Rachel move in" right after ties it to the idea
    // R fix (N7): its line shows x1's answer ("missing out on"), so it now reveals `missout`; nt1 too, nt2 `fewdays`.
    { id: 'i1', skill: 'infer', level: 'B2', point: 'buildup', reveals: ['suggest', 'missout'], seg: [6.6, 17.8],
      stem: 'Why does Ross bring up what he’s been missing?',
      choices: ['It sets up a reason for Rachel to move in', 'It explains why he’s been so busy lately',
                'It shows he blames Rachel for leaving him out'], a: 0,
      cue: '最後の「So」の前と後を、つなげて聞く。',
      line: 'I was missing out on all this other stuff, too. *So*, Joey suggested Rachel move in…',
      said: '見逃したことを話してから、So で「だから Joey が…」とつなぐ。',
      mean: 'So が前の話を理由にしている。見逃したくない → 一緒に住めば、という流れ。',
      trap: 'missing を忙しさの言い訳と取りやすいが、話は赤ちゃんのこと。So の前後を結ぶ。',
      use: 'So, here’s an idea.（それでね、考えがあるんだけど）' },

    // R fix: V2 (blind 70 %) + K3: "Rachel would never agree" and "Joey annoys him" had no footing. Now the near
    //   misses are the right mechanism with the wrong person (Rachel warming to it) and the sincerity flip.
    // why: Rachel warming ← right mechanism, wrong person: the reasons sound like a couple's plan; nothing ← the
    //   sincerity flip, the mocking taken at face value; the reasons he lists are his own ("I wasn't around", "I was
    //   missing out")
    // anchor: 6.6–17.1 s his own case for it ("the only sad thing", "missing out", then "So") comes before he names Joey;
    //   he turns to mocking only after "Yeah, right." at 17.9 s
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'buildup', reveals: ['suggest', 'cracks', 'missout'], seg: [6.6, 28.5],
      stem: 'When Ross makes fun of Joey’s idea, what is he trying not to say?',
      choices: ['That he’d been warming to the idea himself', 'That Rachel had been warming to the idea',
                'Nothing; he really does find it ridiculous'], a: 0,
      cue: 'Joey の名前を出す前に、自分で何を話していたか。',
      line: 'I was missing out on all this other stuff, too. So, Joey suggested… — Joey *cracks me up*.',
      said: '見逃した話を自分から重ね、「だから Joey が」と出したのに、急に「Joey って笑える」と言い出す。',
      mean: '前半は賛成の理由そのもの。相手の反応を見て笑い話に変えたので、本音は前半にある。',
      trap: '笑い飛ばす声を本気と取りやすいが、理由を並べたのは本人で主語は I。笑う前の話を聞く。',
      use: 'Not that I was thinking about it, but…（別に考えてたわけじゃないけど…）', retired: true },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'missout', seg: [11.4, 14.45],
      stem: 'Type what Ross says: “And I was ___ all this other stuff, too.” (3 words)', answer: 'missing out on',
      cue: '「was」のすぐあと、all の前まで。',
      line: 'And I was *missing out on* all this other stuff, too.',
      said: '「ほかのいろんなことも見逃してたし」と続けている。',
      mean: 'miss out on ＝ 良い機会を逃す。三語がつながり「ミスィンガウトン」。',
      trap: 'out と on が短く、missing だけ書きやすい。前置詞までかたまりで覚える。',
      use: 'You’re missing out on the fun!（楽しいのに、もったいない！）' },

    // why: Ross into Rachel's ← the order of "Rachel move in with me" flipped; Joey's ← "Joey" heard as the place,
    //   since he made the suggestion
    { id: 'd3', skill: 'detail', level: 'B1', point: 'suggest', seg: [14.0, 18.0],
      stem: 'What did Joey suggest, according to Ross?',
      choices: ['That Rachel move in with Ross', 'That Ross move in with Rachel', 'That Rachel move in with Joey'], a: 0,
      cue: '「suggested」のあと、名前と最後の一語。',
      line: 'Joey suggested *Rachel move in with me*.',
      said: '「Rachel をうちに住まわせたらって」と言う。',
      mean: 'suggest ＋ 人 ＋ 動詞の原形 ＝「〜したらと言う」。住むのは Rachel、場所は Ross の家。',
      trap: '名前が続き、誰がどこへ移るか入れ替わりやすい。with のあとが行き先。',
      use: 'She suggested we take a taxi.（タクシーにしようと言われた）' },

    // R fix: V2 (blind 85 %) + S2: the stem quoted "Yeah, right", so the set phrase answered it without ears. The stem
    //   now names the moment only.
    // why: agrees ← "yeah" and "right" each mean yes, so together they read as agreement; check ← a rising "right?"
    //   heard as a question; the next lines laugh the idea off
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'yeahright', seg: [14.0, 21.9],
      stem: 'Right after Joey’s idea comes up, what do the next two words do?',
      choices: ['Wave the idea off as a joke', 'Agree that Joey has a point', 'Check whether Ross means it'], a: 0,
      cue: '短い二語のあとの間と、続く笑い話。',
      line: '*Yeah, right.*',
      said: '提案の話のすぐあと、この二語だけが返る。',
      mean: 'Yeah, right. ＝「まさか」「冗談でしょ」。yes の言葉二つで、強い否定になる。',
      trap: 'yeah も right も「はい」なので賛成に聞こえる。短く下げて切ったら「ありえない」の合図。',
      use: 'Yeah, right. Like that’ll happen.（まさか。ありえないって）' },

    // R fix: V2 (blind 75 %): two fillers. Now "laughs along" (she follows his joke) and "only if hidden" (her
    //   closing question heard as asking for honesty) are the readings.
    // why: funny but fine ← she joins Ross's laughing tone; only if hidden ← "So, what did you tell him?" heard as
    //   wanting honesty; "could you imagine" and "some woman he got pregnant" settle it
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['imagine'], seg: [14.0, 45.0],
      stem: 'Where does Mona stand on the idea by the end?',
      choices: ['She’d hate it if her boyfriend did that', 'She finds it funny, but she wouldn’t mind',
                'She’d mind only if he kept it from her'], a: 0,
      cue: '「could you imagine?」から始まる彼女の話。',
      said: 'Ross が笑い話にしたあと、Mona も「想像できる？」と、ありえない話として続ける。',
      mean: '彼女にとっては論外の話。Ross は本当のことを言い出せなくなる。',
      trap: '笑う調子や最後の質問から「平気」と取りやすいが、その前に彼女の考えははっきり出ている。',
      use: 'Can you imagine? No way.（想像できる？ありえないよ）' },

    // R fix: V2 (blind 80 %): "wears me out" was weak. "cheers me up" (the same "me up", a nice feeling) replaces it.
    // why: drives me crazy ← "crack up" = 頭がおかしくなる (go to pieces); cheers me up ← the same "…me up" and a
    //   happy meaning; he goes on to mock the idea as a joke, which is laughing, not comfort
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'cracks', seg: [21.0, 24.1],
      stem: 'What does Ross mean by “Joey cracks me up”?',
      choices: ['Joey makes me laugh', 'Joey drives me crazy', 'Joey cheers me up'], a: 0,
      cue: '直後の「It’s like」から始まる、Joey のまね。',
      line: 'Joey *cracks me up*.',
      said: '「Joey って、ほんと笑えるよね」と言う。',
      mean: 'X cracks me up ＝ X が笑わせてくれる。ここでは案をばかげた冗談として扱う言い方。',
      trap: '割れる→「参る」と取りやすい。cheer up とも別で、crack up は大笑い。',
      use: 'You crack me up!（あなたって、ほんと笑える！）' },

    // R fix: V2 (blind 60 %) + K1: "his own honest view" was half defensible (the sarcasm is his view). A question
    //   to Mona (the quote is a "why don't you…?") replaces it.
    // why: comparison ← "like" = ～のような; a question for Mona ← the quote is a question with "you" in it; the
    //   "you" is Ross ("your ex-wife"), in Joey's voice as Ross mocks it
    { id: 'm1', skill: 'marker', level: 'B2', point: 'itslike', reveals: ['whydont', 'awkward'], seg: [21.7, 27.6],
      stem: 'In Ross’s comment on Joey, what does “It’s like” lead into?',
      choices: ['Joey’s idea, put in a mocking voice', 'A similar case to compare it with', 'A question he wants Mona to answer'], a: 0,
      cue: 'It’s like のあと、口調が変わる部分。',
      line: '*It’s like*, “Yeah, why don’t you have your ex-wife move in with you?”',
      said: '「『元妻と住めば？』って感じ」と、Joey の口ぶりをまねる。',
      mean: 'It’s like ＋ セリフ ＝ 人の言い方をまねる。大げさにまねて、ばかにしている。',
      trap: 'like を「〜のような」と取ると比べる話になる。声色が変わったら引用の合図。',
      use: 'He was like, “No way!”（彼、「ありえない！」って感じでさ）' },

    // R fix: V2 (blind 90 %): "Yeah, why ___ have…" let the set suggestion "why don't you" fill itself. The gap now
    //   takes in "why", and every choice is a natural mocking question.
    // why: would ← "why would you" squeezes to "why'dja", a natural scoff; why'd ← "why'd you" = why did, the "n"
    //   and "t" lost; do ← "don't" with its n and t both lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'whydont', seg: [23.5, 27.6],
      stem: 'Fill the gap: “Yeah, ___ have your ex-wife move in with you?”',
      choices: ['why don’t you', 'why would you', 'why’d you', 'why do you'], a: 0,
      cue: 'Yeah のあと、have の前の三語。',
      line: 'Yeah, *why don’t you* have your ex-wife move in with you?',
      said: '「元奥さんと住めばいいじゃん」と提案の形で言う。',
      mean: 'Why don’t you…? ＝「〜したら？」。don’t you が「ドンチュ」とつながる。',
      trap: 'would you も「ウッジュ」と縮む。don’t の「ドン」が残るかを聞く。',
      use: 'Why don’t you come with us?（一緒に来たら？）' },

    // why: not awkward ← the words taken at face value; only at first ← "at all" lost, leaving "awkward" with a
    //   softer reading
    { id: 't1', skill: 'attitude', level: 'C1', point: 'awkward', reveals: ['whydont', 'suggest'], seg: [23.5, 27.6],
      stem: 'How does Ross mean the last line of his take on Joey’s idea?',
      choices: ['It would be really awkward', 'It wouldn’t be awkward at all', 'It would be awkward only at first'], a: 0,
      cue: 'ex-wife のあと、最後の二語の言い方。',
      line: 'your *ex-wife* move in with you? That *wouldn’t be awkward at all*.',
      said: '「元妻と同居？全然気まずくないよね」と、わざと言う。',
      mean: '反対の言葉で「すごく気まずい」と言う皮肉。元妻という語が、本気でないと示す。',
      trap: '言葉どおり取ると「平気」になる。ありえない状況のあとの at all は、皮肉の合図になりやすい。',
      use: 'Oh great, that won’t be weird at all.（最高、全然変じゃないよね［皮肉］）' },

    // why: hours ← "a few" heard, the unit lost; weeks ← "days" and "weeks" both a short one-beat word; months ←
    //   a long trip picture
    { id: 'n1', skill: 'number', level: 'B1', point: 'fewdays', seg: [32.6, 39.0], keep: true,
      stem: 'In the picture Mona describes, how long has she been away?',
      choices: ['A few hours', 'A few days', 'A few weeks', 'A couple of months'], a: 1,
      cue: '「go away for」のすぐあと。',
      line: 'I go away for *a few days*, I come back…',
      said: '「数日留守にして、帰ってきたら…」と想像を話す。',
      mean: 'a few days ＝ 数日。ほんの少し留守にしただけで、という強調。',
      trap: 'a few は聞こえても、次の単位を落としやすい。days の「デイ」の長い母音を聞く。',
      use: 'I’ll be away for a few days.（数日留守にします）' },

    // R fix: V1 + V2 (blind 85 %): the key ("Ross's real situation") and the cue rested on the title (that Rachel already
    //   lives with him), which the audio never says. The key is now what the words show: she paints his own idea at
    //   its worst, in front of him.
    // why: mocking Joey ← she follows Ross's laugh at Joey's idea, so it's heard as joining in; knows ← her picture
    //   is so exact it sounds like a hint, but "So, what did you tell him?" is a plain question
    { id: 'h1', skill: 'humor', level: 'C1', point: 'irony', reveals: ['outcome'], seg: [32.6, 39.5],
      stem: 'Why does Mona’s picture of coming home get a laugh?',
      choices: ['It’s Ross’s own idea, at its very worst', 'She’s making fun of Joey for suggesting it',
                'She’s hinting that she already knows more'], a: 0,
      cue: '「my boyfriend」のあと、誰の話と重なるか。',
      line: 'my *boyfriend is living with some woman he got pregnant*.',
      said: '「留守の間に、彼氏が妊娠させた女と住んでたら？」と例を話す。',
      mean: 'それは Ross が持ち出した案そのもの。本人を前に、知らずに最悪の形で言い直している。',
      trap: '笑う相手を Joey と取りやすいが、Joey は話に出てこない。誰の状況と同じかを考える。',
      use: 'If only you knew.（知らぬが仏だね）' },

    // R fix: K1: "No, that would never happen to you" reassures; it doesn't share her "unthinkable". The key is now
    //   the agreeing reply a rhetorical "could you imagine?" asks for.
    // why: "I can picture it" ← answers the question's form (can you imagine = 想像できる？); "fine for a while" ←
    //   takes it as a real invitation to weigh the idea, which is what Ross would like
    // anchor: 33.3–38.1 s "could you imagine?" is followed by a picture built to sound outrageous ("some woman he got
    //   pregnant"), so it's a rhetorical "that would be unthinkable", and the reply has to agree with that
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'imagine', reveals: ['outcome', 'fewdays'], seg: [32.6, 39.5],
      stem: 'Which reply from Ross would match what Mona means by “could you imagine?”',
      choices: ['“I know. That would be crazy.”', '“Yes, I can picture that pretty easily.”',
                '“Well, it might be fine for a while.”'], a: 0,
      cue: '質問の形でなく、そのあとの例の中身。',
      line: '*Could you imagine?* I go away for a few days, I come back…',
      said: '「想像できる？」と言ってから、ありえないような例を一気に話す。',
      mean: 'Can/Could you imagine? は「ありえないよね」という同意待ち。答えは考えでなく、相手への同意。',
      trap: '質問の形に「はい、できる」と答えたくなる。修辞的な問いには、言葉でなく気持ちに返す。',
      use: 'Can you believe it? — I know, right?（信じられる？ ― ほんとだよね）', retired: true },

    // R fix: V1 + K2: "hadn't given Joey any answer yet" was refuted only by the title. "Still laughing at the idea"
    //   (whisper hears the reply as "hoo, hoo") replaces it; the why and the notes no longer lean on the title.
    // EAR CHECK (header): the reply is a non-word
    // why: said no ← "Mhm" heard as a yes, as if confirming he turned Joey down; still laughing ← the "hoo, hoo"
    //   heard as more of the joke; "what did you tell him?" asks for words, and none come
    { id: 'i2', skill: 'infer', level: 'C1', point: 'dodge', reveals: ['outcome'], seg: [42.6, 48.5],
      stem: 'What does Ross’s response to Mona’s last question suggest?',
      choices: ['He’s avoiding giving her a real answer', 'He’s letting her know he told Joey no',
                'He still finds Joey’s idea too funny'], a: 0,
      cue: '質問のあと、言葉になっているかどうか。',
      line: 'So, *what did you tell him?* — …',
      said: '「で、Joey に何て言ったの？」と聞かれ、言葉にならない声しか返さない。',
      mean: '何と答えても本心が出てしまう。声だけでごまかし、話を流している。',
      trap: 'Mhm を「うん、断った」と取りやすいが、「何て言った？」に答えていない。',
      use: 'Uh… what were we talking about?（えーと…何の話だっけ？）' },
  ]
};
