// “Is Twilight Worth Saving? | Parks and Recreation” (the official Parks and Recreation channel, Season 3): Kelly has
// chained himself to a pipe in Leslie's office until Twilight goes into the town's time capsule; Leslie didn't like
// the book, but finds his real reason (his 12-year-old daughter), changes her mind, hears her coworkers' objections,
// and takes the choice to a public forum.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Leslie (29.8, 44.9, 121.4 s), Kelly
// (43.5, 57.0 s). The coworkers who object (121–142 s) are never named: stems say "a coworker". Untested: 0–24 s (the
// office's Twilight talk; it needs the books, and "Look at it this way, Tom" / "Look at it, that's my dog" disagree
// at 17.3 s), 54.7–57.0 s ("he seemed… I am, Kelly" in the captions, "you seem… Kelly" in whisper; a1's line keeps only
// "pretty chipper this morning"), 87.4 s ("your daughter" / "you're a daughter"), 104.6 s ("you might be a big hero",
// both), 153–156 s ("Crackpot convention": who, and where), 174.4 s ("put in" / "put it in"), 178 s on (music).
// EAR CHECK: 119.4 s c2s — in “I think we should put Twilight in the time capsule”, is the stress on “should”, and
//   not on “we”? (ship only once confirmed)
// REVIEW 2026-11-16: pass 7, fix 16, drop 0, new 0; ear checks 1
// REVIEW open: c2s, since "you" → "we" also changes, so the ear check now asks should vs we. a1 is closer to vocabulary
//   (chipper) than to attitude; it was kept for the attitude minimum
// REVIEW: the ear checks for s1 and x1 were taken off (both sources agree on the words)
import type { Clip } from '../types.ts';

export const twilightCapsule: Clip = {
  id: 'twilight', video: 'sbNkUivSp-A', title: 'Is Twilight Worth Saving?', dur: 198, wpm: 158, band: 'mid',
  tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: hurt ← "you guys are the worst" heard as wounded; behind on work ← "do my work" taken as the real reason
    { id: 'a0', skill: 'attitude', level: 'B1', point: 'worst', seg: [22.4, 28.75],
      stem: 'How does Leslie feel as she heads to the conference room?',
      choices: ['Fed up with her coworkers', 'Hurt by what her coworkers said', 'Worried she’s behind on her work'],
      a: 0,
      cue: '「conference room」のあと、文の最後。',
      line: 'I’m gonna go do my work in the conference room ’cause *you guys are the worst*.',
      said: '「会議室で仕事する。あなたたち最悪だから」と言って席を立つ。',
      mean: 'the worst ＝ 最悪。うるさい同僚にうんざりして、半分冗談で突き放している。',
      trap: 'do my work が聞こえると仕事の遅れが理由に思える。’cause のあとが本当の理由。',
      use: 'I’m out. You guys are the worst.（もう行く。みんな最悪）' },

    // R fix: V2 (blind 70 % right): the key was the only choice in which she learns the reason; "talks him into giving
    //   up" became a near miss that learns it and still refuses (Kelly's own "you don't have to")
    // why: changes her mind about the book itself ← "Read Twilight… transformed your life" is Kelly's guess, heard as
    //   what happened; learns it, still says no ← Kelly does say "this is a mistake… you don't have to"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['pages', 'getinto', 'well', 'why'], seg: [43.0, 121.3],
      stem: 'How does Leslie’s view of Kelly’s protest change?',
      choices: ['She learns his real reason and comes to back it', 'She reads the book and comes to love it herself',
                'She learns his real reason, but still says no'], a: 0,
      cue: '本を読んだ感想と、表紙の内側で見つけたもの。',
      said: '本は気に入らなかったが、表紙の名前から娘のためだと見抜き、入れようと言い出す。',
      mean: '本の中身ではなく、父親の動機に心を動かされて味方になる流れ。',
      trap: 'Kelly の「人生が変わった？」は彼の期待で、事実ではない。返事の「最初の10ページ」を聞く。',
      use: 'Okay, now I get why you did it.（なるほど、やった理由が分かった）' },

    // why: asks to be moved ← "I hope you don't mind" read as a request still to be granted; complains ← "comfortable"
    //   heard as "not comfortable"
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'pipe1', seg: [43.85, 48.55],
      stem: 'What is Kelly doing with his first lines to Leslie?',
      choices: ['Politely letting her know he’s changed pipes', 'Asking her to move him over to another pipe',
                'Complaining that the old pipe was too hard'], a: 0,
      cue: '「I hope you don’t mind」のあと。',
      line: '*I hope you don’t mind* I move myself over to this pipe. It’s a little more comfortable.',
      said: '「こっちのパイプに移ったけど、いいよね。少し楽なんだ」と言う。',
      mean: 'I hope you don’t mind ＝ 事後に「いいよね」と断る言い方。抗議中なのに礼儀正しい。',
      trap: 'mind で許可を求める形を思いやすいが、移動はもう済んでいる。',
      use: 'I hope you don’t mind, I sat here.（ここに座ったけど、いいよね）' },

    // R fix: V2 (blind 60 % right): "It was bad, so he is thinking of quitting" clashed with "All right"; all three now
    //   start "It was fine"
    // why: after thinking it over ← "considering" taken as 考える; not sure ← "considering" heard as 考え中, a hedge
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'considering', seg: [48.5, 52.3],
      stem: 'What does Kelly mean by his short answer about his night?',
      choices: ['It was fine, given the situation he’s in', 'It was fine, now that he’s thought about it',
                'It was fine, he thinks, but he isn’t sure'], a: 0,
      cue: '「Sleep well?」への返事、2語目。',
      line: 'All right, *considering*.',
      said: '「よく眠れた？」に「まあまあ、状況を考えればね」と答える。',
      mean: '文末の considering ＝「この状況にしては」。パイプにつながれて寝たことを指す。',
      trap: 'considering を「考え中」と取りやすい。文末に一語で置くと「～を考えれば」。',
      use: 'The food was good, considering.（状況のわりに料理はよかった）' },

    // R fix: V2 (blind 50 % right): "took away his cup" was a filler; now a role swap (pick you up → pick me up)
    // why: drive him ← "pick you up" = 迎えに行く; asked him for one ← "you" and "me" swapped
    { id: 'f2', skill: 'phrase', level: 'B1', point: 'pickup', seg: [51.0, 54.45],
      stem: 'What has Leslie done about coffee?',
      choices: ['She bought him one on her way in', 'She offered to drive him to get one',
                'She asked him to grab her one too'], a: 0,
      cue: '「coffee」の前、you をはさむ動詞。',
      line: 'I *picked you up* some coffee.',
      said: '「コーヒー買ってきたよ」と渡す。',
      mean: 'pick someone up something ＝ ついでに買ってきてあげる。',
      trap: 'pick you up は「車で迎えに行く」でも有名。後ろに物（coffee）が来たら「買ってくる」。',
      use: 'Can you pick me up some milk?（牛乳買ってきてくれる？）' },

    // why: tired ← a night at a pipe, and "this morning" suggests a hard start; nervous ← she's about to face him
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'chipper', seg: [53.3, 57.7],
      stem: 'How does Kelly describe Leslie’s mood this morning?',
      choices: ['Cheerful and full of energy', 'Tired after a long night', 'Nervous about the day ahead'], a: 0,
      cue: '「this morning」の直前の形容詞。',
      line: '…pretty *chipper* this morning.',
      said: 'コーヒーのお礼のあと、「今朝はずいぶん元気だね」と言う。',
      mean: 'chipper ＝ 明るく元気な。Leslie は理由があって上機嫌、と次の一言につながる。',
      trap: '徹夜明けの場面なので「疲れ」を予想しやすい。pretty は「かなり」で、弱める語ではない。',
      use: 'You’re chipper today!（今日は元気だね！）' },

    // R fix: V2/S1 (blind 65 % right): "hopeful guess" in the stem echoed the key's "what he hopes"; stem neutral, and
    //   the agree choice made more tempting
    // why: he guessed right ← "Well" read as a warm "yes" (the Japanese そうなの preface); time to think ← "Well" as a
    //   filler (えーと)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'well', reveals: ['pages', 'getinto'], seg: [60.6, 69.2],
      stem: 'When Leslie answers Kelly’s guess about her night, what does her first word signal?',
      choices: ['That her answer won’t match his guess', 'That she’s happy he guessed right',
                'That she needs a moment to think it over'], a: 0,
      cue: '「time capsule?」のあと、返事の最初。',
      line: '*Well*, I read the first ten pages. I couldn’t really get into it, though.',
      said: '「人生が変わったんでしょ？」に、「うーん、最初の10ページは読んだけど」と返す。',
      mean: '答えの頭の Well は、相手の期待と違う答えの予告になることが多い。',
      trap: 'Well を「えーと」とだけ取ると、その先の否定を予想できない。',
      use: 'Well, it’s not quite what I hoped.（うーん、思ったほどでは）' },

    // why: 2 ← "the first" makes a tiny number feel natural; 20 ← "ten" and "twenty" share the t- onset
    { id: 'n1', skill: 'number', level: 'B1', point: 'pages', seg: [65.0, 69.25], keep: true,
      stem: 'How many pages of the book did Leslie read?',
      choices: ['2', '10', '20'], a: 1,
      cue: '「the first」のすぐあと。',
      line: 'I read *the first ten pages*.',
      said: '「最初の10ページだけ読んだ」と言う。',
      mean: 'the first ten pages ＝ 冒頭の10ページ。それ以上は読んでいない。',
      trap: 'ten と twenty はどちらも t で始まる。twenty なら「ティ」で終わる2音節。',
      use: 'I only saw the first ten minutes.（最初の10分しか見てない）' },

    // R fix: V2 (blind 60 % right): "understand its words" was a weak literal; now "follow the story"
    // why: couldn't follow ← "get" = 理解する (I don't get it); no time ← "couldn't really" heard as a reason outside
    //   the book
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'getinto', seg: [65.0, 71.3],
      stem: 'What does Leslie say about reading the book?',
      choices: ['She couldn’t get interested in it', 'She couldn’t follow the story in it',
                'She couldn’t find time to finish it'], a: 0,
      cue: '「ten pages」のあと、though で終わる文。',
      line: 'I *couldn’t really get into it*, though.',
      said: '「あんまりはまれなかった」と言い、ハリー・ポッター派だと付け足す。',
      mean: 'get into ～ ＝ ～にはまる、夢中になる。本や番組によく使う。',
      trap: 'get は「分かる」でも使うので「理解できない」に引かれやすい。get into ＋ 作品は「はまる」。',
      use: 'I just couldn’t get into that show.（あの番組にはまれなかった）' },

    // why: 20 ← -lve and -nty both end soft; 22 ← "twenty" heard and a second number filled in
    { id: 'n2', skill: 'number', level: 'B1', point: 'age', seg: [76.6, 79.95], keep: true,
      stem: 'How old is the girl whose name Leslie found?',
      choices: ['12', '20', '22'], a: 0,
      cue: '名前のすぐあと、years old の前。',
      line: 'Liz… is *12 years old*.',
      said: '少し調べたら、その子は12歳だった、と言う。',
      mean: 'twelve は1音節。この子が中学生だと、次の言葉でも分かる。',
      trap: 'twelve と twenty は最初が同じ tw-。twelve は短い1音節、twenty は2音節。',
      use: 'My son is twelve years old.（息子は12歳です）' },

    // R fix: V2 (blind 50 % right): "win back the respect of his ex-wife" was weak; now a "good dad" reading
    // why: newspaper ← "human interest story" comes later; ex-wife ← "Liz's mom and I divorced" is heard first, so he
    //   seems to be proving himself to her
    { id: 'd1', skill: 'detail', level: 'B1', point: 'why', seg: [89.6, 101.6],
      stem: 'Why did Kelly start his protest?',
      choices: ['To lift his daughter’s spirits after a hard time', 'To get his daughter’s name into the newspaper',
                'To get his ex-wife to see him as a good dad'], a: 0,
      cue: '「divorced」のあと、her が誰か。',
      line: 'it’s been *really hard on her*. *She loves Twilight*',
      said: '離婚で娘はつらい思いをしている。娘は Twilight が大好き、と話す。',
      mean: '娘を喜ばせたくて、好きな本をタイムカプセルに入れようとした。',
      trap: 'divorced で元妻の話を予想しやすいが、her は娘のこと。直前の「娘のため？」に答えている。',
      use: 'It’s been really hard on all of us.（みんなにとって本当につらかった）' },

    // R fix: V2 + K6 (blind 60 % right): the key was the only "gently" choice; "Gently" cut, and "wrong to bring his
    //   daughter up" (refuted by nothing he did) swapped for the shouldn't-have reading
    // why: kept it to himself ← "should have" heard as "shouldn't have", the t lost; too late ← "should have" read as
    //   a chance that's gone
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'shouldve', seg: [105.8, 110.85],
      stem: 'Right after “That’s really sweet,” what is Leslie’s next line doing?',
      choices: ['Saying the truth would have helped his case', 'Saying she wishes he had kept it to himself',
                'Saying it is now too late to help him out'], a: 0,
      cue: '「sweet」のあと、for your daughter で終わる文。',
      line: 'That’s really sweet. *You should have told me* you were doing this for your daughter.',
      said: '「すてきな話。娘さんのためだって言ってくれればよかったのに」と言う。',
      mean: '言ってくれたら味方したのに、という気持ち。責めるより、優しく惜しむ言葉。',
      trap: '「べきだった」と訳すと叱責、shouldn’t と聞くと逆の意味。直前の sweet と聞く。',
      use: 'You should have told me! I’d have helped.（言ってくれれば手伝ったのに）' },

    // why: shouldn't have ← the n't is hard to hear, and blame would fit "you were doing this"; could have ← "coulda"
    //   and "shoulda" differ only in the first sound
    { id: 's1', skill: 'sound', level: 'B2', point: 'shouldve', seg: [107.6, 110.85],
      stem: 'Fill the gap: “You ___ told me you were doing this…”',
      choices: ['should have', 'shouldn’t have', 'could have'], a: 0,
      cue: '「You」のすぐあと、told の前。',
      line: 'You *should have* told me you were doing this for your daughter.',
      said: '「娘さんのためって言ってくれればよかったのに」。',
      mean: 'should have は have が弱まり「シュダ」。しなかったことを惜しむ形。',
      trap: 'shouldn’t なら「ン」が残る。「シュダ」のあとに「ン」がなければ should have。',
      use: 'I should have called first.（先に電話すればよかった）' },

    // R fix: V2 (blind 55 % right): "pull her here by force" was too odd to tempt; now a natural literal reading
    // why: bring her here ← "drag" taken literally (引きずる); bore her ← "a drag" means something boring
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'drag', seg: [110.1, 113.35],
      stem: 'Why didn’t Kelly mention his daughter, in his words?',
      choices: ['He didn’t want to get her involved', 'He didn’t want to bring her down here with him',
                'He didn’t want to bore her with it all'], a: 0,
      cue: '「for your daughter」の直後の返事。',
      line: 'I didn’t want to *drag her into it*.',
      said: '「娘を巻きこみたくなかった」と答える。',
      mean: 'drag someone into ～ ＝ 人を（いやな事に）巻きこむ。',
      trap: 'drag は「引きずる」なので力ずくの絵を思いやすい。into it が付くと「巻きこむ」。',
      use: 'Sorry to drag you into this.（巻きこんでごめん）' },

    // R fix: K1/V2 (blind 50 % right): "You" → "we" also changes between the two lines, so stress on "we" was
    //   defensible and missing; it replaces the weak "Twilight" choice, and the ear check now asks should vs we
    // why: on "we" ← "you" → "we" is the other changed word, so a contrast of persons seems natural; on "I" ← the
    //   coworkers object right after, so a contrast with them seems natural
    // anchor: 114.7–116.3 s "You don't have to put Twilight in a time capsule" / 119.0–120.6 s "I think we should put
    //   Twilight in the time capsule": the verb changes "don't have to" → "should" (and "you" → "we"); the reply is
    //   about whether to do it, not who; nobody else has spoken yet
    // retired: a C2 stress item, until its ear check (should vs we, 119.4 s)
    { id: 'c2s', skill: 'sound', level: 'C2', point: 'stress', reveals: ['scene'], seg: [113.0, 121.3], retired: true,
      stem: 'In Leslie’s reply to “You don’t have to…”, where is the stress, and why?',
      choices: ['On “should”: against his “don’t have to”', 'On “we”: it is her call now, not his',
                'On “I”: whatever her coworkers think'], a: 0,
      cue: '彼の文と彼女の文で、入れかわった語。',
      line: 'You *don’t have to* put Twilight in… — I think we *should* put Twilight in the time capsule.',
      said: '「入れなくていい」と引く彼に、「入れるべき」と同じ形で返す。',
      mean: 'くり返しの文では、変えた語に強勢が来る。ここは don’t have to → should。同じ語の Twilight は弱い。',
      trap: 'you→we も変わるが、争点は「するかどうか」。くり返しでは対立する語を強く読む。',
      use: 'You don’t have to. But I want to.（しなくていいよ。でもしたいの）' },

    // R fix: V2 (blind 60 % right): "ignores the risk" was the outlier; now all three accept the risk, and the press
    //   (Shauna, "human interest story") is the near miss
    // why: drops it ← "that's a good point" heard as giving up; the press ← "get Shauna on board… a great human
    //   interest story" just before
    { id: 'g2', skill: 'gist', level: 'B2', point: 'forum', reveals: ['pipe', 'copycat'], seg: [118.5, 177.6],
      stem: 'How does Leslie handle her coworkers’ objections?',
      choices: ['She agrees it’s a risk and asks the public', 'She agrees it’s a risk and drops the idea',
                'She agrees it’s a risk and asks the press'], a: 0,
      cue: '「good point」のあと、次の場面の会。',
      said: '前例になるという指摘を認め、市民の意見を聞く会で、入れる物をみんなで決めることにする。',
      mean: '反対を押し切るのでもやめるのでもなく、決め方を変える流れ。',
      trap: 'good point は「やめる」の合図に聞こえやすいが、Then のあとで別の手を出している。',
      use: 'Good point. Let’s ask everyone.（確かに。みんなに聞こう）' },

    // R fix: V2 (blind 60 % right): "explain her plan once again" was a filler; now "Yeah" read as agreeing with Leslie
    // why: a lost item ← "What happened to…?" taken literally as asking where a thing went; agreeing ← "Yeah" heard
    //   as backing Leslie, though it backs "Leslie, no"
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'encaps', seg: [121.0, 127.85],
      stem: 'What is the coworker doing with “What happened to…?”',
      choices: ['Reminding Leslie of the capsule’s goal, to object', 'Asking what became of an item that went missing',
                'Agreeing with Leslie, then asking a real question'], a: 0,
      cue: '「weirdos」のあと、Yeah で始まる質問。',
      line: 'what happened to *a perfect encapsulation of life in Pawnee*?',
      said: '「パーニーの暮らしを完ぺきに表す、って話はどうなったの？」と聞く。',
      mean: '答えを求めない質問で、Leslie 自身の目標を持ち出して反対している。',
      trap: 'What happened to ～? を文字通り「～はどこへ」と取りやすい。前の No に続く反論。',
      use: 'What happened to “no dessert”?（デザート抜きって話はどうしたの？）' },

    // R fix: V2 (blind 55 % right): only the key said "the book fits it"; the town reading now does too
    // why: kindness over the goal ← she sides with Kelly, so she seems to drop the goal; most of the town ← "life in
    //   Pawnee" heard as the whole town, missing "for that guy"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'lifein', seg: [127.45, 131.9],
      stem: 'How does Leslie answer the point about the capsule’s goal?',
      choices: ['The book fits it, for people like Kelly', 'The goal matters less than being kind',
                'The book fits it, since most of the town reads it'], a: 0,
      cue: '「Well」のあと、最初の3語。',
      line: 'Well, *for that guy*, life in Pawnee is him and his daughter reading that book.',
      said: '「あの人にとっては、娘と本を読むことがパーニーの暮らしなの」と返す。',
      mean: '目標を捨てずに、「暮らし」の中身を一人の住民の目で言いかえている。',
      trap: '反論に聞こえるので目標を捨てたと思いやすい。for that guy は町全体でなく彼一人。',
      use: 'For me, home is wherever my family is.（私にとっては家族のいる所が家）' },

    // R fix: V2 (blind 60 % right): the key was the only "giving in" choice; all three now start the same way
    // why: Kelly again ← "some guy" heard as Kelly himself; bad press ← "if this gets out" = 記事になる, and a reporter
    //   was just mentioned
    { id: 'i2', skill: 'infer', level: 'B2', point: 'copycat', reveals: ['gonna'], seg: [135.6, 144.2],
      stem: 'What is the coworker’s warning really about?',
      choices: ['Giving in would invite more protests like it', 'Giving in would bring Kelly back again and again',
                'Giving in would make Leslie look weak in the news'], a: 0,
      cue: '「every time」のあと、some guy が誰か。',
      line: 'every time you want to do anything, *some guy’s gonna come into your office and handcuff himself to a pipe*.',
      said: '「広まったら、何かするたびに誰かがパイプに手錠でつながりに来る」。',
      mean: '一度折れると、同じやり方をまねる人が次々に来る、という警告。',
      trap: 'some guy を Kelly と取りやすいが、some は知らない誰か。every time で「次々に」。',
      use: 'If we say yes, everyone will ask.（OKしたら、みんな頼んでくるよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'gonna', seg: [138.35, 140.75],
      stem: 'Type what she says: “…anything, ___ come into your office…” (3 words)', answer: 'some guy\'s gonna',
      cue: '「anything」のすぐあと、come の前。',
      line: '*some guy’s gonna* come into your office',
      said: '「誰かが来て…」。guy’s の s と gonna がつながる。',
      mean: 'going to は「ガナ」。guy’s gonna で「ガイズガナ」と続く。',
      trap: 'guy’s の s が小さく、some guy に聞こえやすい。gonna の前の「ズ」を聞く。',
      use: 'Someone’s gonna call you back.（誰かが折り返すよ）' },

    // R fix: V2 (blind 65 % right): "put up with more people chained up" was a literal filler; now a near miss that
    //   gets the forum but narrows it to Twilight ("whichever items" refutes it)
    // why: a vote on Twilight alone ← the forum is caught, but "suggestions from everyone… whichever items" missed;
    //   the press ← "Shauna… human interest story" just before
    // anchor: 142.9–143.8 s "that's a good point" (she accepts the risk), 146.3–148.6 s "Then we shall bring the pipe to
    //   them", 157.1–164.6 s "that's what today's forum is for. We're gonna hear suggestions from everyone"
    // retired: with c2s out, one C2 alone is under 2; back with c2s after its ear check
    { id: 'c2p', skill: 'infer', level: 'C2', point: 'pipe', seg: [142.6, 165.0], retired: true,
      stem: 'Given what follows, what does Leslie mean by “bring the pipe to them”?',
      choices: ['Hand the choice to the public at a forum', 'Take Kelly’s protest story to the press',
                'Ask the public to vote on Twilight alone'], a: 0,
      cue: '「good point」と、次の場面の説明。',
      line: 'that’s a good point. … Then we shall *bring the pipe to them*. … So that’s what *today’s forum* is for.',
      said: '「確かに」と認め「パイプを向こうへ持っていく」と言うと、場面は市民の意見を聞く会へ。',
      mean: 'パイプは「市民の声」のたとえ。一人の抗議に応えるのでなく、町のみんなに聞きに行く。',
      trap: 'pipe を文字通り取ると話が見えない。たとえが出たら、次の場面で何が起きたかで意味を決める。',
      use: 'Let’s take it to a vote.（みんなで決めよう）' },

    // R fix: V2 (blind 50 % right): "Books, films and vampires" was weak; now a keyword trap on "government project"
    // why: political ← "this is a government project" just before; private things ← the usual rule for
    //   a time capsule
    { id: 'd2', skill: 'detail', level: 'B2', point: 'rules', seg: [165.5, 172.5],
      stem: 'What kinds of items does Leslie rule out?',
      choices: ['Ads for companies and religious things', 'Political items and anything about the city',
                'Personal photos and private letters'], a: 0,
      cue: '「refrain from」のあと。',
      line: 'we need to *refrain from corporate promotion and religious items*.',
      said: '「市の事業なので、企業の宣伝と宗教的な物は控えて」。',
      mean: 'refrain from ＝ 控える。corporate promotion ＝ 企業の宣伝。',
      trap: 'government が聞こえると政治の物を思いやすい。so のあとが本題。',
      use: 'Please refrain from using your phone.（携帯のご使用はお控えください）' },

    // R fix: V2 (blind 55 % right): “Leslie forgot the rules” was a filler; now “refrain from” read the wrong way round
    // why: Kelly's book ← the same “put … in” frame as “put Twilight in”; what she asked for ← “refrain from” not
    //   known, so "religious items" sounds like a request
    { id: 'h1', skill: 'humor', level: 'C1', point: 'bible', reveals: ['rules'], seg: [165.5, 177.6],
      stem: 'Why is the first suggestion at the forum funny?',
      choices: ['It breaks the rule she has just given', 'It names the same book Kelly wanted',
                'It’s just the kind of item she asked for'], a: 0,
      cue: '直前の注意と、最初の提案。',
      line: '…*religious items*. Who’d like to start? — I think we should put in *the Bible*.',
      said: '宗教的な物は控えて、と言った直後、最初の人が「聖書を入れるべき」と言う。',
      mean: '言われたばかりのルールを、最初の一人がいきなり破る。',
      trap: 'refrain from（控える）を知らないと逆に取れる。直前の注意と並べて聞く。',
      use: 'Any questions? Anyone?（質問は？誰か？）' },
  ]
};
