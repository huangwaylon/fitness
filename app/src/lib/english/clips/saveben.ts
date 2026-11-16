// “SAVE BEN WYATT! | Parks and Recreation” (the official Parks and Recreation channel, Season 7): a women's group
// (the IOW) objects to the candidate's-wife pie contest, so Ben enters it himself with a "dessert calzone"; the IOW
// backs off, and a men's rights group turns up instead to "free" him.
// Segments from the captions, words from whisper (2026-11-16). Only Ben and Leslie are named; stems avoid a speaker
// where the audio doesn't settle one.
// Untested on purpose: 27.7–28.9 s (captions "sidestepped", whisper "sidestep"), 56.8–58.8 s (who says "Calzone" and
// "Sure"), 69.6–74.6 s (sung), 117.8–121 s and 168–173 s (chants), 125.7 s "male men" (also hears as "mailmen": two
// keys), 131.8–137.2 s (a twisted saying: needs the original), 152.9–156.2 s (the "asking for it" joke).
// EAR CHECK: none
// REVIEW 2026-11-16: pass 4, fix 21, drop 0, new 0; ear checks 0
// Open: h1 rests on Ben being the one who answers "No" to "A pie"; the words around it make that clear, so no ear check.
import type { Clip } from '../types.ts';

export const saveBen: Clip = {
  id: 'saveben', video: 'MmE62niQupI', title: 'SAVE BEN WYATT!', dur: 193, wpm: 153, band: 'mid',
  tags: ['家', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, "costs money" was a filler and "women she cares about" marked the key; new IOW-wants-her-to-win distractor
    // why: can't bake ← "women who bake" + "better than" heard as her own skill; IOW wants her to win ← "I love them" +
    //   the pledge heard as the group backing her
    { id: 'g1', skill: 'gist', level: 'B2', point: 'bind', seg: [0, 21.2],
      stem: 'Why is the pie contest a problem for Leslie?',
      choices: ['Entering or skipping it would upset some women', 'She can’t bake well, and it’s all in public',
                'The IOW wants her to enter it and win'], a: 0,
      cue: '「出ない」案のあと、どう見えるかの話。',
      line: 'You just *don’t do the pie contest*… — Then it just seems like I’m saying *I’m better than the women who bake*.',
      said: '団体は古いパイ大会に反対。でも出ないと、パイを焼く女性たちを見下しているように見える。',
      mean: '出ても出なくても、どちらかの女性たちを怒らせる板ばさみ。',
      trap: 'women who bake から「自分は焼けない」と取りやすいが、問題は腕前ではなく見え方。',
      use: 'I can’t win either way.（どっちにしても角が立つ）' },

    // R fix: V2/GUIDE §9.4, the title "SAVE BEN WYATT!" pointed at the men's group; now asks how the plan turns out
    // why: upsets the IOW ← the IOW protest set up at the start; the judges ← a calzone isn't a pie, so a rules fight
    //   seems next
    { id: 'g2', skill: 'gist', level: 'C1', point: 'outcome', reveals: ['protest'], seg: [0, 173.5],
      stem: 'How does Ben’s plan turn out, by the end of the clip?',
      choices: ['It calms one group, but another shows up', 'It wins over the judges, but upsets the IOW',
                'It fails, because the judges reject a calzone'], a: 0,
      cue: '後半で叫ぶ人たちが、誰のために抗議している？',
      said: '女性団体の抗議は避けられたが、大会に男性の権利団体が「ベンを解放せよ」と現れる。',
      mean: '一つの騒ぎを避けたら、逆の立場から別の騒ぎが来た。場面全体の皮肉な展開。',
      trap: '最初の IOW の話が強く残るので、抗議も同じ団体と思いやすい。叫ぶ側の名乗りを聞く。',
      use: 'We dodged one problem and hit another.（一難去ってまた一難）' },

    // R fix: V2, a protest group is "serious" by common sense; distractors now pull on "I love them" and literal "mess"
    // why: messy ← "mess" read literally (散らかす); fun ← "not" lost, so "mess around" (ふざける) + "I love them" heard
    //   as a friendly group
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'messaround', seg: [0, 5],
      stem: 'In the opening line, what is the IOW said to be like?',
      choices: ['Tough, and always serious', 'Fun, and easy to get along with', 'Messy, and slow to get organized'], a: 0,
      cue: '文の最初、does not のあとの動詞句。',
      line: 'The IOW *does not mess around*, which normally is why I love them.',
      said: 'IOW は手加減しない、だから普段は大好き、でも今は自分が相手側だ、と言う。',
      mean: 'not mess around ＝ ふざけない、本気で容赦がない。',
      trap: 'mess を「散らかす」と取ると別の意味に。not が弱くても、否定の形で決まり文句。',
      use: 'This teacher doesn’t mess around.（この先生は容赦ないよ）' },

    // why: $1,000 ← hundred/thousand; $200 ← "gave them a" runs into "hundred", and the weak "a" is heard as a number
    // R fix: S4, the segment ended inside "Do you know how"; now runs to the end of the sentence
    { id: 'd1', skill: 'number', level: 'B1', point: 'pledge', seg: [4.2, 10.4],
      stem: 'How much did Leslie give the IOW in her yearly pledge?',
      choices: ['$100', '$200', '$1,000'], a: 0, keep: true,
      cue: 'Ben と呼びかけたあと、金額の桁。',
      line: 'Ben, I gave them *a hundred dollars* in their annual pledge.',
      said: 'その団体の年間寄付として100ドルを出した、と言う。',
      mean: 'annual pledge ＝ 毎年の寄付の約束。',
      trap: 'hundred と thousand は語の頭の音で分かれる。a hundred の a は弱く、ほぼ聞こえない。',
      use: 'I pledged fifty dollars this year.（今年は50ドル寄付したよ）' },

    // R fix: V2, "money back" and "proud" were fillers; now the rhetorical-question and lost-"anti-" readings
    // why: too small ← "how many… could that buy?" heard as "not many"; signs for her ← "anti-" lost, so "me signs" heard
    //   as signs on her side
    { id: 'i1', skill: 'infer', level: 'C1', point: 'signs', seg: [4.2, 10.3],
      stem: 'When Leslie asks how many signs “that could buy”, what is her point?',
      choices: ['Her own money could fund protests against her', 'Her gift was too small to buy many signs',
                'She wants the group to make signs for her'], a: 0,
      cue: 'signs の前に付いた短い語。',
      line: 'Do you know how many *anti-me signs* that could buy?',
      said: '「私の寄付で、反私のプラカードがどれだけ買えると思う？」と嘆く。',
      mean: '自分のお金が、自分への抗議に使われうるという皮肉。数の多さを嘆いている。',
      trap: 'how many…? を「少ししか買えない」と取りやすい。anti- が付くと「反対の」になる。',
      use: 'That’s my own money working against me.（自分のお金が自分に不利に働いてる）' },

    // anchor: 7.7–8.1 s five words in under half a second, between "pledge" and "anti-me"; both sources agree on them
    { id: 'c2', skill: 'dict', level: 'C2', point: 'signs', seg: [4.4, 10.3],
      stem: 'Type the start of her question: “___ anti-me signs that could buy?” (5 words)',
      answer: 'do you know how many',
      cue: 'pledge のすぐあと、文頭のとても速い部分。',
      line: '*Do you know how many* anti-me signs that could buy?',
      said: '頭の5語が、ほぼ一息で「ジャノウハウメニ」と聞こえる。',
      mean: 'do you は「ジャ」まで縮み、know how は切れ目なくつながる。嘆く決まり文句なので速い。',
      trap: '速さに負けて Did you や You know と書きやすい。could buy まで聞けば疑問文と分かる。',
      use: 'Do you know how hard that was?（それがどれだけ大変だったか分かる？）' },

    // R fix: S4, the segment started inside "obviously"; now starts before the line it answers
    { id: 'x1', skill: 'dict', level: 'B2', point: 'started', seg: [10.4, 17.7],
      stem: 'Type what is said: “Then we’re just ___.” (4 words)', answer: 'back where we started',
      cue: '「出ない」案への返事、文の後半。',
      line: 'Then we’re just *back where we started*.',
      said: '出なければ振り出しに戻るだけ、と返す。',
      mean: 'back where we started ＝ 振り出しに戻る。where we がつながり「ウェアウィ」と短い。',
      trap: 'where we started が一続きに聞こえる。started の d まで聞く。',
      use: 'So we’re back where we started.（じゃあ振り出しだね）' },

    // R fix: V2, "Quite serious; a real worry" was a filler; now a half-serious reading
    // why: half serious ← "divorce" taken as real strain; a dig ← a short question right after a rejected idea heard as
    //   snapping
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'divorce', seg: [17.3, 26.5],
      stem: 'How serious is the question about getting a divorce?',
      choices: ['Not serious; a joke about being stuck', 'Not serious; a dig at the other’s idea',
                'Half serious; they’re truly fed up'], a: 0,
      cue: 'その問いのすぐあと、相手の返し方。',
      line: 'What should we do? *Should we get a divorce?* — Well, *how about this*?',
      said: '「どうする？離婚する？」の直後、相手は「じゃあこうしよう」と普通に案を出す。',
      mean: '八方ふさがりを大げさに言った冗談。相手も本気にせず、すぐ解決策に移る。',
      trap: 'divorce という重い語だけで本気と取りやすい。返事が平然としていれば冗談のサイン。',
      use: 'Should we just move to the moon?（いっそ月に引っ越す？）' },

    // why: help ← "I bake the pie" + "wife" heard as helping his wife; judge ← "register for the contest" heard as
    //   joining the panel
    { id: 'd2', skill: 'detail', level: 'B1', point: 'register', seg: [21, 26.5],
      stem: 'What does Ben offer to do?',
      choices: ['Enter the contest and bake it himself', 'Help Leslie bake a pie for the contest',
                'Sign up as a judge for the contest'], a: 0,
      cue: 'how about this のあと、I が何をするか。',
      line: 'What if I *register for the contest*? I bake the pie. I act as my own wife.',
      said: '「僕が大会に申し込んで、パイを焼く。自分の妻の役も自分でやる」と提案する。',
      mean: 'register ＝ 申し込む・登録する。候補者の妻の役を、本人が引き受けるという案。',
      trap: 'wife が聞こえると「妻を手伝う」と取りやすいが、焼くのも出るのも本人。',
      use: 'I’d like to register for the tour.（ツアーに申し込みたいです）' },

    // R fix: V2, "antiquated" in the stem made "completely upside down" the only change; distractors rebalanced
    // why: step around ← "sidestep the controversy" heard as skipping the contest; go along quietly ← "refocus the
    //   campaign" heard as keeping the old form
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'flip', seg: [27.3, 36.3],
      stem: 'What do they plan to do to the “antiquated tradition”?',
      choices: ['Turn it the other way around', 'Step around it this one year', 'Go along with it, but quietly'], a: 0,
      cue: 'tradition のあと、頭をどうする？',
      line: 'we *flip* the antiquated tradition *right on its head*.',
      said: '騒ぎをかわし、古い伝統を「ひっくり返す」と言う。',
      mean: 'flip ... on its head ＝ 逆さまにする。妻が焼く大会に夫が出ること。',
      trap: 'sidestep（かわす）が先に聞こえるので「今回は出ない」と取りやすいが、出た上で逆転させる。',
      use: 'Let’s flip the idea on its head.（発想を逆にしてみよう）' },

    // R fix: V2/K6, the key was the only mixed answer; now each choice differs from the key in one half. S4: end after
    //   "picture this"
    // why: agrees ← "I like the energy" + "let's hear it" heard as full agreement; stop ← "that's not more important"
    //   heard as a no
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'energy', seg: [36.3, 47.7],
      stem: 'After the line about changing what a pie is, what does the reply do?',
      choices: ['Doubts the point, but lets him go on', 'Agrees it matters, and lets him go on',
                'Doubts the point, and tells him to stop'], a: 0,
      cue: 'that’s not のあとと、energy のあと。',
      line: 'I feel like *that’s not more important*, but *I like the energy*… so let’s hear it.',
      said: '「それがもっと大事とは思わないけど、その勢いは好き。聞かせて」と返す。',
      mean: '軽く異を唱えてから、前向きな一言で話を続けさせる。',
      trap: 'I like だけ拾うと全面賛成に、not more important だけ拾うと拒否に聞こえる。両方を聞く。',
      use: 'Not sure I agree, but go on.（賛成かは分からないけど、続けて）' },

    // R fix: V2, "Ben's pie riddle" leaned on show knowledge; the stem now names the moment. S4: the segment cut
    //   "picture this" and "honey"; now 46.65–59.3
    // why: keeps guessing ← two voices trade "pie" and "calzone", so who wants which is easy to flip; calls it a pie ←
    //   "pies are just sweet calzones" heard backwards
    // retired: the bank was 25, over 24; still near 50 % on the review's own read, and it rests on who answers “No” to
    //   “A pie”
    { id: 'h1', skill: 'humor', level: 'C1', point: 'calzone', seg: [46.65, 59.3], retired: true,
      stem: 'What makes Ben’s “picture this” riddle funny?',
      choices: ['He describes a pie, but wants “calzone”', 'He wants “pie”, but she keeps guessing calzone',
                'He describes a calzone, but calls it a pie'], a: 0,
      cue: '最初の答えへの返事、No か Yes か。',
      line: 'Crust on the bottom, filling, crust on top. — *A pie.* — *No*, but you’re in the right zone.',
      said: '下に生地、具、上に生地と言い、「パイ」と答えられて「違う、でも近い」と返す。',
      mean: 'パイの説明なのに、正解はカルツォーネだと言い張るのがおかしい。',
      trap: '二人の声が交互に出るので、どちらが何と言ったか入れ替わりやすい。No の位置で決まる。',
      use: 'Close, but not quite.（惜しい、でもちょっと違う）' },

    // R fix: GUIDE §9.5, "Getting there and start baking" and "Get it there" aren't real options; now 3 choices. S4: start
    //   before "I can win this thing"
    // why: Go in there ← the flapped t of "get" runs into "in" and the vowel is lost; Get out there ← the same "go for it"
    //   sense, the weak "in" heard as "out"
    { id: 's1', skill: 'sound', level: 'B2', point: 'getin', seg: [65.2, 69.4],
      stem: 'Fill the gap: “___ and start baking.”',
      choices: ['Get in there', 'Go in there', 'Get out there'], a: 0,
      cue: 'baby のあと、最初の短い3語。',
      line: 'Of course you can, baby. *Get in there* and start baking.',
      said: '「もちろん勝てるよ、ほら、行って焼き始めて」と送り出す。',
      mean: 'Get in there が「ゲリンゼア」とつながる。t は弾み、in は弱い。',
      trap: 'Go in there でも通じるが、t が弾む「ゲリ」は get。out なら「アウ」が聞こえる。',
      use: 'Get in there and have fun!（さあ行って楽しんで）' },

    // why: will protest ← "not" weak before "gonna"; no word yet ← "hear back" in the question heard as the answer
    { id: 'd3', skill: 'detail', level: 'B1', point: 'protest', seg: [75.6, 82],
      stem: 'What is the news about the IOW?',
      choices: ['They won’t protest the campaign', 'They will protest at the contest',
                'They haven’t gotten back yet'], a: 0,
      cue: 'hear back の質問への答え、文の後半。',
      line: 'Oh, yeah, *we’re good*. The IOW is *not gonna protest* us.',
      said: '「返事は？」に「うん、大丈夫。IOW は抗議しない」と答える。',
      mean: 'we’re good ＝ 問題ない、話がついた。女性団体との対立は解けた。',
      trap: 'not は gonna の前で弱いが、消えてはいない。we’re good が先なら良い知らせ。',
      use: 'We talked it over. We’re good.（話はついたよ。もう大丈夫）' },

    // R fix: V2, "forgot" was a filler; now the "I don't know" reading. S4: start after "protest us"
    // why: not sure ← "I don't know" taken as the answer; bought ← "didn't make" heard as "didn't bake it himself"
    { id: 'i2', skill: 'infer', level: 'B2', point: 'dessert', reveals: ['calzone'], seg: [80.75, 88.4],
      stem: 'When asked about his pie, what does Ben’s answer tell Leslie?',
      choices: ['He baked something, but won’t call it a pie', 'He isn’t sure how his pie turned out',
                'He bought a pie instead of baking one'], a: 0,
      cue: '彼女が言い直した質問と、その答え。',
      line: 'I *didn’t make a pie*. — Okay, how is your *dessert calzone*? — It’s ready.',
      said: '「パイは作ってない」と言われ、「デザートカルツォーネは？」と聞き直す。',
      mean: '作っていないのではなく、パイと呼ぶ気がない。彼女は彼の呼び方に合わせた。',
      trap: '「作ってない」を文字どおり取りやすい。直後の言い直しと It’s ready が答え。',
      use: 'Okay, let me rephrase that.（じゃあ言い直すね）' },

    // why: nervous ← "the question is" heard as a real doubt; not done ← "ready" + "are they?" heard as asking whether
    //   the calzones are baked
    // R fix: S4, the segment started inside "calzone"
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'ready', seg: [87.35, 91.4],
      stem: 'Just before his turn, how does Ben sound about his entry?',
      choices: ['Cocky, as if it will blow them away', 'Nervous that it isn’t really a pie',
                'Unsure that it will be ready in time'], a: 0,
      cue: 'It’s ready のあと、問いの主語。',
      line: 'It’s ready. *The question is, are they?*',
      said: '「僕のはできてる。問題は、みんなの方に準備ができてるかだ」と言う。',
      mean: '自信満々の決めぜりふ。they は審査員や観客で、驚く覚悟はあるかと言っている。',
      trap: 'question という語で不安と取りやすいが、心配しているのは自分ではなく相手のこと。',
      use: 'I’m ready. The question is, are you?（こっちは準備OK。そっちは？）' },

    // R fix: V2, "A woman from the IOW" was a filler and the contest's premise gave the key; choices now parallel
    // why: Ben himself ← "candidate Ben Wyatt's" comes first and loudest; Leslie as candidate ← "candidate" and "Leslie"
    //   bracket the line
    { id: 'd4', skill: 'detail', level: 'B1', point: 'host', seg: [91.3, 99],
      stem: 'Whom does the host introduce as the next contestant?',
      choices: ['Leslie, as the candidate’s wife', 'Ben, as the candidate himself', 'Leslie, as the candidate herself'], a: 0,
      cue: 'candidate のあと、名前が2つ並ぶ。',
      line: 'our next contestant is candidate *Ben Wyatt’s wife, Leslie*.',
      said: '司会者は「次の出場者は、候補者ベン・ワイアットの妻レスリー」と紹介する。',
      mean: '大会は「候補者の妻が焼く」前提になっている。',
      trap: 'Ben Wyatt’s の ’s が弱いと、本人の名前に聞こえる。’s のあとに wife が来る。',
      use: 'Our next guest is the mayor’s wife.（次のゲストは市長の奥さんです）' },

    // R fix: V2, the key's "twice" matched the cue's 2回 and "thanking" was a filler
    // why: a secret ← actually = 実は, a confession; introducing ← "it's… Mr. Wyatt" heard as a self-introduction
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', reveals: ['register'], seg: [98.8, 104.6],
      stem: 'When Ben first answers the host, what is his reply doing?',
      choices: ['Gently correcting what the host said', 'Revealing a secret about their plan',
                'Politely introducing himself to the host'], a: 0,
      cue: '答えの中で2回出る、短いつなぎの語。',
      line: 'It’s *actually* Ms. Knope. And *actually*, right now, it’s Mr. Wyatt.',
      said: '「ノープさんです。それに今はミスター・ワイアットです」と言い直す。',
      mean: 'actually は相手の言葉を正す合図。名前と、誰が焼くかを穏やかに直している。',
      trap: 'actually を「実は」と訳すと告白に聞こえる。相手の発言の直後なら、たいてい訂正。',
      use: 'Actually, I ordered the soup.（あの、スープを頼んだんですが）' },

    // why: can't bake / loves to cook ← Leslie's later "He loves to cook" pulled forward; the IOW asked ← the group from
    //   the earlier talk
    { id: 'd5', skill: 'detail', level: 'B1', point: 'busy', reveals: ['register'], seg: [102.8, 109.3],
      stem: 'What reasons does Ben give the host for the switch?',
      choices: ['Leslie is busy, and he’s good at pies', 'Leslie can’t bake, and he loves to cook',
                'The IOW asked, and Leslie agreed'], a: 0,
      cue: 'Leslie has のあとと、I happen to be のあと。',
      line: 'Leslie has her own *busy life*, and I happen to be an *excellent pie maker*',
      said: '「レスリーは忙しいし、僕はたまたまパイ作りが得意なので」と説明する。',
      mean: 'happen to be ＝ たまたま～である。さらりと自慢する言い方。',
      trap: 'He loves to cook は後で妻が言う言葉。どの場面で誰が言ったかを分けて聞く。',
      use: 'I happen to be free tonight.（今夜はたまたま空いてるよ）' },

    // R fix: V2, in a cooking contest the two trip readings were fillers; now the "pack your bags = you're done" idiom
    // why: go home ← "pack your bags" as the idiom for "you're done", from a cocky Ben; a prize trip ← "pack your
    //   suitcases" read literally
    { id: 'i3', skill: 'infer', level: 'C1', point: 'napoli', reveals: ['calzone'], seg: [108.9, 117.5],
      stem: 'When Ben tells everyone to pack their suitcases, what is he really doing?',
      choices: ['Setting up his dish as a trip to Italy', 'Telling the other bakers they can go home',
                'Offering the winner a trip to Italy'], a: 0,
      cue: 'スーツケースの話のあと、行き先の町の名前。',
      line: 'Now *pack your suitcases*, because we’re going to a little town called *Napoli* in Italy.',
      said: '「さあ荷造りを。ナポリという小さな町へ行きますよ」と、料理を出す前に言う。',
      mean: '旅の誘いではなく料理紹介の前ふり。イタリア風、つまりカルツォーネの予告。',
      trap: '「荷物をまとめて帰れ」や賞品の旅と取りやすいが、we’re going と自分も行く。比ゆ。',
      use: 'One bite and you’re in Paris.（一口食べればパリにいる気分）' },

    // R fix: S1, the audio doesn't settle that Ben says it; the stem no longer names him
    // why: an apology ← "I'm sorry" read literally; leave me alone ← the earlier "Excuse me" heard as pushing them off
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'sorry', seg: [117.6, 132],
      stem: 'After the group says it’s fed up, what does the next reply do?',
      choices: ['Showing he has no idea what’s going on', 'Apologizing for upsetting the group',
                'Telling the group to leave him alone'], a: 0,
      cue: 'I’m sorry のあとに続く質問。',
      line: '*I’m sorry, what’s happening now?*',
      said: '「すみません、今何が起きてるんです？」と聞き返す。',
      mean: 'I’m sorry は謝罪ではなく、話についていけない時の前置き。戸惑っている。',
      trap: 'sorry を「ごめんなさい」と取ると謝罪に聞こえる。あとに質問が続けば、聞き返しの前置き。',
      use: 'Sorry, what did you just say?（すみません、今なんて？）' },

    // R fix: K6, the key was the only choice with clip words ("making it all about her")
    // why: cooked up ← poach as a cooking word (ポーチドエッグ) + all the baking; money ← poach = steal, heard as funds
    { id: 'p4', skill: 'phrase', level: 'C1', point: 'poach', seg: [137, 146],
      stem: 'What does the group say Leslie has done to Ben’s campaign?',
      choices: ['Taken it over and put herself at the center', 'Cooked up stories about her husband',
                'Taken money out of it for herself'], a: 0,
      cue: 'campaign のあと、by で説明が続く。',
      line: 'Leslie Knope *poaches* her husband’s campaign by *making it all about her*.',
      said: '「夫の選挙運動を自分中心にして横取りしている」と非難する。',
      mean: 'poach ＝ 横取りする、引き抜く。by making it all about her が中身。',
      trap: 'poach は料理の語でもあるが、by のあとの説明を聞けば意味が決まる。',
      use: 'He always makes it all about him.（彼はいつも自分の話にする）' },

    // R fix: a U+FFFD in `said`
    // why: Nine ← "five" with the v lost; Four ← only the f is caught
    { id: 'd6', skill: 'number', level: 'B1', point: 'aprons', seg: [146, 152.7],
      stem: 'How many personalized aprons does Leslie say Ben has?',
      choices: ['Four', 'Five', 'Nine'], a: 1, keep: true,
      cue: 'aprons の直前、数の語。',
      line: 'He loves to cook. He has *five* personalized aprons.',
      said: '「彼は料理が好き。名前入りのエプロンが5枚もある」と言う。',
      mean: '数は「本当に好きな証拠」。5枚もあるのが、夫の料理好きぶりを物語る。',
      trap: 'five の v が弱いと nine に、f だけだと four に聞こえる。母音「アイ」と語頭で決める。',
      use: 'I have three of these at home.（これ、家に3つあるよ）' },

    // R fix: V2, "dress for the contest" was a filler and the key echoed "loves to"; choices rebalanced
    // why: well prepared ← five aprons heard as gear for the contest; she pushed him ← "forcing him" in the group's
    //   claim, heard as her admission
    { id: 'i4', skill: 'infer', level: 'B2', point: 'aprons', seg: [146, 152.7],
      stem: 'Why does Leslie bring up the aprons?',
      choices: ['To show cooking is his own choice', 'To show he’s ready for the contest',
                'To show she pushed him to cook'], a: 0,
      cue: 'not forcing の直後の2文。',
      line: 'I’m *not forcing* him to do anything. *He loves to cook*. He has five personalized aprons.',
      said: '「無理やりじゃない。料理が好きなの。エプロンが5枚あるくらい」と反論。',
      mean: 'エプロンは本人の料理好きの証拠。強制という主張への反論。',
      trap: 'forcing が聞こえると、彼女が認めたように取りやすい。not と、続く loves を聞く。',
      use: 'Trust me, he loves this stuff.（本当に、彼はこういうのが好きなの）' },

    // R fix: V2/K6, the key was the only nuanced choice ("without its knowing"); every choice now gives a reason
    // why: Leslie ← the group attacks her ("making it all about her"), so the joke seems aimed at her; women ←
    //   "feminized society" heard as the target
    // anchor: 161.4–167.1 s "a very rough go of it for just recently": hard times that began only recently admit that
    //   things were easy for men before
    { id: 'c1', skill: 'humor', level: 'C2', point: 'roughgo', seg: [156.3, 167.7],
      stem: 'In the group’s complaint about men’s hard times, who is the joke on?',
      choices: ['The men’s group, for admitting men had it easy', 'Leslie, for making the campaign about her',
                'Women’s groups, for making society soft'], a: 0,
      cue: 'recently の前の語と、苦労の期間の長さ。',
      line: 'Men have had a very rough go of it *for just recently*, and it ends now.',
      said: '「男たちはつい最近、とても苦労している。それも今日で終わりだ」と宣言する。',
      mean: '「ついこの間から大変」は、それまでずっと楽だったと認めること。笑われているのは本人たち。',
      trap: '抗議はレスリーに向いているので、皮肉も彼女向きと取りやすい。主語と期間の語を追えば自分たちの話。',
      use: 'Life’s been hard lately. Like, since Tuesday.（最近大変でさ。火曜からだけど）' },

  ]
};
