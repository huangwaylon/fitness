// “Michael's Cunning Dinner Party Plan - The Office US” (the official The Office channel, BEST OF SEASON 4 - The Office
// US): the staff are kept late on a Friday; Michael stages an angry call to corporate, sends everyone home, then holds
// Jim to his "no plans" and gets him and Pam to dinner; Jim admits to the camera that Michael got him; Dwight is left out.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Michael (29.7 s, 53.7 s), Pam
// (61 s, 70.5 s), Jim (94.3 s; "Pam and me" at 70.5 s), Dwight (88.6 s), Jan, Angela, Andy (93–97 s).
// Untested: 27–28.5 s (captions "I'm— it's— God", whisper "I'm Scott"); 61.5 s ("mi casa": captions "me castle");
// 93.9 s (captions "him and Jim", whisper "ham and Jim"); 97.8 s ("Hello"/"Hey": speaker not named); the pause at
// 64.8–68 s (the captions have a gap, whisper's timings don't, so no pause item); 102.4–130 s is music.
// REVIEW 2026-11-16: pass 8, fix 13, drop 1, new 1; ear checks 0
//   open: h1 and i3 still lean on the title ("Cunning … Plan"): the joke and the twist are what the title promises.
//   They're fixed once; if a cold read still gets them, drop h1 (humor would be 0) or accept them as easy items.
import type { Clip } from '../types.ts';

export const dinnerplan: Clip = {
  id: 'dinnerplan', video: 'LNVUKLK0OkI', title: 'Michael\'s Cunning Dinner Party Plan - The Office US', dur: 130,
  wpm: 126, band: 'slow', tags: ['職場', 'お願い・断り'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: we get ← "'ll" is a dark l that melts into "get"; will we get ← the question word order a learner expects
    //   after "what time"; we got ← the t of "get" is lost before "out", heard as a past form
    { id: 's1', skill: 'sound', level: 'B2', point: 'well', seg: [3.0, 9.0],
      stem: 'Fill the gap: “Do you have any idea what time ___ out of here?”',
      choices: ['we get', 'we’ll get', 'will we get', 'we got'], a: 1,
      cue: 'what time のあと、短く弱い2語。',
      line: 'Do you have any idea what time *we’ll get* out of here?',
      said: '「何時に帰れるか分かってるの？」と残業に文句を言っている。',
      mean: 'we’ll は l が暗く「ウィゥ」程度に縮み、すぐ get につながる。',
      trap: '疑問文なら will we と思いがち。what time 〜 は文の途中なので語順は we’ll。',
      use: 'Any idea when we’ll get there?（いつ着くか分かる？）' },

    // R fix: V2 (blind 55 %: "at least doesn't mind" was easy to rule out); now "minds it less", the reading that
    //   parses "least" as how much he minds
    // why: minds it less ← "least of all me" parsed as "I mind it least of all", the negation of "Nobody likes" lost;
    //   last one here ← least/last are close, and a boss staying latest is the usual script
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'least', seg: [6.8, 11.0],
      stem: 'After “Nobody likes to work late”, what does the speaker add about himself?',
      choices: ['He likes it even less than they do', 'He minds it less than the rest of them',
                'He’ll be the last one here tonight'], a: 0,
      cue: 'work late のあと、短い3〜4語。',
      line: 'Nobody likes to work late. *Least of all me.*',
      said: '「残業が好きな人なんていない。僕がいちばん嫌だ」と答える。',
      mean: 'least of all me ＝ 中でも自分が最も〜でない。',
      trap: 'least を「いちばん気にしない」と取ると逆。last とも似る。否定のあとなら「特に〜は」。',
      use: 'Nobody wants to wait. Least of all me.（誰も待ちたくない。私は特に）' },

    // why: today ← "corporate" and "overtime assignment" come later and sound like a sudden order; chose ← "Nope"
    //   (no plans) heard as Jim choosing to stay
    { id: 'i1', skill: 'infer', level: 'B2', point: 'plans', seg: [12.0, 18.5],
      stem: 'What does Jim’s reminder about plans suggest about the late work?',
      choices: ['Michael had warned them about it before', 'Head office only told them about it today',
                'Jim had chosen to stay late anyway'], a: 0,
      cue: 'Remember when で始まる文の中身。',
      line: '*Remember when you told us not to make plans* because we were working? — Yes, I remember.',
      said: '「予定を入れるなって言ったよね？」に「覚えてる」と返す。',
      mean: '残業は前から決まっていた。つまり Michael が前もって用意していたことになる。',
      trap: 'あとの corporate で急な命令に思える。Remember when は前の話を持ち出す形。',
      use: 'Remember when you said you’d help?（手伝うって言ったの、覚えてる？）' },

    // R fix: V2 and §9.4 (blind 85 %: the title, "Cunning Dinner Party Plan", answered "what was it really for?");
    //   now asks how the plan works, which the title doesn't say; reveals gains credit (the stem has Jim caught)
    // why: head office ← "corporate" comes up again and again, so the dinner sounds like their order; a short one ←
    //   "a little dinner" heard as a promise to keep it short
    { id: 'g1', skill: 'gist', level: 'C1', point: 'scheme', reveals: ['noassign', 'trap', 'gohome', 'credit'],
      seg: [12.0, 85.6],
      stem: 'Looking at the whole scene, how does Michael get Jim to dinner?',
      choices: ['He leaves Jim no excuse to say no', 'He says head office wants it',
                'He promises it will be a short one'], a: 0,
      cue: '最後のカメラへの一言で、場面全体を見直して。',
      said: '残業させ、怒る電話をして全員を帰し、予定がないと言った Jim を夕食に誘う。',
      mean: '残業も電話も、断れない形で夕食に呼ぶ仕かけ。',
      trap: 'corporate から本社の話に、little dinner から短い会に聞こえやすい。Jim の逃げ道に注目。',
      use: 'It was a setup from the start.（最初から仕組まれてたんだ）' },

    // why: tired ← "why are we here" heard as his own wish to go home; calm ← "Yes, I remember" just before is flat
    { id: 't1', skill: 'attitude', level: 'B1', point: 'mad', seg: [20.4, 29.0],
      stem: 'Before the phone call, how does Michael make himself sound?',
      choices: ['Angry and ready to fight it', 'Tired and ready to go home', 'Calm and willing to wait it out'], a: 0,
      cue: 'enough のくり返しと、最後の一言。',
      line: 'why are we here? I am gonna call corporate. *Enough is enough.* … *I’m so mad.*',
      said: '「本社に電話する。もうたくさんだ。頭にくる」と言う。',
      mean: 'enough is enough ＝ もう我慢できない。部下の前で怒ってみせている。',
      trap: 'why are we here を「帰りたい」と取ると疲れに聞こえる。最後の so mad を聞く。',
      use: 'Enough is enough. I’m calling them.（もう我慢できない。電話する）' },

    // R fix: V2 (blind 50 %: "must stay until the work is done" was the plain opposite); both distractors now keep
    //   the overtime alive in a way the refusal rules out; S4: the segment was 12.2 s (gist ≥ 15 s), it now starts
    //   at "We're not gonna do it" (40.6 s), so the item moves before f1
    // why: once done ← "overtime assignment" heard as still on, with going home after it; paid ← overtime usually
    //   means extra pay
    { id: 'g2', skill: 'gist', level: 'B1', point: 'gohome', reveals: ['horn'], seg: [40.6, 56.4],
      stem: 'What is the news Michael gives everybody?',
      choices: ['They can all go home now, no overtime', 'They can go once the assignment is done',
                'They’ll be paid extra for staying late'], a: 0,
      cue: '電話の話のあと、最後の命令の形。',
      line: 'go *enjoy your Friday*. — Thank you, Michael.',
      said: '本社と話したと言い、「金曜を楽しんで」と全員を帰す。お礼の声が返る。',
      mean: '残業はなし、もう帰っていい、という知らせ。',
      trap: 'overtime assignment が聞こえるので残業が続く話に思える。最後の go enjoy が答え。',
      use: 'Go enjoy your weekend.（週末を楽しんで）' },

    // R fix: V2 (blind 50 %: "read an email" was a filler); now "got on a call", the got on / got off near miss
    // why: got on ← "got off" heard as "got on", the short particle lost; warning ← a horn is a warning sound
    //   (クラクショ��)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'horn', seg: [44.2, 47.3],
      stem: 'What does Michael tell everybody he has just done?',
      choices: ['Finished a phone call with head office', 'Just got on a call with head office',
                'Got a loud warning from head office'], a: 0,
      cue: 'got off the 〜 with のあいだの一語。',
      line: 'Everybody, I just *got off the horn* with corporate.',
      said: '「いま本社との電話を切った」と言う。',
      mean: 'the horn ＝ 電話（くだけた言い方）。get off the phone と同じ。',
      trap: 'horn をクラクションと取ると警告に、off を on と聞くと電話の始まりになる。get off は終わり。',
      use: 'I just got off the phone with the hotel.（ホテルとの電話を切ったところ）' },

    // R fix: V2 (blind 50 %: "passed it to another branch" was weak); every choice now has a manner, and the new one
    //   is the grudging yes a partial listener hears in the angry tone
    // why: where to send it ← "where they could stick" read literally as a place to put it, with the rude tone;
    //   grudgingly agreed ← "little overtime assignment" heard as moaning about a job he still takes
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'stick', reveals: ['gohome'], seg: [47.0, 53.4],
      stem: 'What does Michael claim he said to corporate about the overtime?',
      choices: ['He rudely refused to do it', 'He rudely asked where to send it', 'He grudgingly agreed to do it'], a: 0,
      cue: 'told them のあと、where で始まる部分。',
      line: 'basically I told them *where they could stick* their little overtime assignment',
      said: '「要するに、残業なんか知るかと言ってやった」と話す。',
      mean: 'where they could stick it ＝ 乱暴に断る決まった言い方。',
      trap: 'where を文字どおり取ると「送り先」に、文句の調子だけだと渋々の承知に聞こえる。',
      use: 'He told them where to stick it.（あいつ、きっぱり突っぱねたよ）' },

    // R fix: V2 (blind 75 %: the key read as an idiom gloss next to two outcomes no one would say); now two near
    //   escapes: "got away with" something, and getting through the week ("Happy Friday")
    // why: broke a rule ← "dodge" heard as evading, as in dodging taxes; hard week ← "Happy Friday" just before, so
    //   what they survived sounds like the week
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'bullet', seg: [55.4, 58.9],
      stem: 'After “Happy Friday”, what does Michael say they did?',
      choices: ['Escaped something bad just in time', 'Got away with breaking a rule',
                'Made it through a hard week'], a: 0,
      cue: 'I think we のあとの、動詞と名詞。',
      line: 'Well, I think we *dodged a bullet* there.',
      said: '「危ないところを切り抜けたな」と言う。',
      mean: 'dodge a bullet ＝ 弾をよける → 悪いことをぎりぎりで避ける。',
      trap: 'dodge を「ごまかす」と取ると悪事の話に、Happy Friday に引かれると一週間の話になる。決まった形で覚える。',
      use: 'The flight was canceled. We dodged a bullet.（あの便は欠航。助かった）' },

    // R fix: V2 (blind 70 %: "apologizing" was a filler); now teasing, the reading that hears a dig at a free Friday
    // why: checking ← a line about plans heard as a real question; teasing ← "you didn't have plans" on a Friday
    //   heard as a joke about Jim having no life, but it comes right after the invitation, and nothing else follows
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'trap', seg: [58.5, 69.6],
      stem: 'After the dinner invitation, what is Michael’s next line doing?',
      choices: ['Using Jim’s own words to block a “no”', 'Checking that Jim really is free tonight',
                'Teasing Jim for being free on a Friday'], a: 0,
      cue: '誘ったあと、相手の前の言葉を持ち出す。',
      line: 'You said *you didn’t have plans*. … *That’s what you said.*',
      said: '夕食に誘い、「予定はないって言ったよね。そう言ったよ」とくり返す。',
      mean: '相手の言葉を証拠にして、断る理由を先につぶしている。',
      trap: '予定の確認やからかいに聞こえやすい。誘いの直後に相手の言葉をくり返すのは、逃げ道をふさぐ動き。',
      use: 'You said you were free.（ひまだって言ったよね）' },

    // anchor: 64.2–68.6 s "You said you didn't have plans. That's what you said.", then to camera 70–80.5 s "every time
    //   we've been able to get out of it… but I gotta give him credit. He got me."
    // R fix: V2 (blind 70 %: "Great, I was hoping you'd ask!" was out of place for a man who dodged nine times); now
    //   "That was low", which sees the trick but takes it the wrong way
    // why: low ← the trick seen, but taken as hurtful (right target, wrong attitude): "I gotta give him credit" is
    //   praise; excuse ← the habit he names ("every time we've been able to get out of it") heard as what he does again
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'credit', reveals: ['getout'], seg: [60.0, 80.6],
      stem: 'Which reply from Jim would match how he sees Michael’s move?',
      choices: ['Okay, you got me. What time?', 'Wow. That was low, Michael.', 'Sorry, something just came up.'],
      a: 0,
      cue: '誘いのあと、カメラに話す最後の短い文。',
      line: 'That’s what you said. … every time *we’ve been able to get out of it*. But I gotta give him credit. *He got me.*',
      said: '何度も断ってきたが「今回は一本取られた」とカメラに言う。',
      mean: 'give him credit は相手の手並みを認める言い方。喜びでも、まだ逃げる気でもない。「参った」が合う。',
      trap: 'わなに気づいた点だけ見ると「ひどい」と怒る返事に寄る。credit は感心の言葉。返事は相手の打った手に返す。',
      use: 'Okay, you got me. I’ll come.（分かった、参ったよ。行く）' },

    // why: nineteen / ninety ← -teen/-ty endings blur after "at least"
    { id: 'n1', skill: 'number', level: 'B1', point: 'nine', seg: [69.5, 76.5], keep: true,
      stem: 'How many times has Michael asked them to dinner, Jim says?',
      choices: ['Nine', 'Nineteen', 'Ninety'], a: 0,
      cue: 'at least のあとの数。',
      line: 'Michael has asked Pam and me to dinner at least *nine* times',
      said: '「Michael は少なくとも9回、僕と Pam を夕食に誘った」と話す。',
      mean: 'at least ＝ 少なくとも。何度も断ってきたことが分かる。',
      trap: 'nineteen は teen を強く長く、ninety は最初を強く読む。ここは短い一語。',
      use: 'I’ve called at least nine times.（少なくとも9回は電話した）' },

    // R fix: V2 (blind 75 %: "went and had a good time" clashed with the scene); now Michael calling it off, the
    //   reading that loses who did the getting out; N6: the use's 陪 is outside the font subset, so a new use
    // why: called it off ← "get out of it" heard without "we've been able to", so the dinners just didn't happen;
    //   left early ← "get out of it" read literally as leaving the place
    { id: 'd2', skill: 'detail', level: 'B2', point: 'getout', seg: [69.5, 76.5],
      stem: 'What has happened each time Michael invited them before?',
      choices: ['They found a way not to go', 'They went but got out early', 'Michael ended up canceling'], a: 0,
      cue: 'every time のあとの動詞の部分。',
      line: 'every time *we’ve been able to get out of it*',
      said: '「これまで毎回、うまく断ってこられた」と言う。',
      mean: 'get out of 〜 ＝ 〜を（うまく）逃れる。誘いや用事を断れたということ。',
      trap: 'get out を「外に出る」と取ると早く帰った話に。主語は we、of it ＝ 夕食の誘い。',
      use: 'I got out of the meeting.（会議をうまく抜けられた）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'getout', seg: [73.9, 76.8],
      stem: 'Type what Jim says: “Every time we’ve been able to ___.” (4 words)', answer: 'get out of it',
      cue: 'able to のあと、つながる4語。',
      line: 'every time we’ve been able to *get out of it*',
      said: '「毎回、逃げられてきた」と言う。',
      mean: 'get out of it が「ゲラウロヴィッ」のように1語につながる。t は「ラ」に近い。',
      trap: 'out の t と of が消えやすく、get out it と書きがち。of を入れて4語。',
      use: 'Can I get out of it?（それ、断れるかな）' },

    // R fix: V2 and K6 (blind 70 %: the key was the only two-sided feeling); all three are now two-part
    // why: hurt ← being tricked by someone who calls them friends; secretly glad ← "give him credit" heard as
    //   gratitude
    { id: 't2', skill: 'attitude', level: 'C1', point: 'credit', seg: [76.5, 80.6],
      stem: 'How does Jim feel about Michael’s move, judging by his comment?',
      choices: ['Beaten, and grudgingly impressed', 'Tricked, and honestly hurt by it',
                'Caught, but secretly glad to go'], a: 0,
      cue: 'But で始まる文と、最後の短い文。',
      line: 'But I gotta *give him credit*. *He got me.*',
      said: '「でも認めなきゃ。一本取られた」と言う。',
      mean: 'give someone credit ＝ 相手のうまさを認める。くやしいが感心している。',
      trap: 'credit をお礼と取ると喜んでいるように聞こえる。He got me ＝ やられた、で気持ちが分かる。',
      use: 'I have to give her credit. She’s good.（認めるよ。彼女うまいね）' },

    // R fix: V2 (blind 75 %: with the title's "cunning plan", the only Michael-did-it choice won); a second
    //   Michael-did-it choice now goes the wrong way (he asked for it rather than made it up)
    // why: dropped ← "no assignment from corporate" heard as the order being taken back; talked into it ← "from
    //   corporate" kept, with Michael behind it: but "there was no assignment" means it never existed
    { id: 'i3', skill: 'infer', level: 'B2', point: 'noassign', seg: [80.3, 85.7],
      stem: 'What is Jim beginning to believe about the overtime?',
      choices: ['Michael invented the whole thing', 'Head office had already dropped it',
                'Michael talked head office into it'], a: 0,
      cue: 'suspect のあと、there was no で始まる部分。',
      line: 'I’m starting to suspect that *there was no assignment* from corporate.',
      said: '「本社からの指示なんて、なかったんじゃないか」と思い始める。',
      mean: '指示がなかった ＝ 残業も電話も Michael の作り話。',
      trap: 'no assignment を「取り消された」と取りやすい。there was no は最初からない、の意味。',
      use: 'I suspect there was no meeting at all.（会議なんてなかったんじゃないかな）' },

    // why: Andy ← named a few seconds later in the guest list; Jim ← he is the one being invited
    { id: 'w1', skill: 'who', level: 'B1', point: 'arriving', seg: [85.3, 90.2],
      stem: 'Who asks Michael what time to arrive?',
      choices: ['Dwight', 'Andy', 'Angela'], a: 0,
      cue: '質問のすぐあと、Michael が最初に呼ぶ名前。',
      line: 'Michael, what time should I be arriving? — *Dwight*, it’s couples only',
      said: '「何時に行けばいい？」と聞き、Michael が名前を呼んで答える。',
      mean: '返事の頭の呼びかけで、誰が聞いたか分かる。',
      trap: 'Andy もすぐあとに名前が出るが、それは招待客の一覧。答えの最初の名前を聞く。',
      use: 'What time should I be there?（何時に行けばいい？）' },

    // R fix: V2 (blind 75 %); the choices are reworded to one length and one frame. Still title-leaning: see REVIEW
    // why: work hours ← "arriving" heard as coming in to work, after a scene about overtime; first ← "what time"
    //   heard as wanting to be early
    { id: 'h1', skill: 'humor', level: 'C1', point: 'arriving', seg: [85.3, 90.2],
      stem: 'Why is the question about arrival time funny?',
      choices: ['He acts invited when he wasn’t asked', 'He mixes up the dinner with work hours',
                'He’s eager to be the first one there'], a: 0,
      cue: '誘われた人と、聞いた人がちがう。',
      line: 'Michael, *what time should I be arriving*? — Dwight, it’s couples only',
      said: '誘われていないのに「何時に行けばいい？」と、行く前提で聞く。',
      mean: '招待されたと思いこんでいるずれが笑い。すぐに断られる。',
      trap: 'arriving を出勤と取ると仕事の話になる。直前の会話は夕食の誘い。',
      use: 'Wait, am I even invited?（待って、私って招待されてる？）' },

    // R drop: nt2, V1 + S1: the stem asks what Dwight's reply holds back, but there is no reply in either source
    //   (102.4 s on is silence, then music), so the key rests on his face; never shipped, so deleted. nt3 replaces it.

    // why: no room ← "only six wine glasses" (the second reason) turned into a table; work ← the scene began with
    //   overtime
    { id: 'd3', skill: 'detail', level: 'B1', point: 'couples', reveals: ['arriving'], seg: [88.4, 92.6],
      stem: 'What is the first reason Michael gives Dwight?',
      choices: ['The dinner is for couples only', 'There isn’t room at his table', 'Dwight has to stay and work late'], a: 0,
      cue: '名前を呼んだ直後の2語。',
      line: 'Dwight, it’s *couples only*',
      said: '「Dwight、カップル限定なんだ」と断る。',
      mean: 'couples only ＝ カップルだけ。一人の Dwight は呼べない、という理由。',
      trap: 'あとのワイングラスの話を「席がない」と混ぜやすい。最初の理由は名前の直後。',
      use: 'Sorry, it’s members only.（すみません、会員限定です）' },

    // R fix: V2 (blind 55 %: "takes the first one back" was weak); now "the real reason instead", besides read as
    //   "actually"
    // why: softens ← "besides" heard as "but" (a softener after a refusal); real reason ← "besides" read as
    //   "actually, the truth is", replacing the first reason rather than adding to it
    { id: 'm1', skill: 'marker', level: 'B2', point: 'besides', reveals: ['couples', 'six'], seg: [88.4, 94.6],
      stem: 'How does the wine-glasses part relate to Michael’s first reason?',
      choices: ['It adds a second reason', 'It softens the first reason', 'It gives the real reason instead'], a: 0,
      cue: 'couples only のあと、and に続く一語。',
      line: 'it’s couples only, *and besides*, I only have six wine glasses',
      said: '「カップル限定だし、それにワイングラスが6個しかない」と言う。',
      mean: 'besides ＝ それに。理由をもう一つ重ねて、断りを強くする。',
      trap: 'besides を和らげる「でも」や、本当の理由の前置きと取りやすい。and besides は理由の追加。',
      use: 'It’s late, and besides, I’m tired.（遅いし、それに疲れてる）' },

    // R new: nt3 (C2, "a deliberately trivial reason"), replacing nt2; blind read 45 %
    // anchor: 88.6–97 s "it's couples only, and besides, I only have six wine glasses, so it will be me and Jan and…
    //   and Angela and Andy": a second, trivial reason piled on the first, and the six glasses filled by name, so
    //   neither a date nor a spare seat gets Dwight in
    // why: a date ← "couples only" taken as the real rule (the literal reading), but the six seats are already named;
    //   sorry ← the Japanese frame of a polite, regretful no (お断りの「あいにく」), but no word of regret is said and
    //   "and besides" stacks a second reason
    { id: 'nt3', skill: 'pragma', level: 'C2', point: 'excuse', reveals: ['couples', 'six', 'besides'], seg: [88.4, 97.4],
      stem: 'What does Michael’s wine-glass reason really tell Dwight?',
      choices: ['He isn’t wanted, whatever the reason', 'He’d be welcome with a date of his own',
                'Michael is sorry there’s no room for him'], a: 0,
      cue: '理由のあとに並ぶ名前の数。',
      line: 'it’s couples only, *and besides*, I only have six wine glasses, *so it will be me and Jan*… and Angela and Andy',
      said: '「カップル限定だし、グラスも6個だけ。僕と Jan と…」と6人を名前で埋める。',
      mean: '理由を重ね、席も名前で埋める。相手を連れてきても無理。本音は「来ないで」。',
      trap: 'couples only を本当の条件と取ると「相手がいれば」に、丁寧な断りと取ると「あいにく」に聞こえる。重ねた理由は拒否。',
      use: 'Let’s just say it’s a no.（まあ、答えはノーってこと）' },

    // why: four ← "only" suggests very few; sixteen ← six/sixteen, the -teen ending
    { id: 'n2', skill: 'number', level: 'B1', point: 'six', seg: [90.0, 97.4], keep: true,
      stem: 'How many wine glasses does Michael say he has?',
      choices: ['Four', 'Six', 'Sixteen'], a: 1,
      cue: 'only have のあとの数。',
      line: 'I only have *six* wine glasses, so it will be me and Jan… and Angela and Andy.',
      said: '「グラスは6個だけ。だから僕と Jan、…、Angela と Andy」と人数を数える。',
      mean: '6個 ＝ 6人。3組のカップルでちょうど埋まる、という理屈。',
      trap: 'only で少なく感じて four を選びやすい。あとの名前を数えると6人。',
      use: 'I only have two tickets.（チケットは2枚しかない）' },
  ]
};
