// “Ron's Permit | Parks and Recreation” (the official Parks and Recreation channel, Season 5): with Leslie away, Ron
// takes over the staff barbecue to strip it down to meat, brings a live pig named Tom, and backs down over his
// home-made permit.
// Segments from the captions, words from whisper (2026-11-16). Speech ends at 166 s (music, then whisper loops “We'll
// see you next time” to the end). Untested: the sung “Parks and Dolls… dawn till dark” (31.8–40.7 s), the speakers'
// names (captions “ryan” for “Ron” at 67.4 s). No who item.
// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 2
// EAR CHECK: 113.3–114.9 s nt1 — “burn!” and “Seriously?” are two different people (the one teased answers), and
//   Ron's “given Christian name” answers the teased one
// EAR CHECK: 138.8 s pd2 — the cut falls after “are you?” and before “Not to worry” (only 0.3 s between them)
import type { Clip } from '../types.ts';

export const ronPermit: Clip = {
  id: 'ronpermit', video: 'Cq9rqDNOgh4', title: 'Ron\'s Permit', dur: 189, wpm: 163, band: 'slow',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %): "bad news" was a weak filler; now a "not" lost reading (Leslie still in charge)
    // why: joke flopped ← "joking" heard as Ron told a joke; a joke ← "not" lost, so the news itself is the joke
    //   (refuted by "not" and by "Leslie's gone")
    { id: 'i1', skill: 'infer', level: 'C1', point: 'notjoking', seg: [0, 9.0],
      stem: 'After the news that Ron is leading the meeting, what does the next line imply?',
      choices: ['Ron running a meeting is so unusual it’s hard to believe', 'Ron just told a joke at the meeting, and nobody laughed',
                'The news is a joke, and Leslie is still in charge'], a: 0,
      cue: '「leading the meeting」のあとの短い一言。',
      line: 'Ron has *taken initiative*, and he is leading the meeting. — *He’s not joking.*',
      said: 'Ron が会議を仕切ると聞き、別の人が「冗談じゃないよ」と足す。',
      mean: 'Ron が会議を仕切るのは、冗談に聞こえるほど珍しい。',
      trap: '「Ron が冗談を言った」と取りやすいが、not joking は前の話が本当だという念押し。',
      use: 'I’m not joking. He actually showed up early.（冗談じゃなく、本当に早く来たんだ）' },

    // why: goodbye ← "Leslie's gone" just before; welcome ← "employee" heard without "annual" and "appreciation"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'event', seg: [9.0, 15.2],
      stem: 'What does Ron say he will throw?',
      choices: ['A yearly barbecue to thank the staff', 'A goodbye barbecue for Leslie, who is gone',
                'A welcome barbecue for the new employees'], a: 0,
      cue: '「throwing the」のあと、長い名前の中身。',
      line: 'I will be throwing the *annual* Parks Department *Employee Appreciation* Barbecue.',
      said: '「毎年恒例の職員感謝バーベキュー」を自分が開く、と言う。',
      mean: 'annual ＝ 毎年の。appreciation ＝ 感謝。',
      trap: '直前の Leslie’s gone で送別会と思いやすい。名前の中身を聞く。',
      use: 'We’re having our annual office party.（毎年恒例の会社のパーティーがあるんだ）' },

    // R fix: V2 (blind 70 %): the key was the only "Ron-like" choice; now two strip-down reasons, cut by "which is the
    //   point"
    // why: save money ← dropping the extras is right, the reason is not (he says not doing them *is* the point);
    //   same way ← "Every summer Leslie throws a barbecue to thank…" heard as Ron filling in for her
    { id: 'g1', skill: 'gist', level: 'B2', point: 'point', seg: [9.0, 49.0],
      stem: 'Why is Ron the one throwing the barbecue?',
      choices: ['To leave out Leslie’s fun extras on purpose', 'To save money by leaving out the fun extras',
                'To thank the staff just the way Leslie does'], a: 0,
      cue: '長いリストのあとの Ron の返事。',
      line: 'I am *not doing any of that*, which is the point.',
      said: '同僚が Leslie 流の出し物を並べると、Ron は「どれもやらない」と言う。',
      mean: 'Ron が開くのは、楽しい出し物を全部なくすため。',
      trap: '出し物をなくすのは節約のため、と取りやすい。which is the point は「なくすこと自体が狙い」。',
      use: 'No speeches this time. That’s the whole idea.（今回はスピーチなし。それが狙い）' },

    // R fix: V2 (blind 60 %): rebalanced to three one-line feelings; C5: the stem's "every summer" hints d1's "annual"
    // why: scared ← horrifying read literally as 怖い; jealous ← Ron takes over Leslie's own event
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'horrify', reveals: ['event'], seg: [43.6, 52.9],
      stem: 'How does Ron feel about the barbecue Leslie throws every summer?',
      choices: ['He truly can’t stand it', 'He’s truly scared of it', 'He’s secretly jealous of it'], a: 0,
      cue: '「maintenance staff」のすぐあとの一言。',
      line: 'Every summer Leslie throws a barbecue… *It’s horrifying.*',
      said: '「毎年夏、Leslie が職員のためにバーベキューを開く。ぞっとする」と言う。',
      mean: 'horrifying は「本当にいや」という大げさな言い方。怖いのではない。',
      trap: 'horror から「怖い」と取りやすい。好みの話では強い嫌悪を表す。',
      use: 'That song is horrifying. Turn it off.（あの曲ひどい。止めて）' },

    // R fix: V2 (blind 65 %): "meat" alone gave it away; all three are now meat, told apart by "shared"
    // why: grills ← "shared" lost, a cookout's usual each-to-his-own grill; slow over a fire ← the barbecue script,
    //   filling the gap where "shared" was
    { id: 'd3', skill: 'detail', level: 'B1', point: 'meat', seg: [49.0, 54.5],
      stem: 'What does Ron say a barbecue should be about?',
      choices: ['Good meat that everyone shares', 'Good meat that each person grills', 'Good meat cooked slow over a fire'], a: 0,
      cue: '「about one thing」のあと、3語。',
      line: 'Barbecues should be about one thing: *good shared meat*.',
      said: 'バーベキューの目的は一つ、みんなで分けるうまい肉だ、と言う。',
      mean: 'shared meat ＝ 皆で分ける肉。肉だけが大事、という Ron の考え。',
      trap: 'meat は聞こえても、前の shared を落としやすい。名詞の前の形容詞まで拾う。',
      use: 'Vacations should be about one thing: rest.（休暇は休むためにある）' },

    // why: all four are said in the list; desserts comes first, costumes right before "and most of all"
    { id: 'd4', skill: 'detail', level: 'B2', point: 'banned', seg: [54.5, 67.1],
      stem: 'Which thing does Ron ban “most of all”?',
      choices: ['Vegetables', 'Desserts', 'Men in costumes', 'Soap bubble guns'], a: 0,
      cue: '「most of all」のあと、少し間があってから。',
      line: 'And *most of all*, there will be no *vegetables*.',
      said: 'デザートもシャボン玉も仮装もなし。そして何より、野菜はなし、と並べる。',
      mean: 'most of all ＝ 何よりも。最後に一番言いたいものを置いている。',
      trap: '直前の costumes を選びやすい。most of all のあとに来る語が、いちばん強い。',
      use: 'And most of all, no phones at dinner.（そして何より、夕食中はスマホなし）' },

    // R fix: V2 (blind 60 %): "instead of meat" was absurd; now "does corn count?", a fair reading if "at least" is lost
    // why: drop the ban ← the question comes right after "no vegetables", heard as a protest; counts ← corn's
    //   in-between status, with "at least" missed
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'atleast', reveals: ['banned'], seg: [63.9, 69.4],
      stem: 'After the vegetable ban, what does the corn question show?',
      choices: ['They ask for one vegetable as a minimum', 'They ask whether corn counts as a vegetable',
                'They ask him to drop the vegetable ban'], a: 0,
      cue: '「can we」のすぐあとの2語。',
      line: 'Well, Ron, can we *at least* have corn on the cob?',
      said: '野菜は全部なし、と聞いて、「せめてトウモロコシはいいでしょ？」と聞く。',
      mean: 'at least ＝ せめて。大きな望みはあきらめ、最低限だけ頼む言い方。',
      trap: 'corn は野菜なのかと聞いていると取りやすい。at least が入ると最低限だけ頼む形。',
      use: 'Can I at least get a window seat?（せめて窓側の席にできますか）' },

    // predict: the segment stops in the pause after "corn on the cob?"; then plays "No."
    // R fix: V2 (blind 65 %): a refusal was the only "no"; now two kinds of no (bare vs with a speech) and a yes
    // why: speech ← Ron gave a reason earlier ("should be about one thing"); grilled yes ← "at least" sounds like an
    //   opening for a compromise
    { id: 'pd1', skill: 'predict', level: 'B2', point: 'corn', seg: [63.9, 71.5], then: [71.5, 74.3],
      stem: 'After the corn question, what kind of reply is coming from Ron?',
      choices: ['A one-word no, with no reason given', 'A no, with a speech on why meat matters',
                'A yes, as long as the corn is grilled'], a: 0,
      cue: 'ここまでの Ron の禁止の言い方を思い出して。',
      line: 'can we at least have corn on the cob? — *No.*',
      said: '「せめてトウモロコシは？」に、Ron は間をおいて「No」とだけ答える。',
      mean: '理由も代わりの案もない一語の拒否。それまでの「なし」の並びと同じ調子。',
      trap: 'at least の頼み方だと妥協が来そうに思えるが、Ron は交渉に乗らない。',
      use: 'The answer is no. Sorry.（答えはノー。ごめんね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'job', seg: [74.4, 78.75],
      stem: 'Type what the speaker says: “I offered Ron a job… and he ___.” (3 words)', answer: 'turned me down',
      cue: '「last month and he」のあと。',
      line: 'I offered Ron a job last month, and he *turned me down*.',
      said: '「先月 Ron に仕事を勧めたけど、断られた」とカメラに話す。',
      mean: 'turn someone down ＝ 誘いや申し出を断る。',
      trap: 'turned の -ed は弱く、me とつながって「ターンミー」に近い。現在形と思わない。',
      use: 'I had to turn down the offer.（その申し出は断るしかなかった）' },

    // why: still hurt ← "it literally broke my heart" is the loudest line; worried ← "where he belongs" heard as stuck
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'belongs', reveals: ['job'], seg: [74.4, 88.3],
      stem: 'In the talking head about the job offer, how does the speaker feel now?',
      choices: ['Happy that Ron stayed where he fits', 'Still hurt that Ron said no to him', 'Worried that Ron is unhappy at work'], a: 0,
      cue: '「but now」のあと、気持ちが変わるところ。',
      line: '…it *literally broke my heart*. *But now* I see that this is truly *where he belongs*.',
      said: '断られて「本当に胸が張り裂けた」。でも今は、ここが彼の居場所だと分かった。',
      mean: 'but now で気持ちが変わる。今は Ron が残ってよかったと喜んでいる。',
      trap: 'broke my heart が強く残るが、それは過去の話。but のあとが今の気持ち。',
      use: 'I was upset, but now I get it.（最初は落ち込んだけど、今は分かる）' },

    // why: can ← the t of can't is dropped; could/couldn't ← a past-tense reading of a cheer that didn't land
    { id: 's1', skill: 'sound', level: 'B2', point: 'hear', seg: [84.3, 91.7],
      stem: 'Fill the gap: “He ___ hear me.”',
      choices: ['can', 'can’t', 'could', 'couldn’t'], a: 1,
      cue: '「He」のすぐあと、母音の長さと強さ。',
      line: 'Way to be, Ron!… *He can’t hear me.*',
      said: 'Ron に大声で声援を送ったあと、「聞こえてないや」とつぶやく。',
      mean: 'can’t は t がほぼ消え、母音が長く強い「キャーン」。can なら弱く短い「クン」。',
      trap: 't の音を探すと can と取りやすい。強く長い母音が否定の手がかり。',
      use: 'Sorry, I can’t hear you. You’re breaking up.（ごめん、聞こえない。電波が悪い）' },

    // R fix: V2 (blind 75 %): the pun itself was the tell; the gap now turns on the weak middle word. S4: the
    //   segment was 2.8 s; it now starts at 96.4 s, before "Oh no"
    // why: our ← "your" is weak and its y glide is easy to lose; the ← the commonest weak word in that slot
    { id: 's2', skill: 'sound', level: 'B2', point: 'meet', seg: [96.4, 100.1],
      stem: 'Fill the gap: “Everyone, ___.”',
      choices: ['meet your meat', 'meet our meat', 'meet the meat'], a: 0,
      cue: '「Everyone」のあと、真ん中の弱い一語。',
      line: 'Everyone, *meet your meat*.',
      said: '生きた豚を連れてきて、「みんな、これが君たちの肉だ」と紹介する。',
      mean: 'meet（会う）と meat（肉）は同じ発音。人を紹介する決まり文句を豚に使っている。',
      trap: 'your は弱く、our や the と区別しにくい。meet の直後の y の音を聞く。',
      use: 'Everyone, meet my sister, Yuki.（みんな、妹のユキです）' },

    // R fix: V2 (blind 70 %): "cook from scratch" was a filler; now a thank-the-animal ritual reading
    // why: raise ← "circle of life" heard as farming; thank ← "considered the circle of life" heard as gratitude,
    //   the eye contact missed
    { id: 'i2', skill: 'infer', level: 'B2', point: 'circle', seg: [101.8, 108.95],
      stem: 'When asked why he’s doing this, what does Ron think people should do?',
      choices: ['Look the animal they eat in the eye', 'Thank the animal before they eat it',
                'Raise the animal they are going to eat'], a: 0,
      cue: '「in my opinion」のあと、目に関わる表現。',
      line: 'not enough people have *looked their dinner in the eyes*…',
      said: '「自分の夕食と目を合わせ、命のめぐりを考えた人が少なすぎる」と言う。',
      mean: '肉になる動物を自分の目で見るべきだ、という考え。',
      trap: 'circle of life から「育てる」話に取りやすいが、Ron が言うのは食べる前に向き合うこと。',
      use: 'Look me in the eye and say that.（目を見てそう言ってよ）' },

    // R fix: V2 (blind 70 %): "too cruel" was weak; now "what a silly name", a laugh with no one stung
    // why: cook him ← burn = 焼く, and it's a barbecue (literal); silly name ← the laugh is heard, but "burn" needs
    //   someone stung (the "Seriously?" answers it)
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'burn', seg: [109.0, 114.85],
      stem: 'Right after the pig’s name, what does the one-word shout mean?',
      choices: ['Ha, someone just got teased!', 'Ha, let’s start cooking him!', 'Ha, what a silly name for a pig!'], a: 0,
      cue: '名前を聞いた直後の一語と、返事の「Seriously?」。',
      line: 'His name is *Tom*. — Ha, ha, *burn!* — Seriously?',
      said: '豚の名前が Tom と聞いて、誰かが笑って「burn!」、別の人が「本気？」。',
      mean: 'burn! ＝「今のは効いたね」。誰かがからかわれた時のはやし言葉。',
      trap: 'バーベキューなので「焼く」と取りやすい。笑い声と Seriously? でからかいと分かる。',
      use: 'Ooh, burn! He got you there.（うわ、言われたね）' },

    // anchor: 109.4–118.6 s "His name is Tom" → "burn!" → "Seriously?" from another voice → Ron: "I understand that
    //   it's hilarious, but that is his given Christian name"; 163.4–165.4 s "Let's go, Tom. No, pig Tom." confirms a
    //   second Tom is there
    // R fix: V2 (blind 60 %): the key was the only choice that explained itself ("shares the pig's name"); all three
    //   are now bare targets
    // why: Ron ← right mechanism, wrong target: a man naming his dinner is funny, and Ron says "it's hilarious"; the
    //   pig ← right target type, wrong one: the name sounds odd on an animal, but "burn" needs someone who can be stung
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'burn', seg: [109.0, 118.95],
      stem: 'When someone shouts “burn!” after the pig’s name, who is the joke on?',
      choices: ['A coworker in the crowd', 'Ron, who named the pig', 'The pig, with its odd name'], a: 0,
      cue: '「Seriously?」と、Ron の「given name」の言い訳。',
      line: 'His name is Tom. — *burn!* — *Seriously?* — …that is his *given* Christian name.',
      said: '豚の名は Tom。誰かが burn! とはやし、一人が「本気？」。Ron は「元からの名だ」。',
      mean: '同じ名の同僚がいるので、豚の名が彼へのからかいになる。最後の pig Tom で確定。',
      trap: '名付けた Ron が笑われていると取りやすいが、Ron は命名を否定。はやし言葉は言い返した人へ。',
      use: 'No offense, Tom. I meant the dog.（悪気はないよ、トム。犬のことだよ）' },

    // R fix: V2 (blind 70 %): "mixes up… by mistake" was weak; all three now start "He praises it…"
    // why: sad to eat ← the praise ("smart… loyal") taken as Ron going soft; staff feel better ← the warm words heard
    //   as comfort for the "No, no, no" crowd
    { id: 'h3', skill: 'humor', level: 'C1', point: 'dog', seg: [118.75, 125.4],
      stem: 'Why does Ron’s description of the pig get a laugh?',
      choices: ['He praises it like a pet, then talks of eating it', 'He praises it so much he sounds sad to eat it',
                'He praises it to make the staff feel better'], a: 0,
      cue: '「basically a dog」のあと、もう一度 dog と言ってから。',
      line: 'Tom is very *smart* and incredibly *loyal*… A dog we’re going to *cook, chew, and swallow*.',
      said: '「賢くて忠実、ほぼ犬だ」とほめ、すぐ「料理してかんで飲み込む犬だ」と続ける。',
      mean: 'ペットのようにほめた直後に、平然と食べる話にする落差が笑い。',
      trap: 'ほめ言葉で情が移ったと取りやすいが、最後の三つの動詞で考えが変わっていないと分かる。',
      use: 'He’s basically family.（もう家族みたいなもんだ）' },

    // why: send away ← "Good point" heard as real agreement (the 同意 frame); out of sight ← the usual polite fix for
    //   "there's kids around"
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'kids', seg: [125.2, 131.95],
      stem: 'When someone warns Ron about the kids, how does Ron treat the warning?',
      choices: ['As a chance to get the kids to help', 'As a reason to send the kids away first',
                'As a reason to do it out of their sight'], a: 0,
      cue: '「Good point」のすぐあと、子どもに向けた言葉。',
      line: 'Dude, there’s *kids around* here! — *Good point.* Which one of you youngsters wants to *help me*…',
      said: '「子どもがいるよ」と言われ、「確かに」と答えて、子どもに血抜きの手伝いを募る。',
      mean: '「やめて」という注意を、「手伝える子がいる」という情報として受け取った。',
      trap: 'Good point で止めると思いやすい。次の言葉で、何に同意したかを確かめる。',
      use: 'Good point. I hadn’t thought of that.（確かに。それは考えてなかった）' },

    // predict: the segment stops after "…here, are you?"; then plays "Not to worry. I have a permit."
    // R fix: V2 (blind 65 %): "go ahead" was the only Ron-like choice; now a bare yes against a yes with a reason.
    //   S4: the segment was 2.9 s; it now starts at 135.25 s (after "fun")
    // why: elsewhere ← the tag "…here, are you?" invites "no, not here"; bare yes ← Ron's one-word "No." to the corn,
    //   expected again (refuted: he gives the permit as a reason)
    { id: 'pd2', skill: 'predict', level: 'B2', point: 'worry', seg: [135.25, 138.8], then: [138.8, 141.6],
      stem: 'After the question about slaughtering the pig here, what kind of reply comes?',
      choices: ['A calm reassurance with a reason it’s fine', 'A blunt “yes, I am” and nothing more',
                'A quick agreement to do it somewhere else'], a: 0,
      cue: 'Ron がここまで反対にどう返してきたか。',
      line: 'You’re not gonna slaughter that pig here, are you? — *Not to worry.* I have *a permit*.',
      said: '「ここで豚をつぶす気じゃないよね？」に、Ron は「心配ない。許可証がある」。',
      mean: 'やめるのではなく、やっていい理由を出して相手を安心させようとしている。',
      trap: '付加疑問は「いいえ」を期待する形だが、Ron は「やる、しかも許可済み」と返す。',
      use: 'Not to worry, I’ve got a spare key.（心配ない、合鍵があるから）' },

    // R fix: C5: the "since he has a permit" choice states pd2's key, so g2 reveals `worry`. C6: moved into clip order
    // why: goes ahead ← "I have a permit" is the confident line; called off ← "postponed" heard as cancelled
    { id: 'g2', skill: 'gist', level: 'B1', point: 'outcome', reveals: ['worry'], seg: [136.0, 166.2],
      stem: 'How does Ron’s plan for the pig end up?',
      choices: ['Ron backs down and goes to buy meat', 'Ron goes ahead, since he has a permit',
                'The barbecue is called off for good'], a: 0,
      cue: '「Fine」のあと、Ron の次の予定。',
      line: '*Fine.* Barbecue is *postponed* until I can go *pick up some meat*…',
      said: '法律違反だと言われ、Ron は「わかった」。肉を買うまでバーベキューは延期だ、と言う。',
      mean: 'postponed ＝ 延期。中止ではなく、買った肉でやり直す。',
      trap: 'permit で押し通すと思いやすいが、Fine で引き下がる。延期は中止ではない。',
      use: 'The meeting is postponed until Friday.（会議は金曜に延期です）' },

    // R fix: V2 (blind 60 %): the key was the only choice with a quote ("anything goes"); rewritten as plain clauses
    // why: wrong paperwork ← the usual sitcom twist (a barbecue permit, not a slaughter one); other park ← the same
    //   twist by place
    { id: 'h4', skill: 'humor', level: 'C1', point: 'permit', reveals: ['worry'], seg: [139.0, 145.55],
      stem: 'When someone reads Ron’s permit aloud, why does it get a laugh?',
      choices: ['It names no activity; it lets him do anything', 'It only covers a barbecue, not killing an animal',
                'It’s a permit for a different park in town'], a: 0,
      cue: '「This just says」のあと、許可証の中身。',
      line: 'Not to worry. I have a permit. — This *just says I can do what I want*.',
      said: '許可証を見た人が「これ、私は好きにしていい、と書いてあるだけ」と読み上げる。',
      mean: '何の許可にもなっていない紙を、Ron は許可証と呼んでいる。そのずれが笑い。',
      trap: '書類違いのオチを予想しやすいが、just says で中身が空っぽだと分かる。',
      use: 'This just says “no parking.”（これ「駐車禁止」って書いてあるだけ）' },

    // anchor: 143.2–149.3 s "This just says I can do what I want." → Ron: "I am the director of the Parks Department,
    //   and this is a park." (his own title is his only source) → 149.8–153.9 s "It's not a parks thing."
    // R fix: V2 (blind 65 %): reworded so the key no longer uses "permit" (the stem's word) on its own; U+FFFD in trap
    // why: the city ← scope shift: "permit" heard as one an office issued, the director title as the reason he got it;
    //   park land ← right words, wrong target: "this is a park" heard as the place being exempt, not him being in charge
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'permit', reveals: ['worry'], seg: [142.6, 154.6],
      stem: 'Which plain-English version keeps Ron’s defense of his permit?',
      choices: ['“I run the parks, so I can give myself the OK here.”', '“The city gave me this because I run the parks.”',
                '“This is park land, so city laws don’t reach it.”'], a: 0,
      cue: '「director」と「this is a park」をつなげて。',
      line: 'I am *the director* of the Parks Department, and *this is a park*.',
      said: '許可証は「好きにしていい」と書いてあるだけ、と言われ、Ron は「私は公園課長で、ここは公園だ」。',
      mean: '自分で自分に許可を出した、という理屈。責任者が自分の公園で許可したから有効、と言う。',
      trap: '許可証と聞くと市が出したと思いやすい。根拠が自分の肩書だけなら、自分で出した許可を疑う。',
      use: 'I’m the boss, so it’s fine.（責任者は私だから、いいの）' },

    // R fix: V2 (blind 75 %): "compares" was absurd; now the quotative like ("she was like…"), which learners know
    // why: quoting ← the quotative like ("and he was like…") applied here; exactly ← like heard as emphasis, the way
    //   "literally" was used earlier
    { id: 'm1', skill: 'marker', level: 'B2', point: 'like', reveals: ['codes'], seg: [149.7, 154.6],
      stem: 'In “It’s against like three laws”, what does “like” do?',
      choices: ['It marks the number as rough: about three', 'It shows the words are quoted from someone',
                'It stresses the number: three whole laws'], a: 0,
      cue: '数字の直前の、軽く短い一語。',
      line: 'It’s against *like* three laws and a dozen health codes.',
      said: '「法律三つくらいと、衛生規則十いくつに違反してる」と言う。',
      mean: '数字の前の like は「だいたい」。正確に数えたわけではない、というぼかし。',
      trap: 'like を「〜のような」と訳すと意味が通らない。数字の前なら about と同じ。',
      use: 'It took like two hours to get there.（行くのに2時間くらいかかった）' },

    // why: three ← the number said just before, for laws; twenty-four ← "a dozen" heard as "two dozen"
    { id: 'n1', skill: 'number', level: 'B2', point: 'codes', reveals: ['like'], seg: [149.7, 154.6], keep: true,
      stem: 'How many health codes does the coworker say the slaughter breaks?',
      choices: ['Three', 'Twelve', 'Twenty-four'], a: 1,
      cue: '「three laws」のあと、health codes の前。',
      line: 'It’s against like three laws and *a dozen* health codes.',
      said: '「法律三つくらいと、衛生規則 12 個に違反してる」と言う。',
      mean: 'a dozen ＝ 12。ここでは「たくさん」に近い、大まかな数。',
      trap: '直前の three に引かれやすい。a が two に聞こえると 24 になる。and のあとを聞く。',
      use: 'I’ve called a dozen times.（もう十回以上電話したよ）' },

    // anchor: 150.96–152.0 s "It's against like three laws" — both sources have "like"; five words run together,
    //   with a filler that grammar would drop
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'like', reveals: ['codes'], seg: [149.7, 154.6],
      stem: 'Type what the coworker says: “___ and a dozen health codes.” (5 words)',
      answer: "it's against like three laws",
      cue: '「parks thing」のあと。聞こえた語を全部。',
      line: '*It’s against like three laws* and a dozen health codes.',
      said: '「法律三つくらいと衛生規則十いくつに違反」。it’s against like が弱く、ひと続きに速い。',
      mean: '数字の前の like は「だいたい」のつなぎ言葉。なくても通じるが、会話では普通に入る。',
      trap: '文法に合わせて like を消したくなる。書き取りは、整った文でなく言われた音を書く。',
      use: 'There were like fifty people there.（50人くらいいた）' },
  ]
};
