// “Time-Capsule Nutjob Kelly Larson | Parks and Recreation” (the official Parks and Recreation channel, Season 3): a fan
// asks Leslie to put the Twilight books in Pawnee's time capsule, handcuffs himself in her office when she says no, and
// settles in for a long stay.
// Segments from the captions, words from whisper (2026-11-16). Left out on purpose: "your mom… complete failure"
// (141–144 s, only an insult), the Robert Pattinson line (170–176 s, innuendo), "heartbreak" (captions "her break
// man", 147 s), "listen to him/them" (159 s), and the screaming at 200–208 s (whisper only; the captions are empty).
// The man Kelly calls sad (128–144 s) and the person offering to handle Kelly (110 s) aren't named in the audio, so the
// stems don't name them.
// REVIEW 2026-11-16: pass 7, fix 16, drop 0, new 0; ear checks 0
// REVIEW open: no C2 (native-tier) items yet; GUIDE-v2 §10 asks for 2–4 per bank (an author task).
// REVIEW: the three ear checks went (s1 and x1: both transcripts agree; a1: "all the way back to her birth" carries the
// dryness in the words, and captions' "births" doesn't touch the key).
import type { Clip } from '../types.ts';

export const kellyLarson: Clip = {
  id: 'kellylarson', video: 'E8nPjG4UpPU', title: 'Time-Capsule Nutjob Kelly Larson', dur: 237, wpm: 177,
  band: 'mid', tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 — "before he does anything drastic" told that she says no, and the key sat between the two distractors
    // (blind 60 %); now all three end in a no, and only how she gets there differs.
    // why: no at once ← "We're not taking suggestions" heard, "have a seat" missed; think it over ← Japanese frame: a polite no is deferred
    { id: 'g2', skill: 'gist', level: 'B2', point: 'pitch', reveals: ['plead'], seg: [0, 81.5],
      stem: 'How does Leslie handle Kelly’s request in her office?',
      choices: ['She lets him make his case, then says no', 'She says no at once and shows him out',
                'She says she’ll think it over, then says no'], a: 0,
      cue: '最初の断りのあと、席をすすめる一言と最後の返事。',
      said: '最初は断るが、結局すわらせて話を聞き、最後に「やっぱりダメ」と言う。',
      mean: '話は聞くが、答えは変わらない。丁寧に聞いてから断る流れ。',
      trap: 'not taking suggestions で門前払いと取りやすいが、すぐ席をすすめている。',
      use: 'I hear you, but the answer is no.（言い分は分かるけど、答えはノー）' },

    // why: apology ← "I'm sorry" read as a real apology; wait your turn ← "not taking" read as "not yet"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'refuse', seg: [7.4, 10.6],
      stem: 'What is Leslie doing with her first reply to Kelly’s suggestion?',
      choices: ['Turning him down before he starts', 'Apologizing for keeping him waiting',
                'Asking him to wait for his turn'], a: 0,
      cue: '「Oh」のあとの2つの文。', line: 'Oh, *I’m sorry*. We’re *not taking suggestions*.',
      said: '「すみません、提案は受け付けていないんです」と、話を聞く前に断る。',
      mean: 'I’m sorry は謝罪ではなく、断りを柔らかくする前置き。',
      trap: '日本語の「すみません」と同じで、謝っているわけではない。後ろの not が本題。',
      use: 'Sorry, we’re not taking any more orders.（すみません、もう注文は受けていません）' },

    // why: offended ← a rude guess usually gets offense; daughter ← "younger" + "girl" read as someone else writing
    { id: 'h1', skill: 'humor', level: 'C1', point: 'boy', seg: [13.8, 23.2],
      stem: 'Why does the audience laugh at Kelly’s answer to Leslie’s guess?',
      choices: ['He simply corrects her, calling himself a boy', 'He acts hurt, then admits she is right',
                'He says his young daughter wrote the emails'], a: 0,
      cue: 'Leslie の予想2つと、それをそのまま返す答え。',
      line: 'I thought you would be *younger. And a girl.* — Well, I’m not. I’m *older and a boy*.',
      said: '「もっと若い女の子だと思った」と言われ、「違います。年上の男子です」と平然と返す。',
      mean: '大人なのに boy と言い、失礼な予想を気にもしないのがおかしい。',
      trap: '失礼なことを言われたら怒るのが普通の流れ。ここは淡々と言葉を入れ替えるだけ。',
      use: 'Sorry, I’m not who you expected.（すみません、思ってた人と違って）' },

    // R fix: V2 — "Fill out a request" was a filler (blind 55 %); now "Beg her for a favor", the literal plead.
    // why: beg ← plead = 嘆願, read as begging; apologize ← plead read as begging forgiveness
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'plead', seg: [26.6, 30.4],
      stem: 'After “Sure, Kelly. Have a seat,” what does Leslie invite him to do?',
      choices: ['Make his argument', 'Beg her for a favor', 'Apologize for coming'], a: 0,
      cue: '「Have a seat」のあと、短い3語。', line: 'Sure, Kelly. Have a seat. *Plead your case.*',
      said: '「座って。言い分をどうぞ」と、話す機会をあげる。',
      mean: 'plead your case ＝ 自分の主張を述べる。裁判の言い方を軽く使っている。',
      trap: 'plead を「頼みこむ・謝る」と取りやすい。case は「言い分」の意味。',
      use: 'Okay, go ahead and make your case.（じゃあ、言い分をどうぞ）' },

    // R fix: V2 — "Pleased that he is starting at the beginning" was easy to strike (blind 60 %); new C is a reaction to
    // the odd "named Morgan" just before.
    // why: impressed ← "all the way back" read as admiration; confused ← the odd "Stephenie Meyer, named Morgan" read as her problem
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'birth', seg: [36.2, 39.7],
      stem: 'When Kelly starts with the author’s birth, how does Leslie react?',
      choices: ['Dryly noting this will take a while', 'Sincerely impressed by his research',
                'Confused about who he is talking about'], a: 0,
      cue: '「Oh」で始まる文と、最後の短い Okay。',
      line: 'Oh, you’re going *all the way back* to her birth. *Okay.*',
      said: '「生まれたところまでさかのぼるのね。分かった」と言う。',
      mean: 'all the way back で「長くなりそう」とあきれている。',
      trap: '言葉だけならほめているようにも取れる。all the way back と、話を区切る最後の Okay で判断。',
      use: 'Oh, we’re starting from the very beginning.（あ、最初から話すのね）' },

    // R fix: V2 — the key was the middle, world-knowledge answer (blind 50 %); now the key is the largest, and "a
    // million" is what's left when "hundred" is lost.
    // why: 1 million ← "a hundred million" with "hundred" lost; 10 million ← hundred heard as ten
    { id: 'n1', skill: 'number', level: 'B1', point: 'copies', seg: [39.3, 43.1],
      stem: 'How many copies does Kelly say the books have sold?',
      choices: ['More than 1 million', 'More than 10 million', 'More than 100 million'], a: 2, keep: true,
      cue: '「more than」のあと、million の前。', line: 'they have sold more than *100 million* copies worldwide.',
      said: '合わせて世界で1億部以上売れた、と数字で説得しようとする。',
      mean: 'a hundred million ＝ 1億。英語は3けたごとに区切って数える。',
      trap: 'hundred が弱いと a million に聞こえやすい。a と million の間を聞く。',
      use: 'It sold over a million copies.（100万部以上売れたんだよ）' },

    // R fix: V2 — "had you seen" doesn't fit the question (blind 70 %); now "did you see", as natural as the key.
    // why: Haven't ← the -n't reading turns it into surprise; been to ← "seen" lost; did you see ← "have you" weakened to a short "d'ya"
    { id: 's1', skill: 'sound', level: 'B2', point: 'seen', seg: [43.0, 46.6],
      stem: 'Fill the gap: “Now, ___ any of the Twilight movies?”',
      choices: ['have you seen', 'haven’t you seen', 'did you see', 'have you been to'], a: 0,
      cue: 'Now のあと、とても短く弱い出だし。', line: 'Now, *have you seen* any of the Twilight movies? — No, I have not.',
      said: '映画を見たことがあるか聞き、Leslie は「ありません」と答える。',
      mean: 'have you は弱く「ハヴュ」とつながる。答えの I have not と対になる。',
      trap: 'haven’t なら「見てないの？」と驚く意味。n’t の小さな「ン」を聞く。',
      use: 'Have you seen the new Star Wars?（新しいスター・ウォーズ見た？）' },

    // R fix: V2 — "photos he took himself" was a filler (blind 55 %); B and C are now nearer misreadings.
    // why: best scenes ← "describe" heard, "shot for shot" read as picking shots; pictures ← katakana ショット = a photo
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'shot', seg: [46.2, 55.8],
      stem: 'How does Kelly offer to describe the movies to Leslie?',
      choices: ['Every scene, one after another', 'Only the best scenes, briefly', 'With pictures he brought along'],
      a: 0,
      cue: '「describe them to you」のあと。直後の説明も手がかり。',
      line: 'let me describe them to you *shot for shot*. Movie number one…',
      said: '映画を「カットごとに」説明すると言い、本当に最初の場面から語りだす。',
      mean: 'shot for shot ＝ 1カットずつそのまま。とても長くなる予告。',
      trap: 'ショットを「写真」と取りやすい。映画の shot は1つのカットのこと。',
      use: 'He told me the whole plot in detail.（話を一から全部聞かされた）' },

    // R fix: V2 — "already full of stuff" was easy to strike (blind 50 %); new C is a reason a listener could bring in.
    // why: too new ← "at this moment in time" read as "too recent"; for kids ← the scene's teen-fan framing read as her reason
    { id: 'd1', skill: 'detail', level: 'B1', point: 'pawnee', seg: [55.5, 67.9],
      stem: 'What reason does Leslie give for saying no?',
      choices: ['The books have nothing to do with Pawnee', 'The books are too new to belong in it',
                'The books are meant for kids, not adults'], a: 0,
      cue: '「It’s about」のあとと、最後の文。',
      line: 'It’s about *life in Pawnee*… there is *nothing in Twilight that is specific to Pawnee*.',
      said: 'タイムカプセルは今の町の暮らしを残すもの。この本には町らしさがないと言う。',
      mean: '人気があるかどうかではなく、町と関係があるかが基準。',
      trap: 'moment in time から「新しすぎる」と取りやすいが、基準は町と関係があるかどうか。',
      use: 'It has nothing to do with our town.（うちの町とは関係ないよ）' },

    // R fix: V2 — the key was the only explanation of the joke, the rest were facts (blind 60 %); new B is a second
    // reading of the joke itself.
    // why: never been ← "exactly like" read as a guess; insult ← comparing Pawnee to a vampire town read as a put-down
    { id: 'h2', skill: 'humor', level: 'C1', point: 'forks', seg: [67.6, 75.1],
      stem: 'Why is Kelly’s comparison of the two towns funny?',
      choices: ['His exceptions undo his own point', 'He insults Pawnee while trying to praise it',
                'He admits he has never been to Forks'], a: 0,
      cue: '「exactly like」のあと、except で始まる部分。',
      line: 'the town of Forks, Washington, is *exactly like* Pawnee. *Except for* the climate and *the vampires*.',
      said: '「Forks は Pawnee とそっくり。気候とヴァンパイア以外は」と言う。',
      mean: '「ヴァンパイア以外は同じ」では、話の中心が違い、反論になっていない。',
      trap: 'けなしたと取りやすいが、言葉はほめている。except のあとは違う点。',
      use: 'It’s just like home, except for the weather.（天気以外は地元そっくり）' },

    // R fix: V2/K6 — the key was the only hedged "sounds like" and C was a filler (blind 55 %); now three parallel
    // readings, C taking Kelly for one of "those kids".
    // why: blames April ← "I think it's kind of cool" makes April the target; Kelly ← "those kids" read as the man in cuffs
    { id: 'h3', skill: 'humor', level: 'C1', point: 'lecture', seg: [91.0, 102.5],
      stem: 'Why does April ask Leslie who she is even talking about?',
      choices: ['She lectures April like a parent about bad friends',
                'She blames April for letting Kelly in',
                'She treats Kelly as one of April’s friends'], a: 0,
      cue: '「if those kids」で始まる文に注目。',
      line: 'Cool people *make the rules*… And *if those kids* want you to break the rules, then they’re *not really your friends*.',
      said: 'ルールを破る人はかっこよくない、悪い友だちは本当の友だちじゃない、と説教する。',
      mean: '大人が子どもに言う決まり文句で、この場面と合っていない。',
      trap: '話の流れから April を責めていると取りやすいが、those kids は誰も指していない。',
      use: 'Who are you even talking about?（それ、誰の話？）' },

    // why: worried ← the lecture itself sounds like worry; impressed ← she admits something, read as giving in
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'annoyed', seg: [100.6, 104.4],
      stem: 'When April challenges her, how does Leslie explain her outburst?',
      choices: ['She is just annoyed by the whole thing', 'She is worried that April may copy Kelly',
                'She is secretly impressed and hiding it'], a: 0,
      cue: '「I don’t know」のあと、短い2つの文。', line: 'I don’t know. I’m sorry. I’m *just annoyed*.',
      said: '「分からない。ごめん。ただイライラしてるだけ」と認める。',
      mean: '説教の中身に意味はなく、Kelly の件でイライラしていただけ。',
      trap: '説教の内容から「心配」と取りやすいが、本人が理由をはっきり言っている。',
      use: 'Sorry, I’m just a little stressed.（ごめん、ちょっと余裕がないだけ）' },

    // R fix: V2/§9.2 — the stem quoted the marker under test (blind 60 %); it now names the moment, and C is the
    // Kelly problem a listener expects her to return to.
    // why: new topic ← "subject" read as a fresh topic; back to Kelly ← "But" read as a return to the main problem
    { id: 'm1', skill: 'marker', level: 'B2', point: 'subject', seg: [103.3, 109.6],
      stem: 'How does Leslie bring up Orrin right after her apology?',
      choices: ['She ties him to the friends talk she just gave', 'She drops the friends talk for a new topic',
                'She uses him to get back to the Kelly problem'], a: 0,
      cue: '「I’m just annoyed」のすぐあと。続く友だちの話。',
      line: 'But *while we’re on the subject*, your friend Orrin… he concerns me.',
      said: 'ついでに、と言って April の友だち Orrin の話を持ち出し、心配だと言う。',
      mean: '今の話に関係あることを足すときの言い方。「その話が出たついでに」。',
      trap: 'subject を「新しい話題」と取りやすい。今の話題に乗っかるのが while の働き。',
      use: 'While we’re on the subject, who’s paying?（その話のついでに、誰が払う？）' },

    // why: 13 ← thirty heard as thirteen (-teen/-ty stress); 3 minutes / 30 minutes ← the unit missed
    { id: 'n2', skill: 'number', level: 'B1', point: 'seconds', seg: [110.2, 115.5],
      stem: 'How long does the person offering to handle Kelly say they need?',
      choices: ['13 seconds', '30 seconds', '3 minutes', '30 minutes'], a: 1, keep: true,
      cue: '「Give me」のあとの数と単位。', line: 'I’ll take care of this trespasser. Give me *30 seconds*.',
      said: '「この侵入者は任せて。30秒くれ」と言う。Leslie は警備を呼ぶと答える。',
      mean: 'すぐ片づけられるという自信の表れ。',
      trap: 'thirty と thirteen は強く言う所が違う。-ty は前、-teen は後ろが強い。',
      use: 'Give me five minutes.（5分ちょうだい）' },

    // R fix: V2 — "Cut it an hour shorter" was the weak one, leaving a later/earlier coin flip (blind 50 %); now "longer"
    // (push = stretch it out), so all three are readings of push.
    // why: longer ← "push" read as stretch out; earlier ← "push" read as push forward
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'push', seg: [115.2, 119.3],
      stem: 'What does Leslie ask the others to do with the meeting?',
      choices: ['Move it an hour later', 'Make it an hour longer', 'Start it an hour earlier'], a: 0,
      cue: '「Guys」のあと。meeting と hour の間。', line: 'Guys, can we *push the meeting an hour*?',
      said: '「みんな、会議を1時間ずらせる？」と頼む。',
      mean: 'push ＝ （予定を）後ろにずらす。push back とも言う。',
      trap: 'push を「前へ押す」と取ると早める意味になる。予定の push はふつう遅らせる。',
      use: 'Can we push dinner to eight?（夕食を8時にずらせる？）' },

    // R fix: V2 — "Nobody has ever done this here before" was the plain opposite (blind 60 %); now shock at a fan going
    // this far, the reading of "Damn it" alone.
    // why: shocked ← "Damn it" read as shock at something new; blames Leslie ← "Again?" read as "you again?"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'again', seg: [119.2, 126.0],
      stem: 'What does the reply to Leslie’s explanation suggest?',
      choices: ['Something like this has happened before', 'The speaker is shocked a fan went this far',
                'Leslie keeps letting strange people in'], a: 0,
      cue: '説明を聞いた人の、最後の一語。', line: '— Damn it. *Again?*',
      said: '手錠の件を聞いて「くそ、またか」と返す。',
      mean: 'Again? の一語で、前にも同じようなことがあったと分かる。',
      trap: 'Damn it だけなら驚きにも取れる。最後の Again? が「前にもあった」の手がかり。',
      use: 'The train is late? Again?（電車遅れてる？また？）' },

    // R fix: V2 — "Trouble at work" was a vague filler (blind 55 %); now "his boss", parallel to the other two.
    // why: boss ← "you look sad" + office setting; his mom ← "mom" is said right after
    { id: 'd3', skill: 'detail', level: 'B1', point: 'girl', seg: [128.4, 135.5],
      stem: 'What does Kelly guess is behind the other man’s sad look?',
      choices: ['Trouble with a girl', 'Trouble with his boss', 'Trouble with his mom'], a: 0,
      cue: '「You look sad」のあと、Kelly の短い質問。', line: '*It’s a girl*, isn’t it? I can tell.',
      said: '「悲しそうだね」と言い、悪口を返されても「女の子のことでしょ」と言う。',
      mean: 'isn’t it? は確信に近い推測。I can tell ＝ 見れば分かる。',
      trap: 'このあと mom が出てくるが、それは言い返しの悪口。Kelly の推測は最初の質問。',
      use: 'You look tired. Long day?（疲れてるね。大変な日だった？）' },

    // why: in his car ← the usual place for keys; thrown away ← "far away" read as gone for good
    { id: 'd4', skill: 'detail', level: 'B1', point: 'keys', seg: [176.3, 181.35],
      stem: 'Where does Kelly say the handcuff keys are?',
      choices: ['Hidden somewhere very far away', 'Left in his car out front', 'Thrown away where no one can find them'],
      a: 0,
      cue: '「Give us the keys」への答え。', line: 'Give us the keys. — They’re *hidden somewhere very far away*.',
      said: '「鍵を出せ」と言われ、「ずっと遠くに隠してある」と答える。',
      mean: '最初から外されないように準備していた、ということ。',
      trap: 'far away を「捨てた」と取りやすい。hidden ＝ どこかにある、が要点。',
      use: 'I left my keys somewhere at home.（鍵を家のどこかに置いてきた）' },

    // why: cut free ← "cut you loose" heard and taken as done; books in ← the usual "she gives in" script
    { id: 'g1', skill: 'gist', level: 'B2', point: 'standoff', reveals: ['pillow', 'keys'], seg: [176.3, 221.3],
      stem: 'Where do things stand between Leslie and Kelly at the end?',
      choices: ['She lets him stay, and he is in no hurry', 'Security cuts him free and walks him out',
                'She gives in and adds the books after all'], a: 0,
      cue: '「stop!」のあとの彼女の決断と、最後の発見。',
      said: '鍵はなく、警備も止め、Leslie は好きなだけいさせると決める。でも彼は枕まで持ってきた。',
      mean: '我慢比べになったが、相手のほうが準備できている。',
      trap: 'cut you loose は「切って外すぞ」という脅しで、実際には止めている。',
      use: 'Fine, stay as long as you like.（いいよ、好きなだけいれば）' },
    // R fix: V2/K1 — the key said "she" though "You're trespassing" isn't tied to Leslie in the audio, and C was easy
    // to strike (blind 50 %); the choices no longer name a speaker. seg starts at 182.7 (182.6 cut "loose").
    // why: admits wrong ← "the fact remains" read as a concession; quotes a law ← "perfectly legal" read as legal knowledge
    { id: 'h4', skill: 'humor', level: 'C1', point: 'fact', seg: [182.7, 190.4],
      stem: 'Why is Kelly’s “the fact remains…” reply funny?',
      choices: ['He insists on a “fact” that was just refuted', 'He admits they are right, in fancy words',
                'He quotes a law that no one has heard of'], a: 0,
      cue: '「You’re trespassing」の直後、彼の返し。',
      line: 'You’re trespassing. — Well, *the fact remains*, this is *perfectly legal*. — No, it’s not.',
      said: '「不法侵入だ」と言われ、「事実として、これは完全に合法だ」と言い返す。',
      mean: 'the fact remains は議論を決める言い方。根拠なしで使うので空回りしている。',
      trap: 'fact と legal で法律に詳しいように聞こえるが、何も示していない。',
      use: 'The fact remains, we’re late.（とにかく、遅刻は遅刻だよ）' },

    // R fix: V2/S2 — the quoted preface signalled a "but" (blind 60 %); the stem now names the moment, and C is the
    // threat reading of "cause any trouble".
    // why: leave quietly ← "I really don't want to cause trouble" read as backing down; threat ← "trouble" read as a warning
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'trouble', seg: [190.2, 196.1],
      stem: 'Told again that he’s trespassing, what is Kelly setting up?',
      choices: ['A firm demand, softened in advance', 'A polite promise to leave quietly',
                'A threat of trouble if he is refused'], a: 0,
      cue: '前置きのあと、but で始まる文。', line: 'Look, I really *don’t want to cause any trouble*. *But*…',
      said: '「面倒を起こしたいわけじゃない」と前置きして、but のあとで条件を突きつける。',
      mean: '本音は but のあと。前置きは強い要求を和らげるため。',
      trap: '日本語の「お騒がせして」のような謝罪と取りやすい。but が来たら本題の合図。',
      use: 'I don’t mean to be rude, but…（失礼なつもりはないけど…）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'leave', seg: [191.8, 196.1],
      stem: 'Type what Kelly says: “But I am ___ until you put Twilight in.” (3 words)', answer: 'not gonna leave',
      cue: '「But I am」のあと、強く言う語から。', line: 'But I am *not gonna leave* until you put Twilight in the time capsule.',
      said: '本を入れてくれるまで帰らない、と言い切る。',
      mean: 'not gonna ＝ not going to。強く言うと決意になる。',
      trap: 'not の t は止まるだけで「ナッ」、gonna は「ガナ」。2語が1つに聞こえやすい。',
      use: 'I’m not gonna give up.（あきらめないよ）' },

    // R fix: V2 — "given up and getting ready to leave" was easy to strike (blind 60 %); new C keeps her "hungry" plan alive.
    // why: fall asleep ← pillow = sleep; hungry sooner ← "two hours" + "hungry" read as her plan working
    { id: 'i2', skill: 'infer', level: 'C1', point: 'pillow', seg: [207.2, 221.3],
      stem: 'What does Leslie’s last discovery mean for her plan?',
      choices: ['Waiting him out will take far longer than hoped', 'He will soon fall asleep and be easy to move',
                'He will get hungry even sooner than she thought'], a: 0,
      cue: '「two hours」の計画と、最後の短い文。',
      line: 'In *two hours*, he’s gonna be so hungry… begging me to… *He brought a pillow.*',
      said: '「2時間もすればお腹がすいて泣きつくはず」と言いかけて、枕を持参していたと気づく。',
      mean: '長期戦の準備ができている。待てば帰るという計画は通じない。',
      trap: '枕から「眠る」を連想しやすい。準備のよさ＝長くいるつもり、と読む。',
      use: 'He came prepared.（準備万端で来たね）' },

  ]
};
