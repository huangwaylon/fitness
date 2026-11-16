// REVIEW 2026-11-16: pass 4, fix 19, drop 0, new 0; ear checks 1
// OPEN: the title field (and this header) keep YouTube's "⭐️"; its U+FE0F variation selector isn't in the trimmed font
//   subset (font.py flags it). Keep it as on YouTube, or drop the "️"?
// OPEN: g2, a2 and i3 still drew 70–75 % on a cold blind re-read (revival marketing knowledge, the promo's friendly
//   tone, the truth being the moderate option); no honest key avoids that. g1 was rewritten after that re-read.
// “Meet the New iCarly Cast! ⭐️ Behind the Scenes w/ Miranda Cosgrove, Laci Mosley, & More | NickRewind” (NickRewind,
// official YouTube channel, Best of Carly Shay ❤️): the new iCarly cast talk to camera about coming back ten years on,
// with a few short scene clips cut in.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Miranda (Carly), Jerry (Spencer),
// Nathan (Freddie), Laci (Harper) and Jaidyn (Millicent) introduce themselves at 11–34 s. After that no answer is
// labelled, so stems say "the speaker" or "this cast member", and no item asks who.
// Untested: 37–43 s ("time is a flat circle", a TV reference), 63–81 s and 194–209 s (scene clips: the sculpture, "pile
// of crap", "Eugene Levy's eyebrows"; whisper "embarrassed about my wife" vs captions "my life"), 57–59 s (captions
// "get the game back together", whisper "gang").
// EAR CHECK: 266–270.2 s a2 c3 — "Jerry is super annoying by the way. Can't even stand him." is teasing (the words carry
//   it: "everyone is so fun… but he's fun to work with"); c3 needs "Can't" with no "I" before it (both sources agree)
import type { Clip } from '../types.ts';

export const icNewCast: Clip = {
  id: 'icnewcast', video: 'IUoC-58Efgo', title: 'Meet the New iCarly Cast! ⭐️ Behind the Scenes w/ Miranda Cosgrove, Laci Mosley, & More',
  dur: 359, wpm: 181, band: 'fast', tags: ['職場', '友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: blind 75 %: COVID-era knowledge made Zoom the only likely way; now each half (Zoom, fun) is shared with
    //   one distractor, so the item needs both "over Zoom" and "but it was still really fun"
    // why: in person, fun ← "get the gang back together" and "step back into these characters" sound like a set day;
    //   Zoom, flat ← "Because of COVID" and Zoom heard, the "but… still really fun" turn missed
    { id: 'd1', skill: 'detail', level: 'B1', point: 'zoom', seg: [52.4, 59.6],
      stem: 'How did the cast’s first table read go?',
      choices: ['Over Zoom, and it was really fun', 'In person, and it was really fun', 'Over Zoom, and it felt a bit flat'], a: 0,
      cue: '「first table read was」のあとと、続く but。',
      line: 'the first table read was *over Zoom*, but it was still *really fun*',
      said: 'コロナで最初の台本読みはZoomだったが、それでも楽しかったと言う。',
      mean: 'table read ＝ 台本の読み合わせ。over Zoom ＝ Zoomを使って。',
      trap: 'COVID と Zoom で「盛り上がらない」と思いやすい。but のあとで逆になる。',
      use: 'Can we do the meeting over Zoom?（会議はZoomでいい？）' },

    // R fix: blind 50 % and right: "easy" and "sad" were weak; a second "strange" with the wrong reason now makes the
    //   because-clause decide
    // why: strange, new sets ← "strange" heard, the reason filled in from the set talk; natural, home ← "feels like coming
    //   home" is said at 299 s
    { id: 'd2', skill: 'detail', level: 'B1', point: 'strange', seg: [83.4, 89.9],
      stem: 'Asked how it feels to be back on set, what is the first answer?',
      choices: ['Very strange, because it was unexpected', 'Very natural, because it feels like home',
                'Very strange, because the sets are all new'], a: 0,
      cue: '「It feels very」のあと、理由を言う部分まで。',
      line: 'It feels *very strange*, because it was *unexpected*.',
      said: '「すごく不思議な感じ。思ってもいなかったから」と答える。',
      mean: 'strange は悪い意味ではなく、まさか戻るとは、という驚き。',
      trap: 'strange だけ拾うと理由を自分で補いやすい。because のあとまで聞く。',
      use: 'It feels strange to be back here.（ここに戻るのは不思議な気分）' },

    // R fix: blind 85 %: the key was the only balanced, warm choice. A cold re-read still took it at 70 % as the middle
    //   of two extremes, so now two choices share "coming home" and the third is a reunion with a catch
    // why: nothing changed ← "it's like nothing changed" (290 s) and "like we were the same", said of the trio, not the
    //   show; stiff work ← "very strange" (86 s) and the long break, with "such a blast" missed
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['blanket', 'audience'], seg: [84, 300],
      stem: 'Across these interviews, how do the cast describe making the new show?',
      choices: ['Like coming home, though the show has grown up', 'Like coming home, as if nothing had changed',
                'Like a reunion, though the work itself feels stiff'], a: 0,
      cue: '何人もの答えに共通する、二つの気持ち。',
      said: 'なじみがあって「家に帰ったよう」なのに、新しくて違う、と何人もが言う。',
      mean: '懐かしさと新しさの両方が、動画全体のテーマ。',
      trap: '一度きりの発言に引っぱられやすい。要点は、何人もがくり返す言葉から拾う。',
      use: 'It feels like coming home.（帰ってきたみたいな気分）' },

    // R fix: blind 55 %: "acted as a child" was easy to rule out; now all three are revival pleasures, and "seen as a
    //   child" (a viewer) refutes the cast-reunion reading. Segment was 15.95 s; it now ends after "in person"
    // why: story ← "original" is said twice, so a story link sounds likely; old cast ← other answers praise the reunion,
    //   and "stuff I've seen as a child" can be heard as having been there
    { id: 'd3', skill: 'detail', level: 'B2', point: 'sets', seg: [106.0, 120.95],
      stem: 'Why did coming to the show get this cast member so excited?',
      choices: ['Being on sets built to look like the original', 'Working again with the cast of the original',
                'A story that picks up where the original ended'], a: 0,
      cue: '「because」のあと、何が original に似ているか。',
      line: 'it feels so *nostalgic*… these *sets* that are, you know, *designed so much like the original*',
      said: '元の番組そっくりのセットが懐かしく、子どものころ見ていた物が目の前にある、と言う。',
      mean: '視聴者として見ていた物を、今は実物で見られるのがうれしい。',
      trap: 'original が何度も出て混ざりやすい。seen as a child は見ていた側の話。',
      use: 'This place looks just like I remember.（記憶のままの場所だね）' },

    // R fix: blind 75 %: "first show" was out by common sense. Now a "watched" reading shares the key's contrast, so
    //   the weak "I've been on" decides
    // why: only watched ← "I've been on" lost in fast speech, leaving "a lot of different shows" as things watched; too
    //   relaxed ← "so positive" read through a work-ethic frame (楽しすぎて緩い)
    { id: 'i1', skill: 'infer', level: 'B2', point: 'energy', seg: [122.0, 132.55],
      stem: 'What does the comparison with other shows suggest about this cast member?',
      choices: ['Some sets they worked on before felt less friendly', 'Some shows they only watched felt more negative',
                'This set is so relaxed that work goes slowly'], a: 0,
      cue: '「negative」と「positive」の対比。',
      line: 'I’ve been on a lot of like different shows that have *negative energy*. And here it’s just so *positive*',
      said: '雰囲気の悪い番組にもいろいろ出たが、ここはとても前向きだ、と言う。',
      mean: '今の現場をほめることで、そうでない現場もあったと分かる。',
      trap: 'I’ve been on の I’ve は弱く、落とすと出演経験の話だと気づきにくい。',
      use: 'The vibe here is so positive.（ここは雰囲気がすごくいいね）' },

    // R fix: blind 80 %: the key was the only move that fits a promo interview; all three are now two-step moves
    // why: refusing ← "I don't want to" heard as a no, with the "but" lost, and the reboot talk as a new topic; already said
    //   too much ← "too much" heard as an apology after the fact
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'giveaway', seg: [132.1, 139.95],
      stem: 'What is the speaker doing as this answer begins?',
      choices: ['Holding back details, then giving a general point', 'Refusing to talk, then changing the subject',
                'Apologizing for having said too much already'], a: 0,
      cue: '最初の一文と、そのあとの「but」。',
      line: 'I don’t want to *give too much away*, *but* you know…',
      said: '「あまり明かしたくないけど」と前置きして、今回の特徴を話し始める。',
      mean: 'give away ＝ ネタを明かす。but が続くので「少しだけ言うね」の合図。',
      trap: 'I don’t want to で断りと思いやすい。but が来たら話は続く。',
      use: 'No spoilers, but you’ll love the ending.（ネタバレはしないけど、結末は最高だよ）' },

    // R fix: blind 85 %: a revival's audience is common knowledge against weak fillers; now the family reading (old
    //   fans plus their kids) and today's kids compete, refuted by "those same people" and "more mature"
    // why: today's kids ← "geared towards young people" is said first, as the old target; old fans with kids ← "grew up"
    //   and "people" heard as now-adult parents watching with children
    { id: 'g2', skill: 'gist', level: 'B2', point: 'audience', seg: [139.5, 165.0],
      stem: 'Who is the new show mainly made for, according to these answers?',
      choices: ['Fans who grew up with the original, now adults', 'Old fans and their kids, watching together',
                'Today’s kids, the age the old fans once were'], a: 0,
      cue: '「young people」のあと、今はだれに向けているか。',
      line: 'we’re *aiming at those same people that grew up with the show*',
      said: '子ども向けだった番組が、今はそれを見て育った人たちに向けて作られている、と言う。',
      mean: '視聴者と一緒に、番組も大人になった。',
      trap: 'young people が先に聞こえるが、それは昔の話。now のあとが今。',
      use: 'Made for fans who grew up with it.（それで育ったファン向けに作られている）' },

    // R fix: blind 60 %: "ten years later" is the round, expected number; "Nine" (the real gap between the shows'
    //   runs) now competes with it, so only the audio settles it. Twenty is out (its evidence lies outside the segment)
    // why: nine ← the gap worked out from the shows' dates; twelve ← both start with "t-e", and "ten" is short after "now"
    { id: 'n1', skill: 'number', level: 'B1', point: 'tenyears', seg: [139.5, 149.3], keep: true,
      stem: 'How many years later is the show aiming at the same people?',
      choices: ['Nine', 'Ten', 'Twelve'], a: 1,
      cue: '「now」のすぐあと、短い数字。',
      line: 'is now *ten years later*',
      said: '「子ども向けだった番組が、10年たった今、同じ人たちに向けて」と言う。',
      mean: 'ten years later ＝ 10年後。視聴者も10年分大人になった。',
      trap: '年数を計算や予想で選びやすい。ten は now のすぐあとの短い一音節。数は耳で拾う。',
      use: 'Ten years later, here we are again.（10年たって、またここに）' },

    // R fix (C2 rewrite 1): blind 75 %: "hoped" was the only sober choice; now the near miss "wilder turns" shares the
    //   surprise and differs only in direction (ordinary vs extraordinary), which "how real life happens" settles
    // why: wilder ← "not what we expected" read as a big, strange surprise (direction flip); as set up ← "same people"
    //   heard about the characters, and "expected" without the "not"
    // anchor: 150.6–158.4 s "maybe not what we expected… which is how real life happens": real life as the comparison
    //   makes the surprise a letdown, and he stops short of saying so ("I don't want to give too much away", 132.6 s)
    { id: 'c2', skill: 'infer', level: 'C2', point: 'reallife', reveals: ['giveaway'], seg: [148.6, 158.95],
      stem: 'What is the speaker hinting about the characters’ adult lives, without saying it?',
      choices: ['Their lives took ordinary, imperfect turns', 'Their lives took wilder turns than fans pictured',
                'Their lives turned out just as the old show set up'], a: 0,
      cue: '「not what we expected」のあと、何と比べているか。',
      line: 'what the characters’ lives turned out to be? *Maybe not what we expected*… which is *how real life happens*.',
      said: '登場人物の人生は「たぶん期待どおりではない。現実の人生もそうだから」と言う。',
      mean: '「現実の人生のように」と比べるので、思いどおりでない含み。明かさないまま方向だけ伝える。',
      trap: 'not what we expected は派手な驚きにも聞こえる。real life と比べればありふれた方向。',
      use: 'Not what I expected, but that’s life.（思ってたのと違うけど、それが人生）' },

    // R fix: blind 80 %: "bedtime" was a filler; now all three start "Cozy" and differ in how much changes ("a little
    //   bit" settles it)
    // why: nothing big ← "comfortable" heard without the "but… shakes things up" half; much darker ← "shakes things up"
    //   heard without "a little bit" (scope)
    { id: 'i3', skill: 'infer', level: 'C1', point: 'blanket', seg: [182.9, 194.3],
      stem: 'What does the fuzzy-blanket comparison say about the new show?',
      choices: ['Cozy and familiar, with a few changes', 'Cozy and familiar, with nothing big changed',
                'Cozy at first, then much darker and edgier'], a: 0,
      cue: '「blanket」のあとの「but」。',
      line: 'very *comfortable* and like putting on a *fuzzy blanket*, but in a way that *shakes things up a little bit*',
      said: '「毛布のような安心感がありつつ、少し変化も」と言う。',
      mean: '毛布は、なじみの心地よさのたとえ。shake things up ＝ 変化を起こす。',
      trap: 'comfortable だけ、shakes だけ拾うと極端になる。a little bit が程度。',
      use: 'Let’s shake things up a little.（ちょっと変化をつけよう）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'blanket', seg: [191.2, 194.3],
      stem: 'Type the words: “…in a way that, uh, ___ a little bit.” (3 words)', answer: 'shakes things up',
      cue: '「in a way that」のあと、動詞から。',
      line: 'but in a way that, uh, *shakes things up* a little bit',
      said: '「でも少し変化も起こすような形で」と付け足す。',
      mean: 'shake things up ＝ かき混ぜて新しい変化を起こす。決まった言い方。',
      trap: 'shakes と things がつながり「シェイクスィングズ」に聞こえる。up は弱く短い。',
      use: 'A new boss might shake things up.（新しい上司で何か変わるかも）' },

    // R fix: blind 85 %: the key was the only warm, detailed choice; "Partly" is now the Japanese frame (冗談めかした
    //   本音), refuted by "I missed everyone so much"
    // why: real wish ← "need space from your family" taken at face value (本音が出た); partly ← the joke heard as a true
    //   feeling dressed up as a joke
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'nuanced', seg: [209.1, 219.7],
      stem: 'Asked about missing the cast, is the first answer meant seriously?',
      choices: ['No; a mock-cold answer, taken back at once', 'Yes; a real wish for some time apart',
                'Partly; a real wish, said as a joke'], a: 0,
      cue: '少しあと、同じ短い言葉を2回くり返すところ。',
      line: 'Sometimes you just need *space from your family*. *I’m kidding*, I’m kidding.',
      said: '「家族とも距離が要る時があるでしょ」と言い、「冗談。会いたかった」と続ける。',
      mean: 'わざと冷たく答えてふざけ、すぐ本心を言う。family は共演者のこと。',
      trap: '冗談めかした本音と取りやすいが、kidding のあと本心を言い切っている。',
      use: 'I’m kidding! I’m so happy to see you.（冗談だよ！会えてすごくうれしい）' },

    // R fix (C2 rewrite 1): blind 85 %: "warm feeling" echoed a1's key and the others were thin; now three readings of
    //   the wording itself
    // why: tension ← "space from your family" read as 本音 (sincerity flip); mocks the interviewer ← right mechanism (a
    //   joke), wrong target: the jab is at "your family", the cast, and the question is never mocked
    // anchor: 209.6–219.3 s "a nuanced position… space from your family… I'm kidding… I missed everyone so much": debate
    //   wording, taken back at once, for a plain "I missed them"
    { id: 'c1', skill: 'humor', level: 'C2', point: 'nuanced', seg: [209.1, 219.7],
      stem: 'Why is “a nuanced position” a funny way to answer this question?',
      choices: ['It answers a simple question like a political debate', 'It hints at real tension among the returning cast',
                'It mocks the interviewer for asking something so obvious'], a: 0,
      cue: '言葉の堅さと、質問の中身の差。',
      line: 'Missing the cast is *a nuanced position*. … I’m kidding… *I missed everyone so much*.',
      said: '「共演者が恋しいかは、複雑な立場でして」と会見のように答え、すぐ冗談だと言う。',
      mean: 'nuanced position は討論で使う堅い言い方。「会いたかった？」という簡単な質問にわざと使うのがおかしい。',
      trap: '聞き手を茶化したと取りやすいが、冗談の向かう先は family（共演者）。',
      use: 'Do I like pizza? It’s a nuanced position.（ピザ好きかって？複雑な立場でね）' },

    // R fix: blind 75 %: "doubt" was a filler; now a jab (the Jerry teasing later in the clip) competes
    // why: correction ← "I mean" as in "Tuesday, I mean Wednesday"; jab ← the cast tease each other all through the clip,
    //   and "honestly" can preface a dig
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', seg: [219.45, 225.9],
      stem: 'After naming Nathan and Jerry, what does “I mean” introduce?',
      choices: ['An explanation of why being with them is great', 'A playful jab at the two people just named',
                'A quick correction of who exactly was just named'], a: 0,
      cue: '「I mean」のあと、二人をどう言うか。',
      line: 'getting to be with Nathan and Jerry. *I mean*, they’re honestly *two of my oldest friends*.',
      said: 'Nathan と Jerry と一緒でうれしい、「だって一番古い友だちの二人だから」。',
      mean: 'ここの I mean は「というのもね」。気持ちに理由を足す。',
      trap: 'I mean は言い直しにも使うが、名前は直していない。説明か訂正かを聞き分ける。',
      use: 'I love it here. I mean, it’s home.（ここが好き。だって地元だし）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'touch', seg: [232.2, 234.45],
      stem: 'Type the words: “I’ve ___ all these years.” (3 words)', answer: 'kept in touch',
      cue: '「I’ve」のすぐあと、過去分詞から。',
      line: 'and I’ve *kept in touch* all these years',
      said: '「この何年もずっと連絡を取り合ってきた」。',
      mean: 'keep in touch ＝ 連絡を取り続ける。I’ve kept で「ずっと〜してきた」。',
      trap: 'kept と in がつながり「ケプティン」。I’ve のあとなので keep ではなく kept。',
      use: 'Let’s keep in touch!（これからも連絡取ろうね）' },

    // R fix: blind 60 %: "a prize" was a filler; now "hand the next question to him" (give him = pass him the turn),
    //   with a light tone so the key isn't the only nuanced one
    // why: pass it on ← "give him" taken literally (伝える・渡す); next question ← give him = hand over, natural in a
    //   set interview with several people
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'givehim', reveals: ['tenyears'], seg: [258.1, 262.4],
      stem: 'After calling Jerry “a very good listener”, what does the speaker’s add-on do?',
      choices: ['Concedes that one point, a little grudgingly', 'Hands the next question over to him, jokingly',
                'Promises to pass the compliment on to him'], a: 0,
      cue: '「listener」のあと、短い4語。',
      line: 'He is a very good listener. *I’ll give him that*.',
      said: '「Jerry とつるむのは最高。聞き上手なのは認める」と言う。',
      mean: 'I’ll give him that ＝ そこは認める。「ほかはともかく」の含みで、軽くからかう。',
      trap: 'give を「渡す」と取ると、質問や伝言を回す話に聞こえる。決まり文句。',
      use: 'Fair point. I’ll give you that.（なるほど、そこは認める）' },

    // R fix: blind 80 %: "they clearly get along" argued for the key; all three are now bare readings
    // why: real gripe ← the Japanese frame: a jab slipped in, then "but… fun to work with" heard as polite cover
    //   (本音と建前); clowns around ← "everyone is so fun… funny" just before, so "annoying" sounds like too much fun
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'annoying', seg: [262.2, 274.4],
      stem: 'When Jerry is called “super annoying”, how is it meant?',
      choices: ['As a joke: a fake complaint about a friend', 'As a real gripe, smoothed over with a “but”',
                'As a real dig at how much Jerry clowns around'], a: 0,
      cue: '前後の「fun」と「nice」、そして but のあと。',
      line: 'Jerry is *super annoying* by the way. Can’t even stand him. *But you know, he’s fun to work with*.',
      said: 'みんな優しいと言ったあと、「ちなみに Jerry はうざい。でも一緒に働くと楽しい」。',
      mean: 'ほめ言葉の列に大げさな悪口をはさむのは、親しい仲のからかい。',
      trap: 'but の前を本音と聞く型に引かれやすい。前後がほめ言葉なら、悪口は遊び。',
      use: 'She’s so annoying. I love her.（ほんとにうざい。大好き）' },

    // anchor: 268.8–269.8 s both sources "Can't even stand him", with no "I": four words in one breath right after "by
    //   the way"
    { id: 'c3', skill: 'dict', level: 'C2', point: 'annoying', seg: [268.1, 270.75],
      stem: 'Type the aside after “by the way”: “___.” (4 words)', answer: "can't even stand him",
      cue: '「by the way」のすぐあと。聞こえた音のとおりに。',
      line: '*Can’t even stand him*.',
      said: '「Jerry はうざい」のすぐあと、「もう耐えられない」と付け足す。主語の I はなく、4語がひと息。',
      mean: '会話では I をよく落とす。can’t の t はほぼ消え、even とつながる。',
      trap: '文法どおり I を足したくなり、can にも聞こえやすい。書き取りは聞こえた音どおりに。',
      use: 'Can’t wait to see you!（会えるのが待ちきれない！）' },

    // R fix: `said` held a broken character (U+FFFD for ま in 昔のまま); restored.
    // R fix: blind 70 %: "sets feel like home" was weak; now the new-cast reading competes, refuted by "the three of us"
    // why: fans care ← "still" plus the long gap read as a fear of being forgotten; new cast ← new members join in this
    //   clip, but "the three of us" is the old trio
    { id: 'i2', skill: 'infer', level: 'C1', point: 'stillhaveit', seg: [276.8, 286.0],
      stem: 'Before filming, what were they nervous about?',
      choices: ['Whether the three of them still had their old spark', 'Whether the new cast members would fit in with them',
                'Whether old fans would still care about the show'], a: 0,
      cue: '不安のあと、舞台に立った瞬間の話。',
      line: 'are we going to *still have it*? As soon as *the three of us got on stage together*, it was like we were the same.',
      said: '「まだあの感じはあるかな」と不安だったが、3人で舞台に立った途端、昔のままだった。',
      mean: 'it は昔の息の合い方。すぐあとの3人の話で、何が心配だったか分かる。',
      trap: 'still から「忘れられたかも」を連想しやすい。答えの側から it の中身を決める。',
      use: 'We still have that old spark.（昔の息の合い方はまだある）' },

    // R fix: blind 80 %: "argue for real" clashed with the friendly context; now "crack each other up" (friendly, a
    //   different meaning) competes
    // why: crack up ← "making jokes" just before, so the phrase sounds like laughing together; copy ← "rip off" (= パクる)
    //   is a near phrase
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'ripping', seg: [285.5, 290.9],
      stem: 'After “making jokes”, what does the next phrase say they do?',
      choices: ['Tease each other just for fun', 'Crack each other up all day', 'Copy each other’s old jokes'], a: 0,
      cue: 'うしろの「nothing changed」とのつながり。',
      line: 'I’m just messing with them, making jokes. We’re just *ripping on each other*.',
      said: '「ふざけて冗談を言って、いじり合ってる。何も変わってない」。',
      mean: 'rip on ＝ 親しい相手をからかう、いじる。仲がいいからこその遊び。',
      trap: '流れから「笑わせ合う」と取りやすく、rip off（パクる）にも似る。on は相手をねらう形。',
      use: 'My brothers always rip on my cooking.（兄弟はいつも私の料理をいじる）' },

    // R fix: blind 80 %: the key was the only positive choice; now each distractor is happy but holds one reservation
    // R fix: segment was 15.95 s; it now starts at "the cast is super nice" (309.1 s)
    // why: outsider ← "they've known each other for so long" heard as a reason to feel outside; starstruck ← "super nice"
    //   and "I've known them forever" heard as a fan's awe (the "watched iCarly as a child" just before)
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'included', seg: [309.0, 316.05],
      stem: 'How does this new cast member feel about joining the others?',
      choices: ['At home, as if they had always known each other', 'Happy, but still a bit of an outsider for now',
                'Thrilled, but too starstruck to fully relax'], a: 0,
      cue: '最後の「I feel」のあと。',
      line: 'it feels like *I’ve known them forever*… I feel *really included*',
      said: '前から知り合いのようで、仲間に入れてもらえている、と言う。',
      mean: 'included ＝ 仲間に入れてもらえている。新しく入った側の安心。',
      trap: 'みんな昔からの仲、と聞こえると仲間外れの話に思いやすい。I feel のあとで決まる。',
      use: 'Thanks for making me feel included.（仲間に入れてくれてありがとう）' },

    // R fix: blind 75 %: "old sets kept as they were" clashed with the "new" theme; now a revival staple competes
    // why: old side characters ← the usual revival promise, and "you'll remember from the original"; silly adults ← said in
    //   the same breath, but for new viewers (keyword trap)
    { id: 'd5', skill: 'detail', level: 'B2', point: 'everybody', seg: [328.3, 342.4],
      stem: 'At the end, what does the show offer old fans in particular?',
      choices: ['Little Easter eggs and jokes from the original', 'Surprise returns of old side characters from the show',
                'Grown-up actors acting silly and having fun'], a: 0,
      cue: '「old fan」のあと。そのあとの「new」の話と分けて。',
      line: 'If you were an *old fan*… there’s tiny little *Easter eggs and jokes*… And if you’re new…',
      said: '昔のファンには小ネタや冗談、新しい人には大人がふざける楽しさがある、と言う。',
      mean: 'Easter egg ＝ こっそり隠された小ネタ。昔のファンだけが気づく。',
      trap: '大人がふざける話は if you’re new 向け。if のあとの相手で分ける。',
      use: 'There’s something for everybody here.（ここにはだれでも楽しめるものがある）' },

    // why: had to go ← "gotta" ≈ "godda", close to "hadda"; got to ← the short "go" swallowed between "gotta" and
    //   "finish", leaving "got to" (= was able to)
    { id: 's1', skill: 'sound', level: 'B2', point: 'bye', seg: [344.2, 349.8],
      stem: 'Fill the gap: “I ___ finish filming.”',
      choices: ['gotta go', 'had to go', 'got to'], a: 0,
      cue: '「I」のあと、つながった短い音のかたまり。',
      line: 'I *gotta go* finish filming, so I’ll see you guys later.',
      said: '「撮影の続きに行かなきゃ」。gotta go が「ガラゴー」とつながる。',
      mean: 'gotta ＝ got to（〜しなきゃ）。go finish は and が落ちた形。',
      trap: 'had to go なら過去、got to なら「〜できた」。これからの話。',
      use: 'I gotta go. Talk later!（もう行かなきゃ。またあとで！）' },
  ]
};
