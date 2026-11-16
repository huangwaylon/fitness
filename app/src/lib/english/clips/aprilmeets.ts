// REVIEW 2026-11-16: pass 5, fix 19, drop 0, new 0; ear checks 4 (unchanged, one over the target of 3)
//   (fixes: 19 blind-pass rebalances, the h3 cue also (S3), reveals 'havent' on i1)
// OPEN: nt2 and nt1 each rest on a speaker assumption that no name settles ("Every time" is the nurse's; the
//   to-camera man is the adviser). If either is wrong on the phone, drop that item; the bank stays above minimums.
// “April makes Ron's life a living hell | Parks and Recreation” (the official Parks and Recreation channel, Season 2):
// April has booked every meeting request for March 31st, a date she thought didn't exist; it's today, so the office
// splits 93 meetings and runs them badly: a fake daughter, a worker who joins the frisbee team, a nurse shown an arm,
// and advice made of borrowed jargon.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 203 s. Untested on purpose: 0–15 s
// (a phone call, half missing in both sources), 59–105 s speakers (who answers "Ron, you need help…?", who gives the
// orders; only "April" and "Andy" are named), 122–126 s ("Who suck?!" is whisper-only), 142.8 s ("Pawnee" vs
// "money"), 180.0 s ("end run" vs "End Road"; no line quotes it), 195–203 s (the pool outfit and "groin", left out).
// EAR CHECK: 25.0 s s1 — “haven’t had”: the t of haven’t drops and runs into “had” (both sources: haven't had)
// EAR CHECK: 89.8 s x1 — “they’ve been heard”: they’ve and been said weak (both sources agree on the words)
// EAR CHECK: 172.6 s nt2 — “Every time” is the nurse's sigh, not the man's (both sources have the words; no name)
// EAR CHECK: 192.9 s nt1 — the to-camera “I have no idea what I was saying” is the same man who gave the advice at
//   178.7–190.4 s (assumed; no name is said)
import type { Clip } from '../types.ts';

export const aprilMeetings: Clip = {
  id: 'aprilmeets', video: 'ebrq-msO1RE', title: 'April makes Ron\'s life a living hell', dur: 225, wpm: 148,
  band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 + §9.4 (blind 70 %): the title blames April, and "April has quit" was the only other April
    //   choice. Both distractors now misplace the day or the week.
    // why: wrong day ← "six people outside… waiting to meet with me" heard as the visitors' mistake; double-booked ←
    //   "every time someone calls… I always schedule it" heard as overbooking, with "today" missed
    { id: 'g1', skill: 'gist', level: 'B1', point: 'pileup', seg: [16.3, 69],
      stem: 'What problem does Ron face this morning?',
      choices: ['Months of put-off meetings all fall today', 'Six visitors have come on the wrong day',
                'April has double-booked his entire week'], a: 0,
      cue: '冒頭の会話、会議の予定をいつに入れたか。',
      said: 'エイプリルが会議の依頼をすべて同じ日に入れていた。その日が今日。',
      mean: '先送りにしていた会議が、一日にまとめてやって来た。それが場面の出発点。',
      trap: 'six people が最初に聞こえるので客の日にち違いと取りやすい。数より、なぜ今日集まったかを聞く。',
      use: 'Everything landed on the same day.（全部同じ日に重なった）' },

    // why: sixteen ← -teen/-ty in fast speech; sixty ← the -ty swap, and a long queue is easy to picture
    { id: 'n1', skill: 'number', level: 'B1', point: 'six', seg: [16.3, 22.6], keep: true,
      stem: 'How many people are waiting outside to meet Ron?',
      choices: ['six', 'sixteen', 'sixty'], a: 0,
      cue: '「Why are there」のすぐあと。',
      line: 'Why are there *six people* outside…?',
      said: '「外で会議を待っている人が6人いるのはなぜだ」と聞く。',
      mean: 'six ＝ 6。会議を入れた覚えがないのに、人が来て待っている。',
      trap: 'sixty なら2音節で語尾が聞こえ、-teen なら語尾が強く伸びる。six は短く people に続く。',
      use: 'There are six of us. Any tables?（6人です。席ありますか）' },

    // R fix: V2 (blind 75 %): "wants April to sit in" was a filler. Both distractors are now degrees of liking
    //   meetings. B1: its line holds s1's answer, so reveals gains 'havent'.
    // why: puts up with them ← the Japanese frame: meetings as a duty you grudgingly accept; short ones ← "a single
    //   meeting" heard as "one short meeting"
    { id: 'i1', skill: 'infer', level: 'B2', point: 'nomeet', reveals: ['havent'], seg: [21.7, 28.3],
      stem: 'From April’s opening question, how does Ron feel about meetings?',
      choices: ['He would rather have none at all', 'He puts up with them as part of the job',
                'He likes them short and one at a time'], a: 0,
      cue: '「you love me because」のあと。',
      line: 'you know how you love me because you *haven’t had a single meeting*…',
      said: '「会議が一つもなかったから、私のこと気に入ってるでしょ」と切り出す。',
      mean: '会議ゼロが好かれる理由になる。つまりロンは会議が大嫌い。',
      trap: 'single を「短い」「一回」と取りやすい。not a single ＝ 一つもない、の強い否定。',
      use: 'I haven’t had a single day off.（一日も休んでない）' },

    // R fix: V2 (blind 75 %): "bad news" in the key cued the answer, and "a raise" was weak. A favor-asking preface
    //   (a real use of "you know how you love me") replaces it.
    // why: a favor ← this preface often comes before a request; her good work ← "since I became your assistant" heard
    //   as a boast about her record
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'opener', reveals: ['nomeet', 'six'], seg: [21.7, 28.3],
      stem: 'Why does April begin her answer by reminding Ron that he loves her?',
      choices: ['To soften what she is about to admit', 'To butter him up before asking a favor',
                'To show him she has done her job well'], a: 0,
      cue: 'ロンの質問への答え方。いきなり理由を言うか。',
      line: '*So, you know how you love me* because…',
      said: '6人のことを聞かれ、まず「私のこと気に入ってるでしょ」と前置きする。',
      mean: 'So, you know how… は、良い点を思い出させてから悪い知らせを出す前置き。',
      trap: 'この前置きは頼みごとの前にも来るので、お願いと取りやすい。続きが頼みか告白か聞く。',
      use: 'So, you know how I love your car?（ねえ、あなたの車大好きでしょ？）' },

    // R fix: V2 + §9.5 (blind 50 %): "have had… with anyone" and "haven't heard a meeting" aren't real English, so
    //   only two choices fit. All four are now grammatical negatives.
    // why: hadn't had ← the same nasal, in the past perfect; haven't held ← had/held, the vowel and l blur; never had
    //   ← the same meaning, if haven't is heard as one weak syllable
    { id: 's1', skill: 'sound', level: 'B2', point: 'havent', reveals: ['nomeet'], seg: [23.2, 27.9],
      stem: 'Fill the gap: “…because you ___ a single meeting with anyone.”',
      choices: ['haven’t had', 'hadn’t had', 'haven’t held', 'never had'], a: 0,
      cue: '「because you」のすぐあと、2語。',
      line: 'because you *haven’t had* a single meeting',
      said: '「一つも会議がなかったでしょ」と言う。',
      mean: 'haven’t の t は落ち、had とつながって「ハヴンハッ」のように聞こえる。',
      trap: 't が消えると hadn’t had にも聞こえる。since I became（〜して以来）が続くので現在完了。',
      use: 'I haven’t had lunch yet.（まだお昼食べてない）' },

    // R fix: V2 (blind 70 %): the key was the only "she thought". All three are now beliefs about that day.
    // why: office closed ← a day with no meetings pictured as a holiday; Ron on vacation ← "with you" and no meetings
    //   heard as Ron being away
    { id: 'd1', skill: 'detail', level: 'B1', point: 'march31', reveals: ['pileup'], seg: [27.2, 38.7],
      stem: 'Why did April book every meeting for one particular date?',
      choices: ['She thought that date would never come', 'She thought the office was closed then',
                'She thought Ron would be on vacation'], a: 0,
      cue: '「Why?」と聞かれたあとの答え。',
      line: 'Because I *didn’t think March 31st existed*.',
      said: '「3月31日なんて日は無いと思っていたから」と答える。',
      mean: '存在しない日に入れれば、会議は永遠に来ない。それがエイプリルの作戦だった。',
      trap: '会議が無い日と聞くと休みや不在を思い浮かべやすい。理由は Because のあと、existed まで。',
      use: 'I didn’t think it was open on Sundays.（日曜も開いてると思わなかった）' },

    // R fix: V2 (blind 55 %): "to make fun of Ron's question" was a filler. It's now "leaves out April" (her name is
    //   said fast, between September and March).
    // why: gets stuck ← someone else says "June and November", heard as April stalling; leaves out April ← her own
    //   name is lost in the fast list
    { id: 'h1', skill: 'humor', level: 'C1', point: 'rhyme', reveals: ['march31'], seg: [35, 45],
      stem: 'Why does the audience laugh when April recites the rhyme about months?',
      choices: ['She puts March in it, which explains her plan', 'She gets stuck on how it ends and is helped',
                'She leaves her own name, April, out of it'], a: 0,
      cue: '月の名前の並びと、すぐあとの訂正。',
      line: '30 days has September, April, *March* and November. — *June* and November.',
      said: '「30日は9月、4月、3月、11月」と唱え、「6月と11月」と直される。',
      mean: '覚え歌に3月を入れて覚えていた。だから3月31日は無いと思った。それが笑い。',
      trap: '直されるので「忘れた」に見えるが、最後まで自信を持って唱えている。中身の月を聞く。',
      use: 'Wait, does April have 31 days?（待って、4月って31日ある？）' },

    // R fix: V2 (blind 55 %): the key was the only exact figure. "ninety-nine" is added, giving 4 choices.
    // why: nineteen ← -teen/-ty; ninety ← "three" lost at the end of the number; ninety-nine ← the familiar figure
    //   for "nearly a hundred", with three heard as nine
    { id: 'n2', skill: 'number', level: 'B1', point: 'n93', seg: [47.9, 53.4], keep: true,
      stem: 'How many meetings does Ron have today?',
      choices: ['nineteen', 'ninety', 'ninety-three', 'ninety-nine'], a: 2,
      cue: '「how many meetings」への答え、一語。',
      line: 'how many meetings do I have today? — *Ninety-three*.',
      said: '「今日の会議はいくつだ」と聞かれ、「93」と答える。',
      mean: '93件。一日でこなせる数ではないので、このあと総出になる。',
      trap: '-ty と -teen は強さで聞き分ける。ninety のあとの three を落とすと 90 になる。',
      use: 'I have ninety-three emails to answer.（返事するメールが93通ある）' },

    // why: a fire drill ← "fire" is heard and "create a diversion" missed; cancel them all ← her first offer,
    //   "postpone the rest", heard as the second one
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'fire', seg: [53.4, 64.9],
      stem: 'After “you know what to do,” what is April’s second offer?',
      choices: ['A wild stunt so he can slip away', 'A fire drill so the visitors leave',
                'A way to cancel all the meetings'], a: 0,
      cue: '「Or I could」のあと。',
      line: 'do you want me to postpone the rest? Or I could *set myself on fire and create a diversion*.',
      said: '「残りは延期する？それとも私が火だるまになって気をそらす？」と言う。',
      mean: 'diversion ＝ 気をそらすこと。そのすきに逃げる、という極端な冗談。',
      trap: 'fire から火事や避難訓練を思い浮かべやすい。diversion まで聞いて目的をつかむ。',
      use: 'I’ll distract him. You sneak out.（私が気を引くから、こっそり出て）' },

    // R fix: V2 (blind 80 %): the key was the only sensible reading. "In over their head" (the swamped line just
    //   before) replaces "report to the boss".
    // why: in over their head ← the phrase heard as a restatement of "completely swamped"; vote ← hands = raise your
    //   hands
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'hands', seg: [69.9, 80.5],
      stem: 'What does the phrase right after “completely swamped” mean here?',
      choices: ['Everyone has to help out', 'Everyone is in over their head', 'Everyone has to vote on it'], a: 0,
      cue: '「swamped」のすぐあとと、そのあとの「pitch in」。',
      line: 'we’re completely swamped. *All hands on deck*.',
      said: '「手一杯だ。総出でやるぞ」と、ここで働いていない人まで呼ぶ。',
      mean: 'all hands on deck ＝ 船の乗組員は全員甲板へ、から「全員で取りかかれ」。',
      trap: 'swamped の言い換えと取りやすい。続く pitch in（手伝う）と同じ向き。',
      use: 'It’s all hands on deck this weekend.（今週末は総出だよ）' },

    // R fix: V2 (blind 75 %): "come back next month" was a filler. It's now an office routine: note it for Ron.
    // why: solve them ← "divvy up all these meetings" heard as getting the work done; note it for Ron ← the usual
    //   stand-in script, but "Just make them feel…" and "head home early" rule out passing anything on
    { id: 'i2', skill: 'infer', level: 'C1', point: 'heard', seg: [85.2, 91],
      stem: 'From the instructions, how should the four of them handle the meetings?',
      choices: ['Listen politely, but promise nothing', 'Note each request for Ron to decide',
                'Sort out each problem on the spot'], a: 0,
      cue: '「Just make them」で始まる指示。',
      line: 'Just make them *feel like they’ve been heard*.',
      said: '会議を手分けして、「話を聞いてもらえたと思わせればいい」と指示する。',
      mean: '「思わせる」だけでいい、つまり実際に解決しなくていい。会議の片づけ方の指示。',
      trap: '分担して全部やると聞くと問題解決に思える。feel like（〜と感じさせる）が本音。',
      use: 'Just make it look like you tried.（やったように見せとけばいい）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'heard', seg: [88.55, 91],
      stem: 'Type the end: “Just make them feel like ___.” (3 words)', answer: "they've been heard",
      cue: '「feel like」のすぐあと。',
      line: 'Just make them feel like *they’ve been heard*.',
      said: '「話を聞いてもらえた、と相手に思わせろ」と言う。',
      mean: 'they’ve は短く、been も弱く「ビン」と聞こえる。',
      trap: 'they’ve の v が消えて they been に聞こえやすい。been heard は受け身。',
      use: 'I just want to feel heard.（ただ話を聞いてほしいだけ）' },

    // R fix: V2 (blind 65 %): "put off" was weak and the key the only odd one. "Shouting matches" (the first
    //   meeting) replaces it.
    // why: problems fixed ← "That is a really great idea… I'm gonna do that" heard as a success; shouting matches ←
    //   the first meeting's yelling man, taken as the pattern
    { id: 'g2', skill: 'gist', level: 'B2', point: 'howgo', reveals: ['endrun'], seg: [108.5, 195.2],
      stem: 'How do most of the meetings actually go?',
      choices: ['They wander from what people came for', 'They end with the visitors’ problems fixed',
                'They turn into shouting matches'], a: 0,
      cue: '会議ごとに、来た人の用件がどうなったか。',
      said: '会議が次々に開かれるが、来た人の用件はどれもまともに扱われない。',
      mean: '場面の後半は、会議が本題から外れていく様子を並べた笑い。',
      trap: '最後の男は満足して帰るので解決に見える。中身のある助言だったかまで考える。',
      use: 'That meeting went nowhere.（あの会議、何も進まなかった）' },

    // R fix: V2 (blind 55 %): "other teams' parents" was weak. "The coaches" keeps the girls' team in the frame.
    // why: referees ← the usual target of a fan who yells; coaches ← "girls" heard, the target missed
    { id: 'n3', skill: 'detail', level: 'B1', point: 'complaint', seg: [111.9, 122],
      stem: 'According to the complaint, who did the man yell at?',
      choices: ['A team of five-year-old girls', 'The referees at the games', 'The coaches of a girls’ team'], a: 0,
      cue: '「According to the complaint」のあと。',
      line: 'According to the complaint, you yelled at *five-year-old girls*.',
      said: '試合に来るなと言われた男に、「苦情では、5歳の女の子たちに叫んだとある」と返す。',
      mean: '男の言う players（選手）は、5歳の女の子たちだった。',
      trap: '試合でやじると言えば審判や大人を思い浮かべやすい。five-year-old は年齢。',
      use: 'According to the email, it starts at five.（メールによると5時開始）' },

    // R fix: V2 (blind 50 %): "the worker takes his side" was a filler. It's now "the complaint twisted his words".
    // why: too harsh ← the man's own framing ("just because I yell…") taken at face value; twisted ← he argues, so
    //   the complaint must misquote him, but it repeats his words and adds only the age
    // R fix: S3: the cue quoted "just because", which only the key has; it now says 男の言い分.
    { id: 'h3', skill: 'humor', level: 'C1', point: 'complaint', seg: [111.9, 122],
      stem: 'Why does the answer about the complaint get a laugh?',
      choices: ['His “just because” hid who the players were', 'The ban seems far too harsh for some yelling',
                'The complaint has twisted what he said'], a: 0,
      cue: '男の言い分と、苦情の中身を比べて。',
      line: 'just because I yell… *at the players*? — …you yelled at *five-year-old girls*.',
      said: '「選手にやじっただけで出入り禁止？」と不満な男。苦情では相手は5歳の女の子。',
      mean: 'just because で小さく見せた話が、実はひどい話だった。その落差が笑い。',
      trap: '男の言い分だけだと処分が重く思える。just because は話を小さく見せる。',
      use: 'Just because I was a little late?（ちょっと遅れただけで？）' },

    // why: assistant ← what she really is (said at 27 s); wife ← "his last wish" heard as a widow's line
    { id: 'd2', skill: 'detail', level: 'B1', point: 'daughter', seg: [125.8, 135.4],
      stem: 'Who does April say she is, to the man expecting Ron?',
      choices: ['Ron’s daughter', 'Ron’s assistant', 'Ron’s wife'], a: 0,
      cue: '「I’m his」のあと。',
      line: 'I’m his *daughter*, April Swanson.',
      said: '「ロンは亡くなりました。私は娘のエイプリルです」と名乗る。',
      mean: '本当はアシスタント。作り話で、ロンの代わりに会議を受けている。',
      trap: '本当の立場を知っていると assistant を選びやすい。聞くのは「何と名乗ったか」。',
      use: 'Hi, I’m his sister, Kate.（こんにちは、彼の妹のケイトです）' },

    // R fix: V2 (blind 65 %): "too upset" was not a near miss. It's now the formal frame ("I'm afraid that…") read
    //   as respect.
    // anchor: 126.4–131.8 s "I thought I was having this meeting with Ron Swanson. — I'm afraid that Ron Swanson's
    //   currently dead": "currently" is the word for a passing state ("currently unavailable"), inside the polite
    //   "I'm afraid that…" frame of an office excuse for someone who can't come to a meeting
    // why: died a moment ago ← currently heard as "just now" (scope shift); formal and kind ← right register (office
    //   politeness), wrong effect: on "dead" the temporary word makes it absurd, not gentle
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'dead', seg: [125.8, 140],
      stem: 'What does the word “currently” do to April’s excuse for Ron?',
      choices: ['Makes death sound like a short absence', 'Makes it clear he died only a moment ago',
                'Makes the sad news sound formal and kind'], a: 0,
      cue: '死を伝える文の、dead の直前の一語。',
      line: 'I’m afraid that Ron Swanson’s *currently dead*.',
      said: '男に「あいにくロンは現在死んでおります」と告げる。',
      mean: 'currently は「現在不在」のように一時的な状態の語。死に付けると外出中の言い訳のようになり、うそが透ける。',
      trap: '「つい今」と取ると通りそうだが、それなら just。一時的な状態の語が永遠の事に付いたら、わざとのずれを疑う。',
      use: 'He’s currently in a meeting.（ただいま会議中です）' },

    // why: new players ← the worker's "I will join your team" heard as what the man came for; a new league ← the
    //   surprised "…has an Ultimate League?" heard as the league being new
    { id: 'i3', skill: 'infer', level: 'B2', point: 'frisbee', reveals: ['join'], seg: [139.6, 149.4],
      stem: 'What had the frisbee man come in to talk about?',
      choices: ['Problems his league keeps running into', 'Finding new players to join his team',
                'Starting a brand-new league in town'], a: 0,
      cue: '「And we」のあと、話がさえぎられる前。',
      line: 'And we *keep running into conflicts* with the—',
      said: '「うちのリーグは〜とのもめごとが続いていて」と言いかけたところで、さえぎられる。',
      mean: '用件はリーグが抱える問題の相談。仲間集めではない。',
      trap: 'I will join your team が強く聞こえるので、勧誘の話と取りやすい。それは聞き手の勘違い。',
      use: 'We keep running into the same problem.（同じ問題に何度もぶつかる）' },

    // R fix: V2 (blind 50 %): the key was the only eager choice. "Eager to help the league" ("You won me over") is
    //   added.
    // why: ending it fast ← he cuts the man off twice; help the league ← "You won me over" heard as agreeing to take
    //   up the league's problem
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'join', seg: [144.6, 158.4],
      stem: 'How does the worker respond to the frisbee man?',
      choices: ['Eager to join the team himself', 'Keen to wrap the meeting up fast',
                'Eager to fix the league’s problem'], a: 0,
      cue: 'さえぎったあとの質問の中身。',
      line: 'I will *join your team*… When does practice start?… *Are we the Lightning?*',
      said: '話をさえぎって「チームに入る。練習はいつ？ユニフォームの色は？チーム名は？」と聞く。',
      mean: '用件そっちのけで、自分が入る気満々。we と言い出すほど乗り気。',
      trap: '何度もさえぎるので早く終わらせたいように見えるが、質問の中身は参加の準備。',
      use: 'Count me in! When do we start?（入れて！いつから？）' },

    // R fix: V2 (blind 60 %): "join the parks staff" was a filler. "Seriously?" heard as disbelief replaces it.
    // why: annoyed ← "I don't actually work in the Parks Department" is bad news for a visitor; doubts her ←
    //   "Seriously?" heard as disbelief, but "That's great news" follows
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'nurse', seg: [158.2, 171],
      stem: 'When the man hears what her real job is, is his reply sarcastic?',
      choices: ['No; he is glad, as he has a health question', 'Yes; he is annoyed she can’t help with parks',
                'Yes; he doubts that she is really a nurse'], a: 0,
      cue: '「great news」の直後に何を見せるか。',
      line: 'I’m a nurse. — Seriously? That’s great news. I have *the weirdest thing on my arm*.',
      said: '「実は公園課じゃなくて看護師なの」と言うと、男は喜んで腕を見せる。',
      mean: '皮肉ではなく本気で喜んでいる。公園の用件より、腕を診てもらう方が大事になった。',
      trap: '用件が通らない知らせなので皮肉に聞こえやすい。皮肉かどうかは、すぐあとの行動で確かめる。',
      use: 'You’re a doctor? Can I ask you something?（お医者さん？ちょっと聞いていい？）' },

    // R fix: V2 (blind 65 %): "angry she isn't staff" was far from the scene. It's now "doubt she is a nurse".
    // anchor: 162.2–172.6 s "I'm a nurse" → "That's great news. I have the weirdest thing on my arm. Can you see
    //   this?" → "Every time.": the two words sum up a pattern, and the man's turn from parks business to his arm
    //   is one more case of it
    // why: doubt she's a nurse ← right mechanism (a pattern), wrong pattern: his "Seriously?" heard as disbelief; the
    //   rash comes back ← "every time" tied to "the weirdest thing on my arm", as if it were the man's line
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'nurse', seg: [161.6, 173.35],
      stem: 'What does the nurse’s short remark after “Can you see this?” tell us?',
      choices: ['People always ask her for medical help', 'People always doubt that she is a nurse',
                'This rash always comes back on his arm'], a: 0,
      cue: '腕を見せられた直後の、短い二語。',
      line: 'Can you see this? — *Every time*.',
      said: '看護師と分かったとたん、男が腕を見せてくる。彼女は「毎回これ」とつぶやく。',
      mean: 'every time は「いつもこうなる」というぼやき。看護師だと言うと、どこでも体の相談をされる。',
      trap: '「腕の症状が毎回出る」と取ると話がつながるが、それなら男の言葉になる。ぼやきは、何が繰り返されるかを聞く。',
      use: 'Every time I say I’m a chef…（シェフだと言うと毎回…）' },

    // R fix: V2 (blind 65 %): "a joke both shared" was weak. "Sound advice he has since forgotten" (the past
    //   tense "was saying" read literally) replaces it.
    // anchor: 184.7 s "Yeah?" (surprised that his advice landed) and 192.9 s to camera "I have no idea what I was
    //   saying": the to-camera line turns "go right to the commissioner" and "last resort… city council" into
    //   borrowed talk; his surprised "Yeah?" shows he didn't know it was good even then
    // why: too modest ← "no idea" heard as 謙遜 (the literal hedge); since forgotten ← "was saying" read as memory
    //   loss, but the "Yeah?" at 184.7 s shows he didn't follow it at the time
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'endrun', seg: [172.9, 195.2],
      stem: 'After his comment to the camera, how should we hear the worker’s advice?',
      choices: ['As office talk he didn’t understand himself', 'As good advice he is too modest to own',
                'As sound advice he has since forgotten'], a: 0,
      cue: '相手がほめた時の短い返事と、カメラへの一言。',
      line: 'That is a really great idea. — *Yeah?* … *I have no idea what I was saying*.',
      said: '助言を絶賛されると「そう？」と驚き、カメラに「何を言ってたか分からない」と話す。',
      mean: 'カメラへの本音が場面を書きかえる。もっともらしい助言は、聞きかじった言葉を並べただけ。',
      trap: '「分からない」を謙遜と取りやすい。この形式では、カメラへの一言が場面の答え合わせになる。',
      use: 'I just nodded and used big words.（うなずいて難しい言葉を使っただけ）' },

    // R fix: V2 (blind 60 %): "moves the talk on" was a filler. "Teases him" (an ironic reading) replaces it.
    // why: wants details ← "Tell me" read literally as a request; teasing ← the set phrase heard as ironic, but his
    //   next words are friendly advice
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'tellme', seg: [173, 178.7],
      stem: 'When one man says the gridlock drives him nuts, what does the reply do?',
      choices: ['Agrees strongly that he feels the same', 'Asks him to explain the problem more',
                'Teases him for getting so worked up'], a: 0,
      cue: '「drives me nuts」への短い返事。',
      line: 'this gridlock *drives me nuts*. — *Tell me about it*.',
      said: '「この停滞にはイライラする」と言われ、「ほんとそれ」と返す。',
      mean: 'Tell me about it ＝「まったくだ」。強い同意で、説明を求めてはいない。',
      trap: '文字どおり「話して」と取りやすい。不満への Tell me about it は相づち。',
      use: 'Traffic was awful. — Tell me about it.（渋滞ひどかった。——ほんとそれ）' },

    // R fix: V2 (blind 80 %): "a place to rest" was absurd. Both distractors now read the advice's other words.
    // why: first stop ← "go right to the commissioner" just before, heard as one list of first steps; most likely
    //   yes ← "Good luck there" heard as encouragement
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'resort', seg: [185.8, 191.2],
      stem: 'In the advice at the end, what is the city council?',
      choices: ['The last place to try if all else fails', 'The first place to go, before the commissioner',
                'The place most likely to say yes'], a: 0,
      cue: '「city council」の前の2語。',
      line: 'Your *last resort* is probably gonna be city council. Good luck there.',
      said: '「最後の手段は市議会だろうね。まあ頑張って」と言う。',
      mean: 'last resort ＝ 最後の手段。Good luck there で「望み薄」と添える。',
      trap: 'Good luck を応援と取ると有望に聞こえる。last resort で「最後の手段」。',
      use: 'Taxis are our last resort.（タクシーは最後の手段）' },
  ]
};
