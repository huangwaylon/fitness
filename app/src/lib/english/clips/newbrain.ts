// “Joey Gets a New Brain | Friends” (the official Friends channel, Best of Season 7): Joey tells his friends his soap
// character is coming out of his coma with a new brain, a dying character's; the friends mourn the actress, and one
// friend can't follow who Joey's character will be.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈93.2 s (whisper loops "I thought you
// were a scientist" from 93 s; the captions stop). Left out: 39.2–50 s, a sex jab ("three and a half months") and
// its reply; it holds the clip's only number, so there's no number item. Untested: 56.3–57.9 s (one "No!" in the
// captions, two in whisper), 68.3–69.0 s ("Don't do it" in whisper; the captions have only "it"); speakers other
// than Joey aren't named, so no item turns on who says what.
// EAR CHECK: 72.9 s s1 — "gonna" in whisper, "going to" in the captions (their usual expansion); the key "It's gonna"
//   only needs it not to be "gotta"
// REVIEW 2026-11-16: pass 4, fix 16, drop 0, new 0; ear checks 1
// OPEN: nt1 — rewritten once under the C2 rule; if a fresh reader with the transcript still says "the friend is slow",
//   drop it (the bank would keep one C2 item, nt2)
import type { Clip } from '../types.ts';

export const joeyBrain: Clip = {
  id: 'newbrain', video: '8LLOEdcSrSA', title: 'Joey Gets a New Brain', dur: 105, wpm: 171, band: 'fast',
  tags: ['友だち', '職場'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // why: fight scene ← "duel" (決闘) heard as a word, not a name; new show ← "writers" + an unknown title sounds
    //   like a project in the works
    // R fix: N1/S1: the word is DOOL (D-O-O-L, read as one word); whisper's "Duel" spelling had leaked into the stem
    //   and notes. The "duel" sound trap stays.
    { id: 'd2', skill: 'detail', level: 'B1', point: 'duel', seg: [0, 7],
      stem: 'What is the word Joey uses right before “writers”?',
      choices: ['A short name for the show he’s on', 'A fight scene he has to film soon',
                'A new show those writers are making'], a: 0,
      cue: '「What is …?」のすぐあとの答え。',
      line: 'one of the DOOL writers… — What is DOOL? — *Days of Our Lives*.',
      said: '「DOOL の脚本家と話して…」「DOOL って？」「Days of Our Lives」。',
      mean: '番組名の頭文字 D-O-O-L を一語で読んだ略し方。仲間内の呼び名。',
      trap: 'duel（決闘）と聞くと撮影の場面に思える。直後の答えが番組名そのもの。',
      use: 'Sorry, what does that stand for?（ごめん、それ何の略？）' },

    // R fix: V2 (blind 60 % and right): a second good-news distractor, so the mood alone doesn't give the key
    // why: complain ← the later "killing off" talk read back into his entrance; new show ← "talked to one of the
    //   … writers" heard as landing a part elsewhere
    { id: 'g2', skill: 'gist', level: 'B1', point: 'mood', seg: [0, 23.7],
      stem: 'Why has Joey come to see his friends?',
      choices: ['To share news about his character', 'To complain about a storyline he hates',
                'To tell them he’s landed a new show'], a: 0,
      cue: '最初の切り出し方と、そのあとの重ね方。',
      line: 'Anyway, *you’re not gonna believe it*… And *not only that*…',
      said: '「信じられないよ」と切り出し、「それだけじゃない」と、役の知らせを重ねる。',
      mean: 'どちらも良い知らせを盛り上げる言い方。うれしくて話しに来ている。',
      trap: 'あとで役が殺される話が出るので、不満を言いに来たと思いやすい。最初の言い方で気分が分かる。',
      use: 'You’re not gonna believe this!（ねえ、信じられないよ！）' },

    // R fix: V2 (blind 55 % and right): near misses on "coming" and "back"
    // why: going back into ← "coma" caught, "coming out" lost; coming back ← "coming" caught, "of his coma" heard as
    //   a return to the show
    { id: 'd3', skill: 'detail', level: 'B1', point: 'coma', seg: [7.5, 12.6],
      stem: 'What is Joey’s first piece of news about his character?',
      choices: ['He’s coming out of his coma', 'He’s going back into a coma', 'He’s coming back after a break'], a: 0,
      cue: '「My character is」のあと。',
      line: 'My character is *coming out of his coma*!',
      said: '「僕の役が、長い眠りから目を覚ますんだ！」と話す。',
      mean: 'come out of a coma ＝ 意識が戻る。come out of で「抜け出す」。',
      trap: 'coming だけ聞くと、これから入る話にも聞こえる。out of まで聞けば「出てくる」。',
      use: 'She’s finally coming out of her shell.（彼女、やっと打ち解けてきた）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'coma', seg: [7.5, 12.6],
      stem: 'Type what Joey says: “My character is ___ his coma!” (3 words)', answer: 'coming out of',
      cue: '「My character is」のあと、つながる3語。',
      line: 'My character is *coming out of* his coma!',
      said: '「僕の役が目を覚ますんだ！」と言う。3語がひと続き。',
      mean: 'out‿of が「アウタヴ」のようにつながり、of はほぼ「ア」。',
      trap: 'of が弱すぎて「coming out his」と書きやすい。come out のあとには of が来ると予想する。',
      use: 'I’m just coming out of a meeting.（ちょうど会議が終わったところ）' },

    // R fix: V2 (blind 70 % and right): all three choices are now jabs at Joey, so the "dumb Joey" shape doesn't pick it
    // why: love life ← "personal life" heard as dating; role and life ← "at work and in your personal life" read as
    //   "you live your role"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'personal', seg: [13.5, 23.7],
      stem: 'What is the joke in the friend’s “…and in your personal life”?',
      choices: ['Joey could use a new brain in real life, too', 'Joey’s love life could use some good news, too',
                'Joey talks as if his role were his real life'], a: 0,
      cue: '新しい脳の話に「私生活」を足した理由。',
      line: 'great things are happening at work *and in your personal life*.',
      said: '新しい脳と聞き、「仕事でも私生活でもいいことだね」と返す。',
      mean: '脳は役の話なのに私生活にも良いと言う。本人の頭も替えたら、という軽いからかい。',
      trap: 'personal life を恋人の話と取りやすいが、ほかに知らせはない。何が私生活に効くかを考える。',
      use: 'Well, that’s good news for everyone.（それはみんなにとって朗報だね）' },

    // R fix: V2 (blind 60 % and right): "a doctor" became a tense near miss on "when she dies"
    // why: died long ago ← "dies" caught without "when"; woke up ← the coma news just before
    { id: 'd4', skill: 'detail', level: 'B1', point: 'brain', reveals: ['killoff'], seg: [23.5, 32.5],
      stem: 'Where will Joey’s character get the new brain from?',
      choices: ['A character who’s about to die', 'A character who died long ago', 'A character who just woke up'],
      a: 0,
      cue: 'brain の出どころを言う部分。',
      line: 'when she dies, *her brain is being transplanted into my body*.',
      said: '「その役が死ぬと、脳が僕の体に移される」と説明する。',
      mean: 'transplant ＝ 移植。死ぬ役の脳を、ジョーイの役の体に移す筋書き。',
      trap: 'さっきの coma の話が残ると、目覚めた役と混ざりやすい。dies と her brain をつなげる。',
      use: 'He had a heart transplant last year.（彼は去年心臓移植を受けた）' },

    // R fix: V2 (blind 55 % and right): a "written out without dying" near miss replaces "fewer scenes"
    // why: new actress ← "one of the characters" taken as recasting (役を降ろす); sending her away ← "off" heard as
    //   "leaving", without "kill"
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'killoff', seg: [23.5, 32.5],
      stem: 'In Joey’s explanation, what is the show doing to one character?',
      choices: ['Writing her out by having her die', 'Giving her part to a different actress',
                'Writing her out by sending her away'], a: 0,
      cue: '「they’re」のすぐあとの2語。',
      line: 'they’re *killing off* one of the characters on the show',
      said: '「番組で登場人物を一人、死なせて降ろすんだ」と言う。',
      mean: 'kill off ＝ 物語の中で死なせて退場させる。off が「いなくなる」を足している。',
      trap: 'off だけ聞くと、旅立ちや俳優交代での退場にも取れる。kill が付けば死による退場。',
      use: 'They killed off my favorite character.（推しキャラが死んで退場した）' },

    // R fix: V2 (blind 50 % and right): "misheard" became a protest (the friend does call it ridiculous later)
    // why: protesting ← "What do you mean…?" read as a challenge (何言ってるの), and "ridiculous" comes soon after;
    //   teasing ← keyword trap from h1's line just before
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'whatmean', seg: [23.5, 32.5],
      stem: 'When a friend stops Joey with “Wait…”, what is the friend doing?',
      choices: ['Asking Joey how the brain part works', 'Protesting that the show has gone too far',
                'Teasing Joey that he needs a brain'], a: 0,
      cue: 'Wait のあと、何について聞き返すか。',
      line: '*Wait, what do you mean* you’re getting a new brain?',
      said: '「待って、新しい脳をもらうってどういうこと？」と聞き返す。',
      mean: '反論ではなく「詳しく説明して」。すぐジョーイが仕組みを話し始める。',
      trap: '「何言ってるの？」と否定に取りやすい。直後に相手が説明を始めたら、説明の求め。',
      use: 'Wait, what do you mean, “sold out”?（待って、売り切れってどういうこと？）' },

    // R fix: V2 (blind 50 % and right): two reactions that also fit "What? A brain transplant?"
    // why: great twist ← "What?" heard as a delighted gasp; creepy ← a brain transplant sounds gross, and the gasp
    //   fits that too
    { id: 'at1', skill: 'attitude', level: 'B1', point: 'ridiculous', seg: [32.5, 39.05],
      stem: 'What does the friend think of the brain transplant storyline?',
      choices: ['It’s silly and hard to believe', 'It’s shocking but a great twist', 'It’s creepy and a bit gross'],
      a: 0,
      cue: '「A brain transplant?」のあとのひと言。',
      line: 'What? A brain transplant? *It’s ridiculous.*',
      said: '「えっ、脳移植？ばかげてる」と言う。',
      mean: 'ridiculous ＝ ばかげている、ありえない。筋書きに本気であきれている。',
      trap: '驚きの What? だけで「すごい」と喜んだと取りやすい。続くひと言が評価。',
      use: 'That’s ridiculous. Who believes that?（ばかげてる、誰が信じるの）' },

    // R fix: V2 (blind 60 % and right): the role/actor reversal is now its own choice
    // why: the writer ← Joey "talked to one of the writers" at the start; the role Jessica plays ← two names in a
    //   row, with actor and role swapped
    { id: 'd5', skill: 'detail', level: 'B2', point: 'cecilia', seg: [51.5, 58.5],
      stem: 'Who is Cecilia Monroe?',
      choices: ['The actress who plays Jessica', 'The writer who told Joey the news', 'The role that Jessica plays'],
      a: 0,
      cue: '名前のあと、「She plays」に注目。',
      line: '*Cecilia Monroe. She plays Jessica Lockhart.*',
      said: '「誰が降ろされるの？」に「セシリア・モンロー。ジェシカ・ロックハート役の人」と答える。',
      mean: '俳優の名前と役の名前が別に出る。plays ＝ ～の役を演じる。',
      trap: '名前が2つ続くので、同じ人物と取りやすい。plays の前が俳優、後が役。',
      use: 'Who plays the mom in that show?（あの番組でお母さん役は誰？）' },

    // C2: exact words in fast speech (cf. h2)
    // anchor: 63.0–63.8 s six words in about 0.8 s, right after "I mean"; both sources have "I don't think I've ever
    //   seen", and "I've" shrinks to a v between "think" and "ever"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'ive', seg: [58.6, 65.3],
      stem: 'Type the fast stretch: “I mean, ___ her finish a beverage.” (6 words)',
      answer: "i don't think i've ever seen",
      cue: '「I mean」のあと、とても速い6語。',
      line: 'I mean, *I don’t think I’ve ever seen* her finish a beverage.',
      said: '「というか、飲み終えるのを見たことがないと思う」。6語が一息。',
      mean: 'I’ve は「アイv」と縮み、think と ever の間に埋もれる。6語を一つのかたまりで言う。',
      trap: '速さで I’ve を落とし「I ever seen」と書きやすい。don’t think のあとは完了形を予想する。',
      use: 'I don’t think I’ve ever been there.（あそこには行ったことがないと思う）' },

    // R fix: V2 (blind 65 % and right): parallel, equally specific reasons
    // why: busy with lines ← a chatty soap star; fakes it ← the real-world fact that actors fake drinking on set
    { id: 'h2', skill: 'humor', level: 'C1', point: 'drinks', reveals: ['ive'], seg: [58.6, 65.3],
      stem: 'What makes the friend’s remark about beverages funny?',
      choices: ['Every drink she holds ends up in someone’s face', 'She is too busy with her lines to ever drink',
                'She fakes drinking, as actors do on set'], a: 0,
      cue: '直前の「throwing drinks」とのつながり。',
      line: 'She is so good at *throwing drinks in people’s faces*. I mean, I don’t think I’ve ever seen her finish a beverage.',
      said: '「人の顔に飲み物をかけるのがうまい。飲み終えたのを見たことがない」と言う。',
      mean: '飲む前にいつもかけてしまうことを「飲み終えない」と遠回しに言う、大げさなほめ方。',
      trap: '演技で飲むふりをする話と取りやすい。前の文の throwing と結びつけて聞く。',
      use: 'She’s never once been on time.（彼女、一度も時間通りに来たことがない）' },

    // why: takes it back ← "I mean" taught as a self-correction (いや、つまり); new point ← a new sentence starts, so
    //   it sounds like a topic change
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['ive', 'drinks'], seg: [58.6, 65.3],
      stem: 'After praising her drink-throwing, how does the friend go on?',
      choices: ['Adds a funnier example to back it up', 'Takes it back and says it more fairly',
                'Moves on to a different point about her'], a: 0,
      cue: '「faces」のすぐあと、文頭の2語。',
      line: '…throwing drinks in people’s faces. *I mean*, I don’t think I’ve ever seen her finish a beverage.',
      said: '飲み物をかける話のあと、「ていうか」と続けて、さらに大げさに言う。',
      mean: 'ここの I mean は言い直しではなく「それどころか」と、強い例を足す働き。',
      trap: 'I mean を訂正と取りやすい。前の話を打ち消さず上乗せしていれば、強調。',
      use: 'He’s fast. I mean, really fast.（速いよ。いや、ほんとに速い）' },

    // R fix: V2 (blind 50 % and right): "secretly" marked the key; "too far" became the literal reading of "you"
    // why: acting ← a fan talking about a soap star sounds like wanting the role; the others ← "Wouldn't you love…"
    //   taken at face value, as a claim about the listeners
    { id: 'i2', skill: 'infer', level: 'C1', point: 'wouldnt', seg: [65.0, 69.6],
      stem: 'What does the question after the slapping line show about the speaker?',
      choices: ['The speaker would love to slap someone, too', 'The speaker would like to act on the show',
                'The speaker thinks the others want to slap people'], a: 0,
      cue: '「just once」で終わる質問の中身。',
      line: 'And the way she slaps people all the time. *Wouldn’t you love to do that just once?*',
      said: '「人をひっぱたくあの感じ。一度でいいからやってみたくない？」と聞く。',
      mean: '答えを求める質問ではなく「私はやってみたい」という本音の形。',
      trap: 'you を文字通り取ると相手の気持ちの話に聞こえる。Wouldn’t you love は自分の本音。',
      use: 'Wouldn’t you love a week off?（1週間休みたいと思わない？）' },

    // R fix: V2 (blind 70 % and right): "say goodbye" (the mourning mood) replaces the weak costume reading
    // why: say goodbye ← the "No!" mourning just before; end her story ← "hard to…" heard about the writers' job,
    //   after "killing off"
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'shoes', seg: [69.6, 76.45],
      stem: 'What worry comes right after “she’s been on the show forever”?',
      choices: ['It’ll be hard to replace her', 'It’ll be hard to say goodbye to her', 'It’ll be hard to end her story'],
      a: 0,
      cue: '「really hard to」のあとの3語。',
      line: 'she’s been on the show forever. It’s gonna be really hard to *fill her shoes*.',
      said: '「ずっと番組にいたから、後を継ぐのは大変だ」と言う。',
      mean: 'fill someone’s shoes ＝ その人の後を務める。靴に見合う人がいない、という比喩。',
      trap: '直前の No! から別れの悲しみと取りやすい。fill は「埋める」、後任の話。',
      use: 'Our old boss had big shoes to fill.（前の上司の後任は大変だった）' },

    // R fix: V1/V2 (blind 60 % and right): the gap sat inside the idiom, so knowing "fill her shoes" answered it.
    //   The gap now tests gonna vs gotta; new point, and it reveals `shoes` (its line holds ph2's idiom)
    // why: gotta ← the flapped t of "gotta" and the n of "gonna" sound alike at speed, and "It's gotta be hard" fits
    //   too; It'll ← only "it" and an l-like vowel are caught
    { id: 's1', skill: 'sound', level: 'B2', point: 'gonna', reveals: ['shoes'], seg: [69.6, 76.45],
      stem: 'Fill the gap: “___ be really hard to fill her shoes.”',
      choices: ['It’s gonna', 'It’s gotta', 'It’ll'], a: 0,
      cue: '文の頭、be の前の短い音。',
      line: 'she’s been on the show forever. *It’s gonna* be really hard to fill her shoes.',
      said: '長く出ていた女優の後任について、「後を継ぐのは大変になる」と言う。',
      mean: 'gonna ＝ going to。「～になるだろう」という見通し。弱く「ガナ」。',
      trap: 'gotta（～に違いない）は t が弾んで「ガラ」。鼻に抜ける n か、弾む音かを聞く。',
      use: 'It’s gonna be a long day.（長い一日になりそう）' },

    // R fix: V2 (blind 55 % and right): a second negative feeling, so "impatient" isn't the only edge
    // why: agreeing ← "yeah" read as agreement (そうそう), the Japanese 相づち frame; tired of Joey ← the impatience
    //   heard, but aimed at the wrong person (the actress talk isn't Joey's)
    { id: 'at3', skill: 'attitude', level: 'C1', point: 'yeahyeah', reveals: ['beher'], seg: [70.4, 85],
      stem: 'When a friend cuts in after “fill her shoes”, how does the friend sound?',
      choices: ['Impatient, and keen to get back to the point', 'Agreeing, and sad that she will be missed',
                'Annoyed, and tired of hearing Joey brag'], a: 0,
      cue: 'Yeah を2回重ねたあと、何の話に戻るか。',
      line: '*Yeah, yeah, well, help me out here.* When you come out of the brain transplant…',
      said: '「うん、うん。で、ちょっと教えて」と話を切り、脳移植の話に戻す。',
      mean: '速い Yeah, yeah は同意より「はいはい、それはいいから」。脱線を切り上げている。',
      trap: 'yeah を同意と取りやすい。2回重ねてすぐ話題を変えたら、聞き流しのサイン。',
      use: 'Yeah, yeah, okay. So what happened?（はいはい、で、どうなったの）' },

    // R fix: V2 (blind 65 % and right): "how long in the coma" became a job worry built on "killing off"
    // why: which character ← "Who are they killing off?" is also a question, but it's answered at once; keep Joey ←
    //   "killing off" heard as a threat to Joey's own part
    { id: 'g1', skill: 'gist', level: 'B2', point: 'getit', reveals: ['beher'], seg: [70.4, 93.6],
      stem: 'What part of Joey’s news does his friend keep failing to get?',
      choices: ['Who his character will be after the operation', 'Which character the show is going to kill off',
                'Whether the show will keep Joey’s character on'], a: 0,
      cue: '後半、「help me out here」のあとの質問。',
      line: 'When you come out of the brain transplant, *you are going to be her*?',
      said: '「脳移植のあと、君は彼女になるってこと？」と確かめる。',
      mean: '体はドレイク、中身は女性の役。「誰になるのか」がのみこめない。',
      trap: 'Who are they killing off? はすぐ答えが出て終わる。つまずきは help me out のあと。',
      use: 'Wait, so who are you playing now?（待って、じゃあ今は誰の役？）' },

    // why: Drake with memories ← "Drake Ramoray's body" is the last thing heard; someone new ← "new brain" taken as a
    //   new character altogether
    { id: 'i1', skill: 'infer', level: 'B2', point: 'beher', seg: [74.86, 87.8],
      stem: 'From Joey’s answer, who will his character be after the transplant?',
      choices: ['Jessica, living on inside Drake’s body', 'Drake, with a few of Jessica’s memories',
                'Someone new, with a brand-new name'], a: 0,
      cue: '「Yes」のあと、but 以下。',
      line: 'you are going to be her? — *Yes, but in Drake Ramoray’s body.*',
      said: '「君は彼女になるの？」に「そう、でもドレイクの体でね」と答える。',
      mean: '中身はジェシカ、体はジョーイの役ドレイク。but で体の話を足している。',
      trap: 'Drake の名前が最後に残るので、ドレイクのままと取りやすい。答えの最初は Yes。',
      use: 'Yes, but only on weekends.（うん、でも週末だけね）' },

    // C2: who is the joke on?
    // anchor: 82.3–87.3 s "you are going to be her? — Yes, but in Drake Ramoray's body": a sensible question gets more
    //   soap logic; 91.0–93.2 s "Why is it so hard for you to get? I thought you were a scientist": Joey calls on the
    //   friend's science as if it backed a brain swap, when science is exactly what makes the plot hard to swallow
    // R fix (C2 one rewrite): a cold read missed the key; "who is the joke on" let Joey's own framing (the friend is
    //   slow) pass as a second answer. Now asks why the line gets a laugh, with parallel reasons.
    // why: slow friend ← Joey's own framing (he's the one mocking the friend as slow); scientists and TV ← scope
    //   shift from this one friend to scientists in general
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'scientist', seg: [80.9, 93.6],
      stem: 'Why does Joey’s “I thought you were a scientist” get a laugh?',
      choices: ['A scientist is exactly who’d find the plot absurd', 'His friend has been too slow to follow the plot',
                'Scientists are known for not keeping up with TV'], a: 0,
      cue: '科学者なら、脳移植の筋書きをどう思うか。',
      line: 'Why is it so hard for you to get? *I thought you were a scientist.*',
      said: '「なんでそんなに分からないの？科学者だと思ってたのに」と、ジョーイがあきれる。',
      mean: '科学者だからこそ脳移植の筋書きがのみこめない。科学を味方につけたつもりの本人が笑われている。',
      trap: '相手の物分かりの悪さを笑う場面に聞こえやすい。言った本人の理屈がずれていないかを聞く。',
      use: 'And you call yourself a doctor?（それでも医者なの？）' }
  ]
};
