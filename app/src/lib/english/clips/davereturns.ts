// “Ben Meets Leslie's Ex-boyfriend | Parks and Recreation” (the official Parks and Recreation channel, Season 4): Dave,
// Leslie's ex and a cop, joins Leslie and Ben for dinner, competes with Ben, then tells Leslie he still loves her.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 236 s. Untested on purpose: 0–8 s (who
// "could not keep it together", and why), 17–20 s (both sources "San Diego's son"), 74–77 s (captions lack "You should
// come to"), 78–82 s ("You're welcome", speaker unclear), 104–106 s (captions "I'm gonna use the bathroom", whisper "do
// you need to use the bathroom"), 117–120 s (captions "so i'm feeling in love", whisper "So how is Danny-- I'm still in
// love"; items use only Leslie's later repeats, which both sources have) and 158–159 s ("Dick").
// Speakers: Dave by "Dave" (127.7 s) and his own story; Ben as the one in "the Whiz Palace" (145.8 s) who comes back with
// "Whizzingham Manor"; "I already said I'm gonna go" (208 s) ties "go outside" and the company line to Dave.
// REVIEW 2026-11-16: pass 8, fix 16, drop 0, new 0; ear checks 0
//   (removed: 100.4 s s1, both sources have "I'd"; 141.2 s x1, the stem no longer puts the disputed "well"/"we'll"
//   inside the gap, and both sources have "get rid of him")
import type { Clip } from '../types.ts';

export const daveReturns: Clip = {
  id: 'davereturns', video: '80Z0floB-eY', title: 'Ben Meets Leslie\'s Ex-boyfriend', dur: 256, wpm: 172, band: 'fast',
  tags: ['恋愛', '店・レストラン'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %): "all Leslie's fault" was weak; now a register near miss (poetic vs official), since
    //   "romantical" can sound flowery. S4: the segment was 22.5 s; now 35.8–50.8 s ("We had…" to "…at that time")
    // why: poetic ← "romantic, romantical" heard as gushing; not over ← an ex talking about the romance at length
    //   sounds like he wants it back (later true, but nothing here says so)
    { id: 'h1', skill: 'humor', level: 'C1', point: 'intro', seg: [35.8, 50.8],
      stem: 'Why does Dave’s account of his past with Leslie get laughs?',
      choices: ['He describes the romance in stiff, official words', 'He describes the romance in cheesy, poetic words',
                'He describes the romance as if it isn’t over'], a: 0,
      cue: '恋愛の話に使う語の種類と、説明の長さ。',
      line: 'We had a romantic, *romantical involvement* until I *relocated*… we *terminated our involvement* at that time.',
      said: '「恋愛的関与」は転勤で「終了した」と、地理の説明まで添えて言う。',
      mean: '元恋人の話を報告書のような硬い言葉で言うずれが笑い。',
      trap: 'romantical は詩的に聞こえるが、involvement や terminated は書類の語。語の種類を見る。',
      use: 'We used to date, a long time ago.（ずっと前に付き合ってたんだ）' },

    // R fix: V2 (blind 55 %): "lonely" was the only feeling word; all three now name what he follows their plan with
    // why: dig ← "Cool." before it can sound like a dig at "really nice new French"; brag ← the plan heard as a stated
    //   taste for plain food over fancy food
    { id: 'h2', skill: 'humor', level: 'C1', point: 'burrito', seg: [57, 71.4],
      stem: 'Why does Dave’s own dinner plan get a laugh?',
      choices: ['He follows their fancy plan with a sad, cheap one', 'He follows their fancy plan with a dig at French food',
                'He follows their fancy plan with a brag about his own'], a: 0,
      cue: '直前の二人の予定と、彼の予定の差。',
      line: 'dinner at a *really nice new French restaurant*. — Cool. I’m gonna… get a *frozen burrito* and eat it right there…',
      said: '二人は新しいフレンチで夕食。彼はスタンドの冷凍ブリトーをその場で食べると言う。',
      mean: 'しゃれた予定の直後に寂しい予定を淡々と言う対比が笑い。',
      trap: 'Cool のあとで皮肉に聞こえやすいが、店には何も言っていない。好みの話もしていない。',
      use: 'I’ll just grab something on the way.（途中で何か買って食べるよ）' },

    // R fix: V2 (blind 70 %): "asking about her campaign" was a filler; now a no-rivalry reading of the same praise
    // why: work ← both men have jobs in the talk (campaign manager, the chief), so a work-talk contest fits; cheer her
    //   up ← the praise heard as plain kindness (the polite frame), the "I said my thing first" contest missed
    { id: 'g2', skill: 'gist', level: 'B2', point: 'rivals', reveals: ['first', 'manor'], seg: [77.5, 114],
      stem: 'At dinner, what keeps happening between Ben and Dave?',
      choices: ['They compete over who can praise Leslie more', 'They take turns praising Leslie to cheer her up',
                'They compete over whose job sounds more impressive'], a: 0,
      cue: 'Leslie へのほめ言葉の重ね方と、あだ名の話。',
      said: '二人で Leslie をほめ合い、彼は「先に言ったのは僕」と言う。あだ名でも張り合う。',
      mean: '表面は感じよく、Leslie の前でどちらが上かを争っている。',
      trap: 'campaign や仕事の語が多いが、話の中心は Leslie をほめる順番と中身。',
      use: 'Okay, okay, you win this one.（はいはい、今回は君の勝ち）' },

    // R fix: V2 (blind 50 %): "feel free to tell her" was weak; now a polite-doubt reading
    // why: repeat ← the literal reading: "say that again" = もう一度言って; only being nice ← a modest reply to praise
    //   (the 謙遜 frame); refuted by "If anything, I'm holding her back"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'sayagain', seg: [86.8, 92.3],
      stem: 'When Ben answers Dave’s compliment about Leslie, what does he mean?',
      choices: ['I couldn’t agree with you more', 'Could you say that one more time?',
                'You’re only saying that to be nice'], a: 0,
      cue: '「smart lady」への返事、最初のひと言。',
      line: 'you’re a real smart lady. — Oh, *you can say that again*. If anything, I’m holding her back.',
      said: '「頭のいい人だ」に「まったくだ。むしろ僕が足を引っ張ってる」と返す。',
      mean: 'You can say that again ＝ 大賛成という決まり文句。',
      trap: 'say that again を「もう一度言って」と文字通り取りやすい。決まった形で覚える。',
      use: 'Hot today! — You can say that again.（暑いね！—本当に）' },

    // R fix: V2 (blind 80 %): "praise back" was weak; now a "Ben copied me" reading of "my thing first"
    // why: cut in ← "my thing" heard as an unfinished compliment; copied ← "my thing… first" heard as "that was my
    //   line" (Ben's words differ: "holding her back")
    { id: 'h3', skill: 'humor', level: 'C1', point: 'first', seg: [88, 95.2],
      stem: 'Why is Dave’s “I said my thing first” funny?',
      choices: ['He treats praising Leslie as a contest with Ben', 'He claims Ben copied his compliment word for word',
                'He complains that Ben cut in before he finished'], a: 0,
      cue: '「Aw, Ben」の直後。誰がほめられたか。',
      line: 'If anything, I’m holding her back. — Aw, Ben. — *I said my thing first.*',
      said: 'Ben が自分を下げて Leslie をほめ、喜ばれる。そこで「僕が先に言った」と言う。',
      mean: 'ほめ言葉を競争にして、子どものように主張するのが笑い。',
      trap: 'first を話の順番と取ると割り込みに聞こえる。彼の文は終わっていた。',
      use: 'Hey, that was my idea first!（それ、先に言ったの僕だよ！）' },

    // R fix: V2 (blind 85 %, mostly s1's stem; s1 now reveals `endorse`): "report a problem" was weak; now a
    //   campaign-event near miss
    // why: party ← "the chief's retirement thing" was mentioned earlier; event ← "campaign" + the chief, the ask
    //   heard as an invitation
    { id: 'd3', skill: 'detail', level: 'B1', point: 'endorse', seg: [94.5, 99.5],
      stem: 'Why were Leslie and Ben at the police station today?',
      choices: ['To ask the chief to back Leslie’s campaign', 'To invite the chief to a campaign event',
                'To help plan the chief’s retirement party'], a: 0,
      cue: '「police station」のあと、chief の名前に続く語。',
      line: 'that’s why we were at the police station today. We’re trying to get *Chief Trumple’s endorsement*.',
      said: '今日警察署にいたのは、署長に推薦してもらうためだったと話す。',
      mean: 'endorsement ＝ 支持・推薦。選挙で有力な人に応援してもらうこと。',
      trap: '退職の話が前に出ていて引かれやすい。警察署に行った目的は選挙の応援。',
      use: 'Would you be willing to back me?（応援してもらえますか）' },

    // why: I'll ← 'd and 'll both shrink to a light sound after I; I ← the 'd is barely there; I've ← a "v" read
    //   into the same light sound before "probably"
    // R fix: C5: the stem ("get him to endorse you") states d3's key, so s1 reveals `endorse`
    { id: 's1', skill: 'sound', level: 'B2', point: 'idprob', reveals: ['endorse'], seg: [99, 102.3],
      stem: 'Fill the gap: “___ get him to endorse you.”',
      choices: ['I’ll probably', 'I’d probably', 'I probably', 'I’ve probably'], a: 1,
      cue: '「buddy of mine」の直後、I のすぐあとの小さな音。',
      line: 'he was a buddy of mine. *I’d probably* get him to endorse you.',
      said: '「署長は友だちだ。たぶん推薦させられる」と言う。I’d の d は軽い。',
      mean: 'I’d ＝ I would。「頼めばたぶん」という仮の話。',
      trap: 'd が小さく I’ll や I にも聞こえる。後ろが get なら would か will。',
      use: 'I’d probably take the train.（たぶん電車にするかな）' },

    // R fix: V2 (blind 55 %): rebuilt as a 2×2 (turns down / laughs off × tells Ben / keeps it from him)
    // why: keeps it ← she says nothing to Ben until the very end, so hiding it fits; laughs off ← "What did you just
    //   say?" heard as a light reply (refuted by "why would you…" and "cannot bring this up at all")
    { id: 'g1', skill: 'gist', level: 'B2', point: 'leslie', reveals: ['refuse', 'caughtup', 'unaware'], seg: [117, 236],
      stem: 'Over the rest of the evening, how does Leslie handle Dave’s feelings?',
      choices: ['She turns him down, then tells Ben about it', 'She turns him down, and keeps it from Ben',
                'She laughs it off, then tells Ben about it'], a: 0,
      cue: '彼への返事の強さと、最後に Ben に話すこと。',
      said: '今は無理と断り、外への誘いも断る。最後に Ben に彼の気持ちを話す。',
      mean: '元恋人の気持ちをはっきり断り、今の恋人に隠さず伝える流れ。',
      trap: 'しばらく Ben に黙っているので隠すように見えるが、Ben がいない間だっただけ。',
      use: 'I need to tell you something.（話しておきたいことがあるの）' },

    // R fix: V2 (blind 50 %): the key was the only "slip" choice; all three are now parallel "Trying to…"
    // why: misheard ← "nothing was said" sounds like a claim she heard something else; reaction ← a quick denial
    //   after a big line can sound like a test
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'denial', seg: [120.2, 131],
      stem: 'When Leslie asks what he just said, what is Dave doing?',
      choices: ['Trying to take back what he said', 'Trying to say she misheard his words',
                'Trying to see how she would react'], a: 0,
      cue: 'Nothing のくり返しと、そのあとの理由。',
      line: 'Nothing, I didn’t, *nothing was said*. … — *Because it’s accurate.*',
      said: '「何も言ってない」とくり返し、なぜ今と聞かれると「本当だから」と答える。',
      mean: '口に出た言葉をなかったことにしようとして、すぐ認めてしまう。',
      trap: '別の語と言うなら言いかえるはず。主語のない言い方は責任を避けるとき。',
      use: 'Forget I said anything.（今のは聞かなかったことにして）' },

    // R fix: V2 (blind 65 %): "amused" was weak; now a literal "What did you…" (didn't hear) reading. C5: the trap
    //   names f2's "at all", so a1 reveals `bringup`
    // why: flattered ← "cannot bring this up… when my boyfriend is here" can sound like "later, not now"; confused ←
    //   "why would you…" heard as not following (refuted: "tell me *that*" shows she heard)
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'refuse', reveals: ['bringup'], seg: [127.4, 141.3],
      stem: 'How does Leslie feel about Dave choosing this moment?',
      choices: ['Upset that he chose a time with Ben so near', 'Flattered, though she wishes he had waited',
                'Confused, since she didn’t catch what he said'], a: 0,
      cue: '「why would you」のあと、時と場所を表す語。',
      line: 'Dave, why would you tell me that *here and now*?',
      said: '「なぜ今ここで言うの」と聞き、話をさせてという頼みも断る。',
      mean: '恋人がいる場で言われたことに困り、怒っている。喜んではいない。',
      trap: 'when my boyfriend is here を「あとでなら」と取りやすい。at all は全面的な No。',
      use: 'Why would you bring that up now?（なんで今その話をするの）' },

    // why: leaving ← he says later he leaves tomorrow, a natural "last chance" reason; asked ← Leslie spoke to him
    //   just before, so it can sound like she asked for it
    { id: 'd4', skill: 'detail', level: 'B1', point: 'whynow', seg: [129.4, 136],
      stem: 'What reason does Dave give for picking this moment?',
      choices: ['Ben has stepped away from the table', 'He flies out of town tomorrow', 'Leslie asked him how he felt'], a: 0,
      cue: '「accurate」の次の「and because」のあと。',
      line: 'And because *he’s not here right now*, so I thought this would be a good time.',
      said: '「彼が今いないから、いいタイミングだと思った」と理由を足す。',
      mean: 'he は Ben。恋人がいない間をねらった、と自分で言っている。',
      trap: '明日発つ話はあとで出るので理由に入れやすい。and because のあとが理由。',
      use: 'Since you’re here, can I ask something?（せっかくだから聞いていい？）' },

    // why: one ← "just" before it sounds like a tiny request; fifteen/fifty ← -teen/-ty and "five" share the f
    { id: 'n3', skill: 'number', level: 'B1', point: 'minutes', seg: [135.2, 138.2], keep: true,
      stem: 'How long does Dave ask to talk to her?',
      choices: ['One minute', 'Five minutes', 'Fifteen minutes', 'Fifty minutes'], a: 1,
      cue: '文の最後、minutes の直前。',
      line: 'Can I just please talk to you about this for *five minutes*?',
      said: '「この話を5分だけさせてくれない？」と頼む。',
      mean: 'for five minutes ＝ 5分間。短い時間を出して頼みを小さく見せている。',
      trap: 'five の v は弱く、fif- の数に聞こえやすい。-teen なら後ろが長く強い。',
      use: 'Can I have five minutes of your time?（5分だけいいですか）' },

    // why: loudly ← "up" read as volume (speak up); drag out ← "this" heard as the talk already going on
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'bringup', seg: [137.6, 141.3],
      stem: 'What does Leslie tell Dave not to do while Ben is around?',
      choices: ['Raise the subject at all', 'Talk about it so loudly', 'Drag the talk out so long'], a: 0,
      cue: '「cannot」のすぐあとの動詞のかたまり。',
      line: 'No, you cannot *bring this up at all* when my boyfriend is here.',
      said: '「恋人がいるときに、この話を出すのは絶対だめ」と言う。',
      mean: 'bring up ＝ 話題を持ち出す。at all で「少しでも」と強めている。',
      trap: 'up を「声を上げる」と取りやすい。bring … up はまとめて「話に出す」。',
      use: 'Please don’t bring it up at dinner.（夕食のときにその話はしないで）' },

    // R fix: V2 (blind 65 %): "a firm no he will accept" made the key the only active reading; now a "later" near
    //   miss (right: he works around it; wrong: he wants it now)
    // why: another day ← "not… when my boyfriend is here" heard as "not now, later"; voice down ← "when my boyfriend
    //   is here" heard as "be discreet", a request to lower the voice
    // anchor: 141.0–146.1 s "we'll get rid of him, that's a good call", then "if we leave now while he's in the Whiz
    //   Palace": he plans around Ben instead of dropping it or whispering
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'getrid', seg: [137.6, 147.2],
      stem: 'How does Dave take Leslie’s “not… when my boyfriend is here”?',
      choices: ['As a timing issue he can get around', 'As a sign to bring it up another day',
                'As a warning to keep his voice down'], a: 0,
      cue: '断られた直後の彼の提案と、そのあとの案。',
      line: 'when my boyfriend is here. — Okay… *get rid of him*… if we *leave now while he’s in the Whiz Palace*.',
      said: '「恋人がいるときはだめ」に「彼を追い払おう」「トイレの間に出よう」と返す。',
      mean: '彼女は「絶対だめ」の意味だが、彼は「恋人がいなければいい」という条件と取り、何とかしようとする。',
      trap: '「今はだめ」を「また今度」と取りやすい。返事は言葉の形より、次に何をしようとするかで聞く。',
      use: 'Not now. — Okay, later then?（今はだめ。—じゃあ、あとで？）' },

    // R fix: S1/N1: "Okay, ___" put the disputed "well"/"we'll" inside the gap; the stem now asks for the 4 words
    //   before "that's a good call". S4: the segment began inside "here"; now 140.5 s
    { id: 'x1', skill: 'dict', level: 'B2', point: 'getrid', seg: [140.5, 142.9],
      stem: 'Type the 4 words Dave says before “that’s a good call.”', answer: 'get rid of him',
      cue: '「good call」の直前、つながる4語。',
      line: 'Okay… *get rid of him*, that’s a good call.',
      said: '「じゃあ彼を追い払おう、いい考えだ」と言う。',
      mean: 'get rid of ＝ 追い払う・処分する。rid of がつながる。',
      trap: 'him は h が消えて「イム」に近く、of にくっつく。ひとかたまりで覚える。',
      use: 'I need to get rid of old clothes.（古い服を処分しなきゃ）' },

    // R fix: V2 (blind 55 %): the key was the only choice naming the other man; all three now name a target
    // why: tease ← "funny name" sounds like making fun of Leslie's nickname; long time ← coming back from the
    //   bathroom often comes with an excuse
    { id: 'h4', skill: 'humor', level: 'C1', point: 'manor', seg: [146.8, 157.2],
      stem: 'Why does Ben come back with a new name for the bathroom?',
      choices: ['To top Dave, who knew Leslie’s name for it', 'To tease Leslie about her silly name for it',
                'To joke to them about how long he was gone'], a: 0,
      cue: '「another」と「that I thought of」に注目。',
      line: '*Whizzingham Manor.* … It’s *another funny name* for the bathroom *that I thought of*.',
      said: '戻るなり「ウィジンガム・マナー。僕が考えたトイレの別名」と言う。',
      mean: 'Dave が彼女のあだ名を知っていたので、負けじと作った張り合いが笑い。',
      trap: 'funny name をからかいと取りやすい。another と I thought of は手柄の話。',
      use: 'I came up with that one myself.（それは自分で考えたんだ）' },

    // why: sixteen/sixty ← -teen/-ty on "six"; "a lot of bad guys" just before makes a bigger number feel right
    { id: 'n1', skill: 'number', level: 'B1', point: 'six', seg: [159.8, 165.1], keep: true,
      stem: 'How many bad guys does Dave say he caught?',
      choices: ['About six', 'About sixteen', 'About sixty'], a: 0,
      cue: '「a lot of」のあと、言い直した数。',
      line: 'caught a lot of bad guys. *About six* bad guys.',
      said: '「悪いやつをたくさん捕まえた。6人くらい」と言う。',
      mean: 'a lot と言ったあとの6人は少なく、言い直しが笑いになる。',
      trap: 'a lot のあとで大きな数を期待しやすい。six のすぐあとに bad が来る。',
      use: 'I read a lot. Well, about six books.（たくさん読んだ。まあ6冊）' },

    // why: 12:50 ← -teen/-ty; 12:05 ← "twelve-oh-five" with the oh lost; 2:15 ← "twelve" heard as "two"
    { id: 'n2', skill: 'number', level: 'B1', point: 'flight', seg: [165.2, 171], keep: true,
      stem: 'What time is Dave’s flight tomorrow?',
      choices: ['12:05', '12:15', '12:50', '2:15'], a: 1,
      cue: '「flight」の直前の数字。',
      line: 'I’m scheduled to leave tomorrow on the *12:15* flight',
      said: '「明日12時15分の便で、ソルトレイク経由で発つ予定」と言う。',
      mean: '時刻は twelve fifteen のように数を二つ並べて言う。',
      trap: 'fifteen と fifty は似ている。-teen は後ろが強く長い。時刻は語尾に注意。',
      use: 'My train leaves at six fifteen.（電車は6時15分発です）' },

    // why: party ← he said "just tonight for the chief's retirement thing" earlier; Leslie ← an ex "coming back"
    //   sounds like coming back for her, but his stated reason is the job
    { id: 'd5', skill: 'detail', level: 'B2', point: 'interview', seg: [172.4, 179.4],
      stem: 'What does Dave now say this trip is mainly for?',
      choices: ['A job interview for police chief', 'The chief’s retirement party', 'A visit with Leslie and Ben'], a: 0,
      cue: '「mainly here to」のあと。',
      line: 'But I may be coming back. … I’m *mainly here to interview* for Trumple’s job',
      said: '「戻るかも。主に署長の面接で来た」と明かす。最初は退職パーティーと言っていた。',
      mean: 'mainly で、本当の目的を初めて言ったと分かる。',
      trap: '前に聞いたパーティーに引かれやすい。now と mainly で、後の話が本題。',
      use: 'I’m mainly here for work.（主に仕事で来ています）' },

    // why: tired ← the "you look like you could use…" frame heard (she looks like she needs air); everyone ← "go
    //   outside" just before heard as a call for a group break
    // anchor: 189.0–198.0 s "I'm gonna… go outside. You look like *I* could use some company", two "What?"s, then
    //   "Would you like to step outside with me": the frame "you look like you could use" has his own need in it
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'company', seg: [188.8, 198.2],
      stem: 'Why does Dave’s offer of company get two puzzled “What?”s?',
      choices: ['His words say he needs her, not she him', 'He says Leslie looks tired and needs air',
                'He seems to invite everyone outside'], a: 0,
      cue: '「You look like」のあとの主語。',
      line: '*You look like I could use some company.* — What? — What?',
      said: '「外に行く」と言い、「君は…僕が付き添いがほしそうに見える」と言ってしまう。二人とも聞き返す。',
      mean: '本来は you could use。主語が I になり、自分が一緒にいたい本音が出た言いそこない。',
      trap: '決まった形に合わせて you と聞きたくなる。言いそこないは、ずれた一語に本音が出る。',
      use: 'You look like you could use a coffee.（コーヒーが要りそうな顔だね）' },

    // R fix: V2 (blind 70 %): rebalanced to no / not now / yes-but-short
    // why: agreeing ← "we're good" read as OK/いいよ (the Japanese frame); later ← listing past topics can sound
    //   like "let's continue another time"
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'caughtup', reveals: ['six'], seg: [197.2, 205.6],
      stem: 'What is Leslie doing when she lists what they already talked about?',
      choices: ['Turning down his offer to step outside', 'Putting off his offer until another day',
                'Accepting his offer, but for a short talk'], a: 0,
      cue: '最後のひと言と、そのあとの彼女の No。',
      line: '*We have caught up.* We talked about San Diego and about the six bad guys. *I think we’re good.*',
      said: '「近況はもう話した。サンディエゴと悪いやつ6人の話。もう十分」と言う。',
      mean: 'we’re good ＝ もう要らない。誘いを角を立てずに断っている。',
      trap: 'good を「いいよ」と取ると賛成に聞こえる。すぐ後の No で確かめる。',
      use: 'More water? — No, I think I’m good.（お水は？—大丈夫です）' },

    // R fix: V2 (blind 70 %): "proudly showing" was easy to rule out; now the plain sincere reading (just explaining)
    // why: just explaining ← sincerity flip: the words do give a reason, and "I already said I'm gonna go" is true;
    //   pressure ← announcing he will go out can sound like a last push for her to follow
    // anchor: 203.3–211.1 s "No, I don't want that.", then "I already said I'm gonna go, so I guess I'm a man of my
    //   word, I'm gonna go": he goes alone and dresses it up as a promise kept
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'word', seg: [203, 212.2],
      stem: 'After her “No”, what is Dave’s “man of my word” line really doing?',
      choices: ['Saving face after being turned down', 'Simply explaining why he’s still going out',
                'Pushing her to come outside after all'], a: 0,
      cue: '彼女の No の直後。断られた誘いと、その言いわけ。',
      line: 'No, I don’t want that. — I already said I’m gonna go, so I guess *I’m a man of my word*.',
      said: '一緒に行くのを断られ、「行くと言ったから、約束を守る男として行く」と一人で出る。',
      mean: '断られて一人で出る気まずさを、約束を守る話にすりかえ、大げさな言葉で体面を保っている。',
      trap: '行く理由の説明と取りやすい。断られた直後に大げさな言葉が出たら、照れかくしを疑う。',
      use: 'Well, I said I’d leave, so I’m leaving.（まあ、帰るって言ったし帰るよ）' },

    // R fix: V2 (blind 75 %): the key was the only choice about a secret; all three are now things Dave told or asked
    //   Leslie. C5: "may move back" hints d5's job, so i4 reveals `interview`
    // why: move back ← Ben heard it himself ("Dude, that's amazing", 179 s); outside ← Ben was there for it (a second
    //   "What?", 195 s); in the segment, his "What's that?" shows only the love line is news
    { id: 'i4', skill: 'infer', level: 'B2', point: 'unaware', reveals: ['interview'], seg: [214.9, 224.1],
      stem: 'When Ben asks how he’s doing, what is he still unaware of?',
      choices: ['That Dave told Leslie he still loves her', 'That Dave told Leslie he may move back',
                'That Dave asked Leslie to step outside'], a: 0,
      cue: 'Ben の質問のあと、Leslie が言う「While you were…」。',
      line: 'I feel like we’re getting along pretty well. — … *While you were in the bathroom, he said he was still in love with me.*',
      said: 'Ben は「うまくやれてる」と言い、Leslie は「トイレの間にまだ好きと言われた」と話す。',
      mean: 'Ben のいない間の告白で、Ben は知らずに仲良くしようとしていた。',
      trap: '戻る話や外への誘いは Ben もその場で聞いた。いない間のことを考える。',
      use: 'While you were out, someone called.（留守の間に電話があったよ）' },

    // why: jealous ← "He's in love with you" is the first thing he repeats; calm ← "Can you just not freak out?"
    //   heard as Leslie misreading a calm Ben
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'freak', seg: [223.8, 236],
      stem: 'How does Ben take Leslie’s news?',
      choices: ['Alarmed, though he says he isn’t', 'Jealous, though he says he isn’t',
                'Calm, though Leslie thinks he isn’t'], a: 0,
      cue: '「he’s a cop」のあとの一言と、同じ言葉のくり返し。',
      line: 'he’s a cop. He’s in love with you and *he has a gun*? — … *I’m not freaking out.*',
      said: '「警官で、君が好きで、銃もある」と言い、「慌ててない」とくり返す。',
      mean: '慌てていないと言いつつ銃の心配をしている。言葉と様子が反対。',
      trap: 'in love と聞くとやきもちと取りやすいが、話の山は銃。否定のくり返しは逆の気持ち。',
      use: 'Don’t freak out, but I lost the keys.（落ち着いて聞いて、鍵なくした）' },
  ]
};
