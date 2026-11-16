// REVIEW 2026-11-16: pass 7, fix 15, drop 0, new 0; ear checks 1
// “Leslie pleads guilty (and Chris is mad about it) | Parks and Recreation” (the official Parks and Recreation channel,
// Season 6): at an ethics hearing Leslie admits breaking Chris's dating rule but nothing more; Chris says he will call
// 14 witnesses and suspects more; in the break she hands out jobs to fight back, and ends on a word to camera.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 180 s; whisper's "I'll see you next
// time" after that is a loop. Untested on purpose: 123.1 s ("Here you go, boss", captions "here we go"), 129.5 s (the
// helper is "Andy" in whisper, "and" in the captions, so he's never named), 147–149.5 s and 157.2 s (who offers to go
// along), 174.3–177.2 s (whisper has "a frozen whore", the captions drop the word). Speakers are settled by "Ms. Knope",
// "Mr. Traeger", "It's not my rule, Leslie", "Ron, Chris has 14 witnesses" and "Ann?"; the hearing's questioner is
// never named and is called "the questioner".
// EAR CHECK: 96.4 s nt3 — the stress in “It's not my rule, Leslie” falls on “my” (contrast with her “your rule”),
//   not on “not” or “rule” (ship only once confirmed)
import type { Clip } from '../types.ts';

export const lesliePleads: Clip = {
  id: 'lesliepleads', video: 'sD2ADITXV6g', title: 'Leslie pleads guilty (and Chris is mad about it)', dur: 200,
  wpm: 172, band: 'fast', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    { id: 'x1', skill: 'dict', level: 'B2', point: 'wouldyou', seg: [9.7, 12.4],
      stem: 'Type the question: “___ to make a statement at this time?” (3 words)', answer: 'would you like',
      cue: '質問の最初、つながって短く聞こえる3語。',
      line: '*Would you like* to make a statement at this time?',
      said: '「この場で何か述べますか」と丁寧にたずねる。',
      mean: 'Would you が「ウッジュ」とつながる。人に何かを勧める丁寧な定番の形。',
      trap: 'd と you が一つの音になり、Do you like に聞こえやすい。最初の弱い音も数える。',
      use: 'Would you like to sit down?（おかけになりますか）' },

    // R fix: V2, blind 70 % right; the title ("pleads guilty") made the only rule-breaking choice the key. All three
    //   are now broken rules.
    // why: city law ← the opening's "municipal rules or laws", with "Chris's rule" missed; hiding it ← "cover up" from
    //   the last question pulled in
    { id: 'd1', skill: 'detail', level: 'B1', point: 'notfight', seg: [12.5, 23.3],
      stem: 'In her statement, which charge does Leslie say she won’t fight?',
      choices: ['Breaking Chris’s rule by dating her boss', 'Breaking a city law by dating her boss',
                'Breaking Chris’s rule by hiding the relationship'], a: 0,
      cue: '「freely admit」のあと、charges に続く部分。',
      line: 'I will not be fighting the charges that we *violated Chris’s rule*. But we did nothing else wrong…',
      said: '関係を認め、クリスの規則に違反した点は争わない、と述べる。',
      mean: 'violate ＝ 破る。認めるのはこの一点だけ、と続ける。',
      trap: '冒頭の rules or laws や cover up と混ざりやすい。認めたのは Chris’s rule だけ。',
      use: 'I won’t fight the parking ticket.（駐車違反には異議を言いません）' },

    // R fix: V2, blind 65 % right; the key was the only specific clash. All three now start "She admits one rule" and
    //   differ in what Chris wants.
    // why: unjust ← "felt the law unjust" in her story + "your rule / not my rule" heard as Chris doubting the rule;
    //   Ben ← "Ben Wyatt, whose hearing will be held tomorrow"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'conflict', reveals: ['notfight', 'accuse'],
      seg: [12.5, 121],
      stem: 'What is the main disagreement in the hearing?',
      choices: ['She admits one rule; Chris suspects lies and bribery',
                'She admits one rule; Chris wants Ben punished too',
                'She admits one rule; Chris calls the rule unjust'], a: 0,
      cue: '前半のレスリーの発言と、後半のクリスの言い分。',
      said: 'レスリーは規則違反だけを認める。クリスは交際の時期、特別扱い、わいろまで疑う。',
      mean: '認めた一点と、疑われている多くの点のずれが、この場面の対立になっている。',
      trap: '昔の話の「法は不当」から、規則が不公平という話に聞こえやすい。クリスは大事な規則だと言う。',
      use: 'We agree on that, not the rest.（そこは同じ意見、ほかは違う）' },

    // why: now ← not's t drops, leaving a vowel like "now" (and the meaning flips); won't ← same meaning, contracted;
    //   still ← "will" plus a weak syllable heard as filling the gap
    { id: 's1', skill: 'sound', level: 'B2', point: 'notfight', seg: [15.5, 20.3],
      stem: 'Fill the gap: “and I ___ fighting the charges…”',
      choices: ['will not be', 'will now be', 'won’t be', 'will still be'], a: 0,
      cue: 'charges の前、弱い語の中の短い一語。',
      line: 'and I *will not be* fighting the charges',
      said: '「その件では争いません」。will not を縮めずに言う。',
      mean: 'not の t はほぼ聞こえず「ナッ」で止まる。縮めない形は、きっぱりした宣言。',
      trap: 't が消えると now に近く、逆の意味になる。直後の But で確かめる。',
      use: 'I will not be taking questions.（質問はお受けしません）' },

    // anchor: 29.5–35.7 s "Although she felt the law unjust, she acknowledged that she had broken it, and she nobly
    //   accepted her punishment" → 39.9–43.6 s "That's how I feel": the story's woman is her stand-in
    // R fix: V2, blind 60 % right; the title ("pleads guilty") ruled out the "fight" choice. All three now accept
    //   the punishment and differ in one dimension (direction, scope).
    // why: fair ← right target, wrong direction: "nobly accepted her punishment" heard as agreeing she deserves it;
    //   unfair to Ben ← scope shift: Ben's hearing "tomorrow" pulled in, though "That's how I feel" is about herself
    // retired: with nt3 out, one C2 alone is under 2; back with nt3 after its ear check
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'story', seg: [28.95, 43.9], retired: true,
      stem: 'Through her 1849 story, what is Leslie hinting about Chris’s rule?',
      choices: ['That it’s unfair, but she’ll accept her punishment', 'That it’s fair, and she’ll accept her punishment',
                'That it’s unfair to Ben, but she’ll accept it'], a: 0,
      cue: '「Although」で始まる文と、最後の「That’s how I feel」。',
      line: '*Although she felt the law unjust*… she nobly accepted her punishment… *That’s how I feel.*',
      said: '法を不当と感じつつ罰を受け入れた1849年の女性の話をして、「私も同じ気持ち」と言う。',
      mean: 'ひじを見せた程度の罪の話と重ね、クリスの規則もばかげていると、口に出さずに言う。受け入れる姿勢は見せたまま。',
      trap: '「罰を受け入れた」だけでは「自分が悪い」に聞こえる。本音は Although の節。',
      use: 'It’s silly, but rules are rules.（ばかげてるけど、規則は規則）' },

    // why: watch ← "Little League tournament" heard without "bid for"; coach ← a team + tournament script
    { id: 'd2', skill: 'detail', level: 'B1', point: 'trip', seg: [48.4, 55.0],
      stem: 'Why did Leslie and Ben drive to Indianapolis?',
      choices: ['To try to host a state tournament', 'To watch a state Little League game',
                'To coach a team in a tournament'], a: 0,
      cue: '「Indianapolis」のすぐあと、to で始まる目的。',
      line: 'Ben and I drove to Indianapolis *to bid for* the state Little League tournament.',
      said: 'ベンと二人で、州の少年野球大会の誘致に行った。',
      mean: 'bid for ＝ 名乗りを上げる・入札する。遊びでなく仕事の出張だという説明。',
      trap: 'Little League だけ残ると、試合を見に行った話に聞こえる。直前の bid が要。',
      use: 'Our city is bidding for the Olympics.（うちの市が五輪の誘致に名乗りを上げている）' },

    // R fix: V2, blind 65 % right; "annoyed" had no support. A pride reading of "It was excellent" replaces it.
    // why: calm ← her "totally zen" claim just before; proud ← "It was excellent" heard as a happy boast, without
    //   "I'm sorry. I'm nervous."
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'nervous', seg: [54.9, 65.0],
      stem: 'Once the questions start, how does Leslie come across?',
      choices: ['Nervous, and saying more than she needs to', 'Calm, and answering only what is asked',
                'Proud, and showing off how happy she is'], a: 0,
      cue: '答えたあと、注意されてからの短い返事。',
      line: 'It was excellent. — That was unnecessary to add. — I’m sorry. *I’m nervous.*',
      said: 'キスの話に「最高だった」と付け足し、注意されて「すみません、緊張してて」と謝る。',
      mean: '聞かれていないことまで話すのは緊張のサイン。本人も認めている。',
      trap: '直前の「落ち着いてる」や excellent の明るさに引かれやすい。あとの本人の言葉で確かめる。',
      use: 'Sorry, I ramble when I’m nervous.（ごめん、緊張するとしゃべりすぎるの）' },

    // R fix: V2, blind 65 % right; the key was the only one with a "not X" contrast. The confession reading is now a
    //   near miss (admits, then backs off).
    // why: backs off ← "I received…" heard as a confession, and "No." as taking it back; favors for Ben ← right
    //   topic, wrong direction: "received" heard as what she gave
    { id: 'h1', skill: 'humor', level: 'C1', point: 'nicknames', seg: [65.0, 77.2],
      stem: 'Why does Leslie’s answer about special treatment get a laugh?',
      choices: ['She answers about Ben as a boyfriend, not a boss',
                'She admits Ben favored her at work, then backs off',
                'She lists the favors she did for Ben at work'], a: 0,
      cue: '答えたあとの「Oh」から始まる一言。',
      line: 'I received *adorable nicknames* and amazing back rubs. *Oh, you mean professionally?* No.',
      said: '「かわいいあだ名と最高のマッサージを。あ、仕事の上で？それはないです」。',
      mean: '仕事上の特別扱いを聞かれ、恋人としての扱いを答えてしまう。そのずれが笑い。',
      trap: '「もらった」の部分だけでは、不利な告白に聞こえる。Oh のあとの言い直しまで聞く。',
      use: 'Oh, you mean at work? Then no.（あ、仕事でってこと？ならないです）' },

    // why: start ← "cover up" missed, "relationship" heard; lied ← hiding read as lying to the hearing itself
    { id: 'f3', skill: 'phrase', level: 'B1', point: 'coverup', seg: [77.0, 84.9],
      stem: 'What does the last question ask whether Leslie did?',
      choices: ['Broke a law to hide the relationship', 'Broke a law to start the relationship',
                'Lied to the board about the relationship'], a: 0,
      cue: '「in an effort to」のあとの2語。',
      line: 'did you break any local, state, or federal law in an effort to *cover up* your relationship…?',
      said: '関係を隠すために法律を破ったか、と聞かれ、「絶対にない」と答える。',
      mean: 'cover up ＝ 隠す・もみ消す。悪いことを隠すときによく使う。',
      trap: 'cover を「補う」と取ると意味がつながらない。up が付くと「すっかり隠す」。',
      use: 'They tried to cover up the mistake.（ミスをもみ消そうとした）' },

    // why: 40 ← -teen/-ty swap; 4 ← "four" heard, the weak -teen missed
    { id: 'n1', skill: 'number', level: 'B1', point: 'fourteen', seg: [87.2, 94.05], keep: true,
      stem: 'How many witnesses is Chris going to call?',
      choices: ['4', '14', '40'], a: 1,
      cue: '「witnesses」の直前と、聞き返す一語。',
      line: 'you’re going to be calling *14* witnesses… — *14?* Why so many?',
      said: '証人14人と確認され、「14人？どうしてそんなに？」と聞き返す。',
      mean: '-teen は後ろに強勢があり、のびて聞こえる。聞き返しでもう一度確かめられる。',
      trap: 'forty の -ty は短く弱く、最初に強勢がある。fourteen は「ティーン」と長い。',
      use: 'Sorry, was that fourteen or forty?（すみません、14？それとも40？）' },

    // anchor: 94.6–96.2 s "I broke your rule" → 96.4–101 s "It's not my rule, Leslie. It is an important rule that
    //   exists in every government"
    // R fix: V2/K6, blind 65 % right; the key was the only choice quoting Leslie. All three now name the word of hers
    //   they answer.
    // why: on "rule" ← a stress on the noun heard as "it's more than a rule", against "It is an important rule"; on
    //   "not" ← the denial pattern learners know from arguments, though he denies only whose rule it is
    // retired: a C2 stress item, until its ear check (the stress on “my”, 96.4 s)
    { id: 'nt3', skill: 'sound', level: 'C2', point: 'myrule', seg: [93.6, 101.3], retired: true,
      stem: 'In “It’s not my rule, Leslie”, where is the stress, and why?',
      choices: ['On “my”: whose rule it is, against her “your”', 'On “not”: a firm no, against her “admitted”',
                'On “rule”: more than a rule, against her “rule”'], a: 0,
      cue: '短い否定文の中で、いちばん強く長い一語。',
      line: 'I broke *your* rule. — It’s not *my* rule, Leslie. It is an important rule…',
      said: '「あなたの規則を破った」と言われ、クリスは「私の規則じゃない、どの政府にもある大事な規則だ」と返す。',
      mean: 'my を強めると、相手の your への対比になる。日本語の「私の“では”ない」に近い。',
      trap: 'not を強めると、ただの強い否定に聞こえる。強勢は、相手のどの語に答えるかで決まる。',
      use: 'It’s not my idea. It’s the boss’s.（私の案じゃない。上司のだよ）' },

    // R fix: V2, blind 55 % right; the honesty distractor was weak. A scope shift ("this office" vs "every
    //   government") replaces it.
    // why: insulted ← "your rule" taken at face value (a literal reading); this office ← scope shift, "every
    //   government" missed
    { id: 'i1', skill: 'infer', level: 'B2', point: 'myrule', seg: [93.6, 107.2],
      stem: 'What does Chris’s answer show about why he is pressing the case?',
      choices: ['He sees it as a rule any government needs', 'He takes it personally, since the rule is his',
                'He sees it as a rule this office especially needs'], a: 0,
      cue: '「Leslie」と呼んだあと、規則について説明する部分。',
      line: 'It’s not my rule, Leslie. It is an *important rule that exists in every government*.',
      said: '「私個人の規則ではない、どの政府にもある大事な規則だ」と言う。',
      mean: '個人的な恨みでなく、原則の問題として追っているという立場。',
      trap: 'your rule をそのまま受け取ると、自分の規則にこだわる人に聞こえる。本人は否定している。',
      use: 'It’s nothing personal. It’s policy.（個人的な話じゃなくて、決まりなんだ）' },

    // R fix: V2, blind 55 % right; a "began when she says" choice (the partial listener's agreement) replaces favors.
    // why: city money ← "misuse of public funds" and the Indianapolis trip put together; when she says ← "began your
    //   relationship" caught, "earlier than" missed
    { id: 'd3', skill: 'detail', level: 'B2', point: 'accuse', seg: [107.15, 111.9],
      stem: 'What does Chris think about when the relationship began?',
      choices: ['It began earlier than she says', 'It began the night she says it did',
                'It began on a trip paid with city money'], a: 0,
      cue: '「began your relationship」のあと、比べる一語。',
      line: 'I think that you began your relationship with Ben Wyatt *earlier than you’re saying*.',
      said: '「言っているより前に始まっていたと思う」と言う。',
      mean: 'than you’re saying ＝ 本人の説明より。うそと見ている。',
      trap: 'began your relationship だけだと本人の説明どおりに聞こえる。earlier than が要。',
      use: 'You got here earlier than I thought.（思ったより早く着いたね）' },

    // R fix: V2, blind 60 % right; "lower every fee" was absurd. Now three near misses on counter / against me.
    // why: count ← "counter" heard as "count"; drop her charges ← "leveled against me" heard the other way round
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'leveled', seg: [123.6, 129.2],
      stem: 'After the break, what does Leslie tell her team they must do?',
      choices: ['Answer every charge Chris has made against her', 'Count every charge Chris has made against her',
                'Drop every charge she has made against Chris'], a: 0,
      cue: '「we need to」のあと、charge を含む言い方。',
      line: 'we need to *counter every charge* that Chris has *leveled against* me.',
      said: '「クリスの疑いに全部反論しよう」と言う。',
      mean: 'level a charge against ＝ 疑いをかける。counter ＝ 反論する。',
      trap: 'counter を count と聞いたり、against me の向きを逆に取ったりしやすい。',
      use: 'He denied every charge against him.（彼は全ての容疑を否定した）' },

    // R fix: V2, blind 70 % right; the distractors are now one person's job (Ron's, Ann's) taken for everyone's.
    //   B1: its `said` names Ann's comforting texts (p1's key), so it reveals `textme`.
    // why: who will testify ← Ron's job heard as everyone's; keep her calm ← Ann's job heard as everyone's
    { id: 'g2', skill: 'gist', level: 'B2', point: 'prep', reveals: ['leveled', 'textme'], seg: [123.6, 167.8],
      stem: 'After the break, what is Leslie doing with the people around her?',
      choices: ['Giving each one a task for fighting the charges', 'Asking each one to find out who will testify',
                'Asking each one to keep her calm and positive'], a: 0,
      cue: '名前を呼んでは頼みごとをする流れ。',
      said: '一人には証拠のファイル、ロンには証人探し、アンには励ましのメールと、役目を頼む。',
      mean: 'クリスの疑いに一つずつ反論する準備。受け身でなく、戦う構え。',
      trap: '一人への頼み（証人探し、励まし）だけ聞くと、全員の話に思える。名前ごとに聞く。',
      use: 'Okay, here’s what I need from everyone.（よし、みんなに頼みたいことがある）' },

    // R fix: V2, blind 60 % right; a near miss on "what" vs "where" replaces "already found".
    // why: wait for orders ← "Wait" taken literally, and more orders do follow; where ← "what evidence is" heard as
    //   where the evidence is (the next lines are about where things are)
    { id: 'i2', skill: 'infer', level: 'B2', point: 'evidence', seg: [129.0, 134.25],
      stem: 'Why does Leslie stop right after the quick “Got it”?',
      choices: ['She doubts he knows what she’s asking for', 'She doubts he knows where the evidence is',
                'She wants him to wait for the rest of her orders'], a: 0,
      cue: '「Wait」のすぐあとに続く理由。',
      line: 'Got it. — Wait, *you don’t know what evidence is*. — Ah, right on.',
      said: '「了解」と即答した相手に「証拠が何か分かってないでしょ」と言うと、「あ、そうか」と返る。',
      mean: '分かったふりの返事を見抜いている。相手がすぐ認めるのが笑いどころ。',
      trap: 'Wait を「待機して」と取りやすいが、ここは「ちょっと待って」という言い直しの合図。',
      use: 'Wait, do you know where it is?（待って、場所わかってる？）' },

    // R fix: V2, blind 55 % right; the choices are now three short spoken replies of the same shape.
    // why: tell me off ← hit = 殴る, read as "punish me" after "you don't know what evidence is"; get started ← "hit"
    //   as in "hit the road", going off to do the job at once
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'hitme', seg: [130.3, 141.3],
      stem: 'When the eager helper says he’s ready, what does his two-word reply mean?',
      choices: ['Go on, tell me what you need', 'Fine, tell me off if you like',
                'Okay, I’ll get started on it now'], a: 0,
      cue: '「right on」のあとと、それに続く説明。',
      line: 'Ah, right on. Yes, *hit me*. — Next to my desk is a picture…',
      said: '「よし、言ってくれ」と返すと、写真の裏の鍵、と細かい指示が始まる。',
      mean: 'hit me ＝「（情報を）くれ」。くだけた言い方で、すぐ詳しい指示が続く。',
      trap: 'hit を「打つ・殴る」と文字通り取りやすい。命令形の hit me は「どんどん来い」。',
      use: 'Okay, hit me. What’s the plan?（よし、どうぞ。作戦は？）' },

    // why: in the files ← "there are some files" right after "drawer" (wrong relation); next to a picture ← "Next to my
    //   desk is a picture" heard as where the key is
    { id: 'd4', skill: 'detail', level: 'B1', point: 'key', seg: [134.0, 141.3],
      stem: 'Where is the key to Leslie’s bottom desk drawer?',
      choices: ['Taped to the back of a picture', 'In the files inside the drawer', 'On the desk next to a picture'],
      a: 0,
      cue: '「picture」のあと、key を含む一文。',
      line: 'Get the key that’s *taped in the back of that picture*.',
      said: '写真の裏にテープで鍵が留めてあり、それで一番下の引き出しが開く。',
      mean: 'taped ＝ テープで留めてある。in the back of ＝ 裏側に。',
      trap: '最初の next to my desk は写真の場所。鍵の場所は、そのあとの taped 以下。',
      use: 'The key is under the mat.（鍵はマットの下にあるよ）' },

    // R fix: V2, blind 55 % right; the distractors are now as strong as the key (keen vs useless, testify).
    // why: keen ← "I'll go with him" heard as an eager offer, and "Seriously?" as pleased surprise; worried ← "who's
    //   going to testify" heard as the men testifying against her
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'men', seg: [149.8, 159.2],
      stem: 'After Ron’s answer and another offer to go along, what does the reaction show?',
      choices: ['Exasperation at how useless the men are', 'Pleased surprise at how keen the men are',
                'Worry that the men will testify against her'], a: 0,
      cue: '「department heads」の話のあと、短く問い返す一言。',
      line: 'I don’t know the names of the other department heads. … *Seriously, with the men in this office?*',
      said: 'ロンは部長の名前を知らず、別の人は付き添うと言う。そこで「この職場の男たちは」と嘆く。',
      mean: 'Seriously? ＝「本気？」。頼りにならない男性陣にあきれている。',
      trap: 'with him は協力に聞こえるが、一人では無理だから付き添う話。',
      use: 'Seriously? Again?（うそでしょ、また？）' },

    // why: 13 ← -teen/-ty swap; minutes ← 30 seconds sounds too often, so the ear "corrects" the unit
    { id: 'n2', skill: 'number', level: 'B1', point: 'thirty', reveals: ['textme'], seg: [159.15, 163.2], keep: true,
      stem: 'How often does Leslie want Ann to text her?',
      choices: ['Every 13 seconds', 'Every 30 seconds', 'Every 30 minutes'], a: 1,
      cue: '「text me」のすぐあとの数字と単位。',
      line: 'I need you to text me *every 30 seconds* that everything’s gonna be okay.',
      said: '「30秒ごとに『全部うまくいく』とメールして」とアンに頼む。',
      mean: 'every 30 seconds ＝ 30秒ごと。ありえない頻度で、不安の大きさが伝わる。',
      trap: '30秒は短すぎるので「分」と聞き直したくなる。-ty は短く、最初に強勢がある。',
      use: 'The bus comes every fifteen minutes.（バスは15分おきに来ます）' },

    // R fix: V2, blind 65 % right; "news about the witnesses" wasn't parallel. Now three kinds of text.
    // why: updates ← "text me every…" heard as a running report; rescue text ← the familiar pre-arranged way out
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'textme', reveals: ['thirty'], seg: [159.15, 167.9],
      stem: 'What is Leslie really asking Ann for?',
      choices: ['Steady reassurance to keep her calm', 'Steady updates on how things are going',
                'A rescue text if things go badly'], a: 0,
      cue: 'text me のあと、何を送ってほしいか。',
      line: 'text me every 30 seconds *that everything’s gonna be okay*.',
      said: '「大丈夫」というメールを、ずっと送り続けてほしいと頼む。アンは「いいよ」と答える。',
      mean: '情報ではなく、安心させてほしいというお願い。',
      trap: 'text と聞くと報告を思い浮かべやすいが、中身は毎回同じ「大丈夫」。内容を聞く。',
      use: 'Just tell me it’s going to be okay.（大丈夫だって言って）' },

    // R fix: V2, blind 50 % right; the key was the only one tied to "one rule". All three are now for that one rule,
    //   so only the idiom decides.
    // why: tough ← her 1849 story ("nobly accepted her punishment"), and "slap" heard as a real blow; scolding ←
    //   "slap" taken literally, as being told off by someone
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'wrist', seg: [167.9, 174.3],
      stem: 'At the end, what punishment does Leslie say she’ll accept?',
      choices: ['A light one, for the one rule she broke', 'A tough one, for the one rule she broke',
                'A public scolding for the rule she broke'], a: 0,
      cue: '話の最初の一文、accept に続く言い方。',
      line: 'I broke one rule, and I will accept *a slap on the wrist*.',
      said: '「規則を一つ破ったのだから、軽い罰なら受ける」と話す。',
      mean: 'a slap on the wrist ＝ 手首を軽くたたく程度の、軽い罰。重い処分ではない。',
      trap: 'slap を文字通り「たたかれる・叱られる」と取りやすい。慣用句で「軽い罰」。',
      use: 'He got just a slap on the wrist.（軽い処分で済んだ）' },
  ]
};
