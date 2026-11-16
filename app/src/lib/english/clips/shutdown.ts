// “Just Saying that Gave Me a Semi | Parks and Recreation” (the official Parks and Recreation channel, Season 2): the
// city government shuts down; Ron is delighted, the townspeople ask what the park closures mean for their kids and the
// canceled kids' concert, Ron cheers on a budget task force's cuts, and Leslie phones to say she'll put the concert on
// anyway.
// Segments from the captions, words from whisper (2026-11-16; whisper's timings here are whole seconds, so every bound is
// from the captions). Talk runs ≈ 8–121 s (music before and after). Names said: Ron and Andy (8.4, 10.2 s), Ron (87.9,
// 118.1 s), Leslie (107 s, as Ron picks up the phone). The speaker of "no one is more upset" (27–35 s) and the parents
// are never named, so those items use no names or pronouns. The task-force member who answers the cut figure is Ron (the
// official's "Ron, that is a very creative idea" at 87.9 s). Untested on purpose: Ron's talking head (72.6–79.8 s, the
// title's "semi" line), "How long's it gonna last?" (16 s: whisper "How long is it going to last"), the crowd's "Oh!"
// (58–61 s), the ringtone pause (97–101 s), "We're gonna do this, Ron… without you" (118–119 s: whisper "We're through
// without you", captions "where's it without you") and "Hammering away!" (120.5 s, speaker unclear).
// EAR CHECK: 35.0 s h1 — "The point is, I would win": whisper has the final "win", the captions stop at "I would" as the
//   next question starts (35.4 s); the key also stands on "the point is" after "neither here nor there"
// REVIEW 2026-11-17: pass 6, fix 17, drop 0, new 0; ear checks 1 (unchanged)
// Open: a second blind read still picked d2 (75 %, only from s1's stem, which shares its point), h1 (70 %), pr2, pr3,
//   i3 (65 %), mostly from knowing Ron. n3's "lot 48" is guessable from show trivia only; I kept it (-ty/-eight is the
//   real test).
import type { Clip } from '../types.ts';

export const shutdown: Clip = {
  id: 'shutdown', video: '3ilRaj-2uno', title: 'Just Saying that Gave Me a Semi', dur: 144, wpm: 138,
  band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 50 %: "made the news" was weak. It's now "the news surprised Ron too" (a newspaper mention heard
    //   as shared surprise).
    // why: where to read ← "newspaper" heard as a suggestion to go and read about it; surprised too ← "It's in every
    //   newspaper" heard as "it's big news, even to me"
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'paper', seg: [10.6, 15.9],
      stem: 'When Andy asks where everyone is, what does Ron’s second sentence add?',
      choices: ['A hint that Andy should already know', 'A tip on where Andy can read more',
                'A sign that the news surprised Ron too'], a: 0,
      cue: 'shut down のあと、付け足しの短い一文。',
      line: 'The government is shut down. *It’s in every newspaper*.',
      said: '「政府は閉鎖中だ。どの新聞にも載っている」と答える。',
      mean: '「知らないのか」という軽いあきれ。読むように勧めているわけではない。',
      trap: '新聞の話を「読んでみて」という案内と取りやすい。当たり前のことを付け足すのは、あきれのしるし。',
      use: 'It’s been all over the news.（ニュースでずっとやってるよ）' },

    // R fix: V2, blind 85 %: the show's Ron makes "he hopes it goes on" a giveaway. All three choices are now hopes,
    //   so the answer rests on "for months" and on "empty", not on sold or shut for good.
    // why: for good ← "Could be forever" (37 s, about the parks) is the keyword trap, and Ron's dislike of government
    //   fits; a few weeks ← "if we're lucky" heard as hoping for a short one, with "months" lost
    { id: 'i1', skill: 'infer', level: 'B2', point: 'lucky', seg: [15.5, 21.0],
      stem: 'What does Ron’s answer about how long it will last show?',
      choices: ['He’d like it to run for months', 'He’d like the building shut for good',
                'He’d like a few quiet weeks, no more'],
      a: 0,
      cue: '文頭の if のあと、何を「幸運」としているか。',
      line: '*If we’re lucky*, this building will be *empty for months*.',
      said: '「運が良ければ、この建物は何か月も空っぽだ」と言う。',
      mean: '閉鎖が何か月も続くのを「幸運」と呼ぶ。役所が止まるのを喜ぶ人だと分かる。',
      trap: '役所嫌いの印象から「ずっと」と取ったり、lucky を短く済む望みと取りやすい。期間の語まで聞く。',
      use: 'If we’re lucky, it’ll be quiet all day.（運が良ければ一日静かだよ）' },

    // R fix: V2, blind 55 %: "who is to blame" was weak. It's now "how the city will fix its money troubles", a live
    //   topic for a shutdown meeting that nobody raises in the first half.
    // why: fixing the money ← "the government is shut down" and the later "deficits" heard as the meeting's topic; help
    //   reopen ← the usual town-meeting script (volunteers), and Leslie's plan at the end
    { id: 'g1', skill: 'gist', level: 'B1', point: 'closures', seg: [20.8, 58.4],
      stem: 'What does the public meeting in the first half mostly deal with?',
      choices: ['What the closures mean for families and kids', 'How the city plans to fix its money troubles',
                'How residents can help get the parks reopened'], a: 0,
      cue: '住民たちの質問が、何についてか。',
      said: '公園は当分閉鎖と告げられ、住民は休み中の子どもの過ごし方や、子ども向けのコンサートについて聞く。',
      mean: '話の中心は、閉鎖が暮らし、とくに子どもにどう響くか。お金の話はまだ出ない。',
      trap: '「政府閉鎖」と聞くと責任問題の話に思える。質問の中身を順に聞く。',
      use: 'How will this affect us?（これ、私たちにどう影響するの？）' },

    // R fix: V2, blind 70 %: "no end date" was the only open answer a shutdown suggests. Now "until the budget is
    //   passed" (the usual end of a shutdown) competes with it, and the audio refutes it: nothing about a budget.
    // why: a notice next week ← "notice" heard as a posted sign, so a date is assumed; the budget ← the usual shutdown
    //   script, with "further notice" lost
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'notice', seg: [20.8, 26.0],
      stem: 'What is said about how long the parks will be closed?',
      choices: ['No end date has been set yet', 'Until a notice goes up next week', 'Until the city budget is passed'],
      a: 0,
      cue: 'closed のあとの、決まった3語。',
      line: 'all the parks are closed *until further notice*.',
      said: '「公園はすべて、追って知らせるまで閉鎖です」と言う。',
      mean: 'until further notice ＝ 次の知らせがあるまで。いつ開くかは決まっていない。',
      trap: 'notice を貼り紙と取ると、日付があるように聞こえる。決まった言い方ごと覚える。',
      use: 'The pool is closed until further notice.（プールは当面休みです）' },

    // R fix: V2, blind 70 %: the key was the only "says X, then the opposite" choice. Now a second reversal ("upset,
    //   then glad") competes with it. Segment end 35.4 → 36.9: the final "win" overlaps the next question (35.4 s), and
    //   the old end cut it.
    // why: a contest lost ← "competition" heard, the "I would win" lost under the laugh; upset then glad ← the same
    //   say-then-take-back shape, built on "upset"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'win', reveals: ['neither'], seg: [26.5, 36.9],
      stem: 'Why does the end of the “no one is more upset” speech get a laugh?',
      choices: ['It sets winning aside, then insists on it again', 'It claims to be upset, then admits to being glad',
                'It calls the closures a contest the speaker lost'], a: 0,
      cue: '最後の一文が、少し前の何をくり返すか。',
      line: 'if it was, I would win, but that’s neither here nor there. *The point is, I would win*.',
      said: '「競争なら私が勝つ。でもそれは関係ない。要するに、私が勝つ」と言う。',
      mean: '関係ないと脇へ置いた話を、すぐ本題にしてしまう。負けず嫌いが隠せない。',
      trap: '打ち消す形を気持ちの裏返しと取りやすい。the point is で脇へ置いた話に戻る。',
      use: 'Not that it matters, but I was right.（どうでもいいけど、私が正しかった）', retired: true },

    // R fix: V2, blind 60 %: "doesn't matter right now" matched the stem's "right after 'I would win'" too neatly. The
    //   choices are now short and parallel, with "either way" (neither/nor) and "anyone here" (here, literal) as the
    //   traps. Segment end 35.4 → 36.9, as for h1.
    // why: either way ← "neither… nor" heard as "not one way or the other" (どちらとも言えない); anyone here ← here/there
    //   read literally as places and people
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'neither', seg: [31.9, 36.9],
      stem: 'What does the speaker mean by the remark right after “I would win”?',
      choices: ['That it’s beside the point', 'That it can’t be proven either way', 'That it’s not up to anyone here'],
      a: 0,
      cue: 'but のあとの、決まった4語。',
      line: 'if it was, I would win, but that’s *neither here nor there*.',
      said: '「もし競争なら私が勝つ。でもそれは、今は関係ない」と言う。',
      mean: 'neither here nor there ＝ 本題と関係ない。言いすぎた話を脇へ置く言い方。',
      trap: 'here / there を場所と取ったり、「どちらとも言えない」と取りやすい。',
      use: 'Anyway, that’s neither here nor there.（まあ、それは関係ないけど）' },

    // R fix: V2, blind 65 %: the key ("a worry too big for this meeting") was the only specific choice. All three are
    //   now plain moves of the same length.
    // why: answers it next ← "one thing at a time" heard as a queue of topics, this one coming soon; one at a time ←
    //   the literal reading, as a request to speak in turn
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'onething', seg: [37.5, 42.4],
      stem: 'What does the reply to the question about al-Qaeda do?',
      choices: ['It puts off a question that’s off topic', 'It promises to get to that question next',
                'It asks people to speak one at a time'], a: 0,
      cue: '大きすぎる心配のあと、短い返事。',
      line: 'who’s going to stop al-Qaeda? — *One thing at a time*.',
      said: '「政府が閉鎖したら、誰がテロを止めるの？」と聞かれ、「一つずつ行きましょう」と返す。',
      mean: '話が大きくなりすぎた質問を、角を立てずに脇へ置く言い方。',
      trap: '文字どおり「順番に話して」と取りやすい。急に話が飛んだ時の受け流し。',
      use: 'Let’s take it one thing at a time.（一つずつ片づけよう）' },

    // why: two days ← the number caught, the unit lost; ten days ← "two" and "ten" blur unstressed; two months ← "for
    //   months" (19 s) is the last time span heard
    { id: 'n1', skill: 'number', level: 'B1', point: 'twoweeks', seg: [42.1, 46.9],
      stem: 'When does school let out, according to one parent?',
      choices: ['In two days', 'In ten days', 'In two weeks', 'In two months'], a: 2, keep: true,
      cue: 'is out in のあと、数字と単位。',
      line: 'School is out in *two weeks*.',
      said: '「学校はあと2週間で休みに入る。子どもを一日中どうすればいいの」と言う。',
      mean: 'be out ＝ 学校が休みに入る。公園が閉まると、休み中の行き場がなくなる。',
      trap: '前に聞いた months に引っぱられやすい。数字のあとの単位まで聞き切る。',
      use: 'School’s out in a week.（あと1週間で学校が休みだ）' },

    // R fix: V2, blind 60 %: the key was the only choice with an inner feeling ("dreads"). All three now give a reason
    //   of the same kind.
    // why: the city ← the complaint is made to officials right after "the parks are closed", so it sounds aimed at
    //   them; the kids ← "keep them in my house?" heard as the kids being too much to handle
    // anchor: 44.9–49.0 s every clause is the parent's own: "my kids", "my house", "where I live": the complaint is that
    //   their own children would be in their own home, and nothing is said against the city or the kids
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'home', seg: [44.4, 49.6],
      stem: 'In the parent’s complaint about the kids, who is the joke on?',
      choices: ['The parent, who can’t face a day with the kids', 'The city, which leaves families nowhere to go',
                'The kids, who are too wild to keep indoors'], a: 0,
      cue: 'my のつく語と、最後の短い問い。',
      line: 'What am I going to do with *my kids* all day? Keep them in *my house*? *Where I live?*',
      said: '「子どもを一日中どうするの？家に置いとけって？私が住んでる家に？」と訴える。',
      mean: '自分の家に自分の子がいるのを、とんでもない事のように言う。役所への苦情のつもりで、笑われているのは本人。',
      trap: '役所に向けた苦情なので、市への皮肉と聞きやすい。my と I を追えば、ずっと自分の話。',
      use: 'Cook dinner? In my own kitchen?（夕食を作れって？自分の台所で？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'tell', seg: [49.4, 53.7],
      stem: 'Type the reply: “I ___ you.” (5 words)', answer: "don't know what to tell",
      cue: '質問のすぐあと。I と you の間の5語。',
      line: 'I *don’t know what to tell* you.',
      said: '「何と言えばいいのか」と返す。don’t know が「ドンノ」と縮まる。',
      mean: '答えようがない、という定番の返事。助けられないことを、やわらかく認める。',
      trap: 'what to の t が弾み、語の切れ目を見失いやすい。語数を手がかりに。',
      use: 'I don’t know what to say.（何て言ったらいいか）' },

    // why: tonight ← both start with "to-", and "tomorrow" is said fast before "at"; this weekend ← a kids' concert in a
    //   park sounds like the usual weekend event
    { id: 'd1', skill: 'detail', level: 'B1', point: 'tomorrow', seg: [49.4, 55.6],
      stem: 'When was the kids’ concert supposed to happen?',
      choices: ['Tonight', 'Tomorrow', 'This weekend'], a: 1,
      cue: 'kids’ concert のすぐあと、時を表す一語。',
      line: 'What about the kids’ concert *tomorrow* at Ramsett Park?',
      said: '「明日の公園での子ども向けコンサートは？」と聞く。',
      mean: 'What about 〜? ＝ 〜はどうなるの。明日の予定を心配している。',
      trap: 'tomorrow の最初は弱く、to だけ聞くと tonight とも取れる。後半の -morrow を聞く。',
      use: 'What about dinner tomorrow?（明日の夕食はどうなるの？）' },

    // why: 22 ← "thirty" heard as "twenty" (/θ/ is hard); 30 ← "thirty" caught, the "-two" lost before "percent"; 40 ←
    //   Ron's "an even 40" right after, the last number heard
    { id: 'n2', skill: 'number', level: 'B1', point: 'pct', seg: [61.2, 67.0],
      stem: 'By how much does the city need to cut its spending?',
      choices: ['22 percent', '30 percent', '32 percent', '40 percent'], a: 2, keep: true,
      cue: 'expenditures by のあと、数字。',
      line: 'we need to cut expenditures by *32%*.',
      said: '「赤字のため、支出を32パーセント削る必要がある」と言う。',
      mean: 'expenditures ＝ 支出。deficit ＝ 赤字。大きな削減が必要という説明。',
      trap: '直後に別の数字が出るので、最後に聞いた数に引っぱられやすい。by のすぐあとを聞く。',
      use: 'We need to cut costs by ten percent.（経費を10%削らないと）' },

    // R fix: V2, blind 85 % (the show's Ron). Here the clip's words settle it: "Slash it" after "that's not
    //   necessary". "Joking" is now "showing off for the room", and the level is C1 → B2 (an explicit, repeated
    //   "Slash it").
    // why: a round number ← "an even 40" read as even = きりのいい数, nothing more; showing off ← a jump to a bigger
    //   number heard as a performance for the meeting
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'even', reveals: ['pct'], seg: [64.4, 72.3],
      stem: 'When Ron hears the figure for the cuts, what does his reply show?',
      choices: ['He wants to cut even deeper', 'He wants a neater, rounder figure', 'He is showing off for the room'],
      a: 0,
      cue: '相手の「必要ない」への、くり返しの返事。',
      line: 'Let’s make it *an even 40*. — Oh, that’s not necessary. — *Slash it*.',
      said: '32パーセントと聞き「きりよく40に」と言い、「必要ない」と返されても「削れ」と言う。',
      mean: 'even は「きりのいい」だが、本音は「もっと削りたい」。',
      trap: 'even 40 を数字の丸めだけと取りやすい。止められても「削れ」と言い続ければ本気。',
      use: 'Let’s make it an even hundred.（きりよく100にしよう）' },

    // why: a long shot ← "bat" read as a baseball swing, a gamble; a quick guess ← "off the bat" heard like "off the top
    //   of my head"
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'bat', seg: [80.8, 87.6],
      stem: 'When Ron starts his list of ideas, what do his first words mean?',
      choices: ['This is the very first step', 'This is a risky long shot', 'This is a rough, quick guess'], a: 0,
      cue: 'we sell の前の、野球から来た言い方。',
      line: '*Right off the bat*, we sell City Hall.',
      said: '「まず手始めに、市役所を売る」と言う。',
      mean: 'right off the bat ＝ 最初に、いきなり。最初の案から市役所を売る極端さ。',
      trap: 'bat から賭けや当てずっぽうを想像しやすい。「すぐに・最初に」の決まった言い方。',
      use: 'Right off the bat, I liked her.（会ってすぐ彼女が気に入った）' },

    // R fix: V2, blind 65 %: "politely" made the key the only nuanced choice. The choices are now parallel "says
    //   no / yes…", with "yes, with a condition" (but = a condition) as the strong trap.
    // why: asks for more ← "very creative idea" taken at face value (and Ron's "tons more ideas" next); a condition ←
    //   "But we don't want to…" heard as a limit on a yes
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'creative', seg: [87.4, 93.95],
      stem: 'What does the official’s answer to the City Hall idea do?',
      choices: ['It says no, in a nice way', 'It says yes, with a condition', 'It says yes, and asks for more'],
      a: 0,
      cue: 'ほめ言葉のあと、but に続く話。',
      line: 'Ron, that is a *very creative idea*. *But* we don’t want to sell…',
      said: '「とても創造的なアイデアですね。でも、大きな資産は売りたくないんです」と言う。',
      mean: 'ほめてから but で断る、ていねいな「ノー」。creative は遠回しに「現実的でない」。',
      trap: 'ほめ言葉だけで賛成と取りやすい。but のあとに本題が来る。',
      use: 'Interesting idea, but let’s keep it simple.（面白い案だけど、シンプルにいこう）' },

    // R fix: V2 + the C2 rewrite, blind 70 %: the key was the only choice that named a mechanism. Now two other
    //   readings of Ron's reply compete with it: mock hurt (a sincerity flip) and mockery of the official's money worry
    //   (right tone, wrong target).
    // why: mock hurt ← "I hear that" heard as a sulk, then cheer; mocking the money worry ← Ron's contempt for
    //   government, aimed at "future revenue streams"
    // anchor: 87.9–96.7 s the official's "very creative idea. But we don't want to sell any of our major assets" is a
    //   polite no to selling things off; Ron's "Don't worry. I have tons more ideas" promises more of the same, and his
    //   "Don't cut anything without me" (103.7 s) shows what kind; he says nothing about income or hurt
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'hear', reveals: ['creative', 'revenue'], seg: [87.4, 97.5],
      stem: 'Why is Ron’s “Don’t worry” funny after the official’s reply?',
      choices: ['More ideas like that are what the official fears', 'He acts hurt by the “no”, then bounces back',
                'He mocks the official’s fear of lost income'], a: 0,
      cue: 'but のあとの断りと、ロンの返事の中身。',
      line: 'But we don’t want to sell… — I hear that. *Don’t worry. I have tons more ideas*.',
      said: '資産は売りたくない、と遠回しに断られ、「心配するな、案はまだ山ほどある」と返す。',
      mean: '相手の心配はロンの極端な案そのもの。安心させるつもりで、不安を増やしている。',
      trap: '強がりや皮肉と取りやすい。相手の心配は but のあと（資産を売りたくない）にあり、ロンの「案」がまさにそれ。',
      use: 'Relax, I’ve got plenty more where that came from.（安心して、まだまだあるから）' },

    // R fix: V2, blind 85 %: "against the law" and "nobody would pay" were weak beside a sensible money reason. All
    //   three are now money or practical reasons: "nowhere left to work" (sell City Hall, read literally) and "a poor
    //   price right now" (a time trap on "future").
    // why: nowhere to work ← "sell City Hall" taken as losing the office itself; a poor price now ← "major assets" and
    //   "future" heard as "wait for a better price"
    { id: 'd2', skill: 'detail', level: 'B2', point: 'revenue', reveals: ['creative'], seg: [89.3, 93.95],
      stem: 'Why doesn’t the official want to sell City Hall?',
      choices: ['They’d lose income they could earn later', `They’d have nowhere left to work from`,
                'They’d get a poor price for it right now'], a: 0,
      cue: 'because のあと、失いたくないもの。',
      line: 'because we don’t want to *lose out on any future revenue streams*.',
      said: '「将来の収入源を失いたくないので、大きな資産は売りたくない」と説明する。',
      mean: 'revenue stream ＝ 収入源。売ると後の収入がなくなる。',
      trap: '「職場がなくなる」と取りやすい。理由は because のあと、future まで聞く。',
      use: 'We can’t afford to lose that income.（その収入を失うわけにはいかない）' },

    // R fix: V2, blind 70 %: "look out for" makes no sense after "don't want to", so the key won on meaning. It's now
    //   "lose hold of", a sensible option with the same "lose" and a linked weak ending.
    // why: lose all of ← "out on" heard as "all of" (both weak, linked); lose hold of ← the flapped "out on" heard as
    //   "hold of", and the phrase makes sense here
    { id: 's1', skill: 'sound', level: 'B2', point: 'revenue', seg: [89.3, 93.95],
      stem: 'Fill the gap: “because we don’t want to ___ any future revenue streams.”',
      choices: ['lose out on', 'lose all of', 'lose hold of'], a: 0,
      cue: 'want to のあと、短くつながる3語。',
      line: 'we don’t want to *lose out on* any future revenue streams.',
      said: '「将来の収入を逃したくない」。lose out on がひと続きになる。',
      mean: 'lose out on 〜 ＝ 〜を得そこなう。out の t が弾む。',
      trap: 'out on の弾んだ音が all of に聞こえやすい。形ごと覚える。',
      use: 'Don’t lose out on the early-bird price.（早割を逃さないで）' },

    // R fix: V2, blind 60 %: "nothing more" was the only hedge, so the key read as the nuanced one. Now a second nuanced
    //   reading ("hides that he's hurt") competes with it, and the key is plain.
    // why: drops his plan ← "I hear you / that" read as full agreement; hurt ← a short reply after a "no" heard as a
    //   sulk (the Japanese frame of a curt 「そうですか」)
    { id: 'pr4', skill: 'pragma', level: 'C1', point: 'hear', seg: [93.6, 97.5],
      stem: 'What does Ron’s first short reply to the official do?',
      choices: ['It notes the point and moves past it', 'It agrees and drops the plan for good',
                'It hides that he’s hurt by the “no”'], a: 0,
      cue: '短い返事と、そのすぐあとに続ける話。',
      line: '*I hear that*. Don’t worry, I have tons more ideas.',
      said: '「なるほど」と受けてから、「心配無用、案はまだ山ほどある」と続ける。',
      mean: '「言い分は分かった」という受け止め。賛成ではなく、すぐ次の案に移る。',
      trap: 'I hear that は同意に聞こえやすい。あとに続く話で、受け止めだけだと分かる。',
      use: 'I hear you. Still, let’s go.（分かるよ。でも行こう）' },

    // R fix: V2, blind 65 %: "protect one's department" was weak. It's now "annoyance at being pulled away", the
    //   apology read as irritation; "So sorry. New ringtone" refutes it.
    // why: cutting too much ← "don't cut anything" read as "don't cut", a request to hold back; annoyance ← a call that
    //   interrupts, and the curt order that follows
    { id: 'i3', skill: 'infer', level: 'C1', point: 'without', seg: [100.7, 105.5],
      stem: 'Before stepping out for the call, what does the parting line show?',
      choices: ['Eagerness to be there for every cut', 'Worry that the others will cut too much',
                'Annoyance at being pulled away now'], a: 0,
      cue: 'without me で終わる、短い命令。',
      line: 'So sorry. New ringtone. *Don’t cut anything without me*.',
      said: '電話が鳴り「失礼、新しい着信音で。抜きで何も削らないで」と言って出る。',
      mean: '削る作業が楽しみで、自分抜きで進むのがいやなだけ。',
      trap: 'Don’t cut を「削るな」と取りやすい。without me がつくと「私も混ぜて」。',
      use: 'Don’t start the movie without me!（私抜きで映画始めないでね）' },

    // R fix: V2, blind 60 %: the key was the only two-part choice ("decides… in spite of"). The choices are now short
    //   and parallel. It now also reveals 'both': its key restates a1's ("won't stop her").
    // why: talks him into it ← "We're gonna do this, Ron" heard as an invitation to join; backs down ← "You can't do
    //   that" heard as the last word, the reply lost
    { id: 'g2', skill: 'gist', level: 'B2', point: 'defy', reveals: ['both'], seg: [101.0, 121.5],
      stem: 'How does the clip’s final phone call end?',
      choices: ['Leslie vows to go on, whatever Ron says', 'Leslie backs down once Ron says no',
                'Leslie talks Ron into joining her'], a: 0,
      cue: 'You can’t do that への短い返事。',
      said: 'レスリーは中止のコンサートを今日開くと告げ、「できない」と言われて「見てなさい」と返す。',
      mean: '止められても引かない、という宣言で終わる。',
      trap: '名前を呼んで誘っているように聞こえやすい。できないと言われたあとの返事が答え。',
      use: 'You think I can’t? Watch me.（できないと思う？見てなさい）' },

    // R fix: V2, blind 55 %: "hurt that he doesn't love her" was out of place. It's now "she needs him to love it
    //   too", which "enough for both of us" refutes.
    // why: he secretly loves it ← "love it enough for both of us" heard as "you love it too, deep down"; needs him ←
    //   "both of us" heard as a call for both to care
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'both', seg: [106.4, 111.05],
      stem: 'On the phone, what does Leslie’s first line tell Ron?',
      choices: ['His dislike of the job won’t stop her', 'She’s sure he loves the job deep down',
                'She needs him to love the job too'], a: 0,
      cue: 'I don’t care if のあとと、文の最後の語。',
      line: 'I don’t care if you *hate what we do*. I love it *enough for both of us*.',
      said: '「あなたが私たちの仕事を嫌いでもかまわない。私が二人分好きだから」と言う。',
      mean: '役所嫌いのロンを責めずに、自分は止まらないと宣言している。',
      trap: 'both of us を「二人とも」と取りやすい。enough for は「私一人で二人分」。',
      use: 'I’m excited enough for both of us.（二人分ワクワクしてるから）' },

    // why: 14 ← -ty/-teen: "forty" heard as "fourteen"; 40 ← the "-eight" swallowed at the end of the sentence, and
    //   "an even 40" heard earlier
    { id: 'n3', skill: 'number', level: 'B1', point: 'lot', seg: [109.4, 115.3],
      stem: 'Where will Leslie hold the concert?',
      choices: ['On lot 14', 'On lot 40', 'On lot 48'], a: 2, keep: true,
      cue: 'five o’clock のあと、場所の数字。',
      line: 'the Freddy Spaghetti concert today, five o’clock on *lot 48*.',
      said: '「コンサートを今日やる。5時、48番区画で」と告げる。',
      mean: 'lot ＝ 区画・空き地。閉鎖された公園の代わりに、別の場所で開く。',
      trap: 'forty-eight の eight は文末で弱く、forty で切れたように聞こえやすい。最後まで聞く。',
      use: 'Meet me in parking lot B.（B駐車場で会おう）' },
  ]
};
