// “Ron Swanson Doesn't Regret Punching Jeremy Jamm | Parks and Recreation” (the official Parks and Recreation channel,
// Season 5): at a deposition, Tom takes back his earlier story and recalls Ron's many punch remarks; Ron's own
// statement makes it worse, and Jamm leaves delighted.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 119 s. Speakers are settled by "Tom"
// (56.8 s), "Ron" (44.8 s), "Mr. Swanson" (78.8 s) and "Swanson" (111.4 s, Jamm's "see you in court"). Untested: the
// dental "trade" memory (20–26 s, a body-part joke), 50.6–51.7 s ("We get the picture, son" vs whisper "so"), 44.5 s
// ("What's that" vs "What's up"), and who says "Keep going, Tom" / "Thank you, Ms. Ludgate".
// REVIEW 2026-11-16: pass 5, fix 18, drop 0, new 0; ear checks 0
// Open: nt1's segment is 21 s (C2 paraphrase of the whole statement; can't be shorter).
// R: removed the s1 and x1 ear checks: both sources agree on "that'll make" and "could use a" (rubric addendum).
import type { Clip } from '../types.ts';

export const ronNoRegret: Clip = {
  id: 'ronjamm', video: 'SN0rWCCtHD0', title: 'Ron Swanson Doesn\'t Regret Punching Jeremy Jamm', dur: 132, wpm: 156,
  band: 'mid', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2. "never heard" and "joke" were easy to rule out; both distractors now keep the charge and change who
    //   meant harm or how Tom knows
    { id: 'g2', skill: 'gist', level: 'B2', point: 'recant', seg: [0.3, 16.5],
      stem: 'What does Tom now tell the hearing about Ron?',
      choices: ['That he did hear Ron say he meant to hurt Jamm', 'That he did hear Ron say Jamm meant to hurt him',
                'That he heard from others that Ron meant to hurt Jamm'], a: 0,
      cue: '「in fact」のあと、何を聞いたと言うか。',
      line: 'I did, *in fact*, hear Ron Swanson say *he intended to injure* Jeremy Jamm.',
      said: '前の証言を変え、「ロンがジャムを傷つけるつもりだと言うのを、実は聞いた」と話す。',
      mean: '撤回はロンに不利な方向。聞いていないと言っていたのを、聞いたと改めた。',
      trap: 'he の指す人や伝聞と取りやすい。I did hear と名前で決める。',
      use: 'I’d like to correct what I said earlier.（さっき言ったことを訂正したいです）' },

    // R fix: V2. "misled" and "missed" were weak; the choices are now parallel mis- verbs (remember/hear/say)
    // why: misheard ← "mis-" plus a verb, heard as hearing; misspoke ← "mis-" heard as a slip of the tongue, the usual excuse
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'misremember', seg: [4.3, 7.4],
      stem: 'How does Tom explain why his story has changed?',
      choices: ['He says he had remembered some things wrong', 'He says he had heard some things wrong',
                'He says he had said some things wrong'], a: 0,
      cue: '「Yes」のすぐあと、長めの一語。',
      line: 'Yes, I *misremembered* some things.',
      said: '「いくつか記憶違いをしていました」と答える。',
      mean: 'misremember ＝ 覚え違える。うそをついたとは言わずに証言を変える、角の立たない言い方。',
      trap: 'mis- だけで「聞き違い」「言い違い」と決めやすい。mis- のあとの動詞まで一語で聞く。',
      use: 'Sorry, I must have misremembered the time.（すみません、時間を覚え違えたみたい）' },

    // why: startled ← a short loud outburst can be shock; annoyed ← "knew it" heard as "I've heard this before"
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'boom', seg: [7.4, 14.3],
      stem: 'Right after Tom’s new account, how does the first reaction sound?',
      choices: ['Triumphant: he had expected this all along', 'Startled: he had not seen this coming at all',
                'Annoyed: he had heard this story too often'], a: 0,
      cue: 'Jamm の名前のすぐあと、短い二語。',
      line: '*Boom*, *knew it*.',
      said: '証言を聞いて「よし、やっぱりな」と声を上げる。',
      mean: 'Boom は「決まった」という勝ちの合図。knew it は「思ったとおり」。予想が当たって喜んでいる。',
      trap: '大きな短い声は驚きにも聞こえるが、knew it は前から分かっていたという意味。',
      use: 'Boom! Knew you’d say yes.（よし！イエスって言うと思った）' },

    // R fix: V2. "forgotten" and "which hearing" were weak; all three choices now say something happened often,
    //   and differ in who did it. S4: segment starts at 7.4 s so it holds what "it" is
    { id: 'h1', skill: 'humor', level: 'C1', point: 'whichtime', seg: [7.4, 18.8],
      stem: 'Asked to tell them about it, why is Tom’s short reply funny?',
      choices: ['Ron said it so often that one story won’t do', 'Tom has told it so often he’s lost count himself',
                'They have asked so often that Tom is fed up'], a: 0,
      cue: '「please」のあとの短い質問と、その返し。',
      line: 'Tell us about it, please. — *Which time?* — Well, *how many were there?*',
      said: '「話して」と言われ「どの時の？」と聞き返し、相手は「何回あったの？」と驚く。',
      mean: '一回の話のつもりが、何回もあったと分かる。',
      trap: '答えたのがトムなので、くり返したのもトムと取りやすい。何度もあったのは、直前の「ロンが言った」こと。',
      use: 'Which time? There were a few.（どの時の？何回かあったよ）' },

    // R fix: V2. the key was the only odd-sounding reason; the choices now differ only in "never met" / "just met" /
    //   "met once"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'nevermet', reveals: ['coulduse'], seg: [25.6, 33.7],
      stem: 'In the first memory, why is the punch remark funny?',
      choices: ['He wants to hit a man he has never met', 'He wants to hit a man he has only just met',
                'He wants to hit a man he met once, years ago'], a: 0,
      cue: '「You don’t know him?」への答えと、その次の一言。',
      line: 'You don’t know him? — *Never met him*. He looks like he could use a swift punch…',
      said: '「知らないの？」「会ったこともない。でも一発殴られたほうがいい顔だ」と言う。',
      mean: '知らない相手を見ただけで殴りたいと言う、理由のなさがおかしい。',
      trap: 'never の n が弱く、just met などに聞こえやすい。否定の一語は文頭で聞く。',
      use: 'Never met him, but he seems nice.（会ったことないけど、いい人そう）' },

    // A reduced stretch, both sources agree
    { id: 'x1', skill: 'dict', level: 'B2', point: 'coulduse', seg: [30.4, 33.7],
      stem: 'Type the gap: “He looks like he ___ swift punch in the face.” (3 words)', answer: 'could use a',
      cue: '「looks like he」のすぐあと、弱くつながる三語。',
      line: 'He looks like he *could use a* swift punch in the face, though.',
      said: '「一発殴られたほうがいい顔だ」。could use a が「クッジューザ」とつながる。',
      mean: 'could use ＝ 〜があるとよさそう。コーヒーや休みに使う言い方を殴る話に当てている。',
      trap: 'd が「ジュ」に変わり、a はほぼ消える。弱い a も書く。',
      use: 'I could use a coffee.（コーヒー1杯飲みたいな）' },

    // R fix: V2. "jumped in" was weak; all three now use "shoved" and differ in what or whom
    // why: past the man ← "run over, shove" heard as rushing past him; chair ← "him" is weak and easy to lose before "into"
    { id: 'd6', skill: 'detail', level: 'B1', point: 'pool', seg: [34.9, 38.8],
      stem: 'In the pool story, what does the speaker say he did?',
      choices: ['Shoved the man into the pool', 'Shoved past the man to the pool',
                'Shoved the man’s chair into the pool'], a: 0,
      cue: '「run over」のすぐあとの動詞。',
      line: 'I just run over, *shove him into the pool*.',
      said: '「相手が何か言う前に走っていって、プールに突き落とす」と話している。',
      mean: 'shove ＝ 強く押す。殴ってはいない、という点が次のロンの返事につながる。',
      trap: 'him が弱く短いので、押した相手を聞き落としやすい。動詞のすぐあとの小さな代名詞まで聞く。',
      use: 'Don’t shove, there’s room for everyone.（押さないで、みんな入れるから）' },

    // why: bully ← the word taken literally (いじめっ子); sincere praise ← "good for you" read at face value, missing
    //   "If it were me…"
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'bully', seg: [38.3, 42.3],
      stem: 'What does Ron’s first reply to the pool story mean?',
      choices: ['Good for you, though I’m not impressed', 'You were a bully to the man you pushed',
                'Good for you; that took real courage'], a: 0,
      cue: '返事の直後に続く「If it were me」。',
      line: '*Bully for you*. If it were me, I would have just punched him in the face.',
      said: '「そりゃよかったな。俺なら顔を殴ってた」と返す。',
      mean: 'Bully for you ＝ 古い「よかったね」。ここは感心していない軽い皮肉。',
      trap: 'bully を「いじめる」と取りやすい。古い決まり文句は、後ろの一言で本気か皮肉かを決める。',
      use: 'You finished early? Well, bully for you.（早く終わった？そりゃよかったね）' },

    // R fix: V2. "dream" distractor gave the key away; new distractors read "Just…" as a plan or a joke
    { id: 'd3', skill: 'detail', level: 'B1', point: 'daydream', seg: [44.0, 48.6],
      stem: 'In the next memory, what does Ron say he is doing?',
      choices: ['Daydreaming about hitting Jamm', 'Deciding whether to hit Jamm', 'Joking about hitting Jamm'], a: 0,
      cue: '「Ron」と呼ばれたあとの最初の語。',
      line: 'Just *daydreaming* about punching Jamm in the face.',
      said: '声をかけられ、「ジャムの顔を殴るのを空想してただけ」と答える。',
      mean: 'daydream ＝ 起きたまま思いうかべる空想。何度も殴る話をしていた証拠の一つになる。',
      trap: 'Just で「冗談だよ」と流したと取りやすい。Just のあとの長い一語を聞く。',
      use: 'Sorry, I was just daydreaming.（ごめん、ぼーっとしてた）' },

    // R fix: V2. "pictures" was absurd and "try" in the stem hinted at a failed stop; stem and distractors rewritten
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'picture', seg: [48.9, 52.7],
      stem: 'After Tom mentions “a few other times”, what does the next line do?',
      choices: ['Signals that they have heard enough examples', 'Asks which of the examples matters the most',
                'Signals that the examples are hard to follow'], a: 0,
      cue: '「too」のすぐあと、別の人の短い一言。',
      line: '*We get the picture*… — Uh, hold on.',
      said: '「もう分かった」と止めかけ、すぐ別の人に「待って」と言われる。',
      mean: 'We get the picture ＝ もう十分分かった。話を切り上げる。',
      trap: 'picture を「見えない」と取りやすい。get the picture は「分かった」の意味。',
      use: 'Okay, I get the picture. Thanks.（はい、だいたい分かりました）' },

    // R fix: V2/S2. the stem quoted "says a lot of things", which pointed at says-vs-does; stem now names the
    //   moment, and the distractors use words that are said (Councilman, the government, Tom as witness)
    { id: 'i2', skill: 'infer', level: 'C1', point: 'didit', seg: [60.4, 73.5],
      stem: 'Why does the defense that follows Tom’s summary fall flat?',
      choices: ['Ron’s words were followed by a real punch', 'Ron’s words were heard by a sworn witness',
                'Ron’s words were aimed at an elected official'], a: 0,
      cue: '直前のまとめの最後、短い三語。',
      line: '…punch Councilman Jamm in the face, *and then he did*. — Yeah, but who cares? He says a lot of things.',
      said: 'まとめが「殴ると言い、実際に殴った」で終わり、そこへ「口だけの人だ」と返す。',
      mean: '口だけの例に「政府を倒す」を出すが、今回は実際に殴っている。',
      trap: 'Councilman が耳に残りやすい。never does と直前の he did を比べる。',
      use: 'He talks big, but he never does it.（口は大きいけど、やらないんだ）' },

    // why: that'd ← the contraction 'll heard as 'd; made ← past tense from the weak, dark l; may make ← "make a" heard
    //   with a softener
    { id: 's1', skill: 'sound', level: 'B2', point: 'thatll', seg: [73.3, 78.4],
      stem: 'Fill the gap: “Well, ___ a nice pull quote for the article…”',
      choices: ['that’ll make', 'that’d make', 'that made', 'that may make'], a: 0,
      cue: '「Well」のすぐあと、短い二語。',
      line: 'Well, *that’ll make* a nice pull quote for the article…',
      said: '「記事にいい一文になるな」。that’ll は「ザロー」に近く、l は暗く短い。',
      mean: 'that’ll ＝ that will。これから記事に使う、という未来の話。',
      trap: '’ll の l は日本語のラ行にならず、こもった音。d や過去形と聞きやすい。',
      use: 'That’ll be twenty dollars.（20ドルになります）' },

    // R fix: V2. "Impressed" was weak; replaced with "Offended", the reaction a victim would have to "who cares?"
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'pullquote', reveals: ['cleaners'], seg: [73.3, 78.4],
      stem: 'How does Jamm feel about the defense he just heard?',
      choices: ['Pleased: it will help him look like the winner', 'Worried: it will make the papers side with Ron',
                'Offended: it makes light of the punch he took'], a: 0,
      cue: '「article about」のあとの、誰が誰をどうするか。',
      line: 'a nice pull quote for the article about *me taking you to the cleaners*.',
      said: '「お前を打ち負かす記事にぴったりの一文だ」と言う。',
      mean: 'nice は皮肉に近い。相手の反論が、自分の勝ちを飾る材料になると喜んでいる。',
      trap: '軽く扱われた側なので怒りと取りやすい。about のあと、誰が誰をどうするかを聞く。',
      use: 'That quote is going straight in my article.（その一言、記事にそのまま使うよ）' },

    // R fix: V2. "money" in the key matched the lawsuit context and "clean up" was a giveaway literal; all three are
    //   now serious harms of similar length
    { id: 'p4', skill: 'phrase', level: 'C1', point: 'cleaners', seg: [73.3, 78.4],
      stem: 'In Jamm’s line about the article, what does he plan to do to Ron?',
      choices: ['Win big and take a lot of his money', 'Show him up in the papers for good',
                'Have him cleared out of his office'], a: 0,
      cue: '文の最後、店の名前のような一語。',
      line: '…about me *taking you to the cleaners*.',
      said: '「お前を身ぐるみはがす」という意味で言っている。',
      mean: 'take someone to the cleaners ＝ 大負けさせて大金を取る。裁判や賭けで使う。',
      trap: 'cleaners を「片づける」や article と結びつけやすい。形ごと覚える。',
      use: 'They took us to the cleaners at poker.（ポーカーでぼろ負けした）' },

    // R fix: V2. the title gave away "better, thanks to Ron"; choices now pair a direction with what Jamm does next.
    //   "sue" touches i4, so reveals checkbook
    { id: 'g1', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['checkbook'], seg: [78.3, 118.8],
      stem: 'By the end, how has the hearing gone for Jamm?',
      choices: ['Better than he hoped, and he plans to sue Ron', 'Better than he hoped, so he lets the matter drop',
                'Worse than he hoped, so he plans to sue Ron'], a: 0,
      cue: 'ロンの話が終わったあとの、最初の一言。',
      line: 'this turned out *better than I ever imagined*.',
      said: 'ロンの発言のあと、ジャムは「思った以上にうまくいった」と言い、法廷で会おうと告げる。',
      mean: 'ロン本人の話が相手の訴えを強めた。弁護のための発言が逆効果になった。',
      trap: 'ロンが堂々としていて逆に聞こえやすい。better のあとも法廷の話が続く。',
      use: 'That went better than I expected.（思ったよりうまくいった）' },

    // R fix: V2. "say sorry" was weak; replaced with "calm down", the other usual warning
    // why: fight back ← "back" is said ("back off"); calm down ← the usual warning before a fight
    { id: 'd5', skill: 'detail', level: 'B1', point: 'warned', seg: [82.0, 87.2],
      stem: 'What does Ron say he did before he hit Jamm?',
      choices: ['Told him again and again to back off', 'Told him again and again to fight back',
                'Told him again and again to calm down'], a: 0,
      cue: '「warned him」のあと、何をするように言ったか。',
      line: 'I *warned him several times to back off*…',
      said: '「殴った夜、何度も下がれと警告した」と話す。',
      mean: 'back off ＝ 引け、近づくな。先に止めた、と自分を守る言い方。',
      trap: 'back だけ聞くと fight back と混ざる。back off は「下がる」で、戦う意味はない。',
      use: 'Back off, please. Give me some space.（下がって、少し離れて）' },

    // R fix: V2. the key was the only three-part, "not sorry" choice; all three now end "not sorry" and differ in
    //   one step
    // C2 plain-English paraphrase
    // anchor: 82.5–102.4 s it opens like self-defense ("warned him… attacked me twice"), then "barely registered his
    //   attack… frail… arms are weak" removes the danger, and "I regret nothing" closes it
    // why: danger ← "warned him… he attacked me twice" taken as the point; barely touched ← "barely" heard on his own
    //   punch instead of on Jamm's attack
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'frail', reveals: ['twice'], seg: [82.0, 103.0],
      stem: 'Which plain-English version keeps what Ron’s statement adds up to?',
      choices: ['“He started it, he was no threat, and I’m not sorry.”',
                '“He started it, he was a danger, so I’m not sorry.”',
                '“He started it, I barely touched him, and I’m not sorry.”'], a: 0,
      cue: '最初の言い分と、そのあと相手について言うこと。',
      line: 'he *attacked me twice*. Truthfully, I *barely registered his attack*… *I regret nothing*. The end.',
      said: '先に襲われたと言ったあと、攻撃はほとんど感じず相手はひ弱だと続け、後悔はないで締める。',
      mean: '正当防衛の形で始め、危険はなかったと自分で崩す。弁明でなく、殴ってよかったという宣言になる。',
      trap: '最初の筋だけで正当防衛と取りやすい。barely は誰の何に付くか。前置きは最後の一言で読み直す。',
      use: 'He started it, but honestly, I enjoyed it.（あっちが先だけど、正直楽しかった）' },

    // why: once ← "him" before "twice" swallows the start; several times ← the warnings, said just before
    { id: 'n1', skill: 'number', level: 'B1', point: 'twice', seg: [84.6, 89.9], keep: true,
      stem: 'How many times does Ron say Jamm attacked him?',
      choices: ['Once', 'Twice', 'Three times', 'Several times'], a: 1,
      cue: '「attacked me」のすぐあと。',
      line: 'he *attacked me twice*.',
      said: '「なのに、あいつは2回襲ってきた」と言う。',
      mean: '自分は警告したのに、先に手を出したのは相手だ、という主張の数字。',
      trap: '直前の several times は警告の回数。数は、どの動詞に付いているかで聞き分ける。',
      use: 'I called you twice this morning.（今朝2回電話したよ）' },

    // R fix: V2. "fight was over" was weak; distractors now both misread "barely registered"
    { id: 'i3', skill: 'infer', level: 'C1', point: 'frail', seg: [89.9, 99.8],
      stem: 'What does Ron’s account of the attack end up admitting?',
      choices: ['The attack was never a real danger to him', 'The attack came too fast for him to see',
                'The attack was worse than he first let on'], a: 0,
      cue: '「Truthfully」から、相手の体の話まで。',
      line: 'I *barely registered his attack*. He’s *incredibly frail*…',
      said: '「正直、攻撃にほとんど気づかなかった。ひどくひ弱で腕も細い」と言う。',
      mean: '相手の弱さを笑うほど、殴る必要がなかったことを自分で認めてしまう。',
      trap: 'barely registered を「速くて見えない」と取りやすい。frail と weak が理由。',
      use: 'I barely noticed the rain.（雨にほとんど気づかなかった）' },

    // R fix: V2/K5. choices now parallel ("Ends …: …") so the key isn't the only measured one
    // why: hearing ← "the end" heard as a request to stop the whole meeting; gives up ← "the end" read as admitting the
    //   case is lost
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'theend', seg: [99.3, 103.6],
      stem: 'What does Ron’s final two-word sentence do?',
      choices: ['Ends his statement: he won’t say any more', 'Ends the hearing: he wants everyone to go',
                'Ends his case: he admits that he has lost'], a: 0,
      cue: '「I regret nothing」のすぐあと。',
      line: 'I regret nothing. *The end*.',
      said: '「後悔はない。以上」と締める。',
      mean: '物語の終わりの決まり文句を使い、質問は受けない、話は終わりと示している。',
      trap: 'end を会議や裁判の終わりと取りやすい。誰の話を終わらせているかを聞く。',
      use: 'We’re not going. The end.（行かない。以上）' },

    // R fix: V2. the key was the only wordplay choice; a "slip of the tongue" reading of the name now competes
    { id: 'h3', skill: 'humor', level: 'C1', point: 'selfjam', reveals: ['outcome'], seg: [102.8, 110.4],
      stem: 'Why is Jamm’s comment about Ron’s own team funny?',
      choices: ['He makes his own name into a verb for defeat', 'He mixes up Ron’s name with his own by mistake',
                'He says Ron is stuck, with no way out of the case'], a: 0,
      cue: '最後の一語の前半に、誰かの名前。',
      line: 'You got *jammed* by your own team. *Self-Jammed*.',
      said: '「自分の味方にやられたな。セルフ・ジャムだ」と言う。',
      mean: '自分の名前 Jamm を「やられる」の動詞にしている。しかも自分で作った言葉に満足している。',
      trap: 'jam の「詰まる」や言いそこないと取りやすい。名前と同じ音の動詞は名前遊びを疑う。',
      use: 'You got Steve-d. Classic Steve move.（スティーブにやられたね、いつものやつ）' },

    // R fix: V2. "jokes… light note" was weak; replaced with a wrong-target reading of "you"
    // C2 who is the joke on / what the line does
    // anchor: 63.3–67.6 s the case is "said he intended to punch Councilman Jamm in the face"; 114.5–116.2 s Ron says
    //   exactly that intent again, to Jamm, in the hearing ("see you in court", "self-jammed")
    // why: judge ← "you" heard as the person who invited his statement ("Mr. Swanson, if you'd like…"); first admission ←
    //   "punch you… again" heard as news, though he admitted the punch at 82.5 s
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'again', seg: [106.5, 117.3],
      stem: 'After Jamm mentions court, why is Ron’s answer the worst thing to say?',
      choices: ['He states, at the hearing, the very intent being proven',
                'He threatens, at the hearing, the man who will judge the case',
                'He admits, at the hearing, for the first time that he hit him'], a: 0,
      cue: 'さっきの証言のまとめと、同じ言葉が出る。',
      line: 'I’ll see you in court… — *I would like to punch you in the face again*.',
      said: '「法廷で会おう」と言われ、ロンは本人に「もう一度顔を殴りたい」と言う。',
      mean: '争点は「殴るつもりだと言ったか」。その意図を、聞き取りの場でまた口にしている。',
      trap: 'you を進行役と取りやすいが、again で前に殴った相手と分かる。殴ったことは前に認めている。言葉が争点に重なるかを聞く。',
      use: 'I would do it again, honestly.（正直、またやるね）' },

    // R fix: V2. "bank records" was weak; replaced with "pay now and skip court", the literal "bring it" reading
    { id: 'i4', skill: 'infer', level: 'B2', point: 'checkbook', reveals: ['cleaners'], seg: [110.3, 114.3],
      stem: 'What is Jamm telling Ron when he mentions court?',
      choices: ['Ron will lose in court and have to pay him', 'Ron should pay him now and skip the court',
                'Ron will need to pay a lot for a lawyer'], a: 0,
      cue: '「court」のあと、持ってこいと言う物。',
      line: 'I’ll see you in court, Swanson, and, uh, *bring your checkbook*.',
      said: '「法廷で会おう。小切手帳を持ってこい」と言う。',
      mean: '小切手帳を持ってこい ＝ 払う準備をしておけ。裁判に勝ってお金を取る、という予告。',
      trap: 'bring を「今すぐ払え」と取りやすい。先に see you in court があり、払うのは裁判のあと。',
      use: 'Dinner’s on you. Bring your wallet.（夕食はおごりね、財布持ってきて）' },
  ]
};
