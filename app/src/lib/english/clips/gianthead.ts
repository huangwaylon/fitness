// “Chandler's Date Has a Giant Head | Friends” (the official Friends channel, Best of Season 2): Chandler tells his
// friends he's finally asking out Allison from work despite her unusually large head; on the date he can't stop
// thinking about it while she talks about her useless major.
// Segments from the captions, words from whisper (2026-11-16). Only Allison is named in the audio (Chandler by the
// title). Untested on purpose: the friends' “Oh, hey, wow” (3–4.4 s) and “Okay. — Hey.” (19.5 s), in whisper only;
// “classifieds” at 29.7 s (captions “class iied”), which no key rests on. Whisper loops “Yeah, it doesn't look like a
// golf ball” from 58.6 s; talk ends at ≈ 55 s.
// EAR CHECK: 33.4–37.5 s t1 — “Hmm, sure” is Chandler's answer to Allison, and “My God, that's a big head” follows as
//   his thought (whisper ends it at 36.1 s, the captions put “head” at 37.5 s)
// REVIEW 2026-11-16: pass 4, fix 15, drop 0, new 0; ear checks 1 (s1's dropped: both sources agree on "asking her
//   out")
import type { Clip } from '../types.ts';

export const giantHead: Clip = {
  id: 'gianthead', video: 'QfUyElkW7Oo', title: 'Chandler’s Date Has a Giant Head', dur: 65, wpm: 184, band: 'fast',
  tags: ['恋愛', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2, blind 60 % right; "dreading it" was weak. A near miss (getting past a different hang-up) replaces it.
    //   C5: its key gives away f2's "hang me up" and h1's point, so it reveals `hangup` and `growing`; its notes named
    //   d1's "from work" and h1's 成長, so `said`/`mean` are reworded.
    // why: fear of rejection ← "holding off asking her out" is the usual shy-guy script; set up ← "you will all be
    //   pleased" sounds like the friends arranged it
    { id: 'g1', skill: 'gist', level: 'B2', point: 'announce', reveals: ['hangup', 'growing'], seg: [0, 23.5],
      stem: 'What is Chandler’s point in telling his friends about the date?',
      choices: ['That he’s finally getting past a shallow hang-up', 'That he’s getting past his fear of being turned down', 'That they set him up with the right woman'], a: 0,
      cue: '最初の一言と、最後の「Look at me」。',
      said: 'デートの報告をしながら、これまで誘わなかった理由と、今回の決心を話す。',
      mean: 'デートの報告というより、自分の決心を聞いてほしいという話。',
      trap: 'holding off から「断られるのが怖い」、pleased から紹介を想像しやすい。理由は彼女の頭。',
      use: 'I’m finally doing it. I’m asking her out.（ついにデートに誘うよ）' },

    // why: tonight ← "tonight" is the usual sitcom timing and "to-" opens both; next weekend ← a date "soon" with no
    //   time heard
    { id: 'n1', skill: 'number', level: 'B1', point: 'when', seg: [0, 4.2], keep: true,
      stem: 'When is the date?',
      choices: ['Tonight', 'Tomorrow night', 'Next weekend'], a: 1,
      cue: '「I have a date」のすぐあと。',
      line: 'I have a date *tomorrow night*.',
      said: '「明日の夜デートがある」と報告する。',
      mean: 'tomorrow night ＝ 明日の夜。このあと場面がそのデートに変わる。',
      trap: 'tonight と tomorrow night は出だしが同じ「トゥ」。そのあとの音の長さで聞き分ける。',
      use: 'Are you free tomorrow night?（明日の夜あいてる？）' },

    // R fix: V2, blind 70 % right; "the gym" was a filler. A neighbor reading (the sitcom default) replaces it.
    // why: friend of a friend ← the usual set-up script among friends; neighbor ← "this woman" + meeting someone close
    //   to home
    { id: 'd1', skill: 'detail', level: 'B1', point: 'work', seg: [3.9, 8.7],
      stem: 'How does Chandler know Allison?',
      choices: ['She works at the same place', 'She lives in his building', 'She’s a friend of a friend'], a: 0,
      cue: '名前のすぐあとの2語。',
      line: 'This woman, Allison, *from work*. She is great.',
      said: '「職場のアリソンって人。すごくいいんだ」と紹介する。',
      mean: 'from work ＝ 職場の。同僚だと分かる。',
      trap: 'from を「出身」と取ると迷う。人＋from work は「職場の人」。',
      use: 'This is Ken, a friend from work.（職場の友だちのケンです）' },

    // R fix: V2, blind 75 % right. C5: its choices hold s1's "ask her out", so it reveals `askout`. The distractors are
    //   now a wrong-agent wait and hinting.
    // why: waiting for her ← "holding off" = 待つ, with the asker swapped; hinting ← "holding" read as holding feelings in
    //   while dropping hints
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'holdoff', reveals: ['askout'], seg: [8.3, 12.6],
      stem: 'What has Chandler been doing about Allison until now?',
      choices: ['Putting off ever asking her out', 'Waiting for her to ask him out', 'Hinting that he wants to ask her out'], a: 0,
      cue: '「I’ve been」のあとの動詞と副詞。',
      line: 'I’ve been *holding off*… in the past',
      said: '「これまでは誘うのを控えてきた」と言う。',
      mean: 'hold off ～ing ＝ ～するのを先延ばしにする。まだ誘っていない。',
      trap: 'hold off を「待つ」と取ると、彼女から誘われるのを待つ話に聞こえる。誘うのは彼のほう。',
      use: 'Let’s hold off on booking until Friday.（予約は金曜まで待とう）' },

    // R fix: V2, blind 75 % right; "asking her about it" didn't fit the slot. "taking her out" (same date idiom, near
    //   sound) replaces it.
    // why: asking around ← h-dropped "her" + "out" blur into "around"; taking her out ← -king her out, the same rhythm and
    //   the same date idiom
    { id: 's1', skill: 'sound', level: 'B2', point: 'askout', seg: [8.3, 12.6],
      stem: 'Fill the gap: “I’ve been holding off ___ in the past…”',
      choices: ['asking her out', 'taking her out', 'asking around'], a: 0,
      cue: '「holding off」のすぐあと、つながる3語。',
      line: 'I’ve been holding off *asking her out* in the past',
      said: '「誘うのを控えてきた」。her の h が落ちて asking とつながる。',
      mean: 'ask ＋ 人 ＋ out ＝ デートに誘う。her は「アー」と弱くなる。',
      trap: 'h が消えると「アスキンガラウ」と一続きになり、around に聞こえやすい。',
      use: 'He finally asked her out.（彼はついに彼女をデートに誘った）' },

    // R fix: V2/K5, blind 70 % right; "turned him down" answered a different question (her act, not his feelings). All
    //   three are feelings now. C5: its line shows s1's answer, so it reveals `askout`.
    // why: just started ← "in the past" lost, only "asking her out" caught; hurt ← "in the past" heard as a past refusal
    { id: 'i1', skill: 'infer', level: 'B2', point: 'holdoff', reveals: ['askout'], seg: [8.3, 16.85],
      stem: 'What does Chandler’s story suggest about his feelings for Allison?',
      choices: ['He has liked her for quite a while', 'He only just started liking her', 'He’s still hurt she once said no'], a: 0,
      cue: '「in the past」と、その前の動詞。',
      line: 'I’ve been holding off asking her out *in the past* because…',
      said: '「前から誘うのをやめていた。理由は…」と話す。',
      mean: '「控えてきた」は、誘いたい気持ちは前からあったということ。',
      trap: 'in the past を昔の出来事と取ると、断られた話に聞こえる。まだ一度も誘っていない。',
      use: 'I’ve been meaning to call you.（ずっと電話しようと思ってたんだ）' },

    // R fix: V2, blind 65 % right; "feeling sad" was weak. A "what others think" reading replaces it.
    // why: wait for a call ← hang up = 電話を切る, read literally; others ← "that stuff" heard as people's opinions
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'hangup', seg: [16.8, 21.05],
      stem: 'After the “but”, what is Chandler deciding?',
      choices: ['To stop letting it hold him back', 'To stop worrying what others will think', 'To stop waiting for her to call him'], a: 0,
      cue: '「let that stuff」のあとの動詞句。',
      line: 'but I’m not gonna let that stuff *hang me up* anymore',
      said: '「でも、もうそういうことで止まったりしない」と言う。',
      mean: 'hang ＋ 人 ＋ up ＝ 引っかかって前に進めなくする。こだわりを捨てる宣言。',
      trap: 'hang up は「電話を切る」が有名なので電話の話に聞こえやすい。人が間に入ると別の意味。',
      use: 'Don’t let one bad day hang you up.（一日の失敗で止まらないで）' },

    // R fix: V2, blind 70 % right; "getting taller" was absurd. A pride near miss (the wrong step) replaces it.
    // why: nerve ← pride at last asking her, the usual script; shallow friends ← "look at me" heard as aimed at them
    { id: 'h1', skill: 'humor', level: 'C1', point: 'growing', seg: [16.8, 23.6],
      stem: 'Why does “Look at me…” get a laugh?',
      choices: ['He’s proud of a change that’s really tiny', 'He’s proud he finally got the nerve to ask', 'He’s mocking how shallow his friends are'], a: 0,
      cue: '最後の動詞と、直前に言った決心の中身。',
      line: 'Look at me, *I’m growing*.',
      said: '「見てよ、僕って成長してる」と自分をほめる。',
      mean: '見た目を気にしないことを大きな成長のように言う。そのこと自体が小さな話なのが笑い。',
      trap: '勇気を出した話に聞こえやすいが、直前の決心は頭を気にしないこと。小さな話を大きく言うのが笑い。',
      use: 'Look at me, cooking dinner!（見て、夕飯作ってるよ！）' },

    // R fix: V2, blind 75 % right. A direction flip (he manages) replaces "not so big after all".
    // why: manages ← "don't get hung up on it" and the list heard as working; his own head ← "my head must look like a
    //   golf ball" is about him
    { id: 'g2', skill: 'gist', level: 'B2', point: 'date', reveals: ['list'], seg: [25.5, 56.5],
      stem: 'During the date, what keeps happening in Chandler’s head?',
      choices: ['He tries to let it go and keeps failing', 'He tries to let it go and, by the end, does', 'He keeps worrying she’ll judge his looks'], a: 0,
      cue: '心の声が何度も戻ってくる話題。',
      said: 'アリソンの話を聞きながら、心の中で彼女の頭のことばかり考え、気にしないよう自分に言い聞かせる。',
      mean: '「こだわらない」と決めたのに、頭から離れない。前半の決心がくずれていく。',
      trap: '言い聞かせる言葉や自分の頭の話も出るが、最後はまた同じ話題に戻ってしまう。',
      use: 'I can’t stop thinking about it.（そのことが頭から離れない）' },

    // R fix: V2, blind 70 % right; "the best choice" was a filler. A near miss (her job now) replaces it.
    // why: job now ← "useless" + work talk heard as her present job; too hard ← "useless" taken as "I couldn't use
    //   it"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'major', seg: [26.2, 32.5],
      stem: 'What does Allison say about what she studied?',
      choices: ['It didn’t help her find a job', 'It doesn’t help in her job now', 'It was too hard for her to finish'], a: 0,
      cue: '「my major」のあとの形容詞。',
      line: 'Oh, my major was *totally useless*.',
      said: '「私の専攻、まったく役に立たなかった」と話す。',
      mean: 'major ＝ 大学の専攻。仕事探しに役立たなかったという話。',
      trap: 'useless だけだと今の仕事の話にも聞こえる。続く classifieds（求人欄）が、仕事探しの話だと決める。',
      use: 'My degree was totally useless here.（ここでは学位がまるで役に立たない）' },

    // R fix: V2, blind 60 % right; "new topic" was weak. A softener reading (the Japanese frame) replaces it.
    // why: correcting ← "I mean" as 言い直し; softening ← "I mean" heard as a hedge (まあ)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['major'], seg: [26.2, 32.5],
      stem: 'What does Allison’s “I mean” do after her first remark?',
      choices: ['It leads into why she says so', 'It softens what she just said', 'It takes back what she just said'], a: 0,
      cue: '最初の一文のすぐあと、文頭の2語。',
      line: '*I mean*, how often do you look in the… and see “philosopher wanted”?',
      said: '「だってさ、求人で『philosopher 求む』なんて見る？」と続ける。',
      mean: 'I mean ＝ つまり・だって。前の発言の理由や中身を足す合図。',
      trap: 'I mean は言い直しにも使うが、ここでは前の発言を取り消していない。',
      use: 'It’s far. I mean, two hours by bus.（遠いよ。だってバスで2時間）' },

    // R fix: V2, blind 50 % right; "checks daily" was weak. Both distractors are now real-question readings.
    // why: asks him ← "how often do you" read as a real question about his habits; any such job ← the question heard
    //   as asking for a lead
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'often', reveals: ['major'], seg: [28.1, 32.5],
      stem: 'What is Allison doing with her “how often…” question?',
      choices: ['Saying nobody ever hires for that', 'Asking how often he reads the job ads', 'Asking if he knows of any such job'], a: 0,
      cue: '質問のあと、答えを待っているかどうか。',
      line: '*how often* do you look in the… and see “philosopher wanted”?',
      said: '「求人欄で『philosopher 求む』なんて、どれくらい見る？」と言う。',
      mean: '答えを求めない質問。「そんな求人はまずない」と言っている。',
      trap: 'how often を本当の質問と取りやすい。答えが明らかな問いは、意見の言い方。',
      use: 'Who has time for that?（そんな暇ある人いる？）' },

    // R fix: V2/K6, blind 75 % right; the key was the only "barely" against two "closely/fully". Now a scale, ascending.
    // why: partly ← "Hmm" heard as a tired, flat reply (bored, not elsewhere); fully ← "sure" as はい、その通り
    { id: 't1', skill: 'attitude', level: 'C1', point: 'sure', seg: [30.3, 38.1], keep: true,
      stem: 'When Chandler answers Allison, how much is he listening?',
      choices: ['Barely; his mind is somewhere else', 'Partly; he’s tired and losing interest', 'Fully; he just agrees with her'], a: 0,
      cue: '短い返事と、そのすぐあとの心の声。',
      line: '*Hmm, sure.* … My God, that’s a big head.',
      said: '「うん、そうだね」とだけ返し、すぐ心の中で「なんて大きな頭だ」と思う。',
      mean: '返事は上の空。頭の中は話の中身ではなく、彼女の見た目でいっぱい。',
      trap: 'sure を同意、Hmm を退屈と取りやすい。短い返事は、直後の心の声で判断する。',
      use: 'Sorry, I zoned out. What did you say?（ごめん、ぼーっとしてた。何て？）' },

    // R fix: V2, blind 60 % right; "amused" was weak. A "let down" reading replaces it.
    // why: let down ← "My God" read as disappointment and regret; bored ← "Hmm, sure" carried over as lack of
    //   interest
    { id: 't2', skill: 'attitude', level: 'B2', point: 'mygod', reveals: ['lighting'], seg: [33.95, 42.3],
      stem: 'In his thoughts at the table, how does Chandler feel?',
      choices: ['Alarmed, and trying to calm down', 'Let down, and sorry he asked her out', 'Bored, and looking for a way out'],
      a: 0,
      cue: '最初の叫びと、そのあとの言い訳。',
      line: '*My God*, that’s a big head. … *Maybe it’s the lighting.*',
      said: '「うわ、大きい」と驚き、「職場ではこんなじゃなかった。照明のせいかも」と考える。',
      mean: '驚いたあと、理由を探して自分を落ち着かせようとしている。',
      trap: 'がっかりや退屈にも見えるが、心の声は驚いたあと、照明のせいにして落ち着こうとしている。',
      use: 'Okay, stay calm. It’s probably nothing.（落ち着け、きっと大丈夫）' },

    // R fix: V2, blind 60 % right; "blame himself" was weak. A wrong-feature reading (she looks tired) replaces it.
    // why: brighter table ← "lighting" heard as a request to move; tired ← lighting blamed for how someone looks, the
    //   size lost
    { id: 'i2', skill: 'infer', level: 'C1', point: 'lighting', seg: [37.9, 42.3],
      stem: 'Why does Chandler bring up the lighting?',
      choices: ['To explain why it looks bigger tonight', 'To explain why she looks tired tonight', 'To suggest moving to a brighter table'], a: 0,
      cue: '「in the office」と比べている点。',
      line: 'It *didn’t look this big in the office*. *Maybe it’s the lighting*.',
      said: '「会社ではこんなに大きく見えなかった。照明のせいかな」と思う。',
      mean: '職場と今の差を照明のせいにして、気にしないための理由を探している。',
      trap: 'lighting で席を移る話を想像しやすいが、心の中の言い訳。口には出していない。',
      use: 'Maybe it’s just the jet lag.（時差ぼけのせいかも）' },

    // why: pale and round ← golf ball read for its look (white, dimpled); laughed at ← "at work" heard as what others
    //   think of him there
    // anchor: 38.6–41.8 s "It didn't look this big in the office. Maybe it's the lighting." then 42.7–45 s "My head
    //   must look like a golf ball at work": if the office makes her head look normal, it makes his look tiny
    // retired: one C2 alone is under 2 (nt1 retired)
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'golfball', reveals: ['lighting'], seg: [37.9, 46.4], retired: true,
      stem: 'Which plain-English version keeps what Chandler means by the golf ball?',
      choices: ['“If work light shrinks her head, mine must look tiny.”', '“At work, my head must look round and pale.”',
                '“People at work must laugh at the size of my head.”'], a: 0,
      cue: '「in the office」と「at work」を結ぶ理屈。',
      line: 'It didn’t look this big *in the office*. … My head must look like *a golf ball at work*.',
      said: '会社では大きく見えなかったのは照明のせい、と考え、「じゃあ会社では自分の頭はゴルフボールだ」と続ける。',
      mean: '照明で頭が小さく見えるなら、自分の頭も会社では小さく見えているはず、という理屈の飛び方が笑い。',
      trap: 'ゴルフボールの色や形に引かれやすい。前の文とつないで、比べている物を追う。',
      use: 'If that’s small, mine must be tiny.（それが小さいなら、私のは極小だ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'hangup', seg: [46.3, 48.4],
      stem: 'Type what Chandler tells himself: “All right, ___.” (6 words)', answer: "don't get hung up on it",
      cue: '「All right」のすぐあと。後ろの3語がつながる。',
      line: 'All right, *don’t get hung up on it*.',
      said: '「よし、こだわるな」と自分に言う。',
      mean: 'get hung up on ～ ＝ ～にこだわる、気にしすぎる。up on it は「アポニッ」とつながる。',
      trap: 'don’t の t が消えて「ドン」に近い。get の後ろは hung（過去分詞）。',
      use: 'Don’t get hung up on the details.（細かいことは気にしないで）' },

    // anchor: 47–48.4 s "don't get hung up on it", then 48.4–54.9 s the list he sets himself, "five things you like
    //   about her", runs out after two and repeats "big head": his own trick for not fixating fails
    // R fix: V2, blind 55 % right; "pushed him to go" was weak. Now: right mechanism (the list fails), wrong target.
    // why: Allison ← the list seems to find only two good points; his friends ← he's been reporting to them all along
    // retired: for the draws (play 3+ under g2 drew no C2: g2 reveals its point)
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'list', reveals: ['five'], seg: [46.3, 56], retired: true,
      stem: 'In the list Chandler makes to calm himself, who is the joke on?',
      choices: ['Chandler, whose fix for fixating backfires', 'Allison, who has only two good points', 'His friends, whose advice clearly failed'], a: 0,
      cue: '自分に出した指示と、リストの終わり方。',
      line: 'list five things you like about her. Nice smile, good dresser, *big head, big head, big head*.',
      said: '「好きなところを5つ挙げろ」と自分に言うが、2つ目のあとは「大きな頭」をくり返してしまう。',
      mean: 'こだわりを消すための作戦が、こだわりそのものに戻る。笑われているのは彼の頭の中。',
      trap: '話題が彼女の見た目なので、彼女が的に見えやすい。誰の作戦が失敗しているかを聞く。',
      use: 'Don’t think about pizza. Great, now I am.（ピザを考えるな…考えちゃった）' },

    // why: three ← "quick, quick" heard as a count; nine ← five/nine rhyme
    { id: 'n2', skill: 'number', level: 'B1', point: 'five', seg: [48.38, 51.95], keep: true,
      stem: 'How many things does Chandler tell himself to list?',
      choices: ['Three', 'Five', 'Nine'], a: 1,
      cue: '「list」の直後の数。',
      line: 'Quick, quick, list *five things* you like about her.',
      said: '「早く、彼女の好きなところを5つ挙げろ」と自分に言う。',
      mean: '良いところに目を向けて、気をそらそうとする作戦。',
      trap: 'five と nine は母音が同じ「アイ」。最初の f の音で聞き分ける。',
      use: 'Name three things you’re grateful for.（感謝していることを3つ挙げて）' },
  ]
};
