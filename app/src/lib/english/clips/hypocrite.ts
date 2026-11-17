// “Rachel Is a Hypocrite at Work | Friends” (the official Friends channel, Best of Season 9): Rachel apologizes to Gavin
// for misjudging him, catches him eyeing a coworker mid-apology, and lectures him, until he brings up her own fling with
// her assistant Tag and she can't name Tag's last name.
// Segments from the captions, words from whisper (2026-11-16). Gavin and Heather are named in the audio; Rachel isn't,
// but the title names her and she answers to "you" in every exchange with Gavin, so stems use both names. Untested on
// purpose: 20–22 s (“Morning.” / “Oh.”/“Hello.”: speaker unclear), 23 s (“Do you know what?” vs “But you know what?”),
// 54.5 s (“Why” vs “What do you even care”), 64.3 s (“Stop looking at my…”: speaker unclear). i1's line skips the word
// order the sources disagree on (“This is your…” vs “Is this your…”). Whisper loops “He didn't have a last name” from
// 105.6 s to the end, so nothing is built after 106 s.
// EAR CHECK: 97.7–101.4 s c1 — the pause after “It was…”: captions put “Oh, my God” at 101.4 s (a 3.7 s gap), whisper at
//   98.5 s (a 0.8 s gap); the item needs a pause you can hear
// EAR CHECK: 41.9–42.8 s s1 — “I wasn't”: the item claims the t of n't drops and only the n is left
// EAR CHECK: 81.0–83.6 s c3 — “that you knew that” in well under a second, the first “that” weak (both sources agree on
//   the words)
// REVIEW 2026-11-16: pass 6, fix 16, drop 0, new 0; ear checks 3
// Open: s1 stays about 50 % blind (whoever is accused tends to deny it); d4 about 50 % for anyone who knows the title.
import type { Clip } from '../types.ts';

export const hypocrite: Clip = {
  id: 'hypocrite', video: '4tjV7NtVW7A', title: 'Rachel Is a Hypocrite at Work', dur: 117, wpm: 167, band: 'fast',
  tags: ['職場', '恋愛'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2, the key was the only apology among the choices (blind ≥ 50 %); all three are now stances on her
    //   first view of him
    // why: rude ← "when we first met, you know, I thought…" heard as an excuse for past rudeness; still arrogant ←
    //   the three strong adjectives heard as her present view
    { id: 'g1', skill: 'gist', level: 'B1', point: 'apology', seg: [0, 20.3],
      stem: 'What does Rachel set out to do in her opening speech?',
      choices: ['Explain why she was rude to him at first', 'Take back what she first thought of him',
                'Admit she still finds him a bit arrogant'], a: 1,
      cue: '最初の一文と、最後の文の動詞に注目。',
      line: 'I really *owe you an apology*. … I’m *sorry that I misjudged you*.',
      said: '最初は偉そうで嫌な人だと思ったが、本当はいい人。決めつけてごめん、と謝る。',
      mean: 'owe you an apology ＝ 謝らないといけない。悪口は昔の印象の説明。',
      trap: '強い形容詞が3つ続くので責めて聞こえるが、「最初に会ったとき」の話。',
      use: 'I owe you an apology.（あなたに謝らないと）' },

    // why: hoping ← "apology" heard as something he was waiting for (but he asked "For what?"); honest ← the insults
    //   taken as welcome frankness (正直さ)
    { id: 'i1', skill: 'infer', level: 'C1', point: 'firstsorry', seg: [3.3, 11.6],
      stem: 'When Gavin replies to “when we first met…”, what is he suggesting?',
      choices: ['He has been hoping she would say sorry', 'He is glad she is finally being honest',
                'Her apology so far sounds like insults'], a: 2,
      cue: '「obnoxious」のすぐあと、彼の短い質問。',
      line: 'I thought you were *pompous and arrogant and obnoxious*. — …your *first apology*?',
      said: '謝ると言って「偉そうで、うぬぼれていて、感じが悪い」と並べたので、彼は「それが謝罪？」と返す。',
      mean: '謝罪のはずが悪口に聞こえる、という軽いツッコミ。怒ってはいない。',
      trap: '悪口を「正直さ」と喜んだと取りやすい。短い聞き返しはツッコミが多い。',
      use: 'Is that your idea of an apology?（それで謝ってるつもり？）' },

    // R fix: V2 + B1, "changing the subject" was a filler and the key the only nuanced choice; it now reveals g1
    // why: right ← "first impressions" heard as her defending her first view; unfair ← the "No" read as pushing
    //   back at his dig
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'impressions', reveals: ['apology'], seg: [11.3, 20.3],
      stem: 'When Rachel answers his question, what is she doing?',
      choices: ['Explaining why her first opinion was right', 'Clarifying what she meant by her first words',
                'Objecting that his reaction was unfair'], a: 1,
      cue: '「No」のあとの言いかえと、続くほめ言葉。',
      line: 'No, *I just mean* that, you know, *first impressions don’t mean anything*.',
      said: '「いや、第一印象なんて当てにならないってこと」と言い直し、いい人だと続ける。',
      mean: 'I just mean ＝ 悪く取られた言葉を言い直す前置き。謝罪の本題に戻る。',
      trap: '「正しかった」の説明に聞こえやすいが、これは弁解でなく言い直し。',
      use: 'No, I just mean it’s a little early.（いや、ちょっと早いかなってだけ）' },

    // R fix: B1, its line ("first impressions don't mean anything") gives away g1
    { id: 'x1', skill: 'dict', level: 'B1', point: 'impressions', reveals: ['apology'], seg: [11.3, 15.3],
      stem: 'Type what she says: “___ don’t mean anything.” (2 words)', answer: 'first impressions',
      cue: '「you know」のあと。最初の語は短く速い。',
      line: 'you know, *first impressions* don’t mean anything.',
      said: '「第一印象なんて、何の意味もない」と、さっきの悪口を打ち消す。',
      mean: 'first impression ＝ 第一印象。複数形で一般論にしている。',
      trap: 'first の t は次の i とつながって消えがち。最後の s まで書く。',
      use: 'First impressions can be wrong.（第一印象は外れることもある）' },

    // why: rejects ← his "…first apology?" dig sounds like a refusal; insults ← "pompous and arrogant" sound like
    //   the cause of the fight
    // R fix: B1, the key states p1's point (he isn't listening)
    { id: 'g2', skill: 'gist', level: 'B2', point: 'trigger', reveals: ['checking', 'wait'], seg: [20.0, 44.7],
      stem: 'What turns her apology into an argument?',
      choices: ['He refuses to accept her apology', 'She insults him while apologizing',
                'He stops listening to her partway'], a: 2,
      cue: '彼女が何に怒っているか、「and you were」のあと。',
      line: 'I was giving you an apology *and you were totally checking her out*.',
      said: '「謝ってたのに、あなたはずっとあの子を見てた」と怒る。',
      mean: '謝罪の中身ではなく、途中で彼の気がそれたことが、けんかの始まり。',
      trap: '最初の悪口が原因に聞こえるが、彼は「それが謝罪？」と流しただけ。怒りの理由は and のあとに来る。',
      use: 'Are you even listening to me?（ちゃんと聞いてる？）' },

    // R fix: V2, "fresh air" was a filler and the key the only idiom-like choice
    // why: back to work ← "new day" heard as the start of the workday; day off ← "new day" heard as a free day
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'leaf', seg: [22.6, 29.3],
      stem: 'Just before “I am just really, really happy”, what idea comes up?',
      choices: ['Getting back to work for the day', 'Taking the rest of the day off',
                'Making a fresh start from today'], a: 2,
      cue: '「Hey,」のあと、同じ形の短い組が2つ。',
      line: 'Hey, *new day, new leaf*.',
      said: '「新しい日、新しいページ」と言い、本当に幸せだと続ける。',
      mean: 'turn over a new leaf（出直す）を縮めた形。leaf は本のページ。',
      trap: 'new day を「今日の仕事」と取ると始業の合図に聞こえる。leaf は決まった言い方の一部。',
      use: 'I’m turning over a new leaf.（心を入れかえるよ）' },

    // why: coworker ← "Heather… has something more important to say… I'll just wait" taken literally; again ←
    //   "I'm sorry" heard as part of the apology she was making
    // R fix: B1, the key and notes state g2's point (he stopped listening)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'wait', reveals: ['checking', 'trigger'], seg: [29.2, 37.4],
      stem: 'When Rachel breaks off her speech with “I’m sorry”, what is she doing?',
      choices: ['Letting a coworker speak before her', 'Pointing out that he isn’t listening',
                'Apologizing again for misjudging him'], a: 1,
      cue: '「Obviously」から始まる文の、主語と動詞。',
      line: 'I’m sorry. *Obviously* Heather’s … has *something more important to say*, so *I’ll just wait* till it’s finished.',
      said: '「ごめんね。ヘザーのお尻の方が大事な話があるようだから、待つわ」。',
      mean: 'この I’m sorry は謝罪でなく皮肉。聞いていない彼を責めている。',
      trap: 'I’m sorry を毎回「ごめん」と取るとずれる。Obviously が続いたら皮肉の合図。',
      use: 'Sorry, am I keeping you?（ごめん、お邪魔だった？）' },

    // why: texts ← check = チェック (メールをチェック), and "something more important to say… wait till it's finished"
    //   sounds like a message; chatting ← "Heather… has something to say" and the passing "Morning"
    // R fix: B1, the key ("instead of listening") states p1's point
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'checking', reveals: ['trigger', 'wait'], seg: [37.3, 44.7],
      stem: 'What does Rachel accuse Gavin of doing during her apology?',
      choices: ['Checking texts instead of listening', 'Eyeing Heather instead of listening',
                'Chatting to Heather instead of listening'], a: 1,
      cue: '「totally」のあとの動詞と、その後ろの2語。',
      line: 'you were *totally checking her out*.',
      said: '「謝ってるのに、あの子を見てたでしょ」。',
      mean: 'check someone out ＝ 気になる相手をじっと見る。メールの確認でも、おしゃべりでもない。',
      trap: 'check を「チェック・確認」と取りやすい。check out の後が人なら「見とれる」。',
      use: 'That guy is checking you out.（あの人、あなたを見てるよ）' },

    // R fix: B1 + V2, the stem quotes "checking her out" (ph1's key), and "reply" cued a denial; the stem no
    //   longer frames it as an answer (still about 50 % blind: an accused man denies; open)
    // why: I was ← the t of wasn't drops; I'm not ← the denial is caught but the tense is missed
    { id: 's1', skill: 'sound', level: 'B2', point: 'wasnt', reveals: ['checking'], seg: [37.3, 44.7],
      stem: 'Fill the gap in Gavin’s line: “___ checking her out.”',
      choices: ['I was', 'I wasn’t', 'I’m not'], a: 1,
      cue: 'I のすぐあと、短い一語の終わりの音。',
      line: '*I wasn’t* checking her out.',
      said: '「見てたんじゃない」と否定し、仕事の言い訳を続ける。',
      mean: 'wasn’t の t はほぼ消えるが、「ン」の鼻の音が残る。続く言い訳も否定の証拠。',
      trap: 't が聞こえないと I was に聞こえる。否定かどうかは次の文の流れでも確かめる。',
      use: 'I wasn’t staring, I was thinking.（見てたんじゃなくて、考えてたの）' },

    // why: shirt ← sk/sh at speed, and both are clothes; shoes ← a fashion item guessed from "fashion"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'fashion', seg: [37.3, 50.6],
      stem: 'In Gavin’s excuse, what was he looking at?',
      choices: ['Her shirt', 'Her skirt', 'Her shoes'], a: 1,
      cue: '「I’m in fashion」のあとの最後の一語。',
      line: 'I’m in fashion. I was looking at *her skirt*.',
      said: '「ファッション業界の人間だから、スカートを見てただけ」と言い訳する。',
      mean: 'in fashion ＝ ファッションの仕事をしている。仕事の目で服を見た、という言い分。',
      trap: 'skirt と shirt は出だしだけの差。sk は「スク」、sh は「シュ」。',
      use: 'I’m in sales.（営業の仕事をしています）' },

    // why: fashion ← not knowing a skirt from pants read as not knowing clothes; topic ← "Or was it pants?" heard as
    //   a dodge
    { id: 'h1', skill: 'humor', level: 'C1', point: 'pants', reveals: ['fashion'], seg: [37.3, 50.6],
      stem: 'Why does Gavin’s follow-up to his excuse get a laugh?',
      choices: ['It shows he knows nothing about fashion', 'It shows he never looked at her clothes',
                'It shows he is trying to change topics'], a: 1,
      cue: '服を見ていたはずが、どこまで見たと言っているか。',
      line: 'Or was it pants? I *didn’t really see* what happened *below the … area*.',
      said: '「いや、パンツだったかも。腰より下はよく見てなかった」と付け足す。',
      mean: '服を見ていたはずが下の服すら見ていない。見ていたのは服ではないと自分でばらしている。',
      trap: '服に詳しくない、と取りやすい。笑いは言い訳が自分で崩れる所。',
      use: 'Wait, that came out wrong.（待って、今の言い方はまずかった）' },

    // R fix: V2, both distractors were positive, so the only negative choice was the key
    // why: amused ← the audience laughs and her "Oh" sounds light; lets it drop ← "Oh, well" heard as まあいいか
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'creep', seg: [45.4, 54.0],
      stem: 'How does Rachel react to his explanation?',
      choices: ['Amused, and she laughs it off', 'Annoyed, but she lets it drop', 'Disgusted, and she says so'], a: 2,
      cue: '「Oh, well」のあと、彼をどう呼ぶか。',
      line: 'Oh, well, you’re really *a creep*.',
      said: '「もう、あなたって本当に気持ち悪い」と、はっきり言う。',
      mean: 'creep ＝ いやらしくて気味の悪い人。言い訳を聞いたうえでの、強い非難の言葉。',
      trap: 'Oh, well は「まあいいか」にも聞こえるが、ここは言い直しの前置き。続く名詞で気持ちが決まる。',
      use: 'That’s a little creepy.（それ、ちょっと気持ち悪い）' },

    // why: admitting ← "I'm jealous" is said in so many words; hurt ← the quick "yes" read in the Japanese frame as
    //   強がり
    // R fix: V5, the key is irony acted out, which is C1
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'jealous', seg: [56.4, 63.8],
      stem: 'When Gavin asks if she is jealous, what is her answer really doing?',
      choices: ['Admitting it while making it a joke', 'Hiding her hurt behind a quick yes',
                'Mocking the idea by acting it out'], a: 2,
      cue: '「Oh, yeah」と、続くお願いの大げささ。',
      line: '*Oh, yeah.* I’m jealous. Oh, Gavin, *please, please* look at…',
      said: '「ええそうよ、嫉妬してるの。ねえギャビン、お願い、私も見て」。',
      mean: 'Oh, yeah ＋ 大げさなお願いは、ありえないことを演じる皮肉。「そんなわけない」。',
      trap: '言葉どおりの yes に聞こえる。Oh, yeah の後が大げさなら否定の皮肉を疑う。',
      use: 'Oh, yeah, I’d love to work Sunday.（ああ、日曜出勤なんて最高）' },

    // anchor: 58.0–63.1 s "Oh, yeah. I'm jealous… please, please look at…", then 67.3–71.6 s "I mean, I just think you
    //   are totally inappropriate… This is a work environment": she says outright what the act meant
    // why: "you like me" ← "I'm jealous" taken as sincere (the clip never has her mean it; "I mean" turns to the
    //   work rule); reassurance ← "jealous" heard as hurt, the 気持ちを察する frame
    // R fix: B1, its mean (職場で部下を…) gives away d3
    { id: 'c2', skill: 'pragma', level: 'C2', point: 'jealous', reveals: ['imean', 'subordinate'], seg: [57.6, 71.9],
      stem: 'Which reply from Gavin would match what Rachel meant?',
      choices: ['Ha, I knew it. You do like me.', 'Hey, don’t worry. She means nothing.',
                'Fine. I’ll keep my eyes to myself.'], a: 2,
      cue: '大げさなお願いのあと、「I mean」で言い直す中身。',
      line: '*Oh, yeah. I’m jealous.* … *I mean*, I just think you are *totally inappropriate*.',
      said: '大げさに「嫉妬してる」と演じたあと、「つまり、職場であれは不適切」と言い直す。',
      mean: '皮肉の「嫉妬してる」は「そんな話じゃない」の意味。本題は、職場で部下をじろじろ見るなということ。',
      trap: '言葉どおり取ると、からかいや慰めを選ぶ。返事は言葉の形でなく、相手の本題に返す。',
      use: 'Fair enough. Point taken.（もっともだ。分かったよ）' },

    // R fix: V2 + B1, the key was the only two-part, nuanced choice; "fixing a word" (I mean as self-repair) replaces
    //   "a different subject". The key says the act was a joke, a1's point
    // why: asking ← "mean" heard as "What do you mean?"; fixing a word ← I mean's everyday self-repair use
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['jealous'], seg: [57.6, 71.9],
      stem: 'Just before “I just think…”, what do Rachel’s opening words signal?',
      choices: ['She’s asking him what he meant by that', 'She’s dropping the joke to say it straight',
                'She’s fixing a word she just got wrong'], a: 1,
      cue: '直前の大げさな話と、あとの話の中身の差。',
      line: '*I mean*, I just think you are totally inappropriate, okay?',
      said: '「つまりね、あなたのやってることは本当に不適切だと思うの」。',
      mean: 'I mean ＝ 今のは冗談、本当に言いたいのはこれ、という切りかえ。',
      trap: 'mean を「意味する」と取ると質問、一語の言い直しと取ると訂正に聞こえる。中身の変化で判断する。',
      use: 'I mean, it’s up to you.（まあ、つまり、君しだいだよ）' },

    // R fix: V2, "new to the job" left a boss/under pair the scene's theme settles; "at his level" is the coworker
    //   reading
    // why: boss ← the long formal word sounds like a title (上司); his level ← "a work environment" heard as a
    //   point about coworkers (同僚)
    { id: 'd3', skill: 'detail', level: 'B2', point: 'subordinate', seg: [66.8, 73.4],
      stem: 'What does Rachel say about Heather’s place at work?',
      choices: ['She is his boss at work', 'She is under him at work', 'She is at his level at work'], a: 1,
      cue: '「work environment」のあと、立場を表す長い語。',
      line: 'This is *a work environment*. She’s *your subordinate*.',
      said: '「ここは職場よ。彼女はあなたの部下なの」。',
      mean: 'subordinate ＝ 部下。上司が部下をじろじろ見るのは立場の悪用だ、という指摘。',
      trap: '長くて堅い語は肩書き（上司）に聞こえやすい。sub- は「下」の意味。subway の sub と同じ。',
      use: 'She’s my direct report.（彼女は私の直属の部下です）' },

    // why: staring ← the topic so far is looking at people; firing ← "old assistant" heard as a job matter
    { id: 'd4', skill: 'detail', level: 'B2', point: 'tag', seg: [66.8, 77.3],
      stem: 'What does Gavin bring up to turn it back on her?',
      choices: ['Her habit of staring at her assistant', 'Her past relationship with her assistant',
                'Her firing of her old assistant'], a: 1,
      cue: '「okay when you」のあとの動詞と、相手の肩書き。',
      line: 'But it was okay when you *slept with your old assistant*, Tag?',
      said: '「でも、昔のアシスタントのタグと付き合ってたのはいいの？」と言い返す。',
      mean: 'it was okay when you…? ＝「自分もやったでしょ」と突く言い方。',
      trap: 'assistant だけ拾うと仕事の話に聞こえる。when you の後の動詞を聞く。',
      use: 'But it was okay when you did it?（でも、自分がやるのはいいの？）' },

    // why: One ← "One," is the next word heard; Three ← a list feels open after "And two,"
    { id: 'n1', skill: 'number', level: 'B1', point: 'reasons', seg: [77.2, 86.5],
      stem: 'How many reasons does Rachel say make her case different?',
      choices: ['One', 'Two', 'Three'], a: 1, keep: true,
      cue: '「totally different」のすぐあと。',
      line: 'That is totally different *for two reasons*. One, … And two, …',
      said: '「全然違うわ、理由は2つ」と言い、順に数える。',
      mean: 'for two reasons ＝ 理由が2つ。One, … And two, … と数える。',
      trap: 'for two は短くつながり too にも聞こえる。あとの And two, で確かめる。',
      use: 'No, for two reasons.（いや、理由は2つあって）' },

    // R fix: S3/B1, the cue said "two reasons" (n1's key)
    // why: spying ← "you knew that" heard as an accusation; who told ← her surprise read as a question about the source
    { id: 'h2', skill: 'humor', level: 'C1', point: 'knew', seg: [77.2, 85.5],
      stem: 'Why does Rachel’s first reason get a laugh?',
      choices: ['It accuses Gavin of spying on her', 'It asks Gavin who told him about it',
                'It isn’t a difference, just her shock'], a: 2,
      cue: '数え始めた1つ目の中身。',
      line: 'One, *I didn’t know that you knew that*.',
      said: '「理由は2つ。1つ、あなたが知ってるなんて知らなかった」。',
      mean: '違いを説明するはずが、出てきたのは「バレてた」という驚きだけ。理由になっていない。',
      trap: '「知ってた」から、調べたと責めて聞こえる。One, の後が本当に理由かを確かめる。',
      use: 'Wait, how do you know that?（待って、なんで知ってるの？）' },

    // anchor: 81.0–83.6 s seven words in about a second (captions 82.84–83.56, whisper 81.63–83.56); both sources have
    //   “that you knew that”, with the first “that” the one grammar lets you drop
    { id: 'c3', skill: 'dict', level: 'C2', point: 'knew', seg: [80.7, 85.4],
      stem: 'Type the end: “One, I didn’t know ___.” (4 words)', answer: 'that you knew that',
      cue: '「I didn’t know」のあと、1秒もない速さ。',
      line: 'One, I didn’t know *that you knew that*.',
      said: '「1つ目、あなたが知ってるなんて知らなかった」。最後の4語は弱く速く、ひと続き。',
      mean: 'that が2回。1つ目はつなぎで「ザッ」程度、2つ目は「そのこと」で少し強い。',
      trap: '文法では最初の that を省けるので、聞こえても消したくなる。言われた音を全部書く。',
      use: 'I didn’t know that you cooked.（料理するなんて知らなかった）' },

    // R fix: V2 + K5 + B1, the distractors were weak and mixed forms; all three are now "whether" checks. The line
    //   ("deep, meaningful relationship") gives away d4
    // why: feelings ← a jealous man asking about an ex; works with her ← "old assistant" makes it sound like a
    //   staff question
    { id: 'i3', skill: 'infer', level: 'C1', point: 'lastname', reveals: ['tag'], seg: [85.3, 97.3],
      stem: 'When Gavin asks about Tag’s last name, what is he really checking?',
      choices: ['Whether she still has feelings for Tag', 'Whether she and Tag were really close',
                'Whether Tag still works with her'], a: 1,
      cue: '直前に彼女が言った、関係の説明。',
      line: 'We had a *deep, meaningful relationship*. — Huh. *What was Tag’s last name?*',
      said: '「深くて意味のある関係だった」と言う彼女に、「へえ。タグの名字は？」と聞く。',
      mean: '本当に深い関係なら名字くらい知っている。短い Huh. と質問で、その主張を試している。',
      trap: '名字を聞くのは未練や仕事の確認に聞こえやすい。直前の主張への質問と考える。',
      use: 'Oh yeah? Then what’s his name?（へえ、じゃあ彼の名前は？）' },

    // anchor: 97.5–97.7 s "It was…", a gap (0.8 s in whisper, 3.7 s in the captions), then "Oh my God… He didn't have a
    //   last name": she started sure, and the name isn't there
    // why: deciding ← a pause before an answer read as withholding (言うか迷う), but "Oh my God" is surprise, not a
    //   choice; too hurt ← silence about an ex read as sadness, but she goes on, flustered, with an excuse
    // R fix: V2 + B1, the key alone had quote marks and the clip word "deep"; it's reworded. The stem and choices
    //   name Tag and the relationship (d4)
    { id: 'c1', skill: 'humor', level: 'C2', point: 'lastname', reveals: ['tag'], seg: [93.4, 106.0],
      stem: 'Why does the pause after her “It was…” get a laugh?',
      choices: ['She is deciding whether to tell him the truth', 'She is finding out she barely knew Tag',
                'She is too hurt to talk about Tag anymore'], a: 1,
      cue: '「It was」で止まる間と、そのあとの驚きの声。',
      line: 'It was… *Oh my God.* … He *didn’t have a last name*.',
      said: '「えっと…うそでしょ。彼には名字がなかったのよ」と言い出す。',
      mean: '言いかけて止まる間に、自信が崩れていくのが聞こえる。深い関係のはずが名字も知らず、苦しい言い訳が笑いを足す。',
      trap: '沈黙を「言うか迷う」「つらい」と取りやすい。間のあとに驚きの声が来たら、本人が今気づいた合図。',
      use: 'His name is… Oh no, I forgot.（彼の名前は…あ、忘れた）' },
  ]
};
