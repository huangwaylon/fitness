// “Ron suffers workplace harassment | Parks and Recreation” (the official Parks and Recreation channel, Season 4):
// Chris keeps pulling Ron into meetings, lunches and invitations; Ron enjoys cutting a budget, can't explain how he
// ended up at lunch, hands Chris a near-stranger as a new friend, and learns it was all a tryout for Ben's old job.
// Segments from the captions, words from whisper (2026-11-16). Untested: 4.7 s ("Present."), 92–98 s (who orders the
// cucumber; whisper's "A cucumber!"), 118 s (whisper's "chikai", the captions' "Chicago"), 138 s (the sign-off:
// whisper's "Adam Eagle! Chris Drager!", the captions' "done Amigo"), 140–152 s ("hang on with me" / "You mean hang
// out?" and the friend's theory: the second speaker is never named), 165 s (whisper has "Dennis" before "Kyle", the
// captions only "Kyle"), 182–190 s (who says "Level with me"), and 207 s (whisper's "mull", the captions' "mow").
// No EAR CHECK: every key here stands on words both sources share, and no key rests on who speaks or on tone.
// REVIEW 2026-11-16: pass 4, fix 20, drop 0, new 0; ear checks 0
import type { Clip } from '../types.ts';

export const ronharass: Clip = {
  id: 'ronharass', video: 'lxa-G6H2f6k', title: 'Ron suffers workplace harassment', dur: 234, wpm: 158,
  band: 'mid', tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %) + K5 — the choices weren't parallel and the key read oddly; all three now "Gives…"
    // why: real reason ← "very busy" taken at face value, but he finds time seconds later; come back later ← the
    //   Japanese frame: 今ちょっと… as a "not now", though nothing about later is said
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'busy', reveals: ['cut', 'room'], seg: [8.9, 21.2],
      stem: 'When Chris first invites him, what does Ron’s short remark do?',
      choices: ['Gives an excuse to turn the invitation down', 'Gives a real reason he can’t leave his desk',
                'Gives a hint to come back another time'], a: 0,
      cue: 'very で始まる一言と、その少しあとの返事。',
      line: '*I’m very busy here.* … I can make room in my schedule.',
      said: '誘いに「とても忙しい」と言うが、予算を削ると聞くとすぐ「時間を作れる」と言う。',
      mean: '「忙しい」は断るための言い訳。本当に忙しければ、すぐに時間は作れない。',
      trap: '言葉どおり仕事の量の話と取りやすい。すぐ気が変わったら、最初の一言は口実。',
      use: 'Sorry, I’m very busy right now.（ごめん、今ちょっと忙しくて）' },

    // R fix: V2 (blind 80 %) — "big budgets" was weak; "cut" in the wrong relation (he could save them) is the
    //   near miss, and "I am being forced to… cut" plus his eager reply refutes it
    // why: fascinating ← the first adjective heard, said by Chris; save them ← "cut" caught, and coming to a meeting
    //   heard as coming to fight for the projects
    { id: 'i1', skill: 'infer', level: 'B2', point: 'cut', reveals: ['room'], seg: [10.4, 21.2],
      stem: 'Why does Ron suddenly find time for the meeting?',
      choices: ['He hears the projects will be cut', 'He hears the projects are fascinating',
                'He hears he can save the projects from cuts'], a: 0,
      cue: 'Chris の文の最後、entirely の前。',
      line: 'projects… that I am being forced to *brutally cut entirely*. — I can make room in my schedule.',
      said: '「面白い大型の計画を、全部ばっさり削らないといけない」と聞いて、ロンは時間を作ると言う。',
      mean: '削ると聞いたとたん乗り気になる。ロンは、予算を減らすことが好き。',
      trap: 'fascinating が先に聞こえるが、気が変わるのは文の最後の cut のあと。',
      use: 'I can make time for that.（それなら時間を作れるよ）' },

    // R fix: V2 (blind 50 %) — "sarcastic refusal" was weak; a second "Glad" (to please the boss) is the near
    //   miss, and the cuts he made room for show the pleasure is in the job itself
    // why: reluctant ← the Japanese frame: a polite set phrase said out of duty; to win favor ← a yes to a superior's
    //   hint heard as 忖度, though he jumped at the cuts before Chris asked anything
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'pleasure', reveals: ['badnews', 'cut', 'room'], seg: [14.0, 27.0],
      stem: 'How does Ron feel about giving the bad news?',
      choices: ['Glad; he’ll truly enjoy delivering it', 'Glad; he’s keen to win Chris’s favor',
                'Unwilling; he’s only being polite'], a: 0,
      cue: 'Chris の名前を呼んだあとの言い方。',
      line: 'brutally cut entirely… I can make room… — Chris, it would be my *absolute pleasure*.',
      said: '削る話で時間を作り、伝え役も「この上ない喜びだ」と引き受ける。',
      mean: 'absolute pleasure は本気。予算を削るのも、悪い知らせを伝えるのも楽しみ。',
      trap: '丁寧な決まり文句は社交辞令にも聞こえるが、直前に自分から時間を作っている。',
      use: 'It would be my pleasure.（喜んで）' },

    // R fix: V2 (blind 80 %) + S1 — "about his schedule" in the stem answered it; the stem now names the moment,
    //   so the room/desk readings have to be refuted by hearing "in my schedule"
    // why: an office ← "room" read as 部屋; a desk ← "make room" heard as clearing space for the work
    { id: 'p1', skill: 'phrase', level: 'B1', point: 'room', seg: [18.4, 21.4],
      stem: 'Once Ron hears about the cuts, what does he offer?',
      choices: ['To find time to come along', 'To lend his office for the meeting', 'To clear space on his desk'], a: 0,
      cue: '「make room」のあとの語。',
      line: 'I can *make room* in my schedule.',
      said: '「予定に空きを作れる」と言う。',
      mean: 'make room ＝ 場所や余裕を作る。in my schedule で「時間を空ける」になる。',
      trap: 'room を「部屋」と取りやすい。make room は「空きを作る」で、後ろの語で何の空きかが決まる。',
      use: 'I can make room for one more.（もう1人分、空けられるよ）' },

    // R fix: V2 (blind 60 %) — the key was the only "hinting"; a second hint (go easy on them) competes, and
    //   Ron's "my absolute pleasure", which Chris lets stand, refutes it
    // why: apology ← the Japanese frame: a preface before bad news heard as 恐縮; go easy ← "not a big fan of… bad
    //   news" heard as a plea for kindness, not a hand-off
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'badnews', reveals: ['pleasure'], seg: [21.0, 27.0],
      stem: 'When Chris mentions how he feels about bad news, what is he doing?',
      choices: ['Hinting that he wants Ron to tell them', 'Saying sorry for the news that is coming',
                'Hinting that Ron should go easy on them'], a: 0,
      cue: '「As you know」のあとと、ロンの返事。',
      line: 'As you know, *I’m not a big fan of delivering bad news*. — Chris, it would be my absolute pleasure.',
      said: '「知ってのとおり、悪い知らせを伝えるのは苦手でね」と言うと、ロンが「喜んで」と返す。',
      mean: '自分は苦手、と言って相手に頼んでいる。ロンはすぐその意味を受け取る。',
      trap: '前置きを謝罪と取りやすい。返事が「喜んで」なら、前の文は頼みごとだった。',
      use: 'I’m not a big fan of night driving.（夜の運転はあまり好きじゃない）' },

    // R fix: V2 (blind 70 %) — "costs too little" was weak; "work for free" is the near miss from “at no cost to the
    //   taxpayer”, and "I have personally put out" (he, not firemen) refutes it
    // why: work for free ← "at no cost to the taxpayer" heard about the firemen; started them ← "personally" +
    //   "fires" heard as a confession, but he "put out" the fires
    { id: 'h1', skill: 'humor', level: 'C1', point: 'fire', seg: [26.6, 34.6],
      stem: 'Why does the idea about the fire department get a laugh?',
      choices: ['He thinks people can put out fires themselves', 'He thinks firefighters should work for free',
                'He admits that he started some fires himself'], a: 0,
      cue: '「personally」のあとの動詞。',
      line: 'cutting the entire fire department? I have *personally put out several local fires*, at no cost to the taxpayer.',
      said: '「消防署ごと削ったら？自分で何件も火を消した。税金ゼロで」と言う。',
      mean: '自分で消せるから消防署は要らない、という極端な理屈。本人は真剣。',
      trap: 'fires で放火に聞こえやすいが、put out は「消す」。動詞のあとの小さな語を聞く。',
      use: 'I put out the fire myself.（自分で火を消した）' },

    // R fix: V2 (blind 60 %) — "one more kind word" was weak; a signpost reading (it warns that bad news comes) is
    //   the near miss, refuted by the flat, unannounced cancel
    // why: a warning ← a link before bad news heard as a signpost ("however…"), but "also" announces nothing;
    //   smaller matter ← what "also" usually does, but the matter is the biggest one
    { id: 'm1', skill: 'marker', level: 'B2', point: 'also', seg: [34.3, 46.1],
      stem: 'Right after the praise for John, what does the one-word link do?',
      choices: ['It slips the worst news in as an extra', 'It warns John that bad news is coming',
                'It moves on to a smaller matter'], a: 0,
      cue: 'ほめ言葉が終わったあと、文頭の一語。',
      line: 'you are the best idea man in the business. *Also*, we’re *canceling all of your ongoing projects*.',
      said: '「君は最高のアイデアマンだ。あと、進行中の計画は全部中止」と続ける。',
      mean: 'Also はふつう小さな追加に使う。一番重い知らせを、ついでのように言うおかしさ。',
      trap: 'Also を切り替えの合図と取りやすいが、小さな追加の語。あとの中身で重さを判断する。',
      use: 'Also, I’ll be a little late.（あと、少し遅れます）' },

    // R fix: V2 (blind 65 %) — "for less" was weak; "somewhere else" (from the water question that follows) is
    //   the near miss, and "dead" refutes it
    // why: later ← "what about…?" heard as a delay to be argued over; elsewhere ← "Where will all the water go?"
    //   right after, as if the dam were moving
    { id: 'd1', skill: 'detail', level: 'B1', point: 'dam', seg: [45.7, 51.3],
      stem: 'What will happen to the river dam?',
      choices: ['It won’t be built at all', 'It will be built a bit later', 'It will be built somewhere else'], a: 0,
      cue: '「What about the… Dam?」への返事。',
      line: 'What about the Pawnee River Dam? — *Dam’s dead*. Have a nice day.',
      said: '「ダムはどうなる？」に「ダムは死んだ。よい一日を」と返す。',
      mean: 'dead ＝ 計画が完全に終わった。延期でも縮小でもない。',
      trap: 'dead を延期の意味に取ると「あとで」に聞こえる。dead はもう戻らない。',
      use: 'That plan’s dead.（その計画はもうなしだ）' },

    // R fix: V2 (blind 75 %) — "own words" was weak; a "not sorry, just joking" reading is the near miss, and
    //   "your dream has been crushed… Good meeting" refutes it
    // why: proud ← "We're very sorry" from the other, then a short reply heard as a gruff apology; joking ← the
    //   Japanese frame: a blunt line taken as 冗談 to lighten the room
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'notsorry', seg: [55.3, 64.6],
      stem: 'After “We’re very sorry,” what does the short reply show?',
      choices: ['He isn’t sorry at all and doesn’t hide it', 'He is sorry but too proud to say so',
                'He isn’t sorry, but he says it as a joke'], a: 0,
      cue: '短い返事の、最後の一語。',
      line: 'your dream has been crushed. — We’re very sorry. — *I am not.* Good meeting.',
      said: '「夢は砕かれた」のあと、一人が「申し訳ない」、もう一人が「私は違う」と言う。',
      mean: 'I am not ＝ I am not sorry。短縮せず言い切り、悪いと思っていないと示す。',
      trap: '短い返事は照れ隠しに聞こえやすい。最後の not が気持ちを決める。',
      use: 'You might be sorry. I am not.（君は悪いと思っても、僕は思わない）' },

    // R fix: V2 (blind 75 %) — "didn't catch" was weak; "so many meetings" (not so many cruel ones) is the near
    //   miss in the same shape as the key
    // why: busy week ← "which meeting?" heard as about the number of meetings, not of cruel ones; not cruel ← the
    //   modesty frame (謙遜): he can't accept such a compliment
    { id: 'h2', skill: 'humor', level: 'C1', point: 'specific', reveals: ['youll'], seg: [66.1, 75.6],
      stem: 'Why does Ron’s answer to the thank-you get a laugh?',
      choices: ['He has been cruel in so many meetings he can’t tell', 'He has had so many meetings this week he can’t tell',
                'He thinks he wasn’t cruel at all in that meeting'], a: 0,
      cue: '「ruthless and cruel」と言われたあとの返事。',
      line: 'thank you for being so ruthless and cruel in the meeting… — *You’ll have to be more specific.*',
      said: '「この前の会議で冷酷でいてくれてありがとう」に「もっと具体的に言ってくれ」と返す。',
      mean: '冷酷だった会議が多すぎて、どれか分からない。否定せず、むしろ誇っている。',
      trap: '会議の数の話にも取れるが、ruthless and cruel への返事。',
      use: 'Which one? You’ll have to be more specific.（どれ？もっと具体的に）' },

    // why: "You have to" ← the 'll swallowed before "have"; "You'd have to" ← 'll and 'd both shrink to a dark,
    //   barely heard sound; "You had to" ← the past, when "have" is caught as "had"
    { id: 's1', skill: 'sound', level: 'B2', point: 'youll', seg: [71.1, 75.5],
      stem: 'Fill the gap: “___ be more specific.”',
      choices: ['You’ll have to', 'You have to', 'You’d have to', 'You had to'], a: 0,
      cue: '文の最初、とても短い二、三語。',
      line: '*You’ll have to* be more specific.',
      said: '「もっと具体的に言ってもらわないと」と返す。',
      mean: 'You’ll have to が「ユーラフタ」と一続きになる。’ll は暗い「ウ」の音。',
      trap: '’ll は小さく、You have to に聞こえやすい。you のあとが少し伸びたら ’ll を疑う。',
      use: 'You’ll have to ask the manager.（店長に聞いてもらわないと）' },

    // R fix: V2 (blind 60 %) — "the dam" was a filler; "talk projects at his desk" (projects said, lunch refused)
    //   is the keyword trap now
    // why: already has plans ← the usual polite excuse for turning down lunch; at his desk ← "That won't be
    //   necessary" heard as "no need for lunch", with "projects" still the topic
    { id: 'd2', skill: 'detail', level: 'B1', point: 'projects', seg: [75.4, 84.0],
      stem: 'Why does Ron say lunch isn’t needed?',
      choices: ['He has no projects and hates them', 'He has other lunch plans already',
                'He’d rather talk projects at his desk'], a: 0,
      cue: '「That won’t be necessary」のあと、二つの短い文。',
      line: 'That won’t be necessary. *I don’t have any projects. I hate projects.*',
      said: '「計画の話をしよう」と誘われ、「必要ない。計画はないし、計画は嫌いだ」と答える。',
      mean: 'That won’t be necessary ＝ 丁寧に断る言い方。理由はとても正直。',
      trap: '昼食を断る理由は先約が多いが、ここは理由をはっきり言っている。',
      use: 'That won’t be necessary, thanks.（それには及びません）' },

    // C2: the talking head against the scene (cf. i3)
    // anchor: 85.6–93.2 s Chris laughs, then "We should order, and then we can talk shop", as if lunch were agreed;
    //   98.3–105.1 s to camera "I declined his invitation. He started laughing, and the next thing I knew we were at
    //   lunch"
    // R fix: V2 (blind 60 %) — "talk about work" was the weakest; "said yes but regrets it" (the usual talking-head
    //   confession) is the near miss, and "I declined his invitation" refutes it
    // why: won over by the laugh ← the order of events (laugh, then lunch) read as cause, but "I declined" stands and
    //   he never says yes; regrets it ← "I don't know what happened" heard as regret, not puzzlement
    { id: 'c1', skill: 'infer', level: 'C2', point: 'drug', seg: [85.0, 108.1],
      stem: 'After Ron’s comment to the camera, how should we see the lunch?',
      choices: ['Ron never said yes; Chris just took him along', 'Ron gave in once Chris laughed and asked again',
                'Ron said yes, but now he wishes he hadn’t'], a: 0,
      cue: '昼食の場面と、カメラへの一言を比べて。',
      line: 'We should order… — I *declined* his invitation. He started laughing, and *the next thing I knew* we were at lunch.',
      said: '昼食の席で注文の話が進むが、カメラにはロンが「断ったのに、気づいたら昼食にいた」と話す。',
      mean: '場面だけ見ると、ロンが誘いを受けたように見える。カメラへの一言がそれを書きかえる。',
      trap: '笑い→昼食の順を、説得されたと読みやすい。この形式では、カメラへの一言が答え合わせ。',
      use: 'I said no, and somehow here I am.（断ったのに、なぜかここにいる）' },

    // R fix: V2 (blind 70 %) — "shops in town" was too easy to rule out; "office gossip" (shop = the workplace,
    //   but talk about people) is the near miss
    // why: gossip ← "shop" known as the workplace, "talk" heard as chatting about colleagues; the menu ← "We should
    //   order" just before, so the talk seems to be food
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'shop', seg: [89.2, 93.8],
      stem: 'At lunch, what does Chris want to talk about after they order?',
      choices: ['Their own work', 'Office gossip', 'The lunch menu'], a: 0,
      cue: '「We should order」のあと、talk に続く語。',
      line: 'We should order, and then we can *talk shop*.',
      said: '「注文しよう。それから仕事の話をしよう」と言う。',
      mean: 'talk shop ＝ 仕事の話をする。shop は「職場」の意味で、店とは関係ない。',
      trap: 'shop を「店」と取りやすく、職場と分かっても噂話と混ざる。talk shop は仕事そのものの話。',
      use: 'Let’s not talk shop tonight.（今夜は仕事の話はやめよう）' },

    // R fix: K1 — "what Chris may have put in his food" is close to what "Did he drug me?" literally asks, so it
    //   could be defended; it's now the odd order just before ("A cucumber!")
    // why: why he laughed ← "he started laughing" is the last detail before lunch; the order ← "A cucumber!" opens
    //   the segment, so the puzzle seems to be the food
    { id: 'd4', skill: 'detail', level: 'B2', point: 'drug', seg: [97.8, 108.1],
      stem: 'In his comment to the camera, what puzzles Ron?',
      choices: ['How he ended up at lunch after saying no', 'Why Chris laughed when he heard the answer',
                'Why Chris ordered something so strange'], a: 0,
      cue: '「I declined」と「the next thing I knew」の間。',
      line: 'I *declined* his invitation. He started laughing, and *the next thing I knew we were at lunch*.',
      said: '「断ったのに、彼が笑い出して、気づいたら昼食の席。薬を盛られた？」と話す。',
      mean: '断ったのに一緒にいる理由が分からない。drug me は、それほど不思議だという誇張。',
      trap: '直前の注文や笑いが耳に残るが、困惑は I declined のあと。',
      use: 'Next thing I knew, it was midnight.（気づいたら真夜中だった）' },

    // why (the instinct): "next thing I knew" ← the weak "the" lost; "the next thing I know" ← the present tense of the
    //   set phrase, the final /u/ of "knew" heard as "know"
    { id: 'x1', skill: 'dict', level: 'B2', point: 'drug', seg: [101.3, 105.8],
      stem: 'Type the middle: “He started laughing, and ___ we were at lunch.” (5 words)',
      answer: 'the next thing i knew',
      cue: '「started laughing, and」のあと。',
      line: 'He started laughing, and *the next thing I knew* we were at lunch.',
      said: '「笑い出して、気づいたら昼食の席にいた」と話す。',
      mean: 'the next thing I knew ＝「気づいたら」。next の t が落ちて「ネクスシング」に近い。',
      trap: '文頭の the は弱く消えやすい。過去の話なので knew。',
      use: 'The next thing I knew, I was asleep.（気づいたら寝ていた）' },

    // R fix: V2 (blind 75 %) — "learning new things" was weak; "old customs" (what a tea ceremony is) is the near
    //   miss, and the choices are now parallel
    // why: Japanese food ← the tea ceremony is Japanese, and "rice" comes later; old customs ← the usual reason to
    //   like a tea ceremony, and "value" heard as about tradition
    { id: 'd3', skill: 'detail', level: 'B1', point: 'silence', seg: [122.9, 126.5],
      stem: 'Why does Chris think Ron would like the tea ceremony?',
      choices: ['Ron values silence a lot', 'Ron likes Japanese food a lot', 'Ron respects old customs a lot'], a: 0,
      cue: '「Why?」と聞かれたあとの答え。',
      line: 'Why? — I know how much you *value silence*.',
      said: '「なぜ？」に「君が静けさを大事にしているのを知ってるから」と答える。',
      mean: 'value ＝ 大事にする。茶会は静かな場なので、ロンに合うと考えた。',
      trap: '日本の行事なので食べ物の話に思えるが、理由は value のあと。',
      use: 'I know how much you value your time.（君が時間を大事にしてるのは知ってる）' },

    // R fix: V2 (blind 65 %) — "only to mock it" was weak; "offers a later date" (last week's lunch heard as
    //   "another time") is the near miss, and "for the foreseeable ever" refutes it
    // why: says yes ← "A fair point" heard as agreeing to come; later date ← "we did just have lunch last week"
    //   heard as "too soon, maybe later"
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'fairpoint', seg: [126.3, 135.6],
      stem: 'When Ron grants Chris’s reason, what does he do next?',
      choices: ['He agrees with it but still says no', 'He agrees with it and says he will go',
                'He agrees with it, then offers a later date'], a: 0,
      cue: '「A fair point」のあと、but で始まる文。',
      line: '*A fair point. But* we did just have lunch last week…',
      said: '「もっともだ。だが先週昼食をしたばかりだ」と言う。',
      mean: 'A fair point で相手の理由を認め、but のあとで断る。認めてから断る型。',
      trap: '「もっともだ」で行くと思いやすいが、認める一言のあとには but が来やすい。',
      use: 'Fair point. But I still can’t go.（もっともだ。でもやっぱり行けない）' },

    // C2: a plain-English paraphrase (cf. pr3)
    // anchor: 129.1–134.6 s "we did just have lunch last week, so… enough social time together for the foreseeable
    //   ever": "ever" takes the place of "future", so the limit runs on with no end
    // R fix: V2 (blind 60 %) — the key was the only two-sentence choice; all three now share "We've hung out enough."
    // why: next few weeks ← "the foreseeable" caught, "ever" lost: the set phrase's "near future" scope; plan ahead ←
    //   "foreseeable" heard as about planning, as if he wants more notice
    { id: 'c2', skill: 'infer', level: 'C2', point: 'foreseeable', reveals: ['fairpoint'], seg: [126.3, 135.6],
      stem: 'Which plain-English version keeps what Ron means about their social time?',
      choices: ['“We’ve hung out enough. Let’s not, ever again.”', '“We’ve hung out enough. Let’s wait a few weeks.”',
                '“We’ve hung out enough. Let’s plan further ahead.”'], a: 0,
      cue: 'foreseeable のあと、少し間を置いた最後の一語。',
      line: 'enough social time together *for the foreseeable ever*.',
      said: '「先週昼食したし、当分…いや永遠に、一緒の時間は十分」と言う。',
      mean: 'for the foreseeable future（当分）の future を ever に替え、「当分」を「永遠」まで伸ばしている。',
      trap: '決まり文句の前半だけで「当分」と取りやすい。最後の語が替わったら、そこが本音。',
      use: 'No more karaoke for the foreseeable ever.（カラオケは当分…いや永遠にいい）' },

    // R fix: K1 — the segment runs through "and he is named…" and a second voice's "Kyle" (whisper also has
    //   "Dennis"), so the laugh may land on the name as well; the key now covers both ("knows next to nothing")
    // why: more important ← "great friend" heard as an honor, puffing him up; wrong job ← "works in the building" heard
    //   as a mistake about him
    { id: 'h3', skill: 'humor', level: 'C1', point: 'kyle', seg: [154.5, 166.5],
      stem: 'Why does Ron’s introduction of his “great friend” get a laugh?',
      choices: ['He knows next to nothing about the man at all', 'He makes the man sound much more important',
                'He gets the man’s job wrong in front of him'], a: 0,
      cue: '「great friend」のあと、何を説明するか。',
      line: 'This is a *great friend* of mine. He is *a fellow who works in the building*, and he is named…',
      said: '「大の友人だ。この建物で働いている男で、名前は…」と紹介する。',
      mean: '大の友人と言いながら、知っているのは職場だけ。名前も言いよどむ。即席の「友人」。',
      trap: 'great friend をそのまま受け取ると、親しい紹介に聞こえる。中身の少なさが笑いの元。',
      use: 'This is a friend of mine from work.（職場の友だちです）' },

    // R fix: V2 (blind 70 %) — "too much work" was ruled out by the stem's "this time"; "Japan isn't his thing"
    //   (from “strongly enjoys Japanese culture”, said of the other man) replaces it
    // why: not his thing ← "Japanese culture" is said, as if Ron were excusing himself by it; tells him plainly ←
    //   Ron's usual bluntness ("I am not"), but here he says nothing of the kind
    { id: 'g2', skill: 'gist', level: 'B1', point: 'getrid', reveals: ['kyle'], seg: [154.5, 181.5],
      stem: 'How does Ron try to get out of the tea ceremony this time?',
      choices: ['He brings someone else to go with Chris', 'He says Japan just isn’t his kind of thing',
                'He tells Chris plainly to leave him alone'], a: 0,
      cue: '連れてきた人の紹介と、そのあとの一言。',
      line: 'I thought *he might want to go with you* to the thing.',
      said: 'ロンは職場の男を連れてきて、「彼が一緒に行きたいかと思って」と言う。',
      mean: '自分の代わりを用意して、誘いをかわそうとしている。',
      trap: 'Japanese culture が聞こえるので自分の好みの話に思えるが、それは連れてきた人の話。',
      use: 'Maybe he’d like to go with you.（彼なら一緒に行きたいかも）' },

    // R fix: V2 (blind 65 %) — "Ron upset him" answered a different question (K5); a second "Ron was right"
    //   reading (rice as proof) replaces it
    // why: really loves Japan ← "brother Japanophile?" from Chris, then a reply mentioning rice; even his lunch ←
    //   "I was eating rice" taken as evidence for the claim, not as all there is
    { id: 'i4', skill: 'infer', level: 'C1', point: 'rice', reveals: ['kyle'], seg: [173.0, 181.5],
      stem: 'What does the new man’s answer show about Ron’s claim?',
      choices: ['Ron made it up; eating rice is all there is', 'Ron was right; the man truly loves Japan',
                'Ron was right; even his lunch is Japanese'], a: 0,
      cue: 'Japanophile と聞かれたあと、何をしていたと言うか。',
      line: 'You’re a brother Japanophile? — *I was eating rice*, and Ron made me come up here.',
      said: '「日本好き仲間？」に「ご飯を食べてたら、ロンに連れてこられた」と答える。',
      mean: '日本とのつながりは、ご飯を食べていたことだけ。ロンの説明はその場の作り話。',
      trap: 'rice を日本好きの証拠と取りやすいが、ただ昼食中だっただけ。答えの中身を聞く。',
      use: 'I was just having lunch, but sure.（昼ごはん中だったけど、いいよ）' },

    // why: lonely ← Ron's own guess ("you seemed like you wanted a friend") and the friend's "misses his little buddy";
    //   budget help ← the first meeting, where Ron cut projects for him
    { id: 'g1', skill: 'gist', level: 'B2', point: 'tryout', seg: [185.3, 211.5],
      stem: 'Why has Chris been spending so much time with Ron?',
      choices: ['He was trying Ron out for a job', 'He was lonely and wanted a friend',
                'He wanted Ron’s help with the budget'], a: 0,
      cue: 'because のあと、理由の部分。',
      line: 'I have to *replace Ben* as assistant city manager, and I was giving you *a tryout of sorts*.',
      said: '「さみしくはない。ベンの後任を探していて、君を試していたんだ」と明かす。',
      mean: 'tryout ＝ 入団テストのような試し。食事や誘いは、全部その一部だった。',
      trap: 'ロンの「友だちが欲しいのか」が耳に残るが、本人は否定し、because のあとで理由を言う。',
      use: 'Think of it as a tryout.（お試しだと思って）' },
    // keep: ascending. why: 400 ← "four" caught, "thousand" lost; 14,000 ← "four" heard as "fourteen" (-teen);
    //   40,000 ← four/forty, -ty
    { id: 'n1', skill: 'number', level: 'B1', point: 'facebook', reveals: ['tryout'], seg: [193.0, 199.3], keep: true,
      stem: 'How many Facebook friends does Chris say he has?',
      choices: ['400', '4,000', '14,000', '40,000'], a: 1,
      cue: '「I have me」のあと、Facebook の前。',
      line: 'I’m not lonely. I have me. And *4,000 Facebook friends*…',
      said: '「さみしくない。自分がいるし、フェイスブックの友だちが4000人」。',
      mean: 'four thousand ＝ 4000。さみしくない証拠に数を挙げる。',
      trap: 'fourteen と forty は語尾で決まる。ここは four のすぐあとに thousand。',
      use: 'I have about 4,000 photos on my phone.（スマホに写真が4000枚くらい）' },

  ]
};
