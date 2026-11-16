// “Leslie discovers the truth about her heroes | Parks and Recreation” (the official Parks and Recreation channel,
// Season 2): Leslie gathers every living former parks director for a picnic and asks each about the job; one kept
// women out, one took the job for the money, one smoked pot at work, and they snipe at each other throughout.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–13 s (the cut-off opener and the sweater
// swap), 36–38 s ("checked something off her bucket list" vs captions "checks up not for"), 53–60 s (a sexual brag
// and insults), 61–70 s (the failed chant), 135–151 s (Clarence's sexist reasoning), 191–197 s (a menstruation line),
// 210–214 s (a crude visual gag), 221–226 s (who copies the Eagleton letter), 253–255 s ("yes, Ron, I am" vs captions
// "guess Ronald"), 264–272 s (the legalization argument).
// EAR CHECK: 16–25 s a1 x1 — “Right. How long is this gonna take?” is taken as David's (Leslie has just greeted him
//   by name; nobody names the speaker)
// EAR CHECK: 123.4 s nt2 — the stress in “Not in my department” falls on “my” (contrast), not “not” (ship only once
//   confirmed)
// REVIEW 2026-11-16: pass 11, fix 13, drop 0, new 0; ear checks 2
import type { Clip } from '../types.ts';

export const heroes: Clip = {
  id: 'heroes', video: 'jpeE3WqqQp8', title: 'Leslie discovers the truth about her heroes', dur: 298, wpm: 155,
  band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: shy ← the Japanese frame: a short reply to praise heard as 照れ; keen ← "Right" heard as warm agreement
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'howlong', seg: [15.75, 25.0],
      stem: 'When Leslie says what an honor it is, how does David respond?',
      choices: ['Eager to get it over with', 'Shy about all the praise', 'Glad and keen to chat'], a: 0,
      cue: '「honor」のあと、短い返事と質問。',
      line: 'It is such an honor to meet you. — *Right. How long is this gonna take?*',
      said: '「お会いできて光栄です」に、「ああ。で、どのくらいかかるの？」と返す。',
      mean: 'ほめ言葉は流して、すぐ時間を気にしている。早く終わらせたい気持ち。',
      trap: 'Right を「その通り」と温かく取りやすい。すぐあとの質問が本音。',
      use: 'How long is this going to take?（これ、どのくらいかかります？）' },

    // R fix: S4: the segment started 0.45 s before "how" and inside "Right" (21.4 s), which the stem quotes.
    { id: 'x1', skill: 'dict', level: 'B1', point: 'howlong', seg: [21.0, 23.75],
      stem: 'Type the question: “Right. ___?” (6 words)', answer: 'how long is this gonna take',
      cue: 'Right のあと、短い質問がひと息で。',
      line: 'Right. *How long is this gonna take?*',
      said: '光栄だと言われ、「で、どのくらいかかるの？」と聞く。',
      mean: 'gonna ＝ going to。is this が「イズィス」とつながり、全体がひと息。',
      trap: 'going to と書きたくなるが、音は gonna。is と this の境目も消えやすい。',
      use: 'It won’t take long, I promise.（すぐ終わるから、約束する）' },

    // R fix: V2 + K6 (blind 55 %: the key was the only two-part choice). Each distractor now says how Clarence
    //   takes it, too.
    // why: relief ← "former living directors" comes just before, so "I thought you were dead" sounds like glad news;
    //   mix-up ← heard as a genuine error, and Clarence's "No" sounds like a correction
    { id: 'i2', skill: 'infer', level: 'B2', point: 'dead', seg: [46.5, 54.05],
      stem: 'When Clarence is greeted with “I thought you were dead”, what is that line?',
      choices: ['A jab, and Clarence jabs right back', 'Relief, and Clarence is touched by it',
                'A real mix-up, and Clarence corrects it'], a: 0,
      cue: 'Clarence の返事の中身。',
      line: 'I thought you were dead, Clarence. — No, *I’m gonna outlive you*.',
      said: '「死んだと思ってたよ」と言われ、「いや、お前より長生きしてやる」と返す。',
      mean: '再会のあいさつに見せた嫌み。返事もやり返していて、仲の悪さが分かる。',
      trap: '生きていて安心した、と取りやすい。返事の outlive you が勝負の言葉。',
      use: 'Oh, you’re still around?（あれ、まだいたの？）' },

    // R fix: V2 + K2 (blind 65 %). "A very light breakfast" isn't refuted by the audio (one breakfast could be light).
    //   Now "one" read as one item, and the skip reading with a reason.
    // why: skipped ← "only" heard as "didn't even"; one thing ← "one breakfast" read as one item of food
    { id: 'i3', skill: 'infer', level: 'B2', point: 'breakfast', seg: [77.0, 81.05],
      stem: 'What does Ron’s complaint about breakfast suggest about him?',
      choices: ['He often eats more than one breakfast', 'He skipped breakfast to get here in time',
                'He had just one small thing for breakfast'], a: 0,
      cue: '「I’m starving」のあと、only のあと。',
      line: 'I’m starving. I *only had one breakfast*.',
      said: '「腹ぺこだ。朝ごはんを1回しか食べてない」と言う。',
      mean: 'only one ＝ 1回「しか」。ふだんは朝ごはんを何回も食べる人だと分かる。',
      trap: 'only を「全然」と取ると、食べていないように聞こえる。数えているのは回数。',
      use: 'I only had one coffee today.（今日はコーヒー1杯しか飲んでない）' },

    // why: Clarence ← the name heard most in the sniping just before; all ← "not exactly sure" heard as knowing them
    //   all, just not why they fight
    { id: 'd1', skill: 'detail', level: 'B1', point: 'knows', seg: [81.0, 89.6],
      stem: 'When Leslie asks about the sniping, which former director does Ron know?',
      choices: ['Only Michael', 'Only Clarence', 'All of them'], a: 0,
      cue: '「Not exactly sure」のあと、the only one のあと。',
      line: 'The *only one I know is Michael*, and we’re not exactly best friends.',
      said: '「よく分からない。知ってるのはマイケルだけで、仲がいいわけでもない」。',
      mean: '知っているのは1人だけ。だから口げんかの理由も知らない。',
      trap: '直前の口げんかで聞いた名前に引っぱられやすい。only one のあとの名前を聞く。',
      use: 'The only one I know here is Sam.（ここで知ってるのはサムだけ）' },

    // R fix: V2 (blind 50 %: "only just met" was a filler). Now a scale (keep, ascending), with "very well" for a
    //   listener who catches "best friends" and loses "not exactly".
    // why: fairly well ← "not exactly best friends" read literally (friends, just not best ones); very well ← "best
    //   friends" caught, "not exactly" lost
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'bestfriends', reveals: ['knows'], seg: [81.0, 89.6],
      stem: 'How does Ron say he gets along with the one man he knows?',
      choices: ['Not well', 'Fairly well', 'Very well'], a: 0, keep: true,
      cue: '名前のあと、and のあとの言い方。',
      line: 'and we’re *not exactly best friends*.',
      said: '「マイケルとは、親友ってわけじゃない」と言う。',
      mean: 'not exactly ～ ＝ 控えめに言って～ではない。仲が悪いことを、遠回しに言う。',
      trap: '文字通り「親友ではないが友だち」と取りやすい。not exactly は悪いことを和らげる定番。',
      use: 'It’s not exactly cheap.（決して安くはないよ）' },

    // why: hate it ← an h can drop in fast speech, and Ron is grumpy; had it ← "ate it" flaps to "eidit", close to
    //   "had it"
    { id: 's1', skill: 'sound', level: 'B2', point: 'bacon', seg: [91.4, 102.4],
      stem: 'Fill the gap: “I ___ already.”',
      choices: ['ate it', 'hate it', 'had it'], a: 0,
      cue: 'bacon のあと、Ron の返事の最初。',
      line: 'I cooked you some bacon… — *I ate it* already. … I could *smell it in your purse*…',
      said: '「ベーコンを焼いてきた」に、「もう食べた。バッグの中で匂ってた」と答える。',
      mean: 'ate it は t が弾んで「エイディッ」。had it に近いが、匂いの話が決め手。',
      trap: 'hate it なら「もう嫌い」で、匂ったという続きと合わない。',
      use: 'Sorry, I ate it already.（ごめん、もう食べちゃった）' },

    // why: 14 / 40 ← "four" heard as a -teen or -ty form, with "classes" right after it
    { id: 'n1', skill: 'number', level: 'B1', point: 'four', seg: [110.6, 115.3],
      stem: 'How many classes does Clarence say they offered that first year?',
      choices: ['4', '14', '40'], a: 0, keep: true,
      cue: '「that first year」のあと、classes の前。',
      line: 'that first year we *offered four classes*.',
      said: '「最初の年は、講座を4つ開いた」と思い出す。',
      mean: 'offer ＝ 講座などを用意して提供する。始まりはたった4つ。',
      trap: 'four のすぐあとに classes。fourteen なら「ティーン」、forty なら「ティ」が聞こえるはず。',
      use: 'We offer three classes a week.（週に3つの講座があります）' },

    // R fix: V2 (blind 55 %). "All of the town's schools" was off topic (these are parks classes). Now the denial
    //   reading of "Not in my department".
    // why: Leslie wrong ← "Not in my department" heard as a flat "no" to her; no teachers ← "Not in my department"
    //   heard as there being no teachers at all
    { id: 'i5', skill: 'infer', level: 'C1', point: 'women', seg: [115.15, 124.8],
      stem: 'What does Clarence’s reply to Leslie’s “Really?” reveal?',
      choices: ['He was the one keeping women out', 'Leslie is wrong; no women taught then',
                'His department had no teachers back then'], a: 0,
      cue: '「Really?」のあと、my のついた短い返事。',
      line: 'Women were *not allowed* to teach back then. — Really? … — *Not in my department.*',
      said: '「当時、女性は教えられなかった」と言い、反論されると「うちの部署ではね」と返す。',
      mean: '世の決まりではなく、自分の部署で女性を入れなかったと自ら明かしている。',
      trap: 'back then で時代の話に聞こえる。my が、本人の決めた事を示す。',
      use: 'Not on my watch.（私がいる限り、そうはさせない）' },

    // R fix: V2 (blind 50 %: "as against other kinds of work" was a weak reason). "department" now gets a coherent
    //   contrast (his department vs the schools), so the word, which only the ear settles, decides.
    // why: on "not" ← the denial pattern learners know from arguments ("Not true!"); on "department" ← the last content
    //   word takes the stress in a neutral reading, and a contrast with schools makes sense
    // anchor: 120.7–123.0 s Leslie "I thought there were female teachers way before then"; he doesn't deny it, he
    //   narrows it to his own ("Not in my department", 123.4–124.5 s)
    // retired: the ear-check policy: a C2 stress item (the stress in “Not in my department” on “my”, 123.4 s); back
    //   after the ear check
    { id: 'nt2', skill: 'sound', level: 'C2', retired: true, point: 'women', seg: [120.15, 124.8],
      stem: 'In “Not in my department”, where is the stress, and why?',
      choices: ['On “my”: other places may well have had them', 'On “not”: a flat denial of what Leslie said',
                'On “department”: unlike schools, which had them'], a: 0,
      cue: '短い返事で、いちばん強く長く聞こえる語。',
      line: 'I thought there were female teachers way before then. — Not in *my* department.',
      said: '「もっと前から女性の先生はいたはず」に、「うちの部署ではいなかった」と返す。',
      mean: 'my が強いと「よそはともかく、私の所では」という対比。彼女の話は否定せず、自分の部署に限っている。',
      trap: 'not を強めると反論になるが、ここは彼女の話を認めた上での限定。強勢は何と比べているかを示す。',
      use: 'Maybe at your office. Not at mine.（君の会社はそうでも、うちは違う）' },

    // R fix: V2 (blind 65 %: "first female" and "director" were each in two choices, so the key was the majority pick).
    // why: from deputy ← "deputy director" and "first" both heard, in the wrong relation; youngest ← "first" heard as
    //   a record, with "female" lost
    { id: 'd3', skill: 'detail', level: 'B1', point: 'goal', seg: [126.4, 133.5],
      stem: 'What does Leslie say she hopes to be someday?',
      choices: ['The first female director of the department', 'The first director to be promoted from deputy',
                'The youngest director the department has had'], a: 0,
      cue: '「deputy director now」のあと、but のあと。',
      line: 'I’m deputy director now, but I’m hoping someday to be *the first female director*…',
      said: '「今は副部長だけど、いつかこの部で初の女性部長になりたい」と言う。',
      mean: 'deputy ＝ 副〜。今の肩書きと、目指す肩書きを並べている。',
      trap: 'deputy は今の立場。but のあとが目標で、first female が「初の女性」。',
      use: 'I’m hoping to be a manager someday.（いつか管理職になりたい）' },

    // why: forced out ← "pushed… out" is said, but by David, about Clarence; calling ← Leslie's "what called you
    //   to…" invites a calling
    { id: 'g2', skill: 'gist', level: 'B2', point: 'david', reveals: ['pension', 'swoop'], seg: [152.9, 182.0],
      stem: 'What does Leslie learn when she asks David how he got the job?',
      choices: ['He came for himself, not for the parks', 'He was forced out of public works first',
                'He came because parks were his calling'], a: 0,
      cue: 'David の答え全体、理由に当たる部分。',
      line: 'what was it exactly that *called you* to the parks department? … *Just the money and the pension*.',
      said: 'きっかけを聞くと、弱い上司を追い出した話と、お金目当てという答え。',
      mean: '憧れの元部長は、公園への思いではなく、自分の得のために来ていた。',
      trap: 'pushed out は David がした事。called you は期待で、答えは逆。',
      use: 'What drew you to this job?（この仕事を選んだきっかけは？）' },

    // why: 18 ← "eight" heard as "eighteen"; 48 ← "for eight" run together as "forty-eight"
    { id: 'n2', skill: 'number', level: 'B1', point: 'eight', seg: [156.9, 160.9],
      stem: 'How long was David in public works?',
      choices: ['8 years', '18 years', '48 years'], a: 0, keep: true,
      cue: '「public works」のあと、years の前。',
      line: 'I was in public works *for eight years*…',
      said: '「公共事業の部署に8年いた」と話し始める。',
      mean: 'public works ＝ 道路などを扱う公共事業の部署。そこに8年いた。',
      trap: 'for eight がつながると forty-eight に聞こえやすい。-teen なら「ティーン」が長い。',
      use: 'I worked in sales for eight years.（営業に8年いました）' },

    // R fix: V2 (blind 65 %: "a young, modern boss" was a filler). New keyword trap: "pushed… out" is said, but by
    //   David, about Clarence.
    // why: pushed out ← "pushed him out" heard with the roles swapped; easy to replace ← "weak" is said, but about
    //   Clarence
    { id: 'i6', skill: 'infer', level: 'C1', point: 'young', seg: [156.9, 167.6],
      stem: 'Why does David mention that the public works director was young?',
      choices: ['He wouldn’t leave soon, so there was no way up', 'The young boss had pushed him out of the job',
                'Young bosses seemed weak and easy to replace'], a: 0,
      cue: '「pretty young」と、Clarence の説明の対比。',
      line: 'but the director was *pretty young*. *Clarence was old and weak*, so I put in for a transfer…',
      said: '「向こうの部長は若かった。クラレンスは年寄りで弱かったから、異動を願い出た」。',
      mean: '若い上司はしばらく辞めないので上に行けない。弱い上司の部署を狙ったということ。',
      trap: 'weak は若い部長ではなく、クラレンスの話。but と so で理由の流れを追う。',
      use: 'There was no room to move up.（上に行ける余地がなかった）' },

    // why: retire ← "pension" comes later in the same talk; moved ← "transfer" and "public works" heard in the wrong
    //   relation
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'swoop', seg: [160.85, 167.6],
      stem: 'After his transfer, what does David say he did to Clarence?',
      choices: ['Came in fast and took his job', 'Helped him retire on a pension', 'Had him moved to public works'],
      a: 0,
      cue: '「transfer」のあと、2つの動き。',
      line: 'so I put in for a transfer, *swooped in and pushed him out*.',
      said: '「異動を願い出て、さっと入り込み、彼を追い出した」と言う。',
      mean: 'swoop in ＝ 鳥が舞い降りるように素早く入る。push out ＝ 追い出す。',
      trap: 'transfer は David 本人の異動。クラレンスはどこにも移らず、追い出された。',
      use: 'She swooped in and took the last seat.（彼女がさっと最後の席を取った）' },

    // why: parks ← Leslie's hopeful question invites a love of parks; less stress ← "nightmare" heard as about his
    //   old job
    { id: 'd4', skill: 'detail', level: 'B1', point: 'pension', seg: [169.9, 177.6],
      stem: 'When Leslie asks for another reason, what does David say he wanted?',
      choices: ['Only the money and the pension', 'Money, and to work in parks', 'A job with less stress than before'],
      a: 0,
      cue: '「Nope.」のあと、just のあと。',
      line: 'Nope. *Just the money and the pension*. Actual job’s a nightmare.',
      said: '「ない。お金と年金だけ。仕事そのものは最悪」と答える。',
      mean: 'pension ＝ 年金。仕事への愛ではなく、待遇だけが目当て。',
      trap: 'nightmare は今の仕事のこと。前の仕事の話ではない。just が「それだけ」を示す。',
      use: 'I’m just in it for the money.（お金のためだけにやってるよ）' },

    // R fix: V2 (blind 55 %, helped by the title, "the truth about her heroes"). "Others' turn" is replaced by the
    //   time reading, which Leslie herself set up at 70–73 s ("taking a lot longer than I thought").
    // why: running late ← she said earlier it was "taking a lot longer than I thought", and "almost there" follows;
    //   rude to Clarence ← "old and
    //   weak… pushed him out" is the harshest thing said about a person here
    // anchor: 170.4–172.5 s "Uh, there was no other reason you wanted the job?" (her hope); 173.1–181.5 s "Just the
    //   money… who gives a crap about this crap"; 186.3–188.4 s "Well, David, I think we've talked enough"
    // retired: with nt2 (one C2 alone is under the tier's 2)
    { id: 'nt1', skill: 'attitude', level: 'C2', retired: true, point: 'talked', reveals: ['pension'], seg: [169.9, 188.5],
      stem: 'When Leslie stops David’s answer, what is she trying not to say?',
      choices: ['That he has let her down as a hero', 'That they’re running late for the picnic',
                'That he is being rude to Clarence'], a: 0,
      cue: '「no other reason?」の期待と、最後の答え。',
      line: 'there was *no other reason* you wanted the job? — Nope. *Just the money*… — Well, David, I think we’ve talked enough.',
      said: '「ほかに理由は？」と期待して聞くが、「お金だけ。仕事なんてどうでもいい」と返され、話を切る。',
      mean: '憧れの人への失望を、丁寧な打ち切りで隠している。期待した問いと、裏切る答えの差が手がかり。',
      trap: '前に「時間がかかる」と言ったので時間の都合に見えるが、打ち切る直前に何を聞いたかで考える。',
      use: 'Well, that’s… not what I expected.（ええと…思ってたのと違うな）' },

    // R fix: V2 (blind 70 %: "time to eat" was a filler). New: a polite "more later" (the また後で frame).
    // why: thanking ← "we've talked enough" heard as "you've told us plenty" (the お礼 frame); later ← a polite
    //   close heard as postponing, not ending
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'talked', seg: [177.8, 188.5],
      stem: 'After David’s last remark, what is Leslie doing with “Well, David…”?',
      choices: ['Ending his turn, politely, before it gets worse', 'Thanking him for such a full, honest answer',
                'Telling him, politely, he can say more later'], a: 0,
      cue: 'David の最後の一言と、少しの間のあと。',
      line: 'Actual job’s a nightmare… — *Well, David, I think we’ve talked enough.*',
      said: '「仕事は最悪、どうでもいい」と言われ、間をおいて「もう十分お話しいただきました」。',
      mean: '丁寧な形で、話を打ち切っている。これ以上ひどい話を聞きたくない。',
      trap: 'お礼に聞こえるが、talked enough は「もうやめて」。Well の前の間も合図。',
      use: 'I think that’s enough for today.（今日はこのくらいにしましょう）' },

    // R fix: V2 (blind 65 %: the key was the only mixed feeling). The pleased choice is mixed now too.
    // why: give up ← "hasn't gone… as I've hoped" heard on its own; pleased ← "I got them all here" heard as the goal
    //   reached, and the stammer as tiredness
    { id: 'a4', skill: 'attitude', level: 'C1', point: 'hope', seg: [202.4, 210.35],
      stem: 'In her talk to the camera, how does Leslie feel about the day?',
      choices: ['Let down, but talking herself into hope', 'Let down, and ready to give up on it',
                'Pleased, though a little worn out by it'], a: 0,
      cue: '「hoped」のあとと、同じ言葉のくり返し。',
      line: 'it *hasn’t gone exactly as I’ve hoped*, but… *it’s gonna — it’s gonna be good*.',
      said: '「思いどおりではないけど、全員集めたし、素敵なピクニックになる。きっと、いいものに」。',
      mean: '失望を控えめに認め、言い直しながら自分に言い聞かせている。前向きさは半分強がり。',
      trap: '全員集めたのは成功だが、満足とは言っていない。くり返しは自信のなさの合図。',
      use: 'It’s gonna be fine. It really is.（大丈夫。本当に大丈夫）' },

    // why: advice ← her hope to be director came up earlier; copy ← "copy the Eagleton one" is said twice just
    //   before
    { id: 'g1', skill: 'gist', level: 'B2', point: 'letter', seg: [217.4, 234.95],
      stem: 'At the picnic, what does Leslie want from the former directors?',
      choices: ['Their thoughts on how the department has changed', 'Their advice on how she can become director',
                'A copy of the letter they used to send out'], a: 0,
      cue: '「I was hoping」のあと、何を話してほしいか。',
      line: 'I’m working on my *welcome letter*… I was hoping… you could talk to me… about *how the department’s changed* since you ran it.',
      said: '夏のカタログのあいさつ文を書いていて、昔と比べて部署がどう変わったか話してほしいと頼む。',
      mean: '集めた目的は、あいさつ文の材料。昔と今を比べる話が聞きたい。',
      trap: 'copy の話は冗談で、彼女の頼みではない。I was hoping のあとが本題。',
      use: 'I was hoping you could help me.（手伝ってもらえたらと思って）' },

    // why: parks ← "the parks themselves" is said, but as what he loved; in charge ← "turn at the helm" heard as
    //   leading people
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'pencil', seg: [233.3, 242.6],
      stem: 'When asked about his time in charge, what does Michael say he disliked?',
      choices: ['The desk work and the forms', 'Being out in the parks all day', 'Being the one in charge of others'],
      a: 0,
      cue: '「in a way」のあと、wasn’t really my thing の前。',
      line: '*Pencil pushing* wasn’t really my thing, but I did *love the parks themselves*.',
      said: '「書類仕事は性に合わなかったけど、公園そのものは大好きだった」と答える。',
      mean: 'pencil pushing ＝ 鉛筆を動かすだけの事務仕事。少し見下した言い方。',
      trap: 'parks は好きだった方。not my thing（性に合わない）の前を聞く。',
      use: 'Paperwork isn’t really my thing.（書類仕事はどうも苦手で）' },

    // R fix: V2 + K6 (blind 65 %: the key was the only "No"). "Glad" is replaced by the right mechanism with the wrong
    //   target.
    // why: mocking Leslie ← irony caught, aimed at the one who said it first; make up ← he said they're "not exactly
    //   best friends", so a kind echo sounds like a truce
    { id: 'a5', skill: 'attitude', level: 'C1', point: 'goodness', seg: [244.15, 251.25],
      stem: 'When Ron repeats Leslie’s thanks to Michael, is he sincere?',
      choices: ['No; he’s setting up a dig at Michael', 'No; he’s mocking Leslie’s gushing thanks',
                'Yes; he’s trying to make up with Michael'], a: 0,
      cue: 'くり返しのすぐあと、Ron の質問。',
      line: 'Yes, *thank goodness for Michael*. *Are you still on parole*, by the way?',
      said: '「あなたのおかげ」をくり返し、すぐ「ところで、まだ仮釈放中？」と聞く。',
      mean: 'くり返しは次の一撃の前ふり。by the way で何気なく見せて、過去を暴く。',
      trap: '同じ言葉のくり返しは賛成に聞こえやすい。皮肉かどうかは、すぐあとの一言で決まる。',
      use: 'Oh, by the way, how’s the diet going?（ところで、ダイエットはどう？）' },

    // why: sorry ← "in fairness to me" heard as the start of an apology (the Japanese frame: 反省の前置き); made up ←
    //   "Oh, ha ha, very funny" just before heard as a denial
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'fairness', seg: [254.75, 262.55],
      stem: 'Right after Ron explains, what does Michael’s first sentence do?',
      choices: ['Gives an excuse for what he did back then', 'Admits it was wrong and says he’s sorry',
                'Says Ron has made the whole story up'], a: 0,
      cue: 'Ron の説明のあと、時代の話。',
      line: '*In fairness to me*, it was *a different time*. It was the early ’90s.',
      said: '「公平に言わせてもらうと、時代が違った。90年代の初めだったし」と言う。',
      mean: 'in fairness to me ＝ 自分を弁護する前置き。時代のせいにしている。',
      trap: '謝る前置きに聞こえやすいが、sorry はない。時代を持ち出すのは言い訳の定番。',
      use: 'In fairness to me, nobody told me.（言わせてもらうと、誰も教えてくれなかった）' },

    // R fix: V2 (blind 60 %: "acting deaf" named the joke). The key is plainer, and "missed it" becomes the polite
    //   "sorry" reading. S4: the segment ended 0.3 s after "hippies".
    // why: say again ← "I'm sorry, I can't hear" read as a polite request to repeat; quietly agrees ← the Japanese
    //   frame: a dodge heard as hiding one's real view (本音を隠す)
    { id: 'h4', skill: 'humor', level: 'C1', point: 'hippies', seg: [273.0, 277.4],
      stem: 'Why does Ron’s answer to Michael’s last question get a laugh?',
      choices: ['He treats Michael’s view as not worth a reply', 'He politely asks Michael to say it again',
                'He quietly agrees but won’t admit it in public'], a: 0,
      cue: '「I’m sorry」のあと、誰の声が聞こえないか。',
      line: 'That makes sense to you, Ron? — *I’m sorry, I can’t hear hippies.*',
      said: '「筋が通ってると思う？」に、「悪いね、ヒッピーの声は聞こえない」と返す。',
      mean: '聞こえないふりで議論に乗らない。相手をヒッピーとまとめ、話す価値なしと示す。',
      trap: 'can’t hear を文字通り取りやすい。聞こえない相手を「ヒッピー」と選んでいる。',
      use: 'Sorry, I can’t hear you over the noise.（ごめん、うるさくて聞こえない）' },
  ]
};
