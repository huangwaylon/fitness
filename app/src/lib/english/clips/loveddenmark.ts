// REVIEW 2026-11-16: pass 3, fix 17, drop 1, new 1; ear checks 1
// Open question: my blind pass was weak evidence (I know the episode); a cold reader should retry a1, i1, f1.
// “The Most Loved Woman in Denmark | Parks and Recreation” (the official Parks and Recreation channel, Season 6): at an
// awards event Leslie meets a fellow honoree, Ollie, whose Danish hometown adores her (a goat-cheese statue to be eaten
// with crackers), and finds her own Pawnee story is the opposite.
// Segments from the captions, words from whisper (2026-11-16). The sources differ at 6.2 s ("Wow, it's" / "Oh, that's"
// a big cheering section), 49.2 s ("good cheese eye" / "Good cheese, aye") and in Ollie's surname; no key rests on
// those words. The captions put "know" of the last "I don't know" at 84.8 s (whisper: 80–82 s); the words agree, and no
// item keys on a pause.
// EAR CHECK: 64.6 s r1 — the cut falls after "and I love it" and before "but they hate me" (caption timings: it 64.48,
//   but 64.64, so the gap is under 0.3 s; whisper has the clause as one stretch 63–65 s)
import type { Clip } from '../types.ts';

export const mostLovedDenmark: Clip = {
  id: 'loveddenmark', video: 'FIh-nNPk68w', title: 'The Most Loved Woman in Denmark', dur: 105, wpm: 139, band: 'slow',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2/K6 — the key was the only choice with both the hut and the mayor; each choice now holds both, so the
    //   order ("grew up… then") and the relation decide it
    // why: mayor first ← the two clauses heard without "grew up… then", order reversed; daughter ← "grew up" and
    //   "mayor" put together as a family story
    { id: 'd1', skill: 'detail', level: 'B1', point: 'mongolia', seg: [8.0, 18.5],
      stem: 'What do we learn about the honoree from Mongolia?',
      choices: ['She grew up in a hut, then became the mayor', 'She was mayor, then went back to live in a hut',
                'She grew up in a hut as a mayor’s daughter'], a: 0,
      cue: '「grew up」と、そのあと二回続く「then」。',
      line: 'she *grew up in a hut*… made of ice and mud. Then she *became their mayor*',
      said: '氷と泥の小屋で育ち、その後、町長、警察署長になったと紹介している。',
      mean: 'then が続き、育った場所から就いた仕事へ、経歴を順に語っている。',
      trap: 'grew up と mayor をつなげて「町長の娘」と聞きやすい。then のあとは本人の経歴。',
      use: 'She grew up on a farm in Ohio.（彼女はオハイオの農場で育った）' },

    // R fix: V2/K6 — "admires her greatly" was the only warm, unhedged choice next to two plainly negative ones; the
    //   distractors are now milder readings of the same bio list
    // why: a bit much ← "wolverine wrangler" and an ice-and-mud hut sound like a tall tale; outdone ← a fellow honoree
    //   with a longer list of jobs, the competitive reading
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'admire', seg: [10.4, 19.7],
      stem: 'How does the speaker feel about the woman from Mongolia?',
      choices: ['She is a big fan of all she has done', 'She thinks her story is a bit much', 'She feels a little outdone by her'],
      a: 0,
      cue: '紹介の最後に付く、短い一言。',
      line: '…and their best wolverine wrangler. *I love her.*',
      said: '変わった経歴を並べたあと、「あの人大好き」と一言添えている。',
      mean: 'I love her ＝ 心からすごいと思っている。恋愛の意味ではなく、憧れ。',
      trap: '経歴が変わっているので笑っているように聞こえるが、最後の一言が気持ちを決める。',
      use: 'I love her. She’s amazing.（あの人大好き。すごいよね）' },

    // R fix: V2 (§9.4) — the title gave away "against her, unlike Ollie's"; the choices now differ only in who loves whom
    // why: swapped ← "I love it, but they hate me" with the subjects swapped; love each other ← both are honorees at
    //   the same event, and Leslie's "wonderful town… I love it" starts like Ollie's story
    { id: 'g1', skill: 'gist', level: 'B2', point: 'contrast', reveals: ['pawnee'], seg: [20.0, 85.4],
      stem: 'How does Leslie’s story about her town compare with Ollie’s?',
      choices: ['She loves her town, but it doesn’t love her back', 'Her town loves her, but she doesn’t love it back',
                'She and her town love each other, just like Ollie'], a: 0,
      cue: '「What about your town?」の前とあと。',
      said: 'Ollie は町に愛され、像まである。Leslie は町を愛しているのに、町からは嫌われている。',
      mean: '二人の故郷の話が、正反対の鏡になっている場面。',
      trap: '同じ受賞者なので「どちらも愛されている」と思いやすい。but のあとの主語を聞き分ける。',
      use: 'It’s the total opposite back home.（地元では正反対なんだ）' },
    // R fix: V2 — "struck by how good Ollie looks" was the only compliment; now all three are what Leslie notices, and
    //   only "symmetrical" settles which
    // why: familiar ← "look at your face" heard as recognizing a famous honoree; young ← a common compliment, picked
    //   when "symmetrical" isn't caught
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'face', seg: [25.6, 31.8],
      stem: 'When Leslie first sees Ollie up close, how does she react?',
      choices: ['She is struck by how balanced Ollie’s face is', 'She is struck by how familiar Ollie’s face is',
                'She is struck by how young Ollie’s face is'], a: 0,
      cue: '「What?」と聞き返されたあとの説明。',
      line: 'Oh, *look at your face*. — What? — It’s just so *symmetrical*.',
      said: '「その顔！」と言い、何かと聞かれて「すごく左右対称」と答えている。',
      mean: '整った顔立ちへの、思わず出たほめ言葉。',
      trap: 'Look at your face だけでは何に驚いたか分からない。What? のあとの説明の一語で決める。',
      use: 'Look at this view! It’s just perfect.（この景色見て！完璧）' },

    // R fix: V2 — "praises Leslie's face too" was easy to rule out; it's now "gets that a lot", a near hearing of
    //   "we all have that"
    // why: gets that a lot ← "we all have that" heard as the stock "I get that a lot"; family ← "we" taken as her family
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'denmark', seg: [30.4, 35.0],
      stem: 'How does Ollie answer Leslie’s compliment?',
      choices: ['She thanks her, and says it’s normal back home', 'She thanks her, and says she gets that a lot',
                'She thanks her, and says it runs in her family'], a: 0,
      cue: '「thanks」のあと、「we」が誰を指すか。',
      line: 'Oh, thanks. You know, *we all have that in Denmark*.',
      said: 'お礼を言ってから、「デンマークではみんなそうなの」と付け足している。',
      mean: 'ほめられた点を「国ではふつう」と言い、自分だけの手柄にしない返し方。',
      trap: 'we を家族と取ると「遺伝」に聞こえる。we のあとの場所の言葉で範囲を決める。',
      use: 'Thanks! Everyone’s like that back home.（ありがとう。地元ではみんなそうなの）' },

    // R fix: V2 — the key was the only choice tied to Ollie's looks; now three readings of "of course", and the key
    //   doesn't name the looks
    // why: guessed ← "of course" read as "I knew it", but the "Oh" before it marks news; doubt ← "of course" read as
    //   a dry "oh, sure", though she follows up with real interest ("what part…?")
    { id: 'i2', skill: 'infer', level: 'B2', point: 'denmark', seg: [31.4, 35.0],
      stem: 'When Leslie learns where Ollie is from, what does her reply suggest?',
      choices: ['That Ollie’s answer makes perfect sense to her', 'That she had guessed it from Ollie’s accent',
                'That she finds the claim a bit hard to believe'], a: 0,
      cue: '「Oh」で始まる反応と、最後の二語。',
      line: 'Oh, you’re from Denmark, *of course*.',
      said: '「ああ、デンマーク出身なのね。なるほど」と返している。',
      mean: 'of course ＝ 道理で。「デンマークではみんなそう」を受け、顔立ちに納得している。',
      trap: 'of course を「もちろん知ってた」と取りやすい。頭の Oh は、今知ったという合図。',
      use: 'Oh, you’re a chef. That explains it.（ああ、シェフなんだ。道理で）' },

    // R drop: c1 (C2, K1) — "It's not one of the most perfect places in the world, but I love it" is the stock "it's
    //   not perfect, but I love it"; a fluent listener can defend "it has real flaws, but I stay loyal", and one
    //   rewrite couldn't reach 80 %. Replaced by c3 (weak words, 66.0 s).

    // R fix: V2 (§9.4) — "how close she and her town are" echoed the title against two off-topic choices; now three
    //   reasons an honoree might show off a statue, none naming the love
    // why: earned ← an awards-night reading, helped by "look what they've done for me" heard as "what I've done for
    //   them"; known for ← "we have a lot of it" heard as a pitch for the local product
    { id: 'g2', skill: 'gist', level: 'B2', point: 'loves', reveals: ['done'], seg: [34.6, 59.3],
      stem: 'Why does Ollie tell Leslie about the statue?',
      choices: ['To show that the love goes both ways', 'To show that she has earned the honor',
                'To show off what her town is known for'], a: 0,
      cue: '像の話に入る直前の、短い一文。',
      line: 'I love it, and *it loves me*. And look what they’ve done for me.',
      said: '「町が大好きで、町も私が大好き。ほら、こんなことまで」と像の話をする。',
      mean: '像は町との相思相愛の証拠。そのあとの像の話も、すべて「愛されている」の続き。',
      trap: '受賞の場なので「功績の証」と聞きやすいが、直前の it loves me が話の軸。',
      use: 'Look what my kids made for me!（子どもたちがこれ作ってくれたの！）' },

    // R fix: V2/K3 — "they do" was the weak one; it's now "they did", the natural way to say it with the 've lost
    // why: they'd ← the v and the d are both one soft sound before "done"; they did ← the weak 've vanishes and the
    //   simple past is the everyday way to say it
    { id: 's1', skill: 'sound', level: 'B2', point: 'done', seg: [40.9, 44.6],
      stem: 'Fill the gap: “And look what ___ for me.”',
      choices: ['they’ve done', 'they’d done', 'they did'], a: 0,
      cue: '「what」のあと、とても短い音と、語尾の n。',
      line: 'And look what *they’ve done* for me.',
      said: '「町がしてくれたことを見て」と言う。',
      mean: 'they’ve の ’ve はほぼ聞こえず、「ゼイダン」に近い。done の n で完了形と分かる。',
      trap: '’ve が消えると did に聞こえやすい。did は d で終わり、done は n で終わる。',
      use: 'Look what I’ve made for dinner.（夕飯にこれ作ったよ）' },

    // R fix: V2/N7 — "Crackers" was a weak choice and its trap gave away d3's crackers; it's now "Sweet butter"
    //   (butter statues are a real thing)
    // why: ice and mud ← the Mongolian honoree's hut, heard at the start; butter ← another dairy sculpture, picked when
    //   only "made out of" and a soft word are caught
    { id: 'd2', skill: 'detail', level: 'B1', point: 'statue', seg: [46.3, 52.9],
      stem: 'What is Ollie’s statue made of?',
      choices: ['Goat cheese', 'Ice and mud', 'Sweet butter'], a: 0,
      cue: '像を見た Leslie の質問と、その答え。',
      line: 'It is made out of *goat cheese*. We have a lot of it.',
      said: '「ヤギのチーズ？」と聞かれ、Ollie が「ヤギのチーズ製」と答える。',
      mean: 'made out of ～ ＝ 〜でできている。像の材料をそのまま言っている。',
      trap: 'ice and mud は冒頭の別の人の話。made out of のあとの語を聞く。',
      use: 'This bag is made out of old jeans.（このバッグは古いジーンズでできてる）' },

    // R fix: V2 — "eat it with crackers" was the only odd, specific choice; now three things a town might do with a
    //   statue at an event
    // why: bid ← the awards-night charity script after "tonight's event"; sign ← "consume" half-heard, and a keepsake
    //   is what an honoree's statue usually becomes
    { id: 'd3', skill: 'detail', level: 'B2', point: 'crackers', reveals: ['statue'], seg: [52.1, 56.7],
      stem: 'What will happen to the statue after tonight’s event?',
      choices: ['People will eat it up with crackers', 'People will bid on it for charity',
                'People will sign it as a keepsake'], a: 0,
      cue: '「tonight’s event」のあと、動詞を一つ。',
      line: 'after tonight’s event, they’re gonna *consume* me *with crackers*.',
      said: '「今夜のあと、みんなクラッカーと一緒に私を食べる」と言う。',
      mean: 'consume ＝ 食べる。像はチーズなので、本当に食べられる。',
      trap: 'consume を「消費する」と覚えていると、食べる話だと気づきにくい。with crackers が決め手。',
      use: 'Let’s finish the cheese with crackers.（残りのチーズはクラッカーで食べよう）' },

    // R fix: V2 — "more proof of love" was the only clever reading; the choices now all say how she takes being eaten
    // why: own expense ← "consume me" heard as self-mockery; every winner ← "they just love me" missed, and the eating
    //   read as a local custom for all honorees
    { id: 'h1', skill: 'humor', level: 'C1', point: 'crackers', seg: [52.1, 59.2],
      stem: 'What makes Ollie’s comment after the cracker news funny?',
      choices: ['She takes being eaten as a sign of their love', 'She takes it as a joke at her own expense',
                'She takes it as an honor every winner gets'], a: 0,
      cue: '食べられる話のすぐあとの、明るい一言。',
      line: 'they’re gonna consume me with crackers. *They just love me.*',
      said: '「クラッカーで私を食べるの。とにかく私が大好きなの」と言う。',
      mean: '像が食べられることまで「愛されている証拠」と語る。そのずれが笑い。',
      trap: '自分を笑う冗談にも聞こえるが、They just love me は本気の自慢。it loves me と同じ。',
      use: 'The kids just love her.（子どもたちは彼女が大好き）' },

    // R fix: V2 — "a but" was guessable from the stem and the title; two choices now start with "but", so the kind
    //   of turn decides. S4: seg ended at 64.4, inside "it" (64.48); now 64.6, just before "but" (64.64)
    // why: her doubts ← a "but" is heard coming, but the turn is pinned on Leslie, not the town; and-more ← Ollie's
    //   "I love it, and it loves me" sets up a matching story
    { id: 'r1', skill: 'predict', level: 'B2', point: 'pawnee', seg: [59.4, 64.6], then: [64.6, 68.4],
      stem: 'Right after Leslie praises Pawnee, what is she about to say?',
      choices: ['A “but”, then how the town feels about her', 'A “but”, then her own doubts about the town',
                'An “and”, then more praise to match Ollie'], a: 0,
      cue: '「Well」で始まる答え方と、ほめ方の勢い。',
      line: 'Pawnee, Indiana is a wonderful town, and I love it, *but they hate me*',
      said: '「すばらしい町で大好き。でも町は私が大嫌い」と、but で話が反転する。',
      mean: '答えを Well で始め、先にほめるのは、悪い話の前置きになりやすい。',
      trap: 'Ollie と同じ流れを予想しやすいが、Well の出だしは「すんなりいかない」合図。',
      use: 'Well, it’s a nice place, but…（まあ、いい所なんだけど…）' },

    // R fix: V2/K3 — "ban her from the town office" was a weak fit; it's now the plain literal "throw her out of her
    //   office"
    // why: out of the town ← "kick me out" heard without "of office"; her office ← office = the room (オフィス)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'kickout', seg: [64.0, 67.6],
      stem: 'What does Leslie say her town is trying to do to her?',
      choices: ['Remove her from her job', 'Drive her out of town', 'Throw her out of her office'], a: 0,
      cue: '「hate me」のあと、「out of」に続く語。',
      line: 'they’re trying to *kick me out of office*.',
      said: '「町は私を嫌っていて、職から追い出そうとしている」と言う。',
      mean: 'kick ～ out of office ＝ 公職からおろす。office は建物でなく「役職」。',
      trap: 'office をオフィスと取ると「建物から締め出す」に聞こえる。政治の話では役職。',
      use: 'They voted him out of office.（彼は選挙で職を失った）' },

    // R new: c3 replaces c1 as the second C2 (exact weak words in fast speech, 139 wpm)
    //   reveals `pawnee`: its stem quotes "they hate me", the turn r1 predicts
    // why: they try to ← the weak 're and the -ing both lost, leaving a plain present; dying to ← tr before a vowel
    //   heard as d, and "dying to" (= eager to) fits the sense just as well
    // anchor: 66.00–66.32 s, captions "they're trying to kick me out of office"; whisper has the same words (63–67 s)
    // retired: C2 sound item, until the ear check (“they’re trying to” at 66 s)
    { id: 'c3', skill: 'sound', level: 'C2', point: 'kickout', reveals: ['pawnee'], seg: [64.0, 67.6], retired: true,
      stem: 'Fill the gap: “…they hate me, and ___ kick me out of office.”',
      choices: ['they’re trying to', 'they try to', 'they’re dying to'], a: 0,
      cue: '「hate me, and」のあと、三語。語頭の子音に注意。',
      line: 'but they hate me, and *they’re trying to* kick me out of office.',
      said: '「町は私が大嫌いで、職から追い出そうとしている」と言う。',
      mean: '’re は弱く、trying は「チュライン」に近い。今まさに進んでいる、という感じ。',
      trap: 'tr は d に近く聞こえ、dying to（〜したくてたまらない）も意味が通る。語頭の音と ’re を聞く。',
      use: 'They’re trying to fix it right now.（今まさに直そうとしてる）' },

    // R fix: V2 — "everybody in the town" was the only "everybody"; "her own staff" is now "everybody at her office"
    // why: a few kids ← a piñata is a kids' party game (script); at her office ← "everybody" caught, "in the town"
    //   missed, and the office is where her enemies were just placed ("out of office")
    { id: 'd4', skill: 'detail', level: 'B1', point: 'pinata', reveals: ['turns'], seg: [67.3, 74.1],
      stem: 'Who came to hit the piñata of Leslie’s face?',
      choices: ['Everybody in the town', 'A few kids from town', 'Everybody at her office'], a: 0,
      cue: '「and then」のあと、誰が来たか。',
      line: '*everybody in the town* came and took turns hitting it',
      said: '顔のピニャータを作り、町じゅうの人が来て棒でたたいた、と話す。',
      mean: 'everybody ＝ 町の全員。それほど嫌われている、という話。',
      trap: 'ピニャータは子どもの遊びなので「子どもたち」と思いやすい。主語の everybody を聞く。',
      use: 'Everybody in the office came to the party.（職場の全員がパーティーに来た）' },

    // why: wrong to fix ← the harsh details (everybody, a stick, broccoli) heard as a complaint; famous ← being made into
    //   a piñata read as celebrity, next to Ollie's statue
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'politics', seg: [67.3, 80.4],
      stem: 'How does Leslie treat the piñata story as she finishes it?',
      choices: ['She shrugs it off as part of the job', 'She tells it as a wrong she wants fixed',
                'She tells it as proof that she is famous'], a: 0,
      cue: '話の最後、「But」で始まる一言。',
      line: '*But politics*, you know what I mean, right?',
      said: 'ひどい話を並べたあと、「でも、政治ってそういうものでしょ？」とまとめる。',
      mean: 'ひどい仕打ちを「仕事につきもの」として軽く流そうとしている。',
      trap: '中身だけ聞くと怒りや訴えに聞こえる。最後のまとめ方が、本人の受け止め方を示す。',
      use: 'But hey, that’s show business.（まあ、それがショービジネスさ）' },

    // why: sorry ← sympathy is the Japanese-frame reply to a sad story (お気の毒に), but she framed it as normal; funny
    //   touch ← the broccoli line, said lightly, heard as a joke she wants laughed at
    // anchor: 77.9–80.3 s "But politics, you know what I mean, right?": a tag asking for "yes, that's normal", after a
    //   story she has just shrugged off
    // retired: one C2 alone is under 2 (c3 retired)
    { id: 'c2', skill: 'pragma', level: 'C2', point: 'politics', seg: [67.3, 85.4], retired: true,
      stem: 'Which reply from Ollie would give Leslie what she was hoping for?',
      choices: ['“Oh, totally. It comes with the job.”', '“Oh no, I’m so sorry they did that.”',
                '“Ha! The broccoli is a funny touch.”'], a: 0,
      cue: '話のまとめ方と、最後の「right?」。',
      line: 'But politics, *you know what I mean, right?*',
      said: 'ひどい話のあと、「でも政治ってそういうもの。分かるでしょ、ね？」と同意を求める。',
      mean: 'right? は相手の「そうだよね」を引き出す形。欲しいのは同情でなく、政治家どうしの「あるある」という共感。',
      trap: '悲しい話には同情、という型で選びやすい。相手が自分の話をどう締めたかに合わせて返す。',
      use: 'Kids, right? You know how it is.（子どもってさ、ね？分かるでしょ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'turns', reveals: ['pinata'], seg: [70.2, 74.1],
      stem: 'Type what she says: “everybody… came and ___ hitting it.” (2 words)', answer: 'took turns',
      cue: '「came and」のすぐあと、二語。',
      line: 'everybody in the town came and *took turns* hitting it with a stick',
      said: '「町じゅうが来て、順番にたたいた」と言っている。',
      mean: 'take turns ～ing ＝ 順番に〜する。took の k は turns の t とつながり、ほぼ聞こえない。',
      trap: 'k が消えて一語に聞こえやすい。動詞と名詞の組み合わせごと覚える。',
      use: 'Let’s take turns driving.（交代で運転しよう）' },

    // R fix: V2 — the key was the only "cruel" choice; a softening reading now sits beside it, and the literal
    //   "injury" choice (no one is hurt in the story) became the healthy-snack reading
    // why: softer ← "just to" heard as "just a", a little touch to make it lighter; healthy swap ← broccoli = health
    //   food, a "nice touch" reading
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'insult', seg: [73.9, 77.7],
      stem: 'Why does Leslie add the detail about the broccoli?',
      choices: ['It made a cruel act even crueler', 'It made the cruel act seem softer', 'It was a healthy swap for candy'],
      a: 0,
      cue: '「broccoli」のあと、「just to」に続く決まり文句。',
      line: 'they filled it with broccoli, just to *add insult to injury*.',
      said: '「中にはブロッコリー。さらに追い打ち」と言う。',
      mean: 'add insult to injury ＝ 追い打ちをかける。お菓子でなく野菜で、嫌がらせを重ねた。',
      trap: 'just to を「ちょっと」と取ると和らげる話に聞こえる。ここは「わざわざ」。',
      use: 'Then it rained, to add insult to injury.（おまけに追い打ちで雨まで降った）' },

    // R fix: V2/K5 — "plainly bored" was easy to rule out, and the key alone had the "Leslie expects…" frame; all
    //   three now share it
    // why: mishears ← "I don't know" heard as the answer to some other question; a laugh ← the broccoli line, said
    //   lightly, heard as a joke Leslie wants laughed at
    { id: 'h2', skill: 'humor', level: 'C1', point: 'idontknow', reveals: ['politics'], seg: [73.9, 85.4],
      stem: 'What makes Ollie’s answer at the very end funny?',
      choices: ['Leslie wants a nod, and Ollie can’t relate at all', 'Leslie wants a laugh, and Ollie takes it seriously',
                'Leslie wants a nod, and Ollie mishears the question'], a: 0,
      cue: '問いかけの語尾と、それへの返事の短さ。',
      line: 'you know what I mean, right? — *I don’t know.*',
      said: '「分かるでしょ？」と同意を求めた Leslie に、Ollie は「分からない」と返す。',
      mean: '像まで建つ人には、町に嫌われる感覚がない。二人の落差が笑い。',
      trap: '聞き違いにも聞こえるが、ちゃんと「分かるでしょ？」に答えている。愛されている話とつなげる。',
      use: 'Can’t relate, sorry!（ごめん、その感覚はないわ）' },

    // R fix: V2 — the key was the only choice tied to the story; "rather not talk politics" is now a near miss in
    //   the same "never… like that" frame
    // why: fast English ← a non-native speaker, and "I don't know" heard as "I didn't understand"; piñata ← the reply
    //   attached to the piñata story instead of to "you know what I mean, right?"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'idontknow', seg: [77.4, 85.4],
      stem: 'What does Ollie’s reply to Leslie’s last question suggest?',
      choices: ['Ollie has never been treated like that', 'Ollie didn’t follow Leslie’s fast English',
                'Ollie has never seen a piñata like that'], a: 0,
      cue: 'Leslie の問いかけのあと、短い返事。',
      line: 'you know what I mean, right? — *I don’t know.*',
      said: '「分かるでしょ？」と聞かれ、Ollie は「分からない」とだけ答える。',
      mean: '町に嫌われた経験がないので、共感しようがない。正直な返事。',
      trap: 'ピニャータへの返事と取りやすいが、直前の「分かるでしょ？」への答え。相思相愛の話とつなげる。',
      use: 'Honestly? I don’t know the feeling.（正直、その気持ちは分からない）' },
  ]
};
