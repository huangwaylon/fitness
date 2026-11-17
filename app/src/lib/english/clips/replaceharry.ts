// “One Direction Stars on ‘iCarly’ 🤩 (ft. "What Makes You Beautiful") | @NickRewind” (NickRewind, Best of iCarly):
// Harry is still in bed at Carly's, so the friends suspect he's enjoying the care and scare him back on stage with a
// "replacement"; then a makeover goes wrong, and the clip ends on One Direction's song.
// Segments from the captions, words from whisper (2026-11-17). Harry and Carly are named in the audio; Sam is the one
// with the butter sock and "Hotel Carly-fornia" (not named in the audio, so no key rests on who says it); Harry is the
// one asking "What time's iCarly?" and pleading "please don't let him sing". The singers at 93–111 s (captions have
// nothing there), the "Moron!" (whisper only, 199 s) and the songs (142–176 s, 232–346 s) aren't used. Lines where the
// sources split are kept out of keys: "why it's / he's not getting better" (14 s), "I know it / what might motivate"
// (60.7 s), "Boy mandible / Vangible" (228 s).
// REVIEW 2026-11-17: pass 8, fix 15, drop 0, new 0; ear checks 3 (unchanged)
// OPEN: the clip is about half song (142–176 s, 232–346 s); it still holds 23 honest items from the talk, so it's
//   kept. i3 rests on "if you were treating me" being said to Carly; if the user hears it aimed at Sam, the key holds.
// EAR CHECK: 127.2 s r1 — the cut falls in the pause after “sing”, before “or dance” (captions 126.08 / 127.60,
//   whisper 126.7 / 127.8)
// EAR CHECK: 67.0 s s1 — “Did she say butter sock?” (both sources): the “sh” of “she” is clear, not “did ya”
// EAR CHECK: 62.0 s x1 — “get out of bed” (both sources) runs together, with the flapped t
import type { Clip } from '../types.ts';

export const replaceHarry: Clip = {
  id: 'replaceharry', video: 'Rb1gT8F3zTQ', title: 'One Direction Stars on ‘iCarly’ (ft. “What Makes You Beautiful”)',
  dur: 348, wpm: 119, band: 'slow', tags: ['友だち', '家'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: blind 55 %: the key was the only choice that matched the whole stretch; the others were one-line side
    //   topics. Both distractors now follow the key's two-part shape and come from what's said.
    // why: who replaces him ← "replaced" is said four times, but "not for real"; Carly should stop ← Sam's list of
    //   Carly's care heard as the problem they set out to fix
    { id: 'g1', skill: 'gist', level: 'B2', point: 'plan', reveals: ['faking', 'replace'], seg: [0.5, 91.0],
      stem: 'What is the first part of the scene mostly about?',
      choices: ['Whether Harry is really still sick, and how to get him up',
                'Whether Harry is really still sick, and who should replace him',
                'Whether Carly is spoiling Harry, and how she can stop it'], a: 0,
      cue: '前半の「faking」と、後半の「idea」に注目。',
      said: 'Harry が治らないのは世話が楽しいからでは、という話から、起こす作戦へ進む。',
      mean: 'ショーの中止は前提。中心は Harry の本当の様子と、その対策。',
      trap: 'replace は何度も聞こえるが not for real。世話の話は作戦の理由。',
      use: 'What are we gonna do about this?（これ、どうする？）' },

    // why: move ← "San Francisco" + shows heard without "cancel"; without him ← the "the show must go on" script
    { id: 'd1', skill: 'detail', level: 'B1', point: 'friday', seg: [0.6, 8.5],
      stem: 'What will happen if Harry isn’t better by Friday?',
      choices: ['They’ll cancel their shows in San Francisco', 'They’ll move their shows to San Francisco',
                'They’ll go on to San Francisco without him'], a: 0,
      cue: '「Friday」のすぐあとの動詞。',
      line: 'if Harry’s not better by Friday, we’ll have to *cancel our shows* in San Francisco.',
      said: '金曜までに Harry が治らなければ、サンフランシスコ公演は中止。',
      mean: 'have to cancel ＝ 中止せざるをえない。困った状況から場面が始まる。',
      trap: '地名が強く聞こえ、動詞を聞きのがしやすい。地名より先に、何をするかを聞く。',
      use: 'We’ll have to cancel our trip.（旅行を中止しないといけない）' },

    // R fix: blind 55 %: the key was the only kind choice; the cue leaked "well" (in the key only). The tired carer
    //   is now an annoyed one ("I don't know why he's not getting better" heard as a complaint), and the cue names
    //   no word.
    // why: sick ← "feel awful" = 体調が悪い (literal reading); annoyed ← "I don't know why he's not getting better"
    //   heard as blaming him
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'feelawful', seg: [12.3, 15.3],
      stem: 'How does Carly feel as she talks about Harry?',
      choices: ['Sorry that he isn’t getting better', 'Sick, as if she’s caught it from him',
                'Annoyed that he won’t try to get better'], a: 0,
      cue: 'Carly の最初の短い文と、その次の文。',
      line: 'Well, I *feel awful*.',
      said: '「本当に気がとがめる」と言い、なぜ治らないのか分からない、と続ける。',
      mean: 'feel awful は体調にも使うが、ここは「申し訳ない・心配」。看病する側の言葉。',
      trap: '体の具合と取ると「うつった」、次の文を不満と取ると「いらいら」に。',
      use: 'I feel awful about being late.（遅れて本当にごめんね）' },

    // R fix: blind 70 %: the stem quoted the sweet words, and the key was the one middle reading between praise and
    //   anger. The stem now names the moment only, and "comforting" (she follows Carly's "I feel awful") replaces the
    //   angry extreme.
    // why: praising ← "sweet, innocent" heard without what follows; comforting ← the reply comes right after "I feel
    //   awful", where comfort is the script
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'stupid', seg: [15.3, 24.6],
      stem: 'When Sam answers Carly’s worry about Harry, how is she treating Carly?',
      choices: ['Teasing her for missing what’s going on', 'Comforting her so she won’t feel so bad',
                'Praising her for caring so much for Harry'], a: 0,
      cue: 'ほめ言葉のあとに続く一語と、Carly の返事。',
      line: 'Oh, *sweet, innocent, stupid little Carly*. — Why am I stupid?',
      said: '「かわいくて、うぶで、おばかな Carly」と言われ、Carly が聞き返す。',
      mean: 'ほめ言葉の最後に stupid を置く、親しい相手へのからかい。',
      trap: '直後なので慰めに聞こえやすい。最後の stupid と、Carly の返事で決まる。',
      use: 'Oh, honey, no.（あらら、違うってば）' },

    // why: washes ← warm/wash share the opening sound and "socks" follows; cuts hair ← "his hair" is said, with "brush"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'socks', seg: [26.2, 34.9],
      stem: 'Which of these does Sam say Carly does for Harry?',
      choices: ['She warms his socks', 'She washes his socks', 'She cuts his hair'], a: 0,
      cue: '「breakfast in bed」のあと、靴下の前の動詞。',
      line: 'you make him breakfast in bed and you *warm his socks*… and brush his hair',
      said: '朝ごはん、靴下を温める、本を読む、髪をとかす、と Carly の世話を並べる。',
      mean: 'warm はここでは動詞「温める」。世話の多さが話の中心。',
      trap: 'warm と wash は出だしが似ている。hair は聞こえても、するのは brush。',
      use: 'Could you warm up my coffee?（コーヒー温め直してもらえる？）' },

    // R fix (K1): "he wishes Carly would look after him like that" is defensible too: the boy's answer is half a
    //   flirt. It's now the near-sound reading (would/wouldn't), which "sure wouldn't want to leave" refutes.
    // why: be made to leave ← "wouldn't" heard as "would", with the n't lost before "want"; too soft ← "the way
    //   you've been treating Harry" heard as a criticism of Carly
    { id: 'i3', skill: 'infer', level: 'C1', point: 'leave', seg: [36.5, 44.6],
      stem: 'When Sam asks one of the boys for his view, what does his answer show?',
      choices: ['He thinks Harry has good reason to stay in bed', 'He thinks Harry should be made to leave now',
                'He thinks Carly is too soft on the whole band'], a: 0,
      cue: '「if you were」で始まる、仮の話。',
      line: '*if you were treating me* like you’ve been treating Harry, I *sure wouldn’t want to leave*.',
      said: '「もし僕がそんな扱いをされたら、絶対出て行きたくない」と答える。',
      mean: '仮の話で Sam に同意している。Harry が出てこないのも当然、ということ。',
      trap: 'wouldn’t の t は want の前で消え、would に聞こえやすい。',
      use: 'If I were you, I’d stay.（僕が君なら残るね）' },

    // why: never sick ← "faking" is the word in the air; too proud ← "I'm not faking" heard as Harry hiding how ill he is
    { id: 'i1', skill: 'infer', level: 'B2', point: 'faking', seg: [40.4, 51.6],
      stem: 'What does Sam think is going on with Harry?',
      choices: ['He was sick, but now he’s enjoying the care', 'He was never really sick in the first place',
                'He’s still sick but too proud to say so'], a: 0,
      cue: '「faking」という語のあと、Sam が言い直す部分。',
      line: 'I’m *sure he was sick*. I just think *now he’s having a good time*…',
      said: '「病気だったのは本当。でも今は楽しんでるだけ」と Sam が言う。',
      mean: '仮病だとは言っていない。もう治ったのに、居心地がよくて出てこない、という見方。',
      trap: 'faking が何度も聞こえるので「最初から仮病」に引かれる。was sick に注目。',
      use: 'I think he’s just enjoying the attention.（注目されて楽しんでるだけだと思う）' },

    // R fix: blind 60 %: the holiday choice left the hotel frame, so two choices were hotel guests or prisoners and
    //   one wasn't. It's now a guest who faked it, wrong in one way: "I'm sure he was sick".
    // why: stuck ← a fluent listener who knows the song "Hotel California" hears "you can never leave", but nothing in
    //   the clip keeps him there; faked ← "faking" is in the air, and Sam's "I'm sure he was sick" is quick
    // anchor: 43.44 s "I sure wouldn't want to leave" (want, not can't); 48.40 s "having a good time at": a guest who
    //   won't check out
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'hotel', reveals: ['faking', 'leave'], seg: [40.4, 51.6],
      stem: 'Which plain-English version keeps what Sam means by her hotel line?',
      choices: ['“He’s a guest who’s too comfortable to check out.”', '“He’s stuck there and can’t find a way to leave.”',
                '“He’s a guest who faked being ill to get a room.”'], a: 0,
      cue: '直前の「want to leave」と、「good time」。',
      line: 'I *sure wouldn’t want to leave*. … he’s *having a good time* at Hotel Carly-fornia.',
      said: '「出て行きたくない」のあと、Sam が「ホテル・カーリフォルニアで楽しんでる」と言う。',
      mean: '出られない客でなく、居心地がよくて出たくない客のたとえ。',
      trap: '曲を知っていると「出られない」、faking から「仮病」と取りやすい。鍵は was sick と good time。',
      use: 'He’s in no hurry to check out.（チェックアウトする気がない）' },

    // R fix: blind 60 %: "Sam’s name for Carly’s place" all but said "hotel", and "his home in California" isn't in
    //   the clip. The stem now names the moment, and that distractor ties to the cancelled California shows (→ reveals 'friday').
    // why: shows ← San Francisco (California) shows from the opening; charge ← hotel = paying for a room
    { id: 'h1', skill: 'humor', level: 'C1', point: 'hotel', reveals: ['faking', 'friday'], seg: [44.5, 51.8],
      stem: 'Why does Sam’s last line about Harry get a laugh?',
      choices: ['It turns Carly’s place into a hotel he loves', 'It teases Harry for missing the California shows',
                'It hints that Carly should charge him for the room'], a: 0,
      cue: '「good time at」のあと、Carly の名前がどう変わるか。',
      line: 'he’s having a good time at *Hotel Carly-fornia*.',
      said: 'Carly と California を混ぜて「ホテル・カーリフォルニア」と呼ぶ。',
      mean: '至れり尽くせりの世話を、高級ホテルの滞在にたとえたダジャレ。',
      trap: 'California から公演の話と取りやすいが、Carly と混ぜた造語。地名の中の名前を聞く。',
      use: 'It’s like a five-star hotel here.（ここ、五つ星ホテルみたい）' },

    // R fix: blind 60 %: the stem quoted the phrase under test (§9.2), and "say it again louder" was a filler. The
    //   stem names the moment; the third choice is now the "just say that" request misreading.
    // why: never said ← the literal denial (did not); repeat ← "just say that" heard as a request (今のもう一回)
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'proud', seg: [51.6, 56.0],
      stem: 'Right after Sam’s joke about Harry, what does the next line do?',
      choices: ['Reacts to a pun too bad to believe', 'Denies that Sam ever said those words',
                'Asks Sam to repeat what she just said'], a: 0,
      cue: 'ダジャレの直後の反応と、Sam の返事。',
      line: '*You did not just say that.*',
      said: 'Sam のダジャレに、「今それ言った？」とあきれた声を上げる。',
      mean: '事実の否定でなく「信じられない、言っちゃったよ」というツッコミ。',
      trap: 'did not を文字通り「言っていない」と取ると話が合わない。言ったからこそ出る言葉。',
      use: 'You did not just eat my fries.（まさか私のポテト食べた？）' },

    // R fix (S1): "that reaction" leaned on p2's stem; p2 and nt2 share a point and are never drawn together, so it
    //   pointed at nothing. The stem now quotes the groan (p2's phrase, safe on a shared point).
    // why: takes it back ← "I said it" heard as an admission before an apology (the 謝罪 frame); blames ← the reply
    //   heard as turning on the person who groaned
    // anchor: 52.08 s the groan is shaped as a denial of fact ("did not just say"); 53.60 s "I said it" answers that
    //   literal claim, and "I'm proud of it" owns the pun
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'proud', seg: [51.6, 56.0],
      stem: 'Why is Sam’s answer to “You did not just say that” funny?',
      choices: ['It answers the groan as if it were a real charge', 'It takes the pun back as if she were ashamed',
                'It blames the groaner for setting up the pun'], a: 0,
      cue: '相手の言い方（did not）と、Sam の最初の3語。',
      line: 'You did not just say that. — *I said it and I’m proud of it.*',
      said: '「今それ言った？」に、Sam は「言ったよ。誇りに思ってる」と返す。',
      mean: 'あきれの言葉を「言っていない」という主張として受け、「言った」と事実で返して胸を張る。',
      trap: '「言った」と認めたら次は謝る、と思いやすいが、proud で開き直っている。',
      use: 'Guilty as charged. I’d do it again.（その通り。また言うよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'outofbed', seg: [59.9, 63.55],
      stem: 'Type the words: “…motivate Harry to ___ and back on stage.” (4 words)', answer: 'get out of bed',
      cue: '「Harry to」のすぐあと、つながった短い語。',
      line: 'might motivate Harry to *get out of bed* and back on stage.',
      said: '「Harry をベッドから出して、ステージに戻らせる」方法の話。',
      mean: 'get out of が「ゲラウロブ」と一続き。t が弾み、of は弱い。',
      trap: '切れ目が聞こえにくく get up にも聞こえる。最後の bed から逆に組み立てる。',
      use: 'I can’t get out of bed today.（今日は起きられない）' },

    // R fix: blind 55 %: "with the butter sock" made the one physical choice the key, and "working on his singing"
    //   was weak. It's now a home-remedy reading (Carly warms his socks), and the stem names the speaker neutrally.
    // why: talking into ← "work on someone" = persuade, a near idiom; remedy ← socks were just part of Carly's care
    //   ("you warm his socks"), so a butter sock sounds like a cure
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'workover', seg: [59.9, 66.7],
      stem: 'With the butter sock, what does the speaker offer to do to Harry?',
      choices: ['Beat him until he gets up', 'Talk him into getting up', 'Treat him with a home remedy'], a: 0,
      cue: '「should」のあと、him をはさむ動詞句。',
      line: 'You think I should *work him over* with a butter sock?',
      said: 'バター入りの靴下で「ぼこぼこにする」か、と言っている。',
      mean: 'work someone over ＝ 痛めつける（くだけた言い方）。Sam らしい乱暴な案。',
      trap: 'work on（説得）と形が似て、靴下は看病にも出てきた。over が付くと手荒な意味。',
      use: 'They really worked him over in the interview.（面接でかなり絞られてたよ）' },

    // why: not sure ← "I don't" heard as 「わからない」 (I don't know); agrees ← "you know" + "really" heard as a
    //   reluctant yes
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'reallydont', reveals: ['workover'], seg: [59.9, 66.7],
      stem: 'After the butter-sock question, what does the reply do?',
      choices: ['Turns the idea down firmly', 'Says she isn’t sure what it means', 'Agrees to it, but not happily'], a: 0,
      cue: '答えの最後の一語と、その前のくり返し。',
      line: 'You think I should work him over with a butter sock? — You know, I *really, really don’t*.',
      said: '「バター靴下で痛めつけろって？」に「全然そうは思わない」と返す。',
      mean: 'I don’t は I don’t think so の省略。really を重ねて、はっきり断る。',
      trap: 'know を補うと「分からない」になる。You think…? への返事。',
      use: 'Do I want to? I really don’t.（したいかって？全然）' },

    // why: Does ← did/does both shrink to a short "d" plus a vowel; Did you ← "did-ja" in fast speech; Didn't ← the n't
    //   nasal is easy to imagine before "she"
    { id: 's1', skill: 'sound', level: 'B2', point: 'didshe', seg: [66.5, 71.0],
      stem: 'Fill the gap: “___ say butter sock?”',
      choices: ['Did she', 'Does she', 'Did you', 'Didn’t she'], a: 0,
      cue: '文頭の2語。2語目の子音に注目。',
      line: '*Did she* say butter sock? Is that a sock full of butter?',
      said: '男の子が「今バター靴下って言った？バターが詰まった靴下？」と驚く。',
      mean: 'Did she が「ディシ」のように一続き。she の「シ」が、誰の話かを決める。',
      trap: 'Did you なら「ジャ」に近い音になる。今の一回の発言なので Does でもない。',
      use: 'Did she say what time?（何時って言ってた？）' },

    // R fix: blind 65 %: "the new idea" in the stem matched the key's "suggestion". The stem names the turn only.
    // why: watch ← look = 見る (literal); impatience ← "Look," also opens an irritated reply, right after the butter-sock
    //   back-and-forth
    { id: 'm1', skill: 'marker', level: 'B2', point: 'look', reveals: ['replace'], seg: [78.3, 85.1],
      stem: 'In the turn that opens with “Look”, what does that first word do?',
      choices: ['It gets everyone’s attention before a suggestion', 'It asks everyone to watch something closely',
                'It shows impatience with the earlier ideas'], a: 0,
      cue: '「my idea」のやりとりのあと、文頭の一語。',
      line: '*Look*, I was just thinking… if he thought he was gonna be replaced…',
      said: '「あのさ、ちょっと思ったんだけど」と案を出し始める。',
      mean: '文頭の Look は「ねえ、聞いて」。提案や説明の前に注意を向ける合図で、何も見せていない。',
      trap: 'Look は怒った返事にも使うが、ここは「聞きたい？」「うん」のあとの穏やかな提案。',
      use: 'Look, I’ve got an idea.（ねえ、いい考えがあるんだ）' },

    // R fix: blind 60 %: only the key was a "make him think" trick; the others plainly wouldn't get him up. Both now
    //   share the key's shape or its word. The cancel choice gives away d1's key → reveals 'friday'.
    // why: for real ← "Replace Harry?" is said just before "not for real"; cancelled ← "cancel our shows" from the
    //   opening, a guilt trick in the same "make him think" shape
    { id: 'd3', skill: 'detail', level: 'B2', point: 'replace', reveals: ['friday'], seg: [78.3, 91.0],
      stem: 'What is the idea for getting Harry back on stage?',
      choices: ['Make him think he’s about to be replaced', 'Make him think the shows will be cancelled',
                'Replace him for real so the shows go on'], a: 0,
      cue: '「Replace Harry?」への答えの、最初の3語。',
      line: 'Well, *not for real*. We just *make him think* he’s being replaced.',
      said: '「本当に替えるんじゃない。替えられると思わせるだけ」と説明する。',
      mean: '入れ替わりのふりで焦らせて、ベッドから出させる作戦。',
      trap: 'replace が何度も聞こえるので本当の交代に、冒頭の cancel から中止の話にも見える。think の���を聞く。',
      use: 'Not for real, just pretend.（本気じゃなくて、ふりだけ）' },

    // R fix: blind 60 %: "asks to sing with the new singer" was a filler. It's now the stay-in-bed script, which
    //   "Yes" and "I'll be ready" refute.
    // why: admits faking ← "I'm feeling better" heard as a confession; one more day ← the lazy-patient script, with
    //   "You really think you can perform?" heard as doubt he'd share
    { id: 'g2', skill: 'gist', level: 'B1', point: 'outcome', reveals: ['sing'], seg: [111.8, 137.1],
      stem: 'How does the plan turn out?',
      choices: ['Harry says he’s well enough to perform', 'Harry admits he faked it and says sorry',
                'Harry begs for one more day to rest'], a: 0,
      cue: '「I’m feeling better」のあとの質問と、その答え。',
      line: '*I’m feeling better.* — You really think you can perform? — *Yes.*',
      said: 'Harry は「もう良くなった」と言い、「出られる？」と聞かれて「うん」と答える。',
      mean: '入れ替わりの作戦が効いて、Harry がショーに戻ると決める。',
      trap: '「良くなった」を仮病の告白と取りやすいが、謝る言葉はない。Yes が答え。',
      use: 'I’m feeling much better now.（もうだいぶ良くなったよ）' },

    // why: half an hour ← "about an" heard as "about a half"; two hours ← "hour" heard with a plural, and "I'll be
    //   ready" suggests time to spare
    { id: 'n1', skill: 'number', level: 'B1', point: 'hour', seg: [118.0, 122.1], keep: true,
      stem: 'When is iCarly, according to the answer Harry gets?',
      choices: ['In about half an hour', 'In about an hour', 'In about two hours'], a: 1,
      cue: '「What time」の質問のすぐあと。',
      line: 'What time’s iCarly? — *About an hour.*',
      said: '「iCarly は何時？」に「あと1時間くらい」と答える。',
      mean: 'About an hour は「1時間ほどで始まる」。時刻でなく、残り時間で答えている。',
      trap: 'an と a half はどちらも弱く短い。hour に s がないので1時間。',
      use: 'The bus comes in about an hour.（バスはあと1時間くらいで来る）' },

    // R fix: blind 50 %: "a reason he suddenly feels better" didn't follow from the pause. It's now a reason the
    //   singing was bad, the natural explaining move, and the kind word is reworded to the same length.
    // why: reason ← a complaint often gets its "because" next; kinder ← the Japanese habit of softening a complaint
    //   about someone with a follow-up
    { id: 'r1', skill: 'predict', level: 'B2', point: 'sing', seg: [122.8, 127.2], then: [127.2, 130.0],
      stem: 'Harry pauses after “…don’t let him sing”. What kind of words come next?',
      choices: ['One more thing the singer must never do', 'A reason the singing was so hard to hear',
                'A kinder way to say what he just said'], a: 0,
      cue: '「please」から始まるお願いの形と、声の止め方。',
      line: 'Just please don’t let him sing… *or dance ever again*.',
      said: '「お願いだから、あいつに歌わせないで…それと、二度と踊らせないで」。',
      mean: '間をおいて「それと」と足すのは、まだ言い足りない合図。お願いがもう一つ来る。',
      trap: '悪口のあとは理由かフォロー、と思いやすいが、間のあとに注文をもう一つ重ねる。',
      use: 'Please don’t call me… or text me.（電話しないで…メールもね）' },

    // R fix: blind 50 %: the key alone echoed the request ("singing and dancing"). It's reworded with no clip word.
    // why: too good ← the replacement "threat" read as a real rival; friend ← "please" heard as protecting him
    { id: 'i2', skill: 'infer', level: 'B2', point: 'sing', seg: [122.8, 129.6],
      stem: 'What does Harry’s last request suggest about the new singer?',
      choices: ['His act was painful to sit through', 'He was too good for Harry to compete with',
                'He was Harry’s friend and mustn’t be hurt'], a: 0,
      cue: '「please」のあと、何を「二度と」させたくないか。',
      line: 'Just please *don’t let him sing… or dance ever again*.',
      said: '「もう二度と、あいつに歌わせたり踊らせたりしないで」と頼む。',
      mean: '代わりの歌と踊りがひどかったので、自分が戻ることにした、と分かる。',
      trap: '代わりに取られるのが怖い、と読みやすいが、ever again は「もうこりごり」の言い方。',
      use: 'Please never make me do karaoke again.（二度とカラオケさせないで）' },

    // why: loves it ← "You look great" is the last praise heard; start over ← "Bethany, wait" heard as an offer to fix it
    { id: 'g3', skill: 'gist', level: 'B2', point: 'makeover', seg: [177.6, 216.4],
      stem: 'How does the makeover scene end?',
      choices: ['She hates the result and walks out on him', 'She loves it and runs off to show people',
                'He admits it’s bad and offers to start over'], a: 0,
      cue: '鏡を見たあとの彼女の一言と、彼の呼びかけ。',
      said: '「来たときよりひどい」と言って彼女は出ていき、彼が「戻って」と追う。',
      mean: 'メイクは失敗し、彼女は怒って去る。彼はこのまま終わらせたくない。',
      trap: 'You look great はメイクした側の言葉。本人の I look awful のほうが結末を決める。',
      use: 'Wait, come back! Let me explain.（待って、戻って！説明させて）' },

    // R fix: blind 50 %: "a real fight" overstated a botched makeover, and the key was the only abstract choice.
    //   The key now names the makeover; the other two are reworded to its length.
    // why: writing ← "our story" read as a piece of writing (literal); finish telling ← "story can't just end" heard as
    //   her story being cut off
    { id: 'h2', skill: 'humor', level: 'C1', point: 'resolution', reveals: ['makeover'], seg: [201.5, 216.4],
      stem: 'Why is his last plea to Bethany funny?',
      choices: ['He talks about a bad makeover like a TV drama', 'He means the story he’s been writing about her',
                'He wants her to stay and finish her story'], a: 0,
      cue: '「story」と「resolution」という言葉の選び方。',
      line: '*Our story* can’t just end like this! We need some kind of *resolution*!',
      said: '去る彼女に「僕らの物語がこんな終わり方じゃだめだ！決着が要る！」と叫ぶ。',
      mean: 'resolution は物語の「結末」。メイクの失敗をドラマの筋のように語るのがおかしい。',
      trap: 'story を本当の物語と取りやすいが、失敗したメイクのこと。',
      use: 'I just need some closure.（ちゃんと区切りをつけたいだけ）' }
  ]
};
