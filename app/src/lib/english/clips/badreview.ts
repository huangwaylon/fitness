// “Monica Gets a Bad Review | Friends” (the official Friends channel, Best of Season 8): a friend has bought up every
// copy of the paper so Monica won't see a bad review; Joey recalls his own “good” review; Monica reads it, and her
// friends' comfort keeps going wrong, ending with Joey's “Your food is abysmal”.
// Segments from the captions, words from whisper (2026-11-16). Only Joey (by his own review, 15.3 s) and Monica (“Mon”
// 49.3 s, “Monica” 65.9 s) are named, so the copy-buyer is “the first speaker” or “a friend”. Untested on purpose:
// 56.1 s (whisper “His bad press?”, captions “is bad press”), 61.9 s (whisper “Was he right?”, captions “is he right”),
// and who says “I didn't write it” (59 s). Whisper loops “I'm saying it's the truth” from 72.5 s; talk ends at ≈ 72.5 s.
// EAR CHECK: 71.7 s h1 nt1 — “abysmal” ends “Your food is…” at ≈ 71.7–72.3 s (whisper); the captions stop at “your food
//   is” (71.7 s) and put a lone “abysmal” at 83.1 s, after the music
// EAR CHECK: 65–72.5 s h1 nt1 p4 — the speaker of “Hey, hey, Monica, you listen to me…” is Joey, the same voice that read
//   out “Joey Tribbiani was abysmal” (no name in that turn)
// REVIEW 2026-11-16: pass 4, fix 16, drop 0, new 0; ear checks 2 (unchanged)
// OPEN: h1/nt1 rest on Joey's review at 9–20 s, outside their segments (a callback; left as is)
import type { Clip } from '../types.ts';

export const badReview: Clip = {
  id: 'badreview', video: 'LJf5sSY_k2I', title: 'Monica Gets a Bad Review', dur: 85, wpm: 194, band: 'fast',
  tags: ['友だち', '職場'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2, blind 80 % right; "cheer her up" was the only other outcome. Now: pushing them away, or a quarrel.
    //   C5: its `said` named the ending as praise (h1's key); reworded.
    // why: wants to be alone ← "I'm so humiliated" read as a reason to withdraw; blame ← "I didn't write it" sounds
    //   like a quarrel over fault
    { id: 'g1', skill: 'gist', level: 'B2', point: 'help', seg: [0, 74],
      stem: 'How do the friends’ attempts to help Monica go?',
      choices: ['Each thing they try only makes her feel worse', 'She waves off their help, wanting to be alone', 'They argue among themselves over who’s to blame'], a: 0,
      cue: '慰めの言葉のあと、Monica がどう返すか。',
      said: '新聞を買い集める、「悪い評判なんてない」と言う、最後の一言。どれも Monica をかえって落ちこませる。',
      mean: '善意の励ましが、毎回裏目に出ていく場面。',
      trap: '明るい言葉が多いので救いがありそうに見えるが、Monica は話に乗り続け、返事は暗いまま。',
      use: 'I was just trying to help!（助けようとしただけなんだ！）' },

    // R fix: V2, blind 85 % right. A scope near miss (hiding it from everyone) replaces "hand them out".
    // why: souvenir ← buying many copies usually means a proud keepsake (Monica's own guess later); keep it from
    //   spreading ← the later "no one in a two-block radius will ever know", heard as the aim
    { id: 'd1', skill: 'detail', level: 'B1', point: 'copies', seg: [0, 5.7],
      stem: 'Why did the first speaker buy up the newspapers?',
      choices: ['To keep Monica from ever seeing it', 'To keep the review from spreading', 'To save copies of a big review'],
      a: 0,
      cue: '最初の「I didn’t want」に続く部分。',
      line: '*I didn’t want her to see it*, so I ran around the neighborhood and bought all the copies',
      said: '彼女に見せたくなくて、近所を回って見つかる限りの新聞を買った、と言う。',
      mean: 'ひどい批評を Monica の目に入れないための買い集め。',
      trap: '大量に買う＝記念に取っておく、と考えやすいが、理由は最初に言っている。',
      use: 'I didn’t want you to worry.（心配かけたくなかったんだ）' },

    // R fix: V2, blind 60 % right; "I have" didn't fit "my share". "I’ve heard" (had/heard) replaces it.
    // why: I had ← the 've disappears into "I" + h-dropped "had"; I'd had ← 've and 'd both reduce to a short stop;
    //   I've heard ← had/heard, both h- words with the vowel in the middle
    { id: 's1', skill: 'sound', level: 'B2', point: 'share', seg: [5.6, 9.5],
      stem: 'Fill the gap: “And ___ my share of bad reviews.”',
      choices: ['I’ve had', 'I had', 'I’d had', 'I’ve heard'], a: 0,
      cue: '「And」のあと、my の前の短い音。',
      line: 'And *I’ve had* my share of bad reviews.',
      said: '「悪い批評ならたくさん受けてきた」と言う。',
      mean: 'I’ve had ＝ これまでに経験してきた。現在完了の短縮形。',
      trap: 'v が弱く、had の h も落ちて「アイヴァッド」に近い。過去形 had と聞き分けにくい。',
      use: 'I’ve had a long day.（今日は長い一日だった）' },

    // R fix: V2, blind 70 % right; the distractors are now an overshoot and an undershoot of "my share".
    // why: more than anyone ← "share" heard as a big portion; one or two ← share = 分け前, a normal small piece
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'share', seg: [5.6, 9.7],
      stem: 'When Joey says he knows how bad reviews feel, what does he claim?',
      choices: ['He has had quite a few himself', 'He has had more than anyone he knows', 'He has had one or two, like anyone'],
      a: 0,
      cue: '「my share of」のあとの名詞と、前の動詞。',
      line: 'And I’ve had *my share of* bad reviews.',
      said: '「悪い批評はけっこう受けてきた」と言う。',
      mean: 'have had one’s share of ～ ＝ ～を人並み以上に経験してきた。苦労話の定番。',
      trap: 'share を「分け前」と取ると少し、強く取ると一番多いに聞こえる。実際は「それなりに多く」。',
      use: 'I’ve had my share of bad dates.（ひどいデートは何度も経験した）' },

    // R fix: V2/S2, blind 65 % right; the stem quoted "first good one", which gives the key. It now names the moment.
    //   The middle choice is now "another word for terrible", so the scale is worse / same / better.
    // why: worse ← the dictionary meaning, which a learner who knows the word picks without hearing "good one"; same
    //   ← "terrible… abysmal" heard as a list of synonyms
    { id: 'i1', skill: 'infer', level: 'C1', point: 'abysmal', seg: [9.2, 21], keep: true,
      stem: 'Judging by how Joey introduces the review, what does he think “abysmal” means?',
      choices: ['Even worse than “terrible”', 'Just another word for “terrible”', 'Much better than “terrible”'], a: 2,
      cue: '「good one」と言ってから読み上げる中身。',
      line: 'my *first good one*… Everything else… was simply *terrible*. Joey Tribbiani was *abysmal*.',
      said: '「初めての良い批評」として、自分が abysmal と書かれた記事を読む。',
      mean: '本当は terrible より悪い意味。本人は「ほかとは違う」ほめ言葉だと思っている。',
      trap: '単語の意味を知っていると辞書の意味を選びやすい。問いは「彼がどう思っているか」。',
      use: 'I think that was a compliment?（あれ、ほめ言葉だよね？）' },

    // anchor: 9.7–11.1 s "I still remember my first good one, though", then 11.7–20.3 s the quote ends "Joey Tribbiani
    //   was abysmal": he names himself in the line he's proud of
    // R fix: V2, blind 70 % right; "proud of being panned" spelled out the joke. All three now "for" one reading.
    // why: other actors ← "everything else… was simply terrible" sounds like a jab at the cast; the critic ← a learner
    //   who reads Joey as right takes the critic as the fool
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'abysmal', seg: [9.2, 21],
      stem: 'In Joey’s story about his “good” review, who is the joke on?',
      choices: ['Joey, for reading it as praise', 'The cast, for being called terrible', 'The critic, for liking only Joey'], a: 0,
      cue: '最後の文の主語と、彼がそれを何と呼んだか。',
      line: 'I still remember my *first good one*, though. … *Joey Tribbiani was abysmal*.',
      said: '「初めての良い批評は忘れない」と言って、自分がこき下ろされた一文を誇らしげに読む。',
      mean: '笑われているのは話している本人。けなされたのに、ほめられたと思っている落差が笑い。',
      trap: '「ほかは全部ひどい」を他人への皮肉と取りやすい。最後の主語が誰か、自分で何と呼んだかを追う。',
      use: 'Well, at least they spelled my name right.（まあ名前は合ってたし）' },

    // R fix: V2, blind 60 % right. The distractors now share one half of the key each (nervous → humiliated; hopeful →
    //   furious).
    // why: nervous ← a review day = nerves, and "Oh my God" can open bad news; furious ← she snaps at the "bad press"
    //   line
    { id: 'g2', skill: 'gist', level: 'B2', point: 'mood', reveals: ['hope'], seg: [21.2, 48.2],
      stem: 'How does Monica’s mood change after she walks in?',
      choices: ['From hopeful to humiliated', 'From nervous to humiliated', 'From hopeful to furious'], a: 0,
      cue: '入ってきた最初の一言と、最後の自分の言葉。',
      said: '新聞の山を見て「良い批評ね」と喜び、読んだあと「恥ずかしくてたまらない」と言う。',
      mean: '期待が大きかったぶん、落ちこみも大きい。前半と後半の気持ちの差。',
      trap: 'Oh my God は不安にも聞こえる。最初の must be と最後の本人の語で確かめる。',
      use: 'I got my hopes up for nothing.（期待しただけ損した）' },

    // R fix: V2, blind 60 % right; "angry" was weak. A "suspicious" reading of the pile replaces it; all three are
    //   "X; she thinks…".
    // why: suspicious ← a stack of papers looks like something hidden from her; worried ← "Oh my God" can open bad news
    //   too
    { id: 't1', skill: 'attitude', level: 'B1', point: 'hope', seg: [21.2, 27.75],
      stem: 'How does Monica sound when she sees the newspapers?',
      choices: ['Hopeful; she thinks it’s good news', 'Suspicious; she thinks they’re hiding it', 'Worried; she thinks it’s bad news'],
      a: 0,
      cue: '「must be」のあとの形容詞。',
      line: 'Look at all the newspapers. It *must be a good review*. Is it great?',
      said: '新聞の山を見て「きっと良い批評ね。すごく良いの？」と聞く。',
      mean: 'must be ＝ きっと～だ。期待でいっぱいの気持ち。',
      trap: 'Oh my God は悪い知らせにも使い、新聞の山は隠し事にも見える。すぐあとの good と great が気持ちを決める。',
      use: 'It must be good news!（きっといい知らせだ！）' },

    // R fix: V2, blind 65 % right; the choices are now three parallel sources ("the pile / a line / what someone said").
    // why: read a line ← she sounds sure, as if she's seen it (but she asks "Is it great?"); told her ← the same
    //   certainty read as hearsay
    { id: 'i2', skill: 'infer', level: 'C1', point: 'must', reveals: ['hope'], seg: [21.2, 27.75],
      stem: 'What makes Monica think the review is good?',
      choices: ['The pile of copies her friend bought', 'A line of it that she has already read', 'What someone has already told her'], a: 0,
      cue: '最初に目に入ったものと、そこからの推測。',
      line: '*Look at all the newspapers.* It must be a good review.',
      said: '新聞がたくさんあるのを見て、「きっと良い批評だ」と考える。',
      mean: '記念に何部も買った、と思っている。実際は見せないための買い集め。',
      trap: '自信のある言い方から、もう読んだ・聞いたと取りやすいが、Is it great? と聞いている。',
      use: 'You bought ten copies? Was it that good?（10部も？そんなに良かったの？）' },

    // R fix: V2, blind 65 % right; "give him a moment" was weak and the choices said "he" for a speaker the audio never
    //   names. A scope near miss ("so-so") replaces it.
    // why: so-so ← a hesitant "um" heard as lukewarm, not bad; not read ← "um" as plain えーと, still checking
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'um', seg: [24.4, 34.15],
      stem: 'When Monica asks “Is it great?”, what does the friend’s answer do?',
      choices: ['Tells her it’s bad without saying so', 'Hints that it’s just so-so, not great', 'Shows the friend hasn’t read it yet'], a: 0,
      cue: '質問への返事の長さと、そのあとの Monica の声。',
      line: 'Is it great? — *Um.* … Oh, dear God.',
      said: '「すごく良いの？」に、友だちは「えっと…」としか答えない。',
      mean: 'はい・いいえを言わないこと自体が答え。悪い知らせを口にしにくい沈黙。',
      trap: 'um を考え中の「えーと」や「まあまあ」と取りやすい。期待した質問に短い言葉だけなら、悪い知らせ。',
      use: 'Well… you should probably read it yourself.（まあ…自分で読んだほうがいいかも）' },

    // R fix: V2, blind 60 % right; "more good news" was weak. A "mixed review" near miss replaces it; "he" → "the
    //   friend".
    // why: mixed ← "the good news is" heard as the good parts of the review; hasn't read it ← the friend talks about
    //   who will know, not what it says
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'goodnews', seg: [33.65, 39.5],
      stem: 'What does the friend admit by starting with “But the good news is…”?',
      choices: ['That the review itself is bad', 'That the review is mixed, not all bad', 'That the friend hasn’t read it'],
      a: 0,
      cue: '文頭の「But」と、そのあとの言い方。',
      line: '*But the good news is* no one… will ever know.',
      said: '「でもいい知らせは、近所の人は知らないこと」。',
      mean: 'the good news is ～ は、悪い知らせがある前提の言い方。批評が悪いと認めている。',
      trap: 'good news を記事の良い部分と取りやすい。良い知らせが「誰も知らない」なら、記事は悪い。',
      use: 'The good news is, nobody got hurt.（不幸中の幸いで、けが人はいない）' },

    // why: ten ← "two" before "-block" is short; twenty ← twenty's t drops (トゥエニー) and blends with "two"
    { id: 'n1', skill: 'number', level: 'B1', point: 'radius', seg: [33.65, 39.5], keep: true,
      stem: 'Within how many blocks will no one ever know, he says?',
      choices: ['One', 'Two', 'Ten', 'Twenty'], a: 1,
      cue: '「radius」の直前の数。',
      line: 'no one in a *two-block* radius will ever know',
      said: '「2ブロック以内の人は誰も知らない」と言う。',
      mean: 'two-block radius ＝ 2ブロック以内。買い集めた範囲はご近所だけ。',
      trap: 'two は短く、後ろの block とつながる。twenty なら「トゥエニ」と2音節になる。',
      use: 'There’s a pharmacy two blocks away.（2ブロック先に薬局がある）' },

    // R fix: V2, blind 50 % right. All three are now about who knows.
    // why: only a few ← "the good news is" just before suggests the damage is small; nobody reads it ← the two-block
    //   radius heard as where the paper matters
    { id: 'd2', skill: 'detail', level: 'B1', point: 'manhattan', seg: [39.3, 43.6],
      stem: 'When Monica asks about the rest of Manhattan, what is the answer?',
      choices: ['They all know about it', 'Only a few know about it', 'Nobody there reads that paper'], a: 0,
      cue: '質問のすぐあとの短い返事。',
      line: 'What about the rest of Manhattan? — Yeah, *they all know*.',
      said: '「マンハッタンのほかの人は？」に「うん、みんな知ってる」と答える。',
      mean: '買い集めは近所だけ。街じゅうの人がもう読んでいる。',
      trap: '直前の明るい言い方に引かれると、被害は小さいと思いやすい。all を聞き逃さない。',
      use: 'Does everyone know already?（もうみんな知ってるの？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'theysay', seg: [47.6, 49.88],
      stem: 'Type what Joey says: “Yeah, but ___, Mon?” (5 words)', answer: 'you know what they say',
      cue: '「Yeah, but」のすぐあと、名前の前。',
      line: 'Yeah, but *you know what they say*, Mon?',
      said: '「でもさ、よく言うだろ？」と言う。',
      mean: 'what they の t が弾み、「ワッゼイ」に近い。you know も「ユノ」と短い。',
      trap: '5語が一息で言われるので、語の数が分かりにくい。「ことわざの前置き」の型で聞く。',
      use: 'You know what they say: practice makes perfect.（習うより慣れろって言うでしょ）' },

    // R fix: V2, blind 75 % right; "seldom print" was weak. A "one bad review doesn't matter" comfort replaces it.
    // why: doesn't mean much ← the same comforting spot, but it says bad press is minor, not good; soon forgotten ← a
    //   common comforting line in the same spot
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'press', seg: [47.7, 51.75],
      stem: 'What does the saying Joey quotes mean?',
      choices: ['Being in the papers at all helps you', 'One bad review doesn’t mean much', 'People soon forget what papers say'], a: 0,
      cue: '「what they say」のあとの決まり文句。',
      line: 'There is *no such thing as bad press*.',
      said: '「悪い評判なんてものはない」という決まり文句を言う。',
      mean: '悪く書かれても、名前が知られれば得になる、という考え。励ましのつもり。',
      trap: 'どれも慰めの言葉に聞こえる。この決まり文句は「悪く書かれても得になる」で、「大したことない」とは違う。',
      use: 'Any publicity is good publicity.（宣伝になれば何でもいい）' },

    // why: mai tais ← mahi-mahi ≈ "mai tai" with a fast h; mushrooms ← the m- onset and a food word
    { id: 'd3', skill: 'detail', level: 'B1', point: 'mahi', seg: [51.7, 57.5],
      stem: 'Which item on her menu does Monica quote the review on?',
      choices: ['The mahi-mahi', 'The mai tais', 'The mushrooms'], a: 0,
      cue: '「the chef’s」のあとの料理の名前。',
      line: 'the chef’s *mahi-mahi* was awful-awful',
      said: '「シェフのマヒマヒはひどい、ほんとにひどい」と記事を引用する。',
      mean: 'mahi-mahi は魚の名前。the chef は Monica 自身。',
      trap: 'h が弱いと mai tai（カクテル）に近く聞こえる。the chef’s のあとは料理の話。',
      use: 'What’s the fish of the day?（今日の魚料理は何ですか）' },

    // why: angry at the critic ← "Is he right?" heard as a challenge; joking ← repeated "am I" heard as playful
    { id: 't3', skill: 'attitude', level: 'B2', point: 'doubt', seg: [61.45, 65],
      stem: 'When Monica asks about the critic, how is she feeling?',
      choices: ['Starting to doubt her own cooking', 'Angry that the critic lied about her',
                'Joking a little to lighten the mood'], a: 0,
      cue: '同じ問いを言い直していく流れ。',
      line: 'Is he right? *Am I really… am I awful?*',
      said: '「あの人が正しいの？私って本当に…ひどいの？」と聞く。',
      mean: '言いかけてやめ、もう一度聞く。自信がゆらいでいる。',
      trap: 'Is he right? を挑戦的な問いと取ると怒りに聞こえる。言い直しは不安のサイン。',
      use: 'Be honest. Am I a bad driver?（正直に言って。私って運転下手？）' },

    // R fix: S4, the seg cut "your" at 71.0 s; it now ends at 70.95 s.
    // why: only a friend ← "because I'm your friend" is heard, the "not just" lost; harsh coming ← "it's the truth"
    //   often comes before a hard verdict
    { id: 'p4', skill: 'pragma', level: 'B2', point: 'truth', seg: [63.5, 70.95],
      stem: 'After his “No,” why does Joey add the line about being her friend?',
      choices: ['To promise that what follows is honest', 'To admit he says it as a friend only',
                'To warn her that something harsh is next'], a: 0,
      cue: '「not just」と、そのあとの「because」。',
      line: 'No. … I’m *not just saying this ’cause I’m your friend*. I’m saying it ’cause *it’s the truth*.',
      said: '「友だちだからじゃない、本当だから言うんだ」と前置きする。',
      mean: 'この前置きは「これからの言葉はお世辞じゃない」という約束。そのあとほめるつもり。',
      trap: 'not just が弱いと「友だちだから」だけが残る。直前の No が励ましの向きを決めている。',
      use: 'I’m not just saying that, I mean it.（お世辞じゃなくて本気だよ）' },

    // R fix: V2, blind 70 % right; "after his own review" was the tell, and the critic's-word distractor needed audio
    //   outside the seg. All three are now short readings of the line.
    // why: joking ← a cheerful line read as a joke to lift her; harsh truth ← "it's the truth" taken at face value with
    //   the dictionary meaning
    { id: 'h1', skill: 'humor', level: 'C1', point: 'yourfood', reveals: ['abysmal'], seg: [64.6, 73.5],
      stem: 'Why does Joey’s last line to Monica get a laugh?',
      choices: ['He thinks the word is praise', 'He’s joking to cheer her up', 'He finally admits the plain truth'], a: 0,
      cue: '最後の形容詞は、前にどこで聞いたか。',
      line: 'I’m saying it ’cause it’s the truth. Your food is *abysmal*.',
      said: '「本当だから言う。君の料理は abysmal だ」と言う。',
      mean: '自分の「良い批評」の語をほめ言葉として使っている。本当の意味は「最悪」なので逆効果。',
      trap: '辞書の意味なら批判、明るさは冗談に聞こえるが、it’s the truth は本気。',
      use: 'I meant that in a good way!（いい意味で言ったんだよ！）' },

    // anchor: 11.7–20.3 s the review puts "abysmal" below "simply terrible"; 71.0–72.3 s "Your food is abysmal" covers
    //   all her food (the critic quoted one dish, 53–55 s), and "it's the truth" makes it a verdict
    // R fix: V2, blind 70 % right; the key "worse than the critic said" was shaky (awful ≈ abysmal). The key is now the
    //   scope (all her food); the sincere "best in town" goes (the stem rules it out), and a literal hedge comes in.
    // why: only the fish ← the critic's line was about one dish, and "your food" heard as that dish; a little below ←
    //   the unfamiliar word taken as mild
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'yourfood', seg: [64.6, 73.5],
      stem: 'Taken at the word’s real meaning, what does the last line tell Monica?',
      choices: ['All her food is terrible, not just one dish', 'Only the fish dish is truly that bad', 'Her food is a little below average'], a: 0,
      cue: '最後の形容詞の本当の意味と、主語の広さ。',
      line: 'Your *food* is *abysmal*.',
      said: '「君の料理は abysmal だ」と、本当のことだと前置きしてから言う。',
      mean: '本当の意味なら「料理ぜんぶが最悪」。批評家が書いたのは一皿だけなので、範囲がぐっと広がる。',
      trap: '知らない語はやわらかく取りやすい。abysmal は terrible より下。your food は料理全体。',
      use: 'That came out wrong.（言い方がまずかった）' },
  ]
};
