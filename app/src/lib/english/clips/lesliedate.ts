// REVIEW 2026-11-16: pass 6, fix 18, drop 0, new 0; ear checks 0
// OPEN: nt1 and nt3 (C2) were rewritten once after the blind pass; if a fresh reader still gets either ≥ 80 % from
//   the choices alone, drop it (the title gives away the date frame).
// “When Leslie didn't realise it was a date | Parks and Recreation” (the official Parks and Recreation channel,
// Season 1): Leslie asks her mother about a meeting with an official from Eagleton; her mother has set it up as a date,
// and Leslie spends dinner on rezoning while George drifts to his personal life.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 203 s. Untested on purpose: 21.5–23.3 s
// (the "big three" list includes an offensive word), 39.4–42.4 s (the quote joke needs knowing who Mary J. Blige is),
// 53.2–55.9 s ("Ollie talks about her city codes" in both sources, garbled), 68.6–71.1 s (first ladies: world
// knowledge), 132.1–135 s ("it has been easy" in the captions, "it hasn't been easy" in whisper), 166.4 s (whose
// "Okay"), 187.6–191.3 s (who says "it's going quite well"; "Sandy Duncan" is world knowledge), 195–199 s (sexual).
// George is named in the audio (31.8 s); the mother is "Mom" (0.8 s), never named.
import type { Clip } from '../types.ts';

export const leslieDate: Clip = {
  id: 'lesliedate', video: 'xmEp21iP618', title: 'When Leslie didn\'t realise it was a date', dur: 223, wpm: 151,
  band: 'mid', tags: ['恋愛', '店・レストラン'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: Wouldn't ← n't's t drops, and "surely it's odd?" also fits; Will ← would's weak vowel heard as will;
    //   Could ← only the "-ould it" is caught, the onset is lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'resched', seg: [8.6, 12.2],
      stem: 'Fill the gap: “___ unusual to reschedule the meeting?”',
      choices: ['Would it be', 'Wouldn’t it be', 'Will it be', 'Could it be'], a: 0,
      cue: '質問の最初、弱くつながる3語。',
      line: '*Would it be* unusual to reschedule the meeting?',
      said: '会合の日を変えたら変に思われるかな、と母にたずねている。',
      mean: 'Would it be は「ウディッビ」とつながる。d が弾んで it とくっつく。',
      trap: 'Wouldn’t なら「ン」が残り、will なら母音が「イ」。最初の母音と「ン」で聞き分ける。',
      use: 'Would it be okay to pay by card?（カードで払っても大丈夫ですか）' },

    // R fix: V2 (blind 50 %, right): "seem relaxed" was a filler; now "a way out" (unless read as permission)
    // why: way out ← "unless…" read literally as a real exception she offers; already unreliable ← the jab heard as
    //   about her past, though "you would come off" is about a future choice
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'unless', reveals: ['flaky'], seg: [12.0, 21.3],
      stem: 'When her mother adds “Unless that’s the impression…”, what is she doing?',
      choices: ['Joking, to push her not to reschedule', 'Offering a way out if she still wants to',
                'Hinting that people already find her unreliable'], a: 0,
      cue: '「a little」のあとに付け足す一文。',
      line: 'you would come off… a little *flaky*. *Unless that’s the impression* you’re trying to make.',
      said: '日を変えると当てにならない人に見える、そう見せたいなら別、と言う。',
      mean: 'unless 〜 は「わざとなら別」という冗談まじりの念押し。変えないほうがいい。',
      trap: 'impression を「好印象」と取ると話がずれる。本音は unless の前。',
      use: 'Sure, cancel. Unless you want them mad.（キャンセルしてもいいよ、怒らせたいならね）' },

    // R fix: V2 (blind 70 %, right): "rescheduling = unreliable" was common sense; "plays hard to get" now fits the
    //   rescheduling too, and only "flaky" settles it. trap rewritten.
    // why: hard to get ← putting off a date reads as a dating move, and her mother thinks it is a date; too nervous ←
    //   flaky heard near "freaky", and backing out read as nerves
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'flaky', seg: [12.0, 21.3],
      stem: 'If Leslie reschedules, what kind of person would she seem, says her mother?',
      choices: ['Someone who can’t be relied on', 'Someone who plays hard to get', 'Someone too nervous to go'], a: 0,
      cue: '「come off」のあと、「a little」に続く一語。',
      line: 'you would come off… a little *flaky*.',
      said: '会合を延ばすと少し flaky に見えると言われ、Leslie は「政治家には最悪」と返す。',
      mean: 'flaky ＝ 予定や約束が当てにならない人。',
      trap: '日を延ばす＝じらす、と取りやすい。flaky は約束を守らない人。性格の語は一語で決まる。',
      use: 'Sorry to be flaky. Can we do Friday?（予定を変えてごめん、金曜でもいい？）' },

    // why: council member ← "city council" comes up at dinner; park planner ← the park and zoning talk later
    { id: 'd1', skill: 'detail', level: 'B1', point: 'job', seg: [27.0, 37.6],
      stem: 'What is the man’s job, according to her mother?',
      choices: ['A city manager', 'A council member', 'A park planner'], a: 0,
      cue: '名前を言ったすぐあと、「he’s the」に続く部分。',
      line: 'He’s *the city manager* in Eagleton.',
      said: '相手の名前と、イーグルトンのシティマネージャーだと母が言う。',
      mean: 'city manager ＝ 市の行政を取りしきる役職。',
      trap: 'city council は夕食で Leslie が言う語。あとから聞いた語に引っぱられない。',
      use: 'He’s the manager here. Ask him.（彼がここの責任者だよ、聞いてみて）' },

    // why: career ← Leslie's own reason later ("focusing on my career"); men boring ← "boring" is heard later, from
    //   George, about the women he dates
    { id: 'i1', skill: 'infer', level: 'B2', point: 'dater', seg: [42.8, 51.3],
      stem: 'In her comment to the camera, why does Leslie’s mother say Leslie rarely dates?',
      choices: ['She spends her time where few men go', 'She is too busy with her career to date',
                'She finds most of the men she meets dull'], a: 0,
      cue: 'カメラに向かって、場所をいくつか並べる部分。',
      line: 'You *don’t meet many guys* at the hall of records, the public library…',
      said: '記録保管所や図書館、靴売り場では男性に出会わない、と母が話す。',
      mean: 'Leslie の行く場所を並べて、出会いがない理由にしている。',
      trap: 'あとで Leslie 本人が「仕事に集中してる」と言う。誰の説明かを分けて聞く。',
      use: 'You don’t meet many people working from home.（在宅勤務だと出会いがない）' },

    // why: stylish ← her mother's word, said right after; same outfit ← "Is that what you're gonna wear?" heard as
    //   her plan
    { id: 'd2', skill: 'detail', level: 'B1', point: 'outfit', seg: [59.4, 64.6],
      stem: 'Before her mother’s advice, what is Leslie planning to wear?',
      choices: ['Something a little more formal', 'Something a little more stylish', 'The outfit she has on now'], a: 0,
      cue: '「No」で始まる返事、「wear」のあと。',
      line: 'No, I was gonna wear something a little more *formal*…',
      said: '「その服で行くの？」に、「もう少しきちんとした服にする」と答える。',
      mean: 'formal ＝ 改まった。仕事の会合のつもりの服選び。',
      trap: '直後に母が stylish と言うので、それを Leslie の案と取りやすい。順番で追う。',
      use: 'Is it formal, or can I wear jeans?（正装？ジーンズでもいい？）' },

    // anchor: 59.9–67.1 s Leslie hears the question as "too casual" and offers "a little more formal and
    //   button-down"; her mother turns that down with "something more stylish": formal was never what she meant
    // R fix: V2 (blind 60 %, right; C2): the key was the only "not X" contrast and "attractive" matched the title.
    //   Now three parallel "the outfit…" readings; one rewrite.
    // why: not formal enough ← Leslie's own reading: she answers with "more formal"; fine as it is ← the question taken
    //   at face value (sincerity flip)
    { id: 'nt3', skill: 'attitude', level: 'C2', point: 'stylish', seg: [59.4, 67.4],
      stem: 'When her mother asks if that’s what Leslie will wear, what is she not saying?',
      choices: ['That the outfit isn’t stylish enough', 'That the outfit isn’t formal enough',
                'That the outfit is fine as it is'], a: 0,
      cue: 'Leslie の答え（formal）に、母がどう返すか。',
      line: 'Is that what you’re gonna wear? … Why don’t you try something *more stylish*?',
      said: '「それで行くの？」と聞き、Leslie が「もっときちんとした服に」と言うと「もっとおしゃれに」と返す。',
      mean: '質問の形で服への不満を伝えている。求めているのはきちんと感でなく、見た目の魅力。',
      trap: 'Leslie と同じく「もっとかたく」と聞きやすい。質問の本音は、次に何を勧めるかで分かる。',
      use: 'Is that what you’re wearing? Maybe a jacket?（それで行くの？上着は？）' },

    // R fix: V2 (blind 55 %, right): "her big chance" was the only worry-shaped choice; all three now end "the meeting"
    // why: skip ← "blow off" (= skip) is the near phrasal verb; lose her temper ← "blow up" (= get angry)
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'blowit', seg: [61.0, 67.3],
      stem: 'Right after describing her outfit, what is Leslie worried she might do?',
      choices: ['Mess things up at the meeting', 'Skip the meeting after all', 'Lose her temper at the meeting'], a: 0,
      cue: '「I don’t want to」に続く2語。',
      line: 'I don’t want to *blow it*.',
      said: '「台無しにしたくないの」と意気込む。',
      mean: 'blow it ＝ せっかくの機会をしくじる。大事な場を前にしてよく使う言い方。',
      trap: 'blow off（すっぽかす）、blow up（かっとなる）と似ている。blow it は「しくじる」。',
      use: 'It’s my one shot. I can’t blow it.（一度きりのチャンス、しくじれない）' },

    // R fix: V2 (blind 60 %, right): "will do" was a filler; now "agreeing formal is right" (her reply heard as a yes)
    // why: plainly ← "why" read literally, as a question about reasons (なぜ〜しないの); agreeing ← the reply heard as
    //   approval of Leslie's "more formal"
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'stylish', seg: [61.0, 71.4],
      stem: 'When her mother answers Leslie’s outfit plan, what is she doing?',
      choices: ['Suggesting she try another look', 'Asking why she dresses so plainly',
                'Agreeing that formal is right'], a: 0,
      cue: '「Why」で始まる母の一文の働き。',
      line: '*Why don’t you try* something more stylish?',
      said: '「もっとおしゃれなのを着てみたら？」と母が勧めている。',
      mean: 'Why don’t you 〜? は理由をたずねる形の提案。「〜してみたら？」と軽く勧める言い方。',
      trap: 'why を「なぜ」と取ると、責めているように聞こえる。答えは理由でなく、するかしないか。',
      use: 'Why don’t you try the fish?（魚料理にしてみたら？）' },

    // R fix: V2 (blind 60 %, right): "at dinner… opening line" made "business" obvious; choices now parallel
    // why: soon ← now = 今 (literal), read with "we're gonna be building"; impatient ← "Now…" as a scolding opener
    { id: 'm1', skill: 'marker', level: 'B2', point: 'now', reveals: ['zoning'], seg: [70.3, 80.2],
      stem: 'At dinner, what does the first word of Leslie’s opening line do?',
      choices: ['Marks a move to the main topic', 'Stresses that it starts very soon', 'Shows she is getting impatient'], a: 0,
      cue: '夕食の場面の、最初の一語。',
      line: '*Now*, you know that we’re gonna be building a park…',
      said: '食事が始まるとすぐ「さて、公園を作る件ですが」と切り出す。',
      mean: '文頭の Now ＝「さて」。話を本題に移す合図。',
      trap: 'now を「今」と訳すと時の話になる。文頭で区切る Now は話題の切りかえ。',
      use: 'Now, about the bill…（さて、お会計ですが…）' },

    // R fix: V2 (blind 85 %, right): "election" and "a job" were off-scene; both distractors now use the park and the
    //   council, said at dinner. a2's stem no longer names rezoning.
    // why: park in his town ← "park" and "your town" both said, wrong relation; his vote ← "approved… by our city
    //   council", but she asks how rezoning works for him, not for his support
    { id: 'g1', skill: 'gist', level: 'B2', point: 'zoning', seg: [70.3, 104.2],
      stem: 'At dinner, what does Leslie mainly want from George?',
      choices: ['Details on how rezoning works in his town', 'Ideas for building a park in his own town',
                'His vote for her park plan on the council'], a: 0,
      cue: '写真を見せたあと、何を詳しく聞きたがるか。',
      line: 'How difficult is *rezoning* in your town? Could you go into detail…',
      said: '公園の予定地の写真を見せ、彼の町での用途変更の難しさを詳しく聞いている。',
      mean: 'Leslie にとってこれは仕事の相談。公園のための手続きを聞き出したい。',
      trap: 'park や council から、賛成を頼む話と取りやすい。聞いているのは手続きのこと。',
      use: 'Could you go into a little more detail?（もう少し詳しく教えてもらえますか）' },

    // R fix: V2 (blind 65 %, right): "an argument" was a filler; now "small talk to work" (his movie question is real
    //   small talk) and the reversed order
    // why: small talk ← "What kind of movies do you like?" comes early, but it ends on his divorce; reversed ← both
    //   topics are heard, the order isn't
    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', reveals: ['nodate'], seg: [70.3, 161.3],
      stem: 'How does the dinner conversation change as it goes on?',
      choices: ['From her work questions to his love life', 'From small talk to her work questions',
                'From his love life to her work questions'], a: 0,
      cue: '前半と後半で、話題がどう入れかわるか。',
      said: '最初は公園と用途変更の話。途中から相手が恋愛や離婚の話を始める。',
      mean: '仕事の会合のつもりの Leslie と、個人的な話をしたい相手。話題の移り方にずれが出ている。',
      trap: '両方の話題が出るので、順番を逆にしやすい。誰が話題を変えたかで流れをつかむ。',
      use: 'Can we get back to business?（本題に戻ってもいい？）' },

    // anchor: 90.3–91.4 s both sources have "I like all kind of movies": "kind", not "kinds", five words in ≈ 1.4 s
    //   (≈ 210 wpm), "kind of" reduced
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'movies', seg: [87.2, 92.0],
      stem: 'Type the reply: “I like ___ movies.” (3 words)', answer: 'all kind of',
      cue: '「thrillers」のあと。文法より、聞こえた音を。',
      line: 'I like *all kind of* movies.',
      said: '好きな映画を聞かれ「いろんな映画が好き」と言う。kind of は「カインダ」と弱く続く。',
      mean: '文法では all kinds of。会話では s のない形もよく聞き、s は次の of に飲まれやすい。',
      trap: '習った形に合わせて kinds と書きたくなる。書き取りは、言われた音のとおりに。',
      use: 'I like all kinds of music.（いろんな音楽が好き）' },

    // R fix: V2 (blind 50 %, right) and a leak: the stem named "rezoning", g1's key. Two negatives made the key the odd
    //   one; now "amused but thrown" too.
    // why: bored but polite ← the 建前 frame: "refreshing" taken as a polite cover; amused but thrown ← "no-nonsense…
    //   aren't you?" heard as surprise
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'boring', seg: [104.2, 111.8],
      stem: 'When Leslie asks him to go into detail, how does George react?',
      choices: ['Pleased; it makes a nice change', 'Bored, but too polite to say so', 'Amused, but a bit thrown by it'], a: 0,
      cue: '「refreshing」のあと、ほかの女性と比べる部分。',
      line: 'It’s *refreshing* to be with someone who actually likes talking about government issues.',
      said: '「政治の話が好きな人といると新鮮だ」と言い、ほかの女性は退屈がると続ける。',
      mean: 'refreshing ＝ 新鮮でうれしい。仕事熱心さを相性の良さと受け取っている。',
      trap: 'ほめ言葉を建前と取ると「本当は退屈」に聞こえる。人と比べるほめ方は本気が多い。',
      use: 'It’s refreshing to meet a real coffee fan.（本当のコーヒー好きに会えてうれしい）' },

    // anchor: 104.8–111.1 s "Most of the women I go out with find it boring": the women he dates are who he measures
    //   Leslie against; 153.1–155.4 s "on a first date" (i4) says it outright
    // R fix: V2 (blind 60 %, right; C2, one rewrite): the title made "one of his dates" the only date-shaped choice.
    //   Now all three are about dates; if a fresh reader still gets it ≥ 80 %, drop it.
    // why: fears she's bored too ← scope: the others are bored, but she "actually likes" it; tired of shop talk ←
    //   direction flip: it's the women who find his topic boring
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'boring', seg: [104.2, 111.8],
      stem: 'When George compares Leslie with other women, what does he give away?',
      choices: ['That he is treating tonight as a date', 'That he fears this date is bored too',
                'That he is tired of dates who talk shop'], a: 0,
      cue: '比べている相手が、どんな女性たちか。',
      line: 'Most of *the women I go out with* find it boring.',
      said: '「デートする女性たちはたいてい退屈がる」と言い、Leslie と比べる。',
      mean: '比べる相手が「デートの相手」なので、今夜も同じ枠に入れている。Leslie はその含みに気づかない。',
      trap: 'boring の主語を取りちがえると、彼が退屈がる話になる。比べる相手の集まりが本音を表す。',
      use: 'Unlike most guests, you actually read the menu.（たいていの客と違って、ちゃんとメニューを読むね）' },

    // R fix: V2 (blind 65 %, right): choices now parallel "told him Leslie…", so "love life" isn't the odd fit
    // why: works late ← Leslie's reply "focusing on my career" heard as what her mother said; picky ← "no-nonsense",
    //   said just before
    { id: 'i3', skill: 'infer', level: 'B2', point: 'mother', seg: [116.0, 123.8],
      stem: 'What does George’s remark about Leslie’s mother tell us?',
      choices: ['Her mom told him Leslie rarely dates', 'Her mom told him Leslie works late',
                'Her mom told him Leslie is picky'], a: 0,
      cue: '「no-nonsense」のあと、「mentioned」に続く部分。',
      line: 'Your *mother mentioned* that you *don’t date much*.',
      said: '「お母さんから、あまりデートしないと聞いたよ」と相手が言う。',
      mean: '母が彼に、Leslie の恋愛事情まで話していたということ。',
      trap: '直後の「仕事に集中してる」は Leslie の返事。母の話と本人の言い分を分ける。',
      use: 'My sister mentioned you’re into hiking.（姉から、山歩きが好きだって聞いたよ）' },

    // R fix: V2 (blind 70 %, right): two happy distractors left the key the odd one out; now one angry, one calm
    // why: angry with her mother ← "your mother mentioned" makes the mother the target, but Leslie never mentions her;
    //   calm ← the 打ち明け合い frame, but she answers in a burst and turns it back with "Why do you ask?"
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'what', reveals: ['mother'], seg: [119.6, 131.9],
      stem: 'How does Leslie respond when George brings up her dating life?',
      choices: ['Caught off guard, and defensive', 'Angry with her mother, and says so',
                'Calm, and glad to talk about it'], a: 0,
      cue: '最初の一語の短さと、最後の聞き返し。',
      line: '*What?* I’ve been focusing on my career. *Why do you ask?*',
      said: '「えっ？仕事に集中してたの。なんで聞くの？」と返す。',
      mean: '不意をつかれて身構えている。すぐ「なぜ聞くの」と返すのは、話を切り上げたいサイン。',
      trap: 'mother が聞こえると母への怒りと取りやすいが、母には触れない。短い What? は動揺の合図。',
      use: 'Why do you ask? Is something wrong?（なんで聞くの？何かあった？）' },

    // R fix: V2 (blind 75 %, right): h1's stem said "divorce", and "career" was Leslie's. Now three "since…" choices;
    //   h1's stem no longer names the divorce.
    // why: kids grew up ← "they're grown up" comes right after; retired ← the age joke later, read back as a reason
    { id: 'd3', skill: 'detail', level: 'B1', point: 'nodate', seg: [124.7, 133.4],
      stem: 'Why hasn’t George been dating much, he says?',
      choices: ['Since his divorce', 'Since he retired', 'Since his kids grew up'], a: 0,
      cue: '「either」のすぐあと。',
      line: 'I haven’t been dating much either *since my divorce*.',
      said: '「僕も離婚してから、あまりデートしていない」と話す。',
      mean: 'either ＝「僕も」。Leslie と同じだと言い、個人的な話に進む。',
      trap: 'すぐあとの grown up に引っぱられやすい。理由は either の直後、since に続く語。',
      use: 'I haven’t been out much since the move.（引っ越してから、あまり出かけてない）' },

    // R fix: V2 (blind 50 %, right) and a leak: the stem said "the divorce" (d3's key). Distractors now near misses:
    //   step-kids ("not my kids") and the kids as a cover for himself.
    // why: ex-wife's ← "Not my kids" heard as step-children; hard on him ← "I'm coping, but…" read as him hiding behind
    //   the kids
    { id: 'h1', skill: 'humor', level: 'C1', point: 'grandkids', reveals: ['age'], seg: [131.8, 145.6],
      stem: 'When George says it was “tough on the kids”, why is it funny?',
      choices: ['The kids he means are his grandkids', 'The kids he means are his ex-wife’s',
                'He means it was hard on him, really'], a: 0,
      cue: '「not my kids」のあと、最後の一語。',
      line: 'Not my kids, ’cause they’re grown up, but it was tough on *their kids*.',
      said: '離婚は子どもにこたえた、と言ってから「自分の子は大人だから、その子どもに」と言い直す。',
      mean: 'kids が孫だと分かり、彼がかなり年上だと気づかされるのが笑い。',
      trap: 'not my kids で連れ子と取りやすい。最後の their で誰の子か決まる。',
      use: 'Not me. My brother.（僕じゃなくて、兄のこと）' },

    // R fix: C5: added `nodate` to reveals (its line says "my divorce")
    // why: business dinner ← the apology heard as "too personal for a meeting"; gone wrong ← an apology heard as the
    //   evening failing, though "I feel I can tell you anything" follows
    { id: 'i4', skill: 'infer', level: 'B2', point: 'firstdate', reveals: ['boring', 'nodate'], seg: [149.4, 161.3],
      stem: 'What does George’s apology show about how he sees the evening?',
      choices: ['As their first date', 'As a business dinner', 'As a date gone wrong'], a: 0,
      cue: '謝ったあと、「on a」に続く2語。',
      line: 'I shouldn’t bring up my divorce *on a first date*.',
      said: '「初デートで離婚の話はよくないね」と謝り、「でも君には何でも話せる」と続ける。',
      mean: 'first date と言った時点で、彼には今夜はデート。',
      trap: '謝罪を失敗のサインと取りやすい。直後の「何でも話せる」は、うまくいっていると感じている証拠。',
      use: 'Sorry, I shouldn’t bring up work at dinner.（ごめん、食事中に仕事の話はやめよう）' },

    // R fix: C10: the stem named George, which needed an ear check; the speaker doesn't matter to the answer
    { id: 'x1', skill: 'dict', level: 'B2', point: 'night', reveals: ['firstdate'], seg: [169.4, 172.4],
      stem: 'Type what comes after “Let’s have some more wine.” (6 words)',
      answer: 'see where the night takes us',
      cue: '「wine」のすぐあと。',
      line: 'Let’s have some more wine. *See where the night takes us*.',
      said: '「もう少しワインを飲もう。流れにまかせよう」と言う。',
      mean: 'see where 〜 takes us ＝ 成り行きにまかせよう。ここでは甘い含み。',
      trap: 'where the は「ウェアザ」、takes us は「テイクサス」と続く。語の数を確かめて書く。',
      use: 'Let’s just see where the day takes us.（今日は流れにまかせよう）' },

    // R fix: V2 (blind 60 %, right): the key was the only one about him; now three "the age remark…" readings
    // why: at her mom ← "neither" heard as "neither are you" (scope shift); to heart ← "Well, neither…" heard as
    //   agreeing about herself (同調)
    { id: 'h2', skill: 'humor', level: 'C1', point: 'age', reveals: ['younger'], seg: [179.0, 187.3],
      stem: 'When her mother says Leslie isn’t getting younger, why does Leslie’s reply get a laugh?',
      choices: ['She aims the age remark at him', 'She aims the age remark at her mom',
                'She takes the age remark to heart'], a: 0,
      cue: '「neither is he」のあとに足す数字。',
      line: 'Leslie, you’re not getting any younger. — Well, *neither is he*. And he’s *62* years old.',
      said: '「もう若くないのよ」と言われ、「彼だってそう。62歳よ」と返す。',
      mean: '母の決まり文句を、相手の年齢に向け直している。年の差がありすぎる、という反撃。',
      trap: 'neither だけでは向きが不明。直後の he で、彼の年の話と決まる。',
      use: 'Neither are you, my friend.（それはお互いさまだよ）' },

    // why: 52 ← only the "-ty two" is caught; 72 ← an older guess from the grown-up kids
    { id: 'n1', skill: 'number', level: 'B1', point: 'age', seg: [180.5, 187.3], keep: true,
      stem: 'How old is George, according to Leslie?',
      choices: ['52', '62', '72'], a: 1,
      cue: '「neither is he」のあと、「years old」の前。',
      line: 'And he’s *62* years old.',
      said: '母の「若くないのよ」に、「彼もね。62歳だし」と返す。',
      mean: 'sixty の t は弾んで「シクスィー」に近く聞こえる。',
      trap: '-ty の数は最初の子音で決まる。fifty は「フ」、seventy は「セ」で始まる。',
      use: 'She just turned sixty.（彼女は60歳になったばかり）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'younger', seg: [180.5, 185.0],
      stem: 'Type what her mother says: “Leslie, you’re ___.” (4 words)', answer: 'not getting any younger',
      cue: '名前を呼んだすぐあと。',
      line: 'Leslie, you’re *not getting any younger*.',
      said: '「Leslie、あなたももう若くないのよ」と母が言う。',
      mean: 'not getting any younger ＝「もう若くない」。せかすときの決まり文句。',
      trap: 'getting の t は弾んで「ゲリン」、any とつながる。語の数を数えて書く。',
      use: 'We’re not getting any younger. Let’s go!（もう若くないんだし、行こう！）' },
  ]
};
