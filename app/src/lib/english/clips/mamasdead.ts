// REVIEW 2026-11-16: pass 6, fix 14, drop 0, new 0; ear checks 1
// OPEN: r1's cut at 63.5 s is 0.2 s before "I'm" (captions), under the 0.3 s rule; moving it earlier would clip "will".
// “"Well hey, your Mama's dead" - The Office US” (the official The Office channel, Best of Season 4): Toby asks
// Michael to deal with Stanley's outburst; Michael insists it was a joke, then dodges Toby's challenge to go and ask.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 82 s; whisper's repeated line after it
// is a hallucination. The lines at 33–53 s (Michael's race and "your mama's dead" jokes) are untested on purpose; the
// garbled opening (0–3 s) and "whoa, what, dog" (24–27 s) carry no key. Speakers are settled by "Toby" (27.9 s) and
// "Michael" (71.2 s).
// EAR CHECK: 63.5 s r1 — the cut falls after “Okay. I will.” and before “I'm not feeling…” (captions: will 63.2, I'm 63.7)
import type { Clip } from '../types.ts';

export const mamasDead: Clip = {
  id: 'mamasdead', video: '-1YWcInBOgg', title: '"Well hey, your Mama\'s dead"', dur: 104, wpm: 167, band: 'mid',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: Stanley is sick ← "stomach hurts" later in the clip; apologize ← "what happened with Stanley" read as Michael
    //   being the one at fault
    // R fix: its trap names the stomachache, d3's key (N7): added `stomach` to reveals.
    { id: 'g1', skill: 'gist', level: 'B1', point: 'deal', reveals: ['morning', 'insub', 'address', 'stomach'], seg: [0, 19.0],
      stem: 'Why has Toby come to see Michael?',
      choices: ['To get him to deal with Stanley’s rudeness', 'To tell him that Stanley is feeling unwell',
                'To get him to say sorry to Stanley'], a: 0,
      cue: '「I really think that you need to」のあと。',
      said: 'トビーが、今朝のスタンリーの件に対処すべきだと言い、上司への反抗だったと続ける。',
      mean: '人事のトビーは、部下の態度をマイケルにきちんと処理してほしい。',
      trap: '後半の「おなかが痛い」が耳に残ると病気の話に見えるが、それは別の人の話。',
      use: 'Can I talk to you for a second?（ちょっといいですか）' },

    // why: yesterday ← the past tense "what happened" alone; at lunch ← the usual time for office trouble
    { id: 'd1', skill: 'detail', level: 'B1', point: 'morning', reveals: ['address'], seg: [4.8, 10.6],
      stem: 'When did the trouble with Stanley happen?',
      choices: ['This morning', 'Yesterday', 'At lunchtime'], a: 0,
      cue: '「what happened with Stanley」のすぐあと。',
      line: 'what happened with Stanley *this morning*.',
      said: '「今朝のスタンリーの件に、対処すべきだと思う」と言う。',
      mean: 'ついさっきの出来事。だからトビーはすぐ話しに来た。',
      trap: 'happened の過去形だけで昨日と思いやすい。名前の後ろの2語が時を言う。',
      use: 'About what happened this morning…（今朝のことなんだけど）' },

    // R fix: "write it down on file" was a weak link to 住所 (V2); now "send a note", address = 宛先.
    // why: speech ← address = 演説; send a note ← address = 宛先, writing to someone
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'address', seg: [4.8, 10.6],
      stem: 'What does Toby want Michael to do about the incident?',
      choices: ['Deal with it directly', 'Give a talk about it', 'Send Stanley a note'], a: 0,
      cue: '「you need to」のあとの動詞。',
      line: 'I really think that you need to *address* what happened with Stanley',
      said: '「スタンリーの件に、ちゃんと向き合うべきだと思う」と言う。',
      mean: 'address ＝ 問題に取り組む、対処する。仕事でよく使う動詞。',
      trap: 'address は宛先や演説の意味もあるが、後ろに問題が来れば「対処する」。',
      use: 'We need to address this issue.（この問題に対処しないと）' },

    // why: confused ← "what are you…about?" taken as a real question; worried ← a boss hearing of trouble usually is
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'brushoff', seg: [10.4, 16.6],
      stem: 'How does Michael first respond to Toby’s concern?',
      choices: ['He brushes it off as nonsense', 'He’s honestly confused about it',
                'He’s worried about what Toby knows'], a: 0,
      cue: '質問の形だが、その直後の短い一文。',
      line: 'What are you *blabbering* about? *Nothing happened.*',
      said: '「何をぺちゃくちゃ言ってるんだ？何もなかったよ」と返す。',
      mean: 'blabber ＝ くだらないことをしゃべる。相手の話を相手にしない言い方。',
      trap: '疑問文なので本当に分からないと取りやすい。すぐ後で何もないと言い切る。',
      use: 'What are you talking about?（何言ってるの）' },

    // why: unhappy ← openly read as showing his feelings; honest ← openly = 正直に
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'insub', seg: [13.3, 16.8],
      stem: 'What does Toby say Stanley did?',
      choices: ['Defied his boss in front of others', 'Showed he was unhappy with his job',
                'Spoke his honest mind to his boss'], a: 0,
      cue: '「Stanley was openly」のあと、長い一語。',
      line: 'Stanley was *openly insubordinate*.',
      said: '「スタンリーは公然と上司に反抗した」と言う。',
      mean: 'insubordinate ＝ 上の人の指示に従わない、反抗的な。openly で人前だと分かる。',
      trap: 'openly を「正直に」と取ると良いことに聞こえる。後ろの長い語が中身。',
      use: 'That was out of line.（あれは言い過ぎだった）' },

    // why: break room ← the usual office spot for a clash; his office ← "my office" said later in the clip
    { id: 'd2', skill: 'detail', level: 'B1', point: 'room', seg: [15.9, 19.0],
      stem: 'Where did the clash with Stanley happen?',
      choices: ['In the conference room', 'In the break room', 'In Michael’s office'], a: 0,
      cue: '「That」のあと、聞き返しの場所。',
      line: 'That, in the *conference room*? — Yeah.',
      said: '「あれ？会議室のこと？」と聞き返し、トビーが「そう」と答える。',
      mean: 'みんなのいる会議室での出来事。人前だったので問題になる。',
      trap: '後で my office が出てくるので選びやすい。in the のあとの語を聞く。',
      use: 'Let’s talk in the conference room.（会議室で話そう）' },

    // R fix: "walking around the office" was a filler (V2); now "chatting about work", a guess for an unknown verb.
    // why: arguing ← "Did I stutter?" heard as a fight; chatting ← "joshing" unknown, filled in with the office default
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'joshing', seg: [18.8, 24.2],
      stem: 'How does Michael describe what he and Stanley were doing?',
      choices: ['Teasing each other for fun', 'Having a heated argument', 'Just chatting about work'], a: 0,
      cue: '「We were」のあと、-ing と around。',
      line: 'We were *joshing around*, the two of us',
      said: '「俺たち二人でふざけ合ってたんだよ」と言う。',
      mean: 'josh around ＝ からかい合う、ふざける。古めのくだけた言い方。',
      trap: 'josh を知らないと雑談と取りやすい。〜ing around は「〜して遊ぶ・ふざける」。',
      use: 'We were just kidding around.（ただふざけてただけ）' },

    // R fix: "says Stanley lied" was a filler (V2); now agreeing to end the talk, the Japanese frame for a quiet reply.
    // why: goes along ← "did seem" heard (the -n't lost); ends it ← a quiet, short reply read as giving in politely
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'doubt', reveals: ['seem'], seg: [26.9, 34.0],
      stem: 'How does Toby take Michael’s claim that Stanley was joking?',
      choices: ['He doesn’t buy it', 'He goes along with it', 'He agrees, just to end the talk'], a: 0,
      cue: '「He was joking, Toby」への返事と、マイケルの次の一言。',
      line: 'He was joking, Toby, all right? — He *didn’t seem like* he was joking. — Well, you don’t get it…',
      said: '「冗談だよ」に「そうは見えなかった」と返し、マイケルが「分かってないな」と言う。',
      mean: '静かだが、はっきり反対している。マイケルの反論もそれを示す。',
      trap: '強い言葉がないので受け入れたと取りやすい。seem の前の否定を聞く。',
      use: 'I’m not so sure about that.（それはどうかな）' },

    // why: did ← the t of didn't is lost; doesn't/does ← the d heard, the tense lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'seem', seg: [28.9, 32.3],
      stem: 'Fill the gap: “He ___ seem like he was joking.”',
      choices: ['didn’t', 'did', 'doesn’t', 'does'], a: 0,
      cue: '「He」のすぐあと、短い音のあとの小さな間。',
      line: 'He *didn’t* seem like he was joking.',
      said: '「冗談を言ってるようには見えなかった」と返す。',
      mean: 'didn’t の t はほぼ消え「ディドゥン」。n の音と小さな間が否定のしるし。',
      trap: 't が聞こえないので did と取りやすい。n と間が残っていれば否定。',
      use: 'It didn’t seem like a joke.（冗談には見えなかった）' },

    // R fix: the key was the only two-part choice (K6); B is now two-part too.
    // why: goes with Toby ← "Okay. I will." taken at face value; sends Toby ← "why don't we go" heard as Toby going
    { id: 'g2', skill: 'gist', level: 'B2', point: 'dodge', reveals: ['excuse', 'office'], seg: [52.9, 82.8],
      stem: 'How does the talk between Toby and Michael end?',
      choices: ['Michael dodges going, and pokes at Toby', 'Michael agrees, and they go to Stanley',
                'Michael sends Toby to talk to Stanley himself'], a: 0,
      cue: '「Okay. I will.」のあと、何が起きるか。',
      said: '「行くよ」と言いながら体調を理由に先延ばしし、最後はトビーへの嫌みで終わる。',
      mean: 'マイケルはスタンリーと向き合うのを避けている。トビーには強く出られる。',
      trap: 'I will だけ聞くと行くと思いやすい。そのあとの though と言い訳まで聞く。',
      use: 'Let’s deal with it tomorrow.（それは明日にしよう）' },

    // why: alone ← "why don't we go" heard as an offer; why not yet ← "why…?" read as a real question
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'ask', reveals: ['whydont'], seg: [55.3, 63.5],
      stem: 'What is Toby really doing with his suggestion about Stanley?',
      choices: ['Testing Michael’s claim by checking it', 'Offering to go and talk to Stanley alone',
                'Asking why Michael hasn’t talked to him yet'], a: 0,
      cue: '「if you really believe」のあとの提案。',
      line: 'if you really believe that Stanley was joking, *why don’t we go ask*…?',
      said: '「本当に冗談だったと思うなら、一緒に本人に聞きに行こう」と言う。',
      mean: '本当なら確かめられるはず、とマイケルの言い分を試している。',
      trap: 'why を理由の質問と取りやすい。why don’t we は「〜しよう」という誘い。',
      use: 'Why don’t we ask him?（本人に聞いてみようよ）' },

    // predict: the segment stops after "Okay. I will."; the reveal plays the excuse
    // R fix: "a request that Toby come along" was already in "why don't we" (K3); now a dig at Toby, which Michael does
    //   make, but two turns later.
    // why: a plan ← "I will" heard as real agreement; a dig ← Michael's jabs at Toby earlier set up another one
    { id: 'r1', skill: 'predict', level: 'B2', point: 'excuse', seg: [55.3, 63.5], then: [63.5, 70.6],
      stem: 'Michael agrees to go. What kind of line comes next?',
      choices: ['A reason he can’t go after all', 'A plan for what to say to Stanley',
                'A dig at Toby for doubting him'], a: 0,
      cue: '返事が短すぎないか。マイケルの今までの態度。',
      line: 'Okay. I will. — I’m *not feeling very well* right now, though.',
      said: '「いいよ、行くよ」と言った直後、「でも今ちょっと具合が悪い」と続ける。',
      mean: '口では引き受けても、すぐ行けない理由を出して逃げる。',
      trap: 'I will で本当に行くと思いやすい。ずっと否定していた人の短い返事に注意。',
      use: 'Sure, I will. Just not today.（いいよ、やるよ。今日じゃないけど）' },

    // why: made ill ← the stomach talk taken at face value, tied to the clash; Toby instead ← "why don't we" heard as
    //   Toby offering to go
    // R fix: the stem names the stomachache, d3's key (N7): added `stomach` to reveals.
    { id: 'i1', skill: 'infer', level: 'B2', point: 'excuse', reveals: ['stomach'], seg: [56.2, 70.6],
      stem: 'What does the timing of Michael’s stomachache suggest?',
      choices: ['It’s a handy way out of asking Stanley', 'The morning’s clash made him feel ill',
                'He’d rather Toby went to ask in his place'], a: 0,
      cue: '「Okay. I will.」の直後に何を言い出すか。',
      line: 'Okay. I will. — I’m not feeling very well right now, though.',
      said: '本人に聞きに行こうと言われ、「行くよ」と答えた直後に具合が悪いと言い出す。',
      mean: 'タイミングが良すぎる。スタンリーと向き合うのを避ける口実だと分かる。',
      trap: '体調の話をそのまま信じやすい。直前に何を頼まれたかと並べて聞く。',
      use: 'That’s convenient timing.（ずいぶん都合のいいタイミングだね）' },

    // R fix: "Why do we go ask" doesn't fit the gap (GUIDE §9.5); now "Why can't we".
    // why: did we ← the weak don't heard as did; won't ← the n heard, the vowel guessed; can't ← the n and t heard
    { id: 's2', skill: 'sound', level: 'B2', point: 'whydont', reveals: ['ask'], seg: [58.6, 63.5],
      stem: 'Fill the gap: “___ go ask…?”',
      choices: ['Why don’t we', 'Why didn’t we', 'Why won’t we', 'Why can’t we'], a: 0,
      cue: '「Stanley was joking」のあと、つながった最初の3語。',
      line: '*why don’t we* go ask…?',
      said: '「冗談だと思うなら」のあと、三語がつながり「ワイドンウィ」と聞こえる。',
      mean: 'don’t の t が落ち、we とつながる。速いと二語くらいに聞こえる。',
      trap: 'didn’t なら「なぜしなかった」で責める意味。過去の d の音があるか聞く。',
      use: 'Why don’t we grab lunch?（お昼でも行かない？）' },

    // R fix: "asking Toby a question" was weak (V2); now though as an intensifier ("really, though").
    // why: stressing ← though read as emphasis, as in "it hurts, though!"; topic change ← it ends the sentence, so it
    //   seems to move on
    { id: 'm1', skill: 'marker', level: 'B2', point: 'though', reveals: ['excuse', 'stomach'], seg: [63.4, 68.7],
      stem: 'After “right now”, what does Michael’s last short word signal?',
      choices: ['A catch to what he just agreed to', 'That he’s stressing how bad he feels',
                'That he’s moving to a new topic'], a: 0,
      cue: '「right now」のあと、文の終わりの一語。',
      line: 'I’m not feeling very well right now, *though*.',
      said: '「行くよ」のあと「でも今ちょっと具合が悪いんだよね」と付け足す。',
      mean: '文末の though ＝「でもね」。前に言ったことに条件をつける。',
      trap: '文末なので強調の一語に聞こえやすい。though が後ろに来たら、前の話への「でも」。',
      use: 'It’s nice. A bit pricey, though.（いいね。ちょっと高いけど）' },

    // R fix: "he has a meeting" doesn't fit "not feeling very well" (K3); now another body part.
    // why: headache ← "not feeling very well" filled in with the usual complaint; back ← the b/k of "stomach" half heard
    { id: 'd3', skill: 'detail', level: 'B1', point: 'stomach', reveals: ['excuse'], seg: [63.4, 68.7],
      stem: 'What reason does Michael give for maybe going home early?',
      choices: ['His stomach hurts', 'His head hurts', 'His back hurts'], a: 0,
      cue: '「so I may be going home」の前。',
      line: 'My *stomach hurts*, so I may be going home early today',
      said: '「おなかが痛いから、今日は早く帰るかも」と言う。',
      mean: 'スタンリーに聞きに行かないための理由として出している。',
      trap: '具合が悪いと聞くと頭痛を思いやすい。so の前の体の部分を聞く。',
      use: 'My stomach hurts a little.（ちょっとおなかが痛い）' },

    // R fix: the segment cut "today" (captions 68.6 s); it now ends at 69.4 (S4).
    { id: 'x1', skill: 'dict', level: 'B1', point: 'home', reveals: ['stomach', 'excuse'], seg: [65.4, 69.4],
      stem: 'Type what you hear: “so I may be ___ today.” (3 words)', answer: 'going home early',
      cue: '「may be」のあと、3語。',
      line: 'My stomach hurts, so I may be *going home early* today',
      said: '「おなかが痛いから、今日は早く帰るかも」。',
      mean: 'go home early ＝ 早退する。may be going は「〜することになるかも」とぼかす形。',
      trap: 'going と home がつながり「ゴーインホーム」。ng の g はほぼ聞こえない。',
      use: 'I’m going home early today.（今日は早めに帰ります）' },

    // why: Michael's daughter ← "my daughter" heard without who said it; Stanley's ← the talk is about Stanley
    // R fix: its stem and line hold "stomach", d3's key (N7): added `stomach` to reveals.
    { id: 'w1', skill: 'who', level: 'B2', point: 'daughter', reveals: ['stomach'], seg: [69.0, 82.5],
      stem: 'Who talks about a daughter’s stomachaches, and whose daughter?',
      choices: ['Toby, about his own daughter', 'Michael, about his own daughter',
                'Toby, about Stanley’s daughter'], a: 0,
      cue: '文頭の呼びかけの名前と、my のあと。',
      line: 'You know, *Michael*, sometimes *my daughter’s* stomach hurts…',
      said: '名前を呼んでから「うちの娘も、学校に意地悪な子がいるとおなかが痛くなる」と話す。',
      mean: '呼ばれた名前で、話しているのはもう一人の方だと分かる。',
      trap: 'my daughter だけ聞くと話し手を決めにくい。文頭で誰の名前を呼んだか聞く。',
      use: 'You know, my son does that too.（うちの息子もそうなんだよ）' },

    // R fix: "see a doctor" was weak (V2); now the comforting reading of "sometimes my daughter's…".
    // why: nothing to worry about ← "sometimes… too" read as reassurance; mean girl ← the keyword pinned on Michael,
    //   the bully
    { id: 'i2', skill: 'infer', level: 'C1', point: 'scared', reveals: ['daughter', 'stomach'], seg: [69.0, 82.5],
      stem: 'What is Toby hinting with his story about a child at school?',
      choices: ['Michael is just scared of facing Stanley', 'His pain is common and nothing serious',
                'Michael is acting like a mean girl'], a: 0,
      cue: '学校で何があると、おなかが痛くなるのか。',
      line: 'sometimes my daughter’s stomach hurts *when there’s a mean girl at school*.',
      said: '「娘も、学校に意地悪な子がいるとおなかが痛くなる」と話す。',
      mean: '会いたくない相手がいると体の具合が悪くなる。マイケルもそうだ、とほのめかす。',
      trap: 'mean girl をマイケルのことと取りやすい。痛くなるのは子どもの方。',
      use: 'Are you sure you’re not just nervous?（ただ緊張してるだけじゃない？）' },

    // why: Stanley scares him ← the item's own topic, but he names Toby, not Stanley; mixes up ← "psychological" heard as
    //   a mistake for physical
    // R fix: its line holds "stomach hurts", d3's key (N7): added `stomach` to reveals.
    { id: 'h1', skill: 'humor', level: 'C1', point: 'office', reveals: ['scared', 'stomach'], seg: [74.5, 82.8],
      stem: 'What makes Michael’s comeback to Toby funny?',
      choices: ['His jab at Toby admits Toby was right', 'He admits that Stanley scares him most',
                'He mixes up “psychological” with “physical”'], a: 0,
      cue: '「when you come into my office」のあとの結論。',
      line: 'sometimes my stomach hurts *when you come into my office*, so it’s *probably psychological*.',
      said: '「俺も、お前が部屋に来るとおなかが痛くなる。だからたぶん気のせいだ」と返す。',
      mean: 'トビーへの嫌みのつもりが、痛みは気持ちのせいだと自分で認めている。',
      trap: '名前が出るのはトビー。スタンリーの話はしていないが、結局同じことを認めている。',
      use: 'It’s probably just stress.（たぶんストレスだよ）' },
  ]
};
