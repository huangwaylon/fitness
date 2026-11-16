// “Parks and Recreation | Leslie's Finally Ready (Episode Highlight)” (the official Parks and Recreation channel,
// Season 6): Leslie and Ben agree to let a coin decide which of them runs for governor, Leslie announces she is running
// and toasts her old team, and years later, as a former governor, she ends a speech on the same idea about work.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–9 s (captions "on her running… has been",
// whisper "on our running… I've been"), 11.7–12 s ("anything" / "Yeah, me neither"), 84–89 s (crowd reactions,
// "Holy for you. Nope."), 96–107 s (the dream journal and "This makes sense"), 222–245 s (the swing; speakers unclear),
// 253–295 s (the photo gags lean on backstory: vampire, Burt Macklin, Gary/Gail).
// REVIEW 2026-11-16: pass 3, fix 18, drop 0, new 0; ear checks 3 (on 2 lines, unchanged)
//   Open: nt2 runs 54.9 s, because its evidence is a toast and a speech 40 s apart. Only gist/dict lengths are
//   tested; shorten it only if the app can't replay that long.
//   Open: draw sim, play 4, seeds 14 and 16: no unseen C2 can be drawn (nt2 shares `message` with g2). This was
//   there before the review.
// EAR CHECK: 10.6–11.5 s x1, 35.4–36.1 s s1 — both sources have "I haven't had a chance" and "whoever doesn't run";
//   confirm the linking in "haven't had a" and that the t of "doesn't" is dropped before "run"
// EAR CHECK: 177.5–179.8 s nt3 — the main stress in "Because it definitely is" falls on "is" (answering "isn't"),
//   not on "definitely" (ship only once confirmed)
import type { Clip } from '../types.ts';

export const leslieReady: Clip = {
  id: 'leslieready', video: 'ekpylglrh2U', title: 'Leslie\'s Finally Ready (Episode Highlight)', dur: 314, wpm: 138,
  band: 'slow', tags: ['職場', '恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %): "coin" stood out against two thin options. Now three ways of deciding, each built from
    //   the talk.
    // why: friends first ← "did anyone have any insights" + "I haven't had a chance to ask them"; likelier to win ←
    //   "it doesn't mean we're gonna win" heard as the deciding test
    { id: 'g1', skill: 'gist', level: 'B2', point: 'coin', seg: [0, 66.8],
      stem: 'In their talk at the start, how do Leslie and Ben settle who runs?',
      choices: ['Leave it to chance; the other one helps out', 'Ask their friends first, then pick together',
                'Pick whoever is likelier to win, then team up'], a: 0,
      cue: 'idea のあとの提案と、最後の let’s go tell。',
      line: 'I think we should *flip a coin*.',
      said: 'どちらが知事選に出るかで対立したくない二人。レスリーが「コインを投げよう」と言う。',
      mean: '出るのは一人。決まらなかった方が、そばで支えるという約束つき。',
      trap: '「勝てるとは限らない」は出ない理由でなく、こだわらない理由。友達は見届ける側。',
      use: 'Let’s just flip a coin.（コインで決めちゃおう）' },

    // R fix: S4: the segment ended at 12.1 s, inside the next word ("anything" / "me neither"); now 12.6 s.
    { id: 'x1', skill: 'dict', level: 'B1', point: 'askthem', seg: [8.9, 12.6],
      stem: 'Type the missing words: “…catching up with everyone, I ___ to ask them.” (4 words)',
      answer: "haven't had a chance",
      cue: 'catching up のあと、to ask の前。',
      line: 'I *haven’t had a chance* to ask them.',
      said: '忙しくて、まだみんなに聞く機会がなかったと言う。',
      mean: 'まだ〜できていない、の意味。haven’t had a がつながり「ハヴンハダ」に近い。',
      trap: 't や d が弱く、語が足りなく聞こえやすい。語の数を手がかりに弱い語を補う。',
      use: 'I haven’t had a chance to check.（まだ確認できてないんだ）' },

    // R fix: V2 (blind 50 %): the key was the only choice about the two of them. Now all three are; S4: the end
    //   clipped "stinks", 16.3 → 16.6 s.
    // why: too busy ← "I've been so busy catching up" just before; neither winning ← "win" comes in the very next line
    { id: 'd1', skill: 'detail', level: 'B1', point: 'sides', seg: [12.0, 16.6],
      stem: 'After “here’s what I think”, what does the speaker say they hate?',
      choices: ['Being on opposite sides from each other', 'Being too busy to talk things over together',
                'Both running and maybe neither one winning'], a: 0,
      cue: 'here’s what I think のすぐあと。',
      line: 'I hate when we’re *on opposite sides*. It stinks.',
      said: '「こう思う。二人が反対の側に立つのは嫌だ。最悪だよ」と言う。',
      mean: 'on opposite sides ＝ 対立する立場。知事選で張り合うのが嫌、という本音。',
      trap: '直前の話や次の win に引っぱられやすい。I hate のすぐあとを拾う。',
      use: 'I hate it when we argue.（ケンカするの、ほんとに嫌）' },

    // R fix: V2 + V4 (blind 50 %): two choices were mirror images (real coin / figure of speech), which pointed at
    //   the key, and the stem asked what she adds, not what the line does. Now three acts.
    // why: correcting ← "I mean" learned as a self-correction (言い直し); joking ← "literally" heard as a light
    //   intensifier, the idea floated half in fun
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'literally', reveals: ['coin'], seg: [26.7, 32.3],
      stem: 'When Leslie says her coin idea a second time, what is she doing?',
      choices: ['Stressing she’s serious about a real coin', 'Correcting the way she put it a moment ago',
                'Joking, so that Ben won’t take it seriously'], a: 0,
      cue: '2回目の提案の前の、短い言葉。',
      line: '*I mean it*, let’s *literally* flip a coin.',
      said: '「本気だよ。本当にコインを投げよう」とくり返す。',
      mean: 'I mean it ＝ 本気だという念押し。本物のコインを投げよう、という提案。',
      trap: 'I mean だけなら言い直しだが、it が付くと「本気」。literally は「たとえでなく」。',
      use: 'I mean it. Call me anytime.（本気だよ。いつでも電話して）' },

    // why: does ← n't's t drops before "run", so only "dz" is caught; won't ← "gonna" later in the line pulls toward
    //   the future; can't ← the same "ン" before "run", with the vowel misheard (/ʌ/ vs /æ/)
    // R fix: V2 (blind 70 %): "right alongside the other one" in the stem settled it by logic. The stem stops at
    //   "gonna be…"; S4: the segment now starts at 32.0 s so it holds "whoever runs", which the trap relies on.
    { id: 's1', skill: 'sound', level: 'B2', point: 'doesnt', seg: [32.0, 42.3],
      stem: 'Fill the gap: “And whoever ___ run is gonna be…”',
      choices: ['doesn’t', 'does', 'won’t', 'can’t'], a: 0,
      cue: 'whoever のすぐあと、run の前の短い語。',
      line: 'and whoever *doesn’t* run is gonna be right alongside the other one',
      said: '「出る方はいい仕事をするし、出ない方はすぐ横で支える」と言う。',
      mean: 'doesn’t の t は run の前でほぼ消え「ダズンラン」に近い。出る人と出ない人の対。',
      trap: 't が消えても「ン」は残る。前の whoever runs と対になるかで確かめる。',
      use: 'Whoever doesn’t cook does the dishes.（作らない方が皿洗いね）' },

    // R fix: V2 (blind 70 %): the distractors were advice a listener wouldn't connect with the line's question. Now
    //   praise and approval readings of the same words.
    // why: plan the race better ← "queen of planning" heard as praise for running; learning to relax ← the question
    //   heard as approval that she's finally letting go
    { id: 'i1', skill: 'infer', level: 'C1', point: 'chance', reveals: ['coin'], seg: [44.3, 53.8],
      stem: 'When Ben answers the coin idea, what is his point?',
      choices: ['Leaving it to luck is very unlike her', 'She’d plan the race better than he would',
                'It’s nice she’s finally learning to relax'], a: 0,
      cue: 'Leslie Knope と呼んだあと、並べる言葉と最後の問い。',
      line: 'you, Leslie Knope, the *queen of planning* and binders… You wanna *leave this to chance*?',
      said: '「計画とバインダーと賛否リストの女王が、これを運に任せたいの？」と聞き返す。',
      mean: '計画好きな性格を並べて、運任せの案がいかにレスリーらしくないかを示す。驚きの確認。',
      trap: '女王はほめ言葉なので「適任」と聞きやすい。並べた性格と、最後の問いの中身を比べる。',
      use: 'You, of all people, want to wing it?（よりによって君が、ぶっつけ本番？）' },

    // R fix: V2 (blind 65 %): "simply can't make up her mind" was a filler. Now the third option is a Japanese frame
    //   (going along to keep the peace).
    // why: coin lands her way ← her calm "Yes" heard as confidence in the toss's result; keep the peace ← agreeing to
    //   avoid a fight (和を保つ), with "it stinks" earlier
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'together', seg: [53.4, 59.3],
      stem: 'How does Leslie answer Ben’s doubt?',
      choices: ['Sure: it doesn’t matter who runs, they’re a team', 'Sure: she’s certain the coin will land her way',
                'Unsure, but she’ll go along to keep the peace'], a: 0,
      cue: 'Yes のあと、because に続く理由。',
      line: 'Yes. Because *whatever’s next, you and I are in it together*.',
      said: '迷わず「うん。次に何があっても、私たちは一緒だから」と答える。',
      mean: '誰が出るかより、二人一緒なのが大事。だから運任せでも平気、という落ち着き。',
      trap: '落ち着いた Yes は結果への自信に聞こえやすい。理由は because のあとの together。',
      use: 'Whatever happens, we’re in this together.（何があっても一緒だよ）' },

    // R fix: V2 (blind 65 %): "worth a lot of money" was a filler. Now the third option misreads her tone as
    //   sarcasm aimed at Ben's doubt.
    // why: vote ← "participate" heard as friends taking part in the choice; poking fun ← the over-the-top museum line
    //   heard as mocking Ben's "leave this to chance"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'coinplan', reveals: ['chance', 'sign', 'coin'], seg: [59.1, 67.0],
      stem: 'Why is what Leslie says after “let’s go tell everybody” funny?',
      choices: ['Even leaving it to chance turns into a big plan', 'She wants their friends to vote, not the coin',
                'She’s poking fun at Ben’s doubt about chance'], a: 0,
      cue: 'let’s go tell のあと、コインの行き先まで。',
      line: 'they can *sign the coin*. And then… the coin will *eventually make its way into the Smithsonian*.',
      said: 'みんなにサインしてもらい、いずれ国立の博物館に入る、とまで語る。',
      mean: '運に任せると言ったそばから、コインの未来まで計画している。計画の女王らしさが笑い。',
      trap: '大げさな博物館の話を皮肉と取りやすいが、本人は大まじめ。運任せのはずが計画だらけ、というずれ。',
      use: 'Let’s keep it simple this time.（今回はシンプルにいこう）' },

    // why: toss ← tossing is what the coin is for in this scene; heads or tails ← "participate" heard as everyone
    //   joining the toss
    { id: 'd2', skill: 'detail', level: 'B1', point: 'sign', reveals: ['coin'], seg: [60.5, 64.3],
      stem: 'What does Leslie say everybody can do with the coin?',
      choices: ['Sign their names on it', 'Take turns tossing it', 'Call heads or tails'], a: 0,
      cue: 'participate のあと、もう一度 they can。',
      line: 'they can participate, they can *sign the coin*',
      said: '「みんなも参加できるし、コインにサインもできる」と言う。',
      mean: '友達は投げる係でなく、記念にサインする係。決めるのは運のまま。',
      trap: 'participate で、表か裏を当てる参加に思いやすい。後に続く動詞 sign を拾う。',
      use: 'Can everyone sign the card?（みんなでカードにサインしてくれる？）' },

    // why: an event for the country ← "history of America" taken at its word (scope); quite nice ← "it's like —" heard
    //   as groping for words, a modest 「まあ、いいね」
    // anchor: 71.1–78.6 s the claim ("the greatest thing that's ever happened in the history of America") is about
    //   friends and their kids in one room: a scale that big for that can only be joy
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'greatest', seg: [70.5, 79.0],
      stem: 'Which plain-English version keeps what Leslie means about everyone being here?',
      choices: ['“I’m so happy you’re all here; the ‘history’ bit is for fun.”',
                '“Having you all here is truly an event for the whole country.”',
                '“I’m not sure how to put it, but it’s quite nice you came.”'], a: 0,
      cue: 'all of you のあと、比べる相手の大きさ。',
      line: 'all of you in the same room… with your children here, it’s like — it’s *the greatest thing* that’s ever happened *in the history of America*.',
      said: '「みんなが子ども連れで同じ部屋にいる。なんていうか、アメリカ史上最高の出来事」と言う。',
      mean: '友達の集まりに国の歴史を持ち出す、わざとの大げさ。言いたいのは「うれしくてたまらない」。',
      trap: 'it’s like の言いよどみを控えめと取りやすい。小さな事に大きすぎる言葉が付いたら、喜びの誇張。',
      use: 'This is the best day in human history.（人類史上最高の日だよ）' },

    // R fix: V2 (blind 50 %): only the key was upbeat. Now the trap is "long shot", the same word with the
    //   opposite sense.
    // why: long shot ← "shot" heard, "great" lost, and the chunk "long shot" (勝ち目が薄い) is the one learners know;
    //   one try ← "one shot" (一回きり)
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'shot', seg: [89.3, 93.6],
      stem: 'What does Ben say the people who approached Leslie think of her?',
      choices: ['She stands a real chance of winning', 'She should run, though it’s a long shot',
                'She gets one shot, so must run now'], a: 0,
      cue: 'approached のあと、win の前の2語。',
      line: 'they think she has *a great shot to win*.',
      said: '党から声がかかり、勝つ見込みが大きいと思われている、と言う。',
      mean: 'a shot ＝ 見込み、勝ち目。',
      trap: 'shot だけ拾うと long shot（勝ち目が薄い）に寄る。great shot to win は勝ち目が大きい。',
      use: 'I think we have a good shot.（いけそうな気がする）' },

    // R fix: V2 (blind 50 %): the quirky "super genius" stood out as Leslie-like. Now a plain paraphrase among plain
    //   reasons.
    // why: Indiana native ← said of Leslie in Ben's list just before; party asked ← "approached by the DNC" heard
    //   about Ben
    { id: 'd3', skill: 'detail', level: 'B1', point: 'genius', seg: [110.1, 114.6],
      stem: 'Why does Leslie say Ben is running her campaign?',
      choices: ['He is extremely smart', 'He is an Indiana native', 'The party asked for him'], a: 0,
      cue: 'campaign のすぐあと、because の後ろ。',
      line: 'he’s gonna be running my campaign *because he’s a super genius*.',
      said: '「ベンが選挙運動を仕切る。超天才だから」と紹介する。',
      mean: 'run a campaign ＝ 選挙運動を仕切る。理由は because のすぐあと。',
      trap: 'Indiana native は少し前に、レスリーについて言われた言葉。誰の話かを聞き分ける。',
      use: 'She’s in charge because she’s brilliant.（彼女が仕切るのは優秀だから）' },

    // R fix: V2 (blind 55 %): the key was the only choice that stood back from the scene. Now all three say what
    //   she means.
    // why: fast campaign ← "sports car" read as speed, about his work; mocking ← "little… compact" heard as a dig
    //   about his size
    { id: 'h2', skill: 'humor', level: 'C1', point: 'sportscar', reveals: ['genius'], seg: [112.0, 119.7],
      stem: 'Why does Leslie’s second reason for choosing Ben get a laugh?',
      choices: ['She mixes praise of his body into job reasons', 'She means he’ll run the campaign fast, like a car',
                'She is mocking him in public for being small'], a: 0,
      cue: 'super genius のあと、and に続くもう一つの理由。',
      line: 'because he’s a super genius. And he’s got a *tight, compact little body* like an Italian sports car.',
      said: '「天才だし、イタリアのスポーツカーみたいに引きしまった小さな体だし」と続ける。',
      mean: '仕事の理由のはずが、夫の体のほめ言葉が混ざる。人前でのろけるずれが笑い。',
      trap: 'スポーツカーを速さのたとえと取りやすいが、ほめているのは body。little も愛情。',
      use: 'He’s smart, and cute, too.（頭がいいし、かわいいし）' },

    // R fix: V2 (blind 70 %): two choices were mirror images (people / no people), and the third went against
    //   "small, incremental change". Now each distractor is built on words she says.
    // why: small changes ← "small, incremental change every day" is in the toast but not in the speech; people first
    //   ← "people's lives", "the people of Indiana" (a keyword, the wrong idea)
    { id: 'g2', skill: 'gist', level: 'B2', point: 'message', reveals: ['terms'], seg: [121.0, 203.3],
      stem: 'What idea runs through Leslie’s toast and her later speech?',
      choices: ['Work is worth most when shared with people you love', 'Small daily changes matter more than big wins',
                'Public service means always putting people first'], a: 0,
      cue: '引用のあとに付け足す一言と、最後の一文。',
      line: 'what makes work worth doing is getting to do it with *people that you love*. … *alongside a team of people who we love*.',
      said: '乾杯でも後のスピーチでも、やりがいのある仕事を大切な仲間とするのが一番だと語る。',
      mean: '仕事の中身だけでなく、誰とするかに価値がある、という一貫した考え。',
      trap: '「毎日の小さな変化」は乾杯だけ。people も何度も出るが、両方に通じるのは仲間と働くこと。',
      use: 'It’s the people that make the job.（仕事の良さは人で決まる）' },

    // R fix: V2 (blind 70 %): "the best, but far off" read as a filler. Both distractors are now real readings.
    // why: hard to reach ← "far and away" heard as "far away" (遠い); among the best ← the superlative softened, the
    //   usual 「最高の一つ」
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'farandaway', reveals: ['message'], seg: [137.4, 146.9],
      stem: 'In the Roosevelt quote, how does that prize compare with others?',
      choices: ['It is by far the best one of all', 'It is the best, though hard to reach',
                'It is among the best, not the only one'], a: 0,
      cue: 'once said のすぐあと、best の前。',
      line: '*Far and away*, the best prize that life has to offer…',
      said: 'ルーズベルトの「人生最高の賞は、やりがいのある仕事に打ち込む機会」を引く。',
      mean: 'far and away ＝ ずば抜けて、断然。best を強める言い方で、距離の話ではない。',
      trap: 'far away���遠く）と聞こえやすい。最上級の前に来たら「断然」。',
      use: 'This is far and away the best ramen.（これは断然いちばんのラーメン）' },

    // R fix: V2 (blind 55 %): the key was the only two-part answer. Now two of the three are.
    // why: Roosevelt alone ← the quote is the best-known part, and "work worth doing" is his; the toast's start ←
    //   "fought… to make people's lives a tiny bit better" is from the same toast (right source, wrong part)
    // anchor: 146.7–153.6 s "And I would add that what makes work worth doing is getting to do it with people that you
    //   love"; 183.3–191.6 s "…work hard at work worth doing, alongside a team of people who we love"
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'message', reveals: ['terms'], seg: [137.4, 192.3],
      stem: 'At the end of her speech, which earlier words does Leslie echo?',
      choices: ['Roosevelt’s words plus the line she added to them', 'Roosevelt’s words plus her toast’s opening line',
                'Roosevelt’s words alone, just as he said them'], a: 0,
      cue: '乾杯の引用のあとと、スピーチ最後の一文。',
      line: 'And I would add… *with people that you love*. … work worth doing, *alongside a team of people who we love*.',
      said: '乾杯でルーズベルトの言葉に「愛する人と」と付け足し、ずっと後のスピーチを同じ組み合わせで締める。',
      mean: '引用だけでなく、自分の付け足しまで繰り返す。若い頃の言葉が、長い仕事の結論になる。',
      trap: 'work worth doing だけ聞くと引用そのものに思える。どこからが本人の言葉かを聞く。',
      use: 'Like I said back then, it’s the people.（あの頃も言ったけど、大事なのは人だよ）' },

    // why: 13 ← -ty heard as -teen; 3 ← the -ty swallowed after "than"
    { id: 'n1', skill: 'number', level: 'B1', point: 'years', reveals: ['terms'], seg: [153.3, 160.3],
      stem: 'When Leslie looks back, how long ago did she start her career?',
      choices: ['More than 3 years ago', 'More than 13 years ago', 'More than 30 years ago'], a: 2, keep: true,
      cue: 'more than のあと、years の前の数。',
      line: 'I started my career *more than 30 years ago*',
      said: '「30年以上前、ここポーニーの公園課でキャリアを始めた」と振り返る。',
      mean: 'thirty は前が強く、短く終わる。thirteen なら teen が強く長い。',
      trap: '-teen と -ty は聞き分けにくい。強い所が前か後ろか、最後が長いかで分ける。',
      use: 'I moved here more than thirty years ago.（ここに来て30年以上になる）' },

    // R fix: V2 (blind 60 %): "past jobs" in the stem pointed at "years later". The stem is neutral, and all three
    //   choices place the speech around her time as governor.
    // why: before a second term ← "governor" heard without "two terms"; first race ← she has just announced she's
    //   running
    { id: 'i2', skill: 'infer', level: 'B2', point: 'terms', seg: [159.9, 165.7],
      stem: 'What does Leslie’s list of jobs tell us about when this speech is?',
      choices: ['It comes after she has served as governor', 'It comes before she runs for a second term',
                'It comes during her first race, before the vote'], a: 0,
      cue: 'different jobs のあと、including に続く所。',
      line: 'I’ve had a lot of different jobs, *including two terms as your governor*.',
      said: '「いろいろな仕事をしてきた。知事の2期も含めて」と言う。',
      mean: 'I’ve had で過去の経験として語る。知事を2期務めた後の、ずっと先の場面。',
      trap: '出馬の発表直後なので、選挙の演説に聞こえやすい。I’ve had と two terms で時を測る。',
      use: 'I’ve had a few jobs, including this one.（いくつか仕事をしたよ、これも含めて）' },

    // R fix: V2 (blind 55 %): only the key carried a qualifier. Now each choice has a feeling plus a reason.
    // why: uneasy ← "unknown challenge" heard as fear (不安); rest ← the usual retirement-speech script, after "more
    //   than 30 years"
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'thrilling', reveals: ['terms'], seg: [165.3, 175.45],
      stem: 'How does Leslie feel about what comes next for her?',
      choices: ['Excited by it, even after all these years', 'Uneasy about it, since it is still unknown',
                'Glad of it, since it means she can rest'], a: 0,
      cue: 'awaits me のあと、to me に続く一語。',
      line: 'a new unknown challenge awaits me. Which, to me, even now, is *thrilling*.',
      said: '「未知の挑戦が待っている。今でもわくわくする。仕事が好きだから」と言う。',
      mean: 'even now ＝ 長く働いた今でも。未知の事を楽しみにしている。',
      trap: 'unknown は不安に、流れは引退のあいさつに聞こえやすい。even now のあとを拾う。',
      use: 'Even now, it still excites me.（今でもわくわくする）' },

    // R fix: V2 (blind 55 %): only the key pointed back at the line before. Now two choices do.
    // why: on "definitely" ← the longest word, and learners stress the adverb; on "it" ← heard as the job itself
    //   against the people in it
    // anchor: 175.5–177.7 s "isn't sexy" just before: the reply flips that "isn't" to "is", and "sexy" is already
    //   given, so the stress lands on the verb
    { id: 'nt3', skill: 'sound', level: 'C2', point: 'sexy', seg: [174.95, 183.0], retired: true,
      stem: 'In “Because it definitely is”, where is the stress, and why?',
      choices: ['On “is”: it answers the “isn’t” just before', 'On “definitely”: it answers the doubt just before',
                'On “it”: public service, not the people in it'], a: 0,
      cue: '直前の否定の語と、対になる語。',
      line: 'Not to say that public service *isn’t* sexy. Because it definitely *is*.',
      said: '「公務がセクシーでないと言うつもりはない。だって確かにそうだから」と付け足す。',
      mean: '直前の isn’t に is を強く返す。強勢が肯定と否定の対比を示し、「本当にそう」と言い切る。',
      trap: '長い副詞 definitely に強勢を置きたくなる。否定のすぐあとの短い動詞が強ければ、対比の返し。',
      use: 'Not that I mind. Okay, I do.（気にしてないよ。いや、してる）' },

    // why: teaching ← "School of Public Policy" heard as a job there; papers ← "library" + "her name" heard as a
    //   collection of her papers
    // R fix: S3: the cue held "campus", a word only the key had. Now it points at "library" and the last 3 words.
    { id: 'd4', skill: 'detail', level: 'B1', point: 'library', seg: [208.6, 221.8],
      stem: 'Besides the doctorate, what honor does Leslie get?',
      choices: ['The campus library will be named after her', 'She will teach at the School of Public Policy',
                'A room in the library will hold her papers'], a: 0,
      cue: 'library のあと、文の最後の3語。',
      line: 'The campus library will henceforth *bear her name*.',
      said: '名誉博士号に加え、図書館に彼女の名前が付くと発表される。',
      mean: 'bear one’s name ＝ 名前が付く。henceforth は「今後ずっと」の硬い言い方。',
      trap: 'School や library から、教える話や資料の話に思いやすい。',
      use: 'The park will bear his name.（公園には彼の名前が付く）' },
  ]
};
