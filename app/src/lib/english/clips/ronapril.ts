// “Ron Swanson has April Take Over for Leslie | Parks and Recreation” (the official Parks and Recreation channel,
// Season 4): Chris tells Ron the department needs a deputy while Leslie runs for council; Ron refuses, rushes Ann's
// water-fountain project to prove his point, learns April solved it, and talks her into picking up the slack.
// REVIEW 2026-11-16: pass 4, fix 19, drop 1, new 1; ear checks 2
// REVIEW open: i2 rests on whisper's “abhorrent”; if the ear hears “important”, i2 needs a rewrite (see EAR CHECK)
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈221 s. Untested: 18–25 s (“dismount”
// vs “just melt”), 122–126 s and 167–172 s (who says “Do you want the door open” and “Should I go?”).
// EAR CHECK: 62 s i2 — whisper “which is abhorrent to me”, captions “which is important to me”; the key rests on
//   “repulses me to my core” and the calves story, but the trap note assumes “abhorrent”
// EAR CHECK: 185.3–187.8 s nt3 — stress in “I want to not do things” falls on “not” (not on “want”)
import type { Clip } from '../types.ts';

export const ronAprilTakeOver: Clip = {
  id: 'ronapril', video: 'eEEbrWjVM7M', title: 'Ron Swanson has April Take Over for Leslie', dur: 236, wpm: 147,
  band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: blind 60 % (the only clever choice; "wiser" was a filler). All three now turn on literal vs figurative;
    //   seg start cut "doing" (→ 2.1)
    // why: misused "literally" ← the familiar complaint that people say "literally" loosely; Ron too literal ← right
    //   mechanism, wrong person: Ron's gym question heard as missing the figure of speech
    { id: 'h1', skill: 'humor', level: 'C1', point: 'perspective', seg: [2.1, 11.1],
      stem: 'Why is Chris’s reason for doing sit-ups upside down funny?',
      choices: ['A phrase that’s normally figurative is true for him', 'He uses “literally” for something that isn’t literal',
                'Ron takes his figure of speech far too literally'], a: 0,
      cue: '逆さまの体勢と、文の後半の言い回し。',
      line: 'it *literally* lets me see the world *from a different perspective*.',
      said: '逆さ腹筋は「文字どおり、違う視点で世界が見られる」と言う。',
      mean: '違う視点で、は普通は比喩。逆さの彼には本当に景色が逆に見えている。',
      trap: 'literally の誤用に聞こえるが、ここは正しい使い方。比喩が文字どおりになるのが笑い。',
      use: 'Try looking at it from a different angle.（別の角度から見てみて）' },

    // R fix: blind 55 % (the key was the only indirect choice; "unsafe" was a filler). Now a friendly-tip reading and
    //   a literal reading; seg start cut "different" (→ 9.95)
    // why: better place ← the Japanese frame of a kind suggestion (〜でやったら？ as advice); checking ← "Isn't there a
    //   men's gymnasium" taken as a real question (〜はありませんか)
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'gym', seg: [9.95, 18.6],
      stem: 'When Ron first reacts to the sit-ups, what is his question really doing?',
      choices: ['Getting Chris to stop doing it in here', 'Pointing Chris to a better place to train',
                'Checking whether the building has a gym'], a: 0,
      cue: '問いへのクリスの返事と、そのあとの申し出。',
      line: '*Isn’t there a men’s gymnasium* where you could do that? — …*I will stop* if it makes you feel uncomfortable.',
      said: '「男性用のジムでやれば？」に「世界がジムさ。でも嫌ならやめる」と返る。',
      mean: '場所を聞く形で「ここでやるな」と伝える遠回しな文句。相手もそう受け取った。',
      trap: 'Isn’t there…? を本当の質問と取りやすい。相手が「やめる」と返せば頼みだった。',
      use: 'Isn’t there somewhere else you could do that?（どこか別の所でやってくれない？）' },

    // R fix: blind 60 % ("cut to seven" was a filler, so the key was the only sensible plan). Now all three are
    //   about Leslie, with a council keyword trap
    // why: hire ← Chris does say he'll hire a deputy director, but Ron refuses; talk Leslie out ← "if she wins… City
    //   Council" heard as the problem Ron must solve
    { id: 'g1', skill: 'gist', level: 'B2', point: 'prove', reveals: ['deputy'], seg: [24.9, 58.95],
      stem: 'What does Ron end up having to do after talking with Chris?',
      choices: ['Prove his team can manage without Leslie', 'Hire a deputy to cover for Leslie',
                'Talk Leslie out of running for council'], a: 0,
      cue: 'ロンの「No!」のあと、クリスの短い返し。',
      line: 'The department is *doing fine without Leslie*. — Then *prove it*.',
      said: '補佐を雇う案をロンは断り、「レスリー抜きで平気」と言う。クリスは「なら証明して」と返す。',
      mean: 'prove it ＝ 口でなく結果で見せて。大きな事業を一つ終えることが条件になる。',
      trap: '雇う話はクリスの案で、ロンは断っている。誰の提案かを分けて聞く。',
      use: 'Okay, prove it.（じゃあ、証明してみせて）' },

    // why: ten ← the number a town this size "traditionally" has, said first; four ← "the work of four people", said
    //   soon after
    { id: 'n1', skill: 'number', level: 'B1', point: 'staff', seg: [24.9, 33.4],
      stem: 'How many employees does Ron’s department have now?',
      choices: ['Four', 'Seven', 'Ten'], a: 1, keep: true,
      cue: '「traditionally」の数と、そのあとの「only」。',
      line: 'traditionally has ten employees. You have *only seven*.',
      said: '「この規模の町なら普通は10人。君の所は7人だけ。なぜ？」と聞く。',
      mean: 'only が付くと「少ない」という評価になる。普通との差を問題にして、理由を聞いている。',
      trap: '最初の ten に引っぱられやすい。only の直後の数が今の数。',
      use: 'We only have two rooms left.（空き部屋は2つだけです）' },

    // R fix: blind 70 % (the Chris joke was off target, so the key stood out). The new near miss keeps "on purpose"
    //   and misses only "ineffective". Ear check removed: the key stands on the words
    // why: modest ← the 謙遜 frame: running down your own team in front of a boss; small but works ← right
    //   direction (on purpose), but drops "ineffective", the word that makes it a creed
    // anchor: 33.2–38 s "I work hard to make sure… as small and ineffective as possible": the effort is aimed at being
    //   small; 59–67 s to camera, a government project is hateful to him and a new person "repulses me to my core"
    // retired: one C2 alone is under 2 (nt3 retired)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'small', seg: [24.9, 38.1], retired: true,
      stem: 'Which plain-English version keeps what Ron means about his department?',
      choices: ['“I keep it weak on purpose, and I’m proud of it.”', '“I’m being modest; really, we work very hard.”',
                '“I keep it small on purpose, but it works well.”'], a: 0,
      cue: '「work hard」が、何に向けた努力か。',
      line: 'I *work hard to make sure* my department is *as small and ineffective as possible*.',
      said: '理由を聞かれ、「部署をできるだけ小さく、役立たずにするよう努力している」と答える。',
      mean: 'work hard to の向きが「小さく弱く」。政府は小さいほどいいという本気の信条。',
      trap: '謙遜や「小さくても有能」と取りやすいが、ineffective まで言う。逆向きの努力は本音。',
      use: 'I keep my weekends free on purpose.（週末はわざと空けてるんだ）' },

    // why: two ← "two" and the many weak "to"s nearby; seven ← the staff number from just before
    { id: 'n2', skill: 'number', level: 'B1', point: 'four', seg: [33.3, 44.45],
      stem: 'According to Chris, Leslie does the work of how many people?',
      choices: ['Two', 'Four', 'Seven'], a: 1, keep: true,
      cue: '「single-handedly」のあとの数。',
      line: 'Leslie Knope single-handedly does the work of *four* people',
      said: '「レスリーが一人で4人分の仕事をしているからだ」と言う。',
      mean: 'single-handedly ＝ 一人だけで。少ない人数で回るのは彼女のおかげ。',
      trap: 'of four は for にも聞こえる。直前の人数に引っぱられず、people の前を聞く。',
      use: 'She runs the shop single-handedly.（彼女は一人で店を回している）' },

    // R fix: blind 75 % (taking Leslie's council seat was absurd for a deputy). Now a campaign helper, a keyword trap
    // why: push staff ← "slack" heard as slacking (サボる); campaign ← "if she wins… City Council" is in the same turn,
    //   and a deputy helping a candidate sounds plausible
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'slack', seg: [42.35, 52],
      stem: 'Why does Chris say he’d need to hire a deputy director?',
      choices: ['To cover the work Leslie will have to drop', 'To help Leslie run her campaign for council',
                'To push the slower staff to work harder'], a: 0,
      cue: '「If she wins」から、文の最後のひとかたまり。',
      line: 'she’ll be *dividing her time*… hire a deputy director *to pick up the slack*.',
      said: '「当選したら兼務になる。穴を埋める副部長を雇わないと」と言う。',
      mean: 'pick up the slack ＝ 人が手放した分の仕事を引き受ける。レスリーの時間の穴埋め。',
      trap: 'slack を「サボる」と取ると見張り役に聞こえる。ここは、たるみを引き取る方。',
      use: 'I can pick up the slack this week.（今週は私が穴を埋めるよ）' },

    // R fix: blind 60 % (the key quoted Ron's later "bring a new person into the department"; the council choice was
    //   weak). Key reworded; a "scaled back her time" keyword trap replaces council
    // why: cutting back ← "she's already scaled back her time" is said in the same turn; credit ← "doing fine without
    //   Leslie" heard as pushing back on the praise of Leslie
    { id: 'i1', skill: 'infer', level: 'B2', point: 'deputy', seg: [44.45, 56.35],
      stem: 'What is Ron objecting to when he cuts in on Chris?',
      choices: ['Adding a new person to his staff', 'Leslie cutting back her hours at work',
                'Chris giving Leslie all the credit'], a: 0,
      cue: '「No!」の直前に、クリスが言った案。',
      line: 'I’m going to have to *hire a deputy director*… — *No!* Chris, that’s unnecessary.',
      said: '「副部長を雇わないと」の直後に「だめだ！不要だ」と言う。',
      mean: 'No! は直前の「雇う」に向いている。人を増やしたくないので、今のままで平気と言い張る。',
      trap: '後ろに Leslie が出るので、彼女の話への反対に聞こえやすい。No は直前の提案に返る。',
      use: 'No need. We’ve got it covered.（大丈夫、こっちで何とかする）' },

    // R fix: S4/C1 — seg was 19.6 s; it now ends after "…with my own hands for my sixth birthday" (→ 58.9–73.55).
    //   Choices pass (blind 45 %)
    // why: one worse ← the first option's last word heard as "important" (the captions' version), so the project
    //   sounds welcome; someone else ← "my dad made me choose" heard as the dad doing the choosing
    // retired: the ear check: the key rests on whisper’s “abhorrent”; the captions’ “important” makes the near miss right
    { id: 'i2', skill: 'infer', level: 'B2', point: 'choice', seg: [58.9, 73.55], retired: true,
      stem: 'In his comment to the camera, what does Ron’s childhood story say about his options?',
      choices: ['Both of them feel equally awful to him', 'One of them is clearly worse than the other',
                'He’ll let someone else make the choice'], a: 0,
      cue: '二つの案それぞれのあとの言葉と、子牛の話。',
      line: 'which *repulses me to my core*. It reminds me of when my dad made me *choose which of my pet calves*…',
      said: '人を増やす案は「心底ぞっとする」と言い、父にペットの子牛のどちらかを選ばされた話を始める。',
      mean: 'どちらも嫌な二択の例えを持ち出している。二つの案は、彼には同じくらいつらい。',
      trap: '最初の案のあとの語は聞き取りにくい。例え話が来たら二つの重さを比べる。',
      use: 'It’s like choosing between two bad options.（どっちも嫌な二択みたいなもの）' },

    // R fix: blind 60 % (two fillers). Now a self-mocking reading and a sincere sad one, parallel in form; seg was
    //   15.3 s (end → 81.7)
    // why: indecisive ← "I couldn't choose" heard as the punch line, a self-deprecating joke; sad ← "slaughtered both"
    //   heard as the end, so the story sounds like grief
    { id: 'h2', skill: 'humor', level: 'C1', point: 'calves', seg: [66.75, 81.7],
      stem: 'Why does the very end of Ron’s birthday story get a laugh?',
      choices: ['He sounds pleased with how it all ended', 'He mocks himself for being so indecisive',
                'He sounds sad that he lost both calves'], a: 0,
      cue: '長い間のあとの、最後の一言。',
      line: 'I couldn’t choose, so I *slaughtered both* of them. … And they were *delicious*.',
      said: '「選べなかったので2頭とも殺した」と言い、間をおいて「おいしかった」と付け足す。',
      mean: '悲しい思い出が満足げな一言で終わる。ロンらしい割り切りが笑いになる。',
      trap: '子どもの頃のつらい話は、悲しみや自虐で終わると予想しやすい。最後の一言が話の向きを決める。',
      use: 'Long story short, it worked out.（結局、うまくいったんだ）' },

    // R fix: blind 50 % (the key was the only knowing choice). The teasing filler is now a sincere reading; seg was
    //   0.1 s before "Hello" and cut "friends" (→ 81.6–89.1)
    // why: apology ← "Nonsense" right after her remark heard as "sorry, my mistake"; truly a friend ← "close friends"
    //   taken at face value
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'friends', seg: [81.6, 89.1],
      stem: 'When Ann remarks on how Ron greets her, what is his answer doing?',
      choices: ['Acting friendlier with her than he really is', 'Apologizing for getting her name wrong before',
                'Showing he truly thinks of her as a friend'], a: 0,
      cue: 'アンの驚きと、ロンの返事の大きさの差。',
      line: 'It’s the *first time* you’ve said my entire name correctly. — *Nonsense. We are close friends.*',
      said: '「フルネームを正しく呼ばれたのは初めて」に「何を言う。親友だろう」。',
      mean: '名前も怪しかった相手を「親友」と呼ぶのは言いすぎ。用件の前に急に距離を詰めている。',
      trap: 'Nonsense を謝りと取りやすいが、指摘を打ち消すだけ。大げさな語は関係と比べる。',
      use: 'Hey, buddy! Got a minute?（よう、相棒！ちょっといい？）' },

    // R fix: blind 70 % (the gym choice was a filler). Now "repairing" the fountains, which misses only "hygiene";
    //   seg started inside "friends" (→ 89.0)
    // why: repairing ← "water fountain… upgrade" heard without "hygiene"; hand washing ← "hygiene" heard alone
    //   (衛生＝手洗い)
    { id: 'd2', skill: 'detail', level: 'B1', point: 'fountain', seg: [89.0, 94.55],
      stem: 'What project does Ron make the top priority?',
      choices: ['Making the water fountains cleaner', 'Repairing the broken water fountains',
                'Getting staff to wash their hands more'], a: 0,
      cue: '「good news」のあと、何を一番にするか。',
      line: 'I’m making the *water fountain* hygiene upgrade our number-one priority.',
      said: '「いい知らせだ。水飲み場の衛生改善を最優先にする」と言う。',
      mean: 'number-one priority ＝ 最優先。アンの事業を急に一番にしている。',
      trap: 'hygiene を落とすと修理、hygiene だけだと手洗いに聞こえる。名詞は丸ごと聞く。',
      use: 'Safety is our number-one priority.（安全が最優先です）' },

    // R fix: blind 75 % (long lines was a filler). Now "kiss", which Ann says next, used in the wrong relation
    // why: bottles ← "spout" plus the everyday use of a fountain; kiss ← "Kiss one water fountain drinker…" follows,
    //   and "weird, disgusting local quirk" invites a social habit
    { id: 'd3', skill: 'detail', level: 'B1', point: 'spouts', seg: [94.5, 105.98],
      stem: 'According to Ann, what do people in Pawnee do at water fountains?',
      choices: ['Put their mouths right over the spout', 'Fill their own bottles from the spout',
                'Kiss each other right by the fountain'], a: 0,
      cue: '「For some reason」のあとの動作。',
      line: 'they *put their mouths completely over the spouts*.',
      said: '「なぜかポーニーの人は、飲み口を口で完全に覆って飲む」と説明する。',
      mean: '口をつけて飲むので、一人とキスすれば町中とキスしたのと同じ、と続く。',
      trap: 'spout だけでは水の出口の話。put their mouths over の動きまで聞く。',
      use: 'For some reason, it keeps happening.（なぜか、いつもそうなるの）' },

    // R fix: blind 60 % (§9.5: "I like to complete this project by tomorrow" isn't a real option). Now three
    //   grammatical forms
    // why: We'd like ← /aɪd/ and /wid/ are close when the vowel is short; I'd love ← "I'd l-" shared, only the end
    //   differs
    { id: 's1', skill: 'sound', level: 'B2', point: 'idlike', seg: [111.4, 117],
      stem: 'Fill the gap: “___ to complete this project by tomorrow.”',
      choices: ['I’d like', 'I’d love', 'We’d like'], a: 0,
      cue: '文の頭の2語。I のすぐあとに注目。',
      line: '*I’d like* to complete this project by tomorrow.',
      said: '「この事業を明日までに終わらせたい」と言う。',
      mean: 'I’d like to ＝ 〜したい。d は次の l に飲まれ「アイライク」に近い。',
      trap: 'like と love は語尾、I’d と We’d は頭の音の差。弱い頭と語尾を聞く。',
      use: 'I’d like to check out, please.（チェックアウトをお願いします）' },

    // R fix: blind 65 % (the meeting choice was a filler). Now "take Leslie's desk" heard as taking her job; seg end
    //   cut "Great" (→ 122.4)
    // why: stand ← "shop" taken literally (店); Leslie's job ← "take Leslie's desk" is said, read as her role
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'shop', seg: [116.9, 122.4],
      stem: 'Right after Ann’s quiet “Oh,” what does Ron invite her to do?',
      choices: ['Work on the project from their office', 'Take over Leslie’s job in their office',
                'Open a small stand in their office'], a: 0,
      cue: '「Oh」のすぐあとの命令文。',
      line: '*Set up shop* in our office. In fact, take Leslie’s desk.',
      said: '「うちのオフィスに陣取って。何ならレスリーの机を」と言う。',
      mean: 'set up shop ＝ 仕事の拠点を構える。店でなく、そこで作業していいということ。',
      trap: 'shop を「店」、desk を「役職」と取りやすい。ここは作業場所の話。',
      use: 'Feel free to set up shop here.（ここを自由に使って作業していいよ）' },

    // R fix: blind 70 % (shy was a filler). Now a near miss on indifference: not caring vs not wanting to seem to care
    // why: reward ← the usual reason for passing credit to a boss; no big deal ← "she doesn't… care" caught without
    //   "want you to think" and "actually"
    { id: 'd4', skill: 'detail', level: 'B1', point: 'credit', reveals: ['begged'], seg: [142.45, 153.5],
      stem: 'According to Ron, why did April give him the credit?',
      choices: ['She doesn’t want to seem like she cares', 'She hopes Ron will reward her for it later',
                'She didn’t think the fix was a big deal'], a: 0,
      cue: '「Because she’s April」のあと。',
      line: 'she doesn’t want you to think that she *actually cares* about something.',
      said: '「エイプリルだからさ。本気で気にかけていると思われたくないんだ」',
      mean: 'actually cares ＝ 本当に大事に思う。熱心に見られたくない彼女。',
      trap: '手柄を譲るのは見返りか無関心と考えやすい。want you to think まで聞く。',
      use: 'He acts cool, but he actually cares.（クールぶってるけど、本当は気にしてる）' },

    // why: too difficult ← the insult heard as the verdict; for now ← "fill in for Leslie" heard as a stopgap
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'answer', seg: [153.3, 160.55],
      stem: 'What is Ron’s overall view of April as Leslie’s fill-in?',
      choices: ['Difficult, but clearly the right person', 'Too difficult to be worth considering',
                'Fine for now, until someone better comes'], a: 0,
      cue: '悪口のあとに続く、後半の言葉。',
      line: 'April’s a pain…, *but she’s clearly the answer*.',
      said: '「レスリーの穴埋めを探すなら、エイプリルは厄介だが、明らかに彼女が答えだ」と言う。',
      mean: '悪口は前置きで、but のあとが本題。厄介さを認めたうえで強く推している。',
      trap: 'きつい言葉が先に来ると、反対に聞こえやすい。英語は but のあとに本音が来る。',
      use: 'It’s a long drive, but it’s worth it.（遠いけど、行く価値はある）' },

    // R fix: blind 55 % (the key was the only kind choice). All three now praise her, then differ in the move; seg
    //   start only 0.1 s before "Nice" (→ 174.6). "Praises" gives away h3's pride, so reveals taught
    // why: orders ← "I'm asking you to step up" heard as an order from the boss; raise ← the usual workplace script
    //   for getting someone to take on more
    { id: 'g2', skill: 'gist', level: 'B1', point: 'please', reveals: ['rather', 'begged', 'taught'], seg: [174.6, 210.4],
      stem: 'In the last scene, how does Ron get April to agree?',
      choices: ['He praises her, then pleads for her help', 'He praises her, then orders her to help',
                'He praises her, then offers her a raise'], a: 0,
      cue: '最後の頼み方と、エイプリルの返事。',
      line: 'right now the department *needs you*. *Please*.',
      said: '働きたくないと言う彼女に「今は部署に君が要る。頼む」と言い、彼女は引き受ける。',
      mean: '命令せず、認めてから頼む。ロンの Please は強いお願い。',
      trap: '上司なので命令と思いやすいが、言葉は asking と please。頼み方は動詞で聞き分ける。',
      use: 'We really need you on this. Please.（どうしても君が必要なんだ。頼む）' },

    // R fix: blind 50 % ("exactly" cued a nuanced key; "take credit" is defensible after "Don't deny it"). Now a
    //   share of the work vs the whole job vs the finished fountain; seg start → 174.6
    // why: take over ← the clip's own title and the usual "fill in" script, and "Leslie" is said right after; fountain
    //   ← "Nice job on the water fountain" opens the scene, but that job is done
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'stepup', seg: [174.6, 185.3],
      stem: 'In the last scene, what is Ron asking April to do?',
      choices: ['Take on a share of Leslie’s work', 'Take over Leslie’s job while she’s away',
                'Run the water fountain project'], a: 0,
      cue: '「I’m asking you to」のあと、続く打ち消しも。',
      line: 'I’m asking you to *step up*. *Not replacing Leslie*.',
      said: '「一歩前に出てほしい。レスリーの代わりじゃない」と頼む。',
      mean: 'step up ＝ 進んで責任を引き受ける。後任ではなく、仕事を少し多く持つということ。',
      trap: '直後に Leslie が出るので「代わり」と取りやすい。not のついた語は、頼みの外。',
      use: 'Someone needs to step up and lead.（誰かが進んでまとめ役をしないと）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'notdo', seg: [184.9, 189.85],
      stem: 'Type what April says next: “I want ___ things.” (3 words)', answer: 'to not do',
      cue: '「I don’t want to do things」の言いかえ。',
      line: 'I don’t want to do things. I want *to not do* things.',
      said: '「したくないんじゃない。何もしないことをしたいの」。',
      mean: 'not を to のあとに置くと「しない」こと自体が目的になる。言い直して強めている。',
      trap: '習った not to do に直したくなる。to not do も会話でよく言う。聞こえた順に書く。',
      use: 'I try to not think about it.（考えないようにしてる）' },

    // R drop: nt2 (C5; blind 70 %). Its key (she follows his lead, he is proud) is h3's key and adds no step, and the
    //   only other readings of April's dry line (teasing, played along) are defensible, so it can't be made one-key.
    //   Deleted (never shipped); the stray mis-encoded character in its notes went with it
    // R new: nt3, the C2 replacement (stress, word contrast). Blind read: 40 %. Shares x1's point
    // why: want ← the first sentence's "don't want" invites contrast on "want", heard as insistence; do ← the verb is
    //   repeated, and a learner expects the stress on the content word
    // anchor: 185.3–187.8 s "I don't want to do things. I want to not do things.": the only new word in the restatement
    //   is "not", moved after "to"; the second "want" repeats, so it isn't the contrast
    // retired: C2 stress item, until the ear check (the stress on “not”)
    { id: 'nt3', skill: 'sound', level: 'C2', point: 'notdo', seg: [184.9, 189.85], retired: true,
      stem: 'After “I don’t want to do things,” where does April’s stress fall, and why?',
      choices: ['On “not”, to set it against her first “do”', 'On “want”, to stress how much she wants it',
                'On “do”, to repeat the verb from before'], a: 0,
      cue: '一つ目の文と比べて、二つ目で動いた語。',
      line: 'I don’t want to do things. I want to *not* do things.',
      said: '「したいことがないんじゃない。しないことがしたいの」。2文目は not を強く言う。',
      mean: '言い直しでは、前の文から動いた語に強勢が来る。対比の強勢は「は」に近く、「やらない」を選ぶ宣言。',
      trap: 'want を強めると「すごくしたい」になる。言い直しでは、くり返す語は弱く、動いた語が強い。',
      use: 'I’m not tired. I’m bored.（疲れてるんじゃなくて、退屈なの）' },

    // R fix: blind 65 % (the key was the only one with a twist). Now three parallel feelings about the same lesson
    // why: sorry ← the expected boss line after "you taught me" (悪い手本を反省); annoyed ← she is using his lesson to
    //   say no, and the "But…" that follows heard as the reply itself
    { id: 'h3', skill: 'humor', level: 'C1', point: 'taught', seg: [185.2, 191.05],
      stem: 'Why is Ron’s first reply to April here funny?',
      choices: ['He’s proud he taught her to avoid work', 'He’s sorry he taught her to avoid work',
                'He’s annoyed she turns his lessons on him'], a: 0,
      cue: '前の言葉への、ロンの最初の5語。',
      line: 'Just like you taught me. — *And I taught you well.*',
      said: '「あなたに教わったとおり」と言われ、「そして、よく教えた」と返す。',
      mean: '働かないことを教えたのを誇っている。上司なら叱る場面で、胸を張るのがおかしい。',
      trap: 'このあとの But から説得が始まるので、反省や不満に聞きやすい。最初の一言で向きが分かる。',
      use: 'I taught you well.（さすが私の弟子だ）' },

    // R fix: blind 60 % (the "not smart" choice contradicted "too smart"). Now a promotion reading, built on "too smart
    //   to stay my assistant"
    // why: farm now ← "use your hands to farm" is said, but "right now the department needs you" follows; move up ←
    //   "too smart to stay my assistant here forever" heard as a push for promotion
    { id: 'i3', skill: 'infer', level: 'B2', point: 'rather', seg: [189.85, 202.3],
      stem: 'What does Ron’s “I’d rather…” line show about April’s current job?',
      choices: ['He’d like her to leave government one day', 'He wants her to quit and farm right away',
                'He’d like her to move up in government'], a: 0,
      cue: '「rather」のあとと、そのあとの「But right now」。',
      line: 'I’d *rather* you start a business, or use your hands to farm. *But right now* the department needs you.',
      said: '「むしろ起業か農業を。でも今は君が要る」。',
      mean: 'I’d rather you ～ ＝ できれば〜してほしい。役所は勧めないが、今は頼む。',
      trap: 'farm で「今すぐ辞めろ」、too smart で「昇進」と取りやすい。rather と But を聞く。',
      use: 'I’d rather you stayed home tonight.（今夜はできれば家にいてほしい）' },

    // R fix: blind 75 % (the key was the only face-saving choice; "forced" was weak). Now "only" read as a limit on
    //   scope. The line drops the disputed "you/he", so the ear check is gone: the key holds either way
    // why: unsure ← "But only…" heard as a hedge (日本語の「一応」); limits ← "only" taken as 〜だけ, a cap on the work
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'begged', seg: [203.1, 210.4],
      stem: 'When April agrees, what does her added condition do?',
      choices: ['Lets her say yes without looking keen', 'Shows she still isn’t sure about it',
                'Limits how much work she agrees to do'], a: 0,
      cue: '「Okay」のあと、but で足した理由。',
      line: 'Please. — Okay. *But only because*… *begged*.',
      said: '「頼む」に「いいよ。でも、泣きつかれたからだからね」と返す。',
      mean: 'すぐ Okay と言い、理由は相手のせいにする。乗り気に見られたくない照れ隠し。',
      trap: 'but を迷い、only を「〜だけ」と取りやすい。only は理由にかかる。',
      use: 'Fine, but only because it’s you.（いいよ、君だから特別ね）' },
  ]
};
