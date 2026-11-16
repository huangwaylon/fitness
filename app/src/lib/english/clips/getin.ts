// “GET IN - The Office US” (the official The Office channel, BEST OF SEASON 5): Dwight, sure a conspiracy is behind his
// bad customer reviews, suspects listeners in the car and on his calls and confronts Kelly in her nook; then Jim
// notices Kelly has gone cold on him and, through a matching mug, works out that he skipped her party.
// Segments from the captions, words from whisper (2026-11-16). The captions miss 15–23 s (music; whisper "They might
// be listening to us… Who's they?") and garble 33.4 s ("the mom" for "the mob"; the second "mob" at 36.2 s agrees),
// 76 s ("mr here" for "I still hear it"), 89.4 s ("you're anything" for "hear anything"), 98.4 s ("so let's" for
// whisper's "Phyllis"), 164.4 s ("I think so" vs "I don't think so"), 180.6 s ("a full-on in New York"), 195.2 s ("as"
// vs "his" party favors), 198.9 s ("or" vs "her") and 213 s (whisper loops "I can't be the only one who didn't know");
// no key rests on those words, and the lines trim them. The 44–54 s shoes/Pam exchange (speakers unclear) and the
// 124–129 s "that's what she said" run are untested. Kelly is named at 79.1 and 157.8 s, Jim at 53.3 and 177.9 s,
// Dwight at 123.2 s. i3, pr4 and d6 don't name who answers Jim (the phone voice at 209–213 s says "visit me").
// REVIEW 2026-11-16: pass 5, fix 19, drop 0, new 0; ear checks 1
// EAR CHECK: 65.3 s pr1 — the customer's "I'm sorry?" rises (whisper writes "?"; the captions have no punctuation)
import type { Clip } from '../types.ts';

export const getIn: Clip = {
  id: 'getin', video: 'sb2gtDxQMrM', title: 'GET IN', dur: 239, wpm: 185, band: 'fast',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %, right): only the key named a real complaint. Now three parallel "run of bad X" causes.
    // why: lost orders ← "redouble my order" on the call (keyword, wrong relation); low sales ← the paper-salesman
    //   script and "our downfall"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'reviews', seg: [19.5, 129],
      stem: 'Through his car ride, call and visit to Kelly, what is Dwight after?',
      choices: ['Who is behind his run of bad customer reviews', 'Who is behind his run of lost customer orders',
                'Who is behind his run of low sales numbers'], a: 0,
      cue: 'Kelly の言い返しと、Dwight の the reason のあと。',
      said: '陰謀を信じ、車でも電話でも盗み聞きを疑い、Kelly を問いつめる。',
      mean: '客からの評価が悪い理由を、自分ではなく誰かの陰謀のせいにしている。',
      trap: 'order や downfall が残ると、注文や売上の話に聞こえる。最後の reviews で分かる。',
      use: 'Who’s behind all this?（いったい誰の仕業だ？）' },

    // why: car rental ← "in this car" heard right after; head office ← "they" as the bosses (the corporate-paranoia
    //   script)
    { id: 'd1', skill: 'detail', level: 'B1', point: 'monitor', seg: [23.2, 28.6],
      stem: 'In the car, who does Dwight say might be listening?',
      choices: ['People in customer service', 'People at the car rental desk', 'People in the head office'], a: 0,
      cue: 'might be の前、文の最初の二語。',
      line: '*Customer service* might be monitoring this conversation.',
      said: '「カスタマーサービスがこの会話を監視しているかもしれない」と言う。',
      mean: 'monitor ＝ 見張る、聞いて記録する。車の中なのに本気で心配している。',
      trap: 'すぐあとの in this car から、車の会社と取りやすい。主語は文の最初に来る。',
      use: 'This call may be monitored.（この通話は録音されることがあります）' },

    // R fix: V2 (blind 85 %, right): "to defend his worry" pointed at caution and the distractors had no shape in
    //   common. Neutral stem; three parallel "X now beats Y later" readings.
    // why: saying sorry ← "sorry" read as an apology (literal reading); staying quiet ← "safe" plus the hush-hush car
    //   scene and "monitoring"
    { id: 'p1', skill: 'phrase', level: 'B1', point: 'safe', seg: [23.2, 28.6],
      stem: 'What does the saying Dwight uses in the car mean?',
      choices: ['Taking care now beats regretting it later', 'Saying sorry now beats a fight later',
                'Staying quiet now beats being caught later'], a: 0,
      cue: 'You never know のあと、決まり文句。',
      line: 'You never know. *Better safe than sorry.*',
      said: '「何があるか分からない。用心するに越したことはない」と言う。',
      mean: 'sorry ＝ 後悔する。あとで悔やむより、先に用心するほうがいい。',
      trap: 'sorry を「ごめん」と取ると、謝る話に聞こえる。ここは「悔やむ」側の意味。',
      use: 'Take an umbrella. Better safe than sorry.（傘を持って行きな。念のため）' },

    // R fix: V2 (blind 75 %, right): only the key held the absurd suspects. All three now name them; they differ in
    //   who says them and whether he means it.
    // why: mocks Jim ← Jim asks "what are you thinking here?", so the list is taken as Jim's (wrong speaker); calming
    //   Jim ← the absurd list heard as deliberate (sincerity flip)
    { id: 'h1', skill: 'humor', level: 'C1', point: 'suspects', seg: [28.6, 41.3],
      stem: 'Why does Dwight’s answer about who benefits get a laugh?',
      choices: ['He treats NASA and the mob as real suspects', 'He mocks Jim for suspecting NASA and the mob',
                'He jokes about NASA and the mob to calm Jim'], a: 0,
      cue: 'downfall のあと、出てくる名前と最後の理由。',
      line: 'Who stands to benefit from our downfall? … Maybe *NASA*. Could be *the mob*.',
      said: '「我々の失脚で得をするのは誰だ？NASA か、マフィアか」と真剣に考える。',
      mean: '評価が悪いだけなのに、NASA まで本気で疑う。大げさなずれが笑い。',
      trap: 'ばかげた名前は冗談に聞こえやすい。名前を挙げ、理由まで考えるのは Dwight。',
      use: 'Who benefits from this?（これで得するのは誰？）' },

    // why: a little ← the s of "there's" runs into "little", heard as "there's a"; a lot of ← "l…t" caught, with "a"
    //   from the linking
    // R fix: S4: the segment ended 0.4 s after "that". It now runs through Jim's "Is there some evidence?"
    { id: 's1', skill: 'sound', level: 'B2', point: 'little', seg: [36.95, 42.4],
      stem: 'Fill the gap: “and there’s ___ evidence of that.”',
      choices: ['little', 'a little', 'a lot of'], a: 0,
      cue: 'there’s のすぐあと、evidence の前。',
      line: 'and there’s *little* evidence of that.',
      said: '「証拠はほとんどない」。there’s little はつながる。',
      mean: 'little ＝ ほとんどない、a little ＝ 少しある。意味が逆。',
      trap: 's と little がつながり、a が入ったように聞こえる。but then の流れで確かめる。',
      use: 'There’s little time left.（もうほとんど時間がない）' },

    // R fix: V2 (blind 70 %, right): "suddenly tells… to shut up" made shock the obvious reply. The stem now names
    //   the moment only, and both distractors are apologies.
    // why: talking over him / taking so long ← "I'm sorry" read as an apology (Japanese すみません), with "shut up"
    //   heard as a rebuke the customer accepts
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'sorry', seg: [63.36, 66.5],
      stem: 'When Dwight breaks off the customer’s order, what does the customer’s reply do?',
      choices: ['Checks, startled, what Dwight just said', 'Apologizes for talking over Dwight',
                'Apologizes for taking so long to order'], a: 0,
      cue: 'shut up の直後、上がり調子の短い返事。',
      line: 'Wait, shut up. — *I’m sorry?*',
      said: '注文の途中で「待て、黙れ」と言われ、客は「はい？」と聞き返す。',
      mean: '上がり調子の I’m sorry? は「今なんて？」。謝っているのではなく、驚いて聞き返している。',
      trap: 'I’m sorry を「すみません」と取りやすい。語尾が上がれば聞き返し。',
      use: 'I’m sorry? Could you say that again?（はい？もう一度言ってもらえますか）' },

    // R fix: V2 (blind 75 %, right): the "calm down" distractor was weak. Now three purposes a phone call could have.
    // why: noise ← "Breathing. Is that you?" heard as a noise complaint; interrupting ← "shut up" just before, so
    //   holding the breath is heard as one more way to silence him
    { id: 'i2', skill: 'infer', level: 'B2', point: 'listen', seg: [66.1, 80.6],
      stem: 'Why does Dwight tell the customer to hold his breath?',
      choices: ['To find out if a third person is listening', 'To cut the noise so he can take the order',
                'To keep the customer from interrupting him'], a: 0,
      cue: '息を止めさせたあと、Dwight が誰に呼びかけるか。',
      line: 'Well, stop. *Hold your breath.* … *Who’s there?* … Kelly, is that you?',
      said: '客に息を止めさせ、それでも聞こえる息に「誰だ？Kelly か？」と呼びかける。',
      mean: '電話を誰かが盗み聞きしていると疑い、客の息と区別しようとしている。',
      trap: '息がうるさいという苦情に聞こえやすい。止めさせたあとの Who’s there? が目的を示す。',
      use: 'Is someone else on the line?（ほかに誰か電話に出てる？）' },

    // C2 humor: who the joke is on
    // R fix: K2: Kelly really is on the line (79–90 s), so "Kelly, for breathing too loudly" was half true on screen.
    //   Replaced with a sincerity flip.
    // why: the customer ← right mechanism (someone misses the point), wrong target: his literal "yes" is the sane reply;
    //   teasing ← the absurd order "stop" heard as Dwight playing with him (sincerity flip)
    // anchor: 71.6–73.2 s "Is that you? — Well, I am breathing, yeah." answers the paranoid question literally; 73.4–74.9
    //   s "Well, stop. Hold your breath." treats that answer as a real problem
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'breath', seg: [66.1, 75.5],
      stem: 'In the breathing exchange on the phone, who is the joke on?',
      choices: ['Dwight, whose question has an obvious answer', 'The customer, who doesn’t see what Dwight means',
                'Nobody; Dwight is teasing the customer on purpose'], a: 0,
      cue: '客の返事が、どれだけ当たり前の答えか。',
      line: 'Breathing. Is that you? — *Well, I am breathing, yeah.* — Well, stop.',
      said: '「息の音がする。お前か？」に、客は「まあ、息はしてますけど」と答え、Dwight は「なら止めろ」と言う。',
      mean: '客の返事は当然の事実。それを問題扱いする Dwight のほうがおかしい。',
      trap: '客がずれた返事をしたように聞こえやすい。言葉どおりの答えが一番まともなら、笑いは質問した側に向く。',
      use: 'Well, I am human, yeah.（まあ、人間ですからね）' },

    // R fix: V2 (blind 55 %, right): the distractors weren't parallel. Now three ways of answering his hint.
    // why: coy ← "I think you know" heard as hitting home (the guilty party's script); sharp ← "you always say that"
    //   heard as a complaint
    { id: 'h3', skill: 'humor', level: 'C1', point: 'alwayssay', seg: [92.38, 96.5],
      stem: 'Why does Kelly’s reply to Dwight’s “I think you know” get a laugh?',
      choices: ['She answers his hint honestly: she rarely has a clue', 'She answers his hint coyly: she knows but won’t say',
                'She answers his hint sharply: he should drop it'], a: 0,
      cue: 'You always say that のあと、and の後半。',
      line: 'I think you know. — You always say that, and *I almost never know*.',
      said: '「分かってるだろ」に、「いつもそう言うけど、だいたい分からない」と返す。',
      mean: '決めぜりふを真に受けて、正直に答えている。芝居がかった脅しが空回り。',
      trap: '問いつめられた人はとぼけるのが普通の流れ。ここは本気。almost never ＝ ほとんど〜ない。',
      use: 'You always say that.（いつもそう言うよね）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'upto', seg: [96.1, 98.3],
      stem: 'Type Dwight’s question: “___, girl, huh?” (5 words)', answer: 'what are you up to',
      cue: 'girl の前まで、一続きの質問。',
      line: '*What are you up to*, girl, huh?',
      said: '「何をたくらんでる？」。what are you は短くつながる。',
      mean: 'be up to ＝ 何かをしている、たくらんでいる。ただの「最近どう？」にも使う。',
      trap: 'are と you が弱く、what とひとまとまりになる。速くても5語あると知って書く。',
      use: 'What are you up to this weekend?（週末は何するの？）' },

    // R fix: S1: "naming coworkers" relied on "Phyllis", which the captions hear as "so let's"; only "Stanley" is in
    //   both. V2 (blind 70 %, right): the distractors were a promotion and a half-heard "put up with". Now three
    //   paranoid readings, one built on "are they paying you".
    // why: paid to keep quiet ← "are they paying you" (keyword, wrong relation); letting her take the blame ← the
    //   frame-up script, with "put" heard as "put it on you"
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'putup', seg: [97.85, 100.87],
      stem: 'When Dwight’s questions turn to his coworkers, what does he suspect?',
      choices: ['They got Kelly to do it for them', 'They paid Kelly to keep quiet about it',
                'They let Kelly take the blame for it'], a: 0,
      cue: '名前の前後、put で始まる質問。',
      line: '…*put you up to this*? Stanley, *are they paying you*?',
      said: '「誰かにやらされたのか？スタンリー、金をもらってるのか？」と疑う。',
      mean: 'put 人 up to 〜 ＝ 人をそそのかして〜させる。黒幕は別にいる。',
      trap: 'paying が残ると口止め料に聞こえる。put you up to this で「やらせた」。',
      use: 'Who put you up to this?（誰にやれって言われたの？）' },

    // R fix: V2 (blind 85 %, right): only the key held a contradiction. All three now start "the brains, yet…".
    // why: someone's helper ← "too stupid to do it by yourself" heard as "she only helps" (half the line); too scared
    //   ← "Of course I am" read as daring her to admit it
    { id: 'h4', skill: 'humor', level: 'C1', point: 'mastermind', seg: [100.85, 105.8],
      stem: 'Why does Dwight’s explanation of Kelly’s role get a laugh?',
      choices: ['He calls her the brains, yet too dim to act alone', 'He calls her the brains, yet just someone’s helper',
                'He calls her the brains, yet too scared to admit it'], a: 0,
      cue: 'mastermind と、but のあとを比べる。',
      line: 'I know you’re *the mastermind*, but you’re *too stupid* to do it by yourself.',
      said: '「お前が黒幕なのは分かってる。だが一人でやるには頭が足りない」と言う。',
      mean: '黒幕（頭脳）なのに頭が悪い、と一文で矛盾している。本人は筋が通っているつもり。',
      trap: '後半を「手下だ」と取りやすいが、言うのは too stupid。矛盾が笑い。',
      use: 'You’re the brains of this, aren’t you?（これを考えたのは君だろ）' },

    // R fix: V2 (blind 70 %, right): only the key objected. All three now object first and differ in the second move.
    // why: saying sorry ← "Yeah" at the start heard as giving in, plus the Japanese frame of smoothing things over at
    //   work; who's been talking ← "maybe if…" heard as her guessing at the source of his idea
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'nook', reveals: ['polite'], seg: [109, 115.72],
      stem: 'How does Kelly react to being called stupid?',
      choices: ['She objects, then turns the blame back on him', 'She objects, then says sorry to calm him down',
                'She objects, then asks who has been talking'], a: 0,
      cue: 'Yeah のあと、and maybe で始まる後半。',
      line: 'Yeah, you just can’t come into my nook and *call me stupid*.',
      said: '「人の場所に来てバカ呼ばわりはないでしょ」と言い返し、評価の話で突き返す。',
      mean: '文頭の Yeah は同意でなく「そうよ」と勢いをつける語。怒っている。',
      trap: 'Yeah を「うん」と同意に取りやすい。続く can’t と maybe if で反撃と分かる。',
      use: 'You can’t just yell at me.（いきなり怒鳴るなんてないでしょ）' },

    // R fix: V2 (blind 90 %, right): nt2's stem says "and polite"; nt2 now reveals `polite`. "Too long to answer
    //   calls" swapped for a salesman's complaint as likely as rudeness.
    // why: pushy ← the salesman script plus "redouble my order"; errors ← "redouble my order" from the call
    { id: 'd3', skill: 'detail', level: 'B1', point: 'polite', seg: [109, 115.72],
      stem: 'According to Kelly, why do people give Dwight bad reviews?',
      choices: ['He isn’t nice or polite enough', 'He pushes customers too hard to buy',
                'He makes too many errors on orders'], a: 0,
      cue: 'maybe if のあと、二つの形容詞。',
      line: '…*nice and polite*, then people wouldn’t give you such bad customer reviews.',
      said: '「もう少し感じよく礼儀正しければ、ひどい評価はつかないのに」と言う。',
      mean: '評価が悪いのは陰謀ではなく、Dwight の態度のせいだ、という指摘。',
      trap: '客の評価と聞くと、押し売りやミスを想像しやすい。if のあとの形容詞が理由。',
      use: 'Be a little nicer to customers.（お客さんにもう少し優しく）' },

    // C2 dict: weak words at speed, and a form grammar would "correct"
    // anchor: 111.6–113.4 s both sources "if you were a little bit more nice and polite"; four weak words before "nice",
    //   and "more nice" where grammar expects "nicer"
    // R fix: B1: the stem's "and polite" gives d3's key, so nt2 reveals `polite`; its line holds s1's "little", so it
    //   reveals that too. S4: the end cut "then"; the segment now runs to after "reviews".
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'morenice', reveals: ['polite', 'little'], seg: [111.45, 115.75],
      stem: 'Type what Kelly says: “maybe if you were ___ and polite” (5 words)', answer: 'a little bit more nice',
      cue: 'were のあと、polite の前まで。弱い語も全部。',
      line: 'maybe if you were *a little bit more nice* and polite',
      said: '「もうちょっと感じよく礼儀正しければ」。a little bit more は弱く速い。',
      mean: '話し言葉では、polite と並べて nicer でなく more nice と言うこともある。',
      trap: '習った nicer に直したくなり、a や bit も落としやすい。聞こえた5語を書く。',
      use: 'Could you be a little bit more careful?（もうちょっと気をつけてくれる？）' },

    // R fix: V2 (blind 90 %, right): only the key was about Kelly, and "Ryan" is never said (a face). Now three
    //   causes of Kelly's mood, each from something said in the scene.
    // why: sided with Dwight ← Jim's "Sorry about Dwight" (keyword, wrong relation); Darryl ← Jim asks "how are you and
    //   Darryl?" and gets a short answer, heard as a sore spot
    { id: 'g2', skill: 'gist', level: 'B2', point: 'missed', reveals: ['curt', 'party'], seg: [135, 215],
      stem: 'Across his talks with Kelly and others, what is Jim piecing together?',
      choices: ['Why Kelly is upset with him: he missed her party', 'Why Kelly is upset with him: he sided with Dwight',
                'Why Kelly is upset with him: he joked about Darryl'], a: 0,
      cue: '最後の電話で Jim が聞くことと、その答え。',
      said: 'Kelly の冷たさに気づいた Jim は、同じマグから、行かなかった会にたどり着く。',
      mean: 'Kelly の怒りは、パーティーに来なかったせいだと分かってくる。',
      trap: 'Dwight や Darryl の名前が残ると、それが原因に聞こえる。最後の答えを待つ。',
      use: 'Wait, did I miss a party?（待って、パーティーを逃した？）' },

    // R fix: V2 (blind 75 %, right): "her short chat" in the stem gave "brief" away. The stem now names the moment;
    //   the choices are three moods, one with the right mood and the wrong cause.
    // why: cheerful ← "we're cool" read as "great"; upset about Darryl ← the mood is right but pinned on Darryl, while
    //   "we're cool" says they're fine
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'curt', reveals: ['noactually'], seg: [139.7, 153.2],
      stem: 'How does Kelly come across when Jim asks about Darryl?',
      choices: ['Distant, and ending the chat fast', 'Cheerful, and happy to talk about him',
                'Upset, because things with him are bad'], a: 0,
      cue: 'Kelly の返事の長さと数。',
      line: 'Hey, how are you and Darryl? — *Um, we’re cool.* — *Bye.*',
      said: 'Jim が話しかけても、Kelly は「うん、順調」「じゃあね」で終わらせる。',
      mean: 'いつもはおしゃべりな人が一言で切り上げる。何か怒っている合図。',
      trap: 'we’re cool は「順調」。Darryl とは問題ない。機嫌は返事の短さに出る。',
      use: 'We’re cool. See you.（大丈夫。またね）' },

    // why: fifty ← -teen/-ty; five ← only the first syllable caught
    { id: 'n1', skill: 'number', level: 'B1', point: 'minutes', seg: [154.2, 161.4],
      stem: 'What length of time does Jim mention in his question about Kelly?',
      choices: ['Five minutes', 'Fifteen minutes', 'Fifty minutes'], a: 1, keep: true,
      cue: 'go on for のあと、数と単位。',
      line: 'where she didn’t go on for *15 minutes* without taking a breath?',
      said: '「Kelly が15分しゃべり続けなかった会話なんて、ある？」と聞く。',
      mean: 'go on ＝ 話し続ける。息つく間もなく、と大げさに言う。',
      trap: 'fifteen は後ろを強く長く、fifty は前を強く短く言う。語尾の「ティーン」を聞く。',
      use: 'She went on for an hour.（彼女は1時間しゃべり続けた）' },

    // R fix: V2 (blind 50 %, right): the key was the only choice about Kelly talking a lot. Now all three are about how
    //   their talks go.
    // why: rarely says much ← the Japanese いいえ frame: "no" as rejecting the question's picture of a talker; never
    //   talked ← "No" heard as answering only "have you ever had a conversation"
    { id: 'i3', skill: 'infer', level: 'C1', point: 'noactually', reveals: ['minutes'], seg: [154.2, 162.53],
      stem: 'What does the short reply to Jim’s question about Kelly mean?',
      choices: ['Kelly always talks at length with her too', 'Kelly rarely says much when they talk',
                'She has never really talked with Kelly'], a: 0,
      cue: '質問の中の否定と、返事の No の関係。',
      line: 'Have you ever had a conversation with Kelly where she *didn’t* go on for 15 minutes…? — *No, actually.*',
      said: '「長話しなかった会話ってある？」に「ないね、そういえば」と答える。',
      mean: '「長話しなかったことはない」＝いつも長話。今日の短さは変だ。',
      trap: '「いいえ」と取ると逆に聞こえる。英語の No は「そんな会話はなかった」。didn’t まで含めて考える。',
      use: 'No, actually, now that you mention it.（ううん、言われてみれば）' },

    // R fix: V2 (blind 85 %, right): a board game and the news were out of place at work (and g2's old distractor
    //   said "office politics"). Now both literal readings sit in the office.
    // why: talking politics ← "politics" read as government politics; games ← "play… game" taken literally
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'politics', seg: [175.3, 178.5],
      stem: 'When Jim asks if Kelly is mad at him, what does the reply mean?',
      choices: ['He keeps out of office power plays now', 'He no longer plays games at the office',
                'He no longer talks about politics at work'], a: 0,
      cue: 'anymore の前、何を「しない」か。',
      line: 'Oh, I *don’t play the politics game* anymore, Jim.',
      said: '「ああ、僕はもう社内政治はやらないんだ、Jim」と答える。',
      mean: 'politics game ＝ 職場の駆け引き。関わらない、と逃げている。',
      trap: 'politics を国の政治、game を遊びと取りやすい。職場で politics と言えば駆け引き。',
      use: 'I stay out of office politics.（社内政治には関わらない）' },

    // R fix: V2 (blind 60 %, right): "go on" ignored the "Wait". Now a near miss: "That's pretty weird" heard as a
    //   comment on the story.
    // why: the story is strange ← "That's pretty weird" right after the New York story; a moment to think ← "Wait"
    //   as "hold on, let me catch up"
    { id: 'pr4', skill: 'pragma', level: 'B2', point: 'wait', seg: [187.1, 193.6],
      stem: 'When asked “Can I tell you what else I learned?”, what does the listener do?',
      choices: ['He breaks in to point out something he’s spotted', 'He breaks in to say the story sounds strange',
                'He breaks in to ask for a moment to think'], a: 0,
      cue: 'Wait のあと、話題が何に変わるか。',
      line: 'Can I tell you what else I learned? — *Wait.* That’s pretty weird. … Andy has *a mug just like that*.',
      said: '「ほかにも話そうか？」に「待って、変だな。Andy も同じマグだ」と返す。',
      mean: 'Wait ＝ 話をさえぎり、気づいたことに話題を移す合図。長話を止めている。',
      trap: 'pretty weird を話への感想と取りやすい。すぐ mug の話に移れば、さえぎり。',
      use: 'Wait, isn’t that my jacket?（待って、それ私の上着じゃない？）' },

    // R fix: V2 (blind 60 %, right) and S3 (the cue's "out" was only in the key). Now three party gifts that differ in
    //   direction and reason.
    // why: from the guests ← "favor" read as a favor done for Kelly (katakana フェイバー), so the gift runs the other way;
    //   prizes ← "party" plus the talent show named next
    { id: 'p4', skill: 'phrase', level: 'B2', point: 'favors', seg: [190.85, 196.5],
      stem: 'What does the speaker say the mugs were?',
      choices: ['Gifts Kelly gave each guest at her party', 'Gifts the guests gave Kelly at her party',
                'Prizes Kelly gave the winners at her party'], a: 0,
      cue: 'Kelly のあと、party で始まる二語。',
      line: 'Kelly *gave them out*… *party favors*.',
      said: '「ああ、Kelly がパーティーのおみやげに配ったんだよ」と言う。',
      mean: 'party favors ＝ パーティーで客に配る小さな記念品。',
      trap: 'favor を「親切」と取ると、客からのお礼に聞こえる。party favors で一語、配るのは主催者。',
      use: 'We gave out candy as party favors.（パーティーのおみやげにお菓子を配った）' },

    // why: goodbye to summer ← "over the summer" heard as the reason for the party; a talent contest ← "Got Talent"
    //   taken as an office event
    { id: 'd5', skill: 'detail', level: 'B1', point: 'party', seg: [196.4, 201.8],
      stem: 'What was Kelly’s party for?',
      choices: ['Watching a show’s last episode', 'Saying goodbye to the summer', 'A talent contest at the office'],
      a: 0,
      cue: 'What party? への答え、finale の前後。',
      line: '…*America’s Got Talent finale party* over the summer.',
      said: '「夏にあった、テレビ番組の最終回を見るパーティー」と答える。',
      mean: 'finale ＝ 最終回。over the summer は「夏の間に」で、理由ではない。',
      trap: 'summer が最後に聞こえるので、夏の会と取りやすい。party の前の語が中身。',
      use: 'We’re having a finale party Sunday.（日曜に最終回を見る会をする）' },

    // why: working late ← the office setting and the usual excuse; never told ← Jim's "do you know anything about this
    //   party?" heard as him never having heard of it
    { id: 'd6', skill: 'detail', level: 'B1', point: 'skip', seg: [207.9, 212.85],
      stem: 'According to the answer Jim gets, why did he skip the party?',
      choices: ['He chose to go and see her instead', 'He had to work late on the night',
                'He was never told about the party'], a: 0,
      cue: 'Yes のあと、but の後半。',
      line: 'I said you *definitely should go*, but *you wanted to visit me instead*.',
      said: '「行くべきって言ったのに、あなたは私に会いに来るほうを選んだ」と答える。',
      mean: 'Jim は知っていて、行かないほうを選んでいた。本人が忘れていただけ。',
      trap: '誘われなかった話だと思い込みやすい。I said で、前に知らせていたと分かる。',
      use: 'I wanted to see you instead.（代わりにあなたに会いたかった）' },
  ]
};
