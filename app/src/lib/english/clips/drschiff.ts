// “Why Rachel Can’t Stop Flirting with Her Gynecologist | Friends” (the official Friends channel, Best of Season 8):
// Rachel finds herself drawn to every man she sees; a friend says it's normal around the fourth month of pregnancy.
// At her check-up a new doctor stands in, and Rachel treats the exam like a first date until he asks what's going on.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Rachel, Dr. Long, Dr. Schiff. The
// friend who carried triplets is never named, so items say "her friend".
// Untested on purpose: 0–15 s and 33 s (the sweatpants and "thrice as randy" lines), 25 s (captions "this is
// happening to you?", whisper "this has happened"), 57–60 s ("a good pill": its tone isn't settled by the words),
// 77–81 s (captions "Bald haircut", whisper "Bull haircut"), 132–138 s (the "lie down on the table" exchange).
// REVIEW 2026-11-17 (2nd): pass 12, fix 8 (7 for V2, d1 only for N6 notes), drop 0, new 0; ear checks 1. Cold blind pass first (11 of 19 at ≥ 50 %).
// REVIEW open: nt1 (C2) was still 70 % on a cold read after its rewrite, and a3 and n2 60 %; the title gives the scene.
// EAR CHECK: 86.6 s h3 — "Yes, you are." taken as Rachel's reply to "Hi, Rachel. I'm Dr. Schiff."
import type { Clip } from '../types.ts';

export const rachelFlirtsDoctor: Clip = {
  id: 'drschiff', video: 'HzoGcnrmtKs', title: 'Why Rachel Can’t Stop Flirting with Her Gynecologist', dur: 154,
  wpm: 151, band: 'mid', tags: ['恋愛', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %): the key was the only reassuring choice. All three now name a phase; the near misses
    //   flip "start" to "end" and blame stress instead of the pregnancy.
    // R fix (2nd review): V2 (blind 60 %: "stress, not the baby" was the odd one out). All three now say "a normal
    //   phase"; the new near miss "rare this early" mishears the month. N6: said trimmed (was 125).
    // why: should end soon ← "fourth month" heard as a finish line, "start" lost; rare this early ← "about the fourth
    //   month… right?" heard as surprise at the timing, "completely normal" lost
    { id: 'g1', skill: 'gist', level: 'B1', point: 'normal', reveals: ['fourth'], seg: [0, 60],
      stem: 'What does her friend tell Rachel about the way she feels?',
      choices: ['It’s a normal phase that starts about now', 'It’s a normal phase that should end soon',
                'It’s a normal phase, but rare this early'], a: 0,
      cue: '「Wait a second」のあと、友だちの最初の判断。',
      line: 'This is *completely normal*. Around the fourth month, your hormones *start going crazy*.',
      said: 'だれにでも惹かれるレイチェルに、友だちは「普通のこと。4か月目ごろから始まる」と言う。',
      mean: '妊娠中のホルモンのせいで、異常ではないと安心させている。',
      trap: 'fourth month を区切りと取ると「もう終わる」に聞こえる。start が始まりの合図。',
      use: 'Don’t worry, that’s completely normal.（心配しないで、よくあることだよ）' },

    // why: the third ← "triplets" (three) said a few lines later; the fifth ← "fourth" and "fifth" both end in a soft
    //   th after an f
    // R fix: S1/N7: "go wild" in the stem gave away p2's key; the stem now asks the month alone.
    { id: 'n1', skill: 'number', level: 'B1', point: 'fourth', seg: [16.2, 25],
      stem: 'According to her friend, which month of pregnancy is Rachel in?',
      choices: ['The third', 'The fourth', 'The fifth'], a: 1, keep: true,
      cue: '「Around the」のあと。2回出てくる。',
      line: 'about the *fourth month* … Around the *fourth month*, your hormones start going crazy.',
      said: '「今4か月目くらいでしょ？そのころホルモンが暴れだすの」。',
      mean: 'fourth は「フォース」。月を順番で言うので序数になる。',
      trap: 'あとの triplets（三つ子）から3を選びやすい。数字は言われた場所で聞く。',
      use: 'I’m in my fourth month.（今、妊娠4か月なんです）' },

    // R drop: p2 ("start going crazy"). V2/K3: blind 90 %, because both near misses meant "calm down" and the scene
    //   is about wild urges. "Go crazy" is also too plain for this tier (V3), and n1 and g1 hold the same moment.
    //   Never shipped, so deleted.

    // R fix: V2/K5 (blind 60 %): the key was the only abstract choice. All three are now "To show…" with a near
    //   miss from the clip's words.
    // why: holiday mood ← "store to store" + "Santa" heard as Christmas fun; top her friend ← the triplets line
    //   just before, so her story is heard as a contest
    { id: 'i1', skill: 'infer', level: 'B2', point: 'santa', seg: [35.6, 43.2],
      stem: 'Why does Rachel bring up what she did last weekend?',
      choices: ['To show the same urge was behind it', 'To show she’s been in a holiday mood',
                'To show she can top her friend’s story'], a: 0,
      cue: '「Wow」のすぐあとの短い一文。',
      line: '*Wow, this explains so much*. Last weekend, I went from store to store sitting on Santa’s laps.',
      said: '「それで説明がつく。先週末、店をはしごしてサンタのひざに座ってた」。',
      mean: '自分の変な行動の理由が分かった、という例。「謎が解けた」。',
      trap: 'store と Santa から買い物と取りやすい。店で何をしたかの動詞を聞く。',
      use: 'Oh, that explains a lot.（ああ、それで納得）' },

    // R fix: V2 (blind 60 %): the key was the only kind choice. The near misses are now a warning and a crush, both
    //   built from words in the story.
    // why: warn her ← "steal" heard as a caution; a crush ← a famous athlete's name + "I remember" heard as a
    //   confession about him
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'cutout', seg: [44.4, 51.6],
      stem: 'What is her friend’s story about the cardboard cutout meant to do?',
      choices: ['Match Rachel’s story with one of her own', 'Warn that the urges can get her in trouble',
                'Admit she once had a crush on an athlete'], a: 0,
      cue: '「Yeah, yeah. I remember」で始まる話。',
      line: 'Yeah, yeah. *I remember trying to steal* a cardboard cutout…',
      said: '「分かる分かる。私もスポーツ店から選手の等身大パネルを盗もうとした」。',
      mean: '同じような体験を返して、「あなただけじゃない」と共感を示している。',
      trap: 'steal（盗む）が強く聞こえ、注意の話と取りやすい。Yeah, yeah のあとの話は共感。',
      use: 'Oh, I’ve been there.（ああ、その気持ち分かる）' },

    // R fix: V2 (blind 60 %): the distractors weren't about the doctor at all. All three now involve the doctor
    //   and differ in when and how.
    // why: call today ← "I'll ask her" heard without "go see… tomorrow"; book a visit ← the present "I go see"
    //   heard as a plan still to be made
    // R fix (2nd review): N6 (notes 126); the "her" gloss trimmed.
    { id: 'd1', skill: 'detail', level: 'B1', point: 'pill', seg: [52, 58],
      stem: 'What does Rachel plan to do about how she feels?',
      choices: ['Bring it up at her checkup tomorrow', 'Call her doctor about it later today',
                'Book a checkup for later this week'], a: 0,
      cue: '「you know what?」のあと。いつ、どうやって。',
      line: 'I go see *my doctor tomorrow*. *I’ll ask her* about this.',
      said: '「明日お医者さんに行くから聞いてみる。薬か何かくれるかも」。',
      mean: 'I go see ～ は決まった予定を言うくだけた形。',
      trap: '現在形の go を「これから予約」と取りやすい。tomorrow まで聞くと、もう決まった予定。',
      use: 'I’ll ask my doctor about it.（お医者さんに聞いてみる）' },

    // R fix: V2 (blind 90 %, §9.4): the title answered "she acts as if it were a date". The stem now asks how it
    //   ends, and the near misses give the doctor another reaction. It now also reveals 'feelit'.
    // R fix (2nd review): V2 (blind 70 %: the title still pointed at the key). "asks her to leave" → "He's charmed,
    //   and she takes it as interest", so the choice turns on his "I'm sorry, is there something going on here?"
    // why: flirts back ← the title + "Do you feel it, too?" heard as both of them feeling it; charmed ← "something
    //   going on here" heard as his own interest, the "I'm sorry" frame lost
    { id: 'g2', skill: 'gist', level: 'B2', point: 'date', reveals: ['ski', 'doctor', 'feelit'], seg: [62, 143],
      stem: 'How does Rachel’s appointment end up?',
      choices: ['He’s puzzled, and she takes it as interest', 'He flirts back, and she gets nervous',
                'He’s charmed, and she takes it as interest'], a: 0,
      cue: '最後の、先生の質問と彼女の返事。',
      line: 'Where are you from? What do you do? … *is there something going on here?* — *Do you feel it, too?*',
      said: '代わりの先生に出身や趣味、恋人の有無まで聞き、診察の質問はかわし、最後は先生に戸惑われる。',
      mean: 'ホルモンのせいで、診察がデートのようになってしまう。',
      trap: '最後の質問を口説き返しと取りやすい。I’m sorry で始まる質問は、ふつう戸惑いの合図。',
      use: 'We got off on the wrong foot.（出だしでつまずいちゃったね）' },

    // why: in trouble ← an opening before news often heard as a warning; a secret ← "just so you know" heard as
    //   "between us"
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'justso', reveals: ['hospital'], seg: [63.4, 70.3],
      stem: 'At the office, how is Rachel’s change of doctor first introduced?',
      choices: ['As a plain heads-up for her', 'As a warning that she is late', 'As a secret just between them'], a: 0,
      cue: '最初のあいさつの直後、文頭の4語。',
      line: '*Just so you know*, Dr. Long can’t be here today.',
      said: '「念のためお伝えすると、ロング先生は今日いらっしゃいません」。',
      mean: 'Just so you know ＝ 一応知らせておくと。悪い知らせとは限らない軽い前置き。',
      trap: '前置きがあると警告や内緒話と取りやすい。ここはただの事務的な連絡。',
      use: 'Just so you know, I’m running late.（一応言っとくと、少し遅れるね）' },

    // why: on vacation ← "can't be here today" heard as a planned absence; another patient ← "seeing you" heard as
    //   the reason she's busy
    { id: 'd2', skill: 'detail', level: 'B1', point: 'hospital', reveals: ['seeing'], seg: [65, 70.3],
      stem: 'Why can’t Rachel’s usual doctor see her today?',
      choices: ['She was called to the hospital', 'She is away on a short vacation',
                'She is busy with another patient'], a: 0,
      cue: '理由を言う文の、動詞のあとの場所。',
      line: 'She was *called to the hospital*, so Dr. Schiff will be seeing you.',
      said: '「病院に呼ばれたので、今日はシフ先生が診ます」。',
      mean: 'be called to ～ ＝ 急に～へ呼び出される。代わりの先生が来る理由。',
      trap: 'seeing you が聞こえ、別の患者を診ていると取りやすい。called のあとの場所を聞く。',
      use: 'She got called into a meeting.（彼女は会議に呼ばれちゃって）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'seeing', seg: [67.4, 70.3],
      stem: 'Type what Rachel is told: “so Dr. Schiff ___.” (4 words)', answer: 'will be seeing you',
      cue: '「Dr. Schiff」のあと、最後まで。',
      line: 'so Dr. Schiff *will be seeing you*.',
      said: '「なので、シフ先生が診察します」。',
      mean: 'will be seeing you ＝ 予定として診る。受付や病院でよく聞く丁寧な言い方。',
      trap: 'will be は弱く「ウルビ」とつながる。seeing は「見る」ではなく「診る、会う」。',
      use: 'The manager will be seeing you shortly.（担当者がまもなく参ります）' },

    // why: Is it ← the set phrase "Is it just me" is the one learners know; Wasn't it ← a negative question heard
    //   in the long "or"
    { id: 's1', skill: 'sound', level: 'B2', point: 'wasitme', seg: [70.8, 77],
      stem: 'Fill the gap: “___ me or was the guy… really cute?”',
      choices: ['Is it', 'Was it', 'Wasn’t it'], a: 1,
      cue: '質問の最初、とても短い2語。あとの文の時制も。',
      line: '*Was it* me or — or was the guy who took my blood sample really cute?',
      said: '「私だけ？採血した人、かわいくなかった？」。',
      mean: 'Was it が「ワズィッ」とつながる。後半の was と時制がそろう。',
      trap: 'Is it just me で覚えているとIsに聞こえやすい。後ろの was が手がかり。',
      use: 'Is it just me, or is it cold?（私だけ？寒くない？）' },

    // R fix: V2 (blind 60 %): "late" had nothing in the audio behind it. The near misses now come from the stand-in
    //   news and from a misheard question.
    // why: expected Dr. Long ← "Dr. Long can't be here" just before; heard a question ← "Dr. Schiff?" with a rising
    //   end makes "Yes" sound like a plain reply
    { id: 'h3', skill: 'humor', level: 'C1', point: 'yesyouare', seg: [83.6, 88.8],
      stem: 'Why does Rachel’s reply to the doctor’s introduction get a laugh?',
      choices: ['She answers his name like a flirty compliment', 'She reminds him she expected a different doctor',
                'She treats his name as if he’d asked a question'], a: 0,
      cue: '名乗ったあとの、3語の返事。声の調子。',
      line: 'Hi, Rachel. I’m Dr. Schiff. — *Yes, you are*.',
      said: '「こんにちは、シフです」に、うっとりと「ええ、そうね」と答える。',
      mean: '名乗りへの返事としては変。「あなたって素敵ね」と言うときの形で、もう惹かれている。',
      trap: '文字通りなら確認だが、名乗った人に「そうね」と返す意味はない。形と場面のずれを聞く。',
      use: 'Yes, you are!（ほんとにそうね！）' },

    // R fix: V2 (blind 70 %): the key was the only two-part answer. All three are now one reading each.
    // R fix (2nd review): V2 (blind 70 %: only the key fit the title's flirting). "blood test" → "a cue to talk about
    //   her love life", a date-flavoured near miss she doesn't take up ("really really good. But, enough about me").
    // why: love life ← the title + "how's it going?" heard as personal; a cue to list symptoms ← a doctor's question read
    //   literally, and "really really good" missed
    { id: 'i2', skill: 'infer', level: 'C1', point: 'howsitgoing', seg: [89.6, 98],
      stem: 'When the doctor asks “So, how’s it going?”, how does Rachel take it?',
      choices: ['As the sort of small talk you make on a date', 'As a cue to talk about her love life',
                'As a cue to list what’s been bothering her'], a: 0,
      cue: 'ひと言答えたあと、彼女が向ける質問。',
      line: 'So, how’s it going? — Oh, it’s really really good. *But, enough about me*… *What do you do?*',
      said: '体調の質問に「すごくいい」と一言で返し「私の話はいいから。何してる人？」。',
      mean: '診察の問いを、初対面の世間話として受け取っている。デート気分が出ている。',
      trap: '医者の how’s it going は体調のこと。返事のあとの質問で受け取り方が分かる。',
      use: 'So, how’s it going?（で、調子はどう？）' },

    // anchor: 91.56–93.12 s Rachel has said one short line ("it's really really good") before 93.6 s "But, enough
    //   about me", and that line answered a doctor's question about her own body
    // R fix (2nd review): V2 (blind 60 %, the C2 one rewrite): "a real apology" was a filler. The near miss now has
    //   the right count with the wrong content ("about him"); her one line answered about herself.
    // why: doctor talks too much ← "enough" heard as cutting the other person off; one line about him ← "it's really
    //   really good" heard as a compliment to the doctor
    // R fix: V2 (blind 60 %): the key stated what the set phrase means, so knowing the phrase was enough. It now
    //   names what the audio shows: she has said one line.
    { id: 'n2', skill: 'humor', level: 'C2', point: 'howsitgoing', seg: [89.6, 95],
      stem: 'Why is “enough about me” funny at this point?',
      choices: ['She has said only one line, not a long story', 'She cuts off a doctor who has talked too long',
                'She has said one line, and it was about him'], a: 0,
      cue: '彼女がそれまでに話した量と、話の中身。',
      line: 'Oh, it’s really really good. *But, enough about me*. Come on.',
      said: '体調を聞かれ「すごくいい」と一言答え、すぐ「私の話はもういいから」と話をふる。',
      mean: '自分の話を長々としたあとに使う言い方。一言しか話していないうえ、診察では彼女の話こそ本題。',
      trap: '相手を止める語と取りやすいが、止めているのは自分の話。決まり文句は場面と合うかを聞く。',
      use: 'But enough about me. How are you?（私の話はこれくらいで。あなたは？）' },

    // R fix: V2 (blind 65 %): "misheard" was vague. It now names which question he skips, so it's a real near miss.
    // why: proud ← "I'm a doctor" said firmly, read as boasting; the wrong question ← two questions in a row, and he
    //   answers only one
    { id: 'h4', skill: 'humor', level: 'B2', point: 'doctor', seg: [96, 101.6],
      stem: 'Why does the doctor’s answer “I’m a doctor” get a laugh?',
      choices: ['She asked her own doctor what job he has', 'He answers “where are you from” with his job',
                'He sounds a little too proud of his job'], a: 0,
      cue: '彼女の2つ目の質問と、今いる場所。',
      line: 'Where are you from? *What do you do?* — *I’m a doctor*.',
      said: '「出身は？お仕事は？」と聞かれ、「医者です」と答える。',
      mean: '診察中の医者に職業を聞くのはおかしい。答えが分かりきっているので笑いになる。',
      trap: '強めの言い方を自慢と取りやすいが、当たり前のことを言わされた戸惑い。質問の中身を聞く。',
      use: 'So, what do you do?（お仕事は何を？）' },

    // R fix: V2 (blind 50 %) and the why: comment described choices that weren't there. "Old school" had no
    //   source; it's now "what kind of doctor", the natural follow-up to "I'm a doctor".
    // why: home town ← "Where are you from?" asked just before; kind of medicine ← "I'm a doctor" invites "what
    //   kind?", and "actually" heard as narrowing the job question
    { id: 'm1', skill: 'marker', level: 'B2', point: 'meant', seg: [100.6, 109.4],
      stem: 'After his answer, how does Rachel try to save her question?',
      choices: ['She says she meant his free time', 'She says she meant his home town',
                'She says she meant his kind of medicine'], a: 0,
      cue: '「Right. Right.」のあと、言い直しの合図。',
      line: 'Right. Right. … *actually, I meant*, you know, *in your spare time*.',
      said: '「そうよね。いや、空いた時間に何してるかってこと」。',
      mean: 'actually, I meant は言い直しの合図。仕事以外の趣味を聞きたかった、とごまかす。',
      trap: 'Right を同意で終わりと取りやすいが、言い直しが続く。actually は修正の前ぶれ。',
      use: 'Sorry, I meant the other one.（ごめん、もう一つの方のこと）' },

    // why: married + cooks ← "wife" and "cook" are both said, in her question; single + cooks ← "cook" heard as his
    //   answer; girlfriend who skis ← "girlfriend" and "ski" both in his turn, the "don't" lost
    { id: 'd3', skill: 'detail', level: 'B2', point: 'ski', seg: [104.5, 113],
      stem: 'What does the doctor say about himself?',
      choices: ['He is single, and he skis', 'He is single, and he cooks', 'He is married, and he cooks',
                'He has a girlfriend who skis'], a: 0,
      cue: '彼の返事の、but の前とあと。',
      line: '*I don’t have a wife or a girlfriend*, but I *do like to ski*.',
      said: '「料理は？スキーは？奥さんか彼女と？」に「妻も恋人もいないけど、スキーは好き」。',
      mean: 'do like の do は強調。独身とスキーを一度に答えている。',
      trap: 'don’t の t が消えると have a wife に聞こえる。料理は彼女の質問の中だけ。',
      use: 'I don’t cook, but I do eat.（料理はしないけど、食べるのは好き）' },

    // R fix: V2 (blind 70 %): "mocks" and "just polite" were weak next to the key. The near misses are now a
    //   misread sarcasm and an invitation read into the question form.
    // R fix (2nd review): V2 (blind 70 %: "asks to go skiing" was easy to rule out). It's now "pleased, but plays it
    //   cool", the flirting script; "How amazing is this?" refutes it.
    // why: teases ← "How amazing is this?" heard as mocking a dull hobby; plays it cool ← the usual flirting script,
    //   and a flat "Oh, I love to ski" if the next line is lost
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'amazing', reveals: ['ski'], seg: [112.8, 117.2],
      stem: 'How does Rachel react to what they turn out to have in common?',
      choices: ['She makes far too much of a common hobby', 'She teases him for picking such a dull hobby',
                'She’s pleased, but tries to play it cool'], a: 0,
      cue: '最後の質問の形。答えを求めていない。',
      line: 'Oh, I love to ski. *How amazing is this?*',
      said: '「私もスキー大好き。すごくない？」と、大げさに喜ぶ。',
      mean: 'How amazing is this? は答えを求めない感嘆。よくある趣味の一致を運命のように扱う。',
      trap: '大げさな言い方を皮肉と取りやすいが、声も内容も本気の盛り上がり。質問の形の感嘆に注意。',
      use: 'How cool is that?（それ、すごくない？）' },

    // why: too shy to admit pain ← the Japanese frame of 遠慮 in front of a doctor; wants to stay ← "comfortable"
    //   heard as "I like it here"
    { id: 'h5', skill: 'humor', level: 'C1', point: 'comfortable', seg: [118, 126.8],
      stem: 'Why does Rachel’s answer about “discomfort” get a laugh?',
      choices: ['She answers as if he asked about the chair', 'She is too shy to admit that she is in pain',
                'She is hinting that she wants to stay long'], a: 0,
      cue: '医者の質問の語と、彼女の返事の語の違い。',
      line: 'are you experiencing any *discomfort*? — No, *I’m very comfortable*.',
      said: '「何か不快な症状は？」に「いいえ、とても居心地いいです」と答える。',
      mean: 'discomfort は体の不調の医学用語。彼女は「居心地」の話にすりかえる。',
      trap: '遠慮して隠したと取りやすいが、言葉を別の意味で受けたのが笑い。同じ語根の言いかえに注意。',
      use: 'Make yourself comfortable.（楽にしてね）' },

    // R fix: V2 (blind 70 %): the title gave the key away, and "too rough" had nothing behind it. A near miss now
    //   reads her complaint as "I already said I'm fine".
    // R fix (2nd review): V2 (blind 70 %: only the key was about romance). "joking about her lunch" → "flirting too
    //   boldly", the romance reading turned the wrong way; a question about gas isn't flirting.
    // why: already said she's fine ← "I'm very comfortable" just before, so a second health question sounds
    //   pushy; flirting too boldly ← her date frame carried over, so any personal question sounds like a come-on
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'gas', seg: [118, 131.6],
      stem: 'Why is Rachel put out by the question about gas?',
      choices: ['It’s not at all a romantic thing to ask her', 'She has already said that she feels fine',
                'She thinks he’s flirting with her too boldly'], a: 0,
      cue: '「Shoot」のあと、相手を名前で呼んで言う一言。',
      line: 'Any painful gas? — No. … *Shoot, Dr. Schiff, what kind of question is that?*',
      said: '「ガスで痛みは？」���「いいえ」。少しして「もう、シフ先生、何て質問なの」。',
      mean: '医者には普通の質問。デート気分の彼女には、雰囲気を壊す失礼な質問。',
      trap: '口説きと取ると話が逆になる。ふつうの診察の質問に、恋の場面を壊されて怒るずれが笑い。',
      use: 'What kind of question is that?（何その質問？）' },

    // anchor: 139.84 s "I'm sorry, is there something going on here?" — the "I'm sorry" frame marks puzzlement, after
    //   127.56 s "what kind of question is that?"; 141.6 s "Do you feel it, too?" answers it as if he'd felt chemistry
    // R fix: V2 (blind 70 %): the key was the only choice that split the two people. Each choice now pairs a
    //   reading of him with a reading of her, and each near miss is wrong on one side only.
    // R fix (2nd review): V2 (blind 75 %, the C2 one rewrite). "she thinks he wants her gone" → "she's teasing him",
    //   a sincerity flip on her side only; her "too" claims the feeling as her own, and the scene's "How amazing is
    //   this?" is sincere.
    // why: he feels it ← "something going on" heard as his own confession; teasing ← "Do you feel it, too?" heard as
    //   a joke at his confusion
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'feelit', seg: [139.3, 143.3],
      stem: 'What does “Do you feel it, too?” show about how each sees the moment?',
      choices: ['He’s puzzled; she thinks he feels the spark', 'He feels the spark; she’s glad it’s mutual',
                'He’s puzzled; she’s teasing him about it'], a: 0,
      cue: '先生の「I’m sorry」と、彼女の「too」。',
      line: '*I’m sorry, is there something going on here?* — *Do you feel it, too?*',
      said: '先生が「すみません、何か起きてます？」と聞き、彼女は「あなたも感じる？」と返す。',
      mean: '先生の言葉は「様子が変だ」という戸惑い。彼女は恋の予感と受け取り、too で「私も」と重ねる。',
      trap: '同じ語でも意味は二人で別。I’m sorry で始まる質問は、たいてい戸惑いか苦情。',
      use: 'Sorry, is something wrong?（すみません、何かありました？）' }
  ]
};
