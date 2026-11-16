// “How to Catch a Possum According to Andy | Parks and Recreation” (the official Parks and Recreation channel, Season 2):
// a local reporter interviews Andy about catching a possum on the golf course; his story wanders to animal friends and
// to Ann, who has just thrown him out.
// Segments from the captions, words from whisper (2026-11-16). Whisper and the captions agree on every keyed line
// (the captions misspell the reporter's name). Whisper's “Thank you so much for joining us” from 97.5 s is a
// hallucination over the end card; nothing is built on it.
// REVIEW 2026-11-16: pass 9, fix 10, drop 0, new 0; ear checks 1
// EAR CHECK: 63.3 s a1 — “Well, your family must be very proud” is dry, not sincere (key rests on tone; it follows “good at tag”)
import type { Clip } from '../types.ts';

export const possum: Clip = {
  id: 'possum', video: 'lMc0jj-kNCM', title: 'How to Catch a Possum According to Andy', dur: 118, wpm: 197,
  band: 'mid', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: agreeing ← Japanese そうですね as a yes before adding detail; remembering ← well as えーと
    { id: 'm1', skill: 'marker', level: 'B2', point: 'well', reveals: ['believe'], seg: [14.1, 20.75],
      stem: 'What does the first word of the reply to “…you see Fairway Frank” do?',
      choices: ['It gently corrects the question', 'It buys time to remember', 'It agrees, then adds detail'], a: 0,
      cue: '質問への答えの、最初の短い一語。',
      line: '*Well*, we see a possum that we believe to be Fairway Frank.',
      said: '「ええと、フランクだと思われるポッサムを見たんです」と答える。',
      mean: 'この well は相手の言い方を少し直す前置き。「正確には…」に近い。',
      trap: 'well を「えーと」や「そうですね」と取りやすい。well のあとで相手の言葉を言い換えたら訂正。',
      use: 'Well, it’s more of a suggestion.（まあ、どちらかというと提案かな）' },

    // R fix: the key was the only hedged choice (K6); the new third choice is hedged too, and refuted by "a possum"
    // why: named it ← "Frank" heard as their own name for it; two possums ← "a possum" and "Frank" heard as two animals
    { id: 'i1', skill: 'infer', level: 'B2', point: 'believe', seg: [14.1, 20.75],
      stem: 'What does the answer suggest about the animal they saw?',
      choices: ['They aren’t sure it’s really Frank', 'They gave the possum the name Frank',
                'They may have seen two possums'], a: 0,
      cue: '「possum that we」のあとの動詞。',
      line: 'we see a possum that we *believe to be* Fairway Frank.',
      said: '「フランクだと思われるポッサム」と、慎重に言う。',
      mean: 'believe to be ＝ 〜だと思われる。確かめていないので言い切らない言い方。',
      trap: 'Frank が聞こえると名付けたように取りやすい。believe は「信じる」より「たぶん〜だ」に近い。',
      use: 'We believe it’s the right address.（たぶん正しい住所だと思います）' },

    // R fix: "Just" marked the key as the only hedged choice (K6); "Just Frank" carries it too
    // why: Fairway Frank ← the name is said twice, the reporter's word; Just Frank ← "just" kept, the name half-heard
    { id: 'd1', skill: 'detail', level: 'B1', point: 'refer', reveals: ['believe'], seg: [14.1, 23.45],
      stem: 'After the reporter’s first question, what is everyone asked to call the animal?',
      choices: ['Just a possum', 'Just Frank', 'Fairway Frank'], a: 0,
      cue: '「for right now」のあと、何と呼ぶか。',
      line: 'So, for right now, let’s just refer to it as *a possum*.',
      said: '「今のところは、ただのポッサムと呼びましょう」と言い直させる。',
      mean: 'refer to it as ＝ 〜と呼ぶ。名前の付いた有名な一匹かどうか、まだ言い切らない。',
      trap: '名前が2回出るので耳に残りやすい。as のあとが、どう呼ぶかの答え。',
      use: 'Let’s just call it a draft for now.（今のところは下書きと呼ぼう）' },

    // R fix: "learned how from rats" wasn't a coherent reading of the story (K3/V2); now "stayed calm, as trained"
    // why: planned it ← a step-by-step story is the usual "how to" script; trained ← "the pit" year read as practice for it
    { id: 'g1', skill: 'gist', level: 'B2', point: 'story', reveals: ['act'], seg: [14.1, 62.3],
      stem: 'What does Andy’s account of the catch mostly show?',
      choices: ['He just acted, without thinking', 'He planned it out step by step',
                'He stayed calm, as he’d been trained'], a: 0,
      cue: 'アンディが何度もくり返す言葉に注意。',
      said: '捕まえ方を聞かれ、考える暇はなかった、ただ動いた、と自慢げに話し、動物の話へそれていく。',
      mean: '作戦の話ではなく、とっさに動いたことを手柄にしている。',
      trap: '穴での一年の話が長いので、訓練の話に取りやすい。それは怖くなかった理由として出てくるだけ。',
      use: 'I didn’t plan it. It just happened.（計画したわけじゃない。そうなっただけ）' },

    // why: asking her to explain ← "explain" + "you" heard as "explain to me"; excusing ← a long answer follows
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'explain', seg: [23, 29.9],
      stem: 'When Andy starts his answer to the reporter, what is he doing?',
      choices: ['Taking the expert’s role', 'Asking her to explain herself', 'Excusing a long answer ahead'],
      a: 0,
      cue: 'アンディの最初の一文と、相手の呼び方。',
      line: '*Let me explain something to you*, Tweep.',
      said: '「ひとつ説明してあげよう、トゥイープ」と始め、考える時間はないと言う。',
      mean: '相手を名字で呼び、教える側に立つ言い方。少し偉そうに聞こえる。',
      trap: 'explain と you から「説明して」と頼んでいるように取りやすい。Let me は自分がする合図。',
      use: 'Let me tell you something about this town.（この町のこと、教えてあげる）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'notime', seg: [27.3, 30],
      stem: 'Type what Andy says: “You ___.” (5 words)', answer: "don't have time to think",
      cue: '「situation」のあと、少し間があってから。', line: 'you *don’t have time to think*.',
      said: '「そういう場面では、考えている時間はない」と言う。',
      mean: 'don’t have time to ＝ 〜している暇はない。',
      trap: 'don’t の t が消えて「ドン」と聞こえ、have とつながる。to も弱く「タ」に近い。',
      use: 'I don’t have time to eat lunch.（お昼を食べる時間がない）' },

    // why: think first ← the order flipped, "think" heard first; don't panic ← the usual advice in a crisis
    { id: 'd2', skill: 'detail', level: 'B1', point: 'act', seg: [27.4, 35.4],
      stem: 'What did Andy tell himself to do?',
      choices: ['Don’t think, just act', 'Stop and think first', 'Don’t panic, just act'], a: 0,
      cue: '「I thought to myself」のあと、短い2つの命令。',
      line: 'So, I thought to myself, “*Don’t think*, Andy. *Act*.”',
      said: '「考えるな、アンディ、動け」と自分に言い聞かせた、と話す。',
      mean: '短い命令を2つ並べ、とっさに体が動いた様子を自慢げに語っている。',
      trap: 'think が先に聞こえるので「まず考えろ」と取りやすい。don’t の弱い音を聞き落とさない。',
      use: 'Don’t think about it. Just go.（考えないで、行っちゃえ）' },

    // R fix: the key was the only choice about thinking (V2); "ashamed he didn't think" now competes with it
    // why: mocking her ← "So, you weren't thinking?" is her question, read as the target; ashamed ← the usual reading of admitting it
    { id: 'h1', skill: 'humor', level: 'C1', point: 'little', reveals: ['act'], seg: [35.1, 42.75],
      stem: 'Why is Andy’s answer to “So, you weren’t thinking?” funny?',
      choices: ['He’s proud of not thinking at all', 'He’s mocking the reporter’s question',
                'He’s ashamed he didn’t think first'], a: 0,
      cue: '短い返事のあと、強調する長い一文。',
      line: 'I cannot emphasize enough *how little I was thinking*.',
      said: '「どれだけ考えていなかったか、強調しきれない」と言う。',
      mean: '普通は隠したいことを、手柄のように強く言う。そのずれが笑いになる。',
      trap: '考えていなかったと認めるので反省に聞こえやすい。cannot emphasize enough は胸を張る言い方。',
      use: 'I can’t thank you enough.（感謝してもしきれません）' },

    // why: no time ← "don't have time" said earlier, in the wrong relation; someone else ← "we" in the story
    { id: 'd4', skill: 'detail', level: 'B2', point: 'pit', seg: [42.3, 53.2],
      stem: 'Why does Andy say he wasn’t scared?',
      choices: ['He’s used to animals like that', 'He had no time to feel scared', 'Someone else did the hard part'],
      a: 0,
      cue: '「No, no, I wasn’t」のあと、去年の話。',
      line: 'I lived in the pit… and made some *vermin friends*.',
      said: '去年はほとんど穴の中で暮らしていて、害獣の友だちができた、と話す。',
      mean: '直接「慣れている」とは言わず、去年の話をして理由にしている。',
      trap: '前に出た「考える時間はない」と結びつけやすい。Well のあとに理由が続くことが多い。',
      use: 'I grew up with dogs, so I’m fine.（犬と育ったから平気）' },

    // R fix: "the good part of last year" also means most of it, so it was a second key (K1); now "the best months"
    // why: best months ← "better" read as quality; a few weeks ← "part" heard as "a small part"
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'betterpart', reveals: ['pit'], seg: [43.8, 50.3],
      stem: 'How long does Andy say he lived in the pit?',
      choices: ['For most of last year', 'During the best months of last year', 'For a few weeks last year'], a: 0,
      cue: '「in the pit」のあと、last year の前。',
      line: 'I lived in the pit *for the better part of* last year',
      said: '「去年の大半は穴の中で暮らしていた」と言う。',
      mean: 'the better part of ＝ 〜の大部分。時間や量が「ほとんど」のときに使う。',
      trap: 'better を「良い」と取ると「良い時期」に聞こえる。the better part of で「大半」。',
      use: 'I waited the better part of an hour.（1時間近く待った）' },

    // R fix: the stem quoted "friends", and "forgets the word" was weak (S2/V2); now "admits they weren't friends"
    // why: weren't friends ← the replacement read as taking "friends" back; insults her colleagues ← she's a reporter with coworkers
    { id: 'h2', skill: 'humor', level: 'C1', point: 'colleagues', reveals: ['pit'], seg: [50.5, 56.8],
      stem: 'Why does the audience laugh at Andy’s one-word correction?',
      choices: ['He picks a job word to sound less silly', 'He admits they weren’t really friends',
                'He insults the reporter’s colleagues'], a: 0,
      cue: '「Friends は変」と言ったあとの一語。',
      line: 'You know what? Friends sounds stupid. *Colleagues*.',
      said: '「友だちって言うとばかみたいだ。同僚だ」と言い直す。',
      mean: '動物を仕事仲間の言葉で呼ぶほうが、かえっておかしい。言い直しが笑いどころ。',
      trap: 'colleagues は記者にも関係しそうな語なので、記者の話に取りやすい。だれのことを言い直したかを追う。',
      use: 'You know what? Let’s just order pizza.（そうだ、ピザ頼もう）' },

    // why: sharing ← said, but as what they're bad at; finding food ← what you'd expect animals to be good at
    { id: 'd3', skill: 'detail', level: 'B1', point: 'tag', seg: [57, 62.3],
      stem: 'What does Andy say the animals are good at?',
      choices: ['Playing tag', 'Sharing things', 'Finding food'], a: 0,
      cue: '「but」のあと、good at に続く短い語。',
      line: 'they are bad at sharing, but they are *good at tag*.',
      said: '「分け合うのは苦手だけど、鬼ごっこは得意」と言う。',
      mean: '動物を子どもの遊び仲間のように話していて、それがおかしい。',
      trap: 'sharing も聞こえるので選びやすい。but の前は苦手なこと、あとは得意なこと。',
      use: 'I’m bad at names, but good at faces.（名前は苦手だけど顔は覚える）' },

    // R fix: the stem named "tag", d3's key (N7/S1); "envious" was weak (K3), now "worried"
    // why: impressed ← "proud" taken at face value; worried ← "your family" heard as concern for him
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'proud', seg: [57, 64.5],
      stem: 'After Andy’s animal story, how does the reporter’s next remark sound?',
      choices: ['Dry: she’s quietly making fun of him', 'Warm: she’s honestly impressed by him',
                'Worried: she thinks he needs help'], a: 0,
      cue: '「Well, your family」で始まる一言。直前の話との差。',
      line: 'Well, your family *must be very proud*.',
      said: '動物と鬼ごっこの話のあとで「ご家族はさぞ誇らしいでしょうね」と言う。',
      mean: '中身とほめ言葉が合わないので、皮肉になる。must be は「さぞ〜でしょう」。',
      trap: 'proud だけ聞くと本気でほめているように取れる。直前の話と比べて本気かどうかを決める。',
      use: 'Wow, you must be so proud.（わあ、さぞ誇らしいでしょうね）' },

    // why: scared after all ← "Were you scared?" earlier; leave Ann out ← Ann comes up and the topic is awkward
    { id: 'g2', skill: 'gist', level: 'B2', point: 'hope', seg: [62.2, 93],
      stem: 'How does the talk change near the end?',
      choices: ['Andy starts hoping to get Ann back', 'Andy admits he was scared after all',
                'Andy asks the paper to leave Ann out'], a: 0,
      cue: '恋人の話が出たあと、アンディの声と言葉の変化。',
      said: '恋人の話になり、追い出されたと話すが、記事で気が変わるかもと言われて驚く。',
      mean: 'ポッサムの話が、アンとよりを戻せるかもしれないという期待に変わる。',
      trap: 'アンの話は気まずそうなので「書かないで」と頼むと取りやすい。最後の Wow のあとの中身を聞く。',
      use: 'Maybe this will change her mind.（これで彼女の気が変わるかも）' },

    // R fix: "who really ended things" told the learner the first answer was false (S1/V2); "really" is gone
    // why: Andy ended it ← "I broke up with Ann" taken at face value; a break ← "anymore" heard as "for now"
    { id: 'i3', skill: 'infer', level: 'C1', point: 'brokeup', reveals: ['kickedout'], seg: [64.2, 74],
      stem: 'From Andy’s answer about his girlfriend, who ended things?',
      choices: ['Ann did, when she sent him away', 'Andy did, and then he moved out',
                'Neither; they’re just on a break'], a: 0,
      cue: '「I broke up with」のあと、Yeah で続ける話。',
      line: 'I broke up with Ann. Yeah, shortly after *she kicked me out*…',
      said: '「アンとは別れた。うん、追い出されて、もう一緒にいないと言われた後に」と言う。',
      mean: '自分から別れたように言うが、続きを聞くと決めたのはアン。',
      trap: '最初の一文だけで判断しやすい。Yeah, shortly after… の付け足しに本当のことが出る。',
      use: 'Actually, she broke up with me.（実はふられたんだ）' },

    // why: hit him ← "kick" read literally as 蹴る; moved out on him ← the leaving reversed
    { id: 'p2', skill: 'phrase', level: 'B1', point: 'kickedout', reveals: ['brokeup'], seg: [68, 74],
      stem: 'What did Ann do, shortly before the break-up?',
      choices: ['She made him move out', 'She hit him and walked off', 'She moved out on him'], a: 0,
      cue: '「shortly after she」のあとの動詞。',
      line: 'shortly after she *kicked me out*',
      said: '「彼女に家を追い出された」と言う。',
      mean: 'kick someone out ＝ 家や店などから追い出す。足で蹴るわけではない。',
      trap: 'kick を「蹴る」と文字通りに取りやすい。kick … out の形なら「追い出す」。',
      use: 'They kicked us out at closing time.（閉店時間に追い出された）' },

    // R fix: "I had even" isn't a natural option (K3); now "I'd never even". reveals list: its line says he'd never thought of it
    // why: haven't ← v and d both short before "even"; I'd never ← the n of hadn't heard, "even" pulling a "never" in
    { id: 's1', skill: 'sound', level: 'B2', point: 'hadnt', reveals: ['list'], seg: [78.9, 82.7],
      stem: 'Fill the gap: “___ thought of that.”',
      choices: ['I hadn’t even', 'I haven’t even', 'I’d never even'], a: 0,
      cue: '「What now?」のあと、文の最初の短い音。',
      line: '*I hadn’t even* thought of that.',
      said: '「それは考えてもいなかった」と驚く。',
      mean: 'hadn’t の t は消え、「ハドゥン」と聞こえる。d が残れば had、v なら have。',
      trap: 'n’t の t が消え、never とも聞き違えやすい。I のあとの「ハ」と、d か v かの子音を聞く。',
      use: 'I hadn’t even noticed.（気づいてもいなかった）' },

    // R fix: the key was the only positive choice (V2/K6); "amused, finding it silly" now competes with it
    // why: annoyed ← "What now?" heard as irritation; amused ← "never on that list" read as laughing the idea off
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'hope', seg: [78.9, 90.6],
      stem: 'When the article is linked to Ann, how does Andy react?',
      choices: ['Touched, and suddenly hopeful', 'Annoyed that Ann came up again', 'Amused, finding the idea silly'],
      a: 0,
      cue: '「Wow」のあと、何が二人を戻すと言うか。',
      line: '*Wow.* Of all the things I thought would *bring us back together*…',
      said: '「わあ。よりを戻すきっかけになると思ったものの中に…」と言う。',
      mean: 'bring us back together から、復縁への期待がふくらんでいる。',
      trap: 'What now? はいらだちに聞こえやすいが、ここは驚き。続く Wow と中身で決める。',
      use: 'This could bring us back together.（これでよりが戻るかも）' },

    // why: wrote it down ← "list" read literally; tried before ← "all the things I thought"
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'list', reveals: ['hope'], seg: [82.7, 90.6],
      stem: 'How does Andy describe catching a possum as a way to get Ann back?',
      choices: ['As something he never imagined', 'As something he’d written down', 'As something he’d tried before'],
      a: 0,
      cue: '文の最後の3語。',
      line: 'catching a possum was *never on that list*.',
      said: '「ポッサムを捕まえることは、そのリストには入っていなかった」と言う。',
      mean: 'never on the list ＝ 考えてもみなかった。実際のリストがあるわけではない。',
      trap: 'list を文字通り「書いた表」と取りやすい。頭の中の候補を言うときにも使う。',
      use: 'Paris was never on my list.（パリは考えたこともなかった）' },
  ]
};
