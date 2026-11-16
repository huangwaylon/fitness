// REVIEW 2026-11-16: pass 10, fix 10, drop 0, new 0; ear checks 7
// REVIEW Q: g1, t2, s2, r1, x1 are the GUIDE's own examples, so my blind read of them was contaminated; I judged them on the
//   choices alone. s2 now has 3 choices, so it no longer matches the GUIDE's copy.
// REVIEW Q: w1 — if Rachel herself asks “Does anybody need coffee?”, its “Rachel, offering to bring it” choice reads oddly; confirm the asker.
// “Rachel Is a Bad Waitress | Friends” (the official Friends channel, Best of Season 1): Rachel asks her boss Terry
// for an advance on her pay, and he tells her how her work really is.
// Segments from the captions, words from whisper (2026-11-16).
// EAR CHECK: 10.6 s a1 — who says “An advance?” (assumed Terry, repeating her word as a question; captions run it into Rachel's line), and that it sounds doubtful, not a hearing check
// EAR CHECK: 19.9 s s3 — the weak “I've” in “but I've sort of started” (whisper and captions both have I've; confirm the v is heard)
// EAR CHECK: 4.6 s x2 — “was” is weak in “but I was wondering” (both agree on the words)
// EAR CHECK: 27.6 s t2 — tone of “Rachel, Rachel, sweetheart…”: gentle and sincere, not mocking (key rests on tone)
// EAR CHECK: 42.3 s r1 — the cut falls after “I'm with you” and the “um”, before “but”
// EAR CHECK: 46.6 s x1 — “doing better”: the flapped t (captions: “I'm I'm doing better”, whisper drops the repeat)
// EAR CHECK: 50.5 s s2 w1 h1 — who asks “Does anybody need coffee?” (assumed Terry; captions don't say); w1 and h1 are keyed so either speaker works, but confirm two customers answer (“Yeah, over here” / “Yeah, I do”)
import type { Clip } from '../types.ts';

export const waitress: Clip = {
  id: 'waitress', video: 'lm2MpPpkGL8', title: 'Rachel Is a Bad Waitress', dur: 68, wpm: 126, band: 'slow',
  tags: ['職場', 'お願い・断り'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // why: day off ← Thanksgiving + family read as a holiday request; raise ← salary + "haven't worked here very long"
    { id: 'g1', skill: 'gist', level: 'B1', point: 'ask', reveals: ['amount'], seg: [0, 26],
      stem: 'What does Rachel want from Terry?',
      choices: ['A day off over Thanksgiving', 'Part of her pay ahead of time', 'A raise after her first month'], a: 1,
      cue: '「salary」の少し前、お金の頼み方に注目。', line: 'if I got a *hundred dollar advance* on my salary?',
      said: '給料の一部を先にもらえないか、と上司に頼んでいる。理由はこのあと長く説明する。',
      mean: 'advance ＝ 前払い・前借り。昇給（raise）とは別の話。',
      trap: 'Thanksgiving が聞こえるので「休み」を選びやすいが、頼んでいるのはお金。',
      use: 'Could I ask for an advance?（前借りをお願いできますか）' },

    // R fix: blind pass 65 %: the key was the only nuanced choice; "complains about pay" → an agrees reading that shares
    //   the key's first half
    // why: boss agrees ← "sweetheart" heard as a soft yes; may lose her job ← "terrible waitress" + the usual firing script
    { id: 'g2', skill: 'gist', level: 'B2', point: 'scene', reveals: ['ask', 'outcome'], seg: [0, 54],
      stem: 'What is this conversation mainly about?',
      choices: ['A new waitress asks a favor and gets honest feedback',
                'A new waitress asks a favor and her boss agrees',
                'A boss warns a new waitress she may lose her job'], a: 0,
      cue: '前半はだれが頼み、後半はどう返されるか。',
      said: '前半は新人がお願いをし、後半は上司が仕事ぶりについて率直に答える。',
      mean: '頼みごとの答えが「はい・いいえ」ではなく、仕事の評価として返ってくる場面。',
      trap: 'sweetheart で「いいよ」、terrible でクビの話と取りやすいが、どちらも出ない。',
      use: 'Can I ask you a favor?（ちょっとお願いしていい？）' },

    // Retired with the bank (2026-11-16): the 8-item lesson's s1, i1, p1 and i2, kept for old rows and flags (their
    // ids are never reused; the bank's items on those points took new ids). Points set to the bank item's.
    { id: 's1', skill: 'sound', level: 'B2', point: 'wondering', seg: [0, 8], retired: true, stem: '“I was ___, do you think it would be possible…”',
      choices: ['wondering', 'thinking', 'hoping'], a: 0,
      cue: '最初の「I was」の後、-ing で終わる言葉。',
      line: 'but I was *wondering*, do you think it would be possible',
      said: '「〜できないかなと思って」と、控えめに頼んでいる。',
      mean: 'I was wondering… ＋ do you think… で二重に丁寧。',
      trap: 'thinking / hoping も文としては自然。音で wondering を聞き分けましょう。',
      use: 'I was wondering if you could help me.（手伝ってもらえないかと思って）' },

    // R fix: blind pass 85 % (apology and training were off the request); now an excuse-in-advance and a thank-you
    //   frame. reveals: its line has no "I've", but does show "a hundred dollar advance": ive → amount, ask.
    // why: excuse her work ← new + the criticism that comes later; thanks ← Japanese frame (お世話になってます before a request)
    { id: 'p0', skill: 'pragma', level: 'B2', point: 'preface', reveals: ['wondering', 'amount', 'ask'], seg: [0.9, 10.2],
      stem: 'Why does Rachel start with “I know that I haven’t worked here very long”?',
      choices: ['To soften the big ask that comes next', 'To excuse her slow work as a new hire',
                'To thank him for giving her the job'], a: 0,
      cue: '前置きのあと、何を頼んでいるか。',
      line: 'I know that I haven’t worked here very long, but I was wondering… if I got a hundred dollar *advance*',
      said: '「まだ日が浅いのは分かっているけど」と前置きしてから、前借りの話を切り出す。',
      mean: '自分の弱い点を先に認めて、頼みにくいお願いを和らげる言い方。',
      trap: '日本語の「お世話になってます」や言いわけに聞こえやすいが、but のあとが本題。',
      use: 'I know it’s short notice, but…（急なのは分かってるけど…）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'wondering', seg: [3.7, 6.7],
      stem: 'Type what she says: “but I ___, do you think…” (2 words)', answer: 'was wondering',
      cue: '「but I」のすぐあと。最初の語はとても弱い。', line: 'but I *was wondering*, do you think it would be possible…',
      said: '遠慮がちにお願いを始めている。was は「ワz」と弱い。',
      mean: '丁寧な頼みの決まった出だし。過去形で控えめにしている。',
      trap: 'was が聞こえず I wondering と書きやすい。wandering とも似た音。',
      use: 'I was wondering if you could help me.（手伝ってもらえないかなと思って）' },

    // why: $200 ← the weak "a" before hundred heard as "two"; $1,000 ← hundred/thousand, both end in a soft "d"
    { id: 'n1', skill: 'number', level: 'B1', point: 'amount', seg: [6.2, 10.4],
      stem: 'How much money does Rachel ask for?',
      choices: ['$100', '$200', '$1,000'], a: 0, keep: true,
      cue: '「dollar」の直前の数字。', line: 'if I got a *hundred dollar* advance on my salary?',
      said: '100ドルの前借りを頼んでいる。a は弱く短い。',
      mean: '数字が名詞の前に来ると dollar と単数になる。',
      trap: '弱い a が two に、hundred が thousand に聞こえやすい。数字の前の短い音に注意。',
      use: 'Is there a twenty-dollar minimum?（20ドル以上からですか）' },

    // R fix: blind pass 60 %: the key was the longest and "corrects a word" a filler; now a hearing-check reading
    //   (tone decides; on the EAR CHECK)
    // why: accepts ← a reply right after a request often means yes; hearing check ← an echo read as 確認
    { id: 'a1', skill: 'pragma', level: 'B2', point: 'echo', seg: [6.2, 14.6],
      stem: 'Right after her request, what does the reply “An advance?” do?',
      choices: ['It shows doubt, so she starts to explain', 'It checks that he heard the word right',
                'It accepts and moves on to the details'], a: 0,
      cue: '短い返事の上がり調子と、そのあとの彼女の話。',
      line: '*An advance?* — It’s so that I can spend Thanksgiving with my family.',
      said: '相手の言葉をそのまま上がり調子で返され、レイチェルはすぐ理由を説明し始める。',
      mean: 'くり返しの質問は驚きや疑いを表し、「どういうこと？」と説明を求める働き。',
      trap: '言葉をくり返すと「訂正」や「確認」に聞こえやすい。返事のあと相手が何をするかで判断する。',
      use: 'A refund? For what reason?（返金？どういう理由で？）' },

    // why: Thanksgiving dinner ← keyword in the first line; paying back ← father + ticket in the wrong relation
    { id: 'd1', skill: 'detail', level: 'B2', point: 'reason', reveals: ['father'], seg: [11.6, 19.8],
      stem: 'What does Rachel need the money for?',
      choices: ['Her own ticket for a family ski trip', 'A big Thanksgiving dinner for her family',
                'Paying her father back for a ticket'], a: 0,
      cue: '「every year」から先、何にお金がかかるか。',
      line: 'every year we go *skiing* … and normally my father pays for my *ticket*',
      said: '毎年家族でスキーに行き、いつもは父親がチケット代を出している。',
      mean: '感謝祭は「いつ」の話。お金が必要なのは旅行のチケット。',
      trap: 'Thanksgiving から「夕食」を連想しやすい。father と ticket の関係も取り違えやすい。',
      use: 'I need to book my ticket home.（帰りのチケットを取らないと）' },

    // R fix: blind pass 80 % ("changes the subject" a filler); now the told-you-so "See", the word's other common job
    // why: look ← literal see = 見る; told you so ← "See?" used to prove a point
    { id: 'm1', skill: 'marker', level: 'B2', point: 'see', seg: [11.6, 19.8],
      stem: 'When Rachel says “See, every year…”, what does “See” do?',
      choices: ['It starts the story behind her request', 'It points out she was right all along',
                'It asks Terry to look at something'], a: 0,
      cue: '文頭の短い一語と、そのあとの説明。', line: '*See*, every year we go skiing in Vail…',
      said: '感謝祭の話のあと、「というのはね」と事情を話し始める。',
      mean: 'この see は「見て」ではなく、説明を始める合図。「実はね」「つまりね」に近い。',
      trap: 'see ＝ 見る と文字通りに取りやすい。文頭の See, は「これから説明する」の合図と覚えておく。',
      use: 'See, the thing is, I’m new here.（実はね、ここは初めてなんです）' },

    // why: whole family ← "spend Thanksgiving with my family"; herself ← "this whole independent thing"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'father', reveals: ['reason'], seg: [14.3, 19.8],
      stem: 'Who normally pays for Rachel’s ticket?',
      choices: ['Her father', 'Her family', 'Rachel herself'], a: 0,
      cue: '「normally」のあと。', line: 'and normally my *father* pays for my ticket',
      said: 'いつもはチケット代を父親が払ってくれている、と言っている。',
      mean: 'normally ＝ ふだんは。今年は違う、という話の前ぶれになっている。',
      trap: 'family も independent も聞こえて迷いやすい。normally の直後を聞く。',
      use: 'Normally I take the bus.（ふだんはバスで行きます）' },

    // R fix: blind pass 85 % (the key the only nuanced choice); distractors rebalanced. Its stem names who normally
    //   pays (d2's key): reveals father. Level C1 → B2: two adjacent lines tied ("independent thing… why I took this job").
    // why: refused ← the usual "dad cut me off" script; fallen out ← "but" after "my father pays" heard as a quarrel
    { id: 'i3', skill: 'infer', level: 'B2', point: 'independent', reveals: ['ive', 'father'], seg: [16.3, 26],
      stem: 'Why isn’t Rachel letting her father pay this year?',
      choices: ['She wants to pay her own way now', 'Her father said no to paying this time',
                'She’s fallen out with her father lately'], a: 0,
      cue: '「but」のあと、自分について何を始めたか。',
      line: 'but I’ve sort of started this whole *independent* thing … which is actually why I took this job',
      said: '最近「自立」を始めたところで、この仕事を始めたのもそのためだ、と言っている。',
      mean: 'はっきり言わないが、父親に頼らず自分で払いたいという意味になる。',
      trap: '「父親が断った」はよくある筋書きだが、彼女はそう言っていない。but のあとに本当の理由が来る。',
      use: 'I’m trying to pay my own way.（自分のお金でやっていこうとしてるの）' },

    // why: I ← the weak 've disappears before "sort"; I'd ← 've and 'd both shrink to a short consonant
    { id: 's3', skill: 'sound', level: 'B2', point: 'ive', seg: [18.7, 22.3],
      stem: 'Fill the gap: “but ___ sort of started this whole…”',
      choices: ['I', 'I’ve', 'I’d'], a: 1,
      cue: '「but」のすぐあと、とても短い音。', line: 'but *I’ve* sort of started this whole independent thing',
      said: '「最近〜を始めちゃって」と話している。I’ve の v はほとんど聞こえない。',
      mean: '現在完了で「始めて、今もその最中」。have は弱くなり「アイv」と短い。',
      trap: 'v が次の s に飲まれて I に聞こえやすい。I’d だと過去の話になる。',
      use: 'I’ve just started a new job.（新しい仕事を始めたばかりです）' },

    // R fix: blind pass 85 % ("a better job" a filler next to "took this job"); now a freelance reading of independent
    // why: business ← literal "started a thing"; no boss ← independent = 独立・フリー
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'independent', reveals: ['ive'], seg: [18.7, 26],
      stem: 'What does Rachel mean by “this whole independent thing”?',
      choices: ['Her new plan to support herself', 'A small business she has started',
                'Her wish to work without a boss'], a: 0,
      cue: '「thing」のあと、なぜこの仕事をしているか。',
      line: 'I’ve sort of started this *whole independent thing*, you know, which is actually why I took this job',
      said: '最近「自立ってやつ」を始め、だからこの仕事に就いた、と言う。',
      mean: '新しい取り組みを少し照れてまとめる言い方。sort of でさらに軽くしている。',
      trap: 'independent を「独立して事業」と取りやすい。thing は仕事ではなく生き方の話。',
      use: 'I’m doing this whole healthy-eating thing.（健康的な食生活ってやつを始めたんだ）' },

    // why: sarcastic ← sweet word + harsh words looks like sarcasm; flirting ← katakana スイートハート = lover
    { id: 't2', skill: 'attitude', level: 'C1', point: 'tone', reveals: ['outcome'], seg: [26, 38.3],
      stem: 'When Terry says “Rachel, Rachel, sweetheart…”, is he being sarcastic?',
      choices: ['Yes; he is making fun of her request', 'No; he is softening a real criticism',
                'No; he is flirting with her a little'], a: 1,
      cue: '呼びかけのあと、声の調子が変わるかどうか。',
      line: 'Rachel, Rachel, *sweetheart*, you’re a *terrible, terrible waitress*.',
      said: '名前を2回呼び、sweetheart と付けてから、仕事ぶりがひどいと告げる。',
      mean: '上司の「ねえ君」に近い呼びかけで、悪い知らせを和らげる前置き。皮肉ではない。',
      trap: '皮肉なら笑うような言い方になる。ここは本気で、言いにくいことを優しく言っている。',
      use: 'Honey, I’m going to be honest with you.（あのね、正直に言うよ）' },

    // R fix: blind pass 75 %: the key was the only "no" and the shortest; now two refusals with different reasons
    // why: short of money ← the usual refusal script; works harder ← sweetheart heard as a soft yes
    { id: 'i4', skill: 'infer', level: 'C1', point: 'outcome', seg: [26, 38.3],
      stem: 'What does Terry’s reply suggest about the advance?',
      choices: ['No, because of how bad her work is', 'No, because the café is short of money',
                'Yes, as long as she works harder'], a: 0,
      cue: '頼みへの返事が「お金」の話かどうか。',
      line: 'you’re a terrible, terrible waitress. *Really, really awful.*',
      said: 'テリーは前借りについて何も答えず、仕事ぶりが本当にひどいとだけ言う。',
      mean: 'はっきり断らなくても、頼みの代わりに評価を返すことで「無理だ」と伝えている。',
      trap: 'no が聞こえないので「保留」や「条件付き」と考えやすい。答えの代わりに何を言ったかで判断する。',
      use: 'I’m afraid that’s not going to work.（申し訳ないけど、それは難しいです）' },

    // retired: the lesson's i1 and p1 (see s1’s note)
    { id: 'i1', skill: 'infer', level: 'B2', point: 'tone', seg: [26, 37], retired: true, stem: '“Rachel, Rachel, sweetheart…” — what does Terry’s tone tell you?',
      choices: ['A compliment is coming', 'Bad news, said gently', 'He is about to say yes'], a: 1,
      cue: '名前の呼び方と、その後の一言に注目。',
      line: 'Rachel, Rachel, *sweetheart*, you’re a *terrible, terrible waitress*.',
      said: '「君はひどい、本当にひどいウェイトレスだ」と言っている。',
      mean: '名前を2回呼び、sweetheart と付けるのは、悪い知らせを和らげる前置き。',
      trap: 'sweetheart は優しい言葉なので「ほめる」と思いやすい。',
      use: 'Honey, I have to be honest with you…（正直に言うとね…）' },
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'hear', seg: [37, 44], retired: true, stem: '“I hear what you’re saying, I’m with you” — what does Rachel mean?',
      choices: ['I understand, but let me push back', 'I agree, so I will quit now', 'Sorry, I can’t hear you well'], a: 0,
      cue: 'その次に来る「but」の後を聞いてみましょう。',
      line: 'Okay, *I hear what you’re saying*, I’m with you. *But* I’m trying really hard',
      said: '「言いたいことは分かる。でも頑張ってるし、良くなってると思う」。',
      mean: 'I hear what you’re saying ＝ 相手の言い分を受け止めてから反論する前置き。',
      trap: 'hear を「聞こえる」と取ると3番を選びやすい。',
      use: 'I hear what you’re saying, but…（おっしゃることは分かりますが…）' },

    // predict: the segment stops before "but"; the reveal plays the rest
    // why: apology ← Japanese "ごもっともです" then sorry; thank-you ← "I hear you" read as gratitude for honesty
    { id: 'r1', skill: 'predict', level: 'B2', point: 'hear', reveals: ['reply'], seg: [37.9, 42.3], then: [42.3, 50.2],
      stem: 'After “I hear what you’re saying, I’m with you”, what is she about to say?',
      choices: ['A “but”, then her side of it', 'An apology and a promise to leave', 'A thank-you for his honesty'], a: 0,
      cue: 'この言い方は、どんな話の前に使われることが多い？',
      line: 'Okay, I hear what you’re saying, I’m with you. *But* I’m trying really hard',
      said: '「分かる、うん。でも頑張ってるし…」と、but のあとで自分の言い分を言う。',
      mean: '受け止める前置きは、反論の予告になることが多い。',
      trap: '日本語の「おっしゃる通りです」は同意で終わることもあるが、この英語は but が来やすい。',
      use: 'I hear you. That said…（分かります。とはいえ…）' },

    // R fix: blind pass 80 %: the key was the only two-part, middle choice; now a distractor shares its frame
    // why: asks for time ← "I'm trying really hard" heard as a plea; promises ← "doing better" heard as a promise
    { id: 't3', skill: 'attitude', level: 'B2', point: 'reply', reveals: ['hear', 'better'], seg: [37.9, 50.2],
      stem: 'How does Rachel take Terry’s criticism?',
      choices: ['She half agrees, then defends her effort', 'She half agrees, then asks for more time',
                'She agrees and promises to do better'], a: 0,
      cue: '最初の受け止め方と、そのあとの本音。',
      line: 'I hear what you’re saying, I’m with you. But I’m *trying really hard*… I think I’m *doing better*.',
      said: '「分かる」と受けたあと、「でも頑張ってるし、良くなってる」と続ける。',
      mean: '一部は認めつつ、努力と進歩を伝えて自分を守っている。',
      trap: 'I’m with you は「全部その通り」と取りやすい。but の前は受け止め、後ろが本音と覚えておく。',
      use: 'Fair point, but I’m doing my best.（それはそうだけど、精一杯やってるよ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'better', reveals: ['reply'], seg: [44.9, 47.9],
      stem: 'Type what she says: “I’m ___.” (2 words)', answer: 'doing better',
      cue: '「I think」のあと。I’m は2回聞こえても気にしないで。', line: 'and I think I’m — I’m *doing better*.',
      said: '「良くなってると思う」と言っている。I’m を言い直してから続ける。',
      mean: 'doing better ＝ 前より上手くいっている。体調が良くなったときにも使う。',
      trap: 'better の t は弾んで「ラ」に近い。言い直しの I’m は書かない。',
      use: 'I’m doing better, thanks.（だいぶ良くなったよ）' },

    // R fix: cut "Is anybody" (K4): "Is anybody need" isn't grammatical, so it was the weakest of four
    // why: Doesn't ← a complaint reading, n't's t drops; Did ← only the d is caught
    { id: 's2', skill: 'sound', level: 'B2', point: 'does', seg: [49, 53.2],
      stem: 'Fill the gap: “___ need coffee?”',
      choices: ['Does anybody', 'Doesn’t anybody', 'Did anybody'], a: 0,
      cue: '文の最初、とても短く弱い音。', line: '*Does anybody* need coffee?',
      said: '店全体に「コーヒー要る人？」と聞いている。',
      mean: 'Does anybody が「ダゼニバディ」のようにつながる。does は弱く、ほぼ「ダz」。',
      trap: 'Doesn’t なら「誰も要らないの？」と不満の意味になる。n’t の t が消えても「ン」は残る。',
      use: 'Does anybody want the last slice?（最後の1切れ、要る人？）' },

    // why: Rachel ← she is the waitress, so she'd be expected to reply; Terry ← the asker answering himself
    { id: 'w1', skill: 'who', level: 'B1', point: 'coffee', reveals: ['does'], seg: [49, 54.3],
      stem: 'Who answers the question “Does anybody need coffee?”',
      choices: ['More than one customer', 'Rachel, offering to bring it', 'Terry, answering himself'], a: 0,
      cue: '質問のあと、返事の数と声の違い。',
      line: '— Yeah, *over here*. — Yeah, *I do*.',
      said: '質問のすぐあとに「こっち！」「私も！」と、別々の声が続けて答える。',
      mean: '店の客が何人も、まだコーヒーをもらっていなかったことが分かる。',
      trap: '店員が答えると思いやすいが、声は別人で、しかも2つ。返事の数を数えるくせをつける。',
      use: 'Over here, please!（こっちです、お願いします）' },

    // R fix: blind pass 60 %: the key was the longest choice; now three of one length. Added its line (only a gist or
    //   a who-by-voice may go without).
    // why: empty café ← "anybody" heard as "nobody"; teasing ← one answer heard as a joke, not a real order
    { id: 'h1', skill: 'humor', level: 'C1', point: 'coffee', reveals: ['does'], seg: [49, 57],
      stem: 'Why does the audience laugh after “Does anybody need coffee?”',
      choices: ['The quick replies prove Terry’s point', 'No one replies, so the café looks empty',
                'One customer says yes just to tease her'], a: 0,
      cue: '質問のあと、だれが何人、どんな勢いで答えるか。',
      line: '— Yeah, *over here*. — Yeah, *I do*.',
      said: '「コーヒー要る人？」に、客がすぐ次々と答える。',
      mean: '待たされていた客が大勢いた＝彼女の仕事ぶりがひどいという話が、目の前で証明されて笑いになる。',
      trap: 'anybody と nobody は聞き分けにくい。返事が来たかどうか、その数と速さを聞く。',
      use: 'Sorry for the wait!（お待たせしてすみません）' },

    // retired: the lesson's i2 (see s1’s note)
    { id: 'i2', skill: 'infer', level: 'B2', point: 'coffee', reveals: ['does'], seg: [49, 54], retired: true, stem: 'Why does she ask “Does anybody need coffee?” right then?',
      choices: ['To end the talk and show she can work', 'Because Terry asked her to', 'Because her shift is over'], a: 0,
      cue: '直前の会話の流れを思い出して、もう一度。',
      line: '*Does anybody need coffee?*',
      said: '店内のお客さんに「コーヒーいる人？」と声をかけている。',
      mean: '気まずい話を切り上げて、ちゃんと働けるところを見せようとしている。',
      trap: 'Terry は頼んでいない。会話の途中で急に言うのがポイント。',
      use: 'Anyway… does anyone need anything?（ところで、何かいる？）' },
  ]
};
